-- Create highlights table for storing text highlights in summaries
-- Run this SQL in Supabase SQL Editor

CREATE TABLE highlights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  summary_id UUID REFERENCES summaries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  start_offset INTEGER NOT NULL,
  end_offset INTEGER NOT NULL,
  color VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view highlights of their summaries" 
  ON highlights FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create highlights for their summaries" 
  ON highlights FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update highlights for their summaries" 
  ON highlights FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete highlights for their summaries" 
  ON highlights FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_highlights_summary_id ON highlights(summary_id);
CREATE INDEX idx_highlights_user_id ON highlights(user_id);
CREATE INDEX idx_highlights_created_at ON highlights(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_highlights_updated_at
BEFORE UPDATE ON highlights
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
