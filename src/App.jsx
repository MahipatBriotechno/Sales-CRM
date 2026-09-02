import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ComingSoon from "./pages/ComingSoon";
import CompanyProfile from "./pages/Public/CompanyProfile";
import Dashboard from "./pages/Dashboard";
// CRM Dashboard
import CRMDashboard from "./pages/CrmDashboard/dashboard";
// HRM Dashboard
import HrmDashboard from "./pages/HrmDashboard/dashboard";
// Leads Managament part
import LeadDashboard from "./pages/LeadsManagement/dashboard";
import AllLeads from "./pages/LeadsManagement/AllLeadPagePart/AllLeads";
import NewLeads from "./pages/LeadsManagement/NewLeads";
import Assigned from "./pages/LeadsManagement/Assigned";
import DroppedLeads from "./pages/LeadsManagement/DroppedLeads";
import TrendingLeads from "./pages/LeadsManagement/Trending";
import Analysis from "./pages/LeadsManagement/Analysis";
import EmployeePerformanceDetail from "./pages/LeadsManagement/EmployeePerformanceDetail";
import NotConnectedLeads from "./pages/LeadsManagement/NotConnectedLeads";
import FollowUpLeads from "./pages/LeadsManagement/FollowUpLeads";
import MissedLeads from "./pages/LeadsManagement/MissedLeads";
import DuplicatesLeads from "./pages/LeadsManagement/DuplicatesLeads";
import WonLeads from "./pages/LeadsManagement/WonLeads";
import TrashLeads from "./pages/LeadsManagement/TrashLeads";
import AssignmentSettings from "./pages/LeadsManagement/AssignmentSettings";
import LeadRulesConfig from "./pages/LeadsManagement/LeadRulesConfig";
import WorkStation from "./pages/LeadsManagement/WorkStation";
import CustomFieldsManager from "./pages/LeadsManagement/CustomFieldsManager";

import LeadProfile from "./pages/LeadsManagement/LeadProfilePageParts/LeadProfile";

import AddNotes from "./components/LeadManagement/LeadPipLineStatus/AddNotes";
import CreateCallLogModal from "./components/LeadManagement/LeadPipLineStatus/CreateCallLogModal";

//pipline management part
import ManagePipline from "./pages/PipelineManagement/ManagePipline";
import ManageStage from "./pages/PipelineManagement/ManageStage";
import Analytics from "./pages/PipelineManagement/Analytics";
// Department part
import AllDepartment from "./pages/DepartmentPart/AllDepartment";
// Designation part
import AllDesignation from "./pages/DesignationPart/Designation";
// Term & Condition Part
import AllTermCondition from "./pages/Term & Condition/AllTerm";
// Employee part
import AllEmployee from "./pages/EmployeePart/AllEmployee";
import AddEmployee from "./pages/EmployeePart/AddEmployee";
import EditEmployee from "./pages/EmployeePart/EditEmployee";
import EmployeeProfile from "./pages/EmployeePart/AllEmployee/Profile.jsx";

// unused generally
// My Profile
import MyProfile from "./pages/Profile/MyProfile";

// Attendance Part
import AllAttendance from "./pages/AttendancePart/AllAttendance";
import EmployeeAttendance from "./pages/AttendancePart/EmployeeAttendance";
import AttendanceRecords from "./pages/AttendancePart/AttendanceRecords";
import ManageAttendance from "./pages/AttendancePart/ManageAttendancePart/ManageAttendance";
// Leave Management Part
import AllLeave from "./pages/LeaveManagement/AllLeave";
import Holiday from "./pages/LeaveManagement/Holiday";
import ManageLeave from "./pages/LeaveManagement/Manage";
// Salary Management Part
import AllSalary from "./pages/SalaryManagement/AllSalary";
// Company Policy Part
import AllCompanyPolicy from "./pages/CompanyPolicyPart/AllCompanyPolicy";
// HR Policy Part
import AllHRPolicy from "./pages/HrPolicyPage/AllHRPolicy";

