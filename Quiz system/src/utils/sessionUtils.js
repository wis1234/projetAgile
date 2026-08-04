import { supabase } from '@/lib/customSupabaseClient';

/**
 * Checks if the current Supabase session is valid.
 * @returns {Promise<boolean>} True if session exists and is valid, false otherwise.
 */
export const checkSessionValidity = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      console.warn('Session validation failed: No session or error returned.', error?.message);
      return false;
    }
    
    // Check if the session is expired
    if (session.expires_at) {
      const expiresAt = session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      if (expiresAt < now) {
        console.warn('Session validation failed: Session has expired.');
        return false;
      }
    }
    
    return true;
  } catch (err) {
    console.error('Session validation unexpected error:', err);
    return false;
  }
};