import { SupabaseClient } from '@supabase/supabase-js';

export interface CreateSummaryParams {
  recordingId: string;
  content: string;
  supabase: SupabaseClient;
}

export const summaryService = {
  async createSummary(params: CreateSummaryParams) {
    const { recordingId, content, supabase } = params;

    const { data, error } = await supabase
      .from('summaries')
      .insert({
        recording_id: recordingId,
        content,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getSummaryByRecording(recordingId: string, supabase: SupabaseClient) {
    const { data, error } = await supabase
      .from('summaries')
      .select('*')
      .eq('recording_id', recordingId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    return data;
  },

  async updateSummary(summaryId: string, content: string, supabase: SupabaseClient) {
    const { data, error } = await supabase
      .from('summaries')
      .update({ content })
      .eq('id', summaryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
  async deleteSummary(summaryId: string, supabase: SupabaseClient) {
    const { error } = await supabase
      .from('summaries')
      .delete()
      .eq('id', summaryId);

    if (error) throw error;
  },
};
