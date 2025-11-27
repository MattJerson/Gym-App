-- Fix user deletion by adding ON DELETE CASCADE to all foreign keys
-- This allows users to be deleted from the Supabase dashboard without errors

-- Active workout sessions
ALTER TABLE active_workout_sessions 
  DROP CONSTRAINT IF EXISTS active_workout_sessions_user_id_fkey,
  ADD CONSTRAINT active_workout_sessions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Body fat profiles
ALTER TABLE bodyfat_profiles 
  DROP CONSTRAINT IF EXISTS bodyfat_profiles_user_id_fkey,
  ADD CONSTRAINT bodyfat_profiles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Challenge history
ALTER TABLE challenge_history 
  DROP CONSTRAINT IF EXISTS challenge_history_winner_user_id_fkey,
  ADD CONSTRAINT challenge_history_winner_user_id_fkey 
    FOREIGN KEY (winner_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Challenge participations
ALTER TABLE challenge_participations 
  DROP CONSTRAINT IF EXISTS challenge_participations_user_id_fkey,
  ADD CONSTRAINT challenge_participations_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Challenge progress
ALTER TABLE challenge_progress 
  DROP CONSTRAINT IF EXISTS challenge_progress_user_id_fkey,
  ADD CONSTRAINT challenge_progress_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Channel read receipts
ALTER TABLE channel_read_receipts 
  DROP CONSTRAINT IF EXISTS channel_read_receipts_user_id_fkey,
  ADD CONSTRAINT channel_read_receipts_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Community manager activity log
ALTER TABLE community_manager_activity_log 
  DROP CONSTRAINT IF EXISTS community_manager_activity_log_target_user_id_fkey,
  ADD CONSTRAINT community_manager_activity_log_target_user_id_fkey 
    FOREIGN KEY (target_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Daily activity tracking
ALTER TABLE daily_activity_tracking 
  DROP CONSTRAINT IF EXISTS daily_activity_tracking_user_id_fkey,
  ADD CONSTRAINT daily_activity_tracking_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Daily calorie summary
ALTER TABLE daily_calorie_summary 
  DROP CONSTRAINT IF EXISTS daily_calorie_summary_user_id_fkey,
  ADD CONSTRAINT daily_calorie_summary_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Daily meal tracking
ALTER TABLE daily_meal_tracking 
  DROP CONSTRAINT IF EXISTS daily_meal_tracking_user_id_fkey,
  ADD CONSTRAINT daily_meal_tracking_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Device tokens
ALTER TABLE device_tokens 
  DROP CONSTRAINT IF EXISTS device_tokens_user_id_fkey,
  ADD CONSTRAINT device_tokens_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- DM read receipts
ALTER TABLE dm_read_receipts 
  DROP CONSTRAINT IF EXISTS dm_read_receipts_user_id_fkey,
  ADD CONSTRAINT dm_read_receipts_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Exercise sets
ALTER TABLE exercise_sets 
  DROP CONSTRAINT IF EXISTS exercise_sets_user_id_fkey,
  ADD CONSTRAINT exercise_sets_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Meal plan analytics
ALTER TABLE meal_plan_analytics 
  DROP CONSTRAINT IF EXISTS meal_plan_analytics_user_id_fkey,
  ADD CONSTRAINT meal_plan_analytics_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Message moderation log
ALTER TABLE message_moderation_log 
  DROP CONSTRAINT IF EXISTS message_moderation_log_user_id_fkey,
  ADD CONSTRAINT message_moderation_log_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Notification dismissals
ALTER TABLE notification_dismissals 
  DROP CONSTRAINT IF EXISTS notification_dismissals_user_id_fkey,
  ADD CONSTRAINT notification_dismissals_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Notification logs
ALTER TABLE notification_logs 
  DROP CONSTRAINT IF EXISTS notification_logs_user_id_fkey,
  ADD CONSTRAINT notification_logs_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Notification preferences
ALTER TABLE notification_preferences 
  DROP CONSTRAINT IF EXISTS notification_preferences_user_id_fkey,
  ADD CONSTRAINT notification_preferences_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Notification reads
ALTER TABLE notification_reads 
  DROP CONSTRAINT IF EXISTS notification_reads_user_id_fkey,
  ADD CONSTRAINT notification_reads_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Notifications
ALTER TABLE notifications 
  DROP CONSTRAINT IF EXISTS notifications_user_id_fkey,
  ADD CONSTRAINT notifications_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Privacy settings
ALTER TABLE privacy_settings 
  DROP CONSTRAINT IF EXISTS privacy_settings_user_id_fkey,
  ADD CONSTRAINT privacy_settings_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Profiles (very important!)
ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS profiles_id_fkey,
  ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Registration profiles
ALTER TABLE registration_profiles 
  DROP CONSTRAINT IF EXISTS registration_profiles_user_id_fkey,
  ADD CONSTRAINT registration_profiles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Steps tracking
ALTER TABLE steps_tracking 
  DROP CONSTRAINT IF EXISTS steps_tracking_user_id_fkey,
  ADD CONSTRAINT steps_tracking_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- User assigned workouts
ALTER TABLE user_assigned_workouts 
  DROP CONSTRAINT IF EXISTS user_assigned_workouts_user_id_fkey,
  ADD CONSTRAINT user_assigned_workouts_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- User badges
ALTER TABLE user_badges 
  DROP CONSTRAINT IF EXISTS user_badges_user_id_fkey,
  ADD CONSTRAINT user_badges_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- User custom categories
ALTER TABLE user_custom_categories 
  DROP CONSTRAINT IF EXISTS user_custom_categories_user_id_fkey,
  ADD CONSTRAINT user_custom_categories_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- User daily goals
ALTER TABLE user_daily_goals 
  DROP CONSTRAINT IF EXISTS user_daily_goals_user_id_fkey,
  ADD CONSTRAINT user_daily_goals_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- User food history
ALTER TABLE user_food_history 
  DROP CONSTRAINT IF EXISTS user_food_history_user_id_fkey,
  ADD CONSTRAINT user_food_history_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- User goals
ALTER TABLE user_goals 
  DROP CONSTRAINT IF EXISTS user_goals_user_id_fkey,
  ADD CONSTRAINT user_goals_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- User inquiries
ALTER TABLE user_inquiries 
  DROP CONSTRAINT IF EXISTS user_inquiries_user_id_fkey,
  ADD CONSTRAINT user_inquiries_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- User meal filters
ALTER TABLE user_meal_filters 
  DROP CONSTRAINT IF EXISTS user_meal_filters_user_id_fkey,
  ADD CONSTRAINT user_meal_filters_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- User meal logs
ALTER TABLE user_meal_logs 
  DROP CONSTRAINT IF EXISTS user_meal_logs_user_id_fkey,
  ADD CONSTRAINT user_meal_logs_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- User meal plans
ALTER TABLE user_meal_plans 
  DROP CONSTRAINT IF EXISTS user_meal_plans_user_id_fkey,
  ADD CONSTRAINT user_meal_plans_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- User meals
ALTER TABLE user_meals 
  DROP CONSTRAINT IF EXISTS user_meals_user_id_fkey,
  ADD CONSTRAINT user_meals_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- User message rate limit
ALTER TABLE user_message_rate_limit 
  DROP CONSTRAINT IF EXISTS user_message_rate_limit_user_id_fkey,
  ADD CONSTRAINT user_message_rate_limit_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- User notification cooldowns
ALTER TABLE user_notification_cooldowns 
  DROP CONSTRAINT IF EXISTS user_notification_cooldowns_user_id_fkey,
  ADD CONSTRAINT user_notification_cooldowns_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- User saved workouts
ALTER TABLE user_saved_workouts 
  DROP CONSTRAINT IF EXISTS user_saved_workouts_user_id_fkey,
  ADD CONSTRAINT user_saved_workouts_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- User stats
ALTER TABLE user_stats 
  DROP CONSTRAINT IF EXISTS user_stats_user_id_fkey,
  ADD CONSTRAINT user_stats_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- User subscriptions
ALTER TABLE user_subscriptions 
  DROP CONSTRAINT IF EXISTS user_subscriptions_user_id_fkey,
  ADD CONSTRAINT user_subscriptions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- User workout preferences
ALTER TABLE user_workout_preferences 
  DROP CONSTRAINT IF EXISTS user_workout_preferences_user_id_fkey,
  ADD CONSTRAINT user_workout_preferences_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- User workout schedule
ALTER TABLE user_workout_schedule 
  DROP CONSTRAINT IF EXISTS user_workout_schedule_user_id_fkey,
  ADD CONSTRAINT user_workout_schedule_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Weekly notification log
ALTER TABLE weekly_notification_log 
  DROP CONSTRAINT IF EXISTS weekly_notification_log_user_id_fkey,
  ADD CONSTRAINT weekly_notification_log_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Weight progress tracking
ALTER TABLE weight_progress_tracking 
  DROP CONSTRAINT IF EXISTS weight_progress_tracking_user_id_fkey,
  ADD CONSTRAINT weight_progress_tracking_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Weight tracking
ALTER TABLE weight_tracking 
  DROP CONSTRAINT IF EXISTS weight_tracking_user_id_fkey,
  ADD CONSTRAINT weight_tracking_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Workout logs
ALTER TABLE workout_logs 
  DROP CONSTRAINT IF EXISTS workout_logs_user_id_fkey,
  ADD CONSTRAINT workout_logs_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Workout personal records
ALTER TABLE workout_personal_records 
  DROP CONSTRAINT IF EXISTS workout_personal_records_user_id_fkey,
  ADD CONSTRAINT workout_personal_records_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Workout session exercises
ALTER TABLE workout_session_exercises 
  DROP CONSTRAINT IF EXISTS workout_session_exercises_user_id_fkey,
  ADD CONSTRAINT workout_session_exercises_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Workout sessions
ALTER TABLE workout_sessions 
  DROP CONSTRAINT IF EXISTS workout_sessions_user_id_fkey,
  ADD CONSTRAINT workout_sessions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Workout templates (created_by)
ALTER TABLE workout_templates 
  DROP CONSTRAINT IF EXISTS workout_templates_created_by_user_id_fkey,
  ADD CONSTRAINT workout_templates_created_by_user_id_fkey 
    FOREIGN KEY (created_by_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Chats table (for community chat usernames)
ALTER TABLE chats 
  DROP CONSTRAINT IF EXISTS chats_id_fkey,
  ADD CONSTRAINT chats_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE 'All foreign key constraints updated with ON DELETE CASCADE';
  RAISE NOTICE 'Users can now be deleted from the Supabase dashboard';
END $$;
