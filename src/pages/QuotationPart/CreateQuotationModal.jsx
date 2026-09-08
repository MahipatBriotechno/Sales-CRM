import React, { useEffect, useState, useRef } from "react";
import { X, Plus, Trash2, Search, User, Building2, Tag, Calendar, Hash, Mail, Phone, Building, FileText, CheckCircle, MapPin, UserCheck, Briefcase, CreditCard, ScrollText, FileCheck } from "lucide-react";
import { useGetCatalogsQuery } from "../../store/api/catalogApi";
import { useGetBusinessInfoQuery } from "../../store/api/businessApi";
import { useGetClientsQuery } from "../../store/api/clientApi";
import Modal from "../../components/common/Modal";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

export default function CreateQuotationModal({
  showModal,
  setShowModal,
  formData,
  handleInputChange,
  handleCreateQuotation,
  setFormData,
}) {
  const [activeItemSearchId, setActiveItemSearchId] = useState(null);
  const [clientSearch, setClientSearch] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const itemDropdownRef = useRef(null);
  const clientDropdownRef = useRef(null);

  const { user } = useSelector((state) => state.auth);

  const { data: catalogsData } = useGetCatalogsQuery({ limit: 100, status: 'Active' });
  const { data: businessInfo } = useGetBusinessInfoQuery();
  const { data: clientsData } = useGetClientsQuery({ status: 'active' });

  const catalogs = catalogsData?.catalogs || [];
  const clients = clientsData?.data || [];

  useEffect(() => {
    if (showModal && !formData.id && !formData.salesExecutive && user) {
      const executiveName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || '';
      if (executiveName) {
        setFormData(prev => ({
          ...prev,
          salesExecutive: executiveName
        }));
      }
    }
  }, [showModal, user, formData.id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (itemDropdownRef.current && !itemDropdownRef.current.contains(event.target)) {
        setActiveItemSearchId(null);
      }
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target)) {
        setShowClientDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Automatic calculation effect
  useEffect(() => {
    const subtotal = formData.lineItems.reduce((sum, item) => sum + (item.total || 0), 0);
    const taxAmount = (subtotal * (parseFloat(formData.tax) || 0)) / 100;
    const totalAmount = subtotal + taxAmount - (parseFloat(formData.discount) || 0);

    if (subtotal !== formData.subtotal || totalAmount !== formData.totalAmount) {
      setFormData(prev => ({
        ...prev,
        subtotal,
        totalAmount
      }));
    }
  }, [formData.lineItems, formData.tax, formData.discount]);

  const inputStyles = "w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none transition-all text-sm text-gray-900 placeholder-gray-400 bg-white hover:border-gray-300 shadow-sm";

  const addLineItem = () => {
    setFormData((prev) => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        { id: Date.now(), name: "", qty: 1, rate: 0, total: 0, minPrice: 0, maxPrice: 0 },
      ],
    }));
  };

  const removeLineItem = (id) => {
    setFormData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((item) => item.id !== id),
    }));
  };

  const updateLineItem = (id, field, value) => {
    setFormData((prev) => {
      const newLineItems = prev.lineItems.map((item) => {
        if (item.id === id) {
          let newValue = value;
          if (field === "qty" || field === "rate") {
            newValue = Math.max(0, parseFloat(value) || 0);
          }

          if (field === "rate") {
            if (item.minPrice !== undefined && item.minPrice > 0 && newValue < item.minPrice) {
              newValue = item.minPrice;
              toast.error(`Min price: ₹${item.minPrice}`);
            }
            if (item.maxPrice !== undefined && item.maxPrice > 0 && newValue > item.maxPrice) {
              newValue = item.maxPrice;
              toast.error(`Max price: ₹${item.maxPrice}`);
            }
          }

          const updatedItem = { ...item, [field]: newValue };
          if (field === "qty" || field === "rate") {
            updatedItem.total = (parseFloat(updatedItem.qty) || 0) * (parseFloat(updatedItem.rate) || 0);
          }
          return updatedItem;
        }
        return item;
      });
      return { ...prev, lineItems: newLineItems };
    });
  };

  const handleSelectCatalogItem = (item, lineItemId) => {
    setFormData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((li) => {
        if (li.id === lineItemId) {
          const rate = parseFloat(item.minPrice) || parseFloat(item.price) || parseFloat(item.rate) || 0;
          return {
            ...li,
            name: item.name,
            rate: rate,
            minPrice: parseFloat(item.minPrice) || 0,
            maxPrice: parseFloat(item.maxPrice) || 0,
            total: (li.qty || 1) * rate
          };
        }
        return li;
      })
    }));
    setActiveItemSearchId(null);
  };

  const handleSelectClient = (client) => {
    const name = client.type === 'person' ? `${client.first_name} ${client.last_name || ''}` : client.company_name;
    setFormData(prev => ({
      ...prev,
      companyName: name,
      contactPerson: client.type === 'business' ? `${client.first_name} ${client.last_name || ''}` : "",
      email: client.email || "",
      phone: client.phone || "",
      billingAddress: client.address || "",
      state: client.state || prev.state,
      pincode: client.zip_code || client.pincode || prev.pincode,
      gstin: client.tax_id || "",
      customerType: client.type === 'person' ? 'Individual' : 'Business',
    }));
    setClientSearch(name);
    setShowClientDropdown(false);
  };

  const validateAndSubmit = () => {
    if (formData.customerType === "Business" && !formData.companyName) return toast.error("Company Name is required");
    if (formData.customerType === "Individual" && !formData.companyName) return toast.error("Full Name is required");
    if (!formData.phone) return toast.error("Mobile Number is required");
    if (!formData.email) return toast.error("Email ID is required");
    if (!formData.billingAddress) return toast.error("Address is required");
    if (!formData.state) return toast.error("State is required");
    if (!formData.pincode) return toast.error("Pincode is required");

    if (formData.lineItems.length === 0) return toast.error("At least one item is required");
    const invalidItem = formData.lineItems.find(item => !item.name || item.rate <= 0 || item.qty <= 0);
    if (invalidItem) return toast.error("Please fill all item details correctly");

    handleCreateQuotation();
  };

  const filteredClients = clients.filter(c => {
    const name = c.type === 'person' ? `${c.first_name} ${c.last_name || ''}` : c.company_name;
    return name?.toLowerCase().includes(clientSearch.toLowerCase()) || c.email?.toLowerCase().includes(clientSearch.toLowerCase());
  });

  const footer = (
    <div className="flex gap-4 w-full">
      <button
        type="button"
        onClick={() => setShowModal(false)}
        className="flex-1 px-8 py-3 bg-white border border-gray-300 rounded-sm hover:bg-gray-50 font-bold text-gray-700 transition-all text-sm uppercase tracking-widest"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={validateAndSubmit}
        className="flex-1 px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-sm hover:from-orange-600 hover:to-orange-700 font-bold shadow-md transition-all text-sm uppercase tracking-widest active:scale-95 flex items-center justify-center gap-2"
      >
        {formData.id ? <><FileCheck size={18} /> Update Quotation</> : <><Plus size={18} /> Create Quotation</>}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      title={formData.id ? "Edit Quotation" : "New Quotation"}
      subtitle="Create/Edit dynamic quotation with automated calculations"
      icon={<FileText size={20} />}
      maxWidth="max-w-5xl"
      footer={footer}
    >
      <div className="space-y-6 pb-4">
        {/* Top Section: Quotation Info & Client Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Quotation Identity Card */}
          <div className="bg-slate-50 p-5 rounded-sm border border-slate-100 h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                <Hash size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest leading-none">Quotation Basis</h3>
                <p className="text-[10px] text-gray-500 mt-1 uppercase font-semibold">Identity & Validity</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  <Hash size={14} className="text-[#FF7B1D]" />
                  Quotation #
                </label>
                <input
                  type="text"
                  name="quotationNo"
                  value={formData.quotationNo}
                  readOnly
                  className={`${inputStyles} bg-white/50 text-orange-600 font-bold border-orange-100 cursor-not-allowed`}
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  <Calendar size={14} className="text-[#FF7B1D]" />
                  Quotation Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="quotationDate"
                  value={formData.quotationDate}
                  onChange={handleInputChange}
                  className={inputStyles}
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  <Calendar size={14} className="text-[#FF7B1D]" />
                  Valid Until
                </label>
                <input
                  type="date"
                  name="validUntil"
                  value={formData.validUntil}
                  onChange={handleInputChange}
                  className={inputStyles}
                />
              </div>
              <div className="col-span-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  <CheckCircle size={14} className="text-[#FF7B1D]" />
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className={`${inputStyles} font-bold ${formData.status === 'Draft' ? 'text-gray-500' : formData.status === 'Sent' ? 'text-blue-500' : 'text-green-600'}`}
                >
                  <option value="Draft">Draft</option>
                  <option value="Sent">Sent</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Client Type & Executive Card */}
          <div className="bg-blue-50/30 p-5 rounded-sm border border-blue-50 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <User size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest leading-none">Client & Sales</h3>
                <p className="text-[10px] text-gray-500 mt-1 uppercase font-semibold">Classification</p>
              </div>
            </div>

            <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm mb-6">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, customerType: "Business" }))}
                className={`flex-1 py-2 rounded-md text-[11px] font-bold transition-all ${formData.customerType === "Business"
                  ? "bg-blue-600 text-white shadow-md font-black"
                  : "text-gray-400 hover:bg-gray-50"
                  }`}
              >
                Business (B2B)
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, customerType: "Individual" }))}
                className={`flex-1 py-2 rounded-md text-[11px] font-bold transition-all ${formData.customerType === "Individual"
                  ? "bg-blue-600 text-white shadow-md font-black"
                  : "text-gray-400 hover:bg-gray-50"
                  }`}
              >
                Individual (B2C)
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  <UserCheck size={14} className="text-orange-500" />
                  Sales Executive
                </label>
                <input
                  type="text"
                  name="salesExecutive"
                  value={formData.salesExecutive}
                  onChange={handleInputChange}
                  className={inputStyles}
                  placeholder="Enter executive name"
                />
              </div>
              <div className="flex-1 flex items-center justify-center p-4 bg-white/50 rounded-lg border-2 border-dashed border-gray-200 mt-2">
                <p className="text-[11px] font-bold text-gray-400 text-center uppercase tracking-widest">
                  {formData.customerType === "Business" ? "Enterprise Mode" : "Retail Mode"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Client Details Section */}
        <section className="bg-white border border-gray-200 rounded-sm p-6 space-y-6 shadow-sm">
          <div className="flex items-center gap-2.5 pb-3 border-b border-gray-50">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <Building2 size={18} />
            </div>
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-[0.1em]">
              Client Information
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 relative" ref={clientDropdownRef}>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2 uppercase">
                <User size={14} className="text-[#FF7B1D]" />
                {formData.customerType === "Business" ? "Company Name" : "Customer Name"} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={(e) => {
                    handleInputChange(e);
                    setClientSearch(e.target.value);
                    setShowClientDropdown(true);
                  }}
                  onFocus={() => setShowClientDropdown(true)}
                  className={inputStyles}
                  placeholder={formData.customerType === "Business" ? "Search business..." : "Search name..."}
                />
                <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>

              {showClientDropdown && filteredClients.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                  <div className="p-2 bg-gray-50 border-b text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Existing Database</div>
                  {filteredClients.map(client => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => handleSelectClient(client)}
                      className="w-full px-4 py-3 text-left hover:bg-orange-50 flex items-center justify-between border-b border-gray-50 last:border-0 transition-colors group"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-gray-800 group-hover:text-orange-600 truncate">
                          {client.type === 'person' ? `${client.first_name} ${client.last_name || ''}` : client.company_name}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate">{client.email}</div>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${client.type === 'person' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                        {client.type === 'person' ? 'Ind' : 'Biz'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {formData.customerType === "Business" && (
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2 uppercase">
                  <UserCheck size={14} className="text-[#FF7B1D]" />
                  Contact Person <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  className={inputStyles}
                  placeholder="Person name"
                />
              </div>
            )}

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2 uppercase">
                <Phone size={14} className="text-[#FF7B1D]" />
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={inputStyles}
                placeholder="10-digit number"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2 uppercase">
                <Mail size={14} className="text-[#FF7B1D]" />
                Email ID <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={inputStyles}
                placeholder="client@mail.com"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2 uppercase">
                <MapPin size={14} className="text-[#FF7B1D]" />
                Billing Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="billingAddress"
                value={formData.billingAddress}
                onChange={handleInputChange}
                className={inputStyles}
                placeholder="Full address details"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2 uppercase">
                <Building size={14} className="text-[#FF7B1D]" />
                State <span className="text-red-500">*</span>
              </label>
              <select
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className={`${inputStyles} cursor-pointer`}
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2 uppercase">
                <MapPin size={14} className="text-[#FF7B1D]" />
                Pincode <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleInputChange}
                className={inputStyles}
                placeholder="6-digit pin"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2 uppercase">
                <Tag size={14} className="text-[#FF7B1D]" />
                GSTIN {formData.customerType === "Business" && "(Required for B2B)"}
              </label>
              <input
                type="text"
                name="gstin"
                value={formData.gstin}
                onChange={handleInputChange}
                className={inputStyles}
                placeholder="22AAAAA0000A1Z5"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2 uppercase">
                <CreditCard size={14} className="text-[#FF7B1D]" />
                PAN Number
              </label>
              <input
                type="text"
                name="pan"
                value={formData.pan}
                onChange={handleInputChange}
                className={inputStyles}
                placeholder="ABCDE1234F"
              />
            </div>

            {formData.customerType === "Business" && (
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2 uppercase">
                  <Briefcase size={14} className="text-[#FF7B1D]" />
                  CIN / MSME
                </label>
                <input
                  type="text"
                  name="cin"
                  value={formData.cin}
                  onChange={handleInputChange}
                  className={inputStyles}
                  placeholder="Reg number"
                />
              </div>
            )}

            <div className="md:col-span-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2 uppercase">
                <MapPin size={14} className="text-[#FF7B1D]" />
                Shipping Address (Leave blank if same as billing)
              </label>
              <input
                type="text"
                name="shippingAddress"
                value={formData.shippingAddress}
                onChange={handleInputChange}
                className={inputStyles}
                placeholder="Delivery location if different"
              />
            </div>
          </div>
        </section>

        {/* Item Management Section */}
        <section className="bg-white border border-gray-200 rounded-sm p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-gray-50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                <Plus size={18} />
              </div>
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-[0.1em]">
                Line Items
              </h3>
            </div>
            <button
              type="button"
              onClick={addLineItem}
              className="bg-[#FF7B1D] text-white px-4 py-2 capitalize rounded-sm text-[11px] font-black tracking-widest shadow-md hover:bg-[#e06a19] transition-all flex items-center gap-2"
            >
              <Plus size={16} /> Add New Item
            </button>
          </div>

          <div className="border border-gray-200 rounded-sm bg-slate-50/30">
            <table className="w-full text-sm">
              <thead className="bg-white text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-100">
                <tr>
                  <th className="px-4 py-4 text-left w-12">#</th>
                  <th className="px-4 py-4 text-left">Item Description</th>
                  <th className="px-4 py-4 text-center w-24">Qty</th>
                  <th className="px-4 py-4 text-right w-36">Rate</th>
                  <th className="px-4 py-4 text-right w-36">Total</th>
                  <th className="px-4 py-4 text-center w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {formData.lineItems.map((item, index) => (
                  <tr key={item.id} className="group hover:bg-white transition-colors">
                    <td className="px-4 py-4 font-bold text-gray-400 text-xs">{index + 1}</td>
                    <td className="px-2 py-4 relative">
                      <div className="relative group/search">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/search:text-orange-500 transition-colors" />
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => {
                            updateLineItem(item.id, "name", e.target.value);
                            setActiveItemSearchId(item.id);
                          }}
                          onFocus={() => setActiveItemSearchId(item.id)}
                          className="w-full pl-9 pr-3 py-2 border-transparent border-b group-hover:border-gray-200 focus:border-orange-500 bg-transparent outline-none rounded text-xs font-bold text-gray-800"
                          placeholder="Search catalog items..."
                        />
                      </div>

                      {activeItemSearchId === item.id && (
                        <div ref={itemDropdownRef} className="absolute z-50 left-0 mt-2 w-[450px] bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden max-h-72 overflow-y-auto ring-1 ring-black/5">
                          <div className="p-2.5 bg-gray-50 border-b text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Available Stock / Services</div>
                          {catalogs.filter(c => c.name.toLowerCase().includes(item.name.toLowerCase())).length > 0 ? (
                            catalogs.filter(c => c.name.toLowerCase().includes(item.name.toLowerCase())).map(cat => (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => handleSelectCatalogItem(cat, item.id)}
                                className="w-full p-4 hover:bg-orange-50 border-b border-gray-50 last:border-0 flex justify-between items-center transition-colors group/item text-left"
                              >
                                <div>
                                  <div className="text-xs font-black text-gray-800 group-hover/item:text-orange-600 uppercase tracking-wide">
                                    {cat.name?.length > 50 ? `${cat.name.substring(0, 50)}...` : cat.name}
                                  </div>
                                  <div className="text-[10px] text-gray-400 mt-1 font-bold italic">{cat.category || 'Standard Sales'} • {cat.sku || 'N/A'}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs font-black text-orange-600">₹{parseFloat(cat.minPrice || cat.price || 0).toLocaleString()}</div>
                                  <div className="text-[9px] text-gray-300 font-bold uppercase">Base Price</div>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="p-8 text-center text-xs text-gray-400 italic">No matching items found</div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-4">
                      <input
                        type="number"
                        value={item.qty}
                        onChange={(e) => updateLineItem(item.id, "qty", e.target.value)}
                        className="w-full px-2 py-2 border border-transparent focus:border-orange-200 focus:bg-white bg-transparent outline-none rounded text-xs text-center font-bold text-gray-700"
                      />
                    </td>
                    <td className="px-2 py-4">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300 uppercase">₹</span>
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => updateLineItem(item.id, "rate", e.target.value)}
                          className="w-full pl-6 pr-2 py-2 border border-transparent focus:border-orange-200 focus:bg-white bg-transparent outline-none rounded text-xs text-right font-bold text-gray-700"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right font-black text-gray-900 text-xs italic bg-slate-50/50">
                      ₹{(item.total || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => removeLineItem(item.id)}
                        className="text-gray-300 hover:text-red-500 transition-all p-1.5 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}

                {formData.lineItems.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Plus size={32} className="text-gray-200" />
                        <p className="text-gray-400 italic font-bold text-xs uppercase tracking-widest">Your items will appear here</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
            <div className="bg-slate-50 p-6 rounded-sm border border-slate-100 space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <Tag size={16} className="text-orange-500" />
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Adjustments</h4>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tax Rate (%)</label>
                  <div className="relative group">
                    <input
                      type="number"
                      name="tax"
                      value={formData.tax}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded shadow-sm focus:border-orange-500 outline-none text-sm font-black transition-all"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Direct Discount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      name="discount"
                      value={formData.discount}
                      onChange={handleInputChange}
                      className="w-full px-7 py-2.5 bg-white border border-gray-200 rounded shadow-sm focus:border-red-500 outline-none text-sm font-black text-red-500 transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#1a202c] p-8 rounded-sm text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-orange-500/20 transition-all duration-700"></div>

              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-center text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                  <span>Subtotal</span>
                  <span className="text-gray-200">₹{(formData.subtotal || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                  <span>GST/Tax ({formData.tax || 0}%)</span>
                  <span className="text-gray-200">₹{(((formData.subtotal || 0) * (formData.tax || 0)) / 100).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black text-red-400 uppercase tracking-[0.2em] pb-4 border-b border-white/10">
                  <span>Total Discount</span>
                  <span>- ₹{(formData.discount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Net Payable</span>
                  <span className="text-4xl font-black text-orange-500 tracking-tighter">₹{(formData.totalAmount || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Terms Section */}
        <section className="bg-white border border-gray-200 rounded-sm p-6 space-y-6 shadow-sm">
          <div className="flex items-center gap-2.5 pb-3 border-b border-gray-50">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <ScrollText size={18} />
            </div>
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-[0.1em]">
              Specific Instructions / Notes
            </h3>
          </div>

          <div className="w-full">
            <textarea
              name="terms_and_conditions"
              value={formData.terms_and_conditions}
              onChange={handleInputChange}
              rows="4"
              className={`${inputStyles} py-4 border-gray-200 shadow-sm resize-none italic font-medium leading-relaxed`}
              placeholder="Type your quotation terms or special delivery notes here..."
            />
          </div>
        </section>
      </div>

      <style jsx>{`
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
    </Modal>
  );
}
