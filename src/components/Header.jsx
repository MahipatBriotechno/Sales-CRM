import React, { useState, useRef, useEffect } from "react";
import {
  FiGrid,
  FiMaximize,
  FiBell,
  FiMail,
  FiMessageCircle,
  FiUser,
  FiSettings,
  FiCreditCard,
  FiLogOut,
  FiCheckSquare,
  FiFileText,
  FiDollarSign,
  FiSearch,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { FileSignature, Wallet, Shield } from "lucide-react";
import { useGetUserProfileQuery } from "../store/api/userApi";
import { useNotifications } from "../context/NotificationContext";
import { formatDistanceToNow } from 'date-fns';

const Header = () => {
  const { user } = useSelector((state) => state.auth);
  const { data: userProfile } = useGetUserProfileQuery();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [appsOpen, setAppsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [profileImageError, setProfileImageError] = useState(false);

  const resolveUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    const baseUrl = import.meta.env.VITE_IMAGE_BASE_URL || import.meta.env.VITE_API_BASE_URL.replace('/api/', '').replace('/api/v1', '');
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const dropdownRef = useRef(null);
  const appsRef = useRef(null);
  const notificationsRef = useRef(null);
  const searchInputRef = useRef(null);

  const navigate = useNavigate();

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (appsRef.current && !appsRef.current.contains(event.target)) {
        setAppsOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const go = (path) => {
    navigate(path);
    setIsDropdownOpen(false);
    setAppsOpen(false);
    setSearchValue("");
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const allPages = [
    { name: "Main Dashboard", path: "/dashboard", category: "Dashboards" },
    { name: "HRM Dashboard", path: "/hrm/dashboard", category: "Dashboards" },
    { name: "CRM Dashboard", path: "/crm/dashboard", category: "Dashboards" },
    { name: "Employee List", path: "/hrm/employee/all", category: "HRM" },
    { name: "All Leads", path: "/crm/leads/all", category: "CRM" },
    { name: "New Leads", path: "/crm/leads/new", category: "CRM" },
    { name: "Manage Teams", path: "/hrm/teams", category: "HRM" },
    { name: "Attendance Management", path: "/hrm/attendance", category: "HRM" },
    { name: "Leave Management", path: "/hrm/leave/all", category: "HRM" },
    { name: "Department Management", path: "/hrm/department", category: "HRM" },
    { name: "Designation Management", path: "/hrm/designation", category: "HRM" },
    { name: "Salary Management", path: "/hrm/salary", category: "HRM" },
    { name: "Company Policies", path: "/hrm/company-policy", category: "HRM" },
    { name: "HR Policies", path: "/hrm/hr-policy", category: "HRM" },
    { name: "Job Management", path: "/hrm/job-management", category: "Recruitment" },
    { name: "Invoices", path: "/additional/invoice", category: "Financial" },
    { name: "Business Info", path: "/settings/business-info", category: "Settings" },
  ];

  const searchResults = searchValue.length > 0
    ? allPages.filter(page => {
      const q = searchValue.toLowerCase();
      const name = page.name.toLowerCase();
      const cat = page.category.toLowerCase();
      const isDashboardTypo = q.includes("dash") && (q.includes("bi") || q.includes("bo"));
      return name.includes(q) || cat.includes(q) || (isDashboardTypo && name.includes("dashboard"));
    }).reduce((acc, curr) => {
      const cat = acc.find(c => c.category === curr.category);
      if (cat) cat.items.push(curr);
      else acc.push({ category: curr.category, items: [curr] });
      return acc;
    }, [])
    : [];

  const { sidebarLocked: isLocked } = useSelector((state) => state.ui);

  return (
    <header className={`fixed top-0 left-0 right-0 ${isLocked ? "xl:left-[280px]" : "xl:left-[68px]"} h-[70px] flex items-center px-2 md:px-4 lg:px-8 z-40 bg-[#2b303b] transition-all duration-300`}>
      {/* Mobile Toggle Spacer */}
      <div className="w-14 xl:hidden flex-shrink-0" />
      {/* Left Clock */}
      <div className="hidden xl:flex flex-col min-w-[120px] flex-shrink-0">
        <span className="text-[17px] font-bold text-white leading-none tracking-tight">
          {currentTime.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          })}
        </span>
        <span className="text-[11px] font-bold text-gray-300 mt-1 uppercase tracking-wider">
          {currentTime.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>

      {/* Spacer to push search to center */}
      <div className="hidden xl:flex xl:flex-1" />

      {/* Global Search - Responsive width */}
      <div className="relative flex-1 md:flex-[2] lg:flex-1 max-w-[600px] px-1 md:px-4 min-w-[100px]">
        <div className="relative w-full group">
          <input
            ref={searchInputRef}
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            placeholder="Search..."
            className="w-full h-10 md:h-11 pl-4 pr-3 md:pr-24 rounded-xl bg-[#363c48] border border-gray-600/20 text-white placeholder-gray-400 text-xs md:text-sm outline-none focus:ring-1 focus:ring-gray-400/30 transition-all shadow-sm"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden xl:flex items-center gap-1 opacity-60">
            <span className="text-[10px] font-bold text-gray-300 bg-gray-500/30 px-2 py-0.5 rounded border border-gray-400/20 shadow-sm">CTRL + /</span>
          </div>
        </div>

        {/* Search Results Dropdown - Responsive width */}
        {searchValue && isSearchFocused && (
          <div className="absolute top-full left-0 right-[-100px] md:right-0 mt-3 bg-white rounded-lg shadow-2xl border border-gray-100 overflow-y-auto max-h-[70vh] animate-fadeIn py-2 z-50 custom-scrollbar mx-2 md:mx-0">
            {searchResults.length > 0 ? (
              searchResults.map((cat, idx) => (
                <div key={idx} className="mb-2 last:mb-0">
                  <div className="px-4 py-1 flex items-center justify-between">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{cat.category}</h3>
                    <div className="h-px flex-1 ml-4 bg-gray-50" />
                  </div>
                  {cat.items.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => go(item.path)}
                      className="w-full px-4 py-3 flex items-center justify-between group hover:bg-[#FF7B1D]/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-[#FF7B1D] group-hover:bg-white transition-all border border-transparent group-hover:border-orange-100">
                          <FiFileText size={14} />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 group-hover:text-[#FF7B1D] truncate max-w-[200px] md:max-w-none">{item.name}</span>
                      </div>
                      <FiGrid size={12} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-gray-50/30">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-gray-100">
                  <FiSearch size={20} className="text-gray-300" />
                </div>
                <p className="text-sm text-gray-600 font-medium">No matches for <span className="text-[#FF7B1D]">"{searchValue}"</span></p>
                <p className="text-[11px] text-gray-400 mt-1">Try searching for HRM, Dashboard, or Leads</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Spacer to keep search centered */}
      <div className="hidden xl:flex xl:flex-1" />

      {/* Right Content */}
      <div className="flex items-center gap-1.5 md:gap-4 flex-shrink-0 ml-auto md:ml-0">
        {/* Action Icons */}
        <div className="flex items-center gap-1.5 md:gap-2">
          <button
            onClick={toggleFullScreen}
            className="hidden md:flex p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            title="Fullscreen"
          >
            <FiMaximize size={20} />
          </button>

          <div className="relative" ref={appsRef}>
            <button
              onClick={() => setAppsOpen(!appsOpen)}
              className={`hidden sm:flex p-2 rounded-lg transition-all ${appsOpen ? "bg-white/20 text-white" : "text-white/80 hover:text-white hover:bg-white/10"}`}
              title="Apps"
            >
              <FiGrid size={20} />
            </button>
            {appsOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-white rounded-lg shadow-2xl border border-gray-100 p-2 z-50 animate-fadeIn">
                <div className="flex flex-col gap-1">
                  {[
                    { name: "To Do", icon: <FiCheckSquare size={20} />, path: "/additional/todo", color: "text-blue-500" },
                    { name: "Notes", icon: <FiFileText size={20} />, path: "/additional/notes", color: "text-purple-500" },
                    { name: "Invoices", icon: <FiDollarSign size={20} />, path: "/additional/invoice", color: "text-green-500" },
                    { name: "Expenses", icon: <Wallet size={20} />, path: "/additional/expenses", color: "text-orange-500" },
                    { name: "Quotation", icon: <FileSignature size={20} />, path: "/additional/quotation", color: "text-indigo-500" },
                  ].map((app, i) => (
                    <button
                      key={i}
                      onClick={() => go(app.path)}
                      className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-gray-50 transition-all group"
                    >
                      <div className={`p-1.5 rounded-lg bg-gray-50 ${app.color} group-hover:bg-white`}>{app.icon}</div>
                      <span className="text-base font-bold text-gray-700">{app.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => go("/additional/messenger")}
            className="relative p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <FiMessageCircle size={20} />
            <span className="absolute top-1 right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 text-[9px] text-white items-center justify-center font-bold">5</span>
            </span>
          </button>

          <button
            onClick={() => go("/mail")}
            className="relative p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <FiMail size={20} />
            <span className="absolute top-1 right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 text-[9px] text-white items-center justify-center font-bold">5</span>
            </span>
          </button>

          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setNotificationOpen(!notificationOpen)}
              className={`relative p-2 rounded-lg transition-all ${notificationOpen ? "bg-white/20 text-white" : "text-white/80 hover:text-white hover:bg-white/10"}`}
            >
              <FiBell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] text-white items-center justify-center font-bold">{unreadCount}</span>
                </span>
              )}
            </button>
            {notificationOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-lg shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fadeIn">
                <div className="px-5 py-4 border-b border-gray-100 bg-white flex items-center justify-between">
                  <h3 className="text-[15px] font-bold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full uppercase tracking-wider">{unreadCount} New</span>
                  )}
                </div>
                <div className="max-h-[380px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 10).map((notif, i) => (
                      <button 
                        key={i} 
                        onClick={() => {
                          if (!notif.is_read) markAsRead(notif.id);
                          go("/additional/notification");
                        }}
                        className={`w-full px-5 py-4 flex gap-4 hover:bg-gray-50 transition-all border-b border-gray-50 last:border-0 text-left group ${!notif.is_read ? 'bg-orange-50/30' : ''}`}
                      >
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${!notif.is_read ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400 group-hover:bg-orange-100 group-hover:text-orange-600'}`}>
                          <FiBell size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] leading-tight transition-colors ${!notif.is_read ? 'font-bold text-gray-900' : 'font-medium text-gray-600'} group-hover:text-orange-600`}>
                            {notif.title}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-1.5 font-medium truncate">
                            {notif.message}
                          </p>
                          <p className={`text-[10px] mt-1.5 font-bold uppercase tracking-tight ${!notif.is_read ? 'text-orange-500' : 'text-gray-400'}`}>
                            {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        {!notif.is_read && (
                          <div className="w-2 h-2 bg-orange-500 rounded-full self-center" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="py-12 text-center">
                      <FiBell className="mx-auto text-gray-200 mb-2" size={32} />
                      <p className="text-sm font-medium text-gray-400">No notifications yet</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => go("/additional/notification")}
                  className="w-full py-4 text-center text-sm font-bold text-orange-500 hover:bg-gray-50 transition-all border-t border-gray-100"
                >
                  View All Notifications
                </button>
              </div>
            )}
          </div>

        </div>

        {/* User Profile */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center hover:bg-white/10 p-1 rounded-full transition-all"
          >
            <div className="w-10 h-10 rounded-full border-2 border-white/20 bg-orange-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
              {(userProfile?.profile_picture || user?.profile_picture) && !profileImageError ? (
                <img
                  src={resolveUrl(userProfile?.profile_picture || user?.profile_picture)}
                  alt="User"
                  className="w-full h-full object-cover"
                  onError={() => setProfileImageError(true)}
                />
              ) : null}
              {(!(userProfile?.profile_picture || user?.profile_picture) || profileImageError) && (
                <span>
                  {(userProfile?.firstName || user?.firstName)?.charAt(0).toUpperCase()}
                  {(userProfile?.lastName || user?.lastName)?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-64 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden z-50 animate-fadeIn">
              <div className="px-5 py-4 bg-gray-50/50 border-b border-gray-100">
                <p className="text-sm font-bold text-gray-800">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{user?.email}</p>
              </div>
              <div className="p-2">
                {[
                  { name: "My Profile", icon: <FiUser />, path: "/profile" },
                  { name: "Account Settings", icon: <FiSettings />, path: "/settings" },
                  { name: "Payment Details", icon: <FiCreditCard />, path: "/billing" },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => go(item.path)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-all"
                  >
                    <span className="text-gray-400">{item.icon}</span>
                    {item.name}
                  </button>
                ))}
              </div>
              <div className="p-2 border-t border-gray-100">
                <button
                  onClick={() => go("/logout")}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <FiLogOut /> Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
