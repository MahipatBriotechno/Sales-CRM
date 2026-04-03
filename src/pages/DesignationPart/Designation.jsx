import React, { useState, useRef, useEffect } from "react";
import { FiHome } from "react-icons/fi";
import { Edit, Trash2, Eye, FileDown, Users, Warehouse, Handshake, Target, Plus, Search, Filter, X, LayoutGrid, List } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import ActionGuard from "../../components/common/ActionGuard";
import AddDesignationModal from "../../components/Designation/AddDesignationModal";
import EditDesignationModal from "../../components/Designation/EditDesignationModal";
import ViewDesignationModal from "../../components/Designation/ViewDesignationModal";
import DeleteDesignationModal from "../../components/Designation/DeleteDesignationModal";
import NumberCard from "../../components/NumberCard";
import { useGetDesignationsQuery } from "../../store/api/designationApi";
import { useGetHRMDashboardDataQuery } from "../../store/api/hrmDashboardApi";
import { useGetDepartmentsQuery } from "../../store/api/departmentApi";
import usePermission from "../../hooks/usePermission";
import GenericGridView from "../../components/common/GenericGridView";

const AllDesignation = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const [tempStatus, setTempStatus] = useState("All");
  const [tempDepartment, setTempDepartment] = useState("All");
  const [tempDateFilter, setTempDateFilter] = useState("All");
  const [tempCustomStart, setTempCustomStart] = useState("");
  const [tempCustomEnd, setTempCustomEnd] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [viewMode, setViewMode] = useState("list");
  const itemsPerPage = viewMode === "list" ? 7 : 12;

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDesignation, setSelectedDesignation] = useState(null);

  const { create, read, update, delete: remove } = usePermission("Designation Management");

  // RTK Query
  const { data, isLoading } = useGetDesignationsQuery({
    page: currentPage,
    limit: itemsPerPage,
    status: statusFilter,
    department_id: departmentFilter !== "All" ? departmentFilter : undefined,
    dateFrom: dateFilter === "Custom" ? customStart : undefined,
    dateTo: dateFilter === "Custom" ? customEnd : undefined,
    timeframe: dateFilter !== "Custom" ? dateFilter : undefined,
  });

  const { data: dashboardData, refetch: refetchDashboard } = useGetHRMDashboardDataQuery();
  const { data: departmentsData } = useGetDepartmentsQuery({ limit: 100 });
  const summary = dashboardData?.data?.summary;

  const designations = data?.designations || [];
  const pagination = data?.pagination || { totalPages: 1, total: 0 };

  const clearAllFilters = () => {
    setStatusFilter("All");
    setDepartmentFilter("All");
    setDateFilter("All");
    setCustomStart("");
    setCustomEnd("");
    setTempStatus("All");
    setTempDepartment("All");
    setTempDateFilter("All");
    setTempCustomStart("");
    setTempCustomEnd("");
    setCurrentPage(1);
  };

  const hasActiveFilters = statusFilter !== "All" || departmentFilter !== "All" || dateFilter !== "All";

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
    setCurrentPage((prev) => (prev < pagination.totalPages ? prev + 1 : prev));

  const handleView = (dsg) => {
    setSelectedDesignation(dsg);
    setIsViewModalOpen(true);
  };

  const handleEdit = (dsg) => {
    setSelectedDesignation(dsg);
    setIsEditModalOpen(true);
  };

  const handleDelete = (dsg) => {
    setSelectedDesignation(dsg);
    setIsDeleteModalOpen(true);
  };

  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const indexOfLastItem = Math.min(currentPage * itemsPerPage, pagination.total || 0);

  const getStatusClass = (status) =>
    status === "Active"
      ? "bg-green-50 text-green-700 border-green-200"
      : "bg-red-50 text-red-700 border-red-200";

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white">
        {/* Header Section */}
        <div className="bg-white sticky top-0 z-30">
          <div className="max-w-8xl mx-auto px-4 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 transition-all duration-300">Designation</h1>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                  <FiHome className="text-gray-700" size={14} />
                  <span className="text-gray-400"></span> HRM /{" "}
                  <span className="text-[#FF7B1D] font-medium">Designation</span>
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
                        setTempStatus(statusFilter);
                        setTempDepartment(departmentFilter);
                        setTempDateFilter(dateFilter);
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
                    <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-sm shadow-2xl z-50 animate-fadeIn overflow-hidden">
                      <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-800">Filter Options</span>
                        <button
                          onClick={() => {
                            setTempStatus("All");
                            setTempDepartment("All");
                            setTempDateFilter("All");
                            setTempCustomStart("");
                            setTempCustomEnd("");
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
                            {["All", "Active", "Inactive"].map((status) => (
                              <label key={status} className="flex items-center group cursor-pointer">
                                <div className="relative flex items-center">
                                  <input
                                    type="radio"
                                    name="dsg_status_filter"
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
                              <option value="All">All Departments</option>
                              {departmentsData?.departments?.map((dept) => (
                                <option key={dept.id} value={dept.id}>{dept.department_name}</option>
                              ))}
                            </select>
                          </div>

                          <span className="text-[11px] font-bold text-gray-400 capitalize tracking-wider block mb-2 border-b pb-1">Date Period</span>
                          <div className="space-y-3">
                            <select
                              value={tempDateFilter}
                              onChange={(e) => setTempDateFilter(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-orange-500/20 outline-none transition-all text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-white"
                            >
                              {["All", "Today", "Yesterday", "Last 7 Days", "Custom"].map((range) => (
                                <option key={range} value={range}>{range}</option>
                              ))}
                            </select>

                            {tempDateFilter === "Custom" && (
                              <div className="space-y-2 animate-fadeIn">
                                <input
                                  type="date"
                                  value={tempCustomStart}
                                  onChange={(e) => setTempCustomStart(e.target.value)}
                                  className="w-full px-2 py-1.5 border border-gray-200 rounded-sm text-[10px] outline-none focus:border-orange-500"
                                />
                                <input
                                  type="date"
                                  value={tempCustomEnd}
                                  onChange={(e) => setTempCustomEnd(e.target.value)}
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
                            setStatusFilter(tempStatus);
                            setDepartmentFilter(tempDepartment);
                            setDateFilter(tempDateFilter);
                            setCustomStart(tempCustomStart);
                            setCustomEnd(tempCustomEnd);
                            setIsFilterOpen(false);
                            setCurrentPage(1);
                          }}
                          className="flex-1 py-2 text-[11px] font-bold text-white capitalize tracking-wider bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all rounded-sm shadow-md"
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

                <ActionGuard permission="designation_create" module="Designation Management" type="create">
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 rounded-sm font-semibold transition shadow-lg hover:shadow-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700"
                  >
                    <Plus size={20} />
                    Add Designation
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
              title="Total Employees"
              number={summary?.totalEmployees?.value || "-"}
              icon={<Users className="text-blue-600" size={24} />}
              iconBgColor="bg-blue-100"
              lineBorderClass="border-blue-500"
            />
            <NumberCard
              title="Departments"
              number={summary?.totalDepartments?.value || "-"}
              icon={<Warehouse className="text-green-600" size={24} />}
              iconBgColor="bg-green-100"
              lineBorderClass="border-green-500"
            />
            <NumberCard
              title="Designations"
              number={summary?.totalDesignations?.value || "-"}
              icon={<Handshake className="text-orange-600" size={24} />}
              iconBgColor="bg-orange-100"
              lineBorderClass="border-orange-500"
            />
            <NumberCard
              title="Total Status"
              number={"2"}
              icon={<Target className="text-purple-600" size={24} />}
              iconBgColor="bg-purple-100"
              lineBorderClass="border-purple-500"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center flex-col items-center gap-4 py-32">
              <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
              <p className="text-gray-500 font-semibold animate-pulse">Loading designations...</p>
            </div>
          ) : designations.length > 0 ? (
            viewMode === "list" ? (
              <div className="overflow-x-auto border border-gray-200 rounded-sm shadow-sm mt-4">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm">
                      <th className="py-3 px-4 font-semibold text-left border-b border-orange-400">S.N</th>
                      <th className="py-3 px-4 font-semibold text-center border-b border-orange-400">Icon</th>
                      <th className="py-3 px-4 font-semibold text-left border-b border-orange-400">Desig ID</th>
                      <th className="py-3 px-4 font-semibold text-left border-b border-orange-400">Designation Name</th>
                      <th className="py-3 px-4 font-semibold text-left border-b border-orange-400">Description</th>
                      <th className="py-3 px-4 font-semibold text-left border-b border-orange-400">Department</th>
                      <th className="py-3 px-4 font-semibold text-center border-b border-orange-400">Employees</th>
                      <th className="py-3 px-4 font-semibold text-center border-b border-orange-400">Status</th>
                      <th className="py-3 px-4 font-semibold text-right border-b border-orange-400">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {designations.map((dsg, index) => (
                      <tr key={dsg.id} className="border-t hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-gray-700">{indexOfFirstItem + index + 1}</td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center">
                            {dsg.image_url ? (
                              <img src={dsg.image_url} alt="" className="w-10 h-10 rounded-full border border-orange-200 object-cover shadow-sm" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold border border-orange-200 shadow-sm">
                                {dsg.designation_name?.substring(0, 1)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-orange-600 font-bold">{dsg.designation_id}</td>
                        <td className="py-3 px-4 text-gray-800 font-semibold">
                          <div className="truncate max-w-[250px]" title={dsg.designation_name}>
                            {dsg.designation_name}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          <div className="truncate max-w-[300px] cursor-pointer" title={dsg.description}>
                            {dsg.description || "---"}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-700 font-medium">{dsg.department_name}</td>
                        <td className="py-3 px-4 text-center font-bold text-gray-700">{dsg.employee_count}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-sm border ${getStatusClass(dsg.status)}`}>
                            {dsg.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <ActionGuard permission="designation_view" module="Designation Management" type="read">
                              <button
                                onClick={() => handleView(dsg)}
                                className="p-1 hover:bg-orange-100 rounded-sm text-blue-500 hover:text-blue-700 transition-all font-medium"
                                title="View"
                              >
                                <Eye size={18} />
                              </button>
                            </ActionGuard>
                            <ActionGuard permission="designation_edit" module="Designation Management" type="update">
                              <button
                                onClick={() => handleEdit(dsg)}
                                className="p-1 hover:bg-orange-100 rounded-sm text-green-500 hover:text-green-700 transition-all font-medium"
                                title="Edit"
                              >
                                <Edit size={18} />
                              </button>
                            </ActionGuard>
                            <ActionGuard permission="designation_delete" module="Designation Management" type="delete">
                              <button
                                onClick={() => handleDelete(dsg)}
                                className="p-1 hover:bg-orange-100 rounded-sm text-red-500 hover:text-red-700 transition-all font-medium"
                                title="Delete"
                              >
                                <Trash2 size={18} />
                              </button>
                            </ActionGuard>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <GenericGridView
                data={designations}
                renderItem={(dsg) => (
                  <div key={dsg.id} className="bg-white border border-gray-200 rounded-sm shadow-sm hover:shadow-md transition-all relative group flex flex-col h-full overflow-hidden">
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <ActionGuard permission="designation_view" module="Designation Management" type="read">
                        <button
                          onClick={() => handleView(dsg)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-sm bg-white shadow-sm border border-blue-100"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                      </ActionGuard>
                      <ActionGuard permission="designation_edit" module="Designation Management" type="update">
                        <button
                          onClick={() => handleEdit(dsg)}
                          className="p-1.5 text-green-500 hover:bg-green-50 rounded-sm bg-white shadow-sm border border-green-100"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                      </ActionGuard>
                      <ActionGuard permission="designation_delete" module="Designation Management" type="delete">
                        <button
                          onClick={() => handleDelete(dsg)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-sm bg-white shadow-sm border border-red-100"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </ActionGuard>
                    </div>

                    <div className="p-6 pb-4 flex-1 flex flex-col items-center mt-2">
                      <div className="w-20 h-20 rounded-full border-4 border-orange-50 flex items-center justify-center overflow-hidden bg-orange-100 flex-shrink-0 shadow-inner">
                        {dsg.image_url ? (
                          <img src={dsg.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-orange-600 font-bold text-3xl">
                            {dsg.designation_name?.substring(0, 1)}
                          </div>
                        )}
                      </div>
                      <div className="mt-4 text-center">
                        <h3 className="font-bold text-gray-800 text-lg leading-tight line-clamp-1" title={dsg.designation_name}>
                          {dsg.designation_name}
                        </h3>
                        <p className="text-orange-500 text-[10px] font-black mt-1 tracking-widest uppercase bg-orange-50 px-2 py-0.5 rounded-full inline-block border border-orange-100">
                          {dsg.designation_id}
                        </p>
                      </div>

                      <p className="text-sm text-gray-500 mt-4 line-clamp-2 min-h-[40px] px-2 text-center italic">
                        {dsg.description || "No description provided for this designation."}
                      </p>
                    </div>

                    <div className="bg-gray-50 p-5 space-y-4 border-t border-gray-100 mt-auto">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                          <p className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">Department</p>
                          <p className="text-xs font-bold text-gray-800 truncate px-1">{dsg.department_name}</p>
                        </div>
                        <div className="text-center p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                          <p className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">Employees</p>
                          <p className="text-lg font-black text-gray-800">{dsg.employee_count || 0}</p>
                        </div>
                      </div>

                      <div className="flex justify-center pt-1">
                        <span
                          className={`px-4 py-1 text-[10px] font-black rounded-full uppercase tracking-widest border shadow-sm ${dsg.status === "Active"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-700 border-red-200"
                            }`}
                        >
                          {dsg.status}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              />
            )
          ) : (
            <div className="text-center py-24 bg-white rounded-sm border-2 border-dashed border-gray-100 mt-6">
              <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Handshake className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 font-primary">
                {hasActiveFilters ? "No matches found" : "No designations found"}
              </h3>
              <p className="text-gray-500 max-w-xs mx-auto text-sm font-primary mb-6">
                {hasActiveFilters
                  ? "We couldn't find any designations matching your current filters. Try expanding your search!"
                  : "Your designation list is currently empty. Start by creating your first designation today!"}
              </p>
              {hasActiveFilters ? (
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-2 border-2 border-[#FF7B1D] text-[#FF7B1D] font-bold rounded-sm hover:bg-orange-50 transition-all text-xs uppercase tracking-wider"
                >
                  Clear Filter
                </button>
              ) : (
                <ActionGuard permission="designations_create" module="Designation" type="create">
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-sm hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2 font-semibold"
                  >
                    <Plus size={20} />
                    Create First Designation
                  </button>
                </ActionGuard>
              )}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 0 && (
            <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4 bg-gray-50 p-4 rounded-sm border border-gray-200 shadow-sm">
              <p className="text-sm font-semibold text-gray-700">
                Showing <span className="text-orange-600 font-bold">{indexOfFirstItem + 1}</span> to <span className="text-orange-600 font-bold">{indexOfLastItem}</span> of <span className="text-orange-600 font-bold">{pagination.total}</span> Designations
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-sm font-bold transition flex items-center gap-1 ${currentPage === 1
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed border-gray-300 shadow-sm"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
                    }`}
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-10 h-10 rounded-sm font-bold transition border ${currentPage === pageNum
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md border-orange-500"
                          : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={handleNext}
                  disabled={currentPage === pagination.totalPages}
                  className={`px-4 py-2 rounded-sm font-bold transition flex items-center gap-1 ${currentPage === pagination.totalPages
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed border-gray-300 shadow-sm"
                    : "bg-[#22C55E] text-white hover:opacity-90 shadow-md transition-all"
                    }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        <AddDesignationModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          refetchDashboard={refetchDashboard}
        />
        <EditDesignationModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedDesignation(null);
          }}
          designation={selectedDesignation}
          refetchDashboard={refetchDashboard}
        />
        <ViewDesignationModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedDesignation(null);
          }}
          designation={selectedDesignation}
        />
        <DeleteDesignationModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedDesignation(null);
          }}
          designationId={selectedDesignation?.id}
          designationName={selectedDesignation?.designation_name}
          refetchDashboard={refetchDashboard}
        />
      </div>
    </DashboardLayout>
  );
};

export default AllDesignation;
