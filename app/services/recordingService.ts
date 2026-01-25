import { supabase } from '../lib/supabase';
import { storageService } from './storageService';

export interface CreateRecordingParams {
  subjectId: string;
  audioBlob: Blob;
  duration: number;
  title?: string;
}

export interface Recording {
  id: string;
  user_id: string;
  subject_id: string;
  title: string;
  audio_url: string;
  duration: number;
  date: string;
  transcribed: boolean;
  created_at: string;
  updated_at: string;
}

export class RecordingService {
  
  async createRecording(params: CreateRecordingParams): Promise<Recording> {
    try {
      const tempUserId = 'temp-user-' + Date.now();
      
      const recordingId = crypto.randomUUID();

      console.log('Uploading audio to storage...');
      
      const audioUrl = await storageService.uploadAudio(
        params.audioBlob,
        tempUserId,
        recordingId
      );

      console.log('Audio uploaded:', audioUrl);
      console.log('Saving recording metadata...');
      const { data, error } = await supabase
        .from('recordings')
        .insert({
          id: recordingId,
          user_id: tempUserId,
          subject_id: params.subjectId,
          title: params.title || 'Untitled Recording',
          audio_url: audioUrl,
          duration: params.duration,
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw new Error(`Failed to save recording: ${error.message}`);
      }

      console.log('Recording saved successfully:', data);
      return data;
    } catch (error) {
      console.error('Create recording error:', error);
      throw error;
    }
  }

  /**
   * Get recordings by subject
   */
  async getRecordingsBySubject(subjectId: string): Promise<Recording[]> {
    try {
      const { data, error } = await supabase
        .from('recordings')
        .select('*')
        .eq('subject_id', subjectId)
        .order('date', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch recordings: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Get recordings error:', error);
      throw error;
    }
  }

  /**
   * Get single recording with transcriptions and summaries
   */
  async getRecording(recordingId: string) {
    try {
      const { data, error } = await supabase
        .from('recordings')
        .select('*, transcriptions(*), summaries(*)')
        .eq('id', recordingId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch recording: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Get recording error:', error);
      throw error;
    }
  }

  async deleteRecording(recordingId: string): Promise<void> {
    try {
      const { data: recording } = await supabase
        .from('recordings')
        .select('audio_url, user_id')
        .eq('id', recordingId)
        .single();

      if (recording) {
        const filePath = `${recording.user_id}/${recordingId}.webm`;
        await storageService.deleteAudio(filePath);
      }

      const { error } = await supabase
        .from('recordings')
        .delete()
        .eq('id', recordingId);

      if (error) {
        throw new Error(`Failed to delete recording: ${error.message}`);
      }

      console.log('Recording deleted successfully');
    } catch (error) {
      console.error('Delete recording error:', error);
      throw error;
    }
  }

  
  async updateRecordingTitle(recordingId: string, title: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('recordings')
        .update({ title })
        .eq('id', recordingId);

      if (error) {
        throw new Error(`Failed to update title: ${error.message}`);
      }
    } catch (error) {
      console.error('Update title error:', error);
      throw error;
    }
  }
}

export const recordingService = new RecordingService();
