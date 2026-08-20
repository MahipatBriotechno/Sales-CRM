const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const designationRoutes = require('./routes/designationRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const teamRoutes = require('./routes/teamRoutes');
const businessInfoRoutes = require('./routes/businessInfoRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const termsRoutes = require('./routes/termsRoutes');
const companyPolicyRoutes = require('./routes/companyPolicyRoutes');
const hrPolicyRoutes = require('./routes/hrPolicyRoutes');
const salaryRoutes = require('./routes/salaryRoutes');
const jobRoutes = require('./routes/jobRoutes');
const hrmDashboardRoutes = require('./routes/hrmDashboardRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const applicantRoutes = require('./routes/applicantRoutes');
const path = require('path');

dotenv.config();

const app = express();

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174',
    process.env.FRONTEND_URL,
].filter(Boolean).map(url => url.trim().replace(/\/$/, ""));

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        const cleanedOrigin = origin.trim().replace(/\/$/, "");
        const isAllowed = allowedOrigins.includes(cleanedOrigin);

        if (isAllowed || process.env.NODE_ENV === 'development') {
            return callback(null, true);
        } else {
            console.error(`CORS Error: Origin ${origin} is not allowed. Allowed Origins: ${allowedOrigins.join(', ')}`);
            return callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-Auth-Token'],
    exposedHeaders: ['Set-Cookie']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/designations', designationRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/business-info', businessInfoRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/terms', termsRoutes);
app.use('/api/company-policies', companyPolicyRoutes);
app.use('/api/hr-policies', hrPolicyRoutes);
app.use('/api/salaries', salaryRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applicants', applicantRoutes);
app.use('/api/hrm-dashboard', hrmDashboardRoutes);
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/catalogs', require('./routes/catalogRoutes'));
app.use('/api/catalog-categories', require('./routes/catalogCategoryRoutes'));
app.use('/api/notes', require('./routes/noteRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/quotations', require('./routes/quotationRoutes'));
app.use('/api/expenses', expenseRoutes);
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/announcement-categories', require('./routes/announcementCategoryRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/clients', require('./routes/clientRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api', require('./routes/pipelineRoutes'));
app.use('/api/leads', require('./routes/leadRoutes'));
app.use('/api/stages', require('./routes/stageRoutes'));
app.use('/api/enterprises', require('./routes/enterpriseRoutes'));
app.use('/api/subscriptions', require('./routes/subscriptionRoutes'));
app.use('/api/product-keys', require('./routes/productKeyRoutes'));
app.use('/api/plans', require('./routes/planRoutes'));
app.use('/api/crm-dashboard', require('./routes/crmDashboardRoutes'));
app.use('/api/main-dashboard', require('./routes/mainDashboardRoutes'));
app.use('/api/messenger', require('./routes/messengerRoutes'));
app.use('/api/offer-letters', require('./routes/offerLetterRoutes'));
app.use('/api/integrations', require('./routes/integrationRoutes'));
app.use('/api/lead-assignment', require('./routes/leadAssignmentRoutes'));
app.use('/api/campaigns', require('./routes/campaignRoutes'));
app.use('/api/goals', require('./routes/goalRoutes'));
app.use('/api/visitors', require('./routes/visitorRoutes'));
app.use('/api/shifts', require('./routes/shiftRoutes'));
app.use('/api/meetings', require('./routes/meetingRoutes'));
app.use('/api/wallet', require('./routes/walletRoutes'));
app.use('/api/super-admin', require('./routes/superAdminDashboardRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));




app.get('/', (req, res) => {
    res.send('API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

module.exports = app;
