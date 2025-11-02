import { supabase } from './supabase';

/**
 * Weight Progress Service
 * Manages weight tracking with automatic projections based on calorie balance
 * - Actual weight measurements from user input
 * - Projected weight based on meals + workouts calorie balance
 * - Dynamic calorie calculations from actual exercise data
 */
export const WeightProgressService = {
  /**
   * Check and update weight progress unlock status for a user
   * Analyzes workouts, meals, and steps to determine if weight tracking is unlocked
   */
  async checkUnlockStatus(userId) {
    try {
      console.log('🔍 Checking unlock status for user:', userId);
      
      const { data, error } = await supabase.rpc('check_weight_progress_unlock', {
        p_user_id: userId
      });

      console.log('📊 RPC Response:', { data, error });

      if (error) throw error;

      if (!data || data.length === 0) {
        console.log('⚠️ No data returned from RPC function');
        return {
          isUnlocked: false,
          totalActivities: 0,
          workoutsCount: 0,
          mealsCount: 0,
          stepsDaysCount: 0,
          unlockProgress: 0,
          message: 'Start your journey by logging workouts, meals, or steps'
        };
      }

      const status = data[0];
      console.log('✅ Unlock Status:', status);

      return {
        isUnlocked: status.is_unlocked,
        totalActivities: status.total_activities,
        workoutsCount: status.workouts_count,
        mealsCount: status.meals_count,
        stepsDaysCount: status.steps_days_count,
        unlockProgress: status.unlock_progress,
        message: this.getStatusMessage(status)
      };
    } catch (error) {
      console.error('❌ Error checking weight progress unlock status:', error);
      throw error;
    }
  },

  /**
   * Get weight progress chart data with projections
   * Returns actual measurements + projected weights based on calorie balance
   */
  async getWeightProgressChart(userId, daysBack = 7) {
    try {
      console.log('📊 Fetching weight progress chart for user:', userId, 'days:', daysBack);

      const { data, error } = await supabase.rpc('get_weight_progress_chart', {
        p_user_id: userId,
        p_days_back: daysBack
      });

      console.log('📊 Weight progress response:', { data, error, count: data?.length || 0 });

      if (error) throw error;

      if (!data || data.length === 0) {
        console.log('⚠️ No weight progress data found');
        return {
          labels: [],
          values: [],
          actualMeasurements: [],
          projections: [],
          trend: 'stable',
          weightChange: 0,
          calorieBalance: 0
        };
      }

      console.log('✅ Weight progress data found:', data.length, 'days');

      // Transform data for chart
      const labels = data.map(d => {
        const date = new Date(d.measurement_date);
        return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
      });

      const values = data.map(d => parseFloat(d.weight_kg));
      const actualMeasurements = data.filter(d => d.is_actual).map(d => ({
        date: d.measurement_date,
        weight: parseFloat(d.weight_kg)
      }));
      const projections = data.filter(d => d.is_projected).map(d => ({
        date: d.measurement_date,
        weight: parseFloat(d.weight_kg)
      }));

      // Calculate trend
      const startWeight = values[0];
      const endWeight = values[values.length - 1];
      const weightChange = endWeight - startWeight;
      const trend = weightChange < -0.5 ? "decreasing" : 
                    weightChange > 0.5 ? "increasing" : "stable";

      // Get latest calorie balance
      const latestBalance = data[data.length - 1]?.calorie_balance || 0;

      return {
        labels,
        values,
        actualMeasurements,
        projections,
        trend,
        weightChange: parseFloat(weightChange.toFixed(2)),
        calorieBalance: latestBalance,
        startWeight: parseFloat(startWeight.toFixed(2)),
        currentWeight: parseFloat(endWeight.toFixed(2))
      };
    } catch (error) {
      console.error('❌ Error fetching weight progress chart:', error);
      throw error;
    }
  },

  /**
   * Get daily calorie balance for a specific date
   */
  async getDailyCalorieBalance(userId, date = null) {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];

      const { data, error } = await supabase.rpc('calculate_daily_calorie_balance', {
        p_user_id: userId,
        p_date: targetDate
      });

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          date: targetDate,
          caloriesConsumed: 0,
          caloriesBurned: 0,
          netCalories: 0,
          calorieGoal: 2000,
          deficit: 2000,
          isDeficit: true
        };
      }

      const balance = data[0];
      const deficit = balance.calorie_goal - balance.net_calories;

      return {
        date: balance.date,
        caloriesConsumed: balance.calories_consumed,
        caloriesBurned: balance.calories_burned,
        netCalories: balance.net_calories,
        calorieGoal: balance.calorie_goal,
        deficit,
        isDeficit: deficit > 0
      };
    } catch (error) {
      console.error('❌ Error fetching daily calorie balance:', error);
      throw error;
    }
  },

  /**
   * Get current weight progress tracking data for a user
   */
  async getTrackingData(userId) {
    try {
      const { data, error } = await supabase
        .from('weight_progress_tracking')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No tracking data yet, return defaults
          return {
            isUnlocked: false,
            totalActivities: 0,
            workoutsCount: 0,
            mealsCount: 0,
            stepsDaysCount: 0,
            unlockedAt: null
          };
        }
        throw error;
      }

      return {
        isUnlocked: data.is_unlocked,
        totalActivities: data.total_activities,
        workoutsCount: data.workouts_count,
        mealsCount: data.meals_count,
        stepsDaysCount: data.steps_days_count,
        unlockedAt: data.unlocked_at
      };
    } catch (error) {
      console.error('❌ Error fetching weight progress tracking data:', error);
      throw error;
    }
  },

  /**
   * Get activity breakdown for display
   */
  getActivityBreakdown(trackingData) {
    const activities = [];
    
    if (trackingData.workoutsCount > 0) {
      activities.push({
        type: 'workout',
        icon: '💪',
        label: 'Workouts',
        count: trackingData.workoutsCount,
        color: '#FF6B35'
      });
    }

    if (trackingData.mealsCount > 0) {
      activities.push({
        type: 'meal',
        icon: '🍽️',
        label: 'Meals',
        count: trackingData.mealsCount,
        color: '#00D4AA'
      });
    }

    if (trackingData.stepsDaysCount > 0) {
      activities.push({
        type: 'steps',
        icon: '👟',
        label: 'Active Days',
        count: trackingData.stepsDaysCount,
        color: '#34C759'
      });
    }

    return activities;
  },

  /**
   * Generate status message based on unlock status
   */
  getStatusMessage(status) {
    if (status.is_unlocked) {
      const activities = [];
      if (status.workouts_count > 0) activities.push(`${status.workouts_count} workout${status.workouts_count > 1 ? 's' : ''}`);
      if (status.meals_count > 0) activities.push(`${status.meals_count} meal day${status.meals_count > 1 ? 's' : ''}`);
      if (status.steps_days_count > 0) activities.push(`${status.steps_days_count} active day${status.steps_days_count > 1 ? 's' : ''}`);
      
      return `Great job! You've logged ${activities.join(', ')}`;
    }

    return 'Start your journey by logging your first activity';
  },

  /**
   * Check if user should see weight progress unlock celebration
   */
  async shouldShowUnlockCelebration(userId) {
    try {
      const { data, error } = await supabase
        .from('weight_progress_tracking')
        .select('unlocked_at')
        .eq('user_id', userId)
        .single();

      if (error || !data) return false;

      // Show celebration if unlocked within last 24 hours
      if (data.unlocked_at) {
        const unlockedTime = new Date(data.unlocked_at);
        const now = new Date();
        const hoursSinceUnlock = (now - unlockedTime) / (1000 * 60 * 60);
        return hoursSinceUnlock < 24;
      }

      return false;
    } catch (error) {
      console.error('❌ Error checking unlock celebration status:', error);
      return false;
    }
  }
};
