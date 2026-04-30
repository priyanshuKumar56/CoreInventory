// ============================================================
// TRANSFERS CONTROLLER
// ============================================================
const { query, withTransaction } = require('../config/db');
const { auditLog } = require('../utils/audit');

exports.getTransfers = async (req, res, next) => {
  try {
    const { status, warehouse_id, page = 1, limit = 20 } = req.query;
    let where = 'WHERE 1=1';
    const params = [];
    let idx = 1;
    if (status && status !== 'all') { where += ` AND t.status = $${idx++}`; params.push(status); }
    if (warehouse_id) { where += ` AND t.warehouse_id = $${idx++}`; params.push(warehouse_id); }
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const result = await query(`
      SELECT t.id, t.reference, t.status, t.scheduled_date, t.created_at, t.validated_at,
        w.name AS warehouse_name, w.code AS warehouse_code,
        fl.name AS from_location_name, tl.name AS to_location_name,
        u.name AS responsible_name,
        (SELECT COUNT(*) FROM transfer_items ti WHERE ti.transfer_id = t.id) AS item_count
      FROM transfers t
      LEFT JOIN warehouses w ON w.id = t.warehouse_id
      LEFT JOIN locations fl ON fl.id = t.from_location_id
      LEFT JOIN locations tl ON tl.id = t.to_location_id
      LEFT JOIN users u ON u.id = t.responsible_id
      ${where}
      ORDER BY t.created_at DESC LIMIT $${idx++} OFFSET $${idx++}
    `, params);

    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

exports.getTransferById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tRes = await query(`
      SELECT t.*, w.name AS warehouse_name, w.code AS warehouse_code,
        fl.name AS from_location_name, tl.name AS to_location_name,
        u.name AS responsible_name
      FROM transfers t
      LEFT JOIN warehouses w ON w.id = t.warehouse_id
      LEFT JOIN locations fl ON fl.id = t.from_location_id
      LEFT JOIN locations tl ON tl.id = t.to_location_id
      LEFT JOIN users u ON u.id = t.responsible_id
      WHERE t.id = $1
    `, [id]);
    if (!tRes.rows.length) return res.status(404).json({ success: false, message: 'Transfer not found' });

    const itemsRes = await query(`
      SELECT ti.*, p.name AS product_name, p.sku, p.unit_of_measure
      FROM transfer_items ti JOIN products p ON p.id = ti.product_id
      WHERE ti.transfer_id = $1
    `, [id]);

    res.json({ success: true, data: { ...tRes.rows[0], items: itemsRes.rows } });
  } catch (err) { next(err); }
};

exports.createTransfer = async (req, res, next) => {
  try {
    const { warehouse_id, from_location_id, to_location_id, scheduled_date, notes, items = [] } = req.body;
    if (from_location_id === to_location_id) {
      return res.status(400).json({ success: false, message: 'Source and destination cannot be same' });
    }

    const result = await withTransaction(async (client) => {
      const whRes = await client.query('SELECT code FROM warehouses WHERE id = $1', [warehouse_id]);
      const refRes = await client.query('SELECT generate_reference($1,$2,$3) AS ref', [whRes.rows[0].code, 'TR', warehouse_id]);
      const tRes = await client.query(`
        INSERT INTO transfers (reference, warehouse_id, from_location_id, to_location_id, status, scheduled_date, notes, responsible_id, created_by)
        VALUES ($1,$2,$3,$4,'draft',$5,$6,$7,$7) RETURNING *
      `, [refRes.rows[0].ref, warehouse_id, from_location_id, to_location_id, scheduled_date || null, notes || null, req.user.id]);

      for (const item of items) {
        await client.query('INSERT INTO transfer_items (transfer_id, product_id, quantity) VALUES ($1,$2,$3)',
          [tRes.rows[0].id, item.product_id, item.quantity]);
      }
      return tRes.rows[0];
    });

    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
};

exports.transferAction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    const tRes = await query('SELECT * FROM transfers WHERE id = $1', [id]);
    if (!tRes.rows.length) return res.status(404).json({ success: false, message: 'Transfer not found' });
    const transfer = tRes.rows[0];
    const transitions = {
      confirm: { from: ['draft'], to: 'ready' },
      validate: { from: ['ready'], to: 'done' },
      cancel: { from: ['draft', 'ready'], to: 'cancelled' },
    };
    const t = transitions[action];
    if (!t || !t.from.includes(transfer.status)) {
      return res.status(400).json({ success: false, message: `Cannot ${action} transfer in ${transfer.status} state` });
    }

    if (action === 'validate') {
      await withTransaction(async (client) => {
        const items = await client.query('SELECT product_id, quantity FROM transfer_items WHERE transfer_id = $1', [id]);
        for (const item of items.rows) {
          await client.query('SELECT update_stock($1,$2,$3)', [item.product_id, transfer.from_location_id, -item.quantity]);
          await client.query('SELECT update_stock($1,$2,$3)', [item.product_id, transfer.to_location_id, item.quantity]);
          await client.query(`INSERT INTO stock_moves (product_id, from_location_id, to_location_id, quantity, move_type, reference, created_by)
            VALUES ($1,$2,$3,$4,'transfer',$5,$6)`,
            [item.product_id, transfer.from_location_id, transfer.to_location_id, item.quantity, transfer.reference, req.user.id]);
          await client.query('UPDATE transfer_items SET done_qty = quantity WHERE transfer_id = $1', [id]);
        }
        await client.query("UPDATE transfers SET status='done', validated_at=NOW() WHERE id=$1", [id]);
      });
    } else {
      await query('UPDATE transfers SET status=$1 WHERE id=$2', [t.to, id]);
    }

    res.json({ success: true, message: `Transfer ${action}d`, data: { status: t.to } });
  } catch (err) { next(err); }
};

