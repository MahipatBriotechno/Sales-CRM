import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AddNoteModal from "../../../components/LeadManagement/LeadPipLineStatus/AddNotes";
import CreateCallLogModal from "../../../components/LeadManagement/LeadPipLineStatus/CreateCallLogModal";
import AddMeetingModal from "../../../components/LeadManagement/LeadPipLineStatus/AddMeetingModal";
import {
  useAddLeadNoteMutation,
  useAddLeadCallMutation,
  useAddLeadFileMutation,
  useAddLeadMeetingMutation,
  useUpdateLeadNoteMutation,
  useUpdateLeadFileMutation,
  useUpdateLeadMeetingMutation,
  useDeleteLeadNoteMutation,
  useDeleteLeadCallMutation,
  useDeleteLeadFileMutation,
  useDeleteLeadMeetingMutation,
  useHitCallMutation,
  useUpdateLeadStatusMutation,
  useUpdateLeadMutation,
  useGetLeadByIdQuery,
  useGetAssignmentSettingsQuery,
  useManualAssignLeadsMutation
} from "../../../store/api/leadApi";
import { useGetEmployeesQuery } from "../../../store/api/employeeApi";
import { useCreateQuotationMutation } from "../../../store/api/quotationApi";
import { useGetPipelineByIdQuery } from "../../../store/api/pipelineApi";
import CreateQuotationModal from "../../QuotationPart/CreateQuotationModal";
import LeadSidebar from "./LeadSidebar";
import LeadTabs from "./LeadTable";
import CallActionPopup from "../../../components/AddNewLeads/CallActionPopup";
import CallQrModal from "../../../components/LeadManagement/CallQrModal";
import LeadDeleteConfirmationModal from "../../../components/LeadManagement/LeadPipLineStatus/LeadDeleteConfirmationModal";
import ConvertClientModal from "../../../components/LeadManagement/ConvertClientModal";
import { toast } from "react-hot-toast";
import { FaWhatsapp } from "react-icons/fa";
import SendWhatsAppModal from "../../../components/LeadManagement/SendWhatsAppModal";
import {
  Edit2,
  ChevronDown,
  Star,
  ArrowLeftCircle,
  PhoneCall,
  Calendar,
  FileText,
  Phone,
  File,
  Mail,
  Users,
  Zap,
  X,
  UserCheck,
  Check,
} from "lucide-react";

