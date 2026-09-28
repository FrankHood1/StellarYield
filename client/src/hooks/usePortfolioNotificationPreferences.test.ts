import { describe, it, expect } from "vitest";
import type { AlertCategory, PortfolioNotificationPreferences } from "./usePortfolioNotificationPreferences";
import {
  getEnabledCategories,
  getEnabledChannels,
  canSendNotification,
} from "./usePortfolioNotificationPreferences";

function makeDefaultPrefs(overrides: Partial<PortfolioNotificationPreferences> = {}): PortfolioNotificationPreferences {
  return {
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
        enabled: false,
        frequency: "immediate",
        channels: { inApp: false, email: false, digest: false },
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
        enabled: false,
        frequency: "immediate",
        channels: { inApp: true, email: true, digest: false },
      },
    },
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("Portfolio Notification Preferences Helpers", () => {
  describe("getEnabledCategories", () => {
    it("returns only enabled categories", () => {
      const prefs = makeDefaultPrefs();
      const enabled = getEnabledCategories(prefs);
      expect(enabled).not.toContain("volatility");
      expect(enabled).not.toContain("system_alert");
      expect(enabled).toContain("price_movement");
      expect(enabled).toContain("low_liquidity");
    });

    it("returns empty array when all categories are disabled", () => {
      const prefs = makeDefaultPrefs();
      for (const key of Object.keys(prefs.categories) as AlertCategory[]) {
        prefs.categories[key].enabled = false;
      }
      expect(getEnabledCategories(prefs)).toHaveLength(0);
    });

    it("returns all categories when all are enabled", () => {
      const prefs = makeDefaultPrefs();
      for (const key of Object.keys(prefs.categories) as AlertCategory[]) {
        prefs.categories[key].enabled = true;
      }
      const allCategories = Object.keys(prefs.categories) as AlertCategory[];
      expect(getEnabledCategories(prefs).sort()).toEqual(allCategories.sort());
    });
  });

  describe("getEnabledChannels", () => {
    it("returns enabled channels for a category", () => {
      const prefs = makeDefaultPrefs();
      const channels = getEnabledChannels(prefs, "price_movement");
      expect(channels).toContain("inApp");
      expect(channels).toContain("digest");
      expect(channels).not.toContain("email");
    });

    it("returns empty array for category with no channels enabled", () => {
      const prefs = makeDefaultPrefs();
      const channels = getEnabledChannels(prefs, "volatility");
      expect(channels).toHaveLength(0);
    });

    it("returns all channels when all enabled", () => {
      const prefs = makeDefaultPrefs();
      const channels = getEnabledChannels(prefs, "low_liquidity");
      expect(channels).toContain("inApp");
      expect(channels).toContain("email");
      expect(channels).toContain("digest");
    });

    it("returns empty array for unknown category", () => {
      const prefs = makeDefaultPrefs();
      const channels = getEnabledChannels(prefs, "unknown_category" as AlertCategory);
      expect(channels).toHaveLength(0);
    });
  });

  describe("canSendNotification", () => {
    it("allows notification when global enabled, category enabled, and channel enabled", () => {
      const prefs = makeDefaultPrefs();
      expect(canSendNotification(prefs, "price_movement")).toBe(true);
    });

    it("blocks notification when global disabled", () => {
      const prefs = makeDefaultPrefs({ globalEnabled: false });
      expect(canSendNotification(prefs, "price_movement")).toBe(false);
    });

    it("blocks notification when category disabled", () => {
      const prefs = makeDefaultPrefs();
      expect(canSendNotification(prefs, "volatility")).toBe(false);
    });

    it("blocks notification when all channels disabled for an enabled category", () => {
      const prefs = makeDefaultPrefs();
      // system_alert is disabled, enable it but leave all channels off
      prefs.categories.system_alert.enabled = true;
      prefs.categories.system_alert.channels = { inApp: false, email: false, digest: false };
      expect(canSendNotification(prefs, "system_alert")).toBe(false);
    });

    it("allows notification when at least one channel is enabled", () => {
      const prefs = makeDefaultPrefs();
      prefs.categories.system_alert.enabled = true;
      prefs.categories.system_alert.channels = { inApp: false, email: true, digest: false };
      expect(canSendNotification(prefs, "system_alert")).toBe(true);
    });
  });

  describe("AlertCategory types", () => {
    it("covers expected portfolio alert categories", () => {
      const expectedCategories: AlertCategory[] = [
        "price_movement",
        "volatility",
        "low_liquidity",
        "rebalance_due",
        "slippage_warning",
        "yield_change",
        "deposit_withdrawal",
        "performance",
        "risk_warning",
        "system_alert",
      ];
      const prefs = makeDefaultPrefs();
      for (const cat of expectedCategories) {
        expect(prefs.categories[cat]).toBeDefined();
      }
    });
  });
});
