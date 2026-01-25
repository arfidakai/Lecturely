import { supabaseAdmin } from '../lib/supabase-admin';

export interface CreateTranscriptionParams {
  recordingId: string;
  text: string;
  timestamp: number;
  important?: boolean;
}

export const transcriptionService = {
 
  async createTranscription(params: CreateTranscriptionParams) {
    const { recordingId, text, timestamp, important = false } = params;

    const { data, error } = await supabaseAdmin
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

  async getTranscriptionsByRecording(recordingId: string) {
    const { data, error } = await supabaseAdmin
      .from('transcriptions')
      .select('*')
      .eq('recording_id', recordingId)
      .order('timestamp', { ascending: true });

    if (error) throw error;
    return data;
  },

  async updateTranscriptionImportance(transcriptionId: string, important: boolean) {
    const { data, error } = await supabaseAdmin
      .from('transcriptions')
      .update({ important })
      .eq('id', transcriptionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTranscription(transcriptionId: string) {
    const { error } = await supabaseAdmin
      .from('transcriptions')
      .delete()
      .eq('id', transcriptionId);

    if (error) throw error;
  },
};
