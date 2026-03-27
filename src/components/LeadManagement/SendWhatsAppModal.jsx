import React, { useState, useEffect } from 'react';
import { X, Send, MessageSquare, Zap, Loader2, Info, CheckCircle2, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useGetWhatsAppTemplatesQuery, useSendWhatsAppMessageMutation, useGetWhatsAppConfigQuery } from '../../store/api/integrationApi';

const SendWhatsAppModal = ({ isOpen, onClose, lead }) => {
    // Fetch available accounts
    const { data: configsData, isLoading: isConfigsLoading } = useGetWhatsAppConfigQuery(undefined, { skip: !isOpen });
    const configs = configsData?.data || [];
    
    const [selectedConfigId, setSelectedConfigId] = useState('');
    
    // Set default account
    useEffect(() => {
        if (configs.length > 0 && !selectedConfigId) {
            const activeOne = configs.find(c => c.status?.toLowerCase() === 'active') || configs[0];
            setSelectedConfigId(activeOne.id);
        }
    }, [configs, selectedConfigId]);

    // Fetch templates for selected account
    const { data: templatesData, isLoading: isTemplatesLoading, error: templatesError } = useGetWhatsAppTemplatesQuery(selectedConfigId, { 
        skip: !isOpen || !selectedConfigId 
    });
    const [sendMessage, { isLoading: isSending }] = useSendWhatsAppMessageMutation();

    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [variables, setVariables] = useState({});
    const [preview, setPreview] = useState('');

    const templates = templatesData?.data || [];

    // Reset template when account changes
    useEffect(() => {
        setSelectedTemplate(null);
        setVariables({});
        setPreview('');
    }, [selectedConfigId]);

    useEffect(() => {
        if (selectedTemplate) {
            const bodyComponent = selectedTemplate.components.find(c => c.type === 'BODY');
            const text = bodyComponent?.text || '';
            setPreview(text);

            const variableMatches = text.match(/{{(\d+)}}/g);
            if (variableMatches) {
                const initialVars = {};
                variableMatches.forEach(match => {
                    const num = match.replace(/{{|}}/g, '');
                    if (num === '1' && lead?.name) {
                        initialVars[num] = lead.name;
                    } else {
                        initialVars[num] = '';
                    }
                });
                setVariables(initialVars);
            } else {
                setVariables({});
            }
        }
    }, [selectedTemplate, lead]);

    const handleVariableChange = (num, value) => {
        setVariables(prev => ({ ...prev, [num]: value }));
    };

    const getDynamicPreview = () => {
        let text = preview;
        Object.keys(variables).forEach(num => {
            const val = variables[num] || `{{${num}}}`;
            text = text.replace(`{{${num}}}`, val);
        });
        return text;
    };

    const handleSend = async () => {
        if (!selectedTemplate) return toast.error("Please select a template");
        if (!selectedConfigId) return toast.error("Please select a WhatsApp account");
        
        try {
            const bodyParams = Object.keys(variables)
                .sort((a, b) => a - b)
                .map(num => ({
                    type: "text",
                    text: variables[num]
                }));

            const payload = {
                phone: lead.whatsapp_number || lead.mobile_number || lead.phone,
                templateName: selectedTemplate.name,
                languageCode: selectedTemplate.language,
                leadId: lead.id,
                configId: selectedConfigId,
                components: bodyParams.length > 0 ? [{
                    type: "body",
                    parameters: bodyParams
                }] : []
            };

            await sendMessage(payload).unwrap();
            toast.success("WhatsApp message sent successfully!");
            onClose();
        } catch (error) {
            toast.error(error.data?.message || "Failed to send message");
        }
    };

    if (!isOpen) return null;

    const currentAccount = configs.find(c => c.id === selectedConfigId);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white w-full max-w-2xl rounded-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 bg-orange-500 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white">
                        <div className="p-2 bg-white/20 rounded-sm">
                            <MessageSquare size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold tracking-tight">Send WhatsApp Message</h3>
                            <p className="text-[11px] text-white/80 font-medium font-primary">To: {lead?.name} ({lead?.mobile_number || lead?.phone})</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    
                    {/* Account Selection */}
                    <div className="space-y-2">
                        <label className="text-[13px] font-bold text-gray-700 flex items-center gap-2">
                            <CheckCircle2 size={14} className={currentAccount?.status?.toLowerCase() === 'active' ? 'text-green-500' : 'text-gray-400'} /> Send From Account
                        </label>
                        {isConfigsLoading ? (
                            <div className="h-12 bg-gray-50 border border-gray-100 rounded-sm flex items-center px-4 animate-pulse">
                                <div className="h-4 w-32 bg-gray-200 rounded"></div>
                            </div>
                        ) : (
                            <div className="relative group">
                                <select 
                                    className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-sm focus:border-orange-500 outline-none text-sm font-bold text-gray-800 appearance-none cursor-pointer hover:border-gray-300 transition-all"
                                    value={selectedConfigId}
                                    onChange={(e) => setSelectedConfigId(e.target.value)}
                                >
                                    <option value="" disabled>-- Select WhatsApp Account --</option>
                                    {configs.map(cfg => (
                                        <option key={cfg.id} value={cfg.id}>
                                            {cfg.account_name} ({cfg.status})
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-orange-500 transition-colors">
                                    <ChevronDown size={18} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Template Selection */}
                    <div className="space-y-2">
                        <label className="text-[13px] font-bold text-gray-700 flex items-center gap-2">
                            <Zap size={14} className="text-orange-500" /> Select Template
                        </label>
                        {isTemplatesLoading ? (
                            <div className="h-12 bg-gray-50 border border-gray-200 rounded-sm flex items-center justify-center gap-3 text-gray-400">
                                <Loader2 size={18} className="animate-spin" />
                                <span className="text-xs font-semibold">Loading templates...</span>
                            </div>
                        ) : (
                            <div className="relative group">
                                <select 
                                    className="w-full h-12 px-4 border border-gray-200 rounded-sm focus:border-orange-500 outline-none text-sm font-semibold text-gray-800 appearance-none cursor-pointer hover:border-gray-300 transition-all"
                                    onChange={(e) => {
                                        const t = templates.find(temp => temp.name === e.target.value);
                                        setSelectedTemplate(t);
                                    }}
                                    disabled={!selectedConfigId}
                                    value={selectedTemplate?.name || ""}
                                >
                                    <option value="">{selectedConfigId ? "-- Choose a template --" : "Please select an account first"}</option>
                                    {templates.map(t => (
                                        <option key={t.id} value={t.name}>{t.name} ({t.language})</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-orange-500 transition-colors">
                                    <ChevronDown size={18} />
                                </div>
                            </div>
                        )}
                        {templatesError && (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-sm flex gap-3 animate-slideUp">
                                <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[11px] font-black text-amber-600 uppercase tracking-widest mb-1">Error Loading Templates</p>
                                    <p className="text-[12px] text-amber-700 font-bold leading-relaxed">
                                        {templatesError.status === 404 
                                            ? "This account is not correctly configured in Meta settings." 
                                            : (templatesError.data?.message || "Failed to load templates. Check your Meta Token.")}
                                    </p>
                                </div>
                            </div>
                        )}
                        {!isTemplatesLoading && selectedConfigId && !templatesError && templates.length === 0 && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-sm flex gap-3 animate-slideUp">
                                <Info size={16} className="text-red-500 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-red-600 font-bold leading-relaxed">
                                    No approved templates found for this account in Meta.
                                </p>
                            </div>
                        )}
                    </div>

                    {selectedTemplate && (
                        <div className="animate-slideUp space-y-6">
                            {/* Dynamic Variables */}
                            {Object.keys(variables).length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b pb-2">Fill Variables</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {Object.keys(variables).sort((a,b) => a-b).map(num => (
                                            <div key={num} className="space-y-1.5">
                                                <label className="text-[11px] font-bold text-gray-600 capitalize">Variable {"{{"}{num}{"}}"}</label>
                                                <input 
                                                    type="text"
                                                    value={variables[num]}
                                                    onChange={(e) => handleVariableChange(num, e.target.value)}
                                                    placeholder={`Value for {{${num}}}`}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:border-orange-500 outline-none text-xs font-bold text-gray-800 bg-gray-50/50 shadow-inner"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Live Preview Card */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Message Preview</h4>
                                <div className="bg-[#e5ddd5] dark:bg-gray-800/20 rounded-lg p-5 relative shadow-inner border border-gray-200 overflow-hidden">
                                    {/* Whatsapp style bg pattern could go here */}
                                    <div className="bg-white rounded-lg p-3 text-sm text-gray-800 leading-relaxed shadow-sm relative z-10 max-w-[90%]">
                                        {getDynamicPreview()}
                                        <div className="flex items-center justify-end mt-1 gap-1">
                                            <span className="text-[9px] text-gray-400 font-bold">
                                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <CheckCircle2 size={10} className="text-blue-500 fill-blue-500" />
                                        </div>
                                    </div>
                                    {/* Bubble tail */}
                                    <div className="absolute top-7 left-3.5 w-4 h-4 bg-white rotate-45 -z-0"></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors uppercase tracking-widest"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSend}
                        disabled={!selectedTemplate || !selectedConfigId || isSending}
                        className="px-8 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-sm font-bold shadow-lg hover:shadow-orange-200 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2 uppercase tracking-widest text-xs"
                    >
                        {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={14} />}
                        {isSending ? "Sending..." : `Send via ${currentAccount?.account_name || 'WhatsApp'}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SendWhatsAppModal;
