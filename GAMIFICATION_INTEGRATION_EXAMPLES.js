/**
 * Example: How to Integrate Gamification with Workout Completion
 * 
 * This file shows where and how to add gamification tracking
 * to your workout completion flow.
 */

import GamificationDataService from '../services/GamificationDataService';
import { supabase } from '../services/supabase';

/**
 * EXAMPLE 1: After completing a workout session
 * 
 * Location: Wherever you handle workout completion
 * (e.g., in WorkoutSessionService.js or workout detail screen)
 */
export const completeWorkout = async (workoutData) => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Save workout to database (your existing code)
    const { data: workoutSession, error } = await supabase
      .from('workout_sessions') // or your table name
      .insert([{
        user_id: user.id,
        workout_id: workoutData.workoutId,
        duration_minutes: workoutData.duration,
        calories_burned: workoutData.calories,
        exercises_completed: workoutData.exerciseCount,
        completed_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;

    // 2. 🎮 UPDATE GAMIFICATION STATS
    const updatedStats = await GamificationDataService.incrementWorkoutStats(
      user.id,
      workoutData.calories || 0,        // Calories burned
      workoutData.exerciseCount || 0    // Number of exercises completed
    );

    console.log('🎉 Stats Updated:', updatedStats);
    // This automatically:
    // - Increments total_workouts
    // - Adds calories to total_calories_burned
    // - Adds exercises to total_exercises_completed  
    // - Updates current_streak (checks if consecutive day)
    // - Updates longest_streak if needed
    // - Checks and awards eligible badges!

    // 3. 🏆 CHECK FOR NEW BADGES
    const newBadges = await GamificationDataService.checkAndAwardBadges(user.id);
    if (newBadges && newBadges.length > 0) {
      // Show a celebration modal/toast!
      console.log('🏅 New Badges Earned:', newBadges);
      // You could trigger a modal here showing the new badges
      showBadgeEarnedModal(newBadges);
    }

    // 4. 🔥 UPDATE ACTIVE CHALLENGES (if user is enrolled)
    const activeChallenges = await GamificationDataService.getUserActiveChallenges(user.id);
    
    for (const challengeProgress of activeChallenges) {
      const challenge = challengeProgress.challenges;
      
      // Update based on challenge metric type
      if (challenge.metric_type === 'workouts_completed') {
        await GamificationDataService.updateChallengeProgress(
          user.id,
          challenge.id,
          challengeProgress.current_value + 1,  // Increment workout count
          challengeProgress.points_earned + 10  // Add points
        );
      } else if (challenge.metric_type === 'calories_burned') {
        await GamificationDataService.updateChallengeProgress(
          user.id,
          challenge.id,
          challengeProgress.current_value + (workoutData.calories || 0),
          challengeProgress.points_earned + Math.floor((workoutData.calories || 0) / 10)
        );
      } else if (challenge.metric_type === 'total_exercises') {
        await GamificationDataService.updateChallengeProgress(
          user.id,
          challenge.id,
          challengeProgress.current_value + (workoutData.exerciseCount || 0),
          challengeProgress.points_earned + (workoutData.exerciseCount || 0)
        );
      }
    }

    return {
      success: true,
      workoutSession,
      updatedStats,
      newBadges,
    };
  } catch (error) {
    console.error('Error completing workout:', error);
    throw error;
  }
};

/**
 * EXAMPLE 2: Show badge earned modal/notification
 */
const showBadgeEarnedModal = (badges) => {
  // Example: Show an alert or custom modal
  badges.forEach(badge => {
    console.log(`🎉 You earned: ${badge.badge_icon} ${badge.badge_name}!`);
    
    // You could use a toast library:
    // Toast.show({
    //   type: 'success',
    //   text1: 'New Badge Earned! 🏅',
    //   text2: `${badge.badge_icon} ${badge.badge_name}`,
    // });
    
    // Or show a custom modal with animation
    // showCustomBadgeModal(badge);
  });
};

/**
 * EXAMPLE 3: Join a challenge from the challenges screen
 */
export const joinChallengeHandler = async (challengeId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await GamificationDataService.joinChallenge(user.id, challengeId);
    
    console.log('✅ Joined challenge successfully!');
    // Show success message to user
    // Refresh challenges list
  } catch (error) {
    console.error('Error joining challenge:', error);
    // Show error message (maybe already enrolled?)
  }
};

