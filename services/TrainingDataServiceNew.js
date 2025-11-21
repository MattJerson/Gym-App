/**
 * NEW TRAINING DATA SERVICE
 * Updated to use the new exercise system with MET-based calorie calculation
 */

import { supabase } from './supabase.js';
import { getLocalDateString, getLocalStartOfDay, getLocalEndOfDay, getLocalDayOfWeek, getISOString } from '../utils/dateUtils.js';

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
          rest_seconds,
          order_index,
          custom_notes,
          exercise:exercises(
            name
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
      const today = getLocalDateString(); // Use local timezone
      
      // Direct query instead of RPC
      const { data, error } = await supabase
        .from('daily_activity_tracking')
        .select('*')
        .eq('user_id', userId)
        .eq('tracking_date', today)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }

      const stats = data || null;

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
      // Direct query with category join to get color
      const { data, error } = await supabase
        .from('workout_sessions')
        .select(`
          id,
          workout_template_id,
          template_id,
          workout_name,
          workout_type,
          completed_exercises,
          total_exercises,
          progress_percentage,
          started_at,
          total_pause_duration,
          estimated_calories_burned,
          category_id,
          workout_categories!inner(color)
        `)
        .eq('user_id', userId)
        .in('status', ['in_progress', 'paused'])
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (!data) return null;

      // Calculate elapsed time
      const startedAt = new Date(data.started_at);
      const now = new Date();
      const elapsedSeconds = Math.floor((now - startedAt) / 1000) - (data.total_pause_duration || 0);
      
      // Use progress_percentage from database if available, otherwise calculate from completed_exercises
      const progressPercentage = data.progress_percentage !== null && data.progress_percentage !== undefined
        ? data.progress_percentage
        : (data.completed_exercises / data.total_exercises) * 100;
      
      return {
        id: data.workout_template_id || data.template_id,
        sessionId: data.id,
        workoutName: data.workout_name,
        workoutType: data.workout_type,
        completedExercises: data.completed_exercises,
        totalExercises: data.total_exercises,
        progressPercentage: Math.round(progressPercentage), // 0-100
        timeElapsed: Math.floor(elapsedSeconds / 60),
        progress: progressPercentage / 100, // 0-1 for backward compatibility
        caloriesBurned: data.estimated_calories_burned || 0,
        categoryColor: data.workout_categories?.color || "#FCD34D"
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
      updatedAt: getISOString(), // Use local timezone aware ISO string
      progress: exerciseData.progress
    };
  },

  /**
   * Fetch today's planned workout
   */
  async fetchTodaysWorkout(userId) {
    try {
      const today = new Date();
      const dayOfWeek = getLocalDayOfWeek(today); // Use local timezone
      // Clean up orphaned entries in multiple ways:
      
      // 1. Remove entries with null template_id
      const { data: orphanedWorkouts } = await supabase
        .from('user_saved_workouts')
        .select('id, template_id')
        .eq('user_id', userId)
        .is('template_id', null);
      
      if (orphanedWorkouts && orphanedWorkouts.length > 0) {
        await supabase
          .from('user_saved_workouts')
          .delete()
          .eq('user_id', userId)
          .is('template_id', null);
      }
      
      // 2. Remove entries where the template is inactive
      const { data: inactiveTemplateWorkouts } = await supabase
        .from('user_saved_workouts')
        .select('id, template_id, workout_templates!inner(id, is_active)')
        .eq('user_id', userId)
        .eq('workout_templates.is_active', false);
      
      if (inactiveTemplateWorkouts && inactiveTemplateWorkouts.length > 0) {
        const idsToDelete = inactiveTemplateWorkouts.map(w => w.id);
        await supabase
          .from('user_saved_workouts')
          .delete()
          .in('id', idsToDelete)
          .eq('user_id', userId);
      }
      
      // 3. Remove entries where the template doesn't exist at all (LEFT JOIN returns null)
      const { data: missingTemplateWorkouts } = await supabase
        .from('user_saved_workouts')
        .select('id, template_id, workout_templates(id)')
        .eq('user_id', userId)
        .not('template_id', 'is', null);
      
      const orphanedByMissingTemplate = missingTemplateWorkouts?.filter(w => !w.workout_templates) || [];
      if (orphanedByMissingTemplate.length > 0) {
        const idsToDelete = orphanedByMissingTemplate.map(w => w.id);
        await supabase
          .from('user_saved_workouts')
          .delete()
          .in('id', idsToDelete)
          .eq('user_id', userId);
      }
      
      // Get all scheduled workouts for debugging
      const { data: allScheduled } = await supabase
        .from('user_saved_workouts')
        .select('id, template_id, scheduled_day_of_week, is_scheduled, workout_templates(name, is_active)')
        .eq('user_id', userId)
        .eq('scheduled_day_of_week', dayOfWeek)
        .eq('is_scheduled', true);
      const { data: workouts, error: workoutsError } = await supabase
        .from('user_saved_workouts')
        .select(`
          id,
          template_id,
          scheduled_day_of_week,
          workout_templates!inner (
            id,
            name,
            difficulty,
            duration_minutes,
            estimated_calories,
            category_id,
            is_active,
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
        .eq('workout_templates.is_active', true)
        .not('template_id', 'is', null);
      if (workoutsError) {
        console.error('Error fetching scheduled workouts:', workoutsError);
        return null;
      }
      
      if (!workouts || workouts.length === 0) {
        return null;
      }

      // Filter out any workouts where the template is null or doesn't exist
      const validWorkouts = workouts.filter(w => w.workout_templates && w.workout_templates.is_active);
      if (validWorkouts.length === 0) {
        return null;
      }

      const workout = validWorkouts[0];
      const template = workout.workout_templates;
      
      // Check if this workout was already completed today (using local timezone)
      const todayStart = getLocalStartOfDay();
      const todayEnd = getLocalEndOfDay();
      
      const { data: completedToday, error: completedError } = await supabase
        .from('workout_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('workout_template_id', template.id)
        .eq('status', 'completed')
        .gte('completed_at', todayStart.toISOString())
        .lte('completed_at', todayEnd.toISOString())
        .limit(1);
      
      // If workout was already completed today, don't show it
      if (completedToday && completedToday.length > 0) {
        console.log(`Today's workout already completed - hiding card`);
        return null;
      }
      
      // Get exercise count
      const { count: exerciseCount } = await supabase
        .from('workout_template_exercises')
        .select('*', { count: 'exact', head: true })
        .eq('template_id', template.id);

      // Get day name
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const scheduledDay = daysOfWeek[workout.scheduled_day_of_week];

      return {
        id: template.id,
        workoutName: template.name,
        workoutType: template.workout_categories?.name || 'Workout',
        difficulty: template.difficulty,
        estimatedDuration: template.duration_minutes,
        totalExercises: exerciseCount || 0,
        categoryColor: template.workout_categories?.color || '#A3E635',
        categoryIcon: template.workout_categories?.icon || 'dumbbell',
        scheduledDay: scheduledDay
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
