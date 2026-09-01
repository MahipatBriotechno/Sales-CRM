require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { pool } = require('./config/db');

const updateToLate = async () => {
    try {
        const today = new Date().toISOString().split('T')[0];
        await pool.query("UPDATE attendance SET status = 'late' WHERE date = ?", [today]);
        console.log("Updated today's attendance records to 'late'");
        process.exit(0);
    } catch (err) {
        console.error("Error updating", err);
        process.exit(1);
    }
};

updateToLate();
