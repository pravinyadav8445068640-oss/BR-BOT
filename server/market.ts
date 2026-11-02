import { Candle } from './indicators.ts';

// Standard normal cumulative distribution function (approximation by Abramowitz and Stegun)
export function normalCDF(x: number): number {
  const b1 = 0.319381530;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;
  const c = 0.39894228;

  if (x >= 0.0) {
    const t = 1.0 / (1.0 + p * x);
    return 1.0 - c * Math.exp(-x * x / 2.0) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
  } else {
    const t = 1.0 / (1.0 - p * x);
    return c * Math.exp(-x * x / 2.0) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
  }
}

// Standard normal probability density function
export function normalPDF(x: number): number {
  return (1.0 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
}

export interface Greeks {
  price: number;
  delta: number;
  gamma: number;
  theta: number; // USD decay per day
  vega: number;  // USD change per 1% IV move
  rho: number;
  iv: number;
}

// Black-Scholes European Options Pricing & Greeks Calculator
export function calculateBlackScholes(
  type: 'CALL' | 'PUT',
  spot: number,
  strike: number,
  timeToExpiryYears: number, // e.g. 7 days = 7 / 365
  volatility: number, // e.g. 0.55 (55% annualized IV)
  riskFreeRate = 0.045 // 4.5% risk free rate
): Greeks {
  const S = Math.max(spot, 0.0001);
  const K = Math.max(strike, 0.0001);
  const T = Math.max(timeToExpiryYears, 0.0001);
  const v = Math.max(volatility, 0.01);
  const r = riskFreeRate;

  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + 0.5 * v * v) * T) / (v * sqrtT);
  const d2 = d1 - v * sqrtT;

  const nd1 = normalCDF(d1);
  const nd2 = normalCDF(d2);
  const nPrimeD1 = normalPDF(d1);
  const discountFactor = Math.exp(-r * T);

  let price = 0;
  let delta = 0;
  let thetaYearly = 0;
  let rho = 0;

  if (type === 'CALL') {
    price = S * nd1 - K * discountFactor * nd2;
    delta = nd1;
    thetaYearly = -(S * nPrimeD1 * v) / (2 * sqrtT) - r * K * discountFactor * nd2;
    rho = (K * T * discountFactor * nd2) / 100;
  } else {
    const nNegD1 = normalCDF(-d1);
    const nNegD2 = normalCDF(-d2);
    price = K * discountFactor * nNegD2 - S * nNegD1;
    delta = nd1 - 1; // negative for puts
    thetaYearly = -(S * nPrimeD1 * v) / (2 * sqrtT) + r * K * discountFactor * nNegD2;
    rho = (-K * T * discountFactor * nNegD2) / 100;
  }

  const gamma = nPrimeD1 / (S * v * sqrtT);
  const vega = (S * sqrtT * nPrimeD1) / 100; // per 1% IV
  const thetaDaily = thetaYearly / 365;

  return {
    price: Math.max(price, 0.05),
    delta: Number(delta.toFixed(4)),
    gamma: Number(gamma.toFixed(6)),
    theta: Number(thetaDaily.toFixed(2)),
    vega: Number(vega.toFixed(2)),
    rho: Number(rho.toFixed(4)),
    iv: Number((v * 100).toFixed(1)),
  };
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
  pcrBtc: number; // Put/Call ratio
  maxPainBtc: number;
  lastUpdated: string;
}

let cachedOverview: MarketOverview = {
  btc: { price: 68420.5, change24h: 2.34, high24h: 69200, low24h: 66800, volume24h: 28450000000, ivPercentile: 58.4, fundingRate: 0.0085 },
  eth: { price: 2640.2, change24h: 1.82, high24h: 2685, low24h: 2570, volume24h: 14200000000, ivPercentile: 62.1, fundingRate: 0.0072 },
  sol: { price: 184.6, change24h: 4.15, high24h: 189, low24h: 174, volume24h: 4100000000, ivPercentile: 68.3, fundingRate: 0.012 },
  pcrBtc: 0.78,
  maxPainBtc: 68000,
  lastUpdated: new Date().toISOString(),
};

