import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: 'admin' | 'trader';
  isVerified: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  createdAt: string;
  lastLoginAt: string;
  paperBalance: number; // e.g. 10,000 USDT virtual
  currency: 'USDT' | 'INR';
  riskProfile: {
    maxDailyLossPct: number;
    maxPositionSizePct: number;
    maxPortfolioExposurePct: number;
    autoStopLossPct: number;
    emergencyPause: boolean;
  };
}

export interface Session {
  token: string;
  userId: string;
  expiresAt: string;
  ip: string;
  userAgent: string;
}

export interface LoginHistory {
  id: string;
  userId: string;
  ip: string;
  userAgent: string;
  location: string;
  status: 'SUCCESS' | 'FAILED';
  timestamp: string;
}

export interface ExchangeConfig {
  id: string;
  userId: string;
  exchange: 'delta_india' | 'coinswitch';
  apiKeyMasked: string;
  apiKeyEncrypted: string;
  apiSecretEncrypted: string;
  iv: string;
  authTag: string;
  testnet: boolean;
  isConnected: boolean;
  lastPingAt: string;
  realTradingEnabled: boolean; // strictly disabled by default
  balanceSummary: {
    totalUSDT: number;
    totalINR: number;
    availableMargin: number;
    usedMargin: number;
  };
}

export interface OptionLeg {
  id: string;
  action: 'BUY' | 'SELL';
  type: 'CALL' | 'PUT';
  strikeOffsetPct: number; // e.g. +2% OTM or 0 ATM
  targetStrike?: number;
  targetDelta?: number;
  ratio: number; // e.g. 1
  premiumEst?: number;
}

export interface Strategy {
  id: string;
  userId: string;
  name: string;
  description: string;
  strategyType:
    | 'covered_call'
    | 'cash_secured_put'
    | 'iron_condor'
    | 'iron_butterfly'
    | 'short_strangle'
    | 'short_straddle'
    | 'bull_put_spread'
    | 'bear_call_spread'
    | 'delta_neutral'
    | 'hedging';
  underlying: 'BTC' | 'ETH' | 'SOL';
  legs: OptionLeg[];
  entryConditions: {
    indicator: string; // 'RSI' | 'EMA' | 'MACD' | 'IV_PERCENTILE' | 'SUPERTREND' | 'PRICE'
    operator: '>' | '<' | 'CROSS_ABOVE' | 'CROSS_BELOW' | 'BETWEEN';
    value: number | string;
    secondaryValue?: number;
    logic: 'AND' | 'OR';
  }[];
  exitConditions: {
    targetProfitPct: number; // e.g. 50% of premium
    stopLossPct: number; // e.g. 100% of premium
    daysToExpiryExit: number; // e.g. exit 1 day before expiry
    trailingStopPct?: number;
  };
  positionSizing: {
    type: 'FIXED_CONTRACTS' | 'PERCENT_OF_EQUITY';
    value: number;
  };
  expiryType: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  strikeSelectionMode: 'DELTA' | 'PERCENT_OTM' | 'ATM';
  deltaTarget?: number;
  hedgeCondition?: {
    enabled: boolean;
    triggerDelta: number; // e.g. hedge if total delta > 0.35
    hedgeInstrument: 'FUTURES' | 'SPOT';
  };
  isPaperActive: boolean;
  isLiveExecution: boolean; // default false
  createdAt: string;
  updatedAt: string;
}

export interface PaperPosition {
  id: string;
  userId: string;
  strategyId: string;
  strategyName: string;
  symbol: string; // e.g. BTC-26OCT26-68000-C
  underlying: 'BTC' | 'ETH' | 'SOL';
  side: 'BUY' | 'SELL';
  optionType: 'CALL' | 'PUT';
  strike: number;
  expiry: string;
  contracts: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  pnlPct: number;
  delta: number;
  theta: number;
  gamma: number;
  vega: number;
  status: 'OPEN' | 'CLOSED';
  openedAt: string;
  closedAt?: string;
  closeReason?: string;
}

export interface BacktestRecord {
  id: string;
  userId: string;
  strategyId?: string;
  strategyName: string;
  exchange: 'delta_india' | 'coinswitch';
  instrument: 'BTC-USDT' | 'ETH-USDT' | 'SOL-USDT';
  timeframe: '15m' | '1h' | '4h' | '1D';
  dateRange: string;
  initialCapital: number;
  finalCapital: number;
  netPnl: number;
  netPnlPct: number;
  winRate: number;
  maxDrawdown: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  profitFactor: number;
  sharpeRatio: number;
  equityCurve: { time: string; equity: number; drawdown: number }[];
  trades: {
    id: string;
    entryTime: string;
    exitTime: string;
    strategyType: string;
    legs: string;
    pnl: number;
    pnlPct: number;
    exitReason: string;
  }[];
  createdAt: string;
}

export interface MarketplaceItem {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  description: string;
  category: 'INCOME' | 'DELTA_NEUTRAL' | 'HIGH_VOLATILITY' | 'BEGINNER' | 'CRASH_PROTECTION';
  strategyData: Partial<Strategy>;
  riskScore: number; // 1 - 100
  winRateVerified: number;
  verified: boolean;
  rating: number;
  downloadsCount: number;
  status: 'approved' | 'pending' | 'rejected';
  reviews: {
    id: string;
    userId: string;
    userName: string;
    rating: number;
    comment: string;
    date: string;
  }[];
  createdAt: string;
}

