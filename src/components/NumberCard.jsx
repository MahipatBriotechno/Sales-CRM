import React from "react";
import { FileText } from "lucide-react";

const NumberCard = ({ title, number, lineBorderClass, icon, iconBgColor, up, down, children, onClick, variant = "default" }) => {
  if (variant === "matrix") {
    // Determine color mapping based on lineBorderClass
    const colorMap = {
      "border-blue-500": { border: "border-t-blue-500", text: "text-blue-500", bg: "bg-blue-50/50" },
      "border-green-500": { border: "border-t-green-500", text: "text-green-500", bg: "bg-green-50/50" },
      "border-orange-500": { border: "border-t-orange-500", text: "text-orange-500", bg: "bg-orange-50/50" },
      "border-purple-500": { border: "border-t-purple-500", text: "text-purple-500", bg: "bg-purple-50/50" },
      "border-red-500": { border: "border-t-red-500", text: "text-red-500", bg: "bg-red-50/50" },
      "border-yellow-500": { border: "border-t-yellow-500", text: "text-yellow-500", bg: "bg-yellow-50/50" },
    };

    const style = colorMap[lineBorderClass] || colorMap["border-orange-500"];

    return (
      <div className={`rounded-none shadow-sm border border-gray-200 p-4 border-t-4 ${style.border} ${style.bg} transition-all duration-300 hover:shadow-md cursor-pointer`} onClick={onClick}>
        <div className="flex items-center justify-between font-primary">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-none bg-white border border-gray-100 shadow-sm flex items-center justify-center shrink-0">
              {icon && React.isValidElement(icon)
                ? React.cloneElement(icon, { size: 18, className: style.text })
                : icon}
            </div>
            <h3 className="text-sm font-bold text-gray-800 capitalize tracking-tight">{title}</h3>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <span className="bg-white text-gray-700 text-[11px] font-bold px-2 py-0.5 rounded-none border border-gray-100 shadow-sm">
              {number}
            </span>
            {up && <span className="text-[9px] font-bold text-green-600 mt-1">{up}</span>}
            {down && <span className="text-[9px] font-bold text-rose-600 mt-1">{down}</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-none shadow-sm hover:shadow-md p-5 border-t-4 ${lineBorderClass}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-800 mt-1">
            {number}
          </p>
        </div>
        <div className="flex flex-col items-center">
          {up && (
            <div className="flex items-center px-2 my-1 text-sm text-green-500 bg-green-100 font-bold">
              {up}
            </div>
          )}
          {down && (
            <div className="flex items-center px-2 my-1 text-sm text-red-500 bg-red-100 font-bold">
              {down}
            </div>
          )}
          <div className={`${iconBgColor} p-3 rounded-none`} >
            {icon}
          </div>
        </div>
      </div>
      {children && (
        <div className="flex gap-3 text-xs mt-4">
          {children}
        </div>
      )}
    </div>
  );
};
export default NumberCard;
