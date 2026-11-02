import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import {
  Brain,
  Send,
  Trash2,
  Sparkles,
  Bot,
  User as UserIcon,
  Bookmark,
  Shield,
  Layers,
  CheckCircle2,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  textEn: string;
  textHi: string;
  timestamp: string;
}

interface MemoryItem {
  id: string;
  key: string;
  value: string;
  category: string;
  updatedAt: string;
}

export const AIMemoryBotView: React.FC = () => {
  const { token, user } = useAuth();
  const { language } = useLanguage();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'bot',
      textEn: `Hello ${user?.name || 'Trader'}! I am BR BOT AI Memory Assistant. I remember your trading preferences, preferred delta strikes, and past backtests. How can I assist your options trading today?`,
      textHi: `नमस्ते ${user?.name || 'ट्रेडर'}! मैं BR BOT AI मेमोरी असिस्टेंट हूं। मुझे आपकी पसंदीदा रणनीतियां, रिस्क टॉलरेंस और स्ट्राइक प्रेफरेंस याद रहते हैं। आज मैं आपकी क्या सहायता कर सकता हूं?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [memories, setMemories] = useState<MemoryItem[]>([]);

  const fetchMemories = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/ai/memories', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMemories(data.data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchMemories();
  }, [token]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !token || isSending) return;

    const userText = inputMessage;
    setInputMessage('');

    const newMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      textEn: userText,
      textHi: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setIsSending(true);

    try {
      const res = await fetch('/api/ai/chat-memory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userText }),
      });
      const data = await res.json();
      if (data.success) {
        const botMsg: ChatMessage = {
          id: `b_${Date.now()}`,
          sender: 'bot',
          textEn: data.data.replyEn,
          textHi: data.data.replyHi,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botMsg]);
        fetchMemories();
      }
    } catch {
      // fallback
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    if (!token) return;
    try {
      await fetch(`/api/ai/memories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMemories();
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950/40 border border-purple-500/30 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-extrabold text-white tracking-wide">
              {language === 'hi' ? 'AI मेमोरी बॉट (AI Memory Bot)' : 'AI Memory Bot Assistant'}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/20 text-purple-400 font-bold">
              Long-Term Contextual Memory
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-xl">
            {language === 'hi'
              ? 'यह AI असिस्टेंट आपकी रणनीतियों, बैकटेस्ट रिजल्ट्स और रिस्क प्रोफाइल को याद रखता है ताकि हर चर्चा आपके अनुरूप हो।'
              : 'Persistent context engine that tracks your trading strategies, preferred strikes, backtests, and risk boundaries across sessions.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Chat (8 Cols) */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col h-[580px] shadow-2xl overflow-hidden">
          {/* Chat Messages */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {messages.map((msg) => {
              const isBot = msg.sender === 'bot';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isBot ? '' : 'flex-row-reverse'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isBot
                        ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                        : 'bg-emerald-600 text-slate-950 font-bold'
                    }`}
                  >
                    {isBot ? <Bot className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                  </div>

                  <div
                    className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-1 ${
                      isBot
                        ? 'bg-slate-950 border border-slate-800 text-slate-200'
                        : 'bg-emerald-600 text-slate-950 font-medium'
                    }`}
                  >
                    <p>{language === 'hi' ? msg.textHi : msg.textEn}</p>
                    <div
                      className={`text-[9px] font-mono-numbers text-right ${
                        isBot ? 'text-slate-500' : 'text-slate-900/80'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}

            {isSending && (
              <div className="flex items-center gap-2 text-xs text-purple-400 bg-slate-950 p-3 rounded-xl border border-slate-800 w-fit">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>BR BOT is recalling memory context...</span>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={
                language === 'hi'
                  ? 'BR BOT से अपनी ऑप्शंस रणनीति, ग्रीक्स या रिस्क के बारे में पूछें...'
                  : 'Ask BR BOT about your options strategies, Greek rebalancing, or backtests...'
              }
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={isSending || !inputMessage.trim()}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </div>
        </div>

        {/* Right Column: Persistent Memory Inspector (4 Cols) */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Saved User Memories ({memories.length})
              </h3>
            </div>
            <span className="text-[10px] text-slate-500">Persistent Storage</span>
          </div>

          <p className="text-[11px] text-slate-400">
            {language === 'hi'
              ? 'यहाँ वे बातें सूचीबद्ध हैं जो AI ने आपकी प्राथमिकताओं और रिस्क टॉलरेंस के बारे में सीखी हैं। आप इन्हें कभी भी हटा सकते हैं।'
              : 'Items BR BOT has extracted and remembered about your risk boundaries and favorite strategies. You can clear them at any time.'}
          </p>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {memories.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No memories recorded yet. Tell the bot about your favorite coins and risk rules in the chat.
              </div>
            ) : (
              memories.map((mem) => (
                <div
                  key={mem.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition space-y-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-purple-400 text-[11px] uppercase tracking-wide">
                      {mem.key.replace(/_/g, ' ')}
                    </span>
                    <button
                      onClick={() => handleDeleteMemory(mem.id)}
                      className="p-1 text-slate-500 hover:text-red-400 transition"
                      title="Delete Memory"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 font-medium">{mem.value}</p>
                  <span className="text-[9px] text-slate-500 font-mono-numbers">
                    Updated {new Date(mem.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
