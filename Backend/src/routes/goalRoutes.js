const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', authorize('goal_create'), goalController.createGoal);
router.get('/my-goals', goalController.getMyGoals);
router.get('/', authorize('goal_view'), goalController.getGoals);
router.get('/:id', authorize('goal_view'), goalController.getGoalDetails);
router.put('/:id', authorize('goal_edit'), goalController.updateGoal);
router.delete('/:id', authorize('goal_delete'), goalController.deleteGoal);

module.exports = router;
