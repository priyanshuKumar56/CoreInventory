const path = require('path');
// Only load .env if it exists (for local development)
if (require('fs').existsSync(path.join(__dirname, '../../.env'))) {
    require('dotenv').config({ path: path.join(__dirname, '../../.env') });
}
const fs = require('fs');
const { pool, testConnection } = require('../config/db');

const runMigrations = async () => {
    console.log('--- Database Migration Tool ---');
    
    const isConnected = await testConnection();
    if (!isConnected) {
        console.error('Error: Could not connect to database. Check environment variables.');
        process.exit(1);
    }

    try {
        const sqlPath = path.join(__dirname, 'schema_master.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing schema_master.sql...');
        await pool.query(sql);
        console.log('✅ Schema migration completed successfully.');

        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:');
        console.error(err.message);
        process.exit(1);
    }
};

runMigrations();
