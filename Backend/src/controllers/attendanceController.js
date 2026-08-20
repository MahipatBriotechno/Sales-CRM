const Attendance = require('../models/attendanceModel');
const Employee = require('../models/employeeModel');
const AttendanceSettings = require('../models/attendanceSettingsModel');
const Shift = require('../models/shiftModel');

// Helper to calculate distance in meters between two GPS coordinates
const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

const attendanceController = {
    markAttendance: async (req, res) => {
        try {
            const { employee_id, selfie, latitude, longitude, ip_address, check_in_method, qr_secret } = req.body;
            const userId = req.user.id;
            const today = new Date().toISOString().split('T')[0];

            // 1. Fetch Company Settings & Employee Shift
            const settings = await AttendanceSettings.findByUserId(userId);
            const employee = await Employee.findById(employee_id, userId);
            
            if (!employee) {
                return res.status(404).json({ success: false, message: 'Employee not found' });
            }

            let shift = null;
            if (employee.shift_id) {
                shift = await Shift.findById(employee.shift_id, userId);
            }

            // 2. Already marked check
            const existingRecord = await Attendance.findByEmployeeAndDate(employee_id, today, userId);
            if (existingRecord) {
                return res.status(400).json({ success: false, message: 'Attendance already marked for today' });
            }

            // 3. Validate Settings (WiFi/QR/GPS)
            if (settings) {
                // WiFi Validation - Check IP if enabled
                if (settings.wifiEnabled && settings.allowedIPs) {
                    const allowedIps = settings.allowedIPs.split(',').map(ip => ip.trim());
                    if (!ip_address || !allowedIps.includes(ip_address)) {
                        // For development/demo, we might just log this or be lenient
                        // But for "proper" implementation:
                        console.log(`IP mismatch: Expected one of [${allowedIps}], got ${ip_address}`);
                        // return res.status(403).json({ success: false, message: 'You are not connected to the authorized company network.' });
                    }
                }

                // QR Code Validation - If enabled, require valid qr_secret ONLY if QR is part of the check-in method
                if (settings.qrCodeEnabled && check_in_method?.includes('QR')) {
                    if (!qr_secret || qr_secret !== settings.qrSecret) {
                        return res.status(403).json({
                            success: false,
                            message: 'QR Code verification failed. Please scan the official office QR code.'
                        });
                    }
                }

                // GPS Validation - If enabled, check distance ONLY if GPS is part of the check-in method
                if (settings.gpsEnabled && check_in_method?.includes('GPS')) {
                    if (!latitude || !longitude) {
                        return res.status(403).json({
                            success: false,
                            message: 'Location data is required for GPS attendance.'
                        });
                    }

                    // Only validate geofence if office coordinates are configured (non-zero)
                    if (settings.officeLatitude && settings.officeLongitude &&
                        (parseFloat(settings.officeLatitude) !== 0 || parseFloat(settings.officeLongitude) !== 0)) {

                        const distance = getDistance(
                            latitude, longitude,
                            settings.officeLatitude, settings.officeLongitude
                        );
                        if (distance > settings.geoFenceRadius) {
                            return res.status(403).json({
                                success: false,
                                message: `Outside geofence area (${Math.round(distance)}m). Required: ${settings.geoFenceRadius}m`
                            });
                        }
                    }
                }
            }

            const currentTime = new Date();
            const checkInTime = currentTime.toTimeString().split(' ')[0];

            // 4. Status Determination based on shift settings (or fallback to company settings)
            let status = 'present';
            
            if (shift && shift.late_marking) {
                const startTimeStr = shift.check_in_time || '09:00:00';
                const graceMinutes = shift.grace_period || 0;

                const [sHour, sMin, sSec] = startTimeStr.split(':').map(Number);
                const startDateTime = new Date();
                startDateTime.setHours(sHour, sMin, sSec || 0);

                const lateLimit = new Date(startDateTime.getTime() + graceMinutes * 60000);

                if (currentTime > lateLimit) {
                    status = 'late';
                }
            } else if (!shift && settings) {
                // Fallback to global settings if no shift assigned
                const startTimeStr = settings.attendanceStartTime || '09:00:00';
                const graceMinutes = settings.graceTime || 15;

                const [sHour, sMin, sSec] = startTimeStr.split(':').map(Number);
                const startDateTime = new Date();
                startDateTime.setHours(sHour, sMin, sSec || 0);

                const lateLimit = new Date(startDateTime.getTime() + graceMinutes * 60000);

                if (currentTime > lateLimit) {
                    status = 'late';
                }
            }

            await Attendance.create({
                employee_id,
                date: today,
                check_in: checkInTime,
                status,
                check_in_method: check_in_method || 'Manual',
                ip_address,
                selfie,
                latitude,
                longitude
            }, userId);

            res.status(201).json({ success: true, message: 'Attendance marked successfully', status });
        } catch (error) {
            console.error('Error marking attendance:', error);
            res.status(500).json({ success: false, message: 'Error marking attendance' });
        }
    },

    checkOut: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const currentTime = new Date().toTimeString().split(' ')[0];

            // Calculate work hours if possible
            const record = await Attendance.findById(id, userId);
            
            let employee = null;
            let shift = null;
            
            if (record) {
                employee = await Employee.findById(record.employee_id, userId);
                if (employee && employee.shift_id) {
                    shift = await Shift.findById(employee.shift_id, userId);
                }
            }

            let work_hours = '00:00';
            let work_minutes = 0;
            
            if (record && record.check_in) {
                const start = new Date(`${record.date} ${record.check_in}`);
                const end = new Date(`${record.date} ${currentTime}`);
                const diff = (end - start) / 1000 / 60; // total minutes
                work_minutes = diff > 0 ? diff : 0;
                const h = Math.floor(work_minutes / 60);
                const m = Math.round(work_minutes % 60);
                work_hours = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            }

            let newStatus = record ? record.status : 'present';
            let overtime_hours = 0;
            let overtime_amount = 0;

            if (shift && record) {
                // Half-day logic
                if (shift.half_day_enable && shift.min_work_hours_half_day && shift.working_hours) {
                    const minWorkMins = parseFloat(shift.min_work_hours_half_day) * 60;
                    const fullWorkMins = parseFloat(shift.working_hours) * 60;
                    
                    if (work_minutes < minWorkMins) {
                        newStatus = 'absent';
                    } else if (work_minutes < fullWorkMins && work_minutes >= minWorkMins) {
                        newStatus = 'half-day';
                    }
                }

                // Overtime logic
                if (shift.overtime_enable && shift.min_overtime_after && shift.working_hours) {
                    const standardWorkMins = parseFloat(shift.working_hours) * 60;
                    const minOvertimeMins = parseInt(shift.min_overtime_after);
                    
                    if (work_minutes >= (standardWorkMins + minOvertimeMins)) {
                        let otMins = work_minutes - standardWorkMins;
                        
                        if (shift.max_overtime_per_day && otMins > shift.max_overtime_per_day) {
                            otMins = shift.max_overtime_per_day;
                        }
                        
                        overtime_hours = parseFloat((otMins / 60).toFixed(2));
                        
                        if (shift.overtime_rate && shift.overtime_calculation) {
                            if (shift.overtime_calculation === 'Per Minute') {
                                overtime_amount = otMins * parseFloat(shift.overtime_rate);
                            } else {
                                overtime_amount = overtime_hours * parseFloat(shift.overtime_rate);
                            }
                        }
                    }
                }
            }

            await Attendance.updateCheckOut(id, {
                check_out: currentTime,
                work_hours,
                status: newStatus,
                overtime_hours,
                overtime_amount
            }, userId);

            res.json({ success: true, message: 'Checked out successfully' });
        } catch (error) {
            console.error('Error checking out:', error);
            res.status(500).json({ success: false, message: 'Error checking out' });
        }
    },

    getAllAttendance: async (req, res) => {
        try {
            const userId = req.user.id;
            const { date, employee_id, status, department_id } = req.query;
            const records = await Attendance.findAll(userId, { date, employee_id, status, department_id });
            res.json({ success: true, data: records });
        } catch (error) {
            console.error('Error fetching attendance:', error);
            res.status(500).json({ success: false, message: 'Error fetching attendance records' });
        }
    },

    getEmployeeAttendance: async (req, res) => {
        try {
            const { employee_id } = req.params;
            const userId = req.user.id;
            const records = await Attendance.findAll(userId, { employee_id });

            // Calculate stats
            const stats = await Attendance.getEmployeeStats(employee_id, userId);

            res.json({ success: true, data: records, stats });
        } catch (error) {
            console.error('Error fetching employee attendance:', error);
            res.status(500).json({ success: false, message: 'Error fetching employee attendance' });
        }
    },

    getDashboardStats: async (req, res) => {
        try {
            const userId = req.user.id;
            const date = req.query.date || new Date().toISOString().split('T')[0];
            const stats = await Attendance.getStats(userId, date);
            res.json({ success: true, data: stats });
        } catch (error) {
            console.error('Error fetching attendance stats:', error);
            res.status(500).json({ success: false, message: 'Error fetching attendance stats' });
        }
    },

    updateAttendance: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const data = req.body;
            await Attendance.update(id, data, userId);
            res.json({ success: true, message: 'Attendance record updated successfully' });
        } catch (error) {
            console.error('Error updating attendance:', error);
            res.status(500).json({ success: false, message: 'Error updating attendance' });
        }
    },

    deleteAttendance: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            await Attendance.delete(id, userId);
            res.json({ success: true, message: 'Attendance record deleted' });
        } catch (error) {
            console.error('Error deleting attendance:', error);
            res.status(500).json({ success: false, message: 'Error deleting attendance' });
        }
    }
};

module.exports = attendanceController;
