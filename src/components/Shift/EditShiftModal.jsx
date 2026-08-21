import React, { useState, useEffect } from "react";
import { X, Edit } from "lucide-react";
import { useUpdateShiftMutation } from "../../store/api/shiftApi";
import { toast } from "react-hot-toast";

export default function EditShiftModal({ shift, onClose }) {
  const [updateShift, { isLoading }] = useUpdateShiftMutation();
  const [formData, setFormData] = useState({ ...shift });
  const [errors, setErrors] = useState({});

  const WORKING_DAYS_OPTIONS = [
    "Choose Days",
    "Mon-Fri (5 Days)",
    "Mon-Sat (6 Days)",
    "Mon-Sat (Alt Sat Off)",
    "Rotational Weekly Off"
  ];

  const [workingDaysType, setWorkingDaysType] = useState(() => {
    if (shift?.working_days && WORKING_DAYS_OPTIONS.includes(shift.working_days)) {
        return shift.working_days;
    }
    return "Choose Days";
  });

  const handleWorkingDaysTypeChange = (e) => {
    const val = e.target.value;
    setWorkingDaysType(val);
    if (val !== "Choose Days") {
      setFormData(prev => ({ ...prev, working_days: val }));
    } else {
      setFormData(prev => ({ ...prev, working_days: "" }));
    }
  };

  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const handleDayToggle = (day) => {
    setFormData((prev) => {
      const currentDays = prev.working_days ? prev.working_days.split(",") : [];
      let newDays;
      if (currentDays.includes(day)) {
        newDays = currentDays.filter((d) => d !== day);
      } else {
        const allSelected = [...currentDays, day];
        newDays = DAYS.filter(d => allSelected.includes(d));
      }
      return { ...prev, working_days: newDays.join(",") };
    });
  };

  useEffect(() => {
    if (formData.check_in_time && formData.check_out_time) {
      const start = new Date(`1970-01-01T${formData.check_in_time}`);
      const end = new Date(`1970-01-01T${formData.check_out_time}`);
      let diff = (end - start) / (1000 * 60 * 60);
      if (diff < 0) diff += 24;
      setFormData(prev => ({ ...prev, working_hours: diff.toFixed(2) }));
    }
  }, [formData.check_in_time, formData.check_out_time]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.shift_name) newErrors.shift_name = "Shift name is required";
    if (!formData.check_in_time) newErrors.check_in_time = "Check-in time is required";
    if (!formData.check_out_time) newErrors.check_out_time = "Check-out time is required";
    if (!formData.working_days) newErrors.working_days = "At least one working day must be selected";
    if (formData.half_day_enable && !formData.min_work_hours_half_day) {
        newErrors.min_work_hours_half_day = "Required for half day rule";
    }
    if (formData.overtime_enable) {
        if (!formData.min_overtime_after) newErrors.min_overtime_after = "Required";
        if (!formData.overtime_rate) newErrors.overtime_rate = "Required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await updateShift({ id: shift.id, ...formData }).unwrap();
      toast.success("Shift updated successfully");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.data?.message || "Failed to update shift");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-sm shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-[#FF7B1D] text-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Edit size={20} />
            Edit Shift
          </h2>
          <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form id="edit-shift-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. Basic Details */}
            <div className="bg-white p-5 rounded-sm border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-[#FF7B1D] font-bold text-sm uppercase tracking-wide mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
                  <span className="bg-orange-100 text-[#FF7B1D] w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span> 
                  Basic Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Shift Name <span className="text-red-500">*</span></label>
                        <select
                            name="shift_name"
                            value={formData.shift_name || ''}
                            onChange={handleChange}
                            className={`w-full p-2 border rounded-sm focus:outline-none focus:ring-1 focus:ring-[#FF7B1D] ${errors.shift_name ? 'border-red-500' : 'border-gray-300'}`}
                        >
                            <option value="" disabled>Select Shift</option>
                            <option value="General Shift">General Shift</option>
                            <option value="Morning Shift">Morning Shift</option>
                            <option value="Evening Shift">Evening Shift</option>
                            <option value="Night Shift">Night Shift</option>
                        </select>
                        {errors.shift_name && <p className="text-red-500 text-xs mt-1">{errors.shift_name}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <input
                            type="text"
                            name="description"
                            value={formData.description || ''}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#FF7B1D]"
                        />
                    </div>
                </div>
                <div className="mt-5 border-t border-gray-100 pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Working Days <span className="text-red-500">*</span></label>
                    <select
                        value={workingDaysType}
                        onChange={handleWorkingDaysTypeChange}
                        className="w-full p-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#FF7B1D] focus:border-[#FF7B1D] mb-4"
                    >
                        {WORKING_DAYS_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>

                    {workingDaysType === "Choose Days" && (
                        <div className="flex flex-wrap gap-3">
                            {DAYS.map((day) => {
                                const isSelected = formData.working_days?.includes(day);
                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => handleDayToggle(day)}
                                        className={`w-16 py-2 text-xs font-bold rounded-sm border transition-all duration-200 ${
                                            isSelected 
                                                ? 'bg-orange-50/50 text-[#FF7B1D] border-[#FF7B1D] shadow-sm' 
                                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        {day}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    {errors.working_days && <p className="text-red-500 text-xs mt-2">{errors.working_days}</p>}
                </div>
            </div>

            {/* 2. Working Time */}
            <div className="bg-white p-5 rounded-sm border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-[#FF7B1D] font-bold text-sm uppercase tracking-wide mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
                  <span className="bg-orange-100 text-[#FF7B1D] w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span> 
                  Working Time
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Check-In Time <span className="text-red-500">*</span></label>
                        <input
                            type="time"
                            name="check_in_time"
                            value={formData.check_in_time || ''}
                            onChange={handleChange}
                            className={`w-full p-2 border rounded-sm focus:outline-none focus:ring-1 focus:ring-[#FF7B1D] ${errors.check_in_time ? 'border-red-500' : 'border-gray-300'}`}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Check-Out Time <span className="text-red-500">*</span></label>
                        <input
                            type="time"
                            name="check_out_time"
                            value={formData.check_out_time || ''}
                            onChange={handleChange}
                            className={`w-full p-2 border rounded-sm focus:outline-none focus:ring-1 focus:ring-[#FF7B1D] ${errors.check_out_time ? 'border-red-500' : 'border-gray-300'}`}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Working Hours (Auto)</label>
                        <input
                            type="text"
                            name="working_hours"
                            value={formData.working_hours || ''}
                            readOnly
                            className="w-full p-2 border border-gray-200 bg-gray-100 rounded-sm"
                        />
                    </div>
                </div>
            </div>

            {/* 3. Attendance Rules */}
            <div className="bg-white p-5 rounded-sm border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-[#FF7B1D] font-bold text-sm uppercase tracking-wide mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
                  <span className="bg-orange-100 text-[#FF7B1D] w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span> 
                  Attendance Rules
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Attendance Method <span className="text-red-500">*</span></label>
                        <select
                            name="attendance_method"
                            value={formData.attendance_method || 'WiFi Check-in'}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#FF7B1D]"
                        >
                            <option value="WiFi Check-in">WiFi Check-in</option>
                            <option value="QR Code Check-in">QR Code Check-in</option>
                            <option value="GPS Location">GPS Location</option>
                            <option value="Anywhere Check-in">Anywhere Check-in</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Grace Period (Minutes)</label>
                        <input
                            type="number"
                            name="grace_period"
                            value={formData.grace_period || 0}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#FF7B1D]"
                        />
                    </div>
                    <div className="flex items-center mt-6">
                        <input
                            type="checkbox"
                            id="late_marking_edit"
                            name="late_marking"
                            checked={formData.late_marking}
                            onChange={handleChange}
                            className="w-4 h-4 text-[#FF7B1D] border-gray-300 rounded focus:ring-[#FF7B1D]"
                        />
                        <label htmlFor="late_marking_edit" className="ml-2 block text-sm text-gray-700">
                            Enable Late Marking (After Grace Period)
                        </label>
                    </div>
                </div>
            </div>

            {/* 4. Half Day Rules */}
            <div className="bg-white p-5 rounded-sm border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                    <h3 className="text-[#FF7B1D] font-bold text-sm uppercase tracking-wide flex items-center gap-2">
                      <span className="bg-orange-100 text-[#FF7B1D] w-6 h-6 rounded-full flex items-center justify-center text-xs">4</span> 
                      Half Day Rules
                    </h3>
                    <div className="flex items-center ml-auto">
                        <input
                            type="checkbox"
                            id="half_day_enable_edit"
                            name="half_day_enable"
                            checked={formData.half_day_enable}
                            onChange={handleChange}
                            className="w-4 h-4 text-[#FF7B1D] border-gray-300 rounded focus:ring-[#FF7B1D]"
                        />
                        <label htmlFor="half_day_enable_edit" className="ml-2 block text-sm font-bold text-gray-700">
                            Enable Half Day
                        </label>
                    </div>
                </div>
                
                {formData.half_day_enable && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Work Hours <span className="text-red-500">*</span></label>
                            <input
                                type="number"
                                step="0.5"
                                name="min_work_hours_half_day"
                                value={formData.min_work_hours_half_day || ''}
                                onChange={handleChange}
                                className={`w-full p-2 border rounded-sm focus:outline-none focus:ring-1 focus:ring-[#FF7B1D] ${errors.min_work_hours_half_day ? 'border-red-500' : 'border-gray-300'}`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Half Day Cut-off Time</label>
                            <input
                                type="time"
                                name="half_day_cutoff_time"
                                value={formData.half_day_cutoff_time || ''}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#FF7B1D]"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* 5. Overtime Rules */}
            <div className="bg-white p-5 rounded-sm border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                    <h3 className="text-[#FF7B1D] font-bold text-sm uppercase tracking-wide flex items-center gap-2">
                      <span className="bg-orange-100 text-[#FF7B1D] w-6 h-6 rounded-full flex items-center justify-center text-xs">5</span> 
                      Overtime Rules
                    </h3>
                    <div className="flex items-center ml-auto">
                        <input
                            type="checkbox"
                            id="overtime_enable_edit"
                            name="overtime_enable"
                            checked={formData.overtime_enable}
                            onChange={handleChange}
                            className="w-4 h-4 text-[#FF7B1D] border-gray-300 rounded focus:ring-[#FF7B1D]"
                        />
                        <label htmlFor="overtime_enable_edit" className="ml-2 block text-sm font-bold text-gray-700">
                            Enable Overtime
                        </label>
                    </div>
                </div>

                {formData.overtime_enable && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Overtime After (Mins) <span className="text-red-500">*</span></label>
                            <input
                                type="number"
                                name="min_overtime_after"
                                value={formData.min_overtime_after || ''}
                                onChange={handleChange}
                                className={`w-full p-2 border rounded-sm focus:outline-none focus:ring-1 focus:ring-[#FF7B1D] ${errors.min_overtime_after ? 'border-red-500' : 'border-gray-300'}`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Overtime Rate <span className="text-red-500">*</span></label>
                            <div className="flex items-center border border-gray-300 rounded-sm overflow-hidden focus-within:ring-1 focus-within:ring-[#FF7B1D]">
                                <span className="px-3 bg-gray-100 text-gray-500 border-r border-gray-300 font-semibold">₹</span>
                                <input
                                    type="number"
                                    name="overtime_rate"
                                    value={formData.overtime_rate || ''}
                                    onChange={handleChange}
                                    className="w-full p-2 focus:outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Calculation Base</label>
                            <select
                                name="overtime_calculation"
                                value={formData.overtime_calculation || 'Per Hour'}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#FF7B1D]"
                            >
                                <option value="Per Hour">Per Hour</option>
                                <option value="Per Minute">Per Minute</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Overtime (Mins)</label>
                            <input
                                type="number"
                                name="max_overtime_per_day"
                                value={formData.max_overtime_per_day || ''}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#FF7B1D]"
                            />
                        </div>
                    </div>
                )}
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 mt-auto">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-none hover:bg-gray-100 transition-colors font-semibold"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-shift-form"
            disabled={isLoading}
            className="px-6 py-2 bg-[#FF7B1D] text-white rounded-none hover:bg-[#e66a15] transition-colors font-semibold shadow-sm flex items-center justify-center min-w-[100px]"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "Update"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
