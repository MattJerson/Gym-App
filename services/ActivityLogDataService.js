// Activity Log Data Service - Focuses on workouts and nutrition only
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
    // Replace with: const response = await fetch(`/api/activities/${userId}/workouts`);
    return [
      {
        id: "w1",
        type: "workout",
        category: "strength",
        title: "Push Day Workout",
        description: "Chest, Shoulders, and Triceps",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        metadata: {
          duration: "45 mins",
          exercises: 8,
          personalRecords: 1,
          achievement: "PR!"
        }
      },
      {
        id: "w2",
        type: "workout",
        category: "cardio",
        title: "Morning Run",
        description: "5K outdoor run",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        metadata: {
          duration: "32 mins",
          distance: "5.2 km",
          pace: "6:10/km"
        }
      },
      {
        id: "w3",
        type: "workout",
        category: "flexibility",
        title: "Evening Yoga",
        description: "Relaxing yoga session",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        metadata: {
          duration: "25 mins"
        }
      },
      {
        id: "w4",
        type: "workout",
        category: "strength",
        title: "Pull Day Training",
        description: "Back and biceps workout",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        metadata: {
          duration: "52 mins",
          exercises: 6
        }
      },
      {
        id: "w5",
        type: "workout",
        category: "cardio",
        title: "HIIT Session",
        description: "High-intensity interval training",
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
        metadata: {
          duration: "20 mins",
          intervals: 8
        }
      },
      {
        id: "w6",
        type: "workout",
        category: "strength",
        title: "Leg Day",
        description: "Squats, deadlifts, and leg press",
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        metadata: {
          duration: "55 mins",
          exercises: 7,
          personalRecords: 2,
          achievement: "New PR!"
        }
      }
    ];
  },

  // Fetch nutrition-related activities
  async fetchNutritionActivities(userId) {
    // Replace with: const response = await fetch(`/api/activities/${userId}/nutrition`);
    return [
      {
        id: "n1",
        type: "nutrition",
        category: "meal",
        title: "Grilled Salmon Bowl",
        description: "Dinner with quinoa and vegetables",
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
        metadata: {
          mealType: "dinner",
          calories: 485,
          protein: "42g",
          carbs: "38g",
          fats: "18g"
        }
      },
      {
        id: "n2",
        type: "nutrition",
        category: "meal",
        title: "Protein Smoothie Bowl",
        description: "Post-workout smoothie with berries",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        metadata: {
          mealType: "snack",
          calories: 320,
          protein: "28g",
          carbs: "32g",
          fats: "8g"
        }
      },
      {
        id: "n3",
        type: "nutrition",
        category: "meal",
        title: "Overnight Oats",
        description: "Breakfast with banana and almond butter",
        timestamp: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(), // 9 hours ago
        metadata: {
          mealType: "breakfast",
          calories: 380,
          protein: "16g",
          carbs: "48g",
          fats: "14g"
        }
      },
      {
        id: "n4",
        type: "nutrition",
        category: "meal",
        title: "Greek Chicken Salad",
        description: "Mediterranean-style salad",
        timestamp: new Date(Date.now() - 27 * 60 * 60 * 1000).toISOString(), // 27 hours ago
        metadata: {
          mealType: "lunch",
          calories: 425,
          protein: "38g",
          carbs: "22g",
          fats: "22g"
        }
      },
      {
        id: "n5",
        type: "nutrition",
        category: "meal",
        title: "Turkey Wrap",
        description: "Whole wheat wrap with turkey and veggies",
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
        metadata: {
          mealType: "lunch",
          calories: 350,
          protein: "25g",
          carbs: "35g",
          fats: "12g"
        }
      },
      {
        id: "n6",
        type: "nutrition",
        category: "meal",
        title: "Greek Yogurt Parfait",
        description: "Yogurt with granola and berries",
        timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), // 3 days ago
        metadata: {
          mealType: "snack",
          calories: 245,
          protein: "20g",
          carbs: "28g",
          fats: "6g"
        }
      }
    ];
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
        .reduce((sum, a) => sum + a.metadata.calories, 0),
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
