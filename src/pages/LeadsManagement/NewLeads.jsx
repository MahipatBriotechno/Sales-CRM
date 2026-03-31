import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { FiHome, FiGrid } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { Download, Upload, Filter, UserPlus, List, Trash2, Users, Server, Type, Phone, Loader2, ChevronLeft, ChevronRight, Mail, AlertCircle, PlusIcon, X } from "lucide-react";
import Modal from "../../components/common/Modal";
import AddLeadPopup from "../../components/AddNewLeads/AddNewLead";
import BulkUploadLeads from "../../components/AddNewLeads/BulkUpload";
import AssignLeadsModal from "./AllLeadPagePart/AssignLeadModal";
import LeadsListView from "./AllLeadPagePart/LeadsList";
import LeadsGridView from "./AllLeadPagePart/LeadsGridView";
import NumberCard from "../../components/NumberCard";
import ActionGuard from "../../components/common/ActionGuard";
import { useGetPipelinesQuery } from "../../store/api/pipelineApi";
import { useGetEmployeesQuery } from "../../store/api/employeeApi";
import {
  useGetLeadsQuery,
  useDeleteLeadMutation,
  useUpdateLeadMutation,
  useHitCallMutation,
  useManualAssignLeadsMutation
} from "../../store/api/leadApi";
import { toast } from "react-hot-toast";
import CallQrModal from "../../components/LeadManagement/CallQrModal";
import EmptyState from "../../components/common/EmptyState";

