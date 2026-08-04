import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { decrypt } from '@/utils/encryptionUtils';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSettings = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
        
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setSettings({
          ...data,
          survey_solutions_password: data.survey_solutions_password ? decrypt(data.survey_solutions_password) : '',
          email_password: data.email_password ? decrypt(data.email_password) : ''
        });
      } else {
        setSettings(null);
      }
    } catch (err) {
      console.error('Error fetching settings:', err.message || err);
      toast({
        variant: "destructive",
        title: "Settings Load Error",
        description: err.message?.includes('policy') ? "Permission denied. Please check RLS policies." : "Could not load settings."
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const refreshSettings = () => {
    fetchSettings();
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);