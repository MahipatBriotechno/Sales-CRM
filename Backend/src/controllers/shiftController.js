const Shift = require('../models/shiftModel');

exports.createShift = async (req, res) => {
    try {
        const userId = req.user.id;
        const shiftId = await Shift.create(req.body, userId);
        res.status(201).json({ success: true, message: 'Shift created successfully', shiftId });
    } catch (error) {
        console.error('Error creating shift:', error);
        res.status(500).json({ success: false, message: 'Error creating shift', error: error.message });
    }
};

exports.getShifts = async (req, res) => {
    try {
        const userId = req.user.id;
        const shifts = await Shift.findAll(userId);
        res.status(200).json({ success: true, shifts });
    } catch (error) {
        console.error('Error fetching shifts:', error);
        res.status(500).json({ success: false, message: 'Error fetching shifts', error: error.message });
    }
};

exports.getShiftById = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const shift = await Shift.findById(id, userId);
        
        if (!shift) {
            return res.status(404).json({ success: false, message: 'Shift not found' });
        }
        
        res.status(200).json({ success: true, shift });
    } catch (error) {
        console.error('Error fetching shift details:', error);
        res.status(500).json({ success: false, message: 'Error fetching shift details', error: error.message });
    }
};

exports.updateShift = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        
        const existingShift = await Shift.findById(id, userId);
        if (!existingShift) {
            return res.status(404).json({ success: false, message: 'Shift not found' });
        }
        
        await Shift.update(id, req.body, userId);
        res.status(200).json({ success: true, message: 'Shift updated successfully' });
    } catch (error) {
        console.error('Error updating shift:', error);
        res.status(500).json({ success: false, message: 'Error updating shift', error: error.message });
    }
};

exports.deleteShift = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        
        const existingShift = await Shift.findById(id, userId);
        if (!existingShift) {
            return res.status(404).json({ success: false, message: 'Shift not found' });
        }
        
        await Shift.delete(id, userId);
        res.status(200).json({ success: true, message: 'Shift deleted successfully' });
    } catch (error) {
        console.error('Error deleting shift:', error);
        res.status(500).json({ success: false, message: 'Error deleting shift', error: error.message });
    }
};
