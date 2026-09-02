const { pool } = require('../config/db');

const syncDatabase = async () => {
    try {
        const sql = `
        CREATE TABLE IF NOT EXISTS channel_configs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            channel_type ENUM('meta', 'justdial', 'indiamart') NOT NULL,
            account_name VARCHAR(255) NOT NULL,
            api_key TEXT,
            config_data JSON,
            status ENUM('active', 'inactive') DEFAULT 'active',
            last_sync_at DATETIME,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        `;
        await pool.query(sql);

        const goalsSql = `
        CREATE TABLE IF NOT EXISTS goals (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            employee_id INT,
            team_id INT,
            goal_title VARCHAR(255) NOT NULL,
            goal_type ENUM('outbound_calls', 'connected_calls', 'meetings_booked', 'deals_won', 'revenue', 'leads', 'proposals') NOT NULL,
            target_value DECIMAL(15,2) NOT NULL,
            period ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly') NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            reward VARCHAR(255),
            description TEXT,
            status ENUM('active', 'achieved', 'failed') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        `;
        await pool.query(goalsSql);

        // Ensure team_id and other updates are reflected even if table exists
        try {
            await pool.query("ALTER TABLE goals ADD COLUMN team_id INT AFTER employee_id");
        } catch (e) {
            // Probably column already exists, safe to ignore
        }

        try {
            await pool.query("ALTER TABLE goals ADD COLUMN reward VARCHAR(255) AFTER end_date");
        } catch (e) {
            // Probably column already exists, safe to ignore
        }

        try {
            await pool.query("ALTER TABLE goals ADD COLUMN description TEXT AFTER reward");
        } catch (e) {
            // Probably column already exists, safe to ignore
        }

        try {
            await pool.query("ALTER TABLE goals MODIFY COLUMN goal_type ENUM('outbound_calls', 'connected_calls', 'meetings_booked', 'deals_won', 'revenue', 'leads', 'proposals', 'calls', 'followups', 'demos', 'meetings') NOT NULL");
            console.log("Database Synced: goal_type ENUM updated successfully in goals table.");
        } catch (e) {
            console.error("Error modifying goal_type ENUM in goals table:", e);
        }

        try {
            await pool.query("ALTER TABLE goals ADD COLUMN priority ENUM('low', 'medium', 'high') DEFAULT 'medium' AFTER description");
        } catch (e) {
            // Already exists
        }

        const visitorSql = `
        CREATE TABLE IF NOT EXISTS visitors (
            id INT AUTO_INCREMENT PRIMARY KEY,
            visitor_name VARCHAR(255) NOT NULL,
            phone_number VARCHAR(20) NOT NULL,
            email VARCHAR(255),
            company_name VARCHAR(255),
            visitor_type VARCHAR(100),
            purpose TEXT,
            host_employee_ids JSON,
            visit_date DATE,
            check_in_time TIME,
            check_out_time TIME,
            status VARCHAR(50) DEFAULT 'Waiting',
            id_proof_type VARCHAR(100),
            id_proof_number VARCHAR(100),
            remarks TEXT,
            send_reminder BOOLEAN DEFAULT 0,
            user_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        );
        `;
        await pool.query(visitorSql);

        const shiftSql = `
        CREATE TABLE IF NOT EXISTS shifts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            shift_name VARCHAR(100) NOT NULL,
            description TEXT,
            check_in_time TIME NOT NULL,
            check_out_time TIME NOT NULL,
            working_hours DECIMAL(5,2),
            attendance_method VARCHAR(100) DEFAULT 'WiFi Check-in',
            grace_period INT DEFAULT 0,
            late_marking BOOLEAN DEFAULT false,
            half_day_enable BOOLEAN DEFAULT false,
            min_work_hours_half_day DECIMAL(5,2),
            half_day_cutoff_time TIME,
            overtime_enable BOOLEAN DEFAULT false,
            min_overtime_after INT,
            overtime_rate DECIMAL(10,2),
            overtime_calculation ENUM('Per Hour', 'Per Minute'),
            max_overtime_per_day INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        `;
        await pool.query(shiftSql);

        try {
            await pool.query("ALTER TABLE shifts ADD COLUMN working_days VARCHAR(255) DEFAULT 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'");
        } catch (e) {
            // Already exists
        }

        try {
            await pool.query("ALTER TABLE employees ADD COLUMN shift_id INT DEFAULT NULL AFTER designation_id");
            await pool.query("ALTER TABLE employees ADD CONSTRAINT fk_employee_shift FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE SET NULL");
        } catch (e) {
            // Already exists or constraint error
        }

        try {
            await pool.query("ALTER TABLE shifts MODIFY COLUMN attendance_method VARCHAR(100) DEFAULT 'WiFi Check-in'");
        } catch (e) {
            console.error('Error modifying attendance_method column:', e);
        }

        try {
            await pool.query("ALTER TABLE attendance ADD COLUMN overtime_hours DECIMAL(5,2) DEFAULT 0");
            await pool.query("ALTER TABLE attendance ADD COLUMN overtime_amount DECIMAL(10,2) DEFAULT 0");
        } catch (e) {
            // Already exists
        }

        try {
            await pool.query("ALTER TABLE offer_letters DROP COLUMN roles_responsibilities, DROP COLUMN clauses");
        } catch (e) {
            // Safe to ignore if columns already dropped or table doesn't exist
        }

        try {
            // Change employee_id from INT to VARCHAR to support 'EMP...' format
            await pool.query("ALTER TABLE offer_letters MODIFY COLUMN employee_id VARCHAR(100)");
            console.log('Database Synced: employee_id column changed to VARCHAR(100) in offer_letters table.');
        } catch (e) {
            console.error('Error modifying employee_id column in offer_letters:', e);
        }

        try {
            const [columns] = await pool.query("SHOW COLUMNS FROM offer_letters LIKE 'notice_period'");
            if (columns.length === 0) {
                await pool.query("ALTER TABLE offer_letters ADD COLUMN notice_period VARCHAR(100) DEFAULT NULL AFTER joining_date");
                console.log('Database Synced: notice_period column successfully added to offer_letters table.');
            }
            else {
                console.log("Database Synced: notice_period column already exists in offer_letters table.");
            }
        } catch (e) {
            console.error('Error adding notice_period column to offer_letters:', e);
        }

        try {
            const [columns] = await pool.query("SHOW COLUMNS FROM employees LIKE 'notice_period'");
            if (columns.length === 0) {
                await pool.query("ALTER TABLE employees ADD COLUMN notice_period VARCHAR(100) DEFAULT NULL AFTER joining_date");
                await pool.query("ALTER TABLE employees ADD COLUMN probation_period VARCHAR(100) DEFAULT NULL AFTER notice_period");
                await pool.query("ALTER TABLE employees ADD COLUMN working_hours VARCHAR(100) DEFAULT NULL AFTER probation_period");
                await pool.query("ALTER TABLE employees ADD COLUMN working_days VARCHAR(100) DEFAULT NULL AFTER working_hours");
                console.log('Database Synced: notice_period, probation_period, working_hours, and working_days columns successfully added to employees table.');
            }
            else {
                // If notice_period exists, let's also specifically check for working_hours just in case
                const [whColumns] = await pool.query("SHOW COLUMNS FROM employees LIKE 'working_hours'");
                if (whColumns.length === 0) {
                    await pool.query("ALTER TABLE employees ADD COLUMN working_hours VARCHAR(100) DEFAULT NULL AFTER probation_period");
                    await pool.query("ALTER TABLE employees ADD COLUMN working_days VARCHAR(100) DEFAULT NULL AFTER working_hours");
                    console.log('Database Synced: working_hours and working_days columns successfully added to employees table.');
                } else {
                    console.log("Database Synced: notice_period, probation_period, working_hours, and working_days columns already exist in employees table.");
                }
            }
        } catch (e) {
            console.error('Error adding notice_period and probation_period to employees:', e);
        }

        const attendanceBreaksSql = `
        CREATE TABLE IF NOT EXISTS attendance_breaks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            attendance_id INT NOT NULL,
            start_time DATETIME NOT NULL,
            end_time DATETIME NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (attendance_id) REFERENCES attendance(id) ON DELETE CASCADE
        );
        `;
        await pool.query(attendanceBreaksSql);

        console.log('Database synced: channel_configs, goals, visitors, shifts, and attendance_breaks tables are ready.');
    } catch (error) {
        console.error('Error syncing database:', error);
    }
};

module.exports = syncDatabase;
