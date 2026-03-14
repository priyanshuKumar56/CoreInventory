const { query, withTransaction } = require('../config/db');

// GET /api/deliveries
exports.getDeliveries = async (req, res, next) => {
  try {
    const { status, warehouse_id, search, page = 1, limit = 20 } = req.query;
    const today = new Date().toISOString().split('T')[0];

    let where = 'WHERE 1=1';
    const params = [];
    let idx = 1;

    if (status && status !== 'all') {
      if (status === 'late') {
        where += ` AND d.status NOT IN ('done','cancelled') AND d.scheduled_date < $${idx++}`;
        params.push(today);
      } else {
        where += ` AND d.status = $${idx++}`;
        params.push(status);
      }
    }
    if (warehouse_id) { where += ` AND d.warehouse_id = $${idx++}`; params.push(warehouse_id); }
    if (search) {
      where += ` AND (d.reference ILIKE $${idx} OR c.name ILIKE $${idx})`;
      params.push(`%${search}%`); idx++;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const result = await query(`
      SELECT
        d.id, d.reference, d.status, d.scheduled_date, d.created_at, d.validated_at,
        c.name AS contact_name, w.name AS warehouse_name, w.code AS warehouse_code,
        l.name AS source_name,
        u.name AS responsible_name,
        CASE
          WHEN d.status NOT IN ('done','cancelled') AND d.scheduled_date < CURRENT_DATE THEN 'late'
          ELSE d.status::text
        END AS display_status,
        (SELECT COUNT(*) FROM delivery_items di WHERE di.delivery_id = d.id) AS item_count,
        (SELECT SUM(di.quantity) FROM delivery_items di WHERE di.delivery_id = d.id) AS total_qty
      FROM deliveries d
      LEFT JOIN contacts c ON c.id = d.contact_id
      LEFT JOIN warehouses w ON w.id = d.warehouse_id
      LEFT JOIN locations l ON l.id = d.source_id
      LEFT JOIN users u ON u.id = d.responsible_id
      ${where}
      ORDER BY d.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `, params);

    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

// GET /api/deliveries/:id
exports.getDeliveryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const dRes = await query(`
      SELECT d.*, c.name AS contact_name, c.phone AS contact_phone,
        w.name AS warehouse_name, w.code AS warehouse_code,
        l.name AS source_name, u.name AS responsible_name,
        CASE WHEN d.status NOT IN ('done','cancelled') AND d.scheduled_date < CURRENT_DATE THEN 'late'
        ELSE d.status::text END AS display_status
      FROM deliveries d
      LEFT JOIN contacts c ON c.id = d.contact_id
      LEFT JOIN warehouses w ON w.id = d.warehouse_id
      LEFT JOIN locations l ON l.id = d.source_id
      LEFT JOIN users u ON u.id = d.responsible_id
      WHERE d.id = $1
    `, [id]);

    if (!dRes.rows.length) return res.status(404).json({ success: false, message: 'Delivery not found' });

    const itemsRes = await query(`
      SELECT di.*, p.name AS product_name, p.sku, p.unit_of_measure
      FROM delivery_items di
      JOIN products p ON p.id = di.product_id
      WHERE di.delivery_id = $1
    `, [id]);

    res.json({ success: true, data: { ...dRes.rows[0], items: itemsRes.rows } });
  } catch (err) { next(err); }
};

// POST /api/deliveries
exports.createDelivery = async (req, res, next) => {
  try {
    const { warehouse_id, contact_id, source_id, scheduled_date, notes, items = [] } = req.body;

    const result = await withTransaction(async (client) => {
      const whRes = await client.query('SELECT code FROM warehouses WHERE id = $1', [warehouse_id]);
      if (!whRes.rows.length) throw Object.assign(new Error('Warehouse not found'), { status: 404 });

      const refRes = await client.query('SELECT generate_reference($1,$2,$3) AS ref', [whRes.rows[0].code, 'OUT', warehouse_id]);

      const dRes = await client.query(`
        INSERT INTO deliveries (reference, warehouse_id, contact_id, source_id, status, scheduled_date, notes, responsible_id, created_by)
        VALUES ($1,$2,$3,$4,'draft',$5,$6,$7,$7) RETURNING *
      `, [refRes.rows[0].ref, warehouse_id, contact_id || null, source_id || null, scheduled_date || null, notes || null, req.user.id]);

      for (const item of items) {
        await client.query(
          'INSERT INTO delivery_items (delivery_id, product_id, quantity, unit_price) VALUES ($1,$2,$3,$4)',
          [dRes.rows[0].id, item.product_id, item.quantity, item.unit_price || 0]
        );
      }
      return dRes.rows[0];
    });

    res.status(201).json({ success: true, message: 'Delivery order created', data: result });
  } catch (err) { next(err); }
};

// POST /api/deliveries/:id/action
exports.deliveryAction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    const dRes = await query('SELECT * FROM deliveries WHERE id = $1', [id]);
    if (!dRes.rows.length) return res.status(404).json({ success: false, message: 'Delivery not found' });

    const delivery = dRes.rows[0];
    const transitions = {
      confirm: { from: ['draft'], to: 'ready' },
      validate: { from: ['ready', 'waiting'], to: 'done' },
      cancel: { from: ['draft', 'ready', 'waiting'], to: 'cancelled' },
    };

    const t = transitions[action];
    if (!t) return res.status(400).json({ success: false, message: 'Invalid action' });
    if (!t.from.includes(delivery.status)) {
      return res.status(400).json({ success: false, message: `Cannot ${action} delivery in ${delivery.status} state` });
    }

    if (action === 'validate') {
      await withTransaction(async (client) => {
        const items = await client.query('SELECT product_id, quantity FROM delivery_items WHERE delivery_id = $1', [id]);
        if (!items.rows.length) throw Object.assign(new Error('No items to deliver'), { status: 400 });

        for (const item of items.rows) {
          // Check stock
          const stockRes = await client.query(
            'SELECT quantity FROM stock WHERE product_id = $1 AND location_id = $2',
            [item.product_id, delivery.source_id]
          );
          const available = parseFloat(stockRes.rows[0]?.quantity || 0);
          if (available < parseFloat(item.quantity)) {
            const pRes = await client.query('SELECT name FROM products WHERE id = $1', [item.product_id]);
            throw Object.assign(
              new Error(`Insufficient stock for ${pRes.rows[0]?.name}. Available: ${available}`),
              { status: 400 }
            );
          }

          await client.query('SELECT update_stock($1, $2, $3)', [item.product_id, delivery.source_id, -item.quantity]);
          await client.query(`
            INSERT INTO stock_moves (product_id, from_location_id, quantity, move_type, reference, created_by)
            VALUES ($1,$2,$3,'delivery',$4,$5)
          `, [item.product_id, delivery.source_id, item.quantity, delivery.reference, req.user.id]);
          await client.query('UPDATE delivery_items SET done_qty = quantity WHERE delivery_id = $1 AND product_id = $2', [id, item.product_id]);
        }

        await client.query("UPDATE deliveries SET status = 'done', validated_at = NOW() WHERE id = $1", [id]);
      });
    } else {
      await query('UPDATE deliveries SET status = $1 WHERE id = $2', [t.to, id]);
    }

    res.json({ success: true, message: `Delivery ${action}d successfully`, data: { status: t.to } });
  } catch (err) { next(err); }
};

// PUT /api/deliveries/:id
exports.updateDelivery = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { contact_id, source_id, scheduled_date, notes, items } = req.body;
    const r = await query('SELECT status FROM deliveries WHERE id = $1', [id]);
    if (!r.rows.length) return res.status(404).json({ success: false, message: 'Not found' });
    if (r.rows[0].status === 'done') return res.status(400).json({ success: false, message: 'Cannot edit validated delivery' });

    await withTransaction(async (client) => {
      await client.query(`UPDATE deliveries SET contact_id=COALESCE($1,contact_id), source_id=COALESCE($2,source_id), scheduled_date=COALESCE($3,scheduled_date), notes=COALESCE($4,notes) WHERE id=$5`,
        [contact_id, source_id, scheduled_date, notes, id]);
      if (items) {
        await client.query('DELETE FROM delivery_items WHERE delivery_id = $1', [id]);
        for (const item of items) {
          await client.query('INSERT INTO delivery_items (delivery_id,product_id,quantity,unit_price) VALUES ($1,$2,$3,$4)',
            [id, item.product_id, item.quantity, item.unit_price || 0]);
        }
      }
    });

    res.json({ success: true, message: 'Delivery updated' });
  } catch (err) { next(err); }
};
