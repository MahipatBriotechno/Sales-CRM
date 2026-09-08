import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  Edit2, Star, Plus, Calendar, Phone, Mail, MapPin, User, Hash, FileText, Zap, DollarSign, ChevronDown, Clock, Briefcase, Shield, Heart, Globe, Layers, CheckCircle, History, TrendingUp, UserCheck, Users, AlertCircle, Upload, X, Check,
} from "lucide-react";
import { FaBuilding, FaWhatsapp } from "react-icons/fa";
import Modal from "../../../components/common/Modal";
import { toast } from "react-hot-toast";
import ActionGuard from "../../../components/common/ActionGuard";
import ConvertClientModal from "../../../components/LeadManagement/ConvertClientModal";

const interestedInOptions = [
  "Product Demo", "Pricing Info", "Support", "Partnership", "Consultation", "Training", "Other"
];

export default function LeadSidebar({
  leadData, isEditingLead, isEditingOwner, setIsEditingOwner, handleLeadUpdate, handleSingleFieldUpdate, formatCurrency, setShowModal, handleQrCall, employees = [], handleUpdateStatus, setShowWhatsAppModal,
}) {
  const leadType = leadData?.type || "Individual";
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState("");

  // Section Edit Modal State
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [sectionValues, setSectionValues] = useState({});
  const [openMultiSelect, setOpenMultiSelect] = useState(null);

  const [showConvertModal, setShowConvertModal] = useState(false);
  const [openSections, setOpenSections] = useState({ basic: true, location: false, business: false, contact: false, custom: false, ownership: false });

  const toggleSection = (sec) => setOpenSections(prev => ({ ...prev, [sec]: !prev[sec] }));

  // Top level single-field edit for Name, Budget, Owner, Assignee
  const startEditing = (field, value) => {
    setEditingField(field);
    setEditValue(value || "");
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValue("");
  };

  const saveEditing = async (field) => {
    if (handleSingleFieldUpdate) {
      await handleSingleFieldUpdate(field, editValue);
    }
    setEditingField(null);
    setEditValue("");
  };

  // Section Editing Logic
  const startSectionEditing = (section, fields) => {
    const values = {};
    fields.forEach(field => {
      values[field] = leadData[field] || "";
    });
    setSectionValues(values);
    setEditingSection(section);
    setShowSectionModal(true);
  };

  const handleSectionValueChange = (field, value) => {
    setSectionValues(prev => ({ ...prev, [field]: value }));
  };

  const handleInterestedInToggle = (item) => {
    setSectionValues(prev => {
      const current = Array.isArray(prev.services) ? prev.services : (typeof prev.services === 'string' && prev.services ? prev.services.split(',').map(s => s.trim()) : []);
      const newArray = current.includes(item) ? current.filter(s => s !== item) : [...current, item];
      return { ...prev, services: newArray };
    });
  };

  const handleCustomFieldChange = (index, newValue) => {
    setSectionValues(prev => {
      let parsed = [];
      try {
        parsed = typeof prev.custom_fields === 'string' ? JSON.parse(prev.custom_fields || '[]') : [...(prev.custom_fields || [])];
      } catch (e) {
        parsed = [];
      }
      if (parsed[index]) {
        parsed[index].value = newValue;
      }
      return { ...prev, custom_fields: JSON.stringify(parsed) };
    });
  };

  const saveSectionEditing = async () => {
    if (handleSingleFieldUpdate) {
      for (const [field, value] of Object.entries(sectionValues)) {
        const originalValue = leadData[field] || "";
        let finalValue = value;
        if (field === 'services' && Array.isArray(value)) {
          finalValue = value.join(', ');
        }
        if (finalValue !== originalValue) {
          await handleSingleFieldUpdate(field, finalValue);
        }
      }
    }
    setShowSectionModal(false);
    setEditingSection(null);
    setSectionValues({});
  };

  const getInitials = (name) => {
    if (!name || typeof name !== "string") return "";
    return name.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const renderFieldView = (label, currentValue, IconComponent, field) => {
    return (
      <div className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0 min-h-[40px]">
        <div className="flex items-center gap-2 text-slate-500 w-1/2">
          {IconComponent && <IconComponent size={14} className="text-slate-400 shrink-0" />}
          <span className="text-[11px] font-bold uppercase tracking-wider truncate" title={label}>{label}</span>
        </div>
        <div className="flex items-center justify-end flex-1 w-1/2 pl-2">
          <span className={`font-bold text-xs text-right break-words capitalize ${field === 'email' || field === 'company_email' ? 'text-blue-600 normal-case' : 'text-slate-800'}`}>
            {Array.isArray(currentValue)
              ? (currentValue.length > 0 ? currentValue.join(', ') : "N/A")
              : (currentValue || "N/A")}
          </span>
          {field === 'whatsapp_number' && currentValue && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowWhatsAppModal(true); }}
              className="p-1 ml-2 hover:bg-green-50 text-[#25D366] rounded transition-all active:scale-90 shrink-0"
              title="Send WhatsApp Message"
            >
              <FaWhatsapp size={14} />
            </button>
          )}
        </div>
      </div>
    );
  };

  const sectionConfigs = {
    basic: {
      title: "Basic Information",
      fields: leadType === 'Organization'
        ? ['industry_type', 'company_email', 'company_phone', 'website', 'gst_number', 'visibility']
        : ['gender', 'email', 'phone', 'altMobileNumber', 'whatsapp_number', 'dateOfBirth', 'visibility'],
      renderForm: () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {leadType === 'Organization' ? (
            <>
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Industry</label>
                <select className="w-full p-2.5 text-sm border border-orange-200 rounded-none focus:border-orange-500 outline-none font-semibold" value={sectionValues.industry_type || ""} onChange={(e) => handleSectionValueChange('industry_type', e.target.value)}>
                  <option value="">Select Industry</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Finance">Finance</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Retail">Retail</option>
                  <option value="Education">Education</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div><label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Email</label><input type="email" className="w-full p-2.5 text-sm border border-orange-200 rounded-none focus:border-orange-500 outline-none font-semibold" value={sectionValues.company_email || ""} onChange={(e) => handleSectionValueChange('company_email', e.target.value)} /></div>
              <div><label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Phone</label><input type="tel" className="w-full p-2.5 text-sm border border-orange-200 rounded-none focus:border-orange-500 outline-none font-semibold" value={sectionValues.company_phone || ""} onChange={(e) => handleSectionValueChange('company_phone', e.target.value)} /></div>
              <div><label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Website</label><input type="url" className="w-full p-2.5 text-sm border border-orange-200 rounded-none focus:border-orange-500 outline-none font-semibold" value={sectionValues.website || ""} onChange={(e) => handleSectionValueChange('website', e.target.value)} /></div>
              <div className="md:col-span-2"><label className="text-xs font-bold text-gray-700 uppercase mb-1 block">GST Number</label><input type="text" className="w-full p-2.5 text-sm border border-orange-200 rounded-none focus:border-orange-500 outline-none font-semibold" value={sectionValues.gst_number || ""} onChange={(e) => handleSectionValueChange('gst_number', e.target.value)} /></div>
            </>
          ) : (
            <>
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Gender</label>
                <select className="w-full p-2.5 text-sm border border-orange-200 rounded-none focus:border-orange-500 outline-none font-semibold" value={sectionValues.gender || ""} onChange={(e) => handleSectionValueChange('gender', e.target.value)}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div><label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Email</label><input type="email" className="w-full p-2.5 text-sm border border-orange-200 rounded-none focus:border-orange-500 outline-none font-semibold" value={sectionValues.email || ""} onChange={(e) => handleSectionValueChange('email', e.target.value)} /></div>
              <div><label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Phone</label><input type="tel" className="w-full p-2.5 text-sm border border-orange-200 rounded-none focus:border-orange-500 outline-none font-semibold" value={sectionValues.phone || ""} onChange={(e) => handleSectionValueChange('phone', e.target.value)} /></div>
              <div><label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Alt. Phone</label><input type="tel" className="w-full p-2.5 text-sm border border-orange-200 rounded-none focus:border-orange-500 outline-none font-semibold" value={sectionValues.altMobileNumber || ""} onChange={(e) => handleSectionValueChange('altMobileNumber', e.target.value)} /></div>
              <div><label className="text-xs font-bold text-gray-700 uppercase mb-1 block">WhatsApp</label><input type="tel" className="w-full p-2.5 text-sm border border-orange-200 rounded-none focus:border-orange-500 outline-none font-semibold" value={sectionValues.whatsapp_number || ""} onChange={(e) => handleSectionValueChange('whatsapp_number', e.target.value)} /></div>
              <div><label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Date of Birth</label><input type="date" className="w-full p-2.5 text-sm border border-orange-200 rounded-none focus:border-orange-500 outline-none font-semibold" value={sectionValues.dateOfBirth || ""} onChange={(e) => handleSectionValueChange('dateOfBirth', e.target.value)} /></div>
            </>
          )}
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Visibility</label>
            <select className="w-full p-2.5 text-sm border border-orange-200 rounded-none focus:border-orange-500 outline-none font-semibold" value={sectionValues.visibility || ""} onChange={(e) => handleSectionValueChange('visibility', e.target.value)}>
              <option value="Public">Public</option>
              <option value="Private">Private</option>
            </select>
          </div>
        </div>
      )
    },
    location: {
      title: "Location Details",
      fields: leadType === 'Organization'
        ? ['company_address', 'org_city', 'org_state', 'org_pincode', 'org_country']
        : ['address', 'city', 'state', 'pincode', 'country'],
      renderForm: () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {leadType === 'Organization' ? (
            <>
              <div className="md:col-span-2"><label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Address</label><textarea className="w-full p-2.5 text-sm border border-orange-200 rounded-none focus:border-orange-500 outline-none resize-none min-h-[80px] font-semibold" value={sectionValues.company_address || ""} onChange={(e) => handleSectionValueChange('company_address', e.target.value)} /></div>
              <div><label className="text-xs font-bold text-gray-700 uppercase mb-1 block">City</label><input type="text" className="w-full p-2.5 text-sm border border-orange-200 rounded-none focus:border-orange-500 outline-none font-semibold" value={sectionValues.org_city || ""} onChange={(e) => handleSectionValueChange('org_city', e.target.value)} /></div>
              <div><label className="text-xs font-bold text-gray-700 uppercase mb-1 block">State</label><input type="text" className="w-full p-2.5 text-sm border border-orange-200 rounded-none focus:border-orange-500 outline-none font-semibold" value={sectionValues.org_state || ""} onChange={(e) => handleSectionValueChange('org_state', e.target.value)} /></div>
              <div><label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Pincode</label><input type="text" className="w-full p-2.5 text-sm border border-orange-200 rounded-none focus:border-orange-500 outline-none font-semibold" value={sectionValues.org_pincode || ""} onChange={(e) => handleSectionValueChange('org_pincode', e.target.value)} /></div>
              <div><label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Country</label><input type="text" className="w-full p-2.5 text-sm border border-orange-200 rounded-none focus:border-orange-500 outline-none font-semibold" value={sectionValues.org_country || ""} onChange={(e) => handleSectionValueChange('org_country', e.target.value)} /></div>
            </>
          ) : (
            <>
              <div className="md:col-span-2"><label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Address</label><textarea className="w-full p-2.5 text-sm border border-orange-200 rounded-none focus:border-orange-500 outline-none resize-none min-h-[80px] font-semibold" value={sectionValues.address || ""} onChange={(e) => handleSectionValueChange('address', e.target.value)} /></div>
              <div><label className="text-xs font-bold text-gray-700 uppercase mb-1 block">City</label><input type="text" className="w-full p-2.5 text-sm border border-orange-200 rounded-none focus:border-orange-500 outline-none font-semibold" value={sectionValues.city || ""} onChange={(e) => handleSectionValueChange('city', e.target.value)} /></div>
              <div><label className="text-xs font-bold text-gray-700 uppercase mb-1 block">State</label><input type="text" className="w-full p-2.5 text-sm border border-orange-200 rounded-none focus:border-orange-500 outline-none font-semibold" value={sectionValues.state || ""} onChange={(e) => handleSectionValueChange('state', e.target.value)} /></div>
              <div><label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Pincode</label><input type="text" className="w-full p-2.5 text-sm border border-orange-200 rounded-none focus:border-orange-500 outline-none font-semibold" value={sectionValues.pincode || ""} onChange={(e) => handleSectionValueChange('pincode', e.target.value)} /></div>
              <div><label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Country</label><input type="text" className="w-full p-2.5 text-sm border border-orange-200 rounded-none focus:border-orange-500 outline-none font-semibold" value={sectionValues.country || ""} onChange={(e) => handleSectionValueChange('country', e.target.value)} /></div>
            </>
          )}
        </div>
      )
    },
    business: {
      title: "Lead Specifics",
      fields: ['followUp', 'source', 'priority', 'referral_mobile', 'services'],
      renderForm: () => {
        const servicesArray = Array.isArray(sectionValues.services) ? sectionValues.services : (typeof sectionValues.services === 'string' && sectionValues.services ? sectionValues.services.split(',').map(s => s.trim()) : []);
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Follow Up Date</label><input type="date" className="w-full p-2.5 text-sm border border-orange-200 rounded-none focus:border-orange-500 outline-none font-semibold" value={sectionValues.followUp || ""} onChange={(e) => handleSectionValueChange('followUp', e.target.value)} /></div>
            <div><label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Source</label><input type="text" className="w-full p-2.5 text-sm border border-orange-200 rounded-none focus:border-orange-500 outline-none font-semibold" value={sectionValues.source || ""} onChange={(e) => handleSectionValueChange('source', e.target.value)} /></div>

            <div className="relative md:col-span-2">
              <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Interested In</label>
              <div
                onClick={() => setOpenMultiSelect(prev => prev === 'services' ? null : 'services')}
                className="w-full min-h-[44px] p-2 border border-orange-200 rounded-none cursor-pointer flex flex-wrap gap-1 items-center bg-white hover:border-orange-500 transition-all shadow-sm font-semibold"
              >
                {servicesArray.length === 0 ? (
                  <span className="text-xs text-gray-400 font-bold uppercase">Select Options...</span>
                ) : (
                  servicesArray.map(item => (
                    <span key={item} className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-600 text-[11px] font-black rounded-none border border-orange-200">
                      {item}
                      <X size={12} className="hover:text-orange-800 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleInterestedInToggle(item); }} />
                    </span>
                  ))
                )}
                <ChevronDown size={14} className={`ml-auto text-gray-400 transition-transform ${openMultiSelect === 'services' ? 'rotate-180' : ''}`} />
              </div>
              {openMultiSelect === 'services' && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-none shadow-xl z-[100] max-h-48 overflow-y-auto ring-1 ring-black ring-opacity-5">
                  {interestedInOptions.map(option => (
                    <label key={option} className="flex items-center gap-3 px-4 py-2 hover:bg-orange-50 cursor-pointer transition-colors border-b last:border-0 border-gray-50">
                      <input
                        type="checkbox"
                        checked={servicesArray.includes(option)}
                        onChange={() => handleInterestedInToggle(option)}
                        className="w-4 h-4 accent-orange-500 cursor-pointer"
                      />
                      <span className="text-sm text-slate-700 font-bold uppercase">{option}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Priority</label>
              <select className="w-full p-2.5 text-sm border border-orange-200 rounded-none focus:border-orange-500 outline-none font-semibold" value={sectionValues.priority || ""} onChange={(e) => handleSectionValueChange('priority', e.target.value)}>
                <option value="">Select Priority</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div><label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Referral Mobile</label><input type="tel" className="w-full p-2.5 text-sm border border-orange-200 rounded-none focus:border-orange-500 outline-none font-semibold" value={sectionValues.referral_mobile || ""} onChange={(e) => handleSectionValueChange('referral_mobile', e.target.value)} /></div>
          </div>
        );
      }
    },
    custom: {
      title: "Additional Details",
      fields: ['custom_fields'],
      renderForm: () => {
        let customFieldsArray = [];
        try {
          customFieldsArray = typeof sectionValues.custom_fields === 'string'
            ? JSON.parse(sectionValues.custom_fields || "[]")
            : (sectionValues.custom_fields || []);
        } catch (e) { }

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customFieldsArray.map((f, i) => (
              <div key={i} className={f.type === 'textarea' || f.field_type === 'textarea' ? 'md:col-span-2' : ''}>
                <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">{f.label}</label>
                {f.type === 'textarea' || f.field_type === 'textarea' || f.field_type === 'Textarea' ? (
                  <textarea
                    className="w-full p-2.5 text-sm border border-orange-200 rounded-none focus:border-orange-500 outline-none font-semibold resize-none min-h-[60px]"
                    value={f.value || ""}
                    onChange={(e) => handleCustomFieldChange(i, e.target.value)}
                  />
                ) : f.type === 'select' || f.field_type === 'Dropdown' ? (
                  <select
                    className="w-full p-2.5 text-sm border border-orange-200 rounded-none focus:border-orange-500 outline-none font-semibold"
                    value={f.value || ""}
                    onChange={(e) => handleCustomFieldChange(i, e.target.value)}
                  >
                    <option value="">Select Option</option>
                    {f.options && Array.isArray(f.options) ? f.options.map((opt, idx) => (
                      <option key={idx} value={opt}>{opt}</option>
                    )) : typeof f.options === 'string' && f.options.split(',').map((opt, idx) => (
                      <option key={idx} value={opt.trim()}>{opt.trim()}</option>
                    ))}
                  </select>
                ) : f.type === 'checkbox' || f.field_type === 'Checkbox' ? (
                  <div className="flex flex-wrap gap-2">
                    {(f.options && Array.isArray(f.options) ? f.options : typeof f.options === 'string' ? f.options.split(',') : []).map((opt, idx) => {
                      const optStr = opt.trim();
                      const isChecked = typeof f.value === 'string' ? f.value.split(',').map(s => s.trim()).includes(optStr) : false;
                      return (
                        <label key={idx} className="flex items-center gap-2 cursor-pointer p-1">
                          <input
                            type="checkbox"
                            className="w-4 h-4 accent-orange-500"
                            checked={isChecked}
                            onChange={(e) => {
                              let currentArr = typeof f.value === 'string' && f.value ? f.value.split(',').map(s => s.trim()) : [];
                              if (e.target.checked) currentArr.push(optStr);
                              else currentArr = currentArr.filter(v => v !== optStr);
                              handleCustomFieldChange(i, currentArr.join(', '));
                            }}
                          />
                          <span className="text-sm font-semibold text-slate-700">{optStr}</span>
                        </label>
                      )
                    })}
                  </div>
                ) : (
                  <input
                    type={f.type === 'number' || f.field_type === 'Number' ? 'number' : f.type === 'date' || f.field_type === 'Date' ? 'date' : f.type === 'time' || f.field_type === 'Time' ? 'time' : 'text'}
                    className="w-full p-2.5 text-sm border border-orange-200 rounded-none focus:border-orange-500 outline-none font-semibold"
                    value={f.value || ""}
                    onChange={(e) => handleCustomFieldChange(i, e.target.value)}
                  />
                )}
              </div>
            ))}
            {customFieldsArray.length === 0 && (
              <p className="text-sm text-gray-500 italic col-span-2">No custom fields available.</p>
            )}
          </div>
        )
      }
    },
    ownership: {
      title: "Ownership",
      fields: ['assigned_to'],
      renderForm: () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Assigned To</label>
            <select className="w-full p-2.5 text-sm border border-orange-200 rounded-none focus:border-orange-500 outline-none font-semibold" value={sectionValues.assigned_to || ""} onChange={(e) => handleSectionValueChange('assigned_to', e.target.value)}>
              <option value="">Select Agent</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.employee_name}</option>
              ))}
            </select>
          </div>
        </div>
      )
    },
    profileHeader: {
      title: "Profile Information",
      fields: ['name', 'type', 'phone', 'company_phone', 'profile_image', 'profileImage', 'company_logo', 'mobile_number'],
      renderForm: () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* <div className="md:col-span-2">
            <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Profile Image URL</label>
            <input 
              type="url" 
              placeholder="https://example.com/image.jpg"
              className="w-full p-2.5 text-sm border border-orange-200 rounded-none focus:border-orange-500 outline-none font-semibold" 
              value={leadType === 'Organization' ? (sectionValues.company_logo || "") : (sectionValues.profile_image || sectionValues.profileImage || "")} 
              onChange={(e) => handleSectionValueChange(leadType === 'Organization' ? 'company_logo' : 'profile_image', e.target.value)} 
            />
          </div> */}
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Lead Name</label>
            <input
              type="text"
              className="w-full p-2.5 text-sm border border-orange-200 rounded-none focus:border-orange-500 outline-none font-semibold"
              value={sectionValues.name || ""}
              onChange={(e) => handleSectionValueChange('name', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Lead Type</label>
            <select
              className="w-full p-2.5 text-sm border border-orange-200 rounded-none focus:border-orange-500 outline-none font-semibold"
              value={sectionValues.type || ""}
              onChange={(e) => handleSectionValueChange('type', e.target.value)}
            >
              <option value="Individual">Individual</option>
              <option value="Organization">Organization</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Phone Number</label>
            <input
              type="tel"
              className="w-full p-2.5 text-sm border border-orange-200 rounded-none focus:border-orange-500 outline-none font-semibold"
              value={leadType === 'Organization' ? (sectionValues.company_phone || "") : (sectionValues.phone || sectionValues.mobile_number || "")}
              onChange={(e) => handleSectionValueChange(leadType === 'Organization' ? 'company_phone' : 'phone', e.target.value)}
            />
          </div>
        </div>
      )
    }
  };

  return (
    <div className="w-[400px] bg-white shadow-sm h-full overflow-y-auto no-scrollbar border-l border-gray-100">
      {/* Top Profile Header Section */}
      <div className="relative group/header">
        <ActionGuard permission="leads_edit" module="Leads Management" type="update">
          <button
            onClick={() => startSectionEditing('profileHeader', sectionConfigs.profileHeader.fields)}
            className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center bg-white/30 backdrop-blur-sm text-white rounded-none hover:bg-white/50 transition-all shadow-sm opacity-0 group-hover/header:opacity-100 active:scale-95 z-10"
            title="Edit Profile Info"
          >
            <Edit2 size={14} />
          </button>
        </ActionGuard>

        {/* Header Profile Image Area */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-32 relative">
          <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
            <div className="w-24 h-24 bg-white rounded-full p-1 shadow-xl relative overflow-hidden">
              {leadData?.type === 'Organization' ? (
                leadData.company_logo ? (
                  <img src={leadData.company_logo} alt={leadData.organization_name} className="w-full h-full rounded-full object-contain bg-white p-1" />
                ) : (
                  <div className="w-full h-full rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-3xl">
                    <FaBuilding size={32} />
                  </div>
                )
              ) : leadData?.profileImage || leadData?.profile_image ? (
                <img src={leadData.profileImage || leadData.profile_image} alt={leadData.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-3xl">
                  {getInitials(leadData?.name || "L").charAt(0)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Basic Info */}
        <div className="pt-16 pb-6 px-6 text-center border-b border-gray-100 min-h-[160px] flex flex-col items-center justify-center">
          <div className="relative flex flex-col items-center justify-center w-full mb-1">
            <h2 className="text-2xl font-bold text-slate-800 uppercase truncate px-6" title={leadData?.name}>
              {leadData?.name?.length > 15 ? leadData?.name?.slice(0, 15) + '...' : leadData?.name || "Lead Name"}
            </h2>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{leadData?.type || "Individual"} Lead</span>
          </div>
          <div className="flex items-center justify-center gap-2 mt-2 w-full">
            <p className="text-slate-600 font-bold text-[14px] flex items-center gap-2">
              <Phone size={14} className="text-orange-500" />
              {leadType === 'Organization' ? leadData?.company_phone : (leadData?.phone || leadData?.mobile_number) || "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="p-4 grid grid-cols-2 gap-3 border-b border-gray-100">
        <ActionGuard permission="leads_edit" module="Leads Management" type="update">
          <button
            onClick={() => setShowConvertModal(true)}
            disabled={leadData?.tag !== 'Follow Up' && leadData?.tag !== 'Missed'}
            className={`py-2.5 rounded-none text-sm font-semibold flex items-center justify-center gap-2 transition-all ${leadData?.tag === 'Follow Up' || leadData?.tag === 'Missed' ? "bg-slate-800 hover:bg-slate-900 text-white shadow-sm" : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"}`}
          >
            <UserCheck className={`w-4 h-4 ${leadData?.tag === 'Follow Up' || leadData?.tag === 'Missed' ? 'text-orange-500' : 'text-slate-300'}`} /> Convert Client
          </button>
        </ActionGuard>
        <ActionGuard permission="leads_view_own" module="Leads Management" type="read">
          <button onClick={() => handleQrCall && handleQrCall()} className="bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-none text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
            <Phone className="w-4 h-4" /> Call Now
          </button>
        </ActionGuard>
      </div>

      {/* Quick Info Cards */}
      <div className="px-6 py-5 space-y-4 border-b border-gray-100 bg-slate-50/30">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-bold uppercase tracking-wider flex items-center gap-2"><Hash className="w-4 h-4 text-slate-400" /> Lead ID</span>
          <span className="font-bold text-slate-800">#{leadData?.id || "N/A"}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-bold uppercase tracking-wider flex items-center gap-2"><Zap className="w-4 h-4 text-slate-400" /> Lead Status</span>
          <span className="px-3 py-1 rounded-none text-[10px] font-black uppercase tracking-tighter bg-orange-100 text-orange-600 border border-orange-200">{leadData?.tag || "New Lead"}</span>
        </div>
        <div className="flex items-center justify-between text-xs group/budget relative">
          <span className="text-slate-500 font-bold uppercase tracking-wider flex items-center gap-2"><DollarSign className="w-4 h-4 text-slate-400" /> Estimated Value</span>
          {editingField === 'budget' || editingField === 'value' ? (
            <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-1 duration-200">
              <input
                type="text"
                className="w-24 p-1 text-xs border border-orange-200 rounded-none focus:border-orange-500 outline-none bg-white font-bold text-emerald-600 text-right"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') saveEditing('budget'); if (e.key === 'Escape') cancelEditing(); }}
              />
              <button onClick={() => saveEditing('budget')} className="w-5 h-5 flex items-center justify-center bg-emerald-500 text-white rounded-none shadow-sm"><Check size={10} strokeWidth={3} /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-600 text-sm">{formatCurrency ? formatCurrency(leadData?.value) : `₹${leadData?.value || 0}`}</span>
              <ActionGuard permission="leads_edit" module="Leads Management" type="update">
                <button onClick={() => startEditing('budget', leadData?.value)} className="w-5 h-5 flex items-center justify-center bg-orange-500 text-white rounded-none opacity-0 group-hover/budget:opacity-100 transition-all hover:bg-orange-600 shadow-sm"><Edit2 size={10} /></button>
              </ActionGuard>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-6 space-y-2 pb-20 pt-2">
        {/* Basic Information */}
        <section className="bg-white border border-gray-100 rounded-none mb-2 shadow-sm overflow-hidden group/section">
          <div className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSection('basic')}>
            <h3 className="text-slate-800 font-bold text-sm tracking-tight flex items-center gap-2">
              <User size={16} className="text-orange-500" /> Basic Information
            </h3>
            <div className="flex items-center gap-2">
              <ActionGuard permission="leads_edit" module="Leads Management" type="update">
                <button
                  onClick={(e) => { e.stopPropagation(); startSectionEditing('basic', sectionConfigs.basic.fields); }}
                  className="w-6 h-6 flex items-center justify-center bg-white border border-gray-200 text-slate-400 rounded-none hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all shadow-sm opacity-0 group-hover/section:opacity-100 active:scale-95"
                  title="Edit Section"
                >
                  <Edit2 size={12} />
                </button>
              </ActionGuard>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${openSections.basic ? 'rotate-180' : ''}`} />
            </div>
          </div>
          <div className={`space-y-0 p-3 pt-0 transition-all duration-300 ${openSections.basic ? 'block' : 'hidden'}`}>
            {leadType === 'Organization' ? (
              <>
                {renderFieldView("Industry", leadData?.industry_type, Briefcase, "industry_type")}
                {renderFieldView("Email", leadData?.company_email, Mail, "company_email")}
                {renderFieldView("Phone", leadData?.company_phone, Phone, "company_phone")}
                {renderFieldView("Website", leadData?.website, Globe, "website")}
                {renderFieldView("GST No.", leadData?.gst_number, FileText, "gst_number")}
              </>
            ) : (
              <>
                {renderFieldView("Gender", leadData?.gender, User, "gender")}
                {renderFieldView("Email", leadData?.email, Mail, "email")}
                {renderFieldView("Phone", (leadData?.phone || leadData?.mobile_number), Phone, "phone")}
                {renderFieldView("Alt. Phone", leadData?.altMobileNumber, History, "altMobileNumber")}
                {renderFieldView("WhatsApp", leadData?.whatsapp_number, FaWhatsapp, "whatsapp_number")}
                {renderFieldView("Birthday", leadData?.dateOfBirth, Calendar, "dateOfBirth")}
              </>
            )}
            {renderFieldView("Visibility", leadData?.visibility, Shield, "visibility")}
          </div>
        </section>

        {/* Location Details */}
        <section className="bg-white border border-gray-100 rounded-none mb-2 shadow-sm overflow-hidden group/section">
          <div className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSection('location')}>
            <h3 className="text-slate-800 font-bold text-sm tracking-tight flex items-center gap-2">
              <MapPin size={16} className="text-orange-500" /> Location Details
            </h3>
            <div className="flex items-center gap-2">
              <ActionGuard permission="leads_edit" module="Leads Management" type="update">
                <button
                  onClick={(e) => { e.stopPropagation(); startSectionEditing('location', sectionConfigs.location.fields); }}
                  className="w-6 h-6 flex items-center justify-center bg-white border border-gray-200 text-slate-400 rounded-none hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all shadow-sm opacity-0 group-hover/section:opacity-100 active:scale-95"
                  title="Edit Section"
                >
                  <Edit2 size={12} />
                </button>
              </ActionGuard>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${openSections.location ? 'rotate-180' : ''}`} />
            </div>
          </div>
          <div className={`space-y-0 p-3 pt-0 transition-all duration-300 ${openSections.location ? 'block' : 'hidden'}`}>
            {leadType === 'Organization' ? (
              <>
                {renderFieldView("Address", leadData?.company_address, MapPin, "company_address")}
                {renderFieldView("City", leadData?.org_city, Globe, "org_city")}
                {renderFieldView("State", leadData?.org_state, Globe, "org_state")}
                {renderFieldView("Pincode", leadData?.org_pincode, Globe, "org_pincode")}
                {renderFieldView("Country", leadData?.org_country, Globe, "org_country")}
              </>
            ) : (
              <>
                {renderFieldView("Address", leadData?.address, MapPin, "address")}
                {renderFieldView("City", leadData?.city, Globe, "city")}
                {renderFieldView("State", leadData?.state, Globe, "state")}
                {renderFieldView("Pincode", leadData?.pincode, Globe, "pincode")}
                {renderFieldView("Country", leadData?.country, Globe, "country")}
              </>
            )}
          </div>
        </section>

        {/* Lead Specifics */}
        <section className="bg-white border border-gray-100 rounded-none mb-2 shadow-sm overflow-hidden group/section">
          <div className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSection('business')}>
            <h3 className="text-slate-800 font-bold text-sm tracking-tight flex items-center gap-2">
              <Briefcase size={16} className="text-orange-500" /> Lead Specifics
            </h3>
            <div className="flex items-center gap-2">
              <ActionGuard permission="leads_edit" module="Leads Management" type="update">
                <button
                  onClick={(e) => { e.stopPropagation(); startSectionEditing('business', sectionConfigs.business.fields); }}
                  className="w-6 h-6 flex items-center justify-center bg-white border border-gray-200 text-slate-400 rounded-none hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all shadow-sm opacity-0 group-hover/section:opacity-100 active:scale-95"
                  title="Edit Section"
                >
                  <Edit2 size={12} />
                </button>
              </ActionGuard>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${openSections.business ? 'rotate-180' : ''}`} />
            </div>
          </div>
          <div className={`space-y-0 p-3 pt-0 transition-all duration-300 ${openSections.business ? 'block' : 'hidden'}`}>
            {renderFieldView("Follow Up", leadData?.followUp, Clock, "followUp")}
            {renderFieldView("Source", leadData?.source, TrendingUp, "source")}
            {renderFieldView("Interested In", typeof leadData?.services === 'string' ? leadData.services.split(',') : leadData?.services, FileText, "services")}
            {renderFieldView("Priority", leadData?.priority, Shield, "priority")}
            {renderFieldView("Referral", leadData?.referral_mobile, Users, "referral_mobile")}
          </div>
        </section>

        {/* Custom Fields Section */}
        {leadData?.custom_fields && (
          <section className="bg-white border border-gray-100 rounded-none mb-2 shadow-sm overflow-hidden group/section">
            <div className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSection('custom')}>
              <h3 className="text-slate-800 font-bold text-sm tracking-tight flex items-center gap-2">
                <Layers size={16} className="text-orange-500" /> Additional Details
              </h3>
              <div className="flex items-center gap-2">
                <ActionGuard permission="leads_edit" module="Leads Management" type="update">
                  <button
                    onClick={(e) => { e.stopPropagation(); startSectionEditing('custom', sectionConfigs.custom.fields); }}
                    className="w-6 h-6 flex items-center justify-center bg-white border border-gray-200 text-slate-400 rounded-none hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all shadow-sm opacity-0 group-hover/section:opacity-100 active:scale-95"
                    title="Edit Section"
                  >
                    <Edit2 size={12} />
                  </button>
                </ActionGuard>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${openSections.custom ? 'rotate-180' : ''}`} />
              </div>
            </div>
            <div className={`grid grid-cols-1 gap-2 p-3 pt-0 transition-all duration-300 ${openSections.custom ? 'block' : 'hidden'}`}>
              {(() => {
                try {
                  const custom = JSON.parse(leadData.custom_fields);
                  return custom.map((f, i) => (
                    <div key={i} className="flex flex-col p-2 bg-slate-50/50 rounded-none border-l-2 border-orange-400">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{f.label}</span>
                      <span className="text-xs font-bold text-slate-800">{f.value === 'true' ? 'Yes' : f.value === 'false' ? 'No' : f.value}</span>
                    </div>
                  ));
                } catch (e) { return null; }
              })()}
            </div>
          </section>
        )}

        {/* Contact Persons Section */}
        {leadType === 'Organization' && leadData?.contact_persons && (
          <section className="bg-white border border-gray-100 rounded-none mb-2 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSection('contact')}>
              <h3 className="text-slate-800 font-bold text-sm tracking-tight flex items-center gap-2">
                <Users size={16} className="text-orange-500" /> Contact Persons
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
                          {p.profile_image ? <img src={p.profile_image} className="w-full h-full object-cover" /> : getInitials(p.name || "C")}
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

        {/* Ownership */}
        <section className="bg-white border border-gray-100 rounded-none mb-2 shadow-sm overflow-hidden group/section">
          <div className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSection('ownership')}>
            <h3 className="text-slate-800 font-bold text-sm tracking-tight flex items-center gap-2">
              <User size={16} className="text-orange-500" /> Ownership
            </h3>
            <div className="flex items-center gap-2">
              <ActionGuard permission="leads_edit" module="Leads Management" type="update">
                <button
                  onClick={(e) => { e.stopPropagation(); startSectionEditing('ownership', sectionConfigs.ownership.fields); }}
                  className="w-6 h-6 flex items-center justify-center bg-white border border-gray-200 text-slate-400 rounded-none hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all shadow-sm opacity-0 group-hover/section:opacity-100 active:scale-95"
                  title="Edit Section"
                >
                  <Edit2 size={12} />
                </button>
              </ActionGuard>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${openSections.ownership ? 'rotate-180' : ''}`} />
            </div>
          </div>
          <div className={`space-y-2 p-3 pt-0 transition-all duration-300 ${openSections.ownership ? 'block' : 'hidden'}`}>
            <div className="bg-slate-50/50 rounded-none p-4 border border-slate-100">
              <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest mb-3">Managed By (Owner)</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white p-0.5 shadow-sm border border-emerald-100 overflow-hidden">
                  <div className="w-full h-full rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-xs">
                    {getInitials(leadData?.lead_owner || "Owner")}
                  </div>
                </div>
                <div><span className="text-sm font-bold text-slate-800 block capitalize">{leadData?.lead_owner || "Individual"}</span></div>
              </div>
            </div>
            <div className="bg-slate-50/50 rounded-none p-4 border border-slate-100 relative">
              <div className="flex justify-between items-center mb-3">
                <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest">Assigned To</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white p-0.5 shadow-sm border border-blue-100 overflow-hidden">
                  <div className="w-full h-full rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black text-sm">
                    {getInitials(leadData?.assignee?.name || "Agent")}
                  </div>
                </div>
                <div><span className="text-sm font-bold text-slate-800 block capitalize">{leadData?.assignee?.name || "Not Assigned"}</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Actions */}
        <div className="pt-4 pb-10">
          <ActionGuard permission="quotation_create" module="Financial Documents" type="create">
            <button onClick={() => setShowModal && setShowModal(true)} className="w-full bg-slate-900 text-white py-4 rounded-none font-semibold text-sm shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 group">
              <Plus size={18} className="text-orange-500 group-hover:rotate-90 transition-transform duration-300" /> Generate Quotation
            </button>
          </ActionGuard>
        </div>
      </div>

      <ConvertClientModal isOpen={showConvertModal} onClose={() => setShowConvertModal(false)} leadData={leadData} />

      {/* Section Edit Modal */}
      {showSectionModal && editingSection && sectionConfigs[editingSection] && (
        <Modal
          isOpen={showSectionModal}
          onClose={() => { setShowSectionModal(false); setEditingSection(null); }}
          title={`Edit ${sectionConfigs[editingSection].title}`}
          bodyClassName="p-5"
          footer={
            <>
              <button onClick={() => { setShowSectionModal(false); setEditingSection(null); }} className="px-5 py-2 border border-gray-300 text-gray-700 font-bold rounded-none hover:bg-gray-100 transition-all text-sm">
                Cancel
              </button>
              <button onClick={saveSectionEditing} className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-none transition-all shadow-md flex items-center gap-2 text-sm">
                <Check size={16} strokeWidth={3} /> Save Changes
              </button>
            </>
          }
        >
          {sectionConfigs[editingSection].renderForm()}
        </Modal>
      )}
    </div>
  );
}
