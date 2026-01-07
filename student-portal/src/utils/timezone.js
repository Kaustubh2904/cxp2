/**
 * UTC-only timezone utility functions
 * All times displayed in UTC throughout the application
 */

/**
 * Format date in UTC with readable format
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string in UTC (e.g., "07 Jan 2026, 14:30 UTC")
 */
export const formatDateUTC = (date) => {
  if (!date) return 'Not set';
  const d = new Date(date);
  
  const options = {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    hour12: false
  };
  
  return `${d.toLocaleString('en-GB', options)} UTC`;
};

/**
 * Format countdown timer (no timezone label)
 * @param {number} seconds - Seconds remaining
 * @returns {string} Formatted countdown (e.g., "2h 30m")
 */
export const formatCountdown = (seconds) => {
  if (seconds <= 0) return '0m';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};
