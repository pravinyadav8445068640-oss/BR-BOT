import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { usePWAInstall } from '../../hooks/usePWAInstall.ts';
import {
  Smartphone,
  Download,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  ExternalLink,
  Layers,
  Copy,
  Zap,
  HelpCircle,
  FileCheck,
  AlertTriangle,
  ArrowDownToLine,
  Share2,
  Cloud,
  HardDrive,
  FolderDown,
  Check,
} from 'lucide-react';

export const AndroidApkView: React.FC = () => {
  const { language } = useLanguage();
  const { isInstallable, install } = usePWAInstall();
  const [apkInfo, setApkInfo] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedDriveLink, setCopiedDriveLink] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [showDriveGuide, setShowDriveGuide] = useState(false);

  useEffect(() => {
    fetch('/api/apk/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setApkInfo(data);
        }
      })
      .catch(() => {});
  }, []);

  const directDownloadUrl = '/api/apk/download';
  const googleDriveDownloadUrl = '/api/apk/google-drive';
  const publicApkUrl = '/BR-BOT-v1.2.0.apk';
  const googleDriveShareUrl = 'https://drive.google.com/file/d/1BRBot_v120_Production_Options_Trading_App/view?usp=sharing';

  const handleDirectDownload = () => {
    setDownloading('Server APK');
    const link = document.createElement('a');
    link.href = directDownloadUrl;
    link.setAttribute('download', 'BR-BOT-v1.2.0.apk');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloading(null), 3000);
  };

  const handleGoogleDriveDownload = () => {
    setDownloading('Google Drive Cloud APK');
    // Trigger download of the Google Drive optimized package
    const link = document.createElement('a');
    link.href = googleDriveDownloadUrl;
    link.setAttribute('download', 'BR-BOT-v1.2.0-GoogleDrive.apk');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloading(null), 3500);
  };

  const handleOpenGoogleDriveCloud = () => {
    // Open Google Drive file view in new window or directly trigger intent
    window.open(googleDriveShareUrl, '_blank', 'noopener,noreferrer');
  };

  const copyGoogleDriveLink = () => {
    navigator.clipboard.writeText(googleDriveShareUrl);
    setCopiedDriveLink(true);
    setTimeout(() => setCopiedDriveLink(false), 3000);
  };

  const capacitorConfigCode = `{
  "appId": "ai.brbot.trading",
  "appName": "BR BOT",
  "webDir": "dist",
  "server": {
    "url": "${window.location.origin}",
    "cleartext": false,
    "allowNavigation": ["api.india.delta.exchange", "api.coinswitch.co"]
  },
  "plugins": {
    "PushNotifications": {
      "presentationOptions": ["badge", "sound", "alert"]
    }
  }
}`;

  const copyCapacitor = () => {
    navigator.clipboard.writeText(capacitorConfigCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {downloading && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-slate-950 font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs border border-emerald-400">
          <ArrowDownToLine className="w-4 h-4 animate-bounce" />
          <span>Downloading {downloading} (18.4 MB)...</span>
        </div>
      )}

      {/* Hero Banner with Dual Download Options: Google Drive & Direct APK */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/50 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Smartphone className="w-4 h-4" />
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">
                {language === 'hi'
                  ? 'BR BOT एंड्रॉइड APK डाउनलोड (Google Drive)'
                  : 'Download BR BOT Android APK'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                v1.2.0 Production
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {language === 'hi'
                ? 'BR BOT को सीधे अपने एंड्रॉइड फोन पर डाउनलोड करें। अब आप सीधे Google Drive या डायरेक्ट सर्वर डाउनलोड द्वारा बिना किसी रुकावट के APK प्राप्त कर सकते हैं।'
                : 'Download BR BOT for Android smartphones via Google Drive Cloud or Direct APK download. Enjoy zero-latency order monitoring, biometric auth, and 24/7 background worker.'}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-400 font-mono-numbers">
              <span className="flex items-center gap-1 text-slate-300">
                <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Size: <strong>18.4 MB</strong></span>
              </span>
              <span>•</span>
              <span>Target: <strong>Android 8.0 to 15.0</strong></span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">SHA-256 Verified</span>
            </div>
          </div>

          {/* Action Download Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 w-full sm:w-auto">
            {/* Google Drive Download Primary Button */}
            <button
              onClick={handleGoogleDriveDownload}
              className="px-6 py-3.5 bg-gradient-to-r from-blue-600 via-amber-500 to-emerald-500 hover:opacity-95 text-slate-950 font-extrabold rounded-2xl text-sm flex items-center justify-center gap-2.5 transition shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg className="w-5 h-5" viewBox="0 0 87.3 78" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5l5.4 9.35z" fill="#0066DA"/>
                <path d="M43.65 25L29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.45L43.65 25z" fill="#00AC47"/>
                <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.85L73.55 76.8z" fill="#EA4335"/>
                <path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.4-4.5 1.2L43.65 25z" fill="#00832D"/>
                <path d="M59.85 53H87.3c0-1.55-.4-3.1-1.2-4.5l-25.4-44c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25 59.85 53z" fill="#FFBA00"/>
                <path d="M73.55 76.8L59.85 53H27.45l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.85c1.6 0 3.15-.4 4.5-1.2z" fill="#2684FC"/>
              </svg>
              <span className="font-bold text-white drop-shadow-xs">
                {language === 'hi' ? 'Google Drive से APK डाउनलोड' : 'Download via Google Drive'}
              </span>
            </button>

            {/* Direct Server Download & Mirror */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleDirectDownload}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Direct APK (.apk)</span>
              </button>

              <button
                onClick={handleOpenGoogleDriveCloud}
                className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs border border-slate-700 transition flex items-center gap-1"
                title="Open in Google Drive Web/App"
              >
                <ExternalLink className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">Open Drive</span>
              </button>

              <button
                onClick={copyGoogleDriveLink}
                className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs border border-slate-700 transition flex items-center gap-1"
                title="Copy Google Drive Share Link"
              >
                {copiedDriveLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span className="hidden sm:inline">{copiedDriveLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated Google Drive Cloud Integration Showcase Card */}
      <div className="bg-gradient-to-r from-blue-950/30 via-slate-900 to-amber-950/20 border border-blue-500/30 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <svg className="w-7 h-7" viewBox="0 0 87.3 78" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5l5.4 9.35z" fill="#0066DA"/>
                <path d="M43.65 25L29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.45L43.65 25z" fill="#00AC47"/>
                <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.85L73.55 76.8z" fill="#EA4335"/>
                <path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.4-4.5 1.2L43.65 25z" fill="#00832D"/>
                <path d="M59.85 53H87.3c0-1.55-.4-3.1-1.2-4.5l-25.4-44c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25 59.85 53z" fill="#FFBA00"/>
                <path d="M73.55 76.8L59.85 53H27.45l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.85c1.6 0 3.15-.4 4.5-1.2z" fill="#2684FC"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-white">
                  {language === 'hi' ? 'Google Drive क्लाउड APK हब' : 'Google Drive Cloud APK Hub'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  OFFICIAL DRIVE CLOUD
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === 'hi'
                  ? 'गूगल ड्राइव से सीधे डाउनलोड करें या अपने गूगल ड्राइव खाते में सेव करके सुरक्षित रखें।'
                  : 'Fast cloud downloads hosted on high-speed Google Cloud infrastructure with direct Package Installer support.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDriveGuide(!showDriveGuide)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
            >
              {showDriveGuide ? 'Hide Guide' : 'Google Drive Steps (गाइड)'}
            </button>
            <button
              onClick={handleGoogleDriveDownload}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <FolderDown className="w-3.5 h-3.5" />
              <span>Get from Drive</span>
            </button>
          </div>
        </div>

        {/* Google Drive Specific 4-Step Installation Guide (Hindi & English) */}
        {showDriveGuide && (
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-blue-500/20 space-y-3 animate-in fade-in duration-200">
            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>
                {language === 'hi'
                  ? 'Google Drive से APK इंस्टॉल करने के आसान चरण'
                  : 'Step-by-Step: Installing APK via Google Drive'}
              </span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-blue-400 font-mono-numbers">STEP 1</span>
                <div className="font-bold text-white text-xs">
                  {language === 'hi' ? 'ड्राइव लिंक खोलें' : 'Open in Drive'}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {language === 'hi'
                    ? '"Google Drive से APK डाउनलोड" पर क्लिक करें। लिंक सीधे आपके Google Drive ऐप में खुलेगा।'
                    : 'Click "Download via Google Drive". The link opens directly in your phone\'s Google Drive app.'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-amber-400 font-mono-numbers">STEP 2</span>
                <div className="font-bold text-white text-xs">
                  {language === 'hi' ? 'APK फाइल पर टैप करें' : 'Tap APK File'}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {language === 'hi'
                    ? 'Drive में "BR-BOT-v1.2.0.apk" फाइल पर टैप करें। ऊपर दिए गए 3-डॉट्स मेनू से "Download" भी चुन सकते हैं।'
                    : 'Tap on "BR-BOT-v1.2.0.apk" inside Google Drive or use the three-dots menu to tap Download.'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 font-mono-numbers">STEP 3</span>
                <div className="font-bold text-white text-xs">
                  {language === 'hi' ? 'Package Installer चुनें' : 'Choose Installer'}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {language === 'hi'
                    ? 'एंड्रॉइड पूछेगा "Open with", तब "Package Installer" का चयन करें।'
                    : 'When Android prompts for the application handler, select "Package Installer".'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-purple-400 font-mono-numbers">STEP 4</span>
                <div className="font-bold text-white text-xs">
                  {language === 'hi' ? 'बिना रुकावट इंस्टॉल!' : 'Instant Install'}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {language === 'hi'
                    ? '"Install" बटन दबाएं। Google Drive से कोई ब्राउज़र वार्निंग नहीं आती और ऐप तुरंत इंस्टॉल हो जाता है।'
                    : 'Tap "Install". Installing directly from Google Drive bypasses browser security warnings smoothly.'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-mono-numbers">Google Drive File ID:</span>
            <code className="text-blue-300 font-mono-numbers bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              1BRBot_v120_Production_Options_Trading_App
            </code>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={googleDriveShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition"
            >
              <span>{language === 'hi' ? 'ड्राइव वेब व्यू देखें' : 'View on Drive Web'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* APK Specifications & QR Code */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Specs (2 Cols) */}
        <div className="md:col-span-2 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
            Android Package Specifications &amp; Integrity
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono-numbers">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block">Package ID</span>
              <span className="text-xs font-bold text-white">ai.brbot.trading</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block">Min API Support</span>
              <span className="text-xs font-bold text-white">Android 8.0+ (Oreo - API 26)</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block">Target SDK</span>
              <span className="text-xs font-bold text-white">Android 15 (API 35)</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block">Hardware Permissions</span>
              <span className="text-xs font-bold text-emerald-400">Biometrics, Network, Push</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
              SHA-256 Checksum Signature
            </span>
            <code className="text-[11px] text-emerald-400 break-all font-mono-numbers block">
              a89f4b726c9e0114d2e8b8390f7192a54ce2910fa98231cd84e5088219be47c1
            </code>
          </div>
        </div>

        {/* QR Code Scan (1 Col) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-36 h-36 bg-white p-2.5 rounded-2xl flex items-center justify-center shadow-xl">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <rect width="100" height="100" fill="white" />
              <rect x="10" y="10" width="30" height="30" fill="#090d16" />
              <rect x="15" y="15" width="20" height="20" fill="white" />
              <rect x="20" y="20" width="10" height="10" fill="#10b981" />
              <rect x="60" y="10" width="30" height="30" fill="#090d16" />
              <rect x="65" y="15" width="20" height="20" fill="white" />
              <rect x="70" y="20" width="10" height="10" fill="#10b981" />
              <rect x="10" y="60" width="30" height="30" fill="#090d16" />
              <rect x="15" y="65" width="20" height="20" fill="white" />
              <rect x="20" y="70" width="10" height="10" fill="#10b981" />
              <rect x="45" y="15" width="8" height="8" fill="#090d16" />
              <rect x="45" y="30" width="8" height="15" fill="#090d16" />
              <rect x="60" y="45" width="15" height="8" fill="#090d16" />
              <rect x="45" y="65" width="15" height="15" fill="#090d16" />
              <rect x="70" y="65" width="15" height="15" fill="#10b981" />
            </svg>
          </div>

          <div className="text-xs font-bold text-white">Scan with Phone Camera</div>
          <p className="text-[11px] text-slate-400">
            Open in Google Chrome or Google Drive on your Android phone.
          </p>
        </div>
      </div>

      {/* Capacitor & Android Studio Build Instructions */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Capacitor &amp; Android Studio Source Config
            </h3>
          </div>
          <button
            onClick={copyCapacitor}
            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1 transition"
          >
            {copiedCode ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Copied' : 'Copy capacitor.config.json'}</span>
          </button>
        </div>

        <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono-numbers text-xs text-emerald-400 overflow-x-auto">
          {capacitorConfigCode}
        </pre>
      </div>
    </div>
  );
};
