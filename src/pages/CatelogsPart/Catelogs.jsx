import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { FiHome } from "react-icons/fi";
import DashboardLayout from "../../components/DashboardLayout";
import {
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Eye,
  X,
  Upload,
  Package,
  DollarSign,
  Grid3x3,
  Grid,
  FileDown,
  Share,
  Target,
  Handshake,
  Users,
  CheckCircle,
  Copy,
  LayoutGrid,
  AlertCircle,
  Tag,
  Check,
  ChevronDown,
  Image,
  FileText,
  Clock,
  Calendar,
  Zap,
  Settings,
} from "lucide-react";
import { toast } from "react-hot-toast";
import NumberCard from "../../components/NumberCard";
import Modal from "../../components/common/Modal";
import {
  useGetCatalogsQuery,
  useCreateCatalogMutation,
  useUpdateCatalogMutation,
  useDeleteCatalogMutation,
} from "../../store/api/catalogApi";
import { useGetHRMDashboardDataQuery } from "../../store/api/hrmDashboardApi";
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
} from "../../store/api/catalogCategoryApi";
import usePermission from "../../hooks/usePermission";
import ViewCatalogModal from "./ViewCatalogModal";
import { useGetBusinessInfoQuery } from "../../store/api/businessApi";
import ActionGuard from "../../components/common/ActionGuard";

const DESC_LIMIT = 1500;
const CAT_LIMIT = 100;

