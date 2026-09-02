import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetMyActiveGoalsQuery } from '../../store/api/goalApi';
import { Target, TrendingUp, Phone, CheckCircle2, DollarSign, Users, Plus, FileText, RefreshCw } from 'lucide-react';

export default function GlobalGoalTracker() {
  const user = useSelector((state) => state.auth.user);
  const isEmployee = user?.role === 'Employee';

  // Only fetch if user is an employee
  const { data: goals = [], isLoading } = useGetMyActiveGoalsQuery(user?._id, { skip: !isEmployee || !user?._id });

  const [isHovered, setIsHovered] = useState(false);

  // If not employee, don't show the widget at all
  if (!isEmployee) return null;

  // Hide the widget only if it finished loading and still has no goals
  if (!isLoading && goals.length === 0) return null;

  const getMetricIcon = (type) => {
      switch (type) {
          case "outbound_calls": return <Phone size={14} className="text-blue-500" />;
          case "connected_calls": return <CheckCircle2 size={14} className="text-green-500" />;
          case "followups": return <RefreshCw size={14} className="text-indigo-500" />;
          case "revenue": return <DollarSign size={14} className="text-green-500" />;
          case "meetings_booked": return <Users size={14} className="text-purple-500" />;
          case "leads": return <Plus size={14} className="text-orange-500" />;
          case "proposals": return <FileText size={14} className="text-blue-500" />;
          case "deals_won": return <CheckCircle2 size={14} className="text-green-600" />;
          default: return <TrendingUp size={14} className="text-gray-500" />;
      }
  };

  const formatTitle = (type) => {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div 
      className="fixed right-0 top-52 z-[9990] group flex items-start"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Expanded Card Details (Appears on Hover) */}
      <div className={`absolute right-full top-0 w-72 pr-4 transition-all duration-300 ${isHovered ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
        <div className="w-full bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-[#FF7B1D] to-orange-500 p-3 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              <h3 className="font-bold text-sm tracking-wide uppercase">My Targets</h3>
            </div>
            <div className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">
              {goals.length} Active
            </div>
          </div>
          
          <div className="p-0 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="p-8 flex justify-center items-center">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent animate-spin rounded-full"></div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {goals.map((goal, idx) => (
                  <div key={idx} className="p-4 hover:bg-orange-50/30 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="p-1.5 bg-gray-50 rounded-sm border border-gray-100 flex-shrink-0">
                          {getMetricIcon(goal.goal_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-800 truncate">{goal.goal_title}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{formatTitle(goal.goal_type)}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-sm font-bold text-gray-900">
                          {goal.goal_type === 'revenue' && '₹'}
                          {goal.current_value.toLocaleString()} 
                          <span className="text-xs text-gray-400 font-medium"> / {goal.target_value.toLocaleString()}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-1000 ease-out ${
                          goal.progress_percentage >= 100 
                            ? 'bg-green-500' 
                            : goal.progress_percentage >= 50 
                              ? 'bg-orange-400' 
                              : 'bg-red-400'
                        }`}
                        style={{ width: `${goal.progress_percentage}%` }}
                      ></div>
                    </div>
                    {goal.progress_percentage >= 100 && (
                      <p className="text-[10px] text-green-600 font-bold mt-1.5 flex items-center gap-1 uppercase tracking-wider">
                        <CheckCircle2 size={10} /> Target Achieved!
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Edge Bubble */}
      <div className="bg-white shadow-[-4px_0_15px_rgba(0,0,0,0.1)] border border-gray-200 border-r-0 rounded-l-full p-2.5 cursor-default flex items-center justify-center hover:bg-gray-50 transition-colors relative">
        <div className="relative w-14 h-14 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-full border border-orange-200/50 flex flex-col items-center justify-center">
          <Target className="w-6 h-6 text-[#FF7B1D] mb-0.5" />
          <span className="text-[9px] font-bold text-[#FF7B1D] uppercase tracking-wider">Targets</span>
          
          {/* Notification Dot */}
          <div className="absolute top-0 right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
      </div>
      
    </div>
  );
}
