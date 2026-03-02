"use client";

import { useEffect, useRef } from 'react';
import { createChart, ColorType, ISeriesApi, SeriesType } from 'lightweight-charts';
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
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'rgba(255, 255, 255, 0.4)',
        fontSize: 10,
        fontFamily: 'Inter, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.2, bottom: 0.2 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: { color: 'rgba(59, 130, 246, 0.5)', width: 1, style: 2 },
        horzLine: { color: 'rgba(59, 130, 246, 0.5)', width: 1, style: 2 },
      },
      handleScroll: false,
      handleScale: false,
    });

    const series = chart.addAreaSeries({
      lineColor: trade.direction === 'LONG' ? '#10b981' : '#f43f5e',
      topColor: trade.direction === 'LONG' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
      bottomColor: 'rgba(0, 0, 0, 0)',
      lineWidth: 2,
    });

    // Generate some fake historical data around the entry for visualization
    const data = [];
    const entry = trade.entryLow;
    const now = Math.floor(Date.now() / 1000);
    const startTime = trade._creationTime ? Math.floor(trade._creationTime / 1000) : now - 3600;

    for (let i = 0; i < 60; i++) {
      const time = startTime + (i * 60);
      const randomWalk = (Math.random() - 0.5) * (entry * 0.01);
      data.push({
        time: time as any,
        value: entry + (trade.direction === 'LONG' ? i * (entry * 0.0001) : -i * (entry * 0.0001)) + randomWalk
      });
    }
    series.setData(data);

    // Entry Line
    series.createPriceLine({
      price: trade.entryLow,
      color: '#3b82f6',
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
      title: 'ENTRY',
    });

    // TP Line
    if (trade.takeProfits[0]) {
      series.createPriceLine({
        price: trade.takeProfits[0],
        color: '#10b981',
        lineWidth: 1,
        lineStyle: 0,
        axisLabelVisible: true,
        title: 'TP1',
      });
    }

    // SL Line
    series.createPriceLine({
      price: trade.stopLoss,
      color: '#f43f5e',
      lineWidth: 1,
      lineStyle: 0,
      axisLabelVisible: true,
      title: 'SL',
    });

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
