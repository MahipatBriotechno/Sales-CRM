import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa";

import AddNoteModal from "../../components/LeadManagement/LeadPipLineStatus/AddNotes";
import EditLeadModal from "../../pages/LeadsManagement/EditLeadPopup"; // Adjust path as needed
import {
  Edit2,
  ChevronDown,
  Star,
  ArrowLeftCircle,
  Download,
  Trash2,
} from "lucide-react";
import {
  Hash,
  Link,
  DollarSign,
  Calendar,
  Phone,
  Globe,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useGetLeadByIdQuery, useUpdateLeadMutation } from "../../store/api/leadApi";
import { useGetPipelineByIdQuery } from "../../store/api/pipelineApi";
import { useGetWhatsAppConfigQuery } from "../../store/api/integrationApi";
import ActionGuard from "../../components/common/ActionGuard";

export default function CRMLeadDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("activities");
  const [isEditingLead, setIsEditingLead] = useState(false);
  const [isEditingOwner, setIsEditingOwner] = useState(false);
  const [isEditingOther, setIsEditingOther] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState("High");
  const [selectedSort, setSelectedSort] = useState("Last 7 Days");
  const [showEditLeadModal, setShowEditLeadModal] = useState(false);

  // Get lead data from navigation state
  const passedLead = location.state?.lead;
  const leadId = passedLead?.id;

  // Fetch latest lead data
  const { data: lead, isLoading: isLeadLoading } = useGetLeadByIdQuery(leadId, {
    skip: !leadId,
    refetchOnMountOrArgChange: true
  });

  const { data: pipelineData } = useGetPipelineByIdQuery(lead?.pipeline_id, {
    skip: !lead?.pipeline_id
  });

  const [updateLead] = useUpdateLeadMutation();

  const [open, setOpen] = useState(false);

  const handleSave = (data) => {
    console.log("Saved:", data);
  };

  // Format currency to match the display format
  const formatCurrency = (value) => {
    if (typeof value !== 'number') return value || "₹0";
    const [intPart] = value.toFixed(0).split(".");
    const lastThree = intPart.substring(intPart.length - 3);
    const otherNumbers = intPart.substring(0, intPart.length - 3);
    const formatted =
      otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") +
      (otherNumbers ? "," : "") +
      lastThree;
    return "₹" + formatted;
  };

  const [leadData, setLeadData] = useState({
    name: "",
    address: "",
    company: "",
    dateCreated: "",
    value: "₹0",
    dueDate: "",
    followUp: "",
    source: "",
    email: "",
    phone: "",
    status: "",
    tag: "",
    visibility: "",
    id: "",
  });

  // Sync leadData with fetched lead
  useEffect(() => {
    if (lead) {
      setLeadData({
        id: lead.id,
        name: lead.name,
        fullName: lead.full_name || lead.name,
        gender: lead.gender || "Male",
        email: lead.email,
        phone: lead.mobile_number,
        address: lead.location || lead.address,
        city: lead.city || "Manchester",
        state: lead.state || "New Jersey",
        pincode: lead.pincode || "08759",
        dateCreated: new Date(lead.created_at).toLocaleDateString('en-GB', {
          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }),
        value: formatCurrency(lead.value),
        dueDate: lead.created_at,
        followUp: lead.next_call_at ? new Date(lead.next_call_at).toISOString().split('T')[0] : "",
        source: lead.lead_source || "Direct",
        status: lead.status || "Active",
        visibility: lead.visibility || "Private",
        company: lead.type === "Person" ? "Individual" : lead.name,
        tag: lead.tag,
        pipeline_id: lead.pipeline_id,
        stage_id: lead.stage_id,
        services: lead.interested_in || "" // Keep key name if modal expects it, or use interested_in
      });
    }
  }, [lead]);

  const handleLeadInfoSave = async (updatedData) => {
    try {
      const payload = {
        name: updatedData.name,
        full_name: updatedData.fullName,
        gender: updatedData.gender,
        email: updatedData.email,
        mobile_number: updatedData.phone,
        location: updatedData.address,
        city: updatedData.city,
        state: updatedData.state,
        pincode: updatedData.pincode,
        next_call_at: updatedData.followUp,
        lead_source: updatedData.source,
        status: updatedData.status,
        visibility: updatedData.visibility,
        value: typeof updatedData.value === 'string' ? parseFloat(updatedData.value.replace(/[^\d.]/g, '')) : updatedData.value,
        tag: updatedData.tag,
        pipeline_id: updatedData.pipeline_id,
        stage_id: updatedData.stage_id,
        interested_in: Array.isArray(updatedData.interested_in) ? updatedData.interested_in.join(', ') : updatedData.interested_in,
        assigned_to: updatedData.ownerName
      };

      await updateLead({ id: leadId, data: payload }).unwrap();
      setShowEditLeadModal(false);
    } catch (error) {
      console.error("Failed to update lead:", error);
    }
  };

  const handleLeadUpdate = (field, value) => {
    setLeadData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Get initials for avatar
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get tag status color
  const getTagStatusColor = (tag) => {
    switch (tag) {
      case "Contacted":
        return "bg-yellow-100 text-yellow-600";
      case "Not Contacted":
        return "bg-purple-100 text-purple-600";
      case "Closed":
        return "bg-green-100 text-green-700";
      case "Lost":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const priorities = ["High", "Medium", "Low"];
  const sortOptions = [
    "Last 7 Days",
    "Last 30 Days",
    "Last 3 Months",
    "All Time",
  ];

  const activities = [
    {
      date: "15 Feb 2024",
      items: [
        {
          icon: "💬",
          color: "bg-cyan-400",
          title: "You sent 1 Message to the contact.",
          time: "10:25 pm",
        },
        {
          icon: "📞",
          color: "bg-green-500",
          title:
            "Denwar responded to your appointment schedule question by call at 09:30pm.",
          time: "09:25 pm",
        },
        {
          icon: "📝",
          color: "bg-yellow-500",
          title: "Notes added by Antony",
          description:
            "Please accept my apologies for the inconvenience caused. It would be much appreciated if it's possible to reschedule to 6:00 PM, or any other day that week.",
          time: "10:00 pm",
        },
      ],
    },
    {
      date: "15 Feb 2024",
      items: [
        {
          icon: "👥",
          color: "bg-purple-500",
          title: "Meeting With",
          subtitle: "Abraham",
          description: "Scheduled on 03:00 pm",
          time: null,
        },
        {
          icon: "📞",
          color: "bg-green-500",
          title: "Dean responded to your appointment schedule question.",
          time: "09:25 pm",
        },
      ],
    },
    {
      date: "Upcoming Activity",
      items: [
        {
          icon: "👥",
          color: "bg-purple-500",
          title: "Product Meeting",
          description:
            "A product team meeting is a gathering of the cross-functional product team — ideally including team members from product, engineering, marketing, and customer support.",
          subdescription: "Scheduled on 05:00 pm",
          hasActions: true,
          time: null,
        },
      ],
    },
  ];

  const notes = [
    {
      id: 1,
      author: "Darlee Robertson",
      avatar: "https://i.pravatar.cc/150?img=8",
      date: "15 Sep 2023, 12:10 pm",
      title: "Notes added by Antony",
      content:
        "A project review evaluates the success of an initiative and identifies areas for improvement. It can also evaluate a current project to determine whether it's on the right track. Or, it can determine the success of a completed project.",
      files: [
        { name: "Project Specs.xls", size: "365 KB", type: "excel" },
        { name: "090224.jpg", size: "365 KB", type: "image" },
      ],
    },
    {
      id: 2,
      author: "Sharon Roy",
      avatar: "https://i.pravatar.cc/150?img=5",
      date: "18 Sep 2023, 09:52 am",
      title: "Notes added by Antony",
      content:
        "A project plan typically contains a list of the essential elements of a project, such as stakeholders, scope, timelines, estimated cost and communication methods. The project manager typically lists the information based on the assignment.",
      files: [{ name: "Andrewpass.txt", size: "365 KB", type: "text" }],
    },
  ];

  const calls = [
    {
      id: 1,
      author: "Darlee Robertson",
      avatar: "https://i.pravatar.cc/150?img=8",
      date: "23 Jul 2023, 10:00 pm",
      status: "Busy",
      content:
        "A project review evaluates the success of an initiative and identifies areas for improvement. It can also evaluate a current project to determine whether it's on the right track. Or, it can determine the success of a completed project",
    },
    {
      id: 2,
      author: "Sharon Roy",
      avatar: "https://i.pravatar.cc/150?img=5",
      date: "28 Jul 2023, 09:00 pm",
      status: "No Answer",
      content:
        "A project plan typically contains a list of the essential elements of a project, such as stakeholders, scope, timelines, estimated cost and communication methods. The project manager typically lists the information based on the assignment.",
    },
    {
      id: 3,
      author: "Vaughan Lewis",
      avatar: "https://i.pravatar.cc/150?img=12",
      date: "30 Jul 2023, 08:00 pm",
      status: "No Answer",
      content:
        "Projects play a crucial role in the success of organizations, and their importance cannot be overstated. Whether it's launching a new product, improving an existing",
    },
  ];

  const files = [
    {
      id: 1,
      title: "Collier-Turner Proposal",
      description:
        "Send customizable quotes, proposals and contracts to close deals faster.",
      owner: "Darlee Robertson",
      avatar: "https://i.pravatar.cc/150?img=8",
      status: "Proposal",
      statusType: "proposal",
    },
    {
      id: 2,
      title: "Collier-Turner Proposal",
      description:
        "Send customizable quotes, proposals and contracts to close deals faster.",
      owner: "Sharon Roy",
      avatar: "https://i.pravatar.cc/150?img=5",
      status: "Quote",
      statusType: "quote",
      statusExtra: "Sent",
    },
    {
      id: 3,
      title: "Collier-Turner Proposal",
      description:
        "Send customizable quotes, proposals and contracts to close deals faster.",
      owner: "Vaughan Lewis",
      avatar: "https://i.pravatar.cc/150?img=12",
      status: "Proposal",
      statusType: "proposal",
    },
  ];

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "activities":
        return (
          <div className="flex-1 bg-gray-50 p-8 overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Activities</h2>
              <div className="relative">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm text-gray-700">
                    Sort By : {selectedSort}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
                {showSortDropdown && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                    {sortOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setSelectedSort(option);
                          setShowSortDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-gray-700"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {activities.map((section, idx) => (
                <div key={idx}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-md text-xs font-semibold flex items-center gap-2">
                      <span>📅</span> {section.date}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {section.items.map((activity, actIdx) => (
                      <div
                        key={actIdx}
                        className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex gap-4">
                          <div
                            className={`w-12 h-12 ${activity.color} rounded-full flex items-center justify-center text-xl flex-shrink-0`}
                          >
                            {activity.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-gray-900">
                                    {activity.title}
                                  </p>
                                  {activity.subtitle && (
                                    <>
                                      <span className="flex items-center gap-1">
                                        <img
                                          src="https://i.pravatar.cc/150?img=33"
                                          alt="User"
                                          className="w-5 h-5 rounded-full"
                                        />
                                        <span className="font-semibold text-gray-900">
                                          {activity.subtitle}
                                        </span>
                                      </span>
                                    </>
                                  )}
                                </div>
                                aaa
                                {activity.description && (
                                  <p className="text-sm text-gray-600 leading-relaxed mt-1">
                                    {activity.description}
                                  </p>
                                )}
                                {activity.subdescription && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {activity.subdescription}
                                  </p>
                                )}
                              </div>
                            </div>
                            {activity.time && (
                              <p className="text-xs text-gray-500 mt-3">
                                {activity.time}
                              </p>
                            )}

                            {activity.hasActions && (
                              <div className="flex gap-16 mt-4">
                                <div>
                                  <p className="text-xs font-bold text-gray-700 mb-2">
                                    Reminder
                                  </p>
                                  <button className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-md border border-gray-300 text-sm">
                                    Reminder
                                    <ChevronDown className="w-3 h-3" />
                                  </button>
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-gray-700 mb-2">
                                    Task Priority
                                  </p>
                                  <button className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-md border border-red-200 text-sm font-medium">
                                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                    High
                                    <ChevronDown className="w-3 h-3" />
                                  </button>
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-gray-700 mb-2">
                                    Assigned to
                                  </p>
                                  <button className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-md border border-gray-300 text-sm">
                                    <img
                                      src="https://i.pravatar.cc/150?img=15"
                                      alt="Assigned"
                                      className="w-5 h-5 rounded-full"
                                    />
                                    John
                                    <ChevronDown className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "notes":
        return (
          <div className="flex-1 bg-gray-50 p-8 overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Notes</h2>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <button
                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm text-gray-700">
                      Sort By : {selectedSort}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>
                  {showSortDropdown && (
                    <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                      {sortOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setSelectedSort(option);
                            setShowSortDropdown(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-gray-700"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <ActionGuard permission="leads_edit" module="Leads Management" type="update">
                  <button
                    onClick={() => setOpen(true)}
                    className="flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium"
                  >
                    <span className="text-orange-600 border border-orange-600 rounded-full w-4 h-4 flex items-center justify-center text-sm">
                      +
                    </span>
                    Add Note
                  </button>
                </ActionGuard>
              </div>
            </div>

            <div className="space-y-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={note.avatar}
                        alt={note.author}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {note.author}
                        </p>
                        <p className="text-sm text-gray-500">{note.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ActionGuard permission="leads_edit" module="Leads Management" type="update">
                        <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        </button>
                      </ActionGuard>
                      <ActionGuard permission="leads_delete" module="Leads Management" type="delete">
                        <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                          <Trash2 className="w-4 h-4 text-gray-500" />
                        </button>
                      </ActionGuard>
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-2">
                    {note.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    {note.content}
                  </p>

                  <div className="flex flex-wrap gap-4">
                    {note.files.map((file, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${file.type === "image"
                          ? "border-orange-200 bg-orange-50"
                          : "border-gray-200 bg-white"
                          }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${file.type === "excel"
                            ? "bg-green-500"
                            : "bg-green-500"
                            }`}
                        >
                          <span className="text-white text-xl">
                            {file.type === "excel"
                              ? "📊"
                              : file.type === "image"
                                ? "🖼️"
                                : "📄"}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">{file.size}</p>
                        </div>
                        <ActionGuard permission="leads_view_own" module="Leads Management" type="read">
                          <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                            <Download className="w-4 h-4 text-gray-500" />
                          </button>
                        </ActionGuard>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <button className="flex items-center gap-2 text-orange-500 text-sm font-semibold hover:text-orange-600 transition-colors">
                      <span className="text-lg">⊕</span> Add Comment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "calls":
        return (
          <div className="flex-1 bg-gray-50 p-8 overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Calls</h2>
              <ActionGuard permission="leads_edit" module="Leads Management" type="update">
                <button
                  onClick={() => setOpen(true)}
                  className="flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium"
                >
                  <span className="text-orange-500 border border-orange-500 rounded-full w-5 h-5 flex items-center justify-center text-sm">
                    +
                  </span>
                  Add New
                </button>
              </ActionGuard>
            </div>

            <div className="space-y-4">
              {calls.map((call) => (
                <div
                  key={call.id}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={call.avatar}
                        alt={call.author}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="text-sm">
                          <span className="font-semibold text-gray-900">
                            {call.author}
                          </span>
                          <span className="text-gray-600">
                            {" "}
                            logged a call on {call.date}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <button
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium ${call.status === "Busy"
                            ? "bg-red-100 text-red-600"
                            : "bg-purple-100 text-purple-600"
                            }`}
                        >
                          {call.status}
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                      <ActionGuard permission="leads_delete" module="Leads Management" type="delete">
                        <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                          <Trash2 className="w-4 h-4 text-gray-500" />
                        </button>
                      </ActionGuard>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 leading-relaxed">
                    {call.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );

      case "files":
        return (
          <div className="flex-1 bg-gray-50 p-8 overflow-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Files</h2>

            {/* Manage Documents Header */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Manage Documents
                </h3>
                <p className="text-sm text-gray-600">
                  Send customizable quotes, proposals and contracts to close
                  deals faster.
                </p>
              </div>
              <button className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold">
                Create Document
              </button>
            </div>

            {/* Files List */}
            <div className="space-y-4">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {file.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {file.description}
                      </p>

                      <div className="flex items-center gap-3">
                        <img
                          src={file.avatar}
                          alt={file.owner}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <p className="text-xs text-gray-500">Owner</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {file.owner}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${file.statusType === "quote"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-pink-100 text-pink-600"
                            }`}
                        >
                          {file.status}
                        </span>
                        {file.statusExtra && (
                          <span className="px-3 py-1.5 bg-green-100 text-green-600 rounded-md text-xs font-semibold flex items-center gap-1">
                            <span>●</span> {file.statusExtra}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <ActionGuard permission="leads_view_own" module="Leads Management" type="read">
                          <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                            <Download className="w-4 h-4 text-gray-500" />
                          </button>
                        </ActionGuard>
                        <ActionGuard permission="leads_edit" module="Leads Management" type="update">
                          <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                            <Edit2 className="w-4 h-4 text-gray-500" />
                          </button>
                        </ActionGuard>
                        <ActionGuard permission="leads_delete" module="Leads Management" type="delete">
                          <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                            <Trash2 className="w-4 h-4 text-gray-500" />
                          </button>
                        </ActionGuard>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "email":
        return (
          <div className="flex-1 bg-gray-50 p-8 overflow-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Email</h2>

            <div className="bg-white rounded-lg border border-gray-200 p-8 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Manage Emails
                </h3>
                <p className="text-sm text-gray-600">
                  You can send and reply to emails directly via this section.
                </p>
              </div>
              <ActionGuard permission="leads_edit" module="Leads Management" type="update">
                <button className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold">
                  Connect Account
                </button>
              </ActionGuard>
            </div>
          </div>
        );

      case "whatsapp":
        return (
          <WhatsAppTab
            lead={passedLead}
            navigate={navigate}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>

      <div className="min-h-screen bg-gray-0 flex flex-col">
        {/* Back Button */}
        <div className="bg-white px-8 py-4 border-b">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            <ArrowLeftCircle size={22} className="text-gray-500" />
            Back to Leads
          </button>
        </div>

        <div className="flex flex-1">
          {/* Left Sidebar */}
          <div className="w-[400px] ml-6 bg-white border-r">
            {/* Header Card with Gradient */}
            <div className="relative bg-gradient-to-r from-orange-500 to-yellow-400 rounded-b-3xl pt-8 pb-24 px-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-3xl font-bold text-gray-700">
                    {getInitials(leadData.name)}
                  </span>
                </div>
              </div>
            </div>

            {/* Lead Title Card - Overlapping */}
            <div className="px-4 -mt-16 mb-6 relative z-10">
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-5">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h2 className="text-xl font-bold text-gray-900">
                    {leadData.name}
                  </h2>
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400 cursor-pointer hover:scale-110 transition-transform" />
                </div>

                <p className="text-center text-sm text-gray-600 mb-3">
                  1861 Bayonne Ave, Manchester, NJ, 08759
                </p>

                <div className="flex items-center justify-center gap-2 text-sm text-gray-700 mb-3">
                  <span className="flex items-center gap-1">
                    <span>🏢</span> {leadData.company}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-xs flex items-center gap-1 font-medium">
                    <span>🔒</span> {leadData.visibility || "Private"}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-md text-xs font-medium ${getTagStatusColor(
                      leadData.tag
                    )}`}
                  >
                    {leadData.tag || "Closed"}
                  </span>
                </div>
              </div>
            </div>

            {/* Lead Information */}
            <div className="px-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-900">
                  Lead Information
                </h3>
                <ActionGuard permission="leads_edit" module="Leads Management" type="update">
                  <Edit2
                    className="w-4 h-4 text-gray-400 cursor-pointer hover:text-orange-500 transition-colors"
                    onClick={() => setShowEditLeadModal(true)} // Changed from toggling isEditingLead
                  />
                </ActionGuard>
              </div>

              <div className="space-y-3">
                {/* Lead ID */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Hash size={16} className="text-gray-400" /> Lead ID
                  </span>
                  <span className="text-gray-900 font-medium">
                    {leadData.id || "N/A"}
                  </span>
                </div>

                {/* Date Created */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Link size={16} className="text-gray-400" /> Date Created
                  </span>
                  <span className="text-gray-900 font-medium">
                    {leadData.dateCreated}
                  </span>
                </div>

                {/* Value */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <DollarSign size={16} className="text-gray-400" /> Value
                  </span>
                  {isEditingLead ? (
                    <input
                      type="text"
                      value={leadData.value}
                      onChange={(e) =>
                        handleLeadUpdate("value", e.target.value)
                      }
                      className="text-gray-900 font-medium border border-orange-300 rounded px-2 py-1 w-40 text-right focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  ) : (
                    <span className="text-gray-900 font-medium">
                      {leadData.value}
                    </span>
                  )}
                </div>

                {/* Due Date */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" /> Due Date
                  </span>
                  <span className="text-gray-900 font-medium">
                    {leadData.dueDate}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Phone size={16} className="text-gray-400" /> Follow Up
                  </span>
                  <span className="text-gray-900 font-medium">
                    {leadData.followUp}
                  </span>
                </div>

                {/* Source */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Globe size={16} className="text-gray-400" /> Source
                  </span>
                  <span className="text-gray-900 font-medium">
                    {leadData.source}
                  </span>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    {leadData.status === "Active" ? (
                      <CheckCircle size={16} className="text-gray-400" />
                    ) : (
                      <XCircle size={16} className="text-gray-400" />
                    )}
                    Status
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${leadData.status === "Active"
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                      }`}
                  >
                    {leadData.status || "Active"}
                  </span>
                </div>
              </div>
            </div>

            {/* Owner */}
            <div className="px-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-900">Owner</h3>
                <ActionGuard permission="leads_edit" module="Leads Management" type="update">
                  <Edit2
                    className="w-4 h-4 text-gray-400 cursor-pointer hover:text-orange-500 transition-colors"
                    onClick={() => setIsEditingOwner(!isEditingOwner)}
                  />
                </ActionGuard>
              </div>
              <div className="flex items-center gap-3">
                <img
                  src="https://i.pravatar.cc/150?img=12"
                  alt="Owner"
                  className="w-10 h-10 rounded-full"
                />
                <span className="text-sm font-semibold text-gray-900">
                  {passedLead?.employee_name || passedLead?.owner_name || "Unassigned"}
                </span>
              </div>
              {isEditingOwner && (
                <div className="mt-3 text-xs text-gray-500 italic">
                  Click to change owner (Feature coming soon)
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="px-6 mb-6">
              <h3 className="text-base font-bold text-gray-900 mb-4">Tags</h3>
              <div className="flex gap-2">
                <span className="px-3 py-1.5 bg-cyan-50 text-cyan-600 rounded-md text-xs font-semibold">
                  Collab
                </span>
                <span className="px-3 py-1.5 bg-yellow-50 text-yellow-600 rounded-md text-xs font-semibold">
                  Rated
                </span>
              </div>
            </div>

            {/* Projects */}
            <div className="px-6 mb-6">
              <h3 className="text-base font-bold text-gray-800 mb-4">
                Projects
              </h3>
              <div className="flex gap-2 flex-wrap">
                <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                  Denim Design
                </span>
                <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                  Material Design
                </span>
              </div>
            </div>

            {/* Priority */}
            <div className="px-6 mb-6">
              <h3 className="text-base font-bold text-gray-800 mb-4">
                Priority
              </h3>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-md border border-red-200 text-sm font-medium">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                High
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
            </div>

            {/* Contacts */}
            <div className="px-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-800">Contacts</h3>
                <ActionGuard permission="leads_edit" module="Leads Management" type="update">
                  <button
                    className="text-orange-500 text-xs font-semibold flex items-center gap-1"
                    onClick={() => setShowEditLeadModal(true)}
                  >
                    <span className="text-lg">⊕</span> Add New
                  </button>
                </ActionGuard>
              </div>
              <div className="flex items-center gap-3">
                <img
                  src="https://i.pravatar.cc/150?img=5"
                  alt="Contact"
                  className="w-10 h-10 rounded-full"
                />
                <span className="text-sm font-semibold text-gray-800">
                  Sharon Roy
                </span>
              </div>
            </div>

            {/* Other Information */}
            <div className="px-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-800">
                  Other Information
                </h3>
                <ActionGuard permission="leads_edit" module="Leads Management" type="update">
                  <Edit2 className="w-4 h-4 text-gray-400 cursor-pointer" />
                </ActionGuard>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <span>⏰</span> Last Modified
                  </span>
                  <span className="text-gray-900 font-medium">
                    {leadData.dateCreated}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <span>✏️</span> Modified By
                  </span>
                  <div className="flex items-center gap-2">
                    <img
                      src="https://i.pravatar.cc/150?img=8"
                      alt="Modified by"
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-gray-900 font-medium">
                      Darlee Robertson
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            <div className="p-8 bg-white">
              <div className="max-w-6xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Lead Pipeline Status ({pipelineData?.name || "Pipeline"})
                  </h2>
                  {pipelineData?.name === 'Default Pipeline' && (
                    <div className="flex items-center gap-2">
                      <div className="w-48 h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                        <div
                          className="h-full bg-orange-500 transition-all duration-500"
                          style={{
                            width: `${(pipelineData.stages.findIndex(s => s.id === lead?.stage_id) + 1) * 20}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-orange-600">
                        {Math.round((pipelineData.stages.findIndex(s => s.id === lead?.stage_id) + 1) * 20)}% Progress
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-stretch" style={{ height: "60px" }}>
                  {pipelineData?.stages?.map((stage, index) => {
                    const currentStageIndex = pipelineData.stages.findIndex(s => s.id === lead?.stage_id);
                    const isCompleted = currentStageIndex > index;
                    const isActive = currentStageIndex === index;

                    let bgClass = "bg-gray-100";
                    if (isCompleted) bgClass = "bg-green-500";
                    else if (isActive) bgClass = "bg-orange-500 shadow-lg z-10 scale-105";

                    return (
                      <div
                        key={stage.id}
                        className={`relative flex-1 ${bgClass} flex items-center justify-center transition-all duration-300 ${index !== 0 ? "-ml-6" : "rounded-l-lg"} ${index === pipelineData.stages.length - 1 ? "rounded-r-lg" : ""}`}
                        style={{
                          clipPath: index === 0
                            ? "polygon(0 0, calc(100% - 24px) 0, 100% 50%, calc(100% - 24px) 100%, 0 100%, 0 0)"
                            : (index === pipelineData.stages.length - 1 && pipelineData.stages.length > 1)
                              ? "polygon(24px 0, 100% 0, 100% 100%, 24px 100%, 0 50%)"
                              : "polygon(24px 0, calc(100% - 24px) 0, 100% 50%, calc(100% - 24px) 100%, 24px 100%, 0 50%)",
                        }}
                      >
                        <span className={`font-bold text-xs text-center px-4 ${isCompleted || isActive ? "text-white" : "text-gray-400"}`}>
                          {stage.name}
                        </span>
                      </div>
                    );
                  })}
                  {(!pipelineData?.stages || pipelineData.stages.length === 0) && (
                    <div className="flex-1 bg-gray-100 rounded-lg flex items-center justify-center italic text-gray-400 font-bold">
                      No stages defined for this pipeline
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white border-b">
              <div className="flex px-8">
                <button
                  onClick={() => setActiveTab("activities")}
                  className={`px-6 py-4 font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${activeTab === "activities"
                    ? "border-orange-500 text-orange-500"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                  <span>⚡</span> Activities
                </button>
                <button
                  onClick={() => setActiveTab("notes")}
                  className={`px-6 py-4 font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${activeTab === "notes"
                    ? "border-orange-500 text-orange-500"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                  <span>📝</span> Notes
                </button>
                <button
                  onClick={() => setActiveTab("calls")}
                  className={`px-6 py-4 font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${activeTab === "calls"
                    ? "border-orange-500 text-orange-500"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                  <span>📞</span> Calls
                </button>
                <button
                  onClick={() => setActiveTab("files")}
                  className={`px-6 py-4 font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${activeTab === "files"
                    ? "border-orange-500 text-orange-500"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                  <span>📄</span> Files
                </button>
                <button
                  onClick={() => setActiveTab("email")}
                  className={`px-6 py-4 font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${activeTab === "email"
                    ? "border-orange-500 text-orange-500"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                  <span>✉️</span> Email
                </button>
                <button
                  onClick={() => setActiveTab("whatsapp")}
                  className={`px-6 py-4 font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${activeTab === "whatsapp"
                    ? "border-orange-500 text-orange-500"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                  <FaWhatsapp
                    size={22}
                    className={`${activeTab === "whatsapp"
                      ? "text-green-500"
                      : "text-green-400"
                      }`}
                  />
                  WhatsApp
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {renderTabContent()}
          </div>
        </div>
      </div>
      <AddNoteModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={handleSave}
      />

      <EditLeadModal
        open={showEditLeadModal}
        onClose={() => setShowEditLeadModal(false)}
        leadData={leadData}
        onSave={handleLeadInfoSave}
      />
    </>
  );
}

// --- WhatsApp Tab Component --------------------------------------------------
import SendWhatsAppModal from "../../components/LeadManagement/SendWhatsAppModal";
import { MessageSquare, Zap, RefreshCw } from 'lucide-react';
import { useGetLogsQuery } from "../../store/api/integrationApi";

function WhatsAppTab({ lead, navigate }) {
  const { data: waConfig, isLoading } = useGetWhatsAppConfigQuery();
  const { data: logsData } = useGetLogsQuery({ channel_type: 'whatsapp_msg', limit: 100 });
  const [showSendModal, setShowSendModal] = React.useState(false);
  
  // Check if at least one account is configured
  const isConfigured = !isLoading && waConfig?.success && Array.isArray(waConfig.data) && waConfig.data.length > 0;
  
  // Find last WhatsApp message for this lead
  const leadLogs = React.useMemo(() => {
    return logsData?.data?.filter(log => log.reference_id === lead.id) || [];
  }, [logsData, lead.id]);
  
  const lastLog = leadLogs[0];
  const lastUsedAccount = lastLog?.raw_data?.account_name || null;

  return (
    <div className="flex-1 bg-gray-50 p-8 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
               <FaWhatsapp className="text-green-500" /> WhatsApp Messenger
            </h2>
            {lastUsedAccount && (
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full border border-blue-100 shadow-sm animate-fadeIn">
                 <span className="text-[10px] font-black uppercase tracking-widest">Last Interaction via:</span>
                 <span className="text-xs font-bold">{lastUsedAccount}</span>
              </div>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Messages Sent</p>
                <p className="text-2xl font-black text-gray-900">{leadLogs.length}</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Active Accounts</p>
                <p className="text-2xl font-black text-green-600">
                    {waConfig?.data?.filter(c => c.status === 'Active').length || 0}
                </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Latest Status</p>
                <p className="text-2xl font-black text-blue-600 capitalize">
                    {lastLog?.status || 'None'}
                </p>
            </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center justify-center text-center gap-6 shadow-sm">
          <div className="relative">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-xl z-10 relative">
              <FaWhatsapp size={40} className="text-white" />
            </div>
            <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20"></div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-gray-900">Reach Out via WhatsApp</h3>
            <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
              Engage with your leads instantly using pre-approved templates from any of your connected WhatsApp Business accounts.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {isLoading ? (
              <div className="flex items-center gap-2 px-6 py-3 bg-gray-100 rounded-lg text-gray-400 font-bold animate-pulse">
                <RefreshCw size={18} className="animate-spin" /> Checking Config...
              </div>
            ) : isConfigured ? (
              <button 
                onClick={() => {
                  if (!lead.mobile_number && !lead.phone) {
                    toast.error("Please add a mobile number to the lead's profile to proceed with WhatsApp.");
                    // Optional: open edit modal directly if context allows, but tab is nested
                    return;
                  }
                  setShowSendModal(true);
                }} 
                className="flex items-center gap-2 px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-all shadow-[0_4px_14px_0_rgba(34,197,94,0.39)] hover:shadow-lg active:scale-95"
              >
                <FaWhatsapp size={20} /> Send Message Now
              </button>
            ) : (
              <button 
                onClick={() => navigate("/channel-integration?tab=whatsapp")} 
                className="flex items-center gap-2 px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-all shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] hover:shadow-lg active:scale-95"
              >
                <Zap size={20} /> Configure WhatsApp First
              </button>
            )}
          </div>
        </div>
        
        {leadLogs.length > 0 && (
          <div className="mt-10">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Recent WhatsApp Activity</h4>
              <div className="space-y-3">
                {leadLogs.slice(0, 5).map((log, idx) => (
                  <div key={idx} className="bg-white border border-gray-100 p-4 rounded-lg flex items-center justify-between shadow-sm hover:border-orange-100 transition-colors">
                      <div className="flex items-center gap-4">
                          <div className="p-2 bg-green-50 text-green-600 rounded-sm">
                              <MessageSquare size={16} />
                          </div>
                          <div>
                              <p className="text-sm font-bold text-gray-900">{log.raw_data?.templateName || 'Template Sent'}</p>
                              <p className="text-[10px] font-semibold text-gray-400">via {log.raw_data?.account_name || 'Primary Account'}</p>
                          </div>
                      </div>
                      <div className="text-right">
                          <p className="text-xs font-bold text-gray-700">{new Date(log.created_at).toLocaleDateString()}</p>
                          <p className="text-[10px] text-green-500 font-black uppercase tracking-widest">{log.status}</p>
                      </div>
                  </div>
                ))}
              </div>
          </div>
        )}
      </div>

      {showSendModal && isConfigured && (
        <SendWhatsAppModal isOpen={true} onClose={() => setShowSendModal(false)} lead={lead} />
      )}
    </div>
  );
}
