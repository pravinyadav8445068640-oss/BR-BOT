import React, { useState } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext.tsx';
import { LanguageProvider, useLanguage } from './context/LanguageContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { MarketProvider, useMarket } from './context/MarketContext.tsx';
import { PWAInstallButton } from './components/PWAInstallButton.tsx';
import { AuthModal } from './components/auth/AuthModal.tsx';

// Views
import { DashboardView } from './components/views/DashboardView.tsx';
import { StrategyBuilderView } from './components/views/StrategyBuilderView.tsx';
import { StrategyDoctorView } from './components/views/StrategyDoctorView.tsx';
import { BacktestLabView } from './components/views/BacktestLabView.tsx';
import { RiskManagementView } from './components/views/RiskManagementView.tsx';
import { ExchangeConnectorsView } from './components/views/ExchangeConnectorsView.tsx';
import { MarketplaceView } from './components/views/MarketplaceView.tsx';
import { TutorialCenterView } from './components/views/TutorialCenterView.tsx';
import { AIMemoryBotView } from './components/views/AIMemoryBotView.tsx';
import { AdminPanelView } from './components/views/AdminPanelView.tsx';
import { AndroidApkView } from './components/views/AndroidApkView.tsx';

// Icons
import {
  LayoutDashboard,
  Sparkles,
  Shield,
  Activity,
  Sliders,
  Link2,
  ShoppingBag,
  Video,
  Brain,
  Smartphone,
  ShieldAlert,
  Bell,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Power,
  ChevronDown,
  Download,
} from 'lucide-react';

