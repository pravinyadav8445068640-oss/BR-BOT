import React, { useState, useEffect } from 'react';
import { Strategy, BacktestRecord } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { EquityCurveChart } from '../charts/EquityCurveChart.tsx';
import {
  Play,
  RotateCcw,
  TrendingUp,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Layers,
  ShieldAlert,
} from 'lucide-react';

export const BacktestLabView: React.FC = () => {
  const { token } = useAuth();
  const { t, language } = useLanguage();

  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('');
  const [exchange, setExchange] = useState<'delta_india' | 'coinswitch'>('delta_india');
  const [instrument, setInstrument] = useState<'BTC-USDT' | 'ETH-USDT' | 'SOL-USDT'>('BTC-USDT');
  const [timeframe, setTimeframe] = useState<'15m' | '1h' | '4h' | '1D'>('1h');
  const [dateRangeDays, setDateRangeDays] = useState<number>(90);
  const [initialCapital, setInitialCapital] = useState<number>(10000);

  const [backtestResult, setBacktestResult] = useState<BacktestRecord | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Fetch strategies
  useEffect(() => {
    if (!token) return;
    fetch('/api/strategies/list', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.length > 0) {
          setStrategies(data.data);
          setSelectedStrategyId(data.data[0].id);
        }
      })
      .catch(() => {});

    // Fetch previous backtest history
    fetch('/api/backtest/history', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.length > 0) {
          setBacktestResult(data.data[0]);
        }
      })
      .catch(() => {});
  }, [token]);

  const handleRunBacktest = async () => {
    if (!token) return;
    setIsRunning(true);
    try {
      const res = await fetch('/api/backtest/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          strategyId: selectedStrategyId,
          exchange,
          instrument,
          timeframe,
          dateRangeDays,
          initialCapital,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBacktestResult(data.data);
      }
    } catch (err: any) {
      alert(`Backtest Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Simulation Notice Disclaimer */}
      <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-200">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-300">
            {language === 'hi' ? 'सत्यापित बैकटेस्टिंग सूचना:' : 'Historical Simulation Notice:'}
          </span>{' '}
          {language === 'hi'
            ? 'यह बैकटेस्ट ऐतिहासिक मार्केट डेटा, 0.03% मेकर फीस और 0.05% स्लिपेज का उपयोग करके किया जाता है। पिछला प्रदर्शन कभी भी वास्तविक भविष्य के मुनाफे की गारंटी नहीं देता।'
            : 'Simulated with realistic transaction fees (0.03% maker / 0.05% taker), slippage assumptions, and Black-Scholes theta modeling. Past results do not guarantee future performance.'}
        </div>
      </div>

      {/* Config Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>Backtest Engine Parameters</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Strategy */}
          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="text-[11px] font-semibold text-slate-400">Strategy</label>
            <select
              value={selectedStrategyId}
              onChange={(e) => setSelectedStrategyId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {strategies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Exchange */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400">Exchange</label>
            <select
              value={exchange}
              onChange={(e) => setExchange(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="delta_india">Delta India</option>
              <option value="coinswitch">CoinSwitch</option>
            </select>
          </div>

          {/* Instrument */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400">Pair</label>
            <select
              value={instrument}
              onChange={(e) => setInstrument(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="BTC-USDT">BTC / USDT</option>
              <option value="ETH-USDT">ETH / USDT</option>
              <option value="SOL-USDT">SOL / USDT</option>
            </select>
          </div>

          {/* Timeframe */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400">{t('timeframe')}</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="15m">15 Minutes</option>
              <option value="1h">1 Hour</option>
              <option value="4h">4 Hours</option>
              <option value="1D">1 Day</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400">{t('dateRange')}</label>
            <select
              value={dateRangeDays}
              onChange={(e) => setDateRangeDays(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value={30}>Past 30 Days</option>
              <option value={90}>Past 90 Days</option>
              <option value={180}>Past 180 Days</option>
              <option value={365}>Past 1 Year</option>
            </select>
          </div>

          {/* Starting Virtual Capital */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400">Capital ($)</label>
            <input
              type="number"
              value={initialCapital}
              onChange={(e) => setInitialCapital(parseFloat(e.target.value) || 10000)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono-numbers focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={handleRunBacktest}
            disabled={isRunning}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition shadow-lg"
          >
            <Play className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Calculating historical trades...' : t('runBacktest')}</span>
          </button>
        </div>
      </div>

      {/* Results Overview */}
      {backtestResult && (
        <div className="space-y-6">
          {/* Key Stat Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 font-medium">Net Virtual Profit</span>
              <div
                className={`text-lg font-extrabold font-mono-numbers mt-1 ${
                  backtestResult.netPnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {backtestResult.netPnl >= 0 ? `+$${backtestResult.netPnl}` : `-$${Math.abs(backtestResult.netPnl)}`}
              </div>
              <span className="text-[10px] text-slate-500 font-mono-numbers">({backtestResult.netPnlPct}%)</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 font-medium">{t('winRate')}</span>
              <div className="text-lg font-extrabold text-emerald-400 font-mono-numbers mt-1">
                {backtestResult.winRate}%
              </div>
              <span className="text-[10px] text-slate-500 font-mono-numbers">
                {backtestResult.winningTrades}W / {backtestResult.losingTrades}L
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 font-medium">{t('maxDrawdown')}</span>
              <div className="text-lg font-extrabold text-amber-400 font-mono-numbers mt-1">
                {backtestResult.maxDrawdown}%
              </div>
              <span className="text-[10px] text-slate-500">Peak to trough</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 font-medium">{t('sharpeRatio')}</span>
              <div className="text-lg font-extrabold text-white font-mono-numbers mt-1">
                {backtestResult.sharpeRatio}
              </div>
              <span className="text-[10px] text-emerald-400">Institutional tier</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 font-medium">{t('profitFactor')}</span>
              <div className="text-lg font-extrabold text-cyan-400 font-mono-numbers mt-1">
                {backtestResult.profitFactor}
              </div>
              <span className="text-[10px] text-slate-500">Gross W / Gross L</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 font-medium">{t('totalTrades')}</span>
              <div className="text-lg font-extrabold text-white font-mono-numbers mt-1">
                {backtestResult.totalTrades}
              </div>
              <span className="text-[10px] text-slate-500">{backtestResult.dateRange}</span>
            </div>
          </div>

          {/* Equity Curve Chart */}
          <EquityCurveChart
            data={backtestResult.equityCurve}
            initialCapital={backtestResult.initialCapital}
          />

          {/* Trade Log Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Simulated Execution Log ({backtestResult.trades?.length || 0} Trades)
            </h4>

            <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
              <table className="w-full text-xs font-mono-numbers text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase sticky top-0 bg-slate-900">
                    <th className="py-2 px-3 text-left">Trade #</th>
                    <th className="py-2 px-3 text-left">Entry Date</th>
                    <th className="py-2 px-3 text-left">Exit Date</th>
                    <th className="py-2 px-3 text-left">Structure / Legs</th>
                    <th className="py-2 px-3 text-right">P&L ($)</th>
                    <th className="py-2 px-3 text-right">Return %</th>
                    <th className="py-2 px-3 text-left">Exit Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {backtestResult.trades?.map((tr) => (
                    <tr key={tr.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-2 px-3 text-left text-slate-400 font-bold">{tr.id}</td>
                      <td className="py-2 px-3 text-left text-slate-300">{tr.entryTime}</td>
                      <td className="py-2 px-3 text-left text-slate-300">{tr.exitTime}</td>
                      <td className="py-2 px-3 text-left text-white">{tr.legs}</td>
                      <td
                        className={`py-2 px-3 text-right font-bold ${
                          tr.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {tr.pnl >= 0 ? `+$${tr.pnl}` : `-$${Math.abs(tr.pnl)}`}
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-bold ${
                          tr.pnlPct >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {tr.pnlPct}%
                      </td>
                      <td className="py-2 px-3 text-left text-slate-400">{tr.exitReason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
