import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { supabase } from '@/lib/customSupabaseClient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Lock, RefreshCw, ArrowLeft } from 'lucide-react';
import { checkAttemptsRemaining, getOrCreateAttempt } from '@/utils/quizUtils';
import Quiz from './Quiz';
import ErrorBoundary from '@/components/ErrorBoundary';

const QuizPageContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizState, setQuizState] = useState({ canAccess: false, attempt: null, isResumed: false, attemptsUsed: 0, maxAttempts: 0 });

  useEffect(() => { if (user && id) initialize(); }, [user, id]);

  const initialize = async () => {
    setLoading(true); setError(null);
    try {
      const { data: quiz, error: qErr } = await supabase.from('quizzes').select('max_attempts, is_active').eq('id', id).single();
      if (qErr || !quiz) throw new Error(t('quizPage.error.notFound'));
      if (!quiz.is_active) throw new Error(t('quizPage.error.expired'));

      const { isExhausted, attemptsUsed, total } = await checkAttemptsRemaining(user.id, id, quiz.max_attempts);
      if (isExhausted) {
        setQuizState({ canAccess: false, attempt: null, isResumed: false, attemptsUsed, maxAttempts: total });
      } else {
        const { attempt, isResumed } = await getOrCreateAttempt(user.id, id);
        setQuizState({ canAccess: true, attempt, isResumed, attemptsUsed, maxAttempts: total });
      }
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><RefreshCw className="w-12 h-12 animate-spin text-blue-600" /></div>;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full border-t-4 border-red-500 shadow-lg text-center p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">{t('quizPage.error.title')}</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => navigate('/dashboard')} className="w-full">{t('quizPage.returnBtn')}</Button>
        </Card>
      </div>
    );
  }

  if (!quizState.canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full border-t-4 border-orange-500 shadow-lg text-center p-8">
          <Lock className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">{t('quizPage.denied.title')}</h2>
          <p className="text-gray-600 mb-6">{t('quizPage.denied.desc', { used: quizState.attemptsUsed, max: quizState.maxAttempts })}</p>
          <Button onClick={() => navigate('/dashboard')} className="w-full bg-gray-900 text-white"><ArrowLeft className="w-4 h-4 mr-2" />{t('quizPage.returnBtn')}</Button>
        </Card>
      </div>
    );
  }

  return <Quiz quizId={id} attempt={quizState.attempt} isResumed={quizState.isResumed} />;
};

const QuizPage = () => <ErrorBoundary><QuizPageContent /></ErrorBoundary>;
export default QuizPage;