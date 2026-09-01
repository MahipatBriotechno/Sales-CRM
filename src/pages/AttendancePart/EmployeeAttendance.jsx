import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

import DashboardLayout from "../../components/DashboardLayout";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useSelector } from "react-redux";
import {
  useMarkAttendanceMutation,
  useGetEmployeeAttendanceQuery,
  useGetDashboardStatsQuery,
  useCheckOutMutation,
  useGetAttendanceSettingsQuery
} from "../../store/api/attendanceApi";
import { toast } from "react-hot-toast";
import EmptyState from "../../components/common/EmptyState";
import { FiHome, FiEye } from "react-icons/fi";

import {
  Calendar,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Timer,
  TrendingUp,
  Wifi,
  QrCode,
  Camera,
  X,
  Zap,
  Activity,
  Target,
  MapPin,
  Image as ImageIcon,
  Home,
  ClipboardList,
  FileText,
  Briefcase,
  LogOut,
  Filter,
  Sun,
  Moon,
  CloudSun
} from "lucide-react";
import ActionGuard from "../../components/common/ActionGuard";
import NumberCard from "../../components/NumberCard";

// ─── Helper: Time-based greeting ───
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good Morning", icon: <Sun size={20} className="text-yellow-500" /> };
  if (hour < 17) return { text: "Good Afternoon", icon: <CloudSun size={20} className="text-orange-400" /> };
  return { text: "Good Evening", icon: <Moon size={20} className="text-indigo-400" /> };
};

// ─── Helper: Format seconds to HH:MM:SS ───
const formatDuration = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

// ─── Helper: Convert 24hr time to 12hr format ───
const formatTime12hr = (timeStr) => {
  if (!timeStr || timeStr === '-') return timeStr;
  const parts = timeStr.split(':');
  let h = parseInt(parts[0], 10);
  const m = parts[1] || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
};

// ─── Helper: Format work hours text ───
const formatWorkHoursText = (timeStr, checkIn, checkOut) => {
  if (timeStr === '00:00' && checkIn && checkOut && checkOut !== '-') {
    const start = new Date(`1970-01-01T${checkIn}`);
    const end = new Date(`1970-01-01T${checkOut}`);
    if (!isNaN(start) && !isNaN(end)) {
      const diff = (end - start) / 1000 / 60;
      const work_minutes = diff > 0 ? diff : 0;
      const h = Math.floor(work_minutes / 60);
      const m = Math.round(work_minutes % 60);
      return `${h} hrs ${m} mins`;
    }
  }

  if (!timeStr || timeStr === '-' || timeStr === '00:00') return '0 hrs 0 mins';
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  return `${h} hrs ${m} mins`;
};

// ─── Helper: Get month name ───
const getMonthName = (monthIndex) => {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return months[monthIndex];
};

// ─── Helper: Get day name short ───
const getDayShort = (date) => {
  return date.toLocaleDateString("en-US", { weekday: "short" });
};

