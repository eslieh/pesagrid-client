"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { globalSearch } from "../../../../lib/Dashboard";
import Link from "next/link";

export default function Header({ user, profile, onAddWidget, onMenuClick }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      setIsOpen(true);
      try {
        const res = await globalSearch(query);
        setResults(res.items || []);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const getLink = (item) => {
    switch (item.type) {
      case 'payer': return `/dashboard/invoices?ledger_payer_id=${item.link_id}`;
      case 'invoice': return `/dashboard/invoices?id=${item.link_id}`;
      case 'transaction': return `/dashboard/transactions?psp_ref=${item.identifier}`;
      default: return "#";
    }
  };

  return (
    <header className="flex h-[68px] items-center justify-between border-b border-zinc-100 bg-white px-4 lg:px-8 relative z-[40]">
      {/* Left: Identity */}
      <div className="flex items-center gap-3 lg:gap-4">
        {/* Mobile Menu Toggle */}
        <button 
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-50 lg:hidden"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="hidden sm:flex h-10 w-10 rounded-xl bg-zinc-900 items-center justify-center text-[15px] font-black text-[#a3e635] shadow-sm">
          {profile?.business_name?.charAt(0) || "P"}
        </div>
        <div className="flex flex-col min-w-0">
          <h2 className="text-[14px] font-bold text-zinc-900 leading-tight truncate max-w-[120px] sm:max-w-none">
            {profile?.business_name || "My Business"}
          </h2>
          <p className="text-[11px] font-semibold text-zinc-400 mt-0.5 truncate max-w-[100px] sm:max-w-none">
            {user?.name || profile?.display_name || "Account Owner"}
          </p>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 lg:gap-6">
        {/* Search Container (Hidden on very small screens, or we can make it an icon) */}
        <div ref={searchRef} className="relative hidden md:block w-48 lg:w-72">
          <div className={`flex items-center gap-2.5 rounded-xl bg-zinc-50 border border-zinc-100 px-3.5 py-2 transition-all ${isOpen ? 'ring-2 ring-zinc-900/5 bg-white border-zinc-300' : ''}`}>
            {isLoading ? (
              <div className="h-3 w-3 border-2 border-zinc-200 border-t-zinc-900 animate-spin rounded-full" />
            ) : (
              <svg className="h-3.5 w-3.5 flex-shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
            <input
              type="text"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => query.length >= 2 && setIsOpen(true)}
              className="w-full bg-transparent text-[12px] font-bold text-zinc-900 outline-none placeholder:text-zinc-300"
            />
          </div>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute top-12 right-0 w-80 bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden py-2 max-h-[400px] overflow-y-auto"
              >
                {results.length === 0 ? (
                  <div className="px-6 py-8 text-center">
                    <p className="text-[11px] font-bold text-zinc-400">No results found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-50">
                    {results.map((item, idx) => (
                      <Link
                        key={`${item.type}-${item.link_id}-${idx}`}
                        href={getLink(item)}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 transition-colors group text-[12px]"
                      >
                        <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-zinc-100 font-bold text-zinc-600 group-hover:bg-zinc-900 group-hover:text-white transition-all">
                          {item.avatar_text || item.type[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-zinc-900 truncate">{item.title}</p>
                          <p className="text-[10px] font-medium text-zinc-400 truncate uppercase mt-0.5 tracking-tighter">{item.type}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Search Trigger (Icon only) */}
        <button className="md:hidden flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-50">
          <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Notification */}
          <button className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 transition-colors">
            <svg className="h-4.5 w-4.5" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>

          {/* Settings */}
          <button className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 transition-colors">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}