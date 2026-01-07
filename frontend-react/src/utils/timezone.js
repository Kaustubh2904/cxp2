/**
 * UTC utility functions
 * Backend stores everything in UTC, frontend displays in UTC
 */

/**
 * Format UTC date for display
 * @param {string|Date} utcDate - UTC date to format
 * @param {object} options - Formatting options for toLocaleString
 * @returns {string} Formatted UTC date string
 */
export const formatUTCDate = (utcDate, options = {}) => {
  if (!utcDate) return 'Not set';
  const date = new Date(utcDate);
  return date.toLocaleString('en-US', {
    timeZone: 'UTC',
    ...options
  });
};

/**
 * Format date for display in UTC with timezone label
 * @param {string|Date} utcDate - UTC date to format
 * @returns {string} Formatted UTC date string with timezone
 */
export const formatDateUTC = (utcDate) => {
  if (!utcDate) return 'Not set';
  return `${formatUTCDate(utcDate)} UTC`;
};

/**
 * Convert datetime-local input to UTC ISO string for backend
 * @param {string} dateTimeString - Datetime string from input
 * @returns {string|null} UTC ISO string
 */
export const convertToUTC = (dateTimeString) => {
  if (!dateTimeString) return null;
  const date = new Date(dateTimeString);
  return date.toISOString();
};

/**
 * Convert UTC ISO string to datetime-local format for input
 * @param {string} utcDateString - UTC ISO string from backend
 * @returns {string} Datetime string for input (YYYY-MM-DDTHH:MM)
 */
export const convertUTCToInput = (utcDateString) => {
  if (!utcDateString) return '';
  const date = new Date(utcDateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};
