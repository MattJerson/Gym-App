/**
 * NEW TRAINING DATA SERVICE
 * Updated to use the new exercise system with MET-based calorie calculation
 */

import { supabase } from './supabase.js';

export const TrainingDataServiceNew = {
  /**
   * Fetch exercise with full details including GIF, instructions, muscles, equipment
   */
  async fetchExerciseById(exerciseId) {
    const { data, error } = await supabase
      .from('exercises')
      .select(`
        *,
        target_muscles:exercise_target_muscle_junction(
          is_primary,
          muscle:exercise_target_muscles(name)
        ),
        body_parts:exercise_body_part_junction(
          body_part:exercise_body_parts(name)
        ),
        equipment:exercise_equipment_junction(
          equipment:exercise_equipments(name)
        )
      `)
      .eq('id', exerciseId)
      .single();
    
    if (error) {
      console.error('Error fetching exercise:', error);
      return null;
    }
    
    return {
      id: data.id,
      exerciseId: data.exercise_id,
      name: data.name,
      gifUrl: data.gif_url,
      instructions: data.instructions,
      metValue: data.met_value,
      targetMuscles: data.target_muscles
        ?.filter(tm => tm.is_primary)
        .map(tm => tm.muscle.name) || [],
      secondaryMuscles: data.target_muscles
        ?.filter(tm => !tm.is_primary)
        .map(tm => tm.muscle.name) || [],
      bodyParts: data.body_parts?.map(bp => bp.body_part.name) || [],
      equipment: data.equipment?.map(eq => eq.equipment.name) || []
    };
  },

  /**
   * Fetch workout template with new exercise system
   */
  async fetchWorkoutTemplate(templateId) {
    const { data, error } = await supabase
      .from('workout_templates')
      .select(`
        *,
        category:workout_categories(name, color, icon),
        exercises:workout_template_exercises(
          id,
          sets,
          reps,
          duration_seconds,
          rest_seconds,
          order_index,
          is_warmup,
          is_cooldown,
          custom_notes,
          exercise:exercises(
            id,
            exercise_id,
            name,
            gif_url,
            instructions,
            met_value,
            target_muscles:exercise_target_muscle_junction(
              is_primary,
              muscle:exercise_target_muscles(name)
            ),
            body_parts:exercise_body_part_junction(
              body_part:exercise_body_parts(name)
            ),
            equipment:exercise_equipment_junction(
              equipment:exercise_equipments(name)
            )
          )
        )
      `)
      .eq('id', templateId)
      .single();
    
    if (error) {
      console.error('Error fetching workout template:', error);
      return null;
    }
    
    // Sort exercises by order_index
    const sortedExercises = (data.exercises || []).sort((a, b) => 
      a.order_index - b.order_index
    );
    
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      difficulty: data.difficulty,
      durationMinutes: data.duration_minutes,
      averageMetValue: data.average_met_value,
      category: data.category,
      exercises: sortedExercises.map(ex => ({
        id: ex.id,
        sets: ex.sets,
        reps: ex.reps,
        durationSeconds: ex.duration_seconds,
        restSeconds: ex.rest_seconds,
        orderIndex: ex.order_index,
        isWarmup: ex.is_warmup,
        isCooldown: ex.is_cooldown,
        customNotes: ex.custom_notes,
        exercise: {
          id: ex.exercise.id,
          exerciseId: ex.exercise.exercise_id,
          name: ex.exercise.name,
          gifUrl: ex.exercise.gif_url,
          instructions: ex.exercise.instructions,
          metValue: ex.exercise.met_value,
          targetMuscles: ex.exercise.target_muscles
            ?.filter(tm => tm.is_primary)
            .map(tm => tm.muscle.name) || [],
          secondaryMuscles: ex.exercise.target_muscles
            ?.filter(tm => !tm.is_primary)
            .map(tm => tm.muscle.name) || [],
          bodyParts: ex.exercise.body_parts?.map(bp => bp.body_part.name) || [],
          equipment: ex.exercise.equipment?.map(eq => eq.equipment.name) || []
        }
      }))
    };
  },

  /**
   * Calculate calories burned for a workout using MET values
   * Formula: MET × weight(kg) × duration(hours)
   */
  async calculateWorkoutCalories(userId, templateId, durationMinutes) {
    const { data, error } = await supabase.rpc('calculate_workout_calories', {
      p_user_id: userId,
      p_template_id: templateId,
      p_duration_minutes: durationMinutes
    });
    
    if (error) {
      console.error('Error calculating calories:', error);
      return 0;
    }
    
    return data || 0;
  },

  /**
   * Calculate calories for individual exercise
   */
  async calculateExerciseCalories(userId, exerciseId, durationMinutes) {
    const { data, error } = await supabase.rpc('calculate_exercise_calories', {
      p_user_id: userId,
      p_exercise_id: exerciseId,
      p_duration_minutes: durationMinutes
    });
    
    if (error) {
      console.error('Error calculating exercise calories:', error);
      return 0;
    }
    
    return data || 0;
  },

  /**
   * Search exercises by name, muscle group, equipment, or body part
   */
  async searchExercises(query, filters = {}) {
    let queryBuilder = supabase
      .from('exercises')
      .select(`
        *,
        target_muscles:exercise_target_muscle_junction(
          is_primary,
          muscle:exercise_target_muscles(name)
        ),
        body_parts:exercise_body_part_junction(
          body_part:exercise_body_parts(name)
        ),
        equipment:exercise_equipment_junction(
          equipment:exercise_equipments(name)
        )
      `);
    
    // Text search
    if (query) {
      queryBuilder = queryBuilder.ilike('name', `%${query}%`);
    }
    
    const { data, error } = await queryBuilder.limit(50);
    
    if (error) {
      console.error('Error searching exercises:', error);
      return [];
    }
    
    let results = data || [];
    
    // Apply filters
    if (filters.muscle) {
      results = results.filter(ex => 
        ex.target_muscles?.some(tm => 
          tm.muscle.name.toLowerCase().includes(filters.muscle.toLowerCase())
        )
      );
    }
    
    if (filters.equipment) {
      results = results.filter(ex =>
        ex.equipment?.some(eq =>
          eq.equipment.name.toLowerCase().includes(filters.equipment.toLowerCase())
        )
      );
    }
    
    if (filters.bodyPart) {
      results = results.filter(ex =>
        ex.body_parts?.some(bp =>
          bp.body_part.name.toLowerCase().includes(filters.bodyPart.toLowerCase())
        )
      );
    }
    
    return results.map(ex => ({
      id: ex.id,
      exerciseId: ex.exercise_id,
      name: ex.name,
      gifUrl: ex.gif_url,
      metValue: ex.met_value,
      targetMuscles: ex.target_muscles
        ?.filter(tm => tm.is_primary)
        .map(tm => tm.muscle.name) || [],
      secondaryMuscles: ex.target_muscles
        ?.filter(tm => !tm.is_primary)
        .map(tm => tm.muscle.name) || [],
      bodyParts: ex.body_parts?.map(bp => bp.body_part.name) || [],
      equipment: ex.equipment?.map(eq => eq.equipment.name) || []
    }));
  },

  /**
   * Get all available filters (muscles, equipment, body parts)
   */
  async getExerciseFilters() {
    const [muscles, equipment, bodyParts] = await Promise.all([
      supabase.from('exercise_target_muscles').select('name').order('name'),
      supabase.from('exercise_equipments').select('name').order('name'),
      supabase.from('exercise_body_parts').select('name').order('name')
    ]);
    
    return {
      muscles: muscles.data?.map(m => m.name) || [],
      equipment: equipment.data?.map(e => e.name) || [],
      bodyParts: bodyParts.data?.map(bp => bp.name) || []
    };
  },

  /**
   * Fetch user notifications (compatibility method)
   */
  async fetchUserNotifications(userId) {
    // TODO: Implement notifications system
    return {
      count: 0,
      messages: []
    };
  },

  /**
   * Fetch workout progress data
   */
  async fetchWorkoutProgress(userId) {
    try {
      const { data, error } = await supabase
        .rpc('get_user_daily_stats', { 
          p_user_id: userId,
          p_date: new Date().toISOString().split('T')[0]
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
        weeklyStreak: 0,
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

  /**
   * Fetch current/continue workout (in-progress session)
   */
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
        timeElapsed: Math.floor(session.elapsed_seconds / 60),
        progress: session.progress_percentage / 100,
        caloriesBurned: session.calories_burned || 0
      };
    } catch (error) {
      console.error('Error fetching continue workout:', error);
      return null;
    }
  },

  /**
   * Update workout progress
   */
  async updateWorkoutProgress(userId, workoutId, exerciseData) {
    return {
      success: true,
      updatedAt: new Date().toISOString(),
      progress: exerciseData.progress
    };
  },

  /**
   * Fetch today's planned workout
   */
  async fetchTodaysWorkout(userId) {
    try {
      const today = new Date();
      const dayOfWeek = today.getDay();
      
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
        console.error('Error fetching scheduled workouts:', workoutsError);
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

      return {
        id: template.id,
        name: template.name,
        difficulty: template.difficulty,
        duration: template.duration_minutes,
        category: {
          color: template.workout_categories?.color || '#FF6B6B',
          icon: template.workout_categories?.icon || 'fitness',
          name: template.workout_categories?.name || 'Workout'
        }
      };
    } catch (error) {
      console.error('Error fetching today\'s workout:', error);
      return null;
    }
  },

  /**
   * Fetch recent workouts
   */
  async fetchRecentWorkouts(userId) {
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select(`
          id,
          workout_name,
          started_at,
          completed_at,
          estimated_calories_burned,
          template_id,
          workout_templates!template_id (
            category_id,
            workout_categories (
              name,
              color,
              icon
            )
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      return data?.map(session => ({
        id: session.id,
        name: session.workout_name,
        date: session.completed_at,
        calories: session.estimated_calories_burned || 0,
        category: {
          name: session.workout_templates?.workout_categories?.name || 'Workout',
          color: session.workout_templates?.workout_categories?.color || '#FF6B6B',
          icon: session.workout_templates?.workout_categories?.icon || 'fitness'
        }
      })) || [];
    } catch (error) {
      console.error('Error fetching recent workouts:', error);
      return [];
    }
  }
};
