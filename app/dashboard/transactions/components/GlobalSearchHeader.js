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

  // Handle scroll to collapse/expand
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsExpanded(false);
      } else {
        setIsExpanded(true);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="sticky top-0 z-50 w-full flex justify-center pt-4 pb-2 px-6">
      <AnimatePresence mode="wait">
        {isExpanded ? (
          /* Expanded Airbnb-style Bar */
          <motion.div 
            key="expanded"
            initial={{ y: -20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -10, opacity: 0, scale: 0.98 }}
            className="w-full max-w-4xl bg-white/80 backdrop-blur-2xl border border-zinc-200 rounded-[32px] shadow-2xl shadow-zinc-200/50 p-2 flex items-center gap-2"
          >
            {/* Target Selector */}
            <div className="flex-1 px-6 py-2 border-r border-zinc-100 group cursor-pointer hover:bg-zinc-50 rounded-2xl transition-colors">
              <p className="text-[10px] font-black uppercase tracking-tighter text-zinc-400">Target</p>
              <select 
                value={search} // We'll use search for instrument ID if coming from deep link, or just a separate state
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent border-none text-[13px] font-bold text-zinc-900 focus:outline-none focus:ring-0 w-full p-0 mt-0.5"
              >
                <option value="">All Instruments</option>
                {collectionPoints.map(cp => (
                  <option key={cp.id} value={cp.account_no}>{cp.name} ({cp.account_no})</option>
                ))}
              </select>
            </div>

            {/* Period / Date Selector */}
            <div className="flex-1 px-6 py-2 border-r border-zinc-100 group cursor-pointer hover:bg-zinc-50 rounded-2xl transition-colors">
              <p className="text-[10px] font-black uppercase tracking-tighter text-zinc-400">When</p>
              <select 
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value)}
                className="bg-transparent border-none text-[13px] font-bold text-zinc-900 focus:outline-none focus:ring-0 w-full p-0 mt-0.5 cursor-pointer"
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
                      className="text-[11px] font-bold text-zinc-600 focus:outline-none bg-transparent cursor-pointer"
                    />
                    <input 
                      type="date" 
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="text-[11px] font-bold text-zinc-600 focus:outline-none bg-transparent cursor-pointer"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Context (PSP / Search) */}
            <div className="flex-[1.8] px-6 py-2 group cursor-pointer hover:bg-zinc-50 rounded-2xl transition-colors">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-tighter text-zinc-400">Search</p>
                  <input 
                    type="text" 
                    placeholder="Ref, MSISDN, Name..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-transparent border-none text-[13px] font-bold text-zinc-900 focus:outline-none focus:ring-0 p-0 placeholder:font-medium placeholder:text-zinc-300 w-full mt-0.5"
                  />
                </div>
                <div className="w-[1px] h-8 bg-zinc-100" />
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-tighter text-zinc-400">Channel</p>
                  <select 
                    value={selectedPspId}
                    onChange={(e) => setSelectedPspId(e.target.value)}
                    className="bg-transparent border-none text-[13px] font-bold text-zinc-900 focus:outline-none focus:ring-0 p-0 mt-0.5 w-full cursor-pointer truncate"
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
            <button 
              onClick={() => onSearch()}
              className="h-12 w-12 rounded-full bg-zinc-900 text-white flex items-center justify-center hover:bg-zinc-800 transition-all active:scale-90 flex-shrink-0 shadow-lg shadow-zinc-400/20"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </button>
          </motion.div>
        ) : (
          /* Collapsed Glass Header */
          <motion.div 
            key="collapsed"
            initial={{ y: 10, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.9 }}
            onClick={() => setIsExpanded(true)}
            className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-zinc-200/50 rounded-full shadow-xl p-1.5 flex items-center justify-between gap-4 cursor-pointer hover:bg-white/90 transition-all group"
          >
            <div className="flex items-center gap-4 pl-4 overflow-hidden whitespace-nowrap">
              <span className="text-[12px] font-black text-zinc-900 truncate">
                {search || "Global Registry"}
              </span>
              <span className="h-1 w-1 rounded-full bg-zinc-300 flex-shrink-0" />
              <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-tight">
                {datePreset}
              </span>
            </div>
            
            <div className="h-8 w-8 rounded-full bg-zinc-900 text-white flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
