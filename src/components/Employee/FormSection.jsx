import React, { useState, useEffect } from "react";
import {
  User,
  Briefcase,
  Phone,
  FileText,
  CreditCard,
  Key,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  X,
  GraduationCap,
  Plus,
  Trash2,
  Calendar,
  Users,
  Building,
  MapPin,
  Mail,
  Linkedin,
  Globe,
  MessageSquare,
  AlertCircle,
  Activity,
  Languages,
  DollarSign,
  Upload,
  Lock,
  Clock,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff
} from "lucide-react";
import { useGetDepartmentsQuery } from "../../store/api/departmentApi";
import { useGetDesignationsQuery } from "../../store/api/designationApi";
import { useGetShiftsQuery } from "../../store/api/shiftApi";
import { useCheckEmployeeIdMutation, useCheckContactAvailabilityMutation, useCheckUsernameMutation } from "../../store/api/employeeApi";
import { Country, State, City } from "country-state-city";
import PermissionSelector from "../common/PermissionSelector";
import { permissionCategories } from "../../pages/EmployeePart/permissionsData";
import { toast } from "react-hot-toast";

const languagesList = [
  "English", "Hindi", "Mandarin Chinese", "Spanish", "French", "Standard Arabic", "Bengali", "Russian",
  "Portuguese", "Urdu", "Indonesian", "German", "Japanese", "Marathi", "Telugu", "Turkish", "Tamil",
  "Vietnamese", "Italian", "Thai", "Gujarati", "Kannada", "Persian", "Polish", "Pashto", "Dutch",
  "Greek", "Amharic", "Yoruba", "Oromo", "Malayalam", "Igbo", "Sindhi", "Nepali", "Sinhala", "Somali",
  "Khmer", "Turkmen", "Assamese", "Madurese", "Hausa", "Punjabi", "Javanese", "Wu Chinese", "Korean",
].sort();

const formatTime12Hr = (timeStr) => {
  if (!timeStr) return "";
  const [hourStr, minuteStr] = timeStr.split(":");
  if (!hourStr || !minuteStr) return timeStr;
  
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  hour = hour ? hour : 12;
  const paddedHour = hour.toString().padStart(2, "0");
  return `${paddedHour}:${minuteStr} ${ampm}`;
};

