-- This is only placeholder will change upon development


-- Users table (structured)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Badges (structured)
CREATE TABLE IF NOT EXISTS badges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(100),
  awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tracking (flexible using JSONB)
CREATE TABLE IF NOT EXISTS tracking (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  data JSONB,
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