// ============================================================
// ADJUSTMENTS CONTROLLER
// ============================================================
exports.getAdjustments = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT a.id, a.reference, a.status, a.reason, a.created_at, a.validated_at,
        w.name AS warehouse_name, l.name AS location_name, u.name AS responsible_name,
        (SELECT COUNT(*) FROM adjustment_items ai WHERE ai.adjustment_id = a.id) AS item_count
      FROM adjustments a
      LEFT JOIN warehouses w ON w.id = a.warehouse_id
      LEFT JOIN locations l ON l.id = a.location_id
      LEFT JOIN users u ON u.id = a.responsible_id
      ORDER BY a.created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

exports.getAdjustmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const aRes = await query(`
      SELECT a.*,
        w.name AS warehouse_name, l.name AS location_name, u.name AS responsible_name
      FROM adjustments a
      LEFT JOIN warehouses w ON w.id = a.warehouse_id
      LEFT JOIN locations l ON l.id = a.location_id
      LEFT JOIN users u ON u.id = a.responsible_id
      WHERE a.id = $1
    `, [id]);
    if (!aRes.rows.length) return res.status(404).json({ success: false, message: 'Adjustment not found' });

    const itemsRes = await query(`
      SELECT ai.*, p.name AS product_name, p.sku, p.unit_of_measure,
             l.name as location_name
      FROM adjustment_items ai 
      JOIN products p ON p.id = ai.product_id
      LEFT JOIN locations l ON l.id = ai.location_id
      WHERE ai.adjustment_id = $1
    `, [id]);

    res.json({ success: true, data: { ...aRes.rows[0], items: itemsRes.rows } });
  } catch (err) { next(err); }
};

exports.createAdjustment = async (req, res, next) => {
  try {
    const { warehouse_id, location_id, reason, items = [] } = req.body;
    const result = await withTransaction(async (client) => {
      const whRes = await client.query('SELECT code FROM warehouses WHERE id = $1', [warehouse_id]);
      const refRes = await client.query('SELECT generate_reference($1,$2,$3) AS ref', [whRes.rows[0].code, 'ADJ', warehouse_id]);
      const aRes = await client.query(`
        INSERT INTO adjustments (reference, warehouse_id, location_id, status, reason, responsible_id, created_by)
        VALUES ($1,$2,$3,'draft',$4,$5,$5) RETURNING *
      `, [refRes.rows[0].ref, warehouse_id, location_id || null, reason || null, req.user.id]);

      for (const item of items) {
        const stockRes = await client.query(
          'SELECT COALESCE(quantity, 0) AS qty FROM stock WHERE product_id=$1 AND location_id=$2',
          [item.product_id, item.location_id || location_id]
        );
        const theoretical = parseFloat(stockRes.rows[0]?.qty || 0);
        await client.query(`INSERT INTO adjustment_items (adjustment_id, product_id, location_id, theoretical_qty, counted_qty)
          VALUES ($1,$2,$3,$4,$5)`,
          [aRes.rows[0].id, item.product_id, item.location_id || location_id, theoretical, item.counted_qty]);
      }
      return aRes.rows[0];
    });

    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
};

exports.validateAdjustment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const aRes = await query('SELECT * FROM adjustments WHERE id = $1', [id]);
    if (!aRes.rows.length) return res.status(404).json({ success: false, message: 'Not found' });
    if (aRes.rows[0].status !== 'draft') return res.status(400).json({ success: false, message: 'Already validated' });

    await withTransaction(async (client) => {
      const items = await client.query('SELECT * FROM adjustment_items WHERE adjustment_id=$1', [id]);
      for (const item of items.rows) {
        const diff = parseFloat(item.difference);
        if (diff !== 0) {
          await client.query('SELECT update_stock($1,$2,$3)', [item.product_id, item.location_id, diff]);
          await client.query(`INSERT INTO stock_moves (product_id, from_location_id, to_location_id, quantity, move_type, reference, notes, created_by)
            VALUES ($1, $2, $3, $4, 'adjustment', $5, $6, $7)`,
            [item.product_id,
              diff < 0 ? item.location_id : null,
              diff > 0 ? item.location_id : null,
              Math.abs(diff), aRes.rows[0].reference,
              aRes.rows[0].reason, req.user.id]);
        }
      }
      await client.query("UPDATE adjustments SET status='done', validated_at=NOW() WHERE id=$1", [id]);
    });

    res.json({ success: true, message: 'Adjustment validated. Stock updated.' });
  } catch (err) { next(err); }
};

