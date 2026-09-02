const { pool } = require('../config/db');

const Goal = {
    create: async (data, userId) => {
        const { goal_title, employee_id, team_id, employee_ids, team_ids, goal_type, target_value, period, start_date, end_date, reward, description, priority } = data;

        // Handle Multiple Assignments (New Logic)
        if (employee_ids && Array.isArray(employee_ids) && employee_ids.length > 0) {
            const results = [];
            for (const empId of employee_ids) {
                const [result] = await pool.query(
                    `INSERT INTO goals (user_id, employee_id, team_id, goal_title, goal_type, target_value, period, start_date, end_date, reward, description, priority) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [userId, empId, null, goal_title, goal_type, target_value, period, start_date, end_date, reward || null, description || null, priority || 'medium']
                );
                results.push(result.insertId);
            }
            return results[0]; // Return the first one for API response consistency
        }

        if (team_ids && Array.isArray(team_ids) && team_ids.length > 0) {
            const results = [];
            for (const tId of team_ids) {
                const [result] = await pool.query(
                    `INSERT INTO goals (user_id, employee_id, team_id, goal_title, goal_type, target_value, period, start_date, end_date, reward, description, priority) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [userId, null, tId, goal_title, goal_type, target_value, period, start_date, end_date, reward || null, description || null, priority || 'medium']
                );
                results.push(result.insertId);
            }
            return results[0];
        }

        // Single assignment (Legacy or Personal)
        const [result] = await pool.query(
            `INSERT INTO goals (user_id, employee_id, team_id, goal_title, goal_type, target_value, period, start_date, end_date, reward, description, priority) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, employee_id || null, team_id || null, goal_title, goal_type, target_value, period, start_date, end_date, reward || null, description || null, priority || 'medium']
        );
        return result.insertId;
    },

    findAll: async (userId, employeeId = null) => {
        let query = 'SELECT * FROM goals WHERE user_id = ?';
        const params = [userId];

        if (employeeId) {
            query += ' AND (employee_id = ? OR employee_id IS NULL)';
            params.push(employeeId);
        }

        const [rows] = await pool.query(query + ' ORDER BY created_at DESC', params);
        return rows;
    },

    findMyActiveGoals: async (employeeId, userId) => {
        const query = `
            SELECT * FROM goals 
            WHERE user_id = ? 
            AND (employee_id = ? OR team_id IN (SELECT team_id FROM team_members WHERE employee_id = ?))
            AND CURDATE() BETWEEN DATE(start_date) AND DATE(end_date)
            ORDER BY created_at DESC
        `;
        const [rows] = await pool.query(query, [userId, employeeId, employeeId]);
        return rows;
    },

    findById: async (id, userId) => {
        const [rows] = await pool.query('SELECT * FROM goals WHERE id = ? AND user_id = ?', [id, userId]);
        return rows[0];
    },

    update: async (id, data, userId) => {
        const fields = Object.keys(data).filter(k =>
            ['goal_title', 'goal_type', 'target_value', 'period', 'start_date', 'end_date', 'status', 'reward', 'description', 'priority', 'employee_id', 'team_id'].includes(k)
        );
        if (fields.length === 0) return;

        const setClause = fields.map(f => `${f} = ?`).join(', ');
        const values = fields.map(f => data[f]);
        values.push(id, userId);

        await pool.query(`UPDATE goals SET ${setClause} WHERE id = ? AND user_id = ?`, values);
    },

    delete: async (id, userId) => {
        await pool.query('DELETE FROM goals WHERE id = ? AND user_id = ?', [id, userId]);
    },

    getGoalProgress: async (goalId, userId) => {
        const [goalRows] = await pool.query('SELECT * FROM goals WHERE id = ? AND user_id = ?', [goalId, userId]);
        if (goalRows.length === 0) return null;

        const goal = goalRows[0];
        let currentValue = 0;
        const { goal_type, start_date, end_date, employee_id } = goal;

        const targetUserId = employee_id || userId;

        const fmtStart = (typeof start_date === 'string' ? start_date : start_date.toISOString()).split('T')[0];
        const fmtEnd = (typeof end_date === 'string' ? end_date : end_date.toISOString()).split('T')[0] + ' 23:59:59';

        if (goal_type === 'outbound_calls') {
            const [res] = await pool.query(
                `SELECT COUNT(lc.id) as count FROM lead_calls lc
                 JOIN leads l ON lc.lead_id = l.id
                 WHERE (l.assigned_to = ? OR lc.user_id = ?) 
                 AND lc.created_at BETWEEN ? AND ?`,
                [targetUserId, targetUserId, fmtStart, fmtEnd]
            );
            currentValue = res[0].count;
        } else if (goal_type === 'connected_calls') {
            const [res] = await pool.query(
                `SELECT COUNT(lc.id) as count FROM lead_calls lc
                 JOIN leads l ON lc.lead_id = l.id
                 WHERE (l.assigned_to = ? OR lc.user_id = ?) 
                 AND LOWER(lc.status) = 'connected'
                 AND lc.created_at BETWEEN ? AND ?`,
                [targetUserId, targetUserId, fmtStart, fmtEnd]
            );
            currentValue = res[0].count;
        } else if (goal_type === 'revenue') {
            const [res] = await pool.query(
                `SELECT SUM(value) as total FROM leads 
                 WHERE (assigned_to = ? OR user_id = ?) 
                 AND tag = 'Won' AND updated_at BETWEEN ? AND ?`,
                [targetUserId, targetUserId, fmtStart, fmtEnd]
            );
            currentValue = res[0].total || 0;
        } else if (goal_type === 'meetings_booked') {
            const [res] = await pool.query(
                `SELECT COUNT(lm.id) as count FROM lead_meetings lm
                 JOIN leads l ON lm.lead_id = l.id
                 WHERE (l.assigned_to = ? OR lm.user_id = ?) 
                 AND lm.created_at BETWEEN ? AND ?`,
                [targetUserId, targetUserId, fmtStart, fmtEnd]
            );
            currentValue = res[0].count;
        } else if (goal_type === 'leads') {
            const [res] = await pool.query(
                `SELECT COUNT(*) as count FROM leads 
                 WHERE user_id = ? 
                 AND created_at BETWEEN ? AND ?`,
                [targetUserId, fmtStart, fmtEnd]
            );
            currentValue = res[0].count;
        } else if (goal_type === 'deals_won') {
            const [res] = await pool.query(
                `SELECT COUNT(*) as count FROM leads 
                 WHERE (assigned_to = ? OR user_id = ?) 
                 AND tag = 'Won' AND updated_at BETWEEN ? AND ?`,
                [targetUserId, targetUserId, fmtStart, fmtEnd]
            );
            currentValue = res[0].count;
        } else if (goal_type === 'proposals') {
            const [res] = await pool.query(
                `SELECT COUNT(la.id) as count FROM lead_activities la
                 JOIN leads l ON la.lead_id = l.id
                 WHERE (l.assigned_to = ? OR la.user_id = ?) 
                 AND la.activity_type = 'proposal'
                 AND la.created_at BETWEEN ? AND ?`,
                [targetUserId, targetUserId, fmtStart, fmtEnd]
            );
            currentValue = res[0].count;
        } else if (goal_type === 'followups') {
            // A Follow-up is considered as any call logged or explicitly marked follow-up tasks
            const [resCalls] = await pool.query(
                `SELECT COUNT(lc.id) as count FROM lead_calls lc
                 JOIN leads l ON lc.lead_id = l.id
                 WHERE (l.assigned_to = ? OR lc.user_id = ?) 
                 AND lc.created_at BETWEEN ? AND ?`,
                [targetUserId, targetUserId, fmtStart, fmtEnd]
            );
            const [resTasks] = await pool.query(
                `SELECT COUNT(*) as count FROM tasks 
                 WHERE user_id = ? 
                 AND LOWER(category) = 'follow-up'
                 AND created_at BETWEEN ? AND ?`,
                [targetUserId, fmtStart, fmtEnd]
            );
            currentValue = resCalls[0].count + resTasks[0].count;
        }

        return {
            ...goal,
            current_value: currentValue,
            progress_percentage: Math.min(Math.round((currentValue / goal.target_value) * 100), 100)
        };
    }
};

module.exports = Goal;
