import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "react-hot-toast";
import {
  Users,
  Eye,
  EyeOff,
  User,
  Lock,
  Mail,
  TrendingUp,
  Phone,
  Smartphone,
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  Edit2,
} from "lucide-react";
import { useLoginMutation, useSendOtpMutation, useVerifyOtpMutation } from "../store/api/authApi";
import { setCredentials } from "../store/slices/authSlice";

const COUNTRY_CODES = [
  { code: "+91", flag: "🇮🇳", label: "India (+91)" },
  { code: "+1", flag: "🇺🇸", label: "USA (+1)" },
  { code: "+44", flag: "🇬🇧", label: "UK (+44)" },
  { code: "+971", flag: "🇦🇪", label: "UAE (+971)" },
  { code: "+65", flag: "🇸🇬", label: "Singapore (+65)" },
  { code: "+61", flag: "🇦🇺", label: "Australia (+61)" },
];

export default function Login() {
  const [loginMethod, setLoginMethod] = useState("email"); // 'email' | 'phone'
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Phone & OTP states
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [otpStep, setOtpStep] = useState("phone"); // 'phone' | 'otp'
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(30);
  const [isTimerActive, setIsTimerActive] = useState(false);

  const otpRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [sendOtpApi, { isLoading: isSendingOtp }] = useSendOtpMutation();
  const [verifyOtpApi, { isLoading: isVerifying }] = useVerifyOtpMutation();

  // Timer countdown effect for OTP resend
  useEffect(() => {
    let interval = null;
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timer]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      return toast.error("Please enter email and password");
    }

    try {
      const result = await login(formData).unwrap();
      dispatch(
        setCredentials({
          user: result.user,
          token: result.token,
        })
      );
      toast.success("Login successful!");
      let from = location.state?.from?.pathname
        ? location.state.from.pathname + (location.state.from.search || "")
        : "";

      // Prevent redirecting back to the logout route after successful login
      if (!from || from === "/logout") {
        from = result.user.role === "Super Admin"
          ? "/superadmin/dashboard"
          : result.user.role === "Employee"
          ? "/hrm/dashboard"
          : "/dashboard";
      }

      navigate(from, { replace: true });
    } catch (err) {
      toast.error(
        err?.data?.message || "Login failed. Please check your credentials."
      );
    }
  };

  // Handle Phone OTP actions
  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      return toast.error("Please enter a valid 10-digit mobile number");
    }

    try {
      const res = await sendOtpApi({ mobileNumber: phone, countryCode }).unwrap();
      setOtpStep("otp");
      setTimer(30);
      setIsTimerActive(true);
      toast.success(res.message || `OTP sent successfully to ${countryCode} ${phone}`);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to send OTP. Mobile number not registered.");
    }
  };

  const handleResendOtp = async () => {
    if (isTimerActive) return;
    try {
      const res = await sendOtpApi({ mobileNumber: phone, countryCode }).unwrap();
      setOtpDigits(["", "", "", "", "", ""]);
      setTimer(30);
      setIsTimerActive(true);
      toast.success(res.message || `New OTP sent to ${countryCode} ${phone}`);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to resend OTP");
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData) {
      const newDigits = ["", "", "", "", "", ""];
      for (let i = 0; i < pastedData.length; i++) {
        newDigits[i] = pastedData[i];
      }
      setOtpDigits(newDigits);
      const nextIndex = Math.min(pastedData.length, 5);
      otpRefs.current[nextIndex]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const code = otpDigits.join("");
    if (code.length !== 6) {
      return toast.error("Please enter the complete 6-digit OTP");
    }

    try {
      const result = await verifyOtpApi({ mobileNumber: phone, otp: code }).unwrap();
      dispatch(
        setCredentials({
          user: result.user,
          token: result.token,
        })
      );
      toast.success("OTP verified successfully!");
      let from = location.state?.from?.pathname
        ? (location.state.from.pathname + (location.state.from.search || ""))
        : "";

      // Prevent redirecting back to the logout route after successful login
      if (!from || from === "/logout") {
        from = result.user.role === 'Super Admin'
          ? "/superadmin/dashboard"
          : result.user.role === 'Employee'
            ? "/hrm/dashboard"
            : "/dashboard";
      }

      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err?.data?.message || "Invalid or expired OTP code");
    }
  };

  const handleForgotPassword = () => {
    if (resetEmail) {
      toast.success(`Password reset link sent to ${resetEmail}`);
      setForgotPassword(false);
      setResetEmail("");
    } else {
      toast.error("Please enter your registered email");
    }
  };

  const handleResetPassword = () => {
    if (newPassword) {
      toast.success("Password reset successfully! Please login.");
      setNewPassword("");
      setForgotPassword(false);
    } else {
      toast.error("Please enter a new password");
    }
  };

  const handleKeyPress = (e, action) => {
    if (e.key === "Enter") {
      action();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-4 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="w-full max-w-5xl bg-white rounded-sm shadow-sm overflow-hidden flex flex-col lg:flex-row">
        {/* Left Side - Login Form */}
        <div className="w-full lg:w-1/2 p-6 sm:p-8 md:p-10 lg:p-12 bg-gradient-to-br from-orange-50 via-white to-amber-50">
          {/* Brand Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-2 mb-6 sm:mb-8">
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-lg"
                style={{ backgroundColor: "#FF7B1D" }}
              >
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h1 className="relative text-xl sm:text-2xl font-bold text-gray-800 inline-block">
                CRM System
                <span className="absolute left-0 -bottom-1 w-full h-[3px] sm:h-[4px] bg-[#FF7B1D] rounded-full"></span>
              </h1>
            </div>

            {!forgotPassword ? (
              <>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                  Welcome Back
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                  {loginMethod === "email"
                    ? "Enter your credentials to access your account."
                    : otpStep === "phone"
                    ? "Enter your mobile number to receive a one-time OTP."
                    : "Enter the 6-digit verification code sent to your phone."}
                </p>

                {/* Login Method Selector Tabs */}
                <div className="flex bg-gradient-to-r from-orange-500 to-orange-600 p-1.5 rounded-xl mb-6 shadow-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod("email");
                      setOtpStep("phone");
                    }}
                    className={`flex-1 py-2.5 text-xs sm:text-sm rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                      loginMethod === "email"
                        ? "bg-white text-orange-600 shadow-md font-bold"
                        : "text-white/90 hover:text-white font-semibold"
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    Email & Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod("phone")}
                    className={`flex-1 py-2.5 text-xs sm:text-sm rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                      loginMethod === "phone"
                        ? "bg-white text-orange-600 shadow-md font-bold"
                        : "text-white/90 hover:text-white font-semibold"
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    Phone OTP
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                  Reset Password
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                  Reset your password securely
                </p>
              </>
            )}
          </div>

          {!forgotPassword ? (
            loginMethod === "email" ? (
              /* Email & Password Form */
              <div className="space-y-4 sm:space-y-5">
                {/* Username Field */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 text-black w-5 h-5" />
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter Email"
                      value={formData.email}
                      onChange={handleChange}
                      onKeyPress={(e) => handleKeyPress(e, handleLogin)}
                      className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none text-sm sm:text-base"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-gray-800">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setForgotPassword(true)}
                      className="text-xs font-semibold text-orange-600 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 text-black w-5 h-5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Enter Password"
                      value={formData.password}
                      onChange={handleChange}
                      onKeyPress={(e) => handleKeyPress(e, handleLogin)}
                      className="w-full pl-10 pr-10 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none text-sm sm:text-base"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-gray-600 hover:text-orange-600 transition"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Login Button */}
                <button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 sm:py-3.5 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl mt-4 sm:mt-6 text-sm sm:text-base flex items-center justify-center opacity-90 disabled:opacity-50"
                >
                  {isLoading ? "Signing in..." : "Access Dashboard →"}
                </button>

                <div className="text-center mt-4">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      className="text-orange-500 font-semibold hover:underline"
                      onClick={() => navigate("/signup")}
                    >
                      Sign Up
                    </button>
                  </p>
                </div>
              </div>
            ) : (
              /* Phone OTP Form */
              <div className="space-y-4 sm:space-y-5">
                {otpStep === "phone" ? (
                  /* Step 1: Input Phone Number */
                  <>
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2">
                        Mobile Phone Number
                      </label>
                      <div className="flex gap-2">
                        <div className="relative w-32 flex-shrink-0">
                          <select
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            className="w-full py-3 px-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none text-sm font-medium appearance-none cursor-pointer pr-7"
                          >
                            {COUNTRY_CODES.map((c) => (
                              <option key={c.code} value={c.code}>
                                {c.flag} {c.code}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-2.5 top-3.5 pointer-events-none text-gray-400 text-xs">
                            ▼
                          </div>
                        </div>
                        <div className="relative flex-1">
                          <Phone className="absolute left-3 top-3.5 text-gray-500 w-5 h-5" />
                          <input
                            type="tel"
                            placeholder="Enter 10-digit mobile number"
                            value={phone}
                            onChange={(e) =>
                              setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                            }
                            onKeyPress={(e) => handleKeyPress(e, handleSendOtp)}
                            className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none text-sm sm:text-base tracking-wide"
                          />
                        </div>
                      </div>
                      <p className="text-[11px] sm:text-xs text-gray-500 mt-2">
                        We will send a 6-digit one-time password via SMS to verify your mobile number.
                      </p>
                    </div>

                    <button
                      onClick={handleSendOtp}
                      disabled={isSendingOtp || phone.length < 10}
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 sm:py-3.5 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl mt-4 sm:mt-6 text-sm sm:text-base flex items-center justify-center gap-2 opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSendingOtp ? (
                        "Sending OTP..."
                      ) : (
                        <>
                          <Smartphone className="w-5 h-5" />
                          Send OTP Code →
                        </>
                      )}
                    </button>

                    <div className="text-center mt-4">
                      <p className="text-sm text-gray-600">
                        Don't have an account?{" "}
                        <button
                          type="button"
                          className="text-orange-500 font-semibold hover:underline"
                          onClick={() => navigate("/signup")}
                        >
                          Sign Up
                        </button>
                      </p>
                    </div>
                  </>
                ) : (
                  /* Step 2: Input OTP Code */
                  <>
                    <div className="bg-orange-50/80 border border-orange-200/80 rounded-xl p-3.5 flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-2.5 text-gray-700">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0">
                          <Smartphone className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-gray-500 text-[11px]">OTP sent to</p>
                          <p className="font-bold text-gray-900">
                            {countryCode} {phone}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOtpStep("phone")}
                        className="text-orange-600 hover:text-orange-700 font-semibold text-xs flex items-center gap-1 hover:underline"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-bold text-gray-800">
                          Enter 6-Digit OTP Code
                        </label>
                      </div>
                      <div className="flex justify-between gap-1.5 sm:gap-2">
                        {otpDigits.map((digit, index) => (
                          <input
                            key={index}
                            ref={(el) => (otpRefs.current[index] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            onPaste={handleOtpPaste}
                            className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none transition-all"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-gray-500">Didn't receive code?</span>
                      <button
                        type="button"
                        disabled={isTimerActive}
                        onClick={handleResendOtp}
                        className={`font-semibold flex items-center gap-1 transition ${
                          isTimerActive
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-orange-600 hover:text-orange-700 hover:underline"
                        }`}
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${
                            isTimerActive
                              ? ""
                              : "hover:rotate-180 transition-transform duration-500"
                          }`}
                        />
                        {isTimerActive ? `Resend in ${timer}s` : "Resend OTP"}
                      </button>
                    </div>

                    <button
                      onClick={handleVerifyOtp}
                      disabled={otpDigits.join("").length !== 6 || isVerifying}
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 sm:py-3.5 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl mt-4 sm:mt-6 text-sm sm:text-base flex items-center justify-center gap-2 opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isVerifying ? (
                        "Verifying Code..."
                      ) : (
                        <>
                          <ShieldCheck className="w-5 h-5" />
                          Verify & Access Dashboard →
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setOtpStep("phone")}
                      className="w-full text-center text-xs sm:text-sm text-gray-500 hover:text-orange-600 font-medium flex items-center justify-center gap-1 pt-1"
                    >
                      <ArrowLeft className="w-4 h-4" /> Change phone number
                    </button>
                  </>
                )}
              </div>
            )
          ) : (
            /* Reset Password Form */
            <div className="space-y-4 sm:space-y-5">
              {!newPassword ? (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 text-black w-5 h-5" />
                      <input
                        type="email"
                        placeholder="Enter Email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        onKeyPress={(e) =>
                          handleKeyPress(e, handleForgotPassword)
                        }
                        className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none text-sm sm:text-base"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 text-black w-5 h-5" />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        onKeyPress={(e) =>
                          handleKeyPress(e, handleResetPassword)
                        }
                        className="w-full pl-10 pr-10 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none text-sm sm:text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-3.5 text-gray-600 hover:text-orange-600 transition"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 mt-6 sm:mt-8">
                <button
                  type="button"
                  className="text-gray-500 text-xs sm:text-sm hover:underline font-medium order-2 sm:order-1"
                  onClick={() => {
                    setForgotPassword(false);
                    setResetEmail("");
                    setNewPassword("");
                  }}
                >
                  Back to Login
                </button>
                <button
                  onClick={
                    !newPassword ? handleForgotPassword : handleResetPassword
                  }
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] order-1 sm:order-2 text-sm sm:text-base"
                >
                  {!newPassword ? "Send Link" : "Reset Password"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side - CRM Vector Illustration */}
        <div className="hidden lg:flex w-full lg:w-1/2 flex-col items-center justify-center p-8 lg:p-12 bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 text-center relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-40 h-40 bg-yellow-200 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white rounded-full blur-2xl animate-pulse"></div>
          </div>

          <div className="mb-6 relative z-10">
            <h3 className="text-orange-100 text-sm font-medium mb-3 uppercase tracking-wide">
              Customer Relationship Management
            </h3>
            <h2 className="text-white text-3xl xl:text-4xl font-bold mb-4">
              {!forgotPassword ? "Welcome Back" : "Secure Reset"}
            </h2>
          </div>

          <div className="relative w-full max-w-md z-10">
            <svg viewBox="0 0 500 400" className="w-full h-auto">
              {/* Background decorative circles */}
              <circle cx="250" cy="200" r="190" fill="#FFFFFF" opacity="0.05" />
              <circle cx="250" cy="200" r="140" fill="#FFFFFF" opacity="0.08" />

              {/* Desk/Table */}
              <ellipse
                cx="250"
                cy="320"
                rx="180"
                ry="20"
                fill="#FFFFFF"
                opacity="0.2"
              />
              <rect
                x="80"
                y="300"
                width="340"
                height="20"
                rx="10"
                fill="#FFFFFF"
                opacity="0.3"
              />

              {/* Business Person - Left (Sales Rep on Phone) */}
              <rect
                x="155"
                y="265"
                width="12"
                height="40"
                rx="6"
                fill="#6366F1"
              />
              <rect
                x="173"
                y="265"
                width="12"
                height="40"
                rx="6"
                fill="#6366F1"
              />
              <ellipse cx="170" cy="235" rx="25" ry="35" fill="#8B5CF6" />
              <circle cx="170" cy="195" r="22" fill="#FCD34D" />
              <ellipse cx="170" cy="185" rx="24" ry="18" fill="#7C3AED" />
              <ellipse
                cx="145"
                cy="240"
                rx="10"
                ry="28"
                fill="#FCD34D"
                transform="rotate(-25 145 240)"
              />
              <ellipse
                cx="195"
                cy="235"
                rx="10"
                ry="28"
                fill="#FCD34D"
                transform="rotate(25 195 235)"
              />
              <rect
                x="130"
                y="225"
                width="20"
                height="35"
                rx="3"
                fill="#1F2937"
                opacity="0.9"
              />
              <rect
                x="133"
                y="228"
                width="14"
                height="25"
                rx="2"
                fill="#3B82F6"
              />

              {/* Business Person - Center (Manager with Laptop) */}
              <rect
                x="240"
                y="260"
                width="12"
                height="45"
                rx="6"
                fill="#7C3AED"
              />
              <rect
                x="258"
                y="260"
                width="12"
                height="45"
                rx="6"
                fill="#7C3AED"
              />
              <ellipse cx="255" cy="225" rx="28" ry="35" fill="#A78BFA" />
              <circle cx="255" cy="185" r="24" fill="#FDE68A" />
              <path
                d="M 235 180 Q 245 165 255 165 Q 265 165 275 180 L 275 185 Q 265 173 255 173 Q 245 173 235 185 Z"
                fill="#6366F1"
              />
              <ellipse
                cx="230"
                cy="230"
                rx="10"
                ry="28"
                fill="#FDE68A"
                transform="rotate(-30 230 230)"
              />
              <ellipse
                cx="280"
                cy="230"
                rx="10"
                ry="28"
                fill="#FDE68A"
                transform="rotate(30 280 230)"
              />
              <rect
                x="220"
                y="240"
                width="70"
                height="45"
                rx="3"
                fill="#1F2937"
                opacity="0.95"
              />
              <rect
                x="225"
                y="245"
                width="60"
                height="35"
                rx="2"
                fill="#10B981"
              />
              <circle cx="255" cy="262" r="3" fill="#FFFFFF" />

              {/* Business Person - Right (Customer Service) */}
              <rect
                x="330"
                y="270"
                width="12"
                height="35"
                rx="6"
                fill="#8B5CF6"
              />
              <rect
                x="348"
                y="270"
                width="12"
                height="35"
                rx="6"
                fill="#8B5CF6"
              />
              <ellipse cx="345" cy="240" rx="24" ry="32" fill="#C4B5FD" />
              <circle cx="345" cy="205" r="20" fill="#FCD34D" />
              <ellipse cx="345" cy="195" rx="22" ry="16" fill="#A78BFA" />
              <ellipse
                cx="323"
                cy="245"
                rx="9"
                ry="26"
                fill="#FCD34D"
                transform="rotate(-20 323 245)"
              />
              <ellipse
                cx="367"
                cy="245"
                rx="9"
                ry="26"
                fill="#FCD34D"
                transform="rotate(20 367 245)"
              />
              <path
                d="M 330 205 Q 328 195 330 190"
                fill="none"
                stroke="#1F2937"
                strokeWidth="3"
              />
              <circle cx="328" cy="208" r="5" fill="#1F2937" />
              <path
                d="M 360 205 Q 362 195 360 190"
                fill="none"
                stroke="#1F2937"
                strokeWidth="3"
              />
              <circle cx="362" cy="208" r="5" fill="#1F2937" />
              <path
                d="M 330 190 Q 345 185 360 190"
                fill="none"
                stroke="#1F2937"
                strokeWidth="3"
              />

              {/* Customer Profile Cards - Top Left */}
              <g transform="translate(40, 80)">
                <rect
                  x="0"
                  y="0"
                  width="55"
                  height="35"
                  rx="4"
                  fill="#FFFFFF"
                  opacity="0.95"
                />
                <circle cx="15" cy="12" r="8" fill="#8B5CF6" />
                <rect
                  x="27"
                  y="8"
                  width="20"
                  height="3"
                  rx="1"
                  fill="#9CA3AF"
                />
                <rect
                  x="27"
                  y="14"
                  width="15"
                  height="3"
                  rx="1"
                  fill="#9CA3AF"
                />
                <rect
                  x="5"
                  y="24"
                  width="45"
                  height="2"
                  rx="1"
                  fill="#10B981"
                />
                <rect
                  x="5"
                  y="29"
                  width="35"
                  height="2"
                  rx="1"
                  fill="#10B981"
                />
              </g>

              {/* Sales Chart - Top Right */}
              <g transform="translate(400, 70)">
                <rect
                  x="0"
                  y="0"
                  width="60"
                  height="50"
                  rx="4"
                  fill="#FFFFFF"
                  opacity="0.95"
                />
                <rect x="8" y="35" width="8" height="10" fill="#EF4444" />
                <rect x="20" y="28" width="8" height="17" fill="#F59E0B" />
                <rect x="32" y="20" width="8" height="25" fill="#10B981" />
                <rect x="44" y="15" width="8" height="30" fill="#3B82F6" />
                <path
                  d="M 12 35 L 24 28 L 36 20 L 48 15"
                  fill="none"
                  stroke="#8B5CF6"
                  strokeWidth="2"
                />
              </g>

              {/* Pipeline/Funnel - Left Middle */}
              <g transform="translate(50, 200)">
                <path
                  d="M 10 0 L 40 0 L 35 15 L 15 15 Z"
                  fill="#3B82F6"
                  opacity="0.85"
                />
                <path
                  d="M 15 15 L 35 15 L 32 30 L 18 30 Z"
                  fill="#10B981"
                  opacity="0.85"
                />
                <path
                  d="M 18 30 L 32 30 L 30 45 L 20 45 Z"
                  fill="#F59E0B"
                  opacity="0.85"
                />
                <path
                  d="M 20 45 L 30 45 L 28 55 L 22 55 Z"
                  fill="#EF4444"
                  opacity="0.85"
                />
              </g>

              {/* Email/Communication - Right Top */}
              <g transform="translate(390, 180)">
                <rect
                  x="0"
                  y="0"
                  width="60"
                  height="40"
                  rx="4"
                  fill="#FFFFFF"
                  opacity="0.95"
                />
                <path
                  d="M 0 4 L 30 24 L 60 4"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="3"
                />
                <circle cx="48" cy="8" r="6" fill="#10B981" />
                <text
                  x="46"
                  y="12"
                  fill="#FFFFFF"
                  fontSize="10"
                  fontWeight="bold"
                >
                  3
                </text>
              </g>

              {/* Customer Rating/Reviews - Bottom Left */}
              <g transform="translate(70, 110)">
                <rect
                  x="0"
                  y="0"
                  width="70"
                  height="45"
                  rx="4"
                  fill="#FFFFFF"
                  opacity="0.95"
                />
                <path
                  d="M 10 15 L 12 21 L 18 21 L 13 25 L 15 31 L 10 27 L 5 31 L 7 25 L 2 21 L 8 21 Z"
                  fill="#FBBF24"
                />
                <path
                  d="M 25 15 L 27 21 L 33 21 L 28 25 L 30 31 L 25 27 L 20 31 L 22 25 L 17 21 L 23 21 Z"
                  fill="#FBBF24"
                />
                <path
                  d="M 40 15 L 42 21 L 48 21 L 43 25 L 45 31 L 40 27 L 35 31 L 37 25 L 32 21 L 38 21 Z"
                  fill="#FBBF24"
                />
                <path
                  d="M 55 15 L 57 21 L 63 21 L 58 25 L 60 31 L 55 27 L 50 31 L 52 25 L 47 21 L 53 21 Z"
                  fill="#FBBF24"
                />
                <rect
                  x="5"
                  y="35"
                  width="60"
                  height="3"
                  rx="1"
                  fill="#C4B5FD"
                />
              </g>

              {/* Analytics Dashboard - Top Center */}
              <g transform="translate(210, 50)">
                <rect
                  x="0"
                  y="0"
                  width="80"
                  height="55"
                  rx="4"
                  fill="#FFFFFF"
                  opacity="0.95"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="12"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="3"
                />
                <path
                  d="M 20 20 L 20 10 M 20 20 L 28 20"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2"
                />
                <rect
                  x="40"
                  y="15"
                  width="30"
                  height="4"
                  rx="2"
                  fill="#10B981"
                />
                <rect
                  x="40"
                  y="23"
                  width="25"
                  height="4"
                  rx="2"
                  fill="#F59E0B"
                />
                <rect
                  x="40"
                  y="31"
                  width="35"
                  height="4"
                  rx="2"
                  fill="#EF4444"
                />
                <text
                  x="8"
                  y="48"
                  fill="#8B5CF6"
                  fontSize="12"
                  fontWeight="bold"
                >
                  CRM
                </text>
              </g>

              {/* Team/Network Icon - Right Bottom */}
              <g transform="translate(380, 280)">
                <circle cx="25" cy="15" r="8" fill="#3B82F6" opacity="0.9" />
                <circle cx="10" cy="30" r="7" fill="#8B5CF6" opacity="0.9" />
                <circle cx="40" cy="30" r="7" fill="#8B5CF6" opacity="0.9" />
                <circle cx="25" cy="42" r="6" fill="#A78BFA" opacity="0.9" />
                <line
                  x1="25"
                  y1="15"
                  x2="10"
                  y2="30"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  opacity="0.7"
                />
                <line
                  x1="25"
                  y1="15"
                  x2="40"
                  y2="30"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  opacity="0.7"
                />
                <line
                  x1="10"
                  y1="30"
                  x2="25"
                  y2="42"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  opacity="0.7"
                />
                <line
                  x1="40"
                  y1="30"
                  x2="25"
                  y2="42"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  opacity="0.7"
                />
              </g>

              {/* Calendar/Scheduling - Bottom Right */}
              <g transform="translate(380, 340)">
                <rect
                  x="0"
                  y="0"
                  width="45"
                  height="45"
                  rx="3"
                  fill="#FFFFFF"
                  opacity="0.95"
                />
                <rect
                  x="0"
                  y="0"
                  width="45"
                  height="10"
                  rx="3"
                  fill="#EF4444"
                />
                <circle cx="12" cy="5" r="2" fill="#FFFFFF" />
                <circle cx="33" cy="5" r="2" fill="#FFFFFF" />
                <rect x="5" y="15" width="7" height="7" rx="1" fill="#C4B5FD" />
                <rect
                  x="15"
                  y="15"
                  width="7"
                  height="7"
                  rx="1"
                  fill="#C4B5FD"
                />
                <rect
                  x="25"
                  y="15"
                  width="7"
                  height="7"
                  rx="1"
                  fill="#C4B5FD"
                />
                <rect
                  x="35"
                  y="15"
                  width="7"
                  height="7"
                  rx="1"
                  fill="#10B981"
                />
                <rect x="5" y="25" width="7" height="7" rx="1" fill="#C4B5FD" />
                <rect
                  x="15"
                  y="25"
                  width="7"
                  height="7"
                  rx="1"
                  fill="#3B82F6"
                />
              </g>

              {/* Deal/Contract Icon - Left Bottom */}
              <g transform="translate(90, 340)">
                <rect
                  x="0"
                  y="0"
                  width="50"
                  height="40"
                  rx="3"
                  fill="#FFFFFF"
                  opacity="0.95"
                />
                <rect x="5" y="5" width="40" height="6" rx="2" fill="#10B981" />
                <rect
                  x="5"
                  y="15"
                  width="30"
                  height="3"
                  rx="1"
                  fill="#9CA3AF"
                />
                <rect
                  x="5"
                  y="21"
                  width="35"
                  height="3"
                  rx="1"
                  fill="#9CA3AF"
                />
                <rect
                  x="5"
                  y="27"
                  width="25"
                  height="3"
                  rx="1"
                  fill="#9CA3AF"
                />
                <path
                  d="M 35 30 Q 40 32 45 30 Q 45 35 40 37 Q 35 35 35 30"
                  fill="#EF4444"
                />
              </g>

              {/* Decorative elements */}
              <circle cx="120" cy="120" r="5" fill="#FCD34D" opacity="0.6" />
              <circle cx="380" cy="150" r="6" fill="#C4B5FD" opacity="0.7" />
              <circle cx="430" cy="250" r="4" fill="#FCD34D" opacity="0.5" />
              <circle cx="70" cy="270" r="5" fill="#A78BFA" opacity="0.6" />

              {/* Stars */}
              <path
                d="M 450 230 L 453 238 L 461 238 L 455 243 L 457 251 L 450 246 L 443 251 L 445 243 L 439 238 L 447 238 Z"
                fill="#FCD34D"
                opacity="0.7"
              />
              <path
                d="M 60 140 L 62 146 L 68 146 L 63 150 L 65 156 L 60 152 L 55 156 L 57 150 L 52 146 L 58 146 Z"
                fill="#A78BFA"
                opacity="0.7"
              />
              <path
                d="M 430 100 L 432 105 L 437 105 L 433 108 L 435 113 L 430 110 L 425 113 L 427 108 L 423 105 L 428 105 Z"
                fill="#FCD34D"
                opacity="0.6"
              />

              {/* Connection lines between people */}
              <line
                x1="170"
                y1="235"
                x2="255"
                y2="225"
                stroke="#FFFFFF"
                strokeWidth="2"
                opacity="0.2"
                strokeDasharray="5,5"
              />
              <line
                x1="255"
                y1="225"
                x2="345"
                y2="240"
                stroke="#FFFFFF"
                strokeWidth="2"
                opacity="0.2"
                strokeDasharray="5,5"
              />
            </svg>
          </div>

          <p className="text-orange-50 text-xs sm:text-sm mt-6 max-w-sm relative z-10">
            Manage customer relationships and drive growth with{" "}
            <span className="font-semibold text-white">CRM System</span>
          </p>
        </div>
      </div>
    </div>
  );
}
