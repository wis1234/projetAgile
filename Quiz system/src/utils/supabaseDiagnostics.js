import { supabase } from '@/lib/customSupabaseClient';

/**
 * Tests if Supabase client is initialized and API key is present.
 * @returns {Promise<{success: boolean, message: string, apiKeyPresent: boolean}>}
 */
export const testSupabaseConnection = async () => {
  try {
    const hasKey = !!supabase?.supabaseKey || !!import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    // Attempt a lightweight query to verify active connection
    const { error } = await supabase.from('users').select('id').limit(1);
    
    if (error) {
      return { 
        success: false, 
        message: `Connection failed: ${error.message}`, 
        apiKeyPresent: hasKey 
      };
    }
    
    return { 
      success: true, 
      message: 'Connected successfully', 
      apiKeyPresent: hasKey 
    };
  } catch (error) {
    return { 
      success: false, 
      message: error.message || 'Unexpected connection error', 
      apiKeyPresent: !!supabase?.supabaseKey || !!import.meta.env.VITE_SUPABASE_ANON_KEY 
    };
  }
};

/**
 * Tests SELECT access on a specific table.
 * @param {string} tableName 
 * @returns {Promise<{table: string, success: boolean, error: string | null, details: string}>}
 */
export const testTableAccess = async (tableName) => {
  try {
    const { data, error } = await supabase.from(tableName).select('*').limit(1);
    
    if (error) {
      return { 
        table: tableName, 
        success: false, 
        error: error.message, 
        details: JSON.stringify(error, null, 2) 
      };
    }
    
    return { 
      table: tableName, 
      success: true, 
      error: null, 
      details: `Successfully retrieved ${data.length} record(s).` 
    };
  } catch (error) {
    return { 
      table: tableName, 
      success: false, 
      error: error.message || 'Unknown error', 
      details: error.stack || error.toString() 
    };
  }
};

/**
 * Runs all tests on core tables.
 * @returns {Promise<{connection: object, tables: array, summary: object}>}
 */
export const runFullDiagnostics = async () => {
  const connection = await testSupabaseConnection();
  
  const tablesToTest = ['users', 'quizzes', 'user_assignments', 'questions', 'responses'];
  const tables = await Promise.all(tablesToTest.map(tableName => testTableAccess(tableName)));
  
  const passed = tables.filter(t => t.success).length;
  const failed = tables.length - passed;
  
  return {
    connection,
    tables,
    summary: { passed, failed, total: tables.length }
  };
};