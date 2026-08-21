import { useState, useEffect, useRef } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import JobViewModal from "../../pages/JobManagement/ViewPage";
import {
  Activity,
  AlertTriangle,
  Briefcase,
  CheckCircle,
  ChevronDown,
  Copy,
  Edit,
  Eye,
  Filter,
  Link as LinkIcon,
  Plus,
  Trash2,
  Users,
  X,
  FileText,
  MapPin,
  AlignLeft,
  Calendar,
  Layers,
  Search,
  ArrowRight,
  LayoutGrid,
  List
} from "lucide-react";
import { FiHome } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import NumberCard from "../../components/NumberCard";
import {
  useGetJobsQuery,
  useGetJobStatsQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useDeleteJobMutation
} from "../../store/api/jobApi";
import toast from 'react-hot-toast';
import { useGetDepartmentsQuery } from "../../store/api/departmentApi";
import usePermission from "../../hooks/usePermission";
import Modal from "../../components/common/Modal";
import ActionGuard from "../../components/common/ActionGuard";
import GenericGridView from "../../components/common/GenericGridView";

const DeleteJobModal = ({ isOpen, onClose, onConfirm, isLoading, title }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      headerVariant="simple"
      maxWidth="max-w-md"
      cleanLayout={true}
      footer={
        <div className="flex gap-4 w-full px-6 py-4 border-t">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 font-bold rounded-sm hover:bg-gray-100 transition-all font-primary text-xs uppercase tracking-widest outline-none shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-6 py-3 bg-red-600 text-white font-bold rounded-sm hover:bg-red-700 transition-all shadow-lg flex items-center justify-center gap-2 font-primary text-xs uppercase tracking-widest disabled:opacity-50 outline-none active:scale-95"
          >
            {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Trash2 size={18} />}
            Delete Now
          </button>
        </div>
      }
    >
      <div className="flex flex-col items-center text-center text-black font-primary p-6">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle size={48} className="text-[#d00000] drop-shadow-sm" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Confirm Delete</h2>
        <p className="text-gray-600 mb-6 leading-relaxed">
          Are you sure you want to delete the job posting <span className="font-bold text-gray-900">"{title}"</span>?
        </p>
        <div className="bg-red-50 px-4 py-2 rounded-lg inline-block">
          <p className="text-xs text-red-600 font-bold tracking-wide italic uppercase">Irreversible Action</p>
        </div>
      </div>
    </Modal>
  );
};

