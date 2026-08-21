const { pool } = require('./src/config/db');
const crypto = require('crypto');

async function updateJobLinks() {
    try {
        console.log('Fetching all jobs...');
        const [jobs] = await pool.execute('SELECT id, title, application_link FROM jobs');
        
        let updatedCount = 0;

        for (const job of jobs) {
            // Check if it looks like a standard UUID or just needs updating
            // A UUID is 36 chars long. If it's already a slug, we can skip or regenerate. 
            // We'll just regenerate all of them to be safe and ensure SEO format.
            const slug = (job.title || 'job')
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9 -]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-');
            const uniqueHash = crypto.randomBytes(3).toString('hex');
            const newLink = `${slug}-${uniqueHash}`;

            await pool.execute('UPDATE jobs SET application_link = ? WHERE id = ?', [newLink, job.id]);
            updatedCount++;
            console.log(`Updated job ID ${job.id} ('${job.title}') -> ${newLink}`);
        }

        console.log(`\nSuccessfully updated ${updatedCount} jobs with SEO-friendly links!`);
    } catch (error) {
        console.error('Error updating job links:', error);
    } finally {
        process.exit();
    }
}

updateJobLinks();
