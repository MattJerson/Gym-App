-- =============================================
-- FEATURED CONTENT SYSTEM
-- Allows admins to manage featured videos/articles on home page
-- =============================================

-- Create featured_content table
CREATE TABLE IF NOT EXISTS public.featured_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  subtitle VARCHAR(300),
  content_type VARCHAR(50) NOT NULL, -- 'video', 'article', 'workout'
  thumbnail_url TEXT,
  youtube_url TEXT, -- For video content
  article_url TEXT, -- For article content
  workout_id UUID REFERENCES public.workout_templates(id) ON DELETE SET NULL,
  author VARCHAR(100),
  category VARCHAR(100), -- 'Education', 'Motivation', 'Technique', etc.
  duration VARCHAR(50), -- e.g., "12 min read", "15 min video"
  views_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  active_from TIMESTAMPTZ DEFAULT NOW(),
  active_until TIMESTAMPTZ
);

-- Create index for active content queries
CREATE INDEX IF NOT EXISTS idx_featured_content_active 
  ON public.featured_content(is_active, display_order, created_at DESC);

-- Create index for content type
CREATE INDEX IF NOT EXISTS idx_featured_content_type 
  ON public.featured_content(content_type);

-- Add trigger to update updated_at
CREATE TRIGGER trigger_featured_content_updated_at
  BEFORE UPDATE ON public.featured_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE public.featured_content ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active featured content
CREATE POLICY "Anyone can view active featured content"
  ON public.featured_content FOR SELECT
  USING (
    is_active = true 
    AND (active_from IS NULL OR active_from <= NOW())
    AND (active_until IS NULL OR active_until >= NOW())
  );

-- Policy: Service role can manage all content (admin panel)
CREATE POLICY "Service role can manage featured content"
  ON public.featured_content FOR ALL
  USING (auth.role() = 'service_role');

-- Policy: Authenticated users can insert
CREATE POLICY "Authenticated users can create featured content"
  ON public.featured_content FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Authenticated users can update
CREATE POLICY "Authenticated users can update featured content"
  ON public.featured_content FOR UPDATE
  USING (auth.role() = 'authenticated');

-- =============================================
-- SEED DATA - Initial Featured Content
-- =============================================

INSERT INTO public.featured_content (
  title,
  subtitle,
  content_type,
  thumbnail_url,
  youtube_url,
  author,
  category,
  duration,
  views_count,
  is_active,
  display_order
) VALUES
(
  'Complete Core Transformation',
  'Science-Based Training for a Stronger Core',
  'video',
  'https://img.youtube.com/vi/2tM1LFFxeKg/maxresdefault.jpg',
  'https://www.youtube.com/watch?v=2tM1LFFxeKg',
  'Dr. Mike Fitness',
  'Education',
  '12 min video',
  2100000,
  true,
  1
),
(
  'Perfect Push-Up Form Guide',
  'Master the fundamentals of proper push-up technique',
  'video',
  'https://img.youtube.com/vi/IODxDxX7oi4/maxresdefault.jpg',
  'https://www.youtube.com/watch?v=IODxDxX7oi4',
  'AthleanX',
  'Technique',
  '8 min video',
  5600000,
  true,
  2
),
(
  'Ultimate Home Workout Guide',
  'Build muscle without any equipment',
  'video',
  'https://img.youtube.com/vi/vc1E5CfRfos/maxresdefault.jpg',
  'https://www.youtube.com/watch?v=vc1E5CfRfos',
  'Calisthenicmovement',
  'Workout',
  '20 min workout',
  3200000,
  false,
  3
);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_featured_content_views(content_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.featured_content
  SET views_count = views_count + 1
  WHERE id = content_id;
END;
$$;

-- Function to get active featured content (for home page)
CREATE OR REPLACE FUNCTION get_active_featured_content(limit_count INTEGER DEFAULT 1)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  subtitle VARCHAR,
  content_type VARCHAR,
  thumbnail_url TEXT,
  youtube_url TEXT,
  article_url TEXT,
  author VARCHAR,
  category VARCHAR,
  duration VARCHAR,
  views_count INTEGER,
  display_order INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fc.id,
    fc.title,
    fc.subtitle,
    fc.content_type,
    fc.thumbnail_url,
    fc.youtube_url,
    fc.article_url,
    fc.author,
    fc.category,
    fc.duration,
    fc.views_count,
    fc.display_order
  FROM public.featured_content fc
  WHERE fc.is_active = true
    AND (fc.active_from IS NULL OR fc.active_from <= NOW())
    AND (fc.active_until IS NULL OR fc.active_until >= NOW())
  ORDER BY fc.display_order ASC, fc.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Verify the table was created
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'featured_content'
ORDER BY ordinal_position;
