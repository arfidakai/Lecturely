import { SupabaseClient } from '@supabase/supabase-js';

export interface CreateTranscriptionParams {
  recordingId: string;
  text: string;
  timestamp: number;
  important?: boolean;
  supabase: SupabaseClient;
}

export const transcriptionService = {
 
  async createTranscription(params: CreateTranscriptionParams) {
    const { recordingId, text, timestamp, important = false, supabase } = params;

    const { data, error } = await supabase
      .from('transcriptions')
      .insert({
        recording_id: recordingId,
        text,
        timestamp,
        important,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getTranscriptionsByRecording(recordingId: string, supabase: SupabaseClient) {
    const { data, error } = await supabase
      .from('transcriptions')
      .select('*')
      .eq('recording_id', recordingId)
      .order('timestamp', { ascending: true });

    if (error) throw error;
    return data;
  },

  async updateTranscriptionImportance(transcriptionId: string, important: boolean, supabase: SupabaseClient) {
    const { data, error } = await supabase
      .from('transcriptions')
      .update({ important })
      .eq('id', transcriptionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTranscription(transcriptionId: string, supabase: SupabaseClient) {
    const { error } = await supabase
      .from('transcriptions')
      .delete()
      .eq('id', transcriptionId);

    if (error) throw error;
  },
};
