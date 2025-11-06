/**
 * Validation Helper Functions
 * Reusable validation utilities for all services
 * 
 * Purpose: Prevent crashes from invalid data (division by zero, NaN, null, undefined)
 * Usage: Import functions and use throughout service files
 */

/**
 * Safe division - returns defaultValue if denominator is 0 or invalid
 * @param {number} numerator - The numerator
 * @param {number} denominator - The denominator
 * @param {number} defaultValue - Value to return if division is unsafe (default: 0)
 * @returns {number} Result of division or defaultValue
 * 
 * @example
 * safeDivide(100, 0) // Returns 0 instead of Infinity
 * safeDivide(100, 50) // Returns 2
 * safeDivide(100, null, -1) // Returns -1
 */
export const safeDivide = (numerator, denominator, defaultValue = 0) => {
  if (!denominator || denominator === 0 || !isFinite(denominator)) {
    return defaultValue;
  }
  const result = numerator / denominator;
  return isFinite(result) ? result : defaultValue;
};

/**
 * Safe percentage calculation
 * @param {number} current - Current value
 * @param {number} total - Total/target value
 * @param {boolean} round - Whether to round result (default: true)
 * @returns {number} Percentage (0-100) or 0 if invalid
 * 
 * @example
 * safePercentage(75, 100) // Returns 75
 * safePercentage(150, 100) // Returns 150 (over 100%)
 * safePercentage(50, 0) // Returns 0 instead of Infinity
 */
export const safePercentage = (current, total, round = true) => {
  const percentage = safeDivide(current ?? 0, total ?? 0, 0) * 100;
  return round ? Math.round(percentage) : percentage;
};

/**
 * Safe integer parsing - returns defaultValue if NaN
 * @param {any} value - Value to parse
 * @param {number} defaultValue - Value to return if parsing fails (default: 0)
 * @returns {number} Parsed integer or defaultValue
 * 
 * @example
 * safeParseInt("123") // Returns 123
 * safeParseInt("abc") // Returns 0
 * safeParseInt("12.7") // Returns 12
 */
export const safeParseInt = (value, defaultValue = 0) => {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Safe float parsing - returns defaultValue if NaN or Infinity
 * @param {any} value - Value to parse
 * @param {number} defaultValue - Value to return if parsing fails (default: 0)
 * @returns {number} Parsed float or defaultValue
 * 
 * @example
 * safeParseFloat("123.45") // Returns 123.45
 * safeParseFloat("abc") // Returns 0
 * safeParseFloat(Infinity) // Returns 0
 */
export const safeParseFloat = (value, defaultValue = 0) => {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) || !isFinite(parsed) ? defaultValue : parsed;
};

/**
 * Safe array map - returns defaultValue if array is invalid
 * @param {Array} array - Array to map
 * @param {Function} mapFn - Map function
 * @param {Array} defaultValue - Value to return if array is invalid (default: [])
 * @returns {Array} Mapped array or defaultValue
 * 
 * @example
 * safeMap([1,2,3], x => x * 2) // Returns [2,4,6]
 * safeMap(null, x => x * 2) // Returns []
 * safeMap(undefined, x => x * 2, [0]) // Returns [0]
 */
export const safeMap = (array, mapFn, defaultValue = []) => {
  if (!Array.isArray(array) || array.length === 0) {
    return defaultValue;
  }
  try {
    return array.map(mapFn);
  } catch (error) {
    console.error('Error in safeMap:', error);
    return defaultValue;
  }
};

/**
 * Safe array filter - returns defaultValue if array is invalid
 * @param {Array} array - Array to filter
 * @param {Function} filterFn - Filter function
 * @param {Array} defaultValue - Value to return if array is invalid (default: [])
 * @returns {Array} Filtered array or defaultValue
 * 
 * @example
 * safeFilter([1,2,3,4], x => x > 2) // Returns [3,4]
 * safeFilter(null, x => x > 2) // Returns []
 */
export const safeFilter = (array, filterFn, defaultValue = []) => {
  if (!Array.isArray(array) || array.length === 0) {
    return defaultValue;
  }
  try {
    return array.filter(filterFn);
  } catch (error) {
    console.error('Error in safeFilter:', error);
    return defaultValue;
  }
};

/**
 * Safe array reduce - returns initialValue if array is invalid
 * @param {Array} array - Array to reduce
 * @param {Function} reduceFn - Reduce function
 * @param {any} initialValue - Initial value for reduce
 * @returns {any} Reduced value or initialValue
 * 
 * @example
 * safeReduce([1,2,3], (sum, x) => sum + x, 0) // Returns 6
 * safeReduce(null, (sum, x) => sum + x, 0) // Returns 0
 */
