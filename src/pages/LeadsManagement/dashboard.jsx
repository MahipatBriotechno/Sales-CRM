import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserPlus,
  UserCheck,
  Mail,
  TrendingDown,
  TrendingUp,
  BarChart3,
  Clock,
  ArrowUp,
  ArrowDown,
  Menu,
  Home,
  Server,
  Loader2,
  Phone,
  Trash2,
  Filter,
  Upload,
  PlusIcon,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import { useGetLeadDashboardQuery } from "../../store/api/leadApi";
import NumberCard from "../../components/NumberCard";
import BulkUploadLeads from "../../components/AddNewLeads/BulkUpload";
import AddLeadPopup from "../../components/AddNewLeads/AddNewLead";
import ActionGuard from "../../components/common/ActionGuard";

const leadCategories = [
  { name: "Work Station", path: "/crm/leads/work-station", icon: <Briefcase size={16} /> },
  { name: "All Leads", path: "/crm/leads/all", icon: <Users size={16} /> },
  { name: "New Leads", path: "/crm/leads/new", icon: <UserPlus size={16} /> },
  { name: "Not Connected", path: "/crm/leads/not-connected", icon: <Server size={16} /> },
  { name: "Follow Up", path: "/crm/leads/follow-up", icon: <Loader2 size={16} /> },
  { name: "Missed", path: "/crm/leads/missed", icon: <Phone size={16} /> },
  { name: "Assigned", path: "/crm/leads/assigned", icon: <UserPlus size={16} /> },
  { name: "Dropped", path: "/crm/leads/dropped", icon: <Trash2 size={16} /> },
  { name: "Duplicates", path: "/crm/leads/duplicates", icon: <Trash2 size={16} /> },
  { name: "Trending", path: "/crm/leads/trending", icon: <Users size={16} /> },
  { name: "Won", path: "/crm/leads/won", icon: <UserPlus size={16} /> },
  { name: "Analysis", path: "/crm/leads/analysis", icon: <Server size={16} /> },
];

