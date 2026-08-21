const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const Employee = require('../models/employeeModel');
const Enterprise = require('../models/enterpriseModel');
const generateToken = require('../utils/generateToken');
const ProductKey = require('../models/productKeyModel');
const Plan = require('../models/planModel');
const Subscription = require('../models/subscriptionModel');
const BusinessInfo = require('../models/businessInfoModel');
const Otp = require('../models/otpModel');
const { sendSmsOtp } = require('../utils/smsService');
const { pool } = require('../config/db');

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const registerUser = async (req, res) => {
    const {
        firstName,
        lastName,
        email,
        mobileNumber,
        businessName,
        businessType,
        gst,
        address,
        password,
        productKey
    } = req.body;

    try {
        const userExists = await User.findByEmail(email);

        if (userExists) {
            return res.status(400).json({
                status: false,
                message: 'User already exists'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 1. Create User entry (Admin)
        const userId = await User.create({
            firstName,
            lastName,
            email,
            mobileNumber,
            businessName,
            businessType,
            gst,
            address,
            password: hashedPassword,
        });

        if (userId) {
            let finalPlan = 'Starter';
            let keyData = null;

            if (productKey) {
                keyData = await ProductKey.findByKey(productKey);
                if (!keyData) {
                    return res.status(400).json({ status: false, message: 'Invalid product key' });
                }
                if (keyData.status === 'Active' || keyData.status === 'Used') {
                    return res.status(400).json({ status: false, message: 'Product key already used' });
                }
                finalPlan = keyData.plan;
            }

            // 2. Create Enterprise entry
            const enterpriseId = await Enterprise.create({
                admin_id: userId,
                firstName,
                lastName,
                email,
                mobileNumber,
                businessName,
                businessType,
                gst,
                address,
                plan: finalPlan,
                status: 'Active',
                onboardingDate: new Date()
            });

            // 2.1 Create initial BusinessInfo entry
            await BusinessInfo.createOrUpdate({
                user_id: userId,
                company_name: businessName,
                legal_name: businessName,
                business_type: businessType,
                email: email,
                phone: mobileNumber,
                gst_number: gst,
                street_address: address
            });

            // 3. If product key was used, activate subscription immediately
            if (keyData) {
                const planDetails = await Plan.findByName(finalPlan);
                const expiryDate = new Date();

                // Validity is like "1 Month", "3 Months", "1 Year"
                if (keyData.validity === '1 Month') expiryDate.setMonth(expiryDate.getMonth() + 1);
                else if (keyData.validity === '3 Months') expiryDate.setMonth(expiryDate.getMonth() + 3);
                else if (keyData.validity === '1 Year') expiryDate.setFullYear(expiryDate.getFullYear() + 1);
                else expiryDate.setMonth(expiryDate.getMonth() + 1); // Default

                await Subscription.create({
                    enterprise_id: enterpriseId,
                    name: businessName,
                    plan: finalPlan,
                    status: 'Active',
                    users: keyData.users || (planDetails ? planDetails.default_users : 0),
                    amount: planDetails ? planDetails.price : 0,
                    billingCycle: keyData.validity === '1 Year' ? 'Yearly' : 'Monthly',
                    onboardingDate: new Date(),
                    expiryDate: expiryDate,
                    leads: planDetails ? planDetails.monthly_leads : 0,
                    storage: planDetails ? planDetails.default_storage : 0,
                    features: []
                });

                // Mark key as Active/Used
                await ProductKey.updateStatusByKey(productKey, 'Active', enterpriseId);
            }

            const token = generateToken(userId, 'Admin');

            res.status(201).json({
                status: true,
                message: 'User registered successfully',
                token,
                user: {
                    _id: userId,
                    enterpriseId,
                    firstName,
                    lastName,
                    email,
                    mobileNumber,
                    businessName,
                    businessType,
                    gst,
                    address,
                    role: 'Admin',
                    planActivated: !!keyData // Flag for frontend redirection
                },
            });
        } else {
            res.status(400).json({
                status: false,
                message: 'Invalid user data'
            });
        }
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res) => {
    const { email, username, password } = req.body;
    const identifier = email || username;

    try {
        // 1. Super Admin Check
        const SUPER_ADMIN_USER = process.env.SUPER_ADMIN_USER || 'superadmin';
        const SUPER_ADMIN_PASS = process.env.SUPER_ADMIN_PASS || 'password123';

        if (identifier === SUPER_ADMIN_USER && password === SUPER_ADMIN_PASS) {
            return res.json({
                status: true,
                message: 'Super Admin Login successful',
                token: generateToken('SUPER_ADMIN_ID', 'Super Admin'),
                user: {
                    role: 'Super Admin',
                    username: SUPER_ADMIN_USER
                }
            });
        }

        // 2. Admin Check (User table)
        // Users are identified by email
        if (email) {
            const user = await User.findByEmail(email);
            if (user && (await bcrypt.compare(password, user.password))) {
                // Update last_login timestamp
                await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

                return res.json({
                    status: true,
                    message: 'Login successful',
                    token: generateToken(user.id, user.role || 'Admin'),
                    user: {
                        _id: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        profile_picture: user.profile_picture,
                        email: user.email,
                        mobileNumber: user.mobileNumber,
                        businessName: user.businessName,
                        businessType: user.businessType,
                        gst: user.gst,
                        address: user.address,
                        role: user.role || 'Admin'
                    },
                });
            }
        }

        // 3. Employee Check
        // Employees identified by username (or email if we want to support that)
        const employee = await Employee.findByUsername(identifier);

        // Note: Assuming employee passwords will be hashed moving forward. 
        // If legacy passwords are plain text, this might fail unless we check.
        // For now, implementing bcrypt compare assuming we update creation logic.
        if (employee) {
            const isMatch = await bcrypt.compare(password, employee.password);
            // Fallback for plain text if match fails (optional, for backward compatibility during dev)
            const isPlainMatch = employee.password === password;

            if (isMatch || isPlainMatch) {
                // Update last_login timestamp for employees
                await pool.query('UPDATE employees SET last_login = NOW() WHERE id = ?', [employee.id]).catch(() => { });

                return res.json({
                    status: true,
                    message: 'Employee Login successful',
                    token: generateToken(employee.id, 'Employee'),
                    user: {
                        _id: employee.id,
                        employee_id: employee.employee_id,
                        name: employee.employee_name,
                        firstName: employee.employee_name ? employee.employee_name.split(' ')[0] : '',
                        lastName: employee.employee_name ? employee.employee_name.split(' ').slice(1).join(' ') : '',
                        profile_picture: employee.profile_picture,
                        username: employee.username,
                        email: employee.email,
                        role: 'Employee',
                        permissions: employee.permissions ? (typeof employee.permissions === 'string' ? JSON.parse(employee.permissions) : employee.permissions) : [],
                        user_id: employee.user_id
                    }
                });
            }
        }

        res.status(401).json({
            status: false,
            message: 'Invalid email/username or password' // Generic message
        });

    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

// @desc    Send OTP to user mobile number
// @route   POST /api/auth/send-otp
// @access  Public
const sendOtp = async (req, res) => {
    const { mobileNumber, countryCode = '+91' } = req.body;

    if (!mobileNumber) {
        return res.status(400).json({
            status: false,
            message: 'Mobile number is required'
        });
    }

    const cleanMobile = mobileNumber.replace(/\D/g, '').slice(-10);
    if (cleanMobile.length !== 10) {
        return res.status(400).json({
            status: false,
            message: 'Please enter a valid 10-digit mobile number'
        });
    }

    try {
        // 1. Check if mobile number exists in Admin (users) or Employee (employees) table
        const user = await User.findByMobileNumber(cleanMobile);
        const employee = !user ? await Employee.findByMobileNumber(cleanMobile) : null;

        if (!user && !employee) {
            return res.status(404).json({
                status: false,
                message: 'Mobile number not registered. Please register first.'
            });
        }

        // 2. Generate random 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 3. Save OTP in DB with 10 min expiration
        await Otp.saveOtp(cleanMobile, otp, 10);

        // 4. Send SMS via TrueBulkSMS HTTP API
        const fullMobile = `${countryCode}${cleanMobile}`;
        await sendSmsOtp(fullMobile, otp);

        return res.json({
            status: true,
            message: `OTP sent successfully to ${countryCode} ${cleanMobile}`
        });

    } catch (error) {
        console.error('Send OTP error:', error);
        return res.status(500).json({
            status: false,
            message: error.message || 'Failed to send OTP. Please try again.'
        });
    }
};

// @desc    Verify OTP & login user
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res) => {
    const { mobileNumber, otp } = req.body;

    if (!mobileNumber || !otp) {
        return res.status(400).json({
            status: false,
            message: 'Mobile number and OTP are required'
        });
    }

    const cleanMobile = mobileNumber.replace(/\D/g, '').slice(-10);

    try {
        // 1. Verify OTP from DB
        const validOtpRecord = await Otp.verifyOtp(cleanMobile, otp);

        if (!validOtpRecord) {
            return res.status(400).json({
                status: false,
                message: 'Invalid or expired OTP code'
            });
        }

        // Delete used OTP
        await Otp.deleteOtp(cleanMobile);

        // 2. Find user in Admin (users) or Employee (employees) table
        const user = await User.findByMobileNumber(cleanMobile);
        if (user) {
            await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

            return res.json({
                status: true,
                message: 'Login successful',
                token: generateToken(user.id, user.role || 'Admin'),
                user: {
                    _id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    profile_picture: user.profile_picture,
                    email: user.email,
                    mobileNumber: user.mobileNumber,
                    businessName: user.businessName,
                    businessType: user.businessType,
                    gst: user.gst,
                    address: user.address,
                    role: user.role || 'Admin'
                }
            });
        }

        const employee = await Employee.findByMobileNumber(cleanMobile);
        if (employee) {
            await pool.query('UPDATE employees SET last_login = NOW() WHERE id = ?', [employee.id]).catch(() => { });

            return res.json({
                status: true,
                message: 'Employee Login successful',
                token: generateToken(employee.id, 'Employee'),
                user: {
                    _id: employee.id,
                    employee_id: employee.employee_id,
                    name: employee.employee_name,
                    firstName: employee.employee_name ? employee.employee_name.split(' ')[0] : '',
                    lastName: employee.employee_name ? employee.employee_name.split(' ').slice(1).join(' ') : '',
                    profile_picture: employee.profile_picture,
                    username: employee.username,
                    email: employee.email,
                    role: 'Employee',
                    permissions: employee.permissions ? (typeof employee.permissions === 'string' ? JSON.parse(employee.permissions) : employee.permissions) : [],
                    user_id: employee.user_id
                }
            });
        }

        return res.status(404).json({
            status: false,
            message: 'Mobile number not registered. Please register first.'
        });

    } catch (error) {
        console.error('Verify OTP error:', error);
        return res.status(500).json({
            status: false,
            message: error.message || 'OTP verification failed. Please try again.'
        });
    }
};

module.exports = {
    registerUser,
    authUser,
    sendOtp,
    verifyOtp,
};
