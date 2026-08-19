const http = require('http');
const app = require('./app');
const { connectDB } = require('./config/db');
const { initializeSocket } = require('./socket');

const leadAssignmentService = require('./services/leadAssignmentService');

const server = http.createServer(app);
const io = initializeSocket(server);
app.set('socketio', io);

const PORT = process.env.PORT || 5001;

const syncDatabase = require('./utils/syncDb');

// Connect to Database and start server
const startServer = async () => {
    await connectDB();
    await syncDatabase();

    server.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);

        // Start stale lead revert checker (Runs every 1 hour)
        setInterval(() => {
            leadAssignmentService.revertStaleLeads();
        }, 1 * 60 * 60 * 1000);
    });
};

startServer();