export default function LeadDashboard() {
  const navigate = useNavigate();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [openLeadMenu, setOpenLeadMenu] = useState(false);
  const [showBulkUploadPopup, setShowBulkUploadPopup] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  const addLeadMenuRef = useRef(null);

  const { data, isLoading, isError, refetch } = useGetLeadDashboardQuery();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
      if (addLeadMenuRef.current && !addLeadMenuRef.current.contains(event.target)) {
        setOpenLeadMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddLead = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Failed to load dashboard</h2>
        <button
          onClick={() => refetch()}
          className="px-6 py-2 bg-orange-500 text-white rounded-sm font-bold hover:bg-orange-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { stats, recentLeads, trendingData, weeklyData } = data || {
    stats: { total: 0, total_up: "0%", new: 0, new_up: "0%", assigned: 0, assigned_up: "0%", unread: 0, unread_down: "0%" },
    recentLeads: [],
    trendingData: [],
    weeklyData: []
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="bg-white sticky top-0 z-30">
        <div className="max-w-8xl mx-auto px-4 py-4 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Lead Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                <Home className="text-gray-700" size={14} />
                <span className="text-gray-400">CRM / </span>
                <span className="text-[#FF7B1D] font-medium">
                  Dashboard
                </span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Filter - Icon Only */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`px-3 py-3 rounded-sm border transition shadow-sm ${isFilterOpen
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-[#FF7B1D]"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                    }`}
                  title="Filters"
                >
                  {isFilterOpen ? <Filter size={18} /> : <Filter size={18} />}
                </button>

                {isFilterOpen && (
                  <div className="absolute right-0 mt-2 w-[480px] bg-white border border-gray-200 rounded-sm shadow-2xl z-50 animate-fadeIn overflow-hidden">
                    {/* Header */}
                    <div className="p-4 bg-gray-50 border-b flex justify-between items-center text-black">
                      <span className="text-sm font-bold capitalize">Navigation Options</span>
                    </div>

                    {/* Content - Scrollable */}
                    <div className="max-h-[75vh] overflow-y-auto p-5">
                      <div className="space-y-6">
                        {/* Navigation Section */}
                        <div>
                          <span className="text-[11px] font-bold text-gray-400 capitalize tracking-wider block mb-3 border-b pb-1">Lead Categories</span>
                          <div className="grid grid-cols-2 gap-2">
                            {leadCategories.map((cat) => (
                              <button
                                key={cat.path}
                                onClick={() => navigate(cat.path)}
                                className={`flex items-center gap-3 px-3 py-2 rounded-sm text-sm transition-all text-left ${window.location.pathname === cat.path
                                  ? "bg-orange-50 text-[#FF7B1D] font-bold"
                                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                  }`}
                              >
                                <span className={window.location.pathname === cat.path ? "text-[#FF7B1D]" : "text-gray-400"}>
                                  {cat.icon}
                                </span>
                                {cat.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-gray-50 border-t flex gap-3">
                      <button
                        onClick={() => setIsFilterOpen(false)}
                        className="flex-1 py-2.5 text-[11px] font-bold text-gray-500 capitalize tracking-wider hover:bg-gray-200 transition-colors rounded-sm border border-gray-200 bg-white"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative" ref={addLeadMenuRef}>
                <ActionGuard permission="leads_create" module="Leads Management" type="create">
                  <button
                    onClick={() => setOpenLeadMenu(!openLeadMenu)}
                    className="flex items-center gap-2 px-6 py-3 rounded-sm font-semibold transition shadow-lg hover:shadow-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700"
                  >
                    <PlusIcon size={20} />
                    Add Lead
                  </button>
                </ActionGuard>

                {openLeadMenu && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 shadow-xl rounded-sm z-50 overflow-hidden divide-y divide-gray-100 animate-fadeIn">
                    <button
                      onClick={() => {
                        setOpenLeadMenu(false);
                        handleAddLead();
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

      <div className="max-w-8xl mx-auto p-4 pt-0 mt-2">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

          <NumberCard
            variant="matrix"
            title="All Leads"
            number={stats.total.toLocaleString()}
            up={stats.total_up}
            icon={<Users size={24} />}
            lineBorderClass="border-blue-500"
          />
          <NumberCard
            variant="matrix"
            title="New Leads"
            number={stats.new.toLocaleString()}
            up={stats.new_up}
            icon={<UserPlus size={24} />}
            lineBorderClass="border-green-500"
          />
          <NumberCard
            variant="matrix"
            title="Assigned"
            number={stats.assigned.toLocaleString()}
            up={stats.assigned_up}
            icon={<UserCheck size={24} />}
            lineBorderClass="border-orange-500"
          />
          <NumberCard
            variant="matrix"
            title="Unread Leads"
            number={stats.unread.toLocaleString()}
            down={stats.unread_down}
            icon={<Mail size={24} />}
            lineBorderClass="border-purple-500"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Recent Leads - 2 columns */}
          <div className="lg:col-span-2 bg-white rounded-sm shadow-lg p-6 border border-orange-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                  Recent Leads
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  Latest incoming opportunities
                </p>
              </div>
              <button className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-md hover:shadow-lg font-semibold text-sm">
                View All
              </button>
            </div>
            <div className="space-y-3">
              {recentLeads.length > 0 ? recentLeads.map((lead, index) => (
                <div
                  key={index}
                  onClick={() => navigate(`/crm/leads/work-station`)}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg hover:shadow-md transition-shadow duration-200 border border-orange-200 cursor-pointer"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-base shadow-md">
                      {lead.avatar}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-base">
                        {lead.name}
                      </h4>
                      <p className="text-sm text-gray-600 truncate max-w-[150px]">{lead.email}</p>
                      <p className="text-xs text-orange-600 mt-0.5 font-medium">
                        {lead.company}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border ${lead.priority === "High"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : lead.priority === "Medium"
                          ? "bg-orange-50 text-orange-700 border-orange-200"
                          : "bg-gray-50 text-gray-700 border-gray-200"
                        }`}
                    >
                      {lead.priority}
                    </span>
                    <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">
                      {lead.status}
                    </span>
                    <span className="text-xs text-gray-600 flex items-center bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                      <Clock className="w-3.5 h-3.5 mr-1.5" />
                      {lead.time}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400 italic">
                  No recent leads found
                </div>
              )}
            </div>
          </div>

          {/* Trending Categories - 1 column */}
          <div className="bg-white rounded-sm shadow-lg p-6 border border-orange-100">
            <div className="flex items-center mb-6">
              <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 mr-3 shadow-md">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                  Trending
                </h2>
                <p className="text-gray-500 text-sm">Top categories</p>
              </div>
            </div>
            <div className="space-y-4">
              {trendingData.length > 0 ? trendingData.map((item, index) => (
                <div
                  key={index}
                  className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-gray-800 text-base">
                      {item.category}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-orange-600">
                        {item.count}
                      </span>
                      {item.trend === "up" ? (
                        <div className="p-1.5 bg-green-50 rounded-lg border border-green-200">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        </div>
                      ) : (
                        <div className="p-1.5 bg-red-50 rounded-lg border border-red-200">
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <div className="flex-1 bg-orange-100 rounded-full h-3 border border-orange-200">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="py-10 text-center text-gray-400 italic">No trending data</div>
              )}
            </div>
          </div>
        </div>

        {/* Analytics Chart */}
        <div className="bg-white rounded-sm shadow-lg p-6 border border-orange-100">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 mr-3 shadow-md">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                  Weekly Analytics
                </h2>
                <p className="text-gray-500 text-sm">
                  Lead performance overview
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-orange-50 px-4 py-2 rounded-lg border border-orange-200">
                <div className="w-4 h-4 rounded bg-gradient-to-r from-orange-500 to-orange-600"></div>
                <span className="text-sm font-semibold text-orange-700">
                  Leads Generated
                </span>
              </div>
            </div>
          </div>

          {/* Chart - Simple Bar Graph */}
          <div className="bg-gradient-to-b from-orange-50 to-amber-50 rounded-lg p-8 border border-orange-200">
            <div className="space-y-6">
              {weeklyData.length > 0 ? weeklyData.map((data, index) => {
                const maxLeads = Math.max(...weeklyData.map(d => d.leads), 1);
                return (
                  <div key={index} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-gray-800 w-16">
                        {data.day}
                      </span>
                      <span className="text-xs font-semibold text-orange-600">
                        {data.leads} leads
                      </span>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-orange-100 rounded-lg h-10 border border-orange-200">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-orange-600 h-10 rounded-lg transition-all duration-500 flex items-center px-4 hover:from-orange-600 hover:to-orange-700"
                          style={{ width: `${(data.leads / maxLeads) * 100}%` }}
                        >
                          <span className="text-white font-bold text-sm">
                            {data.leads}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="py-20 text-center text-gray-400 italic">No analytics data for this week</div>
              )}
            </div>
          </div>
        </div>
      </div>
      {showBulkUploadPopup && <BulkUploadLeads onClose={() => setShowBulkUploadPopup(false)} />}
      {isModalOpen && <AddLeadPopup isOpen={isModalOpen} onClose={handleCloseModal} />}
    </div>
  );
}
