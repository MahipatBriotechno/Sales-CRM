import React from "react";
import { Printer, FileText } from "lucide-react";
import Modal from "../../components/common/Modal";

export default function ViewQuotationModal({
  showViewModal,
  setShowViewModal,
  selectedQuote,
  getStatusColor,
  businessInfo,
}) {
  if (!showViewModal || !selectedQuote) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const footer = (
    <div className="flex gap-4 w-full">
      <button
        onClick={() => setShowViewModal(false)}
        className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-sm font-bold text-xs uppercase tracking-widest hover:bg-gray-50 transition-all"
      >
        Close
      </button>
      <button
        onClick={() => window.print()}
        className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-sm font-bold text-xs uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
      >
        <Printer size={18} /> Print Quotation
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={showViewModal}
      onClose={() => setShowViewModal(false)}
      title="View Quotation"
      icon={<FileText size={20} />}
      maxWidth="max-w-4xl"
      footer={footer}
      bodyClassName="p-0 bg-gray-50/50 flex flex-col items-center overflow-y-auto"
    >
      {/* A4 Container Wrapper for scrolling */}
      <div className="w-full py-8 px-4 flex justify-center">
        {/* A4 Document Area */}
        <div className="w-full max-w-[210mm] bg-white shadow-xl border border-gray-200" style={{ minHeight: '297mm' }}>
          <div className="p-10 sm:p-16 space-y-10 text-gray-800 font-primary">
            
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start border-b border-gray-200 pb-8 gap-6">
              <div className="space-y-1.5 flex-1">
                {businessInfo?.logo_url ? (
                  <img src={`${import.meta.env.VITE_API_BASE_URL.replace('/api/', '')}${businessInfo.logo_url}`} alt="Company Logo" className="h-16 w-auto object-contain mb-4" />
                ) : (
                  <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2 uppercase">
                    {businessInfo?.company_name || "Company Name"}
                  </h1>
                )}
                <p className="text-sm font-medium text-gray-500 leading-snug max-w-xs">{businessInfo?.address || "Company Address"}</p>
                <p className="text-sm font-medium text-gray-500">{businessInfo?.email || "email@example.com"} | {businessInfo?.phone || "+1234567890"}</p>
                {businessInfo?.gstin && <p className="text-sm font-bold text-gray-700 mt-2">GSTIN: {businessInfo?.gstin}</p>}
              </div>

              <div className="text-left sm:text-right space-y-1.5 shrink-0">
                <h2 className="text-4xl font-black text-gray-200 tracking-widest uppercase mb-4">Quotation</h2>
                <p className="text-sm font-bold"><span className="text-gray-400 mr-2 uppercase tracking-widest text-[10px]">Quote No:</span> {selectedQuote.quotation_id || selectedQuote.id}</p>
                <p className="text-sm font-bold"><span className="text-gray-400 mr-2 uppercase tracking-widest text-[10px]">Date:</span> {formatDate(selectedQuote.quotation_date)}</p>
                <p className="text-sm font-bold"><span className="text-gray-400 mr-2 uppercase tracking-widest text-[10px]">Valid Until:</span> {formatDate(selectedQuote.valid_until)}</p>
                <div className="pt-3">
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-sm border inline-block ${getStatusColor(selectedQuote.status)}`}>
                    {selectedQuote.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Bill To Area */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pb-4">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Quotation For</p>
                <h3 className="text-lg font-bold text-gray-900 uppercase">{selectedQuote.company_name || selectedQuote.contact_person || "Client"}</h3>
                {selectedQuote.customer_type !== 'Individual' && selectedQuote.contact_person && (
                  <p className="text-sm text-gray-700 font-bold mt-1">Attn: {selectedQuote.contact_person}</p>
                )}
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">{selectedQuote.billing_address}</p>
                <p className="text-sm text-gray-600 font-semibold">{selectedQuote.state} {selectedQuote.pincode}</p>
                <p className="text-sm text-gray-600 mt-2 font-medium">{selectedQuote.phone} | {selectedQuote.email}</p>
              </div>
              
              {(selectedQuote.gstin || selectedQuote.pan_number || selectedQuote.cin_number) && (
                <div className="bg-gray-50/50 p-5 rounded-sm border border-gray-100 h-fit">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Tax Information</p>
                  <div className="space-y-3">
                    {selectedQuote.gstin && <p className="text-sm flex justify-between"><span className="text-gray-500 font-medium text-xs uppercase">GSTIN:</span> <span className="font-bold">{selectedQuote.gstin}</span></p>}
                    {selectedQuote.pan_number && <p className="text-sm flex justify-between"><span className="text-gray-500 font-medium text-xs uppercase">PAN:</span> <span className="font-bold">{selectedQuote.pan_number}</span></p>}
                    {selectedQuote.cin_number && <p className="text-sm flex justify-between"><span className="text-gray-500 font-medium text-xs uppercase">CIN/MSME:</span> <span className="font-bold">{selectedQuote.cin_number}</span></p>}
                  </div>
                </div>
              )}
            </div>

            {/* Line Items Table */}
            <div className="mt-8">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-800 text-gray-800">
                    <th className="py-3 px-2 text-[10px] font-black uppercase tracking-widest w-12">#</th>
                    <th className="py-3 px-2 text-[10px] font-black uppercase tracking-widest">Description</th>
                    <th className="py-3 px-2 text-[10px] font-black uppercase tracking-widest text-center w-24">Qty</th>
                    <th className="py-3 px-2 text-[10px] font-black uppercase tracking-widest text-right w-32">Rate</th>
                    <th className="py-3 px-2 text-[10px] font-black uppercase tracking-widest text-right w-36">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(selectedQuote.line_items || []).map((item, index) => (
                    <tr key={index} className="text-sm group hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-2 text-gray-400 font-bold text-xs">{String(index + 1).padStart(2, '0')}</td>
                      <td className="py-4 px-2 font-bold text-gray-800">
                        {item.name}
                        {item.sku && <div className="text-[10px] text-gray-400 mt-0.5 font-normal tracking-widest uppercase">SKU: {item.sku}</div>}
                      </td>
                      <td className="py-4 px-2 text-center text-gray-600 font-medium">{item.qty}</td>
                      <td className="py-4 px-2 text-right text-gray-600 font-medium">{selectedQuote.currency} {Number(item.rate).toLocaleString()}</td>
                      <td className="py-4 px-2 text-right font-black text-gray-900">{selectedQuote.currency} {Number(item.total).toLocaleString()}</td>
                    </tr>
                  ))}
                  {(!selectedQuote.line_items || selectedQuote.line_items.length === 0) && (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-gray-400 italic">No line items added.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end pt-8">
              <div className="w-80 space-y-3 bg-gray-50 p-6 rounded-sm border border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Subtotal</span>
                  <span className="font-bold text-gray-900">{selectedQuote.currency} {(selectedQuote.subtotal || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Tax ({selectedQuote.tax || 0}%)</span>
                  <span className="font-bold text-gray-900">{selectedQuote.currency} {(((selectedQuote.subtotal || 0) * (selectedQuote.tax || 0)) / 100).toLocaleString()}</span>
                </div>
                {selectedQuote.discount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span className="font-bold uppercase tracking-widest text-[10px]">Discount</span>
                    <span className="font-bold">-{selectedQuote.currency} {(selectedQuote.discount || 0).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-4 border-t-2 border-gray-800 mt-2">
                  <span className="font-black uppercase tracking-widest text-[12px] text-gray-800">Grand Total</span>
                  <span className="font-black text-2xl text-orange-600">{selectedQuote.currency} {(selectedQuote.total_amount || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Terms & Conditions / Notes */}
            {(selectedQuote.terms_and_conditions || selectedQuote.notes) && (
              <div className="pt-12 border-t border-gray-100">
                <h4 className="text-[11px] font-black text-gray-800 uppercase tracking-widest mb-5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                  Terms & Conditions
                </h4>
                <ul className="list-decimal pl-5 space-y-2.5 text-xs text-gray-600 font-medium">
                  {(selectedQuote.terms_and_conditions || selectedQuote.notes).split('\n').filter(line => line.trim()).map((line, idx) => {
                    const cleanedLine = line.replace(/^[0-9.-]+\s*/, '').trim(); // Remove leading numbers if user typed them
                    return <li key={idx} className="pl-2 leading-relaxed">{cleanedLine}</li>;
                  })}
                </ul>
              </div>
            )}
            
            {/* Executive & Sign off */}
            <div className="pt-20 flex justify-between items-end pb-8">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Prepared By</p>
                <p className="text-sm font-black text-gray-800 mt-1 uppercase">{selectedQuote.sales_executive || "Sales Executive"}</p>
              </div>
              <div className="text-center">
                <div className="w-48 border-b-2 border-gray-300 mb-2"></div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Authorized Signature</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Modal>
  );
}
