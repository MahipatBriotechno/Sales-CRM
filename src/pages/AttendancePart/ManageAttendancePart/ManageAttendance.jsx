import React, { useState } from "react";
import { FiHome } from "react-icons/fi";
import EmptyState from "../../../components/common/EmptyState";
import { QRCodeCanvas } from "qrcode.react";
import DashboardLayout from "../../../components/DashboardLayout";
import {
  Clock,
  Settings,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Wifi,
  QrCode,
  Calendar,
  Timer,
  Users,
  Shield,
  Bell,
  MapPin,
  Smartphone,
  Globe,
  Info,
  Zap,
  Activity,
  Lock,
  Unlock,
  Edit,
  Eye,
  EyeOff,
  Trash2,
  MoreVertical,
  Search,
  Check,
  X,
  UserCheck,
  UserX,
  LogOut,
  ClipboardList,
  Filter,
  Download,
  XCircle,
  Briefcase,
  Stethoscope,
  Umbrella,
  Coffee,
  ChevronRight,
  Baby,
  Heart,
  Flower2,
  HeartPulse,
  Camera,
} from "lucide-react";
import {
  useGetAllAttendanceQuery,
  useCheckOutMutation,
  useDeleteAttendanceMutation,
  useUpdateAttendanceMutation,
  useGetAttendanceSettingsQuery,
  useUpdateAttendanceSettingsMutation,
} from "../../../store/api/attendanceApi";
import { useGetShiftsQuery } from "../../../store/api/shiftApi";
import { toast } from "react-hot-toast";
import NumberCard from "../../../components/NumberCard";
import ActionGuard from "../../../components/common/ActionGuard";
import { useEffect } from "react";

