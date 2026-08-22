import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const employeeApi = createApi({
    reducerPath: 'employeeApi',
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
    tagTypes: ['Employee'],
    endpoints: (builder) => ({
        getEmployees: builder.query({
            query: ({ page = 1, limit = 10, status = 'All', search = '' } = {}) => {
                let url = `employees?page=${page}&limit=${limit}`;
                if (status !== 'All') {
                    url += `&status=${status}`;
                }
                if (search) {
                    url += `&search=${search}`;
                }
                return url;
            },
            transformResponse: (response) => {
                const baseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api/', '');
                if (response.employees) {
                    response.employees = response.employees.map(emp => ({
                        ...emp,
                        profile_picture_url: emp.profile_picture ? `${baseUrl}${emp.profile_picture}` : null,
                        aadhar_front_url: emp.aadhar_front ? `${baseUrl}${emp.aadhar_front}` : null,
                        aadhar_back_url: emp.aadhar_back ? `${baseUrl}${emp.aadhar_back}` : null,
                        pan_card_url: emp.pan_card ? `${baseUrl}${emp.pan_card}` : null,
                        cancelled_cheque_url: emp.cancelled_cheque ? `${baseUrl}${emp.cancelled_cheque}` : null,
                    }));
                }
                return response;
            },
            providesTags: ['Employee'],
        }),
        getEmployeeById: builder.query({
            query: (id) => `employees/${id}`,
            transformResponse: (response) => {
                const baseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api/', '');
                if (response.status && response.data) {
                    const emp = response.data;
                    response.data = {
                        ...emp,
                        profile_picture_url: emp.profile_picture ? `${baseUrl}${emp.profile_picture}` : null,
                        aadhar_front_url: emp.aadhar_front ? `${baseUrl}${emp.aadhar_front}` : null,
                        aadhar_back_url: emp.aadhar_back ? `${baseUrl}${emp.aadhar_back}` : null,
                        pan_card_url: emp.pan_card ? `${baseUrl}${emp.pan_card}` : null,
                        cancelled_cheque_url: emp.cancelled_cheque ? `${baseUrl}${emp.cancelled_cheque}` : null,
                    };
                }
                return response;
            },
            providesTags: (result, error, id) => [{ type: 'Employee', id }],
        }),
        createEmployee: builder.mutation({
            query: (formData) => ({
                url: 'employees',
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: ['Employee'],
        }),
        updateEmployee: builder.mutation({
            query: ({ id, formData }) => ({
                url: `employees/${id}`,
                method: 'PUT',
                body: formData,
            }),
            invalidatesTags: (result, error, { id }) => ['Employee', { type: 'Employee', id }],
        }),
        deleteEmployee: builder.mutation({
            query: (id) => ({
                url: `employees/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Employee'],
        }),
        checkEmployeeId: builder.mutation({
            query: ({ employeeId, excludeEmployeeId }) => ({
                url: 'employees/check-id',
                method: 'POST',
                body: { employeeId, excludeEmployeeId },
            }),
        }),
        checkContactAvailability: builder.mutation({
            query: ({ type, value, excludeEmployeeId }) => ({
                url: 'employees/check-contact',
                method: 'POST',
                body: { type, value, excludeEmployeeId },
            }),
        }),
        checkUsername: builder.mutation({
            query: ({ username, excludeEmployeeId }) => ({
                url: 'employees/check-username',
                method: 'POST',
                body: { username, excludeEmployeeId },
            }),
        }),
    }),
});

export const {
    useGetEmployeesQuery,
    useGetEmployeeByIdQuery,
    useCreateEmployeeMutation,
    useUpdateEmployeeMutation,
    useDeleteEmployeeMutation,
    useCheckEmployeeIdMutation,
    useCheckContactAvailabilityMutation,
    useCheckUsernameMutation,
} = employeeApi;
