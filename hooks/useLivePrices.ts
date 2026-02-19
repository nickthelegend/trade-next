'use client';

import { useState, useEffect } from 'react';

export function useLivePrices(symbols: string[]) {
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    if (symbols.length === 0) return;

    // Normalize symbols for Binance (e.g. BTC/USDT -> btcusdt, ATOM -> atomusdt)
    const normalize = (s: string) => {
        let clean = s.replace('$', '').replace('/', '').toLowerCase();
        if (!clean.endsWith('usdt')) clean += 'usdt';
        return clean;
    };

    const streams = symbols.map(s => `${normalize(s)}@trade`).join('/');
    const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);

    ws.onmessage = (event) => {
      try {
          const msg = JSON.parse(event.data);
          if (!msg.data) return;
          
          const binanceSymbol = msg.data.s.toLowerCase();
          // Find the original symbol that matches this binance symbol
          const originalSymbol = symbols.find(s => normalize(s) === binanceSymbol);
          
          if (originalSymbol) {
            setPrices(prev => ({
              ...prev,
              [originalSymbol]: parseFloat(msg.data.p)
            }));
          }
      } catch (e) {
          console.error("WS Error:", e);
      }
    };

    return () => ws.close();
  }, [symbols.join(',')]);

  return prices;
}
