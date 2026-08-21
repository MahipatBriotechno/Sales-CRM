const { pool } = require('../config/db');

const initOtpTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS otps (
                id INT AUTO_INCREMENT PRIMARY KEY,
                mobile_number VARCHAR(20) NOT NULL,
                otp VARCHAR(10) NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_mobile (mobile_number)
            )
        `);
    } catch (err) {
        console.error('Error initializing otps table:', err.message);
    }
};

// Auto-initialize table schema
initOtpTable();

const Otp = {
    saveOtp: async (mobileNumber, otp, expiresInMinutes = 10) => {
        const cleanMobile = mobileNumber.replace(/\D/g, '').slice(-10);
        const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

        // Remove old active OTP records for this phone number
        await pool.query('DELETE FROM otps WHERE mobile_number = ?', [cleanMobile]);

        const [result] = await pool.query(
            'INSERT INTO otps (mobile_number, otp, expires_at) VALUES (?, ?, ?)',
            [cleanMobile, otp, expiresAt]
        );
        return result.insertId;
    },

    verifyOtp: async (mobileNumber, otp) => {
        const cleanMobile = mobileNumber.replace(/\D/g, '').slice(-10);
        const [rows] = await pool.query(
            'SELECT * FROM otps WHERE mobile_number = ? AND otp = ? AND expires_at > NOW() ORDER BY id DESC LIMIT 1',
            [cleanMobile, otp]
        );
        return rows.length > 0 ? rows[0] : null;
    },

    deleteOtp: async (mobileNumber) => {
        const cleanMobile = mobileNumber.replace(/\D/g, '').slice(-10);
        await pool.query('DELETE FROM otps WHERE mobile_number = ?', [cleanMobile]);
    }
};

module.exports = Otp;
