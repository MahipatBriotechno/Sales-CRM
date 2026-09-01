import { Outlet, useLocation } from "react-router-dom";
import { createContext, useContext, useState } from "react";
import { useSelector } from "react-redux";
import Header from "./Header";
import Sidebar from "./Sidebar";
import ProfileCompletionBanner from "./ProfileCompletionBanner";
import GlobalAttendanceEnforcer from "./Attendance/GlobalAttendanceEnforcer";

const LayoutContext = createContext(null);

const DashboardLayout = ({ children, isFullHeight = false }) => {
  const isNested = useContext(LayoutContext);
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isLocked = useSelector((state) => state.ui.sidebarLocked);

  // If already inside a layout provider, just render children
  if (isNested) {
    return <>{children}</>;
  }

  // Determine if this page should be full height based on route
  const fullHeightPages = [
    "/notifications",
    "/mail",
    "/additional/messenger"
  ];

  const isFull = isFullHeight || fullHeightPages.some(path => location.pathname.startsWith(path));

  return (
    <LayoutContext.Provider value={true}>
      <div className={isFull ? "h-screen overflow-hidden" : ""}>
        {/* Header */}
        <Header />

        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

        {/* Main Content */}
        <main
          className={`mt-[70px] p-0 pr-0 bg-white transition-all duration-300
          ${sidebarOpen ? "xl:ml-[280px]" : "ml-0"} 
          ${isLocked ? "xl:ml-[280px]" : "xl:ml-[68px]"} ${isFull ? "h-[calc(100vh-64px)] flex flex-col overflow-hidden" : "min-h-screen"}`}
        >
          <GlobalAttendanceEnforcer />
          <ProfileCompletionBanner />
          {isFull ? (
            <div className="flex-1 min-h-0 flex flex-col">
              {children || <Outlet />}
            </div>
          ) : (children || <Outlet />)}
        </main>
      </div>
    </LayoutContext.Provider>
  );
};

export default DashboardLayout;
// import React, { useState } from 'react';
// import { Calendar, Filter, Plus, Search, Eye, Edit, Trash2, Download, Check, X, DollarSign, AlertCircle, FileText, Clock } from 'lucide-react';

// export default function ManageLeavePage() {
//   const [leaves, setLeaves] = useState([
//     {
//       id: 1,
//       employee: 'John Smith',
//       empId: 'EMP001',
//       department: 'Software Development',
//       type: 'Sick Leave',
//       startDate: '2024-12-01',
//       endDate: '2024-12-03',
//       days: 3,
//       status: 'Approved',
//       leaveCategory: 'Paid',
//       reason: 'Medical treatment - Doctor appointment',
//       appliedOn: '2024-11-25',
//       approvedBy: 'Sarah Manager',
//       documents: 'medical_cert.pdf'
//     },
//     {
//       id: 2,
//       employee: 'Sarah Johnson',
//       empId: 'EMP002',
//       department: 'UI/UX Design',
//       type: 'Casual Leave',
//       startDate: '2024-12-05',
//       endDate: '2024-12-07',
//       days: 3,
//       status: 'Pending',
//       leaveCategory: 'Paid',
//       reason: 'Personal work - Family function',
//       appliedOn: '2024-11-28',
//       approvedBy: null,
//       documents: null
//     },
//     {
//       id: 3,
//       employee: 'Mike Wilson',
//       empId: 'EMP003',
//       department: 'DevOps',
//       type: 'Annual Leave',
//       startDate: '2024-12-10',
//       endDate: '2024-12-15',
//       days: 6,
//       status: 'Approved',
//       leaveCategory: 'Paid',
//       reason: 'Vacation with family',
//       appliedOn: '2024-11-20',
//       approvedBy: 'Sarah Manager',
//       documents: null
//     },
//     {
//       id: 4,
//       employee: 'Emma Davis',
//       empId: 'EMP004',
//       department: 'QA Testing',
//       type: 'Maternity Leave',
//       startDate: '2024-12-01',
//       endDate: '2025-02-28',
//       days: 90,
//       status: 'Approved',
//       leaveCategory: 'Paid',
//       reason: 'Maternity - Expected delivery date: Dec 15',
//       appliedOn: '2024-10-15',
//       approvedBy: 'HR Director',
//       documents: 'maternity_docs.pdf'
//     },
//     {
//       id: 5,
//       employee: 'David Brown',
//       empId: 'EMP005',
//       department: 'Software Development',
//       type: 'Sick Leave',
//       startDate: '2024-11-28',
//       endDate: '2024-11-29',
//       days: 2,
//       status: 'Rejected',
//       leaveCategory: 'Unpaid',
//       reason: 'Flu - No medical certificate provided',
//       appliedOn: '2024-11-27',
//       approvedBy: 'Sarah Manager',
//       documents: null
//     },
//     {
//       id: 6,
//       employee: 'Lisa Anderson',
//       empId: 'EMP006',
//       department: 'Project Management',
//       type: 'Leave Without Pay',
//       startDate: '2024-12-20',
//       endDate: '2024-12-27',
//       days: 8,
//       status: 'Pending',
//       leaveCategory: 'Unpaid',
//       reason: 'Extended personal travel - Exceeded annual leave quota',
//       appliedOn: '2024-11-29',
//       approvedBy: null,
//       documents: null
//     },
//     {
//       id: 7,
//       employee: 'Robert Garcia',
//       empId: 'EMP007',
//       department: 'Data Analytics',
//       type: 'Compensatory Off',
//       startDate: '2024-12-08',
//       endDate: '2024-12-09',
//       days: 2,
//       status: 'Approved',
//       leaveCategory: 'Paid',
//       reason: 'Worked on weekend for product launch',
//       appliedOn: '2024-11-26',
//       approvedBy: 'Tech Lead',
//       documents: null
//     },
//   ]);

