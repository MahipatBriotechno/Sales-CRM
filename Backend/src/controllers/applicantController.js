const Applicant = require('../models/applicantModel');
const Job = require('../models/jobModel');

const applyForJob = async (req, res) => {
    try {
        const { link } = req.params;
        const job = await Job.findByLink(link);
        if (!job) {
            return res.status(404).json({ message: 'Job posting not found' });
        }

        const {
            name,
            email,
            phone,
            application_data
        } = req.body;

        // Note: resume upload should be handled via a different middleware or as a URL/path
        const resume = req.file ? req.file.path : null;

        const applicantId = await Applicant.create({
            job_id: job.id,
            name,
            email,
            phone,
            resume,
            application_data,
            interview_rounds: job.interview_rounds,
            status: 'Applied'
        });

        res.status(201).json({
            id: applicantId,
            message: 'Application submitted successfully'
        });
    } catch (error) {
        console.error('Error submitting application:', error);
        res.status(500).json({ message: 'Error submitting application' });
    }
};

const getApplicants = async (req, res) => {
    try {
        const { page, limit, search, status, job_id } = req.query;
        const data = await Applicant.findAll(req.user.id, {
            page,
            limit,
            search,
            status,
            job_id
        });
        res.json(data);
    } catch (error) {
        console.error('Error fetching applicants:', error);
        res.status(500).json({ message: 'Error fetching applicants' });
    }
};

const getApplicantById = async (req, res) => {
    try {
        const applicant = await Applicant.findById(req.params.id, req.user.id);
        if (!applicant) {
            return res.status(404).json({ message: 'Applicant not found' });
        }
        res.json(applicant);
    } catch (error) {
        console.error('Error fetching applicant:', error);
        res.status(500).json({ message: 'Error fetching applicant' });
    }
};

const updateApplicantStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, current_round_index, interview_feedback, name, email, phone, interview_rounds } = req.body;

        const success = await Applicant.updateStatus(id, req.user.id, {
            status,
            current_round_index,
            interview_feedback,
            name,
            email,
            phone,
            interview_rounds
        });

        if (!success) {
            return res.status(404).json({ message: 'Applicant not found or no changes made' });
        }

        res.json({ message: 'Applicant status updated successfully' });
    } catch (error) {
        console.error('Error updating applicant status:', error);
        res.status(500).json({ message: 'Error updating applicant status' });
    }
};

const getApplicantStats = async (req, res) => {
    try {
        const stats = await Applicant.getStats(req.user.id);
        res.json(stats);
    } catch (error) {
        console.error('Error fetching applicant stats:', error);
        res.status(500).json({ message: 'Error fetching applicant statistics' });
    }
};

const deleteApplicant = async (req, res) => {
    try {
        const success = await Applicant.delete(req.params.id, req.user.id);
        if (!success) {
            return res.status(404).json({ message: 'Applicant not found' });
        }
        res.json({ message: 'Applicant deleted successfully' });
    } catch (error) {
        console.error('Error deleting applicant:', error);
        res.status(500).json({ message: 'Error deleting applicant' });
    }
};

const getJobByLink = async (req, res) => {
    try {
        const { link } = req.params;
        const job = await Job.findByLink(link);
        if (!job) {
            return res.status(404).json({ message: 'Job posting not found' });
        }
        // Remove sensitive info if any before sending to public form
        res.json(job);
    } catch (error) {
        console.error('Error fetching job by link:', error);
        res.status(500).json({ message: 'Error fetching job details' });
    }
};

module.exports = {
    applyForJob,
    getApplicants,
    getApplicantById,
    updateApplicantStatus,
    getApplicantStats,
    deleteApplicant,
    getJobByLink
};
