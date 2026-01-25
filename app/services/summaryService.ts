import { supabaseAdmin } from '../lib/supabase-admin';

export interface CreateSummaryParams {
  recordingId: string;
  content: string;
}

export const summaryService = {
  async createSummary(params: CreateSummaryParams) {
    const { recordingId, content } = params;

    const { data, error } = await supabaseAdmin
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

  async getSummaryByRecording(recordingId: string) {
    const { data, error } = await supabaseAdmin
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

  async updateSummary(summaryId: string, content: string) {
    const { data, error } = await supabaseAdmin
      .from('summaries')
      .update({ content })
      .eq('id', summaryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
  async deleteSummary(summaryId: string) {
    const { error } = await supabaseAdmin
      .from('summaries')
      .delete()
      .eq('id', summaryId);

    if (error) throw error;
  },
};
