/**
 * Timezone utility functions
 * Backend stores everything in UTC, frontend displays in user's local timezone
 */

/**
 * Get the user's timezone name
 * @returns {string} Timezone name (e.g., "Asia/Kolkata", "America/New_York")
 */
export const getUserTimezone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Get timezone abbreviation (e.g., "IST", "PST")
 * @returns {string} Timezone abbreviation
 */
export const getTimezoneAbbr = () => {
  const date = new Date();
  const dateString = date.toLocaleTimeString('en-US', { timeZoneName: 'short' });
  const parts = dateString.split(' ');
  return parts[parts.length - 1];
};

/**
 * Get timezone offset in hours
 * @returns {string} Offset string (e.g., "+5:30", "-8:00")
 */
export const getTimezoneOffset = () => {
  const offset = -new Date().getTimezoneOffset();
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  const sign = offset >= 0 ? '+' : '-';
  return `${sign}${hours}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Format date in user's local timezone with timezone info
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string with timezone
 */
export const formatDateWithTimezone = (date) => {
  if (!date) return 'Not set';
  const d = new Date(date);
  return `${d.toLocaleString()} (${getTimezoneAbbr()})`;
};

/**
 * Convert local datetime-local input to UTC ISO string for backend
 * @param {string} localDateTimeString - Local datetime string from input
 * @returns {string|null} UTC ISO string
 */
export const convertLocalToUTC = (localDateTimeString) => {
  if (!localDateTimeString) return null;
  const localDate = new Date(localDateTimeString);
  return localDate.toISOString();
};

/**
 * Convert UTC ISO string to local datetime-local format for input
 * @param {string} utcDateString - UTC ISO string from backend
 * @returns {string} Local datetime string for input (YYYY-MM-DDTHH:MM)
 */
export const convertUTCToLocal = (utcDateString) => {
  if (!utcDateString) return '';
  const date = new Date(utcDateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};
