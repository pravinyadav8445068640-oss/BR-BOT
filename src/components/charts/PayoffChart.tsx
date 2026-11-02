import React from 'react';
import { Strategy, OptionLeg } from '../../types/index.ts';

interface PayoffChartProps {
  strategy?: Partial<Strategy>;
  currentSpot?: number;
}

export const PayoffChart: React.FC<PayoffChartProps> = ({ strategy, currentSpot = 68000 }) => {
  const spot = currentSpot > 0 ? currentSpot : 68000;
  const stratType = strategy?.strategyType || 'iron_condor';
  const legs: OptionLeg[] = strategy?.legs || [
    { id: '1', action: 'SELL', type: 'PUT', strikeOffsetPct: -4, ratio: 1 },
    { id: '2', action: 'BUY', type: 'PUT', strikeOffsetPct: -7, ratio: 1 },
    { id: '3', action: 'SELL', type: 'CALL', strikeOffsetPct: 4, ratio: 1 },
    { id: '4', action: 'BUY', type: 'CALL', strikeOffsetPct: 7, ratio: 1 },
  ];

  // Evaluate payoff curve from -15% to +15% of spot price
  const pointsCount = 40;
  const minSpot = spot * 0.85;
  const maxSpot = spot * 1.15;
  const spotStep = (maxSpot - minSpot) / pointsCount;

  // Estimate premium and strike for each leg
  const computedLegs = legs.map((leg) => {
    const strike = Math.round(spot * (1 + leg.strikeOffsetPct / 100));
    // Estimated premium proportional to ATM
    const dist = Math.abs(strike - spot) / spot;
    const premium = Math.max(spot * 0.035 * Math.exp(-dist * 8), 25);
    return { ...leg, strike, premium };
  });

  const curveData: { price: number; pnl: number }[] = [];
  let maxProfit = -Infinity;
  let maxLoss = Infinity;

  for (let i = 0; i <= pointsCount; i++) {
    const p = minSpot + i * spotStep;
    let netPnl = 0;

    for (const leg of computedLegs) {
      let intrinsic = 0;
      if (leg.type === 'CALL') {
        intrinsic = Math.max(0, p - leg.strike);
      } else {
        intrinsic = Math.max(0, leg.strike - p);
      }

      if (leg.action === 'SELL') {
        netPnl += (leg.premium - intrinsic) * leg.ratio;
      } else {
        netPnl += (intrinsic - leg.premium) * leg.ratio;
      }
    }

    if (netPnl > maxProfit) maxProfit = netPnl;
    if (netPnl < maxLoss) maxLoss = netPnl;

    curveData.push({ price: p, pnl: netPnl });
  }

  // Chart dimensions
  const width = 600;
  const height = 240;
  const padX = 50;
  const padY = 30;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const pnlMin = Math.min(maxLoss, -50);
  const pnlMax = Math.max(maxProfit, 50);
  const pnlSpan = pnlMax - pnlMin || 1;

  const getX = (p: number) => padX + ((p - minSpot) / (maxSpot - minSpot)) * chartW;
  const getY = (val: number) => padY + (1 - (val - pnlMin) / pnlSpan) * chartH;
  const zeroY = getY(0);

  // SVG Path for curve
  const pathD = curveData.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(pt.price).toFixed(1)} ${getY(pt.pnl).toFixed(1)}`).join(' ');

  // Break-even points (where pnl crosses 0)
  const breakevens: number[] = [];
  for (let i = 1; i < curveData.length; i++) {
    if ((curveData[i - 1].pnl < 0 && curveData[i].pnl >= 0) || (curveData[i - 1].pnl >= 0 && curveData[i].pnl < 0)) {
      breakevens.push(Math.round(curveData[i].price));
    }
  }

  return (
    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300">Strategy Payoff at Expiry</span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono-numbers text-[11px]">
            {stratType.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-4 font-mono-numbers">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Max Profit:</span>
            <span className="text-emerald-400 font-bold">+${Math.round(maxProfit)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Max Risk:</span>
            <span className={maxLoss < -1000 ? 'text-red-500 font-bold' : 'text-amber-400 font-bold'}>
              {maxLoss < -10000 ? 'UNDEFINED (Naked)' : `-$${Math.abs(Math.round(maxLoss))}`}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-[220px]">
          <defs>
            <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lossGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Zero PnL Reference Line */}
          <line
            x1={padX}
            y1={zeroY}
            x2={width - padX}
            y2={zeroY}
            stroke="#475569"
            strokeWidth="1.2"
            strokeDasharray="4 4"
          />
          <text x={padX - 8} y={zeroY + 4} fill="#64748b" fontSize="10" textAnchor="end" fontFamily="JetBrains Mono">
            $0
          </text>

          {/* Current Spot Reference */}
          <line
            x1={getX(spot)}
            y1={padY}
            x2={getX(spot)}
            y2={height - padY}
            stroke="#38bdf8"
            strokeWidth="1.5"
            strokeDasharray="2 3"
          />
          <text
            x={getX(spot)}
            y={padY - 8}
            fill="#38bdf8"
            fontSize="10"
            textAnchor="middle"
            fontFamily="JetBrains Mono"
            fontWeight="bold"
          >
            SPOT ${spot.toLocaleString()}
          </text>

          {/* Payoff Curve Line */}
          <path d={pathD} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Break-even pins */}
          {breakevens.map((be, idx) => (
            <g key={idx}>
              <circle cx={getX(be)} cy={zeroY} r="4" fill="#f59e0b" />
              <text
                x={getX(be)}
                y={zeroY + 16}
                fill="#f59e0b"
                fontSize="9"
                textAnchor="middle"
                fontFamily="JetBrains Mono"
              >
                BE: ${be.toLocaleString()}
              </text>
            </g>
          ))}

          {/* Strikes Markers on bottom axis */}
          {computedLegs.map((leg, idx) => (
            <text
              key={idx}
              x={getX(leg.strike)}
              y={height - 8}
              fill={leg.action === 'SELL' ? '#10b981' : '#38bdf8'}
              fontSize="9"
              textAnchor="middle"
              fontFamily="JetBrains Mono"
            >
              {leg.action === 'SELL' ? 'S' : 'B'}:{leg.strike}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
};
