"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "./UI";

/**
 * MfaVerificationModal
 * 
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {function} onClose - function() called when user cancels
 * @param {function} onVerify - function(code) called when user submits code
 * @param {boolean} isLoading - Whether the verification is in progress
 */
export function MfaVerificationModal({ isOpen, onClose, onVerify, isLoading }) {
  const [code, setCode] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code.length === 6) {
      onVerify(code);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm"
            onClick={!isLoading ? onClose : undefined}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-sm"
          >
            <Card className="shadow-2xl ring-1 ring-zinc-900/5 p-8 relative overflow-hidden">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 shadow-inner">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>

              <div className="text-center mb-6">
                <h3 className="text-[18px] font-bold text-zinc-900">Security Verification</h3>
                <p className="mt-2 text-[13px] text-zinc-500 leading-relaxed">
                  Enter the 6-digit code sent to your email to authorize this action.
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      if (val.length <= 6) setCode(val);
                    }}
                    placeholder="000000"
                    className="w-full text-center tracking-[0.5em] text-[24px] font-mono font-bold text-zinc-900 placeholder:text-zinc-200 border border-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    required
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="flex-1 rounded-xl bg-zinc-100 px-4 py-3 text-[13px] font-semibold text-zinc-600 transition-colors hover:bg-zinc-200 active:scale-95 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={code.length !== 6 || isLoading}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-zinc-800 hover:shadow-md active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="h-4 w-4 rounded-full border-2 border-zinc-500 border-t-white animate-spin" />
                    ) : (
                      "Verify"
                    )}
                  </button>
                </div>
              </form>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
