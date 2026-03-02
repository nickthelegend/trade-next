'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Trade } from '@/types';
import TradingViewChart from '@/components/TradingViewChart';
import { useLivePrices } from '@/hooks/useLivePrices';
import {
  LayoutGrid, Briefcase, History, Plus, RefreshCcw,
  TrendingUp, TrendingDown, X, Check, Trash2,
  Settings, Bell, Zap, Menu, ChevronRight, Activity,
  Globe, Shield, Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Dashboard() {
  const trades = (useQuery(api.trades.list) || []) as Trade[];
  const stats = (useQuery(api.trades.getStats) || { total: 0, wins: 0, losses: 0, totalPnl: 0 }) as Stats;

  const updateStatus = useMutation(api.trades.updateStatus);
  const removeTrade = useMutation(api.trades.remove);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isHovered, setIsHovered] = useState<string | null>(null);

  const symbols = [...new Set(trades.map(t => t.symbol))];
  const livePrices = useLivePrices(symbols);

  const calculatePnL = (trade: Trade) => {
    if (trade.status !== 'open') return trade.pnl || 0;
    const currentPrice = livePrices[trade.symbol];
    if (!currentPrice) return 0;
    const entry = (trade.entryLow + (trade.entryHigh || trade.entryLow)) / 2;
    const diff = trade.direction === 'LONG' ? currentPrice - entry : entry - currentPrice;
    return (diff / entry) * 100;
  };

  const gridTrades = trades.slice((currentPage - 1) * 4, currentPage * 4);
  const totalPages = Math.ceil(trades.length / 4) || 1;

  return (
    <div className="flex flex-col h-screen bg-[#020408] text-[#e2e8f0] font-sans overflow-hidden selection:bg-[#00f2ff]/30">
      {/* Background Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00f2ff]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#7000ff]/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="flex items-center justify-between px-8 h-[70px] bg-[#020408]/80 backdrop-blur-xl border-b border-white/5 flex-shrink-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-tr from-[#00f2ff] to-[#7000ff] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.3)]">
            <Zap size={22} className="text-black fill-black" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-[18px] tracking-[4px] bg-clip-text text-transparent bg-gradient-to-r from-white to-white/40 uppercase">
              TRADE<span className="text-[#00f2ff]">NEXT</span>
            </span>
            <span className="text-[10px] text-[#4a6278] tracking-[2px] uppercase font-bold">Systems Ready</span>
          </div>
        </div>

        <div className="hidden lg:flex gap-6 items-center">
          <StatDisplay label="Volume" value="$1.2M" subValue="+12%" subColor="text-emerald-400" />
          <div className="w-[1px] h-8 bg-white/5" />
          <StatDisplay label="Win Rate" value={`${stats.total > 0 ? ((stats.wins / stats.total) * 100).toFixed(1) : 0}%`} subValue="Global Avg 44%" />
          <div className="w-[1px] h-8 bg-white/5" />
          <StatDisplay
            label="Total P&L"
            value={`${stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(2)}%`}
            subValue="Realtime"
            color={stats.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-500'}
          />
        </div>

        <div className="flex gap-4 items-center">
          <div className="flex bg-white/5 p-1 rounded-lg border border-white/5">
            <NavIcon icon={<Globe size={18} />} />
            <NavIcon icon={<Bell size={18} />} />
            <NavIcon icon={<Settings size={18} />} />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="group relative px-6 py-2.5 bg-[#00f2ff] hover:bg-[#00d8e6] text-black font-bold text-[12px] uppercase tracking-widest rounded-lg transition-all overflow-hidden flex items-center gap-2 shadow-[0_0_20px_rgba(0,242,255,0.2)]"
          >
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
            <Plus size={16} strokeWidth={3} />
            <span>Execute Trade</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar (Mini) */}
        <aside className="w-[70px] bg-[#020408]/50 border-r border-white/5 flex flex-col items-center py-6 gap-8 z-40">
          <SidebarIcon icon={<Activity size={20} />} active />
          <SidebarIcon icon={<Briefcase size={20} />} />
          <SidebarIcon icon={<Cpu size={20} />} />
          <SidebarIcon icon={<Shield size={20} />} />
          <div className="mt-auto">
            <SidebarIcon icon={<Menu size={20} />} />
          </div>
        </aside>

        {/* Chart Grid Area */}
        <section className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-8 py-4 bg-[#020408]/30 border-b border-white/5">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-bold text-[#4a6278] uppercase tracking-widest">Live Terminal</span>
              </div>
              <div className="flex items-center bg-white/5 p-1 rounded-lg">
                <PageBtn label="Prev" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} />
                <div className="px-4 text-[11px] font-bold text-white/50">{currentPage} / {totalPages}</div>
                <PageBtn label="Next" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} />
              </div>
            </div>

            <div className="flex gap-4">
              <ViewToggle icon={<LayoutGrid size={14} />} label="GRID" active />
              <ViewToggle icon={<History size={14} />} label="LIST" />
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-[1px] bg-white/5 p-[1px]">
            {[0, 1, 2, 3].map((idx) => {
              const trade = gridTrades[idx];
              return (
                <TradeContainer
                  key={trade?._id || `empty-${idx}`}
                  trade={trade}
                  livePrice={livePrices[trade?.symbol] || 0}
                  onClose={() => removeTrade({ id: trade._id })}
                />
              );
            })}
          </div>
        </section>

        {/* Right Panel: Watchlist & Activity */}
        <aside className="w-[380px] bg-[#020408]/80 backdrop-blur-2xl border-l border-white/5 flex flex-col overflow-hidden z-40">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-black text-[13px] tracking-[3px] text-white uppercase flex items-center gap-2">
              <Activity size={16} className="text-[#00f2ff]" />
              Active Positions
            </h3>
            <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] text-[#00f2ff] font-bold border border-[#00f2ff]/20">
              {trades.filter(t => t.status === 'open').length} RUNNING
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {trades.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-[#4a6278] space-y-4 opacity-20">
                <Briefcase size={48} strokeWidth={1} />
                <p className="text-[10px] uppercase tracking-[4px]">No positions found</p>
              </div>
            )}
            <AnimatePresence mode="popLayout">
              {trades.map(t => (
                <PositionCard
                  key={t._id}
                  trade={t}
                  pnl={calculatePnL(t)}
                  onUpdate={(status, pnl) => updateStatus({ id: t._id, status, pnl, closedAt: new Date().toISOString() })}
                />
              ))}
            </AnimatePresence>
          </div>
        </aside>
      </main>

      {/* Footer / Ticker */}
      <footer className="h-[40px] bg-black border-t border-white/5 flex items-center px-8 overflow-hidden gap-8 z-50">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[10px] font-bold text-[#4a6278]">SYSTEM STATUS: NORMAL</span>
        </div>
        <div className="flex gap-12 overflow-hidden items-center group">
          {symbols.map(s => (
            <div key={s} className="flex gap-2 items-center shrink-0">
              <span className="text-[10px] font-bold text-white/40">{s}</span>
              <span className="text-[10px] font-mono text-emerald-400 line-clamp-1">{livePrices[s]?.toFixed(2) || '---'}</span>
            </div>
          ))}
        </div>
      </footer>

      {isModalOpen && <NewTradeModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}

function StatDisplay({ label, value, subValue, subColor = "text-white/30", color = "text-white" }: { label: string; value: string; subValue: string; subColor?: string; color?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[9px] text-[#4a6278] uppercase tracking-[2px] font-bold mb-1">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className={cn("text-[18px] font-black tracking-tight", color)}>{value}</span>
        <span className={cn("text-[10px] font-bold", subColor)}>{subValue}</span>
      </div>
    </div>
  );
}

function SidebarIcon({ icon, active = false }: { icon: React.ReactNode; active?: boolean }) {
  return (
    <div className={cn(
      "w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer group",
      active ? "bg-[#00f2ff]/10 text-[#00f2ff] shadow-[inset_0_0_10px_rgba(0,242,255,0.1)]" : "text-[#4a6278] hover:bg-white/5 hover:text-white"
    )}>
      {icon}
    </div>
  );
}

function NavIcon({ icon }: { icon: React.ReactNode }) {
  return (
    <button className="w-8 h-8 flex items-center justify-center text-[#4a6278] hover:text-[#00f2ff] transition-colors">
      {icon}
    </button>
  );
}

function TradeContainer({ trade, livePrice, onClose }: { trade?: Trade, livePrice: number, onClose: () => void }) {
  return (
    <div className="bg-[#020408] relative group overflow-hidden">
      {!trade ? (
        <div className="w-full h-full flex flex-col items-center justify-center text-white/5 gap-4">
          <Plus size={40} strokeWidth={1} />
          <span className="text-[10px] tracking-[4px] uppercase font-bold">Awaiting Input</span>
        </div>
      ) : (
        <>
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-3">
              <span className="text-[14px] font-black tracking-widest text-white">{trade.symbol}</span>
              <div className={cn(
                "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest",
                trade.direction === 'LONG' ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
              )}>
                {trade.direction}
              </div>
            </div>
            <button onClick={onClose} className="text-white/20 hover:text-rose-400 transition-colors">
              <X size={16} />
            </button>
          </div>
          <div className="w-full h-full">
            <TradingViewChart trade={trade} livePrice={livePrice} />
          </div>
        </>
      )}
    </div>
  );
}

function PositionCard({ trade, pnl, onUpdate }: { trade: Trade; pnl: number; onUpdate: (s: 'success' | 'failed', p: number) => void }) {
  const isProfit = pnl >= 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="group bg-white/2 border border-white/5 p-5 rounded-2xl hover:border-[#00f2ff]/30 transition-all relative overflow-hidden"
    >
      <div className={cn(
        "absolute top-0 left-0 w-1 h-full",
        trade.direction === 'LONG' ? "bg-emerald-500" : "bg-rose-500"
      )} />

      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col">
          <span className="text-[15px] font-black text-white">{trade.symbol}</span>
          <span className="text-[9px] text-[#4a6278] uppercase tracking-[2px] font-bold">
            Entry @ {trade.entryLow.toFixed(2)}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className={cn(
            "text-[18px] font-black tracking-tight",
            isProfit ? "text-emerald-400" : "text-rose-500"
          )}>
            {isProfit ? '+' : ''}{pnl.toFixed(2)}%
          </span>
          <span className="text-[9px] text-white/20 uppercase font-black uppercase">Unrealized</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ActionButton
          label="Close Win"
          icon={<Check size={14} />}
          color="emerald"
          onClick={() => onUpdate('success', pnl)}
        />
        <ActionButton
          label="Close Loss"
          icon={<TrendingDown size={14} />}
          color="rose"
          onClick={() => onUpdate('failed', pnl)}
        />
      </div>
    </motion.div>
  );
}

function ActionButton({ label, icon, color, onClick }: { label: string; icon: React.ReactNode; color: 'emerald' | 'rose'; onClick: () => void }) {
  const colors = {
    emerald: "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-black border-emerald-500/20",
    rose: "bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-black border-rose-500/20"
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
        colors[color]
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function PageBtn({ label, onClick, disabled }: { label: string; onClick: () => void; disabled: boolean }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#4a6278] hover:text-white disabled:opacity-20 transition-colors"
    >
      {label}
    </button>
  );
}

function ViewToggle({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all",
      active ? "bg-[#00f2ff] text-black" : "text-[#4a6278] hover:text-white"
    )}>
      {icon}
      {label}
    </button>
  );
}

function NewTradeModal({ onClose }: { onClose: () => void }) {
  const createTrade = useMutation(api.trades.create);
  const [formData, setFormData] = useState({
    symbol: '',
    direction: 'LONG',
    entryLow: '',
    entryHigh: '',
    takeProfits: '',
    stopLoss: ''
  });

  const handleSubmit = async () => {
    if (!formData.symbol || !formData.entryLow || !formData.stopLoss) return;

    await createTrade({
      symbol: formData.symbol.toUpperCase(),
      direction: formData.direction,
      entryLow: parseFloat(formData.entryLow),
      entryHigh: formData.entryHigh ? parseFloat(formData.entryHigh) : undefined,
      takeProfits: formData.takeProfits.split('\n').map(v => parseFloat(v)).filter(v => !isNaN(v)),
      stopLoss: parseFloat(formData.stopLoss),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
        animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-[500px] bg-[#0d1016] border border-white/10 rounded-[32px] overflow-hidden relative shadow-[0_30px_100px_rgba(0,0,0,0.8)]"
      >
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-[20px] font-black text-white tracking-widest uppercase italic">Execute Strategy</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X size={20} /></button>
          </div>

          <div className="space-y-4">
            <InputGroup label="Symbol" placeholder="BTC/USDT" value={formData.symbol} onChange={v => setFormData({ ...formData, symbol: v })} />

            <div className="flex gap-3">
              <DirectionBtn active={formData.direction === 'LONG'} label="LONG" sub="Bullish" color="emerald" onClick={() => setFormData({ ...formData, direction: 'LONG' })} />
              <DirectionBtn active={formData.direction === 'SHORT'} label="SHORT" sub="Bearish" color="rose" onClick={() => setFormData({ ...formData, direction: 'SHORT' })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputGroup label="Entry Low" placeholder="0.00" value={formData.entryLow} onChange={v => setFormData({ ...formData, entryLow: v })} />
              <InputGroup label="Stop Loss" placeholder="0.00" value={formData.stopLoss} onChange={v => setFormData({ ...formData, stopLoss: v })} />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[#4a6278] uppercase tracking-[3px]">Profit Targets</label>
              <textarea
                className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-white focus:border-[#00f2ff]/30 outline-none h-24 resize-none transition-all placeholder-white/10"
                placeholder="One target per line..."
                value={formData.takeProfits}
                onChange={e => setFormData({ ...formData, takeProfits: e.target.value })}
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-5 bg-white text-black font-black uppercase tracking-[5px] rounded-[22px] hover:bg-[#00f2ff] transition-all"
          >
            Launch Command
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function InputGroup({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5 flex-1">
      <label className="text-[10px] font-black text-[#4a6278] uppercase tracking-[3px]">{label}</label>
      <input
        className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-white focus:border-[#00f2ff]/30 outline-none transition-all placeholder-white/10"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

function DirectionBtn({ active, label, sub, color, onClick }: { active: boolean; label: string; sub: string; color: 'emerald' | 'rose'; onClick: () => void }) {
  const styles = {
    emerald: active ? "bg-emerald-500 text-black shadow-[0_0_30px_rgba(16,185,129,0.3)]" : "bg-white/5 text-white/30 border-white/5 hover:border-emerald-500/30",
    rose: active ? "bg-rose-500 text-black shadow-[0_0_30px_rgba(244,63,94,0.3)]" : "bg-white/5 text-white/30 border-white/5 hover:border-rose-500/30"
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 p-4 rounded-2xl border transition-all flex flex-col items-center gap-1",
        styles[color]
      )}
    >
      <span className="text-[12px] font-black uppercase tracking-widest">{label}</span>
      <span className="text-[9px] font-bold opacity-60 uppercase">{sub}</span>
    </button>
  );
}
