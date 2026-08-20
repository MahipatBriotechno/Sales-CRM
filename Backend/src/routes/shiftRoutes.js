const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shiftController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
// Assuming HRM permission covers shifts, or you can add specific ones
// Usually HRM or Settings permission is used, using 'HRM' as placeholder based on sidebar
router.use(authorize('HRM'));

router.post('/', shiftController.createShift);
router.get('/', shiftController.getShifts);
router.get('/:id', shiftController.getShiftById);
router.put('/:id', shiftController.updateShift);
router.delete('/:id', shiftController.deleteShift);

module.exports = router;
