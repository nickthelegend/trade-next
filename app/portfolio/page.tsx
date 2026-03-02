'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { LayoutGrid, ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Stats } from '@/types';

export default function PortfolioPage() {
  const stats = useQuery(api.trades.getStats);
  const loading = stats === undefined;
  const statsData = stats || { total: 0, wins: 0, losses: 0, totalPnl: 0 };

  if (loading) return <div className="h-screen bg-[#080b0f] flex items-center justify-center text-[#00e5ff] font-mono animate-pulse">LOADING ANALYTICS...</div>;

  const winRate = statsData.total > 0 ? ((statsData.wins / statsData.total) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-[#080b0f] text-[#c9d8e8] font-mono p-8 overflow-x-hidden">
      <Link href="/" className="inline-flex items-center gap-2 text-[#4a6278] hover:text-[#00e5ff] mb-8 transition-all hover:-translate-x-1 group">
        <ArrowLeft size={16} className="group-hover:text-[#00e5ff]" /> <span className="tracking-widest text-xs">BACK To TERMINAL</span>
      </Link>

      <div className="max-w-4xl mx-auto space-y-8">
        <header className="border-b border-[#1e2a38] pb-6">
          <h1 className="text-3xl font-bold tracking-[6px] text-[#00e5ff] uppercase flex items-center gap-4 font-['Syne']">
            PORTFOLIO ANALYTICS
          </h1>
          <p className="text-[#4a6278] mt-2 tracking-widest text-xs uppercase opacity-70">Live Performance Tracking</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatBox label="Total Trades" value={statsData.total} />
          <StatBox
            label="Total Realized P&L"
            value={`${statsData.totalPnl >= 0 ? '+' : ''}${statsData.totalPnl.toFixed(2)}%`}
            color={statsData.totalPnl >= 0 ? 'text-[#00ff88]' : 'text-[#ff3a5c]'}
          />
          <StatBox label="Win Rate" value={`${winRate}%`} color="text-[#00ff88]" />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-[#0d1117] border border-[#1e2a38] p-10 text-center relative overflow-hidden group hover:border-[#00ff88]/50 transition-all shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="text-[10px] text-[#4a6278] uppercase tracking-[3px] mb-4 flex items-center justify-center gap-2 group-hover:text-[#00ff88] transition-colors">
              <TrendingUp size={12} className="text-[#00ff88]" /> SUCCESSFUL EXPLOITS
            </div>
            <div className="text-4xl font-bold font-['Syne'] text-[#00ff88] group-hover:scale-110 transition-transform">{stats.wins}</div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#00ff88]/5 to-transparent pointer-events-none" />
          </div>

          <div className="bg-[#0d1117] border border-[#1e2a38] p-10 text-center relative overflow-hidden group hover:border-[#ff3a5c]/50 transition-all shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="text-[10px] text-[#4a6278] uppercase tracking-[3px] mb-4 flex items-center justify-center gap-2 group-hover:text-[#ff3a5c] transition-colors">
              <TrendingDown size={12} className="text-[#ff3a5c]" /> FAILED OPERATIONS
            </div>
            <div className="text-4xl font-bold font-['Syne'] text-[#ff3a5c] group-hover:scale-110 transition-transform">{stats.losses}</div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#ff3a5c]/5 to-transparent pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-[#0d1117] border border-[#1e2a38] p-10 text-center relative overflow-hidden group hover:border-[#00e5ff]/50 transition-all shadow-[0_0_50px_rgba(0,0,0,0.5)]">
      <div className="text-[10px] text-[#4a6278] uppercase tracking-[3px] mb-6 group-hover:text-[#00e5ff] transition-colors">{label}</div>
      <div className={cn("text-4xl font-bold tracking-tighter mb-2 font-['Syne'] transition-all group-hover:scale-110", color || 'text-white')}>{value}</div>
      <div className="absolute top-0 right-0 p-3 opacity-[0.03] scale-150 rotate-12">
        <LayoutGrid size={80} />
      </div>
    </div>
  );
}
