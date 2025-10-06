-- Migration: Meal Logging System
-- Description: Tables for user meal logs, food database, and popular foods tracking
-- Version: 004
-- Date: 2025-10-07

-- ============================================================
-- 1. FOOD DATABASE TABLE (Cache API results & custom foods)
-- ============================================================
CREATE TABLE IF NOT EXISTS food_database (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fdc_id TEXT UNIQUE, -- FoodData Central ID (null for custom foods)
    name TEXT NOT NULL,
    brand TEXT,
    description TEXT,
    
    -- Nutritional info per 100g serving
    calories DECIMAL(10, 2) NOT NULL DEFAULT 0,
    protein DECIMAL(10, 2) NOT NULL DEFAULT 0,
    carbs DECIMAL(10, 2) NOT NULL DEFAULT 0,
    fats DECIMAL(10, 2) NOT NULL DEFAULT 0,
    fiber DECIMAL(10, 2) DEFAULT 0,
    sugar DECIMAL(10, 2) DEFAULT 0,
    sodium DECIMAL(10, 2) DEFAULT 0,
    
    -- Serving information
    serving_size DECIMAL(10, 2) DEFAULT 100, -- Default serving size in grams
    serving_unit TEXT DEFAULT 'g',
    
    -- Metadata
    category TEXT, -- e.g., 'protein', 'vegetable', 'grain', etc.
    is_custom BOOLEAN DEFAULT FALSE, -- Custom user-created food
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Tracking
    total_logs INTEGER DEFAULT 0, -- Total times logged across all users
    last_logged_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_food_database_fdc_id ON food_database(fdc_id);
CREATE INDEX idx_food_database_name ON food_database(name);
CREATE INDEX idx_food_database_total_logs ON food_database(total_logs DESC);
CREATE INDEX idx_food_database_category ON food_database(category);

-- ============================================================
-- 2. USER MEAL LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS user_meal_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    food_id UUID NOT NULL REFERENCES food_database(id) ON DELETE CASCADE,
    
    -- Meal context
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
    meal_time TIME,
    
    -- Serving information (actual amount logged)
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
    serving_size DECIMAL(10, 2) NOT NULL, -- Grams
    serving_unit TEXT DEFAULT 'g',
    
    -- Calculated nutrition (quantity * nutrition per serving)
    calories DECIMAL(10, 2) NOT NULL,
    protein DECIMAL(10, 2) NOT NULL,
    carbs DECIMAL(10, 2) NOT NULL,
    fats DECIMAL(10, 2) NOT NULL,
    fiber DECIMAL(10, 2) DEFAULT 0,
    sugar DECIMAL(10, 2) DEFAULT 0,
    sodium DECIMAL(10, 2) DEFAULT 0,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_meal_logs_user_date ON user_meal_logs(user_id, meal_date DESC);
CREATE INDEX idx_user_meal_logs_user_id ON user_meal_logs(user_id);
CREATE INDEX idx_user_meal_logs_meal_date ON user_meal_logs(meal_date DESC);
CREATE INDEX idx_user_meal_logs_food_id ON user_meal_logs(food_id);
CREATE INDEX idx_user_meal_logs_meal_type ON user_meal_logs(meal_type);

-- ============================================================
-- 3. USER FOOD HISTORY TABLE (Quick access to recent foods)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_food_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    food_id UUID NOT NULL REFERENCES food_database(id) ON DELETE CASCADE,
    
    -- Tracking
    last_logged_at TIMESTAMPTZ DEFAULT NOW(),
    log_count INTEGER DEFAULT 1, -- How many times user has logged this food
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, food_id)
);

-- Indexes for performance
CREATE INDEX idx_user_food_history_user_recent ON user_food_history(user_id, last_logged_at DESC);
CREATE INDEX idx_user_food_history_user_count ON user_food_history(user_id, log_count DESC);

-- ============================================================
-- 4. POPULAR FOODS VIEW (Global popular foods)
-- ============================================================
CREATE OR REPLACE VIEW popular_foods AS
SELECT 
    fd.*,
    COUNT(DISTINCT uml.user_id) as unique_users,
    fd.total_logs
FROM food_database fd
INNER JOIN user_meal_logs uml ON fd.id = uml.food_id
WHERE fd.last_logged_at >= NOW() - INTERVAL '30 days' -- Popular in last 30 days
GROUP BY fd.id
HAVING COUNT(DISTINCT uml.user_id) >= 3 -- At least 3 different users
ORDER BY fd.total_logs DESC, unique_users DESC
LIMIT 20;

-- ============================================================
-- 5. TRIGGER FUNCTIONS
-- ============================================================

-- Update food_database stats when a meal is logged
CREATE OR REPLACE FUNCTION update_food_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE food_database
    SET 
        total_logs = total_logs + 1,
        last_logged_at = NOW(),
        updated_at = NOW()
    WHERE id = NEW.food_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update user_food_history when a meal is logged
