import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiHome } from "react-icons/fi";
import DashboardLayout from "../../components/DashboardLayout";
import {
  Search,
  Plus,
  Filter,
  Download,
  Mail,
  Phone,
  Building2,
  User,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  Edit2,
  Trash2,
  Eye,
  TrendingUp,
  Users,
  MapPin,
  Globe,
  Briefcase,
  FileText,
  FileCheck,
  Check,
  LayoutGrid,
  List,
  SquarePen,
  Smartphone,
  QrCode,
} from "lucide-react";
import ActionGuard from "../../components/common/ActionGuard";
import usePermission from "../../hooks/usePermission";
import {
  useGetClientsQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
} from "../../store/api/clientApi";
import { useGetQuotationsQuery } from "../../store/api/quotationApi";
import { toast } from "react-hot-toast";
import Modal from "../../components/common/Modal";
// import ViewClientModal from "../../components/Client/ViewClientModal";
import CallQrModal from "../../components/LeadManagement/CallQrModal";
import CallActionPopup from "../../components/AddNewLeads/CallActionPopup";
import { useDebounce } from "../../hooks/useDebounce";
import { Country, State, City } from "country-state-city";
import ClientInvoicesModal from "../../components/Client/ClientInvoicesModal";
import CreateInvoiceModal from "../../pages/InvoicePart/CreateInvoiceModal";
import { useCreateInvoiceMutation } from "../../store/api/invoiceApi";
import { ChevronDown } from "lucide-react";

