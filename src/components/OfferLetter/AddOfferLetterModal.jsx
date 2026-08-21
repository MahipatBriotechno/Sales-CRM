import React, { useState, useEffect, useRef } from "react";
import {
    FileSignature, Save, User as UserIcon, Mail, Phone, Building2,
    Briefcase, DollarSign, Calendar, MapPin, Globe, ShieldCheck,
    ListChecks, Plus, Trash2, Layout, Settings, ChevronRight,
    ChevronLeft, Copy, Info, CheckCircle2, X, Upload, Download,
    Eye, AlertCircle, FileText, ToggleLeft, ToggleRight, Fingerprint,
    Hash, Clock, RefreshCw
} from "lucide-react";
import Modal from "../common/Modal";
import { toast } from "react-hot-toast";
import { useGetDepartmentsQuery } from "../../store/api/departmentApi";
import { useGetDesignationsQuery } from "../../store/api/designationApi";
import { useGetBusinessInfoQuery } from "../../store/api/businessApi";
import { useGetEmployeesQuery } from "../../store/api/employeeApi";
import { useGetShiftsQuery } from "../../store/api/shiftApi";

const AddOfferLetterModal = ({ isOpen, onClose, onSubmit, loading, initialData }) => {
    const [activeTab, setActiveTab] = useState(1);
    const { data: businessInfo } = useGetBusinessInfoQuery();
    const { data: departments } = useGetDepartmentsQuery({ limit: 100 });
    const { data: designations } = useGetDesignationsQuery({ limit: 100 });
    const { data: employeesData } = useGetEmployeesQuery({ limit: 1000, status: 'Active' });
    const { data: shiftsData } = useGetShiftsQuery({ limit: 100 });

    const formatTime = (timeStr) => {
        if (!timeStr) return "";
        const [hours, minutes] = timeStr.split(':');
        const h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const formattedH = h % 12 || 12;
        return `${formattedH}:${minutes} ${ampm}`;
    };

    const [formData, setFormData] = useState({
        reference_no: "",
        status: "Draft",
        salary_model: "Structured",
        company_info: {
            name: "",
            logo: "",
            address: "",
            branch_address: "",
            contact: "",
            email: "",
            website: "",
            gst_cin: ""
        },
        candidate_details: {
            name: "",
            email: "",
            phone: "",
            address: "",
            department: "",
            designation: "",
            manager: "",
            location: "",
            employment_type: "Full-time",
            employee_id: "",
            gender: "",
            dob: ""
        },
        offer_details: {
            offer_date: new Date().toISOString().split('T')[0],
            joining_date: "",
            probation_duration: "3",
            probation_unit: "Months",
            working_hours: "9:30 AM – 6:30 PM",
            working_days: "Mon–Fri",
            shift_type: "General"
        },
        salary_structure: {
            basic: 0,
            hra: 0,
            allowances: [], // { name, amount }
            incentives: 0,
            deductions: {
                pf: 0,
                esi: 0,
                tax: 0,
                other: 0
            },
            gross: 0,
            net: 0,
            annual_ctc: 0
        },
        simple_salary: {
            monthly: 0,
            annual_ctc: 0
        },
        simple_salary: {
            monthly: 0,
            annual_ctc: 0
        },
        documents_required: ["ID Proof", "Address Proof", "Educational Certificates"], // strings
        acceptance_details: {
            checkbox_enabled: true,
            remarks: ""
        },
        legal_disclaimer: {
            governing_law: "India",
            jurisdiction: "Local Courts",
            compliance_statement: "This offer is subject to successful background verification."
        },
        custom_fields: [], // { name, type, value, mandatory }
        output_control: {
            letterhead: true,
            watermark: false,
            footer_note: "Strictly Confidential"
        }
    });

    // Auto-fetch Company Info
    useEffect(() => {
        if (businessInfo && !initialData) {
            setFormData(prev => ({
                ...prev,
                company_info: {
                    name: businessInfo.company_name || "",
                    logo_url: businessInfo.logo_url || "",
                    logo: null,
                    address: businessInfo.street_address || "",
                    branch_address: businessInfo.branch_name || "",
                    contact: businessInfo.phone || "",
                    email: businessInfo.email || "",
                    website: businessInfo.website || "",
                    gst_cin: businessInfo.gst_number || businessInfo.registration_number || ""
                }
            }));
        }
    }, [businessInfo, initialData]);

    useEffect(() => {
        if (initialData && isOpen) {
            setFormData(prev => ({
                ...prev,
                ...initialData,
                company_info: { ...prev.company_info, ...(initialData.company_info || {}) },
                candidate_details: { ...prev.candidate_details, ...(initialData.candidate_details || {}) },
                offer_details: { ...prev.offer_details, ...(initialData.offer_details || {}) },
                salary_structure: { ...prev.salary_structure, ...(initialData.salary_structure || {}) }
            }));
        }
    }, [initialData, isOpen]);

    const handleUpdateNested = (section, field, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 1024 * 1024) {
                toast.error("Logo must be less than 1MB");
                return;
            }
            const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];
            if (!allowedTypes.includes(file.type)) {
                toast.error("Only PNG, JPG, or SVG files are allowed");
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                handleUpdateNested('company_info', 'logo', reader.result);
                handleUpdateNested('company_info', 'logo_url', reader.result);
                toast.success("Logo uploaded locally");
            };
            reader.readAsDataURL(file);
        }
    };

    const resetLogoToDefault = () => {
        if (businessInfo) {
            handleUpdateNested('company_info', 'logo', null);
            handleUpdateNested('company_info', 'logo_url', businessInfo.logo_url || "");
            toast.success("Reset to default business logo");
        }
    };

    const getLogoSrc = () => {
        const logo_url = formData.company_info.logo_url;
        if (logo_url) {
            if (logo_url.startsWith('http') || logo_url.startsWith('blob:') || logo_url.startsWith('data:')) {
                return logo_url;
            }
            const baseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api/', '');
            return `${baseUrl}${logo_url.startsWith('/') ? '' : '/'}${logo_url}`;
        }
        return null;
    };

    const handleSalaryChange = (field, value) => {
        setFormData(prev => {
            const structure = { ...prev.salary_structure, [field]: Number(value) || 0 };

            // Auto Calculations with safety checks
            const allowancesTotal = (structure.allowances || []).reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
            const deductions = structure.deductions || {};
            const deductionsTotal = (Number(deductions.pf) || 0) +
                (Number(deductions.esi) || 0) +
                (Number(deductions.tax) || 0) +
                (Number(deductions.other) || 0);

            structure.gross = (structure.basic || 0) + (structure.hra || 0) + allowancesTotal + (structure.incentives || 0);
            structure.net = structure.gross - deductionsTotal;
            structure.annual_ctc = (structure.gross + (Number(deductions.pf) || 0) + (Number(deductions.esi) || 0)) * 12;

            return { ...prev, salary_structure: structure };
        });
    };

    const handleSimpleSalaryChange = (field, value) => {
        setFormData(prev => {
            const simple = { ...prev.simple_salary, [field]: Number(value) || 0 };
            if (field === 'monthly') simple.annual_ctc = simple.monthly * 12;
            if (field === 'annual_ctc') simple.monthly = Math.round(simple.annual_ctc / 12);
            return { ...prev, simple_salary: simple };
        });
    };

    const addAllowance = () => {
        setFormData(prev => ({
            ...prev,
            salary_structure: {
                ...prev.salary_structure,
                allowances: [...(prev.salary_structure?.allowances || []), { name: "", amount: 0 }]
            }
        }));
    };

    const removeAllowance = (index) => {
        setFormData(prev => ({
            ...prev,
            salary_structure: {
                ...prev.salary_structure,
                allowances: (prev.salary_structure?.allowances || []).filter((_, i) => i !== index)
            }
        }));
    };

    const handleSave = async () => {
        if (!formData.candidate_details.name || !formData.candidate_details.email) {
            toast.error("Candidate Name and Email are mandatory");
            return;
        }

        const payload = {
            ...formData,
            candidate_name: formData.candidate_details.name || "",
            email: formData.candidate_details.email || "",
            phone: formData.candidate_details.phone || "",
            designation: formData.candidate_details.designation || "",
            department: formData.candidate_details.department || "",
            employee_id: formData.candidate_details.employee_id || "",
            joining_date: formData.offer_details.joining_date || null,
            offer_date: formData.offer_details.offer_date || null,
            basic_salary: formData.salary_model === 'Structured' ? (formData.salary_structure.basic || 0) : (formData.simple_salary.monthly || 0),
            net_salary: formData.salary_model === 'Structured' ? (formData.salary_structure.net || 0) : (formData.simple_salary.monthly || 0),
            annual_ctc: formData.salary_model === 'Structured' ? (formData.salary_structure.annual_ctc || 0) : (formData.simple_salary.annual_ctc || 0),
            address: formData.candidate_details.address || "",
            allowances: formData.salary_model === 'Structured' ? (formData.salary_structure.allowances || []) : [],
            deductions: formData.salary_model === 'Structured' ? (formData.salary_structure.deductions || {}) : {},
        };

        try {
            await onSubmit(payload);
            toast.success("Offer Letter saved successfully");
            onClose();
        } catch (err) {
            toast.error(err?.data?.message || "Operation failed");
        }
    };

    const tabs = [
        { id: 1, label: "Identity", icon: <UserIcon size={16} /> },
        { id: 2, label: "Core Offer", icon: <FileText size={16} /> },
        { id: 3, label: "Compensation", icon: <DollarSign size={16} /> },
        { id: 4, label: "Compliance & Control", icon: <Settings size={16} /> }
    ];

    const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 outline-none transition-all text-sm font-medium bg-white hover:border-gray-300 shadow-sm";
    const labelClass = "flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2";
    const sectionTitle = "text-sm font-bold text-gray-800 mb-4 flex items-center gap-2 border-l-4 border-orange-500 pl-3";

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? "Update Offer Letter" : "Design Offer Letter"}
            maxWidth="max-w-6xl"
            cleanLayout={true}
            icon={<div className="bg-orange-500 p-2 rounded-xl text-white shadow-lg"><FileSignature size={22} /></div>}
            footer={
                <div className="flex justify-between items-center w-full bg-gray-50 px-6 py-3 border-t">
                    <div className="flex gap-2">
                        {activeTab > 1 && (
                            <button onClick={() => setActiveTab(activeTab - 1)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-sm transition-all focus:outline-none">
                                <ChevronLeft size={18} /> Prev
                            </button>
                        )}
                        {activeTab < 4 && (
                            <button onClick={() => setActiveTab(activeTab + 1)} className="flex items-center gap-2 px-6 py-2 text-sm font-bold bg-gray-800 text-white hover:bg-black rounded-sm shadow-md transition-all focus:outline-none">
                                Next <ChevronRight size={18} />
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-6 py-2 rounded-sm border border-gray-300 text-gray-700 font-bold hover:bg-white hover:shadow-sm transition-all text-sm focus:outline-none">
                            Dismiss
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="px-10 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-sm flex items-center gap-2 font-bold shadow-[0_4px_15px_rgba(255,123,29,0.3)] hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 text-sm focus:outline-none active:scale-95"
                        >
                            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={18} />}
                            {initialData ? "Sync Changes" : "Finish & Create"}
                        </button>
                    </div>
                </div>
            }
        >
            <div className="flex flex-col h-[75vh]">
                {/* Custom Tab Navigation */}
                <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-gray-100 overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all relative shrink-0 ${activeTab === tab.id
                                ? "text-orange-600 bg-white shadow-sm border border-gray-100"
                                : "text-gray-400 hover:text-gray-600"
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white">
                    {/* Tab 1: Identity & Company */}
                    {activeTab === 1 && (
                        <div className="animate-fadeIn space-y-8">
                            <div>
                                <h3 className={sectionTitle}>1. Company Branding</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-2 grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className={labelClass}>
                                                <Building2 size={16} className="text-[#FF7B1D]" />
                                                Company Name
                                            </label>
                                            <input value={formData.company_info.name} onChange={(e) => handleUpdateNested('company_info', 'name', e.target.value)} className={inputClass} placeholder="Legal Entity Name" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>
                                                <Hash size={16} className="text-[#FF7B1D]" />
                                                GST / CIN No
                                            </label>
                                            <input value={formData.company_info.gst_cin} onChange={(e) => handleUpdateNested('company_info', 'gst_cin', e.target.value)} className={inputClass} placeholder="GSTXXXXXXXXXX" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>
                                                <Globe size={16} className="text-[#FF7B1D]" />
                                                Official Website
                                            </label>
                                            <input value={formData.company_info.website} onChange={(e) => handleUpdateNested('company_info', 'website', e.target.value)} className={inputClass} placeholder="www.company.com" />
                                        </div>
                                    </div>
                                    <div className="relative group overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 rounded-sm p-4 flex flex-col items-center justify-center text-center transition-all hover:border-orange-300 min-h-[140px]">
                                        <input
                                            type="file"
                                            onChange={handleLogoChange}
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        />

                                        <div className="relative z-0 flex flex-col items-center w-full">
                                            {getLogoSrc() ? (
                                                <div className="relative group/img">
                                                    <img
                                                        src={getLogoSrc()}
                                                        className="h-20 w-auto max-w-[180px] object-contain mb-2 transition-transform duration-300 group-hover:scale-105 rounded-sm"
                                                        alt="Company Logo"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = "https://cdn-icons-png.flaticon.com/512/121/121950.png"; // Placeholder
                                                            console.error("Logo failed to load:", e.target.src);
                                                        }}
                                                    />
                                                    <div className="absolute -top-2 -right-2 opacity-0 group-hover/img:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); resetLogoToDefault(); }}
                                                            className="p-1 bg-white shadow-md rounded-full text-rose-500 hover:bg-rose-50 border border-gray-100"
                                                            title="Use Default"
                                                        >
                                                            <RefreshCw size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-16 h-16 bg-orange-50 rounded-lg flex items-center justify-center mb-2 border border-orange-100 group-hover:bg-orange-100 transition-all duration-300 rotate-0 group-hover:rotate-6">
                                                    <Upload size={24} className="text-orange-400" />
                                                </div>
                                            )}
                                            <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Company Branding</span>
                                            <p className="text-[8px] text-gray-400 group-hover:text-orange-500 transition-colors">Click to Upload or Drag File</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <label className={labelClass}>
                                            <MapPin size={16} className="text-[#FF7B1D]" />
                                            Registered Address
                                        </label>
                                        <textarea value={formData.company_info.address} onChange={(e) => handleUpdateNested('company_info', 'address', e.target.value)} className={`${inputClass} h-20 resize-none`} placeholder="Head Office Address" />
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className={labelClass}>
                                                <Mail size={16} className="text-[#FF7B1D]" />
                                                Branch / Contact Email
                                            </label>
                                            <input value={formData.company_info.email} onChange={(e) => handleUpdateNested('company_info', 'email', e.target.value)} className={inputClass} placeholder="hr@company.com" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>
                                                <Phone size={16} className="text-[#FF7B1D]" />
                                                Contact Number
                                            </label>
                                            <input value={formData.company_info.contact} onChange={(e) => handleUpdateNested('company_info', 'contact', e.target.value)} className={inputClass} placeholder="+91 123 456 7890" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100">
                                <h3 className={sectionTitle}>2. Candidate Biography</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div>
                                        <label className={labelClass}>
                                            <UserIcon size={16} className="text-[#FF7B1D]" />
                                            Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <input value={formData.candidate_details.name} onChange={(e) => handleUpdateNested('candidate_details', 'name', e.target.value)} className={inputClass} placeholder="As per documents" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>
                                            <Mail size={16} className="text-[#FF7B1D]" />
                                            Email Address <span className="text-red-500">*</span>
                                        </label>
                                        <input type="email" value={formData.candidate_details.email} onChange={(e) => handleUpdateNested('candidate_details', 'email', e.target.value)} className={inputClass} placeholder="personal@email.com" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>
                                            <Phone size={16} className="text-[#FF7B1D]" />
                                            Mobile <span className="text-red-500">*</span>
                                        </label>
                                        <input value={formData.candidate_details.phone} onChange={(e) => handleUpdateNested('candidate_details', 'phone', e.target.value)} className={inputClass} placeholder="+91 XXXXXXXXXX" />
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className={labelClass}>
                                            <MapPin size={16} className="text-[#FF7B1D]" />
                                            Full Mailing Address <span className="text-red-500">*</span>
                                        </label>
                                        <input value={formData.candidate_details.address} onChange={(e) => handleUpdateNested('candidate_details', 'address', e.target.value)} className={inputClass} placeholder="Street, Landmark, City, State, Pincode" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>
                                            <Settings size={16} className="text-[#FF7B1D]" />
                                            Department
                                        </label>
                                        <select value={formData.candidate_details.department} onChange={(e) => handleUpdateNested('candidate_details', 'department', e.target.value)} className={inputClass}>
                                            <option value="">Choose Dept</option>
                                            {departments?.departments?.map(d => <option key={d.id} value={d.department_name}>{d.department_name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>
                                            <Briefcase size={16} className="text-[#FF7B1D]" />
                                            Job Title / Designation
                                        </label>
                                        <select value={formData.candidate_details.designation} onChange={(e) => handleUpdateNested('candidate_details', 'designation', e.target.value)} className={inputClass}>
                                            <option value="">Choose Title</option>
                                            {designations?.designations?.map(d => <option key={d.id} value={d.designation_name}>{d.designation_name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>
                                            <Layout size={16} className="text-[#FF7B1D]" />
                                            Employment Type
                                        </label>
                                        <select value={formData.candidate_details.employment_type} onChange={(e) => handleUpdateNested('candidate_details', 'employment_type', e.target.value)} className={inputClass}>
                                            <option value="Full-time">Full-time</option>
                                            <option value="Part-time">Part-time</option>
                                            <option value="Contract">Contract</option>
                                            <option value="Intern">Intern</option>
                                            <option value="Remote">Remote</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>
                                            <UserIcon size={16} className="text-[#FF7B1D]" />
                                            Reporting Manager
                                        </label>
                                        <select
                                            value={formData.candidate_details.manager}
                                            onChange={(e) => handleUpdateNested('candidate_details', 'manager', e.target.value)}
                                            className={inputClass}
                                        >
                                            <option value="">Choose Manager</option>
                                            {employeesData?.employees?.map(emp => (
                                                <option key={emp.id} value={emp.employee_name}>
                                                    {emp.employee_name} ({emp.designation_name})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>
                                            <MapPin size={16} className="text-[#FF7B1D]" />
                                            Work Location
                                        </label>
                                        <input value={formData.candidate_details.location} onChange={(e) => handleUpdateNested('candidate_details', 'location', e.target.value)} className={inputClass} placeholder="e.g. Ahmedabad, Noida" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>
                                            <Fingerprint size={16} className="text-[#FF7B1D]" />
                                            Employee ID (Optional)
                                        </label>
                                        <input value={formData.candidate_details.employee_id} onChange={(e) => handleUpdateNested('candidate_details', 'employee_id', e.target.value)} className={inputClass} placeholder="T-001X" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Core Offer */}
                    {activeTab === 2 && (
                        <div className="animate-fadeIn space-y-8">
                            <div>
                                <h3 className={sectionTitle}>3. Offer Framework</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div>
                                        <label className={labelClass}>
                                            <Hash size={16} className="text-[#FF7B1D]" />
                                            Reference Number
                                        </label>
                                        <input value={formData.reference_no} onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })} className={inputClass} placeholder="OFF-2024-XXX" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>
                                            <Calendar size={16} className="text-[#FF7B1D]" />
                                            Date of Offer
                                        </label>
                                        <input type="date" value={formData.offer_details.offer_date} onChange={(e) => handleUpdateNested('offer_details', 'offer_date', e.target.value)} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>
                                            <Calendar size={16} className="text-[#FF7B1D]" />
                                            Date of Joining
                                        </label>
                                        <input type="date" value={formData.offer_details.joining_date} onChange={(e) => handleUpdateNested('offer_details', 'joining_date', e.target.value)} className={inputClass} />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className={labelClass}>
                                            <Clock size={16} className="text-[#FF7B1D]" />
                                            Probation Duration
                                        </label>
                                        <div className="flex gap-2">
                                            <input type="number" value={formData.offer_details.probation_duration} onChange={(e) => handleUpdateNested('offer_details', 'probation_duration', e.target.value)} className={`${inputClass} w-20`} />
                                            <select value={formData.offer_details.probation_unit} onChange={(e) => handleUpdateNested('offer_details', 'probation_unit', e.target.value)} className={inputClass}>
                                                <option value="Days">Days</option>
                                                <option value="Months">Months</option>
                                                <option value="Years">Years</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>
                                            <RefreshCw size={16} className="text-[#FF7B1D]" />
                                            Shift Type
                                        </label>
                                        <select 
                                            value={formData.offer_details.shift_type} 
                                            onChange={(e) => {
                                                const selectedName = e.target.value;
                                                const shiftList = shiftsData?.shifts || shiftsData || [];
                                                const shiftInfo = shiftList.find(s => s.shift_name === selectedName);
                                                
                                                setFormData(prev => ({
                                                    ...prev,
                                                    offer_details: {
                                                        ...prev.offer_details,
                                                        shift_type: selectedName,
                                                        working_hours: shiftInfo ? `${formatTime(shiftInfo.check_in_time)} - ${formatTime(shiftInfo.check_out_time)}` : "",
                                                        working_days: shiftInfo ? shiftInfo.working_days : ""
                                                    }
                                                }));
                                            }} 
                                            className={inputClass}
                                        >
                                            <option value="">Select Shift</option>
                                            {(shiftsData?.shifts || shiftsData || []).map(s => (
                                                <option key={s.id || s.shift_name} value={s.shift_name}>{s.shift_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className={labelClass}>
                                            <Clock size={16} className="text-[#FF7B1D]" />
                                            Working Hours
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.offer_details.working_hours}
                                            onChange={(e) => handleUpdateNested('offer_details', 'working_hours', e.target.value)}
                                            className={`${inputClass} cursor-not-allowed focus:ring-0`}
                                            placeholder="e.g. 9:30 AM – 6:30 PM"
                                            readOnly
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className={labelClass}>
                                            <Calendar size={16} className="text-[#FF7B1D]" />
                                            Working Days
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.offer_details.working_days}
                                            onChange={(e) => handleUpdateNested('offer_details', 'working_days', e.target.value)}
                                            className={`${inputClass} cursor-not-allowed focus:ring-0`}
                                            placeholder="e.g. Mon–Fri"
                                            readOnly
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100">
                                <h3 className={sectionTitle}>11. Personalization & Layout</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-sm border border-gray-100">
                                    <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-100">
                                        <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <Layout size={16} className="text-[#FF7B1D]" />
                                            Company Letterhead
                                        </span>
                                        <button onClick={() => handleUpdateNested('output_control', 'letterhead', !formData.output_control.letterhead)} className="text-orange-500">
                                            {formData.output_control.letterhead ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-gray-300" />}
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-100">
                                        <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <ShieldCheck size={16} className="text-[#FF7B1D]" />
                                            Watermark Security
                                        </span>
                                        <button onClick={() => handleUpdateNested('output_control', 'watermark', !formData.output_control.watermark)} className="text-orange-500">
                                            {formData.output_control.watermark ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-gray-300" />}
                                        </button>
                                    </div>
                                    <div>
                                        <label className={labelClass}>
                                            <Save size={16} className="text-[#FF7B1D]" />
                                            Footer Custom Note
                                        </label>
                                        <input value={formData.output_control.footer_note} onChange={(e) => handleUpdateNested('output_control', 'footer_note', e.target.value)} className={inputClass} placeholder="Confidential Document" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Compensation */}
                    {activeTab === 3 && (
                        <div className="animate-fadeIn space-y-6">
                            <div className="flex items-center gap-4 mb-6">
                                <button
                                    onClick={() => setFormData({ ...formData, salary_model: 'Structured' })}
                                    className={`px-6 py-3 rounded-sm text-xs font-bold border transition-all ${formData.salary_model === 'Structured' ? 'bg-orange-500 text-white border-orange-600 shadow-md' : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-white'}`}
                                >
                                    Structured CTC
                                </button>
                                <button
                                    onClick={() => setFormData({ ...formData, salary_model: 'Simple' })}
                                    className={`px-6 py-3 rounded-sm text-xs font-bold border transition-all ${formData.salary_model === 'Simple' ? 'bg-orange-500 text-white border-orange-600 shadow-md' : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-white'}`}
                                >
                                    Simple Package
                                </button>
                            </div>

                            {formData.salary_model === 'Structured' ? (
                                <div className="space-y-6">
                                    <h3 className={sectionTitle}>4A. Component Breakdown</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div>
                                                <label className={labelClass}>
                                                    <DollarSign size={16} className="text-[#FF7B1D]" />
                                                    Basic Salary (Monthly)
                                                </label>
                                                <input type="number" value={formData.salary_structure.basic} onChange={(e) => handleSalaryChange('basic', e.target.value)} className={`${inputClass} text-lg font-bold`} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>
                                                    <DollarSign size={16} className="text-[#FF7B1D]" />
                                                    HRA Allowance
                                                </label>
                                                <input type="number" value={formData.salary_structure.hra} onChange={(e) => handleSalaryChange('hra', e.target.value)} className={inputClass} />
                                            </div>
                                            <div className="pt-2">
                                                <div className="flex justify-between items-center mb-3">
                                                    <label className={labelClass}>
                                                        <Plus size={16} className="text-[#FF7B1D]" />
                                                        Flexible Perks
                                                    </label>
                                                    <button onClick={addAllowance} className="text-xs font-bold text-orange-500">+ Add Row</button>
                                                </div>
                                                <div className="space-y-2">
                                                    {(formData.salary_structure?.allowances || []).map((a, i) => (
                                                        <div key={i} className="flex gap-2">
                                                            <input value={a.name} onChange={(e) => {
                                                                const al = [...(formData.salary_structure?.allowances || [])];
                                                                al[i].name = e.target.value;
                                                                setFormData(p => ({ ...p, salary_structure: { ...(p.salary_structure || {}), allowances: al } }));
                                                            }} className={`${inputClass} flex-1`} placeholder="e.g. Travel" />
                                                            <input type="number" value={a.amount} onChange={(e) => {
                                                                const al = [...(formData.salary_structure?.allowances || [])];
                                                                al[i].amount = Number(e.target.value);
                                                                setFormData(p => ({ ...p, salary_structure: { ...(p.salary_structure || {}), allowances: al } }));
                                                                handleSalaryChange('allowances', al);
                                                            }} className={`${inputClass} w-24`} />
                                                            <button onClick={() => removeAllowance(i)} className="p-2 text-rose-500"><Trash2 size={16} /></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 bg-rose-50/30 p-5 rounded-sm border border-rose-100">
                                            <label className="text-xs font-bold text-rose-600 mb-4 block">Statutory Deductions</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className={labelClass}>
                                                        <ShieldCheck size={16} className="text-[#FF7B1D]" />
                                                        PF (Employee)
                                                    </label>
                                                    <input type="number" value={formData.salary_structure?.deductions?.pf || 0} onChange={(e) => handleUpdateNested('salary_structure', 'deductions', { ...(formData.salary_structure?.deductions || {}), pf: Number(e.target.value) })} className={inputClass} />
                                                </div>
                                                <div>
                                                    <label className={labelClass}>
                                                        <ShieldCheck size={16} className="text-[#FF7B1D]" />
                                                        ESI
                                                    </label>
                                                    <input type="number" value={formData.salary_structure?.deductions?.esi || 0} onChange={(e) => handleUpdateNested('salary_structure', 'deductions', { ...(formData.salary_structure?.deductions || {}), esi: Number(e.target.value) })} className={inputClass} />
                                                </div>
                                                <div>
                                                    <label className={labelClass}>
                                                        <DollarSign size={16} className="text-[#FF7B1D]" />
                                                        Income Tax (TDS)
                                                    </label>
                                                    <input type="number" value={formData.salary_structure?.deductions?.tax || 0} onChange={(e) => handleUpdateNested('salary_structure', 'deductions', { ...(formData.salary_structure?.deductions || {}), tax: Number(e.target.value) })} className={inputClass} />
                                                </div>
                                                <div>
                                                    <label className={labelClass}>
                                                        <DollarSign size={16} className="text-[#FF7B1D]" />
                                                        Others
                                                    </label>
                                                    <input type="number" value={formData.salary_structure?.deductions?.other || 0} onChange={(e) => handleUpdateNested('salary_structure', 'deductions', { ...(formData.salary_structure?.deductions || {}), other: Number(e.target.value) })} className={inputClass} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
                                        <div className="bg-slate-50 p-5 rounded-sm border border-gray-100">
                                            <span className="text-xs font-bold text-gray-400 block mb-1">Gross Monthly</span>
                                            <span className="text-2xl font-bold text-gray-800">₹{(formData.salary_structure?.gross || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="bg-orange-50 p-5 rounded-sm border border-orange-100">
                                            <span className="text-xs font-bold text-orange-600 block mb-1">In-Hand Salary</span>
                                            <span className="text-2xl font-bold text-orange-600">₹{(formData.salary_structure?.net || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="bg-slate-900 p-5 rounded-sm text-white shadow-xl">
                                            <span className="text-xs font-bold text-gray-400 block mb-1">Annual CTC</span>
                                            <span className="text-2xl font-bold text-white">₹{(formData.salary_structure?.annual_ctc || 0).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-fadeIn">
                                    <h3 className={sectionTitle}>4B. Simple Pay Matrix</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-white p-6 rounded-sm border border-gray-100 shadow-sm">
                                            <label className={labelClass}>
                                                <DollarSign size={16} className="text-[#FF7B1D]" />
                                                Monthly Take Home (Net)
                                            </label>
                                            <input type="number" value={formData.simple_salary.monthly} onChange={(e) => handleSimpleSalaryChange('monthly', e.target.value)} className="w-full text-4xl font-bold text-orange-600 outline-none p-4 bg-orange-50 rounded-sm mb-4" placeholder="0" />
                                            <p className="text-xs text-gray-400 italic">Enter the fixed amount to be paid every month.</p>
                                        </div>
                                        <div className="bg-slate-900 p-6 rounded-sm shadow-xl flex flex-col justify-center">
                                            <label className="text-sm font-semibold text-orange-400 mb-2 flex items-center gap-2">
                                                <DollarSign size={16} />
                                                Annualized Value
                                            </label>
                                            <input type="number" value={formData.simple_salary.annual_ctc} onChange={(e) => handleSimpleSalaryChange('annual_ctc', e.target.value)} className="w-full text-4xl font-bold text-white bg-transparent outline-none border-b-2 border-orange-500 pb-2 mb-2" placeholder="0" />
                                            <p className="text-xs text-gray-400">Total yearly commitment (Monthly × 12)</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 4: Compliance & Control */}
                    {activeTab === 4 && (
                        <div className="animate-fadeIn space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className={sectionTitle}>7. Verification Stack</h3>
                                    <div className="grid grid-cols-1 gap-2 bg-gray-50 p-4 rounded-sm border border-gray-100">
                                        {["ID Proof", "Address Proof", "PAN Card", "Degrees", "Exp Letter", "Pay Slips", "Passport"].map(doc => (
                                            <label key={doc} className="flex items-center gap-3 p-2 bg-white rounded-sm border border-gray-100 cursor-pointer hover:border-orange-500 transition-all select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.documents_required.includes(doc)}
                                                    onChange={(e) => {
                                                        const docs = e.target.checked
                                                            ? [...formData.documents_required, doc]
                                                            : formData.documents_required.filter(d => d !== doc);
                                                        setFormData({ ...formData, documents_required: docs });
                                                    }}
                                                    className="w-4 h-4 accent-orange-500"
                                                />
                                                <span className="text-sm font-semibold text-gray-700">{doc}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className={sectionTitle}>10. Dynamic Engine (USP)</h3>
                                    <div className="space-y-4 border-2 border-dashed border-gray-200 p-5 rounded-sm flex flex-col items-center justify-center text-center bg-gray-50/50">
                                        <div className="p-3 bg-white rounded-full shadow-md text-orange-500 mb-2">
                                            <Plus size={24} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800 mb-1">Add Custom Field</p>
                                            <p className="text-xs text-gray-400 font-medium">e.g. Asset Handover, Car Policy etc.</p>
                                        </div>
                                        <button className="px-6 py-2 bg-gray-800 text-white text-xs font-bold rounded-sm hover:scale-105 transition-all shadow-lg mt-4">Inject Metadata</button>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-gray-100 bg-gray-50 -mx-6 px-6 pb-6">
                                <h3 className={sectionTitle}>9. Global Legal Guard</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4">
                                    <div className="md:col-span-2">
                                        <label className={labelClass}>
                                            <AlertCircle size={16} className="text-[#FF7B1D]" />
                                            Subject To / BGV Clause
                                        </label>
                                        <textarea value={formData.legal_disclaimer.compliance_statement} onChange={(e) => handleUpdateNested('legal_disclaimer', 'compliance_statement', e.target.value)} className={`${inputClass} h-20`} />
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className={labelClass}>
                                                <Globe size={16} className="text-[#FF7B1D]" />
                                                Governing Law
                                            </label>
                                            <input value={formData.legal_disclaimer.governing_law} onChange={(e) => handleUpdateNested('legal_disclaimer', 'governing_law', e.target.value)} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>
                                                <MapPin size={16} className="text-[#FF7B1D]" />
                                                Jurisdiction
                                            </label>
                                            <input value={formData.legal_disclaimer.jurisdiction} onChange={(e) => handleUpdateNested('legal_disclaimer', 'jurisdiction', e.target.value)} className={inputClass} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-orange-500 rounded-sm p-8 text-white shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                    <Fingerprint size={120} />
                                </div>
                                <div className="max-w-xl">
                                    <h4 className="text-lg font-bold mb-4">Ready for Launch?</h4>
                                    <p className="text-sm opacity-90 leading-relaxed mb-6">Review all sections before generating. This will create a professional PDF and can also be sent directly to the candidate via email for digital acceptance.</p>
                                    <div className="flex items-center gap-6">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center border border-white/30 group-hover:bg-white/40">
                                                <input type="checkbox" className="w-4 h-4 accent-white opacity-0 absolute" defaultChecked />
                                                <div className="w-3 h-3 bg-white rounded-sm shadow-sm" />
                                            </div>
                                            <span className="text-xs font-bold">Send Email Notification</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center border border-white/30 group-hover:bg-white/40">
                                                <input type="checkbox" className="w-4 h-4 accent-white opacity-0 absolute" defaultChecked />
                                                <div className="w-3 h-3 bg-white rounded-sm shadow-sm" />
                                            </div>
                                            <span className="text-xs font-bold">Enable Digital Signature</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
                .animate-slideDown { animation: slideDown 0.3s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes slideDown { from { height: 0; opacity: 0; } to { height: auto; opacity: 1; } }
                
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #FF7B1D; border-radius: 10px; }
                
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </Modal>
    );
};

export default AddOfferLetterModal;
