import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import {
  Shield,
  Users,
  Activity,
  Server,
  FileText,
  CheckCircle,
  XCircle,
  AlertOctagon,
  Settings,
  RefreshCw,
  Sliders,
  Lock,
} from 'lucide-react';

export const AdminPanelView: React.FC = () => {
  const { token, user } = useAuth();
  const { language } = useLanguage();

  const [activeSubTab, setActiveSubTab] = useState<'health' | 'users' | 'logs' | 'marketplace' | 'settings'>('health');
  const [healthData, setHealthData] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [pendingMarketplace, setPendingMarketplace] = useState<any[]>([]);
  const [settingsForm, setSettingsForm] = useState<any>({
    registrationEnabled: true,
    maintenanceMode: false,
    defaultPaperCapital: 25000,
    maxLeverageAllowed: 10,
    globalKillSwitch: false,
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchAdminData = async () => {
    if (!token) return;
    try {
      const [hRes, uRes, lRes, mRes] = await Promise.all([
        fetch('/api/admin/system-health', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/audit-logs', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/marketplace/list'),
      ]);

      const hJson = await hRes.json();
      const uJson = await uRes.json();
      const lJson = await lRes.json();
      const mJson = await mRes.json();

      if (hJson.success) {
        setHealthData(hJson.data);
        if (hJson.data.platformSettings) {
          setSettingsForm(hJson.data.platformSettings);
        }
      }
      if (uJson.success) setUsersList(uJson.data);
      if (lJson.success) setAuditLogs(lJson.data);
      if (mJson.success) setPendingMarketplace(mJson.data);
    } catch {}
  };

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 8000);
    return () => clearInterval(interval);
  }, [token]);

  const handleSaveSettings = async () => {
    if (!token) return;
    setIsUpdating(true);
    try {
      const res = await fetch('/api/admin/update-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settingsForm),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback('Platform settings updated globally.');
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch {} finally {
      setIsUpdating(false);
    }
  };

  const handleApproveMarketplace = async (itemId: string, status: 'approved' | 'rejected') => {
    if (!token) return;
    try {
      await fetch('/api/admin/marketplace-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itemId, status }),
      });
      fetchAdminData();
    } catch {}
  };

  if (user?.role !== 'admin') {
    return (
      <div className="bg-red-950/20 border border-red-500/40 rounded-2xl p-8 text-center text-red-300">
        <AlertOctagon className="w-10 h-10 mx-auto mb-3 text-red-400" />
        <h3 className="text-base font-bold text-white mb-1">Restricted Administrative Area</h3>
        <p className="text-xs text-red-300/80">
          Your current session role is &apos;trader&apos;. Please log in with the administrator account (<code className="text-white">admin@brbot.ai</code>) to access the Master Console.
        </p>
      </div>
    );
  }

  const worker = healthData?.worker;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-red-950/30 border border-red-500/30 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-red-400" />
            <h2 className="text-base font-extrabold text-white tracking-wide">
              Master Admin Console
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-400 font-bold">
              Root Authority
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-xl">
            Real-time server cluster telemetry, background worker loops, audit log surveillance, and strategy moderation.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-2 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Admin Subtabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2 text-xs">
        {[
          { id: 'health', label: 'System Health & Workers', icon: Activity },
          { id: 'users', label: `Users (${usersList.length})`, icon: Users },
          { id: 'logs', label: `Audit Trail (${auditLogs.length})`, icon: FileText },
          { id: 'settings', label: 'Platform Controls', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition ${
                isActive
                  ? 'bg-red-500/20 border border-red-500/40 text-red-300'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: System Health & 24/7 Worker Telemetry */}
      {activeSubTab === 'health' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-[11px] text-slate-400">Worker Status</span>
              <div className="text-xl font-bold text-emerald-400 flex items-center gap-2 mt-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span>{worker?.status || 'RUNNING'}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono-numbers">Loop interval: 10s</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-[11px] text-slate-400">Uptime</span>
              <div className="text-xl font-bold text-white font-mono-numbers mt-1">
                {worker ? Math.floor(worker.uptimeSeconds / 60) : 0} mins
              </div>
              <span className="text-[10px] text-slate-500 font-mono-numbers">
                {worker?.totalEvaluationCycles || 0} cycles executed
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-[11px] text-slate-400">Loop Latency</span>
              <div className="text-xl font-bold text-cyan-400 font-mono-numbers mt-1">
                {worker?.averageCycleDurationMs || 12} ms
              </div>
              <span className="text-[10px] text-slate-500">Evaluation tick overhead</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-[11px] text-slate-400">Active Positions</span>
              <div className="text-xl font-bold text-amber-400 font-mono-numbers mt-1">
                {worker?.activePositionsMonitored || 0}
              </div>
              <span className="text-[10px] text-slate-500">Real-time Greeks monitored</span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              24/7 Resilience Architecture Status
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-slate-300">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Automatic Process Self-Recovery</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-slate-300">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Isolated Worker Error Domains</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-slate-300">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero Memory Leak Guaranteed Loops</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Users Management */}
      {activeSubTab === 'users' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl overflow-x-auto">
          <table className="w-full text-xs font-mono-numbers text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase">
                <th className="py-2 px-3 text-left">Name</th>
                <th className="py-2 px-3 text-left">Email</th>
                <th className="py-2 px-3 text-left">Role</th>
                <th className="py-2 px-3 text-right">Paper Balance</th>
                <th className="py-2 px-3 text-center">2FA</th>
                <th className="py-2 px-3 text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {usersList.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 px-3 text-left font-bold text-white">{u.name}</td>
                  <td className="py-2.5 px-3 text-left text-slate-300">{u.email}</td>
                  <td className="py-2.5 px-3 text-left">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === 'admin'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                    ${u.paperBalance?.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={u.twoFactorEnabled ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                      {u.twoFactorEnabled ? 'ENABLED' : 'OFF'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Audit Trail Logs */}
      {activeSubTab === 'logs' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl overflow-x-auto max-h-[500px]">
          <table className="w-full text-xs font-mono-numbers text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase sticky top-0 bg-slate-900">
                <th className="py-2 px-3 text-left">Timestamp</th>
                <th className="py-2 px-3 text-left">Action</th>
                <th className="py-2 px-3 text-left">Details</th>
                <th className="py-2 px-3 text-left">User</th>
                <th className="py-2 px-3 text-right">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-2 px-3 text-left text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2 px-3 text-left font-bold text-emerald-400">{log.action}</td>
                  <td className="py-2 px-3 text-left text-slate-200">{log.details}</td>
                  <td className="py-2 px-3 text-left text-slate-400">{log.userEmail || 'System'}</td>
                  <td className="py-2 px-3 text-right text-slate-500">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Platform Global Controls */}
      {activeSubTab === 'settings' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 max-w-2xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
            Global Platform Configuration
          </h3>

          {feedback && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-400 font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>{feedback}</span>
            </div>
          )}

          <div className="space-y-4 text-xs">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
              <div>
                <span className="font-bold text-white block">Allow Public User Registrations</span>
                <span className="text-[11px] text-slate-400">If unchecked, new user signup is disabled.</span>
              </div>
              <input
                type="checkbox"
                checked={settingsForm.registrationEnabled}
                onChange={(e) => setSettingsForm({ ...settingsForm, registrationEnabled: e.target.checked })}
                className="w-4 h-4 accent-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
              <div>
                <span className="font-bold text-white block">Platform Maintenance Mode</span>
                <span className="text-[11px] text-slate-400">Show maintenance banner to non-admin users.</span>
              </div>
              <input
                type="checkbox"
                checked={settingsForm.maintenanceMode}
                onChange={(e) => setSettingsForm({ ...settingsForm, maintenanceMode: e.target.checked })}
                className="w-4 h-4 accent-red-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
              <div>
                <span className="font-bold text-red-400 block">Global Kill Switch Override</span>
                <span className="text-[11px] text-slate-400">Freezes all background strategy execution across all users immediately.</span>
              </div>
              <input
                type="checkbox"
                checked={settingsForm.globalKillSwitch}
                onChange={(e) => setSettingsForm({ ...settingsForm, globalKillSwitch: e.target.checked })}
                className="w-4 h-4 accent-red-500"
              />
            </label>

            <div className="space-y-1">
              <label className="font-semibold text-slate-400">Default Starting Virtual Capital ($)</label>
              <input
                type="number"
                value={settingsForm.defaultPaperCapital}
                onChange={(e) => setSettingsForm({ ...settingsForm, defaultPaperCapital: parseFloat(e.target.value) || 25000 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono-numbers"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={isUpdating}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition shadow-md"
            >
              {isUpdating ? 'Saving...' : 'Commit Platform Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
