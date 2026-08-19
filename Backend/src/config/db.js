const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // timezone: 'local',
    dateStrings: false
});

const connectDB = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('MySQL Connected...');

        // Create notifications table if it doesn't exist
        await pool.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                user_type ENUM('user', 'employee') NOT NULL DEFAULT 'employee',
                type VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
                icon VARCHAR(50),
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Channel Configs Table for WhatsApp, Meta, IndiaMart etc
        await pool.query(`
            CREATE TABLE IF NOT EXISTS channel_configs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                channel_type VARCHAR(50) NOT NULL,
                account_name VARCHAR(255),
                api_key TEXT,
                config_data JSON,
                status ENUM('Active', 'Inactive') DEFAULT 'Active',
                last_sync_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Add UNIQUE INDEX if not already present (safe to run multiple times)
        await pool.query(`
            ALTER TABLE channel_configs
            ADD UNIQUE INDEX IF NOT EXISTS unique_user_channel (user_id, channel_type)
        `).catch(() => {
            // Older MySQL versions don't support IF NOT EXISTS on ALTER ADD INDEX
            // Silently ignore — index may already exist
        });

        // Sync Logs for monitoring integrations
        await pool.query(`
            CREATE TABLE IF NOT EXISTS lead_sync_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                channel_type VARCHAR(50) NOT NULL,
                reference_id INT,
                status ENUM('success', 'failed') NOT NULL,
                message TEXT,
                raw_data JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // CRM Forms for Lead Generation
        await pool.query(`
            CREATE TABLE IF NOT EXISTS crm_forms (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                form_name VARCHAR(255) NOT NULL,
                form_slug VARCHAR(255) NOT NULL UNIQUE,
                fields JSON,
                settings JSON,
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Google Sheets Integration
        await pool.query(`
            CREATE TABLE IF NOT EXISTS google_sheets_configs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                sheet_name VARCHAR(255),
                spreadsheet_id VARCHAR(255),
                sheet_id VARCHAR(255),
                credentials_json TEXT,
                field_mapping JSON,
                sync_frequency VARCHAR(50),
                last_sync_at TIMESTAMP NULL,
                status ENUM('Active', 'Inactive') DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Integration tables checked/created.');

        connection.release();
    } catch (error) {
        console.error('MySQL connection error:', error);
    }
};

module.exports = { pool, connectDB };
