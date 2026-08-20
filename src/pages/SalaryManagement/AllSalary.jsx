import React, { useState, useRef, useEffect, useMemo } from "react";
import { FiHome } from "react-icons/fi";
import DashboardLayout from "../../components/DashboardLayout";
import {
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  Plus,
  Filter,
  Download,
  Edit,
  Trash2,
  Eye,
  X,
  Pencil,
  Calculator,
  Search,
} from "lucide-react";
import toast from 'react-hot-toast';

import {
  useGetAllSalariesQuery,
  useCreateSalaryMutation,
  useDeleteSalaryMutation,
  useUpdateSalaryMutation,
} from "../../store/api/salaryApi";
import AddSalaryModal from "../../components/SalaryManagement/AddSalaryModal";
import DeleteSalaryModal from "../../components/SalaryManagement/DeleteSalaryModal";
import ViewSalaryModal from "../../components/SalaryManagement/ViewSalaryModal";
import EditSalaryModal from "../../components/SalaryManagement/EditSalaryModal";
import GenerateSalaryModal from "../../components/SalaryManagement/GenerateSalaryModal";
import usePermission from "../../hooks/usePermission";
import { useGetDepartmentsQuery } from "../../store/api/departmentApi";
import { useGetDesignationsQuery } from "../../store/api/designationApi";
import NumberCard from "../../components/NumberCard";

