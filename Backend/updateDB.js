const { pool } = require('./src/config/db');

async function updateDB() {
    try {
        await pool.query(`ALTER TABLE shifts ADD COLUMN working_days VARCHAR(255) DEFAULT 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'`);
        console.log('Successfully added working_days to shifts table');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('working_days column already exists');
        } else {
            console.error('Error:', e);
        }
    } finally {
        process.exit(0);
    }
}

updateDB();
