-- Harper Automation: Initial Schema Migration
-- =============================================

-- ===================
-- Utility Functions
-- ===================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================
-- Tables
-- ===================

-- 1. profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  country TEXT CHECK (country IN ('UK', 'US')),
  currency TEXT CHECK (currency IN ('GBP', 'USD')) DEFAULT 'GBP',
  icp_segment TEXT CHECK (icp_segment IN ('smb', 'franchise', 'agency')),
  stripe_customer_id TEXT UNIQUE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their profile" ON profiles FOR ALL USING (auth.uid() = id);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. businesses
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  website_url TEXT,
  industry TEXT,
  country TEXT CHECK (country IN ('UK', 'US')),
  region TEXT,
  team_size_range TEXT,
  revenue_range TEXT,
  business_type TEXT CHECK (business_type IN ('smb', 'franchise_head', 'franchise_location', 'agency', 'other')),
  parent_franchise_id UUID REFERENCES businesses(id),
  profile_completeness INTEGER DEFAULT 0,
  intelligence_summary TEXT,
  last_intelligence_update TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access businesses they belong to" ON businesses FOR ALL
  USING (id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid()));

CREATE TRIGGER businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. business_members
CREATE TABLE business_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  user_id UUID REFERENCES profiles(id),
  role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, user_id)
);

ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see their own memberships" ON business_members FOR ALL
  USING (user_id = auth.uid());

-- 4. business_intelligence
CREATE TABLE business_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) UNIQUE,
  website_last_analysed TIMESTAMPTZ,
  website_score INTEGER,
  website_analysis JSONB,
  seo_last_checked TIMESTAMPTZ,
  seo_data JSONB,
  social_profiles JSONB,
  social_last_analysed TIMESTAMPTZ,
  social_analysis JSONB,
  known_pain_points JSONB,
  known_workflows JSONB,
  automation_opportunities JSONB,
  current_tools JSONB,
  tool_gaps JSONB,
  current_marketing_activities JSONB,
  marketing_channels JSONB,
  content_status JSONB,
  ad_platforms JSONB,
  stated_goals JSONB,
  budget_signals JSONB,
  decision_timeline TEXT,
  ai_awareness_level TEXT CHECK (ai_awareness_level IN ('none', 'curious', 'experimenting', 'implementing', 'advanced')),
  recommendations_made JSONB,
  recommendations_acted_on JSONB,
  services_purchased JSONB,
  objections_raised JSONB,
  icp_fit_score INTEGER CHECK (icp_fit_score BETWEEN 0 AND 100),
  growth_trajectory TEXT CHECK (growth_trajectory IN ('growing', 'plateau', 'declining', 'unknown')),
  next_best_action TEXT,
  next_best_action_reason TEXT,
  priority_segment TEXT CHECK (priority_segment IN ('hot', 'warm', 'nurture', 'not-a-fit')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE business_intelligence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access intelligence for their businesses" ON business_intelligence FOR ALL
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid()));

CREATE TRIGGER business_intelligence_updated_at
  BEFORE UPDATE ON business_intelligence
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. business_interactions
CREATE TABLE business_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  user_id UUID REFERENCES profiles(id),
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('report_session', 'tool_audit', 'growth_audit', 'discovery_call', 'project', 'retainer_month', 'email_reply', 'scorecard')),
  reference_id UUID,
  summary TEXT,
  key_findings JSONB,
  new_intelligence JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE business_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access interactions for their businesses" ON business_interactions FOR ALL
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid()));