export const safeReduce = (array, reduceFn, initialValue) => {
  if (!Array.isArray(array) || array.length === 0) {
    return initialValue;
  }
  try {
    return array.reduce(reduceFn, initialValue);
  } catch (error) {
    console.error('Error in safeReduce:', error);
    return initialValue;
  }
};

/**
 * Validate calorie value is within acceptable range
 * @param {number} calories - Calorie value to validate
 * @param {number} min - Minimum allowed (default: 0)
 * @param {number} max - Maximum allowed (default: 10000)
 * @returns {number} Clamped calorie value
 * 
 * @example
 * validateCalories(2500) // Returns 2500
 * validateCalories(-100) // Returns 0
 * validateCalories(50000) // Returns 10000
 */
export const validateCalories = (calories, min = 0, max = 10000) => {
  const value = safeParseFloat(calories, 0);
  if (value < min) {
    console.warn(`Calorie value too low: ${calories}, clamped to ${min}`);
    return min;
  }
  if (value > max) {
    console.warn(`Calorie value too high: ${calories}, clamped to ${max}`);
    return max;
  }
  return value;
};

/**
 * Validate workout calorie value is within acceptable range
 * @param {number} calories - Workout calorie value to validate
 * @param {number} min - Minimum allowed (default: 0)
 * @param {number} max - Maximum allowed (default: 2000)
 * @returns {number} Clamped workout calorie value
 * 
 * @example
 * validateWorkoutCalories(500) // Returns 500
 * validateWorkoutCalories(5000) // Returns 2000
 */
export const validateWorkoutCalories = (calories, min = 0, max = 2000) => {
  const value = safeParseFloat(calories, 0);
  if (value < min || value > max) {
    console.warn(`Workout calories out of range: ${calories}, clamped to ${min}-${max}`);
    return Math.max(min, Math.min(value, max));
  }
  return value;
};

/**
 * Validate weight value is within acceptable range
 * @param {number} weight - Weight value to validate (in kg)
 * @param {number} min - Minimum allowed (default: 20)
 * @param {number} max - Maximum allowed (default: 500)
 * @returns {number|null} Valid weight or null if invalid
 * 
 * @example
 * validateWeight(75) // Returns 75
 * validateWeight(10) // Returns null (too low)
 * validateWeight(600) // Returns null (too high)
 */
export const validateWeight = (weight, min = 20, max = 500) => {
  const value = safeParseFloat(weight, null);
  if (value === null || value < min || value > max) {
    console.warn(`Invalid weight: ${weight} (must be ${min}-${max} kg)`);
    return null;
  }
  return value;
};

/**
 * Validate and sanitize macro object
 * @param {Object} macros - Macros object with protein, carbs, fats, fiber
 * @returns {Object} Validated macros object with all values >= 0
 * 
 * @example
 * validateMacros({ protein: 50, carbs: 100, fats: 30 })
 * // Returns { protein: 50, carbs: 100, fats: 30, fiber: 0 }
 * validateMacros({ protein: -10, carbs: 'abc' })
 * // Returns { protein: 0, carbs: 0, fats: 0, fiber: 0 }
 */
export const validateMacros = (macros) => {
  if (!macros || typeof macros !== 'object') {
    return {
      protein: 0,
      carbs: 0,
      fats: 0,
      fiber: 0,
    };
  }

  return {
    protein: Math.max(0, safeParseFloat(macros.protein, 0)),
    carbs: Math.max(0, safeParseFloat(macros.carbs, 0)),
    fats: Math.max(0, safeParseFloat(macros.fats, 0)),
    fiber: Math.max(0, safeParseFloat(macros.fiber, 0)),
  };
};

/**
 * Check if object has all required properties (not null/undefined)
 * @param {Object} obj - Object to check
 * @param {Array<string>} requiredProps - Array of required property names
 * @returns {boolean} True if all required props exist and are not null/undefined
 * 
 * @example
 * hasRequiredProps({ id: 1, name: 'Test' }, ['id', 'name']) // Returns true
 * hasRequiredProps({ id: 1 }, ['id', 'name']) // Returns false
 * hasRequiredProps(null, ['id']) // Returns false
 */
export const hasRequiredProps = (obj, requiredProps) => {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  return requiredProps.every(
    prop => obj.hasOwnProperty(prop) && obj[prop] !== null && obj[prop] !== undefined
  );
};

/**
 * Check if date is valid
 * @param {any} date - Date to validate
 * @returns {boolean} True if valid date
 * 
 * @example
 * isValidDate('2024-01-01') // Returns true
 * isValidDate('invalid') // Returns false
 * isValidDate(null) // Returns false
 */
export const isValidDate = (date) => {
  if (!date) return false;
  const d = new Date(date);
  return d instanceof Date && !isFinite(d);
};

