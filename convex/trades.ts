import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("trades").order("desc").collect();
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const trades = await ctx.db.query("trades").collect();
    const total = trades.length;
    const wins = trades.filter((t) => t.status === "WON").length;
    const losses = trades.filter((t) => t.status === "LOST").length;
    const totalPnl = trades.reduce((acc, curr) => acc + (curr.pnl || 0), 0);
    return { total, wins, losses, totalPnl };
  },
});

export const create = mutation({
  args: {
    symbol: v.string(),
    direction: v.string(),
    entryLow: v.number(),
    entryHigh: v.optional(v.number()),
    takeProfits: v.array(v.number()),
    stopLoss: v.number(),
    channel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("trades", {
      ...args,
      status: "OPEN",
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("trades"),
    status: v.string(),
    pnl: v.optional(v.number()),
    closedAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("trades") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
