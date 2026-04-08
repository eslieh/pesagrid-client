"use client";

import { useState, useEffect } from "react";
import { getInvoices } from "../../../../lib/Billing";

export default function InvoicesTab() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getInvoices();
        setInvoices(data.items || []);
      } catch (err) {
        setError("Failed to fetch invoices");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-40 animate-pulse items-center justify-center rounded-xl bg-zinc-50 border border-zinc-100">
        <span className="text-[13px] text-zinc-400 font-medium">Loading invoices...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-[13px] text-red-500 font-medium">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h2 className="text-[16px] font-bold text-zinc-900">Platform Invoices</h2>
        <p className="mt-1 text-[13px] text-zinc-500">Your monthly statements aggregating flat subscription fees and executed usage limits.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {invoices.length === 0 ? (
          <div className="col-span-full flex h-32 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50">
             <p className="text-[13px] font-medium text-zinc-400">No invoices generated yet.</p>
          </div>
        ) : (
          invoices.map((inv) => (
            <div key={inv.id} className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm hover:border-zinc-300 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-[14px] font-bold text-zinc-900">{inv.invoice_number}</h3>
                  <p className="text-[11px] font-medium text-zinc-400 uppercase mt-0.5 tracking-wider">
                    {new Date(inv.period_start).toLocaleDateString(undefined, {month: 'short', year: 'numeric'})}
                  </p>
                </div>
                <span className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-wider ${
                  inv.status === "paid" ? "bg-green-100 text-green-800" 
                  : inv.status === "overdue" ? "bg-red-100 text-red-800"
                  : "bg-zinc-100 text-zinc-800"
                }`}>
                  {inv.status}
                </span>
              </div>

              <div className="space-y-2 text-[12px] text-zinc-600 mb-4 border-b border-zinc-50 pb-4">
                <div className="flex justify-between">
                  <span>Subscription Base</span>
                  <span className="font-semibold text-zinc-900">KES {parseFloat(inv.subscription_fee_kes).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Recon Usage ({inv.recon_count})</span>
                  <span className="font-semibold text-zinc-900">KES {parseFloat(inv.recon_fee_total_kes).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Notifications ({inv.notification_count})</span>
                  <span className="font-semibold text-zinc-900">KES {parseFloat(inv.notification_fee_total_kes).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <span className="block text-[11px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">Total Amount</span>
                  <span className="text-[18px] font-black tracking-tight text-zinc-900">KES {parseFloat(inv.total_amount_kes).toLocaleString()}</span>
                </div>
                {inv.status !== "paid" && inv.paystack_payment_link && (
                  <a 
                    href={inv.paystack_payment_link}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg bg-zinc-900 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm hover:bg-zinc-800"
                  >
                    Pay Now
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
