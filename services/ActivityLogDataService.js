// Activity Log Data Service - Focuses on workouts and nutrition only
import { supabase } from './supabase';

export const ActivityLogDataService = {
  
  // Main function to fetch workout and nutrition activities only
  async fetchAllActivities(userId) {
    try {
      // Fetch only workout and nutrition activities
      const [
        workoutActivities,
        nutritionActivities
      ] = await Promise.all([
        this.fetchWorkoutActivities(userId),
        this.fetchNutritionActivities(userId)
      ]);

      // Combine activities and sort by timestamp
      const allActivities = [
        ...workoutActivities,
        ...nutritionActivities
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return allActivities;
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }
  },

  // Fetch workout-related activities
  async fetchWorkoutActivities(userId) {
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select(`
          id,
          workout_name,
          workout_type,
          completed_at,
          total_duration_seconds,
          total_exercises,
          completed_exercises,
          estimated_calories_burned,
          difficulty_rating,
          total_sets_completed,
          total_volume_kg,
          workout_categories(name, icon, color)
        `)
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data || []).map(session => {
        const category = this.mapWorkoutTypeToCategory(session.workout_type);
        const durationMins = Math.round(session.total_duration_seconds / 60);
        
        // Calculate points earned
        const basePoints = 10;
        const setsPoints = (session.total_sets_completed || 0) * 2;
        const volumePoints = Math.floor((session.total_volume_kg || 0) / 100);
        const caloriePoints = Math.floor((session.estimated_calories_burned || 0) / 50);
        const difficultyPoints = (session.difficulty_rating || 0) * 5;
        const pointsEarned = basePoints + setsPoints + volumePoints + caloriePoints + difficultyPoints;
        
        return {
          id: session.id,
          type: "workout",
          category: category,
          title: session.workout_name,
          description: session.workout_type || 'Workout session',
          timestamp: session.completed_at,
          metadata: {
            duration: `${durationMins} min${durationMins !== 1 ? 's' : ''}`,
            exercises: session.total_exercises || 0,
            completedExercises: session.completed_exercises || 0,
            calories: session.estimated_calories_burned || 0,
            difficulty: session.difficulty_rating,
            points: pointsEarned
          }
        };
      });
    } catch (error) {
      console.error('Error fetching workout activities:', error);
      return [];
    }
  },

  // Fetch nutrition-related activities
  async fetchNutritionActivities(userId) {
    try {
      const { data, error } = await supabase
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
          quantity,
          created_at,
          food_database(name, brand, category)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Group meals by meal_date and meal_type to combine multiple food items into single meal entries
      const mealGroups = {};
      
      (data || []).forEach(log => {
        const key = `${log.meal_date}_${log.meal_type}`;
        if (!mealGroups[key]) {
          mealGroups[key] = {
            id: log.id,
            type: "nutrition",
            category: "meal",
            title: this.formatMealTitle(log.meal_type, log.food_database),
            description: this.formatMealDescription(log.meal_type),
            timestamp: log.created_at,
            metadata: {
              mealType: log.meal_type,
              calories: 0,
              protein: 0,
              carbs: 0,
              fats: 0,
              items: []
            }
          };
        }
        
        // Accumulate nutritional data
        mealGroups[key].metadata.calories += parseFloat(log.calories || 0);
        mealGroups[key].metadata.protein += parseFloat(log.protein || 0);
        mealGroups[key].metadata.carbs += parseFloat(log.carbs || 0);
        mealGroups[key].metadata.fats += parseFloat(log.fats || 0);
        mealGroups[key].metadata.items.push({
          name: log.food_database?.name || 'Food item',
          quantity: log.quantity
        });
      });

      // Convert to array and format
      return Object.values(mealGroups).map(meal => ({
        ...meal,
        metadata: {
          ...meal.metadata,
          calories: Math.round(meal.metadata.calories),
          protein: `${Math.round(meal.metadata.protein)}g`,
          carbs: `${Math.round(meal.metadata.carbs)}g`,
          fats: `${Math.round(meal.metadata.fats)}g`
        }
      }));
    } catch (error) {
      console.error('Error fetching nutrition activities:', error);
      return [];
    }
  },

  // Helper: Map workout type to category
  mapWorkoutTypeToCategory(workoutType) {
    const typeMap = {
      'Strength Training': 'strength',
      'Cardio': 'cardio',
      'High Intensity': 'hiit',
      'Flexibility': 'flexibility',
      'Core Training': 'core',
      'Functional Training': 'functional'
    };
    return typeMap[workoutType] || 'general';
  },

  // Helper: Format meal title
  formatMealTitle(mealType, foodData) {
    if (foodData && foodData.name) {
      return foodData.name;
    }
    const titles = {
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      dinner: 'Dinner',
      snack: 'Snack'
    };
    return titles[mealType] || 'Meal';
  },

  // Helper: Format meal description
  formatMealDescription(mealType) {
    const descriptions = {
      breakfast: 'Morning meal',
      lunch: 'Midday meal',
      dinner: 'Evening meal',
      snack: 'Snack'
    };
    return descriptions[mealType] || 'Nutrition log';
  },

  // Filter activities by type
  async fetchActivitiesByType(userId, type) {
    const allActivities = await this.fetchAllActivities(userId);
    return allActivities.filter(activity => activity.type === type);
  },

  // Filter activities by date range
  async fetchActivitiesByDateRange(userId, startDate, endDate) {
    const allActivities = await this.fetchAllActivities(userId);
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return allActivities.filter(activity => {
      const activityDate = new Date(activity.timestamp);
      return activityDate >= start && activityDate <= end;
    });
  },

  // Get activity statistics
  async getActivityStats(userId, timeRange = 'all') {
    try {
      const activities = await this.fetchAllActivities(userId);
      
      // Filter by time range if specified
      let filteredActivities = activities;
      if (timeRange !== 'all') {
        const now = new Date();
        const filterDate = new Date();
        
        switch (timeRange) {
          case 'today':
            filterDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            filterDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            filterDate.setMonth(now.getMonth() - 1);
            break;
          case '3months':
            filterDate.setMonth(now.getMonth() - 3);
            break;
        }
        
        if (timeRange !== 'all') {
          filteredActivities = activities.filter(activity => 
            new Date(activity.timestamp) >= filterDate
          );
        }
      }

      // Calculate statistics
      const stats = {
        total: filteredActivities.length,
        workouts: filteredActivities.filter(a => a.type === 'workout').length,
        nutrition: filteredActivities.filter(a => a.type === 'nutrition').length,
        totalCalories: filteredActivities
          .filter(a => a.metadata?.calories)
          .reduce((sum, a) => sum + (typeof a.metadata.calories === 'number' ? a.metadata.calories : 0), 0),
        totalDuration: filteredActivities
          .filter(a => a.metadata?.duration)
          .reduce((sum, a) => {
            const duration = parseInt(a.metadata.duration);
            return sum + (isNaN(duration) ? 0 : duration);
          }, 0),
        achievements: filteredActivities
          .filter(a => a.metadata?.achievement)
          .length
      };

      return stats;
    } catch (error) {
      console.error('Error getting activity stats:', error);
      return {
        total: 0,
        workouts: 0,
        nutrition: 0,
        totalCalories: 0,
        totalDuration: 0,
        achievements: 0
      };
    }
  },

  // Search activities
  async searchActivities(userId, query, filters = {}) {
    const allActivities = await this.fetchAllActivities(userId);
    
    let filtered = allActivities;

    // Apply type filter
    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(activity => activity.type === filters.type);
    }

    // Apply date range filter
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case '3months':
          filterDate.setMonth(now.getMonth() - 3);
          break;
      }
      
      if (filters.dateRange !== 'all') {
        filtered = filtered.filter(activity => 
          new Date(activity.timestamp) >= filterDate
        );
      }
    }

    // Apply search query
    if (query && query.trim()) {
      const searchQuery = query.toLowerCase();
      filtered = filtered.filter(activity =>
        activity.title.toLowerCase().includes(searchQuery) ||
        activity.description.toLowerCase().includes(searchQuery) ||
        activity.category?.toLowerCase().includes(searchQuery) ||
        activity.type.toLowerCase().includes(searchQuery)
      );
    }

    return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
};