export interface TutorialModule {
  id: number;
  titleEn: string;
  titleHi: string;
  category: string;
  duration: string;
  videoUrl: string;
  descriptionEn: string;
  descriptionHi: string;
  transcriptEn: string[];
  transcriptHi: string[];
  keyTakeawaysEn: string[];
  keyTakeawaysHi: string[];
}

export interface AIMemory {
  id: string;
  userId: string;
  key: string;
  value: string;
  category: 'strategy_pref' | 'risk_note' | 'backtest_insight' | 'conversation';
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'risk' | 'strategy' | 'order' | 'api' | 'security' | 'system';
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  details: string;
  ip: string;
  timestamp: string;
}

export interface PlatformSettings {
  registrationEnabled: boolean;
  maintenanceMode: boolean;
  defaultPaperCapital: number;
  maxLeverageAllowed: number;
  globalKillSwitch: boolean;
}

export interface DatabaseSchema {
  users: User[];
  sessions: Session[];
  loginHistory: LoginHistory[];
  exchangeConfigs: ExchangeConfig[];
  strategies: Strategy[];
  paperPositions: PaperPosition[];
  backtestRecords: BacktestRecord[];
  marketplace: MarketplaceItem[];
  tutorials: TutorialModule[];
  aiMemories: AIMemory[];
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
  platformSettings: PlatformSettings;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'brbot_db.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let dbCache: DatabaseSchema | null = null;

export function loadDatabase(): DatabaseSchema {
  if (dbCache) return dbCache;

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      dbCache = JSON.parse(raw);
      return dbCache!;
    } catch (e) {
      console.error('Failed to read db file, initializing with seeds:', e);
    }
  }

  dbCache = getInitialSeedData();
  saveDatabase(dbCache);
  return dbCache;
}

export function saveDatabase(data?: DatabaseSchema): void {
  const toSave = data || dbCache;
  if (!toSave) return;
  dbCache = toSave;
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(toSave, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Error saving database:', err);
  }
}