// Main Component
export default function JobManagement() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingJobId, setEditingJobId] = useState(null);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const itemsPerPage = viewMode === "list" ? 8 : 12;

  const [isNavOpen, setIsNavOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navRef = useRef(null);
  const navigate = useNavigate();

  // Filter states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [tempFilters, setTempFilters] = useState({
    status: "All",
    department: "",
    type: ""
  });

  const hasActiveFilters = selectedStatus !== "All" || selectedDept !== "" || selectedType !== "";

  // Input states for dynamic arrays
  const [responsibilityInput, setResponsibilityInput] = useState("");
  const [requirementInput, setRequirementInput] = useState("");
  const [roundInput, setRoundInput] = useState("");
  const [fieldInput, setFieldInput] = useState({ label: "", type: "text", required: false });

  const { create, read, update, delete: remove } = usePermission("Recruitment");

  // Add Job Form State
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    location: "",
    type: "Full-time",
    positions: 1,
    description: "",
    responsibilities: [],
    requirements: [],
    interview_rounds: ["Screening", "Technical", "HR", "Final"],
    application_fields: [
      { name: "name", label: "Full Name", type: "text", required: true },
      { name: "email", label: "Email Address", type: "email", required: true },
      { name: "phone", label: "Phone Number", type: "tel", required: false }
    ]
  });

  // Queries and Mutations
  const {
    data: jobsData,
    isLoading,
    isError
  } = useGetJobsQuery({
    page: currentPage,
    limit: itemsPerPage,
    status: selectedStatus,
    department: selectedDept,
    type: selectedType,
    search: search
  }, { refetchOnMountOrArgChange: true });

  const { data: statsData } = useGetJobStatsQuery(undefined, { refetchOnMountOrArgChange: true });
  const { data: departmentsData } = useGetDepartmentsQuery({ page: 1, limit: 100 });

  const totalJobs = jobsData?.pagination?.totalItems || 0;
  const totalPages = jobsData?.pagination?.totalPages || 1;

  const [createJob] = useCreateJobMutation();
  const [updateJob] = useUpdateJobMutation();
  const [deleteJob, { isLoading: deleteLoading }] = useDeleteJobMutation();

  // Handlers
  const handleViewJob = (job) => {
    setSelectedJob(job);
    setShowViewModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      department: "",
      location: "",
      type: "Full-time",
      positions: 1,
      description: "",
      responsibilities: [],
      requirements: [],
      interview_rounds: ["Screening", "Technical", "HR", "Final"],
      application_fields: [
        { name: "name", label: "Full Name", type: "text", required: true },
        { name: "email", label: "Email Address", type: "email", required: true },
        { name: "phone", label: "Phone Number", type: "tel", required: false }
      ]
    });
    setEditingJobId(null);
    setResponsibilityInput("");
    setRequirementInput("");
  };

  const handleEditJob = (job) => {
    setFormData({
      title: job.title,
      department: job.department,
      location: job.location,
      type: job.type,
      positions: job.positions,
      description: job.description,
      responsibilities: job.responsibilities || [],
      requirements: job.requirements || [],
      interview_rounds: job.interview_rounds || ["Screening", "Technical", "HR", "Final"],
      application_fields: job.application_fields || [],
      status: job.status
    });
    setEditingJobId(job.id);
    setShowAddModal(true);
  };

  const handleDelete = (job) => {
    setJobToDelete(job); // store full job object
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (jobToDelete?.id) {
      try {
        await deleteJob(jobToDelete.id).unwrap();
        toast.success("Job posting deleted successfully");
        setShowDeleteModal(false);
        setJobToDelete(null);
      } catch (error) {
        toast.error("Failed to delete job posting");
      }
    }
  };


  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
      if (navRef.current && !navRef.current.contains(event.target)) {
        setIsNavOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const clearAllFilters = () => {
    setSelectedStatus("All");
    setSelectedDept("");
    setSelectedType("");
    setSearch("");
    setTempFilters({
      status: "All",
      department: "",
      type: ""
    });
    setCurrentPage(1);
  };

  const handleApplyFilters = () => {
    setSelectedStatus(tempFilters.status);
    setSelectedDept(tempFilters.department);
    setSelectedType(tempFilters.type);
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Dynamic Array Handlers
  const addResponsibility = () => {
    if (responsibilityInput.trim()) {
      setFormData(prev => ({
        ...prev,
        responsibilities: [...prev.responsibilities, responsibilityInput.trim()]
      }));
      setResponsibilityInput("");
    }
  };

  const removeResponsibility = (index) => {
    setFormData(prev => ({
      ...prev,
      responsibilities: prev.responsibilities.filter((_, i) => i !== index)
    }));
  };

  const addRequirement = () => {
    if (requirementInput.trim()) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, requirementInput.trim()]
      }));
      setRequirementInput("");
    }
  };

  const removeRequirement = (index) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const addRound = () => {
    if (roundInput.trim()) {
      setFormData(prev => ({
        ...prev,
        interview_rounds: [...prev.interview_rounds, roundInput.trim()]
      }));
      setRoundInput("");
    }
  };

  const removeRound = (index) => {
    setFormData(prev => ({
      ...prev,
      interview_rounds: prev.interview_rounds.filter((_, i) => i !== index)
    }));
  };

  const addField = () => {
    if (fieldInput.label.trim()) {
      const name = fieldInput.label.toLowerCase().replace(/\s+/g, '_');
      setFormData(prev => ({
        ...prev,
        application_fields: [...prev.application_fields, { ...fieldInput, name }]
      }));
      setFieldInput({ label: "", type: "text", required: false });
    }
  };

  const removeField = (index) => {
    setFormData(prev => ({
      ...prev,
      application_fields: prev.application_fields.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.location || !formData.description || !formData.department) {
      toast.error("Please fill in all required fields (Title, Department, Location, Description)");
      return;
    }

    try {
      const payload = {
        ...formData,
        positions: parseInt(formData.positions)
      };

      if (editingJobId) {
        await updateJob({ id: editingJobId, ...payload }).unwrap();
        toast.success("Job posting updated successfully");
      } else {
        await createJob(payload).unwrap();
        toast.success("Job posting created successfully");
      }

      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error(editingJobId ? "Failed to update job posting" : "Failed to create job posting");
    }
  };

  const filterOptions = ["All", "Active", "On Hold", "Closed"];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-0 via-white to-orange-100">
        <div className="bg-white sticky top-0 z-30">
          <div className="max-w-8xl mx-auto px-4 py-4 border-b">
            <div className="flex justify-between items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 whitespace-nowrap">
                  Recruitment
                </h1>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                  <FiHome className="text-gray-400" />
                  <span>HRM / Recruitment / </span>
                  <span className="text-orange-500 font-medium">Job Posts</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => {
                      if (hasActiveFilters && !isFilterOpen) {
                        clearAllFilters();
                      } else {
                        setTempFilters({
                          status: selectedStatus,
                          department: selectedDept,
                          type: selectedType
                        });
                        setIsFilterOpen(!isFilterOpen);
                      }
                    }}
                    className={`px-3 py-3 rounded-sm border transition shadow-sm ${isFilterOpen || hasActiveFilters
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-500"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                      }`}
                  >
                    {hasActiveFilters && !isFilterOpen ? <X size={18} /> : <Filter size={18} />}
                  </button>

                  {isFilterOpen && (
                    <div className="absolute right-0 mt-2 w-[550px] bg-white border border-gray-200 rounded-sm shadow-2xl z-50 animate-fadeIn overflow-hidden">
                      <div className="p-4 bg-gray-50 border-b flex justify-between items-center font-primary">
                        <span className="text-sm font-bold text-gray-800 tracking-tight capitalize">Filter Options</span>
                        <button
                          onClick={clearAllFilters}
                          className="text-[10px] font-bold text-orange-600 hover:text-orange-700 hover:underline capitalize font-primary"
                        >
                          Reset all
                        </button>
                      </div>

                      <div className="p-6">
                        <div className="grid grid-cols-2 gap-x-8 gap-y-8">
                          {/* Row 1: Status */}
                          <div className="col-span-2">
                            <span className="text-[11px] font-bold text-gray-700 capitalize tracking-wider block mb-3 font-primary">Job Status</span>
                            <div className="grid grid-cols-4 gap-2">
                              {filterOptions.map((s) => (
                                <button
                                  key={s}
                                  onClick={() => setTempFilters({ ...tempFilters, status: s })}
                                  className={`px-2 py-2.5 rounded-sm text-[10px] font-bold transition-all border font-primary ${tempFilters.status === s
                                    ? "bg-orange-500 text-white border-orange-500 shadow-md"
                                    : "bg-white text-gray-600 border-gray-100 hover:border-orange-200"
                                    }`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Row 2: Department */}
                          <div className="space-y-2">
                            <span className="text-[11px] font-bold text-gray-700 capitalize tracking-wider block mb-2 font-primary">Department</span>
                            <select
                              value={tempFilters.department}
                              onChange={(e) => setTempFilters({ ...tempFilters, department: e.target.value })}
                              className="w-full bg-gray-50 border border-gray-100 rounded-sm px-4 py-2.5 text-xs font-semibold focus:border-orange-500 focus:bg-white outline-none transition-all font-primary"
                            >
                              <option value="">All Departments</option>
                              {departmentsData?.departments?.map(d => (
                                <option key={d.id} value={d.department_name}>{d.department_name}</option>
                              ))}
                            </select>
                          </div>

                          {/* Row 3: Job Type */}
                          <div className="space-y-2">
                            <span className="text-[11px] font-bold text-gray-700 capitalize tracking-wider block mb-2 font-primary">Job Type</span>
                            <select
                              value={tempFilters.type}
                              onChange={(e) => setTempFilters({ ...tempFilters, type: e.target.value })}
                              className="w-full bg-gray-50 border border-gray-100 rounded-sm px-4 py-2.5 text-xs font-semibold focus:border-orange-500 focus:bg-white outline-none transition-all font-primary"
                            >
                              <option value="">All Types</option>
                              <option>Full-Time Employee</option>
                              <option>Part-Time Employee</option>
                              <option>Contract Employee</option>
                              <option>Temporary Employee</option>
                              <option>Intern / Trainee</option>
                            </select>
                          </div>
                        </div>

                        <div className="mt-10 flex gap-3">
                          <button
                            onClick={() => setIsFilterOpen(false)}
                            className="flex-1 py-3 border border-gray-200 text-gray-500 font-bold rounded-sm hover:bg-gray-50 transition-all text-[10px] uppercase tracking-widest font-primary"
                          >
                            Close
                          </button>
                          <button
                            onClick={handleApplyFilters}
                            className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-sm shadow-lg hover:opacity-90 transition-all text-[10px] uppercase tracking-widest font-primary"
                          >
                            Apply filters
                          </button>
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

                <ActionGuard permission="job_create" module="Recruitment" type="create">
                  <button
                    onClick={() => {
                      resetForm();
                      setShowAddModal(true);
                    }}
                    className="flex items-center gap-2 px-6 py-3 rounded-sm transition shadow-lg hover:shadow-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 font-bold"
                  >
                    <Plus size={20} />
                    Add New Job
                  </button>
                </ActionGuard>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-8xl mx-auto p-4 pt-0 mt-2">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 ">
            <NumberCard
              title={"Total Jobs"}
              number={statsData?.total_jobs || 0}
              icon={<Briefcase className="text-blue-600" size={24} />}
              iconBgColor={"bg-blue-100"}
              lineBorderClass={"border-blue-500"} />
            <NumberCard
              title={"Active Jobs"}
              number={statsData?.active_jobs || 0}
              icon={<Activity className="text-green-600" size={24} />}
              iconBgColor={"bg-green-100"}
              lineBorderClass={"border-green-500"} />
            <NumberCard
              title={"Total Applicants"}
              number={statsData?.total_applicants || 0}
              icon={<Users className="text-orange-600" size={24} />}
              iconBgColor={"bg-orange-100"}
              lineBorderClass={"border-orange-500"} />
            <NumberCard
              title={"Open Positions"}
              number={statsData?.total_positions || 0}
              icon={<Plus className="text-purple-600" size={24} />}
              iconBgColor={"bg-purple-100"}
              lineBorderClass={"border-purple-500"} />
          </div>

          {/* Jobs Table/Grid */}
          {viewMode === "list" ? (
            <div className="bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm">
                      <th className="px-6 py-4 font-semibold text-white whitespace-nowrap w-[25%] transition-all">
                        Job Title
                      </th>
                      <th className="px-6 py-4 font-semibold text-white whitespace-nowrap w-[15%]">
                        Department
                      </th>
                      <th className="px-6 py-4 font-semibold text-white whitespace-nowrap w-[12%]">
                        Type
                      </th>
                      <th className="px-6 py-4 font-semibold text-white whitespace-nowrap w-[10%]">
                        Applicants
                      </th>
                      <th className="px-6 py-4 font-semibold text-white whitespace-nowrap w-[12%]">
                        Posted Date
                      </th>
                      <th className="px-6 py-4 font-semibold text-white whitespace-nowrap w-[10%]">
                        Status
                      </th>
                      <th className="px-6 py-4 font-semibold text-center text-white whitespace-nowrap w-[16%]">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {isLoading ? (
                      // Skeleton Loading
                      Array.from({ length: 5 }).map((_, index) => (
                        <tr key={index} className="bg-white animate-pulse">
                          <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                          <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                          <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded w-20"></div></td>
                          <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                          <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                          <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded w-20"></div></td>
                          <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded w-24 mx-auto"></div></td>
                        </tr>
                      ))
                    ) : isError ? (
                      <tr><td colSpan="7" className="text-center py-12 text-red-500 font-medium">Error loading jobs. Please try again later.</td></tr>
                    ) : jobsData?.jobs?.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-20 text-center">
                          <div className="flex flex-col items-center justify-center gap-4 max-w-[600px] mx-auto animate-fadeIn">
                            <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-4 relative">
                              <div className="absolute inset-0 bg-orange-200 rounded-full animate-ping opacity-20"></div>
                              <Briefcase size={48} className="text-orange-500 relative z-10" />
                            </div>
                            <div className="space-y-3 text-center">
                              <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                                {hasActiveFilters ? "No Job Posts Found" : "Start Hiring Top Talent"}
                              </h3>
                              <p className="text-gray-500 font-medium leading-relaxed px-4">
                                {hasActiveFilters
                                  ? "We couldn't find any job posts matching your criteria. Start by creating a new job post or clear your current filters."
                                  : "You haven't created any job posts yet. Create detailed job descriptions, manage requirements, and start receiving applications."}
                              </p>
                            </div>

                            {hasActiveFilters ? (
                              <button
                                onClick={clearAllFilters}
                                className="mt-6 px-10 py-3 border-2 border-orange-500 text-orange-600 font-bold rounded-sm hover:bg-orange-50 transition-all text-xs uppercase tracking-widest shadow-sm active:scale-95"
                              >
                                Reset All Filters
                              </button>
                            ) : (
                              <ActionGuard permission="job_create" module="Recruitment" type="create">
                                <button
                                  onClick={() => {
                                    resetForm();
                                    setShowAddModal(true);
                                  }}
                                  className="mt-6 px-12 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-sm hover:from-orange-600 hover:to-orange-700 transition-all shadow-[0_10px_25px_rgba(255,123,29,0.3)] inline-flex items-center gap-3 group text-sm active:scale-95"
                                >
                                  <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                                  Create First Job
                                </button>
                              </ActionGuard>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      jobsData?.jobs.map((job, index) => (
                        <tr
                          key={job.id}
                          className="hover:bg-orange-50/50 transition-colors duration-200 group border-b border-gray-100 last:border-0"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-start gap-3 min-w-[200px] max-w-[300px]">
                              <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 mt-1">
                                <Briefcase size={16} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="font-semibold text-gray-800 block text-sm group-hover:text-orange-600 transition-colors leading-tight break-words">
                                  {job.title}
                                </span>
                                <div className="flex flex-wrap items-center gap-1 text-xs text-gray-500 mt-1 leading-normal">
                                  <MapPin size={10} className="flex-shrink-0" />
                                  <span className="break-words">{job.location}</span>
                                  <span className="flex-shrink-0">•</span>
                                  <span className="font-medium text-orange-500 flex-shrink-0">{job.positions} Positions</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-sm border border-gray-200">
                              {job.department}
                            </span>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-xs font-semibold px-2 py-1 rounded-sm bg-blue-50 text-blue-700 border border-blue-100">
                              {job.type}
                            </span>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => navigate('/hrm/applicants', { state: { jobTitle: job.title, jobId: job.id } })}
                              className="flex items-center gap-2 hover:bg-orange-50 px-3 py-1.5 rounded-sm transition-all group/count border border-transparent hover:border-orange-100"
                              title="View Job Applicants"
                            >
                              <Users size={14} className="text-gray-400 group-hover/count:text-orange-500" />
                              <span className="text-sm font-black text-gray-700 group-hover/count:text-orange-600">
                                {job.applicants}
                              </span>
                              <ArrowRight size={12} className="text-gray-300 group-hover/count:text-orange-400 opacity-0 group-hover/count:opacity-100 transition-all translate-x-[-4px] group-hover/count:translate-x-0" />
                            </button>
                          </td>

                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {new Date(job.posted_date).toLocaleDateString()}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1 text-xs font-bold rounded-sm border uppercase tracking-wide ${job.status === "Active"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : job.status === "On Hold"
                                  ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                  : "bg-gray-100 text-gray-600 border-gray-200"
                                }`}
                            >
                              {job.status}
                            </span>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  const link = `${window.location.origin}/apply/${job.application_link}`;
                                  navigator.clipboard.writeText(link);
                                  toast.success("Application link copied!");
                                }}
                                className="p-1.5 hover:bg-orange-50 text-orange-500 hover:text-orange-700 transition-all border border-transparent hover:border-orange-100"
                                title="Copy Application Link"
                              >
                                <LinkIcon size={16} />
                              </button>
                              <ActionGuard permission="job_view" module="Recruitment" type="read">
                                <button
                                  onClick={() => handleViewJob(job)}
                                  className="p-1.5 hover:bg-blue-50 text-blue-500 hover:text-blue-700 transition-all border border-transparent hover:border-blue-100"
                                  title="View Job Details"
                                >
                                  <Eye size={16} />
                                </button>
                              </ActionGuard>
                              <ActionGuard permission="job_edit" module="Recruitment" type="update">
                                <button
                                  onClick={() => handleEditJob(job)}
                                  className="p-1.5 hover:bg-green-50 text-green-500 hover:text-green-700 transition-all border border-transparent hover:border-green-100"
                                  title="Edit Job"
                                >
                                  <Edit size={16} />
                                </button>
                              </ActionGuard>
                              <ActionGuard permission="job_delete" module="Recruitment" type="delete">
                                <button
                                  onClick={() => handleDelete(job)}
                                  className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 transition-all border border-transparent hover:border-red-100 shadow-sm"
                                  title="Delete Job"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </ActionGuard>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <GenericGridView
              data={jobsData?.jobs || []}
              renderItem={(job) => (
                <div key={job.id} className="bg-white border border-gray-200 rounded-sm shadow-sm hover:shadow-md transition-all relative group flex flex-col h-full overflow-hidden">
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                      onClick={() => {
                        const link = `${window.location.origin}/apply/${job.application_link}`;
                        navigator.clipboard.writeText(link);
                        toast.success("Application link copied!");
                      }}
                      className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-sm bg-white shadow-sm border border-orange-100"
                      title="Copy Link"
                    >
                      <LinkIcon size={16} />
                    </button>
                    <ActionGuard permission="job_view" module="Recruitment" type="read">
                      <button
                        onClick={() => handleViewJob(job)}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-sm bg-white shadow-sm border border-blue-100"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                    </ActionGuard>
                    <ActionGuard permission="job_edit" module="Recruitment" type="update">
                      <button
                        onClick={() => handleEditJob(job)}
                        className="p-1.5 text-green-500 hover:bg-green-50 rounded-sm bg-white shadow-sm border border-green-100"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                    </ActionGuard>
                    <ActionGuard permission="job_delete" module="Recruitment" type="delete">
                      <button
                        onClick={() => handleDelete(job)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-sm bg-white shadow-sm border border-red-100"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </ActionGuard>
                  </div>

                  <div className="p-6 pb-4 flex-1 flex flex-col items-center mt-2 text-center">
                    <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 flex-shrink-0 border-4 border-orange-100 shadow-inner">
                      <Briefcase size={28} />
                    </div>
                    <div className="mt-4">
                      <h3 className="font-bold text-gray-800 text-lg leading-tight line-clamp-2 min-h-[48px]" title={job.title}>
                        {job.title}
                      </h3>
                      <div className="flex items-center justify-center gap-2 mt-2 text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                        <MapPin size={12} className="text-orange-500" />
                        <span className="truncate max-w-[150px]">{job.location}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-500 mt-4 line-clamp-3 min-h-[60px] leading-relaxed capitalize">
                      {job.description || "Exciting job opportunity. Join our growing team and make an impact!"}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-5 space-y-4 border-t border-gray-100 mt-auto">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">Positions</p>
                        <p className="text-base font-black text-gray-800">{job.positions}</p>
                      </div>
                      <div className="text-center p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">Applicants</p>
                        <button
                          onClick={() => navigate('/hrm/applicants', { state: { jobTitle: job.title, jobId: job.id } })}
                          className="text-base font-black text-orange-600 hover:text-orange-700 flex items-center justify-center gap-1 mx-auto"
                        >
                          <Users size={12} />
                          {job.applicants}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center px-1 pt-1">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-gray-400 font-black uppercase">Posted Date</span>
                        <span className="text-[11px] font-bold text-gray-600">{new Date(job.posted_date).toLocaleDateString()}</span>
                      </div>
                      <span
                        className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest border shadow-sm ${job.status === "Active"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : job.status === "On Hold"
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                      >
                        {job.status}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            />
          )}

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6 bg-gray-50 p-4 rounded-sm border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing <span className="font-bold">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-bold">{Math.min(currentPage * itemsPerPage, totalJobs)}</span> of <span className="font-bold">{totalJobs}</span> results
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-sm text-sm font-bold disabled:opacity-50 bg-white hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p = i + 1;
                if (totalPages > 5 && currentPage > 3) p = currentPage - 2 + i;
                if (p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`w-9 h-9 border rounded-sm text-sm font-bold flex items-center justify-center transition-colors ${currentPage === p
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded-sm text-sm font-bold disabled:opacity-50 bg-white hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>

          {/* Add/Edit Job Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-sm shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="bg-white bg-opacity-20 p-2 rounded-sm">
                      {editingJobId ? <Edit className="text-white" size={24} /> : <Plus className="text-white" size={24} />}
                    </div>
                    <h2 className="text-2xl font-bold text-white">
                      {editingJobId ? "Edit Job Posting" : "Add New Job Posting"}
                    </h2>
                  </div>
                  <button onClick={() => setShowAddModal(false)} className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-sm transition-colors">
                    <X size={24} />
                  </button>
                </div>
                <div className="p-8 space-y-6 bg-white">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                      <FileText size={16} className="text-[#FF7B1D]" /> Job Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g., Senior Software Engineer"
                      className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none transition-all text-sm text-gray-900 placeholder-gray-400 bg-white hover:border-gray-300 shadow-sm font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                        <Briefcase size={16} className="text-[#FF7B1D]" /> Department *
                      </label>
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none transition-all text-sm text-gray-900 bg-white hover:border-gray-300 shadow-sm font-medium"
                      >
                        <option value="">Select Department</option>
                        {departmentsData?.departments?.map((dept) => (
                          <option key={dept.id} value={dept.department_name}>
                            {dept.department_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                        <MapPin size={16} className="text-[#FF7B1D]" /> Location *
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="e.g., Remote, New York"
                        className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none transition-all text-sm text-gray-900 placeholder-gray-400 bg-white hover:border-gray-300 shadow-sm font-medium"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                        <Briefcase size={16} className="text-[#FF7B1D]" /> Job Type *
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none transition-all text-sm text-gray-900 bg-white hover:border-gray-300 shadow-sm font-medium"
                      >
                        <option>Full-Time Employee</option>
                        <option>Part-Time Employee</option>
                        <option>Contract Employee</option>
                        <option>Temporary Employee</option>
                        <option>Intern / Trainee</option>
                        <option>Freelancer / Consultant</option>
                        <option>Probationary Employee</option>
                        <option>Casual Employee</option>
                        <option>Remote Employee</option>
                        <option>Seasonal Employee</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                        <Users size={16} className="text-[#FF7B1D]" /> Number of Positions *
                      </label>
                      <input
                        type="number"
                        name="positions"
                        value={formData.positions}
                        onChange={handleInputChange}
                        placeholder="1"
                        min="1"
                        className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none transition-all text-sm text-gray-900 placeholder-gray-400 bg-white hover:border-gray-300 shadow-sm font-medium"
                      />
                    </div>
                  </div>

                  {/* Status selection only when editing */}
                  {editingJobId && (
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                        <CheckCircle size={16} className="text-[#FF7B1D]" /> Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none transition-all text-sm text-gray-900 bg-white hover:border-gray-300 shadow-sm font-medium"
                      >
                        <option value="Active">Active</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                      <AlignLeft size={16} className="text-[#FF7B1D]" /> Job Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="4"
                      placeholder="Describe the role, responsibilities, and requirements..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none transition-all resize-none text-sm text-gray-900 placeholder-gray-400 bg-white hover:border-gray-300 shadow-sm font-medium"
                    ></textarea>
                  </div>

                  {/* Key Responsibilities - Dynamic List */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                      <FileText size={16} className="text-[#FF7B1D]" /> Key Responsibilities
                    </label>
                    <div className="space-y-3">
                      {formData.responsibilities.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded-sm border border-gray-200">
                          <span className="flex-1 text-sm text-gray-700">{item}</span>
                          <button
                            onClick={() => removeResponsibility(index)}
                            className="text-red-500 hover:text-red-700 p-1">
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={responsibilityInput}
                          onChange={(e) => setResponsibilityInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addResponsibility()}
                          placeholder="Add a responsibility..."
                          className="flex-1 px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none transition-all text-sm text-gray-900 placeholder-gray-400 bg-white hover:border-gray-300 shadow-sm font-medium"
                        />
                        <button
                          onClick={addResponsibility}
                          className="bg-orange-500 text-white p-2 rounded-sm hover:bg-orange-600 transition-colors">
                          <Plus size={20} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Requirements - Dynamic List */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                      <CheckCircle size={16} className="text-[#FF7B1D]" /> Requirements
                    </label>
                    <div className="space-y-3">
                      {formData.requirements.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded-sm border border-gray-200">
                          <span className="flex-1 text-sm text-gray-700">{item}</span>
                          <button
                            onClick={() => removeRequirement(index)}
                            className="text-red-500 hover:text-red-700 p-1">
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={requirementInput}
                          onChange={(e) => setRequirementInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addRequirement()}
                          placeholder="Add a requirement..."
                          className="flex-1 px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none transition-all text-sm text-gray-900 placeholder-gray-400 bg-white hover:border-gray-300 shadow-sm font-medium"
                        />
                        <button
                          onClick={addRequirement}
                          className="bg-orange-500 text-white p-2 rounded-sm hover:bg-orange-600 transition-colors">
                          <Plus size={20} />
                        </button>
                      </div>
                    </div>
                  </div>


                  {/* Interview Rounds - Dynamic List */}
                  <div className="pt-6 border-t border-gray-100">
                    <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Layers size={16} className="text-[#FF7B1D]" /> Interview Rounds (Pre-Defined Sequence)
                    </label>
                    <div className="space-y-3">
                      {formData.interview_rounds.map((round, index) => (
                        <div key={index} className="flex items-center gap-2 bg-orange-50 p-3 rounded-sm border border-orange-100">
                          <span className="flex items-center justify-center w-6 h-6 bg-orange-500 text-white text-xs font-bold rounded-full">{index + 1}</span>
                          <span className="flex-1 text-sm font-bold text-gray-700 uppercase tracking-wider">{round}</span>
                          <button
                            onClick={() => removeRound(index)}
                            className="text-red-500 hover:text-red-700 p-1">
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={roundInput}
                          onChange={(e) => setRoundInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addRound()}
                          placeholder="Add a round (e.g., Technical Assessment)..."
                          className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none transition-all text-sm text-gray-900 placeholder-gray-400 hover:border-gray-300 shadow-sm font-medium"
                        />
                        <button
                          onClick={addRound}
                          className="bg-orange-500 text-white px-4 py-2.5 rounded-sm font-bold hover:bg-orange-600 transition-colors flex items-center gap-2 capitalize text-xs tracking-wider">
                          <Plus size={16} /> Add Round
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Application Form Fields - Dynamic List */}
                  <div className="pt-6 border-t border-gray-100">
                    <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <FileText size={16} className="text-[#FF7B1D]" /> Custom Application Form Fields
                    </label>
                    <div className="space-y-4">
                      {formData.application_fields.map((field, index) => (
                        <div key={index} className="flex flex-wrap items-center gap-4 bg-gray-50 p-4 rounded-sm border border-gray-200">
                          <div className="flex-1 min-w-[150px]">
                            <p className="text-xs font-bold text-gray-400 uppercase">Label</p>
                            <p className="text-sm font-bold text-gray-800">{field.label}</p>
                          </div>
                          <div className="w-24">
                            <p className="text-xs font-bold text-gray-400 uppercase">Type</p>
                            <p className="text-sm font-medium text-gray-600">{field.type}</p>
                          </div>
                          <div className="w-20">
                            <p className="text-xs font-bold text-gray-400 uppercase">Required</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${field.required ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-500'}`}>
                              {field.required ? 'YES' : 'NO'}
                            </span>
                          </div>
                          <button
                            onClick={() => removeField(index)}
                            className="text-red-500 hover:text-red-700 p-2 bg-white rounded-sm shadow-sm border border-gray-100">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}

                      {/* Add Field Inputs */}
                      <div className="bg-orange-50/50 p-6 rounded-sm border-2 border-dashed border-orange-200 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="text-xs font-bold text-orange-600 uppercase mb-1 block">Field Label</label>
                            <input
                              type="text"
                              value={fieldInput.label}
                              onChange={(e) => setFieldInput({ ...fieldInput, label: e.target.value })}
                              placeholder="e.g., Portfolio Link"
                              className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none transition-all text-sm text-gray-900 placeholder-gray-400 bg-white hover:border-gray-300 shadow-sm font-medium"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-orange-600 uppercase mb-1 block">Field Type</label>
                            <select
                              value={fieldInput.type}
                              onChange={(e) => setFieldInput({ ...fieldInput, type: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none transition-all text-sm text-gray-900 bg-white hover:border-gray-300 shadow-sm font-medium"
                            >
                              <option value="text">Text Input</option>
                              <option value="textarea">Multi-line Text</option>
                              <option value="number">Number</option>
                              <option value="email">Email Address</option>
                              <option value="tel">Phone Number</option>
                              <option value="url">Website URL</option>
                              <option value="password">Password</option>
                              <option value="date">Date Picker</option>
                              <option value="time">Time Picker</option>
                              <option value="datetime-local">Date & Time</option>
                              <option value="file">File Upload</option>
                              <option value="checkbox">Checkbox</option>
                              <option value="color">Color Picker</option>
                              <option value="range">Range Slider</option>
                            </select>
                          </div>
                          <div className="flex items-end">
                            <label className="flex items-center gap-2 cursor-pointer p-2.5">
                              <input
                                type="checkbox"
                                checked={fieldInput.required}
                                onChange={(e) => setFieldInput({ ...fieldInput, required: e.target.checked })}
                                className="w-4 h-4 accent-orange-500 rounded-sm"
                              />
                              <span className="text-sm font-bold text-gray-700">Mandatory</span>
                            </label>
                          </div>
                        </div>
                        <button
                          onClick={addField}
                          className="w-full bg-white border-2 border-orange-500 text-orange-600 px-4 py-2.5 rounded-sm font-black capitalize tracking-widest text-xs hover:bg-orange-500 hover:text-white transition-all">
                          Add Custom Field
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-4">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-8 py-2.5 border border-gray-300 text-gray-700 rounded-sm hover:bg-gray-100 transition-all font-bold shadow-sm text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-8 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-sm transition-all font-bold shadow-md hover:shadow-lg text-sm">
                    {editingJobId ? "Update Job Posting" : "Publish Job Posting"}
                  </button>
                </div>
              </div>
            </div>
          )
          }

          {/* View Job Modal */}
          {
            showViewModal && (
              <JobViewModal
                job={selectedJob}
                onClose={() => setShowViewModal(false)}
                onEdit={() => {
                  setShowViewModal(false);
                  handleEditJob(selectedJob);
                }}
              />
            )
          }

        </div >
      </div >

      {/* Delete Modal */}
      < DeleteJobModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        isLoading={deleteLoading}
        title={jobToDelete?.title || ""}
      />

    </DashboardLayout >
  );
}
