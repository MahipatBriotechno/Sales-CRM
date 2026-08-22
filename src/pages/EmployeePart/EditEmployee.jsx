import React, { useState, useEffect } from "react";
import { X, Pencil, Save, Loader2, ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import FormSection from "../../components/Employee/FormSection";
import { useUpdateEmployeeMutation, useGetEmployeeByIdQuery } from "../../store/api/employeeApi";
import { useGetDepartmentsQuery } from "../../store/api/departmentApi";
import { useGetDesignationsQuery } from "../../store/api/designationApi";
import { useGetShiftsQuery } from "../../store/api/shiftApi";
import { toast } from "react-hot-toast";

const EditEmployee = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: employeeData, isLoading: isFetching } = useGetEmployeeByIdQuery(id);
    const employee = employeeData?.data;

    const [formData, setFormData] = useState({
        employeeId: "",
        firstName: "",
        lastName: "",
        employeeName: "",
        profilePic: null,
        profilePicPreview: "",
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
        aadharFrontPreview: "",
        aadharBack: null,
        aadharBackPreview: "",
        panCard: null,
        panCardPreview: "",
        ifscCode: "",
        accountNumber: "",
        accountHolderName: "",
        branchName: "",
        cancelCheque: null,
        cancelChequePreview: "",
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

    const [updateEmployee, { isLoading }] = useUpdateEmployeeMutation();
    const { data: shiftsData } = useGetShiftsQuery({ limit: 100 });
    const shifts = shiftsData?.shifts || shiftsData || [];

    useEffect(() => {
        if (employee) {
            // Split name for editing
            const nameParts = (employee.employee_name || "").split(" ");
            const fName = nameParts[0] || "";
            const lName = nameParts.slice(1).join(" ") || "";

            setFormData({
                employeeId: employee.employee_id || "",
                firstName: fName,
                lastName: lName,
                employeeName: employee.employee_name || "",
                profilePic: null, // Don't pre-fill files
                profilePicPreview: employee.profile_picture_url || "",
                dob: employee.date_of_birth ? employee.date_of_birth.substring(0, 10) : "",
                age: employee.age || "",
                gender: employee.gender || "",
                fatherName: employee.father_name || "",
                motherName: employee.mother_name || "",
                maritalStatus: employee.marital_status || "",
                joiningDate: employee.joining_date ? employee.joining_date.substring(0, 10) : "",
                department: employee.department_id || "",
                designation: employee.designation_id || "",
                shift: employee.shift_id || "",
                noticePeriod: employee.notice_period || "",
                probationPeriod: employee.probation_period || "",
                workingHours: employee.working_hours || "",
                workingDays: employee.working_days || "",
                employeeType: employee.employee_type || "Permanent",
                workType: employee.work_type || "WFO",
                mobile: employee.mobile_number || "",
                altMobile: employee.work_mobile_number || employee.alternate_mobile_number || "",
                email: employee.email || "",
                workEmail: employee.work_email || "",
                linkedinUrl: employee.linkedin_url || "",
                skypeId: employee.skype_id || "",
                permanentAddress: employee.permanent_address || "",
                permanentAddressLine1: employee.permanent_address_l1 || "",
                permanentAddressLine2: employee.permanent_address_l2 || "",
                permanentAddressLine3: employee.permanent_address_l3 || "",
                permanentCity: employee.permanent_city || "",
                permanentState: employee.permanent_state || "",
                permanentCountry: employee.permanent_country || "",
                permanentPincode: employee.permanent_pincode || "",
                correspondenceAddress: employee.correspondence_address || "",
                correspondenceCity: employee.correspondence_city || "",
                emergencyPerson: employee.emergency_contact_person || "",
                emergencyNumber: employee.emergency_contact_number || "",
                bloodGroup: employee.blood_group || "",
                languages: Array.isArray(employee.languages) ? employee.languages : (typeof employee.languages === 'string' ? JSON.parse(employee.languages || '[]') : []),
                aadharNumber: employee.aadhar_number || "",
                panNumber: employee.pan_number || "",
                aadharFront: null,
                aadharFrontPreview: employee.aadhar_front_url || "",
                aadharBack: null,
                aadharBackPreview: employee.aadhar_back_url || "",
                panCard: null,
                panCardPreview: employee.pan_card_url || "",
                ifscCode: employee.ifsc_code || "",
                accountNumber: employee.account_number || "",
                accountHolderName: employee.account_holder_name || "",
                branchName: employee.branch_name || "",
                cancelCheque: null,
                cancelChequePreview: employee.cancelled_cheque_url || "",
                username: employee.username || "",
                password: "", // Keep password empty for security
                status: employee.status || "Active",
                permissions: (() => {
                    let perms = employee.permissions;
                    if (typeof perms === 'string') {
                        try { perms = JSON.parse(perms); } catch (e) { perms = []; }
                    }
                    if (Array.isArray(perms)) {
                        const obj = {};
                        perms.forEach(p => obj[p] = true);
                        return obj;
                    }
                    return perms || {};
                })(),
                education: Array.isArray(employee.education) ? employee.education : (typeof employee.education === 'string' ? JSON.parse(employee.education || '[]') : []),
            });
        }
    }, [employee]);

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
                [`${name}Preview`]: file ? URL.createObjectURL(file) : prev[`${name}Preview`],
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

        if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.mobile.trim()) {
            toast.error("First Name, Last Name, Email and Mobile are required");
            return;
        }

        const data = new FormData();

        // Ensure employeeName is correctly synced
        const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
        formData.employeeName = fullName;
        const mapping = {
            employeeId: 'employee_id',
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

        const excludedFields = [
            "firstName",
            "lastName",
            "profilePicPreview",
            "aadharFrontPreview",
            "aadharBackPreview",
            "panCardPreview",
            "cancelChequePreview"
        ];

        Object.keys(formData).forEach(key => {
            if (excludedFields.includes(key)) return;
            const backendKey = mapping[key] || key;
            if (formData[key] instanceof File) {
                data.append(backendKey, formData[key]);
            } else if (backendKey === 'password' && !formData[key]) {
                // Skip empty password in edit
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
            await updateEmployee({ id: employee.id, formData: data }).unwrap();
            toast.success("Employee updated successfully!");
            navigate('/hrm/employee/all');
        } catch (err) {
            toast.error(err.data?.message || "Failed to update employee");
        }
    };

    if (isFetching) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                    <p className="text-gray-500 font-medium">Loading employee details...</p>
                </div>
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <p className="text-gray-500 font-medium">Employee not found.</p>
                    <button onClick={() => navigate('/hrm/employee/all')} className="text-orange-500 font-bold underline">
                        Back to Employees
                    </button>
                </div>
            </div>
        );
    }

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
                <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Edit Employee</h1>
                <p className="text-sm text-gray-500 mt-0.5 font-medium">Update employee status and details</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="bg-white shadow-xl shadow-gray-200/50 border border-gray-200 rounded-none">
          {/* Form Body */}
          <div className="p-8 space-y-8">
                        <FormSection
                            formData={formData}
                            handleChange={handleChange}
                            handleChanges={handleChanges}
                            setFormData={setFormData}
                            excludeEmployeeId={id}
                            mode="full"
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
              Update Changes
            </button>
          </div>
                </div>
            </div>
        </div>
    );
};

export default EditEmployee;
