import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiHome, FiGrid } from "react-icons/fi";
import DashboardLayout from "../../components/DashboardLayout";
import ActionGuard from "../../components/common/ActionGuard";
import {
  Eye,
  Edit,
  Trash2,
  Plus,
  List,
  Warehouse,
  Users,
  Handshake,
  Target,
  Filter,
  X,
  ChevronDown,
  LayoutGrid,
} from "lucide-react";
import AddEmployeeModal from "../../components/Employee/AddEmployeeModal";
import EditEmployeeModal from "../../components/Employee/EditEmployeeModal";
import DeleteEmployeeModal from "../../components/Employee/DeleteEmployeeModal";
import EmployeeGridView from "../../pages/EmployeePart/EmployeeGridView";
import NumberCard from "../../components/NumberCard";
import { useGetEmployeesQuery } from "../../store/api/employeeApi";
import { useGetDepartmentsQuery } from "../../store/api/departmentApi";
import { useGetDesignationsQuery } from "../../store/api/designationApi";
import usePermission from "../../hooks/usePermission";

const AllEmployee = () => {
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("list");
  const itemsPerPage = viewMode === "list" ? 7 : 12;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { create, read, update, delete: remove } = usePermission("Employee Management");

  const navigate = useNavigate();

  const { data, isLoading } = useGetEmployeesQuery({
    page: currentPage,
    limit: itemsPerPage,
    status: statusFilter,
    search: searchTerm,
  });

  const { data: deptData } = useGetDepartmentsQuery({ limit: 1 });
  const { data: dsgData } = useGetDesignationsQuery({ limit: 1 });

  const employees = data?.employees || [];
  const pagination = data?.pagination || { totalPages: 1, total: 0 };
  const totalDepts = deptData?.pagination?.total || 0;
  const totalDsgs = dsgData?.pagination?.total || 0;

  const handlePageChange = (page) => setCurrentPage(page);
  const handlePrev = () => setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
  const handleNext = () => setCurrentPage((prev) => (prev < pagination.totalPages ? prev + 1 : prev));

  const handleEdit = (emp) => {
    setSelectedEmployee(emp);
    setIsEditModalOpen(true);
  };

  const handleView = (emp, options = {}) => {
    navigate(`/employee-profile/${emp.id}`, { state: { monitor: options.monitor, type: options.type } });
  };

  const handleDelete = (emp) => {
    setSelectedEmployee(emp);
    setIsDeleteModalOpen(true);
  };

  const clearAllFilters = () => {
    setStatusFilter("All");
    setDateFilter("All");
    setCustomStart("");
    setCustomEnd("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const hasActiveFilters = statusFilter !== "All" || dateFilter !== "All" || searchTerm !== "";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getStatusClass = (status) => {
    switch (status) {
      case "Active": return "bg-green-50 text-green-700 border-green-200";
      case "Terminate": return "bg-red-50 text-red-700 border-red-200";
      case "Resign": return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "Blocked": return "bg-gray-100 text-gray-700 border-gray-300";
      case "Hold": return "bg-blue-50 text-blue-700 border-blue-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const indexOfLastItem = Math.min(currentPage * itemsPerPage, pagination.total || 0);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white">
        {/* Header Section */}
        <div className="bg-white sticky top-0 z-30">
          <div className="max-w-8xl mx-auto px-4 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 transition-all duration-300">Employee</h1>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                  <FiHome className="text-gray-700" size={14} />
                  <span className="text-gray-400"></span> HRM /{" "}
                  <span className="text-[#FF7B1D] font-medium">
                    All Employees
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
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 animate-fadeIn overflow-hidden">
                      <div className="max-h-96 overflow-y-auto">
                        {/* Status Section */}
                        <div className="p-3 border-b border-gray-100 bg-gray-50">
                          <span className="text-sm font-bold text-gray-700 tracking-wide">status</span>
                        </div>
                        <div className="py-1">
                          {["All", "Active", "Terminate", "Resign", "Blocked", "Hold"].map((status) => (
                            <button
                              key={status}
                              onClick={() => {
                                setStatusFilter(status);
                                setIsFilterOpen(false);
                                setCurrentPage(1);
                              }}
                              className={`block w-full text-left px-4 py-2 text-sm transition-colors ${statusFilter === status
                                ? "bg-orange-50 text-orange-600 font-bold"
                                : "text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>

                        {/* Date Range Section */}
                        <div className="p-3 border-t border-b border-gray-100 bg-gray-50">
                          <span className="text-sm font-bold text-gray-700 tracking-wide">dateJoined</span>
                        </div>
                        <div className="py-1">
                          {["All", "Today", "Yesterday", "Last 7 Days", "This Month", "Custom"].map((option) => (
                            <div key={option}>
                              <button
                                onClick={() => {
                                  setDateFilter(option);
                                  if (option !== "Custom") {
                                    setIsFilterOpen(false);
                                    setCurrentPage(1);
                                  }
                                }}
                                className={`block w-full text-left px-4 py-2 text-sm transition-colors ${dateFilter === option
                                  ? "bg-orange-50 text-orange-600 font-bold"
                                  : "text-gray-700 hover:bg-gray-50"
                                  }`}
                              >
                                {option}
                              </button>
                              {option === "Custom" && dateFilter === "Custom" && (
                                <div className="px-4 py-3 space-y-2 border-t border-gray-50 bg-gray-50/50">
                                  <input
                                    type="date"
                                    value={customStart}
                                    onChange={(e) => setCustomStart(e.target.value)}
                                    className="w-full px-2 py-2 border border-gray-300 rounded-sm text-xs focus:ring-1 focus:ring-orange-500 outline-none"
                                  />
                                  <input
                                    type="date"
                                    value={customEnd}
                                    onChange={(e) => setCustomEnd(e.target.value)}
                                    className="w-full px-2 py-2 border border-gray-300 rounded-sm text-xs focus:ring-1 focus:ring-orange-500 outline-none"
                                  />
                                  <button
                                    onClick={() => { setIsFilterOpen(false); setCurrentPage(1); }}
                                    className="w-full bg-[#FF7B1D] text-white text-[10px] font-bold py-2 rounded-sm uppercase"
                                  >
                                    Apply
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
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

                <ActionGuard permission="employee_create" module="Employee Management" type="create">
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 rounded-sm font-semibold transition shadow-lg hover:shadow-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700"
                  >
                    <Plus size={20} />
                    Add Employee
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
              title="Total Employees"
              number={pagination.total.toString()}
              icon={<Users className="text-blue-600" size={24} />}
              iconBgColor="bg-blue-100"
              lineBorderClass="border-blue-500"
            />
            <NumberCard
              title="Departments"
              number={totalDepts.toString()}
              icon={<Warehouse className="text-green-600" size={24} />}
              iconBgColor="bg-green-100"
              lineBorderClass="border-green-500"
            />
            <NumberCard
              title="Designations"
              number={totalDsgs.toString()}
              icon={<Handshake className="text-orange-600" size={24} />}
              iconBgColor="bg-orange-100"
              lineBorderClass="border-orange-500"
            />
            <NumberCard
              title="Active Now"
              number={employees.filter(e => e.status === 'Active').length.toString()}
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
                    <th className="py-3 px-4 font-semibold text-center border-b border-orange-400 w-[8%]">Profile</th>
                    <th className="py-3 px-4 font-semibold text-left border-b border-orange-400 w-[10%]">Emp ID</th>
                    <th className="py-3 px-4 font-semibold text-left border-b border-orange-400 w-[20%]">Employee Name</th>
                    <th className="py-3 px-4 font-semibold text-left border-b border-orange-400 w-[15%]">Department</th>
                    <th className="py-3 px-4 font-semibold text-left border-b border-orange-400 w-[15%]">Profile Completion</th>
                    <th className="py-3 px-4 font-semibold text-center border-b border-orange-400 w-[12%]">Status</th>
                    <th className="py-3 px-4 font-semibold text-right border-b border-orange-400 w-[15%]">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {isLoading ? (
                    <tr>
                      <td colSpan="8" className="py-20 text-center">
                        <div className="flex justify-center flex-col items-center gap-4">
                          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                          <p className="text-gray-500 font-semibold">Loading employees...</p>
                        </div>
                      </td>
                    </tr>
                  ) : employees.length > 0 ? (
                    employees.map((emp, index) => (
                      <tr key={emp.id} className="border-t hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-left">{indexOfFirstItem + index + 1}</td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center">
                            {emp.profile_picture_url ? (
                              <img src={emp.profile_picture_url} alt="" className="w-8 h-8 rounded-full border border-orange-200 object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold border border-orange-200">
                                {emp.employee_name?.substring(0, 1)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-left font-bold text-orange-600 cursor-pointer hover:underline" onClick={() => navigate(`/employee-profile/${emp.id}`)}>
                          {emp.employee_id}
                        </td>
                        <td className="py-3 px-4 text-left font-semibold text-gray-800">{emp.employee_name}</td>
                        <td className="py-3 px-4 text-left text-gray-600">{emp.department_name}</td>
                        <td className="py-3 px-4 text-left">
                          {(() => {
                            const essentialFields = [
                              'gender', 'father_name', 'mother_name', 'marital_status',
                              'permanent_address_l1', 'permanent_city', 'permanent_state', 'permanent_country', 'permanent_pincode',
                              'aadhar_number', 'pan_number', 'aadhar_front', 'aadhar_back', 'pan_card',
                              'ifsc_code', 'account_number', 'account_holder_name', 'branch_name'
                            ];
                            const completed = essentialFields.filter(f => emp[f] && emp[f] !== 'null' && emp[f] !== '');
                            const percent = Math.round((completed.length / essentialFields.length) * 100);
                            return (
                              <div className="flex flex-col gap-1 w-full max-w-[100px]">
                                <div className="flex justify-between text-[10px] font-bold">
                                  <span className="text-gray-500">{percent}%</span>
                                  <span className={percent === 100 ? "text-green-600" : "text-orange-600"}>
                                    {percent === 100 ? "Complete" : "Pending"}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-700 ${percent === 100 ? "bg-green-500" : "bg-[#FF7B1D]"}`}
                                    style={{ width: `${percent}%` }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-sm border ${getStatusClass(emp.status)}`}>
                            {emp.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <ActionGuard permission="employee_view_all" module="Employee Management" type="read">
                              <button onClick={() => handleView(emp)} className="p-1 hover:bg-orange-100 rounded-sm text-blue-500 hover:text-blue-700 transition-all" title="View Profile">
                                <Eye size={18} />
                              </button>
                            </ActionGuard>
                            <ActionGuard permission="employee_edit" module="Employee Management" type="update">
                              <button onClick={() => handleEdit(emp)} className="p-1 hover:bg-orange-100 rounded-sm text-green-500 hover:text-green-700 transition-all" title="Edit">
                                <Edit size={18} />
                              </button>
                            </ActionGuard>
                            <ActionGuard permission="employee_delete" module="Employee Management" type="delete">
                              <button onClick={() => handleDelete(emp)} className="p-1 hover:bg-orange-100 rounded-sm text-red-500 hover:text-red-700 transition-all" title="Delete">
                                <Trash2 size={18} />
                              </button>
                            </ActionGuard>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Users size={48} className="text-gray-200" />
                          <p className="text-gray-500 font-medium">No employees found matching your criteria.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <EmployeeGridView employees={employees} onEdit={handleEdit} onDelete={handleDelete} onView={handleView} />
          )}

          {/* Pagination */}
          {pagination.totalPages > 0 && (
            <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4 bg-gray-50 p-4 rounded-sm border border-gray-200">
              <p className="text-sm font-semibold text-gray-700">
                Showing <span className="text-orange-600 font-bold">{indexOfFirstItem + 1}</span> to <span className="text-orange-600 font-bold">{indexOfLastItem}</span> of <span className="text-orange-600 font-bold">{pagination.total}</span> Employees
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
                  {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-10 h-10 rounded-sm font-bold transition ${currentPage === pageNum
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md"
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
                  disabled={currentPage === pagination.totalPages}
                  className={`px-4 py-2 rounded-sm font-bold transition flex items-center gap-1 ${currentPage === pagination.totalPages
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

        {/* Modals */}
        <AddEmployeeModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
        <EditEmployeeModal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setSelectedEmployee(null); }} employee={selectedEmployee} />
        <DeleteEmployeeModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedEmployee(null);
          }}
          employeeId={selectedEmployee?.id}
          employeeName={selectedEmployee?.employee_name}
        />
      </div>
    </DashboardLayout>
  );
};

export default AllEmployee;
