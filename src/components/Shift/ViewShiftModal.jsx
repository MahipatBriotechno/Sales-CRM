import React from "react";
import { X, Clock, CheckCircle, XCircle } from "lucide-react";

export default function ViewShiftModal({ shift, onClose }) {
  if (!shift) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-sm shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-[#FF7B1D] text-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Clock size={20} />
            Shift Details
          </h2>
          <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          
          {/* Section 1 */}
          <div className="bg-white p-5 rounded-sm border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-[#FF7B1D] font-bold text-sm uppercase tracking-wide mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
                <span className="bg-orange-100 text-[#FF7B1D] w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span> 
                Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Shift Name</p>
                <p className="text-gray-800 font-medium capitalize mt-1">{shift.shift_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Description</p>
                <p className="text-gray-800 mt-1">{shift.description || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="bg-white p-5 rounded-sm border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-[#FF7B1D] font-bold text-sm uppercase tracking-wide mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
                <span className="bg-orange-100 text-[#FF7B1D] w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span> 
                Working Hours & Attendance
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-2">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Check-In</p>
                <p className="text-gray-800 font-medium mt-1">{shift.check_in_time}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Check-Out</p>
                <p className="text-gray-800 font-medium mt-1">{shift.check_out_time}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Working Hours</p>
                <p className="text-gray-800 font-medium mt-1">{shift.working_hours ? `${shift.working_hours} Hrs` : "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Attendance Method</p>
                <p className="text-gray-800 mt-1">{shift.attendance_method}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Grace Period</p>
                <p className="text-gray-800 mt-1">{shift.grace_period} Mins</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Late Marking</p>
                <p className="mt-1 flex items-center">
                    {shift.late_marking ? <CheckCircle size={16} className="text-green-500 mr-1"/> : <XCircle size={16} className="text-red-500 mr-1"/>}
                    <span className="text-gray-800">{shift.late_marking ? 'Enabled' : 'Disabled'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Section 3 & 4 Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            <div className="bg-white p-5 rounded-sm border border-gray-200 shadow-sm hover:shadow-md transition-shadow h-full">
              <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                <h3 className="text-[#FF7B1D] font-bold text-sm uppercase tracking-wide flex items-center gap-2">
                    <span className="bg-orange-100 text-[#FF7B1D] w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span> 
                    Half Day
                </h3>
                {shift.half_day_enable ? <CheckCircle size={16} className="text-green-500"/> : <XCircle size={16} className="text-red-500"/>}
              </div>
              <div className="space-y-3">
                {shift.half_day_enable ? (
                    <>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Min. Work Hours</p>
                        <p className="text-gray-800 mt-1">{shift.min_work_hours_half_day} Hrs</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Cut-off Time</p>
                        <p className="text-gray-800 mt-1">{shift.half_day_cutoff_time || 'N/A'}</p>
                    </div>
                    </>
                ) : (
                    <p className="text-gray-500 text-sm italic py-4">Half day rules are not enabled for this shift.</p>
                )}
              </div>
            </div>

            <div className="bg-white p-5 rounded-sm border border-gray-200 shadow-sm hover:shadow-md transition-shadow h-full">
              <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                <h3 className="text-[#FF7B1D] font-bold text-sm uppercase tracking-wide flex items-center gap-2">
                    <span className="bg-orange-100 text-[#FF7B1D] w-6 h-6 rounded-full flex items-center justify-center text-xs">4</span> 
                    Overtime
                </h3>
                {shift.overtime_enable ? <CheckCircle size={16} className="text-green-500"/> : <XCircle size={16} className="text-red-500"/>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {shift.overtime_enable ? (
                    <>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Min. After</p>
                        <p className="text-gray-800 mt-1">{shift.min_overtime_after} Mins</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Rate</p>
                        <p className="text-gray-800 mt-1">₹{shift.overtime_rate}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Base</p>
                        <p className="text-gray-800 mt-1">{shift.overtime_calculation}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Max Daily</p>
                        <p className="text-gray-800 mt-1">{shift.max_overtime_per_day ? `${shift.max_overtime_per_day} Mins` : 'No Limit'}</p>
                    </div>
                    </>
                ) : (
                    <p className="text-gray-500 text-sm italic py-4 col-span-2">Overtime is not enabled for this shift.</p>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50 mt-auto">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-none hover:bg-gray-700 transition-colors font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
