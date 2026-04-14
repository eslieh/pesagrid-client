"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function GlobalSearchHeader({ 
  search, setSearch, 
  dateRange, setDateRange, 
  datePreset, setDatePreset,
  amountMin, setAmountMin,
  amountMax, setAmountMax,
  selectedPspId, setSelectedPspId,
  pspConfigs,
  collectionPoints,
  onSearch,
  loading
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Find the dashboard's scroll container
    const scrollContainer = document.querySelector(".overflow-y-auto");
    if (!scrollContainer) return;

    const handleScroll = () => {
      const scrollY = scrollContainer.scrollTop;
      setIsScrolled(scrollY > 20);
      setIsExpanded(scrollY <= 20);
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    // Initial check
    handleScroll();

    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, []);

  const getFilterSummary = () => {
    const parts = [];
    if (search) parts.push(`"${search}"`);
    parts.push(datePreset.charAt(0).toUpperCase() + datePreset.slice(1));
    if (selectedPspId) {
      const psp = pspConfigs.find(p => p.id === selectedPspId);
      if (psp) parts.push(psp.display_name);
    }
    return parts.join(" • ") || "Explore Registry";
  };

  return (
    <div className={`sticky top-0 z-50 w-full flex justify-center py-2 px-4 sm:px-6 transition-all duration-300`}>
      <AnimatePresence>
        {isExpanded ? (
          /* Expanded Bar */
          <motion.div 
            key="expanded"
            initial={{ y: -20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -10, opacity: 0, scale: 0.98 }}
            className={`w-full max-w-4xl border rounded-[28px] sm:rounded-[32px] shadow-2xl transition-all duration-500 p-2 flex flex-col lg:flex-row items-stretch lg:items-center gap-2 ${
              isScrolled 
                ? "bg-white/95 backdrop-blur-3xl border-zinc-200/50 shadow-zinc-300/40" 
                : "bg-white border-zinc-200 shadow-zinc-200/20"
            }`}
          >
            <div className="flex flex-col sm:flex-row flex-1 gap-2">
              {/* Target Selector */}
              <div className="flex-1 px-4 sm:px-6 py-2 border-b sm:border-b-0 sm:border-r border-zinc-100 group cursor-pointer hover:bg-zinc-50 rounded-2xl transition-colors">
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-tighter text-zinc-400">Target</p>
                <select 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent border-none text-[12px] sm:text-[13px] font-bold text-zinc-900 focus:outline-none focus:ring-0 w-full p-0 mt-0.5 appearance-none"
                >
                  <option value="">All Instruments</option>
                  {collectionPoints.map(cp => (
                    <option key={cp.id} value={cp.account_no}>{cp.name} ({cp.account_no})</option>
                  ))}
                </select>
              </div>

              {/* Period / Date Selector */}
              <div className="flex-1 px-4 sm:px-6 py-2 border-b sm:border-b-0 sm:border-r border-zinc-100 group cursor-pointer hover:bg-zinc-50 rounded-2xl transition-colors">
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-tighter text-zinc-400">When</p>
                <select 
                  value={datePreset}
                  onChange={(e) => setDatePreset(e.target.value)}
                  className="bg-transparent border-none text-[12px] sm:text-[13px] font-bold text-zinc-900 focus:outline-none focus:ring-0 w-full p-0 mt-0.5 cursor-pointer appearance-none"
                >
                  <option value="today">Today</option>
                  <option value="week">Past Week</option>
                  <option value="month">Past Month</option>
                  <option value="year">Past Year</option>
                  <option value="custom">Custom Range</option>
                </select>
                <AnimatePresence>
                  {datePreset === "custom" && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="flex flex-col gap-1 mt-2 pt-2 border-t border-zinc-100"
                    >
                      <input 
                        type="date" 
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="text-[10px] font-bold text-zinc-600 focus:outline-none bg-transparent cursor-pointer"
                      />
                      <input 
                        type="date" 
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="text-[10px] font-bold text-zinc-600 focus:outline-none bg-transparent cursor-pointer"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Context (PSP / Search) */}
            <div className="flex-[1.8] px-4 sm:px-6 py-2 group cursor-pointer hover:bg-zinc-50 rounded-2xl transition-colors">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <div className="flex-1">
                  <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-tighter text-zinc-400">Search</p>
                  <input 
                    type="text" 
                    placeholder="Ref, MSISDN, Name..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-transparent border-none text-[12px] sm:text-[13px] font-bold text-zinc-900 focus:outline-none focus:ring-0 p-0 placeholder:font-medium placeholder:text-zinc-300 w-full mt-0.5"
                  />
                </div>
                <div className="hidden sm:block w-[1px] h-8 bg-zinc-100" />
                <div className="flex-1">
                  <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-tighter text-zinc-400">Channel</p>
                  <select 
                    value={selectedPspId}
                    onChange={(e) => setSelectedPspId(e.target.value)}
                    className="bg-transparent border-none text-[12px] sm:text-[13px] font-bold text-zinc-900 focus:outline-none focus:ring-0 p-0 mt-0.5 w-full cursor-pointer truncate appearance-none"
                  >
                    <option value="">All PSPs</option>
                    {pspConfigs.map(p => (
                      <option key={p.id} value={p.id}>{p.display_name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Search Button */}
            <div className="flex items-center justify-between lg:justify-end gap-3 mt-2 lg:mt-0 p-2 lg:p-0">
               <button 
                  onClick={() => setIsExpanded(false)}
                  className="lg:hidden text-[11px] font-bold text-zinc-400 px-4 py-2"
               >
                  Collapse
               </button>
               <button 
                onClick={() => { onSearch(); if (window.innerWidth < 1024) setIsExpanded(false); }}
                className="h-10 sm:h-12 flex-1 lg:flex-none lg:w-12 rounded-2xl lg:rounded-full bg-zinc-900 text-white flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all active:scale-95 flex-shrink-0 shadow-lg shadow-zinc-400/20"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                ) : (
                  <>
                    <svg className="h-4 sm:h-5 w-4 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="lg:hidden text-[12px] font-bold uppercase tracking-widest">Search</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ) : (
          /* Collapsed Glass Header */
          <motion.div 
            key="collapsed"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            onClick={() => setIsExpanded(true)}
            className={`w-full max-w-md backdrop-blur-3xl border rounded-full shadow-2xl p-1.5 flex items-center justify-between gap-4 cursor-pointer hover:scale-[1.02] transition-all group ${
              isScrolled 
                ? "bg-white/95 border-zinc-300/50 shadow-zinc-400/50" 
                : "bg-white/90 border-zinc-200/50 shadow-zinc-200/20"
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-4 pl-3 sm:pl-4 overflow-hidden whitespace-nowrap">
              <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4">
                <span className="text-[11px] sm:text-[12px] font-black text-zinc-900 truncate max-w-[150px] sm:max-w-none">
                  {getFilterSummary()}
                </span>
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline h-1 w-1 rounded-full bg-zinc-300 flex-shrink-0" />
                  <span className="text-[9px] sm:text-[11px] font-bold text-zinc-400/80 uppercase tracking-tight">
                    Fixed Filter View
                  </span>
                </div>
              </div>
            </div>
            
            <div className="h-8 w-8 rounded-full bg-zinc-900 text-white flex items-center justify-center flex-shrink-0 group-hover:bg-[#a3e635] group-hover:text-zinc-900 transition-all shadow-lg shadow-zinc-900/10">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}