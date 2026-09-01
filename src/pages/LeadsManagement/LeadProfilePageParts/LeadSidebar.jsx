import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  Edit2,
  Star,
  Plus,
  Calendar,
  Phone,
  Mail,
  MapPin,
  User,
  Hash,
  FileText,
  Zap,
  DollarSign,
  ChevronDown,
  Clock,
  Briefcase,
  Shield,
  Heart,
  Globe,
  Layers,
  CheckCircle,
  History,
  TrendingUp,
  UserCheck,
  Users,
  AlertCircle,
  Upload,
  X,
  Check,
} from "lucide-react";
import { FaBuilding, FaWhatsapp } from "react-icons/fa";
import Modal from "../../../components/common/Modal";

import { toast } from "react-hot-toast";
import ActionGuard from "../../../components/common/ActionGuard";
import ConvertClientModal from "../../../components/LeadManagement/ConvertClientModal";

const interestedInOptions = [
  "Product Demo",
  "Pricing Info",
  "Support",
  "Partnership",
  "Consultation",
  "Training",
  "Other"
];

export default function LeadSidebar({
  leadData,
  isEditingLead,
  isEditingOwner,
  setIsEditingOwner,
  handleLeadUpdate,
  handleSingleFieldUpdate,
  formatCurrency,
  setShowModal,
  handleQrCall,
  employees = [],
  handleUpdateStatus,
  setShowWhatsAppModal,
}) {
  const leadType = leadData?.type || "Individual";
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editingSection, setEditingSection] = useState(null);
  const [sectionValues, setSectionValues] = useState({});
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [openMultiSelect, setOpenMultiSelect] = useState(null);
  const [openSections, setOpenSections] = useState({ basic: true, location: false, business: false, contact: false, custom: false, ownership: false });

  const toggleSection = (sec) => setOpenSections(prev => ({...prev, [sec]: !prev[sec]}));

  const startEditing = (field, value) => {
    setEditingField(field);
    if (field === 'services') {
      // Convert comma-separated string to array for multi-select
      const initialArray = typeof value === 'string' && value.trim() !== ""
        ? value.split(',').map(s => s.trim())
        : [];
      setEditValue(initialArray);
    } else {
      setEditValue(value || "");
    }
    setEditingSection(null);
  };

  const handleInterestedInToggle = (item) => {
    setEditValue(prev => {
      const current = Array.isArray(prev) ? prev : [];
      return current.includes(item)
        ? current.filter(s => s !== item)
        : [...current, item];
    });
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValue("");
    setOpenMultiSelect(null);
  };

  const startSectionEditing = (section, fields) => {
    const values = {};
    fields.forEach(field => {
      values[field] = leadData[field] || "";
    });
    setSectionValues(values);
    setEditingSection(section);
    setEditingField(null);
  };

  const cancelSectionEditing = () => {
    setEditingSection(null);
    setSectionValues({});
  };

  const handleSectionValueChange = (field, value) => {
    setSectionValues(prev => ({ ...prev, [field]: value }));
  };

  const saveSectionEditing = async () => {
    if (handleSingleFieldUpdate) {
      // Only update fields that have actually changed to minimize API calls
      for (const [field, value] of Object.entries(sectionValues)) {
        const originalValue = leadData[field] || "";
        if (value !== originalValue) {
          await handleSingleFieldUpdate(field, value);
        }
      }
    }
    setEditingSection(null);
    setSectionValues({});
  };

  const saveEditing = async (field) => {
    if (handleSingleFieldUpdate) {
      let finalValue = editValue;
      if (field === 'services' && Array.isArray(editValue)) {
        finalValue = editValue.join(', ');
      }
      await handleSingleFieldUpdate(field, finalValue);
    }
    setEditingField(null);
    setEditValue("");
    setOpenMultiSelect(null);
  };

  const getInitials = (name) => {
    if (!name || typeof name !== "string") return "";
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const renderEditableField = (label, field, currentValue, type = "text", options = [], IconComponent) => {
    const isEditing = editingField === field;
    const isSectionEditing = editingSection !== null && Object.prototype.hasOwnProperty.call(sectionValues, field);
    const value = isSectionEditing ? sectionValues[field] : (isEditing ? editValue : currentValue);

    return (
      <div className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0 group min-h-[40px]">
        <div className="flex items-center gap-2 text-slate-500">
          {IconComponent && <IconComponent size={14} className="text-slate-400" />}
          <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
        </div>

        {isEditing || isSectionEditing ? (
          <div className="flex flex-col gap-1 items-end flex-1 max-w-[200px] relative">
            {type === "select" ? (
              <select
                className="w-full p-1.5 text-xs border border-orange-200 rounded-none focus:border-orange-500 outline-none bg-white font-bold"
                value={value}
                onChange={(e) => isSectionEditing ? handleSectionValueChange(field, e.target.value) : setEditValue(e.target.value)}
                autoFocus={isEditing}
              >
                <option value="">Select {label}</option>
                {options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : type === "multi-select" ? (
              <div className="w-full relative">
                <div
                  onClick={() => setOpenMultiSelect(prev => prev === field ? null : field)}
                  className="w-full min-h-[30px] p-1.5 border border-orange-200 rounded-none cursor-pointer flex flex-wrap gap-1 items-center bg-white hover:border-orange-500 transition-all shadow-sm"
                >
                  {(!Array.isArray(value) || value.length === 0) ? (
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Select Options...</span>
                  ) : (
                    value.map(item => (
                      <span key={item} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-black rounded-none border border-orange-200">
                        {item}
                        <Plus
                          size={10}
                          className="rotate-45 hover:text-orange-800 cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); handleInterestedInToggle(item); }}
                        />
                      </span>
                    ))
                  )}
                  <ChevronDown size={10} className={`ml-auto text-gray-400 transition-transform ${openMultiSelect === field ? 'rotate-180' : ''}`} />
                </div>

                {openMultiSelect === field && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-none shadow-xl z-[100] w-[200px] max-h-48 overflow-y-auto ring-1 ring-black ring-opacity-5">
                    {interestedInOptions.map(option => (
                      <label key={option} className="flex items-center gap-2 px-3 py-2 hover:bg-orange-50 cursor-pointer transition-colors border-b last:border-0 border-gray-50">
                        <input
                          type="checkbox"
                          checked={Array.isArray(value) && value.includes(option)}
                          onChange={() => handleInterestedInToggle(option)}
                          className="w-3.5 h-3.5 accent-orange-500 cursor-pointer"
                        />
                        <span className="text-[11px] text-slate-700 font-bold uppercase">{option}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ) : type === "textarea" ? (
              <textarea
                className="w-full p-1.5 text-xs border border-orange-200 rounded-none focus:border-orange-500 outline-none bg-white font-bold min-h-[60px] resize-none"
                value={value}
                onChange={(e) => isSectionEditing ? handleSectionValueChange(field, e.target.value) : setEditValue(e.target.value)}
                autoFocus={isEditing}
              />
            ) : (
              <input
                type={type}
                className="w-full p-1.5 text-xs border border-orange-200 rounded-none focus:border-orange-500 outline-none bg-white font-bold"
                value={value}
                onChange={(e) => isSectionEditing ? handleSectionValueChange(field, e.target.value) : setEditValue(e.target.value)}
                autoFocus={isEditing}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isEditing) saveEditing(field);
                  if (e.key === 'Escape' && isEditing) cancelEditing();
                }}
              />
            )}
            {isEditing && (
              <div className="flex gap-1 mt-1">
                <button
                  onClick={cancelEditing}
                  title="Cancel"
                  className="w-6 h-6 flex items-center justify-center bg-rose-500 hover:bg-rose-600 text-white rounded-none shadow-sm transition-all active:scale-95"
                >
                  <X size={12} strokeWidth={3} />
                </button>
                <button
                  onClick={() => saveEditing(field)}
                  title="Save Change"
                  className="w-6 h-6 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white rounded-none shadow-sm transition-all active:scale-95"
                >
                  <Check size={12} strokeWidth={3} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 group/value flex-1 justify-end truncate">
            <span className={`font-bold text-xs text-right break-words max-w-[180px] capitalize truncate ${field === 'email' ? 'text-blue-600' : 'text-slate-800'}`}>
              {Array.isArray(currentValue)
                ? (currentValue.length > 0 ? currentValue.join(', ') : "N/A")
                : (currentValue || "N/A")}
            </span>
            {field === 'whatsapp_number' && currentValue && (
              <button 
                onClick={() => setShowWhatsAppModal(true)}
                className="p-1 hover:bg-green-50 text-[#25D366] rounded transition-all active:scale-90"
                title="Send WhatsApp Message"
              >
                <FaWhatsapp size={14} />
              </button>
            )}
            <ActionGuard permission="leads_edit" module="Leads Management" type="update">
              <Edit2
                size={14}
                className="text-slate-400 cursor-pointer opacity-0 group-hover/value:opacity-100 transition-opacity flex-shrink-0 hover:text-orange-500"
                onClick={() => startEditing(field, currentValue)}
              />
            </ActionGuard>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-[400px] bg-white shadow-sm h-full overflow-y-auto no-scrollbar border-l border-gray-100">
      {/* Employee-style Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-32 relative">
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
          <div className="w-24 h-24 bg-white rounded-full p-1 shadow-xl relative group overflow-hidden">
            {leadData?.type === 'Organization' ? (
              leadData.company_logo ? (
                <img src={leadData.company_logo} alt={leadData.organization_name} className="w-full h-full rounded-full object-contain bg-white p-1" />
              ) : (
                <div className="w-full h-full rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-3xl">
                  <FaBuilding size={32} />
                </div>
              )
            ) : leadData?.profileImage || leadData?.profile_image ? (
              <img
                src={leadData.profileImage || leadData.profile_image}
                alt={leadData.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-3xl">
                {getInitials(leadData?.name || "L").charAt(0)}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Edit2 size={16} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Profile Basic Info */}
      <div className="pt-16 pb-6 px-6 text-center border-b border-gray-100 min-h-[160px] flex flex-col items-center justify-center">
        {editingField === 'name' ? (
          <div className="flex flex-col gap-2 items-center mb-2 w-full animate-in fade-in slide-in-from-top-1 duration-200">
            <input
              type="text"
              className="w-full max-w-[280px] p-2 text-xl border border-orange-200 rounded-none focus:border-orange-500 outline-none bg-white font-bold text-center"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEditing('name');
                if (e.key === 'Escape') cancelEditing();
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={cancelEditing}
                title="Cancel"
                className="w-7 h-7 flex items-center justify-center bg-rose-500 hover:bg-rose-600 text-white rounded-none shadow-md transition-all active:scale-95"
              >
                <X size={14} strokeWidth={3} />
              </button>
              <button
                onClick={() => saveEditing('name')}
                title="Save Name"
                className="w-7 h-7 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white rounded-none shadow-md transition-all active:scale-95"
              >
                <Check size={14} strokeWidth={3} />
              </button>
            </div>
          </div>
        ) : (
          <div className="relative flex flex-col items-center justify-center w-full mb-1 group/name">
            <h2 className="text-2xl font-bold text-slate-800 uppercase truncate px-6" title={leadData?.name}>
              {leadData?.name?.length > 15 ? leadData?.name?.slice(0, 15) + '...' : leadData?.name || "Lead Name"}
            </h2>
            <ActionGuard permission="leads_edit" module="Leads Management" type="update">
              <button
                onClick={() => startEditing('name', leadData?.name)}
                className="absolute right-[5%] top-0 w-7 h-7 flex items-center justify-center bg-orange-500 text-white rounded-none opacity-0 group-hover/name:opacity-100 transition-all hover:bg-orange-600 shadow-lg"
              >
                <Edit2 size={12} />
              </button>
            </ActionGuard>
            {/* Lead Type - Non Editable */}
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
              {leadData?.type || "Individual"} Lead
            </span>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 mt-2 w-full">
          <p className="text-slate-600 font-bold text-[14px] flex items-center gap-2">
            <Phone size={14} className="text-orange-500" />
            {leadType === 'Organization' ? leadData?.company_phone : (leadData?.phone || leadData?.mobile_number) || "N/A"}
          </p>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="p-4 grid grid-cols-2 gap-3 border-b border-gray-100">
        <ActionGuard permission="leads_edit" module="Leads Management" type="update">
          <button
            onClick={() => setShowConvertModal(true)}
            disabled={leadData?.tag !== 'Follow Up' && leadData?.tag !== 'Missed'}
            className={`py-2.5 rounded-none text-sm font-semibold flex items-center justify-center gap-2 transition-all ${leadData?.tag === 'Follow Up' || leadData?.tag === 'Missed'
              ? "bg-slate-800 hover:bg-slate-900 text-white shadow-sm"
              : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
              }`}
          >
            <UserCheck className={`w-4 h-4 ${leadData?.tag === 'Follow Up' || leadData?.tag === 'Missed' ? 'text-orange-500' : 'text-slate-300'}`} /> Convert Client
          </button>
        </ActionGuard>
        <ActionGuard permission="leads_view_own" module="Leads Management" type="read">
          <button
            onClick={() => handleQrCall && handleQrCall()}
            className="bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-none text-sm font-semibold flex items-center justify-center gap-2 transition-colors "
          >
            <Phone className="w-4 h-4" /> Call Now
          </button>
        </ActionGuard>
      </div>

      {/* Quick Quick Info Cards */}
      <div className="px-6 py-5 space-y-4 border-b border-gray-100 bg-slate-50/30">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-bold uppercase tracking-wider flex items-center gap-2">
            <Hash className="w-4 h-4 text-slate-400" /> Lead ID
          </span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">#{leadData?.id || "N/A"}</span>
            {(leadData?.tag === 'Duplicate' || leadData?.duplicate_count > 1) && (
              <span className="text-[10px] text-rose-600 font-bold px-1.5 py-0.5 rounded-none bg-rose-50 border border-rose-100 capitalize tracking-wide w-fit animate-pulse">
                Duplicate {leadData?.duplicate_count > 1 ? `(${leadData.duplicate_count - 1})` : ''}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-bold uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-slate-400" /> Lead Status
          </span>
          <span className="px-3 py-1 rounded-none text-[10px] font-black uppercase tracking-tighter bg-orange-100 text-orange-600 border border-orange-200">
            {leadData?.tag || "New Lead"}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs group/budget relative">
          <span className="text-slate-500 font-bold uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-slate-400" /> Estimated Value
          </span>
          {editingField === 'budget' || editingField === 'value' ? (
            <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-1 duration-200">
              <input
                type="text"
                className="w-24 p-1 text-xs border border-orange-200 rounded-none focus:border-orange-500 outline-none bg-white font-bold text-emerald-600 text-right"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEditing('budget');
                  if (e.key === 'Escape') cancelEditing();
                }}
              />
              <button
                onClick={() => saveEditing('budget')}
                className="w-5 h-5 flex items-center justify-center bg-emerald-500 text-white rounded-none shadow-sm"
              >
                <Check size={10} strokeWidth={3} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-600 text-sm">
                {formatCurrency ? formatCurrency(leadData?.value) : `₹${leadData?.value || 0}`}
              </span>
              <ActionGuard permission="leads_edit" module="Leads Management" type="update">
                <button
                  onClick={() => startEditing('budget', leadData?.value)}
                  className="w-5 h-5 flex items-center justify-center bg-orange-500 text-white rounded-none opacity-0 group-hover/budget:opacity-100 transition-all hover:bg-orange-600 shadow-sm"
                >
                  <Edit2 size={10} />
                </button>
              </ActionGuard>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-6 space-y-2 pb-20 pt-2">
        {/* Core Lead Info */}
        <section className="bg-white border border-gray-100 rounded-none mb-2 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSection('basic')}>
            <h3 className="text-slate-800 font-bold text-sm tracking-tight flex items-center gap-2">
              <User size={16} className="text-orange-500" />
              Basic Information
            </h3>
            <div className="flex items-center gap-2">
              {editingSection === 'basic' ? (
              <div className="flex gap-1.5 animate-in fade-in slide-in-from-right-1 duration-200">
                <button
                  onClick={cancelSectionEditing}
                  title="Cancel All"
                  className="w-6 h-6 flex items-center justify-center bg-rose-500 hover:bg-rose-600 text-white rounded-none shadow-sm transition-all active:scale-95"
                >
                  <X size={12} strokeWidth={3} />
                </button>
                <button
                  onClick={saveSectionEditing}
                  title="Save All Changes"
                  className="w-6 h-6 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white rounded-none shadow-sm transition-all active:scale-95"
                >
                  <Check size={12} strokeWidth={3} />
                </button>
              </div>
            ) : (
              null /* !editingSection && !editingField && (
                <ActionGuard permission="leads_edit" module="Leads Management" type="update">
                  <button
                    onClick={() => {
                      const fields = leadType === 'Organization'
                        ? ['industry_type', 'company_email', 'company_phone', 'website', 'gst_number', 'visibility']
                        : ['gender', 'email', 'phone', 'altMobileNumber', 'whatsapp_number', 'dateOfBirth', 'visibility'];
                      startSectionEditing('basic', fields);
                    }}
                    className="w-6 h-6 flex items-center justify-center bg-orange-500 text-white rounded-none hover:bg-orange-600 transition-all shadow-md active:scale-95"
                  >
                    <Edit2 size={13} />
                  </button>
                </ActionGuard>
              ) */
            )}
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${openSections.basic ? 'rotate-180' : ''}`} />
            </div>
          </div>
          <div className={`space-y-0 p-3 pt-0 transition-all duration-300 ${openSections.basic ? 'block' : 'hidden'}`}>
            {leadType === 'Organization' ? (
              <>
                {renderEditableField("Industry", "industry_type", leadData?.industry_type, "select", [
                  { label: "IT", value: "Information Technology" },
                  { label: "Finance", value: "Finance" },
                  { label: "Healthcare", value: "Healthcare" },
                  { label: "Manufacturing", value: "Manufacturing" },
                  { label: "Retail", value: "Retail" },
                  { label: "Education", value: "Education" },
                  { label: "Other", value: "Other" }
                ], Briefcase)}
                {renderEditableField("Email", "company_email", leadData?.company_email, "email", [], Mail)}
                {renderEditableField("Phone", "company_phone", leadData?.company_phone, "tel", [], Phone)}
                {renderEditableField("Website", "website", leadData?.website, "text", [], Globe)}
                {renderEditableField("GST No.", "gst_number", leadData?.gst_number, "text", [], FileText)}
              </>
            ) : (
              <>
                {renderEditableField("Gender", "gender", leadData?.gender, "select", [
                  { label: "Male", value: "Male" },
                  { label: "Female", value: "Female" },
                  { label: "Other", value: "Other" }
                ], User)}
                {renderEditableField("Email", "email", leadData?.email, "email", [], Mail)}
                {renderEditableField("Phone", "phone", (leadData?.phone || leadData?.mobile_number), "tel", [], Phone)}
                {renderEditableField("Alt. Phone", "altMobileNumber", leadData?.altMobileNumber, "tel", [], History)}
                {renderEditableField("WhatsApp", "whatsapp_number", leadData?.whatsapp_number, "tel", [], FaWhatsapp)}
                {renderEditableField("Birthday", "dateOfBirth", leadData?.dateOfBirth, "date", [], Calendar)}
              </>
            )}
            {renderEditableField("Visibility", "visibility", leadData?.visibility, "select", [
              { label: "Public", value: "Public" },
              { label: "Private", value: "Private" }
            ], Shield)}
          </div>
        </section>

        {/* Location Section */}
        <section className="bg-white border border-gray-100 rounded-none mb-2 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSection('location')}>
            <h3 className="text-slate-800 font-bold text-sm tracking-tight flex items-center gap-2">
              <MapPin size={16} className="text-orange-500" />
              Location Details
            </h3>
            <div className="flex items-center gap-2">
              {editingSection === 'location' ? (
              <div className="flex gap-1.5 animate-in fade-in slide-in-from-right-1 duration-200">
                <button
                  onClick={cancelSectionEditing}
                  title="Cancel All"
                  className="w-6 h-6 flex items-center justify-center bg-rose-500 hover:bg-rose-600 text-white rounded-none shadow-sm transition-all active:scale-95"
                >
                  <X size={12} strokeWidth={3} />
                </button>
                <button
                  onClick={saveSectionEditing}
                  title="Save All Changes"
                  className="w-6 h-6 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white rounded-none shadow-sm transition-all active:scale-95"
                >
                  <Check size={12} strokeWidth={3} />
                </button>
              </div>
            ) : (
              null /* !editingSection && !editingField && (
                <ActionGuard permission="leads_edit" module="Leads Management" type="update">
                  <button
                    onClick={() => {
                      const fields = leadType === 'Organization'
                        ? ['company_address', 'org_city', 'org_state', 'org_pincode', 'org_country']
                        : ['address', 'city', 'state', 'pincode', 'country'];
                      startSectionEditing('location', fields);
                    }}
                    className="w-6 h-6 flex items-center justify-center bg-orange-500 text-white rounded-none hover:bg-orange-600 transition-all shadow-md active:scale-95"
                  >
                    <Edit2 size={13} />
                  </button>
                </ActionGuard>
              ) */
            )}
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${openSections.location ? 'rotate-180' : ''}`} />
            </div>
          </div>
          <div className={`space-y-0 p-3 pt-0 transition-all duration-300 ${openSections.location ? 'block' : 'hidden'}`}>
            {leadType === 'Organization' ? (
              <>
                {renderEditableField("Address", "company_address", leadData?.company_address, "textarea", [], MapPin)}
                {renderEditableField("City", "org_city", leadData?.org_city, "text", [], Globe)}
                {renderEditableField("State", "org_state", leadData?.org_state, "text", [], Globe)}
                {renderEditableField("Pincode", "org_pincode", leadData?.org_pincode, "text", [], Globe)}
                {renderEditableField("Country", "org_country", leadData?.org_country, "text", [], Globe)}
              </>
            ) : (
              <>
                {renderEditableField("Address", "address", leadData?.address, "textarea", [], MapPin)}
                {renderEditableField("City", "city", leadData?.city, "text", [], Globe)}
                {renderEditableField("State", "state", leadData?.state, "text", [], Globe)}
                {renderEditableField("Pincode", "pincode", leadData?.pincode, "text", [], Globe)}
                {renderEditableField("Country", "country", leadData?.country, "text", [], Globe)}
              </>
            )}
          </div>
        </section>

        {/* Business Section */}
        <section className="bg-white border border-gray-100 rounded-none mb-2 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSection('business')}>
            <h3 className="text-slate-800 font-bold text-sm tracking-tight flex items-center gap-2">
              <Briefcase size={16} className="text-orange-500" />
              Lead Specifics
            </h3>
            <div className="flex items-center gap-2">
              {editingSection === 'business' ? (
              <div className="flex gap-1.5 animate-in fade-in slide-in-from-right-1 duration-200">
                <button
                  onClick={cancelSectionEditing}
                  title="Cancel All"
                  className="w-6 h-6 flex items-center justify-center bg-rose-500 hover:bg-rose-600 text-white rounded-none shadow-sm transition-all active:scale-95"
                >
                  <X size={12} strokeWidth={3} />
                </button>
                <button
                  onClick={saveSectionEditing}
                  title="Save All Changes"
                  className="w-6 h-6 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white rounded-none shadow-sm transition-all active:scale-95"
                >
                  <Check size={12} strokeWidth={3} />
                </button>
              </div>
            ) : (
              null /* !editingSection && !editingField && (
                <ActionGuard permission="leads_edit" module="Leads Management" type="update">
                  <button
                    onClick={() => startSectionEditing('business', ['followUp', 'source', 'priority', 'referral_mobile'])}
                    className="w-6 h-6 flex items-center justify-center bg-orange-500 text-white rounded-none hover:bg-orange-600 transition-all shadow-md active:scale-95"
                  >
                    <Edit2 size={13} />
                  </button>
                </ActionGuard>
              ) */
            )}
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${openSections.business ? 'rotate-180' : ''}`} />
            </div>
          </div>
          <div className={`space-y-0 p-3 pt-0 transition-all duration-300 ${openSections.business ? 'block' : 'hidden'}`}>
            {renderEditableField("Follow Up", "followUp", leadData?.followUp, "date", [], Clock)}
            {renderEditableField("Source", "source", leadData?.source, "text", [], TrendingUp)}
            {renderEditableField("Interested In", "services", leadData?.services, "multi-select", [], FileText)}
            {renderEditableField("Priority", "priority", leadData?.priority, "select", [
              { label: "High", value: "High" },
              { label: "Medium", value: "Medium" },
              { label: "Low", value: "Low" }
            ], Shield)}
            {renderEditableField("Referral", "referral_mobile", leadData?.referral_mobile, "tel", [], Users)}
          </div>
        </section>

        {/* Contact Persons Section (For Organizations) */}
        {leadType === 'Organization' && leadData?.contact_persons && (
          <section className="bg-white border border-gray-100 rounded-none mb-2 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSection('contact')}>
              <h3 className="text-slate-800 font-bold text-sm tracking-tight flex items-center gap-2">
                <Users size={16} className="text-orange-500" />
                Contact Persons
              </h3>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${openSections.contact ? 'rotate-180' : ''}`} />
            </div>
            <div className={`space-y-2 p-3 pt-0 transition-all duration-300 ${openSections.contact ? 'block' : 'hidden'}`}>
              {(() => {
                try {
                  const persons = JSON.parse(leadData.contact_persons);
                  return persons.map((p, i) => (
                    <div key={i} className="p-3 rounded-none bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs overflow-hidden">
                          {p.profile_image ? (
                            <img src={p.profile_image} className="w-full h-full object-cover" />
                          ) : getInitials(p.name || "C")}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{p.name || "N/A"}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{p.designation || "No Designation"}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-1 pl-11">
                        {p.mobile_number && <p className="text-[10px] text-slate-600 flex items-center gap-1.5"><Phone size={10} className="text-orange-400" /> {p.mobile_number}</p>}
                        {p.email && <p className="text-[10px] text-slate-600 flex items-center gap-1.5"><Mail size={10} className="text-orange-400" /> {p.email}</p>}
                      </div>
                    </div>
                  ));
                } catch (e) { return null; }
              })()}
            </div>
          </section>
        )}

        {/* Custom Fields Section */}
        {leadData?.custom_fields && (
          <section className="bg-white border border-gray-100 rounded-none mb-2 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSection('custom')}>
              <h3 className="text-slate-800 font-bold text-sm tracking-tight flex items-center gap-2">
                <Layers size={16} className="text-orange-500" />
                Additional Details
              </h3>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${openSections.custom ? 'rotate-180' : ''}`} />
            </div>
            <div className={`grid grid-cols-1 gap-2 p-3 pt-0 transition-all duration-300 ${openSections.custom ? 'block' : 'hidden'}`}>
              {(() => {
                try {
                  const custom = JSON.parse(leadData.custom_fields);
                  return custom.map((f, i) => (
                    <div key={i} className="flex flex-col p-2 bg-slate-50/50 rounded-none border-l-2 border-orange-400">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{f.label}</span>
                      <span className="text-xs font-bold text-slate-800">{f.value}</span>
                    </div>
                  ));
                } catch (e) { return null; }
              })()}
            </div>
          </section>
        )}

        {/* Stakeholders Section */}
        <section className="bg-white border border-gray-100 rounded-none mb-2 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSection('ownership')}>
            <h3 className="text-slate-800 font-bold text-sm tracking-tight flex items-center gap-2">
              <User size={16} className="text-orange-500" />
              Ownership
            </h3>
            <ChevronDown size={16} className={`text-slate-400 transition-transform ${openSections.ownership ? 'rotate-180' : ''}`} />
          </div>
          <div className={`space-y-2 p-3 pt-0 transition-all duration-300 ${openSections.ownership ? 'block' : 'hidden'}`}>
            {/* Lead Owner */}
            <div className="bg-slate-50/50 rounded-none p-4 border border-slate-100">
              <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest mb-3">Managed By (Owner)</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white p-0.5 shadow-sm border border-emerald-100 overflow-hidden">
                  <div className="w-full h-full rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-xs">
                    {getInitials(leadData?.lead_owner || "Owner")}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-800 block capitalize">{leadData?.lead_owner || "Individual"}</span>
                </div>
              </div>
            </div>
            <div className="bg-slate-50/50 rounded-none p-4 border border-slate-100 group/agent relative">
              <div className="flex justify-between items-center mb-3">
                <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest">Assigned To</p>
                {null /* !editingSection && !editingField && (
                  <ActionGuard permission="leads_edit" module="Leads Management" type="update">
                    <button
                      onClick={() => startEditing('assigned_to', leadData?.assigned_to)}
                      className="w-6 h-6 flex items-center justify-center bg-orange-500 text-white rounded-none opacity-0 group-hover/agent:opacity-100 transition-all hover:bg-orange-600 shadow-md active:scale-95"
                    >
                      <Edit2 size={13} />
                    </button>
                  </ActionGuard>
                ) */}
              </div>

              {editingField === 'assigned_to' ? (
                <div className="flex flex-col gap-2 items-end animate-in fade-in slide-in-from-top-1 duration-200">
                  <select
                    className="w-full p-2 text-xs border border-orange-200 rounded-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none bg-white transition-all font-bold"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    autoFocus
                  >
                    <option value="">Select Agent</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.employee_name}</option>
                    ))}
                  </select>
                  <div className="flex gap-1.5">
                    <button
                      onClick={cancelEditing}
                      title="Cancel"
                      className="w-6 h-6 flex items-center justify-center bg-rose-500 hover:bg-rose-600 text-white rounded-none shadow-sm transition-all active:scale-95"
                    >
                      <X size={12} strokeWidth={3} />
                    </button>
                    <button
                      onClick={() => saveEditing('assigned_to')}
                      title="Save Assignment"
                      className="w-6 h-6 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white rounded-none shadow-sm transition-all active:scale-95"
                    >
                      <Check size={12} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white p-0.5 shadow-sm border border-blue-100 overflow-hidden">
                    <div className="w-full h-full rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black text-sm">
                      {getInitials(leadData?.assignee?.name || "Agent")}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-800 block capitalize">{leadData?.assignee?.name || "Not Assigned"}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Footer Actions */}
        <div className="pt-4 pb-10">
          <ActionGuard permission="quotation_create" module="Financial Documents" type="create">
            <button
              onClick={() => setShowModal && setShowModal(true)}
              className="w-full bg-slate-900 text-white py-4 rounded-none font-semibold text-sm shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 group"
            >
              <Plus size={18} className="text-orange-500 group-hover:rotate-90 transition-transform duration-300" />
              Generate Quotation
            </button>
          </ActionGuard>
        </div>
      </div>

      {/* Convert Client Confirmation Modal */}
      <ConvertClientModal
        isOpen={showConvertModal}
        onClose={() => setShowConvertModal(false)}
        leadData={leadData}
      />
    </div>
  );
}
