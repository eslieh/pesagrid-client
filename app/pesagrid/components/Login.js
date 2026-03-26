"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { login, forgotPassword } from "../../../lib/Auth";

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

export default function LoginPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const formatPhoneNumber = (value) => {
    const cleanValue = value.replace(/[^\d+]/g, '');
    if (cleanValue.startsWith('0') && (cleanValue[1] === '7' || cleanValue[1] === '1')) {
      const rest = cleanValue.slice(1);
      const p1 = "+254";
      const p2 = rest.slice(0, 3);
      const p3 = rest.slice(3, 6);
      const p4 = rest.slice(6, 9);
      return [p1, p2, p3, p4].filter(Boolean).join(' ');
    }
    if (cleanValue.startsWith('+')) {
      const prefix = cleanValue.slice(0, 4);
      const rest = cleanValue.slice(4);
      const groups = rest.match(/.{1,3}/g) || [];
      return [prefix, ...groups].join(' ');
    }
    return cleanValue;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === "identifier") {
      const isLikelyPhone = /^(\+|0)/.test(value) && /^[\d+\s.-]*$/.test(value);
      if (isLikelyPhone) {
        finalValue = formatPhoneNumber(value);
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
    if (error) setError("");
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (!formData.identifier.trim()) {
      setError("Please enter your email or phone number");
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setError("");
  };

  const handleForgotPassword = async () => {
    setIsLoading(true);
    setError("");
    setResetSent(false);

    try {
      const isPhone = formData.identifier.includes('+') || /^\d/.test(formData.identifier.replace(/\s/g, ''));
      const sanitizedIdentifier = isPhone 
        ? formData.identifier.replace(/\s/g, '') 
        : formData.identifier.trim();

      const payload = isPhone ? { phone: sanitizedIdentifier } : { email: sanitizedIdentifier };
      await forgotPassword(payload);
      setResetSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.password) {
      setError("Please enter your password");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Determine auth type and sanitize identifier if it's a phone
      const isPhone = formData.identifier.includes('+') || /^\d/.test(formData.identifier.replace(/\s/g, ''));
      const sanitizedIdentifier = isPhone 
        ? formData.identifier.replace(/\s/g, '') 
        : formData.identifier.trim();

      const response = await login({
        identifier: sanitizedIdentifier,
        auth_type: isPhone ? "phone" : "email",
        password: formData.password
      });
      // Handle successful login
      console.log("Login successful:", response);
      // You might want to redirect to dashboard here
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const stepVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-28 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[#9de50033] blur-3xl" />
        <div className="absolute -left-24 top-48 h-[22rem] w-[22rem] rounded-full bg-[#9de50026] blur-3xl" />
        <div className="absolute -right-24 top-72 h-[22rem] w-[22rem] rounded-full bg-zinc-200/70 blur-3xl" />
      </div>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <Card className="p-10">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Welcome Back</h1>
              <p className="mt-2 text-sm text-zinc-600">Sign in to manage your reconciliation</p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4"
              >
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </motion.div>
            )}

            {resetSent && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4"
              >
                <p className="text-sm text-green-700 font-medium">
                  Reset code sent! Check your {formData.identifier.includes('@') ? 'email' : 'phone'}.{" "}
                  <Link href="/auth/reset-password" title="Go to reset password page" className="underline font-bold">
                    Go to Reset Page
                  </Link>
                </p>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.form
                  key="step1"
                  variants={stepVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  onSubmit={handleNext}
                  className="space-y-6"
                >
                  <div>
                    <label htmlFor="identifier" className="block text-sm font-semibold text-zinc-700 mb-2">
                      Email or Phone Number
                    </label>
                    <input
                      type="text"
                      id="identifier"
                      name="identifier"
                      value={formData.identifier || ''}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-zinc-200 px-5 py-4 text-base text-zinc-900 placeholder-zinc-400 focus:border-[#9de500cc] focus:ring-4 focus:ring-[#9de5001a] focus:outline-none transition-all"
                      placeholder="Enter your email or phone"
                      autoComplete="username"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full h-14 rounded-2xl bg-[#9de500cc] text-base font-bold text-zinc-900 shadow-[0_8px_20px_-6px_rgba(157,229,0,0.4)] transition-all hover:bg-[#8fd100] hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Continue
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="step2"
                  variants={stepVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <label htmlFor="password" className="block text-sm font-semibold text-zinc-700">
                        Password
                      </label>
                      <div className="flex flex-col items-end gap-1">
                        <button 
                          type="button" 
                          onClick={handleBack}
                          className="text-xs font-bold text-[#6f9f00] hover:underline"
                        >
                          Change Identifier
                        </button>
                        <button 
                          type="button" 
                          onClick={handleForgotPassword}
                          disabled={isLoading}
                          className="text-[10px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
                        >
                          Forgot Password?
                        </button>
                      </div>
                    </div>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password || ''}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-zinc-200 px-5 py-4 text-base text-zinc-900 placeholder-zinc-400 focus:border-[#9de500cc] focus:ring-4 focus:ring-[#9de5001a] focus:outline-none transition-all"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 rounded-2xl bg-[#9de500cc] text-base font-bold text-zinc-900 shadow-[0_8px_20px_-6px_rgba(157,229,0,0.4)] transition-all hover:bg-[#8fd100] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="mt-8 text-center border-t border-zinc-100 pt-8">
              <p className="text-sm text-zinc-600">
                Don&apos;t have an account?{" "}
                <Link
                  href="/auth/register"
                  className="font-bold text-[#6f9f00] hover:text-[#5d8600]"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </Card>

          <div className="mt-8 text-center">
            <Link
              href="/pesagrid"
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