export default function AttendanceManagement() {
  const [mainTab, setMainTab] = useState("settings");
  const [activeTab, setActiveTab] = useState("general");
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployeeForDetail, setSelectedEmployeeForDetail] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  // Real-time data
  const { data: attendanceResponse, isLoading: isAttendanceLoading } = useGetAllAttendanceQuery({
    date: new Date().toLocaleDateString('en-CA')
  });

  const [checkOut, { isLoading: isCheckingOut }] = useCheckOutMutation();
  const [deleteAttendance] = useDeleteAttendanceMutation();

  const { data: settingsData, isLoading: isSettingsLoading } = useGetAttendanceSettingsQuery();
  const [updateSettings, { isLoading: isUpdating }] = useUpdateAttendanceSettingsMutation();

  const [settings, setSettings] = useState({
    // General Settings
    attendanceStartTime: "09:00",
    attendanceEndTime: "18:00",
    graceTime: "15",
    halfDayStartTime: "09:00",
    halfDayEndTime: "13:00",
    halfDayMinHours: "4",
    fullDayMinHours: "8",
    lateMarkAfter: "15",
    autoCheckOut: true,
    autoCheckOutTime: "19:00",

    // Check-in Methods
    wifiEnabled: true,
    qrCodeEnabled: true,
    manualEnabled: true,
    biometricEnabled: false,
    gpsEnabled: false,
    anywhereEnabled: false,

    // WiFi Settings
    wifiSSID: "CompanyWiFi-Guest",
    wifiPassword: "Company@2024",
    allowedIPs: "192.168.1.0/24",

    // GPS Settings
    officeLatitude: "23.8103",
    officeLongitude: "90.4125",
    geoFenceRadius: "100",

    // Break Settings
    breakEnabled: true,
    breakDuration: "60",
    maxBreaks: "2",
    deductBreakTime: true,

    // Leave Settings
    casualLeave: "12",
    sickLeave: "10",
    paidLeave: "15",
    unpaidLeave: "5",

    // Notification Settings
    lateArrivalNotification: true,
    earlyDepartureNotification: true,
    absentNotification: true,
    overtimeNotification: true,
    emailNotifications: true,
    smsNotifications: false,

    // Weekend & Holiday Settings
    weekendDays: ["Saturday", "Sunday"],
    publicHolidays: [],

    // Overtime Settings
    overtimeEnabled: true,
    overtimeStartAfter: "18:00",
    overtimeRate: "1.5",
    maxOvertimeHours: "4",

    // Shift Settings
    multipleShiftsEnabled: false,
    defaultShift: "morning",
  });

  const { data: shiftApiData } = useGetShiftsQuery();
  const shifts = shiftApiData?.shifts || [];

  const leaveQuotas = [
    {
      label: "Casual Leave",
      key: "casualLeave",
      description: "Allocated for personal matters and short-term needs.",
      icon: <Coffee className="w-6 h-6" />,
      color: "orange",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
      borderColor: "border-orange-100",
    },
    {
      label: "Sick Leave",
      key: "sickLeave",
      description: "Dedicated for medical appointments and health recovery.",
      icon: <Stethoscope className="w-6 h-6" />,
      color: "red",
      bgColor: "bg-red-50",
      iconColor: "text-red-600",
      borderColor: "border-red-100",
    },
    {
      label: "Paid Leave",
      key: "paidLeave",
      description: "Annual vacation time for rest and leisure activities.",
      icon: <Umbrella className="w-6 h-6" />,
      color: "blue",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      borderColor: "border-blue-100",
    },
    {
      label: "Unpaid Leave",
      key: "unpaidLeave",
      description: "Authorized absence without pay when quotas are exhausted.",
      icon: <XCircle className="w-6 h-6" />,
      color: "gray",
      bgColor: "bg-gray-50",
      iconColor: "text-gray-600",
      borderColor: "border-gray-100",
    },
    {
      label: "Maternity Leave",
      key: "maternityLeave",
      description: "Support for new mothers during and after childbirth.",
      icon: <Baby className="w-6 h-6" />,
      color: "pink",
      bgColor: "bg-pink-50",
      iconColor: "text-pink-600",
      borderColor: "border-pink-100",
    },
    {
      label: "Paternity Leave",
      key: "paternityLeave",
      description: "Dedicated time for fathers to support their new child.",
      icon: <Users className="w-6 h-6" />,
      color: "indigo",
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-600",
      borderColor: "border-indigo-100",
    },
    {
      label: "Bereavement Leave",
      key: "bereavementLeave",
      description: "Compassionate leave for the loss of a family member.",
      icon: <Flower2 className="w-6 h-6" />,
      color: "slate",
      bgColor: "bg-slate-50",
      iconColor: "text-slate-600",
      borderColor: "border-slate-100",
    },
    {
      label: "Marriage Leave",
      key: "marriageLeave",
      description: "Celebrating new beginnings with dedicated wedding time.",
      icon: <Heart className="w-6 h-6" />,
      color: "rose",
      bgColor: "bg-rose-50",
      iconColor: "text-rose-600",
      borderColor: "border-rose-100",
    },
  ];

  useEffect(() => {
    if (settingsData?.success && settingsData.data) {
      setSettings(prev => ({
        ...prev,
        ...settingsData.data,
      }));
    }
  }, [settingsData]);

  const handleManualCheckOut = async (record) => {
    if (window.confirm(`Are you sure you want to manually check out ${record.employee_name}?`)) {
      try {
        await checkOut({ id: record.id }).unwrap();
        toast.success("Checked out successfully!");
      } catch (error) {
        toast.error(error.data?.message || "Failed to check out");
      }
    }
  };

  const handleDeleteRecord = async (id) => {
    if (window.confirm("Are you sure you want to delete this attendance record?")) {
      try {
        await deleteAttendance(id).unwrap();
        toast.success("Record deleted successfully!");
      } catch (error) {
        toast.error(error.data?.message || "Failed to delete record");
      }
    }
  };

  const calculateTotalTime = (checkIn, checkOut, workHours) => {
    let totalMinutes = 0;

    if (checkIn && checkOut && checkIn !== "-" && checkOut !== "-") {
      const parseTime = (t) => {
        const parts = t.split(":");
        return parseInt(parts[0] || 0) * 60 + parseInt(parts[1] || 0);
      };
      const inMins = parseTime(checkIn);
      const outMins = parseTime(checkOut);
      totalMinutes = outMins - inMins;
      if (totalMinutes < 0) totalMinutes += 24 * 60; // handle overnight
    } else if (workHours && !workHours.includes('NaN') && workHours !== "-") {
      if (workHours.includes(':')) {
        const parts = workHours.split(':');
        totalMinutes = parseInt(parts[0] || 0) * 60 + parseInt(parts[1] || 0);
      } else {
        totalMinutes = parseFloat(workHours) * 60;
      }
    } else {
      return "-";
    }

    const hrs = Math.floor(totalMinutes / 60);
    const mins = Math.floor(totalMinutes % 60);

    if (hrs === 0 && mins === 0) return "-";
    if (hrs === 0) return `${mins} mins`;
    if (mins === 0) return `${hrs} hrs`;
    return `${hrs} hrs ${mins} mins`;
  };

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      await updateSettings(settings).unwrap();
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error(error.data?.message || "Failed to save settings");
    }
  };

  const handleReset = () => {
    if (window.confirm("⚠️ Reset all changes to last saved state?")) {
      if (settingsData?.success && settingsData.data) {
        setSettings(settingsData.data);
        toast.success("Settings restored to last saved state");
      } else {
        // Fallback to initial defaults if no server data
        setSettings({
          attendanceStartTime: "09:00",
          attendanceEndTime: "18:00",
          graceTime: 15,
          halfDayStartTime: "09:00",
          halfDayEndTime: "13:30",
          minHoursFullDay: 8,
          minHoursHalfDay: 4,
          autoCheckOut: false,
          autoCheckOutTime: "19:00",
          wifiEnabled: false,
          wifiSSID: "",
          wifiPassword: "",
          allowedIPs: "",
          gpsEnabled: false,
          anywhereEnabled: false,
          officeLatitude: 0,
          officeLongitude: 0,
          geoFenceRadius: 100,
          qrCodeEnabled: false,
          casualLeave: 12,
          sickLeave: 10,
          paidLeave: 15,
          unpaidLeave: 0,
          overtimeEnabled: false,
          overtimeStartAfter: "18:30",
          overtimeRate: 1.5,
          maxOvertimeHours: 4,
          lateArrivalNotification: true,
          earlyDepartureNotification: true,
          absentNotification: true,
          overtimeNotification: true,
          emailNotifications: true,
          smsNotifications: false,
          multipleShiftsEnabled: false,
          defaultShift: 1,
          weekendDays: ["Sunday"],
        });
        toast.success("Settings reset to defaults");
      }
    }
  };

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "checkin", label: "Check-in Methods", icon: Smartphone },
    { id: "timing", label: "Timing & Breaks", icon: Clock },
    { id: "leaves", label: "Leave Policy", icon: Calendar },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "advanced", label: "Advanced", icon: Shield },
  ];

  return (
    <DashboardLayout>
      <div className="p-0 bg-white ml-2 min-h-screen text-black">
        <div className="relative z-10 p-0 ml-2">
          {/* Header */}
          <div className="mb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border-b py-6 pr-6">
              <div>
                <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
                  Attendance Settings
                </h1>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                  <FiHome className="text-gray-400 text-sm" />
                  <span className="text-gray-300">/</span> HRM /{" "}
                  <span className="text-[#FF7B1D] font-semibold">Settings</span>
                </p>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="pr-4 pb-12">
            {mainTab === "monitor" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Stats for Today */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <NumberCard
                    title="Signed In"
                    number={attendanceResponse?.data?.filter(r => r.status !== 'absent').length || 0}
                    icon={<UserCheck className="text-green-600" />}
                    iconBgColor="bg-green-100"
                    lineBorderClass="border-green-500"
                  />
                  <NumberCard
                    title="Active Sessions"
                    number={attendanceResponse?.data?.filter(r => !r.check_out && r.status !== 'absent').length || 0}
                    icon={<Timer className="text-orange-600" />}
                    iconBgColor="bg-orange-100"
                    lineBorderClass="border-orange-500"
                  />
                  <NumberCard
                    title="Late Arrivals"
                    number={attendanceResponse?.data?.filter(r => r.status === 'late').length || 0}
                    icon={<AlertCircle className="text-red-600" />}
                    iconBgColor="bg-red-100"
                    lineBorderClass="border-red-500"
                  />
                  <NumberCard
                    title="Completed Shifts"
                    number={attendanceResponse?.data?.filter(r => r.check_out).length || 0}
                    icon={<CheckCircle className="text-blue-600" />}
                    iconBgColor="bg-blue-100"
                    lineBorderClass="border-blue-500"
                  />
                </div>

                {/* Active Table */}
                <div className="bg-white rounded-none  border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Live Attendance Monitor
                    </h2>
                    <div className="relative w-full md:w-96">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search employee name or UID..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-none focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="overflow-hidden">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm">
                          <th className="px-6 py-3 font-semibold border-b border-orange-400 capitalize whitespace-nowrap text-left">Employee</th>
                          <th className="px-6 py-3 font-semibold border-b border-orange-400 capitalize whitespace-nowrap text-center">Check-In</th>
                          <th className="px-6 py-3 font-semibold border-b border-orange-400 capitalize whitespace-nowrap text-center">Status</th>
                          <th className="px-6 py-3 font-semibold border-b border-orange-400 capitalize whitespace-nowrap text-center">Network / IP</th>
                          <th className="px-6 py-3 font-semibold border-b border-orange-400 capitalize whitespace-nowrap text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {isAttendanceLoading ? (
                          <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400">Loading live data...</td></tr>
                        ) : (() => {
                          const filteredRecords = attendanceResponse?.data?.filter(r => r.status !== 'absent' &&
                            (r.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              r.emp_uid?.toLowerCase().includes(searchQuery.toLowerCase()))
                          ) || [];

                          if (filteredRecords.length === 0) {
                            return (
                              <tr>
                                <td colSpan="5" className="py-20 text-center">
                                  <EmptyState
                                    title="No Live Attendance Found"
                                    description="There are no active employee check-ins matching your search."
                                  />
                                </td>
                              </tr>
                            );
                          }

                          return filteredRecords.map((record) => (
                            <tr key={record.id} className="border-t hover:bg-gray-50 transition-colors group">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  {record.selfie ? (
                                    <img
                                      src={record.selfie}
                                      alt=""
                                      onClick={() => setSelectedImage({ url: record.selfie, time: record.check_in, ip: record.ip_address })}
                                      className="w-10 h-10 rounded-none object-cover border-2 border-orange-200 cursor-pointer hover:opacity-80 transition-opacity"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-none bg-orange-100 flex items-center justify-center font-bold text-orange-600 border border-orange-200">
                                      {record.employee_name?.charAt(0)}
                                    </div>
                                  )}
                                  <div onClick={() => setSelectedEmployeeForDetail(record)} className="cursor-pointer hover:text-orange-600">
                                    <p className="font-bold text-gray-900 hover:text-orange-600 transition-colors">{record.employee_name}</p>
                                    <p className="text-xs text-gray-500 font-medium">{record.emp_uid}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="inline-flex flex-col items-center">
                                  <span className="text-sm font-bold text-gray-700">{record.check_in}</span>
                                  <span className="text-[10px] text-gray-400 uppercase tracking-tighter">{record.check_in_method}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`px-2 py-1 rounded-none text-[10px] font-bold border uppercase tracking-wider ${record.status === 'present' ? 'bg-green-100 text-green-600 border-green-200' :
                                  record.status === 'late' ? 'bg-orange-100 text-orange-600 border-orange-200' :
                                    'bg-red-100 text-red-600 border-red-200'
                                  }`}>
                                  {record.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="text-xs font-mono text-gray-500">{record.ip_address}</div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  {!record.check_out ? (
                                    <ActionGuard permission="attendance_edit" module="Attendance Management" type="update">
                                      <button
                                        onClick={() => handleManualCheckOut(record)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-500 rounded-none text-red-600 hover:text-white transition-all border border-red-100  text-[10px] font-bold uppercase tracking-wider group"
                                        title="Force Check Out"
                                      >
                                        <LogOut className="w-3.5 h-3.5" />
                                        <span>Force Check Out</span>
                                      </button>
                                    </ActionGuard>
                                  ) : (
                                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-none border border-green-100 uppercase tracking-tighter">
                                      COMPLETED at {record.check_out}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {mainTab === "records" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white rounded-none  border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">Historical Records Management</h2>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded-none text-gray-400"><Filter className="w-5 h-5" /></button>
                      <ActionGuard permission="attendance_reports" module="Attendance Management" type="read">
                        <button className="p-2 hover:bg-gray-100 rounded-none text-gray-400"><Download className="w-5 h-5" /></button>
                      </ActionGuard>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm">
                          <th className="px-6 py-3 font-semibold border-b border-orange-400 capitalize whitespace-nowrap text-left">Employee</th>
                          <th className="px-6 py-3 font-semibold border-b border-orange-400 capitalize whitespace-nowrap text-center">Date</th>
                          <th className="px-6 py-3 font-semibold border-b border-orange-400 capitalize whitespace-nowrap text-center">Total Time</th>
                          <th className="px-6 py-3 font-semibold border-b border-orange-400 capitalize whitespace-nowrap text-center">Status</th>
                          <th className="px-6 py-3 font-semibold border-b border-orange-400 capitalize whitespace-nowrap text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {attendanceResponse?.data?.length > 0 ? (
                          attendanceResponse?.data?.map((record) => (
                            <tr key={record.id} className="border-t hover:bg-gray-50 transition-colors group">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  {record.selfie ? (
                                    <img
                                      src={record.selfie}
                                      alt=""
                                      onClick={() => setSelectedImage({ url: record.selfie, time: record.check_in, ip: record.ip_address })}
                                      className="w-10 h-10 rounded-none object-cover border-2 border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-none bg-slate-100 flex items-center justify-center font-bold text-slate-600 border border-slate-200 uppercase">
                                      {record.employee_name?.charAt(0)}
                                    </div>
                                  )}
                                  <div onClick={() => setSelectedEmployeeForDetail(record)} className="cursor-pointer hover:text-orange-600">
                                    <p className="font-bold text-gray-900 hover:text-orange-600 transition-colors">{record.employee_name}</p>
                                    <p className="text-[11px] text-gray-500 font-medium uppercase tracking-tighter">{record.emp_uid}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center text-sm">{record.date ? new Date(record.date).toLocaleDateString() : '-'}</td>
                              <td className="px-6 py-4 text-center text-sm font-bold whitespace-nowrap">
                                {calculateTotalTime(record.check_in, record.check_out, record.work_hours)}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`px-2 py-1 rounded-none text-[10px] font-bold border uppercase tracking-wider ${record.status === 'present' ? 'bg-green-100 text-green-600 border-green-200' :
                                  record.status === 'absent' ? 'bg-red-100 text-red-600 border-red-200' : 'bg-orange-100 text-orange-600 border-orange-200'
                                  }`}>
                                  {record.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <ActionGuard permission="attendance_edit" module="Attendance Management" type="update">
                                    <button className="p-2 bg-blue-50 hover:bg-blue-500 rounded-none text-blue-600 hover:text-white transition-all border border-blue-100 " title="Edit Record"><Edit className="w-4 h-4" /></button>
                                  </ActionGuard>
                                  <ActionGuard permission="attendance_delete" module="Attendance Management" type="delete">
                                    <button onClick={() => handleDeleteRecord(record.id)} className="p-2 bg-red-50 hover:bg-red-500 rounded-none text-red-600 hover:text-white transition-all border border-red-100 " title="Delete Record"><Trash2 className="w-4 h-4" /></button>
                                  </ActionGuard>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="py-20 text-center">
                              <EmptyState
                                title="No Historical Records Found"
                                description="Attendance logs will appear here once they are generated."
                              />
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {mainTab === "settings" && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                {/* Info Banner */}
                <div className="bg-gradient-to-r from-orange-50 to-orange-50 border-l-4 border-orange-500 p-4 mb-6 rounded-none ">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-bold text-gray-800 mb-1"> System Configuration </h3>
                      <p className="text-xs text-gray-600"> Configure global attendance parameters. These settings apply company-wide and define the behavior of the attendance system. </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-sm rounded-none  overflow-hidden border border-gray-200">
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-1">
                    <div className="flex overflow-x-auto scrollbar-hide">
                      {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 min-w-[140px] px-4 py-3 flex items-center justify-center gap-2 text-sm font-bold transition-all ${activeTab === tab.id
                              ? "bg-white text-orange-600 shadow-md rounded-t-sm"
                              : "text-white hover:bg-white/20"
                              }`}
                          >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-8">
                    {/* General Settings */}
                    {activeTab === "general" && (
                      <div className="space-y-6">
                        <div className="bg-gradient-to-r from-orange-50 to-orange-50 p-4 rounded-none border border-orange-200">
                          <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-600" />
                            Working Hours Configuration
                          </h3>
                          <p className="text-xs text-gray-600">
                            Define your company's standard working hours and grace
                            periods
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                              Attendance Start Time
                            </label>
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500" />
                              <input
                                type="time"
                                value={settings.attendanceStartTime}
                                onChange={(e) =>
                                  handleSettingChange(
                                    "attendanceStartTime",
                                    e.target.value
                                  )
                                }
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              When employees can start marking attendance
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                              Attendance End Time
                            </label>
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500" />
                              <input
                                type="time"
                                value={settings.attendanceEndTime}
                                onChange={(e) =>
                                  handleSettingChange(
                                    "attendanceEndTime",
                                    e.target.value
                                  )
                                }
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Standard work day end time
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                              Grace Time (Minutes)
                            </label>
                            <div className="relative">
                              <Timer className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-orange-500" />
                              <input
                                type="number"
                                value={settings.graceTime}
                                onChange={(e) =>
                                  handleSettingChange("graceTime", e.target.value)
                                }
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                min="0"
                                max="60"
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Late marking grace period after start time
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                              Mark Late After (Minutes)
                            </label>
                            <div className="relative">
                              <AlertCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-500" />
                              <input
                                type="number"
                                value={settings.lateMarkAfter}
                                onChange={(e) =>
                                  handleSettingChange("lateMarkAfter", e.target.value)
                                }
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                min="0"
                                max="120"
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Employee marked late after this time
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                              Full Day Minimum Hours
                            </label>
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
                              <input
                                type="number"
                                value={settings.fullDayMinHours}
                                onChange={(e) =>
                                  handleSettingChange(
                                    "fullDayMinHours",
                                    e.target.value
                                  )
                                }
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                min="1"
                                max="12"
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Minimum hours for full day attendance
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                              Half Day Minimum Hours
                            </label>
                            <div className="relative">
                              <Timer className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-yellow-500" />
                              <input
                                type="number"
                                value={settings.halfDayMinHours}
                                onChange={(e) =>
                                  handleSettingChange(
                                    "halfDayMinHours",
                                    e.target.value
                                  )
                                }
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                min="1"
                                max="8"
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Minimum hours for half day attendance
                            </p>
                          </div>
                        </div>

                        <div className="bg-white border-2 border-gray-200 rounded-none p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-orange-500" />
                                Auto Check-Out
                              </h4>
                              <p className="text-xs text-gray-600 mt-1">
                                Automatically check out employees at specified time
                              </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.autoCheckOut}
                                onChange={(e) =>
                                  handleSettingChange(
                                    "autoCheckOut",
                                    e.target.checked
                                  )
                                }
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                          {settings.autoCheckOut && (
                            <div className="mt-4">
                              <label className="block text-sm font-bold text-gray-700 mb-2">
                                Auto Check-Out Time
                              </label>
                              <input
                                type="time"
                                value={settings.autoCheckOutTime}
                                onChange={(e) =>
                                  handleSettingChange(
                                    "autoCheckOutTime",
                                    e.target.value
                                  )
                                }
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Check-in Methods */}
                    {activeTab === "checkin" && (
                      <div className="space-y-6">
                        <div className="bg-gradient-to-r from-orange-50 to-orange-50 p-4 rounded-none border border-green-200">
                          <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
                            <Smartphone className="w-5 h-5 text-green-600" />
                            Check-in & Check-out Methods
                          </h3>
                          <p className="text-xs text-gray-600">
                            Configure how employees can mark their attendance
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* WiFi Method */}
                          <div className="bg-white border-2 border-gray-200 rounded-none p-4 hover:border-blue-300 transition-all">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-none">
                                  <Wifi className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-gray-800">
                                    WiFi Check-in
                                  </h4>
                                  <p className="text-xs text-gray-600">
                                    Mark attendance via office WiFi
                                  </p>
                                </div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={settings.wifiEnabled}
                                  onChange={(e) =>
                                    handleSettingChange(
                                      "wifiEnabled",
                                      e.target.checked
                                    )
                                  }
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                            {settings.wifiEnabled && (
                              <div className="space-y-3 mt-4 pt-4 border-t border-gray-200">
                                <div>
                                  <label className="block text-xs font-bold text-gray-700 mb-1">
                                    WiFi SSID Name
                                  </label>
                                  <input
                                    type="text"
                                    value={settings.wifiSSID}
                                    onChange={(e) =>
                                      handleSettingChange("wifiSSID", e.target.value)
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="CompanyWiFi"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-gray-700 mb-1">
                                    WiFi Password
                                  </label>
                                  <div className="relative">
                                    <input
                                      type={showPassword ? "text" : "password"}
                                      value={settings.wifiPassword}
                                      onChange={(e) =>
                                        handleSettingChange(
                                          "wifiPassword",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                      placeholder="Enter password"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowPassword(!showPassword)}
                                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                      {showPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                      ) : (
                                        <Eye className="w-4 h-4" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Allowed IP Range
                                  </label>
                                  <input
                                    type="text"
                                    value={settings.allowedIPs}
                                    onChange={(e) =>
                                      handleSettingChange(
                                        "allowedIPs",
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="192.168.1.0/24"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* QR Code Method */}
                          <div className="bg-white border-2 border-gray-200 rounded-none p-4 hover:border-purple-300 transition-all">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-none">
                                  <QrCode className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-gray-800">
                                    QR Code Check-in
                                  </h4>
                                  <p className="text-xs text-gray-600">
                                    Scan QR code to mark attendance
                                  </p>
                                </div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={settings.qrCodeEnabled}
                                  onChange={(e) =>
                                    handleSettingChange(
                                      "qrCodeEnabled",
                                      e.target.checked
                                    )
                                  }
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                              </label>
                            </div>
                            {settings.qrCodeEnabled && (
                              <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col items-center">
                                <div className="bg-white p-3 rounded-none  border border-gray-100 mb-3">
                                  <QRCodeCanvas
                                    value={`${window.location.origin}/hrm/attendance/employee?secret=${settings.qrSecret}`}
                                    size={160}
                                    level="H"
                                    includeMargin={true}
                                  />
                                </div>
                                <p className="text-[10px] text-gray-500 mb-2 text-center max-w-[200px]">
                                  Employees can scan this QR code to check in.
                                </p>
                                <button
                                  onClick={() => handleSettingChange('qrSecret', Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15))}
                                  className="text-[10px] font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  Regenerate QR Secret
                                </button>
                              </div>
                            )}
                          </div>


                          {/* GPS Location */}
                          <div className="bg-white border-2 border-gray-200 rounded-none p-4 hover:border-orange-300 transition-all">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 rounded-none">
                                  <MapPin className="w-6 h-6 text-orange-600" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-gray-800">
                                    GPS Location
                                  </h4>
                                  <p className="text-xs text-gray-600">
                                    Verify location using GPS
                                  </p>
                                </div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={settings.gpsEnabled}
                                  onChange={(e) =>
                                    handleSettingChange(
                                      "gpsEnabled",
                                      e.target.checked
                                    )
                                  }
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                              </label>
                            </div>
                            {settings.gpsEnabled && (
                              <div className="space-y-3 mt-4 pt-4 border-t border-gray-200">
                                <div>
                                  <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Office Latitude
                                  </label>
                                  <input
                                    type="text"
                                    value={settings.officeLatitude}
                                    onChange={(e) =>
                                      handleSettingChange(
                                        "officeLatitude",
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                    placeholder="23.8103"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Office Longitude
                                  </label>
                                  <input
                                    type="text"
                                    value={settings.officeLongitude}
                                    onChange={(e) =>
                                      handleSettingChange(
                                        "officeLongitude",
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                    placeholder="90.4125"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Geo-Fence Radius (meters)
                                  </label>
                                  <input
                                    type="number"
                                    value={settings.geoFenceRadius}
                                    onChange={(e) =>
                                      handleSettingChange(
                                        "geoFenceRadius",
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                    placeholder="100"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Anywhere Check-in */}
                          <div className="bg-white border-2 border-gray-200 rounded-none p-4 hover:border-indigo-300 transition-all">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 rounded-none">
                                  <Globe className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-gray-800">
                                    Anywhere Check-in
                                  </h4>
                                  <p className="text-xs text-gray-600">
                                    Allow check-in from any location
                                  </p>
                                </div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={settings.anywhereEnabled}
                                  onChange={(e) =>
                                    handleSettingChange(
                                      "anywhereEnabled",
                                      e.target.checked
                                    )
                                  }
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                              </label>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <p className="text-[11px] text-gray-500 leading-relaxed italic">
                                "Enabling this allows employees to mark attendance from home or on-site without WiFi or GPS restrictions. Ideal for remote or field teams."
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Timing & Breaks */}
                    {activeTab === "timing" && (
                      <div className="space-y-6">
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-none border border-yellow-200">
                          <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
                            <Timer className="w-5 h-5 text-yellow-600" />
                            Break Time & Half Day Configuration
                          </h3>
                          <p className="text-xs text-gray-600">
                            Configure break policies and half-day timing
                          </p>
                        </div>

                        {/* Half Day Settings */}
                        <div className="bg-white border-2 border-gray-200 rounded-none p-4">
                          <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-yellow-500" />
                            Half Day Timing
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">
                                Half Day Start Time
                              </label>
                              <input
                                type="time"
                                value={settings.halfDayStartTime}
                                onChange={(e) =>
                                  handleSettingChange(
                                    "halfDayStartTime",
                                    e.target.value
                                  )
                                }
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">
                                Half Day End Time
                              </label>
                              <input
                                type="time"
                                value={settings.halfDayEndTime}
                                onChange={(e) =>
                                  handleSettingChange(
                                    "halfDayEndTime",
                                    e.target.value
                                  )
                                }
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                              />
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mt-2 bg-yellow-50 p-2 rounded">
                            💡 Half day will be marked if employee works between these
                            hours
                          </p>
                        </div>

                        {/* Break Settings */}
                        <div className="bg-white border-2 border-gray-200 rounded-none p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                              <Activity className="w-5 h-5 text-orange-500" />
                              Break Time Management
                            </h4>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.breakEnabled}
                                onChange={(e) =>
                                  handleSettingChange(
                                    "breakEnabled",
                                    e.target.checked
                                  )
                                }
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                            </label>
                          </div>
                          {settings.breakEnabled && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Break Duration (Minutes)
                                  </label>
                                  <input
                                    type="number"
                                    value={settings.breakDuration}
                                    onChange={(e) =>
                                      handleSettingChange(
                                        "breakDuration",
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                    min="15"
                                    max="120"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Maximum Breaks Per Day
                                  </label>
                                  <input
                                    type="number"
                                    value={settings.maxBreaks}
                                    onChange={(e) =>
                                      handleSettingChange("maxBreaks", e.target.value)
                                    }
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                    min="1"
                                    max="5"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-3 bg-orange-50 p-3 rounded-none">
                                <input
                                  type="checkbox"
                                  checked={settings.deductBreakTime}
                                  onChange={(e) =>
                                    handleSettingChange(
                                      "deductBreakTime",
                                      e.target.checked
                                    )
                                  }
                                  className="w-4 h-4 text-orange-600 focus:ring-orange-500 rounded"
                                />
                                <label className="text-sm text-gray-700">
                                  Deduct break time from total work hours
                                </label>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Overtime Settings */}
                        <div className="bg-white border-2 border-gray-200 rounded-none p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                              <Zap className="w-5 h-5 text-blue-500" />
                              Overtime Configuration
                            </h4>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.overtimeEnabled}
                                onChange={(e) =>
                                  handleSettingChange(
                                    "overtimeEnabled",
                                    e.target.checked
                                  )
                                }
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                          {settings.overtimeEnabled && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                  OT Starts After
                                </label>
                                <input
                                  type="time"
                                  value={settings.overtimeStartAfter}
                                  onChange={(e) =>
                                    handleSettingChange(
                                      "overtimeStartAfter",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                  OT Rate (Multiplier)
                                </label>
                                <input
                                  type="number"
                                  value={settings.overtimeRate}
                                  onChange={(e) =>
                                    handleSettingChange(
                                      "overtimeRate",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                  step="0.1"
                                  min="1"
                                  max="3"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                  Max OT Hours/Day
                                </label>
                                <input
                                  type="number"
                                  value={settings.maxOvertimeHours}
                                  onChange={(e) =>
                                    handleSettingChange(
                                      "maxOvertimeHours",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                  min="1"
                                  max="8"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Leave Policy */}
                    {activeTab === "leaves" && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="bg-gradient-to-r from-[#FF7B1D] to-[#e66a15] p-8 rounded-none text-white relative overflow-hidden  shadow-orange-100">
                          <div className="relative z-10 flex items-center justify-between">
                            <div>
                              <h3 className="text-2xl font-black mb-2 flex items-center gap-3">
                                <Calendar className="w-8 h-8" />
                                Leave Policy & Quotas
                              </h3>
                              <p className="text-orange-50 text-sm max-w-md font-medium">
                                Configure your organization's leave architecture by defining annual quotas for various categories of time-off.
                              </p>
                            </div>
                            <div className="p-4 bg-white/10 rounded-none backdrop-blur-md border border-white/20">
                              <Briefcase className="w-12 h-12 text-white/80" />
                            </div>
                          </div>
                          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {leaveQuotas.map((leave) => (
                            <div
                              key={leave.key}
                              className={`bg-white border-2 ${leave.borderColor} rounded-none p-6 transition-all hover:shadow-lg hover:shadow-gray-100 group`}
                            >
                              <div className="flex items-start justify-between mb-6">
                                <div className={`p-4 ${leave.bgColor} rounded-none transition-transform group-hover:scale-110 duration-300`}>
                                  <span className={leave.iconColor}>{leave.icon}</span>
                                </div>
                                <div className="text-right">
                                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                                    Annual Quota
                                  </label>
                                  <div className="flex items-center gap-2 justify-end">
                                    <input
                                      type="number"
                                      value={settings[leave.key] || 0}
                                      onChange={(e) => handleSettingChange(leave.key, e.target.value)}
                                      className="w-16 px-2 py-1.5 bg-gray-50 border-2 border-gray-100 rounded-none focus:outline-none focus:ring-2 focus:ring-[#FF7B1D] text-center font-black text-gray-900"
                                      min="0"
                                      max="365"
                                    />
                                    <span className="text-xs font-bold text-gray-400">Days</span>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="text-base font-bold text-gray-900 mb-1">{leave.label}</h4>
                                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                                  {leave.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="bg-[#111827] rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
                          <div className="relative z-10">
                            <h4 className="text-lg font-bold mb-6 flex items-center gap-3">
                              <Shield className="w-5 h-5 text-[#FF7B1D]" />
                              Corporate Leave Compliance
                            </h4>
                            <div className="grid sm:grid-cols-2 gap-4">
                              {[
                                "Standard roll-over of 50% for unused casual leaves.",
                                "Centralized manager approval hub for all requests.",
                                "Pro-rated leave calculation for mid-year joiners.",
                                "Public holidays are excluded from leave deductions."
                              ].map((note, i) => (
                                <div key={i} className="flex gap-4 p-4 bg-white/5 rounded-none border border-white/10 hover:bg-white/10 transition-colors">
                                  <div className="w-6 h-6 bg-[#FF7B1D] rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black">
                                    {i + 1}
                                  </div>
                                  <p className="text-sm text-gray-300 font-medium">{note}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF7B1D] via-orange-400 to-yellow-500"></div>
                        </div>
                      </div>
                    )}

                    {/* Notifications */}
                    {activeTab === "notifications" && (
                      <div className="space-y-6">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-none border border-blue-200">
                          <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
                            <Bell className="w-5 h-5 text-blue-600" />
                            Notification Settings
                          </h3>
                          <p className="text-xs text-gray-600">
                            Configure attendance alerts and notifications
                          </p>
                        </div>

                        <div className="space-y-3">
                          {[
                            {
                              label: "Late Arrival Notification",
                              key: "lateArrivalNotification",
                              desc: "Notify when employee arrives late",
                            },
                            {
                              label: "Early Departure Notification",
                              key: "earlyDepartureNotification",
                              desc: "Notify when employee leaves early",
                            },
                            {
                              label: "Absent Notification",
                              key: "absentNotification",
                              desc: "Notify when employee is absent",
                            },
                            {
                              label: "Overtime Notification",
                              key: "overtimeNotification",
                              desc: "Notify when employee works overtime",
                            },
                            {
                              label: "Email Notifications",
                              key: "emailNotifications",
                              desc: "Send notifications via email",
                            },
                            {
                              label: "SMS Notifications",
                              key: "smsNotifications",
                              desc: "Send notifications via SMS",
                            },
                          ].map((notif) => (
                            <div
                              key={notif.key}
                              className="bg-white border-2 border-gray-200 rounded-none p-4"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="text-sm font-bold text-gray-800">
                                    {notif.label}
                                  </h4>
                                  <p className="text-xs text-gray-600 mt-1">
                                    {notif.desc}
                                  </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={settings[notif.key]}
                                    onChange={(e) =>
                                      handleSettingChange(notif.key, e.target.checked)
                                    }
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Advanced Settings */}
                    {activeTab === "advanced" && (
                      <div className="space-y-6">
                        <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-none border border-gray-200">
                          <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-gray-600" />
                            Advanced Configuration
                          </h3>
                          <p className="text-xs text-gray-600">
                            Additional settings and shift management
                          </p>
                        </div>

                        {/* Shift Management */}
                        <div className="bg-white border-2 border-gray-200 rounded-none p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                              <Clock className="w-5 h-5 text-indigo-500" />
                              Multiple Shifts
                            </h4>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.multipleShiftsEnabled}
                                onChange={(e) =>
                                  handleSettingChange(
                                    "multipleShiftsEnabled",
                                    e.target.checked
                                  )
                                }
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                          </div>
                          {settings.multipleShiftsEnabled && (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                  Default Shift
                                </label>
                                <select
                                  value={settings.defaultShift}
                                  onChange={(e) =>
                                    handleSettingChange(
                                      "defaultShift",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                >
                                  {shifts.map((shift) => (
                                    <option key={shift.id} value={shift.id}>
                                      {shift.shift_name} ({shift.check_in_time} - {shift.check_out_time})
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="bg-indigo-50 p-3 rounded-none">
                                <p className="text-xs text-gray-700 font-semibold mb-2">
                                  Available Shifts:
                                </p>
                                {shifts.map((shift) => (
                                  <div
                                    key={shift.id}
                                    className="flex items-center justify-between py-2 border-b border-indigo-200 last:border-0"
                                  >
                                    <span className="text-xs font-medium text-gray-700">
                                      {shift.shift_name}
                                    </span>
                                    <span className="text-xs text-gray-600">
                                      {shift.check_in_time} - {shift.check_out_time}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Weekend Configuration */}
                        <div className="bg-white border-2 border-gray-200 rounded-none p-4">
                          <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-purple-500" />
                            Weekend Days
                          </h4>
                          <div className="grid grid-cols-7 gap-2">
                            {[
                              "Sunday",
                              "Monday",
                              "Tuesday",
                              "Wednesday",
                              "Thursday",
                              "Friday",
                              "Saturday",
                            ].map((day) => (
                              <button
                                key={day}
                                onClick={() => {
                                  const isSelected =
                                    settings.weekendDays.includes(day);
                                  handleSettingChange(
                                    "weekendDays",
                                    isSelected
                                      ? settings.weekendDays.filter((d) => d !== day)
                                      : [...settings.weekendDays, day]
                                  );
                                }}
                                className={`px-3 py-2 rounded-none text-xs font-semibold transition-all ${settings.weekendDays.includes(day)
                                  ? "bg-purple-600 text-white"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                  }`}
                              >
                                {day.slice(0, 3)}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Security Settings */}
                        {/* <div className="bg-white border-2 border-gray-200 rounded-none p-4">
                          <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <Lock className="w-5 h-5 text-red-500" />
                            Security & Access
                          </h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-gray-700">
                                  Require Check-in Photo
                                </p>
                                <p className="text-xs text-gray-600">
                                  Employee must take selfie during check-in
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                              </label>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-gray-700">
                                  Two-Factor Authentication
                                </p>
                                <p className="text-xs text-gray-600">
                                  Require OTP for attendance marking
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                              </label>
                            </div>
                          </div>
                        </div> */}
                      </div>
                    )}
                    {/* Save & Reset Buttons */}
                    <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-end gap-3">
                      <button
                        onClick={handleReset}
                        className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-none text-sm font-bold hover:bg-gray-200 transition-all flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Reset Defaults
                      </button>
                      <ActionGuard permission="attendance_settings" module="Attendance Management" type="update">
                        <button
                          onClick={handleSave}
                          disabled={isUpdating}
                          className="px-10 py-2.5 bg-[#FF7B1D] text-white rounded-none text-sm font-bold hover:bg-[#e66a15] shadow-lg shadow-orange-200 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                          {isUpdating ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          Save Changes
                        </button>
                      </ActionGuard>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox for Image Preview */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedImage(null)}>
          <div className="bg-white rounded-none overflow-hidden shadow-2xl max-w-lg w-full relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="absolute top-4 right-4 z-10">
              <button onClick={() => setSelectedImage(null)} className="p-2 bg-black/50 hover:bg-black/80 rounded-full text-white backdrop-blur-md transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <img src={selectedImage.url} alt="Reference" className="w-full aspect-square object-cover scale-x-[-1]" />
            <div className="p-6 bg-gradient-to-b from-white to-gray-50">
              <h3 className="font-black text-xl text-gray-900 mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-orange-500" />
                Check-in Snapshot
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-none border border-gray-100">
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Timestamp</p>
                  <p className="text-sm font-semibold text-gray-800">{selectedImage.time || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-none border border-gray-100">
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">IP Address</p>
                  <p className="text-sm font-semibold text-gray-800">{selectedImage.ip || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee Detail Modal */}
      {selectedEmployeeForDetail && (
        <div className="fixed inset-0 z-40 flex items-center justify-end bg-black/40 backdrop-blur-sm" onClick={() => setSelectedEmployeeForDetail(null)}>
          <div className="bg-white h-full w-full max-w-md shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                {selectedEmployeeForDetail.selfie ? (
                  <img src={selectedEmployeeForDetail.selfie} alt="" className="w-10 h-10 rounded-none object-cover border border-orange-200" />
                ) : (
                  <div className="w-10 h-10 rounded-none bg-orange-100 flex items-center justify-center text-orange-600">
                    {selectedEmployeeForDetail.employee_name?.charAt(0)}
                  </div>
                )}
                <div>
                  {selectedEmployeeForDetail.employee_name}
                  <p className="text-xs text-gray-500 font-medium">{selectedEmployeeForDetail.emp_uid}</p>
                </div>
              </h2>
              <button onClick={() => setSelectedEmployeeForDetail(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-none border border-green-100">
                  <p className="text-xs font-bold text-green-600 uppercase mb-1">Status Today</p>
                  <p className="text-2xl font-black text-green-700 capitalize">{selectedEmployeeForDetail.status || 'Present'}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-none border border-orange-100">
                  <p className="text-xs font-bold text-orange-600 uppercase mb-1">Total Hours</p>
                  <p className="text-2xl font-black text-orange-700">{selectedEmployeeForDetail.work_hours || '0h 0m'}</p>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="font-bold text-gray-800 mb-4">Today's Timeline</h3>
                <div className="relative border-l-2 border-gray-200 ml-3 space-y-6">
                  <div className="relative pl-6">
                    <div className="absolute w-3 h-3 bg-green-500 rounded-full -left-[7px] top-1.5 ring-4 ring-white"></div>
                    <p className="text-sm font-bold text-gray-800">Checked In</p>
                    <p className="text-xs text-gray-500">
                      {selectedEmployeeForDetail.check_in || 'N/A'}
                      {selectedEmployeeForDetail.check_in_method && ` • via ${selectedEmployeeForDetail.check_in_method.toUpperCase()}`}
                    </p>
                  </div>
                  {selectedEmployeeForDetail.check_out && (
                    <div className="relative pl-6">
                      <div className="absolute w-3 h-3 bg-red-500 rounded-full -left-[7px] top-1.5 ring-4 ring-white"></div>
                      <p className="text-sm font-bold text-gray-800">Checked Out</p>
                      <p className="text-xs text-gray-500">{selectedEmployeeForDetail.check_out}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Info (Placeholder) */}
              <div className="bg-gray-50 rounded-none p-4 border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-3 text-sm">Additional Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Department</span>
                    <span className="font-medium text-gray-900">{selectedEmployeeForDetail.department_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Network IP</span>
                    <span className="font-mono font-medium text-gray-900">{selectedEmployeeForDetail.ip_address || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