function MainApp() {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { user, logout } = useAuth();
  const {
    marketOverview,
    notifications,
    unreadCount,
    emergencyKillSwitchActive,
    triggerEmergencyKillSwitch,
    resumeTrading,
    markNotificationsAsRead,
  } = useMarket();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const btc = marketOverview?.btc;
  const eth = marketOverview?.eth;
  const sol = marketOverview?.sol;

  const navItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'builder', label: t('strategyBuilder'), icon: Sparkles },
    { id: 'doctor', label: t('strategyDoctor'), icon: Shield },
    { id: 'backtest', label: t('backtesting'), icon: Activity },
    { id: 'risk', label: t('riskManagement'), icon: Sliders },
    { id: 'exchanges', label: t('exchangeConnectors'), icon: Link2 },
    { id: 'marketplace', label: t('marketplace'), icon: ShoppingBag },
    { id: 'tutorials', label: t('tutorials'), icon: Video },
    { id: 'memory', label: t('aiMemoryBot'), icon: Brain },
    { id: 'apk', label: t('androidApk'), icon: Smartphone },
  ];

  if (user?.role === 'admin') {
    navItems.push({ id: 'admin', label: t('adminPanel'), icon: ShieldAlert });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* 1. Global Crypto Options Real-Time Ticker Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-1.5 text-xs font-mono-numbers flex items-center justify-between overflow-x-auto whitespace-nowrap gap-6 z-40 backdrop-blur-md">
        <div className="flex items-center gap-6">
          {/* BTC */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">BTC</span>
            <span className="text-white font-bold">
              ${btc ? btc.price.toLocaleString() : '68,420.5'}
            </span>
            <span
              className={`text-[11px] font-bold ${
                (btc?.change24h || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {(btc?.change24h || 0) >= 0 ? '+' : ''}
              {btc?.change24h || 2.34}%
            </span>
          </div>

          {/* ETH */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">ETH</span>
            <span className="text-white font-bold">
              ${eth ? eth.price.toLocaleString() : '2,640.2'}
            </span>
            <span
              className={`text-[11px] font-bold ${
                (eth?.change24h || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {(eth?.change24h || 0) >= 0 ? '+' : ''}
              {eth?.change24h || 1.82}%
            </span>
          </div>

          {/* SOL */}
          <div className="flex items-center gap-2 hidden sm:flex">
            <span className="font-bold text-slate-400">SOL</span>
            <span className="text-white font-bold">
              ${sol ? sol.price.toLocaleString() : '184.6'}
            </span>
            <span
              className={`text-[11px] font-bold ${
                (sol?.change24h || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {(sol?.change24h || 0) >= 0 ? '+' : ''}
              {sol?.change24h || 4.15}%
            </span>
          </div>

          {/* PCR & Max Pain */}
          <div className="hidden md:flex items-center gap-4 text-slate-400 text-[11px]">
            <span>
              Put/Call Ratio:{' '}
              <strong className="text-cyan-400">{marketOverview?.pcrBtc || 0.78}</strong>
            </span>
            <span>
              BTC Max Pain:{' '}
              <strong className="text-amber-400">
                ${marketOverview?.maxPainBtc?.toLocaleString() || '68,000'}
              </strong>
            </span>
          </div>
        </div>

        {/* Safeguard status badge */}
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>PAPER SIMULATION ACTIVE</span>
          </span>
        </div>
      </div>

      {/* 2. Primary Navigation Header */}
      <header className="sticky top-0 z-50 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-extrabold text-white text-base">
                  BR
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-extrabold text-white text-base tracking-wider">BR BOT</h1>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500 text-slate-950">
                    AI PRO
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Crypto Options Desk</p>
              </div>
            </div>

            {/* Quick Actions (Kill Switch, Lang, Theme, PWA, User) */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Emergency Kill Switch Toggle */}
              {emergencyKillSwitchActive ? (
                <button
                  onClick={resumeTrading}
                  className="px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 animate-pulse transition shadow-lg"
                  title="Engaged: Click to resume"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Resume Trading</span>
                </button>
              ) : (
                <button
                  onClick={triggerEmergencyKillSwitch}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-red-950/40 text-slate-300 hover:text-red-400 border border-slate-700/80 text-xs font-bold flex items-center gap-1.5 transition"
                  title="Emergency Kill Switch"
                >
                  <Power className="w-3.5 h-3.5 text-red-500" />
                  <span className="hidden sm:inline">Kill Switch</span>
                </button>
              )}

              {/* PWA Install Button */}
              <PWAInstallButton />

              {/* Direct Google Drive / APK File Download Header Button */}
              <button
                onClick={() => setActiveTab('apk')}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold transition shadow-xs"
                title="Google Drive & Direct APK Download"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>Drive APK</span>
              </button>

              {/* Language Switcher */}
              <button
                onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition"
                title="Switch Language (English / हिंदी)"
              >
                {language === 'en' ? 'हिंदी' : 'EN'}
              </button>

              {/* Dark / Light Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Notifications Bell */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifMenu(!showNotifMenu);
                    if (!showNotifMenu) markNotificationsAsRead();
                  }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 relative transition"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  )}
                </button>

                {showNotifMenu && (
                  <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Alerts &amp; Notifications
                      </h4>
                      <span className="text-[10px] text-slate-400">{notifications.length} recent</span>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-500">
                          No alerts right now. System operating normally.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-2.5 rounded-xl text-xs space-y-0.5 border ${
                              n.type === 'risk'
                                ? 'bg-red-950/30 border-red-500/30 text-red-200'
                                : 'bg-slate-950 border-slate-800/80 text-slate-200'
                            }`}
                          >
                            <div className="font-bold text-white text-[11px] flex items-center justify-between">
                              <span>{n.title}</span>
                              <span className="text-[9px] text-slate-500 font-mono-numbers">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Account / Profile */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition"
                  >
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px]">
                      {user.name.charAt(0)}
                    </div>
                    <span className="hidden md:inline font-mono-numbers">
                      ${Math.round(user.paperBalance).toLocaleString()}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 space-y-3">
                      <div>
                        <div className="font-bold text-white text-xs">{user.name}</div>
                        <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 uppercase">
                            {user.role}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono-numbers">
                            Virtual: ${user.paperBalance.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800 space-y-1 text-xs">
                        {user.role === 'admin' && (
                          <button
                            onClick={() => {
                              setActiveTab('admin');
                              setShowProfileMenu(false);
                            }}
                            className="w-full text-left py-1.5 px-2 rounded-lg text-red-400 hover:bg-slate-800 transition font-semibold"
                          >
                            Admin Dashboard
                          </button>
                        )}
                        <button
                          onClick={() => {
                            logout();
                            setShowProfileMenu(false);
                          }}
                          className="w-full text-left py-1.5 px-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition flex items-center gap-2"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>{t('signOut')}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition shadow-sm"
                >
                  {t('signIn')}
                </button>
              )}
            </div>
          </div>

          {/* Navigation Bar Tabs */}
          <nav className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none border-t border-slate-800/60">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* 3. Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && <DashboardView onNavigate={(tab) => setActiveTab(tab)} />}
        {activeTab === 'builder' && <StrategyBuilderView onNavigate={(tab) => setActiveTab(tab)} />}
        {activeTab === 'doctor' && <StrategyDoctorView onNavigate={(tab) => setActiveTab(tab)} />}
        {activeTab === 'backtest' && <BacktestLabView />}
        {activeTab === 'risk' && <RiskManagementView />}
        {activeTab === 'exchanges' && <ExchangeConnectorsView />}
        {activeTab === 'marketplace' && <MarketplaceView onNavigate={(tab) => setActiveTab(tab)} />}
        {activeTab === 'tutorials' && <TutorialCenterView />}
        {activeTab === 'memory' && <AIMemoryBotView />}
        {activeTab === 'apk' && <AndroidApkView />}
        {activeTab === 'admin' && <AdminPanelView />}
      </main>

      {/* 4. Professional Compliance Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>BR BOT v1.2.0 Production • Multi-Exchange Options Trading Engine</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="hover:text-slate-300 cursor-pointer" onClick={() => setActiveTab('tutorials')}>
                Tutorial Center
              </span>
              <span className="hover:text-slate-300 cursor-pointer" onClick={() => setActiveTab('exchanges')}>
                Delta India API
              </span>
              <span className="hover:text-slate-300 cursor-pointer" onClick={() => setActiveTab('apk')}>
                Android APK
              </span>
            </div>
          </div>

          <p className="text-[10px] text-slate-600 leading-relaxed border-t border-slate-900 pt-3">
            {t('footerDisclaimer')}
          </p>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <MarketProvider>
            <MainApp />
          </MarketProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
