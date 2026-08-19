import React from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Users,
  TrendingUp,
  DollarSign,
  Target,
  Phone,
  Mail,
  Calendar,
  ChevronRight,
  Award,
  Briefcase,
  Share2,
  UserCheck,
  Clock,
  AlertCircle,
  Activity,
  FileText,
  Home,
  Plus,
  Zap,
  UserPlus,
  PhoneIncoming,
  Upload,
} from "lucide-react";
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
  Area,
  AreaChart,
  LineChart,
  Line,
} from "recharts";
import { useGetCRMStatsQuery } from "../../store/api/crmDashboardApi";
import { Loader2, RefreshCw } from "lucide-react";
import AddLeadPopup from "../../components/AddNewLeads/AddNewLead";
import BulkUploadLeads from "../../components/AddNewLeads/BulkUpload";
import ActionGuard from "../../components/common/ActionGuard";

export default function CRMDashboard() {
  const navigate = useNavigate();
  const [viewPeriod, setViewPeriod] = React.useState('6m');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [openLeadMenu, setOpenLeadMenu] = React.useState(false);
  const [showBulkUploadPopup, setShowBulkUploadPopup] = React.useState(false);
  const addLeadMenuRef = React.useRef(null);
  const { data: stats, isLoading, isFetching, refetch } = useGetCRMStatsQuery(viewPeriod);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (addLeadMenuRef.current && !addLeadMenuRef.current.contains(event.target)) {
        setOpenLeadMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  const summary = stats?.summary || { totalQuotations: 0, conversions: 0, revenue: 0, champions: 0 };
  const recentLeads = stats?.recentLeads || [];
  const champions = stats?.champions || [];
  const upcomingTasks = stats?.upcomingTasks || [];
  const pipelineData = stats?.pipelineData || [];
  const revenueData = stats?.revenueTrend || [];
  const funnelData = stats?.funnelData || [];
  const agingStats = stats?.agingStats || [];
  const winLossData = stats?.winLossData || [];
  const regionSales = stats?.regionSales || [];
  const workloadData = stats?.workloadData || [];
  const dropAnalysis = stats?.dropAnalysis || [];
  const teamPerformanceData = stats?.teamPerformance || [];
  const activityFeed = stats?.activityFeed || [];
  const revenueForecast = stats?.revenueForecast || [];
  const velocityDrivers = stats?.velocityDrivers || { winRate: 0, cycleTime: 0, avgDealSize: 0 };
  const dailyGoal = stats?.dailyGoal || { current: 0, target: 72000 };

  const COLORS = ["#fb923c", "#f97316", "#ea580c", "#c2410c", "#9a3412"];

  const formatCurrency = (value) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    return `₹${(value / 1000).toFixed(0)}K`;
  };

  const efficiencyMetrics = stats?.efficiencyMetrics || [
    { label: "Avg. Response Time", value: "0m", icon: <Clock size={18} className="text-blue-500" />, colorClass: "border-t-blue-500 bg-blue-50/50" },
    { label: "Follow-up Success", value: "0%", icon: <UserCheck size={18} className="text-purple-500" />, colorClass: "border-t-purple-500 bg-purple-50/50" },
    { label: "Sales Velocity", value: "₹0/day", icon: <TrendingUp size={18} className="text-yellow-500" />, colorClass: "border-t-yellow-500 bg-yellow-50/50" },
    { label: "Marketing ROI", value: "0x", icon: <DollarSign size={18} className="text-orange-500" />, colorClass: "border-t-orange-500 bg-orange-50/50" },
  ];

  // Add icons to efficiency metrics if they are coming from dynamic data
  const dynamicEfficiencyMetrics = efficiencyMetrics.map((m, i) => {
    const icons = [
      <Clock size={18} className="text-blue-500" />,
      <UserCheck size={18} className="text-purple-500" />,
      <TrendingUp size={18} className="text-yellow-500" />,
      <DollarSign size={18} className="text-orange-500" />
    ];
    const colors = [
      "border-t-blue-500 bg-blue-50/50",
      "border-t-purple-500 bg-purple-50/50",
      "border-t-yellow-500 bg-yellow-50/50",
      "border-t-orange-500 bg-orange-50/50"
    ];
    return { ...m, icon: icons[i % 4], colorClass: colors[i % 4] };
  });

  return (
    <div className="min-h-screen bg-white font-primary">
      {/* Header */}
      <div className="bg-white sticky top-0 z-30">
        <div className="max-w-8xl mx-auto px-6 py-4 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left Title Section */}
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                CRM Dashboard
              </h1>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                <Home className="text-gray-700" size={14} />
                <span className="text-gray-400">CRM / </span>
                <span className="text-[#FF7B1D] font-medium">Dashboard</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={refetch}
                className="p-3 bg-white border border-gray-300 rounded-sm hover:bg-gray-100 text-gray-700 transition-all shadow-sm active:scale-95"
                title="Refresh Dashboard"
              >
                <RefreshCw size={18} className={isFetching ? "animate-spin" : ""} />
              </button>


              <div className="relative" ref={addLeadMenuRef}>
                <ActionGuard permission="leads_create" module="Leads Management" type="create">
                  <button
                    onClick={() => setOpenLeadMenu(!openLeadMenu)}
                    className="flex items-center gap-2 px-6 py-3 rounded-sm font-semibold transition shadow-lg hover:shadow-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700"
                  >
                    <Plus size={20} />
                    Add new lead
                  </button>
                </ActionGuard>
                {openLeadMenu && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 shadow-xl rounded-sm z-50 overflow-hidden divide-y divide-gray-100 animate-fadeIn">
                    <button
                      onClick={() => {
                        setOpenLeadMenu(false);
                        setIsModalOpen(true);
                      }}
                      className="w-full flex items-center gap-3 text-left px-5 py-3.5 hover:bg-orange-50 text-sm font-bold text-gray-700 hover:text-orange-600 transition font-primary"
                    >
                      <UserPlus size={18} />
                      Add Single Lead
                    </button>

                    <button
                      onClick={() => {
                        setOpenLeadMenu(false);
                        setShowBulkUploadPopup(true);
                      }}
                      className="w-full flex items-center gap-3 text-left px-5 py-3.5 hover:bg-orange-50 text-sm font-bold text-gray-700 hover:text-orange-600 transition font-primary"
                    >
                      <Upload size={18} />
                      Bulk Upload
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-9xl mx-auto px-4 mt-2 flex flex-col xl:flex-row gap-3">
        {isModalOpen && <AddLeadPopup isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}
        {showBulkUploadPopup && <BulkUploadLeads onClose={() => setShowBulkUploadPopup(false)} />}

        {/* Main Content Area */}
        <div className="flex-1 space-y-4">

          {/* Row 1: KPI Matrices */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Quotations */}
            <div className="rounded-sm shadow-sm border border-gray-200 p-4 border-t-4 border-t-blue-500 bg-blue-50/50 transition-all duration-300 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-sm bg-white border border-gray-100 shadow-sm">
                    <UserPlus size={18} className="text-blue-500" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-xs font-bold text-gray-500 capitalize tracking-wide font-primary">Total quotations</h3>
                    <p className="text-2xl font-bold text-gray-800 leading-none mt-1.5">
                      {summary.totalQuotations.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Conversions */}
            <div className="rounded-sm shadow-sm border border-gray-200 p-4 border-t-4 border-t-purple-500 bg-purple-50/50 transition-all duration-300 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-sm bg-white border border-gray-100 shadow-sm">
                    <PhoneIncoming size={18} className="text-purple-500" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-xs font-bold text-gray-500 capitalize tracking-wide font-primary">Total conversions</h3>
                    <p className="text-2xl font-bold text-gray-800 leading-none mt-1.5">
                      {summary.conversions.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Revenue */}
            <div className="rounded-sm shadow-sm border border-gray-200 p-4 border-t-4 border-t-yellow-500 bg-yellow-50/50 transition-all duration-300 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-sm bg-white border border-gray-100 shadow-sm">
                    <Clock size={18} className="text-yellow-500" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-xs font-bold text-gray-500 capitalize tracking-wide font-primary">Total revenue</h3>
                    <p className="text-2xl font-bold text-gray-800 leading-none mt-1.5">
                      {formatCurrency(summary.revenue)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Performers */}
            <div className="rounded-sm shadow-sm border border-gray-200 p-4 border-t-4 border-t-orange-500 bg-orange-50/50 transition-all duration-300 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-sm bg-white border border-gray-100 shadow-sm">
                    <TrendingUp size={18} className="text-orange-500" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-xs font-bold text-gray-500 capitalize tracking-wide font-primary">Top performers</h3>
                    <p className="text-2xl font-bold text-gray-800 leading-none mt-1.5">
                      {summary.champions.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Efficiency Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {dynamicEfficiencyMetrics.map((metric, idx) => (
              <div key={idx} className={`rounded-sm shadow-sm border border-gray-200 p-4 border-t-4 ${metric.colorClass} transition-all duration-300 hover:shadow-md`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-sm bg-white border border-gray-100 shadow-sm">
                      {metric.icon}
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-xs font-bold text-gray-500 capitalize tracking-wide font-primary">{metric.label}</h3>
                      <p className="text-2xl font-bold text-gray-800 leading-none mt-1.5">
                        {metric.value}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Visual Analytics Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Revenue Trend Analytics */}
            <div className="lg:col-span-2 bg-white rounded-sm border border-orange-100 shadow-lg overflow-hidden flex flex-col p-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 mr-4 shadow-md">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Monthly revenue trend</h2>
                    <p className="text-orange-500 text-sm font-semibold capitalize tracking-wide">Performance overview for the last {viewPeriod === '1y' ? '12 months' : '6 months'}</p>
                  </div>
                </div>
                <div className="flex gap-2 p-1 bg-gray-100 rounded-sm">
                  <button
                    onClick={() => setViewPeriod('6m')}
                    className={`px-4 py-1.5 text-xs font-bold transition-all rounded-sm ${viewPeriod === '6m' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    6m View
                  </button>
                  <button
                    onClick={() => setViewPeriod('1y')}
                    className={`px-4 py-1.5 text-xs font-bold transition-all rounded-sm ${viewPeriod === '1y' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    1y View
                  </button>
                </div>
              </div>
              <div className="flex-1">
                {revenueData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 13, fontWeight: 600 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 13, fontWeight: 600 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '4px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                        itemStyle={{ fontWeight: 700, color: '#f97316' }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={4} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 font-bold">No Revenue Data Recorded</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sales Conversion Funnel */}
            <div className="bg-white rounded-sm border border-orange-100 shadow-lg overflow-hidden flex flex-col p-6">
              <div className="flex items-center mb-10">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 mr-4 shadow-lg">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                    Conversion pipeline
                  </h2>
                  <p className="text-orange-500 text-sm font-semibold capitalize tracking-wide">Lead progression tracking</p>
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <div className="space-y-4">
                  {funnelData.map((stage, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        const name = stage.name.toLowerCase();
                        if (name.includes("total")) navigate("/crm/leads/all");
                        else if (name.includes("contacted")) navigate("/crm/leads/not-connected");
                        else if (name.includes("won")) navigate("/crm/leads/won");
                        else navigate("/crm/leads/work-station");
                      }}
                      className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200 hover:shadow-md transition-all group flex flex-col cursor-pointer hover:scale-[1.01] active:scale-95"
                    >
                      <div className="flex items-center justify-between mb-3 text-black">
                        <span className="text-sm font-bold text-gray-800 capitalize">{stage.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-orange-600">{stage.value}</span>
                          <div className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm shadow-sm">
                            {Math.round((stage.value / funnelData[0].value) * 100)}%
                          </div>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="w-full bg-orange-100 rounded-full h-2.5 border border-orange-200 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-orange-500 to-orange-600 h-2.5 rounded-full transition-all duration-1000 shadow-sm"
                            style={{ width: `${(stage.value / funnelData[0].value) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Intelligence Grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {/* Stagnation Alerts */}
            <div className="bg-white rounded-sm border border-red-50 shadow-lg flex flex-col p-6">
              <div className="flex items-center mb-8">
                <div className="p-3 rounded-lg bg-gradient-to-br from-red-500 to-red-600 mr-4 shadow-md">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Critical attention</h2>
                  <p className="text-red-500 text-sm font-semibold capitalize tracking-wide">Immediate action items</p>
                </div>
              </div>
              <div className="space-y-4">
                {agingStats.length > 0 ? agingStats.map((item, id) => (
                  <div key={id} className={`p-4 rounded-sm border-l-4 shadow-sm border-orange-100 ${item.status === 'Critical' ? 'bg-gradient-to-r from-red-50 to-white border-l-red-500' : 'bg-gradient-to-r from-orange-50 to-white border-l-orange-500'} flex items-center justify-between group cursor-pointer hover:shadow-md transition-all`}>
                    <div>
                      <p className={`text-sm font-bold capitalize tracking-wide ${item.status === 'Critical' ? 'text-red-500' : 'text-orange-500'}`}>{item.label}</p>
                      <p className="text-xl font-semibold text-gray-900 mt-1">{item.count} <span className="text-xs font-medium text-gray-500">leads</span></p>
                    </div>
                    <div className={`p-2 rounded-sm ${item.status === 'Critical' ? 'bg-red-100/50 text-red-500' : 'bg-orange-100/50 text-orange-500'} group-hover:scale-110 transition-transform`}>
                      <ChevronRight size={18} />
                    </div>
                  </div>
                )) : (
                  <div className="p-10 text-center border-2 border-dashed border-gray-100 rounded-sm">
                    <p className="text-gray-400 font-bold">Excellent! No stagnating leads.</p>
                  </div>
                )}
                <div className="pt-6 mt-4 border-t border-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-bold text-gray-600 capitalize">Daily Conversion Performance</p>
                    <span className="text-orange-600 font-bold text-sm">{(summary.conversions > 0 ? 64 : 0)}% Achieved</span>
                  </div>
                  <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden shadow-inner">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-full shadow-sm" style={{ width: `${(summary.conversions > 0 ? 64 : 0)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>



            {/* Territory Split */}
            <div className="bg-white rounded-sm border border-blue-50 shadow-lg flex flex-col p-6">
              <div className="flex items-center mb-8">
                <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 mr-4 shadow-md">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Territory distribution</h2>
                  <p className="text-blue-500 text-sm font-semibold capitalize tracking-wide">Sales split by territory</p>
                </div>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="h-44 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={regionSales} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={2} dataKey="value">
                        {regionSales.map((entry, index) => <Cell key={`rcell-${index}`} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">SHARE</p>
                    <p className="text-xl font-bold text-gray-900">100%</p>
                  </div>
                </div>
                <div className="w-full mt-6 grid grid-cols-2 gap-4 px-2">
                  {regionSales.length > 0 ? regionSales.map((area, i) => (
                    <div key={i} className="flex items-center justify-between text-xs font-bold border-b border-gray-50 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: area.color }}></div>
                        <span className="text-gray-600 truncate">{area.area}</span>
                      </div>
                      <span className="text-gray-900">{area.value}%</span>
                    </div>
                  )) : (
                    <div className="col-span-2 text-center text-gray-400 font-bold py-4">No Data Available</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Drop Analysis & Forecast ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Drop Reason Analysis */}
            {/* <div className="bg-white rounded-sm border border-orange-100 shadow-lg overflow-hidden flex flex-col p-6">
              <div className="flex items-center mb-8">
                <div className="p-3 rounded-lg bg-gradient-to-br from-red-500 to-red-600 mr-4 shadow-md">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Drop Analysis</h2>
                  <p className="text-gray-500 text-sm font-medium">Why leads are falling off</p>
                </div>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <div className="h-48 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={dropAnalysis} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                        {dropAnalysis.map((entry, index) => <Cell key={`drop-cell-${index}`} fill={entry.fill} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full mt-4 space-y-2">
                  {dropAnalysis.length > 0 ? dropAnalysis.map((d, i) => (
                    <div key={i} className="flex items-center justify-between group">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }}></div>
                        <span className="text-xs font-bold text-gray-600">{d.name}</span>
                      </div>
                      <span className="text-xs font-extrabold text-gray-900">{d.value}%</span>
                    </div>
                  )) : (
                    <div className="text-center text-gray-400 font-bold py-4">No Drop Reasons Logged</div>
                  )}
                </div>
              </div>
            </div> */}
            {/* Win/Loss Strategy */}
            <div className="bg-white rounded-sm border border-purple-50 shadow-lg flex flex-col p-6 lg:col-span-2">
              <div className="flex items-center mb-8">
                <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 mr-4 shadow-md">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Deal success</h2>
                  <p className="text-purple-500 text-sm font-semibold capitalize tracking-wide">Won vs lost deal ratio</p>
                </div>
              </div>
              <div className="flex-1">
                {winLossData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={winLossData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#9ca3af' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#9ca3af' }} />
                      <Tooltip
                        cursor={{ fill: '#f9fafb' }}
                        contentStyle={{ borderRadius: '4px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                      />
                      <Bar dataKey="won" fill="#22c55e" radius={[2, 2, 0, 0]} barSize={14} />
                      <Bar dataKey="lost" fill="#94a3b8" radius={[2, 2, 0, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[180px] flex items-center justify-center bg-gray-50 rounded border-2 border-dashed border-gray-200 text-gray-400 font-bold">
                    No Historical Data
                  </div>
                )}
                <div className="mt-5 flex items-center justify-center gap-10">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded-[2px] shadow-sm"></div>
                    <span className="text-xs font-bold text-gray-600 capitalize">Won Deals</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-400 rounded-[2px] shadow-sm"></div>
                    <span className="text-xs font-bold text-gray-600 capitalize">Lost Deals</span>
                  </div>
                </div>

              </div>
            </div>
            {/* Revenue Forecast Comparison */}
            <div className="lg:col-span-2 bg-white rounded-sm border border-blue-100 shadow-lg overflow-hidden flex flex-col p-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 mr-4 shadow-md">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Revenue forecast engine</h2>
                    <p className="text-emerald-500 text-sm font-semibold capitalize tracking-wide">Predictive modeling: expected vs weighted</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="text-[10px] font-bold text-gray-400 uppercase">Weighted</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[10px] font-bold text-gray-400 uppercase">Best Case</span></div>
                </div>
              </div>
              <div className="flex-1">
                {revenueForecast.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={revenueForecast}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="expected" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} strokeDasharray="5 5" />
                      <Line type="monotone" dataKey="weighted" stroke="#f97316" strokeWidth={4} dot={{ r: 5, fill: '#f97316' }} />
                      <Line type="monotone" dataKey="bestCase" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[260px] flex items-center justify-center bg-gray-50 rounded border-2 border-dashed border-gray-200 text-gray-400 font-bold">
                    Pipeline items required for forecast
                  </div>
                )}
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="p-3 bg-blue-50 rounded-sm border border-blue-100">
                    <p className="text-[10px] font-bold text-blue-600 uppercase">Expected</p>
                    <p className="text-lg font-bold text-gray-800">{formatCurrency(revenueForecast[0]?.expected || 0)}</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-sm border border-orange-100">
                    <p className="text-[10px] font-bold text-orange-600 uppercase">Weighted</p>
                    <p className="text-lg font-bold text-gray-800">{formatCurrency(revenueForecast[0]?.weighted || 0)}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-sm border border-emerald-100">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase">Realistic</p>
                    <p className="text-lg font-bold text-gray-800">{formatCurrency(revenueForecast[0]?.bestCase || 0)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Operational Resources Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Team Workload */}
            <div className="bg-white rounded-sm border border-gray-100 shadow-lg overflow-hidden flex flex-col p-6">
              <div className="flex items-center mb-8">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 mr-4 shadow-lg">
                  <Users size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                    Consultant capacity
                  </h2>
                  <p className="text-orange-500 text-sm font-semibold capitalize tracking-wide">Load distribution audit</p>
                </div>
              </div>
              <div className="space-y-4">
                {workloadData.map((exec, idx) => (
                  <div key={idx} className="p-5 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200 hover:shadow-lg transition-all group flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center font-bold text-base shadow-lg border border-orange-400 overflow-hidden group-hover:scale-105 transition-transform">
                          {exec.avatar ? (
                            <img
                              src={exec.avatar}
                              alt={exec.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <span style={{ display: exec.avatar ? 'none' : 'flex' }}>
                            {exec.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="text-base font-bold text-gray-800 group-hover:text-orange-600 transition-colors">{exec.name}</p>
                          <p className="text-xs font-semibold text-gray-400 capitalize">Sales consultant</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="bg-orange-600 text-white px-3 py-1.5 rounded-lg font-bold text-sm shadow-md inline-block">
                          {exec.leads} / {exec.capacity}
                        </div>
                        <p className="text-xs font-semibold text-gray-400 capitalize tracking-wide mt-1">Lead capacity</p>
                      </div>
                    </div>
                    <div className="relative m-0">
                      <div className="w-full bg-orange-100 rounded-full h-3 border border-orange-200 overflow-hidden">
                        <div
                          className={`h-[10px] rounded-full transition-all duration-1000 shadow-sm ${exec.leads / exec.capacity > 0.8 ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-orange-500 to-orange-600'}`}
                          style={{ width: `${(exec.leads / exec.capacity) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue & Velocity Projection */}
            <div className="bg-white rounded-sm border border-orange-100 shadow-lg overflow-hidden flex flex-col p-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 mr-4 shadow-md">
                    <Briefcase size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Sales velocity projection</h2>
                    <p className="text-orange-500 text-sm font-semibold capitalize tracking-wide">Predictive revenue engine & pipeline health</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold text-gray-400 capitalize tracking-wide mb-1">Forecast confidence</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(b => <div key={b} className={`w-3 h-1.5 rounded-full ${b <= 3 ? 'bg-orange-500' : 'bg-gray-200'}`}></div>)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                {/* Main Velocity Chart */}
                <div className="flex flex-col">
                  <div className="flex-1 flex items-end justify-center gap-8 mb-4 min-h-[180px]">
                    {[
                      { name: "Current Revenue", value: summary.revenue },
                      { name: "Target Projection", value: dailyGoal.target * 30 },
                    ].map((f, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center group">
                        <div
                          className={`w-full max-w-[120px] rounded-sm transition-all duration-700 shadow-xl relative overflow-hidden ${i === 0 ? 'bg-orange-600' : 'bg-white border-2 border-dashed border-orange-300'}`}
                          style={{ height: `${Math.min(160, (f.value / (dailyGoal.target * 35)) * 160)}px` }}
                        >
                          {i === 0 && <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>}
                          <div className="absolute top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-20">
                            {formatCurrency(f.value)}
                          </div>
                        </div>
                        <p className="text-[11px] font-semibold text-gray-400 capitalize tracking-wide mt-4">{f.name}</p>
                        <p className={`text-lg font-bold mt-1 ${i === 0 ? 'text-orange-600' : 'text-gray-400'}`}>{formatCurrency(f.value)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-4 bg-orange-50 rounded-sm border border-orange-100 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-orange-600">
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-700">Velocity Trend: <span className="text-green-600">+{velocityDrivers.winRate}%</span></p>
                      <p className="text-[10px] text-gray-500 font-medium">Deals are moving at an average of {velocityDrivers.cycleTime} days.</p>
                    </div>
                  </div>
                </div>

                {/* Velocity Drivers Breakdown */}
                <div className="space-y-6">
                  <h4 className="text-sm font-semibold text-gray-500 capitalize tracking-widest border-b border-gray-100 pb-2">Velocity drivers</h4>

                  {[
                    { label: "Win Rate", value: `${velocityDrivers.winRate}%`, trend: "+2.1%", progress: velocityDrivers.winRate, sub: "Qualified leads to Won" },
                    { label: "Cycle Time", value: `${velocityDrivers.cycleTime} Days`, trend: "-4 Days", progress: 75, sub: "Lead to Closed" },
                    { label: "Avg. Deal Size", value: formatCurrency(velocityDrivers.avgDealSize), trend: "+₹15K", progress: 62, sub: "Value per conversion" }
                  ].map((driver, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-sm font-bold text-gray-800">{driver.label}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{driver.sub}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-bold text-gray-900 leading-none">{driver.value}</p>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden shadow-inner">
                        <div
                          className="h-full bg-orange-500 rounded-full shadow-sm transition-all duration-1000"
                          style={{ width: `${driver.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}

                  <div className="pt-4 flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-100"></div>
                    <div className="w-4 h-4 bg-orange-100 rounded-full flex items-center justify-center"><Zap size={10} className="text-orange-500" /></div>
                    <div className="flex-1 h-px bg-gray-100"></div>
                  </div>

                  <div className="flex items-center gap-4 bg-slate-900 p-4 rounded-sm shadow-xl">
                    <div className="w-12 h-12 bg-white/10 rounded-sm flex items-center justify-center font-bold text-lg text-white border border-white/20">
                      {Math.round((dailyGoal.current / dailyGoal.target) * 100)}%
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-orange-400 capitalize tracking-wide leading-none mb-1.5">Probability pulse</p>
                      <p className="text-xs text-white/80 font-medium leading-snug">Target is within reach. Maintain current <span className="text-white font-bold">Follow-up Velocity</span> to exceed goal.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Team Performance - New Section */}
          <div className="bg-white rounded-sm border border-gray-100 shadow-lg p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 mr-4 shadow-md">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Team performance</h2>
                  <p className="text-orange-500 text-sm font-semibold capitalize tracking-wide">Top performing consultants this month</p>
                </div>
              </div>
              <button
                onClick={() => navigate("/crm/leads/analysis")}
                className="text-orange-600 text-[11px] font-bold hover:bg-orange-50 px-4 py-2 border border-orange-200 rounded-sm shadow-sm transition-all uppercase tracking-widest"
              >
                In-depth analysis
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {teamPerformanceData.map((member, index) => (
                <div
                  key={index}
                  onClick={() => navigate(`/crm/leads/team-performance/${member.id}`)}
                  className="p-6 bg-gradient-to-br from-white to-orange-50/30 border border-orange-100 rounded-sm hover:border-orange-500 hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col items-center text-center shadow-sm"
                >
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-gray-800 font-bold text-xl mb-4 group-hover:bg-orange-500 group-hover:text-white transition-all shadow-md border border-orange-100 overflow-hidden">
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <span style={{ display: member.avatar_url ? 'none' : 'flex' }}>
                      {member.avatar}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-800 mb-4 group-hover:text-orange-600 transition-colors text-base truncate w-full px-2">
                    {member.name}
                  </h4>
                  <div className="w-full space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-gray-400">Converted</span>
                      <span className="text-green-600 bg-white px-2 py-0.5 rounded-sm border border-green-100">
                        {member.converted}
                      </span>
                    </div>
                    <div className="pt-4 border-t border-orange-100 group-hover:border-orange-200">
                      <div className="text-3xl font-semibold text-gray-800 group-hover:text-orange-600">
                        {member.rate}%
                      </div>
                      <div className="text-[10px] font-semibold text-gray-400 capitalize tracking-wide mt-1">
                        Success rate
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Actionable Tasks Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Active Monitoring */}
            <div className="lg:col-span-2 bg-white rounded-sm shadow-lg border border-gray-100 overflow-hidden flex flex-col p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 mr-4 shadow-lg">
                    <Activity size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                      Lead monitoring
                    </h2>
                    <p className="text-orange-500 text-sm font-semibold capitalize tracking-wide">Real-time pipeline overview</p>
                  </div>
                </div>

              </div>
              <div className="space-y-4 flex-1">
                {recentLeads.length > 0 ? recentLeads.map((lead, index) => (
                  <div key={index} className="p-5 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200 hover:shadow-lg transition-all cursor-pointer group flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-orange-600 font-bold text-lg shadow-md border border-orange-100 group-hover:scale-105 transition-transform overflow-hidden">
                          {lead.profile_picture ? (
                            <img
                              src={lead.profile_picture}
                              alt={lead.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <span style={{ display: lead.profile_picture ? 'none' : 'flex' }}>
                            {lead.avatar || (lead.name ? lead.name[0] : "L")}
                          </span>
                        </div>
                        <div>
                          <p className="text-base font-bold text-gray-800 group-hover:text-orange-600 transition-colors uppercase">{lead.name}</p>

                        </div>
                      </div>

                      <div className="text-right">
                        <div className="bg-orange-600 text-white px-3 py-1.5 rounded-lg font-bold text-sm shadow-md inline-block">
                          {formatCurrency(lead.value)}
                        </div>
                        <p className="text-xs font-semibold text-gray-400 capitalize tracking-wide mt-1">{lead.status} status</p>
                      </div>
                    </div>

                    <div className="relative m-0">
                      <div className="w-full bg-orange-100 rounded-full h-3 border border-orange-200 overflow-hidden shadow-inner">
                        <div
                          className="h-[10px] rounded-full transition-all duration-1000 shadow-sm bg-gradient-to-r from-orange-500 to-orange-600"
                          style={{ width: lead.status === "Hot" ? "90%" : lead.status === "Warm" ? "60%" : "30%" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <Activity size={48} className="text-gray-300 mb-4" />
                    <p className="text-gray-400 font-bold">No Recent Lead Data Found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tactical Schedule (Priority Queues) */}
            <div className="bg-white rounded-sm shadow-lg border border-gray-100 overflow-hidden flex flex-col p-6">
              <div className="flex items-center mb-8">
                <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 mr-4 shadow-md">
                  <Clock size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Priority queues</h2>
                  <p className="text-purple-500 text-sm font-semibold capitalize tracking-wide">Daily follow-up tactical schedule</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[500px] custom-scrollbar px-2">
                <div className="space-y-3">
                  {upcomingTasks.length > 0 ? upcomingTasks.map((task, index) => (
                    <div key={index} className="flex gap-4 p-4 rounded-sm bg-orange-50/20 border border-orange-100 hover:border-orange-200 transition-all group cursor-pointer shadow-sm">
                      <div className="w-9 h-9 bg-white border border-orange-100 text-orange-400 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm group-hover:text-orange-600 group-hover:border-orange-300 transition-all shadow-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-semibold text-orange-500 tracking-wide capitalize">{task.dueTime}</span>
                          <div className={`text-[9px] font-bold px-2 py-0.5 rounded-sm capitalize border ${task.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100' : task.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-teal-50 text-teal-600 border-teal-100'}`}>{task.priority} Priority</div>
                        </div>
                        <p className="text-sm font-semibold text-gray-800 leading-snug group-hover:text-orange-700 transition-colors capitalize truncate">
                          {task.task}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <div className="py-10 text-center text-gray-400 font-bold">No Pending Tasks</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Recognition & Advanced Metrics ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Achievement Showcase */}
            <div className="bg-slate-900 p-10 rounded-sm shadow-2xl relative overflow-hidden group border border-slate-800">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-orange-500/10 rounded-full -mr-40 -mt-40 blur-[100px] group-hover:scale-125 transition-all duration-1000"></div>
              <div className="relative z-10 mb-12 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-4">
                    Consultant champions
                    <Award size={28} className="text-yellow-400 drop-shadow-lg" />
                  </h2>
                  <p className="text-orange-500 text-sm font-semibold capitalize tracking-wide mt-1.5">High-impact account management</p>
                </div>
              </div>
              <div className="space-y-6 relative z-10">
                {champions.slice(0, 4).map((ch, i) => (
                  <div key={i} className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-sm hover:bg-white/10 transition-all group/item shadow-inner backdrop-blur-sm">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center font-bold text-2xl rounded-sm shadow-2xl group-hover/item:scale-105 transition-all border border-orange-400 shadow-orange-500/30 uppercase overflow-hidden">
                        {ch.avatar_url ? (
                          <img
                            src={ch.avatar_url}
                            alt={ch.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <span style={{ display: ch.avatar_url ? 'none' : 'flex' }}>
                          {ch.avatar}
                        </span>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-white group-hover/item:text-orange-400 transition-colors">{ch.name}</p>
                        <p className="text-xs text-gray-400 font-bold capitalize mt-1">{ch.badge} Status Achieved</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-1">Impact Value</p>
                      <p className="text-3xl font-bold text-green-400 tracking-tight">{ch.revenue}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pipeline Analysis */}
            <div className="bg-white rounded-sm border border-gray-100 shadow-lg overflow-hidden flex flex-col p-6">
              <div className="flex items-center mb-8">
                <div className="p-3 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 mr-4 shadow-md">
                  <BarChart3 size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Pipeline structural audit</h2>
                  <p className="text-slate-500 text-[10px] font-semibold capitalize tracking-wide">Deals distribution across active funnels</p>
                </div>
              </div>
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-100 shadow-sm">
                      <th className="px-6 py-4 text-[14px] font-semibold text-orange-400 capitalize tracking-wide">Pathway name</th>
                      <th className="px-6 py-4 text-[14px] font-semibold text-orange-400 capitalize tracking-wide text-center">Active leads</th>
                      <th className="px-6 py-4 text-[14px] font-semibold text-orange-400 capitalize tracking-wide text-right">Forecasted value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 font-primary">
                    {pipelineData.slice(0, 6).map((p, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-all border-b border-gray-50 last:border-0">
                        <td className="px-6 py-5 flex items-center gap-4">
                          <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                          <span className="text-sm font-bold text-gray-800">{p.name}</span>
                        </td>
                        <td className="px-6 py-5 text-center text-sm font-bold text-gray-500">{p.deals} <span className="text-[10px] uppercase ml-1">Deals</span></td>
                        <td className="px-6 py-5 text-right text-base font-bold text-orange-600">{formatCurrency(p.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>

        {/* ── Right Slim sidebar: Real-Time Activity Feed ── */}
        <div className="w-full xl:w-[340px] flex flex-col gap-4">
          <div className="bg-white rounded-sm shadow-xl overflow-hidden flex flex-col border border-orange-100  sticky top-[84px] h-[calc(100vh-120px)] transition-all duration-300">
            {/* Sidebar Header */}
            <div className="bg-slate-50/80 backdrop-blur-md p-5 px-6 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-sm shadow-sm">
                  <Zap size={16} className="text-orange-600 fill-orange-600" />
                </div>
                <div>
                  <h2 className="text-gray-900 font-bold text-sm tracking-tight capitalize font-primary">
                    Live activity log
                  </h2>
                  <p className="text-sm text-orange-500 font-semibold capitalize tracking-wide mt-1 font-primary">Real-time pulse</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-full border border-gray-100 shadow-sm">
                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] font-semibold text-gray-500 capitalize tracking-wide">Live monitor</span>
              </div>
            </div>

            {/* Activity List */}
            <div className="flex-1 p-5 px-6 space-y-3 overflow-y-auto custom-scrollbar bg-white">
              {activityFeed.length > 0 ? activityFeed.map((activity, i) => (
                <div key={i} className="p-3 bg-orange-50/20 border border-orange-100 rounded-sm hover:border-orange-200 transition-all group cursor-pointer flex gap-4 shadow-sm">
                  {/* Avatar/Icon Container with Badge */}
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-white border border-gray-200 shadow-sm text-gray-700 flex items-center justify-center font-bold text-[11px] group-hover:border-orange-400 group-hover:bg-orange-50 transition-all duration-300 uppercase overflow-hidden">
                      {activity.avatar_url ? (
                        <img
                          src={activity.avatar_url}
                          alt={activity.user}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <span style={{ display: activity.avatar_url ? 'none' : 'flex' }}>
                        {activity.avatar}
                      </span>
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-50">
                      <div className={`w-1.5 h-1.5 rounded-full ${activity.action?.toLowerCase().includes('won') ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : activity.action?.toLowerCase().includes('conversion') ? 'bg-blue-500 shadow-[0_0_5px_#3b82f6]' : 'bg-orange-500 shadow-[0_0_5px_#f97316]'}`}></div>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[13px] font-semibold text-gray-800 truncate group-hover:text-orange-600 transition-colors font-primary">{activity.user}</span>
                      <span className="text-[10px] font-bold text-orange-500 uppercase tracking-tight whitespace-nowrap ml-2 bg-white px-2 py-1 rounded-sm border border-orange-50 shadow-sm">{activity.time}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-snug font-medium font-primary">
                      <span className="capitalize">{activity.action}</span> <span className="text-gray-900 font-semibold">{activity.target}</span>
                    </p>
                  </div>
                </div>
              )) : (
                <div className="flex-1 flex items-center justify-center text-center p-10">
                  <p className="text-gray-400 font-bold">Waiting for real-time activities...</p>
                </div>
              )}
            </div>


          </div>
        </div>

      </div>
    </div>
  );
}
