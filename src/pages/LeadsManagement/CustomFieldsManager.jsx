import React, { useState } from 'react';
import { 
    useGetCustomFieldsQuery, 
    useCreateCustomFieldMutation, 
    useUpdateCustomFieldMutation, 
    useDeleteCustomFieldMutation 
} from '../../store/api/customFieldApi';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CustomFieldsManager = () => {
    const { data, isLoading } = useGetCustomFieldsQuery('leads');
    const [createCustomField] = useCreateCustomFieldMutation();
    const [updateCustomField] = useUpdateCustomFieldMutation();
    const [deleteCustomField] = useDeleteCustomFieldMutation();

    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        field_label: '',
        field_type: 'text',
        options: ''
    });

    const customFields = data?.customFields || [];

    const handleSaveNew = async () => {
        if (!formData.field_label) {
            toast.error("Field label is required");
            return;
        }
        try {
            const payload = {
                module_name: 'leads',
                field_label: formData.field_label,
                field_type: formData.field_type,
                options: formData.field_type === 'dropdown' ? formData.options.split(',').map(o => o.trim()).filter(o => o) : null
            };
            await createCustomField(payload).unwrap();
            toast.success("Field added successfully");
            setIsAdding(false);
            setFormData({ field_label: '', field_type: 'text', options: '' });
        } catch (error) {
            toast.error("Failed to add field");
        }
    };

    const handleSaveEdit = async (id) => {
        if (!formData.field_label) {
            toast.error("Field label is required");
            return;
        }
        try {
            const payload = {
                id,
                field_label: formData.field_label,
                field_type: formData.field_type,
                options: formData.field_type === 'dropdown' ? formData.options.split(',').map(o => o.trim()).filter(o => o) : null
            };
            await updateCustomField(payload).unwrap();
            toast.success("Field updated successfully");
            setEditingId(null);
            setFormData({ field_label: '', field_type: 'text', options: '' });
        } catch (error) {
            toast.error("Failed to update field");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this field?")) {
            try {
                await deleteCustomField(id).unwrap();
                toast.success("Field deleted");
            } catch (error) {
                toast.error("Failed to delete field");
            }
        }
    };

    const startEditing = (field) => {
        setEditingId(field.id);
        setIsAdding(false);
        setFormData({
            field_label: field.field_label,
            field_type: field.field_type,
            options: field.options ? field.options.join(', ') : ''
        });
    };

    return (
        <div className="p-6 bg-white min-h-screen">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Custom Fields Manager</h1>
                        <p className="text-sm text-gray-500">Manage custom fields for the Leads module.</p>
                    </div>
                    {!isAdding && !editingId && (
                        <button 
                            onClick={() => { setIsAdding(true); setFormData({ field_label: '', field_type: 'text', options: '' }); }}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition"
                        >
                            <Plus size={18} /> Add New Field
                        </button>
                    )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                    {/* Header Row */}
                    <div className="grid grid-cols-12 gap-4 font-semibold text-gray-600 mb-3 border-b pb-2 px-2 text-sm">
                        <div className="col-span-4">Field Label</div>
                        <div className="col-span-3">Field Type</div>
                        <div className="col-span-4">Options (if dropdown)</div>
                        <div className="col-span-1 text-center">Actions</div>
                    </div>

                    {/* Adding New Row */}
                    {isAdding && (
                        <div className="grid grid-cols-12 gap-4 items-center bg-white p-3 rounded-md shadow-sm border border-orange-200 mb-3">
                            <div className="col-span-4">
                                <input 
                                    type="text" 
                                    placeholder="e.g. Industry Type" 
                                    value={formData.field_label}
                                    onChange={(e) => setFormData({...formData, field_label: e.target.value})}
                                    className="w-full px-3 py-2 border rounded-md text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                                />
                            </div>
                            <div className="col-span-3">
                                <select 
                                    value={formData.field_type}
                                    onChange={(e) => setFormData({...formData, field_type: e.target.value})}
                                    className="w-full px-3 py-2 border rounded-md text-sm focus:border-orange-500 outline-none bg-white"
                                >
                                    <option value="text">Text</option>
                                    <option value="number">Number</option>
                                    <option value="date">Date</option>
                                    <option value="dropdown">Dropdown</option>
                                </select>
                            </div>
                            <div className="col-span-4">
                                {formData.field_type === 'dropdown' ? (
                                    <input 
                                        type="text" 
                                        placeholder="Comma separated (e.g. IT, Sales, Retail)" 
                                        value={formData.options}
                                        onChange={(e) => setFormData({...formData, options: e.target.value})}
                                        className="w-full px-3 py-2 border rounded-md text-sm focus:border-orange-500 outline-none"
                                    />
                                ) : (
                                    <span className="text-gray-400 text-xs italic">N/A</span>
                                )}
                            </div>
                            <div className="col-span-1 flex justify-center gap-2">
                                <button onClick={handleSaveNew} className="text-green-600 hover:text-green-800 p-1"><Check size={18} /></button>
                                <button onClick={() => setIsAdding(false)} className="text-red-600 hover:text-red-800 p-1"><X size={18} /></button>
                            </div>
                        </div>
                    )}

                    {/* Existing Fields */}
                    {isLoading ? (
                        <div className="text-center py-4 text-gray-500 text-sm animate-pulse">Loading fields...</div>
                    ) : customFields.length === 0 && !isAdding ? (
                        <div className="text-center py-8 text-gray-400 text-sm bg-white rounded-md border border-dashed border-gray-300">
                            No custom fields defined yet.
                        </div>
                    ) : (
                        customFields.map((field) => (
                            editingId === field.id ? (
                                /* Editing Row */
                                <div key={field.id} className="grid grid-cols-12 gap-4 items-center bg-orange-50 p-3 rounded-md shadow-sm border border-orange-200 mb-2">
                                    <div className="col-span-4">
                                        <input 
                                            type="text" 
                                            value={formData.field_label}
                                            onChange={(e) => setFormData({...formData, field_label: e.target.value})}
                                            className="w-full px-3 py-2 border rounded-md text-sm focus:border-orange-500 outline-none bg-white"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <select 
                                            value={formData.field_type}
                                            onChange={(e) => setFormData({...formData, field_type: e.target.value})}
                                            className="w-full px-3 py-2 border rounded-md text-sm focus:border-orange-500 outline-none bg-white"
                                        >
                                            <option value="text">Text</option>
                                            <option value="number">Number</option>
                                            <option value="date">Date</option>
                                            <option value="dropdown">Dropdown</option>
                                        </select>
                                    </div>
                                    <div className="col-span-4">
                                        {formData.field_type === 'dropdown' ? (
                                            <input 
                                                type="text" 
                                                value={formData.options}
                                                onChange={(e) => setFormData({...formData, options: e.target.value})}
                                                className="w-full px-3 py-2 border rounded-md text-sm focus:border-orange-500 outline-none bg-white"
                                            />
                                        ) : (
                                            <span className="text-gray-400 text-xs italic">N/A</span>
                                        )}
                                    </div>
                                    <div className="col-span-1 flex justify-center gap-2">
                                        <button onClick={() => handleSaveEdit(field.id)} className="text-green-600 hover:text-green-800 p-1"><Check size={18} /></button>
                                        <button onClick={() => setEditingId(null)} className="text-red-600 hover:text-red-800 p-1"><X size={18} /></button>
                                    </div>
                                </div>
                            ) : (
                                /* Display Row */
                                <div key={field.id} className="grid grid-cols-12 gap-4 items-center bg-white p-3 rounded-md shadow-sm border border-gray-100 mb-2 hover:shadow-md transition">
                                    <div className="col-span-4 text-sm font-medium text-gray-800">{field.field_label}</div>
                                    <div className="col-span-3 text-sm text-gray-600 capitalize">
                                        <span className="px-2 py-1 bg-gray-100 rounded-sm text-xs font-semibold">{field.field_type}</span>
                                    </div>
                                    <div className="col-span-4 text-sm text-gray-600">
                                        {field.field_type === 'dropdown' ? (
                                            <div className="flex flex-wrap gap-1">
                                                {field.options?.map((opt, i) => (
                                                    <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-sm text-xs border border-blue-100">
                                                        {opt}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-xs">-</span>
                                        )}
                                    </div>
                                    <div className="col-span-1 flex justify-center gap-2">
                                        <button onClick={() => startEditing(field)} className="text-gray-400 hover:text-orange-600 p-1"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete(field.id)} className="text-gray-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            )
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomFieldsManager;
