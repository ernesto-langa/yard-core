/**
 * format-duration.js
 * Utility for converting milliseconds into human-readable time formats.
 * @version 1.0.0
 * @story TEST-1
 */

/**
 * Converts milliseconds to a descriptive format like "1h 1m 1s".
 * Handles edge cases including non-numeric inputs, negative values,
 * and caps displays at "999d+".
 *
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Human-readable duration string
 */
function formatDuration(ms) {
  if (typeof ms !== 'number' || isNaN(ms)) return '0s';

  const negative = ms < 0;
  const abs = Math.abs(ms);

  const seconds = Math.floor(abs / 1000) % 60;
  const minutes = Math.floor(abs / (1000 * 60)) % 60;
  const hours = Math.floor(abs / (1000 * 60 * 60)) % 24;
  const days = Math.floor(abs / (1000 * 60 * 60 * 24));

  const parts = [];

  if (days > 999) {
    parts.push('999d+');
  } else if (days > 0) {
    parts.push(`${days}d`);
  }

  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  const result = parts.join(' ');
  return negative ? `-${result}` : result;
}

/**
 * Produces a compact time notation (e.g., "2:30:45" for hours:minutes:seconds
 * or "45:30" for minutes:seconds). Invalid inputs default to "0:00".
 *
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Compact duration string
 */
function formatDurationShort(ms) {
  if (typeof ms !== 'number' || isNaN(ms) || ms < 0) return '0:00';

  const abs = ms;

  const seconds = Math.floor(abs / 1000) % 60;
  const minutes = Math.floor(abs / (1000 * 60)) % 60;
  const hours = Math.floor(abs / (1000 * 60 * 60));

  const pad = (n) => String(n).padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }

  return `${minutes}:${pad(seconds)}`;
}

module.exports = { formatDuration, formatDurationShort };
