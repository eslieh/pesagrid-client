"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import GlobalSearchHeader from "./components/GlobalSearchHeader";
import TransactionItem from "./components/TransactionItem";
import { getTransactions } from "../../../lib/Transaction";
import { getCollectionPoints } from "../../../lib/CollectionPoint";
import { getPaymentChannels } from "../../../lib/PaymentChannel";

function TransactionsRegistryContent() {
  const searchParams = useSearchParams();
  
  // Basic states
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const limit = 20;

  // Metadata for filters
  const [collectionPoints, setCollectionPoints] = useState([]);
  const [pspConfigs, setPspConfigs] = useState([]);

  // Filter states
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [accountNo, setAccountNo] = useState(searchParams.get("account_no") || "");
  const [collectionPointId, setCollectionPointId] = useState(searchParams.get("cp_id") || "");
  const [datePreset, setDatePreset] = useState("month");
  const [dateRange, setDateRange] = useState({ 
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [selectedPspId, setSelectedPspId] = useState("");
  const [sort, setSort] = useState("date_desc");

  // Format Helper
  const formatCurrency = (val) => new Intl.NumberFormat("en-US", { style: "currency", currency: "KES" }).format(val);
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  const getInitials = (name) => name?.slice(0, 2).toUpperCase() || "P";

  // Fetch Metadata
  useEffect(() => {
    async function fetchMetadata() {
      try {
        const [cpRes, pspRes] = await Promise.all([
          getCollectionPoints(),
          getPaymentChannels({ limit: 100 })
        ]);
        setCollectionPoints(cpRes.items || []);
        setPspConfigs(pspRes.items || []);
      } catch (err) {
        console.error("Failed to load filter metadata:", err);
      }
    }
    fetchMetadata();
  }, []);

  // Main Fetcher
  const fetchData = useCallback(async (isLoadMore = false) => {
    try {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      const currentSkip = isLoadMore ? skip + limit : 0;
      
      const res = await getTransactions({
        search,
        account_no: accountNo || undefined,
        collection_point_id: collectionPointId || undefined,
        start_date: search ? undefined : `${dateRange.start}T00:00:00`,
        end_date: search ? undefined : `${dateRange.end}T23:59:59`,
        amount_min: amountMin || undefined,
        amount_max: amountMax || undefined,
        sort,
        skip: currentSkip,
        limit
      });

      if (isLoadMore) {
        setTransactions(prev => [...prev, ...res.items]);
        setSkip(currentSkip);
      } else {
        setTransactions(res.items || []);
        setSkip(0);
      }
      setHasMore((res.items || []).length === limit);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [search, accountNo, collectionPointId, dateRange, amountMin, amountMax, sort, skip]);

  // Initial load
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50/50 pb-20">
      {/* Premium Header Container */}
      <div className="bg-white border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-6 py-12 text-center">
            <motion.h1 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-[30px] font-bold tracking-tight text-zinc-900 leading-none"
            >
              Transaction Registry
            </motion.h1>
            <motion.p 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-[10px] font-medium text-zinc-400 mt-4 uppercase tracking-[0.2em]"
            >
              Real-time Ledger & Context Insight
            </motion.p>
        </div>
      </div>

      {/* The Airbnb Filter Header (Sticky) */}
      <GlobalSearchHeader 
        search={search} setSearch={setSearch}
        dateRange={dateRange} setDateRange={setDateRange}
        datePreset={datePreset} setDatePreset={setDatePreset}
        amountMin={amountMin} setAmountMin={setAmountMin}
        amountMax={amountMax} setAmountMax={setAmountMax}
        selectedPspId={selectedPspId} setSelectedPspId={setSelectedPspId}
        pspConfigs={pspConfigs}
        collectionPoints={collectionPoints}
        onSearch={() => fetchData(false)}
        loading={loading}
      />

      {/* Main Feed Container */}
      <main className="max-w-4xl mx-auto mt-8 px-6">
        <AnimatePresence mode="wait">
          {loading && transactions.length === 0 ? (
            /* Premium Skeleton / Loading */
            <motion.div 
               key="loading"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="space-y-4"
            >
               {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-24 bg-white/50 animate-pulse border border-zinc-100 rounded-3xl" />
               ))}
            </motion.div>
          ) : transactions.length === 0 ? (
            /* Empty State */
            <motion.div 
               key="empty"
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="py-32 text-center flex flex-col items-center"
            >
               <div className="h-20 w-20 rounded-full bg-zinc-100 flex items-center justify-center text-3xl mb-6">📭</div>
               <h3 className="text-[18px] font-bold text-zinc-900">No records found</h3>
               <p className="text-[13px] text-zinc-500 mt-1 max-w-[240px]">We couldn't find any transactions matching your current filters.</p>
               <button 
                  onClick={() => { setSearch(""); setDatePreset("month"); fetchData(false); }}
                  className="mt-6 text-[12px] font-black text-[#65a30d] uppercase tracking-widest hover:underline"
               >
                  Clear Filters
               </button>
            </motion.div>
          ) : (
            /* The Feed */
            <motion.div 
              key="feed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white border border-zinc-200 rounded-[40px] shadow-sm overflow-hidden divide-y divide-zinc-50"
            >
              {transactions.map((tx, idx) => (
                <TransactionItem 
                  key={tx.id || idx}
                  tx={tx}
                  idx={idx}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  getInitials={getInitials}
                />
              ))}

              {/* Load More Button */}
              {hasMore && (
                <div className="p-8 flex justify-center bg-zinc-50/30">
                  <button 
                    onClick={() => fetchData(true)}
                    disabled={loadingMore}
                    className="px-8 py-3 rounded-2xl bg-white border border-zinc-200 text-[12px] font-bold text-zinc-700 hover:border-zinc-300 hover:text-zinc-900 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    {loadingMore ? "Seeking Older Records..." : "Load Older"}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function TransactionsRegistryPage() {
  return (
    <Suspense fallback={<div>Loading Registry...</div>}>
      <TransactionsRegistryContent />
    </Suspense>
  );
}
