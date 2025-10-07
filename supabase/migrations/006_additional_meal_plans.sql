-- =============================================
-- ADDITIONAL MEAL PLAN TEMPLATES
-- Add more variety for different goals and preferences
-- =============================================

-- Run this after the main 005_meal_plans_system.sql migration

INSERT INTO meal_plan_templates (
  name, 
  description, 
  duration_weeks, 
  plan_type,
  daily_calories, 
  daily_protein, 
  daily_carbs, 
  daily_fats,
  protein_percentage,
  carbs_percentage,
  fats_percentage,
  difficulty_level,
  meals_per_day,
  tags
) VALUES 
  -- Aggressive Weight Loss
  (
    'Aggressive Fat Loss',
    'High deficit plan for rapid fat loss. Requires discipline and should not be followed long-term.',
    6,
    'weight_loss',
    1400,
    140,  -- 40% protein (560 cal)
    105,  -- 30% carbs (420 cal)
    47,   -- 30% fats (420 cal)
    40, 30, 30,
    'advanced',
    5,
    ARRAY['aggressive', 'high-protein', 'short-term']
  ),

  -- Moderate Weight Loss (Female-focused)
  (
    'Weight Loss - Women',
    'Balanced deficit plan optimized for female metabolism and hormone health.',
    10,
    'weight_loss',
    1600,
    120,  -- 30% protein (480 cal)
    160,  -- 40% carbs (640 cal)
    53,   -- 30% fats (480 cal)
    30, 40, 30,
    'beginner',
    4,
    ARRAY['female-friendly', 'sustainable', 'hormone-support']
  ),

  -- Lean Bulking (Enhanced)
  (
    'Lean Muscle Gain - Premium',
    'Optimized surplus for maximum muscle gain with minimal fat. Includes nutrient timing.',
    16,
    'bulking',
    3000,
    225,  -- 30% protein (900 cal)
    375,  -- 50% carbs (1500 cal)
    67,   -- 20% fats (600 cal)
    30, 50, 20,
    'advanced',
    6,
    ARRAY['high-protein', 'nutrient-timing', 'performance']
  ),

  -- Moderate Bulking
  (
    'Muscle Gain - Moderate',
    'Steady muscle gain with controlled surplus. Great for beginners to intermediate lifters.',
    12,
    'bulking',
    2600,
    195,  -- 30% protein (780 cal)
    325,  -- 50% carbs (1300 cal)
    58,   -- 20% fats (520 cal)
    30, 50, 20,
    'intermediate',
    5,
    ARRAY['beginner-friendly', 'steady-gains', 'balanced']
  ),

  -- Mini-Cut
  (
    'Mini-Cut - 4 Week Sprint',
    'Short-term aggressive cut to drop body fat quickly while maintaining muscle.',
    4,
    'cutting',
    1500,
    150,  -- 40% protein (600 cal)
    113,  -- 30% carbs (450 cal)
    50,   -- 30% fats (450 cal)
    40, 30, 30,
    'advanced',
    4,
    ARRAY['short-term', 'aggressive', 'muscle-sparing']
  ),

  -- Body Recomposition
  (
    'Body Recomp - Build & Burn',
    'Eat at maintenance while building muscle and losing fat simultaneously.',
    12,
    'maintenance',
    2000,
    180,  -- 36% protein (720 cal)
    175,  -- 35% carbs (700 cal)
    64,   -- 29% fats (580 cal)
    36, 35, 29,
    'intermediate',
    5,
    ARRAY['recomp', 'high-protein', 'dual-goal']
  ),

  -- Carnivore
  (
    'Carnivore - Animal-Based',
    'Zero-carb animal-based diet. Focuses on meat, fish, and eggs only.',
    8,
    'keto',
    2200,
    165,  -- 30% protein (660 cal)
    0,    -- 0% carbs (0 cal)
    171,  -- 70% fats (1540 cal)
    30, 0, 70,
    'advanced',
    2,
    ARRAY['carnivore', 'zero-carb', 'elimination']
  ),

  -- Standard Keto
  (
    'Keto - Standard',
    'Classic ketogenic diet with moderate protein and very low carbs.',
    8,
    'keto',
    2100,
    105,  -- 20% protein (420 cal)
    26,   -- 5% carbs (105 cal)
    175,  -- 75% fats (1575 cal)
    20, 5, 75,
    'intermediate',
    3,
    ARRAY['ketogenic', 'low-carb', 'fat-adapted']
  ),

  -- High-Carb Vegan
  (
    'Vegan High-Carb',
    'Plant-based diet emphasizing whole grains, legumes, and fruits.',
    8,
    'vegan',
    2200,
    100,  -- 18% protein (400 cal)
    330,  -- 60% carbs (1320 cal)
    53,   -- 22% fats (480 cal)
    18, 60, 22,
    'beginner',
    4,
    ARRAY['vegan', 'high-carb', 'plant-based', 'wfpb']
  ),

  -- High-Protein Vegetarian
  (
    'Vegetarian High-Protein',
    'Lacto-ovo vegetarian plan optimized for muscle building and recovery.',
    10,
    'vegan',
    2100,
    140,  -- 27% protein (560 cal)
    236,  -- 45% carbs (945 cal)
    66,   -- 28% fats (595 cal)
    27, 45, 28,
    'intermediate',
    5,
    ARRAY['vegetarian', 'high-protein', 'muscle-building']
  ),

  -- Intermittent Fasting 16:8
  (
    'IF 16:8 - Weight Loss',
    'Intermittent fasting protocol with 8-hour eating window. Deficit for fat loss.',
    8,
    'weight_loss',
    1700,
    128,  -- 30% protein (510 cal)
    170,  -- 40% carbs (680 cal)
    57,   -- 30% fats (510 cal)
    30, 40, 30,
    'intermediate',
    2,
    ARRAY['intermittent-fasting', 'time-restricted', 'fat-loss']
  ),

  -- OMAD (One Meal A Day)
  (
    'OMAD - Advanced Fasting',
    'One meal per day eating pattern. All calories consumed in 1-2 hour window.',
    4,
    'maintenance',
    2000,
    150,  -- 30% protein (600 cal)
    200,  -- 40% carbs (800 cal)
    67,   -- 30% fats (600 cal)
    30, 40, 30,
    'advanced',
    1,
    ARRAY['omad', 'extreme-fasting', 'autophagy']
  ),

  -- Mediterranean Diet
  (
    'Mediterranean Lifestyle',
    'Heart-healthy Mediterranean diet rich in olive oil, fish, and vegetables.',
    12,
    'maintenance',
    2100,
    105,  -- 20% protein (420 cal)
    236,  -- 45% carbs (945 cal)
    82,   -- 35% fats (735 cal)
    20, 45, 35,
    'beginner',
    3,
    ARRAY['mediterranean', 'heart-healthy', 'longevity']
  ),

  -- Paleo
  (
    'Paleo - Whole Foods',
    'Paleolithic diet focusing on whole foods: meat, fish, vegetables, nuts, and fruits.',
    10,
    'maintenance',
    2000,
    140,  -- 28% protein (560 cal)
    175,  -- 35% carbs (700 cal)
    82,   -- 37% fats (740 cal)
    28, 35, 37,
    'intermediate',
    3,
    ARRAY['paleo', 'whole-foods', 'grain-free']
  ),

  -- Zone Diet (40/30/30)
  (
    'Zone Diet - Balanced',
    'Precise macronutrient balance for optimal hormonal response and performance.',
    8,
    'maintenance',
    2200,
    165,  -- 30% protein (660 cal)
    220,  -- 40% carbs (880 cal)
    73,   -- 30% fats (660 cal)
    30, 40, 30,
    'intermediate',
    5,
    ARRAY['zone-diet', 'balanced', 'anti-inflammatory']
  ),

  -- Low-FODMAP
  (
    'Low-FODMAP - Gut Health',
    'Digestive-friendly plan eliminating fermentable carbohydrates.',
    6,
    'maintenance',
    2000,
    120,  -- 24% protein (480 cal)
    225,  -- 45% carbs (900 cal)
    69,   -- 31% fats (620 cal)
    24, 45, 31,
    'intermediate',
    4,
    ARRAY['low-fodmap', 'gut-health', 'digestive']
  ),

  -- High-Performance Athlete
  (
    'Athletic Performance - Elite',
    'High-calorie plan for competitive athletes and intense training.',
    12,
    'bulking',
    3500,
    263,  -- 30% protein (1050 cal)
    438,  -- 50% carbs (1750 cal)
    78,   -- 20% fats (700 cal)
    30, 50, 20,
    'advanced',
    6,
    ARRAY['athlete', 'high-performance', 'competition']
  ),

  -- Endurance Athlete
  (
    'Endurance - Long Distance',
    'Carb-focused plan for marathon runners, cyclists, and endurance athletes.',
    12,
    'maintenance',
    3000,
    150,  -- 20% protein (600 cal)
    450,  -- 60% carbs (1800 cal)
    67,   -- 20% fats (600 cal)
    20, 60, 20,
    'advanced',
    5,
    ARRAY['endurance', 'high-carb', 'marathon']
  ),

  -- Flexible Dieting (IIFYM)
  (
    'IIFYM - Flexible Dieting',
    'Track macros while enjoying your favorite foods. Perfect for sustainability.',
    0, -- Ongoing
    'maintenance',
    2200,
    165,  -- 30% protein (660 cal)
    220,  -- 40% carbs (880 cal)
    73,   -- 30% fats (660 cal)
    30, 40, 30,
    'beginner',
    4,
    ARRAY['iifym', 'flexible', 'lifestyle']
  ),

  -- Post-Contest Reverse Diet
  (
    'Reverse Diet - Recovery',
    'Gradually increase calories after a competition or long diet phase.',
    12,
    'bulking',
    1800, -- Starting point (increases weekly)
    135,  -- 30% protein (540 cal)
    180,  -- 40% carbs (720 cal)
    60,   -- 30% fats (540 cal)
    30, 40, 30,
    'advanced',
    4,
    ARRAY['reverse-diet', 'metabolic-recovery', 'post-competition']
  );

-- =============================================
-- VERIFICATION QUERY
-- Run this to see all meal plans
-- =============================================

-- SELECT 
--   name, 
--   plan_type, 
--   daily_calories, 
--   daily_protein, 
--   daily_carbs, 
--   daily_fats,
--   difficulty_level,
--   meals_per_day,
--   tags
-- FROM meal_plan_templates
-- WHERE is_active = true
-- ORDER BY plan_type, daily_calories;
