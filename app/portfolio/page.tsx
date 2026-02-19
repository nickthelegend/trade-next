'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trade } from '@/types';
import { LayoutGrid, ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';

export default function PortfolioPage() {
  const [stats, setStats] = useState({ total: 0, wins: 0, losses: 0, totalPnl: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const { data } = await supabase.from('trades').select('status, pnl');
      if (data) {
        const total = data.length;
        const wins = data.filter(t => t.status === 'success').length;
        const losses = data.filter(t => t.status === 'failed').length;
        const totalPnl = data.reduce((acc, curr) => acc + (curr.pnl || 0), 0);
        setStats({ total, wins, losses, totalPnl });
      }
      setLoading(false);
    }
    loadStats();
  }, []);

  if (loading) return <div className="h-screen bg-[#080b0f] flex items-center justify-center text-[#00e5ff] font-mono">LOADING PORTFOLIO...</div>;

  const winRate = stats.total > 0 ? ((stats.wins / stats.total) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-[#080b0f] text-[#c9d8e8] font-mono p-8">
      <Link href="/" className="flex items-center gap-2 text-[#4a6278] hover:text-[#00e5ff] mb-8 transition-colors">
        <ArrowLeft size={16} /> BACK TO TERMINAL
      </Link>

      <div className="max-w-4xl mx-auto space-y-8">
        <header className="border-b border-[#1e2a38] pb-6">
          <h1 className="text-3xl font-bold tracking-[4px] text-[#00e5ff] uppercase flex items-center gap-4">
             PORTFOLIO ANALYTICS
          </h1>
          <p className="text-[#4a6278] mt-2 tracking-widest text-xs uppercase">Live Performance Tracking</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatBox label="Total Trades" value={stats.total} />
          <StatBox label="Total Portfolio P&L" value={`${stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(2)}%`} color={stats.totalPnl >= 0 ? 'text-[#00ff88]' : 'text-[#ff3a5c]'} />
          <StatBox label="Win Rate" value={`${winRate}%`} color="text-[#00ff88]" />
        </div>

        <div className="grid grid-cols-2 gap-6">
            <div className="bg-[#0d1117] border border-[#1e2a38] p-6 text-center">
                <div className="text-[10px] text-[#4a6278] uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                    <TrendingUp size={12} className="text-[#00ff88]" /> WINNING STREAK
                </div>
                <div className="text-2xl font-bold text-[#00ff88]">{stats.wins}</div>
            </div>
            <div className="bg-[#0d1117] border border-[#1e2a38] p-6 text-center">
                <div className="text-[10px] text-[#4a6278] uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                    <TrendingDown size={12} className="text-[#ff3a5c]" /> LOSING STREAK
                </div>
                <div className="text-2xl font-bold text-[#ff3a5c]">{stats.losses}</div>
            </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: any) {
  return (
    <div className="bg-[#0d1117] border border-[#1e2a38] p-8 text-center relative overflow-hidden group hover:border-[#00e5ff] transition-all">
      <div className="text-[10px] text-[#4a6278] uppercase tracking-[3px] mb-4 group-hover:text-[#00e5ff] transition-colors">{label}</div>
      <div className={`text-4xl font-bold tracking-tighter ${color || 'text-white'}`}>{value}</div>
      <div className="absolute top-0 right-0 p-2 opacity-5">
        <LayoutGrid size={64} />
      </div>
    </div>
  );
}
