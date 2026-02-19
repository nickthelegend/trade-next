'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trade } from '@/types';
import TradingViewChart from '@/components/TradingViewChart';
import { useLivePrices } from '@/hooks/useLivePrices';
import { LayoutGrid, Briefcase, History, Plus, RefreshCcw, TrendingUp, TrendingDown, X } from 'lucide-react';
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
    
    // DEBUG: Only return 0 if we truly don't have a price yet
    if (!currentPrice) return 0;

    const entry = (trade.entry_low + trade.entry_high) / 2;
    const diff = trade.direction === 'LONG' ? currentPrice - entry : entry - currentPrice;
    return (diff / entry) * 100;
  };

  const gridTrades = trades.slice((currentPage - 1) * 4, currentPage * 4);
  const totalPages = Math.ceil(trades.length / 4) || 1;

  return (
    <div className="flex flex-col h-screen bg-[#080b0f] text-[#c9d8e8] font-mono overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-5 h-[50px] bg-[#0d1117] border-bottom border-[#1e2a38] flex-shrink-0 border-b">
        <div className="font-bold text-[18px] tracking-[3px] text-[#00e5ff] uppercase flex items-center gap-2">
          PAPER<span className="text-[#4a6278]">TRADE</span>
        </div>

        <div className="flex gap-7 items-center">
          <StatPill label="Trades" value={stats.total} />
          <StatPill label="Wins" value={stats.wins} color="up" />
          <StatPill label="Losses" value={stats.losses} color="down" />
          <StatPill label="Total P&L" value={`${stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(2)}%`} color={stats.totalPnl >= 0 ? 'up' : 'down'} />
        </div>

        <div className="flex gap-2.5 items-center">
          <Link href="/portfolio">
            <HeaderBtn icon={<Briefcase size={14} />} label="Portfolio" onClick={() => {}} />
          </Link>
          <Link href="/trades">
            <HeaderBtn icon={<History size={14} />} label="Trades" onClick={() => {}} />
          </Link>
          <HeaderBtn icon={<Plus size={14} />} label="New Trade" primary onClick={() => setIsModalOpen(true)} />
          <HeaderBtn icon={<RefreshCcw size={14} />} label="Refresh" onClick={() => { fetchTrades(); fetchStats(); }} />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden">
        {/* Chart Grid */}
        <section className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-[#0d1117] border-b border-[#1e2a38]">
            <div className="flex items-center gap-3">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="w-7 h-7 border border-[#1e2a38] flex items-center justify-center hover:border-[#00e5ff] disabled:opacity-30"
              >
                ←
              </button>
              <span className="text-[11px] text-[#4a6278] tracking-widest uppercase">PAGE {currentPage} / {totalPages}</span>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="w-7 h-7 border border-[#1e2a38] flex items-center justify-center hover:border-[#00e5ff] disabled:opacity-30"
              >
                →
              </button>
            </div>
            <div className="text-[10px] text-[#4a6278] tracking-[2px] uppercase">2×2 Chart Grid</div>
          </div>

          <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-[1px] bg-[#1e2a38]">
            {[0, 1, 2, 3].map((idx) => {
              const trade = gridTrades[idx];
              return (
                <div key={trade?.id || `empty-${idx}`} className="bg-[#0d1117] flex flex-col overflow-hidden relative">
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#1e2a38] bg-[#111820]">
                    <span className="text-[12px] font-bold tracking-wider">{trade ? trade.symbol : 'EMPTY SLOT'}</span>
                    {trade && (
                      <div className="flex gap-1.5 items-center">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 tracking-tighter uppercase border",
                          trade.direction === 'LONG' ? "bg-green-500/10 text-[#00ff88] border-[#00ff88]/30" : "bg-red-500/10 text-[#ff3a5c] border-[#ff3a5c]/30"
                        )}>
                          {trade.direction}
                        </span>
                        <span className={cn(
                          "text-[9px] px-1.5 py-0.5 tracking-widest uppercase font-bold border",
                          trade.status === 'open' ? "text-[#ffd54f] border-[#ffd54f]/40 bg-[#ffd54f]/10" : 
                          trade.status === 'success' ? "text-[#00ff88] border-[#00ff88]/40 bg-[#00ff88]/10" : "text-[#ff3a5c] border-[#ff3a5c]/40 bg-[#ff3a5c]/10"
                        )}>
                          {trade.status}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 relative">
                    {trade ? (
                      <TradingViewChart trade={trade} livePrice={livePrices[trade.symbol]} />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-[#4a6278] text-[11px] tracking-widest gap-2">
                        <div className="text-[28px] opacity-30">◇</div>
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
        <aside className="w-[300px] bg-[#0d1117] border-l border-[#1e2a38] flex flex-col overflow-hidden">
          <div className="p-3 border-b border-[#1e2a38] bg-[#111820]">
            <div className="font-bold text-[12px] tracking-[3px] text-[#00e5ff] uppercase">Positions</div>
            <div className="text-[10px] text-[#4a6278] mt-0.5 tracking-wider">{trades.filter(t => t.status === 'open').length} active</div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {trades.length === 0 && (
                <div className="flex flex-col items-center justify-center h-48 text-[#4a6278] text-[11px] tracking-widest gap-2">
                    <div>◇</div>
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

function StatPill({ label, value, color }: { label: string; value: any; color?: 'up' | 'down' | 'neutral' }) {
  return (
    <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider">
      <span className="text-[#4a6278]">{label}</span>
      <span className={cn(
        "font-bold",
        color === 'up' ? "text-[#00ff88]" : color === 'down' ? "text-[#ff3a5c]" : "text-[#00e5ff]"
      )}>{value}</span>
    </div>
  );
}

function HeaderBtn({ icon, label, primary, onClick }: { icon: any; label: string; primary?: boolean; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3.5 py-1.5 border border-[#1e2a38] text-[11px] uppercase tracking-widest hover:border-[#00e5ff] hover:text-[#00e5ff] transition-all",
        primary && "border-[#00e5ff] text-[#00e5ff] bg-[#00e5ff]/5 hover:bg-[#00e5ff]/10"
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
      "bg-[#111820] border border-[#1e2a38] p-3 transition-colors hover:border-[#00e5ff] relative overflow-hidden",
      "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px]",
      trade.direction === 'LONG' ? "before:bg-[#00ff88]" : "before:bg-[#ff3a5c]"
    )}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[12px] font-bold tracking-wider">{trade.symbol}</span>
        <span className={cn(
          "text-[9px] px-1.5 py-0.5 tracking-widest uppercase border",
          trade.status === 'open' ? "text-[#ffd54f] border-[#ffd54f]/40 bg-[#ffd54f]/10" : "text-[#00ff88] border-[#00ff88]/40 bg-[#00ff88]/10"
        )}>{trade.status}</span>
      </div>
      <div className="flex justify-between items-center mb-1">
        <span className={cn("text-[9px] font-bold tracking-widest uppercase", trade.direction === 'LONG' ? "text-[#00ff88]" : "text-[#ff3a5c]")}>
          {trade.direction === 'LONG' ? '↑' : '↓'} {trade.direction}
        </span>
        <span className={cn("text-[14px] font-bold tracking-wider", isProfit ? "text-[#00ff88]" : "text-[#ff3a5c]")}>
          {isProfit ? '+' : ''}{pnl.toFixed(2)}%
        </span>
      </div>
      <div className="text-[10px] text-[#4a6278]">Entry: {trade.entry_low} {trade.entry_high !== trade.entry_low && `– ${trade.entry_high}`}</div>
      
      {trade.status === 'open' && (
        <div className="flex gap-1 mt-2">
            <button onClick={() => updateStatus('success')} className="flex-1 py-1 text-[9px] uppercase border border-[#1e2a38] text-[#4a6278] hover:text-[#00ff88] hover:border-[#00ff88]">✓ Win</button>
            <button onClick={() => updateStatus('failed')} className="flex-1 py-1 text-[9px] uppercase border border-[#1e2a38] text-[#4a6278] hover:text-[#ff3a5c] hover:border-[#ff3a5c]">✗ Loss</button>
            <button onClick={deleteTrade} className="px-2 py-1 text-[9px] uppercase border border-[#1e2a38] text-[#4a6278] hover:text-[#ff3a5c] hover:border-[#ff3a5c]">⌫</button>
        </div>
      )}
    </div>
  );
}

// Simplified Modals for the demo
function Modal({ title, onClose, children, large }: { title: string; onClose: () => void; children: React.ReactNode; large?: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className={cn("bg-[#0d1117] border border-[#1e2a38] flex flex-col max-h-[90vh] overflow-hidden", large ? "w-[850px]" : "w-[480px]")}>
        <div className="flex justify-between items-center p-4 bg-[#111820] border-b border-[#1e2a38]">
          <h2 className="font-bold text-[14px] tracking-widest text-[#00e5ff] uppercase">{title}</h2>
          <button onClick={onClose} className="text-[#4a6278] hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-5 overflow-y-auto">
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
      <div className="space-y-4">
        <div>
          <label className="text-[10px] text-[#4a6278] block mb-1 uppercase tracking-widest">Symbol</label>
          <input className="w-full bg-[#080b0f] border border-[#1e2a38] p-2.5 text-[12px] outline-none focus:border-[#00e5ff]" placeholder="e.g. BTC/USDT" value={formData.symbol} onChange={e => setFormData({...formData, symbol: e.target.value})} />
        </div>
        <div className="flex gap-2">
            <button onClick={() => setFormData({...formData, direction: 'LONG'})} className={cn("flex-1 py-2 text-[11px] border", formData.direction === 'LONG' ? "border-[#00ff88] text-[#00ff88] bg-[#00ff88]/5" : "border-[#1e2a38] text-[#4a6278]")}>↑ LONG</button>
            <button onClick={() => setFormData({...formData, direction: 'SHORT'})} className={cn("flex-1 py-2 text-[11px] border", formData.direction === 'SHORT' ? "border-[#ff3a5c] text-[#ff3a5c] bg-[#ff3a5c]/5" : "border-[#1e2a38] text-[#4a6278]")}>↓ SHORT</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input className="bg-[#080b0f] border border-[#1e2a38] p-2.5 text-[12px]" placeholder="Entry Low" value={formData.entry_low} onChange={e => setFormData({...formData, entry_low: e.target.value})} />
          <input className="bg-[#080b0f] border border-[#1e2a38] p-2.5 text-[12px]" placeholder="Entry High" value={formData.entry_high} onChange={e => setFormData({...formData, entry_high: e.target.value})} />
        </div>
        <textarea className="w-full bg-[#080b0f] border border-[#1e2a38] p-2.5 text-[12px] h-24" placeholder="Take Profits (one per line)" value={formData.take_profits} onChange={e => setFormData({...formData, take_profits: e.target.value})} />
        <input className="w-full bg-[#080b0f] border border-[#1e2a38] p-2.5 text-[12px]" placeholder="Stop Loss" value={formData.stop_loss} onChange={e => setFormData({...formData, stop_loss: e.target.value})} />
        <button onClick={handleSubmit} className="w-full bg-[#00e5ff]/10 border border-[#00e5ff] text-[#00e5ff] py-2.5 text-[11px] uppercase tracking-widest hover:bg-[#00e5ff]/20">Open Position →</button>
      </div>
    </Modal>
  );
}

function PortfolioModal({ stats, onClose }: any) {
  const winRate = stats.total > 0 ? ((stats.wins / stats.total) * 100).toFixed(1) : 0;
  return (
    <Modal title="Portfolio Analytics" onClose={onClose}>
      <div className="space-y-4">
        <SummaryBox label="Total Amount of Trades" value={stats.total} color="#00e5ff" />
        <SummaryBox label="Total Portfolio P&L" value={`${stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(2)}%`} color={stats.totalPnl >= 0 ? '#00ff88' : '#ff3a5c'} />
        <SummaryBox label="Win Rate" value={`${winRate}%`} color="#00ff88" />
      </div>
    </Modal>
  );
}

function SummaryBox({ label, value, color }: any) {
  return (
    <div className="bg-[#111820] border border-[#1e2a38] p-4 text-center">
      <div className="text-[9px] text-[#4a6278] uppercase tracking-widest mb-1">{label}</div>
      <div className="text-[24px] font-bold" style={{ color }}>{value}</div>
    </div>
  );
}

function HistoryModal({ trades, onClose }: any) {
  return (
    <Modal title="Trade History" onClose={onClose} large>
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr className="text-[#4a6278] uppercase tracking-widest border-b border-[#1e2a38]">
            <th className="text-left py-2 px-2">Symbol</th>
            <th className="text-left py-2 px-2">Type</th>
            <th className="text-left py-2 px-2">Status</th>
            <th className="text-left py-2 px-2">Entry</th>
            <th className="text-left py-2 px-2 text-right">P&L</th>
            <th className="text-left py-2 px-2 text-right">Date</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t: Trade) => (
            <tr key={t.id} className="border-b border-[#111820] hover:bg-white/[0.02]">
              <td className="py-3 px-2 font-bold">{t.symbol}</td>
              <td className={cn("py-3 px-2 font-bold", t.direction === 'LONG' ? "text-[#00ff88]" : "text-[#ff3a5c]")}>{t.direction}</td>
              <td className="py-3 px-2"><span className="border border-[#1e2a38] px-1.5 py-0.5 uppercase text-[9px]">{t.status}</span></td>
              <td className="py-3 px-2 text-[#4a6278]">{t.entry_low}</td>
              <td className={cn("py-3 px-2 text-right font-bold", (t.pnl || 0) >= 0 ? "text-[#00ff88]" : "text-[#ff3a5c]")}>{(t.pnl || 0).toFixed(2)}%</td>
              <td className="py-3 px-2 text-right text-[#4a6278]">{new Date(t.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Modal>
  );
}
