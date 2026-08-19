import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  Filter,
  Home,
  DollarSign,
  Handshake,
  Target,
  X,
  Plus as PlusIcon,
  ChevronDown,
  Calendar,
  AlertCircle,
  Search,
  Layout,
  CheckCircle,
  MoreVertical,
  RotateCcw,
  LayoutGrid,
  List
} from "lucide-react";
import { FiHome } from "react-icons/fi";
import NumberCard from "../../components/NumberCard";
import {
  useGetTeamsQuery,
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation
} from "../../store/api/teamApi";
import AddTeamModal from "../../components/Team/AddTeamModal";
import EditTeamModal from "../../components/Team/EditTeamModal";
import ViewTeamModal from "../../components/Team/ViewTeamModal";
import DeleteTeamModal from "../../components/Team/DeleteTeamModal";
import TeamMembersModal from "../../components/Team/TeamMembersModal";
import { toast } from "react-hot-toast";
import usePermission from "../../hooks/usePermission";
import { useGetDepartmentsQuery } from "../../store/api/departmentApi";
import { useGetDesignationsQuery } from "../../store/api/designationApi";
import { useGetEmployeesQuery } from "../../store/api/employeeApi";
import GenericGridView from "../../components/common/GenericGridView";
import ActionGuard from "../../components/common/ActionGuard";

