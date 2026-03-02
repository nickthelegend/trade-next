import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  trades: defineTable({
    symbol: v.string(),
    direction: v.string(), // "LONG" | "SHORT"
    entryLow: v.number(),
    entryHigh: v.optional(v.number()),
    takeProfits: v.array(v.number()),
    stopLoss: v.number(),
    status: v.string(), // "open" | "success" | "failed"
    pnl: v.optional(v.number()),
    closedAt: v.optional(v.string()),
    channel: v.optional(v.string()),
  }).index("by_status", ["status"]),
  
  settings: defineTable({
    key: v.string(),
    value: v.any(),
  }).index("by_key", ["key"]),
});
