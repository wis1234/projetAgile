import { supabase } from '@/lib/customSupabaseClient';

export const DashboardService = {
  triggerDownload: async () => {
    const { data, error } = await supabase.functions.invoke('download-survey-data');
    if (error) throw error;
    return data;
  },

  getDownloads: async () => {
    const { data, error } = await supabase
      .from('survey_downloads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    if (error) throw error;
    return data;
  },

  getQualityMetrics: async () => {
    const { data, error } = await supabase
      .from('data_quality_metrics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) throw error;
    return data[0];
  },

  getEnumeratorStats: async () => {
    const { data, error } = await supabase
      .from('enumerator_stats')
      .select('*')
      .order('forms_submitted', { ascending: false });
    if (error) throw error;
    return data;
  }
};