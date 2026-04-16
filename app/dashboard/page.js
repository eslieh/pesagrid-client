"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, StatWidget, ProgressBar } from "../pesagrid/components/dashboard/UI";
import { 
  getDashboardMetrics, 
  getCollectionTrends, 
  getPeakTimes, 
  getRecentPayments
} from "../../lib/Dashboard";
import { getTransactions } from "../../lib/Transaction";
import Link from "next/link";
import { 
  getNotificationSettings,
  updateNotificationSettings
} from "../../lib/Notifications";

/* ───────────────────────────────────────────────
   Bar chart colours to match the reference image
─────────────────────────────────────────────────*/
const barColor = {
  green: "bg-[#a3e635]",
  yellow: "bg-[#fdc649]",
  zinc: "bg-zinc-200",
};

const PERIODS = [
  { label: "1D", interval: "hour",  days: 0   }, // Restored 'hour' now that API support is added
  { label: "7D", interval: "day",   days: 7   },
  { label: "1M", interval: "day",   days: 30  },
  { label: "3M", interval: "week",  days: 90  },
  { label: "1Y", interval: "month", days: 365 },
];

function getDateRange(days) {
  const end = new Date();
  const start = new Date();
  if (days > 0) {
    start.setDate(end.getDate() - days);
  }
  
  const fmt = (d) => d.toISOString().split("T")[0] + "T00:00:00";
  // For 'today', we want to see up to now. For historical ranges, up to the end of the day.
  const endISO = days === 0 ? new Date(new Date().getTime() + (3*60*60*1000)).toISOString() : new Date().toISOString(); 
  
  return { startISO: fmt(start), endISO };
}

