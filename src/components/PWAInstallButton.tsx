import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';
import { Download, Smartphone, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const { language } = useLanguage();

  if (isInstalled) {
    return null;
  }

  return (
    <>
      {isInstallable ? (
        <button
          onClick={install}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition shadow-sm"
          title="Install BR BOT as Progressive Web App"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>{language === 'hi' ? 'ऐप इंस्टॉल करें' : 'Install App'}</span>
        </button>
      ) : isIOS ? (
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition"
        >
          <Smartphone className="w-3.5 h-3.5 text-blue-400" />
          <span>{language === 'hi' ? 'iOS ऐप' : 'Install on iOS'}</span>
        </button>
      ) : (
        <a
          href="/#apk"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60 hover:bg-slate-800 transition"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
          <span>{language === 'hi' ? 'Android APK' : 'Android APK'}</span>
        </a>
      )}

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                {language === 'hi' ? 'iPhone पर इंस्टॉल करें' : 'Install on iPhone / iPad'}
              </h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {language === 'hi' ? (
                <>
                  1. सफारी (Safari) में नीचे दिए गए <strong>Share (शेयर)</strong> बटन पर टैप करें।<br />
                  2. नीचे स्क्रॉल करके <strong>&apos;Add to Home Screen&apos;</strong> चुनें।<br />
                  3. अब BR BOT आपकी होम स्क्रीन पर ऐप की तरह उपलब्ध होगा।
                </>
              ) : (
                <>
                  1. Tap the <strong>Share</strong> button in Safari toolbar.<br />
                  2. Scroll down and tap <strong>Add to Home Screen</strong>.<br />
                  3. Launch BR BOT directly with native full-screen performance.
                </>
              )}
            </p>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full py-2 bg-emerald-600 hover:bg-emerald-500 font-semibold rounded-xl text-slate-950 transition text-sm"
            >
              {language === 'hi' ? 'समझ गया' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
