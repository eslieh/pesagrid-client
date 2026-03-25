"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { verifyAccount } from "../../../lib/Auth";
import Image from "next/image";

function Card({ className = "", children }) {
  return (
    <div
      className={[
        "rounded-3xl border border-zinc-900/10 bg-white shadow-[0_1px_0_0_rgba(24,24,27,0.04),0_20px_60px_-40px_rgba(24,24,27,0.55)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export default function VerifyPage() {
  const [formData, setFormData] = useState({
    token: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.token.trim()) {
      setError("Please enter the verification code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await verifyAccount({ token: formData.token });
      // Handle successful verification
      console.log("Verification successful:", response);
      setIsVerified(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerified) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50">
        {/* Background decoration */}
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute -top-28 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-lime-300/25 blur-3xl" />
          <div className="absolute -left-24 top-48 h-[22rem] w-[22rem] rounded-full bg-emerald-200/30 blur-3xl" />
          <div className="absolute -right-24 top-72 h-[22rem] w-[22rem] rounded-full bg-zinc-200/70 blur-3xl" />
        </div>

        {/* Main Content */}
        <main className="flex flex-1 items-center justify-center px-6 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            <Card className="p-8 text-center">
              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="mx-auto mb-6 h-20 w-20 rounded-full bg-lime-100 flex items-center justify-center"
              >
                <svg className="h-10 w-10 text-lime-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 0l-2-2m0 6l2-2m-2 8l2-2m-2 8l2-2" />
                </svg>
              </motion.div>

              <h1 className="text-2xl font-semibold text-zinc-900 mb-2">Account Verified!</h1>
              <p className="text-sm text-zinc-600 mb-6">
                Your Pesagrid account has been successfully verified. You can now log in.
              </p>

              <Link
                href="/pesagrid/login"
                className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-lime-500 to-emerald-500 px-6 text-sm font-semibold text-white shadow-sm transition-all hover:from-lime-600 hover:to-emerald-600"
              >
                Go to Login
              </Link>
            </Card>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-28 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-lime-300/25 blur-3xl" />
        <div className="absolute -left-24 top-48 h-[22rem] w-[22rem] rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute -right-24 top-72 h-[22rem] w-[22rem] rounded-full bg-zinc-200/70 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-4 z-20">
        <div className="mx-auto flex w-full max-w-6xl justify-center px-6">
          <motion.nav
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center rounded-full border border-white/65 bg-[linear-gradient(120deg,rgba(255,255,255,0.62),rgba(255,255,255,0.28))] p-1.5 shadow-[0_12px_45px_-22px_rgba(24,24,27,0.52),inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-2xl"
          >
          </motion.nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <Card className="p-8">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-semibold text-zinc-900">Verify Your Account</h1>
              <p className="mt-2 text-sm text-zinc-600">
                Enter the 6-digit code sent to your email address
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3"
              >
                <p className="text-sm text-red-600">{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="token" className="block text-sm font-medium text-zinc-700 mb-1">
                  Verification Code
                </label>
                <input
                  type="text"
                  id="token"
                  name="token"
                  value={formData.token || ''}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-lime-500 focus:outline-none"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  disabled={isLoading}
                  autoComplete="one-time-code"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-gradient-to-r from-lime-500 to-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:from-lime-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Verifying..." : "Verify Account"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-zinc-600">
                Didn't receive the code?{" "}
                <button
                  onClick={() => window.location.reload()}
                  className="font-semibold text-lime-600 hover:text-lime-700 focus:outline-none focus:underline"
                >
                  Resend Code
                </button>
              </p>
            </div>

            <div className="mt-4 text-center">
              <Link
                href="/pesagrid/login"
                className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
              >
                ← Back to Login
              </Link>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