// Jobs management
import Job from "./pages/JobManagement/Job";
import ApplicantList from "./pages/JobManagement/ApplicantList";
import PublicJobForm from "./pages/JobManagement/PublicJobForm";
import OfferLetterList from "./pages/OfferLetterPart/OfferLetterList";
// Notes  Part
import AllNotes from "./pages/NotesPart/AllNotes";
// To Do Part
import AllToDo from "./pages/ToDoPart/AllToDo";
// My Expanses Part
import MyExpanses from "./pages/MyExpansePart/MyExpanses";
// Quotation Part
import AllQuotation from "./pages/QuotationPart/AllQuotation";
// Invoice Part
import AllInvoice from "./pages/InvoicePart/AllInvoice";
// Notification Part
import Notification from "./pages/NotificationPart/Notification";
// Anouncement Part
import AllAnouncement from "./pages/AnouncementPart/AllAnouncement";
import AnnouncementCategoryPage from "./pages/AnouncementPart/Category";
// Business Info Part
import BusinessInfo from "./pages/BusinessInfoPart/BusinessInfo";
// Manage Subscription Part
import ManageSubscription from "./pages/ManageSubscription/ManageSubscription";

// Champion Management
import Lead from "./pages/ChampionsManagement/Lead";

// FAQ Part
import Faq from "./pages/Faq/Faq";
// Messenger Part
import Messenger from "./pages/MessengerPart/Messenger";
// Catelogs Part
import Catelogs from "./pages/CatelogsPart/Catelogs";
import CatalogView from "./pages/CatelogsPart/CatalogView";
import CatalogCategory from "./pages/CatelogsPart/CatalogCategory";
import AllMeetings from "./pages/MeetingPart/AllMeetings";
import AllVisitors from "./pages/VisitorPart/AllVisitors";
// Channel Integration
import CRMFormPage from "./pages/ChannelIntegration/CRMForm";
import GoogleDocsPage from "./pages/ChannelIntegration/GoogleDocs";
import MetaIntegration from "./pages/ChannelIntegration/MetaIntegration";
import JustdialIntegration from "./pages/ChannelIntegration/JustdialIntegration";
import IndiamartIntegration from "./pages/ChannelIntegration/IndiamartIntegration";
import PublicForm from "./pages/Public/PublicForm";
import ChannelSettings from "./pages/ChannelIntegration/ChannelSettings";
// Team Management

// Client Management Part
import ClientManagement from "./pages/ClientManagement/ClientManagement";
import ClientProfile from "./pages/ClientManagement/ClientProfile";
import TeamManagement from "./pages/TeamManagement/Team";
import ShiftManagement from "./pages/ShiftManagement/Shift";
// Auth Pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Packages from "./pages/Packages.jsx";
import LandingPage from "./pages/LandingPage";

// logout

import Logout from "./pages/Logout";
import SuperAdmin from "./pages/SuperAdmin/Dashboard/SuperAdmin";
import EnterpriseManagement from "./pages/SuperAdmin/EnterpriseManagement/EnterpriseManagement";
import EnterpriseDetail from "./pages/SuperAdmin/EnterpriseManagement/EnterpriseDetail";
import SubscriptionManagement from "./pages/SuperAdmin/SubscriptionManagement/SubscriptionManagement";
import ProductKeys from "./pages/SuperAdmin/ProductKeys/ProductKeys";
import PaymentGateways from "./pages/SuperAdmin/PaymentGateways/PaymentGateways";
import PlanManagement from "./pages/SuperAdmin/PlanManagement/PlanManagement";
// Header components
import NotificationPage from "./pages/TopBarComponents/Notification";
import MailPage from "./pages/TopBarComponents/MailPage";
// Reminder
import LeadsReminder from "./components/Reminder";
// Meeting reminder
import MeetingReminder from "./components/Meeting";
import ProtectedRoute from "./components/ProtectedRoute";
import Cashfree from "./pages/SuperAdmin/PaymentGateways/Cashfree.jsx";
import Razorpay from "./pages/SuperAdmin/PaymentGateways/Razorpay.jsx";
import PhonePay from "./pages/SuperAdmin/PaymentGateways/PhonePay.jsx";
import GoalSetting from "./pages/GoalSetting/GoalSetting";

