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
      // Fetch workouts with exercise counts using the NEW normalized table
      const { data, error } = await supabase
        .from('workout_templates')
        .select(`
          *,
          workout_categories (
            id,
            name,
            color
          ),
          workout_template_exercises (
            id
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
        exercises: workout.workout_template_exercises?.length || 0, // Count exercises from joined data
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

      // Try fetching from NEW workout_template_exercises table first (normalized structure)
      let { data: exercises, error: exercisesError } = await supabase
        .from('workout_template_exercises')
        .select(`
          id,
          sets,
          reps,
          rest_seconds,
          order_index,
          custom_notes,
          duration_seconds,
          is_warmup,
          is_cooldown,
          exercise:exercises(
            name,
            gif_url,
            instructions,
            met_value
          )
        `)
        .eq('template_id', workoutId)
        .order('order_index', { ascending: true });

      // Fallback to OLD workout_exercises table if new table is empty
      if (!exercises || exercises.length === 0) {
        console.log('📦 Fetching from OLD workout_exercises table for workout:', workoutId);
        const { data: oldExercises, error: oldExercisesError } = await supabase
          .from('workout_exercises')
          .select(`
            id,
            exercise_name,
            sets,
            reps,
            rest_seconds,
            order_index,
            custom_notes,
            calories_per_set,
            is_warmup,
            is_cooldown
          `)
          .eq('template_id', workoutId)
          .order('order_index', { ascending: true });

        if (oldExercisesError) {
          console.error('❌ Error fetching old exercises:', oldExercisesError);
          throw oldExercisesError;
        }

        console.log(`✅ Found ${oldExercises?.length || 0} exercises in old table`);

        // Fetch exercise details (including GIFs) from exercises table
        if (oldExercises && oldExercises.length > 0) {
          const exerciseNames = oldExercises.map(ex => ex.exercise_name);
          console.log('🔍 Looking up exercise details for:', exerciseNames);
          
          const { data: exerciseDetails } = await supabase
            .from('exercises')
            .select('name, gif_url, instructions, met_value')
            .in('name', exerciseNames);

          console.log(`📊 Found ${exerciseDetails?.length || 0} exercise details`);

          // Transform old structure to match new structure
          exercises = oldExercises.map(ex => {
            // Case-insensitive matching for exercise names
            const detail = exerciseDetails?.find(d => 
              d.name.toLowerCase().trim() === ex.exercise_name.toLowerCase().trim()
            ) || {};
            console.log(`🏋️ Mapping exercise: ${ex.exercise_name}, has gif: ${!!detail.gif_url}, gif_url: ${detail.gif_url || 'MISSING'}`);
            return {
              id: ex.id,
              sets: ex.sets,
              reps: ex.reps,
              rest_seconds: ex.rest_seconds,
              order_index: ex.order_index,
              custom_notes: ex.custom_notes,
              duration_seconds: null,
              is_warmup: ex.is_warmup,
              is_cooldown: ex.is_cooldown,
              exercise: {
                name: ex.exercise_name,
                gif_url: detail.gif_url || null,
                instructions: detail.instructions || [],
                met_value: detail.met_value || 5.0
              }
            };
          });
        }
      } else {
        console.log(`✅ Found ${exercises?.length || 0} exercises in NEW table`);
      }

      if (exercisesError) throw exercisesError;

      // Separate exercises into warmup, main, and cooldown
      const warmupExercises = exercises?.filter(ex => ex.is_warmup) || [];
      const cooldownExercises = exercises?.filter(ex => ex.is_cooldown) || [];
      const mainExercises = exercises?.filter(ex => !ex.is_warmup && !ex.is_cooldown) || [];

      console.log(`📋 Exercise breakdown - Main: ${mainExercises.length}, Warmup: ${warmupExercises.length}, Cooldown: ${cooldownExercises.length}`);

      // Transform exercises to match expected format
      const transformedExercises = mainExercises.map(ex => {
        const transformed = {
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
        };
        console.log(`✨ Transformed exercise: ${transformed.name}, gifUrl: ${transformed.gifUrl ? 'YES' : 'NO'}`);
        return transformed;
      });

      console.log(`🎯 Final transformed exercises count: ${transformedExercises.length}`);

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
