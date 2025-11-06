-- =====================================================
-- COMBINED MIGRATION: User Custom Categories System
-- Run this entire file in Supabase Dashboard SQL Editor
-- =====================================================

-- PART 1: Create user_custom_categories table
-- =====================================================

-- Create the user_custom_categories table
CREATE TABLE IF NOT EXISTS public.user_custom_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  description text,
  icon varchar(50),
  emoji varchar(10) DEFAULT '💪',
  color varchar(20) DEFAULT '#3B82F6',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable RLS
ALTER TABLE public.user_custom_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own custom categories"
  ON public.user_custom_categories
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own custom categories"
  ON public.user_custom_categories
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom categories"
  ON public.user_custom_categories
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom categories"
  ON public.user_custom_categories
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add custom_category_id to workout_templates
ALTER TABLE public.workout_templates 
ADD COLUMN IF NOT EXISTS custom_category_id uuid REFERENCES public.user_custom_categories(id) ON DELETE SET NULL;

-- Make category_id nullable (for custom workouts)
ALTER TABLE public.workout_templates 
ALTER COLUMN category_id DROP NOT NULL;

-- Add constraint: must have either category_id OR custom_category_id, not both
ALTER TABLE public.workout_templates
DROP CONSTRAINT IF EXISTS check_single_category;

