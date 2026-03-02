"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Zap,
  Trash2,
  RefreshCw,
  X,
  TrendingDown,
  TrendingUp,
  ArrowLeft,
  ArrowRight,
  LayoutGrid,
  History,
  Briefcase
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Trade, Stats } from "../types";
import TradingViewChart from "../components/TradingViewChart";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Real-time Price monitoring using Binance Public API
function useCurrentPrice(symbol: string, initialPrice: number) {
  const [price, setPrice] = useState(initialPrice || 0);

  useEffect(() => {
    if (!symbol) return;

    // Format symbol for Binance (ETH/USDT -> ETHUSDT)
    const binanceSymbol = symbol.replace('/', '').replace('$', '').toUpperCase();

    const fetchPrice = async () => {
      try {
        const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`);
        const data = await res.json();
        if (data.price) {
          setPrice(parseFloat(data.price));
        }
      } catch (e) {
        console.error("Price fetch error:", e);
      }
    };

    fetchPrice(); // Initial fetch
    const interval = setInterval(fetchPrice, 5000); // Update every 5s
    return () => clearInterval(interval);
  }, [symbol]);

  return price;
}

export default function Dashboard() {
  const allTrades = (useQuery(api.trades.list) || []) as Trade[];
  const stats = (useQuery(api.trades.getStats) || { total: 0, wins: 0, losses: 0, totalPnl: 0 }) as Stats;
  const updateStatus = useMutation(api.trades.updateStatus);
  const removeTrade = useMutation(api.trades.remove);

  const [page, setPage] = useState(1);
  const [showNewTradeModal, setShowNewTradeModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);

  const perPage = 4;
  const totalPages = Math.ceil(allTrades.length / perPage) || 1;
  const currentTrades = allTrades.slice((page - 1) * perPage, page * perPage);
  const activeTrades = allTrades.filter(t => t.status === "OPEN");

  // Real Global Unrealized P&L Calculation
  const [unrealizedTotal, setUnrealizedTotal] = useState(0);

  useEffect(() => {
    const updateGlobalPnl = async () => {
      if (activeTrades.length === 0) {
        setUnrealizedTotal(0);
        return;
      }

      try {
        // Fetch all current prices for active trades in parallel
        const pricePromises = activeTrades.map(t => {
          const sym = t.symbol.replace('/', '').replace('$', '').toUpperCase();
          return fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${sym}`)
            .then(res => res.json())
            .then(data => ({ id: t._id, price: parseFloat(data.price || "0") }));
        });

        const prices = await Promise.all(pricePromises);

        let totalPnl = 0;
        activeTrades.forEach(t => {
          const current = prices.find(p => p.id === t._id)?.price || 0;
          const entry = t.entryLow > 0 ? (t.entryLow + (t.entryHigh || t.entryLow)) / 2 : 0;

          if (entry > 0 && current > 0) {
            const pnl = ((current - entry) / entry) * 100 * (t.direction === "LONG" ? 1 : -1);
            totalPnl += pnl;
          }
        });

        setUnrealizedTotal(totalPnl);
      } catch (e) {
        console.error("Global PNL Error:", e);
      }
    };

    updateGlobalPnl();
    const interval = setInterval(updateGlobalPnl, 10000); // Global update every 10s
    return () => clearInterval(interval);
  }, [activeTrades.length]);

  return (
    <div className="flex flex-col h-screen bg-[#080b0f] text-[#c9d8e8] font-mono overflow-hidden">
      {/* --- HEADER --- */}
      <header className="h-[65px] bg-[#0d1117] border-b border-[#1e2a38] flex items-center justify-between px-6 shrink-0 z-50 shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="font-black text-xl tracking-[5px] uppercase italic group cursor-pointer">
            <span className="text-[#00e5ff] drop-shadow-[0_0_10px_rgba(0,229,255,0.4)]">PAPER</span><span className="text-[#4a6278] group-hover:text-[#c9d8e8] transition-colors">TRADE</span>
          </div>

          <div className="h-8 w-[1px] bg-[#1e2a38]" />

          <div className="flex gap-2">
            <StatPill label="Positions" value={activeTrades.length} />
            <StatPill label="Win Rate" value={`${stats.total > 0 ? ((stats.wins / stats.total) * 100).toFixed(1) : 0}%`} color="text-[#00ff88]" />
          </div>
        </div>

        <div className="flex gap-10 items-center bg-[#111820]/40 px-8 py-2 border border-[#1e2a38]/50 rounded-full shadow-inner ring-1 ring-white/5">
          <StatPill
            label="Realized Growth"
            value={`${stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(2)}%`}
            color={stats.totalPnl >= 0 ? "text-[#00ff88]" : "text-[#ff3a5c]"}
            large
          />
          <div className="h-6 w-[1px] bg-[#1e2a38]" />
          <StatPill
            label="Live Exposure"
            value={`${unrealizedTotal >= 0 ? '+' : ''}${unrealizedTotal.toFixed(2)}%`}
            color={unrealizedTotal >= 0 ? "text-[#00ff88]" : "text-[#ff3a5c]"}
            large
            pulse={activeTrades.length > 0}
          />
        </div>

        <div className="flex items-center gap-2.5">
          <HeaderAction icon={<Briefcase size={14} />} label="Stats" onClick={() => setShowPortfolioModal(true)} />
          <HeaderAction icon={<History size={14} />} label="Ledger" onClick={() => setShowHistoryModal(true)} />
          <button
            onClick={() => setShowNewTradeModal(true)}
            className="group relative bg-[#00e5ff]/10 border border-[#00e5ff] text-[#00e5ff] px-6 py-2 text-[11px] uppercase tracking-[3px] font-bold hover:bg-[#00e5ff] hover:text-[#080b0f] transition-all duration-300 shadow-[0_0_20px_rgba(0,229,255,0.15)]"
          >
            <span className="relative z-10 flex items-center gap-2"><Plus size={14} /> NEW TRADE</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* --- MAIN AREA --- */}
        <section className="flex-1 flex flex-col overflow-hidden">
          {/* GRID TOOLBAR */}
          <div className="h-[45px] bg-[#0d1117] border-b border-[#1e2a38] flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-3">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="w-7 h-7 border border-[#1e2a38] flex items-center justify-center hover:border-[#00e5ff] hover:text-[#00e5ff] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ArrowLeft size={14} />
              </button>
              <span className="text-[11px] text-[#4a6278] tracking-widest uppercase">PAGE {page} / {totalPages}</span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="w-7 h-7 border border-[#1e2a38] flex items-center justify-center hover:border-[#00e5ff] hover:text-[#00e5ff] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ArrowRight size={14} />
              </button>
            </div>
            <div className="text-[10px] text-[#4a6278] tracking-[2px] uppercase flex items-center gap-2">
              <LayoutGrid size={12} /> 2×2 CHART GRID
            </div>
          </div>

          {/* CHART GRID */}
          <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-[2px] bg-[#1e2a38] border-b border-[#1e2a38]">
            {Array.from({ length: 4 }).map((_, i) => (
              <ChartCell key={i} trade={currentTrades[i]} />
            ))}
          </div>
        </section>

        {/* --- POSITIONS PANEL --- */}
        <aside className="w-[300px] bg-[#0d1117] border-l border-[#1e2a38] flex flex-col shrink-0">
          <div className="p-3 bg-[#111820] border-b border-[#1e2a38]">
            <h3 className="text-[#00e5ff] text-[12px] font-bold tracking-[3px] uppercase font-['Syne']">POSITIONS</h3>
            <p className="text-[10px] text-[#4a6278] tracking-widest uppercase mt-0.5">{activeTrades.length} ACTIVE</p>
          </div>

          <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-[#1e2a38] scrollbar-track-transparent">
            {allTrades.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-[#4a6278] text-[11px] tracking-widest gap-2 opacity-50 uppercase">
                <span className="text-3xl">◇</span>
                NO POSITIONS
              </div>
            ) : (
              allTrades.map((t) => (
                <PositionCard
                  key={t._id}
                  trade={t}
                  onUpdate={(status, pnl) => updateStatus({ id: t._id, status, pnl })}
                  onDelete={() => removeTrade({ id: t._id })}
                />
              ))
            )}
          </div>
        </aside>
      </div>

      {/* --- MODALS --- */}
      <AnimatePresence>
        {showNewTradeModal && <NewTradeModal onClose={() => setShowNewTradeModal(false)} />}
        {showHistoryModal && <HistoryModal trades={allTrades} onClose={() => setShowHistoryModal(false)} />}
        {showPortfolioModal && <PortfolioModal stats={stats} onClose={() => setShowPortfolioModal(false)} />}
      </AnimatePresence>
    </div>
  );
}

