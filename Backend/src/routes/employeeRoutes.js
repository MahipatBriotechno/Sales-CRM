const express = require('express');
const router = express.Router();
const {
    createEmployee,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
    checkEmployeeId,
    checkContactAvailability,
    checkUsername
} = require('../controllers/employeeController');

const { protect } = require('../middleware/authMiddleware');
const { checkLimit } = require('../middleware/limitMiddleware');
const upload = require('../middleware/uploadMiddleware');

const employeeUploadFields = [
    { name: 'profile_picture', maxCount: 1 },
    { name: 'aadhar_front', maxCount: 1 },
    { name: 'aadhar_back', maxCount: 1 },
    { name: 'pan_card', maxCount: 1 },
    { name: 'cancelled_cheque', maxCount: 1 }
];

router.post('/', protect, checkLimit('users'), upload.fields(employeeUploadFields), createEmployee);
router.post('/check-id', protect, checkEmployeeId);
router.post('/check-contact', protect, checkContactAvailability);
router.post('/check-username', protect, checkUsername);
router.get('/', protect, getEmployees);
router.get('/:id', protect, getEmployeeById);
router.put('/:id', protect, upload.fields(employeeUploadFields), updateEmployee);
router.delete('/:id', protect, deleteEmployee);

module.exports = router;
