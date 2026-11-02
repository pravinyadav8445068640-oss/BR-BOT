import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useMarket } from '../../context/MarketContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Sliders,
  Power,
  RotateCcw,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const RiskManagementView: React.FC = () => {
  const { user, updateUserRisk } = useAuth();
  const { positions, emergencyKillSwitchActive, triggerEmergencyKillSwitch, resumeTrading } = useMarket();
  const { t, language } = useLanguage();

  const [dailyLossLimit, setDailyLossLimit] = useState(user?.riskProfile?.maxDailyLossPct || 4);
  const [positionSizeLimit, setPositionSizeLimit] = useState(user?.riskProfile?.maxPositionSizePct || 15);
  const [portfolioExposureLimit, setPortfolioExposureLimit] = useState(user?.riskProfile?.maxPortfolioExposurePct || 50);
  const [autoStopLoss, setAutoStopLoss] = useState(user?.riskProfile?.autoStopLossPct || 20);
  const [showKillModal, setShowKillModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Greeks summation across open positions
  const openPos = positions.filter((p) => p.status === 'OPEN');
  const netDelta = Number(openPos.reduce((sum, p) => sum + (p.delta * p.contracts), 0).toFixed(3));
  const netThetaDaily = Number(openPos.reduce((sum, p) => sum + (p.theta * p.contracts), 0).toFixed(2));
  const netVega = Number(openPos.reduce((sum, p) => sum + (p.vega * p.contracts), 0).toFixed(2));

  const handleSaveRisk = async () => {
    const success = await updateUserRisk({
      maxDailyLossPct: dailyLossLimit,
      maxPositionSizePct: positionSizeLimit,
      maxPortfolioExposurePct: portfolioExposureLimit,
      autoStopLossPct: autoStopLoss,
    });
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleConfirmKill = async () => {
    await triggerEmergencyKillSwitch();
    setShowKillModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Emergency Pause / Kill Switch Box */}
      <div
        className={`rounded-2xl p-6 border shadow-2xl transition ${
          emergencyKillSwitchActive
            ? 'bg-red-950/30 border-red-500 text-white'
            : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-2xl ${
                emergencyKillSwitchActive ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Power className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white uppercase tracking-wider">
                  {emergencyKillSwitchActive ? t('killSwitchActive') : 'Master Emergency Kill Switch'}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    emergencyKillSwitchActive
                      ? 'bg-red-500 text-slate-950'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {emergencyKillSwitchActive ? 'PAUSED' : 'STANDBY'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                {language === 'hi'
                  ? 'आपातकालीन किल स्विच दबाने से सभी स्वचालित सिमुलेटेड ट्रेड तत्काल रुक जाते हैं और नई रणनीतियों की एंट्री फ्रीज हो जाती है।'
                  : 'Instantly halts all automated paper strategy executions, closes active triggers, and protects portfolio capital during abnormal flash-crashes.'}
              </p>
            </div>
          </div>

          <div>
            {emergencyKillSwitchActive ? (
              <button
                onClick={resumeTrading}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition shadow-lg shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t('resumeTradingBtn')}</span>
              </button>
            ) : (
              <button
                onClick={() => setShowKillModal(true)}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition shadow-xl shrink-0"
              >
                <Power className="w-4 h-4" />
                <span>{t('emergencyPauseBtn')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Greeks Risk Meter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Net Delta */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>{t('deltaExposure')}</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                Math.abs(netDelta) < 0.2
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {Math.abs(netDelta) < 0.2 ? 'DELTA NEUTRAL' : 'DIRECTIONAL'}
            </span>
          </div>
          <div className="text-2xl font-extrabold text-white font-mono-numbers">
            {netDelta > 0 ? `+${netDelta}` : netDelta}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Target bound: -0.20 to +0.20</p>
        </div>

        {/* Daily Theta Harvest */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>{t('thetaDecayTotal')}</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
              TIME DECAY
            </span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono-numbers">
            +${netThetaDaily} <span className="text-xs text-slate-400 font-normal">/ day</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Passive daily options decay value</p>
        </div>

        {/* Net Vega */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Net Vega Sensitivity</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
              IV EXPOSURE
            </span>
          </div>
          <div className="text-2xl font-extrabold text-cyan-400 font-mono-numbers">
            {netVega} <span className="text-xs text-slate-400 font-normal">$/1% IV</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Short volatility profile</p>
        </div>
      </div>

      {/* Risk Limits Configuration Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Autonomous Risk Circuit Breakers
            </h3>
          </div>
          <span className="text-xs text-slate-400">Enforced by 24/7 Background Worker</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Daily Loss Limit */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-300">{t('maxDailyLoss')}</label>
              <span className="font-bold text-emerald-400 font-mono-numbers">{dailyLossLimit}% of Balance</span>
            </div>
            <input
              type="range"
              min="1"
              max="15"
              step="0.5"
              value={dailyLossLimit}
              onChange={(e) => setDailyLossLimit(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              If daily paper losses reach this cap, the background engine automatically trips the Emergency Pause.
            </p>
          </div>

          {/* Max Position Size Limit */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-300">{t('maxPositionSize')}</label>
              <span className="font-bold text-emerald-400 font-mono-numbers">{positionSizeLimit}% of Capital</span>
            </div>
            <input
              type="range"
              min="5"
              max="35"
              step="1"
              value={positionSizeLimit}
              onChange={(e) => setPositionSizeLimit(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              Caps allocation into any single strike or spread structure to eliminate concentration risk.
            </p>
          </div>

          {/* Portfolio Exposure */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-300">{t('portfolioExposure')}</label>
              <span className="font-bold text-emerald-400 font-mono-numbers">{portfolioExposureLimit}% Total</span>
            </div>
            <input
              type="range"
              min="20"
              max="80"
              step="5"
              value={portfolioExposureLimit}
              onChange={(e) => setPortfolioExposureLimit(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              Retains sufficient cash margin cushion to avoid margin calls during rapid market expansion.
            </p>
          </div>

          {/* Default Auto Stop Loss */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-300">Mandatory Strategy Stop-Loss</label>
              <span className="font-bold text-emerald-400 font-mono-numbers">{autoStopLoss}% of Premium</span>
            </div>
            <input
              type="range"
              min="10"
              max="150"
              step="5"
              value={autoStopLoss}
              onChange={(e) => setAutoStopLoss(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              All newly built strategies must include at least this stop loss threshold to prevent naked blowups.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          {saveSuccess ? (
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Risk limits updated and armed in background engine!</span>
            </span>
          ) : (
            <span className="text-xs text-slate-500">Changes take effect immediately across all workers.</span>
          )}

          <button
            onClick={handleSaveRisk}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs transition shadow-sm"
          >
            {t('save')} Limits
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Kill Switch */}
      {showKillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border-2 border-red-500 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <ShieldAlert className="w-8 h-8 animate-bounce" />
              <div>
                <h3 className="font-extrabold text-base text-white">{t('confirmKillSwitch')}</h3>
                <span className="text-xs text-red-300">Emergency Protocol Execution</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {t('confirmKillSwitchDesc')}
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowKillModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleConfirmKill}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg"
              >
                Engage Kill Switch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
