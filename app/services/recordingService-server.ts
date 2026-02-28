import { SupabaseClient } from '@supabase/supabase-js';
import { storageService } from './storageService';

export interface CreateRecordingParams {
  userId: string;
  subjectId: string;
  audioBlob: Blob;
  duration: number;
  title?: string;
  supabase: SupabaseClient;
}

export const recordingService = {
  async createRecording(params: CreateRecordingParams) {
    const { userId, subjectId, audioBlob, duration, title, supabase } = params;
    
    try {
      console.log('Uploading audio to storage...');
      const audioUrl = await storageService.uploadAudio(audioBlob, userId);
      
      console.log('Creating recording in database...', { audioUrl, subjectId, duration });
      const { data, error } = await supabase
        .from('recordings')
        .insert({
          user_id: userId,
          subject_id: subjectId,
          audio_url: audioUrl,
          duration: duration,
          title: title || `Recording ${new Date().toLocaleDateString()}`,
        })
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', error);
        try {
          await storageService.deleteAudio(audioUrl);
        } catch (cleanupError) {
          console.error('Failed to cleanup uploaded file:', cleanupError);
        }
        throw error;
      }

      console.log('Recording created successfully:', data);
      return data;
    } catch (error) {
      console.error('Error creating recording:', error);
      throw error;
    }
  },
  async getRecordingsBySubject(subjectId: string, supabase: SupabaseClient) {
    const { data, error } = await supabase
      .from('recordings')
      .select('*')
      .eq('subject_id', subjectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },
  async getRecording(recordingId: string, supabase: SupabaseClient) {
    const { data, error } = await supabase
      .from('recordings')
      .select('*')
      .eq('id', recordingId)
      .single();

    if (error) throw error;
    return data;
  },

  async deleteRecording(recordingId: string, supabase: SupabaseClient) {
    const recording = await this.getRecording(recordingId, supabase);
    
    await storageService.deleteAudio(recording.audio_url);
    
    const { error} = await supabase
      .from('recordings')
      .delete()
      .eq('id', recordingId);

    if (error) throw error;
  },

  async updateRecordingTitle(recordingId: string, title: string, supabase: SupabaseClient) {
    const { data, error } = await supabase
      .from('recordings')
      .update({ title })
      .eq('id', recordingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
