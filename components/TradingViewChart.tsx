'use client';

import { useEffect, useRef } from 'react';
import { createChart, ColorType, ISeriesApi, CandlestickData, Time, CandlestickSeries, createSeriesMarkers } from 'lightweight-charts';
import { Trade } from '@/types';

interface ChartProps {
  trade: Trade;
  livePrice?: number;
}

export default function TradingViewChart({ trade, livePrice }: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'>>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0d1117' },
        textColor: '#4a6278',
      },
      grid: {
        vertLines: { color: '#111820' },
        horzLines: { color: '#111820' },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#00ff88',
      downColor: '#ff3a5c',
      borderVisible: false,
      wickUpColor: '#00ff88',
      wickDownColor: '#ff3a5c',
    });

    // Mock data generation (real trading apps would fetch historical data here)
    const data = generateMockData(trade);
    series.setData(data);

    // Add Markers (v5 syntax: createSeriesMarkers primitive)
    const entryTime = Math.floor(new Date(trade.created_at).getTime() / 1000) as Time;
    createSeriesMarkers(series, [
      {
        time: entryTime,
        position: 'inBar',
        color: '#ffd54f',
        shape: 'arrowUp',
        text: 'ENTRY',
        size: 1,
      },
    ]);

    // Horizontal Lines (Price Levels)
    const drawLine = (price: number, color: string, title: string) => {
      series.createPriceLine({
        price: price,
        color: color,
        lineWidth: 1,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: title,
      });
    };

    drawLine(trade.entry_low, 'rgba(255,213,79,0.5)', 'Entry');
    if (trade.entry_high !== trade.entry_low) {
        drawLine(trade.entry_high, 'rgba(255,213,79,0.5)', 'Entry');
    }
    trade.take_profits.forEach((tp, i) => drawLine(tp, '#00ff88', `TP${i + 1}`));
    drawLine(trade.stop_loss, '#ff3a5c', 'SL');

    chart.timeScale().fitContent();

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current!.clientWidth });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [trade.id]); // Stability fix: only re-init if ID changes

  return <div ref={chartContainerRef} className="w-full h-full" />;
}

function generateMockData(trade: Trade): CandlestickData<Time>[] {
  const data: CandlestickData<Time>[] = [];
  const entryPrice = (trade.entry_low + trade.entry_high) / 2;
  let currentPrice = entryPrice * (trade.direction === 'LONG' ? 0.98 : 1.02);
  const now = Math.floor(Date.now() / 1000);

  for (let i = 60; i >= 0; i--) {
    const time = (now - i * 3600) as Time;
    const vol = entryPrice * 0.008;
    const open = currentPrice;
    const close = currentPrice + (Math.random() - 0.48) * vol;
    const high = Math.max(open, close) + Math.random() * (vol * 0.5);
    const low = Math.min(open, close) - Math.random() * (vol * 0.5);
    
    data.push({ time, open, high, low, close });
    currentPrice = close;
  }
  return data;
}
