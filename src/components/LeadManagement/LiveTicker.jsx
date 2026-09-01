import React, { useState, useEffect } from 'react';
import { useGetWatchTickerQuery } from '../../store/api/leadApi';
import { AlertCircle, Clock, PlusCircle } from 'lucide-react';

const LiveTicker = ({ onLeadClick }) => {
  const { data: tickerItems, isLoading } = useGetWatchTickerQuery(undefined, { pollingInterval: 60000 });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);

  const items = tickerItems || [];

  useEffect(() => {
    if (items.length === 0) return;
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setCurrentIndex((prev) => prev + 1);
    }, 3500); // Wait 3.5s per item
    return () => clearInterval(timer);
  }, [items.length]);

  const handleTransitionEnd = () => {
    if (currentIndex === items.length) {
      setIsTransitioning(false);
      setCurrentIndex(0);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full bg-white border border-gray-200 h-10 flex items-center px-4 rounded-none shadow-sm animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
    );
  }

  const getIcon = (type) => {
    switch (type) {
      case 'missed': return <AlertCircle size={14} className="text-red-500 mr-2 flex-shrink-0" />;
      case 'upcoming': return <Clock size={14} className="text-orange-500 mr-2 flex-shrink-0" />;
      case 'new': return <PlusCircle size={14} className="text-blue-500 mr-2 flex-shrink-0" />;
      default: return null;
    }
  };

  const getStyle = (type) => {
     switch (type) {
      case 'missed': return "border-l-[3px] border-l-red-500 bg-red-50/30 hover:bg-red-50 text-gray-800";
      case 'upcoming': return "border-l-[3px] border-l-orange-500 bg-orange-50/30 hover:bg-orange-50 text-gray-800";
      case 'new': return "border-l-[3px] border-l-blue-500 bg-blue-50/30 hover:bg-blue-50 text-gray-800";
      default: return "border-l-[3px] border-l-gray-500 bg-gray-50/30 hover:bg-gray-50 text-gray-800";
    }
  };

  const getUrgencyText = (type) => {
    switch (type) {
      case 'missed': return <span className="text-red-600 font-bold tracking-wide mr-1">URGENT:</span>;
      case 'upcoming': return <span className="text-orange-600 font-bold tracking-wide mr-1">SOON:</span>;
      case 'new': return <span className="text-blue-600 font-bold tracking-wide mr-1">NEW:</span>;
      default: return null;
    }
  };

  // Duplicate the first item to create a seamless infinite loop
  const displayItems = items.length > 0 ? [...items, items[0]] : items;

  return (
    <div className="w-full flex items-center h-10 overflow-hidden relative border border-gray-200 bg-white rounded-none">
      
      {/* Premium Dark Static Label */}
      <div className="bg-gray-900 z-10 px-4 h-full flex items-center shrink-0">
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-none animate-pulse"></div>
            <span className="font-bold text-white uppercase tracking-widest text-[11px]">Live Watch</span>
        </div>
      </div>

      {/* Vertical Scrolling Content */}
      <div className="flex-1 h-full overflow-hidden relative border-l border-gray-200">
        {items.length === 0 ? (
          <div className="h-full flex items-center text-gray-400 text-[13px] font-medium px-4">No urgent alerts at the moment.</div>
        ) : (
          <div 
            className="flex flex-col w-full"
            style={{ 
              transform: `translateY(-${currentIndex * 40}px)`, 
              transition: isTransitioning ? 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)' : 'none' 
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {displayItems.map((item, index) => (
              <div 
                key={`${item.id}-${index}`} 
                onClick={() => onLeadClick && onLeadClick(item)}
                className={`flex items-center h-[40px] px-4 text-[13px] font-medium rounded-none cursor-pointer transition-colors ${getStyle(item.type)}`}
              >
                {getIcon(item.type)}
                <div className="truncate flex-1">
                  {getUrgencyText(item.type)}
                  {item.message}
                </div>
                <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider ml-4 shrink-0">Click to View</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTicker;
