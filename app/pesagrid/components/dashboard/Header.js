"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { globalSearch } from "../../../../lib/Dashboard";
import Link from "next/link";

export default function Header({ user, onAddWidget }) {
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
    <header className="flex h-[68px] items-center justify-between border-b border-zinc-100 bg-white px-8 relative z-[100]">
      {/* Search Container */}
      <div ref={searchRef} className="relative w-96">
        <div className={`flex items-center gap-2.5 rounded-2xl bg-zinc-50 border border-zinc-100 px-4 py-2.5 transition-all ${isOpen ? 'ring-2 ring-zinc-900/5 bg-white border-zinc-300' : ''}`}>
          {isLoading ? (
            <div className="h-3.5 w-3.5 border-2 border-zinc-200 border-t-zinc-900 animate-spin rounded-full" />
          ) : (
            <svg className="h-3.5 w-3.5 flex-shrink-0 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
          <input
            type="text"
            placeholder="Search payers, invoices, codes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setIsOpen(true)}
            className="w-full bg-transparent text-[13px] font-medium text-zinc-700 outline-none placeholder:text-zinc-300"
          />
        </div>

        {/* Results Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="absolute top-14 left-0 w-full bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden py-2 max-h-[480px] overflow-y-auto"
            >
              {results.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-[12px] font-medium text-zinc-400">No results found for "{query}"</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-50">
                  {results.map((item, idx) => (
                    <Link
                      key={`${item.type}-${item.link_id}-${idx}`}
                      href={getLink(item)}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-zinc-50 transition-colors group"
                    >
                      <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-zinc-100 text-[12px] font-bold text-zinc-600 group-hover:bg-zinc-900 group-hover:text-white transition-all">
                        {item.avatar_text || item.type[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-zinc-900 truncate">{item.title}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                            item.type === 'payer' ? 'bg-blue-50 text-blue-600' :
                            item.type === 'invoice' ? 'bg-purple-50 text-purple-600' :
                            'bg-orange-50 text-orange-600'
                          }`}>
                            {item.type}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-zinc-400 truncate">{item.subtitle || item.identifier}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                         {item.meta?.status && (
                           <span className="text-[9px] font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded uppercase">
                             {item.meta.status}
                           </span>
                         )}
                         <svg className="h-3 w-3 text-zinc-300 group-hover:text-zinc-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                         </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Notification */}
        <button className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 transition-colors">
          <svg className="h-4.5 w-4.5" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>

        {/* Settings */}
        <button className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 transition-colors">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* User pill */}
        <div className="flex items-center gap-2.5 rounded-full border border-zinc-100 bg-white px-3 py-1.5">
          <div className="h-7 w-7 rounded-full overflow-hidden bg-zinc-100 flex-shrink-0">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=e4e4e7&color=52525b&size=64`}
              className="h-full w-full object-cover"
              alt={user?.name || "User"}
            />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[12px] font-semibold text-zinc-900">{user?.name || "Michael Johnson"}</span>
            <span className="text-[10px] text-zinc-400">{user?.email || "m.johnson@lines.com"}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
