/**
 * MockHealthKitService.js
 * Provides mock step data for iOS Simulator testing
 * Use this in simulator since Apple Health doesn't work there
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocalDateString } from '../utils/dateUtils';

const MOCK_PERMISSION_KEY = '@mock_healthkit_permission';

class MockHealthKitService {
  constructor() {
    this.isInitialized = false;
    this.hasPermission = false;
  }

  /**
   * Generate realistic mock step data
   */
  generateMockStepsData(days = 7) {
    const mockData = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      // Generate realistic step counts (varying by day of week)
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      // Weekend: 6k-9k steps, Weekday: 8k-13k steps
      const baseSteps = isWeekend ? 7000 : 10000;
      const variation = Math.random() * (isWeekend ? 3000 : 5000);
      const steps = Math.round(baseSteps + variation);
      
      mockData.push({
        date: getLocalDateString(date),
        steps: steps,
        day: date.toLocaleDateString('en-US', { weekday: 'short' })
      });
    }
    
    return mockData;
  }

  /**
   * Mock permission request (always grants)
   */
  async initialize() {
    this.isInitialized = true;
    this.hasPermission = true;
    await AsyncStorage.setItem(MOCK_PERMISSION_KEY, 'true');
    return true;
  }

  /**
   * Mock permission check
   */
  async checkPermission() {
    const stored = await AsyncStorage.getItem(MOCK_PERMISSION_KEY);
    return stored === 'true';
  }

  /**
   * Mock get daily steps
   */
  async getDailySteps(date) {
    const mockData = this.generateMockStepsData(1);
    return mockData[0].steps;
  }

  /**
   * Mock get steps for last N days
   */
  async getStepsForLastNDays(days = 7) {
    return this.generateMockStepsData(days);
  }

  /**
   * Mock get formatted data for calendar
   */
  async getStepsDataForCalendar(days = 7) {
    const stepsArray = this.generateMockStepsData(days);
    
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
      source: '🧪 Mock Data (Simulator)',
      lastSynced: new Date().toISOString(),
    };
  }

  /**
   * Mock request permission
   */
  async requestPermission() {
    return await this.initialize();
  }

  /**
   * Mock revoke permission
   */
  async revokePermission() {
    await AsyncStorage.removeItem(MOCK_PERMISSION_KEY);
    this.isInitialized = false;
    this.hasPermission = false;
    return true;
  }
}

// Export singleton instance
export default new MockHealthKitService();
