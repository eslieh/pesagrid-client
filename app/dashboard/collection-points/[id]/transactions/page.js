"use client";

import { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { getRecentPayments } from "../../../../../lib/Dashboard";
import { getCollectionPoints } from "../../../../../lib/CollectionPoint";
import { getPaymentChannels } from "../../../../../lib/PaymentChannel";

const badgeColors = {
  success: "bg-[#a3e635]/20 text-[#65a30d]",
  settled: "bg-[#a3e635]/20 text-[#65a30d]",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
};

export default function CollectionPointTransactions({ params }) {
  const { id } = use(params);

  const today = new Date().toISOString().split('T')[0];
  const [datePreset, setDatePreset] = useState("today");
  const [dateRange, setDateRange] = useState({ start: today, end: today });

  useEffect(() => {
    if (datePreset === "custom") return;
    const now = new Date();
    let start = new Date();
    if (datePreset === "week") start.setDate(now.getDate() - 7);
    else if (datePreset === "month") start.setMonth(now.getMonth() - 1);
    else if (datePreset === "year") start.setFullYear(now.getFullYear() - 1);
    
    setDateRange({
      start: start.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0]
    });
  }, [datePreset]);

  const [collectionPoint, setCollectionPoint] = useState(null);
  const [skip, setSkip] = useState(0);

  // Advanced Filters
  const [search, setSearch] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [sort, setSort] = useState("date_desc");
  const [pspConfigs, setPspConfigs] = useState([]);
  const [selectedPspId, setSelectedPspId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  

  const limit = 20;

  // Fetch PSP Configs for filtering
  useEffect(() => {
    async function fetchConfigs() {
      try {
        const res = await getPaymentChannels({ limit: 100 });
        setPspConfigs(res.items || []);
      } catch (err) {
        console.error("Failed to fetch PSP configs", err);
      }
    }
    fetchConfigs();
  }, []);

  // Debounced Search state
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Refactored Fetch to be callable manually
  const fetchData = async (isLoadMore = false) => {
    try {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      // Conditionally omit date range if searching
      const isSearching = !!search.trim();
      const startISO = isSearching ? null : `${dateRange.start}T00:00:00`;
      const endISO = isSearching ? null : `${dateRange.end}T23:59:59`;
      
      const currentSkip = isLoadMore ? skip + limit : 0;

      const [pointsData, paymentsData] = await Promise.all([
        !collectionPoint ? getCollectionPoints().catch(() => []) : Promise.resolve(null),
        getRecentPayments(id, currentSkip, limit, startISO, endISO, {
          search,
          amount_min: amountMin || undefined,
          amount_max: amountMax || undefined,
          sort,
          psp_config_id: selectedPspId || undefined
        }).catch(() => ({ items: [], total: 0 }))
      ]);

      if (pointsData) {
        const currentPoint = pointsData.items?.find(p => p.id === id);
        setCollectionPoint(currentPoint);
      }

      if (isLoadMore) {
        setTransactions(prev => [...prev, ...paymentsData.items]);
        setSkip(currentSkip);
      } else {
        setTransactions(paymentsData.items || []);
        setSkip(0);
      }
      
      setHasMore((paymentsData.items || []).length === limit);
    } catch (error) {
      console.error("Failed to fetch transaction data:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Fetch on dependency changes
  useEffect(() => {
    fetchData();
  }, [id, dateRange, sort, debouncedSearch, amountMin, amountMax, selectedPspId]);

  // Load More functionality
  const loadMore = () => fetchData(true);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "KES",
    }).format(val);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getInitials = (name) => {
    if (!name) return "P";
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="flex items-center gap-2 text-[12px] font-medium text-zinc-400 mb-2">
            <Link href="/dashboard/collection-points" className="hover:text-zinc-900 transition-colors">Collection Points</Link>
            <span>/</span>
            <Link href={`/dashboard/collection-points/${id}/dashboard`} className="hover:text-zinc-900 transition-colors max-w-[150px] truncate">
              {collectionPoint ? collectionPoint.name : '...'}
            </Link>
            <span>/</span>
            <span className="text-zinc-900">Transactions</span>
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-zinc-900 flex items-center gap-3">
            Transactions Registry
            <span className="bg-[#a3e635]/10 text-[#65a30d] text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">Live</span>
          </h1>
          <p className="text-[13px] text-zinc-500 mt-1">
            Real-time feed for <span className="font-bold text-zinc-700">{collectionPoint?.account_no || 'loading...'}</span>
          </p>
        </div>

      </div>
      
      {/* Advanced Filters Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-zinc-50 border border-zinc-200 p-4 rounded-3xl">
        {/* Date Filter */}
        <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-2xl p-1.5 shadow-sm">
           <span className="text-[10px] font-black uppercase text-zinc-400 pl-2">Period</span>
           <select 
             value={datePreset}
             onChange={(e) => setDatePreset(e.target.value)}
             className="bg-transparent border-none text-[12px] font-bold text-zinc-900 focus:outline-none focus:ring-0 cursor-pointer pr-4"
           >
             <option value="today">Today</option>
             <option value="week">Past 7 Days</option>
             <option value="month">Past 30 Days</option>
             <option value="year">Past Year</option>
             <option value="custom">Custom Range</option>
           </select>
           
           <AnimatePresence>
             {datePreset === "custom" && (
               <motion.div 
                 initial={{ width: 0, opacity: 0 }}
                 animate={{ width: "auto", opacity: 1 }}
                 exit={{ width: 0, opacity: 0 }}
                 className="flex items-center gap-2 pr-2 border-l border-zinc-100 ml-1 pl-3 overflow-hidden whitespace-nowrap"
               >
                 <input 
                   type="date" 
                   value={dateRange.start}
                   onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                   className="text-[11px] font-bold text-zinc-900 focus:outline-none bg-transparent cursor-pointer w-[105px]"
                 />
                 <span className="text-zinc-300 text-[10px]">to</span>
                 <input 
                   type="date" 
                   value={dateRange.end}
                   onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                   className="text-[11px] font-bold text-zinc-900 focus:outline-none bg-transparent cursor-pointer w-[105px]"
                 />
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* Smart Search */}
        <div className="flex-1 min-w-[240px] relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text"
            placeholder="Search payments by Ref, MSISDN, or Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchData()}
            className="w-full bg-white border border-zinc-200 rounded-2xl pl-10 pr-4 py-2.5 text-[13px] font-medium text-zinc-900 focus:outline-none focus:ring-4 focus:ring-[#a3e635]/10 focus:border-[#a3e635] shadow-sm transition-all"
          />
        </div>

        {/* Amount Filter */}
        <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-2xl p-1 shadow-sm">
          <span className="text-[10px] font-black uppercase text-zinc-400 pl-3 pr-1">Amount</span>
          <input 
            type="number"
            placeholder="Min"
            value={amountMin}
            onChange={(e) => setAmountMin(e.target.value)}
            className="w-20 bg-zinc-50 border-none rounded-xl px-2.5 py-1.5 text-[12px] font-bold text-zinc-900 focus:outline-none focus:ring-0"
          />
          <span className="text-zinc-300">-</span>
          <input 
            type="number"
            placeholder="Max"
            value={amountMax}
            onChange={(e) => setAmountMax(e.target.value)}
            className="w-20 bg-zinc-50 border-none rounded-xl px-2.5 py-1.5 text-[12px] font-bold text-zinc-900 focus:outline-none focus:ring-0"
          />
        </div>

        {/* Channel Filter */}
        <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-2xl p-1.5 shadow-sm">
           <span className="text-[10px] font-black uppercase text-zinc-400 pl-2">Channel</span>
           <select 
             value={selectedPspId}
             onChange={(e) => setSelectedPspId(e.target.value)}
             className="bg-transparent border-none text-[12px] font-bold text-zinc-900 focus:outline-none focus:ring-0 cursor-pointer pr-4 max-w-[120px]"
           >
             <option value="">All Channels</option>
             {pspConfigs.map(config => (
               <option key={config.id} value={config.id}>{config.display_name}</option>
             ))}
           </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-2xl p-1.5 shadow-sm">
           <span className="text-[10px] font-black uppercase text-zinc-400 pl-2">Sort</span>
           <select 
             value={sort}
             onChange={(e) => setSort(e.target.value)}
             className="bg-transparent border-none text-[12px] font-bold text-zinc-900 focus:outline-none focus:ring-0 cursor-pointer pr-4"
           >
             <option value="date_desc">Newest First</option>
             <option value="date_asc">Oldest First</option>
             <option value="amount_desc">Highest Amount</option>
             <option value="amount_asc">Lowest Amount</option>
           </select>
        </div>

        {/* Apply Button */}
        <button 
          onClick={() => fetchData()}
          disabled={loading}
          className="bg-zinc-900 text-white px-5 py-2.5 rounded-2xl text-[12px] font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-zinc-200"
        >
          {loading ? (
            <span className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
          Search
        </button>
      </div>

      {!collectionPoint && loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
             <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-100 border-t-[#a3e635]" />
             <p className="text-[12px] font-bold text-zinc-400 uppercase tracking-wider animate-pulse">Loading...</p>
          </div>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm transition-all ${loading ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}
        >
          {loading && (
             <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
                <div className="flex flex-col items-center gap-2">
                   <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-100 border-t-[#a3e635]" />
                   <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Refreshing Feed</p>
                </div>
             </div>
          )}
          {transactions.length === 0 ? (
            <div className="py-24 text-center">
              <span className="text-4xl mb-4 block">📭</span>
              <h3 className="text-[16px] font-bold text-zinc-900 mb-1">No receipts yet</h3>
              <p className="text-[13px] text-zinc-500">We couldn't find any inbound transactions for this period.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {transactions.map((tx, idx) => {
                const confidence = tx.matched_confidence || 0;
                const confidenceColor = confidence >= 0.85 ? "text-[#65a30d] bg-[#a3e635]/10" : 
                                      confidence >= 0.7 ? "text-amber-600 bg-amber-50" : 
                                      "text-zinc-400 bg-zinc-50";

                return (
                  <div key={idx} className="group p-5 hover:bg-zinc-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6">
                    
                    {/* Avatar & Core Detail */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="h-12 w-12 rounded-full flex-shrink-0 flex items-center justify-center text-[14px] font-black text-zinc-500 bg-zinc-100/80 border border-zinc-200">
                        {getInitials(tx.payer_name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-[14px] font-bold text-zinc-900 truncate">
                            {tx.payer_name || tx.psp_ref || "Unknown Payer"}
                          </h4>
                          {confidence > 0 && (
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${confidenceColor}`}>
                              {Math.round(confidence * 100)}% Match
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                           <span className="text-zinc-500">{tx.psp_type?.replace('_', ' ')}</span>
                           <span className="h-1 w-1 rounded-full bg-zinc-300"/>
                           <span>{tx.psp_ref}</span>
                           {tx.phone && (
                             <>
                               <span className="h-1 w-1 rounded-full bg-zinc-300"/>
                               <span className="tabular-nums">{tx.phone}</span>
                             </>
                           )}
                        </div>

                        {/* Enhanced Match Context */}
                        {(tx.matched_payer || tx.matched_obligation) && (
                          <div className="mt-3 p-3 rounded-2xl bg-zinc-50 border border-zinc-100 flex flex-col gap-1.5">
                            {tx.matched_payer && (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-zinc-300 uppercase tracking-tighter w-14">Payer</span>
                                <span className="text-[11px] font-bold text-indigo-600">{tx.matched_payer.payer_name}</span>
                                <span className="text-[10px] text-zinc-400 font-medium">({tx.matched_payer.account_no})</span>
                              </div>
                            )}
                            {tx.matched_obligation && (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-zinc-300 uppercase tracking-tighter w-14">Target</span>
                                <span className="text-[11px] font-bold text-zinc-700">{tx.matched_obligation.description}</span>
                                <span className="text-[10px] text-[#65a30d] font-bold bg-[#a3e635]/10 px-1.5 py-0.5 rounded">
                                  Bal: {formatCurrency(tx.matched_obligation.balance)}
                                </span>
                              </div>
                            )}
                            {tx.match_reasons?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-1 pt-1.5 border-t border-zinc-100">
                                {tx.match_reasons.map((reason, ri) => (
                                  <span key={ri} className="text-[9px] font-medium text-zinc-400 px-1.5 py-0.5 bg-white border border-zinc-200 rounded">
                                    {reason.replace(/_/g, ' ')}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Desktop Right Side Metadata */}
                    <div className="flex items-center justify-between md:justify-end gap-10 flex-1 md:flex-none">
                      <div className="text-left md:text-right">
                        <p className="text-[17px] font-black text-zinc-900 leading-tight">+{formatCurrency(tx.amount)}</p>
                        <p className="text-[11px] font-medium text-zinc-500 mt-1">{formatDate(tx.ingested_at)}</p>
                      </div>
                      
                      <div className="w-24 text-right">
                        <span className={`inline-flex px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm border border-black/5 ${badgeColors[tx.status?.toLowerCase()] || badgeColors.pending}`}>
                          {tx.status || "Pending"}
                        </span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
          
          {/* Footer Actions */}
          {transactions.length > 0 && (
             <div className="p-5 bg-zinc-50 border-t border-zinc-100 flex justify-center">
                {hasMore ? (
                  <button 
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="px-6 py-2 rounded-xl bg-white border border-zinc-200 text-[12px] font-bold text-zinc-700 hover:border-zinc-300 hover:text-zinc-900 transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    {loadingMore ? (
                      <><span className="h-3 w-3 border-2 border-zinc-300 border-t-zinc-600 animate-spin rounded-full"/> Loading...</>
                    ) : "Load Older"}
                  </button>
                ) : (
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">End of feed</span>
                )}
             </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
