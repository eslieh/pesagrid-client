"use client";

import { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Card, StatWidget, ProgressBar } from "../../../../pesagrid/components/dashboard/UI";
import { 
  getDashboardMetrics, 
  getCollectionTrends, 
  getPeakTimes, 
  getRecentPayments,
  getCollectionPointInsights
} from "../../../../../lib/Dashboard";
import { getCollectionPoints } from "../../../../../lib/CollectionPoint";

const barColor = {
  green: "bg-[#a3e635]",
  yellow: "bg-[#fdc649]",
  zinc: "bg-zinc-200", // Increased contrast from zinc-100
};

export default function CollectionPointDashboard({ params }) {
  const { id } = use(params);
  
  const today = new Date().toISOString().split('T')[0];
  const [datePreset, setDatePreset] = useState("today");
  const [dateRange, setDateRange] = useState({ 
    start: today, 
    end: today 
  });

  useEffect(() => {
    if (datePreset === "custom") return;
    const now = new Date();
    let start = new Date();
    if (datePreset === "today") start = now;
    else if (datePreset === "week") start.setDate(now.getDate() - 7);
    else if (datePreset === "month") start.setMonth(now.getMonth() - 1);
    else if (datePreset === "year") start.setFullYear(now.getFullYear() - 1);
    
    setDateRange({
      start: start.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0]
    });
  }, [datePreset]);

  const [metrics, setMetrics] = useState({
    total_collected: 0,
    total_matched: 0,
    total_unmatched: 0,
    outstanding_balances: 0
  });
  const [trends, setTrends] = useState([]);
  const [peakTimes, setPeakTimes] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [collectionPoint, setCollectionPoint] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Append time to satisfy backend ISO validation
        const startISO = `${dateRange.start}T00:00:00`;
        const endISO = `${dateRange.end}T23:59:59`;

        const [m, t, p, r, points, dashboardInsights] = await Promise.all([
          getDashboardMetrics(id, startISO, endISO).catch(() => ({})),
          getCollectionTrends("day", id, startISO, endISO).catch(() => ({ trends: [] })),
          getPeakTimes(id, startISO, endISO).catch(() => ({ peaks: [] })),
          getRecentPayments(id, 0, 10, startISO, endISO).catch(() => ({ items: [] })),
          getCollectionPoints().catch(() => []),
          getCollectionPointInsights(id).catch(() => null)
        ]);
        
        setMetrics(m);
        setTrends(t.trends || []);
        setPeakTimes(p.peaks || []);
        setRecentPayments(r.items || []);
        setInsights(dashboardInsights);
        
        const currentPoint = points?.items?.find(p => p.id === id);
        setCollectionPoint(currentPoint);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, dateRange]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "KES",
    }).format(val);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const chartBars = trends.map((item, i) => {
    let color = "zinc";
    if (i === trends.length - 2) color = "green"; 
    if (i === trends.length - 1) color = "yellow";

    const maxVal = Math.max(...trends.map(t => t.total), 1);
    const height = ((item.total || 0) / maxVal) * 80 + 10;

    return {
      h: height,
      color: color,
      label: item.period
    };
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-medium text-zinc-400 mb-1">
            <Link href="/dashboard/collection-points" className="hover:text-zinc-900 transition-colors">Collection Points</Link>
            <span>/</span>
            <span className="text-zinc-900">Dashboard</span>
          </div>
          <h1 className="text-[24px] font-bold tracking-tight text-zinc-900">
            {collectionPoint ? collectionPoint.name : "Loading..."}
          </h1>
          <p className="text-[12px] text-zinc-500">
            Account: <span className="font-bold text-zinc-700">{collectionPoint?.account_no}</span>
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          {loading && (
             <div className="flex items-center gap-2 text-[10px] font-bold text-[#a3e635] uppercase tracking-wider bg-[#a3e635]/10 px-3 py-1.5 rounded-full">
               <span className="h-3 w-3 border-2 border-[#a3e635] border-t-transparent animate-spin rounded-full" /> Syncing...
             </div>
          )}
          <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-zinc-200 shadow-sm transition-all h-[42px]">
            <select 
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value)}
              className="text-[12px] font-bold text-zinc-900 bg-transparent focus:outline-none cursor-pointer px-2"
            >
              <option value="today">Today</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
              <option value="year">Past Year</option>
              <option value="custom">Custom Range</option>
            </select>
            
            <AnimatePresence>
              {datePreset === "custom" && (
                <motion.div 
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="flex items-center gap-2 overflow-hidden whitespace-nowrap"
                >
                  <div className="h-6 w-[1px] bg-zinc-200 mx-1" />
                  <input 
                    type="date" 
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="text-[12px] font-bold text-zinc-900 focus:outline-none bg-transparent cursor-pointer w-[110px]"
                  />
                  <span className="text-zinc-300">-</span>
                  <input 
                    type="date" 
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="text-[12px] font-bold text-zinc-900 focus:outline-none bg-transparent cursor-pointer w-[110px]"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {loading && !metrics.total_collected ? (
        <div className="flex h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-[#a3e635]" />
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          
          {/* Header Widget */}
          {insights?.insight_text && (
            <div className="col-span-12">
              <div className="p-4 rounded-xl bg-zinc-900 flex items-center gap-3">
                <span className="text-xl">✨</span>
                <p className="text-[13px] font-medium text-zinc-100">{insights.insight_text}</p>
              </div>
            </div>
          )}

          {/* Audit Widget */}
          {insights?.compliance && insights.compliance.length > 0 && (
            <div className="col-span-12">
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
                <span className="text-xl mt-0.5">⚠️</span>
                <div className="flex-1">
                  <h4 className="text-[13px] font-bold text-red-800 mb-1">Requires Review ({insights.compliance.length} Anomalies)</h4>
                  <p className="text-[11px] text-red-600 mb-3">The following transactions breached your compliance threshold.</p>
                  <div className="space-y-2">
                    {insights.compliance.map(tx => (
                      <div key={tx.id} className="flex items-center justify-between p-2 rounded bg-white border border-red-100 text-[11px]">
                        <div>
                          <p className="font-bold text-zinc-900">{tx.payer_name} <span className="text-zinc-400 font-normal">({tx.psp_ref})</span></p>
                          <p className="text-zinc-500">{new Date(tx.ingested_at).toLocaleDateString()}</p>
                        </div>
                        <div className="font-black text-red-600">{formatCurrency(tx.amount)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Column */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            
            {/* KPI Row */}
            <div className="grid grid-cols-1 gap-6">
              <Card className="p-5">
                <StatWidget label="Total Volume" value={formatCurrency(metrics.total_collected || 0)} trend="Period" trendUp />
              </Card>
            </div>

             {/* Pace Widget */}
             {insights?.pace && (
              <Card className="p-6 overflow-hidden relative border-[#a3e635] ring-1 ring-[#a3e635]/20">
                <div className="absolute top-0 right-0 p-4">
                   <div className="text-[10px] font-black uppercase text-[#a3e635] tracking-widest bg-[#a3e635]/10 px-2 py-1 rounded">Pace Tracking</div>
                </div>
                <h3 className="text-[16px] font-bold text-zinc-900 mb-1">Goal Trajectory</h3>
                <p className="text-[11px] text-zinc-500 mb-6">Tracking {formatCurrency(insights.pace.total_collected)} against {formatCurrency(insights.pace.goal_amount)} target.</p>
                
                <div className="mb-4">
                  <div className="flex justify-between text-[11px] font-bold mb-2">
                    <span className="text-zinc-900">{insights.pace.progress_pct}% Completed</span>
                    <span className="text-zinc-400">{insights.pace.days_remaining} Days Remaining</span>
                  </div>
                  <ProgressBar pct={insights.pace.progress_pct} color="bg-[#a3e635]" />
                </div>
                
                <div className="flex items-center gap-4 mt-6 pt-4 border-t border-zinc-100">
                   <div className="flex-1">
                     <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">Required Daily Pace</p>
                     <p className="text-[14px] font-black text-zinc-900">{formatCurrency(insights.pace.daily_pace_required)}</p>
                   </div>
                   <div className="h-8 w-[1px] bg-zinc-200" />
                   <div className="flex-1">
                     <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">Actual Daily Pace</p>
                     <p className={`text-[14px] font-black ${insights.pace.daily_pace_actual >= insights.pace.daily_pace_required ? 'text-[#a3e635]' : 'text-red-500'}`}>
                        {formatCurrency(insights.pace.daily_pace_actual)}
                     </p>
                   </div>
                   <div className="h-8 w-[1px] bg-zinc-200" />
                   <div className="flex-1 text-right">
                     <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">Projected Trajectory</p>
                     <p className="text-[14px] font-black text-zinc-900">{formatCurrency(insights.pace.projected_total)}</p>
                   </div>
                </div>
              </Card>
            )}

            {/* Performance Chart */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-[16px] font-bold text-zinc-900">Performance Over Time</h3>
                  <p className="text-[11px] text-zinc-400">Trend of collections for the selected period</p>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#a3e635]" /> Daily Total</span>
                </div>
              </div>

              <div className="flex h-56 w-full items-end gap-2">
                {chartBars.map((bar, i) => (
                  <div key={i} className="group relative flex-1 h-full flex flex-col justify-end items-center gap-2">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${bar.h}%` }}
                      transition={{ duration: 0.7, delay: i * 0.03, ease: "easeOut" }}
                      className={`w-full rounded-t-xl ${barColor[bar.color]} transition-opacity group-hover:opacity-80`}
                    />
                    <span className="text-[9px] font-bold text-zinc-300">
                      {new Date(bar.label).toLocaleDateString("en-US", { weekday: "short" })}
                    </span>
                    
                    {/* Tooltip */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-zinc-900 text-white text-[10px] py-1.5 px-2.5 rounded-xl whitespace-nowrap z-20 pointer-events-none shadow-xl flex flex-col items-center">
                      <span className="text-zinc-400 text-[8px] font-bold uppercase tracking-wider">{new Date(bar.label).toLocaleDateString("en-US", { month: 'short', day: 'numeric' })}</span>
                      <span className="font-bold">{formatCurrency(trends[i].total || 0)}</span>
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 rotate-45" />
                    </div>
                  </div>
                ))}
                {chartBars.length === 0 && (
                  <div className="w-full h-full flex items-center justify-center text-zinc-300 text-[11px] italic">
                    No data available for this range
                  </div>
                )}
              </div>
            </Card>


          </div>

          {/* Right Column: Transactions & Peaks */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            
            {/* Mix Widget */}
            {insights?.channels && insights.channels.length > 0 && (
              <Card className="p-6">
                <h3 className="text-[16px] font-bold text-zinc-900 mb-1">Channel Mix</h3>
                <p className="text-[11px] text-zinc-400 mb-6">How payments are originating</p>
                <div className="space-y-4">
                  {insights.channels.map(chan => (
                    <div key={chan.psp_type} className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-zinc-900 capitalize">{chan.psp_type.replace('_', ' ')}</span>
                        <div className="text-right">
                          <span className="text-zinc-900">{formatCurrency(chan.total || 0)}</span>
                          <span className="text-zinc-400 ml-2">({chan.pct}%)</span>
                        </div>
                      </div>
                      <ProgressBar pct={chan.pct} color={chan.psp_type === 'mpesa' ? 'bg-[#a3e635]' : 'bg-indigo-400'} />
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Recent Payments Section */}
            <Card className="p-6 min-h-[400px]">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-[14px] font-bold text-zinc-900">Recent Transactions</h4>
                <Link 
                  href={`/dashboard/transactions?cp_id=${id}`}
                  className="text-[11px] font-bold text-[#a3e635] hover:underline"
                >
                  View All Hub
                </Link>
              </div>

              <div className="space-y-4">
                {recentPayments.map((tx, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 border border-zinc-100/50">
                    <div className="h-9 w-9 rounded-full flex-shrink-0 flex items-center justify-center text-[12px] font-bold text-zinc-400 bg-white border border-zinc-100">
                      {tx.payer_name ? tx.payer_name.charAt(0).toUpperCase() : "P"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-zinc-900 truncate">{tx.payer_name || tx.psp_ref}</p>
                      <p className="text-[10px] font-medium text-zinc-400">{formatDate(tx.ingested_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[12px] font-black text-zinc-900">+{formatCurrency(tx.amount)}</p>
                      <p className="text-[9px] font-bold text-[#a3e635] uppercase tracking-tight">{tx.status}</p>
                    </div>
                  </div>
                ))}
                {recentPayments.length === 0 && (
                  <div className="py-20 text-center">
                    <p className="text-[12px] text-zinc-400 italic">No transactions in this period</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Peak Times Card */}
            <Card className="p-6">
              <h4 className="text-[13px] font-bold text-zinc-900 mb-6">Peak Collection Hours</h4>
              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <div className="flex h-12 w-full gap-1 items-end">
                    {Array.from({ length: 24 }).map((_, hour) => {
                      const peak = peakTimes.find(p => p.hour === hour) || { total: 0 };
                      const maxPeakVal = Math.max(...peakTimes.map(p => p.total), 1);
                      const intensity = peak.total > 0 ? Math.max(0.1, peak.total / maxPeakVal) : 0;
                      
                      return (
                        <div key={hour} className="group relative flex-1 h-full flex items-end">
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "100%", opacity: 1 }}
                            transition={{ delay: hour * 0.02 }}
                            style={{ 
                              // Darker colors for higher intensity: scaling lightness from 54% (brand lime) down to ~20%
                              backgroundColor: intensity > 0 
                                ? `hsl(88, 63%, ${54 - (intensity * 34)}%)` 
                                : "#f4f4f5", 
                              borderRadius: '4px'
                            }}
                            className="w-full transition-all duration-300 group-hover:ring-2 group-hover:ring-[#a3e635] group-hover:ring-offset-1"
                          />
                          
                          {/* Tooltip */}
                          <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-zinc-900 text-white text-[10px] py-1.5 px-2.5 rounded-xl whitespace-nowrap z-30 pointer-events-none shadow-xl flex flex-col items-center">
                            <span className="text-zinc-400 text-[8px] font-bold uppercase tracking-wider">
                              {hour.toString().padStart(2, "0")}:00 - {(hour + 1).toString().padStart(2, "0")}:00
                            </span>
                            <span className="font-bold">{formatCurrency(peak.total)}</span>
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 rotate-45" />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Hour Labels */}
                  <div className="flex justify-between px-1 text-[9px] font-black text-zinc-300 uppercase tracking-widest">
                    <span>00:00</span>
                    <span>06:00</span>
                    <span>12:00</span>
                    <span>18:00</span>
                    <span>23:59</span>
                  </div>
                </div>

                {peakTimes.length === 0 && (
                  <p className="text-[11px] text-zinc-400 italic text-center py-4 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                    No collection patterns detected yet
                  </p>
                )}
              </div>
            </Card>

          </div>
        </div>
      )}
    </div>
  );
}
