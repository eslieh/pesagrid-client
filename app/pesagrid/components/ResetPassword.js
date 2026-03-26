"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { resetPassword } from "../../../lib/Auth";

function Card({ className = "", children }) {
  return (
    <div
      className={[
        "rounded-[2.5rem] border border-zinc-900/10 bg-white shadow-[0_1px_0_0_rgba(24,24,27,0.04),0_20px_60px_-40px_rgba(24,24,27,0.55)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token");

  const [formData, setFormData] = useState({
    token: tokenFromUrl || "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (tokenFromUrl) {
      setFormData(prev => ({ ...prev, token: tokenFromUrl }));
    }
  }, [tokenFromUrl]);

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
      setError("Verification code is required");
      return;
    }
    if (formData.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await resetPassword({
        token: formData.token.trim(),
        new_password: formData.newPassword,
      });
      setIsSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full text-center"
          >
            <Card className="p-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-[#9de50033]"
              >
                <svg className="h-12 w-12 text-[#6f9f00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>

              <h1 className="text-3xl font-bold text-zinc-900 mb-3">Password Reset!</h1>
              <p className="text-zinc-600 mb-8 px-4">
                Your password has been successfully updated. You can now sign in with your new credentials.
              </p>

              <Link
                href="/auth/login"
                className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-[#9de500cc] px-8 text-base font-bold text-zinc-900 shadow-[0_8px_20px_-6px_rgba(157,229,0,0.4)] transition-all hover:bg-[#8fd100] hover:scale-[1.02] active:scale-[0.98]"
              >
                Go to Login
              </Link>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <Card className="p-10">
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Reset Password</h1>
                <p className="mt-2 text-sm text-zinc-600">
                  Enter the code and your new password below
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-4"
                >
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="token" className="block text-sm font-semibold text-zinc-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    id="token"
                    name="token"
                    value={formData.token}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-zinc-200 px-5 py-4 text-center text-xl font-bold tracking-[0.2em] text-zinc-900 focus:border-[#9de500cc] focus:ring-4 focus:ring-[#9de5001a] focus:outline-none transition-all"
                    placeholder="Enter code"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-semibold text-zinc-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-zinc-200 px-5 py-4 text-base text-zinc-900 placeholder-zinc-400 focus:border-[#9de500cc] focus:ring-4 focus:ring-[#9de5001a] focus:outline-none transition-all"
                    placeholder="Min. 6 characters"
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-zinc-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-zinc-200 px-5 py-4 text-base text-zinc-900 placeholder-zinc-400 focus:border-[#9de500cc] focus:ring-4 focus:ring-[#9de5001a] focus:outline-none transition-all"
                    placeholder="Verify your new password"
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 rounded-2xl bg-[#9de500cc] text-base font-bold text-zinc-900 shadow-[0_8px_20px_-6px_rgba(157,229,0,0.4)] transition-all hover:bg-[#8fd100] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {isLoading ? "Updating..." : "Reset Password"}
                </button>
              </form>
            </Card>

            <div className="mt-8 text-center">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-700 transition-colors"
              >
                ← Back to Login
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-28 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[#9de50033] blur-3xl" />
        <div className="absolute -left-24 top-48 h-[22rem] w-[22rem] rounded-full bg-[#9de50026] blur-3xl" />
        <div className="absolute -right-24 top-72 h-[22rem] w-[22rem] rounded-full bg-zinc-200/70 blur-3xl" />
      </div>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <Suspense fallback={<div>Loading...</div>}>
          <ResetPasswordContent />
        </Suspense>
      </main>
    </div>
  );
}
