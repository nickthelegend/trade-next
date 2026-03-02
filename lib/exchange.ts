import ccxt from 'ccxt';

/**
 * Trade engine to interact with crypto exchanges.
 * Expects process.env.EXCHANGE_API_KEY and process.env.EXCHANGE_SECRET
 */
export class TradeEngine {
    private exchange: ccxt.Exchange;

    constructor(exchangeId: string = 'bybit') {
        // @ts-ignore
        this.exchange = new ccxt[exchangeId]({
            apiKey: process.env.EXCHANGE_API_KEY,
            secret: process.env.EXCHANGE_SECRET,
            options: {
                defaultType: 'future', // Use futures by default for long/short
            },
        });
    }

    async fetchTicker(symbol: string) {
        try {
            const ticker = await this.exchange.fetchTicker(symbol);
            return ticker.last;
        } catch (e) {
            console.error(`Error fetching ticker for ${symbol}:`, e);
            return null;
        }
    }

    async placeOrder(symbol: string, side: 'buy' | 'sell', amount: number, price?: number) {
        try {
            if (price) {
                return await this.exchange.createLimitOrder(symbol, side, amount, price);
            } else {
                return await this.exchange.createMarketOrder(symbol, side, amount);
            }
        } catch (e) {
            console.error(`Error placing ${side} order for ${symbol}:`, e);
            throw e;
        }
    }

    async getPositions() {
        try {
            if (this.exchange.has['fetchPositions']) {
                return await this.exchange.fetchPositions();
            }
            return [];
        } catch (e) {
            console.error('Error fetching positions:', e);
            return [];
        }
    }
}

export const tradeEngine = new TradeEngine();