-- 6. tool_recommendations
CREATE TABLE tool_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  interaction_id UUID REFERENCES business_interactions(id),
  tool_name TEXT NOT NULL,
  tool_category TEXT CHECK (tool_category IN ('crm_sales', 'marketing_seo', 'automation_ops', 'ai_assistants', 'website_design', 'analytics_reporting')),
  recommendation_tier TEXT CHECK (recommendation_tier IN ('essential', 'recommended', 'consider', 'avoid')),
  reason TEXT,
  replaces_what TEXT,
  estimated_monthly_cost TEXT,
  implementation_effort TEXT CHECK (implementation_effort IN ('self-service', 'guided', 'full-build')),
  harper_can_implement BOOLEAN DEFAULT FALSE,
  implementation_product TEXT,
  status TEXT DEFAULT 'recommended' CHECK (status IN ('recommended', 'user_confirmed_using', 'user_declined', 'superseded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tool_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access recommendations for their businesses" ON tool_recommendations FOR ALL
  USING (business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid()));

-- 7. tool_database
CREATE TABLE tool_database (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT,
  description TEXT,
  best_for TEXT,
  not_good_for TEXT,
  pricing_model TEXT,
  price_gbp_monthly TEXT,
  price_usd_monthly TEXT,
  free_tier BOOLEAN DEFAULT FALSE,
  harper_can_implement BOOLEAN DEFAULT FALSE,
  implementation_effort TEXT,
  implementation_product TEXT,
  alternatives JSONB,
  harper_rating INTEGER CHECK (harper_rating BETWEEN 1 AND 5),
  harper_notes TEXT,
  affiliate_link TEXT,
  active BOOLEAN DEFAULT TRUE,
  last_reviewed DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tool_database ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tool database is publicly readable" ON tool_database FOR SELECT
  USING (true);

-- 8. report_sessions
CREATE TABLE report_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  business_id UUID REFERENCES businesses(id),
  report_type TEXT NOT NULL CHECK (report_type IN ('business_intelligence', 'tech_stack_audit', 'franchise_intelligence', 'growth_audit', 'deep_dive_audit', 'scorecard')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'payment_complete', 'intake_complete', 'researching', 'research_complete', 'in_progress', 'generating', 'complete', 'failed')),
  bulk_credit_id UUID,
  is_white_label BOOLEAN DEFAULT FALSE,
  white_label_config JSONB,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  currency TEXT CHECK (currency IN ('GBP', 'USD')),
  amount_paid INTEGER,
  stripe_promo_code TEXT,
  campaign_source TEXT,
  intake_completed_at TIMESTAMPTZ,
  research_started_at TIMESTAMPTZ,
  research_completed_at TIMESTAMPTZ,
  interview_started_at TIMESTAMPTZ,
  interview_completed_at TIMESTAMPTZ,
  report_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE report_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their sessions" ON report_sessions FOR ALL
  USING (auth.uid() = user_id);

-- 9. intake_forms
CREATE TABLE intake_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES report_sessions(id) UNIQUE,
  business_name TEXT,
  website_url TEXT NOT NULL,
  industry TEXT,
  years_in_business TEXT,
  team_size TEXT,
  revenue_range TEXT,
  social_instagram TEXT,
  social_linkedin TEXT,
  social_facebook TEXT,
  social_tiktok TEXT,
  social_other TEXT,
  has_google_business BOOLEAN,
  runs_paid_ads BOOLEAN,
  paid_ad_platforms TEXT[],
  reason_for_today TEXT,
  whats_working TEXT,
  biggest_challenge TEXT,
  prior_agency_experience TEXT,
  annual_budget TEXT,
  success_in_12_months TEXT,
  specific_interview_topics TEXT,
  referral_source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE intake_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access their own intake forms" ON intake_forms FOR ALL
  USING (session_id IN (SELECT id FROM report_sessions WHERE user_id = auth.uid()));

-- 10. research_results
CREATE TABLE research_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES report_sessions(id) UNIQUE,
  website_analysis JSONB,
  social_analysis JSONB,
  seo_data JSONB,
  tech_stack JSONB,
  competitor_signals JSONB,
  agent_briefing JSONB,
  research_status TEXT DEFAULT 'pending' CHECK (research_status IN ('pending', 'running', 'complete', 'partial', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE research_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access their own research results" ON research_results FOR ALL
  USING (session_id IN (SELECT id FROM report_sessions WHERE user_id = auth.uid()));

-- 11. voice_interview_state
CREATE TABLE voice_interview_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES report_sessions(id) UNIQUE,
  elevenlabs_conversation_id TEXT UNIQUE,
  areas_covered TEXT[] DEFAULT '{}',
  key_extractions JSONB DEFAULT '{}',
  turn_count INTEGER DEFAULT 0,
  interview_format TEXT CHECK (interview_format IN ('first_time', 'progress', 'deeper_dive', 'focused')),
  interview_complete BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE voice_interview_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access their own interview state" ON voice_interview_state FOR ALL
  USING (session_id IN (SELECT id FROM report_sessions WHERE user_id = auth.uid()));

-- 12. agent_messages
CREATE TABLE agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES report_sessions(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  turn_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their messages" ON agent_messages FOR ALL
  USING (session_id IN (SELECT id FROM report_sessions WHERE user_id = auth.uid()));

-- 13. reports
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES report_sessions(id) UNIQUE,
  business_id UUID REFERENCES businesses(id),
  user_id UUID REFERENCES profiles(id),
  report_type TEXT NOT NULL,
  score_overall INTEGER CHECK (score_overall BETWEEN 0 AND 100),
  score_breakdown JSONB,
  report_json JSONB,
  html_content TEXT,
  pdf_url TEXT,
  pdf_path TEXT,
  emailed_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  recommended_next_step TEXT,
  recommended_next_step_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their reports" ON reports FOR ALL
  USING (auth.uid() = user_id);

-- 14. leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  business_name TEXT,
  business_type TEXT,
  country TEXT,
  scorecard_score INTEGER,
  scorecard_answers JSONB,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'sequenced', 'converted', 'unsubscribed')),
  converted_to_user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leads are admin-only" ON leads FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- 15. active_offers
CREATE TABLE active_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_code TEXT NOT NULL,
  offer_type TEXT CHECK (offer_type IN ('flash', 'launch', 'partner', 'seasonal', 'bulk')),
  display_name TEXT,
  original_price_gbp INTEGER,
  offer_price_gbp INTEGER,
  original_price_usd INTEGER,
  offer_price_usd INTEGER,
  stripe_coupon_id TEXT,
  stripe_promo_code TEXT,
  active BOOLEAN DEFAULT TRUE,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  max_redemptions INTEGER,
  current_redemptions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE active_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active offers are publicly readable" ON active_offers FOR SELECT
  USING (true);

-- 16. bulk_credit_packs
CREATE TABLE bulk_credit_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  pack_size INTEGER NOT NULL,
  credits_remaining INTEGER NOT NULL,
  price_paid INTEGER,
  currency TEXT,
  stripe_payment_intent_id TEXT,
  is_white_label BOOLEAN DEFAULT FALSE,
  white_label_config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bulk_credit_packs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their credit packs" ON bulk_credit_packs FOR ALL
  USING (auth.uid() = user_id);

-- 17. upsell_events
CREATE TABLE upsell_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  business_id UUID REFERENCES businesses(id),
  source_report_id UUID REFERENCES reports(id),
  upsell_type TEXT,
  email_step INTEGER,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'clicked', 'converted')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE upsell_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see their own upsell events" ON upsell_events FOR ALL
  USING (auth.uid() = user_id);

-- 18. subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  user_id UUID REFERENCES profiles(id),
  stripe_subscription_id TEXT UNIQUE,
  retainer_type TEXT CHECK (retainer_type IN ('growth', 'automation', 'fractional_director', 'franchise_group')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled', 'paused')),
  currency TEXT,
  amount_monthly INTEGER,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their subscriptions" ON subscriptions FOR ALL
  USING (auth.uid() = user_id);

-- ===================
-- Triggers
-- ===================

-- Auto-create profile on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ===================
-- Storage Buckets
-- ===================
-- Note: Supabase storage buckets cannot be created via SQL migrations.
-- Create these buckets via the Supabase Dashboard or using the client SDK:
--
-- 1. Bucket: 'reports'
--    - Purpose: Store generated PDF reports
--    - Public: false (access via signed URLs)
--    - Allowed MIME types: application/pdf
--    - RLS: Users can read their own reports
--
-- 2. Bucket: 'assets'
--    - Purpose: Store brand assets, logos, white-label images
--    - Public: true (for serving in reports)
--    - Allowed MIME types: image/png, image/jpeg, image/svg+xml, image/webp
