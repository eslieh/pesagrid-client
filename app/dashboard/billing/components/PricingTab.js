"use client";

import { useState, useEffect } from "react";
import { getPlans, getSubscription, subscribe } from "../../../../lib/Billing";

export default function PricingTab({ onRequireTopup }) {
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansData, subData] = await Promise.all([
          getPlans(),
          getSubscription().catch(() => null), // Catch 404s if none exists somehow
        ]);
        setPlans(plansData.items || []);
        setSubscription(subData);
      } catch (err) {
        setError("Failed to load pricing configurations.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubscribe = async (planSlug) => {
    setActionLoading(planSlug);
    try {
      const data = await subscribe(planSlug);
      setSubscription(data);
      alert(`Successfully subscribed to ${data.plan.name}. Please ensure your wallet covers the required minimum balance.`);
      onRequireTopup();
    } catch (err) {
      alert(err.message || "Failed to subscribe to plan.");
    } finally {
      setActionLoading("");
    }
  };

  if (loading) {
    return (
      <div className="flex h-40 animate-pulse items-center justify-center rounded-xl bg-zinc-50 border border-zinc-100">
        <span className="text-[13px] text-zinc-400 font-medium">Loading available plans...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-[13px] text-red-500 font-medium">{error}</div>;
  }

  const isTrial = subscription?.status === "TRIAL";
  const activeSlug = subscription?.plan?.slug || "";

  return (
    <div className="space-y-8">
      {/* Current Subscription Status */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-zinc-900">Current Plan</h2>
            <div className="mt-2 flex items-center gap-3">
              <span className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-wider ${
                isTrial ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"
              }`}>
                {subscription?.status || "NO ACTIVE PLAN"}
              </span>
              <span className="text-[14px] font-semibold text-zinc-700">
                {subscription?.plan?.name || "None"}
              </span>
            </div>
            {isTrial && (
              <p className="mt-2 text-[12px] text-amber-700">
                You are currently on a 30-Day Free Trial. Once it ends, select a plan below to keep the platform active.
              </p>
            )}
          </div>
          {subscription?.current_period_end && (
            <div className="text-right">
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Period Ends</p>
              <p className="mt-1 text-[13px] font-semibold text-zinc-900">
                {new Date(subscription.current_period_end).toLocaleDateString(undefined, {
                  year: 'numeric', month: 'short', day: 'numeric'
                })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Plans List */}
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isActive = plan.slug === activeSlug;
          return (
            <div 
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition-all ${
                isActive ? "border-zinc-900 ring-1 ring-zinc-900" : "border-zinc-100 hover:border-zinc-300"
              }`}
            >
              <div className="mb-4">
                <h3 className="text-[18px] font-bold text-zinc-900">{plan.name}</h3>
                <div className="mt-2 flex items-baseline text-zinc-900">
                  <span className="text-[32px] font-black tracking-tight">{parseFloat(plan.monthly_fee_kes).toLocaleString()}</span>
                  <span className="ml-1 text-[13px] font-bold text-zinc-400">KES /mo</span>
                </div>
              </div>

              <div className="flex-1 space-y-4 text-[13px] text-zinc-600">
                <div className="flex justify-between border-b border-zinc-50 pb-2">
                  <span>SMS/Notification</span>
                  <span className="font-semibold text-zinc-900">KES {parseFloat(plan.notification_fee_kes).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-50 pb-2">
                  <span>Wallet Minimum</span>
                  <span className="font-bold text-zinc-900">KES {parseFloat(plan.wallet_minimum_kes).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span>Max Outlets</span>
                  <span className="font-semibold text-zinc-900">
                    {plan.max_branches === -1 ? "∞" : plan.max_branches} Branches&nbsp;/&nbsp;{plan.max_psps === -1 ? "∞" : plan.max_psps} PSPs
                  </span>
                </div>
                {/* Features */}
                <ul className="mt-4 space-y-2">
                  {Object.entries(plan.features || {}).map(([key, val]) => (
                    <li key={key} className="flex items-center gap-2">
                      <svg className={`h-4 w-4 flex-shrink-0 ${val ? "text-green-500" : "text-zinc-300"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={val ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                      </svg>
                      <span className={val ? "font-medium" : "text-zinc-400"}>
                        {key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {plan.requires_custom_quote || plan.slug === "enterprise" ? (
                <a
                  href={`mailto:sales@pesagrid.co.ke?subject=${encodeURIComponent("Request Custom Subscription - PesaGrid Enterprise")}&body=${encodeURIComponent("I would like to request a custom subscription for the PesaGrid Enterprise plan.\n\nBusiness Name: \nPrimary Contact: ")}`}
                  className="mt-6 w-full rounded-xl py-2.5 text-[13px] font-bold text-center bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.98] transition-all"
                >
                  Contact Sales
                </a>
              ) : (
                <button
                  disabled={isActive || actionLoading === plan.slug || actionLoading !== ""}
                  onClick={() => handleSubscribe(plan.slug)}
                  className={`mt-6 w-full rounded-xl py-2.5 text-[13px] font-bold transition-all ${
                    isActive 
                      ? "bg-zinc-100 text-zinc-400 cursor-not-allowed" 
                      : actionLoading === plan.slug 
                        ? "bg-zinc-900 text-white opacity-70"
                        : "bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.98]"
                  }`}
                >
                  {isActive ? "Active Plan" : actionLoading === plan.slug ? "Subscribing..." : "Choose " + plan.name}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
