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
      
      const { data, error } = await supabase
        .from('weight_tracking')
        .select('measurement_date, weight_kg')
        .eq('user_id', userId)
        .gte('measurement_date', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('measurement_date', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          title: "Weight Progress",
          labels: [],
          values: [],
          color: (opacity = 1) => `rgba(30, 58, 95, ${opacity})`,
          unit: "kg",
          goal: 70,
          trend: "stable"
        };
      }

      // Transform data
      const labels = data.map(d => {
        const date = new Date(d.measurement_date);
        return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
      });
      
      const values = data.map(d => parseFloat(d.weight_kg));

      // Determine trend
      const trend = values.length >= 2 
        ? (values[values.length - 1] < values[0] ? "decreasing" : 
           values[values.length - 1] > values[0] ? "increasing" : "stable")
        : "stable";

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
        labels,
        values,
        color: (opacity = 1) => `rgba(30, 58, 95, ${opacity})`,
        unit: "kg",
        goal: goalData?.target_value || 70,
        trend
      };
    } catch (error) {
      console.error('Error fetching progress chart:', error);
      return {
        title: "Weight Progress",
        labels: [],
        values: [],
        color: (opacity = 1) => `rgba(30, 58, 95, ${opacity})`,
        unit: "kg",
        goal: 70,
        trend: "stable"
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
          favoriteWorkoutType: "strength",
          avgWorkoutDuration: 0,
          caloriesBurned: 0,
          progressToGoal: 0
        };
      }

      const analytics = data[0];
      
      return {
        totalWorkouts: parseInt(analytics.total_workouts) || 0,
        completionRate: parseInt(analytics.completion_rate) || 0,
        currentStreak: parseInt(analytics.current_streak) || 0,
        longestStreak: parseInt(analytics.longest_streak) || 0,
        favoriteWorkoutType: analytics.favorite_workout_type || "strength",
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
        favoriteWorkoutType: "strength",
        avgWorkoutDuration: 0,
        caloriesBurned: 0,
        progressToGoal: 0
      };
    }
  }
};
