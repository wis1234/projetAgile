import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Clock, EyeOff, RefreshCw, ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getTimeRemaining } from '@/utils/quizUtils';

const Quiz = ({ quizId, attempt }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(attempt?.answers || {});
  const [timeState, setTimeState] = useState({ milliseconds: 0, formatted: "00:00", isExpired: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTabActive, setIsTabActive] = useState(true);

  const timerRef = useRef(null);
  const answersRef = useRef(attempt?.answers || {});
  const startedAtRef = useRef(attempt?.started_at);
  const durationRef = useRef(0);

  useEffect(() => {
    const init = async () => {
      const [{ data: q }, { data: qs }] = await Promise.all([
        supabase.from('quizzes').select('*').eq('id', quizId).single(),
        supabase.from('questions').select('*').eq('quiz_id', quizId).order('created_at')
      ]);
      setQuiz(q);
      durationRef.current = q.duration_minutes;
      setQuestions(qs || []);
      
      const checkTime = () => {
        const tState = getTimeRemaining(startedAtRef.current, durationRef.current);
        setTimeState(tState);
        if (tState.isExpired) autoSubmit();
      };
      checkTime();
      timerRef.current = setInterval(checkTime, 1000);
    };
    init();

    const handleVis = () => {
      if (document.hidden) {
        setIsTabActive(false);
        supabase.from('cheating_logs').insert([{ user_id: user.id, quiz_id: quizId, attempt_id: attempt.id, event_type: 'tab_switch' }]);
      } else {
        setIsTabActive(true);
      }
    };
    const block = (e) => { e.preventDefault(); };
    document.addEventListener('visibilitychange', handleVis);
    window.addEventListener('blur', () => supabase.from('cheating_logs').insert([{ user_id: user.id, quiz_id: quizId, attempt_id: attempt.id, event_type: 'window_blur' }]));
    document.addEventListener('contextmenu', block);
    document.addEventListener('copy', block);
    document.body.classList.add('no-select');

    return () => {
      clearInterval(timerRef.current);
      document.removeEventListener('visibilitychange', handleVis);
      window.removeEventListener('blur', block);
      document.removeEventListener('contextmenu', block);
      document.removeEventListener('copy', block);
      document.body.classList.remove('no-select');
    };
  }, [quizId]);

  const saveProgress = async (newAnswers) => {
    await supabase.from('quiz_attempts').update({ answers: newAnswers }).eq('id', attempt.id);
  };

  const handleQCMSelect = (idx) => {
    if (isSubmitting || timeState.isExpired) return;
    const newAns = { ...answers, [questions[currentIndex].id]: idx };
    setAnswers(newAns);
    answersRef.current = newAns;
    saveProgress(newAns);
  };

  const handleWrittenChange = (text) => {
    if (isSubmitting || timeState.isExpired) return;
    const newAns = { ...answers, [questions[currentIndex].id]: text };
    setAnswers(newAns);
    answersRef.current = newAns;
  };

  const saveWrittenOnBlur = () => {
    saveProgress(answersRef.current);
  };

  const finalizeQuiz = async () => {
    setIsSubmitting(true);
    const finalAns = answersRef.current;
    
    let qcm_earned = 0;
    const writtenResponses = [];

    const qcm_total = questions.filter(q => q.question_type !== 'written').length;
    const written_total = questions.filter(q => q.question_type === 'written').length;

    questions.forEach(q => {
      const val = finalAns[q.id];
      if (q.question_type === 'written') {
        writtenResponses.push({
          quiz_id: quizId,
          question_id: q.id,
          user_id: user.id,
          attempt_id: attempt.id,
          answer_text: val || '',
          grading_status: 'pending',
          score: 0
        });
      } else {
        if (val === q.correct_answer) qcm_earned++;
      }
    });

    const qcm_score = qcm_total > 0 ? (qcm_earned / qcm_total) * 100 : 0;
    let final_score = 0;
    if (qcm_total > 0 && written_total > 0) final_score = qcm_score / 2; // mixed, written is 0 initially
    else if (qcm_total > 0) final_score = qcm_score;

    await supabase.from('quiz_attempts').update({
      answers: finalAns,
      status: 'completed',
      completed_at: new Date().toISOString()
    }).eq('id', attempt.id);

    await supabase.from('quiz_results').insert({
      user_id: user.id,
      quiz_id: quizId,
      score: Math.round(final_score),
      correct_answers: qcm_earned,
      total_questions: questions.length
    });

    if (writtenResponses.length > 0) {
      await supabase.from('responses').insert(writtenResponses);
    }
  };

  const autoSubmit = async () => {
    if (isSubmitting) return;
    await finalizeQuiz();
    toast({ variant: "destructive", title: t('quiz.alert.timesUp'), description: t('quiz.alert.autoSubmit') });
    setTimeout(() => navigate('/dashboard'), 2000);
  };

  const manualSubmit = async () => {
    if (!window.confirm(t('quiz.alert.confirmSubmit'))) return;
    await finalizeQuiz();
    toast({ title: t('quiz.alert.submitted'), description: t('quiz.alert.submitted') });
    if (quiz.show_results) {
      navigate(`/quiz/${quizId}/results`);
    } else {
      navigate('/dashboard');
    }
  };

  if (!quiz || questions.length === 0) return <div className="text-center py-12 flex flex-col items-center"><RefreshCw className="w-10 h-10 animate-spin text-blue-600 mb-4" /> {t('quizPage.loading')}</div>;

  const q = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isCritical = timeState.milliseconds < 300000;

  return (
    <>
      <Helmet><title>{quiz.title}</title></Helmet>
      <AnimatePresence>
        {!isTabActive && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center text-white">
            <div className="text-center"><EyeOff className="w-20 h-20 mx-auto mb-6 text-red-500 animate-pulse" /><h2 className="text-3xl font-bold">{t('quiz.paused.title')}</h2><p>{t('quiz.paused.desc')}</p></div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-blue-50 py-6 px-4">
        <div className="max-w-4xl mx-auto relative">
          <Card className="mb-6 sticky top-6 z-10 shadow-lg">
            <CardContent className="p-4 flex justify-between items-center">
              <h1 className="text-xl font-bold text-gray-900 truncate max-w-[50%]">{quiz.title}</h1>
              <div className={`flex items-center px-4 py-2 rounded-full border-2 font-bold text-xl ${isCritical ? 'bg-red-100 text-red-600 border-red-200 animate-pulse' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                <Clock className="w-5 h-5 mr-2"/> {timeState.formatted}
              </div>
            </CardContent>
            <Progress value={progress} className="h-2 rounded-none" />
          </Card>

          <Card className={`shadow-xl border-t-4 ${q.question_type === 'written' ? 'border-purple-600' : 'border-blue-600'}`}>
            <CardHeader className="bg-gray-50/50 pb-4 border-b">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('quiz.header.question', { current: currentIndex + 1, total: questions.length })}</span>
                {q.question_type === 'written' && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">{t('quiz.header.writtenBadge')}</span>
                )}
              </div>
              <CardTitle className="text-2xl font-medium leading-relaxed text-gray-900">{q.question_text}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              
              {q.question_type === 'written' ? (
                <div className="space-y-4">
                  <Textarea 
                    placeholder={t('quiz.input.placeholder')} 
                    value={answers[q.id] || ''} 
                    onChange={e => handleWrittenChange(e.target.value)}
                    onBlur={saveWrittenOnBlur}
                    className="min-h-[200px] text-base p-4 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500 flex items-center"><Save className="w-3 h-3 mr-1" /> {t('quiz.input.saving')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {['a', 'b', 'c', 'd'].map((opt, i) => (
                    <button 
                      key={opt} 
                      disabled={isSubmitting} 
                      onClick={() => handleQCMSelect(i)} 
                      className={`w-full p-4 text-left rounded-lg border-2 transition-all ${answers[q.id] === i ? 'border-blue-600 bg-blue-50 shadow-md ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
                    >
                      <span className={`font-bold mr-4 inline-flex items-center justify-center w-8 h-8 rounded-full ${answers[q.id] === i ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                        {opt.toUpperCase()}
                      </span> 
                      <span className="text-gray-800 text-lg">{q[`option_${opt}`]}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex justify-between mt-10 pt-6 border-t border-gray-100">
                <Button onClick={() => setCurrentIndex(c => c - 1)} disabled={currentIndex === 0 || isSubmitting} variant="outline" className="w-32">
                  <ArrowLeft className="w-4 h-4 mr-2" /> {t('quiz.btn.prev')}
                </Button>
                {currentIndex === questions.length - 1 ? (
                  <Button onClick={manualSubmit} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white w-48 font-bold text-lg">
                    {isSubmitting ? <RefreshCw className="animate-spin w-5 h-5 mr-2"/> : t('quiz.btn.submit')}
                  </Button>
                ) : (
                  <Button onClick={() => setCurrentIndex(c => c + 1)} className="bg-blue-600 hover:bg-blue-700 text-white w-32">
                    {t('quiz.btn.next')} <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Quiz;