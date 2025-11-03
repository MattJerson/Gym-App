/**
 * CalorieCalculator
 * Calculates estimated calories burned for workouts based on MET values
 * Formula: Calories = MET × weight_kg × duration_hours
 */

import { supabase } from './supabase';

export const CalorieCalculator = {
  /**
   * Calculate calories burned for a single exercise
   * @param {number} metValue - MET value of the exercise
   * @param {number} weightKg - User's weight in kilograms
   * @param {number} sets - Number of sets
   * @param {number} restTimeSeconds - Rest time between sets in seconds
   * @param {number} estimatedSetDuration - Estimated duration per set in minutes (default: 1.5)
   * @returns {number} Estimated calories burned
   */
  calculateExerciseCalories(metValue, weightKg, sets, restTimeSeconds = 60, estimatedSetDuration = 1.5) {
    if (!metValue || !weightKg || !sets) return 0;

    // Calculate total time for this exercise
    // Time = (sets × estimatedSetDuration) + ((sets - 1) × restTime)
    const workingTimeMinutes = sets * estimatedSetDuration;
    const restTimeMinutes = ((sets - 1) * restTimeSeconds) / 60;
    const totalTimeMinutes = workingTimeMinutes + restTimeMinutes;
    const totalTimeHours = totalTimeMinutes / 60;

    // Calories = MET × weight (kg) × time (hours)
    const calories = metValue * weightKg * totalTimeHours;

    return Math.round(calories);
  },

  /**
   * Calculate total calories for a workout template
   * @param {Array} exercises - Array of exercise objects with met_value, sets, restTime
   * @param {number} weightKg - User's weight in kilograms
   * @returns {number} Total estimated calories burned for the entire workout
   */
  calculateWorkoutCalories(exercises, weightKg) {
    if (!exercises || exercises.length === 0 || !weightKg) return 0;

    let totalCalories = 0;

    exercises.forEach((exercise) => {
      const metValue = exercise.met_value || 6.0; // Default to 6.0 if not provided
      const sets = exercise.sets || 3;
      const restTime = parseInt(exercise.restTime) || 60;

      const exerciseCalories = this.calculateExerciseCalories(
        metValue,
        weightKg,
        sets,
        restTime
      );

      totalCalories += exerciseCalories;
    });

    return Math.round(totalCalories);
  },

  /**
   * Fetch user's weight from database
   * @param {string} userId - User's ID
   * @returns {Promise<number|null>} User's weight in kg or null if not found
   */
  async getUserWeight(userId) {
    try {
      const { data, error } = await supabase
        .from('registration_profiles')
        .select('weight_kg')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user weight:', error);
        return null;
      }

      return data?.weight_kg || null;
    } catch (error) {
      console.error('Error in getUserWeight:', error);
      return null;
    }
  },

  /**
   * Calculate workout calories with automatic user weight lookup
   * @param {Array} exercises - Array of exercise objects
   * @param {string} userId - User's ID
   * @returns {Promise<number>} Estimated calories burned
   */
  async calculateWorkoutCaloriesForUser(exercises, userId) {
    const weightKg = await this.getUserWeight(userId);
    
    if (!weightKg) {
      console.warn('Unable to fetch user weight. Using default 70kg for calorie calculation.');
      return this.calculateWorkoutCalories(exercises, 70); // Default weight fallback
    }

    return this.calculateWorkoutCalories(exercises, weightKg);
  },

  /**
   * Calculate estimated workout duration in minutes
   * @param {Array} exercises - Array of exercise objects with sets and restTime
   * @returns {number} Total estimated duration in minutes
   */
  calculateWorkoutDuration(exercises) {
    if (!exercises || exercises.length === 0) return 0;

    let totalMinutes = 0;

    exercises.forEach((exercise) => {
      const sets = exercise.sets || 3;
      const restTime = parseInt(exercise.restTime) || 60;
      const estimatedSetDuration = 1.5; // 1.5 minutes per set (average)

      // Working time + rest time
      const workingTime = sets * estimatedSetDuration;
      const restTimeTotal = ((sets - 1) * restTime) / 60;
      
      totalMinutes += workingTime + restTimeTotal;
    });

    return Math.round(totalMinutes);
  }
};
