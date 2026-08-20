import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import { limitErrorMiddleware } from './middleware/limitErrorMiddleware';
import { authApi } from './api/authApi';
import { businessApi } from './api/businessApi';
import { departmentApi } from './api/departmentApi';
import { designationApi } from './api/designationApi';
import { employeeApi } from './api/employeeApi';
import { teamApi } from './api/teamApi';
import { leaveApi } from './api/leaveApi';
import { jobApi } from './api/jobApi';
import { companyPolicyApi } from './api/companyPolicyApi';
import { hrPolicyApi } from './api/hrPolicyApi';
import { termApi } from './api/termApi';
import { hrmDashboardApi } from './api/hrmDashboardApi';
import { salaryApi } from './api/salaryApi';
import { userApi } from './api/userApi';
import { catalogApi } from './api/catalogApi';
import { catalogCategoryApi } from './api/catalogCategoryApi';
import { noteApi } from './api/noteApi';
import { taskApi } from './api/taskApi';
import { quotationApi } from './api/quotationApi';
import { expenseApi } from './api/expenseApi';
import { announcementApi } from './api/announcementApi';
import { announcementCategoryApi } from './api/announcementCategoryApi';
import { attendanceApi } from './api/attendanceApi';
import { clientApi } from './api/clientApi';
import { invoiceApi } from './api/invoiceApi';
import { pipelineApi } from './api/pipelineApi';
import { leadApi } from './api/leadApi';
import { stageApi } from './api/stageApi';
import { enterpriseApi } from './api/enterpriseApi';
import { subscriptionApi } from './api/subscriptionApi';
import { productKeyApi } from './api/productKeyApi';
import { planApi } from './api/planApi';
import { crmDashboardApi } from './api/crmDashboardApi';
import { mainDashboardApi } from './api/mainDashboardApi';
import { offerLetterApi } from './api/offerLetterApi';
import { applicantApi } from './api/applicantApi';
import { integrationApi } from './api/integrationApi';
import { goalApi } from './api/goalApi';
import { visitorApi } from './api/visitorApi';
import { meetingApi } from './api/meetingApi';
import { walletApi } from './api/walletApi';
import { superAdminApi } from './api/superAdminApi';
import { shiftApi } from './api/shiftApi';



export const store = configureStore({
    reducer: {
        auth: authReducer,
        ui: uiReducer,
        [authApi.reducerPath]: authApi.reducer,
        [businessApi.reducerPath]: businessApi.reducer,
        [departmentApi.reducerPath]: departmentApi.reducer,
        [designationApi.reducerPath]: designationApi.reducer,
        [employeeApi.reducerPath]: employeeApi.reducer,
        [teamApi.reducerPath]: teamApi.reducer,
        [leaveApi.reducerPath]: leaveApi.reducer,
        [jobApi.reducerPath]: jobApi.reducer,
        [companyPolicyApi.reducerPath]: companyPolicyApi.reducer,
        [hrPolicyApi.reducerPath]: hrPolicyApi.reducer,
        [termApi.reducerPath]: termApi.reducer,
        [hrmDashboardApi.reducerPath]: hrmDashboardApi.reducer,
        [salaryApi.reducerPath]: salaryApi.reducer,
        [userApi.reducerPath]: userApi.reducer,
        [catalogApi.reducerPath]: catalogApi.reducer,
        [catalogCategoryApi.reducerPath]: catalogCategoryApi.reducer,
        [noteApi.reducerPath]: noteApi.reducer,
        [taskApi.reducerPath]: taskApi.reducer,
        [quotationApi.reducerPath]: quotationApi.reducer,
        [expenseApi.reducerPath]: expenseApi.reducer,
        [announcementApi.reducerPath]: announcementApi.reducer,
        [announcementCategoryApi.reducerPath]: announcementCategoryApi.reducer,
        [attendanceApi.reducerPath]: attendanceApi.reducer,
        [clientApi.reducerPath]: clientApi.reducer,
        [invoiceApi.reducerPath]: invoiceApi.reducer,
        [pipelineApi.reducerPath]: pipelineApi.reducer,
        [leadApi.reducerPath]: leadApi.reducer,
        [stageApi.reducerPath]: stageApi.reducer,
        [enterpriseApi.reducerPath]: enterpriseApi.reducer,
        [subscriptionApi.reducerPath]: subscriptionApi.reducer,
        [productKeyApi.reducerPath]: productKeyApi.reducer,
        [planApi.reducerPath]: planApi.reducer,
        [crmDashboardApi.reducerPath]: crmDashboardApi.reducer,
        [mainDashboardApi.reducerPath]: mainDashboardApi.reducer,
        [offerLetterApi.reducerPath]: offerLetterApi.reducer,
        [applicantApi.reducerPath]: applicantApi.reducer,
        [integrationApi.reducerPath]: integrationApi.reducer,
        [goalApi.reducerPath]: goalApi.reducer,
        [visitorApi.reducerPath]: visitorApi.reducer,
        [meetingApi.reducerPath]: meetingApi.reducer,
        [walletApi.reducerPath]: walletApi.reducer,
        [superAdminApi.reducerPath]: superAdminApi.reducer,
        [shiftApi.reducerPath]: shiftApi.reducer,



    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(
            authApi.middleware,
            businessApi.middleware,
            departmentApi.middleware,
            designationApi.middleware,
            employeeApi.middleware,
            teamApi.middleware,
            leaveApi.middleware,
            jobApi.middleware,
            companyPolicyApi.middleware,
            hrPolicyApi.middleware,
            termApi.middleware,
            hrmDashboardApi.middleware,
            salaryApi.middleware,
            userApi.middleware,
            catalogApi.middleware,
            catalogCategoryApi.middleware,
            noteApi.middleware,
            taskApi.middleware,
            quotationApi.middleware,
            expenseApi.middleware,
            announcementApi.middleware,
            announcementCategoryApi.middleware,
            attendanceApi.middleware,
            clientApi.middleware,
            invoiceApi.middleware,
            pipelineApi.middleware,
            leadApi.middleware,
            stageApi.middleware,
            enterpriseApi.middleware,
            subscriptionApi.middleware,
            productKeyApi.middleware,
            planApi.middleware,
            crmDashboardApi.middleware,
            mainDashboardApi.middleware,
            offerLetterApi.middleware,
            applicantApi.middleware,
            integrationApi.middleware,
            goalApi.middleware,
            visitorApi.middleware,
            meetingApi.middleware,
            walletApi.middleware,
            superAdminApi.middleware,
            shiftApi.middleware,
            limitErrorMiddleware

        ),
});