// ============================================================
// STOCK CONTROLLER
// ============================================================
exports.getStockOverview = async (req, res, next) => {
  try {
    const { warehouse_id, search, low_stock, page = 1, limit = 50 } = req.query;
    let where = 'WHERE p.is_active = true';
    const params = [];
    let idx = 1;
    if (search) { where += ` AND (p.name ILIKE $${idx} OR p.sku ILIKE $${idx})`; params.push(`%${search}%`); idx++; }
    if (warehouse_id) { where += ` AND w.id = $${idx++}`; params.push(warehouse_id); }

    const having = low_stock === 'true' ? 'HAVING COALESCE(SUM(s.quantity),0) <= p.reorder_point' : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const countParams = [...params];

    params.push(parseInt(limit), offset);

    const [result, countRes] = await Promise.all([
      query(`
        SELECT
          p.id, p.name, p.sku, p.unit_of_measure, p.reorder_point, p.cost_price, p.sale_price,
          pc.name AS category_name,
          COALESCE(SUM(s.quantity), 0) AS total_quantity,
          json_agg(json_build_object(
            'location_id', l.id,
            'location_name', l.name,
            'location_code', l.code,
            'warehouse_id', w.id,
            'warehouse_name', w.name,
            'warehouse_code', w.code,
            'quantity', COALESCE(s.quantity, 0)
          ) ORDER BY w.name, l.name) FILTER (WHERE l.id IS NOT NULL) AS locations
        FROM products p
        LEFT JOIN product_categories pc ON pc.id = p.category_id
        LEFT JOIN stock s ON s.product_id = p.id
        LEFT JOIN locations l ON l.id = s.location_id
        LEFT JOIN warehouses w ON w.id = l.warehouse_id
        ${where}
        GROUP BY p.id, p.name, p.sku, p.unit_of_measure, p.reorder_point, p.cost_price, p.sale_price, pc.name
        ${having}
        ORDER BY p.name
        LIMIT $${idx++} OFFSET $${idx++}
      `, params),

      query(`
        SELECT COUNT(*) FROM (
          SELECT p.id
          FROM products p
          LEFT JOIN stock s ON s.product_id = p.id
          LEFT JOIN locations l ON l.id = s.location_id
          LEFT JOIN warehouses w ON w.id = l.warehouse_id
          ${where}
          GROUP BY p.id, p.reorder_point
          ${having}
        ) sub
      `, countParams),
    ]);

    const total = parseInt(countRes.rows[0].count);
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) { next(err); }
};

exports.exportInventory = async (req, res, next) => {
  try {
    const celery = require('../utils/celery');
    const task = celery.createTask('worker.generate_inventory_export');
    const result = task.applyAsync([req.user.id, 'csv']);
    res.json({ success: true, message: 'Export task queued successfully', job_id: result.taskId });
  } catch (err) { next(err); }
};

exports.predictRestock = async (req, res, next) => {
  try {
    const celery = require('../utils/celery');
    const task = celery.createTask('worker.predict_restock_levels');
    const result = task.applyAsync([]);
    res.json({ success: true, message: 'AI Restock Prediction queued', job_id: result.taskId });
  } catch (err) { next(err); }
};