export default function TeamManagement() {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [designationFilter, setDesignationFilter] = useState("All");
  const [employeeFilter, setEmployeeFilter] = useState("All");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [tempStatus, setTempStatus] = useState("All");
  const [tempDateFilter, setTempDateFilter] = useState("All");
  const [tempDepartment, setTempDepartment] = useState("All");
  const [tempDesignation, setTempDesignation] = useState("All");
  const [tempEmployee, setTempEmployee] = useState("All");
  const [tempCustomStart, setTempCustomStart] = useState("");
  const [tempCustomEnd, setTempCustomEnd] = useState("");

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [viewMode, setViewMode] = useState("list");
  const itemsPerPage = viewMode === "list" ? 10 : 12;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const { create, read, update, delete: canDelete, hasPermission } = usePermission("Team Management");

  // Filter Logic (Frontend side since backend only supports search)
  const getDateRange = () => {
    const today = new Date();
    const formatDate = (date) => date.toISOString().split('T')[0];

    let dateFrom = "";
    let dateTo = "";

    if (dateFilter === "Today") {
      dateFrom = formatDate(today);
      dateTo = formatDate(today);
    } else if (dateFilter === "Yesterday") {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      dateFrom = formatDate(yesterday);
      dateTo = formatDate(yesterday);
    } else if (dateFilter === "Last 7 Days") {
      const last7 = new Date(today);
      last7.setDate(today.getDate() - 7);
      dateFrom = formatDate(last7);
      dateTo = formatDate(today);
    } else if (dateFilter === "This Month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      dateFrom = formatDate(firstDay);
      dateTo = formatDate(today);
    } else if (dateFilter === "Custom") {
      dateFrom = customStart;
      dateTo = customEnd;
    }
    return { dateFrom, dateTo };
  };

  const { dateFrom, dateTo } = getDateRange();

  const { data, isLoading, isError, error, refetch } = useGetTeamsQuery({
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
    status: statusFilter !== "All" ? statusFilter : undefined,
    department: departmentFilter !== "All" ? departmentFilter : undefined,
    designation: designationFilter !== "All" ? designationFilter : undefined,
    employee: employeeFilter !== "All" ? employeeFilter : undefined,
    dateFrom,
    dateTo,
  });

  const { data: deptsData } = useGetDepartmentsQuery({ limit: 1000 });
  const { data: desigsData } = useGetDesignationsQuery({ limit: 1000 });
  const { data: empsData } = useGetEmployeesQuery({ limit: 1000, status: 'Active' });

  const departments = deptsData?.departments || [];
  const designations = desigsData?.designations || [];
  const employees = empsData?.employees || [];

  const [createTeam, { isLoading: isCreating }] = useCreateTeamMutation();
  const [updateTeam, { isLoading: isUpdating }] = useUpdateTeamMutation();
  const [deleteTeam, { isLoading: isDeleting }] = useDeleteTeamMutation();

  const teamsData = data?.teams || [];

  // Frontend Filtering - Only search if needed locally, but since we pass filters to backend,
  // we can use the backend results directly.
  const filteredTeams = teamsData; // Backend handles filtering now

  const totalItems = data?.pagination?.total || 0;
  const totalPages = data?.pagination?.totalPages || 1;

  const handleAddTeam = async (formData) => {
    try {
      await createTeam(formData).unwrap();
      toast.success("Team created successfully");
      setShowAddModal(false);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create team");
    }
  };

  const handleUpdateTeam = async (formData) => {
    try {
      await updateTeam(formData).unwrap();
      toast.success("Team updated successfully");
      setShowEditModal(false);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update team");
    }
  };

  const handleDeleteTeam = async () => {
    try {
      await deleteTeam(selectedTeam.id).unwrap();
      toast.success("Team deleted successfully");
      setShowDeleteModal(false);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete team");
    }
  };

  const clearAllFilters = () => {
    setStatusFilter("All");
    setDateFilter("All");
    setDepartmentFilter("All");
    setDesignationFilter("All");
    setEmployeeFilter("All");
    setCustomStart("");
    setCustomEnd("");
    setSearchTerm("");
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  const hasActiveFilters =
    statusFilter !== "All" ||
    dateFilter !== "All" ||
    departmentFilter !== "All" ||
    designationFilter !== "All" ||
    employeeFilter !== "All" ||
    searchTerm !== "";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <div className="min-h-screen bg-white">
        {/* Header Section */}
        <div className="bg-white sticky top-0 z-30">
          <div className="max-w-8xl mx-auto px-4 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 transition-all duration-300">Team Management</h1>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                  <FiHome className="text-gray-700" size={14} />
                  <span className="text-gray-400"></span> HRM /{" "}
                  <span className="text-[#FF7B1D] font-medium">
                    All Teams
                  </span>
                </p>
              </div>

              {/* Buttons and Search */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Search Bar */}



                {/* Unified Filter */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => {
                      if (hasActiveFilters) {
                        clearAllFilters();
                      } else {
                        setTempStatus(statusFilter);
                        setTempDateFilter(dateFilter);
                        setTempDepartment(departmentFilter);
                        setTempDesignation(designationFilter);
                        setTempEmployee(employeeFilter);
                        setTempCustomStart(customStart);
                        setTempCustomEnd(customEnd);
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
                    <div className="absolute right-0 mt-2 w-[400px] bg-white border border-gray-200 rounded-sm shadow-2xl z-50 animate-fadeIn overflow-hidden">
                      {/* Header */}
                      <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-800">Filter Options</span>
                        <button
                          onClick={() => {
                            setTempStatus("All");
                            setTempDateFilter("All");
                            setTempDepartment("All");
                            setTempDesignation("All");
                            setTempEmployee("All");
                            setCustomStart("");
                            setCustomEnd("");
                          }}
                          className="text-[10px] font-bold text-orange-600 hover:underline hover:text-orange-700 capitalize"
                        >
                          Reset all
                        </button>
                      </div>

                      <div className="p-5 grid grid-cols-2 gap-x-10 gap-y-8">
                        {/* Column 1: Status Selection */}
                        <div className="space-y-4">
                          <span className="text-[11px] font-bold text-gray-400 capitalize tracking-wider block mb-2 border-b pb-1">Team Status</span>
                          <div className="grid grid-cols-2 gap-4">
                            {["All", "Active", "Inactive"].map((s) => (
                              <label key={s} className="flex items-center group cursor-pointer">
                                <div className="relative flex items-center">
                                  <input
                                    type="radio"
                                    name="status_filter"
                                    checked={tempStatus === s}
                                    onChange={() => setTempStatus(s)}
                                    className="peer h-4 w-4 cursor-pointer appearance-none rounded-full border-2 border-gray-200 transition-all checked:border-[#FF7B1D] checked:border-[5px] hover:border-orange-300"
                                  />
                                </div>
                                <span className={`ml-3 text-sm font-medium transition-colors capitalize ${tempStatus === s ? "text-[#FF7B1D] font-bold" : "text-gray-600 group-hover:text-gray-900"}`}>
                                  {s}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Column 2: Team Member */}
                        <div className="space-y-4">
                          <span className="text-[11px] font-bold text-gray-400 capitalize tracking-wider block mb-2 border-b pb-1">Team Member</span>
                          <div className="relative">
                            <select
                              value={tempEmployee}
                              onChange={(e) => setTempEmployee(e.target.value)}
                              className="w-full px-3 py-2.5 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-orange-500/20 outline-none transition-all text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-white"
                            >
                              <option value="All">All Members</option>
                              {employees.map((emp) => (
                                <option key={emp.id} value={emp.id}>
                                  {emp.employee_name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Column 3: Department */}
                        <div className="space-y-4">
                          <span className="text-[11px] font-bold text-gray-400 capitalize tracking-wider block mb-2 border-b pb-1">Department</span>
                          <div className="relative">
                            <select
                              value={tempDepartment}
                              onChange={(e) => setTempDepartment(e.target.value)}
                              className="w-full px-3 py-2.5 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-orange-500/20 outline-none transition-all text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-white"
                            >
                              <option value="All">All Departments</option>
                              {departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>
                                  {dept.department_name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Column 4: Designation */}
                        <div className="space-y-4">
                          <span className="text-[11px] font-bold text-gray-400 capitalize tracking-wider block mb-2 border-b pb-1">Designation</span>
                          <div className="relative">
                            <select
                              value={tempDesignation}
                              onChange={(e) => setTempDesignation(e.target.value)}
                              className="w-full px-3 py-2.5 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-orange-500/20 outline-none transition-all text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-white"
                            >
                              <option value="All">All Designations</option>
                              {designations.map((desig) => (
                                <option key={desig.id} value={desig.id}>
                                  {desig.designation_name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Column 5: Date Created */}
                        <div className="space-y-4">
                          <span className="text-[11px] font-bold text-gray-400 capitalize tracking-wider block mb-2 border-b pb-1">Date Created</span>
                          <div className="space-y-3">
                            <select
                              value={tempDateFilter}
                              onChange={(e) => setTempDateFilter(e.target.value)}
                              className="w-full px-3 py-2.5 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-orange-500/20 outline-none transition-all text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-white"
                            >
                              {["All", "Today", "Yesterday", "Last 7 Days", "This Month", "Custom"].map((option) => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Column 6: Custom Date Range (if Custom selected) */}
                        {tempDateFilter === "Custom" && (
                          <div className="space-y-4">
                            <span className="text-[11px] font-bold text-gray-400 capitalize tracking-wider block mb-2 border-b pb-1">Custom Range</span>
                            <div className="grid grid-cols-2 gap-2 animate-fadeIn">
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-gray-400 uppercase">From</label>
                                <input
                                  type="date"
                                  value={tempCustomStart}
                                  onChange={(e) => setTempCustomStart(e.target.value)}
                                  className="w-full px-2 py-1.5 border border-gray-200 rounded-sm text-[10px] outline-none focus:border-orange-500"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-gray-400 uppercase">To</label>
                                <input
                                  type="date"
                                  value={tempCustomEnd}
                                  onChange={(e) => setTempCustomEnd(e.target.value)}
                                  className="w-full px-2 py-1.5 border border-gray-200 rounded-sm text-[10px] outline-none focus:border-orange-500"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Filter Actions */}
                      <div className="p-4 bg-gray-50 border-t flex gap-3">
                        <button
                          onClick={() => setIsFilterOpen(false)}
                          className="flex-1 py-2.5 text-[11px] font-bold text-gray-500 capitalize tracking-wider hover:bg-gray-200 transition-colors rounded-sm border border-gray-200 bg-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            setStatusFilter(tempStatus);
                            setDateFilter(tempDateFilter);
                            setDepartmentFilter(tempDepartment);
                            setDesignationFilter(tempDesignation);
                            setEmployeeFilter(tempEmployee);
                            setCustomStart(tempCustomStart);
                            setCustomEnd(tempCustomEnd);
                            setIsFilterOpen(false);
                            setCurrentPage(1);
                          }}
                          className="flex-1 py-2.5 text-[11px] font-bold text-white capitalize tracking-wider bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all rounded-sm shadow-md active:scale-95"
                        >
                          Apply filters
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

                <ActionGuard permission="team_create" module="Team Management" type="create">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-6 py-3 rounded-sm font-bold transition shadow-lg hover:shadow-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700"
                  >
                    <PlusIcon size={20} />
                    Add Team
                  </button>
                </ActionGuard>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-8xl mx-auto p-4 pt-0 mt-2">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
            <NumberCard
              title="Total Team"
              number={totalItems || "0"}
              icon={<Users className="text-blue-600" size={24} />}
              iconBgColor="bg-blue-100"
              lineBorderClass="border-blue-500"
            />
            <NumberCard
              title="Avg Members"
              number={teamsData.length > 0 ? (teamsData.reduce((acc, t) => acc + (t.total_members || 0), 0) / teamsData.length).toFixed(1) : "0"}
              icon={<DollarSign className="text-green-600" size={24} />}
              iconBgColor="bg-green-100"
              lineBorderClass="border-green-500"
            />
            <NumberCard
              title="Active Teams"
              number={teamsData.filter(t => t.status === 'Active').length || "0"}
              icon={<Handshake className="text-orange-600" size={24} />}
              iconBgColor="bg-orange-100"
              lineBorderClass="border-orange-500"
            />
            <NumberCard
              title="Inactive Teams"
              number={teamsData.filter(t => t.status === 'Inactive').length || "0"}
              icon={<Target className="text-purple-600" size={24} />}
              iconBgColor="bg-purple-100"
              lineBorderClass="border-purple-500"
            />
          </div>

          {viewMode === "list" ? (
            <div className="overflow-x-auto mt-4 border border-gray-200 rounded-sm shadow-sm">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm">
                    <th className="py-3 px-4 font-semibold text-left border-b border-orange-400 w-[5%]">S.N</th>
                    <th className="py-3 px-4 font-semibold text-left border-b border-orange-400 w-[15%]">Team ID</th>
                    <th className="py-3 px-4 font-semibold text-left border-b border-orange-400 w-[25%]">Team Name</th>
                    <th className="py-3 px-4 font-semibold text-left border-b border-orange-400 w-[15%]">Total Members</th>
                    <th className="py-3 px-4 font-semibold text-left border-b border-orange-400 w-[15%]">Date Created</th>
                    <th className="py-3 px-4 font-semibold text-left border-b border-orange-400 w-[15%]">Status</th>
                    <th className="py-3 px-4 font-semibold text-right border-b border-orange-400 w-[10%]">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="7" className="py-20 text-center">
                        <div className="flex justify-center flex-col items-center gap-4">
                          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                          <p className="text-gray-500 font-semibold animate-pulse">Loading teams...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredTeams.length > 0 ? (
                    filteredTeams.map((team, index) => (
                      <tr
                        key={team.id}
                        className="border-t hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4 text-left">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>
                        <td className="py-3 px-4 font-medium text-orange-600 text-left">{team.team_id}</td>
                        <td className="py-3 px-4 font-semibold text-gray-800 text-left transition-all duration-300">
                          {team.team_name}
                        </td>
                        <td className="py-3 px-4 text-left">
                          <button
                            onClick={() => { setSelectedTeam(team); setShowMembersModal(true); }}
                            className="flex items-center gap-2 group hover:bg-orange-50 p-1 pr-3 rounded-sm transition-all border border-transparent hover:border-orange-100"
                          >
                            <div className="w-8 h-8 rounded-sm bg-orange-100 flex items-center justify-center text-orange-600 shadow-sm border border-orange-200 group-hover:scale-110 transition-transform">
                              <Users size={14} />
                            </div>
                            <span className="font-bold text-gray-700 group-hover:text-orange-600">{team.total_members || 0}</span>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-sm text-left">
                          {team.created_at ? new Date(team.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-left">
                          <span
                            className={`px-3 py-1 rounded-sm text-[10px] font-bold border uppercase tracking-wider ${team.status === "Active"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-red-50 text-red-700 border-red-200"
                              }`}
                          >
                            {team.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <ActionGuard permission="team_view" module="Team Management" type="read">
                              <button
                                onClick={() => { setSelectedTeam(team); setShowViewModal(true); }}
                                className="p-1 hover:bg-orange-100 rounded-sm transition-all text-blue-500 hover:text-blue-700"
                                title="View"
                              >
                                <Eye size={18} />
                              </button>
                            </ActionGuard>
                            <ActionGuard permission="team_edit" module="Team Management" type="update">
                              <button
                                onClick={() => { setSelectedTeam(team); setShowEditModal(true); }}
                                className="p-1 hover:bg-orange-100 rounded-sm transition-all text-green-500 hover:text-green-700"
                                title="Edit"
                              >
                                <Edit size={18} />
                              </button>
                            </ActionGuard>
                            <ActionGuard permission="team_delete" module="Team Management" type="delete">
                              <button
                                onClick={() => { setSelectedTeam(team); setShowDeleteModal(true); }}
                                className="p-1 hover:bg-orange-100 rounded-sm transition-all text-red-500 hover:text-red-700 font-bold shadow-sm"
                                title="Delete"
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
                      <td
                        colSpan="7"
                        className="py-12 text-center text-gray-500 font-medium text-sm"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <Users size={48} className="text-gray-200" />
                          <p className="mb-4">
                            {hasActiveFilters
                              ? "No teams found matching your filter criteria. Try clearing filters."
                              : "Your teams list is currently empty. Start building your team today!"}
                          </p>
                          {hasActiveFilters ? (
                            <button
                              onClick={clearAllFilters}
                              className="px-6 py-2 border-2 border-[#FF7B1D] text-[#FF7B1D] font-bold rounded-sm hover:bg-orange-50 transition-all text-xs uppercase tracking-wider"
                            >
                              Clear Filter
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setShowAddModal(true);
                              }}
                              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-sm hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2 font-semibold"
                            >
                              <Plus size={20} />
                              Create First Team
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <GenericGridView
              data={filteredTeams}
              renderItem={(team) => (
                <div key={team.id} className="bg-white border border-gray-200 rounded-sm shadow-sm hover:shadow-md transition-all relative group flex flex-col h-full overflow-hidden">
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <ActionGuard permission="team_view" module="Team Management" type="read">
                      <button
                        onClick={() => { setSelectedTeam(team); setShowViewModal(true); }}
                        className="p-1.5 rounded-sm bg-white shadow-sm border text-blue-500 border-blue-100 hover:bg-blue-50 transition-all font-bold"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                    </ActionGuard>
                    <ActionGuard permission="team_edit" module="Team Management" type="update">
                      <button
                        onClick={() => { setSelectedTeam(team); setShowEditModal(true); }}
                        className="p-1.5 text-green-500 hover:bg-green-50 rounded-sm bg-white shadow-sm border border-green-100 transition-all font-bold"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                    </ActionGuard>
                    <ActionGuard permission="team_delete" module="Team Management" type="delete">
                      <button
                        onClick={() => { setSelectedTeam(team); setShowDeleteModal(true); }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-sm bg-white shadow-sm border border-red-100 transition-all font-bold"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </ActionGuard>
                  </div>

                  <div className="p-6 pb-4 flex-1 flex flex-col items-center mt-2">
                    <div className="w-20 h-20 rounded-full border-4 border-orange-50 flex items-center justify-center overflow-hidden bg-orange-100 flex-shrink-0 shadow-inner">
                      <span className="text-orange-600 font-bold text-3xl">
                        {team.team_name?.substring(0, 1)}
                      </span>
                    </div>
                    <div className="mt-4 text-center">
                      <h3 className="font-bold text-gray-800 text-lg leading-tight line-clamp-1" title={team.team_name}>
                        {team.team_name}
                      </h3>
                      <p className="text-orange-500 text-[10px] font-black mt-1 tracking-widest uppercase bg-orange-50 px-2 py-0.5 rounded-full inline-block border border-orange-100">
                        {team.team_id}
                      </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                      {/* Optional: Add tags or badges for team types if available */}
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-sm border border-blue-100 uppercase tracking-tighter">Collaboration</span>
                      <span className="px-2 py-1 bg-purple-50 text-purple-600 text-[10px] font-bold rounded-sm border border-purple-100 uppercase tracking-tighter">Strategic</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-5 space-y-4 border-t border-gray-100 mt-auto">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">Members</p>
                        <button
                          onClick={() => { setSelectedTeam(team); setShowMembersModal(true); }}
                          className="text-lg font-black text-blue-700 hover:text-blue-800 hover:underline flex items-center justify-center gap-1 mx-auto"
                        >
                          <Users size={14} className="text-blue-400" />
                          {team.total_members || 0}
                        </button>
                      </div>
                      <div className="text-center p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">Created On</p>
                        <p className="text-[11px] font-bold text-gray-700 mt-1">
                          {team.created_at ? new Date(team.created_at).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-center pt-1">
                      <span
                        className={`px-4 py-1 text-[10px] font-black rounded-full uppercase tracking-widest border shadow-sm ${team.status === "Active"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-red-50 text-red-700 border-red-200"
                          }`}
                      >
                        {team.status}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            />
          )}

          {/* Pagination */}
          {totalPages > 0 && (
            <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4 bg-gray-50 p-4 rounded-sm border border-gray-200">
              <p className="text-sm font-semibold text-gray-700">
                Showing <span className="text-orange-600">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-orange-600">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="text-orange-600">{totalItems}</span> Teams
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-sm font-bold transition flex items-center gap-1 ${currentPage === 1
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
                    }`}
                >
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-10 h-10 rounded-sm font-bold transition ${currentPage === i + 1
                        ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-sm font-bold transition flex items-center gap-1 ${currentPage === totalPages
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-[#22C55E] text-white hover:opacity-90 shadow-md"
                    }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddTeamModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddTeam}
        isLoading={isCreating}
      />

      <EditTeamModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        teamId={selectedTeam?.id}
        onSubmit={handleUpdateTeam}
        isLoading={isUpdating}
      />

      <ViewTeamModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        teamId={selectedTeam?.id}
      />

      <DeleteTeamModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedTeam(null);
        }}
        teamId={selectedTeam?.id}
        teamName={selectedTeam?.team_name}
      />

      <TeamMembersModal
        isOpen={showMembersModal}
        onClose={() => {
          setShowMembersModal(false);
          setSelectedTeam(null);
        }}
        teamId={selectedTeam?.id}
      />
    </>
  );
}
