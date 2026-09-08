import React, { useState, useEffect } from "react";
import Modal from "../common/Modal";
import { Phone, PhoneOff, Calendar, Trash2, X, Check, Loader2, AlertCircle, Clock, FileText, Zap } from "lucide-react";
import { useCheckCallConflictQuery } from "../../store/api/leadApi";
import { toast } from "react-hot-toast";

export default function CallActionPopup({ isOpen, onClose, lead, onHitCall, initialResponse, rules, onConnectedSelect }) {
    const [step, setStep] = useState(1);
    const [response, setResponse] = useState("");
    const [finalAction, setFinalAction] = useState("");
    const [nextCallAt, setNextCallAt] = useState("");
    const [dropReason, setDropReason] = useState("");
    const [notConnectedReason, setNotConnectedReason] = useState("");
    const [remarks, setRemarks] = useState("");
    const [priority, setPriority] = useState("Medium");
    const [durationMin, setDurationMin] = useState("");
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");
    const [activeDateShortcut, setActiveDateShortcut] = useState("Today");
    const [activeTimeShortcut, setActiveTimeShortcut] = useState("+30 Mins");

    const notConnectedStatuses = [
        "Busy", "No Answer", "Switched Off", "Out of Coverage", "Invalid Number",
        "Call Not Picked", "Call Failed", "Number Not Reachable", "Number Does Not Exist",
        "Voicemail Reached", "Call Dropped", "Poor Network", "Network Issue", "Call Rejected",
        "Customer Disconnected", "Call Blocked", "Do Not Disturb (DND) Active", "Not Interested",
        "Asked to Call Later", "Customer in Meeting", "Customer Driving", "Outside Working Hours",
        "Language Barrier", "Technical Error"
    ];

    const dateShortcuts = [
        { label: "Today", days: 0 },
        { label: "Tomorrow", days: 1 },
        { label: "+2 Days", days: 2 },
        { label: "+1 Week", days: 7 },
    ];

    const timeShortcuts = [
        { label: "+15 Mins", value: 15, unit: "minute" },
        { label: "+30 Mins", value: 30, unit: "minute" },
        { label: "+1 Hour", value: 1, unit: "hour" },
        { label: "+2 Hours", value: 2, unit: "hour" },
    ];

    const getIsoNextCall = () => {
        if (!nextCallAt) return "";
        try {
            const d = new Date(nextCallAt);
            return isNaN(d.getTime()) ? "" : d.toISOString();
        } catch (e) { return ""; }
    };

    const { data: conflicts } = useCheckCallConflictQuery(
        { dateTime: getIsoNextCall(), excludeId: lead?.id },
        { skip: !nextCallAt || finalAction !== "follow_up" || !isOpen }
    );

    const formatDateTime = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${mins}`;
    };

    const handleDateShortcut = (sc) => {
        const base = new Date();
        base.setDate(base.getDate() + sc.days);
        const newDate = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}-${String(base.getDate()).padStart(2, '0')}`;
        const time = selectedTime || formatDateTime(new Date()).split('T')[1];
        setNextCallAt(`${newDate}T${time}`);
        setActiveDateShortcut(sc.label);
    };

    const handleTimeShortcut = (sc) => {
        const now = new Date();
        if (sc.unit === "minute") now.setMinutes(now.getMinutes() + sc.value);
        else if (sc.unit === "hour") now.setHours(now.getHours() + sc.value);
        const newTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const date = selectedDate || formatDateTime(new Date()).split('T')[0];
        setNextCallAt(`${date}T${newTime}`);
        setActiveTimeShortcut(sc.label);
    };

    useEffect(() => {
        if (nextCallAt) {
            const [date, time] = nextCallAt.split('T');
            setSelectedDate(date || "");
            setSelectedTime(time || "");
        } else {
            setSelectedDate("");
            setSelectedTime("");
        }
    }, [nextCallAt]);

    const handleDateChange = (date) => {
        const time = selectedTime || "09:00";
        setNextCallAt(`${date}T${time}`);
        setActiveDateShortcut("");
    };

    const handleTimeChange = (time) => {
        const date = selectedDate || formatDateTime(new Date()).split('T')[0];
        setNextCallAt(`${date}T${time}`);
        setActiveTimeShortcut("");
    };

    useEffect(() => {
        const autoConnected = lead?.tag === "Follow Up" || lead?.tag === "Missed";
        const effectiveResponse = initialResponse || (autoConnected ? "connected" : "");

        if (effectiveResponse) {
            setResponse(effectiveResponse);
            setStep(2);
            setFinalAction("follow_up");
            const now = new Date();
            now.setMinutes(now.getMinutes() + 30);
            setNextCallAt(formatDateTime(now));
            setActiveDateShortcut("Today");
            setActiveTimeShortcut("+30 Mins");
        } else {
            setStep(1);
            setResponse("");
            setFinalAction("");
            setNextCallAt("");
            setActiveDateShortcut("Today");
            setActiveTimeShortcut("+30 Mins");
            setNotConnectedReason("");
            setRemarks("");
        }
    }, [initialResponse, isOpen, rules, lead?.tag]);

    const handleInitialAction = (type) => {
        if (type === "connected" && onConnectedSelect) { onConnectedSelect(); return; }
        setResponse(type);
        setStep(2);
        setFinalAction("follow_up");
        setPriority(lead?.priority || "Medium");
        const now = new Date();
        now.setMinutes(now.getMinutes() + 30);
        setNextCallAt(formatDateTime(now));
        setActiveDateShortcut("Today");
        setActiveTimeShortcut("+30 Mins");
    };

    const submitCall = async (data) => {
        setLoading(true);
        try {
            await onHitCall({
                id: lead.id,
                response,
                create_reminder: false,
                not_connected_reason: response === "not_connected" ? notConnectedReason : null,
                remarks,
                ...data
            });
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFinalSubmit = () => {
        if (response === "not_connected" && !notConnectedReason)
            return toast.error("Please select why the call was not connected");
        if (response === "connected") {
            if (!remarks) return toast.error("Please provide a call summary");
            if (!nextCallAt) return toast.error("Please select next follow-up date/time");
            if (!priority) return toast.error("Please select a priority");
        }
        if (finalAction === "follow_up") {
            if (!nextCallAt) return toast.error("Please select next call date/time");
            if (new Date(nextCallAt) < new Date()) return toast.error("Next call cannot be in the past");
            submitCall({
                status: response || "follow_up",
                next_call_at: new Date(nextCallAt).toISOString(),
                priority,
                duration: parseInt(durationMin) || 0,
                tag: response === "connected" ? "Follow Up" : "Not Connected"
            });
        } else if (finalAction === "drop") {
            if (!dropReason) return toast.error("Please provide a reason for dropping");
            submitCall({ status: "dropped", drop_reason: dropReason });
        }
    };

    const footer = (
        <div className="flex gap-3 w-full">
            {step === 1 ? (
                <button onClick={onClose} className="flex-1 py-2.5 rounded-sm border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-all font-primary text-sm flex items-center justify-center gap-2">
                    <X size={18} /> Close Window
                </button>
            ) : (
                <>
                    <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-sm border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-all font-primary text-sm">
                        Back
                    </button>
                    <button onClick={handleFinalSubmit} disabled={loading} className="flex-[2] py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-sm font-bold shadow-md hover:shadow-orange-200 transition-all font-primary text-sm flex items-center justify-center gap-2">
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                        Submit Response
                    </button>
                </>
            )}
        </div>
    );

    /* ── Shortcut pill style ── */
    const pillCls = "px-2.5 py-1.5 bg-white text-gray-700 text-[10px] font-bold rounded-sm border hover:border-[#FF7B1D] hover:text-[#FF7B1D] hover:bg-orange-50 transition-all shadow-sm active:scale-95 whitespace-nowrap flex-1 text-center";

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Call: ${lead?.name?.length > 25 ? lead.name.substring(0, 25) + '...' : lead?.name}`}
            icon={<Phone size={20} className="text-white" />}
            footer={footer}
            maxWidth="max-w-2xl"
        >
            <div className="font-primary space-y-2">

                {/* ── Session Header ── */}
                <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-extrabold text-gray-400 capitalize tracking-wider leading-tight">Current Session</span>
                            <span className="text-[14px] font-bold text-gray-900 capitalize tracking-tight">Call Attempt #{(lead?.call_count || 0) + 1}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {lead?.call_count > 0 && !response && (
                                <div className={`px-2.5 py-1 rounded-sm text-[10px] font-bold border capitalize shadow-sm ${lead.tag === 'Not Connected' ? 'bg-red-50 text-red-600 border-red-100' : lead.tag === 'Follow Up' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                    Prev: {lead.tag === 'Not Connected' ? 'Not Connected' : lead.tag === 'Follow Up' ? 'Connected' : lead.tag}
                                </div>
                            )}
                            {response && (
                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm border shadow-sm ${response === 'connected' ? 'bg-green-50 border-green-200 text-green-600' : 'bg-red-50 border-red-200 text-red-600'}`}>
                                    <div className={`w-2 h-2 rounded-full ${response === 'connected' ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]' : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]'}`} />
                                    <span className="text-[10px] font-bold capitalize tracking-tight">
                                        {response === 'connected' ? 'Connected' : 'Not Connected'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    {lead?.tag === 'Not Connected' && lead?.not_connected_reason && !response && (
                        <div className="mt-2 pt-2 border-t border-gray-200/60 flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-red-600 capitalize">Reason:</span>
                            <span className="text-[11px] font-medium text-gray-700 capitalize">{lead.not_connected_reason}</span>
                        </div>
                    )}
                </div>

                {/* ── Step 1: Connected / Not Connected selector ── */}
                {step === 1 && (
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => handleInitialAction("connected")} className="flex flex-col items-center justify-center py-5 border-2 border-gray-100 rounded-sm hover:border-green-500 hover:bg-green-50 transition-all group">
                            <div className="w-11 h-11 bg-green-100 rounded-full flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                                <Phone size={22} className="text-green-600" />
                            </div>
                            <span className="text-sm font-bold text-gray-600 capitalize">Connected</span>
                        </button>
                        <button onClick={() => handleInitialAction("not_connected")} disabled={loading} className="flex flex-col items-center justify-center py-5 border-2 border-gray-100 rounded-sm hover:border-red-500 hover:bg-red-50 transition-all group">
                            <div className="w-11 h-11 bg-red-100 rounded-full flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                                <PhoneOff size={22} className="text-red-600" />
                            </div>
                            <span className="text-sm font-bold text-gray-600 capitalize text-center">Not Connected</span>
                        </button>
                    </div>
                )}

                {/* ── Step 2: Response form ── */}
                {step === 2 && (
                    <div className="space-y-2">

                        {/* Why not connected? */}
                        {response === "not_connected" && (
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 text-[13px] font-bold text-gray-700 capitalize">
                                    <AlertCircle size={14} className="text-[#FF7B1D]" />
                                    Why not connected? <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={notConnectedReason}
                                    onChange={(e) => setNotConnectedReason(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-orange-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-10 outline-none transition-all text-sm font-semibold bg-white shadow-sm"
                                >
                                    <option value="">Select Call Status</option>
                                    {notConnectedStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        )}

                        {/* Connected: Call Summary */}
                        {response === "connected" && (
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 text-[13px] font-bold text-gray-700 capitalize">
                                    <FileText size={14} className="text-[#FF7B1D]" />
                                    Call Summary <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    placeholder="Enter detailed call summary here..."
                                    className="w-full px-3 py-2.5 border border-orange-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-10 outline-none transition-all text-sm font-medium bg-white placeholder-gray-400 shadow-sm hover:border-orange-300 resize-none"
                                    rows="2"
                                />
                            </div>
                        )}

                        {/* Connected: Priority + Duration */}
                        {response === "connected" && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-1.5 text-[13px] font-bold text-gray-700 capitalize">
                                        <Zap size={14} className="text-[#FF7B1D]" />
                                        Priority <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                        className="w-full px-3 py-2.5 border border-orange-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-10 outline-none transition-all text-sm font-semibold bg-white shadow-sm"
                                    >
                                        <option value="High">High</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-1.5 text-[13px] font-bold text-gray-700 capitalize">
                                        <Clock size={14} className="text-[#FF7B1D]" />
                                        Call Duration (Min)
                                    </label>
                                    <div className="flex items-center gap-2 px-3 py-2.5 border border-orange-200 rounded-sm bg-white focus-within:border-[#FF7B1D] focus-within:ring-2 focus-within:ring-[#FF7B1D] focus-within:ring-opacity-10 transition-all shadow-sm">
                                        <input
                                            type="number"
                                            value={durationMin}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setDurationMin(val === "" ? "" : parseInt(val) || 0);
                                            }}
                                            min="0"
                                            className="w-full bg-transparent outline-none text-sm font-semibold text-gray-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            placeholder="0"
                                        />
                                        <span className="text-[11px] font-bold text-gray-400 whitespace-nowrap">Mins</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Not-connected: Remarks */}
                        {response !== "connected" && response !== "" && (
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 text-[13px] font-bold text-gray-700 capitalize">
                                    <FileText size={14} className="text-[#FF7B1D]" />
                                    Remarks (Optional)
                                </label>
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    placeholder="Add any quick remarks here..."
                                    className="w-full px-3 py-2.5 border border-orange-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-10 outline-none transition-all text-sm font-medium bg-white placeholder-gray-400 shadow-sm hover:border-orange-300 resize-none"
                                    rows="2"
                                />
                            </div>
                        )}

                        {/* ── Follow-up Date & Time ── */}
                        {finalAction === "follow_up" && (
                            <div className="space-y-2 border-t border-gray-100 pt-2">

                                <label className="flex items-center gap-1.5 text-[13px] font-bold text-gray-700 capitalize">
                                    <Calendar size={14} className="text-[#FF7B1D]" />
                                    {response === "connected" ? "Follow-up Date & Time" : "Set Follow-Up Time"} <span className="text-red-500">*</span>
                                </label>

                                {/* Date + Time side by side */}
                                <div className="grid grid-cols-2 gap-4">

                                    {/* DATE column */}
                                    <div className="space-y-1.5">
                                        <label className="flex items-center gap-1 text-[12px] font-bold text-gray-500 capitalize">
                                            <Calendar size={12} className="text-[#FF7B1D]" /> Select Date
                                        </label>
                                        <input
                                            type="date"
                                            value={selectedDate}
                                            min={formatDateTime(new Date()).split('T')[0]}
                                            onChange={(e) => handleDateChange(e.target.value)}
                                            className="w-full px-3 py-2.5 border border-orange-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-10 outline-none transition-all text-sm font-semibold bg-white shadow-sm hover:border-orange-300"
                                        />
                                        {/* Date shortcuts */}
                                        <div className="flex flex-wrap gap-1.5">
                                            {dateShortcuts.map(sc => (
                                                <button key={sc.label} type="button" onClick={() => handleDateShortcut(sc)} className={`${pillCls} ${activeDateShortcut === sc.label ? 'border-[#FF7B1D] text-[#FF7B1D] bg-orange-50' : 'border-gray-200'}`}>
                                                    {sc.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* TIME column */}
                                    <div className="space-y-1.5">
                                        <label className="flex items-center gap-1 text-[12px] font-bold text-gray-500 capitalize">
                                            <Clock size={12} className="text-[#FF7B1D]" /> Select Time
                                        </label>
                                        <input
                                            type="time"
                                            value={selectedTime}
                                            onChange={(e) => handleTimeChange(e.target.value)}
                                            className="w-full px-3 py-2.5 border border-orange-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-10 outline-none transition-all text-sm font-semibold bg-white shadow-sm hover:border-orange-300"
                                        />
                                        {/* Time shortcuts */}
                                        <div className="flex flex-wrap gap-1.5">
                                            {timeShortcuts.map(sc => (
                                                <button key={sc.label} type="button" onClick={() => handleTimeShortcut(sc)} className={`${pillCls} ${activeTimeShortcut === sc.label ? 'border-[#FF7B1D] text-[#FF7B1D] bg-orange-50' : 'border-gray-200'}`}>
                                                    {sc.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                </div>

                                {/* Schedule conflict warning */}
                                {conflicts && conflicts.length > 0 && (
                                    <div className="p-2.5 bg-red-50 border border-red-200 rounded-sm flex items-start gap-2.5 shadow-sm">
                                        <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[10px] font-bold text-red-700 capitalize leading-none">Schedule Conflict</p>
                                            <p className="text-[11px] text-red-600 font-bold mt-1 leading-relaxed">
                                                Already scheduled: <span className="underline italic">{conflicts[0].name}</span> at {new Date(conflicts[0].next_call_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {!finalAction && (
                            <p className="text-xs text-gray-400 text-center italic py-2">Please select an outcome for the call.</p>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
}
