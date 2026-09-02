const Goal = require('../models/goalModel');

const goalController = {
    createGoal: async (req, res) => {
        try {
            const goalId = await Goal.create(req.body, req.user.id);
            res.status(201).json({ status: true, message: 'Goal created successfully', goalId });
        } catch (error) {
            res.status(500).json({ status: false, message: error.message });
        }
    },

    getGoals: async (req, res) => {
        try {
            const goals = await Goal.findAll(req.user.id, req.query.employeeId);
            // Enhance goals with progress
            const enhancedGoals = await Promise.all(goals.map(g => Goal.getGoalProgress(g.id, req.user.id)));
            res.status(200).json(enhancedGoals);
        } catch (error) {
            res.status(500).json({ status: false, message: error.message });
        }
    },

    getMyGoals: async (req, res) => {
        try {
            if (req.user.role !== 'Employee') {
                return res.status(200).json([]); // Only employees have assigned "My Goals" widget
            }
            const goals = await Goal.findMyActiveGoals(req.user._id, req.user.user_id);
            // Enhance goals with live progress using the same utility
            const enhancedGoals = await Promise.all(goals.map(g => Goal.getGoalProgress(g.id, req.user.user_id)));
            res.status(200).json(enhancedGoals);
        } catch (error) {
            console.error("Error in getMyGoals:", error);
            res.status(500).json({ status: false, message: error.message });
        }
    },

    updateGoal: async (req, res) => {
        try {
            await Goal.update(req.params.id, req.body, req.user.id);
            res.status(200).json({ status: true, message: 'Goal updated successfully' });
        } catch (error) {
            res.status(500).json({ status: false, message: error.message });
        }
    },

    deleteGoal: async (req, res) => {
        try {
            await Goal.delete(req.params.id, req.user.id);
            res.status(200).json({ status: true, message: 'Goal deleted successfully' });
        } catch (error) {
            res.status(500).json({ status: false, message: error.message });
        }
    },

    getGoalDetails: async (req, res) => {
        try {
            const goal = await Goal.getGoalProgress(req.params.id, req.user.id);
            if (!goal) return res.status(404).json({ message: 'Goal not found' });
            res.status(200).json(goal);
        } catch (error) {
            res.status(500).json({ status: false, message: error.message });
        }
    }
};

module.exports = goalController;
