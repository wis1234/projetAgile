import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, ArrowLeft, Printer, RefreshCw, MessageSquare, AlertCircle, Clock } from 'lucide-react';
import { isAdminUser } from '@/utils/authUtils';

const ResultsPage = () => {
  const { quizId } = useParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({ quiz: null, result: null, attempt: null, questions: [], responses: [] });

  useEffect(() => {
    if (user && quizId) loadResults();
  }, [user, quizId]);

  const loadResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const [quizRes, resultRes, attemptRes, questionsRes, responsesRes] = await Promise.all([
        supabase.from('quizzes').select('*').eq('id', quizId).single(),
        supabase.from('quiz_results').select('*').eq('quiz_id', quizId).eq('user_id', user.id).order('completed_at', { ascending: false }).limit(1).single(),
        supabase.from('quiz_attempts').select('*').eq('quiz_id', quizId).eq('user_id', user.id).order('completed_at', { ascending: false }).limit(1).single(),
        supabase.from('questions').select('*').eq('quiz_id', quizId).order('created_at'),
        supabase.from('responses').select('*').eq('quiz_id', quizId).eq('user_id', user.id)
      ]);

      if (quizRes.error) throw quizRes.error;
      
      if (!quizRes.data.show_results && !isAdminUser(user)) {
        throw new Error(t('results.error.noAccess'));
      }
      
      if (!resultRes.data || !attemptRes.data) {
        throw new Error(t('results.error.noResults'));
      }

      setData({
        quiz: quizRes.data,
        result: resultRes.data,
        attempt: attemptRes.data,
        questions: questionsRes.data || [],
        responses: responsesRes.data || []
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center bg-slate-50"><RefreshCw className="w-12 h-12 text-blue-600 animate-spin" /></div>;
  if (error) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <Card className="max-w-md w-full text-center p-8 border-slate-200 shadow-lg">
        <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('quizPage.error.title')}</h2>
        <p className="text-slate-600 mb-6">{error}</p>
        <Button onClick={() => navigate('/dashboard')} className="bg-blue-600 hover:bg-blue-700 text-white"><ArrowLeft className="w-4 h-4 mr-2" /> {t('quizPage.returnBtn')}</Button>
      </Card>
    </div>
  );

  const { quiz, result, attempt, questions, responses } = data;
  const pendingCount = responses.filter(r => r.grading_status === 'pending').length;

  const qcm_total = questions.filter(q => q.question_type !== 'written').length;
  const written_total = questions.filter(q => q.question_type === 'written').length;
  const qcm_earned = result.correct_answers || 0;
  const written_earned = responses.reduce((sum, r) => sum + (r.score || 0), 0);
  
  const qcm_score = qcm_total > 0 ? Math.round((qcm_earned / qcm_total) * 100) : 0;
  const written_score = written_total > 0 ? Math.round((written_earned / (written_total * 10)) * 100) : 0;
  const isPassed = result.score >= 50;

  return (
    <>
      <Helmet><title>{t('results.title', { title: quiz.title })}</title></Helmet>
      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6 no-print">
            <Button variant="outline" onClick={() => navigate('/dashboard')} className="border-slate-200 text-slate-700 hover:bg-slate-100"><ArrowLeft className="w-4 h-4 mr-2" /> {t('results.btn.back')}</Button>
            <Button variant="outline" onClick={() => window.print()} className="border-slate-200 text-slate-700 hover:bg-slate-100"><Printer className="w-4 h-4 mr-2" /> {t('results.btn.print')}</Button>
          </div>

          <Card className={`mb-8 border-t-8 print-card shadow-md border-x-0 border-b-0 rounded-t-none rounded-b-lg ${isPassed ? 'border-t-green-500' : 'border-t-red-500'}`}>
            <CardContent className="p-8 text-center">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('results.title', { title: quiz.title })}</h1>
              <p className="text-slate-500 mb-6">{t('results.candidate', { name: user.user_metadata?.full_name || user.email })}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {qcm_total > 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('results.breakdown.qcm')}</p>
                    <div className="text-3xl font-bold text-gray-800">{qcm_score}%</div>
                  </div>
                )}
                {written_total > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 shadow-sm">
                    <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">{t('results.breakdown.written')}</p>
                    <div className="text-3xl font-bold text-purple-800">{written_score}%</div>
                  </div>
                )}
                <div className={`border rounded-xl p-4 shadow-sm ${isPassed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} md:col-start-auto ${qcm_total > 0 && written_total > 0 ? '' : 'md:col-span-2'}`}>
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isPassed ? 'text-green-700' : 'text-red-700'}`}>{t('results.breakdown.final')}</p>
                  <div className={`text-4xl font-black ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                    {result.score}%
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-500 font-medium">
                {qcm_total > 0 && written_total > 0 
                  ? t('results.explanation.mixed', { qcm: qcm_score, written: written_score })
                  : qcm_total > 0 
                    ? t('results.explanation.qcm')
                    : t('results.explanation.written')}
              </p>

              <div className="mt-4">
                <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider ${isPassed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {isPassed ? t('results.status.passed') : t('results.status.failed')}
                </span>
              </div>

              {pendingCount > 0 && (
                <div className="mt-6 p-4 bg-orange-50 border border-orange-200 text-orange-800 rounded-lg inline-flex items-center text-left">
                  <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                  <span>{t('results.partialScore', { count: pendingCount })}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 ml-2">{t('results.detailTitle')}</h2>
            
            {questions.map((q, index) => {
              if (q.question_type === 'written') {
                const response = responses.find(r => r.question_id === q.id);
                const isPending = !response || response.grading_status === 'pending';
                
                return (
                  <Card key={q.id} className="print-card border-l-4 border-l-purple-500 shadow-sm border-y-0 border-r-0 rounded-l-none">
                    <CardHeader className="bg-slate-50/50 pb-3 border-b border-slate-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-slate-600 text-sm tracking-wide uppercase">{t('results.qTitle', { num: index + 1 })}</span>
                        {isPending ? (
                          <span className="text-orange-600 font-medium text-sm flex items-center bg-orange-50 px-2 py-1 rounded-md border border-orange-100"><Clock className="w-4 h-4 mr-1"/> {t('results.status.pending')}</span>
                        ) : (
                          <span className="text-green-600 font-bold text-sm bg-green-50 px-2 py-1 rounded-md border border-green-100">{t('results.status.score', { score: response.score })}/10 pts</span>
                        )}
                      </div>
                      <CardTitle className="text-lg text-slate-800 leading-relaxed">{q.question_text}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-500 mb-2">{t('results.yourAnswer')}</p>
                        <div className="p-4 bg-slate-50 rounded-lg whitespace-pre-wrap text-slate-800 font-medium border border-slate-200 shadow-inner">
                          {response?.answer_text || <span className="italic text-slate-400">{t('results.noAnswer')}</span>}
                        </div>
                      </div>
                      
                      {response?.admin_comments && (
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                          <p className="text-sm font-semibold text-purple-800 mb-2 flex items-center"><MessageSquare className="w-4 h-4 mr-2"/> {t('results.adminComment')}</p>
                          <p className="text-purple-900 bg-white p-3 rounded border border-purple-100/50">{response.admin_comments}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              } else {
                const userAnswer = attempt.answers[q.id];
                const isCorrect = userAnswer === q.correct_answer;
                
                return (
                  <Card key={q.id} className={`print-card border-l-4 shadow-sm border-y-0 border-r-0 rounded-l-none ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                    <CardHeader className="bg-slate-50/50 pb-3 border-b border-slate-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-slate-600 text-sm tracking-wide uppercase">{t('results.qTitle', { num: index + 1 })}</span>
                        {isCorrect ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <XCircle className="w-6 h-6 text-red-500" />}
                      </div>
                      <CardTitle className="text-lg text-slate-800 leading-relaxed">{q.question_text}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        {['a', 'b', 'c', 'd'].map((opt, i) => {
                          const isSelected = userAnswer === i;
                          const isActualCorrect = q.correct_answer === i;
                          
                          let bgClass = "bg-white border-slate-200 text-slate-600";
                          if (isActualCorrect) bgClass = "bg-green-50 border-green-300 text-green-800 font-semibold shadow-sm";
                          else if (isSelected && !isActualCorrect) bgClass = "bg-red-50 border-red-300 text-red-800 shadow-sm";
                          
                          return (
                            <div key={opt} className={`p-3 rounded-lg border ${bgClass} flex items-center transition-all`}>
                              <span className="font-bold w-8 text-center bg-white/50 rounded mr-3 py-1 text-sm shadow-sm border border-black/5">{opt.toUpperCase()}</span>
                              <span className="flex-1">{q[`option_${opt}`]}</span>
                              {isSelected && <span className="text-xs uppercase tracking-wider ml-2 bg-white/80 px-2 py-1 rounded border shadow-sm font-semibold">{t('results.yourChoice')}</span>}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              }
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default ResultsPage;