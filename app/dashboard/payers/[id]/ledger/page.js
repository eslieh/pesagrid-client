"use client";

import { useState, useEffect, use } from "react";
import { Card } from "../../../../pesagrid/components/dashboard/UI";
import { 
  getObligations, 
  voidObligation,
  getPayerGroups,
  getPayer
} from "../../../../../lib/Obligation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import InvoiceWizard from "../../../invoices/components/InvoiceWizard";

export default function PayerLedgerPage({ params }) {
  const unwrappedParams = use(params);
  const payerId = unwrappedParams.id;
  const router = useRouter();
  
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [ledgerData, setLedgerData] = useState([]);
  const [payerName, setPayerName] = useState("Payer");
  
  const [openActionId, setOpenActionId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [payerDetails, setPayerDetails] = useState(null);

  const fetchSpecificLedger = async () => {
    try {
      setLedgerLoading(true);
      const res = await getObligations({ payer_id: payerId, limit: 100 });
      setLedgerData(res.items || []);
      
      if (res.items && res.items.length > 0 && res.items[0].payer) {
        setPayerName(res.items[0].payer.name || res.items[0].payer.phone || "Payer");
        setPayerDetails(res.items[0].payer);
      } else {
        // Backup: Fetch payer details if ledger is empty
        const p = await getPayer(payerId);
        setPayerName(p.name || p.phone || "Payer");
        setPayerDetails(p);
      }
    } catch (err) {
      console.error("Failed to load specific ledger", err);
      setMessage({ type: "error", text: "Failed to load payer ledger" });
    } finally {
      setLedgerLoading(false);
    }
  };

  useEffect(() => {
    if (payerId) {
      fetchSpecificLedger();
    }
  }, [payerId]);

  const handleVoid = async (obligationId) => {
    const reason = window.prompt("Reason for voiding this invoice:", "Entered wrong amount");
    if (reason === null) return;
    
    try {
      setCancellingId(obligationId);
      setOpenActionId(null);
      await voidObligation(obligationId, reason);
      setMessage({ type: "success", text: "Invoice voided successfully." });
      
      fetchSpecificLedger();
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to void invoice." });
    } finally {
      setCancellingId(null);
    }
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
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-zinc-400 hover:text-zinc-600 mb-2 transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <h1 className="text-[20px] font-bold tracking-tight text-zinc-900">{payerName}&apos;s Ledger</h1>
          <p className="mt-0.5 text-[12px] font-medium text-zinc-400">
            View all obligations, invoices, and payment history for this payer.
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-[#a3e635] px-5 py-2.5 text-[12px] font-bold text-zinc-900 shadow-sm shadow-[#a3e635]/30 transition-all hover:bg-[#9de500] hover:shadow-md active:scale-95"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Invoice
        </button>
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <InvoiceWizard
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            onSuccess={() => {
              setMessage({ type: "success", text: "Invoice created successfully." });
              fetchSpecificLedger();
            }}
            initialData={{
              payer_id: payerId,
              name: payerDetails?.name || "",
              phone: payerDetails?.phone || "",
              email: payerDetails?.email || "",
              account_no: payerDetails?.account_no || ""
            }}
          />
        )}
      </AnimatePresence>

      {message.text && (
        <div 
          className={`px-4 py-3 rounded-xl border flex items-center gap-3 text-[12px] font-medium ${
            message.type === 'success' 
              ? 'bg-[#a3e635]/10 border-[#a3e635]/30 text-[#6bb800]' 
              : 'bg-red-50 border-red-100 text-red-600'
          }`}
        >
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

      <Card className="overflow-hidden noPadding">
        {ledgerLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-7 w-7 rounded-full border-[3px] border-zinc-100 border-t-zinc-400 animate-spin" />
          </div>
        ) : ledgerData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-400">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-[15px] font-semibold text-zinc-900">No invoices found</h3>
            <p className="mt-1 text-[12px] text-zinc-500 max-w-sm">
              This payer has no individual obligations yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px] whitespace-nowrap">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50 text-zinc-400 uppercase tracking-wider text-[10px] font-semibold">
                  <th className="px-5 py-4">Description</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Due/Next Date</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {ledgerData.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {inv.is_recurring && (
                          <span className="flex items-center justify-center p-1 rounded-md bg-zinc-100">
                            <svg className="h-3 w-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </span>
                        )}
                        <span className="font-semibold text-zinc-900">{inv.description}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-zinc-900 flex flex-col gap-0.5">
                        {formatCurrency(inv.amount_due)}
                        {inv.amount_paid > 0 && <span className="text-[10px] text-[#6bb800]">Paid: {formatCurrency(inv.amount_paid)}</span>}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getStatusColor(inv.status)}`}>
                        {inv.status}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-zinc-500 font-medium">
                      {new Date(inv.recurring_config?.next_due_date || inv.due_date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/dashboard/transactions?account_no=${inv.payer?.account_no || inv.account_no || ''}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                          </svg>
                          View Transactions
                        </Link>
                        
                        <div className="relative inline-block">
                          <button
                            onClick={() => setOpenActionId(openActionId === inv.id ? null : inv.id)}
                            disabled={cancellingId === inv.id}
                            className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors disabled:opacity-40 border border-zinc-200"
                          >
                            {cancellingId === inv.id ? (
                              <div className="h-4 w-4 rounded-full border-2 border-zinc-300 border-t-zinc-600 animate-spin" />
                            ) : (
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                              </svg>
                            )}
                          </button>

                          {openActionId === inv.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenActionId(null)}
                              />
                              <div className="absolute right-0 top-10 z-20 w-40 rounded-xl border border-zinc-100 bg-white shadow-lg py-1 overflow-hidden pointer-events-auto">
                                {inv.status !== 'voided' ? (
                                  <button
                                    onClick={() => handleVoid(inv.id)}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[11px] font-medium text-red-600 hover:bg-red-50 transition-colors"
                                  >
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                    </svg>
                                    Void Invoice
                                  </button>
                                ) : (
                                  <div className="px-4 py-2.5 text-[11px] text-zinc-400 italic font-medium">Already voided</div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
