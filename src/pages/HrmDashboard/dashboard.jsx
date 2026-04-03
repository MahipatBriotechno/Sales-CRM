import React from "react";
import DashboardLayout from "../../components/DashboardLayout";
import {
  Users,
  Calendar,
  ClipboardList,
  DollarSign,
  BookOpen,
  UserCheck,
  Clock,
  Award,
  Home,
  Loader2,
  AlertCircle,
  RefreshCw,
  Warehouse,
  UserPlus,
  Briefcase,
  Bell,
  Gift,
  Megaphone,
  Search,
  Download,
  Filter as FilterIcon,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import NumberCard from "../../components/NumberCard";
import ActionGuard from "../../components/common/ActionGuard";
import { useGetHRMDashboardDataQuery } from "../../store/api/hrmDashboardApi";

export default function HRMDashboard() {
  const navigate = useNavigate();
  const { data: dashboardResponse, isLoading, isFetching, isError, error, refetch } = useGetHRMDashboardDataQuery();

  // Handle loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading Dashboard Data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Handle error state
  if (isError) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4 p-8 bg-red-50 rounded-sm border border-red-100 max-w-md text-center shadow-lg">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <h2 className="text-xl font-bold text-gray-800 tracking-tight">Oops! Something went wrong</h2>
            <p className="text-red-600 font-medium text-sm">
              {error?.data?.message || "Failed to fetch dashboard data. Please try again later."}
            </p>
            <button onClick={refetch} className="mt-2 px-6 py-2 bg-red-600 text-white rounded-sm font-bold text-xs uppercase transition hover:bg-red-700 shadow-md">
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const dashboardData = dashboardResponse?.data || {};

  // Static Data Fallbacks
  const leaveRequests = dashboardData.leaveRequests || [];
  const recentJoiners = dashboardData.recentJoiners || [];
  const departmentDistribution = (dashboardData.departmentDistribution || dashboardData.departmentOverview) || [];

  const summary = {
    totalEmployees: dashboardData.summary?.totalEmployees?.value || 0,
    presentToday: dashboardData.summary?.presentToday?.value || 0,
    onLeave: dashboardData.summary?.onLeave?.value || 0,
    newAlerts: dashboardData.summary?.unreadLeads?.value || 0,
    trends: {
      total: dashboardData.summary?.totalEmployees?.trend || "0%",
      present: dashboardData.summary?.presentToday?.trend || "0%",
      leave: dashboardData.summary?.onLeave?.trend || "N/A",
      alerts: dashboardData.summary?.unreadLeads?.trend || "N/A"
    }
  };

  const anniversaries = dashboardData.anniversaries || [];
  const announcements = dashboardData.announcements || [];
  const hiringPipeline = dashboardData.hiringPipeline || [];
  const attendanceData = dashboardData.attendanceData || [];

  const COLORS = [
    "#f97316",
    "#fb923c",
    "#fdba74",
    "#fed7aa",
    "#ffedd5",
    "#ea580c",
  ];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white font-primary">
        {/* Header Section */}
        <div className="bg-white sticky top-0 z-30">
          <div className="max-w-[100%] mx-auto px-6 py-4 border-b">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Left Title Section */}
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  HRM Dashboard
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-black rounded-full border border-green-100 animate-pulse">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    LIVE
                  </span>
                </h1>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                  <Home className="text-gray-700" size={14} />
                  <span className="text-gray-400">HRM / </span>
                  <span className="text-[#FF7B1D] font-medium">Dashboard</span>
                </p>
              </div>

              {/* Right Action Section */}
              <div className="flex items-center gap-3">
                <button
                  onClick={refetch}
                  className="p-3 bg-white border border-gray-200 rounded-sm hover:bg-gray-50 text-gray-600 transition-all shadow-sm active:scale-95 group"
                  title="Refresh Dashboard"
                >
                  <RefreshCw size={18} className={`${isFetching ? "animate-spin text-orange-500" : "group-hover:text-orange-500"}`} />
                </button>

                <ActionGuard permission="employees_create" module="Employee Management" type="create">
                  <button
                    onClick={() => navigate("/hrm/employee/all")}
                    className="flex items-center gap-2 px-6 py-3 rounded-sm font-semibold transition shadow-lg hover:shadow-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 active:scale-95 whitespace-nowrap"
                  >
                    <Users size={18} />
                    Add New Employee
                  </button>
                </ActionGuard>
              </div>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="max-w-[100%] mx-auto px-4 mt-2 pb-4 space-y-6">
            {/* KPI Matrices */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Employees */}
              <div className="rounded-sm shadow-sm border border-gray-200 p-4 border-t-4 border-t-blue-500 bg-blue-50/50 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-sm bg-white border border-gray-100 shadow-sm">
                      <Users size={18} className="text-blue-500" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800 capitalize tracking-tight font-primary">Total Employees</h3>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="bg-white text-gray-700 text-[11px] font-bold px-2 py-0.5 rounded-full border border-gray-100 shadow-sm">
                      {summary.totalEmployees}
                    </span>
                    <span className="text-[9px] font-bold text-green-600 mt-1">{summary.trends.total} growth</span>
                  </div>
                </div>
              </div>

              {/* Present Today */}
              <div className="rounded-sm shadow-sm border border-gray-200 p-4 border-t-4 border-t-green-500 bg-green-50/50 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-sm bg-white border border-gray-100 shadow-sm">
                      <UserCheck size={18} className="text-green-500" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800 capitalize tracking-tight font-primary">Present Today</h3>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="bg-white text-gray-700 text-[11px] font-bold px-2 py-0.5 rounded-full border border-gray-100 shadow-sm">
                      {summary.presentToday}
                    </span>
                    <span className="text-[9px] font-bold text-green-600 mt-1">{summary.trends.present} presence</span>
                  </div>
                </div>
              </div>

              {/* On Leave */}
              <div className="rounded-sm shadow-sm border border-gray-100 p-4 border-t-4 border-t-orange-500 bg-orange-50/50 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-sm bg-white border border-gray-100 shadow-sm">
                      <Clock size={18} className="text-orange-500" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800 capitalize tracking-tight font-primary">On Leave</h3>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="bg-white text-gray-700 text-[11px] font-bold px-2 py-0.5 rounded-full border border-gray-100 shadow-sm">
                      {summary.onLeave}
                    </span>
                    <span className="text-[9px] font-bold text-rose-600 mt-1">{summary.trends.leave} status</span>
                  </div>
                </div>
              </div>

              {/* New Alerts */}
              <div className="rounded-sm shadow-sm border border-gray-200 p-4 border-t-4 border-t-purple-500 bg-purple-50/50 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-sm bg-white border border-gray-100 shadow-sm">
                      <Award size={18} className="text-purple-500" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800 capitalize tracking-tight font-primary">New Alerts</h3>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="bg-white text-gray-700 text-[11px] font-bold px-2 py-0.5 rounded-full border border-gray-100 shadow-sm">
                      {summary.newAlerts}
                    </span>
                    <span className="text-[9px] font-bold text-green-600 mt-1">{summary.trends.alerts}</span>
                  </div>
                </div>
              </div>
            </div>


            {/* Attendance & Department Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Attendance Chart */}
              <div className="bg-white rounded-sm border border-orange-100 shadow-lg p-6 flex flex-col">
                <div className="flex items-center mb-8">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 mr-4 shadow-md">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 leading-tight">Weekly Attendance</h2>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Presence tracking</p>
                  </div>
                </div>
                <div className="flex-1">
                  {attendanceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={attendanceData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#9ca3af' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#9ca3af' }} />
                        <Tooltip
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ borderRadius: '4px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                        />
                        <Bar dataKey="present" fill="#f97316" radius={[2, 2, 0, 0]} barSize={20} />
                        <Bar dataKey="absent" fill="#cbd5e1" radius={[2, 2, 0, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[260px] text-gray-400">
                      <Calendar size={48} className="mb-4 opacity-10" />
                      <p className="text-xs font-bold uppercase tracking-widest">No attendance data</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Department Distribution */}
              <div className="bg-white rounded-sm border border-blue-50 shadow-lg p-6 flex flex-col">
                <div className="flex items-center mb-8">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 mr-4 shadow-md">
                    <Warehouse size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 leading-tight">Department Layout</h2>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Employee distribution</p>
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  {departmentDistribution.length > 0 ? (
                    <div className="h-44 w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Tooltip
                            contentStyle={{ borderRadius: '4px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px', fontSize: '12px', fontWeight: 'bold' }}
                          />
                          <Pie
                            data={departmentDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={4}
                            dataKey="employees"
                          >
                            {departmentDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-44 text-gray-400">
                      <Warehouse size={40} className="mb-2 opacity-10" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">No allocation data</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Leave Requests */}
              <div className="lg:col-span-2 bg-white rounded-sm border border-gray-100 shadow-lg p-6 flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 mr-4 shadow-md">
                      <ClipboardList size={24} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 leading-tight">Leave Requests</h2>
                      <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Pending approvals</p>
                    </div>
                  </div>
                  <ActionGuard permission="leave_management_read" module="Leave Management" type="read">
                    <button
                      onClick={() => navigate("/hrm/leave/all")}
                      className="text-indigo-600 text-[11px] font-bold hover:bg-indigo-50 px-4 py-2 border border-indigo-200 rounded-sm shadow-sm transition-all uppercase tracking-widest active:scale-95"
                    >
                      View All
                    </button>
                  </ActionGuard>
                </div>
                <div className="space-y-4">
                  {leaveRequests.length > 0 ? (
                    leaveRequests.slice(0, 5).map((request, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-sm border border-slate-100 hover:border-indigo-500 hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <Avatar
                              src={request.avatar}
                              name={request.name}
                              sizeClass="w-10 h-10"
                              bgClass="bg-slate-900"
                              colorClass="text-white"
                              textClass="text-sm"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 text-sm">{request.name}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{request.department} • {request.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-0.5 rounded-[2px] text-[9px] font-black uppercase tracking-tighter shadow-sm ${request.status?.toLowerCase() === "pending" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                            request.status?.toLowerCase() === "approved" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                              "bg-rose-50 text-rose-600 border border-rose-100"
                            }`}>
                            {request.status}
                          </span>
                          <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase tracking-widest">{request.date} • {request.days}D</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <ClipboardList size={48} className="mb-4 opacity-10" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">No pending leave requests</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions & Monthly Performance */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Control Panel</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: <UserCheck className="w-6 h-6" />, label: "Attendance", color: "orange", path: "/hrm/attendance" },
                    { icon: <ClipboardList className="w-6 h-6" />, label: "Leaves", color: "blue", path: "/hrm/leave/all" },
                    { icon: <DollarSign className="w-6 h-6" />, label: "Salary", color: "green", path: "/hrm/salary" },
                    { icon: <BookOpen className="w-6 h-6" />, label: "Policies", color: "purple", path: "/hrm/company-policy" }
                  ].map((action, i) => (
                    <button
                      key={i}
                      onClick={() => navigate(action.path)}
                      className="flex flex-col items-center justify-center p-5 bg-white border border-gray-100 rounded-sm shadow-sm hover:shadow-xl hover:border-orange-500/50 transition-all group active:scale-95"
                    >
                      <div className={`p-3 rounded-sm mb-3 group-hover:scale-110 transition-transform bg-${action.color}-50 text-${action.color}-600`}>
                        {action.icon}
                      </div>
                      <p className="font-bold text-gray-800 text-[10px] uppercase tracking-widest">{action.label}</p>
                    </button>
                  ))}
                </div>

                {/* Monthly Performance Mini Card */}
                {/* <div className="bg-slate-900 rounded-sm p-6 text-white shadow-2xl relative overflow-hidden border border-slate-800 mt-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Efficiency Index</p>
                    <TrendingUp size={18} className="text-orange-500" />
                  </div>
                  <div className="space-y-5">
                    <div>
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                        <span className="text-slate-400">Presence</span>
                        <span className="text-orange-500">94%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden shadow-inner">
                        <div className="bg-orange-600 h-full rounded-full" style={{ width: "94%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                        <span className="text-slate-400">Projects</span>
                        <span className="text-blue-500">78%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden shadow-inner">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: "78%" }} />
                      </div>
                    </div>
                  </div>
                </div> */}
              </div>
            </div>


            {/* Dashboard Row: Joiners, Pulse, Pipeline */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
              {/* Recent Joiners */}
              <div className="bg-white rounded-sm border border-gray-100 shadow-lg p-6 flex flex-col h-full">
                <div className="flex items-center mb-8 text-wrap">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 mr-4 shadow-md flex-shrink-0">
                    <UserPlus size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 leading-tight">Recent Joiners</h2>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Welcome aboard</p>
                  </div>
                </div>
                <div className="space-y-4 flex-1">
                  {recentJoiners.length > 0 ? (
                    recentJoiners.slice(0, 5).map((joiner, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-sm border border-slate-100 hover:border-orange-500 hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <Avatar
                              src={joiner.avatar}
                              name={joiner.name}
                              sizeClass="w-10 h-10"
                              bgClass="bg-orange-100"
                              colorClass="text-orange-600"
                            />
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                          </div>
                          <div className="overflow-hidden">
                            <p className="font-bold text-gray-800 text-sm truncate">{joiner.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">{joiner.designation}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400 h-full">
                      <UserPlus size={40} className="mb-2 opacity-10" />
                      <p className="text-[9px] font-bold uppercase tracking-widest">No recent arrivals</p>
                    </div>
                  )}
                </div>
                <ActionGuard permission="employees_read" module="Employee Management" type="read">
                  <button
                    onClick={() => navigate("/hrm/employee/all")}
                    className="mt-6 w-full py-2.5 bg-slate-900 text-white rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-md active:scale-95"
                  >
                    View Directory
                  </button>
                </ActionGuard>
              </div>

              {/* Company Pulse */}
              <div className="bg-white rounded-sm border border-gray-100 shadow-lg p-6 flex flex-col h-full">
                <div className="flex items-center mb-8">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 mr-4 shadow-md flex-shrink-0">
                    <Megaphone size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 leading-tight">Company Pulse</h2>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">News & Birthdays</p>
                  </div>
                </div>
                <div className="space-y-4 flex-1">
                  {announcements.length > 0 ? (
                    announcements.slice(0, 2).map((item) => (
                      <div key={item.id} className="p-4 bg-slate-50 border border-slate-100 rounded-sm hover:border-rose-500 transition-all group">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-gray-800 text-xs group-hover:text-rose-600 transition-colors uppercase tracking-tight">{item.title}</h4>
                          <span className="text-[8px] font-black uppercase text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">{item.tag}</span>
                        </div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{item.date}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-gray-400 border border-dashed border-gray-200 rounded-sm">
                      <p className="text-[9px] font-bold uppercase tracking-widest">No announcements</p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                      <Gift size={16} className="text-orange-500" />
                      <span className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Upcoming</span>
                    </div>
                    <div className="space-y-3">
                      {anniversaries.length > 0 ? (
                        anniversaries.slice(0, 2).map((anniversary, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <Avatar
                              src={anniversary.avatar}
                              name={anniversary.name}
                              sizeClass="w-8 h-8"
                              textClass="text-[10px]"
                              bgClass="bg-slate-100"
                              colorClass="text-slate-600"
                            />
                            <div>
                              <p className="text-xs font-bold text-gray-800">{anniversary.name}</p>
                              <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">🏆 {anniversary.years}Y • {anniversary.date}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-[9px] text-gray-400 font-bold text-center py-2">No upcoming anniversaries</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {/* Hiring Pipeline */}
              <div className="bg-slate-900 rounded-sm shadow-xl p-6 flex flex-col text-white relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl font-bold">Hiring Pipeline</h2>
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Talent acquisition</p>
                  </div>
                  <div className="p-2 bg-blue-500/20 rounded-sm">
                    <Briefcase size={20} className="text-blue-500" />
                  </div>
                </div>

                <div className="space-y-6 flex-1 flex flex-col justify-center">
                  {hiringPipeline.length > 0 ? (
                    hiringPipeline.map((item, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between items-end">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{item.stage}</span>
                          <span className="text-sm font-black text-white">{item.count}</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                          <div
                            className={`${item.color} h-full rounded-full transition-all duration-1000`}
                            style={{ width: `${(item.count / 30) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-500 border border-slate-800 border-dashed rounded-sm">
                      <Briefcase size={32} className="mb-2 opacity-10" />
                      <p className="text-[9px] font-bold uppercase tracking-widest">Queue empty</p>
                    </div>
                  )}
                </div>
                <ActionGuard permission="job_management_read" module="Job Management" type="read">
                  <button
                    onClick={() => navigate("/hrm/job-management")}
                    className="mt-8 w-full py-2.5 bg-white/5 border border-white/10 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all text-blue-400 active:scale-95"
                  >
                    Portal
                  </button>
                </ActionGuard>
              </div>
            </div>
            <div className="w-full mb-12">
              <div className="bg-white rounded-sm border border-gray-100 shadow-lg p-6 flex flex-col">
                <div className="flex items-center mb-8">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 mr-4 shadow-md flex-shrink-0">
                    <Warehouse size={24} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold text-gray-800 leading-tight">Department Pulse</h2>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded-full border border-blue-100 uppercase tracking-tighter">Enterprise View</span>
                    </div>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Headcount & Attendance</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <button className="p-2 border border-gray-200 rounded-sm hover:bg-gray-50 transition-colors">
                      <FilterIcon size={14} className="text-gray-500" />
                    </button>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Showing all departments</span>
                  </div>
                  <ActionGuard permission="hrm_dashboard_export" module="HRM Dashboard" type="read">
                    <button className="flex items-center gap-1.5 text-[10px] font-black uppercase text-blue-600 hover:text-blue-700 transition-colors">
                      <Download size={14} />
                      Export Report
                    </button>
                  </ActionGuard>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Department</th>
                        <th className="pb-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Staff</th>
                        <th className="pb-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Present</th>
                        <th className="pb-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">On Leave</th>
                        <th className="pb-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Avg Stats</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {departmentDistribution.length > 0 ? (
                        departmentDistribution.map((dept, index) => (
                          <tr key={index} className="group hover:bg-slate-50 transition-colors">
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-2.5 h-2.5 rounded-full shadow-sm"
                                  style={{ backgroundColor: dept.color || COLORS[index % COLORS.length] }}
                                ></div>
                                <div>
                                  <p className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                                    {dept.name}
                                  </p>
                                  <p className="text-[9px] text-gray-400 font-black tracking-widest uppercase">
                                    {dept.hod ? `HOD: ${dept.hod}` : 'Leadership view'}
                                  </p>
                                </div>
                                {dept.employees > 100 && (
                                  <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-black rounded-sm border border-blue-100 uppercase">Core</span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 text-center font-black text-gray-800 text-sm">
                              {dept.employees || dept.totalEmployees || 0}
                            </td>
                            <td className="py-4 text-center">
                              <span className="text-emerald-600 font-bold text-sm">
                                {dept.presentToday || 0}
                              </span>
                            </td>
                            <td className="py-4 text-center">
                              <span className="text-rose-500 font-bold text-sm">
                                {dept.onLeave || 0}
                              </span>
                            </td>
                            <td className="py-4 text-right">
                              <div className="flex flex-col items-end gap-1">
                                <span className="font-bold text-orange-600 text-[10px]">{dept.avgAttendance || '0%'}</span>
                                <div className="w-16 bg-gray-100 h-1 rounded-full overflow-hidden shadow-inner">
                                  <div className="bg-orange-500 h-full" style={{ width: dept.avgAttendance || '0%' }} />
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="py-12 text-center text-gray-400">
                            <div className="flex flex-col items-center">
                              <Warehouse size={40} className="mb-2 opacity-10" />
                              <p className="text-[10px] font-bold uppercase tracking-widest">No departments found</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Department Overview Table - Full Width Row */}



        </div>
      </div>
    </DashboardLayout>

  );
}

// Sub-component Helper
const Avatar = ({ src, name, sizeClass = "w-10 h-10", textClass = "text-sm", bgClass = "bg-orange-100", colorClass = "text-orange-600" }) => {
  const [error, setError] = React.useState(false);
  const firstChar = name?.charAt(0).toUpperCase() || "?";

  if (!src || error) {
    return (
      <div className={`${sizeClass} rounded-sm ${bgClass} flex items-center justify-center ${colorClass} font-black ${textClass} border border-gray-100 shadow-sm transition-transform`}>
        {firstChar}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className={`${sizeClass} rounded-sm border border-gray-200 object-cover shadow-sm transition-transform`}
      onError={() => setError(true)}
    />
  );
};

const TrendingUp = ({ size, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);
