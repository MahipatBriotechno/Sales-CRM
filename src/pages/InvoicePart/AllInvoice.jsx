import React, { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "react-router-dom";
import * as XLSX from "xlsx";
import DashboardLayout from "../../components/DashboardLayout";
import {
  Plus,
  Download,
  Eye,
  Trash2,
  FileText,
  Search,
  CheckCircle,
  DollarSign,
  Edit,
  CreditCard,
  Calendar,
  X,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Building2,
  User,
  ArrowUpDown,
  Printer,
  FileSpreadsheet,
  RefreshCw,
  Hash,
  Receipt,
  Edit2
} from "lucide-react";
import { FiHome } from "react-icons/fi";

import CreateInvoiceModal from "./CreateInvoiceModal";
import ViewInvoiceModal from "./ViewInvoiceModal";
import NumberCard from "../../components/NumberCard";
import Modal from "../../components/common/Modal";
import ActionGuard from "../../components/common/ActionGuard";
import {
  useGetInvoicesQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation
} from "../../store/api/invoiceApi";
import { toast } from "react-hot-toast";
import DeleteInvoiceModal from "./DeleteInvoiceModal";

export default function AllInvoicePage() {
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPartialModal, setShowPartialModal] = useState(false);
  const [partialAmount, setPartialAmount] = useState("");
  const [invoiceForPartial, setInvoiceForPartial] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [dateFilter, setDateFilter] = useState("All");
  const [filterCustomerType, setFilterCustomerType] = useState("all");
  const [filterTaxType, setFilterTaxType] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [clientIdFilter, setClientIdFilter] = useState(location.state?.client?.id || null);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);

  const [tempStatus, setTempStatus] = useState("all");
  const [tempCustomerType, setTempCustomerType] = useState("all");
  const [tempTaxType, setTempTaxType] = useState("all");
  const [tempDateFilter, setTempDateFilter] = useState("All");
  const [tempCustomStart, setTempCustomStart] = useState("");
  const [tempCustomEnd, setTempCustomEnd] = useState("");

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const dateDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    invoiceNo: "",
    clientName: "",
    email: "",
    phone: "",
    address: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    lineItems: [],
    subtotal: 0,
    tax: 0,
    discount: 0,
    totalAmount: 0,
    paidAmount: 0,
    balanceAmount: 0,
    status: "Draft",
    notes: "",
    tax_type: "GST",
    client_gstin: "",
    business_gstin: "",
    pan_number: "",
    terms_and_conditions: "",
    customer_type: "Business",
    pincode: "",
    contact_person: "",
    state: ""
  });

  const [createInvoice] = useCreateInvoiceMutation();
  const [updateInvoice] = useUpdateInvoiceMutation();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateInvoice = async () => {
    try {
      if (!formData.clientName || !formData.invoiceNo || !formData.invoiceDate) {
        toast.error("Please fill in all required fields");
        return;
      }

      const payload = {
        invoice_number: formData.invoiceNo,
        client_id: formData.clientId,
        client_name: formData.clientName,
        client_email: formData.email,
        client_phone: formData.phone,
        client_address: formData.address,
        invoice_date: formData.invoiceDate,
        due_date: formData.dueDate,
        items: formData.lineItems,
        subtotal: formData.subtotal,
        tax_rate: formData.tax,
        tax_amount: ((formData.subtotal || 0) * (formData.tax || 0)) / 100,
        discount: formData.discount,
        total_amount: formData.totalAmount,
        paid_amount: formData.paidAmount,
        balance_amount: formData.balanceAmount,
        status: formData.status,
        notes: formData.notes,
        tax_type: formData.tax_type,
        client_gstin: formData.client_gstin,
        business_gstin: formData.business_gstin,
        pan_number: formData.pan_number,
        terms_and_conditions: formData.terms_and_conditions,
        customer_type: formData.customer_type,
        pincode: formData.pincode,
        contact_person: formData.contact_person,
        state: formData.state || formData.place_of_supply
      };

      if (formData.id) {
        await updateInvoice({ id: formData.id, ...payload }).unwrap();
        toast.success("Invoice updated successfully");
      } else {
        await createInvoice(payload).unwrap();
        toast.success("Invoice created successfully");
      }
      setShowModal(false);
      refetch();
    } catch (error) {
      console.error(error);
      toast.error(error?.data?.message || "Failed to save invoice");
    }
  };

  const handleEdit = (invoice) => {
    setSelectedInvoice(invoice);
    setFormData({
      id: invoice.id,
      invoiceNo: invoice.invoice_number,
      clientId: invoice.client_id,
      clientName: invoice.client_name,
      email: invoice.client_email,
      phone: invoice.client_phone,
      address: invoice.client_address,
      invoiceDate: invoice.invoice_date?.split("T")[0],
      dueDate: invoice.due_date?.split("T")[0],
      lineItems: invoice.items || [],
      subtotal: invoice.subtotal,
      tax: invoice.tax_rate,
      discount: invoice.discount,
      totalAmount: invoice.total_amount,
      paidAmount: invoice.paid_amount,
      balanceAmount: invoice.balance_amount,
      status: invoice.status,
      notes: invoice.notes,
      tax_type: invoice.tax_type || "GST",
      client_gstin: invoice.client_gstin || "",
      business_gstin: invoice.business_gstin || "",
      pan_number: invoice.pan_number || "",
      terms_and_conditions: invoice.terms_and_conditions || "",
      customer_type: invoice.customer_type || "Business",
      pincode: invoice.pincode || "",
      contact_person: invoice.contact_person || "",
      state: invoice.state || invoice.place_of_supply || ""
    });
    setShowModal(true);
  };

  const handleStatusUpdate = async (invoice, newStatus) => {
    if (newStatus === "Partial") {
      setInvoiceForPartial(invoice);
      setPartialAmount(invoice.paid_amount || "");
      setShowPartialModal(true);
      return;
    }

    try {
      let paid_amount = invoice.paid_amount;
      let balance_amount = invoice.balance_amount;

      if (newStatus === "Paid") {
        paid_amount = invoice.total_amount;
        balance_amount = 0;
      } else if (newStatus === "Unpaid") {
        paid_amount = 0;
        balance_amount = invoice.total_amount;
      }

      const payload = {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        quotation_id: invoice.quotation_id,
        client_id: invoice.client_id,
        client_name: invoice.client_name,
        client_email: invoice.client_email,
        client_phone: invoice.client_phone,
        client_address: invoice.client_address,
        invoice_date: invoice.invoice_date?.split("T")[0],
        due_date: invoice.due_date?.split("T")[0],
        items: invoice.items,
        subtotal: invoice.subtotal,
        tax_rate: invoice.tax_rate,
        tax_amount: invoice.tax_amount,
        discount: invoice.discount,
        total_amount: invoice.total_amount,
        paid_amount: paid_amount,
        balance_amount: balance_amount,
        status: newStatus,
        notes: invoice.notes,
        tax_type: invoice.tax_type,
        client_gstin: invoice.client_gstin,
        business_gstin: invoice.business_gstin,
        pan_number: invoice.pan_number,
        terms_and_conditions: invoice.terms_and_conditions
      };

      await updateInvoice(payload).unwrap();
      toast.success(`Invoice marked as ${newStatus}`);
      refetch();
    } catch (error) {
      console.error(error);
      toast.error(error?.data?.message || "Failed to update status");
    }
  };

  const handlePartialSubmit = async () => {
    if (!invoiceForPartial) return;
    const amount = parseFloat(partialAmount) || 0;

    if (amount > invoiceForPartial.total_amount) {
      toast.error("Paid amount cannot exceed total amount");
      return;
    }

    try {
      let finalStatus = "Partial";
      if (amount === 0) finalStatus = "Unpaid";
      if (amount >= invoiceForPartial.total_amount) finalStatus = "Paid";

      const payload = {
        id: invoiceForPartial.id,
        invoice_number: invoiceForPartial.invoice_number,
        quotation_id: invoiceForPartial.quotation_id,
        client_id: invoiceForPartial.client_id,
        client_name: invoiceForPartial.client_name,
        client_email: invoiceForPartial.client_email,
        client_phone: invoiceForPartial.client_phone,
        client_address: invoiceForPartial.client_address,
        invoice_date: invoiceForPartial.invoice_date?.split("T")[0],
        due_date: invoiceForPartial.due_date?.split("T")[0],
        items: invoiceForPartial.items,
        subtotal: invoiceForPartial.subtotal,
        tax_rate: invoiceForPartial.tax_rate,
        tax_amount: invoiceForPartial.tax_amount,
        discount: invoiceForPartial.discount,
        total_amount: invoiceForPartial.total_amount,
        paid_amount: amount,
        balance_amount: invoiceForPartial.total_amount - amount,
        status: finalStatus,
        notes: invoiceForPartial.notes,
        tax_type: invoiceForPartial.tax_type,
        client_gstin: invoiceForPartial.client_gstin,
        business_gstin: invoiceForPartial.business_gstin,
        pan_number: invoiceForPartial.pan_number,
        terms_and_conditions: invoiceForPartial.terms_and_conditions
      };

      await updateInvoice(payload).unwrap();
      toast.success(`Payment updated: ${finalStatus}`);
      setShowPartialModal(false);
      refetch();
    } catch (error) {
      console.error(error);
      toast.error(error?.data?.message || "Failed to update payment");
    }
  };

  const getDateRange = () => {
    const today = new Date();
    const formatDate = (date) => date.toISOString().split('T')[0];

    let dateFrom = "";
    let dateTo = "";

    if (dateFilter === "Today") {
      dateFrom = formatDate(today);
      dateTo = formatDate(today);
    } else if (dateFilter === "Yesterday") {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      dateFrom = formatDate(yesterday);
      dateTo = formatDate(yesterday);
    } else if (dateFilter === "Last 7 Days") {
      const last7 = new Date(today);
      last7.setDate(today.getDate() - 7);
      dateFrom = formatDate(last7);
      dateTo = formatDate(today);
    } else if (dateFilter === "This Month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      dateFrom = formatDate(firstDay);
      dateTo = formatDate(today);
    } else if (dateFilter === "Custom") {
      dateFrom = customStart;
      dateTo = customEnd;
    }
    return { dateFrom, dateTo };
  };

  const { dateFrom, dateTo } = getDateRange();

  const queryParams = useMemo(() => ({
    status: filterStatus,
    customer_type: filterCustomerType,
    tax_type: filterTaxType,
    search: searchTerm,
    page: currentPage,
    limit: itemsPerPage,
    dateFrom,
    dateTo,
    client_id: clientIdFilter
  }), [filterStatus, filterCustomerType, filterTaxType, searchTerm, currentPage, itemsPerPage, dateFrom, dateTo, clientIdFilter]);

  const { data: invoicesResponse, isLoading, refetch, isFetching } = useGetInvoicesQuery(queryParams);

  const invoices = invoicesResponse?.invoices || [];
  const summary = invoicesResponse?.summary || {};
  const pagination = invoicesResponse?.pagination || { total: 0, totalPages: 1 };

  // Log to check state and response
  useEffect(() => {
    if (location.state?.client && !isLoading && invoicesResponse && invoices.length === 0 && !hasAutoOpened) {
      const client = location.state.client;
      setFormData({
        invoiceNo: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        clientId: client.id,
        clientName: client.type === 'person' ? `${client.first_name || ''} ${client.last_name || ''}`.trim() : client.company_name,
        email: client.email || "",
        phone: client.phone || "",
        address: client.address || "",
        invoiceDate: new Date().toISOString().split("T")[0],
        dueDate: "",
        lineItems: [],
        subtotal: 0,
        tax: 0,
        discount: 0,
        totalAmount: 0,
        paidAmount: 0,
        balanceAmount: 0,
        status: "Draft",
        notes: "",
        tax_type: "GST",
        client_gstin: client.tax_id || "",
        place_of_supply: client.state || "",
        business_gstin: "",
        pan_number: "",
        terms_and_conditions: "",
        customer_type: client.type === 'company' ? 'Business' : 'Individual',
        pincode: client.zip_code || "",
        state: client.state || ""
      });
      setShowModal(true);
      setHasAutoOpened(true);
    }
  }, [location.state, isLoading, invoicesResponse, invoices.length, hasAutoOpened]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const clearAllFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setFilterCustomerType("all");
    setFilterTaxType("all");
    setDateFilter("All");
    setCustomStart("");
    setCustomEnd("");
    setClientIdFilter(null);
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || filterStatus !== "all" || filterCustomerType !== "all" || filterTaxType !== "all" || dateFilter !== "All" || clientIdFilter;

  const handleExportExcel = () => {
    try {
      if (!invoices || invoices.length === 0) {
        toast.error("No data available to export");
        return;
      }

      // Format data for Excel with professional headers
      const exportData = invoices.map(inv => ({
        "Invoice Number": inv.invoice_number,
        "Invoice Date": inv.invoice_date?.split('T')[0] || "N/A",
        "Due Date": inv.due_date?.split('T')[0] || "N/A",
        "Client Name": inv.client_name,
        "Client Email": inv.client_email || "N/A",
        "Client Phone": inv.client_phone || "N/A",
        "Status": inv.status.toUpperCase(),
        "Subtotal (INR)": inv.subtotal,
        "Discount (INR)": inv.discount || 0,
        "Tax Rate (%)": inv.tax_rate || 0,
        "Tax Amount (INR)": inv.tax_amount || 0,
        "Grand Total (INR)": inv.total_amount,
        "Paid Amount (INR)": inv.paid_amount || 0,
        "Balance Due (INR)": inv.balance_amount || 0,
        "Notes": inv.notes || ""
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices Report");

      // Professional Column Widths
      const wscols = [
        { wch: 20 }, // Invoice Number
        { wch: 15 }, // Invoice Date
        { wch: 15 }, // Due Date
        { wch: 25 }, // Client Name
        { wch: 30 }, // Client Email
        { wch: 15 }, // Client Phone
        { wch: 12 }, // Status
        { wch: 15 }, // Subtotal
        { wch: 15 }, // Discount
        { wch: 12 }, // Tax Rate
        { wch: 15 }, // Tax Amount
        { wch: 18 }, // Grand Total
        { wch: 18 }, // Paid Amount
        { wch: 18 }, // Balance Due
        { wch: 30 }  // Notes
      ];
      worksheet['!cols'] = wscols;

      XLSX.writeFile(workbook, `Invoices_${dateFilter}_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
      toast.success("Exported to Excel successfully!");
    } catch (error) {
      console.error("Excel Export Error:", error);
      toast.error("Error generating Excel report");
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-0 via-white to-orange-100">
        <div className="bg-white sticky top-0 z-30">
          <div className="max-w-8xl mx-auto px-4 py-4 border-b">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  Invoices
                  {clientIdFilter && location.state?.client && (
                    <span className="flex items-center gap-2 px-3 py-1 bg-orange-50 text-[#FF7B1D] text-xs font-bold rounded-full border border-orange-100 animate-fadeIn">
                      <User size={12} />
                      {location.state.client.type === 'person'
                        ? `${location.state.client.first_name} ${location.state.client.last_name || ''}`
                        : location.state.client.company_name}
                      <button
                        onClick={() => {
                          setClientIdFilter(null);
                          window.history.replaceState({}, document.title);
                        }}
                        className="hover:bg-orange-200 rounded-full p-0.5 transition-colors"
                      >
                        <X size={10} strokeWidth={3} />
                      </button>
                    </span>
                  )}
                </h1>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                  <FiHome className="text-gray-700" size={14} />
                  <span className="text-gray-400"></span> Additional /{" "}
                  <span className="text-[#FF7B1D] font-medium">
                    Invoice Management
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">

                {/* Unified Filter Dropdown */}
                <div className="relative" ref={statusDropdownRef}>
                  <button
                    onClick={() => {
                      if (hasActiveFilters) {
                        clearAllFilters();
                      } else {
                        setTempStatus(filterStatus);
                        setTempCustomerType(filterCustomerType);
                        setTempTaxType(filterTaxType);
                        setTempDateFilter(dateFilter);
                        setTempCustomStart(customStart);
                        setTempCustomEnd(customEnd);
                        setIsFilterOpen(!isFilterOpen);
                      }
                    }}
                    className={`px-3 py-3 rounded-sm border transition shadow-sm ${isFilterOpen || hasActiveFilters
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-[#FF7B1D]"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                      }`}
                  >
                    {hasActiveFilters ? <X size={18} /> : <Filter size={18} />}
                  </button>

                  {isFilterOpen && (
                    <div className="absolute right-0 mt-2 w-[700px] bg-white border border-gray-200 rounded-sm shadow-2xl z-50 animate-fadeIn overflow-hidden">
                      {/* Header */}
                      <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-800 tracking-wide uppercase">Advanced Filters</span>
                        <button
                          onClick={() => {
                            setTempStatus("all");
                            setTempCustomerType("all");
                            setTempTaxType("all");
                            setTempDateFilter("All");
                            setTempCustomStart("");
                            setTempCustomEnd("");
                          }}
                          className="text-[10px] font-bold text-orange-600 hover:underline hover:text-orange-700 capitalize"
                        >
                          Reset all
                        </button>
                      </div>

                      <div className="p-5 grid grid-cols-2 gap-x-10 gap-y-8">
                        {/* Column 1: Status */}
                        <div className="space-y-4">
                          <span className="text-[11px] font-bold text-gray-400 capitalize tracking-wider block mb-2 border-b pb-1">Payment Status</span>
                          <div className="grid grid-cols-2 gap-2">
                            {["all", "Draft", "Sent", "Partial", "Paid", "Unpaid", "Cancelled"].map((s) => (
                              <label key={s} className="flex items-center group cursor-pointer">
                                <div className="relative flex items-center">
                                  <input
                                    type="radio"
                                    name="status_filter"
                                    checked={tempStatus === s}
                                    onChange={() => setTempStatus(s)}
                                    className="peer h-4 w-4 cursor-pointer appearance-none rounded-full border-2 border-gray-200 transition-all checked:border-[#FF7B1D] checked:border-[5px] hover:border-orange-300"
                                  />
                                </div>
                                <span className={`ml-3 text-xs font-medium transition-colors capitalize ${tempStatus === s ? "text-[#FF7B1D] font-bold" : "text-gray-600 group-hover:text-gray-900"}`}>
                                  {s === "all" ? "All" : s}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Column 2: Date Period */}
                        <div className="space-y-4">
                          <span className="text-[11px] font-bold text-gray-400 capitalize tracking-wider block mb-2 border-b pb-1">Date Period</span>
                          <div className="space-y-3">
                            <select
                              value={tempDateFilter}
                              onChange={(e) => setTempDateFilter(e.target.value)}
                              className="w-full px-3 py-2.5 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-orange-500/20 outline-none transition-all text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-white"
                            >
                              {["All", "Today", "Yesterday", "Last 7 Days", "This Month", "Custom"].map((range) => (
                                <option key={range} value={range}>{range}</option>
                              ))}
                            </select>

                            {tempDateFilter === "Custom" && (
                              <div className="grid grid-cols-2 gap-2 animate-fadeIn">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-gray-400 uppercase">From</label>
                                  <input
                                    type="date"
                                    value={tempCustomStart}
                                    onChange={(e) => setTempCustomStart(e.target.value)}
                                    className="w-full px-2 py-1.5 border border-gray-200 rounded-sm text-[10px] outline-none focus:border-orange-500"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-gray-400 uppercase">To</label>
                                  <input
                                    type="date"
                                    value={tempCustomEnd}
                                    onChange={(e) => setTempCustomEnd(e.target.value)}
                                    className="w-full px-2 py-1.5 border border-gray-200 rounded-sm text-[10px] outline-none focus:border-orange-500"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Column 3: Customer Type */}
                        <div className="space-y-4">
                          <span className="text-[11px] font-bold text-gray-400 capitalize tracking-wider block mb-2 border-b pb-1">Customer Type</span>
                          <div className="grid grid-cols-2 gap-2">
                            {["all", "Individual", "Business"].map((ct) => (
                              <label key={ct} className="flex items-center group cursor-pointer">
                                <div className="relative flex items-center">
                                  <input
                                    type="radio"
                                    name="customer_type_filter"
                                    checked={tempCustomerType === ct}
                                    onChange={() => setTempCustomerType(ct)}
                                    className="peer h-4 w-4 cursor-pointer appearance-none rounded-full border-2 border-gray-200 transition-all checked:border-[#FF7B1D] checked:border-[5px] hover:border-orange-300"
                                  />
                                </div>
                                <span className={`ml-3 text-xs font-medium transition-colors capitalize ${tempCustomerType === ct ? "text-[#FF7B1D] font-bold" : "text-gray-600 group-hover:text-gray-900"}`}>
                                  {ct === "all" ? "All" : ct}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Column 4: Invoice (Tax) Type */}
                        <div className="space-y-4">
                          <span className="text-[11px] font-bold text-gray-400 capitalize tracking-wider block mb-2 border-b pb-1">Invoice Type</span>
                          <div className="grid grid-cols-2 gap-2">
                            {["all", "GST", "Non-GST"].map((tt) => (
                              <label key={tt} className="flex items-center group cursor-pointer">
                                <div className="relative flex items-center">
                                  <input
                                    type="radio"
                                    name="tax_type_filter"
                                    checked={tempTaxType === tt}
                                    onChange={() => setTempTaxType(tt)}
                                    className="peer h-4 w-4 cursor-pointer appearance-none rounded-full border-2 border-gray-200 transition-all checked:border-[#FF7B1D] checked:border-[5px] hover:border-orange-300"
                                  />
                                </div>
                                <span className={`ml-3 text-xs font-medium transition-colors capitalize ${tempTaxType === tt ? "text-[#FF7B1D] font-bold" : "text-gray-600 group-hover:text-gray-900"}`}>
                                  {tt === "all" ? "All" : tt}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Filter Actions */}
                      <div className="p-4 bg-gray-50 border-t flex gap-3">
                        <button
                          onClick={() => setIsFilterOpen(false)}
                          className="flex-1 py-2.5 text-[11px] font-bold text-gray-500 capitalize tracking-wider hover:bg-gray-200 transition-colors rounded-sm border border-gray-200 bg-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            setFilterStatus(tempStatus);
                            setFilterCustomerType(tempCustomerType);
                            setFilterTaxType(tempTaxType);
                            setDateFilter(tempDateFilter);
                            setCustomStart(tempCustomStart);
                            setCustomEnd(tempCustomEnd);
                            setIsFilterOpen(false);
                            setCurrentPage(1);
                          }}
                          className="flex-1 py-2.5 text-[11px] font-bold text-white capitalize tracking-wider bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all rounded-sm shadow-md active:scale-95"
                        >
                          Apply filters
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Search Bar */}

                <button
                  onClick={handleExportExcel}
                  className="bg-white border border-gray-300 hover:bg-gray-50 px-5 py-3 rounded-sm flex items-center gap-2 transition font-semibold shadow-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed group"
                  disabled={invoices.length === 0}
                >
                  <Download size={18} className="text-gray-700 transition-transform group-hover:scale-110" />
                  Export
                </button>


                <ActionGuard permission="invoice_create" module="Invoice" type="create">
                  <button
                    onClick={() => {
                      setFormData({
                        invoiceNo: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                        clientName: "",
                        email: "",
                        phone: "",
                        address: "",
                        invoiceDate: new Date().toISOString().split("T")[0],
                        dueDate: "",
                        lineItems: [],
                        subtotal: 0,
                        tax: 0,
                        discount: 0,
                        totalAmount: 0,
                        paidAmount: 0,
                        balanceAmount: 0,
                        status: "Draft",
                        notes: "",
                        tax_type: "GST",
                        client_gstin: "",
                        place_of_supply: "",
                        business_gstin: "",
                        pan_number: "",
                        terms_and_conditions: ""
                      });
                      setShowModal(true);
                    }}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-sm hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 font-semibold"
                  >
                    <Plus size={20} />
                    Add Invoice
                  </button>
                </ActionGuard>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-8xl mx-auto p-4 pt-0 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <NumberCard
              title={"Total Invoices"}
              number={(summary.totalInvoices || 0).toLocaleString()}
              icon={<FileText className="text-blue-600" size={24} />}
              iconBgColor={"bg-blue-100"}
              lineBorderClass={"border-blue-500"}
            />
            <NumberCard
              title={"Paid Total"}
              number={`₹${(summary.paidInvoices || 0).toLocaleString("en-IN")}`}
              icon={<CheckCircle className="text-green-600" size={24} />}
              iconBgColor={"bg-green-100"}
              lineBorderClass={"border-green-500"}
            />
            <NumberCard
              title={"Total Revenue"}
              number={`₹${(summary.totalValue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon={<DollarSign className="text-orange-600" size={24} />}
              iconBgColor={"bg-orange-100"}
              lineBorderClass={"border-orange-500"}
            />
            <NumberCard
              title={"Pending Balance"}
              number={`₹${(summary.pendingBalance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon={<CreditCard className="text-red-600" size={24} />}
              iconBgColor={"bg-red-100"}
              lineBorderClass={"border-red-500"}
            />
          </div>


          <div className="bg-white rounded-sm shadow-sm overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs tracking-wide">
                    <th className="py-4 px-4 font-bold text-left w-[200px]">Invoice ID</th>
                    <th className="py-4 px-4 font-bold text-left">Client Name</th>
                    <th className="py-4 px-4 font-bold text-left w-[180px]">Date</th>
                    <th className="py-4 px-4 font-bold text-center w-[180px]">Status</th>
                    <th className="py-4 px-4 font-bold text-right w-[180px]">Total Amount</th>
                    <th className="py-4 px-4 font-bold text-right w-[180px]">Received</th>
                    <th className="py-4 px-4 font-bold text-right w-[180px]">Pending</th>
                    <th className="py-4 px-4 font-bold text-right w-[110px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isLoading ? (
                    <tr>
                      <td colSpan="8" className="py-20 text-center">
                        <div className="flex justify-center flex-col items-center gap-4">
                          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                          <p className="text-gray-500 font-semibold animate-pulse">Loading invoices...</p>
                        </div>
                      </td>
                    </tr>
                  ) : invoices.length > 0 ? (
                    invoices.map((invoice, index) => (
                      <tr
                        key={invoice.id}
                        className={`border-b border-gray-100 hover:bg-orange-50/20 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}
                      >
                        <td className="py-4 px-4 font-bold text-gray-900 text-xs tracking-tight">
                          {invoice.invoice_number}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 border border-blue-100 shadow-sm">
                              <User size={16} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-gray-900 truncate leading-tight">{invoice.client_name}</div>
                              <div className="text-[10px] font-semibold text-gray-400 truncate uppercase mt-0.5 tracking-tighter">{invoice.client_email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-600 text-xs font-bold">
                          <div className="flex items-center gap-2 text-xs">
                            <Calendar size={14} className="text-orange-500" />
                            {new Date(invoice.invoice_date).toLocaleDateString('en-GB')}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="inline-flex items-center justify-center relative min-w-[120px]">
                            <ActionGuard permission="invoice_edit" module="Invoice" type="update">
                              <select
                                value={invoice.status}
                                onChange={(e) => handleStatusUpdate(invoice, e.target.value)}
                                className={`w-full px-2.5 py-1.5 rounded-sm text-[10px] font-bold border uppercase tracking-widest outline-none cursor-pointer transition-all shadow-sm ${invoice.status === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' :
                                  invoice.status === 'Partial' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    invoice.status === 'Unpaid' ? 'bg-red-50 text-red-700 border-red-200' :
                                      invoice.status === 'Draft' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                                        invoice.status === 'Sent' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                          'bg-slate-50 text-slate-700 border-slate-200'
                                  }`}
                              >
                                <option value="Draft">Draft</option>
                                <option value="Sent">Sent</option>
                                <option value="Unpaid">Unpaid</option>
                                <option value="Paid">Paid</option>
                                <option value="Partial">Partial</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </ActionGuard>
                            {invoice.status === "Partial" && (
                              <ActionGuard permission="invoice_edit" module="Invoice" type="update">
                                <button
                                  onClick={() => handleStatusUpdate(invoice, "Partial")}
                                  className="absolute -right-8 p-1.5 bg-orange-50 text-[#FF7B1D] rounded-full hover:bg-orange-100 transition-colors shadow-sm border border-orange-100"
                                  title="Edit Partial Payment"
                                >
                                  <Edit2 size={11} strokeWidth={3} />
                                </button>
                              </ActionGuard>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="text-sm font-bold text-gray-900 whitespace-nowrap">₹{(invoice.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="text-sm font-bold text-green-600 whitespace-nowrap">₹{(invoice.paid_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className={`text-sm font-bold whitespace-nowrap ${(invoice.balance_amount || 0) > 0 ? "text-red-500" : "text-green-600"}`}>
                            ₹{(invoice.balance_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </div>
                          {(invoice.balance_amount || 0) === 0 && (
                            <div className="text-[9px] font-bold text-green-500 uppercase tracking-tighter mt-1 animate-pulse">CLEARED</div>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            <button
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setShowViewModal(true);
                              }}
                              className="p-1.5 hover:bg-blue-50 rounded-sm text-blue-500 hover:text-blue-700 transition-all border border-transparent hover:border-blue-100"
                              title="View Invoice"
                            >
                              <Eye size={16} />
                            </button>
                            <ActionGuard permission="invoice_edit" module="Invoice" type="update">
                              <button
                                onClick={() => handleEdit(invoice)}
                                className="p-1.5 hover:bg-green-50 rounded-sm text-green-500 hover:text-green-700 transition-all border border-transparent hover:border-green-100"
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                            </ActionGuard>
                            <ActionGuard permission="invoice_delete" module="Invoice" type="delete">
                              <button
                                onClick={() => {
                                  setSelectedInvoice(invoice);
                                  setShowDeleteModal(true);
                                }}
                                className="p-1.5 hover:bg-red-50 rounded-sm text-red-500 hover:text-red-700 transition-all border border-transparent hover:border-red-100 shadow-sm"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </ActionGuard>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="py-20 text-center">
                        <div className="flex flex-col items-center justify-center gap-4 max-w-[600px] mx-auto">
                          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-2">
                            <FileText size={40} className="text-orange-400" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                              {hasActiveFilters ? "No Invoices Found" : "No Invoices Yet"}
                            </h3>
                            <p className="text-gray-500 font-medium leading-relaxed">
                              {hasActiveFilters
                                ? "We couldn't find any invoices matching your current filter criteria. Try adjusting your filters or search term to find what you're looking for."
                                : "Your invoice management system is ready. Start by creating your first professional invoice to track payments and grow your business."}
                            </p>
                          </div>

                          <div className="mt-4">
                            {hasActiveFilters ? (
                              <button
                                onClick={clearAllFilters}
                                className="px-6 py-2.5 border-2 border-orange-500 text-orange-600 font-bold rounded-sm hover:bg-orange-50 transition-all text-xs uppercase tracking-widest flex items-center gap-2"
                              >
                                <X size={16} />
                                Clear All Filters
                              </button>
                            ) : (
                              <ActionGuard permission="invoice_create" module="Invoice" type="create">
                                <button
                                  onClick={() => {
                                    setFormData({
                                      invoiceNo: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                                      clientName: "",
                                      email: "",
                                      phone: "",
                                      address: "",
                                      invoiceDate: new Date().toISOString().split("T")[0],
                                      dueDate: "",
                                      lineItems: [],
                                      subtotal: 0,
                                      tax: 0,
                                      discount: 0,
                                      totalAmount: 0,
                                      paidAmount: 0,
                                      balanceAmount: 0,
                                      status: "Draft",
                                      notes: "",
                                      tax_type: "GST",
                                      client_gstin: "",
                                      place_of_supply: "",
                                      business_gstin: "",
                                      pan_number: "",
                                      terms_and_conditions: ""
                                    });
                                    setShowModal(true);
                                  }}
                                  className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3.5 rounded-sm hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2 font-bold tracking-wide"
                                >
                                  <Plus size={20} />
                                  Create First Invoice
                                </button>
                              </ActionGuard>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4 bg-gray-50 p-4 rounded-sm border border-gray-200 mb-6 shadow-sm">
            <p className="text-sm font-semibold text-gray-700">
              Showing <span className="text-orange-600">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="text-orange-600">{Math.min(currentPage * itemsPerPage, pagination.total)}</span> of <span className="text-orange-600">{pagination.total || 0}</span> Invoices
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-sm font-bold transition flex items-center gap-1 text-xs uppercase tracking-widest ${currentPage === 1 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"}`}
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.max(pagination.totalPages, 1) }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-sm font-bold transition text-xs ${currentPage === page ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md border-orange-500" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(next => Math.min(next + 1, pagination.totalPages))}
                disabled={currentPage === pagination.totalPages || pagination.total === 0}
                className={`px-4 py-2 rounded-sm font-bold transition flex items-center gap-1 text-xs uppercase tracking-widest ${currentPage === pagination.totalPages || pagination.total === 0 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"}`}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <CreateInvoiceModal
          showModal={showModal}
          setShowModal={setShowModal}
          formData={formData}
          setFormData={setFormData}
          handleInputChange={handleInputChange}
          handleCreateInvoice={handleCreateInvoice}
        />

        <ViewInvoiceModal
          showModal={showViewModal}
          setShowModal={setShowViewModal}
          invoice={selectedInvoice}
        />
        <DeleteInvoiceModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          invoice={selectedInvoice}
          refetchInvoices={refetch}
        />

        {/* Partial Payment Modal */}
        <Modal
          isOpen={showPartialModal}
          onClose={() => setShowPartialModal(false)}
          title="Partial Payment"
          subtitle={`Updating payment for ${invoiceForPartial?.invoice_number}`}
          icon={<DollarSign size={24} />}
          maxWidth="max-w-md"
          footer={
            <div className="flex gap-4 w-full">
              <button
                onClick={() => setShowPartialModal(false)}
                className="flex-1 px-8 py-3 bg-white border border-gray-300 rounded-sm hover:bg-gray-50 font-bold text-gray-700 transition-all uppercase tracking-widest text-[10px]"
              >
                Discard
              </button>
              <button
                onClick={handlePartialSubmit}
                className="flex-1 px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-sm hover:from-orange-600 hover:to-orange-700 font-bold shadow-md transition-all uppercase tracking-widest text-[10px] active:scale-95 flex items-center justify-center gap-2"
              >
                <CheckCircle size={16} /> Update Receipt
              </button>
            </div>
          }
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-5 rounded-sm border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Invoice Amount</p>
                <p className="text-xl font-bold text-slate-900 leading-none">₹{invoiceForPartial?.total_amount?.toLocaleString()}</p>
              </div>
              <div className="bg-orange-50 p-5 rounded-sm border border-orange-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-1 opacity-10">
                  <CreditCard size={40} className="text-orange-300" />
                </div>
                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-[0.2em] mb-2">Pending Balance</p>
                <p className="text-xl font-bold text-orange-700 leading-none">₹{invoiceForPartial?.balance_amount?.toLocaleString()}</p>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-800 mb-3 uppercase tracking-widest">
                <div className="w-6 h-6 bg-orange-100 text-[#FF7B1D] rounded-full flex items-center justify-center font-bold">₹</div>
                Enter Received Amount <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="relative group">
                <input
                  type="number"
                  autoFocus
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value)}
                  className="w-full px-5 py-5 border-2 border-gray-100 rounded-lg focus:border-[#FF7B1D] focus:ring-4 focus:ring-orange-50 outline-none transition-all text-4xl font-bold text-gray-900 placeholder-gray-200 bg-white"
                  placeholder="0.00"
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2">
                  <DollarSign size={24} className="text-[#FF7B1D] opacity-20" />
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-4 font-bold flex items-center gap-2 uppercase tracking-widest italic">
                <RefreshCw size={12} className="text-[#FF7B1D] animate-spin-slow" />
                System will auto-calculate remaining balance
              </p>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
