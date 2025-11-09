import { supabase } from "./supabase";

/**
 * WeeklyChallengeService
 * Handles weekly rotating challenge system with challenge-specific points
 */

const WeeklyChallengeService = {
  /**
   * Get current active weekly challenge
   */
  async getCurrentChallenge() {
    try {
      const { data, error } = await supabase
        .from('active_weekly_challenge')
        .select(`
          *,
          challenges (*)
        `)
        .eq('is_current', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No active challenge
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching current challenge:', error);
      return null;
    }
  },

  /**
   * Get user's participation in current challenge
   */
  async getUserChallengeProgress(userId) {
    try {
      // Get current challenge
      const currentChallenge = await this.getCurrentChallenge();
      if (!currentChallenge) return null;

      const { data, error } = await supabase
        .from('challenge_participations')
        .select('*')
        .eq('user_id', userId)
        .eq('challenge_id', currentChallenge.challenge_id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || {
        challenge_score: 0,
        progress_value: 0,
        completed: false
      };
    } catch (error) {
      console.error('Error fetching user challenge progress:', error);
      return null;
    }
  },

  /**
   * Get weekly challenge leaderboard (safe, anonymized)
   */
  async getChallengeLeaderboard(limit = 100) {
    try {
      const { data, error } = await supabase
        .from('safe_weekly_challenge_leaderboard')
        .select('*')
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching challenge leaderboard:', error);
      return [];
    }
  },

  /**
   * Get user's position in challenge leaderboard
   */
  async getUserChallengePosition(userId) {
    try {
      const currentChallenge = await this.getCurrentChallenge();
      if (!currentChallenge) return null;

      // Get user's score
      const { data: userProgress } = await supabase
        .from('challenge_participations')
        .select('challenge_score')
        .eq('user_id', userId)
        .eq('challenge_id', currentChallenge.challenge_id)
        .single();

      if (!userProgress) return null;

      const userScore = userProgress.challenge_score || 0;

      // Count users with higher scores
      const { count, error } = await supabase
        .from('challenge_participations')
        .select('*', { count: 'exact', head: true })
        .eq('challenge_id', currentChallenge.challenge_id)
        .gt('challenge_score', userScore);

      if (error) throw error;

      return {
        position: (count || 0) + 1,
        score: userScore,
        challenge_id: currentChallenge.challenge_id
      };
    } catch (error) {
      console.error('Error fetching user challenge position:', error);
      return null;
    }
  },

  /**
   * Update user's challenge progress when they complete an activity
   * This is called after workouts, steps, etc.
   */
  async updateChallengeProgress(userId, metricType, metricValue) {
    try {
      const { error } = await supabase
        .rpc('update_challenge_participation', {
          p_user_id: userId,
          p_metric_type: metricType,
          p_metric_value: metricValue
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating challenge progress:', error);
      return false;
    }
  },

  /**
   * Update user's points earned in current challenge
   * This is called after workout completion with the points earned from that workout
   * Points are specific to the current challenge and reset when a new challenge starts
   */
  async updateChallengePoints(userId, pointsEarned) {
    try {
      // Get current active challenge
      const currentChallenge = await this.getCurrentChallenge();
      if (!currentChallenge) {
        console.log('No active challenge to update points for');
        return false;
      }

      // Call RPC with points parameter (progress updates happen separately)
      const { error } = await supabase
        .rpc('update_challenge_participation', {
          p_user_id: userId,
          p_challenge_id: currentChallenge.challenge_id,
          p_metric_type: '', // Not used when updating points only
          p_metric_value: 0, // Don't increment progress_value
          p_points_earned: pointsEarned
        });

      if (error) {
        console.error('Error updating challenge points:', error);
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error updating challenge points:', error);
      return false;
    }
  },

  /**
   * Get challenge history (past completed challenges)
   */
  async getChallengeHistory(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('challenge_history')
        .select('*')
        .order('ended_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching challenge history:', error);
      return [];
    }
  },

  /**
   * Get user's challenge history with their placements
   */
  async getUserChallengeHistory(userId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('challenge_history')
        .select('*')
        .contains('top_10_user_ids', [userId])
        .order('ended_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Calculate user's position in each challenge
      return (data || []).map(challenge => {
        const position = challenge.top_10_user_ids?.indexOf(userId) + 1;
        const isWinner = challenge.winner_user_id === userId;
        
        return {
          ...challenge,
          user_position: position,
          is_winner: isWinner
        };
      });
    } catch (error) {
      console.error('Error fetching user challenge history:', error);
      return [];
    }
  },

  /**
   * Admin: Manually rotate to next challenge
   */
  async rotateChallenge() {
    try {
      const { data, error } = await supabase
        .rpc('rotate_weekly_challenge');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error rotating challenge:', error);
      throw error;
    }
  },

  /**
   * Admin: Get detailed leaderboard with PII
   */
  async getAdminChallengeLeaderboard(challengeId) {
    try {
      const { data, error } = await supabase
        .from('challenge_participations')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            nickname,
            email
          )
        `)
        .eq('challenge_id', challengeId)
        .order('challenge_score', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching admin challenge leaderboard:', error);
      return [];
    }
  }
};

export default WeeklyChallengeService;
