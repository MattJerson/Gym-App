import { supabase } from './supabase';

/**
 * HomeDataService - Provides data for the Home page
 * Integrates with meal plan, training, calendar, and featured content
 */
export const HomeDataService = {
  /**
   * Fetch user's daily statistics (from meal plan + training data)
   */
  async fetchUserDailyStats(userId, date = new Date()) {
    try {
      const dateStr = date.toISOString().split('T')[0];

      // Get meal plan data for today
      const { data: mealData } = await supabase
        .from('daily_meal_tracking')
        .select('*')
        .eq('user_id', userId)
        .eq('date', dateStr)
        .single();

      // Get workout data from calendar
      const { data: workoutLogs } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('date', dateStr);

      // Get user stats from gamification
      const { data: userStats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Calculate daily metrics
      const workoutCompleted = workoutLogs && workoutLogs.length > 0;
      const caloriesConsumed = mealData?.total_calories || 0;
      const caloriesGoal = mealData?.calorie_goal || 2000;
      const steps = 8500; // TODO: Integrate with step tracker
      const stepsGoal = 10000;

      return {
        streak: {
          current: userStats?.current_streak || 0,
          goal: 7,
          lastWorkout: workoutCompleted ? 'Today' : 'Yesterday',
          bestStreak: userStats?.best_streak || 0,
        },
        metrics: {
          workout: {
            value: workoutCompleted ? 1 : 0,
            max: 1,
            unit: 'Done',
          },
          calories: {
            value: caloriesConsumed,
            max: caloriesGoal,
            unit: 'kcal',
          },
          steps: {
            value: steps,
            max: stepsGoal,
            unit: 'steps',
          },
        },
        totalWorkouts: userStats?.total_workouts || 0,
        totalPoints: userStats?.total_points || 0,
      };
    } catch (error) {
      console.error('Error fetching user daily stats:', error);
      // Return default values on error
      return {
        streak: {
          current: 0,
          goal: 7,
          lastWorkout: 'None',
          bestStreak: 0,
        },
        metrics: {
          workout: { value: 0, max: 1, unit: 'Done' },
          calories: { value: 0, max: 2000, unit: 'kcal' },
          steps: { value: 0, max: 10000, unit: 'steps' },
        },
        totalWorkouts: 0,
        totalPoints: 0,
      };
    }
  },

  /**
   * Fetch featured content for home page
   */
  async fetchFeaturedContent() {
    try {
      const { data, error } = await supabase
        .from('featured_content')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }

      if (data) {
        return {
          id: data.id,
          title: data.title,
          subtitle: data.subtitle || '',
          author: data.author || '',
          views: data.views_count ? this.formatViewCount(data.views_count) : '0',
          category: data.category || '',
          thumbnail: data.thumbnail_url || '',
          duration: data.duration || '',
          youtubeUrl: data.youtube_url || '',
          articleUrl: data.article_url || '',
          contentType: data.content_type || 'video',
        };
      }

      // Return null if no active content
      return null;
    } catch (error) {
      console.error('Error fetching featured content:', error);
      return null;
    }
  },

  /**
   * Format view count for display (e.g., 1.2M, 450K)
   */
  formatViewCount(count) {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}K`;
    }
    return count.toString();
  },

    /**
   * Fetch user's recent workout activities from workout_logs
   */
  async fetchRecentActivities(userId, limit = 4) {
    try {
      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error fetching recent activities:', error);
        throw error;
      }

      return (data || []).map(workout => {
        const config = this.getWorkoutTypeConfig(workout.workout_type);
        return {
          id: workout.id,
          label: workout.workout_name,
          duration: `${workout.duration_minutes} mins`,
          icon: config.icon,
          color: config.gradient,
          date: this.calculateDaysAgo(new Date(workout.completed_at)),
          calories: workout.calories_burned || 0,
        };
      });
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  },

  /**
   * Fetch quick start workout categories
   */
  async fetchQuickStartCategories() {
    try {
      const { data, error } = await supabase
        .from('workout_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(3);

      if (error) throw error;

      if (!data || data.length === 0) {
        // Return default categories
        return [
          {
            id: 1,
            title: 'Push Day',
            subtitle: 'Chest, Shoulders, Triceps',
            gradient: ['#FF6B6B', '#4ECDC4'],
            icon: 'fitness',
            difficulty: 'Intermediate',
          },
          {
            id: 2,
            title: 'Cardio Blast',
            subtitle: 'HIIT Training Session',
            gradient: ['#A8E6CF', '#88D8C0'],
            icon: 'flash',
            difficulty: 'Beginner',
          },
          {
            id: 3,
            title: 'Full Body',
            subtitle: 'Complete Workout',
            gradient: ['#FFD93D', '#6BCF7F'],
            icon: 'body',
            difficulty: 'Advanced',
          },
        ];
      }

      // Transform to component format
      return data.map(cat => ({
        id: cat.id,
        title: cat.name,
        subtitle: cat.description || 'Workout category',
        gradient: this.parseGradient(cat.color),
        icon: cat.emoji || 'fitness',
        difficulty: cat.difficulty || 'Beginner',
      }));
    } catch (error) {
      console.error('Error fetching quick start categories:', error);
      return [];
    }
  },

  /**
   * Fetch user notification count
   */
  async fetchUserNotifications(userId) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error fetching notifications:', error.message || error);
        throw error;
      }

      return { count: count || 0 };
    } catch (error) {
      console.error('Error fetching notifications:', error.message || error);
      return { count: 0 };
    }
  },

  /**
   * Increment featured content view count
   */
  async incrementFeaturedViews(contentId) {
    try {
      await supabase.rpc('increment_featured_content_views', {
        content_id: contentId
      });
    } catch (error) {
      console.error('Error incrementing featured views:', error);
    }
  },

  // Helper functions
  calculateDaysAgo(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const diffTime = Math.abs(today - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays - 1; // Subtract 1 because same day = 0 days ago
  },

  getWorkoutTypeConfig(type) {
    const configs = {
      strength: {
        icon: 'barbell',
        color: ['#ff7e5f', '#feb47b'],
      },
      cardio: {
        icon: 'walk',
        color: ['#43cea2', '#185a9d'],
      },
      yoga: {
        icon: 'leaf-outline',
        color: ['#a18cd1', '#fbc2eb'],
      },
      rest: {
        icon: 'bed-outline',
        color: ['#667eea', '#764ba2'],
      },
    };

    return configs[type] || configs.strength;
  },

  formatWorkoutLabel(type, note) {
    if (note) return note;
    
    const labels = {
      strength: 'Strength Training',
      cardio: 'Cardio Session',
      yoga: 'Yoga Practice',
      rest: 'Rest Day',
    };

    return labels[type] || 'Workout';
  },

  parseGradient(colorString) {
    // If color is a gradient array stored as JSON
    try {
      const parsed = JSON.parse(colorString);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // Not JSON, treat as single color
    }

    // Single color - create gradient
    return [colorString, this.lightenColor(colorString, 20)];
  },

  lightenColor(color, percent) {
    // Simple color lightening (hex only)
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (
      0x1000000 +
      (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)
    ).toString(16).slice(1);
  },
};
