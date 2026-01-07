/**
 * UTC-only timezone utility functions
 * All times displayed in UTC throughout the application
 * Backend stores in UTC, Frontend displays in UTC
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
 * Format date in UTC - short format without time
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date (e.g., "07 Jan 2026")
 */
export const formatDateOnlyUTC = (date) => {
  if (!date) return 'Not set';
  const d = new Date(date);
  
  const options = {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC'
  };
  
  return d.toLocaleString('en-GB', options);
};

/**
 * Convert UTC datetime string to datetime-local input format (still UTC)
 * User enters time in UTC, so we display UTC values in the input
 * @param {string} utcDateString - UTC ISO string from backend
 * @returns {string} UTC datetime string for input (YYYY-MM-DDTHH:MM)
 */
export const convertUTCToInput = (utcDateString) => {
  if (!utcDateString) return '';
  const date = new Date(utcDateString);
  
  // Get UTC components (not local)
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Convert datetime-local input to UTC ISO string (user enters in UTC)
 * @param {string} inputDateTimeString - Datetime string from input (user enters UTC)
 * @returns {string|null} UTC ISO string
 */
export const convertInputToUTC = (inputDateTimeString) => {
  if (!inputDateTimeString) return null;
  
  // Treat input as UTC by appending 'Z'
  const utcDate = new Date(inputDateTimeString + ':00Z');
  return utcDate.toISOString();
};

/**
 * Get helper text for UTC time
 * @returns {string} Helper text explaining UTC vs IST
 */
export const getUTCHelperText = () => {
  return 'All times are in UTC (5:30 hours behind IST). Example: 14:00 UTC = 7:30 PM IST';
};
