import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import DashboardLayout from "../../components/DashboardLayout";
import { useGetUserProfileQuery, useUpdateUserProfileMutation } from "../../store/api/userApi";
import {
    User, Mail, Phone, MapPin, Calendar, CreditCard, Users,
    GraduationCap, Briefcase, ChevronDown, Edit, MessageSquare,
    CheckCircle, Loader2, Save, Shield, Heart, Globe, Upload, Building2, LayoutGrid
} from "lucide-react";
import ActionGuard from "../../components/common/ActionGuard";
import toast from "react-hot-toast";
import FormSection from "../../components/Employee/FormSection";
import { useGetDepartmentsQuery } from "../../store/api/departmentApi";
import { useGetDesignationsQuery } from "../../store/api/designationApi";

const DetailItem = ({ label, value }) => (
    <div className="space-y-1">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-slate-800">{value || 'N/A'}</p>
    </div>
);

export default function MyProfile() {
    const { user } = useSelector((state) => state.auth);
    const { data: profileData, isLoading, refetch } = useGetUserProfileQuery();
    const [updateProfile, { isLoading: isUpdating }] = useUpdateUserProfileMutation();

    const [expandedSections, setExpandedSections] = useState({
        about: true,
        bank: true,
        family: false,
        education: true,
        experience: true,
    });

    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({});

    const cleanValue = (val) => {
        if (typeof val !== 'string') return val;

        const trimmed = val.trim();
        // Check if it starts with '[' which implies it might be a JSON array (even if malformed/truncated)
        if (trimmed.startsWith('[')) {
            // 1. Try standard JSON parse if it looks complete
            if (trimmed.endsWith(']')) {
                try {
                    const parsed = JSON.parse(trimmed);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        const last = parsed[parsed.length - 1];
                        return last === null || last === undefined ? "" : String(last);
                    }
                    if (Array.isArray(parsed) && parsed.length === 0) return "";
                } catch (e) {
                    // JSON parse failed, fall through to regex
                }
            }

            // 2. Fallback: Regex to extract values from stringified array (e.g. '["val1","val2..."')
            // This handles cases where data is truncated or double-stringified
            const matches = trimmed.match(/["']([^"']+)["']/g);
            if (matches && matches.length > 0) {
                // Get the last match
                const lastMatch = matches[matches.length - 1];
                // Remove quotes
                return lastMatch.slice(1, -1);
            }
        }
        return val;
    };

    useEffect(() => {
        if (profileData) {
            if (user?.role === 'Employee') {
                const cleanedName = cleanValue(profileData.employee_name || "");
                const nameParts = cleanedName.split(" ");
                const fName = nameParts[0] || "";
                const lName = nameParts.slice(1).join(" ") || "";

                setFormData({
                    // Do NOT spread ...profileData to avoid duplicate keys (camelCase vs snake_case)
                    employeeId: profileData.employee_id || "",
                    firstName: fName,
                    lastName: cleanValue(profileData.last_name || lName), // Fallback to parsed name if last_name missing
                    employeeName: cleanedName,
                    profilePicPreview: profileData.profile_picture_url || "",
                    dob: profileData.date_of_birth ? profileData.date_of_birth.substring(0, 10) : "",
                    age: cleanValue(String(profileData.age || "")),
                    gender: cleanValue(profileData.gender || ""),
                    fatherName: cleanValue(profileData.father_name || ""),
                    motherName: cleanValue(profileData.mother_name || ""),
                    maritalStatus: cleanValue(profileData.marital_status || ""),
                    joiningDate: profileData.joining_date ? profileData.joining_date.substring(0, 10) : "",
                    department: profileData.department_id || "",
                    designation: profileData.designation_id || "",
                    employeeType: cleanValue(profileData.employee_type || "Permanent"),
                    workType: cleanValue(profileData.work_type || "WFO"),
                    mobile: cleanValue(profileData.mobile_number || ""),
                    altMobile: cleanValue(profileData.work_mobile_number || profileData.alternate_mobile_number || ""),
                    email: cleanValue(profileData.email || ""),
                    workEmail: cleanValue(profileData.work_email || ""),
                    linkedinUrl: cleanValue(profileData.linkedin_url || ""),
                    skypeId: cleanValue(profileData.skype_id || ""),
                    permanentAddress: cleanValue(profileData.permanent_address || ""),
                    permanentAddressLine1: cleanValue(profileData.permanent_address_l1 || ""),
                    permanentAddressLine2: cleanValue(profileData.permanent_address_l2 || ""),
                    permanentAddressLine3: cleanValue(profileData.permanent_address_l3 || ""),
                    permanentCity: cleanValue(profileData.permanent_city || ""),
                    permanentState: cleanValue(profileData.permanent_state || ""),
                    permanentCountry: cleanValue(profileData.permanent_country || ""),
                    permanentPincode: cleanValue(profileData.permanent_pincode || ""),
                    correspondenceAddress: cleanValue(profileData.correspondence_address || ""),
                    correspondenceCity: cleanValue(profileData.correspondence_city || ""),
                    emergencyPerson: cleanValue(profileData.emergency_contact_person || ""),
                    emergencyNumber: cleanValue(profileData.emergency_contact_number || ""),
                    bloodGroup: cleanValue(profileData.blood_group || ""),
                    languages: Array.isArray(profileData.languages)
                        ? profileData.languages
                        : (typeof profileData.languages === 'string' ? JSON.parse(profileData.languages || '[]') : []),
                    aadharNumber: cleanValue(profileData.aadhar_number || ""),
                    panNumber: cleanValue(profileData.pan_number || ""),
                    aadharFrontPreview: profileData.aadhar_front_url || "",
                    aadharBackPreview: profileData.aadhar_back_url || "",
                    panCardPreview: profileData.pan_card_url || "",
                    ifscCode: cleanValue(profileData.ifsc_code || ""),
                    accountNumber: cleanValue(profileData.account_number || ""),
                    accountHolderName: cleanValue(profileData.account_holder_name || ""),
                    branchName: cleanValue(profileData.branch_name || ""),
                    cancelChequePreview: profileData.cancelled_cheque_url || "",
                    username: cleanValue(profileData.username || ""),
                    status: profileData.status || "Active",
                    permissions: typeof profileData.permissions === 'string'
                        ? JSON.parse(profileData.permissions || '{}')
                        : (profileData.permissions || {})
                });
            } else {
                setFormData({
                    ...profileData,
                    profilePicPreview: profileData.profile_picture_url || "",
                    languages: Array.isArray(profileData.languages)
                        ? profileData.languages
                        : (typeof profileData.languages === 'string' ? JSON.parse(profileData.languages || '[]') : []),
                    permissions: typeof profileData.permissions === 'string'
                        ? JSON.parse(profileData.permissions || '{}')
                        : (profileData.permissions || {})
                });
            }
        }
    }, [profileData, user]);

    const toggleSection = (section) => {
        setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    const handleInputChange = (e) => {
        const { name, value, type, files } = e.target;
        if (type === 'file') {
            const file = files[0];
            if (file) {
                setFormData(prev => ({
                    ...prev,
                    [name]: file,
                    [`${name}Preview`]: URL.createObjectURL(file)
                }));
            }
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSave = async () => {
        try {
            const data = new FormData();

            // Fields to exclude from FormData for Admin
            const excludeFields = [
                'profile_picture', 'profile_picture_url', 'id', 'role', 'created_at',
                'profilePicPreview', 'languages', 'permissions', 'profilePic'
            ];

            Object.keys(formData).forEach(key => {
                if (excludeFields.includes(key)) return;

                if (formData[key] !== null && formData[key] !== undefined) {
                    data.append(key, formData[key]);
                }
            });

            // Specifically handle profile picture
            if (formData.profilePic instanceof File) {
                data.append('profile_picture', formData.profilePic);
            }

            await updateProfile(data).unwrap();
            toast.success("Profile updated successfully");
            setEditMode(false);
            refetch();
        } catch (error) {
            toast.error("Failed to update profile");
            console.error(error);
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    // --- ADMIN VIEW ---
    if (user?.role !== 'Employee') {
        return (
            <DashboardLayout>
                <div className="min-h-screen p-4 sm:p-6 lg:p-8 font-primary bg-gray-50/30">
                    <div className="max-w-6xl mx-auto bg-white rounded-sm shadow-md overflow-hidden border border-gray-100">
                        {/* Header Section - Inspired by BusinessInfo Gradient */}
                        <div className="bg-white border-b border-gray-100 p-8 sm:p-10 flex flex-col sm:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-6 w-full sm:w-auto">
                                <div className="relative group shrink-0">
                                    <div className="w-24 h-24 bg-gray-50 rounded-sm flex items-center justify-center text-3xl font-bold overflow-hidden border border-gray-200 shadow-sm transition-all duration-300 group-hover:border-orange-300">
                                        {formData.profilePicPreview ? (
                                            <img src={formData.profilePicPreview} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-gray-400 font-bold uppercase tracking-tighter">
                                                {profileData?.firstName?.[0]}{profileData?.lastName?.[0]}
                                            </span>
                                        )}
                                    </div>
                                    {editMode && (
                                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-300 rounded-sm">
                                            <Upload size={20} className="text-white" />
                                            <input
                                                type="file"
                                                name="profilePic"
                                                accept="image/*"
                                                onChange={handleInputChange}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>
                                <div className="text-center sm:text-left">
                                    <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
                                        {profileData?.firstName} {profileData?.lastName}
                                    </h1>
                                    <div className="flex items-center justify-center sm:justify-start gap-2 mt-1.5">
                                        <span className="px-2.5 py-1 bg-orange-50 text-orange-600 rounded-sm text-[10px] font-black tracking-widest uppercase border border-orange-100">
                                            {profileData?.role}
                                        </span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse ring-4 ring-green-50"></div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap justify-center gap-3">
                                {!editMode ? (
                                <ActionGuard permission="employee_edit" module="Employee Management" type="update">
                                    <button
                                        onClick={() => setEditMode(true)}
                                        className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-sm flex items-center gap-2.5 font-bold transition-all shadow-lg hover:shadow-orange-200 active:scale-95 text-sm"
                                    >
                                        <Edit size={18} />
                                        EDIT PROFILE
                                    </button>
                                </ActionGuard>
                                ) : (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setEditMode(false)}
                                            className="px-6 py-3 border border-gray-300 rounded-sm text-gray-700 font-bold transition-all active:scale-95 text-sm hover:bg-gray-50"
                                        >
                                            CANCEL
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={isUpdating}
                                            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-7 py-3 rounded-sm flex items-center gap-2.5 font-bold transition-all shadow-lg hover:shadow-orange-200 active:scale-95 text-sm disabled:opacity-50"
                                        >
                                            {isUpdating ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                            SAVE CHANGES
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Form Content - Mirroring BusinessInfo/AddTeam Structure */}
                        <div className="p-8 sm:p-12 space-y-10">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2.5 border-b border-gray-100 pb-4">
                                    <User className="text-orange-500" size={22} />
                                    Personal Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* First Name */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-widest">
                                            <LayoutGrid size={14} className="text-orange-500" />
                                            First Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={formData.firstName || ''}
                                            onChange={handleInputChange}
                                            disabled={!editMode}
                                            placeholder="Enter first name"
                                            className={`w-full px-4 py-3 border transition-all duration-200 font-medium text-sm outline-none rounded-sm ${editMode
                                                ? "border-gray-200 bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-50 shadow-sm"
                                                : "border-gray-50 bg-gray-50/50 text-gray-700 cursor-not-allowed"}`}
                                        />
                                    </div>

                                    {/* Last Name */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-widest">
                                            <LayoutGrid size={14} className="text-orange-500" />
                                            Last Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            value={formData.lastName || ''}
                                            onChange={handleInputChange}
                                            disabled={!editMode}
                                            placeholder="Enter last name"
                                            className={`w-full px-4 py-3 border transition-all duration-200 font-medium text-sm outline-none rounded-sm ${editMode
                                                ? "border-gray-200 bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-50 shadow-sm"
                                                : "border-gray-50 bg-gray-50/50 text-gray-700 cursor-not-allowed"}`}
                                        />
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-widest">
                                            <Mail size={14} className="text-orange-500" />
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email || ''}
                                            disabled={true}
                                            className="w-full px-4 py-3 border border-gray-50 bg-gray-50/50 text-gray-500 font-medium text-sm rounded-sm cursor-not-allowed italic"
                                        />
                                    </div>

                                    {/* Mobile */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-widest">
                                            <Phone size={14} className="text-orange-500" />
                                            Mobile Number
                                        </label>
                                        <input
                                            type="text"
                                            name="mobileNumber"
                                            value={formData.mobileNumber || ''}
                                            onChange={handleInputChange}
                                            disabled={!editMode}
                                            placeholder="Enter mobile number"
                                            className={`w-full px-4 py-3 border transition-all duration-200 font-medium text-sm outline-none rounded-sm ${editMode
                                                ? "border-gray-200 bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-50 shadow-sm"
                                                : "border-gray-50 bg-gray-50/50 text-gray-700 cursor-not-allowed"}`}
                                        />
                                    </div>

                                    {/* Address */}
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-widest">
                                            <MapPin size={14} className="text-orange-500" />
                                            Complete Address
                                        </label>
                                        <textarea
                                            name="address"
                                            value={formData.address || ''}
                                            onChange={handleInputChange}
                                            disabled={!editMode}
                                            rows={2}
                                            placeholder="Enter full residential address"
                                            className={`w-full px-4 py-3 border transition-all duration-200 font-medium text-sm outline-none rounded-sm resize-none ${editMode
                                                ? "border-gray-200 bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-50 shadow-sm"
                                                : "border-gray-50 bg-gray-50/50 text-gray-700 cursor-not-allowed"}`}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2.5 border-b border-gray-100 pb-4">
                                    <Building2 className="text-orange-500" size={22} />
                                    Business Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Business Name */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-widest">
                                            <Shield size={14} className="text-orange-500" />
                                            Business / Firm Name
                                        </label>
                                        <input
                                            type="text"
                                            name="businessName"
                                            value={formData.businessName || ''}
                                            onChange={handleInputChange}
                                            disabled={!editMode}
                                            placeholder="Enter business name"
                                            className={`w-full px-4 py-3 border transition-all duration-200 font-medium text-sm outline-none rounded-sm ${editMode
                                                ? "border-gray-200 bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-50 shadow-sm"
                                                : "border-gray-50 bg-gray-50/50 text-gray-700 cursor-not-allowed"}`}
                                        />
                                    </div>

                                    {/* GST */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-widest">
                                            <CreditCard size={14} className="text-orange-500" />
                                            GST Identification Number
                                        </label>
                                        <input
                                            type="text"
                                            name="gst"
                                            value={formData.gst || ''}
                                            onChange={handleInputChange}
                                            disabled={!editMode}
                                            placeholder="Enter GST number"
                                            className={`w-full px-4 py-3 border transition-all duration-200 font-medium text-sm outline-none rounded-sm ${editMode
                                                ? "border-gray-200 bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-50 shadow-sm"
                                                : "border-gray-50 bg-gray-50/50 text-gray-700 cursor-not-allowed"}`}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // --- EMPLOYEE VIEW ---
    const employee = profileData;

    const essentialFields = [
        'gender', 'father_name', 'mother_name', 'marital_status',
        'permanent_address_l1', 'permanent_city', 'permanent_state', 'permanent_country', 'permanent_pincode',
        'aadhar_number', 'pan_number', 'aadhar_front', 'aadhar_back', 'pan_card',
        'ifsc_code', 'account_number', 'account_holder_name', 'branch_name'
    ];

    // Map backend snake_case to camelCase for the progress calculation if needed, 
    // but the profileData from useGetUserProfileQuery should already be mapped by the API slice or controller.
    // Let's check the fields being missing.
    const getCompletionStats = () => {
        if (!employee) return { percentage: 0, missing: [] };

        const completed = essentialFields.filter(field => {
            const value = employee[field];
            return value !== null && value !== undefined && value !== '' && value !== 'null';
        });

        return {
            percentage: Math.round((completed.length / essentialFields.length) * 100),
            missing: essentialFields.filter(field => !completed.includes(field))
        };
    };

    const { percentage: completionPercentage, missing: missingFields } = getCompletionStats();

    const handleEmployeeSave = async () => {
        try {
            const data = new FormData();

            // Map camelCase to snake_case for backend
            const mapping = {
                employeeName: 'employee_name',
                profilePic: 'profile_picture',
                dob: 'date_of_birth',
                gender: 'gender',
                fatherName: 'father_name',
                motherName: 'mother_name',
                maritalStatus: 'marital_status',
                mobile: 'mobile_number',
                altMobile: 'work_mobile_number',
                email: 'email',
                workEmail: 'work_email',
                linkedinUrl: 'linkedin_url',
                skypeId: 'skype_id',
                permanentAddress: 'permanent_address',
                permanentAddressLine1: 'permanent_address_l1',
                permanentAddressLine2: 'permanent_address_l2',
                permanentAddressLine3: 'permanent_address_l3',
                permanentCity: 'permanent_city',
                permanentState: 'permanent_state',
                permanentCountry: 'permanent_country',
                permanentPincode: 'permanent_pincode',
                correspondenceAddress: 'correspondence_address',
                correspondenceCity: 'correspondence_city',
                emergencyPerson: 'emergency_contact_person',
                emergencyNumber: 'emergency_contact_number',
                bloodGroup: 'blood_group',
                languages: 'languages',
                aadharNumber: 'aadhar_number',
                panNumber: 'pan_number',
                aadharFront: 'aadhar_front',
                aadharBack: 'aadhar_back',
                panCard: 'pan_card',
                ifscCode: 'ifsc_code',
                accountNumber: 'account_number',
                accountHolderName: 'account_holder_name',
                branchName: 'branch_name',
                cancelCheque: 'cancelled_cheque',
                department: 'department_id',
                designation: 'designation_id',
                employeeType: 'employee_type',
                workType: 'work_type',
            };

            Object.keys(formData).forEach(key => {
                // Skip fields that shouldn't be updated or are frontend-only
                if (['employeeId', 'employee_id', 'id', 'user_id', 'firstName', 'lastName', 'department_name',
                    'designation_name', 'department_uid', 'designation_uid', 'permissions', 'createdAt', 'updatedAt',
                    'joiningDate', 'profilePicPreview', 'aadharFrontPreview', 'aadharBackPreview', 'panCardPreview', 'cancelChequePreview',
                    'department', 'designation', 'department_id', 'designation_id']
                    .includes(key)) {
                    return;
                }

                const backendKey = mapping[key] || key;
                if (formData[key] instanceof File) {
                    data.append(backendKey, formData[key]);
                } else if (Array.isArray(formData[key])) {
                    data.append(backendKey, JSON.stringify(formData[key]));
                } else if (formData[key] !== null && formData[key] !== undefined) {
                    data.append(backendKey, formData[key]);
                }
            });

            await updateProfile(data).unwrap();
            toast.success("Profile updated successfully!");
            setEditMode(false);
            refetch();
        } catch (err) {
            toast.error(err.data?.message || "Failed to update profile");
        }
    };

    return (
        <DashboardLayout>
            <div className="min-h-screen p-4 sm:p-6 lg:p-8">
                {/* Profile Completion Header */}
                {completionPercentage < 100 && !editMode && (
                    <div className="mb-6 bg-white rounded-sm shadow-sm border-l-4 border-orange-500 p-6 flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:shadow-md">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 ring-4 ring-orange-50 font-black text-orange-600 text-xl">
                                {completionPercentage}%
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Your profile is incomplete</h2>
                                <p className="text-gray-500 font-medium">Please provide missing details to complete your professional profile.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="flex-1 md:w-64 bg-gray-100 rounded-full h-3 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-orange-500 to-orange-600 h-full rounded-full transition-all duration-1000 shadow-sm"
                                    style={{ width: `${completionPercentage}%` }}
                                ></div>
                            </div>
                            <button
                                onClick={() => setEditMode(true)}
                                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-sm font-bold shadow-lg shadow-orange-100 transition-all active:scale-95 flex items-center gap-2"
                            >
                                <Edit size={18} />
                                Complete Now
                            </button>
                        </div>
                    </div>
                )}

                {editMode ? (
                    <div className="bg-white rounded-sm shadow-xl overflow-hidden border border-gray-100 animate-slideUp">
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 flex justify-between items-center text-white">
                            <div className="flex items-center gap-4">
                                <div className="bg-white/20 p-2 rounded-sm ring-2 ring-white/10">
                                    <User size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">Edit Profile</h2>
                                    <p className="text-white/80 text-sm font-medium italic">All changes are secure and private</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setEditMode(false)}
                                    className="px-6 py-2 rounded-sm bg-white/10 hover:bg-white/20 transition-all font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleEmployeeSave}
                                    disabled={isUpdating}
                                    className="px-8 py-2 rounded-sm bg-white text-orange-600 hover:bg-orange-50 transition-all font-black shadow-lg flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isUpdating ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                    Save Changes
                                </button>
                            </div>
                        </div>
                        <div className="p-8 h-[70vh] overflow-y-auto custom-scrollbar">
                            <FormSection
                                formData={formData}
                                handleChange={handleInputChange}
                                handleChanges={handleInputChange} // Handle differences in component
                                setFormData={setFormData}
                                mode="full"
                                hideSensitiveInfo={true}
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                                <User className="text-orange-500" />
                                My Professional Profile
                            </h1>
                            <ActionGuard permission="employee_edit" module="Employee Management" type="update">
                                <button
                                    onClick={() => setEditMode(true)}
                                    className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-sm font-bold border-2 border-gray-200 shadow-sm transition-all active:scale-95 group"
                                >
                                    <Edit size={18} className="text-orange-500 group-hover:rotate-12 transition-transform" />
                                    Edit My Profile
                                </button>
                            </ActionGuard>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Column - Profile Card */}
                            <div className="lg:col-span-1 rounded-sm shadow-lg">
                                <div className="bg-white overflow-hidden">
                                    {/* Header with Gradient */}
                                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-32 relative">
                                        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
                                            <div className="w-24 h-24 bg-white rounded-full p-1 shadow-xl">
                                                {employee?.profile_picture_url ? (
                                                    <img
                                                        src={employee.profile_picture_url}
                                                        alt="Profile"
                                                        className="w-full h-full rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-3xl">
                                                        {employee?.employee_name?.substring(0, 1)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Profile Info */}
                                    <div className="pt-16 pb-6 px-6 text-center border-b">
                                        <h2 className="text-2xl font-bold text-slate-800 flex items-center justify-center gap-2 uppercase">
                                            {cleanValue(employee?.employee_name)}
                                            {employee?.status === 'Active' && (
                                                <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                                    <CheckCircle className="w-3 h-3 text-white" />
                                                </span>
                                            )}
                                        </h2>
                                        <p className="text-orange-600 font-bold mt-1 uppercase tracking-wider">
                                            {employee?.designation_name}
                                        </p>
                                        <p className="text-slate-500 text-sm mt-1">
                                            {employee?.department_name}
                                        </p>
                                    </div>

                                    {/* Quick Info */}
                                    <div className="px-6 py-4 space-y-3 border-b">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-600 flex items-center gap-2">
                                                <CreditCard className="w-4 h-4" /> Employee ID
                                            </span>
                                            <span className="font-bold text-slate-800">
                                                {employee?.employee_id}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-600 flex items-center gap-2">
                                                <Users className="w-4 h-4" /> Department
                                            </span>
                                            <span className="font-bold text-slate-800">
                                                {employee?.department_name}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-600 flex items-center gap-2">
                                                <Calendar className="w-4 h-4" /> Date Of Join
                                            </span>
                                            <span className="font-bold text-slate-800">
                                                {employee?.joining_date ? new Date(employee.joining_date).toLocaleDateString() : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Basic Information */}
                                <div className="bg-white mt-6 px-6 pb-6 pt-6 rounded-sm shadow">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-slate-800">
                                            Basic Information
                                        </h3>
                                        {/* <Edit className="w-4 h-4 text-slate-400 cursor-pointer hover:text-orange-500" /> */}
                                    </div>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-center justify-between py-2">
                                            <span className="text-slate-500 flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-slate-400" /> Phone
                                            </span>
                                            <span className="font-bold text-slate-800">
                                                {cleanValue(employee?.mobile_number)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between py-2">
                                            <span className="text-slate-500 flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-slate-400" /> Email
                                            </span>
                                            <span className="font-bold text-blue-600">
                                                {cleanValue(employee?.email)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between py-2">
                                            <span className="text-slate-500 flex items-center gap-2">
                                                <User className="w-4 h-4 text-slate-400" /> Gender
                                            </span>
                                            <span className="font-bold text-slate-800">{cleanValue(employee?.gender)}</span>
                                        </div>
                                        <div className="flex items-start justify-between py-2">
                                            <span className="text-slate-500 flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-slate-400" /> Address
                                            </span>
                                            <span className="font-bold text-slate-800 text-right max-w-[150px]">
                                                {cleanValue(employee?.permanent_address)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Personal Information */}
                                <div className="bg-white mt-6 px-6 pb-6 pt-6 rounded-sm shadow">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-slate-800">
                                            Personal Information
                                        </h3>
                                    </div>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-center justify-between py-2">
                                            <span className="text-slate-500 flex items-center gap-2">
                                                <Shield className="w-4 h-4 text-slate-400" /> Aadhar No
                                            </span>
                                            <span className="font-bold text-slate-800">
                                                {cleanValue(employee?.aadhar_number)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between py-2">
                                            <span className="text-slate-500 flex items-center gap-2">
                                                <CreditCard className="w-4 h-4 text-slate-400" /> PAN No
                                            </span>
                                            <span className="font-bold text-slate-800">
                                                {cleanValue(employee?.pan_number)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between py-2">
                                            <span className="text-slate-500 flex items-center gap-2">
                                                <Heart className="w-4 h-4 text-slate-400" /> Marital status
                                            </span>
                                            <span className="font-bold text-slate-800">{cleanValue(employee?.marital_status)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Details */}
                            <div className="lg:col-span-2 space-y-6">

                                {/* Bank Information */}
                                <div className="bg-white rounded-sm shadow border border-gray-100 overflow-hidden">
                                    <div
                                        className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 transition-colors border-b border-gray-100"
                                        onClick={() => toggleSection("bank")}
                                    >
                                        <h3 className="font-bold text-slate-800 text-lg">
                                            Bank Information
                                        </h3>
                                        <div className="flex items-center gap-3">
                                            <ChevronDown
                                                className={`w-5 h-5 text-slate-400 transition-transform ${expandedSections.bank ? "rotate-180" : ""
                                                    }`}
                                            />
                                        </div>
                                    </div>
                                    {expandedSections.bank && (
                                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/30">
                                            <DetailItem label="Account Holder" value={cleanValue(employee?.account_holder_name)} />
                                            <DetailItem label="Account Number" value={cleanValue(employee?.account_number)} />
                                            <DetailItem label="IFSC Code" value={cleanValue(employee?.ifsc_code)} />
                                            <DetailItem label="Branch Name" value={cleanValue(employee?.branch_name)} />
                                        </div>
                                    )}
                                </div>

                                {/* Family Information */}
                                <div className="bg-white rounded-sm shadow border border-gray-100 overflow-hidden">
                                    <div
                                        className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 transition-colors border-b border-gray-100"
                                        onClick={() => toggleSection("family")}
                                    >
                                        <h3 className="font-bold text-slate-800 text-lg">
                                            Identity Documents
                                        </h3>
                                        <div className="flex items-center gap-3">
                                            <ChevronDown
                                                className={`w-5 h-5 text-slate-400 transition-transform ${expandedSections.family ? "rotate-180" : ""
                                                    }`}
                                            />
                                        </div>
                                    </div>
                                    {expandedSections.family && (
                                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50/30">
                                            <div className="space-y-2 text-center">
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Aadhar Front</p>
                                                <div className="h-40 bg-white border border-gray-200 rounded-sm overflow-hidden p-2">
                                                    {employee?.aadhar_front_url ? <img src={employee.aadhar_front_url} className="w-full h-full object-contain" /> : <div className="w-full h-full flex items-center justify-center text-gray-300 italic">No Image</div>}
                                                </div>
                                            </div>
                                            <div className="space-y-2 text-center">
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Aadhar Back</p>
                                                <div className="h-40 bg-white border border-gray-200 rounded-sm overflow-hidden p-2">
                                                    {employee?.aadhar_back_url ? <img src={employee.aadhar_back_url} className="w-full h-full object-contain" /> : <div className="w-full h-full flex items-center justify-center text-gray-300 italic">No Image</div>}
                                                </div>
                                            </div>
                                            <div className="space-y-2 text-center">
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">PAN Card</p>
                                                <div className="h-40 bg-white border border-gray-200 rounded-sm overflow-hidden p-2">
                                                    {employee?.pan_card_url ? <img src={employee.pan_card_url} className="w-full h-full object-contain" /> : <div className="w-full h-full flex items-center justify-center text-gray-300 italic">No Image</div>}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout >
    );
}