CREATE OR REPLACE FUNCTION update_user_food_history()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_food_history (user_id, food_id, last_logged_at, log_count)
    VALUES (NEW.user_id, NEW.food_id, NOW(), 1)
    ON CONFLICT (user_id, food_id) 
    DO UPDATE SET
        last_logged_at = NOW(),
        log_count = user_food_history.log_count + 1,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 6. ATTACH TRIGGERS
-- ============================================================

-- Trigger to update food stats when meal is logged
DROP TRIGGER IF EXISTS trigger_update_food_stats ON user_meal_logs;
CREATE TRIGGER trigger_update_food_stats
    AFTER INSERT ON user_meal_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_food_stats();

-- Trigger to update user food history when meal is logged
DROP TRIGGER IF EXISTS trigger_update_user_food_history ON user_meal_logs;
CREATE TRIGGER trigger_update_user_food_history
    AFTER INSERT ON user_meal_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_user_food_history();

-- Trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS trigger_food_database_updated_at ON food_database;
CREATE TRIGGER trigger_food_database_updated_at
    BEFORE UPDATE ON food_database
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_user_meal_logs_updated_at ON user_meal_logs;
CREATE TRIGGER trigger_user_meal_logs_updated_at
    BEFORE UPDATE ON user_meal_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS
ALTER TABLE food_database ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_food_history ENABLE ROW LEVEL SECURITY;

-- Food Database Policies (Everyone can read, only creators can modify custom foods)
CREATE POLICY "Anyone can view foods"
    ON food_database FOR SELECT
    USING (true);

CREATE POLICY "Users can create custom foods"
    ON food_database FOR INSERT
    WITH CHECK (auth.uid() = created_by AND is_custom = true);

CREATE POLICY "Users can update their custom foods"
    ON food_database FOR UPDATE
    USING (auth.uid() = created_by AND is_custom = true);

-- User Meal Logs Policies (Users can only access their own logs)
CREATE POLICY "Users can view their own meal logs"
    ON user_meal_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own meal logs"
    ON user_meal_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal logs"
    ON user_meal_logs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal logs"
    ON user_meal_logs FOR DELETE
    USING (auth.uid() = user_id);

-- User Food History Policies (Users can only access their own history)
CREATE POLICY "Users can view their own food history"
    ON user_food_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own food history"
    ON user_food_history FOR ALL
    USING (auth.uid() = user_id);

-- ============================================================
-- 8. SEED POPULAR FOODS DATA (Initial data for testing)
-- ============================================================

-- Insert some popular foods with realistic nutrition data
INSERT INTO food_database (fdc_id, name, brand, description, calories, protein, carbs, fats, fiber, sugar, serving_size, category, total_logs, last_logged_at) VALUES
-- Proteins
('170567', 'Chicken Breast, Grilled', 'Generic', 'Skinless, boneless chicken breast, grilled', 165, 31, 0, 3.6, 0, 0, 100, 'protein', 1250, NOW() - INTERVAL '2 hours'),
('173410', 'Salmon, Atlantic, Cooked', 'Generic', 'Atlantic salmon, dry heat cooked', 206, 22, 0, 12.4, 0, 0, 100, 'protein', 980, NOW() - INTERVAL '5 hours'),
('174608', 'Ground Beef, 90/10, Cooked', 'Generic', 'Lean ground beef, pan-browned', 197, 26, 0, 10, 0, 0, 100, 'protein', 875, NOW() - INTERVAL '8 hours'),
('175168', 'Eggs, Whole, Cooked', 'Generic', 'Whole eggs, scrambled', 149, 12.5, 1.5, 10, 0, 1.5, 100, 'protein', 1150, NOW() - INTERVAL '3 hours'),

-- Carbs
('169704', 'Brown Rice, Cooked', 'Generic', 'Long grain brown rice, cooked', 123, 2.7, 25.6, 1, 1.6, 0.4, 100, 'grain', 1020, NOW() - INTERVAL '4 hours'),
('170379', 'Sweet Potato, Baked', 'Generic', 'Sweet potato, baked with skin', 90, 2, 20.7, 0.2, 3.3, 6.5, 100, 'vegetable', 945, NOW() - INTERVAL '6 hours'),
('168878', 'Oatmeal, Cooked', 'Quaker', 'Old fashioned oats, cooked with water', 71, 2.5, 12, 1.5, 1.7, 0.4, 100, 'grain', 1340, NOW() - INTERVAL '1 hour'),
('170418', 'Quinoa, Cooked', 'Generic', 'Quinoa, cooked', 120, 4.4, 21.3, 1.9, 2.8, 0.9, 100, 'grain', 720, NOW() - INTERVAL '7 hours'),

