let db;
try {
    db = require('./server/config/db');
} catch (e) {
    console.error('❌ Failed to load database config:', e.message);
    process.exit(1);
}

async function testConnection() {
    try {
        console.log('Testing connection to PostgreSQL...');
        const res = await db.query('SELECT NOW()');
        console.log('✅ Connection Successful!');
        console.log('Current DB Time:', res.rows[0].now);

        console.log('\nChecking for tables...');
        const tables = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        
        if (tables.rows.length === 0) {
            console.log('❌ No tables found in public schema. Did you run the setup.sql?');
        } else {
            console.log('✅ Found tables:');
            tables.rows.forEach(row => console.log(` - ${row.table_name}`));
        }
    } catch (err) {
        console.error('❌ Connection Failed!');
        console.error('Error Object:', JSON.stringify(err, null, 2));
        console.error('Error Message:', err.message);
        
        if (err.code === '3D000') {
            console.log('👉 Tip: The database "cgpa_calculator" does not exist yet. You need to create it first.');
        } else if (err.code === 'ECONNREFUSED') {
            console.log('👉 Tip: PostgreSQL service is not running or port is incorrect.');
        } else if (err.code === '28P01') {
            console.log('👉 Tip: Password authentication failed. Check PGUSER and PGPASSWORD in .env');
        }
    } finally {
        process.exit();
    }
}

testConnection();
