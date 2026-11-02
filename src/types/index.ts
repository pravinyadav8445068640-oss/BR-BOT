export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'trader';
  paperBalance: number;
  currency: 'USDT' | 'INR';
  twoFactorEnabled: boolean;
  riskProfile: {
    maxDailyLossPct: number;
    maxPositionSizePct: number;
    maxPortfolioExposurePct: number;
    autoStopLossPct: number;
    emergencyPause: boolean;
  };
  createdAt?: string;
  lastLoginAt?: string;
}

export interface OptionLeg {
  id: string;
  action: 'BUY' | 'SELL';
  type: 'CALL' | 'PUT';
  strikeOffsetPct: number;
  targetDelta?: number;
  ratio: number;
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
    indicator: string;
    operator: '>' | '<' | 'CROSS_ABOVE' | 'CROSS_BELOW' | 'BETWEEN';
    value: number | string;
    secondaryValue?: number;
    logic: 'AND' | 'OR';
  }[];
  exitConditions: {
    targetProfitPct: number;
    stopLossPct: number;
    daysToExpiryExit: number;
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
    triggerDelta: number;
    hedgeInstrument: 'FUTURES' | 'SPOT';
  };
  isPaperActive: boolean;
  isLiveExecution?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaperPosition {
  id: string;
  userId: string;
  strategyId: string;
  strategyName: string;
  symbol: string;
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

export interface OptionStrikeRow {
  strike: number;
  call: {
    symbol: string;
    bid: number;
    ask: number;
    last: number;
    iv: number;
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    openInterest: number;
    volume24h: number;
  };
  put: {
    symbol: string;
    bid: number;
    ask: number;
    last: number;
    iv: number;
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    openInterest: number;
    volume24h: number;
  };
}

export interface MarketOverview {
  btc: { price: number; change24h: number; high24h: number; low24h: number; volume24h: number; ivPercentile: number; fundingRate: number };
  eth: { price: number; change24h: number; high24h: number; low24h: number; volume24h: number; ivPercentile: number; fundingRate: number };
  sol: { price: number; change24h: number; high24h: number; low24h: number; volume24h: number; ivPercentile: number; fundingRate: number };
  pcrBtc: number;
  maxPainBtc: number;
  lastUpdated: string;
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

export interface DoctorDiagnosis {
  strategyName: string;
  riskScore: number;
  riskCategory: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  estimatedWinRate: number;
  riskRewardRatio: string;
  logicalFlawsEn: string[];
  logicalFlawsHi: string[];
  missingExitConditionsEn: string[];
  missingExitConditionsHi: string[];
  strengthsEn: string[];
  strengthsHi: string[];
  improvementSuggestionsEn: string[];
  improvementSuggestionsHi: string[];
  hindiExplanation: string;
  englishExplanation: string;
  disclaimer: string;
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

export interface MarketplaceItem {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  description: string;
  category: 'INCOME' | 'DELTA_NEUTRAL' | 'HIGH_VOLATILITY' | 'BEGINNER' | 'CRASH_PROTECTION';
  strategyData: Partial<Strategy>;
  riskScore: number;
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

export interface ExchangeConfig {
  id: string;
  userId: string;
  exchange: 'delta_india' | 'coinswitch';
  apiKeyMasked: string;
  testnet: boolean;
  isConnected: boolean;
  lastPingAt: string;
  realTradingEnabled: boolean;
  balanceSummary: {
    totalUSDT: number;
    totalINR: number;
    availableMargin: number;
    usedMargin: number;
  };
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
