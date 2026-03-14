const { query, withTransaction } = require('../config/db');

const buildStatus = (receipt) => {
  const today = new Date().toISOString().split('T')[0];
  if (['done', 'cancelled'].includes(receipt.status)) return receipt.status;
  if (receipt.scheduled_date && receipt.scheduled_date.toISOString?.().split('T')[0] < today) {
    return 'late';
  }
  return receipt.status;
};

// GET /api/receipts
exports.getReceipts = async (req, res, next) => {
  try {
    const { status, warehouse_id, contact_id, search, page = 1, limit = 20 } = req.query;
    const today = new Date().toISOString().split('T')[0];

    let whereClause = 'WHERE 1=1';
    const params = [];
    let idx = 1;

    if (status && status !== 'all') {
      if (status === 'late') {
        whereClause += ` AND r.status NOT IN ('done','cancelled') AND r.scheduled_date < $${idx++}`;
        params.push(today);
      } else {
        whereClause += ` AND r.status = $${idx++}`;
        params.push(status);
      }
    }

    if (warehouse_id) {
      whereClause += ` AND r.warehouse_id = $${idx++}`;
      params.push(warehouse_id);
    }

    if (contact_id) {
      whereClause += ` AND r.contact_id = $${idx++}`;
      params.push(contact_id);
    }

    if (search) {
      whereClause += ` AND (r.reference ILIKE $${idx} OR c.name ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const [receipts, countRes] = await Promise.all([
      query(`
        SELECT
          r.id, r.reference, r.status, r.scheduled_date, r.notes,
          r.created_at, r.updated_at, r.validated_at,
          c.name AS contact_name, c.id AS contact_id,
          w.name AS warehouse_name, w.code AS warehouse_code,
          l.name AS destination_name, l.code AS destination_code,
          u.name AS responsible_name,
          CASE
            WHEN r.status NOT IN ('done','cancelled') AND r.scheduled_date < CURRENT_DATE
            THEN 'late'
            ELSE r.status::text
          END AS display_status,
          (SELECT COUNT(*) FROM receipt_items ri WHERE ri.receipt_id = r.id) AS item_count,
          (SELECT SUM(ri.quantity) FROM receipt_items ri WHERE ri.receipt_id = r.id) AS total_qty
        FROM receipts r
        LEFT JOIN contacts c ON c.id = r.contact_id
        LEFT JOIN warehouses w ON w.id = r.warehouse_id
        LEFT JOIN locations l ON l.id = r.destination_id
        LEFT JOIN users u ON u.id = r.responsible_id
        ${whereClause}
        ORDER BY r.created_at DESC
        LIMIT $${idx++} OFFSET $${idx++}
      `, params),

      query(`
        SELECT COUNT(*) FROM receipts r
        LEFT JOIN contacts c ON c.id = r.contact_id
        ${whereClause.replace(`LIMIT $${idx - 2} OFFSET $${idx - 1}`, '')}
      `, params.slice(0, -2)),
    ]);

    res.json({
      success: true,
      data: receipts.rows,
      pagination: {
        total: parseInt(countRes.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countRes.rows[0].count / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/receipts/:id
exports.getReceiptById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const receiptRes = await query(`
      SELECT
        r.*,
        c.name AS contact_name, c.email AS contact_email, c.phone AS contact_phone,
        w.name AS warehouse_name, w.code AS warehouse_code,
        l.name AS destination_name, l.code AS destination_code,
        u.name AS responsible_name,
        cu.name AS created_by_name,
        CASE
          WHEN r.status NOT IN ('done','cancelled') AND r.scheduled_date < CURRENT_DATE
          THEN 'late'
          ELSE r.status::text
        END AS display_status
      FROM receipts r
      LEFT JOIN contacts c ON c.id = r.contact_id
      LEFT JOIN warehouses w ON w.id = r.warehouse_id
      LEFT JOIN locations l ON l.id = r.destination_id
      LEFT JOIN users u ON u.id = r.responsible_id
      LEFT JOIN users cu ON cu.id = r.created_by
      WHERE r.id = $1
    `, [id]);

    if (!receiptRes.rows.length) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    const itemsRes = await query(`
      SELECT
        ri.id, ri.quantity, ri.done_qty, ri.unit_price,
        p.id AS product_id, p.name AS product_name, p.sku, p.unit_of_measure,
        pc.name AS category_name
      FROM receipt_items ri
      JOIN products p ON p.id = ri.product_id
      LEFT JOIN product_categories pc ON pc.id = p.category_id
      WHERE ri.receipt_id = $1
      ORDER BY ri.created_at
    `, [id]);

    res.json({
      success: true,
      data: { ...receiptRes.rows[0], items: itemsRes.rows },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/receipts
exports.createReceipt = async (req, res, next) => {
  try {
    const {
      warehouse_id, contact_id, destination_id,
      scheduled_date, notes, items = [],
    } = req.body;

    const result = await withTransaction(async (client) => {
      // Generate reference
      const whRes = await client.query('SELECT code FROM warehouses WHERE id = $1', [warehouse_id]);
      if (!whRes.rows.length) throw Object.assign(new Error('Warehouse not found'), { status: 404 });

      const refRes = await client.query(
        'SELECT generate_reference($1, $2, $3) AS ref',
        [whRes.rows[0].code, 'IN', warehouse_id]
      );
      const reference = refRes.rows[0].ref;

      const receiptRes = await client.query(`
        INSERT INTO receipts (reference, warehouse_id, contact_id, destination_id, status, scheduled_date, notes, responsible_id, created_by)
        VALUES ($1,$2,$3,$4,'draft',$5,$6,$7,$7)
        RETURNING *
      `, [reference, warehouse_id, contact_id || null, destination_id || null, scheduled_date || null, notes || null, req.user.id]);

      const receipt = receiptRes.rows[0];

      if (items.length) {
        for (const item of items) {
          await client.query(
            'INSERT INTO receipt_items (receipt_id, product_id, quantity, unit_price) VALUES ($1,$2,$3,$4)',
            [receipt.id, item.product_id, item.quantity, item.unit_price || 0]
          );
        }
      }

      return receipt;
    });

    res.status(201).json({ success: true, message: 'Receipt created', data: result });
  } catch (err) {
    next(err);
  }
};

// PUT /api/receipts/:id
exports.updateReceipt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { contact_id, destination_id, scheduled_date, notes, items } = req.body;

    const existing = await query('SELECT status FROM receipts WHERE id = $1', [id]);
    if (!existing.rows.length) return res.status(404).json({ success: false, message: 'Receipt not found' });
    if (existing.rows[0].status === 'done') {
      return res.status(400).json({ success: false, message: 'Cannot edit a validated receipt' });
    }

    await withTransaction(async (client) => {
      await client.query(`
        UPDATE receipts SET
          contact_id = COALESCE($1, contact_id),
          destination_id = COALESCE($2, destination_id),
          scheduled_date = COALESCE($3, scheduled_date),
          notes = COALESCE($4, notes)
        WHERE id = $5
      `, [contact_id, destination_id, scheduled_date, notes, id]);

      if (items) {
        await client.query('DELETE FROM receipt_items WHERE receipt_id = $1', [id]);
        for (const item of items) {
          await client.query(
            'INSERT INTO receipt_items (receipt_id, product_id, quantity, unit_price) VALUES ($1,$2,$3,$4)',
            [id, item.product_id, item.quantity, item.unit_price || 0]
          );
        }
      }
    });

    const updated = await exports.getReceiptById({ params: { id } }, { json: (d) => d }, () => {});
    res.json({ success: true, message: 'Receipt updated', data: updated?.data });
  } catch (err) {
    next(err);
  }
};

// POST /api/receipts/:id/action
exports.receiptAction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'confirm' | 'validate' | 'cancel'

    const receiptRes = await query('SELECT * FROM receipts WHERE id = $1', [id]);
    if (!receiptRes.rows.length) return res.status(404).json({ success: false, message: 'Receipt not found' });

    const receipt = receiptRes.rows[0];

    const transitions = {
      confirm: { from: ['draft'], to: 'ready' },
      validate: { from: ['ready'], to: 'done' },
      cancel: { from: ['draft', 'ready'], to: 'cancelled' },
    };

    const transition = transitions[action];
    if (!transition) return res.status(400).json({ success: false, message: 'Invalid action' });
    if (!transition.from.includes(receipt.status)) {
      return res.status(400).json({ success: false, message: `Cannot ${action} a receipt in ${receipt.status} state` });
    }

    if (action === 'validate') {
      // Validate stock update
      await withTransaction(async (client) => {
        const itemsRes = await client.query(
          'SELECT product_id, quantity FROM receipt_items WHERE receipt_id = $1',
          [id]
        );

        if (!itemsRes.rows.length) {
          throw Object.assign(new Error('Cannot validate receipt with no items'), { status: 400 });
        }

        for (const item of itemsRes.rows) {
          // Update done_qty
          await client.query(
            'UPDATE receipt_items SET done_qty = quantity WHERE receipt_id = $1 AND product_id = $2',
            [id, item.product_id]
          );

          // Update stock
          await client.query(
            'SELECT update_stock($1, $2, $3)',
            [item.product_id, receipt.destination_id, item.quantity]
          );

          // Log move
          await client.query(`
            INSERT INTO stock_moves (product_id, to_location_id, quantity, move_type, reference, created_by)
            VALUES ($1, $2, $3, 'receipt', $4, $5)
          `, [item.product_id, receipt.destination_id, item.quantity, receipt.reference, req.user.id]);
        }

        await client.query(
          "UPDATE receipts SET status = 'done', validated_at = NOW() WHERE id = $1",
          [id]
        );
      });
    } else {
      await query(`UPDATE receipts SET status = $1 WHERE id = $2`, [transition.to, id]);
    }

    res.json({ success: true, message: `Receipt ${action}d successfully`, data: { status: transition.to } });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/receipts/:id
exports.deleteReceipt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const r = await query('SELECT status FROM receipts WHERE id = $1', [id]);
    if (!r.rows.length) return res.status(404).json({ success: false, message: 'Receipt not found' });
    if (r.rows[0].status === 'done') return res.status(400).json({ success: false, message: 'Cannot delete validated receipt' });

    await query('DELETE FROM receipts WHERE id = $1', [id]);
    res.json({ success: true, message: 'Receipt deleted' });
  } catch (err) {
    next(err);
  }
};
