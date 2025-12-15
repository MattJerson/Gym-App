/**
 * UnitConversionService
 * Centralized service for converting between metric and imperial units
 * 
 * ARCHITECTURE:
 * - ALL data stored in database in METRIC (kg, cm)
 * - Conversion happens at DISPLAY layer based on user preference
 * - Single source of truth prevents data corruption
 * 
 * USAGE:
 * - Use formatWeight() to display weight to user
 * - Use parseWeightInput() when saving user input
 * - Always store in KG in database
 */

export const UnitConversionService = {
  // Conversion constants
  KG_TO_LBS: 2.20462,
  LBS_TO_KG: 0.453592,
  CM_TO_INCHES: 0.393701,
  INCHES_TO_CM: 2.54,
  CM_TO_FEET: 0.0328084,
  FEET_TO_CM: 30.48,

  /**
   * Convert kilograms to pounds
   * @param {number} kg - Weight in kilograms
   * @returns {number} Weight in pounds
   */
  kgToLbs(kg) {
    if (kg == null || isNaN(kg)) return 0;
    return parseFloat(kg) * this.KG_TO_LBS;
  },

  /**
   * Convert pounds to kilograms
   * @param {number} lbs - Weight in pounds
   * @returns {number} Weight in kilograms
   */
  lbsToKg(lbs) {
    if (lbs == null || isNaN(lbs)) return 0;
    return parseFloat(lbs) * this.LBS_TO_KG;
  },

  /**
   * Convert centimeters to inches
   * @param {number} cm - Height in centimeters
   * @returns {number} Height in inches
   */
  cmToInches(cm) {
    if (cm == null || isNaN(cm)) return 0;
    return parseFloat(cm) * this.CM_TO_INCHES;
  },

  /**
   * Convert inches to centimeters
   * @param {number} inches - Height in inches
   * @returns {number} Height in centimeters
   */
  inchesToCm(inches) {
    if (inches == null || isNaN(inches)) return 0;
    return parseFloat(inches) * this.INCHES_TO_CM;
  },

  /**
   * Format weight for display based on user preference
   * @param {number} weightKg - Weight in kilograms (from database)
   * @param {boolean} useMetric - User's unit preference (true = kg, false = lbs)
   * @param {number} decimals - Number of decimal places (default: 1)
   * @returns {Object} { value: string, unit: string, raw: number }
   */
  formatWeight(weightKg, useMetric = true, decimals = 1) {
    if (weightKg == null || isNaN(weightKg)) {
      return { value: '0', unit: useMetric ? 'kg' : 'lbs', raw: 0 };
    }

    const raw = useMetric ? parseFloat(weightKg) : this.kgToLbs(weightKg);
    const value = raw.toFixed(decimals);
    const unit = useMetric ? 'kg' : 'lbs';

    return { value, unit, raw };
  },

  /**
   * Format height for display based on user preference
   * @param {number} heightCm - Height in centimeters (from database)
   * @param {boolean} useMetric - User's unit preference (true = cm, false = in)
   * @param {number} decimals - Number of decimal places (default: 1)
   * @returns {Object} { value: string, unit: string, raw: number }
   */
  formatHeight(heightCm, useMetric = true, decimals = 1) {
    if (heightCm == null || isNaN(heightCm)) {
      return { value: '0', unit: useMetric ? 'cm' : 'in', raw: 0 };
    }

    const raw = useMetric ? parseFloat(heightCm) : this.cmToInches(heightCm);
    const value = raw.toFixed(decimals);
    const unit = useMetric ? 'cm' : 'in';

    return { value, unit, raw };
  },

  /**
   * Parse weight input from user and convert to KG for storage
   * @param {string|number} inputValue - User's input value
   * @param {boolean} useMetric - User's current unit preference
   * @returns {number} Weight in kilograms (ready for database)
   */
  parseWeightInput(inputValue, useMetric = true) {
    const num = parseFloat(inputValue);
    if (isNaN(num)) return null;

    // If user is in metric mode, value is already in KG
    // If user is in imperial mode, convert LBS to KG
    return useMetric ? num : this.lbsToKg(num);
  },

  /**
   * Parse height input from user and convert to CM for storage
   * @param {string|number} inputValue - User's input value
   * @param {boolean} useMetric - User's current unit preference
   * @returns {number} Height in centimeters (ready for database)
   */
  parseHeightInput(inputValue, useMetric = true) {
    const num = parseFloat(inputValue);
    if (isNaN(num)) return null;

    // If user is in metric mode, value is already in CM
    // If user is in imperial mode, convert inches to CM
    return useMetric ? num : this.inchesToCm(num);
  },

  /**
   * Get weight unit label based on user preference
   * @param {boolean} useMetric - User's unit preference
   * @returns {string} 'kg' or 'lbs'
   */
  getWeightUnit(useMetric = true) {
    return useMetric ? 'kg' : 'lbs';
  },

  /**
   * Get height unit label based on user preference
   * @param {boolean} useMetric - User's unit preference
   * @returns {string} 'cm' or 'in'
   */
  getHeightUnit(useMetric = true) {
    return useMetric ? 'cm' : 'in';
  },

  /**
   * Validate weight input based on unit system
   * @param {number} value - Input value in current unit
   * @param {boolean} useMetric - User's unit preference
   * @returns {Object} { isValid: boolean, message: string, min: number, max: number }
   */
  validateWeight(value, useMetric = true) {
    const num = parseFloat(value);
    if (isNaN(num)) {
      return { isValid: false, message: 'Please enter a valid number', min: 0, max: 0 };
    }

    // Define realistic weight ranges
    const minKg = 30;   // ~66 lbs
    const maxKg = 300;  // ~660 lbs
    const minLbs = 66;
    const maxLbs = 660;

    const min = useMetric ? minKg : minLbs;
    const max = useMetric ? maxKg : maxLbs;
    const unit = this.getWeightUnit(useMetric);

    if (num < min) {
      return { isValid: false, message: `Weight must be at least ${min} ${unit}`, min, max };
    }
    if (num > max) {
      return { isValid: false, message: `Weight must be less than ${max} ${unit}`, min, max };
    }

    return { isValid: true, message: '', min, max };
  },

  /**
   * Validate height input based on unit system
   * @param {number} value - Input value in current unit
   * @param {boolean} useMetric - User's unit preference
   * @returns {Object} { isValid: boolean, message: string, min: number, max: number }
   */
  validateHeight(value, useMetric = true) {
    const num = parseFloat(value);
    if (isNaN(num)) {
      return { isValid: false, message: 'Please enter a valid number', min: 0, max: 0 };
    }

    // Define realistic height ranges
    const minCm = 100;  // ~39 inches
    const maxCm = 250;  // ~98 inches
    const minIn = 36;
    const maxIn = 96;

    const min = useMetric ? minCm : minIn;
    const max = useMetric ? maxCm : maxIn;
    const unit = this.getHeightUnit(useMetric);

    if (num < min) {
      return { isValid: false, message: `Height must be at least ${min} ${unit}`, min, max };
    }
    if (num > max) {
      return { isValid: false, message: `Height must be less than ${max} ${unit}`, min, max };
    }

    return { isValid: true, message: '', min, max };
  },

  /**
   * Convert weight value when user switches unit systems
   * Used when toggling between metric/imperial in forms
   * @param {number} currentValue - Current displayed value
   * @param {boolean} wasMetric - Was previously in metric?
   * @param {boolean} nowMetric - Is now in metric?
   * @returns {number} Converted value for new unit system
   */
  convertWeightOnToggle(currentValue, wasMetric, nowMetric) {
    if (wasMetric === nowMetric) return currentValue; // No change
    
    const num = parseFloat(currentValue);
    if (isNaN(num)) return '';

    // Was metric (kg), now imperial (lbs)
    if (wasMetric && !nowMetric) {
      return this.kgToLbs(num).toFixed(1);
    }
    
    // Was imperial (lbs), now metric (kg)
    if (!wasMetric && nowMetric) {
      return this.lbsToKg(num).toFixed(1);
    }

    return currentValue;
  },

  /**
   * Convert height value when user switches unit systems
   * @param {number} currentValue - Current displayed value
   * @param {boolean} wasMetric - Was previously in metric?
   * @param {boolean} nowMetric - Is now in metric?
   * @returns {number} Converted value for new unit system
   */
  convertHeightOnToggle(currentValue, wasMetric, nowMetric) {
    if (wasMetric === nowMetric) return currentValue; // No change
    
    const num = parseFloat(currentValue);
    if (isNaN(num)) return '';

    // Was metric (cm), now imperial (in)
    if (wasMetric && !nowMetric) {
      return this.cmToInches(num).toFixed(1);
    }
    
    // Was imperial (in), now metric (cm)
    if (!wasMetric && nowMetric) {
      return this.inchesToCm(num).toFixed(1);
    }

    return currentValue;
  },
};

export default UnitConversionService;