-- Vegetables
('169967', 'Broccoli, Steamed', 'Generic', 'Broccoli, steamed', 35, 2.4, 7, 0.4, 3.3, 1.4, 100, 'vegetable', 890, NOW() - INTERVAL '5 hours'),
('169414', 'Spinach, Raw', 'Generic', 'Fresh spinach leaves', 23, 2.9, 3.6, 0.4, 2.2, 0.4, 100, 'vegetable', 760, NOW() - INTERVAL '9 hours'),
('170000', 'Avocado, Raw', 'Generic', 'Fresh avocado', 160, 2, 8.5, 14.7, 6.7, 0.7, 100, 'healthy_fat', 1180, NOW() - INTERVAL '2 hours'),

-- Fruits
('173944', 'Banana, Raw', 'Generic', 'Fresh banana', 89, 1.1, 22.8, 0.3, 2.6, 12.2, 100, 'fruit', 1420, NOW() - INTERVAL '1 hour'),
('167762', 'Blueberries, Raw', 'Generic', 'Fresh blueberries', 57, 0.7, 14.5, 0.3, 2.4, 10, 100, 'fruit', 830, NOW() - INTERVAL '6 hours'),
('167765', 'Strawberries, Raw', 'Generic', 'Fresh strawberries', 32, 0.7, 7.7, 0.3, 2, 4.9, 100, 'fruit', 910, NOW() - INTERVAL '4 hours'),

-- Dairy & Alternatives
('171287', 'Greek Yogurt, Plain, Nonfat', 'Fage', 'Plain nonfat greek yogurt', 59, 10.2, 3.6, 0.4, 0, 3.2, 100, 'dairy', 1050, NOW() - INTERVAL '3 hours'),
('173425', 'Almond Milk, Unsweetened', 'Almond Breeze', 'Unsweetened almond milk', 15, 0.6, 0.6, 1.1, 0.4, 0, 100, 'dairy_alternative', 680, NOW() - INTERVAL '8 hours'),

-- Snacks & Other
('170554', 'Almonds, Raw', 'Generic', 'Raw almonds', 579, 21.2, 21.6, 49.9, 12.5, 4.4, 100, 'nuts', 1290, NOW() - INTERVAL '2 hours'),
('174873', 'Peanut Butter, Natural', 'Generic', 'Natural peanut butter, no added sugar', 588, 25, 20, 50, 6, 9.2, 100, 'nuts', 1110, NOW() - INTERVAL '5 hours'),
('169475', 'Protein Shake, Vanilla', 'Optimum Nutrition', 'Whey protein isolate, vanilla', 120, 24, 3, 1, 0, 1, 30, 'supplement', 1380, NOW() - INTERVAL '1 hour'),
('172420', 'Dark Chocolate, 70% Cacao', 'Generic', 'Dark chocolate bar, 70% cacao', 598, 7.8, 45.8, 42.6, 10.9, 24, 100, 'snack', 650, NOW() - INTERVAL '10 hours')

ON CONFLICT (fdc_id) DO NOTHING;

-- ============================================================
-- 9. HELPER FUNCTIONS FOR API
-- ============================================================

-- Function to get popular foods (non-repeating, unique recipes)
CREATE OR REPLACE FUNCTION get_popular_foods(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    fdc_id TEXT,
    name TEXT,
    brand TEXT,
    description TEXT,
    calories DECIMAL,
    protein DECIMAL,
    carbs DECIMAL,
    fats DECIMAL,
    fiber DECIMAL,
    sugar DECIMAL,
    serving_size DECIMAL,
    serving_unit TEXT,
    category TEXT,
    total_logs INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (fd.name)
        fd.id,
        fd.fdc_id,
        fd.name,
        fd.brand,
        fd.description,
        fd.calories,
        fd.protein,
        fd.carbs,
        fd.fats,
        fd.fiber,
        fd.sugar,
        fd.serving_size,
        fd.serving_unit,
        fd.category,
        fd.total_logs
    FROM food_database fd
    WHERE fd.last_logged_at >= NOW() - INTERVAL '30 days'
    ORDER BY fd.name, fd.total_logs DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's recent foods
CREATE OR REPLACE FUNCTION get_user_recent_foods(p_user_id UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    fdc_id TEXT,
    name TEXT,
    brand TEXT,
    description TEXT,
    calories DECIMAL,
    protein DECIMAL,
    carbs DECIMAL,
    fats DECIMAL,
    fiber DECIMAL,
    sugar DECIMAL,
    serving_size DECIMAL,
    serving_unit TEXT,
    category TEXT,
    last_logged_at TIMESTAMPTZ,
    log_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fd.id,
        fd.fdc_id,
        fd.name,
        fd.brand,
        fd.description,
        fd.calories,
        fd.protein,
        fd.carbs,
        fd.fats,
        fd.fiber,
        fd.sugar,
        fd.serving_size,
        fd.serving_unit,
        fd.category,
        ufh.last_logged_at,
        ufh.log_count
    FROM user_food_history ufh
    INNER JOIN food_database fd ON ufh.food_id = fd.id
    WHERE ufh.user_id = p_user_id
    ORDER BY ufh.last_logged_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
