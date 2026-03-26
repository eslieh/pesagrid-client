"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Card, StatWidget, ProgressBar } from "../../../../pesagrid/components/dashboard/UI";
import { 
  getDashboardMetrics, 
  getCollectionTrends, 
  getPeakTimes, 
  getRecentPayments 
} from "../../../../../lib/Dashboard";
import { getCollectionPoints } from "../../../../../lib/CollectionPoint";

const barColor = {
  green: "bg-[#a3e635]",
  yellow: "bg-[#fdc649]",
  zinc: "bg-zinc-200", // Increased contrast from zinc-100
};

export default function CollectionPointDashboard({ params }) {
  const { id } = use(params);
  
  // Date range state
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Append time to satisfy backend ISO validation
        const startISO = `${dateRange.start}T00:00:00`;
        const endISO = `${dateRange.end}T23:59:59`;

        const [m, t, p, r, points] = await Promise.all([
          getDashboardMetrics(id, startISO, endISO),
          getCollectionTrends("day", id, startISO, endISO),
          getPeakTimes(id, startISO, endISO),
          getRecentPayments(id, 0, 10, startISO, endISO),
          getCollectionPoints()
        ]);
        
        setMetrics(m);
        setTrends(t.trends || []);
        setPeakTimes(p.peaks || []);
        setRecentPayments(r.items || []);
        
        const currentPoint = points.find(p => p.id === id);
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
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-zinc-100 shadow-sm">
          <div className="flex flex-col gap-0.5 px-3">
            <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Start Date</label>
            <input 
              type="date" 
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="text-[11px] font-bold text-zinc-900 focus:outline-none bg-transparent"
            />
          </div>
          <div className="h-6 w-[1px] bg-zinc-100" />
          <div className="flex flex-col gap-0.5 px-3">
            <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">End Date</label>
            <input 
              type="date" 
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="text-[11px] font-bold text-zinc-900 focus:outline-none bg-transparent"
            />
          </div>
        </div>
      </div>

      {loading && !metrics.total_collected ? (
        <div className="flex h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-[#a3e635]" />
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          
          {/* Main Content Column */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            
            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-5">
                <StatWidget label="Total Volume" value={formatCurrency(metrics.total_collected)} trend="Period" trendUp />
              </Card>
              <Card className="p-5">
                <StatWidget label="Matched" value={formatCurrency(metrics.total_matched)} trend="Success" trendUp />
              </Card>
              <Card className="p-5">
                <StatWidget label="Outstanding" value={formatCurrency(metrics.outstanding_balances)} trend="Remaining" trendUp={false} />
              </Card>
            </div>

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

            {/* Collection Health & Efficiency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h4 className="text-[13px] font-bold text-zinc-900 mb-1">Matching Efficiency</h4>
                <p className="text-[11px] text-zinc-400 mb-6">Percentage of payments correctly matched to obligations</p>
                <div className="space-y-4">
                  <ProgressBar 
                    pct={metrics.total_collected > 0 ? (metrics.total_matched / metrics.total_collected) * 100 : 0} 
                    color="bg-[#a3e635]" 
                  />
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-zinc-400">{Math.round((metrics.total_matched / metrics.total_collected) * 100 || 0)}% Matched</span>
                    <span className="text-zinc-900">{formatCurrency(metrics.total_matched)}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h4 className="text-[13px] font-bold text-zinc-900 mb-1">Outstanding Ratio</h4>
                <p className="text-[11px] text-zinc-400 mb-6">Ratio of unpaid balances for this point</p>
                <div className="space-y-4">
                  <ProgressBar 
                    pct={metrics.total_collected > 0 ? (metrics.outstanding_balances / (metrics.total_collected + metrics.outstanding_balances)) * 100 : 0} 
                    color="bg-[#fdc649]" 
                  />
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-zinc-400">{Math.round((metrics.outstanding_balances / (metrics.total_collected + metrics.outstanding_balances)) * 100 || 0)}% Pending</span>
                    <span className="text-zinc-900">{formatCurrency(metrics.outstanding_balances)}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Right Column: Transactions & Peaks */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            
            {/* Recent Payments Section */}
            <Card className="p-6 min-h-[400px]">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-[14px] font-bold text-zinc-900">Recent Transactions</h4>
                <Link 
                  href={`/dashboard/transactions?collection_point_id=${id}`}
                  className="text-[11px] font-bold text-[#a3e635] hover:underline"
                >
                  View All
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
              <div className="space-y-4">
                {peakTimes.slice(0, 5).map((item, i) => {
                  const maxPeak = Math.max(...peakTimes.map(p => p.total), 1);
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-tight">
                        <span className="text-zinc-500">{item.hour}:00</span>
                        <span className="text-zinc-900">{formatCurrency(item.total)}</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-50 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(item.total / maxPeak) * 100}%` }}
                          className="h-full bg-[#fdc649]" 
                        />
                      </div>
                    </div>
                  );
                })}
                {peakTimes.length === 0 && (
                  <p className="text-[11px] text-zinc-300 italic py-4">No peak data available</p>
                )}
              </div>
            </Card>

          </div>
        </div>
      )}
    </div>
  );
}
