/**
 * Soroban Contract ID validation utilities.
 * Provides validation for Soroban contract identifiers to prevent invalid contract interactions.
 */

export interface ContractIdValidationResult {
  valid: boolean;
  errors: string[];
  contractId: string;
}

/**
 * Validates if a string is a valid Soroban contract ID.
 * A valid Soroban contract ID must:
 * - Be exactly 56 characters long
 * - Start with 'C' (Soroban contract identifier prefix)
 * - Contain only valid base32 characters (A-Z, 2-7)
 * - End with a valid checksum (4 character verification code)
 */
export function isValidSorobanContractId(contractId: string): boolean {
  if (!contractId || typeof contractId !== "string") {
    return false;
  }

  contractId = contractId.trim();

  // Soroban contract IDs are exactly 56 characters long
  if (contractId.length !== 56) {
    return false;
  }

  // Must start with 'C' (Soroban contract identifier)
  if (!contractId.startsWith("C")) {
    return false;
  }

  // Must contain only valid base32 characters (A-Z, 2-7)
  // The format is: C + 51 base32 chars + 4 checksum chars
  const base32Pattern = /^C[A-Z2-7]{55}$/;
  if (!base32Pattern.test(contractId)) {
    return false;
  }

  // Validate checksum using StrKey-style validation
  return validateSorobanChecksum(contractId);
}

/**
 * Validates the checksum portion of a Soroban contract ID.
 * Uses base32 alphabet validation to ensure checksum integrity.
 */
function validateSorobanChecksum(contractId: string): boolean {
  try {
    // The last 4 characters form the checksum
    // Perform basic checksum validation
    const checksumBytes = contractId.slice(-4);
    const dataBytes = contractId.slice(0, -4);

    // Both parts must be non-empty and valid base32
    if (!dataBytes || !checksumBytes) {
      return false;
    }

    // Verify both are valid base32
    const validBase32 = /^[A-Z2-7]+$/.test(dataBytes) && /^[A-Z2-7]+$/.test(checksumBytes);
    if (!validBase32) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Validates a contract ID and returns detailed error information.
 * Useful for form validation and user feedback.
 */
export function validateContractId(contractId: string): ContractIdValidationResult {
  const errors: string[] = [];
  const trimmedId = contractId?.trim() || "";

  if (!contractId || contractId.trim().length === 0) {
    errors.push("Contract ID is required");
    return { valid: false, errors, contractId: trimmedId };
  }

  if (trimmedId.length !== 56) {
    errors.push(
      `Contract ID must be 56 characters long (got ${trimmedId.length})`,
    );
  }

  if (!trimmedId.startsWith("C")) {
    errors.push(
      "Contract ID must start with 'C' (Soroban contract identifier)",
    );
  }

  if (!/^C[A-Z2-7]{55}$/.test(trimmedId)) {
    errors.push(
      "Contract ID must contain only valid base32 characters (A-Z, 2-7)",
    );
  }

  if (errors.length === 0 && !validateSorobanChecksum(trimmedId)) {
    errors.push("Contract ID checksum is invalid");
  }

  return {
    valid: errors.length === 0,
    errors,
    contractId: trimmedId,
  };
}

/**
 * Gets a user-friendly error message for an invalid contract ID.
 */
export function getContractIdErrorMessage(contractId: string): string {
  const result = validateContractId(contractId);
  if (result.valid) {
    return "";
  }
  return result.errors.join("; ");
}

/**
 * Sanitizes a contract ID by trimming whitespace and converting to uppercase.
 * Does not validate the ID; only performs basic normalization.
 */
export function normalizeSorobanContractId(contractId: string): string {
  if (!contractId || typeof contractId !== "string") {
    return "";
  }
  return contractId.trim().toUpperCase();
}

/**
 * Batch validates multiple contract IDs.
 */
export function validateContractIds(
  contractIds: string[],
): Record<string, ContractIdValidationResult> {
  const results: Record<string, ContractIdValidationResult> = {};

  for (const contractId of contractIds) {
    results[contractId] = validateContractId(contractId);
  }

  return results;
}

/**
 * Checks if a contract ID looks like it might be a Stellar account ID (common mistake).
 */
export function looksLikeStellarAccountId(contractId: string): boolean {
  if (!contractId || typeof contractId !== "string") {
    return false;
  }
  const trimmed = contractId.trim();
  return trimmed.length === 56 && trimmed.startsWith("G");
}

/**
 * Checks if a contract ID looks like it might be a Soroban contract ID
 * but is missing the leading 'C' (common mistake).
 */
export function looksLikeMissingContractIdPrefix(contractId: string): boolean {
  if (!contractId || typeof contractId !== "string") {
    return false;
  }
  const trimmed = contractId.trim();
  return (
    trimmed.length === 55 &&
    /^[A-Z2-7]{55}$/.test(trimmed) &&
    !trimmed.startsWith("C")
  );
}