export default function DashboardPage() {
  const [activePeriod, setActivePeriod] = useState(PERIODS[0]); // default to Today
  const [metrics, setMetrics] = useState({
    total_collected: 0,
    total_matched: 0,
    total_unmatched: 0,
    outstanding_balances: 0
  });
  const [trends, setTrends] = useState([]);
  const [peakTimes, setPeakTimes] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [notifSettings, setNotifSettings] = useState({
    payment_notifications_enabled: false,
    payment_notification_channels: ["email"]
  });
  const [loading, setLoading] = useState(true);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [notifUpdating, setNotifUpdating] = useState(false);

  // Unmatched transactions feed state
  const UNMATCHED_PAGE_SIZE = 5;
  const [unmatchedTxns, setUnmatchedTxns] = useState([]);
  const [unmatchedTotal, setUnmatchedTotal] = useState(0);
  const [unmatchedSkip, setUnmatchedSkip] = useState(0);
  const [unmatchedLoading, setUnmatchedLoading] = useState(false);
  const [unmatchedLoadingMore, setUnmatchedLoadingMore] = useState(false);

  const fetchUnmatched = useCallback(async (isLoadMore = false) => {
    try {
      if (isLoadMore) setUnmatchedLoadingMore(true);
      else setUnmatchedLoading(true);
      const currentSkip = isLoadMore ? unmatchedSkip + UNMATCHED_PAGE_SIZE : 0;
      const res = await getTransactions({
        unmatched_only: true,
        sort: "date_desc",
        skip: currentSkip,
        limit: UNMATCHED_PAGE_SIZE,
      });
      if (isLoadMore) {
        setUnmatchedTxns(prev => [...prev, ...(res.items || [])]);
        setUnmatchedSkip(currentSkip);
      } else {
        setUnmatchedTxns(res.items || []);
        setUnmatchedSkip(0);
      }
      setUnmatchedTotal(res.total || 0);
    } catch (err) {
      console.error("Failed to fetch unmatched transactions:", err);
    } finally {
      setUnmatchedLoading(false);
      setUnmatchedLoadingMore(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unmatchedSkip]);

  // Initial load — fetch everything
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const { startISO, endISO } = getDateRange(PERIODS[0].days);
        const [m, t, p, r, ns] = await Promise.all([
          getDashboardMetrics(null, startISO, endISO),
          getCollectionTrends(PERIODS[0].interval, null, startISO, endISO),
          getPeakTimes(null, startISO, endISO),
          getRecentPayments(null, 0, 7, startISO, endISO),
          getNotificationSettings().catch(() => ({ 
            payment_notifications_enabled: false, 
            payment_notification_channels: ["email"] 
          }))
        ]);
        setMetrics(m);
        setTrends(t.trends || []);
        setPeakTimes(p.peaks || []);
        setRecentPayments(r.items || []);
        setNotifSettings(ns);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    fetchUnmatched(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleNotifications = async () => {
    try {
      setNotifUpdating(true);
      const updated = {
        ...notifSettings,
        payment_notifications_enabled: !notifSettings.payment_notifications_enabled
      };
      
      setNotifSettings(updated);
      await updateNotificationSettings(updated);
    } catch (err) {
      console.error("Failed to update notification settings:", err);
      setNotifSettings(notifSettings);
    } finally {
      setNotifUpdating(false);
    }
  };

  const handleToggleChannel = async (channel) => {
    try {
      setNotifUpdating(true);
      const isCurrentlyEnabled = (notifSettings.payment_notification_channels || []).includes(channel);
      let newChannels = [];
      if (isCurrentlyEnabled) {
        newChannels = notifSettings.payment_notification_channels.filter(c => c !== channel);
      } else {
        newChannels = [...(notifSettings.payment_notification_channels || []), channel];
      }
      
      const updated = {
        ...notifSettings,
        payment_notification_channels: newChannels
      };
      
      setNotifSettings(updated);
      await updateNotificationSettings(updated);
    } catch (err) {
      console.error("Failed to update channel:", err);
      setNotifSettings(notifSettings);
    } finally {
      setNotifUpdating(false);
    }
  };

  // Re-fetch trends + metrics when period changes (skip on initial mount)
  const isFirstRender = typeof window !== "undefined";
  useEffect(() => {
    if (loading) return; // don't double-fetch on mount
    async function fetchTrends() {
      try {
        setTrendsLoading(true);
        const { startISO, endISO } = getDateRange(activePeriod.days);
        const [m, t] = await Promise.all([
          getDashboardMetrics(null, startISO, endISO),
          getCollectionTrends(activePeriod.interval, null, startISO, endISO),
        ]);
        setMetrics(m);
        setTrends(t.trends || []);
      } catch (error) {
        console.error("Failed to fetch trends:", error);
      } finally {
        setTrendsLoading(false);
      }
    }
    fetchTrends();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePeriod]);

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

  // Format x-axis label based on interval
  const formatBarLabel = (dateStr) => {
    const d = new Date(dateStr);
    if (activePeriod.interval === "hour") {
      return d.toLocaleTimeString("en-US", { hour: "numeric", hour12: true });
    }
    if (activePeriod.interval === "month") {
      return d.toLocaleDateString("en-US", { month: "short" });
    }
    if (activePeriod.interval === "week" || activePeriod.days > 7) {
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    return d.toLocaleDateString("en-US", { weekday: "short" });
  };

  // Format tooltip date label
  const formatTooltipLabel = (dateStr) => {
    const d = new Date(dateStr);
    if (activePeriod.interval === "hour") {
      return d.toLocaleTimeString("en-US", { hour: "numeric", hour12: true });
    }
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: activePeriod.days > 90 ? "numeric" : undefined });
  };

  // Map trends to chart bars
  const chartBars = trends.map((item, i) => {
    let color = "zinc";
    if (i === trends.length - 2) color = "green";
    if (i === trends.length - 1) color = "yellow";

    const maxVal = Math.max(...trends.map(t => t.total), 1);
    const height = ((item.total || 0) / maxVal) * 80 + 10;

    return { h: height, color, label: item.period };
  });


  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const scrollContainer = document.querySelector(".overflow-y-auto");
    if (!scrollContainer) return;

    const handleScroll = () => {
      setIsScrolled(scrollContainer.scrollTop > 20);
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, []);

  if (loading && !metrics.total_collected) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-[#a3e635]" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Sticky Global Header */}
      <div className={`sticky top-0 z-30 w-full px-6 py-4 transition-all duration-300 ${
        isScrolled 
          ? "bg-white/80 backdrop-blur-xl border-b border-zinc-200/50 shadow-sm" 
          : "bg-transparent border-b-0"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <h1 className="text-[20px] font-bold tracking-tight text-zinc-900 leading-none">Dashboard</h1>
             {isScrolled && (
               <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-zinc-100 rounded-full">
                 <div className="h-1.5 w-1.5 rounded-full bg-[#a3e635] animate-pulse" />
                 <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{activePeriod.label} Overview</span>
               </div>
             )}
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Period selector pills */}
            <div className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-100 p-1">
              {PERIODS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setActivePeriod(p)}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                    activePeriod.label === p.label
                      ? "bg-white text-zinc-900 shadow-md scale-[1.05]"
                      : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            
            <div className="hidden lg:flex items-center gap-3 text-[10px] font-bold text-zinc-400 border-l border-zinc-200 pl-3">
              <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-[#fdc649]" /> Matched</span>
              <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-[#a3e635]" /> Collected</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Unmatched Transactions Action Banner ─────────────────────────────── */}
      <AnimatePresence>
        {!loading && metrics.total_unmatched > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="mx-6 mt-2 mb-0"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200/80 shadow-sm">
              <div className="flex items-center gap-3">
                {/* Pulsing warning dot */}
                <div className="relative flex-shrink-0">
                  <div className="h-8 w-8 rounded-xl bg-amber-100 flex items-center justify-center">
                    <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-400 border-2 border-amber-50 animate-pulse" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-amber-900 leading-tight">
                    {metrics.total_unmatched} unmatched {metrics.total_unmatched === 1 ? "transaction requires" : "transactions require"} your attention
                  </p>
                  <p className="text-[10px] text-amber-600/80 mt-0.5">
                    Payments received but not linked to any payer or obligation — review and match them to keep your books clean.
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/transactions?status=raw"
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm"
              >
                Review Now
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-12 gap-5 p-6 pt-2">
        {/* ── Column 1: Left ─────────────────────────── */}
        <div className="col-span-12 lg:col-span-5 space-y-5">
          {/* Balance overview chart */}
          <Card noPadding className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div className="min-w-0 flex-1">
                <h3 className="text-[20px] sm:text-[28px] font-bold text-zinc-900 leading-none tracking-tighter truncate">
                  {formatCurrency(metrics.total_collected)}
                </h3>
                <p className="text-[8px] font-bold text-zinc-400 mt-2 uppercase tracking-widest leading-relaxed">
                  Total Collection Overview
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-500`}>
                      {activePeriod.label}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-900">
                      {Math.round((metrics.total_matched / (metrics.total_collected || 1)) * 100)}% Matched
                    </span>
                  </div>
                  <p className="text-[9px] text-zinc-300 font-medium">Updated just now</p>
              </div>
            </div>

          {/* Chart */}
          <div className="relative flex h-44 w-full items-end gap-1.5">
            {trendsLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-xl z-10">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-[#a3e635]" />
              </div>
            )}
            {chartBars.map((bar, i) => (
              <div key={i} className="group relative flex-1 h-full flex flex-col justify-end items-center gap-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${bar.h}%` }}
                  transition={{ duration: 0.7, delay: i * 0.06, ease: "easeOut" }}
                  className={`w-full rounded-t-md ${barColor[bar.color]} transition-opacity group-hover:opacity-80`}
                />
                
                {/* Tooltip */}
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-zinc-900 text-white text-[10px] py-1.5 px-2.5 rounded-xl whitespace-nowrap z-20 pointer-events-none shadow-xl flex flex-col items-center">
                  <span className="text-zinc-400 text-[8px] font-bold uppercase tracking-wider">{formatTooltipLabel(bar.label)}</span>
                  <span className="font-bold">{formatCurrency(trends[i].total || 0)}</span>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 rotate-45" />
                </div>
              </div>
            ))}
            {chartBars.length === 0 && (
              <div className="w-full h-full flex items-center justify-center text-zinc-300 text-[11px]">
                No trend data available
              </div>
            )}
          </div>
          {/* X-axis labels */}
          <div className="mt-2 flex justify-between px-0 text-[10px] font-medium text-zinc-300">
            {chartBars.map((bar, i) => (
              <span key={i} className="flex-1 text-center">
                {formatBarLabel(bar.label)}
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
          <Card className="py-5 px-5 col-span-2">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h4 className="text-[13px] font-semibold text-zinc-900 leading-none">Peak Collection Hours</h4>
                <p className="text-[11px] text-zinc-400 mt-1.5">Highest volume windows throughout the day</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex flex-col gap-3">
                <div className="flex h-12 w-full gap-1 items-end">
                  {Array.from({ length: 24 }).map((_, i) => {
                    // Shift the lookup: slot i (Local EAT) corresponds to (i - 3) UTC
                    const utcHour = (i - 3 + 24) % 24;
                    const peak = peakTimes.find(p => p.hour === utcHour) || { total: 0 };
                    const maxPeakVal = Math.max(...peakTimes.map(p => p.total), 1);
                    const intensity = peak.total > 0 ? Math.max(0.1, peak.total / maxPeakVal) : 0;
                    
                    return (
                      <div key={i} className="group relative flex-1 h-full flex items-end">
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "100%", opacity: 1 }}
                          transition={{ delay: i * 0.02 }}
                          style={{ 
                            // Darker colors for higher intensity: scaling lightness from 54% (brand lime) down to ~20%
                            backgroundColor: intensity > 0 
                              ? `hsl(88, 63%, ${54 - (intensity * 34)}%)` 
                              : "#f4f4f5", 
                            borderRadius: '4px'
                          }}
                          className="w-full transition-all duration-300 group-hover:ring-2 group-hover:ring-[#a3e635] group-hover:ring-offset-1"
                        />
                        
                        {/* Tooltip (Local EAT) */}
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-zinc-900 text-white text-[10px] py-1.5 px-2.5 rounded-xl whitespace-nowrap z-30 pointer-events-none shadow-xl flex flex-col items-center">
                          <span className="text-zinc-400 text-[8px] font-bold uppercase tracking-wider">
                            {i.toString().padStart(2, "0")}:00 - {(i + 1).toString().padStart(2, "0")}:00
                          </span>
                          <span className="font-bold">{formatCurrency(peak.total)}</span>
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 rotate-45" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Hour Labels (Local EAT) */}
                <div className="flex justify-between px-1 text-[9px] font-black text-zinc-300 uppercase tracking-widest">
                  <span>00:00</span>
                  <span>06:00</span>
                  <span>12:00</span>
                  <span>18:00</span>
                  <span>24:00</span>
                </div>
              </div>

              {peakTimes.length === 0 && (
                <p className="text-[11px] text-zinc-400 italic text-center py-4 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                  No collection patterns detected yet
                </p>
              )}
            </div>
          </Card>

          <div className="col-span-2 grid grid-cols-2 gap-5">
            {/* Optimization Tips */}
            <Card className="py-5 px-5">
              <p className="text-[11px] text-zinc-400 mb-2">💡</p>
              <h4 className="text-[12px] font-semibold text-zinc-900 leading-snug">
                Fleet Performance Tip
              </h4>
              <p className="mt-1 text-[10px] text-zinc-400 leading-relaxed">
                Your peak collection period is usually between 10 AM and 12 PM. Ensure all collection points are active.
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
      <div className="col-span-12 lg:col-span-3 space-y-5 lg:pt-12">
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
      <div className="col-span-12 lg:col-span-4 space-y-5 lg:pt-12">
        {/* Notification Preferences */}
        <Card className="py-5 px-5">
           <div className="flex items-center justify-between mb-4">
            <h4 className="text-[13px] font-semibold text-zinc-900">Activity Alerts</h4>
            <div className={`h-2 w-2 rounded-full animate-pulse ${notifSettings.payment_notifications_enabled ? 'bg-[#a3e635]' : 'bg-zinc-300'}`} />
          </div>
          
          <div className="space-y-3">
            {/* Global Switch */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-100 transition-all hover:bg-white hover:shadow-sm">
               <div className="flex-1 pr-4">
                  <p className="text-[11px] font-bold text-zinc-900 leading-tight">Payments Flow</p>
                  <p className="text-[9px] text-zinc-400 mt-1 leading-relaxed capitalize">
                    {notifSettings.payment_notifications_enabled ? "Alerts are currently live" : "Alerts are currently muted"}
                  </p>
               </div>
               <button 
                  onClick={handleToggleNotifications}
                  disabled={notifUpdating}
                  className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none ${notifSettings.payment_notifications_enabled ? 'bg-[#a3e635]' : 'bg-zinc-200'}`}
               >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${notifSettings.payment_notifications_enabled ? 'translate-x-5.5' : 'translate-x-1'}`} />
               </button>
            </div>

            {/* Channel Options */}
            <AnimatePresence>
              {notifSettings.payment_notifications_enabled && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-2"
                >
                  {/* Email Channel */}
                  <div className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-dashed border-zinc-200 hover:border-zinc-400 transition-all">
                    <div className="flex items-center gap-2">
                      <div className={`h-6 w-6 rounded-lg flex items-center justify-center ${notifSettings.payment_notification_channels.includes('email') ? 'bg-[#a3e635]/10 text-[#6bb800]' : 'bg-zinc-100 text-zinc-400'}`}>
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-bold text-zinc-700">Email Alerts</span>
                    </div>
                    <button 
                      onClick={() => handleToggleChannel('email')}
                      disabled={notifUpdating}
                      className={`h-4 w-4 rounded border-2 transition-all flex items-center justify-center ${notifSettings.payment_notification_channels.includes('email') ? 'bg-[#6bb800] border-[#6bb800]' : 'bg-transparent border-zinc-200 hover:border-zinc-300'}`}
                    >
                      {notifSettings.payment_notification_channels.includes('email') && (
                        <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor font-black">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* SMS Channel */}
                  <div className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-dashed border-zinc-200 hover:border-zinc-400 transition-all">
                    <div className="flex items-center gap-2">
                      <div className={`h-6 w-6 rounded-lg flex items-center justify-center ${notifSettings.payment_notification_channels.includes('sms') ? 'bg-[#a3e635]/10 text-[#6bb800]' : 'bg-zinc-100 text-zinc-400'}`}>
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-bold text-zinc-700">SMS Alerts</span>
                    </div>
                    <button 
                      onClick={() => handleToggleChannel('sms')}
                      disabled={notifUpdating}
                      className={`h-4 w-4 rounded border-2 transition-all flex items-center justify-center ${notifSettings.payment_notification_channels.includes('sms') ? 'bg-[#6bb800] border-[#6bb800]' : 'bg-transparent border-zinc-200 hover:border-zinc-300'}`}
                    >
                      {notifSettings.payment_notification_channels.includes('sms') && (
                        <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="mt-4 text-[9px] text-zinc-400 leading-relaxed italic border-t border-zinc-50 pt-3">
             <span className="text-amber-600 font-bold">Billing:</span> System notification charges apply for SMS and high-frequency alerts.
          </p>
        </Card>

        {/* ── Unmatched Transactions Feed ─────────── */}
        <Card className="py-5 px-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-[13px] font-semibold text-zinc-900 flex items-center gap-2">
                Needs Action
                {unmatchedTotal > 0 && (
                  <span className="inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full bg-amber-400 text-white text-[8px] font-black">
                    {unmatchedTotal}
                  </span>
                )}
              </h4>
              <p className="text-[10px] text-zinc-400 mt-0.5">Unmatched payments pending review</p>
            </div>
            <Link
              href="/dashboard/transactions?unmatched_only=true"
              className="flex items-center gap-1 rounded-lg border border-zinc-100 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-500 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700 transition-all"
            >
              All
              <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Feed */}
          {unmatchedLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-zinc-100/60 animate-pulse" />
              ))}
            </div>
          ) : unmatchedTxns.length === 0 ? (
            <div className="py-8 text-center flex flex-col items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-[#a3e635]/10 flex items-center justify-center text-xl">✅</div>
              <p className="text-[11px] text-zinc-400">All caught up — no pending matches</p>
            </div>
          ) : (
            <div className="space-y-2">
              {unmatchedTxns.map((tx, i) => (
                <Link
                  key={tx.id || i}
                  href={`/dashboard/transactions`}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-amber-100 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-200 transition-all group"
                >
                  {/* Avatar */}
                  <div className="h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black text-amber-600 bg-amber-100 border border-amber-200">
                    {(tx.payer_name || tx.psp_type || "?").charAt(0).toUpperCase()}
                  </div>
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-zinc-900 truncate">
                      {tx.payer_name || tx.psp_ref || "Unknown"}
                    </p>
                    <p className="text-[9px] text-zinc-400 font-medium truncate">
                      {tx.psp_type?.replace("_", " ")} · {tx.psp_ref || tx.account_no || "—"}
                    </p>
                  </div>
                  {/* Amount */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-[12px] font-black text-zinc-900">+{formatCurrency(tx.amount)}</p>
                    <p className="text-[8px] font-bold text-amber-500 uppercase tracking-tight">
                      {new Date(tx.ingested_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                    </p>
                  </div>
                  {/* Arrow hint */}
                  <svg className="h-3 w-3 text-zinc-300 group-hover:text-amber-400 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}

              {/* Load More */}
              {unmatchedTxns.length < unmatchedTotal && (
                <button
                  onClick={() => fetchUnmatched(true)}
                  disabled={unmatchedLoadingMore}
                  className="w-full mt-1 py-2 rounded-xl border border-dashed border-amber-200 text-[10px] font-bold text-amber-600 hover:bg-amber-50 transition-all disabled:opacity-50"
                >
                  {unmatchedLoadingMore ? "Loading..." : `Load more (${unmatchedTotal - unmatchedTxns.length} remaining)`}
                </button>
              )}
            </div>
          )}
        </Card>

        {/* Transaction history */}
        <Card className="py-5 px-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[13px] font-semibold text-zinc-900">Recent Payments</h4>
            <Link href="/dashboard/transactions" className="flex items-center gap-1 rounded-lg border border-zinc-100 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-500">
              Recent
              <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Link>
          </div>

          <div className="flex justify-between text-[10px] font-medium text-zinc-300 mb-3 px-0.5">
            <span>Payer / Ref</span>
            <span>Amount</span>
          </div>

          <div className="space-y-3.5">
            {recentPayments.map((tx, i) => {
              const confidence = tx.matched_confidence || 0;
              const confidenceColor = confidence >= 0.85 ? "text-[#65a30d] bg-[#a3e635]/10" : 
                                    confidence >= 0.7 ? "text-amber-600 bg-amber-50" : 
                                    "text-zinc-400 bg-zinc-50";

              return (
                <div key={i} className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black text-white bg-zinc-100 border border-zinc-200">
                      <span className="text-zinc-400">
                        {tx.payer_name ? tx.payer_name.charAt(0) : (tx.psp_type?.charAt(0) || "P")}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[11px] font-bold text-zinc-900 truncate">
                          {tx.payer_name || tx.psp_ref}
                        </p>
                        {confidence > 0 && (
                          <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${confidenceColor}`}>
                            {Math.round(confidence * 100)}%
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] text-zinc-400 font-medium">Ref: {tx.psp_ref}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[11px] font-black text-zinc-900 leading-none">
                        +{formatCurrency(tx.amount)}
                      </p>
                      <p className="text-[9px] text-[#6bb800] font-bold mt-1 uppercase tracking-tighter">
                        {tx.status}
                      </p>
                    </div>
                  </div>

                  {/* Match Context for Dashboard */}
                  {tx.matched_obligation && (
                    <div className="ml-12 p-2 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center gap-2">
                      <span className="text-[8px] font-black text-zinc-300 uppercase tracking-tighter">Matched</span>
                      <span className="text-[9px] font-bold text-zinc-600 truncate">{tx.matched_obligation.description}</span>
                    </div>
                  )}
                </div>
              );
            })}
            {recentPayments.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-[11px] text-zinc-400">No recent payments found</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
    </div>
  );
}
