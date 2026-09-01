import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const attendanceApi = createApi({
    reducerPath: 'attendanceApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/attendance`,
        prepareHeaders: (headers, { getState }) => {
            const token = getState().auth.token;
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['Attendance', 'AttendanceSettings'],
    endpoints: (builder) => ({
        markAttendance: builder.mutation({
            query: (attendanceData) => ({
                url: '/mark',
                method: 'POST',
                body: attendanceData,
            }),
            invalidatesTags: ['Attendance'],
        }),
        checkOut: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/checkout/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Attendance'],
        }),
        startBreak: builder.mutation({
            query: (id) => ({
                url: `/break/start/${id}`,
                method: 'POST',
            }),
            invalidatesTags: ['Attendance'],
        }),
        endBreak: builder.mutation({
            query: (id) => ({
                url: `/break/end/${id}`,
                method: 'PUT',
            }),
            invalidatesTags: ['Attendance'],
        }),
        getAllAttendance: builder.query({
            query: (params) => ({
                url: '/all',
                params,
            }),
            providesTags: ['Attendance'],
        }),
        getEmployeeAttendance: builder.query({
            query: (employeeId) => `/employee/${employeeId}`,
            providesTags: ['Attendance'],
        }),
        getDashboardStats: builder.query({
            query: () => '/stats',
            providesTags: ['Attendance'],
        }),
        updateAttendance: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Attendance'],
        }),
        deleteAttendance: builder.mutation({
            query: (id) => ({
                url: `/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Attendance'],
        }),
        getAttendanceSettings: builder.query({
            query: () => '/settings',
            providesTags: ['AttendanceSettings'],
        }),
        updateAttendanceSettings: builder.mutation({
            query: (data) => ({
                url: '/settings',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['AttendanceSettings'],
        }),
    }),
});

export const {
    useMarkAttendanceMutation,
    useCheckOutMutation,
    useGetAllAttendanceQuery,
    useGetEmployeeAttendanceQuery,
    useGetDashboardStatsQuery,
    useUpdateAttendanceMutation,
    useDeleteAttendanceMutation,
    useGetAttendanceSettingsQuery,
    useUpdateAttendanceSettingsMutation,
    useStartBreakMutation,
    useEndBreakMutation,
} = attendanceApi;
