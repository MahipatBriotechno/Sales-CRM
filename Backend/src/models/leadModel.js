const { pool } = require('../config/db');

const Lead = {
    create: async (data, userId) => {
        let {
            name, mobile_number, email, value, pipeline_id, stage_id,
            status, type, tag, location,
            lead_source, visibility,
            full_name, gender, dob, alt_mobile_number, address, city, state, pincode, interested_in,
            profile_image, whatsapp_number, country,
            organization_name, industry_type, website, company_email, company_phone, gst_pan_number, gst_number,
            org_address, org_city, org_state, org_pincode, company_address, org_country,
            primary_contact_name, primary_dob, designation, primary_mobile, primary_email,
            description, owner, assigned_to, owner_name, referral_mobile, custom_fields, contact_persons, lead_owner, assigner_name
        } = data;

        // Sanitize Date Fields
        if (!dob) dob = null;
        if (!primary_dob) primary_dob = null;

        // Normalize type: 'Person' -> 'Individual' for consistency
        if (type === 'Person') type = 'Individual';

        // If pipeline_id or stage_id is missing, handle default
        if (!pipeline_id || !stage_id) {
            let [pipes] = await pool.query('SELECT id FROM pipelines WHERE user_id = ? AND name = ? LIMIT 1', [userId, 'Default Pipeline']);
            let targetPipelineId = pipeline_id || (pipes.length > 0 ? pipes[0].id : null);

            if (!targetPipelineId) {
                // Create Default Pipeline with new requested stages
                const [result] = await pool.query(
                    'INSERT INTO pipelines (name, status, description, user_id) VALUES (?, ?, ?, ?)',
                    ['Default Pipeline', 'Active', 'Automatically assigned pipeline for unqualified leads', userId]
                );
                targetPipelineId = result.insertId;

                const stages = [
                    ['Lead Created (Unqualified)', 'Initial entry point for all leads', 20, 0, 0],
                    ['Minimum Info Pending', 'Waiting for Name and Contact Number', 40, 0, 1],
                    ['Contact Attempted', 'At least one contact attempt logged', 60, 0, 2],
                    ['Identify Interest', 'Identify services or requirement', 80, 0, 3],
                    ['Select Pipeline', 'Move to specialized sales pipeline', 100, 1, 4]
                ];

                const stageValues = stages.map(s => [targetPipelineId, ...s]);
                await pool.query(
                    'INSERT INTO pipeline_stages (pipeline_id, name, description, probability, is_final, stage_order) VALUES ?',
                    [stageValues]
                );
            }

            pipeline_id = targetPipelineId;

            if (!stage_id) {
                const [stgs] = await pool.query(
                    'SELECT id, name FROM pipeline_stages WHERE pipeline_id = ? ORDER BY stage_order ASC',
                    [pipeline_id]
                );

                // Automatic Stage Selection Logic for new leads in Default Pipeline
                const [pipeInfo] = await pool.query('SELECT name FROM pipelines WHERE id = ?', [pipeline_id]);
                if (pipeInfo.length > 0 && pipeInfo[0].name === 'Default Pipeline' && stgs.length >= 2) {
                    const hasBasicInfo = name && mobile_number;
                    // If name and number are present, skip "Minimum Info Pending" (Stage 2) and go to "Contact Attempted" (Stage 3)?
                    // Or just stay at Stage 1? The requirement says Stage 2 auto-completes.
                    // Let's land on Stage 3 if info is there, otherwise Stage 2.
                    if (hasBasicInfo) {
                        stage_id = stgs[2].id; // Contact Attempted (waiting for the actually attempt, but Step 2 is done)
                    } else {
                        stage_id = stgs[1].id; // Minimum Info Pending
                    }
                } else {
                    stage_id = stgs.length > 0 ? stgs[0].id : null;
                }
            }
        }

        // Generate Lead ID (e.g. L001)
        const [rows] = await pool.query('SELECT lead_id FROM leads WHERE user_id = ? ORDER BY id DESC LIMIT 1', [userId]);
        let nextId = 'L001';
        if (rows.length > 0 && rows[0].lead_id) {
            const lastId = rows[0].lead_id;
            const num = parseInt(lastId.substring(1)) + 1;
            nextId = 'L' + num.toString().padStart(3, '0');
        }

        // Check for duplicate mobile number
        if (mobile_number) {
            const [duplicates] = await pool.query(
                'SELECT id, lead_id FROM leads WHERE user_id = ? AND mobile_number = ? LIMIT 1',
                [userId, mobile_number]
            );
            if (duplicates.length > 0) {
                tag = 'Duplicate';
                const reason = `Mobile number already exists (Lead ID: ${duplicates[0].lead_id})`;
                data.duplicate_reason = reason;
                // Record duplicate reason on existing lead without changing its status/tag
                await pool.query(
                    'UPDATE leads SET duplicate_reason = ? WHERE mobile_number = ? AND user_id = ?',
                    [`Mobile number duplicated by new Lead: ${nextId}`, mobile_number, userId]
                );
            }
        }

        // Handle custom_fields and contact_persons - ensure they're JSON strings
        const customFieldsJson = typeof custom_fields === 'string' ? custom_fields : JSON.stringify(custom_fields || []);
        const contactPersonsJson = typeof contact_persons === 'string' ? contact_persons : JSON.stringify(contact_persons || []);

        const nextCallDate = data.next_call_at ? new Date(data.next_call_at) : null;

        const [result] = await pool.query(
            `INSERT INTO leads (
                lead_id, name, mobile_number, email, value, pipeline_id, stage_id, 
                status, type, tag, duplicate_reason, location, user_id,
                lead_source, visibility,
                full_name, gender, dob, alt_mobile_number, address, city, state, pincode, interested_in,
                profile_image, whatsapp_number, country,
                organization_name, industry_type, website, company_email, company_phone, gst_pan_number, gst_number,
                org_address, org_city, org_state, org_pincode, company_address, org_country,
                primary_contact_name, primary_dob, designation, primary_mobile, primary_email,
                description, assigned_to, owner_name, referral_mobile, custom_fields, contact_persons, lead_owner, assigner_name, next_call_at, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nextId, name, mobile_number, email, value || 0, pipeline_id, stage_id,
                status || 'Open', type || 'Individual', tag || 'New Lead', data.duplicate_reason || null, location, userId,
                lead_source, visibility,
                full_name, gender, dob, alt_mobile_number, address, city, state, pincode, interested_in,
                profile_image, whatsapp_number, country,
                organization_name, industry_type, website, company_email, company_phone, gst_pan_number || gst_number, gst_number,
                org_address || company_address, org_city, org_state, org_pincode, company_address, org_country,
                primary_contact_name, primary_dob, designation, primary_mobile, primary_email,
                description, owner || assigned_to, owner_name, referral_mobile, customFieldsJson, contactPersonsJson, lead_owner || null, assigner_name || null,
                nextCallDate, data.created_at ? new Date(data.created_at) : new Date()
            ]
        );
        return result.insertId;
    },

    bulkCreate: async (leadsArray, userId) => {
        if (!leadsArray || leadsArray.length === 0) return 0;

        // 1. Get default pipeline/stage once if needed
        let [pipes] = await pool.query('SELECT id FROM pipelines WHERE user_id = ? ORDER BY id ASC LIMIT 1', [userId]);
        let defaultPipelineId = pipes.length > 0 ? pipes[0].id : null;
        let defaultStageId = null;

        if (defaultPipelineId) {
            const [stgs] = await pool.query('SELECT id FROM pipeline_stages WHERE pipeline_id = ? ORDER BY stage_order ASC LIMIT 1', [defaultPipelineId]);
            defaultStageId = stgs.length > 0 ? stgs[0].id : null;
        }

        // 2. Prepare Lead ID sequence
        const [rows] = await pool.query('SELECT lead_id FROM leads WHERE user_id = ? ORDER BY id DESC LIMIT 1', [userId]);
        let lastIdNum = 0;
        if (rows.length > 0 && rows[0].lead_id) {
            lastIdNum = parseInt(rows[0].lead_id.substring(1)) || 0;
        }

        // Fetch existing mobile numbers for duplicate check
        // Fetch existing numbers with their lead IDs for better duplicate reason
        const [existingLeads] = await pool.query('SELECT mobile_number, lead_id FROM leads WHERE user_id = ?', [userId]);
        const existingNumbersMap = new Map(existingLeads.map(l => [l.mobile_number, l.lead_id]));

        const values = leadsArray.map((data, index) => {
            let {
                name, mobile_number, email, value, pipeline_id, stage_id,
                status, type, tag, location, lead_source, visibility,
                full_name, gender, dob, alt_mobile_number, address, city, state, pincode, interested_in,
                profile_image, whatsapp_number, country,
                organization_name, industry_type, website, company_email, company_phone, gst_pan_number, gst_number,
                org_address, org_city, org_state, org_pincode, company_address, org_country,
                primary_contact_name, primary_dob, designation, primary_mobile, primary_email,
                description, owner, assigned_to, owner_name, referral_mobile, custom_fields, contact_persons, lead_owner, assigner_name
            } = data;

            if (!dob) dob = null;
            if (!primary_dob) primary_dob = null;

            const nextId = 'L' + (lastIdNum + index + 1).toString().padStart(3, '0');
            const customFieldsJson = typeof custom_fields === 'string' ? custom_fields : JSON.stringify(custom_fields || []);
            const contactPersonsJson = typeof contact_persons === 'string' ? contact_persons : JSON.stringify(contact_persons || []);

            const leadIdFromMap = mobile_number ? existingNumbersMap.get(mobile_number) : null;
            const isDuplicate = !!leadIdFromMap;
            const finalTag = isDuplicate ? 'Duplicate' : (tag || 'New Lead');
            const dupReason = isDuplicate ? `Mobile number already exists (Lead ID: ${leadIdFromMap})` : null;

            return [
                nextId, name || full_name, mobile_number, email, value || 0, pipeline_id || defaultPipelineId, stage_id || defaultStageId,
                status || 'Open', type || 'Individual', finalTag, dupReason, location, userId,
                lead_source || 'Bulk Upload', visibility || 'Public',
                full_name || name, gender, dob, alt_mobile_number, address || company_address, city, state, pincode, interested_in,
                profile_image, whatsapp_number, country,
                organization_name, industry_type, website, company_email, company_phone, gst_pan_number || gst_number, gst_number,
                org_address || company_address, org_city, org_state, org_pincode, company_address, org_country,
                primary_contact_name, primary_dob, designation, primary_mobile, primary_email,
                description, owner || assigned_to, owner_name, referral_mobile, customFieldsJson, contactPersonsJson, lead_owner || null, assigner_name || null,
                data.next_call_at ? new Date(data.next_call_at) : null,
                data.created_at ? new Date(data.created_at) : new Date()
            ];
        });

        const [result] = await pool.query(
            `INSERT INTO leads (
                lead_id, name, mobile_number, email, value, pipeline_id, stage_id, 
                status, type, tag, duplicate_reason, location, user_id,
                lead_source, visibility,
                full_name, gender, dob, alt_mobile_number, address, city, state, pincode, interested_in,
                profile_image, whatsapp_number, country,
                organization_name, industry_type, website, company_email, company_phone, gst_pan_number, gst_number,
                org_address, org_city, org_state, org_pincode, company_address, org_country,
                primary_contact_name, primary_dob, designation, primary_mobile, primary_email,
                description, assigned_to, owner_name, referral_mobile, custom_fields, contact_persons, lead_owner, assigner_name, next_call_at, created_at
            ) VALUES ?`,
            [values]
        );

        // Update existing leads that now have duplicates
        const duplicateMobileNumbers = leadsArray
            .filter((_, idx) => values[idx][9] === 'Duplicate')
            .map(l => l.mobile_number)
            .filter(Boolean);

        if (duplicateMobileNumbers.length > 0) {
            await pool.query(
                'UPDATE leads SET duplicate_reason = "Duplicated during bulk entry/matching" WHERE user_id = ? AND mobile_number IN (?)',
                [userId, duplicateMobileNumbers]
            );
        }

        // Log activities for each lead
        const LeadResources = require('./leadResourcesModel');
        const [newLeads] = await pool.query(
            'SELECT id, name, next_call_at FROM leads WHERE user_id = ? AND created_at >= NOW() - INTERVAL 1 MINUTE',
            [userId]
        );

        for (const lead of newLeads) {
            await LeadResources.addActivity({
                lead_id: lead.id,
                activity_type: 'notification',
                title: 'New Lead Created',
                description: `Lead ${lead.name || 'New Lead'} was created via bulk import.`
            }, userId);

            if (lead.next_call_at) {
                await LeadResources.addActivity({
                    lead_id: lead.id,
                    activity_type: 'notification',
                    title: 'Follow-up Reminder Set',
                    description: `A follow-up task has been scheduled for ${new Date(lead.next_call_at).toLocaleString()}.`
                }, userId);
            }

            // Trigger Auto-Assignment for each lead
            const leadAssignmentService = require('../services/leadAssignmentService');
            await leadAssignmentService.autoAssign(lead.id, userId);
        }

        return result.affectedRows;
    },

    findAll: async (userId, page = 1, limit = 10, search = '', status = 'All', pipelineId = null, tag = null, type = null, subview = 'All', priority = 'All', services = 'All', dateFrom = null, dateTo = null, name = '', mobile_number = '') => {
        const offset = (page - 1) * limit;
        let query = `
            SELECT l.*, l.lead_owner, p.name as pipeline_name, s.name as stage_name, COALESCE(e.employee_name, l.assigned_to) as employee_name,
            (SELECT COUNT(*) FROM leads l2 WHERE l2.mobile_number = l.mobile_number AND l2.user_id = l.user_id AND l.mobile_number IS NOT NULL AND l.mobile_number != '') as duplicate_count
            FROM leads l
            LEFT JOIN pipelines p ON l.pipeline_id = p.id
            LEFT JOIN pipeline_stages s ON l.stage_id = s.id
            LEFT JOIN employees e ON (l.assigned_to = CAST(e.id AS CHAR) OR l.assigned_to = e.employee_id OR l.assigned_to = e.employee_name)
            WHERE l.user_id = ? AND l.is_deleted = 0
        `;
        const params = [userId];

        // Apply filters
        if (status && status !== 'All') { query += ' AND l.status = ?'; params.push(status); }
        if (tag && tag !== 'All') { query += ' AND l.tag = ?'; params.push(tag); }
        if (type && type !== 'All') { query += ' AND l.type = ?'; params.push(type); }
        if (pipelineId) { query += ' AND l.pipeline_id = ?'; params.push(pipelineId); }
        if (priority && priority !== 'All') { query += ' AND l.priority = ?'; params.push(priority); }
        if (services && services !== 'All') { query += ' AND l.interested_in = ?'; params.push(services); }
        if (dateFrom) { query += ' AND l.created_at >= ?'; params.push(dateFrom); }
        if (dateTo) { query += ' AND l.created_at <= ?'; params.push(dateTo + ' 23:59:59'); }
        if (name) { query += ' AND l.name LIKE ?'; params.push(`%${name}%`); }
        if (mobile_number) { query += ' AND l.mobile_number LIKE ?'; params.push(`%${mobile_number}%`); }

        if (search) {
            query += ' AND (l.name LIKE ? OR l.email LIKE ? OR l.mobile_number LIKE ?)';
            const term = `%${search}%`;
            params.push(term, term, term);
        }

        // Subview logic
        if (subview === 'new') {
            query += " AND (l.tag = 'Not Contacted' OR l.tag = 'Pass' OR l.created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 2 DAY) OR (l.tag = 'Not Connected' AND l.next_call_at <= UTC_TIMESTAMP()))";
        } else if (subview === 'not-connected') {
            query += " AND l.tag = 'Not Connected' AND (l.next_call_at IS NULL OR l.next_call_at > UTC_TIMESTAMP())";
        } else if (subview === 'follow-up') {
            query += " AND (l.tag = 'Follow Up' OR l.tag = 'Missed')";
        } else if (subview === 'missed') {
            query += " AND l.tag = 'Missed'";
        } else if (subview === 'assigned') {
            query += " AND l.assigned_to IS NOT NULL";
        } else if (subview === 'dropped') {
            query += " AND l.tag IN ('Lost', 'Dropped', 'Lost Lead')";
        } else if (subview === 'trending') {
            query += " AND (l.priority = 'High' OR l.is_trending = 1)";
        } else if (subview === 'won') {
            query += " AND (l.tag = 'Won' OR l.tag = 'Closed' OR s.name = 'Won')";
        } else if (subview === 'duplicates') {
            query += " AND l.tag = 'Duplicate'";
        }

        // Count query construction
        let countQuery = 'SELECT COUNT(*) as total FROM leads l LEFT JOIN pipeline_stages s ON l.stage_id = s.id WHERE l.user_id = ? AND l.is_deleted = 0';
        const countParams = [userId];

        if (status && status !== 'All') { countQuery += ' AND l.status = ?'; countParams.push(status); }
        if (tag && tag !== 'All') { countQuery += ' AND l.tag = ?'; countParams.push(tag); }
        if (type && type !== 'All') { countQuery += ' AND l.type = ?'; countParams.push(type); }
        if (pipelineId) { countQuery += ' AND l.pipeline_id = ?'; countParams.push(pipelineId); }
        if (priority && priority !== 'All') { countQuery += ' AND l.priority = ?'; countParams.push(priority); }
        if (services && services !== 'All') { countQuery += ' AND l.interested_in = ?'; countParams.push(services); }
        if (dateFrom) { countQuery += ' AND l.created_at >= ?'; countParams.push(dateFrom); }
        if (dateTo) { countQuery += ' AND l.created_at <= ?'; countParams.push(dateTo + ' 23:59:59'); }
        if (name) { countQuery += ' AND l.name LIKE ?'; countParams.push(`%${name}%`); }
        if (mobile_number) { countQuery += ' AND l.mobile_number LIKE ?'; countParams.push(`%${mobile_number}%`); }

        if (search) {
            countQuery += ' AND (l.name LIKE ? OR l.email LIKE ? OR l.mobile_number LIKE ?)';
            const term = `%${search}%`;
            countParams.push(term, term, term);
        }

        if (subview === 'new') { countQuery += " AND (l.tag = 'Not Contacted' OR l.tag = 'Pass' OR l.created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 2 DAY) OR (l.tag = 'Not Connected' AND l.next_call_at <= UTC_TIMESTAMP()))"; }
        else if (subview === 'not-connected') { countQuery += " AND l.tag = 'Not Connected' AND (l.next_call_at IS NULL OR l.next_call_at > UTC_TIMESTAMP())"; }
        else if (subview === 'follow-up') { countQuery += " AND (l.tag = 'Follow Up' OR l.tag = 'Missed')"; }
        else if (subview === 'missed') { countQuery += " AND l.tag = 'Missed'"; }
        else if (subview === 'assigned') { countQuery += " AND l.assigned_to IS NOT NULL"; }
        else if (subview === 'dropped') { countQuery += " AND l.tag IN ('Lost', 'Dropped', 'Lost Lead')"; }
        else if (subview === 'trending') { countQuery += " AND (l.priority = 'High' OR l.is_trending = 1)"; }
        else if (subview === 'won') { countQuery += " AND (l.tag = 'Won' OR l.tag = 'Closed' OR s.name = 'Won')"; }
        else if (subview === 'duplicates') { countQuery += " AND l.tag = 'Duplicate'"; }

        const [totalRows] = await pool.query(countQuery, countParams);
        const totalFiltered = totalRows[0].total;

        // Dashboard Summary Stats (scopeless to specific filters but within user_id)
        const [sumRows] = await pool.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN tag = 'Closed' THEN 1 ELSE 0 END) as converted,
                SUM(CASE WHEN tag = 'Lost' THEN 1 ELSE 0 END) as lost
            FROM leads WHERE user_id = ? AND is_deleted = 0
        `, [userId]);

        query += ' ORDER BY l.id DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [leads] = await pool.query(query, params);

        return {
            leads,
            pagination: {
                total: totalFiltered,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(totalFiltered / limit)
            },
            summary: sumRows[0]
        };
    },

    findById: async (id, userId) => {
        const [rows] = await pool.query(
            `SELECT l.*, l.lead_owner, p.name as pipeline_name, s.name as stage_name, COALESCE(e.employee_name, l.assigned_to) as employee_name,
             (SELECT COUNT(*) FROM leads l2 WHERE l2.mobile_number = l.mobile_number AND l2.user_id = l.user_id AND l.mobile_number IS NOT NULL AND l.mobile_number != '') as duplicate_count
             FROM leads l
             LEFT JOIN pipelines p ON l.pipeline_id = p.id
             LEFT JOIN pipeline_stages s ON l.stage_id = s.id
             LEFT JOIN employees e ON (l.assigned_to = CAST(e.id AS CHAR) OR l.assigned_to = e.employee_id OR l.assigned_to = e.employee_name)
             WHERE l.id = ? AND l.user_id = ? AND l.is_deleted = 0`,
            [id, userId]
        );
        return rows[0];
    },

    update: async (id, data, userId) => {
        // Fetch current lead data to check current tag and mobile number
        const [existingLeads] = await pool.query('SELECT mobile_number, tag, lead_id FROM leads WHERE id = ? AND user_id = ?', [id, userId]);
        if (existingLeads.length === 0) return;
        const currentLead = existingLeads[0];

        const allowedFields = [
            'name', 'mobile_number', 'email', 'value', 'pipeline_id', 'stage_id',
            'status', 'type', 'tag', 'location',
            'lead_source', 'visibility',
            'full_name', 'gender', 'dob', 'alt_mobile_number', 'address', 'city', 'state', 'pincode', 'interested_in',
            'profile_image', 'whatsapp_number', 'country',
            'organization_name', 'industry_type', 'website', 'company_email', 'company_phone', 'gst_pan_number', 'gst_number',
            'org_address', 'org_city', 'org_state', 'org_pincode', 'company_address', 'org_country',
            'primary_contact_name', 'primary_dob', 'designation', 'primary_mobile', 'primary_email',
            'description', 'assigned_to', 'assigned_at', 'is_read', 'priority', 'last_call_at', 'next_call_at', 'call_count',
            'not_connected_count', 'connected_count', 'drop_reason', 'call_success_rate',
            'follow_up_frequency', 'response_quality', 'conversion_probability', 'is_trending',
            'referral_mobile', 'custom_fields', 'contact_persons', 'owner_name', 'lead_owner', 'assigner_name', 'duplicate_reason', 'created_at'
        ];

        // Handle mobile_number change logic
        if (data.mobile_number && data.mobile_number !== currentLead.mobile_number) {
            const [duplicates] = await pool.query(
                'SELECT id, lead_id FROM leads WHERE user_id = ? AND mobile_number = ? AND id != ? LIMIT 1',
                [userId, data.mobile_number, id]
            );

            if (duplicates.length > 0) {
                data.tag = 'Duplicate';
                data.duplicate_reason = `Mobile number already exists (Lead ID: ${duplicates[0].lead_id})`;
            } else if (currentLead.tag === 'Duplicate') {
                // If it was a duplicate and now it's unique, change to New Lead
                data.tag = 'New Lead';
                data.duplicate_reason = null;
            }
        }

        const updates = [];
        const values = [];

        Object.keys(data).forEach(key => {
            if (allowedFields.includes(key)) {
                // Handle JSON fields
                if (key === 'custom_fields' || key === 'contact_persons') {
                    const jsonValue = typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key] || []);
                    updates.push(`${key} = ?`);
                    values.push(jsonValue);
                } else if ((key === 'next_call_at' || key === 'created_at') && data[key]) {
                    updates.push(`${key} = ?`);
                    values.push(new Date(data[key]));
                } else {
                    updates.push(`${key} = ?`);
                    values.push(data[key]);
                }
            } else if (key === 'owner') {
                updates.push('assigned_to = ?');
                values.push(data[key]);
            }
        });

        if (updates.length === 0) return;

        // If next_call_at is updated, and tag is not manually changed, 
        // ensure 'Missed' leads revert to 'Follow Up'
        if (data.next_call_at && !data.hasOwnProperty('tag')) {
            updates.push("tag = CASE WHEN tag = 'Missed' THEN 'Follow Up' ELSE tag END");
        }

        values.push(id, userId);
        await pool.query(
            `UPDATE leads SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
            values
        );

        // --- Post-update Automatic Stage Transition Logic for Default Pipeline ---
        // We fetch the latest state to decide if we need to bump the stage
        const [updatedLead] = await pool.query(`
            SELECT l.id, l.name, l.mobile_number, l.interested_in, l.pipeline_id, l.stage_id, p.name as pipeline_name 
            FROM leads l 
            LEFT JOIN pipelines p ON l.pipeline_id = p.id 
            WHERE l.id = ?
        `, [id]);

        if (updatedLead.length > 0 && updatedLead[0].pipeline_name === 'Default Pipeline') {
            const lead = updatedLead[0];
            const hasBasicInfo = lead.name && lead.mobile_number;
            const hasServices = lead.interested_in && lead.interested_in.trim().length > 0;

            const [stgs] = await pool.query(
                'SELECT id, stage_order FROM pipeline_stages WHERE pipeline_id = ? ORDER BY stage_order ASC',
                [lead.pipeline_id]
            );

            if (stgs.length >= 4) {
                let newStageId = lead.stage_id;

                // If we have services, we should be at least in "Identify Interest" (Stage 4)
                if (hasServices) {
                    newStageId = stgs[3].id;
                }
                // Else if we have basic info, we should be at least in "Contact Attempted" (Stage 3)
                // (Wait, Stage 3 technically requires a call, but Stage 2 "auto-completes" if info is there)
                else if (hasBasicInfo) {
                    // If current stage is Stage 1 or 2, move to Stage 3
                    const currentStage = stgs.find(s => s.id === lead.stage_id);
                    if (!currentStage || currentStage.stage_order < 2) {
                        newStageId = stgs[2].id;
                    }
                }

                if (newStageId && newStageId !== lead.stage_id) {
                    await pool.query('UPDATE leads SET stage_id = ? WHERE id = ?', [newStageId, id]);
                }
            }
        }
    },

    hitCall: async (id, status, nextCallAt, dropReason, userId, createReminder = false, notConnectedReason = null, remarks = null, priority = null, duration = null) => {
        const [lead] = await pool.query('SELECT * FROM leads WHERE id = ? AND user_id = ?', [id, userId]);
        if (!lead.length) throw new Error('Lead not found');

        let { call_count, not_connected_count, connected_count, tag } = lead[0];
        call_count++;

        // Ensure we don't pass undefined to SQL
        const safeReason = notConnectedReason || null;
        const safeRemarks = remarks || null;

        let updateData = {
            call_count,
            last_call_at: new Date(),
            next_call_at: nextCallAt ? new Date(nextCallAt) : null,
            call_remarks: safeRemarks,
            last_call_duration: duration || null
        };

        if (priority) {
            updateData.priority = priority;
        }

        if (status === 'connected') {
            connected_count++;
            updateData.connected_count = connected_count;
            updateData.tag = 'Follow Up';
        } else if (status === 'not_connected') {
            not_connected_count++;
            updateData.not_connected_count = not_connected_count;
            updateData.tag = 'Not Connected';
            updateData.not_connected_reason = safeReason;

            // Auto schedule if not connected (e.g. +2 hours)
            if (!nextCallAt) {
                const retryTime = new Date();
                retryTime.setHours(retryTime.getHours() + 2);
                updateData.next_call_at = retryTime;
            }
        } else if (status === 'dropped') {
            updateData.tag = 'Lost';
            updateData.drop_reason = dropReason || null;
        } else if (status === 'follow_up') {
            updateData.tag = 'Follow Up';
            updateData.next_call_at = nextCallAt || null;
        }

        const updates = Object.keys(updateData).map(k => `${k} = ?`).join(', ');
        const values = [...Object.values(updateData), id, userId];

        await pool.query(`UPDATE leads SET ${updates} WHERE id = ? AND user_id = ?`, values);

        // Add to lead_calls history with sanitized status
        const callStatusMap = {
            'connected': 'Connected',
            'not_connected': 'Not Connected',
            'dropped': 'Dropped',
            'follow_up': 'Follow Up'
        };
        const displayStatus = callStatusMap[status] || status;

        await pool.query(
            'INSERT INTO lead_calls (lead_id, user_id, status, call_date, note, duration, priority, created_at) VALUES (?, ?, ?, UTC_TIMESTAMP(), ?, ?, ?, UTC_TIMESTAMP())',
            [id, userId, displayStatus.substring(0, 50), safeRemarks, duration, priority]
        );

        // --- Automatic Stage Transition for Default Pipeline on Call ---
        const [pipelineInfo] = await pool.query(`
            SELECT l.pipeline_id, l.stage_id, p.name as pipeline_name 
            FROM leads l 
            LEFT JOIN pipelines p ON l.pipeline_id = p.id 
            WHERE l.id = ?
        `, [id]);

        if (pipelineInfo.length > 0 && pipelineInfo[0].pipeline_name === 'Default Pipeline') {
            const [stgs] = await pool.query(
                'SELECT id, stage_order FROM pipeline_stages WHERE pipeline_id = ? ORDER BY stage_order ASC',
                [pipelineInfo[0].pipeline_id]
            );

            if (stgs.length >= 3) {
                const currentStage = stgs.find(s => s.id === pipelineInfo[0].stage_id);
                // If stage is below "Contact Attempted" (stage_order 2), move to stage_order 2
                if (!currentStage || currentStage.stage_order < 2) {
                    await pool.query('UPDATE leads SET stage_id = ? WHERE id = ?', [stgs[2].id, id]);
                }
            }
        }

        // Create Task Reminder if requested
        if (createReminder && updateData.next_call_at) {
            const nextCall = new Date(updateData.next_call_at);
            const dueDate = nextCall.toISOString().split('T')[0];
            const dueTime = nextCall.toTimeString().split(' ')[0];

            // Build task description
            let taskDesc = "";
            if (safeReason) taskDesc += `Reason: ${safeReason}. `;
            if (safeRemarks) taskDesc += `Remarks: ${safeRemarks}`;
            taskDesc = taskDesc.trim() || null;

            await pool.query(
                `INSERT INTO tasks (user_id, title, description, priority, due_date, due_time, category, status, completed, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, UTC_TIMESTAMP())`,
                [
                    userId,
                    `Follow-up call: ${lead[0].name}`,
                    taskDesc,
                    (priority || lead[0].priority || 'medium').toLowerCase(),
                    dueDate,
                    dueTime,
                    'Follow-up',
                    'Pending' // Use default status
                ]
            );

            // Log activity for reminder
            const LeadResources = require('./leadResourcesModel');
            await LeadResources.addActivity({
                lead_id: id,
                activity_type: 'notification',
                title: 'Follow-up Reminder Set',
                description: `A follow-up task has been scheduled for ${new Date(updateData.next_call_at).toLocaleString()}.`
            }, userId);
        }

        return updateData;
    },

    analyzeLead: async (id, userId) => {
        const [rows] = await pool.query('SELECT * FROM leads WHERE id = ? AND user_id = ?', [id, userId]);
        if (!rows.length) return;
        const lead = rows[0];

        const totalCalls = lead.call_count || 0;
        const connected = lead.connected_count || 0;
        const successRate = totalCalls > 0 ? (connected / totalCalls) * 100 : 0;

        // Simple conversion probability logic
        let probability = successRate * 0.5;
        if (lead.tag === 'Interested') probability += 20;
        if (lead.tag === 'Follow Up') probability += 10;
        if (lead.priority === 'High') probability += 10;

        probability = Math.min(Math.max(probability, 0), 100);

        const isTrending = probability > 70 ? 1 : 0;

        await pool.query(
            'UPDATE leads SET call_success_rate = ?, conversion_probability = ?, is_trending = ? WHERE id = ?',
            [successRate, probability, isTrending, id]
        );
    },

    delete: async (id, userId) => {
        await pool.query('UPDATE leads SET is_deleted = 1 WHERE id = ? AND user_id = ?', [id, userId]);
    },

    findTrashed: async (userId, page = 1, limit = 10, search = '') => {
        const offset = (page - 1) * limit;
        let query = `
            SELECT l.*, p.name as pipeline_name, s.name as stage_name
            FROM leads l
            LEFT JOIN pipelines p ON l.pipeline_id = p.id
            LEFT JOIN pipeline_stages s ON l.stage_id = s.id
            WHERE l.user_id = ? AND l.is_deleted = 1
        `;
        const params = [userId];

        if (search) {
            query += ' AND (l.name LIKE ? OR l.email LIKE ? OR l.mobile_number LIKE ?)';
            const term = `%${search}%`;
            params.push(term, term, term);
        }

        query += ' ORDER BY l.id DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [leads] = await pool.query(query, params);

        let countQuery = 'SELECT COUNT(*) as total FROM leads l WHERE l.user_id = ? AND l.is_deleted = 1';
        const countParams = [userId];
        if (search) {
            countQuery += ' AND (l.name LIKE ? OR l.email LIKE ? OR l.mobile_number LIKE ?)';
            const term = `%${search}%`;
            countParams.push(term, term, term);
        }
        const [totalRows] = await pool.query(countQuery, countParams);

        return {
            leads,
            pagination: {
                total: totalRows[0].total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(totalRows[0].total / limit)
            }
        };
    },

    permanentDelete: async (id, userId) => {
        await pool.query('DELETE FROM leads WHERE id = ? AND user_id = ? AND is_deleted = 1', [id, userId]);
    },

    restore: async (id, userId) => {
        await pool.query('UPDATE leads SET is_deleted = 0 WHERE id = ? AND user_id = ?', [id, userId]);
    },

    checkCallConflict: async (userId, dateTime, excludeLeadId = null) => {
        // Check for calls within a 5-minute window (2.5 mins before and after)
        const date = new Date(dateTime);
        const startTime = new Date(date.getTime() - 2.5 * 60000);
        const endTime = new Date(date.getTime() + 2.5 * 60000);

        let query = 'SELECT id, name, next_call_at FROM leads WHERE user_id = ? AND next_call_at BETWEEN ? AND ?';
        let params = [userId, startTime, endTime];

        if (excludeLeadId) {
            query += ' AND id != ?';
            params.push(excludeLeadId);
        }

        const [rows] = await pool.query(query, params);
        return rows;
    },

    getDueReminders: async (userId) => {
        // Get leads where next_call_at is due (within last 1 minute to prevent skipping)
        // and lead is not already Won/Lost/Closed/Missed
        const [rows] = await pool.query(
            `SELECT l.*, p.name as pipeline_name, s.name as stage_name,
             (SELECT COUNT(*) FROM pipeline_stages ps WHERE ps.pipeline_id = l.pipeline_id) as total_stages,
             (SELECT COUNT(*) FROM pipeline_stages ps2 WHERE ps2.pipeline_id = l.pipeline_id AND ps2.stage_order <= s.stage_order) as current_stage
             FROM leads l
             LEFT JOIN pipelines p ON l.pipeline_id = p.id
             LEFT JOIN pipeline_stages s ON l.stage_id = s.id
             WHERE l.user_id = ? 
             AND l.next_call_at <= UTC_TIMESTAMP() 
             AND l.tag = 'Follow Up'
             ORDER BY l.next_call_at DESC`,
            [userId]
        );
        return rows;
    },

    snoozeLead: async (id, userId, minutes = 10) => {
        const [lead] = await pool.query('SELECT next_call_at FROM leads WHERE id = ? AND user_id = ?', [id, userId]);
        if (!lead.length) throw new Error('Lead not found');

        let nextCall = lead[0].next_call_at ? new Date(lead[0].next_call_at) : new Date();
        // If the scheduled time is already in the past, snooze from NOW
        if (nextCall < new Date()) {
            nextCall = new Date();
        }
        nextCall.setMinutes(nextCall.getMinutes() + minutes);

        await pool.query(
            'UPDATE leads SET next_call_at = ?, tag = CASE WHEN tag = "Missed" THEN "Follow Up" ELSE tag END WHERE id = ? AND user_id = ?',
            [nextCall, id, userId]
        );
        return nextCall;
    },

    checkMissedLeads: async (userId) => {
        // Find leads that are about to be marked as missed
        const [leadsToMiss] = await pool.query(
            `SELECT id FROM leads 
             WHERE user_id = ? 
             AND next_call_at IS NOT NULL 
             AND next_call_at <= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 5 MINUTE)
             AND tag = 'Follow Up'`,
            [userId]
        );

        if (leadsToMiss.length > 0) {
            const leadIds = leadsToMiss.map(l => l.id);

            // Update status to 'Missed'
            await pool.query(
                `UPDATE leads SET tag = 'Missed' WHERE id IN (?)`,
                [leadIds]
            );

            // Log activity for each missed lead
            const LeadResources = require('./leadResourcesModel');
            for (const id of leadIds) {
                await LeadResources.addActivity({
                    lead_id: id,
                    activity_type: 'missed',
                    title: 'Lead Follow-up Missed',
                    description: 'Scheduled follow-up time was missed. Lead tag updated to Missed.'
                }, userId);
            }
        }
    },

    getEmployeePerformance: async (employeeId, userId) => {
        // 1. Get Employee Basic Info
        const [empInfo] = await pool.query(`
            SELECT e.*, d.department_name as role, deg.designation_name as designation, e.joining_date as joined
            FROM employees e
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN designations deg ON e.designation_id = deg.id
            WHERE e.id = ? AND e.user_id = ?
        `, [employeeId, userId]);

        if (empInfo.length === 0) return null;
        const employee = empInfo[0];

        // 2. Lead Stats
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as leads,
                SUM(CASE WHEN tag = 'Won' THEN 1 ELSE 0 END) as converted,
                ROUND((SUM(CASE WHEN tag = 'Won' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0)) * 100, 1) as rate,
                (SELECT ROUND(AVG(TIMESTAMPDIFF(MINUTE, l.created_at, lc.call_date)) / 60, 1) 
                 FROM leads l 
                 JOIN (SELECT lead_id, MIN(call_date) as call_date FROM lead_calls GROUP BY lead_id) lc ON l.id = lc.lead_id
                 WHERE l.assigned_to = CAST(? AS CHAR) OR l.assigned_to = ?) as avg_response_time
            FROM leads 
            WHERE (assigned_to = CAST(? AS CHAR) OR assigned_to = ?) AND user_id = ?
        `, [employeeId, employee.employee_id, employeeId, employee.employee_id, userId]);

        const leadStats = stats[0] || { leads: 0, converted: 0, rate: 0, avg_response_time: 0 };

        // 3. Lead Status Pipeline
        const [pipeline] = await pool.query(`
            SELECT 
                status as name, 
                COUNT(*) as count
            FROM leads 
            WHERE (assigned_to = CAST(? AS CHAR) OR assigned_to = ?) AND user_id = ?
            GROUP BY status
        `, [employeeId, employee.employee_id, userId]);

        // 4. Recent Activities (Split into two queries to avoid 'Illegal mix of collations' error on UNION)
        const [calls] = await pool.query(`
            SELECT 'Call' as type, CONCAT('Call: ', status) as title, created_at as time, status as status_label
            FROM lead_calls 
            WHERE user_id = ? AND (lead_id IN (SELECT id FROM leads WHERE assigned_to = CAST(? AS CHAR) OR assigned_to = ?))
            ORDER BY created_at DESC LIMIT 10
        `, [userId, employeeId, employee.employee_id]);

        const [otherActivities] = await pool.query(`
            SELECT 'Activity' as type, title, created_at as time, 'Log' as status_label
            FROM lead_activities 
            WHERE user_id = ? AND (lead_id IN (SELECT id FROM leads WHERE assigned_to = CAST(? AS CHAR) OR assigned_to = ?))
            ORDER BY created_at DESC LIMIT 10
        `, [userId, employeeId, employee.employee_id]);

        const allActivities = [...calls, ...otherActivities]
            .sort((a, b) => new Date(b.time) - new Date(a.time))
            .slice(0, 10);

        // 5. Goals
        const [goals] = await pool.query(`
            SELECT * FROM goals 
            WHERE employee_id = ? AND user_id = ? AND status = 'Active' 
            ORDER BY created_at DESC LIMIT 1
        `, [employeeId, userId]);

        const goal = goals[0] || null;
        let goalProgress = 0;
        let goalCurrent = 0;
        let goalTarget = goal ? goal.target_value : 1000000;

        if (goal) {
            // Calculate progress based on 'Won' leads value during goal period
            const [progress] = await pool.query(`
                SELECT SUM(value) as current 
                FROM leads 
                WHERE (assigned_to = CAST(? AS CHAR) OR assigned_to = ?) 
                AND tag = 'Won' 
                AND updated_at BETWEEN ? AND ?
            `, [employeeId, employee.employee_id, goal.start_date, goal.end_date]);
            goalCurrent = progress[0].current || 0;
            goalProgress = Math.min(Math.round((goalCurrent / goalTarget) * 100), 100);
        } else {
            // Default mock progress if no goal set
            const [allWon] = await pool.query(`
                SELECT SUM(value) as current FROM leads WHERE (assigned_to = CAST(? AS CHAR) OR assigned_to = ?) AND tag = 'Won'
            `, [employeeId, employee.employee_id]);
            goalCurrent = allWon[0].current || 0;
            goalTarget = 1500000;
            goalProgress = Math.min(Math.round((goalCurrent / goalTarget) * 100), 100);
        }

        // 6. Conversion Trend (Last 14 days)
        const [trend] = await pool.query(`
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m-%d') as date,
                COUNT(*) as total,
                SUM(CASE WHEN tag = 'Won' THEN 1 ELSE 0 END) as won
            FROM leads
            WHERE (assigned_to = CAST(? AS CHAR) OR assigned_to = ?) AND created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 14 DAY)
            GROUP BY date
            ORDER BY date ASC
        `, [employeeId, employee.employee_id]);

        // 7. Dynamic Achievements
        const achievements = [];
        if (parseFloat(leadStats.rate) >= 40) {
            achievements.push({ title: "Deal Closer Pro", sub: "Highest Conversions", icon: "Award", color: "amber" });
        }
        if (leadStats.leads >= 100) {
            achievements.push({ title: "Engagement Star", sub: `${leadStats.leads}+ Direct Leads`, icon: "Activity", color: "blue" });
        }
        if (parseFloat(leadStats.avg_response_time) <= 2 && leadStats.leads > 0) {
            achievements.push({ title: "Fast Responder", sub: "Under 2h response avg", icon: "Zap", color: "orange" });
        }
        if (goalProgress >= 100) {
            achievements.push({ title: "Goal Crusher", sub: "100%+ Target Achieved", icon: "Target", color: "green" });
        }
        // Base achievement if nothing else
        if (achievements.length === 0) {
            achievements.push({ title: "Rising Talent", sub: "Team Contributor", icon: "Star", color: "amber" });
        }

        return {
            employee: {
                id: employee.id,
                name: employee.employee_name,
                role: employee.designation || employee.role || "Sales Executive",
                email: employee.email,
                joined: employee.joined ? new Date(employee.joined).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'N/A',
                avatar: employee.employee_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
            },
            stats: [
                { title: "Total Leads", value: leadStats.leads, icon: 'Users', color: "text-blue-600", bg: "bg-blue-50" },
                { title: "Deals Won", value: leadStats.converted, icon: 'Target', color: "text-green-600", bg: "bg-green-50" },
                { title: "Success Rate", value: `${leadStats.rate}%`, icon: 'Award', color: "text-orange-600", bg: "bg-orange-50" },
                { title: "Avg. Response", value: `${leadStats.avg_response_time || 0}h`, icon: 'Clock', color: "text-purple-600", bg: "bg-purple-50" },
            ],
            activities: allActivities.map(a => ({
                type: a.type,
                title: a.title,
                time: Lead.formatTimeAgo(a.time),
                status: a.status_label
            })),
            goalProgress: {
                percentage: goalProgress,
                current: goalCurrent,
                target: goalTarget,
                title: goal ? goal.goal_title : "Q1 Sales Target"
            },
            leadStatusPipeline: pipeline.map(p => ({
                name: p.name,
                count: p.count,
                color: Lead.getStatusColor(p.name)
            })),
            conversionTrend: trend.map(t => Math.round((t.won / (t.total || 1)) * 100)),
            achievements
        };
    },

    getDashboardData: async (userId) => {
        // 1. Stats
        const [stats] = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM leads WHERE user_id = ?) as total_leads,
                (SELECT COUNT(*) FROM leads WHERE user_id = ? AND tag = 'New Lead') as new_leads,
                (SELECT COUNT(*) FROM leads WHERE user_id = ? AND assigned_to IS NOT NULL) as assigned_leads,
                (SELECT COUNT(*) FROM leads WHERE user_id = ? AND status = 'New') as unread_leads
        `, [userId, userId, userId, userId]);

        // 2. Recent Leads
        const [recentLeads] = await pool.query(`
            SELECT 
                name, email, organization_name as company, status, tag as priority, created_at
            FROM leads 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 6
        `, [userId]);

        // 3. Trending Categories (by Industry)
        const [trending] = await pool.query(`
            SELECT 
                COALESCE(NULLIF(industry_type, ''), 'Others') as category, 
                COUNT(*) as count,
                ROUND((COUNT(*) / (SELECT NULLIF(COUNT(*), 0) FROM leads WHERE user_id = ?)) * 100, 1) as percentage
            FROM leads
            WHERE user_id = ?
            GROUP BY category
            ORDER BY count DESC
            LIMIT 5
        `, [userId, userId]);

        // 4. Weekly Analytics (Last 7 Days)
        const [weekly] = await pool.query(`
            SELECT 
                DATE_FORMAT(d.date, '%a') as day,
                COALESCE(COUNT(l.id), 0) as leads
            FROM (
                SELECT CURDATE() as date
                UNION SELECT DATE_SUB(CURDATE(), INTERVAL 1 DAY)
                UNION SELECT DATE_SUB(CURDATE(), INTERVAL 2 DAY)
                UNION SELECT DATE_SUB(CURDATE(), INTERVAL 3 DAY)
                UNION SELECT DATE_SUB(CURDATE(), INTERVAL 4 DAY)
                UNION SELECT DATE_SUB(CURDATE(), INTERVAL 5 DAY)
                UNION SELECT DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            ) d
            LEFT JOIN leads l ON DATE(l.created_at) = d.date AND l.user_id = ?
            GROUP BY d.date
            ORDER BY d.date ASC
        `, [userId]);

        return {
            stats: {
                total: stats[0].total_leads,
                total_up: "+12.5%",
                new: stats[0].new_leads,
                new_up: "+23.1%",
                assigned: stats[0].assigned_leads,
                assigned_up: "+8.2%",
                unread: stats[0].unread_leads,
                unread_down: "-5.3%"
            },
            recentLeads: recentLeads.map(l => ({
                name: l.name,
                email: l.email || "N/A",
                company: l.company || "N/A",
                status: l.status,
                priority: l.priority === 'Won' ? 'High' : (l.priority === 'Interested' ? 'Medium' : 'Low'),
                time: Lead.formatTimeAgo(l.created_at),
                avatar: (l.name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
            })),
            trendingData: trending.map(t => ({
                category: t.category,
                count: t.count,
                percentage: t.percentage,
                trend: t.percentage > 20 ? "up" : "down"
            })),
            weeklyData: weekly
        };
    },

    formatTimeAgo: (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    },

    getStatusColor: (status) => {
        const colors = {
            'New Lead': 'bg-blue-500',
            'Contacted': 'bg-orange-500',
            'Negotiation': 'bg-purple-500',
            'Won': 'bg-green-500',
            'Dropped': 'bg-red-500'
        };
        return colors[status] || 'bg-gray-500';
    },

    getAnalysis: async (userId) => {
        const [perfMetrics] = await pool.query(`
            SELECT 
                (SELECT SUM(value) FROM leads WHERE user_id = ? AND is_deleted = 0) as total_pipeline_value,
                (SELECT COUNT(*) FROM leads WHERE user_id = ? AND created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 30 DAY)) as current_month_leads,
                (SELECT COUNT(*) FROM leads WHERE user_id = ? AND created_at BETWEEN DATE_SUB(UTC_TIMESTAMP(), INTERVAL 60 DAY) AND DATE_SUB(UTC_TIMESTAMP(), INTERVAL 30 DAY)) as last_month_leads,
                (SELECT ROUND(AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at)) / 24, 1) FROM leads WHERE user_id = ? AND tag = 'Won') as avg_sales_cycle,
                (SELECT COUNT(*) FROM leads WHERE user_id = ? AND tag = 'Won') as won_leads,
                (SELECT COUNT(*) FROM leads WHERE user_id = ? AND tag IN ('Lost', 'Dropped', 'Lost Lead')) as lost_leads
        `, [userId, userId, userId, userId, userId, userId]);

        const stats = perfMetrics[0];
        
        // Calculate velocity (growth %)
        const currentLeads = stats.current_month_leads || 0;
        const lastLeads = stats.last_month_leads || 0;
        const velocity = lastLeads > 0 ? Math.round(((currentLeads - lastLeads) / lastLeads) * 100) : 100;

        // Calculate Win Rate
        const won = stats.won_leads || 0;
        const lost = stats.lost_leads || 0;
        const winRate = (won + lost) > 0 ? Math.round((won / (won + lost)) * 100) : 0;

        const [sources] = await pool.query(`
            SELECT 
                COALESCE(NULLIF(lead_source, ''), 'Direct') as source, 
                COUNT(*) as leads, 
                ROUND((SUM(CASE WHEN tag = 'Won' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0)) * 100, 1) as conversion,
                SUM(value) as revenue
            FROM leads
            WHERE user_id = ?
            GROUP BY source
            ORDER BY leads DESC
        `, [userId]);

        const [industries] = await pool.query(`
            SELECT 
                COALESCE(NULLIF(industry_type, ''), 'Others') as industry, 
                COUNT(*) as count,
                ROUND((COUNT(*) / (SELECT NULLIF(COUNT(*), 0) FROM leads WHERE user_id = ?)) * 100, 1) as percentage
            FROM leads
            WHERE user_id = ?
            GROUP BY industry
            ORDER BY count DESC
        `, [userId, userId]);

        const [weekly] = await pool.query(`
            SELECT 
                DATE_FORMAT(created_at, '%v') as week_num,
                CONCAT('Week ', DATE_FORMAT(created_at, '%v')) as week,
                COUNT(CASE WHEN tag = 'New Lead' THEN 1 END) as \`new\`,
                COUNT(CASE WHEN tag = 'Not Connected' THEN 1 END) as notConnected,
                COUNT(CASE WHEN tag = 'Follow Up' THEN 1 END) as followUp,
                COUNT(CASE WHEN tag = 'Interested' OR is_trending = 1 THEN 1 END) as trending,
                COUNT(CASE WHEN tag = 'Won' THEN 1 END) as won
            FROM leads 
            WHERE user_id = ? AND created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 5 WEEK)
            GROUP BY week_num, week
            ORDER BY week_num ASC
        `, [userId]);

        const [team] = await pool.query(`
            SELECT 
                MAX(e.id) as id,
                e.employee_name as name, 
                COUNT(*) as leads, 
                SUM(CASE WHEN l.tag = 'Won' THEN 1 ELSE 0 END) as converted,
                ROUND((SUM(CASE WHEN l.tag = 'Won' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0)) * 100, 1) as rate,
                SUBSTRING_INDEX(e.employee_name, ' ', 1) as avatar
            FROM leads l
            JOIN employees e ON (l.assigned_to = CAST(e.id AS CHAR) OR l.assigned_to = e.employee_id)
            WHERE l.user_id = ? AND l.assigned_to IS NOT NULL
            GROUP BY e.id, e.employee_name
            ORDER BY leads DESC
            LIMIT 5
        `, [userId]);

        const [monthly] = await pool.query(`
            SELECT 
                DATE_FORMAT(d.month, '%b') as month,
                COALESCE(COUNT(l.id), 0) as leads,
                COALESCE(SUM(CASE WHEN l.tag = 'Won' THEN 1 ELSE 0 END), 0) as converted,
                COALESCE(SUM(l.value), 0) as revenue
            FROM (
                SELECT DATE_SUB(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), INTERVAL 5 MONTH) as month
                UNION SELECT DATE_SUB(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), INTERVAL 4 MONTH)
                UNION SELECT DATE_SUB(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), INTERVAL 3 MONTH)
                UNION SELECT DATE_SUB(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), INTERVAL 2 MONTH)
                UNION SELECT DATE_SUB(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), INTERVAL 1 MONTH)
                UNION SELECT DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')
            ) d
            LEFT JOIN leads l ON DATE_FORMAT(l.created_at, '%Y-%m') = DATE_FORMAT(d.month, '%Y-%m') AND l.user_id = ?
            GROUP BY d.month
            ORDER BY d.month ASC
        `, [userId]);

        return {
            performanceMetrics: [
                { title: "Pipeline Value", value: "₹" + (stats.total_pipeline_value || 0).toLocaleString(), change: "+0%", trend: "up", icon: "DollarSign", color: "from-blue-400 to-blue-500", colorClass: "border-t-blue-500 bg-blue-50/50", iconColor: "text-blue-500" },
                { title: "Lead Velocity", value: (velocity >= 0 ? "+" : "") + velocity + "%", change: velocity + "%", trend: velocity >= 0 ? "up" : "down", icon: "TrendingUp", color: "from-purple-400 to-purple-500", colorClass: "border-t-purple-500 bg-purple-50/50", iconColor: "text-purple-500" },
                { title: "Sales Cycle", value: (stats.avg_sales_cycle || 0) + " Days", change: "Avg.", trend: "up", icon: "Clock", color: "from-amber-400 to-amber-500", colorClass: "border-t-amber-500 bg-amber-50/50", iconColor: "text-amber-500" },
                { title: "Win/Loss Ratio", value: winRate + "%", change: "Win Rate", trend: "up", icon: "Target", color: "from-orange-400 to-orange-500", colorClass: "border-t-orange-500 bg-orange-50/50", iconColor: "text-orange-500" }
            ],
            sourceAnalysis: sources.map(s => ({
                source: s.source,
                leads: s.leads,
                conversion: s.conversion || 0,
                revenue: "$" + (s.revenue || 0).toLocaleString(),
                color: "bg-orange-500" // Default color, can be mapped from index
            })),
            weeklyTrends: weekly.map(w => ({
                week: w.week,
                new: w.new || 0,
                notConnected: w.notConnected || 0,
                followUp: w.followUp || 0,
                trending: w.trending || 0,
                won: w.won || 0
            })),
            teamPerformance: team.map(t => ({
                id: t.id,
                name: t.name,
                leads: t.leads,
                converted: t.converted || 0,
                rate: t.rate || 0,
                avatar: (t.name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
            })),
            industryBreakdown: industries.map(i => ({
                industry: i.industry,
                percentage: i.percentage || 0,
                count: i.count
            })),
            monthlyTrends: monthly.map(m => ({
                month: m.month,
                leads: m.leads,
                converted: m.converted,
                revenue: (m.revenue || 0).toLocaleString()
            }))
        };
    }
};

module.exports = Lead;
