"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { login } from "../../../lib/Auth";
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

export default function LoginPage() {
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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
    if (!formData.identifier || !formData.password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await login(formData);
      // Handle successful login
      console.log("Login successful:", response);
      // You might want to redirect to dashboard here
      // For now, we'll just log the success
      window.location.href = "/pesagrid"; // Redirect back to landing page
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

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
              <h1 className="text-2xl font-semibold text-zinc-900">Welcome Back to Pesagrid</h1>
              <p className="mt-2 text-sm text-zinc-600">Sign in to manage your payment reconciliation</p>
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
                <label htmlFor="identifier" className="block text-sm font-medium text-zinc-700 mb-1">
                  Email or Phone
                </label>
                <input
                  type="text"
                  id="identifier"
                  name="identifier"
                  value={formData.identifier || ''}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-lime-500 focus:outline-none"
                  placeholder="Enter your email or phone number"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-zinc-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password || ''}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-lime-500 focus:outline-none"
                  placeholder="Enter your password"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-gradient-to-r from-lime-500 to-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:from-lime-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-zinc-600">
                Don't have an account?{" "}
                <Link
                  href="/pesagrid/register"
                  className="font-semibold text-lime-600 hover:text-lime-700 focus:outline-none focus:underline"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </Card>

          <div className="mt-6 text-center">
            <Link
              href="/pesagrid"
              className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
