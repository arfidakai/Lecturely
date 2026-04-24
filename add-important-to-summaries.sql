-- Add is_important column to summaries table
-- Run this SQL in Supabase SQL Editor

ALTER TABLE summaries 
ADD COLUMN is_important BOOLEAN DEFAULT FALSE;

-- Create index for performance
CREATE INDEX idx_summaries_is_important ON summaries(is_important);
