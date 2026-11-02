import { loadDatabase, saveDatabase, PaperPosition, NotificationItem } from './db.ts';
import { getMarketOverview, calculateBlackScholes } from './market.ts';

export interface WorkerStats {
  status: 'RUNNING' | 'PAUSED' | 'DEGRADED';
  uptimeSeconds: number;
  totalEvaluationCycles: number;
  lastCycleTimestamp: string;
  activePositionsMonitored: number;
  activeStrategiesMonitored: number;
  averageCycleDurationMs: number;
  circuitBreakerActive: boolean;
  errorsCount: number;
}

const startTime = Date.now();
let cycleCount = 0;
let lastDurationMs = 12;
let errorsLogged = 0;

export function getWorkerStats(): WorkerStats {
  const db = loadDatabase();
  const openPositions = db.paperPositions.filter((p) => p.status === 'OPEN').length;
  const activeStrats = db.strategies.filter((s) => s.isPaperActive).length;
  const circuitBreaker = db.platformSettings?.globalKillSwitch || false;

  return {
    status: circuitBreaker ? 'PAUSED' : 'RUNNING',
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    totalEvaluationCycles: cycleCount,
    lastCycleTimestamp: new Date().toISOString(),
    activePositionsMonitored: openPositions,
    activeStrategiesMonitored: activeStrats,
    averageCycleDurationMs: Math.round(lastDurationMs),
    circuitBreakerActive: circuitBreaker,
    errorsCount: errorsLogged,
  };
}

export function startBackgroundWorker(): void {
  console.log('[BR BOT] 24/7 Background Strategy Engine starting...');

  // Evaluation tick every 10 seconds
  setInterval(async () => {
    const cycleStart = Date.now();
    cycleCount++;

    try {
      const db = loadDatabase();
      const overview = getMarketOverview();

      // If global kill switch is active, skip executions
      if (db.platformSettings?.globalKillSwitch) {
        return;
      }

      const openPositions = db.paperPositions.filter((p) => p.status === 'OPEN');

      for (const pos of openPositions) {
        const spot =
          pos.underlying === 'BTC'
            ? overview.btc.price
            : pos.underlying === 'ETH'
            ? overview.eth.price
            : overview.sol.price;

        // Calculate current option price via Black-Scholes
        const expiryDate = new Date(pos.expiry);
        const msRemaining = Math.max(expiryDate.getTime() - Date.now(), 1000 * 60);
        const yearsRemaining = msRemaining / (365 * 24 * 3600 * 1000);
        const baseIV = pos.underlying === 'BTC' ? 0.52 : pos.underlying === 'ETH' ? 0.58 : 0.65;

        const greeks = calculateBlackScholes(
          pos.optionType,
          spot,
          pos.strike,
          yearsRemaining,
          baseIV
        );

        pos.currentPrice = greeks.price;
        pos.delta = greeks.delta;
        pos.gamma = greeks.gamma;
        pos.theta = greeks.theta;
        pos.vega = greeks.vega;

        // For option selling: Profit = (Entry Price - Current Price) * Contracts
        // For option buying: Profit = (Current Price - Entry Price) * Contracts
        const multiplier = pos.side === 'SELL' ? 1 : -1;
        const pnl = (pos.entryPrice - pos.currentPrice) * multiplier * pos.contracts;
        pos.unrealizedPnl = Number(pnl.toFixed(2));
        pos.pnlPct = Number((((pos.entryPrice - pos.currentPrice) / pos.entryPrice) * multiplier * 100).toFixed(1));

        // Find linked strategy
        const strategy = db.strategies.find((s) => s.id === pos.strategyId);
        const targetProfitPct = strategy?.exitConditions?.targetProfitPct || 50;
        const stopLossPct = strategy?.exitConditions?.stopLossPct || 80;

        // Check Target Profit
        if (pos.pnlPct >= targetProfitPct) {
          pos.status = 'CLOSED';
          pos.closedAt = new Date().toISOString();
          pos.closeReason = `Target Profit Hit (+${pos.pnlPct.toFixed(1)}%)`;

          // Add notification
          const notif: NotificationItem = {
            id: `notif_${Date.now()}_${pos.id}`,
            userId: pos.userId,
            title: 'Profit Target Executed 🎯',
            message: `Position ${pos.symbol} automatically closed at +${pos.pnlPct}% (+$${pos.unrealizedPnl})`,
            type: 'order',
            read: false,
            createdAt: new Date().toISOString(),
          };
          db.notifications.unshift(notif);
        } else if (pos.pnlPct <= -stopLossPct) {
          // Check Stop Loss
          pos.status = 'CLOSED';
          pos.closedAt = new Date().toISOString();
          pos.closeReason = `Stop Loss Hit (${pos.pnlPct.toFixed(1)}%)`;

          const notif: NotificationItem = {
            id: `notif_${Date.now()}_${pos.id}`,
            userId: pos.userId,
            title: 'Stop Loss Protected Capital 🛑',
            message: `Position ${pos.symbol} closed to protect capital at ${pos.pnlPct}% ($${pos.unrealizedPnl})`,
            type: 'risk',
            read: false,
            createdAt: new Date().toISOString(),
          };
          db.notifications.unshift(notif);
        }

        // Check User Risk Circuit Breakers
        const user = db.users.find((u) => u.id === pos.userId);
        if (user && user.riskProfile && !user.riskProfile.emergencyPause) {
          // If total negative PnL exceeds maxDailyLossPct of paper balance
          const totalNegativePnL = db.paperPositions
            .filter((p) => p.userId === user.id && p.status === 'OPEN' && p.unrealizedPnl < 0)
            .reduce((sum, p) => sum + Math.abs(p.unrealizedPnl), 0);

          const maxAllowedLoss = (user.paperBalance * user.riskProfile.maxDailyLossPct) / 100;
          if (totalNegativePnL > maxAllowedLoss) {
            user.riskProfile.emergencyPause = true;
            const notif: NotificationItem = {
              id: `notif_risk_${Date.now()}`,
              userId: user.id,
              title: 'CIRCUIT BREAKER TRIGGERED ⚠️',
              message: `Daily loss threshold (${user.riskProfile.maxDailyLossPct}%) breached. Automated trading has been paused to protect your account.`,
              type: 'risk',
              read: false,
              createdAt: new Date().toISOString(),
            };
            db.notifications.unshift(notif);
          }
        }
      }

      saveDatabase(db);
    } catch (err) {
      errorsLogged++;
      console.error('[BR BOT Worker Cycle Error]:', err);
    } finally {
      lastDurationMs = Date.now() - cycleStart;
    }
  }, 10000);
}
