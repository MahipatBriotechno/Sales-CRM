const { pool } = require('../config/db');

async function setupRecruitmentTables() {
    try {
        console.log('Starting recruitment tables setup...');

        // 1. Update jobs table with new columns
        await pool.execute(`
            ALTER TABLE jobs 
            ADD COLUMN IF NOT EXISTS application_link VARCHAR(255) UNIQUE,
            ADD COLUMN IF NOT EXISTS interview_rounds JSON,
            ADD COLUMN IF NOT EXISTS application_fields JSON
        `);
        console.log('Jobs table updated.');

        // 2. Create applicants table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS applicants (
                id INT AUTO_INCREMENT PRIMARY KEY,
                job_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                resume VARCHAR(255),
                application_data JSON,
                status VARCHAR(255) DEFAULT 'Applied',
                current_round_index INT DEFAULT 0,
                interview_feedback JSON,
                offer_letter_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
            )
        `);
        console.log('Applicants table created.');

        // 3. Create offer_letters table (optional but good for tracking)
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS offer_letters (
                id INT AUTO_INCREMENT PRIMARY KEY,
                applicant_id INT NOT NULL,
                job_id INT NOT NULL,
                offer_data JSON,
                status ENUM('Draft', 'Sent', 'Accepted', 'Declined') DEFAULT 'Draft',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE,
                FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
            )
        `);
        console.log('Offer letters table created.');

        console.log('Recruitment tables setup completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error setting up recruitment tables:', error);
        process.exit(1);
    }
}

setupRecruitmentTables();
