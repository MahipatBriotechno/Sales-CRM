import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const integrationApi = createApi({
    reducerPath: 'integrationApi',
    baseQuery: fetchBaseQuery({
        // VITE_API_BASE_URL already ends with a slash (e.g., http://localhost:5000/api/)
        baseUrl: `${import.meta.env.VITE_API_BASE_URL}integrations/`,
        prepareHeaders: (headers, { getState }) => {
            const token = getState().auth.token;
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['CRMForm', 'GoogleSheet', 'SyncLog', 'ChannelConfig'],
    endpoints: (builder) => ({
        // CRM Forms
        getForms: builder.query({
            query: (params) => ({
                url: 'forms',
                params: {
                    page: params?.page || 1,
                    limit: params?.limit || 10,
                    search: params?.search || '',
                    status: params?.status === 'All' ? '' : params?.status
                }
            }),
            providesTags: ['CRMForm'],
        }),
        createForm: builder.mutation({
            query: (data) => ({
                url: 'forms',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['CRMForm'],
        }),
        updateForm: builder.mutation({
            query: ({ id, data }) => ({
                url: `forms/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['CRMForm'],
        }),
        deleteForm: builder.mutation({
            query: (id) => ({
                url: `forms/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['CRMForm', 'SyncLog'],
        }),

        // Google Sheets
        getSheetsConfigs: builder.query({
            query: (params) => ({
                url: 'sheets',
                params: {
                    page: params?.page || 1,
                    limit: params?.limit || 10,
                    search: params?.search || '',
                    sync_frequency: params?.sync_frequency === 'All' ? '' : params?.sync_frequency
                }
            }),
            providesTags: ['GoogleSheet'],
        }),
        createSheetConfig: builder.mutation({
            query: (data) => ({
                url: 'sheets',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['GoogleSheet'],
        }),
        updateSheetConfig: builder.mutation({
            query: ({ id, data }) => ({
                url: `sheets/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['GoogleSheet'],
        }),
        deleteSheetConfig: builder.mutation({
            query: (id) => ({
                url: `sheets/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['GoogleSheet'],
        }),
        syncSheet: builder.mutation({
            query: (id) => ({
                url: `sheets/${id}/sync`,
                method: 'POST',
            }),
            invalidatesTags: ['SyncLog'],
        }),

        // Generic Channels
        getChannelConfigs: builder.query({
            query: (type) => ({
                url: 'channels',
                params: { type }
            }),
            providesTags: ['ChannelConfig'],
        }),
        saveChannelConfig: builder.mutation({
            query: (data) => ({
                url: 'channels',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['ChannelConfig'],
        }),
        deleteChannelConfig: builder.mutation({
            query: (id) => ({
                url: `channels/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['ChannelConfig'],
        }),
        syncChannelLeads: builder.mutation({
            query: (id) => ({
                url: `channels/${id}/sync`,
                method: 'POST',
            }),
            invalidatesTags: ['SyncLog'],
        }),

        // Logs
        getLogs: builder.query({
            query: (params) => ({
                url: 'logs',
                params: {
                    page: params?.page || 1,
                    limit: params?.limit || 10,
                    channel_type: params?.channel_type || ''
                }
            }),
            providesTags: ['SyncLog'],
        }),

        // WhatsApp Specific
        getWhatsAppConfig: builder.query({
            query: () => 'whatsapp',
            providesTags: ['ChannelConfig'],
        }),
        saveWhatsAppConfig: builder.mutation({
            query: (data) => ({
                url: 'whatsapp',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['ChannelConfig'],
        }),
        sendWhatsAppTestMessage: builder.mutation({
            query: (data) => ({
                url: 'whatsapp/test',
                method: 'POST',
                body: data,
            }),
        }),
        getWhatsAppTemplates: builder.query({
            query: (configId) => ({
                url: 'whatsapp/templates',
                params: { configId }
            }),
            providesTags: ['ChannelConfig'],
        }),
        sendWhatsAppMessage: builder.mutation({
            query: (data) => ({
                url: 'whatsapp/send',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['SyncLog'],
        }),
    }),
});

export const {
    useGetFormsQuery,
    useCreateFormMutation,
    useUpdateFormMutation,
    useDeleteFormMutation,
    useGetSheetsConfigsQuery,
    useCreateSheetConfigMutation,
    useUpdateSheetConfigMutation,
    useDeleteSheetConfigMutation,
    useSyncSheetMutation,
    useGetChannelConfigsQuery,
    useSaveChannelConfigMutation,
    useDeleteChannelConfigMutation,
    useSyncChannelLeadsMutation,
    useGetLogsQuery,
    useGetWhatsAppConfigQuery,
    useSaveWhatsAppConfigMutation,
    useSendWhatsAppTestMessageMutation,
    useGetWhatsAppTemplatesQuery,
    useSendWhatsAppMessageMutation,
} = integrationApi;