export default function LeadsList() {
  const isLocked = useSelector((state) => state.ui.sidebarLocked);
  const navigate = useNavigate();
  const [view, setView] = useState("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterTag, setFilterTag] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterServices, setFilterServices] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [openLeadMenu, setOpenLeadMenu] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [filterSource, setFilterSource] = useState("All");
  const [filterOwner, setFilterOwner] = useState("All");
  const [filterIndustry, setFilterIndustry] = useState("All");
  const [filterPipeline, setFilterPipeline] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterSubtype, setFilterSubtype] = useState("All");
  const [filterGender, setFilterGender] = useState("All");
  const [filterCity, setFilterCity] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [filterName, setFilterName] = useState("");
  const [filterMobile, setFilterMobile] = useState("");
  const itemsPerPage = 7;
  const [showBulkUploadPopup, setShowBulkUploadPopup] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedLeadForCall, setSelectedLeadForCall] = useState(null);
  const [callPopupData, setCallPopupData] = useState({ isOpen: false, lead: null });
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const dropdownRef = useRef(null);
  const addLeadMenuRef = useRef(null);

  // Temporary filter states for the menu
  const [tempFilters, setTempFilters] = useState({
    type: filterType,
    priority: filterPriority,
    services: filterServices,
    dateFrom: filterDateFrom,
    dateTo: filterDateTo,
    subtype: filterSubtype,
    status: filterStatus || "All",
    source: filterSource,
    owner: filterOwner,
    industry: filterIndustry,
    pipeline_id: filterPipeline,
    gender: filterGender,
    city: filterCity,
    value: filterValue,
    name: filterName,
    mobile_number: filterMobile,
  });

  useEffect(() => {
    if (isFilterOpen) {
      setTempFilters({
        type: filterType,
        priority: filterPriority,
        services: filterServices,
        dateFrom: filterDateFrom,
        dateTo: filterDateTo,
        subtype: filterSubtype,
        status: filterStatus || "All",
        source: filterSource,
        owner: filterOwner,
        industry: filterIndustry,
        pipeline_id: filterPipeline,
        gender: filterGender,
        city: filterCity,
        value: filterValue,
        name: filterName,
        mobile_number: filterMobile,
      });
    }
  }, [isFilterOpen, filterType, filterPriority, filterServices, filterDateFrom, filterDateTo, filterSubtype, filterStatus, filterSource, filterOwner, filterIndustry, filterPipeline, filterGender, filterCity, filterValue]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
      if (addLeadMenuRef.current && !addLeadMenuRef.current.contains(event.target)) {
        setOpenLeadMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleApplyFilters = () => {
    setFilterType(tempFilters.type);
    setFilterPriority(tempFilters.priority);
    setFilterServices(tempFilters.services);
    setFilterDateFrom(tempFilters.dateFrom);
    setFilterDateTo(tempFilters.dateTo);
    setFilterSubtype(tempFilters.subtype);
    setFilterStatus(tempFilters.status);
    setFilterSource(tempFilters.source);
    setFilterOwner(tempFilters.owner);
    setFilterIndustry(tempFilters.industry);
    setFilterPipeline(tempFilters.pipeline_id);
    setFilterGender(tempFilters.gender);
    setFilterCity(tempFilters.city);
    setFilterValue(tempFilters.value);
    setFilterName(tempFilters.name);
    setFilterMobile(tempFilters.mobile_number);
    setIsFilterOpen(false);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setTempFilters({
      type: "All",
      priority: "All",
      services: "All",
      dateFrom: "",
      dateTo: "",
      subtype: "All",
      status: "All",
      source: "All",
      owner: "All",
      industry: "All",
      pipeline_id: "",
      gender: "All",
      city: "",
      value: "",
      name: "",
      mobile_number: "",
    });
  };

  const { data: pipelinesData } = useGetPipelinesQuery({ limit: 1000 });
  const pipelines = pipelinesData?.pipelines || [];
  const { data: employeesData } = useGetEmployeesQuery({ limit: 100 });
  const employees = employeesData?.employees || [];

  // RTK Query hooks
  const { data: leadsResponse, isLoading, isError, refetch } = useGetLeadsQuery({
    page: currentPage,
    limit: itemsPerPage,
    search: searchQuery,
    status: filterStatus,
    tag: filterTag,
    subview: 'new',
    type: filterType,
    priority: filterPriority,
    dateFrom: filterDateFrom,
    dateTo: filterDateTo,
    pipeline_id: filterPipeline,
    source: filterSource,
    owner: filterOwner,
    industry: filterIndustry,
    gender: filterGender,
    city: filterCity,
    value: filterValue,
    name: filterName,
    mobile_number: filterMobile,
  });

  const [deleteLead] = useDeleteLeadMutation();
  const [updateLead] = useUpdateLeadMutation();
  const [hitCallMutation] = useHitCallMutation();
  const [manualAssignLeads] = useManualAssignLeadsMutation();

  const handleHitCall = async (callData) => {
    try {
      await hitCallMutation(callData).unwrap();
      toast.success("Lead status updated based on call response");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update call status");
    }
  };

  const openCallAction = (lead) => {
    setSelectedLeadForCall(lead);
    setIsQrModalOpen(true);
  };

  const handleProceedToLog = () => {
    setIsQrModalOpen(false);
    setCallPopupData({ isOpen: true, lead: selectedLeadForCall });
  };

  const leadsData = leadsResponse?.leads || [];
  const totalLeads = leadsResponse?.pagination?.total || 0;
  const totalPages = leadsResponse?.pagination?.totalPages || 1;

  const handleLeadClick = async (lead) => {
    if (!lead.is_read) {
      try {
        await updateLead({ id: lead.id, data: { is_read: 1 } }).unwrap();
      } catch (err) {
        console.error("Failed to mark lead as read", err);
      }
    }
    navigate(`/crm/leads/profile/${lead.id}`, { state: { lead } });
  };

  const handleAddLead = () => {
    setLeadToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditLead = (lead) => {
    setLeadToEdit(lead);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setLeadToEdit(null);
  };

  const handleDeleteLead = (lead) => {
    setLeadToDelete(lead);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!leadToDelete) return;

    try {
      if (Array.isArray(leadToDelete)) {
        // Bulk delete
        await Promise.all(leadToDelete.map(id => deleteLead(id).unwrap()));
        toast.success("Selected leads moved to trash successfully");
        setSelectedLeads([]);
      } else {
        // Single delete
        await deleteLead(leadToDelete.id).unwrap();
        toast.success("Lead moved to trash successfully");
        setSelectedLeads(selectedLeads.filter((leadId) => leadId !== leadToDelete.id));
      }
      setShowDeleteModal(false);
      setLeadToDelete(null);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to delete lead");
      console.error(error);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedLeads.length === 0) {
      toast.error("Please select leads to delete");
      return;
    }
    setLeadToDelete(selectedLeads); // Pass the array of IDs
    setShowDeleteModal(true);
  };

  const handleSelectLead = (id) => {
    setSelectedLeads((prev) =>
      prev.includes(id) ? prev.filter((leadId) => leadId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === leadsData.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leadsData.map((lead) => lead.id));
    }
  };

  const handleAssignLeads = () => {
    if (selectedLeads.length === 0) {
      toast.error("Please select leads to assign");
      return;
    }
    setIsAssignModalOpen(true);
  };

  const handleAssign = async (assignmentData) => {
    try {
      await manualAssignLeads({
        leadIds: selectedLeads,
        employeeIds: assignmentData.employees,
        teamIds: assignmentData.teams
      }).unwrap();
      toast.success(`${selectedLeads.length} leads assigned successfully!`);
      setIsAssignModalOpen(false);
      setSelectedLeads([]);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to assign leads");
    }
  };

  const handleExport = () => {
    const headers = ["ID", "Name", "Email", "Phone", "Type", "Created", "Status", "Tag"];
    const csvContent = [
      headers.join(","),
      ...leadsData.map((lead) =>
        [lead.id, `"${lead.name}"`, lead.email || "", lead.mobile_number || "", lead.type || "", lead.createdAt, lead.status || "", lead.tag || ""].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `all_leads_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const handlePageChange = (page) => setCurrentPage(page);
  const handlePrev = () => setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
  const handleNext = () => setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="bg-white sticky top-0 z-30">
        <div className="max-w-8xl mx-auto px-4 py-4 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">New Leads</h1>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                <FiHome className="text-gray-700" size={14} />
                <span className="text-gray-400">CRM / </span>
                <span className="text-[#FF7B1D] font-medium">
                  New Leads
                </span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {/* View Toggles */}
              <div className="flex p-1 bg-gray-50 border border-gray-200 rounded-sm shadow-sm">
                <button
                  onClick={() => setView("list")}
                  className={`p-1.5 rounded-sm transition-all ${view === "list"
                    ? "bg-white text-orange-600 shadow-sm border border-gray-100"
                    : "text-gray-400 hover:text-gray-600"
                    }`}
                  title="List View"
                >
                  <List size={18} />
                </button>
                <button
                  onClick={() => setView("grid")}
                  className={`p-1.5 rounded-sm transition-all ${view === "grid"
                    ? "bg-white text-orange-600 shadow-sm border border-gray-100"
                    : "text-gray-400 hover:text-gray-600"
                    }`}
                  title="Grid View"
                >
                  <FiGrid size={18} />
                </button>
              </div>

              {/* Filter Button */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => {
                    if (filterStatus !== "All" || filterType !== "All" || filterPriority !== "All" || filterPipeline !== "" || filterCity !== "" || filterValue !== "" || filterDateFrom !== "" || filterDateTo !== "" || filterName !== "" || filterMobile !== "") {
                      handleResetFilters();
                      handleApplyFilters();
                    } else {
                      setIsFilterOpen(!isFilterOpen);
                    }
                  }}
                  className={`px-3 py-3 rounded-sm border transition shadow-sm ${isFilterOpen || (filterStatus !== "All" || filterType !== "All" || filterPriority !== "All" || filterPipeline !== "" || filterCity !== "" || filterValue !== "" || filterDateFrom !== "" || filterDateTo !== "" || filterName !== "" || filterMobile !== "")
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-[#FF7B1D]"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                    }`}
                  title="Filters"
                >
                  {(filterStatus !== "All" || filterType !== "All" || filterPriority !== "All" || filterPipeline !== "" || filterCity !== "" || filterValue !== "" || filterDateFrom !== "" || filterDateTo !== "" || filterName !== "" || filterMobile !== "") ? <X size={18} strokeWidth={3} /> : <Filter size={18} strokeWidth={2.5} />}
                </button>

                {isFilterOpen && (
                  <div className="absolute right-0 mt-2 w-[480px] bg-white border border-gray-200 rounded-sm shadow-2xl z-50 animate-fadeIn overflow-hidden">
                    {/* Header */}
                    <div className="p-4 bg-gray-50 border-b flex justify-between items-center text-black">
                      <span className="text-sm font-bold capitalize">Filter Options</span>
                      <button
                        onClick={handleResetFilters}
                        className="text-[10px] font-bold text-orange-600 hover:underline hover:text-orange-700 capitalize tracking-tighter"
                      >
                        Reset All
                      </button>
                    </div>

                    {/* Content - Scrollable */}
                    <div className="max-h-[70vh] overflow-y-auto p-5">
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          {/* Lead Name Filter */}
                          <div>
                            <label className="text-[11px] font-bold text-gray-400 capitalize tracking-wider block mb-2 border-b pb-1">
                              Lead Name
                            </label>
                            <input
                              type="text"
                              value={tempFilters.name}
                              onChange={(e) => setTempFilters(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Enter lead name"
                              className="w-full px-3 py-2.5 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-orange-500/20 outline-none transition-all text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-white"
                            />
                          </div>

                          {/* Mobile Number Filter */}
                          <div>
                            <label className="text-[11px] font-bold text-gray-400 capitalize tracking-wider block mb-2 border-b pb-1">
                              Mobile Number
                            </label>
                            <input
                              type="text"
                              value={tempFilters.mobile_number}
                              onChange={(e) => setTempFilters(prev => ({ ...prev, mobile_number: e.target.value }))}
                              placeholder="Enter mobile number"
                              className="w-full px-3 py-2.5 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-orange-500/20 outline-none transition-all text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 pt-2 border-t">
                          {/* Lead Type */}
                          <div>
                            <label className="text-[11px] font-bold text-gray-400 capitalize tracking-wider block mb-2 border-b pb-1">
                              Lead Type
                            </label>
                            <select
                              value={tempFilters.type}
                              onChange={(e) => setTempFilters(prev => ({ ...prev, type: e.target.value }))}
                              className="w-full px-3 py-2.5 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-orange-500/20 outline-none transition-all text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-white"
                            >
                              <option value="All">All Types</option>
                              <option value="Person">Person</option>
                              <option value="Organization">Organization</option>
                            </select>
                          </div>

                          {/* Priority */}
                          <div>
                            <label className="text-[11px] font-bold text-gray-400 capitalize tracking-wider block mb-2 border-b pb-1">
                              Priority
                            </label>
                            <select
                              value={tempFilters.priority}
                              onChange={(e) => setTempFilters(prev => ({ ...prev, priority: e.target.value }))}
                              className="w-full px-3 py-2.5 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-orange-500/20 outline-none transition-all text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-white"
                            >
                              <option value="All">All Priority</option>
                              <option value="High">High</option>
                              <option value="Medium">Medium</option>
                              <option value="Low">Low</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-gray-400 capitalize tracking-wider block mb-2 border-b pb-1">
                              Lead Source
                            </label>
                            <select
                              value={tempFilters.source}
                              onChange={(e) => setTempFilters(prev => ({ ...prev, source: e.target.value }))}
                              className="w-full px-3 py-2.5 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-orange-500/20 outline-none transition-all text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-white"
                            >
                              <option value="All">All Sources</option>
                              <option value="Indiamart">Indiamart</option>
                              <option value="Direct">Direct</option>
                              <option value="Meta">Meta</option>
                              <option value="Justdial">Justdial</option>
                              <option value="Website">Website</option>
                            </select>
                          </div>

                          {/* Lead Owner */}
                          <div>
                            <label className="text-[11px] font-bold text-gray-400 capitalize tracking-wider block mb-2 border-b pb-1">
                              Lead Owner
                            </label>
                            <select
                              value={tempFilters.owner}
                              onChange={(e) => setTempFilters(prev => ({ ...prev, owner: e.target.value }))}
                              className="w-full px-3 py-2.5 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-orange-500/20 outline-none transition-all text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-white"
                            >
                              <option value="All">All Owners</option>
                              {employees.map(emp => (
                                <option key={emp.id} value={emp.user_id || emp.id}>{emp.employee_name}</option>
                              ))}
                            </select>
                          </div>

                          {/* Industry */}
                          <div>
                            <label className="text-[11px] font-bold text-gray-400 capitalize tracking-wider block mb-2 border-b pb-1">
                              Industry
                            </label>
                            <select
                              value={tempFilters.industry}
                              onChange={(e) => setTempFilters(prev => ({ ...prev, industry: e.target.value }))}
                              className="w-full px-3 py-2.5 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-orange-500/20 outline-none transition-all text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-white"
                            >
                              <option value="All">All Industries</option>
                              <option value="Technology">Technology</option>
                              <option value="Finance">Finance</option>
                              <option value="Healthcare">Healthcare</option>
                              <option value="Education">Education</option>
                              <option value="Manufacturing">Manufacturing</option>
                              <option value="Retail">Retail</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>

                          {/* Pipeline */}
                          <div>
                            <label className="text-[11px] font-bold text-gray-400 capitalize tracking-wider block mb-2 border-b pb-1">
                              Pipeline
                            </label>
                            <select
                              value={tempFilters.pipeline_id}
                              onChange={(e) => setTempFilters(prev => ({ ...prev, pipeline_id: e.target.value }))}
                              className="w-full px-3 py-2.5 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-orange-500/20 outline-none transition-all text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-white"
                            >
                              <option value="">All Pipelines</option>
                              {pipelines?.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </div>

                          {/* Gender */}
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 block mb-1">Gender</label>
                            <select
                              value={tempFilters.gender}
                              onChange={(e) => setTempFilters(prev => ({ ...prev, gender: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-200 rounded-sm text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-white"
                            >
                              <option value="All">All Genders</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>

                          {/* City */}
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 block mb-1">City</label>
                            <input
                              type="text"
                              value={tempFilters.city}
                              onChange={(e) => setTempFilters(prev => ({ ...prev, city: e.target.value }))}
                              placeholder="Enter city"
                              className="w-full px-3 py-2 border border-gray-200 rounded-sm text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-white"
                            />
                          </div>

                          {/* Budget/Value */}
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 block mb-1">Expected Value</label>
                            <input
                              type="number"
                              value={tempFilters.value}
                              onChange={(e) => setTempFilters(prev => ({ ...prev, value: e.target.value }))}
                              placeholder="Enter value"
                              className="w-full px-3 py-2 border border-gray-200 rounded-sm text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-gray-50 border-t flex gap-3">
                      <button
                        onClick={() => setIsFilterOpen(false)}
                        className="flex-1 py-2.5 text-[11px] font-bold text-gray-500 capitalize tracking-wider hover:bg-gray-200 transition-colors rounded-sm border border-gray-200 bg-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleApplyFilters}
                        className="flex-1 py-2.5 text-[11px] font-bold text-white capitalize tracking-wider bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all rounded-sm shadow-md active:scale-95"
                      >
                        Apply Filters
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Export Button */}
              {/* <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-sm text-[11px] font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm capitalize tracking-wider"
                >
                  <Download size={18} className="text-[#FF7B1D]" />
                  Export
                </button> */}

              {/* Add Lead Button */}
              <div className="relative" ref={addLeadMenuRef}>
                <ActionGuard permission="leads_create" module="Leads Management" type="create">
                  <button
                    onClick={() => setOpenLeadMenu(!openLeadMenu)}
                    className="flex items-center gap-2 px-6 py-3 rounded-sm font-semibold transition shadow-lg hover:shadow-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700"
                  >
                    <PlusIcon size={20} />
                    Add Lead
                  </button>
                </ActionGuard>

                {openLeadMenu && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 shadow-xl rounded-sm z-50 overflow-hidden divide-y divide-gray-100 animate-fadeIn">
                    <button
                      onClick={() => {
                        setOpenLeadMenu(false);
                        handleAddLead();
                      }}
                      className="w-full flex items-center gap-3 text-left px-5 py-3.5 hover:bg-orange-50 text-sm font-bold text-gray-700 hover:text-orange-600 transition font-primary"
                    >
                      <UserPlus size={18} />
                      Add Single Lead
                    </button>

                    <button
                      onClick={() => {
                        setOpenLeadMenu(false);
                        setShowBulkUploadPopup(true);
                      }}
                      className="w-full flex items-center gap-3 text-left px-5 py-3.5 hover:bg-orange-50 text-sm font-bold text-gray-700 hover:text-orange-600 transition font-primary"
                    >
                      <Upload size={18} />
                      Bulk Upload
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-8xl mx-auto p-4 pt-0 mt-2">
        {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
          <NumberCard title="Total Leads" number={totalLeads.toString()} icon={<Users className="text-blue-600" size={24} />} iconBgColor="bg-blue-100" lineBorderClass="border-blue-500" />
          <NumberCard title="Quick Filters" number="All" icon={<Server className="text-green-600" size={24} />} iconBgColor="bg-green-100" lineBorderClass="border-green-500" />
          <NumberCard title="Avg Value" number="-" icon={<Type className="text-orange-600" size={24} />} iconBgColor="bg-orange-100" lineBorderClass="border-orange-500" />
          <NumberCard title="Priority" number="Mix" icon={<Phone className="text-purple-600" size={24} />} iconBgColor="bg-purple-100" lineBorderClass="border-purple-500" />
        </div> */}

        {/* Floating Action Bar for Selected Leads - Properly Centered in Content Area */}
        {selectedLeads.length > 0 && !isAssignModalOpen && !isModalOpen && !showDeleteModal && !callPopupData.isOpen && !isQrModalOpen && !showBulkUploadPopup && (
          <div
            className={`fixed bottom-10 z-[100] flex justify-center pointer-events-none transition-all duration-300 left-0 ${isLocked ? "md:left-[280px]" : "md:left-[68px]"} right-0 animate-slideUp`}
          >
            <div className="pointer-events-auto flex items-center gap-8 px-8 py-4 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-sm shadow-[0_30px_70px_rgba(0,0,0,0.25)] flex-wrap md:flex-nowrap justify-center">
              <div className="flex items-center gap-4 border-r border-gray-200 pr-8">
                <span className="w-11 h-11 rounded-full bg-orange-100 text-[#FF7B1D] flex items-center justify-center text-xl font-black font-primary shadow-inner">
                  {selectedLeads.length}
                </span>
                <div className="flex flex-col">
                  <span className="text-base font-bold text-gray-800 capitalize tracking-tight font-primary leading-none">
                    Leads Selected
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 font-primary">Ready to manage</span>
                </div>
              </div>

              <div className="flex gap-4">
                <ActionGuard permission="leads_assign" module="Leads Management" type="update">
                  <button
                    onClick={handleAssignLeads}
                    className="bg-white border border-gray-300 text-gray-700 px-6 py-2.5 rounded-sm font-bold hover:bg-orange-50 hover:border-[#FF7B1D] hover:text-[#FF7B1D] transition-all capitalize flex items-center gap-2.5 text-sm shadow-sm active:scale-95 font-primary group"
                  >
                    <UserPlus size={18} className="text-[#FF7B1D] group-hover:scale-110 transition-transform" />
                    Assign Leads
                  </button>
                </ActionGuard>
                <ActionGuard permission="leads_delete" module="Leads Management" type="delete">
                  <button
                    onClick={handleDeleteSelected}
                    className="bg-red-600 text-white px-6 py-2.5 rounded-sm font-bold hover:bg-red-700 transition-all capitalize flex items-center gap-2.5 text-sm shadow-md shadow-red-200 active:scale-95 font-primary border border-red-700"
                  >
                    <Trash2 size={18} />
                    Delete Selected
                  </button>
                </ActionGuard>
              </div>
            </div>
          </div>
        )}

        <div className="pb-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64"><Loader2 size={40} className="animate-spin text-orange-500" /></div>
          ) : isError ? (
            <div className="text-center text-red-500 py-10 capitalize">Failed to load leads.</div>
          ) : leadsData.length === 0 ? (
            <EmptyState
              title="No New Leads"
              message="You're all caught up! No new leads available at the moment."
              type="leads"
            />
          ) : (
            <>
              {view === "list" ? (
                <LeadsListView
                  currentLeads={leadsData}
                  selectedLeads={selectedLeads}
                  handleSelectAll={handleSelectAll}
                  handleSelectLead={handleSelectLead}
                  handleLeadClick={handleLeadClick}
                  currentPage={currentPage}
                  itemsPerPage={itemsPerPage}
                  handleDeleteLead={handleDeleteLead}
                  handleEditLead={handleEditLead}
                  handleHitCall={openCallAction}
                  pageType="New Lead"
                />
              ) : (
                <LeadsGridView
                  leadsData={leadsData}
                  filterStatus={filterStatus}
                  handleLeadClick={handleLeadClick}
                  selectedLeads={selectedLeads}
                  handleSelectLead={handleSelectLead}
                  handleHitCall={openCallAction}
                  pageType="New Lead"
                />
              )}

              {totalPages > 1 && (
                <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4 bg-gray-50 p-4 rounded-sm border border-gray-200 shadow-sm animate-fadeIn">
                  <p className="text-sm font-semibold text-gray-700">
                    Showing <span className="text-orange-600">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="text-orange-600">{Math.min(currentPage * itemsPerPage, totalLeads)}</span> of <span className="text-orange-600 font-bold">{totalLeads}</span> Leads
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrev}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-sm font-bold transition flex items-center gap-1 text-[11px] uppercase tracking-wider ${currentPage === 1
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
                        }`}
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>

                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1))
                        .map((p, i, arr) => (
                          <React.Fragment key={p}>
                            {i > 0 && arr[i - 1] !== p - 1 && <span className="text-gray-400 px-1">...</span>}
                            <button
                              onClick={() => handlePageChange(p)}
                              className={`w-10 h-10 rounded-sm font-bold transition text-xs ${currentPage === p
                                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md border-orange-500"
                                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
                                }`}
                            >
                              {p}
                            </button>
                          </React.Fragment>
                        ))
                      }
                    </div>

                    <button
                      onClick={handleNext}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 rounded-sm font-bold transition flex items-center gap-1 text-[11px] uppercase tracking-wider ${currentPage === totalPages
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
                        }`}
                    >
                      Next
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <AssignLeadsModal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} selectedLeadsCount={selectedLeads.length} onAssign={handleAssign} />
      {isModalOpen && <AddLeadPopup isOpen={isModalOpen} onClose={handleCloseModal} leadToEdit={leadToEdit} />}
      {showBulkUploadPopup && <BulkUploadLeads onClose={() => setShowBulkUploadPopup(false)} />}
      <CallQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        lead={selectedLeadForCall}
        onProceedToLog={handleProceedToLog}
      />
      {callPopupData.isOpen && (
        <CallActionPopup
          isOpen={callPopupData.isOpen}
          onClose={() => setCallPopupData({ isOpen: false, lead: null })}
          lead={callPopupData.lead}
          onHitCall={handleHitCall}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setLeadToDelete(null);
        }}
        headerVariant="simple"
        maxWidth="max-w-md"
        footer={
          <div className="flex gap-4 w-full">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setLeadToDelete(null);
              }}
              className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 font-bold rounded-sm hover:bg-gray-100 transition-all font-primary text-xs capitalize tracking-widest"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="flex-1 px-6 py-3 bg-red-600 text-white font-bold rounded-sm hover:bg-red-700 transition-all shadow-lg flex items-center justify-center gap-2 font-primary text-xs capitalize tracking-widest"
            >
              <Trash2 size={18} />
              Delete Now
            </button>
          </div>
        }
      >
        <div className="flex flex-col items-center text-center text-black font-primary">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="text-red-600" size={48} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Confirm Delete</h2>
          <p className="text-gray-600 mb-2 leading-relaxed">
            {Array.isArray(leadToDelete)
              ? `Are you sure you want to delete ${leadToDelete.length} selected lead(s)?`
              : <>Are you sure you want to delete the lead <span className="font-bold text-gray-800">"{leadToDelete?.name || leadToDelete?.full_name || "this lead"}"</span>?</>}
          </p>
          <p className="text-xs text-red-500 italic font-medium">This action cannot be undone. All associated data will be permanently removed.</p>
        </div>
      </Modal>
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slideUp {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}


