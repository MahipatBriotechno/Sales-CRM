import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const shiftApi = createApi({
    reducerPath: 'shiftApi',
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_API_BASE_URL,
        prepareHeaders: (headers) => {
            const token = localStorage.getItem('token');
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['Shift'],
    endpoints: (builder) => ({
        getShifts: builder.query({
            query: () => '/shifts',
            providesTags: ['Shift'],
        }),
        getShiftById: builder.query({
            query: (id) => `/shifts/${id}`,
            providesTags: (result, error, id) => [{ type: 'Shift', id }],
        }),
        addShift: builder.mutation({
            query: (shift) => ({
                url: '/shifts',
                method: 'POST',
                body: shift,
            }),
            invalidatesTags: ['Shift'],
        }),
        updateShift: builder.mutation({
            query: ({ id, ...patch }) => ({
                url: `/shifts/${id}`,
                method: 'PUT',
                body: patch,
            }),
            invalidatesTags: ['Shift'],
        }),
        deleteShift: builder.mutation({
            query: (id) => ({
                url: `/shifts/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Shift'],
        }),
    }),
});

export const {
    useGetShiftsQuery,
    useGetShiftByIdQuery,
    useAddShiftMutation,
    useUpdateShiftMutation,
    useDeleteShiftMutation
} = shiftApi;
