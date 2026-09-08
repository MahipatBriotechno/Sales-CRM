import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { departmentApi } from "../store/api/departmentApi";
import { designationApi } from "../store/api/designationApi";
import { employeeApi } from "../store/api/employeeApi";
import { businessApi } from "../store/api/businessApi";
import { toggleSidebarLock } from "../store/slices/uiSlice";
import { permissionCategories } from "../pages/EmployeePart/permissionsData";
import {
  LayoutDashboard,
  ChevronDown,
  Briefcase,
  Users,
  ClipboardList,
  MessageSquare,
  StickyNote,
  CheckSquare,
  FileSignature,
  FileSpreadsheet,
  Wallet,
  Bell,
  Megaphone,
  Settings,
  LogOut,
  FolderKanban,
  BarChart3,
  Share2,
  CalendarCheck,
  FileText,
  Menu,
  X,
  HelpCircle,
  Building2,
  CreditCard,
  KeyRound,
  Package,
  Shield,
  Search,
  Lock,
  Unlock,
  Zap,
  Target,
  Calendar,
  Clock,
} from "lucide-react";

const Sidebar = ({ isOpen, setIsOpen }) => {
  const [openMenu, setOpenMenu] = useState("");
  const location = useLocation();
  const [activeItem, setActiveItem] = useState("/");
  const activeItemRef = React.useRef(null);
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const isLocked = useSelector((state) => state.ui.sidebarLocked);
  const [isHovered, setIsHovered] = useState(false);

  const handleItemClick = (path) => {
    setActiveItem(path);
    if (window.innerWidth <= 1024) setIsOpen(false);

    // Force re-fetch for specific routes by invalidating RTK Query tags
    if (path === "/hrm/department") {
      dispatch(departmentApi.util.invalidateTags(["Department"]));
    } else if (path === "/hrm/designation") {
      dispatch(designationApi.util.invalidateTags(["Designation"]));
    } else if (path === "/hrm/employee/all") {
      dispatch(employeeApi.util.invalidateTags(["Employee"]));
    } else if (path === "/settings/business-info") {
      dispatch(businessApi.util.invalidateTags(["BusinessInfo"]));
    }
  };

  useEffect(() => {
    setActiveItem(location.pathname);
    // Auto-open parent menu if child is active
    let newOpenMenu = "";
    menuItems.forEach((section) => {
      section.items.forEach((item) => {
        if (item.children) {
          const hasActiveChild = item.children.some(
            (child) => child.path === location.pathname
          );
          if (hasActiveChild) {
            newOpenMenu = item.name;
          }
        }
      });
    });
    setOpenMenu(newOpenMenu);

    // Scroll active item into view after a short delay to ensure DOM is updated
    setTimeout(() => {
      if (activeItemRef.current) {
        const element = activeItemRef.current;
        const container = element.closest(".overflow-y-auto");
        if (container) {
          const elementTop = element.offsetTop;
          const offset = 80;

          container.scrollTo({
            top: elementTop - offset,
            behavior: "smooth",
          });
        }
      }
    }, 100);
  }, [location.pathname]);

  const toggleMenu = (name) => {
    setOpenMenu((prev) => (prev === name ? "" : name));
  };

  const isParentActive = (item) => {
    if (item.path === activeItem) return true;
    if (item.children) {
      return item.children.some((c) => c.path === activeItem);
    }
    return false;
  };

  const checkPermission = (key) => {
    // If no user, or if role is missing, deny
    if (!user) return false;

    // Super Admin and Admin have full access
    if (user.role === 'Super Admin' || user.role === 'Admin') return true;

    // Employee Access Check
    if (user.role === 'Employee') {
      let perms = user.permissions;

      // Parse if string
      if (typeof perms === 'string') {
        try {
          perms = JSON.parse(perms);
        } catch (e) {
          return false;
        }
      }

      // Safety check
      if (!perms) return false;

      // 1. NEW Flat Array Structure (Array of strings)
      if (Array.isArray(perms)) {
        // Direct match (for specific IDs like 'attendance_view_all')
        if (perms.includes(key)) return true;

        // Category match using permissionCategories
        // This is the most accurate way since it checks if any ID in the category is granted
        const categoryPerms = permissionCategories[key];
        if (categoryPerms) {
          return categoryPerms.some(cp => perms.includes(cp.id));
        }

        // Fallback: Module match (only for category/module names, e.g., "Leads Management")
        // Specific IDs (e.g., "leads_view") contain underscores and should match directly
        if (!key.includes('_')) {
          const moduleKey = key.toLowerCase().replace(/\s+/g, '_');
          const fallbackMatch = perms.some(p =>
            (p.startsWith(moduleKey) || p.includes(moduleKey.split('_')[0])) &&
            (p.includes('view') || p.includes('read') || p.includes('use'))
          );
          if (fallbackMatch) return true;
        }

        return false;
      }

      // 2. OLD Object Structure (Backward Compatibility)
      // Check if the key itself is a granted permission (Flat object: { "perm_id": true })
      if (perms[key] === true) return true;

      // Check if it's a module object (Module structure: { "Module Name": { "read": true } })
      const modulePerms = perms[key];
      if (modulePerms && typeof modulePerms === 'object') {
        if (modulePerms.read === true || modulePerms.view === true || modulePerms.view_all === true) {
          return true;
        }
      }

      return false;
    }

    return false;
  };

  // Module Configuration
  const modules = [
    { id: "dashboard", name: "Dashboard", icon: <LayoutDashboard size={20} />, section: "Dashboard" },
    { id: "crm", name: "CRM", icon: <Users size={20} />, section: "CRM" },
    { id: "hrm", name: "HRM", icon: <Briefcase size={20} />, section: "HRM" },
    { id: "additional", name: "Additional", icon: <Package size={20} />, section: "Additional" },
    { id: "settings", name: "Settings", icon: <Settings size={20} />, section: "Settings" },
  ];

  // Add Super Admin module if user is Super Admin
  const availableModules = user?.role === "Super Admin"
    ? [{ id: "superadmin", name: "Admin", icon: <Shield size={20} />, section: "Super Admin" }, ...modules]
    : modules;

  // Detect active module from URL
  const getInitialModule = () => {
    const path = location.pathname;
    if (path.startsWith("/superadmin")) return "superadmin";
    if (path.startsWith("/crm")) return "crm";
    if (path.startsWith("/hrm")) return "hrm";
    if (path.startsWith("/settings")) return "settings";
    if (path.startsWith("/additional")) return "additional";

    // Priority for Super Admin
    if (user?.role === "Super Admin" && (path === "/" || path === "/dashboard")) return "superadmin";

    return "dashboard";
  };

  const [activeModule, setActiveModule] = useState(getInitialModule());

  // Detect active module from URL changes
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith("/superadmin")) setActiveModule("superadmin");
    else if (path.startsWith("/crm")) setActiveModule("crm");
    else if (path.startsWith("/hrm")) setActiveModule("hrm");
    else if (path.startsWith("/settings")) setActiveModule("settings");
    else if (path.startsWith("/additional")) setActiveModule("additional");
    else if (user?.role === "Super Admin" && (path === "/" || path === "/dashboard")) setActiveModule("superadmin");
    else setActiveModule("dashboard");
  }, [location.pathname, user?.role]);



  const menuItems = [
    {
      section: "Dashboard",
      items: [
        {
          name: "Dashboard",
          icon: <LayoutDashboard size={22} />,
          path: "/dashboard",
        },
        {
          name: "HRM Dashboard",
          icon: <LayoutDashboard size={22} />,
          path: "/hrm/dashboard",
          permission: "HRM Dashboard"
        },
        {
          name: "CRM Dashboard",
          icon: <LayoutDashboard size={22} />,
          path: "/crm/dashboard",
          permission: "CRM Dashboard"
        },
        {
          name: "Lead Dashboard",
          icon: <LayoutDashboard size={22} />,
          path: "/crm/leads/dashboard",
          permission: "Lead Dashboard"
        },
        {
          name: "Goal Dashboard",
          icon: <Target size={22} />,
          path: "/crm/goals",
          permission: "Goal Management"
        },
      ],
    },
    {
      section: "Super Admin",
      items: [
        {
          name: "Super Admin Dashboard",
          icon: <LayoutDashboard size={22} />,
          path: "/superadmin/dashboard",
          permission: "Super Admin Dashboard"
        },
        {
          name: "Enterprise",
          icon: <Building2 size={22} />,
          path: "/superadmin/enterprises",
          permission: "Enterprise Management",
        },
        {
          name: "Subscription",
          icon: <CreditCard size={16} />,
          path: "/superadmin/subscriptions",
          permission: "Subscription Management",
        },
        {
          name: "Plan",
          icon: <Package size={22} />,
          path: "/superadmin/plans",
          permission: "Plan Management",
        },
        {
          name: "Product Keys",
          icon: <KeyRound size={22} />,
          path: "/superadmin/productkeys",
          permission: "Product Key Management",
        },
        {
          name: "Wallet",
          icon: <Wallet size={22} />,
          path: "/superadmin/wallet",
          permission: "Payment Gateway Management",
        },
        {
          name: "Payment",
          icon: <Wallet size={22} />,
          path: "/superadmin/paymentgateways",
          permission: "Payment Gateway Management",
          children: [
            { name: "Cashfree", path: "/superadmin/paymentgateways/Cashfree" },
            { name: "PhonePay", path: "/superadmin/paymentgateways/PhonePay" },
            { name: "Razorpay", path: "/superadmin/paymentgateways/Razorpay" },
          ],
        }
      ],
    },
    {
      section: "CRM",
      items: [
        {
          name: "CRM Dashboard",
          icon: <LayoutDashboard size={22} />,
          path: "/crm/dashboard",
          permission: "CRM Dashboard"
        },
        {
          name: "Work Station",
          icon: <ClipboardList size={22} />,
          path: "/crm/leads/work-station",
          permission: "Leads Management",
        },
        {
          name: "Leads Management",
          icon: <Users size={22} />,
          path: "/crm/leads",
          permission: "Leads Management",
          children: [
            { name: "Lead Dashboard", path: "/crm/leads/dashboard" },
            { name: "All Leads", path: "/crm/leads/all" },
            { name: "New Leads", path: "/crm/leads/new" },
            { name: "Assigned", path: "/crm/leads/assigned" },
            { name: "Not Connected", path: "/crm/leads/not-connected" },
            { name: "Follow Up", path: "/crm/leads/follow-up" },
            { name: "Missed", path: "/crm/leads/missed" },
            { name: "Dropped", path: "/crm/leads/dropped" },
            { name: "Duplicates", path: "/crm/leads/duplicates" },
            { name: "Trending", path: "/crm/leads/trending" },
            { name: "Won", path: "/crm/leads/won" },
            { name: "Trash", path: "/crm/leads/trash" },
          ],
        },
        {
          name: "Analysis & Report",
          icon: <BarChart3 size={22} />,
          path: "/crm/leads/analysis",
          permission: "Leads Management"
        },

        // {
        //   name: "campaign",
        //   icon: <Users size={16} />,
        //   path: "/crm/champions",
        //   permission: "Champions",
        //   children: [
        //     { name: "Lead", path: "/crm/champions/lead" },
        //     { name: "Dialer ", path: "/crm/champions/dialer" },
        //     { name: "Whatsapp", path: "/crm/champions/whatsapp" },
        //     { name: "Mail", path: "/crm/champions/mail" },
        //   ],
        // },
        {
          name: "Pipeline Management",
          icon: <FolderKanban size={22} />,
          path: "/crm/pipeline",
          permission: "Pipeline Management",
          children: [
            { name: "Manage Pipeline", path: "/crm/pipeline/manage" },
            // { name: "Manage Stages", path: "/crm/pipeline/stages" },
            { name: "Analytics", path: "/crm/pipeline/analytics" },
          ],
        },
        {
          name: "Client Management",
          icon: <Briefcase size={22} />,
          path: "/crm/client/all",
          permission: "Client Management",


        },
        {
          name: "Channel Integration",
          icon: <Share2 size={22} />,
          path: "/crm/channel",
          permission: "Channel Integration",
          children: [
            { name: "Meta", path: "/crm/channel/meta" },
            { name: "Justdial", path: "/crm/channel/justdial" },
            { name: "Indiamart", path: "/crm/channel/indiamart" },
            { name: "Google Docs", path: "/crm/channel/google-docs" },
            { name: "CRM Form", path: "/crm/channel/form" },
          ],
        },
        {
          name: "Campaign",
          icon: <Settings size={22} />,
          path: "/crm/channel/settings",
          permission: "Campaign Management"
        },
        {
          name: "Custom Fields",
          icon: <Settings size={22} />,
          path: "/crm/leads/custom-fields",
          permission: "System Administration"
        },

      ],
    },
    {
      section: "HRM",
      items: [
        {
          name: "HRM Dashboard",
          icon: <LayoutDashboard size={22} />,
          path: "/hrm/dashboard",
          permission: "HRM Dashboard"
        },
        {
          name: "Team Management",
          icon: <Users size={22} />,
          path: "/hrm/teams",
          permission: "Team Management"
        },
        {
          name: "Attendance",
          permission: "Attendance Management",
          icon: <CalendarCheck size={22} />,
          children: [
            ...(user?.role === 'Employee' ? [{
              name: "My Attendance",
              path: "/hrm/attendance/employee",
              permission: "attendance_view_own"
            }] : []),
            {
              name: "Overview",
              path: "/hrm/attendance",
              permission: "attendance_view_all"
            },
            {
              name: "Records",
              path: "/hrm/attendance/records",
              permission: "attendance_view_all"
            },
            {
              name: "Settings",
              path: "/hrm/attendance/settings",
              permission: "attendance_edit"
            },
          ],
        },


        {
          name: "Leave Management",
          icon: <ClipboardList size={22} />,
          path: "/hrm/leave",
          permission: "Leave Management",
          children: [
            { name: "Leave", path: "/hrm/leave/all" },
            { name: "Holidays", path: "/hrm/leave/holiday" },
            { name: "Manage leave", path: "/hrm/leave/manage" },
          ],
        },
        {
          name: "Employee",
          icon: <Users size={22} />,
          path: "/hrm/employee/all",
          permission: "Employee Management"
        },
        {
          name: "Department",
          icon: <Briefcase size={22} />,
          path: "/hrm/department",
          permission: "Department Management"
        },
        {
          name: "Designation",
          icon: <FileText size={22} />,
          path: "/hrm/designation",
          permission: "Designation Management"
        },
        {
          name: "Shift",
          icon: <Clock size={22} />,
          path: "/hrm/shift",
          permission: "HRM"
        },

        {
          name: "Payroll", icon: <Wallet size={22} />, path: "/hrm/salary", permission: "Financial Management"
        },
        {
          name: "Company Policy",
          icon: <FileText size={22} />,
          path: "/hrm/company-policy",
          permission: "Policy & Compliance"
        },
        {
          name: "HR Policy",
          icon: <FileText size={22} />,
          path: "/hrm/hr-policy",
          permission: "Policy & Compliance"
        },
        {
          name: "Job Management",
          icon: <Briefcase size={22} />,
          permission: "Recruitment",
          children: [
            { name: "Job List", path: "/hrm/job-management", permission: "Recruitment" },
            { name: "Applicant List", path: "/hrm/applicants", permission: "Recruitment" },
            { name: "Offer Letter", path: "/hrm/offer-letters", permission: "Offer Letter Management" },
          ],
        },
      ],
    },
    {
      section: "Additional",
      items: [
        {
          name: "Catelogs",
          icon: <BarChart3 size={22} />,
          path: "/additional/catelogs",
          permission: "Communication Tools",
        },
        {
          name: "Notes",
          icon: <StickyNote size={22} />,
          path: "/additional/notes",
          permission: "Communication Tools"
        },
        {
          name: "To-Do",
          icon: <CheckSquare size={22} />,
          path: "/additional/todo",
          permission: "Task Management"
        },
        {
          name: "Quotation",
          icon: <FileSignature size={22} />,
          path: "/additional/quotation",
          permission: "Financial Documents"
        },
        {
          name: "Invoice",
          icon: <FileSpreadsheet size={22} />,
          path: "/additional/invoice",
          permission: "Financial Documents"
        },
        {
          name: "My Expenses",
          icon: <Wallet size={22} />,
          path: "/additional/expenses",
          permission: "Financial Management"
        },
        {
          name: "Announcement",
          icon: <Megaphone size={22} />,
          path: "/additional/announcement",
          permission: "Communication Tools",
        },
        {
          name: "Messenger",
          icon: <MessageSquare size={22} />,
          path: "/additional/messenger",
          permission: "Communication Tools",
        },
        {
          name: "Meeting",
          icon: <Calendar size={22} />,
          path: "/additional/meeting",
          permission: "Meeting Management",
        },
        {
          name: "Visitor",
          icon: <Users size={22} />,
          path: "/additional/visitor",
          permission: "Visitor Management",
        },
        {
          name: "Notification",
          icon: <Bell size={22} />,
          path: "/additional/notification",
          permission: "Communication Tools",
        },
      ],
    },
    {
      section: "Settings",
      items: [
        {
          name: "Business Info",
          icon: <Settings size={22} />,
          path: "/settings/business-info",
          permission: "System Administration"
        },
        {
          name: "Manage Subscription",
          icon: <BarChart3 size={22} />,
          path: "/settings/subscription",
          permission: "System Administration"
        },

        {
          name: "FAQ",
          icon: <HelpCircle size={22} />,
          path: "/settings/faq",
          permission: "FAQ Management"
        },
        { name: "Logout", icon: <LogOut size={22} />, path: "/logout" },
      ],
    },
  ];

  /* Filtering */
  const filteredMenuItems = menuItems
    .filter((section) => {
      // Role-based filtering - Only Super Admins can see the Super Admin section
      if (section.section === "Super Admin" && user?.role !== "Super Admin") {
        return false;
      }

      // Show Dashboard section only when in the main Dashboard rail
      if (section.section === "Dashboard") return activeModule === "dashboard";

      // Module-wise filtering - Show sections belonging to the active module
      const currentModule = availableModules.find(m => m.id === activeModule);
      return currentModule?.section === section.section;
    })
    .map(section => {
      // Filter the items within each section based on permissions
      const filteredItems = section.items.filter(item => {
        // If it's a Super Admin or the item has no permission key, show it
        if (user?.role === "Super Admin" || !item.permission) return true;

        // Special case: Admin role bypass
        if (user?.role === "Admin") return true;

        // Check if user has permission for this item
        const hasPermission = checkPermission(item.permission);

        return hasPermission;
      }).map(item => {
        // If the item has children, filter them as well
        if (item.children) {
          return {
            ...item,
            children: item.children.filter(child => {
              if (user?.role === "Super Admin" || !child.permission) return true;
              if (user?.role === "Admin") return true;
              return checkPermission(child.permission);
            })
          };
        }
        return item;
      });

      return {
        ...section,
        items: filteredItems
      };
    })
    .filter(section => section.items.length > 0); // Hide sections that have no visible items


  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[998] xl:hidden transition-all duration-300 animate-fadeIn"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Toggle */}
      <button
        className={`fixed top-[15px] left-4 z-[1000] xl:hidden flex items-center justify-center transition-all duration-300 ${isOpen
          ? "w-10 h-10 bg-[#FF7B1D] rounded-xl text-white shadow-lg shadow-orange-200"
          : "text-white"
          }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X strokeWidth={3} size={24} /> : <Menu strokeWidth={2.5} size={28} />}
      </button>

      {/* Sidebar Container */}
      <aside
        onMouseEnter={() => !isLocked && setIsHovered(true)}
        onMouseLeave={() => !isLocked && setIsHovered(false)}
        className={`fixed top-0 left-0 h-screen bg-white shadow-xl flex transition-all duration-300 z-[999] ${isOpen ? "translate-x-0" : "-translate-x-full"
          } xl:translate-x-0 w-[280px] ${isLocked || isHovered ? "xl:w-[280px]" : "xl:w-[68px]"}`}
      >
        {/* Module Rail - Left */}
        <div className="w-[68px] bg-[#f8f9fa] border-r border-[#eee] flex flex-col items-center py-4 gap-4 z-10 no-scrollbar overflow-y-auto !overflow-hidden">
          <div className="mb-4 hidden md:block">
            <div className="w-10 h-10 bg-[#FF7B1D] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-orange-200">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-3 w-full items-center">
            {availableModules.map((module) => {
              const isActive = activeModule === module.id;
              return (
                <div key={module.id} className="relative group w-full flex justify-center">
                  {/* Active Indicator Bar */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#FF7B1D] rounded-r-full" />
                  )}

                  <button
                    onClick={() => setActiveModule(module.id)}
                    className={`relative p-3 rounded-2xl transition-all duration-300 ${isActive
                      ? "bg-white text-[#FF7B1D] shadow-md scale-110"
                      : "text-gray-400 hover:bg-white hover:text-gray-600 hover:shadow-sm"
                      }`}
                    title={module.name}
                  >
                    {module.icon}
                  </button>

                  {/* Tooltip */}
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50 font-medium">
                    {module.name}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Rail Action */}
          <div className="mt-auto pb-4">
            <button title="Help Center" className="p-3 text-gray-400 hover:text-gray-600">
              <HelpCircle size={20} />
            </button>
          </div>
        </div>

        {/* Navigation Panel - Right */}
        <div className="flex-1 flex flex-col min-w-0 bg-white shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="px-6 pt-4 pb-2 border-b border-gray-50 mb-0 bg-gradient-to-r from-white to-gray-50/30">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2 tracking-tight">
                {availableModules.find(m => m.id === activeModule)?.name}
              </h2>
              <button
                onClick={() => dispatch(toggleSidebarLock())}
                className={`p-1.5 rounded-lg transition-all hidden xl:block ${isLocked ? "text-[#FF7B1D] bg-orange-50" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}
                title={isLocked ? "Unlock Sidebar" : "Lock Sidebar"}
              >
                {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FF7B1D] animate-pulse" />
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider whitespace-nowrap">
                {activeModule === "crm" ? "Sales & Leads Management" :
                  activeModule === "hrm" ? "Human Resource System" :
                    activeModule === "superadmin" ? "Platform Administration" :
                      activeModule === "settings" ? "System Configuration" :
                        "Additional Modules"}
              </p>
            </div>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto pt-2 px-3 pb-4 custom-scrollbar">
            {filteredMenuItems.map((section, idx) => (
              <div key={idx} className="mb-8 last:mb-0">


                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const hasChildren = item.children && item.children.length > 0;
                    const parentActive = isParentActive(item);
                    const isOpenThis = openMenu === item.name;

                    return (
                      <div key={item.name}>
                        {!hasChildren ? (
                          <Link
                            to={item.path}
                            ref={parentActive ? activeItemRef : null}
                            className={`group flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all duration-300 text-[13.5px] whitespace-nowrap ${parentActive
                              ? "bg-[#FF7B1D] text-white shadow-[#FF7B1D]/30 shadow-xl scale-[1.02] -translate-y-0.5"
                              : "hover:bg-gray-50 text-gray-600 hover:text-[#FF7B1D] hover:pl-5"
                              }`}
                            onClick={() => handleItemClick(item.path)}
                          >
                            <span className={`transition-colors duration-300 ${parentActive ? "text-white" : "text-gray-400 group-hover:text-[#FF7B1D]"}`}>
                              {item.icon && React.cloneElement(item.icon, { size: 18 })}
                            </span>
                            <span className="truncate">{item.name}</span>
                          </Link>
                        ) : (
                          <>
                            <div
                              className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-300 font-semibold text-[14px] whitespace-nowrap ${parentActive
                                ? "text-[#FF7B1D] bg-orange-50/50"
                                : "text-[#444] hover:bg-gray-50 hover:text-black"
                                }`}
                              onClick={() => toggleMenu(item.name)}
                            >
                              <div className="flex items-center gap-3 overflow-hidden">
                                <span className={parentActive ? "text-[#FF7B1D]" : "text-gray-400"}>
                                  {item.icon && React.cloneElement(item.icon, { size: 18 })}
                                </span>
                                <span className="truncate">{item.name}</span>
                              </div>
                              <ChevronDown
                                size={14}
                                className={`transition-transform duration-300 flex-shrink-0 ${isOpenThis ? "rotate-180" : ""}`}
                              />
                            </div>

                            {/* Submenu */}
                            <div
                              className={`ml-9 overflow-hidden transition-all duration-300 ease-in-out ${isOpenThis ? "max-h-[500px] mt-1 opacity-100" : "max-h-0 opacity-0"}`}
                            >
                              <div className="border-l-2 border-orange-100 pl-3 py-1 space-y-1">
                                {item.children.map((sub) => {
                                  const subActive = activeItem === sub.path;
                                  return (
                                    <Link
                                      key={sub.name}
                                      to={sub.path}
                                      ref={subActive ? activeItemRef : null}
                                      className={`block px-3 py-1.5 rounded-lg transition-all duration-200 text-[13px] font-medium whitespace-nowrap truncate ${subActive
                                        ? "text-[#FF7B1D] bg-orange-50"
                                        : "text-gray-500 hover:text-[#FF7B1D] hover:bg-gray-50"
                                        }`}
                                      onClick={() => {
                                        handleItemClick(sub.path);
                                        setOpenMenu(item.name);
                                      }}
                                    >
                                      {sub.name}
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside >

      {/* Overlay for Mobile */}
      {
        isOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 xl:hidden animate-fadeIn"
            onClick={() => setIsOpen(false)}
          />
        )
      }

      <style>{`
        /* Custom scrollbar styling */
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #FF7B1D;
          border-radius: 2px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #E66A0D;
        }

        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
};

export default Sidebar;
