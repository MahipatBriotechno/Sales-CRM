import React, { useEffect, useRef, useState, useMemo } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import DashboardLayout from "../../components/DashboardLayout";
import {
  Plus,
  Download,
  Eye,
  Trash2,
  FileText,
  Home,
  Search,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Edit,
  Filter,
  Calendar,
  X
} from "lucide-react";
import * as XLSX from "xlsx";

import CreateQuotationModal from "../../pages/QuotationPart/CreateQuotationModal";
import ViewQuotationModal from "../../pages/QuotationPart/ViewQuotationModal";
import NumberCard from "../../components/NumberCard";
import ActionGuard from "../../components/common/ActionGuard";

import {
  useGetQuotationsQuery,
  useLazyGetQuotationByIdQuery,
  useCreateQuotationMutation,
  useUpdateQuotationMutation,
  useDeleteQuotationMutation,
} from "../../store/api/quotationApi";
import { useGetBusinessInfoQuery } from "../../store/api/businessApi";
import { toast } from "react-hot-toast";
import DeleteQuotationModal from "./DeleteQuotationModal";

export default function QuotationPage() {
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedQuotationId, setSelectedQuotationId] = useState(null);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState("All");
  const [filterCustomerType, setFilterCustomerType] = useState("all");
  const [filterTaxType, setFilterTaxType] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const [tempStatus, setTempStatus] = useState("all");
  const [tempCustomerType, setTempCustomerType] = useState("all");
  const [tempTaxType, setTempTaxType] = useState("all");
  const [tempDateFilter, setTempDateFilter] = useState("All");
  const [tempCustomStart, setTempCustomStart] = useState("");
  const [tempCustomEnd, setTempCustomEnd] = useState("");

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const dateDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);
  const itemsPerPage = 8;

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
    page: currentPage,
    limit: itemsPerPage,
    status: filterStatus,
    customer_type: filterCustomerType,
    tax_type: filterTaxType,
    search: searchTerm,
    dateFrom,
    dateTo
  }), [currentPage, itemsPerPage, filterStatus, filterCustomerType, filterTaxType, searchTerm, dateFrom, dateTo]);

  const { data, isLoading, error, refetch } = useGetQuotationsQuery(queryParams);

  const { data: businessInfo } = useGetBusinessInfoQuery();

  const [createQuotation] = useCreateQuotationMutation();
  const [updateQuotation] = useUpdateQuotationMutation();
  const [deleteQuotation] = useDeleteQuotationMutation();
  const [getQuotationById] = useLazyGetQuotationByIdQuery();

  const quotations = data?.quotations || [];
  const pagination = data?.pagination || { total: 0, totalPages: 1 };
  const summary = data?.summary || { total: 0, approved: 0, pending: 0, totalValue: 0 };

  const hasActiveFilters = searchTerm || filterStatus !== "all" || filterCustomerType !== "all" || filterTaxType !== "all" || dateFilter !== "All";

  const clearAllFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setFilterCustomerType("all");
    setFilterTaxType("all");
    setDateFilter("All");
    setCustomStart("");
    setCustomEnd("");
    setCurrentPage(1);
  };

  const [formData, setFormData] = useState({
    customerType: "Business",
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    billingAddress: "",
    shippingAddress: "",
    state: "",
    pincode: "",
    gstin: "",
    pan: "",
    cin: "",
    quotationNo: `QT-${new Date().getFullYear()}-0000`,
    quotationDate: new Date().toISOString().split("T")[0],
    validUntil: "",
    salesExecutive: "",
    currency: "INR",
    lineItems: [],
    subtotal: 0,
    tax: 0,
    discount: 0,
    totalAmount: 0,
    terms_and_conditions: "",
    status: "Draft",
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-700";
      case "Pending":
        return "bg-yellow-100 text-yellow-700";
      case "Rejected":
        return "bg-red-100 text-red-700";
      case "Draft":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      customerType: "Business",
      companyName: "",
      contactPerson: "",
      email: "",
      phone: "",
      billingAddress: "",
      shippingAddress: "",
      state: "",
      pincode: "",
      gstin: "",
      pan: "",
      cin: "",
      quotationNo: `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      quotationDate: new Date().toISOString().split("T")[0],
      validUntil: "",
      salesExecutive: "",
      currency: "INR",
      lineItems: [],
      subtotal: 0,
      tax: 0,
      discount: 0,
      totalAmount: 0,
      terms_and_conditions: "",
      status: "Draft",
    });
  };

  const handleCreateQuotation = async () => {
    if (!formData.companyName || !formData.quotationDate || !formData.totalAmount) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const payload = {
        quotation_id: formData.quotationNo,
        customer_type: formData.customerType,
        company_name: formData.companyName,
        contact_person: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        billing_address: formData.billingAddress,
        shipping_address: formData.shippingAddress,
        state: formData.state,
        pincode: formData.pincode,
        gstin: formData.gstin,
        pan_number: formData.pan,
        cin_number: formData.cin,
        quotation_date: formData.quotationDate,
        valid_until: formData.validUntil,
        sales_executive: formData.salesExecutive,
        currency: formData.currency,
        line_items: formData.lineItems,
        subtotal: formData.subtotal,
        tax: formData.tax,
        discount: formData.discount,
        total_amount: formData.totalAmount,
        terms_and_conditions: formData.terms_and_conditions,
        status: formData.status,
      };

      if (formData.id) {
        await updateQuotation({ id: formData.id, data: payload }).unwrap();
        toast.success("Quotation updated successfully");
      } else {
        await createQuotation(payload).unwrap();
        toast.success("Quotation created successfully");
      }
      setShowModal(false);
      resetForm();
      // No need to manually refetch - RTK Query will auto-refetch due to cache invalidation
    } catch (err) {
      toast.error(err?.data?.message || "Error saving quotation");
    }
  };

  const handleEdit = async (quote) => {
    // Reset form and close modal first to ensure fresh state
    resetForm();
    setShowModal(false);

    try {
      toast.loading("Fetching details...", { id: "fetch-edit" });
      // Force refetch to get the latest data from server
      const response = await getQuotationById(quote.id, { forceRefetch: true }).unwrap();
      const q = response.quotation;

      if (!q) {
        throw new Error("Quotation not found");
      }

      setFormData({
        id: q.id,
        customerType: q.customer_type || "Business",
        quotationNo: q.quotation_id,
        companyName: q.company_name,
        contactPerson: q.contact_person,
        email: q.email,
        phone: q.phone,
        billingAddress: q.billing_address,
        shippingAddress: q.shipping_address,
        state: q.state,
        pincode: q.pincode,
        gstin: q.gstin,
        pan: q.pan_number,
        cin: q.cin_number,
        quotationDate: q.quotation_date ? new Date(q.quotation_date).toISOString().split('T')[0] : "",
        validUntil: q.valid_until ? new Date(q.valid_until).toISOString().split('T')[0] : "",
        salesExecutive: q.sales_executive,
        currency: q.currency,
        lineItems: q.line_items || [],
        subtotal: q.subtotal || 0,
        tax: q.tax || 0,
        discount: q.discount || 0,
        totalAmount: q.total_amount || 0,
        terms_and_conditions: q.terms_and_conditions || "",
        status: q.status || "Draft",
      });

      setShowModal(true);
      toast.success("Details loaded", { id: "fetch-edit" });
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error(err?.data?.message || err.message || "Failed to load details", { id: "fetch-edit" });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this quotation?")) {
      try {
        await deleteQuotation(id).unwrap();
        toast.success("Quotation deleted successfully");
        refetch();
      } catch (err) {
        toast.error(err?.data?.message || "Error deleting quotation");
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const quote = quotations.find((q) => q.id === id);
      if (!quote) return;

      const payload = {
        ...quote,
        quotation_date: quote.quotation_date
          ? new Date(quote.quotation_date).toISOString().split("T")[0]
          : null,
        valid_until: quote.valid_until
          ? new Date(quote.valid_until).toISOString().split("T")[0]
          : null,
        status: newStatus,
      };

      await updateQuotation({ id, data: payload }).unwrap();
      toast.success("Status updated");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update status");
    }
  };

  const handleExportExcel = () => {
    try {
      if (!quotations || quotations.length === 0) {
        toast.error("No data available to export");
        return;
      }

      // Format data for Excel with professional headers
      const exportData = quotations.map(q => ({
        "Quotation ID": q.quotation_id,
        "Date": new Date(q.quotation_date).toLocaleDateString(),
        "Valid Until": q.valid_until ? new Date(q.valid_until).toLocaleDateString() : 'N/A',
        "Company": q.company_name || 'N/A',
        "Email": q.email || "N/A",
        "Phone": q.phone || "N/A",
        "Subtotal (INR)": q.subtotal,
        "Tax (%)": q.tax || 0,
        "Discount (INR)": q.discount || 0,
        "Total Amount (INR)": q.total_amount,
        "Status": q.status.toUpperCase(),
        "Payment Terms": q.payment_terms || "",
        "Notes": q.notes || ""
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Quotations Report");

      // Professional Column Widths
      const wscols = [
        { wch: 20 }, // Quotation ID
        { wch: 15 }, // Date
        { wch: 15 }, // Valid Until
        { wch: 25 }, // Client Name
        { wch: 25 }, // Company
        { wch: 30 }, // Email
        { wch: 15 }, // Phone
        { wch: 15 }, // Subtotal
        { wch: 12 }, // Tax
        { wch: 15 }, // Discount
        { wch: 18 }, // Total Amount
        { wch: 12 }, // Status
        { wch: 30 }, // Payment Terms
        { wch: 30 }  // Notes
      ];
      worksheet['!cols'] = wscols;

      XLSX.writeFile(workbook, `Quotations_${dateFilter}_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
      toast.success("Exported to Excel successfully!");
    } catch (error) {
      console.error("Excel Export Error:", error);
      toast.error("Error generating Excel report");
    }
  };

  const handleExport = () => {
    if (quotations.length === 0) {
      toast.error("No data to export");
      return;
    }
    const headers = ["Quotation ID", "Company", "Date", "Amount", "Status", "Valid Until"];
    const csvData = quotations.map(q => [
      q.quotation_id,
      q.company_name,
      new Date(q.quotation_date).toLocaleDateString(),
      q.total_amount,
      q.status,
      q.valid_until ? new Date(q.valid_until).toLocaleDateString() : 'N/A'
    ]);

    const csvContent = [headers, ...csvData].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Quotations_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported successfully");
  };

  const handleDownload = async (quote) => {
    let qData = quote;
    try {
      toast.loading("Fetching details for PDF...", { id: "fetch-pdf" });
      const response = await getQuotationById(quote.id, { preferCacheValue: false }).unwrap();
      qData = response.quotation;
      toast.success("PDF Ready", { id: "fetch-pdf" });
    } catch (err) {
      console.error("Fetch error for PDF:", err);
      toast.error("Using cached data for PDF", { id: "fetch-pdf" });
    }

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Standardize data
    const q = {
      id: qData.quotation_id || qData.id,
      date: qData.quotation_date ? new Date(qData.quotation_date).toLocaleDateString() : qData.date,
      validUntil: qData.valid_until ? new Date(qData.valid_until).toLocaleDateString() : (qData.validUntil || "Not Set"),
      client: qData.company_name || qData.companyName || "Client Name",
      companyName: qData.company_name || qData.companyName,
      email: qData.email,
      phone: qData.phone,
      currency: qData.currency || "INR",
      lineItems: qData.line_items || qData.lineItems || [],
      subtotal: qData.subtotal || 0,
      tax: qData.tax || 0,
      discount: qData.discount || 0,
      totalAmount: qData.total_amount || qData.amount || 0,
      notes: qData.notes || qData.description || qData.notes,
      paymentTerms: qData.payment_terms || qData.paymentTerms
    };

    const brandColor = [255, 123, 29]; // #FF7B1D
    const darkColor = [31, 41, 55];    // #1F2937 (Slate 800)
    const grayColor = [107, 114, 128]; // #6B7280 (Gray 500)
    const lightGray = [249, 250, 251]; // #F9FAFB (Gray 50)
    const sidebarWidth = 6;

    // --- 0. Premium Background & Sidebar ---
    // Left Sidebar Gradient-like shade
    doc.setFillColor(255, 123, 29); // Brand Orange
    doc.rect(0, 0, sidebarWidth, pageHeight, 'F');

    // Subtle Top Gradient Bar - Increased height to 60 to cover all metadata
    doc.setFillColor(252, 245, 240); // Very light orange tint
    doc.rect(sidebarWidth, 0, pageWidth - sidebarWidth, 65, 'F');

    // Add a light watermark/pattern or subtle background text
    doc.setTextColor(245, 245, 245);
    doc.setFontSize(60);
    doc.setFont("helvetica", "bold");
    // doc.text(businessInfo?.company_name?.substring(0, 10).toUpperCase() || "TECHVISTA", 40, 150, { angle: 45, opacity: 0.1 });

    // --- 1. Header Section ---
    const startX = sidebarWidth + 15;

    // Page Watermark - Dynamic
    doc.setTextColor(245, 245, 245);
    doc.setFontSize(60);
    doc.setFont("helvetica", "bold");
    const watermarkText = (businessInfo?.company_name || "QUOTATION").split(" ")[0].toUpperCase();
    doc.text(watermarkText, 40, 150, { angle: 45, opacity: 0.05 });

    if (businessInfo?.logo_url) {
      try {
        const logoFullUrl = `${import.meta.env.VITE_API_BASE_URL.replace('/api/', '')}${businessInfo.logo_url}`;
        const img = new Image();
        img.src = logoFullUrl;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        doc.addImage(img, 'PNG', startX, 15, 22, 22);
      } catch (e) {
        doc.setFillColor(...brandColor);
        doc.roundedRect(startX, 15, 12, 12, 2, 2, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        const initials = businessInfo?.company_name
          ? businessInfo.company_name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)
          : "TV";
        doc.text(initials, startX + 3, 23);
      }
    } else {
      doc.setFillColor(...brandColor);
      doc.roundedRect(startX, 15, 12, 12, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      const initials = businessInfo?.company_name
        ? businessInfo.company_name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)
        : "TV";
      doc.text(initials, startX + 3, 23);
    }

    doc.setTextColor(...darkColor);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    // Position company name slightly higher to fit perfectly in the 60mm tint
    const textStartY = businessInfo?.logo_url ? 46 : 38;
    doc.text(businessInfo?.company_name || "TechVista IT Solutions", startX, textStartY);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...grayColor);
    doc.text(businessInfo?.website || "www.techvista.com", startX, textStartY + 6);
    doc.text(businessInfo?.email || "contact@techvista.com", startX, textStartY + 11);
    doc.text(businessInfo?.phone || "+91 98765 43210", startX, textStartY + 16);

    doc.setTextColor(...brandColor);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("QUOTATION", pageWidth - 15, 28, { align: "right" });

    // Header Details - Fixed Alignment
    const labelX = pageWidth - 80;
    const valueX = pageWidth - 15;

    doc.setTextColor(...darkColor);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Quotation No:`, labelX, 41);
    doc.text(`Date:`, labelX, 47);
    doc.text(`Valid Until:`, labelX, 53);

    doc.setFont("helvetica", "normal");
    doc.text(String(q.id), valueX, 41, { align: "right" });
    doc.text(String(q.date), valueX, 47, { align: "right" });
    doc.text(String(q.validUntil), valueX, 53, { align: "right" });

    // --- 2. Client Information Section ---
    const clientBoxY = textStartY + 25;
    doc.setFillColor(...lightGray);
    doc.roundedRect(startX, clientBoxY, pageWidth - startX - 15, 45, 2, 2, "F");

    doc.setTextColor(...darkColor);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("CLIENT DETAILS", startX + 10, clientBoxY + 12);

    doc.setFontSize(10);
    doc.text(String(q.client), startX + 10, clientBoxY + 22);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...grayColor);
    if (q.companyName) doc.text(String(q.companyName), startX + 10, clientBoxY + 28);
    if (q.email || q.phone) {
      doc.text(`${q.email || ""} | ${q.phone || ""}`, startX + 10, clientBoxY + 34);
    }
    doc.text(`Billing: As per records`, startX + 10, clientBoxY + 40);

    // --- 3. Services Table ---
    const tableHeaders = [["#", "Service Description", "Rate", "Qty", "Tax", "Amount"]];
    const tableData = (q.lineItems).map((item, index) => [
      index + 1,
      item.name,
      `${q.currency === "INR" ? "Rs." : "$"} ${(item.rate || 0).toLocaleString()}`,
      item.qty,
      `${q.tax || 0}%`,
      `${q.currency === "INR" ? "Rs." : "$"} ${(item.total || 0).toLocaleString()}`,
    ]);

    autoTable(doc, {
      startY: clientBoxY + 55,
      margin: { left: startX },
      head: tableHeaders,
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [31, 41, 55],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 10,
        cellPadding: 3,
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        valign: "middle",
        font: "helvetica",
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 10 },
        1: { cellWidth: "auto", halign: "left" },
        2: { halign: "right", cellWidth: 25 },
        3: { halign: "center", cellWidth: 18 },
        4: { halign: "center", cellWidth: 20 },
        5: { halign: "right", cellWidth: 30 },
      }
    });

    // --- 4. Totals Section ---
    const finalY = doc.lastAutoTable.finalY + 10;
    const summaryX = pageWidth - 80;
    const summaryValueX = pageWidth - 15;

    doc.setFillColor(252, 245, 240);
    doc.roundedRect(summaryX - 5, finalY - 5, 75, 42, 2, 2, "F");

    doc.setFontSize(10);
    doc.setTextColor(...grayColor);
    doc.setFont("helvetica", "normal");

    let currentTotalY = finalY + 5;
    const subtotalVal = q.subtotal || q.totalAmount;

    doc.text("Subtotal", summaryX, currentTotalY);
    doc.text(`${q.currency === "INR" ? "Rs." : "$"} ${(subtotalVal || 0).toLocaleString()}`, summaryValueX, currentTotalY, { align: "right" });

    currentTotalY += 7;
    if (q.discount) {
      doc.text("Discount", summaryX, currentTotalY);
      doc.text(`- ${q.currency === "INR" ? "Rs." : "$"} ${(q.discount || 0).toLocaleString()}`, summaryValueX, currentTotalY, { align: "right" });
      currentTotalY += 7;
    }

    if (q.tax) {
      doc.text(`GST (${q.tax}%)`, summaryX, currentTotalY);
      doc.text(`${q.currency === "INR" ? "Rs." : "$"} ${(((subtotalVal || 0) * (q.tax || 0)) / 100).toLocaleString()}`, summaryValueX, currentTotalY, { align: "right" });
      currentTotalY += 7;
    }

    doc.setDrawColor(230, 230, 230);
    doc.line(summaryX, currentTotalY - 2, summaryValueX, currentTotalY - 2);
    currentTotalY += 6;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...brandColor);
    doc.text("TOTAL DUE", summaryX, currentTotalY);
    doc.text(`${q.currency === "INR" ? "Rs." : "$"} ${(q.totalAmount || 0).toLocaleString()}`, summaryValueX, currentTotalY, { align: "right" });

    // --- 5. Notes & Payment Terms ---
    const bottomSectionY = Math.max(currentTotalY + 25, doc.lastAutoTable.finalY + 25);

    doc.setTextColor(...darkColor);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("TERMS & CONDITIONS", startX, bottomSectionY);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...grayColor);
    const termsArr = [];
    if (q.paymentTerms) termsArr.push(`Payment: ${q.paymentTerms}`);
    if (q.notes) termsArr.push(`Notes: ${q.notes}`);
    if (termsArr.length === 0) termsArr.push("This quotation is valid for 30 days. Standard terms apply.");

    let termsY = bottomSectionY + 6;
    termsArr.forEach(t => {
      const splitT = doc.splitTextToSize(t, pageWidth - startX - 20);
      doc.text(splitT, startX, termsY);
      termsY += (splitT.length * 4) + 2;
    });

    // --- 6. Footer ---
    const footerY = pageHeight - 20;
    doc.setDrawColor(230, 230, 230);
    doc.line(sidebarWidth + 10, footerY - 5, pageWidth - 15, footerY - 5);

    doc.setFontSize(8);
    doc.setTextColor(...grayColor);
    doc.text("Digitally generated document. No signature required.", pageWidth / 2 + sidebarWidth / 2, footerY, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...brandColor);
    doc.text(`Exclusive Partner: ${businessInfo?.company_name || "TechVista IT Solutions"}`, pageWidth / 2 + sidebarWidth / 2, footerY + 4, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...grayColor);
    const cityState = businessInfo?.city && businessInfo?.state ? `${businessInfo.city}, ${businessInfo.state}` : "Tech Park, Bangalore";
    doc.text(cityState, pageWidth / 2 + sidebarWidth / 2, footerY + 8, { align: "center" });

    doc.save(`Quotation_${q.id}.pdf`);
  };

  const handleView = async (quote) => {
    // Reset selection and close modal first
    setSelectedQuote(null);
    setShowViewModal(false);

    try {
      toast.loading("Fetching details...", { id: "fetch-view" });
      // Force refetch to get the latest data from server
      const response = await getQuotationById(quote.id, { forceRefetch: true }).unwrap();

      if (!response?.quotation) {
        throw new Error("Quotation not found");
      }

      setSelectedQuote(response.quotation);
      setShowViewModal(true);
      toast.success("Details loaded", { id: "fetch-view" });
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error(err?.data?.message || err.message || "Failed to load details", { id: "fetch-view" });
    }
  };

  const handlePrev = () => setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
  const handleNext = () => setCurrentPage((prev) => (prev < pagination.totalPages ? prev + 1 : prev));
  const handlePageChange = (page) => setCurrentPage(page);

  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const indexOfLastItem = Math.min(currentPage * itemsPerPage, pagination.total);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target)
      ) {
        setIsStatusFilterOpen(false);
      }
      if (
        dateDropdownRef.current &&
        !dateDropdownRef.current.contains(event.target)
      ) {
        setIsDateFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white">
        {/* Header Section */}
        <div className="bg-white sticky top-0 z-30">
          <div className="max-w-8xl mx-auto px-4 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Quotation Management
                </h1>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                  <Home className="text-gray-700" size={14} />
                  <span className="text-gray-400"></span> Additional /{" "}
                  <span className="text-[#FF7B1D] font-medium">
                    All Quotations
                  </span>
                </p>
              </div>

              {/* Action Buttons */}
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
                    <div className="absolute right-0 mt-2 w-[700px] bg-white border border-gray-200 rounded-sm shadow-2xl z-50 animate-fadeIn overflow-hidden text-left">
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
                          <span className="text-[11px] font-bold text-gray-400 capitalize tracking-wider block mb-2 border-b pb-1">Quotation Status</span>
                          <div className="grid grid-cols-2 gap-2">
                            {["all", "Draft", "Pending", "Approved", "Rejected"].map((s) => (
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
                                  {s === "all" ? "All Status" : s}
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
                          <span className="text-[11px] font-bold text-gray-400 capitalize tracking-wider block mb-2 border-b pb-1">Customer Classification</span>
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
                                  {ct === "all" ? "All Types" : ct}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Column 4: Quotation Type */}
                        <div className="space-y-4">
                          <span className="text-[11px] font-bold text-gray-400 capitalize tracking-wider block mb-2 border-b pb-1">Sales Type</span>
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
                                  {tt === "all" ? "All Taxes" : tt}
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
                          Apply Filters
                        </button>
                      </div>
                    </div>
                  )}
                </div>




                <button
                  onClick={handleExportExcel}
                  className="bg-white border border-gray-300 hover:bg-gray-50 px-5 py-3 rounded-sm flex items-center gap-2 transition font-semibold shadow-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed group"
                  disabled={quotations.length === 0}
                >
                  <Download size={18} className="text-gray-700 transition-transform group-hover:scale-110" />
                  Export
                </button>

                <ActionGuard permission="quotation_create" module="Quotation" type="create">
                  <button
                    onClick={() => {
                      resetForm();
                      setShowModal(true);
                    }}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-sm hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 font-semibold"
                  >
                    <Plus size={20} />
                    Add Quotation
                  </button>
                </ActionGuard>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-8xl mx-auto p-4 pt-0 mt-2">
          {/* Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
            <NumberCard
              title="Total Quotations"
              number={summary.total || "0"}
              icon={<FileText className="text-blue-600" size={24} />}
              iconBgColor="bg-blue-100"
              lineBorderClass="border-blue-500"
            />
            <NumberCard
              title="Total Value"
              number={`₹${((summary.totalValue || 0) / 100000).toFixed(1)}L`}
              icon={<DollarSign className="text-green-600" size={24} />}
              iconBgColor="bg-green-100"
              lineBorderClass="border-green-500"
            />
            <NumberCard
              title="Pending"
              number={summary.pending || "0"}
              icon={<AlertCircle className="text-orange-600" size={24} />}
              iconBgColor="bg-orange-100"
              lineBorderClass="border-orange-500"
            />
            <NumberCard
              title="Approved"
              number={summary.approved || "0"}
              icon={<CheckCircle className="text-purple-600" size={24} />}
              iconBgColor="bg-purple-100"
              lineBorderClass="border-purple-500"
            />
          </div>


          {/* Table Section */}
          <div className="overflow-x-auto border border-gray-200 rounded-sm shadow-sm bg-white">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs tracking-wide">
                  <th className="py-4 px-4 font-bold text-left w-[180px]">Quotation ID</th>
                  <th className="py-4 px-4 font-bold text-left">Company / Client</th>
                  <th className="py-4 px-4 font-bold text-left w-[160px]">Date</th>
                  <th className="py-4 px-4 font-bold text-left w-[160px]">Valid Until</th>
                  <th className="py-4 px-4 font-bold text-right w-[180px]">Total Amount</th>
                  <th className="py-4 px-4 font-bold text-center w-[160px]">Status</th>
                  <th className="py-4 px-4 font-bold text-right w-[120px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="py-20 text-center">
                      <div className="flex justify-center flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                        <p className="text-gray-500 font-semibold animate-pulse">Loading quotations...</p>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="7" className="py-16 text-center text-red-500 font-medium">
                      Error loading quotations. Please try again.
                    </td>
                  </tr>
                ) : quotations.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-20 text-center border-b border-gray-100">
                      <div className="flex flex-col items-center justify-center gap-4 max-w-[600px] mx-auto">
                        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-2">
                          <FileText size={40} className="text-orange-400" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                            {hasActiveFilters ? "No Quotations Found" : "No Quotations Yet"}
                          </h3>
                          <p className="text-gray-500 font-medium leading-relaxed">
                            {hasActiveFilters
                              ? "We couldn't find any quotations matching your current filter criteria. Try adjusting your filters or search term to find what you're looking for."
                              : "Your quotation history is empty. Start by creating a professional quote to win more business and track your potential sales."}
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
                            <ActionGuard permission="quotation_create" module="Quotation" type="create">
                              <button
                                onClick={() => {
                                  resetForm();
                                  setShowModal(true);
                                }}
                                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3.5 rounded-sm hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2 font-bold tracking-wide"
                              >
                                <Plus size={20} />
                                Create First Quotation
                              </button>
                            </ActionGuard>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : quotations.length > 0 ? (
                  quotations.map((quote) => (
                    <tr key={quote.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-50 group">
                      <td className="py-4 px-4 font-bold text-gray-900 text-xs tracking-tight">{quote.quotation_id}</td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-sm text-gray-900 leading-tight mb-0.5">{quote.company_name}</div>
                        <div className="text-[10px] font-semibold text-gray-400 truncate uppercase mt-0.5 tracking-tighter">{quote.email || "No Email"}</div>
                      </td>
                      <td className="py-4 px-4 text-gray-600 text-xs font-bold whitespace-nowrap">
                        {new Date(quote.quotation_date).toLocaleDateString('en-GB')}
                      </td>
                      <td className="py-4 px-4 text-gray-600 text-xs font-bold whitespace-nowrap">
                        {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString('en-GB') : "N/A"}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="text-sm font-bold text-gray-900 whitespace-nowrap">
                          {quote.currency === "INR" ? "₹" : "$"} {quote.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <ActionGuard permission="quotation_edit" module="Quotation" type="update">
                          <select
                            value={quote.status}
                            onChange={(e) => handleStatusChange(quote.id, e.target.value)}
                            className={`w-full max-w-[120px] px-2.5 py-1.5 rounded-sm text-[10px] font-bold border uppercase tracking-widest outline-none cursor-pointer transition-all shadow-sm mx-auto ${quote.status === "Approved" ? "bg-green-50 text-green-700 border-green-200" :
                              quote.status === "Pending" ? "bg-orange-50 text-orange-700 border-orange-200" :
                                quote.status === "Rejected" ? "bg-red-50 text-red-700 border-red-200" :
                                  "bg-gray-50 text-gray-700 border-gray-200"
                              }`}
                          >
                            <option value="Draft">Draft</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </ActionGuard>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            onClick={() => handleView(quote)}
                            className="p-1.5 hover:bg-blue-50 rounded-sm text-blue-500 hover:text-blue-700 transition-all border border-transparent hover:border-blue-100"
                            title="View Quotation"
                          >
                            <Eye size={16} />
                          </button>
                          <ActionGuard permission="quotation_edit" module="Quotation" type="update">
                            <button
                              onClick={() => handleEdit(quote)}
                              className="p-1.5 hover:bg-green-50 rounded-sm text-green-500 hover:text-green-700 transition-all border border-transparent hover:border-green-100"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                          </ActionGuard>
                          <button
                            onClick={() => handleDownload(quote)}
                            className="p-1.5 hover:bg-orange-50 rounded-sm text-[#FF7B1D] hover:text-orange-700 transition-all border border-transparent hover:border-orange-100"
                            title="Download PDF"
                          >
                            <Download size={16} />
                          </button>
                          <ActionGuard permission="quotation_delete" module="Quotation" type="delete">
                            <button
                              onClick={() => {
                                setSelectedQuotationId(quote.id);
                                setIsDeleteModalOpen(true);
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
                ) : null}
              </tbody>
            </table>
          </div>

          {/* Pagination Section */}
          <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4 bg-gray-50 p-4 rounded-sm border border-gray-200 mb-6 shadow-sm">
            <p className="text-sm font-semibold text-gray-700">
              Showing <span className="text-orange-600">{indexOfFirstItem + 1}</span> to <span className="text-orange-600">{indexOfLastItem}</span> of <span className="text-orange-600">{pagination.total || 0}</span> Quotations
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-sm font-bold transition flex items-center gap-1 ${currentPage === 1 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
                  }`}
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => handlePageChange(i + 1)}
                    className={`w-10 h-10 rounded-sm font-bold transition ${currentPage === i + 1 ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md border-orange-500" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={handleNext}
                disabled={currentPage === pagination.totalPages || pagination.totalPages === 0}
                className={`px-4 py-2 rounded-sm font-bold transition flex items-center gap-1 ${currentPage === pagination.totalPages || pagination.totalPages === 0 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-green-600 text-white hover:opacity-90 shadow-md"
                  }`}
              >
                Next
              </button>
            </div>
          </div>

          {/* Modals */}
          <CreateQuotationModal
            showModal={showModal}
            setShowModal={(val) => { setShowModal(val); if (!val) resetForm(); }}
            formData={formData}
            handleInputChange={handleInputChange}
            handleCreateQuotation={handleCreateQuotation}
            setFormData={setFormData}
          />

          <ViewQuotationModal
            showViewModal={showViewModal}
            setShowViewModal={setShowViewModal}
            selectedQuote={selectedQuote}
            getStatusColor={getStatusColor}
          />

          <DeleteQuotationModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedQuotationId(null);
            }}
            quotationId={selectedQuotationId}
            refetch={refetch}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
