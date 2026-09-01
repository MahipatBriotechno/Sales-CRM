import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useGetEmployeeAttendanceQuery, useMarkAttendanceMutation, useGetAttendanceSettingsQuery, useCheckOutMutation, useStartBreakMutation, useEndBreakMutation } from '../../store/api/attendanceApi';
import { Camera, QrCode, X, MapPin, CheckCircle, Zap, LogOut, Clock, Coffee } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { toast } from 'react-hot-toast';

export default function GlobalAttendanceEnforcer() {
  const user = useSelector((state) => state.auth.user);
  const isEmployee = user?.role === 'Employee';
  const employeeId = isEmployee ? user._id : null;

  const { data: attendanceResponse } = useGetEmployeeAttendanceQuery(employeeId, { skip: !employeeId });
  const { data: settingsData } = useGetAttendanceSettingsQuery();
  const [markAttendance, { isLoading: isMarking }] = useMarkAttendanceMutation();
  const [checkOut, { isLoading: isCheckingOut }] = useCheckOutMutation();
  const [startBreak, { isLoading: isStartingBreak }] = useStartBreakMutation();
  const [endBreak, { isLoading: isEndingBreak }] = useEndBreakMutation();

  const settings = settingsData?.data;
  const myRecords = attendanceResponse?.data || [];
  
  const todayStr = new Date().toLocaleDateString('en-CA');
  const todayRecord = useMemo(() => {
    // 1. Try to find an open record (checked in, but not checked out)
    // This perfectly handles overnight shifts where check-in was yesterday
    const openRecord = myRecords.find(r => r.check_in && (!r.check_out || r.check_out === '-'));
    if (openRecord) return openRecord;

    // 2. Otherwise, fallback to today's record (e.g. if already checked out today)
    return myRecords.find(r => {
      const rDate = new Date(r.date).toLocaleDateString('en-CA');
      return rDate === todayStr;
    });
  }, [myRecords, todayStr]);

  const activeBreak = todayRecord?.breaks?.find(b => !b.end_time);
  const isOnBreak = !!activeBreak;
  const breaksTaken = todayRecord?.breaks?.length || 0;

  const needsCheckIn = isEmployee && !todayRecord && attendanceResponse;
  const hasCheckedOut = todayRecord?.check_out && todayRecord.check_out !== '-';
  const showFloatingWidget = isEmployee && todayRecord && !hasCheckedOut;

  // --- Widget Timer State ---
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  // Total shift seconds (default 9 hours if not specified)
  const totalShiftSeconds = (user?.working_hours || 9) * 3600;

  useEffect(() => {
    let timer;
    if (showFloatingWidget && todayRecord?.check_in) {
      const updateTimer = () => {
        const [h, m, s] = todayRecord.check_in.split(':').map(Number);
        const start = new Date();
        start.setHours(h, m, s || 0, 0);
        
        let now = new Date();
        
        // If on break, freeze time at the start of the break
        if (isOnBreak && activeBreak?.start_time) {
           now = new Date(activeBreak.start_time);
        }

        let diffSeconds = Math.floor((now - start) / 1000);
        
        // Subtract all completed break durations
        if (todayRecord.breaks && todayRecord.breaks.length > 0) {
            let totalBreakSeconds = 0;
            todayRecord.breaks.forEach(b => {
               if (b.start_time && b.end_time) {
                  const bStart = new Date(b.start_time).getTime();
                  const bEnd = new Date(b.end_time).getTime();
                  totalBreakSeconds += Math.floor((bEnd - bStart) / 1000);
               }
            });
            diffSeconds -= totalBreakSeconds;
        }

        setElapsedSeconds(diffSeconds > 0 ? diffSeconds : 0);
        
        const percent = Math.min(100, Math.max(0, (diffSeconds / totalShiftSeconds) * 100));
        setProgressPercent(percent);
      };
      
      updateTimer();
      timer = setInterval(updateTimer, 1000);
    }
    return () => clearInterval(timer);
  }, [showFloatingWidget, todayRecord, totalShiftSeconds, isOnBreak, activeBreak]);

  const handleFloatingCheckOut = async () => {
    if (isOnBreak) {
      toast.error("Please end your break before checking out.");
      return;
    }
    if (elapsedSeconds < totalShiftSeconds) {
      toast.error("Shift not yet completed. You cannot check out early.");
      return;
    }
    
    try {
      const res = await checkOut(todayRecord.id).unwrap();
      if (res.success) {
        toast.success("Checked out successfully!");
      } else {
        toast.error(res.message || "Checkout failed");
      }
    } catch (err) {
      toast.error("Error during checkout");
    }
  };

  const handleStartBreak = async () => {
    try {
       const res = await startBreak(todayRecord.id).unwrap();
       if (res.success) {
          toast.success("Break started successfully!");
       } else {
          toast.error(res.message || "Could not start break");
       }
    } catch (err) {
       toast.error(err?.data?.message || "Error starting break");
    }
  };

  const handleEndBreak = async () => {
    try {
       const res = await endBreak(todayRecord.id).unwrap();
       if (res.success) {
          toast.success("Break ended successfully!");
       } else {
          toast.error(res.message || "Could not end break");
       }
    } catch (err) {
       toast.error(err?.data?.message || "Error ending break");
    }
  };

  const formatDuration = (totalSeconds) => {
    if (!totalSeconds) return '00:00:00';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatDurationShort = (totalSeconds) => {
    if (!totalSeconds) return '00:00';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const [showCheckInOptions, setShowCheckInOptions] = useState(false);
  const [showSelfieCapture, setShowSelfieCapture] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  useEffect(() => {
    let scanner = null;
    if (showQRScanner) {
      scanner = new Html5QrcodeScanner("global-reader", { fps: 10, qrbox: { width: 250, height: 250 } });
      scanner.render(
        (decodedText) => {
          try {
            const data = JSON.parse(decodedText);
            if (data.secret && data.type === 'attendance') {
              setScannedData(data);
              setShowQRScanner(false);
              setShowSelfieCapture(true);
              toast.success("QR Scanned Successfully!");
            } else {
              toast.error("Invalid QR Code for attendance");
            }
          } catch (e) {
            toast.error("Could not parse QR Code data");
          }
        },
        (error) => {}
      );
    }
    return () => {
      if (scanner) scanner.clear().catch(err => console.error("Failed to clear scanner", err));
    };
  }, [showQRScanner]);

  const captureLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported by browser"));
        return;
      }
      setLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy };
          setLocation(loc);
          setLoadingLocation(false);
          resolve(loc);
        },
        (err) => {
          setLoadingLocation(false);
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      if (settings?.gpsEnabled) {
        captureLocation().catch(err => {
          toast.error("Location capture failed. " + err.message);
        });
      }
    } catch (err) {
      toast.error("Camera access denied!");
    }
  };

  useEffect(() => {
    if (showSelfieCapture) {
      startCamera();
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showSelfieCapture]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.translate(canvasRef.current.width, 0);
      context.scale(-1, 1);
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const imgData = canvasRef.current.toDataURL("image/jpeg", 0.8);
      setCapturedImage(imgData);
    }
  };

  const handleConfirmCheckIn = async () => {
    if (settings?.gpsEnabled && !location) {
      toast.error("Location is required but not captured yet.");
      return;
    }

    try {
      const payload = {
        employee_id: user._id,
        selfie: capturedImage || undefined,
        latitude: location?.latitude,
        longitude: location?.longitude,
        ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`, // Simulated IP
        check_in_method: 'WIFI',
        qr_secret: scannedData?.secret || undefined
      };

      const res = await markAttendance(payload).unwrap();
      if (res.success) {
        toast.success("Attendance marked successfully! 🎉");
        setShowSelfieCapture(false);
        setCapturedImage(null);
      } else {
        toast.error(res.message || "Failed to mark attendance");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.data?.message || "Failed to mark attendance");
    }
  };

  if (!needsCheckIn && !showFloatingWidget) return null;

  return (
    <>
      {needsCheckIn && (
        <div className="fixed inset-0 z-[9999] bg-gray-900/50 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          
          {!showCheckInOptions ? (
            <div className="max-w-sm w-full bg-white rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 p-8 text-center">
              <div className="bg-orange-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border-2 border-orange-200">
                <CheckCircle className="w-12 h-12 text-[#FF7B1D]" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back!</h1>
              <p className="text-gray-500 font-medium mb-8">Please check in to start your day and access the CRM.</p>
              
              <button
                onClick={() => setShowCheckInOptions(true)}
                className="w-full bg-gradient-to-r from-[#FF7B1D] to-orange-500 text-white font-bold py-4 rounded-md shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all uppercase tracking-wider text-lg"
              >
                Check In Now
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-sm w-full max-w-md overflow-hidden relative shadow-2xl animate-in fade-in zoom-in duration-300">
              <div className="p-5 bg-gradient-to-r from-[#FF7B1D] to-orange-500 text-white relative">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 w-10 h-10 rounded-sm flex items-center justify-center backdrop-blur-sm shadow-sm">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight leading-none">Check-In Options</h2>
                    <p className="text-orange-100 font-semibold text-xs mt-1">Mark your attendance to access CRM</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4 bg-white">
                {/* Verification Status Indicators */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {settings?.qrCodeEnabled && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      <QrCode size={12} />
                      QR Enabled
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    <MapPin size={12} />
                    GPS On
                  </span>
                </div>

                {/* QR Scan Option */}
                {(!settings || Boolean(settings.qrCodeEnabled)) && (
                  <button
                    onClick={() => setShowQRScanner(true)}
                    className="w-full flex items-center gap-4 p-4 bg-purple-50 hover:bg-purple-100 border border-purple-100 rounded-sm transition-all duration-300 group text-left active:scale-95"
                  >
                    <div className="bg-white p-3 rounded-sm shadow-sm group-hover:bg-purple-500 transition-all duration-300 border border-purple-50">
                      <QrCode className="w-6 h-6 text-purple-600 group-hover:text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg tracking-tight">Scan QR Code</p>
                      <p className="text-xs text-purple-500 font-semibold mt-0.5">Scan the office QR code</p>
                    </div>
                  </button>
                )}

                {/* Selfie + GPS Option */}
                <button
                  onClick={() => setShowSelfieCapture(true)}
                  className="w-full flex items-center gap-4 p-4 bg-orange-50 hover:bg-orange-100 border border-orange-100 rounded-sm transition-all duration-300 group text-left active:scale-95"
                >
                  <div className="bg-white p-3 rounded-sm shadow-sm group-hover:bg-[#FF7B1D] transition-all duration-300 border border-orange-50">
                    <Camera className="w-6 h-6 text-[#FF7B1D] group-hover:text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg tracking-tight">Selfie & Location</p>
                    <p className="text-xs text-orange-500 font-semibold mt-0.5">Take photo to mark attendance</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* QR Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-white rounded-sm w-full max-w-lg overflow-hidden relative shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-gradient-to-r from-[#FF7B1D] to-orange-500 flex justify-between items-center text-white">
              <h2 className="text-lg font-bold">Scan QR Code</h2>
              <button onClick={() => setShowQRScanner(false)} className="p-2 hover:bg-white/20 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div id="global-reader" className="overflow-hidden rounded-sm border-2 border-orange-100 mb-5 bg-slate-50 min-h-[300px]"></div>
              <button onClick={() => setShowQRScanner(false)} className="w-full py-3 bg-gray-50 text-gray-500 font-bold rounded-sm uppercase text-xs border border-gray-100">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Selfie Modal */}
      {showSelfieCapture && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-sm shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-[#FF7B1D] to-orange-500 p-5 flex justify-between items-center text-white">
              <h2 className="text-lg font-bold">Photo Verification</h2>
              <button onClick={() => { setShowSelfieCapture(false); setCapturedImage(null); }} className="hover:bg-white/20 p-2 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="relative bg-gray-950 rounded-sm overflow-hidden mb-5 border-2 border-orange-100" style={{ maxHeight: "50vh", minHeight: "250px" }}>
                {!capturedImage ? (
                  <>
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" style={{ maxHeight: "50vh", minHeight: "250px" }} />
                    <canvas ref={canvasRef} className="hidden" />
                  </>
                ) : (
                  <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" style={{ maxHeight: "50vh" }} />
                )}
              </div>

              {location && (
                <div className="bg-green-50 border border-green-200 rounded-sm p-3 mb-4 flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-sm"><MapPin className="w-4 h-4 text-green-600" /></div>
                  <div>
                    <p className="font-bold text-gray-900 text-xs">Location Captured ✅</p>
                    <p className="text-[10px] text-green-600 font-semibold mt-0.5">Accuracy: ±{location.accuracy.toFixed(0)}m</p>
                  </div>
                </div>
              )}
              {loadingLocation && (
                <div className="bg-blue-50 border border-blue-100 rounded-sm p-3 mb-4 flex items-center gap-3 animate-pulse">
                  <div className="bg-blue-100 p-2 rounded-sm"><MapPin className="w-4 h-4 text-blue-600" /></div>
                  <p className="text-blue-800 font-bold text-xs">Detecting location...</p>
                </div>
              )}

              <div className="flex gap-3">
                {!capturedImage ? (
                  <button onClick={capturePhoto} className="flex-1 bg-gradient-to-r from-[#FF7B1D] to-orange-500 text-white py-3.5 rounded-sm font-bold uppercase hover:shadow-md flex items-center justify-center gap-2">
                    <Camera className="w-5 h-5" /> Capture Photo
                  </button>
                ) : (
                  <>
                    <button onClick={() => setCapturedImage(null)} className="flex-1 bg-gray-100 py-3.5 font-bold uppercase text-gray-600 hover:bg-gray-200 rounded-sm">Retake</button>
                    <button onClick={handleConfirmCheckIn} disabled={isMarking || (settings?.gpsEnabled && !location)} className="flex-[2] bg-gradient-to-r from-green-500 to-green-600 text-white py-3.5 font-bold uppercase flex items-center justify-center gap-2 rounded-sm hover:shadow-md disabled:opacity-50">
                      {isMarking ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <CheckCircle className="w-5 h-5" />}
                      Confirm Check-In
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {showFloatingWidget && (
        <div className="fixed right-0 top-24 z-[9990] group flex items-start">
          
          {/* Expanded Card Details (Appears on Hover) - Added pr-4 for hover bridge */}
          <div className="absolute right-full top-0 w-[336px] pr-4 opacity-0 translate-x-4 pointer-events-none transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:pointer-events-auto">
            <div className="w-80 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-400" />
                  <h3 className="font-bold">Active Shift</h3>
                </div>
                {isOnBreak ? (
                  <div className="bg-yellow-500/20 text-yellow-400 text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider flex items-center gap-1.5">
                    <Coffee className="w-3 h-3" />
                    On Break
                  </div>
                ) : (
                  <div className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    On Duty
                  </div>
                )}
              </div>
              
              <div className="p-5">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Working Time</p>
                    <p className="text-3xl font-mono font-bold text-gray-900 leading-none mt-1">{formatDuration(elapsedSeconds)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Shift</p>
                    <p className="text-sm font-bold text-gray-700 mt-1">{user?.working_hours || 9} Hrs</p>
                  </div>
                </div>
                
                <div className="w-full bg-gray-100 rounded-full h-2.5 mb-5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-orange-400 to-[#FF7B1D] h-2.5 rounded-full transition-all duration-1000 ease-linear" 
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                
                <div className="flex gap-2.5">
                  {(settings === undefined || settings?.breakEnabled !== 0) && (
                    isOnBreak ? (
                      <button
                        onClick={handleEndBreak}
                        disabled={isEndingBreak}
                        className="flex-1 py-3 rounded-lg font-bold text-sm uppercase flex items-center justify-center gap-2 transition-all bg-yellow-50 text-yellow-600 border border-yellow-200 hover:bg-yellow-100 active:scale-95"
                      >
                        {isEndingBreak ? <div className="w-5 h-5 border-2 border-yellow-600 border-t-transparent animate-spin rounded-full" /> : <Coffee className="w-5 h-5" />}
                        End Break
                      </button>
                    ) : (
                      <button
                        onClick={handleStartBreak}
                        disabled={isStartingBreak}
                        className="flex-1 py-3 rounded-lg font-bold text-sm uppercase flex items-center justify-center gap-2 transition-all bg-[#FFF0E6] text-[#FF7B1D] border border-[#FFD6B3] hover:bg-[#FFE5D3] active:scale-95"
                      >
                        {isStartingBreak ? <div className="w-5 h-5 border-2 border-[#FF7B1D] border-t-transparent animate-spin rounded-full" /> : <Coffee className="w-5 h-5" />}
                        Take Break
                      </button>
                    )
                  )}
                  <button
                    onClick={handleFloatingCheckOut}
                    disabled={isCheckingOut || elapsedSeconds < totalShiftSeconds || isOnBreak}
                    className={`flex-1 py-3 rounded-lg font-bold text-sm uppercase flex items-center justify-center gap-2 transition-all ${
                      elapsedSeconds < totalShiftSeconds || isOnBreak
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-transparent" 
                        : "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 active:scale-95"
                    }`}
                  >
                    {isCheckingOut ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent animate-spin rounded-full" />
                    ) : (
                      <LogOut className="w-5 h-5" />
                    )}
                    Check Out
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Edge Bubble */}
          <div className="bg-white shadow-[-4px_0_15px_rgba(0,0,0,0.1)] border border-gray-200 border-r-0 rounded-l-full p-2.5 cursor-default flex items-center justify-center group-hover:bg-gray-50 transition-colors relative">
            <div className="relative w-20 h-20">
              {/* Circular Progress SVG */}
              <svg className="w-20 h-20 transform -rotate-90">
                <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="5" fill="transparent" className="text-gray-100" />
                <circle 
                  cx="40" 
                  cy="40" 
                  r="36" 
                  stroke="currentColor" 
                  strokeWidth="5" 
                  fill="transparent"
                  strokeDasharray="226.2"
                  strokeDashoffset={226.2 - (226.2 * progressPercent) / 100}
                  strokeLinecap="round"
                  className={`${isOnBreak ? 'text-yellow-400' : 'text-[#FF7B1D]'} transition-all duration-1000 ease-linear`} 
                />
              </svg>
              {/* Time inside circle */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-[13px] font-mono font-bold leading-none ${isOnBreak ? 'text-yellow-600' : 'text-gray-800'}`}>
                  {formatDuration(elapsedSeconds)}
                </span>
                <span className="text-[9px] text-gray-400 font-bold uppercase mt-1">{isOnBreak ? 'PAUSED' : 'Time'}</span>
              </div>
            </div>
          </div>
          
        </div>
      )}
    </>
  );
}
