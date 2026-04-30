const path = require('path');
// Only load .env if it exists (for local development)
if (require('fs').existsSync(path.join(__dirname, '../../.env'))) {
    require('dotenv').config({ path: path.join(__dirname, '../../.env') });
}
const { withTransaction } = require('../config/db');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

async function seed() {
  logger.info('Starting database seed...');

  await withTransaction(async (client) => {

    // Admin user
    const hashedPwd = await bcrypt.hash('Admin@123', 12);
    const userRes = await client.query(`
      INSERT INTO users (name, email, password, role)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `, ['Priyanshu Kumar', 'admin@coreinventory.com', hashedPwd, 'admin']);
    const adminId = userRes.rows[0].id;

    const staffRes = await client.query(`
      INSERT INTO users (name, email, password, role)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `, ['Rohan Verma', 'staff@coreinventory.com', hashedPwd, 'staff']);
    const staffId = staffRes.rows[0].id;

    // Warehouses
    const whRes = await client.query(`
      INSERT INTO warehouses (name, code, address, city, created_by)
      VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `, ['Main Warehouse', 'WH', 'Plot 12, Industrial Area, Phase 1', 'Delhi', adminId]);
    const whId = whRes.rows[0].id;

    const wh2Res = await client.query(`
      INSERT INTO warehouses (name, code, address, city, created_by)
      VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `, ['North Hub', 'WH2', 'Sector 62, Noida', 'Noida', adminId]);
    const wh2Id = wh2Res.rows[0].id;

    // Locations
    const locationData = [
      ['Stock Area 1', 'STOCK1', whId],
      ['Rack A', 'RACKA', whId],
      ['Rack B', 'RACKB', whId],
      ['Production Area', 'PROD', whId],
      ['Dispatch Zone', 'DISPATCH', whId],
      ['Stock Area 1', 'STOCK1', wh2Id],
      ['Shelf A', 'SHELFA', wh2Id],
    ];
    const locationIds = {};
    for (const [name, code, warehouseId] of locationData) {
      const r = await client.query(`
        INSERT INTO locations (name, code, warehouse_id)
        VALUES ($1,$2,$3)
        ON CONFLICT (code, warehouse_id) DO UPDATE SET name = EXCLUDED.name
        RETURNING id, code, warehouse_id
      `, [name, code, warehouseId]);
      const key = `${warehouseId}:${code}`;
      locationIds[key] = r.rows[0].id;
    }

    // Product Categories
    const cats = ['Furniture', 'Raw Material', 'Hardware', 'Consumable', 'Electronics'];
    const catIds = {};
    for (const cat of cats) {
      const r = await client.query(`
        INSERT INTO product_categories (name)
        VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
        RETURNING id, name
      `, [cat]);
      catIds[cat] = r.rows[0].id;
    }

    // Contacts
    const contacts = [
      ['Azure Interior', 'vendor', 'contact@azureinterior.com', '+91-9876543210', 'vendor'],
      ['Steelcraft Ltd', 'vendor', 'orders@steelcraft.com', '+91-9876543211', 'vendor'],
      ['PaintPro Inc', 'vendor', 'sales@paintpro.com', '+91-9876543212', 'vendor'],
      ['Reliance Retail', 'customer', 'procurement@reliance.com', '+91-9876543213', 'customer'],
      ['IKEA India', 'customer', 'supply@ikea.in', '+91-9876543214', 'customer'],
      ['HomeCo Pvt Ltd', 'customer', 'orders@homeco.in', '+91-9876543215', 'customer'],
    ];
    const contactIds = {};
    for (const [name, type, email, phone] of contacts) {
      const r = await client.query(`
        INSERT INTO contacts (name, type, email, phone)
        VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING RETURNING id, name
      `, [name, type, email, phone]);
      if (r.rows[0]) contactIds[name] = r.rows[0].id;
    }

    // Products
    const productData = [
      ['Executive Desk', 'DESK001', catIds['Furniture'], 'pcs', 5, 15000, 22000, 'Solid wood executive desk'],
      ['Ergonomic Chair', 'CHAIR002', catIds['Furniture'], 'pcs', 10, 8000, 14000, 'Ergonomic office chair'],
      ['Steel Rod 6mm', 'STEEL001', catIds['Raw Material'], 'kg', 50, 85, 110, '6mm diameter steel rod'],
      ['M8 Bolt Set (100pcs)', 'BOLT001', catIds['Hardware'], 'set', 100, 250, 450, 'M8 hex bolt set'],
      ['Primer Coat 5L', 'PAINT002', catIds['Consumable'], 'ltr', 20, 450, 680, 'Industrial primer coat'],
      ['LED Panel 40W', 'LED003', catIds['Electronics'], 'pcs', 15, 1200, 1800, '40W LED panel light'],
    ];
    const productIds = {};
    for (const [name, sku, catId, unit, reorder, cost, sale, desc] of productData) {
      const r = await client.query(`
        INSERT INTO products (name, sku, category_id, unit_of_measure, reorder_point, cost_price, sale_price, description, created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name
        RETURNING id, sku
      `, [name, sku, catId, unit, reorder, cost, sale, desc, adminId]);
      productIds[sku] = r.rows[0].id;
    }

    // Sequence counters
    await client.query(`
      INSERT INTO sequence_counters (warehouse_id, operation, last_value)
      VALUES ($1,'IN',4), ($1,'OUT',3), ($1,'TR',2), ($1,'ADJ',1)
      ON CONFLICT (warehouse_id, operation) DO NOTHING
    `, [whId]);

    // --- Seed Receipts ---
    const getLocId = (wid, code) => locationIds[`${wid}:${code}`];

    // Receipt 1 - Done
    const r1 = await client.query(`
      INSERT INTO receipts (reference, warehouse_id, contact_id, destination_id, status, scheduled_date, responsible_id, created_by, validated_at)
      VALUES ('WH/IN/0001',$1,$2,$3,'done','2026-03-10',$4,$5,NOW())
      ON CONFLICT (reference) DO UPDATE SET status = EXCLUDED.status
      RETURNING id
    `, [whId, contactIds['Azure Interior'], getLocId(whId, 'STOCK1'), adminId, adminId]);
    const r1id = r1.rows[0].id;
    await client.query(`INSERT INTO receipt_items (receipt_id,product_id,quantity,done_qty) VALUES ($1,$2,6,6),($1,$3,4,4) ON CONFLICT DO NOTHING`,
      [r1id, productIds['DESK001'], productIds['CHAIR002']]);

    // Receipt 2 - Ready
    const r2 = await client.query(`
      INSERT INTO receipts (reference, warehouse_id, contact_id, destination_id, status, scheduled_date, responsible_id, created_by)
      VALUES ('WH/IN/0002',$1,$2,$3,'ready','2026-03-15',$4,$4)
      ON CONFLICT (reference) DO UPDATE SET status = EXCLUDED.status
      RETURNING id
    `, [whId, contactIds['Steelcraft Ltd'], getLocId(whId, 'STOCK1'), adminId]);
    const r2id = r2.rows[0].id;
    await client.query(`INSERT INTO receipt_items (receipt_id,product_id,quantity,done_qty) VALUES ($1,$2,100,0) ON CONFLICT DO NOTHING`,
      [r2id, productIds['STEEL001']]);

    // Receipt 3 - Late (past date)
    const r3 = await client.query(`
      INSERT INTO receipts (reference, warehouse_id, contact_id, destination_id, status, scheduled_date, responsible_id, created_by)
      VALUES ('WH/IN/0003',$1,$2,$3,'ready','2026-03-08',$4,$4)
      ON CONFLICT (reference) DO UPDATE SET status = EXCLUDED.status
      RETURNING id
    `, [whId, contactIds['PaintPro Inc'], getLocId(whId, 'STOCK1'), staffId]);
    await client.query(`INSERT INTO receipt_items (receipt_id,product_id,quantity,done_qty) VALUES ($1,$2,50,0) ON CONFLICT DO NOTHING`,
      [r3.rows[0].id, productIds['BOLT001']]);

    // Receipt 4 - Draft
    const r4 = await client.query(`
      INSERT INTO receipts (reference, warehouse_id, contact_id, destination_id, status, scheduled_date, responsible_id, created_by)
      VALUES ('WH/IN/0004',$1,$2,$3,'draft','2026-03-20',$4,$4)
      ON CONFLICT (reference) DO UPDATE SET status = EXCLUDED.status
      RETURNING id
    `, [whId, contactIds['Azure Interior'], getLocId(whId, 'STOCK1'), staffId]);
    await client.query(`INSERT INTO receipt_items (receipt_id,product_id,quantity,done_qty) VALUES ($1,$2,30,0) ON CONFLICT DO NOTHING`,
      [r4.rows[0].id, productIds['PAINT002']]);

    // --- Seed Deliveries ---
    const d1 = await client.query(`
      INSERT INTO deliveries (reference, warehouse_id, contact_id, source_id, status, scheduled_date, responsible_id, created_by, validated_at)
      VALUES ('WH/OUT/0001',$1,$2,$3,'done','2026-03-11',$4,$4,NOW())
      ON CONFLICT (reference) DO UPDATE SET status = EXCLUDED.status
      RETURNING id
    `, [whId, contactIds['Reliance Retail'], getLocId(whId, 'STOCK1'), adminId]);
    await client.query(`INSERT INTO delivery_items (delivery_id,product_id,quantity,done_qty) VALUES ($1,$2,2,2),($1,$3,5,5) ON CONFLICT DO NOTHING`,
      [d1.rows[0].id, productIds['DESK001'], productIds['CHAIR002']]);

    const d2 = await client.query(`
      INSERT INTO deliveries (reference, warehouse_id, contact_id, source_id, status, scheduled_date, responsible_id, created_by)
      VALUES ('WH/OUT/0002',$1,$2,$3,'ready','2026-03-09',$4,$4)
      ON CONFLICT (reference) DO UPDATE SET status = EXCLUDED.status
      RETURNING id
    `, [whId, contactIds['IKEA India'], getLocId(whId, 'STOCK1'), adminId]);
    await client.query(`INSERT INTO delivery_items (delivery_id,product_id,quantity,done_qty) VALUES ($1,$2,3,0) ON CONFLICT DO NOTHING`,
      [d2.rows[0].id, productIds['DESK001']]);

    const d3 = await client.query(`
      INSERT INTO deliveries (reference, warehouse_id, contact_id, source_id, status, scheduled_date, responsible_id, created_by)
      VALUES ('WH/OUT/0003',$1,$2,$3,'waiting','2026-03-18',$4,$4)
      ON CONFLICT (reference) DO UPDATE SET status = EXCLUDED.status
      RETURNING id
    `, [whId, contactIds['HomeCo Pvt Ltd'], getLocId(whId, 'STOCK1'), staffId]);
    await client.query(`INSERT INTO delivery_items (delivery_id,product_id,quantity,done_qty) VALUES ($1,$2,8,0) ON CONFLICT DO NOTHING`,
      [d3.rows[0].id, productIds['CHAIR002']]);

    // --- Transfers ---
    const t1 = await client.query(`
      INSERT INTO transfers (reference, warehouse_id, from_location_id, to_location_id, status, scheduled_date, responsible_id, created_by, validated_at)
      VALUES ('WH/TR/0001',$1,$2,$3,'done','2026-03-12',$4,$4,NOW())
      ON CONFLICT (reference) DO UPDATE SET status = EXCLUDED.status
      RETURNING id
    `, [whId, getLocId(whId, 'STOCK1'), getLocId(whId, 'RACKA'), adminId]);
    await client.query(`INSERT INTO transfer_items (transfer_id,product_id,quantity,done_qty) VALUES ($1,$2,20,20) ON CONFLICT DO NOTHING`,
      [t1.rows[0].id, productIds['STEEL001']]);

    const t2 = await client.query(`
      INSERT INTO transfers (reference, warehouse_id, from_location_id, to_location_id, status, scheduled_date, responsible_id, created_by)
      VALUES ('WH/TR/0002',$1,$2,$3,'draft','2026-03-20',$4,$4)
      ON CONFLICT (reference) DO UPDATE SET status = EXCLUDED.status
      RETURNING id
    `, [whId, getLocId(whId, 'RACKA'), getLocId(whId, 'PROD'), staffId]);
    await client.query(`INSERT INTO transfer_items (transfer_id,product_id,quantity,done_qty) VALUES ($1,$2,10,0) ON CONFLICT DO NOTHING`,
      [t2.rows[0].id, productIds['BOLT001']]);

    // --- Adjustments ---
    const adj1 = await client.query(`
      INSERT INTO adjustments (reference, warehouse_id, location_id, status, reason, responsible_id, created_by, validated_at)
      VALUES ('WH/ADJ/0001',$1,$2,'done','Damaged items found during audit',$3,$3,NOW())
      ON CONFLICT (reference) DO UPDATE SET status = EXCLUDED.status
      RETURNING id
    `, [whId, getLocId(whId, 'STOCK1'), adminId]);
    await client.query(`INSERT INTO adjustment_items (adjustment_id,product_id,location_id,theoretical_qty,counted_qty) VALUES ($1,$2,$3,10,8) ON CONFLICT DO NOTHING`,
      [adj1.rows[0].id, productIds['DESK001'], getLocId(whId, 'STOCK1')]);

    // --- Stock ---
    const stockData = [
      [productIds['DESK001'], getLocId(whId, 'STOCK1'), 8],
      [productIds['DESK001'], getLocId(whId, 'RACKA'), 4],
      [productIds['CHAIR002'], getLocId(whId, 'STOCK1'), 13],
      [productIds['CHAIR002'], getLocId(whId, 'PROD'), 3],
      [productIds['STEEL001'], getLocId(whId, 'STOCK1'), 65],
      [productIds['STEEL001'], getLocId(whId, 'RACKA'), 20],
      [productIds['BOLT001'], getLocId(whId, 'STOCK1'), 320],
      [productIds['PAINT002'], getLocId(whId, 'STOCK1'), 8],
      [productIds['LED003'], getLocId(whId, 'STOCK1'), 12],
    ];
    for (const [pid, lid, qty] of stockData) {
      await client.query(`
        INSERT INTO stock (product_id, location_id, quantity)
        VALUES ($1,$2,$3)
        ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = EXCLUDED.quantity
      `, [pid, lid, qty]);
    }

    // --- Stock Moves ---
    const moveData = [
      [productIds['DESK001'], null, getLocId(whId,'STOCK1'), 6, 'receipt', 'WH/IN/0001'],
      [productIds['CHAIR002'], null, getLocId(whId,'STOCK1'), 4, 'receipt', 'WH/IN/0001'],
      [productIds['DESK001'], getLocId(whId,'STOCK1'), null, 2, 'delivery', 'WH/OUT/0001'],
      [productIds['CHAIR002'], getLocId(whId,'STOCK1'), null, 5, 'delivery', 'WH/OUT/0001'],
      [productIds['STEEL001'], null, getLocId(whId,'STOCK1'), 50, 'receipt', 'WH/IN/0002'],
      [productIds['STEEL001'], getLocId(whId,'STOCK1'), getLocId(whId,'RACKA'), 20, 'transfer', 'WH/TR/0001'],
      [productIds['DESK001'], getLocId(whId,'STOCK1'), null, 2, 'adjustment', 'WH/ADJ/0001'],
    ];
    for (const [pid, fromLid, toLid, qty, type, ref] of moveData) {
      await client.query(`
        INSERT INTO stock_moves (product_id, from_location_id, to_location_id, quantity, move_type, reference, created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
      `, [pid, fromLid, toLid, qty, type, ref, adminId]);
    }

    // Reorder rules
    await client.query(`
      INSERT INTO reorder_rules (product_id, warehouse_id, min_qty, max_qty, reorder_qty)
      VALUES ($1,$2,5,50,20),($3,$2,10,100,50)
      ON CONFLICT DO NOTHING
    `, [productIds['DESK001'], whId, productIds['CHAIR002']]);

  });

  logger.info('✅ Seed completed successfully!');
  logger.info('   Admin: admin@coreinventory.com / Admin@123');
  logger.info('   Staff: staff@coreinventory.com / Admin@123');
}

seed().then(() => process.exit(0)).catch(err => { logger.error(err); process.exit(1); });