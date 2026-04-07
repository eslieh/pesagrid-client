"use client";

import { motion } from "framer-motion";

export const badgeColors = {
  success: "bg-[#a3e635]/20 text-[#65a30d]",
  pending: "bg-amber-100 text-amber-600",
  failed: "bg-red-100 text-red-600",
  matched: "bg-[#a3e635]/20 text-[#65a30d]",
};

export default function TransactionItem({ tx, idx, formatCurrency, formatDate, getInitials }) {
  const confidence = tx.matched_confidence || 0;
  const confidenceColor = confidence >= 0.85 ? "text-[#65a30d] bg-[#a3e635]/10" : 
                        confidence >= 0.7 ? "text-amber-600 bg-amber-50" : 
                        "text-zinc-400 bg-zinc-50";

  return (
    <div className="group p-5 hover:bg-zinc-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6">
      
      {/* Avatar & Core Detail */}
      <div className="flex items-start gap-4 flex-1">
        <div className="h-12 w-12 rounded-full flex-shrink-0 flex items-center justify-center text-[14px] font-black text-zinc-500 bg-zinc-100/80 border border-zinc-200">
          {getInitials(tx.payer_name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-[14px] font-bold text-zinc-900 truncate">
              {tx.payer_name || tx.psp_ref || "Unknown Payer"}
            </h4>
            {confidence > 0 && (
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${confidenceColor}`}>
                {Math.round(confidence * 100)}% Match
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
             <span className="text-zinc-500">{tx.psp_type?.replace('_', ' ')}</span>
             <span className="h-1 w-1 rounded-full bg-zinc-300"/>
             <span>{tx.psp_ref}</span>
             {tx.phone && (
               <>
                 <span className="h-1 w-1 rounded-full bg-zinc-300"/>
                 <span className="tabular-nums">{tx.phone}</span>
               </>
             )}
          </div>

          {/* Enhanced Match Context */}
          {(tx.matched_payer || tx.matched_obligation) && (
            <div className="mt-3 p-3 rounded-2xl bg-zinc-50 border border-zinc-100 flex flex-col gap-1.5">
              {tx.matched_payer && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-zinc-300 uppercase tracking-tighter w-14">Payer</span>
                  <span className="text-[11px] font-bold text-indigo-600">{tx.matched_payer.payer_name}</span>
                  <span className="text-[10px] text-zinc-400 font-medium">({tx.matched_payer.account_no})</span>
                </div>
              )}
              {tx.matched_obligation && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-zinc-300 uppercase tracking-tighter w-14">Target</span>
                  <span className="text-[11px] font-bold text-zinc-700 leading-tight">{tx.matched_obligation.description}</span>
                  <span className="text-[10px] text-[#65a30d] font-bold bg-[#a3e635]/10 px-1.5 py-0.5 rounded ml-auto">
                    Bal: {formatCurrency(tx.matched_obligation.balance)}
                  </span>
                </div>
              )}
              {tx.match_reasons?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1 pt-1.5 border-t border-zinc-100">
                  {tx.match_reasons.map((reason, ri) => (
                    <span key={ri} className="text-[9px] font-medium text-zinc-400 px-1.5 py-0.5 bg-white border border-zinc-200 rounded">
                      {reason.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Right Side Metadata */}
      <div className="flex items-center justify-between md:justify-end gap-10 flex-1 md:flex-none">
        <div className="text-left md:text-right">
          <p className="text-[17px] font-black text-zinc-900 leading-tight">+{formatCurrency(tx.amount)}</p>
          <p className="text-[11px] font-medium text-zinc-500 mt-1">{formatDate(tx.ingested_at)}</p>
        </div>
        
        <div className="w-24 text-right">
          <span className={`inline-flex px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm border border-black/5 ${badgeColors[tx.status?.toLowerCase()] || badgeColors.pending}`}>
            {tx.status || "Pending"}
          </span>
        </div>
      </div>

    </div>
  );
}
