/**
 * Date Utilities - Local Timezone Handling
 * 
 * All date operations use the user's local timezone instead of UTC.
 * This ensures that "today" means the same thing for all users regardless of location.
 */

/**
 * Get date string in YYYY-MM-DD format using user's local timezone
 * @param {Date} date - Date object (defaults to now)
 * @returns {string} - Date string in YYYY-MM-DD format
 */
export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get start of day in user's local timezone
 * @param {Date} date - Date object (defaults to now)
 * @returns {Date} - Date object set to 00:00:00.000 local time
 */
export function getLocalStartOfDay(date = new Date()) {
  const localDate = new Date(date);
  localDate.setHours(0, 0, 0, 0);
  return localDate;
}

/**
 * Get end of day in user's local timezone
 * @param {Date} date - Date object (defaults to now)
 * @returns {Date} - Date object set to 23:59:59.999 local time
 */
export function getLocalEndOfDay(date = new Date()) {
  const localDate = new Date(date);
  localDate.setHours(23, 59, 59, 999);
  return localDate;
}

/**
 * Get current time string in HH:MM:SS format using user's local timezone
 * @returns {string} - Time string in HH:MM:SS format
 */
export function getLocalTimeString() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Get day of week (0 = Sunday, 6 = Saturday) in user's local timezone
 * @param {Date} date - Date object (defaults to now)
 * @returns {number} - Day of week (0-6)
 */
export function getLocalDayOfWeek(date = new Date()) {
  return date.getDay();
}

/**
 * Convert ISO string to local date object
 * @param {string} isoString - ISO date string
 * @returns {Date} - Date object
 */
export function isoToLocalDate(isoString) {
  return new Date(isoString);
}

/**
 * Get ISO string for database storage (maintains local timezone intent)
 * @param {Date} date - Date object (defaults to now)
 * @returns {string} - ISO string
 */
export function getISOString(date = new Date()) {
  return date.toISOString();
}

/**
 * Check if a date is today in user's local timezone
 * @param {Date|string} date - Date object or ISO string
 * @returns {boolean} - True if date is today
 */
export function isToday(date) {
  const checkDate = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return getLocalDateString(checkDate) === getLocalDateString(today);
}

/**
 * Get week start date (Monday) in user's local timezone
 * @param {Date} date - Date object (defaults to now)
 * @returns {Date} - Date object set to Monday of the week
 */
export function getLocalWeekStart(date = new Date()) {
  const localDate = new Date(date);
  const day = localDate.getDay();
  const diff = localDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  localDate.setDate(diff);
  localDate.setHours(0, 0, 0, 0);
  return localDate;
}

/**
 * Format date for display in user's locale
 * @param {Date|string} date - Date object or ISO string
 * @param {string} format - Format type: 'short', 'medium', 'long'
 * @returns {string} - Formatted date string
 */
export function formatLocalDate(date, format = 'medium') {
  const localDate = typeof date === 'string' ? new Date(date) : date;
  
  const options = {
    short: { month: 'short', day: 'numeric' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
  };
  
  return localDate.toLocaleDateString(undefined, options[format] || options.medium);
}
