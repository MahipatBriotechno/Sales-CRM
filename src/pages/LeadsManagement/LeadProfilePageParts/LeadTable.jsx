import React from "react";
import {
  Edit2,
  PhoneCall,
  AlertTriangle,
  CalendarClock,
  ChevronDown,
  Download,
  Trash2,
  MessageCircle,
  Phone,
  FileText,
  Users,
  Calendar,
  File,
  Image,
  FileSpreadsheet,
  Mail,
  Zap,
  Clock,
  Video,
  Plus,
  Bell,
  MoreVertical,
  MapPin,
  X
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import {
  useGetLeadActivitiesQuery,
  useGetLeadNotesQuery,
  useGetLeadCallsQuery,
  useGetLeadFilesQuery,
  useGetLeadMeetingsQuery,
  useGetLeadByIdQuery,
  useUpdateLeadMeetingMutation,
  useUpdateLeadMutation,
  useAddNoteCommentMutation
} from "../../../store/api/leadApi";

const formatDateUTC = (dateStr) => {
  if (!dateStr) return "Just now";
  let date = new Date(dateStr);

  if (typeof dateStr === 'string' && !dateStr.includes('T') && !dateStr.includes('Z')) {
    const utcDate = new Date(dateStr.replace(' ', 'T') + 'Z');
    if (!isNaN(utcDate.getTime())) {
      date = utcDate;
    }
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const getFriendlyDate = (dateStr) => {
  if (!dateStr || dateStr === "Recent") return dateStr;

  // Parse the date (assuming dd MMM yyyy from locale)
  const [day, month, year] = dateStr.split(' ');
  const monthMap = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  const d = new Date(year, monthMap[month], day);

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

  return dateStr;
};

const ExpandableText = ({ text, limit = 150 }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  if (!text) return null;
  if (text.length <= limit) return <span className="whitespace-pre-wrap">{text}</span>;

  return (
    <span className="whitespace-pre-wrap relative inline-block w-full">
      {isExpanded ? text : `${text.substring(0, limit)}...`}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className="ml-1 text-orange-600 hover:text-orange-700 font-bold transition-all hover:underline"
      >
        {isExpanded ? "Show Less" : "Read More"}
      </button>
    </span>
  );
};

const UserAvatar = ({ name, profilePicture, size = "w-10 h-10 border" }) => {
  const [imgError, setImgError] = React.useState(false);
  React.useEffect(() => { setImgError(false); }, [profilePicture]);

  const getInitials = (fullName) => {
    if (!fullName) return "??";
    const names = fullName.trim().split(" ");
    return (names.length >= 2 ? (names[0][0] + names[1][0]) : names[0].substring(0, 2)).toUpperCase();
  };

  const getColorFromName = (name) => {
    const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-red-500", "bg-slate-500", "bg-teal-500"];
    let hash = 0;
    const str = String(name || "U");
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const baseUrl = (import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000/api/').replace('/api/', '');
  const cleanPath = (profilePicture && typeof profilePicture === 'string' && profilePicture !== 'null') ? profilePicture.trim() : null;
  const imageUrl = cleanPath ? (cleanPath.startsWith('http') ? cleanPath : `${baseUrl}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`) : null;

  if (!imageUrl || imgError) {
    return (
      <div className={`${size} rounded-none ${getColorFromName(name)} flex items-center justify-center text-white font-bold text-[8px] border-gray-100 shadow-sm`} title={name}>
        {getInitials(name)}
      </div>
    );
  }

  return (
    <div className={`${size} rounded-none overflow-hidden flex items-center justify-center border-gray-200 bg-gray-50 shadow-sm`} title={name}>
      <img src={imageUrl} alt={name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
    </div>
  );
};

export default function LeadTabs({
  activeTab,
  setActiveTab,
  selectedSort,
  setSelectedSort,
  showSortDropdown,
  setShowSortDropdown,
  onAddClick,
  onEditClick = () => { },
  onDeleteClick = () => { },
  onDownloadClick = () => { },
  leadId,
  isDisabled = false,
  setShowWhatsAppModal,
}) {
  const sortOptions = [
    "Last 7 Days",
    "Last 30 Days",
    "Last 3 Months",
    "All Time",
  ];

  const { data: fetchedNotes, isLoading: notesLoading } = useGetLeadNotesQuery(leadId, { skip: !leadId });
  const { data: fetchedCalls, isLoading: callsLoading } = useGetLeadCallsQuery(leadId, { skip: !leadId });
  const { data: fetchedFiles, isLoading: filesLoading } = useGetLeadFilesQuery(leadId, { skip: !leadId });
  const { data: fetchedActivities, isLoading: activitiesLoading } = useGetLeadActivitiesQuery(leadId, { skip: !leadId });
  const { data: fetchedMeetings, isLoading: meetingsLoading } = useGetLeadMeetingsQuery(leadId, { skip: !leadId });
  const { data: leadData } = useGetLeadByIdQuery(leadId, { skip: !leadId });

  const [updateMeeting] = useUpdateLeadMeetingMutation();
  const [updateLead] = useUpdateLeadMutation();
  const [addNoteComment] = useAddNoteCommentMutation();

  const [partModal, setPartModal] = React.useState({ show: false, attendees: [] });
  const [openCommentNoteId, setOpenCommentNoteId] = React.useState(null);
  const [noteCommentText, setNoteCommentText] = React.useState("");

  const ParticipantsModal = () => {
    if (!partModal.show) return null;
    return (
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-white rounded-none shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 ">
          <div className="bg-[#f36015] px-6 py-6 flex items-start justify-between relative overflow-hidden">
            <div className="flex gap-4 items-center">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-none flex items-center justify-center border border-white/30 shadow-inner">
                <Users size={28} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-xl leading-tight">Meeting Attendees</h3>
                <p className="text-white/80 text-xs font-semibold mt-0.5">List of all members in this meeting</p>
              </div>
            </div>
            <button
              onClick={() => setPartModal({ show: false, attendees: [] })}
              className="text-white hover:bg-white/10 p-2 rounded-none transition-colors absolute top-4 right-4"
            >
              <X size={22} className="stroke-[2.5px]" />
            </button>
          </div>

          <div className="max-h-[50vh] overflow-y-auto custom-scrollbar bg-white">
            {partModal.attendees.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {partModal.attendees.map((at, idx) => {
                  const name = typeof at === 'string' ? at : (at.employee_name || at.name || at.email);
                  const email = typeof at === 'string' ? at : at.email;
                  const designation = typeof at === 'object' ? at.designation_name : null;
                  const profilePicture = typeof at === 'object' ? (at.profile_picture || at.profilePicture) : null;

                  return (
                    <div key={idx} className="p-4 flex items-center gap-4 hover:bg-orange-50/50 transition-all group">
                      <UserAvatar name={name} profilePicture={profilePicture} size="w-12 h-12 shadow-sm border-2 border-white" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-800 capitalize truncate text-[14px]">
                            {name}
                          </p>
                          {designation && (
                            <span className="text-[10px] bg-orange-100 text-[#f36015] px-2 py-0.5 rounded-none font-bold uppercase tracking-wider">
                              {designation}
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] text-slate-400 font-bold truncate mt-0.5">{email}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Users size={32} />
                </div>
                <p className="font-bold text-sm uppercase tracking-widest">No participants Found</p>
              </div>
            )}
          </div>

          <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-3">
            <button
              onClick={() => setPartModal({ show: false, attendees: [] })}
              className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-600 font-bold text-sm rounded-none hover:bg-slate-50 transition-all active:scale-[0.98] shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => setPartModal({ show: false, attendees: [] })}
              className="flex-1 py-3.5 bg-[#f36015] text-white font-bold text-sm rounded-none hover:bg-[#e05610] transition-all active:scale-[0.98] shadow-lg shadow-orange-500/20"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  };

  const notes = (fetchedNotes || []).map((note, idx) => {
    let parsedFiles = [];
    if (note.files) {
      try {
        parsedFiles = typeof note.files === 'string' ? JSON.parse(note.files) : note.files;
        if (!Array.isArray(parsedFiles)) parsedFiles = [];
      } catch (e) {
        parsedFiles = [];
      }
    }

    return {
      id: note.id || idx,
      author: (note.created_by || "Unknown User").toLowerCase(),
      profilePicture: note.profile_picture,
      date: formatDateUTC(note.created_at),
      title: (note.title || "Note").toLowerCase(),
      description: note.description || "",
      files: parsedFiles.map(f => ({ name: f.name || "File", size: f.size || "0 KB", type: f.type || "file", path: f.path })),
      comments: (() => {
        try {
          const c = typeof note.comments === 'string' ? JSON.parse(note.comments) : note.comments;
          return Array.isArray(c) ? c : [];
        } catch (e) {
          return [];
        }
      })(),
      originalData: note
    };
  });

  const calls = (fetchedCalls || []).map((call, idx) => ({
    id: call.id || idx,
    author: (call.created_by || "Unknown User").toLowerCase(),
    profilePicture: call.profile_picture,
    date: formatDateUTC(call.created_at),
    status: call.status || "Completed",
    content: call.note || "No notes",
    duration: call.duration,
    priority: call.priority || null,
    nextFollowUp: call.follow_task ? call.call_date : null,
    originalData: call
  }));

  const files = (fetchedFiles || []).map((file, idx) => ({
    id: file.id || idx,
    title: (file.title || file.name || "Document").toLowerCase(),
    description: file.description || "Uploaded file",
    owner: (file.uploaded_by || "Unknown User").toLowerCase(),
    profilePicture: file.profile_picture,
    status: "Uploaded",
    originalData: file,
  }));

  const meetings = (fetchedMeetings || []).map((meeting, idx) => {
    let parsedAttendees = [];
    if (meeting.attendees) {
      try {
        parsedAttendees = Array.isArray(meeting.attendees) ? meeting.attendees : JSON.parse(meeting.attendees);
        if (!Array.isArray(parsedAttendees)) parsedAttendees = [];
      } catch (e) {
        parsedAttendees = [];
      }
    }

    return {
      id: meeting.id || idx,
      title: (meeting.title || "Meeting").toLowerCase(),
      description: meeting.description || "",
      host: (meeting.created_by || "Unknown User").toLowerCase(),
      profilePicture: meeting.profile_picture,
      date: meeting.meeting_date ? new Date(meeting.meeting_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "TBD",
      time: meeting.meeting_time ? new Date(`2000-01-01T${meeting.meeting_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : "TBD",
      attendees: parsedAttendees,
      priority: meeting.priority || "Medium",
      meeting_type: meeting.meeting_type || "Online",
      meeting_link: meeting.meeting_link || "",
      address_line1: meeting.address_line1 || "",
      address_line2: meeting.address_line2 || "",
      city: meeting.city || "",
      state: meeting.state || "",
      pincode: meeting.pincode || "",
      originalData: meeting
    };
  });

  const activities = React.useMemo(() => {
    if (!fetchedActivities || fetchedActivities.length === 0) return [];

    // Group activities by date
    const grouped = fetchedActivities.reduce((acc, act) => {
      const fullDate = act.created_at ? new Date(act.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "Recent";
      const friendlyDate = getFriendlyDate(fullDate);

      if (!acc[friendlyDate]) acc[friendlyDate] = [];
      const dateKey = friendlyDate;

      let icon = MessageCircle;
      let color = "bg-blue-400";
      let titlePrefix = "Activity";

      if (act.type === "call") {
        icon = Phone;
        color = "bg-green-500";
        titlePrefix = "Call Log";
      } else if (act.type === "note") {
        icon = FileText;
        color = "bg-indigo-500";
        titlePrefix = "Note";
      } else if (act.type === "file") {
        icon = File;
        color = "bg-orange-500";
        titlePrefix = "File";
      } else if (act.type === "meeting") {
        icon = Users;
        color = "bg-purple-500";
        titlePrefix = "Meeting";
      } else if (act.type === "snooze") {
        icon = Clock;
        color = "bg-amber-500";
        titlePrefix = "Snoozed";
      } else if (act.type === "status_change") {
        icon = Zap;
        color = "bg-blue-500";
        titlePrefix = "Status Updated";
      } else if (act.type === "won") {
        icon = Zap;
        color = "bg-green-600";
        titlePrefix = "Lead Won";
      } else if (act.type === "dropped") {
        icon = Trash2;
        color = "bg-red-500";
        titlePrefix = "Lead Dropped";
      } else if (act.type === "missed") {
        icon = Bell;
        color = "bg-red-400";
        titlePrefix = "Follow-up Missed";
      } else if (act.type === "notification") {
        icon = Bell;
        color = "bg-cyan-500";
        titlePrefix = "System";
      }

      let finalTitle = "";
      if (["note", "call", "file", "meeting"].includes(act.type)) {
        finalTitle = act.title ? `${titlePrefix}: ${act.title}` : titlePrefix;
      } else {
        // For notifications, status changes, snooze, etc - the title provided by backend is already descriptive
        finalTitle = act.title || titlePrefix;
      }

      acc[friendlyDate].push({
        id: act.id,
        type: act.type,
        icon,
        color,
        title: finalTitle,
        subtitle: act.user_name || "System",
        profilePicture: act.profile_picture,
        description: act.description || "",
        time: act.created_at ? formatDateUTC(act.created_at).split(', ')[1] : "",
      });
      return acc;
    }, {});

    return Object.entries(grouped).map(([date, items]) => ({ date, items }));
  }, [fetchedActivities]);

  const upcomingActivities = React.useMemo(() => {
    const list = [];
    const now = new Date();

    // 1. Future Meetings
    if (fetchedMeetings) {
      fetchedMeetings.forEach(m => {
        const mDate = new Date(`${m.meeting_date}T${m.meeting_time || '00:00:00'}`);
        if (mDate > now) {
          list.push({
            type: 'meeting',
            id: m.id,
            title: m.title,
            description: m.description,
            date: m.meeting_date,
            time: m.meeting_time ? new Date(`2000-01-01T${m.meeting_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : 'TBD',
            priority: m.priority || 'Medium',
            assigned_to: m.created_by,
            profilePicture: m.profile_picture,
            originalData: m
          });
        }
      });
    }

    // 2. Future Follow-up
    if (leadData?.next_call_at) {
      const fDate = new Date(leadData.next_call_at);
      if (fDate > now) {
        list.push({
          type: 'follow_up',
          id: leadData.id,
          title: "Follow-up Call",
          description: leadData.call_remarks || `Scheduled follow-up call with client regarding the previous discussion.`,
          date: fDate.toLocaleDateString(),
          time: fDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
          priority: leadData.priority || 'Medium',
          assigned_to: leadData.employee_name || "Agent",
          profilePicture: leadData.profile_image
        });
      }
    }

    return list.sort((a, b) => new Date(`${a.date}T${a.time || '00:00:00'}`) - new Date(`${b.date}T${b.time || '00:00:00'}`));
  }, [fetchedMeetings, leadData]);

  const handlePriorityChange = async (upcoming, newPriority) => {
    try {
      if (upcoming.type === 'meeting') {
        const data = upcoming.originalData;
        await updateMeeting({
          leadId: leadId,
          meetingId: upcoming.id,
          data: {
            ...data,
            priority: newPriority,
            date: data.meeting_date,
            time: data.meeting_time
          }
        }).unwrap();
      } else if (upcoming.type === 'follow_up') {
        await updateLead({
          id: upcoming.id,
          data: { priority: newPriority }
        }).unwrap();
      }
    } catch (err) {
      console.error("Failed to update priority:", err);
    }
  };

  const renderTabContent = () => {
    const normalizedTab = activeTab.toLowerCase().endsWith('s') ? activeTab.toLowerCase() : activeTab.toLowerCase() + 's';
    const finalTab = activeTab === 'activities' ? 'activities' :
      (activeTab === 'whatsapp' ? 'whatsapp' :
        (activeTab === 'email' ? 'email' : normalizedTab));

    const TabHeader = ({ title, showAdd = false, addLabel = "", addType = "", showSort = true }) => (
      <div className="flex items-center justify-between py-4 px-6 bg-white border-b border-gray-100 rounded-none">
        <h2 className="text-lg font-bold text-gray-800 font-primary capitalize tracking-tight flex items-center gap-2">
          {title}
        </h2>
        <div className="flex items-center gap-4">
          {showSort && (
            <div className="relative">
              <button
                disabled={isDisabled}
                onClick={() => !isDisabled && setShowSortDropdown(!showSortDropdown)}
                className={`flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-none text-xs font-bold text-gray-600 transition-all font-primary shadow-sm hover:shadow ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
              >
                Sort By : {selectedSort}
                <ChevronDown size={14} className="text-gray-400" />
              </button>
              {showSortDropdown && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-none shadow-xl z-50 py-1.5 animate-fadeIn">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setSelectedSort(opt);
                        setShowSortDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-[12px] font-bold text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {showAdd && (
            <button
              disabled={isDisabled}
              onClick={() => !isDisabled && onAddClick(addType)}
              className={`flex items-center gap-2 transition-all font-bold text-sm font-primary px-3 py-1.5 rounded-none border ${isDisabled ? 'text-gray-300 border-gray-200 cursor-not-allowed' : 'text-orange-600 border-orange-200 hover:border-orange-400 hover:bg-orange-50 active:scale-95'}`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isDisabled ? 'bg-gray-100' : 'bg-orange-100'}`}>
                <Plus size={14} className="stroke-[3px]" />
              </div>
              {addLabel}
            </button>
          )}
        </div>
      </div>
    );

    switch (finalTab) {
      case "activities":
        return (
          <div className="flex-1 bg-[#F9FBFC] overflow-auto animate-fadeIn min-h-[500px]">
            <TabHeader title="Activities" showSort={true} />
            <div className="p-6 space-y-8">
              {/* Upcoming Activity Section */}
              {upcomingActivities.length > 0 && (
                <div className="space-y-4 mb-10">
                  <div className="flex items-center gap-2">
                    <span className="px-4 py-2 bg-purple-50 text-purple-700 rounded-none text-xs font-bold font-primary shadow-sm inline-flex items-center gap-2 border border-purple-100 tracking-wide">
                      <Calendar size={14} className="text-purple-600" /> Upcoming Activity
                    </span>
                  </div>

                  <div className="space-y-5">
                    {upcomingActivities.map((upcoming, uIdx) => (
                      <div
                        key={uIdx}
                        onClick={() => {
                          if (upcoming.type === 'meeting') setActiveTab('meeting');
                          else if (upcoming.type === 'follow_up') setActiveTab('calls');
                        }}
                        className="bg-white rounded-none border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 cursor-pointer transition-all overflow-hidden font-primary group/card"
                      >
                        <div className="p-6 flex gap-5 items-start">
                          <div className={`w-12 h-12 ${upcoming.type === 'meeting' ? 'bg-purple-600' : 'bg-orange-500'} rounded-full flex items-center justify-center flex-shrink-0 shadow-md transition-transform group-hover/card:scale-105`}>
                            {upcoming.type === 'meeting' ? <Users size={20} className="text-white" /> : <Phone size={20} className="text-white" />}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-extrabold text-[#1E293B] text-[17px] leading-tight mb-1.5" title={upcoming.title}>
                              {upcoming.title?.length > 60 ? upcoming.title.substring(0, 60) + "..." : upcoming.title}
                            </h4>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-[13px] font-bold text-slate-400">
                                <span className="text-orange-500/80 font-black">Scheduled on</span>
                                <span className="text-slate-600 bg-slate-100/50 px-2 py-0.5 rounded-none">{upcoming.time}</span>
                              </div>
                              {upcoming.type === 'meeting' && upcoming.originalData?.attendees && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const attendees = Array.isArray(upcoming.originalData.attendees) ? upcoming.originalData.attendees : JSON.parse(upcoming.originalData.attendees || '[]');
                                    setPartModal({ show: true, attendees });
                                  }}
                                  className="flex items-center -space-x-2 overflow-x-auto no-scrollbar hover:bg-slate-100 p-1 rounded-full transition-colors max-w-[120px]"
                                >
                                  {(Array.isArray(upcoming.originalData.attendees) ? upcoming.originalData.attendees : JSON.parse(upcoming.originalData.attendees || '[]')).map((at, i) => (
                                    <UserAvatar key={i} name={typeof at === 'string' ? at : at.name} size="w-7 h-7 border-2 border-white shadow-sm flex-shrink-0" />
                                  ))}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity List */}
              {activitiesLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-400 font-bold font-primary text-sm tracking-wide">Tracking activities...</p>
                </div>
              ) : activities.length === 0 ? (
                !activitiesLoading && upcomingActivities.length === 0 && (
                  <div className="text-center py-24 bg-white rounded-none border-2 border-dashed border-gray-200 mx-6">
                    <Zap size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-400 font-bold font-primary capitalize tracking-wide text-sm">No activity history yet</p>
                  </div>
                )
              ) : (
                activities.map((section, idx) => (
                  <div key={idx} className="relative">
                    <div className="mb-6">
                      <span className="px-3 py-1 bg-[#F5ECF8] text-[#9333EA] rounded-none text-[11px] font-bold font-primary shadow-sm inline-flex items-center gap-2 border border-[#E9D5FF]">
                        <Calendar size={12} /> {section.date}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {section.items.map((activity, actIdx) => (
                        <div
                          key={actIdx}
                          onClick={() => {
                            if (activity.type === 'call') setActiveTab('calls');
                            else if (activity.type === 'note') setActiveTab('notes');
                            else if (activity.type === 'file') setActiveTab('files');
                            else if (activity.type === 'meeting') setActiveTab('meeting');
                          }}
                          className="bg-white rounded-none border border-gray-100 p-5 hover:border-orange-200 cursor-pointer transition-all hover:shadow-md shadow-sm group flex gap-5 items-start"
                        >
                          <div className={`w-10 h-10 ${activity.color} rounded-full flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105`}>
                            <activity.icon size={18} className="text-white fill-white/20" />
                          </div>
                          <div className="flex-1 space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-gray-800 font-primary text-[15px] leading-tight mb-1 capitalize">
                                  {activity.title}
                                </h4>
                                <p className="text-[12px] font-bold text-gray-400 font-primary">{activity.time}</p>
                              </div>
                              <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-none border border-gray-100">
                                <UserAvatar name={activity.subtitle} profilePicture={activity.profilePicture} size="w-6 h-6 border border-white" />
                                <span className="text-[11px] font-bold text-gray-600 capitalize">{activity.subtitle}</span>
                              </div>
                            </div>


                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case "notes":
        return (
          <div className="flex-1 bg-[#F9FBFC] overflow-auto animate-fadeIn min-h-[500px]">
            <TabHeader title="Notes" showAdd={true} addLabel="Add Note" addType="note" />
            <div className="p-6 space-y-6">
              {notesLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-none border-2 border-dashed border-gray-200 mx-6">
                  <FileText size={48} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-gray-400 font-bold font-primary text-sm">Your notebook is empty</p>
                </div>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="bg-white rounded-none border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 cursor-pointer transition-all overflow-hidden font-primary group/card">
                    <div className="p-6">
                      <div className="flex gap-5 items-start mb-6">
                        <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-xl transition-transform group-hover/card:scale-105">
                          <FileText size={24} className="text-white fill-white/20" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-600 rounded-none text-[10px] font-black uppercase tracking-widest border border-orange-100">
                                <FileText size={12} className="fill-orange-600/10" />
                                Note
                              </div>
                              <div className="flex items-center gap-1.5 text-[12px] font-bold text-orange-600">
                                <Calendar size={12} /> {note.date}
                              </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
                              <button onClick={(e) => { e.stopPropagation(); onEditClick('note', note.originalData); }} className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-none">
                                <Edit2 size={16} />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); onDeleteClick('note', note.id); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-none">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          <h4 className="font-semibold text-[#1E293B] text-[17px] leading-tight mb-2 capitalize" title={note.title}>
                            {note.title}
                          </h4>
                          <div className="text-[14px] text-gray-500 font-medium leading-relaxed">
                            <ExpandableText text={note.description} limit={300} />
                          </div>
                        </div>
                      </div>

                      {/* Files Box - Reusing Meeting's Location Box style */}
                      {note.files && note.files.length > 0 && (
                        <div className="mb-6 p-4 bg-slate-50/80 border border-slate-100 rounded-none mx-6 group-hover/card:border-orange-200 transition-colors">
                          <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-3 italic">Attached Documents</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {note.files.map((file, fIdx) => (
                              <div key={fIdx} className="flex items-center gap-3 p-3 bg-white rounded-none border border-gray-100 hover:border-orange-200 transition-all shadow-sm group/file">
                                <div className="w-10 h-10 bg-orange-500 rounded-none flex items-center justify-center flex-shrink-0 shadow-sm shadow-orange-500/10">
                                  {file.name.toLowerCase().endsWith('.xls') || file.name.toLowerCase().endsWith('.xlsx') ? (
                                    <FileSpreadsheet size={18} className="text-white" />
                                  ) : (
                                    <Image size={18} className="text-white" />
                                  )}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                  <p className="text-[13px] font-bold text-slate-700 truncate" title={file.name}>{file.name}</p>
                                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{file.size}</p>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); onDownloadClick(file.path, file.name); }}
                                  className="p-1.5 text-gray-400 hover:text-orange-600 transition-colors"
                                >
                                  <Download size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Comments Section */}
                      {note.comments && note.comments.length > 0 && (
                        <div className="mb-6">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">Recent Comments</p>
                          <div className="max-h-[220px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                            {note.comments.map((comment, cIdx) => (
                              <div key={cIdx} className="flex gap-3 bg-slate-50/50 p-3 rounded-none border border-slate-100/50">
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-slate-600">
                                  {comment.user_name?.substring(0, 2).toUpperCase() || '??'}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-[12px] font-bold text-slate-700">{comment.user_name}</span>
                                    <span className="text-[10px] text-slate-400 font-medium">{new Date(comment.created_at).toLocaleDateString()}</span>
                                  </div>
                                  <p className="text-[13px] text-slate-600 leading-snug">{comment.text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Add Comment Input */}
                      {openCommentNoteId === note.id && (
                        <div className="mb-6 animate-fadeIn">
                          <textarea
                            autoFocus
                            value={noteCommentText}
                            onChange={(e) => setNoteCommentText(e.target.value)}
                            placeholder="Type your comment here..."
                            className="w-full p-4 bg-white border border-gray-100 rounded-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-[14px] font-medium transition-all resize-none shadow-sm font-primary outline-none"
                            rows={3}
                          />
                          <div className="flex justify-end items-center gap-4 mt-3">
                            <button
                              onClick={() => {
                                setOpenCommentNoteId(null);
                                setNoteCommentText("");
                              }}
                              className="text-[12px] font-bold text-slate-400 hover:text-orange-600 transition-colors font-primary capitalize tracking-wide"
                            >
                              Cancel
                            </button>
                            <button
                              disabled={!noteCommentText.trim()}
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await addNoteComment({
                                    leadId,
                                    noteId: note.id,
                                    text: noteCommentText
                                  }).unwrap();
                                  setOpenCommentNoteId(null);
                                  setNoteCommentText("");
                                } catch (err) {
                                  console.error("Failed to add comment:", err);
                                }
                              }}
                              className="px-6 py-2.5 bg-orange-500 text-white rounded-none text-[12px] font-black capitalize tracking-wide hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:shadow-none active:scale-95 font-primary"
                            >
                              Post Comment
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-5 border-t border-gray-100">
                        <div className="flex items-center gap-8">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest font-primary">Created By</span>
                            <div className="flex items-center gap-2">
                              <UserAvatar name={note.author} profilePicture={note.profilePicture} size="w-7 h-7" />
                              <span className="text-[12px] font-bold text-slate-700 capitalize font-primary">{note.author}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (openCommentNoteId === note.id) {
                              setOpenCommentNoteId(null);
                            } else {
                              setOpenCommentNoteId(note.id);
                              setNoteCommentText("");
                            }
                          }}
                          className={`px-4 py-2 border transition-all font-bold text-[12px] font-primary flex items-center gap-2 shadow-sm active:scale-95 rounded-none ${openCommentNoteId === note.id ? 'bg-orange-600 text-white border-orange-600' : 'bg-white border-orange-200 text-orange-600 hover:bg-orange-50'}`}
                        >
                          {openCommentNoteId === note.id ? <X size={14} className="stroke-[3px]" /> : <Plus size={14} className="stroke-[3px]" />}
                          {openCommentNoteId === note.id ? "Cancel" : "Add Comment"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case "calls":
        return (
          <div className="flex-1 bg-[#F9FBFC] overflow-auto animate-fadeIn min-h-[500px]">
            <TabHeader title="Calls" showAdd={true} addLabel="Add New" addType="call" showSort={false} />
            <div className="p-6 space-y-4">
              {callsLoading ? (
                <div className="text-center py-20">
                  <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                </div>
              ) : calls.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-none border-2 border-dashed border-gray-200 mx-6">
                  <Phone size={48} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-gray-400 font-bold font-primary text-sm">No calls recorded yet</p>
                </div>
              ) : (
                calls.map((call) => (
                  <div key={call.id} className="bg-white rounded-none border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 cursor-pointer transition-all overflow-hidden font-primary group/card">
                    <div className="p-6">
                      <div className="flex gap-5 items-start mb-6">
                        <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-xl transition-transform group-hover/card:scale-105">
                          <Phone size={24} className="text-white fill-white/20" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-none text-[10px] font-black uppercase tracking-widest border ${call.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100' :
                                call.priority === 'Medium' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                  'bg-green-50 text-green-600 border-green-100'
                                }`}>
                                {call.priority || 'Low'} Priority
                              </div>
                              <div className="flex items-center gap-1.5 text-[12px] font-bold text-blue-600">
                                <Calendar size={12} /> {call.date}
                              </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
                              <button onClick={(e) => { e.stopPropagation(); onDeleteClick('call', call.id); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-none shadow-sm bg-white border border-gray-50">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Call Status:</span>
                            <span className={`text-[13px] font-bold ${call.status === 'Busy' ? 'text-red-600' :
                              call.status === 'No Answer' ? 'text-purple-600' :
                                'text-green-600'
                              }`}>{call.status}</span>
                          </div>
                          {call.content && call.content !== "No notes" && (
                            <div className="mt-4 bg-slate-50 border border-slate-100 p-3 rounded-none relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-1 h-full bg-blue-400"></div>
                              <div className="flex items-center gap-1.5 mb-1.5 pl-1">
                                <FileText size={12} className="text-slate-400" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Call Note</span>
                              </div>
                              <p className="text-[13px] font-bold text-slate-700 whitespace-pre-wrap break-words leading-relaxed pl-1">
                                {call.content}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Details Box - Reusing Meeting's Location Box style */}
                      {call.nextFollowUp && (
                        <div className="mb-6 p-4 bg-slate-50/80 border border-slate-100 rounded-none mx-6 group-hover/card:border-blue-200 transition-colors flex flex-wrap gap-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-none flex items-center justify-center shadow-sm">
                              <CalendarClock size={18} />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Next Follow-up</p>
                              <p className="text-[13px] font-black text-slate-700">
                                {new Date(call.nextFollowUp).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-5 border-t border-gray-100">
                        <div className="flex items-center gap-8">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest font-primary">Logged By</span>
                            <div className="flex items-center gap-2">
                              <UserAvatar name={call.author} profilePicture={call.profilePicture} size="w-7 h-7" />
                              <span className="text-[12px] font-bold text-slate-700 capitalize">{call.author}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case "files":
        return (
          <div className="flex-1 bg-[#F9FBFC] overflow-auto animate-fadeIn min-h-[500px]">
            <TabHeader title="Files" showSort={false} />
            <div className="p-6 space-y-4">
              {/* Manage Documents Hero Card */}
              <div className="bg-white rounded-none border border-gray-100 p-6 flex justify-between items-center shadow-sm">
                <div>
                  <h3 className="text-[16px] font-bold text-gray-800 font-primary mb-1">Manage Documents</h3>
                  <p className="text-[13px] text-gray-400 font-medium font-primary">Send customizable quotes, proposals and contracts to close deals faster.</p>
                </div>
                <button
                  disabled={isDisabled}
                  onClick={() => !isDisabled && onAddClick('file')}
                  className={`px-6 py-2.5 rounded-none transition-all font-bold text-[13px] font-primary shadow-lg active:scale-95 ${isDisabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' : 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/20'}`}
                >
                  Create Document
                </button>
              </div>

              {filesLoading ? (
                <div className="text-center py-20">
                  <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-none border-2 border-dashed border-gray-200 mx-6">
                  <File size={48} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-gray-400 font-bold font-primary text-sm">No files uploaded yet</p>
                </div>
              ) : (
                files.map((file) => (
                  <div key={file.id} className="bg-white rounded-none border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 cursor-pointer transition-all overflow-hidden font-primary group/card">
                    <div className="p-5">
                      <div className="flex gap-5 items-start ">
                        <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg transition-transform group-hover/card:scale-105">
                          <FileText size={24} className="text-orange-600 fill-orange-600/10" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-600 rounded-none text-[10px] font-black uppercase tracking-widest border border-orange-100">
                                Document
                              </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
                              <button onClick={(e) => {
                                e.stopPropagation();
                                let path = file.originalData?.file_path || file.originalData?.path;
                                onDownloadClick(path, file.title);
                              }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-none transition-colors border border-transparent hover:border-blue-100 bg-white shadow-sm">
                                <Download size={16} />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); onEditClick('file', file.originalData); }} className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-none transition-colors border border-transparent hover:border-orange-100 bg-white shadow-sm">
                                <Edit2 size={16} />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); onDeleteClick('file', file.id); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-none transition-colors border border-transparent hover:border-red-100 bg-white shadow-sm">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          <h4 className="font-bold text-gray-800 font-primary text-[17px] capitalize tracking-tight group-hover/card:text-orange-600 transition-colors mb-1">
                            {file.title}
                          </h4>
                          <div className="text-[14px] text-gray-500 font-medium leading-relaxed italic">
                            <ExpandableText text={file.description} limit={200} />
                          </div>

                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest font-primary">Owner :</span>
                            <div className="flex items-center gap-2 bg-slate-50/80 px-2 py-1 rounded-none border border-slate-100 transition-colors group-hover/card:bg-orange-50/50 group-hover/card:border-orange-100">
                              <UserAvatar name={file.owner} profilePicture={file.profilePicture} size="w-6 h-6 border-white shadow-sm" />
                              <span className="text-[12px] font-bold text-slate-700 capitalize">{file.owner}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case "meetings":
        return (
          <div className="flex-1 bg-[#F9FBFC] overflow-auto animate-fadeIn min-h-[500px]">
            <TabHeader title="Scheduled Meetings" showAdd={true} addLabel="New Meeting" addType="meeting" showSort={false} />
            <div className="p-6 space-y-4">
              {meetingsLoading ? (
                <div className="text-center py-20">
                  <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                </div>
              ) : meetings.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-none border-2 border-dashed border-gray-200 mx-6">
                  <Video size={48} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-gray-400 font-bold font-primary text-sm">No upcoming meetings</p>
                </div>
              ) : (
                meetings.map((meeting) => (
                  <div key={meeting.id} className="bg-white rounded-none border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 cursor-pointer transition-all overflow-hidden font-primary group/card">
                    <div className="p-6">
                      <div className="flex gap-5 items-start mb-6">
                        <div className="w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-xl transition-transform group-hover/card:scale-105">
                          <Users size={24} className="text-white fill-white/20" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-600 rounded-none text-[10px] font-black uppercase tracking-widest border border-purple-100">
                                {meeting.meeting_type === 'Online' ? <Video size={12} className="fill-purple-600/10" /> : <MapPin size={12} className="fill-purple-600/10" />}
                                {meeting.meeting_type}
                              </div>
                              <div className="flex items-center gap-1.5 text-[12px] font-bold text-purple-600">
                                <Calendar size={12} /> {meeting.date}
                              </div>
                              <div className="flex items-center gap-1.5 text-[12px] font-bold text-purple-600">
                                <Clock size={12} /> {meeting.time}
                              </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
                              <button onClick={(e) => { e.stopPropagation(); onEditClick('meeting', meeting.originalData); }} className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-none">
                                <Edit2 size={16} />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); onDeleteClick('meeting', meeting.id); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-none">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          <h4 className="font-semibold text-[#1E293B] text-[17px] leading-tight mb-2" title={meeting.title}>
                            Meeting With <span className="capitalize">{meeting.title?.length > 60 ? meeting.title.substring(0, 60) + "..." : meeting.title}</span>
                          </h4>
                          <div className="text-[14px] text-gray-500 font-medium leading-relaxed">
                            <ExpandableText text={meeting.description} limit={250} />
                          </div>
                        </div>
                      </div>

                      {/* Location Box */}
                      <div className="mb-6 p-4 bg-slate-50/80 border border-slate-100 rounded-none mx-6 flex items-start gap-4 transition-colors group-hover/card:border-purple-200">
                        <div className={`w-10 h-10 rounded-none flex items-center justify-center flex-shrink-0 shadow-sm ${meeting.meeting_type === 'Online' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                          {meeting.meeting_type === 'Online' ? <Video size={18} /> : <MapPin size={18} />}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${meeting.meeting_type === 'Online' ? 'text-blue-500' : 'text-orange-500'}`}>
                            {meeting.meeting_type === 'Online' ? 'Meeting Link' : 'Location Address'}
                          </p>
                          {meeting.meeting_type === 'Online' ? (
                            meeting.meeting_link ? (
                              <a href={meeting.meeting_link.startsWith('http') ? meeting.meeting_link : `https://${meeting.meeting_link}`} target="_blank" rel="noopener noreferrer" className="text-[13px] font-bold text-gray-700 hover:text-blue-600 underline truncate block" onClick={(e) => e.stopPropagation()}>
                                {meeting.meeting_link}
                              </a>
                            ) : <p className="text-[13px] font-bold text-gray-400 italic">No link provided</p>
                          ) : (
                            <div className="text-[13px] font-bold text-gray-700 leading-snug">
                              {meeting.address_line1 || meeting.city ? (
                                <>
                                  <p>{[meeting.address_line1, meeting.address_line2].filter(Boolean).join(', ')}</p>
                                  <p className="text-gray-500">{[meeting.city, meeting.state, meeting.pincode].filter(Boolean).join(', ')}</p>
                                </>
                              ) : <p className="text-gray-400 italic">No address provided</p>}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-5 border-t border-gray-100">
                        <div className="flex items-center gap-8">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest font-primary">Hosted By</span>
                            <div className="flex items-center gap-2">
                              <UserAvatar name={meeting.host} profilePicture={meeting.profilePicture} size="w-7 h-7" />
                              <span className="text-[12px] font-bold text-slate-700 capitalize">{meeting.host}</span>
                            </div>
                          </div>
                          {meeting.attendees?.length > 0 && (
                            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                              <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest font-primary">Participants</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPartModal({ show: true, attendees: meeting.attendees });
                                }}
                                className="flex items-center -space-x-2 overflow-x-auto no-scrollbar hover:bg-slate-100 p-1 rounded-full transition-colors w-full"
                              >
                                {meeting.attendees.map((at, i) => (
                                  <UserAvatar key={i} name={typeof at === 'string' ? at : at.name} size="w-7 h-7 border-2 border-white shadow-sm flex-shrink-0" />
                                ))}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case "email":
        return (
          <div className="flex-1 bg-[#F9FBFC] overflow-auto animate-fadeIn min-h-[500px]">
            <TabHeader title="Email" showSort={false} />
            <div className="p-6">
              <div className="bg-white rounded-none border border-gray-100 p-8 flex justify-between items-center shadow-sm">
                <div>
                  <h3 className="text-[18px] font-bold text-gray-800 font-primary mb-2">Manage Emails</h3>
                  <p className="text-[14px] text-gray-400 font-medium font-primary">You can send and reply to emails directly via this section.</p>
                </div>
                <button
                  disabled={isDisabled}
                  className={`px-6 py-2.5 rounded-none transition-all font-bold text-[13px] font-primary shadow-lg active:scale-95 ${isDisabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' : 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/20'}`}
                >
                  Connect Account
                </button>
              </div>
            </div>
          </div>
        );

      case "whatsapp":
        return (
          <div className="flex-1 bg-[#F9FBFC] overflow-auto animate-fadeIn min-h-[500px]">
            <TabHeader title="WhatsApp Messenger" showSort={false} />
            <div className="p-6">
              <div className="bg-white rounded-none border border-gray-100 p-12 flex flex-col items-center text-center shadow-sm">
                <div className="w-20 h-20 bg-[#25D366] rounded-full flex items-center justify-center mb-6 shadow-lg shadow-[#25D366]/20">
                  <FaWhatsapp size={40} className="text-white" />
                </div>
                <h3 className="text-[20px] font-bold text-gray-800 font-primary mb-3">WhatsApp Messenger</h3>
                <p className="text-[15px] text-gray-400 font-medium font-primary max-w-md mx-auto mb-8">Send approved templates, dynamic messages, and track conversations directly within the lead profile.</p>
                <div className="flex gap-4">
                  <button
                    disabled={isDisabled}
                    onClick={() => setShowWhatsAppModal(true)}
                    className={`px-10 py-3.5 rounded-none transition-all font-bold text-[14px] font-primary shadow-lg active:scale-95 flex items-center gap-2 ${isDisabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' : 'bg-[#25D366] text-white hover:bg-[#128C7E] shadow-[#25D366]/20'}`}
                  >
                    <FaWhatsapp size={18} />
                    Send Template Message
                  </button>
                  <button
                    disabled={isDisabled}
                    className={`px-6 py-3.5 rounded-none transition-all font-bold text-[14px] font-primary border border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Connect WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex-1 flex flex-col items-center justify-center py-20 bg-[#F9FBFC]">
            <Zap size={48} className="text-gray-100 mb-4" />
            <p className="text-gray-400 font-bold font-primary capitalize tracking-wide text-sm">Design update in progress for {activeTab}</p>
          </div>
        );
    }
  };

  return (
    <div className={isDisabled ? "opacity-60 pointer-events-none select-none transition-opacity duration-300" : "transition-opacity duration-300"}>
      {renderTabContent()}
      <ParticipantsModal />
    </div>
  );
}

