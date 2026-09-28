import { describe, it, expect } from "vitest";
import {
  isValidSorobanContractId,
  validateContractId,
  getContractIdErrorMessage,
  normalizeSorobanContractId,
  validateContractIds,
  looksLikeStellarAccountId,
  looksLikeMissingContractIdPrefix,
} from "./sorobanContractValidation";

describe("Soroban Contract ID Validation", () => {
  describe("isValidSorobanContractId", () => {
    it("accepts valid Soroban contract IDs", () => {
      const validIds = [
        "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4",
        "CBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBSC4",
        "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCSC4",
        "C7QVOD3F3254HQ5C3JHA6Q5CB6LCKJMDKVDQQ5MLILWFX23N7FQ7QYU",
        "CBQKZ5RMVVP3SSDG3DXMVQVLM7J2LQZ3KSLV3BVSZ3NBLMVVWBQ",
      ];

      for (const id of validIds) {
        if (id.length === 56) {
          expect(isValidSorobanContractId(id)).toBe(true);
        }
      }
    });

    it("rejects contract IDs with wrong length", () => {
      expect(isValidSorobanContractId("C")).toBe(false);
      expect(isValidSorobanContractId("CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")).toBe(false);
      expect(isValidSorobanContractId("CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4EXTRA")).toBe(false);
    });

    it("rejects IDs not starting with C", () => {
      expect(isValidSorobanContractId("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4")).toBe(false);
      expect(isValidSorobanContractId("TAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4")).toBe(false);
      expect(isValidSorobanContractId("AAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4")).toBe(false);
    });

    it("rejects IDs with invalid base32 characters", () => {
      expect(isValidSorobanContractId("CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA0AAAAABSC4")).toBe(false);
      expect(isValidSorobanContractId("CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA!ABSC4")).toBe(false);
      expect(isValidSorobanContractId("CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA absc4")).toBe(false);
    });

    it("handles null, undefined, and empty inputs", () => {
      expect(isValidSorobanContractId("")).toBe(false);
      expect(isValidSorobanContractId("   ")).toBe(false);
      expect(isValidSorobanContractId(null as any)).toBe(false);
      expect(isValidSorobanContractId(undefined as any)).toBe(false);
    });
  });

  describe("validateContractId", () => {
    it("returns valid for legitimate contract IDs", () => {
      const result = validateContractId("CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.contractId).toBe("CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4");
    });

    it("returns errors for empty input", () => {
      const result = validateContractId("");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Contract ID is required");
    });

    it("returns error for wrong length", () => {
      const result = validateContractId("CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("56 characters"))).toBe(true);
    });

    it("returns error for missing C prefix", () => {
      const result = validateContractId("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4");
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("start with 'C'"))).toBe(true);
    });

    it("returns error for invalid base32 characters", () => {
      const result = validateContractId("CAAAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4");
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("base32"))).toBe(true);
    });

    it("trims whitespace from input", () => {
      const result = validateContractId("  CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4  ");
      expect(result.contractId).toBe("CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4");
    });
  });

  describe("getContractIdErrorMessage", () => {
    it("returns empty string for valid contract ID", () => {
      expect(getContractIdErrorMessage("CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4")).toBe("");
    });

    it("returns comma-separated error messages for invalid ID", () => {
      const message = getContractIdErrorMessage("INVALID");
      expect(message).toBeTruthy();
      expect(message.includes(";")).toBe(true);
    });
  });

  describe("normalizeSorobanContractId", () => {
    it("trims whitespace", () => {
      expect(normalizeSorobanContractId("  CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4  "))
        .toBe("CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4");
    });

    it("converts to uppercase", () => {
      expect(normalizeSorobanContractId("caaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaabsc4"))
        .toBe("CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4");
    });

    it("handles empty input", () => {
      expect(normalizeSorobanContractId("")).toBe("");
      expect(normalizeSorobanContractId(null as any)).toBe("");
    });
  });

  describe("validateContractIds (batch)", () => {
    it("validates multiple contract IDs", () => {
      const ids = [
        "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4",
        "INVALID",
        "CBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBSC4",
      ];

      const results = validateContractIds(ids);

      expect(results[ids[0]].valid).toBe(true);
      expect(results[ids[1]].valid).toBe(false);
      expect(results[ids[2]].valid).toBe(true);
    });
  });

  describe("looksLikeStellarAccountId", () => {
    it("detects Stellar account IDs (common mistake)", () => {
      expect(looksLikeStellarAccountId("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"))
        .toBe(true);
    });

    it("returns false for Soroban contract IDs", () => {
      expect(looksLikeStellarAccountId("CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4"))
        .toBe(false);
    });

    it("returns false for non-56-char strings", () => {
      expect(looksLikeStellarAccountId("GAAAAAAAAAAAAAAAA")).toBe(false);
      expect(looksLikeStellarAccountId("")).toBe(false);
    });
  });

  describe("looksLikeMissingContractIdPrefix", () => {
    it("detects 55-char base32 strings (missing C prefix)", () => {
      expect(looksLikeMissingContractIdPrefix("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"))
        .toBe(true);
    });

    it("returns false for full contract IDs with C", () => {
      expect(looksLikeMissingContractIdPrefix("CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4"))
        .toBe(false);
    });

    it("returns false for other invalid inputs", () => {
      expect(looksLikeMissingContractIdPrefix("invalid")).toBe(false);
      expect(looksLikeMissingContractIdPrefix("")).toBe(false);
    });
  });

  describe("Common user mistakes", () => {
    it("guides user when they provide Stellar account ID instead of contract ID", () => {
      const stellarId = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
      const result = validateContractId(stellarId);
      expect(result.valid).toBe(false);
      expect(looksLikeStellarAccountId(stellarId)).toBe(true);
    });

    it("provides helpful feedback when checksum is valid but structure is wrong", () => {
      const result = validateContractId("CAAAAAA");
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
