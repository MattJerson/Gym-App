// Integration Guide: Weekly Challenge System
// Add these calls to existing workout/activity completion logic

import WeeklyChallengeService from './WeeklyChallengeService';

/**
 * INTEGRATION POINTS
 * Add these function calls where activities are completed
 */

// =============================================
// 1. AFTER WORKOUT COMPLETION
// =============================================
// In WorkoutSessionServiceV2.js or wherever workout is completed
// Add this after successful workout save:

async function onWorkoutCompleted(userId, workoutData) {
  try {
    // Existing workout save logic...
    
    // Update challenge progress for workouts
    await WeeklyChallengeService.updateChallengeProgress(
      userId,
      'workouts completed',
      1 // One workout completed
    );

    // Update challenge progress for calories if tracked
    if (workoutData.totalCalories) {
      await WeeklyChallengeService.updateChallengeProgress(
        userId,
        'calories burned',
        workoutData.totalCalories
      );
    }

    // Update challenge progress for exercises
    if (workoutData.totalExercises) {
      await WeeklyChallengeService.updateChallengeProgress(
        userId,
        'total exercises',
        workoutData.totalExercises
      );
    }
  } catch (error) {
    console.error('Error updating challenge progress:', error);
    // Don't throw - challenge update failure shouldn't block workout
  }
}

// =============================================
// 2. AFTER STREAK UPDATE
// =============================================
// In streak calculation logic (probably in user_stats update)
// Add this when streak is updated:

async function onStreakUpdated(userId, currentStreak) {
  try {
    await WeeklyChallengeService.updateChallengeProgress(
      userId,
      'streak days',
      currentStreak
    );
  } catch (error) {
    console.error('Error updating challenge progress for streak:', error);
  }
}

// =============================================
// 3. EXAMPLE: Full WorkoutSessionServiceV2 Integration
// =============================================
// Add this to the completeWorkout function around line 500-600

/*
// After updating user_stats with workout data:
const statsUpdateResult = await supabase
  .from('user_stats')
  .update({
    total_points: newTotalPoints,
    total_workouts: newTotalWorkouts,
    // ... other stats
  })
  .eq('user_id', userId);

// ADD THIS BLOCK:
// Update weekly challenge progress (non-blocking)
try {
  await WeeklyChallengeService.updateChallengeProgress(
    userId, 
    'workouts completed', 
    1
  );
  
  if (totalCaloriesBurned > 0) {
    await WeeklyChallengeService.updateChallengeProgress(
      userId,
      'calories burned',
      totalCaloriesBurned
    );
  }

  if (totalExercisesCompleted > 0) {
    await WeeklyChallengeService.updateChallengeProgress(
      userId,
      'total exercises',
      totalExercisesCompleted
    );
  }

  // Update streak if applicable
  const { data: userStats } = await supabase
    .from('user_stats')
    .select('current_streak')
    .eq('user_id', userId)
    .single();
    
  if (userStats?.current_streak) {
    await WeeklyChallengeService.updateChallengeProgress(
      userId,
      'streak days',
      userStats.current_streak
    );
  }
} catch (challengeError) {
  // Log but don't fail the workout
  console.error('Failed to update challenge progress:', challengeError);
}
*/

// =============================================
// 4. UI INTEGRATION - Get Challenge Data
// =============================================

// Get current challenge for display
export async function getCurrentChallengeData() {
  const challenge = await WeeklyChallengeService.getCurrentChallenge();
  return challenge;
}

// Get user's progress in current challenge
export async function getUserChallengeData(userId) {
  const [challenge, progress, position] = await Promise.all([
    WeeklyChallengeService.getCurrentChallenge(),
    WeeklyChallengeService.getUserChallengeProgress(userId),
    WeeklyChallengeService.getUserChallengePosition(userId)
  ]);

  return {
    challenge: challenge?.challenges,
    score: progress?.challenge_score || 0,
    progress: progress?.progress_value || 0,
    completed: progress?.completed || false,
    position: position?.position || null
  };
}

// Get leaderboard for display
export async function getChallengeLeaderboardData(limit = 100) {
  const leaderboard = await WeeklyChallengeService.getChallengeLeaderboard(limit);
  return leaderboard;
}

// =============================================
// 5. ADMIN INTEGRATION
// =============================================

// Manual rotation (for admin panel)
export async function adminRotateChallenge() {
  try {
    const result = await WeeklyChallengeService.rotateChallenge();
    return result;
  } catch (error) {
    console.error('Admin challenge rotation failed:', error);
    throw error;
  }
}

// Get detailed leaderboard for admin
export async function adminGetChallengeLeaderboard(challengeId) {
  try {
    const leaderboard = await WeeklyChallengeService.getAdminChallengeLeaderboard(challengeId);
    return leaderboard;
  } catch (error) {
    console.error('Failed to fetch admin leaderboard:', error);
    throw error;
  }
}

export default {
  onWorkoutCompleted,
  onStreakUpdated,
  getCurrentChallengeData,
  getUserChallengeData,
  getChallengeLeaderboardData,
  adminRotateChallenge,
  adminGetChallengeLeaderboard
};
