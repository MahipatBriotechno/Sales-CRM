const Lead = require('../models/leadModel');
const Employee = require('../models/employeeModel');
const Client = require('../models/clientModel');
const { pool } = require('../config/db');
const LeadResources = require('../models/leadResourcesModel'); // Added
const leadAssignmentService = require('../services/leadAssignmentService');
const LeadAssignmentLog = require('../models/leadAssignmentLogModel');
const LeadAssignmentSettings = require('../models/leadAssignmentSettingsModel');
const notificationService = require('../services/notificationService');

const createLead = async (req, res) => {
    try {
        // Set lead_owner to the logged-in user's name (creator)
        const leadOwner = req.user.employee_name || req.user.username || req.body.lead_owner || 'admin';
        req.body.lead_owner = leadOwner;

        const id = await Lead.create(req.body, req.user.id);

        // If manual assignment was provided in the request body
        const assignedTo = req.body.owner || req.body.assigned_to;
        if (assignedTo) {
            await LeadAssignmentLog.create({
                user_id: req.user.id,
                lead_id: id,
                employee_id: assignedTo,
                assigned_by: leadOwner,
                assignment_type: 'manual',
                reason: 'Initial Assignment'
            });

            // Trigger Notification for manual assignment
            await notificationService.createNotification(
                assignedTo,
                'employee',
                'lead',
                'New Lead Assigned',
                `You have been assigned a new lead: ${req.body.name || 'New Lead'}`,
                'high',
                'FiUserPlus'
            );
        }
        // Trigger Auto-Assignment
        await leadAssignmentService.autoAssign(id, req.user.id);

        // Log Activity
        await LeadResources.addActivity({
            lead_id: id,
            activity_type: 'notification',
            title: 'New Lead Created',
            description: `Lead ${req.body.name || 'New Lead'} was created and added to the system.`
        }, req.user.id);

        // Log Reminder if set
        if (req.body.next_call_at) {
            await LeadResources.addActivity({
                lead_id: id,
                activity_type: 'notification',
                title: 'Follow-up Reminder Set',
                description: `A follow-up task has been scheduled for ${new Date(req.body.next_call_at).toLocaleString()}.`
            }, req.user.id);
        }

        res.status(201).json({ status: true, message: 'Lead created successfully', id });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

const getLeads = async (req, res) => {
    try {
        await Lead.checkMissedLeads(req.user.id);
        const { page, limit, search, status, pipeline_id, tag, type, subview, priority, services, dateFrom, dateTo, name, mobile_number } = req.query;
        const data = await Lead.findAll(req.user.id, page, limit, search, status, pipeline_id, tag, type, subview, priority, services, dateFrom, dateTo, name, mobile_number);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getLeadById = async (req, res) => {
    try {
        await Lead.checkMissedLeads(req.user.id);
        const lead = await Lead.findById(req.params.id, req.user.id);
        if (!lead) return res.status(404).json({ message: 'Lead not found' });
        res.status(200).json(lead);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateLead = async (req, res) => {
    try {
        const leadId = req.params.id;
        const userId = req.user.id;

        // Get current lead to check for assignment changes
        const currentLead = await Lead.findById(leadId, userId);
        if (!currentLead) return res.status(404).json({ message: 'Lead not found' });

        // Check if owner/assignment is changing
        const newOwnerId = req.body.owner || req.body.assigned_to;
        const oldOwnerId = currentLead.assigned_to;

        // If assignment changed and owner_name wasn't provided, fetch it to keep Grid Card synced
        if (newOwnerId && String(newOwnerId) !== String(oldOwnerId) && !req.body.owner_name) {
            const [emps] = await pool.query(
                'SELECT employee_name FROM employees WHERE id = ? OR employee_id = ?',
                [newOwnerId, newOwnerId]
            );
            if (emps.length > 0) {
                req.body.owner_name = emps[0].employee_name;
            }
        }

        await Lead.update(leadId, req.body, userId);

        // Build a specific, meaningful activity title based on what changed
        const fieldLabels = {
            name: 'Name',
            full_name: 'Full Name',
            mobile_number: 'Mobile Number',
            email: 'Email',
            alt_mobile_number: 'Alternate Mobile',
            whatsapp_number: 'WhatsApp Number',
            gender: 'Gender',
            dob: 'Date of Birth',
            address: 'Address',
            city: 'City',
            state: 'State',
            pincode: 'Pincode',
            country: 'Country',
            organization_name: 'Organization',
            industry_type: 'Industry',
            website: 'Website',
            company_email: 'Company Email',
            company_phone: 'Company Phone',
            designation: 'Designation',
            lead_source: 'Lead Source',
            interested_in: 'Interested In',
            value: 'Lead Value',
            priority: 'Priority',
            tag: 'Tag',
            status: 'Status',
            description: 'Description',
            pipeline_id: 'Pipeline',
            stage_id: 'Stage',
            type: 'Lead Type',
            visibility: 'Visibility',
            gst_number: 'GST Number',
            gst_pan_number: 'PAN/GST Number',
            primary_contact_name: 'Primary Contact',
            primary_mobile: 'Primary Mobile',
            primary_email: 'Primary Email',
        };

        const changedFields = [];
        for (const [key, label] of Object.entries(fieldLabels)) {
            if (req.body[key] !== undefined && String(req.body[key]) !== String(currentLead[key] ?? '')) {
                changedFields.push(label);
            }
        }

        // Handle assignment change explicitly
        let activityTitle = '';
        let activityDescription = `Updated by ${req.user.employee_name || req.user.username || 'admin'}.`;

        if (newOwnerId && String(newOwnerId) !== String(oldOwnerId)) {
            const assignedName = req.body.owner_name || newOwnerId;
            activityTitle = `Lead Profile Update: Assigned To ${assignedName}`;
            activityDescription = `Lead was assigned to ${assignedName} by ${req.user.employee_name || req.user.username || 'admin'}.`;
        } else if (changedFields.length === 1) {
            activityTitle = `Lead Profile Update: ${changedFields[0]} Updated`;
            activityDescription = `${changedFields[0]} was updated by ${req.user.employee_name || req.user.username || 'admin'}.`;
        } else if (changedFields.length > 1) {
            activityTitle = `Lead Profile Update: ${changedFields.slice(0, 2).join(' & ')} Updated`;
            activityDescription = `${changedFields.join(', ')} were updated by ${req.user.employee_name || req.user.username || 'admin'}.`;
        } else {
            activityTitle = 'Lead Profile Update';
            activityDescription = `Lead details were updated by ${req.user.employee_name || req.user.username || 'admin'}.`;
        }

        await LeadResources.addActivity({
            lead_id: leadId,
            activity_type: 'notification',
            title: activityTitle,
            description: activityDescription
        }, userId);

        // Check for reminder update
        if (req.body.next_call_at && req.body.next_call_at !== currentLead.next_call_at) {
            await LeadResources.addActivity({
                lead_id: leadId,
                activity_type: 'notification',
                title: 'Follow-up Reminder Rescheduled',
                description: `Follow-up has been rescheduled to ${new Date(req.body.next_call_at).toLocaleString()}.`
            }, userId);
        }

        // Create assignment log if owner changed
        // Use loose comparison via String() to handle ID type mismatches (int vs string)
                if (newOwnerId && String(newOwnerId) !== String(oldOwnerId)) {
                    await LeadAssignmentLog.create({
                        user_id: userId,
                        lead_id: leadId,
                        employee_id: newOwnerId,
                        assigned_by: req.user.employee_name || req.user.username || 'admin',
                        assignment_type: 'manual',
                        reassigned_from: oldOwnerId,
                        reason: 'Lead Profile Update'
                    });

                    // Send Notification to the new owner
                    await notificationService.createNotification(
                        newOwnerId,
                        'employee',
                        'lead',
                        'New Lead Assigned',
                        `Lead "${currentLead.name || currentLead.full_name || 'New Lead'}" has been assigned to you by ${req.user.employee_name || 'Admin'}.`,
                        'high',
                        'Users'
                    );
                }

        res.status(200).json({ status: true, message: 'Lead updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteLead = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id, req.user.id);
        if (!lead) return res.status(404).json({ message: 'Lead not found' });

        await Lead.delete(req.params.id, req.user.id);
        res.status(200).json({ status: true, message: 'Lead deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const hitCall = async (req, res) => {
    try {
        const userId = req.user.id;
        const leadId = req.params.id;
        const { status, next_call_at, drop_reason, create_reminder, not_connected_reason, remarks, priority, duration } = req.body;

        // Get current lead before update to know current owner
        const currentLead = await Lead.findById(leadId, userId);

        const result = await Lead.hitCall(leadId, status, next_call_at, drop_reason, userId, create_reminder, not_connected_reason, remarks, priority, duration);

        // Auto-analyze after call
        await Lead.analyzeLead(leadId, userId);

        // Auto-Reassignment Check
        let reassigned = false;
        let reassignMessage = '';

        // Auto-Reassignment Check - DISABLED as per new manual "Pass" flow
        /* 
        if (status === 'not_connected') {
            const settings = await LeadAssignmentSettings.findByUserId(userId);
            const maxAttempts = settings?.max_call_attempts || 5;

            if (result.call_count >= maxAttempts) {
                console.log(`Lead ${leadId} reached max call attempts (${maxAttempts}). Processing...`);

                let updateData = {
                    assigned_to: null,
                    owner_name: null,
                    assigned_at: null,
                    tag: 'Not Contacted', // Make it look like a New Lead
                    status: 'New Lead',   // Reset status
                    call_count: 0,        // Reset Attempts for new agent
                    not_connected_count: 0
                };

                if (settings?.auto_disqualification && !settings?.reassignment_on_disqualified) {
                    updateData.tag = 'Lost';
                    updateData.drop_reason = `Auto-drop: Max attempts reached (${maxAttempts})`;
                }

                await Lead.update(leadId, updateData, userId);

                await LeadAssignmentLog.create({
                    user_id: userId,
                    lead_id: leadId,
                    employee_id: 0,
                    assigned_by: 'system',
                    assignment_type: 'auto',
                    reassigned_from: currentLead?.assigned_to || null,
                    reason: `Max attempts reached (${maxAttempts})`
                });

                // Log into Activity Timeline
                await LeadResources.addActivity({
                    lead_id: leadId,
                    activity_type: 'notification',
                    title: 'Lead Unassigned (Max Attempts)',
                    description: `Limit reached (${maxAttempts}). ${updateData.tag === 'Lost' ? 'Marked as Lost.' : 'Moved to fresh pool.'}`
                }, userId);

                if (settings?.mode === 'auto' && settings?.reassignment_on_disqualified) {
                    await leadAssignmentService.autoAssign(leadId, userId, currentLead?.assigned_to);
                    reassigned = true;
                    reassignMessage = `Lead reached ${maxAttempts} attempts and has been reassigned to a new agent.`;
                } else {
                    reassigned = true; // Still marked as reassigned/moved even if just unassigned
                    reassignMessage = `Lead reached ${maxAttempts} attempts and moved to fresh pool.`;
                }
            }
        }
        */

        res.status(200).json({
            status: true,
            message: reassignMessage || 'Call status updated',
            data: result,
            reassigned: reassigned
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

const analyzeLead = async (req, res) => {
    try {
        await Lead.analyzeLead(req.params.id, req.user.id);
        res.status(200).json({ status: true, message: 'Lead analysis completed' });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

const getLeadAnalysis = async (req, res) => {
    try {
        const analysis = await Lead.getAnalysis(req.user.id);
        res.status(200).json(analysis);
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

const getEmployeePerformance = async (req, res) => {
    try {
        const performance = await Lead.getEmployeePerformance(req.params.id, req.user.id);
        if (!performance) return res.status(404).json({ message: 'Employee not found' });
        res.status(200).json(performance);
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

const getLeadDashboard = async (req, res) => {
    try {
        const data = await Lead.getDashboardData(req.user.id);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

const getAssignmentHistory = async (req, res) => {
    try {
        const history = await LeadAssignmentLog.findByLeadId(req.params.id);
        res.status(200).json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getLeadNotes = async (req, res) => {
    try {
        const notes = await LeadResources.getNotes(req.params.id, req.user.id);
        res.status(200).json(notes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const addLeadNote = async (req, res) => {
    try {
        const { title, description } = req.body;
        // Handle files if any (assuming multer middleware populates req.files)
        const files = req.files ? req.files.map(file => ({
            name: file.originalname,
            path: file.path,
            type: file.mimetype,
            size: file.size
        })) : [];

        const result = await LeadResources.addNote({
            lead_id: req.params.id,
            title,
            description,
            files
        }, req.user.id);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const addLeadNoteComment = async (req, res) => {
    try {
        const { noteId } = req.params;
        const { text } = req.body;
        const userId = req.user.id;
        const userName = req.user.employee_name || req.user.username || req.user.firstName || 'User';

        const comment = await LeadResources.addNoteComment(noteId, userId, {
            user_name: userName,
            text: text
        });

        // Log Activity
        await LeadResources.addActivity({
            lead_id: req.params.id,
            activity_type: 'notification',
            title: 'Comment Added to Note',
            description: `${userName} added a comment to a note.`
        }, userId);

        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getLeadCalls = async (req, res) => {
    try {
        const calls = await LeadResources.getCalls(req.params.id, req.user.id);
        res.status(200).json(calls);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const addLeadCall = async (req, res) => {
    try {
        const { status, date, note, followTask, priority, duration } = req.body;
        const userId = req.user.id;
        const leadId = req.params.id;

        const result = await LeadResources.addCall({
            lead_id: leadId,
            status,
            date,
            note,
            follow_task: followTask === 'true' || followTask === true,
            duration: parseInt(duration) || null,
            priority: priority || 'Medium'
        }, userId);

        // Update Lead priority and next_call_at
        const updateData = {
            priority: priority || 'Medium',
            last_call_at: new Date(),
            last_call_duration: parseInt(duration) || null
        };

        if (date) {
            updateData.next_call_at = new Date(date);
        }

        await Lead.update(leadId, updateData, userId);

        // Create Task if followTask is true
        if (followTask && date) {
            await pool.query(
                `INSERT INTO tasks (user_id, title, description, priority, due_date, due_time, category, status, completed, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, UTC_TIMESTAMP())`,
                [
                    userId,
                    `Follow-up check: Manual log for ${status}`,
                    note || 'No notes provided',
                    (priority || 'Medium').toLowerCase(),
                    date.split('T')[0],
                    date.split('T')[1] || '09:00:00',
                    'Follow-up',
                    'Pending'
                ]
            );
        }

        // Trigger Auto-Assignment Engine logic for call results
        const leadAssignmentService = require('../services/leadAssignmentService');
        await leadAssignmentService.handleCallResult(leadId, true, userId); // Manual logs usually imply connection

        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getLeadFiles = async (req, res) => {
    try {
        const files = await LeadResources.getFiles(req.params.id, req.user.id);
        res.status(200).json(files);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const addLeadFile = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const results = [];
        for (const file of req.files) {
            const result = await LeadResources.addFile({
                lead_id: req.params.id,
                name: file.originalname,
                path: file.path,
                type: file.mimetype,
                size: file.size,
                description: req.body.description
            }, req.user.id);
            results.push(result);
        }

        res.status(201).json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getLeadActivities = async (req, res) => {
    try {
        const activities = await LeadResources.getActivities(req.params.id, req.user.id);
        res.status(200).json(activities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getLeadMeetings = async (req, res) => {
    try {
        const meetings = await LeadResources.getMeetings(req.params.id, req.user.id);
        res.status(200).json(meetings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const addLeadMeeting = async (req, res) => {
    try {
        const { title, description, date, time, attendees } = req.body;

        // Check for conflicts
        const conflicts = await LeadResources.checkMeetingConflict(req.user.id, date, time);
        if (conflicts.length > 0) {
            return res.status(409).json({
                status: false,
                message: 'Meeting conflict detected. Another meeting is already scheduled at this time.',
                conflicts
            });
        }

        const result = await LeadResources.addMeeting({
            lead_id: req.params.id,
            title,
            description,
            date,
            time,
            meeting_type: req.body.meeting_type,
            meeting_link: req.body.meeting_link,
            address_line1: req.body.address_line1,
            address_line2: req.body.address_line2,
            city: req.body.city,
            state: req.body.state,
            pincode: req.body.pincode,
            send_whatsapp_reminder: req.body.send_whatsapp_reminder,
            attendees: Array.isArray(attendees) ? attendees : (attendees ? attendees.split(',').map(s => s.trim()) : [])
        }, req.user.id);

        // Log Meeting Scheduled Activity
        await LeadResources.addActivity({
            lead_id: req.params.id,
            activity_type: 'notification',
            title: 'Meeting Scheduled',
            description: `A new meeting "${title}" has been scheduled for ${new Date(date).toLocaleDateString()} at ${time}.`
        }, req.user.id);

        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

const getDueMeetings = async (req, res) => {
    try {
        const meetings = await LeadResources.getDueMeetings(req.user.id);
        res.status(200).json(meetings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateLeadStatus = async (req, res) => {
    try {
        const { status, tag, drop_reason, remarks } = req.body;
        const leadId = req.params.id;
        const userId = req.user.id;

        // Fetch current lead to see if it's assigned
        const currentLead = await Lead.findById(leadId, userId);
        const oldOwnerId = currentLead?.assigned_to || null;

        // New Logic: If status is "Dropped" manually from Profile...
        if (status === 'Dropped' || tag === 'Dropped') {
            try {
                console.log(`[DEBUG] Processing manual drop for lead ${leadId} by user ${userId}`);
                const updateData = {
                    status: 'New Lead',
                    tag: 'Pass',
                    assigned_to: null,
                    owner_name: null,
                    assigned_at: null,
                    call_count: 0,
                    not_connected_count: 0,
                    drop_reason: drop_reason || 'Manual Pass/Reassign',
                    duplicate_reason: remarks || null
                };

                await Lead.update(leadId, updateData, userId);
                console.log(`[DEBUG] Lead ${leadId} updated to Pass/New Lead`);

                // Create assignment log for "Pass"
                await LeadAssignmentLog.create({
                    user_id: userId,
                    lead_id: leadId,
                    employee_id: 0,
                    assigned_by: req.user.employee_name || req.user.username || req.user.firstName || 'admin',
                    assignment_type: 'manual',
                    reassigned_from: oldOwnerId,
                    reason: `Lead Passed (Manual Drop Triggered)`
                });
                console.log(`[DEBUG] Assignment log created for lead ${leadId}`);

                // Log Activity
                await LeadResources.addActivity({
                    lead_id: leadId,
                    activity_type: 'notification',
                    title: 'Lead Passed for Re-assignment',
                    description: `Reason: ${drop_reason || 'Manual Drop'}.${remarks ? ` Remarks: ${remarks}` : ''}`
                }, userId);
                console.log(`[DEBUG] Activity logged for lead ${leadId}`);

                // Trigger immediate reassignment
                console.log(`[DEBUG] Triggering auto-assignment for lead ${leadId}`);
                await leadAssignmentService.autoAssign(leadId, userId, oldOwnerId);
                console.log(`[DEBUG] Auto-assignment complete for lead ${leadId}`);

                return res.status(200).json({ status: true, message: 'Lead passed to new agent successfully' });
            } catch (innerError) {
                console.error('[DEBUG ERROR] Error in manual drop block:', innerError);
                throw innerError; // Rethrow to be caught by outer catch
            }
        }

        // Default behavior for other statuses
        const updateData = {};
        if (status) updateData.status = status;
        if (tag) updateData.tag = tag;
        if (drop_reason) updateData.drop_reason = drop_reason;

        await Lead.update(leadId, updateData, userId);

        // If tag is "Won", automatically create a client
        if (tag === 'Won') {
            const lead = await Lead.findById(leadId, userId);
            if (lead) {
                // Check if client already exists (by email or phone)
                const existingClient = await Client.findByEmailOrPhone(userId, lead.email, lead.mobile_number);

                if (!existingClient) {
                    const nameParts = (lead.name || lead.full_name || '').split(' ');
                    const firstName = nameParts[0] || '';
                    const lastName = nameParts.slice(1).join(' ') || '';

                    // Map lead type to client type (Individual -> person)
                    const clientType = lead.type === 'Individual' ? 'person' : (lead.type || 'person');

                    await Client.create({
                        type: clientType,
                        first_name: firstName,
                        last_name: lastName,
                        email: lead.email,
                        phone: lead.mobile_number,
                        company_name: lead.organization_name || lead.company || lead.company_name,
                        position: lead.designation,
                        source: lead.lead_source || lead.source,
                        industry: lead.industry_type || lead.industry,
                        website: lead.website,
                        address: lead.address,
                        city: lead.city,
                        state: lead.state,
                        zip_code: lead.pincode,
                        country: lead.country,
                        status: 'active',
                        notes: `Automatically converted from Lead ${lead.lead_id}`
                    }, userId);
                }
            }
        }

        res.status(200).json({ status: true, message: 'Status updated' });

        // Log Activity
        await LeadResources.addActivity({
            lead_id: leadId,
            activity_type: tag === 'Won' ? 'won' : (tag === 'Dropped' ? 'dropped' : 'status_change'),
            title: `Status Changed to ${tag || status}`,
            description: `Status updated to ${status}${tag ? ` (${tag})` : ''}.${remarks ? ` Remarks: ${remarks}` : ''}`
        }, userId);
    } catch (error) {
        console.error('Error in updateLeadStatus:', error);
        res.status(500).json({ status: false, message: error.message });
    }
};

// Update methods
const updateLeadNote = async (req, res) => {
    try {
        const result = await LeadResources.updateNote(req.params.noteId, req.body, req.user.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const addLeadActivity = async (req, res) => {
    try {
        const { activity_type, title, description } = req.body;
        const result = await LeadResources.addActivity({
            lead_id: req.params.id,
            activity_type,
            title,
            description
        }, req.user.id);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateLeadCall = async (req, res) => {
    try {
        const result = await LeadResources.updateCall(req.params.callId, req.body, req.user.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateLeadFile = async (req, res) => {
    try {
        const result = await LeadResources.updateFile(req.params.fileId, req.body, req.user.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateLeadMeeting = async (req, res) => {
    try {
        const { title, description, date, time, attendees } = req.body;
        const meetingId = req.params.meetingId;

        // Check for conflicts
        const conflicts = await LeadResources.checkMeetingConflict(req.user.id, date, time, meetingId);
        if (conflicts.length > 0) {
            return res.status(409).json({
                status: false,
                message: 'Meeting conflict detected. Another meeting is already scheduled at this time.',
                conflicts
            });
        }

        const result = await LeadResources.updateMeeting(meetingId, {
            title,
            description,
            date,
            time,
            meeting_type: req.body.meeting_type,
            meeting_link: req.body.meeting_link,
            address_line1: req.body.address_line1,
            address_line2: req.body.address_line2,
            city: req.body.city,
            state: req.body.state,
            pincode: req.body.pincode,
            send_whatsapp_reminder: req.body.send_whatsapp_reminder,
            attendees: Array.isArray(attendees) ? attendees : (attendees ? attendees.split(',').map(s => s.trim()) : [])
        }, req.user.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// Delete methods
const deleteLeadNote = async (req, res) => {
    try {
        await LeadResources.deleteNote(req.params.noteId, req.user.id);
        res.status(200).json({ message: 'Note deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteLeadCall = async (req, res) => {
    try {
        await LeadResources.deleteCall(req.params.callId, req.user.id);
        res.status(200).json({ message: 'Call deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteLeadFile = async (req, res) => {
    try {
        await LeadResources.deleteFile(req.params.fileId, req.user.id);
        res.status(200).json({ message: 'File deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteLeadMeeting = async (req, res) => {
    try {
        await LeadResources.deleteMeeting(req.params.meetingId, req.user.id);
        res.status(200).json({ message: 'Meeting deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getDueReminders = async (req, res) => {
    try {
        await Lead.checkMissedLeads(req.user.id);
        const reminders = await Lead.getDueReminders(req.user.id);
        res.status(200).json(reminders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const convertLeadToClient = async (req, res) => {
    try {
        const leadId = req.params.id;
        const userId = req.user.id;
        const { budget, project_type, start_date, end_date, subscription_date, services, quotation_id } = req.body;

        const lead = await Lead.findById(leadId, userId);
        if (!lead) return res.status(404).json({ message: 'Lead not found' });

        // Handle file paths from upload middleware
        const agreement_url = req.files && req.files['agreement'] ? req.files['agreement'][0].path : null;
        let quotation_url = req.files && req.files['quotation'] ? req.files['quotation'][0].path : null;

        // Create client data
        const clientData = {
            type: lead.type === 'Individual' ? 'person' : (lead.type || 'person'),
            first_name: (lead.name || lead.full_name || '').split(' ')[0] || '',
            last_name: (lead.name || lead.full_name || '').split(' ').slice(1).join(' ') || '',
            email: lead.email,
            phone: lead.mobile_number || lead.phone,
            company_name: lead.organization_name || lead.company || lead.company_name,
            position: lead.designation,
            source: lead.lead_source || lead.source,
            industry: lead.industry_type || lead.industry,
            website: lead.website,
            address: lead.address,
            city: lead.city,
            state: lead.state,
            zip_code: lead.pincode,
            country: lead.country,
            status: 'active',
            notes: `Converted from Lead ${lead.lead_id || lead.id}`,
            // New fields
            agreement_url,
            quotation_id: quotation_id || null,
            quotation_url: quotation_url || null,
            budget: budget || lead.value || lead.estimated_value || 0,
            services: services || lead.interested_in || '',
            project_type,
            start_date: start_date || null,
            end_date: end_date || null,
            subscription_date: subscription_date || null,
            lead_id: leadId
        };

        const clientId = await Client.create(clientData, userId);
        
        // Link the existing quotation to this client if provided
        if (quotation_id) {
            await pool.query(
                'UPDATE quotations SET client_id = ? WHERE (id = ? OR quotation_id = ?) AND user_id = ?',
                [clientId, quotation_id, quotation_id, userId]
            );
        }

        // Update Lead status to Won
        await Lead.update(leadId, { status: 'Closed', tag: 'Won' }, userId);

        // Log Activity for conversion
        await LeadResources.addActivity({
            lead_id: leadId,
            activity_type: 'won',
            title: 'Lead Converted to Client',
            description: `Lead "${lead.name || lead.full_name || 'Unknown'}" was successfully converted to a client by ${req.user.employee_name || req.user.username || 'admin'}. Client ID: ${clientId}.`
        }, userId);

        res.status(201).json({ status: true, message: 'Lead converted to client successfully', clientId });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

const snoozeLead = async (req, res) => {
    try {
        const { minutes } = req.body;
        const nextCall = await Lead.snoozeLead(req.params.id, req.user.id, minutes);
        res.status(200).json({ status: true, message: `Lead snoozed for ${minutes || 10} minutes`, next_call_at: nextCall });

        // Log Activity
        await LeadResources.addActivity({
            lead_id: req.params.id,
            activity_type: 'snooze',
            title: `Lead Snoozed (${minutes || 10} min)`,
            description: `Lead has been snoozed for ${minutes || 10} minutes. Next follow-up at ${new Date(nextCall).toLocaleString()}`
        }, req.user.id);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getTrashedLeads = async (req, res) => {
    try {
        const { page, limit, search } = req.query;
        const data = await Lead.findTrashed(req.user.id, page, limit, search);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

const permanentDeleteLead = async (req, res) => {
    try {
        await Lead.permanentDelete(req.params.id, req.user.id);
        res.status(200).json({ status: true, message: 'Lead permanently deleted' });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

const restoreLead = async (req, res) => {
    try {
        await Lead.restore(req.params.id, req.user.id);
        res.status(200).json({ status: true, message: 'Lead restored successfully' });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

module.exports = {
    createLead,
    getLeads,
    getLeadById,
    updateLead,
    deleteLead,
    getTrashedLeads,
    permanentDeleteLead,
    restoreLead,
    snoozeLead,
    hitCall,
    analyzeLead,
    getLeadAnalysis,
    getLeadDashboard,
    getEmployeePerformance,
    getAssignmentHistory,
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
    getDueMeetings,
    deleteLeadNote,
    deleteLeadCall,
    deleteLeadFile,
    deleteLeadMeeting,
    checkCallConflict: async (req, res) => {
        try {
            const { dateTime, excludeId } = req.query;
            if (!dateTime) return res.status(400).json({ message: 'DateTime is required' });
            const conflicts = await Lead.checkCallConflict(req.user.id, dateTime, excludeId);
            res.status(200).json(conflicts);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
    bulkCreateLeads: async (req, res) => {
        try {
            const affectedRows = await Lead.bulkCreate(req.body, req.user.id);
            res.status(201).json({ status: true, message: `${affectedRows} leads imported successfully` });
        } catch (error) {
            res.status(500).json({ status: false, message: error.message });
        }
    },
    getDueReminders,
    snoozeLead,
    convertLeadToClient,
    addLeadActivity
};
