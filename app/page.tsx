"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  LayoutDashboard,
  List,
  Settings,
  Plus,
  Bell,
  Search,
  ChevronRight,
  Activity,
  History,
  Zap,
  Globe,
  Trash2,
  RefreshCw,
  MoreVertical,
  X
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Trade, Stats } from "../types";
import TradingViewChart from "../components/TradingViewChart";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const trades = (useQuery(api.trades.list) || []) as Trade[];
  const stats = (useQuery(api.trades.getStats) || { total: 0, wins: 0, losses: 0, totalPnl: 0 }) as Stats;

  const updateStatus = useMutation(api.trades.updateStatus);
  const removeTrade = useMutation(api.trades.remove);

  const [activeTab, setActiveTab] = useState("live");
  const [showNewTradeModal, setShowNewTradeModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTrades = trades.filter(t =>
    t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.channel?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#0a0b10] text-white selection:bg-blue-500/30">
      {/* --- SIDEBAR --- */}
      <aside className="w-20 lg:w-64 border-r border-white/5 bg-black/20 backdrop-blur-3xl flex flex-col items-center lg:items-stretch py-8 z-50">
        <div className="px-6 mb-12 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center glow-blue">
            <Zap className="w-6 h-6 text-white fill-current" />
          </div>
          <span className="hidden lg:block font-black text-xl tracking-tighter uppercase italic">
            Trade<span className="text-blue-500">Next</span>
          </span>
        </div>

        <nav className="flex-1 px-4 space-y-2 w-full">
          <SidebarItem icon={<LayoutDashboard />} label="Dashboard" active={activeTab === "live"} onClick={() => setActiveTab("live")} />
          <SidebarItem icon={<History />} label="Trade History" active={activeTab === "history"} onClick={() => setActiveTab("history")} />
          <SidebarItem icon={<Globe />} label="Signals" active={activeTab === "signals"} onClick={() => setActiveTab("signals")} />
          <SidebarItem icon={<Settings />} label="Settings" active={activeTab === "settings"} onClick={() => setActiveTab("settings")} />
        </nav>

        <div className="px-4 mt-auto">
          <div className="glass rounded-2xl p-4 hidden lg:block overflow-hidden relative group">
            <div className="absolute inset-0 bg-blue-500/10 scale-0 group-hover:scale-100 transition-transform duration-500 rounded-full" />
            <div className="relative z-10">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Status</p>
              <p className="text-xs font-medium text-white/50">Production Ready</p>
            </div>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* --- HEADER --- */}
        <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-black/40 backdrop-blur-md z-40">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold capitalize">{activeTab} View</h1>
            <div className="h-8 w-px bg-white/10 hidden md:block" />
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Search trades or channels..."
                className="bg-white/5 border border-white/5 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500/50 w-64 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-white/5 rounded-full px-4 py-1.5 border border-white/5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Live Engine</span>
            </div>
            <NavAction icon={<Bell />} />
            <button
              onClick={() => setShowNewTradeModal(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-lg glow-blue flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Trade</span>
            </button>
          </div>
        </header>

        {/* --- DASHBOARD GRID --- */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          {/* STATS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <StatCard label="Total Trades" value={stats.total.toString()} sub="+12% from last week" icon={<Activity className="text-blue-400" />} />
            <StatCard label="Win Rate" value={`${Math.round((stats.wins / (stats.total || 1)) * 100)}%`} sub={`${stats.wins} Wins / ${stats.losses} Losses`} icon={<Zap className="text-amber-400" />} />
            <StatCard label="Total PnL" value={`$${stats.totalPnl.toFixed(2)}`} sub="All time profits" icon={<TrendingUp className="text-emerald-400" />} trend={stats.totalPnl >= 0 ? "up" : "down"} />
            <StatCard label="Active" value={trades.filter(t => t.status === "OPEN").length.toString()} sub="Trades currently running" icon={<Bell className="text-purple-400" />} />
          </div>

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-black uppercase tracking-[4px] text-white/40">Market Positions</h2>
            <div className="flex gap-2">
              <TabSelector active={activeTab === "live"} label="Active" onClick={() => setActiveTab("live")} />
              <TabSelector active={activeTab === "history"} label="Closed" onClick={() => setActiveTab("history")} />
            </div>
          </div>

          {filteredTrades.length === 0 ? (
            <div className="h-96 glass rounded-[32px] flex flex-col items-center justify-center border-dashed border-white/10">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-white/20" />
              </div>
              <p className="text-white/40 font-medium">No trading positions found</p>
              <p className="text-white/20 text-xs mt-1">Start a trade or wait for signals</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {filteredTrades.map((trade) => (
                  <TradeCard
                    key={trade._id}
                    trade={trade}
                    onUpdate={(status, pnl) => updateStatus({ id: trade._id, status, pnl })}
                    onDelete={() => removeTrade({ id: trade._id })}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* --- NEW TRADE MODAL --- */}
      {showNewTradeModal && <NewTradeModal onClose={() => setShowNewTradeModal(false)} />}
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group relative",
        active ? "bg-blue-600 text-white shadow-xl glow-blue" : "text-white/40 hover:bg-white/5 hover:text-white"
      )}
    >
      <span className={active ? "scale-110" : "group-hover:scale-110 transition-transform"}>{icon}</span>
      <span className="hidden lg:block font-bold text-sm tracking-tight">{label}</span>
      {active && <motion.div layoutId="sidebar-active" className="absolute left-0 w-1 h-6 bg-white rounded-full lg:hidden" />}
    </button>
  );
}

