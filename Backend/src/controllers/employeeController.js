const Employee = require('../models/employeeModel');
const bcrypt = require('bcryptjs');

const createEmployee = async (req, res) => {
    try {
        const data = { ...req.body };
        // Validate Required Dropdowns
        if (!data.department_id) {
            return res.status(400).json({ status: false, message: 'Please select a Department.' });
        }
        if (!data.designation_id) {
            return res.status(400).json({ status: false, message: 'Please select a Designation.' });
        }
        if (!data.shift_id) {
            return res.status(400).json({ status: false, message: 'Please select a Shift.' });
        }

        // Hash password
        if (data.password) {
            const salt = await bcrypt.genSalt(10);
            data.password = await bcrypt.hash(data.password, salt);
        }

        // Validate Employee ID
        if (data.employee_id) {
            const idExists = await Employee.checkEmployeeId(data.employee_id);
            if (idExists) return res.status(400).json({ status: false, message: 'Employee ID already exists' });
        }

        // Validate Contact info
        if (data.email) {
            const isEmailAvailable = await Employee.checkContactAvailability('email', data.email);
            if (!isEmailAvailable) return res.status(400).json({ status: false, message: 'Email already exists' });
        }
        if (data.mobile_number) {
            const isMobileAvailable = await Employee.checkContactAvailability('mobile', data.mobile_number);
            if (!isMobileAvailable) return res.status(400).json({ status: false, message: 'Mobile number already exists' });
        }

        // Validate Username
        if (data.username) {
            const isUsernameAvailable = await Employee.checkUsername(data.username);
            if (!isUsernameAvailable) return res.status(400).json({ status: false, message: 'Username already exists' });
        }

        // Handle file uploads
        if (req.files) {
            if (req.files.profile_picture) {
                data.profile_picture = `/uploads/employees/${req.files.profile_picture[0].filename}`;
            }
            if (req.files.aadhar_front) {
                data.aadhar_front = `/uploads/employees/${req.files.aadhar_front[0].filename}`;
            }
            if (req.files.aadhar_back) {
                data.aadhar_back = `/uploads/employees/${req.files.aadhar_back[0].filename}`;
            }
            if (req.files.pan_card) {
                data.pan_card = `/uploads/employees/${req.files.pan_card[0].filename}`;
            }
            if (req.files.cancelled_cheque) {
                data.cancelled_cheque = `/uploads/employees/${req.files.cancelled_cheque[0].filename}`;
            }
        }

        // Ensure user_id comes ONLY from JWT token
        const userId = req.user.id;
        const id = await Employee.create(data, userId);
        res.status(201).json({ status: true, message: 'Employee created successfully', id });
    } catch (error) {
        console.error('Create Employee Error:', error);
        res.status(500).json({ status: false, message: error.message });
    }
};

const getEmployeesDashboard = async (req, res) => {
    try {
        const { search = '' } = req.query;
        // userId from token
        const data = await Employee.getEmployeesDashboard(req.user.id, search);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const checkEmployeeId = async (req, res) => {
    try {
        const { employeeId, excludeEmployeeId } = req.body;
        if (!employeeId) return res.status(400).json({ status: false, message: 'Employee ID is required' });
        const exists = await Employee.checkEmployeeId(employeeId, excludeEmployeeId);
        res.status(200).json({ status: true, available: !exists });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

const checkContactAvailability = async (req, res) => {
    try {
        const { type, value, excludeEmployeeId } = req.body;
        if (!type || !value) return res.status(400).json({ status: false, message: 'Type and value are required' });
        const available = await Employee.checkContactAvailability(type, value, excludeEmployeeId);
        res.status(200).json({ status: true, available });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

const checkUsername = async (req, res) => {
    try {
        const { username, excludeEmployeeId } = req.body;
        if (!username) return res.status(400).json({ status: false, message: 'Username is required' });
        const available = await Employee.checkUsername(username, excludeEmployeeId);
        res.status(200).json({ status: true, available });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

const getEmployees = async (req, res) => {
    try {
        const { page = 1, limit = 10, status = 'All', search = '' } = req.query;
        // userId from token
        const data = await Employee.findAll(req.user.id, page, limit, status, search);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getEmployeeById = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id, req.user.id);
        if (!employee) {
            return res.status(404).json({ status: false, message: 'Employee not found' });
        }
        res.status(200).json({ status: true, data: employee });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

const updateEmployee = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id, req.user.id);
        if (!employee) {
            return res.status(404).json({ status: false, message: 'Employee not found' });
        }

        const data = { ...req.body };

        // Validate Required Dropdowns
        if (!data.department_id) {
            return res.status(400).json({ status: false, message: 'Please select a Department.' });
        }
        if (!data.designation_id) {
            return res.status(400).json({ status: false, message: 'Please select a Designation.' });
        }
        if (!data.shift_id) {
            return res.status(400).json({ status: false, message: 'Please select a Shift.' });
        }

        // Hash password if updating
        if (data.password) {
            const salt = await bcrypt.genSalt(10);
            data.password = await bcrypt.hash(data.password, salt);
        }

        // Validate Employee ID
        if (data.employee_id) {
            const idExists = await Employee.checkEmployeeId(data.employee_id, req.params.id);
            if (idExists) return res.status(400).json({ status: false, message: 'Employee ID already exists' });
        }

        // Validate Contact info
        if (data.email) {
            const isEmailAvailable = await Employee.checkContactAvailability('email', data.email, req.params.id);
            if (!isEmailAvailable) return res.status(400).json({ status: false, message: 'Email already exists' });
        }
        if (data.mobile_number) {
            const isMobileAvailable = await Employee.checkContactAvailability('mobile', data.mobile_number, req.params.id);
            if (!isMobileAvailable) return res.status(400).json({ status: false, message: 'Mobile number already exists' });
        }

        // Validate Username
        if (data.username) {
            const isUsernameAvailable = await Employee.checkUsername(data.username, req.params.id);
            if (!isUsernameAvailable) return res.status(400).json({ status: false, message: 'Username already exists' });
        }

        // Handle file uploads
        if (req.files) {
            if (req.files.profile_picture) {
                data.profile_picture = `/uploads/employees/${req.files.profile_picture[0].filename}`;
            }
            if (req.files.aadhar_front) {
                data.aadhar_front = `/uploads/employees/${req.files.aadhar_front[0].filename}`;
            }
            if (req.files.aadhar_back) {
                data.aadhar_back = `/uploads/employees/${req.files.aadhar_back[0].filename}`;
            }
            if (req.files.pan_card) {
                data.pan_card = `/uploads/employees/${req.files.pan_card[0].filename}`;
            }
            if (req.files.cancelled_cheque) {
                data.cancelled_cheque = `/uploads/employees/${req.files.cancelled_cheque[0].filename}`;
            }
        }

        await Employee.update(req.params.id, data, req.user.id);
        res.status(200).json({ status: true, message: 'Employee updated successfully' });
    } catch (error) {
        console.error('Update Employee Error:', error);
        res.status(500).json({ status: false, message: error.message });
    }
};

const deleteEmployee = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id, req.user.id);
        if (!employee) {
            return res.status(404).json({ status: false, message: 'Employee not found' });
        }
        await Employee.delete(req.params.id, req.user.id);
        res.status(200).json({ status: true, message: 'Employee deleted successfully' });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

module.exports = {
    createEmployee,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
    getEmployeesDashboard,
    checkEmployeeId,
    checkContactAvailability,
    checkUsername
};
