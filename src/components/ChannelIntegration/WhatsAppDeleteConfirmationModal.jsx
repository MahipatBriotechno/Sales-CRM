import React from "react";
import { AlertCircle, Trash2, RefreshCw } from "lucide-react";
import Modal from "../common/Modal";

const WhatsAppDeleteConfirmationModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    accountName, 
    isDeleting 
}) => {
    const footer = (
        <div className="flex gap-4 w-full">
            <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 font-bold rounded-sm hover:bg-gray-100 transition-all text-[10px] uppercase tracking-widest disabled:opacity-50 font-primary"
            >
                Cancel
            </button>
            <button
                type="button"
                onClick={onConfirm}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 bg-red-600 text-white font-bold rounded-sm hover:bg-red-700 transition-all shadow-lg hover:shadow-xl active:scale-95 text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 font-primary"
            >
                {isDeleting ? (
                    <RefreshCw size={16} className="animate-spin" />
                ) : (
                    <Trash2 size={16} />
                )}
                {isDeleting ? "DELETING..." : "DELETE NOW"}
            </button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            headerVariant="simple"
            maxWidth="max-w-md"
            footer={footer}
        >
            <div className="flex flex-col items-center text-center font-primary p-2">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <AlertCircle size={48} className="text-red-600 animate-pulse" />
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-3 uppercase tracking-tight">
                    Confirm Delete
                </h3>

                <p className="text-gray-600 mb-6 leading-relaxed font-semibold px-4">
                    Are you sure you want to delete <span className="text-red-600 font-black">"{accountName}"</span>? This will prevent any messages from being sent via this account.
                </p>

                <div className="w-full p-3 bg-red-50 border border-red-100 rounded-sm mb-2">
                    <p className="text-[10px] text-red-600 font-black uppercase tracking-widest flex items-center justify-center gap-2">
                        <AlertCircle size={14} />
                        Warning: Permanent Action
                    </p>
                </div>
            </div>
        </Modal>
    );
};

export default WhatsAppDeleteConfirmationModal;
