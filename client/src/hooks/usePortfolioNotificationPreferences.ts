/**
 * Portfolio notification preferences hook.
 * Manages user preferences for different portfolio alert categories.
 */

import { useState, useCallback, useEffect } from "react";

export type AlertCategory =
  | "price_movement"
  | "volatility"
  | "low_liquidity"
  | "rebalance_due"
  | "slippage_warning"
  | "yield_change"
  | "deposit_withdrawal"
  | "performance"
  | "risk_warning"
  | "system_alert";

export type NotificationFrequency = "immediate" | "hourly" | "daily" | "weekly" | "never";

export interface AlertCategoryPreference {
  category: AlertCategory;
  enabled: boolean;
  frequency: NotificationFrequency;
  channels: {
    inApp: boolean;
    email: boolean;
    digest: boolean;
  };
  thresholdPercentage?: number; // for alerts with threshold configuration
}

export interface PortfolioNotificationPreferences {
  globalEnabled: boolean;
  categories: Record<AlertCategory, AlertCategoryPreference>;
  quietHours?: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string;
  };
  updatedAt: string;
}

const DEFAULT_PREFERENCES: PortfolioNotificationPreferences = {
  globalEnabled: true,
  categories: {
    price_movement: {
      category: "price_movement",
      enabled: true,
      frequency: "immediate",
      channels: { inApp: true, email: false, digest: true },
      thresholdPercentage: 5,
    },
    volatility: {
      category: "volatility",
      enabled: true,
      frequency: "immediate",
      channels: { inApp: true, email: false, digest: true },
      thresholdPercentage: 10,
    },
    low_liquidity: {
      category: "low_liquidity",
      enabled: true,
      frequency: "immediate",
      channels: { inApp: true, email: true, digest: true },
    },
    rebalance_due: {
      category: "rebalance_due",
      enabled: true,
      frequency: "daily",
      channels: { inApp: true, email: false, digest: true },
    },
    slippage_warning: {
      category: "slippage_warning",
      enabled: true,
      frequency: "immediate",
      channels: { inApp: true, email: false, digest: true },
      thresholdPercentage: 2,
    },
    yield_change: {
      category: "yield_change",
      enabled: true,
      frequency: "daily",
      channels: { inApp: true, email: false, digest: true },
      thresholdPercentage: 1,
    },
    deposit_withdrawal: {
      category: "deposit_withdrawal",
      enabled: true,
      frequency: "immediate",
      channels: { inApp: true, email: false, digest: false },
    },
    performance: {
      category: "performance",
      enabled: true,
      frequency: "weekly",
      channels: { inApp: true, email: true, digest: true },
    },
    risk_warning: {
      category: "risk_warning",
      enabled: true,
      frequency: "immediate",
      channels: { inApp: true, email: true, digest: true },
    },
    system_alert: {
      category: "system_alert",
      enabled: true,
      frequency: "immediate",
      channels: { inApp: true, email: true, digest: false },
    },
  },
  updatedAt: new Date().toISOString(),
};

export function usePortfolioNotificationPreferences() {
  const [preferences, setPreferences] = useState<PortfolioNotificationPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch preferences from server
  const fetchPreferences = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/portfolio/notification-preferences", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch preferences: ${response.statusText}`);
      }

      const data = await response.json();
      setPreferences(data || DEFAULT_PREFERENCES);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setPreferences(DEFAULT_PREFERENCES);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save preferences to server
  const savePreferences = useCallback(
    async (newPreferences: PortfolioNotificationPreferences) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/portfolio/notification-preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...newPreferences,
            updatedAt: new Date().toISOString(),
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to save preferences: ${response.statusText}`);
        }

        const data = await response.json();
        setPreferences(data);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Update a single category preference
  const updateCategoryPreference = useCallback(
    async (category: AlertCategory, updates: Partial<AlertCategoryPreference>) => {
      const newPreferences = {
        ...preferences,
        categories: {
          ...preferences.categories,
          [category]: {
            ...preferences.categories[category],
            ...updates,
          },
        },
      };
      return savePreferences(newPreferences);
    },
    [preferences, savePreferences],
  );

  // Toggle a category on/off
  const toggleCategory = useCallback(
    (category: AlertCategory) => {
      const newPreferences = {
        ...preferences,
        categories: {
          ...preferences.categories,
          [category]: {
            ...preferences.categories[category],
            enabled: !preferences.categories[category].enabled,
          },
        },
      };
      return savePreferences(newPreferences);
    },
    [preferences, savePreferences],
  );

  // Update notification frequency for a category
  const setFrequency = useCallback(
    (category: AlertCategory, frequency: NotificationFrequency) => {
      return updateCategoryPreference(category, { frequency });
    },
    [updateCategoryPreference],
  );

  // Update channel preference for a category
  const setChannelEnabled = useCallback(
    (category: AlertCategory, channel: keyof AlertCategoryPreference["channels"], enabled: boolean) => {
      const current = preferences.categories[category];
      return updateCategoryPreference(category, {
        channels: {
          ...current.channels,
          [channel]: enabled,
        },
      });
    },
    [preferences, updateCategoryPreference],
  );

  // Set threshold for a category
  const setThreshold = useCallback(
    (category: AlertCategory, thresholdPercentage: number) => {
      return updateCategoryPreference(category, { thresholdPercentage });
    },
    [updateCategoryPreference],
  );

  // Toggle global notifications on/off
  const setGlobalEnabled = useCallback(
    (enabled: boolean) => {
      const newPreferences = {
        ...preferences,
        globalEnabled: enabled,
      };
      return savePreferences(newPreferences);
    },
    [preferences, savePreferences],
  );

  // Reset to defaults
  const resetToDefaults = useCallback(async () => {
    return savePreferences(DEFAULT_PREFERENCES);
  }, [savePreferences]);

  // Load preferences on mount
  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    loading,
    error,
    fetchPreferences,
    savePreferences,
    updateCategoryPreference,
    toggleCategory,
    setFrequency,
    setChannelEnabled,
    setThreshold,
    setGlobalEnabled,
    resetToDefaults,
  };
}

/**
 * Helper to get all enabled categories
 */
export function getEnabledCategories(preferences: PortfolioNotificationPreferences): AlertCategory[] {
  return Object.entries(preferences.categories)
    .filter(([, pref]) => pref.enabled)
    .map(([category]) => category as AlertCategory);
}

/**
 * Helper to get enabled channels for a category
 */
export function getEnabledChannels(
  preferences: PortfolioNotificationPreferences,
  category: AlertCategory,
): (keyof AlertCategoryPreference["channels"])[] {
  const categoryPref = preferences.categories[category];
  if (!categoryPref) return [];

  return (Object.entries(categoryPref.channels) as [keyof AlertCategoryPreference["channels"], boolean][])
    .filter(([, enabled]) => enabled)
    .map(([channel]) => channel);
}

/**
 * Helper to check if a category can send notifications
 */
export function canSendNotification(
  preferences: PortfolioNotificationPreferences,
  category: AlertCategory,
): boolean {
  if (!preferences.globalEnabled) return false;

  const categoryPref = preferences.categories[category];
  if (!categoryPref?.enabled) return false;

  // Check if at least one channel is enabled
  return Object.values(categoryPref.channels).some((enabled) => enabled);
}
