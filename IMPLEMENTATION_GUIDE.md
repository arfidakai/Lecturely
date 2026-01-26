# 🎙️ Lecturely - Implementation Guide

## 📋 Roadmap Implementasi

Setelah menyelesaikan UI/UX design, berikut adalah langkah-langkah implementasi fitur recording dan backend:

---

## 🎯 Phase 1: Audio Recording Implementation (Priority: HIGH)

### 1.1 Setup Web Audio API

**File yang perlu dibuat:**
- `app/hooks/useAudioRecorder.ts`
- `app/lib/audioProcessor.ts`
- `app/types/audio.ts`

**Dependencies yang perlu diinstall:**
```bash
npm install recordrtc wavesurfer.js
npm install @types/recordrtc --save-dev
```

**Implementasi `useAudioRecorder.ts`:**
```typescript
import { useState, useRef, useCallback } from 'react';
import RecordRTC from 'recordrtc';

interface UseAudioRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<Blob>;
  error: string | null;
}

export const useAudioRecorder = (): UseAudioRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<RecordRTC | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });

      streamRef.current = stream;

      // Initialize RecordRTC
      const recorder = new RecordRTC(stream, {
        type: 'audio',
        mimeType: 'audio/webm',
        recorderType: RecordRTC.StereoAudioRecorder,
        numberOfAudioChannels: 1,
        desiredSampRate: 16000, // Good for speech recognition
      });

      recorder.startRecording();
      recorderRef.current = recorder;
      setIsRecording(true);
      setError(null);

      // Start duration counter
      intervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setError('Failed to access microphone. Please grant permission.');
      console.error('Recording error:', err);
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (recorderRef.current && isRecording) {
      recorderRef.current.pauseRecording();
      setIsPaused(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [isRecording]);

  const resumeRecording = useCallback(() => {
    if (recorderRef.current && isPaused) {
      recorderRef.current.resumeRecording();
      setIsPaused(false);
      intervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
  }, [isPaused]);

  const stopRecording = useCallback(async (): Promise<Blob> => {
    return new Promise((resolve) => {
      if (recorderRef.current) {
        recorderRef.current.stopRecording(() => {
          const blob = recorderRef.current!.getBlob();
          const url = URL.createObjectURL(blob);
          
          setAudioBlob(blob);
          setAudioUrl(url);
          setIsRecording(false);
          setIsPaused(false);

          // Stop all tracks
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
          }

          // Clear interval
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }

          resolve(blob);
        });
      }
    });
  }, []);

  return {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    audioUrl,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    error,
  };
};
```

### 1.2 Update Recording Page

**File: `app/recording/page.tsx`**

Tambahkan integrasi dengan hook `useAudioRecorder`:

```typescript
import { useAudioRecorder } from '../hooks/useAudioRecorder';

export default function RecordingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subjectId = searchParams.get("subjectId");
  const subject = subjects.find((s) => s.id === subjectId) || subjects[0];

  const {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    error,
  } = useAudioRecorder();

  const handleStartStop = async () => {
    if (!isRecording) {
      await startRecording();
    } else {
      const blob = await stopRecording();
      // Save audio blob to state/context/local storage
      localStorage.setItem('recordingBlob', URL.createObjectURL(blob));
      router.push(`/post-record?duration=${duration}&subjectId=${subject.id}`);
    }
  };

  const handlePause = () => {
    if (isPaused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  };

  // ... rest of your component
}
```

---

## 🎯 Phase 2: Backend & Database Setup (Priority: HIGH)

### 2.1 Choose Backend Solution

**Option A: Supabase (Recommended for MVP)**
- ✅ Authentication built-in
- ✅ PostgreSQL database
- ✅ File storage included
- ✅ Real-time subscriptions
- ✅ Free tier available

**Option B: Firebase**
- ✅ Easy to setup
- ✅ Good documentation
- ✅ Real-time database

**Option C: Custom Backend (Node.js + PostgreSQL)**
- ✅ Full control
- ❌ More setup required

### 2.2 Setup Supabase (Recommended)

```bash
npm install @supabase/supabase-js
```

**Create: `app/lib/supabase.ts`**

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 2.3 Database Schema

**Tables to create in Supabase:**

```sql
-- Users table (automatically created by Supabase Auth)

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
  duration INTEGER NOT NULL, -- in seconds
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
  timestamp INTEGER NOT NULL, -- in seconds
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

-- Similar policies for other tables...
```

---

## 🎯 Phase 3: File Upload & Storage (Priority: HIGH)

### 3.1 Setup Storage Service

**Create: `app/services/storageService.ts`**

```typescript
import { supabase } from '../lib/supabase';

export class StorageService {
  private bucketName = 'recordings';

  async uploadAudio(
    file: Blob, 
    userId: string, 
    recordingId: string
  ): Promise<string> {
    const fileName = `${userId}/${recordingId}.webm`;
    
    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .upload(fileName, file, {
        contentType: 'audio/webm',
        upsert: false,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }

  async deleteAudio(filePath: string): Promise<void> {
    const { error } = await supabase.storage
      .from(this.bucketName)
      .remove([filePath]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  async downloadAudio(filePath: string): Promise<Blob> {
    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .download(filePath);

    if (error) {
      throw new Error(`Download failed: ${error.message}`);
    }

    return data;
  }
}

export const storageService = new StorageService();
```

