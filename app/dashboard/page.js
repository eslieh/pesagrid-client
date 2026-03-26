"use client";

import { motion } from "framer-motion";
import { Card, StatWidget, ProgressBar } from "../pesagrid/components/dashboard/UI";

/* ───────────────────────────────────────────────
   Bar chart colours to match the reference image
   Sun–Sat bars. A few are highlighted green/yellow
─────────────────────────────────────────────────*/
const chartBars = [
  { h: 30, color: "zinc" },
  { h: 45, color: "zinc" },
  { h: 55, color: "zinc" },
  { h: 80, color: "green" }, // Wed highlighted
  { h: 50, color: "yellow" },
  { h: 65, color: "zinc" },
  { h: 40, color: "zinc" },
];

const barColor = {
  green: "bg-[#a3e635]",
  yellow: "bg-[#fdc649]",
  zinc: "bg-zinc-100",
};

const transactions = [
  { initials: "TD", bg: "#e63b42", name: "Dividend payot", date: "25 Feb 2025", amount: "+$1,100", pos: true },
  { initials: "CS", bg: "#2563eb", name: "Corporate subscriptions", date: "15 Feb 2025", amount: "-$6,400", pos: false },
  { initials: "V", bg: "#7c3aed", name: "Investment in ETF", date: "15 Feb 2025", amount: "-$900", pos: false },
  { initials: "CN", bg: "#dc2626", name: "Consulting services", date: "12 Feb 2025", amount: "-$2,100", pos: false },
  { initials: "AZ", bg: "#f97316", name: "Equipment purchase", date: "12 Feb 2025", amount: "-$1,700", pos: false },
  { initials: "EH", bg: "#78716c", name: "Ella Harper", date: "10 Feb 2025", amount: "+$600", pos: true },
  { initials: "DR", bg: "#475569", name: "Davis Rowen", date: "9 Feb 2025", amount: "-$900", pos: false },
];