ALTER TABLE public.workout_templates
ADD CONSTRAINT check_single_category 
CHECK (
  (category_id IS NOT NULL AND custom_category_id IS NULL) OR 
  (category_id IS NULL AND custom_category_id IS NOT NULL)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_custom_categories_user_id 
ON public.user_custom_categories(user_id);

CREATE INDEX IF NOT EXISTS idx_workout_templates_custom_category 
ON public.workout_templates(custom_category_id);

-- =====================================================
-- PART 2: Helper Functions
-- =====================================================

-- Function to get or create a custom category for a user
CREATE OR REPLACE FUNCTION public.get_or_create_custom_category(
  p_user_id uuid,
  p_name varchar DEFAULT 'My Workouts',
  p_emoji varchar DEFAULT '💪',
  p_color varchar DEFAULT '#3B82F6'
)
RETURNS uuid AS $$
DECLARE
  v_category_id uuid;
BEGIN
  -- Try to find existing category
  SELECT id INTO v_category_id
  FROM public.user_custom_categories
  WHERE user_id = p_user_id 
    AND name = p_name;

  -- If not found, create it
  IF v_category_id IS NULL THEN
    INSERT INTO public.user_custom_categories (
      user_id,
      name,
      emoji,
      color,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      p_user_id,
      p_name,
      p_emoji,
      p_color,
      true,
      now(),
      now()
    )
    RETURNING id INTO v_category_id;
  END IF;

  RETURN v_category_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-create default custom category for new users
CREATE OR REPLACE FUNCTION public.create_default_custom_category()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_custom_categories (
    user_id,
    name,
    emoji,
    color,
    is_active
  ) VALUES (
    NEW.id,
    'My Workouts',
    '💪',
    '#3B82F6',
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS trigger_create_default_custom_category ON auth.users;
CREATE TRIGGER trigger_create_default_custom_category
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_custom_category();

-- =====================================================
-- PART 3: Custom Workout Functions
-- =====================================================

-- Function: create_custom_workout_v2
CREATE OR REPLACE FUNCTION public.create_custom_workout_v2(
  p_user_id uuid,
  p_name varchar,
  p_description text,
  p_custom_category_id uuid,
  p_difficulty varchar,
  p_duration_minutes integer,
  p_estimated_calories integer,
  p_exercises jsonb,
  p_custom_color varchar DEFAULT NULL,
  p_custom_emoji varchar DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_template_id uuid;
  v_exercise jsonb;
  v_order_index integer := 0;
BEGIN
  -- Verify the custom category belongs to this user
  IF NOT EXISTS (
    SELECT 1 FROM public.user_custom_categories 
    WHERE id = p_custom_category_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Invalid custom category or unauthorized access';
  END IF;

  -- Create workout template with custom_category_id
  INSERT INTO public.workout_templates (
    custom_category_id,
    category_id,
    name,
    description,
    difficulty,
    duration_minutes,
    estimated_calories,
    is_custom,
    created_by_user_id,
    custom_color,
    custom_emoji,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    p_custom_category_id,
    NULL,
    p_name,
    p_description,
    p_difficulty,
    p_duration_minutes,
    p_estimated_calories,
    true,
    p_user_id,
    p_custom_color,
    p_custom_emoji,
    true,
    now(),
    now()
  )
  RETURNING id INTO v_template_id;

  -- Insert exercises for this template
  FOR v_exercise IN SELECT * FROM jsonb_array_elements(p_exercises)
  LOOP
    INSERT INTO public.workout_template_exercises (
      template_id,
      exercise_id,
      sets,
      reps,
      duration_seconds,
      rest_seconds,
      order_index,
      custom_notes,
      created_at,
      updated_at
    ) VALUES (
      v_template_id,
      (v_exercise->>'exercise_id')::uuid,
      (v_exercise->>'sets')::integer,
      v_exercise->>'reps',
      (v_exercise->>'duration_seconds')::integer,
      (v_exercise->>'rest_seconds')::integer,
      v_order_index,
      v_exercise->>'notes',
      now(),
      now()
    );
    
    v_order_index := v_order_index + 1;
  END LOOP;

  -- Add to user_saved_workouts
  INSERT INTO public.user_saved_workouts (
    user_id,
    template_id,
    workout_name,
    workout_type,
    is_scheduled,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    v_template_id,
    p_name,
    'Custom',
    false,
    now(),
    now()
  );

  RETURN v_template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: update_custom_workout_v2
CREATE OR REPLACE FUNCTION public.update_custom_workout_v2(
  p_user_id uuid,
  p_template_id uuid,
  p_name varchar,
  p_description text,
  p_custom_category_id uuid,
  p_difficulty varchar,
  p_duration_minutes integer,
  p_estimated_calories integer,
  p_exercises jsonb,
  p_custom_color varchar DEFAULT NULL,
  p_custom_emoji varchar DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  v_exercise jsonb;
  v_order_index integer := 0;
BEGIN
  -- Verify this is a custom workout owned by the user
  IF NOT EXISTS (
    SELECT 1 FROM public.workout_templates 
    WHERE id = p_template_id 
      AND created_by_user_id = p_user_id
      AND is_custom = true
  ) THEN
    RAISE EXCEPTION 'Workout not found or unauthorized';
  END IF;

  -- Verify the custom category belongs to this user
  IF NOT EXISTS (
    SELECT 1 FROM public.user_custom_categories 
    WHERE id = p_custom_category_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Invalid custom category or unauthorized access';
  END IF;

  -- Update workout template
  UPDATE public.workout_templates
  SET
    custom_category_id = p_custom_category_id,
    category_id = NULL,
    name = p_name,
    description = p_description,
    difficulty = p_difficulty,
    duration_minutes = p_duration_minutes,
    estimated_calories = p_estimated_calories,
    custom_color = p_custom_color,
    custom_emoji = p_custom_emoji,
    updated_at = now()
  WHERE id = p_template_id;

  -- Delete existing exercises
  DELETE FROM public.workout_template_exercises
  WHERE template_id = p_template_id;

  -- Insert updated exercises
  FOR v_exercise IN SELECT * FROM jsonb_array_elements(p_exercises)
  LOOP
    INSERT INTO public.workout_template_exercises (
      template_id,
      exercise_id,
      sets,
      reps,
      duration_seconds,
      rest_seconds,
      order_index,
      custom_notes,
      created_at,
      updated_at
    ) VALUES (
      p_template_id,
      (v_exercise->>'exercise_id')::uuid,
      (v_exercise->>'sets')::integer,
      v_exercise->>'reps',
      (v_exercise->>'duration_seconds')::integer,
      (v_exercise->>'rest_seconds')::integer,
      v_order_index,
      v_exercise->>'notes',
      now(),
      now()
    );
    
    v_order_index := v_order_index + 1;
  END LOOP;

  -- Update user_saved_workouts
  UPDATE public.user_saved_workouts
  SET
    workout_name = p_name,
    updated_at = now()
  WHERE template_id = p_template_id
    AND user_id = p_user_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PART 4: Grant Permissions
-- =====================================================

GRANT EXECUTE ON FUNCTION public.create_custom_workout_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_custom_workout_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_custom_category TO authenticated;

-- =====================================================
-- PART 5: Migrate Existing Custom Workouts
-- =====================================================

-- Create default "My Workouts" category for all existing users
INSERT INTO public.user_custom_categories (user_id, name, emoji, color)
SELECT DISTINCT 
  id as user_id,
  'My Workouts',
  '💪',
  '#3B82F6'
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_custom_categories 
  WHERE user_custom_categories.user_id = auth.users.id
);

-- Migrate existing custom workouts to use custom_category_id
UPDATE public.workout_templates wt
SET custom_category_id = (
  SELECT ucc.id 
  FROM public.user_custom_categories ucc
  WHERE ucc.user_id = wt.created_by_user_id
    AND ucc.name = 'My Workouts'
  LIMIT 1
),
category_id = NULL
WHERE wt.is_custom = true
  AND wt.created_by_user_id IS NOT NULL
  AND wt.custom_category_id IS NULL;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- You should now be able to create custom workouts
-- Each user will have a "My Workouts" category automatically
-- =====================================================
