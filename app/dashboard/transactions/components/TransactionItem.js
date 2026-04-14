"use client";

import { motion } from "framer-motion";

export const badgeColors = {
  success: "bg-[#a3e635]/20 text-[#65a30d]",
  pending: "bg-amber-100 text-amber-600",
  failed: "bg-red-100 text-red-600",
  matched: "bg-[#a3e635]/20 text-[#65a30d]",
};

export default function TransactionItem({ tx, idx, formatCurrency, formatDate, getInitials, onMatch }) {
  const confidence = tx.matched_confidence || 0;
  const confidenceColor = confidence >= 0.85 ? "text-[#65a30d] bg-[#a3e635]/10" : 
                        confidence >= 0.7 ? "text-amber-600 bg-amber-50" : 
                        "text-zinc-400 bg-zinc-50";

  const isMatched = tx.status?.toLowerCase() === "matched" || tx.status?.toLowerCase() === "categorized";

  return (
    <div className="group p-4 sm:p-5 hover:bg-zinc-50/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
      
      {/* Avatar & Core Detail */}
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full flex-shrink-0 flex items-center justify-center text-[12px] sm:text-[14px] font-black text-zinc-500 bg-zinc-100/80 border border-zinc-200">
          {getInitials(tx.payer_name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-[14px] font-bold text-zinc-900 truncate max-w-[150px] sm:max-w-none">
              {tx.payer_name || tx.psp_ref || "Unknown Payer"}
            </h4>
            {confidence > 0 && (
              <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-1.5 sm:py-0.5 rounded ${confidenceColor}`}>
                {Math.round(confidence * 100)}% Match
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 mt-1 text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
             <span className="text-zinc-500">{tx.psp_type?.replace('_', ' ')}</span>
             <span className="hidden sm:inline h-1 w-1 rounded-full bg-zinc-300"/>
             <span className="truncate max-w-[100px] sm:max-w-none">{tx.psp_ref}</span>
             {tx.phone && (
               <>
                 <span className="h-1 w-1 rounded-full bg-zinc-300"/>
                 <span className="tabular-nums">{tx.phone}</span>
               </>
             )}
          </div>

          {/* Enhanced Match Context */}
          {(tx.matched_payer || tx.matched_obligation) && (
            <div className="mt-2 sm:mt-3 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-zinc-50 border border-zinc-100 flex flex-col gap-1.5">
              {tx.matched_payer && (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-zinc-300 uppercase tracking-tighter w-12 sm:w-14">Payer</span>
                  <span className="text-[10px] sm:text-[11px] font-bold text-indigo-600 truncate">{tx.matched_payer.payer_name}</span>
                </div>
              )}
              {tx.matched_obligation && (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-zinc-300 uppercase tracking-tighter w-12 sm:w-14">Target</span>
                  <span className="text-[10px] sm:text-[11px] font-bold text-zinc-700 leading-tight truncate">{tx.matched_obligation.description}</span>
                  <span className="text-[9px] sm:text-[10px] text-[#65a30d] font-bold bg-[#a3e635]/10 px-1.5 py-0.5 rounded ml-auto">
                    {formatCurrency(tx.matched_obligation.balance)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Side Metadata */}
      <div className="flex items-center justify-between md:justify-end gap-4 sm:gap-10 mt-1 md:mt-0">
        <div className="text-left md:text-right shrink-0">
          <p className="text-[15px] sm:text-[17px] font-black text-zinc-900 leading-tight">+{formatCurrency(tx.amount)}</p>
          <p className="text-[10px] sm:text-[11px] font-medium text-zinc-500 mt-0.5 sm:mt-1">{formatDate(tx.ingested_at)}</p>
        </div>
        
        <div className="flex flex-col items-end gap-1.5 sm:gap-2 shrink-0">
          <span className={`inline-flex px-2 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm border border-black/5 ${badgeColors[tx.status?.toLowerCase()] || badgeColors.pending}`}>
            {tx.status || "Pending"}
          </span>
          <button 
            onClick={() => onMatch(tx)}
            className="text-[9px] sm:text-[10px] font-bold text-zinc-400 hover:text-zinc-900 uppercase tracking-tight underline underline-offset-4 transition-all"
          >
            {isMatched ? "Rematch" : "Match Manual"}
          </button>
        </div>
      </div>

    </div>
  );
}
