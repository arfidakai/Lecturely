-- Create tables for Lecturely App
-- Run this SQL in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Subjects table
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recordings table
CREATE TABLE recordings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT,
  audio_url TEXT NOT NULL,
  duration INTEGER NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  transcribed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transcriptions table
CREATE TABLE transcriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recording_id UUID REFERENCES recordings(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  important BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Summaries table
CREATE TABLE summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recording_id UUID REFERENCES recordings(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reminders table
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recording_id UUID REFERENCES recordings(id) ON DELETE CASCADE,
  reminder_time TIMESTAMP WITH TIME ZONE NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Create policies for subjects
CREATE POLICY "Users can view their own subjects" 
  ON subjects FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subjects" 
  ON subjects FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subjects" 
  ON subjects FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subjects" 
  ON subjects FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policies for recordings
CREATE POLICY "Users can view their own recordings" 
  ON recordings FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recordings" 
  ON recordings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recordings" 
  ON recordings FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recordings" 
  ON recordings FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policies for transcriptions (through recordings)
CREATE POLICY "Users can view transcriptions of their recordings" 
  ON transcriptions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM recordings 
      WHERE recordings.id = transcriptions.recording_id 
      AND recordings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create transcriptions for their recordings" 
  ON transcriptions FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recordings 
      WHERE recordings.id = transcriptions.recording_id 
      AND recordings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update transcriptions of their recordings" 
  ON transcriptions FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM recordings 
      WHERE recordings.id = transcriptions.recording_id 
      AND recordings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete transcriptions of their recordings" 
  ON transcriptions FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM recordings 
      WHERE recordings.id = transcriptions.recording_id 
      AND recordings.user_id = auth.uid()
    )
  );

-- Similar policies for summaries
CREATE POLICY "Users can view summaries of their recordings" 
  ON summaries FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM recordings 
      WHERE recordings.id = summaries.recording_id 
      AND recordings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create summaries for their recordings" 
  ON summaries FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recordings 
      WHERE recordings.id = summaries.recording_id 
      AND recordings.user_id = auth.uid()
    )
  );

-- Policies for reminders
CREATE POLICY "Users can view their own reminders" 
  ON reminders FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reminders" 
  ON reminders FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders" 
  ON reminders FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_subjects_user_id ON subjects(user_id);
CREATE INDEX idx_recordings_user_id ON recordings(user_id);
CREATE INDEX idx_recordings_subject_id ON recordings(subject_id);
CREATE INDEX idx_recordings_date ON recordings(date DESC);
CREATE INDEX idx_transcriptions_recording_id ON transcriptions(recording_id);
CREATE INDEX idx_summaries_recording_id ON summaries(recording_id);
CREATE INDEX idx_reminders_user_id ON reminders(user_id);
CREATE INDEX idx_reminders_time ON reminders(reminder_time);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recordings_updated_at BEFORE UPDATE ON recordings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default subjects (jika belum ada)
-- Run this after creating tables
INSERT INTO subjects (id, user_id, name, color, icon) VALUES
  ('11111111-1111-1111-1111-111111111111', NULL, 'Computer Science', '#9b87f5', '💻'),
  ('22222222-2222-2222-2222-222222222222', NULL, 'Mathematics', '#f59e87', '📐'),
  ('33333333-3333-3333-3333-333333333333', NULL, 'Physics', '#87d4f5', '⚡'),
  ('44444444-4444-4444-4444-444444444444', NULL, 'Literature', '#f5c987', '📚')
ON CONFLICT (id) DO NOTHING;
