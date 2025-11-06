-- Migration: Add User Custom Categories System
-- Date: 2025-11-06
-- Description: Create a separate category system for user-created custom workouts

-- =====================================================
-- 1. CREATE USER_CUSTOM_CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_custom_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name character varying(100) NOT NULL,
  description text,
  icon character varying(50),
  emoji character varying(10),
  color character varying(20) NOT NULL DEFAULT '#3B82F6',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_custom_categories_pkey PRIMARY KEY (id),
  CONSTRAINT user_custom_categories_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT user_custom_categories_user_name_unique UNIQUE (user_id, name)
);

-- Index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_user_custom_categories_user_id ON public.user_custom_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_user_custom_categories_active ON public.user_custom_categories(user_id, is_active);

-- Enable RLS
ALTER TABLE public.user_custom_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own custom categories
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
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom categories"
  ON public.user_custom_categories
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 2. ADD CUSTOM CATEGORY REFERENCE TO WORKOUT_TEMPLATES
-- =====================================================
-- Add nullable custom_category_id column
ALTER TABLE public.workout_templates 
  ADD COLUMN IF NOT EXISTS custom_category_id uuid REFERENCES public.user_custom_categories(id) ON DELETE SET NULL;

-- Add constraint: must have either category_id OR custom_category_id (not both)
ALTER TABLE public.workout_templates
  DROP CONSTRAINT IF EXISTS workout_templates_category_id_fkey;

-- Make category_id nullable for custom workouts
ALTER TABLE public.workout_templates 
  ALTER COLUMN category_id DROP NOT NULL;

-- Add check constraint: must have exactly one category type
ALTER TABLE public.workout_templates
  ADD CONSTRAINT workout_templates_single_category_check 
  CHECK (
    (category_id IS NOT NULL AND custom_category_id IS NULL) OR
    (category_id IS NULL AND custom_category_id IS NOT NULL)
  );

-- Re-add foreign key for category_id (now nullable)
ALTER TABLE public.workout_templates
  ADD CONSTRAINT workout_templates_category_id_fkey 
  FOREIGN KEY (category_id) REFERENCES public.workout_categories(id);

-- Add index for custom category lookups
CREATE INDEX IF NOT EXISTS idx_workout_templates_custom_category ON public.workout_templates(custom_category_id) WHERE custom_category_id IS NOT NULL;

-- =====================================================
-- 3. CREATE DEFAULT "MY WORKOUTS" CATEGORY FOR EXISTING USERS
-- =====================================================
-- This ensures all users have at least one custom category
INSERT INTO public.user_custom_categories (user_id, name, description, emoji, color, is_active)
SELECT 
  u.id,
  'My Workouts',
  'Personal custom workouts',
  '💪',
  '#3B82F6',
  true
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_custom_categories ucc 
  WHERE ucc.user_id = u.id AND ucc.name = 'My Workouts'
)
ON CONFLICT (user_id, name) DO NOTHING;

-- =====================================================
-- 4. CREATE FUNCTION TO AUTO-CREATE DEFAULT CATEGORY FOR NEW USERS
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_default_custom_category()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_custom_categories (user_id, name, description, emoji, color, is_active)
  VALUES (NEW.id, 'My Workouts', 'Personal custom workouts', '💪', '#3B82F6', true)
  ON CONFLICT (user_id, name) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create category on user registration
DROP TRIGGER IF EXISTS trigger_create_default_custom_category ON auth.users;
CREATE TRIGGER trigger_create_default_custom_category
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_custom_category();

-- =====================================================
-- 5. UPDATE EXISTING CUSTOM WORKOUTS
-- =====================================================
-- Move existing custom workouts to use user_custom_categories
-- First, create custom categories for users who have custom workouts
INSERT INTO public.user_custom_categories (user_id, name, description, emoji, color, is_active)
SELECT DISTINCT
  wt.created_by_user_id,
  'My Workouts',
  'Personal custom workouts',
  COALESCE(wt.custom_emoji, '💪'),
  COALESCE(wt.custom_color, '#3B82F6'),
  true
FROM public.workout_templates wt
WHERE wt.is_custom = true 
  AND wt.created_by_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_custom_categories ucc 
    WHERE ucc.user_id = wt.created_by_user_id AND ucc.name = 'My Workouts'
  )
ON CONFLICT (user_id, name) DO NOTHING;

-- Update existing custom workouts to use custom_category_id
UPDATE public.workout_templates wt
SET 
  custom_category_id = ucc.id,
  category_id = NULL
FROM public.user_custom_categories ucc
WHERE wt.is_custom = true
  AND wt.created_by_user_id IS NOT NULL
  AND ucc.user_id = wt.created_by_user_id
  AND ucc.name = 'My Workouts'
  AND wt.custom_category_id IS NULL;

-- =====================================================
-- 6. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to get or create a custom category
CREATE OR REPLACE FUNCTION public.get_or_create_custom_category(
  p_user_id uuid,
  p_name varchar,
  p_emoji varchar DEFAULT '💪',
  p_color varchar DEFAULT '#3B82F6'
)
RETURNS uuid AS $$
DECLARE
  v_category_id uuid;
BEGIN
  -- Try to get existing category
  SELECT id INTO v_category_id
  FROM public.user_custom_categories
  WHERE user_id = p_user_id AND name = p_name;
  
  -- Create if doesn't exist
  IF v_category_id IS NULL THEN
    INSERT INTO public.user_custom_categories (user_id, name, emoji, color)
    VALUES (p_user_id, p_name, p_emoji, p_color)
    RETURNING id INTO v_category_id;
  END IF;
  
  RETURN v_category_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. ADD UPDATED_AT TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_user_custom_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_custom_categories_updated_at ON public.user_custom_categories;
CREATE TRIGGER trigger_update_user_custom_categories_updated_at
  BEFORE UPDATE ON public.user_custom_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_custom_categories_updated_at();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the migration worked:

-- Check custom categories table
-- SELECT * FROM public.user_custom_categories;

-- Check custom workouts are using custom categories
-- SELECT id, name, is_custom, category_id, custom_category_id, created_by_user_id 
-- FROM public.workout_templates 
-- WHERE is_custom = true;

-- Check that all custom workouts have custom_category_id
-- SELECT COUNT(*) as orphaned_custom_workouts
-- FROM public.workout_templates 
-- WHERE is_custom = true AND custom_category_id IS NULL;
-- Should return 0
