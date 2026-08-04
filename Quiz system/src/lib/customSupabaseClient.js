import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fiecseeqduqoavlmafwq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpZWNzZWVxZHVxb2F2bG1hZndxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNDA5ODIsImV4cCI6MjA4MjYxNjk4Mn0.Uw9sBvHwOLAfgah60bRQVjyRjCAsIaty9JHKsvjobxE';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
