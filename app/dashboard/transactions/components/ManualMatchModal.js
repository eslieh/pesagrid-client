"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "../../../pesagrid/components/dashboard/UI";
import { getObligations, getGlobalLedger } from "../../../../lib/Obligation";
import { getCollectionPoints } from "../../../../lib/CollectionPoint";
import { matchTransaction } from "../../../../lib/Transaction";

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", damping: 25, stiffness: 300 },
  },
  exit: { opacity: 0, scale: 0.95, y: 20 },
};

export default function ManualMatchModal({
  isOpen,
  onClose,
  transaction,
  formatCurrency,
  onMatched,
}) {
  const [step, setStep] = useState(1);
  const [targetType, setTargetType] = useState(null); // 'obligation' or 'collection_point'
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setTargetType(null);
      setSearch("");
      setResults([]);
      setSelectedTarget(null);
      setError("");
    }
  }, [isOpen]);

  const handleSearch = useCallback(
    async (query) => {
      if (!query) {
        setResults([]);
        return;
      }

      setLoading(true);
      setResults([]);
      setError("");
      try {
        if (targetType === "obligation") {
          // Search by explicit account number first
          let finalObligations = [];
          const exactRes = await getObligations({
            account_no: query,
            limit: 10,
          });
          if (exactRes.items && exactRes.items.length > 0) {
            finalObligations = [...exactRes.items];
          }

          // Then search by payer name using the global ledger
          const ledgerRes = await getGlobalLedger({
            search: query,
            page: 1,
            page_size: 5,
          });
          if (ledgerRes.items && ledgerRes.items.length > 0) {
            // Fetch open obligations for matched payers
            for (const payer of ledgerRes.items) {
              const obsRes = await getObligations({
                payer_id: payer.payer_id,
                limit: 10,
              });
              if (obsRes.items) {
                for (const ob of obsRes.items) {
                  // Only suggest unresolved obligations
                  if (["pending", "partial", "overdue"].includes(ob.status)) {
                    if (!finalObligations.some((o) => o.id === ob.id)) {
                      finalObligations.push(ob);
                    }
                  }
                }
              }
            }
          }

          setResults(finalObligations);
          if (finalObligations.length === 0) {
            setError(`No obligation found matching "${query}"`);
          }
        } else {
          const res = await getCollectionPoints(query, null, 10);
          setResults(res.items || []);
          if (!res.items || res.items.length === 0) {
            setError(`No collection point found for "${query}"`);
          }
        }
      } catch (err) {
        console.error("Search failed", err);
        setError("Search failed. Please check the identifier and try again.");
      } finally {
        setLoading(false);
      }
    },
    [targetType],
  );

  const handleSubmit = async () => {
    if (!selectedTarget) return;

    setIsSubmitting(true);
    setError("");
    try {
      const payload = {};
      if (targetType === "obligation") {
        payload.obligation_id = selectedTarget.id;
      } else {
        payload.collection_point_id = selectedTarget.id;
      }

      await matchTransaction(transaction.id, payload);
      onMatched();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to match transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
          className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-hidden border border-zinc-100"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <div>
              <h2 className="text-[17px] font-black text-zinc-900 leading-tight">
                Match Transaction
              </h2>
              <p className="text-[11px] font-bold text-zinc-400 mt-1 uppercase tracking-widest">
                TX: {transaction.psp_ref} • {formatCurrency(transaction.amount)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-colors"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-[12px] font-semibold">
                {error}
              </div>
            )}

            {/* STEP 1: Choose Type */}
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="text-[15px] font-bold text-zinc-800">
                  Assign this transaction to:
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setTargetType("obligation");
                      nextStep();
                    }}
                    className="flex flex-col items-center gap-4 p-6 rounded-[24px] border-2 border-zinc-100 hover:border-[#a3e635] hover:bg-[#a3e635]/5 transition-all group text-center"
                  >
                    <div className="h-12 w-12 rounded-2xl bg-zinc-50 flex items-center justify-center group-hover:bg-[#a3e635]/20 transition-colors">
                      <svg
                        className="h-6 w-6 text-zinc-400 group-hover:text-[#65a30d]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[14px] font-black text-zinc-900">
                        Specific Invoice
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-1 font-medium">
                        Match to a payer's obligation
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setTargetType("collection_point");
                      nextStep();
                    }}
                    className="flex flex-col items-center gap-4 p-6 rounded-[24px] border-2 border-zinc-100 hover:border-blue-400 hover:bg-blue-50/50 transition-all group text-center"
                  >
                    <div className="h-12 w-12 rounded-2xl bg-zinc-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <svg
                        className="h-6 w-6 text-zinc-400 group-hover:text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[14px] font-black text-zinc-900">
                        Collection Point
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-1 font-medium">
                        Categorize under a point
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Selection */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <button
                    onClick={prevStep}
                    className="p-2 -ml-2 rounded-full hover:bg-zinc-100 text-zinc-400"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <h3 className="text-[15px] font-bold text-zinc-800">
                    Select target {targetType?.replace("_", " ")}
                  </h3>
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-[12px] font-medium text-zinc-500">
                    {targetType === "obligation"
                      ? "Search by Payer Name or Account Number to find the obligation."
                      : "Enter the Collection Point name or account number."}
                  </p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <svg
                        className="absolute left-4 top-3.5 h-4 w-4 text-zinc-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      <input
                        autoFocus
                        type="text"
                        placeholder={
                          targetType === "obligation"
                            ? "e.g. John Doe or ACC1002"
                            : "Search..."
                        }
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleSearch(search)
                        }
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-3 pl-11 pr-4 text-[13px] font-bold text-zinc-900 focus:outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all"
                      />
                    </div>
                    <button
                      onClick={() => handleSearch(search)}
                      disabled={loading || !search}
                      className="px-6 rounded-2xl bg-zinc-900 text-[12px] font-bold text-white hover:bg-zinc-800 transition-all disabled:opacity-50"
                    >
                      {loading ? "..." : "Lookup"}
                    </button>
                  </div>
                </div>

                <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                  {results.length > 0
                    ? results.map((item) => {
                        const payer =
                          targetType === "obligation" ? item.payer : null;
                        const displayName =
                          targetType === "obligation"
                            ? payer?.name || item.payer_name
                            : item.name;
                        const displayPhone = payer?.phone || item.phone;
                        const displayEmail = payer?.email;

                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setSelectedTarget(item);
                              nextStep();
                            }}
                            className="w-full flex items-center justify-between p-5 rounded-3xl border border-zinc-100 bg-white hover:border-[#a3e635] hover:shadow-md transition-all group text-left"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-[14px] font-black text-zinc-900 truncate">
                                  {displayName}
                                </p>
                                {targetType === "obligation" && item.status && (
                                  <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500">
                                    {item.status}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[11px] font-bold text-zinc-400 uppercase tracking-tight">
                                <span className="text-zinc-600">
                                  #{item.account_no}
                                </span>
                                <span className="h-1 w-1 rounded-full bg-zinc-200" />
                                <span className="truncate">
                                  {item.description}
                                </span>
                                {displayPhone && (
                                  <>
                                    <span className="h-1 w-1 rounded-full bg-zinc-200" />
                                    <span className="tabular-nums text-zinc-500">
                                      {displayPhone}
                                    </span>
                                  </>
                                )}
                              </div>
                              {displayEmail && (
                                <p className="text-[10px] font-medium text-zinc-400 mt-1">
                                  {displayEmail}
                                </p>
                              )}
                              {targetType === "obligation" && item.due_date && (
                                <p className="text-[10px] font-medium text-amber-600 mt-0.5">
                                  Due:{" "}
                                  {new Date(item.due_date).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              {targetType === "obligation" && (
                                <p className="text-[14px] font-black text-zinc-900 leading-tight">
                                  KES {item.balance.toLocaleString()}
                                </p>
                              )}
                              <span className="text-[10px] font-black uppercase text-[#65a30d] opacity-0 group-hover:opacity-100 transition-all block mt-1">
                                Select →
                              </span>
                            </div>
                          </button>
                        );
                      })
                    : null}
                </div>
              </div>
            )}

            {/* STEP 3: Confirm */}
            {step === 3 && selectedTarget && (
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <button
                    onClick={prevStep}
                    className="p-2 -ml-2 rounded-full hover:bg-zinc-100 text-zinc-400"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <h3 className="text-[15px] font-bold text-zinc-800">
                    Confirm Assignment
                  </h3>
                </div>

                <div className="p-6 rounded-[32px] bg-zinc-50 border border-zinc-100 space-y-6 shadow-inner">
                  <div className="flex items-center justify-between pb-6 border-b border-zinc-200">
                    <div>
                      <SectionLabel>Assign funds from</SectionLabel>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[15px] font-black text-zinc-900">
                          {transaction.psp_ref}
                        </p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-200 text-zinc-600 uppercase">
                          {transaction.psp_type}
                        </span>
                      </div>
                      <p className="text-[13px] text-zinc-500 font-bold mt-1">
                        Amount:{" "}
                        <span className="text-zinc-900">
                          {formatCurrency(transaction.amount)}
                        </span>
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center border border-zinc-200 shadow-sm">
                      <svg
                        className="h-6 w-6 text-zinc-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M19 14l-7 7m0 0l-7-7m7 7V3"
                        />
                      </svg>
                    </div>
                  </div>

                  <div className="relative pl-6 border-l-2 border-[#a3e635]/30">
                    <SectionLabel>
                      Target{" "}
                      {targetType === "obligation"
                        ? "Invoice"
                        : "Collection Point"}
                    </SectionLabel>
                    <div className="mt-2">
                      <p className="text-[16px] font-black text-zinc-900 leading-tight">
                        {targetType === "obligation"
                          ? selectedTarget.payer?.name ||
                            selectedTarget.payer_name
                          : selectedTarget.name}
                      </p>

                      <div className="grid grid-cols-2 gap-y-3 mt-4 text-[12px]">
                        <div>
                          <p className="text-zinc-400 font-bold uppercase text-[9px] tracking-widest">
                            Account #
                          </p>
                          <p className="font-bold text-zinc-700">
                            {selectedTarget.account_no}
                          </p>
                        </div>
                        {targetType === "obligation" && (
                          <div>
                            <p className="text-zinc-400 font-bold uppercase text-[9px] tracking-widest">
                              Current Balance
                            </p>
                            <p className="font-bold text-[#65a30d]">
                              KES {selectedTarget.balance.toLocaleString()}
                            </p>
                          </div>
                        )}
                        <div className="col-span-2">
                          <p className="text-zinc-400 font-bold uppercase text-[9px] tracking-widest">
                            Invoice Description
                          </p>
                          <p className="font-medium text-zinc-600 italic">
                            "{selectedTarget.description}"
                          </p>
                        </div>
                        {(selectedTarget.payer?.phone ||
                          selectedTarget.phone ||
                          selectedTarget.payer?.email) && (
                          <div className="col-span-2">
                            <p className="text-zinc-400 font-bold uppercase text-[9px] tracking-widest">
                              Payer Contact
                            </p>
                            <div className="space-y-0.5">
                              {(selectedTarget.payer?.phone ||
                                selectedTarget.phone) && (
                                <p className="font-bold text-zinc-700">
                                  {selectedTarget.payer?.phone ||
                                    selectedTarget.phone}
                                </p>
                              )}
                              {selectedTarget.payer?.email && (
                                <p className="font-medium text-zinc-500">
                                  {selectedTarget.payer.email}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 py-4 text-[14px] font-black text-white shadow-xl hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Confirm & Match Transaction"
                  )}
                </button>
                <p className="text-[11px] text-center text-zinc-500 font-medium px-6 leading-relaxed">
                  Note: This will asynchronously trigger the reconciliation
                  process. This action is logged for audit purposes.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-[#65a30d] mb-1">
      {children}
    </p>
  );
}
