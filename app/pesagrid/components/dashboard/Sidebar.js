"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const iconStroke = 1.5;

function SidebarItem({ icon, label, href, active = false, badge, onClick }) {
  const cls = `group flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-[13px] font-medium transition-colors ${
    active ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-700"
  }`;

  const inner = (
    <>
      {active && (
        <motion.div
          layoutId="sidebarActive"
          className="absolute left-0 h-5 w-[3px] rounded-r-full bg-zinc-900"
        />
      )}
      <span className={`flex-shrink-0 transition-colors ${active ? "text-zinc-900" : "text-zinc-400 group-hover:text-zinc-700"}`}>
        {icon}
      </span>
      <span className="flex-1 text-left">{label}</span>
      {badge != null && (
        <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-zinc-900 px-1 text-[9px] font-bold text-white">
          {badge}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`relative block w-full`}>
        <div className={cls}>{inner}</div>
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={`relative ${cls}`}>
      {inner}
    </button>
  );
}

export default function Sidebar({ currentPath, profile, onLogout }) {
  const plan = profile?.meta?.plan || profile?.plan || "Free Plan";

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-60 border-r border-zinc-100 bg-white">
      <div className="relative flex h-full flex-col py-6 px-4">
        {/* Logo */}
        <div className="mb-8 px-2">
          <Link href="/dashboard" className="text-[25px] font-black tracking-tight text-zinc-900">
            PesaGrid
          </Link>
        </div>

        {/* Main nav */}
        <nav className="flex-1 space-y-0.5 relative">
          <SidebarItem
            label="Dashboard"
            href="/dashboard"
            active={currentPath === "/dashboard"}
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={iconStroke} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            }
          />

          <SidebarItem
            label="Invoices"
            href="/dashboard/invoices"
            active={currentPath === "/dashboard/invoices"}
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={iconStroke} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />

          <SidebarItem
            label="Payers & Groups"
            href="/dashboard/payers"
            active={currentPath === "/dashboard/payers"}
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={iconStroke} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />

          <SidebarItem
            label="Payment Channels"
            href="/dashboard/payment-channel"
            active={currentPath === "/dashboard/payment-channel"}
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={iconStroke} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            }
          />

          <SidebarItem
            label="Account"
            href="/dashboard/account"
            active={currentPath === "/dashboard/account"}
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={iconStroke} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />

          <SidebarItem
            label="Notification Templates"
            href="/dashboard/notification-templates"
            active={currentPath === "/dashboard/notification-templates"}
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={iconStroke} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            }
          />
        </nav>

        {/* Bottom section */}
        <div className="space-y-0.5 relative">
          <SidebarItem
            label="Support"
            href="/dashboard/support"
            active={currentPath === "/dashboard/support"}
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={iconStroke} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />
        </div>

        {/* Upgrade / Plan card */}
        <div className="mt-4 space-y-3">
          <div className="relative rounded-2xl bg-zinc-900 p-5 text-white overflow-hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 mb-3">
              <svg className="h-3.5 w-3.5 text-[#a3e635]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-[12px] font-bold text-white leading-snug">Upgrade to Pro!</p>
            <p className="mt-1 text-[11px] text-zinc-400 leading-relaxed">
              Full financial insights with analytics and graphs.
            </p>
            <div className="mt-1.5 mb-3">
              <span className="text-[10px] font-semibold text-[#a3e635] uppercase tracking-wider">
                Current: {plan}
              </span>
            </div>
            <button className="w-full rounded-xl bg-white py-2 text-[11px] font-bold text-zinc-900 transition-all hover:bg-zinc-100 active:scale-95">
              Upgrade now
            </button>
          </div>

          <button
            onClick={onLogout}
            className="flex w-full items-center gap-2 px-2 py-2 text-[12px] font-medium text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={iconStroke} d="M11 19H6a2 2 0 01-2-2V7a2 2 0 012-2h5M16 15l4-4m0 0l-4-4m4 4H9" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
