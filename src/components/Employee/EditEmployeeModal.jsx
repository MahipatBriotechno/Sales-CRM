import React, { useState, useEffect } from "react";
import { X, Pencil, Save, Loader2 } from "lucide-react";
import FormSection from "./FormSection";
import { useUpdateEmployeeMutation } from "../../store/api/employeeApi";
import { toast } from "react-hot-toast";

const EditEmployeeModal = ({ isOpen, onClose, employee }) => {
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
        permissions: {},
        education: []
    });

    const [updateEmployee, { isLoading }] = useUpdateEmployeeMutation();

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
            education: 'education'
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
            onClose();
        } catch (err) {
            toast.error(err.data?.message || "Failed to update employee");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-sm shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col relative transform transition-all">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 shrink-0 rounded-t-sm">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="bg-white bg-opacity-20 p-2 rounded-sm">
                                <Pencil size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Edit Employee</h2>
                                <p className="text-sm text-white text-opacity-90">Update employee status and details</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-white hover:bg-white/20 p-2 transition-all rounded">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Form Body */}
                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                    <FormSection
                        formData={formData}
                        handleChange={handleChange}
                        handleChanges={handleChanges}
                        setFormData={setFormData}
                        mode="full"
                    />
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3 shrink-0 rounded-b-sm">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 rounded-sm border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={isLoading}
                        onClick={handleSubmit}
                        className="flex items-center gap-2 px-8 py-2 rounded-sm bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold hover:shadow-lg transform transition-all disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        Update Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditEmployeeModal;
