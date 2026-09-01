import { isRejectedWithValue } from '@reduxjs/toolkit';
import { logout } from '../slices/authSlice';
import toast from 'react-hot-toast';

export const authErrorMiddleware = (api) => (next) => (action) => {
    // Check if the action is a rejected RTK Query action
    if (isRejectedWithValue(action)) {
        // If the error status is 401 Unauthorized
        if (action.payload?.status === 401) {
            const state = api.getState();
            const isAuthEndpoint = action.meta?.arg?.endpointName === 'login' || action.meta?.arg?.endpointName === 'verifyOtp';
            
            // Only show session expired if we actually had a token and it wasn't a login attempt
            if (state.auth?.token && !isAuthEndpoint) {
                // Dispatch the logout action
                api.dispatch(logout());
                
                // Show a deduplicated toast notification to the user
                toast.error('Session expired. Please log in again.', {
                    id: 'session-expired-toast', // Prevent duplicate toasts
                });
            } else if (!state.auth?.token && !isAuthEndpoint) {
                // If they have no token and it's not a login attempt, just ensure they are logged out silently
                api.dispatch(logout());
            }
        }
    }
    return next(action);
};
