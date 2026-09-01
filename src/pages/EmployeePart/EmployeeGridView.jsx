import React from "react";
import {
  Trash2,
  Camera,
  Mic,
  Eye,
  Edit,
} from "lucide-react";
import ActionGuard from "../../components/common/ActionGuard";

/**
 * Main Employee Grid View Component
 * Receives filtered employees and action handlers from parent
 */
const EmployeeGridView = ({ employees, onEdit, onDelete, onView }) => {
  const getProductivityColor = (productivity) => {
    if (productivity >= 80) return "text-green-600";
    if (productivity >= 50) return "text-purple-600";
    if (productivity >= 30) return "text-yellow-600";
    return "text-red-600";
  };

  const getProductivityBg = (productivity) => {
    if (productivity >= 80) return "bg-green-500";
    if (productivity >= 50) return "bg-purple-500";
    if (productivity >= 30) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getDesignationColor = (designation) => {
    const colors = [
      "text-pink-500 bg-pink-50",
      "text-purple-500 bg-purple-50",
      "text-blue-500 bg-blue-50",
      "text-cyan-500 bg-cyan-50",
      "text-teal-500 bg-teal-50",
      "text-green-500 bg-green-50",
    ];
    if (!designation) return colors[0];
    const hash = designation
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div className="min-h-screen bg-gray-0 p-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mt-4">
        {employees.map((emp) => {
          const essentialFields = [
            'gender', 'father_name', 'mother_name', 'marital_status',
            'permanent_address_l1', 'permanent_city', 'permanent_state', 'permanent_country', 'permanent_pincode',
            'aadhar_number', 'pan_number', 'aadhar_front', 'aadhar_back', 'pan_card',
            'ifsc_code', 'account_number', 'account_holder_name', 'branch_name'
          ];
          const completed = essentialFields.filter(f => emp[f] && emp[f] !== 'null' && emp[f] !== '');
          const percent = Math.round((completed.length / essentialFields.length) * 100);

          return (
            <div
              key={emp.id}
              className="bg-white border border-gray-200 rounded-sm shadow-sm hover:shadow-md transition-all relative group flex flex-col h-full overflow-hidden"
            >
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                {/* <ActionGuard permission="employee_read" module="Employee Management" type="read">
                  <button
                    onClick={(e) => { e.stopPropagation(); onView(emp, { monitor: true, type: 'video' }); }}
                    className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-sm bg-white shadow-sm border border-orange-100"
                    title="View Camera"
                  >
                    <Camera size={16} />
                  </button>
                </ActionGuard>
                <ActionGuard permission="employee_read" module="Employee Management" type="read">
                  <button
                    onClick={(e) => { e.stopPropagation(); onView(emp, { monitor: true, type: 'audio' }); }}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-sm bg-white shadow-sm border border-blue-100"
                    title="Listen Audio"
                  >
                    <Mic size={16} />
                  </button>
                </ActionGuard> */}
                <ActionGuard permission="employee_read" module="Employee Management" type="read">
                  <button
                    onClick={(e) => { e.stopPropagation(); onView(emp); }}
                    className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-sm bg-white shadow-sm border border-gray-100"
                    title="View Profile"
                  >
                    <Eye size={16} />
                  </button>
                </ActionGuard>
                <ActionGuard permission="employee_edit" module="Employee Management" type="update">
                  <button onClick={(e) => { e.stopPropagation(); onEdit(emp); }} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-sm bg-white shadow-sm border border-orange-100">
                    <Edit size={16} />
                  </button>
                </ActionGuard>
                <ActionGuard permission="employee_delete" module="Employee Management" type="delete">
                  <button onClick={(e) => { e.stopPropagation(); onDelete(emp); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-sm bg-white shadow-sm border border-red-100">
                    <Trash2 size={16} />
                  </button>
                </ActionGuard>
              </div>

              <div
                className="p-6 pb-4 flex-1 flex flex-col items-center mt-2 cursor-pointer"
                onClick={() => onView(emp, { monitor: true })}
              >
                <div className="relative">
                  {emp.profile_picture_url ? (
                    <img
                      src={emp.profile_picture_url}
                      alt={emp.employee_name}
                      className="w-20 h-20 rounded-full border-4 border-orange-50 object-cover shadow-inner"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-2xl border-4 border-orange-50 shadow-inner">
                      {emp.employee_name?.substring(0, 1)}
                    </div>
                  )}
                  <div className="absolute bottom-0.5 right-0.5 w-4.5 h-4.5 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                </div>

                <div className="mt-4 text-center">
                  <h3 className="text-lg font-bold text-gray-800 line-clamp-1">
                    {emp.employee_name}
                  </h3>
                  <p className="text-orange-500 text-[10px] font-black mt-1 tracking-widest uppercase bg-orange-50 px-2 py-0.5 rounded-full inline-block border border-orange-100 shadow-sm">
                    {emp.employee_id}
                  </p>
                </div>

                <div className="flex flex-col items-center gap-2 mt-4">
                  <span
                    className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border shadow-sm ${getDesignationColor(
                      emp.designation_name
                    )}`}
                  >
                    {emp.designation_name || "N/A"}
                  </span>
                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                    {emp.department_name || "N/A"}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 p-6 space-y-5 border-t border-gray-100 mt-auto">
                <div className="grid grid-cols-3 gap-2 pb-4 border-b border-gray-200">
                  <div className="text-center">
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">Projects</p>
                    <p className="text-sm font-black text-gray-800 mt-0.5">20</p>
                  </div>
                  <div className="text-center border-x border-gray-200">
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">Tasks</p>
                    <p className="text-sm font-black text-gray-800 mt-0.5">13</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">Gender</p>
                    <p className="text-sm font-black text-gray-800 mt-0.5 capitalize">{emp.gender || "-"}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Profile Status</p>
                      <p className={`text-[9px] font-black uppercase ${percent === 100 ? "text-green-600" : "text-orange-600"}`}>
                        {percent}%
                      </p>
                    </div>
                    <div className="w-full bg-white rounded-full h-1.5 overflow-hidden border border-gray-100 shadow-inner">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${percent === 100 ? "bg-green-500" : "bg-orange-500"}`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Productivity</p>
                      <p className={`text-[9px] font-black uppercase ${getProductivityColor(65)}`}>65%</p>
                    </div>
                    <div className="w-full bg-white rounded-full h-1.5 overflow-hidden border border-gray-100 shadow-inner">
                      <div
                        className={`h-full rounded-full ${getProductivityBg(65)}`}
                        style={{ width: `${65}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center pt-1">
                  <span
                    className={`px-4 py-1 text-[10px] font-black rounded-full uppercase tracking-widest border shadow-sm ${emp.status === "Active"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-red-50 text-red-700 border-red-200"
                      }`}
                  >
                    {emp.status}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div >
  );
};

export default EmployeeGridView;
