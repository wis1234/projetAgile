import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export const useServerPointVerification = () => {
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyPassword = useCallback(async (userId, password) => {
    setIsVerifying(true);
    try {
      if (!password) {
        return { isConnected: false, surveyUsername: null, error: 'Password is required' };
      }

      // Querying the appropriate Survey Solutions connection credentials.
      // In this environment, app_settings stores global Survey Solution credentials,
      // but if a specific user credential table existed (like survey_enumerators), 
      // we would join it here. We will verify against app_settings.
      const { data, error } = await supabase
        .from('app_settings')
        .select('survey_solutions_username, survey_solutions_password')
        .single();

      if (error) {
        console.error('[Security Audit] Error fetching credentials:', error);
        throw error;
      }

      if (data.survey_solutions_password === password) {
        return { isConnected: true, surveyUsername: data.survey_solutions_username, error: null };
      } else {
        console.warn(`[Security Audit] Failed password verification for user ID: ${userId} at ${new Date().toISOString()}`);
        return { isConnected: false, surveyUsername: null, error: 'Password mismatch' };
      }
    } catch (err) {
      console.error('[Security Audit] Verification unexpected error:', err);
      return { isConnected: false, surveyUsername: null, error: err.message };
    } finally {
      setIsVerifying(false);
    }
  }, []);

  return { verifyPassword, isVerifying };
};