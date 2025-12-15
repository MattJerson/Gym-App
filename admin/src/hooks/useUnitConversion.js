import { useState, useEffect } from 'react';
import UnitConversionService from '../services/UnitConversionService';

/**
 * Custom hook for unit conversion in admin dashboard
 * Manages unit preference state and provides conversion helpers
 * Syncs state across all component instances using custom events
 */
export const useUnitConversion = () => {
  const [useMetric, setUseMetric] = useState(() => {
    return UnitConversionService.getUnitPreference();
  });

  // Update localStorage when preference changes
  useEffect(() => {
    UnitConversionService.setUnitPreference(useMetric);
    // Dispatch custom event to sync state across all hook instances
    window.dispatchEvent(new CustomEvent('unitPreferenceChanged', { detail: { useMetric } }));
  }, [useMetric]);

  // Listen for unit preference changes from other components
  useEffect(() => {
    const handleUnitChange = (event) => {
      setUseMetric(event.detail.useMetric);
    };
    
    window.addEventListener('unitPreferenceChanged', handleUnitChange);
    
    return () => {
      window.removeEventListener('unitPreferenceChanged', handleUnitChange);
    };
  }, []);

  /**
   * Format weight from kg (database) to user's preferred unit
   * @param {number} weightKg - Weight in kilograms
   * @param {number} decimals - Decimal places
   * @returns {Object} { value, unit, raw }
   */
  const formatWeight = (weightKg, decimals = 1) => {
    return UnitConversionService.formatWeight(weightKg, useMetric, decimals);
  };

  /**
   * Format height from cm (database) to user's preferred unit
   * @param {number} heightCm - Height in centimeters
   * @param {number} decimals - Decimal places
   * @returns {Object} { value, unit, raw }
   */
  const formatHeight = (heightCm, decimals = 1) => {
    return UnitConversionService.formatHeight(heightCm, useMetric, decimals);
  };

  /**
   * Convert user input to kg for database storage
   * @param {number} value - Input value
   * @returns {number} Weight in kg
   */
  const parseWeightInput = (value) => {
    return UnitConversionService.parseWeightInput(value, useMetric);
  };

  /**
   * Convert user input to cm for database storage
   * @param {number} value - Input value
   * @returns {number} Height in cm
   */
  const parseHeightInput = (value) => {
    return UnitConversionService.parseHeightInput(value, useMetric);
  };

  /**
   * Toggle between metric and imperial
   */
  const toggleUnits = () => {
    setUseMetric(prev => !prev);
  };

  return {
    useMetric,
    setUseMetric,
    toggleUnits,
    formatWeight,
    formatHeight,
    parseWeightInput,
    parseHeightInput,
    weightUnit: useMetric ? 'kg' : 'lbs',
    heightUnit: useMetric ? 'cm' : 'in'
  };
};
