import React, { useState, useEffect, useRef } from "react";
import {
  Clock,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  X,
  CheckCircle,
  XCircle,
  MoreVertical,
  Sun,
  Timer
} from "lucide-react";
import { FiHome } from "react-icons/fi";
import NumberCard from "../../components/NumberCard";
import {
  useGetShiftsQuery,
  useDeleteShiftMutation
} from "../../store/api/shiftApi";
import { toast } from "react-hot-toast";
import usePermission from "../../hooks/usePermission";
import ActionGuard from "../../components/common/ActionGuard";
import AddShiftModal from "../../components/Shift/AddShiftModal";
import EditShiftModal from "../../components/Shift/EditShiftModal";
import ViewShiftModal from "../../components/Shift/ViewShiftModal";
import DeleteShiftModal from "../../components/Shift/DeleteShiftModal";
import DashboardLayout from "../../components/DashboardLayout";

const formatTime12Hr = (timeStr) => {
  if (!timeStr) return "";
  const [hourStr, minuteStr] = timeStr.split(":");
  if (!hourStr || !minuteStr) return timeStr;
  
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  hour = hour ? hour : 12;
  const paddedHour = hour.toString().padStart(2, "0");
  return `${paddedHour}:${minuteStr} ${ampm}`;
};

export default function ShiftManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);

  const { create, read, update, delete: canDelete, hasPermission } = usePermission("HRM");

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Filters
  const [attendanceMethodFilter, setAttendanceMethodFilter] = useState("All");
  const [halfDayFilter, setHalfDayFilter] = useState("All");
  const [overtimeFilter, setOvertimeFilter] = useState("All");

  const [tempAttendance, setTempAttendance] = useState("All");
  const [tempHalfDay, setTempHalfDay] = useState("All");
  const [tempOvertime, setTempOvertime] = useState("All");

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasActiveFilters = attendanceMethodFilter !== "All" || halfDayFilter !== "All" || overtimeFilter !== "All";

  const clearAllFilters = () => {
    setAttendanceMethodFilter("All");
    setHalfDayFilter("All");
    setOvertimeFilter("All");
    setIsFilterOpen(false);
  };

  const { data: shiftData, isLoading } = useGetShiftsQuery();
  const shifts = shiftData?.shifts || [];

  const filteredShifts = shifts.filter((shift) => {
    const matchesSearch = shift.shift_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesAttendance = true;
    if (attendanceMethodFilter !== "All") {
        matchesAttendance = shift.attendance_method === attendanceMethodFilter;
    }

    let matchesHalfDay = true;
    if (halfDayFilter !== "All") {
        const isEnabled = halfDayFilter === "Enabled";
        matchesHalfDay = Boolean(shift.half_day_enable) === isEnabled;
    }

    let matchesOvertime = true;
    if (overtimeFilter !== "All") {
        const isEnabled = overtimeFilter === "Enabled";
        matchesOvertime = Boolean(shift.overtime_enable) === isEnabled;
    }

    return matchesSearch && matchesAttendance && matchesHalfDay && matchesOvertime;
  });

  const totalPages = Math.ceil(filteredShifts.length / itemsPerPage);
  const currentShifts = filteredShifts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const activeShiftsCount = shifts.length; // Can add active/inactive logic later if needed
  const halfDayShiftsCount = shifts.filter(s => s.half_day_enable).length;
  const overtimeShiftsCount = shifts.filter(s => s.overtime_enable).length;

  const handleEdit = (shift) => {
    setSelectedShift(shift);
    setShowEditModal(true);
  };

  const handleView = (shift) => {
    setSelectedShift(shift);
    setShowViewModal(true);
  };

  const handleDelete = (shift) => {
    setSelectedShift(shift);
    setShowDeleteModal(true);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white">
        {/* Header Section */}
        <div className="bg-white sticky top-0 z-30">
          <div className="max-w-8xl mx-auto px-4 py-4 border-b">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="w-full sm:w-auto">
                <h1 className="text-2xl font-bold text-gray-800 transition-all duration-300">Shift Management</h1>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                  <FiHome className="text-gray-700" size={14} />
                  <span className="text-gray-400"></span> HRM /{" "}
                  <span className="text-[#FF7B1D] font-medium">All Shifts</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search shifts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#FF7B1D] focus:border-[#FF7B1D] transition-all text-sm"
                  />
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                </div>

                {/* Filter Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => {
                      if (hasActiveFilters) {
                        clearAllFilters();
                      } else {
                        setTempAttendance(attendanceMethodFilter);
                        setTempHalfDay(halfDayFilter);
                        setTempOvertime(overtimeFilter);
                        setIsFilterOpen(!isFilterOpen);
                      }
                    }}
                    className={`px-3 py-2 rounded-sm border transition shadow-sm h-full flex items-center justify-center ${isFilterOpen || hasActiveFilters
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-[#FF7B1D]"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                      }`}
                  >
                    {hasActiveFilters ? <X size={18} /> : <Filter size={18} />}
                  </button>

                  {isFilterOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-sm shadow-2xl z-50 animate-fadeIn overflow-hidden">
                      <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-800">Filter Options</span>
                        <button
                          onClick={() => {
                            setTempAttendance("All");
                            setTempHalfDay("All");
                            setTempOvertime("All");
                          }}
                          className="text-[10px] font-bold text-orange-600 hover:underline hover:text-orange-700 capitalize"
                        >
                          Reset all
                        </button>
                      </div>

                      <div className="p-5 space-y-4">
                        {/* Attendance Method */}
                        <div>
                          <span className="text-[11px] font-bold text-gray-400 capitalize tracking-wider block mb-2 border-b pb-1">Attendance Method</span>
                          <select
                            value={tempAttendance}
                            onChange={(e) => setTempAttendance(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-orange-500/20 outline-none transition-all text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-white"
                          >
                            <option value="All">All Methods</option>
                            <option value="WiFi Check-in">WiFi Check-in</option>
                            <option value="QR Code Check-in">QR Code Check-in</option>
                            <option value="GPS Location">GPS Location</option>
                            <option value="Anywhere Check-in">Anywhere Check-in</option>
                          </select>
                        </div>

                        {/* Half Day */}
                        <div>
                          <span className="text-[11px] font-bold text-gray-400 capitalize tracking-wider block mb-2 border-b pb-1">Half Day</span>
                          <div className="flex gap-4">
                            {["All", "Enabled", "Disabled"].map((opt) => (
                              <label key={opt} className="flex items-center group cursor-pointer">
                                <input
                                  type="radio"
                                  name="halfDayFilter"
                                  checked={tempHalfDay === opt}
                                  onChange={() => setTempHalfDay(opt)}
                                  className="peer h-4 w-4 cursor-pointer appearance-none rounded-full border-2 border-gray-200 transition-all checked:border-[#FF7B1D] checked:border-[5px] hover:border-orange-300"
                                />
                                <span className={`ml-2 text-xs font-medium capitalize ${tempHalfDay === opt ? "text-[#FF7B1D] font-bold" : "text-gray-600"}`}>{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Overtime */}
                        <div>
                          <span className="text-[11px] font-bold text-gray-400 capitalize tracking-wider block mb-2 border-b pb-1">Overtime</span>
                          <div className="flex gap-4">
                            {["All", "Enabled", "Disabled"].map((opt) => (
                              <label key={opt} className="flex items-center group cursor-pointer">
                                <input
                                  type="radio"
                                  name="overtimeFilter"
                                  checked={tempOvertime === opt}
                                  onChange={() => setTempOvertime(opt)}
                                  className="peer h-4 w-4 cursor-pointer appearance-none rounded-full border-2 border-gray-200 transition-all checked:border-[#FF7B1D] checked:border-[5px] hover:border-orange-300"
                                />
                                <span className={`ml-2 text-xs font-medium capitalize ${tempOvertime === opt ? "text-[#FF7B1D] font-bold" : "text-gray-600"}`}>{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 border-t flex gap-3">
                        <button
                          onClick={() => setIsFilterOpen(false)}
                          className="flex-1 py-2 text-[11px] font-bold text-gray-500 capitalize tracking-wider hover:bg-gray-200 transition-colors rounded-sm border border-gray-200 bg-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            setAttendanceMethodFilter(tempAttendance);
                            setHalfDayFilter(tempHalfDay);
                            setOvertimeFilter(tempOvertime);
                            setIsFilterOpen(false);
                            setCurrentPage(1);
                          }}
                          className="flex-1 py-2 text-[11px] font-bold text-white capitalize tracking-wider bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all rounded-sm shadow-md active:scale-95"
                        >
                          Apply filters
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <ActionGuard permission="HRM" action="create">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-6 py-2 rounded-sm font-semibold transition shadow-md hover:shadow-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 whitespace-nowrap text-sm"
                  >
                    <Plus size={18} />
                    Add Shift
                  </button>
                </ActionGuard>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-8xl mx-auto p-4 pt-0 mt-2">
          {/* Number Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <NumberCard
              title="Total Shifts"
              number={shifts.length}
              icon={<Clock size={24} className="text-blue-500" />}
              iconBgColor="bg-blue-100"
              lineBorderClass="border-blue-500"
            />
            <NumberCard
              title="Active Shifts"
              number={activeShiftsCount}
              icon={<CheckCircle size={24} className="text-green-500" />}
              iconBgColor="bg-green-100"
              lineBorderClass="border-green-500"
            />
            <NumberCard
              title="Half Day Shifts"
              number={halfDayShiftsCount}
              icon={<Sun size={24} className="text-orange-500" />}
              iconBgColor="bg-orange-100"
              lineBorderClass="border-orange-500"
            />
            <NumberCard
              title="Overtime Shifts"
              number={overtimeShiftsCount}
              icon={<Timer size={24} className="text-purple-500" />}
              iconBgColor="bg-purple-100"
              lineBorderClass="border-purple-500"
            />
          </div>

      {/* Table */}
      <div className="bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden mt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FF7B1D] text-white text-xs uppercase tracking-wider font-bold">
                <th className="py-3 px-4 w-16">S.N</th>
                <th className="py-3 px-4">Shift Name</th>
                <th className="py-3 px-4">Timings</th>
                <th className="py-3 px-4">Working Hours</th>
                <th className="py-3 px-4">Half Day</th>
                <th className="py-3 px-4">Overtime</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-gray-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-[#FF7B1D] border-t-transparent rounded-full animate-spin"></div>
                      Loading shifts...
                    </div>
                  </td>
                </tr>
              ) : currentShifts.length > 0 ? (
                currentShifts.map((shift, index) => (
                  <tr
                    key={shift.id}
                    className="border-b border-gray-100 hover:bg-orange-50/50 transition-colors group h-16"
                  >
                    <td className="py-3 px-4">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-800 capitalize">
                      {shift.shift_name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-orange-50 text-orange-600 border border-orange-200 px-2.5 py-1 rounded-sm text-[11px] font-bold shadow-sm whitespace-nowrap">
                        {formatTime12Hr(shift.check_in_time)} - {formatTime12Hr(shift.check_out_time)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {shift.working_hours ? `${shift.working_hours} Hrs` : '-'}
                    </td>
                    <td className="py-3 px-4">
                      {shift.half_day_enable ? (
                        <span className="text-green-600 flex items-center gap-1"><CheckCircle size={14}/> Yes</span>
                      ) : (
                        <span className="text-red-500 flex items-center gap-1"><XCircle size={14}/> No</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {shift.overtime_enable ? (
                        <span className="text-green-600 flex items-center gap-1"><CheckCircle size={14}/> Yes</span>
                      ) : (
                        <span className="text-red-500 flex items-center gap-1"><XCircle size={14}/> No</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <ActionGuard permission="HRM" action="read">
                          <button
                            onClick={() => handleView(shift)}
                            className="p-1 hover:bg-orange-100 rounded-sm transition-all text-blue-500 hover:text-blue-700"
                            title="View Shift"
                          >
                            <Eye size={18} />
                          </button>
                        </ActionGuard>
                        <ActionGuard permission="HRM" action="update">
                          <button
                            onClick={() => handleEdit(shift)}
                            className="p-1 hover:bg-orange-100 rounded-sm transition-all text-green-500 hover:text-green-700"
                            title="Edit Shift"
                          >
                            <Edit size={18} />
                          </button>
                        </ActionGuard>
                        <ActionGuard permission="HRM" action="delete">
                          <button
                            onClick={() => handleDelete(shift)}
                            className="p-1 hover:bg-orange-100 rounded-sm transition-all text-red-500 hover:text-red-700 font-bold shadow-sm"
                            title="Delete Shift"
                          >
                            <Trash2 size={18} />
                          </button>
                        </ActionGuard>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-500">
                    No shifts found. Create your first shift!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && filteredShifts.length > 0 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-600 font-medium">
              Showing <span className="text-[#FF7B1D]">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-[#FF7B1D]">{Math.min(currentPage * itemsPerPage, filteredShifts.length)}</span> of <span className="text-[#FF7B1D]">{filteredShifts.length}</span> Shifts
            </p>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-sm hover:bg-gray-200 disabled:opacity-50 transition-colors text-sm font-semibold"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="px-3 py-1.5 bg-[#FF7B1D] text-white rounded-sm hover:bg-[#e66a15] disabled:opacity-50 transition-colors text-sm font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

        {/* Modals */}
        {showAddModal && <AddShiftModal onClose={() => setShowAddModal(false)} />}
        {showEditModal && <EditShiftModal shift={selectedShift} onClose={() => setShowEditModal(false)} />}
        {showViewModal && <ViewShiftModal shift={selectedShift} onClose={() => setShowViewModal(false)} />}
        {showDeleteModal && <DeleteShiftModal shift={selectedShift} onClose={() => setShowDeleteModal(false)} />}
        </div>
      </div>
    </DashboardLayout>
  );
}
