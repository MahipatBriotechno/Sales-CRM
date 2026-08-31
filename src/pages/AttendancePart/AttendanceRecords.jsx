import React, { useState, useRef } from "react";
import { FiHome } from "react-icons/fi";
import EmptyState from "../../components/common/EmptyState";
import DashboardLayout from "../../components/DashboardLayout";
import {
  Clock,
  Search,
  CheckCircle,
  AlertCircle,
  Calendar,
  Timer,
  Users,
  Edit,
  Trash2,
  Download,
  Filter,
  X,
  Camera,
  UserCheck,
  Eye,
  Wifi
} from "lucide-react";
import {
  useGetAllAttendanceQuery,
  useDeleteAttendanceMutation,
} from "../../store/api/attendanceApi";
import { useGetDepartmentsQuery } from "../../store/api/departmentApi";
import { toast } from "react-hot-toast";
import NumberCard from "../../components/NumberCard";
import ActionGuard from "../../components/common/ActionGuard";

export default function AttendanceRecords() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [dateRange, setDateRange] = useState({ state: "All", start: "", end: "" });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tempStatus, setTempStatus] = useState("all");
  const [tempDepartment, setTempDepartment] = useState("all");
  const [tempDateRange, setTempDateRange] = useState({ state: "All", start: "", end: "" });
  
  const hasActiveFilters = filterStatus !== "all" || filterDepartment !== "all" || dateRange.state !== "All";
  const [selectedEmployeeForDetail, setSelectedEmployeeForDetail] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const dropdownRef = useRef(null);

  const { data: attendanceResponse, isLoading } = useGetAllAttendanceQuery({
    status: filterStatus !== "all" ? filterStatus : undefined,
    department_id: filterDepartment !== "all" ? filterDepartment : undefined,
    dateFrom: dateRange.start || undefined,
    dateTo: dateRange.end || undefined,
  });
  const [deleteAttendance] = useDeleteAttendanceMutation();
  const { data: departmentsResponse } = useGetDepartmentsQuery({ limit: 100 });

  const attendanceData = attendanceResponse?.data || [];
  const departments = departmentsResponse?.departments || [];

  const filteredAttendance = attendanceData.filter(
    (r) =>
      r.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.emp_uid?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteRecord = async (id) => {
    if (window.confirm("Are you sure you want to delete this attendance record?")) {
      try {
        await deleteAttendance(id).unwrap();
        toast.success("Record deleted successfully!");
      } catch (error) {
        toast.error(error.data?.message || "Failed to delete record");
      }
    }
  };

  const handleExport = () => {
    const csvContent = [
      ["Employee", "UID", "Date", "Check In", "Check Out", "Hours", "Status", "Method"].join(","),
      ...attendanceData.map((r) =>
        [r.employee_name, r.emp_uid, r.date, r.check_in, r.check_out || "-", r.work_hours || "-", r.status, r.check_in_method].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_records_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Records exported successfully!");
  };

  const format12Hour = (timeStr) => {
    if (!timeStr || timeStr === "-") return "-";
    const parts = timeStr.split(":");
    if (parts.length < 2) return timeStr;
    let h = parseInt(parts[0], 10);
    const m = parts[1];
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  };

  const calculateTotalTime = (checkIn, checkOut, workHours) => {
    let totalMinutes = 0;
    
    if (checkIn && checkOut && checkIn !== "-" && checkOut !== "-") {
      const parseTime = (t) => {
        const parts = t.split(":");
        return parseInt(parts[0] || 0) * 60 + parseInt(parts[1] || 0);
      };
      const inMins = parseTime(checkIn);
      const outMins = parseTime(checkOut);
      totalMinutes = outMins - inMins;
      if (totalMinutes < 0) totalMinutes += 24 * 60; // handle overnight
    } else if (workHours && !workHours.includes('NaN') && workHours !== "-") {
      if (workHours.includes(':')) {
         const parts = workHours.split(':');
         totalMinutes = parseInt(parts[0] || 0) * 60 + parseInt(parts[1] || 0);
      } else {
         totalMinutes = parseFloat(workHours) * 60;
      }
    } else {
      return "-";
    }

    const hrs = Math.floor(totalMinutes / 60);
    const mins = Math.floor(totalMinutes % 60);
    
    if (hrs === 0 && mins === 0) return "-";
    if (hrs === 0) return `${mins} mins`;
    if (mins === 0) return `${hrs} hrs`;
    return `${hrs} hrs ${mins} mins`;
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white text-black">
        {/* Header Section */}
        <div className="bg-white sticky top-0 z-30">
          <div className="max-w-8xl mx-auto px-4 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 transition-all duration-300">
                  Attendance Records
                </h1>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                  <FiHome className="text-gray-700" size={14} />
                  <span className="text-gray-400"></span> HRM /{" "}
                  <span className="text-[#FF7B1D] font-medium">Records</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search employee name or UID..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Filter */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => {
                      if (hasActiveFilters) {
                        setFilterStatus("all");
                        setFilterDepartment("all");
                        setDateRange({ state: "All", start: "", end: "" });
                      } else {
                        setTempStatus(filterStatus);
                        setTempDepartment(filterDepartment);
                        setTempDateRange(dateRange);
                        setIsFilterOpen(!isFilterOpen);
                      }
                    }}
                    className={`px-3 py-3 rounded-sm border transition shadow-sm ${
                      hasActiveFilters || isFilterOpen
                        ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-[#FF7B1D]"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    {hasActiveFilters ? (
                      <X size={18} />
                    ) : (
                      <Filter size={18} />
                    )}
                  </button>

                  {isFilterOpen && (
                    <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-sm shadow-2xl z-50 animate-fadeIn overflow-hidden">
                      <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-800">Filter Options</span>
                        <button
                          onClick={() => {
                            setTempStatus("all");
                            setTempDepartment("all");
                            setTempDateRange({ state: "All", start: "", end: "" });
                          }}
                          className="text-[10px] font-bold text-orange-600 hover:underline hover:text-orange-700 capitalize"
                        >
                          Reset all
                        </button>
                      </div>

                      <div className="p-5 grid grid-cols-2 gap-6">
                        {/* Status Filter */}
                        <div className="space-y-4">
                          <span className="text-[11px] font-bold text-gray-400 capitalize tracking-wider block mb-2 border-b pb-1">Status</span>
                          <div className="space-y-2">
                            {["all", "present", "absent", "late", "half-day"].map((status) => (
                              <label key={status} className="flex items-center group cursor-pointer">
                                <div className="relative flex items-center">
                                  <input
                                    type="radio"
                                    name="att_status_filter"
                                    checked={tempStatus === status}
                                    onChange={() => setTempStatus(status)}
                                    className="peer h-4 w-4 cursor-pointer appearance-none rounded-full border-2 border-gray-200 transition-all checked:border-[#FF7B1D] checked:border-[5px] hover:border-orange-300"
                                  />
                                </div>
                                <span className={`ml-3 text-sm font-medium transition-colors capitalize ${tempStatus === status ? "text-[#FF7B1D] font-bold" : "text-gray-600 group-hover:text-gray-900"}`}>
                                  {status}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <span className="text-[11px] font-bold text-gray-400 capitalize tracking-wider block mb-2 border-b pb-1">Department</span>
                          <div className="space-y-3">
                            <select
                              value={tempDepartment}
                              onChange={(e) => setTempDepartment(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-orange-500/20 outline-none transition-all text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-white"
                            >
                              <option value="all">All Departments</option>
                              {departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>{dept.department_name}</option>
                              ))}
                            </select>
                          </div>

                          <span className="text-[11px] font-bold text-gray-400 capitalize tracking-wider block mb-2 border-b pb-1">Date Period</span>
                          <div className="space-y-3">
                            <select
                              value={tempDateRange.state}
                              onChange={(e) => {
                                const option = e.target.value;
                                const today = new Date().toISOString().split("T")[0];
                                if (option === "All") setTempDateRange({ state: "All", start: "", end: "" });
                                else if (option === "Today") setTempDateRange({ state: "Today", start: today, end: today });
                                else if (option === "Yesterday") {
                                  const y = new Date(); y.setDate(y.getDate() - 1);
                                  setTempDateRange({ state: "Yesterday", start: y.toISOString().split("T")[0], end: y.toISOString().split("T")[0] });
                                } else if (option === "Last 7 Days") {
                                  const l = new Date(); l.setDate(l.getDate() - 7);
                                  setTempDateRange({ state: "Last 7 Days", start: l.toISOString().split("T")[0], end: today });
                                } else if (option === "Custom") {
                                  setTempDateRange({ ...tempDateRange, state: "Custom" });
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-orange-500/20 outline-none transition-all text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-white"
                            >
                              {["All", "Today", "Yesterday", "Last 7 Days", "Custom"].map((range) => (
                                <option key={range} value={range}>{range}</option>
                              ))}
                            </select>

                            {tempDateRange.state === "Custom" && (
                              <div className="space-y-2 animate-fadeIn">
                                <input
                                  type="date"
                                  value={tempDateRange.start}
                                  onChange={(e) => setTempDateRange({ ...tempDateRange, start: e.target.value })}
                                  className="w-full px-2 py-1.5 border border-gray-200 rounded-sm text-[10px] outline-none focus:border-orange-500"
                                />
                                <input
                                  type="date"
                                  value={tempDateRange.end}
                                  onChange={(e) => setTempDateRange({ ...tempDateRange, end: e.target.value })}
                                  className="w-full px-2 py-1.5 border border-gray-200 rounded-sm text-[10px] outline-none focus:border-orange-500"
                                />
                              </div>
                            )}
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
                            setFilterStatus(tempStatus);
                            setFilterDepartment(tempDepartment);
                            setDateRange(tempDateRange);
                            setIsFilterOpen(false);
                          }}
                          className="flex-1 py-2 text-[11px] font-bold text-white capitalize tracking-wider bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all rounded-sm shadow-md"
                        >
                          Apply filters
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Export */}
                <ActionGuard permission="attendance_reports" module="Attendance Management" type="read">
                  <button
                    onClick={handleExport}
                    className="px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-sm hover:from-orange-600 hover:to-orange-700 transition shadow-sm flex items-center gap-2 font-semibold text-sm"
                  >
                    <Download size={16} />
                    Export
                  </button>
                </ActionGuard>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4">
          {/* Records Table */}
          <div className="pr-4 pb-12">
            <div className="bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm">
                      <th className="px-6 py-3 font-semibold border-b border-orange-400 text-left">Employee</th>
                      <th className="px-6 py-3 font-semibold border-b border-orange-400 text-center">Date</th>
                      <th className="px-6 py-3 font-semibold border-b border-orange-400 text-center">Check In</th>
                      <th className="px-6 py-3 font-semibold border-b border-orange-400 text-center">Method</th>
                      <th className="px-6 py-3 font-semibold border-b border-orange-400 text-center">Check Out</th>
                      <th className="px-6 py-3 font-semibold border-b border-orange-400 text-center whitespace-nowrap">Total Time</th>
                      <th className="px-6 py-3 font-semibold border-b border-orange-400 text-center">Status</th>
                      <th className="px-6 py-3 font-semibold border-b border-orange-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {isLoading ? (
                      <tr><td colSpan="8" className="px-6 py-12 text-center text-gray-400">Loading records...</td></tr>
                    ) : filteredAttendance.length > 0 ? (
                      filteredAttendance.map((record) => (
                        <tr key={record.id} className="border-t hover:bg-gray-50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {record.selfie ? (
                                <img
                                  src={record.selfie}
                                  alt=""
                                  onClick={() => setSelectedImage({ url: record.selfie, time: record.check_in, ip: record.ip_address })}
                                  className="w-10 h-10 rounded-xl object-cover border-2 border-orange-200 cursor-pointer hover:opacity-80 transition-opacity"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 border border-slate-200 uppercase">
                                  {record.employee_name?.charAt(0)}
                                </div>
                              )}
                              <div onClick={() => setSelectedEmployeeForDetail(record)} className="cursor-pointer">
                                <p className="font-bold text-gray-900 hover:text-orange-600 transition-colors">{record.employee_name}</p>
                                <p className="text-[11px] text-gray-500 font-medium uppercase tracking-tighter">{record.emp_uid}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center text-sm">{record.date ? new Date(record.date).toLocaleDateString() : "-"}</td>
                          <td className="px-6 py-4 text-center text-sm font-bold text-gray-700">
                            {format12Hour(record.check_in) || "-"}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="px-2 py-1 rounded bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold uppercase tracking-wider">
                              {record.check_in_method || "-"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center text-sm font-medium text-gray-700">{format12Hour(record.check_out) || "-"}</td>
                          <td className="px-6 py-4 text-center text-sm font-bold whitespace-nowrap">
                            {calculateTotalTime(record.check_in, record.check_out, record.work_hours)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-1 rounded-[2px] text-[10px] font-bold border uppercase tracking-wider ${
                              record.status === "present" ? "bg-green-100 text-green-600 border-green-200" :
                              record.status === "absent" ? "bg-red-100 text-red-600 border-red-200" :
                              "bg-orange-100 text-orange-600 border-orange-200"
                            }`}>
                              {record.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <ActionGuard permission="attendance_view" module="Attendance Management" type="read">
                                <button onClick={() => record.selfie && setSelectedImage({ url: record.selfie, time: record.check_in, date: record.date, method: record.check_in_method, ip: record.ip_address, name: record.employee_name })} className={`p-2 rounded-sm transition-all border shadow-sm ${record.selfie ? 'bg-orange-50 hover:bg-orange-500 text-orange-600 hover:text-white border-orange-100' : 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed'}`} title="View Snapshot" disabled={!record.selfie}>
                                  <Eye className="w-4 h-4" />
                                </button>
                              </ActionGuard>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="py-20 text-center">
                          <EmptyState title="No Records Found" description="Attendance logs will appear here once they are generated." />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Selfie Lightbox */}
        {/* Selfie Lightbox */}
        {selectedImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-primary" onClick={() => setSelectedImage(null)}>
            <div className="bg-white rounded-sm shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col relative" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex items-center justify-between z-50 rounded-t-sm shadow-md shrink-0">
                  <div className="flex items-center gap-4">
                      <div className="bg-white bg-opacity-20 p-2.5 rounded-sm">
                          <Camera size={24} className="text-white" />
                      </div>
                      <div>
                          <h2 className="text-xl font-bold text-white capitalize tracking-wide leading-tight">
                              Check-in Snapshot
                          </h2>
                          <p className="text-xs text-orange-50 font-medium opacity-90">
                              View employee check-in details
                          </p>
                      </div>
                  </div>
                  <button onClick={() => setSelectedImage(null)} className="text-white hover:bg-white hover:bg-opacity-20 p-2 transition-all rounded-full">
                      <X size={24} />
                  </button>
              </div>

              <div className="overflow-y-auto custom-scrollbar flex-1">
                <img src={selectedImage.url} alt="Check-in" className="w-full h-auto object-cover" style={{ maxHeight: "60vh" }} />
                <div className="p-6 bg-gradient-to-b from-white to-gray-50 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-sm border border-gray-200">
                      <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Employee</p>
                      <p className="text-sm font-bold text-gray-900">{selectedImage.name || "N/A"}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-sm border border-gray-200">
                      <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Date</p>
                      <p className="text-sm font-bold text-gray-900">
                        {selectedImage.date && !isNaN(new Date(selectedImage.date).getTime()) 
                          ? new Date(selectedImage.date).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' }) 
                          : selectedImage.date || "N/A"}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-sm border border-gray-200">
                      <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Time</p>
                      <p className="text-sm font-bold text-gray-900">{format12Hour(selectedImage.time) || "N/A"}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-sm border border-gray-200">
                      <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Method</p>
                      <p className="text-sm font-bold text-blue-600 uppercase tracking-wider">{selectedImage.method || "N/A"}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-sm border border-gray-200 col-span-2 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">IP Address</p>
                        <p className="text-sm font-bold text-gray-900 font-mono">{selectedImage.ip || "N/A"}</p>
                      </div>
                      <div className="w-8 h-8 rounded-sm bg-orange-100 flex items-center justify-center text-orange-600">
                        <Wifi className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Employee Detail Slider */}
        {selectedEmployeeForDetail && (
          <div className="fixed inset-0 z-40 flex items-center justify-end bg-black/40 backdrop-blur-sm" onClick={() => setSelectedEmployeeForDetail(null)}>
            <div className="bg-white h-full w-full max-w-md shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  {selectedEmployeeForDetail.selfie ? (
                    <img src={selectedEmployeeForDetail.selfie} alt="" className="w-10 h-10 rounded-xl object-cover border border-orange-200" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                      {selectedEmployeeForDetail.employee_name?.charAt(0)}
                    </div>
                  )}
                  <div>
                    {selectedEmployeeForDetail.employee_name}
                    <p className="text-xs text-gray-500 font-medium">{selectedEmployeeForDetail.emp_uid}</p>
                  </div>
                </h2>
                <button onClick={() => setSelectedEmployeeForDetail(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                    <p className="text-xs font-bold text-green-600 uppercase mb-1">Status Today</p>
                    <p className="text-2xl font-black text-green-700 capitalize">{selectedEmployeeForDetail.status || "Present"}</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                    <p className="text-xs font-bold text-orange-600 uppercase mb-1">Total Hours</p>
                    <p className="text-2xl font-black text-orange-700">{selectedEmployeeForDetail.work_hours || "0h 0m"}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-4">Today's Timeline</h3>
                  <div className="relative border-l-2 border-gray-200 ml-3 space-y-6">
                    <div className="relative pl-6">
                      <div className="absolute w-3 h-3 bg-green-500 rounded-full -left-[7px] top-1.5 ring-4 ring-white"></div>
                      <p className="text-sm font-bold text-gray-800">Checked In</p>
                      <p className="text-xs text-gray-500">
                        {selectedEmployeeForDetail.check_in || "N/A"}
                        {selectedEmployeeForDetail.check_in_method && ` • via ${selectedEmployeeForDetail.check_in_method.toUpperCase()}`}
                      </p>
                    </div>
                    {selectedEmployeeForDetail.check_out && (
                      <div className="relative pl-6">
                        <div className="absolute w-3 h-3 bg-red-500 rounded-full -left-[7px] top-1.5 ring-4 ring-white"></div>
                        <p className="text-sm font-bold text-gray-800">Checked Out</p>
                        <p className="text-xs text-gray-500">{selectedEmployeeForDetail.check_out}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-3 text-sm">Additional Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Department</span>
                      <span className="font-medium text-gray-900">{selectedEmployeeForDetail.department_name || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Network IP</span>
                      <span className="font-mono font-medium text-gray-900">{selectedEmployeeForDetail.ip_address || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
