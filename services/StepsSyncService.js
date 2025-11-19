/**
 * StepsSyncService.js
 * Handles automatic background syncing of steps from HealthKit/Google Fit to the database
 * Provides non-blocking, efficient sync that won't break existing functionality
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HealthKitService from './HealthKitService';
import { supabase } from './supabase';
import { getLocalDateString } from '../utils/dateUtils';

const LAST_SYNC_KEY = '@steps_last_sync';
const SYNC_INTERVAL_MS = 3600000; // 1 hour in milliseconds
const MAX_DAYS_TO_SYNC = 7; // Only sync last 7 days to keep it fast

class StepsSyncService {
  constructor() {
    this.isSyncing = false;
    this.lastSyncTimestamp = null;
  }

  /**
   * Check if sync is needed based on last sync time
   * @returns {Promise<boolean>}
   */
  async shouldSync() {
    try {
      const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
      
      if (!lastSync) {
        return true; // Never synced before
      }

      const lastSyncTime = parseInt(lastSync, 10);
      const now = Date.now();
      
      // Sync if more than SYNC_INTERVAL_MS has passed
      return (now - lastSyncTime) > SYNC_INTERVAL_MS;
    } catch (error) {
      console.error('Error checking sync status:', error);
      return false;
    }
  }

  /**
   * Sync steps data from HealthKit/Google Fit to database
   * Non-blocking, silent sync that runs in background
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - Success status
   */
  async syncStepsInBackground(userId) {
    // Prevent concurrent syncs
    if (this.isSyncing) {
      return false;
    }

    // Check if sync is needed
    const needsSync = await this.shouldSync();
    if (!needsSync) {
      return false;
    }

    try {
      this.isSyncing = true;
      // Check if health permission is granted
      const hasPermission = await HealthKitService.checkPermission();
      if (!hasPermission) {
        return false;
      }

      // Fetch steps from health app (last 7 days for efficiency)
      const stepsArray = await HealthKitService.getStepsForLastNDays(MAX_DAYS_TO_SYNC);
      
      if (!stepsArray || stepsArray.length === 0) {
        return false;
      }

      // Get today's date for comparison
      const todayStr = getLocalDateString();

      // Sync to database (only non-zero step days to reduce database writes)
      const syncPromises = stepsArray
        .filter(dayData => dayData.steps > 0) // Only sync days with steps
        .map(async (dayData) => {
          try {
            const { error } = await supabase
              .from('daily_activity_tracking')
              .upsert({
                user_id: userId,
                tracking_date: dayData.date,
                steps_count: dayData.steps,
                data_source: Platform.OS === 'ios' ? 'Apple Health' : 'Google Fit',
                synced_at: new Date().toISOString()
              }, {
                onConflict: 'user_id,tracking_date',
                ignoreDuplicates: false
              });
            
            if (error) {
              console.warn(`⚠️ Failed to sync ${dayData.date}:`, error.message);
              return false;
            }
            
            // Only log today's sync to avoid spam
            if (dayData.date === todayStr) {
            }
            
            return true;
          } catch (err) {
            console.warn(`⚠️ Error syncing ${dayData.date}:`, err.message);
            return false;
          }
        });

      const results = await Promise.all(syncPromises);
      const successCount = results.filter(r => r === true).length;
      
      // Update last sync timestamp
      await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
      this.lastSyncTimestamp = Date.now();
      return true;

    } catch (error) {
      console.error('❌ Error during background steps sync:', error);
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Force sync steps immediately (for manual refresh)
   * @param {string} userId - User ID
   * @returns {Promise<boolean>}
   */
  async forceSyncNow(userId) {
    try {
      // Clear last sync to force immediate sync
      await AsyncStorage.removeItem(LAST_SYNC_KEY);
      return await this.syncStepsInBackground(userId);
    } catch (error) {
      console.error('Error forcing sync:', error);
      return false;
    }
  }

  /**
   * Get last sync time for display
   * @returns {Promise<Date|null>}
   */
  async getLastSyncTime() {
    try {
      const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
      return lastSync ? new Date(parseInt(lastSync, 10)) : null;
    } catch (error) {
      console.error('Error getting last sync time:', error);
      return null;
    }
  }

  /**
   * Clear sync history (for debugging/reset)
   */
  async clearSyncHistory() {
    try {
      await AsyncStorage.removeItem(LAST_SYNC_KEY);
      this.lastSyncTimestamp = null;
    } catch (error) {
      console.error('Error clearing sync history:', error);
    }
  }
}

// Export singleton instance
export default new StepsSyncService();
