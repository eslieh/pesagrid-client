"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import PricingTab from "./components/PricingTab";
import WalletTab from "./components/WalletTab";
import InvoicesTab from "./components/InvoicesTab";
import { verifyTopup } from "../../../lib/Billing";

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState("wallet");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const reference = searchParams.get("reference");
    if (reference) {
      setActiveTab("wallet");
      setIsVerifying(true);
      verifyTopup(reference)
        .then((res) => {
          setVerifyResult({ success: true, message: res.message || "Wallet topped up successfully." });
          // Clear query params without full reload
          router.replace("/dashboard/billing", { scroll: false });
        })
        .catch((err) => {
          setVerifyResult({ success: false, message: err.message || "Failed to verify top-up." });
        })
        .finally(() => {
          setIsVerifying(false);
          // clear result after 5s
          setTimeout(() => setVerifyResult(null), 5000);
        });
    }
  }, [searchParams, router]);

  const tabs = [
    { id: "wallet", label: "Prepaid Wallet" },
    { id: "invoices", label: "Invoices" },
    { id: "plans", label: "Plans & Subscriptions" },
  ];

  return (
    <div className="flex h-full flex-col p-8">
      <div className="mb-6">
        <h1 className="text-[20px] font-bold tracking-tight text-zinc-900">Billing & Subscriptions</h1>
        <p className="mt-1 text-[13px] text-zinc-500">Manage your platform plan, load your usage wallet, and view invoices.</p>
      </div>

      {verifyResult && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`mb-6 rounded-lg p-4 text-[13px] font-medium ${verifyResult.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
        >
          {verifyResult.message}
        </motion.div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-zinc-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-4 py-2 text-[13px] font-semibold transition-colors ${
              activeTab === tab.id ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-700"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="billingTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-zinc-900"
              />
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 w-full max-w-5xl">
        <AnimatePresence mode="wait">
          {activeTab === "plans" && (
            <motion.div
              key="plans"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <PricingTab onRequireTopup={() => setActiveTab("wallet")} />
            </motion.div>
          )}
          {activeTab === "wallet" && (
            <motion.div
              key="wallet"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <WalletTab isVerifying={isVerifying} />
            </motion.div>
          )}
          {activeTab === "invoices" && (
            <motion.div
              key="invoices"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <InvoicesTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
