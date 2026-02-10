/**
 * Utility functions for input validation and formatting
 */

/**
 * Clamps a number between min and max values
 */
export function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Parse and clamp a numeric input value
 */
export function parseAndClampNumber(
  value: string,
  min: number,
  max: number,
): number {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? min : clampNumber(parsed, min, max);
}

/**
 * Format large numbers with thousand separators
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}
