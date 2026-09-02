const { pool } = require('../config/db');

exports.createCustomField = async (req, res) => {
    try {
        const userId = req.user.id;
        const { module_name = 'leads', field_label, field_type, options } = req.body;

        if (!field_label || !field_type) {
            return res.status(400).json({ success: false, message: 'Field label and type are required' });
        }

        const sql = `
            INSERT INTO tenant_custom_fields (user_id, module_name, field_label, field_type, options)
            VALUES (?, ?, ?, ?, ?)
        `;
        const optionsJson = options ? JSON.stringify(options) : null;
        
        const [result] = await pool.query(sql, [userId, module_name, field_label, field_type, optionsJson]);
        
        res.status(201).json({
            success: true,
            message: 'Custom field created successfully',
            customField: {
                id: result.insertId,
                user_id: userId,
                module_name,
                field_label,
                field_type,
                options: options || null,
                is_active: 1
            }
        });
    } catch (error) {
        console.error('Error creating custom field:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getCustomFields = async (req, res) => {
    try {
        const userId = req.user.id;
        const moduleName = req.params.module || 'leads';

        const [fields] = await pool.query(
            'SELECT * FROM tenant_custom_fields WHERE user_id = ? AND module_name = ? AND is_active = 1',
            [userId, moduleName]
        );

        res.status(200).json({
            success: true,
            customFields: fields
        });
    } catch (error) {
        console.error('Error fetching custom fields:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateCustomField = async (req, res) => {
    try {
        const userId = req.user.id;
        const fieldId = req.params.id;
        const { field_label, field_type, options, is_active } = req.body;

        const optionsJson = options ? JSON.stringify(options) : null;
        
        const sql = `
            UPDATE tenant_custom_fields 
            SET field_label = COALESCE(?, field_label),
                field_type = COALESCE(?, field_type),
                options = COALESCE(?, options),
                is_active = COALESCE(?, is_active)
            WHERE id = ? AND user_id = ?
        `;

        await pool.query(sql, [field_label, field_type, optionsJson, is_active, fieldId, userId]);

        res.status(200).json({
            success: true,
            message: 'Custom field updated successfully'
        });
    } catch (error) {
        console.error('Error updating custom field:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteCustomField = async (req, res) => {
    try {
        const userId = req.user.id;
        const fieldId = req.params.id;

        await pool.query(
            'DELETE FROM tenant_custom_fields WHERE id = ? AND user_id = ?',
            [fieldId, userId]
        );

        res.status(200).json({
            success: true,
            message: 'Custom field deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting custom field:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
