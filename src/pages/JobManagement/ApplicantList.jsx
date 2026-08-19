import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import {
    Users,
    Search,
    Filter,
    Eye,
    Trash2,
    Briefcase,
    Calendar,
    Mail,
    Phone,
    Download,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Clock,
    ArrowRight,
    Activity,
    Edit,
    Plus,
    X,
    User
} from "lucide-react";
import { FiHome } from "react-icons/fi";
import NumberCard from "../../components/NumberCard";
import {
    useGetApplicantsQuery,
    useUpdateApplicantStatusMutation,
    useDeleteApplicantMutation,
    useGetApplicantStatsQuery
} from "../../store/api/applicantApi";
import { useLazyGetJobByIdQuery, useGetJobsQuery } from "../../store/api/jobApi";
import toast from 'react-hot-toast';
import Modal from "../../components/common/Modal";

const DeleteApplicantModal = ({ isOpen, onClose, onConfirm, isLoading, title }) => {
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
                        className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 font-bold rounded-sm hover:bg-gray-100 transition-all font-primary text-xs uppercase tracking-widest"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 px-6 py-3 bg-red-600 text-white font-bold rounded-sm hover:bg-red-700 transition-all shadow-lg flex items-center justify-center gap-2 font-primary text-xs uppercase tracking-widest disabled:opacity-50"
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
                    Are you sure you want to delete applicant <span className="font-bold text-gray-900">"{title}"</span>?
                </p>
                <div className="bg-red-50 px-4 py-2 rounded-lg inline-block">
                    <p className="text-xs text-red-600 font-bold tracking-wide italic uppercase">Irreversible Action</p>
                </div>
            </div>
        </Modal>
    );
};

