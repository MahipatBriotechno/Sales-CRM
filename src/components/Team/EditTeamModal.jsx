import React, { useState, useEffect, useMemo } from "react";
import { Users, X, Filter, Plus, Trash2, ArrowDown, LayoutGrid, CheckCircle, FileText, Settings, Building2, Briefcase, User, AlertCircle } from "lucide-react";
import { useGetEmployeesQuery } from "../../store/api/employeeApi";
import { useGetDepartmentsQuery } from "../../store/api/departmentApi";
import { useGetDesignationsQuery } from "../../store/api/designationApi";
import { useGetTeamByIdQuery } from "../../store/api/teamApi";

const EditTeamModal = ({ isOpen, onClose, onSubmit, isLoading: isUpdating, teamId }) => {
    const [formData, setFormData] = useState({
        teamName: "",
        description: "",
        status: "Active",
        levels: [{
            id: Date.now(),
            rows: [{ id: Date.now(), departmentId: "All", designationId: "All", employeeId: "" }]
        }]
    });

    const { data: team, isLoading: isFetchingTeam } = useGetTeamByIdQuery(teamId, {
        skip: !isOpen || !teamId,
    });

    const { data: employeesData } = useGetEmployeesQuery({ limit: 1000, status: 'Active' });
    const { data: departmentsData } = useGetDepartmentsQuery({ limit: 1000 });
    const { data: designationsData } = useGetDesignationsQuery({ limit: 1000 });
    const employees = employeesData?.employees || [];
    const departments = departmentsData?.departments || [];
    const designations = designationsData?.designations || [];

    const internalSelectionMap = useMemo(() => {
        const map = {};
        formData.levels.forEach((level, lIdx) => {
            level.rows.forEach(row => {
                if (row.employeeId) {
                    if (!map[row.employeeId]) map[row.employeeId] = [];
                    map[row.employeeId].push(lIdx + 1);
                }
            });
        });
        return map;
    }, [formData.levels]);

    const allSelectedEmployeeIds = useMemo(() => {
        const ids = new Set();
        formData.levels.forEach(level => {
            level.rows.forEach(row => {
                if (row.employeeId) ids.add(String(row.employeeId));
            });
        });
        return ids;
    }, [formData.levels]);

    useEffect(() => {
        if (team) {
            const members = team.members || [];
            // Group members by level
            const levelGroups = members.reduce((acc, m) => {
                const level = m.level || 1;
                if (!acc[level]) acc[level] = [];
                acc[level].push({
                    id: Math.random(),
                    departmentId: m.department_id || "All",
                    designationId: m.designation_id || "All",
                    employeeId: m.id
                });
                return acc;
            }, {});

            const sortedLevels = Object.keys(levelGroups).sort((a, b) => a - b);
            const finalLevels = sortedLevels.length > 0
                ? sortedLevels.map(lvl => ({
                    id: Math.random(),
                    rows: levelGroups[lvl]
                }))
                : [{
                    id: Date.now(),
                    rows: [{ id: Date.now(), departmentId: "All", designationId: "All", employeeId: "" }]
                }];

            setFormData({
                teamName: team.team_name || "",
                description: team.description || "",
                status: team.status || "Active",
                levels: finalLevels
            });
        }
    }, [team]);

    const addLevel = () => {
        setFormData(prev => ({
            ...prev,
            levels: [...prev.levels, {
                id: Date.now(),
                rows: [{ id: Date.now(), departmentId: "All", designationId: "All", employeeId: "" }]
            }]
        }));
    };

    const removeLevel = (levelId) => {
        if (formData.levels.length === 1) return;
        setFormData(prev => ({
            ...prev,
            levels: prev.levels.filter(l => l.id !== levelId)
        }));
    };

    const addRowToLevel = (levelId) => {
        setFormData(prev => ({
            ...prev,
            levels: prev.levels.map(l => {
                if (l.id === levelId) {
                    return {
                        ...l,
                        rows: [...l.rows, { id: Date.now(), departmentId: "All", designationId: "All", employeeId: "" }]
                    };
                }
                return l;
            })
        }));
    };

    const removeRowFromLevel = (levelId, rowId) => {
        setFormData(prev => ({
            ...prev,
            levels: prev.levels.map(l => {
                if (l.id === levelId) {
                    if (l.rows.length === 1) return l;
                    return {
                        ...l,
                        rows: l.rows.filter(r => r.id !== rowId)
                    };
                }
                return l;
            })
        }));
    };

    const updateRow = (levelId, rowId, field, value) => {
        setFormData(prev => ({
            ...prev,
            levels: prev.levels.map(l => {
                if (l.id === levelId) {
                    return {
                        ...l,
                        rows: l.rows.map(r => {
                            if (r.id === rowId) {
                                return { ...r, [field]: value };
                            }
                            return r;
                        })
                    };
                }
                return l;
            })
        }));
    };

    const getFilteredEmployeesForRow = (row) => {
        return employees.filter((emp) => {
            const matchesDepartment =
                row.departmentId === "All" || emp.department_id === parseInt(row.departmentId);
            const matchesDesignation =
                row.designationId === "All" || emp.designation_id === parseInt(row.designationId);

            // Exclude if already selected elsewhere, BUT keep if it's the CURRENT row's selection
            const isSelectedElsewhere = allSelectedEmployeeIds.has(String(emp.id)) && String(emp.id) !== String(row.employeeId);

            return matchesDepartment && matchesDesignation && !isSelectedElsewhere;
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const teamMembers = formData.levels.flatMap((level, idx) =>
            level.rows.filter(r => r.employeeId).map(r => ({
                employee_id: r.employeeId,
                level: idx + 1
            }))
        );

        if (!formData.teamName || teamMembers.length === 0) return;

        onSubmit({
            id: teamId,
            team_name: formData.teamName,
            description: formData.description,
            status: formData.status,
            members: teamMembers
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 font-primary text-left">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl custom-scrollbar rounded-sm">
                <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex items-center justify-between z-50 rounded-t-sm shadow-md">
                    <div className="flex items-center gap-4">
                        <div className="bg-white bg-opacity-20 p-2.5 rounded-sm">
                            <Users size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white capitalize tracking-wide leading-tight">
                                {isFetchingTeam ? "Loading Team..." : `Edit Team: ${team?.team_id || ''}`}
                            </h2>
                            <p className="text-xs text-orange-50 font-medium opacity-90">
                                Update your team structure, members, and organizational hierarchy
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 p-2 transition-all rounded-full">
                        <X size={24} />
                    </button>
                </div>

                {isFetchingTeam ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-2 text-[15px] font-semibold text-gray-700 mb-2 capitalize">
                                    <LayoutGrid size={14} className="text-[#FF7B1D]" />
                                    Team Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text" required maxLength={50}
                                    value={formData.teamName}
                                    onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none transition-all text-sm text-gray-900 placeholder-gray-400 bg-white hover:border-gray-300 shadow-sm"
                                    placeholder="Enter team name"
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-[15px] font-semibold text-gray-700 mb-2 capitalize">
                                    <CheckCircle size={14} className="text-[#FF7B1D]" />
                                    Status
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none transition-all text-sm text-gray-900 bg-white hover:border-gray-300 shadow-sm"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-[15px] font-semibold text-gray-700 mb-2 capitalize">
                                <FileText size={14} className="text-[#FF7B1D]" />
                                Description
                            </label>
                            <textarea
                                value={formData.description} maxLength={500}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none transition-all resize-none text-sm text-gray-900 bg-white placeholder-gray-400 shadow-sm hover:border-gray-300"
                                rows={3}
                                placeholder="Enter team description"
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center border-b pb-4">
                                <label className="flex items-center gap-2 text-[15px] font-semibold text-gray-700 capitalize tracking-wide">
                                    <Settings size={18} className="text-[#FF7B1D]" />
                                    Team Structure (Levels) <span className="text-red-500">*</span>
                                </label>
                            </div>

                            <div className="space-y-8 mt-6">
                                {formData.levels.map((level, levelIdx) => (
                                    <div key={level.id} className="relative">
                                        {levelIdx > 0 && (
                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-0">
                                                <div className="h-6 w-0.5 bg-orange-100"></div>
                                                <ArrowDown size={14} className="text-orange-400 -mt-1.5" />
                                            </div>
                                        )}
                                        <div className="bg-white border border-gray-200 p-5 rounded shadow-sm relative z-10 hover:border-orange-200 transition-all">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-8 h-8 rounded-full bg-[#FF7B1D] text-white text-xs font-black flex items-center justify-center shadow-md">
                                                        {levelIdx + 1}
                                                    </span>
                                                    <span className="text-sm font-black text-gray-800 capitalize tracking-widest">
                                                        Level {levelIdx + 1}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button" onClick={() => addRowToLevel(level.id)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF7B1D] text-white rounded-none hover:bg-[#e66a15] transition-all shadow-sm text-[11px] font-bold capitalize tracking-wider"
                                                        title="Add Employee to this level"
                                                    >
                                                        <Plus size={14} />
                                                        Add Employee
                                                    </button>
                                                    {formData.levels.length > 1 && (
                                                        <button
                                                            type="button" onClick={() => removeLevel(level.id)}
                                                            className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-all shadow-sm"
                                                            title="Remove level"
                                                        >
                                                            <Trash2 size={20} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                {level.rows.map((row, rowIdx) => {
                                                    const rowEmployees = getFilteredEmployeesForRow(row);
                                                    const selectedEmp = employees.find(e => e.id == row.employeeId);
                                                    const assignedTeam = selectedEmp?.assigned_team_name && selectedEmp.assigned_team_name !== team?.team_name ? selectedEmp.assigned_team_name : null;
                                                    return (
                                                        <div key={row.id} className={`grid grid-cols-1 md:grid-cols-3 gap-5 relative group ${rowIdx > 0 ? "pt-6 border-t border-gray-100" : ""}`}>
                                                            {rowIdx > 0 && (
                                                                <button
                                                                    type="button" onClick={() => removeRowFromLevel(level.id, row.id)}
                                                                    className="absolute -right-3 top-2 w-6 h-6 flex items-center justify-center bg-red-50 text-red-500 border border-red-100 rounded-sm hover:bg-red-500 hover:text-white transition-all shadow-sm z-10 active:scale-95"
                                                                    title="Remove row"
                                                                >
                                                                    <X size={12} strokeWidth={3} />
                                                                </button>
                                                            )}
                                                            <div>
                                                                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 capitalize mb-2">
                                                                    <Building2 size={12} className="text-[#FF7B1D]" /> Department
                                                                </label>
                                                                <select
                                                                    value={row.departmentId}
                                                                    onChange={(e) => updateRow(level.id, row.id, 'departmentId', e.target.value)}
                                                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none text-xs bg-white hover:border-gray-300 transition-all"
                                                                >
                                                                    <option value="All">All Departments</option>
                                                                    {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.department_name}</option>)}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 capitalize mb-2">
                                                                    <Briefcase size={12} className="text-[#FF7B1D]" /> Designation
                                                                </label>
                                                                <select
                                                                    value={row.designationId}
                                                                    onChange={(e) => updateRow(level.id, row.id, 'designationId', e.target.value)}
                                                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none text-xs bg-white hover:border-gray-300 transition-all"
                                                                >
                                                                    <option value="All">All Designations</option>
                                                                    {designations.map(desig => <option key={desig.id} value={desig.id}>{desig.designation_name}</option>)}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 capitalize mb-2">
                                                                    <User size={12} className="text-[#FF7B1D]" /> Select Employee
                                                                </label>
                                                                <div className="space-y-1">
                                                                    <select
                                                                        value={row.employeeId}
                                                                        onChange={(e) => updateRow(level.id, row.id, 'employeeId', e.target.value)}
                                                                        className={`w-full px-3 py-2.5 border rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none text-xs transition-all ${row.employeeId && assignedTeam ? 'border-red-500 text-red-600' : 'border-gray-200 text-gray-800 hover:border-gray-300'}`}
                                                                    >
                                                                        <option value="">Choose Employee...</option>
                                                                        {rowEmployees.map(emp => {
                                                                            const isConflict = emp.assigned_team_name && emp.assigned_team_name !== team?.team_name ? emp.assigned_team_name : null;
                                                                            return (
                                                                                <option key={emp.id} value={emp.id} className={isConflict ? 'text-red-500 font-medium' : ''}>
                                                                                    {emp.employee_name}
                                                                                </option>
                                                                            );
                                                                        })}
                                                                    </select>
                                                                    {row.employeeId && assignedTeam && (
                                                                        <div className="text-[9px] font-bold text-red-500 capitalize flex items-center gap-1 px-1">
                                                                            <AlertCircle size={8} /> Conflict: Already in {assignedTeam}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Inline Selected Employees Preview */}
                                            {level.rows.some(r => r.employeeId) && (
                                                <div className="mt-4 pt-4 border-t border-orange-50">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                                        <Users size={11} className="text-orange-400" /> Selected Members
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {level.rows.filter(r => r.employeeId).map((r, i) => {
                                                            const emp = employees.find(e => e.id == r.employeeId);
                                                            const conflict = emp?.assigned_team_name && emp.assigned_team_name !== team?.team_name ? emp.assigned_team_name : null;
                                                            const internalLevels = internalSelectionMap[r.employeeId] || [];
                                                            const isDuplicate = internalLevels.length > 1;
                                                            return (
                                                                <div key={i} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-sm border text-xs font-semibold ${conflict ? 'bg-red-50 border-red-200 text-red-700' : isDuplicate ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-orange-50 border-orange-100 text-gray-800'}`}>
                                                                    <div className="w-5 h-5 rounded-full bg-white border border-current flex items-center justify-center text-[9px] font-black flex-shrink-0">
                                                                        {emp?.employee_name?.charAt(0)}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="truncate max-w-[100px] font-bold text-[11px]">{emp?.employee_name}</p>
                                                                        <p className="text-[9px] opacity-70 truncate">{emp?.designation_name}</p>
                                                                    </div>
                                                                    {conflict && <AlertCircle size={11} className="text-red-500 flex-shrink-0" title={`Already in ${conflict}`} />}
                                                                    {isDuplicate && !conflict && <AlertCircle size={11} className="text-orange-500 flex-shrink-0" title="Duplicate in levels" />}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end mt-2">
                                <button
                                    type="button" onClick={addLevel}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#FF7B1D] text-white font-bold text-[11px] capitalize tracking-wider hover:bg-[#e66a15] transition-all shadow-sm"
                                >
                                    <Plus size={16} />
                                    Add New Level
                                </button>
                            </div>
                        </div>

                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3 -mx-6 -mb-6 mt-10 rounded-b-sm">
                            <button
                                type="button" onClick={onClose}
                                className="px-8 py-2.5 rounded-sm border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-all text-sm bg-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isUpdating || !formData.levels.some(l => l.rows.some(r => r.employeeId))}
                                className="flex items-center justify-center gap-2 px-8 py-2.5 rounded-sm bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold hover:shadow-lg transform transition-all active:scale-95 disabled:opacity-50 text-sm"
                            >
                                {isUpdating ? "Updating..." : "Update Team"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default EditTeamModal;
