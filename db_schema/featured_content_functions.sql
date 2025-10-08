-- Function to get currently active featured content (only one at a time)
CREATE OR REPLACE FUNCTION get_active_featured_content()
RETURNS TABLE (
  id uuid,
  title varchar,
  subtitle varchar,
  content_type varchar,
  thumbnail_url text,
  youtube_url text,
  article_url text,
  workout_id uuid,
  author varchar,
  category varchar,
  duration varchar,
  views_count integer,
  is_active boolean,
  display_order integer,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  active_from timestamptz,
  active_until timestamptz
) AS $$
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
    fc.workout_id,
    fc.author,
    fc.category,
    fc.duration,
    fc.views_count,
    fc.is_active,
    fc.display_order,
    fc.created_by,
    fc.created_at,
    fc.updated_at,
    fc.active_from,
    fc.active_until
  FROM featured_content fc
  WHERE fc.is_active = true
    AND (fc.active_from IS NULL OR fc.active_from <= NOW())
    AND (fc.active_until IS NULL OR fc.active_until >= NOW())
  ORDER BY fc.display_order ASC, fc.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get previously active featured content (most recent inactive)
CREATE OR REPLACE FUNCTION get_previous_featured_content()
RETURNS TABLE (
  id uuid,
  title varchar,
  subtitle varchar,
  content_type varchar,
  thumbnail_url text,
  youtube_url text,
  article_url text,
  workout_id uuid,
  author varchar,
  category varchar,
  duration varchar,
  views_count integer,
  is_active boolean,
  display_order integer,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  active_from timestamptz,
  active_until timestamptz
) AS $$
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
    fc.workout_id,
    fc.author,
    fc.category,
    fc.duration,
    fc.views_count,
    fc.is_active,
    fc.display_order,
    fc.created_by,
    fc.created_at,
    fc.updated_at,
    fc.active_from,
    fc.active_until
  FROM featured_content fc
  WHERE fc.is_active = false
    OR (fc.active_until IS NOT NULL AND fc.active_until < NOW())
  ORDER BY 
    COALESCE(fc.active_until, fc.updated_at, fc.created_at) DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_featured_content_views(content_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE featured_content
  SET views_count = views_count + 1
  WHERE id = content_id;
END;
$$ LANGUAGE plpgsql;

-- Function to ensure only one content is active at a time
CREATE OR REPLACE FUNCTION ensure_single_active_featured_content()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this content to active
  IF NEW.is_active = true THEN
    -- Deactivate all other content
    UPDATE featured_content
    SET is_active = false
    WHERE id != NEW.id AND is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce single active content
DROP TRIGGER IF EXISTS enforce_single_active_featured_content ON featured_content;
CREATE TRIGGER enforce_single_active_featured_content
  BEFORE INSERT OR UPDATE ON featured_content
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_active_featured_content();
