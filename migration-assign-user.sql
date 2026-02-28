-- Migration Script: Assign existing data to a specific user
-- This script will update all existing recordings, subjects, and reminders to belong to a specific user
-- 
-- IMPORTANT: Replace 'YOUR_USER_ID_HERE' with your actual Supabase user ID
-- You can find your user ID by:
-- 1. Login to your app
-- 2. Open browser console
-- 3. Run: (await supabase.auth.getUser()).data.user.id
--
-- Run this script in Supabase SQL Editor ONCE to migrate your existing data

-- Set your user ID here
DO $$
DECLARE
  target_user_id UUID := 'YOUR_USER_ID_HERE'; -- Replace with your actual user ID
BEGIN
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'User ID % does not exist. Please check your user ID.', target_user_id;
  END IF;

  -- Update subjects without user_id
  UPDATE subjects
  SET user_id = target_user_id
  WHERE user_id IS NULL;

  RAISE NOTICE 'Updated % subjects', (SELECT count(*) FROM subjects WHERE user_id = target_user_id);

  -- Update recordings without user_id or with temp/hardcoded user_id
  UPDATE recordings
  SET user_id = target_user_id
  WHERE user_id IS NULL 
     OR user_id::text LIKE 'temp-user-%'
     OR user_id = '00000000-0000-0000-0000-000000000000';

  RAISE NOTICE 'Updated % recordings', (SELECT count(*) FROM recordings WHERE user_id = target_user_id);

  -- Update reminders without user_id
  UPDATE reminders
  SET user_id = target_user_id
  WHERE user_id IS NULL;

  RAISE NOTICE 'Updated % reminders', (SELECT count(*) FROM reminders WHERE user_id = target_user_id);

  RAISE NOTICE 'Migration completed successfully!';
END $$;

-- Verify the migration
SELECT 
  'subjects' as table_name,
  count(*) as total_rows,
  count(CASE WHEN user_id IS NOT NULL THEN 1 END) as rows_with_user_id
FROM subjects
UNION ALL
SELECT 
  'recordings' as table_name,
  count(*) as total_rows,
  count(CASE WHEN user_id IS NOT NULL THEN 1 END) as rows_with_user_id
FROM recordings
UNION ALL
SELECT 
  'reminders' as table_name,
  count(*) as total_rows,
  count(CASE WHEN user_id IS NOT NULL THEN 1 END) as rows_with_user_id
FROM reminders;
