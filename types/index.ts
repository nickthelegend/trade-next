import { Id } from "@/convex/_generated/dataModel";

export interface Trade {
  _id: Id<"trades">;
  _creationTime: number;
  symbol: string;
  direction: string;
  entryLow: number;
  entryHigh?: number;
  takeProfits: number[];
  stopLoss: number;
  status: string;
  pnl?: number;
  closedAt?: string;
  channel?: string;
}

export interface Stats {
  total: number;
  wins: number;
  losses: number;
  totalPnl: number;
}
