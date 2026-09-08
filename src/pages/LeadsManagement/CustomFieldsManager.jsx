import React, { useState } from 'react';
import { 
    useGetCustomFieldsQuery, 
    useCreateCustomFieldMutation, 
    useUpdateCustomFieldMutation, 
    useDeleteCustomFieldMutation 
} from '../../store/api/customFieldApi';
import { Plus, Trash2, Edit2, Check, X, Tag, List } from 'lucide-react';
import { toast } from 'react-hot-toast';

const FIELD_TYPES = [
    { value: 'text', label: 'Text' },
    { value: 'email', label: 'Email' },
    { value: 'tel', label: 'Phone/Tel' },
    { value: 'url', label: 'URL' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'time', label: 'Time' },
    { value: 'dropdown', label: 'Dropdown Select' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'textarea', label: 'Text Area' }
];

const CustomFieldsManager = () => {
    const { data, isLoading } = useGetCustomFieldsQuery('leads');
    const [createCustomField] = useCreateCustomFieldMutation();
    const [updateCustomField] = useUpdateCustomFieldMutation();
    const [deleteCustomField] = useDeleteCustomFieldMutation();

    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        field_label: '',
        field_type: 'text',
        options: []
    });
    const [optionInput, setOptionInput] = useState('');

    const customFields = data?.customFields || [];

    const handleAddOption = (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            e.preventDefault();
            if (optionInput.trim() && !formData.options.includes(optionInput.trim())) {
                setFormData(prev => ({
                    ...prev,
                    options: [...prev.options, optionInput.trim()]
                }));
                setOptionInput('');
            }
        }
    };

    const handleRemoveOption = (optionToRemove) => {
        setFormData(prev => ({
            ...prev,
            options: prev.options.filter(opt => opt !== optionToRemove)
        }));
    };

    const resetForm = () => {
        setFormData({ field_label: '', field_type: 'text', options: [] });
        setOptionInput('');
        setEditingId(null);
    };

    const handleSave = async () => {
        if (!formData.field_label.trim()) {
            toast.error("Field label is required");
            return;
        }
        if (formData.field_type === 'dropdown' && formData.options.length === 0) {
            toast.error("Please add at least one option for the dropdown");
            return;
        }

        const payload = {
            field_label: formData.field_label.trim(),
            field_type: formData.field_type,
            options: formData.field_type === 'dropdown' ? formData.options : null
        };

        try {
            if (editingId) {
                await updateCustomField({ id: editingId, ...payload }).unwrap();
                toast.success("Field updated successfully");
            } else {
                await createCustomField({ module_name: 'leads', ...payload }).unwrap();
                toast.success("Field added successfully");
            }
            resetForm();
        } catch (error) {
            toast.error(`Failed to ${editingId ? 'update' : 'add'} field`);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this custom field? This will remove it from all leads.")) {
            try {
                await deleteCustomField(id).unwrap();
                toast.success("Field deleted");
                if (editingId === id) resetForm();
            } catch (error) {
                toast.error("Failed to delete field");
            }
        }
    };

    const startEditing = (field) => {
        setEditingId(field.id);
        setFormData({
            field_label: field.field_label,
            field_type: field.field_type,
            options: Array.isArray(field.options) ? field.options : (typeof field.options === 'string' ? JSON.parse(field.options) : [])
        });
        setOptionInput('');
    };

    return (
        <div className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-60px)] font-primary">
            <div className="max-w-[1400px] mx-auto">
                <div className="flex flex-col mb-6 bg-white p-6 rounded-none shadow-sm border border-gray-100">
                    <h1 className="text-2xl font-bold text-slate-800 capitalize flex items-center gap-3">
                        <Tag className="text-orange-500" size={24} />
                        Custom Fields Manager
                    </h1>
                    <p className="text-base text-slate-500 mt-1">
                        Configure dynamic fields that will automatically appear on the Lead Creation and Profile forms.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Side: Form */}
                    <div className="lg:col-span-4 sticky top-6">
                        <div className={`p-6 rounded-none shadow-sm border transition-colors duration-300 ${editingId ? 'bg-orange-50/30 border-orange-300' : 'bg-white border-gray-200'}`}>
                            <h3 className="text-xl font-bold text-gray-800 mb-5 capitalize flex items-center gap-2">
                                {editingId ? <Edit2 size={20} className="text-orange-500" /> : <Plus size={20} className="text-orange-500" />}
                                {editingId ? 'Edit Custom Field' : 'Add New Field'}
                            </h3>
                            
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 capitalize">Field Label <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Industry Type, Expected Budget" 
                                        value={formData.field_label}
                                        onChange={(e) => setFormData({...formData, field_label: e.target.value})}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-none text-base focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 capitalize">Field Type <span className="text-red-500">*</span></label>
                                    <select 
                                        value={formData.field_type}
                                        onChange={(e) => {
                                            setFormData({...formData, field_type: e.target.value, options: e.target.value !== 'dropdown' ? [] : formData.options});
                                        }}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-none text-base focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none bg-white transition-all cursor-pointer appearance-none"
                                        style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7em top 50%', backgroundSize: '.65em auto' }}
                                    >
                                        {FIELD_TYPES.map(type => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {formData.field_type === 'dropdown' && (
                                    <div className="bg-gray-50 p-4 border border-gray-200 rounded-none animate-in fade-in slide-in-from-top-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 capitalize">Dropdown Options <span className="text-red-500">*</span></label>
                                        <div className="flex gap-2 mb-3">
                                            <div className="relative flex-1">
                                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                <input 
                                                    type="text" 
                                                    placeholder="Option name..." 
                                                    value={optionInput}
                                                    onChange={(e) => setOptionInput(e.target.value)}
                                                    onKeyDown={handleAddOption}
                                                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-none text-base focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all bg-white"
                                                />
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={handleAddOption}
                                                disabled={!optionInput.trim()}
                                                className="px-5 py-2.5 bg-slate-800 text-white text-sm font-semibold rounded-none hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed capitalize shadow-sm active:scale-95"
                                            >
                                                Add
                                            </button>
                                        </div>
                                        
                                        {formData.options.length > 0 ? (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {formData.options.map((opt, i) => (
                                                    <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 shadow-sm rounded-none text-sm font-medium text-gray-700 group hover:border-orange-400 transition-colors">
                                                        <span>{opt}</span>
                                                        <button 
                                                            onClick={() => handleRemoveOption(opt)}
                                                            className="text-gray-400 hover:text-red-500 transition-colors focus:outline-none p-0.5 rounded-none hover:bg-red-50"
                                                        >
                                                            <X size={14} strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-sm text-orange-600 font-medium bg-orange-50 p-3 border border-orange-100 rounded-none">
                                                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse shrink-0"></div>
                                                Add at least one option.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-3 pt-6 border-t border-gray-200 mt-6">
                                <button 
                                    onClick={handleSave} 
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-orange-500 text-white font-semibold text-base rounded-none hover:bg-orange-600 shadow-sm transition-all active:scale-95 capitalize"
                                >
                                    <Check size={18} strokeWidth={3} />
                                    {editingId ? 'Update Field' : 'Save New Field'}
                                </button>
                                {editingId && (
                                    <button 
                                        onClick={resetForm} 
                                        className="w-full px-6 py-3 border border-gray-300 text-gray-700 font-semibold text-sm rounded-none hover:bg-gray-50 transition-all capitalize"
                                    >
                                        Cancel Edit
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Side: List */}
                    <div className="lg:col-span-8">
                        <div className="bg-white rounded-none shadow-sm border border-gray-200 overflow-hidden h-full">
                            {/* Header */}
                            <div className="bg-slate-50 text-slate-800 p-5 border-b border-gray-200 flex items-center justify-between">
                                <h3 className="font-bold text-lg capitalize flex items-center gap-2">
                                    <List size={20} className="text-orange-500" />
                                    Active Fields ({customFields.length})
                                </h3>
                            </div>

                            {/* List Content */}
                            <div className="divide-y divide-gray-100">
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                                        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                                        <p className="text-gray-500 text-base font-medium capitalize">Loading Fields...</p>
                                    </div>
                                ) : customFields.length === 0 ? (
                                    <div className="text-center py-24 px-4 bg-slate-50/50">
                                        <div className="w-20 h-20 bg-white border border-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
                                            <Tag size={32} />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800 mb-3 capitalize">No Custom Fields Configured</h3>
                                        <p className="text-gray-500 text-base max-w-md mx-auto leading-relaxed">
                                            Use the form on the left to add your first custom field.
                                        </p>
                                    </div>
                                ) : (
                                    customFields.map((field) => (
                                        <div 
                                            key={field.id} 
                                            className={`p-6 transition-all group border-l-4 ${editingId === field.id ? 'bg-orange-50/50 border-l-orange-500' : 'hover:bg-slate-50 border-l-transparent hover:border-l-orange-300'}`}
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h4 className="text-lg font-bold text-slate-800">{field.field_label}</h4>
                                                        <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-none text-xs font-semibold capitalize">
                                                            {FIELD_TYPES.find(t => t.value === field.field_type)?.label || field.field_type}
                                                        </span>
                                                    </div>
                                                    
                                                    {field.field_type === 'dropdown' ? (
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            {(() => {
                                                                const opts = Array.isArray(field.options) ? field.options : (typeof field.options === 'string' ? JSON.parse(field.options) : []);
                                                                if(opts.length === 0) return <span className="text-sm text-gray-400 italic">No options defined</span>;
                                                                return (
                                                                    <>
                                                                        {opts.slice(0, 6).map((opt, i) => (
                                                                            <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-none text-sm border border-blue-200 font-medium">
                                                                                {opt}
                                                                            </span>
                                                                        ))}
                                                                        {opts.length > 6 && (
                                                                            <span className="px-3 py-1 bg-gray-50 text-gray-600 rounded-none text-sm border border-gray-300 font-medium">
                                                                                +{opts.length - 6} more
                                                                            </span>
                                                                        )}
                                                                    </>
                                                                )
                                                            })()}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-500 font-medium">Standard {field.field_type} input rendering on forms.</p>
                                                    )}
                                                </div>
                                                
                                                <div className="flex justify-end gap-3 shrink-0">
                                                    <button 
                                                        onClick={() => startEditing(field)} 
                                                        title="Edit Field"
                                                        className={`w-10 h-10 flex items-center justify-center rounded-none transition-all ${editingId === field.id ? 'bg-orange-500 text-white shadow-md' : 'text-slate-500 hover:text-orange-600 hover:bg-orange-50 border border-gray-200 hover:border-orange-200 bg-white'}`}
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(field.id)} 
                                                        title="Delete Field"
                                                        className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-none transition-all bg-white"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomFieldsManager;