export default function AllClientPage() {
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const permissions = usePermission("Client Management");
  const [editingId, setEditingId] = useState(null);
  const [clientType, setClientType] = useState("person");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterIndustry, setFilterIndustry] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [selectedClients, setSelectedClients] = useState(new Set());
  const [viewMode, setViewMode] = useState("table");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === "list" ? 10 : 8;

  // Temporary Filter States for "Apply" logic
  const [tempFilterStatus, setTempFilterStatus] = useState("all");
  const [tempFilterIndustry, setTempFilterIndustry] = useState("all");
  const [tempFilterSource, setTempFilterSource] = useState("all");

  // New Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null); // ID for single delete
  const [isBulkDelete, setIsBulkDelete] = useState(false);

  // const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  // const [clientToView, setClientToView] = useState(null);

  // QR Modal States
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrClient, setQrClient] = useState(null);
  const [showCallAction, setShowCallAction] = useState(false);

  // Invoice Modal States
  const [isInvoiceListModalOpen, setIsInvoiceListModalOpen] = useState(false);
  const [selectedClientForInvoices, setSelectedClientForInvoices] = useState(null);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [invoiceFormData, setInvoiceFormData] = useState({
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

  const openQrModal = (client) => {
    // Transform client to lead format for CallQrModal/CallActionPopup
    const leadFormat = {
      name: client.type === 'person' ? `${client.first_name} ${client.last_name || ''}` : client.company_name,
      mobile_number: client.phone,
      call_count: 0,
      id: client.id,
      tag: "Client"
    };
    setQrClient(leadFormat);
    setIsQrModalOpen(true);
  };

  const handleProceedToLog = () => {
    setIsQrModalOpen(false);
    setShowCallAction(true);
  };

  const handleCallHit = async (callData) => {
    // This is a mock or you can use an actual API if available
    toast.success("Call log saved successfully");
    setShowCallAction(false);
  };

  // Filter States
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Quotation Selection State
  const [quotationSearch, setQuotationSearch] = useState("");
  const debouncedQuotationSearch = useDebounce(quotationSearch, 500);
  const [showQuotationDropdown, setShowQuotationDropdown] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);

  // API Hooks
  const { data: clientsResponse, isLoading, refetch } = useGetClientsQuery({
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
    status: filterStatus,
    industry: filterIndustry !== "all" ? filterIndustry : undefined,
    source: filterSource !== "all" ? filterSource : undefined
  });
  // Dynamic search for quotations with higher limit
  const { data: quotationsResponse } = useGetQuotationsQuery({
    status: 'Approved',
    search: debouncedQuotationSearch,
    limit: 50
  });
  const [createClient, { isLoading: isCreating }] = useCreateClientMutation();
  const [updateClient, { isLoading: isUpdating }] = useUpdateClientMutation();
  const [deleteClient, { isLoading: isDeleting }] = useDeleteClientMutation();
  const [createInvoice] = useCreateInvoiceMutation();

  const handleOpenInvoiceList = (client) => {
    setSelectedClientForInvoices(client);
    setIsInvoiceListModalOpen(true);
  };

  const handleGenerateInvoiceFromList = () => {
    const client = selectedClientForInvoices;
    const name = client.type === 'person' ? `${client.first_name} ${client.last_name || ''}`.trim() : client.company_name;

    setInvoiceFormData({
      invoiceNo: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      clientId: client.id,
      clientName: name,
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
      business_gstin: "",
      pan_number: "",
      terms_and_conditions: "",
      customer_type: client.type === 'person' ? 'Individual' : 'Business',
      pincode: client.zip_code || "",
      contact_person: client.type === 'organization' ? `${client.first_name} ${client.last_name || ''}`.trim() : "",
      state: client.state || ""
    });

    setShowCreateInvoiceModal(true);
  };

  const handleInvoiceInputChange = (e) => {
    const { name, value } = e.target;
    setInvoiceFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateInvoiceSubmit = async () => {
    try {
      const payload = {
        invoice_number: invoiceFormData.invoiceNo,
        client_id: invoiceFormData.clientId,
        client_name: invoiceFormData.clientName,
        client_email: invoiceFormData.email,
        client_phone: invoiceFormData.phone,
        client_address: invoiceFormData.address,
        invoice_date: invoiceFormData.invoiceDate,
        due_date: invoiceFormData.dueDate,
        items: invoiceFormData.lineItems,
        subtotal: invoiceFormData.subtotal,
        tax_rate: invoiceFormData.tax,
        tax_amount: (invoiceFormData.subtotal * invoiceFormData.tax) / 100,
        discount: invoiceFormData.discount,
        total_amount: invoiceFormData.totalAmount,
        paid_amount: invoiceFormData.paidAmount,
        balance_amount: invoiceFormData.balanceAmount,
        status: invoiceFormData.status,
        notes: invoiceFormData.notes,
        tax_type: invoiceFormData.tax_type,
        client_gstin: invoiceFormData.client_gstin,
        business_gstin: "",
        pan_number: "",
        terms_and_conditions: invoiceFormData.terms_and_conditions,
        customer_type: invoiceFormData.customer_type,
        pincode: invoiceFormData.pincode,
        contact_person: invoiceFormData.contact_person,
        state: invoiceFormData.state
      };

      await createInvoice(payload).unwrap();
      toast.success("Invoice created successfully");
      setShowCreateInvoiceModal(false);
    } catch (error) {
      console.error(error);
      toast.error(error?.data?.message || "Failed to create invoice");
    }
  };

  const handleDeleteClient = async () => {
    if (isBulkDelete) {
      if (selectedClients.size === 0) return;
      try {
        const deletePromises = Array.from(selectedClients).map((id) =>
          deleteClient(id).unwrap()
        );
        await Promise.all(deletePromises);
        toast.success(`${selectedClients.size} clients deleted successfully`);
        setSelectedClients(new Set());
        setIsDeleteModalOpen(false);
        setIsBulkDelete(false);
        refetch();
      } catch (error) {
        toast.error("Failed to delete some clients");
        console.error(error);
      }
    } else {
      if (!clientToDelete) return;
      try {
        await deleteClient(clientToDelete).unwrap();
        toast.success("Client deleted successfully");
        setIsDeleteModalOpen(false);
        setClientToDelete(null);
        refetch();
      } catch (error) {
        toast.error("Failed to delete client");
        console.error(error);
      }
    }
  };

  const clients = clientsResponse?.data || [];
  const pagination = clientsResponse?.pagination || { totalPages: 1, total: 0 };

  const handlePageChange = (page) => setCurrentPage(page);
  const handlePrev = () =>
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
  const handleNext = () =>
    setCurrentPage((prev) => (prev < pagination.totalPages ? prev + 1 : prev));

  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const indexOfLastItem = Math.min(currentPage * itemsPerPage, pagination.total || 0);

  const initialFormState = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    position: "",
    birthday: "",
    source: "",
    orgName: "",
    orgEmail: "",
    orgPhone: "",
    industry: "",
    website: "",
    employees: "",
    taxId: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    notes: "",
    status: "active"
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handlePermanentAddressChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,

      // Reset dependent fields
      ...(name === "permanentCountry" && {
        permanentState: "",
        permanentCity: "",
      }),

      ...(name === "permanentState" && {
        permanentCity: "",
      }),
    }));
  };

  const openAddModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData(initialFormState);
    setClientType("person");
    setSelectedQuotation(null);
    setShowAddModal(true);
  };

  const handleSelectQuotation = (q) => {
    setSelectedQuotation(q);
    const names = (q.client_name || "").split(" ");
    const firstName = names[0] || "";
    const lastName = names.slice(1).join(" ") || "";

    setFormData(prev => ({
      ...prev,
      firstName,
      lastName,
      email: q.email || "",
      phone: q.phone || "",
      company: q.company_name || "",
      orgName: q.company_name || "",
      orgEmail: q.email || "",
      orgPhone: q.phone || "",
      notes: q.notes || ""
    }));
    setQuotationSearch("");
    setShowQuotationDropdown(false);
  };

  const openEditModal = (client) => {
    setIsEditing(true);
    setEditingId(client.id);
    setClientType(client.type);

    setFormData({
      firstName: client.first_name || "",
      lastName: client.last_name || "",
      email: client.email || "",
      phone: client.phone || "",
      company: client.company_name || "",
      position: client.position || "",
      birthday: client.birthday ? client.birthday.split('T')[0] : "",
      source: client.source || "",
      orgName: client.company_name || "",
      orgEmail: client.email || "",
      orgPhone: client.phone || "",
      industry: client.industry || "",
      website: client.website || "",
      employees: client.number_of_employees || "",
      taxId: client.tax_id || "",
      address: client.address || "",
      city: client.city || "",
      state: client.state || "",
      zipCode: client.zip_code || "",
      country: client.country || "",
      notes: client.notes || "",
      status: client.status || "active"
    });
    setShowAddModal(true);
  };

  const openDeleteModal = (id) => {
    setClientToDelete(id);
    setIsBulkDelete(false);
    setIsDeleteModalOpen(true);
  };

  const openBulkDeleteModal = () => {
    setIsBulkDelete(true);
    setIsDeleteModalOpen(true);
  };

  const openViewModal = (client) => {
    navigate(`/crm/client/profile/${client.id}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        type: clientType,
        first_name: clientType === 'person' ? formData.firstName : null,
        last_name: clientType === 'person' ? formData.lastName : null,
        email: clientType === 'person' ? formData.email : formData.orgEmail,
        phone: clientType === 'person' ? formData.phone : formData.orgPhone,
        company_name: clientType === 'person' ? formData.company : formData.orgName,
        position: formData.position,
        birthday: formData.birthday || null,
        source: formData.source,
        industry: formData.industry,
        website: formData.website,
        number_of_employees: formData.employees || null,
        tax_id: formData.taxId,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zipCode,
        country: formData.country,
        notes: formData.notes,
        status: formData.status
      };

      if (isEditing) {
        await updateClient({ id: editingId, ...payload }).unwrap();
        toast.success("Client updated successfully");
      } else {
        await createClient(payload).unwrap();
        toast.success("Client created successfully");
      }
      setShowAddModal(false);
      setFormData(initialFormState);
      refetch();
    } catch (error) {
      console.error(error);
      toast.error(isEditing ? "Failed to update client" : "Failed to create client");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 border-green-200";
      case "inactive":
        return "bg-gray-100 text-gray-600 border-gray-200";
      case "pending":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const toggleClientSelection = (clientId) => {
    setSelectedClients((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedClients(new Set(clients.map((c) => c.id)));
  };

  const deselectAll = () => {
    setSelectedClients(new Set());
  };

  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.status === 'active').length;
  const inactiveClients = clients.filter(c => c.status === 'inactive').length;
  // Mock value just to show something nice
  const totalValue = "₹" + (clients.length * 4.5).toFixed(1) + "L";

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white font-primary">
        {/* Header */}
        {/* Header */}
        <div className="bg-white sticky top-0 z-30">
          <div className="max-w-8xl mx-auto px-4 py-4 border-b">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 capitalize tracking-tight">
                  All Clients
                </h1>
                <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-2 font-bold capitalize tracking-wider">
                  <FiHome className="text-gray-400" size={12} />
                  <span>CRM</span>
                  <span className="text-gray-300">/</span>
                  <span className="text-[#FF7B1D] font-bold capitalize tracking-wide">
                    All Clients
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Search Input */}
                {/* <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-sm text-sm w-64 focus:border-[#FF7B1D] focus:ring-1 focus:ring-[#FF7B1D] outline-none pl-10 bg-white hover:border-gray-300 transition-all font-semibold text-gray-700"
                  />
                  <Search className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
                </div> */}

                {/* Filter Button & Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => {
                      setTempFilterStatus(filterStatus);
                      setTempFilterIndustry(filterIndustry);
                      setTempFilterSource(filterSource);
                      setIsFilterOpen(!isFilterOpen);
                    }}
                    className={`px-3 py-3 rounded-sm border transition shadow-sm ${isFilterOpen || filterStatus !== "all" || filterIndustry !== "all" || filterSource !== "all"
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-[#FF7B1D]"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                      }`}
                    title="Filters"
                  >
                    {isFilterOpen || filterStatus !== "all" ? <Filter size={18} /> : <Filter size={18} />}
                  </button>

                  {isFilterOpen && (
                    <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-sm shadow-2xl z-50 animate-fadeIn overflow-hidden">
                      <div className="p-4 bg-gray-50 border-b flex justify-between items-center text-black">
                        <span className="text-sm font-bold capitalize">Filter Options</span>
                        <button
                          onClick={() => {
                            setTempFilterStatus("all");
                            setTempFilterIndustry("all");
                            setTempFilterSource("all");
                          }}
                          className="text-[10px] font-bold text-orange-600 hover:underline hover:text-orange-700 capitalize tracking-tighter"
                        >
                          Reset All
                        </button>
                      </div>

                      <div className="p-5 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {/* Status Filter */}
                        <div className="space-y-3">
                          <span className="text-[11px] font-bold text-gray-400 capitalize tracking-wider block mb-2 border-b pb-1">
                            Status
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {["all", "active", "inactive"].map((status) => (
                              <label key={status} className="flex items-center group cursor-pointer bg-gray-50 px-3 py-2 rounded-sm border border-transparent hover:border-gray-200 transition-all">
                                <div className="relative flex items-center">
                                  <input
                                    type="radio"
                                    name="status_filter"
                                    checked={tempFilterStatus === status}
                                    onChange={() => setTempFilterStatus(status)}
                                    className="peer h-4 w-4 cursor-pointer appearance-none rounded-full border-2 border-gray-200 transition-all checked:border-[#FF7B1D] checked:border-[5px] hover:border-orange-300"
                                  />
                                </div>
                                <span className={`ml-2 text-xs font-bold transition-colors capitalize ${tempFilterStatus === status ? "text-[#FF7B1D]" : "text-gray-600 group-hover:text-gray-900"}`}>
                                  {status}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Industry Filter */}
                        <div className="space-y-3">
                          <span className="text-[11px] font-bold text-gray-400 capitalize tracking-wider block mb-2 border-b pb-1">
                            Industry
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            {["all", "technology", "healthcare", "finance", "manufacturing", "retail", "education", "other"].map((ind) => (
                              <label key={ind} className="flex items-center group cursor-pointer">
                                <div className="relative flex items-center">
                                  <input
                                    type="radio"
                                    name="industry_filter"
                                    checked={tempFilterIndustry === ind}
                                    onChange={() => setTempFilterIndustry(ind)}
                                    className="peer h-4 w-4 cursor-pointer appearance-none rounded-full border-2 border-gray-200 transition-all checked:border-[#FF7B1D] checked:border-[5px] hover:border-orange-300"
                                  />
                                </div>
                                <span className={`ml-2 text-xs font-bold transition-colors capitalize ${tempFilterIndustry === ind ? "text-[#FF7B1D]" : "text-gray-600 group-hover:text-gray-900"}`}>
                                  {ind}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Source Filter */}
                        <div className="space-y-3">
                          <span className="text-[11px] font-bold text-gray-400 capitalize tracking-wider block mb-2 border-b pb-1">
                            Source
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            {["all", "website", "referral", "social", "cold-call", "event"].map((src) => (
                              <label key={src} className="flex items-center group cursor-pointer">
                                <div className="relative flex items-center">
                                  <input
                                    type="radio"
                                    name="source_filter"
                                    checked={tempFilterSource === src}
                                    onChange={() => setTempFilterSource(src)}
                                    className="peer h-4 w-4 cursor-pointer appearance-none rounded-full border-2 border-gray-200 transition-all checked:border-[#FF7B1D] checked:border-[5px] hover:border-orange-300"
                                  />
                                </div>
                                <span className={`ml-2 text-xs font-bold transition-colors capitalize ${tempFilterSource === src ? "text-[#FF7B1D]" : "text-gray-600 group-hover:text-gray-900"}`}>
                                  {src}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 border-t flex gap-3">
                        <button
                          onClick={() => setIsFilterOpen(false)}
                          className="flex-1 py-2.5 text-[11px] font-bold text-gray-500 capitalize tracking-wider hover:bg-gray-200 transition-colors rounded-sm border border-gray-200 bg-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            setFilterStatus(tempFilterStatus);
                            setFilterIndustry(tempFilterIndustry);
                            setFilterSource(tempFilterSource);
                            setIsFilterOpen(false);
                          }}
                          className="flex-1 py-2.5 text-[11px] font-bold text-white capitalize tracking-wider bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all rounded-sm shadow-md active:scale-95"
                        >
                          Apply Filters
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center bg-gray-100 p-1 rounded-sm border border-gray-200 shadow-inner">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-sm transition-all duration-200 ${viewMode === "grid"
                      ? "bg-white text-orange-600 shadow-sm border border-gray-100"
                      : "text-gray-400 hover:text-gray-600"
                      }`}
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`p-2 rounded-sm transition-all duration-200 ${viewMode === "table"
                      ? "bg-white text-orange-600 shadow-sm border border-gray-100"
                      : "text-gray-400 hover:text-gray-600"
                      }`}
                  >
                    <List size={18} />
                  </button>
                </div>

                {/* Export Button */}
                {/* <button
                  className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-sm text-[11px] font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm capitalize tracking-wider"
                >
                  <Download size={18} className="text-[#FF7B1D]" />
                  Export
                </button> */}

                {/* Add Client Button */}
                <ActionGuard permission="clients_create" module="Client Management" type="create">
                  <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-sm text-sm font-semibold transition shadow-lg active:scale-95 capitalize tracking-wider"
                  >
                    <Plus size={20} />
                    Add Client
                  </button>
                </ActionGuard>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="max-w-8xl mx-auto px-4 pb-4 pt-2 mt-0 font-primary w-full flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            {/* Total Clients */}
            <div
              className={`rounded-sm shadow-sm border border-gray-200 p-4 border-t-4 bg-white transition-all duration-300 border-t-blue-500 bg-blue-50/50`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-sm bg-white border border-gray-100 shadow-sm">
                    <Users size={18} className="text-blue-500" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-800 capitalize tracking-tight font-primary">Total Clients</h3>
                </div>
                <span className="bg-white text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-100 shadow-sm">{totalClients}</span>
              </div>
            </div>

            {/* Active Clients */}
            <div
              className={`rounded-sm shadow-sm border border-gray-200 p-4 border-t-4 bg-white transition-all duration-300 border-t-green-500 bg-green-50/50`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-sm bg-white border border-gray-100 shadow-sm">
                    <CheckCircle size={18} className="text-green-500" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-800 capitalize tracking-tight font-primary">Active Clients</h3>
                </div>
                <span className="bg-white text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-100 shadow-sm">{activeClients}</span>
              </div>
            </div>

            {/* Inactive Clients */}
            <div
              className={`rounded-sm shadow-sm border border-gray-200 p-4 border-t-4 bg-white transition-all duration-300 border-t-orange-500 bg-orange-50/50`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-sm bg-white border border-gray-100 shadow-sm">
                    <Clock size={18} className="text-orange-500" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-800 capitalize tracking-tight font-primary">Inactive Clients</h3>
                </div>
                <span className="bg-white text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-100 shadow-sm">{inactiveClients}</span>
              </div>
            </div>

            {/* Pipeline Value */}
            <div
              className={`rounded-sm shadow-sm border border-gray-200 p-4 border-t-4 bg-white transition-all duration-300 border-t-purple-500 bg-purple-50/50`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-sm bg-white border border-gray-100 shadow-sm">
                    <DollarSign size={18} className="text-purple-500" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-800 capitalize tracking-tight font-primary">Pipeline Value</h3>
                </div>
                <span className="bg-white text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-100 shadow-sm">{totalValue}</span>
              </div>
            </div>
          </div>





          {/* Client Cards Grid */}
          {(isLoading || !clients) ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : (
            <>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6 pb-12">
                  {clients.length === 0 ? (
                    <div className="col-span-full text-center py-16 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
                      <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-700">No Clients Found</h3>
                      <p className="text-gray-500 mb-6">Get started by adding your first client.</p>
                      <ActionGuard permission="clients_create" module="Client Management" type="create">
                        <button onClick={openAddModal} className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium shadow-sm transition-colors">
                          Add New Client
                        </button>
                      </ActionGuard>
                    </div>
                  ) : (
                    clients.map((client) => {
                      const isSelected = selectedClients.has(client.id);
                      return (
                        <div
                          key={client.id}
                          className={`relative bg-white rounded-sm border transition-all duration-300 group hover:shadow-lg flex flex-col min-h-[400px] ${isSelected
                            ? "border-orange-400 shadow-lg bg-orange-50/10 ring-1 ring-orange-200"
                            : "border-gray-200 hover:border-orange-300"
                            }`}
                        >
                          <div className="p-6 flex flex-col flex-1">
                            {/* Selection Checkbox - Top Right */}
                            <div className="absolute top-4 right-4 z-20">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleClientSelection(client.id)}
                                className="w-4 h-4 cursor-pointer accent-[#FF7B1D] border-gray-300 rounded transition-all"
                              />
                            </div>

                            {/* Header Section */}
                            <div className="flex items-start gap-4 mb-6">
                              <div
                                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-sm transition-all duration-300 ${client.type === "person"
                                  ? "bg-blue-50 text-blue-600 border border-blue-100"
                                  : "bg-purple-50 text-purple-600 border border-purple-100"
                                  }`}
                              >
                                {client.type === "person" ? <User size={32} /> : <Building2 size={32} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-slate-800 leading-tight mb-2 truncate uppercase tracking-tight">
                                  {client.type === 'person' ? `${client.first_name} ${client.last_name || ''}` : client.company_name}
                                </h3>
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                  <span className={`px-3 py-1 rounded-sm text-xs font-bold capitalize tracking-wide border ${getStatusColor(client.status)}`}>
                                    {client.status || 'Active'}
                                  </span>
                                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-sm text-xs font-semibold border border-gray-200 capitalize">
                                    {client.type}
                                  </span>
                                </div>
                                {client.industry && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Briefcase size={14} className="text-gray-400" />
                                    <span className="font-medium">{client.industry}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Contact Information */}
                            <div className="space-y-4 mb-6 flex-1">
                              {client.email && (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors group/item">
                                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm group-hover/item:bg-orange-100 transition-colors">
                                    <Mail size={16} className="text-gray-500 group-hover/item:text-orange-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{client.email}</p>
                                    <p className="text-xs text-gray-500">Email</p>
                                  </div>
                                </div>
                              )}

                              {client.phone && (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors group/item">
                                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm group-hover/item:bg-orange-100 transition-colors">
                                    <Phone size={16} className="text-gray-500 group-hover/item:text-orange-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900">{client.phone}</p>
                                    <p className="text-xs text-gray-500">Phone</p>
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors group/item">
                                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm group-hover/item:bg-orange-100 transition-colors">
                                  {client.type === 'person' ? <Building2 size={16} className="text-gray-500 group-hover/item:text-orange-600" /> : <Users size={16} className="text-gray-500 group-hover/item:text-orange-600" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 truncate">
                                    {client.type === 'person' ? (client.company_name || 'Individual') : `${client.number_of_employees || 0} Employees`}
                                  </p>
                                  <p className="text-xs text-gray-500">{client.type === 'person' ? 'Company' : 'Team Size'}</p>
                                </div>
                              </div>

                              {client.city && (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors group/item">
                                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm group-hover/item:bg-orange-100 transition-colors">
                                    <MapPin size={16} className="text-gray-500 group-hover/item:text-orange-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                      {client.city}{client.state ? `, ${client.state}` : ''}{client.country ? `, ${client.country}` : ''}
                                    </p>
                                    <p className="text-xs text-gray-500">Location</p>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="mt-auto bg-gray-100 -mx-6 -mb-6 px-6 py-4 rounded-b-sm border-t border-gray-200">
                              {/* Stats Info - Matching AllToDo Design */}
                              <div className="flex justify-between items-center mb-4">
                                <div className="flex flex-col items-center flex-1 border-r border-gray-300">
                                  <p className="text-xs text-[#FF7B1D] capitalize font-bold tracking-wide">Invoices</p>
                                  <p className="text-sm font-bold text-gray-700 mt-1">₹ 0</p>
                                </div>
                                <div className="flex flex-col items-center flex-1">
                                  <p className="text-xs text-[#FF7B1D] capitalize font-bold tracking-wide">Status</p>
                                  <p className={`text-sm font-bold mt-1 capitalize ${client.status === 'active' ? 'text-green-600' : 'text-gray-600'}`}>
                                    {client.status || 'Active'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row items-stretch gap-3">
                                {/* Primary Actions Row */}
                                  <div className="flex items-center gap-2 flex-1">
                                    <ActionGuard module="Client Management" type="read">
                                      <button
                                        onClick={() => openViewModal(client)}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-blue-600 hover:bg-blue-50 rounded-sm transition-all font-bold text-xs uppercase tracking-widest border border-blue-100 shadow-sm flex-1 min-h-[44px]"
                                      >
                                        <Eye size={16} />
                                        <span className="hidden sm:inline">View</span>
                                        <span className="sm:hidden">View</span>
                                      </button>
                                    </ActionGuard>
                                    <ActionGuard module="Client Management" type="read">
                                      <button
                                        onClick={() => handleOpenInvoiceList(client)}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-orange-600 hover:bg-orange-50 rounded-sm transition-all font-bold text-xs uppercase tracking-widest border border-orange-100 shadow-sm flex-1 min-h-[44px]"
                                      >
                                        <FileText size={16} />
                                        <span className="hidden sm:inline">Invoice</span>
                                        <span className="sm:hidden">Invoice</span>
                                      </button>
                                    </ActionGuard>
                                  </div>

                                {/* Secondary Actions */}
                                  <div className="flex items-center justify-center gap-1 sm:gap-2 border-l border-gray-300 pl-3 ml-0 sm:ml-2">
                                    <ActionGuard permission="clients_edit" module="Client Management" type="update">
                                      <button
                                        onClick={() => openEditModal(client)}
                                        className="p-2.5 text-green-600 hover:bg-green-50 rounded-sm transition-all hover:scale-110 min-w-[44px] min-h-[44px] flex items-center justify-center bg-white shadow-sm border border-green-100"
                                        title="Edit Client"
                                      >
                                        <SquarePen size={18} />
                                      </button>
                                    </ActionGuard>
                                    <ActionGuard permission="clients_delete" module="Client Management" type="delete">
                                      <button
                                        onClick={() => openDeleteModal(client.id)}
                                        className="p-2.5 text-red-600 hover:bg-red-50 rounded-sm transition-all hover:scale-110 min-w-[44px] min-h-[44px] flex items-center justify-center bg-white shadow-sm border border-red-100"
                                        title="Delete Client"
                                      >
                                        <Trash2 size={18} />
                                      </button>
                                    </ActionGuard>
                                  </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {clients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
                      <User className="w-16 h-16 text-gray-300 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-700">No Clients Found</h3>
                      <button onClick={openAddModal} className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-sm text-sm font-bold hover:bg-orange-600 transition">
                        Add First Client
                      </button>
                    </div>
                  ) : (
                    clients.map((client) => {
                      const name = client.type === 'person' ? `${client.first_name} ${client.last_name || ''}` : client.company_name;
                      const avatar = client.type === 'person'
                        ? ((client.first_name?.[0] || '') + (client.last_name?.[0] || '')).toUpperCase()
                        : (client.company_name?.slice(0, 2) || 'CO').toUpperCase();

                      return (
                        <div
                          key={client.id}
                          className={`flex items-center bg-gradient-to-r from-orange-50 to-amber-50 justify-between p-3 rounded-xl hover:shadow-sm transition-all duration-200 border group ${selectedClients.has(client.id) ? 'bg-orange-50 border-orange-400' : 'bg-white border-orange-200'}`}
                        >
                          {/* Selection Checkbox */}
                          <div className="flex items-center px-2">
                            <input
                              type="checkbox"
                              checked={selectedClients.has(client.id)}
                              onChange={() => toggleClientSelection(client.id)}
                              className="w-4 h-4 cursor-pointer accent-[#FF7B1D] border-gray-300 rounded transition-all"
                            />
                          </div>
                          {/* Left Section: Avatar & Name - Responsive Width */}
                          <div className="flex items-center gap-4 flex-[1.2] min-w-[220px]">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0 border border-orange-300">
                              {avatar}
                            </div>
                            <div className="flex flex-col justify-center min-w-0">
                              <h4 className="font-bold text-slate-800 text-[17px] capitalize truncate mb-0.5 tracking-tight">
                                {name}
                              </h4>
                              <p className="text-[13px] text-gray-500 lowercase truncate font-medium">{client.email || 'no-email@found.com'}</p>
                            </div>
                          </div>

                          {/* Middle Info Section: Flexible Flex Layout */}
                          <div className="hidden lg:flex flex-[2.5] items-center gap-4 xl:gap-8 px-4 border-l border-orange-100/50">
                            {/* Phone Block */}
                            <div className="flex items-center gap-2.5 text-gray-600 group/info min-w-0 flex-1">
                              <div className="p-2 bg-white rounded-lg shadow-sm border border-orange-100 group-hover/info:bg-orange-50 transition-colors flex-shrink-0">
                                <Phone size={14} className="text-orange-500" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-[14px] text-gray-500 font-semibold capitalize tracking-tight font-primary mb-1 whitespace-nowrap">Contact Number</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[17px] font-bold text-gray-800 truncate">{client.phone || 'N/A'}</span>
                                  {client.phone && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openQrModal(client);
                                      }}
                                      className="p-0.5 hover:bg-orange-100 text-[#FF7B1D] rounded transition-colors"
                                    >
                                      <QrCode size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Category Block - Shown only on 1536px+ */}
                            <div className="hidden 2xl:flex items-center gap-2.5 text-gray-600 group/info border-l border-orange-100/30 pl-4 min-w-0 flex-1">
                              <div className="p-2 bg-white rounded-lg shadow-sm border border-orange-100 group-hover/info:bg-orange-50 transition-colors flex-shrink-0">
                                {client.type === 'person' ? <User size={14} className="text-orange-500" /> : <Building2 size={14} className="text-orange-500" />}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-[14px] text-gray-500 font-semibold capitalize tracking-tight font-primary mb-1 whitespace-nowrap">Client Category</span>
                                <div>
                                  <span className={`px-3 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-widest shadow-sm border w-fit ${client.type === 'person' ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-purple-100 text-purple-600 border-purple-200'}`}>
                                    {client.type}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Source Block - Shown only on 1678px+ */}
                            <div className="hidden min-[1678px]:flex items-center gap-2.5 text-gray-600 group/info border-l border-orange-100/30 pl-4 min-w-0 flex-1">
                              <div className="p-2 bg-white rounded-lg shadow-sm border border-orange-100 group-hover/info:bg-orange-50 transition-colors flex-shrink-0">
                                <Globe size={14} className="text-orange-500" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-[14px] text-gray-500 font-semibold capitalize tracking-tight font-primary mb-1 whitespace-nowrap">Lead Source</span>
                                <span className="text-[17px] font-bold text-gray-800 capitalize truncate">
                                  {client.source || 'General'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right Section: Status & Date */}
                          <div className="flex items-center gap-4 xl:gap-8 flex-shrink-0 ml-auto border-l border-orange-100/50 pl-4 xl:pl-8 pr-4">
                            <div className="hidden lg:flex flex-col items-center min-w-[100px]">
                              <span className="text-[14px] text-gray-500 font-semibold capitalize tracking-tight font-primary mb-1 whitespace-nowrap">Status</span>
                              <span className={`px-4 py-1.5 rounded-full text-[12px] font-bold border capitalize shadow-sm ${getStatusColor(client.status)}`}>
                                {client.status}
                              </span>
                            </div>
                            <div className="hidden min-[1678px]:flex flex-col items-start min-w-[130px] border-l border-gray-100 pl-4 xl:pl-8">
                              <span className="text-[14px] text-gray-500 font-semibold capitalize tracking-tight font-primary mb-1 whitespace-nowrap">Since</span>
                              <span className="text-[15px] text-gray-700 font-bold flex items-center whitespace-nowrap">
                                <Calendar className="w-4 h-4 mr-1.5 text-orange-400" />
                                {client.created_at ? new Date(client.created_at).toLocaleDateString() : 'Recent'}
                              </span>
                            </div>
                          </div>

                          {/* Actions always visible now as requested */}
                          <div className="flex items-center gap-1">
                            <ActionGuard module="Client Management" type="read">
                              <button
                                onClick={() => openViewModal(client)}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-all hover:scale-110"
                                title="View Details"
                              >
                                <Eye size={18} />
                              </button>
                            </ActionGuard>
                            <ActionGuard module="Client Management" type="read">
                              <button
                                onClick={() => handleOpenInvoiceList(client)}
                                className="p-2 text-orange-600 hover:bg-orange-100 rounded-md transition-all hover:scale-110"
                                title="Generate Invoice"
                              >
                                <FileText size={18} />
                              </button>
                            </ActionGuard>
                            <ActionGuard permission="clients_edit" module="Client Management" type="update">
                              <button
                                onClick={() => openEditModal(client)}
                                className="p-2 text-green-600 hover:bg-green-100 rounded-md transition-all hover:scale-110"
                                title="Edit Client"
                              >
                                <SquarePen size={18} />
                              </button>
                            </ActionGuard>
                            <ActionGuard permission="clients_delete" module="Client Management" type="delete">
                              <button
                                onClick={() => openDeleteModal(client.id)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-all hover:scale-110"
                                title="Delete Client"
                              >
                                <Trash2 size={18} />
                              </button>
                            </ActionGuard>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </>
          )}

          {/* Pagination */}
          {pagination.totalPages > 0 && (
            <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4 bg-gray-50 p-4 rounded-sm border border-gray-200 shadow-sm">
              <p className="text-sm font-semibold text-gray-700">
                Showing <span className="text-orange-600 font-bold">{indexOfFirstItem + 1}</span> to <span className="text-orange-600 font-bold">{indexOfLastItem}</span> of <span className="text-orange-600 font-bold">{pagination.total}</span> Clients
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-sm font-bold transition flex items-center gap-1 ${currentPage === 1
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed border-gray-300 shadow-sm"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
                    }`}
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-10 h-10 rounded-sm font-bold transition border ${currentPage === pageNum
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md border-orange-500"
                          : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={handleNext}
                  disabled={currentPage === pagination.totalPages}
                  className={`px-4 py-2 rounded-sm font-bold transition flex items-center gap-1 ${currentPage === pagination.totalPages
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed border-gray-300 shadow-sm"
                    : "bg-[#FF7B1D] text-white hover:bg-orange-600 shadow-md transition-all font-primary text-xs uppercase tracking-widest px-6"
                    }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add/Edit Client Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-100 animate-slideUp">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-5 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  {isEditing ? <Edit2 size={24} /> : <Plus size={24} />}
                  {isEditing ? "Edit Client" : "Add New Client"}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all hover:rotate-90"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="overflow-y-auto max-h-[calc(90vh-90px)] custom-scrollbar">
                <form onSubmit={handleSubmit} className="p-8">
                  {/* Quotation Selection (New) */}
                  {!isEditing && (
                    <div className="mb-10 bg-orange-50 p-6 rounded-2xl border border-orange-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <FileCheck className="text-orange-600" size={24} />
                        <h3 className="text-lg font-bold text-orange-800">Import from Approved Quotation</h3>
                      </div>
                      <div className="relative">
                        <div className="relative">
                          <input
                            type="text"
                            value={quotationSearch}
                            onChange={(e) => {
                              setQuotationSearch(e.target.value);
                              setShowQuotationDropdown(true);
                            }}
                            onFocus={() => setShowQuotationDropdown(true)}
                            className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all pr-10 bg-white"
                            placeholder="Search by Quotation ID or Client Name..."
                          />
                          <Search className="absolute right-3 top-3.5 text-orange-400" size={20} />
                        </div>

                        {showQuotationDropdown && (
                          <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                            {(quotationsResponse?.quotations || []).map(q => (
                              <div
                                key={q.id}
                                onClick={() => handleSelectQuotation(q)}
                                className="p-4 hover:bg-orange-50 cursor-pointer border-b last:border-0 transition-colors"
                              >
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-[#FF7B1D] font-black text-sm">{q.quotation_id}</span>
                                  <span className="text-[10px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full uppercase tracking-tighter">₹{q.total_amount.toLocaleString()}</span>
                                </div>
                                <div className="text-sm font-bold text-gray-900">{q.client_name}</div>
                                <div className="text-[10px] text-gray-500 font-medium">{new Date(q.quotation_date).toLocaleDateString()}</div>
                              </div>
                            ))}
                            {quotationsResponse?.quotations?.length === 0 && (
                              <div className="p-4 text-center text-gray-500 text-sm">No approved quotations found</div>
                            )}
                          </div>
                        )}
                      </div>
                      {selectedQuotation && (
                        <div className="mt-4 flex items-center justify-between bg-white px-4 py-2 rounded-lg border border-orange-200">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="text-green-500" size={16} />
                            <span className="text-sm font-bold text-gray-700">Selected: <span className="text-orange-600">{selectedQuotation.quotation_id}</span></span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedQuotation(null)}
                            className="text-xs text-red-500 font-bold hover:underline"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                      <p className="mt-2 text-[11px] text-orange-600 font-bold italic">* Selecting a quotation will pre-fill this form for quick client creation.</p>
                    </div>
                  )}
                  {/* Client Type Selection */}
                  {!isEditing && (
                    <div className="mb-8">
                      <label className="block text-sm font-bold text-gray-700 mb-4 capitalize tracking-wider">
                        Client Type
                      </label>
                      <div className="flex gap-4">
                        <label
                          className={`flex items-center gap-4 flex-1 p-4 border rounded-sm cursor-pointer transition-all ${clientType === "person" ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:bg-gray-50"}`}
                        >
                          <input
                            type="radio"
                            name="clientType"
                            value="person"
                            checked={clientType === "person"}
                            onChange={(e) => setClientType(e.target.value)}
                            className="hidden" // Hiding default radio
                          />
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${clientType === "person" ? "border-orange-500" : "border-gray-300"}`}>
                            {clientType === "person" && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />}
                          </div>

                          <div
                            className={`p-3 rounded-sm ${clientType === "person"
                              ? "bg-blue-100 text-blue-600"
                              : "bg-gray-100 text-gray-400"
                              }`}
                          >
                            <User size={24} />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">Person</div>
                            <div className="text-xs text-gray-500">
                              Individual client account
                            </div>
                          </div>
                        </label>
                        <label
                          className={`flex items-center gap-4 flex-1 p-4 border rounded-sm cursor-pointer transition-all ${clientType === "organization" ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:bg-gray-50"}`}
                        >
                          <input
                            type="radio"
                            name="clientType"
                            value="organization"
                            checked={clientType === "organization"}
                            onChange={(e) => setClientType(e.target.value)}
                            className="hidden"
                          />
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${clientType === "organization" ? "border-orange-500" : "border-gray-300"}`}>
                            {clientType === "organization" && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />}
                          </div>

                          <div
                            className={`p-3 rounded-sm ${clientType === "organization"
                              ? "bg-purple-100 text-purple-600"
                              : "bg-gray-100 text-gray-400"
                              }`}
                          >
                            <Building2 size={24} />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">
                              Organization
                            </div>
                            <div className="text-xs text-gray-500">
                              Corporate/Company account
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Person Form */}
                  {clientType === "person" && (
                    <div className="animate-fadeIn">
                      <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 pb-2 border-b border-gray-100 uppercase tracking-tight">
                        <User className="text-[#FF7B1D]" size={20} /> Personal Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2 capitalize tracking-normal">
                            <User size={16} className="text-[#FF7B1D]" /> First Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-[#FF7B1D]/20 outline-none transition-all text-sm font-semibold"
                            required
                            placeholder="John"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2 capitalize tracking-normal">
                            <User size={16} className="text-[#FF7B1D]" /> Last Name
                          </label>
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-[#FF7B1D]/20 outline-none transition-all text-sm font-semibold"
                            placeholder="Doe"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2 capitalize tracking-normal">
                            <Mail size={16} className="text-[#FF7B1D]" /> Email Address <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-[#FF7B1D]/20 outline-none transition-all text-sm font-semibold"
                            required
                            placeholder="john@example.com"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2 capitalize tracking-normal">
                            <Phone size={16} className="text-[#FF7B1D]" /> Phone
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-[#FF7B1D]/20 outline-none transition-all text-sm font-semibold"
                            placeholder="+1 234 567 890"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2 capitalize tracking-normal">
                            <Building2 size={16} className="text-[#FF7B1D]" /> Company (if any)
                          </label>
                          <input
                            type="text"
                            name="company"
                            value={formData.company}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-[#FF7B1D]/20 outline-none transition-all text-sm font-semibold"
                            placeholder="Workplace name"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2 capitalize tracking-normal">
                            <Calendar size={16} className="text-[#FF7B1D]" /> Birthday
                          </label>
                          <input
                            type="date"
                            name="birthday"
                            value={formData.birthday}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-[#FF7B1D]/20 outline-none transition-all text-sm font-semibold"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Organization Form */}
                  {clientType === "organization" && (
                    <div className="animate-fadeIn">
                      <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 pb-2 border-b border-gray-100 uppercase tracking-tight">
                        <Building2 className="text-[#FF7B1D]" size={20} /> Organization Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 space-y-1.5">
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2 capitalize tracking-normal">
                            <Building2 size={16} className="text-[#FF7B1D]" /> Organization Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="orgName"
                            value={formData.orgName}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-[#FF7B1D]/20 outline-none transition-all text-sm font-semibold"
                            required
                            placeholder="Acme Corp"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2 capitalize tracking-normal">
                            <Mail size={16} className="text-[#FF7B1D]" /> Work Email <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            name="orgEmail"
                            value={formData.orgEmail}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-[#FF7B1D]/20 outline-none transition-all text-sm font-semibold"
                            required
                            placeholder="contact@acme.com"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2 capitalize tracking-normal">
                            <Phone size={16} className="text-[#FF7B1D]" /> Work Phone <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            name="orgPhone"
                            value={formData.orgPhone}
                            placeholder="+1 234 567 890"
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-[#FF7B1D]/20 outline-none transition-all text-sm font-semibold"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2 capitalize tracking-normal">
                            <Globe size={16} className="text-[#FF7B1D]" /> Website
                          </label>
                          <input
                            type="url"
                            name="website"
                            value={formData.website}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-[#FF7B1D]/20 outline-none transition-all text-sm font-semibold"
                            placeholder="https://example.com"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2 capitalize tracking-normal">
                            <Users size={16} className="text-[#FF7B1D]" /> Employees
                          </label>
                          <input
                            type="number"
                            name="employees"
                            value={formData.employees}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-[#FF7B1D]/20 outline-none transition-all text-sm font-semibold"
                            placeholder="e.g. 50"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Common Fields */}
                  <div className="mt-8 border-t pt-6">
                    <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 pb-2 border-b border-gray-100 uppercase tracking-tight">
                      <MapPin className="text-[#FF7B1D]" size={20} /> Communication & Address
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2 capitalize tracking-normal">
                          <Briefcase size={16} className="text-[#FF7B1D]" /> Category / Industry
                        </label>
                        <select
                          name="industry"
                          value={formData.industry}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-[#FF7B1D]/20 bg-white cursor-pointer outline-none text-sm font-semibold"
                        >
                          <option value="">Select industry</option>
                          <option value="technology">Technology</option>
                          <option value="healthcare">Healthcare</option>
                          <option value="finance">Finance</option>
                          <option value="manufacturing">Manufacturing</option>
                          <option value="retail">Retail</option>
                          <option value="education">Education</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2 capitalize tracking-normal">
                          <Globe size={16} className="text-[#FF7B1D]" /> Source
                        </label>
                        <select
                          name="source"
                          value={formData.source}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-[#FF7B1D]/20 cursor-pointer outline-none bg-white text-sm font-semibold"
                        >
                          <option value="">Select source</option>
                          <option value="website">Website</option>
                          <option value="referral">Referral</option>
                          <option value="social">Social Media</option>
                          <option value="cold-call">Cold Call</option>
                          <option value="event">Event</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2 capitalize tracking-normal">
                          <FileText size={16} className="text-[#FF7B1D]" /> Tax ID / GSTIN
                        </label>
                        <input type="text" name="taxId" value={formData.taxId} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-[#FF7B1D]/20 outline-none text-sm font-semibold" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2 capitalize tracking-normal">
                          <CheckCircle size={16} className="text-[#FF7B1D]" /> Status
                        </label>
                        <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-[#FF7B1D]/20 outline-none bg-white text-sm font-semibold">
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="pending">Pending</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2 capitalize tracking-normal">
                          <MapPin size={16} className="text-[#FF7B1D]" /> Street Address
                        </label>
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          rows="2"
                          className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-[#FF7B1D]/20 outline-none text-sm font-semibold"
                          placeholder="123 Main St..."
                        ></textarea>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                        {/* Country */}
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2 capitalize tracking-normal">Country</label>

                          <div className="relative">
                            <select
                              name="permanentCountry"
                              value={formData.permanentCountry || ""}
                              onChange={handlePermanentAddressChange}
                              className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-[#FF7B1D]/20 outline-none transition-all text-sm font-semibold bg-white"
                            >
                              <option value="">Select Country</option>

                              {Country.getAllCountries().map((country) => (
                                <option key={country.isoCode} value={country.isoCode}>
                                  {country.name}
                                </option>
                              ))}
                            </select>

                            <ChevronDown
                              size={18}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                            />
                          </div>
                        </div>

                        {/* State */}
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2 capitalize tracking-normal">State</label>

                          <div className="relative">
                            <select
                              name="permanentState"
                              value={formData.permanentState || ""}
                              onChange={handlePermanentAddressChange}
                              className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-[#FF7B1D]/20 outline-none transition-all text-sm font-semibold bg-white"
                            >
                              <option value="">Select State</option>

                              {State.getStatesOfCountry(formData.permanentCountry || "")?.map(
                                (state) => (
                                  <option key={state.isoCode} value={state.isoCode}>
                                    {state.name}
                                  </option>
                                )
                              )}
                            </select>

                            <ChevronDown
                              size={18}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                            />
                          </div>
                        </div>

                        {/* City */}
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2 capitalize tracking-normal">City</label>

                          <div className="relative">
                            <select
                              name="permanentCity"
                              value={formData.permanentCity || ""}
                              onChange={handlePermanentAddressChange}
                              className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-[#FF7B1D]/20 outline-none transition-all text-sm font-semibold bg-white"
                            >
                              <option value="">Select City</option>

                              {City.getCitiesOfState(
                                formData.permanentCountry || "",
                                formData.permanentState || ""
                              )?.map((city) => (
                                <option key={city.name} value={city.name}>
                                  {city.name}
                                </option>
                              ))}
                            </select>

                            <ChevronDown
                              size={18}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                            />
                          </div>
                        </div>

                        {/* Zip Code */}
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2 capitalize tracking-normal">Zip Code</label>
                          <input
                            type="text"
                            name="zipCode"
                            value={formData.zipCode || ""}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-[#FF7B1D]/20 outline-none transition-all text-sm font-semibold"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 mt-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2 capitalize tracking-normal">Internal Notes</label>
                        <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows="3" className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-[#FF7B1D]/20 outline-none text-sm font-semibold" placeholder="Any private notes about this client..." />
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 flex justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-sm -mx-8 -mb-8">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-6 py-2.5 rounded-sm border-2 border-gray-200 text-gray-500 font-bold hover:bg-gray-50 hover:text-gray-700 transition-all font-primary text-sm bg-white shadow-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreating || isUpdating}
                      className="px-8 py-2.5 rounded-sm font-bold transition-all font-primary text-sm flex items-center gap-2 shadow-md bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-orange-500/30 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {(isCreating || isUpdating) ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        isEditing ? <Check size={18} /> : <Plus size={18} />
                      )}
                      {isEditing ? "Update Client" : "Create Client"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          headerVariant="simple"
          maxWidth="max-w-md"
          footer={
            <div className="flex gap-4 w-full">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 font-bold rounded-sm hover:bg-gray-100 transition-all font-primary text-xs capitalize tracking-normal bg-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteClient}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 bg-red-600 text-white font-bold rounded-sm hover:bg-red-700 transition-all shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 disabled:opacity-50 font-primary text-xs capitalize tracking-normal"
              >
                {isDeleting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Trash2 size={20} />
                )}
                {isDeleting ? "Deleting..." : "Delete Now"}
              </button>
            </div>
          }
        >
          <div className="flex flex-col items-center text-center text-black font-primary">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <AlertCircle size={48} className="text-red-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Confirm {isBulkDelete ? "Bulk Delete" : "Delete"}
            </h2>

            <p className="text-gray-600 mb-2 leading-relaxed">
              {isBulkDelete
                ? `Are you sure you want to delete ${selectedClients.size} selected clients?`
                : "Are you sure you want to delete this client?"}
            </p>

            <p className="text-xs text-red-500 italic">
              This action cannot be undone. All associated data will be permanently removed.
            </p>
          </div>
        </Modal>

        {/* View Client Modal - Removed in favor of Profile Page */}
        {/* <ViewClientModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          client={clientToView}
        /> */}

        {/* Call QR Modal */}
        <CallQrModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          lead={qrClient}
          onProceedToLog={handleProceedToLog}
          onViewProfile={() => openViewModal(qrClient)}
        />

        {/* Call Action Form (Call Log) */}
        {showCallAction && (
          <CallActionPopup
            isOpen={showCallAction}
            onClose={() => setShowCallAction(false)}
            lead={qrClient}
            onHitCall={handleCallHit}
            initialResponse="connected"
          />
        )}
      </div>
      {/* Floating Action Bar for Selected Clients */}
      {
        selectedClients.size > 0 && (
          <div className="fixed bottom-10 inset-x-0 z-[100] flex justify-center px-4 animate-slideUp">
            <div className="bg-white/95 backdrop-blur-xl border border-gray-200 rounded-sm shadow-[0_30px_70px_rgba(0,0,0,0.25)] flex items-center gap-8 px-8 py-4 flex-wrap md:flex-nowrap justify-between max-w-fit mx-auto">
              <div className="flex items-center gap-4 border-r border-gray-200 pr-8">
                <div className="bg-white px-4 py-1.5 rounded-full border border-orange-300 shadow-sm">
                  <span className="text-[#FF7B1D] font-black text-sm">
                    {selectedClients.size} Selected
                  </span>
                </div>
                <button
                  onClick={deselectAll}
                  className="text-sm text-gray-400 hover:text-orange-600 font-bold underline transition-colors decoration-gray-300 hover:decoration-orange-600 underline-offset-4"
                >
                  Clear Selection
                </button>
                {selectedClients.size < clients.length && (
                  <button
                    onClick={selectAll}
                    className="text-sm text-gray-400 hover:text-orange-600 font-bold underline transition-colors decoration-gray-300 hover:decoration-orange-600 underline-offset-4"
                  >
                    Select All
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4">
                <ActionGuard permission="clients_read" module="Client Management" type="read">
                  <button className="flex items-center gap-2.5 px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-sm hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition-all font-bold text-sm shadow-sm active:scale-95">
                    <Mail size={18} className="text-orange-500" />
                    Email Selected
                  </button>
                </ActionGuard>
                <ActionGuard permission="clients_read" module="Client Management" type="read">
                  <button className="flex items-center gap-2.5 px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-sm hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition-all font-bold text-sm shadow-sm active:scale-95">
                    <Download size={18} className="text-orange-500" />
                    Export Selected
                  </button>
                </ActionGuard>
                <ActionGuard permission="clients_delete" module="Client Management" type="delete">
                  <button
                    onClick={openBulkDeleteModal}
                    className="flex items-center gap-2.5 px-6 py-2.5 bg-red-600 text-white rounded-sm hover:bg-red-700 transition-all font-bold text-sm shadow-md active:scale-95"
                  >
                    <Trash2 size={18} />
                    Delete Selected
                  </button>
                </ActionGuard>
              </div>
            </div>
          </div>
        )
      }

      {/* Global Animations Style */}
      <style>
        {`
        @keyframes slideUp {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slideUp {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}
      </style>

      <ClientInvoicesModal
        isOpen={isInvoiceListModalOpen}
        onClose={() => setIsInvoiceListModalOpen(false)}
        client={selectedClientForInvoices}
        onGenerateInvoice={handleGenerateInvoiceFromList}
      />

      <CreateInvoiceModal
        showModal={showCreateInvoiceModal}
        setShowModal={setShowCreateInvoiceModal}
        formData={invoiceFormData}
        setFormData={setInvoiceFormData}
        handleInputChange={handleInvoiceInputChange}
        handleCreateInvoice={handleCreateInvoiceSubmit}
      />
    </DashboardLayout >
  );
}


