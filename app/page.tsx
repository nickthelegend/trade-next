'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trade } from '@/types';
import TradingViewChart from '@/components/TradingViewChart';
import { useLivePrices } from '@/hooks/useLivePrices';
import { LayoutGrid, Briefcase, History, Plus, RefreshCcw, TrendingUp, TrendingDown, X, Check, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Dashboard() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [stats, setStats] = useState({ total: 0, wins: 0, losses: 0, totalPnl: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const symbols = [...new Set(trades.map(t => t.symbol))];
  const livePrices = useLivePrices(symbols);

  const fetchTrades = async () => {
    const { data } = await supabase
      .from('trades')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) {
      // Ensure take_profits is an array (Supabase might return it as one if JSONB)
      setTrades(data as Trade[]);
    }
  };

  const fetchStats = async () => {
    const { data } = await supabase.from('trades').select('status, pnl');
    if (data) {
      const total = data.length;
      const wins = data.filter(t => t.status === 'success').length;
      const losses = data.filter(t => t.status === 'failed').length;
      const totalPnl = data.reduce((acc, curr) => acc + (curr.pnl || 0), 0);
      setStats({ total, wins, losses, totalPnl });
    }
  };

  useEffect(() => {
    fetchTrades();
    fetchStats();
    const interval = setInterval(() => {
      fetchTrades();
      fetchStats();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const calculatePnL = (trade: Trade) => {
    if (trade.status !== 'open') return trade.pnl || 0;
    const currentPrice = livePrices[trade.symbol];
    if (!currentPrice) return 0;

    const entry = (trade.entry_low + trade.entry_high) / 2;
    const diff = trade.direction === 'LONG' ? currentPrice - entry : entry - currentPrice;
    return (diff / entry) * 100;
  };

  const gridTrades = trades.slice((currentPage - 1) * 4, currentPage * 4);
  const totalPages = Math.ceil(trades.length / 4) || 1;

  return (
    <div className="flex flex-col h-screen bg-[#080b0f] text-[#c9d8e8] font-mono overflow-hidden selection:bg-[#00e5ff]/20">
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-[60px] bg-[#0d1117] border-b border-[#1e2a38] flex-shrink-0 z-10 shadow-sm">
        <div className="font-bold text-[20px] tracking-[4px] text-[#00e5ff] uppercase flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
          PAPER<span className="text-[#4a6278]">TRADE</span>
        </div>

        <div className="flex gap-8 items-center hidden md:flex">
          <StatPill label="Trades" value={stats.total} icon={<LayoutGrid size={14} className="text-[#4a6278]" />} />
          <StatPill label="Wins" value={stats.wins} color="up" icon={<TrendingUp size={14} className="text-[#00ff88]" />} />
          <StatPill label="Losses" value={stats.losses} color="down" icon={<TrendingDown size={14} className="text-[#ff3a5c]" />} />
          <StatPill label="Total P&L" value={`${stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(2)}%`} color={stats.totalPnl >= 0 ? 'up' : 'down'} />
        </div>

        <div className="flex gap-3 items-center">
          <Link href="/portfolio">
            <HeaderBtn icon={<Briefcase size={16} />} label="Portfolio" onClick={() => { }} />
          </Link>
          <Link href="/trades">
            <HeaderBtn icon={<History size={16} />} label="Trades" onClick={() => { }} />
          </Link>
          <HeaderBtn icon={<Plus size={16} />} label="New Trade" primary onClick={() => setIsModalOpen(true)} />
          <button
            onClick={() => { fetchTrades(); fetchStats(); }}
            className="p-2 border border-[#1e2a38] text-[#4a6278] hover:text-[#00e5ff] hover:border-[#00e5ff] transition-all rounded-sm"
            title="Refresh"
          >
            <RefreshCcw size={16} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden">
        {/* Chart Grid */}
        <section className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex items-center justify-between px-6 py-3 bg-[#0d1117] border-b border-[#1e2a38]">
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="w-8 h-8 border border-[#1e2a38] flex items-center justify-center hover:border-[#00e5ff] hover:text-[#00e5ff] disabled:opacity-30 disabled:hover:border-[#1e2a38] disabled:hover:text-inherit transition-colors rounded-l-sm bg-[#111820]"
                >
                  ←
                </button>
                <div className="h-8 px-4 border-y border-[#1e2a38] flex items-center justify-center bg-[#111820] text-[11px] text-[#4a6278] tracking-widest uppercase font-semibold">
                  PAGE {currentPage} / {totalPages}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="w-8 h-8 border border-[#1e2a38] flex items-center justify-center hover:border-[#00e5ff] hover:text-[#00e5ff] disabled:opacity-30 disabled:hover:border-[#1e2a38] disabled:hover:text-inherit transition-colors rounded-r-sm bg-[#111820]"
                >
                  →
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-[#4a6278] tracking-[2px] uppercase">
              <LayoutGrid size={14} />
              2×2 Grid
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-[1px] bg-[#1e2a38]">
            {[0, 1, 2, 3].map((idx) => {
              const trade = gridTrades[idx];
              return (
                <div key={trade?.id || `empty-${idx}`} className="bg-[#080b0f] flex flex-col overflow-hidden relative group">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-[#1e2a38] bg-[#111820]">
                    <span className="text-[13px] font-bold tracking-wider text-[#c9d8e8]">{trade ? trade.symbol : 'EMPTY SLOT'}</span>
                    {trade && (
                      <div className="flex gap-2 items-center">
                        <Badge variant={trade.direction === 'LONG' ? 'success' : 'danger'}>{trade.direction}</Badge>
                        <Badge variant={trade.status === 'open' ? 'warning' : trade.status === 'success' ? 'success' : 'danger'}>{trade.status}</Badge>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!confirm('Close and remove this trade?')) return;
                            await supabase.from('trades').delete().eq('id', trade.id);
                            fetchTrades();
                            fetchStats();
                          }}
                          className="ml-2 text-[#4a6278] hover:text-[#ff3a5c] transition-colors p-1 hover:bg-[#ff3a5c]/10 rounded-sm"
                          title="Close Trade"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 relative">
                    {trade ? (
                      <TradingViewChart trade={trade} livePrice={livePrices[trade.symbol]} />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-[#4a6278] text-[11px] tracking-widest gap-3 opacity-50 group-hover:opacity-80 transition-opacity">
                        <div className="w-12 h-12 border border-[#1e2a38] rounded-full flex items-center justify-center">
                          <Plus size={20} className="text-[#1e2a38] group-hover:text-[#00e5ff] transition-colors" />
                        </div>
                        <div>NO TRADE</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Sidebar */}
        <aside className="w-[340px] bg-[#0d1117] border-l border-[#1e2a38] flex flex-col overflow-hidden shadow-xl z-20">
          <div className="p-4 border-b border-[#1e2a38] bg-[#111820] flex items-center justify-between">
            <div className="font-bold text-[13px] tracking-[3px] text-[#00e5ff] uppercase flex items-center gap-2">
              <Briefcase size={14} />
              Positions
            </div>
            <div className="px-2 py-0.5 bg-[#1e2a38] rounded text-[10px] text-[#4a6278] font-mono shadow-inner border border-[#000]/20">
              {trades.filter(t => t.status === 'open').length} ACTIVE
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            {trades.length === 0 && (
              <div className="flex flex-col items-center justify-center h-48 text-[#4a6278] text-[11px] tracking-widest gap-2 opacity-60">
                <Briefcase size={32} strokeWidth={1} />
                <div>NO POSITIONS</div>
              </div>
            )}
            {trades.map(t => (
              <PositionCard key={t.id} trade={t} pnl={calculatePnL(t)} onUpdate={fetchTrades} />
            ))}
          </div>
        </aside>
      </main>

      {/* Modals */}
      {isModalOpen && <NewTradeModal onClose={() => setIsModalOpen(false)} onCreated={() => { fetchTrades(); fetchStats(); }} />}
      {isPortfolioOpen && <PortfolioModal stats={stats} onClose={() => setIsPortfolioOpen(false)} />}
      {isHistoryOpen && <HistoryModal trades={trades} onClose={() => setIsHistoryOpen(false)} />}
    </div>
  );
}

function StatPill({ label, value, color, icon }: { label: string; value: any; color?: 'up' | 'down' | 'neutral'; icon?: any }) {
  return (
    <div className="flex items-center gap-3 text-[11px] uppercase tracking-wider bg-[#111820] px-3 py-1.5 rounded-sm border border-[#1e2a38] hover:border-[#4a6278] transition-colors cursor-default">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[#4a6278] font-semibold">{label}</span>
      </div>
      <div className="h-3 w-[1px] bg-[#1e2a38]" />
      <span className={cn(
        "font-bold text-[12px]",
        color === 'up' ? "text-[#00ff88]" : color === 'down' ? "text-[#ff3a5c]" : "text-[#c9d8e8]"
      )}>{value}</span>
    </div>
  );
}

function Badge({ children, variant }: { children: React.ReactNode, variant: 'success' | 'danger' | 'warning' | 'neutral' }) {
  const styles = {
    success: "text-[#00ff88] border-[#00ff88]/30 bg-[#00ff88]/10",
    danger: "text-[#ff3a5c] border-[#ff3a5c]/30 bg-[#ff3a5c]/10",
    warning: "text-[#ffd54f] border-[#ffd54f]/30 bg-[#ffd54f]/10",
    neutral: "text-[#c9d8e8] border-[#c9d8e8]/30 bg-[#c9d8e8]/10"
  };

  return (
    <span className={cn(
      "text-[9px] px-1.5 py-0.5 tracking-wider uppercase font-bold border rounded-[2px]",
      styles[variant]
    )}>
      {children}
    </span>
  );
}

function HeaderBtn({ icon, label, primary, onClick }: { icon: any; label: string; primary?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 border rounded-sm text-[11px] uppercase tracking-widest transition-all shadow-sm",
        primary
          ? "border-[#00e5ff] text-[#00e5ff] bg-[#00e5ff]/5 hover:bg-[#00e5ff]/15 shadow-[#00e5ff]/10"
          : "border-[#1e2a38] text-[#4a6278] hover:border-[#00e5ff] hover:text-[#00e5ff] bg-[#111820]"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function PositionCard({ trade, pnl, onUpdate }: { trade: Trade; pnl: number; onUpdate: () => void }) {
  const isProfit = pnl >= 0;

  const updateStatus = async (status: 'success' | 'failed') => {
    await supabase.from('trades').update({ status, pnl, closed_at: new Date().toISOString() }).eq('id', trade.id);
    onUpdate();
  };

  const deleteTrade = async () => {
    if (!confirm('Delete this trade?')) return;
    await supabase.from('trades').delete().eq('id', trade.id);
    onUpdate();
  };

  return (
    <div className={cn(
      "bg-[#111820] border border-[#1e2a38] p-4 transition-all hover:border-[#00e5ff] relative overflow-hidden group rounded-sm shadow-md",
      "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] transition-opacity",
      trade.direction === 'LONG' ? "before:bg-[#00ff88]" : "before:bg-[#ff3a5c]",
      "hover:bg-[#161d26]"
    )}>
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-bold tracking-wider text-white">{trade.symbol}</span>
          <span className={cn(
            "text-[9px] font-bold px-1.5 py-[1px] rounded-[2px] uppercase tracking-widest",
            trade.direction === 'LONG' ? "bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20" : "bg-[#ff3a5c]/10 text-[#ff3a5c] border border-[#ff3a5c]/20"
          )}>
            {trade.direction}
          </span>
        </div>
        <Badge variant={trade.status === 'open' ? 'warning' : trade.status === 'success' ? 'success' : 'danger'}>{trade.status}</Badge>
      </div>

      <div className="flex justify-between items-end mb-3 pb-3 border-b border-[#1e2a38]/50">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-[#4a6278] uppercase tracking-wider">Entry Price</span>
          <span className="text-[12px] text-[#c9d8e8] font-mono">{trade.entry_low}</span>
        </div>
        <div className="flex flex-col gap-1 items-end">
          <span className="text-[10px] text-[#4a6278] uppercase tracking-wider">P&L</span>
          <span className={cn("text-[16px] font-bold tracking-tight font-mono", isProfit ? "text-[#00ff88]" : "text-[#ff3a5c]")}>
            {isProfit ? '+' : ''}{pnl.toFixed(2)}%
          </span>
        </div>
      </div>

      {trade.status === 'open' && (
        <div className="grid grid-cols-5 gap-2">
          <button onClick={() => updateStatus('success')} className="col-span-2 flex items-center justify-center gap-1.5 py-1.5 text-[10px] uppercase border border-[#1e2a38] bg-[#0d1117] text-[#4a6278] hover:text-[#00ff88] hover:border-[#00ff88] hover:bg-[#00ff88]/5 transition-colors rounded-sm group/btn">
            <Check size={12} className="group-hover/btn:scale-110 transition-transform" /> WIN
          </button>
          <button onClick={() => updateStatus('failed')} className="col-span-2 flex items-center justify-center gap-1.5 py-1.5 text-[10px] uppercase border border-[#1e2a38] bg-[#0d1117] text-[#4a6278] hover:text-[#ff3a5c] hover:border-[#ff3a5c] hover:bg-[#ff3a5c]/5 transition-colors rounded-sm group/btn">
            <X size={12} className="group-hover/btn:scale-110 transition-transform" /> LOSS
          </button>
          <button onClick={deleteTrade} className="col-span-1 flex items-center justify-center py-1.5 text-[#4a6278] border border-[#1e2a38] bg-[#0d1117] hover:text-red-400 hover:border-red-400 hover:bg-red-400/10 transition-colors rounded-sm">
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

// Simplified Modals for the demo
function Modal({ title, onClose, children, large }: { title: string; onClose: () => void; children: React.ReactNode; large?: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className={cn("bg-[#0d1117] border border-[#1e2a38] flex flex-col max-h-[90vh] overflow-hidden shadow-2xl rounded-sm", large ? "w-[850px]" : "w-[480px]")}>
        <div className="flex justify-between items-center p-4 bg-[#111820] border-b border-[#1e2a38]">
          <h2 className="font-bold text-[14px] tracking-widest text-[#00e5ff] uppercase flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#00e5ff] rounded-full animate-pulse" />
            {title}
          </h2>
          <button onClick={onClose} className="text-[#4a6278] hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

function NewTradeModal({ onClose, onCreated }: any) {
  const [formData, setFormData] = useState({
    symbol: '',
    direction: 'LONG',
    entry_low: '',
    entry_high: '',
    take_profits: '',
    stop_loss: ''
  });

  const handleSubmit = async () => {
    const { symbol, direction, entry_low, entry_high, take_profits, stop_loss } = formData;
    if (!symbol || !entry_low || !stop_loss) return alert('Fill fields');

    const tpList = take_profits.split('\n').map(v => parseFloat(v)).filter(v => !isNaN(v));

    await supabase.from('trades').insert([{
      symbol: symbol.toUpperCase(),
      direction,
      entry_low: parseFloat(entry_low),
      entry_high: parseFloat(entry_high || entry_low),
      take_profits: tpList,
      stop_loss: parseFloat(stop_loss),
      status: 'open'
    }]);

    onCreated();
    onClose();
  };

  return (
    <Modal title="Open Position" onClose={onClose}>
      <div className="space-y-5">
        <div>
          <label className="text-[10px] text-[#4a6278] block mb-1.5 uppercase tracking-widest font-bold">Symbol</label>
          <input className="w-full bg-[#080b0f] border border-[#1e2a38] p-3 text-[13px] outline-none focus:border-[#00e5ff] rounded-sm text-white placeholder-[#1e2a38] transition-colors" placeholder="e.g. BTC/USDT" value={formData.symbol} onChange={e => setFormData({ ...formData, symbol: e.target.value })} autoFocus />
        </div>
        <div className="flex gap-3">
          <button onClick={() => setFormData({ ...formData, direction: 'LONG' })} className={cn("flex-1 py-3 text-[12px] border rounded-sm transition-all font-bold tracking-wider", formData.direction === 'LONG' ? "border-[#00ff88] text-[#00ff88] bg-[#00ff88]/10 shadow-[0_0_15px_-3px_rgba(0,255,136,0.3)]" : "border-[#1e2a38] text-[#4a6278] bg-[#080b0f]")}>↑ LONG</button>
          <button onClick={() => setFormData({ ...formData, direction: 'SHORT' })} className={cn("flex-1 py-3 text-[12px] border rounded-sm transition-all font-bold tracking-wider", formData.direction === 'SHORT' ? "border-[#ff3a5c] text-[#ff3a5c] bg-[#ff3a5c]/10 shadow-[0_0_15px_-3px_rgba(255,58,92,0.3)]" : "border-[#1e2a38] text-[#4a6278] bg-[#080b0f]")}>↓ SHORT</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-[#4a6278] block mb-1.5 uppercase tracking-widest font-bold">Entry Low</label>
            <input className="w-full bg-[#080b0f] border border-[#1e2a38] p-3 text-[13px] outline-none focus:border-[#00e5ff] rounded-sm text-white" placeholder="0.00" value={formData.entry_low} onChange={e => setFormData({ ...formData, entry_low: e.target.value })} />
          </div>
          <div>
            <label className="text-[10px] text-[#4a6278] block mb-1.5 uppercase tracking-widest font-bold">Entry High (Opt)</label>
            <input className="w-full bg-[#080b0f] border border-[#1e2a38] p-3 text-[13px] outline-none focus:border-[#00e5ff] rounded-sm text-white" placeholder="0.00" value={formData.entry_high} onChange={e => setFormData({ ...formData, entry_high: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="text-[10px] text-[#4a6278] block mb-1.5 uppercase tracking-widest font-bold">Take Profits (One per line)</label>
          <textarea className="w-full bg-[#080b0f] border border-[#1e2a38] p-3 text-[13px] h-24 outline-none focus:border-[#00e5ff] rounded-sm text-white resize-none" placeholder="Target 1&#10;Target 2" value={formData.take_profits} onChange={e => setFormData({ ...formData, take_profits: e.target.value })} />
        </div>
        <div>
          <label className="text-[10px] text-[#4a6278] block mb-1.5 uppercase tracking-widest font-bold">Stop Loss</label>
          <input className="w-full bg-[#080b0f] border border-[#1e2a38] p-3 text-[13px] outline-none focus:border-[#00e5ff] rounded-sm text-white" placeholder="0.00" value={formData.stop_loss} onChange={e => setFormData({ ...formData, stop_loss: e.target.value })} />
        </div>
        <button onClick={handleSubmit} className="w-full bg-[#00e5ff] text-[#080b0f] font-bold py-3 text-[12px] uppercase tracking-[2px] hover:bg-[#00cce6] transition-colors rounded-sm shadow-[0_0_20px_-5px_#00e5ff]">Open Position</button>
      </div>
    </Modal>
  );
}

function PortfolioModal({ stats, onClose }: any) {
  const winRate = stats.total > 0 ? ((stats.wins / stats.total) * 100).toFixed(1) : 0;
  return (
    <Modal title="Portfolio Analytics" onClose={onClose}>
      <div className="space-y-4">
        <SummaryBox label="Total Trades" value={stats.total} color="#00e5ff" />
        <SummaryBox label="Net P&L" value={`${stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(2)}%`} color={stats.totalPnl >= 0 ? '#00ff88' : '#ff3a5c'} />
        <SummaryBox label="Win Rate" value={`${winRate}%`} color="#00ff88" />
      </div>
    </Modal>
  );
}

function SummaryBox({ label, value, color }: any) {
  return (
    <div className="bg-[#111820] border border-[#1e2a38] p-5 text-center rounded-sm">
      <div className="text-[10px] text-[#4a6278] uppercase tracking-widest mb-2 font-bold">{label}</div>
      <div className="text-[32px] font-bold tracking-tight" style={{ color }}>{value}</div>
    </div>
  );
}

function HistoryModal({ trades, onClose }: any) {
  return (
    <Modal title="Trade History" onClose={onClose} large>
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="text-[#4a6278] uppercase tracking-widest border-b border-[#1e2a38] text-[10px]">
            <th className="text-left py-3 px-3 font-bold">Symbol</th>
            <th className="text-left py-3 px-3 font-bold">Type</th>
            <th className="text-left py-3 px-3 font-bold">Status</th>
            <th className="text-left py-3 px-3 font-bold">Entry</th>
            <th className="text-right py-3 px-3 font-bold">P&L</th>
            <th className="text-right py-3 px-3 font-bold">Date</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t: Trade) => (
            <tr key={t.id} className="border-b border-[#111820] hover:bg-white/[0.02] transition-colors">
              <td className="py-3 px-3 font-bold text-white">{t.symbol}</td>
              <td className={cn("py-3 px-3 font-bold", t.direction === 'LONG' ? "text-[#00ff88]" : "text-[#ff3a5c]")}>{t.direction}</td>
              <td className="py-3 px-3"><Badge variant={t.status === 'open' ? 'warning' : t.status === 'success' ? 'success' : 'danger'}>{t.status}</Badge></td>
              <td className="py-3 px-3 text-[#c9d8e8] font-mono">{t.entry_low}</td>
              <td className={cn("py-3 px-3 text-right font-bold font-mono", (t.pnl || 0) >= 0 ? "text-[#00ff88]" : "text-[#ff3a5c]")}>{(t.pnl || 0).toFixed(2)}%</td>
              <td className="py-3 px-3 text-right text-[#4a6278]">{new Date(t.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Modal>
  );
}
