import { supabase } from '@/lib/customSupabaseClient';

export const syncLogger = {
  logSyncStep: async (step, status, details = {}) => {
    try {
      const { error } = await supabase.from('automation_logs').insert({
        event_type: 'sync_step',
        status,
        details: { step, timestamp: new Date().toISOString(), ...details }
      });
      if (error) {
        console.error("Error logging sync step (Possible RLS violation):", error.message || error);
      }
    } catch (err) {
      console.error("Failed to log sync step, continuing anyway:", err.message || err);
    }
  },

  logApiCall: async (endpoint, status, recordCount, responseTimeMs, rawResponse = null) => {
    try {
      const size = rawResponse ? new TextEncoder().encode(JSON.stringify(rawResponse)).length : 0;
      const { error } = await supabase.from('automation_logs').insert({
        event_type: 'api_call',
        status,
        details: { 
          endpoint, 
          recordCount, 
          responseTimeMs, 
          fileSizeBytes: size,
          timestamp: new Date().toISOString()
        }
      });
      if (error) {
         console.error("Error logging API call (Possible RLS violation):", error.message || error);
      }
    } catch (err) {
      console.error("Failed to log API call, continuing anyway:", err.message || err);
    }
  },

  logSyncError: async (error, context = '') => {
    try {
      const { error: logErr } = await supabase.from('automation_logs').insert({
        event_type: 'sync_error',
        status: 'error',
        details: { context, error: error.message || error, timestamp: new Date().toISOString() }
      });
      if (logErr) {
        console.error("Error logging sync error (Possible RLS violation):", logErr.message || logErr);
      }
    } catch (err) {
      console.error("Failed to log sync error, continuing anyway:", err.message || err);
    }
  },

  getSyncLogs: async (limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('automation_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Failed to fetch sync logs:", err.message || err);
      return [];
    }
  }
};