export default function EmployeeAttendance() {
  // ─── Tab & Page State ───
  const [activeTab, setActiveTab] = useState("dashboard");
  const [userIP, setUserIP] = useState(null);
  const [isOnCompanyNetwork, setIsOnCompanyNetwork] = useState(false);
  const [showSelfieCapture, setShowSelfieCapture] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [detailsModal, setDetailsModal] = useState(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [activeCheckInMethod, setActiveCheckInMethod] = useState([]);
  const [showCheckOutConfirm, setShowCheckOutConfirm] = useState(false);
  const [checkOutRecordId, setCheckOutRecordId] = useState(null);

  // ─── Month Selector State ───
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // ─── Records Filters ───
  const [recordsStatusFilter, setRecordsStatusFilter] = useState("all");
  const [recordsPage, setRecordsPage] = useState(1);
  const recordsPerPage = 10;

  // ─── Live Timer ───
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);

  const user = useSelector((state) => state.auth.user);
  const [searchParams] = useSearchParams();
  const urlQrSecret = searchParams.get("secret");
  const isEmployee = user?.role === "Employee";
  const employeeId = isEmployee ? user._id : null;

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const { data: settingsData } = useGetAttendanceSettingsQuery();
  const settings = settingsData?.data;

  const companyIPRange = "192.168.1.";

  // ─── Network Check ───
  useEffect(() => {
    if (settings?.wifiEnabled && settings?.allowedIPs) {
      setIsOnCompanyNetwork(true);
    } else if (settings && !settings.wifiEnabled) {
      setIsOnCompanyNetwork(true);
    }
  }, [settings]);

  // ─── QR Scanner ───
  useEffect(() => {
    let scanner = null;
    if (showQRScanner) {
      scanner = new Html5QrcodeScanner("reader", {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      });

      scanner.render(
        (decodedText) => {
          try {
            const data = JSON.parse(decodedText);
            if (data.type === 'attendance' && data.secret) {
              setScannedData(data);
              setShowQRScanner(false);
              scanner.clear();
              toast.success("QR Code scan successful!");
              handleCheckInClick(user, { qrSecret: data.secret });
            } else {
              toast.error("Invalid QR Code for attendance");
            }
          } catch (e) {
            toast.error("Could not parse QR Code data");
          }
        },
        (error) => {
          // ignore scan errors
        }
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(err => console.error("Failed to clear scanner", err));
      }
    };
  }, [showQRScanner]);

  // ─── Data Fetching ───
  const { data: attendanceResponse, isLoading: isAttendanceLoading } = useGetEmployeeAttendanceQuery(employeeId, {
    skip: !employeeId
  });

  const { data: statsResponse } = useGetDashboardStatsQuery(undefined, {
    skip: isEmployee
  });

  const [markAttendance, { isLoading: isMarking }] = useMarkAttendanceMutation();
  const [checkOut, { isLoading: isCheckingOut }] = useCheckOutMutation();

  const myRecords = attendanceResponse?.data || [];
  const myStats = attendanceResponse?.stats || {};

  // ─── URL QR Secret auto check-in ───
  useEffect(() => {
    if (urlQrSecret && user && settings && !scannedData) {
      setScannedData({ secret: urlQrSecret });
      handleCheckInClick(user, { secret: urlQrSecret });
    }
  }, [urlQrSecret, user, settings]);

  // ─── IP Simulation ───
  useEffect(() => {
    const simulatedIP = `192.168.1.${Math.floor(Math.random() * 255)}`;
    setUserIP(simulatedIP);
    setIsOnCompanyNetwork(simulatedIP.startsWith(companyIPRange));
  }, []);

  // ─── Today's Record ───
  const todayStr = new Date().toLocaleDateString('en-CA');
  const todayRecord = useMemo(() => {
    return myRecords.find(r => {
      const rDate = new Date(r.date).toLocaleDateString('en-CA');
      return rDate === todayStr;
    });
  }, [myRecords, todayStr]);

  const hasCheckedOut = todayRecord?.check_out && todayRecord.check_out !== '-';

  // ─── Live Timer Effect ───
  useEffect(() => {
    if (todayRecord && !hasCheckedOut && todayRecord.check_in) {
      const calcElapsed = () => {
        const now = new Date();
        const [h, m, s] = todayRecord.check_in.split(':').map(Number);
        const checkInTime = new Date();
        checkInTime.setHours(h, m, s || 0, 0);
        const diff = Math.floor((now - checkInTime) / 1000);
        setElapsedSeconds(diff > 0 ? diff : 0);
      };

      calcElapsed();
      timerRef.current = setInterval(calcElapsed, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else {
      setElapsedSeconds(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [todayRecord, hasCheckedOut]);

  // ─── Monthly Filtered Stats ───
  const monthlyRecords = useMemo(() => {
    return myRecords.filter(r => {
      const d = new Date(r.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [myRecords, selectedMonth, selectedYear]);

  const monthlyStats = useMemo(() => {
    const present = monthlyRecords.filter(r => r.status === 'present').length;
    const late = monthlyRecords.filter(r => r.status === 'late').length;
    const absent = monthlyRecords.filter(r => r.status === 'absent').length;
    const leave = monthlyRecords.filter(r => r.status === 'leave').length;
    const halfDay = monthlyRecords.filter(r => r.status === 'half-day').length;
    const total = monthlyRecords.length;
    const rate = total > 0 ? (((present + late + halfDay) / total) * 100).toFixed(1) : "0.0";

    return { present: present + late, absent, leave, halfDay, total, rate };
  }, [monthlyRecords]);

  // ─── Weekly Timeline Data ───
  const weeklyTimeline = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA');
      const record = myRecords.find(r => new Date(r.date).toLocaleDateString('en-CA') === dateStr);
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isToday = dateStr === todayStr;

      days.push({
        date: d,
        dateStr,
        dayShort: getDayShort(d),
        dayNum: d.getDate(),
        record,
        isWeekend,
        isToday
      });
    }
    return days;
  }, [myRecords, todayStr]);

  // ─── Records Tab: Filtered & Paginated ───
  const filteredRecords = useMemo(() => {
    let filtered = [...myRecords];
    if (recordsStatusFilter !== "all") {
      filtered = filtered.filter(r => r.status === recordsStatusFilter);
    }
    return filtered;
  }, [myRecords, recordsStatusFilter]);

  const paginatedRecords = useMemo(() => {
    const start = (recordsPage - 1) * recordsPerPage;
    return filteredRecords.slice(start, start + recordsPerPage);
  }, [filteredRecords, recordsPage]);

  const totalRecordPages = Math.ceil(filteredRecords.length / recordsPerPage);

  // ─── Month Navigation ───
  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };
  const nextMonth = () => {
    const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();
    if (isCurrentMonth) return;
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  // ─── Camera & Location ───
  useEffect(() => {
    if (showSelfieCapture) {
      startCamera();
      getCurrentLocation();
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [showSelfieCapture]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      toast.success("Camera and Microphone connected", { icon: '🎥' });
    } catch (error) {
      console.error("Camera/Mic access error:", error);
      toast.error("Unable to access camera or microphone. Both are required for check-in.");
    }
  };

  const getCurrentLocation = () => {
    setLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
          setLoadingLocation(false);
        },
        (error) => {
          console.error("Location error:", error);
          setLoadingLocation(false);
        }
      );
    }
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL("image/jpeg");
      setCapturedImage(imageData);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const closeSelfieCapture = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setShowSelfieCapture(false);
    setSelectedEmployee(null);
    setCapturedImage(null);
    setLocation(null);
    setScannedData(null);
    setActiveCheckInMethod([]);
  };

  // ─── Check-In Logic ───
  const handleCheckInClick = (employee, scanData = null, skipQR = false) => {
    if (settings?.wifiEnabled && !isOnCompanyNetwork) {
      alert(`Please connect to company WiFi (${settings?.wifiSSID}) network to check in`);
      return;
    }

    const usingMethods = [];
    if (settings?.wifiEnabled) usingMethods.push('WiFi');

    if (settings?.qrCodeEnabled && !scannedData && !scanData && !skipQR) {
      setShowQRScanner(true);
      return;
    }

    if (scanData || scannedData) {
      usingMethods.push('QR');
    }

    if (settings?.gpsEnabled) {
      usingMethods.push('GPS');
      getCurrentLocation();
    }

    setActiveCheckInMethod(usingMethods);
    setSelectedEmployee(employee);
    setShowSelfieCapture(true);
    startCamera();
  };

  const handleCheckIn = async (employee, selfieData, locationData) => {
    try {
      const response = await markAttendance({
        employee_id: user._id,
        selfie: selfieData,
        latitude: locationData?.latitude,
        longitude: locationData?.longitude,
        ip_address: userIP,
        check_in_method: activeCheckInMethod.join(' + ') || 'Manual',
        qr_secret: scannedData?.secret
      }).unwrap();

      toast.success(response.message || "Attendance marked successfully! ✅");
      setScannedData(null);
      setActiveCheckInMethod([]);
      setActiveTab("dashboard");
    } catch (error) {
      console.error("Error marking attendance:", error);
      toast.error(error.data?.message || "Failed to mark attendance");
    }
  };

  // ─── Check-Out with Confirmation ───
  const handleCheckOutRequest = (recordId) => {
    setCheckOutRecordId(recordId);
    setShowCheckOutConfirm(true);
  };

  const handleCheckOutConfirm = async () => {
    if (!checkOutRecordId) return;
    try {
      await checkOut({ id: checkOutRecordId }).unwrap();
      toast.success("Checked out successfully! 👋");
      setShowCheckOutConfirm(false);
      setCheckOutRecordId(null);
    } catch (error) {
      toast.error(error.data?.message || "Failed to check out");
    }
  };

  // ─── Status Badge Helper ───
  const getStatusBadge = (status) => {
    const badges = {
      present: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200", label: "Present", icon: CheckCircle },
      absent: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200", label: "Absent", icon: XCircle },
      late: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200", label: "Late", icon: AlertCircle },
      "half-day": { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200", label: "Half Day", icon: Timer },
      leave: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", label: "Leave", icon: Briefcase },
    };
    return badges[status] || badges.present;
  };

  // ─── Timeline Icon/Color Helper ───
  const getTimelineStyle = (day) => {
    if (day.isToday && !day.record) return { icon: "⏳", color: "text-orange-500", bg: "bg-orange-50", label: "Pending" };
    if (day.isWeekend && !day.record) return { icon: "🏖️", color: "text-gray-400", bg: "bg-gray-50", label: "Weekend" };
    if (!day.record) return { icon: "⬜", color: "text-gray-400", bg: "bg-gray-50", label: "No Record" };
    const s = day.record.status;
    if (s === "present") return { icon: "✅", color: "text-green-600", bg: "bg-green-50", label: "Present" };
    if (s === "late") return { icon: "⚠️", color: "text-orange-600", bg: "bg-orange-50", label: "Late" };
    if (s === "absent") return { icon: "❌", color: "text-red-600", bg: "bg-red-50", label: "Absent" };
    if (s === "leave") return { icon: "🏖️", color: "text-blue-600", bg: "bg-blue-50", label: "Leave" };
    if (s === "half-day") return { icon: "⏸️", color: "text-yellow-600", bg: "bg-yellow-50", label: "Half Day" };
    return { icon: "✅", color: "text-green-600", bg: "bg-green-50", label: "Present" };
  };

  const greeting = getGreeting();

  return (
    <DashboardLayout>
      <div className="p-0 bg-white min-h-screen text-black">
        {/* ═══════════════════ TOP HEADER ═══════════════════ */}
        <nav className="bg-white border-b my-3">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">My Attendance</h1>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                  <FiHome className="text-gray-700 text-sm" />
                  <span className="text-gray-600">HRM /</span>
                  <span className="text-[#FF7B1D] font-medium">Attendance</span>
                </p>
              </div>
            </div>

            {/* ─── Tab Navigation ─── */}
            <div className="flex items-center gap-1 mt-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all duration-200 border-b-2 -mb-[1px] ${
                  activeTab === "dashboard"
                    ? "border-[#FF7B1D] text-[#FF7B1D]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Activity size={16} />
                Dashboard
              </button>
              <button
                onClick={() => { setActiveTab("records"); setRecordsPage(1); }}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all duration-200 border-b-2 -mb-[1px] ${
                  activeTab === "records"
                    ? "border-[#FF7B1D] text-[#FF7B1D]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <ClipboardList size={16} />
                Attendance Log
              </button>
            </div>
          </div>
        </nav>

        {/* ═══════════════════ PAGE CONTENT ═══════════════════ */}
        <div className="px-4 mt-2 py-0">

          {/* ==================== DASHBOARD TAB ==================== */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">

              {/* ─── Greeting Header ─── */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                    {greeting.icon}
                    {greeting.text}, <span className="text-[#FF7B1D]">{user?.employee_name || user?.username}</span>
                  </h1>
                  <p className="text-gray-500 flex items-center gap-2 mt-1">
                    <Calendar size={16} />
                    {new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                {todayRecord && !hasCheckedOut && (
                  <div className="flex items-center gap-3 bg-green-50 px-4 py-2 rounded-sm border border-green-200">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-sm font-bold text-green-800 uppercase tracking-wider">On Duty</span>
                  </div>
                )}
              </div>

              {/* ═══════════ TODAY'S SMART STATUS CARD ═══════════ */}
              {(() => {
                // State 1: Not Checked In
                if (!todayRecord && !isAttendanceLoading) {
                  return (
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-sm shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-full">
                          <MapPin className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Check-In Pending</h3>
                          <p className="text-sm text-gray-600 mt-1">Start your day by marking your attendance.</p>
                        </div>
                      </div>
                      <ActionGuard permission="attendance_mark" module="Attendance Management" type="create">
                        <button
                          onClick={() => setShowCheckInModal(true)}
                          className="w-full md:w-auto px-8 py-3.5 bg-gradient-to-r from-[#FF7B1D] to-orange-500 text-white rounded-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          <Zap className="w-5 h-5" />
                          MARK ATTENDANCE
                        </button>
                      </ActionGuard>
                    </div>
                  );
                }

                // State 2: On Duty (Checked In, Not Checked Out)
                if (todayRecord && !hasCheckedOut) {
                  return (
                    <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-sm shadow-sm">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                        <div className="flex items-center gap-4">
                          <div className="p-2.5 bg-green-100 rounded-full animate-pulse">
                            <Timer className="w-8 h-8 text-green-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">Currently On Duty</h3>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <Clock size={14} className="text-green-500" />
                                Check-In: <span className="font-bold">{formatTime12hr(todayRecord.check_in)}</span>
                              </p>
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <Wifi size={14} className="text-blue-500" />
                                Method: <span className="font-bold">{todayRecord.check_in_method}</span>
                              </p>
                              {todayRecord.status === 'late' && (
                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-sm border border-orange-200">
                                  LATE
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Live Timer */}
                          <div className="bg-white px-5 py-3 rounded-sm border border-green-200 shadow-sm text-center">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Working Time</p>
                            <p className="text-2xl font-mono font-bold text-green-600 tabular-nums">
                              {formatDuration(elapsedSeconds)}
                            </p>
                          </div>

                          <button
                              onClick={() => {
                                const totalShiftSeconds = (user?.working_hours || 9) * 3600;
                                if (elapsedSeconds < totalShiftSeconds) {
                                  toast.error("Shift not yet completed. You cannot check out early.");
                                  return;
                                }
                                handleCheckOutRequest(todayRecord.id);
                              }}
                              disabled={isCheckingOut}
                              className={`px-6 py-3 rounded-sm font-bold shadow-lg flex items-center gap-2 transition-all ${
                                elapsedSeconds < (user?.working_hours || 9) * 3600
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-red-500 text-white hover:bg-red-600 active:scale-95"
                              }`}
                            >
                              {isCheckingOut ? (
                                <div className="w-5 h-5 border-2 border-current border-t-transparent animate-spin rounded-full" />
                              ) : (
                                <LogOut className="w-5 h-5" />
                              )}
                              {elapsedSeconds < (user?.working_hours || 9) * 3600 ? "SHIFT PENDING" : "CHECK OUT"}
                            </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                // State 3: Day Completed
                if (todayRecord && hasCheckedOut) {
                  return (
                    <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-sm shadow-sm">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                        <div className="flex items-center gap-4">
                          <div className="p-2.5 bg-green-100 rounded-full">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">Today's Attendance Complete! 🎉</h3>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <Clock size={14} className="text-green-500" />
                                Check-In: <span className="font-bold">{formatTime12hr(todayRecord.check_in)}</span>
                              </p>
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <LogOut size={14} className="text-red-500" />
                                Check-Out: <span className="font-bold">{formatTime12hr(todayRecord.check_out)}</span>
                              </p>
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <Zap size={14} className="text-blue-500" />
                                Work Hours: <span className="font-bold text-blue-600">{formatWorkHoursText(todayRecord.work_hours, todayRecord.check_in, todayRecord.check_out)}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white px-5 py-2 rounded-sm border border-green-200 shadow-sm">
                          <span className="text-green-600 font-bold text-sm tracking-wide">GREAT JOB! 🌟</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                return null;
              })()}

              {/* ═══════════ MONTHLY STATS WITH MONTH SELECTOR ═══════════ */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#FF7B1D]" />
                    Monthly Summary
                  </h2>
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-sm border border-gray-200">
                    <button onClick={prevMonth} className="p-1 hover:bg-gray-200 rounded transition-colors">
                      <ChevronLeft size={16} className="text-gray-600" />
                    </button>
                    <span className="text-sm font-bold text-gray-700 min-w-[130px] text-center">
                      {getMonthName(selectedMonth)} {selectedYear}
                    </span>
                    <button
                      onClick={nextMonth}
                      disabled={selectedMonth === now.getMonth() && selectedYear === now.getFullYear()}
                      className="p-1 hover:bg-gray-200 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronRight size={16} className="text-gray-600" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <NumberCard
                    title="Present Days"
                    number={monthlyStats.present}
                    icon={<CheckCircle className="text-green-600" size={24} />}
                    iconBgColor="bg-green-100"
                    lineBorderClass="border-green-500"
                  />
                  <NumberCard
                    title="Absent Days"
                    number={monthlyStats.absent}
                    icon={<UserX className="text-red-600" size={24} />}
                    iconBgColor="bg-red-100"
                    lineBorderClass="border-red-500"
                  />
                  <NumberCard
                    title="Leave Days"
                    number={monthlyStats.leave}
                    icon={<Briefcase className="text-orange-600" size={24} />}
                    iconBgColor="bg-orange-100"
                    lineBorderClass="border-orange-500"
                  />
                  <NumberCard
                    title="Attendance Rate"
                    number={`${monthlyStats.rate}%`}
                    icon={<TrendingUp className="text-blue-600" size={24} />}
                    iconBgColor="bg-blue-100"
                    lineBorderClass="border-blue-500"
                  />
                </div>
              </div>

              {/* ═══════════ WEEKLY ACTIVITY TIMELINE ═══════════ */}
              <div className="bg-white rounded-sm shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#FF7B1D]" />
                    Last 7 Days
                  </h2>
                  <button
                    onClick={() => { setActiveTab("records"); setRecordsPage(1); }}
                    className="text-sm text-[#FF7B1D] font-semibold hover:underline flex items-center gap-1"
                  >
                    View All Logs
                    <ChevronRight size={14} />
                  </button>
                </div>

                <div className="space-y-2">
                  {weeklyTimeline.map((day, index) => {
                    const style = getTimelineStyle(day);
                    const r = day.record;
                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-4 p-3 rounded-sm border transition-colors ${
                          day.isToday ? "border-orange-200 bg-orange-50/30" : "border-gray-100 hover:bg-gray-50"
                        }`}
                      >
                        {/* Day Indicator */}
                        <div className={`w-12 h-12 rounded-sm flex flex-col items-center justify-center ${style.bg} shrink-0`}>
                          <span className="text-[10px] font-bold text-gray-500 uppercase">{day.dayShort}</span>
                          <span className={`text-lg font-bold ${style.color}`}>{day.dayNum}</span>
                        </div>

                        {/* Status */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{style.icon}</span>
                            <span className={`text-sm font-bold ${style.color}`}>{style.label}</span>
                            {day.isToday && (
                              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-sm border border-orange-200">
                                TODAY
                              </span>
                            )}
                          </div>
                          {r && (
                            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                              <Wifi size={10} />
                              {r.check_in_method}
                            </p>
                          )}
                        </div>

                        {/* Time Info */}
                        <div className="text-right shrink-0">
                          {r ? (
                            <>
                              <p className="text-sm font-bold text-gray-900">{formatTime12hr(r.check_in)} — {r.check_out && r.check_out !== '-' ? formatTime12hr(r.check_out) : '...'}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {r.work_hours && r.work_hours !== '00:00' ? formatWorkHoursText(r.work_hours, r.check_in, r.check_out) : (r.check_out && r.check_out !== '-' ? formatWorkHoursText('00:00', r.check_in, r.check_out) : "Working...")}
                              </p>
                            </>
                          ) : (
                            <p className="text-xs text-gray-400">—</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* ==================== ATTENDANCE LOG TAB ==================== */}
          {activeTab === "records" && (
            <div className="space-y-6">
              {/* Header & Filters */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Attendance Log</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {filteredRecords.length} record{filteredRecords.length !== 1 ? "s" : ""} found
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Status Filter */}
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-sm border border-gray-200">
                    <Filter size={14} className="text-gray-500" />
                    <select
                      value={recordsStatusFilter}
                      onChange={(e) => { setRecordsStatusFilter(e.target.value); setRecordsPage(1); }}
                      className="text-sm bg-transparent border-none outline-none font-semibold text-gray-700 cursor-pointer"
                    >
                      <option value="all">All Status</option>
                      <option value="present">Present</option>
                      <option value="late">Late</option>
                      <option value="absent">Absent</option>
                      <option value="half-day">Half Day</option>
                      <option value="leave">Leave</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Summary Bar */}
              {filteredRecords.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 bg-gray-50 px-4 py-3 rounded-sm border border-gray-200">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Summary:</span>
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">
                    {myRecords.filter(r => r.status === 'present').length} Present
                  </span>
                  <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100">
                    {myRecords.filter(r => r.status === 'late').length} Late
                  </span>
                  <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100">
                    {myRecords.filter(r => r.status === 'absent').length} Absent
                  </span>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                    {myRecords.filter(r => r.status === 'leave').length} Leave
                  </span>
                  <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded border border-yellow-100">
                    {myRecords.filter(r => r.status === 'half-day').length} Half Day
                  </span>
                </div>
              )}

              {/* Table */}
              <div className="bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-[#FF7B1D] to-orange-500">
                      <tr>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-white uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-center text-[10px] font-bold text-white uppercase tracking-wider">Check In</th>
                        <th className="px-6 py-4 text-center text-[10px] font-bold text-white uppercase tracking-wider">Method</th>
                        <th className="px-6 py-4 text-center text-[10px] font-bold text-white uppercase tracking-wider">Check Out</th>
                        <th className="px-6 py-4 text-center text-[10px] font-bold text-white uppercase tracking-wider">Work Hours</th>
                        <th className="px-6 py-4 text-center text-[10px] font-bold text-white uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-center text-[10px] font-bold text-white uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedRecords.length > 0 ? (
                        paginatedRecords.map((record) => {
                          const badge = getStatusBadge(record.status);
                          const StatusIcon = badge.icon;
                          return (
                            <tr key={record.id} className="hover:bg-gray-50 transition-all duration-200 group">
                              <td className="px-6 py-4 text-sm font-bold text-gray-900">
                                {new Date(record.date).toLocaleDateString("en-US", {
                                  year: 'numeric', month: 'short', day: 'numeric'
                                })}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <Clock className="w-4 h-4 text-orange-400" />
                                  <span className="text-gray-900 font-semibold">{formatTime12hr(record.check_in)}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 rounded-sm text-[10px] font-bold">
                                  <Wifi className="w-3.5 h-3.5" />
                                  {record.check_in_method}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center text-gray-900 font-semibold">{formatTime12hr(record.check_out)}</td>
                              <td className="px-6 py-4 text-center">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-600 border border-orange-100 rounded-sm text-[10px] font-bold">
                                  <Timer className="w-3.5 h-3.5" />
                                  {formatWorkHoursText(record.work_hours, record.check_in, record.check_out)}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 ${badge.bg} ${badge.text} rounded-sm text-[10px] font-bold border ${badge.border}`}>
                                  <StatusIcon className="w-3.5 h-3.5" />
                                  {badge.label}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() => setDetailsModal(record)}
                                  className="p-2 text-orange-500 hover:bg-orange-50 rounded-sm transition-all border border-transparent hover:border-orange-200"
                                  title="View Details"
                                >
                                  <FiEye className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="7" className="py-20">
                            <EmptyState
                              title="No Records Found"
                              description="No matching records found. Try changing the filter."
                            />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalRecordPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <p className="text-xs text-gray-500 font-medium">
                      Page {recordsPage} of {totalRecordPages} • Showing {paginatedRecords.length} of {filteredRecords.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setRecordsPage(p => Math.max(1, p - 1))}
                        disabled={recordsPage === 1}
                        className="p-2 rounded-sm border border-gray-200 hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      {Array.from({ length: Math.min(5, totalRecordPages) }, (_, i) => {
                        let pageNum;
                        if (totalRecordPages <= 5) {
                          pageNum = i + 1;
                        } else if (recordsPage <= 3) {
                          pageNum = i + 1;
                        } else if (recordsPage >= totalRecordPages - 2) {
                          pageNum = totalRecordPages - 4 + i;
                        } else {
                          pageNum = recordsPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setRecordsPage(pageNum)}
                            className={`w-8 h-8 rounded-sm text-sm font-bold transition-colors ${
                              recordsPage === pageNum
                                ? "bg-[#FF7B1D] text-white"
                                : "border border-gray-200 hover:bg-white text-gray-600"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setRecordsPage(p => Math.min(totalRecordPages, p + 1))}
                        disabled={recordsPage === totalRecordPages}
                        className="p-2 rounded-sm border border-gray-200 hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════ CHECK-IN MODAL (Simplified) ═══════════════════ */}
        {showCheckInModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="bg-white rounded-sm w-full max-w-md overflow-hidden relative shadow-2xl animate-in fade-in zoom-in duration-300">
              <div className="p-5 bg-gradient-to-r from-[#FF7B1D] to-orange-500 text-white relative">
                <button
                  onClick={() => setShowCheckInModal(false)}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-all duration-300"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 w-10 h-10 rounded-sm flex items-center justify-center backdrop-blur-sm shadow-sm">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight leading-none">Check-In Options</h2>
                    <p className="text-orange-100 font-semibold text-xs mt-1">Mark your attendance</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4 bg-white">
                {/* Verification Status Indicators */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {settings?.wifiEnabled && (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-bold border ${
                      isOnCompanyNetwork
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }`}>
                      <Wifi size={12} />
                      WiFi {isOnCompanyNetwork ? "✅" : "❌"}
                    </span>
                  )}
                  {settings?.qrCodeEnabled && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      <QrCode size={12} />
                      QR Required
                    </span>
                  )}
                  {settings?.gpsEnabled && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      <MapPin size={12} />
                      GPS On
                    </span>
                  )}
                </div>

                {/* QR Scan Option */}
                {settings?.qrCodeEnabled && (
                  <button
                    onClick={() => {
                      setShowCheckInModal(false);
                      setShowQRScanner(true);
                    }}
                    className="w-full flex items-center gap-4 p-4 bg-purple-50 hover:bg-purple-100 border border-purple-100 rounded-sm transition-all duration-300 group"
                  >
                    <div className="bg-white p-3 rounded-sm shadow-sm group-hover:bg-purple-500 transition-all duration-300 border border-purple-50">
                      <QrCode className="w-6 h-6 text-purple-600 group-hover:text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-900 text-lg tracking-tight">Scan QR Code</p>
                      <p className="text-xs text-purple-500 font-semibold mt-0.5">Scan the office QR code to mark attendance</p>
                    </div>
                  </button>
                )}

                {/* Selfie + GPS Option */}
                <button
                  onClick={() => {
                    setShowCheckInModal(false);
                    handleCheckInClick(user, null, true);
                  }}
                  className="w-full flex items-center gap-4 p-4 bg-orange-50 hover:bg-orange-100 border border-orange-100 rounded-sm transition-all duration-300 group"
                >
                  <div className="bg-white p-3 rounded-sm shadow-sm group-hover:bg-[#FF7B1D] transition-all duration-300 border border-orange-50">
                    <Camera className="w-6 h-6 text-[#FF7B1D] group-hover:text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900 text-lg tracking-tight">Selfie & Location</p>
                    <p className="text-xs text-orange-500 font-semibold mt-0.5">Take a selfie with your location to mark attendance</p>
                  </div>
                </button>

                <button
                  onClick={() => setShowCheckInModal(false)}
                  className="w-full py-2.5 text-gray-400 font-bold text-xs uppercase tracking-wider hover:text-red-500 transition-colors active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════ SELFIE CAPTURE MODAL ═══════════════════ */}
        {showSelfieCapture && selectedEmployee && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-sm shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="bg-gradient-to-r from-[#FF7B1D] to-orange-500 p-5 flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 animate-pulse"></div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="bg-white/20 p-2.5 rounded-sm backdrop-blur-sm">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Photo Verification
                    </h2>
                    <p className="text-orange-100 text-xs font-semibold mt-0.5">
                      {selectedEmployee.name || user?.employee_name} • Take your photo
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeSelfieCapture}
                  className="text-white hover:bg-white/20 p-3 rounded-full transition-all duration-300 relative z-10"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <div
                  className="relative bg-gray-950 rounded-sm overflow-hidden mb-5 border-2 border-orange-100 shadow-sm"
                  style={{ maxHeight: "50vh", minHeight: "250px" }}
                >
                  {!capturedImage ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover scale-x-[-1]"
                        style={{ maxHeight: "50vh", minHeight: "250px" }}
                      />
                      <div className="absolute inset-0 border border-white/20 rounded-sm pointer-events-none m-4"></div>
                      <canvas ref={canvasRef} className="hidden" />
                    </>
                  ) : (
                    <img
                      src={capturedImage}
                      alt="Captured"
                      className="w-full h-full object-cover"
                      style={{ maxHeight: "50vh" }}
                    />
                  )}
                </div>

                {/* Active methods display */}
                {activeCheckInMethod.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {activeCheckInMethod.map((method, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-sm text-xs font-bold border border-green-200">
                        <CheckCircle size={12} />
                        {method} ✅
                      </span>
                    ))}
                  </div>
                )}

                {location && (
                  <div className="bg-green-50 border border-green-200 rounded-sm p-3 mb-4 flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-sm">
                      <MapPin className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-xs">Location Captured ✅</p>
                      <p className="text-[10px] text-green-600 font-semibold mt-0.5">
                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)} • ±{location.accuracy.toFixed(0)}m
                      </p>
                    </div>
                  </div>
                )}

                {loadingLocation && (
                  <div className="bg-blue-50 border border-blue-100 rounded-sm p-3 mb-4 flex items-center gap-3 animate-pulse">
                    <div className="bg-blue-100 p-2 rounded-sm">
                      <MapPin className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-blue-800 font-bold text-xs">Detecting your location...</p>
                  </div>
                )}

                <div className="flex gap-3">
                  {!capturedImage ? (
                    <button
                      onClick={capturePhoto}
                      className="flex-1 bg-gradient-to-r from-[#FF7B1D] to-orange-500 text-white py-3.5 rounded-sm font-bold uppercase tracking-wider hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Camera className="w-5 h-5" />
                      Capture Photo
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={retakePhoto}
                        className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-sm font-bold uppercase tracking-wider hover:bg-gray-200 transition-all duration-300 active:scale-95 border border-gray-200"
                      >
                        Retake
                      </button>
                      <button
                        onClick={() => handleCheckIn(selectedEmployee, capturedImage, location)}
                        disabled={isMarking || (settings?.gpsEnabled && !location)}
                        className="flex-[2] bg-gradient-to-r from-green-500 to-green-600 text-white py-3.5 rounded-sm font-bold uppercase tracking-wider shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                      >
                        {isMarking ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                        ) : (
                          <CheckCircle className="w-5 h-5" />
                        )}
                        Confirm Check-In
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════ QR SCANNER MODAL ═══════════════════ */}
        {showQRScanner && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <div className="bg-white rounded-sm w-full max-w-lg overflow-hidden relative shadow-2xl animate-in zoom-in-95 fade-in duration-300">
              <div className="p-5 bg-gradient-to-r from-[#FF7B1D] to-orange-500 text-white flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-2.5 rounded-sm backdrop-blur-sm shadow-sm">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Scan QR Code</h2>
                    <p className="text-orange-100 text-xs font-semibold">Place the office QR code in front of the camera</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowQRScanner(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-all duration-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                <div id="reader" className="overflow-hidden rounded-sm border-2 border-orange-100 mb-5 bg-slate-50 min-h-[300px] shadow-inner flex items-center justify-center relative">
                </div>
                <div className="flex items-start gap-3 bg-orange-50 p-3 rounded-sm border border-orange-100 mb-5">
                  <div className="bg-orange-200 p-1.5 rounded-sm mt-0.5">
                    <Zap className="w-3.5 h-3.5 text-orange-700" />
                  </div>
                  <p className="text-xs text-gray-700 font-semibold leading-relaxed">
                    Align the office QR code within the frame. Once scanned, you will proceed to the photo verification step.
                  </p>
                </div>
                <button
                  onClick={() => setShowQRScanner(false)}
                  className="w-full py-3 bg-gray-50 text-gray-500 font-bold rounded-sm hover:bg-red-50 hover:text-red-500 transition-all duration-300 uppercase tracking-wider text-xs border border-gray-100 active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════ DETAILS MODAL ═══════════════════ */}
        {detailsModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-sm shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-300">
              <div className="bg-gradient-to-r from-[#FF7B1D] to-orange-500 p-5 flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative z-10">
                  <h2 className="text-lg font-bold text-white">
                    Attendance Details
                  </h2>
                  <p className="text-orange-100 font-semibold text-xs flex items-center gap-2 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {detailsModal.date}
                  </p>
                </div>
                <button
                  onClick={() => setDetailsModal(null)}
                  className="text-white hover:bg-white/20 p-2 rounded-full transition-all duration-300 relative z-10"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {detailsModal.selfie && (
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 text-xs uppercase tracking-wider flex items-center gap-2">
                      <Camera className="w-3.5 h-3.5 text-[#FF7B1D]" />
                      Verification Photo
                    </h3>
                    <img
                      src={detailsModal.selfie}
                      alt="Check-in selfie"
                      className="w-full max-w-md mx-auto rounded-sm shadow-md border border-orange-100"
                    />
                  </div>
                )}

                {!detailsModal.selfie && detailsModal.status !== "absent" && (
                  <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-sm p-10 text-center">
                    <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-semibold text-sm">No verification photo was captured</p>
                  </div>
                )}

                {detailsModal.location && (
                  <div className="bg-orange-50 border border-orange-100 rounded-sm p-4 flex items-center gap-4">
                    <div className="bg-orange-100 p-2.5 rounded-sm text-orange-600">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-xs">GPS Location</h3>
                      <p className="text-orange-600 font-semibold text-[11px] mt-0.5">
                        Lat: {detailsModal.location.latitude.toFixed(6)} • Long: {detailsModal.location.longitude.toFixed(6)}
                      </p>
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                        Accuracy: ±{detailsModal.location.accuracy.toFixed(0)}m
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-4 rounded-sm border border-gray-100">
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Check In</p>
                    <p className="font-bold text-gray-900 text-lg">{formatTime12hr(detailsModal.checkIn || detailsModal.check_in)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-sm border border-gray-100">
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Check Out</p>
                    <p className="font-bold text-gray-900 text-lg">{formatTime12hr(detailsModal.checkOut || detailsModal.check_out)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-sm border border-gray-100">
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Method</p>
                    <p className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <Wifi className="w-3.5 h-3.5 text-[#FF7B1D]" />
                      {detailsModal.check_in_method}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-sm border border-gray-100">
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Network IP</p>
                    <p className="font-bold text-gray-800 font-mono text-xs">{detailsModal.ip_address}</p>
                  </div>
                  <div className="bg-[#FF7B1D] p-5 rounded-sm col-span-2 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider mb-0.5">Total Work Hours</p>
                      <p className="font-bold text-white text-xl">{formatWorkHoursText(detailsModal.work_hours, detailsModal.checkIn || detailsModal.check_in, detailsModal.checkOut || detailsModal.check_out)}</p>
                    </div>
                    <Timer className="w-10 h-10 text-white/20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════ CHECK-OUT CONFIRMATION ═══════════════════ */}
        {showCheckOutConfirm && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-sm w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LogOut className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Check-Out?</h3>
                <p className="text-sm text-gray-500 mb-1">
                  Are you sure you want to check out?
                </p>
                {todayRecord && (
                  <p className="text-sm text-gray-500 mb-6">
                    Working Time: <span className="font-bold text-green-600">{formatDuration(elapsedSeconds)}</span>
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowCheckOutConfirm(false); setCheckOutRecordId(null); }}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-sm font-bold hover:bg-gray-200 transition-colors active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCheckOutConfirm}
                    disabled={isCheckingOut}
                    className="flex-1 py-3 bg-red-500 text-white rounded-sm font-bold hover:bg-red-600 transition-colors active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isCheckingOut ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                    ) : (
                      <LogOut className="w-4 h-4" />
                    )}
                    Yes, Check-Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
