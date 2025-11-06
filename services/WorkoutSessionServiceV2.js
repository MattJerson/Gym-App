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
      if (templateError) throw templateError;
      
      // Sort exercises by order_index (not order)
      if (template?.exercises) {
        template.exercises.sort((a, b) => a.order_index - b.order_index);
      } else {
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
      // Get the workout template with exercises
      const template = await this.getWorkoutTemplate(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      if (!template.exercises || template.exercises.length === 0) {
        throw new Error('Template has no exercises');
      }
      // Create the workout session
      const { data: session, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: userId,
          workout_template_id: templateId,
          template_id: templateId,
          workout_name: template.name,
          workout_type: template.category?.name || 'Workout',
          category_id: template.category_id,
          status: 'in_progress',
          total_exercises: template.exercises.length,
          current_exercise_index: 0,
          completed_exercises: 0,
          started_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (sessionError) {
        console.error('❌ Error creating session:', sessionError);
        throw sessionError;
      }
      // Create workout_session_exercises entries for each exercise
      const exercisePromises = template.exercises.map((exercise, index) => {
        return supabase
          .from('workout_session_exercises')
          .insert({
            session_id: session.id,
            user_id: userId,
            exercise_name: exercise.exercise?.name || exercise.exercise_name || 'Unknown',
            exercise_index: index,
            target_sets: exercise.sets || 3,
            target_reps: exercise.reps || '10',
            completed_sets: 0,
            is_completed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      });

      await Promise.all(exercisePromises);
      // Fetch the created session with all details
      return await this.getSession(session.id);
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

      if (error) {
        console.error('❌ Error fetching active session:', error);
        throw error;
      }
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
      // Get session details first to get user_id
      const session = await this.getSession(sessionId);
      const userId = session?.user_id;
      const templateId = session?.workout_template_id || session?.template_id;
      // Calculate workout statistics from completed sets
      const { data: setsData, error: setsError } = await supabase
        .from('exercise_sets')
        .select('actual_reps, weight_kg, is_completed, exercise_index, exercise_name')
        .eq('session_id', sessionId)
        .eq('is_completed', true);

      if (setsError) {
        console.warn('Error fetching sets data:', setsError);
      }

      // Calculate totals
      const totalSetsCompleted = setsData?.length || 0;
      const totalRepsCompleted = setsData?.reduce((sum, set) => sum + (set.actual_reps || 0), 0) || 0;
      const totalVolumeKg = setsData?.reduce((sum, set) => sum + ((set.actual_reps || 0) * (set.weight_kg || 0)), 0) || 0;
      const completedExercises = new Set(setsData?.map(set => set.exercise_index) || []).size;

      // Calculate duration
      const startedAt = new Date(session.started_at);
      const now = new Date();
      const totalDurationSeconds = Math.floor((now - startedAt) / 1000) - (session.total_pause_duration || 0);

      // Get comprehensive user profile for accurate calorie calculation
      const { data: userProfile } = await supabase
        .from('registration_profiles')
        .select('weight_kg, height_cm, age, gender, activity_level, fitness_level')
        .eq('user_id', userId)
        .single();

      const userWeight = userProfile?.weight_kg || 70;
      const fitnessLevel = userProfile?.fitness_level || 'intermediate';

      // Activity multiplier based on fitness level
      const fitnessMultiplier = {
        'beginner': 0.9,
        'intermediate': 1.0,
        'advanced': 1.1
      }[fitnessLevel] || 1.0;

      // ✅ REALISTIC CALORIE CALCULATION using standard MET formula
      // Formula: Calories = MET × weight_kg × duration_hours
      // Resistance training MET values: 
      // - Light (3.5): bodyweight exercises, light weights
      // - Moderate (5.0): moderate weights, compound movements
      // - Vigorous (6.0-8.0): heavy weights, high intensity
      
      const durationHours = totalDurationSeconds / 3600;
      
      // Determine average MET based on workout intensity
      let averageMET = 5.0; // Default moderate intensity
      
      // Adjust MET based on sets completed (more sets = higher intensity)
      if (totalSetsCompleted >= 30) {
        averageMET = 6.5; // High intensity
      } else if (totalSetsCompleted >= 20) {
        averageMET = 5.5; // Moderate-high intensity
      } else if (totalSetsCompleted >= 10) {
        averageMET = 5.0; // Moderate intensity
      } else {
        averageMET = 4.0; // Light-moderate intensity
      }
      
      // Base calorie calculation
      const baseCalories = averageMET * userWeight * durationHours;
      
      // Small bonus for volume (weight lifted)
      const volumeBonus = Math.min(50, Math.floor(totalVolumeKg / 500)); // Max 50 calories from volume
      
      // Apply fitness multiplier
      const estimatedCalories = Math.round((baseCalories + volumeBonus) * fitnessMultiplier);
      // ⭐ CALCULATE POINTS EARNED
      // Points system based on effort and achievement
      const basePoints = 10; // Base points for completing any workout
      const setsPoints = totalSetsCompleted * 2; // 2 points per set
      const volumePoints = Math.floor(totalVolumeKg / 100); // 1 point per 100kg total volume
      const caloriePoints = Math.floor(estimatedCalories / 50); // 1 point per 50 calories
      const difficultyPoints = difficultyRating ? difficultyRating * 5 : 0; // 5 points per difficulty level
      
      const totalPointsEarned = basePoints + setsPoints + volumePoints + caloriePoints + difficultyPoints;
      // Update workout session directly - NO RPC
      const { error: updateError } = await supabase
        .from('workout_sessions')
        .update({
          status: 'completed',
          completed_at: now.toISOString(),
          total_duration_seconds: totalDurationSeconds,
          total_sets_completed: totalSetsCompleted,
          total_reps_completed: totalRepsCompleted,
          total_volume_kg: totalVolumeKg,
          completed_exercises: completedExercises,
          estimated_calories_burned: estimatedCalories,
          difficulty_rating: difficultyRating,
          notes: notes,
          updated_at: now.toISOString()
        })
        .eq('id', sessionId);
      
      if (updateError) {
        console.error('Error updating session:', updateError);
        throw updateError;
      }
      // ⭐ UPDATE USER STATS WITH POINTS
      const { data: currentStats } = await supabase
        .from('user_stats')
        .select('total_points, total_workouts, total_calories_burned, total_exercises_completed, last_workout_date, current_streak, longest_streak')
        .eq('user_id', userId)
        .maybeSingle();

      const todayDate = now.toISOString().split('T')[0];
      const lastWorkoutDate = currentStats?.last_workout_date;
      
      // Calculate streak
      let newStreak = currentStats?.current_streak || 0;
      let newLongestStreak = currentStats?.longest_streak || 0;
      
      if (lastWorkoutDate) {
        const lastDate = new Date(lastWorkoutDate);
        const todayDateObj = new Date(todayDate);
        const daysDiff = Math.floor((todayDateObj - lastDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          // Consecutive day
          newStreak += 1;
        } else if (daysDiff === 0) {
          // Same day, keep streak
          newStreak = currentStats.current_streak;
        } else {
          // Streak broken
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }
      
      newLongestStreak = Math.max(newStreak, newLongestStreak);

      if (currentStats) {
        await supabase
          .from('user_stats')
          .update({
            total_points: (currentStats.total_points || 0) + totalPointsEarned,
            total_workouts: (currentStats.total_workouts || 0) + 1,
            total_calories_burned: (currentStats.total_calories_burned || 0) + estimatedCalories,
            total_exercises_completed: (currentStats.total_exercises_completed || 0) + completedExercises,
            last_workout_date: todayDate,
            current_streak: newStreak,
            longest_streak: newLongestStreak,
            updated_at: now.toISOString()
          })
          .eq('user_id', userId);
      } else {
        // Create new stats record
        await supabase
          .from('user_stats')
          .insert({
            user_id: userId,
            total_points: totalPointsEarned,
            total_workouts: 1,
            total_calories_burned: estimatedCalories,
            total_exercises_completed: completedExercises,
            last_workout_date: todayDate,
            current_streak: 1,
            longest_streak: 1,
            created_at: now.toISOString(),
            updated_at: now.toISOString()
          });
      }

      // Update workout_session_exercises completion status
      if (setsData && setsData.length > 0) {
        for (const exerciseIndex of new Set(setsData.map(s => s.exercise_index))) {
          const exerciseSets = setsData.filter(s => s.exercise_index === exerciseIndex);
          const exerciseCompleted = exerciseSets.length;
          const exerciseReps = exerciseSets.reduce((sum, s) => sum + (s.actual_reps || 0), 0);
          const exerciseVolume = exerciseSets.reduce((sum, s) => sum + ((s.actual_reps || 0) * (s.weight_kg || 0)), 0);

          await supabase
            .from('workout_session_exercises')
            .update({
              completed_sets: exerciseCompleted,
              total_reps: exerciseReps,
              total_volume_kg: exerciseVolume,
              is_completed: exerciseCompleted > 0,
              updated_at: now.toISOString()
            })
            .eq('session_id', sessionId)
            .eq('exercise_index', exerciseIndex);
        }
      }

      // ✅ UPDATE COMPLETION COUNT in user_saved_workouts
      if (templateId) {
        const { error: updateCompletionError } = await supabase
          .from('user_saved_workouts')
          .update({
            times_completed: supabase.rpc('increment', { x: 1 }), // Will be handled by Postgres
            last_completed_at: now.toISOString(),
            total_time_spent: supabase.rpc('increment_by', { amount: Math.floor(totalDurationSeconds / 60) }),
            total_calories_burned: supabase.rpc('increment_by', { amount: estimatedCalories }),
            updated_at: now.toISOString()
          })
          .eq('user_id', userId)
          .eq('template_id', templateId);

        // Use raw SQL update for increment since RPC might not exist
        const { error: rawUpdateError } = await supabase.rpc('exec_sql', {
          query: `
            UPDATE user_saved_workouts
            SET 
              times_completed = COALESCE(times_completed, 0) + 1,
              last_completed_at = $3,
              total_time_spent = COALESCE(total_time_spent, 0) + $4,
              total_calories_burned = COALESCE(total_calories_burned, 0) + $5,
              updated_at = $3
            WHERE user_id = $1 AND template_id = $2
          `,
          params: [userId, templateId, now.toISOString(), Math.floor(totalDurationSeconds / 60), estimatedCalories]
        });

        // Try direct increment approach instead
        const { data: currentWorkout } = await supabase
          .from('user_saved_workouts')
          .select('times_completed, total_time_spent, total_calories_burned')
          .eq('user_id', userId)
          .eq('template_id', templateId)
          .maybeSingle();

        if (currentWorkout) {
          await supabase
            .from('user_saved_workouts')
            .update({
              times_completed: (currentWorkout.times_completed || 0) + 1,
              last_completed_at: now.toISOString(),
              total_time_spent: (currentWorkout.total_time_spent || 0) + Math.floor(totalDurationSeconds / 60),
              total_calories_burned: (currentWorkout.total_calories_burned || 0) + estimatedCalories,
              updated_at: now.toISOString()
            })
            .eq('user_id', userId)
            .eq('template_id', templateId);
        }
      }

      // ✅ UPDATE DAILY ACTIVITY TRACKING
      const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Check if tracking record exists for today
      const { data: existingTracking } = await supabase
        .from('daily_activity_tracking')
        .select('*')
        .eq('user_id', userId)
        .eq('tracking_date', today)
        .maybeSingle();

      if (existingTracking) {
        // Update existing record
        const newWorkoutsCompleted = (existingTracking.workouts_completed || 0) + 1;
        const newTotalMinutes = (existingTracking.total_workout_minutes || 0) + Math.floor(totalDurationSeconds / 60);
        const newTotalCalories = (existingTracking.total_calories_burned || 0) + estimatedCalories;
        const workoutsGoal = existingTracking.workouts_goal || 1;
        const caloriesGoal = existingTracking.calories_goal || 500;

        await supabase
          .from('daily_activity_tracking')
          .update({
            workouts_completed: newWorkoutsCompleted,
            workouts_percentage: (newWorkoutsCompleted / workoutsGoal) * 100,
            total_workout_minutes: newTotalMinutes,
            total_calories_burned: newTotalCalories,
            calories_percentage: (newTotalCalories / caloriesGoal) * 100,
            updated_at: now.toISOString()
          })
          .eq('id', existingTracking.id);
      } else {
        // Create new record for today
        await supabase
          .from('daily_activity_tracking')
          .insert({
            user_id: userId,
            tracking_date: today,
            workouts_completed: 1,
            workouts_goal: 1,
            workouts_percentage: 100,
            total_workout_minutes: Math.floor(totalDurationSeconds / 60),
            total_calories_burned: estimatedCalories,
            calories_goal: 500,
            calories_percentage: (estimatedCalories / 500) * 100,
            created_at: now.toISOString(),
            updated_at: now.toISOString()
          });
      }

      // 🎮 SYNC GAMIFICATION STATS after completing workout
      if (userId) {
        try {
          const GamificationDataService = require('./GamificationDataService').default;
          await GamificationDataService.syncUserStatsFromActivity(userId);
        } catch (gamErr) {
          console.warn('⚠️ Failed to sync gamification stats:', gamErr);
          // Non-fatal: workout is still completed
        }
      }

      // Return the completed session
      const completedSession = await this.getSession(sessionId);
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
