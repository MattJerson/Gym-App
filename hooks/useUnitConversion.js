import { useMemo, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { UnitConversionService } from '../services/UnitConversionService';

/**
 * useUnitConversion Hook
 * Provides easy access to unit conversion utilities based on current user's preference
 * 
 * USAGE:
 * const { useMetric, formatWeight, parseWeight, getWeightUnit } = useUnitConversion();
 * 
 * // Display weight
 * const display = formatWeight(user.weight_kg);
 * <Text>{display.value} {display.unit}</Text>
 * 
 * // Save weight
 * const weightKg = parseWeight(inputValue);
 * await updateProfile({ weight_kg: weightKg });
 */
export const useUnitConversion = () => {
  const [useMetric, setUseMetric] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserPreference = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch user's unit preference from registration_profiles
        const { data: profile } = await supabase
          .from('registration_profiles')
          .select('use_metric')
          .eq('user_id', user.id)
          .single();

        // Default to metric if not set
        setUseMetric(profile?.use_metric ?? true);
      } catch (error) {
        console.error('Error fetching user unit preference:', error);
        // Default to metric on error
        setUseMetric(true);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPreference();
  }, []);

  const utilities = useMemo(() => ({
    // User preference
    useMetric,
    loading,

    // Weight utilities
    formatWeight: (weightKg, decimals = 1) => 
      UnitConversionService.formatWeight(weightKg, useMetric, decimals),
    
    parseWeight: (inputValue) => 
      UnitConversionService.parseWeightInput(inputValue, useMetric),
    
    getWeightUnit: () => 
      UnitConversionService.getWeightUnit(useMetric),
    
    validateWeight: (value) => 
      UnitConversionService.validateWeight(value, useMetric),

    // Height utilities
    formatHeight: (heightCm, decimals = 1) => 
      UnitConversionService.formatHeight(heightCm, useMetric, decimals),
    
    parseHeight: (inputValue) => 
      UnitConversionService.parseHeightInput(inputValue, useMetric),
    
    getHeightUnit: () => 
      UnitConversionService.getHeightUnit(useMetric),
    
    validateHeight: (value) => 
      UnitConversionService.validateHeight(value, useMetric),

    // Toggle conversion utilities
    convertWeightOnToggle: (currentValue, wasMetric, nowMetric) =>
      UnitConversionService.convertWeightOnToggle(currentValue, wasMetric, nowMetric),
    
    convertHeightOnToggle: (currentValue, wasMetric, nowMetric) =>
      UnitConversionService.convertHeightOnToggle(currentValue, wasMetric, nowMetric),

    // Direct conversion methods (for special cases)
    kgToLbs: UnitConversionService.kgToLbs.bind(UnitConversionService),
    lbsToKg: UnitConversionService.lbsToKg.bind(UnitConversionService),
    cmToInches: UnitConversionService.cmToInches.bind(UnitConversionService),
    inchesToCm: UnitConversionService.inchesToCm.bind(UnitConversionService),
  }), [useMetric, loading]);

  return utilities;
};

/**
 * Standalone function to format weight without hook (for services/utilities)
 * @param {number} weightKg - Weight in kilograms
 * @param {boolean} useMetric - User preference
 * @param {number} decimals - Decimal places
 */
export const formatWeightStandalone = (weightKg, useMetric = true, decimals = 1) => {
  return UnitConversionService.formatWeight(weightKg, useMetric, decimals);
};

/**
 * Standalone function to parse weight without hook (for services/utilities)
 * @param {string|number} inputValue - User input
 * @param {boolean} useMetric - User preference
 */
export const parseWeightStandalone = (inputValue, useMetric = true) => {
  return UnitConversionService.parseWeightInput(inputValue, useMetric);
};

export default useUnitConversion;
