import { supabase } from '@/lib/customSupabaseClient';

export const SyncService = {
  clearOldSyncData: async () => {
    try {
      await supabase.from('survey_interviews').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('survey_enumerators').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      return true;
    } catch (err) {
      console.error("Failed to clear old data", err);
      throw err;
    }
  },

  fetchInterviewsFromServer: async () => {
    const limit = 20;
    let offset = 0;
    let allInterviews = [];
    
    try {
      const { data: initialRes } = await supabase.functions.invoke('proxy-survey-solutions', {
        body: { endpoint: `/api/v1/interviews?limit=1&offset=0` }
      });
      
      const totalCount = initialRes?.data?.TotalCount || 651;
      const totalPages = Math.ceil(totalCount / limit);

      for (let page = 0; page < totalPages; page++) {
        offset = page * limit;
        const { data: pageRes } = await supabase.functions.invoke('proxy-survey-solutions', {
          body: { endpoint: `/api/v1/interviews?limit=${limit}&offset=${offset}` }
        });
        
        if (pageRes?.data?.Interviews) {
          allInterviews = allInterviews.concat(pageRes.data.Interviews);
        } else if (Array.isArray(pageRes?.data)) {
          allInterviews = allInterviews.concat(pageRes.data);
        }
      }
      return allInterviews;
    } catch (err) {
      console.error("Failed to fetch interviews from server API", err);
      throw err;
    }
  },

  insertInterviewsToSupabase: async (interviews) => {
    try {
      const formatted = interviews.map(i => ({
        interview_key: i.InterviewId || i.id || crypto.randomUUID(),
        responsible_name: i.ResponsibleName || i.ResponsibleId || 'Unassigned',
        status: i.Status || 'Unknown',
        errors_count: i.ErrorsCount || 0,
        not_answered: i.NotAnsweredCount || 0,
        interview_mode: i.InterviewMode || 'Unknown',
        received_by_tablet: i.ReceivedByTablet || false,
        updated_on: i.LastEntryDate || new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      let insertedCount = 0;
      for (let i = 0; i < formatted.length; i += 100) {
        const chunk = formatted.slice(i, i + 100);
        const { error } = await supabase.from('survey_interviews').insert(chunk);
        if (error) {
          console.error("Chunk insert error:", error.message);
        } else {
          insertedCount += chunk.length;
        }
      }
      return { success: true, count: insertedCount };
    } catch (err) {
      console.error("Insert interviews error", err);
      throw err;
    }
  },

  extractAndInsertEnumerators: async (interviews) => {
    try {
      const map = {};
      interviews.forEach(i => {
        const name = i.ResponsibleName || 'Unassigned';
        if (name !== 'Unassigned') {
          if (!map[name]) map[name] = { total: 0, completed: 0, errors: 0 };
          map[name].total += 1;
          if (['Completed', 'ApprovedBySupervisor', 'ApprovedByHQ'].includes(i.Status)) {
            map[name].completed += 1;
          }
          map[name].errors += (i.ErrorsCount || 0);
        }
      });

      const enumerators = Object.entries(map).map(([name, stats]) => {
        const compRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
        const avgErr = stats.total > 0 ? (stats.errors / stats.total) : 0;
        const qScore = Math.max(0, Math.round(100 - (avgErr * 10)));
        return {
          enumerator_name: name,
          total_interviews: stats.total,
          completion_rate: compRate,
          quality_score: qScore,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });

      if (enumerators.length > 0) {
        const { error } = await supabase.from('survey_enumerators').insert(enumerators);
        if (error) throw error;
      }
      
      return { success: true, count: enumerators.length };
    } catch (err) {
      console.error("Extract enumerators error", err);
      throw err;
    }
  },

  fetchAndStoreSurveyData: async (onProgress = () => {}) => {
    try {
      onProgress('Clearing old data...', 10);
      await SyncService.clearOldSyncData();
      
      onProgress('Fetching all interviews from server...', 30);
      const allInterviews = await SyncService.fetchInterviewsFromServer();
      
      onProgress('Inserting complete database to Supabase...', 60);
      const insertRes = await SyncService.insertInterviewsToSupabase(allInterviews);
      
      onProgress('Extracting and inserting enumerators...', 85);
      const enumRes = await SyncService.extractAndInsertEnumerators(allInterviews);
      
      onProgress('Sync complete!', 100);
      return { 
        success: true, 
        stats: { 
          interviews_processed: insertRes.count, 
          enumerators_processed: enumRes.count 
        } 
      };
    } catch (err) {
      throw err;
    }
  },

  getStoredInterviewStats: async () => {
    try {
      const { count: total, error: err1 } = await supabase.from('survey_interviews').select('*', { count: 'exact', head: true });
      if (err1) throw err1;
      const { count: completed, error: err2 } = await supabase.from('survey_interviews').select('*', { count: 'exact', head: true }).in('status', ['Completed', 'ApprovedBySupervisor', 'ApprovedByHQ']);
      if (err2) throw err2;
      const { count: incomplete, error: err3 } = await supabase.from('survey_interviews').select('*', { count: 'exact', head: true }).not('status', 'in', '("Completed","ApprovedBySupervisor","ApprovedByHQ")');
      if (err3) throw err3;
      return { total: total || 0, completed: completed || 0, incomplete: incomplete || 0 };
    } catch (err) {
      return { total: 0, completed: 0, incomplete: 0 };
    }
  },

  getEnumeratorCount: async () => {
    try {
      const { count, error } = await supabase.from('survey_enumerators').select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    } catch (err) {
      return 0;
    }
  },
  
  getStoredInterviewCount: async () => {
    try {
      const { count, error } = await supabase.from('survey_interviews').select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    } catch (err) {
      return 0;
    }
  },

  getAllInterviews: async () => {
    try {
      const { data, error } = await supabase.from('survey_interviews').select('*').order('updated_on', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (err) {
      return [];
    }
  },
  
  getLastSyncLog: async () => {
    try {
      const { data, error } = await supabase.from('survey_sync_log').select('*').order('sync_timestamp', { ascending: false }).limit(1).maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (err) {
      return null;
    }
  },
  
  getDataQualityMetrics: async () => {
      try {
          const { data, error } = await supabase.from('survey_statistics').select('overall_quality_score, overall_completion_rate').order('last_sync_time', { ascending: false }).limit(1).maybeSingle();
          if (error && error.code !== 'PGRST116') throw error;
          return {
              overall_score: data?.overall_quality_score || 0,
              completion_rate: data?.overall_completion_rate || 0
          };
      } catch (err) {
          return { overall_score: 0, completion_rate: 0 };
      }
  }
};