/**
 * Unit Conversion Service for Admin Dashboard
 * Handles weight and height conversions between metric (kg/cm) and imperial (lbs/inches)
 * Database stores everything in metric - this is only for display
 */

const UnitConversionService = {
  // Conversion constants
  KG_TO_LBS: 2.20462,
  LBS_TO_KG: 0.453592,
  CM_TO_INCHES: 0.393701,
  INCHES_TO_CM: 2.54,

  /**
   * Convert kg to lbs
   * @param {number} kg - Weight in kilograms
   * @returns {number} Weight in pounds
   */
  kgToLbs(kg) {
    if (kg == null || isNaN(kg)) return null;
    return kg * this.KG_TO_LBS;
  },

  /**
   * Convert lbs to kg
   * @param {number} lbs - Weight in pounds
   * @returns {number} Weight in kilograms
   */
  lbsToKg(lbs) {
    if (lbs == null || isNaN(lbs)) return null;
    return lbs * this.LBS_TO_KG;
  },

  /**
   * Convert cm to inches
   * @param {number} cm - Height in centimeters
   * @returns {number} Height in inches
   */
  cmToInches(cm) {
    if (cm == null || isNaN(cm)) return null;
    return cm * this.CM_TO_INCHES;
  },

  /**
   * Convert inches to cm
   * @param {number} inches - Height in inches
   * @returns {number} Height in centimeters
   */
  inchesToCm(inches) {
    if (inches == null || isNaN(inches)) return null;
    return inches * this.INCHES_TO_CM;
  },

  /**
   * Format weight for display with unit
   * @param {number} weightKg - Weight in kg from database
   * @param {boolean} useMetric - User's unit preference
   * @param {number} decimals - Decimal places (default: 1)
   * @returns {Object} { value: string, unit: string, raw: number }
   */
  formatWeight(weightKg, useMetric = true, decimals = 1) {
    if (weightKg == null || isNaN(weightKg)) {
      return { value: '0', unit: useMetric ? 'kg' : 'lbs', raw: 0 };
    }

    if (useMetric) {
      return {
        value: weightKg.toFixed(decimals),
        unit: 'kg',
        raw: weightKg
      };
    } else {
      const lbs = this.kgToLbs(weightKg);
      return {
        value: lbs.toFixed(decimals),
        unit: 'lbs',
        raw: lbs
      };
    }
  },

  /**
   * Format height for display with unit
   * @param {number} heightCm - Height in cm from database
   * @param {boolean} useMetric - User's unit preference
   * @param {number} decimals - Decimal places (default: 1)
   * @returns {Object} { value: string, unit: string, raw: number }
   */
  formatHeight(heightCm, useMetric = true, decimals = 1) {
    if (heightCm == null || isNaN(heightCm)) {
      return { value: '0', unit: useMetric ? 'cm' : 'in', raw: 0 };
    }

    if (useMetric) {
      return {
        value: heightCm.toFixed(decimals),
        unit: 'cm',
        raw: heightCm
      };
    } else {
      const inches = this.cmToInches(heightCm);
      return {
        value: inches.toFixed(decimals),
        unit: 'in',
        raw: inches
      };
    }
  },

  /**
   * Parse user weight input and convert to kg for database storage
   * @param {number} value - Input value
   * @param {boolean} useMetric - Whether input is in metric units
   * @returns {number} Weight in kg
   */
  parseWeightInput(value, useMetric = true) {
    if (value == null || isNaN(value)) return null;
    return useMetric ? value : this.lbsToKg(value);
  },

  /**
   * Parse user height input and convert to cm for database storage
   * @param {number} value - Input value
   * @param {boolean} useMetric - Whether input is in metric units
   * @returns {number} Height in cm
   */
  parseHeightInput(value, useMetric = true) {
    if (value == null || isNaN(value)) return null;
    return useMetric ? value : this.inchesToCm(value);
  },

  /**
   * Get unit preference from localStorage
   * @returns {boolean} true for metric (kg/cm), false for imperial (lbs/inches)
   */
  getUnitPreference() {
    const stored = localStorage.getItem('adminUnitPreference');
    return stored === null ? true : stored === 'metric';
  },

  /**
   * Save unit preference to localStorage
   * @param {boolean} useMetric - true for metric, false for imperial
   */
  setUnitPreference(useMetric) {
    localStorage.setItem('adminUnitPreference', useMetric ? 'metric' : 'imperial');
  }
};

export default UnitConversionService;