exports.getMoveHistory = async (req, res, next) => {
  try {
    const { move_type, product_id, from_date, to_date, page = 1, limit = 30 } = req.query;
    let where = 'WHERE 1=1';
    const params = [];
    let idx = 1;
    if (move_type) { where += ` AND sm.move_type = $${idx++}`; params.push(move_type); }
    if (product_id) { where += ` AND sm.product_id = $${idx++}`; params.push(product_id); }
    if (from_date) { where += ` AND sm.created_at >= $${idx++}`; params.push(from_date); }
    if (to_date) { where += ` AND sm.created_at <= $${idx++}`; params.push(to_date + ' 23:59:59'); }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const result = await query(`
      SELECT sm.id, sm.move_type, sm.quantity, sm.reference, sm.notes, sm.created_at,
        p.name AS product_name, p.sku, p.unit_of_measure,
        fl.name AS from_location, fl.code AS from_code,
        tl.name AS to_location, tl.code AS to_code,
        u.name AS created_by_name
      FROM stock_moves sm
      JOIN products p ON p.id = sm.product_id
      LEFT JOIN locations fl ON fl.id = sm.from_location_id
      LEFT JOIN locations tl ON tl.id = sm.to_location_id
      LEFT JOIN users u ON u.id = sm.created_by
      ${where}
      ORDER BY sm.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `, params);

    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

// ============================================================
// PRODUCTS CONTROLLER
// ============================================================
exports.getProducts = async (req, res, next) => {
  try {
    const { category_id, search, is_active = 'true', page = 1, limit = 50 } = req.query;
    let where = `WHERE p.is_active = ${is_active === 'true'}`;
    const params = [];
    let idx = 1;
    if (category_id) { where += ` AND p.category_id = $${idx++}`; params.push(category_id); }
    if (search) { where += ` AND (p.name ILIKE $${idx} OR p.sku ILIKE $${idx} OR p.barcode ILIKE $${idx})`; params.push(`%${search}%`); idx++; }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const result = await query(`
      SELECT p.*, pc.name AS category_name,
        COALESCE((SELECT SUM(s.quantity) FROM stock s WHERE s.product_id = p.id), 0) AS total_stock
      FROM products p
      LEFT JOIN product_categories pc ON pc.id = p.category_id
      ${where}
      ORDER BY p.name
      LIMIT $${idx++} OFFSET $${idx++}
    `, params);

    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pRes = await query(`
      SELECT p.*, pc.name AS category_name,
        COALESCE((SELECT SUM(s.quantity) FROM stock s WHERE s.product_id = p.id), 0) AS total_stock
      FROM products p LEFT JOIN product_categories pc ON pc.id = p.category_id WHERE p.id = $1
    `, [id]);
    if (!pRes.rows.length) return res.status(404).json({ success: false, message: 'Product not found' });

    const stockRes = await query(`
      SELECT s.quantity, l.name AS location_name, l.code AS location_code, w.name AS warehouse_name, w.code AS warehouse_code
      FROM stock s JOIN locations l ON l.id = s.location_id JOIN warehouses w ON w.id = l.warehouse_id
      WHERE s.product_id = $1 ORDER BY s.quantity DESC
    `, [id]);

    const movesRes = await query(`
      SELECT sm.move_type, sm.quantity, sm.reference, sm.created_at,
        fl.name AS from_location, tl.name AS to_location
      FROM stock_moves sm
      LEFT JOIN locations fl ON fl.id = sm.from_location_id
      LEFT JOIN locations tl ON tl.id = sm.to_location_id
      WHERE sm.product_id = $1 ORDER BY sm.created_at DESC LIMIT 10
    `, [id]);

    res.json({ success: true, data: { ...pRes.rows[0], stock_breakdown: stockRes.rows, recent_moves: movesRes.rows } });
  } catch (err) { next(err); }
};

exports.createProduct = async (req, res, next) => {
  try {
    const { name, sku, description, category_id, unit_of_measure, reorder_point, initial_stock, cost_price, sale_price, barcode, type } = req.body;
    const result = await query(`
      INSERT INTO products (name, sku, description, category_id, unit_of_measure, reorder_point, initial_stock, cost_price, sale_price, barcode, type, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *
    `, [name, sku, description, category_id, unit_of_measure || 'pcs', reorder_point || 0, initial_stock || 0, cost_price || 0, sale_price || 0, barcode, type || 'storable', req.user.id]);
    await auditLog(req, 'product.create', 'product', result.rows[0].id, null, result.rows[0]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, category_id, unit_of_measure, reorder_point, cost_price, sale_price, barcode, type, is_active } = req.body;
    const result = await query(`
      UPDATE products SET
        name = COALESCE($1, name), description = COALESCE($2, description),
        category_id = COALESCE($3, category_id), unit_of_measure = COALESCE($4, unit_of_measure),
        reorder_point = COALESCE($5, reorder_point), cost_price = COALESCE($6, cost_price),
        sale_price = COALESCE($7, sale_price), barcode = COALESCE($8, barcode),
        type = COALESCE($9, type), is_active = COALESCE($10, is_active)
      WHERE id = $11 RETURNING *
    `, [name, description, category_id, unit_of_measure, reorder_point, cost_price, sale_price, barcode, type, is_active, id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Product not found' });
    await auditLog(req, 'product.update', 'product', id, null, req.body);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

exports.getCategories = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM product_categories ORDER BY name');
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const result = await query('INSERT INTO product_categories (name, description) VALUES ($1,$2) RETURNING *', [name, description]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

// ============================================================
// WAREHOUSES CONTROLLER
// ============================================================
exports.getWarehouses = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT w.*, u.name AS created_by_name,
        (SELECT COUNT(*) FROM locations l WHERE l.warehouse_id = w.id) AS location_count
      FROM warehouses w LEFT JOIN users u ON u.id = w.created_by
      WHERE w.is_active = true ORDER BY w.name
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

exports.createWarehouse = async (req, res, next) => {
  try {
    const { name, code, address, city, country } = req.body;
    const result = await withTransaction(async (client) => {
      const wRes = await client.query(
        'INSERT INTO warehouses (name, code, address, city, country, created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
        [name, code.toUpperCase(), address, city, country || 'India', req.user.id]
      );
      // Default locations
      const defaultLocs = [['Stock Area 1','STOCK1'], ['Rack A','RACKA'], ['Dispatch Zone','DISPATCH']];
      for (const [lname, lcode] of defaultLocs) {
        await client.query('INSERT INTO locations (name, code, warehouse_id) VALUES ($1,$2,$3)', [lname, lcode, wRes.rows[0].id]);
      }
      await client.query('INSERT INTO sequence_counters (warehouse_id,operation,last_value) VALUES ($1,\'IN\',0),($1,\'OUT\',0),($1,\'TR\',0),($1,\'ADJ\',0)', [wRes.rows[0].id]);
      return wRes.rows[0];
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
};

exports.getLocations = async (req, res, next) => {
  try {
    const { warehouse_id } = req.query;
    let where = 'WHERE l.is_active = true';
    const params = [];
    if (warehouse_id) { where += ' AND l.warehouse_id = $1'; params.push(warehouse_id); }
    const result = await query(`
      SELECT l.*, w.name AS warehouse_name, w.code AS warehouse_code
      FROM locations l JOIN warehouses w ON w.id = l.warehouse_id
      ${where} ORDER BY w.name, l.name
    `, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

exports.createLocation = async (req, res, next) => {
  try {
    const { name, code, warehouse_id, parent_id } = req.body;
    const result = await query(
      'INSERT INTO locations (name, code, warehouse_id, parent_id) VALUES ($1,$2,$3,$4) RETURNING *',
      [name, code.toUpperCase(), warehouse_id, parent_id || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

exports.getContacts = async (req, res, next) => {
  try {
    const { type, search } = req.query;
    let where = 'WHERE is_active = true';
    const params = [];
    let idx = 1;
    if (type) { where += ` AND (type = $${idx} OR type = 'both')`; params.push(type); idx++; }
    if (search) { where += ` AND name ILIKE $${idx++}`; params.push(`%${search}%`); }
    const result = await query(`SELECT * FROM contacts ${where} ORDER BY name`, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

exports.createContact = async (req, res, next) => {
  try {
    const { name, type, email, phone, address, gstin } = req.body;
    const result = await query(
      'INSERT INTO contacts (name, type, email, phone, address, gstin) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [name, type || 'vendor', email, phone, address, gstin]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

exports.getUsers = async (req, res, next) => {
  try {
    const result = await query('SELECT id, name, email, role, is_active, last_login, created_at FROM users ORDER BY name');
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    const result = await query('UPDATE users SET name=$1 WHERE id=$2 RETURNING id, name, email, role', [name, req.user.id]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};
