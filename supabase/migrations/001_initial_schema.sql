-- Minerva Foods - Global FAQ
-- Supabase schema for corporate access, admin content, themes, FAQs and analytics.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  department TEXT,
  country TEXT,
  language_preference TEXT NOT NULL DEFAULT 'pt' CHECK (language_preference IN ('pt', 'en', 'es')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.themes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_pt TEXT NOT NULL,
  title_en TEXT NOT NULL,
  title_es TEXT NOT NULL,
  description_pt TEXT,
  description_en TEXT,
  description_es TEXT,
  icon TEXT DEFAULT 'folder',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  theme_id UUID REFERENCES public.themes(id) ON DELETE SET NULL,
  question_pt TEXT NOT NULL,
  question_en TEXT NOT NULL,
  question_es TEXT NOT NULL,
  answer_pt TEXT NOT NULL,
  answer_en TEXT NOT NULL,
  answer_es TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id),
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'question' CHECK (event_type IN ('theme_opened', 'question_opened', 'question')),
  query_text TEXT,
  detected_language TEXT NOT NULL DEFAULT 'pt' CHECK (detected_language IN ('pt', 'en', 'es')),
  country TEXT,
  theme_id UUID REFERENCES public.themes(id),
  faq_matched_id UUID REFERENCES public.faqs(id),
  confidence FLOAT,
  was_helpful BOOLEAN,
  feedback_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_themes_active_sort ON public.themes(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_faqs_theme ON public.faqs(theme_id);
CREATE INDEX IF NOT EXISTS idx_faqs_active_sort ON public.faqs(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_logs_created ON public.usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_theme ON public.usage_logs(theme_id);
CREATE INDEX IF NOT EXISTS idx_logs_faq ON public.usage_logs(faq_matched_id);
CREATE INDEX IF NOT EXISTS idx_logs_session ON public.usage_logs(session_id);

CREATE OR REPLACE FUNCTION public.enforce_corporate_email()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF lower(NEW.email) NOT LIKE '%@minervafoods.com' THEN
    RAISE EXCEPTION 'Only @minervafoods.com emails are permitted.';
  END IF;
  NEW.email = lower(NEW.email);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_corporate_email ON public.user_profiles;
CREATE TRIGGER trg_profiles_corporate_email
  BEFORE INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_corporate_email();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_themes_updated_at ON public.themes;
CREATE TRIGGER trg_themes_updated_at
  BEFORE UPDATE ON public.themes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_faqs_updated_at ON public.faqs;
CREATE TRIGGER trg_faqs_updated_at
  BEFORE UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.user_profiles;
CREATE POLICY "profiles_select_own_or_admin"
  ON public.user_profiles FOR SELECT
  USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_own" ON public.user_profiles;
CREATE POLICY "profiles_update_own"
  ON public.user_profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = 'user');

DROP POLICY IF EXISTS "profiles_insert_authenticated" ON public.user_profiles;
CREATE POLICY "profiles_insert_authenticated"
  ON public.user_profiles FOR INSERT
  WITH CHECK (id = auth.uid() AND lower(email) LIKE '%@minervafoods.com');

DROP POLICY IF EXISTS "themes_select_active_or_admin" ON public.themes;
CREATE POLICY "themes_select_active_or_admin"
  ON public.themes FOR SELECT
  USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "themes_admin_insert" ON public.themes;
CREATE POLICY "themes_admin_insert"
  ON public.themes FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "themes_admin_update" ON public.themes;
CREATE POLICY "themes_admin_update"
  ON public.themes FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "themes_admin_delete" ON public.themes;
CREATE POLICY "themes_admin_delete"
  ON public.themes FOR DELETE
  USING (public.is_admin());

DROP POLICY IF EXISTS "faqs_select_active_or_admin" ON public.faqs;
CREATE POLICY "faqs_select_active_or_admin"
  ON public.faqs FOR SELECT
  USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "faqs_admin_insert" ON public.faqs;
CREATE POLICY "faqs_admin_insert"
  ON public.faqs FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "faqs_admin_update" ON public.faqs;
CREATE POLICY "faqs_admin_update"
  ON public.faqs FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "faqs_admin_delete" ON public.faqs;
CREATE POLICY "faqs_admin_delete"
  ON public.faqs FOR DELETE
  USING (public.is_admin());

DROP POLICY IF EXISTS "logs_insert_authenticated" ON public.usage_logs;
CREATE POLICY "logs_insert_authenticated"
  ON public.usage_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "logs_select_own_or_admin" ON public.usage_logs;
CREATE POLICY "logs_select_own_or_admin"
  ON public.usage_logs FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "logs_update_own_feedback" ON public.usage_logs;
CREATE POLICY "logs_update_own_feedback"
  ON public.usage_logs FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE OR REPLACE VIEW public.analytics_popular_faqs AS
SELECT
  f.id,
  f.theme_id,
  f.question_pt,
  f.question_en,
  f.question_es,
  COUNT(l.id) AS times_accessed,
  COUNT(CASE WHEN l.was_helpful = TRUE THEN 1 END) AS helpful_count,
  COUNT(CASE WHEN l.was_helpful = FALSE THEN 1 END) AS not_helpful_count
FROM public.faqs f
LEFT JOIN public.usage_logs l ON l.faq_matched_id = f.id
GROUP BY f.id, f.theme_id, f.question_pt, f.question_en, f.question_es
ORDER BY times_accessed DESC;

CREATE OR REPLACE VIEW public.analytics_theme_usage AS
SELECT
  t.id,
  t.title_pt,
  t.title_en,
  t.title_es,
  COUNT(l.id) AS times_accessed
FROM public.themes t
LEFT JOIN public.usage_logs l ON l.theme_id = t.id
GROUP BY t.id, t.title_pt, t.title_en, t.title_es
ORDER BY times_accessed DESC;

GRANT SELECT ON public.analytics_popular_faqs TO authenticated;
GRANT SELECT ON public.analytics_theme_usage TO authenticated;
