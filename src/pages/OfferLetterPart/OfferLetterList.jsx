import React, { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import {
    FileSignature, Plus, Filter, Download, Edit, Trash2, Eye,
    Search, Calendar, Building2, Briefcase,
    DollarSign, Clock, CheckCircle2, AlertCircle, AlertTriangle,
    Send, X, ChevronRight, Hash, Users, Activity, User, Mail, ChevronLeft, ChevronDown
} from "lucide-react";
import { FiHome } from "react-icons/fi";
import toast from 'react-hot-toast';
import {
    useGetOfferLettersQuery,
    useCreateOfferLetterMutation,
    useUpdateOfferLetterMutation,
    useDeleteOfferLetterMutation
} from "../../store/api/offerLetterApi";
import AddOfferLetterModal from "../../components/OfferLetter/AddOfferLetterModal";
import ViewOfferLetterModal from "../../components/OfferLetter/ViewOfferLetterModal";
import { useGetDepartmentsQuery } from "../../store/api/departmentApi";
import { useGetDesignationsQuery } from "../../store/api/designationApi";
import usePermission from "../../hooks/usePermission";
import Modal from "../../components/common/Modal";
import NumberCard from "../../components/NumberCard";
import ActionGuard from "../../components/common/ActionGuard";

const DeleteOfferLetterModal = ({ isOpen, onClose, onConfirm, isLoading, title }) => {
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
                    Are you sure you want to delete the offer letter for <span className="font-bold text-gray-900">"{title}"</span>?
                </p>
                <div className="bg-red-50 px-4 py-2 rounded-lg inline-block">
                    <p className="text-xs text-red-600 font-bold tracking-wide italic uppercase">Irreversible Action</p>
                </div>
            </div>
        </Modal>
    );
};

