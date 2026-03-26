"use client";

import { motion } from "framer-motion";

/**
 * Card — white surface with subtle shadow, 16px radius (matches reference)
 */
export function Card({ className = "", children, noPadding = false }) {
  return (
    <div
      className={`rounded-2xl border border-zinc-100 bg-white shadow-sm ${
        noPadding ? "" : "p-6"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * StatWidget — label / big number / trend line exactly matching reference layout
 */
export function StatWidget({ label, value, trend, trendUp = true }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-widest">
        {label}
      </p>
      <h3 className="text-[28px] font-bold tracking-tight text-zinc-900 leading-none">
        {value}
      </h3>
      {trend && (
        <p
          className={`flex items-center gap-1 text-[11px] font-medium ${
            trendUp ? "text-[#6bb800]" : "text-red-500"
          }`}
        >
          <span>{trendUp ? "↑" : "↓"}</span>
          {trend}
          <span className="text-zinc-400 font-normal">from last month</span>
        </p>
      )}
    </div>
  );
}

/**
 * SectionLabel — tiny uppercase label used as a widget sub-title
 */
export function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">
      {children}
    </p>
  );
}

/**
 * ProgressBar — thin colored fill bar
 */
export function ProgressBar({ pct = 0, color = "bg-[#a3e635]", trackColor = "bg-zinc-100" }) {
  return (
    <div className={`relative h-2 w-full rounded-full overflow-hidden ${trackColor}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`absolute h-full rounded-full ${color}`}
      />
    </div>
  );
}
