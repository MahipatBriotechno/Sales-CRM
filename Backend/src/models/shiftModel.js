const { pool } = require('../config/db');

const Shift = {
    create: async (data, userId) => {
        const {
            shift_name, description, check_in_time, check_out_time, working_hours, working_days,
            attendance_method, grace_period, late_marking, half_day_enable,
            min_work_hours_half_day, half_day_cutoff_time, overtime_enable,
            min_overtime_after, overtime_rate, overtime_calculation, max_overtime_per_day
        } = data;

        const [result] = await pool.query(
            `INSERT INTO shifts (
                user_id, shift_name, description, check_in_time, check_out_time, working_hours, working_days,
                attendance_method, grace_period, late_marking, half_day_enable,
                min_work_hours_half_day, half_day_cutoff_time, overtime_enable,
                min_overtime_after, overtime_rate, overtime_calculation, max_overtime_per_day
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId, shift_name, description || null, check_in_time, check_out_time, working_hours || null, working_days || 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
                attendance_method || 'Administrative', grace_period || 0, late_marking ? 1 : 0, half_day_enable ? 1 : 0,
                min_work_hours_half_day || null, half_day_cutoff_time || null, overtime_enable ? 1 : 0,
                min_overtime_after || null, overtime_rate || null, overtime_calculation || null, max_overtime_per_day || null
            ]
        );
        return result.insertId;
    },

    findAll: async (userId) => {
        const [rows] = await pool.query(
            'SELECT * FROM shifts WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        return rows;
    },

    findById: async (id, userId) => {
        const [rows] = await pool.execute(
            'SELECT * FROM shifts WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return rows[0];
    },

    update: async (id, data, userId) => {
        const {
            shift_name, description, check_in_time, check_out_time, working_hours, working_days,
            attendance_method, grace_period, late_marking, half_day_enable,
            min_work_hours_half_day, half_day_cutoff_time, overtime_enable,
            min_overtime_after, overtime_rate, overtime_calculation, max_overtime_per_day
        } = data;

        await pool.query(
            `UPDATE shifts SET 
                shift_name = ?, description = ?, check_in_time = ?, check_out_time = ?, working_hours = ?, working_days = ?,
                attendance_method = ?, grace_period = ?, late_marking = ?, half_day_enable = ?,
                min_work_hours_half_day = ?, half_day_cutoff_time = ?, overtime_enable = ?,
                min_overtime_after = ?, overtime_rate = ?, overtime_calculation = ?, max_overtime_per_day = ?
             WHERE id = ? AND user_id = ?`,
            [
                shift_name, description || null, check_in_time, check_out_time, working_hours || null, working_days || 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
                attendance_method || 'Administrative', grace_period || 0, late_marking ? 1 : 0, half_day_enable ? 1 : 0,
                min_work_hours_half_day || null, half_day_cutoff_time || null, overtime_enable ? 1 : 0,
                min_overtime_after || null, overtime_rate || null, overtime_calculation || null, max_overtime_per_day || null,
                id, userId
            ]
        );
    },

    delete: async (id, userId) => {
        await pool.query(
            'DELETE FROM shifts WHERE id = ? AND user_id = ?',
            [id, userId]
        );
    }
};

module.exports = Shift;
