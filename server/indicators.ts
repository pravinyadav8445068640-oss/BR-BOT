export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// 1. SMA (Simple Moving Average)
export function calculateSMA(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(data[i]);
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j];
    }
    result.push(sum / period);
  }
  return result;
}

// 2. EMA (Exponential Moving Average)
export function calculateEMA(data: number[], period: number): number[] {
  const result: number[] = [];
  if (data.length === 0) return result;
  const k = 2 / (period + 1);
  let prev = data[0];
  result.push(prev);

  for (let i = 1; i < data.length; i++) {
    const val = data[i] * k + prev * (1 - k);
    result.push(val);
    prev = val;
  }
  return result;
}

// 3. RSI (Relative Strength Index)
export function calculateRSI(closes: number[], period = 14): number[] {
  const rsi: number[] = [];
  if (closes.length < period) return closes.map(() => 50);

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = 0; i < period; i++) {
    rsi.push(50);
  }

  const firstRS = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsi.push(100 - 100 / (1 + firstRS));

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - 100 / (1 + rs));
    }
  }

  return rsi;
}

// 4. MACD (Moving Average Convergence Divergence)
export function calculateMACD(
  closes: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): { macdLine: number[]; signalLine: number[]; histogram: number[] } {
  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);
  const macdLine = fastEMA.map((val, idx) => val - slowEMA[idx]);
  const signalLine = calculateEMA(macdLine, signalPeriod);
  const histogram = macdLine.map((val, idx) => val - signalLine[idx]);

  return { macdLine, signalLine, histogram };
}

// 5. Bollinger Bands (20 periods, 2 std dev)
export function calculateBollingerBands(
  closes: number[],
  period = 20,
  stdDevMultiplier = 2
): { upper: number[]; middle: number[]; lower: number[] } {
  const middle = calculateSMA(closes, period);
  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      upper.push(closes[i]);
      lower.push(closes[i]);
      continue;
    }
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = middle[i];
    const variance = slice.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    upper.push(mean + stdDevMultiplier * stdDev);
    lower.push(mean - stdDevMultiplier * stdDev);
  }

  return { upper, middle, lower };
}

// 6. ATR (Average True Range)
export function calculateATR(candles: Candle[], period = 14): number[] {
  const tr: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      tr.push(candles[i].high - candles[i].low);
      continue;
    }
    const currentHigh = candles[i].high;
    const currentLow = candles[i].low;
    const prevClose = candles[i - 1].close;

    const highLow = currentHigh - currentLow;
    const highPrevClose = Math.abs(currentHigh - prevClose);
    const lowPrevClose = Math.abs(currentLow - prevClose);

    tr.push(Math.max(highLow, highPrevClose, lowPrevClose));
  }

  return calculateEMA(tr, period);
}

// 7. Supertrend (ATR 10, Multiplier 3)
export function calculateSupertrend(
  candles: Candle[],
  period = 10,
  multiplier = 3
): { supertrend: number[]; direction: ('BUY' | 'SELL')[] } {
  const atr = calculateATR(candles, period);
  const supertrend: number[] = [];
  const direction: ('BUY' | 'SELL')[] = [];

  let prevUpper = 0;
  let prevLower = 0;
  let prevTrend: 'BUY' | 'SELL' = 'BUY';

  for (let i = 0; i < candles.length; i++) {
    const hl2 = (candles[i].high + candles[i].low) / 2;
    const currentATR = atr[i] || 0;

    let basicUpper = hl2 + multiplier * currentATR;
    let basicLower = hl2 - multiplier * currentATR;

    if (i === 0) {
      prevUpper = basicUpper;
      prevLower = basicLower;
      supertrend.push(basicLower);
      direction.push('BUY');
      continue;
    }

    const prevClose = candles[i - 1].close;

    // Final Upper Band
    const finalUpper = (basicUpper < prevUpper || prevClose > prevUpper) ? basicUpper : prevUpper;
    // Final Lower Band
    const finalLower = (basicLower > prevLower || prevClose < prevLower) ? basicLower : prevLower;

    let currentTrend: 'BUY' | 'SELL' = prevTrend;
    if (prevTrend === 'BUY' && candles[i].close < finalLower) {
      currentTrend = 'SELL';
    } else if (prevTrend === 'SELL' && candles[i].close > finalUpper) {
      currentTrend = 'BUY';
    }

    const currentSupertrend = currentTrend === 'BUY' ? finalLower : finalUpper;

    supertrend.push(currentSupertrend);
    direction.push(currentTrend);

    prevUpper = finalUpper;
    prevLower = finalLower;
    prevTrend = currentTrend;
  }

  return { supertrend, direction };
}

