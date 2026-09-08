import React from "react";
import Modal from "../common/Modal";
import { QRCodeSVG } from "qrcode.react";
import { Smartphone, Phone, User, FileText, Wifi } from "lucide-react";

export default function CallQrModal({ isOpen, onClose, lead, onProceedToLog, onViewProfile }) {
    if (!lead) return null;

    const phoneNumber = lead.mobile_number || lead.phone;
    const dialerUrl = `tel:${phoneNumber}`;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Scan to Call"
            icon={<Smartphone size={20} className="text-[#FF7B1D]" />}
            maxWidth="max-w-3xl"
            cleanLayout={true}
        >
            {/*
              cleanLayout bypasses the modal body's overflow-y-auto + max-h-[70vh].
              We control height here: 100vh minus ~72px (orange header height).
              Both columns are flex + overflow-y-auto so they independently handle
              extreme overflow, but on normal screens nothing scrolls.
            */}
            <div
                className="flex flex-col md:flex-row w-full"
                style={{ maxHeight: 'calc(100vh - 72px)' }}
            >
                {/* ── LEFT: QR content ── */}
                <div className="flex-1 overflow-y-auto py-5 px-6 flex flex-col items-center text-center custom-scrollbar">

                    {/* QR Card */}
                    <div className="mb-4 bg-white border-2 border-orange-100 rounded-2xl shadow-sm overflow-hidden w-fit mx-auto">
                        <div className="bg-orange-50/60 border-b border-orange-100 py-2 px-6 flex items-center justify-center gap-3">
                            <span className="text-[11px] font-bold text-gray-400 capitalize tracking-widest">Call Hits :</span>
                            <span className="text-lg font-black text-[#FF7B1D] tracking-tight leading-none">{lead.call_count || 0}</span>
                        </div>
                        <div className="p-4">
                            {phoneNumber ? (
                                <QRCodeSVG
                                    value={dialerUrl}
                                    size={180}
                                    level="H"
                                    includeMargin={false}
                                    fgColor="#1a1a1a"
                                />
                            ) : (
                                <div className="w-[180px] h-[180px] flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                    <p className="text-gray-400 text-xs font-bold uppercase italic">No Phone Number Found</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Lead info + buttons */}
                    <div className="space-y-4 w-full px-2">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 truncate px-4" title={lead.name || lead.full_name}>
                                {lead.name || lead.full_name || "Lead Contact"}
                            </h3>
                            <p className="text-[#FF7B1D] font-bold text-sm tracking-widest mt-0.5">
                                {phoneNumber || "N/A"}
                            </p>
                        </div>

                        <div className="flex flex-col gap-2.5">
                            {/* Primary Action Buttons (Moved Up) */}
                            <div className="grid grid-cols-2 gap-2.5">
                                <button
                                    onClick={() => { if (onViewProfile) onViewProfile(); onClose(); }}
                                    className="py-2.5 rounded-sm font-bold transition shadow-md hover:shadow-lg bg-white border border-orange-200 text-gray-700 hover:bg-orange-50 flex items-center justify-center gap-2 active:scale-[0.98] capitalize font-primary text-sm group"
                                >
                                    <User size={15} className="text-[#FF7B1D] group-hover:scale-110 transition-transform" />
                                    View Profile
                                </button>
                                <button
                                    onClick={() => { if (onProceedToLog) onProceedToLog(); }}
                                    className="py-2.5 rounded-sm font-bold transition shadow-md hover:shadow-lg bg-orange-50 border border-orange-200 text-[#FF7B1D] hover:bg-orange-100/80 flex items-center justify-center gap-2 active:scale-[0.98] capitalize font-primary text-sm group"
                                >
                                    <FileText size={15} className="group-hover:scale-110 transition-transform" />
                                    Add Call Logs
                                </button>
                            </div>


                        </div>

                        <p className="text-[10px] text-gray-400 font-bold capitalize tracking-tight">
                            Click Above Options To Proceed With Lead Management
                        </p>
                    </div>
                </div>

                {/* ── RIGHT: How-to-scan animated panel ── */}
                <div className="w-full md:w-[268px] flex-shrink-0 bg-gradient-to-br from-orange-500 to-orange-600 flex flex-col items-center justify-center py-6 px-5 gap-5 relative overflow-hidden">

                    {/* Decorative circles */}
                    <div className="absolute top-[-40px] right-[-40px] w-40 h-40 rounded-full bg-white opacity-5 pointer-events-none" />
                    <div className="absolute bottom-[-30px] left-[-30px] w-32 h-32 rounded-full bg-white opacity-5 pointer-events-none" />

                    {/* Title */}
                    <div className="text-center">
                        <p className="text-white font-black text-sm uppercase tracking-widest font-primary">How to Scan</p>
                        <p className="text-orange-100 text-[11px] mt-1 font-medium">Point your phone camera at the QR code</p>
                    </div>

                    {/* Animated phone + QR illustration */}
                    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: 150, height: 160 }}>

                        {/* QR box (left) */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[62px] h-[62px] bg-white rounded-md flex items-center justify-center shadow-lg">
                            <div className="grid grid-cols-5 gap-[2px] p-1.5">
                                {[1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1].map((v, i) => (
                                    <div key={i} className={`w-[6px] h-[6px] rounded-[1px] ${v ? 'bg-gray-900' : 'bg-white'}`} />
                                ))}
                            </div>
                            <span className="absolute top-[3px] left-[3px] w-2.5 h-2.5 border-t-2 border-l-2 border-orange-500 rounded-tl" />
                            <span className="absolute top-[3px] right-[3px] w-2.5 h-2.5 border-t-2 border-r-2 border-orange-500 rounded-tr" />
                            <span className="absolute bottom-[3px] left-[3px] w-2.5 h-2.5 border-b-2 border-l-2 border-orange-500 rounded-bl" />
                            <span className="absolute bottom-[3px] right-[3px] w-2.5 h-2.5 border-b-2 border-r-2 border-orange-500 rounded-br" />
                            <span className="qr-scanline absolute left-0 right-0 h-[2px] bg-orange-400 rounded opacity-90 shadow-[0_0_6px_2px_rgba(251,146,60,0.7)]" />
                        </div>

                        {/* Signal dots */}
                        <div className="absolute left-[66px] top-1/2 -translate-y-1/2 flex items-center gap-[4px]">
                            {[0, 1, 2].map(i => (
                                <span key={i} className="signal-dot block w-[5px] h-[5px] rounded-full bg-white opacity-80" style={{ animationDelay: `${i * 0.2}s` }} />
                            ))}
                        </div>

                        {/* Phone (right) */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[58px] h-[100px] bg-gray-900 rounded-[13px] border-[3px] border-white shadow-xl flex flex-col items-center overflow-hidden">
                            <div className="w-4 h-[6px] bg-gray-700 rounded-b-full mt-1" />
                            <div className="flex-1 w-full bg-gray-800 mx-1 rounded-sm mt-1 mb-2 flex items-center justify-center overflow-hidden relative">
                                <div className="w-[32px] h-[32px] border border-orange-400 rounded-sm relative flex items-center justify-center">
                                    <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t-2 border-l-2 border-orange-400" />
                                    <span className="absolute top-0 right-0 w-1.5 h-1.5 border-t-2 border-r-2 border-orange-400" />
                                    <span className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b-2 border-l-2 border-orange-400" />
                                    <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b-2 border-r-2 border-orange-400" />
                                    <span className="phone-scanline absolute left-0 right-0 h-[1.5px] bg-orange-400 rounded shadow-[0_0_4px_1px_rgba(251,146,60,0.8)]" />
                                </div>
                                <span className="scan-flash absolute inset-0 bg-orange-400 opacity-0 rounded-sm" />
                            </div>
                            <div className="w-5 h-1 bg-gray-600 rounded-full mb-1" />
                        </div>
                    </div>

                    {/* Steps */}
                    <div className="flex flex-col gap-2.5 w-full">
                        {[
                            { step: "1", text: "Open Camera app on your phone" },
                            { step: "2", text: "Point it at the QR code on the left" },
                            { step: "3", text: "Tap the notification to start the call" },
                        ].map(({ step, text }) => (
                            <div key={step} className="flex items-start gap-2.5">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white text-orange-600 font-black text-[10px] flex items-center justify-center shadow">
                                    {step}
                                </span>
                                <p className="text-white text-[11px] font-medium leading-snug pt-0.5">{text}</p>
                            </div>
                        ))}
                    </div>

                    {/* Footer badge */}
                    <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1.5">
                        <Wifi size={11} className="text-orange-200" />
                        <span className="text-[10px] text-orange-100 font-semibold">Works with any camera app</span>
                    </div>

                    {/* Animations */}
                    <style>{`
                        .qr-scanline { animation: scanMove 2s ease-in-out infinite; }
                        .phone-scanline { animation: scanMove 2s ease-in-out infinite; animation-delay: 0.3s; }
                        @keyframes scanMove {
                            0%   { top: 10%; }
                            50%  { top: 85%; }
                            100% { top: 10%; }
                        }
                        .scan-flash { animation: flashPulse 2s ease-in-out infinite; animation-delay: 0.9s; }
                        @keyframes flashPulse {
                            0%, 80%, 100% { opacity: 0; }
                            90% { opacity: 0.18; }
                        }
                        .signal-dot { animation: dotPulse 1.2s ease-in-out infinite; }
                        @keyframes dotPulse {
                            0%, 100% { opacity: 0.2; transform: scale(0.8); }
                            50%      { opacity: 1;   transform: scale(1.2); }
                        }
                        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
                        .custom-scrollbar::-webkit-scrollbar-thumb { background: #f97316; border-radius: 10px; }
                    `}</style>
                </div>
            </div>
        </Modal>
    );
}
