-- =====================================================
-- CRITICAL FIX: Create Restricted Database User
-- Execute this in Neon SQL Editor
-- https://console.neon.tech/
-- =====================================================

-- Step 1: Create new restricted user for application
CREATE USER daily_demotivations_app WITH PASSWORD 'REPLACE_WITH_STRONG_PASSWORD';

-- Step 2: Grant database connection
GRANT CONNECT ON DATABASE neondb TO daily_demotivations_app;

-- Step 3: Grant schema usage
GRANT USAGE ON SCHEMA public TO daily_demotivations_app;

-- Step 4: Grant table permissions (SELECT, INSERT, UPDATE, DELETE only - no DROP/ALTER)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO daily_demotivations_app;

-- Step 5: Grant sequence permissions (for auto-increment IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO daily_demotivations_app;

-- Step 6: Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO daily_demotivations_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT USAGE, SELECT ON SEQUENCES TO daily_demotivations_app;

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check user was created
SELECT usename FROM pg_user WHERE usename = 'daily_demotivations_app';

-- Check table permissions
\dp quotes
\dp images
\dp pairings

-- =====================================================
-- After running these commands:
-- =====================================================

-- 1. Update .env.local:
--    DATABASE_URL=postgresql://daily_demotivations_app:YOUR_PASSWORD@ep-misty-night-agly03gw-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
--    DIRECT_DATABASE_URL=postgresql://neondb_owner:OWNER_PASSWORD@ep-misty-night-agly03gw.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
--
-- 2. Update Vercel environment variables with same values
--
-- 3. Test locally:
--    npm run dev
--    Try creating/editing quotes to verify permissions work
--
-- 4. Deploy to Vercel
--
-- =====================================================
-- What this prevents:
-- =====================================================
-- ❌ DROP DATABASE
-- ❌ DROP TABLE
-- ❌ ALTER TABLE schema changes
-- ❌ CREATE/DROP users
-- ❌ Reading system tables
-- ✅ SELECT, INSERT, UPDATE, DELETE (normal app operations)
-- =====================================================