export default function CatalogsPage() {
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCatalog, setSelectedCatalog] = useState(null);
  const [catalogToDelete, setCatalogToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [tempStatuses, setTempStatuses] = useState([]);
  const [tempCategories, setTempCategories] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [deliveryValue, setDeliveryValue] = useState("");
  const [deliveryUnit, setDeliveryUnit] = useState("Days");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  const dropdownRef = React.useRef(null);
  const categoryDropdownRef = React.useRef(null);
  const { create, read, update, delete: canDelete } = usePermission("Catalog");
  const itemsPerPage = 6;

  const { data, isLoading, refetch } = useGetCatalogsQuery({
    page: currentPage,
    limit: itemsPerPage,
    status: statusFilter === "All" ? "" : statusFilter,
    category: categoryFilter === "All" ? "" : categoryFilter,
    search: searchTerm,
  });

  useEffect(() => {
    refetch();
  }, [statusFilter, categoryFilter, searchTerm, currentPage, refetch]);

  const { data: categoriesData, refetch: refetchCategories } = useGetCategoriesQuery({ status: 'Active', limit: 1000 });
  const dbCategories = categoriesData?.categories || [];

  const { data: dashboardData } = useGetHRMDashboardDataQuery();
  const { data: businessInfo } = useGetBusinessInfoQuery();
  const [createCatalog] = useCreateCatalogMutation();
  const [updateCatalog] = useUpdateCatalogMutation();
  const [deleteCatalog] = useDeleteCatalogMutation();

  const [createCategory, { isLoading: isCreatingCategory }] = useCreateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const catalogs = data?.catalogs || [];
  const pagination = data?.pagination || {};

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    vendor: "",
    description: "",
    minPrice: "",
    maxPrice: "",
    status: "Active",
    image: null,
    deliveryTime: "",
    features: [""],
    specifications: [{ key: "", value: "" }],
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'description' && value.length > DESC_LIMIT) return;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validation: Less than 1MB
      if (file.size > 1024 * 1024) {
        toast.error("File size must be less than 1MB");
        e.target.value = null;
        return;
      }

      // Validation: Allowed formats
      const allowedTypes = ["image/jpeg", "image/png", "image/svg+xml"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only PNG, JPG, or SVG files are allowed");
        e.target.value = null;
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData({ ...formData, image: file });
      };
      reader.readAsDataURL(file);
    }
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ""] });
  };

  const updateFeature = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const removeFeature = (index) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures.length ? newFeatures : [""] });
  };

  const addSpec = () => {
    setFormData({ ...formData, specifications: [...formData.specifications, { key: "", value: "" }] });
  };

  const updateSpec = (index, field, value) => {
    const newSpecs = [...formData.specifications];
    newSpecs[index][field] = value;
    setFormData({ ...formData, specifications: newSpecs });
  };

  const removeSpec = (index) => {
    const newSpecs = formData.specifications.filter((_, i) => i !== index);
    setFormData({ ...formData, specifications: newSpecs.length ? newSpecs : [{ key: "", value: "" }] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.description.length > DESC_LIMIT) {
      toast.error(`Description cannot exceed ${DESC_LIMIT} characters`);
      return;
    }

    try {
      const data = new FormData();

      // Essential fields
      const fields = [
        'name', 'category', 'vendor', 'description',
        'minPrice', 'maxPrice', 'status', 'deliveryTime'
      ];

      fields.forEach(field => {
        if (formData[field] !== undefined && formData[field] !== null) {
          let value = formData[field];
          // Handle price fields specifically
          if ((field === 'minPrice' || field === 'maxPrice') && value === "") {
            value = "0";
          }
          data.append(field, value);
        }
      });

      // Special handling for JSON fields
      data.append('features', JSON.stringify(formData.features.filter(f => f.trim() !== "")));

      const specObj = {};
      formData.specifications.forEach(s => {
        if (s.key.trim()) specObj[s.key.trim()] = s.value;
      });
      data.append('specifications', JSON.stringify(specObj));

      // Image handling
      if (formData.image instanceof File) {
        data.append('image', formData.image);
      } else if (typeof formData.image === 'string') {
        data.append('image', formData.image);
      }

      // Default empty images array
      data.append('images', JSON.stringify([]));

      if (formData.id) {
        await updateCatalog({ id: formData.id, data }).unwrap();
        toast.success("Catalog updated successfully!");
      } else {
        await createCatalog(data).unwrap();
        toast.success("Catalog added successfully!");
      }

      refetch();
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      toast.error("Error saving catalog: " + (err?.data?.message || err.message));
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      vendor: "",
      description: "",
      minPrice: "",
      maxPrice: "",
      status: "Active",
      image: null,
      deliveryTime: "",
      features: [""],
      specifications: [{ key: "", value: "" }],
    });
    setImagePreview(null);
    setDeliveryValue("");
    setDeliveryUnit("Days");
    setIsAddingCategory(false);
    setNewCategoryName("");
    setIsCategoryDropdownOpen(false);
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleDelete = (catalog) => {
    setCatalogToDelete(catalog);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteCatalog(catalogToDelete.id).unwrap();
      toast.success("Catalog deleted successfully!");
      setShowDeleteModal(false);
    } catch (err) {
      toast.error("Error deleting catalog: " + (err?.data?.message || err.message));
    }
  };

  const handleEdit = (catalog) => {
    // Convert specifications object back to array for frontend
    const specArray = catalog.specifications ? Object.entries(catalog.specifications).map(([key, value]) => ({ key, value })) : [{ key: "", value: "" }];

    setFormData({
      ...catalog,
      features: (catalog.features && catalog.features.length > 0) ? catalog.features : [""],
      specifications: specArray.length > 0 ? specArray : [{ key: "", value: "" }]
    });
    setImagePreview(catalog.image);

    // Split delivery time into value and unit
    if (catalog.deliveryTime) {
      const parts = catalog.deliveryTime.split(" ");
      if (parts.length >= 2) {
        setDeliveryUnit(parts[parts.length - 1]);
        setDeliveryValue(parts.slice(0, -1).join(" "));
      } else {
        setDeliveryValue(catalog.deliveryTime);
        setDeliveryUnit("Days");
      }
    } else {
      setDeliveryValue("");
      setDeliveryUnit("Days");
    }

    setIsAddingCategory(false);
    setNewCategoryName("");
    setIsCategoryDropdownOpen(false);

    setShowAddModal(true);
  };

  const totalPages = pagination.totalPages || 1;
  const currentCatalogs = catalogs;
  // Export to Excel
  // Export to Excel
  const handleExportExcel = () => {
    try {
      if (!catalogs || catalogs.length === 0) {
        toast.error("No data available to export");
        return;
      }

      const exportData = catalogs.map(cat => ({
        "Catalog ID": cat.catalog_id || "N/A",
        "Name": cat.name,
        "Category": cat.category || "N/A",
        "Status": cat.status,
        "Min Price (₹)": cat.minPrice || 0,
        "Max Price (₹)": cat.maxPrice || 0,
        "Delivery Time": cat.deliveryTime || "N/A",
        "Description": cat.description || "",
        "Created Date": cat.created_at?.split('T')[0] || "N/A"
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Catalogs Report");

      const wscols = [
        { wch: 15 }, // Catalog ID
        { wch: 25 }, // Name
        { wch: 20 }, // Category
        { wch: 12 }, // Status
        { wch: 15 }, // Min Price
        { wch: 15 }, // Max Price
        { wch: 18 }, // Delivery Time
        { wch: 40 }, // Description
        { wch: 15 }  // Created Date
      ];
      worksheet['!cols'] = wscols;

      const fileName = `Catalogs_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast.success("Catalog data exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setCategoryFilter("All");
    setTempStatuses([]);
    setTempCategories([]);
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || statusFilter !== "All" || categoryFilter !== "All";

  const handlePrev = () =>
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));

  const handleNext = () =>
    setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));

  const handlePageChange = (page) => setCurrentPage(page);

  const handleShare = (catalog) => {
    setSelectedCatalog(catalog);
    setShowShareModal(true);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Link copied to clipboard!");
    });
  };

  const handleView = (catalog) => {
    setSelectedCatalog(catalog);
    setShowViewModal(true);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  useEffect(() => {
    const handleClickOutsideCategory = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutsideCategory);
    return () => document.removeEventListener("mousedown", handleClickOutsideCategory);
  }, []);

  const handleAddNewCategory = async () => {
    if (newCategoryName.length > CAT_LIMIT) {
      toast.error(`Category name cannot exceed ${CAT_LIMIT} characters`);
      return;
    }

    if (!newCategoryName.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }

    try {
      await createCategory({ name: newCategoryName, status: "Active" }).unwrap();
      toast.success("Category added successfully!");
      setFormData({ ...formData, category: newCategoryName });
      setNewCategoryName("");
      setIsAddingCategory(false);
      refetchCategories(); // Refetch the categories list
    } catch (err) {
      toast.error("Error adding category: " + (err?.data?.message || err.message));
    }
  };

  const handleDeleteCategory = async (e, catId, catName) => {
    e.stopPropagation();
    try {
      await deleteCategory(catId).unwrap();
      toast.success("Category deleted successfully!");
      if (formData.category === catName) {
        setFormData({ ...formData, category: "" });
      }
      refetchCategories();
      refetch(); // Refetch catalogs as some might have been deleted
    } catch (err) {
      toast.error("Error deleting category: " + (err?.data?.message || err.message));
    }
  };

  const formatCurrencyShorthand = (value) => {
    const num = Number(value);
    if (isNaN(num) || num === 0) return "0";

    if (num >= 10000000) { // 1 Crore = 10,000,000
      return (num / 10000000).toLocaleString(undefined, { maximumFractionDigits: 2 }) + " Cr";
    } else if (num >= 100000) { // 1 Lakh = 100,000
      return (num / 100000).toLocaleString(undefined, { maximumFractionDigits: 2 }) + " Lakh";
    }
    return num.toLocaleString();
  };

  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const indexOfLastItem = Math.min(currentPage * itemsPerPage, pagination.total || 0);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white">
        {/* Header Section */}
        <div className="bg-white sticky top-0 z-30">
          <div className="max-w-8xl mx-auto px-4 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Catalog Module</h1>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                  <FiHome className="text-gray-700" size={14} />
                  <span className="text-gray-400">Additional / </span>
                  <span className="text-[#FF7B1D] font-medium">
                    All Catalogs
                  </span>
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Unified Filter */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => {
                      if (hasActiveFilters) {
                        clearAllFilters();
                      } else {
                        // Initialize temp states with current single filters when opening
                        setTempStatuses(statusFilter === "All" ? ["All"] : [statusFilter]);
                        setTempCategories(categoryFilter === "All" ? ["All"] : [categoryFilter]);
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
                    <div className="absolute right-0 mt-2 w-[400px] bg-white border border-gray-200 rounded-sm shadow-2xl z-50 animate-fadeIn overflow-hidden">
                      <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-800">Filter Options</span>
                        <button
                          onClick={() => {
                            setTempStatuses(["All"]);
                            setTempCategories(["All"]);
                          }}
                          className="text-[10px] font-bold text-orange-600 hover:underline hover:text-orange-700 capitalize"
                        >
                          Reset all
                        </button>
                      </div>

                      <div className="p-5 grid grid-cols-2 gap-6">
                        {/* Status Section */}
                        <div className="space-y-4">
                          <span className="text-[11px] font-bold text-gray-400 capitalize tracking-wider block mb-2 border-b pb-1">Select Status</span>
                          <div className="space-y-2">
                            {["All", "Active", "Inactive"].map((status) => (
                              <label key={status} className="flex items-center group cursor-pointer">
                                <div className="relative flex items-center">
                                  <input
                                    type="radio"
                                    name="status_filter"
                                    checked={tempStatuses[0] === status}
                                    onChange={() => setTempStatuses([status])}
                                    className="peer h-4 w-4 cursor-pointer appearance-none rounded-full border-2 border-gray-200 transition-all checked:border-[#FF7B1D] checked:border-[5px] hover:border-orange-300"
                                  />
                                </div>
                                <span className={`ml-3 text-sm font-medium transition-colors ${tempStatuses[0] === status ? "text-[#FF7B1D] font-bold" : "text-gray-600 group-hover:text-gray-900"}`}>
                                  {status}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Category Section */}
                        <div className="space-y-4">
                          <span className="text-[11px] font-bold text-gray-400 capitalize tracking-wider block mb-2 border-b pb-1">Product Category</span>
                          <div className="relative">
                            <select
                              value={tempCategories[0]}
                              onChange={(e) => setTempCategories([e.target.value])}
                              className="w-full px-3 py-2.5 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-1 focus:ring-orange-500/20 outline-none transition-all text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-white"
                            >
                              <option value="All">All Categories</option>
                              {dbCategories.map((cat) => (
                                <option key={cat.id} value={cat.name}>
                                  {cat.name}
                                </option>
                              ))}
                            </select>
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
                            setStatusFilter(tempStatuses[0]);
                            setCategoryFilter(tempCategories[0]);
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


                <ActionGuard permission="catalogs_create" module="Communication Tools">
                  <button
                    onClick={() => {
                      resetForm();
                      setShowAddModal(true);
                    }}
                    className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-sm hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl font-semibold"
                  >
                    <Plus size={20} />
                    Add Catalog
                  </button>
                </ActionGuard>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-8xl mx-auto p-4 pt-0 mt-2">


          {/* Statement Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
            <NumberCard
              variant="matrix"
              title="Total Employee"
              number={dashboardData?.data?.summary?.totalEmployees?.value || "0"}
              icon={<Users size={24} />}
              lineBorderClass="border-blue-500"
            />
            <NumberCard
              variant="matrix"
              title="Total Catalogs"
              number={pagination.total || "0"}
              icon={<LayoutGrid size={24} />}
              lineBorderClass="border-green-500"
            />
            <NumberCard
              variant="matrix"
              title="Total Leads"
              number={dashboardData?.data?.summary?.totalLeads?.value || "0"}
              icon={<Handshake size={24} />}
              lineBorderClass="border-orange-500"
            />
            <NumberCard
              variant="matrix"
              title="Total Active"
              number={catalogs.filter(c => c.status === 'Active').length || "0"}
              icon={<Target size={24} />}
              lineBorderClass="border-purple-500"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto mt-4 border border-gray-200 rounded-sm shadow-sm">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm">
                  <th className="py-3 px-4 font-semibold text-left border-b border-orange-400 w-[5%]">S.N</th>
                  <th className="py-3 px-4 font-semibold text-left border-b border-orange-400 w-[7%]">Image</th>
                  <th
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-gray-200 text-left border-b border-orange-400 w-[8%]"
                    onClick={() => handleSort("id")}
                  >
                    ID
                  </th>
                  <th
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-gray-200 text-left border-b border-orange-400 w-[15%]"
                    onClick={() => handleSort("name")}
                  >
                    Name
                  </th>
                  <th
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-gray-200 text-left border-b border-orange-400 w-[10%]"
                    onClick={() => handleSort("category")}
                  >
                    Category
                  </th>
                  <th
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-gray-200 text-left border-b border-orange-400 w-[10%]"
                    onClick={() => handleSort("minPrice")}
                  >
                    Min Price
                  </th>
                  <th
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-gray-200 text-left border-b border-orange-400 w-[10%]"
                    onClick={() => handleSort("maxPrice")}
                  >
                    Max Price
                  </th>
                  <th
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-gray-200 text-left border-b border-orange-400 w-[10%]"
                    onClick={() => handleSort("deliveryTime")}
                  >
                    Delivery Time
                  </th>
                  <th
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-gray-200 text-left border-b border-orange-400 w-[10%]"
                    onClick={() => handleSort("createdDate")}
                  >
                    Created Date
                  </th>
                  <th
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-gray-200 text-left border-b border-orange-400 w-[8%]"
                    onClick={() => handleSort("status")}
                  >
                    Status
                  </th>
                  <th className="py-3 px-4 font-semibold text-right border-b border-orange-400 w-[7%]">Action</th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="9" className="py-20">
                      <div className="flex justify-center flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                        <p className="text-gray-500 font-semibold animate-pulse">Loading catalogs...</p>
                      </div>
                    </td>
                  </tr>
                ) : currentCatalogs.length > 0 ? (
                  currentCatalogs.map((catalog, index) => (
                    <tr
                      key={catalog.id}
                      className="border-t hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4 text-left">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="py-3 px-4 text-left">
                        <div className="w-12 h-12 rounded-md border border-gray-100 object-cover shadow-sm overflow-hidden flex items-center justify-center bg-gray-50">
                          {catalog.image ? (
                            <img
                              src={catalog.image}
                              alt={catalog.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                e.target.parentNode.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                              }}
                            />
                          ) : (
                            <Package size={20} className="text-gray-400" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-orange-600 text-left">{catalog.catalog_id}</td>
                      <td className="py-3 px-4 font-semibold text-gray-800 text-left max-w-sm">
                        <div className="line-clamp-1 leading-tight" title={catalog.name}>
                          {catalog.name}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-600 text-left truncate max-w-[120px]" title={catalog.category}>
                        {catalog.category || "General"}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-600 text-left">
                        {catalog.minPrice ? `₹${formatCurrencyShorthand(catalog.minPrice)}` : "N/A"}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-600 text-left">
                        {catalog.maxPrice ? `₹${formatCurrencyShorthand(catalog.maxPrice)}` : "N/A"}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-600 text-left truncate max-w-[100px]" title={catalog.deliveryTime}>
                        {catalog.deliveryTime || "--"}
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-xs text-left">{new Date(catalog.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-left">
                        <span
                          className={`px-3 py-1 rounded-sm text-[10px] font-bold border uppercase tracking-wider ${catalog.status === "Active"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-700 border-red-200"
                            }`}
                        >
                          {catalog.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-2">
                          <ActionGuard permission="catalogs_view" module="Communication Tools">
                            <button
                              onClick={() => handleView(catalog)}
                              className="p-1 hover:bg-orange-100 rounded-sm text-blue-500 hover:text-blue-700 transition-all"
                              title="View"
                            >
                              <Eye size={18} />
                            </button>
                          </ActionGuard>
                          <ActionGuard permission="catalogs_edit" module="Communication Tools">
                            <button
                              onClick={() => handleEdit(catalog)}
                              className="p-1 hover:bg-orange-100 rounded-sm text-green-500 hover:text-green-700 transition-all"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                          </ActionGuard>
                          <ActionGuard permission="catalogs_delete" module="Communication Tools">
                            <button
                              onClick={() => handleDelete(catalog)}
                              className="p-1 hover:bg-orange-100 rounded-sm text-red-500 hover:text-red-700 transition-all"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </ActionGuard>
                          <button
                            onClick={() => handleShare(catalog)}
                            className="p-1 hover:bg-orange-100 rounded-sm text-purple-500 hover:text-purple-700 transition-all"
                            title="Share"
                          >
                            <Share size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="11"
                      className="py-12 text-center text-gray-500 font-medium text-sm"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <Package size={48} className="text-gray-200" />
                        <p className="mb-4">
                          {hasActiveFilters
                            ? "No catalogs found matching your filter criteria. Try clearing filters."
                            : "Your catalog collection is currently empty. Start showcasing your products today!"}
                        </p>
                        {hasActiveFilters ? (
                          <button
                            onClick={clearAllFilters}
                            className="px-6 py-2 border-2 border-[#FF7B1D] text-[#FF7B1D] font-bold rounded-sm hover:bg-orange-50 transition-all text-xs uppercase tracking-wider"
                          >
                            Clear Filter
                          </button>
                        ) : (
                          <ActionGuard permission="catalogs_create" module="Communication Tools">
                            <button
                              onClick={() => {
                                resetForm();
                                setShowAddModal(true);
                              }}
                              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-sm hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2 font-semibold"
                            >
                              <Plus size={20} />
                              Create First Catalog
                            </button>
                          </ActionGuard>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 🔹 Pagination Section */}
          <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4 bg-gray-50 p-4 rounded-sm border border-gray-200">
            <p className="text-sm font-semibold text-gray-700">
              Showing <span className="text-orange-600">{indexOfFirstItem + 1}</span> to <span className="text-orange-600">{indexOfLastItem}</span> of <span className="text-orange-600">{pagination.total || 0}</span> Catalogs
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-sm font-bold transition flex items-center gap-1 ${currentPage === 1
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
                  }`}
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => handlePageChange(i + 1)}
                    className={`w-10 h-10 rounded-sm font-bold transition ${currentPage === i + 1
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-sm font-bold transition flex items-center gap-1 ${currentPage === totalPages
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
                  }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Add Catalog Modal */}
        {showAddModal && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-sm shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-sm">
                    <Package size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {formData.id ? "Edit Catalog" : "Add New Catalog"}
                    </h2>
                    <p className="text-sm text-white text-opacity-90">
                      {formData.id ? "Update catalog information" : "Create and manage your product catalog"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-white hover:bg-orange-700 p-1 rounded-sm transition-colors">
                  <X size={24} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 overflow-y-auto">
                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <Package size={16} className="text-[#FF7B1D]" />
                      Catalog Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none transition-all text-sm text-gray-900 placeholder-gray-400 bg-white hover:border-gray-300"
                      required
                      placeholder="e.g., CRM Software Suite"
                    />
                  </div>

                  {/* Category & Vendor */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="group">
                      <div className="flex items-center justify-between mb-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <Tag size={16} className="text-[#FF7B1D]" />
                          Category <span className="text-red-500">*</span>

                        </label>
                        <div className="flex items-center gap-3">
                          {!isAddingCategory && (
                            <button
                              type="button"
                              onClick={() => setIsAddingCategory(true)}
                              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors"
                            >
                              <Plus size={14} />
                              Add New Category
                            </button>
                          )}
                        </div>
                      </div>

                      {isAddingCategory ? (
                        <div className="flex gap-2 items-start">
                          <div className="flex-1 space-y-1">
                            <input
                              type="text"
                              value={newCategoryName}
                              onChange={(e) => {
                                if (e.target.value.length <= CAT_LIMIT) {
                                  setNewCategoryName(e.target.value);
                                }
                              }}
                              className={`w-full px-4 py-3 border rounded-sm focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none transition-all text-sm text-gray-900 placeholder-gray-400 bg-white ${newCategoryName.length >= CAT_LIMIT ? 'border-red-500' : 'border-[#FF7B1D]'}`}
                              placeholder="Enter new category name"
                              autoFocus
                            />
                            <div className="flex justify-end">
                              <span className={`text-[10px] font-bold ${newCategoryName.length >= CAT_LIMIT ? 'text-red-500' : 'text-gray-400'}`}>
                                {newCategoryName.length}/{CAT_LIMIT}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleAddNewCategory}
                            disabled={isCreatingCategory}
                            className="p-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-sm hover:from-orange-600 hover:to-orange-700 transition-colors disabled:opacity-50 shadow-sm"
                            title="Add Category"
                          >
                            {isCreatingCategory ? (
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Check size={20} />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingCategory(false);
                              setNewCategoryName("");
                            }}
                            className="p-3 bg-gray-100 text-gray-500 rounded-sm hover:bg-gray-200 transition-colors shadow-sm"
                            title="Cancel"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      ) : (
                        <div className="relative" ref={categoryDropdownRef}>
                          <button
                            type="button"
                            onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                            className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none transition-all text-sm text-gray-900 bg-white hover:border-gray-300 cursor-pointer text-left"
                          >
                            <span className={formData.category === "" ? "text-gray-400" : "text-gray-900 font-medium"}>
                              {formData.category || "Select Category"}
                            </span>
                            <ChevronDown
                              size={18}
                              className={`text-gray-400 transition-transform ${isCategoryDropdownOpen ? "rotate-180" : ""}`}
                            />
                          </button>

                          {isCategoryDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-100 rounded-sm shadow-xl z-50 max-h-60 overflow-y-auto overflow-x-hidden animate-fadeIn">
                              <div className="py-1">
                                <div
                                  onClick={() => {
                                    setFormData({ ...formData, category: "" });
                                    setIsCategoryDropdownOpen(false);
                                  }}
                                  className={`px-4 py-2 text-sm cursor-pointer transition-colors flex items-center justify-between ${formData.category === "" ? "bg-orange-50 text-[#FF7B1D] font-bold" : "text-gray-700 hover:bg-gray-50"}`}
                                >
                                  Select Category
                                </div>
                                {dbCategories.map((cat) => (
                                  <div
                                    key={cat.id}
                                    onClick={() => {
                                      setFormData({ ...formData, category: cat.name });
                                      setIsCategoryDropdownOpen(false);
                                    }}
                                    className={`px-4 py-2 text-sm cursor-pointer transition-colors flex items-center justify-between group/item ${formData.category === cat.name ? "bg-orange-50 text-[#FF7B1D] font-bold" : "text-gray-700 hover:bg-gray-50"}`}
                                  >
                                    <span className="truncate mr-2">{cat.name}</span>
                                    <button
                                      onClick={(e) => handleDeleteCategory(e, cat.id, cat.name)}
                                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all sm:opacity-0 group-hover/item:opacity-100"
                                      title="Delete Category"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <CheckCircle size={16} className="text-[#FF7B1D]" />
                        Status <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none transition-all text-sm text-gray-900 bg-white hover:border-gray-300"
                        required
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>

                  </div>

                  {/* Status */}

                  {/* Image Upload */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <Image size={16} className="text-[#FF7B1D]" />
                      Catalog Image <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="catalog-image"
                      />
                      <label
                        htmlFor="catalog-image"
                        className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-sm cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all"
                      >
                        {imagePreview ? (
                          <div className="relative w-full h-full">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-full object-cover rounded-sm"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-sm">
                              <p className="text-white text-sm font-bold flex items-center gap-2">
                                <Plus size={20} /> Change Image
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center p-4">
                            <Upload
                              className="mx-auto text-gray-400 mb-2"
                              size={40}
                            />
                            <p className="text-sm font-semibold text-gray-600">
                              Click to upload image
                            </p>
                            <p className="text-[10px] text-gray-400 font-medium mt-1 uppercase">
                              Max 1MB: PNG, JPG, SVG
                            </p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <FileText size={16} className="text-[#FF7B1D]" />
                      Description <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-1">
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="3"
                        className={`w-full px-4 py-3 border rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none transition-all text-sm text-gray-900 placeholder-gray-400 bg-white hover:border-gray-300 resize-none ${formData.description.length >= DESC_LIMIT ? 'border-red-500' : 'border-gray-200'}`}
                        required
                        placeholder="Describe your catalog..."
                      />
                      <div className="flex justify-end">
                        <span className={`text-[10px] font-bold ${formData.description.length >= DESC_LIMIT ? 'text-red-500' : 'text-gray-400'}`}>
                          {formData.description.length}/{DESC_LIMIT}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <DollarSign size={16} className="text-[#FF7B1D]" />
                        Minimum Price (₹)
                      </label>
                      <input
                        type="number"
                        name="minPrice"
                        value={formData.minPrice}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none transition-all text-sm text-gray-900 placeholder-gray-400 bg-white hover:border-gray-300"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <DollarSign size={16} className="text-[#FF7B1D]" />
                        Maximum Price (₹)
                      </label>
                      <input
                        type="number"
                        name="maxPrice"
                        value={formData.maxPrice}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none transition-all text-sm text-gray-900 placeholder-gray-400 bg-white hover:border-gray-300"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Basic Info Bottom Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <Clock size={16} className="text-[#FF7B1D]" />
                        Working {deliveryUnit}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={deliveryValue}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDeliveryValue(val);
                            setFormData((prev) => ({
                              ...prev,
                              deliveryTime: val ? `${val} ${deliveryUnit}` : "",
                            }));
                          }}
                          className="flex-1 px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none transition-all text-sm text-gray-900 placeholder-gray-400 bg-white hover:border-gray-300"
                          placeholder={`e.g., 2-3 ${deliveryUnit}`}
                          title={`Enter the number of working ${deliveryUnit.toLowerCase()}`}
                        />
                      </div>
                    </div>
                    <div className="">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <Calendar size={16} className="text-[#FF7B1D]" />
                        Select Unit
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={deliveryUnit}
                          title="Select the time unit"
                          onChange={(e) => {
                            const unit = e.target.value;
                            setDeliveryUnit(unit);
                            setFormData((prev) => ({
                              ...prev,
                              deliveryTime: deliveryValue ? `${deliveryValue} ${unit}` : "",
                            }));
                          }}
                          className="flex-1 px-4 py-3 border border-gray-200 rounded-sm focus:border-[#FF7B1D] focus:ring-2 focus:ring-[#FF7B1D] focus:ring-opacity-20 outline-none transition-all text-sm text-gray-900 bg-white hover:border-gray-300 cursor-pointer"
                        >
                          <option value="Hours">Hours</option>
                          <option value="Days">Days</option>
                          <option value="Week">Week</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  {/* Key Features */}
                  <div className="pt-4 border-t">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                      <Zap size={16} className="text-[#FF7B1D]" />
                      Key Features
                      <button
                        type="button"
                        onClick={addFeature}
                        className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-sm hover:bg-orange-200"
                      >
                        + Add Feature
                      </button>
                    </label>
                    <div className="space-y-2">
                      {formData.features.map((feature, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text"
                            value={feature}
                            onChange={(e) => updateFeature(idx, e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-sm focus:border-[#FF7B1D] outline-none text-sm"
                            placeholder={`Feature ${idx + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() => removeFeature(idx)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-sm"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Specifications */}
                  <div className="pt-4 border-t">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                      <Settings size={16} className="text-[#FF7B1D]" />
                      Specifications
                      <button
                        type="button"
                        onClick={addSpec}
                        className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-sm hover:bg-orange-200"
                      >
                        + Add Spec
                      </button>
                    </label>
                    <div className="space-y-2">
                      {formData.specifications.map((spec, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text"
                            value={spec.key}
                            onChange={(e) => updateSpec(idx, "key", e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-sm focus:border-[#FF7B1D] outline-none text-sm font-medium"
                            placeholder="Key (e.g., Processor / OS / Cloud Provider)"
                          />
                          <input
                            type="text"
                            value={spec.value}
                            onChange={(e) => updateSpec(idx, "value", e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-sm focus:border-[#FF7B1D] outline-none text-sm"
                            placeholder="Value (e.g., Intel i9 / Windows / AWS)"
                          />
                          <button
                            type="button"
                            onClick={() => removeSpec(idx)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-sm"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-3 justify-end pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        resetForm();
                      }}
                      className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-sm hover:bg-gray-100 transition-all font-semibold"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={handleSubmit}
                      className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-sm hover:from-orange-600 hover:to-orange-700 transition-all font-semibold shadow-lg"
                    >
                      {formData.id ? "Update Changes" : "Save Catalog"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          headerVariant="simple"
          maxWidth="max-w-md"
          footer={
            <div className="flex gap-4 w-full">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 font-bold rounded-sm hover:bg-gray-100 transition-all font-primary text-xs uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-6 py-3 bg-red-600 text-white font-bold rounded-sm hover:bg-red-700 transition-all shadow-lg flex items-center justify-center gap-2 font-primary text-xs uppercase tracking-widest"
              >
                <Trash2 size={18} />
                Delete Now
              </button>
            </div>
          }
        >
          <div className="flex flex-col items-center text-center text-black font-primary">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <AlertCircle size={48} className="text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Confirm Delete</h2>
            <p className="text-gray-600 mb-2 leading-relaxed">
              Are you sure you want to delete the catalog <span className="font-bold text-gray-800">"{catalogToDelete?.name}"</span>?
            </p>
            <p className="text-xs text-red-500 italic font-medium">This action cannot be undone. All associated data will be permanently removed.</p>
          </div>
        </Modal>

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-sm shadow-2xl w-full max-w-lg">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Share size={20} />
                  Share Catalog
                </h2>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-white hover:bg-orange-700 p-1 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-4 font-medium">
                  Share "<span className="text-orange-600 font-bold">{selectedCatalog?.name?.length > 60 ? `${selectedCatalog.name.substring(0, 60)}...` : selectedCatalog?.name}</span>" with your clients:
                </p>
                <div className="flex items-center gap-2 p-3 bg-gray-50 border rounded-sm">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/catalog/view/${selectedCatalog?.catalog_id}`}
                    className="flex-1 bg-transparent outline-none text-sm text-gray-600"
                  />
                  <button
                    onClick={() => copyToClipboard(`${window.location.origin}/catalog/view/${selectedCatalog?.catalog_id}`)}
                    className="p-2 text-orange-600 hover:bg-orange-50 rounded-sm transition-all"
                    title="Copy Link"
                  >
                    <Copy size={18} />
                  </button>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="px-8 py-2 bg-gray-100 text-gray-700 rounded-sm font-semibold hover:bg-gray-200 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* View Catalog Modal */}
        <ViewCatalogModal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          catalog={selectedCatalog}
          businessInfo={businessInfo}
        />
      </div>
    </DashboardLayout >
  );
}
