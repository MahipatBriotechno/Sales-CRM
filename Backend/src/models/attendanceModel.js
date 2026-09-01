const { pool } = require('../config/db');

const Attendance = {
    create: async (data, userId) => {
        const {
            employee_id, date, check_in, status, check_in_method,
            ip_address, selfie, latitude, longitude
        } = data;

        const [result] = await pool.query(
            `INSERT INTO attendance (
                employee_id, user_id, date, check_in, status, 
                check_in_method, ip_address, selfie, latitude, longitude
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                employee_id, userId, date, check_in, status,
                check_in_method, ip_address, selfie, latitude, longitude
            ]
        );
        return result.insertId;
    },

    updateCheckOut: async (id, data, userId) => {
        const { check_out, work_hours, status, overtime_hours, overtime_amount } = data;
        await pool.query(
            `UPDATE attendance SET check_out = ?, work_hours = ?, status = ?, overtime_hours = ?, overtime_amount = ? 
             WHERE id = ? AND user_id = ?`,
            [check_out, work_hours, status, overtime_hours || 0, overtime_amount || 0, id, userId]
        );
    },

    getBreaks: async (attendanceId) => {
        const [rows] = await pool.query(
            `SELECT * FROM attendance_breaks WHERE attendance_id = ? ORDER BY start_time ASC`,
            [attendanceId]
        );
        return rows;
    },

    startBreak: async (attendanceId) => {
        const [result] = await pool.query(
            `INSERT INTO attendance_breaks (attendance_id, start_time) VALUES (?, NOW())`,
            [attendanceId]
        );
        return result.insertId;
    },

    endBreak: async (breakId) => {
        await pool.query(
            `UPDATE attendance_breaks SET end_time = NOW() WHERE id = ?`,
            [breakId]
        );
    },

    findAll: async (userId, filters = {}) => {
        const { date, employee_id, department_id, status, page = 1, limit = 100 } = filters;
        const offset = (page - 1) * limit;

        let query = `
            SELECT a.*, e.employee_name, e.employee_id as emp_uid, d.department_name
            FROM attendance a
            JOIN employees e ON a.employee_id = e.id
            LEFT JOIN departments d ON e.department_id = d.id
            WHERE a.user_id = ?
        `;
        const queryParams = [userId];

        if (date) {
            query += ' AND a.date = ?';
            queryParams.push(date);
        }
        if (employee_id) {
            query += ' AND a.employee_id = ?';
            queryParams.push(employee_id);
        }
        if (status) {
            query += ' AND a.status = ?';
            queryParams.push(status);
        }
        if (department_id) {
            query += ' AND e.department_id = ?';
            queryParams.push(department_id);
        }

        query += ' ORDER BY a.date DESC, a.check_in DESC LIMIT ? OFFSET ?';
        queryParams.push(parseInt(limit), parseInt(offset));

        const [rows] = await pool.query(query, queryParams);
        return rows;
    },

    findByEmployeeAndDate: async (employeeId, date, userId) => {
        const [rows] = await pool.execute(
            'SELECT * FROM attendance WHERE employee_id = ? AND date = ? AND user_id = ?',
            [employeeId, date, userId]
        );
        return rows[0];
    },

    findById: async (id, userId) => {
        const [rows] = await pool.execute(
            `SELECT a.*, e.employee_name, e.employee_id as emp_uid, d.department_name
             FROM attendance a
             JOIN employees e ON a.employee_id = e.id
             LEFT JOIN departments d ON e.department_id = d.id
             WHERE a.id = ? AND a.user_id = ?`,
            [id, userId]
        );
        return rows[0];
    },


    getStats: async (userId, date) => {
        const [rows] = await pool.query(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
                SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
                SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late,
                SUM(CASE WHEN status = 'half-day' THEN 1 ELSE 0 END) as half_day
             FROM attendance 
             WHERE user_id = ? AND date = ?`,
            [userId, date]
        );
        return rows[0];
    },

    getEmployeeStats: async (employeeId, userId) => {
        const [rows] = await pool.query(
            `SELECT 
                COUNT(*) as total_days,
                COALESCE(SUM(CASE WHEN status IN ('present', 'late', 'half-day') THEN 1 ELSE 0 END), 0) as present_days,
                COALESCE(SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END), 0) as absent_days,
                COALESCE(SUM(CASE WHEN status = 'leave' THEN 1 ELSE 0 END), 0) as leave_days
             FROM attendance 
             WHERE employee_id = ? AND user_id = ?`,
            [employeeId, userId]
        );
        return rows[0];
    },

    getOvertimeByEmployeeAndDate: async (employeeId, startDate, endDate, userId) => {
        const [rows] = await pool.query(
            `SELECT COALESCE(SUM(overtime_amount), 0) as total_overtime_amount, COALESCE(SUM(overtime_hours), 0) as total_overtime_hours
             FROM attendance 
             WHERE employee_id = ? AND date >= ? AND date <= ? AND user_id = ?`,
            [employeeId, startDate, endDate, userId]
        );
        return rows[0];
    },

    update: async (id, data, userId) => {
        const fields = Object.keys(data);
        const values = Object.values(data);
        const setClause = fields.map(field => `${field} = ?`).join(', ');

        await pool.query(
            `UPDATE attendance SET ${setClause} WHERE id = ? AND user_id = ?`,
            [...values, id, userId]
        );
    },

    delete: async (id, userId) => {
        await pool.query('DELETE FROM attendance WHERE id = ? AND user_id = ?', [id, userId]);
    }
};

module.exports = Attendance;
