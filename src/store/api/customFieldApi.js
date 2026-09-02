import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const customFieldApi = createApi({
  reducerPath: "customFieldApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_BASE_URL}/api`,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["CustomField"],
  endpoints: (builder) => ({
    getCustomFields: builder.query({
      query: (module = "leads") => `/custom-fields/${module}`,
      providesTags: ["CustomField"],
    }),
    createCustomField: builder.mutation({
      query: (data) => ({
        url: "/custom-fields",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["CustomField"],
    }),
    updateCustomField: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/custom-fields/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["CustomField"],
    }),
    deleteCustomField: builder.mutation({
      query: (id) => ({
        url: `/custom-fields/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["CustomField"],
    }),
  }),
});

export const {
  useGetCustomFieldsQuery,
  useCreateCustomFieldMutation,
  useUpdateCustomFieldMutation,
  useDeleteCustomFieldMutation,
} = customFieldApi;
