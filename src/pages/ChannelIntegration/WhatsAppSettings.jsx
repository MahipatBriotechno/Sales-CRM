import React, { useState, useEffect } from "react";
import { MessageSquare, Shield, Zap, Save, RefreshCw, Key, Link as LinkIcon, Smartphone, Plus, Trash2, Edit3, CheckCircle2, AlertCircle, X, Info, Globe, Lock } from "lucide-react";
import { toast } from "react-hot-toast";
import { useGetWhatsAppConfigQuery, useSaveWhatsAppConfigMutation, useSendWhatsAppTestMessageMutation, useDeleteChannelConfigMutation } from "../../store/api/integrationApi";
import WhatsAppDeleteConfirmationModal from "../../components/ChannelIntegration/WhatsAppDeleteConfirmationModal";

const WhatsAppSettings = () => {
    // API Hooks
    const { data: dbConfig, isLoading: isFetching, refetch } = useGetWhatsAppConfigQuery();
    const [saveConfig] = useSaveWhatsAppConfigMutation();
    const [sendTestMessage] = useSendWhatsAppTestMessageMutation();
    const [deleteConfig] = useDeleteChannelConfigMutation();

    const [configs, setConfigs] = useState([]);
    const [activeConfigIndex, setActiveConfigIndex] = useState(0);
    const [hasPopulated, setHasPopulated] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [indexToDelete, setIndexToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const emptyConfig = {
        account_name: "New Account",
        provider: "meta",
        phoneNumberId: "",
        businessAccountId: "",
        accessToken: "",
        webhookUrl: "https://api.crm.com/webhooks/whatsapp",
        webhookVerifyToken: "CRM_WP_VERIFY_2024",
        status: "inactive",
        apiUrl: "https://graph.facebook.com",
        apiVersion: "v19.0",
        businessId: ""
    };

    // Populate from DB
    useEffect(() => {
        if (dbConfig?.success && dbConfig?.data && Array.isArray(dbConfig.data)) {
            const formattedConfigs = dbConfig.data.map(item => {
                const configData = typeof item.config_data === 'string' ? JSON.parse(item.config_data) : (item.config_data || {});
                return {
                    id: item.id,
                    account_name: item.account_name || "WhatsApp Account",
                    provider: configData.provider || "meta",
                    phoneNumberId: configData.phoneNumberId || "",
                    businessAccountId: configData.businessAccountId || "",
                    accessToken: item.api_key || "",
                    webhookUrl: configData.webhookUrl || "https://api.crm.com/webhooks/whatsapp",
                    webhookVerifyToken: configData.webhookVerifyToken || "CRM_WP_VERIFY_2024",
                    status: item.status?.toLowerCase() === 'active' ? 'active' : 'inactive',
                    apiUrl: configData.apiUrl || "https://graph.facebook.com",
                    apiVersion: configData.apiVersion || "v19.0",
                    businessId: configData.businessId || ""
                };
            });

            if (formattedConfigs.length > 0) {
                setConfigs(formattedConfigs);
                if (!hasPopulated) {
                    setActiveConfigIndex(0);
                    setHasPopulated(true);
                }
            } else if (!hasPopulated) {
                setConfigs([]); // Start empty to show the empty state
                setHasPopulated(true);
            }
        }
    }, [dbConfig, hasPopulated]);

    const activeConfig = configs[activeConfigIndex] || emptyConfig;

    const [testPhone, setTestPhone] = useState("");
    const [isTesting, setIsTesting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleUpdateActiveField = (field, value) => {
        const newConfigs = [...configs];
        newConfigs[activeConfigIndex] = { ...newConfigs[activeConfigIndex], [field]: value };
        setConfigs(newConfigs);
    };

    const handleAddNewConfig = () => {
        setConfigs([...configs, { ...emptyConfig, account_name: `Account ${configs.length + 1}` }]);
        setActiveConfigIndex(configs.length);
    };

    const handleDeleteConfig = (index, e) => {
        e.stopPropagation();
        const configToDelete = configs[index];

        if (!configToDelete.id) {
            // Just remove from local state if not saved in DB
            const newConfigs = configs.filter((_, i) => i !== index);
            setConfigs(newConfigs);
            setActiveConfigIndex(0);
            return;
        }

        setIndexToDelete(index);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (indexToDelete === null) return;

        try {
            setIsDeleting(true);
            const configToDelete = configs[indexToDelete];
            await deleteConfig(configToDelete.id).unwrap();
            toast.success("Configuration deleted!");
            refetch();
            setHasPopulated(false);
            setIsDeleteDialogOpen(false);
            setIndexToDelete(null);
        } catch (error) {
            toast.error("Failed to delete configuration");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const payload = { ...activeConfig };
            // Ensure status follows backend expectations ('active' -> 'Active') handled in controller
            await saveConfig(payload).unwrap();
            toast.success("WhatsApp configuration saved successfully!");
            refetch();
            setHasPopulated(false); // Trigger re-population with new ID if it was a new config
        } catch (error) {
            toast.error(error.data?.message || "Failed to save configuration");
        } finally {
            setIsSaving(false);
        }
    };

    if (isFetching && !hasPopulated) {
        return (
            <div className="w-full h-96 flex flex-col items-center justify-center bg-white border border-gray-100 rounded-sm font-primary translate-y-20">
                <RefreshCw size={32} className="text-orange-500 animate-spin mb-4" />
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Loading WhatsApp Configurations...</p>
            </div>
        );
    }

    return (
        <div className="w-full animate-fadeIn pb-10">
            {/* Multi-Account Header */}
            <div className="flex flex-col md:flex-row gap-6">

                {/* Account Sidebar/List */}
                <div className="w-full md:w-72 space-y-3">
                    <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden font-primary">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-base font-semibold text-orange-600 capitalize tracking-tight">Connected Accounts</h3>
                            <button
                                onClick={handleAddNewConfig}
                                className="p-1.5 bg-orange-100 text-orange-600 rounded-sm hover:bg-orange-600 hover:text-white transition-all shadow-sm active:scale-95"
                                title="Add New WhatsApp Account"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                        <div className="p-2 max-h-[600px] overflow-y-auto">
                            {configs.map((cfg, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setActiveConfigIndex(idx)}
                                    className={`group relative p-3 rounded-sm transition-all cursor-pointer mb-1 border ${activeConfigIndex === idx
                                        ? 'bg-orange-50 border-orange-200 shadow-sm'
                                        : 'bg-white border-transparent hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-sm ${activeConfigIndex === idx ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                            <MessageSquare size={14} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-bold truncate ${activeConfigIndex === idx ? 'text-orange-700' : 'text-gray-700'}`}>
                                                {cfg.account_name}
                                            </p>
                                            <p className={`text-[10px] font-semibold uppercase tracking-tight ${cfg.status?.toLowerCase() === 'active' ? 'text-green-500' : 'text-gray-400'}`}>
                                                {cfg.status}
                                            </p>
                                        </div>
                                        {(configs.length > 1 || cfg.id) && (
                                            <button
                                                onClick={(e) => handleDeleteConfig(idx, e)}
                                                className={`p-1.5 text-gray-400 hover:text-white hover:bg-red-500 rounded-sm transition-all shadow-sm ${activeConfigIndex === idx ? 'opacity-100 scale-100' : 'sm:opacity-0 group-hover:opacity-100 group-hover:scale-100'}`}
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                    {cfg.id && (
                                        <div className="absolute top-2 right-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-sm shadow-sm font-primary">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap size={14} className="text-orange-500" />
                            <h4 className="text-base font-semibold text-orange-800 capitalize tracking-tight">Quick Guide</h4>
                        </div>
                        <p className="text-[12px] text-orange-600 font-semibold leading-relaxed font-primary capitalize tracking-tight">
                            1. Create App at <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="underline">Meta Portal</a><br />
                            2. Link WA Business Number<br />
                            3. Get Token & IDs<br />
                            4. Enter details & Save
                        </p>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 space-y-6 min-w-0">
                    {configs.length === 0 ? (
                        <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-12 text-center font-primary flex flex-col items-center justify-center min-h-[500px] animate-fadeIn">
                            <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6 shadow-inner ring-4 ring-white">
                                <MessageSquare size={48} className="text-orange-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 capitalize mb-3">No Accounts Connected</h3>
                            <p className="text-sm text-slate-500 font-semibold capitalize max-w-sm mx-auto mb-10 leading-relaxed">
                                Connect your first WhatsApp Business account to start automating your messaging workflow.
                            </p>
                            <button
                                onClick={handleAddNewConfig}
                                className="px-10 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-sm font-bold shadow-lg shadow-orange-200 hover:from-orange-600 hover:to-orange-700 transition-all active:scale-95 flex items-center gap-3 capitalize text-sm tracking-wide"
                            >
                                <Plus size={20} className="text-white" />
                                Connect Now
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden mb-6 font-primary">
                                <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-orange-100 text-orange-600 rounded-sm">
                                            <Edit3 size={22} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-orange-600 capitalize tracking-tight font-primary flex items-center gap-3">
                                                {activeConfig.account_name}
                                                {activeConfig.id && (
                                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full border border-green-200 text-[10px] font-black uppercase tracking-wider shadow-sm">
                                                        <CheckCircle2 size={12} /> Integrated
                                                    </span>
                                                )}
                                            </h3>
                                            <p className="text-sm font-semibold text-slate-500 capitalize mt-1">Configure your official WhatsApp API credentials below</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 w-full sm:w-auto">
                                        <button
                                            onClick={() => refetch()}
                                            className="flex-1 sm:flex-initial px-6 py-3 text-xs font-bold text-gray-500 hover:text-orange-600 transition-all uppercase tracking-widest border border-gray-200 rounded-sm hover:border-orange-200 hover:bg-orange-50 active:scale-95"
                                        >
                                            Reset
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            className="flex-1 sm:flex-initial px-10 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-sm font-bold shadow-lg shadow-orange-100 hover:from-orange-600 hover:to-orange-700 transition-all active:scale-95 disabled:opacity-50 text-sm uppercase tracking-widest flex items-center justify-center gap-3"
                                        >
                                            {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                                            {isSaving ? "Saving..." : "Save Config"}
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 space-y-3">
                                    {/* Account Label Input */}
                                    <div className="pb-2 border-b border-gray-50">
                                        <div className="space-y-1">
                                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 capitalize tracking-tight">
                                                <Edit3 size={14} className="text-orange-500" /> Account Display Name
                                                <span className="text-[12px] text-orange-500 font-semibold lowercase opacity-90">(Internal name to identify this account)</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={activeConfig.account_name}
                                                onChange={(e) => handleUpdateActiveField('account_name', e.target.value)}
                                                placeholder="e.g. Sales WhatsApp, Support Desk"
                                                className="w-full px-4 py-2 border border-gray-200 rounded-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-opacity-20 outline-none transition-all text-sm text-gray-900 bg-white hover:border-gray-300 shadow-sm font-semibold"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-primary">
                                        {/* Row 1: Provider & Status */}
                                        <div className="space-y-1">
                                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2 capitalize tracking-tight">
                                                <Globe size={14} className="text-orange-500" /> WhatsApp Provider
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full h-10 px-4 bg-gray-50 border border-gray-100 rounded-sm text-sm font-bold text-gray-400 cursor-not-allowed uppercase"
                                                value="Meta Cloud API (Official)"
                                                readOnly
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 capitalize tracking-tight">
                                                <Zap size={14} className="text-orange-500" /> Integration Status
                                            </label>
                                            <div className="flex bg-gray-100 p-1 rounded-sm border border-gray-200 shadow-inner w-full h-10">
                                                <button
                                                    onClick={() => handleUpdateActiveField('status', 'active')}
                                                    className={`flex-1 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all ${activeConfig.status?.toLowerCase() === 'active' ? 'bg-white shadow-md text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                                                >
                                                    Active
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateActiveField('status', 'inactive')}
                                                    className={`flex-1 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all ${activeConfig.status?.toLowerCase() === 'inactive' ? 'bg-white shadow-md text-red-500' : 'text-gray-400 hover:text-gray-600'}`}
                                                >
                                                    Inactive
                                                </button>
                                            </div>
                                        </div>

                                        {/* Row 2: Phone ID & WABA ID */}
                                        <div className="space-y-1">
                                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2 capitalize tracking-tight">
                                                <Smartphone size={14} className="text-orange-500" /> Phone Number ID
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Enter Phone Number ID"
                                                className="w-full h-10 px-4 bg-white border border-gray-200 rounded-sm focus:border-orange-500 outline-none text-sm font-bold text-gray-800 shadow-sm"
                                                value={activeConfig.phoneNumberId || ""}
                                                onChange={(e) => handleUpdateActiveField('phoneNumberId', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2 capitalize tracking-tight">
                                                <Lock size={14} className="text-orange-500" /> WhatsApp Business Account ID (WABA ID)
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Business Account ID"
                                                className="w-full h-10 px-4 bg-white border border-gray-200 rounded-sm focus:border-orange-500 outline-none text-sm font-bold text-gray-800 shadow-sm"
                                                value={activeConfig.businessAccountId || ""}
                                                onChange={(e) => handleUpdateActiveField('businessAccountId', e.target.value)}
                                            />
                                        </div>

                                        {/* Row 3: API URL & Version */}
                                        <div className="space-y-1">
                                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2 capitalize tracking-tight">
                                                <LinkIcon size={14} className="text-orange-500" /> API Base URL
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="https://graph.facebook.com"
                                                className="w-full h-10 px-4 bg-white border border-gray-200 rounded-sm focus:border-orange-500 outline-none text-sm font-bold text-gray-800 shadow-sm"
                                                value={activeConfig.apiUrl || ""}
                                                onChange={(e) => handleUpdateActiveField('apiUrl', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2 capitalize tracking-tight">
                                                <Zap size={14} className="text-orange-500" /> API Version
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="v19.0"
                                                className="w-full h-10 px-4 bg-white border border-gray-200 rounded-sm focus:border-orange-500 outline-none text-sm font-bold text-gray-800 shadow-sm"
                                                value={activeConfig.apiVersion || 'v19.0'}
                                                onChange={(e) => handleUpdateActiveField('apiVersion', e.target.value)}
                                            />
                                        </div>

                                        {/* Row 4: Business ID */}
                                        <div className="space-y-1 md:col-span-2">
                                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2 capitalize tracking-tight">
                                                <Shield size={14} className="text-orange-500" /> Business ID
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Enter Meta Business ID"
                                                className="w-full h-10 px-4 bg-white border border-gray-200 rounded-sm focus:border-orange-500 outline-none text-sm font-bold text-gray-800 shadow-sm"
                                                value={activeConfig.businessId || ""}
                                                onChange={(e) => handleUpdateActiveField('businessId', e.target.value)}
                                            />
                                        </div>

                                        {/* Row 5: Access Token */}
                                        <div className="space-y-1 md:col-span-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-bold text-gray-700 flex items-center gap-2 capitalize tracking-tight">
                                                    <Key size={14} className="text-orange-500" /> Permanent Access Token
                                                </label>
                                                <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-[10px] font-bold text-orange-500 hover:underline capitalize tracking-tight">Get Token</a>
                                            </div>
                                            <textarea
                                                placeholder="Enter EAAl..."
                                                className="w-full h-24 p-3 bg-white border border-gray-200 rounded-sm focus:border-orange-500 outline-none text-xs font-semibold text-gray-800 shadow-sm resize-none"
                                                value={activeConfig.accessToken || ""}
                                                onChange={(e) => handleUpdateActiveField('accessToken', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Test Integration Card */}
                            <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-6 font-primary">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2.5 bg-green-100 text-green-600 rounded-sm shadow-sm ring-4 ring-white">
                                            <Smartphone size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-black text-slate-800 capitalize tracking-tight font-primary">Test Integration</h3>
                                            <p className="text-[12px] font-bold text-green-600 mt-0.5 font-primary tracking-tight capitalize opacity-90">Validate your credentials by sending a test message</p>
                                        </div>
                                    </div>
                                <div className="flex gap-4 max-w-lg">
                                    <input
                                        type="text"
                                        placeholder="Receiver number (91...)"
                                        className="flex-1 h-11 px-4 bg-white border border-gray-200 rounded-sm focus:border-green-500 outline-none text-sm font-bold text-gray-800 shadow-inner"
                                        value={testPhone}
                                        onChange={(e) => setTestPhone(e.target.value)}
                                    />
                                    <button
                                        onClick={async () => {
                                            if (!testPhone) return toast.error("Please enter a phone number");
                                            try {
                                                setIsTesting(true);
                                                await sendTestMessage({ phone: testPhone, config: activeConfig }).unwrap();
                                                toast.success("Test message sent! Check your WhatsApp.");
                                            } catch (error) {
                                                toast.error(error.data?.message || "Failed to send test message");
                                            } finally {
                                                setIsTesting(false);
                                            }
                                        }}
                                        disabled={isTesting || !activeConfig.id}
                                        className="px-8 bg-green-500 text-white rounded-sm font-bold shadow-lg hover:bg-green-600 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 text-sm capitalize tracking-widest"
                                    >
                                        {isTesting ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                                        {isTesting ? "Testing..." : "Send Test"}
                                    </button>
                                </div>
                                {!activeConfig.id && (
                                    <p className="mt-2 text-[10px] text-amber-600 font-bold capitalize tracking-tight flex items-center gap-1">
                                        <Info size={12} /> Please save configuration before testing
                                    </p>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>

            <WhatsAppDeleteConfirmationModal
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={handleConfirmDelete}
                accountName={configs[indexToDelete]?.account_name}
                isDeleting={isDeleting}
            />
        </div>
    );
};

export default WhatsAppSettings;
