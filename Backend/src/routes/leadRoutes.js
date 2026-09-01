const express = require('express');
const router = express.Router();
const {
    createLead,
    getLeads,
    getLeadAnalysis,
    getLeadById,
    updateLead,
    deleteLead,
    getTrashedLeads,
    permanentDeleteLead,
    restoreLead,
    hitCall,
    analyzeLead,
    checkCallConflict,
    getLeadNotes,
    addLeadNote,
    addLeadNoteComment,
    getLeadCalls,
    addLeadCall,
    getLeadFiles,
    addLeadFile,
    getLeadActivities,
    getLeadMeetings,
    addLeadMeeting,
    updateLeadStatus,
    updateLeadNote,
    updateLeadCall,
    updateLeadFile,
    updateLeadMeeting,
    deleteLeadNote,
    deleteLeadCall,
    deleteLeadFile,
    deleteLeadMeeting,
    bulkCreateLeads,
    getAssignmentHistory,
    getDueReminders,
    snoozeLead,
    getDueMeetings,
    getEmployeePerformance,
    convertLeadToClient,
    addLeadActivity,
    getLeadDashboard,
    getWatchTicker
} = require('../controllers/leadController');
const { protect } = require('../middleware/authMiddleware');
const { checkLimit } = require('../middleware/limitMiddleware');
const upload = require('../middleware/uploadMiddleware'); // Added

router.post('/bulk', protect, bulkCreateLeads);
router.post('/', protect, checkLimit('leads'), createLead);
router.get('/', protect, getLeads);
router.get('/analysis', protect, getLeadAnalysis);
router.get('/dashboard', protect, getLeadDashboard);
router.get('/employee-performance/:id', protect, getEmployeePerformance);
router.get('/check-call-conflict', protect, checkCallConflict);
router.get('/due-reminders', protect, getDueReminders);
router.get('/due-meetings', protect, getDueMeetings);
router.get('/watch-ticker', protect, getWatchTicker);
router.get('/:id', protect, getLeadById);
router.put('/:id', protect, updateLead);
router.delete('/:id', protect, deleteLead);
router.get('/trash/list', protect, getTrashedLeads);
router.delete('/:id/permanent', protect, permanentDeleteLead);
router.post('/:id/restore', protect, restoreLead);
router.post('/:id/hit-call', protect, hitCall);
router.post('/:id/snooze', protect, snoozeLead);
router.post('/:id/analyze', protect, analyzeLead);
router.get('/:id/assignment-history', protect, getAssignmentHistory);

// Notes
router.get('/:id/notes', protect, getLeadNotes);
router.post('/:id/notes', protect, upload.array('files'), addLeadNote);
router.put('/:id/notes/:noteId', protect, updateLeadNote);
router.post('/:id/notes/:noteId/comments', protect, addLeadNoteComment);
router.delete('/:id/notes/:noteId', protect, deleteLeadNote);

// Calls
router.get('/:id/calls', protect, getLeadCalls);
router.post('/:id/calls', protect, addLeadCall);
router.put('/:id/calls/:callId', protect, updateLeadCall);
router.delete('/:id/calls/:callId', protect, deleteLeadCall);

// Files
router.get('/:id/files', protect, getLeadFiles);
router.post('/:id/files', protect, upload.array('files'), addLeadFile);
router.put('/:id/files/:fileId', protect, updateLeadFile);
router.delete('/:id/files/:fileId', protect, deleteLeadFile);

// Activities
router.get('/:id/activities', protect, getLeadActivities);
router.post('/:id/activities', protect, addLeadActivity);

// Meetings
router.get('/:id/meetings', protect, getLeadMeetings);
router.post('/:id/meetings', protect, addLeadMeeting);
router.put('/:id/meetings/:meetingId', protect, updateLeadMeeting);
router.delete('/:id/meetings/:meetingId', protect, deleteLeadMeeting);

// Status
router.put('/:id/status', protect, updateLeadStatus);
router.post('/:id/convert', protect, upload.fields([{ name: 'agreement', maxCount: 1 }, { name: 'quotation', maxCount: 1 }]), convertLeadToClient);

module.exports = router;
