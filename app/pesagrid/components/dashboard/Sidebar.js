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

export default function Sidebar({ currentPath, profile, subscription, onLogout }) {
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
        <nav className="flex-1 space-y-6 relative overflow-y-auto no-scrollbar pb-6">
          
          {/* Section: Operations */}
          <div className="space-y-0.5">
            <p className="px-4 text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">Operations</p>
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
              label="Transactions"
              href="/dashboard/transactions"
              active={currentPath === "/dashboard/transactions"}
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={iconStroke} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              }
            />

            <SidebarItem
              label="Invoices & Ledger"
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
              active={currentPath === "/dashboard/payers" || currentPath.startsWith("/dashboard/payers/")}
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={iconStroke} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              }
            />
          </div>

          {/* Section: Infrastructure */}
          <div className="space-y-0.5">
            <p className="px-4 text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">Infrastructure</p>
            <SidebarItem
              label="Collection Points"
              href="/dashboard/collection-points"
              active={currentPath === "/dashboard/collection-points"}
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={iconStroke} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={iconStroke} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
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
              label="Notification Templates"
              href="/dashboard/notification-templates"
              active={currentPath === "/dashboard/notification-templates"}
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={iconStroke} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              }
            />
          </div>

          {/* Section: Management */}
          <div className="space-y-0.5">
            <p className="px-4 text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">Management</p>
            <SidebarItem
              label="Account Settings"
              href="/dashboard/account"
              active={currentPath === "/dashboard/account"}
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={iconStroke} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />

            <SidebarItem
              label="Billing & Plans"
              href="/dashboard/billing"
              active={currentPath.startsWith("/dashboard/billing")}
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={iconStroke} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              }
            />
          </div>

        </nav>

        {/* Bottom section (Logout) */}
        <div className="mt-4 border-t border-zinc-100 pt-4">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-colors group"
          >
            <svg className="h-4 w-4 group-hover:text-red-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={iconStroke} d="M11 19H6a2 2 0 01-2-2V7a2 2 0 012-2h5M16 15l4-4m0 0l-4-4m4 4H9" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
