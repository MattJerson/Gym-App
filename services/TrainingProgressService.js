import { supabase } from './supabase';

/**
 * Training Data Service
 * Handles workout tracking, progress, and statistics
 */
export const TrainingProgressService = {
  /**
   * Get today's workout and steps progress for WorkoutProgressBar
   */
  async getTodayProgress(userId, date = new Date()) {
    try {
      const dateStr = date.toISOString().split('T')[0];

      // Fetch daily activity tracking
      const { data, error } = await supabase
        .from('daily_activity_tracking')
        .select('*')
        .eq('user_id', userId)
        .eq('tracking_date', dateStr)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No tracking for today yet, return defaults from user goals
          return await this.getDefaultProgress(userId);
        }
        throw error;
      }

      return {
        workoutData: {
          value: data.workouts_completed || 0,
          max: data.workouts_goal || 1,
        },
        stepsData: {
          value: data.steps_count || 0,
          max: data.steps_goal || 10000,
        },
        caloriesData: {
          value: data.total_calories_burned || 0,
          max: data.calories_goal || 500,
        },
        totalProgress: Math.round(data.overall_progress || 0),
      };
    } catch (error) {
      console.error('❌ Error fetching today progress:', error);
      return await this.getDefaultProgress(userId);
    }
  },

  /**
   * Get default progress from user goals when no tracking exists yet
   */
  async getDefaultProgress(userId) {
    try {
      const { data, error } = await supabase
        .from('user_daily_goals')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // Return system defaults if no user goals
        return {
          workoutData: { value: 0, max: 1 },
          stepsData: { value: 0, max: 10000 },
          totalProgress: 0,
        };
      }

      return {
        workoutData: { value: 0, max: data.workouts_goal || 1 },
        stepsData: { value: 0, max: data.steps_goal || 10000 },
        caloriesData: { value: 0, max: data.calories_burn_goal || 500 },
        totalProgress: 0,
      };
    } catch (error) {
      console.error('❌ Error fetching default progress:', error);
      return {
        workoutData: { value: 0, max: 1 },
        stepsData: { value: 0, max: 10000 },
        caloriesData: { value: 0, max: 500 },
        totalProgress: 0,
      };
    }
  },

  /**
   * Log a completed workout
   */
  async logWorkout(userId, workoutData) {
    try {
      const { data, error } = await supabase
        .from('workout_logs')
        .insert([{
          user_id: userId,
          workout_name: workoutData.name,
          workout_type: workoutData.type,
          workout_category_id: workoutData.categoryId || null,
          workout_template_id: workoutData.templateId || null,
          duration_minutes: workoutData.duration,
          calories_burned: workoutData.calories || 0,
          exercises_count: workoutData.exercisesCount || 0,
          total_sets: workoutData.totalSets || 0,
          total_reps: workoutData.totalReps || 0,
          total_volume_kg: workoutData.totalVolume || 0,
          intensity_level: workoutData.intensity || 'moderate',
          status: 'completed',
          notes: workoutData.notes || null,
          completed_at: new Date(),
        }])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Workout logged successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error logging workout:', error);
      throw error;
    }
  },

  /**
   * Update steps count for today
   */
  async updateSteps(userId, steps, date = new Date()) {
    try {
      const dateStr = date.toISOString().split('T')[0];

      const { error } = await supabase
        .rpc('update_steps_tracking', {
          p_user_id: userId,
          p_steps: steps,
          p_tracking_date: dateStr,
        });

      if (error) throw error;

      console.log('✅ Steps updated successfully:', steps);
      return true;
    } catch (error) {
      console.error('❌ Error updating steps:', error);
      throw error;
    }
  },

  /**
   * Get workout history for a date range
   */
  async getWorkoutHistory(userId, startDate, endDate, limit = 10) {
    try {
      let query = supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (startDate) {
        query = query.gte('completed_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('completed_at', endDate.toISOString());
      }
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('❌ Error fetching workout history:', error);
      return [];
    }
  },

  /**
   * Get weekly workout stats
   */
  async getWeeklyStats(userId) {
    try {
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);

      const workouts = await this.getWorkoutHistory(userId, weekAgo, today, 50);

      const stats = {
        totalWorkouts: workouts.length,
        totalMinutes: workouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0),
        totalCalories: workouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0),
        totalVolume: workouts.reduce((sum, w) => sum + (w.total_volume_kg || 0), 0),
        workoutTypes: {},
        avgDuration: 0,
        avgCalories: 0,
      };

      // Calculate averages
      if (stats.totalWorkouts > 0) {
        stats.avgDuration = Math.round(stats.totalMinutes / stats.totalWorkouts);
        stats.avgCalories = Math.round(stats.totalCalories / stats.totalWorkouts);
      }

      // Count by workout type
      workouts.forEach(w => {
        const type = w.workout_type || 'other';
        stats.workoutTypes[type] = (stats.workoutTypes[type] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('❌ Error fetching weekly stats:', error);
      return {
        totalWorkouts: 0,
        totalMinutes: 0,
        totalCalories: 0,
        totalVolume: 0,
        workoutTypes: {},
        avgDuration: 0,
        avgCalories: 0,
      };
    }
  },

  /**
   * Set or update user's daily goals
   */
  async updateDailyGoals(userId, goals) {
    try {
      const { data, error } = await supabase
        .from('user_daily_goals')
        .upsert({
          user_id: userId,
          steps_goal: goals.stepsGoal || 10000,
          workouts_goal: goals.workoutsGoal || 1,
          calories_burn_goal: goals.caloriesBurnGoal || 500,
          active_minutes_goal: goals.activeMinutesGoal || 30,
          water_intake_goal: goals.waterIntakeGoal || 8,
          calories_intake_goal: goals.caloriesIntakeGoal || 2000,
          protein_goal: goals.proteinGoal || 150,
          goal_type: goals.goalType || 'balanced',
          difficulty_level: goals.difficultyLevel || 'moderate',
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Daily goals updated successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error updating daily goals:', error);
      throw error;
    }
  },

  /**
   * Get user's current goals
   */
  async getUserGoals(userId) {
    try {
      const { data, error } = await supabase
        .from('user_daily_goals')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No goals set, return defaults
          return {
            steps_goal: 10000,
            workouts_goal: 1,
            calories_burn_goal: 500,
            active_minutes_goal: 30,
            water_intake_goal: 8,
            calories_intake_goal: 2000,
            protein_goal: 150,
            goal_type: 'balanced',
            difficulty_level: 'moderate',
          };
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ Error fetching user goals:', error);
      return null;
    }
  },
};
