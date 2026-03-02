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
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#4a6278',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.03)' },
        horzLines: { color: 'rgba(255,255,255,0.03)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#f43f5e',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e',
    });

    const data = generateMockData(trade);
    series.setData(data);

    const entryTime = Math.floor(trade._creationTime / 1000) as Time;
    createSeriesMarkers(series, [
      {
        time: entryTime,
        position: 'inBar',
        color: '#00f2ff',
        shape: 'arrowUp',
        text: 'ENTRY',
        size: 1,
      },
    ]);

    const drawLine = (price: number, color: string, title: string) => {
      series.createPriceLine({
        price: price,
        color: color,
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: title,
      });
    };

    drawLine(trade.entryLow, 'rgba(0,242,255,0.5)', 'Entry');
    trade.takeProfits.forEach((tp, i) => drawLine(tp, '#10b981', `TP${i + 1}`));
    drawLine(trade.stopLoss, '#f43f5e', 'SL');

    chart.timeScale().fitContent();

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [trade._id]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
}

function generateMockData(trade: Trade): CandlestickData<Time>[] {
  const data: CandlestickData<Time>[] = [];
  const entryPrice = (trade.entryLow + (trade.entryHigh || trade.entryLow)) / 2;
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