// 8. VWAP (Volume Weighted Average Price)
export function calculateVWAP(candles: Candle[]): number[] {
  const vwap: number[] = [];
  let cumTypicalVolume = 0;
  let cumVolume = 0;

  for (let i = 0; i < candles.length; i++) {
    const typicalPrice = (candles[i].high + candles[i].low + candles[i].close) / 3;
    cumTypicalVolume += typicalPrice * candles[i].volume;
    cumVolume += candles[i].volume;

    vwap.push(cumVolume === 0 ? typicalPrice : cumTypicalVolume / cumVolume);
  }

  return vwap;
}

// 9. ADX (Average Directional Index)
export function calculateADX(candles: Candle[], period = 14): number[] {
  const plusDM: number[] = [];
  const minusDM: number[] = [];
  const tr = calculateATR(candles, 1);

  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      plusDM.push(0);
      minusDM.push(0);
      continue;
    }
    const upMove = candles[i].high - candles[i - 1].high;
    const downMove = candles[i - 1].low - candles[i].low;

    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
  }

  const smoothedPlusDM = calculateEMA(plusDM, period);
  const smoothedMinusDM = calculateEMA(minusDM, period);
  const smoothedTR = calculateEMA(tr, period);

  const dx: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    const trVal = smoothedTR[i] || 1;
    const plusDI = (smoothedPlusDM[i] / trVal) * 100;
    const minusDI = (smoothedMinusDM[i] / trVal) * 100;
    const diSum = plusDI + minusDI;
    dx.push(diSum === 0 ? 0 : (Math.abs(plusDI - minusDI) / diSum) * 100);
  }

  return calculateEMA(dx, period);
}

// 10. Stochastic RSI
export function calculateStochRSI(
  closes: number[],
  rsiPeriod = 14,
  stochPeriod = 14,
  kPeriod = 3,
  dPeriod = 3
): { k: number[]; d: number[] } {
  const rsi = calculateRSI(closes, rsiPeriod);
  const rawStoch: number[] = [];

  for (let i = 0; i < rsi.length; i++) {
    if (i < stochPeriod - 1) {
      rawStoch.push(50);
      continue;
    }
    const slice = rsi.slice(i - stochPeriod + 1, i + 1);
    const minRsi = Math.min(...slice);
    const maxRsi = Math.max(...slice);
    const diff = maxRsi - minRsi;
    rawStoch.push(diff === 0 ? 50 : ((rsi[i] - minRsi) / diff) * 100);
  }

  const k = calculateSMA(rawStoch, kPeriod);
  const d = calculateSMA(k, dPeriod);

  return { k, d };
}

// 11. Fibonacci Retracement Levels
export function calculateFibonacciLevels(high: number, low: number): { [key: string]: number } {
  const diff = high - low;
  return {
    '0.0%': high,
    '23.6%': high - 0.236 * diff,
    '38.2%': high - 0.382 * diff,
    '50.0%': high - 0.5 * diff,
    '61.8%': high - 0.618 * diff,
    '78.6%': high - 0.786 * diff,
    '100.0%': low,
  };
}
