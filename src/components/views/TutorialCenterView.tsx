import React, { useState, useEffect } from 'react';
import { TutorialModule } from '../../types/index.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import {
  Video,
  Play,
  CheckCircle,
  FileText,
  Clock,
  Sparkles,
  BookOpen,
  Volume2,
  ChevronRight,
  Globe,
} from 'lucide-react';

export const TutorialCenterView: React.FC = () => {
  const { language } = useLanguage();
  const [tutorials, setTutorials] = useState<TutorialModule[]>([]);
  const [selectedModule, setSelectedModule] = useState<TutorialModule | null>(null);
  const [activeLangTab, setActiveLangTab] = useState<'hi' | 'en'>(language === 'hi' ? 'hi' : 'en');
  const [completedIds, setCompletedIds] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('brbot_completed_tutorials') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    fetch('/api/tutorials/list')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.length > 0) {
          setTutorials(data.data);
          setSelectedModule(data.data[0]);
        }
      })
      .catch(() => {});
  }, []);

  const toggleComplete = (id: number) => {
    const updated = completedIds.includes(id)
      ? completedIds.filter((item) => item !== id)
      : [...completedIds, id];
    setCompletedIds(updated);
    localStorage.setItem('brbot_completed_tutorials', JSON.stringify(updated));
  };

  const currentMod = selectedModule || tutorials[0];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/30 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Video className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-extrabold text-white tracking-wide">
              {language === 'hi' ? 'वीडियो ट्यूटोरियल केंद्र (Video Tutorial Center)' : 'Video Tutorial Center'}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-400 font-bold">
              12 Complete Modules • Hindi &amp; English
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-xl">
            {language === 'hi'
              ? 'शुरुआती से लेकर उन्नत स्तर तक क्रिप्टो ऑप्शंस सेलिंग, ग्रीक्स, हेजिंग और AI टूल्स का संपूर्ण वीडियो और लिखित प्रशिक्षण।'
              : 'Complete curriculum covering crypto options selling, Greeks management, API connections, and algorithmic hedging.'}
          </p>
        </div>

        {/* Progress Tracker */}
        <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
          <div className="text-right">
            <div className="text-xs font-bold text-white font-mono-numbers">
              {completedIds.length} / 12 Completed
            </div>
            <div className="text-[10px] text-slate-400">Mastery Progress</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-950 border-2 border-indigo-500 flex items-center justify-center font-bold text-indigo-400 text-xs font-mono-numbers">
            {Math.round((completedIds.length / 12) * 100)}%
          </div>
        </div>
      </div>

      {/* Main Video & Playlist Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Video Player & Transcripts (8 Cols) */}
        {currentMod && (
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              {/* HTML5 Video Player */}
              <div className="relative aspect-video bg-black flex items-center justify-center">
                <video
                  key={currentMod.id}
                  controls
                  poster="/icon.svg"
                  className="w-full h-full object-cover"
                >
                  <source src={currentMod.videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>

              {/* Video Title Bar */}
              <div className="p-5 border-b border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-500/20 text-indigo-400 font-mono-numbers">
                      Module {currentMod.id}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{currentMod.duration}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                      {currentMod.category}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleComplete(currentMod.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                      completedIds.includes(currentMod.id)
                        ? 'bg-emerald-600 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{completedIds.includes(currentMod.id) ? 'Completed' : 'Mark as Complete'}</span>
                  </button>
                </div>

                <h3 className="text-base font-extrabold text-white">
                  {activeLangTab === 'hi' ? currentMod.titleHi : currentMod.titleEn}
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {activeLangTab === 'hi' ? currentMod.descriptionHi : currentMod.descriptionEn}
                </p>
              </div>

              {/* Language Switcher for Transcripts */}
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span>Video Transcripts &amp; Step-by-Step Instructions</span>
                  </h4>

                  <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
                    <button
                      onClick={() => setActiveLangTab('hi')}
                      className={`px-3 py-1 rounded-lg font-bold transition ${
                        activeLangTab === 'hi'
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🇮🇳 हिंदी (Hindi)
                    </button>
                    <button
                      onClick={() => setActiveLangTab('en')}
                      className={`px-3 py-1 rounded-lg font-bold transition ${
                        activeLangTab === 'en'
                          ? 'bg-indigo-500 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🌐 English
                    </button>
                  </div>
                </div>

                {/* Transcripts Paragraphs */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs text-slate-300 leading-relaxed font-medium">
                  {(activeLangTab === 'hi' ? currentMod.transcriptHi : currentMod.transcriptEn)?.map(
                    (line, idx) => (
                      <p key={idx} className="flex items-start gap-2">
                        <span className="text-indigo-400 font-mono-numbers shrink-0 font-bold">
                          {(idx + 1).toString().padStart(2, '0')}.
                        </span>
                        <span>{line}</span>
                      </p>
                    )
                  )}
                </div>

                {/* Key Takeaways & Checklist */}
                <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 space-y-2">
                  <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{activeLangTab === 'hi' ? 'मुख्य बातें (Key Takeaways)' : 'Key Takeaways'}</span>
                  </div>
                  <ul className="text-xs text-slate-200 space-y-1.5 list-disc pl-5">
                    {(activeLangTab === 'hi' ? currentMod.keyTakeawaysHi : currentMod.keyTakeawaysEn)?.map(
                      (point, idx) => (
                        <li key={idx}>{point}</li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right Column: 12 Modules Playlist (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Curriculum Playlist</span>
              <span className="text-[10px] text-slate-500 font-mono-numbers">12 Modules</span>
            </h4>

            <div className="space-y-1.5 max-h-[640px] overflow-y-auto pr-1">
              {tutorials.map((mod) => {
                const isSelected = currentMod?.id === mod.id;
                const isDone = completedIds.includes(mod.id);
                return (
                  <button
                    key={mod.id}
                    onClick={() => setSelectedModule(mod)}
                    className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-950/50 border-indigo-500/60 text-white shadow-md'
                        : 'bg-slate-950/80 border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 font-mono-numbers ${
                          isDone
                            ? 'bg-emerald-500 text-slate-950'
                            : isSelected
                            ? 'bg-indigo-500 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isDone ? '✓' : mod.id}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold truncate">
                          {language === 'hi' ? mod.titleHi : mod.titleEn}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5 font-mono-numbers">
                          <span>{mod.category}</span>
                          <span>•</span>
                          <span>{mod.duration}</span>
                        </div>
                      </div>
                    </div>

                    <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-400' : 'text-slate-600'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
