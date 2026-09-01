import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, UserPlus, UserCheck, Mail, TrendingDown, TrendingUp, BarChart3,
  Clock, ArrowUp, ArrowDown, Menu, Home, Server, Loader2, Phone, Trash2,
  Filter, Upload, PlusIcon, Briefcase, AlertCircle, RefreshCw
} from "lucide-react";
import { useGetLeadDashboardQuery } from "../../store/api/leadApi";
import NumberCard from "../../components/NumberCard";
import BulkUploadLeads from "../../components/AddNewLeads/BulkUpload";
import AddLeadPopup from "../../components/AddNewLeads/AddNewLead";
import ActionGuard from "../../components/common/ActionGuard";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';

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

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#f43f5e', '#8b5cf6', '#eab308'];

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

  const handleAddLead = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

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
          className="px-6 py-2 bg-orange-500 text-white rounded-none font-bold hover:bg-orange-600 transition-colors"
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

  // Format data for Recharts PieChart
  const pieData = trendingData.map(item => ({
    name: item.category,
    value: item.count || item.percentage // Fallback to percentage if count is missing
  }));

  // MOCK DATA FOR NEW SECTIONS (Since backend doesn't provide these yet)
  const mockLeadSourceData = [
    { name: 'Meta Ads', value: 400 },
    { name: 'Website', value: 300 },
    { name: 'IndiaMart', value: 300 },
    { name: 'JustDial', value: 200 },
    { name: 'Direct', value: 100 },
  ];

  const mockUpcomingFollowups = [
    { id: 1, name: 'Rahul Sharma', time: 'Today, 2:00 PM', priority: 'High', status: 'Follow Up' },
    { id: 2, name: 'Amit Verma', time: 'Today, 4:30 PM', priority: 'Medium', status: 'Call Back' },
    { id: 3, name: 'Neha Gupta', time: 'Tomorrow, 10:00 AM', priority: 'High', status: 'Follow Up' },
    { id: 4, name: 'Rajesh Kumar', time: 'Tomorrow, 12:15 PM', priority: 'Low', status: 'Meeting' },
  ];

  return (
    <div className="min-h-screen bg-white font-primary">
      {/* Header Section */}
      <div className="bg-white sticky top-0 z-30 shadow-sm border-b border-gray-200">
        <div className="max-w-8xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Lead Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                <Home className="text-gray-700" size={14} />
                <span className="text-gray-400">CRM / </span>
                <span className="text-[#FF7B1D] font-medium">Dashboard</span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`px-3 py-3 rounded-none border transition shadow-sm ${isFilterOpen ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-[#FF7B1D]" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"}`}
                  title="Filters"
                >
                  <Filter size={18} />
                </button>
                {isFilterOpen && (
                  <div className="absolute right-0 mt-2 w-[480px] bg-white border border-gray-200 rounded-none shadow-lg z-50 animate-fadeIn overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b flex justify-between items-center text-black">
                      <span className="text-sm font-bold capitalize">Navigation Options</span>
                    </div>
                    <div className="max-h-[75vh] overflow-y-auto p-5">
                      <div className="space-y-6">
                        <div>
                          <span className="text-[11px] font-bold text-gray-400 capitalize tracking-wider block mb-3 border-b pb-1">Lead Categories</span>
                          <div className="grid grid-cols-2 gap-2">
                            {leadCategories.map((cat) => (
                              <button
                                key={cat.path}
                                onClick={() => navigate(cat.path)}
                                className={`flex items-center gap-3 px-3 py-2 rounded-none text-sm transition-all text-left ${window.location.pathname === cat.path ? "bg-orange-50 text-[#FF7B1D] font-bold border border-orange-200" : "text-gray-600 border border-transparent hover:bg-gray-50 hover:text-gray-900 hover:border-gray-200"}`}
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
                    <div className="p-4 bg-gray-50 border-t flex gap-3">
                      <button
                        onClick={() => setIsFilterOpen(false)}
                        className="flex-1 py-2.5 text-[11px] font-bold text-gray-500 capitalize tracking-wider hover:bg-gray-200 transition-colors rounded-none border border-gray-200 bg-white"
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
                    className="flex items-center gap-2 px-6 py-3 rounded-none font-semibold transition shadow-sm border border-orange-600 hover:shadow-md bg-orange-500 text-white hover:bg-orange-600"
                  >
                    <PlusIcon size={20} />
                    Add Lead
                  </button>
                </ActionGuard>

                {openLeadMenu && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 shadow-lg rounded-none z-50 overflow-hidden divide-y divide-gray-100 animate-fadeIn">
                    <button
                      onClick={() => { setOpenLeadMenu(false); handleAddLead(); }}
                      className="w-full flex items-center gap-3 text-left px-5 py-3.5 hover:bg-orange-50 text-sm font-bold text-gray-700 hover:text-orange-600 transition"
                    >
                      <UserPlus size={18} />
                      Add Single Lead
                    </button>
                    <button
                      onClick={() => { setOpenLeadMenu(false); setShowBulkUploadPopup(true); }}
                      className="w-full flex items-center gap-3 text-left px-5 py-3.5 hover:bg-orange-50 text-sm font-bold text-gray-700 hover:text-orange-600 transition"
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

      <div className="max-w-8xl mx-auto p-4 pt-6">
        {/* Row 1: Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
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

        {/* Row 2: Analytics & Trending */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Weekly Analytics - Area Chart (66%) */}
          <div className="lg:col-span-2 bg-white rounded-none shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-none bg-orange-50 border border-orange-100 text-orange-500">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Weekly Analytics</h2>
                  <p className="text-gray-500 text-xs">Leads generated over the last 7 days</p>
                </div>
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              {weeklyData && weeklyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '0px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      cursor={{ stroke: '#f97316', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Area type="monotone" dataKey="leads" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" activeDot={{ r: 6, strokeWidth: 0, fill: '#f97316' }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm border border-dashed border-gray-200">No analytics data</div>
              )}
            </div>
          </div>

          {/* Trending Categories - Donut Chart (33%) */}
          <div className="bg-white rounded-none shadow-sm border border-gray-200 p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-none bg-orange-50 border border-orange-100 text-orange-500">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Trending</h2>
                <p className="text-gray-500 text-xs">Top categories by volume</p>
              </div>
            </div>
            
            <div className="flex-1 w-full flex items-center justify-center min-h-[300px]">
              {pieData && pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: '0px', border: '1px solid #e5e7eb' }} />
                    <Legend iconType="square" layout="horizontal" verticalAlign="bottom" wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full w-full text-gray-400 text-sm border border-dashed border-gray-200">No trending data</div>
              )}
            </div>
          </div>
        </div>

        {/* Row 3: New Sections (Lead Source & Follow-ups) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Lead Source Breakdown (Bar Chart) (66%) */}
          <div className="lg:col-span-2 bg-white rounded-none shadow-sm border border-gray-200 p-6">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-none bg-blue-50 border border-blue-100 text-blue-500">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Lead Source Breakdown</h2>
                  <p className="text-gray-500 text-xs">Where your leads are coming from</p>
                </div>
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockLeadSourceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#374151', fontWeight: 600 }} width={90} />
                    <RechartsTooltip cursor={{fill: '#f3f4f6'}} contentStyle={{ borderRadius: '0px', border: '1px solid #e5e7eb' }} />
                    <Bar dataKey="value" fill="#3b82f6" radius={0} barSize={24}>
                      {mockLeadSourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
          </div>

          {/* Upcoming Follow-ups (33%) */}
          <div className="bg-white rounded-none shadow-sm border border-gray-200 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-none bg-purple-50 border border-purple-100 text-purple-500">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Upcoming Follow-ups</h2>
                  <p className="text-gray-500 text-xs">Action items for today</p>
                </div>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1">
              {mockUpcomingFollowups.map((follow) => (
                <div key={follow.id} className="flex flex-col p-3 border border-gray-100 bg-gray-50 hover:bg-orange-50 hover:border-orange-100 transition-colors cursor-pointer rounded-none">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-gray-800 text-sm">{follow.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-none border ${follow.priority === 'High' ? 'bg-red-50 text-red-600 border-red-200' : follow.priority === 'Medium' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {follow.priority}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <div className="flex items-center gap-1.5"><Clock size={12}/> {follow.time}</div>
                    <span className="text-[10px] bg-white border border-gray-200 px-1.5 py-0.5 text-gray-600 font-bold uppercase tracking-wider">{follow.status}</span>
                  </div>
                </div>
              ))}
              <button className="w-full py-2 mt-2 text-xs font-bold text-orange-600 border border-orange-200 bg-orange-50 hover:bg-orange-100 transition-colors rounded-none">
                View All Follow-ups
              </button>
            </div>
          </div>
        </div>

        {/* Row 4: Recent Leads */}
        <div className="bg-white rounded-none shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-none bg-green-50 border border-green-100 text-green-500">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Recent Leads</h2>
                <p className="text-gray-500 text-xs">Latest incoming opportunities</p>
              </div>
            </div>
            <button 
              onClick={() => navigate(`/crm/leads/work-station`)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-none hover:bg-gray-50 hover:text-orange-600 transition-all text-sm font-bold shadow-sm"
            >
              View Work Station
            </button>
          </div>
          
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-y border-gray-200">
                  <th className="px-4 py-3 font-semibold">Lead Info</th>
                  <th className="px-4 py-3 font-semibold">Priority</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentLeads.length > 0 ? recentLeads.map((lead, index) => (
                  <tr 
                    key={index} 
                    className="hover:bg-orange-50/50 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/crm/leads/work-station`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-none bg-orange-100 flex items-center justify-center text-orange-600 font-bold border border-orange-200">
                          {lead.avatar}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 text-sm group-hover:text-orange-600 transition-colors">{lead.name}</p>
                          <p className="text-xs text-gray-500">{lead.company || lead.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 text-[10px] font-bold border rounded-none uppercase tracking-wider ${lead.priority === "High" ? "bg-red-50 text-red-600 border-red-200" : lead.priority === "Medium" ? "bg-orange-50 text-orange-600 border-orange-200" : "bg-gray-50 text-gray-600 border-gray-200"}`}>
                        {lead.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 text-[10px] font-bold border border-gray-200 bg-white text-gray-700 rounded-none uppercase tracking-wider">
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs text-gray-500 flex items-center justify-end gap-1.5 font-medium">
                        <Clock className="w-3 h-3" /> {lead.time}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="py-10 text-center text-gray-400 italic text-sm border-b border-gray-100">No recent leads found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showBulkUploadPopup && <BulkUploadLeads onClose={() => setShowBulkUploadPopup(false)} />}
      {isModalOpen && <AddLeadPopup isOpen={isModalOpen} onClose={handleCloseModal} />}
    </div>
  );
}
