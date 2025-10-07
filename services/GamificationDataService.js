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
   * Get weekly leaderboard
   */
  async getWeeklyLeaderboard(limit = 100) {
    try {
      const { data, error } = await supabase
        .from('weekly_leaderboard')
        .select('*')
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching weekly leaderboard:', error);
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
      const { data, error } = await supabase
        .from('weekly_leaderboard')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data?.position || null;
    } catch (error) {
      console.error('Error fetching user position:', error);
      return null;
    }
  },
};

export default GamificationDataService;
