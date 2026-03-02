import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

export const signalWebhook = httpAction(async (ctx, request) => {
    const body = await request.json();

    // Basic validation
    if (!body.symbol || !body.direction) {
        return new Response("Missing fields", { status: 400 });
    }

    // Use a mutation to insert the trade
    const tradeId = await ctx.runMutation(api.trades.create, {
        symbol: body.symbol,
        direction: body.direction,
        entryLow: body.entryLow,
        entryHigh: body.entryHigh,
        takeProfits: body.takeProfits,
        stopLoss: body.stopLoss,
        channel: body.channel,
    });

    return new Response(JSON.stringify({ tradeId }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
});

http.route({
    path: "/signalWebhook",
    method: "POST",
    handler: signalWebhook,
});

export default http;
