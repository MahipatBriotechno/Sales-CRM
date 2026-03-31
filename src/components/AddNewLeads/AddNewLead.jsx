import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Building2,
  FileText,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  IndianRupee,
  Tag,
  Layers,
  Workflow,
  Plus,
  Trash2,
  Image as ImageIcon,
  Calendar,
  Upload,
  Clock
} from "lucide-react";
import { useCreateLeadMutation, useUpdateLeadMutation } from "../../store/api/leadApi";
import { useGetPipelinesQuery } from "../../store/api/pipelineApi";
import { useGetEmployeesQuery } from "../../store/api/employeeApi";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";

const inputStyles =
  "w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none transition-all text-sm text-gray-900 placeholder-gray-400 bg-white hover:border-gray-300";

// Helper function to convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// Helper function to validate file size (max 1MB)
const validateFileSize = (file) => {
  const maxSize = 1 * 1024 * 1024; // 1MB in bytes
  return file.size <= maxSize;
};

// Helper function to validate Indian mobile numbers
// Accepts 10-digit numbers starting with 6, 7, 8, or 9
// Also accepts numbers with +91 or 0 prefix (stripped before checking)
const validateMobileNumber = (number) => {
  if (!number || number.trim() === "") return true; // empty = optional field, skip
  const cleaned = number.trim().replace(/^\+91/, "").replace(/^0/, "").replace(/\s|-/g, "");
  return /^[6-9]\d{9}$/.test(cleaned);
};