/**
 * EXAMPLE 4: Display user stats in a header or widget
 */
export const getUserStatsWidget = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const stats = await GamificationDataService.getUserStats(user.id);
    
    return {
      streak: stats.current_streak || 0,
      workouts: stats.total_workouts || 0,
      points: stats.total_points || 0,
      badges: stats.badges_earned || 0,
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return null;
  }
};

/**
 * EXAMPLE 5: Check if user should earn time-based badges
 * (Call this at specific times or after specific actions)
 */
export const checkSpecialBadges = async (workoutTime) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const hour = new Date(workoutTime).getHours();
    
    // Early Bird badge (before 6 AM)
    if (hour < 6) {
      // Award Early Bird badge manually
      const earlyBirdBadge = await supabase
        .from('badges')
        .select('id')
        .eq('name', 'Early Bird')
        .single();
      
      if (earlyBirdBadge.data) {
        await supabase
          .from('user_badges')
          .insert([{
            user_id: user.id,
            badge_id: earlyBirdBadge.data.id,
          }])
          .onConflict('user_id, badge_id')
          .ignore();
      }
    }
    
    // Night Owl badge (after 10 PM)
    if (hour >= 22) {
      const nightOwlBadge = await supabase
        .from('badges')
        .select('id')
        .eq('name', 'Night Owl')
        .single();
      
      if (nightOwlBadge.data) {
        await supabase
          .from('user_badges')
          .insert([{
            user_id: user.id,
            badge_id: nightOwlBadge.data.id,
          }])
          .onConflict('user_id, badge_id')
          .ignore();
      }
    }
  } catch (error) {
    console.error('Error checking special badges:', error);
  }
};

/**
 * EXAMPLE 6: Integration locations in your app
 */

/*
 * ✅ WHERE TO ADD GAMIFICATION CALLS:
 * 
 * 1. WORKOUT COMPLETION:
 *    File: /app/workout/[workoutId].jsx or WorkoutSessionService.js
 *    Location: After workout is marked complete
 *    Call: incrementWorkoutStats() + updateChallengeProgress()
 * 
 * 2. PROFILE PAGE:
 *    File: /app/page/profile.jsx ✅ ALREADY DONE
 *    Location: useEffect on mount
 *    Call: getUserStats(), getUserBadges(), getWeeklyLeaderboard()
 * 
 * 3. HOME PAGE WIDGET:
 *    File: /app/page/home.jsx
 *    Location: Quick stats section
 *    Call: getUserStats() to show streak/points
 * 
 * 4. CHALLENGES PAGE (if you create one):
 *    File: /app/page/challenges.jsx
 *    Location: Display active challenges
 *    Call: getActiveChallenges(), getUserActiveChallenges()
 * 
 * 5. BADGE NOTIFICATION:
 *    File: Wherever you handle workout complete
 *    Location: After incrementWorkoutStats()
 *    Call: checkAndAwardBadges() then show modal/toast
 */

/**
 * QUICK START CHECKLIST:
 * 
 * □ 1. Apply migration: npx supabase db reset
 * □ 2. Find your workout completion handler
 * □ 3. Add: await GamificationDataService.incrementWorkoutStats(userId, calories, exercises)
 * □ 4. Test: Complete a workout
 * □ 5. Check: Profile page should show updated stats
 * □ 6. Check: "First Workout" badge should appear
 * □ 7. Test: Complete workout on consecutive days
 * □ 8. Check: Streak should increment
 */