export default function SalaryManagement() {
  /* ================= STATES ================= */
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedDesignation, setSelectedDesignation] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ state: "All", start: "", end: "" });
  const [showAddModal, setShowAddModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [ViewModalOpen, setViewModalOpen] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSalaryId, setSelectedSalaryId] = useState(null);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Temp states for filter modal
  const [tempStatus, setTempStatus] = useState("all");
  const [tempDept, setTempDept] = useState("all");
  const [tempDesig, setTempDesig] = useState("all");
  const [tempDateRange, setTempDateRange] = useState({ state: "All", start: "", end: "" });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { create, read, update, delete: remove } = usePermission("Payroll");

  /* ================= API ================= */
  const queryParams = useMemo(() => {
    let startDate = "";
    let endDate = "";

    if (dateRange.state !== "All") {
      const today = new Date();
      const formatDate = (date) => date.toISOString().split('T')[0];

      if (dateRange.state === "Today") {
        startDate = formatDate(today);
        endDate = formatDate(today);
      } else if (dateRange.state === "Yesterday") {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        startDate = formatDate(yesterday);
        endDate = formatDate(yesterday);
      } else if (dateRange.state === "Last 7 Days") {
        const last7 = new Date(today);
        last7.setDate(today.getDate() - 7);
        startDate = formatDate(last7);
        endDate = formatDate(today);
      } else if (dateRange.state === "Custom") {
        startDate = dateRange.start;
        endDate = dateRange.end;
      }
    }

    return {
      department: selectedDepartment === "all" ? "" : selectedDepartment,
      designation: selectedDesignation === "all" ? "" : selectedDesignation,
      status: selectedStatus === "all" ? "" : selectedStatus,
      search: searchTerm,
      startDate,
      endDate,
      page: currentPage,
      limit: itemsPerPage,
    };
  }, [selectedDepartment, selectedDesignation, selectedStatus, searchTerm, dateRange, currentPage, itemsPerPage]);

  const { data, isLoading: salariesLoading } = useGetAllSalariesQuery(queryParams);

  const { data: deptData } = useGetDepartmentsQuery({ limit: 100 });
  const departments = deptData?.departments || [];

  const { data: desigData } = useGetDesignationsQuery({ limit: 100 });
  const designations = desigData?.designations || [];

  const salaries = Array.isArray(data?.salaries) ? data.salaries : [];
  const pagination = data?.pagination || { total: 0, totalPages: 1 };
  const stats = data?.stats || { total_payroll: 0, total_paid: 0, total_pending: 0 };

  const [createSalary, { isLoading: creating }] = useCreateSalaryMutation();
  const [deleteSalary] = useDeleteSalaryMutation();
  const [updateSalary, { isLoading: updating }] =
    useUpdateSalaryMutation();

  /* ================= CALCULATIONS ================= */
  const totalPayroll = stats.total_payroll;
  const totalPaid = stats.total_paid;
  const totalPending = stats.total_pending;

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toISOString().split("T")[0];
  };

  /* ================= HANDLERS ================= */
  const handleSubmitSalary = async (payload) => {
    try {
      await createSalary(payload).unwrap();
      toast.success("Salary added successfully");
      setShowAddModal(false);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create salary");
    }
  };

  const handleUpdateSalary = async (id, data) => {
    return await updateSalary({ id, data }).unwrap();
  };

  const getStatusClass = (status) =>
    status === "paid"
      ? "bg-green-50 text-green-700 border-green-200"
      : "bg-orange-50 text-orange-700 border-orange-200";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const clearAllFilters = () => {
    setSelectedDepartment("all");
    setSelectedDesignation("all");
    setSelectedStatus("all");
    setSearchTerm("");
    setDateRange({ state: "All", start: "", end: "" });
    setIsFilterOpen(false);
  };

  const hasActiveFilters = selectedDepartment !== "all" || selectedDesignation !== "all" || selectedStatus !== "all" || dateRange.state !== "All" || searchTerm !== "";

  /* ================= EXPORT FUNCTION ================= */
  const handleExport = async () => {
    if (!salaries.length) return toast.error("No salaries to export");

    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF('l', 'mm', 'a4');

      doc.setFillColor(255, 123, 29);
      doc.rect(0, 0, 297, 15, 'F');

      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text("SALARY MANAGEMENT REPORT", 148.5, 10, { align: 'center' });

      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.setFont(undefined, 'normal');

      const reportDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      doc.text(`Generated on: ${reportDate}`, 14, 27);
      doc.text(`Total Records: ${pagination.total}`, 14, 32);

      doc.text(`Page Payroll: Rs.${Math.round(totalPayroll).toLocaleString('en-IN')}`, 90, 27);
      doc.text(`Paid: Rs.${Math.round(totalPaid).toLocaleString('en-IN')}`, 90, 32);

      doc.text(`Pending: Rs.${Math.round(totalPending).toLocaleString('en-IN')}`, 160, 27);
      doc.text(`Filter: ${selectedDepartment === 'all' ? 'All Departments' : selectedDepartment}`, 160, 32);

      const tableData = salaries.map((s, index) => {
        const netSalary = Number(s.net_salary) || 0;

        return [
          ((currentPage - 1) * itemsPerPage + index + 1).toString(),
          s.employee_name || "-",
          s.designation || "-",
          s.department || "-",
          Math.round(netSalary).toLocaleString('en-IN'),
          (s.status || "pending").toUpperCase(),
          s.pay_date ? new Date(s.pay_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : "-",
        ];
      });

      autoTable(doc, {
        head: [["#", "Employee Name", "Designation", "Department", "Net Salary", "Status", "Pay Date"]],
        body: tableData,
        startY: 38,
        theme: 'grid',
        headStyles: {
          fillColor: [255, 123, 29],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle',
          cellPadding: 4,
        },
        styles: {
          fontSize: 8,
          cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10, fontStyle: 'bold' },
          1: { halign: 'left', cellWidth: 50 },
          2: { halign: 'left', cellWidth: 45 },
          3: { halign: 'left', cellWidth: 45 },
          4: { halign: 'right', cellWidth: 40, fontStyle: 'bold', textColor: [255, 123, 29] },
          5: { halign: 'center', cellWidth: 30 },
          6: { halign: 'center', cellWidth: 40 },
        },
        alternateRowStyles: {
          fillColor: [252, 252, 252],
        },
        didParseCell: function (data) {
          if (data.column.index === 5 && data.section === 'body') {
            const status = data.cell.raw;
            if (status === 'PAID') {
              data.cell.styles.textColor = [34, 197, 94];
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [240, 253, 244];
            } else {
              data.cell.styles.textColor = [255, 123, 29];
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [255, 247, 237];
            }
          }
        },
      });

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${pageCount}`, 148.5, 205, { align: 'center' });
        doc.text('© Sales CRM - Salary Management System', 148.5, 209, { align: 'center' });
      }

      const fileName = `Salary_Report_${selectedDepartment === 'all' ? 'All' : selectedDepartment}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  const handleMarkAsPaid = async (salaryId) => {
    try {
      await updateSalary({
        id: salaryId,
        data: { status: "paid" },
      }).unwrap();
      toast.success("Marked as paid");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to mark salary as paid");
    }
  };

  /* ================= UI ================= */
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white">
        {/* Header Section */}
        <div className="bg-white sticky top-0 z-30">
          <div className="max-w-8xl mx-auto px-4 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Payroll Management</h1>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                  <FiHome className="text-gray-400" />
                  <span>HRM</span>
                  <span>/</span>
                  <span className="text-[#FF7B1D] font-medium">All Payrolls</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Search Bar */}
                {/* <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search payrolls..."
                    className="pl-10 pr-4 py-3 border border-gray-300 rounded-sm w-64 focus:border-orange-500 outline-none text-sm font-medium transition-all"
                  />
                </div> */}

                {/* Unified Filter Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => {
                      if (hasActiveFilters) {
                        clearAllFilters();
                      } else {
                        setTempStatus(selectedStatus);
                        setTempDept(selectedDepartment);
                        setTempDesig(selectedDesignation);
                        setTempDateRange(dateRange);
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
                    <div className="absolute right-0 mt-2 w-[600px] bg-white border border-gray-200 rounded-sm shadow-2xl z-50 animate-fadeIn overflow-hidden">
                      {/* Header */}
                      <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-800 tracking-wide uppercase">Advanced Filters</span>
                        <button
                          onClick={() => {
                            setTempStatus("all");
                            setTempDept("all");
                            setTempDesig("all");
                            setTempDateRange({ state: "All", start: "", end: "" });
                          }}
                          className="text-[10px] font-bold text-orange-600 hover:underline hover:text-orange-700 capitalize"
                        >
                          Reset all
                        </button>
                      </div>

                      <div className="p-5 grid grid-cols-2 gap-x-10 gap-y-8">
                        {/* Status Filter */}
                        <div className="space-y-4">
                          <span className="text-[11px] font-bold text-gray-400 capitalize tracking-wider block mb-2 border-b pb-1">Payment Status</span>
                          <div className="grid grid-cols-2 gap-2">
                            {["all", "paid", "pending"].map((s) => (
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
                                <span className={`ml-3 text-xs font-medium transition-colors capitalize ${tempStatus === s ? "text-[#FF7B1D] font-bold" : "text-gray-600 group-hover:text-gray-900"}`}>
                                  {s}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Date Period */}
                        <div className="space-y-4">
                          <span className="text-[11px] font-bold text-gray-400 capitalize tracking-wider block mb-2 border-b pb-1">Date Period</span>
                          <div className="space-y-3">
                            <select
                              value={tempDateRange.state}
                              onChange={(e) => setTempDateRange({ ...tempDateRange, state: e.target.value })}
                              className="w-full px-3 py-2.5 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-orange-500/20 outline-none transition-all text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-white"
                            >
                              {["All", "Today", "Yesterday", "Last 7 Days", "Custom"].map((range) => (
                                <option key={range} value={range}>{range}</option>
                              ))}
                            </select>

                            {tempDateRange.state === "Custom" && (
                              <div className="grid grid-cols-2 gap-2 animate-fadeIn">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-gray-400 uppercase">From</label>
                                  <input
                                    type="date"
                                    value={tempDateRange.start}
                                    onChange={(e) => setTempDateRange({ ...tempDateRange, start: e.target.value })}
                                    className="w-full px-2 py-1.5 border border-gray-200 rounded-sm text-[10px] outline-none focus:border-orange-500"
                                  />
                                </div>
                                <div className="flex items-center gap-2 mb-4 sm:mb-0">
                                  <span className="text-sm font-medium text-gray-700">Filter By:</span>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-gray-400 uppercase">To</label>
                                  <input
                                    type="date"
                                    value={tempDateRange.end}
                                    onChange={(e) => setTempDateRange({ ...tempDateRange, end: e.target.value })}
                                    className="w-full px-2 py-1.5 border border-gray-200 rounded-sm text-[10px] outline-none focus:border-orange-500"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Department Filter */}
                        <div className="space-y-4">
                          <span className="text-[11px] font-bold text-gray-400 capitalize tracking-wider block mb-2 border-b pb-1">Department</span>
                          <select
                            value={tempDept}
                            onChange={(e) => setTempDept(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-orange-500/20 outline-none transition-all text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-white"
                          >
                            <option value="all">All Departments</option>
                            {departments.map((dept) => (
                              <option key={dept.id} value={dept.department_name}>{dept.department_name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Designation Filter */}
                        <div className="space-y-4">
                          <span className="text-[11px] font-bold text-gray-400 capitalize tracking-wider block mb-2 border-b pb-1">Designation</span>
                          <select
                            value={tempDesig}
                            onChange={(e) => setTempDesig(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-orange-500/20 outline-none transition-all text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-white"
                          >
                            <option value="all">All Designations</option>
                            {designations.map((dsg) => (
                              <option key={dsg.id} value={dsg.designation_name}>{dsg.designation_name}</option>
                            ))}
                          </select>
                        </div>
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
                            setSelectedStatus(tempStatus);
                            setSelectedDepartment(tempDept);
                            setSelectedDesignation(tempDesig);
                            setDateRange(tempDateRange);
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

                <button
                  onClick={handleExport}
                  className="bg-white border border-gray-300 hover:bg-gray-50 px-6 py-3 rounded-sm flex items-center gap-2 transition text-sm font-semibold shadow-sm active:scale-95"
                >
                  <Download className="w-5 h-5" /> EXPORT
                </button>

                <button
                  onClick={() => setShowAddModal(true)}
                  disabled={!create}
                  className={`flex items-center gap-2 px-6 py-3 rounded-sm font-semibold transition shadow-lg hover:shadow-xl ${create
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                >
                  <Plus size={20} />
                  Add Payroll
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-8xl mx-auto p-4 pt-0 mt-2">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <NumberCard title="Total Payrolls" number={salaries.length} icon={<DollarSign />} iconBgColor="bg-blue-100" lineBorderClass="border-blue-500" />
            <NumberCard title="Total Generated" number={salaries.filter(s => s.status === 'generated').length} icon={<TrendingUp />} iconBgColor="bg-green-100" lineBorderClass="border-green-500" />
            <NumberCard title="Total Pending" number={salaries.filter(s => s.status === 'pending').length} icon={<Calendar />} iconBgColor="bg-orange-100" lineBorderClass="border-orange-500" />
            <NumberCard title="Total Employees" number={new Set(salaries.map(s => s.employee_id)).size} icon={<Users />} iconBgColor="bg-purple-100" lineBorderClass="border-purple-500" />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 mb-6 bg-gray-50 p-1.5 rounded-sm border border-gray-200 w-fit shadow-sm">
            {[
              { id: 'all', label: 'All Records', icon: <Users size={14} /> },
              { id: 'paid', label: 'Paid Salaries', icon: <DollarSign size={14} /> },
              { id: 'pending', label: 'Pending Payments', icon: <Calendar size={14} /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedStatus(tab.id);
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-sm text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${selectedStatus === tab.id
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md active:scale-95"
                  : "text-gray-500 hover:text-gray-800 hover:bg-white"
                  }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Salary Table */}
          {salariesLoading ? (
            <div className="flex justify-center flex-col items-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
              <p className="text-gray-500 font-semibold">Loading payroll records...</p>
            </div>
          ) : salaries.length ? (
            <>
              <div className="overflow-x-auto border border-gray-200 rounded-sm shadow-sm mt-4">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm">
                      <th className="py-3 px-4 font-semibold text-left border-b border-orange-400">S.N</th>
                      <th className="py-3 px-4 font-semibold text-left border-b border-orange-400">Employee</th>
                      <th className="py-3 px-4 font-semibold text-left border-b border-orange-400">Designation</th>
                      <th className="py-3 px-4 font-semibold text-left border-b border-orange-400">Department</th>
                      <th className="py-3 px-4 font-semibold border-b border-orange-400 text-right">Net Salary</th>
                      <th className="py-3 px-4 font-semibold text-center border-b border-orange-400">Status</th>
                      <th className="py-3 px-4 font-semibold text-center border-b border-orange-400">Pay Date</th>
                      <th className="py-3 px-4 font-semibold text-right border-b border-orange-400">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {salaries.map((salary, index) => (
                      <tr key={salary.employee_id} className="border-t hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-gray-700 font-medium">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-[10px] border border-orange-200">
                              {(salary.employee_name || "N")
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </div>
                            <span className="font-bold text-gray-800">{salary.employee_name || "N/A"}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{salary.designation || "-"}</td>
                        <td className="py-3 px-4 text-gray-700">{salary.department || "-"}</td>
                        <td className="py-3 px-4 font-black text-orange-600 text-lg text-right">₹{Math.round(salary.net_salary || 0).toLocaleString()}</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border ${getStatusClass(salary.status)}`}
                          >
                            {salary.status || "pending"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-gray-700 font-medium">{formatDate(salary.pay_date)}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-1">
                            {salary.id ? (
                              <>
                                {salary.status === "pending" && update && (
                                  <button
                                    onClick={() => handleMarkAsPaid(salary.id)}
                                    className="p-1 hover:bg-orange-100 rounded-sm text-green-500 hover:text-green-700 transition-all font-medium"
                                    title="Mark as Paid"
                                  >
                                    <DollarSign size={18} />
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setSelectedSalary(salary);
                                    setGenerateModalOpen(true);
                                  }}
                                  className="p-1 hover:bg-orange-100 rounded-sm text-orange-500 hover:text-orange-700 transition-all font-medium"
                                  title="Pay Slip"
                                >
                                  <Calculator size={18} />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedSalary(salary);
                                    setViewModalOpen(true);
                                  }}
                                  className="p-1 hover:bg-orange-100 rounded-sm text-blue-500 hover:text-blue-700 transition-all font-medium"
                                  title="View"
                                >
                                  <Eye size={18} />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedSalary(salary);
                                    setEditModalOpen(true);
                                  }}
                                  disabled={!update}
                                  className={`p-1 hover:bg-orange-100 rounded-sm transition-all ${update ? "text-green-500 hover:text-green-700" : "text-gray-300 cursor-not-allowed"}`}
                                  title="Edit"
                                >
                                  <Edit size={18} />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedSalaryId(salary.id);
                                    setOpenDelete(true);
                                  }}
                                  disabled={!remove}
                                  className={`p-1 hover:bg-orange-100 rounded-sm transition-all ${remove ? "text-red-500 hover:text-red-700" : "text-gray-300 cursor-not-allowed"}`}
                                  title="Delete"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </>
                            ) : (
                              create && (
                                <button
                                  onClick={() => {
                                    setSelectedSalary({ ...salary, Employee: salary.employee_id });
                                    setShowAddModal(true);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 bg-[#FF7B1D] text-white rounded-sm hover:bg-[#e66a15] transition-all shadow-sm font-bold tracking-wide"
                                >
                                  <Plus size={18} /> Add Payroll
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4 bg-gray-50 p-4 rounded-sm border border-gray-200 mb-6 shadow-sm">
                <p className="text-sm font-semibold text-gray-700">
                  Showing <span className="text-orange-600">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-orange-600">{Math.min(currentPage * itemsPerPage, pagination.total)}</span> of <span className="text-orange-600">{pagination.total}</span> Records
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-sm font-bold transition flex items-center gap-1 ${currentPage === 1 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"}`}
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: pagination.totalPages }, (_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-10 h-10 rounded-sm font-bold transition ${currentPage === i + 1 ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md border-orange-500" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                    disabled={currentPage === pagination.totalPages || pagination.totalPages === 0}
                    className={`px-4 py-2 rounded-sm font-bold transition flex items-center gap-1 ${currentPage === pagination.totalPages || pagination.totalPages === 0 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"}`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-sm shadow-sm p-20 text-center flex flex-col items-center gap-4 mt-6">
              <DollarSign size={64} className="text-gray-200" />
              <h3 className="text-xl font-bold text-gray-700">No salary records found</h3>
              <p className="text-gray-500">Try adjusting your filters or add a new record.</p>
            </div>
          )}

          {/* Modals */}
          <AddSalaryModal
            isOpen={showAddModal}
            onClose={() => {
              setShowAddModal(false);
              setSelectedSalary(null);
            }}
            onSubmit={handleSubmitSalary}
            loading={creating}
            initialSalary={selectedSalary}
          />
          <ViewSalaryModal
            isOpen={ViewModalOpen}
            onClose={() => {
              setViewModalOpen(false);
              setSelectedSalary(null);
            }}
            salary={selectedSalary}
          />
          <EditSalaryModal
            isOpen={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedSalary(null);
            }}
            salary={selectedSalary}
            onSubmit={handleUpdateSalary}
            loading={updating}
          />
          <DeleteSalaryModal
            isOpen={openDelete}
            onClose={() => {
              setOpenDelete(false);
              setSelectedSalaryId(null);
            }}
            salaryId={selectedSalaryId}
          />
          <GenerateSalaryModal
            isOpen={generateModalOpen}
            onClose={() => {
              setGenerateModalOpen(false);
              setSelectedSalary(null);
            }}
            salary={selectedSalary}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
