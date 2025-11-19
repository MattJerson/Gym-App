// 🔄 Training Data Service - Database-driven workout tracking
import { supabase } from './supabase';
import { CalorieCalculator } from './CalorieCalculator';
import { getLocalDateString } from '../utils/dateUtils';

export const TrainingDataService = {
  // User & Notifications
  async fetchUserNotifications(userId) {
    // TODO: Implement notifications system
    return {
      count: 0,
      messages: []
    };
  },

  // Workout Progress Data
  async fetchWorkoutProgress(userId) {
    try {
      // Fetch today's activity data
      const { data, error } = await supabase
        .rpc('get_user_daily_stats', { 
          p_user_id: userId,
          p_date: getLocalDateString()
        });

      if (error) throw error;

      const stats = data && data.length > 0 ? data[0] : null;

      return {
        workoutData: { 
          value: stats?.workouts_completed || 0, 
          max: stats?.workouts_goal || 1, 
          unit: "workouts", 
          label: "Daily Goal" 
        },
        stepsData: { 
          value: stats?.steps_count || 0, 
          max: stats?.steps_goal || 10000, 
          unit: "steps", 
          label: "Daily Steps" 
        },
        caloriesData: { 
          value: stats?.calories_burned || 0, 
          max: stats?.calories_goal || 500, 
          unit: "kcal", 
          label: "Calories Burned" 
        },
        weeklyStreak: 0, // TODO: Calculate weekly streak
        totalWorkouts: stats?.workouts_completed || 0,
        avgDuration: 0
      };
    } catch (error) {
      console.error('Error fetching workout progress:', error);
      return {
        workoutData: { value: 0, max: 1, unit: "workouts", label: "Daily Goal" },
        stepsData: { value: 0, max: 10000, unit: "steps", label: "Daily Steps" },
        caloriesData: { value: 0, max: 500, unit: "kcal", label: "Calories Burned" },
        weeklyStreak: 0,
        totalWorkouts: 0,
        avgDuration: 0
      };
    }
  },

  // Current/Continue Workout (In-progress session)
  async fetchContinueWorkout(userId) {
    try {
      const { data, error } = await supabase
        .rpc('get_continue_workout', { p_user_id: userId });

      if (error) throw error;
      
      if (!data || data.length === 0) return null;

      const session = data[0];
      
      return {
        id: session.template_id,
        sessionId: session.session_id,
        workoutName: session.workout_name,
        workoutType: session.workout_type,
        completedExercises: session.completed_exercises,
        totalExercises: session.total_exercises,
        timeElapsed: Math.floor(session.elapsed_seconds / 60), // Convert to minutes
        progress: session.progress_percentage / 100,
        caloriesBurned: session.calories_burned || 0
      };
    } catch (error) {
      console.error('Error fetching continue workout:', error);
      return null;
    }
  },

  async updateWorkoutProgress(userId, workoutId, exerciseData) {
    // This will be handled by WorkoutSessionService
    return {
      success: true,
      updatedAt: new Date().toISOString(),
      progress: exerciseData.progress
    };
  },

  // Today's Planned Workout
  async fetchTodaysWorkout(userId) {
    try {
      // Get current day of week (0 = Sunday, 1 = Monday, etc.)
      const today = new Date();
      const dayOfWeek = today.getDay();
      // Query user_saved_workouts for workouts scheduled for today
      const { data: workouts, error: workoutsError } = await supabase
        .from('user_saved_workouts')
        .select(`
          id,
          template_id,
          scheduled_day_of_week,
          workout_templates (
            id,
            name,
            difficulty,
            duration_minutes,
            estimated_calories,
            category_id,
            workout_categories (
              color,
              icon,
              name
            )
          )
        `)
        .eq('user_id', userId)
        .eq('scheduled_day_of_week', dayOfWeek)
        .eq('is_scheduled', true)
        .not('template_id', 'is', null);

      if (workoutsError) {
        console.error('❌ Error fetching scheduled workouts:', JSON.stringify(workoutsError, null, 2));
        return null;
      }
      if (!workouts || workouts.length === 0) {
        return null;
      }

      const workout = workouts[0];
      const template = workout.workout_templates;

      if (!template) {
        return null;
      }
      // Check if there's an active session for this workout
      const { data: activeSessions, error: sessionError } = await supabase
        .from('workout_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('template_id', workout.template_id)
        .eq('status', 'in_progress')
        .limit(1);

      if (sessionError) {
        console.error('❌ Error checking active sessions:', JSON.stringify(sessionError, null, 2));
      } else {
      }

      if (activeSessions && activeSessions.length > 0) {
        return null;
      }
      // Count exercises for this template
      const { count: exerciseCount, error: countError } = await supabase
        .from('workout_template_exercises')
        .select('*', { count: 'exact', head: true })
        .eq('template_id', workout.template_id);

      if (countError) {
        console.error('❌ Error counting exercises:', JSON.stringify(countError, null, 2));
      } else {
      }

      const category = template.workout_categories;
      const result = {
        id: workout.template_id,
        workoutName: template.name,
        workoutType: category?.name || 'Workout',
        totalExercises: exerciseCount || 0,
        estimatedDuration: template.duration_minutes,
        difficulty: template.difficulty,
        caloriesEstimate: template.estimated_calories || 0,
        categoryColor: category?.color || "#A3E635",
        categoryIcon: category?.icon || "dumbbell"
      };
      return result;
    } catch (error) {
      console.error('❌ ===== FETCH TODAY\'S WORKOUT ERROR =====');
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      return null;
    }
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
    try {
      // ✅ For custom workouts, use user_custom_categories instead of workout_categories
      let categoryId = null;
      
      // Get or create custom category for this user
      const { data: customCategory, error: categoryError } = await supabase
        .rpc('get_or_create_custom_category', {
          p_user_id: userId,
          p_name: workoutData.categoryName || 'My Workouts',
          p_emoji: workoutData.emoji || '💪',
          p_color: workoutData.color || '#3B82F6'
        });

      if (categoryError) {
        console.error('Error getting/creating custom category:', categoryError);
        throw categoryError;
      }

      categoryId = customCategory;
      // Transform exercises to match database format
      const exercises = workoutData.exercises.map(ex => ({
        exercise_id: ex.exercise_id, // ID from the exercises table
        name: ex.name || ex.exercise_name,
        description: ex.description || '',
        sets: ex.sets || 3,
        reps: ex.reps || '10',
        rest_seconds: parseInt(ex.restTime) || 60,
        notes: ex.notes || '',
        muscle_groups: ex.muscle_groups || [],
        equipment: ex.equipment || [],
        met_value: ex.met_value || 6.0 // Include MET value for calorie calculation
      }));

      // 🔥 Calculate estimated calories based on exercises and user weight
      const estimatedCalories = await CalorieCalculator.calculateWorkoutCaloriesForUser(
        workoutData.exercises,
        userId
      );
      const { data, error } = await supabase.rpc('create_custom_workout_v2', {
        p_user_id: userId,
        p_name: workoutData.name,
        p_description: workoutData.description || '',
        p_custom_category_id: categoryId, // Use custom category instead
        p_difficulty: workoutData.difficulty.charAt(0).toUpperCase() + workoutData.difficulty.slice(1),
        p_duration_minutes: parseInt(workoutData.duration) || 45,
        p_estimated_calories: estimatedCalories,
        p_exercises: exercises,
        p_custom_color: workoutData.color || null,
        p_custom_emoji: workoutData.emoji || null
      });

      if (error) {
        console.error('Error creating custom workout:', error);
        throw error;
      }

      return {
        id: data,
        ...workoutData,
        estimatedCalories,
        isCustom: true,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating custom workout:', error);
      throw error;
    }
  },

  async updateCustomWorkout(userId, templateId, workoutData) {
    try {
      // ✅ Get or create custom category for this user
      const { data: customCategory, error: categoryError } = await supabase
        .rpc('get_or_create_custom_category', {
          p_user_id: userId,
          p_name: workoutData.categoryName || 'My Workouts',
          p_emoji: workoutData.emoji || '💪',
          p_color: workoutData.color || '#3B82F6'
        });

      if (categoryError) {
        console.error('Error getting/creating custom category:', categoryError);
        throw categoryError;
      }

      const categoryId = customCategory;

      // Transform exercises to match database format
      const exercises = workoutData.exercises.map(ex => ({
        exercise_id: ex.exercise_id,
        name: ex.name || ex.exercise_name,
        description: ex.description || '',
        sets: ex.sets || 3,
        reps: ex.reps || '10',
        rest_seconds: parseInt(ex.restTime || ex.rest_seconds) || 60,
        muscle_groups: ex.muscle_groups || [],
        equipment: ex.equipment || [],
        met_value: ex.met_value || 6.0
      }));

      // Calculate calories
      const estimatedCalories = await CalorieCalculator.calculateWorkoutCaloriesForUser(
        workoutData.exercises,
        userId
      );

      const { data, error } = await supabase.rpc('update_custom_workout_v2', {
        p_user_id: userId,
        p_template_id: templateId,
        p_name: workoutData.name,
        p_description: workoutData.description || '',
        p_custom_category_id: categoryId,
        p_difficulty: workoutData.difficulty.charAt(0).toUpperCase() + workoutData.difficulty.slice(1),
        p_duration_minutes: parseInt(workoutData.duration) || 45,
        p_estimated_calories: estimatedCalories,
        p_exercises: exercises,
        p_custom_color: workoutData.color || null,
        p_custom_emoji: workoutData.emoji || null
      });

      if (error) {
        console.error('Error updating custom workout:', error);
        throw error;
      }

      return {
        id: templateId,
        ...workoutData,
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error updating custom workout:', error);
      throw error;
    }
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