function StatCard({ label, value, sub, icon, trend }: { label: string; value: string; sub: string; icon: React.ReactNode; trend?: "up" | "down" }) {
  return (
    <div className="glass rounded-[24px] p-6 glass-hover group overflow-hidden relative">
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
          {icon}
        </div>
        {trend && (
          <div className={cn(
            "px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1",
            trend === "up" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
          )}>
            {trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend === "up" ? "+14%" : "-2%"}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-3xl font-bold tracking-tight mb-1">{value}</h3>
        <p className="text-[10px] text-white/30 uppercase tracking-[2px] font-black">{label}</p>
        <p className="text-xs text-white/20 mt-3 font-medium">{sub}</p>
      </div>
    </div>
  );
}

function TradeCard({ trade, onUpdate, onDelete }: { trade: Trade; onUpdate: (s: any, p: any) => void; onDelete: () => void }) {
  const isProfit = (trade.pnl || 0) >= 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass rounded-[32px] overflow-hidden group border-white/5 hover:border-blue-500/20 transition-all shadow-2xl"
    >
      <div className="p-6 pb-2">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-lg shadow-lg">
              {trade.symbol.slice(0, 1)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-lg leading-tight">{trade.symbol}</h4>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                  trade.direction === "LONG" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                )}>
                  {trade.direction}
                </span>
              </div>
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider">{trade.channel || "Manual Trade"}</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className={cn(
              "text-xl font-bold tracking-tighter",
              isProfit ? "text-emerald-400" : "text-rose-400"
            )}>
              {trade.pnl ? `${isProfit ? '+' : ''}${trade.pnl.toFixed(2)}%` : '0.00%'}
            </span>
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Current PnL</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <TradeStat label="Entry" value={trade.entryLow.toString()} />
          <TradeStat label="Target" value={trade.takeProfits[0]?.toString() || "N/A"} />
          <TradeStat label="Stop" value={trade.stopLoss.toString()} color="text-rose-400/70" />
        </div>
      </div>

      <div className="h-48 relative bg-black/40">
        <TradingViewChart trade={trade} />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      </div>

      <div className="p-4 bg-white/[0.02] flex items-center justify-between border-t border-white/5">
        <div className="flex gap-2">
          {trade.status === "OPEN" ? (
            <>
              <ActionButton label="Win" icon={<TrendingUp className="w-3.5 h-3.5" />} color="emerald" onClick={() => onUpdate("WON", 15.5)} />
              <ActionButton label="Loss" icon={<TrendingDown className="w-3.5 h-3.5" />} color="rose" onClick={() => onUpdate("LOST", -10.0)} />
            </>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
              <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", trade.status === "WON" ? "bg-emerald-500" : "bg-rose-500")} />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{trade.status}</span>
            </div>
          )}
        </div>
        <button onClick={onDelete} className="p-2.5 rounded-xl text-white/20 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

function TradeStat({ label, value, color = "text-white/60" }: { label: string; value: string; color?: string }) {
  return (
    <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
      <p className="text-[9px] font-black text-white/20 uppercase tracking-[2px] mb-1">{label}</p>
      <p className={cn("text-xs font-bold font-mono tracking-tight", color)}>{value}</p>
    </div>
  );
}

function ActionButton({ label, icon, color, onClick }: { label: string; icon: React.ReactNode; color: 'emerald' | 'rose'; onClick: () => void }) {
  const styles = {
    emerald: "bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.2)]",
    rose: "bg-rose-500 hover:bg-rose-400 text-black shadow-[0_0_20px_rgba(244,63,94,0.2)]"
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-black uppercase tracking-wider transition-all",
        styles[color]
      )}
    >
      {icon} {label}
    </button>
  );
}

