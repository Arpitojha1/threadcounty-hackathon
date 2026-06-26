-- ============================================================================
-- THREADCOUNTY MASTER SCHEMA
-- Description: Core relational tables, automated triggers, and RLS security.
-- ============================================================================

-- ============================================================================
-- 1. DATABASE EXTENSIONS & CUSTOM ENUMS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE public.user_role AS ENUM ('user', 'admin');
CREATE TYPE public.subscription_tier AS ENUM ('free', 'student', 'professional', 'enterprise');
CREATE TYPE public.processing_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE public.ticket_status AS ENUM ('unread', 'read', 'resolved');

-- ============================================================================
-- 2. CORE TABLES
-- ============================================================================

-- PROFILES
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role public.user_role DEFAULT 'user'::public.user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT username_length_check CHECK (CHAR_LENGTH(username) >= 3)
);

-- SUBSCRIPTIONS
CREATE TABLE public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    plan_tier public.subscription_tier DEFAULT 'free'::public.subscription_tier NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- UPLOADS
CREATE TABLE public.uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INT NOT NULL, 
    status public.processing_status DEFAULT 'pending'::public.processing_status NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT positive_file_size CHECK (file_size > 0)
);

-- REPORTS
CREATE TABLE public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    upload_id UUID REFERENCES public.uploads(id) ON DELETE CASCADE UNIQUE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    thread_density NUMERIC(5,2), 
    warp_count INT,
    weft_count INT,
    fabric_type TEXT,
    confidence_score NUMERIC(5,2), 
    ai_suggestions JSONB DEFAULT '[]'::jsonb NOT NULL,
    pdf_report_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE, -- ADDED: Soft delete support required for History & Admin
    CONSTRAINT valid_confidence CHECK (confidence_score >= 0.00 AND confidence_score <= 100.00)
);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- CONTACT MESSAGES
CREATE TABLE public.contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    status public.ticket_status DEFAULT 'unread'::public.ticket_status NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- 3. AUTOMATED DATABASE TRIGGERS
-- ============================================================================

-- Timestamp Auto-Updater
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trigger_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trigger_uploads_updated_at BEFORE UPDATE ON public.uploads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trigger_contact_messages_updated_at BEFORE UPDATE ON public.contact_messages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Core Account Pipeline (Fires on Supabase Auth Signup)
CREATE OR REPLACE FUNCTION public.handle_new_user_pipeline()
RETURNS TRIGGER AS $$
DECLARE
    generated_username TEXT;
BEGIN
    generated_username := LOWER(SPLIT_PART(NEW.email, '@', 1)) || '_' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4);
    
    INSERT INTO public.profiles (id, username, full_name, avatar_url, role)
    VALUES (
        NEW.id,
        generated_username,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'ThreadCounty User'),
        NEW.raw_user_meta_data->>'avatar_url',
        'user'::public.user_role
    );
    
    INSERT INTO public.subscriptions (user_id, plan_tier, status, current_period_end)
    VALUES (
        NEW.id, 
        'free'::public.subscription_tier, 
        'active', 
        (NOW() + INTERVAL '100 years')
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger to ensure fresh setup
DROP TRIGGER IF EXISTS on_auth_user_signed_up ON auth.users;
CREATE TRIGGER on_auth_user_signed_up
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_pipeline();

-- ============================================================================
-- 4. PERFORMANCE OPTIMIZATION INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_uploads_user_pagination ON public.uploads(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uploads_status ON public.uploads(status);
CREATE INDEX IF NOT EXISTS idx_reports_user_lookup ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_upload_mapping ON public.reports(upload_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_active ON public.subscriptions(user_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_notifications_unread_polling ON public.notifications(user_id) WHERE is_read = FALSE;

-- ============================================================================
-- 5. ROW-LEVEL SECURITY (RLS) MULTI-TENANT POLICIES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'::public.user_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- PROFILES
DROP POLICY IF EXISTS "Profiles are readable by authenticated application users" ON public.profiles;
CREATE POLICY "Profiles are readable by authenticated application users" ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can modify their own descriptive profile metadata" ON public.profiles;
CREATE POLICY "Users can modify their own descriptive profile metadata" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Full administrative override access for profiles" ON public.profiles;
CREATE POLICY "Full administrative override access for profiles" ON public.profiles FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- SUBSCRIPTIONS
DROP POLICY IF EXISTS "Users can view their active subscription tier details" ON public.subscriptions;
CREATE POLICY "Users can view their active subscription tier details" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Full administrative override access for billing ledgers" ON public.subscriptions;
CREATE POLICY "Full administrative override access for billing ledgers" ON public.subscriptions FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- UPLOADS
DROP POLICY IF EXISTS "Users can view their historical image assets" ON public.uploads;
CREATE POLICY "Users can view their historical image assets" ON public.uploads FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert file metadata during upload execution" ON public.uploads;
CREATE POLICY "Users can insert file metadata during upload execution" ON public.uploads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their file tracking references" ON public.uploads;
CREATE POLICY "Users can delete their file tracking references" ON public.uploads FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Full administrative override access for asset storage tables" ON public.uploads;
CREATE POLICY "Full administrative override access for asset storage tables" ON public.uploads FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- REPORTS
DROP POLICY IF EXISTS "Users can safely view their tailored AI results records" ON public.reports;
CREATE POLICY "Users can safely view their tailored AI results records" ON public.reports FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can soft-delete their own reports" ON public.reports;
CREATE POLICY "Users can soft-delete their own reports" ON public.reports FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Full administrative override access for AI report tables" ON public.reports;
CREATE POLICY "Full administrative override access for AI report tables" ON public.reports FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users control their contextual notification flows entirely" ON public.notifications;
CREATE POLICY "Users control their contextual notification flows entirely" ON public.notifications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- CONTACT MESSAGES
DROP POLICY IF EXISTS "Anonymous web guests can submit support inquiries cleanly" ON public.contact_messages;
CREATE POLICY "Anonymous web guests can submit support inquiries cleanly" ON public.contact_messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Support tickets are strictly reserved for administrative review" ON public.contact_messages;
CREATE POLICY "Support tickets are strictly reserved for administrative review" ON public.contact_messages FOR SELECT TO authenticated USING (public.is_admin());

-- ============================================================================
-- 6. ADMIN SETUP
-- ============================================================================
-- Run this block below separately with your actual email to make yourself an admin:
-- 
-- UPDATE public.profiles 
-- SET role = 'admin'::public.user_role 
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL@EXAMPLE.COM');
