import { supabase } from './supabase';

/**
 * Service to manage onboarding progress and completion status
 */
export class OnboardingService {
  /**
   * Check which onboarding steps are completed
   * @param {string} userId 
   * @returns {Promise<{hasWorkouts: boolean, hasMealPlan: boolean, totalSteps: number, completedSteps: number}>}
   */
  static async checkOnboardingStatus(userId) {
    try {
      // Check if user has any saved workouts (templates or custom)
      const { data: savedWorkouts, error: savedWorkoutError } = await supabase
        .from('user_saved_workouts')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (savedWorkoutError) throw savedWorkoutError;

      // Check if user has any assigned workouts
      const { data: assignedWorkouts, error: assignedWorkoutError } = await supabase
        .from('user_assigned_workouts')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1);

      if (assignedWorkoutError) throw assignedWorkoutError;

      // Check if user has a meal plan
      const { data: mealPlans, error: mealPlanError } = await supabase
        .from('user_meal_plans')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (mealPlanError) throw mealPlanError;

      // User has workouts if they have EITHER saved workouts OR assigned workouts
      const hasWorkouts = (savedWorkouts && savedWorkouts.length > 0) || (assignedWorkouts && assignedWorkouts.length > 0);
      const hasMealPlan = mealPlans && mealPlans.length > 0;

      // Calculate progress
      const completedSteps = (hasWorkouts ? 1 : 0) + (hasMealPlan ? 1 : 0);
      const totalSteps = 2;

      return {
        hasWorkouts,
        hasMealPlan,
        completedSteps,
        totalSteps,
        isFullyComplete: hasWorkouts && hasMealPlan,
      };
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return {
        hasWorkouts: false,
        hasMealPlan: false,
        completedSteps: 0,
        totalSteps: 2,
        isFullyComplete: false,
      };
    }
  }

  /**
   * Mark onboarding as complete in database
   * @param {string} userId 
   */
  static async markOnboardingComplete(userId) {
    try {
      const { error } = await supabase
        .from('registration_profiles')
        .update({ onboarding_completed: true })
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking onboarding complete:', error);
      return false;
    }
  }

  /**
   * Get the next onboarding step the user should complete
   * @param {string} userId 
   * @returns {Promise<'workouts'|'mealplan'|'complete'>}
   */
  static async getNextOnboardingStep(userId) {
    const status = await this.checkOnboardingStatus(userId);

    if (!status.hasWorkouts) {
      return 'workouts';
    } else if (!status.hasMealPlan) {
      return 'mealplan';
    } else {
      return 'complete';
    }
  }

  /**
   * Determine which step user is currently on (for progress calculation)
   * @param {string} currentPage - 'workouts' or 'mealplan'
   * @param {object} status - Result from checkOnboardingStatus
   * @returns {{currentStep: number, totalSteps: number, percentage: number}}
   */
  static calculateProgress(currentPage, status) {
    // Determine how many steps remain uncompleted
    const stepsRemaining = [];
    if (!status.hasWorkouts) stepsRemaining.push('workouts');
    if (!status.hasMealPlan) stepsRemaining.push('mealplan');
    
    const totalSteps = stepsRemaining.length || 1; // At least show 1 step
    
    let currentStep = 1;
    if (currentPage === 'workouts') {
      currentStep = 1;
    } else if (currentPage === 'mealplan') {
      // If on meal plan page
      if (!status.hasWorkouts) {
        // If workouts not done, meal plan is step 2 of 2
        currentStep = 2;
      } else {
        // If workouts done, meal plan is step 1 of 1 (last remaining)
        currentStep = 1;
      }
    }

    const percentage = Math.round((currentStep / totalSteps) * 100);

    return {
      currentStep,
      totalSteps,
      percentage,
    };
  }
}
