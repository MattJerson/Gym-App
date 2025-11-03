import { supabase } from './supabase';

/**
 * Workout Session Service V2
 * Fully integrated with Supabase for real-time workout tracking
 */
export const WorkoutSessionServiceV2 = {
  
  /**
   * Get workout template with exercises by ID
   */
  async getWorkoutTemplate(templateId) {
    try {
      console.log('WorkoutSessionServiceV2.getWorkoutTemplate - templateId:', templateId);
      
      const { data: template, error: templateError } = await supabase
        .from('workout_templates')
        .select(`
          *,
          category:workout_categories(id, name, color, icon),
          exercises:workout_template_exercises(
            *,
            exercise:exercises(
              id,
              name,
              gif_url,
              instructions,
              met_value,
              target_muscles:exercise_target_muscle_junction(
                muscle:exercise_target_muscles(name)
              )
            )
          )
        `)
        .eq('id', templateId)
        .single();

      console.log('Query result - template:', template);
      console.log('Query result - error:', templateError);

      if (templateError) throw templateError;
      
      // Sort exercises by order_index (not order)
      if (template?.exercises) {
        console.log('Raw exercises from DB:', template.exercises);
        template.exercises.sort((a, b) => a.order_index - b.order_index);
        console.log('Sorted exercises:', template.exercises.length);
      } else {
        console.log('No exercises found in template');
      }
      
      return template;
    } catch (error) {
      console.error('Error fetching workout template:', error);
      throw error;
    }
  },

  /**
   * Create a new workout session from a template
   */
  async createSession(userId, templateId) {
    try {
      const { data: sessionId, error } = await supabase
        .rpc('create_workout_session_from_template', {
          p_user_id: userId,
          p_template_id: templateId
        });

      if (error) throw error;
      
      // Fetch the created session with all details
      return await this.getSession(sessionId);
    } catch (error) {
      console.error('Error creating workout session:', error);
      throw error;
    }
  },

  /**
   * Get session with all exercises and sets
   */
  async getSession(sessionId) {
    try {
      const { data: session, error: sessionError } = await supabase
        .from('workout_sessions')
        .select(`
          *,
          exercises:workout_session_exercises(*),
          sets:exercise_sets(*)
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      // Sort exercises and sets
      if (session?.exercises) {
        session.exercises.sort((a, b) => a.exercise_index - b.exercise_index);
      }
      if (session?.sets) {
        session.sets.sort((a, b) => {
          if (a.exercise_index !== b.exercise_index) {
            return a.exercise_index - b.exercise_index;
          }
          return a.set_number - b.set_number;
        });
      }

      return session;
    } catch (error) {
      console.error('Error fetching session:', error);
      throw error;
    }
  },

  /**
   * Get current active session for user
   */
  async getActiveSession(userId) {
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select(`
          *,
          exercises:workout_session_exercises(*),
          sets:exercise_sets(*)
        `)
        .eq('user_id', userId)
        .in('status', ['in_progress', 'paused'])
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Sort exercises and sets
        if (data.exercises) {
          data.exercises.sort((a, b) => a.exercise_index - b.exercise_index);
        }
        if (data.sets) {
          data.sets.sort((a, b) => {
            if (a.exercise_index !== b.exercise_index) {
              return a.exercise_index - b.exercise_index;
            }
            return a.set_number - b.set_number;
          });
        }
      }

      return data;
    } catch (error) {
      console.error('Error fetching active session:', error);
      throw error;
    }
  },

  /**
   * Start an exercise in the session
   */
  async startExercise(sessionId, exerciseIndex) {
    try {
      const { data, error } = await supabase
        .from('workout_session_exercises')
        .update({
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .eq('exercise_index', exerciseIndex)
        .select()
        .single();

      if (error) throw error;

      // Update session current exercise index
      await supabase
        .from('workout_sessions')
        .update({
          current_exercise_index: exerciseIndex,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      return data;
    } catch (error) {
      console.error('Error starting exercise:', error);
      throw error;
    }
  },

  /**
   * Log a set
   */
  async logSet(sessionId, userId, exerciseIndex, setNumber, setData) {
    try {
      const { exercise_name, actual_reps, weight_kg, target_reps, is_completed = true, rpe = null, notes = null } = setData;

      // Check if set already exists
      const { data: existingSet } = await supabase
        .from('exercise_sets')
        .select('id')
        .eq('session_id', sessionId)
        .eq('exercise_index', exerciseIndex)
        .eq('set_number', setNumber)
        .maybeSingle();

      let result;

      if (existingSet) {
        // Update existing set
        const { data, error } = await supabase
          .from('exercise_sets')
          .update({
            actual_reps,
            weight_kg,
            is_completed,
            rpe,
            notes,
            completed_at: is_completed ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSet.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Create new set
        const { data, error } = await supabase
          .from('exercise_sets')
          .insert({
            session_id: sessionId,
            user_id: userId,
            exercise_name,
            exercise_index: exerciseIndex,
            set_number: setNumber,
            target_reps,
            actual_reps,
            weight_kg,
            is_completed,
            rpe,
            notes,
            started_at: new Date().toISOString(),
            completed_at: is_completed ? new Date().toISOString() : null
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      return result;
    } catch (error) {
      console.error('Error logging set:', error);
      throw error;
    }
  },

  /**
   * Undo a completed set (mark as not completed)
   */
  async undoSet(sessionId, exerciseIndex, setNumber) {
    try {
      const { data, error } = await supabase
        .from('exercise_sets')
        .update({
          is_completed: false,
          completed_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .eq('exercise_index', exerciseIndex)
        .eq('set_number', setNumber)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error undoing set:', error);
      throw error;
    }
  },

  /**
   * Start rest timer for a set
   */
  async startRestTimer(sessionId, exerciseIndex, setNumber) {
    try {
      const { data, error } = await supabase
        .from('exercise_sets')
        .update({
          rest_started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .eq('exercise_index', exerciseIndex)
        .eq('set_number', setNumber)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error starting rest timer:', error);
      throw error;
    }
  },

  /**
   * Pause workout session
   */
  async pauseSession(sessionId) {
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .update({
          status: 'paused',
          paused_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error pausing session:', error);
      throw error;
    }
  },

  /**
   * Resume workout session
   */
  async resumeSession(sessionId) {
    try {
      // Calculate pause duration
      const { data: session } = await supabase
        .from('workout_sessions')
        .select('paused_at, total_pause_duration')
        .eq('id', sessionId)
        .single();

      let additionalPauseDuration = 0;
      if (session?.paused_at) {
        additionalPauseDuration = Math.floor(
          (new Date() - new Date(session.paused_at)) / 1000
        );
      }

      const { data, error } = await supabase
        .from('workout_sessions')
        .update({
          status: 'in_progress',
          paused_at: null,
          total_pause_duration: (session?.total_pause_duration || 0) + additionalPauseDuration,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error resuming session:', error);
      throw error;
    }
  },

  /**
   * Complete workout session
   */
  async completeSession(sessionId, difficultyRating = null, notes = null) {
    try {
      console.log('Completing workout session:', sessionId);
      
      // Get session details first to get user_id
      const session = await this.getSession(sessionId);
      const userId = session?.user_id;
      
      // Try using the RPC function first
      const { error } = await supabase
        .rpc('complete_workout_session', {
          p_session_id: sessionId,
          p_difficulty_rating: difficultyRating,
          p_notes: notes
        });

      if (error) {
        console.warn('RPC complete_workout_session failed, using fallback:', error);
        // Fallback: manually update the session
        const { error: updateError } = await supabase
          .from('workout_sessions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            difficulty_rating: difficultyRating,
            notes: notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);
        
        if (updateError) throw updateError;
        console.log('Session marked as completed using fallback');
      } else {
        console.log('Session marked as completed using RPC');
      }

      // 🎮 SYNC GAMIFICATION STATS after completing workout
      if (userId) {
        try {
          const GamificationDataService = require('./GamificationDataService').default;
          await GamificationDataService.syncUserStatsFromActivity(userId);
          console.log('✅ Gamification stats synced for user:', userId);
        } catch (gamErr) {
          console.warn('⚠️ Failed to sync gamification stats:', gamErr);
          // Non-fatal: workout is still completed
        }
      }

      const completedSession = await this.getSession(sessionId);
      console.log('Final session status:', completedSession?.status);
      return completedSession;
    } catch (error) {
      console.error('Error completing session:', error);
      throw error;
    }
  },

  /**
   * Delete/abandon workout session
   */
  async abandonSession(sessionId) {
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .update({
          status: 'abandoned',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error abandoning session:', error);
      throw error;
    }
  },

  /**
   * Get exercise history for tracking progress
   */
  async getExerciseHistory(userId, exerciseName, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('exercise_sets')
        .select(`
          *,
          session:workout_sessions(workout_name, started_at)
        `)
        .eq('user_id', userId)
        .eq('exercise_name', exerciseName)
        .eq('is_completed', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching exercise history:', error);
      return [];
    }
  },

  /**
   * Get user's personal records
   */
  async getPersonalRecords(userId, exerciseName = null) {
    try {
      let query = supabase
        .from('workout_personal_records')
        .select('*')
        .eq('user_id', userId);

      if (exerciseName) {
        query = query.eq('exercise_name', exerciseName);
      }

      const { data, error } = await query.order('achieved_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching personal records:', error);
      return [];
    }
  },

  /**
   * Subscribe to session updates (real-time)
   */
  subscribeToSession(sessionId, callback) {
    const subscription = supabase
      .channel(`session:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workout_sessions',
          filter: `id=eq.${sessionId}`
        },
        callback
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }
};
