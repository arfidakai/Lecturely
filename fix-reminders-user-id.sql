-- First, check the actual structure of reminders table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'reminders';

-- Check current reminders data
SELECT id, reminder_time, sent, recording_id 
FROM reminders 
LIMIT 5;

-- Drop old policies that reference user_id incorrectly
DROP POLICY IF EXISTS "Users can view their own reminders" ON reminders;
DROP POLICY IF EXISTS "Users can insert their own reminders" ON reminders;
DROP POLICY IF EXISTS "Users can update their own reminders" ON reminders;
DROP POLICY IF EXISTS "Users can delete their own reminders" ON reminders;

-- Recreate policies with correct user_id reference
CREATE POLICY "Users can view their own reminders"
ON reminders FOR SELECT
USING (
  recording_id IN (
    SELECT id FROM recordings WHERE recordings.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own reminders"
ON reminders FOR INSERT
WITH CHECK (
  recording_id IN (
    SELECT id FROM recordings WHERE recordings.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own reminders"
ON reminders FOR UPDATE
USING (
  recording_id IN (
    SELECT id FROM recordings WHERE recordings.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own reminders"
ON reminders FOR DELETE
USING (
  recording_id IN (
    SELECT id FROM recordings WHERE recordings.user_id = auth.uid()
  )
);
