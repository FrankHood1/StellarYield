import {
  roundTo,
  blendApyPercent,
  normalizeApyPercent,
  bpsToApyPercent,
  isAtApyPrecision,
  decimalsOf,
  APY_DECIMALS,
  APY_ULP,
  YIELD_NORMALIZATION_CONTRACT,
} from "../utils/yieldNormalizationContract";

/**
 * Deterministic rounding tests for blended APY calculations.
 * These tests verify that blended APY computations are stable, reproducible,
 * and correct across all edge cases, including floating-point representation errors,
 * negative values, and extreme weights.
 */
describe("Deterministic Rounding: Blended APY Calculations", () => {
  describe("roundTo: Half-Away-From-Zero Contract", () => {
    it("rounds positive values half-away from zero (not toward +Infinity)", () => {
      // 1.005 * 100 is 100.49999... in floating-point, must still round up
      expect(roundTo(1.005, 2)).toBe(1.01);
      expect(roundTo(2.355, 2)).toBe(2.36);
      expect(roundTo(0.125, 2)).toBe(0.13);
    });

    it("rounds negative values half-away from zero", () => {
      // -0.125 should round to -0.13, not -0.12 (differs from Math.round)
      expect(roundTo(-0.125, 2)).toBe(-0.13);
      expect(roundTo(-1.005, 2)).toBe(-1.01);
      expect(roundTo(-2.355, 2)).toBe(-2.36);
    });

    it("is symmetric: round(-x) === -round(x)", () => {
      const cases = [0.125, 1.005, 2.355, 3.14159, 6.756, 99.999];
      for (const v of cases) {
        expect(roundTo(-v, 2)).toBe(-roundTo(v, 2));
      }
    });

    it("does not produce -0", () => {
      expect(roundTo(-0.004, 2)).toBe(0);
      expect(roundTo(-0, 2)).toBe(0);
      expect(Object.is(roundTo(-0.004, 2), -0)).toBe(false);
    });

    it("passes through NaN and Infinity unchanged", () => {
      expect(roundTo(NaN, 2)).toBeNaN();
      expect(roundTo(Infinity, 2)).toBe(Infinity);
      expect(roundTo(-Infinity, 2)).toBe(-Infinity);
    });

    it("is idempotent at APY precision: round(round(x)) === round(x)", () => {
      const cases = [6.75, 1.005, 3.14159, 8.999, 0.001];
      for (const v of cases) {
        const once = roundTo(v, APY_DECIMALS);
        const twice = roundTo(once, APY_DECIMALS);
        expect(twice).toBe(once);
      }
    });
  });

  describe("blendApyPercent: Weighted Average APY", () => {
    it("returns the simple average when weights are equal", () => {
      const result = blendApyPercent([
        { apyPercent: 6.0, weight: 1 },
        { apyPercent: 8.0, weight: 1 },
      ]);
      expect(result).toBe(7.0);
    });

    it("is deterministic: same input always produces same output", () => {
      const parts = [
        { apyPercent: 5.5, weight: 10000 },
        { apyPercent: 8.75, weight: 25000 },
        { apyPercent: 3.2, weight: 5000 },
      ];
      const results = Array.from({ length: 100 }, () => blendApyPercent(parts));
      const first = results[0];
      for (const r of results) {
        expect(r).toBe(first);
      }
    });

    it("correctly weights larger positions more heavily", () => {
      // 90% at 10% APY, 10% at 20% APY => blended = 11%
      const result = blendApyPercent([
        { apyPercent: 10.0, weight: 9000 },
        { apyPercent: 20.0, weight: 1000 },
      ]);
      expect(result).toBe(11.0);
    });

    it("rounds once at the end, not at each step", () => {
      // Three positions each with slightly different APY; the result must be
      // rounded only at the final blend, not after each accumulation step
      const result = blendApyPercent([
        { apyPercent: 6.753, weight: 1000 },
        { apyPercent: 6.756, weight: 1000 },
        { apyPercent: 6.751, weight: 1000 },
      ]);
      // Expected: (6.753 + 6.756 + 6.751) / 3 = 6.75333... → rounds to 6.75
      expect(result).toBe(6.75);
    });

    it("handles zero weights by ignoring those positions", () => {
      const result = blendApyPercent([
        { apyPercent: 5.0, weight: 0 },
        { apyPercent: 10.0, weight: 1000 },
        { apyPercent: 0, weight: 0 },
      ]);
      expect(result).toBe(10.0);
    });

    it("returns 0 when all weights are zero", () => {
      const result = blendApyPercent([
        { apyPercent: 6.0, weight: 0 },
        { apyPercent: 8.0, weight: 0 },
      ]);
      expect(result).toBe(0);
    });

    it("returns 0 for empty array", () => {
      expect(blendApyPercent([])).toBe(0);
    });

    it("handles negative weights by treating them as zero", () => {
      // Negative weights should be excluded (treated as zero)
      const result = blendApyPercent([
        { apyPercent: 10.0, weight: -100 },
        { apyPercent: 5.0, weight: 1000 },
      ]);
      expect(result).toBe(5.0);
    });

    it("handles a single position", () => {
      const result = blendApyPercent([{ apyPercent: 7.35, weight: 50000 }]);
      expect(result).toBe(7.35);
    });

    it("is precise for basis-point-sourced APY values", () => {
      // Typical blending scenario: APYs that come from basis points
      const parts = [
        { apyPercent: bpsToApyPercent(675), weight: 100000 }, // 6.75%
        { apyPercent: bpsToApyPercent(825), weight: 50000 },  // 8.25%
        { apyPercent: bpsToApyPercent(300), weight: 25000 },  // 3.00%
      ];
      const result = blendApyPercent(parts);
      // Verify within APY_ULP tolerance
      const total = 100000 + 50000 + 25000;
      const expected = (6.75 * 100000 + 8.25 * 50000 + 3.0 * 25000) / total;
      expect(Math.abs(result - normalizeApyPercent(expected))).toBeLessThanOrEqual(APY_ULP / 2);
    });

    it("produces the same result regardless of input order (commutative property)", () => {
      const partsA = [
        { apyPercent: 6.75, weight: 10000 },
        { apyPercent: 8.5, weight: 25000 },
        { apyPercent: 3.2, weight: 5000 },
      ];
      const partsB = [...partsA].reverse();
      const partsC = [partsA[1], partsA[0], partsA[2]];

      const resultA = blendApyPercent(partsA);
      const resultB = blendApyPercent(partsB);
      const resultC = blendApyPercent(partsC);

      expect(resultA).toBe(resultB);
      expect(resultA).toBe(resultC);
    });

    it("handles very large weight differences without precision loss", () => {
      const smallWeight = 1;
      const largeWeight = 1_000_000;
      const result = blendApyPercent([
        { apyPercent: 5.0, weight: smallWeight },
        { apyPercent: 10.0, weight: largeWeight },
      ]);
      // Should be very close to 10.0
      expect(Math.abs(result - 10.0)).toBeLessThan(0.01);
    });

    it("handles floating-point representation errors gracefully", () => {
      // 0.1 + 0.2 is the classic float gotcha
      const result = blendApyPercent([
        { apyPercent: 0.1, weight: 1 },
        { apyPercent: 0.2, weight: 1 },
      ]);
      // Should be exactly 0.15 after normalization
      expect(result).toBe(0.15);
    });
  });

  describe("normalizeApyPercent", () => {
    it("rounds to exactly APY_DECIMALS decimal places", () => {
      expect(normalizeApyPercent(6.753)).toBe(6.75);
      expect(normalizeApyPercent(6.755)).toBe(6.76);
      expect(normalizeApyPercent(6.756)).toBe(6.76);
    });

    it("passes through already-normalized values unchanged", () => {
      const values = [0, 1.5, 6.75, 10.0, 12.34, 100.0];
      for (const v of values) {
        expect(normalizeApyPercent(v)).toBe(v);
      }
    });

    it("returns 0 for very small values below APY_ULP/2", () => {
      expect(normalizeApyPercent(0.004)).toBe(0);
    });
  });

  describe("bpsToApyPercent: Basis Points Conversion", () => {
    it("converts basis points to percent exactly", () => {
      expect(bpsToApyPercent(675)).toBe(6.75);
      expect(bpsToApyPercent(100)).toBe(1.0);
      expect(bpsToApyPercent(10000)).toBe(100.0);
      expect(bpsToApyPercent(0)).toBe(0);
    });

    it("does NOT round (is exact, not normalized)", () => {
      // bpsToApyPercent is exact, does not call roundTo
      expect(bpsToApyPercent(1)).toBe(0.01);
      expect(bpsToApyPercent(5)).toBe(0.05);
    });
  });

  describe("isAtApyPrecision", () => {
    it("accepts values at exactly 2 decimal places", () => {
      expect(isAtApyPrecision(6.75)).toBe(true);
      expect(isAtApyPrecision(10.0)).toBe(true);
      expect(isAtApyPrecision(0)).toBe(true);
    });

    it("rejects values with more decimal precision", () => {
      expect(isAtApyPrecision(6.753)).toBe(false);
      expect(isAtApyPrecision(6.7559)).toBe(false);
    });

    it("rejects non-finite values", () => {
      expect(isAtApyPrecision(NaN)).toBe(false);
      expect(isAtApyPrecision(Infinity)).toBe(false);
    });
  });

  describe("decimalsOf", () => {
    it("returns the correct decimal count", () => {
      expect(decimalsOf(6.75)).toBe(2);
      expect(decimalsOf(6.753)).toBe(3);
      expect(decimalsOf(6.0)).toBe(0);
      expect(decimalsOf(6.1)).toBe(1);
    });

    it("returns 0 for non-finite values", () => {
      expect(decimalsOf(NaN)).toBe(0);
      expect(decimalsOf(Infinity)).toBe(0);
    });
  });

  describe("YIELD_NORMALIZATION_CONTRACT", () => {
    it("documents the rounding policy as round-once-at-emit", () => {
      expect(YIELD_NORMALIZATION_CONTRACT.roundingPolicy).toBe("round-once-at-emit");
    });

    it("documents rounding as half-away-from-zero", () => {
      expect(YIELD_NORMALIZATION_CONTRACT.rounding).toBe("half-away-from-zero");
    });

    it("specifies APY unit as percent", () => {
      expect(YIELD_NORMALIZATION_CONTRACT.apy.unit).toBe("percent");
    });

    it("specifies APY precision of 2 decimal places", () => {
      expect(YIELD_NORMALIZATION_CONTRACT.apy.decimals).toBe(2);
    });
  });

  describe("Regression Cases", () => {
    it("blendedApy of identical values produces that exact value", () => {
      const apy = 8.25;
      const result = blendApyPercent([
        { apyPercent: apy, weight: 1000 },
        { apyPercent: apy, weight: 2000 },
        { apyPercent: apy, weight: 3000 },
      ]);
      expect(result).toBe(apy);
    });

    it("blendedApy of a single protocol equals that protocol's APY", () => {
      const protocolApy = 7.45;
      expect(blendApyPercent([{ apyPercent: protocolApy, weight: 100000 }])).toBe(protocolApy);
    });

    it("blendedApy with near-zero weight contribution does not diverge from equal weights", () => {
      const baseResult = blendApyPercent([
        { apyPercent: 8.0, weight: 1000 },
        { apyPercent: 12.0, weight: 1000 },
      ]);
      // Add an infinitesimally small weight; blended should still be near 10.0
      const withTinyWeight = blendApyPercent([
        { apyPercent: 8.0, weight: 1000 },
        { apyPercent: 12.0, weight: 1000 },
        { apyPercent: 100.0, weight: 0 }, // zero weight, must not affect result
      ]);
      expect(withTinyWeight).toBe(baseResult);
    });
  });
});