export default function AddNewLead({ isOpen, onClose, leadToEdit = null }) {
  const [createLead, { isLoading: isCreating }] = useCreateLeadMutation();
  const [updateLead, { isLoading: isUpdating }] = useUpdateLeadMutation();
  const { data: pipelinesData } = useGetPipelinesQuery({ limit: 1000 });
  const pipelines = pipelinesData?.pipelines || [];
  const { data: employeesData } = useGetEmployeesQuery({ limit: 100 });
  const employees = employeesData?.employees || [];
  const { user } = useSelector((state) => state.auth);

  const [leadType, setLeadType] = useState("Individual");
  const [assignmentType, setAssignmentType] = useState("Self");
  const [visibility, setVisibility] = useState("Public");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [customFields, setCustomFields] = useState([{ label: "", value: "" }]);
  const [contactPersons, setContactPersons] = useState([{
    name: "",
    profile_image: "",
    gender: "",
    dob: "",
    designation: "",
    mobile_number: "",
    alt_mobile_number: "",
    whatsapp_number: "",
    email: "",
    mobile_same_as_whatsapp: false,
    alt_mobile_same_as_whatsapp: false
  }]);

  const [formData, setFormData] = useState({
    name: "",
    lead_source: "",
    status: "New Lead",
    visibility: "Public",

    // Individual Details
    full_name: "",
    profile_image: "",
    gender: "",
    dob: "",
    mobile_number: "",
    alt_mobile_number: "",
    whatsapp_number: "",
    email: "",
    address: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
    mobile_same_as_whatsapp: false,
    alt_mobile_same_as_whatsapp: false,

    // Organization Details
    organization_name: "",
    company_logo: "",
    industry_type: "",
    website: "",
    company_email: "",
    company_phone: "",
    gst_number: "",
    company_address: "",
    org_city: "",
    org_state: "",
    org_country: "",
    org_pincode: "",

    // Common Fields
    interested_in: [],

    value: "",
    owner: "",
    owner_name: "",
    pipeline_id: "",
    stage_id: "",
    referral_mobile: "",
    lead_owner: "",
    created_at: new Date().toISOString().split('T')[0],
    created_time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  });

  const selectedPipeline = (formData && pipelines) ? pipelines.find(p => p.id == formData.pipeline_id) : null;
  const filteredStages = selectedPipeline?.stages || [];

  // Interested-in options
  const interestedInOptions = [
    "Product Demo",
    "Pricing Info",
    "Support",
    "Partnership",
    "Consultation",
    "Training",
    "Other"
  ];


  // State to track which multi-select dropdown is open
  const [openMultiSelect, setOpenMultiSelect] = useState(null);


  // Automatic Pipeline Recommendation
  useEffect(() => {
    if (formData.interested_in.length > 0 && !formData.pipeline_id && pipelines.length > 0) {
      const defaultPipe = pipelines.find(p => p.name.toLowerCase().includes('default')) || pipelines[0];
      if (defaultPipe) {
        setFormData(prev => ({ ...prev, pipeline_id: defaultPipe.id }));
        toast.success(`Recommended pipeline: ${defaultPipe.name}`, { icon: 'ℹ️', duration: 2000 });
      }
    }
  }, [formData.interested_in, pipelines]);

  // Close multi-select dropdowns when clicking outside
  useEffect(() => {
    if (!openMultiSelect) return;
    const handler = (e) => {
      if (!e.target.closest('[data-multiselect]')) {
        setOpenMultiSelect(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMultiSelect]);

  // Set default lead owner to logged-in user
  useEffect(() => {
    if (!leadToEdit && user) {
      if (assignmentType === "Self") {
        const name = user.employee_name ||
          user.name ||
          (user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : null) ||
          user.username ||
          "Unknown User";

        setFormData(prev => ({ ...prev, lead_owner: name }));
      } else {
        setFormData(prev => ({ ...prev, lead_owner: "System Auto-assigned" }));
      }
    }
  }, [user, leadToEdit, assignmentType]);

  useEffect(() => {
    if (leadToEdit) {
      setLeadType(leadToEdit.type || "Individual");
      setVisibility(leadToEdit.visibility || "Public");
      setTags(leadToEdit.tag ? leadToEdit.tag.split(',').map(t => t.trim()) : []);

      // Parse custom fields if available
      if (leadToEdit.custom_fields) {
        try {
          const parsed = JSON.parse(leadToEdit.custom_fields);
          setCustomFields(parsed.length > 0 ? parsed : [{ label: "", value: "" }]);
        } catch (e) {
          setCustomFields([{ label: "", value: "" }]);
        }
      }

      // Parse contact persons if available
      if (leadToEdit.contact_persons) {
        try {
          const parsed = JSON.parse(leadToEdit.contact_persons);
          setContactPersons(parsed.length > 0 ? parsed : [{ name: "", profile_image: "", gender: "", dob: "", designation: "", mobile_number: "", alt_mobile_number: "", whatsapp_number: "", email: "", mobile_same_as_whatsapp: false, alt_mobile_same_as_whatsapp: false }]);
        } catch (e) {
          setContactPersons([{ name: "", profile_image: "", gender: "", dob: "", designation: "", mobile_number: "", alt_mobile_number: "", whatsapp_number: "", email: "", mobile_same_as_whatsapp: false, alt_mobile_same_as_whatsapp: false }]);
        }
      }

      setFormData({
        name: leadToEdit.name || "",
        lead_source: leadToEdit.lead_source || "",
        status: leadToEdit.status || "Active",
        visibility: leadToEdit.visibility || "Public",
        full_name: leadToEdit.full_name || "",
        profile_image: leadToEdit.profile_image || "",
        gender: leadToEdit.gender || "",
        dob: leadToEdit.dob ? leadToEdit.dob.split('T')[0] : "",
        mobile_number: leadToEdit.mobile_number || "",
        alt_mobile_number: leadToEdit.alt_mobile_number || "",
        whatsapp_number: leadToEdit.whatsapp_number || "",
        email: leadToEdit.email || "",
        address: leadToEdit.address || "",
        city: leadToEdit.city || "",
        state: leadToEdit.state || "",
        country: leadToEdit.country || "",
        pincode: leadToEdit.pincode || "",
        mobile_same_as_whatsapp: false,
        alt_mobile_same_as_whatsapp: false,

        organization_name: leadToEdit.organization_name || "",
        company_logo: leadToEdit.company_logo || "",
        industry_type: leadToEdit.industry_type || "",
        website: leadToEdit.website || "",
        company_email: leadToEdit.company_email || "",
        company_phone: leadToEdit.company_phone || "",
        gst_number: leadToEdit.gst_number || "",
        company_address: leadToEdit.company_address || "",
        org_city: leadToEdit.org_city || "",
        org_state: leadToEdit.org_state || "",
        org_country: leadToEdit.org_country || "",
        org_pincode: leadToEdit.org_pincode || "",

        interested_in: leadToEdit.interested_in ? (Array.isArray(leadToEdit.interested_in) ? leadToEdit.interested_in : leadToEdit.interested_in.split(',')) : [],

        value: leadToEdit.value || "",
        owner: leadToEdit.owner || leadToEdit.assigned_to || "",
        owner_name: leadToEdit.owner_name || leadToEdit.employee_name || "",
        pipeline_id: leadToEdit.pipeline_id || "",
        stage_id: leadToEdit.stage_id || "",
        referral_mobile: leadToEdit.referral_mobile || "",
        created_at: leadToEdit.created_at ? leadToEdit.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
        created_time: leadToEdit.created_at 
          ? new Date(leadToEdit.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
          : new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      });
    }
  }, [leadToEdit]);

  const handlePincodeLookup = async (pincode, isOrg = false) => {
    if (pincode.length !== 6) return;

    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();

      if (data[0].Status === "Success") {
        const postOffice = data[0].PostOffice[0];
        const state = postOffice.State;
        const city = postOffice.District;
        const country = postOffice.Country || "India";

        if (isOrg) {
          setFormData(prev => ({
            ...prev,
            org_state: state,
            org_city: city,
            org_country: country
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            state: state,
            city: city,
            country: country
          }));
        }
        toast.success(`Location auto-filled: ${city}, ${state}`, {
          icon: '📍',
          style: {
            borderRadius: '4px',
            background: '#333',
            color: '#fff',
          },
        });
      } else {
        toast.error("Invalid Pincode");
      }
    } catch (error) {
      console.error("Pincode lookup failed:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      if (name === "mobile_same_as_whatsapp") {
        setFormData((prev) => ({
          ...prev,
          mobile_same_as_whatsapp: checked,
          alt_mobile_same_as_whatsapp: checked ? false : prev.alt_mobile_same_as_whatsapp,
          whatsapp_number: checked ? prev.mobile_number : "",
        }));
      } else if (name === "alt_mobile_same_as_whatsapp") {
        setFormData((prev) => ({
          ...prev,
          alt_mobile_same_as_whatsapp: checked,
          mobile_same_as_whatsapp: checked ? false : prev.mobile_same_as_whatsapp,
          whatsapp_number: checked ? prev.alt_mobile_number : "",
        }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: checked }));
      }
    } else {
      setFormData((prev) => {
        const updated = { ...prev, [name]: value };
        if (name === "mobile_number" && prev.mobile_same_as_whatsapp) {
          updated.whatsapp_number = value;
        } else if (name === "alt_mobile_number" && prev.alt_mobile_same_as_whatsapp) {
          updated.whatsapp_number = value;
        }
        return updated;
      });

      if (name === "pincode" && value.length === 6) {
        handlePincodeLookup(value, false);
      } else if (name === "org_pincode" && value.length === 6) {
        handlePincodeLookup(value, true);
      }
    }
  };

  const handleInterestedInToggle = (item) => {
    setFormData(prev => ({
      ...prev,
      interested_in: prev.interested_in.includes(item)
        ? prev.interested_in.filter(s => s !== item)
        : [...prev.interested_in, item]
    }));
  };

  // Handle profile image upload for Individual
  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!validateFileSize(file)) {
      toast.error("File size must not exceed 1 MB");
      e.target.value = ""; // Reset input
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setFormData(prev => ({ ...prev, profile_image: base64 }));
      toast.success("Profile image uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload image");
      console.error(error);
    }
  };

  // Handle company logo upload for Organization
  const handleCompanyLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!validateFileSize(file)) {
      toast.error("File size must not exceed 1 MB");
      e.target.value = ""; // Reset input
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setFormData(prev => ({ ...prev, company_logo: base64 }));
      toast.success("Company logo uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload logo");
      console.error(error);
    }
  };

  // Handle contact person profile image upload
  const handleContactPersonImageUpload = async (index, e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!validateFileSize(file)) {
      toast.error("File size must not exceed 1 MB");
      e.target.value = ""; // Reset input
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      const updated = [...contactPersons];
      updated[index].profile_image = base64;
      setContactPersons(updated);
      toast.success("Profile image uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload image");
      console.error(error);
    }
  };

  const handleContactPersonChange = (index, field, value) => {
    const updated = [...contactPersons];
    updated[index][field] = value;

    // Handle "same as WhatsApp" checkboxes and sync logic
    if (field === "mobile_same_as_whatsapp") {
      if (value) {
        updated[index].whatsapp_number = updated[index].mobile_number;
        updated[index].alt_mobile_same_as_whatsapp = false;
      } else {
        updated[index].whatsapp_number = "";
      }
    } else if (field === "alt_mobile_same_as_whatsapp") {
      if (value) {
        updated[index].whatsapp_number = updated[index].alt_mobile_number;
        updated[index].mobile_same_as_whatsapp = false;
      } else {
        updated[index].whatsapp_number = "";
      }
    } else if (field === "mobile_number" && updated[index].mobile_same_as_whatsapp) {
      updated[index].whatsapp_number = value;
    } else if (field === "alt_mobile_number" && updated[index].alt_mobile_same_as_whatsapp) {
      updated[index].whatsapp_number = value;
    }

    setContactPersons(updated);
  };

  const addContactPerson = () => {
    setContactPersons([...contactPersons, {
      name: "",
      profile_image: "",
      gender: "",
      dob: "",
      designation: "",
      mobile_number: "",
      alt_mobile_number: "",
      whatsapp_number: "",
      email: "",
      mobile_same_as_whatsapp: false,
      alt_mobile_same_as_whatsapp: false
    }]);
  };

  const removeContactPerson = (index) => {
    if (contactPersons.length > 1) {
      setContactPersons(contactPersons.filter((_, i) => i !== index));
    }
  };

  const handleCustomFieldChange = (index, field, value) => {
    const updated = [...customFields];
    updated[index][field] = value;
    setCustomFields(updated);
  };

  const addCustomField = () => {
    setCustomFields([...customFields, { label: "", value: "" }]);
  };

  const removeCustomField = (index) => {
    if (customFields.length > 1) {
      setCustomFields(customFields.filter((_, i) => i !== index));
    }
  };

  // Validate all mobile fields before form submission
  const validateAllMobiles = () => {
    // Individual fields
    if (leadType === "Individual") {
      if (!validateMobileNumber(formData.mobile_number)) {
        toast.error("Invalid Mobile Number — Please enter a valid 10-digit number starting with 6–9.");
        return false;
      }
      if (!validateMobileNumber(formData.alt_mobile_number)) {
        toast.error("Invalid Alternate Mobile Number — Please enter a valid 10-digit number starting with 6–9.");
        return false;
      }
      if (!validateMobileNumber(formData.whatsapp_number)) {
        toast.error("Invalid WhatsApp Number — Please enter a valid 10-digit number starting with 6–9.");
        return false;
      }
    }
    // Organization fields
    if (leadType === "Organization") {
      if (!validateMobileNumber(formData.company_phone)) {
        toast.error("Invalid Company Phone Number — Please enter a valid 10-digit number starting with 6–9.");
        return false;
      }
      // Contact persons
      for (let i = 0; i < contactPersons.length; i++) {
        const cp = contactPersons[i];
        if (!validateMobileNumber(cp.mobile_number)) {
          toast.error(`Invalid Mobile Number for Contact Person ${i + 1} — Please enter a valid 10-digit number.`);
          return false;
        }
        if (!validateMobileNumber(cp.alt_mobile_number)) {
          toast.error(`Invalid Alternate Mobile for Contact Person ${i + 1} — Please enter a valid 10-digit number.`);
          return false;
        }
        if (!validateMobileNumber(cp.whatsapp_number)) {
          toast.error(`Invalid WhatsApp Number for Contact Person ${i + 1} — Please enter a valid 10-digit number.`);
          return false;
        }
      }
    }
    return true;
  };

  // onBlur handler — shows a non-blocking warning when user leaves a mobile field with bad data
  const handleMobileBlur = (label, value) => {
    if (value && value.trim() !== "" && !validateMobileNumber(value)) {
      toast.error(`Invalid ${label} — Must be a 10-digit number starting with 6, 7, 8, or 9.`, { duration: 3000 });
    }
  };

  const handleSubmit = async () => {
    if (!validateAllMobiles()) return;
    const payload = {
      ...formData,
      name: formData.name || (leadType === "Individual" ? formData.full_name : formData.organization_name) || "Untitled Lead",
      type: leadType,
      tag: tags.length ? tags.join(',') : 'New Lead',
      visibility,
      value: Number(formData.value) || 0,
      interested_in: formData.interested_in.join(','),

      description: null,
      dob: formData.dob || null,
      custom_fields: JSON.stringify(customFields.filter(cf => cf.label && cf.value)),
      contact_persons: leadType === "Organization" ? JSON.stringify(contactPersons) : null,
      lead_owner: assignmentType === "Self" ? formData.lead_owner : null,
      created_at: `${formData.created_at}T${formData.created_time || "00:00"}:00`,
      // owner_name: formData.lead_owner,
      // owner: formData.lead_owner
    };

    try {
      if (leadToEdit) {
        await updateLead({ id: leadToEdit.id, data: payload }).unwrap();
        toast.success("Lead updated successfully!");
      } else {
        await createLead(payload).unwrap();
        toast.success("Lead added successfully!");
      }
      onClose();
    } catch (error) {
      console.error("Failed to save lead:", error);
      if (!error?.data?.limitReached && error.status !== 402) {
        toast.error(error?.data?.message || "Failed to save lead");
      }
    }
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-sm shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 p-2 rounded-sm text-white">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {leadToEdit ? "Edit Lead" : "Add New Lead"}
              </h2>
              <p className="text-sm text-white text-opacity-90 mt-0.5">
                {leadToEdit ? "Update lead details" : "Create new lead for your organization"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-orange-700 p-1 rounded-sm transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Lead Type Selection */}
          <div className="bg-orange-50 p-4 rounded-xl border-2 border-orange-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Lead Type */}
            <div className="flex-1">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <Briefcase size={16} className="text-[#FF7B1D]" />
                Lead Type <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="radio"
                    value="Individual"
                    checked={leadType === "Individual"}
                    onChange={(e) => setLeadType(e.target.value)}
                    className="w-5 h-5 text-[#FF7B1D]"
                  />
                  <span className="ml-3 text-sm font-semibold text-gray-800 group-hover:text-[#FF7B1D] transition-colors">
                    Individual
                  </span>
                </label>
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="radio"
                    value="Organization"
                    checked={leadType === "Organization"}
                    onChange={(e) => setLeadType(e.target.value)}
                    className="w-5 h-5 text-[#FF7B1D]"
                  />
                  <span className="ml-3 text-sm font-semibold text-gray-800 group-hover:text-[#FF7B1D] transition-colors">
                    Organization
                  </span>
                </label>
              </div>
            </div>

            {/* Vertical Divider */}
            <div className="hidden md:block w-px bg-orange-200 h-12"></div>

            {/* Assignment Type */}
            <div className="flex-1">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <User size={16} className="text-[#FF7B1D]" />
                Lead Assignment <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="radio"
                    value="Self"
                    checked={assignmentType === "Self"}
                    onChange={(e) => setAssignmentType(e.target.value)}
                    className="w-5 h-5 text-[#FF7B1D]"
                  />
                  <span className="ml-3 text-sm font-semibold text-gray-800 group-hover:text-[#FF7B1D] transition-colors">
                    Assign to me
                  </span>
                </label>
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="radio"
                    value="System"
                    checked={assignmentType === "System"}
                    onChange={(e) => setAssignmentType(e.target.value)}
                    className="w-5 h-5 text-[#FF7B1D]"
                  />
                  <span className="ml-3 text-sm font-semibold text-gray-800 group-hover:text-[#FF7B1D] transition-colors">
                    System Auto-assign
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Individual Details */}
          {leadType === "Individual" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <User size={20} className="text-[#FF7B1D]" />
                <h3 className="text-lg font-bold text-gray-800 capitalize">
                  Individual Details
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* 1. Full Name */}
                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <User size={14} className="text-[#FF7B1D]" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    placeholder="Enter full name"
                    className={inputStyles}
                    value={formData.full_name}
                    onChange={handleChange}
                  />
                </div>

                <div className="group">
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Phone size={14} className="text-[#FF7B1D]" />
                      Mobile Number
                    </label>
                    <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        name="mobile_same_as_whatsapp"
                        checked={formData.mobile_same_as_whatsapp}
                        onChange={handleChange}
                        className="w-4 h-4 text-[#FF7B1D] rounded-sm focus:ring-[#FF7B1D]"
                      />
                      Same as WhatsApp
                    </label>
                  </div>
                  <input
                    type="text"
                    name="mobile_number"
                    placeholder="Enter mobile number"
                    className={inputStyles}
                    value={formData.mobile_number}
                    onChange={handleChange}
                    onBlur={(e) => handleMobileBlur("Mobile Number", e.target.value)}
                    maxLength={15}
                  />
                </div>

                {/* 3. Email */}
                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Mail size={14} className="text-[#FF7B1D]" />
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter email address"
                    className={inputStyles}
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="group">
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Phone size={14} className="text-[#FF7B1D]" />
                      Alternate Mobile Number
                    </label>
                    <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        name="alt_mobile_same_as_whatsapp"
                        checked={formData.alt_mobile_same_as_whatsapp}
                        onChange={handleChange}
                        className="w-4 h-4 text-[#FF7B1D] rounded-sm focus:ring-[#FF7B1D]"
                      />
                      Same as WhatsApp
                    </label>
                  </div>
                  <input
                    type="text"
                    name="alt_mobile_number"
                    placeholder="Enter alternate mobile"
                    className={inputStyles}
                    value={formData.alt_mobile_number}
                    onChange={handleChange}
                    onBlur={(e) => handleMobileBlur("Alternate Mobile Number", e.target.value)}
                    maxLength={15}
                  />
                </div>

                {/* 5. WhatsApp Number */}
                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Phone size={14} className="text-[#FF7B1D]" />
                    WhatsApp Number
                  </label>
                  <input
                    type="text"
                    name="whatsapp_number"
                    placeholder="Enter WhatsApp number"
                    className={inputStyles}
                    value={formData.whatsapp_number}
                    onChange={handleChange}
                    onBlur={(e) => handleMobileBlur("WhatsApp Number", e.target.value)}
                    disabled={formData.mobile_same_as_whatsapp || formData.alt_mobile_same_as_whatsapp}
                    maxLength={15}
                  />
                </div>

                {/* 6. Profile Image */}
                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Upload size={14} className="text-[#FF7B1D]" />
                    Profile Image
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageUpload}
                      className="hidden"
                      id="profile-image-upload"
                    />

                    {formData.profile_image ? (
                      <div className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-sm bg-gray-50">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">
                            {formData.profile_image.substring(0, 50)}...
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <label
                            htmlFor="profile-image-upload"
                            className="p-1 text-orange-600 hover:bg-orange-100 rounded transition-colors cursor-pointer"
                            title="Change Image"
                          >
                            <Upload size={14} />
                          </label>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, profile_image: "" }))}
                            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Remove Image"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label
                        htmlFor="profile-image-upload"
                        className="flex items-center justify-between w-full px-4 py-3 border border-gray-200 rounded-sm hover:border-[#FF7B1D] hover:bg-orange-50 transition-all cursor-pointer group/label"
                      >
                        <span className="text-sm text-gray-400">Upload profile image</span>
                        <Upload size={16} className="text-gray-400 group-hover/label:text-[#FF7B1D]" />
                      </label>
                    )}
                  </div>
                </div>

                {/* 7. Gender */}
                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <User size={14} className="text-[#FF7B1D]" />
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={inputStyles + " appearance-none cursor-pointer"}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* 8. Date of Birth */}
                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Calendar size={14} className="text-[#FF7B1D]" />
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dob"
                    className={inputStyles}
                    value={formData.dob}
                    onChange={handleChange}
                  />
                </div>

                {/* 9. Address */}
                <div className="group col-span-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <MapPin size={14} className="text-[#FF7B1D]" />
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    name="address"
                    placeholder="Enter address"
                    className={inputStyles}
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>

                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <MapPin size={14} className="text-[#FF7B1D]" />
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    placeholder="Enter state"
                    className={inputStyles}
                    value={formData.state}
                    onChange={handleChange}
                  />
                </div>

                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <MapPin size={14} className="text-[#FF7B1D]" />
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    placeholder="Enter city"
                    className={inputStyles}
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>

                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <MapPin size={14} className="text-[#FF7B1D]" />
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    placeholder="Enter country"
                    className={inputStyles}
                    value={formData.country}
                    onChange={handleChange}
                  />
                </div>

                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <MapPin size={14} className="text-[#FF7B1D]" />
                    PIN Code
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    placeholder="Enter 6-digit PIN code"
                    className={inputStyles}
                    value={formData.pincode}
                    onChange={handleChange}
                    maxLength={6}
                  />
                  <p className="text-[10px] text-gray-400 mt-1 italic">Location auto-fills on 6 digits</p>
                </div>
              </div>
            </div>
          )}

          {/* Organization Details */}
          {leadType === "Organization" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <Building2 size={20} className="text-[#FF7B1D]" />
                <h3 className="text-lg font-bold text-gray-800 capitalize">
                  Organization Information
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* 1. Organization/Company Name */}
                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Building2 size={14} className="text-[#FF7B1D]" />
                    Organization / Company Name
                  </label>
                  <input
                    type="text"
                    name="organization_name"
                    placeholder="Enter organization name"
                    className={inputStyles}
                    value={formData.organization_name}
                    onChange={handleChange}
                  />
                </div>

                {/* 2. Company Phone Number */}
                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Phone size={14} className="text-[#FF7B1D]" />
                    Company Phone Number
                  </label>
                  <input
                    type="text"
                    name="company_phone"
                    placeholder="Enter company phone"
                    className={inputStyles}
                    value={formData.company_phone}
                    onChange={handleChange}
                    onBlur={(e) => handleMobileBlur("Company Phone Number", e.target.value)}
                    maxLength={15}
                  />
                </div>

                {/* 3. Company Email */}
                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Mail size={14} className="text-[#FF7B1D]" />
                    Company Email
                  </label>
                  <input
                    type="email"
                    name="company_email"
                    placeholder="Enter company email"
                    className={inputStyles}
                    value={formData.company_email}
                    onChange={handleChange}
                  />
                </div>

                {/* 4. Industry Type */}
                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Briefcase size={14} className="text-[#FF7B1D]" />
                    Industry Type
                  </label>
                  <select
                    name="industry_type"
                    className={inputStyles}
                    value={formData.industry_type}
                    onChange={handleChange}
                  >
                    <option value="">Select industry</option>
                    <option value="Information Technology">IT</option>
                    <option value="Finance">Finance</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Retail">Retail</option>
                    <option value="Education">Education</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="group col-span-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Upload size={14} className="text-[#FF7B1D]" />
                    Company Logo
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCompanyLogoUpload}
                      className="hidden"
                      id="company-logo-upload"
                    />

                    {formData.company_logo ? (
                      <div className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-sm bg-gray-50">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">
                            {formData.company_logo.substring(0, 50)}...
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <label
                            htmlFor="company-logo-upload"
                            className="p-1 text-orange-600 hover:bg-orange-100 rounded transition-colors cursor-pointer"
                            title="Change Logo"
                          >
                            <Upload size={14} />
                          </label>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, company_logo: "" }))}
                            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Remove Logo"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label
                        htmlFor="company-logo-upload"
                        className="flex items-center justify-between w-full px-4 py-3 border border-gray-200 rounded-sm hover:border-[#FF7B1D] hover:bg-orange-50 transition-all cursor-pointer group/label"
                      >
                        <span className="text-sm text-gray-400">Upload company logo</span>
                        <Upload size={16} className="text-gray-400 group-hover/label:text-[#FF7B1D]" />
                      </label>
                    )}
                  </div>
                </div>

                {/* 6. Company Website */}
                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <FileText size={14} className="text-[#FF7B1D]" />
                    Company Website
                  </label>
                  <input
                    type="text"
                    name="website"
                    placeholder="Enter website URL"
                    className={inputStyles}
                    value={formData.website}
                    onChange={handleChange}
                  />
                </div>

                {/* 7. GST Number */}
                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <FileText size={14} className="text-[#FF7B1D]" />
                    GST Number
                  </label>
                  <input
                    type="text"
                    name="gst_number"
                    placeholder="Enter GST number"
                    className={inputStyles}
                    value={formData.gst_number}
                    onChange={handleChange}
                  />
                </div>

                {/* 8. Company Address */}
                <div className="group col-span-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <MapPin size={14} className="text-[#FF7B1D]" />
                    Company Address
                  </label>
                  <input
                    type="text"
                    name="company_address"
                    placeholder="Enter company address"
                    className={inputStyles}
                    value={formData.company_address}
                    onChange={handleChange}
                  />
                </div>

                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <MapPin size={14} className="text-[#FF7B1D]" />
                    State
                  </label>
                  <input
                    type="text"
                    name="org_state"
                    placeholder="Enter state"
                    className={inputStyles}
                    value={formData.org_state}
                    onChange={handleChange}
                  />
                </div>

                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <MapPin size={14} className="text-[#FF7B1D]" />
                    City
                  </label>
                  <input
                    type="text"
                    name="org_city"
                    placeholder="Enter city"
                    className={inputStyles}
                    value={formData.org_city}
                    onChange={handleChange}
                  />
                </div>

                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <MapPin size={14} className="text-[#FF7B1D]" />
                    Country
                  </label>
                  <input
                    type="text"
                    name="org_country"
                    placeholder="Enter country"
                    className={inputStyles}
                    value={formData.org_country}
                    onChange={handleChange}
                  />
                </div>

                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <MapPin size={14} className="text-[#FF7B1D]" />
                    PIN Code
                  </label>
                  <input
                    type="text"
                    name="org_pincode"
                    placeholder="Enter 6-digit PIN code"
                    className={inputStyles}
                    value={formData.org_pincode}
                    onChange={handleChange}
                    maxLength={6}
                  />
                  <p className="text-[10px] text-gray-400 mt-1 italic">Location auto-fills on 6 digits</p>
                </div>
              </div>

              {/* Primary Contact Person(s) */}
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <User size={20} className="text-[#FF7B1D]" />
                    <h3 className="text-lg font-bold text-gray-800 capitalize">
                      Primary Contact Person
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={addContactPerson}
                    className="flex items-center gap-2 px-3 py-1.5 bg-orange-500 text-white rounded-sm hover:bg-orange-600 transition-colors text-sm font-semibold"
                  >
                    <Plus size={16} />
                    Add Contact
                  </button>
                </div>

                {contactPersons.map((contact, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">Contact Person #{index + 1}</span>
                      {contactPersons.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeContactPerson(index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="group">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                          <User size={14} className="text-[#FF7B1D]" />
                          Contact Person Name
                        </label>
                        <input
                          type="text"
                          placeholder="Enter name"
                          className={inputStyles}
                          value={contact.name}
                          onChange={(e) => handleContactPersonChange(index, 'name', e.target.value)}
                        />
                      </div>


                      <div className="group">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                          <Upload size={14} className="text-[#FF7B1D]" />
                          Profile Photo
                        </label>
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleContactPersonImageUpload(index, e)}
                            className="hidden"
                            id={`contact-image-upload-${index}`}
                          />

                          {contact.profile_image ? (
                            <div className="flex items-center gap-2 px-3 py-3 border border-gray-200 rounded-sm bg-gray-50">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900 truncate">
                                  {contact.profile_image.substring(0, 30)}...
                                </p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <label
                                  htmlFor={`contact-image-upload-${index}`}
                                  className="p-1 text-orange-600 hover:bg-orange-100 rounded transition-colors cursor-pointer"
                                  title="Change Photo"
                                >
                                  <Upload size={12} />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleContactPersonChange(index, 'profile_image', '')}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                                  title="Remove Photo"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <label
                              htmlFor={`contact-image-upload-${index}`}
                              className="flex items-center justify-between w-full px-3 py-3 border border-gray-200 rounded-sm hover:border-[#FF7B1D] hover:bg-orange-50 transition-all cursor-pointer group/label"
                            >
                              <span className="text-xs text-gray-400">Upload photo</span>
                              <Upload size={14} className="text-gray-400 group-hover/label:text-[#FF7B1D]" />
                            </label>
                          )}
                        </div>
                      </div>

                      <div className="group">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                          <User size={14} className="text-[#FF7B1D]" />
                          Gender
                        </label>
                        <select
                          className={inputStyles}
                          value={contact.gender}
                          onChange={(e) => handleContactPersonChange(index, 'gender', e.target.value)}
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="group">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                          <Calendar size={14} className="text-[#FF7B1D]" />
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          className={inputStyles}
                          value={contact.dob}
                          onChange={(e) => handleContactPersonChange(index, 'dob', e.target.value)}
                        />
                      </div>

                      <div className="group col-span-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                          <Briefcase size={14} className="text-[#FF7B1D]" />
                          Designation
                        </label>
                        <input
                          type="text"
                          placeholder="Enter designation"
                          className={inputStyles}
                          value={contact.designation}
                          onChange={(e) => handleContactPersonChange(index, 'designation', e.target.value)}
                        />
                      </div>

                      <div className="group">
                        <div className="flex items-center justify-between mb-2">
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <Phone size={14} className="text-[#FF7B1D]" />
                            Mobile Number
                          </label>
                          <label className="flex items-center gap-2 text-[10px] text-gray-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={contact.mobile_same_as_whatsapp}
                              onChange={(e) => handleContactPersonChange(index, 'mobile_same_as_whatsapp', e.target.checked)}
                              className="w-3.5 h-3.5 text-[#FF7B1D] rounded-sm"
                            />
                            Same as WhatsApp
                          </label>
                        </div>
                        <input
                          type="text"
                          placeholder="Enter mobile number"
                          className={inputStyles}
                          value={contact.mobile_number}
                          onChange={(e) => handleContactPersonChange(index, 'mobile_number', e.target.value)}
                          onBlur={(e) => handleMobileBlur(`Mobile Number (Contact ${index + 1})`, e.target.value)}
                          maxLength={15}
                        />
                      </div>

                      <div className="group">
                        <div className="flex items-center justify-between mb-2">
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <Phone size={14} className="text-[#FF7B1D]" />
                            Alternate Mobile
                          </label>
                          <label className="flex items-center gap-2 text-[10px] text-gray-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={contact.alt_mobile_same_as_whatsapp}
                              onChange={(e) => handleContactPersonChange(index, 'alt_mobile_same_as_whatsapp', e.target.checked)}
                              className="w-3.5 h-3.5 text-[#FF7B1D] rounded-sm"
                            />
                            Same as WhatsApp
                          </label>
                        </div>
                        <input
                          type="text"
                          placeholder="Enter alternate mobile"
                          className={inputStyles}
                          value={contact.alt_mobile_number}
                          onChange={(e) => handleContactPersonChange(index, 'alt_mobile_number', e.target.value)}
                          onBlur={(e) => handleMobileBlur(`Alternate Mobile (Contact ${index + 1})`, e.target.value)}
                          maxLength={15}
                        />
                      </div>

                      <div className="group">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                          <Phone size={14} className="text-[#FF7B1D]" />
                          WhatsApp Number
                        </label>
                        <input
                          type="text"
                          placeholder="Enter WhatsApp number"
                          className={inputStyles}
                          value={contact.whatsapp_number}
                          onChange={(e) => handleContactPersonChange(index, 'whatsapp_number', e.target.value)}
                          onBlur={(e) => handleMobileBlur(`WhatsApp Number (Contact ${index + 1})`, e.target.value)}
                          disabled={contact.mobile_same_as_whatsapp || contact.alt_mobile_same_as_whatsapp}
                          maxLength={15}
                        />
                      </div>

                      <div className="group">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                          <Mail size={14} className="text-[#FF7B1D]" />
                          Email
                        </label>
                        <input
                          type="email"
                          placeholder="Enter email"
                          className={inputStyles}
                          value={contact.email}
                          onChange={(e) => handleContactPersonChange(index, 'email', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Common Fields */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <Layers size={20} className="text-[#FF7B1D]" />
              <h3 className="text-lg font-bold text-gray-800 capitalize">
                Common Information
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="group md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <IndianRupee size={14} className="text-[#FF7B1D]" />
                  Budget / Expected Value
                </label>
                <input
                  type="number"
                  name="value"
                  placeholder="Enter budget"
                  className={inputStyles}
                  value={formData.value}
                  onChange={handleChange}
                />
              </div>

              {/* Interested In — custom multi-select dropdown */}
              <div className="group md:col-span-2" data-multiselect style={{ position: 'relative', zIndex: openMultiSelect === 'interested_in' ? 30 : 1 }}>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <FileText size={14} className="text-[#FF7B1D]" />
                  Interested In
                  <span className="text-xs text-gray-400 font-normal">(select multiple)</span>
                </label>

                {/* Trigger button */}
                <div
                  onClick={() => setOpenMultiSelect(prev => prev === 'interested_in' ? null : 'interested_in')}
                  className="w-full min-h-[46px] px-3 py-2 border border-gray-200 rounded-sm cursor-pointer flex flex-wrap gap-1.5 items-center bg-white hover:border-[#FF7B1D] transition-all"
                >
                  {formData.interested_in.length === 0 ? (
                    <span className="text-sm text-gray-400">Select options...</span>
                  ) : (
                    formData.interested_in.map(item => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-600 text-xs font-semibold rounded-sm"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleInterestedInToggle(item); }}
                          className="hover:text-orange-800 leading-none"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))
                  )}
                  <span className="ml-auto text-gray-400 text-xs">{openMultiSelect === 'interested_in' ? '▲' : '▼'}</span>
                </div>

                {/* Dropdown list */}
                {openMultiSelect === 'interested_in' && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-sm shadow-lg z-50 max-h-52 overflow-y-auto">
                    {interestedInOptions.map(option => (
                      <label
                        key={option}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={formData.interested_in.includes(option)}
                          onChange={() => handleInterestedInToggle(option)}
                          className="w-4 h-4 accent-[#FF7B1D] cursor-pointer"
                        />
                        <span className="text-sm text-gray-700 font-medium">{option}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>



              <div className="group">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <FileText size={14} className="text-[#FF7B1D]" />
                  Lead Source
                </label>
                <select
                  name="lead_source"
                  value={formData.lead_source}
                  onChange={handleChange}
                  className={inputStyles}
                >
                  <option value="">Select Source</option>
                  <option value="Indiamart">Indiamart</option>
                  <option value="Direct">Direct</option>
                  <option value="Meta">Meta</option>
                  <option value="Justdial">Justdial</option>
                  <option value="Website">Website</option>
                </select>
              </div>

              <div className="group">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Calendar size={14} className="text-[#FF7B1D]" />
                  Lead Date & Time
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    name="created_at"
                    className={inputStyles}
                    value={formData.created_at}
                    onChange={handleChange}
                  />
                  <div className="relative">
                    <input
                      type="time"
                      name="created_time"
                      className={inputStyles + " pr-10"}
                      value={formData.created_time}
                      onChange={handleChange}
                    />
                    <Clock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 italic">Defaults to current date & time if not selected</p>
              </div>

              <div className="group">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <User size={14} className="text-[#FF7B1D]" />
                  Lead Owner
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled
                    value={formData.lead_owner || ""}
                    className={inputStyles + " bg-gray-50 cursor-not-allowed border-gray-100"}
                    placeholder="Auto-assigned"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                  </div>
                </div>
              </div>

              <div className="group">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Workflow size={14} className="text-[#FF7B1D]" />
                  Select Pipeline
                </label>
                <select
                  name="pipeline_id"
                  value={formData.pipeline_id}
                  onChange={handleChange}
                  className={inputStyles}
                >
                  <option value="">Select Pipeline</option>
                  {pipelines?.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="group">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Layers size={14} className="text-[#FF7B1D]" />
                  Select Stage
                </label>
                <select
                  name="stage_id"
                  value={formData.stage_id}
                  onChange={handleChange}
                  className={inputStyles}
                  disabled={!formData.pipeline_id}
                >
                  <option value="">Select Stage</option>
                  {filteredStages?.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="group md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Phone size={14} className="text-[#FF7B1D]" />
                  Referral (Search by mobile number)
                </label>
                <input
                  type="text"
                  name="referral_mobile"
                  placeholder="Enter referral mobile number"
                  className={inputStyles}
                  value={formData.referral_mobile}
                  onChange={handleChange}
                />
              </div>


            </div>
          </div>

          {/* Tags */}
          <div className="group">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Tag size={14} className="text-[#FF7B1D]" />
              Tags{" "}
              <span className="text-xs text-gray-400 ml-2">
                (Press Enter to add)
              </span>
            </label>
            <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-2 border-gray-200 rounded-lg focus-within:border-[#FF7B1D] bg-white">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-[#FF7B1D] text-sm font-semibold rounded-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:bg-orange-200 rounded-full p-0.5"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={tags.length === 0 ? "Type and press Enter to add tags..." : "Add more..."}
                className="flex-1 min-w-[120px] outline-none text-sm bg-transparent"
              />
            </div>
          </div>

          {/* Custom Fields */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-[#FF7B1D]" />
                <h3 className="text-lg font-bold text-gray-800 capitalize">
                  Custom Fields
                </h3>
              </div>
              <button
                type="button"
                onClick={addCustomField}
                className="flex items-center gap-2 px-3 py-1.5 bg-orange-500 text-white rounded-sm hover:bg-orange-600 transition-colors text-sm font-semibold"
              >
                <Plus size={16} />
                Add Field
              </button>
            </div>

            {customFields.map((field, index) => (
              <div key={index} className="grid grid-cols-2 gap-3 items-end">
                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    Label
                  </label>
                  <input
                    type="text"
                    placeholder="Enter label"
                    className={inputStyles}
                    value={field.label}
                    onChange={(e) => handleCustomFieldChange(index, 'label', e.target.value)}
                  />
                </div>
                <div className="group flex gap-2">
                  <div className="flex-1">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      Value
                    </label>
                    <input
                      type="text"
                      placeholder="Enter value"
                      className={inputStyles}
                      value={field.value}
                      onChange={(e) => handleCustomFieldChange(index, 'value', e.target.value)}
                    />
                  </div>
                  {customFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCustomField(index)}
                      className="text-red-500 hover:text-red-700 transition-colors self-end pb-3"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-sm hover:bg-gray-100 transition-all font-semibold capitalize"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isCreating || isUpdating}
            className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-sm hover:from-orange-600 hover:to-orange-700 transition-all font-semibold shadow-lg disabled:opacity-50 capitalize"
          >
            {isCreating || isUpdating ? "Saving..." : leadToEdit ? "Update Lead" : "Save Lead"}
          </button>
        </div>
      </div>
    </div>
  );
}