// Periodic live price update from public exchange API (Binance public ticker)
async function fetchLiveTicker(): Promise<void> {
  try {
    const res = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT","SOLUSDT"]', {
      headers: { 'User-Agent': 'BR-BOT-Options' },
    });
    if (res.ok) {
      const data = await res.json();
      for (const item of data) {
        const last = parseFloat(item.lastPrice);
        const change = parseFloat(item.priceChangePercent);
        const high = parseFloat(item.highPrice);
        const low = parseFloat(item.lowPrice);
        const vol = parseFloat(item.quoteVolume);

        if (item.symbol === 'BTCUSDT' && last > 1000) {
          cachedOverview.btc.price = last;
          cachedOverview.btc.change24h = change;
          cachedOverview.btc.high24h = high;
          cachedOverview.btc.low24h = low;
          cachedOverview.btc.volume24h = vol;
          cachedOverview.maxPainBtc = Math.round(last / 1000) * 1000;
        } else if (item.symbol === 'ETHUSDT' && last > 100) {
          cachedOverview.eth.price = last;
          cachedOverview.eth.change24h = change;
          cachedOverview.eth.high24h = high;
          cachedOverview.eth.low24h = low;
          cachedOverview.eth.volume24h = vol;
        } else if (item.symbol === 'SOLUSDT' && last > 10) {
          cachedOverview.sol.price = last;
          cachedOverview.sol.change24h = change;
          cachedOverview.sol.high24h = high;
          cachedOverview.sol.low24h = low;
          cachedOverview.sol.volume24h = vol;
        }
      }
      cachedOverview.lastUpdated = new Date().toISOString();
    }
  } catch {
    // If offline or blocked, drift slightly for realistic simulation
    const driftBtc = (Math.random() - 0.49) * 15;
    cachedOverview.btc.price = Math.round((cachedOverview.btc.price + driftBtc) * 10) / 10;
    const driftEth = (Math.random() - 0.49) * 1.5;
    cachedOverview.eth.price = Math.round((cachedOverview.eth.price + driftEth) * 10) / 10;
    cachedOverview.lastUpdated = new Date().toISOString();
  }
}

// Fetch on startup and every 15 seconds
fetchLiveTicker();
setInterval(fetchLiveTicker, 15000);

export function getMarketOverview(): MarketOverview {
  return cachedOverview;
}

