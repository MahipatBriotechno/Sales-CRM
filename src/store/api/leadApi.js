import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const leadApi = createApi({
    reducerPath: 'leadApi',
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_API_BASE_URL,
        prepareHeaders: (headers, { getState }) => {
            const token = getState().auth.token;
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: [
        'Lead',
        'LeadAssignmentSettings',
        'LeadAssignmentLogs',
        'LeadActivities',
        'LeadNotes',
        'LeadCalls',
        'LeadFiles',
        'LeadMeetings',
        'Campaign'
    ],
    endpoints: (builder) => ({
        getLeads: builder.query({
            query: ({
                page = 1, limit = 10, status = 'All', search = '', pipeline_id = '', tag = 'All', type = 'All',
                subview = 'All', priority = 'All', services = 'All', dateFrom = '', dateTo = '', name = '', mobile_number = ''
            }) => {
                let url = `leads?page=${page}&limit=${limit}`;
                if (status && status !== 'All') url += `&status=${status}`;
                if (search) url += `&search=${search}`;
                if (pipeline_id) url += `&pipeline_id=${pipeline_id}`;
                if (tag && tag !== 'All') url += `&tag=${tag}`;
                if (type && type !== 'All') url += `&type=${type}`;
                if (subview && subview !== 'All') url += `&subview=${subview}`;
                if (priority && priority !== 'All') url += `&priority=${priority}`;
                if (services && services !== 'All') url += `&services=${services}`;
                if (dateFrom) url += `&dateFrom=${dateFrom}`;
                if (dateTo) url += `&dateTo=${dateTo}`;
                if (name) url += `&name=${name}`;
                if (mobile_number) url += `&mobile_number=${mobile_number}`;
                return url;
            },
            transformResponse: (response) => {
                if (response.leads) {
                    response.leads = response.leads.map(lead => ({
                        ...lead,
                        phone: lead.mobile_number,
                        createdAt: new Date(lead.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                        }),
                        updatedAt: (lead.last_call_at || lead.updated_at || lead.created_at) ? new Date(lead.last_call_at || lead.updated_at || lead.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                        }) : null,
                        rawCreated: lead.created_at,
                        rawUpdated: lead.last_call_at || lead.updated_at || lead.created_at,
                        owner: lead.assigned_to
                    }));
                }
                return response;
            },
            providesTags: ['Lead'],
        }),
        getWatchTicker: builder.query({
            query: () => 'leads/watch-ticker',
            providesTags: ['Lead'],
        }),
        getLeadById: builder.query({
            query: (id) => `leads/${id}`,
            providesTags: (result, error, id) => [{ type: 'Lead', id }],
        }),
        createLead: builder.mutation({
            query: (data) => ({
                url: 'leads',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Lead'],
        }),
        bulkCreateLeads: builder.mutation({
            query: (data) => ({
                url: 'leads/bulk',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Lead'],
        }),
        updateLead: builder.mutation({
            query: ({ id, data }) => ({
                url: `leads/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => ['Lead', { type: 'Lead', id }, { type: 'LeadAssignmentLogs', id }, { type: 'LeadActivities', id }],
        }),
        deleteLead: builder.mutation({
            query: (id) => ({
                url: `leads/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Lead'],
        }),
        getTrashedLeads: builder.query({
            query: ({ page = 1, limit = 10, search = '' }) => `leads/trash/list?page=${page}&limit=${limit}&search=${search}`,
            providesTags: ['Lead'],
        }),
        permanentDeleteLead: builder.mutation({
            query: (id) => ({
                url: `leads/${id}/permanent`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Lead'],
        }),
        restoreLead: builder.mutation({
            query: (id) => ({
                url: `leads/${id}/restore`,
                method: 'POST',
            }),
            invalidatesTags: ['Lead'],
        }),
        hitCall: builder.mutation({
            query: ({ id, status, next_call_at, drop_reason, create_reminder, not_connected_reason, remarks, priority, duration }) => ({
                url: `leads/${id}/hit-call`,
                method: 'POST',
                body: { status, next_call_at, drop_reason, create_reminder, not_connected_reason, remarks, priority, duration },
            }),
            invalidatesTags: (result, error, { id }) => ['Lead', { type: 'Lead', id }, { type: 'LeadActivities', id }],
        }),
        analyzeLead: builder.mutation({
            query: (id) => ({
                url: `leads/${id}/analyze`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, id) => ['Lead', { type: 'Lead', id }, { type: 'LeadActivities', id }],
        }),
        checkCallConflict: builder.query({
            query: ({ dateTime, excludeId }) => `leads/check-call-conflict?dateTime=${dateTime}${excludeId ? `&excludeId=${excludeId}` : ''}`,
        }),
        getAssignmentSettings: builder.query({
            query: () => 'lead-assignment/settings',
            providesTags: ['LeadAssignmentSettings'],
        }),
        updateAssignmentSettings: builder.mutation({
            query: (data) => ({
                url: 'lead-assignment/settings',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['LeadAssignmentSettings'],
        }),
        getAssignmentLogs: builder.query({
            query: ({ page = 1, limit = 10 }) => `lead-assignment/logs?page=${page}&limit=${limit}`,
            providesTags: ['LeadAssignmentLogs'],
        }),
        manualAssignLeads: builder.mutation({
            query: (data) => ({
                url: 'lead-assignment/assign-manual',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: (result, error, { leadIds }) => [
                'Lead',
                'LeadAssignmentLogs',
                ...(leadIds || []).map(id => ({ type: 'LeadActivities', id }))
            ],
        }),
        getLeadNotes: builder.query({
            query: (id) => `leads/${id}/notes`,
            providesTags: (result, error, id) => [{ type: 'LeadNotes', id }],
        }),
        addLeadNote: builder.mutation({
            query: ({ id, data }) => ({
                url: `leads/${id}/notes`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'LeadNotes', id }, 'Lead', { type: 'LeadActivities', id }],
        }),
        getLeadCalls: builder.query({
            query: (id) => `leads/${id}/calls`,
            providesTags: (result, error, id) => [{ type: 'LeadCalls', id }],
        }),
        addLeadCall: builder.mutation({
            query: ({ id, data }) => ({
                url: `leads/${id}/calls`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'LeadCalls', id }, 'Lead', { type: 'LeadActivities', id }],
        }),
        getLeadFiles: builder.query({
            query: (id) => `leads/${id}/files`,
            providesTags: (result, error, id) => [{ type: 'LeadFiles', id }],
        }),
        addLeadFile: builder.mutation({
            query: ({ id, data }) => ({
                url: `leads/${id}/files`,
                method: 'POST',
                body: data, // Form data usually
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'LeadFiles', id }, 'Lead', { type: 'LeadActivities', id }],
        }),
        addLeadActivity: builder.mutation({
            query: ({ id, data }) => ({
                url: `leads/${id}/activities`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'LeadActivities', id }],
        }),
        getLeadActivities: builder.query({
            query: (id) => `leads/${id}/activities`,
            providesTags: (result, error, id) => [{ type: 'LeadActivities', id }],
        }),
        getLeadMeetings: builder.query({
            query: (id) => `leads/${id}/meetings`,
            providesTags: (result, error, id) => [{ type: 'LeadMeetings', id }],
        }),
        addLeadMeeting: builder.mutation({
            query: ({ id, data }) => ({
                url: `leads/${id}/meetings`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'LeadMeetings', id }, 'Lead', { type: 'LeadActivities', id }],
        }),
        updateLeadStatus: builder.mutation({
            query: ({ id, status, tag, drop_reason, remarks }) => ({
                url: `leads/${id}/status`,
                method: 'PUT',
                body: { status, tag, drop_reason, remarks },
            }),
            invalidatesTags: (result, error, { id }) => ['Lead', { type: 'Lead', id }, { type: 'LeadActivities', id }],
        }),
        // Update mutations
        updateLeadNote: builder.mutation({
            query: ({ leadId, noteId, data }) => ({
                url: `leads/${leadId}/notes/${noteId}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { leadId }) => [{ type: 'LeadNotes', id: leadId }, { type: 'LeadActivities', id: leadId }],
        }),
        addNoteComment: builder.mutation({
            query: ({ leadId, noteId, text }) => ({
                url: `leads/${leadId}/notes/${noteId}/comments`,
                method: 'POST',
                body: { text },
            }),
            invalidatesTags: (result, error, { leadId }) => [{ type: 'LeadNotes', id: leadId }, { type: 'LeadActivities', id: leadId }],
        }),
        updateLeadCall: builder.mutation({
            query: ({ leadId, callId, data }) => ({
                url: `leads/${leadId}/calls/${callId}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { leadId }) => [{ type: 'LeadCalls', id: leadId }, { type: 'LeadActivities', id: leadId }],
        }),
        updateLeadFile: builder.mutation({
            query: ({ leadId, fileId, data }) => ({
                url: `leads/${leadId}/files/${fileId}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { leadId }) => [{ type: 'LeadFiles', id: leadId }, { type: 'LeadActivities', id: leadId }],
        }),
        updateLeadMeeting: builder.mutation({
            query: ({ leadId, meetingId, data }) => ({
                url: `leads/${leadId}/meetings/${meetingId}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { leadId }) => [{ type: 'LeadMeetings', id: leadId }, { type: 'LeadActivities', id: leadId }],
        }),
        // Delete mutations
        deleteLeadNote: builder.mutation({
            query: ({ leadId, noteId }) => ({
                url: `leads/${leadId}/notes/${noteId}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, { leadId }) => [{ type: 'LeadNotes', id: leadId }, { type: 'LeadActivities', id: leadId }],
        }),
        deleteLeadCall: builder.mutation({
            query: ({ leadId, callId }) => ({
                url: `leads/${leadId}/calls/${callId}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, { leadId }) => [{ type: 'LeadCalls', id: leadId }, { type: 'LeadActivities', id: leadId }],
        }),
        deleteLeadFile: builder.mutation({
            query: ({ leadId, fileId }) => ({
                url: `leads/${leadId}/files/${fileId}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, { leadId }) => [{ type: 'LeadFiles', id: leadId }, { type: 'LeadActivities', id: leadId }],
        }),
        deleteLeadMeeting: builder.mutation({
            query: ({ leadId, meetingId }) => ({
                url: `leads/${leadId}/meetings/${meetingId}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, { leadId }) => [{ type: 'LeadMeetings', id: leadId }, { type: 'LeadActivities', id: leadId }],
        }),
        getLeadAnalysis: builder.query({
            query: () => 'leads/analysis',
            providesTags: ['Lead'],
        }),
        getLeadDashboard: builder.query({
            query: () => 'leads/dashboard',
            providesTags: ['Lead'],
        }),
        getEmployeePerformance: builder.query({
            query: (id) => `leads/employee-performance/${id}`,
            providesTags: (result, error, id) => ['Lead', { type: 'LeadActivities', id }],
        }),
        getLeadAssignmentHistory: builder.query({
            query: (id) => `leads/${id}/assignment-history`,
            providesTags: (result, error, id) => [{ type: 'LeadAssignmentLogs', id }],
        }),
        getDueReminders: builder.query({
            query: () => 'leads/due-reminders',
            providesTags: ['Lead'],
        }),
        getDueMeetings: builder.query({
            query: () => 'leads/due-meetings',
            providesTags: ['LeadMeetings'],
        }),
        snoozeLead: builder.mutation({
            query: ({ id, minutes }) => ({
                url: `leads/${id}/snooze`,
                method: 'POST',
                body: { minutes },
            }),
            invalidatesTags: (result, error, { id }) => ['Lead', { type: 'Lead', id }, { type: 'LeadActivities', id }],
        }),
        convertLeadToClient: builder.mutation({
            query: ({ id, data }) => ({
                url: `leads/${id}/convert`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => ['Lead', { type: 'Lead', id }, { type: 'LeadActivities', id }],
        }),
        getCampaigns: builder.query({
            query: () => 'campaigns',
            providesTags: ['Campaign'],
        }),
        createCampaign: builder.mutation({
            query: (data) => ({
                url: 'campaigns',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Campaign'],
        }),
        toggleCampaignStatus: builder.mutation({
            query: ({ id, status }) => ({
                url: `campaigns/${id}/status`,
                method: 'PATCH',
                body: { status },
            }),
            invalidatesTags: ['Campaign'],
        }),
        deleteCampaign: builder.mutation({
            query: (id) => ({
                url: `campaigns/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Campaign'],
        }),
        updateCampaign: builder.mutation({
            query: ({ id, data }) => ({
                url: `campaigns/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Campaign'],
        }),
    }),
});

export const {
    useGetLeadsQuery,
    useGetWatchTickerQuery,
    useGetLeadByIdQuery,
    useCreateLeadMutation,
    useBulkCreateLeadsMutation,
    useUpdateLeadMutation,
    useDeleteLeadMutation,
    useHitCallMutation,
    useAnalyzeLeadMutation,
    useGetAssignmentSettingsQuery,
    useUpdateAssignmentSettingsMutation,
    useGetAssignmentLogsQuery,
    useManualAssignLeadsMutation,
    useGetLeadNotesQuery,
    useAddLeadNoteMutation,
    useAddNoteCommentMutation,
    useGetLeadCallsQuery,
    useAddLeadCallMutation,
    useGetLeadFilesQuery,
    useAddLeadFileMutation,
    useGetLeadActivitiesQuery,
    useGetLeadMeetingsQuery,
    useAddLeadMeetingMutation,
    useUpdateLeadStatusMutation,
    useUpdateLeadNoteMutation,
    useUpdateLeadCallMutation,
    useUpdateLeadFileMutation,
    useUpdateLeadMeetingMutation,
    useDeleteLeadNoteMutation,
    useDeleteLeadCallMutation,
    useDeleteLeadFileMutation,
    useDeleteLeadMeetingMutation,
    useGetLeadAssignmentHistoryQuery,
    useGetEmployeePerformanceQuery,
    useGetLeadAnalysisQuery,
    useGetLeadDashboardQuery,
    useCheckCallConflictQuery,
    useGetDueRemindersQuery,
    useGetDueMeetingsQuery,
    useSnoozeLeadMutation,
    useConvertLeadToClientMutation,
    useAddLeadActivityMutation,
    useGetCampaignsQuery,
    useCreateCampaignMutation,
    useToggleCampaignStatusMutation,
    useDeleteCampaignMutation,
    useUpdateCampaignMutation,
    useGetTrashedLeadsQuery,
    usePermanentDeleteLeadMutation,
    useRestoreLeadMutation,
} = leadApi;
