'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Trade } from '@/types';
import { ArrowLeft, Clock, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function TradesHistoryPage() {
  const trades = useQuery(api.trades.list);
  const isLoading = trades === undefined;
  const tradesData = trades || [];

  if (isLoading) return <div className="h-screen bg-[#080b0f] flex items-center justify-center text-[#00e5ff] font-mono tracking-widest uppercase animate-pulse">Fetching Trade History...</div>;

  return (
    <div className="min-h-screen bg-[#080b0f] text-[#c9d8e8] font-mono p-8 scrollbar-thin scrollbar-thumb-[#1e2a38] scrollbar-track-transparent">
      <Link href="/" className="inline-flex items-center gap-2 text-[#4a6278] hover:text-[#00e5ff] mb-8 transition-all hover:-translate-x-1 group">
        <ArrowLeft size={16} className="group-hover:text-[#00e5ff]" /> <span className="tracking-widest text-xs">BACK TO TERMINAL</span>
      </Link>

      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex justify-between items-end border-b border-[#1e2a38] pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-[6px] text-[#00e5ff] uppercase flex items-center gap-4 font-['Syne']">
              TRADE HISTORY
            </h1>
            <p className="text-[#4a6278] mt-2 tracking-widest text-xs uppercase opacity-70">Detailed Ledger of all Operations</p>
          </div>
          <div className="text-[10px] text-[#4a6278] tracking-widest uppercase bg-[#111820] border border-[#1e2a38] px-3 py-1">
            Total Records: <span className="text-[#00e5ff] font-bold">{trades.length}</span>
          </div>
        </header>

        <div className="bg-[#0d1117] border border-[#1e2a38] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#111820] text-[10px] text-[#4a6278] uppercase tracking-[2px] border-b border-[#1e2a38]">
                <th className="py-4 px-6 font-medium">Symbol</th>
                <th className="py-4 px-6 font-medium">Type</th>
                <th className="py-4 px-6 font-medium">Status</th>
                <th className="py-4 px-6 font-medium">Entry Zone</th>
                <th className="py-4 px-6 font-medium text-right">P&L</th>
                <th className="py-4 px-6 font-medium text-right">Execution Date</th>
              </tr>
            </thead>
            <tbody className="text-[12px]">
              {tradesData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-[#4a6278] tracking-[5px] uppercase opacity-50">No Trades Found</td>
                </tr>
              ) : (
                tradesData.map((t) => (
                  <tr key={t._id} className="border-b border-[#1e2a38]/30 hover:bg-white/[0.02] transition-colors group">
                    <td className="py-4 px-6 font-bold group-hover:text-[#00e5ff] transition-colors tracking-widest">{t.symbol}</td>
                    <td className="py-4 px-6">
                      <span className={cn(
                        "font-bold uppercase tracking-widest text-[10px]",
                        t.direction === 'LONG' ? "text-[#00ff88]" : "text-[#ff3a5c]"
                      )}>
                        {t.direction === 'LONG' ? '↑ LONG' : '↓ SHORT'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "uppercase text-[9px] font-bold border px-2 py-0.5 tracking-widest",
                          t.status === 'OPEN' ? "border-[#ffd54f]/30 text-[#ffd54f] bg-[#ffd54f]/5" :
                            t.status === 'WON' ? "border-[#00ff88]/30 text-[#00ff88] bg-[#00ff88]/5" : "border-[#ff3a5c]/30 text-[#ff3a5c] bg-[#ff3a5c]/5"
                        )}>{t.status}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-[#4a6278] tracking-widest">
                      {t.entryLow} {t.entryHigh && t.entryHigh !== t.entryLow ? `– ${t.entryHigh}` : ''}
                    </td>
                    <td className={cn(
                      "py-4 px-6 text-right font-bold tabular-nums tracking-widest",
                      (t.pnl || 0) >= 0 ? "text-[#00ff88]" : "text-[#ff3a5c]"
                    )}>
                      {(t.pnl || 0) >= 0 ? '+' : ''}{(t.pnl || 0).toFixed(2)}%
                    </td>
                    <td className="py-4 px-6 text-right text-[#4a6278] tabular-nums text-[10px]">
                      {new Date(t._creationTime).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
