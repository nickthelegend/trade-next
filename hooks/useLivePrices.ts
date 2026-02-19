'use client';

import { useState, useEffect } from 'react';

export function useLivePrices(symbols: string[]) {
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    if (symbols.length === 0) return;

    // Normalize symbols for Binance (e.g. BTC/USDT -> btcusdt)
    const streams = symbols.map(s => `${s.replace('/', '').toLowerCase()}@trade`).join('/');
    const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      const symbol = symbols.find(s => s.replace('/', '').toLowerCase() === msg.data.s.toLowerCase());
      if (symbol) {
        setPrices(prev => ({
          ...prev,
          [symbol]: parseFloat(msg.data.p)
        }));
      }
    };

    return () => ws.close();
  }, [symbols.join(',')]);

  return prices;
}