export default function CRMLeadDetail() {
  const location = useLocation();
  const navigate = useNavigate();

  // State
  const [showConvertModal, setShowConvertModal] = useState(false);

  const safeParseDate = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr;

    let str = String(dateStr).trim();
    if (!str) return null;

    // Handle ISO strings with Z or offsets correctly
    if (str.includes('Z') || /[+-]\d{2}(:?\d{2})?$/.test(str)) {
      const d = new Date(str.replace(' ', 'T'));
      if (!isNaN(d)) return d;
    }

    // Treat "YYYY-MM-DD HH:mm:ss" as local time for maximum compatibility
    const parts = str.split(/[- T:]/);
    if (parts.length >= 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const hour = parts[3] ? parseInt(parts[3], 10) : 0;
      const minute = parts[4] ? parseInt(parts[4], 10) : 0;
      const second = parts[5] ? parseInt(parts[5], 10) : 0;

      if (str.length > 10) {
        const d = new Date(Date.UTC(year, month, day, hour, minute, second));
        if (!isNaN(d)) return d;
      } else {
        const d = new Date(year, month, day, hour, minute, second);
        if (!isNaN(d)) return d;
      }
    }

    const finalParsed = new Date(str.replace(' ', 'T'));
    return isNaN(finalParsed) ? new Date(str) : finalParsed;
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('data:') || path.startsWith('http')) return path;
    const baseUrl = (import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000/api/').replace('/api/', '');
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  // State Management
  const [activeTab, setActiveTab] = useState("activities");
  const [isEditingLead, setIsEditingLead] = useState(false);
  const [isEditingOwner, setIsEditingOwner] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState("High");
  const [selectedSort, setSelectedSort] = useState("Last 7 Days");
  const [editItem, setEditItem] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [pipelineStage, setPipelineStage] = useState("Not Contacted");
  const [callPopupData, setCallPopupData] = useState({ isOpen: false, lead: null, initialResponse: null });
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, itemId: null });
  const [showDropModal, setShowDropModal] = useState(false);
  const [dropReason, setDropReason] = useState("");
  const [dropRemarks, setDropRemarks] = useState("");
  const [showConfirmDrop, setShowConfirmDrop] = useState(false);

  const dropReasons = [
    "Not Interested",
    "Budget Issue",
    "Already Purchased",
    "No Requirement",
    "Not Right Time",
    "Trust Issue",
    "Wrong Lead",
    "Others"
  ];

  // Data Fetching
  const passedLead = location.state?.lead;
  const { id } = useParams();
  const leadId = passedLead?.id || id;
  const { data: leadFromQuery, isLoading: leadLoading } = useGetLeadByIdQuery(leadId, { skip: !leadId });
  const { data: rules } = useGetAssignmentSettingsQuery();
  const { data: employeesData } = useGetEmployeesQuery({ limit: 1000, status: 'Active' });
  const employees = employeesData?.employees || [];
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [showJourney, setShowJourney] = useState(false);
  const [showStageDropdown, setShowStageDropdown] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const stageDropdownRef = useRef(null);
  const [quotationFormData, setQuotationFormData] = useState({
    customerType: "Individual",
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    billingAddress: "",
    shippingAddress: "",
    state: "",
    pincode: "",
    gstin: "",
    pan: "",
    cin: "",
    quotationNo: `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    quotationDate: new Date().toISOString().split("T")[0],
    validUntil: "",
    salesExecutive: "",
    currency: "INR",
    lineItems: [],
    subtotal: 0,
    tax: 0,
    discount: 0,
    totalAmount: 0,
    terms_and_conditions: "",
    status: "Draft",
  });

  // Format currency to match the display format
  const formatCurrency = (value) => {
    if (!value && value !== 0) return "₹0";
    const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, "")) : value;
    if (isNaN(numericValue)) return "₹0";

    const [intPart] = numericValue.toFixed(0).split(".");
    const lastThree = intPart.substring(intPart.length - 3);
    const otherNumbers = intPart.substring(0, intPart.length - 3);
    const formatted =
      otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") +
      (otherNumbers ? "," : "") +
      lastThree;
    return "₹" + formatted;
  };

  // Get lead data from query or navigation state
  const [leadData, setLeadData] = useState(null);

  useEffect(() => {
    if (leadFromQuery) {
      setLeadData({
        ...leadFromQuery,
        name: leadFromQuery.name,
        address: leadFromQuery.address || leadFromQuery.location,
        company: leadFromQuery.type === "Person" ? "Individual" : leadFromQuery.organization_name || leadFromQuery.name,
        dateCreated: leadFromQuery.created_at ? (safeParseDate(leadFromQuery.created_at)?.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) || "-") : "-",
        value: formatCurrency(leadFromQuery.value || leadFromQuery.estimated_value),
        dueDate: leadFromQuery.created_at ? (safeParseDate(leadFromQuery.created_at)?.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) || "-") : "-",
        followUp: leadFromQuery.next_call_at ? (safeParseDate(leadFromQuery.next_call_at)?.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) || "-") : "-",
        source: leadFromQuery.lead_source || "-",
        email: leadFromQuery.email,
        phone: leadFromQuery.mobile_number || leadFromQuery.phone,
        status: leadFromQuery.status,
        tag: leadFromQuery.tag || "Not Contacted",
        tags: leadFromQuery.tags || [],
        services: leadFromQuery.interested_in || "",
        priority: leadFromQuery.priority || "High",
        visibility: leadFromQuery.visibility,
        id: leadFromQuery.id,
        owner: { name: leadFromQuery.lead_owner || "N/A", img: "https://i.pravatar.cc/150?img=12" },
        assignee: { name: leadFromQuery.employee_name || "-", img: "https://i.pravatar.cc/150?img=5" },
        modifiedBy: { name: "Darlee Robertson", img: "https://i.pravatar.cc/150?img=8" },
        city: leadFromQuery.city || "-",
        state: leadFromQuery.state || "-",
        pincode: leadFromQuery.pincode || "-",
        altMobileNumber: leadFromQuery.alt_mobile_number || "-",
        gender: leadFromQuery.gender || "Male",
        fullName: leadFromQuery.full_name || leadFromQuery.name,
        profileImage: getImageUrl(leadFromQuery.profile_image),
        assigned_to: leadFromQuery.assigned_to,
        call_count: leadFromQuery.call_count || 0
      });
      setPipelineStage(leadFromQuery.tag || "Not Contacted");
    } else if (passedLead && !leadData) {
      setLeadData({
        ...passedLead,
        phone: passedLead.mobile_number || passedLead.phone,
        call_count: passedLead.call_count || 0
      });
    }
  }, [leadFromQuery, passedLead]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (stageDropdownRef.current && !stageDropdownRef.current.contains(event.target)) {
        setShowStageDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const isFollowUp = (leadData?.tag === "Follow Up" || leadData?.tag === "Missed" || leadData?.status === "In Progress");
  const isWon = (leadData?.status === "Closed" || leadData?.tag === "Won");
  const isDropped = (leadData?.status === "Dropped" || leadData?.tag === "Lost" || leadData?.tag === "Dropped" || leadData?.status === "Not Qualified");

  // Fetch Pipeline Details for dynamic stages
  const { data: pipelineData } = useGetPipelineByIdQuery(leadData?.pipeline_id, { skip: !leadData?.pipeline_id });

  // Define effective stages (Dynamic or Default)
  const stageColors = ["bg-purple-600", "bg-blue-600", "bg-cyan-600", "bg-indigo-600", "bg-orange-600", "bg-green-600", "bg-red-600"];

  const effectiveStages = (pipelineData?.stages?.length > 0)
    ? pipelineData.stages.map((s, idx) => ({
      label: s.name,
      id: s.id,
      status: s.is_final ? "Won" : "In Progress",
      color: stageColors[idx % stageColors.length],
      active: leadData?.stage_id === s.id || leadData?.stage_name === s.name || leadData?.tag === s.name,
      raw: s
    }))
    : [
      { label: "Not Contacted", status: "New Lead", color: "bg-purple-600", active: (leadData?.tag === "Not Contacted" || leadData?.tag === "New Lead") },
      { label: "Contacted", status: "In Progress", color: "bg-blue-600", active: (leadData?.tag === "Not Connected" || leadData?.tag === "Follow Up" || leadData?.status === "In Progress") && !isWon && !isDropped },
      { label: "Closed", status: "Won", color: "bg-yellow-500", active: isWon },
      { label: "Lost", status: "Not Qualified", color: "bg-red-600", active: isDropped },
    ];

  const currentStageIndex = effectiveStages.findIndex(s => s.active);

  const isOnlyCallTabEnabled = (leadData?.call_count > 0) && !isFollowUp && !isWon && !isDropped;
  const isTabsEnabled = isFollowUp || isWon || isDropped || (leadData?.call_count > 0);


  const canNotQualified = (leadData?.call_count || 0) >= (rules?.max_call_attempts || 5) || isFollowUp;

  const openCallAction = (initialResponse = null) => {
    setCallPopupData({ isOpen: true, lead: leadData, initialResponse });
  };

  // Opens the QR scan screen first; afterwards handleProceedFromQr decides the form
  const openQrCall = () => {
    setIsQrModalOpen(true);
  };

  // Called when user clicks "Add Call Log" / "Proceed" inside the QR modal
  const handleProceedFromQr = () => {
    setIsQrModalOpen(false);
    setCallPopupData({ isOpen: true, lead: leadData });
  };

  const handleLeadInfoSave = async (updatedData) => {
    try {
      const processedTags = typeof updatedData.tags === 'string'
        ? updatedData.tags.split(',').map(t => t.trim()).filter(t => t !== "")
        : (Array.isArray(updatedData.tags) ? updatedData.tags : []);

      const rawServices = updatedData.interested_in || updatedData.services;
      const processedServices = typeof rawServices === 'string'
        ? rawServices.split(',').map(s => s.trim()).filter(s => s !== "")
        : (Array.isArray(rawServices) ? rawServices : []);

      // Map frontend fields back to backend expected fields
      const apiData = {
        name: updatedData.name,
        fullName: updatedData.fullName,
        gender: updatedData.gender,
        email: updatedData.email,
        mobile_number: updatedData.phone,
        alt_mobile_number: updatedData.altMobileNumber,
        address: updatedData.address,
        city: updatedData.city,
        state: updatedData.state,
        pincode: updatedData.pincode,
        estimated_value: updatedData.value,
        status: updatedData.status,
        visibility: updatedData.visibility,
        tag: updatedData.tag,
        tags: processedTags,
        interested_in: processedServices.join(', '),
        priority: updatedData.priority,
        owner_name: updatedData.ownerNameText || updatedData.ownerName,
        owner: updatedData.ownerName, // Maps to assigned_to in backend
        lead_owner: updatedData.lead_owner
      };

      await updateLead({ id: updatedData.id, data: apiData }).unwrap();

      // Update local state for immediate feedback
      setLeadData((prev) => {
        const selectedEmployee = employees.find(e => e.id == updatedData.ownerName);
        const newAssigneeName = selectedEmployee?.employee_name || "-";

        return {
          ...prev,
          ...updatedData,
          tags: processedTags,
          services: processedServices.join(', '),
          assigned_to: updatedData.ownerName,
          assignee: {
            ...prev.assignee,
            name: newAssigneeName
          },
          // Update lead_owner in local state if it changed
          owner: {
            ...prev.owner,
            name: updatedData.lead_owner || prev.owner.name
          },
          lead_owner: updatedData.lead_owner || prev.lead_owner,
          owner_name: newAssigneeName
        };
      });

      setPipelineStage(leadFromQuery.tag || "Not Contacted");
    } catch (error) {
      console.error("Failed to update lead:", error);
      throw error;
    }
  };

  const handleSingleFieldUpdate = async (field, value) => {
    try {
      const fieldMapping = {
        phone: 'mobile_number',
        altMobileNumber: 'alt_mobile_number',
        whatsapp_number: 'whatsapp_number',
        budget: 'value',
        fullName: 'full_name',
        source: 'lead_source',
        value: 'value',
        address: 'address',
        city: 'city',
        state: 'state',
        country: 'country',
        pincode: 'pincode',
        email: 'email',
        gender: 'gender',
        status: 'status',
        tag: 'tag',
        priority: 'priority',
        assigned_to: 'assigned_to',
        lead_owner: 'lead_owner',
        name: 'name',
        services: 'interested_in',
        followUp: 'next_call_at',
        industry_type: 'industry_type',
        company_email: 'company_email',
        company_phone: 'company_phone',
        website: 'website',
        gst_number: 'gst_number',
        referral_mobile: 'referral_mobile',
        visibility: 'visibility',
        org_city: 'org_city',
        org_state: 'org_state',
        org_country: 'org_country',
        org_pincode: 'org_pincode',
        company_address: 'company_address'
      };

      const backendField = fieldMapping[field] || field;
      let processedValue = value;

      if (field === 'value' && typeof value === 'string') {
        processedValue = parseFloat(value.replace(/[^0-9.-]+/g, "")) || 0;
      }

      await updateLead({ id: leadData.id, data: { [backendField]: processedValue } }).unwrap();

      setLeadData((prev) => {
        let updated = { ...prev, [field]: value };

        // Handle special dependencies
        if (field === 'assigned_to') {
          const selectedEmployee = employees.find(e => (e.id == value || e.employee_id === value));
          updated.assignee = { ...prev.assignee, name: selectedEmployee?.employee_name || "-" };
        }
        if (field === 'lead_owner') {
          updated.owner = { ...prev.owner, name: value };
        }

        return updated;
      });

      toast.success(`${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} updated successfully`);
    } catch (error) {
      console.error("Failed to update field:", error);
      toast.error("Failed to update field");
    }
  };

  const handleLeadUpdate = (field, value) => {
    setLeadData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleQuotationInputChange = (e) => {
    const { name, value } = e.target;
    setQuotationFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openQuotationModal = () => {
    setQuotationFormData(prev => ({
      ...prev,
      customerType: leadData.company && leadData.company !== "Individual" ? "Business" : "Individual",
      companyName: leadData.name || "",
      contactPerson: leadData.company && leadData.company !== "Individual" ? leadData.name : "",
      email: leadData.email || "",
      phone: leadData.phone || "",
      billingAddress: leadData.address || "",
      state: leadData.state || "",
      pincode: leadData.pincode || "",
      quotationNo: `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    }));
    setShowQuotationModal(true);
  };

  const handleCreateQuotation = async () => {
    try {
      const payload = {
        quotation_id: quotationFormData.quotationNo,
        customer_type: quotationFormData.customerType,
        company_name: quotationFormData.companyName,
        contact_person: quotationFormData.contactPerson,
        email: quotationFormData.email,
        phone: quotationFormData.phone,
        billing_address: quotationFormData.billingAddress,
        shipping_address: quotationFormData.shippingAddress,
        state: quotationFormData.state,
        pincode: quotationFormData.pincode,
        gstin: quotationFormData.gstin,
        pan_number: quotationFormData.pan,
        cin_number: quotationFormData.cin,
        quotation_date: quotationFormData.quotationDate,
        valid_until: quotationFormData.validUntil,
        sales_executive: quotationFormData.salesExecutive,
        currency: quotationFormData.currency,
        line_items: quotationFormData.lineItems,
        subtotal: quotationFormData.subtotal,
        tax: quotationFormData.tax,
        discount: quotationFormData.discount,
        total_amount: quotationFormData.totalAmount,
        terms_and_conditions: quotationFormData.terms_and_conditions,
        status: quotationFormData.status,
      };

      await createQuotation(payload).unwrap();
      toast.success("Quotation created successfully");
      setShowQuotationModal(false);
    } catch (err) {
      toast.error(err?.data?.message || "Error saving quotation");
    }
  };

  const [activeModal, setActiveModal] = useState({ type: null, isOpen: false });

  // Mutations
  const [updateLead] = useUpdateLeadMutation();
  const [createQuotation] = useCreateQuotationMutation();
  const [addLeadNote] = useAddLeadNoteMutation();
  const [addLeadCall] = useAddLeadCallMutation();
  const [addLeadFile] = useAddLeadFileMutation();
  const [addLeadMeeting] = useAddLeadMeetingMutation();
  const [updateLeadNote] = useUpdateLeadNoteMutation();
  const [updateLeadFile] = useUpdateLeadFileMutation();
  const [updateLeadMeeting] = useUpdateLeadMeetingMutation();
  const [updateLeadStatus] = useUpdateLeadStatusMutation();
  const [deleteLeadNote, { isLoading: isDeletingNote }] = useDeleteLeadNoteMutation();
  const [deleteLeadCall, { isLoading: isDeletingCall }] = useDeleteLeadCallMutation();
  const [deleteLeadFile, { isLoading: isDeletingFile }] = useDeleteLeadFileMutation();
  const [deleteLeadMeeting, { isLoading: isDeletingMeeting }] = useDeleteLeadMeetingMutation();

  const handleSaveNote = async (noteData) => {
    try {
      if (editItem) {
        await updateLeadNote({
          leadId: passedLead?.id,
          noteId: editItem.id,
          data: { title: noteData.title, description: noteData.description }
        }).unwrap();
        toast.success("Note updated successfully");
      } else {
        const formData = new FormData();
        formData.append('title', noteData.title);
        formData.append('description', noteData.description);
        if (noteData.files) {
          Array.from(noteData.files).forEach(file => formData.append('files', file));
        }

        await addLeadNote({ id: passedLead?.id, data: formData }).unwrap();
        toast.success("Note added successfully");
      }
      setEditItem(null);
      setActiveModal({ type: null, isOpen: false });
    } catch (error) {
      toast.error(`Failed to ${editItem ? 'update' : 'add'} note`);
      console.error(error);
    }
  };

  const handleEditItem = (type, item) => {
    setEditItem(item);
    setActiveModal({ type, isOpen: true });
  };

  const handleDeleteClick = (type, itemId) => {
    setDeleteModal({ isOpen: true, type, itemId });
  };

  const handleConfirmDelete = async () => {
    const { type, itemId } = deleteModal;
    try {
      if (type === 'note') {
        await deleteLeadNote({ leadId: passedLead?.id, noteId: itemId }).unwrap();
        toast.success("Note deleted successfully");
      } else if (type === 'call') {
        await deleteLeadCall({ leadId: passedLead?.id, callId: itemId }).unwrap();
        toast.success("Call log deleted successfully");
      } else if (type === 'file') {
        await deleteLeadFile({ leadId: passedLead?.id, fileId: itemId }).unwrap();
        toast.success("File deleted successfully");
      } else if (type === 'meeting') {
        await deleteLeadMeeting({ leadId: passedLead?.id, meetingId: itemId }).unwrap();
        toast.success("Meeting deleted successfully");
      }
      setDeleteModal({ isOpen: false, type: null, itemId: null });
    } catch (error) {
      toast.error(`Failed to delete ${type}`);
      console.error(error);
    }
  };

  const handleSaveCall = async (callData) => {
    try {
      await addLeadCall({ id: passedLead?.id, data: callData }).unwrap();

      // Update local state and backend status based on call status
      const positiveStatuses = ["Interested", "Follow-up Required", "Callback Scheduled", "Demo Scheduled", "Meeting Scheduled", "Quotation Sent", "Negotiation"];
      const convertedStatus = "Converted / Sale Closed";
      const negativeStatuses = ["Not Interested", "Lost Lead", "Wrong Requirement", "Duplicate Lead", "Do Not Call (DNC)"];

      if (positiveStatuses.includes(callData.status)) {
        await updateLeadStatus({
          id: passedLead?.id,
          status: "In Progress",
          tag: "Follow Up"
        }).unwrap();
        setLeadData(prev => ({ ...prev, status: "In Progress", tag: "Follow Up", call_count: (prev.call_count || 0) + 1, priority: callData.priority || prev.priority }));
        setPipelineStage("Follow Up");
        toast.success(`Call logged & status updated to In Progress`);
      } else if (callData.status === convertedStatus) {
        await updateLeadStatus({
          id: passedLead?.id,
          status: "Closed",
          tag: "Closed"
        }).unwrap();
        setLeadData(prev => ({ ...prev, status: "Closed", tag: "Closed", call_count: (prev.call_count || 0) + 1, priority: callData.priority || prev.priority }));
        setPipelineStage("Closed");
        toast.success(`Call logged & status updated to Closed`);
      } else if (negativeStatuses.includes(callData.status)) {
        await updateLeadStatus({
          id: passedLead?.id,
          status: "Lost",
          tag: "Lost"
        }).unwrap();
        setLeadData(prev => ({ ...prev, status: "Lost", tag: "Lost", call_count: (prev.call_count || 0) + 1 }));
        setPipelineStage("Lost");
        toast.success(`Call logged & status updated to Lost`);
      } else {
        // Assume Not Connected for other statuses (Call Disconnected) if currently not connected
        if (leadData?.tag !== "Follow Up" && leadData?.status !== "In Progress" && leadData?.tag !== "Connected" && leadData?.status !== "Closed" && leadData?.status !== "Lost") {
          const newTag = "Not Connected";
          await updateLeadStatus({
            id: passedLead?.id,
            status: "Not Connected",
            tag: newTag
          }).unwrap();
          setLeadData(prev => ({ ...prev, status: "Not Connected", tag: newTag, call_count: (prev.call_count || 0) + 1 }));
          setPipelineStage("Not Connected");
          toast.success("Call logged & status updated to Not Connected");
        } else {
          setLeadData(prev => ({ ...prev, call_count: (prev.call_count || 0) + 1 }));
          toast.success("Call logged successfully");
        }
      }

      setActiveModal({ type: null, isOpen: false });
    } catch (error) {
      toast.error("Failed to log call");
      console.error(error);
    }
  };

  const handleSaveFile = async (fileData) => {
    try {
      if (editItem) {
        await updateLeadFile({
          leadId: passedLead?.id,
          fileId: editItem.id,
          data: { title: fileData.title, description: fileData.description }
        }).unwrap();
        toast.success("File updated successfully");
      } else {
        const formData = new FormData();
        formData.append('title', fileData.title);
        formData.append('description', fileData.description || '');
        if (fileData.files) {
          Array.from(fileData.files).forEach(file => {
            formData.append('files', file);
          });
        }
        await addLeadFile({ id: passedLead?.id, data: formData }).unwrap();
        toast.success("File uploaded successfully");
      }
      setEditItem(null);
      setActiveModal({ type: null, isOpen: false });
    } catch (error) {
      toast.error(`Failed to ${editItem ? 'update' : 'upload'} file`);
      console.error(error);
    }
  };

  const handleSaveMeeting = async (meetingData) => {
    try {
      if (editItem) {
        await updateLeadMeeting({
          leadId: passedLead?.id,
          meetingId: editItem.id,
          data: meetingData
        }).unwrap();
        toast.success("Meeting updated successfully");
      } else {
        await addLeadMeeting({ id: passedLead?.id, data: meetingData }).unwrap();
        toast.success("Meeting scheduled successfully");
      }
      setEditItem(null);
      setActiveModal({ type: null, isOpen: false });
    } catch (error) {
      const errorMsg = error?.data?.message || `Failed to ${editItem ? 'update' : 'schedule'} meeting`;
      toast.error(errorMsg);
      console.error(error);
    }
  };

  const handleDownload = (filePath, fileName) => {
    if (!filePath) {
      toast.error("File path not found");
      return;
    }

    try {
      const baseUrl = (import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000/api/').replace('/api/', '');
      const url = filePath.startsWith('http') ? filePath : `${baseUrl}${filePath.startsWith('/') ? '' : '/'}${filePath}`;

      // For images and PDFs, opening in new tab is often better than direct download which might be blocked
      window.open(url, '_blank');
      toast.success("Opening file...");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to open file");
    }
  };

  const handleStageClick = async (stage) => {
    if (stage.status === "Not Qualified") {
      setShowConfirmDrop(false);
      setShowDropModal(true);
      return;
    }

    try {
      let backendStatus = stage.status;
      let backendTag = leadData?.tag;

      if (stage.status === "In Progress") {
        backendStatus = "In Progress";
        backendTag = "Follow Up";
      } else if (stage.status === "Won") {
        backendStatus = "Closed";
        backendTag = "Won";
      } else if (stage.status === "Not Connected" || stage.status === "New Lead") {
        openCallAction();
        return;
      }

      const updateData = { status: backendStatus, tag: backendTag };
      if (stage.id) {
        updateData.stage_id = stage.id;
      }

      await updateLead({ id: leadData?.id, data: updateData }).unwrap();
      toast.success(`Moved to ${stage.label}`);
    } catch (err) {
      toast.error("Failed to update stage");
    }
  };

  const handleUpdateStatus = async (status) => {
    if (status === "Not Qualified") {
      setShowConfirmDrop(false);
      setShowDropModal(true);
      return;
    }
    try {
      let backendStatus = status;
      let backendTag = leadData?.tag;

      if (status === "In Progress") {
        backendStatus = "In Progress";
        backendTag = "Follow Up";
      } else if (status === "Won") {
        backendStatus = "Closed";
        backendTag = "Won";
      } else if (status === "Not Connected" || status === "New Lead") {
        openCallAction(); // Just open call action choice
        return;
      }

      await updateLeadStatus({ id: leadData?.id, status: backendStatus, tag: backendTag }).unwrap();
      toast.success(`Status updated to ${status}`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleDropLead = async () => {
    if (!dropReason) {
      toast.error("Please select a reason");
      return;
    }
    if (!dropRemarks.trim()) {
      toast.error("Remarks are mandatory");
      return;
    }

    if (!showConfirmDrop) {
      setShowConfirmDrop(true);
      return;
    }

    try {
      await updateLeadStatus({
        id: leadData?.id,
        status: "Dropped",
        tag: "Dropped",
        drop_reason: dropReason,
        remarks: dropRemarks
      }).unwrap();
      toast.success("Lead marked as Dropped");
      setShowDropModal(false);
      setShowConfirmDrop(false);
      setDropReason("");
      setDropRemarks("");
    } catch (err) {
      console.error("Drop lead error:", err);
      toast.error(err?.data?.message || "Failed to drop lead");
    }
  };

  const [hitCallMutation] = useHitCallMutation();

  const handleHitCall = async (callData) => {
    try {
      const res = await hitCallMutation({
        ...callData
      }).unwrap();

      if (res.reassigned) {
        toast.error(res.message);
        // If reassigned, we should probably redirect back to leads list or refresh the whole lead status
        setLeadData(prev => ({
          ...prev,
          assigned_to: null,
          owner_name: null,
          status: 'New Lead',
          tag: 'Not Contacted',
          call_count: 0
        }));
        return;
      }

      // If call was connected, automatically move to In Progress, update local state
      if (callData.response === "connected") {
        await updateLeadStatus({
          id: callData.id,
          status: "In Progress",
          tag: "Follow Up"
        }).unwrap();
        setLeadData(prev => ({ ...prev, status: "In Progress", tag: "Follow Up", call_count: (prev.call_count || 0) + 1 }));
        setPipelineStage("Follow Up");
        toast.success("Lead moved to In Progress");
      } else {
        // If not connected, ensure status reflects that locally
        if (leadData?.tag !== "Follow Up" && leadData?.status !== "In Progress" && leadData?.tag !== "Connected") {
          setLeadData(prev => ({ ...prev, status: "Not Connected", tag: "Not Connected", call_count: (prev.call_count || 0) + 1 }));
          setPipelineStage("Not Connected");
        } else {
          setLeadData(prev => ({ ...prev, call_count: (prev.call_count || 0) + 1 }));
        }
        toast.success("Lead status updated based on call response");
      }
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update call status");
    }
  };



  return (
    <>
      <div className="min-h-screen bg-gray-0 flex flex-col">
        {/* Back Button */}
        <div className="bg-white px-8 py-3 border-b border-gray-100 flex items-center">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-bold tracking-tight transition-colors"
          >
            <ArrowLeftCircle size={20} className="text-gray-500" />
            Back to Leads
          </button>
        </div>

        <div className="flex flex-1">
          {/* Left Sidebar */}
          <LeadSidebar
            leadData={leadData}
            isEditingLead={isEditingLead}
            isEditingOwner={isEditingOwner}
            setIsEditingOwner={setIsEditingOwner}
            handleLeadUpdate={handleLeadUpdate}
            handleSingleFieldUpdate={handleSingleFieldUpdate}
            formatCurrency={formatCurrency}
            setShowModal={setShowQuotationModal}
            handleQrCall={openQrCall}
            employees={employees}
            handleUpdateStatus={handleUpdateStatus}
            setShowWhatsAppModal={setShowWhatsAppModal}
          />

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Pipeline Status */}
            <div className="px-8 pt-4 pb-4 bg-white border-b shadow-sm flex flex-col gap-2">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-gray-800 capitalize tracking-wide flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-500 fill-orange-500" /> Lead Status
                </h2>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowJourney(!showJourney)}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-none font-semibold text-sm hover:bg-orange-100 transition-all shadow-sm hover:shadow active:scale-95 group font-primary"
                  >
                    View Journey
                    <ChevronDown size={16} className={`transition-transform duration-300 ${showJourney ? 'rotate-180' : ''}`} />
                  </button>

                  <button
                    disabled={!canNotQualified}
                    onClick={() => handleUpdateStatus("Not Qualified")}
                    className={`px-4 py-2 rounded-none text-sm font-semibold font-primary border transition-all active:scale-95 shadow-sm hover:shadow min-w-[120px] ${leadData?.status === "Not Qualified" || leadData?.tag === "Lost" || leadData?.tag === "Dropped"
                      ? "bg-red-600 text-white border-red-600 shadow-md"
                      : canNotQualified
                        ? "bg-red-50 text-red-600 border-red-100 hover:border-red-500 hover:bg-red-100"
                        : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                      }`}
                  >
                    Drop Lead
                  </button>

                  {/* Move Dropdown to where Drop Lead button was */}
                  <div className="relative" ref={stageDropdownRef}>
                    <button
                      onClick={() => setShowStageDropdown(!showStageDropdown)}
                      className={`flex items-center gap-2 px-5 py-2 rounded-none text-sm font-semibold shadow-md text-white transition-all active:scale-95 border border-white/20 min-w-[200px] justify-between ${effectiveStages.find(s => s.active)?.color || 'bg-slate-700'} hover:brightness-110 font-primary hover:shadow-lg`}
                    >
                      <div className="flex flex-row items-center gap-2 leading-tight">
                        <span className="">Current Stage</span>{" : "}
                        <span>{effectiveStages.find(s => s.active)?.label || "Initial"}</span>
                      </div>
                      <ChevronDown size={16} className={`transition-transform duration-300 ${showStageDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showStageDropdown && (
                      <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-gray-100 py-3 shadow-xl rounded-none z-[110] animate-fadeIn">
                        <div className="px-4 mb-2 pb-2 border-b border-gray-50">
                          <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Update Pipeline Stage</h4>
                        </div>
                        <div className="max-h-72 overflow-y-auto custom-scrollbar px-1">
                          {effectiveStages.map((stage, idx) => {
                            const isCompleted = idx <= currentStageIndex;
                            return (
                              <button
                                key={stage.label + idx}
                                onClick={() => {
                                  handleStageClick(stage);
                                  setShowStageDropdown(false);
                                }}
                                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors group ${stage.active ? 'bg-orange-50/50' : ''}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-5 h-5 rounded-none border-2 flex items-center justify-center transition-all ${isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-200 group-hover:border-orange-300'}`}>
                                    {isCompleted && <Check size={14} className="text-white font-black" />}
                                  </div>
                                  <span className={`text-[13px] font-semibold ${stage.active ? 'text-orange-600' : 'text-gray-700'}`}>{stage.label}</span>
                                </div>
                                <div className={`w-2 h-2 rounded-full ${stage.color}`}></div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ══════════ Lead Status Flow Diagram ══════════ */}
              <div className={`transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${showJourney ? 'max-h-[400px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0 invisible'}`}>
                {(() => {
                  // ── Node state helpers ──
                  const isNewLead = !isFollowUp && !isWon && !isDropped && leadData?.tag !== "Not Connected";
                  const isNotConn = leadData?.tag === "Not Connected";
                  const isConnected = isFollowUp || isWon || isDropped;

                  // "Reached Connected" = in Follow Up OR has call_count > 0 and not stuck at NC/New
                  // This captures the intermediate "Contact Attempted" state too
                  const hasBeenConnected = isConnected
                    || (!isNotConn && !isNewLead && (leadData?.call_count || 0) > 0)
                    || leadData?.status === "In Progress";

                  const isFollowUpActive = isFollowUp && !isWon && !isDropped;

                  // Detect if lead went via "Not Connected" path:
                  // - Currently tagged "Not Connected", OR
                  // - call_count > 1 means NC was attempted first, then got connected
                  const wentViaNc = isNotConn
                    || ((leadData?.call_count || 0) > 1 && hasBeenConnected);

                  // Completed = visited in past (stepper logic)
                  const nlCompleted = !isNewLead;
                  const ncCompleted = hasBeenConnected && wentViaNc;  // NC visited + moved past
                  const coCompleted = isWon || isDropped;
                  const fuCompleted = isWon || isDropped;

                  // ── Color helpers ──
                  // nodeStyle(active, completed, color)
                  const nodeStyle = (active, completed, color) => {
                    if (active) return {
                      circle: { stroke: color, fill: color + '18', strokeWidth: 2.5, filter: `drop-shadow(0 0 8px ${color}55)` },
                      text: color,
                    };
                    if (completed) return {
                      circle: { stroke: color, fill: color + '12', strokeWidth: 1.8 },
                      text: color + 'bb',
                    };
                    return {
                      circle: { stroke: '#d1d5db', fill: 'white', strokeWidth: 1.5 },
                      text: '#9ca3af',
                    };
                  };

                  const lineColor = (active, color) => active ? color : '#d1d5db';
                  const lineDash = (active) => active ? '0' : '6,4';

                  // ── Uniform radius for all nodes ──
                  const R = 40;

                  // Positions: cx, cy
                  const NL = { cx: 85, cy: 120 };
                  const NC = { cx: 285, cy: 60 };
                  const CO = { cx: 285, cy: 185 };
                  const FU = { cx: 510, cy: 122 };
                  const DR = { cx: 730, cy: 62 };
                  const WON = { cx: 730, cy: 182 };

                  // Arrow endpoint helpers (point on circle edge toward target)
                  const edge = (from, to, r) => {
                    const dx = to.cx - from.cx, dy = to.cy - from.cy;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    return { x: from.cx + dx / d * r, y: from.cy + dy / d * r };
                  };

                  const currentCalls = leadData?.call_count || 0;

                  // ── Arrow active states ──
                  // Orange: NL → NC — active if currently in NC or completed NC in past
                  const nlToNC = isNotConn || ncCompleted;
                  // Green: NL → CO DIRECT — ONLY when lead did NOT go via NC
                  const nlToCO = hasBeenConnected && !wentViaNc;
                  // Green: NC ↓ CO vertical — ONLY when lead HAS BEEN connected via NC path
                  const ncToCO = hasBeenConnected && wentViaNc;
                  const ncToFU = false;
                  // Blue: CO → Follow Ups — once in Follow Up stage
                  const coToFU = isFollowUp || isWon || isDropped;
                  const fuToDR = isDropped;
                  const fuToWON = isWon;

                  // ── NEW: Progressive NC Border Logic ──
                  const maxAttempts = rules?.max_call_attempts || 5;
                  const ncProgressPercentage = wentViaNc ? Math.min((currentCalls / maxAttempts), 1) : 0;
                  const circumference = 2 * Math.PI * R;
                  const ncStrokeOffset = circumference * (1 - ncProgressPercentage);

                  // Highlight NC → Drop if lead reached max attempts OR is dropped via NC path
                  const ncToDR = (currentCalls >= maxAttempts) || (isDropped && (wentViaNc || isNotConn));


                  return (
                    <div className={`w-full overflow-x-auto transform transition-all duration-700 delay-100 ${showJourney ? 'translate-y-0 scale-100' : '-translate-y-4 scale-95'}`}>
                      <svg
                        viewBox="0 0 840 240"
                        className="w-full"
                        style={{ minWidth: 600, minHeight: 200 }}
                      >
                        <defs>
                          {[
                            { id: 'mOrActive', color: '#f97316' },
                            { id: 'mGrActive', color: '#22c55e' },
                            { id: 'mBlActive', color: '#3b82f6' },
                            { id: 'mRedActive', color: '#ef4444' },
                            { id: 'mDgActive', color: '#16a34a' },
                            { id: 'mGy', color: '#d1d5db' },
                          ].map(({ id, color }) => (
                            <marker key={id} id={id} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                              <polygon points="0 0, 8 4, 0 8" fill={color} />
                            </marker>
                          ))}
                        </defs>

                        {/* ══ ARROWS ══ */}

                        {/* New Leads → Not Connected */}
                        <path
                          d="M 122,98 C 165,72 225,58 245,60"
                          fill="none" stroke={lineColor(nlToNC, '#f97316')}
                          strokeWidth="1.8" strokeDasharray={lineDash(nlToNC)}
                          markerEnd={`url(#${nlToNC ? 'mOrActive' : 'mGy'})`} className="transition-all duration-500"
                        />
                        {/* New Leads → Connected */}
                        <path
                          d="M 122,143 C 165,165 225,183 245,185"
                          fill="none" stroke={lineColor(nlToCO, '#22c55e')}
                          strokeWidth="1.8" strokeDasharray={lineDash(nlToCO)}
                          markerEnd={`url(#${nlToCO ? 'mGrActive' : 'mGy'})`} className="transition-all duration-500"
                        />
                        {/* Not Connected ↓ Connected (Progress line) */}
                        <path
                          d="M 285,100 L 285,145"
                          fill="none" stroke={lineColor(ncToCO, '#22c55e')}
                          strokeWidth="1.8" strokeDasharray={lineDash(ncToCO)}
                          markerEnd={`url(#${ncToCO ? 'mGrActive' : 'mGy'})`} className="transition-all duration-500"
                        />

                        {/* Not Connected → Drop Direct (When max attempts hit) */}
                        <path
                          d="M 325,60 C 420,35 580,35 690,62"
                          fill="none" stroke={lineColor(ncToDR, '#ef4444')}
                          strokeWidth="1.8" strokeDasharray={lineDash(ncToDR)}
                          markerEnd={`url(#${ncToDR ? 'mRedActive' : 'mGy'})`} className="transition-all duration-500"
                        />

                        {/* Connected → Follow Ups */}
                        <path
                          d="M 325,180 C 375,200 430,148 470,124"
                          fill="none" stroke={lineColor(coToFU, '#3b82f6')}
                          strokeWidth="1.8" strokeDasharray={lineDash(coToFU)}
                          markerEnd={`url(#${coToFU ? 'mBlActive' : 'mGy'})`} className="transition-all duration-500"
                        />
                        {/* Follow Ups → Drop */}
                        <path
                          d="M 549,100 C 593,74 642,60 690,62"
                          fill="none" stroke={lineColor(fuToDR, '#ef4444')}
                          strokeWidth="1.8" strokeDasharray={lineDash(fuToDR)}
                          markerEnd={`url(#${fuToDR ? 'mRedActive' : 'mGy'})`} className="transition-all duration-500"
                        />
                        {/* Follow Ups → Won */}
                        <path
                          d="M 549,145 C 593,167 642,178 690,182"
                          fill="none" stroke={lineColor(fuToWON, '#16a34a')}
                          strokeWidth="1.8" strokeDasharray={lineDash(fuToWON)}
                          markerEnd={`url(#${fuToWON ? 'mDgActive' : 'mGy'})`} className="transition-all duration-500"
                        />

                        {/* ══ NODE: New Leads ══ */}
                        {(() => {
                          const s = nodeStyle(isNewLead, nlCompleted, '#7c3aed');
                          return (
                            <g>
                              <circle cx={NL.cx} cy={NL.cy} r={R} style={s.circle} className="transition-all duration-500" />
                              <text x={NL.cx} y={NL.cy - 6} textAnchor="middle" fontSize="11" fontWeight="700" fill={s.text} className="transition-all duration-500">New</text>
                              <text x={NL.cx} y={NL.cy + 9} textAnchor="middle" fontSize="11" fontWeight="700" fill={s.text} className="transition-all duration-500">Leads</text>
                            </g>
                          );
                        })()}

                        {/* ══ NODE: Not Connected ══ */}
                        {(() => {
                          const s = nodeStyle(isNotConn, ncCompleted, '#f97316');
                          const isActiveOrProgress = isNotConn || ncCompleted;

                          return (
                            <g onClick={() => openCallAction()} style={{ cursor: 'pointer' }}>
                              {/* Background Circle */}
                              <circle cx={NC.cx} cy={NC.cy} r={R} fill="white" stroke="#e5e7eb" strokeWidth="1.5" />

                              {/* Progressive Stroke Circle */}
                              <circle
                                cx={NC.cx}
                                cy={NC.cy}
                                r={R}
                                fill="none"
                                stroke={isActiveOrProgress ? '#f97316' : '#d1d5db'}
                                strokeWidth={isActiveOrProgress ? "2.5" : "1.5"}
                                strokeDasharray={circumference}
                                strokeDashoffset={ncStrokeOffset}
                                transform={`rotate(-90 ${NC.cx} ${NC.cy})`}
                                style={{
                                  transition: 'stroke-dashoffset 0.8s ease-in-out, stroke 0.3s',
                                  filter: isActiveOrProgress ? 'drop-shadow(0 0 4px #f9731644)' : 'none'
                                }}
                              />

                              <text x={NC.cx} y={NC.cy - 6} textAnchor="middle" fontSize="10" fontWeight="700" fill={isActiveOrProgress ? '#f97316' : '#9ca3af'} className="transition-all duration-500">Not</text>
                              <text x={NC.cx} y={NC.cy + 7} textAnchor="middle" fontSize="10" fontWeight="700" fill={isActiveOrProgress ? '#f97316' : '#9ca3af'} className="transition-all duration-500">Connected</text>
                            </g>
                          );
                        })()}

                        {/* ══ NODE: Connected ══ */}
                        {(() => {
                          // Active = has been connected but not yet at Follow Up (intermediate state)
                          const isCoActive = hasBeenConnected && !isConnected && !coCompleted;
                          const isCoCompleted = isConnected && !coCompleted; // was connected and now in FU
                          const s = nodeStyle(isCoActive, isCoCompleted || coCompleted || hasBeenConnected, '#16a34a');
                          return (
                            <g onClick={() => openCallAction('connected')} style={{ cursor: 'pointer' }}>
                              <circle cx={CO.cx} cy={CO.cy} r={R} style={s.circle} className="transition-all duration-500" />
                              <text x={CO.cx} y={CO.cy + 5} textAnchor="middle" fontSize="11" fontWeight="700" fill={s.text} className="transition-all duration-500">Connected</text>
                            </g>
                          );
                        })()}

                        {/* ══ NODE: Follow Ups ══ */}
                        {(() => {
                          const s = nodeStyle(isFollowUpActive, fuCompleted, '#2563eb');
                          return (
                            <g>
                              <circle cx={FU.cx} cy={FU.cy} r={R} style={s.circle} className="transition-all duration-500" />
                              <text x={FU.cx} y={FU.cy - 6} textAnchor="middle" fontSize="11" fontWeight="700" fill={s.text} className="transition-all duration-500">Follow</text>
                              <text x={FU.cx} y={FU.cy + 9} textAnchor="middle" fontSize="11" fontWeight="700" fill={s.text} className="transition-all duration-500">Ups</text>
                            </g>
                          );
                        })()}

                        {/* ══ NODE: Drop ══ */}
                        {(() => {
                          const s = nodeStyle(isDropped, false, '#ef4444');
                          const clickable = canNotQualified && !isDropped;
                          return (
                            <g onClick={() => clickable && handleUpdateStatus("Not Qualified")} style={{ cursor: clickable ? 'pointer' : 'default', opacity: !canNotQualified && !isDropped ? 0.35 : 1 }}>
                              <circle cx={DR.cx} cy={DR.cy} r={R} style={s.circle} className="transition-all duration-500" />
                              <text x={DR.cx} y={DR.cy + 5} textAnchor="middle" fontSize="11" fontWeight="700" fill={s.text} className="transition-all duration-500">Drop</text>
                            </g>
                          );
                        })()}

                        {/* ══ NODE: Won ══ */}
                        {(() => {
                          const s = nodeStyle(isWon, false, '#16a34a');
                          const clickable = isFollowUp && !isWon && !isDropped;
                          return (
                            <g onClick={() => clickable && handleUpdateStatus("Won")} style={{ cursor: clickable ? 'pointer' : 'default', opacity: !isFollowUp && !isWon ? 0.35 : 1 }}>
                              <circle cx={WON.cx} cy={WON.cy} r={R} style={s.circle} className="transition-all duration-500" />
                              <text x={WON.cx} y={WON.cy + 5} textAnchor="middle" fontSize="11" fontWeight="700" fill={s.text} className="transition-all duration-500">Won</text>
                            </g>
                          );
                        })()}
                      </svg>
                    </div>
                  );
                })()}

              </div>

              {/* Tabs Navigation */}
              <div className="bg-white border-b px-8 py-3">
                <div className="relative flex w-full overflow-x-auto no-scrollbar gap-2 p-1 bg-orange-50/50 rounded-none border border-orange-100">
                  
                  {/* Sliding Background Block */}
                  <div 
                    className="absolute top-1 bottom-1 bg-orange-500 shadow-md shadow-orange-500/20 transition-transform duration-300 ease-in-out z-0 rounded-none"
                    style={{ 
                      left: '4px',
                      width: `calc((100% - 8px - 48px) / 7)`, 
                      transform: `translateX(calc(${['activities', 'notes', 'calls', 'files', 'email', 'whatsapp', 'meeting'].indexOf(activeTab)} * 100% + ${['activities', 'notes', 'calls', 'files', 'email', 'whatsapp', 'meeting'].indexOf(activeTab)} * 8px))` 
                    }}
                  />

                  {[
                    { id: "activities", label: "Activities", Icon: Zap },
                    { id: "notes", label: "Notes", Icon: FileText },
                    { id: "calls", label: "Calls", Icon: Phone },
                    { id: "files", label: "Files", Icon: File },
                    { id: "email", label: "Email", Icon: Mail },
                    { id: "whatsapp", label: "WhatsApp", Icon: FaWhatsapp },
                    { id: "meeting", label: "Meeting", Icon: Users },
                  ].map(({ id, label, Icon }) => {
                    const isTabDisabled = id === "activities" ? false : (isOnlyCallTabEnabled ? (id !== "calls" && id !== "activities") : !isTabsEnabled);
                    const isActive = activeTab === id;
                    return (
                      <button
                        key={id}
                        onClick={() => {
                          if (!isTabDisabled) setActiveTab(id);
                        }}
                        disabled={isTabDisabled}
                        className={`relative z-10 flex-1 py-2.5 px-4 font-bold font-primary flex items-center justify-center gap-2 rounded-none transition-colors duration-300 whitespace-nowrap text-sm tracking-wide ${isTabDisabled
                          ? "opacity-30 cursor-not-allowed text-gray-300"
                          : isActive
                            ? "text-white"
                            : "text-orange-900/60 hover:text-orange-600 hover:bg-orange-100/50"
                          }`}
                      >
                        <Icon size={id === 'whatsapp' ? 18 : 16} className={`transition-colors duration-300 ${isActive ? 'text-white' : (id === 'whatsapp' ? 'text-[#25D366]' : 'text-orange-400')}`} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab Content */}
              <LeadTabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                setShowWhatsAppModal={setShowWhatsAppModal}
                isDisabled={activeTab === "activities" ? false : (isOnlyCallTabEnabled ? (activeTab !== "calls" && activeTab !== "activities") : !isTabsEnabled)}
                selectedSort={selectedSort}
                setSelectedSort={setSelectedSort}
                showSortDropdown={showSortDropdown}
                setShowSortDropdown={setShowSortDropdown}
                onAddClick={(type) => {
                  const isTabDisabled = isOnlyCallTabEnabled ? (activeTab !== "calls" && activeTab !== "activities") : !isTabsEnabled;
                  if (isTabDisabled) return;
                  if (type === 'call') {
                    const isNotConnected = (leadData?.tag === "Not Connected" || leadData?.status === "Not Connected");
                    const hasAttempts = (leadData?.call_count || 0) > 0;

                    if (isNotConnected && hasAttempts) {
                      setCallPopupData({
                        isOpen: true,
                        lead: leadData,
                        initialResponse: null,
                        onConnectedSelect: async () => {
                          try {
                            await updateLeadStatus({
                              id: leadData?.id,
                              status: "In Progress",
                              tag: "Follow Up"
                            }).unwrap();
                            setLeadData(prev => ({ ...prev, status: "In Progress", tag: "Follow Up" }));
                            setPipelineStage("Follow Up");
                            toast.success("Connected! Lead moved to In Progress");
                          } catch (e) {
                            console.error("Failed to update status", e);
                          }
                          setCallPopupData({ isOpen: false, lead: null, initialResponse: null });
                          // Use setTimeout to allow state update to process before opening new modal
                          setTimeout(() => setActiveModal({ type: 'call', isOpen: true }), 0);
                        }
                      });
                      return;
                    }
                  }
                  setEditItem(null);
                  setActiveModal({ type, isOpen: true });
                }}
                onEditClick={(type, data) => {
                  const isTabDisabled = isOnlyCallTabEnabled ? (activeTab !== "calls" && activeTab !== "activities") : !isTabsEnabled;
                  if (!isTabDisabled) handleEditItem(type, data);
                }}
                onDeleteClick={(type, id) => {
                  const isTabDisabled = isOnlyCallTabEnabled ? (activeTab !== "calls" && activeTab !== "activities") : !isTabsEnabled;
                  if (!isTabDisabled) handleDeleteClick(type, id);
                }}
                onDownloadClick={handleDownload}
                leadId={passedLead?.id}
              />
            </div>
          </div>
        </div>

        <LeadDeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, type: null, itemId: null })}
          onConfirm={handleConfirmDelete}
          isLoading={isDeletingNote || isDeletingCall || isDeletingFile || isDeletingMeeting}
          title={`Delete Lead ${deleteModal.type === 'note' ? 'Note' : deleteModal.type === 'call' ? 'Call Log' : deleteModal.type === 'file' ? 'File' : 'Meeting'}`}
          message={`Are you sure you want to delete this ${deleteModal.type}? This action cannot be undone.`}
        />

        {/* Modals */}
        {
          activeModal.type === 'note' && (
            <AddNoteModal
              open={activeModal.isOpen}
              onClose={() => {
                setActiveModal({ type: null, isOpen: false });
                setEditItem(null);
              }}
              onSave={handleSaveNote}
              editData={editItem}
            />
          )
        }

        {
          activeModal.type === 'file' && (
            <AddNoteModal
              open={activeModal.isOpen}
              onClose={() => {
                setActiveModal({ type: null, isOpen: false });
                setEditItem(null);
              }}
              onSave={handleSaveFile}
              title={editItem ? "Edit File Info" : "Upload File"}
              editData={editItem}
            />
          )
        }

        {
          activeModal.type === 'call' && (
            <CreateCallLogModal
              open={activeModal.isOpen}
              onClose={() => setActiveModal({ type: null, isOpen: false })}
              onSave={handleSaveCall}
            />
          )
        }

        {
          activeModal.type === 'meeting' && (
            <AddMeetingModal
              open={activeModal.isOpen}
              onClose={() => {
                setActiveModal({ type: null, isOpen: false });
                setEditItem(null);
              }}
              onSave={handleSaveMeeting}
              editData={editItem}
              employees={employees}
            />
          )
        }

        {
          showQuotationModal && (
            <CreateQuotationModal
              showModal={showQuotationModal}
              setShowModal={setShowQuotationModal}
              formData={quotationFormData}
              handleInputChange={handleQuotationInputChange}
              handleCreateQuotation={handleCreateQuotation}
              setFormData={setQuotationFormData}
            />
          )
        }

        {
          callPopupData.isOpen && (
            <CallActionPopup
              isOpen={callPopupData.isOpen}
              onClose={() => setCallPopupData({ isOpen: false, lead: null, initialResponse: null })}
              lead={callPopupData.lead}
              rules={rules}
              onHitCall={handleHitCall}
              onConnectedSelect={callPopupData.onConnectedSelect}
            />
          )
        }

        {/* QR scan modal — shown before the call log form for the floating call button */}
        <CallQrModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          lead={leadData}
          onProceedToLog={handleProceedFromQr}
          onViewProfile={() => { }}
        />

        <ConvertClientModal
          isOpen={showConvertModal}
          onClose={() => setShowConvertModal(false)}
          leadData={leadData}
        />

        <SendWhatsAppModal
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          lead={leadData}
        />

        {/* Disqualify Lead Modal */}
        {
          showDropModal && (
            <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[100] p-4 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white w-full max-w-xl rounded-none shadow-2xl overflow-hidden animate-slideUp font-primary">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="bg-white bg-opacity-20 p-2.5 rounded-none">
                      <Zap size={24} className="text-white fill-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white capitalize tracking-wide leading-tight">
                        Disqualify Lead
                      </h2>
                      <p className="text-xs text-red-50 font-medium opacity-90">
                        {showConfirmDrop ? "Final confirmation for lead investigation" : "Provide details to move lead to investigation"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDropModal(false)}
                    className="text-white hover:bg-white hover:bg-opacity-20 p-2 transition-all rounded-full"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="p-8 space-y-6">
                  {!showConfirmDrop ? (
                    <>
                      <div className="bg-red-50 p-4 border border-red-100 rounded-none flex items-start gap-3 shadow-sm">
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-1.5 animate-pulse shrink-0"></div>
                        <div>
                          <p className="text-[13px] text-red-700 font-bold uppercase tracking-wider mb-0.5">
                            Marking as Not Qualified
                          </p>
                          <p className="text-[11px] text-red-600 font-medium opacity-80 leading-relaxed text-left">
                            Please select a reason and provide mandatory remarks. This lead will be automatically assigned to the Investigation Officer.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[15px] font-semibold text-gray-700 mb-2 capitalize">
                          <ChevronDown size={14} className="text-red-500" />
                          Reason for Disqualification <span className="text-red-500 font-black">*</span>
                        </label>
                        <select
                          value={dropReason}
                          onChange={(e) => setDropReason(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-none focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-opacity-20 outline-none transition-all text-sm font-semibold bg-white hover:border-gray-300 shadow-sm"
                        >
                          <option value="">Select a specific reason</option>
                          {dropReasons.map(reason => (
                            <option key={reason} value={reason}>{reason}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[15px] font-semibold text-gray-700 mb-2 capitalize">
                          <FileText size={14} className="text-red-500" />
                          Detailed Remarks <span className="text-red-500 font-black">*</span>
                        </label>
                        <textarea
                          value={dropRemarks}
                          onChange={(e) => setDropRemarks(e.target.value)}
                          placeholder="Explain why this lead isn't a good fit..."
                          className="w-full px-4 py-3 border border-gray-200 rounded-none focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-opacity-20 outline-none transition-all text-sm font-medium h-32 resize-none bg-white placeholder-gray-400 shadow-sm hover:border-gray-300"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="py-6 animate-fadeIn">
                      <div className="flex flex-col items-center text-center space-y-6">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-600 shadow-inner border-2 border-red-100">
                          <Zap size={40} className="fill-red-600" />
                        </div>
                        <div className="space-y-3 px-4">
                          <h3 className="text-xl font-black text-gray-800 uppercase tracking-tighter">Final Commitment</h3>
                          <p className="text-sm text-gray-600 font-medium leading-relaxed">
                            Are you sure you want to drop this lead? Once dropped, it will be <span className="text-red-600 font-bold border-b border-red-200">automatically assigned to the Leads Investigation Officer</span> for further review.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => showConfirmDrop ? setShowConfirmDrop(false) : setShowDropModal(false)}
                      className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 font-bold rounded-none hover:bg-gray-100 transition-all text-xs uppercase tracking-widest active:scale-95 bg-white shadow-sm"
                    >
                      {showConfirmDrop ? "Back To Edit" : "Cancel"}
                    </button>
                    <button
                      onClick={handleDropLead}
                      disabled={!dropReason || !dropRemarks.trim()}
                      className={`flex-1 px-6 py-3 font-bold rounded-none transition-all text-xs uppercase tracking-widest active:scale-95 shadow-lg flex items-center justify-center gap-2 ${!dropReason || !dropRemarks.trim()
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                        : "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800"
                        }`}
                    >
                      {showConfirmDrop ? "Yes, Drop Lead Now" : "Continue Drop"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Floating Action Buttons */}
        <div className="fixed bottom-10 right-10 flex flex-row gap-4 z-50">
          <a
            href={leadData?.email ? `mailto:${leadData.email}` : '#'}
            className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-white rounded-none flex items-center justify-center text-white shadow-xl hover:shadow-blue-500/40 transition-all transform hover:-translate-y-1 active:scale-95"
          >
            <Mail size={24} />
          </a>
          <button
            onClick={() => setShowWhatsAppModal(true)}
            className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 border-2 border-white rounded-none flex items-center justify-center text-white shadow-xl hover:shadow-green-500/40 transition-all transform hover:-translate-y-1 active:scale-95"
            title="Send WhatsApp Message"
          >
            <FaWhatsapp size={26} />
          </button>
          <button
            onClick={openQrCall}
            className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 border-2 border-white rounded-none flex items-center justify-center text-white shadow-xl hover:shadow-orange-500/40 transition-all transform hover:-translate-y-1 active:scale-95"
          >
            <Phone size={24} />
          </button>
        </div>
      </div>
    </>
  );
}


