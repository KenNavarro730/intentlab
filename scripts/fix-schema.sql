-- ============================================
-- COMPLETE FIX FOR INTENTLAB DATABASE
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- 1. Add missing columns to subscriptions table
ALTER TABLE public.subscriptions 
    ADD COLUMN IF NOT EXISTS credits_limit INTEGER NOT NULL DEFAULT 5,
    ADD COLUMN IF NOT EXISTS credits_overage_enabled BOOLEAN DEFAULT FALSE;

-- 2. Add missing columns to usage table
ALTER TABLE public.usage 
    ADD COLUMN IF NOT EXISTS credits_used INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS credits_remaining INTEGER NOT NULL DEFAULT 5;

-- 3. Add missing columns to simulations table
ALTER TABLE public.simulations 
    ADD COLUMN IF NOT EXISTS method TEXT DEFAULT 'SSR',
    ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS n_respondents INTEGER,
    ADD COLUMN IF NOT EXISTS n_samples INTEGER DEFAULT 2;

-- 4. Create function to auto-create user profile and subscription on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create user profile
    INSERT INTO public.users (id, email, name, created_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
        NOW()
    );
    
    -- Create free subscription
    INSERT INTO public.subscriptions (user_id, plan, credits_limit, status)
    VALUES (NEW.id, 'free', 5, 'active');
    
    -- Create initial usage record for current month
    INSERT INTO public.usage (user_id, period_start, credits_used, credits_remaining, simulations_used)
    VALUES (NEW.id, date_trunc('month', NOW())::date, 0, 5, 0);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger to call the function on new auth user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Backfill existing auth users who don't have profiles
INSERT INTO public.users (id, email, created_at)
SELECT id, email, created_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

-- 7. Create subscriptions for users without them
INSERT INTO public.subscriptions (user_id, plan, credits_limit, status)
SELECT u.id, 'free', 5, 'active'
FROM public.users u
WHERE u.id NOT IN (SELECT user_id FROM public.subscriptions)
ON CONFLICT (user_id) DO NOTHING;

-- 8. Create usage records for users without them
INSERT INTO public.usage (user_id, period_start, credits_used, credits_remaining, simulations_used)
SELECT u.id, date_trunc('month', NOW())::date, 0, 5, 0
FROM public.users u
WHERE u.id NOT IN (SELECT user_id FROM public.usage WHERE period_start = date_trunc('month', NOW())::date)
ON CONFLICT (user_id, period_start) DO NOTHING;

-- Verify everything worked
SELECT 'Users' as table_name, count(*) as row_count FROM public.users
UNION ALL
SELECT 'Subscriptions', count(*) FROM public.subscriptions
UNION ALL
SELECT 'Usage', count(*) FROM public.usage
UNION ALL
SELECT 'Simulations', count(*) FROM public.simulations;
