/**
 * Utility to completely clear all Supabase authentication data
 * from localStorage and sessionStorage.
 */
export const clearAllSupabaseData = () => {
  try {
    const keysToRemove = [];
    
    // Identify all supabase/auth related keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key && 
        (key.includes('supabase') || 
         key.startsWith('sb-') || 
         key.includes('auth-token'))
      ) {
        keysToRemove.push(key);
      }
    }
    
    // Remove identified keys from localStorage
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Completely clear sessionStorage
    sessionStorage.clear();
    
    console.log('[Auth] Local authentication data completely cleared.');
  } catch (error) {
    console.error('[Auth] Error clearing auth data:', error);
  }
};