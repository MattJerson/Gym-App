-- Migration: Update subscription_packages table with features and enhanced metadata
-- Run this in your Supabase SQL Editor

-- Add features column and update metadata structure
ALTER TABLE public.subscription_packages 
  ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS badge text,
  ADD COLUMN IF NOT EXISTS emoji text,
  ADD COLUMN IF NOT EXISTS accent_color text DEFAULT '#4A9EFF',
  ADD COLUMN IF NOT EXISTS is_popular boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Insert/Update subscription packages with features
INSERT INTO public.subscription_packages (slug, name, price, billing_interval, features, badge, emoji, accent_color, is_popular, sort_order, metadata)
VALUES 
  -- Free Trial
  (
    'free-trial',
    'Free Trial',
    0,
    'one_time',
    '[
      {"text": "7 days unlimited access", "included": true},
      {"text": "Basic workout plans", "included": true},
      {"text": "Basic meal plans", "included": true},
      {"text": "Activity tracking", "included": true},
      {"text": "AI workout assistant", "included": false},
      {"text": "Custom nutrition plans", "included": false}
    ]'::jsonb,
    'TRY FREE',
    '🎁',
    '#00D4AA',
    false,
    1,
    '{"duration_days": 7, "trial": true}'::jsonb
  ),
  -- Monthly
  (
    'monthly',
    'Monthly',
    9.99,
    'month',
    '[
      {"text": "Unlimited workout plans", "included": true},
      {"text": "Personalized meal plans", "included": true},
      {"text": "Activity & progress tracking", "included": true},
      {"text": "AI workout assistant", "included": true},
      {"text": "Custom nutrition analysis", "included": true},
      {"text": "Community access", "included": true}
    ]'::jsonb,
    null,
    '💪',
    '#4A9EFF',
    false,
    2,
    '{"billing_cycle": "monthly", "cancellable": true}'::jsonb
  ),
  -- Annual
  (
    'annual',
    'Annual',
    79.99,
    'year',
    '[
      {"text": "Everything in Monthly", "included": true},
      {"text": "Save 33% vs Monthly", "included": true},
      {"text": "Priority support", "included": true},
      {"text": "Early access to features", "included": true},
      {"text": "Advanced analytics", "included": true},
      {"text": "Workout history export", "included": true}
    ]'::jsonb,
    'BEST VALUE',
    '🏆',
    '#FFB800',
    true,
    3,
    '{"savings_percent": 33, "billing_cycle": "annual"}'::jsonb
  ),
  -- Lifetime
  (
    'lifetime',
    'Lifetime',
    149.99,
    'one_time',
    '[
      {"text": "Everything in Annual", "included": true},
      {"text": "Lifetime updates", "included": true},
      {"text": "No recurring payments", "included": true},
      {"text": "VIP support", "included": true},
      {"text": "Exclusive content", "included": true},
      {"text": "Beta features access", "included": true}
    ]'::jsonb,
    'ONE-TIME',
    '🚀',
    '#FF4D4D',
    false,
    4,
    '{"lifetime": true, "one_time_payment": true}'::jsonb
  )
ON CONFLICT (slug) 
DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  billing_interval = EXCLUDED.billing_interval,
  features = EXCLUDED.features,
  badge = EXCLUDED.badge,
  emoji = EXCLUDED.emoji,
  accent_color = EXCLUDED.accent_color,
  is_popular = EXCLUDED.is_popular,
  sort_order = EXCLUDED.sort_order,
  metadata = EXCLUDED.metadata;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_subscription_packages_sort_order 
  ON public.subscription_packages(sort_order);

CREATE INDEX IF NOT EXISTS idx_subscription_packages_slug 
  ON public.subscription_packages(slug);

-- Grant access to authenticated users
GRANT SELECT ON public.subscription_packages TO authenticated;

COMMENT ON TABLE public.subscription_packages IS 'Subscription plans with features and pricing';
COMMENT ON COLUMN public.subscription_packages.features IS 'Array of feature objects with text and included boolean';
COMMENT ON COLUMN public.subscription_packages.badge IS 'Badge text displayed on card (e.g., BEST VALUE)';
COMMENT ON COLUMN public.subscription_packages.emoji IS 'Emoji icon for the plan';
COMMENT ON COLUMN public.subscription_packages.accent_color IS 'Primary color for the card and CTA';
COMMENT ON COLUMN public.subscription_packages.is_popular IS 'Whether to highlight this plan as popular';
COMMENT ON COLUMN public.subscription_packages.sort_order IS 'Display order (lower = first)';
