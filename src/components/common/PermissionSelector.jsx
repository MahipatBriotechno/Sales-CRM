import React from "react";
import { X, Check, Search } from "lucide-react";
import { permissionCategories } from "../../pages/EmployeePart/permissionsData";

const PermissionSelector = ({ selectedPermissions, onTogglePermission, onSelectCategory }) => {
    const [searchTerm, setSearchTerm] = React.useState("");

    const filteredCategories = Object.entries(permissionCategories).filter(([category, permissions]) => {
        if (!searchTerm) return true;
        const categoryMatches = category.toLowerCase().includes(searchTerm.toLowerCase());
        const permissionsMatch = permissions.some(p =>
            p.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return categoryMatches || permissionsMatch;
    });

    return (
        <div className="space-y-6 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
            <div className="sticky top-0 bg-white z-10 pb-4 border-b border-gray-100">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search permissions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                </div>
            </div>

            {filteredCategories.map(([category, permissions]) => {
                const allSelected = permissions.every((perm) => selectedPermissions[perm.id]);
                const someSelected = permissions.some((perm) => selectedPermissions[perm.id]);

                return (
                    <div key={category} className="bg-gray-50 rounded-none p-4 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-tight">
                                    {category}
                                </h4>
                                <span className="text-[10px] px-2 py-0.5 bg-gray-200 text-gray-600 rounded-none font-bold">
                                    {permissions.length}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => onSelectCategory(category)}
                                className={`text-[11px] font-bold px-3 py-1 rounded-none transition-all uppercase tracking-wider ${allSelected
                                        ? "bg-orange-500 text-white hover:bg-orange-600"
                                        : someSelected
                                            ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                    }`}
                            >
                                {allSelected ? "Deselect All" : "Select All"}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {permissions.map((perm) => {
                                const Icon = perm.icon;
                                const isSelected = selectedPermissions[perm.id];
                                return (
                                    <div
                                        key={perm.id}
                                        onClick={() => onTogglePermission(perm.id)}
                                        className={`group relative border rounded-none p-3 cursor-pointer transition-all duration-200 ${isSelected
                                                ? "border-orange-500 bg-orange-50/50 shadow-sm"
                                                : "border-gray-200 hover:border-orange-300 bg-white shadow-none"
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-1 flex-shrink-0 w-4 h-4 rounded-none border flex items-center justify-center transition-colors ${isSelected ? "bg-orange-500 border-orange-500" : "border-gray-300 bg-white group-hover:border-orange-400"
                                                }`}>
                                                {isSelected && <Check size={10} className="text-white font-bold" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    {Icon && <Icon size={14} className={isSelected ? "text-orange-600" : "text-gray-500"} />}
                                                    <span className={`font-bold text-xs ${isSelected ? "text-orange-900" : "text-gray-700"}`}>
                                                        {perm.label}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                                                    {perm.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default PermissionSelector;
