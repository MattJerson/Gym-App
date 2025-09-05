// 🔄 Training Data Service - Replace these with actual API calls
export const TrainingDataService = {
  // User & Notifications
  async fetchUserNotifications(userId) {
    // Replace with: const response = await fetch(`/api/users/${userId}/notifications`);
    return {
      count: 3,
      messages: [
        { id: 1, title: "Workout Reminder", message: "Time for your leg day!", type: "reminder" },
        { id: 2, title: "New PR!", message: "You hit a new bench press record!", type: "achievement" },
        { id: 3, title: "Rest Day", message: "Don't forget your recovery day tomorrow", type: "tip" }
      ]
    };
  },

  // Workout Progress Data
  async fetchWorkoutProgress(userId) {
    // Replace with: const response = await fetch(`/api/users/${userId}/progress`);
    return {
      workoutData: { value: 3, max: 5, unit: "workouts", label: "Weekly Goal" },
      stepsData: { value: 8500, max: 10000, unit: "steps", label: "Daily Steps" },
      caloriesData: { value: 420, max: 500, unit: "kcal", label: "Calories Burned" },
      weeklyStreak: 4,
      totalWorkouts: 23,
      avgDuration: 68
    };
  },

  // Current/Continue Workout
  async fetchContinueWorkout(userId) {
    // Replace with: const response = await fetch(`/api/users/${userId}/current-workout`);
    return {
      id: "workout_123",
      workoutName: "Push Day",
      workoutType: "Custom Workout",
      completedExercises: 4,
      totalExercises: 6,
      timeElapsed: 15,
      progress: 0.67,
      exercises: [
        { name: "Bench Press", sets: "3/4", completed: true },
        { name: "Incline Dumbbell Press", sets: "3/3", completed: true },
        { name: "Shoulder Press", sets: "2/3", completed: false },
        { name: "Tricep Dips", sets: "0/3", completed: false }
      ],
      startedAt: "2025-09-06T09:30:00Z"
    };
  },

  async updateWorkoutProgress(userId, workoutId, exerciseData) {
    // Replace with: const response = await fetch(`/api/workouts/${workoutId}/progress`, { method: 'PUT', body: JSON.stringify(exerciseData) });
    return {
      success: true,
      updatedAt: new Date().toISOString(),
      progress: exerciseData.progress
    };
  },

  // Today's Planned Workout
  async fetchTodaysWorkout(userId) {
    // Replace with: const response = await fetch(`/api/users/${userId}/todays-workout`);
    return {
      id: "workout_124",
      workoutName: "Pull Day",
      workoutType: "Custom Workout",
      totalExercises: 8,
      estimatedDuration: 60,
      difficulty: "Intermediate",
      muscleGroups: ["Back", "Biceps", "Rear Delts"],
      exercises: [
        { name: "Pull-ups", sets: 4, reps: "8-12" },
        { name: "Barbell Rows", sets: 4, reps: "8-10" },
        { name: "Lat Pulldowns", sets: 3, reps: "10-12" },
        { name: "Cable Rows", sets: 3, reps: "10-12" },
        { name: "Barbell Curls", sets: 3, reps: "10-12" },
        { name: "Hammer Curls", sets: 3, reps: "10-12" },
        { name: "Face Pulls", sets: 3, reps: "12-15" },
        { name: "Reverse Flyes", sets: 3, reps: "12-15" }
      ],
      scheduledTime: "18:00"
    };
  },

  async startWorkout(userId, workoutId) {
    // Replace with: const response = await fetch(`/api/workouts/${workoutId}/start`, { method: 'POST' });
    return {
      sessionId: `session_${Date.now()}`,
      workoutId: workoutId,
      startedAt: new Date().toISOString(),
      status: "in_progress"
    };
  },

  // Browse Workouts
  async fetchBrowseWorkouts(userId, category = "all") {
    // Replace with: const response = await fetch(`/api/workouts/browse?category=${category}&userId=${userId}`);
    return [
      {
        id: "w1",
        name: "Upper Body Strength",
        type: "Strength Training",
        duration: 45,
        difficulty: "Intermediate",
        exercises: 8,
        gradient: ["#1E3A5F", "#4A90E2"],
        icon: "dumbbell",
        muscleGroups: ["Chest", "Back", "Shoulders", "Arms"],
        equipment: ["Dumbbells", "Barbell", "Bench"],
        calories: 320
      },
      {
        id: "w2", 
        name: "HIIT Cardio Blast",
        type: "High Intensity",
        duration: 30,
        difficulty: "Advanced",
        exercises: 6,
        gradient: ["#FF5722", "#FF9800"],
        icon: "flash",
        muscleGroups: ["Full Body"],
        equipment: ["Bodyweight"],
        calories: 280
      },
      {
        id: "w3",
        name: "Lower Body Power",
        type: "Strength Training", 
        duration: 50,
        difficulty: "Intermediate",
        exercises: 10,
        gradient: ["#4CAF50", "#8BC34A"],
        icon: "trending-up",
        muscleGroups: ["Quads", "Hamstrings", "Glutes", "Calves"],
        equipment: ["Barbell", "Dumbbells", "Leg Press"],
        calories: 380
      },
      {
        id: "w4",
        name: "Yoga Flow",
        type: "Flexibility",
        duration: 60,
        difficulty: "Beginner",
        exercises: 12,
        gradient: ["#9C27B0", "#E1BEE7"],
        icon: "leaf",
        muscleGroups: ["Full Body"],
        equipment: ["Yoga Mat"],
        calories: 180
      },
      {
        id: "w5",
        name: "Core Crusher",
        type: "Core Training",
        duration: 25,
        difficulty: "Intermediate",
        exercises: 8,
        gradient: ["#FF6B6B", "#4ECDC4"],
        icon: "fitness",
        muscleGroups: ["Core", "Abs", "Obliques"],
        equipment: ["Bodyweight", "Medicine Ball"],
        calories: 200
      },
      {
        id: "w6",
        name: "Functional Movement",
        type: "Functional Training",
        duration: 40,
        difficulty: "Beginner",
        exercises: 9,
        gradient: ["#FFC107", "#FF8F00"],
        icon: "body",
        muscleGroups: ["Full Body"],
        equipment: ["Kettlebells", "Resistance Bands"],
        calories: 250
      }
    ];
  },

  // Exercise Library
  async fetchExerciseLibrary(userId, searchQuery = "", category = "all") {
    // Replace with: const response = await fetch(`/api/exercises?search=${searchQuery}&category=${category}`);
    return {
      totalExercises: 500,
      categories: [
        { name: "Strength", count: 180, icon: "dumbbell" },
        { name: "Cardio", count: 120, icon: "flash" },
        { name: "Flexibility", count: 90, icon: "leaf" },
        { name: "Core", count: 70, icon: "fitness" },
        { name: "Functional", count: 40, icon: "body" }
      ],
      featured: [
        {
          id: "ex1",
          name: "Bench Press",
          category: "Strength",
          muscleGroups: ["Chest", "Triceps", "Shoulders"],
          equipment: ["Barbell", "Bench"],
          difficulty: "Intermediate",
          videoUrl: "https://example.com/bench-press.mp4",
          instructions: ["Lie on bench", "Grip barbell", "Lower to chest", "Press up"]
        },
        {
          id: "ex2", 
          name: "Pull-ups",
          category: "Strength",
          muscleGroups: ["Back", "Biceps"],
          equipment: ["Pull-up Bar"],
          difficulty: "Advanced",
          videoUrl: "https://example.com/pullups.mp4",
          instructions: ["Hang from bar", "Pull body up", "Lower with control"]
        },
        {
          id: "ex3",
          name: "Squats",
          category: "Strength",
          muscleGroups: ["Quadriceps", "Glutes", "Hamstrings"],
          equipment: ["Barbell", "Squat Rack"],
          difficulty: "Intermediate",
          videoUrl: "https://example.com/squats.mp4",
          instructions: ["Position bar on shoulders", "Squat down", "Drive through heels", "Return to start"]
        },
        {
          id: "ex4",
          name: "Deadlifts",
          category: "Strength", 
          muscleGroups: ["Hamstrings", "Glutes", "Back", "Traps"],
          equipment: ["Barbell"],
          difficulty: "Advanced",
          videoUrl: "https://example.com/deadlifts.mp4",
          instructions: ["Grip bar", "Keep back straight", "Lift with legs", "Stand tall"]
        },
        {
          id: "ex5",
          name: "Push-ups",
          category: "Strength",
          muscleGroups: ["Chest", "Triceps", "Shoulders"],
          equipment: ["Bodyweight"],
          difficulty: "Beginner",
          videoUrl: "https://example.com/pushups.mp4",
          instructions: ["Start in plank position", "Lower chest to ground", "Push back up"]
        },
        {
          id: "ex6",
          name: "Planks",
          category: "Core",
          muscleGroups: ["Core", "Abs", "Back"],
          equipment: ["Bodyweight"],
          difficulty: "Beginner",
          videoUrl: "https://example.com/planks.mp4",
          instructions: ["Hold plank position", "Keep body straight", "Engage core"]
        },
        {
          id: "ex7",
          name: "Burpees",
          category: "Cardio",
          muscleGroups: ["Full Body"],
          equipment: ["Bodyweight"],
          difficulty: "Intermediate",
          videoUrl: "https://example.com/burpees.mp4",
          instructions: ["Squat down", "Jump back to plank", "Do push-up", "Jump forward", "Jump up"]
        },
        {
          id: "ex8",
          name: "Overhead Press",
          category: "Strength",
          muscleGroups: ["Shoulders", "Triceps", "Core"],
          equipment: ["Barbell", "Dumbbells"],
          difficulty: "Intermediate",
          videoUrl: "https://example.com/overhead-press.mp4",
          instructions: ["Hold weight at shoulder height", "Press overhead", "Lower with control"]
        },
        {
          id: "ex9",
          name: "Lunges",
          category: "Strength",
          muscleGroups: ["Quadriceps", "Glutes", "Hamstrings"],
          equipment: ["Bodyweight", "Dumbbells"],
          difficulty: "Beginner",
          videoUrl: "https://example.com/lunges.mp4",
          instructions: ["Step forward", "Lower back knee", "Push back to start"]
        },
        {
          id: "ex10",
          name: "Mountain Climbers",
          category: "Cardio",
          muscleGroups: ["Core", "Shoulders", "Legs"],
          equipment: ["Bodyweight"],
          difficulty: "Intermediate",
          videoUrl: "https://example.com/mountain-climbers.mp4",
          instructions: ["Start in plank", "Alternate bringing knees to chest", "Keep pace steady"]
        }
      ]
    };
  },

  // Recent Workouts
  async fetchRecentWorkouts(userId, limit = 4) {
    // Replace with: const response = await fetch(`/api/users/${userId}/recent-workouts?limit=${limit}`);
    return [
      {
        id: "rw1",
        title: "Upper Body Strength",
        subtitle: "45 min • 8 exercises",
        completedAt: "2025-09-05T18:30:00Z",
        duration: 45,
        exercises: 8,
        calories: 320,
        personalRecords: 1,
        gradient: ["#1E3A5F", "#4A90E2"],
        icon: "dumbbell",
        completionRate: 100,
        avgRest: "90s"
      },
      {
        id: "rw2",
        title: "HIIT Cardio Session", 
        subtitle: "30 min • High Intensity",
        completedAt: "2025-09-04T07:00:00Z", 
        duration: 30,
        exercises: 6,
        calories: 280,
        personalRecords: 0,
        gradient: ["#FF5722", "#FF9800"],
        icon: "flash",
        completionRate: 95,
        avgHeartRate: "165 bpm"
      },
      {
        id: "rw3",
        title: "Lower Body Focus",
        subtitle: "50 min • 10 exercises", 
        completedAt: "2025-09-03T17:15:00Z",
        duration: 50,
        exercises: 10, 
        calories: 380,
        personalRecords: 2,
        gradient: ["#4CAF50", "#8BC34A"],
        icon: "trending-up",
        completionRate: 100,
        avgRest: "2m"
      },
      {
        id: "rw4",
        title: "Recovery Yoga",
        subtitle: "60 min • Flexibility", 
        completedAt: "2025-09-02T19:00:00Z",
        duration: 60,
        exercises: 12,
        calories: 180,
        personalRecords: 0,
        gradient: ["#9C27B0", "#E1BEE7"],
        icon: "leaf",
        completionRate: 100,
        mindfulness: "85%"
      }
    ];
  },

  // Workout Categories for Browse
  async fetchWorkoutCategories() {
    // Replace with: const response = await fetch('/api/workout-categories');
    return [
      { id: "strength", name: "Strength", icon: "dumbbell", count: 45, color: "#1E3A5F" },
      { id: "cardio", name: "Cardio", icon: "flash", count: 32, color: "#FF5722" },
      { id: "hiit", name: "HIIT", icon: "zap", count: 28, color: "#FF9800" },
      { id: "yoga", name: "Yoga", icon: "leaf", count: 24, color: "#9C27B0" },
      { id: "core", name: "Core", icon: "fitness", count: 18, color: "#4CAF50" },
      { id: "functional", name: "Functional", icon: "body", count: 15, color: "#FFC107" }
    ];
  },

  // Training Analytics
  async fetchTrainingAnalytics(userId, period = "week") {
    // Replace with: const response = await fetch(`/api/analytics/${userId}/training?period=${period}`);
    return {
      totalWorkouts: 12,
      totalDuration: 540, // minutes
      avgDuration: 45,
      caloriesBurned: 3240,
      personalRecords: 3,
      consistencyScore: 85,
      favoriteWorkoutType: "Strength",
      strongestDay: "Tuesday",
      improvementAreas: ["Flexibility", "Cardio Endurance"],
      weeklyGoalProgress: 80
    };
  },

  // Custom Workout Management
  async createCustomWorkout(userId, workoutData) {
    // Replace with: const response = await fetch(`/api/users/${userId}/custom-workouts`, { method: 'POST', body: JSON.stringify(workoutData) });
    return {
      id: `custom_workout_${Date.now()}`,
      ...workoutData,
      userId: userId,
      createdAt: new Date().toISOString(),
      isCustom: true,
      timesCompleted: 0,
      lastCompleted: null
    };
  },

  async fetchCustomWorkouts(userId) {
    // Replace with: const response = await fetch(`/api/users/${userId}/custom-workouts`);
    return [
      {
        id: "custom_1",
        name: "My Upper Body Blast",
        description: "Custom upper body strength routine",
        category: "strength",
        duration: 45,
        difficulty: "intermediate",
        exercises: 8,
        isCustom: true,
        createdAt: "2025-09-01T10:00:00Z",
        timesCompleted: 3,
        lastCompleted: "2025-09-05T18:30:00Z"
      },
      {
        id: "custom_2", 
        name: "Quick Core Burner",
        description: "High intensity core workout",
        category: "core",
        duration: 20,
        difficulty: "advanced",
        exercises: 6,
        isCustom: true,
        createdAt: "2025-08-28T15:30:00Z",
        timesCompleted: 7,
        lastCompleted: "2025-09-04T07:15:00Z"
      }
    ];
  },

  async updateCustomWorkout(userId, workoutId, updates) {
    // Replace with: const response = await fetch(`/api/users/${userId}/custom-workouts/${workoutId}`, { method: 'PUT', body: JSON.stringify(updates) });
    return {
      id: workoutId,
      ...updates,
      updatedAt: new Date().toISOString()
    };
  },

  async deleteCustomWorkout(userId, workoutId) {
    // Replace with: const response = await fetch(`/api/users/${userId}/custom-workouts/${workoutId}`, { method: 'DELETE' });
    return {
      success: true,
      deletedId: workoutId
    };
  },

  // Workout Utilities
  formatDuration(minutes) {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  },

  calculateCaloriesPerMinute(workoutType) {
    const rates = {
      "Strength Training": 6,
      "High Intensity": 9,
      "Cardio": 8,
      "Flexibility": 3,
      "Core Training": 7,
      "Functional Training": 6
    };
    return rates[workoutType] || 6;
  },

  getDifficultyColor(difficulty) {
    const colors = {
      "Beginner": "#4CAF50",
      "Intermediate": "#FF9800", 
      "Advanced": "#F44336"
    };
    return colors[difficulty] || "#757575";
  }
};
