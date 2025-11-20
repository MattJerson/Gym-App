// 🔄 Browse Workouts Data Service - Database-driven workout content
import { supabase } from './supabase';

export const BrowseWorkoutsDataService = {
  // Main Category Cards (shown on training home page)
  async fetchWorkoutCategories() {
    try {
      const { data, error} = await supabase
        .from('workout_categories')
        .select('*')
        .eq('is_active', true)
        .neq('id', '4b5d22ae-c484-4249-9123-21a4cfad1544') // Exclude Custom category
        .order('display_order', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching workout categories:', error);
      return [];
    }
  },

  // Subcategory Workouts (shown when category is selected)
  async fetchCategoryWorkouts(categoryId) {
    try {
      const { data, error } = await supabase
        .from('workout_templates')
        .select(`
          *,
          workout_categories (
            id,
            name,
            color
          )
        `)
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(workout => ({
        id: workout.id,
        name: workout.name,
        description: workout.description,
        difficulty: workout.difficulty,
        duration: workout.duration_minutes,
        exercises: 0, // Will be populated from workout_template_exercises count
        calories: workout.duration_minutes * 6, // Estimate: 6 cal/min (will be calculated dynamically)
        equipment: workout.equipment || [],
        muscleGroups: workout.muscle_groups || [],
        thumbnail: workout.thumbnail_url,
        createdBy: workout.created_by,
        categoryId: workout.category_id,
        categoryName: workout.workout_categories?.name,
        categoryColor: workout.workout_categories?.color
      }));
    } catch (error) {
      console.error('Error fetching category workouts:', error);
      return [];
    }
  },

  // Detailed Workout Information (shown when workout is selected)
  async fetchWorkoutDetail(workoutId) {
    try {
      // Fetch workout template
      const { data: workout, error: workoutError } = await supabase
        .from('workout_templates')
        .select(`
          *,
          workout_categories (
            id,
            name,
            color
          )
        `)
        .eq('id', workoutId)
        .single();

      if (workoutError) throw workoutError;

      // Fetch workout exercises from new table
      const { data: exercises, error: exercisesError } = await supabase
        .from('workout_exercises')
        .select(`
          id,
          exercise_name,
          sets,
          reps,
          rest_seconds,
          order_index,
          description,
          calories_per_set
        `)
        .eq('template_id', workoutId)
        .order('order_index', { ascending: true });

      if (exercisesError) throw exercisesError;

      // Separate exercises into warmup, main, and cooldown
      const warmupExercises = exercises.filter(ex => ex.is_warmup);
      const cooldownExercises = exercises.filter(ex => ex.is_cooldown);
      const mainExercises = exercises.filter(ex => !ex.is_warmup && !ex.is_cooldown);

      // Transform exercises to match expected format
      const transformedExercises = mainExercises.map(ex => ({
        id: ex.id,
        name: ex.exercise?.name || 'Unknown Exercise',
        description: ex.custom_notes || '',
        sets: ex.sets,
        reps: ex.reps,
        restTime: ex.rest_seconds,
        duration: ex.duration_seconds,
        muscleGroups: [], // Will be populated from exercise relationships
        equipment: [], // Will be populated from exercise relationships
        metValue: ex.exercise?.met_value || 4.5,
        gifUrl: ex.exercise?.gif_url,
        instructions: ex.exercise?.instructions || [],
        videoUrl: null // GIFs replace videos in new system
      }));

      return {
        id: workout.id,
        name: workout.name,
        description: workout.description,
        difficulty: workout.difficulty,
        duration: workout.duration_minutes,
        totalCalories: workout.duration_minutes * 6, // Estimate (use MET calculation for actual)
        equipment: workout.equipment || [],
        muscleGroups: workout.muscle_groups || [],
        videoUrl: workout.video_url,
        thumbnail: workout.thumbnail_url,
        createdBy: workout.created_by,
        createdAt: workout.created_at,
        // Detailed exercise list
        exercises: transformedExercises,
        // Workout structure
        structure: {
          warmup: {
            duration: warmupExercises.length > 0 ? 5 : 0,
            activities: warmupExercises.map(ex => ex.exercise?.name || 'Warmup')
          },
          mainWorkout: {
            duration: workout.duration_minutes - (warmupExercises.length > 0 ? 5 : 0) - (cooldownExercises.length > 0 ? 5 : 0),
            focus: workout.description
          },
          cooldown: {
            duration: cooldownExercises.length > 0 ? 5 : 0,
            activities: cooldownExercises.map(ex => ex.exercise?.name || 'Cooldown')
          }
        },
        tags: workout.tags || [],
        completionCount: workout.completion_count || 0,
        averageRating: workout.average_rating || 0.0,
        categoryName: workout.workout_categories?.name,
        categoryColor: workout.workout_categories?.color
      };
    } catch (error) {
      console.error('Error fetching workout detail:', error);
      throw error;
    }
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
