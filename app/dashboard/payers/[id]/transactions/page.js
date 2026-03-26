"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "../../../../pesagrid/components/dashboard/UI";
import { getTransactions } from "../../../../../lib/Transaction";
import { getPayer } from "../../../../../lib/Obligation";

function Field({ label, children }) {
  return (
    <div className="space-y-1.5 min-w-0">
      <label className="block text-[11px] font-medium uppercase tracking-widest text-zinc-400">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-[13px] font-medium text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-900/5";

export default function PayerTransactionsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [payer, setPayer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    psp_type: "",
    status: "",
    limit: 50,
    skip: 0
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const payerData = await getPayer(id);
      setPayer(payerData);
      
      const res = await getTransactions({
        ...filters,
        account_no: payerData.account_no
      });
      setTransactions(res.items || []);
    } catch (err) {
      console.error("Failed to load payer transactions", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadData();
  }, [id, filters.psp_type, filters.status, filters.limit, filters.skip]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'matched': return 'bg-[#a3e635]/20 text-[#6bb800]';
      case 'pending': return 'bg-[#fdc649]/20 text-[#d97706]';
      case 'raw': return 'bg-zinc-100 text-zinc-500';
      default: return 'bg-zinc-100 text-zinc-500';
    }
  };

  if (isLoading && !payer) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f5f6f7]">
        <div className="h-8 w-8 rounded-full border-[3px] border-zinc-200 border-t-[#a3e635] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-zinc-100 text-zinc-400 hover:text-zinc-900 transition-colors shadow-sm"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-[20px] font-bold tracking-tight text-zinc-900">
              Transactions: {payer?.name}
            </h1>
            <p className="mt-0.5 text-[12px] font-medium text-zinc-400">
              Payment history for account <span className="font-bold text-zinc-600">{payer?.account_no}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <Card className="p-4 bg-white border-zinc-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="PSP Type">
            <select
              name="psp_type"
              value={filters.psp_type}
              onChange={handleFilterChange}
              className={inputCls}
            >
              <option value="">All Channels</option>
              <option value="mpesa">M-Pesa</option>
              <option value="kcb">KCB Bank</option>
              <option value="equity">Equity Bank</option>
            </select>
          </Field>

          <Field label="Status">
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className={inputCls}
            >
              <option value="">All Statuses</option>
              <option value="matched">Matched</option>
              <option value="raw">Raw (Unmatched)</option>
              <option value="pending">Pending</option>
            </select>
          </Field>

          <div className="flex items-end gap-2">
            <button
              onClick={loadData}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-[12px] font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 active:scale-95 h-[42px]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </Card>

      {/* Transactions List */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 rounded-full border-[3px] border-zinc-100 border-t-[#a3e635] animate-spin" />
        </div>
      ) : transactions.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-20 w-20 rounded-3xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-300 mb-6">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-[16px] font-bold text-zinc-900">No transactions found</h3>
          <p className="text-[13px] text-zinc-500 mt-1 max-w-sm">
            We couldn't find any payment records for this payer matching your criteria.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden noPadding bg-white border-zinc-100 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px] whitespace-nowrap">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50 text-zinc-400 uppercase tracking-wider text-[10px] font-semibold">
                  <th className="px-6 py-4 text-center">Chan</th>
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {transactions.map((t) => (
                  <tr 
                    key={t.id} 
                    className="hover:bg-zinc-50/50 transition-colors cursor-pointer group" 
                    onClick={() => setSelectedTransaction(t)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-zinc-100 text-zinc-900 font-bold text-[9px] uppercase tracking-tighter">
                          {t.psp_type.slice(0, 3)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-[11px] text-zinc-900 font-bold">{t.psp_ref}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-zinc-900">
                        {t.currency} {t.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getStatusColor(t.status)}`}>
                        {t.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      <p className="font-medium text-zinc-900">{new Date(t.ingested_at).toLocaleDateString()}</p>
                      <p className="text-[10px]">{new Date(t.ingested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 group-hover:text-zinc-900 group-hover:bg-zinc-100 transition-colors">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Detail Slide-over (Same as before but integrated) */}
      <AnimatePresence>
        {selectedTransaction && (
          <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTransaction(null)}
              className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col h-full"
            >
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <div>
                  <h2 className="text-[16px] font-bold text-zinc-900">Transaction Details</h2>
                  <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                    ID: {selectedTransaction.id}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedTransaction(null)}
                  className="p-2 text-zinc-400 hover:text-zinc-700 bg-zinc-50 hover:bg-zinc-100 rounded-lg transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <div className="text-center">
                  <div className="h-20 w-20 rounded-3xl bg-[#a3e635]/10 flex items-center justify-center text-[#6bb800] mx-auto mb-4">
                    <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-[12px] font-semibold text-zinc-400 uppercase tracking-widest mb-1">Total Amount</p>
                  <h3 className="text-[36px] font-black text-zinc-900">
                    {selectedTransaction.currency} {selectedTransaction.amount.toLocaleString()}
                  </h3>
                  <div className={`mt-2 inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(selectedTransaction.status)}`}>
                    {selectedTransaction.status}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 bg-zinc-50 rounded-2xl p-6 border border-zinc-100">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">PSP Type</p>
                    <p className="text-[13px] font-bold text-zinc-900">{selectedTransaction.psp_type.toUpperCase()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Reference</p>
                    <p className="text-[13px] font-bold text-zinc-900 font-mono">{selectedTransaction.psp_ref}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Phone</p>
                    <p className="text-[13px] font-bold text-zinc-900">{selectedTransaction.phone || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Date</p>
                    <p className="text-[13px] font-bold text-zinc-900">
                      {new Date(selectedTransaction.ingested_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest px-1">Infrastructure Context</h4>
                  <div className="space-y-2">
                    {[
                      { label: "Collection ID", value: selectedTransaction.collection_id },
                      { label: "Point ID", value: selectedTransaction.collection_point_id },
                      { label: "Matched Obligation", value: selectedTransaction.matched_obligation_id }
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center p-3 rounded-xl border border-zinc-100 hover:bg-zinc-50 transition-colors">
                        <span className="text-[12px] font-medium text-zinc-500">{item.label}</span>
                        <span className="text-[10px] font-mono text-zinc-900 bg-white px-2 py-1 rounded border border-zinc-200">
                          {item.value || "None"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
