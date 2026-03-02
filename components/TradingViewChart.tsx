"use client";

import { useEffect, useRef } from 'react';
import {
  createChart,
  ColorType,
  CandlestickSeries,
  LineSeries,
  createSeriesMarkers,
  Time
} from 'lightweight-charts';
import { Trade } from '../types';

export default function TradingViewChart({ trade }: { trade: Trade }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const handleResize = () => {
      chartRef.current?.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0d1117' },
        textColor: '#4a6278',
        fontSize: 10,
        fontFamily: 'Space Mono, monospace',
      },
      grid: {
        vertLines: { color: '#111820' },
        horzLines: { color: '#111820' },
      },
      rightPriceScale: {
        borderColor: '#1e2a38',
        scaleMargins: { top: 0.05, bottom: 0.05 }, // Taller candles
        autoScale: true,
      },
      timeScale: {
        borderColor: '#1e2a38',
        timeVisible: true,
        barSpacing: 20, // Aggressive horizontal stretch
        rightOffset: 15,
        fixLeftEdge: true,
      },
      crosshair: {
        vertLine: { color: 'rgba(0, 229, 255, 0.4)', width: 1, style: 2 },
        horzLine: { color: 'rgba(0, 229, 255, 0.4)', width: 1, style: 2 },
      },
      handleScroll: true,
      handleScale: true,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00ff88',
      downColor: '#ff3a5c',
      borderVisible: false,
      wickUpColor: '#00ff88',
      wickDownColor: '#ff3a5c',
    });

    // Generate Mock Data for V5
    const data: { time: Time; open: number; high: number; low: number; close: number }[] = [];
    const entry = trade.entryLow > 0 ? trade.entryLow : 100; // Fallback to 100 if entry is 0 to keep chart visible
    const now = Math.floor(Date.now() / 1000);
    const startTime = (trade._creationTime ? Math.floor(trade._creationTime / 1000) : now - 3600 * 24) as number;

    let currentPrice = entry * (trade.direction === 'LONG' ? 0.95 : 1.05);
    const steps = 120; // More history
    const timeStep = 3600; // 1 hour steps

    for (let i = 0; i < steps; i++) {
      const time = (startTime + (i * timeStep)) as Time;
      const vol = entry * 0.008;
      const open = currentPrice;
      const close = open + (Math.random() - 0.48) * vol * 2.5; // More volatility for "taller" candles
      const high = Math.max(open, close) + vol * 0.8;
      const low = Math.min(open, close) - vol * 0.8;

      data.push({ time, open, high, low, close });
      currentPrice = close;
    }

    candleSeries.setData(data);

    // Auto-fit content to the container
    chart.timeScale().fitContent();

    // Entry Markers using createSeriesMarkers (V5 Syntax)
    const entryTime = (trade._creationTime ? Math.floor(trade._creationTime / 1000) : data[30].time) as Time;
    createSeriesMarkers(candleSeries, [
      {
        time: entryTime,
        position: 'inBar',
        color: '#ffd54f',
        shape: 'arrowUp',
        text: 'ENTRY',
        size: 1,
      },
    ]);

    // Price Lines
    const drawLine = (price: number, color: string, style: number, title: string) => {
      const line = chart.addSeries(LineSeries, {
        color: color,
        lineWidth: 1,
        lineStyle: style,
        lastValueVisible: true,
        title: title,
        priceLineVisible: false,
      });
      line.setData(data.map(d => ({ time: d.time, value: price })));
    };

    drawLine(trade.entryLow, 'rgba(255, 213, 79, 0.5)', 2, 'Entry');
    if (trade.entryHigh && trade.entryHigh !== trade.entryLow) {
      drawLine(trade.entryHigh, 'rgba(255, 213, 79, 0.5)', 2, 'Entry');
    }

    trade.takeProfits.forEach((tp, i) => {
      drawLine(tp, `rgba(0, 255, 136, ${0.3 + i * 0.1})`, 3, `TP${i + 1}`);
    });

    drawLine(trade.stopLoss, 'rgba(255, 58, 92, 0.7)', 2, 'SL');

    chart.timeScale().fitContent();
    chartRef.current = chart;

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [trade]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
}
