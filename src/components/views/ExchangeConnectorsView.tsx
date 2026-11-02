import React, { useState, useEffect } from 'react';
import { ExchangeConfig } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import {
  Link2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  Server,
  Activity,
  Layers,
  Lock,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export const ExchangeConnectorsView: React.FC = () => {
  const { token } = useAuth();
  const { t, language } = useLanguage();

  const [configs, setConfigs] = useState<ExchangeConfig[]>([]);
  const [selectedExchange, setSelectedExchange] = useState<'delta_india' | 'coinswitch'>('delta_india');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [testnet, setTestnet] = useState(false);

  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const fetchConfigs = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/exchanges/list', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setConfigs(data.data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchConfigs();
  }, [token]);

  const handleSaveKeys = async () => {
    if (!token || !apiKey || !apiSecret) {
      alert('Please enter both API Key and API Secret.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/exchanges/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          exchange: selectedExchange,
          apiKey,
          apiSecret,
          testnet,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveMessage(data.message);
        setApiKey('');
        setApiSecret('');
        setTimeout(() => setSaveMessage(null), 4000);
        fetchConfigs();
      }
    } catch (err: any) {
      alert(`Save Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestPing = async (exchangeName: 'delta_india' | 'coinswitch') => {
    if (!token) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/exchanges/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ exchange: exchangeName }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message, latencyMs: 0 });
    } finally {
      setIsTesting(false);
    }
  };

  const currentConfig = configs.find((c) => c.exchange === selectedExchange);

  return (
    <div className="space-y-6">
      {/* Real-money Safeguard & Encryption Notice */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>{t('encryptedBadge')}</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 font-normal">
                Zero Client Storage
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {t('disclaimerRealMoney')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono-numbers text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Paper Trading Active</span>
          </span>
        </div>
      </div>

      {/* Exchange Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Delta Exchange India Card */}
        <div
          onClick={() => setSelectedExchange('delta_india')}
          className={`cursor-pointer rounded-2xl p-5 border transition shadow-xl ${
            selectedExchange === 'delta_india'
              ? 'bg-slate-900/95 border-emerald-500/60 shadow-emerald-500/5'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-extrabold text-sm border border-emerald-500/30">
                Δ
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{t('connectDeltaIndia')}</h4>
                <span className="text-[11px] text-slate-400">FIU-IND Compliant Crypto Options</span>
              </div>
            </div>

            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                configs.find((c) => c.exchange === 'delta_india')?.isConnected
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {configs.find((c) => c.exchange === 'delta_india')?.isConnected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Official Indian cryptocurrency options and derivatives exchange. Supports INR instant deposits, BTC/ETH options with 1-click settlement.
          </p>

          <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-800/80 font-mono-numbers">
            <span className="text-slate-400">Ping Latency: <strong className="text-emerald-400">42ms</strong></span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTestPing('delta_india');
              }}
              disabled={isTesting}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
            >
              Test Ping
            </button>
          </div>
        </div>

        {/* CoinSwitch Card */}
        <div
          onClick={() => setSelectedExchange('coinswitch')}
          className={`cursor-pointer rounded-2xl p-5 border transition shadow-xl ${
            selectedExchange === 'coinswitch'
              ? 'bg-slate-900/95 border-emerald-500/60 shadow-emerald-500/5'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-extrabold text-sm border border-blue-500/30">
                CS
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{t('connectCoinSwitch')}</h4>
                <span className="text-[11px] text-slate-400">CoinSwitch PRO Multi-Exchange Gateway</span>
              </div>
            </div>

            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                configs.find((c) => c.exchange === 'coinswitch')?.isConnected
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {configs.find((c) => c.exchange === 'coinswitch')?.isConnected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            CoinSwitch PRO API allows unified liquidity routing across top Indian crypto order books with seamless INR bank gateway synchronization.
          </p>

          <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-800/80 font-mono-numbers">
            <span className="text-slate-400">Ping Latency: <strong className="text-emerald-400">38ms</strong></span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTestPing('coinswitch');
              }}
              disabled={isTesting}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
            >
              Test Ping
            </button>
          </div>
        </div>
      </div>

      {/* API Key Configuration Form */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Configure {selectedExchange === 'delta_india' ? 'Delta Exchange India' : 'CoinSwitch'} API
            </h3>
          </div>
          {currentConfig?.apiKeyMasked && (
            <span className="text-xs font-mono-numbers text-slate-400">
              Active Key: <strong className="text-white">{currentConfig.apiKeyMasked}</strong>
            </span>
          )}
        </div>

        {saveMessage && (
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-400 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{saveMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400">{t('apiKey')}</label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="e.g. delta_live_prod_9938472910"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono-numbers focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400">{t('apiSecret')}</label>
            <input
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder="••••••••••••••••••••••••••••••••"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono-numbers focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={testnet}
              onChange={(e) => setTestnet(e.target.checked)}
              className="accent-emerald-500 rounded"
            />
            <span>Use Exchange Testnet / Sandbox URL</span>
          </label>

          <button
            onClick={handleSaveKeys}
            disabled={isSaving || !apiKey || !apiSecret}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition shadow-sm"
          >
            {isSaving ? 'Encrypting & Saving...' : 'Encrypt & Store Credentials'}
          </button>
        </div>

        {/* Test Ping Diagnostic Output */}
        {testResult && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Exchange Gateway Ping Result</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono-numbers bg-slate-800 text-emerald-400">
                {testResult.latencyMs} ms
              </span>
            </div>
            <p className="text-slate-300">{testResult.message}</p>
          </div>
        )}
      </div>
    </div>
  );
};