const goals = [
  { label: "Reserve", amount: "$7,000", total: "$10,000", pct: 70, color: "bg-[#fdc649]", note: "Left to save 4 months" },
  { label: "Travel", amount: "$2,500", total: "$4,000", pct: 62, color: "bg-[#a3e635]", note: "Left to save 3 months" },
  { label: "Car", amount: "$1,600", total: "$10,000", pct: 16, color: "bg-[#fdc649]", note: "Left to save 3 years" },
  { label: "Real estate", amount: "$8,300", total: "$10,000", pct: 83, color: "bg-[#6366f1]", note: "Left to save 5 years 8 months" },
];

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-12 gap-5 p-6 pt-5">

      {/* ── Column 1: Left ─────────────────────────── */}
      <div className="col-span-12 lg:col-span-5 space-y-5">
        <h1 className="text-[20px] font-bold tracking-tight text-zinc-900">Dashboard</h1>

        {/* Balance overview chart */}
        <Card noPadding className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-[26px] font-bold text-zinc-900 leading-none">$12,450</h3>
              <p className="text-[11px] font-medium text-zinc-400 mt-1">Balance overview</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 rounded-lg border border-zinc-100 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-500">
                7d
                <svg className="h-2.5 w-2.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {/* Legend */}
              <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-[#fdc649]" />Savings</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-[#a3e635]" />Income</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-[#f97316]" />Expenses</span>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="flex h-44 w-full items-end gap-1.5">
            {chartBars.map((bar, i) => (
              <div key={i} className="group relative flex-1 flex flex-col items-center gap-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${bar.h}%` }}
                  transition={{ duration: 0.7, delay: i * 0.06, ease: "easeOut" }}
                  className={`w-full rounded-t-md ${barColor[bar.color]} transition-opacity group-hover:opacity-80`}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between px-0 text-[10px] font-medium text-zinc-300">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <span key={d} className="flex-1 text-center">{d}</span>
            ))}
          </div>
        </Card>

        {/* Monthly spending limit */}
        <Card className="py-5 px-5">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h4 className="text-[13px] font-semibold text-zinc-900">Monthly spending limit</h4>
              <p className="text-[10px] text-zinc-400 mt-0.5">Recipient account</p>
            </div>
            <button className="text-zinc-300 hover:text-zinc-600 transition-colors">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
          <div className="mt-4">
            <ProgressBar pct={86} color="bg-[#a3e635]" trackColor="bg-zinc-100" />
          </div>
          <div className="mt-2 flex justify-between text-[11px] font-medium">
            <span className="text-zinc-400">$8,600</span>
            <span className="text-zinc-900 font-semibold">$10,000</span>
          </div>
        </Card>

        {/* Cost analysis + Optimize tips (2-col) */}
        <div className="grid grid-cols-2 gap-5">
          {/* Cost analysis */}
          <Card className="py-5 px-5 col-span-1">
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-[10px] font-medium text-zinc-400">Cost analysis</p>
                <p className="text-[9px] text-zinc-300">Spending overview</p>
              </div>
              <button className="flex items-center gap-1 rounded-lg border border-zinc-100 bg-zinc-50 px-2 py-1 text-[10px] font-medium text-zinc-500">
                January
                <svg className="h-2 w-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
            </div>
            <h3 className="text-[22px] font-bold text-zinc-900 mt-2 mb-4">$8,450</h3>
            <div className="flex h-2 w-full rounded-full overflow-hidden gap-0.5">
              {[
                { w: "18%", c: "bg-[#fdc649]" },
                { w: "7%",  c: "bg-[#f97316]" },
                { w: "6%",  c: "bg-[#a3e635]" },
                { w: "10%", c: "bg-[#84cc16]" },
                { w: "17%", c: "bg-zinc-200" },
                { w: "33%", c: "bg-zinc-100" },
              ].map((bar, i) => (
                <div key={i} style={{ width: bar.w }} className={`h-full ${bar.c}`} />
              ))}
            </div>
            <div className="mt-4 space-y-2">
              {[
                { label: "Housing",      val: "18%", color: "bg-[#fdc649]" },
                { label: "Debt pay.", val: "7%",  color: "bg-[#f97316]" },
                { label: "Food",         val: "6%",  color: "bg-[#a3e635]" },
                { label: "Transport",    val: "10%", color: "bg-[#84cc16]" },
                { label: "Healthcare",   val: "17%", color: "bg-zinc-200" },
                { label: "Investments",  val: "33%", color: "bg-zinc-100" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-sm flex-shrink-0 ${item.color} border border-zinc-200`} />
                  <span className="flex-1 text-[10px] font-medium text-zinc-400 truncate">{item.label}</span>
                  <span className="text-[10px] font-semibold text-zinc-700">{item.val}</span>
                </div>
              ))}
            </div>
          </Card>

          <div className="col-span-1 space-y-5">
            {/* Optimize budget tips */}
            <Card className="py-5 px-5">
              <p className="text-[11px] text-zinc-400 mb-2">💡</p>
              <h4 className="text-[12px] font-semibold text-zinc-900 leading-snug">
                Optimize your budget with these quick tips
              </h4>
              <p className="mt-1 text-[10px] text-zinc-400 leading-relaxed">
                Start preparing for the 2025 tax season by saving 10–15% for deductions.
              </p>
              <button className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-zinc-900 group">
                Read more
                <svg className="h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </Card>

            {/* Financial health gauge */}
            <Card className="py-5 px-5 flex flex-col items-center">
              <div className="w-full mb-3">
                <h4 className="text-[12px] font-semibold text-zinc-900">Financial health</h4>
                <p className="text-[10px] text-zinc-400">30d</p>
              </div>
              {/* Semi-circle gauge */}
              <div className="relative flex h-20 w-36 items-end justify-center overflow-hidden">
                <svg className="absolute top-0 h-36 w-36 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#f4f4f5" strokeWidth="8" strokeDasharray="119.4" />
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#a3e635" strokeWidth="8"
                    strokeDasharray="119.4" strokeDashoffset="29.85" strokeLinecap="round" />
                </svg>
                <div className="relative mb-1 text-center">
                  <span className="text-[22px] font-bold text-zinc-900">75%</span>
                </div>
              </div>
              <p className="mt-2 text-center text-[9px] text-zinc-400 leading-relaxed">
                Based on aggregated transaction metrics over the past 30 days
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* ── Column 2: Stats & goals (Middle) ───────── */}
      <div className="col-span-12 lg:col-span-3 space-y-5 pt-12">
        {/* KPI stats */}
        <div className="space-y-6">
          <StatWidget label="Total income"   value="$15,000" trend="5.1%"  trendUp />
          <StatWidget label="Total expenses"  value="$6,700"  trend="15.5%" trendUp={false} />
          <StatWidget label="Saved balance"   value="$8,300"  trend="20.7%" trendUp />
        </div>

        {/* Goal tracker */}
        <Card className="py-5 px-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[13px] font-semibold text-zinc-900">Goal tracker</h4>
            <button className="text-[11px] font-medium text-zinc-400 hover:text-zinc-700 transition-colors flex items-center gap-1">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add goals
            </button>
          </div>

          <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest mb-3">This year</p>
          <div className="space-y-4">
            {goals.slice(0, 2).map((g, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium text-zinc-700">{g.label}</span>
                  <span className="text-zinc-400">{g.amount}<span className="text-zinc-300">/{g.total}</span></span>
                </div>
                <ProgressBar pct={g.pct} color={g.color} trackColor="bg-zinc-100" />
                <p className="text-[9px] text-zinc-300">{g.note}</p>
              </div>
            ))}
          </div>

          <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest mt-5 mb-3">Long term</p>
          <div className="space-y-4">
            {goals.slice(2).map((g, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium text-zinc-700">{g.label}</span>
                  <span className="text-zinc-400">{g.amount}<span className="text-zinc-300">/{g.total}</span></span>
                </div>
                <ProgressBar pct={g.pct} color={g.color} trackColor="bg-zinc-100" />
                <p className="text-[9px] text-zinc-300">{g.note}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Column 3: Card & Transactions (Right) ──── */}
      <div className="col-span-12 lg:col-span-4 space-y-5 pt-12">
        {/* My card */}
        <Card className="py-5 px-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[13px] font-semibold text-zinc-900">My card</h4>
            <button className="text-[11px] font-medium text-zinc-400 hover:text-zinc-700 flex items-center gap-1">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add card
            </button>
          </div>

          {/* Card visual + placeholder grey card */}
          <div className="flex gap-3 mb-5">
            <motion.div
              whileHover={{ y: -2 }}
              className="flex-1 aspect-[1.65/1] rounded-2xl bg-gradient-to-br from-[#a3e635] to-[#84cc16] p-4 text-zinc-900 shadow-lg shadow-[#a3e63530] relative overflow-hidden"
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-semibold text-zinc-700 uppercase tracking-wider">Debit card</span>
                </div>
                <span className="text-[12px] font-black tracking-wide">VISA</span>
              </div>
              <div className="mt-3">
                <p className="text-[11px] font-bold tracking-[0.15em]">**** **** **** 7890</p>
                <div className="mt-1.5 flex justify-between items-end">
                  <p className="text-[10px] font-medium text-zinc-700">Michael Johnson</p>
                  <p className="text-[10px] font-bold text-zinc-700">01/02</p>
                </div>
              </div>
            </motion.div>

            {/* Ghost card */}
            <div className="w-[38%] aspect-[1.65/1] rounded-2xl bg-zinc-50 border border-zinc-100 p-4 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-medium text-zinc-300 uppercase tracking-wider">Credit card</span>
              </div>
              <div>
                <p className="text-[9px] font-bold tracking-widest text-zinc-200">**** ****</p>
                <p className="text-[9px] text-zinc-300 mt-1 truncate">Michael John…</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-5 gap-1">
            {[
              { label: "Top up",  d: "M12 4v16m8-8H4" },
              { label: "Send",    d: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8" },
              { label: "Request", d: "M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3" },
              { label: "History", d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
              { label: "More",    d: "M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" },
            ].map((a, i) => (
              <button key={i} className="flex flex-col items-center gap-1.5 group">
                <div className="h-10 w-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center transition-all group-hover:bg-white group-hover:shadow-sm group-hover:scale-105 active:scale-95">
                  <svg className="h-4 w-4 text-zinc-400 group-hover:text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={a.d} />
                  </svg>
                </div>
                <span className="text-[9px] font-medium text-zinc-400">{a.label}</span>
              </button>
            ))}
          </div>

          {/* Quick payment */}
          <div className="mt-5 flex items-center justify-between mb-3">
            <p className="text-[12px] font-semibold text-zinc-900">Quick payment</p>
            <button className="text-zinc-300">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h.01M12 12h.01M19 12h.01" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
            {["Davis", "Eli", "Leo", "Amanda", "Ann", "Sin"].map((name, i) => (
              <button key={i} className="flex flex-col items-center gap-1 flex-shrink-0 group">
                <div className="h-9 w-9 rounded-full bg-zinc-100 overflow-hidden border-2 border-white ring-1 ring-zinc-100 transition-all group-hover:ring-[#a3e635]">
                  <img
                    src={`https://ui-avatars.com/api/?name=${name}&background=e4e4e7&color=52525b&size=64`}
                    className="h-full w-full object-cover"
                    alt={name}
                  />
                </div>
                <span className="text-[9px] font-medium text-zinc-400">{name}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Transaction history */}
        <Card className="py-5 px-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[13px] font-semibold text-zinc-900">Transaction history</h4>
            <button className="flex items-center gap-1 rounded-lg border border-zinc-100 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-500">
              7d
              <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <div className="flex justify-between text-[10px] font-medium text-zinc-300 mb-3 px-0.5">
            <span>Name</span>
            <span>Amount</span>
          </div>

          <div className="space-y-3.5">
            {transactions.map((tx, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: tx.bg }}
                >
                  {tx.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-zinc-800 truncate">{tx.name}</p>
                  <p className="text-[9px] text-zinc-400">{tx.date}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-[11px] font-semibold ${tx.pos ? "text-[#6bb800]" : "text-zinc-700"}`}>
                    {tx.amount}
                  </p>
                  <p className={`text-[9px] ${tx.pos ? "text-[#a3e635]" : "text-zinc-300"}`}>
                    {tx.pos ? "Completed" : "Declined"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
