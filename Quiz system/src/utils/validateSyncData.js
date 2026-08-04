import { supabase } from '@/lib/customSupabaseClient';

export const validateSyncData = async () => {
  try {
    let passed = true;
    const details = [];

    const { count: enumCount, error: enumErr } = await supabase
      .from('survey_enumerators')
      .select('*', { count: 'exact', head: true });
      
    if (enumErr) throw enumErr;
    
    if (enumCount === 0) {
      passed = false;
      details.push(`Expected enumerators, found 0.`);
    } else {
      details.push(`Found ${enumCount} real enumerators.`);
    }

    const { count: intCount, error: intErr } = await supabase
      .from('survey_interviews')
      .select('*', { count: 'exact', head: true });
      
    if (intErr) throw intErr;
    
    if (intCount === 0) {
      passed = false;
      details.push(`Expected interviews, found 0.`);
    } else {
      details.push(`Found ${intCount} real interviews.`);
    }

    const { count: nullNames } = await supabase
      .from('survey_interviews')
      .select('*', { count: 'exact', head: true })
      .is('enumerator_name', null);
      
    if (nullNames > 0) {
      passed = false;
      details.push(`${nullNames} interviews are missing enumerator names.`);
    }

    return { passed, details };
  } catch (err) {
    return { passed: false, details: [`Validation error: ${err.message}`] };
  }
};