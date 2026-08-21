const { pool } = require('../config/db');
const crypto = require('crypto');

class Job {
    static async create(jobData) {
        const {
            user_id,
            title,
            department,
            location,
            type,
            positions,
            description,
            responsibilities,
            requirements,
            status,
            posted_date,
            interview_rounds,
            application_fields
        } = jobData;

        // Generate SEO-friendly slug with unique hash
        const slug = (title || 'job')
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
        const uniqueHash = crypto.randomBytes(3).toString('hex');
        const application_link = `${slug}-${uniqueHash}`;

        const query = `
      INSERT INTO jobs (
        user_id, title, department, location, type, 
        positions, description, responsibilities, requirements, status, posted_date,
        application_link, interview_rounds, application_fields
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        const [result] = await pool.execute(query, [
            user_id, title, department, location, type,
            positions, description,
            JSON.stringify(responsibilities || []),
            JSON.stringify(requirements || []),
            status, posted_date,
            application_link,
            JSON.stringify(interview_rounds || []),
            JSON.stringify(application_fields || [])
        ]);

        return result.insertId;
    }

    static async findAll(userId, { page = 1, limit = 10, search = '', status = 'All', department = '', type = '' }) {
        const offset = (page - 1) * limit;
        let query = `
            SELECT j.*, 
                   (SELECT COUNT(*) FROM applicants WHERE job_id = j.id) as applicants 
            FROM jobs j 
            WHERE j.user_id = ?
        `;
        const params = [userId];

        if (search) {
            query += ` AND (j.title LIKE ? OR j.department LIKE ? OR j.location LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (status !== 'All') {
            query += ` AND j.status = ?`;
            params.push(status);
        }

        if (department) {
            query += ` AND j.department = ?`;
            params.push(department);
        }

        if (type) {
            query += ` AND j.type = ?`;
            params.push(type);
        }

        // Count query for pagination
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM jobs 
            WHERE user_id = ? 
            ${search ? ` AND (title LIKE ? OR department LIKE ? OR location LIKE ?)` : ''} 
            ${status !== 'All' ? ` AND status = ?` : ''}
            ${department ? ` AND department = ?` : ''}
            ${type ? ` AND type = ?` : ''}
        `;
        const countParams = [userId];
        if (search) countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        if (status !== 'All') countParams.push(status);
        if (department) countParams.push(department);
        if (type) countParams.push(type);

        const [countResult] = await pool.execute(countQuery, countParams);
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        // Add ordering and pagination
        query += ` ORDER BY j.created_at DESC LIMIT ? OFFSET ?`;
        params.push(limit.toString(), offset.toString());

        const [rows] = await pool.execute(query, params);

        // Parse JSON fields
        const parsedRows = rows.map(job => ({
            ...job,
            responsibilities: typeof job.responsibilities === 'string' ? JSON.parse(job.responsibilities) : (job.responsibilities || []),
            requirements: typeof job.requirements === 'string' ? JSON.parse(job.requirements) : (job.requirements || []),
            interview_rounds: typeof job.interview_rounds === 'string' ? JSON.parse(job.interview_rounds) : (job.interview_rounds || []),
            application_fields: typeof job.application_fields === 'string' ? JSON.parse(job.application_fields) : (job.application_fields || [])
        }));

        return {
            jobs: parsedRows,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages
            }
        };
    }

    static async findById(id, userId) {
        let query;
        let params;
        if (userId) {
            query = `
                SELECT j.*, COUNT(a.id) as applicants 
                FROM jobs j 
                LEFT JOIN applicants a ON j.id = a.job_id 
                WHERE j.id = ? AND j.user_id = ?
                GROUP BY j.id
            `;
            params = [id, userId];
        } else {
            query = `
                SELECT j.*, COUNT(a.id) as applicants 
                FROM jobs j 
                LEFT JOIN applicants a ON j.id = a.job_id 
                WHERE j.id = ?
                GROUP BY j.id
            `;
            params = [id];
        }
        const [rows] = await pool.execute(query, params);
        if (!rows[0]) return null;

        const job = rows[0];
        return {
            ...job,
            responsibilities: typeof job.responsibilities === 'string' ? JSON.parse(job.responsibilities) : (job.responsibilities || []),
            requirements: typeof job.requirements === 'string' ? JSON.parse(job.requirements) : (job.requirements || []),
            interview_rounds: typeof job.interview_rounds === 'string' ? JSON.parse(job.interview_rounds) : (job.interview_rounds || []),
            application_fields: typeof job.application_fields === 'string' ? JSON.parse(job.application_fields) : (job.application_fields || [])
        };
    }

    static async findByLink(link) {
        const query = `
            SELECT j.*, 
                   b.company_name, b.logo_url, b.industry, b.city as business_city, b.country as business_country, b.email as business_email,
                   (SELECT COUNT(*) FROM applicants WHERE job_id = j.id) as applicants 
            FROM jobs j 
            LEFT JOIN business_info b ON j.user_id = b.user_id
            WHERE j.application_link = ?
        `;
        const [rows] = await pool.execute(query, [link]);
        if (!rows[0]) return null;

        const job = rows[0];
        return {
            ...job,
            responsibilities: typeof job.responsibilities === 'string' ? JSON.parse(job.responsibilities) : (job.responsibilities || []),
            requirements: typeof job.requirements === 'string' ? JSON.parse(job.requirements) : (job.requirements || []),
            interview_rounds: typeof job.interview_rounds === 'string' ? JSON.parse(job.interview_rounds) : (job.interview_rounds || []),
            application_fields: typeof job.application_fields === 'string' ? JSON.parse(job.application_fields) : (job.application_fields || [])
        };
    }

    static async update(id, userId, jobData) {
        const {
            title,
            department,
            location,
            type,
            positions,
            description,
            responsibilities,
            requirements,
            status,
            interview_rounds,
            application_fields
        } = jobData;

        // Build dynamic update query
        let fields = [];
        let params = [];

        if (title !== undefined) { fields.push('title = ?'); params.push(title); }
        if (department !== undefined) { fields.push('department = ?'); params.push(department); }
        if (location !== undefined) { fields.push('location = ?'); params.push(location); }
        if (type !== undefined) { fields.push('type = ?'); params.push(type); }
        if (positions !== undefined) { fields.push('positions = ?'); params.push(positions); }
        if (description !== undefined) { fields.push('description = ?'); params.push(description); }
        if (responsibilities !== undefined) { fields.push('responsibilities = ?'); params.push(JSON.stringify(responsibilities)); }
        if (requirements !== undefined) { fields.push('requirements = ?'); params.push(JSON.stringify(requirements)); }
        if (status !== undefined) { fields.push('status = ?'); params.push(status); }
        if (interview_rounds !== undefined) { fields.push('interview_rounds = ?'); params.push(JSON.stringify(interview_rounds)); }
        if (application_fields !== undefined) { fields.push('application_fields = ?'); params.push(JSON.stringify(application_fields)); }

        if (fields.length === 0) return false;

        const query = `UPDATE jobs SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`;
        params.push(id, userId);

        const [result] = await pool.execute(query, params);
        return result.affectedRows > 0;
    }

    static async delete(id, userId) {
        const query = `DELETE FROM jobs WHERE id = ? AND user_id = ?`;
        const [result] = await pool.execute(query, [id, userId]);
        return result.affectedRows > 0;
    }

    static async getStats(userId) {
        const query = `
      SELECT 
        COUNT(*) as total_jobs,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_jobs,
        SUM(positions) as total_positions,
        (SELECT COUNT(*) FROM applicants a JOIN jobs j ON a.job_id = j.id WHERE j.user_id = ?) as total_applicants
      FROM jobs
      WHERE user_id = ?
    `;
        const [rows] = await pool.execute(query, [userId, userId]);
        return rows[0];
    }
}

module.exports = Job;

