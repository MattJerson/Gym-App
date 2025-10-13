import { supabase } from '../services/supabase';

/**
 * Check what onboarding data is missing for a user
 * Returns an object describing completeness of each step
 */
export const checkOnboardingStatus = async (userId) => {
  try {
    // Fetch user's registration profile
    const { data: profile, error: profileError } = await supabase
      .from('registration_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }

    // Fetch user's body fat data
    const { data: bodyFatData, error: bodyFatError } = await supabase
      .from('bodyfat_profiles')
      .select('current_body_fat, goal_body_fat')
      .eq('user_id', userId)
      .maybeSingle();

    if (bodyFatError && bodyFatError.code !== 'PGRST116') {
      console.error('Error fetching body fat data:', bodyFatError);
    }

    // Fetch user's subscription - get most recent active one
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError && subError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching subscription:', subError);
    }
    
    console.log('Subscription check for user:', userId, 'Found:', subscription);

    // Fetch user's selected workouts
    const { data: userWorkouts, error: workoutsError } = await supabase
      .from('user_saved_workouts')
      .select('template_id')
      .eq('user_id', userId);

    if (workoutsError) {
      console.error('Error fetching workouts:', workoutsError);
    }

    // Fetch user's selected meal plan
    const { data: userMealPlan, error: mealError } = await supabase
      .from('user_meal_plans')
      .select('plan_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (mealError && mealError.code !== 'PGRST116') {
      console.error('Error fetching meal plan:', mealError);
    }

    // Check registration process completeness
    const hasBasicInfo = !!(
      profile?.gender &&
      profile?.age &&
      profile?.height_cm &&
      profile?.weight_kg
    );

    const hasWorkoutPreferences = !!(
      profile?.fitness_level &&
      profile?.training_location &&
      profile?.training_duration &&
      profile?.training_frequency
    );

    const hasMealPreferences = !!(
      profile?.meal_type &&
      profile?.calorie_goal &&
      profile?.meals_per_day
    );

    const registrationComplete = hasBasicInfo && hasWorkoutPreferences && hasMealPreferences;

    // Check body fat data from bodyfat_profiles table - BOTH current AND goal body fat must be present
    const hasBodyFat = !!(bodyFatData?.current_body_fat && bodyFatData?.goal_body_fat);

    // Check subscription
    const hasSubscription = !!subscription;
    
    console.log('Onboarding status check:', {
      hasSubscription,
      hasWorkouts: hasWorkouts,
      hasMealPlan: hasMealPlan,
    });

    // Check workouts
    const hasWorkouts = userWorkouts && userWorkouts.length > 0;

    // Check meal plan
    const hasMealPlan = !!userMealPlan;

    return {
      profile,
      status: {
        registrationComplete,
        hasBasicInfo,
        hasWorkoutPreferences,
        hasMealPreferences,
        hasBodyFat,
        hasSubscription,
        hasWorkouts,
        hasMealPlan,
      },
      nextStep: determineNextStep({
        registrationComplete,
        hasBodyFat,
        hasSubscription,
        hasWorkouts,
        hasMealPlan,
      }),
    };
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return {
      profile: null,
      status: {
        registrationComplete: false,
        hasBasicInfo: false,
        hasWorkoutPreferences: false,
        hasMealPreferences: false,
        hasBodyFat: false,
        hasSubscription: false,
        hasWorkouts: false,
        hasMealPlan: false,
      },
      nextStep: '/features/registrationprocess',
    };
  }
};

/**
 * Determine the next onboarding step based on what's missing
 */
const determineNextStep = (status) => {
  if (!status.registrationComplete) {
    return '/features/registrationprocess';
  }
  if (!status.hasBodyFat) {
    return '/features/bodyfatuser';
  }
  if (!status.hasSubscription) {
    return '/features/subscriptionpackages';
  }
  if (!status.hasWorkouts) {
    return '/features/selectworkouts';
  }
  if (!status.hasMealPlan) {
    return '/features/selectmealplan';
  }
  // All onboarding complete
  return '/page/home';
};

/**
 * Get the next step after completing the current page
 */
export const getNextOnboardingStep = async (currentPage, userId) => {
  const { status } = await checkOnboardingStatus(userId);

  switch (currentPage) {
    case 'registrationprocess':
      if (!status.hasBodyFat) return '/features/bodyfatuser';
      if (!status.hasSubscription) return '/features/subscriptionpackages';
      if (!status.hasWorkouts) return '/features/selectworkouts';
      if (!status.hasMealPlan) return '/features/selectmealplan';
      return '/page/home';

    case 'bodyfatuser':
      if (!status.hasSubscription) return '/features/subscriptionpackages';
      if (!status.hasWorkouts) return '/features/selectworkouts';
      if (!status.hasMealPlan) return '/features/selectmealplan';
      return '/page/home';

    case 'subscriptionpackages':
      if (!status.hasWorkouts) return '/features/selectworkouts';
      if (!status.hasMealPlan) return '/features/selectmealplan';
      return '/page/home';

    case 'selectworkouts':
      if (!status.hasMealPlan) return '/features/selectmealplan';
      return '/page/home';

    case 'selectmealplan':
      return '/page/home';

    default:
      return '/page/home';
  }
};

/**
 * Map profile data to form fields for registrationprocess
 */
export const mapProfileToFormData = (profile) => {
  if (!profile) return {};

  return {
    gender: profile.gender || '',
    age: profile.age ? String(profile.age) : '',
    height: profile.height_cm ? String(profile.height_cm) : '',
    weight: profile.weight_kg ? String(profile.weight_kg) : '',
    useMetric: profile.use_metric !== false,
    activityLevel: profile.activity_level || '',
    fitnessGoal: profile.fitness_goal || '',
    fitnessLevel: profile.fitness_level || '',
    trainingLocation: profile.training_location || '',
    trainingDuration: profile.training_duration ? String(profile.training_duration) : '',
    muscleFocus: profile.muscle_focus || [],
    injuries: profile.injuries || [],
    trainingFrequency: profile.training_frequency ? String(profile.training_frequency) : '',
    mealType: profile.meal_type || '',
    calorieGoal: profile.calorie_goal ? String(profile.calorie_goal) : '',
    mealsPerDay: profile.meals_per_day ? String(profile.meals_per_day) : '',
    restrictions: profile.restrictions || [],
    favoriteFoods: profile.favorite_foods || [],
  };
};
