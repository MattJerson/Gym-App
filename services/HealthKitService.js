/**
 * HealthKitService.js
 * Integrates with Apple Health (iOS) and Google Fit (Android) for step tracking
 * Automatically syncs daily step data from device health apps
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocalDateString } from '../utils/dateUtils';

// Dynamically import health libraries - they may not be available in Expo Go
let AppleHealthKit = null;
let GoogleFit = null;

try {
  AppleHealthKit = require('react-native-health');
  if (AppleHealthKit && AppleHealthKit.default) {
    AppleHealthKit = AppleHealthKit.default;
  }
} catch (error) {
}

try {
  GoogleFit = require('react-native-google-fit');
  if (GoogleFit && GoogleFit.default) {
    GoogleFit = GoogleFit.default;
  }
} catch (error) {
}

const HEALTH_KIT_PERMISSION_KEY = '@healthkit_permission_granted';

class HealthKitService {
  constructor() {
    this.isInitialized = false;
    this.hasPermission = false;
  }

  /**
   * Initialize health kit with permissions
   * Must be called before any health data access
   */
  async initialize() {
    try {
      if (Platform.OS === 'ios') {
        if (!AppleHealthKit) {
          return false;
        }
        return await this.initializeAppleHealth();
      } else if (Platform.OS === 'android') {
        if (!GoogleFit) {
          return false;
        }
        return await this.initializeGoogleFit();
      }
      return false;
    } catch (error) {
      console.error('Error initializing health kit:', error);
      return false;
    }
  }

  /**
   * Initialize Apple Health (iOS)
   */
  async initializeAppleHealth() {
    if (!AppleHealthKit || typeof AppleHealthKit.initHealthKit !== 'function') {
      return false;
    }

    return new Promise((resolve) => {
      const permissions = {
        permissions: {
          read: [
            AppleHealthKit.Constants.Permissions.Steps,
            AppleHealthKit.Constants.Permissions.StepCount,
            AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
            AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
          ],
          write: [], // We only need read access
        },
      };

      AppleHealthKit.initHealthKit(permissions, (error) => {
        if (error) {
          console.error('Apple Health initialization error:', error);
          this.isInitialized = false;
          this.hasPermission = false;
          resolve(false);
        } else {
          this.isInitialized = true;
          this.hasPermission = true;
          AsyncStorage.setItem(HEALTH_KIT_PERMISSION_KEY, 'true');
          resolve(true);
        }
      });
    });
  }

  /**
   * Initialize Google Fit (Android)
   */
  async initializeGoogleFit() {
    if (!GoogleFit) {
      return false;
    }

    try {
      const options = {
        scopes: [
          Scopes.FITNESS_ACTIVITY_READ,
          Scopes.FITNESS_LOCATION_READ,
        ],
      };

      const authResult = await GoogleFit.authorize(options);
      
      if (authResult.success) {
        this.isInitialized = true;
        this.hasPermission = true;
        await AsyncStorage.setItem(HEALTH_KIT_PERMISSION_KEY, 'true');
        return true;
      } else {
        console.error('Google Fit authorization failed');
        this.isInitialized = false;
        this.hasPermission = false;
        return false;
      }
    } catch (error) {
      console.error('Error initializing Google Fit:', error);
      this.isInitialized = false;
      this.hasPermission = false;
      return false;
    }
  }

  /**
   * Check if health kit permission was previously granted
   */
  async hasStoredPermission() {
    const permission = await AsyncStorage.getItem(HEALTH_KIT_PERMISSION_KEY);
    return permission === 'true';
  }

  /**
   * Get daily steps for a specific date
   * @param {Date} date - The date to fetch steps for
   * @returns {Promise<number>} - Number of steps
   */
  async getDailySteps(date = new Date()) {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        console.warn('Health kit not initialized, returning 0 steps');
        return 0;
      }
    }

    try {
      if (Platform.OS === 'ios') {
        return await this.getAppleHealthSteps(date);
      } else if (Platform.OS === 'android') {
        return await this.getGoogleFitSteps(date);
      }
      return 0;
    } catch (error) {
      console.error('Error fetching daily steps:', error);
      return 0;
    }
  }

  /**
   * Get steps from Apple Health for a specific date
   */
  async getAppleHealthSteps(date) {
    if (!AppleHealthKit || typeof AppleHealthKit.getStepCount !== 'function') {
      return 0;
    }

    return new Promise((resolve) => {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const options = {
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString(),
        includeManuallyAdded: true,
      };

      AppleHealthKit.getStepCount(options, (error, results) => {
        if (error) {
          console.error('Error fetching Apple Health steps:', error);
          resolve(0);
        } else {
          const steps = results?.value || 0;
          resolve(steps);
        }
      });
    });
  }

  /**
   * Get steps from Google Fit for a specific date
   */
  async getGoogleFitSteps(date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const options = {
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString(),
      };

      const result = await GoogleFit.getDailyStepCountSamples(options);
      
      // Google Fit returns an array of sources, we want the aggregated one
      let steps = 0;
      if (result && result.length > 0) {
        // Find the source with the most steps (usually the aggregated one)
        for (const source of result) {
          if (source.steps && Array.isArray(source.steps)) {
            const dailySteps = source.steps.reduce((sum, step) => sum + (step.value || 0), 0);
            steps = Math.max(steps, dailySteps);
          }
        }
      }
      return steps;
    } catch (error) {
      console.error('Error fetching Google Fit steps:', error);
      return 0;
    }
  }

  /**
   * Get steps for the last N days
   * @param {number} days - Number of days to fetch (default 7)
   * @returns {Promise<Array>} - Array of {date, steps}
   */
  async getStepsForLastNDays(days = 7) {
    const stepsData = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const steps = await this.getDailySteps(date);
      
      stepsData.unshift({
        date: getLocalDateString(date),
        steps: steps,
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      });
    }

    return stepsData;
  }

  /**
   * Get steps data formatted for the calendar bar graph
   * @param {number} days - Number of days (default 7)
   * @returns {Promise<Object>} - Formatted data for StepsBarGraph
   */
  async getStepsDataForCalendar(days = 7) {
    const stepsArray = await this.getStepsForLastNDays(days);
    
    return {
      dailySteps: stepsArray,
      totalSteps: stepsArray.reduce((sum, day) => sum + day.steps, 0),
      averageSteps: Math.round(
        stepsArray.reduce((sum, day) => sum + day.steps, 0) / stepsArray.length
      ),
      highestDay: stepsArray.reduce((max, day) => 
        day.steps > max.steps ? day : max, 
        { steps: 0 }
      ),
      source: Platform.OS === 'ios' ? 'Apple Health' : 'Google Fit',
      lastSynced: new Date().toISOString(),
    };
  }

  /**
   * Request permission to access health data
   * Shows native permission dialog
   */
  async requestPermission() {
    return await this.initialize();
  }

  /**
   * Check if permission is granted
   */
  async checkPermission() {
    try {
      // Check stored permission first
      const storedPermission = await this.hasStoredPermission();
      if (storedPermission) {
        this.hasPermission = true;
        this.isInitialized = true;
        return true;
      }

      // For iOS, we can check if health data is available
      if (Platform.OS === 'ios') {
        // Check if AppleHealthKit is available at all
        if (!AppleHealthKit || typeof AppleHealthKit.isAvailable !== 'function') {
          return false;
        }

        return new Promise((resolve) => {
          AppleHealthKit.isAvailable((error, available) => {
            if (error) {
              resolve(false);
            } else {
              resolve(available);
            }
          });
        });
      }

      // For Android, check if Google Fit is connected
      if (Platform.OS === 'android') {
        try {
          if (!GoogleFit || typeof GoogleFit.checkIsAuthorized !== 'function') {
            return false;
          }
          const isAuthorized = await GoogleFit.checkIsAuthorized();
          return isAuthorized;
        } catch (error) {
          return false;
        }
      }

      return false;
    } catch (error) {
      console.error('Error in checkPermission:', error);
      return false;
    }
  }

  /**
   * Revoke health data access (for privacy settings)
   */
  async revokePermission() {
    try {
      await AsyncStorage.removeItem(HEALTH_KIT_PERMISSION_KEY);
      this.isInitialized = false;
      this.hasPermission = false;

      if (Platform.OS === 'android') {
        await GoogleFit.disconnect();
      }

      return true;
    } catch (error) {
      console.error('Error revoking permission:', error);
      return false;
    }
  }
}

// Export singleton instance
export default new HealthKitService();
