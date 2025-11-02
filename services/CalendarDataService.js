import { supabase } from './supabase';

// 🔄 Calendar Data Service - Supabase Implementation
export const CalendarDataService = {
  // User & Notifications
  async fetchUserNotifications(userId) {
    try {
      // For now, return static data - you can implement real notifications later
      return {
        count: 3,
        messages: [
          { id: 1, title: "Workout Reminder", message: "Time for your evening workout!", type: "reminder" },
          { id: 2, title: "Goal Achieved", message: "You've hit your weekly step goal!", type: "achievement" },
          { id: 3, title: "New Feature", message: "Check out our new progress tracking!", type: "feature" }
        ]
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { count: 0, messages: [] };
    }
  },

  // Workout Data Management
  async fetchWorkoutCalendar(userId, startDate, endDate) {
    try {
      const { data, error } = await supabase.rpc('get_workout_logs', {
        p_user_id: userId,
        p_start_date: startDate,
        p_end_date: endDate
      });

      if (error) throw error;

      // Transform array of workouts into date-keyed object
      const workoutMap = {};
      if (data) {
        data.forEach(workout => {
          const dateKey = workout.log_date;
          workoutMap[dateKey] = workout.workout_data;
        });
      }

      return workoutMap;
    } catch (error) {
      console.error('Error fetching workout calendar:', error);
      return {};
    }
  },

  async createWorkout(userId, workoutData) {
    try {
      const { data, error } = await supabase
        .from('workout_logs')
        .insert([{
          user_id: userId,
          log_date: workoutData.date,
          workout_type: workoutData.type,
          status: 'completed',
          duration_minutes: workoutData.duration || 0,
          notes: workoutData.note,
          is_part_of_streak: workoutData.streak !== false,
        }])
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        type: data.workout_type,
        completed: data.status === 'completed',
        streak: data.is_part_of_streak,
        note: data.notes,
        duration: data.duration_minutes,
        date: data.log_date,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('Error creating workout:', error);
      throw error;
    }
  },

  async updateWorkout(userId, workoutId, updates) {
    try {
      const { data, error } = await supabase
        .from('workout_logs')
        .update(updates)
        .eq('id', workoutId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        ...updates,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error updating workout:', error);
      throw error;
    }
  },

  async deleteWorkout(userId, workoutId) {
    try {
      const { error } = await supabase
        .from('workout_logs')
        .delete()
        .eq('id', workoutId)
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true, deletedId: workoutId };
    } catch (error) {
      console.error('Error deleting workout:', error);
      throw error;
    }
  },

  // Recent Activities
  async fetchRecentActivities(userId, limit = 4) {
    try {
      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('log_date', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Transform to expected format
      return (data || []).map(workout => ({
        id: workout.id,
        label: this.getWorkoutLabel(workout),
        duration: workout.duration_minutes ? `${workout.duration_minutes} min` : 'N/A',
        icon: this.getWorkoutIcon(workout.workout_type),
        color: this.getWorkoutColors(workout.workout_type),
        calories: workout.calories_burned,
        distance: workout.distance_km,
        date: workout.log_date,
        type: workout.workout_type,
        exercises: workout.exercises?.length || 0,
      }));
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  },

  getWorkoutLabel(workout) {
    const labels = {
      'strength': 'Strength Training',
      'cardio': 'Cardio Workout',
      'yoga': 'Yoga Session',
      'rest': 'Rest Day',
      'hiit': 'HIIT Workout',
      'functional': 'Functional Training'
    };
    return workout.notes || labels[workout.workout_type] || 'Workout';
  },

  getWorkoutIcon(type) {
    const icons = {
      'strength': 'barbell',
      'cardio': 'walk',
      'yoga': 'body',
      'rest': 'bed',
      'hiit': 'flash',
      'functional': 'fitness'
    };
    return icons[type] || 'fitness';
  },

  getWorkoutColors(type) {
    const colors = {
      'strength': ["#1E3A5F", "#2E5A8F"],
      'cardio': ["#FF5722", "#FF9800"],
      'yoga': ["#9C27B0", "#E1BEE7"],
      'rest': ["#607D8B", "#90A4AE"],
      'hiit': ["#F44336", "#FF5252"],
      'functional': ["#4CAF50", "#8BC34A"]
    };
    return colors[type] || ["#1E3A5F", "#2E5A8F"];
  },

  // Progress Data
  async fetchProgressChart(userId, metric = "weight", period = "week") {
    try {
      const daysBack = period === "week" ? 7 : 30;
      
      console.log('📊 Fetching weight progress (with projections) for user:', userId, 'period:', period);
      
      // Use new projection system
      const { WeightProgressService } = require('./WeightProgressService');
      const progressData = await WeightProgressService.getWeightProgressChart(userId, daysBack);

      console.log('📊 Weight progress data:', { 
        labelsCount: progressData.labels.length,
        valuesCount: progressData.values.length,
        actualCount: progressData.actualMeasurements.length,
        projectionsCount: progressData.projections.length,
        trend: progressData.trend
      });

      if (!progressData.values || progressData.values.length === 0) {
        console.log('⚠️ No weight data found - returning empty chart');
        return {
          title: "Weight Progress",
          labels: [],
          values: [],
          actualMeasurements: [],
          projections: [],
          color: (opacity = 1) => `rgba(10, 132, 255, ${opacity})`,
          unit: "kg",
          goal: 70,
          trend: "stable",
          weightChange: 0,
          calorieBalance: 0
        };
      }

      console.log('✅ Weight data found:', progressData.values.length, 'measurements');

      // Get user's weight goal
      const { data: goalData } = await supabase
        .from('user_goals')
        .select('target_value')
        .eq('user_id', userId)
        .eq('goal_type', 'weight')
        .eq('status', 'active')
        .limit(1)
        .single();

      return {
        title: "Weight Progress",
        labels: progressData.labels,
        values: progressData.values,
        actualMeasurements: progressData.actualMeasurements,
        projections: progressData.projections,
        color: (opacity = 1) => `rgba(10, 132, 255, ${opacity})`,
        unit: "kg",
        goal: goalData?.target_value || 70,
        trend: progressData.trend,
        weightChange: progressData.weightChange,
        calorieBalance: progressData.calorieBalance,
        startWeight: progressData.startWeight,
        currentWeight: progressData.currentWeight
      };
    } catch (error) {
      console.error('Error fetching progress chart:', error);
      return {
        title: "Weight Progress",
        labels: [],
        values: [],
        actualMeasurements: [],
        projections: [],
        color: (opacity = 1) => `rgba(10, 132, 255, ${opacity})`,
        unit: "kg",
        goal: 70,
        trend: "stable",
        weightChange: 0,
        calorieBalance: 0
      };
    }
  },

  async fetchStepsData(userId, period = "month") {
    try {
      const daysBack = 31;
      
      const { data, error } = await supabase.rpc('get_steps_data', {
        p_user_id: userId,
        p_days_back: daysBack
      });

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          dates: [],
          values: [],
          goal: 10000,
          average: 0,
          totalDays: 0,
          goalsAchieved: 0
        };
      }

      // Aggregate results (the function returns one row per date)
      const dates = [];
      const values = [];
      let goal = 10000;
      let average = 0;
      let totalDays = 0;
      let goalsAchieved = 0;

      data.forEach((row, index) => {
        if (index === 0) {
          // Get aggregate values from first row
          goal = row.goal || 10000;
          average = row.average || 0;
          totalDays = row.total_days || 0;
          goalsAchieved = row.goals_achieved || 0;
        }
        
        // Add date and step count
        const date = new Date(row.tracking_date);
        dates.push(`${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`);
        values.push(row.step_count);
      });

      return {
        dates,
        values,
        goal,
        average,
        totalDays,
        goalsAchieved
      };
    } catch (error) {
      console.error('Error fetching steps data:', error);
      return {
        dates: [],
        values: [],
        goal: 10000,
        average: 0,
        totalDays: 0,
        goalsAchieved: 0
      };
    }
  },

  // Workout Types Configuration
  async fetchWorkoutTypes() {
    // Replace with: const response = await fetch('/api/workout-types');
    return [
      { 
        key: "strength", 
        name: "Strength", 
        icon: "dumbbell", 
        color: "#1E3A5F",
        description: "Build muscle and power",
        avgDuration: 75
      },
      { 
        key: "cardio", 
        name: "Cardio", 
        icon: "directions-run", 
        color: "#FF5722",
        description: "Improve cardiovascular health",
        avgDuration: 45
      },
      { 
        key: "yoga", 
        name: "Yoga", 
        icon: "yoga", 
        color: "#9C27B0",
        description: "Flexibility and mindfulness",
        avgDuration: 60
      },
      { 
        key: "rest", 
        name: "Rest", 
        icon: "bed", 
        color: "#607D8B",
        description: "Recovery and restoration",
        avgDuration: 0
      },
    ];
  },

  // Calendar Utilities
  getCurrentStreak(workoutData) {
    const today = new Date();
    let streak = 0;
    let currentDate = new Date(today);
    
    while (currentDate) {
      const dateKey = this.formatDateKey(currentDate);
      const workout = workoutData[dateKey];
      
      if (workout && workout.completed && workout.streak) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  },

  formatDateKey(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  },

  // Analytics
  async fetchCalendarAnalytics(userId, period = "month") {
    try {
      const periodDays = period === "week" ? 7 : 30;
      
      const { data, error } = await supabase.rpc('get_calendar_analytics', {
        p_user_id: userId,
        p_period_days: periodDays
      });

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          totalWorkouts: 0,
          completionRate: 0,
          currentStreak: 0,
          longestStreak: 0,
          favoriteWorkoutType: "Strength",
          favoriteWorkout: "Strength",
          avgWorkoutDuration: 0,
          caloriesBurned: 0,
          progressToGoal: 0
        };
      }

      const analytics = data[0];
      
      // Fetch the favorite workout name by finding most completed workout
      let favoriteWorkoutName = analytics.favorite_workout_type || "Strength";
      
      try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - periodDays);
        
        const { data: workoutData, error: workoutError } = await supabase
          .from('workout_sessions')
          .select(`
            workout_plan_id,
            workout_plans!inner (
              name
            )
          `)
          .eq('user_id', userId)
          .eq('status', 'completed')
          .gte('completed_at', startDate.toISOString())
          .limit(100);
        
        if (!workoutError && workoutData && workoutData.length > 0) {
          // Count occurrences of each workout
          const workoutCounts = {};
          workoutData.forEach(session => {
            if (session.workout_plans && session.workout_plans.name) {
              const name = session.workout_plans.name;
              workoutCounts[name] = (workoutCounts[name] || 0) + 1;
            }
          });
          
          // Find the most frequent workout
          let maxCount = 0;
          let mostFrequent = null;
          Object.entries(workoutCounts).forEach(([name, count]) => {
            if (count > maxCount) {
              maxCount = count;
              mostFrequent = name;
            }
          });
          
          if (mostFrequent) {
            favoriteWorkoutName = mostFrequent;
          }
        }
      } catch (err) {
        console.error('Error fetching favorite workout name:', err);
      }
      
      return {
        totalWorkouts: parseInt(analytics.total_workouts) || 0,
        completionRate: parseInt(analytics.completion_rate) || 0,
        currentStreak: parseInt(analytics.current_streak) || 0,
        longestStreak: parseInt(analytics.longest_streak) || 0,
        favoriteWorkoutType: analytics.favorite_workout_type || "Strength",
        favoriteWorkout: favoriteWorkoutName,
        avgWorkoutDuration: parseInt(analytics.avg_workout_duration) || 0,
        caloriesBurned: parseInt(analytics.calories_burned) || 0,
        progressToGoal: parseInt(analytics.progress_to_goal) || 0
      };
    } catch (error) {
      console.error('Error fetching calendar analytics:', error);
      return {
        totalWorkouts: 0,
        completionRate: 0,
        currentStreak: 0,
        longestStreak: 0,
        favoriteWorkoutType: "Strength",
        favoriteWorkout: "Strength",
        avgWorkoutDuration: 0,
        caloriesBurned: 0,
        progressToGoal: 0
      };
    }
  },

  // Fetch comprehensive day activity details
  async fetchDayActivityDetails(userId, date) {
    console.log(`📅 Fetching activity details for ${date}`);
    try {
      // Fetch all data in parallel
      const [workoutsResult, mealsResult, stepsResult, weightResult, calorieBalanceResult] = await Promise.all([
        // Workouts from workout_logs
        supabase
          .from('workout_logs')
          .select('*')
          .eq('user_id', userId)
          .eq('log_date', date)
          .eq('status', 'completed'),

        // Meals
        supabase
          .from('user_meal_logs')
          .select(`
            id,
            meal_type,
            meal_date,
            meal_time,
            calories,
            protein,
            carbs,
            fats,
            fiber,
            food_id,
            food_database (
              name,
              brand
            )
          `)
          .eq('user_id', userId)
          .eq('meal_date', date)
          .order('meal_time', { ascending: true }),

        // Steps
        supabase
          .from('daily_activity_tracking')
          .select('steps_count, total_calories_burned')
          .eq('user_id', userId)
          .eq('tracking_date', date)
          .single(),

        // Weight measurement
        supabase
          .from('weight_tracking')
          .select('weight_kg, measurement_date, notes')
          .eq('user_id', userId)
          .eq('measurement_date', date)
          .single(),

        // Calorie balance using RPC
        supabase.rpc('calculate_daily_calorie_balance', {
          p_user_id: userId,
          p_date: date
        })
      ]);

      // Process workouts - workout_logs format
      const workouts = workoutsResult.data?.map(workout => ({
        id: workout.id,
        workout_name: workout.workout_name,
        workout_type: workout.workout_type,
        duration_minutes: workout.duration_minutes,
        calories_burned: workout.calories_burned,
        exercises: workout.exercises || [],
        total_sets: workout.total_sets,
        total_reps: workout.total_reps,
        notes: workout.notes
      })) || [];

      // Process meals
      const meals = mealsResult.data?.map(meal => ({
        ...meal,
        food_name: meal.food_database?.name || 'Unknown Food',
        brand: meal.food_database?.brand || null
      })) || [];

      // Process steps
      const steps = stepsResult.data ? {
        count: stepsResult.data.steps_count || 0,
        calories_burned: stepsResult.data.total_calories_burned || 0
      } : null;

      // Process weight
      const weight = weightResult.data || null;

      // Process calorie balance
      const calorieBalance = calorieBalanceResult.data?.[0] || null;

      console.log(`✅ Day activity details: ${workouts.length} workouts, ${meals.length} meals, ${steps?.count || 0} steps`);

      return {
        workouts,
        meals,
        steps,
        weight,
        calorieBalance,
        hasData: workouts.length > 0 || meals.length > 0 || (steps && steps.count > 0) || weight !== null
      };
    } catch (error) {
      console.error('Error fetching day activity details:', error);
      return {
        workouts: [],
        meals: [],
        steps: null,
        weight: null,
        calorieBalance: null,
        hasData: false
      };
    }
  },

  // Fetch activity indicators for calendar date marking
  async fetchActivityIndicators(userId, startDate, endDate) {
    try {
      console.log('📊 Fetching activity indicators for date range:', startDate, endDate);

      const [workoutsResult, mealsResult, stepsResult, weightResult] = await Promise.all([
        // Get dates with workouts from workout_logs
        supabase
          .from('workout_logs')
          .select('log_date')
          .eq('user_id', userId)
          .gte('log_date', startDate)
          .lte('log_date', endDate)
          .eq('status', 'completed'),

        // Get dates with meals
        supabase
          .from('user_meal_logs')
          .select('meal_date')
          .eq('user_id', userId)
          .gte('meal_date', startDate)
          .lte('meal_date', endDate),

        // Get dates with steps
        supabase
          .from('daily_activity_tracking')
          .select('tracking_date')
          .eq('user_id', userId)
          .gte('tracking_date', startDate)
          .lte('tracking_date', endDate)
          .gt('steps_count', 0),

        // Get dates with weight logs
        supabase
          .from('weight_tracking')
          .select('measurement_date')
          .eq('user_id', userId)
          .gte('measurement_date', startDate)
          .lte('measurement_date', endDate)
      ]);

      // Build indicators map
      const indicators = {};

      // Add workout indicators
      workoutsResult.data?.forEach(item => {
        const date = item.log_date;
        if (date) {
          if (!indicators[date]) indicators[date] = [];
          if (!indicators[date].includes('workout')) {
            indicators[date].push('workout');
          }
        }
      });

      // Add meal indicators
      mealsResult.data?.forEach(item => {
        if (!indicators[item.meal_date]) indicators[item.meal_date] = [];
        if (!indicators[item.meal_date].includes('meal')) {
          indicators[item.meal_date].push('meal');
        }
      });

      // Add step indicators
      stepsResult.data?.forEach(item => {
        if (!indicators[item.tracking_date]) indicators[item.tracking_date] = [];
        if (!indicators[item.tracking_date].includes('steps')) {
          indicators[item.tracking_date].push('steps');
        }
      });

      // Add weight indicators
      weightResult.data?.forEach(item => {
        if (!indicators[item.measurement_date]) indicators[item.measurement_date] = [];
        if (!indicators[item.measurement_date].includes('weight')) {
          indicators[item.measurement_date].push('weight');
        }
      });

      console.log('✅ Activity indicators loaded:', Object.keys(indicators).length, 'days');
      return indicators;
    } catch (error) {
      console.error('Error fetching activity indicators:', error);
      return {};
    }
  }
};