// Generate full Options Chain for selected underlying and expiry
export function generateOptionChain(
  underlying: 'BTC' | 'ETH' | 'SOL',
  expiryDays = 7
): {
  underlyingPrice: number;
  expiryDays: number;
  expiryDate: string;
  ivRank: number;
  pcr: number;
  maxPain: number;
  strikes: OptionStrikeRow[];
} {
  const spot =
    underlying === 'BTC'
      ? cachedOverview.btc.price
      : underlying === 'ETH'
      ? cachedOverview.eth.price
      : cachedOverview.sol.price;

  const step = underlying === 'BTC' ? 1000 : underlying === 'ETH' ? 50 : 5;
  const atmStrike = Math.round(spot / step) * step;
  const numStrikesEachSide = 8;
  const timeToExpiryYears = expiryDays / 365;
  const baseIV = underlying === 'BTC' ? 0.52 : underlying === 'ETH' ? 0.58 : 0.68;

  const rows: OptionStrikeRow[] = [];
  let totalCallOI = 0;
  let totalPutOI = 0;

  for (let i = -numStrikesEachSide; i <= numStrikesEachSide; i++) {
    const strike = atmStrike + i * step;
    // Volatility smile: OTM puts and calls have slightly higher IV
    const moneyness = Math.log(strike / spot);
    const smileIV = baseIV + 0.12 * (moneyness * moneyness);

    const callGreeks = calculateBlackScholes('CALL', spot, strike, timeToExpiryYears, smileIV);
    const putGreeks = calculateBlackScholes('PUT', spot, strike, timeToExpiryYears, smileIV);

    const callSpread = Math.max(callGreeks.price * 0.015, 2);
    const putSpread = Math.max(putGreeks.price * 0.015, 2);

    const callOI = Math.round(500 * Math.exp(-Math.pow(strike - spot, 2) / (2 * Math.pow(spot * 0.08, 2)))) + 50;
    const putOI = Math.round(480 * Math.exp(-Math.pow(strike - spot, 2) / (2 * Math.pow(spot * 0.08, 2)))) + 40;

    totalCallOI += callOI;
    totalPutOI += putOI;

    rows.push({
      strike,
      call: {
        symbol: `${underlying}-${expiryDays}D-${strike}-C`,
        bid: Number((callGreeks.price - callSpread / 2).toFixed(2)),
        ask: Number((callGreeks.price + callSpread / 2).toFixed(2)),
        last: callGreeks.price,
        iv: callGreeks.iv,
        delta: callGreeks.delta,
        gamma: callGreeks.gamma,
        theta: callGreeks.theta,
        vega: callGreeks.vega,
        openInterest: callOI,
        volume24h: Math.round(callOI * 0.4),
      },
      put: {
        symbol: `${underlying}-${expiryDays}D-${strike}-P`,
        bid: Number((putGreeks.price - putSpread / 2).toFixed(2)),
        ask: Number((putGreeks.price + putSpread / 2).toFixed(2)),
        last: putGreeks.price,
        iv: putGreeks.iv,
        delta: putGreeks.delta,
        gamma: putGreeks.gamma,
        theta: putGreeks.theta,
        vega: putGreeks.vega,
        openInterest: putOI,
        volume24h: Math.round(putOI * 0.4),
      },
    });
  }

  const pcr = totalCallOI > 0 ? Number((totalPutOI / totalCallOI).toFixed(2)) : 0.85;
  const expiryDate = new Date(Date.now() + expiryDays * 24 * 3600 * 1000).toISOString().split('T')[0];

  return {
    underlyingPrice: spot,
    expiryDays,
    expiryDate,
    ivRank: underlying === 'BTC' ? 58 : underlying === 'ETH' ? 62 : 68,
    pcr,
    maxPain: atmStrike,
    strikes: rows,
  };
}

// Generate realistic OHLCV historical candles for charts & backtesting
export function generateCandles(
  underlying: 'BTC' | 'ETH' | 'SOL',
  timeframe: '15m' | '1h' | '4h' | '1D',
  count = 100
): Candle[] {
  const currentPrice =
    underlying === 'BTC'
      ? cachedOverview.btc.price
      : underlying === 'ETH'
      ? cachedOverview.eth.price
      : cachedOverview.sol.price;

  let intervalMs = 15 * 60 * 1000;
  let volatility = 0.003;
  if (timeframe === '1h') {
    intervalMs = 60 * 60 * 1000;
    volatility = 0.006;
  } else if (timeframe === '4h') {
    intervalMs = 4 * 60 * 60 * 1000;
    volatility = 0.012;
  } else if (timeframe === '1D') {
    intervalMs = 24 * 60 * 60 * 1000;
    volatility = 0.024;
  }

  const candles: Candle[] = [];
  const now = Date.now();
  let price = currentPrice * (1 - (count * 0.0008)); // start slightly in the past with gentle upward bias

  for (let i = count - 1; i >= 0; i--) {
    const time = now - i * intervalMs;
    const change = price * (Math.random() - 0.485) * volatility * 2;
    const open = price;
    const close = Math.round((open + change) * 100) / 100;
    const high = Math.round((Math.max(open, close) + Math.random() * price * volatility) * 100) / 100;
    const low = Math.round((Math.min(open, close) - Math.random() * price * volatility) * 100) / 100;
    const volume = Math.round(50 + Math.random() * 250);

    candles.push({ time, open, high, low, close, volume });
    price = close;
  }

  return candles;
}