function TabSelector({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
        active ? "bg-white/10 text-white border border-white/20" : "text-white/20 hover:text-white"
      )}
    >
      {label}
    </button>
  );
}

function NavAction({ icon }: { icon: React.ReactNode }) {
  return (
    <button className="w-10 h-10 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all">
      {icon}
    </button>
  );
}

function NewTradeModal({ onClose }: { onClose: () => void }) {
  const createTrade = useMutation(api.trades.create);
  const [formData, setFormData] = useState<{
    symbol: string;
    direction: "LONG" | "SHORT";
    entryLow: string;
    entryHigh: string;
    tp1: string;
    sl: string;
  }>({
    symbol: '',
    direction: 'LONG',
    entryLow: '',
    entryHigh: '',
    tp1: '',
    sl: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTrade({
      symbol: formData.symbol.toUpperCase(),
      direction: formData.direction,
      entryLow: parseFloat(formData.entryLow),
      entryHigh: parseFloat(formData.entryHigh || formData.entryLow),
      takeProfits: [parseFloat(formData.tp1)],
      stopLoss: parseFloat(formData.sl)
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 pb-20 sm:pb-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass w-full max-w-xl rounded-[40px] overflow-hidden relative z-10"
      >
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-blue-600/5">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-1">Execute Trade</h2>
            <p className="text-white/40 text-xs font-medium">Configure and broadcast position to the engine</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/5 transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-white/20 uppercase tracking-[4px]">Symbol & Side</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                autoFocus
                placeholder="BTC/USDT"
                className="bg-white/5 border border-white/5 rounded-2xl p-4 focus:outline-none focus:border-blue-500/50 transition-all font-bold"
                value={formData.symbol}
                onChange={e => setFormData({ ...formData, symbol: e.target.value })}
                required
              />
              <div className="flex glass rounded-2xl p-1">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, direction: 'LONG' })}
                  className={cn("flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all", formData.direction === 'LONG' ? "bg-emerald-500 text-black shadow-lg" : "text-white/30")}
                >LONG</button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, direction: 'SHORT' })}
                  className={cn("flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all", formData.direction === 'SHORT' ? "bg-rose-500 text-black shadow-lg" : "text-white/30")}
                >SHORT</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <InputGroup label="Entry" placeholder="0.00" value={formData.entryLow} onChange={v => setFormData({ ...formData, entryLow: v })} />
            <InputGroup label="Stop Loss" placeholder="0.00" value={formData.sl} onChange={v => setFormData({ ...formData, sl: v })} />
          </div>

          <InputGroup label="Take Profit 1" placeholder="0.00" value={formData.tp1} onChange={v => setFormData({ ...formData, tp1: v })} />

          <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-[24px] font-black text-sm uppercase tracking-[4px] transition-all shadow-2xl glow-blue group">
            <span className="flex items-center justify-center gap-3">
              <Zap className="w-5 h-5 fill-current group-hover:animate-bounce" />
              Initialize Position
            </span>
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function InputGroup({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-white/20 uppercase tracking-[3px] ml-4">{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 focus:outline-none focus:border-blue-500/50 transition-all font-mono"
        value={value}
        onChange={e => onChange(e.target.value)}
        required
      />
    </div>
  );
}
