import React from 'react';

interface EquityCurveProps {
  data: { time: string; equity: number; drawdown: number }[];
  initialCapital?: number;
}

export const EquityCurveChart: React.FC<EquityCurveProps> = ({ data, initialCapital = 10000 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-slate-500">
        No equity curve data available. Run backtest to populate.
      </div>
    );
  }

  const width = 640;
  const height = 220;
  const padX = 55;
  const padY = 25;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const equities = data.map((d) => d.equity);
  const minEquity = Math.min(...equities, initialCapital * 0.95);
  const maxEquity = Math.max(...equities, initialCapital * 1.05);
  const range = maxEquity - minEquity || 1;

  const getX = (index: number) => padX + (index / (data.length - 1 || 1)) * chartW;
  const getY = (val: number) => padY + (1 - (val - minEquity) / range) * chartH;

  const initialY = getY(initialCapital);
  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d.equity).toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${getX(data.length - 1)} ${getY(minEquity)} L ${getX(0)} ${getY(minEquity)} Z`;

  const finalEquity = data[data.length - 1]?.equity || initialCapital;
  const isProfitable = finalEquity >= initialCapital;

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="text-slate-400 font-semibold">Simulated Equity Growth & Drawdown</span>
        <div className="flex items-center gap-3 font-mono-numbers">
          <span>Initial: <strong className="text-slate-300">${initialCapital.toLocaleString()}</strong></span>
          <span>Final: <strong className={isProfitable ? 'text-emerald-400' : 'text-red-400'}>${finalEquity.toLocaleString()}</strong></span>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-[200px]">
          <defs>
            <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isProfitable ? '#10b981' : '#ef4444'} stopOpacity="0.3" />
              <stop offset="100%" stopColor={isProfitable ? '#10b981' : '#ef4444'} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Initial Capital Baseline */}
          <line
            x1={padX}
            y1={initialY}
            x2={width - padX}
            y2={initialY}
            stroke="#475569"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <text x={padX - 8} y={initialY + 4} fill="#64748b" fontSize="10" textAnchor="end" fontFamily="JetBrains Mono">
            ${initialCapital.toLocaleString()}
          </text>

          {/* Area fill */}
          <path d={areaPath} fill="url(#eqGrad)" />

          {/* Main Equity Line */}
          <path
            d={linePath}
            fill="none"
            stroke={isProfitable ? '#10b981' : '#ef4444'}
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Min and Max markers */}
          <text x={width - padX + 8} y={getY(maxEquity) + 4} fill="#10b981" fontSize="10" fontFamily="JetBrains Mono">
            ${Math.round(maxEquity).toLocaleString()}
          </text>
          <text x={width - padX + 8} y={getY(minEquity)} fill="#64748b" fontSize="10" fontFamily="JetBrains Mono">
            ${Math.round(minEquity).toLocaleString()}
          </text>

          {/* Time axis points */}
          {data.length > 1 && (
            <>
              <text x={getX(0)} y={height - 6} fill="#64748b" fontSize="9" textAnchor="start" fontFamily="JetBrains Mono">
                {data[0].time}
              </text>
              <text x={getX(data.length - 1)} y={height - 6} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="JetBrains Mono">
                {data[data.length - 1].time}
              </text>
            </>
          )}
        </svg>
      </div>
    </div>
  );
};
