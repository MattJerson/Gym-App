-- =============================================
-- GAMIFICATION SYSTEM
-- Badges, Challenges, User Progress & Leaderboard
-- =============================================

-- =============================================
-- 1. BADGES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(10) NOT NULL, -- Emoji or icon identifier
  color VARCHAR(20) DEFAULT '#f1c40f',
  category VARCHAR(50) DEFAULT 'achievement', -- achievement, milestone, streak, social
  rarity VARCHAR(20) DEFAULT 'common', -- common, rare, epic, legendary
  points_value INTEGER DEFAULT 10, -- Points awarded when earned
  requirement_type VARCHAR(50), -- workout_count, streak_days, calories_burned, etc.
  requirement_value INTEGER, -- The threshold to earn the badge
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. CHALLENGES TABLE (Weekly/Monthly Competitions)
-- =============================================
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  challenge_type VARCHAR(50) NOT NULL, -- weekly, monthly, special_event
  metric_type VARCHAR(50) NOT NULL, -- workouts_completed, calories_burned, total_exercises, streak_days
  target_value INTEGER, -- Optional target (e.g., 1000 calories to burn)
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  prize_badge_id UUID REFERENCES badges(id) ON DELETE SET NULL,
  prize_description TEXT, -- e.g., "Top 10 get Premium Badge"
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Admin who created
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. USER BADGES (Earned Badges)
-- =============================================
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress INTEGER DEFAULT 100, -- Percentage progress (100 = earned)
  
  UNIQUE(user_id, badge_id) -- Each user can earn a badge only once
);

-- =============================================
-- 4. CHALLENGE PARTICIPANTS & PROGRESS
-- =============================================
CREATE TABLE IF NOT EXISTS challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_value INTEGER DEFAULT 0, -- Current metric value (e.g., workouts completed)
  points_earned INTEGER DEFAULT 0,
  rank INTEGER, -- User's rank in this challenge
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(challenge_id, user_id) -- Each user joins a challenge once
);

-- =============================================
-- 5. USER STATS (Overall Gamification Stats)
-- =============================================
CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_workouts INTEGER DEFAULT 0,
  total_calories_burned INTEGER DEFAULT 0,
  total_exercises_completed INTEGER DEFAULT 0,
  badges_earned INTEGER DEFAULT 0,
  challenges_completed INTEGER DEFAULT 0,
  rank_position INTEGER, -- Global rank
  last_workout_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 6. LEADERBOARD VIEW (Weekly)
-- =============================================
CREATE OR REPLACE VIEW weekly_leaderboard AS
SELECT 
  u.id AS user_id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', u.email) AS user_name,
  us.total_points,
  us.current_streak,
  us.total_workouts,
  us.badges_earned,
  ROW_NUMBER() OVER (ORDER BY us.total_points DESC, us.current_streak DESC) AS position
FROM auth.users u
LEFT JOIN user_stats us ON u.id = us.user_id
WHERE us.last_workout_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY us.total_points DESC, us.current_streak DESC
LIMIT 100;

