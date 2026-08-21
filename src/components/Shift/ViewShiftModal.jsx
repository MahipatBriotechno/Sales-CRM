import React from "react";
import { X, Clock, CheckCircle, XCircle, CalendarDays, Settings, Timer, Briefcase } from "lucide-react";

const InfoBlock = ({ label, value, children, className = "" }) => (
  <div className={`bg-gray-50/50 p-3 rounded-none border border-gray-200 ${className}`}>
    <p className="text-[10.5px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">{label}</p>
    {children ? children : <p className="text-sm font-semibold text-gray-900">{value || "N/A"}</p>}
  </div>
);

const SectionHeader = ({ num, title, icon: Icon }) => (
  <h3 className="flex items-center gap-2 text-sm font-bold text-[#FF7B1D] uppercase tracking-wide mb-4 pb-2 border-b border-gray-100">
    <span className="bg-orange-100 text-[#FF7B1D] w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-sm">
      {num}
    </span>
    {title}
    {Icon && <Icon size={16} className="ml-auto text-gray-400" />}
  </h3>
);

export default function ViewShiftModal({ shift, onClose }) {
  if (!shift) return null;

  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const selectedDays = shift.working_days ? shift.working_days.split(",") : [];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-none shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-none backdrop-blur-md">
              <Clock size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">Shift Details</h2>
              <p className="text-xs text-orange-100 font-medium">Viewing configuration for {shift.shift_name}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-white/20 transition-colors duration-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 bg-gray-50/30">
          
          {/* Section 1: Basic Information */}
          <div className="bg-white p-5 rounded-none border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <SectionHeader num="1" title="Basic Information" icon={Briefcase} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoBlock label="Shift Name" value={shift.shift_name} className="capitalize" />
              <InfoBlock label="Description" value={shift.description} />
            </div>
          </div>

          {/* Section 2: Working Hours & Attendance */}
          <div className="bg-white p-5 rounded-none border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <SectionHeader num="2" title="Working Hours & Attendance" icon={CalendarDays} />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <InfoBlock label="Check-In Time" value={shift.check_in_time} />
              <InfoBlock label="Check-Out Time" value={shift.check_out_time} />
              <InfoBlock label="Working Hours" value={shift.working_hours ? `${shift.working_hours} Hrs` : null} />
              <InfoBlock label="Grace Period" value={`${shift.grace_period} Mins`} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoBlock label="Attendance Method">
                <span className="inline-flex items-center px-2.5 py-1 rounded-none text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
                  {shift.attendance_method}
                </span>
              </InfoBlock>
              
              <InfoBlock label="Late Marking">
                <div className="flex items-center mt-0.5">
                  {shift.late_marking ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none text-xs font-bold bg-green-50 text-green-600 border border-green-100">
                      <CheckCircle size={14} /> Enabled
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200">
                      <XCircle size={14} /> Disabled
                    </span>
                  )}
                </div>
              </InfoBlock>
            </div>

            {/* Working Days Row */}
            <div className="mt-4 pt-4 border-t border-gray-50">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Working Days</p>
              
              {["Mon-Fri (5 Days)", "Mon-Sat (6 Days)", "Mon-Sat (Alt Sat Off)", "Rotational Weekly Off"].includes(shift.working_days) ? (
                  <span className="inline-flex items-center px-4 py-2 rounded-none text-sm font-bold bg-orange-50 text-orange-600 border border-orange-200 shadow-sm">
                      {shift.working_days}
                  </span>
              ) : (
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map(day => {
                      const isActive = selectedDays.includes(day);
                      return (
                        <div 
                          key={day} 
                          className={`w-14 py-1.5 flex justify-center items-center rounded-none text-xs font-bold border transition-all ${
                            isActive 
                              ? 'bg-orange-50 text-orange-600 border-orange-200 shadow-sm' 
                              : 'bg-gray-50 text-gray-400 border-gray-100 opacity-60'
                          }`}
                        >
                          {day}
                        </div>
                      );
                    })}
                  </div>
              )}
            </div>
          </div>

          {/* Section 3 & 4 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Half Day */}
            <div className="bg-white p-5 rounded-none border border-gray-200 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
              <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                <h3 className="flex items-center gap-2 text-sm font-bold text-[#FF7B1D] uppercase tracking-wide">
                  <span className="bg-orange-100 text-[#FF7B1D] w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-sm">3</span> 
                  Half Day Rules
                </h3>
                {shift.half_day_enable ? <CheckCircle size={18} className="text-green-500" /> : <XCircle size={18} className="text-gray-300" />}
              </div>
              
              {shift.half_day_enable ? (
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <InfoBlock label="Min. Working Hours" value={`${shift.min_work_hours_half_day} Hrs`} />
                  <InfoBlock label="Half Day Cut-off" value={shift.half_day_cutoff_time} />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-6 text-gray-400 bg-gray-50/50 rounded-none border border-dashed border-gray-200">
                  <Settings size={24} className="mb-2 opacity-50" />
                  <p className="text-xs font-medium">Half day rules disabled</p>
                </div>
              )}
            </div>

            {/* Overtime */}
            <div className="bg-white p-5 rounded-none border border-gray-200 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
              <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                <h3 className="flex items-center gap-2 text-sm font-bold text-[#FF7B1D] uppercase tracking-wide">
                  <span className="bg-orange-100 text-[#FF7B1D] w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-sm">4</span> 
                  Overtime Rules
                </h3>
                {shift.overtime_enable ? <CheckCircle size={18} className="text-green-500" /> : <XCircle size={18} className="text-gray-300" />}
              </div>
              
              {shift.overtime_enable ? (
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <InfoBlock label="Overtime Starts After" value={`${shift.min_overtime_after} Mins`} />
                  <InfoBlock label="Overtime Rate" value={`₹${shift.overtime_rate}`} />
                  <InfoBlock label="Calculation Base" value={shift.overtime_calculation} />
                  <InfoBlock label="Max Overtime (Daily)" value={shift.max_overtime_per_day ? `${shift.max_overtime_per_day} Mins` : 'No Limit'} />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-6 text-gray-400 bg-gray-50/50 rounded-none border border-dashed border-gray-200">
                  <Timer size={24} className="mb-2 opacity-50" />
                  <p className="text-xs font-medium">Overtime rules disabled</p>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex justify-end bg-white">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-none hover:bg-gray-200 transition-colors font-bold text-sm"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
