import React, { useEffect, useState, useRef } from "react";
import { FiHome } from "react-icons/fi";
import DashboardLayout from "../../components/DashboardLayout";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Filter,
  Download,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
  User,
  FileText,
  X,
} from "lucide-react";
import NumberCard from "../../components/NumberCard";
import {
  useGetLeaveRequestsQuery,
  useCreateLeaveRequestMutation,
  useUpdateLeaveStatusMutation,
  useGetLeaveTypesQuery
} from "../../store/api/leaveApi";
import { useGetEmployeesQuery } from "../../store/api/employeeApi";
import toast from 'react-hot-toast';
import usePermission from "../../hooks/usePermission";
import Modal from "../../components/common/Modal";
import ActionGuard from "../../components/common/ActionGuard";

const ViewLeaveModal = ({ isOpen, onClose, leave }) => {
  if (!leave || !isOpen) return null;

  const statusColor =
    leave.status === "approved"
      ? "text-[#00B050] bg-[#E6F9F1]"
      : leave.status === "rejected"
        ? "text-[#FF5A5F] bg-[#FEEBF0]"
        : "text-[#FFB000] bg-[#FFF9E6]";

  const statusIcon =
    leave.status === "approved" ? (
      <CheckCircle size={28} />
    ) : leave.status === "rejected" ? (
      <XCircle size={28} />
    ) : (
      <Clock size={28} />
    );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 font-primary">
      <div className="bg-white w-full max-w-2xl rounded-none animate-scaleIn overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-[#FF7B1D] px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-none bg-white/20 flex items-center justify-center text-white backdrop-blur-sm">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white capitalize tracking-wide">Leave Details</h2>
              <p className="text-white/80 text-sm font-medium">{leave.employee_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 transition-all rounded-none"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Stats Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Days */}
            <div className="bg-[#E6F4FE] rounded-none p-6 flex flex-col items-center justify-center text-center gap-2 border border-[#B3D7FF]">
              <div className="bg-[#0070FF] p-2.5 rounded-none text-white mb-1">
                <Calendar size={20} />
              </div>
              <span className="text-3xl font-bold text-[#004BB3]">{leave.days}</span>
              <span className="text-xs font-bold text-[#0070FF] uppercase tracking-wider">
                Total Days
              </span>
            </div>

            {/* Leave Type */}
            <div className="bg-[#F3E8FF] rounded-none p-6 flex flex-col items-center justify-center text-center gap-2 border border-[#E9D5FF]">
              <div className="bg-[#9333EA] p-2.5 rounded-none text-white mb-1">
                <FileText size={20} />
              </div>
              <span className="text-base font-bold text-[#6B21A8] capitalize">
                {leave.status === 'sick' ? 'Sick Leave' : leave.status === 'casual' ? 'Casual Leave' : leave.leave_type || 'Leave'}
              </span>
              <span className="text-xs font-bold text-[#9333EA] uppercase tracking-wider">
                Leave Type
              </span>
            </div>

            {/* Status */}
            <div className={`${statusColor} rounded-none p-6 flex flex-col items-center justify-center text-center gap-2 border border-current bg-opacity-50`}>
              <div className="p-2 rounded-none bg-white/50 mb-1">
                {statusIcon}
              </div>
              <span className="text-base font-bold capitalize">
                {leave.status}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                Status
              </span>
            </div>
          </div>

          {/* Date Range */}
          <div className="flex justify-between items-center border-t border-b border-gray-200 py-6">
            <div className="text-center md:text-left">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1.5">From Date</p>
              <p className="text-lg font-bold text-gray-800">
                {new Date(leave.from_date).toLocaleDateString()}
              </p>
            </div>
            <div className="h-10 w-px bg-gray-200 hidden md:block"></div>
            <div className="text-center md:text-right">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1.5">To Date</p>
              <p className="text-lg font-bold text-gray-800">
                {new Date(leave.to_date).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Reason */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <FileText size={14} /> Reason
            </h3>
            <div className="bg-gray-50 p-5 rounded-none border border-gray-200 text-sm font-medium text-gray-800 leading-relaxed">
              {leave.reason || "No reason provided."}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-none text-sm hover:bg-gray-50 transition-all active:scale-95 tracking-wide"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default function LeaveManagement() {
  const [activeTab, setActiveTab] = useState("all");
  const [dateRange, setDateRange] = useState({ state: "All", start: "", end: "" });
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const dropdownRef = useRef(null);

  const itemsPerPage = 10;

  const { create, read, update, delete: remove } = usePermission("Leave Management");

  // Queries
  const {
    data: leaveData,
    isLoading,
    isError,
    refetch
  } = useGetLeaveRequestsQuery({
    page: currentPage,
    limit: itemsPerPage,
    status: activeTab === 'all' ? 'All' : activeTab,
    // Add date filtering logic if supported by backend, otherwise frontend filtering can be done on the result
  }, { refetchOnMountOrArgChange: true });

  const { data: employeesData } = useGetEmployeesQuery({ page: 1, limit: 100 }, { refetchOnMountOrArgChange: true });
  const { data: leaveTypesData } = useGetLeaveTypesQuery({ page: 1, limit: 100 }, { refetchOnMountOrArgChange: true });

  const [createLeaveRequest] = useCreateLeaveRequestMutation();
  const [updateLeaveStatus] = useUpdateLeaveStatusMutation();

  const [formData, setFormData] = useState({
    employee_id: "",
    leave_type_id: "",
    from_date: "",
    to_date: "",
    reason: "",
  });

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-[#E6F9F1] text-[#00B050]";
      case "pending":
        return "bg-[#FFF9E6] text-[#FFB000]";
      case "rejected":
        return "bg-[#FEEBF0] text-[#FF5A5F]";
      default:
        return "bg-[#F1F3F5] text-[#495057]";
    }
  };

  const calculateDays = (from, to) => {
    if (!from || !to) return 0;
    const start = new Date(from);
    const end = new Date(to);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    if (!formData.employee_id || !formData.leave_type_id || !formData.from_date || !formData.to_date) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const days = calculateDays(formData.from_date, formData.to_date);
      await createLeaveRequest({
        ...formData,
        days
      }).unwrap();
      toast.success('Leave request submitted successfully');
      setShowApplyModal(false);
      setFormData({
        employee_id: "",
        leave_type_id: "",
        from_date: "",
        to_date: "",
        reason: "",
      });
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to submit leave request');
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateLeaveStatus({ id, status }).unwrap();
      toast.success(`Leave request ${status} successfully`);
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to update status');
    }
  }

  const handleExport = () => {
    if (!leaveData?.leave_requests) return;

    const csv = [
      ["Employee", "Type", "From", "To", "Days", "Status", "Reason"],
      ...leaveData.leave_requests.map((r) => [
        r.employee_name,
        r.leave_type,
        new Date(r.from_date).toLocaleDateString(),
        new Date(r.to_date).toLocaleDateString(),
        r.days,
        r.status,
        r.reason,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leave-requests.csv";
    a.click();
  };

  const clearAllFilters = () => {
    setActiveTab("all");
    setDateRange({ state: "All", start: "", end: "" });
    setIsFilterOpen(false);
    setCurrentPage(1);
  };

  const hasActiveFilters = activeTab !== "all" || dateRange.state !== "All";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalPages = leaveData?.pagination?.totalPages || 1;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white">
        {/* Header Section */}
        <div className="bg-white sticky top-0 z-30">
          <div className="max-w-8xl mx-auto px-4 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 transition-all duration-300">Leave Management</h1>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-2 font-medium">
                  <FiHome className="text-gray-400" size={14} />
                  <span>HRM</span> /{" "}
                  <span className="text-[#FF7B1D]">
                    Leave Management
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Unified Filter */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => {
                      if (hasActiveFilters) {
                        clearAllFilters();
                      } else {
                        setIsFilterOpen(!isFilterOpen);
                      }
                    }}
                    className={`px-3 py-3 rounded-sm border transition shadow-sm ${isFilterOpen || hasActiveFilters
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-[#FF7B1D]"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                      }`}
                  >
                    {hasActiveFilters ? <X size={18} /> : <Filter size={18} />}
                  </button>

                  {isFilterOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 animate-fadeIn overflow-hidden">
                      <div className="p-3 border-b border-gray-100 bg-gray-50">
                        <span className="text-sm font-bold text-gray-700 tracking-wide">Status</span>
                      </div>
                      <div className="py-1">
                        {["all", "pending", "approved", "rejected"].map((tab) => (
                          <button
                            key={tab}
                            onClick={() => {
                              setActiveTab(tab);
                              setIsFilterOpen(false);
                              setCurrentPage(1);
                            }}
                            className={`block w-full text-left px-4 py-2 text-sm transition-colors ${activeTab === tab
                              ? "bg-orange-50 text-orange-600 font-bold"
                              : "text-gray-700 hover:bg-gray-50"
                              }`}
                          >
                            <span className="capitalize">{tab}</span>
                          </button>
                        ))}
                      </div>

                      <div className="p-3 border-t border-b border-gray-100 bg-gray-50">
                        <span className="text-sm font-bold text-gray-700 tracking-wide">Date Range</span>
                      </div>
                      <div className="py-1">
                        {["All", "Today", "Yesterday", "Last 7 Days", "Custom"].map((option) => (
                          <div key={option}>
                            <button
                              onClick={() => {
                                setDateRange({ ...dateRange, state: option });
                                if (option !== "Custom") {
                                  setIsFilterOpen(false);
                                  setCurrentPage(1);
                                }
                              }}
                              className={`block w-full text-left px-4 py-2 text-sm transition-colors ${dateRange.state === option
                                ? "bg-orange-50 text-orange-600 font-bold"
                                : "text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                              {option}
                            </button>
                            {option === "Custom" && dateRange.state === "Custom" && (
                              <div className="px-4 py-3 space-y-2 border-t border-gray-50 bg-gray-50/50">
                                <input
                                  type="date"
                                  value={dateRange.start}
                                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                  className="w-full px-2 py-2 border border-gray-300 rounded-sm text-xs focus:ring-1 focus:ring-orange-500 outline-none"
                                />
                                <input
                                  type="date"
                                  value={dateRange.end}
                                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                  className="w-full px-2 py-2 border border-gray-300 rounded-sm text-xs focus:ring-1 focus:ring-orange-500 outline-none"
                                />
                                <button
                                  onClick={() => { setIsFilterOpen(false); setCurrentPage(1); }}
                                  className="w-full bg-orange-500 text-white text-[10px] font-bold py-2 rounded-sm"
                                >
                                  Apply
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* <button
                  onClick={handleExport}
                  className="bg-white border border-gray-300 hover:bg-gray-50 px-6 py-3 rounded-sm flex items-center gap-2 transition text-sm font-semibold shadow-sm active:scale-95 text-gray-700"
                >
                  <Download className="w-5 h-5" /> EXPORT
                </button> */}

                <ActionGuard permission="leave_apply" module="Leave Management" type="create">
                  <button
                    onClick={() => setShowApplyModal(true)}
                    className="flex items-center gap-2 px-6 py-3 rounded-sm transition shadow-lg hover:shadow-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 font-bold"
                  >
                    <Plus size={20} /> Apply Leave
                  </button>
                </ActionGuard>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-8xl mx-auto p-4 pt-0 mt-2">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <NumberCard
              title="Total Requests"
              number={leaveData?.summary?.total || "0"}
              icon={<Calendar className="text-blue-600" size={24} />}
              iconBgColor="bg-blue-100"
              lineBorderClass="border-blue-500"
            />
            <NumberCard
              title="Pending"
              number={leaveData?.summary?.pending || "0"}
              icon={<Clock className="text-yellow-600" size={24} />}
              iconBgColor="bg-yellow-100"
              lineBorderClass="border-yellow-500"
            />
            <NumberCard
              title="Approved"
              number={leaveData?.summary?.approved || "0"}
              icon={<CheckCircle className="text-green-600" size={24} />}
              iconBgColor="bg-green-100"
              lineBorderClass="border-green-500"
            />
            <NumberCard
              title="Rejected"
              number={leaveData?.summary?.rejected || "0"}
              icon={<XCircle className="text-red-600" size={24} />}
              iconBgColor="bg-red-100"
              lineBorderClass="border-red-500"
            />
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-sm shadow-sm mt-4">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm">
                  <th className="py-3 px-6 font-semibold text-left border-b border-orange-400">Employee</th>
                  <th className="py-3 px-4 font-semibold text-center border-b border-orange-400">Leave Type</th>
                  <th className="py-3 px-4 font-semibold text-center border-b border-orange-400">From</th>
                  <th className="py-3 px-4 font-semibold text-center border-b border-orange-400">To</th>
                  <th className="py-3 px-4 font-semibold text-center border-b border-orange-400">Days</th>
                  <th className="py-3 px-4 font-semibold text-center border-b border-orange-400">Status</th>
                  <th className="py-3 px-4 font-semibold text-right border-b border-orange-400">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="py-20 text-center">
                      <div className="flex justify-center flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                        <p className="text-gray-500 font-semibold">Loading leave requests...</p>
                      </div>
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-red-500 font-bold">Error loading leave data.</td>
                  </tr>
                ) : leaveData?.leave_requests?.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Calendar size={48} className="text-gray-200" />
                        <p className="text-gray-500 font-medium">No leave requests found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  leaveData?.leave_requests.map((request) => (
                    <tr key={request.id} className="border-t hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-[#FF7B1D] font-bold text-[10px] border border-orange-200 shadow-sm">
                            {request.employee_name?.charAt(0) || 'U'}
                          </div>
                          <div className="font-bold text-gray-800">{request.employee_name}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-gray-700 font-medium">
                        {request.leave_type || 'Unknown'}
                      </td>
                      <td className="py-3 px-4 text-center text-gray-600">
                        {new Date(request.from_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-center text-gray-600">
                        {new Date(request.to_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex px-3 py-1 rounded-sm text-[11px] font-bold bg-[#E6F4FE] text-[#0070FF]">
                          {request.days}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-3 py-1 rounded-sm text-[11px] font-bold capitalize ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          {request.status?.toLowerCase() === "pending" ? (
                            <div className="flex gap-1.5 text-right">
                              <ActionGuard permission="leave_approve" module="Leave Management" type="update">
                                <button
                                  onClick={() => handleStatusUpdate(request.id, 'approved')}
                                  className="px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded-sm text-[10px] font-bold hover:bg-green-100 transition-colors shadow-sm"
                                >
                                  APPROVE
                                </button>
                              </ActionGuard>
                               <ActionGuard permission="leave_approve" module="Leave Management" type="update">
                                <button
                                  onClick={() => handleStatusUpdate(request.id, 'rejected')}
                                  className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded-sm text-[10px] font-bold hover:bg-red-100 transition-colors shadow-sm"
                                >
                                  REJECT
                                </button>
                              </ActionGuard>
                            </div>
                          ) : (
                            <div className="flex justify-end">
                               <ActionGuard module="Leave Management" type="read">
                                <button
                                  onClick={() => {
                                    setSelectedLeave(request);
                                    setIsViewOpen(true);
                                  }}
                                  className="p-1 hover:bg-orange-100 rounded-sm text-blue-500 hover:text-blue-700 transition-all"
                                  title="View Details"
                                >
                                  <Eye size={18} />
                                </button>
                              </ActionGuard>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 0 && (
            <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4 bg-gray-50 p-4 rounded-sm border border-gray-200 shadow-sm">
              <p className="text-sm font-semibold text-gray-700">
                Showing <span className="text-orange-600 font-bold">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="text-orange-600 font-bold">{Math.min(currentPage * itemsPerPage, leaveData?.pagination?.total || 0)}</span> of <span className="text-orange-600 font-bold">{leaveData?.pagination?.total || 0}</span> Results
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-sm font-bold transition flex items-center gap-1 ${currentPage === 1
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed border-gray-300"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm shadow-black/5"
                    }`}
                >
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let p = i + 1;
                    if (totalPages > 5 && currentPage > 3) {
                      p = currentPage - 2 + i;
                    }
                    if (p > totalPages) return null;
                    return (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className={`w-10 h-10 rounded-sm font-bold transition border ${currentPage === p
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-500 shadow-md"
                          : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300 shadow-sm shadow-black/5"
                          }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-sm font-bold transition flex items-center gap-1 ${currentPage === totalPages
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed border-gray-300 shadow-sm"
                    : "bg-[#22C55E] text-white hover:opacity-90 shadow-md shadow-black/5"
                    }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Apply Leave Modal */}
          {showApplyModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 font-primary text-left">
              <div className="bg-white w-full max-w-md shadow-2xl rounded-sm animate-scaleIn">
                <div className="sticky top-0 bg-[#FF7B1D] px-6 py-4 flex items-center justify-between z-50 rounded-t-sm shadow-md">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2 capitalize tracking-wide">
                    <Plus size={20} />
                    Apply for Leave
                  </h2>
                  <button onClick={() => setShowApplyModal(false)} className="text-white hover:bg-white hover:bg-opacity-20 p-2 transition-all ">
                    <X size={24} />
                  </button>
                </div>
                <form onSubmit={handleSubmitLeave} className="p-6 space-y-6">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2 capitalize">
                      <User size={14} className="text-[#FF7B1D]" />
                      Employee <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.employee_id}
                      onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none transition-all text-sm text-gray-900 bg-white hover:border-gray-300 shadow-sm font-medium"
                      required
                    >
                      <option value="">Select Employee</option>
                      {employeesData?.employees?.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.employee_name} ({emp.employee_id})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2 capitalize">
                      <FileText size={14} className="text-[#FF7B1D]" />
                      Leave Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.leave_type_id}
                      onChange={(e) => setFormData({ ...formData, leave_type_id: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none transition-all text-sm text-gray-900 bg-white hover:border-gray-300 shadow-sm font-medium"
                      required
                    >
                      <option value="">Select Leave Type</option>
                      {leaveTypesData?.leave_types?.map(lt => (
                        <option key={lt.id} value={lt.id}>{lt.leave_type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2 capitalize">
                        <Calendar size={14} className="text-[#FF7B1D]" />
                        From Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.from_date}
                        onChange={(e) => setFormData({ ...formData, from_date: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none transition-all text-sm text-gray-900 placeholder-gray-400 bg-white hover:border-gray-300 shadow-sm font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2 capitalize">
                        <Calendar size={14} className="text-[#FF7B1D]" />
                        To Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.to_date}
                        onChange={(e) => setFormData({ ...formData, to_date: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none transition-all text-sm text-gray-900 placeholder-gray-400 bg-white hover:border-gray-300 shadow-sm font-medium"
                        required
                      />
                    </div>
                  </div>

                  {formData.from_date && formData.to_date && (
                    <div className="bg-orange-50 border border-orange-100 rounded p-3 text-center transition-all animate-fadeIn">
                      <p className="text-xs text-orange-700 font-bold  tracking-widest">
                        Total Days: <span className="text-lg ml-1">{calculateDays(formData.from_date, formData.to_date)}</span>
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2 capitalize">
                      <FileText size={14} className="text-[#FF7B1D]" />
                      Reason
                    </label>
                    <textarea
                      rows="3"
                      maxLength={500}
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none transition-all resize-none text-sm text-gray-900 bg-white placeholder-gray-400 shadow-sm hover:border-gray-300 font-medium"
                      placeholder="Enter reason for leave (Max 500 chars)..."
                    ></textarea>
                    <div className="text-right text-[10px] text-gray-400 font-medium mt-1">
                      {formData.reason.length}/500 Characters
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setShowApplyModal(false)}
                      className="px-6 py-2.5 border border-gray-300 font-bold text-gray-700 hover:bg-gray-50 transition-all rounded-sm shadow-sm text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-[#FF7B1D] text-white font-bold shadow-md hover:bg-[#e66a15] transition-all duration-300 rounded-sm text-sm"
                    >
                      Submit
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
        <ViewLeaveModal
          isOpen={isViewOpen}
          onClose={() => {
            setIsViewOpen(false);
            setSelectedLeave(null);
          }}
          leave={selectedLeave}
        />
      </div>
    </DashboardLayout>
  );
}
