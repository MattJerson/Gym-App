// 🔄 Browse Workouts Data Service - Admin-created workout content
// This service manages workout categories, subcategories, and detailed workout information

export const BrowseWorkoutsDataService = {
  // Main Category Cards (shown on training home page)
  async fetchWorkoutCategories() {
    // Replace with: const response = await fetch('/api/workout-categories');
    return [
      {
        id: "strength",
        name: "Strength",
        description: "Build muscle & power",
        workoutCount: 24,
        gradient: ["#A3E635", "#84CC16"],
        image: null, // Can be replaced with actual image URL
        color: "#A3E635",
        icon: "barbell-outline"
      },
      {
        id: "cardio",
        name: "Cardio",
        description: "Boost endurance & burn",
        workoutCount: 18,
        gradient: ["#EF4444", "#DC2626"],
        image: null,
        color: "#EF4444",
        icon: "flash-outline"
      },
      {
        id: "endurance",
        name: "Endurance",
        description: "Increase stamina",
        workoutCount: 15,
        gradient: ["#3B82F6", "#2563EB"],
        image: null,
        color: "#3B82F6",
        icon: "trending-up-outline"
      },
      {
        id: "flexibility",
        name: "Flexibility",
        description: "Stretch & recover",
        workoutCount: 12,
        gradient: ["#8B5CF6", "#7C3AED"],
        image: null,
        color: "#8B5CF6",
        icon: "body-outline"
      },
      {
        id: "hiit",
        name: "HIIT",
        description: "High intensity training",
        workoutCount: 20,
        gradient: ["#F59E0B", "#D97706"],
        image: null,
        color: "#F59E0B",
        icon: "flame-outline"
      },
      {
        id: "functional",
        name: "Functional",
        description: "Real-world fitness",
        workoutCount: 16,
        gradient: ["#10B981", "#059669"],
        image: null,
        color: "#10B981",
        icon: "fitness-outline"
      }
    ];
  },

  // Subcategory Workouts (shown when category is selected)
  async fetchCategoryWorkouts(categoryId) {
    // Replace with: const response = await fetch(`/api/workout-categories/${categoryId}/workouts`);
    const workoutsByCategory = {
      strength: [
        {
          id: "str_1",
          name: "Upper Body Power",
          description: "Build chest, back & shoulder strength",
          difficulty: "Intermediate",
          duration: 45,
          exercises: 8,
          calories: 320,
          equipment: ["Barbell", "Dumbbells", "Bench"],
          muscleGroups: ["Chest", "Back", "Shoulders", "Arms"],
          thumbnail: null,
          createdBy: "Admin",
          categoryId: "strength"
        },
        {
          id: "str_2",
          name: "Push Day Domination",
          description: "Target chest, shoulders & triceps",
          difficulty: "Advanced",
          duration: 50,
          exercises: 10,
          calories: 380,
          equipment: ["Barbell", "Dumbbells", "Cable Machine"],
          muscleGroups: ["Chest", "Shoulders", "Triceps"],
          thumbnail: null,
          createdBy: "Admin",
          categoryId: "strength"
        },
        {
          id: "str_3",
          name: "Pull Day Pro",
          description: "Master back & bicep development",
          difficulty: "Intermediate",
          duration: 48,
          exercises: 9,
          calories: 340,
          equipment: ["Pull-up Bar", "Barbell", "Dumbbells"],
          muscleGroups: ["Back", "Biceps", "Rear Delts"],
          thumbnail: null,
          createdBy: "Admin",
          categoryId: "strength"
        },
        {
          id: "str_4",
          name: "Leg Day Legends",
          description: "Build powerful legs & glutes",
          difficulty: "Advanced",
          duration: 55,
          exercises: 11,
          calories: 420,
          equipment: ["Barbell", "Leg Press", "Dumbbells"],
          muscleGroups: ["Quads", "Hamstrings", "Glutes", "Calves"],
          thumbnail: null,
          createdBy: "Admin",
          categoryId: "strength"
        },
        {
          id: "str_5",
          name: "Triceps Takeover",
          description: "Isolate & grow your triceps",
          difficulty: "Beginner",
          duration: 30,
          exercises: 6,
          calories: 180,
          equipment: ["Dumbbells", "Cable Machine"],
          muscleGroups: ["Triceps"],
          thumbnail: null,
          createdBy: "Admin",
          categoryId: "strength"
        },
        {
          id: "str_6",
          name: "Core Crusher",
          description: "Build rock-solid abs & core",
          difficulty: "Intermediate",
          duration: 25,
          exercises: 8,
          calories: 200,
          equipment: ["Bodyweight", "Medicine Ball"],
          muscleGroups: ["Core", "Abs", "Obliques"],
          thumbnail: null,
          createdBy: "Admin",
          categoryId: "strength"
        }
      ],
      cardio: [
        {
          id: "card_1",
          name: "HIIT Inferno",
          description: "Maximum calorie burn in minimum time",
          difficulty: "Advanced",
          duration: 30,
          exercises: 6,
          calories: 350,
          equipment: ["Bodyweight"],
          muscleGroups: ["Full Body"],
          thumbnail: null,
          createdBy: "Admin",
          categoryId: "cardio"
        },
        {
          id: "card_2",
          name: "Running Revolution",
          description: "Interval running for endurance",
          difficulty: "Intermediate",
          duration: 35,
          exercises: 5,
          calories: 300,
          equipment: ["Treadmill"],
          muscleGroups: ["Legs", "Cardio System"],
          thumbnail: null,
          createdBy: "Admin",
          categoryId: "cardio"
        },
        {
          id: "card_3",
          name: "Jump Rope Mastery",
          description: "Coordination meets cardio",
          difficulty: "Beginner",
          duration: 20,
          exercises: 4,
          calories: 220,
          equipment: ["Jump Rope"],
          muscleGroups: ["Full Body"],
          thumbnail: null,
          createdBy: "Admin",
          categoryId: "cardio"
        }
      ],
      endurance: [
        {
          id: "end_1",
          name: "Marathon Prep",
          description: "Build running endurance & stamina",
          difficulty: "Advanced",
          duration: 60,
          exercises: 7,
          calories: 450,
          equipment: ["Treadmill"],
          muscleGroups: ["Legs", "Cardio System"],
          thumbnail: null,
          createdBy: "Admin",
          categoryId: "endurance"
        },
        {
          id: "end_2",
          name: "Cyclist's Dream",
          description: "Pedal power & leg endurance",
          difficulty: "Intermediate",
          duration: 45,
          exercises: 5,
          calories: 380,
          equipment: ["Bike"],
          muscleGroups: ["Legs", "Glutes"],
          thumbnail: null,
          createdBy: "Admin",
          categoryId: "endurance"
        }
      ],
      flexibility: [
        {
          id: "flex_1",
          name: "Yoga Flow Basics",
          description: "Gentle stretching & mobility",
          difficulty: "Beginner",
          duration: 30,
          exercises: 10,
          calories: 120,
          equipment: ["Yoga Mat"],
          muscleGroups: ["Full Body"],
          thumbnail: null,
          createdBy: "Admin",
          categoryId: "flexibility"
        },
        {
          id: "flex_2",
          name: "Dynamic Stretching",
          description: "Active recovery & flexibility",
          difficulty: "Beginner",
          duration: 25,
          exercises: 8,
          calories: 100,
          equipment: ["Yoga Mat"],
          muscleGroups: ["Full Body"],
          thumbnail: null,
          createdBy: "Admin",
          categoryId: "flexibility"
        }
      ],
      hiit: [
        {
          id: "hiit_1",
          name: "Tabata Torch",
          description: "20s work, 10s rest intervals",
          difficulty: "Advanced",
          duration: 20,
          exercises: 8,
          calories: 280,
          equipment: ["Bodyweight"],
          muscleGroups: ["Full Body"],
          thumbnail: null,
          createdBy: "Admin",
          categoryId: "hiit"
        },
        {
          id: "hiit_2",
          name: "Burpee Blaster",
          description: "Full body explosive training",
          difficulty: "Intermediate",
          duration: 25,
          exercises: 6,
          calories: 300,
          equipment: ["Bodyweight"],
          muscleGroups: ["Full Body"],
          thumbnail: null,
          createdBy: "Admin",
          categoryId: "hiit"
        }
      ],
      functional: [
        {
          id: "func_1",
          name: "Kettlebell Complex",
          description: "Multi-plane movement patterns",
          difficulty: "Intermediate",
          duration: 35,
          exercises: 7,
          calories: 280,
          equipment: ["Kettlebells"],
          muscleGroups: ["Full Body"],
          thumbnail: null,
          createdBy: "Admin",
          categoryId: "functional"
        },
        {
          id: "func_2",
          name: "Bodyweight Basics",
          description: "Master fundamental movements",
          difficulty: "Beginner",
          duration: 30,
          exercises: 8,
          calories: 200,
          equipment: ["Bodyweight"],
          muscleGroups: ["Full Body"],
          thumbnail: null,
          createdBy: "Admin",
          categoryId: "functional"
        }
      ]
    };

    return workoutsByCategory[categoryId] || [];
  },

  // Detailed Workout Information (shown when workout is selected)
  async fetchWorkoutDetail(workoutId) {
    // Replace with: const response = await fetch(`/api/workouts/${workoutId}`);
    // This is an example structure - in production, fetch from database
    return {
      id: workoutId,
      name: "Upper Body Power",
      description: "This comprehensive upper body workout targets all major muscle groups including chest, back, shoulders, and arms. Designed to build strength and muscle mass through compound and isolation movements.",
      difficulty: "Intermediate",
      duration: 45,
      totalCalories: 320,
      equipment: ["Barbell", "Dumbbells", "Bench", "Cable Machine"],
      muscleGroups: ["Chest", "Back", "Shoulders", "Arms"],
      videoUrl: "https://example.com/upper-body-power.mp4", // Admin uploads video
      thumbnail: null,
      createdBy: "Admin",
      createdAt: "2025-09-15T10:00:00Z",
      // Detailed exercise list
      exercises: [
        {
          id: "ex_1",
          name: "Bench Press",
          description: "Lie flat on bench, lower barbell to chest, press up explosively. Keep elbows at 45-degree angle.",
          sets: 4,
          reps: "8-10",
          restTime: 90, // seconds
          muscleGroups: ["Chest", "Triceps", "Shoulders"],
          equipment: ["Barbell", "Bench"],
          caloriesPerSet: 15,
          videoUrl: "https://example.com/bench-press.mp4",
          tips: [
            "Keep your shoulder blades retracted",
            "Drive through your heels",
            "Control the descent"
          ]
        },
        {
          id: "ex_2",
          name: "Bent Over Rows",
          description: "Hinge at hips, row barbell to lower chest, squeeze shoulder blades together at top.",
          sets: 4,
          reps: "10-12",
          restTime: 90,
          muscleGroups: ["Back", "Biceps"],
          equipment: ["Barbell"],
          caloriesPerSet: 14,
          videoUrl: "https://example.com/bent-rows.mp4",
          tips: [
            "Keep back flat, not rounded",
            "Pull with your elbows, not hands",
            "Squeeze at the top"
          ]
        },
        {
          id: "ex_3",
          name: "Overhead Press",
          description: "Press barbell from shoulders to overhead, lock out at top. Keep core tight.",
          sets: 4,
          reps: "8-10",
          restTime: 90,
          muscleGroups: ["Shoulders", "Triceps", "Core"],
          equipment: ["Barbell"],
          caloriesPerSet: 13,
          videoUrl: "https://example.com/overhead-press.mp4",
          tips: [
            "Don't arch your back excessively",
            "Press in a slight arc",
            "Lockout fully at top"
          ]
        },
        {
          id: "ex_4",
          name: "Incline Dumbbell Press",
          description: "Set bench to 30-45 degrees, press dumbbells up and together at top.",
          sets: 3,
          reps: "10-12",
          restTime: 75,
          muscleGroups: ["Upper Chest", "Shoulders"],
          equipment: ["Dumbbells", "Bench"],
          caloriesPerSet: 12,
          videoUrl: "https://example.com/incline-press.mp4",
          tips: [
            "Don't set bench too steep",
            "Full range of motion",
            "Control the weight"
          ]
        },
        {
          id: "ex_5",
          name: "Lat Pulldowns",
          description: "Pull bar down to upper chest, squeeze lats, control the return.",
          sets: 3,
          reps: "12-15",
          restTime: 60,
          muscleGroups: ["Lats", "Biceps"],
          equipment: ["Cable Machine"],
          caloriesPerSet: 10,
          videoUrl: "https://example.com/lat-pulldown.mp4",
          tips: [
            "Don't lean back too much",
            "Think about pulling with your elbows",
            "Squeeze at bottom"
          ]
        },
        {
          id: "ex_6",
          name: "Lateral Raises",
          description: "Raise dumbbells to shoulder height, slight bend in elbows, controlled descent.",
          sets: 3,
          reps: "12-15",
          restTime: 60,
          muscleGroups: ["Side Delts"],
          equipment: ["Dumbbells"],
          caloriesPerSet: 8,
          videoUrl: "https://example.com/lateral-raise.mp4",
          tips: [
            "Don't swing the weights",
            "Lead with your elbows",
            "Stop at shoulder height"
          ]
        },
        {
          id: "ex_7",
          name: "Bicep Curls",
          description: "Curl dumbbells while keeping elbows stationary, squeeze at top.",
          sets: 3,
          reps: "12-15",
          restTime: 60,
          muscleGroups: ["Biceps"],
          equipment: ["Dumbbells"],
          caloriesPerSet: 7,
          videoUrl: "https://example.com/bicep-curl.mp4",
          tips: [
            "Keep elbows pinned to sides",
            "Don't use momentum",
            "Full contraction at top"
          ]
        },
        {
          id: "ex_8",
          name: "Tricep Pushdowns",
          description: "Push cable down with straight bar, extend fully, control the return.",
          sets: 3,
          reps: "15-20",
          restTime: 45,
          muscleGroups: ["Triceps"],
          equipment: ["Cable Machine"],
          caloriesPerSet: 6,
          videoUrl: "https://example.com/tricep-pushdown.mp4",
          tips: [
            "Keep upper arms stationary",
            "Full extension at bottom",
            "Squeeze triceps"
          ]
        }
      ],
      // Workout structure/phases
      structure: {
        warmup: {
          duration: 5,
          activities: ["Light cardio", "Dynamic stretching", "Arm circles"]
        },
        mainWorkout: {
          duration: 35,
          focus: "Compound movements followed by isolation"
        },
        cooldown: {
          duration: 5,
          activities: ["Static stretching", "Deep breathing"]
        }
      },
      // Additional metadata
      tags: ["Upper Body", "Strength", "Muscle Building", "Compound"],
      completionCount: 1247,
      averageRating: 4.8,
      reviews: 342
    };
  },

  // Search workouts across all categories
  async searchWorkouts(query) {
    // Replace with: const response = await fetch(`/api/workouts/search?q=${query}`);
    // This would search through all workouts
    return [];
  },

  // Utility functions
  getDifficultyColor(difficulty) {
    const colors = {
      "Beginner": "#10B981",
      "Intermediate": "#F59E0B",
      "Advanced": "#EF4444"
    };
    return colors[difficulty] || "#6B7280";
  },

  formatDuration(minutes) {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  },

  calculateTotalCalories(exercises) {
    return exercises.reduce((total, exercise) => {
      return total + (exercise.caloriesPerSet * exercise.sets);
    }, 0);
  }
};
