const { pool } = require('../config/db');

const Employee = {
    create: async (data, userId) => {
        const {
            employee_name, profile_picture, date_of_birth, age, gender,
            father_name, mother_name, marital_status, joining_date,
            department_id, designation_id, shift_id, employee_type, work_type,
            mobile_number, alternate_mobile_number, email,
            work_email, work_mobile_number, linkedin_url, skype_id,
            permanent_address, correspondence_address,
            permanent_address_l1, permanent_address_l2, permanent_address_l3,
            permanent_city, permanent_state, permanent_country, permanent_pincode,
            correspondence_city,
            emergency_contact_person, emergency_contact_number,
            blood_group, languages, education, aadhar_number, pan_number,
            aadhar_front, aadhar_back, pan_card,
            ifsc_code, account_number, account_holder_name, branch_name,
            cancelled_cheque, username, password, status, permissions
        } = data;

        // Generate unique employee_id for all users
        const [rows] = await pool.query('SELECT employee_id FROM employees ORDER BY id DESC LIMIT 1');
        let newId = 'EMP10001';
        if (rows.length > 0 && rows[0].employee_id) {
            const lastId = rows[0].employee_id;
            const numericPart = parseInt(lastId.substring(3));
            const nextNum = numericPart + 1;
            newId = `EMP${nextNum}`;
        }

        const [result] = await pool.query(
            `INSERT INTO employees (
                employee_id, employee_name, profile_picture, date_of_birth, age, gender,
                father_name, mother_name, marital_status, joining_date,
                department_id, designation_id, shift_id, employee_type, work_type,
                mobile_number, alternate_mobile_number, email,
                work_email, work_mobile_number, linkedin_url, skype_id,
                permanent_address, correspondence_address,
                permanent_address_l1, permanent_address_l2, permanent_address_l3,
                permanent_city, permanent_state, permanent_country, permanent_pincode,
                correspondence_city,
                emergency_contact_person, emergency_contact_number,
                blood_group, languages, education, aadhar_number, pan_number,
                aadhar_front, aadhar_back, pan_card,
                ifsc_code, account_number, account_holder_name, branch_name,
                cancelled_cheque, username, password, status, user_id, permissions
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                newId, employee_name, profile_picture, date_of_birth, age, gender,
                father_name, mother_name, marital_status, joining_date,
                department_id, designation_id, shift_id, employee_type, work_type,
                mobile_number, alternate_mobile_number, email,
                work_email, work_mobile_number, linkedin_url, skype_id,
                permanent_address, correspondence_address,
                permanent_address_l1, permanent_address_l2, permanent_address_l3,
                permanent_city, permanent_state, permanent_country, permanent_pincode,
                correspondence_city,
                emergency_contact_person, emergency_contact_number,
                blood_group, languages, (typeof education === 'object' ? JSON.stringify(education || []) : (education || '[]')), aadhar_number, pan_number,
                aadhar_front, aadhar_back, pan_card,
                ifsc_code, account_number, account_holder_name, branch_name,
                cancelled_cheque, username, password, status, userId, (typeof permissions === 'object' ? JSON.stringify(permissions || []) : (permissions || '[]'))
            ]
        );
        return result.insertId;
    },

    findAll: async (userId, page = 1, limit = 10, status = 'All', search = '') => {
        const offset = (page - 1) * limit;
        let query = `
            SELECT e.*, 
            d.department_name, d.department_id as department_uid,
            deg.designation_name, deg.designation_id as designation_uid,
            s.shift_name,
            t.team_name as assigned_team_name,
            (
                SELECT IFNULL(ROUND((SUM(CASE WHEN tag = 'Closed' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1), 0)
                FROM leads
                WHERE assigned_to = e.id
            ) as conversion_rate
            FROM employees e 
            LEFT JOIN departments d ON e.department_id = d.id 
            LEFT JOIN designations deg ON e.designation_id = deg.id
            LEFT JOIN shifts s ON e.shift_id = s.id
            LEFT JOIN team_members tm ON e.id = tm.employee_id
            LEFT JOIN teams t ON tm.team_id = t.id
            WHERE e.user_id = ?
        `;
        let countQuery = 'SELECT COUNT(*) as total FROM employees e WHERE e.user_id = ?';
        let queryParams = [userId];

        if (status !== 'All') {
            query += ' AND e.status = ?';
            countQuery += ' AND e.status = ?';
            queryParams.push(status);
        }

        if (search) {
            const searchPattern = `%${search}%`;
            query += ' AND (e.employee_name LIKE ? OR e.employee_id LIKE ? OR e.email LIKE ? OR e.mobile_number LIKE ?)';
            countQuery += ' AND (e.employee_name LIKE ? OR e.employee_id LIKE ? OR e.email LIKE ? OR e.mobile_number LIKE ?)';
            queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }

        query += ' ORDER BY e.id DESC LIMIT ? OFFSET ?';
        let countParams = queryParams;

        queryParams = [...queryParams, parseInt(limit), parseInt(offset)];

        const [totalRows] = await pool.query(countQuery, countParams);
        const total = totalRows[0].total;

        const [rows] = await pool.query(query, queryParams);

        return {
            employees: rows,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        };
    },

    findById: async (id, userId) => {
        const [rows] = await pool.query(`
            SELECT e.*, 
            d.department_name, d.department_id as department_uid,
            deg.designation_name, deg.designation_id as designation_uid,
            s.shift_name
            FROM employees e 
            LEFT JOIN departments d ON e.department_id = d.id 
            LEFT JOIN designations deg ON e.designation_id = deg.id
            LEFT JOIN shifts s ON e.shift_id = s.id
            WHERE e.id = ? AND e.user_id = ?
        `, [id, userId]);
        return rows[0];
    },

    update: async (id, data, userId) => {
        const payload = data || {};
        const forbiddenFields = [
            'id', 'employee_id', 'user_id', 'department_name', 'department_uid', 'designation_name', 'designation_uid',
            'employeeId', 'joiningDate', 'firstName', 'lastName', 'createdAt', 'updatedAt'
        ];
        const fields = Object.keys(payload).filter(key => !forbiddenFields.includes(key));
        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const values = fields.map(field => {
            const val = payload[field];
            return (typeof val === 'object' && val !== null) ? JSON.stringify(val) : val;
        });

        if (fields.length === 0) return;

        await pool.query(
            `UPDATE employees SET ${setClause} WHERE id = ? AND user_id = ?`,
            [...values, id, userId]
        );
    },

    delete: async (id, userId) => {
        await pool.query('DELETE FROM employees WHERE id = ? AND user_id = ?', [id, userId]);
    },

    findByUsername: async (username) => {
        const [rows] = await pool.query('SELECT * FROM employees WHERE username = ?', [username]);
        return rows[0];
    }
};

module.exports = Employee;
