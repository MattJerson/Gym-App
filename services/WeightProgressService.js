import { supabase } from './supabase';

/**
 * Weight Progress Service
 * Manages AUTOMATIC weight tracking based on calorie balance
 * 
 * HOW IT WORKS:
 * 1. Initial weight from registration → First entry in weight_tracking
 * 2. Daily calorie balance = (meals consumed - workouts burned) - maintenance
 * 3. Weight change formula: 7700 calories surplus/deficit = 1 kg gain/loss
 * 4. NO meal logs for a day = assume maintenance (no weight change)
 * 5. Meal surplus = weight gain
 * 6. Meal deficit + workouts = weight loss
 * 
 * USER EXPERIENCE:
 * - User registers with initial weight
 * - System automatically projects weight based on logged meals/workouts
 * - Only updates when user logs meals (incentivizes tracking)
 * - Weight progress shown automatically without manual weight entry
 */
export const WeightProgressService = {
  /**
   * Check and update weight progress unlock status for a user
   * Analyzes workouts, meals, and steps to determine if weight tracking is unlocked
   */
  async checkUnlockStatus(userId) {
    try {
      const { data, error } = await supabase.rpc('check_weight_progress_unlock', {
        p_user_id: userId
      });
      if (error) throw error;

      if (!data || data.length === 0) {
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
   * Integrates workout calories burned + meal calories consumed
   */
  async getWeightProgressChart(userId, daysBack = 7) {
    try {
      const { data, error } = await supabase.rpc('get_weight_progress_chart', {
        p_user_id: userId,
        p_days_back: daysBack
      });
      if (error) {
        console.error('❌ RPC error in get_weight_progress_chart:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ No weight progress data found');
        console.warn('⚠️ Possible reasons:');
        console.warn('   1. No weight_tracking entries for this user');
        console.warn('   2. RLS policies blocking access');
        console.warn('   3. Function returned empty result');
        console.warn('   4. User has no initial weight in registration_profiles');
        return {
          labels: [],
          values: [],
          actualMeasurements: [],
          projections: [],
          calorieData: [],
          trend: 'stable',
          weightChange: 0,
          avgCalorieBalance: 0,
          totalCaloriesConsumed: 0,
          totalCaloriesBurned: 0
        };
      }
      // Transform data for chart
      const labels = data.map(d => {
        const date = new Date(d.measurement_date);
        return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
      });

      const values = data.map(d => parseFloat(d.weight_kg));
      const actualMeasurements = data.filter(d => d.is_actual).map(d => ({
        date: d.measurement_date,
        weight: parseFloat(d.weight_kg),
        calorieBalance: parseFloat(d.calorie_balance || 0),
        caloriesConsumed: parseFloat(d.calories_consumed || 0),
        caloriesBurned: parseFloat(d.calories_burned || 0)
      }));
      
      const projections = data.filter(d => d.is_projected).map(d => ({
        date: d.measurement_date,
        weight: parseFloat(d.weight_kg),
        calorieBalance: parseFloat(d.calorie_balance || 0),
        caloriesConsumed: parseFloat(d.calories_consumed || 0),
        caloriesBurned: parseFloat(d.calories_burned || 0)
      }));
      // Calorie data for each day
      const calorieData = data.map(d => ({
        date: d.measurement_date,
        consumed: parseFloat(d.calories_consumed || 0),
        burned: parseFloat(d.calories_burned || 0),
        net: parseFloat(d.calorie_balance || 0)
      }));

      // Calculate trend
      const startWeight = values[0];
      const endWeight = values[values.length - 1];
      const weightChange = endWeight - startWeight;
      const trend = weightChange < -0.5 ? "decreasing" : 
                    weightChange > 0.5 ? "increasing" : "stable";

      // Calculate calorie statistics
      const avgCalorieBalance = calorieData.reduce((sum, d) => sum + d.net, 0) / calorieData.length;
      const totalCaloriesConsumed = calorieData.reduce((sum, d) => sum + d.consumed, 0);
      const totalCaloriesBurned = calorieData.reduce((sum, d) => sum + d.burned, 0);
      const result = {
        labels,
        values,
        actualMeasurements,
        projections,
        calorieData,
        trend,
        weightChange: parseFloat(weightChange.toFixed(2)),
        avgCalorieBalance: parseFloat(avgCalorieBalance.toFixed(0)),
        totalCaloriesConsumed: parseFloat(totalCaloriesConsumed.toFixed(0)),
        totalCaloriesBurned: parseFloat(totalCaloriesBurned.toFixed(0)),
        startWeight: parseFloat(startWeight.toFixed(2)),
        currentWeight: parseFloat(endWeight.toFixed(2))
      };
      return result;
    } catch (error) {
      console.error('❌ Error fetching weight progress chart:', error);
      console.error('❌ Error stack:', error.stack);
      throw error;
    }
  },

  /**
   * Get projected weight for today based on calorie balance
   * Shows automatic weight tracking in action
   */
  async getProjectedWeightToday(userId) {
    try {
      const { data, error } = await supabase.rpc('calculate_projected_weight', {
        p_user_id: userId,
        p_target_date: new Date().toISOString().split('T')[0]
      });

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          hasInitialWeight: false,
          message: 'No initial weight found. Weight will be set from registration.'
        };
      }

      const projection = data[0];
      
      return {
        hasInitialWeight: true,
        projectedWeight: parseFloat(projection.projected_weight),
        lastActualWeight: parseFloat(projection.last_actual_weight),
        lastWeightDate: projection.last_weight_date,
        daysSinceMeasurement: projection.days_since_measurement,
        cumulativeCalorieBalance: parseFloat(projection.cumulative_calorie_balance),
        expectedWeightChange: parseFloat(projection.expected_weight_change),
        message: this.getProjectionMessage(projection)
      };
    } catch (error) {
      console.error('❌ Error getting projected weight:', error);
      throw error;
    }
  },

  /**
   * Generate user-friendly message for weight projection
   */
  getProjectionMessage(projection) {
    const days = projection.days_since_measurement;
    const change = parseFloat(projection.expected_weight_change);
    
    if (days === 0) {
      return 'Weight measured today';
    }
    
    if (Math.abs(change) < 0.1) {
      return `Maintaining weight (${days} ${days === 1 ? 'day' : 'days'} since last measurement)`;
    }
    
    if (change < 0) {
      return `Projected ${Math.abs(change).toFixed(1)}kg loss based on ${days} ${days === 1 ? 'day' : 'days'} of tracking`;
    }
    
    return `Projected ${change.toFixed(1)}kg gain based on ${days} ${days === 1 ? 'day' : 'days'} of tracking`;
  },

  /**
   * Get daily calorie balance for a specific date
   * Combines workout calories burned + meal calories consumed
   */
  async getDailyCalorieBalance(userId, date = null) {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const { data, error } = await supabase.rpc('calculate_daily_calorie_balance', {
        p_user_id: userId,
        p_date: targetDate
      });

      if (error) {
        console.error('❌ Error in calculate_daily_calorie_balance RPC:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return {
          date: targetDate,
          caloriesConsumed: 0,
          caloriesBurned: 0,
          netCalories: 0,
          proteinConsumed: 0,
          carbsConsumed: 0,
          fatsConsumed: 0,
          mealsLogged: 0,
          workoutsCompleted: 0,
          workoutMinutes: 0,
          calorieGoal: 2000,
          proteinGoal: 140,
          carbsGoal: 200,
          fatsGoal: 85,
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
        proteinConsumed: balance.protein_consumed,
        carbsConsumed: balance.carbs_consumed,
        fatsConsumed: balance.fats_consumed,
        mealsLogged: balance.meals_logged,
        workoutsCompleted: balance.workouts_completed,
        workoutMinutes: balance.workout_minutes,
        calorieGoal: balance.calorie_goal,
        proteinGoal: balance.protein_goal,
        carbsGoal: balance.carbs_goal,
        fatsGoal: balance.fats_goal,
        deficit,
        isDeficit: deficit > 0
      };
    } catch (error) {
      console.error('❌ Error fetching daily calorie balance:', error);
      throw error;
    }
  },

  /**
   * Get calorie summary from database (cached version)
   */
  async getDailyCalorieSummary(userId, date = null) {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('daily_calorie_summary')
        .select('*')
        .eq('user_id', userId)
        .eq('summary_date', targetDate)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // No cached summary, calculate on the fly
        return await this.getDailyCalorieBalance(userId, date);
      }

      return {
        date: data.summary_date,
        caloriesConsumed: parseFloat(data.calories_consumed || 0),
        caloriesBurned: parseFloat(data.calories_burned || 0),
        netCalories: parseFloat(data.net_calories || 0),
        proteinConsumed: parseFloat(data.protein_consumed || 0),
        carbsConsumed: parseFloat(data.carbs_consumed || 0),
        fatsConsumed: parseFloat(data.fats_consumed || 0),
        mealsLogged: data.meals_logged || 0,
        workoutsCompleted: data.workouts_completed || 0,
        workoutMinutes: data.total_workout_minutes || 0,
        calorieGoal: data.calorie_goal || 2000,
        proteinGoal: data.protein_goal || 140,
        carbsGoal: data.carbs_goal || 200,
        fatsGoal: data.fats_goal || 85,
        deficit: (data.calorie_goal || 2000) - parseFloat(data.net_calories || 0),
        isDeficit: parseFloat(data.net_calories || 0) < (data.calorie_goal || 2000)
      };
    } catch (error) {
      console.error('❌ Error fetching daily calorie summary:', error);
      throw error;
    }
  },

  /**
   * Get calorie summaries for a date range
   */
  async getCalorieSummaryRange(userId, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('daily_calorie_summary')
        .select('*')
        .eq('user_id', userId)
        .gte('summary_date', startDate)
        .lte('summary_date', endDate)
        .order('summary_date', { ascending: true });

      if (error) throw error;

      return (data || []).map(d => ({
        date: d.summary_date,
        caloriesConsumed: parseFloat(d.calories_consumed || 0),
        caloriesBurned: parseFloat(d.calories_burned || 0),
        netCalories: parseFloat(d.net_calories || 0),
        mealsLogged: d.meals_logged || 0,
        workoutsCompleted: d.workouts_completed || 0,
        calorieGoal: d.calorie_goal || 2000
      }));
    } catch (error) {
      console.error('❌ Error fetching calorie summary range:', error);
      throw error;
    }
  },

  /**
   * Get weight measurements only (optimized for large date ranges)
   * Use this for long-term progress views (months/years)
   */
  async getWeightMeasurementsOnly(userId, startDate = null, endDate = null, limit = 1000) {
    try {
      const { data, error } = await supabase.rpc('get_weight_measurements_only', {
        p_user_id: userId,
        p_start_date: startDate,
        p_end_date: endDate || new Date().toISOString().split('T')[0],
        p_limit: limit
      });

      if (error) throw error;

      return (data || []).map(d => ({
        date: d.measurement_date,
        weight: parseFloat(d.weight_kg),
        bodyFat: d.body_fat_percentage ? parseFloat(d.body_fat_percentage) : null,
        muscleMass: d.muscle_mass_kg ? parseFloat(d.muscle_mass_kg) : null
      }));
    } catch (error) {
      console.error('❌ Error fetching weight measurements:', error);
      throw error;
    }
  },

  /**
   * Get aggregated calorie data for long-term views
   * @param interval - 'day', 'week', or 'month'
   */
  async getAggregatedCalorieData(userId, startDate, endDate, interval = 'week') {
    try {
      const { data, error } = await supabase.rpc('get_aggregated_calorie_data', {
        p_user_id: userId,
        p_start_date: startDate,
        p_end_date: endDate,
        p_interval: interval
      });

      if (error) throw error;

      return (data || []).map(d => ({
        periodStart: d.period_start,
        periodEnd: d.period_end,
        avgCaloriesConsumed: parseFloat(d.avg_calories_consumed || 0),
        avgCaloriesBurned: parseFloat(d.avg_calories_burned || 0),
        avgNetCalories: parseFloat(d.avg_net_calories || 0),
        totalMealsLogged: d.total_meals_logged || 0,
        totalWorkoutsCompleted: d.total_workouts_completed || 0,
        daysWithData: d.days_with_data || 0
      }));
    } catch (error) {
      console.error('❌ Error fetching aggregated calorie data:', error);
      throw error;
    }
  },

  /**
   * Get comprehensive weight progress statistics
   * Perfect for overview cards and summary displays
   */
  async getWeightProgressStats(userId, startDate = null, endDate = null) {
    try {
      const { data, error } = await supabase.rpc('get_weight_progress_stats', {
        p_user_id: userId,
        p_start_date: startDate,
        p_end_date: endDate || new Date().toISOString().split('T')[0]
      });

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          totalMeasurements: 0,
          firstWeight: 0,
          latestWeight: 0,
          totalChange: 0,
          avgWeeklyChange: 0,
          minWeight: 0,
          maxWeight: 0,
          daysTracked: 0,
          avgCalorieDeficit: 0
        };
      }

      const stats = data[0];
      return {
        totalMeasurements: stats.total_measurements || 0,
        firstWeight: parseFloat(stats.first_weight || 0),
        latestWeight: parseFloat(stats.latest_weight || 0),
        totalChange: parseFloat(stats.total_change || 0),
        avgWeeklyChange: parseFloat(stats.avg_weekly_change || 0),
        minWeight: parseFloat(stats.min_weight || 0),
        maxWeight: parseFloat(stats.max_weight || 0),
        daysTracked: stats.days_tracked || 0,
        avgCalorieDeficit: parseFloat(stats.avg_calorie_deficit || 0)
      };
    } catch (error) {
      console.error('❌ Error fetching weight progress stats:', error);
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