//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterStatus, setFilterStatus] = useState('All');
//   const [filterCategory, setFilterCategory] = useState('All');
//   const [selectedLeave, setSelectedLeave] = useState(null);

//   const getStatusColor = (status) => {
//     switch(status) {
//       case 'Approved': return 'bg-green-100 text-green-700 border-green-300';
//       case 'Pending': return 'bg-orange-100 text-orange-700 border-orange-300';
//       case 'Rejected': return 'bg-red-100 text-red-700 border-red-300';
//       default: return 'bg-gray-100 text-gray-700 border-gray-300';
//     }
//   };

//   const getCategoryColor = (category) => {
//     return category === 'Paid'
//       ? 'bg-blue-100 text-blue-700 border-blue-300'
//       : 'bg-purple-100 text-purple-700 border-purple-300';
//   };

//   const filteredLeaves = leaves.filter(leave => {
//     const matchesSearch = leave.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                          leave.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                          leave.empId.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                          leave.department.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesStatus = filterStatus === 'All' || leave.status === filterStatus;
//     const matchesCategory = filterCategory === 'All' || leave.leaveCategory === filterCategory;
//     return matchesSearch && matchesStatus && matchesCategory;
//   });

//   const stats = {
//     total: leaves.length,
//     approved: leaves.filter(l => l.status === 'Approved').length,
//     pending: leaves.filter(l => l.status === 'Pending').length,
//     rejected: leaves.filter(l => l.status === 'Rejected').length,
//     paid: leaves.filter(l => l.leaveCategory === 'Paid').length,
//     unpaid: leaves.filter(l => l.leaveCategory === 'Unpaid').length,
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 p-6">
//       {/* Header */}
//       <div className="mb-6">
//         <div className="flex items-center gap-3 mb-2">
//           <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-sm flex items-center justify-center">
//             <Calendar className="w-6 h-6 text-white" />
//           </div>
//           <div>
//             <h1 className="text-3xl font-bold text-gray-800">Leave Management System</h1>
//             <p className="text-gray-600 text-sm">TechVista IT Solutions Pvt. Ltd.</p>
//           </div>
//         </div>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
//         <div className="bg-white rounded-sm shadow-sm border-l-4 border-orange-500 p-4 hover:shadow-md transition-shadow">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-gray-600 text-xs font-medium">Total Requests</p>
//               <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
//             </div>
//             <div className="w-10 h-10 bg-orange-100 rounded-sm flex items-center justify-center">
//               <FileText className="w-5 h-5 text-orange-600" />
//             </div>
//           </div>
//         </div>

