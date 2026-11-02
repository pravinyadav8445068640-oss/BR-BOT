import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MarketOverview, OptionStrikeRow, PaperPosition, NotificationItem } from '../types/index.ts';
import { useAuth } from './AuthContext.tsx';

interface OptionChainData {
  underlyingPrice: number;
  expiryDays: number;
  expiryDate: string;
  ivRank: number;
  pcr: number;
  maxPain: number;
  strikes: OptionStrikeRow[];
}

interface MarketContextType {
  marketOverview: MarketOverview | null;
  optionChain: OptionChainData | null;
  selectedUnderlying: 'BTC' | 'ETH' | 'SOL';
  setSelectedUnderlying: (asset: 'BTC' | 'ETH' | 'SOL') => void;
  selectedExpiryDays: number;
  setSelectedExpiryDays: (days: number) => void;
  positions: PaperPosition[];
  notifications: NotificationItem[];
  unreadCount: number;
  emergencyKillSwitchActive: boolean;
  isLoadingChain: boolean;
  closePosition: (posId: string) => Promise<boolean>;
  triggerEmergencyKillSwitch: () => Promise<boolean>;
  resumeTrading: () => Promise<boolean>;
  refreshAll: () => Promise<void>;
  markNotificationsAsRead: () => Promise<void>;
}

const MarketContext = createContext<MarketContextType>({
  marketOverview: null,
  optionChain: null,
  selectedUnderlying: 'BTC',
  setSelectedUnderlying: () => {},
  selectedExpiryDays: 7,
  setSelectedExpiryDays: () => {},
  positions: [],
  notifications: [],
  unreadCount: 0,
  emergencyKillSwitchActive: false,
  isLoadingChain: false,
  closePosition: async () => false,
  triggerEmergencyKillSwitch: async () => false,
  resumeTrading: async () => false,
  refreshAll: async () => {},
  markNotificationsAsRead: async () => {},
});

export const MarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user, refreshUser } = useAuth();
  const [marketOverview, setMarketOverview] = useState<MarketOverview | null>(null);
  const [optionChain, setOptionChain] = useState<OptionChainData | null>(null);
  const [selectedUnderlying, setSelectedUnderlying] = useState<'BTC' | 'ETH' | 'SOL'>('BTC');
  const [selectedExpiryDays, setSelectedExpiryDays] = useState<number>(7);
  const [positions, setPositions] = useState<PaperPosition[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [emergencyKillSwitchActive, setEmergencyKillSwitchActive] = useState<boolean>(false);
  const [isLoadingChain, setIsLoadingChain] = useState(false);

  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch('/api/market/overview');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMarketOverview(data.data);
        }
      }
    } catch {}
  }, []);

  const fetchOptionChain = useCallback(async () => {
    setIsLoadingChain(true);
    try {
      const res = await fetch(
        `/api/market/option-chain?underlying=${selectedUnderlying}&expiryDays=${selectedExpiryDays}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setOptionChain(data.data);
        }
      }
    } catch {} finally {
      setIsLoadingChain(false);
    }
  }, [selectedUnderlying, selectedExpiryDays]);

  const fetchPositions = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/positions/list', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPositions(data.data);
        }
      }
    } catch {}
  }, [token]);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications/list', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifications(data.data);
        }
      }
    } catch {}
  }, [token]);

  const checkRiskSettings = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/risk/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setEmergencyKillSwitchActive(data.data?.emergencyPause || data.globalKillSwitch || false);
        }
      }
    } catch {}
  }, [token]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchOverview(),
      fetchOptionChain(),
      fetchPositions(),
      fetchNotifications(),
      checkRiskSettings(),
    ]);
  }, [fetchOverview, fetchOptionChain, fetchPositions, fetchNotifications, checkRiskSettings]);

  // Initial & interval polling
  useEffect(() => {
    refreshAll();
    const interval = setInterval(() => {
      fetchOverview();
      fetchPositions();
      fetchNotifications();
    }, 6000);
    return () => clearInterval(interval);
  }, [refreshAll, fetchOverview, fetchPositions, fetchNotifications]);

  // When asset or expiry changes, reload option chain
  useEffect(() => {
    fetchOptionChain();
  }, [fetchOptionChain]);

  // Sync user risk profile state
  useEffect(() => {
    if (user?.riskProfile?.emergencyPause !== undefined) {
      setEmergencyKillSwitchActive(user.riskProfile.emergencyPause);
    }
  }, [user]);

  const closePosition = async (posId: string): Promise<boolean> => {
    if (!token) return false;
    try {
      const res = await fetch(`/api/positions/close/${posId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchPositions();
        await refreshUser();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const triggerEmergencyKillSwitch = async (): Promise<boolean> => {
    if (!token) return false;
    try {
      const res = await fetch('/api/risk/emergency-pause', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setEmergencyKillSwitchActive(true);
        await refreshUser();
        await fetchPositions();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const resumeTrading = async (): Promise<boolean> => {
    if (!token) return false;
    try {
      const res = await fetch('/api/risk/reset-pause', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setEmergencyKillSwitchActive(false);
        await refreshUser();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const markNotificationsAsRead = async () => {
    if (!token) return;
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <MarketContext.Provider
      value={{
        marketOverview,
        optionChain,
        selectedUnderlying,
        setSelectedUnderlying,
        selectedExpiryDays,
        setSelectedExpiryDays,
        positions,
        notifications,
        unreadCount,
        emergencyKillSwitchActive,
        isLoadingChain,
        closePosition,
        triggerEmergencyKillSwitch,
        resumeTrading,
        refreshAll,
        markNotificationsAsRead,
      }}
    >
      {children}
    </MarketContext.Provider>
  );
};

export const useMarket = () => useContext(MarketContext);