### 3.2 Create Recording Service

**Create: `app/services/recordingService.ts`**

```typescript
import { supabase } from '../lib/supabase';
import { storageService } from './storageService';

export interface CreateRecordingParams {
  subjectId: string;
  audioBlob: Blob;
  duration: number;
  title?: string;
}

export class RecordingService {
  async createRecording(params: CreateRecordingParams) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Generate recording ID
    const recordingId = crypto.randomUUID();

    // Upload audio file
    const audioUrl = await storageService.uploadAudio(
      params.audioBlob,
      user.id,
      recordingId
    );

    // Save recording metadata to database
    const { data, error } = await supabase
      .from('recordings')
      .insert({
        id: recordingId,
        user_id: user.id,
        subject_id: params.subjectId,
        title: params.title || 'Untitled Recording',
        audio_url: audioUrl,
        duration: params.duration,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save recording: ${error.message}`);
    }

    return data;
  }

  async getRecordingsBySubject(subjectId: string) {
    const { data, error } = await supabase
      .from('recordings')
      .select('*')
      .eq('subject_id', subjectId)
      .order('date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch recordings: ${error.message}`);
    }

    return data;
  }

  async getRecording(recordingId: string) {
    const { data, error } = await supabase
      .from('recordings')
      .select('*, transcriptions(*), summaries(*)')
      .eq('id', recordingId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch recording: ${error.message}`);
    }

    return data;
  }

  async deleteRecording(recordingId: string) {
    // Delete audio file
    const { data: recording } = await supabase
      .from('recordings')
      .select('audio_url, user_id')
      .eq('id', recordingId)
      .single();

    if (recording) {
      const filePath = `${recording.user_id}/${recordingId}.webm`;
      await storageService.deleteAudio(filePath);
    }

    // Delete database record
    const { error } = await supabase
      .from('recordings')
      .delete()
      .eq('id', recordingId);

    if (error) {
      throw new Error(`Failed to delete recording: ${error.message}`);
    }
  }
}

export const recordingService = new RecordingService();
```

---

## 🎯 Phase 4: AI Integration - Transcription (Priority: MEDIUM)

### 4.1 Choose Transcription Service

**Option A: OpenAI Whisper API (Recommended)**
- ✅ High accuracy
- ✅ Multiple languages
- ✅ Reasonable pricing
- ✅ Easy integration

**Option B: AssemblyAI**
- ✅ Good accuracy
- ✅ Speaker diarization
- ✅ Free tier available

**Option C: Google Speech-to-Text**
- ✅ Good accuracy
- ✅ Real-time transcription

### 4.2 Setup OpenAI Whisper

```bash
npm install openai
```

**Create: `app/api/transcribe/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/app/lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const recordingId = formData.get('recordingId') as string;

    if (!audioFile || !recordingId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert File to Buffer for OpenAI
    const buffer = Buffer.from(await audioFile.arrayBuffer());

    // Transcribe using Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    });

    // Save transcription segments to database
    const segments = transcription.segments?.map((segment: any) => ({
      recording_id: recordingId,
      text: segment.text,
      timestamp: Math.floor(segment.start),
      important: false,
    })) || [];

    const { error } = await supabase
      .from('transcriptions')
      .insert(segments);

    if (error) {
      throw new Error(`Failed to save transcription: ${error.message}`);
    }

    // Update recording status
    await supabase
      .from('recordings')
      .update({ transcribed: true })
      .eq('id', recordingId);

    return NextResponse.json({
      success: true,
      transcription: transcription.text,
      segments,
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Transcription failed' },
      { status: 500 }
    );
  }
}
```

### 4.3 Create Transcription Service

**Create: `app/services/transcriptionService.ts`**

```typescript
export class TranscriptionService {
  async transcribeRecording(recordingId: string, audioBlob: Blob) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('recordingId', recordingId);

    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Transcription failed');
    }

    return await response.json();
  }

  async getTranscriptions(recordingId: string) {
    const { data, error } = await supabase
      .from('transcriptions')
      .select('*')
      .eq('recording_id', recordingId)
      .order('timestamp', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch transcriptions: ${error.message}`);
    }

    return data;
  }

  async markImportant(transcriptionId: string, important: boolean) {
    const { error } = await supabase
      .from('transcriptions')
      .update({ important })
      .eq('id', transcriptionId);

    if (error) {
      throw new Error(`Failed to update transcription: ${error.message}`);
    }
  }
}

