-- Add highlight_color column to summaries table
-- Run this SQL in Supabase SQL Editor

ALTER TABLE summaries 
ADD COLUMN highlight_color VARCHAR(50) DEFAULT 'none';

-- Create index for performance
CREATE INDEX idx_summaries_highlight_color ON summaries(highlight_color);
