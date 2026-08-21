import React, { useRef } from "react";
import {
    X, Download, Printer, Mail, User, Briefcase, Building2,
    Calendar, MapPin, DollarSign, Clock, ShieldCheck, FileText,
    CheckCircle2, Globe, Phone, FileSignature, Layout
} from "lucide-react";
import Modal from "../common/Modal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-hot-toast";
import html2pdf from "html2pdf.js";

const ViewOfferLetterModal = ({ isOpen, onClose, offer }) => {
    const printRef = useRef();

    if (!offer) return null;

    const handleDownload = async () => {
        const toastId = toast.loading("Generating PDF, please wait...");
        try {
            const element = printRef.current;
            if (!element) {
                toast.error("Failed to find document content.", { id: toastId });
                return;
            }

            const fileName = `Offer_Letter_${offer.candidate_details?.name?.replace(/\s+/g, '_') || 'Candidate'}.pdf`;

            const opt = {
                margin: [15, 15, 15, 15], // Top, Right, Bottom, Left margins
                filename: fileName,
                image: { type: 'jpeg', quality: 1 },
                html2canvas: { scale: 2, useCORS: true, scrollY: 0, windowWidth: element.scrollWidth },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            };

            await html2pdf().from(element).set(opt).toPdf().get('pdf').then((pdf) => {
                const totalPages = pdf.internal.getNumberOfPages();
                for (let i = 1; i <= totalPages; i++) {
                    pdf.setPage(i);
                    pdf.setDrawColor(15, 23, 42); // slate-900
                    pdf.setLineWidth(0.5);
                    // A4 size is 210 x 297 mm
                    // We draw the rect at 10mm from edge, width=190, height=277
                    pdf.rect(10, 10, 190, 277);
                }
            }).save();

            toast.success("Offer Letter downloaded!", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate PDF", { id: toastId });
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const getLogoSrc = () => {
        const logo_url = offer.company_info?.logo_url;
        if (logo_url) {
            if (logo_url.startsWith('http') || logo_url.startsWith('blob:') || logo_url.startsWith('data:')) {
                return logo_url;
            }
            const baseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api/', '');
            return `${baseUrl}${logo_url.startsWith('/') ? '' : '/'}${logo_url}`;
        }
        return null;
    };

    const sectionTitle = "text-sm font-bold text-gray-800 mb-4 flex items-center gap-2 border-l-4 border-orange-500 pl-3 font-primary";
    const labelClass = "text-xs font-semibold text-gray-500 block mb-1 font-primary";
    const valueClass = "text-sm font-bold text-gray-900 font-primary";

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Preview Offer Letter"
            maxWidth="max-w-5xl"
            cleanLayout={true}
            icon={<div className="bg-orange-500 p-2 rounded-xl text-white shadow-lg"><FileSignature size={22} /></div>}
            footer={
                <div className="flex justify-between items-center w-full bg-gray-50 px-6 py-3 border-t">
                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold capitalize border ${offer.status === 'Accepted' ? 'bg-green-50 text-green-600 border-green-200' :
                            offer.status === 'Sent' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                                'bg-gray-50 text-gray-600 border-gray-200'
                            }`}>
                            {offer.status || 'Draft'}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 capitalize font-primary">
                            Version {offer.version_number || 1}.0
                        </span>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-6 py-2 rounded-sm border border-gray-300 text-gray-700 font-bold hover:bg-white hover:shadow-sm transition-all text-sm focus:outline-none">
                            Close
                        </button>
                        <button
                            onClick={handleDownload}
                            className="px-8 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-sm flex items-center gap-2 font-bold shadow-[0_4px_15px_rgba(255,123,29,0.3)] hover:from-orange-600 hover:to-orange-700 transition-all text-sm focus:outline-none active:scale-95"
                        >
                            <Download size={18} />
                            Download PDF
                        </button>
                    </div>
                </div>
            }
        >
            <div className="flex flex-col h-[75vh]">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 bg-gray-200">
                    <div className="max-w-4xl mx-auto bg-white shadow-2xl border border-gray-300 rounded-sm overflow-hidden relative" ref={printRef}>
                        {/* Formal Inner Page Border */}
                        <div data-html2canvas-ignore="true" className="absolute inset-6 md:inset-8 border border-gray-900 pointer-events-none z-0"></div>

                        {/* A4 Paper Container */}
                        <div className="p-12 md:p-16 relative z-10">
                            {/* Watermark (optional) */}
                            {offer.output_control?.watermark && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0">
                                    <Building2 size={400} />
                                </div>
                            )}

                            {/* Header: Letterhead */}
                            {/* Header: Letterhead */}
                            <div className="flex justify-between items-start pb-6 mb-8 border-b-2 border-gray-800 relative z-10">
                                <div className="flex flex-col max-w-[60%]">
                                    {getLogoSrc() ? (
                                        <img src={getLogoSrc()} alt="Company Logo" className="h-16 w-auto object-contain mb-4" />
                                    ) : (
                                        <h1 className="text-2xl font-bold text-black tracking-tight mb-2">
                                            {offer.company_info?.name || "Company Name"}
                                        </h1>
                                    )}
                                    <p className="text-xs text-gray-800 leading-tight">{offer.company_info?.address}</p>
                                    {offer.company_info?.gst_cin && <p className="text-[10px] text-gray-600 mt-1">CIN/GST: {offer.company_info.gst_cin}</p>}
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <p className="text-[11px] font-bold tracking-widest text-black uppercase mb-4 border border-black px-2 py-1">Private & Confidential</p>
                                    <table className="text-sm text-left">
                                        <tbody>
                                            <tr>
                                                <td className="pr-3 text-gray-600 font-semibold">Ref:</td>
                                                <td className="font-bold text-black">{offer.reference_no}</td>
                                            </tr>
                                            <tr>
                                                <td className="pr-3 text-gray-600 font-semibold">Date:</td>
                                                <td className="font-bold text-black">{new Date(offer.offer_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Letter Body */}
                            <div className="space-y-5 text-black text-[14px] leading-relaxed font-sans relative z-10">
                                <div className="mb-6">
                                    <p className="mb-1">To,</p>
                                    <p className="font-bold text-[15px]">{offer.candidate_details?.name}</p>
                                    <p>{offer.candidate_details?.address}</p>
                                    <p>{offer.candidate_details?.email}</p>
                                    <p>{offer.candidate_details?.phone}</p>
                                </div>

                                <p className="font-bold text-[15px] underline underline-offset-2 mb-6">Subject: Offer of Employment</p>

                                <p>Dear <span className="font-bold">{offer.candidate_details?.name?.split(' ')[0] || 'Candidate'}</span>,</p>

                                <p className="text-justify">
                                    Following our recent discussions, we are pleased to offer you the position of <span className="font-bold">{offer.designation}</span> at <span className="font-bold">{offer.company_info?.name}</span>.
                                    We are confident that your skills and experience will be an ideal match for our team.
                                </p>

                                {/* Position Details Table */}
                                <div className="my-6">
                                    <p className="font-bold mb-2">1. Position & Assignment Details</p>
                                    <table className="w-full text-[13px] border-collapse border border-gray-400">
                                        <tbody>
                                            <tr>
                                                <th className="py-2 px-3 border border-gray-400 bg-gray-50 font-semibold w-[35%] text-left">Designation</th>
                                                <td className="py-2 px-3 border border-gray-400 font-bold">{offer.designation}</td>
                                            </tr>
                                            <tr>
                                                <th className="py-2 px-3 border border-gray-400 bg-gray-50 font-semibold text-left">Department</th>
                                                <td className="py-2 px-3 border border-gray-400">{offer.department}</td>
                                            </tr>
                                            <tr>
                                                <th className="py-2 px-3 border border-gray-400 bg-gray-50 font-semibold text-left">Date of Joining</th>
                                                <td className="py-2 px-3 border border-gray-400 font-bold">{new Date(offer.joining_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                            </tr>
                                            <tr>
                                                <th className="py-2 px-3 border border-gray-400 bg-gray-50 font-semibold text-left">Work Location</th>
                                                <td className="py-2 px-3 border border-gray-400">{offer.candidate_details?.location}</td>
                                            </tr>
                                            <tr>
                                                <th className="py-2 px-3 border border-gray-400 bg-gray-50 font-semibold text-left">Reporting To</th>
                                                <td className="py-2 px-3 border border-gray-400">{offer.candidate_details?.manager || "Department Head"}</td>
                                            </tr>
                                            <tr>
                                                <th className="py-2 px-3 border border-gray-400 bg-gray-50 font-semibold text-left">Working Hours</th>
                                                <td className="py-2 px-3 border border-gray-400">{offer.offer_details?.working_hours} ({offer.offer_details?.working_days})</td>
                                            </tr>
                                            <tr>
                                                <th className="py-2 px-3 border border-gray-400 bg-gray-50 font-semibold text-left">Probation Period</th>
                                                <td className="py-2 px-3 border border-gray-400">{offer.offer_details?.probation_duration} {offer.offer_details?.probation_unit}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Compensation Details */}
                                <div className="my-6">
                                    <p className="font-bold mb-2">2. Compensation & Benefits</p>
                                    <p className="mb-3 text-justify">
                                        Your Annual Cost to Company (CTC) will be <span className="font-bold">₹{Number(offer.annual_ctc || 0).toLocaleString('en-IN')}</span>.
                                        Your estimated monthly take-home salary will be approximately <span className="font-bold">₹{Number(offer.net_salary || 0).toLocaleString('en-IN')}</span>.
                                    </p>

                                    {offer.salary_model === 'Structured' && (
                                        <div className="mt-4 max-w-xl">
                                            <table className="w-full text-[13px] border-collapse border border-gray-400">
                                                <thead>
                                                    <tr>
                                                        <th className="py-2 px-3 border border-gray-400 bg-gray-200 font-bold text-left">Salary Component</th>
                                                        <th className="py-2 px-3 border border-gray-400 bg-gray-200 font-bold text-right">Monthly Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td className="py-2 px-3 border border-gray-400">Basic Salary</td>
                                                        <td className="py-2 px-3 border border-gray-400 text-right font-bold">₹{Number(offer.salary_structure?.basic || 0).toLocaleString()}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="py-2 px-3 border border-gray-400">House Rent Allowance (HRA)</td>
                                                        <td className="py-2 px-3 border border-gray-400 text-right font-bold">₹{Number(offer.salary_structure?.hra || 0).toLocaleString()}</td>
                                                    </tr>
                                                    {offer.salary_structure?.allowances?.map((allow, idx) => (
                                                        <tr key={idx}>
                                                            <td className="py-2 px-3 border border-gray-400">{allow.name}</td>
                                                            <td className="py-2 px-3 border border-gray-400 text-right font-bold">₹{Number(allow.amount || 0).toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                    <tr>
                                                        <th className="py-3 px-3 border border-gray-400 bg-gray-100 font-bold text-left uppercase text-xs">Gross Monthly Salary</th>
                                                        <th className="py-3 px-3 border border-gray-400 bg-gray-100 font-bold text-right text-[14px]">₹{Number(offer.salary_structure?.gross || 0).toLocaleString()}</th>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <p className="text-[11px] text-gray-600 italic mt-2 text-justify">
                                                Note: Standard statutory deductions (PF, ESI, TDS) will be applicable on the gross salary as per government regulations.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Terms and Conditions */}
                                <div className="my-6">
                                    <p className="font-bold mb-2">3. Terms & Conditions</p>
                                    <ul className="list-disc pl-5 space-y-2 text-[13px] text-justify">
                                        <li>{offer.legal_disclaimer?.statement || "This offer is contingent upon your successful completion of our standard background check and verification of the documents provided by you."}</li>
                                        {offer.documents_required?.length > 0 && (
                                            <li>Please bring the following documents on your date of joining: <span className="font-bold">{offer.documents_required.join(", ")}</span>.</li>
                                        )}
                                    </ul>
                                </div>

                                <p className="mt-8 mb-16 text-justify">
                                    Please sign and return the duplicate copy of this letter as a token of your acceptance.
                                    We look forward to welcoming you to the team and wish you a long and successful career with us.
                                </p>

                                {/* Signature Block */}
                                <div className="flex justify-between items-end mt-12">
                                    <div className="w-1/2">
                                        <p className="font-bold mb-12">For {offer.company_info?.name}</p>
                                        <div className="h-px w-48 bg-black mb-2"></div>
                                        <p className="font-bold">Authorized Signatory</p>
                                        <p className="text-xs text-gray-600">Human Resources</p>
                                    </div>

                                    <div className="w-1/2 flex flex-col items-end text-right">
                                        <p className="font-bold mb-12">Accepted & Agreed</p>
                                        <div className="h-px w-48 bg-black mb-2"></div>
                                        <p className="font-bold">{offer.candidate_details?.name}</p>
                                        <p className="text-xs text-gray-600">Date: _______________</p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-12 pt-6 border-t border-gray-300 text-center relative z-10 text-[10px] text-gray-600">
                                <p className="mb-1">
                                    {offer.company_info?.name} | {offer.company_info?.website} | {offer.company_info?.contact} | {offer.company_info?.email}
                                </p>
                                <p>{offer.output_control?.footer_note || "Strictly Confidential"}</p>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #FF7B1D; border-radius: 10px; }
                
                @media print {
                    body * { visibility: hidden; }
                    #print-area, #print-area * { visibility: visible; }
                    #print-area { position: absolute; left: 0; top: 0; width: 100%; }
                }

                .font-primary { font-family: 'Outfit', sans-serif; }
            `}</style>
        </Modal>
    );
};

export default ViewOfferLetterModal;
