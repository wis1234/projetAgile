import { supabase } from '@/lib/customSupabaseClient';

const DELAYS = [1000, 2000, 4000];

/**
 * Executes a function with exponential backoff retry and a timeout.
 */
const withRetryAndTimeout = async (operation, maxRetries = 3, timeoutMs = 5000) => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs)
      );
      const result = await Promise.race([operation(), timeoutPromise]);
      if (result?.error) throw result.error;
      return result;
    } catch (error) {
      const isNetworkOrTimeout = error.message === 'Failed to fetch' || error.message === 'TIMEOUT' || error.message?.includes('network');
      
      if (!isNetworkOrTimeout || attempt === maxRetries) {
        const errorType = error.message === 'TIMEOUT' ? 'timeout' : (isNetworkOrTimeout ? 'network' : 'database');
        throw { originalError: error, type: errorType, message: error.message };
      }
      await new Promise(resolve => setTimeout(resolve, DELAYS[attempt]));
    }
  }
};

export const getActiveAttempt = async (userId, quizId) => {
  try {
    const data = await withRetryAndTimeout(() => supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('quiz_id', quizId)
      .in('status', ['in_progress', 'active'])
      .maybeSingle()
    );
    return data.data;
  } catch (error) {
    console.error("getActiveAttempt error:", error);
    throw error;
  }
};

export const getOrCreateAttempt = async (userId, quizId) => {
  try {
    const existing = await withRetryAndTimeout(() => supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('quiz_id', quizId)
      .in('status', ['in_progress', 'active'])
      .maybeSingle()
    );

    if (existing.data) {
      return { attempt: existing.data, isResumed: true };
    }

    try {
      const newAttempt = await withRetryAndTimeout(() => supabase
        .from('quiz_attempts')
        .insert({
          user_id: userId,
          quiz_id: quizId,
          started_at: new Date().toISOString(),
          status: 'in_progress',
          answers: {}
        })
        .select()
        .single()
      );
      return { attempt: newAttempt.data, isResumed: false };
    } catch (createError) {
      if (createError.originalError?.code === '23505') {
        const fallback = await withRetryAndTimeout(() => supabase
          .from('quiz_attempts')
          .select('*')
          .eq('user_id', userId)
          .eq('quiz_id', quizId)
          .in('status', ['in_progress', 'active'])
          .single()
        );
        return { attempt: fallback.data, isResumed: true };
      }
      throw createError;
    }
  } catch (error) {
    console.error("getOrCreateAttempt error:", error);
    throw error;
  }
};

export const createAttemptSafe = getOrCreateAttempt;

export const checkAttemptsRemaining = async (userId, quizId, maxAttempts) => {
  try {
    const result = await withRetryAndTimeout(() => supabase
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('quiz_id', quizId)
      .eq('status', 'completed')
    );
    
    const used = result.count || 0;
    const limit = maxAttempts || 1;
    const remaining = Math.max(0, limit - used);
    const isExhausted = used >= limit;
    
    return {
      attemptsUsed: used,
      attemptsRemaining: remaining,
      isExhausted: isExhausted,
      remaining: remaining,
      total: limit,
      exhausted: isExhausted,
      used: used
    };
  } catch (error) {
    console.error("checkAttemptsRemaining error:", error);
    throw error;
  }
};

export const handleUnansweredQuestions = (questions, answers) => {
  const newAnswers = { ...answers };
  questions.forEach(q => {
    if (newAnswers[q.id] === undefined) {
      newAnswers[q.id] = -1;
    }
  });
  return newAnswers;
};

export const calculateScoreWithUnanswered = (questions, answers) => {
  let correctCount = 0;
  questions.forEach(q => {
    if (answers[q.id] === q.correct_answer) {
      correctCount++;
    }
  });
  
  const totalQuestions = questions.length;
  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  
  return { correctCount, totalQuestions, score };
};

export const submitQuizOnTimeout = async (attemptId, answers, questions) => {
  if (!attemptId) return { success: false, error: { type: 'validation', message: 'No attempt ID' } };
  
  try {
    const { correctCount, totalQuestions, score } = calculateScoreWithUnanswered(questions, answers);

    const attemptResult = await withRetryAndTimeout(() => supabase
      .from('quiz_attempts')
      .select('user_id, quiz_id')
      .eq('id', attemptId)
      .single()
    );

    const attempt = attemptResult.data;

    await withRetryAndTimeout(() => supabase.from('quiz_results').insert({
      user_id: attempt.user_id,
      quiz_id: attempt.quiz_id,
      score: score,
      correct_answers: correctCount,
      total_questions: totalQuestions,
      completed_at: new Date().toISOString()
    }));
  
    await withRetryAndTimeout(() => supabase
      .from('quiz_attempts')
      .update({ 
        status: 'completed', 
        completed_at: new Date().toISOString(),
        answers: answers
      })
      .eq('id', attemptId)
    );

    return { success: true, error: null };
  } catch (error) {
    console.error("submitQuizOnTimeout error:", error);
    return { success: false, error };
  }
};

export const isQuizDeadlineExpired = (quiz) => {
  if (!quiz) return true;
  return !quiz.is_active;
};

export const getTimeRemaining = (startedAt, durationMinutes) => {
  if (!startedAt || !durationMinutes) {
    return { milliseconds: 0, formatted: "00:00", isExpired: true };
  }

  const startTime = new Date(startedAt).getTime();
  const deadline = startTime + (durationMinutes * 60 * 1000);
  const now = Date.now();
  const diff = deadline - now;

  if (diff <= 0) {
    return { milliseconds: 0, formatted: "00:00", isExpired: true };
  }

  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  
  return { 
    milliseconds: diff, 
    formatted: `${minutes}:${seconds.toString().padStart(2, '0')}`,
    isExpired: false
  };
};

export const validateQuizAccess = async (userId, quizId, isAdmin) => {
  try {
    if (isAdmin) return { allowed: true, reason: null };

    // Also checks connection implicitly via withRetryAndTimeout
    const result = await withRetryAndTimeout(() => supabase
      .from('user_assignments')
      .select('id')
      .eq('user_id', userId)
      .eq('quiz_id', quizId)
      .maybeSingle()
    );

    if (!result.data) {
      return { allowed: false, reason: 'access_denied' };
    }

    return { allowed: true, reason: null };
  } catch (error) {
    console.error("validateQuizAccess error:", error);
    throw error;
  }
};