//         <div className="bg-white rounded-sm shadow-sm border-l-4 border-green-500 p-4 hover:shadow-md transition-shadow">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-gray-600 text-xs font-medium">Approved</p>
//               <p className="text-2xl font-bold text-gray-800">{stats.approved}</p>
//             </div>
//             <div className="w-10 h-10 bg-green-100 rounded-sm flex items-center justify-center">
//               <Check className="w-5 h-5 text-green-600" />
//             </div>
//           </div>
//         </div>

//         <div className="bg-white rounded-sm shadow-sm border-l-4 border-orange-400 p-4 hover:shadow-md transition-shadow">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-gray-600 text-xs font-medium">Pending</p>
//               <p className="text-2xl font-bold text-gray-800">{stats.pending}</p>
//             </div>
//             <div className="w-10 h-10 bg-orange-50 rounded-sm flex items-center justify-center">
//               <Clock className="w-5 h-5 text-orange-400" />
//             </div>
//           </div>
//         </div>

//         <div className="bg-white rounded-sm shadow-sm border-l-4 border-red-500 p-4 hover:shadow-md transition-shadow">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-gray-600 text-xs font-medium">Rejected</p>
//               <p className="text-2xl font-bold text-gray-800">{stats.rejected}</p>
//             </div>
//             <div className="w-10 h-10 bg-red-100 rounded-sm flex items-center justify-center">
//               <X className="w-5 h-5 text-red-600" />
//             </div>
//           </div>
//         </div>

//         <div className="bg-white rounded-sm shadow-sm border-l-4 border-blue-500 p-4 hover:shadow-md transition-shadow">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-gray-600 text-xs font-medium">Paid Leave</p>
//               <p className="text-2xl font-bold text-gray-800">{stats.paid}</p>
//             </div>
//             <div className="w-10 h-10 bg-blue-100 rounded-sm flex items-center justify-center">
//               <DollarSign className="w-5 h-5 text-blue-600" />
//             </div>
//           </div>
//         </div>

//         <div className="bg-white rounded-sm shadow-sm border-l-4 border-purple-500 p-4 hover:shadow-md transition-shadow">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-gray-600 text-xs font-medium">Unpaid Leave</p>
//               <p className="text-2xl font-bold text-gray-800">{stats.unpaid}</p>
//             </div>
//             <div className="w-10 h-10 bg-purple-100 rounded-sm flex items-center justify-center">
//               <AlertCircle className="w-5 h-5 text-purple-600" />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Filters and Actions */}
//       <div className="bg-white rounded-sm shadow-sm p-4 mb-6">
//         <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
//           <div className="flex flex-col md:flex-row gap-3 flex-1 w-full">
//             {/* Search */}
//             <div className="relative flex-1">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//               <input
//                 type="text"
//                 placeholder="Search by employee, ID, department, or leave type..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
//               />
//             </div>

//             {/* Status Filter */}
//             <div className="relative">
//               <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//               <select
//                 value={filterStatus}
//                 onChange={(e) => setFilterStatus(e.target.value)}
//                 className="pl-9 pr-8 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white min-w-[140px]"
//               >
//                 <option>All</option>
//                 <option>Approved</option>
//                 <option>Pending</option>
//                 <option>Rejected</option>
//               </select>
//             </div>

//             {/* Category Filter */}
//             <div className="relative">
//               <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//               <select
//                 value={filterCategory}
//                 onChange={(e) => setFilterCategory(e.target.value)}
//                 className="pl-9 pr-8 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white min-w-[140px]"
//               >
//                 <option>All</option>
//                 <option>Paid</option>
//                 <option>Unpaid</option>
//               </select>
//             </div>
//           </div>

