const { pool } = require('../config/db');

const User = {
    create: async (userData) => {
        const {
            firstName,
            lastName,
            email,
            mobileNumber,
            businessName,
            businessType,
            gst,
            address,
            password,
            role = 'Admin' // Default role
        } = userData;

        const [result] = await pool.query(
            `INSERT INTO users (
        firstName, 
        lastName, 
        email, 
        mobileNumber, 
        businessName, 
        businessType, 
        gst, 
        address, 
        password,
        role
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                firstName,
                lastName,
                email,
                mobileNumber,
                businessName,
                businessType,
                gst,
                address,
                password,
                role
            ]
        );
        return result.insertId;
    },

    findByEmail: async (email) => {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    },

    findByMobileNumber: async (mobileNumber) => {
        const cleanMobile = mobileNumber.replace(/\D/g, '').slice(-10);
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE RIGHT(mobileNumber, 10) = ? OR mobileNumber = ?',
            [cleanMobile, mobileNumber]
        );
        return rows[0];
    },

    findById: async (id) => {
        const [rows] = await pool.query(
            'SELECT id, firstName, lastName, profile_picture, email, mobileNumber, businessName, businessType, gst, address, role, created_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    },

    update: async (id, data) => {
        const allowedFields = ['firstName', 'lastName', 'profile_picture', 'mobileNumber', 'businessName', 'businessType', 'gst', 'address'];
        const fields = Object.keys(data).filter(key => allowedFields.includes(key));

        if (fields.length === 0) return false;

        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const values = fields.map(field => data[field]);

        const [result] = await pool.query(
            `UPDATE users SET ${setClause} WHERE id = ?`,
            [...values, id]
        );
        return result.affectedRows > 0;
    }
};

module.exports = User;
