import React, { useState, useRef, useEffect } from "react";
import { FiHome } from "react-icons/fi";
import { Edit, Trash2, Eye, Plus, Warehouse, Users, Filter, X, LayoutGrid, List, Target, Handshake } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import ActionGuard from "../../components/common/ActionGuard";
import AddDepartmentModal from "../../components/Department/AddDepartmentModal";
import EditDepartmentModal from "../../components/Department/EditDepartmentModal";
import ViewDepartmentModal from "../../components/Department/ViewDepartmentModal";
import DeleteDepartmentModal from "../../components/Department/DeleteDepartmentModal";
import NumberCard from "../../components/NumberCard";
import { useGetDepartmentsQuery } from "../../store/api/departmentApi";
import { useGetHRMDashboardDataQuery } from "../../store/api/hrmDashboardApi";
import usePermission from "../../hooks/usePermission";
import GenericGridView from "../../components/common/GenericGridView";

const AllDepartment = () => {
  const [currentPage, setCurrentPage] = useState(1);
  // Applied filter states (used for API calls)
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // Temporary filter states (used in filter modal)
  const [tempStatusFilter, setTempStatusFilter] = useState("All");
  const [tempDateFilter, setTempDateFilter] = useState("All");
  const [tempCustomStart, setTempCustomStart] = useState("");
  const [tempCustomEnd, setTempCustomEnd] = useState("");

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [viewMode, setViewMode] = useState("list");
  const itemsPerPage = viewMode === "list" ? 6 : 12;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);

  const { create, read, update, delete: remove } = usePermission("Department Management");

  const { data, isLoading } = useGetDepartmentsQuery({
    page: currentPage,
    limit: itemsPerPage,
    status: statusFilter,
  });

  const { data: dashboardData, refetch: refetchDashboard } = useGetHRMDashboardDataQuery();
  const summary = dashboardData?.data?.summary;

  const departments = data?.departments || [];
  const totalItems = data?.pagination?.total || 0;
  const totalPages = data?.pagination?.totalPages || 1;

  // Open filter modal - sync temp states with applied states
  const openFilterModal = () => {
    setTempStatusFilter(statusFilter);
    setTempDateFilter(dateFilter);
    setTempCustomStart(customStart);
    setTempCustomEnd(customEnd);
    setIsFilterOpen(true);
  };

  // Apply filters - copy temp states to applied states
  const applyFilters = () => {
    setStatusFilter(tempStatusFilter);
    setDateFilter(tempDateFilter);
    setCustomStart(tempCustomStart);
    setCustomEnd(tempCustomEnd);
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  // Cancel - just close modal (temp states will be reset on next open)
  const cancelFilters = () => {
    setIsFilterOpen(false);
  };

  // Reset all filters (both temp and applied)
  const clearAllFilters = () => {
    setTempStatusFilter("All");
    setTempDateFilter("All");
    setTempCustomStart("");
    setTempCustomEnd("");
  };

  const handleClearAll = () => {
    setStatusFilter("All");
    setDateFilter("All");
    setCustomStart("");
    setCustomEnd("");
    setTempStatusFilter("All");
    setTempDateFilter("All");
    setTempCustomStart("");
    setTempCustomEnd("");
    setCurrentPage(1);
  };

  const hasActiveFilters = statusFilter !== "All" || dateFilter !== "All" || customStart || customEnd;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePageChange = (page) => setCurrentPage(page);
  const handlePrev = () =>
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
  const handleNext = () =>
    setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));

  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const indexOfLastItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white">
        {/* Header Section */}
        <div className="bg-white sticky top-0 z-30">
          <div className="max-w-8xl mx-auto px-4 py-4 border-b">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Department</h1>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2 font-primary">
                  <FiHome className="text-gray-700" size={14} />
                  <span className="text-gray-400">/</span> HRM <span className="text-gray-400">/</span>
                  <span className="text-[#FF7B1D] font-medium">All Department</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Unified Filter */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => {
                      if (hasActiveFilters) {
                        handleClearAll();
                      } else {
                        setIsFilterOpen(!isFilterOpen);
                        if (!isFilterOpen) openFilterModal();
                      }
                    }}
                    className={`px-3 py-3 rounded-sm border transition shadow-sm ${isFilterOpen || hasActiveFilters
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-[#FF7B1D] shadow-orange-200"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                      }`}
                  >
                    {hasActiveFilters ? <X size={18} strokeWidth={3} /> : <Filter size={18} strokeWidth={2.5} />}
                  </button>

                  {isFilterOpen && (
                    <div className="absolute right-0 mt-2 w-[550px] bg-white border border-gray-200 rounded-sm shadow-2xl z-50 animate-fadeIn overflow-hidden">
                      {/* Filter Header */}
                      <div className="p-4 bg-gray-50 border-b flex justify-between items-center px-6">
                        <span className="text-xs font-black text-gray-800 uppercase tracking-widest">Filter Options</span>
                        <button
                          onClick={clearAllFilters}
                          className="text-[10px] font-black text-orange-600 hover:underline hover:text-orange-700 uppercase tracking-widest"
                        >
                          Reset All
                        </button>
                      </div>

                      <div className="p-6 space-y-8">
                        <div className="grid grid-cols-2 gap-x-12">
                          {/* Status */}
                          <div className="space-y-4">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3 border-b pb-1">Filter by Status</span>
                            <div className="flex flex-col gap-3">
                              {["All", "Active", "Inactive"].map((status) => (
                                <label key={status} className="flex items-center gap-3 cursor-pointer group w-fit">
                                  <div className="relative flex items-center">
                                    <input
                                      type="radio"
                                      name="status"
                                      checked={tempStatusFilter === status}
                                      onChange={() => setTempStatusFilter(status)}
                                      className="peer appearance-none w-4 h-4 border-2 border-gray-300 rounded-full checked:border-orange-500 checked:border-[5px] transition-all cursor-pointer"
                                    />
                                  </div>
                                  <span className={`text-sm font-bold transition-colors ${tempStatusFilter === status ? "text-orange-600" : "text-gray-600 group-hover:text-gray-900"}`}>
                                    {status}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Date Period */}
                          <div className="space-y-4">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3 border-b pb-1">Creation Date</span>
                            <div className="flex flex-col gap-3">
                              {["All", "Today", "Yesterday", "Last 7 Days", "Custom"].map((period) => (
                                <label key={period} className="flex items-center gap-3 cursor-pointer group w-fit">
                                  <div className="relative flex items-center">
                                    <input
                                      type="radio"
                                      name="datePeriod"
                                      checked={tempDateFilter === period}
                                      onChange={() => setTempDateFilter(period)}
                                      className="peer appearance-none w-4 h-4 border-2 border-gray-300 rounded-full checked:border-orange-500 checked:border-[5px] transition-all cursor-pointer"
                                    />
                                  </div>
                                  <span className={`text-sm font-bold transition-colors ${tempDateFilter === period ? "text-orange-600" : "text-gray-600 group-hover:text-gray-900"}`}>
                                    {period === "Custom" ? "Custom Range" : period}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Custom Date Range Picker */}
                        {tempDateFilter === "Custom" && (
                          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-sm border border-gray-200 animate-slideDown">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Start Date</label>
                              <input
                                type="date"
                                value={tempCustomStart}
                                onChange={(e) => setTempCustomStart(e.target.value)}
                                className="w-full px-4 py-2 text-xs font-bold border border-gray-200 rounded-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-200 outline-none hover:border-gray-300 transition-all bg-white"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">End Date</label>
                              <input
                                type="date"
                                value={tempCustomEnd}
                                onChange={(e) => setTempCustomEnd(e.target.value)}
                                className="w-full px-4 py-2 text-xs font-bold border border-gray-200 rounded-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-200 outline-none hover:border-gray-300 transition-all bg-white"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Filter Footer */}
                      <div className="p-4 bg-gray-50 border-t flex gap-3 px-6">
                        <button
                          onClick={cancelFilters}
                          className="flex-1 py-3 text-[11px] font-black text-gray-500 uppercase tracking-widest hover:bg-gray-200 transition-all rounded-sm border border-gray-200 bg-white shadow-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={applyFilters}
                          className="flex-1 py-3 text-[11px] font-black text-white uppercase tracking-widest bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all rounded-sm shadow-md active:scale-95"
                        >
                          Apply Filters
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center bg-gray-100 p-1 rounded-sm border border-gray-200 shadow-inner">
                  <button
                    onClick={() => { setViewMode("grid"); setCurrentPage(1); }}
                    className={`p-2 rounded-sm transition-all duration-200 ${viewMode === "grid"
                      ? "bg-white text-orange-600 shadow-sm border border-gray-100"
                      : "text-gray-400 hover:text-gray-600"
                      }`}
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button
                    onClick={() => { setViewMode("list"); setCurrentPage(1); }}
                    className={`p-2 rounded-sm transition-all duration-200 ${viewMode === "list"
                      ? "bg-white text-orange-600 shadow-sm border border-gray-100"
                      : "text-gray-400 hover:text-gray-600"
                      }`}
                  >
                    <List size={18} />
                  </button>
                </div>

                <ActionGuard permission="department_create" module="Department Management" type="create">
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-sm font-semibold transition-all shadow-lg active:scale-95 bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 hover:shadow-orange-200`}
                  >
                    <Plus size={18} />
                    Add Department
                  </button>
                </ActionGuard>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-8xl mx-auto p-4 pt-0 mt-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <NumberCard
              title="Total Employees"
              number={summary?.totalEmployees?.value || "0"}
              icon={<Users className="text-blue-600" size={24} strokeWidth={2.5} />}
              iconBgColor="bg-blue-50"
              lineBorderClass="border-blue-500"
            />
            <NumberCard
              title="Departments"
              number={summary?.totalDepartments?.value || "0"}
              icon={<Warehouse className="text-green-600" size={24} strokeWidth={2.5} />}
              iconBgColor="bg-green-50"
              lineBorderClass="border-green-500"
            />
            <NumberCard
              title="Designations"
              number={summary?.totalDesignations?.value || "0"}
              icon={<Handshake className="text-orange-600" size={24} strokeWidth={2.5} />}
              iconBgColor="bg-orange-50"
              lineBorderClass="border-orange-500"
            />
            <NumberCard
              title="Total Status"
              number={"2"}
              icon={<Target className="text-purple-600" size={24} strokeWidth={2.5} />}
              iconBgColor="bg-purple-50"
              lineBorderClass="border-purple-500"
            />
          </div>

          {viewMode === "list" ? (
            <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden font-primary">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm">
                      <th className="py-3 px-4 font-semibold text-left w-12">S.N</th>
                      <th className="py-3 px-4 font-semibold text-center w-24">Icon</th>
                      <th className="py-3 px-4 font-semibold text-left w-32">Dept ID</th>
                      <th className="py-3 px-4 font-semibold text-left">Department Name</th>
                      <th className="py-3 px-4 font-semibold text-left">Description</th>
                      <th className="py-3 px-4 font-semibold text-center w-32">Employees</th>
                      <th className="py-3 px-4 font-semibold text-center w-32">Status</th>
                      <th className="py-3 px-4 font-semibold text-right w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan="8" className="py-32 text-center bg-white italic">
                          <div className="flex flex-col items-center justify-center gap-4">
                            <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                            <p className="text-gray-500 font-bold animate-pulse tracking-wide">Fetching departments...</p>
                          </div>
                        </td>
                      </tr>
                    ) : departments.length > 0 ? (
                      departments.map((dept, index) => (
                        <tr key={dept.id} className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50/30"} hover:bg-orange-50/50 transition-colors group`}>
                          <td className="py-4 px-4 text-gray-500 font-semibold text-xs">{indexOfFirstItem + index + 1}</td>
                          <td className="py-4 px-4">
                            <div className="flex justify-center">
                              {dept.icon ? (
                                <img
                                  src={`${import.meta.env.VITE_API_BASE_URL.replace('/api/', '')}${dept.icon}`}
                                  alt={dept.department_name}
                                  className="w-10 h-10 rounded-full border border-orange-100 object-cover shadow-sm group-hover:scale-110 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 font-bold border border-orange-100 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                  {dept.department_name?.substring(0, 1).toUpperCase()}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-orange-600 font-semibold text-sm tracking-tight">{dept.department_id}</td>
                          <td className="py-4 px-4 text-gray-900 font-semibold text-base tracking-tight">{dept.department_name}</td>
                          <td className="py-4 px-4 text-gray-600 max-w-xs">
                            <div className="text-sm line-clamp-1 text-gray-500 font-medium group-hover:text-gray-700 transition-colors" title={dept.description}>
                              {dept.description || "No description provided."}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex justify-center">
                              <span className="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-700 rounded-full text-[11px] font-bold border border-gray-100 group-hover:bg-white group-hover:border-orange-200 transition-all shadow-sm">
                                {dept.employee_count || 0}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex justify-center">
                              <span className={`px-3.5 py-1.5 rounded-sm text-xs font-bold capitalize tracking-wide border flex items-center gap-2 w-fit shadow-sm
                                ${dept.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}
                              `}>
                                <div className={`w-2 h-2 rounded-full ${dept.status === 'Active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'}`}></div>
                                {dept.status}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex justify-end gap-3 pr-2">
                              <ActionGuard permission="department_view" module="Department Management" type="read">
                                <button
                                  onClick={() => { setSelectedDept(dept); setIsViewModalOpen(true); }}
                                  className="text-blue-500 hover:scale-110 transition-transform active:scale-90"
                                  title="View Details"
                                >
                                  <Eye size={18} strokeWidth={2} />
                                </button>
                              </ActionGuard>
                              <ActionGuard permission="department_edit" module="Department Management" type="update">
                                <button
                                  onClick={() => { setSelectedDept(dept); setIsEditModalOpen(true); }}
                                  className="text-[#22C55E] hover:scale-110 transition-transform active:scale-90"
                                  title="Edit Department"
                                >
                                  <Edit size={18} strokeWidth={2} />
                                </button>
                              </ActionGuard>
                              <ActionGuard permission="department_delete" module="Department Management" type="delete">
                                <button
                                  onClick={() => { setSelectedDept(dept); setIsDeleteModalOpen(true); }}
                                  className="text-red-500 hover:scale-110 transition-transform active:scale-90"
                                  title="Delete Department"
                                >
                                  <Trash2 size={18} strokeWidth={2} />
                                </button>
                              </ActionGuard>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8">
                          <div className="text-center py-32 bg-white rounded-sm border-2 border-dashed border-gray-100 transition-all duration-500 hover:border-orange-200/50 group m-8">
                            <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner ring-8 ring-gray-50/50 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                              <Warehouse className="w-12 h-12 text-gray-300" strokeWidth={1} />
                            </div>
                            <h3 className="text-2xl font-black text-gray-800 mb-3 tracking-tighter uppercase font-primary">
                              {hasActiveFilters ? "No matches found" : "No Departments found"}
                            </h3>
                            <p className="text-gray-400 max-w-sm mx-auto text-sm leading-relaxed mb-10 px-6 font-primary italic">
                              {hasActiveFilters
                                ? "We couldn't find any departments matching your current filter criteria. Try expanding your search or clearing filters!"
                                : "Your department structure is empty. Start by creating your first business unit!"}
                            </p>
                            <div className="flex justify-center flex-wrap gap-4 px-6">
                              {hasActiveFilters ? (
                                <button
                                  onClick={handleClearAll}
                                  className="px-10 py-4 border-2 border-orange-500 text-orange-600 font-black rounded-sm hover:bg-orange-50 transition-all text-[11px] uppercase tracking-widest active:scale-95 shadow-md flex items-center gap-2"
                                >
                                  <X size={16} strokeWidth={3} />
                                  Clear All Filters
                                </button>
                              ) : (
                                <button
                                  onClick={() => setIsAddModalOpen(true)}
                                  disabled={!create}
                                  className={`flex items-center gap-3 px-10 py-4 rounded-sm font-black transition-all shadow-xl active:scale-95 text-[11px] uppercase tracking-widest ${create
                                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 hover:shadow-orange-200"
                                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    }`}
                                >
                                  <Plus size={18} strokeWidth={4} />
                                  Create First Department
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="font-primary">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse mt-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-[320px] bg-gray-50 rounded-sm border border-gray-100 border-dashed"></div>
                  ))}
                </div>
              ) : departments.length > 0 ? (
                <GenericGridView
                  data={departments}
                  renderItem={(dept) => (
                    <div key={dept.id} className="bg-white border-2 border-gray-100 rounded-sm shadow-sm hover:shadow-md transition-all p-6 relative group flex flex-col h-full">
                      {/* Absolute Actions */}
                      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
                        <ActionGuard permission="department_view" module="Department Management" type="read">
                          <button
                            onClick={() => { setSelectedDept(dept); setIsViewModalOpen(true); }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-sm bg-white shadow-sm border border-blue-100"
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                        </ActionGuard>
                        <ActionGuard permission="department_edit" module="Department Management" type="update">
                          <button
                            onClick={() => { setSelectedDept(dept); setIsEditModalOpen(true); }}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-sm bg-white shadow-sm border border-green-100"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                        </ActionGuard>
                        <ActionGuard permission="department_delete" module="Department Management" type="delete">
                          <button
                            onClick={() => { setSelectedDept(dept); setIsDeleteModalOpen(true); }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-sm bg-white shadow-sm border border-red-100"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </ActionGuard>
                      </div>

                      {/* Icon Section */}
                      <div className="flex flex-col items-center mb-6 transition-transform group-hover:scale-105 duration-300 mt-2">
                        <div className="w-20 h-20 rounded-full flex items-center justify-center border-4 border-white shadow-sm group-hover:shadow-md transition-all overflow-hidden bg-orange-50">
                          {dept.icon ? (
                            <img
                              src={`${import.meta.env.VITE_API_BASE_URL.replace('/api/', '')}${dept.icon}`}
                              alt={dept.department_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-orange-500 font-bold text-3xl">
                              {dept.department_name?.substring(0, 1).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="mt-4 text-center w-full px-2">
                          <h3 className="text-base font-bold text-gray-900 tracking-tight line-clamp-1 break-words" title={dept.department_name}>
                            {dept.department_name}
                          </h3>
                          <div className="flex justify-center mt-2">
                            <span className="px-3 py-0.5 bg-orange-50 text-orange-600 rounded-full text-[10px] font-bold border border-orange-100 uppercase tracking-widest">
                              {dept.department_id}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-4 line-clamp-2 min-h-[32px] px-4 text-center leading-relaxed break-words w-full overflow-hidden">
                          {dept.description || "No specific mission or description defined for this unit yet."}
                        </p>
                      </div>

                      {/* Footer Section */}
                      <div className="mt-auto bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-sm border-t border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex flex-col items-center flex-1 border-r border-gray-200">
                            <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">Total Staff</p>
                            <p className="text-sm font-bold text-gray-800 mt-0.5">{dept.employee_count || 0}</p>
                          </div>
                          <div className="flex flex-col items-center flex-1">
                            <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">Positions</p>
                            <p className="text-sm font-bold text-gray-800 mt-0.5">{dept.designation_count || 0}</p>
                          </div>
                        </div>

                        <div className="flex justify-center pt-1">
                          <span
                            className={`px-4 py-1 text-[10px] font-bold rounded-full uppercase tracking-widest border shadow-sm transition-all ${dept.status === "Active"
                              ? "bg-green-50 text-[#22C55E] border-green-100"
                              : "bg-red-50 text-red-600 border-red-100"
                              }`}
                          >
                            {dept.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                />
              ) : (
                <div className="text-center py-32 bg-white rounded-sm border-2 border-dashed border-gray-100 mt-6 transition-all duration-500 hover:border-orange-200/50 group">
                  <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner ring-8 ring-gray-50/50 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <Warehouse className="w-12 h-12 text-gray-300" strokeWidth={1} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-800 mb-3 tracking-tighter uppercase font-primary">
                    {hasActiveFilters ? "No matches found" : "No Departments found"}
                  </h3>
                  <p className="text-gray-400 max-w-sm mx-auto text-sm leading-relaxed mb-10 px-6 font-primary italic">
                    {hasActiveFilters
                      ? "We couldn't find any departments matching your current filter criteria. Try expanding your search or clearing filters!"
                      : "Your department structure is empty. Start by creating your first business unit!"}
                  </p>
                  <div className="flex justify-center flex-wrap gap-4 px-6 font-primary">
                    {hasActiveFilters ? (
                      <button
                        onClick={handleClearAll}
                        className="px-10 py-4 border-2 border-orange-500 text-orange-600 font-black rounded-sm hover:bg-orange-50 transition-all text-[11px] uppercase tracking-widest active:scale-95 shadow-md flex items-center gap-2"
                      >
                        <X size={16} strokeWidth={3} />
                        Clear All Filters
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsAddModalOpen(true)}
                        disabled={!create}
                        className={`flex items-center gap-3 px-10 py-4 rounded-sm font-black transition-all shadow-xl active:scale-95 text-[11px] uppercase tracking-widest ${create
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 hover:shadow-orange-200"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                      >
                        <Plus size={18} strokeWidth={4} />
                        Create First Department
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 0 && totalItems > 0 && (
            <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4 bg-gray-50 p-4 rounded-sm border border-gray-200 shadow-sm">
              <p className="text-sm font-semibold text-gray-700">
                Showing <span className="text-orange-600">{indexOfFirstItem + 1}</span> to <span className="text-orange-600">{indexOfLastItem}</span> of <span className="text-orange-600">{totalItems}</span> Departments
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-sm font-bold transition flex items-center gap-1 ${currentPage === 1
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
                    }`}
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-10 h-10 rounded-sm font-bold transition ${currentPage === pageNum
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md border-orange-500"
                          : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-sm font-bold transition flex items-center gap-1 ${currentPage === totalPages
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
                    }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        <AddDepartmentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} refetchDashboard={refetchDashboard} />
        <EditDepartmentModal
          isOpen={isEditModalOpen}
          onClose={() => { setIsEditModalOpen(false); setSelectedDept(null); }}
          department={selectedDept}
          refetchDashboard={refetchDashboard}
        />
        <ViewDepartmentModal
          isOpen={isViewModalOpen}
          onClose={() => { setIsViewModalOpen(false); setSelectedDept(null); }}
          department={selectedDept}
        />
        <DeleteDepartmentModal
          isOpen={isDeleteModalOpen}
          onClose={() => { setIsDeleteModalOpen(false); setSelectedDept(null); }}
          departmentId={selectedDept?.id}
          departmentName={selectedDept?.department_name}
          refetchDashboard={refetchDashboard}
        />
      </div>
    </DashboardLayout>
  );
};

export default AllDepartment;
