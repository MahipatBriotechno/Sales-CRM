import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const applicantApi = createApi({
    reducerPath: 'applicantApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_API_BASE_URL}`,
        prepareHeaders: (headers, { getState }) => {
            const token = getState().auth.token;
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['Applicant'],
    endpoints: (builder) => ({
        getApplicants: builder.query({
            query: ({ page = 1, limit = 10, search = '', status = 'All', job_id = '' }) => {
                let url = `applicants?page=${page}&limit=${limit}`;
                if (search) url += `&search=${search}`;
                if (status !== 'All') url += `&status=${status}`;
                if (job_id && job_id !== 'All') url += `&job_id=${job_id}`;
                return url;
            },
            providesTags: ['Applicant'],
        }),
        getApplicantById: builder.query({
            query: (id) => `applicants/${id}`,
            providesTags: (result, error, id) => [{ type: 'Applicant', id }],
        }),
        getApplicantStats: builder.query({
            query: () => 'applicants/stats',
            providesTags: ['Applicant'],
        }),
        updateApplicantStatus: builder.mutation({
            query: ({ id, ...statusData }) => ({
                url: `applicants/${id}/status`,
                method: 'PUT',
                body: statusData,
            }),
            invalidatesTags: (result, error, { id }) => ['Applicant', { type: 'Applicant', id }],
        }),
        deleteApplicant: builder.mutation({
            query: (id) => ({
                url: `applicants/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Applicant'],
        }),
        // Public endpoints
        getPublicJobDetails: builder.query({
            query: (link) => `applicants/public/job/${link}`,
        }),
        submitApplication: builder.mutation({
            query: ({ link, formData }) => ({
                url: `applicants/public/apply/${link}`,
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: ['Applicant'],
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;
                    // Invalidate jobApi's 'Job' tag to update applicant counts
                    const { jobApi } = await import('./jobApi');
                    dispatch(jobApi.util.invalidateTags(['Job']));
                } catch (error) {
                    // Fail silently or handle error
                }
            }
        }),
    }),
});

export const {
    useGetApplicantsQuery,
    useGetApplicantByIdQuery,
    useGetApplicantStatsQuery,
    useUpdateApplicantStatusMutation,
    useDeleteApplicantMutation,
    useGetPublicJobDetailsQuery,
    useSubmitApplicationMutation,
} = applicantApi;
