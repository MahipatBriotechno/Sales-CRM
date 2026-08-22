const { pool } = require('../config/db');

class OfferLetter {
    static async create(data) {
        const {
            user_id, employee_id, candidate_name, email, phone,
            designation, department, basic_salary, allowances,
            deductions, net_salary, joining_date, notice_period, offer_date,
            status, address, reference_no, salary_model, annual_ctc,
            company_info, candidate_details, offer_details, salary_structure,
            documents_required,
            acceptance_details, legal_disclaimer, custom_fields,
            output_control, version_number, revision_history
        } = data;

        const query = `
            INSERT INTO offer_letters (
                user_id, employee_id, candidate_name, email, phone,
                designation, department, basic_salary, allowances,
                deductions, net_salary, joining_date, notice_period, offer_date,
                status, address, reference_no, salary_model, annual_ctc,
                company_info, candidate_details, offer_details, salary_structure,
                documents_required,
                acceptance_details, legal_disclaimer, custom_fields,
                output_control, version_number, revision_history
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await pool.execute(query, [
            user_id || null,
            employee_id || null,
            candidate_name || null,
            email || null,
            phone || null,
            designation || null,
            department || null,
            basic_salary || 0,
            JSON.stringify(allowances || []),
            JSON.stringify(deductions || []),
            net_salary || 0,
            joining_date || null,
            data.notice_period || null,
            offer_date || null,
            status || 'Draft',
            address || null,
            reference_no || null,
            salary_model || 'Structured',
            annual_ctc || 0,
            JSON.stringify(company_info || {}),
            JSON.stringify(candidate_details || {}),
            JSON.stringify(offer_details || {}),
            JSON.stringify(salary_structure || {}),
            JSON.stringify(documents_required || []),
            JSON.stringify(acceptance_details || {}),
            JSON.stringify(legal_disclaimer || {}),
            JSON.stringify(custom_fields || []),
            JSON.stringify(output_control || {}),
            version_number || 1,
            JSON.stringify(revision_history || [])
        ]);

        return result.insertId;
    }

    static async findAll(userId, { page = 1, limit = 10, search = '', status = 'All', department = '', designation = '', employment_type = '', salary_model = '' }) {
        const offset = (page - 1) * limit;
        let query = `SELECT * FROM offer_letters WHERE user_id = ?`;
        const params = [userId];

        if (status !== 'All') {
            query += ` AND status = ?`;
            params.push(status);
        }

        if (department) {
            query += ` AND department = ?`;
            params.push(department);
        }

        if (designation) {
            query += ` AND designation = ?`;
            params.push(designation);
        }

        if (salary_model) {
            query += ` AND salary_model = ?`;
            params.push(salary_model);
        }

        if (employment_type) {
            query += ` AND JSON_EXTRACT(candidate_details, '$.employment_type') = ?`;
            params.push(employment_type);
        }

        if (search) {
            query += ` AND (candidate_name LIKE ? OR email LIKE ? OR designation LIKE ? OR reference_no LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }

        const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
        const [countResult] = await pool.execute(countQuery, params);
        const total = countResult[0].total;

        query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        params.push(limit.toString(), offset.toString());

        const [rows] = await pool.execute(query, params);

        return {
            offerLetters: rows.map(row => this.parseJsonFields(row)),
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    static async findById(id, userId) {
        const query = `SELECT * FROM offer_letters WHERE id = ? AND user_id = ?`;
        const [rows] = await pool.execute(query, [id, userId]);
        if (rows[0]) {
            return this.parseJsonFields(rows[0]);
        }
        return null;
    }

    static async update(id, userId, data) {
        const fields = [];
        const params = [];

        const jsonFields = [
            'allowances', 'deductions', 'company_info', 'candidate_details',
            'offer_details', 'salary_structure',
            'documents_required', 'acceptance_details',
            'legal_disclaimer', 'custom_fields', 'output_control', 'revision_history'
        ];

        const directFields = [
            'employee_id', 'candidate_name', 'email', 'phone', 'designation', 'department',
            'basic_salary', 'net_salary', 'joining_date', 'notice_period', 'offer_date',
            'status', 'address', 'reference_no', 'salary_model', 'annual_ctc',
            'version_number'
        ];

        Object.keys(data).forEach(key => {
            if (directFields.includes(key)) {
                fields.push(`${key} = ?`);
                params.push(data[key] === undefined ? null : data[key]);
            } else if (jsonFields.includes(key)) {
                fields.push(`${key} = ?`);
                params.push(data[key] === undefined ? JSON.stringify({}) : JSON.stringify(data[key]));
            }
        });

        if (fields.length === 0) return false;

        params.push(id, userId);
        const query = `UPDATE offer_letters SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`;
        const [result] = await pool.execute(query, params);
        return result.affectedRows > 0;
    }

    static async delete(id, userId) {
        const query = `DELETE FROM offer_letters WHERE id = ? AND user_id = ?`;
        const [result] = await pool.execute(query, [id, userId]);
        return result.affectedRows > 0;
    }

    static parseJsonFields(row) {
        const jsonFields = [
            'allowances', 'deductions', 'company_info', 'candidate_details',
            'offer_details', 'salary_structure',
            'documents_required', 'acceptance_details',
            'legal_disclaimer', 'custom_fields', 'output_control', 'revision_history'
        ];

        const parsedRow = { ...row };
        jsonFields.forEach(field => {
            if (parsedRow[field]) {
                try {
                    parsedRow[field] = typeof parsedRow[field] === 'string' ? JSON.parse(parsedRow[field]) : parsedRow[field];
                } catch (e) {
                    parsedRow[field] = field === 'documents_required' || field === 'custom_fields' || field === 'allowances' || field === 'deductions' || field === 'revision_history' ? [] : {};
                }
            } else {
                parsedRow[field] = field === 'documents_required' || field === 'custom_fields' || field === 'allowances' || field === 'deductions' || field === 'revision_history' ? [] : {};
            }
        });
        return parsedRow;
    }
}

module.exports = OfferLetter;
