-- IntentLab Database Schema
-- Run this in Supabase SQL Editor to create the required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'growth', 'agency')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
    simulations_limit INTEGER NOT NULL DEFAULT 3,
    current_period_start TIMESTAMPTZ DEFAULT NOW(),
    current_period_end TIMESTAMPTZ DEFAULT NOW() + INTERVAL '100 years',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Usage tracking table
CREATE TABLE IF NOT EXISTS public.usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    simulations_used INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, period_start)
);

-- Simulations table
CREATE TABLE IF NOT EXISTS public.simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    concept JSONB NOT NULL,
    config JSONB DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    results JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_usage_user_period ON public.usage(user_id, period_start);
CREATE INDEX IF NOT EXISTS idx_simulations_user_id ON public.simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_simulations_status ON public.simulations(status);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own subscription" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own usage" ON public.usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own simulations" ON public.simulations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own simulations" ON public.simulations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own simulations" ON public.simulations
    FOR UPDATE USING (auth.uid() = user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_usage_updated_at
    BEFORE UPDATE ON public.usage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_simulations_updated_at
    BEFORE UPDATE ON public.simulations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- CREDIT-BASED PRICING & PIPELINE CACHING
-- ============================================

-- Add credit tracking to subscriptions
ALTER TABLE public.subscriptions 
    ADD COLUMN IF NOT EXISTS credits_limit INTEGER NOT NULL DEFAULT 5,
    ADD COLUMN IF NOT EXISTS credits_overage_enabled BOOLEAN DEFAULT FALSE;

-- Add credit usage to usage table
ALTER TABLE public.usage 
    ADD COLUMN IF NOT EXISTS credits_used INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS credits_remaining INTEGER NOT NULL DEFAULT 5;

-- LLM response cache (for deduplication and resumability)
CREATE TABLE IF NOT EXISTS public.llm_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_hash TEXT NOT NULL UNIQUE,
    response_text TEXT NOT NULL,
    usage_json JSONB,
    model TEXT,
    reasoning_effort TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_llm_cache_hash ON public.llm_cache(prompt_hash);

-- Embedding cache (for SSR anchor and response embeddings)
CREATE TABLE IF NOT EXISTS public.embedding_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    text_hash TEXT NOT NULL UNIQUE,
    embedding_model TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    embedding FLOAT8[] NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_embedding_cache_hash ON public.embedding_cache(text_hash);

-- Task state for DAG resumability
CREATE TABLE IF NOT EXISTS public.task_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID NOT NULL,
    task_key TEXT NOT NULL,  -- Serialized (concept_id, respondent_id, sample_idx, stage)
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    attempts INTEGER NOT NULL DEFAULT 0,
    result_json JSONB,
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(run_id, task_key)
);
CREATE INDEX IF NOT EXISTS idx_task_state_run ON public.task_state(run_id);
CREATE INDEX IF NOT EXISTS idx_task_state_status ON public.task_state(status);

-- Run manifest (records all settings for reproducibility)
CREATE TABLE IF NOT EXISTS public.run_manifest (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    simulation_id UUID REFERENCES public.simulations(id) ON DELETE CASCADE,
    config_json JSONB NOT NULL,  -- Full config snapshot
    method TEXT NOT NULL CHECK (method IN ('DLR', 'FLR', 'SSR')),
    n_respondents INTEGER NOT NULL,
    n_samples INTEGER NOT NULL DEFAULT 2,
    credits_estimated INTEGER NOT NULL,
    credits_used INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    dry_run BOOLEAN DEFAULT FALSE,
    cost_cap_usd NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_run_manifest_user ON public.run_manifest(user_id);
CREATE INDEX IF NOT EXISTS idx_run_manifest_status ON public.run_manifest(status);

-- RLS Policies for new tables
ALTER TABLE public.llm_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embedding_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.run_manifest ENABLE ROW LEVEL SECURITY;

-- LLM cache is shared (service role only)
CREATE POLICY "Service role only for llm_cache" ON public.llm_cache
    FOR ALL USING (FALSE);

-- Embedding cache is shared (service role only)
CREATE POLICY "Service role only for embedding_cache" ON public.embedding_cache
    FOR ALL USING (FALSE);

-- Task state accessed via run manifest
CREATE POLICY "Users can view own task states" ON public.task_state
    FOR SELECT USING (
        run_id IN (SELECT id FROM public.run_manifest WHERE user_id = auth.uid())
    );

-- Run manifest user access
CREATE POLICY "Users can view own run manifests" ON public.run_manifest
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own run manifests" ON public.run_manifest
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_task_state_updated_at
    BEFORE UPDATE ON public.task_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- USER DATA PERSISTENCE (Projects, Concepts, Reports)
-- ============================================

-- Projects (optional container for organizing work)
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_pinned BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_projects_user ON public.projects(user_id);

-- Concepts with git-style versioning
CREATE TABLE IF NOT EXISTS public.concepts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    
    -- Versioning
    version INTEGER NOT NULL DEFAULT 1,
    parent_version_id UUID REFERENCES public.concepts(id),
    is_latest BOOLEAN DEFAULT TRUE,
    version_message TEXT,  -- "Changed pricing from $29 to $34"
    
    -- Core concept data
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    features JSONB DEFAULT '[]',
    claims JSONB DEFAULT '[]',
    positioning TEXT,
    
    -- Assets (stored in Supabase Storage)
    images JSONB DEFAULT '[]',  -- [{url, name, uploaded_at}]
    
    -- Metadata
    tags TEXT[],
    is_draft BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id)
);
CREATE INDEX IF NOT EXISTS idx_concepts_user ON public.concepts(user_id);
CREATE INDEX IF NOT EXISTS idx_concepts_project ON public.concepts(project_id);
CREATE INDEX IF NOT EXISTS idx_concepts_parent ON public.concepts(parent_version_id);

