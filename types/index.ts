export interface Trade {
  id: number;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  entry_low: number;
  entry_high: number;
  take_profits: number[];
  stop_loss: number;
  status: 'open' | 'success' | 'failed' | 'partial';
  created_at: string;
  closed_at?: string;
  pnl?: number;
  notes?: string;
}
