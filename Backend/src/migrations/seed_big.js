const path = require('path');
if (require('fs').existsSync(path.join(__dirname, '../../.env'))) {
    require('dotenv').config({ path: path.join(__dirname, '../../.env') });
}
const { query, withTransaction } = require('../config/db');
const logger = require('../utils/logger');

async function seedBigData() {
  logger.info('Starting BIG DATA database seed...');

  await withTransaction(async (client) => {
    // Get existing admin, warehouse, location, category
    const userRes = await client.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (!userRes.rows.length) throw new Error("No admin user found. Run seed.js first.");
    const adminId = userRes.rows[0].id;

    const whRes = await client.query("SELECT id, code FROM warehouses WHERE code = 'WH' LIMIT 1");
    if (!whRes.rows.length) throw new Error("No WH warehouse found.");
    const whId = whRes.rows[0].id;

    const locRes = await client.query("SELECT id FROM locations WHERE warehouse_id = $1 AND code = 'STOCK1' LIMIT 1", [whId]);
    if (!locRes.rows.length) throw new Error("No STOCK1 location found.");
    const stockLocId = locRes.rows[0].id;

    const catRes = await client.query("SELECT id FROM product_categories LIMIT 1");
    const catId = catRes.rows[0].id;

    // Generate 500 products
    logger.info('Generating 500 products...');
    let valString = '';
    let bulkParams = [];
    
    // We'll insert in batches of 100
    for(let batch=0; batch<5; batch++) {
      valString = '';
      bulkParams = [];
      for(let i=0; i<100; i++) {
        const id = batch * 100 + i;
        bulkParams.push(`Bulk Item ${id}`, `BLK${id.toString().padStart(4, '0')}`, catId, 'pcs', 50, 10 + (id%50), 20 + (id%50), `Bulk generated product ${id} for scale testing`, adminId);
        const pOffset = i * 9;
        valString += `($${pOffset+1}, $${pOffset+2}, $${pOffset+3}, $${pOffset+4}, $${pOffset+5}, $${pOffset+6}, $${pOffset+7}, $${pOffset+8}, $${pOffset+9}),`;
      }
      valString = valString.slice(0, -1);
      
      const res = await client.query(`
        INSERT INTO products (name, sku, category_id, unit_of_measure, reorder_point, cost_price, sale_price, description, created_by)
        VALUES ${valString}
        ON CONFLICT (sku) DO NOTHING RETURNING id, sku
      `, bulkParams);
      
      // Give them stock
      let stockValString = '';
      let stockParams = [];
      let sCount = 0;
      for (const row of res.rows) {
        const qty = 100 + (Math.floor(Math.random() * 500));
        stockParams.push(row.id, stockLocId, qty);
        const sOffset = sCount * 3;
        stockValString += `($${sOffset+1}, $${sOffset+2}, $${sOffset+3}),`;
        sCount++;
      }
      if (sCount > 0) {
        stockValString = stockValString.slice(0, -1);
        await client.query(`
          INSERT INTO stock (product_id, location_id, quantity)
          VALUES ${stockValString}
          ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = EXCLUDED.quantity
        `, stockParams);
      }
    }
    
    // Safer move insertion for bulk
    logger.info('Generating 1000 stock moves...');
    const bulkProducts = await client.query("SELECT id, sku FROM products WHERE sku LIKE 'BLK%'");
    for (let i=0; i<bulkProducts.rows.length; i+=100) {
       const chunk = bulkProducts.rows.slice(i, i+100);
       let q = "INSERT INTO stock_moves (product_id, from_location_id, to_location_id, quantity, move_type, reference, created_by) VALUES ";
       let p = [];
       let count = 0;
       for (const row of chunk) {
          p.push(row.id, stockLocId, 500, 'receipt', `BLK/IN/${row.sku}`, adminId);
          q += `($${count*6+1}, null, $${count*6+2}, $${count*6+3}, $${count*6+4}, $${count*6+5}, $${count*6+6}),`;
          count++;
          
          p.push(row.id, stockLocId, 50, 'delivery', `BLK/OUT/${row.sku}`, adminId);
          q += `($${count*6+1}, $${count*6+2}, null, $${count*6+3}, $${count*6+4}, $${count*6+5}, $${count*6+6}),`;
          count++;
       }
       q = q.slice(0, -1);
       await client.query(q, p);
    }
    logger.info('Bulk data generated.');
  });

  logger.info('✅ Big Data Seed completed successfully!');
}

seedBigData().catch(err => {
  logger.error('Big Data Seed failed:', err);
  process.exit(1);
});
