import React, { useState, useEffect } from 'react';
import { Strategy, OptionLeg } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useMarket } from '../../context/MarketContext.tsx';
import { PayoffChart } from '../charts/PayoffChart.tsx';
import {
  Sparkles,
  Layers,
  Plus,
  Trash2,
  Copy,
  Play,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sliders,
  Shield,
  ArrowRight,
} from 'lucide-react';

const STRATEGY_PRESETS: { [key: string]: Partial<Strategy> } = {
  iron_condor: {
    name: 'Institutional 4-Leg Iron Condor',
    description: 'Defined-risk delta-neutral strategy selling both OTM Put and Call spreads to capture theta decay.',
    strategyType: 'iron_condor',
    legs: [
      { id: '1', action: 'SELL', type: 'PUT', strikeOffsetPct: -4, targetDelta: -0.18, ratio: 1 },
      { id: '2', action: 'BUY', type: 'PUT', strikeOffsetPct: -7, targetDelta: -0.07, ratio: 1 },
      { id: '3', action: 'SELL', type: 'CALL', strikeOffsetPct: 4, targetDelta: 0.18, ratio: 1 },
      { id: '4', action: 'BUY', type: 'CALL', strikeOffsetPct: 7, targetDelta: 0.07, ratio: 1 },
    ],
    entryConditions: [
      { indicator: 'RSI', operator: 'BETWEEN', value: 40, secondaryValue: 60, logic: 'AND' },
      { indicator: 'IV_PERCENTILE', operator: '>', value: 50, logic: 'AND' },
    ],
    exitConditions: { targetProfitPct: 50, stopLossPct: 80, daysToExpiryExit: 1 },
    strikeSelectionMode: 'DELTA',
    deltaTarget: 0.18,
  },
  covered_call: {
    name: 'Covered Call Yield Harvester',
    description: 'Systematically sells out-of-the-money Calls against underlying spot cryptocurrency for continuous monthly yield.',
    strategyType: 'covered_call',
    legs: [
      { id: '1', action: 'SELL', type: 'CALL', strikeOffsetPct: 6, targetDelta: 0.22, ratio: 1 },
    ],
    entryConditions: [
      { indicator: 'RSI', operator: '>', value: 55, logic: 'AND' },
    ],
    exitConditions: { targetProfitPct: 65, stopLossPct: 150, daysToExpiryExit: 2 },
    strikeSelectionMode: 'PERCENT_OTM',
  },
  cash_secured_put: {
    name: 'Cash Secured Put Accumulator',
    description: 'Sells cash-backed OTM Puts to acquire cryptocurrency at a discount while collecting premium income.',
    strategyType: 'cash_secured_put',
    legs: [
      { id: '1', action: 'SELL', type: 'PUT', strikeOffsetPct: -5, targetDelta: -0.20, ratio: 1 },
    ],
    entryConditions: [
      { indicator: 'RSI', operator: '<', value: 38, logic: 'AND' },
    ],
    exitConditions: { targetProfitPct: 60, stopLossPct: 100, daysToExpiryExit: 1 },
    strikeSelectionMode: 'DELTA',
    deltaTarget: 0.20,
  },
  iron_butterfly: {
    name: 'Iron Butterfly High IV Pin',
    description: 'Sells ATM Call and Put while buying protective OTM wings. Highest profit when asset pins near strike.',
    strategyType: 'iron_butterfly',
    legs: [
      { id: '1', action: 'SELL', type: 'PUT', strikeOffsetPct: 0, targetDelta: -0.50, ratio: 1 },
      { id: '2', action: 'BUY', type: 'PUT', strikeOffsetPct: -5, targetDelta: -0.15, ratio: 1 },
      { id: '3', action: 'SELL', type: 'CALL', strikeOffsetPct: 0, targetDelta: 0.50, ratio: 1 },
      { id: '4', action: 'BUY', type: 'CALL', strikeOffsetPct: 5, targetDelta: 0.15, ratio: 1 },
    ],
    entryConditions: [
      { indicator: 'IV_PERCENTILE', operator: '>', value: 75, logic: 'AND' },
    ],
    exitConditions: { targetProfitPct: 40, stopLossPct: 60, daysToExpiryExit: 1 },
    strikeSelectionMode: 'ATM',
  },
  bull_put_spread: {
    name: 'Bull Put Credit Spread',
    description: 'Bullish credit spread collecting upfront premium by selling an OTM Put and buying a cheaper lower Put.',
    strategyType: 'bull_put_spread',
    legs: [
      { id: '1', action: 'SELL', type: 'PUT', strikeOffsetPct: -3, targetDelta: -0.25, ratio: 1 },
      { id: '2', action: 'BUY', type: 'PUT', strikeOffsetPct: -6, targetDelta: -0.10, ratio: 1 },
    ],
    entryConditions: [
      { indicator: 'RSI', operator: '>', value: 45, logic: 'AND' },
      { indicator: 'PRICE', operator: '>', value: 0, logic: 'AND' },
    ],
    exitConditions: { targetProfitPct: 50, stopLossPct: 90, daysToExpiryExit: 1 },
    strikeSelectionMode: 'DELTA',
    deltaTarget: 0.25,
  },
  delta_neutral: {
    name: 'Dynamic Delta Neutral Rebalancer',
    description: 'Delta-hedged strangle maintaining portfolio delta between -0.20 and +0.20.',
    strategyType: 'delta_neutral',
    legs: [
      { id: '1', action: 'SELL', type: 'PUT', strikeOffsetPct: -5, targetDelta: -0.18, ratio: 1 },
      { id: '2', action: 'SELL', type: 'CALL', strikeOffsetPct: 5, targetDelta: 0.18, ratio: 1 },
    ],
    entryConditions: [
      { indicator: 'IV_PERCENTILE', operator: '>', value: 60, logic: 'AND' },
    ],
    exitConditions: { targetProfitPct: 50, stopLossPct: 80, daysToExpiryExit: 1 },
    strikeSelectionMode: 'DELTA',
    deltaTarget: 0.18,
    hedgeCondition: { enabled: true, triggerDelta: 0.35, hedgeInstrument: 'FUTURES' },
  },
};