//           {/* Action Buttons */}
//           <div className="flex gap-3 w-full lg:w-auto">
//             <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-orange-500 text-orange-600 rounded-sm hover:bg-orange-50 transition-colors">
//               <Download className="w-4 h-4" />
//               Export
//             </button>
//             <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-sm hover:from-orange-600 hover:to-orange-700 transition-all shadow-sm">
//               <Plus className="w-4 h-4" />
//               New Leave
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Leave Table */}
//       <div className="bg-white rounded-sm shadow-sm overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
//               <tr>
//                 <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Employee</th>
//                 <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Department</th>
//                 <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Leave Type</th>
//                 <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Duration</th>
//                 <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Days</th>
//                 <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Category</th>
//                 <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
//                 <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-200">
//               {filteredLeaves.map((leave) => (
//                 <tr key={leave.id} className="hover:bg-orange-50 transition-colors">
//                   <td className="px-4 py-4">
//                     <div className="flex items-center gap-3">
//                       <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-sm flex items-center justify-center text-white font-semibold text-sm">
//                         {leave.employee.split(' ').map(n => n[0]).join('')}
//                       </div>
//                       <div>
//                         <p className="font-medium text-gray-800 text-sm">{leave.employee}</p>
//                         <p className="text-xs text-gray-500">{leave.empId}</p>
//                       </div>
//                     </div>
//                   </td>
//                   <td className="px-4 py-4">
//                     <span className="text-sm text-gray-700">{leave.department}</span>
//                   </td>
//                   <td className="px-4 py-4">
//                     <span className="text-sm font-medium text-gray-800">{leave.type}</span>
//                   </td>
//                   <td className="px-4 py-4">
//                     <div className="text-sm text-gray-700">
//                       <p className="font-medium">{leave.startDate}</p>
//                       <p className="text-xs text-gray-500">to {leave.endDate}</p>
//                     </div>
//                   </td>
//                   <td className="px-4 py-4">
//                     <span className="inline-flex items-center justify-center w-12 h-8 bg-orange-100 text-orange-700 rounded-sm font-bold text-sm">
//                       {leave.days}
//                     </span>
//                   </td>
//                   <td className="px-4 py-4">
//                     <span className={`inline - flex items - center gap - 1 px - 3 py - 1 rounded - sm text - xs font - semibold border ${ getCategoryColor(leave.leaveCategory) } `}>
//                       {leave.leaveCategory === 'Paid' ? <DollarSign className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
//                       {leave.leaveCategory}
//                     </span>
//                   </td>
//                   <td className="px-4 py-4">
//                     <span className={`inline - flex items - center px - 3 py - 1 rounded - sm text - xs font - semibold border ${ getStatusColor(leave.status) } `}>
//                       {leave.status}
//                     </span>
//                   </td>
//                   <td className="px-4 py-4">
//                     <div className="flex gap-2">
//                       <button
//                         onClick={() => setSelectedLeave(leave)}
//                         className="p-2 text-blue-600 hover:bg-blue-50 rounded-sm transition-colors"
//                         title="View Details"
//                       >
//                         <Eye className="w-4 h-4" />
//                       </button>
//                       <button className="p-2 text-orange-600 hover:bg-orange-50 rounded-sm transition-colors" title="Edit">
//                         <Edit className="w-4 h-4" />
//                       </button>
//                       <button className="p-2 text-red-600 hover:bg-red-50 rounded-sm transition-colors" title="Delete">
//                         <Trash2 className="w-4 h-4" />
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         {filteredLeaves.length === 0 && (
//           <div className="text-center py-12">
//             <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
//             <p className="text-gray-500 text-lg font-medium">No leave requests found</p>
//             <p className="text-gray-400 text-sm">Try adjusting your search or filter criteria</p>
//           </div>
//         )}
//       </div>

//       {/* Leave Details Modal */}
//       {selectedLeave && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedLeave(null)}>
//           <div className="bg-white rounded-sm shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
//             {/* Modal Header */}
//             <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-sm">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <h2 className="text-2xl font-bold">Leave Request Details</h2>
//                   <p className="text-orange-100 text-sm mt-1">Request ID: LR-{selectedLeave.id.toString().padStart(4, '0')}</p>
//                 </div>
//                 <button onClick={() => setSelectedLeave(null)} className="text-white hover:bg-orange-600 p-2 rounded-sm transition-colors">
//                   <X className="w-6 h-6" />
//                 </button>
//               </div>
//             </div>

//             {/* Modal Body */}
//             <div className="p-6 space-y-6">
//               {/* Employee Info */}
//               <div className="bg-orange-50 border border-orange-200 rounded-sm p-4">
//                 <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
//                   <div className="w-8 h-8 bg-orange-500 rounded-sm flex items-center justify-center">
//                     <FileText className="w-4 h-4 text-white" />
//                   </div>
//                   Employee Information
//                 </h3>
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <p className="text-xs text-gray-600 font-medium">Name</p>
//                     <p className="text-sm font-semibold text-gray-800">{selectedLeave.employee}</p>
//                   </div>
//                   <div>
//                     <p className="text-xs text-gray-600 font-medium">Employee ID</p>
//                     <p className="text-sm font-semibold text-gray-800">{selectedLeave.empId}</p>
//                   </div>
//                   <div>
//                     <p className="text-xs text-gray-600 font-medium">Department</p>
//                     <p className="text-sm font-semibold text-gray-800">{selectedLeave.department}</p>
//                   </div>
//                   <div>
//                     <p className="text-xs text-gray-600 font-medium">Applied On</p>
//                     <p className="text-sm font-semibold text-gray-800">{selectedLeave.appliedOn}</p>
//                   </div>
//                 </div>
//               </div>

//               {/* Leave Details */}
//               <div className="space-y-4">
//                 <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
//                   <Calendar className="w-5 h-5 text-orange-500" />
//                   Leave Details
//                 </h3>
//                 <div className="grid grid-cols-2 gap-4">
//                   <div className="bg-gray-50 rounded-sm p-3">
//                     <p className="text-xs text-gray-600 font-medium mb-1">Leave Type</p>
//                     <p className="text-sm font-semibold text-gray-800">{selectedLeave.type}</p>
//                   </div>
//                   <div className="bg-gray-50 rounded-sm p-3">
//                     <p className="text-xs text-gray-600 font-medium mb-1">Total Days</p>
//                     <p className="text-sm font-semibold text-orange-600">{selectedLeave.days} Days</p>
//                   </div>
//                   <div className="bg-gray-50 rounded-sm p-3">
//                     <p className="text-xs text-gray-600 font-medium mb-1">Start Date</p>
//                     <p className="text-sm font-semibold text-gray-800">{selectedLeave.startDate}</p>
//                   </div>
//                   <div className="bg-gray-50 rounded-sm p-3">
//                     <p className="text-xs text-gray-600 font-medium mb-1">End Date</p>
//                     <p className="text-sm font-semibold text-gray-800">{selectedLeave.endDate}</p>
//                   </div>
//                   <div className="bg-gray-50 rounded-sm p-3">
//                     <p className="text-xs text-gray-600 font-medium mb-1">Leave Category</p>
//                     <span className={`inline - flex items - center gap - 1 px - 3 py - 1 rounded - sm text - xs font - semibold border ${ getCategoryColor(selectedLeave.leaveCategory) } `}>
//                       {selectedLeave.leaveCategory === 'Paid' ? <DollarSign className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
//                       {selectedLeave.leaveCategory}
//                     </span>
//                   </div>
//                   <div className="bg-gray-50 rounded-sm p-3">
//                     <p className="text-xs text-gray-600 font-medium mb-1">Status</p>
//                     <span className={`inline - flex items - center px - 3 py - 1 rounded - sm text - xs font - semibold border ${ getStatusColor(selectedLeave.status) } `}>
//                       {selectedLeave.status}
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               {/* Reason */}
//               <div>
//                 <h3 className="text-lg font-semibold text-gray-800 mb-2">Reason</h3>
//                 <div className="bg-gray-50 rounded-sm p-4 border border-gray-200">
//                   <p className="text-sm text-gray-700">{selectedLeave.reason}</p>
//                 </div>
//               </div>

//               {/* Additional Info */}
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <p className="text-xs text-gray-600 font-medium mb-1">Approved/Reviewed By</p>
//                   <p className="text-sm font-semibold text-gray-800">{selectedLeave.approvedBy || 'Pending Review'}</p>
//                 </div>
//                 <div>
//                   <p className="text-xs text-gray-600 font-medium mb-1">Documents</p>
//                   {selectedLeave.documents ? (
//                     <a href="#" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
//                       <FileText className="w-4 h-4" />
//                       {selectedLeave.documents}
//                     </a>
//                   ) : (
//                     <p className="text-sm text-gray-500">No documents attached</p>
//                   )}
//                 </div>
//               </div>

//               {/* Action Buttons */}
//               {selectedLeave.status === 'Pending' && (
//                 <div className="flex gap-3 pt-4 border-t">
//                   <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-sm hover:bg-green-600 transition-colors font-semibold">
//                     <Check className="w-5 h-5" />
//                     Approve
//                   </button>
//                   <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-sm hover:bg-red-600 transition-colors font-semibold">
//                     <X className="w-5 h-5" />
//                     Reject
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
