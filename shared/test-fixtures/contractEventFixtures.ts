/**
 * Contract event fixtures for integration testing.
 * Provides reusable contract event generators for testing event parsing,
 * filtering, and aggregation logic across vault, strategy, and yield sources.
 */

export interface ContractEventFixture {
  contractId: string;
  type: string;
  topic: string[];
  sorobanData: {
    contractId: string;
    asset?: {
      code: string;
      issuer: string;
    };
    amount?: bigint;
    user?: string;
    reserve?: string;
    rate?: bigint;
  };
  ledgerCloseTime: number;
  timestamp: string;
}

/**
 * Generate a vault deposit event fixture
 */
export function generateVaultDepositEvent(overrides: Partial<ContractEventFixture> = {}): ContractEventFixture {
  const timestamp = new Date().toISOString();
  const defaults: ContractEventFixture = {
    contractId: "CVAULT1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ12345QVCD3F",
    type: "contract",
    topic: ["transfer", "deposit"],
    sorobanData: {
      contractId: "CVAULT1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ12345QVCD3F",
      asset: {
        code: "USDC",
        issuer: "GBUQWP3BOUZX34ULNQG23RQ6F4OFSAI5FVH2S7FCBQ76HTAKNZI6JVV",
      },
      amount: 1000000000n,
      user: "GBUQWP3BOUZX34ULNQG23RQ6F4OFSAI5FVH2S7FCBQ76HTAKNZI6JVV",
    },
    ledgerCloseTime: Math.floor(Date.now() / 1000),
    timestamp,
  };
  return {
    ...defaults,
    ...overrides,
    sorobanData: { ...defaults.sorobanData, ...(overrides.sorobanData ?? {}) },
  };
}

/**
 * Generate a vault withdrawal event fixture
 */
export function generateVaultWithdrawalEvent(overrides: Partial<ContractEventFixture> = {}): ContractEventFixture {
  const timestamp = new Date().toISOString();
  const defaults: ContractEventFixture = {
    contractId: "CVAULT1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ12345QVCD3F",
    type: "contract",
    topic: ["transfer", "withdrawal"],
    sorobanData: {
      contractId: "CVAULT1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ12345QVCD3F",
      asset: {
        code: "USDC",
        issuer: "GBUQWP3BOUZX34ULNQG23RQ6F4OFSAI5FVH2S7FCBQ76HTAKNZI6JVV",
      },
      amount: 500000000n,
      user: "GBUQWP3BOUZX34ULNQG23RQ6F4OFSAI5FVH2S7FCBQ76HTAKNZI6JVV",
    },
    ledgerCloseTime: Math.floor(Date.now() / 1000),
    timestamp,
  };
  return {
    ...defaults,
    ...overrides,
    sorobanData: { ...defaults.sorobanData, ...(overrides.sorobanData ?? {}) },
  };
}

/**
 * Generate a strategy rebalance event fixture
 */
export function generateStrategyRebalanceEvent(overrides: Partial<ContractEventFixture> = {}): ContractEventFixture {
  const timestamp = new Date().toISOString();
  const defaults: ContractEventFixture = {
    contractId: "CSTRAT1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ12345QVCD3F",
    type: "contract",
    topic: ["strategy", "rebalance"],
    sorobanData: {
      contractId: "CSTRAT1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ12345QVCD3F",
      asset: {
        code: "BLND",
        issuer: "GBUQWP3BOUZX34ULNQG23RQ6F4OFSAI5FVH2S7FCBQ76HTAKNZI6JVV",
      },
      amount: 10000000000n,
    },
    ledgerCloseTime: Math.floor(Date.now() / 1000),
    timestamp,
  };
  return {
    ...defaults,
    ...overrides,
    sorobanData: { ...defaults.sorobanData, ...(overrides.sorobanData ?? {}) },
  };
}

/**
 * Generate a yield accrual event fixture
 */