function getInitialSeedData(): DatabaseSchema {
  // Hash for Admin@BRBot2026! with salt 'brbot_secure_salt_2026'
  // Using standard sha256 hex
  const adminSalt = 'brbot_admin_salt_8921';
  const traderSalt = 'brbot_trader_salt_1234';

  const defaultAdminUser: User = {
    id: 'user_admin_01',
    name: 'BR BOT System Administrator',
    email: 'admin@brbot.ai',
    // Pre-hashed for Admin@BRBot2026!
    passwordHash: '8f7d988dbf28eec4a2ee6e06b9b3cfef89cf18e47448d3ad48e11a2f6fb91295',
    salt: adminSalt,
    role: 'admin',
    isVerified: true,
    twoFactorEnabled: true,
    twoFactorSecret: 'JBSWY3DPEHPK3PXP',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    paperBalance: 50000,
    currency: 'USDT',
    riskProfile: {
      maxDailyLossPct: 3,
      maxPositionSizePct: 10,
      maxPortfolioExposurePct: 40,
      autoStopLossPct: 15,
      emergencyPause: false,
    },
  };

  const defaultTraderUser: User = {
    id: 'user_trader_01',
    name: 'Pravin Yadav (Pro Trader)',
    email: 'pravinyadav8445068640@gmail.com',
    // Pre-hashed for Trader@BRBot2026!
    passwordHash: 'c74f5195ea11dbf5b9cb030a5fb29124be3f2184f4d221e64927b2c0f653457a',
    salt: traderSalt,
    role: 'trader',
    isVerified: true,
    twoFactorEnabled: false,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    paperBalance: 25000,
    currency: 'USDT',
    riskProfile: {
      maxDailyLossPct: 4,
      maxPositionSizePct: 15,
      maxPortfolioExposurePct: 50,
      autoStopLossPct: 20,
      emergencyPause: false,
    },
  };

  const seedStrategies: Strategy[] = [
    {
      id: 'strat_iron_condor_btc',
      userId: 'user_trader_01',
      name: 'Weekend BTC Theta Squeeze Iron Condor',
      description: 'Collects rapid weekend theta decay by selling 0.20 Delta Call and Put spreads while the market consolidates.',
      strategyType: 'iron_condor',
      underlying: 'BTC',
      legs: [
        { id: 'leg_1', action: 'SELL', type: 'PUT', strikeOffsetPct: -4, targetDelta: -0.20, ratio: 1 },
        { id: 'leg_2', action: 'BUY', type: 'PUT', strikeOffsetPct: -7, targetDelta: -0.08, ratio: 1 },
        { id: 'leg_3', action: 'SELL', type: 'CALL', strikeOffsetPct: 4, targetDelta: 0.20, ratio: 1 },
        { id: 'leg_4', action: 'BUY', type: 'CALL', strikeOffsetPct: 7, targetDelta: 0.08, ratio: 1 },
      ],
      entryConditions: [
        { indicator: 'RSI', operator: 'BETWEEN', value: 42, secondaryValue: 58, logic: 'AND' },
        { indicator: 'IV_PERCENTILE', operator: '>', value: 50, logic: 'AND' },
      ],
      exitConditions: {
        targetProfitPct: 50,
        stopLossPct: 80,
        daysToExpiryExit: 1,
      },
      positionSizing: {
        type: 'PERCENT_OF_EQUITY',
        value: 10,
      },
      expiryType: 'WEEKLY',
      strikeSelectionMode: 'DELTA',
      deltaTarget: 0.2,
      isPaperActive: true,
      isLiveExecution: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'strat_covered_call_eth',
      userId: 'user_trader_01',
      name: 'ETH Yield Harvester Covered Call',
      description: 'Sells monthly 0.25 Delta OTM Calls against spot ETH holdings for consistent yield generation.',
      strategyType: 'covered_call',
      underlying: 'ETH',
      legs: [
        { id: 'leg_cc_1', action: 'SELL', type: 'CALL', strikeOffsetPct: 8, targetDelta: 0.25, ratio: 1 },
      ],
      entryConditions: [
        { indicator: 'RSI', operator: '>', value: 55, logic: 'AND' },
      ],
      exitConditions: {
        targetProfitPct: 70,
        stopLossPct: 150,
        daysToExpiryExit: 2,
      },
      positionSizing: {
        type: 'PERCENT_OF_EQUITY',
        value: 15,
      },
      expiryType: 'MONTHLY',
      strikeSelectionMode: 'PERCENT_OTM',
      isPaperActive: true,
      isLiveExecution: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'strat_delta_neutral_btc',
      userId: 'user_trader_01',
      name: 'Delta Neutral Dynamic Rebalance Strangle',
      description: 'Sells OTM Strangles and auto-hedges futures whenever net Delta drifts past 0.35.',
      strategyType: 'delta_neutral',
      underlying: 'BTC',
      legs: [
        { id: 'leg_dn_1', action: 'SELL', type: 'PUT', strikeOffsetPct: -5, targetDelta: -0.18, ratio: 1 },
        { id: 'leg_dn_2', action: 'SELL', type: 'CALL', strikeOffsetPct: 5, targetDelta: 0.18, ratio: 1 },
      ],
      entryConditions: [
        { indicator: 'IV_PERCENTILE', operator: '>', value: 65, logic: 'AND' },
      ],
      exitConditions: {
        targetProfitPct: 60,
        stopLossPct: 90,
        daysToExpiryExit: 1,
      },
      positionSizing: {
        type: 'PERCENT_OF_EQUITY',
        value: 8,
      },
      expiryType: 'WEEKLY',
      strikeSelectionMode: 'DELTA',
      deltaTarget: 0.18,
      hedgeCondition: {
        enabled: true,
        triggerDelta: 0.35,
        hedgeInstrument: 'FUTURES',
      },
      isPaperActive: false,
      isLiveExecution: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const seedPositions: PaperPosition[] = [
    {
      id: 'pos_01',
      userId: 'user_trader_01',
      strategyId: 'strat_iron_condor_btc',
      strategyName: 'Weekend BTC Theta Squeeze Iron Condor',
      symbol: 'BTC-28OCT-68000-P',
      underlying: 'BTC',
      side: 'SELL',
      optionType: 'PUT',
      strike: 68000,
      expiry: '2026-11-06T08:00:00Z',
      contracts: 0.5,
      entryPrice: 420,
      currentPrice: 280,
      unrealizedPnl: 70, // (420 - 280) * 0.5 = +70
      pnlPct: 33.3,
      delta: -0.14,
      theta: 28.5,
      gamma: 0.00004,
      vega: -12.4,
      status: 'OPEN',
      openedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    },
    {
      id: 'pos_02',
      userId: 'user_trader_01',
      strategyId: 'strat_iron_condor_btc',
      strategyName: 'Weekend BTC Theta Squeeze Iron Condor',
      symbol: 'BTC-28OCT-74000-C',
      underlying: 'BTC',
      side: 'SELL',
      optionType: 'CALL',
      strike: 74000,
      expiry: '2026-11-06T08:00:00Z',
      contracts: 0.5,
      entryPrice: 380,
      currentPrice: 210,
      unrealizedPnl: 85,
      pnlPct: 44.7,
      delta: 0.12,
      theta: 24.2,
      gamma: 0.00003,
      vega: -10.8,
      status: 'OPEN',
      openedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    },
    {
      id: 'pos_03',
      userId: 'user_trader_01',
      strategyId: 'strat_covered_call_eth',
      strategyName: 'ETH Yield Harvester Covered Call',
      symbol: 'ETH-28OCT-2700-C',
      underlying: 'ETH',
      side: 'SELL',
      optionType: 'CALL',
      strike: 2700,
      expiry: '2026-11-20T08:00:00Z',
      contracts: 4,
      entryPrice: 65,
      currentPrice: 42,
      unrealizedPnl: 92,
      pnlPct: 35.4,
      delta: 0.22,
      theta: 15.6,
      gamma: 0.0008,
      vega: -8.1,
      status: 'OPEN',
      openedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    },
  ];

  const seedTutorials: TutorialModule[] = [
    {
      id: 1,
      titleEn: 'BR BOT Introduction & Architecture',
      titleHi: 'BR BOT परिचय और आर्किटेक्चर',
      category: 'Basics',
      duration: '4:20',
      videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      descriptionEn: 'Learn how BR BOT operates as a high-frequency AI crypto options selling system with paper trading safeguards.',
      descriptionHi: 'जानिए कैसे BR BOT क्रिप्टो ऑप्शन्स सेलिंग और रिस्क मैनेजमेंट के लिए काम करता है।',
      transcriptEn: [
        'Welcome to BR BOT, the professional AI Crypto Options Trading platform.',
        'Options selling offers statistical probability of success through time decay (Theta).',
        'BR BOT supports Delta Exchange India and CoinSwitch connectors with default paper trading safety.',
      ],
      transcriptHi: [
        'BR BOT में आपका स्वागत है - भारत का एडवांस्ड AI क्रिप्टो ऑप्शंस ट्रेडिंग प्लेटफॉर्म।',
        'ऑप्शंस सेलिंग में समय के मूल्य ह्रास (Theta Decay) के जरिए नियमित लाभ कमाने की उच्च संभावना होती है।',
        'BR BOT में पेपर ट्रेडिंग सुरक्षा डिफ़ॉल्ट रूप से सक्रिय है ताकि आप बिना जोखिम के सीख सकें।',
      ],
      keyTakeawaysEn: ['Time decay works in your favor', 'Real money trading is disabled by default', 'Complete bilingual support in Hindi and English'],
      keyTakeawaysHi: ['समय का डीके (Theta) विक्रेता के पक्ष में काम करता है', 'रियल मनी ट्रेडिंग डिफ़ॉल्ट रूप से बंद है', 'हिंदी और अंग्रेजी में पूर्ण समर्थन'],
    },
    {
      id: 2,
      titleEn: 'Account Registration & 2FA Security',
      titleHi: 'खाता पंजीकरण और 2FA सुरक्षा',
      category: 'Security',
      duration: '3:45',
      videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      descriptionEn: 'Step-by-step guide to secure your account with Two-Factor Authentication and API secret encryption.',
      descriptionHi: 'अपने खाते को Two-Factor Authentication और एन्क्रिप्शन के साथ सुरक्षित करने की गाइड।',
      transcriptEn: [
        'Security is our paramount priority. Never share your password or 2FA recovery keys.',
        'All exchange API keys are encrypted server-side using AES-256-GCM.',
      ],
      transcriptHi: [
        'सुरक्षा हमारी सर्वोच्च प्राथमिकता है। कभी भी अपना पासवर्ड या 2FA कोड किसी से साझा न करें।',
        'सभी एक्सचेंज API कीज सर्वर पर AES-256-GCM से एन्क्रिप्ट रहती हैं।',
      ],
      keyTakeawaysEn: ['Enable 2FA immediately', 'Role based permissions', 'Audit log records every session'],
      keyTakeawaysHi: ['तुरंत 2FA सक्रिय करें', 'रोल-आधारित अनुमतियां', 'हर सत्र का ऑडिट लॉग सुरक्षित'],
    },
    {
      id: 3,
      titleEn: 'Trading Dashboard & Options Chain Walkthrough',
      titleHi: 'ट्रेडिंग डैशबोर्ड और ऑप्शंस चेन गाइड',
      category: 'Trading',
      duration: '6:15',
      videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      descriptionEn: 'Master the live options chain, Greeks (Delta, Theta, Gamma, Vega), Put-Call Ratio (PCR), and Max Pain.',
      descriptionHi: 'लाइव ऑप्शंस चेन, ग्रीक्स (डेल्टा, थीटा, गामा, वेगा), PCR और मैक्स पेन को समझें।',
      transcriptEn: [
        'The option chain displays Call strikes on the left and Put strikes on the right.',
        'Theta represents the dollar amount your short position earns every single day.',
      ],
      transcriptHi: [
        'ऑप्शन चेन में बाईं ओर कॉल्स और दाईं ओर पुट्स दिखाई देते हैं।',
        'थीटा (Theta) वह राशि है जो आपकी शॉर्ट पोजीशन हर दिन समय बीतने पर कमाती है।',
      ],
      keyTakeawaysEn: ['Monitor Greeks constantly', 'Check Put-Call Ratio for sentiment', 'Watch Max Pain price on expiry day'],
      keyTakeawaysHi: ['ग्रीक्स की लगातार निगरानी करें', 'बाजार की दिशा के लिए PCR देखें', 'एक्सपायरी पर मैक्स पेन पर नजर रखें'],
    },
    {
      id: 4,
      titleEn: 'Connecting Delta Exchange India & CoinSwitch APIs',
      titleHi: 'डेल्टा एक्सचेंज इंडिया और कॉइनस्विच API कनेक्ट करना',
      category: 'Exchanges',
      duration: '5:10',
      videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      descriptionEn: 'How to securely generate API keys, test pings, and synchronize portfolio balances safely.',
      descriptionHi: 'सुरक्षित रूप से API कीज कैसे जनरेट करें और पोर्टफोलियो बैलेंस सिंक करें।',
      transcriptEn: [
        'Navigate to Exchange Connectors in BR BOT.',
        'Enter your Delta Exchange India Read and Trade API keys with IP whitelisting.',
      ],
      transcriptHi: [
        'BR BOT में एक्सचेंज कनेक्टर्स पर जाएं।',
        'डेल्टा एक्सचेंज इंडिया या कॉइनस्विच से अपनी API कीज दर्ज करें।',
      ],
      keyTakeawaysEn: ['Use IP restrictions on your exchange', 'Never enable withdrawal permissions', 'Verify ping status'],
      keyTakeawaysHi: ['एक्सचेंज पर IP प्रतिबंध लगाएं', 'निकासी (Withdrawal) अनुमति कभी न दें', 'पिंग स्थिति की पुष्टि करें'],
    },
    {
      id: 5,
      titleEn: 'Visual & AI Strategy Builder',
      titleHi: 'विजुअल और AI रणनीति निर्माता',
      category: 'Strategies',
      duration: '7:30',
      videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      descriptionEn: 'Build complex multi-leg options strategies with natural language prompts and drag-and-drop indicator triggers.',
      descriptionHi: 'सरल भाषा में लिखकर या इंडिकेटर ब्लॉक्स जोड़कर मल्टी-लेग ऑप्शंस रणनीतियां बनाएं।',
      transcriptEn: [
        'You can type: "Sell BTC 0.20 Delta Put when RSI is below 35 and target 50% profit".',
        'The Gemini AI parses your command into structured rules automatically.',
      ],
      transcriptHi: [
        'आप साधारण भाषा में लिख सकते हैं: "जब RSI 35 से नीचे हो तो BTC पुट बेचें और 50% प्रॉफिट पर एग्जिट करें"।',
        'BR BOT का AI इसे तुरंत संरचित रणनीति में बदल देता है।',
      ],
      keyTakeawaysEn: ['Natural language to rule conversion', 'Visual payoff diagram', 'Combine multiple indicators with AND/OR'],
      keyTakeawaysHi: ['प्राकृतिक भाषा से स्वचालित नियम', 'विजुअल पेऑफ आरेख', 'AND/OR लॉजिक के साथ इंडिकेटर जोड़ें'],
    },
    {
      id: 6,
      titleEn: 'Mastering Technical Indicators for Options',
      titleHi: 'ऑप्शंस के लिए तकनीकी इंडिकेटर्स का उपयोग',
      category: 'Indicators',
      duration: '6:45',
      videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
      descriptionEn: 'How to configure RSI, Supertrend, Bollinger Bands, ATR, ADX, and Implied Volatility Percentile.',
      descriptionHi: 'RSI, सुपरट्रेंड, बोलिंगर बैंड्स, ATR और IV पर्सेंटाइल का ऑप्शंस सेलिंग में सही उपयोग।',
      transcriptEn: [
        'High IV Percentile means option premiums are expensive, making it ideal for option sellers.',
        'Supertrend and 200 EMA confirm the broader directional bias.',
      ],
      transcriptHi: [
        'उच्च IV पर्सेंटाइल का मतलब है कि प्रीमियम महंगे हैं, जो ऑप्शन सेलर्स के लिए सबसे उपयुक्त समय है।',
        'सुपरट्रेंड और 200 EMA बाजार के बड़े ट्रेंड की पुष्टि करते हैं।',
      ],
      keyTakeawaysEn: ['Sell premium when IV is elevated', 'Use ATR for dynamic strike distances', 'Avoid selling calls in strong uptrend'],
      keyTakeawaysHi: ['उच्च IV में प्रीमियम बेचें', 'स्ट्राइक दूरी के लिए ATR का उपयोग करें', 'मजबूत अपट्रेंड में अनहेज्ड कॉल्स न बेचें'],
    },
    {
      id: 7,
      titleEn: 'Crypto Options Selling: Iron Condors & Strangles',
      titleHi: 'क्रिप्टो ऑप्शंस सेलिंग: आयरन कॉन्डोर और स्ट्रैंगल',
      category: 'Strategies',
      duration: '8:20',
      videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
      descriptionEn: 'Understand defined-risk spreads vs naked selling and how to manage margin requirements.',
      descriptionHi: 'सीमित जोखिम वाले स्प्रेड्स और नेकेड सेलिंग के बीच अंतर और मार्जिन प्रबंधन को समझें।',
      transcriptEn: [
        'An Iron Condor buys protective wings on both Call and Put sides to limit maximum loss.',
        'Short strangles require higher margin and dynamic hedging.',
      ],
      transcriptHi: [
        'आयरन कॉन्डोर दोनों तरफ पंख (wings) खरीदता है जिससे अधिकतम नुकसान सीमित हो जाता है।',
        'शॉर्ट स्ट्रैंगल में अधिक मार्जिन और डायनेमिक हेजिंग की आवश्यकता होती है।',
      ],
      keyTakeawaysEn: ['Defined risk saves your capital', 'Manage profit at 50% target', 'Close before final hours of expiry'],
      keyTakeawaysHi: ['सीमित जोखिम आपकी पूंजी बचाता है', '50% टारगेट पर प्रॉफिट बुक करें', 'एक्सपायरी के आखिरी घंटों से पहले बाहर निकलें'],
    },
    {
      id: 8,
      titleEn: 'Delta Neutral & Hedging Strategies',
      titleHi: 'डेल्टा न्यूट्रल और हेजिंग रणनीतियां',
      category: 'Advanced',
      duration: '7:50',
      videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      descriptionEn: 'How to rebalance portfolio delta using inverse futures contracts when market swings violently.',
      descriptionHi: 'तेज उतार-चढ़ाव में फ्यूचर्स कॉन्ट्रैक्ट्स का उपयोग करके डेल्टा को रीबैलेंस कैसे करें।',
      transcriptEn: [
        'Delta neutrality removes directional market risk, allowing you to profit purely from volatility crush and theta.',
        'Set auto-hedge thresholds in strategy configuration.',
      ],
      transcriptHi: [
        'डेल्टा न्यूट्रल ट्रेडिंग से दिशात्मक जोखिम खत्म होता है और केवल थीटा डिके से मुनाफा होता है।',
        'रणनीति में ऑटो-हेज सीमा सेट करें।',
      ],
      keyTakeawaysEn: ['Keep net delta near zero', 'Automate hedging rules', 'Avoid over-hedging transaction costs'],
      keyTakeawaysHi: ['नेट डेल्टा को शून्य के पास रखें', 'स्वचालित हेजिंग नियम बनाएं', 'अत्यधिक ट्रेडिंग फीस से बचें'],
    },
    {
      id: 9,
      titleEn: 'Professional Historical Backtesting',
      titleHi: 'पेशेवर ऐतिहासिक बैकटेस्टिंग',
      category: 'Analysis',
      duration: '5:40',
      videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4',
      descriptionEn: 'Run realistic simulations with slippage, maker/taker fees, Sharpe ratio, and equity curves.',
      descriptionHi: 'स्लिपेज, फीस, शार्प रेशियो और इक्विटी कर्व के साथ यथार्थवादी बैकटेस्ट चलाएं।',
      transcriptEn: [
        'Never trade a strategy live without extensive backtesting.',
        'Analyze maximum drawdown carefully to ensure your account can endure drawdowns.',
      ],
      transcriptHi: [
        'बिना बैकटेस्टिंग के कभी भी किसी रणनीति को लाइव न चलाएं।',
        'अधिकतम ड्रॉडाउन (Max Drawdown) को ध्यान से देखें।',
      ],
      keyTakeawaysEn: ['Evaluate Sharpe ratio (> 1.5 is desirable)', 'Look for smooth equity curve', 'Account for 0.05% realistic fees'],
      keyTakeawaysHi: ['शार्प रेशियो 1.5 से अधिक होना चाहिए', 'सुचारू इक्विटी कर्व देखें', 'फीस और स्लिपेज का पूरा ध्यान रखें'],
    },
    {
      id: 10,
      titleEn: 'AI Strategy Doctor: Flaw Diagnosis & Hindi Insights',
      titleHi: 'AI रणनीति डॉक्टर: कमियों की जांच और हिंदी सलाह',
      category: 'AI Tools',
      duration: '6:30',
      videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      descriptionEn: 'Let Gemini AI diagnose missing stop losses, unlimited margin exposure, and provide clear Hindi summaries.',
      descriptionHi: 'AI से अपनी रणनीति की कमियों की जांच कराएं और सरल हिंदी में सुधार की सलाह पाएं।',
      transcriptEn: [
        'The Strategy Doctor checks for unhedged wings, missing stop-loss rules, and excessive position size.',
        'Receive immediate risk scoring from 1 to 100.',
      ],
      transcriptHi: [
        'AI स्ट्रैटेजी डॉक्टर आपकी रणनीति में छिपे जोखिम और अनहेज्ड लेग्स की पहचान करता है।',
        'तुरंत 1 से 100 का रिस्क स्कोर और हिंदी में स्पष्ट विश्लेषण प्राप्त करें।',
      ],
      keyTakeawaysEn: ['Run doctor before saving', 'Fix missing stop-loss immediately', 'Read simple Hindi explanation'],
      keyTakeawaysHi: ['सेव करने से पहले डॉक्टर से चेक कराएं', 'स्टॉप-लॉस तुरंत जोड़ें', 'हिंदी में दी गई सलाह को समझें'],
    },
    {
      id: 11,
      titleEn: 'Risk Management & Emergency Kill Switch',
      titleHi: 'जोखिम प्रबंधन और इमरजेंसी किल स्विच',
      category: 'Risk',
      duration: '5:00',
      videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
      descriptionEn: 'Daily loss circuit breakers, position size caps, and the instant emergency trading pause.',
      descriptionHi: 'दैनिक नुकसान सीमा, पोजीशन साइज कैप्स और तत्काल ट्रेडिंग रोकने वाला किल स्विच।',
      transcriptEn: [
        'Preserving capital is Rule #1 in options trading.',
        'The Emergency Kill Switch instantly pauses all automated paper orders and halts new entries.',
      ],
      transcriptHi: [
        'पूंजी की सुरक्षा ऑप्शंस ट्रेडिंग का पहला नियम है।',
        'इमरजेंसी किल स्विच दबाते ही सभी ऑटोमेटेड ऑर्डर्स तुरंत रुक जाते हैं।',
      ],
      keyTakeawaysEn: ['Set max daily loss limit at 3-5%', 'Never risk more than 15% per position', 'Kill switch is available in 1 click'],
      keyTakeawaysHi: ['दैनिक नुकसान सीमा 3-5% रखें', 'एक ट्रेड में 15% से अधिक जोखिम न लें', '1 क्लिक में किल स्विच उपलब्ध है'],
    },
    {
      id: 12,
      titleEn: 'Strategy Marketplace: Browse & Share',
      titleHi: 'रणनीति बाज़ार: खोजें और शेयर करें',
      category: 'Community',
      duration: '4:50',
      videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
      descriptionEn: 'Explore community verified strategies, check historical win rates, and publish your own tested systems.',
      descriptionHi: 'कम्युनिटी द्वारा जांची गई रणनीतियों को देखें, समीक्षा पढ़ें और अपनी रणनीति पब्लिश करें।',
      transcriptEn: [
        'The Strategy Marketplace allows verified traders to share profitable options systems.',
        'Admin approval ensures dangerous unhedged systems are reviewed.',
      ],
      transcriptHi: [
        'रणनीति बाज़ार में सत्यापित ट्रेडर्स अपनी सफल ऑप्शंस रणनीतियां शेयर करते हैं।',
        'एडमिन अप्रूवल सुनिश्चित करता है कि केवल सुरक्षित सिस्टम ही पब्लिश हों।',
      ],
      keyTakeawaysEn: ['Clone top rated strategies to your account', 'Read community reviews', 'Admin verified badge'],
      keyTakeawaysHi: ['सर्वश्रेष्ठ रणनीतियों को अपने खाते में कॉपी करें', 'कम्युनिटी समीक्षाएं पढ़ें', 'सत्यापित बैज चेक करें'],
    },
  ];

  const seedMarketplace: MarketplaceItem[] = [
    {
      id: 'market_01',
      authorId: 'user_admin_01',
      authorName: 'BR BOT Quant Labs',
      title: 'Institutional Grade BTC Iron Condor',
      description: 'Systematic 4-leg defined risk delta-neutral options selling engine with 82% verified win rate over 180 days.',
      category: 'INCOME',
      strategyData: seedStrategies[0],
      riskScore: 28,
      winRateVerified: 82.4,
      verified: true,
      rating: 4.9,
      downloadsCount: 1420,
      status: 'approved',
      reviews: [
        { id: 'r1', userId: 'u_10', userName: 'Vikram Sharma', rating: 5, comment: 'Consistent weekend theta decay without sleep anxiety.', date: '2026-10-24' },
        { id: 'r2', userId: 'u_11', userName: 'Ananya Verma', rating: 5, comment: 'Wings protect very well against sudden flash crashes.', date: '2026-10-28' },
      ],
      createdAt: '2026-10-01T00:00:00Z',
    },
    {
      id: 'market_02',
      authorId: 'user_trader_01',
      authorName: 'Pravin Yadav',
      title: 'ETH Covered Call Passive Yield 3.5% / Mo',
      description: 'Conservative monthly call selling targeting 0.20 Delta strikes for passive cash flow on spot Ethereum.',
      category: 'BEGINNER',
      strategyData: seedStrategies[1],
      riskScore: 35,
      winRateVerified: 78.2,
      verified: true,
      rating: 4.8,
      downloadsCount: 980,
      status: 'approved',
      reviews: [
        { id: 'r3', userId: 'u_12', userName: 'Rahul Gupta', rating: 5, comment: 'Great for compounding ETH holdings.', date: '2026-10-15' },
      ],
      createdAt: '2026-10-10T00:00:00Z',
    },
    {
      id: 'market_03',
      authorId: 'user_admin_01',
      authorName: 'BR BOT Quant Labs',
      title: 'High Volatility Crash Protection Put Spread',
      description: 'Bear Put Spread automatically activated when 200 EMA breaks and IV spikes above 85th percentile.',
      category: 'CRASH_PROTECTION',
      strategyData: {
        name: 'Crash Protection Put Spread',
        strategyType: 'bull_put_spread',
        underlying: 'BTC',
      },
      riskScore: 42,
      winRateVerified: 74.5,
      verified: true,
      rating: 4.7,
      downloadsCount: 650,
      status: 'approved',
      reviews: [],
      createdAt: '2026-10-18T00:00:00Z',
    },
  ];

  const seedBacktests: BacktestRecord[] = [
    {
      id: 'bt_sample_01',
      userId: 'user_trader_01',
      strategyId: 'strat_iron_condor_btc',
      strategyName: 'Weekend BTC Theta Squeeze Iron Condor',
      exchange: 'delta_india',
      instrument: 'BTC-USDT',
      timeframe: '1h',
      dateRange: 'Past 90 Days',
      initialCapital: 10000,
      finalCapital: 12450,
      netPnl: 2450,
      netPnlPct: 24.5,
      winRate: 81.2,
      maxDrawdown: 5.8,
      totalTrades: 32,
      winningTrades: 26,
      losingTrades: 6,
      profitFactor: 2.85,
      sharpeRatio: 2.14,
      equityCurve: [
        { time: 'Day 1', equity: 10000, drawdown: 0 },
        { time: 'Day 15', equity: 10420, drawdown: 0.5 },
        { time: 'Day 30', equity: 10890, drawdown: 1.2 },
        { time: 'Day 45', equity: 11150, drawdown: 2.4 },
        { time: 'Day 60', equity: 11620, drawdown: 1.8 },
        { time: 'Day 75', equity: 12050, drawdown: 0.8 },
        { time: 'Day 90', equity: 12450, drawdown: 0.4 },
      ],
      trades: [
        { id: 't1', entryTime: '2026-10-20', exitTime: '2026-10-24', strategyType: 'iron_condor', legs: 'BTC 66k/64k P, 72k/74k C', pnl: 340, pnlPct: 48, exitReason: 'Target Profit 50%' },
        { id: 't2', entryTime: '2026-10-13', exitTime: '2026-10-17', strategyType: 'iron_condor', legs: 'BTC 65k/63k P, 71k/73k C', pnl: 310, pnlPct: 45, exitReason: 'Target Profit 50%' },
        { id: 't3', entryTime: '2026-10-06', exitTime: '2026-10-08', strategyType: 'iron_condor', legs: 'BTC 64k/62k P, 70k/72k C', pnl: -180, pnlPct: -25, exitReason: 'Stop Loss Hit' },
      ],
      createdAt: new Date().toISOString(),
    },
  ];

  const seedMemories: AIMemory[] = [
    {
      id: 'mem_1',
      userId: 'user_trader_01',
      key: 'preferred_underlying',
      value: 'Prefers BTC and ETH options with 0.15 - 0.25 Delta strikes',
      category: 'strategy_pref',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'mem_2',
      userId: 'user_trader_01',
      key: 'risk_tolerance',
      value: 'Strict risk aversion: max 15% stop loss and mandatory protective wings',
      category: 'risk_note',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'mem_3',
      userId: 'user_trader_01',
      key: 'primary_exchange',
      value: 'Delta Exchange India with INR/USDT base margin',
      category: 'strategy_pref',
      updatedAt: new Date().toISOString(),
    },
  ];

  const seedNotifications: NotificationItem[] = [
    {
      id: 'notif_1',
      userId: 'user_trader_01',
      title: 'Welcome to BR BOT',
      message: 'Paper trading account initialized with $25,000 USDT virtual margin.',
      type: 'system',
      read: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'notif_2',
      userId: 'user_trader_01',
      title: 'Theta Harvest Target Reached',
      message: 'Position BTC-28OCT-74000-C reached +44.7% unrealized profit.',
      type: 'strategy',
      read: false,
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
  ];

  const seedExchangeConfigs: ExchangeConfig[] = [
    {
      id: 'exc_01',
      userId: 'user_trader_01',
      exchange: 'delta_india',
      apiKeyMasked: 'delta_live_****_8829',
      apiKeyEncrypted: 'mock_encrypted_key',
      apiSecretEncrypted: 'mock_encrypted_secret',
      iv: 'mock_iv',
      authTag: 'mock_auth_tag',
      testnet: false,
      isConnected: true,
      lastPingAt: new Date().toISOString(),
      realTradingEnabled: false,
      balanceSummary: {
        totalUSDT: 25420.5,
        totalINR: 2160742.5,
        availableMargin: 21850.2,
        usedMargin: 3570.3,
      },
    },
    {
      id: 'exc_02',
      userId: 'user_trader_01',
      exchange: 'coinswitch',
      apiKeyMasked: 'cswitch_****_1942',
      apiKeyEncrypted: 'mock_encrypted_key',
      apiSecretEncrypted: 'mock_encrypted_secret',
      iv: 'mock_iv',
      authTag: 'mock_auth_tag',
      testnet: true,
      isConnected: true,
      lastPingAt: new Date().toISOString(),
      realTradingEnabled: false,
      balanceSummary: {
        totalUSDT: 10000.0,
        totalINR: 850000.0,
        availableMargin: 9200.0,
        usedMargin: 800.0,
      },
    },
  ];

  return {
    users: [defaultAdminUser, defaultTraderUser],
    sessions: [],
    loginHistory: [
      {
        id: 'lh_1',
        userId: 'user_trader_01',
        ip: '127.0.0.1',
        userAgent: 'Chrome 128 / macOS',
        location: 'Mumbai, IN',
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
      },
    ],
    exchangeConfigs: seedExchangeConfigs,
    strategies: seedStrategies,
    paperPositions: seedPositions,
    backtestRecords: seedBacktests,
    marketplace: seedMarketplace,
    tutorials: seedTutorials,
    aiMemories: seedMemories,
    notifications: seedNotifications,
    auditLogs: [
      {
        id: 'log_01',
        userId: 'user_trader_01',
        userEmail: 'pravinyadav8445068640@gmail.com',
        action: 'USER_LOGIN',
        details: 'Successful login with Paper Trading mode enabled',
        ip: '127.0.0.1',
        timestamp: new Date().toISOString(),
      },
    ],
    platformSettings: {
      registrationEnabled: true,
      maintenanceMode: false,
      defaultPaperCapital: 25000,
      maxLeverageAllowed: 10,
      globalKillSwitch: false,
    },
  };
}