function StatPill({
  label,
  value,
  color = "text-[#00e5ff]",
  large,
  pulse
}: {
  label: string;
  value: string | number;
  color?: string;
  large?: boolean;
  pulse?: boolean;
}) {
  return (
    <div className={cn(
      "flex flex-col",
      large ? "gap-0.5 px-4" : "gap-1"
    )}>
      <span className={cn(
        "text-[#4a6278] uppercase tracking-[2px]",
        large ? "text-[9px]" : "text-[10px]"
      )}>{label}</span>
      <span className={cn(
        "font-black tracking-widest transition-all duration-500 font-['Syne']",
        color,
        large ? "text-lg" : "text-sm",
        pulse && "animate-pulse brightness-125"
      )}>{value}</span>
    </div>
  );
}

function HeaderAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="border border-[#1e2a38] px-3.5 py-1.5 text-[11px] uppercase tracking-widest hover:border-[#00e5ff] hover:text-[#00e5ff] transition-all flex items-center gap-2">
      {icon} {label}
    </button>
  );
}

function ChartCell({ trade }: { trade?: Trade }) {
  if (!trade) {
    return (
      <div className="bg-[#0d1117] flex flex-col">
        <div className="h-[30px] bg-[#111820] border-b border-[#1e2a38] flex items-center px-3">
          <span className="text-[12px] font-bold text-[#4a6278] tracking-widest">EMPTY SLOT</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-[#4a6278] text-[11px] tracking-widest gap-2 opacity-30 uppercase">
          <span className="text-2xl">◇</span>
          NO TRADE
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0d1117] flex flex-col relative group">
      <div className="h-[32px] bg-[#111820] border-b border-[#1e2a38] flex items-center justify-between px-3 shrink-0">
        <span className="text-[12px] font-bold tracking-widest">{trade.symbol}</span>
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-[10px] font-bold px-2 py-0.5 tracking-[2px] uppercase border",
            trade.direction === "LONG" ? "bg-[#00ff88]/15 text-[#00ff88] border-[#00ff88]/30" : "bg-[#ff3a5c]/15 text-[#ff3a5c] border-[#ff3a5c]/30"
          )}>
            {trade.direction}
          </span>
          <span className={cn(
            "text-[9px] font-bold px-1.5 py-0.5 tracking-[2px] uppercase border",
            trade.status === "OPEN" ? "text-[#ffd54f] border-[#ffd54f]/40 bg-[#ffd54f]/10" :
              trade.status === "WON" ? "text-[#00ff88] border-[#00ff88]/40 bg-[#00ff88]/10" :
                "text-[#ff3a5c] border-[#ff3a5c]/40 bg-[#ff3a5c]/10"
          )}>
            {trade.status}
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <TradingViewChart trade={trade} />
      </div>
    </div>
  );
}

