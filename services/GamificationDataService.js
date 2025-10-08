import { supabase } from "./supabase";

/**
 * GamificationDataService
 * Handles all gamification-related operations: badges, challenges, leaderboard
 */

const GamificationDataService = {
  // =============================================
  // BADGES
  // =============================================

  /**
   * Get all active badges
   */
  async getAllBadges() {
    try {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .eq('is_active', true)
        .order('points_value', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching badges:', error);
      throw error;
    }
  },

  /**
   * Get user's earned badges
   */
  async getUserBadges(userId) {
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          *,
          badges (*)
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user badges:', error);
      throw error;
    }
  },

  /**
   * Get badge progress for a specific badge
   */
  async getBadgeProgress(userId, badgeId) {
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select('progress')
        .eq('user_id', userId)
        .eq('badge_id', badgeId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" error
      return data?.progress || 0;
    } catch (error) {
      console.error('Error fetching badge progress:', error);
      return 0;
    }
  },

  /**
   * Check and award automatic badges based on user stats
   */
  async checkAndAwardBadges(userId) {
    try {
      const { data, error } = await supabase
        .rpc('check_and_award_badges', { p_user_id: userId });

      if (error) throw error;
      return data; // Returns newly awarded badges
    } catch (error) {
      console.error('Error checking badges:', error);
      throw error;
    }
  },

  // =============================================
  // CHALLENGES
  // =============================================

  /**
   * Get all active challenges
   */
  async getActiveChallenges() {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select(`
          *,
          challenge_progress(count)
        `)
        .eq('is_active', true)
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString())
        .order('start_date', { ascending: false });

      if (error) throw error;

      // Transform to include participant count
      const challenges = data.map(challenge => ({
        ...challenge,
        participants: challenge.challenge_progress?.[0]?.count || 0,
      }));

      return challenges;
    } catch (error) {
      console.error('Error fetching active challenges:', error);
      throw error;
    }
  },

  /**
   * Get upcoming challenges
   */
  async getUpcomingChallenges() {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('is_active', true)
        .gt('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(5);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching upcoming challenges:', error);
      throw error;
    }
  },

  /**
   * Join a challenge
   */
  async joinChallenge(userId, challengeId) {
    try {
      const { data, error } = await supabase
        .from('challenge_progress')
        .insert([
          {
            user_id: userId,
            challenge_id: challengeId,
            current_value: 0,
            points_earned: 0,
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error joining challenge:', error);
      throw error;
    }
  },

  /**
   * Get user's challenge progress
   */
  async getUserChallengeProgress(userId, challengeId) {
    try {
      const { data, error } = await supabase
        .from('challenge_progress')
        .select(`
          *,
          challenges (*)
        `)
        .eq('user_id', userId)
        .eq('challenge_id', challengeId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching challenge progress:', error);
      return null;
    }
  },

  /**
   * Get all user's active challenge progress
   */
  async getUserActiveChallenges(userId) {
    try {
      const { data, error } = await supabase
        .from('challenge_progress')
        .select(`
          *,
          challenges (*)
        `)
        .eq('user_id', userId)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      // Filter to only active challenges
      const activeChallenges = data.filter(
        progress => progress.challenges?.is_active &&
                   new Date(progress.challenges.end_date) >= new Date()
      );

      return activeChallenges;
    } catch (error) {
      console.error('Error fetching user challenges:', error);
      throw error;
    }
  },

  /**
   * Update challenge progress
   */
  async updateChallengeProgress(userId, challengeId, currentValue, pointsEarned) {
    try {
      const { data, error } = await supabase
        .from('challenge_progress')
        .update({
          current_value: currentValue,
          points_earned: pointsEarned,
          last_updated: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('challenge_id', challengeId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating challenge progress:', error);
      throw error;
    }
  },

  /**
   * Get challenge leaderboard
   */
  async getChallengeLeaderboard(challengeId, limit = 100) {
    try {
      const { data, error } = await supabase
        .from('challenge_progress')
        .select(`
          *,
          user:user_id (
            id,
            email,
            raw_user_meta_data
          )
        `)
        .eq('challenge_id', challengeId)
        .order('current_value', { ascending: false })
        .order('last_updated', { ascending: true })
        .limit(limit);

      if (error) throw error;

      // Transform to include user name
      const leaderboard = data.map((entry, index) => ({
        ...entry,
        position: index + 1,
        user_name: entry.user?.raw_user_meta_data?.full_name ||
                  entry.user?.raw_user_meta_data?.name ||
                  entry.user?.email?.split('@')[0] ||
                  'Anonymous',
      }));

      return leaderboard;
    } catch (error) {
      console.error('Error fetching challenge leaderboard:', error);
      throw error;
    }
  },

  // =============================================
  // USER STATS & LEADERBOARD
  // =============================================

  /**
   * Get user stats
   */
  async getUserStats(userId) {
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Create user_stats if doesn't exist
        const { data: newData, error: createError } = await supabase
          .from('user_stats')
          .insert([{ user_id: userId }])
          .select()
          .single();

        if (createError) throw createError;
        return newData;
      }

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  },

  /**
   * Update user stats (after workout completion)
   */
  async updateUserStats(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user stats:', error);
      throw error;
    }
  },

  /**
   * Increment user workout stats and check streak
   */
  async incrementWorkoutStats(userId, caloriesBurned = 0, exercisesCompleted = 0) {
    try {
      // Get current stats
      const stats = await this.getUserStats(userId);

      const today = new Date().toISOString().split('T')[0];
      const lastWorkout = stats.last_workout_date;

      let newStreak = stats.current_streak || 0;
      let longestStreak = stats.longest_streak || 0;

      // Check streak logic
      if (lastWorkout) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastWorkout === yesterdayStr) {
          // Consecutive day - increment streak
          newStreak += 1;
        } else if (lastWorkout !== today) {
          // Streak broken
          newStreak = 1;
        }
        // If lastWorkout === today, don't change streak (same day)
      } else {
        // First workout
        newStreak = 1;
      }

      if (newStreak > longestStreak) {
        longestStreak = newStreak;
      }

      // Update stats
      const updatedStats = await this.updateUserStats(userId, {
        total_workouts: (stats.total_workouts || 0) + 1,
        total_calories_burned: (stats.total_calories_burned || 0) + caloriesBurned,
        total_exercises_completed: (stats.total_exercises_completed || 0) + exercisesCompleted,
        current_streak: newStreak,
        longest_streak: longestStreak,
        last_workout_date: today,
      });

      // Check for new badges
      await this.checkAndAwardBadges(userId);

      return updatedStats;
    } catch (error) {
      console.error('Error incrementing workout stats:', error);
      throw error;
    }
  },

  /**
   * Get weekly leaderboard (PRIVACY-SAFE)
   * Only reads from safe_weekly_leaderboard. No fallback to unsafe views.
   */
  async getWeeklyLeaderboard(limit = 100) {
    try {
      const { data, error } = await supabase
        .from('safe_weekly_leaderboard')
        .select('*')
        .limit(limit);

      if (error) {
        console.error('Error querying safe_weekly_leaderboard:', error);
        throw error;
      }

      // Normalize returned rows to a predictable client shape
      const leaderboard = (data || []).map((row, index) => ({
        anon_id: row.anon_id || `anon-${index + 1}`,
        display_name: row.display_name || `User-${index + 1}`,
        total_points: Number(row.total_points) || 0,
        current_streak: Number(row.current_streak) || 0,
        total_workouts: Number(row.total_workouts) || 0,
        badges_earned: Number(row.badges_earned) || 0,
        position: row.position ?? index + 1,
      }));

      return leaderboard;
    } catch (error) {
      console.error('Error fetching weekly leaderboard (safe):', error);
      throw error;
    }
  },

  /**
   * Admin-only: full weekly leaderboard including PII (UNSAFE)
   * This must only be called from server-side code that verifies admin privileges.
   */
  async getAdminWeeklyLeaderboard(limit = 100) {
    try {
      const { data, error } = await supabase
        .from('weekly_leaderboard')
        .select('*')
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching admin weekly leaderboard (unsafe):', error);
      throw error;
    }
  },

  /**
   * Get user's position in leaderboard (safe)
   * Computes rank from user_stats so mapping isn't required to the safe anon ids.
   */
  async getUserLeaderboardPosition(userId) {
    try {
      if (!userId) return null;

      // Ensure the user's stats row exists and is up-to-date
      const { data: me, error: meErr } = await supabase
        .from('user_stats')
        .select('total_points')
        .eq('user_id', userId)
        .single();

      if (meErr) {
        console.error('Error fetching user_stats for position:', meErr);
        return null;
      }

      const myPoints = Number(me?.total_points || 0);

      // Count how many users have strictly more points (rank = count + 1)
      const { count, error: countErr } = await supabase
        .from('user_stats')
        .select('user_id', { count: 'exact', head: true })
        .gt('total_points', myPoints);

      if (countErr) {
        console.error('Error counting higher-scoring users:', countErr);
        return null;
      }

      return (count || 0) + 1;
    } catch (error) {
      console.error('Error fetching user position (safe):', error);
      return null;
    }
  },

  /**
   * Synchronize user_stats from activity tables (workouts, steps, exercise sets, badges)
   * This aggregates authoritative activity data and writes to user_stats so leaderboard/view can be populated.
   */
  async syncUserStatsFromActivity(userId) {
    try {
      if (!userId) throw new Error('userId required');

      // 1) Ensure user_stats row exists (getUserStats handles creation)
      let stats = await this.getUserStats(userId);

      // 2) Aggregate completed workouts and calories
      const { data: workouts = [], error: wErr } = await supabase
        .from('workout_logs')
        .select('calories_burned, completed_at, status')
        .eq('user_id', userId)
        .eq('status', 'completed');
      if (wErr) throw wErr;

      const total_workouts = (workouts || []).length;
      const total_calories_burned = (workouts || []).reduce((s, r) => s + (Number(r.calories_burned) || 0), 0);
      const last_workout_date = (workouts || []).reduce((max, r) => {
        const d = r.completed_at ? new Date(r.completed_at) : null;
        if (!d) return max;
        return (!max || d > max) ? d : max;
      }, null);

      // 3) Aggregate exercise completions
      const { data: sets = [], error: sErr } = await supabase
        .from('exercise_sets')
        .select('actual_reps')
        .eq('user_id', userId);
      if (sErr) throw sErr;
      const total_exercises_completed = (sets || []).reduce((s, r) => s + (Number(r.actual_reps) || 0), 0);

      // 4) Sum badge points and count badges earned
      const { data: userBadges = [], error: ubErr } = await supabase
        .from('user_badges')
        .select('badge_id, badges(points_value)')
        .eq('user_id', userId);
      if (ubErr) throw ubErr;
      const badges_earned = (userBadges || []).length;
      const badge_points_sum = (userBadges || []).reduce((s, r) => s + (r.badges?.points_value || 0), 0);

      // 5) Steps & daily activity integration
      const { data: steps = [], error: stepErr } = await supabase
        .from('steps_tracking')
        .select('step_count, tracking_date')
        .eq('user_id', userId);
      if (stepErr) throw stepErr;
      const total_steps = (steps || []).reduce((s, r) => s + (Number(r.step_count) || 0), 0);

      // 6) Compute conservative points heuristic (server-authoritative logic can vary)
      const computed_points = (total_workouts * 10) + Math.floor((total_calories_burned || 0) / 100) + (badge_points_sum || 0) + Math.floor(total_steps / 1000);

      // 7) Compute current streak from unique workout dates
      let current_streak = stats.current_streak || 0;
      if (workouts && workouts.length) {
        const uniqueDates = Array.from(new Set(workouts.map(w => w.completed_at ? new Date(w.completed_at).toISOString().split('T')[0] : null).filter(Boolean))).sort().reverse();
        let streak = 0;
        let ref = new Date();
        for (let i = 0; i < uniqueDates.length; i++) {
          const d = new Date(uniqueDates[i]);
          const expected = new Date(ref);
          expected.setDate(ref.getDate() - i);
          if (d.toISOString().split('T')[0] === expected.toISOString().split('T')[0]) {
            streak += 1;
          } else {
            break;
          }
        }
        if (streak > 0) current_streak = streak;
      }

      // 8) Persist updates
      const updates = {
        total_workouts,
        total_calories_burned,
        total_exercises_completed,
        badges_earned,
        total_steps,
        total_points: computed_points,
        last_workout_date: last_workout_date ? last_workout_date.toISOString().split('T')[0] : stats.last_workout_date,
        current_streak,
        updated_at: new Date().toISOString(),
      };

      const updated = await this.updateUserStats(userId, updates).catch(async err => {
        // If update failed because row doesn't exist, insert
        const { data: inserted, error: insErr } = await supabase
          .from('user_stats')
          .insert([{ user_id: userId, ...updates }])
          .select()
          .single();
        if (insErr) throw insErr;
        return inserted;
      });

      // 9) Award badges based on recomputed stats
      await this.checkAndAwardBadges(userId);

      return updated;
    } catch (error) {
      console.error('Error syncing user stats from activity:', error);
      throw error;
    }
  },

  /**
   * Get global leaderboard
   */
  async getGlobalLeaderboard(limit = 100) {
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select(`
          *,
          user:user_id (
            id,
            email,
            raw_user_meta_data
          )
        `)
        .order('total_points', { ascending: false })
        .order('current_streak', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Transform to include position and user name
      const leaderboard = data.map((entry, index) => ({
        ...entry,
        position: index + 1,
        user_name: entry.user?.raw_user_meta_data?.full_name ||
                  entry.user?.raw_user_meta_data?.name ||
                  entry.user?.email?.split('@')[0] ||
                  'Anonymous',
      }));

      return leaderboard;
    } catch (error) {
      console.error('Error fetching global leaderboard:', error);
      throw error;
    }
  },

  /**
   * Get user's position in leaderboard
   */
  async getUserLeaderboardPosition(userId) {
    try {
      if (!userId) return null;

      // Ensure the user's stats row exists and is up-to-date
      const { data: me, error: meErr } = await supabase
        .from('user_stats')
        .select('total_points')
        .eq('user_id', userId)
        .single();

      if (meErr) {
        console.error('Error fetching user_stats for position:', meErr);
        return null;
      }

      const myPoints = Number(me?.total_points || 0);

      // Count how many users have strictly more points (rank = count + 1)
      const { count, error: countErr } = await supabase
        .from('user_stats')
        .select('user_id', { count: 'exact', head: true })
        .gt('total_points', myPoints);

      if (countErr) {
        console.error('Error counting higher-scoring users:', countErr);
        return null;
      }

      return (count || 0) + 1;
    } catch (error) {
      console.error('Error fetching user position (safe):', error);
      return null;
    }
  },
};

export default GamificationDataService;
