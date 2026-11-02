import React, { useRef, useEffect, useState } from 'react';
import { useMarket } from '../../context/MarketContext.tsx';
import { calculateEMA, calculateBollingerBands, Candle } from '../../../server/indicators.ts';

export const CandlestickChart: React.FC = () => {
  const { selectedUnderlying, setSelectedUnderlying } = useMarket();
  const [timeframe, setTimeframe] = useState<'15m' | '1h' | '4h' | '1D'>('1h');
  const [candles, setCandles] = useState<Candle[]>([]);
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  const [showEMA, setShowEMA] = useState(true);
  const [showBB, setShowBB] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Fetch candles on asset/timeframe change
  useEffect(() => {
    let isMounted = true;
    fetch(`/api/market/candles?underlying=${selectedUnderlying}&timeframe=${timeframe}&count=80`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success) {
          setCandles(data.data);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [selectedUnderlying, timeframe]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Padding
    const padTop = 30;
    const padBottom = 50;
    const padRight = 65;
    const chartHeight = height - padTop - padBottom;
    const chartWidth = width - padRight;

    // Price Extents
    const highs = candles.map((c) => c.high);
    const lows = candles.map((c) => c.low);
    const maxPrice = Math.max(...highs);
    const minPrice = Math.min(...lows);
    const priceRange = maxPrice - minPrice || 1;

    const getY = (val: number) => padTop + (1 - (val - minPrice) / priceRange) * chartHeight;
    const candleWidth = Math.max((chartWidth / candles.length) * 0.68, 3);
    const stepX = chartWidth / candles.length;

    // Grid lines (horizontal)
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);

    const numGrid = 5;
    for (let i = 0; i <= numGrid; i++) {
      const p = minPrice + (priceRange * i) / numGrid;
      const y = getY(p);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();

      // Price labels
      ctx.fillStyle = '#64748b';
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(p >= 1000 ? p.toFixed(0) : p.toFixed(2), chartWidth + 8, y + 4);
    }
    ctx.setLineDash([]);

    // Volume bars at bottom
    const maxVol = Math.max(...candles.map((c) => c.volume)) || 1;
    candles.forEach((c, i) => {
      const x = i * stepX + stepX / 2;
      const volHeight = (c.volume / maxVol) * 36;
      ctx.fillStyle = c.close >= c.open ? 'rgba(16, 185, 129, 0.22)' : 'rgba(239, 68, 68, 0.22)';
      ctx.fillRect(x - candleWidth / 2, height - padBottom - volHeight, candleWidth, volHeight);
    });

    // Bollinger Bands if enabled
    if (showBB) {
      const closes = candles.map((c) => c.close);
      const bb = calculateBollingerBands(closes, 20);

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 1.2;
      bb.upper.forEach((val, i) => {
        const x = i * stepX + stepX / 2;
        const y = getY(val);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      ctx.beginPath();
      bb.lower.forEach((val, i) => {
        const x = i * stepX + stepX / 2;
        const y = getY(val);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // EMA 20 & 50 if enabled
    if (showEMA) {
      const closes = candles.map((c) => c.close);
      const ema20 = calculateEMA(closes, 20);
      const ema50 = calculateEMA(closes, 50);

      // EMA 20 (Cyan)
      ctx.beginPath();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.6;
      ema20.forEach((val, i) => {
        const x = i * stepX + stepX / 2;
        const y = getY(val);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // EMA 50 (Amber)
      ctx.beginPath();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.6;
      ema50.forEach((val, i) => {
        const x = i * stepX + stepX / 2;
        const y = getY(val);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // Candlesticks
    candles.forEach((c, i) => {
      const x = i * stepX + stepX / 2;
      const isGreen = c.close >= c.open;
      const openY = getY(c.open);
      const closeY = getY(c.close);
      const highY = getY(c.high);
      const lowY = getY(c.low);

      const color = isGreen ? '#10b981' : '#ef4444';
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 1.5;

      // Wick
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Body
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(Math.abs(closeY - openY), 2);
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    });

    // Time labels
    ctx.fillStyle = '#64748b';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    const timeStep = Math.max(Math.floor(candles.length / 6), 1);
    for (let i = 0; i < candles.length; i += timeStep) {
      const x = i * stepX + stepX / 2;
      const d = new Date(candles[i].time);
      const label = timeframe === '1D' ? `${d.getMonth() + 1}/${d.getDate()}` : `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
      ctx.fillText(label, x, height - 12);
    }
  }, [candles, showEMA, showBB, timeframe]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = 340;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || candles.length === 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const stepX = (canvasRef.current.width - 65) / candles.length;
    const index = Math.floor(x / stepX);
    if (index >= 0 && index < candles.length) {
      setHoveredCandle(candles[index]);
    } else {
      setHoveredCandle(null);
    }
  };

  const currentLast = candles[candles.length - 1]?.close || 0;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
      {/* Chart Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          {/* Asset Pills */}
          <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
            {(['BTC', 'ETH', 'SOL'] as const).map((asset) => (
              <button
                key={asset}
                onClick={() => setSelectedUnderlying(asset)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  selectedUnderlying === asset
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {asset}/USDT
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono-numbers">
            <span className="text-slate-400">SPOT:</span>
            <span className="text-white font-bold text-sm">
              ${currentLast >= 1000 ? currentLast.toLocaleString() : currentLast.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Timeframe & Overlays */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
            {(['15m', '1h', '4h', '1D'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-0.5 text-xs font-medium rounded-md transition ${
                  timeframe === tf
                    ? 'bg-slate-800 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowEMA((v) => !v)}
            className={`px-2 py-1 text-xs rounded-lg border transition ${
              showEMA
                ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400'
                : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            EMA 20/50
          </button>
          <button
            onClick={() => setShowBB((v) => !v)}
            className={`px-2 py-1 text-xs rounded-lg border transition ${
              showBB
                ? 'bg-blue-500/10 border-blue-500/40 text-blue-400'
                : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            Bollinger
          </button>
        </div>
      </div>

      {/* Hover Info bar */}
      <div className="h-6 flex items-center gap-4 text-xs font-mono-numbers text-slate-400 pt-2 px-1">
        {hoveredCandle ? (
          <>
            <span>O: <strong className="text-slate-200">{hoveredCandle.open}</strong></span>
            <span>H: <strong className="text-slate-200">{hoveredCandle.high}</strong></span>
            <span>L: <strong className="text-slate-200">{hoveredCandle.low}</strong></span>
            <span>C: <strong className={hoveredCandle.close >= hoveredCandle.open ? 'text-emerald-400' : 'text-red-400'}>{hoveredCandle.close}</strong></span>
            <span>Vol: <strong className="text-slate-200">{hoveredCandle.volume}</strong></span>
          </>
        ) : (
          <span className="text-slate-500">Hover over chart for OHLCV crosshair data</span>
        )}
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="w-full relative mt-1">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredCandle(null)}
          className="w-full h-[340px] cursor-crosshair block"
        />
      </div>
    </div>
  );
};
