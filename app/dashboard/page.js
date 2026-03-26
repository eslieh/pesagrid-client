"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, StatWidget, ProgressBar } from "../pesagrid/components/dashboard/UI";
import { 
  getDashboardMetrics, 
  getCollectionTrends, 
  getPeakTimes, 
  getRecentPayments 
} from "../../lib/Dashboard";

/* ───────────────────────────────────────────────
   Bar chart colours to match the reference image
─────────────────────────────────────────────────*/
const barColor = {
  green: "bg-[#a3e635]",
  yellow: "bg-[#fdc649]",
  zinc: "bg-zinc-100",
};

export default function DashboardPage() {
  const [metrics, setMetrics] = useState({
    total_collected: 0,
    total_matched: 0,
    total_unmatched: 0,
    outstanding_balances: 0
  });
  const [trends, setTrends] = useState([]);
  const [peakTimes, setPeakTimes] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [m, t, p, r] = await Promise.all([
          getDashboardMetrics(),
          getCollectionTrends("day"),
          getPeakTimes(),
          getRecentPayments(null, 0, 7)
        ]);
        
        setMetrics(m);
        setTrends(t.trends?.slice(-7) || []); // Get last 7 days
        setPeakTimes(p.peaks || []);
        setRecentPayments(r.items || []);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "KES", // Assuming KES based on context, or use a default
    }).format(val);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Map trends to chart bars
  const chartBars = trends.map((item, i) => {
    // Determine color based on index or value (mirroring original mock design)
    let color = "zinc";
    if (i === 3) color = "green"; // Wed-ish highlight
    if (i === 4) color = "yellow";

    // Normalize height based on max value in trends
    const maxVal = Math.max(...trends.map(t => t.total), 1);
    const height = (item.total / maxVal) * 80 + 10; // min 10% height

    return {
      h: height,
      color: color,
      label: item.period // e.g. "2024-03-26"
    };
  });

  if (loading && !metrics.total_collected) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-[#a3e635]" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-5 p-6 pt-5">

      {/* ── Column 1: Left ─────────────────────────── */}
      <div className="col-span-12 lg:col-span-5 space-y-5">
        <h1 className="text-[20px] font-bold tracking-tight text-zinc-900">Dashboard</h1>

        {/* Balance overview chart */}
        <Card noPadding className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-[26px] font-bold text-zinc-900 leading-none">
                {formatCurrency(metrics.total_collected)}
              </h3>
              <p className="text-[11px] font-medium text-zinc-400 mt-1">Total Collected Overview</p>
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
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-[#fdc649]" />Matched</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-[#a3e635]" />Collected</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-[#f97316]" />Outstanding</span>
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
            {chartBars.length === 0 && (
              <div className="w-full h-full flex items-center justify-center text-zinc-300 text-[11px]">
                No trend data available
              </div>
            )}
          </div>
          <div className="mt-2 flex justify-between px-0 text-[10px] font-medium text-zinc-300">
            {chartBars.map((bar, i) => (
              <span key={i} className="flex-1 text-center">
                {new Date(bar.label).toLocaleDateString("en-US", { weekday: "short" })}
              </span>
            ))}
          </div>
        </Card>

        {/* Collection Efficiency */}
        <Card className="py-5 px-5">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h4 className="text-[13px] font-semibold text-zinc-900">Collection Efficiency</h4>
              <p className="text-[10px] text-zinc-400 mt-0.5">Matched vs Total Collected</p>
            </div>
          </div>
          <div className="mt-4">
            <ProgressBar 
              pct={metrics.total_collected > 0 ? (metrics.total_matched / metrics.total_collected) * 100 : 0} 
              color="bg-[#a3e635]" 
              trackColor="bg-zinc-100" 
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] font-medium">
            <span className="text-zinc-400">{formatCurrency(metrics.total_matched)} Matched</span>
            <span className="text-zinc-900 font-semibold">{formatCurrency(metrics.total_collected)} Total</span>
          </div>
        </Card>

        {/* Peak Times Analysis */}
        <div className="grid grid-cols-2 gap-5">
          <Card className="py-5 px-5 col-span-1">
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-[10px] font-medium text-zinc-400">Peak Times</p>
                <p className="text-[9px] text-zinc-300">Hourly Distribution</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {peakTimes.slice(0, 6).map((item, i) => {
                const maxPeak = Math.max(...peakTimes.map(p => p.total), 1);
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-[9px] font-medium text-zinc-400">
                      <span>{item.hour}:00</span>
                      <span className="text-zinc-700">{formatCurrency(item.total)}</span>
                    </div>
                    <div className="h-1 w-full bg-zinc-50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#fdc649]" 
                        style={{ width: `${(item.total / maxPeak) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {peakTimes.length === 0 && (
                <p className="text-[10px] text-zinc-300 italic">No peak data</p>
              )}
            </div>
          </Card>

          <div className="col-span-1 space-y-5">
            {/* Optimization Tips */}
            <Card className="py-5 px-5">
              <p className="text-[11px] text-zinc-400 mb-2">💡</p>
              <h4 className="text-[12px] font-semibold text-zinc-900 leading-snug">
                Fleet Performance Tip
              </h4>
              <p className="mt-1 text-[10px] text-zinc-400 leading-relaxed">
                Your peak collection period is usually between 7 AM and 9 AM. Ensure all collection points are active.
              </p>
            </Card>

            {/* Matching Health */}
            <Card className="py-5 px-5 flex flex-col items-center">
              <div className="w-full mb-3">
                <h4 className="text-[12px] font-semibold text-zinc-900">Matching Health</h4>
                <p className="text-[10px] text-zinc-400">Matched Ratio</p>
              </div>
              <div className="relative flex h-20 w-36 items-end justify-center overflow-hidden">
                <svg className="absolute top-0 h-36 w-36 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#f4f4f5" strokeWidth="8" strokeDasharray="119.4" />
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#a3e635" strokeWidth="8"
                    strokeDasharray="119.4" strokeDashoffset={119.4 - (119.4 * (metrics.total_collected > 0 ? metrics.total_matched / metrics.total_collected : 0))} strokeLinecap="round" />
                </svg>
                <div className="relative mb-1 text-center">
                  <span className="text-[22px] font-bold text-zinc-900">
                    {metrics.total_collected > 0 ? Math.round((metrics.total_matched / metrics.total_collected) * 100) : 0}%
                  </span>
                </div>
              </div>
              <p className="mt-2 text-center text-[9px] text-zinc-400 leading-relaxed">
                Ratio of matched transactions to total collections
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* ── Column 2: Stats & Goals (Middle) ───────── */}
      <div className="col-span-12 lg:col-span-3 space-y-5 pt-12">
        {/* KPI stats */}
        <div className="space-y-6">
          <StatWidget label="Total Collected" value={formatCurrency(metrics.total_collected)} trend="Real-time" trendUp />
          <StatWidget label="Total Matched" value={formatCurrency(metrics.total_matched)} trend="Updated" trendUp />
          <StatWidget label="Outstanding" value={formatCurrency(metrics.outstanding_balances)} trend="Action required" trendUp={false} />
        </div>

        {/* Performance tracking */}
        <Card className="py-5 px-5">
          <h4 className="text-[13px] font-semibold text-zinc-900 mb-4">Collection Health</h4>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-zinc-700">Matched Rate</span>
                <span className="text-zinc-400">
                  {metrics.total_collected > 0 ? Math.round((metrics.total_matched / metrics.total_collected) * 100) : 0}%
                </span>
              </div>
              <ProgressBar 
                pct={metrics.total_collected > 0 ? (metrics.total_matched / metrics.total_collected) * 100 : 0} 
                color="bg-[#a3e635]" 
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-zinc-700">Outstanding Rate</span>
                <span className="text-zinc-400">
                  {metrics.total_collected > 0 ? Math.round((metrics.outstanding_balances / metrics.total_collected) * 100) : 0}%
                </span>
              </div>
              <ProgressBar 
                pct={metrics.total_collected > 0 ? (metrics.outstanding_balances / metrics.total_collected) * 100 : 0} 
                color="bg-[#fdc649]" 
              />
            </div>
          </div>
        </Card>
      </div>

      {/* ── Column 3: Transactions (Right) ──── */}
      <div className="col-span-12 lg:col-span-4 space-y-5 pt-12">
        {/* Quick actions or info */}
        <Card className="py-5 px-5">
          <h4 className="text-[13px] font-semibold text-zinc-900 mb-4">Reports & Export</h4>
          <div className="grid grid-cols-2 gap-3">
            <button className="flex flex-col items-center gap-2 p-3 rounded-xl bg-zinc-50 border border-zinc-100 hover:bg-white hover:shadow-sm transition-all">
              <div className="h-8 w-8 rounded-lg bg-[#a3e635]/10 flex items-center justify-center">
                <svg className="h-4 w-4 text-[#6bb800]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-[10px] font-semibold text-zinc-900">PDF Report</p>
            </button>
            <button className="flex flex-col items-center gap-2 p-3 rounded-xl bg-zinc-50 border border-zinc-100 hover:bg-white hover:shadow-sm transition-all">
              <div className="h-8 w-8 rounded-lg bg-[#fdc649]/10 flex items-center justify-center">
                <svg className="h-4 w-4 text-[#f59e0b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-[10px] font-semibold text-zinc-900">Excel Export</p>
            </button>
          </div>
        </Card>

        {/* Transaction history */}
        <Card className="py-5 px-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[13px] font-semibold text-zinc-900">Recent Payments</h4>
            <button className="flex items-center gap-1 rounded-lg border border-zinc-100 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-500">
              Recent
              <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <div className="flex justify-between text-[10px] font-medium text-zinc-300 mb-3 px-0.5">
            <span>Payer / Ref</span>
            <span>Amount</span>
          </div>

          <div className="space-y-3.5">
            {recentPayments.map((tx, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white bg-zinc-100">
                  <span className="text-zinc-400">
                    {tx.payer_name ? tx.payer_name.charAt(0) : tx.psp_type?.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-zinc-800 truncate">
                    {tx.payer_name || tx.psp_ref}
                  </p>
                  <p className="text-[9px] text-zinc-400">{formatDate(tx.ingested_at)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[11px] font-semibold text-[#6bb800]">
                    +{formatCurrency(tx.amount)}
                  </p>
                  <p className="text-[9px] text-[#a3e635] capitalize">
                    {tx.status}
                  </p>
                </div>
              </div>
            ))}
            {recentPayments.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-[11px] text-zinc-400">No recent payments found</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
