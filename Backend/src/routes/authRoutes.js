const express = require('express');
const { registerUser, authUser, sendOtp, verifyOtp } = require('../controllers/authController');
const router = express.Router();

router.post('/signup', registerUser);
router.post('/login', authUser);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

module.exports = router;