export const StrategyBuilderView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { token } = useAuth();
  const { t, language } = useLanguage();
  const { marketOverview } = useMarket();

  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<Partial<Strategy>>(STRATEGY_PRESETS.iron_condor);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiBuilding, setIsAiBuilding] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const spot =
    selectedStrategy.underlying === 'ETH'
      ? marketOverview?.eth.price || 2640
      : selectedStrategy.underlying === 'SOL'
      ? marketOverview?.sol.price || 184
      : marketOverview?.btc.price || 68420;

  const fetchUserStrategies = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/strategies/list', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setStrategies(data.data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchUserStrategies();
  }, [token]);

  const handleAiBuild = async () => {
    if (!aiPrompt.trim() || !token) return;
    setIsAiBuilding(true);
    try {
      const res = await fetch('/api/ai/build-strategy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSelectedStrategy({
          ...data.data,
          underlying: data.data.underlying || 'BTC',
          isPaperActive: false,
        });
        setSaveStatus('Strategy synthesized by AI from your instructions!');
        setTimeout(() => setSaveStatus(null), 4000);
      }
    } catch (err: any) {
      alert(`AI Builder Error: ${err.message}`);
    } finally {
      setIsAiBuilding(false);
    }
  };

  const handlePresetSelect = (presetKey: string) => {
    const preset = STRATEGY_PRESETS[presetKey];
    if (preset) {
      setSelectedStrategy({
        ...preset,
        underlying: selectedStrategy.underlying || 'BTC',
        isPaperActive: false,
      });
    }
  };

  const handleSaveStrategy = async () => {
    if (!token) {
      alert('Please sign in to save custom strategies.');
      return;
    }
    try {
      const res = await fetch('/api/strategies/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(selectedStrategy),
      });
      const data = await res.json();
      if (data.success) {
        setSaveStatus('Strategy saved to your library!');
        setTimeout(() => setSaveStatus(null), 4000);
        fetchUserStrategies();
      }
    } catch {}
  };

  const handleTogglePaper = async (stratId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/strategies/toggle-paper/${stratId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        fetchUserStrategies();
      }
    } catch {}
  };

  const handleDelete = async (stratId: string) => {
    if (!token || !confirm('Delete strategy from your account?')) return;
    try {
      await fetch(`/api/strategies/delete/${stratId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUserStrategies();
    } catch {}
  };

  const handleDuplicate = async (stratId: string) => {
    if (!token) return;
    try {
      await fetch(`/api/strategies/duplicate/${stratId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUserStrategies();
    } catch {}
  };

  // Leg Management
  const addLeg = (type: 'CALL' | 'PUT', action: 'BUY' | 'SELL') => {
    const newLeg: OptionLeg = {
      id: `leg_${Date.now()}`,
      action,
      type,
      strikeOffsetPct: action === 'BUY' ? 6 : -4,
      targetDelta: 0.20,
      ratio: 1,
    };
    setSelectedStrategy((prev) => ({
      ...prev,
      legs: [...(prev.legs || []), newLeg],
    }));
  };

  const removeLeg = (id: string) => {
    setSelectedStrategy((prev) => ({
      ...prev,
      legs: prev.legs?.filter((l) => l.id !== id),
    }));
  };

  return (
    <div className="space-y-6">
      {/* AI Strategy Builder Header & Natural Language Input */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-extrabold text-white tracking-wide">
            {language === 'hi' ? 'AI रणनीति निर्माता (AI Strategy Builder)' : 'AI Strategy Builder'}
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 font-bold">
            Gemini 2.5 Intelligence
          </span>
        </div>

        <p className="text-xs text-slate-300 mb-4 max-w-2xl leading-relaxed">
          {language === 'hi'
            ? 'अपनी रणनीति को साधारण हिंदी या अंग्रेजी में बताएं। हमारा AI इसे स्वचालित रूप से मल्टी-लेग ऑप्शंस रूल्स, स्टॉप-लॉस और इंडिकेटर कंडीशन्स में बदल देगा।'
            : 'Type your options strategy in plain English or Hindi. Our AI automatically maps indicators, strike deltas, and risk rules.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder={
              language === 'hi'
                ? 'उदा: जब RSI 35 से नीचे हो तो BTC पर 0.20 डेल्टा पुट बेचें और 50% प्रॉफिट पर एग्जिट करें...'
                : 'e.g. When RSI < 35 and IV > 55, sell 0.20 delta BTC put with 50% target profit and 80% stop loss...'
            }
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950/90 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
          <button
            onClick={handleAiBuild}
            disabled={isAiBuilding || !aiPrompt.trim()}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg shrink-0"
          >
            <Sparkles className={`w-4 h-4 ${isAiBuilding ? 'animate-spin' : ''}`} />
            <span>{isAiBuilding ? 'Synthesizing...' : t('generateWithAi')}</span>
          </button>
        </div>

        {/* Quick prompt ideas */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
          <span className="text-slate-500">Quick Prompts:</span>
          <button
            onClick={() => setAiPrompt('Sell weekly BTC Iron Condor with 0.18 delta wings when IV rank > 50')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            Weekly Iron Condor
          </button>
          <button
            onClick={() => setAiPrompt('Covered Call on ETH: sell 6% OTM Call when RSI > 58 with 65% profit exit')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            ETH Covered Call
          </button>
          <button
            onClick={() => setAiPrompt('Delta neutral short strangle with auto futures hedge at delta 0.35')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            Delta Neutral Hedge
          </button>
        </div>
      </div>

      {/* Preset Strategy Structure Buttons */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          {t('strategyType')} Presets
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {Object.entries(STRATEGY_PRESETS).map(([key, item]) => (
            <button
              key={key}
              onClick={() => handlePresetSelect(key)}
              className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                selectedStrategy.strategyType === key
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-white shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span className="text-xs font-bold capitalize truncate">
                {key.replace(/_/g, ' ')}
              </span>
              <span className="text-[10px] text-slate-500 line-clamp-1 mt-1">
                {item.legs?.length} Legs
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Strategy Editor & Payoff Diagram */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Strategy Parameters (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            {/* Name & Asset */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">Strategy Name</label>
                <input
                  type="text"
                  value={selectedStrategy.name || ''}
                  onChange={(e) => setSelectedStrategy({ ...selectedStrategy, name: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">{t('underlying')}</label>
                <select
                  value={selectedStrategy.underlying || 'BTC'}
                  onChange={(e) =>
                    setSelectedStrategy({
                      ...selectedStrategy,
                      underlying: e.target.value as 'BTC' | 'ETH' | 'SOL',
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="BTC">Bitcoin (BTC)</option>
                  <option value="ETH">Ethereum (ETH)</option>
                  <option value="SOL">Solana (SOL)</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400">Description</label>
              <textarea
                rows={2}
                value={selectedStrategy.description || ''}
                onChange={(e) => setSelectedStrategy({ ...selectedStrategy, description: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            {/* Option Legs Builder */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Options Legs Configuration</span>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => addLeg('CALL', 'SELL')}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-emerald-400 rounded-lg transition"
                  >
                    + Sell Call
                  </button>
                  <button
                    onClick={() => addLeg('PUT', 'SELL')}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-emerald-400 rounded-lg transition"
                  >
                    + Sell Put
                  </button>
                  <button
                    onClick={() => addLeg('PUT', 'BUY')}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-blue-400 rounded-lg transition"
                  >
                    + Buy Wing
                  </button>
                </div>
              </div>

              {selectedStrategy.legs?.map((leg, index) => (
                <div
                  key={leg.id || index}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono-numbers"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        leg.action === 'SELL' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {leg.action}
                    </span>
                    <span className="font-bold text-white">{leg.type}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500 text-[10px]">Strike Offset:</span>
                      <input
                        type="number"
                        value={leg.strikeOffsetPct}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const updated = [...(selectedStrategy.legs || [])];
                          updated[index].strikeOffsetPct = val;
                          setSelectedStrategy({ ...selectedStrategy, legs: updated });
                        }}
                        className="w-16 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-white text-center text-xs"
                      />
                      <span className="text-slate-400">%</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-slate-500 text-[10px]">Delta:</span>
                      <span className="text-slate-300 font-bold">{leg.targetDelta || 0.2}</span>
                    </div>

                    <button
                      onClick={() => removeLeg(leg.id)}
                      className="p-1 text-slate-500 hover:text-red-400 transition"
                      title="Remove Leg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Exit Conditions & Risk Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">{t('targetProfitPct')}</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={selectedStrategy.exitConditions?.targetProfitPct || 50}
                    onChange={(e) =>
                      setSelectedStrategy({
                        ...selectedStrategy,
                        exitConditions: {
                          ...selectedStrategy.exitConditions!,
                          targetProfitPct: parseFloat(e.target.value) || 50,
                        },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono-numbers"
                  />
                  <span className="text-slate-400 text-xs font-mono-numbers">%</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">{t('stopLossPct')}</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={selectedStrategy.exitConditions?.stopLossPct || 80}
                    onChange={(e) =>
                      setSelectedStrategy({
                        ...selectedStrategy,
                        exitConditions: {
                          ...selectedStrategy.exitConditions!,
                          stopLossPct: parseFloat(e.target.value) || 80,
                        },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono-numbers"
                  />
                  <span className="text-slate-400 text-xs font-mono-numbers">%</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">Exit Before Expiry</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={selectedStrategy.exitConditions?.daysToExpiryExit || 1}
                    onChange={(e) =>
                      setSelectedStrategy({
                        ...selectedStrategy,
                        exitConditions: {
                          ...selectedStrategy.exitConditions!,
                          daysToExpiryExit: parseInt(e.target.value, 10) || 1,
                        },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono-numbers"
                  />
                  <span className="text-slate-400 text-xs">Days</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              {saveStatus && (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{saveStatus}</span>
                </span>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => onNavigate('doctor')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Audit in AI Doctor</span>
                </button>
                <button
                  onClick={handleSaveStrategy}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{t('save')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Payoff Graph & Saved Strategies (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Payoff Graph */}
          <PayoffChart strategy={selectedStrategy} currentSpot={spot} />

          {/* User's Saved Strategies List */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                My Saved Strategies ({strategies.length})
              </h3>
            </div>

            {strategies.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No saved custom strategies yet. Click &apos;Save&apos; above or generate one with AI.
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {strategies.map((strat) => (
                  <div
                    key={strat.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs truncate max-w-[180px]">
                        {strat.name}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-emerald-400 font-mono-numbers">
                        {strat.underlying}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-1">{strat.description}</p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-xs">
                      <button
                        onClick={() => handleTogglePaper(strat.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-1 ${
                          strat.isPaperActive
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Play className="w-2.5 h-2.5" />
                        <span>{strat.isPaperActive ? 'Paper Active' : 'Start Paper'}</span>
                      </button>

                      <div className="flex items-center gap-1 text-slate-400">
                        <button
                          onClick={() => handleDuplicate(strat.id)}
                          className="p-1 hover:text-white transition"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(strat.id)}
                          className="p-1 hover:text-red-400 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
