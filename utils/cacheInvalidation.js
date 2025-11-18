/**
 * Cache Invalidation Helpers
 * 
 * Central place to define which pages should be invalidated when data changes.
 * This ensures consistent cache invalidation across the app.
 */

/**
 * Invalidation rules - defines which pages are affected by different data changes
 */
export const INVALIDATION_RULES = {
  // Meal-related changes
  MEAL_LOG_ADDED: ['mealplan', 'home', 'calendar'],
  MEAL_LOG_UPDATED: ['mealplan', 'home', 'calendar'],
  MEAL_LOG_DELETED: ['mealplan', 'home', 'calendar'],
  MEAL_PLAN_UPDATED: ['mealplan', 'calendar'],
  
  // Workout-related changes
  WORKOUT_COMPLETED: ['training', 'home', 'calendar', 'profile'],
  WORKOUT_STARTED: ['training', 'home'],
  WORKOUT_UPDATED: ['training', 'calendar'],
  WORKOUT_DELETED: ['training', 'calendar'],
  
  // Progress-related changes
  WEIGHT_LOGGED: ['home', 'profile'],
  BODY_MEASUREMENT_LOGGED: ['profile'],
  STEPS_SYNCED: ['home', 'profile'],
  
  // Subscription-related changes
  SUBSCRIPTION_UPDATED: ['profile', 'home'],
  
  // Profile-related changes
  PROFILE_UPDATED: ['profile'],
  AVATAR_UPDATED: ['profile'],
  
  // Badges and achievements
  BADGE_EARNED: ['profile'],
  ACHIEVEMENT_UNLOCKED: ['profile', 'home'],
  
  // Calendar-related changes
  CALENDAR_EVENT_ADDED: ['calendar'],
  CALENDAR_EVENT_UPDATED: ['calendar'],
  CALENDAR_EVENT_DELETED: ['calendar'],
};

/**
 * Helper function to get pages to invalidate for a specific action
 * @param {string} action - The action type (e.g., 'MEAL_LOG_ADDED')
 * @returns {string[]} - Array of page names to invalidate
 */
export function getPagesToInvalidate(action) {
  return INVALIDATION_RULES[action] || [];
}

/**
 * Common invalidation patterns
 */
export const InvalidationPatterns = {
  /**
   * Invalidate all pages
   */
  invalidateAll: (cacheContext) => {
    cacheContext.clearAllCache();
  },

  /**
   * Invalidate meal-related pages
   */
  invalidateMealPages: (cacheContext) => {
    cacheContext.invalidateMultiple(['mealplan', 'home', 'calendar']);
  },

  /**
   * Invalidate workout-related pages
   */
  invalidateWorkoutPages: (cacheContext) => {
    cacheContext.invalidateMultiple(['training', 'home', 'calendar']);
  },

  /**
   * Invalidate progress-related pages
   */
  invalidateProgressPages: (cacheContext) => {
    cacheContext.invalidateMultiple(['home', 'profile']);
  },

  /**
   * Invalidate calendar page
   */
  invalidateCalendar: (cacheContext) => {
    cacheContext.invalidateCache('calendar');
  },
};

/**
 * Helper to create an invalidation handler
 * @param {object} cacheContext - The cache context from usePageCache()
 * @param {string} action - The action type
 * @returns {function} - Handler function to call after the action
 */
export function createInvalidationHandler(cacheContext, action) {
  return () => {
    const pagesToInvalidate = getPagesToInvalidate(action);
    if (pagesToInvalidate.length > 0) {
      cacheContext.invalidateMultiple(pagesToInvalidate);
    }
  };
}