const ApplicantList = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const initialJobTitle = location.state?.jobTitle || "All";

    const [currentPage, setCurrentPage] = useState(1);
    const [search, setSearch] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("All");
    const [selectedJobTitle, setSelectedJobTitle] = useState(initialJobTitle);
    const [selectedApplicant, setSelectedApplicant] = useState(null);
    const [applicantToDelete, setApplicantToDelete] = useState(null);

    // Filter states
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [tempFilters, setTempFilters] = useState({
        status: "All",
        jobTitle: initialJobTitle
    });
    const dropdownRef = React.useRef(null);
    const hasActiveFilters = selectedStatus !== "All" || selectedJobTitle !== "All";

    const clearAllFilters = () => {
        setSelectedStatus("All");
        setSelectedJobTitle("All");
        setSearch("");
        setTempFilters({
            status: "All",
            jobTitle: "All"
        });
        setCurrentPage(1);
    };

    const handleApplyFilters = () => {
        setSelectedStatus(tempFilters.status);
        setSelectedJobTitle(tempFilters.jobTitle);
        setCurrentPage(1);
        setIsFilterOpen(false);
    };

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsFilterOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [editFormData, setEditFormData] = useState({
        name: "",
        email: "",
        phone: "",
        status: "",
        current_round_index: 0,
        interview_rounds: [],
        job_id: "",
        job_title: ""
    });

    const itemsPerPage = 10;


    const { data: applicantsData, isLoading, isError } = useGetApplicantsQuery({
        page: currentPage,
        limit: itemsPerPage,
        search,
        status: selectedStatus,
        job_title: selectedJobTitle
    });

    // Fetch jobs for filter dropdown
    const { data: jobsData } = useGetJobsQuery({ page: 1, limit: 100 });
    const jobTitles = jobsData?.jobs?.map(job => job.title) || [];
    const uniqueJobTitles = [...new Set(jobTitles)];

    const { data: statsData } = useGetApplicantStatsQuery();
    const [updateStatus] = useUpdateApplicantStatusMutation();
    const [deleteApplicant, { isLoading: deleteLoading }] = useDeleteApplicantMutation();

    const safeParse = (data, fallback = []) => {
        if (!data) return fallback;
        if (typeof data !== 'string') return data;
        try {
            const firstParse = JSON.parse(data);
            if (typeof firstParse === 'string') {
                try {
                    return JSON.parse(firstParse);
                } catch (e) {
                    return firstParse;
                }
            }
            return firstParse;
        } catch (e) {
            console.error("Error parsing JSON:", e);
            return fallback;
        }
    };

    const handleViewApplicant = async (applicant) => {
        let rounds = safeParse(applicant.interview_rounds, []);

        if (rounds.length === 0 && applicant.job_id) {
            try {
                const jobData = await triggerGetJob(applicant.job_id).unwrap();
                rounds = safeParse(jobData.interview_rounds, []);
            } catch (error) {
                console.error("Failed to fetch job rounds:", error);
            }
        }

        setSelectedApplicant({
            ...applicant,
            interview_rounds: rounds
        });
        setShowViewModal(true);
    };

    const [triggerGetJob] = useLazyGetJobByIdQuery();

    const handleEditApplicant = async (applicant) => {
        setSelectedApplicant(applicant);
        let rounds = safeParse(applicant.interview_rounds, []);

        // If rounds are empty, try to fetch them from the job record
        if (rounds.length === 0 && applicant.job_id) {
            try {
                const jobData = await triggerGetJob(applicant.job_id).unwrap();
                rounds = safeParse(jobData.interview_rounds, []);
            } catch (error) {
                console.error("Failed to fetch job rounds:", error);
            }
        }

        setEditFormData({
            name: applicant.name,
            email: applicant.email,
            phone: applicant.phone || "",
            status: applicant.status,
            current_round_index: applicant.current_round_index,
            interview_rounds: rounds,
            job_id: applicant.job_id,
            job_title: applicant.job_title
        });
        setShowEditModal(true);
    };

    const [updatingFeedback, setUpdatingFeedback] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdateStatus = async (id, newStatus, currentRoundIdx = 0) => {
        setIsUpdating(true);
        try {
            await updateStatus({
                id,
                status: newStatus,
                current_round_index: currentRoundIdx,
                interview_feedback: updatingFeedback
            }).unwrap();
            toast.success(`Status updated to ${newStatus}`);
            setUpdatingFeedback("");
            setShowViewModal(false);
        } catch (error) {
            toast.error("Failed to update status");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSaveEdit = async () => {
        setIsUpdating(true);
        try {
            await updateStatus({
                id: selectedApplicant.id,
                ...editFormData
            }).unwrap();
            toast.success("Applicant details updated successfully");
            setShowEditModal(false);
        } catch (error) {
            toast.error("Failed to update applicant");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = (applicant) => {
        setApplicantToDelete(applicant);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (applicantToDelete?.id) {
            try {
                await deleteApplicant(applicantToDelete.id).unwrap();
                toast.success("Applicant deleted successfully");
                setShowDeleteModal(false);
                setApplicantToDelete(null);
            } catch (error) {
                toast.error("Failed to delete applicant");
            }
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Applied': return 'bg-blue-100 text-blue-700';
            case 'Screening': return 'bg-purple-100 text-purple-700';
            case 'Technical': return 'bg-indigo-100 text-indigo-700';
            case 'HR': return 'bg-pink-100 text-pink-700';
            case 'Final': return 'bg-orange-100 text-orange-700';
            case 'Selected': return 'bg-green-100 text-green-700';
            case 'Rejected': return 'bg-red-100 text-red-700';
            case 'Offer Sent': return 'bg-emerald-100 text-emerald-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gradient-to-br from-orange-0 via-white to-orange-100">
                <div className="bg-white sticky top-0 z-30">
                    <div className="max-w-8xl mx-auto px-4 py-4 border-b">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Applicant Management</h1>
                                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                        <FiHome className="text-gray-400" />
                                        <span>HRM / Recruitment / </span>
                                        <span className="text-orange-500 font-medium">Applicants</span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                                        className={`p-3 rounded-sm border transition shadow-sm ${isFilterOpen || hasActiveFilters
                                            ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-500"
                                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                                            }`}
                                    >
                                        {hasActiveFilters && !isFilterOpen ? <X size={18} onClick={(e) => { e.stopPropagation(); clearAllFilters(); }} /> : <Filter size={18} />}
                                    </button>

                                    {isFilterOpen && (
                                        <div className="absolute right-0 mt-2 w-[450px] bg-white border border-gray-200 rounded-sm shadow-2xl z-50 animate-fadeIn overflow-hidden">
                                            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                                                <span className="text-sm font-bold text-gray-800 tracking-tight capitalize font-primary">Filter Applicants</span>
                                                <button
                                                    onClick={clearAllFilters}
                                                    className="text-[10px] font-bold text-orange-600 hover:text-orange-700 hover:underline capitalize font-primary"
                                                >
                                                    Reset all
                                                </button>
                                            </div>

                                            <div className="p-6">
                                                <div className="space-y-6">
                                                    {/* Status Filter */}
                                                    <div className="space-y-3">
                                                        <span className="text-[11px] font-bold text-gray-700 capitalize tracking-wider block font-primary">Application Status</span>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {['All', 'Applied', 'Screening', 'Technical', 'HR', 'Final', 'Selected', 'Rejected', 'Offer Sent'].map((s) => (
                                                                <button
                                                                    key={s}
                                                                    onClick={() => setTempFilters({ ...tempFilters, status: s })}
                                                                    className={`px-2 py-2 rounded-sm text-[10px] font-bold transition-all border font-primary ${tempFilters.status === s
                                                                        ? "bg-orange-500 text-white border-orange-500 shadow-md"
                                                                        : "bg-white text-gray-600 border-gray-100 hover:border-orange-200"
                                                                        }`}
                                                                >
                                                                    {s}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Job Title Filter */}
                                                    <div className="space-y-2">
                                                        <span className="text-[11px] font-bold text-gray-700 capitalize tracking-wider block font-primary">Filter By Job</span>
                                                        <select
                                                            value={tempFilters.jobTitle}
                                                            onChange={(e) => setTempFilters({ ...tempFilters, jobTitle: e.target.value })}
                                                            className="w-full bg-gray-50 border border-gray-100 rounded-sm px-4 py-2.5 text-xs font-semibold focus:border-orange-500 focus:bg-white outline-none transition-all font-primary"
                                                        >
                                                            <option value="All">All Job Posts</option>
                                                            {uniqueJobTitles.map((title, index) => (
                                                                <option key={index} value={title}>{title}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="mt-8 flex gap-3">
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
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-8xl mx-auto p-4 pt-0 mt-2">
                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        <NumberCard
                            title="Total Applicants"
                            number={statsData?.total_applicants || 0}
                            icon={<Users className="text-blue-600" size={24} />}
                            iconBgColor="bg-blue-100"
                            lineBorderClass="border-blue-500"
                        />
                        <NumberCard
                            title="In Process"
                            number={statsData?.in_process || 0}
                            icon={<Clock className="text-orange-600" size={24} />}
                            iconBgColor="bg-orange-100"
                            lineBorderClass="border-orange-500"
                        />
                        <NumberCard
                            title="Selected"
                            number={statsData?.selected || 0}
                            icon={<CheckCircle className="text-green-600" size={24} />}
                            iconBgColor="bg-green-100"
                            lineBorderClass="border-green-500"
                        />
                        <NumberCard
                            title="Rejected"
                            number={statsData?.rejected || 0}
                            icon={<XCircle className="text-red-600" size={24} />}
                            iconBgColor="bg-red-100"
                            lineBorderClass="border-red-500"
                        />
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-sm shadow-md overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-orange-500 to-orange-600">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-white whitespace-nowrap">Applicant</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-white whitespace-nowrap">Job Role</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-white whitespace-nowrap">Applied Date</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-white whitespace-nowrap">Status</th>
                                        <th className="px-6 py-4 text-center text-sm font-bold text-white whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {isLoading ? (
                                        [...Array(5)].map((_, i) => (
                                            <tr key={i} className="animate-pulse bg-white">
                                                <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                                                <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                                                <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                                                <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded w-16"></div></td>
                                                <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded w-24 mx-auto"></div></td>
                                            </tr>
                                        ))
                                    ) : applicantsData?.applicants?.map((applicant, index) => (
                                        <tr key={applicant.id} className={`hover:bg-orange-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-2 rounded-sm">
                                                        <Users className="text-white" size={18} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-gray-800">{applicant.name}</span>
                                                        <span className="text-xs text-gray-500">{applicant.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Briefcase size={14} className="text-orange-500" />
                                                    <span className="text-sm font-medium text-gray-700">{applicant.job_title}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {new Date(applicant.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-sm text-xs font-semibold ${getStatusStyle(applicant.status)}`}>
                                                    {applicant.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleViewApplicant(applicant)}
                                                        className="p-1 hover:bg-orange-100 rounded-sm text-blue-500 hover:text-blue-700 transition-all"
                                                        title="View Details"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditApplicant(applicant)}
                                                        className="p-1 hover:bg-orange-100 rounded-sm text-green-500 hover:text-green-700 transition-all"
                                                        title="Edit Applicant"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(applicant)}
                                                        className="p-1 hover:bg-orange-100 rounded-sm text-red-500 hover:text-red-700 transition-all"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* View Applicant Details Modal */}
            < Modal
                isOpen={showViewModal}
                onClose={() => {
                    setShowViewModal(false);
                    setUpdatingFeedback("");
                }}
                title="Applicant Details"
                maxWidth="max-w-5xl"
                icon={< User size={24} />}
            >
                {selectedApplicant && (
                    <div className="">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Basic Info */}
                            <div className="space-y-6">
                                <div className="border-b pb-4">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Users className="text-orange-500" size={20} />
                                        Personal Information
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                                            <span className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                                <Users size={16} /> Name
                                            </span>
                                            <span className="text-sm font-bold text-gray-900">{selectedApplicant.name}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                                            <span className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                                <Mail size={16} /> Email
                                            </span>
                                            <span className="text-sm font-bold text-gray-900">{selectedApplicant.email}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                                            <span className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                                <Phone size={16} /> Phone
                                            </span>
                                            <span className="text-sm font-bold text-gray-900">{selectedApplicant.phone || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Briefcase className="text-orange-500" size={20} />
                                        Job Details
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                                            <span className="text-sm font-medium text-gray-500">Position</span>
                                            <span className="text-sm font-bold text-gray-900">{selectedApplicant.job_title}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                                            <span className="text-sm font-medium text-gray-500">Department</span>
                                            <span className="text-sm font-bold text-gray-900">{selectedApplicant.department}</span>
                                        </div>
                                        {selectedApplicant.resume && (
                                            <a
                                                href={`${import.meta.env.VITE_API_BASE_URL}/${selectedApplicant.resume}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2 w-full py-3 bg-orange-500 text-white rounded-sm font-bold hover:bg-orange-600 transition-colors mt-4"
                                            >
                                                <Download size={18} /> Download Resume
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Dynamic Fields Data */}
                                {selectedApplicant.application_data && Object.keys(safeParse(selectedApplicant.application_data, {})).length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <Activity className="text-orange-500" size={20} />
                                            Additional Information
                                        </h3>
                                        <div className="grid grid-cols-1 gap-3">
                                            {Object.entries(safeParse(selectedApplicant.application_data, {})).map(([key, value]) => (
                                                <div key={key} className="flex flex-col bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{key.replace(/_/g, ' ')}</span>
                                                    <span className="text-sm font-bold text-gray-800 mt-1">{value || 'N/A'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Interview Process */}
                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <Calendar className="text-orange-500" size={20} />
                                    Recruitment Process
                                </h3>

                                <div className="space-y-8 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                                    {/* Entry point: Applied */}
                                    <div className="relative pl-10">
                                        <div className={`absolute left-0 w-8 h-8 rounded-full border-4 flex items-center justify-center z-10 bg-green-500 border-green-100 text-white`}>
                                            <CheckCircle size={14} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">Application Received</h4>
                                            <p className="text-[10px] font-bold text-green-600 uppercase mt-1">Completed</p>
                                        </div>
                                    </div>

                                    {/* Rounds defined by HR during Job Creation */}
                                    {safeParse(selectedApplicant.interview_rounds, []).length > 0 ? (
                                        safeParse(selectedApplicant.interview_rounds, []).map((round, index) => {
                                            const interviewRounds = safeParse(selectedApplicant.interview_rounds, []);
                                            const isCurrent = selectedApplicant.current_round_index === index && selectedApplicant.status !== 'Selected' && selectedApplicant.status !== 'Rejected';
                                            const isCompleted = selectedApplicant.current_round_index > index || selectedApplicant.status === 'Selected';
                                            const isPending = selectedApplicant.current_round_index < index && selectedApplicant.status !== 'Selected';

                                            return (
                                                <div key={index} className="relative pl-10">
                                                    <div className={`absolute left-0 w-8 h-8 rounded-full border-4 flex items-center justify-center z-10 
                                                        ${isCompleted ? 'bg-green-500 border-green-100 text-white' :
                                                            isCurrent ? 'bg-orange-500 border-orange-100 text-white animate-pulse' :
                                                                'bg-white border-gray-200 text-gray-400'}`}>
                                                        {isCompleted ? <CheckCircle size={14} /> : index + 1}
                                                    </div>
                                                    <div className={`${isPending ? 'opacity-50' : ''}`}>
                                                        <h4 className={`font-bold transition-all ${isCurrent ? 'text-orange-600' : 'text-gray-900'}`}>{round}</h4>

                                                        {isCurrent && (
                                                            <div className="mt-4 space-y-4 bg-white p-4 rounded-xl border border-orange-100 shadow-sm">
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block tracking-widest">Internal Feedback / Notes</label>
                                                                    <textarea
                                                                        value={updatingFeedback}
                                                                        onChange={(e) => setUpdatingFeedback(e.target.value)}
                                                                        placeholder="Add assessment notes or reasons for passing/failing..."
                                                                        className="w-full p-4 py-3 text-sm bg-white border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none transition-all h-20 placeholder-gray-400 hover:border-gray-300 shadow-sm font-medium"
                                                                    />
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        disabled={isUpdating}
                                                                        onClick={() => handleUpdateStatus(selectedApplicant.id, index === interviewRounds.length - 1 ? 'Selected' : interviewRounds[index + 1], index + 1)}
                                                                        className="flex-1 py-2 bg-green-600 text-white text-xs font-black uppercase tracking-widest rounded-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                                                    >
                                                                        {isUpdating ? 'Updating...' : <>Pass Round <ArrowRight size={14} /></>}
                                                                    </button>
                                                                    <button
                                                                        disabled={isUpdating}
                                                                        onClick={() => handleUpdateStatus(selectedApplicant.id, 'Rejected')}
                                                                        className="px-4 py-2 bg-rose-100 text-rose-600 text-xs font-black uppercase tracking-widest rounded-sm hover:bg-rose-200 transition-colors flex items-center gap-2 disabled:opacity-50"
                                                                    >
                                                                        <XCircle size={14} /> Fail
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {isCompleted && (
                                                            <p className="text-[10px] font-bold text-green-600 uppercase mt-1">Cleared</p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="bg-white p-6 rounded-xl border border-dashed border-gray-200 text-center">
                                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No Interview Rounds Defined</p>
                                            <p className="text-xs text-gray-500 mt-2">Edit the job posting to add recruitment steps.</p>
                                        </div>
                                    )}

                                    {/* Final Steps */}
                                    {selectedApplicant.status === 'Selected' && (
                                        <div className="relative pl-10 mt-6 pt-6 border-t border-gray-200">
                                            <div className="absolute left-0 w-8 h-8 rounded-full bg-green-100 border-green-500 border-2 flex items-center justify-center text-green-600">
                                                <CheckCircle size={18} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-green-700">Selection Confirmed</h4>
                                                <p className="text-xs text-gray-500 mt-1">Ready for Offer Letter generation</p>
                                                <button
                                                    onClick={() => navigate('/hrm/offer-letters', {
                                                        state: {
                                                            applicant: {
                                                                candidate_name: selectedApplicant.name,
                                                                email: selectedApplicant.email,
                                                                phone: selectedApplicant.phone,
                                                                designation: selectedApplicant.job_title,
                                                                department: selectedApplicant.department
                                                            }
                                                        }
                                                    })}
                                                    className="mt-3 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-bold rounded-sm shadow-md hover:opacity-90 transition-all flex items-center gap-2"
                                                >
                                                    Generate Offer Letter
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal >

            {/* Edit Applicant Modal */}
            < Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Edit Applicant & Rounds"
                maxWidth="max-w-4xl"
                icon={< Edit size={24} />}
            >
                {selectedApplicant && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                    <User size={16} className="text-[#FF7B1D]" />
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none transition-all text-sm text-gray-900 placeholder-gray-400 bg-white hover:border-gray-300 shadow-sm font-medium"
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                    <Mail size={16} className="text-[#FF7B1D]" />
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={editFormData.email}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none transition-all text-sm text-gray-900 placeholder-gray-400 bg-white hover:border-gray-300 shadow-sm font-medium"
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                    <Phone size={16} className="text-[#FF7B1D]" />
                                    Phone
                                </label>
                                <input
                                    type="text"
                                    value={editFormData.phone}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none transition-all text-sm text-gray-900 placeholder-gray-400 bg-white hover:border-gray-300 shadow-sm font-medium"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-orange-50 p-4 rounded-sm border border-orange-100">
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-orange-800 uppercase tracking-wide mb-1">
                                    <Briefcase size={16} className="text-[#FF7B1D]" />
                                    Applying For (Job ID)
                                </label>
                                <div className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <span className="bg-white text-orange-600 px-2 py-0.5 rounded border border-orange-200 text-xs">ID: {editFormData.job_id}</span>
                                    <span className="truncate">{editFormData.job_title}</span>
                                </div>
                            </div>
                            <div className="flex flex-col justify-center">
                                <label className="flex items-center gap-2 text-xs font-bold text-orange-800 uppercase tracking-wide mb-1">
                                    <Calendar size={16} className="text-[#FF7B1D]" />
                                    Application Date
                                </label>
                                <div className="text-sm font-bold text-gray-700">
                                    {selectedApplicant.created_at ? new Date(selectedApplicant.created_at).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'N/A'}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-gray-100">
                            <div className="space-y-6">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
                                        <Activity size={16} className="text-[#FF7B1D]" />
                                        Interview Rounds
                                    </label>
                                    <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto pr-2">
                                        {editFormData.interview_rounds.length > 0 ? (
                                            editFormData.interview_rounds.map((round, index) => {
                                                const isCompleted = editFormData.current_round_index > index || editFormData.status === 'Selected';
                                                return (
                                                    <div key={index} className={`flex items-center gap-4 p-4 rounded-sm border transition-all ${isCompleted ? 'bg-orange-50 border-orange-200 shadow-sm' : 'bg-white border-gray-200 hover:border-orange-300'}`}>
                                                        <div className="flex-shrink-0">
                                                            <input
                                                                type="checkbox"
                                                                checked={isCompleted}
                                                                onChange={(e) => {
                                                                    const checked = e.target.checked;
                                                                    let newIdx = editFormData.current_round_index;
                                                                    let newStatus = editFormData.status;

                                                                    if (checked) {
                                                                        newIdx = index + 1;
                                                                        if (newIdx === editFormData.interview_rounds.length) {
                                                                            newStatus = 'Selected';
                                                                        } else {
                                                                            newStatus = editFormData.interview_rounds[newIdx];
                                                                        }
                                                                    } else {
                                                                        newIdx = index;
                                                                        newStatus = index === 0 ? 'Applied' : editFormData.interview_rounds[index];
                                                                    }

                                                                    setEditFormData(prev => ({
                                                                        ...prev,
                                                                        current_round_index: newIdx,
                                                                        status: newStatus
                                                                    }));
                                                                }}
                                                                className="w-5 h-5 rounded border-2 border-orange-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <input
                                                                type="text"
                                                                readOnly
                                                                value={round}
                                                                className={`w-full bg-transparent border-none outline-none text-sm font-semibold uppercase tracking-wide ${isCompleted ? 'text-orange-900' : 'text-gray-500'}`}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="py-8 text-center bg-gray-50 rounded-sm border-2 border-dashed border-gray-200">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No rounds defined for this applicant</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <Filter size={16} className="text-[#FF7B1D]" />
                                        Process Management
                                    </label>
                                    <div className="bg-gray-50 p-6 rounded-sm border border-gray-200 space-y-6">
                                        <div>
                                            <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase mb-2">
                                                <Clock size={16} className="text-[#FF7B1D]" />
                                                Current Active Round
                                            </label>
                                            <select
                                                value={editFormData.current_round_index}
                                                onChange={(e) => setEditFormData(prev => ({ ...prev, current_round_index: Number(e.target.value) }))}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none bg-white text-sm text-gray-900 hover:border-gray-300 shadow-sm font-medium transition-all"
                                            >
                                                <option value={-1}>Pre-Interview (Applied)</option>
                                                {editFormData.interview_rounds.map((r, i) => (
                                                    <option key={i} value={i}>Round {i + 1}: {r}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase mb-2">
                                                <CheckCircle size={16} className="text-[#FF7B1D]" />
                                                Overall Status
                                            </label>
                                            <select
                                                value={editFormData.status}
                                                onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value }))}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none bg-white text-sm text-gray-900 hover:border-gray-300 shadow-sm font-medium transition-all"
                                            >
                                                <option value="Applied">Applied</option>
                                                <option value="In Process">In Process</option>
                                                {editFormData.interview_rounds.map(r => (
                                                    <option key={r} value={r}>{r}</option>
                                                ))}
                                                <option value="Selected">Selected</option>
                                                <option value="Rejected">Rejected</option>
                                                <option value="Offer Sent">Offer Sent</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-8 border-t border-gray-100">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 font-bold text-sm rounded-sm hover:bg-gray-50 transition-all shadow-sm"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={isUpdating}
                                onClick={handleSaveEdit}
                                className="flex-[2] py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-sm rounded-sm shadow-md hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50"
                            >
                                {isUpdating ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal >

            <DeleteApplicantModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                isLoading={deleteLoading}
                title={applicantToDelete?.name || ""}
            />
        </DashboardLayout >
    );
};

export default ApplicantList;
