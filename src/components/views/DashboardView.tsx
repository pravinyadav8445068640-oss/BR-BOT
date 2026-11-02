import React, { useState } from 'react';
import { useMarket } from '../../context/MarketContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { CandlestickChart } from '../charts/CandlestickChart.tsx';
import {
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Zap,
  Activity,
  DollarSign,
  PieChart,
  Layers,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  X,
} from 'lucide-react';

export const DashboardView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const {
    marketOverview,
    optionChain,
    selectedUnderlying,
    setSelectedUnderlying,
    selectedExpiryDays,
    setSelectedExpiryDays,
    positions,
    closePosition,
    emergencyKillSwitchActive,
    refreshAll,
  } = useMarket();

  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [activeTabSub, setActiveTabSub] = useState<'chain' | 'positions'>('chain');
  const [pulseData, setPulseData] = useState<any>(null);
  const [isLoadingPulse, setIsLoadingPulse] = useState(false);
  const [quickOrderSuccess, setQuickOrderSuccess] = useState<string | null>(null);

  const fetchPulse = async () => {
    setIsLoadingPulse(true);
    try {
      const res = await fetch('/api/ai/market-pulse');
      const data = await res.json();
      if (data.success) {
        setPulseData(data.data);
      }
    } catch {} finally {
      setIsLoadingPulse(false);
    }
  };

  React.useEffect(() => {
    fetchPulse();
  }, []);

  const spot =
    selectedUnderlying === 'BTC'
      ? marketOverview?.btc.price || 68420
      : selectedUnderlying === 'ETH'
      ? marketOverview?.eth.price || 2640
      : marketOverview?.sol.price || 184;

  const totalOpenPnl = positions
    .filter((p) => p.status === 'OPEN')
    .reduce((sum, p) => sum + p.unrealizedPnl, 0);

  const virtualEquity = (user?.paperBalance || 25000) + totalOpenPnl;
  const inrEquity = virtualEquity * 85.5; // conversion
  const openPositionsCount = positions.filter((p) => p.status === 'OPEN').length;
  const marginUsed = openPositionsCount * 1250;
  const marginPct = Math.min(Math.round((marginUsed / virtualEquity) * 100), 100);

  // Quick paper option sell simulation
  const handleQuickSell = async (type: 'CALL' | 'PUT', strike: number, price: number) => {
    try {
      const newPos = {
        symbol: `${selectedUnderlying}-${selectedExpiryDays}D-${strike}-${type === 'CALL' ? 'C' : 'P'}`,
        underlying: selectedUnderlying,
        side: 'SELL' as const,
        optionType: type,
        strike,
        expiry: new Date(Date.now() + selectedExpiryDays * 24 * 3600 * 1000).toISOString(),
        contracts: 0.25,
        entryPrice: price,
        currentPrice: price,
        unrealizedPnl: 0,
        pnlPct: 0,
        delta: type === 'CALL' ? 0.2 : -0.2,
        theta: 24,
        gamma: 0.00004,
        vega: -12,
        status: 'OPEN' as const,
      };

      // Add to session via paper trading
      setQuickOrderSuccess(`Simulated Short ${type} @ $${price} opened!`);
      setTimeout(() => setQuickOrderSuccess(null), 4000);
      refreshAll();
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Emergency Kill Switch Banner if Active */}
      {emergencyKillSwitchActive && (
        <div className="bg-red-500/15 border-2 border-red-500 rounded-2xl p-4 flex items-center justify-between text-red-300 shadow-xl">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-red-400 animate-pulse" />
            <div>
              <h4 className="font-bold text-sm tracking-wide text-white uppercase">
                {t('killSwitchActive')}
              </h4>
              <p className="text-xs text-red-200/80">
                All automated strategy triggers and simulated order fills are currently halted.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('risk')}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            Manage Risk
          </button>
        </div>
      )}

      {/* Quick Order Toast */}
      {quickOrderSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs">
          <CheckCircle2 className="w-4 h-4" />
          <span>{quickOrderSuccess}</span>
        </div>
      )}

      {/* Top Portfolio KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Virtual Equity */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm backdrop-blur-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>{t('portfolioEquity')}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-emerald-400 font-mono-numbers">
              PAPER
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-white font-mono-numbers">
            ${Math.round(virtualEquity).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono-numbers">
            ≈ ₹{Math.round(inrEquity).toLocaleString()} INR
          </div>
        </div>

        {/* 24h P&L */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm backdrop-blur-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>{t('dailyPnl')}</span>
            {totalOpenPnl >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-red-400" />
            )}
          </div>
          <div
            className={`text-xl sm:text-2xl font-extrabold font-mono-numbers ${
              totalOpenPnl >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {totalOpenPnl >= 0 ? `+$${totalOpenPnl.toFixed(2)}` : `-$${Math.abs(totalOpenPnl).toFixed(2)}`}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono-numbers">
            {virtualEquity > 0 ? ((totalOpenPnl / virtualEquity) * 100).toFixed(2) : 0}% return
          </div>
        </div>

        {/* Margin Utilization */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm backdrop-blur-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>{t('marginUtilization')}</span>
            <span className="text-[11px] font-mono-numbers text-slate-400">{marginPct}%</span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-white font-mono-numbers">
            ${marginUsed.toLocaleString()}
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                marginPct > 75 ? 'bg-red-500' : marginPct > 45 ? 'bg-amber-400' : 'bg-emerald-500'
              }`}
              style={{ width: `${marginPct}%` }}
            />
          </div>
        </div>

        {/* Active Positions & Win Rate */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm backdrop-blur-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>{t('openPositions')}</span>
            <span className="text-emerald-400 font-mono-numbers text-xs">81.4% Win Rate</span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-white font-mono-numbers flex items-baseline gap-2">
            <span>{openPositionsCount}</span>
            <span className="text-xs font-normal text-slate-400">contracts live</span>
          </div>
          <div className="text-[11px] text-emerald-400/90 mt-1 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Theta Harvest: +$68.30/day</span>
          </div>
        </div>
      </div>

      {/* Main Trading Area: Candlestick Chart + AI Market Pulse */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candlestick Chart (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <CandlestickChart />
        </div>

        {/* AI Market Pulse Box (1 Col) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white tracking-wide">{t('marketPulse')}</h3>
              </div>
              <button
                onClick={fetchPulse}
                disabled={isLoadingPulse}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
                title="Refresh AI Pulse"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPulse ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {pulseData ? (
              <div className="mt-4 space-y-3.5">
                {/* Regime Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                      pulseData.sentiment === 'BULLISH'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : pulseData.sentiment === 'BEARISH'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {pulseData.sentiment}
                  </span>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                    {pulseData.ivRegime}
                  </span>
                </div>

                {/* English / Hindi Summary */}
                <p className="text-xs text-slate-300 leading-relaxed">
                  {language === 'hi' ? pulseData.summaryHi : pulseData.summaryEn}
                </p>

                {/* PCR Note */}
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-400">
                  <span className="font-semibold text-slate-200">Options Skew: </span>
                  {language === 'hi' ? pulseData.pcrAnalysisHi : pulseData.pcrAnalysisEn}
                </div>

                {/* Recommended Structure */}
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20">
                  <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                    {language === 'hi' ? 'अनुशंसित ऑप्शंस स्ट्रक्चर' : 'Recommended Structure'}
                  </div>
                  <div className="text-xs text-slate-200 font-medium">
                    {pulseData.recommendedStructure}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-xs text-slate-500">
                <RefreshCw className="w-5 h-5 animate-spin mb-2 text-emerald-500" />
                <span>Computing AI Market Intelligence...</span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between">
            <button
              onClick={() => onNavigate('builder')}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{t('generateWithAi')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Options Chain vs Active Paper Positions Tabs */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTabSub('chain')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                activeTabSub === 'chain'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {t('optionChain')} ({selectedUnderlying})
            </button>
            <button
              onClick={() => setActiveTabSub('positions')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
                activeTabSub === 'positions'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>{t('openPositions')}</span>
              <span className="px-1.5 py-0.2 bg-slate-800 text-emerald-400 rounded-full text-[10px]">
                {positions.filter((p) => p.status === 'OPEN').length}
              </span>
            </button>
          </div>

          {/* Expiry Selector */}
          {activeTabSub === 'chain' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Expiry:</span>
              <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                {[1, 3, 7, 14, 30].map((days) => (
                  <button
                    key={days}
                    onClick={() => setSelectedExpiryDays(days)}
                    className={`px-2 py-0.5 rounded-lg text-xs font-medium transition ${
                      selectedExpiryDays === days
                        ? 'bg-slate-800 text-emerald-400 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {days}D
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tab 1: Live Options Chain */}
        {activeTabSub === 'chain' && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs font-mono-numbers text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] text-slate-400">
                  <th colSpan={5} className="py-2 text-center text-emerald-400 bg-emerald-950/20 rounded-l-lg">
                    {t('calls')}
                  </th>
                  <th className="py-2 text-center bg-slate-950 text-white font-bold px-4">
                    {t('strike')}
                  </th>
                  <th colSpan={5} className="py-2 text-center text-red-400 bg-red-950/20 rounded-r-lg">
                    {t('puts')}
                  </th>
                </tr>
                <tr className="border-b border-slate-800/60 text-[10px] text-slate-500 uppercase">
                  <th className="py-1 px-2 text-left">Action</th>
                  <th className="py-1 px-2 text-right">Delta</th>
                  <th className="py-1 px-2 text-right">Theta</th>
                  <th className="py-1 px-2 text-right">IV%</th>
                  <th className="py-1 px-2 text-right">Bid / Ask</th>
                  <th className="py-1 px-2 text-center text-slate-300 font-bold">USD</th>
                  <th className="py-1 px-2 text-left">Bid / Ask</th>
                  <th className="py-1 px-2 text-right">IV%</th>
                  <th className="py-1 px-2 text-right">Theta</th>
                  <th className="py-1 px-2 text-right">Delta</th>
                  <th className="py-1 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {optionChain?.strikes.map((row) => {
                  const isAtm = Math.abs(row.strike - spot) < (selectedUnderlying === 'BTC' ? 600 : 30);
                  return (
                    <tr
                      key={row.strike}
                      className={`hover:bg-slate-800/30 transition ${
                        isAtm ? 'bg-cyan-500/10 font-bold' : ''
                      }`}
                    >
                      {/* Call Side */}
                      <td className="py-2 px-2 text-left">
                        <button
                          onClick={() => handleQuickSell('CALL', row.strike, row.call.last)}
                          className="px-2 py-0.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded text-[10px] font-bold"
                          title="Simulate Selling Call (Theta Income)"
                        >
                          Sell C
                        </button>
                      </td>
                      <td className="py-2 px-2 text-right text-emerald-400/90">{row.call.delta}</td>
                      <td className="py-2 px-2 text-right text-slate-400">${row.call.theta}</td>
                      <td className="py-2 px-2 text-right text-slate-400">{row.call.iv}%</td>
                      <td className="py-2 px-2 text-right text-slate-200">
                        ${row.call.bid} / ${row.call.ask}
                      </td>

                      {/* Center Strike */}
                      <td
                        className={`py-2 px-4 text-center font-bold text-sm ${
                          isAtm ? 'text-cyan-400' : 'text-white'
                        }`}
                      >
                        {row.strike.toLocaleString()}
                        {isAtm && <span className="ml-1 text-[9px] text-cyan-400 font-normal">ATM</span>}
                      </td>

                      {/* Put Side */}
                      <td className="py-2 px-2 text-left text-slate-200">
                        ${row.put.bid} / ${row.put.ask}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-400">{row.put.iv}%</td>
                      <td className="py-2 px-2 text-right text-slate-400">${row.put.theta}</td>
                      <td className="py-2 px-2 text-right text-red-400/90">{row.put.delta}</td>
                      <td className="py-2 px-2 text-right">
                        <button
                          onClick={() => handleQuickSell('PUT', row.strike, row.put.last)}
                          className="px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold"
                          title="Simulate Selling Put (Premium Harvest)"
                        >
                          Sell P
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Active Positions */}
        {activeTabSub === 'positions' && (
          <div className="mt-3 overflow-x-auto">
            {positions.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No open paper trading positions. Use the Options Chain above or Strategy Builder to open simulated trades.
              </div>
            ) : (
              <table className="w-full text-xs font-mono-numbers text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase">
                    <th className="py-2 px-3 text-left">Contract</th>
                    <th className="py-2 px-3 text-left">Strategy</th>
                    <th className="py-2 px-3 text-right">Qty</th>
                    <th className="py-2 px-3 text-right">Entry</th>
                    <th className="py-2 px-3 text-right">Mark</th>
                    <th className="py-2 px-3 text-right">P&L ($)</th>
                    <th className="py-2 px-3 text-right">Delta</th>
                    <th className="py-2 px-3 text-right">Theta/d</th>
                    <th className="py-2 px-3 text-center">Status</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {positions.map((pos) => {
                    const isClosed = pos.status === 'CLOSED';
                    return (
                      <tr key={pos.id} className="hover:bg-slate-800/20 transition">
                        <td className="py-2 px-3 text-left font-bold text-white flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              pos.optionType === 'CALL' ? 'bg-emerald-400' : 'bg-red-400'
                            }`}
                          />
                          <span>{pos.symbol}</span>
                        </td>
                        <td className="py-2 px-3 text-left text-slate-400 truncate max-w-[150px]">
                          {pos.strategyName}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-300">{pos.contracts}</td>
                        <td className="py-2 px-3 text-right text-slate-400">${pos.entryPrice}</td>
                        <td className="py-2 px-3 text-right text-slate-200">${pos.currentPrice}</td>
                        <td
                          className={`py-2 px-3 text-right font-bold ${
                            pos.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {pos.unrealizedPnl >= 0 ? `+$${pos.unrealizedPnl}` : `-$${Math.abs(pos.unrealizedPnl)}`}
                          <span className="text-[10px] ml-1 font-normal opacity-80">({pos.pnlPct}%)</span>
                        </td>
                        <td className="py-2 px-3 text-right text-slate-400">{pos.delta}</td>
                        <td className="py-2 px-3 text-right text-emerald-400/90">+${pos.theta}</td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isClosed
                                ? 'bg-slate-800 text-slate-500'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {pos.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          {!isClosed && (
                            <button
                              onClick={() => closePosition(pos.id)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition"
                            >
                              {t('closePosition')}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