import Wallet from "./pages/SuperAdmin/PaymentGateways/Wallet.jsx";

import RoleProtectedRoute from "./components/RoleProtectedRoute";
import GlobalModals from "./components/common/GlobalModals";
import TaskReminderPopup from "./components/TaskReminderPopup.jsx";
import VisitorReminder from "./components/Visitor/VisitorReminder.jsx";
import DashboardLayout from "./components/DashboardLayout";

function App() {
  return (
    <Router>

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/packages" element={<Packages />} />
        <Route path="/business/:id/:slug?" element={<CompanyProfile />} />
        <Route path="/catalog/view/:id" element={<CatalogView />} />
        <Route path="/apply/:link" element={<PublicJobForm />} />
        <Route path="/public/form/:slug" element={<PublicForm />} />


        {/* Protected Routes */}
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/logout" element={<Logout />} />
            <Route path="/notifications" element={<NotificationPage />} />
            <Route path="/mail" element={<MailPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/crm/dashboard" element={<CRMDashboard />} />
            <Route path="/crm/leads/all" element={<AllLeads />} />
            <Route path="/crm/leads/new" element={<NewLeads />} />
            <Route path="/crm/leads/assigned" element={<Assigned />} />
            <Route path="/crm/leads/not-connected" element={<NotConnectedLeads />} />
            <Route path="/crm/leads/follow-up" element={<FollowUpLeads />} />
            <Route path="/crm/leads/missed" element={<MissedLeads />} />
            <Route path="/crm/leads/dropped" element={<DroppedLeads />} />
            <Route path="/crm/leads/duplicates" element={<DuplicatesLeads />} />
            <Route path="/crm/leads/trending" element={<TrendingLeads />} />
            <Route path="/crm/leads/won" element={<WonLeads />} />
            <Route path="/crm/leads/trash" element={<TrashLeads />} />
            <Route path="/crm/leads/analysis" element={<Analysis />} />
            <Route path="/crm/leads/team-performance/:id" element={<EmployeePerformanceDetail />} />
            <Route path="/crm/leads/assignment-settings" element={<AssignmentSettings />} />
            <Route path="/crm/leads/lead-rules-config" element={<LeadRulesConfig />} />
            <Route path="/crm/leads/custom-fields" element={<CustomFieldsManager />} />
            <Route path="/crm/leads/profile/:id" element={<LeadProfile />} />
            <Route path="/crm/leads/add-notes" element={<AddNotes />} />
            <Route path="/crm/leads/dashboard" element={<LeadDashboard />} />
            <Route path="/crm/leads/work-station" element={<WorkStation />} />
            <Route
              path="/crm/leads/create-call-log"
              element={<CreateCallLogModal />}
            />
            <Route path="/crm/champions/lead" element={<Lead />} />
            <Route path="/crm/pipeline/manage" element={<ManagePipline />} />
            <Route path="/crm/pipeline/stages" element={<ManageStage />} />
            <Route path="/crm/pipeline/analytics" element={<Analytics />} />
            <Route path="/hrm/dashboard" element={<HrmDashboard />} />
            <Route path="/hrm/department" element={<AllDepartment />} />
            <Route path="/hrm/designation" element={<AllDesignation />} />
            <Route path="/hrm/shift" element={<ShiftManagement />} />
            <Route path="/hrm/terms" element={<AllTermCondition />} />
            <Route path="/hrm/employee/all" element={<AllEmployee />} />
            <Route path="/hrm/employee/add" element={<AddEmployee />} />
            <Route path="/hrm/employee/edit/:id" element={<EditEmployee />} />
            <Route path="/profile" element={<MyProfile />} />
            <Route path="/employee-profile/:id" element={<EmployeeProfile />} />
            <Route path="/hrm/attendance" element={<AllAttendance />} />
            <Route path="/hrm/attendance/employee" element={<EmployeeAttendance />} />
            <Route path="/hrm/attendance/records" element={<AttendanceRecords />} />
            <Route path="/hrm/attendance/settings" element={<ManageAttendance />} />
            <Route path="/hrm/attendance/manage" element={<ManageAttendance />} />
            <Route path="/hrm/leave/all" element={<AllLeave />} />
            <Route path="/hrm/leave/holiday" element={<Holiday />} />
            <Route path="/hrm/leave/manage" element={<ManageLeave />} />
            <Route path="/hrm/salary" element={<AllSalary />} />
            <Route path="/hrm/company-policy" element={<AllCompanyPolicy />} />
            <Route path="/hrm/hr-policy" element={<AllHRPolicy />} />
            <Route path="/hrm/job-management" element={<Job />} />
            <Route path="/hrm/applicants" element={<ApplicantList />} />
            <Route path="/hrm/offer-letters" element={<OfferLetterList />} />
            <Route path="/additional/notes" element={<AllNotes />} />
            <Route path="/additional/todo" element={<AllToDo />} />
            <Route path="/additional/expenses" element={<MyExpanses />} />
            <Route path="/additional/quotation" element={<AllQuotation />} />
            <Route path="/additional/invoice" element={<AllInvoice />} />
            <Route path="/additional/notification" element={<Notification />} />
            <Route path="/additional/announcement" element={<AllAnouncement />} />
            <Route path="/additional/announcement/category" element={<AnnouncementCategoryPage />} />
            <Route path="/additional/meeting" element={<AllMeetings />} />
            <Route path="/additional/visitor" element={<AllVisitors />} />
            <Route path="/crm/client/all" element={<ClientManagement />} />
            <Route path="/crm/client/profile/:id" element={<ClientProfile />} />
            <Route path="/settings/business-info" element={<BusinessInfo />} />
            <Route path="/settings/subscription" element={<ManageSubscription />} />
            <Route path="/settings/faq" element={<Faq />} />
            <Route path="/additional/messenger" element={<Messenger />} />
            <Route path="/crm/channel/form" element={<CRMFormPage />} />
            <Route path="/crm/channel/google-docs" element={<GoogleDocsPage />} />
            <Route path="/crm/channel/meta" element={<MetaIntegration />} />
            <Route path="/crm/channel/justdial" element={<JustdialIntegration />} />
            <Route path="/crm/channel/indiamart" element={<IndiamartIntegration />} />
            <Route path="/crm/channel/settings" element={<ChannelSettings />} />
            <Route path="/crm/goals" element={<GoalSetting />} />
            <Route path="/additional/catelogs" element={<Catelogs />} />


            <Route path="/additional/catalog-categories" element={<CatalogCategory />} />
            <Route path="/hrm/teams" element={<TeamManagement />} />

            {/* Super Admin Routes */}
            <Route element={<RoleProtectedRoute allowedRoles={['Super Admin']} />}>
              <Route path="/superadmin/dashboard" element={<SuperAdmin />} />
              <Route path="/superadmin/enterprises" element={<EnterpriseManagement />} />
              <Route path="/superadmin/enterprises/:id" element={<EnterpriseDetail />} />
              <Route path="/superadmin/subscriptions" element={<SubscriptionManagement />} />
              <Route path="/superadmin/productkeys" element={<ProductKeys />} />
              <Route path="/superadmin/plans" element={<PlanManagement />} />
              <Route path="/superadmin/paymentgateways" element={<PaymentGateways />} />
              <Route path="/superadmin/paymentgateways/Cashfree" element={<Cashfree />} />
              <Route path="/superadmin/paymentgateways/PhonePay" element={<PhonePay />} />
              <Route path="/superadmin/paymentgateways/Razorpay" element={<Razorpay />} />
              <Route path="/superadmin/wallet" element={<Wallet />} />
            </Route>
          </Route>
        </Route>
      </Routes>
      <LeadsReminder />
      <MeetingReminder />
      <TaskReminderPopup />
      <VisitorReminder />
      <GlobalModals />
    </Router>
  );
}

export default App;