const CollapsibleSection = ({ id, title, icon: Icon, children, isCollapsed, onToggle }) => {
  return (
    <div className={`border rounded-none bg-white overflow-hidden mb-5 transition-all duration-300 ${isCollapsed ? 'border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300' : 'border-gray-200 shadow-lg ring-1 ring-black/5'}`}>
      <div
        className={`flex items-center justify-between p-5 cursor-pointer transition-colors relative ${isCollapsed ? 'hover:bg-gray-50/80' : 'bg-gray-50/50'}`}
        onClick={onToggle}
      >
        {!isCollapsed && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-orange-600"></div>}
        <div className="flex items-center gap-4">
          <div className={`p-2.5 flex items-center justify-center transition-colors duration-300 ${isCollapsed ? 'bg-gray-100 text-gray-500' : 'bg-orange-100 text-[#FF7B1D]'}`}>
            <Icon size={18} strokeWidth={isCollapsed ? 2 : 2.5} />
          </div>
          <div>
              <h3 className={`font-bold tracking-wide transition-colors ${isCollapsed ? 'text-gray-700 text-base' : 'text-gray-900 text-lg uppercase'}`}>{title}</h3>
          </div>
        </div>
        <div className={`p-1.5 rounded-none transition-transform duration-300 ${isCollapsed ? 'bg-white border border-gray-200 text-gray-400' : 'bg-orange-50 text-orange-600 border border-orange-100 rotate-180'}`}>
           <ChevronDown size={16} strokeWidth={3} />
        </div>
      </div>
      <div className={`grid transition-all duration-300 ease-in-out ${isCollapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'}`}>
        <div className="overflow-hidden">
          <div className="p-6 pt-5 border-t border-gray-100">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

const FormSection = ({ formData, handleChange, handleChanges, setFormData, mode = "full", excludeEmployeeId = null, hideSensitiveInfo = false }) => {
  const [collapsedSections, setCollapsedSections] = useState({
    personal: false,
    job: true,
    contact: true,
    documents: true,
    bank: true,
    login: true,
    permissions: true,
    education: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSameAddress, setIsSameAddress] = useState(false);
  const [idStatus, setIdStatus] = useState(null); // null, 'available', 'taken'
  const [checkEmployeeId, { isLoading: isCheckingId }] = useCheckEmployeeIdMutation();
  const handleEmployeeIdChange = (e) => {
    const value = e.target.value;
    handleChange(e);
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const res = await checkEmployeeId({ employeeId: formData.employeeId, excludeEmployeeId }).unwrap();
        if (res.available) {
          setIdStatus('available');
        } else {
          setIdStatus('taken');
        }
      } catch (error) {
        setIdStatus(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.employeeId, checkEmployeeId]);

  const [emailStatus, setEmailStatus] = useState(null);
  const [mobileStatus, setMobileStatus] = useState(null);
  const [checkContact, { isLoading: isCheckingContact }] = useCheckContactAvailabilityMutation();

  useEffect(() => {
    const value = formData.email;
    if (!value) {
      setEmailStatus(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await checkContact({ type: 'email', value, excludeEmployeeId }).unwrap();
        setEmailStatus(res.available ? 'available' : 'taken');
      } catch (error) {
        setEmailStatus(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.email, checkContact, excludeEmployeeId]);

  useEffect(() => {
    const value = formData.mobile;
    if (!value) {
      setMobileStatus(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await checkContact({ type: 'mobile', value, excludeEmployeeId }).unwrap();
        setMobileStatus(res.available ? 'available' : 'taken');
      } catch (error) {
        setMobileStatus(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.mobile, checkContact, excludeEmployeeId]);

  const [usernameStatus, setUsernameStatus] = useState(null);
  const [checkUsername, { isLoading: isCheckingUsername }] = useCheckUsernameMutation();

  useEffect(() => {
    const value = formData.username;
    if (!value) {
      setUsernameStatus(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await checkUsername({ username: value, excludeEmployeeId }).unwrap();
        setUsernameStatus(res.available ? 'available' : 'taken');
      } catch (error) {
        setUsernameStatus(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.username, checkUsername, excludeEmployeeId]);

  const handlePermanentAddressChange = (e) => {
    const { name, value } = e.target;
    handleChange(e);
    if (isSameAddress) {
      setFormData(prev => {
        const updated = { ...prev, [name]: value };
        const addressParts = [
          updated.permanentAddressLine1,
          updated.permanentAddressLine2,
          updated.permanentAddressLine3,
          updated.permanentCity,
          updated.permanentState,
          updated.permanentCountry,
          updated.permanentPincode
        ].filter(Boolean);
        return {
          ...updated,
          correspondenceAddress: addressParts.join(", ")
        };
      });
    }
  };

  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    setIsSameAddress(checked);
    if (checked) {
      const addressParts = [
        formData.permanentAddressLine1,
        formData.permanentAddressLine2,
        formData.permanentAddressLine3,
        formData.permanentCity,
        formData.permanentState,
        formData.permanentCountry,
        formData.permanentPincode
      ].filter(Boolean);
      setFormData(prev => ({
        ...prev,
        correspondenceAddress: addressParts.join(", ")
      }));
    }
  };

  const toggleSection = (section) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const { data: deptData, isLoading: departmentsLoading } = useGetDepartmentsQuery({ limit: 100 });
  const { data: dsgData, isLoading: designationsLoading } = useGetDesignationsQuery({ limit: 100 });
  const { data: shiftData, isLoading: shiftsLoading } = useGetShiftsQuery();

  const departments = deptData?.departments || [];
  const designations = dsgData?.designations || [];
  const shifts = shiftData?.shifts || [];

  const inputStyles =
    "w-full px-4 py-3 border border-gray-200 rounded-none focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none transition-all text-sm text-gray-900 placeholder-gray-400 bg-white hover:border-gray-300 shadow-sm font-medium";

  const selectStyles =
    "w-full px-4 py-3 border border-gray-200 rounded-none focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none transition-all text-sm text-gray-900 bg-white hover:border-gray-300 shadow-sm appearance-none cursor-pointer font-medium";

  const readOnlyStyles =
    "w-full px-3 py-2.5 border border-gray-200 rounded-none bg-gray-50 text-sm text-gray-900 font-semibold shadow-sm cursor-not-allowed";

  const fileStyles =
    "w-full px-4 py-2 border border-gray-200 rounded-none focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none transition-all text-sm text-gray-700 bg-white shadow-sm file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer";

  const labelStyles =
    "flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2 capitalize";

  const handleTogglePermission = (id) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [id]: !prev.permissions[id]
      }
    }));
  };

  const handleSelectCategory = (category) => {
    const permissions = permissionCategories[category];
    const allSelected = permissions.every(p => formData.permissions[p.id]);
    const newPermissions = { ...formData.permissions };
    permissions.forEach(p => {
      newPermissions[p.id] = !allSelected;
    });
    setFormData(prev => ({ ...prev, permissions: newPermissions }));
  };

  const handleDepartmentChange = (e) => {
    const deptId = e.target.value;
    handleChange(e);
    if (deptId) {
      const selectedDept = departments.find(d => d.id === parseInt(deptId));
      if (selectedDept && selectedDept.permissions) {
        const perms = typeof selectedDept.permissions === 'string'
          ? JSON.parse(selectedDept.permissions)
          : selectedDept.permissions;
        const permObj = {};
        (Array.isArray(perms) ? perms : []).forEach(p => { permObj[p] = true; });
        setFormData(prev => ({ ...prev, permissions: permObj }));
        toast.success(`Loaded default permissions for ${selectedDept.department_name}`);
      }
    }
  };

  const handleDesignationChange = (e) => {
    const dsgId = e.target.value;
    handleChange(e);
    if (dsgId) {
      const selectedDsg = designations.find(d => d.id === parseInt(dsgId));
      if (selectedDsg && selectedDsg.permissions) {
        const perms = typeof selectedDsg.permissions === 'string'
          ? JSON.parse(selectedDsg.permissions)
          : selectedDsg.permissions;
        const permObj = {};
        (Array.isArray(perms) ? perms : []).forEach(p => { permObj[p] = true; });
        setFormData(prev => ({ ...prev, permissions: permObj }));
        toast.success(`Loaded role-specific permissions for ${selectedDsg.designation_name}`);
      }
    }
  };

  return (
    <>
      <CollapsibleSection id="personal" title="Personal Details" icon={User} isCollapsed={collapsedSections.personal} onToggle={() => toggleSection("personal")}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="group">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 capitalize">
                <User size={16} className="text-[#FF7B1D]" /> Employee ID
              </label>
              <div className="flex items-center gap-3">
                {!formData.employeeId ? (
                  <button 
                    type="button"
                    onClick={() => {
                       const uniqueNum = Math.floor(10000 + Math.random() * 90000);
                       const newId = `EMP${uniqueNum}`;
                       handleEmployeeIdChange({ target: { name: 'employeeId', value: newId } });
                    }}
                    className="text-[10px] text-orange-600 hover:text-orange-700 font-bold uppercase tracking-wider"
                  >
                    Auto Generate
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, employeeId: "" }))}
                    className="text-[10px] text-red-500 hover:text-red-600 font-bold uppercase tracking-wider"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <div className="relative">
              <input 
                type="text" 
                name="employeeId" 
                value={formData.employeeId || ""} 
                onChange={handleEmployeeIdChange}
                className={`${inputStyles} pr-10 ${idStatus === 'taken' ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : idStatus === 'available' ? 'border-green-500 focus:border-green-500 focus:ring-green-500' : ''}`} 
                placeholder="Enter or generate ID" 
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isCheckingId && <Loader2 className="animate-spin text-gray-400" size={18} />}
                {!isCheckingId && idStatus === 'available' && <CheckCircle className="text-green-500" size={18} />}
                {!isCheckingId && idStatus === 'taken' && <XCircle className="text-red-500" size={18} />}
              </div>
            </div>
            {idStatus === 'taken' && <p className="text-xs text-red-500 mt-1 font-bold">This ID is already taken.</p>}
            {idStatus === 'available' && <p className="text-xs text-green-500 mt-1 font-bold">ID is available.</p>}
          </div>
          <div className="group">
            <label className={labelStyles}><User size={16} className="text-[#FF7B1D]" /> First Name <span className="text-red-500">*</span></label>
            <input type="text" name="firstName" placeholder="Enter first name" value={formData.firstName || ""} onChange={handleChange} className={inputStyles} />
          </div>
          <div className="group">
            <label className={labelStyles}><User size={16} className="text-[#FF7B1D]" /> Last Name <span className="text-red-500">*</span></label>
            <input type="text" name="lastName" placeholder="Enter last name" value={formData.lastName || ""} onChange={handleChange} className={inputStyles} />
          </div>
          <div className="space-y-2 group">
            <label className={labelStyles}><User size={16} className="text-[#FF7B1D]" /> Profile Picture</label>
            <div className="flex items-center gap-4">
              <input type="file" name="profilePic" accept="image/*" onChange={handleChange} className={fileStyles} />
              {formData.profilePicPreview && (
                <img src={formData.profilePicPreview} alt="Profile Preview" className="w-10 h-10 object-cover rounded border border-gray-200" />
              )}
            </div>
          </div>
          <div className="group">
            <label className={labelStyles}><Calendar size={16} className="text-[#FF7B1D]" /> Date of Birth</label>
            <input type="date" name="dob" value={formData.dob} onChange={handleChange} className={inputStyles} />
          </div>
          <div className="group">
            <label className={labelStyles}><Calendar size={16} className="text-[#FF7B1D]" /> Age (Auto-calculated)</label>
            <input type="text" name="age" value={formData.age} placeholder="Age" readOnly className={readOnlyStyles} />
          </div>
          {mode !== "basic" && (
            <>
              <div className="group">
                <label className={labelStyles}><Users size={16} className="text-[#FF7B1D]" /> Gender</label>
                <div className="relative">
                  <select name="gender" value={formData.gender} onChange={handleChange} className={selectStyles}>
                    <option value="">Select Gender</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="group">
                <label className={labelStyles}><User size={16} className="text-[#FF7B1D]" /> Father's Name</label>
                <input type="text" name="fatherName" placeholder="Enter father's name" value={formData.fatherName} onChange={handleChange} className={inputStyles} />
              </div>
              <div className="group">
                <label className={labelStyles}><User size={16} className="text-[#FF7B1D]" /> Mother's Name</label>
                <input type="text" name="motherName" placeholder="Enter mother's name" value={formData.motherName} onChange={handleChange} className={inputStyles} />
              </div>
              <div className="group">
                <label className={labelStyles}><Users size={16} className="text-[#FF7B1D]" /> Marital Status</label>
                <div className="relative">
                  <select name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} className={selectStyles}>
                    <option value="">Select Status</option>
                    <option value="Yes">Married</option>
                    <option value="No">Unmarried</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </>
          )}
        </div>
      </CollapsibleSection>

      {!hideSensitiveInfo && (
        <CollapsibleSection id="job" title="Job Details" icon={Briefcase} isCollapsed={collapsedSections.job} onToggle={() => toggleSection("job")}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="group">
            <label className={labelStyles}><Calendar size={16} className="text-[#FF7B1D]" /> Joining Date</label>
            <input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} className={inputStyles} />
          </div>
          <div className="group">
            <label className={labelStyles}><Building size={16} className="text-[#FF7B1D]" /> Department <span className="text-red-500">*</span></label>
            <div className="relative">
              <select name="department" value={formData.department} onChange={handleDepartmentChange} className={selectStyles}>
                <option value="">Select Department</option>
                {departmentsLoading ? <option disabled>Loading...</option> : departments.map((dept) => <option key={dept.id} value={dept.id}>{dept.department_name}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div className="group">
            <label className={labelStyles}><Briefcase size={16} className="text-[#FF7B1D]" /> Designation <span className="text-red-500">*</span></label>
            <div className="relative">
              <select name="designation" value={formData.designation} onChange={handleDesignationChange} className={selectStyles}>
                <option value="">Select Designation</option>
                {designationsLoading ? <option disabled>Loading...</option> : designations.map((dsg) => <option key={dsg.id} value={dsg.id}>{dsg.designation_name}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div className="group">
            <label className={labelStyles}><Clock size={16} className="text-[#FF7B1D]" /> Shift <span className="text-red-500">*</span></label>
            <div className="relative">
              <select name="shift" value={formData.shift} onChange={handleChange} className={selectStyles}>
                <option value="">Select Shift</option>
                {shiftsLoading ? <option disabled>Loading...</option> : shifts.map((shift) => <option key={shift.id} value={shift.id}>{shift.shift_name} ({formatTime12Hr(shift.check_in_time)} - {formatTime12Hr(shift.check_out_time)})</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div className="group">
            <label className={labelStyles}><Clock size={16} className="text-[#FF7B1D]" /> Working Hours</label>
            <input type="text" name="workingHours" value={formData.workingHours || ""} onChange={handleChange} className={`${inputStyles} cursor-not-allowed focus:ring-0`} placeholder="Auto-filled from Shift" readOnly />
          </div>
          <div className="group">
            <label className={labelStyles}><Calendar size={16} className="text-[#FF7B1D]" /> Working Days</label>
            <input type="text" name="workingDays" value={formData.workingDays || ""} onChange={handleChange} className={`${inputStyles} cursor-not-allowed focus:ring-0`} placeholder="Auto-filled from Shift" readOnly />
          </div>
          <div className="group">
            <label className={labelStyles}><Clock size={16} className="text-[#FF7B1D]" /> Notice Period</label>
            <div className="flex gap-2">
              <input type="text" name="noticePeriodValue" value={formData.noticePeriod?.split(' ')[0] || ''} onChange={(e) => handleChange({ target: { name: 'noticePeriod', value: `${e.target.value} ${formData.noticePeriod?.split(' ')[1] || 'Days'}` } })} className={`${inputStyles} w-20`} placeholder="30" />
              <select name="noticePeriodUnit" value={formData.noticePeriod?.split(' ')[1] || 'Days'} onChange={(e) => handleChange({ target: { name: 'noticePeriod', value: `${formData.noticePeriod?.split(' ')[0] || ''} ${e.target.value}` } })} className={selectStyles}>
                <option value="Days">Days</option>
                <option value="Months">Months</option>
              </select>
            </div>
          </div>
          <div className="group">
            <label className={labelStyles}><Clock size={16} className="text-[#FF7B1D]" /> Probation Period</label>
            <div className="flex gap-2">
              <input type="text" name="probationPeriodValue" value={formData.probationPeriod?.split(' ')[0] || ''} onChange={(e) => handleChange({ target: { name: 'probationPeriod', value: `${e.target.value} ${formData.probationPeriod?.split(' ')[1] || 'Months'}` } })} className={`${inputStyles} w-20`} placeholder="3" />
              <select name="probationPeriodUnit" value={formData.probationPeriod?.split(' ')[1] || 'Months'} onChange={(e) => handleChange({ target: { name: 'probationPeriod', value: `${formData.probationPeriod?.split(' ')[0] || ''} ${e.target.value}` } })} className={selectStyles}>
                <option value="Days">Days</option>
                <option value="Months">Months</option>
                <option value="Years">Years</option>
              </select>
            </div>
          </div>
          <div className="group">
            <label className={labelStyles}><User size={16} className="text-[#FF7B1D]" /> Employee Type</label>
            <div className="relative">
              <select name="employeeType" value={formData.employeeType} onChange={handleChange} className={selectStyles}>
                <option>Full-Time Employee</option><option>Part-Time Employee</option><option>Contract Employee</option>
                <option>Temporary Employee</option><option>Intern / Trainee</option><option>Freelancer / Consultant</option>
                <option>Probationary Employee</option><option>Casual Employee</option><option>Remote Employee</option><option>Seasonal Employee</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div className="group">
            <label className={labelStyles}><Briefcase size={16} className="text-[#FF7B1D]" /> Work Type</label>
            <div className="relative">
              <select name="workType" value={formData.workType} onChange={handleChange} className={selectStyles}>
                <option>On-Site</option><option>WFH(Remote)</option><option>Hybrid</option><option>Freelance</option>
                <option>Field Work</option><option>Flexible Hours</option><option>Project-Based</option><option>On-Call</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </CollapsibleSection>
      )}

      <CollapsibleSection id="education" title="Education Details" icon={GraduationCap} isCollapsed={collapsedSections.education} onToggle={() => toggleSection("education")}>
        <div className="space-y-4">
          {(formData.education || []).map((edu, index) => (
            <div key={index} className="p-4 border border-gray-100 rounded bg-gray-50/50 relative group">
              <button
                type="button"
                onClick={() => { const newEdu = [...formData.education]; newEdu.splice(index, 1); setFormData(prev => ({ ...prev, education: newEdu })); }}
                className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all font-bold"
              >
                <Trash2 size={16} />
              </button>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="group">
                  <label className={labelStyles}><GraduationCap size={16} className="text-[#FF7B1D]" /> Level</label>
                  <select value={edu.level || ""} onChange={(e) => { const newEdu = [...formData.education]; newEdu[index] = { ...newEdu[index], level: e.target.value }; setFormData(prev => ({ ...prev, education: newEdu })); }} className={selectStyles}>
                    <option value="">Select Level</option><option>10th</option><option>12th</option><option>Graduation</option><option>Post Graduation</option><option>Diploma</option><option>Other</option>
                  </select>
                </div>
                <div className="group">
                  <label className={labelStyles}><Building size={16} className="text-[#FF7B1D]" /> Institute</label>
                  <input type="text" value={edu.institute || ""} onChange={(e) => { const newEdu = [...formData.education]; newEdu[index] = { ...newEdu[index], institute: e.target.value }; setFormData(prev => ({ ...prev, education: newEdu })); }} placeholder="Enter institute" className={inputStyles} />
                </div>
                <div className="group">
                  <label className={labelStyles}><Calendar size={16} className="text-[#FF7B1D]" /> Passing Year</label>
                  <input type="number" value={edu.year || ""} onChange={(e) => { const newEdu = [...formData.education]; newEdu[index] = { ...newEdu[index], year: e.target.value }; setFormData(prev => ({ ...prev, education: newEdu })); }} placeholder="YYYY" className={inputStyles} />
                </div>
                <div className="group">
                  <label className={labelStyles}><FileText size={16} className="text-[#FF7B1D]" /> Percentage/GPA</label>
                  <input type="text" value={edu.grade || ""} onChange={(e) => { const newEdu = [...formData.education]; newEdu[index] = { ...newEdu[index], grade: e.target.value }; setFormData(prev => ({ ...prev, education: newEdu })); }} placeholder="Grade" className={inputStyles} />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => { setFormData(prev => ({ ...prev, education: [...(prev.education || []), { level: "", institute: "", year: "", grade: "" }] })); }}
            className="w-full py-2.5 border border-dashed border-gray-300 rounded text-gray-500 hover:text-orange-500 hover:border-orange-500 transition-all flex items-center justify-center gap-2 font-bold text-sm"
          >
            <Plus size={18} /> Add Education Entry
          </button>
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="contact" title="Contact Information" icon={Phone} isCollapsed={collapsedSections.contact} onToggle={() => toggleSection("contact")}>
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="group">
              <label className={labelStyles}><Phone size={16} className="text-[#FF7B1D]" /> Personal Mobile <span className="text-[10px] text-gray-500 font-normal ml-1">(Primary for login use)</span> <span className="text-red-500">*</span></label>
              <div className="relative">
                <input 
                  type="tel" 
                  name="mobile" 
                  placeholder="Enter personal mobile" 
                  value={formData.mobile || ""} 
                  onChange={handleChange} 
                  className={`${inputStyles} pr-10 ${mobileStatus === 'taken' ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : mobileStatus === 'available' ? 'border-green-500 focus:border-green-500 focus:ring-green-500' : ''}`} 
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isCheckingContact && formData.mobile && <Loader2 className="animate-spin text-gray-400" size={18} />}
                  {!isCheckingContact && mobileStatus === 'available' && <CheckCircle className="text-green-500" size={18} />}
                  {!isCheckingContact && mobileStatus === 'taken' && <XCircle className="text-red-500" size={18} />}
                </div>
              </div>
              {mobileStatus === 'taken' && <p className="text-xs text-red-500 mt-1 font-bold">This mobile number is already taken.</p>}
            </div>
            <div className="group">
              <label className={labelStyles}><Phone size={16} className="text-[#FF7B1D]" /> Work Mobile</label>
              <input type="tel" name="altMobile" placeholder="Enter work mobile" value={formData.altMobile} onChange={handleChange} className={inputStyles} />
            </div>
            <div className="group">
              <label className={labelStyles}><Mail size={16} className="text-[#FF7B1D]" /> Personal Email <span className="text-[10px] text-gray-500 font-normal ml-1">(Primary for login use)</span> <span className="text-red-500">*</span></label>
              <div className="relative">
                <input 
                  type="email" 
                  name="email" 
                  placeholder="Enter personal email" 
                  value={formData.email || ""} 
                  onChange={handleChange} 
                  className={`${inputStyles} pr-10 ${emailStatus === 'taken' ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : emailStatus === 'available' ? 'border-green-500 focus:border-green-500 focus:ring-green-500' : ''}`} 
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isCheckingContact && formData.email && <Loader2 className="animate-spin text-gray-400" size={18} />}
                  {!isCheckingContact && emailStatus === 'available' && <CheckCircle className="text-green-500" size={18} />}
                  {!isCheckingContact && emailStatus === 'taken' && <XCircle className="text-red-500" size={18} />}
                </div>
              </div>
              {emailStatus === 'taken' && <p className="text-xs text-red-500 mt-1 font-bold">This email is already taken.</p>}
            </div>
            <div className="group">
              <label className={labelStyles}><Mail size={16} className="text-[#FF7B1D]" /> Work Email</label>
              <input type="email" name="workEmail" placeholder="Enter work email" value={formData.workEmail || ""} onChange={handleChange} className={inputStyles} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 border-t border-gray-100 pt-6">
            <div className="group">
              <label className={labelStyles}><Linkedin size={16} className="text-[#FF7B1D]" /> LinkedIn Profile</label>
              <input type="url" name="linkedinUrl" placeholder="https://linkedin.com/in/..." value={formData.linkedinUrl || ""} onChange={handleChange} className={inputStyles} />
            </div>
            <div className="group">
              <label className={labelStyles}><MessageSquare size={16} className="text-[#FF7B1D]" /> Skype / Slack ID</label>
              <input type="text" name="skypeId" placeholder="Enter ID" value={formData.skypeId || ""} onChange={handleChange} className={inputStyles} />
            </div>
            <div className="group">
              <label className={labelStyles}><AlertCircle size={16} className="text-[#FF7B1D]" /> Emergency Contact</label>
              <input type="text" name="emergencyPerson" placeholder="Name - Relation" value={formData.emergencyPerson} onChange={handleChange} className={inputStyles} />
            </div>
            <div className="group">
              <label className={labelStyles}><Phone size={16} className="text-[#FF7B1D]" /> Emergency Number</label>
              <input type="tel" name="emergencyNumber" placeholder="Enter emergency number" value={formData.emergencyNumber} onChange={handleChange} className={inputStyles} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 border-t border-gray-100 pt-6">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2"><span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Permanent Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 group">
                  <label className={labelStyles}><MapPin size={16} className="text-[#FF7B1D]" /> Address Line 1</label>
                  <input type="text" name="permanentAddressLine1" placeholder="House No, Building" value={formData.permanentAddressLine1 || ""} onChange={handlePermanentAddressChange} className={inputStyles} />
                </div>
                <div className="group">
                  <label className={labelStyles}><MapPin size={16} className="text-[#FF7B1D]" /> Address Line 2</label>
                  <input type="text" name="permanentAddressLine2" placeholder="Locality" value={formData.permanentAddressLine2 || ""} onChange={handlePermanentAddressChange} className={inputStyles} />
                </div>

                <div className="group">
                  <label className={labelStyles}><Globe size={16} className="text-[#FF7B1D]" /> Country</label>
                  <div className="relative">
                    <select name="permanentCountry" value={formData.permanentCountry || ""} onChange={handlePermanentAddressChange} className={selectStyles}>
                      <option value="">Select Country</option>
                      {Country.getAllCountries().map((country) => (<option key={country.isoCode} value={country.isoCode}>{country.name}</option>))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div className="group">
                  <label className={labelStyles}><MapPin size={16} className="text-[#FF7B1D]" /> State</label>
                  <div className="relative">
                    <select name="permanentState" value={formData.permanentState || ""} onChange={handlePermanentAddressChange} className={selectStyles}>
                      <option value="">Select State</option>
                      {State.getStatesOfCountry(formData.permanentCountry)?.map((state) => (<option key={state.isoCode} value={state.isoCode}>{state.name}</option>))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div className="group">
                  <label className={labelStyles}><MapPin size={16} className="text-[#FF7B1D]" /> City</label>
                  <div className="relative">
                    <select name="permanentCity" value={formData.permanentCity || ""} onChange={handlePermanentAddressChange} className={selectStyles}>
                      <option value="">Select City</option>
                      {City.getCitiesOfState(formData.permanentCountry, formData.permanentState)?.map((city) => (<option key={city.name} value={city.name}>{city.name}</option>))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div className="group">
                  <label className={labelStyles}><MapPin size={16} className="text-[#FF7B1D]" /> Pincode</label>
                  <input type="text" name="permanentPincode" placeholder="Pincode" value={formData.permanentPincode || ""} onChange={handlePermanentAddressChange} className={inputStyles} />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-8 lg:pt-0 border-t lg:border-t-0 lg:border-l border-gray-100 lg:pl-8">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Correspondence Address</h4>
                <label className="flex items-center gap-2 cursor-pointer select-none group">
                  <input type="checkbox" checked={isSameAddress} onChange={handleCheckboxChange} className="w-4 h-4 text-[#FF7B1D] border-gray-300 rounded focus:ring-[#FF7B1D]" />
                  <span className="text-xs font-bold text-gray-500 group-hover:text-[#FF7B1D] transition-colors">Same as Permanent</span>
                </label>
              </div>
              {isSameAddress ? (
                <div className="p-6 bg-gray-50 rounded border border-dashed border-gray-200 text-gray-500 text-sm italic">Address is being synchronized with Permanent Address.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 group">
                    <label className={labelStyles}><MapPin size={16} className="text-[#FF7B1D]" /> Address</label>
                    <input type="text" name="correspondenceAddress" placeholder="Full Address" value={formData.correspondenceAddress || ""} onChange={handleChange} className={inputStyles} />
                  </div>
                  <div className="md:col-span-2 group">
                    <label className={labelStyles}><MapPin size={16} className="text-[#FF7B1D]" /> City / Town</label>
                    <input type="text" name="correspondenceCity" placeholder="Enter city" value={formData.correspondenceCity || ""} onChange={handleChange} className={inputStyles} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {mode !== "basic" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-gray-100 pt-6">
              <div className="group">
                <label className={labelStyles}><Activity size={16} className="text-[#FF7B1D]" /> Blood Group</label>
                <div className="relative">
                  <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className={selectStyles}>
                    <option value="">Select Blood Group</option>
                    <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                    <option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="group">
                <label className={labelStyles}><Languages size={16} className="text-[#FF7B1D]" /> Languages Spoken</label>
                <div className="space-y-4">
                  <div className="relative">
                    <select
                      onChange={(e) => {
                        const selectedLanguage = e.target.value;
                        if (selectedLanguage && !(formData.languages || []).includes(selectedLanguage)) {
                          setFormData((prev) => ({ ...prev, languages: [...(prev.languages || []), selectedLanguage] }));
                        }
                        e.target.value = "";
                      }}
                      className={selectStyles}
                      defaultValue=""
                    >
                      <option value="" disabled>Select Language</option>
                      {languagesList.map((lang) => (<option key={lang} value={lang} disabled={(formData.languages || []).includes(lang)}>{lang}</option>))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  {Array.isArray(formData.languages) && formData.languages.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-2 bg-gray-50 border border-gray-200 rounded">
                      {(Array.isArray(formData.languages) ? formData.languages : []).map((lang) => (
                        <div key={lang} className="bg-white border border-gray-200 text-gray-800 px-3 py-1 rounded-full text-xs flex items-center gap-2 shadow-sm">
                          <span>{lang}</span>
                          <button type="button" onClick={() => { setFormData((prev) => ({ ...prev, languages: (prev.languages || []).filter((l) => l !== lang) })); }} className="text-gray-400 hover:text-red-500 transition-colors focus:outline-none">
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {mode !== "basic" && (
        <>
          <CollapsibleSection id="documents" title="Document Details" icon={FileText} isCollapsed={collapsedSections.documents} onToggle={() => toggleSection("documents")}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="group">
                <label className={labelStyles}><CreditCard size={16} className="text-[#FF7B1D]" /> Aadhar Number</label>
                <input type="text" name="aadharNumber" placeholder="Enter 12-digit Aadhar" value={formData.aadharNumber} onChange={handleChange} className={inputStyles} />
              </div>
              <div className="group">
                <label className={labelStyles}><CreditCard size={16} className="text-[#FF7B1D]" /> PAN Number</label>
                <input type="text" name="panNumber" placeholder="Enter PAN number" value={formData.panNumber} onChange={handleChange} className={inputStyles} />
              </div>
              <div className="group">
                <label className={labelStyles}><Upload size={16} className="text-[#FF7B1D]" /> Aadhar Card (Front)</label>
                <div className="flex items-center gap-4">
                  <input type="file" name="aadharFront" accept="image/*,.pdf" onChange={handleChange} className={fileStyles} />
                  {formData.aadharFrontPreview && (<img src={formData.aadharFrontPreview} alt="Preview" className="w-10 h-10 object-cover rounded border" />)}
                </div>
              </div>
              <div className="group">
                <label className={labelStyles}><Upload size={16} className="text-[#FF7B1D]" /> Aadhar Card (Back)</label>
                <div className="flex items-center gap-4">
                  <input type="file" name="aadharBack" accept="image/*,.pdf" onChange={handleChange} className={fileStyles} />
                  {formData.aadharBackPreview && (<img src={formData.aadharBackPreview} alt="Preview" className="w-10 h-10 object-cover rounded border" />)}
                </div>
              </div>
              <div className="group">
                <label className={labelStyles}><Upload size={16} className="text-[#FF7B1D]" /> PAN Card</label>
                <div className="flex items-center gap-4">
                  <input type="file" name="panCard" accept="image/*,.pdf" onChange={handleChange} className={fileStyles} />
                  {formData.panCardPreview && (<img src={formData.panCardPreview} alt="Preview" className="w-10 h-10 object-cover rounded border" />)}
                </div>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection id="bank" title="Bank Account Details" icon={CreditCard} isCollapsed={collapsedSections.bank} onToggle={() => toggleSection("bank")}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="group">
                <label className={labelStyles}><Building size={16} className="text-[#FF7B1D]" /> IFSC Code</label>
                <input type="text" name="ifscCode" placeholder="Enter IFSC" value={formData.ifscCode} onChange={handleChange} className={inputStyles} />
              </div>
              <div className="group">
                <label className={labelStyles}><DollarSign size={16} className="text-[#FF7B1D]" /> Account Number</label>
                <input type="text" name="accountNumber" placeholder="Enter account no" value={formData.accountNumber} onChange={handleChange} className={inputStyles} />
              </div>
              <div className="group">
                <label className={labelStyles}><User size={16} className="text-[#FF7B1D]" /> Holder Name</label>
                <input type="text" name="accountHolderName" placeholder="Enter holder name" value={formData.accountHolderName} onChange={handleChange} className={inputStyles} />
              </div>
              <div className="group">
                <label className={labelStyles}><Building size={16} className="text-[#FF7B1D]" /> Branch Name</label>
                <input type="text" name="branchName" placeholder="Enter branch" value={formData.branchName} onChange={handleChange} className={inputStyles} />
              </div>
              <div className="group">
                <label className={labelStyles}><Upload size={16} className="text-[#FF7B1D]" /> Cancelled Cheque</label>
                <div className="flex items-center gap-4">
                  <input type="file" name="cancelCheque" accept="image/*,.pdf" onChange={handleChange} className={fileStyles} />
                  {formData.cancelChequePreview && (<img src={formData.cancelChequePreview} alt="Preview" className="w-10 h-10 object-cover rounded border" />)}
                </div>
              </div>
            </div>
          </CollapsibleSection>
        </>
      )}

      {!hideSensitiveInfo && (
        <>
          <CollapsibleSection id="login" title="Login Credentials" icon={Key} isCollapsed={collapsedSections.login} onToggle={() => toggleSection("login")}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="group">
                <label className={labelStyles}><User size={16} className="text-[#FF7B1D]" /> Username <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input 
                    type="text" 
                    name="username" 
                    placeholder="Enter username" 
                    value={formData.username || ""} 
                    onChange={handleChange} 
                    className={`${inputStyles} pr-10 ${usernameStatus === 'taken' ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : usernameStatus === 'available' ? 'border-green-500 focus:border-green-500 focus:ring-green-500' : ''}`} 
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isCheckingUsername && formData.username && <Loader2 className="animate-spin text-gray-400" size={18} />}
                    {!isCheckingUsername && usernameStatus === 'available' && <CheckCircle className="text-green-500" size={18} />}
                    {!isCheckingUsername && usernameStatus === 'taken' && <XCircle className="text-red-500" size={18} />}
                  </div>
                </div>
                {usernameStatus === 'taken' && <p className="text-xs text-red-500 mt-1 font-bold">This username is already taken.</p>}
              </div>
              <div className="group">
                <label className={labelStyles}><Mail size={16} className="text-[#FF7B1D]" /> Email ID</label>
                <input type="email" name="email" placeholder="Enter email" value={formData.email} onChange={handleChange} className={inputStyles} />
              </div>
              <div className="group">
                <label className={labelStyles}><Lock size={16} className="text-[#FF7B1D]" /> Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="password" 
                    placeholder="Enter password" 
                    value={formData.password || ""} 
                    onChange={handleChange} 
                    className={`${inputStyles} pr-10`} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection id="permissions" title="Permissions Control" icon={ShieldCheck} isCollapsed={collapsedSections.permissions} onToggle={() => toggleSection("permissions")}>
            <div className="bg-orange-50/50 p-4 rounded-lg mb-6 border border-orange-100 italic text-center">
              <p className="text-xs text-orange-700 leading-relaxed font-bold">
                Note: These permissions were automatically suggested based on the selected Department & Designation. You can further customize them here.
              </p>
            </div>
            <PermissionSelector selectedPermissions={formData.permissions || {}} onTogglePermission={handleTogglePermission} onSelectCategory={handleSelectCategory} />
          </CollapsibleSection>
        </>
      )}
    </>
  );
};

export default FormSection;
