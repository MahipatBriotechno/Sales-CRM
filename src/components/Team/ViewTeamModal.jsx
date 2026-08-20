import React from "react";
import { Users, X, LayoutGrid, CheckCircle, FileText, Settings, Calendar, Hash, Briefcase, Building2, ChevronRight } from "lucide-react";
import { useGetTeamByIdQuery } from "../../store/api/teamApi";

const ViewTeamModal = ({ isOpen, onClose, teamId }) => {
    const { data: team, isLoading } = useGetTeamByIdQuery(teamId, {
        skip: !isOpen || !teamId,
    });

    if (!isOpen) return null;

    const levelGroups = (team?.members || []).reduce((acc, member) => {
        const level = member.level || 1;
        if (!acc[level]) acc[level] = [];
        acc[level].push(member);
        return acc;
    }, {});

    const sortedLevels = Object.entries(levelGroups).sort(([a], [b]) => a - b);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
            <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl custom-scrollbar rounded-sm">

                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex items-center justify-between z-10 rounded-t-sm shadow-md">
                    <div className="flex items-center gap-4">
                        <div className="bg-white bg-opacity-20 p-2.5 rounded-sm">
                            <Users size={22} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white leading-tight">Team Details</h2>
                            <p className="text-xs text-orange-100 font-medium mt-0.5">View team information and member hierarchy</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 p-2 transition-all rounded-full">
                        <X size={22} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5 text-left">
                    {isLoading ? (
                        <div className="flex justify-center py-16">
                            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : team ? (
                        <>
                            {/* Team ID Badge */}
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 border border-orange-200 rounded-sm text-[11px] font-black text-orange-600 uppercase tracking-widest">
                                    <Hash size={10} /> {team.team_id}
                                </span>
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-sm text-[10px] font-black border uppercase tracking-wider ${team.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${team.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    {team.status}
                                </span>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-sm border border-gray-100 p-4">
                                    <p className="flex items-center gap-1.5 text-[10px] font-black text-[#FF7B1D] uppercase tracking-widest mb-2">
                                        <LayoutGrid size={11} /> Team Name
                                    </p>
                                    <p className="text-base font-bold text-gray-800 capitalize">{team.team_name}</p>
                                </div>
                                <div className="bg-gray-50 rounded-sm border border-gray-100 p-4">
                                    <p className="flex items-center gap-1.5 text-[10px] font-black text-[#FF7B1D] uppercase tracking-widest mb-2">
                                        <Calendar size={11} /> Date Created
                                    </p>
                                    <p className="text-base font-bold text-gray-800">
                                        {team.created_at ? new Date(team.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <p className="flex items-center gap-1.5 text-[10px] font-black text-[#FF7B1D] uppercase tracking-widest mb-2">
                                    <FileText size={11} /> Description
                                </p>
                                <div className="bg-gray-50 rounded-sm border border-gray-100 p-4">
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        {team.description || <span className="italic text-gray-400">No description provided.</span>}
                                    </p>
                                </div>
                            </div>

                            {/* Team Structure */}
                            <div>
                                <p className="flex items-center gap-1.5 text-[10px] font-black text-[#FF7B1D] uppercase tracking-widest mb-4">
                                    <Settings size={11} /> Team Structure — {sortedLevels.length} Level{sortedLevels.length !== 1 ? 's' : ''} · {team.members?.length || 0} Total Members
                                </p>

                                {sortedLevels.length > 0 ? (
                                    <div className="space-y-3">
                                        {sortedLevels.map(([level, members], idx) => (
                                            <div key={level}>
                                                {/* Level Card */}
                                                <div className="border border-gray-200 rounded-sm overflow-hidden shadow-sm">
                                                    {/* Level Header */}
                                                    <div className="flex items-center justify-between bg-gradient-to-r from-orange-50 to-white px-4 py-3 border-b border-gray-100">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-[#FF7B1D] text-white flex items-center justify-center font-black text-sm shadow-md">
                                                                {level}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-gray-800 capitalize">Level {level}</p>
                                                                <p className="text-[10px] text-gray-400 font-bold">
                                                                    {members.length} Member{members.length !== 1 ? 's' : ''}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] font-black text-orange-500 bg-orange-50 border border-orange-100 px-2 py-1 rounded-sm uppercase tracking-widest">
                                                            Tier {level}
                                                        </span>
                                                    </div>

                                                    {/* Members Grid */}
                                                    <div className="p-4">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {members.map((member) => (
                                                                <div key={member.id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-sm hover:border-orange-200 hover:shadow-sm transition-all">
                                                                    {/* Avatar */}
                                                                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-orange-50 text-orange-600 rounded-sm font-black border border-orange-100 shadow-inner">
                                                                        <span className="text-sm uppercase">{member.employee_name?.charAt(0)}</span>
                                                                    </div>

                                                                    {/* Info */}
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-xs font-bold text-gray-800 capitalize truncate">{member.employee_name}</p>

                                                                        <div className="mt-1 space-y-0.5">
                                                                            <div className="flex items-center gap-1">
                                                                                <Briefcase size={9} className="text-[#FF7B1D] flex-shrink-0" />
                                                                                <span className="text-[10px] text-gray-500 font-semibold truncate capitalize">
                                                                                    {member.designation_name || '—'}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex items-center gap-1">
                                                                                <Building2 size={9} className="text-blue-400 flex-shrink-0" />
                                                                                <span className="text-[10px] text-blue-500 font-semibold truncate capitalize">
                                                                                    {member.department_name || '—'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Arrow between levels */}
                                                {idx < sortedLevels.length - 1 && (
                                                    <div className="flex justify-center py-1">
                                                        <div className="flex flex-col items-center">
                                                            <div className="w-0.5 h-4 bg-orange-200"></div>
                                                            <ChevronRight size={14} className="text-orange-300 rotate-90 -mt-1" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-gray-50 rounded-sm border-2 border-dashed border-gray-200">
                                        <Users size={40} className="mx-auto text-gray-200 mb-3" />
                                        <p className="text-gray-400 font-bold capitalize tracking-widest text-xs">No Level Structure Defined</p>
                                        <p className="text-gray-300 text-[10px] mt-1">This team has no assigned members yet.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="text-center text-red-500 py-10 font-semibold">Failed to load team details.</div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-2.5 bg-white border-2 border-gray-200 font-bold text-gray-700 hover:bg-gray-100 transition-all rounded-sm shadow-sm text-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewTeamModal;
