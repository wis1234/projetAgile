import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { clearAllSupabaseData } from '@/utils/authCleanup';

const AuthContext = createContext(undefined);

const DELAYS = [1000, 2000, 4000];

const withAuthRetry = async (operation, maxRetries = 3) => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      if (result?.error) throw result.error;
      return result;
    } catch (error) {
      const isNetworkError = error.message === 'Failed to fetch' || error.message?.includes('network');
      if (!isNetworkError || attempt === maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, DELAYS[attempt]));
    }
  }
};

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logoutInProgress, setLogoutInProgress] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connected'); // connected, disconnected, reconnecting

  const clearAllAuthData = useCallback(() => {
    setUser(null);
    setSession(null);
    setLoading(false);
  }, []);

  const isSessionValid = useCallback(() => {
    try {
      const keys = Object.keys(localStorage);
      const authKey = keys.find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
      
      if (!authKey) return false;
      
      const tokenData = JSON.parse(localStorage.getItem(authKey));
      if (!tokenData?.access_token) return false;
      
      // Validate JWT structure
      const parts = tokenData.access_token.split('.');
      if (parts.length !== 3) return false;
      
      // Decode payload and check expiry
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return false;
      }
      
      return true;
    } catch (e) {
      console.warn('[Auth] Session validation error:', e);
      return false;
    }
  }, []);

  const handleSession = useCallback(async (currentSession) => {
    setSession(currentSession);
    
    if (currentSession?.user) {
      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', currentSession.user.id)
          .single();
          
        if (!error && userData) {
          currentSession.user.role = userData.role;
        }
      } catch (err) {
        console.error("Error fetching user role:", err);
      }
    }
    
    setUser(currentSession?.user ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      // Validate session and clear corrupted data if needed
      if (!isSessionValid() && window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        clearAllAuthData();
        clearAllSupabaseData();
      }

      try {
        setConnectionStatus('reconnecting');
        const result = await withAuthRetry(() => supabase.auth.getSession(), 2);
        if (mounted) {
          setConnectionStatus('connected');
          handleSession(result.data.session);
        }
      } catch (error) {
        console.error("Error getting session:", error);
        if (mounted) {
          setConnectionStatus('disconnected');
          setLoading(false);
        }
      }
    };

    initAuth();

    // Health check interval
    const healthCheck = setInterval(async () => {
      try {
        const { error } = await supabase.auth.getSession();
        if (error) throw error;
        if (mounted && connectionStatus !== 'connected') setConnectionStatus('connected');
      } catch (err) {
        if (mounted && connectionStatus === 'connected') setConnectionStatus('disconnected');
      }
    }, 30000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (mounted) {
          setConnectionStatus('connected');
          handleSession(currentSession);
        }
      }
    );

    return () => {
      mounted = false;
      clearInterval(healthCheck);
      subscription.unsubscribe();
    };
  }, [handleSession, connectionStatus, isSessionValid, clearAllAuthData]);

  const mapErrorMessage = (error) => {
    if (error.message === "Failed to fetch" || error.message?.includes('network')) {
      return "Network error. Please check your internet connection.";
    }
    if (error.message?.includes('credentials')) {
      return "Invalid email or password.";
    }
    return "An authentication error occurred. Please try again.";
  };

  const signUp = useCallback(async (email, password, options) => {
    setConnectionStatus('reconnecting');
    try {
      const data = await withAuthRetry(() => supabase.auth.signUp({ email, password, options }));
      setConnectionStatus('connected');
      return { data: data.data, error: null };
    } catch (error) {
      setConnectionStatus('disconnected');
      console.error("SignUp Full Error:", error);
      toast({
        variant: "destructive",
        title: "Sign up Failed",
        description: mapErrorMessage(error),
      });
      return { data: null, error };
    }
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    setConnectionStatus('reconnecting');
    try {
      const data = await withAuthRetry(() => supabase.auth.signInWithPassword({ email, password }));
      setConnectionStatus('connected');
      return { data: data.data, error: null };
    } catch (error) {
      setConnectionStatus('disconnected');
      console.error("SignIn Full Error:", error);
      toast({
        variant: "destructive",
        title: "Sign in Failed",
        description: mapErrorMessage(error),
      });
      return { data: null, error };
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    if (window.location.pathname === '/login') {
      clearAllAuthData();
      clearAllSupabaseData();
      return;
    }

    if (logoutInProgress) return;
    
    setLogoutInProgress(true);
    setConnectionStatus('reconnecting');

    try {
      if (isSessionValid()) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }
    } catch (error) {
      const errorMsg = error.message || '';
      
      // Suppress known session absent errors
      if (
        errorMsg.includes('session_id claim in JWT does not exist') || 
        errorMsg.includes('Session from session_id claim') ||
        errorMsg.includes('session_not_found')
      ) {
        console.log("[Auth] Session already cleared on server. Treating as successful logout.");
      } else {
        console.error("[Auth] SignOut Full Error:", error);
      }
    } finally {
      clearAllAuthData();
      clearAllSupabaseData();
      setConnectionStatus('connected');
      setLogoutInProgress(false);
      
      const lang = localStorage.getItem('language') || 'en';
      toast({
        title: lang === 'fr' ? "Déconnecté avec succès" : "Logged out successfully",
      });

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  }, [logoutInProgress, isSessionValid, clearAllAuthData, toast]);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    connectionStatus,
    logoutInProgress,
    isSessionValid,
    clearAllAuthData,
    signUp,
    signIn,
    signOut,
  }), [user, session, loading, connectionStatus, logoutInProgress, isSessionValid, clearAllAuthData, signUp, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};