-- =============================================
-- 7. INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_challenge_id ON challenge_progress(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_user_id ON challenge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_active_dates ON challenges(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_user_stats_points ON user_stats(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_last_workout ON user_stats(last_workout_date);

-- =============================================
-- 8. TRIGGERS FOR AUTO-UPDATES
-- =============================================

-- Update user_stats when a badge is earned
CREATE OR REPLACE FUNCTION update_user_stats_on_badge_earned()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_stats
  SET 
    badges_earned = badges_earned + 1,
    total_points = total_points + (SELECT points_value FROM badges WHERE id = NEW.badge_id),
    updated_at = NOW()
  WHERE user_id = NEW.user_id;
  
  -- Create user_stats if doesn't exist
  INSERT INTO user_stats (user_id, badges_earned, total_points)
  VALUES (NEW.user_id, 1, (SELECT points_value FROM badges WHERE id = NEW.badge_id))
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_stats_on_badge
AFTER INSERT ON user_badges
FOR EACH ROW
EXECUTE FUNCTION update_user_stats_on_badge_earned();

-- Update challenge_progress rank when points change
CREATE OR REPLACE FUNCTION update_challenge_ranks()
RETURNS TRIGGER AS $$
BEGIN
  WITH ranked_users AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY challenge_id 
        ORDER BY current_value DESC, last_updated ASC
      ) AS new_rank
    FROM challenge_progress
    WHERE challenge_id = NEW.challenge_id
  )
  UPDATE challenge_progress cp
  SET rank = ru.new_rank
  FROM ranked_users ru
  WHERE cp.id = ru.id AND cp.challenge_id = NEW.challenge_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_challenge_ranks
AFTER INSERT OR UPDATE OF current_value ON challenge_progress
FOR EACH ROW
EXECUTE FUNCTION update_challenge_ranks();

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_badges_updated_at BEFORE UPDATE ON badges
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_challenges_updated_at BEFORE UPDATE ON challenges
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_stats_updated_at BEFORE UPDATE ON user_stats
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 9. ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Badges: Everyone can read active badges
CREATE POLICY "Anyone can view active badges"
  ON badges FOR SELECT
  USING (is_active = true);

-- Challenges: Everyone can view active challenges
CREATE POLICY "Anyone can view active challenges"
  ON challenges FOR SELECT
  USING (is_active = true);

-- User Badges: Users can view their own badges, everyone can see counts
CREATE POLICY "Users can view their own badges"
  ON user_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges"
  ON user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all badge counts"
  ON user_badges FOR SELECT
  USING (true);

-- Challenge Progress: Users can view and update their own progress
CREATE POLICY "Users can view their own challenge progress"
  ON challenge_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own challenge progress"
  ON challenge_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenge progress"
  ON challenge_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- User Stats: Users can view their own stats, everyone can see leaderboard
CREATE POLICY "Users can view their own stats"
  ON user_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats"
  ON user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
  ON user_stats FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view all stats for leaderboard"
  ON user_stats FOR SELECT
  USING (true);

-- =============================================
-- 10. SEED DATA - INITIAL BADGES
-- =============================================

INSERT INTO badges (name, description, icon, color, category, rarity, points_value, requirement_type, requirement_value) VALUES
-- Workout Milestones
('First Workout', 'Complete your first workout', '🏃', '#3498db', 'milestone', 'common', 10, 'workout_count', 1),
('10 Workouts', 'Complete 10 workouts', '💪', '#2ecc71', 'milestone', 'common', 50, 'workout_count', 10),
('50 Workouts', 'Complete 50 workouts', '🔥', '#e74c3c', 'milestone', 'rare', 200, 'workout_count', 50),
('100 Workouts', 'Complete 100 workouts', '⚡', '#f39c12', 'milestone', 'epic', 500, 'workout_count', 100),
('500 Workouts', 'Complete 500 workouts - Legend!', '👑', '#9b59b6', 'milestone', 'legendary', 2000, 'workout_count', 500),

-- Streak Achievements
('3-Day Streak', 'Workout for 3 days in a row', '🔥', '#e74c3c', 'streak', 'common', 20, 'streak_days', 3),
('7-Day Streak', 'Workout for 7 consecutive days', '🔥', '#e67e22', 'streak', 'rare', 100, 'streak_days', 7),
('30-Day Streak', 'Workout for 30 consecutive days', '🔥', '#c0392b', 'streak', 'epic', 500, 'streak_days', 30),
('100-Day Streak', 'Workout for 100 consecutive days!', '🔥', '#8e44ad', 'streak', 'legendary', 2000, 'streak_days', 100),

-- Strength & Performance
('Strength Master', 'Complete 100 strength exercises', '🏋️', '#9b59b6', 'achievement', 'rare', 150, 'exercise_count', 100),
('Cardio King', 'Burn 10,000 calories through cardio', '🏃', '#1abc9c', 'achievement', 'rare', 150, 'calories_burned', 10000),
('Consistency King', 'Workout at least 4 times per week for a month', '👑', '#f39c12', 'achievement', 'epic', 300, 'weekly_consistency', 4),

-- Social & Community
('Team Player', 'Join your first challenge', '🤝', '#3498db', 'social', 'common', 25, 'challenge_joined', 1),
('Challenge Champion', 'Win a weekly challenge', '🏆', '#f1c40f', 'social', 'epic', 400, 'challenge_won', 1),
('Community Leader', 'Finish in top 10 of 5 challenges', '⭐', '#e67e22', 'social', 'legendary', 1000, 'top_10_finishes', 5),

-- Special Achievements
('Early Bird', 'Complete a workout before 6 AM', '🌅', '#f39c12', 'achievement', 'rare', 75, 'early_workout', 1),
('Night Owl', 'Complete a workout after 10 PM', '🌙', '#34495e', 'achievement', 'rare', 75, 'late_workout', 1),
('Perfect Week', 'Complete all planned workouts in a week', '✨', '#9b59b6', 'achievement', 'epic', 250, 'perfect_week', 1),
('Marathon Runner', 'Complete a workout longer than 90 minutes', '🏃‍♂️', '#e74c3c', 'achievement', 'rare', 100, 'long_workout', 90),
('Variety Seeker', 'Try 5 different workout types', '🎯', '#16a085', 'achievement', 'rare', 100, 'workout_types', 5)

ON CONFLICT DO NOTHING;

-- =============================================
-- 11. SEED DATA - INITIAL WEEKLY CHALLENGE
-- =============================================

INSERT INTO challenges (
  title, 
  description, 
  challenge_type, 
  metric_type, 
  target_value,
  start_date, 
  end_date,
  prize_description,
  is_active
) VALUES (
  '🔥 Weekly Warrior Challenge',
  'Complete as many workouts as possible this week! Top 10 users earn the Challenge Champion badge and bragging rights.',
  'weekly',
  'workouts_completed',
  NULL,
  DATE_TRUNC('week', CURRENT_DATE),
  DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days',
  'Top 10 earn Challenge Champion badge + 400 points',
  true
)
ON CONFLICT DO NOTHING;

-- =============================================
-- 12. FUNCTION: Award Badge to User
-- =============================================
CREATE OR REPLACE FUNCTION award_badge_to_user(
  p_user_id UUID,
  p_badge_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO user_badges (user_id, badge_id)
  VALUES (p_user_id, p_badge_id)
  ON CONFLICT (user_id, badge_id) DO NOTHING;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 13. FUNCTION: Check and Award Automatic Badges
-- =============================================
CREATE OR REPLACE FUNCTION check_and_award_badges(p_user_id UUID)
RETURNS TABLE(badge_name TEXT, badge_icon TEXT) AS $$
DECLARE
  v_stats RECORD;
  v_badge RECORD;
BEGIN
  -- Get user stats
  SELECT * INTO v_stats FROM user_stats WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Check each badge requirement
  FOR v_badge IN 
    SELECT b.* 
    FROM badges b
    LEFT JOIN user_badges ub ON ub.badge_id = b.id AND ub.user_id = p_user_id
    WHERE b.is_active = true 
    AND ub.id IS NULL -- Not yet earned
  LOOP
    -- Check if requirement is met
    IF (v_badge.requirement_type = 'workout_count' AND v_stats.total_workouts >= v_badge.requirement_value) OR
       (v_badge.requirement_type = 'streak_days' AND v_stats.current_streak >= v_badge.requirement_value) OR
       (v_badge.requirement_type = 'calories_burned' AND v_stats.total_calories_burned >= v_badge.requirement_value) OR
       (v_badge.requirement_type = 'exercise_count' AND v_stats.total_exercises_completed >= v_badge.requirement_value)
    THEN
      -- Award the badge
      PERFORM award_badge_to_user(p_user_id, v_badge.id);
      
      -- Return awarded badge info
      badge_name := v_badge.name;
      badge_icon := v_badge.icon;
      RETURN NEXT;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE badges IS 'Achievement badges that users can earn';
COMMENT ON TABLE challenges IS 'Weekly/Monthly challenges for user engagement';
COMMENT ON TABLE user_badges IS 'Tracks which badges each user has earned';
COMMENT ON TABLE challenge_progress IS 'User progress in active challenges';
COMMENT ON TABLE user_stats IS 'Overall gamification statistics per user';
