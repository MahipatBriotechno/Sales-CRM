const { pool } = require('./src/config/db');

async function updateEnum() {
    try {
        await pool.query("ALTER TABLE goals MODIFY COLUMN goal_type ENUM('outbound_calls', 'connected_calls', 'meetings_booked', 'deals_won', 'revenue', 'leads', 'proposals', 'calls', 'followups', 'demos', 'meetings') NOT NULL");
        console.log("Goals table goal_type ENUM updated successfully.");
    } catch (e) {
        console.error("Error updating ENUM:", e.message);
    } finally {
        process.exit(0);
    }
}

updateEnum();
