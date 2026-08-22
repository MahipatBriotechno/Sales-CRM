import React, { useState, useEffect } from "react";
import { X, UserPlus, Save, Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import FormSection from "../../components/Employee/FormSection";
import { useCreateEmployeeMutation } from "../../store/api/employeeApi";
import { useGetOfferLettersQuery } from "../../store/api/offerLetterApi";
import { useGetDepartmentsQuery } from "../../store/api/departmentApi";
import { useGetDesignationsQuery } from "../../store/api/designationApi";
import { useGetShiftsQuery } from "../../store/api/shiftApi";
import { toast } from "react-hot-toast";
import { FileSignature } from "lucide-react";

const AddEmployee = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    employeeName: "",
    profilePic: null,
    dob: "",
    age: "",
    gender: "",
    fatherName: "",
    motherName: "",
    maritalStatus: "",
    joiningDate: "",
    department: "",
    designation: "",
    shift: "",
    employeeType: "Permanent",
    workType: "WFO",
    mobile: "",
    altMobile: "",
    email: "",
    workEmail: "",
    linkedinUrl: "",
    skypeId: "",
    permanentAddress: "",
    permanentAddressLine1: "",
    permanentAddressLine2: "",
    permanentAddressLine3: "",
    permanentCity: "",
    permanentState: "",
    permanentCountry: "",
    permanentPincode: "",
    correspondenceAddress: "",
    correspondenceCity: "",
    emergencyPerson: "",
    emergencyNumber: "",
    bloodGroup: "",
    languages: [],
    aadharNumber: "",
    panNumber: "",
    aadharFront: null,
    aadharBack: null,
    panCard: null,
    ifscCode: "",
    accountNumber: "",
    accountHolderName: "",
    branchName: "",
    cancelCheque: null,
    username: "",
    password: "",
    status: "Active",
    noticePeriod: "",
    probationPeriod: "",
    workingHours: "",
    workingDays: "",
    permissions: {},
    education: []
  });

  const [createEmployee, { isLoading }] = useCreateEmployeeMutation();
  const { data: offerLetterData } = useGetOfferLettersQuery({ limit: 1000 });
  const { data: deptData } = useGetDepartmentsQuery({ limit: 100 });
  const { data: dsgData } = useGetDesignationsQuery({ limit: 100 });
  const { data: shiftsData } = useGetShiftsQuery({ limit: 100 });

  const offerLetters = offerLetterData?.offerLetters || [];
  const departments = deptData?.departments || [];
  const designations = dsgData?.designations || [];
  const shifts = shiftsData?.shifts || shiftsData || [];

  const handleOfferLetterChange = (e) => {
    const offerId = e.target.value;
    if (!offerId) {
      setFormData((prev) => ({
        ...prev,
        employeeId: "",
        firstName: "",
        lastName: "",
        employeeName: "",
        email: "",
        mobile: "",
        department: "",
        designation: "",
        shift: "",
        workingHours: "",
        workingDays: "",
        joiningDate: "",
        permanentAddressLine1: "",
        noticePeriod: "",
        probationPeriod: "",
      }));
      return;
    }

    const offer = offerLetters.find((o) => o.id == offerId);
    if (!offer) return;

    // Split candidate name into first and last name
    const nameParts = offer.candidate_name.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Find matching department, designation, and shift IDs
    const matchedDept = departments.find(d => d.department_name === offer.department);
    const matchedDsg = designations.find(d => d.designation_name === offer.designation);
    
    // Auto-select shift based on shift_type string in offer_details (e.g. "General")
    const offerShiftName = offer.offer_details?.shift_type || "";
    const matchedShift = shifts.find(s => s.shift_name === offerShiftName);

    setFormData((prev) => ({
      ...prev,
      employeeId: offer.employee_id || prev.employeeId || "",
      firstName,
      lastName,
      employeeName: offer.candidate_name,
      email: offer.email,
      mobile: offer.phone,
      department: matchedDept ? matchedDept.id : prev.department,
      designation: matchedDsg ? matchedDsg.id : prev.designation,
      shift: matchedShift ? matchedShift.id : prev.shift,
      workingHours: offer.offer_details?.working_hours || (matchedShift ? `${formatTime12Hr(matchedShift.check_in_time)} - ${formatTime12Hr(matchedShift.check_out_time)}` : ""),
      workingDays: offer.offer_details?.working_days || (matchedShift ? matchedShift.working_days : ""),
      joiningDate: offer.joining_date ? offer.joining_date.split('T')[0] : prev.joiningDate,
      permanentAddressLine1: offer.address || prev.permanentAddressLine1,
      noticePeriod: offer.notice_period || prev.noticePeriod,
      probationPeriod: offer.offer_details ? `${offer.offer_details.probation_duration} ${offer.offer_details.probation_unit}` : prev.probationPeriod
    }));

    toast.success(`Form auto-filled from ${offer.candidate_name}'s offer letter`);
  };

  const calculateAge = (dob) => {
    if (!dob) return "";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatTime12Hr = (timeString) => {
    if (!timeString) return "";
    const [hourString, minute] = timeString.split(":");
    const hour = +hourString % 24;
    return (hour % 12 || 12).toString().padStart(2, '0') + ":" + minute + (hour < 12 ? " AM" : " PM");
  };

  const handleChange = (e) => {
    const { name, value, files, type } = e.target;
    if (type === "file") {
      const file = files[0];
      setFormData((prev) => ({
        ...prev,
        [name]: file,
        [`${name}Preview`]: file ? URL.createObjectURL(file) : null
      }));
    } else {
      if (name === "dob") {
        const age = calculateAge(value);
        if (value && age < 18) {
          toast.dismiss();
          toast.error("Employee must be at least 18 years old");
          setFormData(prev => ({ ...prev, dob: "", age: "" }));
          return;
        }
        setFormData(prev => ({ ...prev, dob: value, age: age }));
        return;
      }

      setFormData((prev) => {
        const updated = { ...prev, [name]: value };
        // Auto-update employeeName
        if (name === "firstName" || name === "lastName") {
          const fName = name === "firstName" ? value : (prev.firstName || "");
          const lName = name === "lastName" ? value : (prev.lastName || "");
          updated.employeeName = `${fName} ${lName}`.trim();
        } else if (name === "shift") {
          const selectedShift = shifts.find(s => s.id == value);
          updated.workingHours = selectedShift ? `${formatTime12Hr(selectedShift.check_in_time)} - ${formatTime12Hr(selectedShift.check_out_time)}` : "";
          updated.workingDays = selectedShift ? selectedShift.working_days : "";
        }
        return updated;
      });
    }
  };

  const handleChanges = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox" && name === "languages") {
      setFormData((prev) => {
        const updatedLanguages = checked
          ? [...prev.languages, value]
          : prev.languages.filter((lang) => lang !== value);
        return { ...prev, languages: updatedLanguages };
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.mobile.trim()) {
      toast.error("First Name, Last Name, Email and Mobile are required");
      return;
    }

    const data = new FormData();

    // Ensure employeeName is correctly synced one last time
    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
    formData.employeeName = fullName;

    // Mapping frontend field names to backend expected names
    const mapping = {
      employeeName: 'employee_name',
      profilePic: 'profile_picture',
      dob: 'date_of_birth',
      age: 'age',
      gender: 'gender',
      fatherName: 'father_name',
      motherName: 'mother_name',
      maritalStatus: 'marital_status',
      joiningDate: 'joining_date',
      department: 'department_id',
      designation: 'designation_id',
      shift: 'shift_id',
      employeeType: 'employee_type',
      workType: 'work_type',
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
      username: 'username',
      password: 'password',
      status: 'status',
      education: 'education',
      noticePeriod: 'notice_period',
      probationPeriod: 'probation_period',
      workingHours: 'working_hours',
      workingDays: 'working_days'
    };

    Object.keys(formData).forEach(key => {
      const backendKey = mapping[key] || key;
      if (formData[key] instanceof File) {
        data.append(backendKey, formData[key]);
      } else if (Array.isArray(formData[key])) {
        data.append(backendKey, JSON.stringify(formData[key]));
      } else if (key === 'permissions') {
        const permsObj = formData[key] || {};
        const permsList = Object.keys(permsObj).filter(id => permsObj[id]);
        data.append(backendKey, JSON.stringify(permsList));
      } else if (formData[key] !== null && formData[key] !== undefined) {
        data.append(backendKey, formData[key]);
      }
    });

    try {
      await createEmployee(data).unwrap();
      toast.success("Employee added successfully!");
      navigate('/hrm/employee/all');
    } catch (err) {
      if (!err.data?.limitReached && err.status !== 402) {
        toast.error(err.data?.message || "Failed to add employee");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white sticky top-0 z-30 shadow-sm border-b border-gray-200">
        <div className="max-w-8xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/hrm/employee/all')} 
                className="p-2 hover:bg-gray-100 rounded-none transition-colors border border-transparent hover:border-gray-200 text-gray-600 hover:text-gray-900"
                title="Back to Employees"
              >
                <ArrowLeft size={20} strokeWidth={2.5} />
              </button>
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Add New Employee</h1>
                <p className="text-sm text-gray-500 mt-0.5 font-medium">Manage your workforce efficiently with complete details</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="bg-white shadow-xl shadow-gray-200/50 border border-gray-200 rounded-none">
          {/* Form Body */}
          <div className="p-8 space-y-8">
            {/* Offer Letter Auto-fill Section */}
            <div className="bg-gradient-to-r from-orange-50 via-orange-50/50 to-white p-6 border-l-4 border-orange-500 mb-6 rounded-none relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-200 rounded-full blur-3xl -mr-32 -mt-32 opacity-20 transition-opacity group-hover:opacity-40"></div>
              <label className="text-xs font-black text-orange-800 uppercase tracking-widest mb-3 flex items-center gap-2 relative z-10">
                <FileSignature size={16} strokeWidth={2.5} />
                Smart Auto-fill from Offer Letter
              </label>
              <div className="relative z-10 max-w-2xl">
                <select
                  onChange={handleOfferLetterChange}
                  className="w-full border-2 border-orange-200/60 p-3 rounded-none focus:border-orange-500 outline-none transition-all text-sm font-semibold bg-white/80 hover:bg-white text-gray-800 shadow-sm appearance-none cursor-pointer"
                >
                <option value="">-- Select Offer Letter to Auto-fill --</option>
                {offerLetters.filter(o => o.status === 'Accepted').map((offer) => (
                  <option key={offer.id} value={offer.id}>
                    {offer.candidate_name} - {offer.designation} (Accepted)
                  </option>
                ))}
                <option disabled>──────────</option>
                {offerLetters.filter(o => o.status !== 'Accepted').map((offer) => (
                  <option key={offer.id} value={offer.id}>
                    {offer.candidate_name} - {offer.designation} ({offer.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

            <FormSection
              formData={formData}
              handleChange={handleChange}
              handleChanges={handleChanges}
              setFormData={setFormData}
              mode="basic"
            />
          </div>

          {/* Footer */}
          <div className="bg-gray-50/80 px-8 py-5 border-t border-gray-200 flex justify-end gap-4 rounded-none">
            <button
              type="button"
              onClick={() => navigate('/hrm/employee/all')}
              className="px-8 py-2.5 rounded-none border-2 border-gray-300 text-gray-600 font-bold hover:bg-white hover:text-gray-900 hover:border-gray-400 transition-all shadow-sm uppercase tracking-wide text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleSubmit}
              className="flex items-center gap-2 px-8 py-2.5 rounded-none bg-gray-900 text-white font-bold hover:bg-[#FF7B1D] transition-colors duration-300 disabled:opacity-50 shadow-md uppercase tracking-wide text-xs"
            >
              {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} strokeWidth={2.5} />}
              Save Employee
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEmployee;
