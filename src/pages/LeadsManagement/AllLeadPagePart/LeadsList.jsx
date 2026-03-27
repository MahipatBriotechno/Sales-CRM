import { Phone, Mail, TrendingUp, Clock, User, Calendar, DollarSign, Info, QrCode, History } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import EmptyState from "../../../components/common/EmptyState";
import ActionGuard from "../../../components/common/ActionGuard";

export default function LeadsListView({
  currentLeads,
  selectedLeads,
  handleSelectAll,
  handleSelectLead,
  handleLeadClick,
  currentPage,
  itemsPerPage,
  handleEditLead,
  handleDeleteLead,
  handleHitCall,
  handleReborn,
  handleShowAssignmentHistory,
  handleWhatsAppClick,
  pageType = "All" // New prop to determine column layout
}) {
  const getStatusBadge = (tag, isTrending, stageName) => {
    let status = tag || stageName || "New Lead";
    if (status === "Not Contacted") status = "New Lead";
    if (isTrending) return "bg-orange-100 text-orange-600 border-orange-200";

    switch (status.toLowerCase()) {
      case "new lead": case "new": case "new leads": return "bg-blue-100 text-blue-600 border-blue-200";
      case "not connected": return "bg-purple-100 text-purple-600 border-purple-200";
      case "follow up": case "contacted": case "interested": return "bg-amber-100 text-amber-600 border-amber-200";
      case "missed": return "bg-slate-100 text-slate-600 border-slate-200";
      case "assigned": return "bg-indigo-100 text-indigo-600 border-indigo-200";
      case "dropped": case "lost": return "bg-red-100 text-red-600 border-red-200";
      case "duplicate": return "bg-gray-100 text-gray-500 border-gray-200";
      case "won": case "closed": return "bg-green-100 text-green-600 border-green-200";
      case "trending": case "trading": return "bg-orange-100 text-orange-600 border-orange-200";
      default: return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const safeParseDate = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr;

    let str = String(dateStr).trim();
    if (!str) return null;

    if (str.includes('Z') || /[+-]\d{2}(:?\d{2})?$/.test(str)) {
      const d = new Date(str.replace(' ', 'T'));
      if (!isNaN(d)) return d;
    }

    const parts = str.split(/[- T:]/);
    if (parts.length >= 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const hour = parts[3] ? parseInt(parts[3], 10) : 0;
      const minute = parts[4] ? parseInt(parts[4], 10) : 0;
      const second = parts[5] ? parseInt(parts[5], 10) : 0;

      if (str.length > 10) {
        const d = new Date(Date.UTC(year, month, day, hour, minute, second));
        if (!isNaN(d)) return d;
      } else {
        const d = new Date(year, month, day);
        if (!isNaN(d)) return d;
      }
    }

    const finalParsed = new Date(str);
    return isNaN(finalParsed) ? null : finalParsed;
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "--";
    try {
      const d = safeParseDate(dateStr);
      if (!d) return "--";
      return d.toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      });
    } catch (e) { return "--"; }
  };

  // Define columns based on pageType
  const getColumns = () => {
    const base = [
      { id: 'checkbox', label: '', width: 'w-10' },
      { id: 'lead_id', label: 'Lead ID', align: 'left' },
      { id: 'name', label: 'Full Name', align: 'left' },
      { id: 'contact', label: 'Contact Number', align: 'left' },
    ];

    let middle = [];
    switch (pageType) {
      case "All Leads":
        middle = [
          { id: 'source', label: 'Source', align: 'left' },
          { id: 'status', label: 'Status', align: 'left' },
          { id: 'created_at', label: 'Lead Born', align: 'left' },
          { id: 'next_call', label: 'Next Call', align: 'left' },

        ];
        break;
      case "New Lead":
        middle = [
          { id: 'created_at', label: 'Lead Born', align: 'left' },
          { id: 'source', label: 'Source', align: 'left' },
          { id: 'owner', label: 'Lead Owner', align: 'left' },
          { id: 'status', label: 'Status', align: 'left' },
        ];
        break;
      case "Not Connected":
        middle = [
          { id: 'owner', label: 'Lead Owner', align: 'left' },
          { id: 'assignee', label: 'Assigned To', align: 'left' },
          { id: 'created_date', label: 'Lead Born', align: 'left' },
          { id: 'next_call', label: 'Next Call', align: 'left' },

        ];
        break;
      case "Follow Up":
        middle = [
          { id: 'created_at', label: 'Lead Born', align: 'left' },
          { id: 'next_call', label: 'Next Call', align: 'left' },
          { id: 'priority', label: 'Priority', align: 'left' },
          { id: 'hits', label: 'Call Hit', align: 'left' },
          { id: 'assignee', label: 'Assignee', align: 'left' },
        ];
        break;
      case "Assigned":
        middle = [
          { id: 'assignee', label: 'Assigned To', align: 'left' },
          { id: 'priority', label: 'Priority', align: 'left' },
          { id: 'created_at', label: 'Lead Born', align: 'left' },
          { id: 'next_call', label: 'Next Action Date', align: 'left' },
          { id: 'hits', label: 'Call Hit', align: 'left' },
          { id: 'owner', label: 'Lead Owner', align: 'left' },
        ];
        break;
      case "Dropped":
        middle = [
          { id: 'updated_at', label: 'Drop Date & Time', align: 'left' },
          { id: 'reason', label: 'Drop Reason', align: 'left' },
          { id: 'owner', label: 'Last Owner', align: 'left' },
          { id: 'status', label: 'Status', align: 'left' },
        ];
        break;
      default:
        middle = [
          { id: 'source', label: 'Source', align: 'left' },
          { id: 'status', label: 'Status', align: 'left' },
          { id: 'created_at', label: 'Lead Born', align: 'left' },
        ];
    }

    return [...base, ...middle, { id: 'action', label: 'Action', align: 'right' }];
  };

  const columns = getColumns();

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-sm shadow-sm bg-white">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm">
            {columns.map(col => (
              <th
                key={col.id}
                className={`py-3 px-4 font-semibold border-b border-orange-400 capitalize whitespace-nowrap text-${col.align || 'left'} ${col.width || ''}`}
              >
                {col.id === 'checkbox' ? (
                  <input
                    type="checkbox"
                    checked={selectedLeads.length === currentLeads.length && currentLeads.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 cursor-pointer accent-orange-500"
                  />
                ) : col.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {currentLeads.length > 0 ? (
            currentLeads.map((lead) => {
              const displayStatus = lead.is_trending === 1 ? "Trending" : (lead.tag === "Not Contacted" ? "New Lead" : (lead.tag || lead.stage_name || "New Lead"));

              return (
                <tr key={lead.id} className="border-t hover:bg-gray-50 transition-colors group">
                  {columns.map(col => {
                    switch (col.id) {
                      case 'checkbox':
                        return (
                          <td key={col.id} className="py-3 px-4 text-left">
                            <input
                              type="checkbox"
                              checked={selectedLeads.includes(lead.id)}
                              onChange={() => handleSelectLead(lead.id)}
                              className="w-4 h-4 cursor-pointer accent-orange-500"
                            />
                          </td>
                        );
                      case 'lead_id':
                        return (
                          <td key={col.id} className="py-3 px-4 text-orange-600 hover:text-orange-800 cursor-pointer font-semibold text-sm text-left whitespace-nowrap font-primary" onClick={() => handleLeadClick(lead)}>
                            {lead.lead_id || lead.id}
                          </td>
                        );
                      case 'name':
                        return (
                          <td key={col.id} className="py-3 px-4 text-gray-800 hover:text-orange-600 cursor-pointer text-sm text-left font-bold" onClick={() => handleLeadClick(lead)}>
                            <div className="flex items-center gap-2">
                              <span className="truncate max-w-[200px]" title={lead.name || lead.full_name}>
                                {lead.name || lead.full_name || "Untitled Lead"}
                              </span>
                              {lead.is_trending === 1 && <span className="p-1 bg-orange-100 text-orange-600 rounded-full" title="Trending"><TrendingUp size={12} /></span>}
                            </div>
                          </td>
                        );
                      case 'contact':
                        return (
                          <td key={col.id} className="py-3 px-4 text-gray-800 text-sm text-left font-medium">
                            <div className="flex items-center gap-2">
                              <span>{lead.mobile_number || lead.phone || "--"}</span>
                              {(lead.mobile_number || lead.phone) && (
                                <button
                                  onClick={() => handleHitCall && handleHitCall(lead)}
                                  className="p-1 hover:bg-orange-50 rounded-full text-orange-500 transition-colors"
                                  title="View QR"
                                >
                                  <QrCode size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        );
                      case 'owner':
                        return (
                          <td key={col.id} className="py-3 px-4 text-left">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-orange-50 flex items-center justify-center text-orange-600"><User size={12} /></div>
                              <span className="text-xs font-bold text-gray-700 capitalize">{lead.lead_owner || "-"}</span>
                            </div>
                          </td>
                        );
                      case 'created_date':
                        return (
                          <td key={col.id} className="py-3 px-4 text-left text-xs text-gray-600 font-medium">
                            {formatDateTime(lead.created_at).split(',')[0]}
                          </td>
                        );
                      case 'source':
                        return (
                          <td key={col.id} className="py-3 px-4 text-left">
                            <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded-sm text-[10px] font-bold border border-gray-100 capitalize tracking-tighter">
                              {lead.lead_source || "-"}
                            </span>
                          </td>
                        );
                      case 'pipeline':
                        return (
                          <td key={col.id} className="py-3 px-4 text-left">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-gray-700 truncate max-w-[120px]">{lead.pipeline_name || "General"}</span>
                              <span className="text-[10px] text-[#FF7B1D] font-bold italic">{lead.stage_name || "New"}</span>
                            </div>
                          </td>
                        );
                      case 'status':
                        return (
                          <td key={col.id} className="py-3 px-4 text-left">
                            <span className={`px-2 py-1 rounded-[2px] text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(lead.tag, lead.is_trending, lead.stage_name)}`}>
                              {displayStatus}
                            </span>
                          </td>
                        );
                      case 'hits':
                        return (
                          <td key={col.id} className="py-3 px-4 font-bold text-gray-700 text-left">
                            <div className="flex flex-col items-start">
                              <span className="text-sm">{lead.call_count || 0}</span>
                              <span className="text-[9px] text-gray-400 font-normal">Hits</span>
                            </div>
                          </td>
                        );
                      case 'created_at':
                        return (
                          <td key={col.id} className="py-3 px-4 text-left text-xs text-gray-600 font-medium">
                            {formatDateTime(lead.created_at)}
                          </td>
                        );
                      case 'updated_at':
                        return (
                          <td key={col.id} className="py-3 px-4 text-left text-xs text-gray-600 font-medium">
                            {formatDateTime(lead.updated_at)}
                          </td>
                        );
                      case 'next_call':
                        return (
                          <td key={col.id} className="py-3 px-4 text-left">
                            <div className="flex flex-col items-start">
                              <span className="text-xs font-bold text-orange-600 whitespace-nowrap">
                                {lead.next_call_at ? formatDateTime(lead.next_call_at) : "Not Scheduled"}
                              </span>
                              {lead.next_call_at && <span className="text-[9px] text-gray-400">Scheduled Call</span>}
                            </div>
                          </td>
                        );
                      case 'assignee':
                        return (
                          <td key={col.id} className="py-3 px-4 text-left">
                            <div
                              className="flex items-center justify-between gap-2 px-2 py-1.5 bg-slate-50/50 rounded-sm border border-transparent hover:bg-orange-50 hover:border-orange-100 hover:shadow-sm transition-all cursor-pointer group/assignee"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShowAssignmentHistory && handleShowAssignmentHistory(lead);
                              }}
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                  <User size={12} />
                                </div>
                                <span className="text-xs font-bold text-gray-700 capitalize truncate" title={lead.employee_name || "Unassigned"}>
                                  {lead.employee_name || "Unassigned"}
                                </span>
                              </div>
                              <History size={12} className="text-gray-300 group-hover/assignee:text-orange-500 shrink-0" />
                            </div>
                          </td>
                        );
                      case 'reason':
                        return (
                          <td key={col.id} className="py-3 px-4 text-left">
                            <span className="text-xs text-rose-600 font-medium italic bg-rose-50 px-2 py-1 rounded-sm border border-rose-100">
                              {lead.duplicate_reason || lead.drop_reason || "No reason specified"}
                            </span>
                          </td>
                        );
                      case 'value':
                        return (
                          <td key={col.id} className="py-3 px-4 text-left">
                            <span className="text-sm font-black text-emerald-600 flex items-center justify-start gap-0.5">
                              <DollarSign size={14} />{lead.value || "0"}
                            </span>
                          </td>
                        );
                      case 'priority':
                        return (
                          <td key={col.id} className="py-3 px-4 text-left">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-sm border ${lead.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100' :
                              lead.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                'bg-green-50 text-green-600 border-green-100'
                              }`}>
                              {lead.priority || 'Medium'}
                            </span>
                          </td>
                        );
                      case 'last_update':
                        return (
                          <td key={col.id} className="py-3 px-4 text-left text-xs text-gray-500 font-medium">
                            {formatDateTime(lead.updated_at || lead.created_at)}
                          </td>
                        );
                      case 'action':
                        return (
                          <td key={col.id} className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              {pageType === "Dropped" ? (
                                <ActionGuard permission="leads_edit" module="Leads Management" type="update">
                                  <button
                                    onClick={() => handleReborn && handleReborn(lead)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-500 rounded-sm text-green-600 hover:text-white transition-all border border-green-100 shadow-sm text-[10px] font-bold uppercase tracking-wider"
                                    title="Reactivate Lead"
                                  >
                                    <TrendingUp size={14} />
                                    Re-Born
                                  </button>
                                </ActionGuard>
                              ) : (
                                <>
                                  <ActionGuard permission="leads_edit" module="Leads Management" type="update">
                                    <button onClick={() => handleHitCall && handleHitCall(lead)} className="p-1.5 bg-orange-50 hover:bg-orange-500 rounded-sm text-orange-600 hover:text-white transition-all border border-orange-100 shadow-sm"><Phone size={14} /></button>
                                  </ActionGuard>
                                  <ActionGuard permission="leads_view_own" module="Leads Management" type="read">
                                    <button onClick={() => {
                                      const phone = lead.mobile_number || lead.phone;
                                      if (phone) {
                                        window.open(`https://wa.me/${phone.replace(/\D/g, "")}`, "_blank");
                                      } else if (handleWhatsAppClick) {
                                        handleWhatsAppClick(lead);
                                      }
                                    }} className="p-1.5 bg-green-50 hover:bg-green-500 rounded-sm text-green-600 hover:text-white transition-all border border-green-100 shadow-sm"><FaWhatsapp size={14} /></button>
                                  </ActionGuard>
                                  <ActionGuard permission="leads_view_own" module="Leads Management" type="read">
                                    <button onClick={() => { if (lead.email) window.location.href = `mailto:${lead.email}`; }} className="p-1.5 bg-blue-50 hover:bg-blue-500 rounded-sm text-blue-600 hover:text-white transition-all border border-blue-100 shadow-sm"><Mail size={14} /></button>
                                  </ActionGuard>
                                </>
                              )}
                            </div>
                          </td>
                        );
                      default: return null;
                    }
                  })}
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={columns.length} className="py-4">
                <EmptyState
                  title="No Leads Found"
                  message="We couldn't find any leads matching current criteria."
                  type="leads"
                />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
