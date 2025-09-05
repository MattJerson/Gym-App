
// 🔄 Calendar Data Service - Replace these with actual API calls
export const CalendarDataService = {
  // User & Notifications
  async fetchUserNotifications(userId) {
    // Replace with: const response = await fetch(`/api/users/${userId}/notifications`);
    return {
      count: 3,
      messages: [
        { id: 1, title: "Workout Reminder", message: "Time for your evening workout!", type: "reminder" },
        { id: 2, title: "Goal Achieved", message: "You've hit your weekly step goal!", type: "achievement" },
        { id: 3, title: "New Feature", message: "Check out our new progress tracking!", type: "feature" }
      ]
    };
  },

  // Workout Data Management
  async fetchWorkoutCalendar(userId, startDate, endDate) {
    // Replace with: const response = await fetch(`/api/workouts/${userId}/calendar?start=${startDate}&end=${endDate}`);
    return {
      "2025-09-15": { 
        id: "w1", 
        type: "strength", 
        completed: true, 
        streak: true, 
        note: "Great session!",
        duration: 75,
        exercises: ["Bench Press", "Squats", "Deadlifts"]
      },
      "2025-09-14": { 
        id: "w2", 
        type: "cardio", 
        completed: true, 
        streak: true, 
        note: "5K run",
        duration: 45,
        distance: 5.2,
        pace: "8:30"
      },
      "2025-09-13": { 
        id: "w3", 
        type: "rest", 
        completed: true, 
        streak: true,
        recovery: "full",
        sleep: 8.5
      },
      "2025-09-12": { 
        id: "w4", 
        type: "strength", 
        completed: true, 
        streak: true,
        duration: 80,
        exercises: ["Pull-ups", "Rows", "Bicep Curls"]
      },
      "2025-09-16": { 
        id: "w5", 
        type: "yoga", 
        completed: false, 
        planned: true,
        scheduledTime: "18:00",
        instructor: "Sarah"
      },
      "2025-09-17": { 
        id: "w6", 
        type: "strength", 
        completed: false, 
        planned: true,
        scheduledTime: "07:00",
        focusAreas: ["Legs", "Glutes"]
      },
      "2025-08-30": { 
        id: "w7", 
        type: "cardio", 
        completed: true, 
        streak: false,
        duration: 30,
        calories: 280
      },
      "2025-08-31": { 
        id: "w8", 
        type: "strength", 
        completed: true, 
        streak: false,
        duration: 60,
        personalRecords: ["Deadlift PR: 225lbs"]
      },
      "2025-10-01": { 
        id: "w9", 
        type: "yoga", 
        completed: false, 
        planned: true,
        scheduledTime: "19:00",
        difficulty: "Beginner"
      },
      "2025-10-02": { 
        id: "w10", 
        type: "cardio", 
        completed: false, 
        planned: true,
        scheduledTime: "06:30",
        targetDistance: 3.5
      },
    };
  },

  async createWorkout(userId, workoutData) {
    // Replace with: const response = await fetch(`/api/workouts/${userId}`, { method: 'POST', body: JSON.stringify(workoutData) });
    return {
      id: `w_${Date.now()}`,
      ...workoutData,
      createdAt: new Date().toISOString(),
      userId: userId
    };
  },

  async updateWorkout(userId, workoutId, updates) {
    // Replace with: const response = await fetch(`/api/workouts/${userId}/${workoutId}`, { method: 'PUT', body: JSON.stringify(updates) });
    return {
      id: workoutId,
      ...updates,
      updatedAt: new Date().toISOString()
    };
  },

  async deleteWorkout(userId, workoutId) {
    // Replace with: const response = await fetch(`/api/workouts/${userId}/${workoutId}`, { method: 'DELETE' });
    return { success: true, deletedId: workoutId };
  },

  // Recent Activities
  async fetchRecentActivities(userId, limit = 4) {
    // Replace with: const response = await fetch(`/api/activities/${userId}/recent?limit=${limit}`);
    return [
      { 
        id: "a1",
        label: "Morning Run", 
        duration: "45 min", 
        icon: "walk", 
        color: ["#FF5722", "#FF9800"],
        calories: 420,
        distance: 5.2,
        date: "2025-09-15",
        type: "cardio"
      },
      { 
        id: "a2",
        label: "Upper Body Strength", 
        duration: "1 hour 15 min", 
        icon: "barbell", 
        color: ["#4CAF50", "#8BC34A"],
        exercises: 8,
        sets: 24,
        date: "2025-09-14",
        type: "strength"
      },
      { 
        id: "a3",
        label: "Evening Yoga", 
        duration: "30 min", 
        icon: "body", 
        color: ["#9C27B0", "#E1BEE7"],
        poses: 12,
        flexibility: "+15%",
        date: "2025-09-13",
        type: "yoga"
      },
      { 
        id: "a4",
        label: "Rest Day", 
        duration: "Full day", 
        icon: "bed", 
        color: ["#607D8B", "#90A4AE"],
        sleep: "8.5 hrs",
        recovery: "100%",
        date: "2025-09-12",
        type: "rest"
      },
    ];
  },

  // Progress Data
  async fetchProgressChart(userId, metric, period = "week") {
    // Replace with: const response = await fetch(`/api/progress/${userId}/${metric}?period=${period}`);
    return {
      title: "Weight Progress",
      labels: ["08/01", "08/02", "08/03", "08/04", "08/05", "08/06", "08/07"],
      values: [70, 71, 71.5, 71, 70.8, 70.5, 70.2],
      color: (opacity = 1) => `rgba(30, 58, 95, ${opacity})`, // #1E3A5F color
      unit: "kg",
      goal: 68,
      trend: "decreasing"
    };
  },

  async fetchStepsData(userId, period = "month") {
    // Replace with: const response = await fetch(`/api/steps/${userId}?period=${period}`);
    return {
      dates: [
        "08/01","08/02","08/03","08/04","08/05","08/06","08/07",
        "08/08","08/09","08/10","08/11","08/12","08/13","08/14",
        "08/15","08/16","08/17","08/18","08/19","08/20","08/21",
        "08/22","08/23","08/24","08/25","08/26","08/27","08/28",
        "08/29","08/30","08/31"
      ],
      values: [
        12539, 5776, 2782, 10673, 4430,
        13029, 6263, 4226, 42300, 2783,
        1021, 7563, 8863, 4992, 13332,
        3661, 4324, 2226, 3688, 10773,
        5792, 6960, 9021, 6642, 1876,
        11528, 4474, 11983, 9385, 11111,
        7701
      ],
      goal: 10000,
      average: 8750,
      totalDays: 31,
      goalsAchieved: 18
    };
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
    // Replace with: const response = await fetch(`/api/analytics/${userId}/calendar?period=${period}`);
    return {
      totalWorkouts: 18,
      completionRate: 85,
      currentStreak: 5,
      longestStreak: 12,
      favoriteWorkoutType: "strength",
      avgWorkoutDuration: 62,
      caloriesBurned: 3240,
      progressToGoal: 78
    };
  }
};
