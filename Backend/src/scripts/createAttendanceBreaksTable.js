const { pool } = require('../config/db');

const createAttendanceBreaksTable = async () => {
    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance_breaks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        attendance_id INT NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (attendance_id) REFERENCES attendance(id) ON DELETE CASCADE
      )
    `);
        console.log('Attendance Breaks table created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error creating attendance breaks table:', error);
        process.exit(1);
    }
};

createAttendanceBreaksTable();
