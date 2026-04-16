"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, StatWidget } from "../../pesagrid/components/dashboard/UI";
import { 
  unifiedCreate, 
  getPayerGroups,
  getRecurringPreview,
  getGlobalLedger,
  getUpcomingLedger
} from "../../../lib/Obligation";
import { useSearchParams } from "next/navigation";
import InvoiceWizard from "./components/InvoiceWizard";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────

function Field({ label, children, required }) {
  return (
    <div className="space-y-1.5 min-w-0">
      <label className="block text-[11px] font-medium uppercase tracking-widest text-zinc-400">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[11px] font-bold text-zinc-700 outline-none transition-all hover:bg-zinc-50 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 shadow-sm appearance-none";

export default function InvoicesPage() {
  // New Ledger State
  const [ledgerBoard, setLedgerBoard] = useState(null);
  const [upcomingPayments, setUpcomingPayments] = useState(null);
  
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const groupRes = await getPayerGroups({ limit: 100 });
      if (groupRes) setGroups(Array.isArray(groupRes) ? groupRes : (groupRes.items || []));
      
      await fetchGlobalLedger();
      await fetchUpcoming();
    } catch (err) {
      console.error("Failed to load page data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGlobalLedger = async () => {
    try {
      setIsLoading(true);
      const res = await getGlobalLedger({
        status_filter: statusFilter !== "all" ? statusFilter : undefined,
        group_id: groupFilter !== "all" ? groupFilter : undefined,
        page: currentPage,
        page_size: pageSize
      });
      setLedgerBoard(res);
    } catch (err) {
      console.error("Failed to load global ledger", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUpcoming = async () => {
    try {
      const res = await getUpcomingLedger({ 
        days: 30,
        group_id: groupFilter !== "all" ? groupFilter : undefined 
      });
      setUpcomingPayments(res);
    } catch (err) {
      console.error("Failed to load upcoming payments", err);
    }
  };

  useEffect(() => {
    fetchGlobalLedger();
  }, [statusFilter, groupFilter, currentPage]);

  useEffect(() => {
    fetchUpcoming();
  }, [groupFilter]);

  const searchParams = useSearchParams();

  useEffect(() => {
    loadData();
  }, []);

  const openForm = () => {
    setIsFormOpen(true);
    setMessage({type:"", text:""});
  };

  const onWizardSuccess = () => {
    setMessage({ type: "success", text: "Invoice created successfully." });
    fetchGlobalLedger();
    fetchUpcoming();
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'settled': return 'bg-[#a3e635]/20 text-[#6bb800]';
      case 'clear': return 'bg-[#a3e635]/20 text-[#6bb800]';
      case 'pending': return 'bg-[#fdc649]/20 text-[#d97706]';
      case 'partial': return 'bg-orange-100 text-orange-600';
      case 'overdue': return 'bg-red-100 text-red-600';
      case 'voided': return 'bg-zinc-100 text-zinc-500';
      case 'rolled': return 'bg-blue-100 text-blue-600';
      default: return 'bg-zinc-100 text-zinc-500';
    }
  };



  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "KES" }).format(val || 0);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-zinc-900">Invoices & Obligations</h1>
          <p className="mt-0.5 text-[12px] font-medium text-zinc-400">
            Bill your payers natively and track receivables
          </p>
        </div>
        {!isFormOpen && (
          <button
            onClick={openForm}
            className="flex items-center gap-2 rounded-xl bg-[#a3e635] px-5 py-2.5 text-[12px] font-bold text-zinc-900 shadow-sm shadow-[#a3e635]/30 transition-all hover:bg-[#9de500] hover:shadow-md active:scale-95"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Invoice
          </button>
        )}
      </div>

      {message.text && (
        <div 
          className={`px-4 py-3 rounded-xl border flex items-center gap-3 text-[12px] font-medium ${
            message.type === 'success' 
              ? 'bg-[#a3e635]/10 border-[#a3e635]/30 text-[#6bb800]' 
              : 'bg-red-50 border-red-100 text-red-600'
          }`}
        >
          {message.type === 'success' ? (
             <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {message.text}
          <button 
            onClick={() => setMessage({ type: "", text: "" })}
            className="ml-auto p-1 hover:bg-black/5 rounded-md transition-colors"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <AnimatePresence>
        {isFormOpen && (
          <InvoiceWizard 
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            onSuccess={onWizardSuccess}
          />
        )}
      </AnimatePresence>

      {!isFormOpen && (
        <>
          {/* Summary Widgets Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card className="px-5 py-4">
               <StatWidget 
                 label="Total Payers" 
                 value={(ledgerBoard?.total_payers || 0).toLocaleString()} 
                 trendUp 
               />
            </Card>
            <Card className="px-5 py-4">
               <StatWidget 
                 label="Total Expected" 
                 value={formatCurrency(ledgerBoard?.total_balance + ledgerBoard?.total_paid || 0)} 
                 trendUp 
               />
            </Card>
            <Card className="px-5 py-4">
               <StatWidget 
                 label="Collected" 
                 value={formatCurrency(ledgerBoard?.total_paid || 0)} 
                 trendUp 
               />
            </Card>
            <Card className="px-5 py-4 border-l-4 border-l-red-400">
               <StatWidget 
                 label="Outstanding" 
                 value={formatCurrency(ledgerBoard?.total_balance || 0)} 
                 trendUp={false} 
               />
            </Card>
            {ledgerBoard?.grand_credit > 0 && (
              <Card className="px-5 py-4 border-l-4 border-l-violet-400">
                <StatWidget 
                  label="Payer Credits" 
                  value={formatCurrency(ledgerBoard?.grand_credit || 0)} 
                  trendUp 
                />
              </Card>
            )}
          </div>

          <div className="grid grid-cols-12 gap-6 items-start">
            {/* Main Payer Ledger Table */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200">
                <div className="flex items-center gap-2">
                  {['all', 'pending', 'overdue', 'settled', 'clear'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => { setStatusFilter(tab); setCurrentPage(1); }}
                      className={`relative px-4 py-3 text-[13px] font-bold transition-colors ${
                        statusFilter === tab ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      {ledgerBoard?.counts && (
                        <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px]">
                          {tab === 'all' ? (ledgerBoard.total_payers || 0) : (ledgerBoard.counts[tab] || 0)}
                        </span>
                      )}
                      {statusFilter === tab && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute bottom-0 left-0 right-0 h-[2px] bg-zinc-900"
                          initial={false}
                        />
                      )}
                    </button>
                  ))}
                </div>
                
                <div className="mb-2">
                  <select
                    value={groupFilter}
                    onChange={(e) => { setGroupFilter(e.target.value); setCurrentPage(1); }}
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-[11px] font-bold text-zinc-700 outline-none transition-all hover:bg-zinc-50 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 shadow-sm min-w-[140px] appearance-none"
                  >
                    <option value="all">All Groups</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {isLoading ? (
                <div className="flex h-48 items-center justify-center">
                  <div className="h-7 w-7 rounded-full border-[3px] border-zinc-100 border-t-zinc-400 animate-spin" />
                </div>
              ) : !ledgerBoard?.items || ledgerBoard.items.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-400">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-[15px] font-semibold text-zinc-900">No payers found</h3>
                  <p className="mt-1 text-[12px] text-zinc-500 max-w-sm">
                    Ready to request a payment? Create a single bill or bulk generate them for an entire group.
                  </p>
                </Card>
              ) : (
                <div className="space-y-4 lg:space-y-0">
                  {/* Card View (Mobile) */}
                  <div className="grid grid-cols-1 gap-4 lg:hidden">
                    {ledgerBoard.items.map((payer) => (
                      <Card key={payer.payer_id} className="p-4 flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-bold text-zinc-900 truncate">{payer.payer_name || "Unknown"}</p>
                            <p className="text-[10px] text-zinc-400 mt-0.5 truncate">{payer.payer_account_no || payer.payer_phone || "No Account Info"}</p>
                          </div>
                          <div className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider shrink-0 ${getStatusColor(payer.payer_status)}`}>
                            {payer.payer_status}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 py-3 border-y border-zinc-50">
                          <div>
                            <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mb-1">Outstanding</p>
                            <p className="text-[13px] font-black text-zinc-900">{formatCurrency(payer.total_balance)}</p>
                          </div>
                        </div>

                        {payer.credit_balance > 0 && (
                          <div className="px-4 py-2 bg-violet-50 border border-violet-100 rounded-xl flex items-center justify-between">
                            <span className="text-[10px] font-bold text-violet-600 uppercase tracking-widest">Available Credit</span>
                            <span className="text-[12px] font-black text-violet-700">{formatCurrency(payer.credit_balance)}</span>
                          </div>
                        )}


                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-700">
                            <span>{payer.total_obligations} Invoices</span>
                            {payer.overdue_count > 0 && (
                              <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                                {payer.overdue_count} Overdue
                              </span>
                            )}
                          </div>
                          <Link 
                            href={`/dashboard/payers/${payer.payer_id}/ledger`}
                            className="text-[10px] font-black text-zinc-900 uppercase tracking-tight flex items-center gap-1"
                          >
                            Ledger
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Table View (Desktop) */}
                  <Card className="hidden lg:block overflow-hidden noPadding">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[12px] whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-zinc-100 bg-zinc-50 text-zinc-400 uppercase tracking-wider text-[10px] font-semibold">
                          <th className="px-5 py-4">Payer</th>
                          <th className="px-5 py-4">Status</th>
                          <th className="px-5 py-4">Invoices</th>
                          <th className="px-5 py-4">Total Paid</th>
                          <th className="px-5 py-4">Outstanding</th>
                          <th className="px-5 py-4">Credit</th>
                          <th className="px-5 py-4 text-right">Actions</th>
                        </tr>

                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {ledgerBoard.items.map((payer) => (
                          <tr key={payer.payer_id} className="hover:bg-zinc-50/50 transition-colors">
                            <td className="px-5 py-3.5">
                              <p className="font-semibold text-zinc-900">{payer.payer_name || "Unknown"}</p>
                              <p className="text-[10px] text-zinc-400 mt-0.5">{payer.payer_account_no || payer.payer_phone || "No Account Info"}</p>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getStatusColor(payer.payer_status)}`}>
                                {payer.payer_status}
                              </div>
                            </td>
                            <td className="px-5 py-3.5 font-medium text-zinc-700">
                              <span className="flex items-center gap-1.5">
                                {payer.total_obligations} Active
                                {payer.overdue_count > 0 && (
                                  <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">
                                    {payer.overdue_count} Overdue
                                  </span>
                                )}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-zinc-500 font-medium">
                              {formatCurrency(payer.total_paid)}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="font-semibold text-zinc-900">
                                {formatCurrency(payer.total_balance)}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              {payer.credit_balance > 0 ? (
                                <span className="inline-flex px-2 py-0.5 rounded-lg bg-violet-100 text-violet-700 font-bold text-[10px]">
                                  {formatCurrency(payer.credit_balance)}
                                </span>
                              ) : (
                                <span className="text-zinc-300">—</span>
                              )}
                            </td>

                            <td className="px-5 py-3.5 text-right">
                              <Link 
                                href={`/dashboard/payers/${payer.payer_id}/ledger`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 rounded-lg shadow-sm transition-all active:scale-95"
                              >
                                View Ledger
                                <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination placeholder if pages > 1 */}
                  
                  {ledgerBoard.total_payers > pageSize && (
                    <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-3 bg-zinc-50/50">
                      <span className="text-[11px] text-zinc-500">
                        Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, ledgerBoard.total_payers)} of {ledgerBoard.total_payers}
                      </span>
                      <div className="flex gap-1">
                        <button 
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(prev => prev - 1)}
                          className="px-3 py-1 bg-white border border-zinc-200 rounded text-[11px] font-medium disabled:opacity-50"
                        >
                          Prev
                        </button>
                        <button 
                          disabled={currentPage * pageSize >= ledgerBoard.total_payers}
                          onClick={() => setCurrentPage(prev => prev + 1)}
                          className="px-3 py-1 bg-white border border-zinc-200 rounded text-[11px] font-medium disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
              )}
            </div>

            {/* Sidebar Calendar View */}
            <div className="col-span-12 lg:col-span-4 space-y-4">
               <Card className="px-5 py-5 overflow-hidden relative">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-[#a3e635]/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
                 <h4 className="text-[14px] font-bold text-zinc-900 flex items-center justify-between mb-5">
                   Upcoming Invoices
                   <span className="bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full text-[10px]">
                     Next 30 Days
                   </span>
                 </h4>

                 {!upcomingPayments ? (
                   <div className="animate-pulse flex flex-col gap-3">
                     {[1,2,3].map(i => <div key={i} className="h-14 bg-zinc-100 rounded-xl w-full" />)}
                   </div>
                 ) : upcomingPayments?.entries?.length === 0 ? (
                   <div className="text-center py-8">
                     <p className="text-[12px] text-zinc-400">No upcoming payments scheduled.</p>
                   </div>
                 ) : (
                   <div className="space-y-4 relative">
                     <div className="absolute left-[15px] top-4 bottom-4 w-px bg-zinc-100 -z-10" />
                     {upcomingPayments.entries.map((entry, idx) => {
                       const d = new Date(entry.due_date);
                       const todayStr = new Date().toISOString().split('T')[0];
                       
                       // Check if overdue based on date string comparison or actual obligation status
                       const isOverdue = entry.due_date < todayStr || entry.obligations?.some(ob => ob.status === 'overdue');
                       const isToday = entry.due_date === todayStr;
                       
                       const dateLabel = isToday ? "Today" : d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                       
                       // Indicators
                       const dotColor = isOverdue ? "bg-red-500" : (isToday ? "bg-[#f59e0b]" : "bg-[#a3e635]");
                       
                       return (
                         <div key={idx} className="flex gap-4">
                           <div className={`w-8 h-8 rounded-full bg-white border-2 border-zinc-100 shadow-sm flex items-center justify-center shrink-0 mt-0.5`}>
                             <div className={`w-2.5 h-2.5 rounded-full ${dotColor} ${isToday ? 'animate-pulse' : ''}`} />
                           </div>
                           <div className="flex-1 bg-zinc-50 border border-zinc-100 rounded-xl p-3 shadow-sm hover:shadow-md transition-all">
                             <div className={`flex items-center justify-between ${entry.obligations?.length > 0 ? "mb-2 pb-2 border-b border-zinc-200" : "mb-1.5"}`}>
                               <div className="flex items-center gap-2">
                                 <p className={`text-[12px] font-bold ${isOverdue ? 'text-red-500' : 'text-zinc-900'}`}>{dateLabel}</p>
                                 {isOverdue && <span className="text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-100 px-1.5 py-0.5 rounded">Overdue</span>}
                                 {isToday && <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">Due Today</span>}
                               </div>
                               <p className={`text-[12px] font-bold ${isOverdue ? 'text-red-500' : 'text-zinc-900'}`}>{formatCurrency(entry.total_due)}</p>
                             </div>
                             
                             {entry.obligations?.length > 0 ? (
                               <div className="space-y-2 mt-2">
                                 {entry.obligations.slice(0, 3).map((ob, obIdx) => (
                                   <div key={obIdx} className="flex justify-between items-center text-[11px]">
                                     <div className="min-w-0 flex-1 truncate pr-2 flex items-baseline gap-1.5">
                                       <span className={`font-semibold truncate ${ob.status === 'overdue' ? 'text-red-500' : 'text-zinc-800'}`}>{ob.payer?.name || "Unknown"}</span>
                                       <span className="text-zinc-400 truncate text-[10px]">- {ob.description}</span>
                                     </div>
                                     <span className={`font-bold tabular-nums shrink-0 ${ob.status === 'overdue' ? 'text-red-500' : 'text-zinc-700'}`}>
                                       {formatCurrency(ob.amount_due)}
                                     </span>
                                   </div>
                                 ))}
                                 {entry.obligations.length > 3 && (
                                   <p className="text-[10px] text-zinc-400 font-medium italic mt-1 pb-0.5">
                                     + {entry.obligations.length - 3} more payments
                                   </p>
                                 )}
                               </div>
                             ) : (
                               <p className="text-[10px] font-medium text-zinc-500">
                                 {entry.total_count} invoices due ({entry.unpaid_count} unpaid)
                               </p>
                             )}
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 )}
               </Card>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