function PositionCard({ trade, onUpdate, onDelete }: { trade: Trade; onUpdate: (s: any, p: any) => void; onDelete: () => void }) {
  const entry = (trade.entryLow + (trade.entryHigh || trade.entryLow)) / 2;
  const currentPrice = useCurrentPrice(trade.symbol, entry);

  // Calculate Live Unrealized P&L
  const livePnl = (trade.status === "OPEN" && entry > 0)
    ? ((currentPrice - entry) / entry) * 100 * (trade.direction === "LONG" ? 1 : -1)
    : trade.pnl || 0;

  const pnlClass = livePnl > 0 ? "text-[#00ff88]" : livePnl < 0 ? "text-[#ff3a5c]" : "text-[#4a6278]";

  return (
    <div className={cn(
      "bg-[#111820] border border-[#1e2a38] p-2.5 px-3 mb-2 relative overflow-hidden transition-all hover:border-[#00e5ff] group",
      trade.direction === "LONG" ? "border-l-[3px] border-l-[#00ff88]" : "border-l-[3px] border-l-[#ff3a5c]"
    )}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[12px] font-bold tracking-widest">{trade.symbol}</span>
        <span className={cn(
          "text-[9px] font-bold px-1.5 py-0.5 tracking-[2px] uppercase border",
          trade.status === "OPEN" ? "text-[#ffd54f] border-[#ffd54f]/40 bg-[#ffd54f]/8" :
            trade.status === "WON" ? "text-[#00ff88] border-[#00ff88]/40 bg-[#00ff88]/8" :
              "text-[#ff3a5c] border-[#ff3a5c]/40 bg-[#ff3a5c]/8"
        )}>
          {trade.status}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className={cn("text-[9px] font-bold tracking-[2px] uppercase", trade.direction === "LONG" ? "text-[#00ff88]" : "text-[#ff3a5c]")}>
          {trade.direction === "LONG" ? "↑" : "↓"} {trade.direction}
        </span>
        <span className={cn(
          "text-[14px] font-black tracking-widest font-['Syne'] transition-all",
          pnlClass,
          trade.status === "OPEN" && entry > 0 && "animate-pulse"
        )}>
          {entry > 0 ? (livePnl > 0 ? '+' : '') + livePnl.toFixed(2) + '%' : "WAITING..."}
        </span>
      </div>

      <div className="flex justify-between items-end mt-2">
        <div className="text-[10px] text-[#4a6278]">
          <div className="tracking-widest uppercase text-[8px] mb-0.5 opacity-50">Entry Zone</div>
          <div className="text-[#c9d8e8]">{trade.entryLow}{trade.entryHigh ? ` – ${trade.entryHigh}` : ''}</div>
        </div>
        <div className="text-[10px] text-right text-[#4a6278]">
          <div className="tracking-widest uppercase text-[8px] mb-0.5 opacity-50">Mark Price</div>
          <div className={cn("font-bold tabular-nums", pnlClass)}>{currentPrice.toFixed(4)}</div>
        </div>
      </div>

      <div className="flex gap-1 mt-3 opactiy-0 group-hover:opacity-100 transition-opacity">
        {trade.status === "OPEN" && (
          <>
            <button onClick={() => onUpdate("WON", livePnl)} className="flex-1 py-1 px-1 text-[9px] font-bold tracking-[2px] border border-[#00ff88]/30 text-[#4a6278] uppercase hover:text-[#00ff88] hover:bg-[#00ff88]/10 transition-all">TAKE PROFIT</button>
            <button onClick={() => onUpdate("LOST", livePnl)} className="flex-1 py-1 px-1 text-[9px] font-bold tracking-[2px] border border-[#ff3a5c]/30 text-[#4a6278] uppercase hover:text-[#ff3a5c] hover:bg-[#ff3a5c]/10 transition-all">CLOSE</button>
          </>
        )}
        <button onClick={onDelete} className="w-8 py-1 px-1 text-[9px] border border-[#1e2a38] text-[#4a6278] hover:text-[#ff3a5c] hover:border-[#ff3a5c] transition-all">⌫</button>
      </div>

      {/* Background Glow */}
      <div className={cn(
        "absolute -right-4 -bottom-4 w-16 h-16 blur-2xl opacity-10 rounded-full",
        trade.direction === "LONG" ? "bg-[#00ff88]" : "bg-[#ff3a5c]"
      )} />
    </div>
  );
}