export function generateYieldAccrualEvent(overrides: Partial<ContractEventFixture> = {}): ContractEventFixture {
  const timestamp = new Date().toISOString();
  const defaults: ContractEventFixture = {
    contractId: "CYIELD1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ12345QVCD3F",
    type: "contract",
    topic: ["yield", "accrual"],
    sorobanData: {
      contractId: "CYIELD1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ12345QVCD3F",
      asset: {
        code: "XLM",
        issuer: "GBUQWP3BOUZX34ULNQG23RQ6F4OFSAI5FVH2S7FCBQ76HTAKNZI6JVV",
      },
      amount: 1000000n,
      rate: 800000n,
    },
    ledgerCloseTime: Math.floor(Date.now() / 1000),
    timestamp,
  };
  return {
    ...defaults,
    ...overrides,
    sorobanData: { ...defaults.sorobanData, ...(overrides.sorobanData ?? {}) },
  };
}

/**
 * Generate a reserve utilization event fixture
 */
export function generateReserveUtilizationEvent(overrides: Partial<ContractEventFixture> = {}): ContractEventFixture {
  const timestamp = new Date().toISOString();
  const defaults: ContractEventFixture = {
    contractId: "CRESERVE1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ12345Q3FHT",
    type: "contract",
    topic: ["reserve", "utilization_updated"],
    sorobanData: {
      contractId: "CRESERVE1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ12345Q3FHT",
      reserve: "GBUQWP3BOUZX34ULNQG23RQ6F4OFSAI5FVH2S7FCBQ76HTAKNZI6JVV",
      rate: 700000n,
    },
    ledgerCloseTime: Math.floor(Date.now() / 1000),
    timestamp,
  };
  return {
    ...defaults,
    ...overrides,
    sorobanData: { ...defaults.sorobanData, ...(overrides.sorobanData ?? {}) },
  };
}

/**
 * Contract event fixture batch for comprehensive integration tests
 */
export const CONTRACT_EVENT_FIXTURES: ContractEventFixture[] = [
  generateVaultDepositEvent(),
  generateVaultWithdrawalEvent(),
  generateStrategyRebalanceEvent(),
  generateYieldAccrualEvent(),
  generateReserveUtilizationEvent(),
];

/**
 * Generate a sequence of related contract events (e.g., a deposit flow)
 */
export function generateEventSequence(
  eventType: "deposit_flow" | "withdrawal_flow" | "rebalance_flow" | "yield_accrual_flow",
  count: number = 3,
): ContractEventFixture[] {
  const events: ContractEventFixture[] = [];
  const baseTime = Math.floor(Date.now() / 1000);

  switch (eventType) {
    case "deposit_flow":
      for (let i = 0; i < count; i++) {
        events.push(
          generateVaultDepositEvent({
            sorobanData: {
              amount: BigInt(1000000000 * (i + 1)), // Incrementing amounts
            } as any,
            ledgerCloseTime: baseTime + i * 10,
            timestamp: new Date(Date.now() + i * 10000).toISOString(),
          }),
        );
      }
      break;

    case "withdrawal_flow":
      for (let i = 0; i < count; i++) {
        events.push(
          generateVaultWithdrawalEvent({
            sorobanData: {
              amount: BigInt(500000000 * (i + 1)), // Incrementing amounts
            } as any,
            ledgerCloseTime: baseTime + i * 10,
            timestamp: new Date(Date.now() + i * 10000).toISOString(),
          }),
        );
      }
      break;

    case "rebalance_flow":
      for (let i = 0; i < count; i++) {
        events.push(
          generateStrategyRebalanceEvent({
            sorobanData: {
              amount: BigInt(10000000000 * (i + 1)), // Incrementing amounts
            } as any,
            ledgerCloseTime: baseTime + i * 15,
            timestamp: new Date(Date.now() + i * 15000).toISOString(),
          }),
        );
      }
      break;

    case "yield_accrual_flow":
      for (let i = 0; i < count; i++) {
        events.push(
          generateYieldAccrualEvent({
            sorobanData: {
              rate: BigInt(800000 + i * 50000), // Incrementing rates
            } as any,
            ledgerCloseTime: baseTime + i * 20,
            timestamp: new Date(Date.now() + i * 20000).toISOString(),
          }),
        );
      }
      break;
  }

  return events;
}