export default function OfferLetterList() {
    const [statusFilter, setStatusFilter] = useState("All");
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("");
    const [designationFilter, setDesignationFilter] = useState("");
    const [employmentTypeFilter, setEmploymentTypeFilter] = useState("");
    const [salaryModelFilter, setSalaryModelFilter] = useState("");

    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedOffer, setSelectedOffer] = useState(null);
    const [viewOffer, setViewOffer] = useState(null);
    const [offerToDelete, setOfferToDelete] = useState(null);
    const location = useLocation();
    const itemsPerPage = 10;

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [tempFilters, setTempFilters] = useState({
        status: "All",
        department: "",
        designation: "",
        employment_type: "",
        salary_model: ""
    });
    const statusDropdownRef = useRef(null);

    const { create, read, update, delete: canDelete } = usePermission("Offer Letter");

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
                setIsFilterOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (location.state?.applicant) {
            setSelectedOffer(location.state.applicant);
            setShowAddModal(true);
        }
    }, [location.state]);

    const queryParams = useMemo(() => ({
        page,
        limit: itemsPerPage,
        status: statusFilter,
        search: search,
        department: departmentFilter,
        designation: designationFilter,
        employment_type: employmentTypeFilter,
        salary_model: salaryModelFilter
    }), [page, statusFilter, search, departmentFilter, designationFilter, employmentTypeFilter, salaryModelFilter]);

    const { data: depts } = useGetDepartmentsQuery({ limit: 100 });
    const { data: desigs } = useGetDesignationsQuery({ limit: 100 });

    const { data, isLoading, isFetching, refetch } = useGetOfferLettersQuery(queryParams);

    const [createOfferLetter, { isLoading: creating }] = useCreateOfferLetterMutation();
    const [updateOfferLetter, { isLoading: updating }] = useUpdateOfferLetterMutation();
    const [deleteOfferLetter, { isLoading: deleteLoading }] = useDeleteOfferLetterMutation();

    const offerLetters = data?.offerLetters || [];
    const pagination = data?.pagination || { total: 0, totalPages: 1 };

    const handleCreateOffer = async (payload) => {
        try {
            await createOfferLetter(payload).unwrap();
            toast.success("Offer Letter Created");
            setShowAddModal(false);
        } catch (err) {
            toast.error(err?.data?.message || "Failed to create offer");
        }
    };

    const handleUpdateOffer = async (payload) => {
        try {
            await updateOfferLetter({ id: selectedOffer.id, ...payload }).unwrap();
            toast.success("Offer Letter Updated");
            setShowAddModal(false);
            setSelectedOffer(null);
        } catch (err) {
            toast.error(err?.data?.message || "Failed to update offer");
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await updateOfferLetter({ id, status: newStatus }).unwrap();
            toast.success(`Status updated to ${newStatus}`);
        } catch (err) {
            toast.error("Failed to update status");
        }
    };

    const handleDelete = (offer) => {
        setOfferToDelete(offer);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (offerToDelete?.id) {
            try {
                await deleteOfferLetter(offerToDelete.id).unwrap();
                toast.success("Offer Deleted");
                setShowDeleteModal(false);
                setOfferToDelete(null);
            } catch (err) {
                toast.error("Deletion Failed");
            }
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Draft': return <Clock size={12} />;
            case 'Sent': return <Send size={12} />;
            case 'Accepted': return <CheckCircle2 size={12} />;
            case 'Rejected': return <AlertCircle size={12} />;
            case 'Joined': return <Building2 size={12} />;
            default: return null;
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Draft': return "bg-gray-50 text-gray-700 border-gray-200";
            case 'Sent': return "bg-orange-50 text-orange-700 border-orange-200";
            case 'Accepted': return "bg-green-50 text-green-700 border-green-200 text-green-600";
            case 'Rejected': return "bg-red-50 text-red-700 border-red-200";
            case 'Joined': return "bg-green-50 text-green-700 border-green-200";
            case 'Partial': return "bg-blue-50 text-blue-700 border-blue-200";
            default: return "bg-slate-50 text-slate-700 border-slate-200";
        }
    };

    const renderActions = (offer) => {
        return (
            <div className="flex items-center justify-end gap-2.5">
                <ActionGuard permission="offer_letter_read" module="Offer Letter Management" type="read">
                    <button
                        onClick={() => {
                            setViewOffer(offer);
                            setShowViewModal(true);
                        }}
                        className="p-1.5 hover:bg-blue-50 rounded-sm text-blue-500 hover:text-blue-700 transition-all border border-transparent hover:border-blue-100"
                        title="View Details"
                    >
                        <Eye size={16} />
                    </button>
                </ActionGuard>
                <ActionGuard permission="offer_letter_edit" module="Offer Letter Management" type="update">
                    <button
                        onClick={() => {
                            setSelectedOffer(offer);
                            setShowAddModal(true);
                        }}
                        className="p-1.5 hover:bg-green-50 rounded-sm text-green-500 hover:text-green-700 transition-all border border-transparent hover:border-green-100"
                        title="Edit Offer"
                    >
                        <Edit size={16} />
                    </button>
                </ActionGuard>
                <ActionGuard permission="offer_letter_delete" module="Offer Letter Management" type="delete">
                    <button
                        onClick={() => handleDelete(offer)}
                        className="p-1.5 hover:bg-red-50 rounded-sm text-red-500 hover:text-red-700 transition-all border border-transparent hover:border-red-100 shadow-sm"
                        title="Delete Offer"
                    >
                        <Trash2 size={16} />
                    </button>
                </ActionGuard>
            </div>
        );
    };


    const clearAllFilters = () => {
        setSearch("");
        setStatusFilter("All");
        setDepartmentFilter("");
        setDesignationFilter("");
        setEmploymentTypeFilter("");
        setSalaryModelFilter("");
        setPage(1);
    };

    const hasActiveFilters = search || statusFilter !== "All" || departmentFilter || designationFilter || employmentTypeFilter || salaryModelFilter;

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gradient-to-br from-orange-0 via-white to-orange-100">
                <div className="bg-white sticky top-0 z-30">
                    <div className="max-w-8xl mx-auto px-4 py-4 border-b">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">
                                    Offer Letters
                                </h1>
                                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                    <FiHome className="text-gray-700" size={14} />
                                    <span className="text-gray-400"></span> HRM /{" "}
                                    <span className="text-[#FF7B1D] font-medium">
                                        Offer Management
                                    </span>
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                {/* Simplified Unified Filter Dropdown */}
                                <div className="relative" ref={statusDropdownRef}>
                                    <button
                                        onClick={() => {
                                            if (hasActiveFilters) {
                                                clearAllFilters();
                                            } else {
                                                setTempFilters({
                                                    status: statusFilter,
                                                    department: departmentFilter,
                                                    designation: designationFilter,
                                                    employment_type: employmentTypeFilter,
                                                    salary_model: salaryModelFilter
                                                });
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
                                        <div className="absolute right-0 mt-2 w-[550px] bg-white border border-gray-200 rounded-sm shadow-2xl z-50 animate-fadeIn overflow-hidden">
                                            <div className="p-4 bg-gray-50 border-b flex justify-between items-center font-primary">
                                                <span className="text-sm font-bold text-gray-800 tracking-tight capitalize">Filter Options</span>
                                                <button
                                                    onClick={() => setTempFilters({
                                                        status: "All",
                                                        department: "",
                                                        designation: "",
                                                        employment_type: "",
                                                        salary_model: ""
                                                    })}
                                                    className="text-[10px] font-bold text-orange-600 hover:text-orange-700 hover:underline capitalize font-primary"
                                                >
                                                    Reset all
                                                </button>
                                            </div>

                                            <div className="p-6 max-h-[450px] overflow-y-auto custom-scrollbar">
                                                <div className="grid grid-cols-2 gap-x-8 gap-y-10">
                                                    {/* Row 1: Status (Span 2) */}
                                                    <div className="col-span-2">
                                                        <span className="text-[11px] font-bold text-gray-700 capitalize tracking-wider block mb-3 font-primary">Record Status</span>
                                                        <div className="grid grid-cols-6 gap-2">
                                                            {["All", "Draft", "Sent", "Accepted", "Rejected", "Joined"].map((s) => (
                                                                <button
                                                                    key={s}
                                                                    onClick={() => setTempFilters({ ...tempFilters, status: s })}
                                                                    className={`px-2 py-2 rounded-sm text-[10px] font-bold transition-all border font-primary ${tempFilters.status === s
                                                                        ? "bg-orange-500 text-white border-orange-500 shadow-md scale-105"
                                                                        : "bg-white text-gray-600 border-gray-100 hover:border-orange-200"
                                                                        }`}
                                                                >
                                                                    {s}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Row 2: Department & Designation */}
                                                    <div className="space-y-2">
                                                        <span className="text-[11px] font-bold text-gray-700 capitalize tracking-wider block mb-2 font-primary">Department</span>
                                                        <select
                                                            value={tempFilters.department}
                                                            onChange={(e) => setTempFilters({ ...tempFilters, department: e.target.value })}
                                                            className="w-full bg-gray-50 border border-gray-100 rounded-sm px-4 py-2.5 text-xs font-semibold focus:border-orange-500 focus:bg-white outline-none transition-all font-primary shadow-sm"
                                                        >
                                                            <option value="">All Departments</option>
                                                            {depts?.departments?.map(d => <option key={d.id} value={d.department_name}>{d.department_name}</option>)}
                                                        </select>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <span className="text-[11px] font-bold text-gray-700 capitalize tracking-wider block mb-2 font-primary">Designation</span>
                                                        <select
                                                            value={tempFilters.designation}
                                                            onChange={(e) => setTempFilters({ ...tempFilters, designation: e.target.value })}
                                                            className="w-full bg-gray-50 border border-gray-100 rounded-sm px-4 py-2.5 text-xs font-semibold focus:border-orange-500 focus:bg-white outline-none transition-all font-primary shadow-sm"
                                                        >
                                                            <option value="">All Designations</option>
                                                            {desigs?.designations?.map(d => <option key={d.id} value={d.designation_name}>{d.designation_name}</option>)}
                                                        </select>
                                                    </div>

                                                    {/* Row 3: Employment Type & Salary Model */}
                                                    <div className="space-y-2">
                                                        <span className="text-[11px] font-bold text-gray-700 capitalize tracking-wider block mb-2 font-primary">Employment Framework</span>
                                                        <select
                                                            value={tempFilters.employment_type}
                                                            onChange={(e) => setTempFilters({ ...tempFilters, employment_type: e.target.value })}
                                                            className="w-full bg-gray-50 border border-gray-100 rounded-sm px-4 py-2.5 text-xs font-semibold focus:border-orange-500 focus:bg-white outline-none transition-all font-primary shadow-sm"
                                                        >
                                                            <option value="">All Types</option>
                                                            <option value="Full-time">Full-time</option>
                                                            <option value="Part-time">Part-time</option>
                                                            <option value="Contract">Contract</option>
                                                            <option value="Intern">Intern</option>
                                                        </select>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <span className="text-[11px] font-bold text-gray-700 capitalize tracking-wider block mb-2 font-primary">Structure Model</span>
                                                        <div className="flex gap-2 h-[41px]">
                                                            {["All", "Structured", "Simple"].map(m => (
                                                                <button
                                                                    key={m}
                                                                    onClick={() => setTempFilters({ ...tempFilters, salary_model: m === 'All' ? '' : m })}
                                                                    className={`flex-1 rounded-sm text-[10px] font-bold border transition-all font-primary shadow-sm ${(m === 'All' && !tempFilters.salary_model) || tempFilters.salary_model === m
                                                                        ? "bg-orange-500 text-white border-orange-500"
                                                                        : "bg-white text-gray-600 border-gray-100 hover:border-orange-300"
                                                                        }`}
                                                                >
                                                                    {m}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-4 bg-gray-50 border-t flex gap-3">
                                                <button
                                                    onClick={() => setIsFilterOpen(false)}
                                                    className="flex-1 py-2.5 text-[11px] font-bold text-gray-500 capitalize tracking-wider hover:bg-gray-200 transition-colors rounded-sm border border-gray-200 bg-white font-primary shadow-sm"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setStatusFilter(tempFilters.status);
                                                        setDepartmentFilter(tempFilters.department);
                                                        setDesignationFilter(tempFilters.designation);
                                                        setEmploymentTypeFilter(tempFilters.employment_type);
                                                        setSalaryModelFilter(tempFilters.salary_model);
                                                        setIsFilterOpen(false);
                                                        setPage(1);
                                                    }}
                                                    className="flex-1 py-2.5 text-[11px] font-bold text-white capitalize tracking-wider bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all rounded-sm shadow-md active:scale-95 font-primary"
                                                >
                                                    Apply filters
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>



                                <button
                                    onClick={() => { }}
                                    className="bg-white border border-gray-300 hover:bg-gray-50 px-5 py-3 rounded-sm flex items-center gap-2 transition font-semibold shadow-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed group"
                                    disabled={offerLetters.length === 0}
                                >
                                    <Download size={18} className="text-gray-700 transition-transform group-hover:scale-110" />
                                    Export
                                </button>

                                <ActionGuard permission="offer_letter_create" module="Offer Letter Management" type="create">
                                    <button
                                        onClick={() => {
                                            setSelectedOffer(null);
                                            setShowAddModal(true);
                                        }}
                                        className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-sm hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 font-semibold"
                                    >
                                        <Plus size={20} />
                                        Add Offer
                                    </button>
                                </ActionGuard>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-8xl mx-auto p-4 pt-0 mt-2">
                    {/* Stats Dashboard */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                        <NumberCard
                            title={"Total Offers"}
                            number={(pagination.total || 0).toLocaleString()}
                            icon={<FileSignature className="text-blue-600" size={24} />}
                            iconBgColor={"bg-blue-100"}
                            lineBorderClass={"border-blue-500"}
                        />
                        <NumberCard
                            title={"Active Pipeline"}
                            number={offerLetters.filter(o => o.status === 'Sent' || o.status === 'Accepted').length}
                            icon={<Activity className="text-orange-600" size={24} />}
                            iconBgColor={"bg-orange-100"}
                            lineBorderClass={"border-orange-500"}
                        />
                        <NumberCard
                            title={"Joined Talent"}
                            number={offerLetters.filter(o => o.status === 'Joined').length}
                            icon={<CheckCircle2 className="text-green-600" size={24} />}
                            iconBgColor={"bg-green-100"}
                            lineBorderClass={"border-green-500"}
                        />
                        <NumberCard
                            title={"On Hold/Rejected"}
                            number={offerLetters.filter(o => o.status === 'Rejected' || o.status === 'Draft').length}
                            icon={<AlertTriangle className="text-red-600" size={24} />}
                            iconBgColor={"bg-red-100"}
                            lineBorderClass={"border-red-500"}
                        />
                    </div>

                    {/* Table Container */}
                    <div className="bg-white rounded-sm shadow-sm overflow-hidden border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs tracking-wide">
                                        <th className="py-4 px-4 font-bold text-left w-[180px]">Reference No</th>
                                        <th className="py-4 px-4 font-bold text-left">Candidate Name</th>
                                        <th className="py-4 px-4 font-bold text-left w-[180px]">Role / Dept</th>
                                        <th className="py-4 px-4 font-bold text-center w-[150px]">Salary Model</th>
                                        <th className="py-4 px-4 font-bold text-center w-[150px]">Status</th>
                                        <th className="py-4 px-4 font-bold text-right w-[180px]">Annual CTC</th>
                                        <th className="py-4 px-4 font-bold text-right w-[120px]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {isLoading || isFetching ? (
                                        <tr>
                                            <td colSpan="7" className="py-20 text-center">
                                                <div className="flex justify-center flex-col items-center gap-4">
                                                    <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                                                    <p className="text-gray-500 font-semibold animate-pulse text-xs tracking-widest uppercase">Synchronizing records...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : offerLetters.length > 0 ? (
                                        offerLetters.map((offer, idx) => (
                                            <tr key={offer.id} className={`group border-b border-gray-100 font-primary hover:bg-orange-50/20 transition-all ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                                                <td className="py-5 px-4 whitespace-nowrap font-bold text-gray-900 text-xs tracking-tight group-hover:text-orange-600 transition-colors">
                                                    {offer.reference_no || `OFF-24-${String(offer.id).padStart(3, '0')}`}
                                                </td>
                                                <td className="py-5 px-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center text-gray-600 font-bold text-sm border border-gray-300 shadow-inner group-hover:border-orange-200 group-hover:from-orange-50 group-hover:to-orange-100 group-hover:text-orange-600 transition-all">
                                                            {offer.candidate_name?.charAt(0).toUpperCase() || 'C'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-bold text-gray-900 text-sm truncate leading-tight">{offer.candidate_name}</div>
                                                            <div className="text-[10px] font-semibold text-gray-400 truncate uppercase mt-0.5 tracking-tighter flex items-center gap-1">
                                                                <Mail size={10} /> {offer.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-5 px-4">
                                                    <div className="font-bold text-gray-900 text-sm truncate leading-tight">{offer.designation}</div>
                                                    <div className="text-[10px] font-semibold text-gray-400 truncate uppercase mt-0.5 tracking-tighter">{offer.department}</div>
                                                </td>
                                                <td className="py-5 px-4 text-center">
                                                    <span className={`px-2.5 py-1 rounded-sm text-[10px] font-bold tracking-tight shadow-sm border ${offer.salary_model === 'Structured' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                                                        {offer.salary_model || 'Structured'}
                                                    </span>
                                                </td>
                                                <td className="py-5 px-4">
                                                    <div className="flex items-center justify-center">
                                                        <div className="relative group/status flex items-center justify-center cursor-pointer">
                                                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-sm text-[10px] font-bold tracking-wider border transition-all w-fit min-w-[100px] justify-center shadow-sm uppercase ${getStatusStyles(offer.status)}`}>
                                                                {getStatusIcon(offer.status)}
                                                                {offer.status}
                                                                <ChevronDown size={11} className="opacity-40 group-hover/status:opacity-100 transition-opacity" />
                                                            </span>
                                                            <select
                                                                value={offer.status}
                                                                onChange={(e) => handleStatusUpdate(offer.id, e.target.value)}
                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-[10px]"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                {["Draft", "Sent", "Accepted", "Rejected", "Joined"].map(s => (
                                                                    <option key={s} value={s} className="text-[10px]">{s}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-5 px-4 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-bold text-gray-900 text-sm whitespace-nowrap">₹{Number(offer.annual_ctc || 0).toLocaleString('en-IN')}</span>
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Annual Package</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    {renderActions(offer)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="py-20 text-center">
                                                <div className="flex flex-col items-center justify-center gap-4 max-w-[600px] mx-auto animate-fadeIn">
                                                    <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-4 relative">
                                                        <div className="absolute inset-0 bg-orange-200 rounded-full animate-ping opacity-20"></div>
                                                        <FileSignature size={48} className="text-orange-500 relative z-10" />
                                                    </div>
                                                    <div className="space-y-3 text-center">
                                                        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                                                            {hasActiveFilters ? "No Offer Letters Found" : "Build Your Hiring Pipeline"}
                                                        </h3>
                                                        <p className="text-gray-500 font-medium leading-relaxed px-4">
                                                            {hasActiveFilters
                                                                ? "We couldn't find any offer letters matching your criteria. Start by creating a new professional offer letter or clear your current filters."
                                                                : "You haven't generated any offer letters yet. Design professional, branded offer letters in seconds and impress your future talent."}
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
                                                        <button
                                                            onClick={() => setShowAddModal(true)}
                                                            className="mt-6 px-12 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-sm hover:from-orange-600 hover:to-orange-700 transition-all shadow-[0_10px_25px_rgba(255,123,29,0.3)] inline-flex items-center gap-3 group text-sm active:scale-95"
                                                        >
                                                            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                                                            Create First Offer
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900 p-6 rounded-sm shadow-2xl mt-8">
                            <div className="text-white">
                                <p className="text-xs font-bold text-slate-400 tracking-wide mb-1">Sequence Position</p>
                                <p className="text-sm font-semibold tracking-tight">
                                    Displaying <span className="text-orange-500 text-lg">{(page - 1) * 10 + 1}</span> to <span className="text-orange-500 text-lg">{Math.min(page * 10, pagination.total)}</span> of <span className="text-slate-300">{pagination.total}</span> Talent Files
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className={`px-6 py-3 rounded-sm font-bold text-xs tracking-wide transition shadow-lg flex items-center gap-2 ${page === 1
                                        ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                                        : "bg-white text-gray-800 hover:bg-orange-50"
                                        }`}
                                >
                                    <ChevronLeft size={16} /> Backward
                                </button>
                                <div className="flex items-center gap-2 px-4 border-l border-r border-slate-700">
                                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => (
                                        <button
                                            key={i + 1}
                                            onClick={() => setPage(i + 1)}
                                            className={`w-10 h-10 rounded-sm font-bold text-xs transition-all ${page === i + 1
                                                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-110 z-10"
                                                : "text-slate-400 hover:text-white hover:bg-slate-800"
                                                }`}
                                        >
                                            {String(i + 1).padStart(2, '0')}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                    disabled={page === pagination.totalPages}
                                    className={`px-6 py-3 rounded-sm font-bold text-xs tracking-wide transition shadow-lg flex items-center gap-2 ${page === pagination.totalPages
                                        ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                                        : "bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/20 active:scale-95"
                                        }`}
                                >
                                    Forward <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <AddOfferLetterModal
                    isOpen={showAddModal}
                    onClose={() => {
                        setShowAddModal(false);
                        setSelectedOffer(null);
                    }}
                    onSubmit={selectedOffer ? handleUpdateOffer : handleCreateOffer}
                    loading={creating || updating}
                    initialData={selectedOffer}
                />

                <ViewOfferLetterModal
                    isOpen={showViewModal}
                    onClose={() => {
                        setShowViewModal(false);
                        setViewOffer(null);
                    }}
                    offer={viewOffer}
                />

                <DeleteOfferLetterModal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={confirmDelete}
                    isLoading={deleteLoading}
                    title={offerToDelete?.candidate_name || ""}
                />
            </div>
            <style>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </DashboardLayout>
    );
}
