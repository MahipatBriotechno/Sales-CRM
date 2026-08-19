import React, { useState, useMemo } from "react";
import { FiHome } from "react-icons/fi";
import {
    Calendar,
    Clock,
    Plus,
    Search,
    Filter,
    X,
    Video,
    MapPin,
    Trash2,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Users,
    FileText,
    Download,
    Eye,
    Pencil,
    User,
    Link2,
    AlertCircle,
    SquarePen,
    AlignLeft,
    BellRing
} from "lucide-react";
import { toast } from "react-hot-toast";
import DashboardLayout from "../../components/DashboardLayout";
import NumberCard from "../../components/NumberCard";
import AddMeetingModal from "../../components/LeadManagement/LeadPipLineStatus/AddMeetingModal";
import Modal from "../../components/common/Modal";
import ActionGuard from "../../components/common/ActionGuard";
import {
    useGetMeetingsQuery,
    useCreateMeetingMutation,
    useUpdateMeetingMutation,
    useDeleteMeetingMutation
} from "../../store/api/meetingApi";
import { useGetEmployeesQuery } from "../../store/api/employeeApi";

const AllMeetings = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [meetingTypeFilter, setMeetingTypeFilter] = useState("All");
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [viewMeeting, setViewMeeting] = useState(null);
    const [meetingToDelete, setMeetingToDelete] = useState(null);

    const itemsPerPage = 8;

    // API Calls
    const { data: meetings = [], isLoading, refetch } = useGetMeetingsQuery({
        type: meetingTypeFilter === "All" ? "" : meetingTypeFilter
    });

    const { data: employeesData } = useGetEmployeesQuery({ limit: 1000, status: 'All' });
    const employees = employeesData?.employees || [];

    const [createMeeting] = useCreateMeetingMutation();
    const [updateMeeting] = useUpdateMeetingMutation();
    const [deleteMeeting, { isLoading: isDeleting }] = useDeleteMeetingMutation();

    const handleSaveMeeting = async (meetingData) => {
        try {
            if (selectedMeeting) {
                await updateMeeting({ id: selectedMeeting.id, ...meetingData }).unwrap();
                toast.success("Meeting updated successfully");
            } else {
                await createMeeting(meetingData).unwrap();
                toast.success("Meeting scheduled successfully");
            }
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
            setSelectedMeeting(null);
            refetch();
        } catch (error) {
            toast.error(error.data?.message || "Failed to save meeting");
        }
    };

    const confirmDelete = (meeting) => {
        setMeetingToDelete(meeting);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteMeeting = async () => {
        if (!meetingToDelete) return;
        try {
            await deleteMeeting(meetingToDelete.id).unwrap();
            toast.success("Meeting deleted successfully");
            setIsDeleteModalOpen(false);
            setMeetingToDelete(null);
            refetch();
        } catch (error) {
            toast.error("Failed to delete meeting");
        }
    };

    const filteredMeetings = useMemo(() => {
        return meetings.filter(m =>
            m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (m.lead_name && m.lead_name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [meetings, searchTerm]);

    const totalPages = Math.ceil(filteredMeetings.length / itemsPerPage);
    const currentItems = filteredMeetings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    // Utility to format time to 12h clock
    const formatTime12h = (timeStr) => {
        if (!timeStr) return "";
        try {
            const [hours, minutes] = timeStr.split(':');
            let h = parseInt(hours);
            const m = minutes;
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12;
            h = h ? h : 12; // the hour '0' should be '12'
            return `${h}:${m} ${ampm}`;
        } catch (e) {
            return timeStr;
        }
    };

    // Filtered Stats
    const stats = {
        total: meetings.length,
        today: meetings.filter(m => {
            const today = new Date().toISOString().split('T')[0];
            const meetingDate = m.meeting_date ? new Date(m.meeting_date).toISOString().split('T')[0] : "";
            return meetingDate === today;
        }).length,
        online: meetings.filter(m => m.meeting_type === "Online").length,
        offline: meetings.filter(m => m.meeting_type === "Offline").length
    };

    const hasActiveFilters = searchTerm || meetingTypeFilter !== "All";

    const clearAllFilters = () => {
        setSearchTerm("");
        setMeetingTypeFilter("All");
        setCurrentPage(1);
    };

    // Helper to get attendee names
    const getAttendeeNames = (attendeesJson) => {
        try {
            const list = Array.isArray(attendeesJson) ? attendeesJson : JSON.parse(attendeesJson || '[]');
            return list.map(email => {
                const emp = employees.find(e => e.email === email);
                return emp ? emp.employee_name : email;
            });
        } catch { return []; }
    };

    // View Modal Footer
    const viewModalFooter = (
        <div className="flex gap-3">
            <button
                onClick={() => {
                    setIsViewModalOpen(false);
                    setSelectedMeeting(viewMeeting);
                    setIsEditModalOpen(true);
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-sm bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-sm hover:shadow-lg transition-all"
            >
                <Pencil size={16} /> Edit Meeting
            </button>
            <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-6 py-2.5 rounded-sm border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-all"
            >
                Close
            </button>
        </div>
    );

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gradient-to-br from-orange-0 via-white to-orange-100 font-primary">
                {/* Sticky Header */}
                <div className="bg-white sticky top-0 z-30">
                    <div className="max-w-8xl mx-auto px-4 py-4 border-b">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                                    Meeting Management
                                </h1>
                                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                    <FiHome className="text-gray-700" size={14} />
                                    <span className="text-gray-400">/</span> Additional /{" "}
                                    <span className="text-[#FF7B1D] font-medium">All Meetings</span>
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative">
                                    <button
                                        onClick={() => {
                                            if (hasActiveFilters) {
                                                clearAllFilters();
                                            } else {
                                                setIsFilterOpen(!isFilterOpen);
                                            }
                                        }}
                                        className={`px-3 py-3 rounded-sm border transition shadow-sm ${isFilterOpen || hasActiveFilters
                                            ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-[#FF7B1D]"
                                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                                            }`}
                                    >
                                        {hasActiveFilters ? <X size={18} /> : <Filter size={18} />}
                                    </button>

                                    {isFilterOpen && (
                                        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-sm shadow-2xl z-50 animate-fadeIn p-4">
                                            <div className="space-y-4">
                                                <div className="relative mb-3">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                                                    <input
                                                        type="text"
                                                        placeholder="Search meetings..."
                                                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-sm focus:border-[#FF7B1D] outline-none text-xs font-semibold"
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                    />
                                                </div>
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Meeting Type</h4>
                                                <div className="flex flex-col gap-2">
                                                    {["All", "Online", "Offline"].map((type) => (
                                                        <label key={type} className="flex items-center group cursor-pointer">
                                                            <input
                                                                type="radio"
                                                                checked={meetingTypeFilter === type}
                                                                onChange={() => {
                                                                    setMeetingTypeFilter(type);
                                                                    setIsFilterOpen(false);
                                                                }}
                                                                className="peer h-4 w-4 cursor-pointer appearance-none rounded-full border-2 border-gray-200 transition-all checked:border-[#FF7B1D] checked:border-[5px] hover:border-orange-300"
                                                            />
                                                            <span className={`ml-3 text-xs font-medium transition-colors ${meetingTypeFilter === type ? "text-[#FF7B1D] font-bold" : "text-gray-600 group-hover:text-gray-900"}`}>
                                                                {type}
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <ActionGuard permission="meeting_create" module="Meeting Management" type="create">
                                    <button
                                        onClick={() => {
                                            setSelectedMeeting(null);
                                            setIsAddModalOpen(true);
                                        }}
                                        className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-sm hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 font-semibold text-sm"
                                    >
                                        <Plus size={20} />
                                        Schedule Meeting
                                    </button>
                                </ActionGuard>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-8xl mx-auto p-4 pt-0 mt-2">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                        <NumberCard
                            title={"Total Meetings"}
                            number={stats.total}
                            icon={<Calendar className="text-blue-600" size={24} />}
                            iconBgColor={"bg-blue-100"}
                            lineBorderClass={"border-blue-500"}
                        />
                        <NumberCard
                            title={"Today's Meetings"}
                            number={stats.today}
                            icon={<Clock className="text-orange-600" size={24} />}
                            iconBgColor={"bg-orange-100"}
                            lineBorderClass={"border-orange-500"}
                        />
                        <NumberCard
                            title={"Online Meetings"}
                            number={stats.online}
                            icon={<Video className="text-purple-600" size={24} />}
                            iconBgColor={"bg-purple-100"}
                            lineBorderClass={"border-purple-500"}
                        />
                        <NumberCard
                            title={"Offline Meetings"}
                            number={stats.offline}
                            icon={<MapPin className="text-green-600" size={24} />}
                            iconBgColor={"bg-green-100"}
                            lineBorderClass={"border-green-500"}
                        />
                    </div>

                    {/* Table View */}
                    <div className="bg-white rounded-sm shadow-sm overflow-hidden border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left">
                                <thead>
                                    <tr className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm tracking-wide">
                                        <th className="py-4 px-4 font-bold text-left">Meeting Title</th>
                                        <th className="py-4 px-4 font-bold text-left">Lead/Participant</th>
                                        <th className="py-4 px-4 font-bold text-left">Date & Time</th>
                                        <th className="py-4 px-4 font-bold text-center">Type</th>
                                        <th className="py-4 px-4 font-bold text-left">Location/Link</th>
                                        <th className="py-4 px-4 font-bold text-right w-[120px]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {isLoading ? (
                                        [1, 2, 3].map((i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td colSpan="6" className="px-6 py-8">
                                                    <div className="h-4 bg-gray-100 rounded-full w-full"></div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : currentItems.length > 0 ? (
                                        currentItems.map((meeting) => (
                                            <tr key={meeting.id} className="hover:bg-gray-50 transition-all group">
                                                <td className="px-4 py-2.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-sm flex items-center justify-center ${meeting.meeting_type === 'Online' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                                                            <Users size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-base text-gray-900">{meeting.title}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <div className="flex flex-col gap-1.5">
                                                        {meeting.lead_name && (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-orange-500" />
                                                                <p className="text-sm font-bold text-gray-700">{meeting.lead_name}</p>
                                                            </div>
                                                        )}
                                                        {(() => {
                                                            const attendees = getAttendeeNames(meeting.attendees);
                                                            if (attendees.length > 0) {
                                                                return (
                                                                    <div className="flex items-center gap-2">
                                                                        {meeting.lead_name && <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">With:</span>}
                                                                        <div className="flex -space-x-1.5">
                                                                            {attendees.slice(0, 3).map((name, i) => (
                                                                                <div
                                                                                    key={i}
                                                                                    title={name}
                                                                                    className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 border border-white flex items-center justify-center text-[10px] font-bold shadow-sm ring-1 ring-inset ring-indigo-100"
                                                                                    style={{ zIndex: 10 - i }}
                                                                                >
                                                                                    {name[0]?.toUpperCase() || '?'}
                                                                                </div>
                                                                            ))}
                                                                            {attendees.length > 3 && (
                                                                                <div className="w-6 h-6 rounded-full bg-gray-50 text-gray-600 border border-white flex items-center justify-center text-[10px] font-bold shadow-sm ring-1 ring-inset ring-gray-200 z-0">
                                                                                    +{attendees.length - 3}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }
                                                            return !meeting.lead_name ? <div className="text-gray-400 font-bold pl-2">-</div> : null;
                                                        })()}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5 whitespace-nowrap">
                                                    <div className="flex items-center gap-3 text-[14px] font-medium text-gray-700">
                                                        <Calendar size={18} className="text-orange-500 shrink-0" />
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-gray-800 font-semibold">{new Date(meeting.meeting_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                            <span className="text-[13px] text-orange-600 font-bold uppercase bg-orange-50 px-2 py-0.5 rounded-sm border border-orange-100">{formatTime12h(meeting.meeting_time)}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs font-bold border ${meeting.meeting_type === 'Online'
                                                        ? 'bg-blue-50 text-blue-700 border-blue-100'
                                                        : 'bg-green-50 text-green-700 border-green-100'
                                                        }`}>
                                                        {meeting.meeting_type === 'Online' ? <Video size={14} /> : <MapPin size={14} />}
                                                        {meeting.meeting_type}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    {meeting.meeting_type === 'Online' ? (
                                                        <a
                                                            href={meeting.meeting_link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-sm text-[#FF7B1D] hover:underline font-bold"
                                                        >
                                                            Join Meeting <ExternalLink size={14} />
                                                        </a>
                                                    ) : (
                                                        <p className="text-sm text-gray-600 font-medium truncate max-w-[150px]">
                                                            {meeting.city}, {meeting.state}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2.5 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {/* View */}
                                                        <ActionGuard permission="meeting_view" module="Meeting Management" type="read">
                                                            <button
                                                                onClick={() => { setViewMeeting(meeting); setIsViewModalOpen(true); }}
                                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-sm transition-all"
                                                                title="View Details"
                                                            >
                                                                <Eye size={18} />
                                                            </button>
                                                        </ActionGuard>
                                                        {/* Edit */}
                                                        <ActionGuard permission="meeting_edit" module="Meeting Management" type="update">
                                                            <button
                                                                onClick={() => { setSelectedMeeting(meeting); setIsEditModalOpen(true); }}
                                                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-sm transition-all"
                                                                title="Edit Meeting"
                                                            >
                                                                <SquarePen size={18} />
                                                            </button>
                                                        </ActionGuard>
                                                        {/* Delete */}
                                                        <ActionGuard permission="meeting_delete" module="Meeting Management" type="delete">
                                                            <button
                                                                onClick={() => confirmDelete(meeting)}
                                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-sm transition-all"
                                                                title="Delete Meeting"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </ActionGuard>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center justify-center text-gray-400">
                                                    <Calendar size={64} strokeWidth={1} className="mb-4 text-gray-200" />
                                                    <p className="text-lg font-bold">No Meetings Found</p>
                                                    <p className="text-xs">Schedule your first meeting to get started.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Pagination Section (Global for Grid/List) */}
                <div className="max-w-8xl mx-auto px-4 pb-6 mt-4">
                    <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4 bg-gray-50 p-4 rounded-sm border border-gray-200 shadow-sm">
                        <p className="text-sm font-semibold text-gray-700">
                            Showing <span className="text-orange-600">{filteredMeetings.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-orange-600">{Math.min(currentPage * itemsPerPage, filteredMeetings.length)}</span> of <span className="text-orange-600">{filteredMeetings.length}</span> Meetings
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className={`px-4 py-2 rounded-sm font-bold transition flex items-center gap-1 ${currentPage === 1 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"}`}
                            >
                                Previous
                            </button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.max(totalPages, 1) }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-10 h-10 rounded-sm font-bold transition ${currentPage === page ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md border-orange-500 text-xs" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs"}`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setCurrentPage(next => Math.min(next + 1, totalPages))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className={`px-4 py-2 rounded-sm font-bold transition flex items-center gap-1 ${currentPage === totalPages || totalPages === 0 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"}`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                headerVariant="simple"
                maxWidth="max-w-md"
                footer={
                    <div className="flex gap-4 w-full">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 font-bold rounded-sm hover:bg-gray-100 transition-all font-primary text-xs uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDeleteMeeting}
                            disabled={isDeleting}
                            className="flex-1 px-6 py-3 bg-red-600 text-white font-bold rounded-sm hover:bg-red-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 font-primary text-xs uppercase tracking-widest"
                        >
                            {isDeleting ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Trash2 size={20} />
                            )}
                            {isDeleting ? "Deleting..." : "Delete Now"}
                        </button>
                    </div>
                }
            >
                <div className="flex flex-col items-center text-center text-black font-primary">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                        <AlertCircle size={48} className="text-red-600" />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        Confirm Delete
                    </h2>

                    <p className="text-gray-600 mb-2 leading-relaxed">
                        Are you sure you want to delete the meeting{" "}
                        <span className="font-bold text-gray-800">"{meetingToDelete?.title}"</span>?
                    </p>

                    <p className="text-xs text-red-500 italic">
                        This action cannot be undone. All associated data will be permanently removed.
                    </p>
                </div>
            </Modal>

            {/* View Meeting Modal */}
            {isViewModalOpen && viewMeeting && (
                <Modal
                    isOpen={isViewModalOpen}
                    onClose={() => setIsViewModalOpen(false)}
                    title={viewMeeting.title?.length > 40 ? `${viewMeeting.title.substring(0, 40)}...` : viewMeeting.title}
                    subtitle="Meeting Details"
                    icon={<Users size={24} />}
                    footer={viewModalFooter}
                    maxWidth="max-w-2xl"
                >
                    <div className="space-y-5 px-1 py-2">
                        {/* Type Badge */}
                        <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-black uppercase tracking-wider border ${viewMeeting.meeting_type === 'Online' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                                {viewMeeting.meeting_type === 'Online' ? <Video size={12} /> : <MapPin size={12} />}
                                {viewMeeting.meeting_type}
                            </span>
                            {viewMeeting.lead_name && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
                                    <User size={12} /> {viewMeeting.lead_name}
                                </span>
                            )}
                        </div>

                        {/* Date & Time */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-sm border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                    <Calendar size={11} className="text-[#FF7B1D]" /> Date
                                </p>
                                <p className="text-sm font-bold text-gray-800">
                                    {new Date(viewMeeting.meeting_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-sm border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                    <Clock size={11} className="text-[#FF7B1D]" /> Time
                                </p>
                                <p className="text-sm font-bold text-gray-800">{viewMeeting.meeting_time}</p>
                            </div>
                        </div>

                        {/* Location / Link */}
                        <div className="p-4 bg-gray-50 rounded-sm border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                {viewMeeting.meeting_type === 'Online' ? <Link2 size={11} className="text-[#FF7B1D]" /> : <MapPin size={11} className="text-[#FF7B1D]" />}
                                {viewMeeting.meeting_type === 'Online' ? 'Meeting Link' : 'Location'}
                            </p>
                            {viewMeeting.meeting_type === 'Online' ? (
                                <a href={viewMeeting.meeting_link} target="_blank" rel="noopener noreferrer"
                                    className="text-sm font-bold text-[#FF7B1D] hover:underline break-all">
                                    {viewMeeting.meeting_link || 'N/A'}
                                </a>
                            ) : (
                                <p className="text-sm font-bold text-gray-800">
                                    {[viewMeeting.address, viewMeeting.city, viewMeeting.state].filter(Boolean).join(', ') || 'N/A'}
                                </p>
                            )}
                        </div>

                        {/* Attendees */}
                        {viewMeeting.attendees && (
                            <div className="p-4 bg-gray-50 rounded-sm border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                    <Users size={11} className="text-[#FF7B1D]" /> Attendees
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {getAttendeeNames(viewMeeting.attendees).map((name, i) => (
                                        <span key={i} className="px-2.5 py-1 bg-orange-50 border border-orange-100 text-orange-700 text-xs font-bold rounded-sm">
                                            {name}
                                        </span>
                                    ))}
                                    {getAttendeeNames(viewMeeting.attendees).length === 0 && (
                                        <span className="text-xs text-gray-400 italic">No attendees specified</span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        {viewMeeting.description && (
                            <div className="p-4 bg-gray-50 rounded-sm border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <AlignLeft size={11} className="text-[#FF7B1D]" /> Description / Agenda
                                </p>
                                <p className="text-sm text-gray-700 font-medium leading-relaxed">{viewMeeting.description}</p>
                            </div>
                        )}

                        {/* Reminder */}
                        {viewMeeting.reminder_minutes && (
                            <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-100 rounded-sm">
                                <BellRing size={16} className="text-[#FF7B1D]" />
                                <p className="text-xs font-bold text-orange-700">
                                    Reminder set for {viewMeeting.reminder_minutes} minutes before
                                </p>
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            {/* Add / Edit Modal */}
            <AddMeetingModal
                open={isAddModalOpen || isEditModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                    setSelectedMeeting(null);
                }}
                onSave={handleSaveMeeting}
                editData={selectedMeeting}
                employees={employees}
            />
        </DashboardLayout>
    );
};

export default AllMeetings;
