const { query } = require('../config/db');

// GET /api/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [
      totalProductsRes,
      lowStockRes,
      receiptStatsRes,
      deliveryStatsRes,
      transferStatsRes,
      recentMovesRes,
      stockValueRes,
    ] = await Promise.all([
      query('SELECT COUNT(*) AS total FROM products WHERE is_active = true'),

      query(`
        SELECT COUNT(DISTINCT p.id) AS count
        FROM products p
        LEFT JOIN (
          SELECT product_id, SUM(quantity) AS total_qty
          FROM stock GROUP BY product_id
        ) s ON s.product_id = p.id
        WHERE p.is_active = true
        AND (COALESCE(s.total_qty, 0) <= p.reorder_point)
      `),

      query(`
        SELECT
          COUNT(*) FILTER (WHERE status NOT IN ('done','cancelled')) AS pending,
          COUNT(*) FILTER (WHERE status NOT IN ('done','cancelled') AND scheduled_date < $1) AS late,
          COUNT(*) FILTER (WHERE status = 'draft') AS draft,
          COUNT(*) FILTER (WHERE status = 'ready') AS ready,
          COUNT(*) FILTER (WHERE status = 'done') AS done,
          COUNT(*) AS total
        FROM receipts
      `, [today]),

      query(`
        SELECT
          COUNT(*) FILTER (WHERE status NOT IN ('done','cancelled')) AS pending,
          COUNT(*) FILTER (WHERE status NOT IN ('done','cancelled') AND scheduled_date < $1) AS late,
          COUNT(*) FILTER (WHERE status = 'waiting') AS waiting,
          COUNT(*) FILTER (WHERE status = 'ready') AS ready,
          COUNT(*) FILTER (WHERE status = 'done') AS done,
          COUNT(*) AS total
        FROM deliveries
      `, [today]),

      query(`
        SELECT
          COUNT(*) FILTER (WHERE status NOT IN ('done','cancelled')) AS pending,
          COUNT(*) FILTER (WHERE status = 'done') AS done
        FROM transfers
      `),

      query(`
        SELECT
          sm.id, sm.move_type, sm.quantity, sm.reference, sm.created_at,
          p.name AS product_name, p.sku, p.unit_of_measure,
          fl.name AS from_location, tl.name AS to_location
        FROM stock_moves sm
        JOIN products p ON p.id = sm.product_id
        LEFT JOIN locations fl ON fl.id = sm.from_location_id
        LEFT JOIN locations tl ON tl.id = sm.to_location_id
        ORDER BY sm.created_at DESC
        LIMIT 10
      `),

      query(`
        SELECT COALESCE(SUM(s.quantity * p.cost_price), 0) AS total_value
        FROM stock s
        JOIN products p ON p.id = s.product_id
      `),
    ]);

    res.json({
      success: true,
      data: {
        kpis: {
          totalProducts: parseInt(totalProductsRes.rows[0].total),
          lowStock: parseInt(lowStockRes.rows[0].count),
          stockValue: parseFloat(stockValueRes.rows[0].total_value).toFixed(2),
        },
        receipts: receiptStatsRes.rows[0],
        deliveries: deliveryStatsRes.rows[0],
        transfers: transferStatsRes.rows[0],
        recentMoves: recentMovesRes.rows,
      },
    });
  } catch (err) {
    next(err);
  }
};
