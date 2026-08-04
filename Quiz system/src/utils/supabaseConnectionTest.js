import { supabase } from '@/lib/customSupabaseClient';

/**
 * Tests the connection to the Supabase database.
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export const testSupabaseConnection = async () => {
  try {
    // Attempt a simple query to verify database connectivity
    const { error } = await supabase.from('users').select('id').limit(1);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, message: 'Connected' };
  } catch (err) {
    return { success: false, error: err.message || 'An unexpected error occurred during connection test' };
  }
};