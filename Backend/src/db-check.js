const { pool } = require('./config/db');

async function check() {
    try {
        const [rows] = await pool.query("SELECT id, name, tag, status, next_call_at, NOW() as db_now FROM leads ORDER BY id DESC LIMIT 5");
        console.log(rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
check();
