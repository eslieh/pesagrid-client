"use client";

import { useState, useEffect } from "react";
import { getWallet, getWalletTransactions, topupWallet, getBillingSummary } from "../../../../lib/Billing";

export default function WalletTab({ isVerifying }) {
  const [wallet, setWallet] = useState(null);
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topupLoading, setTopupLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      const [walletData, txData, summaryData] = await Promise.all([
        getWallet(),
        getWalletTransactions(50),
        getBillingSummary().catch(() => null)
      ]);
      setWallet(walletData);
      setTransactions(txData.items || []);
      setSummary(summaryData);
    } catch (err) {
      setError("Failed to load wallet data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // If the parent is verifying a callback, we aggressively refetch immediately when it finishes
  useEffect(() => {
    if (!isVerifying && !loading) {
      fetchData();
    }
  }, [isVerifying]);

  const handleTopup = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || Number(amount) < 100) {
      return alert("Please enter a valid amount (Minimum KES 100).");
    }

    setTopupLoading(true);
    try {
      const res = await topupWallet({ 
        amount_kes: parseFloat(amount),
        email: "dashboard@pesagrid.com", // You'd realistically inject the user email here
        callback_url: `${window.location.origin}/dashboard/billing` 
      });
      // Redirect to the returned Paystack URL wrapper
      if (res.payment_url) {
        window.location.href = res.payment_url;
      }
    } catch (err) {
      alert(err.message || "Failed to initiate top-up.");
      setTopupLoading(false);
    }
  };

  if (loading && !wallet) {
    return (
      <div className="flex h-40 animate-pulse items-center justify-center rounded-xl bg-zinc-50 border border-zinc-100">
        <span className="text-[13px] text-zinc-400 font-medium">Loading ledger...</span>
      </div>
    );
  }

  if (error && !wallet) {
    return <div className="text-[13px] text-red-500 font-medium">{error}</div>;
  }

  return (
    <div className="space-y-8">
      {/* Balance & Stats Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Balance Card */}
        <div className="flex flex-col justify-between rounded-2xl bg-zinc-900 p-6 text-white shadow-md relative overflow-hidden h-[180px]">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white opacity-[0.03]"></div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold tracking-wider text-zinc-400 uppercase">Available Balance</span>
              {isVerifying && (
                <div className="flex items-center gap-2 text-[11px] font-bold text-green-400 animate-pulse">
                  <div className="h-2 w-2 rounded-full bg-green-400"></div>
                  Verifying...
                </div>
              )}
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-[18px] font-semibold text-zinc-400">KES</span>
              <span className="text-[44px] font-black tracking-tight">
                {parseFloat(wallet?.balance_kes || 0).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-auto">
             <div className="flex items-center gap-4">
                <div>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Lifetime</p>
                  <p className="text-[12px] font-bold text-zinc-200">KES {parseFloat(wallet?.lifetime_topup || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Monthly Est.</p>
                  <p className="text-[12px] font-black text-[#a3e635]">KES {parseFloat(summary?.current_month_est || 0).toLocaleString()}</p>
                </div>
             </div>
             <div className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase ${wallet?.is_auto_deduct_enabled ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                Auto-Pay: {wallet?.is_auto_deduct_enabled ? "ON" : "OFF"}
              </div>
          </div>
        </div>

        {/* Usage Card */}
        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm flex flex-col justify-between h-[180px]">
          <div>
            <h3 className="text-[14px] font-bold text-zinc-900 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Usage Metrics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Reconciliations</p>
                <p className="text-[20px] font-black text-zinc-900">{summary?.subscription?.recon_count || 0}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Notifications</p>
                <p className="text-[20px] font-black text-zinc-900">{summary?.subscription?.notification_count || 0}</p>
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-zinc-50 flex items-center justify-between text-[11px] font-medium text-zinc-400">
             <span>Grouped deductions active</span>
             <span className="text-zinc-900">KES {summary?.recon_est || "0.00"} + {summary?.notification_est || "0.00"} total</span>
          </div>
        </div>
      </div>

      {/* Reverted Wallet Top-up Design (Nice Card) */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-10 items-center justify-between">
          <div className="max-w-sm">
            <h3 className="text-[20px] font-black tracking-tight text-zinc-900">Top Up Wallet</h3>
            <p className="text-[13px] text-zinc-500 mt-2 font-medium leading-relaxed">
              Instantly recharge your prepaid credits. Your payment is securely handled by **Paystack**. Funds are reflected in your available balance immediately.
            </p>
            <div className="mt-4 flex items-center gap-4 opacity-50 grayscale contrast-125">
               {/* Paystack Logo Simulated Icons */}
               <div className="h-6 w-20 bg-zinc-400 rounded-md"></div>
               <div className="flex gap-1 h-6">
                 <div className="w-8 bg-zinc-400 rounded"></div>
                 <div className="w-8 bg-zinc-400 rounded"></div>
               </div>
            </div>
          </div>

          <form onSubmit={handleTopup} className="w-full md:w-[400px] space-y-4">
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[15px] font-bold text-zinc-400">KES</div>
              <input 
                type="number"
                min="100"
                step="50"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5,000"
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-16 pr-6 py-5 text-[22px] font-black text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-all placeholder:text-zinc-300"
              />
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {[1000, 5000, 10000, 20000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val.toString())}
                  className="rounded-xl border border-zinc-100 bg-white py-2.5 text-[12px] font-bold text-zinc-600 hover:border-zinc-900 hover:text-zinc-900 transition-all shadow-sm"
                >
                  +{val / 1000}k
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={topupLoading || isVerifying}
              className="w-full rounded-2xl bg-zinc-900 py-5 text-[15px] font-bold text-white shadow-xl hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {topupLoading ? "Connecting to Paystack..." : "Proceed to Load Wallet"}
            </button>
            <p className="text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest pt-2">
              Secure 256-Bit Encrypted Checkout
            </p>
          </form>
        </div>
      </div>

      {/* Ledger */}
      <div className="rounded-2xl border border-zinc-100 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-zinc-100 px-6 py-4 flex items-center justify-between bg-zinc-50/50">
          <h3 className="text-[14px] font-bold text-zinc-900">Wallet Live Statement</h3>
          <button onClick={fetchData} className="text-[12px] font-bold text-zinc-500 hover:text-zinc-900">Refresh</button>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {transactions.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center p-6 text-center text-zinc-500">
              <svg className="mb-2 h-6 w-6 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <p className="text-[13px] font-medium">No transactions found.</p>
            </div>
          ) : (
            <table className="w-full text-left text-[13px] whitespace-nowrap">
              <thead className="bg-zinc-50/80 sticky top-0 text-[11px] font-bold uppercase tracking-wider text-zinc-500 shadow-sm z-10">
                <tr>
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3 pl-2">Type</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3 text-right">Amount (KES)</th>
                  <th className="px-6 py-3 text-right">Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="transition-colors hover:bg-zinc-50/50">
                    <td className="px-6 py-4 font-medium text-zinc-500">
                      {new Date(tx.created_at).toLocaleString(undefined, { 
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 pl-2">
                       <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${
                         tx.tx_type === "deduction" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                       }`}>
                         {tx.tx_type === "deduction" ? (
                           <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                         ) : (
                           <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                         )}
                         {tx.tx_type}
                       </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-zinc-900 border-l border-zinc-50 max-w-[200px] truncate">
                      {tx.description}
                      {tx.event_type && (
                        <span className="block mt-0.5 text-[10px] font-bold text-zinc-400 tracking-wider">
                          {(tx.event_type || "").toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className={`px-6 py-4 text-right font-black ${tx.tx_type === "deduction" ? "text-zinc-900" : "text-green-600"}`}>
                      {tx.tx_type === "deduction" ? "-" : "+"} {parseFloat(tx.amount_kes).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-zinc-500 border-l border-zinc-50">
                      {parseFloat(tx.balance_after).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
