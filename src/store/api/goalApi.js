import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const goalApi = createApi({
    reducerPath: 'goalApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_API_BASE_URL}goals/`,
        prepareHeaders: (headers, { getState }) => {
            const token = getState().auth.token;
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['Goal'],
    endpoints: (builder) => ({
        getGoals: builder.query({
            query: (employeeId) => (employeeId ? `?employeeId=${employeeId}` : ""),
            providesTags: ['Goal'],
        }),
        getMyActiveGoals: builder.query({
            query: (employeeId) => `my-goals?emp=${employeeId}`,
            providesTags: ['Goal'],
        }),
        getGoalDetails: builder.query({
            query: (id) => `${id}`,
            providesTags: ['Goal'],
        }),
        createGoal: builder.mutation({
            query: (data) => ({
                url: '/',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Goal'],
        }),
        updateGoal: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Goal'],
        }),
        deleteGoal: builder.mutation({
            query: (id) => ({
                url: `${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Goal'],
        }),
    }),
});

export const {
    useGetGoalsQuery,
    useGetMyActiveGoalsQuery,
    useGetGoalDetailsQuery,
    useCreateGoalMutation,
    useUpdateGoalMutation,
    useDeleteGoalMutation,
} = goalApi;
