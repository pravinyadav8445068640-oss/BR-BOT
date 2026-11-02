import React, { useState, useEffect } from 'react';
import { Strategy, DoctorDiagnosis } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  RefreshCw,
  Zap,
  ArrowRight,
  Scale,
} from 'lucide-react';

export const StrategyDoctorView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { token } = useAuth();
  const { t, language } = useLanguage();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('');
  const [diagnosis, setDiagnosis] = useState<DoctorDiagnosis | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [languageMode, setLanguageMode] = useState<'both' | 'hi' | 'en'>('both');

  // Load user strategies
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
  }, [token]);

  const handleRunDiagnosis = async () => {
    if (!token) return;
    const strat = strategies.find((s) => s.id === selectedStrategyId);
    if (!strat) return;

    setIsDiagnosing(true);
    try {
      const res = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ strategy: strat }),
      });
      const data = await res.json();
      if (data.success) {
        setDiagnosis(data.data);
      }
    } catch (err: any) {
      alert(`Diagnosis Error: ${err.message}`);
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Run on first load once strategy is available
  useEffect(() => {
    if (selectedStrategyId && !diagnosis) {
      handleRunDiagnosis();
    }
  }, [selectedStrategyId]);

  const getScoreColor = (score: number) => {
    if (score >= 65) return 'text-red-400 border-red-500/40 bg-red-950/20';
    if (score >= 38) return 'text-amber-400 border-amber-500/40 bg-amber-950/20';
    return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20';
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/30 border border-cyan-500/30 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-extrabold text-white tracking-wide">
              {language === 'hi' ? 'AI रणनीति डॉक्टर (AI Strategy Doctor)' : 'AI Strategy Doctor'}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/20 text-cyan-400 font-bold">
              Bilingual Diagnostic Engine
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-xl">
            {language === 'hi'
              ? 'आपकी ऑप्शंस रणनीति में छिपे हुए असीमित जोखिम, मिसिंग स्टॉप-लॉस और लिक्विडेशन खतरों की पहचान करता है और सरल हिंदी में समझाता है।'
              : 'Audits options strategy for unbounded tail-risk, missing stop-loss rules, and explains vulnerabilities in plain Hindi & English.'}
          </p>
        </div>

        {/* Strategy Selector & Diagnose CTA */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedStrategyId}
            onChange={(e) => setSelectedStrategyId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            {strategies.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.underlying})
              </option>
            ))}
          </select>

          <button
            onClick={handleRunDiagnosis}
            disabled={isDiagnosing}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition shadow-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isDiagnosing ? 'animate-spin' : ''}`} />
            <span>{isDiagnosing ? 'Auditing...' : t('diagnoseBtn')}</span>
          </button>
        </div>
      </div>

      {diagnosis ? (
        <div className="space-y-6">
          {/* Top Metric Cards: Risk Score, Win Rate, Risk/Reward */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Risk Score */}
            <div className={`rounded-2xl p-4 border shadow-sm ${getScoreColor(diagnosis.riskScore)}`}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold uppercase tracking-wider text-slate-300">
                  Risk Danger Score
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900">
                  {diagnosis.riskCategory}
                </span>
              </div>
              <div className="text-3xl font-extrabold font-mono-numbers">
                {diagnosis.riskScore} <span className="text-sm font-normal text-slate-400">/ 100</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    diagnosis.riskScore > 65
                      ? 'bg-red-500'
                      : diagnosis.riskScore > 35
                      ? 'bg-amber-400'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${diagnosis.riskScore}%` }}
                />
              </div>
            </div>

            {/* Estimated Win Rate */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-semibold uppercase tracking-wider">Estimated Win Rate</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-extrabold text-emerald-400 font-mono-numbers">
                {diagnosis.estimatedWinRate}%
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Statistical probability based on strike delta &amp; theta profile.
              </p>
            </div>

            {/* Risk / Reward Ratio */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-semibold uppercase tracking-wider">Risk / Reward Ratio</span>
                <Scale className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-3xl font-extrabold text-white font-mono-numbers">
                {diagnosis.riskRewardRatio}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Capital efficiency score for premium collection.
              </p>
            </div>
          </div>

          {/* Bilingual Explanations: Hindi and English */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Hindi Explanation Card */}
            <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                  <span>🇮🇳</span>
                  <span>{t('hindiExplanation')}</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-mono-numbers">सरल भाषा में सारांश</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                {diagnosis.hindiExplanation}
              </p>

              {/* Hindi Flaws / Suggestions */}
              {diagnosis.logicalFlawsHi?.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-red-400 uppercase">पहचाने गए खतरे:</div>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
                    {diagnosis.logicalFlawsHi.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {diagnosis.improvementSuggestionsHi?.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-emerald-400 uppercase">सुधार की सलाह:</div>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
                    {diagnosis.improvementSuggestionsHi.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* English Explanation Card */}
            <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                  <span>🌐</span>
                  <span>{t('englishExplanation')}</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-mono-numbers">Quantitative Audit</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                {diagnosis.englishExplanation}
              </p>

              {/* English Flaws / Suggestions */}
              {diagnosis.logicalFlawsEn?.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-red-400 uppercase">Vulnerabilities:</div>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
                    {diagnosis.logicalFlawsEn.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {diagnosis.improvementSuggestionsEn?.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-emerald-400 uppercase">Recommended Enhancements:</div>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
                    {diagnosis.improvementSuggestionsEn.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Disclaimer Banner */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{diagnosis.disclaimer}</span>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-cyan-500" />
          <h3 className="text-sm font-bold text-white mb-1">AI Strategy Doctor is analyzing...</h3>
          <p className="text-xs text-slate-500">Checking Greeks distribution, margin requirements, and exit conditions.</p>
        </div>
      )}
    </div>
  );
};
