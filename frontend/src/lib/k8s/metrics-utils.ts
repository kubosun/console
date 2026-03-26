/**
 * Kubernetes quantity parsing and formatting utilities.
 */

const BINARY_SUFFIXES: Record<string, number> = {
  Ki: 1024,
  Mi: 1024 ** 2,
  Gi: 1024 ** 3,
  Ti: 1024 ** 4,
  Pi: 1024 ** 5,
};

const DECIMAL_SUFFIXES: Record<string, number> = {
  k: 1e3,
  M: 1e6,
  G: 1e9,
  T: 1e12,
};

/**
 * Parse a Kubernetes quantity string to a numeric value.
 * CPU: returns millicores (e.g., "100m" -> 100, "1" -> 1000)
 * Memory: returns bytes (e.g., "256Mi" -> 268435456, "1Gi" -> 1073741824)
 */
export function parseK8sQuantity(qty: string): number {
  if (!qty) return 0;

  // CPU millicores
  if (qty.endsWith('m')) {
    return parseFloat(qty.slice(0, -1));
  }

  // CPU nanocores
  if (qty.endsWith('n')) {
    return parseFloat(qty.slice(0, -1)) / 1e6;
  }

  // Binary suffixes (Ki, Mi, Gi, Ti, Pi)
  for (const [suffix, multiplier] of Object.entries(BINARY_SUFFIXES)) {
    if (qty.endsWith(suffix)) {
      return parseFloat(qty.slice(0, -suffix.length)) * multiplier;
    }
  }

  // Decimal suffixes (k, M, G, T)
  for (const [suffix, multiplier] of Object.entries(DECIMAL_SUFFIXES)) {
    if (qty.endsWith(suffix)) {
      return parseFloat(qty.slice(0, -suffix.length)) * multiplier;
    }
  }

  // Plain number — for CPU this is cores, convert to millicores context-dependent
  return parseFloat(qty);
}

/**
 * Format CPU value in millicores to human-readable string.
 */
export function formatCPU(millicores: number): string {
  if (millicores >= 1000) {
    const cores = millicores / 1000;
    return `${cores % 1 === 0 ? cores : cores.toFixed(1)} cores`;
  }
  return `${Math.round(millicores)}m`;
}

/**
 * Format memory value in bytes to human-readable string.
 */
export function formatMemory(bytes: number): string {
  if (bytes >= 1024 ** 4) return `${(bytes / 1024 ** 4).toFixed(1)} TiB`;
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GiB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(0)} MiB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KiB`;
  return `${bytes} B`;
}

/**
 * Calculate usage percentage, capped at 100.
 */
export function usagePercent(used: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(Math.round((used / total) * 100), 100);
}
