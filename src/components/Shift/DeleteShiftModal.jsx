import React from "react";
import { AlertTriangle } from "lucide-react";
import { useDeleteShiftMutation } from "../../store/api/shiftApi";
import { toast } from "react-hot-toast";

export default function DeleteShiftModal({ shift, onClose }) {
  const [deleteShift, { isLoading }] = useDeleteShiftMutation();

  if (!shift) return null;

  const handleDelete = async () => {
    try {
      await deleteShift(shift.id).unwrap();
      toast.success("Shift deleted successfully");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.data?.message || "Failed to delete shift");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="text-red-500 w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Shift?</h2>
          <p className="text-gray-500 mb-6">
            Are you sure you want to delete the shift <span className="font-semibold text-gray-700">"{shift.shift_name}"</span>? 
            This action cannot be undone and may affect employees currently assigned to this shift.
          </p>
          <div className="flex w-full gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors font-medium flex items-center justify-center disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Delete Shift"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
