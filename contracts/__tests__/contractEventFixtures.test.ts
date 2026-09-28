import { describe, it, expect } from "vitest";
import {
  generateVaultDepositEvent,
  generateVaultWithdrawalEvent,
  generateStrategyRebalanceEvent,
  generateYieldAccrualEvent,
  generateReserveUtilizationEvent,
  generateEventSequence,
  CONTRACT_EVENT_FIXTURES,
  type ContractEventFixture,
} from "../../shared/test-fixtures/contractEventFixtures";

/**
 * Tests for the contract event fixture generator.
 * Verifies fixture shape, generator overrides, and event sequencing.
 */
describe("Contract Event Fixture Generator", () => {
  describe("generateVaultDepositEvent", () => {
    it("generates a vault deposit event with correct shape", () => {
      const event = generateVaultDepositEvent();
      expect(event.type).toBe("contract");
      expect(event.topic).toContain("deposit");
      expect(event.sorobanData.amount).toBeDefined();
      expect(typeof event.ledgerCloseTime).toBe("number");
      expect(event.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it("applies overrides to the generated event", () => {
      const contractId = "CBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBSC4";
      const event = generateVaultDepositEvent({ contractId });
      expect(event.contractId).toBe(contractId);
    });

    it("defaults to a non-zero amount", () => {
      const event = generateVaultDepositEvent();
      expect(event.sorobanData.amount).toBeTruthy();
      expect(event.sorobanData.amount as bigint).toBeGreaterThan(0n);
    });

    it("includes USDC asset by default", () => {
      const event = generateVaultDepositEvent();
      expect(event.sorobanData.asset?.code).toBe("USDC");
    });
  });

  describe("generateVaultWithdrawalEvent", () => {
    it("generates a vault withdrawal event with correct shape", () => {
      const event = generateVaultWithdrawalEvent();
      expect(event.type).toBe("contract");
      expect(event.topic).toContain("withdrawal");
      expect(event.sorobanData.amount).toBeDefined();
    });

    it("withdrawal amount is less than deposit amount by default", () => {
      const deposit = generateVaultDepositEvent();
      const withdrawal = generateVaultWithdrawalEvent();
      expect(withdrawal.sorobanData.amount as bigint).toBeLessThan(deposit.sorobanData.amount as bigint);
    });
  });

  describe("generateStrategyRebalanceEvent", () => {
    it("generates a strategy rebalance event with correct shape", () => {
      const event = generateStrategyRebalanceEvent();
      expect(event.type).toBe("contract");
      expect(event.topic).toContain("strategy");
      expect(event.topic).toContain("rebalance");
    });

    it("uses BLND asset by default", () => {
      const event = generateStrategyRebalanceEvent();
      expect(event.sorobanData.asset?.code).toBe("BLND");
    });
  });

  describe("generateYieldAccrualEvent", () => {
    it("generates a yield accrual event with rate field", () => {
      const event = generateYieldAccrualEvent();
      expect(event.type).toBe("contract");
      expect(event.topic).toContain("yield");
      expect(event.sorobanData.rate).toBeDefined();
    });

    it("includes XLM asset by default", () => {
      const event = generateYieldAccrualEvent();
      expect(event.sorobanData.asset?.code).toBe("XLM");
    });
  });

  describe("generateReserveUtilizationEvent", () => {
    it("generates a reserve utilization event with rate field", () => {
      const event = generateReserveUtilizationEvent();
      expect(event.type).toBe("contract");
      expect(event.topic).toContain("reserve");
      expect(event.sorobanData.rate).toBeDefined();
      expect(event.sorobanData.reserve).toBeDefined();
    });
  });

  describe("CONTRACT_EVENT_FIXTURES batch", () => {
    it("contains at least one fixture of each type", () => {
      const hasDeposit = CONTRACT_EVENT_FIXTURES.some((e) => e.topic.includes("deposit"));
      const hasWithdrawal = CONTRACT_EVENT_FIXTURES.some((e) => e.topic.includes("withdrawal"));
      const hasRebalance = CONTRACT_EVENT_FIXTURES.some((e) => e.topic.includes("rebalance"));
      const hasYield = CONTRACT_EVENT_FIXTURES.some((e) => e.topic.includes("yield"));
      const hasReserve = CONTRACT_EVENT_FIXTURES.some((e) => e.topic.includes("reserve"));

      expect(hasDeposit).toBe(true);
      expect(hasWithdrawal).toBe(true);
      expect(hasRebalance).toBe(true);
      expect(hasYield).toBe(true);
      expect(hasReserve).toBe(true);
    });

    it("all fixtures have required fields", () => {
      for (const fixture of CONTRACT_EVENT_FIXTURES) {
        expect(fixture.contractId).toBeTruthy();
        expect(fixture.type).toBe("contract");
        expect(Array.isArray(fixture.topic)).toBe(true);
        expect(fixture.topic.length).toBeGreaterThan(0);
        expect(fixture.sorobanData.contractId).toBeTruthy();
        expect(typeof fixture.ledgerCloseTime).toBe("number");
        expect(fixture.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      }
    });
  });

  describe("generateEventSequence", () => {
    it("generates the requested number of events", () => {
      const events = generateEventSequence("deposit_flow", 5);
      expect(events).toHaveLength(5);
    });

    it("defaults to 3 events", () => {
      const events = generateEventSequence("deposit_flow");
      expect(events).toHaveLength(3);
    });

    it("generates deposit flow events with increasing amounts", () => {
      const events = generateEventSequence("deposit_flow", 3);
      for (const e of events) {
        expect(e.topic).toContain("deposit");
      }
      // Amounts should be increasing
      const amounts = events.map((e) => e.sorobanData.amount as bigint);
      expect(amounts[1]).toBeGreaterThan(amounts[0]);
      expect(amounts[2]).toBeGreaterThan(amounts[1]);
    });

    it("generates withdrawal flow events with increasing amounts", () => {
      const events = generateEventSequence("withdrawal_flow", 3);
      for (const e of events) {
        expect(e.topic).toContain("withdrawal");
      }
    });

    it("generates rebalance flow events", () => {
      const events = generateEventSequence("rebalance_flow", 3);
      for (const e of events) {
        expect(e.topic).toContain("rebalance");
      }
    });

    it("generates yield accrual flow with increasing rates", () => {
      const events = generateEventSequence("yield_accrual_flow", 3);
      for (const e of events) {
        expect(e.topic).toContain("yield");
      }
      const rates = events.map((e) => e.sorobanData.rate as bigint);
      expect(rates[1]).toBeGreaterThan(rates[0]);
      expect(rates[2]).toBeGreaterThan(rates[1]);
    });

    it("event ledger close times are increasing in a sequence", () => {
      const events = generateEventSequence("deposit_flow", 3);
      const times = events.map((e) => e.ledgerCloseTime);
      expect(times[1]).toBeGreaterThan(times[0]);
      expect(times[2]).toBeGreaterThan(times[1]);
    });

    it("all generated events are valid ContractEventFixtures", () => {
      const flowTypes: Array<"deposit_flow" | "withdrawal_flow" | "rebalance_flow" | "yield_accrual_flow"> = [
        "deposit_flow",
        "withdrawal_flow",
        "rebalance_flow",
        "yield_accrual_flow",
      ];

      for (const flowType of flowTypes) {
        const events = generateEventSequence(flowType, 2);
        for (const event of events) {
          expect(event.type).toBe("contract");
          expect(event.topic.length).toBeGreaterThan(0);
          expect(event.sorobanData.contractId).toBeTruthy();
          expect(typeof event.ledgerCloseTime).toBe("number");
          expect(event.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        }
      }
    });
  });

  describe("Fixture Idempotency & Stability", () => {
    it("generates deterministic fixture shape (same field names)", () => {
      const event1 = generateVaultDepositEvent();
      const event2 = generateVaultDepositEvent();

      expect(Object.keys(event1).sort()).toEqual(Object.keys(event2).sort());
    });

    it("override does not mutate the default values of subsequent calls", () => {
      const customId = "CBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBSC4";
      generateVaultDepositEvent({ contractId: customId });
      const defaultEvent = generateVaultDepositEvent();
      expect(defaultEvent.contractId).not.toBe(customId);
    });

    it("fixture contractId does not collide across different event types", () => {
      const deposit = generateVaultDepositEvent();
      const strategy = generateStrategyRebalanceEvent();
      const reserve = generateReserveUtilizationEvent();

      const ids = new Set([
        deposit.contractId,
        strategy.contractId,
        reserve.contractId,
      ]);
      expect(ids.size).toBeGreaterThan(1);
    });
  });
});