-- Enhanced simulations (add columns to existing table)
ALTER TABLE public.simulations 
    ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS concept_id UUID REFERENCES public.concepts(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS method TEXT DEFAULT 'SSR',
    ADD COLUMN IF NOT EXISTS seed TEXT,
    ADD COLUMN IF NOT EXISTS parent_run_id UUID REFERENCES public.simulations(id),
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS cost_usd DECIMAL(10, 4),
    ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS n_respondents INTEGER,
    ADD COLUMN IF NOT EXISTS n_samples INTEGER DEFAULT 2;

CREATE INDEX IF NOT EXISTS idx_simulations_project ON public.simulations(project_id);
CREATE INDEX IF NOT EXISTS idx_simulations_concept ON public.simulations(concept_id);

-- Comparison sets (save run comparisons)
CREATE TABLE IF NOT EXISTS public.comparison_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT,
    description TEXT,
    simulation_ids UUID[] NOT NULL,  -- Array of run IDs to compare
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_comparisons_user ON public.comparison_sets(user_id);

-- Reports (generated PDFs/exports with share links)
-- Storage: Supabase Storage with 30-day lifecycle, pre-signed URLs
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    simulation_id UUID REFERENCES public.simulations(id) ON DELETE SET NULL,
    comparison_id UUID REFERENCES public.comparison_sets(id) ON DELETE SET NULL,
    
    -- Report metadata
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('pdf', 'slides', 'csv', 'json')),
    template TEXT DEFAULT 'standard',  -- 'standard', 'executive', 'detailed'
    
    -- Storage
    storage_path TEXT,  -- Path in Supabase Storage
    file_size_bytes INTEGER,
    
    -- Sharing
    share_token TEXT UNIQUE,  -- For public share links
    share_expires_at TIMESTAMPTZ,
    share_password_hash TEXT,  -- Optional password protection
    download_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_reports_user ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_simulation ON public.reports(simulation_id);
CREATE INDEX IF NOT EXISTS idx_reports_share_token ON public.reports(share_token);

-- User preferences (defaults and saved settings)
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Default run settings
    default_method TEXT DEFAULT 'SSR' CHECK (default_method IN ('DLR', 'FLR', 'SSR')),
    default_respondents INTEGER DEFAULT 200,
    default_samples INTEGER DEFAULT 2,
    
    -- Saved segments/personas
    saved_segments JSONB DEFAULT '[]',
    saved_personas JSONB DEFAULT '[]',
    
    -- UI preferences
    theme TEXT DEFAULT 'light',
    dashboard_layout JSONB DEFAULT '{}',
    
    -- Notifications
    notify_run_complete BOOLEAN DEFAULT TRUE,
    notify_run_failed BOOLEAN DEFAULT TRUE,
    notify_credits_low BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recent activity feed (for dashboard)
CREATE TABLE IF NOT EXISTS public.activity_feed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,  -- 'run_completed', 'concept_created', 'report_exported', etc.
    entity_type TEXT,  -- 'simulation', 'concept', 'report', 'project'
    entity_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_user ON public.activity_feed(user_id, created_at DESC);

-- RLS Policies for new tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comparison_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can manage own projects" ON public.projects
    FOR ALL USING (auth.uid() = user_id);

-- Concepts policies
CREATE POLICY "Users can manage own concepts" ON public.concepts
    FOR ALL USING (auth.uid() = user_id);

-- Comparison sets policies
CREATE POLICY "Users can manage own comparisons" ON public.comparison_sets
    FOR ALL USING (auth.uid() = user_id);

-- Reports policies (including share token access)
CREATE POLICY "Users can manage own reports" ON public.reports
    FOR ALL USING (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can manage own preferences" ON public.user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Activity feed policies
CREATE POLICY "Users can view own activity" ON public.activity_feed
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity" ON public.activity_feed
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_comparison_sets_updated_at
    BEFORE UPDATE ON public.comparison_sets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