function NewTradeModal({ onClose }: { onClose: () => void }) {
  const createTrade = useMutation(api.trades.create);
  const [formData, setFormData] = useState({
    symbol: '',
    direction: 'LONG' as 'LONG' | 'SHORT',
    entryLow: '',
    entryHigh: '',
    tp: '',
    sl: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTrade({
      symbol: formData.symbol.toUpperCase(),
      direction: formData.direction,
      entryLow: parseFloat(formData.entryLow),
      entryHigh: parseFloat(formData.entryHigh || formData.entryLow),
      takeProfits: formData.tp.split('\n').map(p => parseFloat(p)).filter(p => !isNaN(p)),
      stopLoss: parseFloat(formData.sl)
    });
    onClose();
  };

  return (
    <ModalBase title="Open Position" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-group">
          <label className="text-[10px] text-[#4a6278] uppercase tracking-[2px] block mb-1">Symbol</label>
          <input
            autoFocus
            className="w-full bg-[#080b0f] border border-[#1e2a38] p-2.5 text-[12px] outline-none focus:border-[#00e5ff] transition-all"
            placeholder="e.g. LINK/USDT"
            value={formData.symbol}
            onChange={e => setFormData({ ...formData, symbol: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="text-[10px] text-[#4a6278] uppercase tracking-[2px] block mb-1">Direction</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, direction: 'LONG' })}
              className={cn("flex-1 p-2.5 border text-[11px] uppercase tracking-widest transition-all", formData.direction === 'LONG' ? "border-[#00ff88] text-[#00ff88] bg-[#00ff88]/8" : "border-[#1e2a38] text-[#4a6278]")}
            >↑ LONG</button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, direction: 'SHORT' })}
              className={cn("flex-1 p-2.5 border text-[11px] uppercase tracking-widest transition-all", formData.direction === 'SHORT' ? "border-[#ff3a5c] text-[#ff3a5c] bg-[#ff3a5c]/8" : "border-[#1e2a38] text-[#4a6278]")}
            >↓ SHORT</button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="form-group">
            <label className="text-[10px] text-[#4a6278] uppercase tracking-[2px] block mb-1">Entry (Low)</label>
            <input
              className="w-full bg-[#080b0f] border border-[#1e2a38] p-2.5 text-[12px] outline-none focus:border-[#00e5ff] transition-all"
              placeholder="0.00"
              value={formData.entryLow}
              onChange={e => setFormData({ ...formData, entryLow: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="text-[10px] text-[#4a6278] uppercase tracking-[2px] block mb-1">Entry (High)</label>
            <input
              className="w-full bg-[#080b0f] border border-[#1e2a38] p-2.5 text-[12px] outline-none focus:border-[#00e5ff] transition-all"
              placeholder="0.00"
              value={formData.entryHigh}
              onChange={e => setFormData({ ...formData, entryHigh: e.target.value })}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="text-[10px] text-[#4a6278] uppercase tracking-[2px] block mb-1">Take Profits (One per line)</label>
          <textarea
            rows={3}
            className="w-full bg-[#080b0f] border border-[#1e2a38] p-2.5 text-[12px] outline-none focus:border-[#00e5ff] transition-all resize-none"
            placeholder="8.800"
            value={formData.tp}
            onChange={e => setFormData({ ...formData, tp: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="text-[10px] text-[#4a6278] uppercase tracking-[2px] block mb-1">Stop Loss</label>
          <input
            className="w-full bg-[#080b0f] border border-[#1e2a38] p-2.5 text-[12px] outline-none focus:border-[#00e5ff] transition-all"
            placeholder="0.00"
            value={formData.sl}
            onChange={e => setFormData({ ...formData, sl: e.target.value })}
            required
          />
        </div>

        <button className="w-full bg-[#00e5ff]/10 border border-[#00e5ff] text-[#00e5ff] py-3 text-[11px] uppercase tracking-[3px] font-bold hover:bg-[#00e5ff]/20 transition-all mt-6 shadow-[0_0_20px_rgba(0,229,255,0.05)]">
          Open Position →
        </button>
      </form>
    </ModalBase>
  );
}

function HistoryModal({ trades, onClose }: { trades: Trade[]; onClose: () => void }) {
  return (
    <ModalBase title="Trade History" onClose={onClose} large>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[11px] border-collapse">
          <thead>
            <tr className="border-b border-[#1e2a38] text-[#4a6278] uppercase tracking-widest text-[10px]">
              <th className="p-3">Symbol</th>
              <th className="p-3">Side</th>
              <th className="p-3">Status</th>
              <th className="p-3">Entry</th>
              <th className="p-3">P&L</th>
              <th className="p-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {trades.map(t => (
              <tr key={t._id} className="border-b border-[#111820] hover:bg-white/[0.02]">
                <td className="p-3 font-bold">{t.symbol}</td>
                <td className={cn("p-3", t.direction === "LONG" ? "text-[#00ff88]" : "text-[#ff3a5c]")}>{t.direction}</td>
                <td className="p-3 uppercase">{t.status}</td>
                <td className="p-3 text-[#4a6278]">{t.entryLow}</td>
                <td className={cn("p-3 font-bold", (t.pnl || 0) >= 0 ? "text-[#00ff88]" : "text-[#ff3a5c]")}>{(t.pnl || 0).toFixed(2)}%</td>
                <td className="p-3 text-[#4a6278]">{new Date(t._creationTime).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ModalBase>
  );
}

function PortfolioModal({ stats, onClose }: { stats: Stats; onClose: () => void }) {
  const winRate = stats.total > 0 ? ((stats.wins / stats.total) * 100).toFixed(1) : 0;
  return (
    <ModalBase title="Portfolio Analytics" onClose={onClose}>
      <div className="space-y-4">
        <SummaryBox label="Total Amount of Trades" value={stats.total} color="text-[#00e5ff]" />
        <SummaryBox label="Total Portfolio P&L" value={`${stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(2)}%`} color={stats.totalPnl >= 0 ? "text-[#00ff88]" : "text-[#ff3a5c]"} />
        <SummaryBox label="Win Rate" value={`${winRate}%`} color="text-[#00ff88]" />
      </div>
    </ModalBase>
  );
}

function SummaryBox({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-[#111820] border border-[#1e2a38] p-4 text-center">
      <div className="text-[9px] text-[#4a6278] uppercase tracking-[2px] mb-1.5">{label}</div>
      <div className={cn("text-2xl font-bold tracking-tighter", color)}>{value}</div>
    </div>
  );
}

function ModalBase({ title, children, onClose, large }: { title: string; children: React.ReactNode; onClose: () => void; large?: boolean }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn("bg-[#0d1117] border border-[#1e2a38] relative z-10 w-full overflow-hidden", large ? "max-w-4xl" : "max-w-md")}
      >
        <div className="flex items-center justify-between p-4 bg-[#111820] border-b border-[#1e2a38]">
          <span className="text-[13px] font-bold text-[#00e5ff] tracking-[3px] uppercase font-['Syne']">{title}</span>
          <button onClick={onClose} className="text-[#4a6278] hover:text-[#c9d8e8] transition-all"><X size={20} /></button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
