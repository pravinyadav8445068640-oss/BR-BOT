import React, { useState, useEffect } from 'react';
import { MarketplaceItem, Strategy } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import {
  ShoppingBag,
  Star,
  Download,
  CheckCircle2,
  Filter,
  Search,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  PlusCircle,
  Copy,
} from 'lucide-react';

export const MarketplaceView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { token, user } = useAuth();
  const { t, language } = useLanguage();

  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [userStrategies, setUserStrategies] = useState<Strategy[]>([]);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishStrategyId, setPublishStrategyId] = useState('');
  const [publishTitle, setPublishTitle] = useState('');
  const [publishDesc, setPublishDesc] = useState('');
  const [publishCategory, setPublishCategory] = useState<'INCOME' | 'DELTA_NEUTRAL' | 'HIGH_VOLATILITY' | 'BEGINNER' | 'CRASH_PROTECTION'>('INCOME');
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [cloneSuccess, setCloneSuccess] = useState<string | null>(null);

  const fetchMarketplace = async () => {
    try {
      const res = await fetch('/api/marketplace/list');
      const data = await res.json();
      if (data.success) {
        setItems(data.data);
      }
    } catch {}
  };

  const fetchUserStrats = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/strategies/list', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setUserStrategies(data.data);
        setPublishStrategyId(data.data[0].id);
      }
    } catch {}
  };

  useEffect(() => {
    fetchMarketplace();
    fetchUserStrats();
  }, [token]);

  const handlePublish = async () => {
    if (!token || !publishStrategyId) return;
    try {
      const res = await fetch('/api/marketplace/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          strategyId: publishStrategyId,
          title: publishTitle,
          description: publishDesc,
          category: publishCategory,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setShowPublishModal(false);
        fetchMarketplace();
      }
    } catch {}
  };

  const handleCloneToMyLibrary = async (item: MarketplaceItem) => {
    if (!token) {
      alert('Please sign in to clone strategies.');
      return;
    }
    try {
      const res = await fetch('/api/strategies/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...item.strategyData,
          name: `${item.title} (Cloned from Marketplace)`,
          isPaperActive: false,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCloneSuccess(`Cloned "${item.title}" into your strategy library!`);
        setTimeout(() => setCloneSuccess(null), 3500);
      }
    } catch {}
  };

  const handleAddReview = async (itemId: string) => {
    if (!token || !newReviewText) return;
    try {
      const res = await fetch(`/api/marketplace/review/${itemId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: newReviewRating,
          comment: newReviewText,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewReviewText('');
        fetchMarketplace();
        if (selectedItem?.id === itemId) {
          setSelectedItem(data.data);
        }
      }
    } catch {}
  };

  const filteredItems = items.filter((item) => {
    const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesQuery =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {cloneSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs">
          <CheckCircle2 className="w-4 h-4" />
          <span>{cloneSuccess}</span>
        </div>
      )}

      {/* Top Marketplace Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30 border border-emerald-500/30 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-extrabold text-white tracking-wide">
              {language === 'hi' ? 'रणनीति बाज़ार (Strategy Marketplace)' : 'Strategy Marketplace'}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 font-bold">
              Community &amp; Verified Quants
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-xl">
            {language === 'hi'
              ? 'सत्यापित ट्रेडर्स द्वारा जांची गई ऑप्शंस रणनीतियां ब्राउज करें, 1-क्लिक में अपने खाते में क्लोन करें या अपनी खुद की रणनीति पब्लिश करें।'
              : 'Discover backtested crypto options strategies created by certified quantitative traders. Clone to your paper account in 1-click.'}
          </p>
        </div>

        <button
          onClick={() => setShowPublishModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Publish My Strategy</span>
        </button>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {['ALL', 'INCOME', 'DELTA_NEUTRAL', 'HIGH_VOLATILITY', 'BEGINNER', 'CRASH_PROTECTION'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-bold transition text-[11px] ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search strategies..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Marketplace Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-700 transition"
          >
            <div>
              {/* Category & Verified Badge */}
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 uppercase">
                  {item.category.replace(/_/g, ' ')}
                </span>
                {item.verified && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>VERIFIED BACKTEST</span>
                  </span>
                )}
              </div>

              <h3 className="text-sm font-bold text-white mb-1">{item.title}</h3>
              <p className="text-xs text-slate-400 line-clamp-2 mb-4">{item.description}</p>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 mb-4 text-center font-mono-numbers">
                <div>
                  <span className="text-[10px] text-slate-500 block">Win Rate</span>
                  <span className="text-xs font-bold text-emerald-400">{item.winRateVerified}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Risk Score</span>
                  <span className="text-xs font-bold text-slate-200">{item.riskScore} / 100</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Rating</span>
                  <span className="text-xs font-bold text-amber-400 flex items-center justify-center gap-0.5">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{item.rating}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-500 text-[11px]">By {item.authorName}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedItem(item)}
                  className="px-2.5 py-1 text-slate-400 hover:text-white rounded-lg transition"
                >
                  Reviews ({item.reviews?.length || 0})
                </button>
                <button
                  onClick={() => handleCloneToMyLibrary(item)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 transition shadow-sm"
                >
                  <Copy className="w-3 h-3" />
                  <span>Clone</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Review Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-slate-100 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-sm">{selectedItem.title}</h3>
                <span className="text-xs text-slate-400">Community Reviews &amp; Ratings</span>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Existing Reviews */}
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {selectedItem.reviews?.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  No community reviews yet. Be the first to share your feedback!
                </div>
              ) : (
                selectedItem.reviews.map((rev) => (
                  <div key={rev.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{rev.userName}</span>
                      <span className="text-amber-400 flex items-center gap-0.5">
                        {'★'.repeat(rev.rating)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{rev.comment}</p>
                    <span className="text-[10px] text-slate-500">{rev.date}</span>
                  </div>
                ))
              )}
            </div>

            {/* Add Review Box */}
            <div className="space-y-2 pt-3 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-300">Write a Review</label>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-slate-400">Your Rating:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewReviewRating(star)}
                    className={`text-sm ${star <= newReviewRating ? 'text-amber-400' : 'text-slate-600'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                rows={2}
                value={newReviewText}
                onChange={(e) => setNewReviewText(e.target.value)}
                placeholder="Share your paper trading experience with this strategy..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={() => handleAddReview(selectedItem.id)}
                  disabled={!newReviewText.trim()}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition"
                >
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Publish Strategy Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm">Publish Strategy to Marketplace</h3>
              <button onClick={() => setShowPublishModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Select Strategy from Your Library</label>
                <select
                  value={publishStrategyId}
                  onChange={(e) => setPublishStrategyId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                >
                  {userStrategies.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.underlying})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Marketplace Title</label>
                <input
                  type="text"
                  value={publishTitle}
                  onChange={(e) => setPublishTitle(e.target.value)}
                  placeholder="e.g. BTC Theta Decay Weekend Harvester"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Category</label>
                <select
                  value={publishCategory}
                  onChange={(e) => setPublishCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="INCOME">INCOME</option>
                  <option value="DELTA_NEUTRAL">DELTA NEUTRAL</option>
                  <option value="HIGH_VOLATILITY">HIGH VOLATILITY</option>
                  <option value="BEGINNER">BEGINNER FRIENDLY</option>
                  <option value="CRASH_PROTECTION">CRASH PROTECTION</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Strategy Overview</label>
                <textarea
                  rows={3}
                  value={publishDesc}
                  onChange={(e) => setPublishDesc(e.target.value)}
                  placeholder="Explain the Greeks profile, historical win rate, and market regime..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setShowPublishModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs shadow-sm"
              >
                Submit for Approval
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
