const { pool } = require('../config/db');

class Applicant {
    static async create(applicantData) {
        const {
            job_id,
            name,
            email,
            phone,
            resume,
            application_data,
            interview_rounds,
            status
        } = applicantData;

        const query = `
            INSERT INTO applicants (
                job_id, name, email, phone, resume, application_data, interview_rounds, status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await pool.execute(query, [
            job_id,
            name,
            email,
            phone,
            resume,
            typeof application_data === 'string' ? application_data : JSON.stringify(application_data || {}),
            typeof interview_rounds === 'string' ? interview_rounds : JSON.stringify(interview_rounds || []),
            status || 'Applied'
        ]);

        return result.insertId;
    }

    static async findAll(userId, { page = 1, limit = 10, search = '', status = 'All', job_id = '' }) {
        const offset = (page - 1) * limit;
        let query = `
            SELECT a.*, 
                   j.title as job_title, 
                   j.department, 
                   j.application_fields,
                   a.job_id,
                   COALESCE(NULLIF(NULLIF(a.interview_rounds, ''), '[]'), j.interview_rounds) as interview_rounds
            FROM applicants a
            JOIN jobs j ON a.job_id = j.id
            WHERE j.user_id = ?
        `;
        const params = [userId];

        if (search) {
            query += ` AND (a.name LIKE ? OR a.email LIKE ? OR j.title LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (status !== 'All') {
            query += ` AND a.status = ?`;
            params.push(status);
        }

        if (job_id && job_id !== 'All') {
            query += ` AND j.id = ?`;
            params.push(job_id);
        }

        // Count query for pagination
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM applicants a
            JOIN jobs j ON a.job_id = j.id
            WHERE j.user_id = ?
            ${search ? ` AND (a.name LIKE ? OR a.email LIKE ? OR j.title LIKE ?)` : ''}
            ${status !== 'All' ? ` AND a.status = ?` : ''}
            ${(job_id && job_id !== 'All') ? ` AND j.id = ?` : ''}
        `;
        const [countResult] = await pool.execute(countQuery, params);
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        // Add ordering and pagination
        query += ` ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
        params.push(limit.toString(), offset.toString());

        const [rows] = await pool.execute(query, params);

        return {
            applicants: rows,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages
            }
        };
    }

    static async findById(id, userId) {
        const query = `
            SELECT a.*, 
                   j.title as job_title, 
                   j.department, 
                   j.application_fields,
                   a.job_id,
                   COALESCE(NULLIF(NULLIF(a.interview_rounds, ''), '[]'), j.interview_rounds) as interview_rounds
            FROM applicants a
            JOIN jobs j ON a.job_id = j.id
            WHERE a.id = ? AND j.user_id = ?
        `;
        const [rows] = await pool.execute(query, [id, userId]);
        return rows[0];
    }

    static async updateStatus(id, userId, statusData) {
        const { status, current_round_index, interview_feedback, name, email, phone, interview_rounds } = statusData;

        // Build dynamic update query
        let fields = [];
        let params = [];

        if (status !== undefined) { fields.push('a.status = ?'); params.push(status); }
        if (current_round_index !== undefined) { fields.push('a.current_round_index = ?'); params.push(current_round_index); }
        if (name !== undefined) { fields.push('a.name = ?'); params.push(name); }
        if (email !== undefined) { fields.push('a.email = ?'); params.push(email); }
        if (phone !== undefined) { fields.push('a.phone = ?'); params.push(phone); }
        if (interview_feedback !== undefined) {
            fields.push('a.interview_feedback = ?');
            // Handle empty strings - convert to null for JSON column
            if (interview_feedback === '' || interview_feedback === null) {
                params.push(null);
            } else {
                params.push(typeof interview_feedback === 'string' ? interview_feedback : JSON.stringify(interview_feedback));
            }
        }
        if (interview_rounds !== undefined) {
            fields.push('a.interview_rounds = ?');
            params.push(typeof interview_rounds === 'string' ? interview_rounds : JSON.stringify(interview_rounds));
        }

        if (fields.length === 0) return false;

        const query = `
            UPDATE applicants a
            JOIN jobs j ON a.job_id = j.id
            SET ${fields.join(', ')}
            WHERE a.id = ? AND j.user_id = ?
        `;
        params.push(id, userId);

        const [result] = await pool.execute(query, params);
        return result.affectedRows > 0;
    }

    static async getStats(userId) {
        const query = `
            SELECT 
                COUNT(*) as total_applicants,
                SUM(CASE WHEN a.status = 'Selected' THEN 1 ELSE 0 END) as selected,
                SUM(CASE WHEN a.status = 'Rejected' THEN 1 ELSE 0 END) as rejected,
                SUM(CASE WHEN a.status NOT IN ('Selected', 'Rejected', 'Applied') THEN 1 ELSE 0 END) as in_process
            FROM applicants a
            JOIN jobs j ON a.job_id = j.id
            WHERE j.user_id = ?
        `;
        const [rows] = await pool.execute(query, [userId]);
        return rows[0];
    }

    static async delete(id, userId) {
        const query = `
            DELETE a FROM applicants a
            JOIN jobs j ON a.job_id = j.id
            WHERE a.id = ? AND j.user_id = ?
        `;
        const [result] = await pool.execute(query, [id, userId]);
        return result.affectedRows > 0;
    }
}

module.exports = Applicant;
