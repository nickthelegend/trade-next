'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trade } from '@/types';
import { ArrowLeft, Clock, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function TradesHistoryPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrades() {
      const { data } = await supabase
        .from('trades')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setTrades(data as Trade[]);
      setLoading(false);
    }
    fetchTrades();
  }, []);

  if (loading) return <div className="h-screen bg-[#080b0f] flex items-center justify-center text-[#00e5ff] font-mono tracking-widest uppercase">Fetching Trade History...</div>;

  return (
    <div className="min-h-screen bg-[#080b0f] text-[#c9d8e8] font-mono p-8">
      <Link href="/" className="flex items-center gap-2 text-[#4a6278] hover:text-[#00e5ff] mb-8 transition-colors">
        <ArrowLeft size={16} /> BACK TO TERMINAL
      </Link>

      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex justify-between items-end border-b border-[#1e2a38] pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-[4px] text-[#00e5ff] uppercase flex items-center gap-4">
               TRADE HISTORY
            </h1>
            <p className="text-[#4a6278] mt-2 tracking-widest text-xs uppercase">Detailed Ledger of all Operations</p>
          </div>
          <div className="text-[10px] text-[#4a6278] tracking-widest uppercase">
            Total Records: <span className="text-[#00e5ff]">{trades.length}</span>
          </div>
        </header>

        <div className="bg-[#0d1117] border border-[#1e2a38] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#111820] text-[10px] text-[#4a6278] uppercase tracking-[2px] border-b border-[#1e2a38]">
                <th className="py-4 px-6 font-medium">Symbol</th>
                <th className="py-4 px-6 font-medium">Type</th>
                <th className="py-4 px-6 font-medium">Status</th>
                <th className="py-4 px-6 font-medium">Entry Price</th>
                <th className="py-4 px-6 font-medium text-right">P&L</th>
                <th className="py-4 px-6 font-medium text-right">Execution Date</th>
              </tr>
            </thead>
            <tbody className="text-[12px]">
              {trades.map((t) => (
                <tr key={t.id} className="border-b border-[#1e2a38]/30 hover:bg-white/[0.01] transition-colors group">
                  <td className="py-4 px-6 font-bold group-hover:text-[#00e5ff] transition-colors">{t.symbol}</td>
                  <td className="py-4 px-6">
                    <span className={cn(
                        "font-bold uppercase",
                        t.direction === 'LONG' ? "text-[#00ff88]" : "text-[#ff3a5c]"
                    )}>
                        {t.direction === 'LONG' ? '↑ LONG' : '↓ SHORT'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                        {t.status === 'open' && <Clock size={14} className="text-[#ffd54f]" />}
                        {t.status === 'success' && <CheckCircle2 size={14} className="text-[#00ff88]" />}
                        {t.status === 'failed' && <XCircle size={14} className="text-[#ff3a5c]" />}
                        <span className={cn(
                            "uppercase text-[10px] border px-2 py-0.5",
                            t.status === 'open' ? "border-[#ffd54f]/30 text-[#ffd54f]" :
                            t.status === 'success' ? "border-[#00ff88]/30 text-[#00ff88]" : "border-[#ff3a5c]/30 text-[#ff3a5c]"
                        )}>{t.status}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-[#4a6278]">{t.entry_low.toFixed(4)}</td>
                  <td className={cn(
                      "py-4 px-6 text-right font-bold tabular-nums",
                      (t.pnl || 0) >= 0 ? "text-[#00ff88]" : "text-[#ff3a5c]"
                  )}>
                    {(t.pnl || 0) >= 0 ? '+' : ''}{(t.pnl || 0).toFixed(2)}%
                  </td>
                  <td className="py-4 px-6 text-right text-[#4a6278] tabular-nums">
                    {new Date(t.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