export const transcriptionService = new TranscriptionService();
```

---

## 🎯 Phase 5: AI Integration - Summary (Priority: MEDIUM)

### 5.1 Setup AI Summary API

**Create: `app/api/summarize/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/app/lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { recordingId } = await request.json();

    // Get transcription
    const { data: transcriptions } = await supabase
      .from('transcriptions')
      .select('text')
      .eq('recording_id', recordingId)
      .order('timestamp', { ascending: true });

    if (!transcriptions || transcriptions.length === 0) {
      return NextResponse.json(
        { error: 'No transcription found' },
        { status: 404 }
      );
    }

    const fullText = transcriptions.map(t => t.text).join(' ');

    // Generate summary using GPT
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at summarizing lecture content. Create a concise, well-structured summary that highlights key concepts, important points, and main takeaways. Use bullet points for clarity.',
        },
        {
          role: 'user',
          content: `Please summarize this lecture transcription:\n\n${fullText}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const summary = completion.choices[0].message.content;

    // Save summary to database
    const { error } = await supabase
      .from('summaries')
      .insert({
        recording_id: recordingId,
        content: summary,
      });

    if (error) {
      throw new Error(`Failed to save summary: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error('Summary error:', error);
    return NextResponse.json(
      { error: 'Summary generation failed' },
      { status: 500 }
    );
  }
}
```

---

## 🎯 Phase 6: Authentication (Priority: MEDIUM)

### 6.1 Setup Supabase Auth

**Create: `app/context/AuthContext.tsx`**

```typescript
'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
```

---

## 🎯 Phase 7: Reminders & Notifications (Priority: LOW)

### 7.1 Setup Push Notifications

```bash
npm install @supabase/realtime-js
```

**Create: `app/services/reminderService.ts`**

```typescript
import { supabase } from '../lib/supabase';

export class ReminderService {
  async setReminder(recordingId: string, reminderTime: Date) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('reminders')
      .insert({
        user_id: user.id,
        recording_id: recordingId,
        reminder_time: reminderTime.toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to set reminder: ${error.message}`);
    }

    return data;
  }

  async getReminders() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('reminders')
      .select('*, recordings(*)')
      .eq('user_id', user.id)
      .eq('sent', false)
      .order('reminder_time', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch reminders: ${error.message}`);
    }

    return data;
  }

  async deleteReminder(reminderId: string) {
    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', reminderId);

    if (error) {
      throw new Error(`Failed to delete reminder: ${error.message}`);
    }
  }
}

export const reminderService = new ReminderService();
```

---

## 📝 Environment Variables

**Create: `.env.local`**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🚀 Testing Checklist

### Audio Recording
- [ ] Can start recording
- [ ] Can pause/resume recording
- [ ] Can stop recording
- [ ] Audio quality is good
- [ ] Timer works correctly
- [ ] Waveform animation syncs with audio

### File Storage
- [ ] Audio files upload successfully
- [ ] Files are stored with correct path
- [ ] Files can be downloaded
- [ ] Files can be deleted

### Transcription
- [ ] Transcription accuracy is acceptable
- [ ] Timestamps are correct
- [ ] Can mark segments as important
- [ ] Transcription displays properly

### AI Summary
- [ ] Summary is relevant and accurate
- [ ] Summary format is clean
- [ ] Summary saves to database

### Authentication
- [ ] Sign up works
- [ ] Sign in works
- [ ] Sign out works
- [ ] Protected routes work
- [ ] Session persists on refresh

### Reminders
- [ ] Can set reminder
- [ ] Reminder time is stored correctly
- [ ] Can view reminders
- [ ] Can delete reminders

---

## 📊 Priority Order

1. **Phase 1**: Audio Recording (CRITICAL) - User can't use app without this
2. **Phase 2**: Backend Setup (CRITICAL) - Need to store data
3. **Phase 3**: File Upload (CRITICAL) - Need to save recordings
4. **Phase 6**: Authentication (HIGH) - Need user accounts
5. **Phase 4**: Transcription (MEDIUM) - Core feature but can add later
6. **Phase 5**: AI Summary (MEDIUM) - Nice to have
7. **Phase 7**: Reminders (LOW) - Can add in future update

---

## 💡 Tips untuk Development

1. **Start Small**: Implementasi Phase 1-3 dulu untuk MVP
2. **Test Incrementally**: Test setiap feature sebelum lanjut ke next phase
3. **Use TypeScript**: Akan membantu catch errors early
4. **Error Handling**: Selalu handle errors dengan baik
5. **Loading States**: Tambahkan loading indicators untuk better UX
6. **Mobile First**: Test di mobile browser karena target platform adalah mobile
7. **Progressive Enhancement**: Mulai dengan basic features, improve gradually

---

## 🔧 Debugging Tools

- Chrome DevTools → Application → IndexedDB (untuk local storage)
- Chrome DevTools → Network (untuk API calls)
- Supabase Dashboard → Table Editor (untuk database)
- Supabase Dashboard → Storage (untuk files)
- OpenAI Playground (untuk test prompts)

---

## 📚 Resources

- [RecordRTC Documentation](https://recordrtc.org/)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)
- [Web Audio API Guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Next.js App Router](https://nextjs.org/docs/app)

---

## ❓ Need Help?

Jika stuck di step manapun, cek:
1. Console errors di browser
2. API response di Network tab
3. Supabase logs
4. OpenAI API usage dashboard

Good luck dengan implementation! 🚀
