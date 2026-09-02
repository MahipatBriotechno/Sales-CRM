import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../store/slices/authSlice";
import { authApi } from "../store/api/authApi";
import { businessApi } from "../store/api/businessApi";
import { X, AlertCircle, LogOut } from "lucide-react";

export default function LogoutPopup({ onClose }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoggedOut, setIsLoggedOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      // Reset RTK Query cache for all APIs
      dispatch(authApi.util.resetApiState());
      dispatch(businessApi.util.resetApiState());

      // Simulate logout API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setIsLoggingOut(false);
      setIsLoggedOut(true);

      // Wait for success animation to play before clearing auth state
      setTimeout(() => {
        // Dispatch logout action to clear state and local storage
        dispatch(logout());
        // ProtectedRoute will automatically redirect to /login
      }, 1500);
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
      dispatch(logout());
    }
  };

  const handleCancel = () => {
    if (onClose) {
      onClose();
    }
    navigate("/dashboard");
  };

  return (
    <div className="fixed inset-0  bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative transform transition-all animate-scaleIn">
        {/* Close Button */}
        {!isLoggingOut && !isLoggedOut && (
          <button
            onClick={handleCancel}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        )}

        {!isLoggedOut ? (
          <>
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-br from-red-100 to-pink-100 p-5 rounded-full">
                <AlertCircle className="text-red-500" size={48} />
              </div>
            </div>

            {/* Content */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                Confirm Logout
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Are you sure you want to logout? You'll need to login again to
                access your account.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleCancel}
                disabled={isLoggingOut}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-red-600 hover:to-orange-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform  disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoggingOut ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Logging out...
                  </>
                ) : (
                  <>
                    <LogOut size={20} />
                    Logout
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Success State */}
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-5 rounded-full animate-successPulse">
                <svg
                  className="text-green-500"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    d="M20 6L9 17l-5-5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                Logged Out Successfully!
              </h2>
              <p className="text-gray-600">Redirecting to login page...</p>
              <div className="mt-4 flex justify-center">
                <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full animate-progress"></div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes successPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }

        .animate-successPulse {
          animation: successPulse 0.5s ease-out;
        }

        .animate-progress {
          animation: progress 1.5s ease-out;
        }
      `}</style>
    </div>
  );
}