/**
 * Check if date is in the future
 * @param {any} date - Date to check
 * @returns {boolean} True if date is in the future
 * 
 * @example
 * isFutureDate('2099-01-01') // Returns true (in most cases)
 * isFutureDate('2020-01-01') // Returns false
 */
export const isFutureDate = (date) => {
  if (!isValidDate(date)) return false;
  return new Date(date) > new Date();
};

/**
 * Clamp value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 * 
 * @example
 * clamp(150, 0, 100) // Returns 100
 * clamp(-10, 0, 100) // Returns 0
 * clamp(50, 0, 100) // Returns 50
 */
export const clamp = (value, min, max) => {
  const numValue = safeParseFloat(value, min);
  return Math.min(Math.max(numValue, min), max);
};

/**
 * Get safe default for undefined/null values
 * @param {any} value - Value to check
 * @param {any} defaultValue - Default value to return
 * @returns {any} Value or defaultValue
 * 
 * @example
 * getDefault(null, 'N/A') // Returns 'N/A'
 * getDefault('test', 'N/A') // Returns 'test'
 * getDefault(0, 10) // Returns 0 (0 is valid)
 */
export const getDefault = (value, defaultValue) => {
  return value !== null && value !== undefined ? value : defaultValue;
};

/**
 * Safe object property access with default
 * @param {Object} obj - Object to access
 * @param {string} path - Property path (e.g., 'user.profile.name')
 * @param {any} defaultValue - Default value if path doesn't exist
 * @returns {any} Property value or defaultValue
 * 
 * @example
 * safeGet({ user: { name: 'John' } }, 'user.name', 'Unknown') // Returns 'John'
 * safeGet({ user: {} }, 'user.profile.name', 'Unknown') // Returns 'Unknown'
 * safeGet(null, 'user.name', 'Unknown') // Returns 'Unknown'
 */
export const safeGet = (obj, path, defaultValue) => {
  if (!obj || typeof obj !== 'object') return defaultValue;
  
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined || !result.hasOwnProperty(key)) {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result !== null && result !== undefined ? result : defaultValue;
};

/**
 * Validate array and return safe array
 * @param {any} value - Value to validate as array
 * @param {Array} defaultValue - Default value if not array (default: [])
 * @returns {Array} Valid array or defaultValue
 * 
 * @example
 * ensureArray([1,2,3]) // Returns [1,2,3]
 * ensureArray(null) // Returns []
 * ensureArray('test', ['default']) // Returns ['default']
 */
export const ensureArray = (value, defaultValue = []) => {
  return Array.isArray(value) ? value : defaultValue;
};

/**
 * Validate number and return safe number
 * @param {any} value - Value to validate as number
 * @param {number} defaultValue - Default value if not number (default: 0)
 * @returns {number} Valid number or defaultValue
 * 
 * @example
 * ensureNumber(42) // Returns 42
 * ensureNumber('abc') // Returns 0
 * ensureNumber(null, -1) // Returns -1
 */
export const ensureNumber = (value, defaultValue = 0) => {
  const num = safeParseFloat(value, defaultValue);
  return isFinite(num) ? num : defaultValue;
};

/**
 * Calculate macro calories and validate consistency
 * @param {Object} macros - Macros object with protein, carbs, fats
 * @param {number} totalCalories - Stated total calories
 * @param {number} tolerance - Allowed tolerance (default: 1.1 = 10% over)
 * @returns {Object} { isValid: boolean, calculated: number, stated: number }
 * 
 * @example
 * validateMacroConsistency({ protein: 50, carbs: 100, fats: 30 }, 500)
 * // Returns { isValid: true, calculated: 470, stated: 500 }
 */
export const validateMacroConsistency = (macros, totalCalories, tolerance = 1.1) => {
  const validMacros = validateMacros(macros);
  const calculated = 
    (validMacros.protein * 4) +
    (validMacros.carbs * 4) +
    (validMacros.fats * 9);
  
  const stated = ensureNumber(totalCalories, 0);
  const isValid = calculated <= (stated * tolerance);
  
  if (!isValid) {
    console.warn(
      `Macro inconsistency: Calculated ${calculated} cal > Stated ${stated} cal`,
      { macros: validMacros, tolerance }
    );
  }
  
  return {
    isValid,
    calculated: Math.round(calculated),
    stated: Math.round(stated),
  };
};

// Export all functions as default object for convenience
export default {
  safeDivide,
  safePercentage,
  safeParseInt,
  safeParseFloat,
  safeMap,
  safeFilter,
  safeReduce,
  validateCalories,
  validateWorkoutCalories,
  validateWeight,
  validateMacros,
  hasRequiredProps,
  isValidDate,
  isFutureDate,
  clamp,
  getDefault,
  safeGet,
  ensureArray,
  ensureNumber,
  validateMacroConsistency,
};
