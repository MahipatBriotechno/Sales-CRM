const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const attendanceSettingsController = require('../controllers/attendanceSettingsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/settings', attendanceSettingsController.getSettings);
router.put('/settings', attendanceSettingsController.updateSettings);

router.post('/mark', attendanceController.markAttendance);
router.put('/checkout/:id', attendanceController.checkOut);
router.post('/break/start/:id', attendanceController.startBreak);
router.put('/break/end/:id', attendanceController.endBreak);
router.get('/all', attendanceController.getAllAttendance);
router.get('/employee/:employee_id', attendanceController.getEmployeeAttendance);
router.get('/stats', attendanceController.getDashboardStats);
router.put('/:id', attendanceController.updateAttendance);
router.delete('/:id', attendanceController.deleteAttendance);

module.exports = router;
