const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Handle Super Admin
            if (decoded.role === 'Super Admin') {
                req.user = {
                    id: 'SUPER_ADMIN',
                    role: 'Super Admin',
                    username: 'superadmin'
                };
                return next();
            }

            // Handle Employee
            if (decoded.role === 'Employee') {
                // We need to fetch the employee to get the latest permissions and Linked Admin ID
                const Employee = require('../models/employeeModel');
                const employee = await Employee.findById(decoded.id, null); // CAUTION: findById expects (id, userId).
                // But wait, Employee.findById filters by userId too.
                // We need a findById that doesn't strictly require userId IF we don't know it yet.
                // Actually, relying on findById(id, userId) is tricky if we don't have userId.
                // But we have the ID from token.
                // I should add a findByPk or findByIdOnly method to Employee model, or logic to bypass query.
                // Luckily, I added findByUsername which returns raw row.
                // But here we have ID.

                // Workaround: Use pool query directly or add method.
                // Let's add findByIdRaw to Employee model? Or use pool here?
                // Using pool here is ugly but safe.
                // Or: "SELECT * FROM employees WHERE id = ?"
                const { pool } = require('../config/db');
                const [rows] = await pool.query('SELECT * FROM employees WHERE id = ?', [decoded.id]);
                const emp = rows[0];

                if (emp) {
                    req.user = {
                        _id: emp.id, // Actual Employee ID
                        id: emp.user_id, // Masquerade as Admin ID for existing controllers (Data Scope)
                        user_id: emp.user_id, // Explicit Admin ID context
                        role: 'Employee',
                        permissions: emp.permissions ? (typeof emp.permissions === 'string' ? JSON.parse(emp.permissions) : emp.permissions) : [],
                        username: emp.username,
                        employee_name: emp.employee_name,
                        email: emp.email

                    };
                    return next();
                }
            }

            // Handle Admin (User)
            const user = await User.findById(decoded.id);
            if (!user) {
                console.error('Auth Error: Admin user not found for ID', decoded.id);
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            req.user = user;
            // Ensure role is set
            if (!req.user.role) req.user.role = 'Admin';

            next();
        } catch (error) {
            console.error('Auth Error: Token verification failed:', error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        console.error('Auth Error: No token provided');
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const superAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'Super Admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as a Super Admin' });
    }
};

const authorize = (permission) => {
    return (req, res, next) => {
        // Super Admin and Admin have full access
        if (req.user && (req.user.role === 'Super Admin' || req.user.role === 'Admin')) {
            return next();
        }

        // Employee Access Check
        if (req.user && req.user.role === 'Employee') {
            let userPermissions = req.user.permissions || [];

            // If permissions is a string, parse it
            if (typeof userPermissions === 'string') {
                try {
                    userPermissions = JSON.parse(userPermissions);
                } catch (e) {
                    userPermissions = [];
                }
            }

            // Check if user has the specific permission ID
            if (Array.isArray(userPermissions) && userPermissions.includes(permission)) {
                return next();
            }

            // Also check for category-level permission if needed? 
            // For now, let's keep it strict to individual IDs as requested.
        }

        return res.status(403).json({
            status: false,
            message: `Not authorized to access this resource. Required permission: ${permission}`
        });
    };
};

module.exports = { protect, superAdmin, authorize };
