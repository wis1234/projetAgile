import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Clock, Play, RotateCcw, Loader2, AlertCircle, FileText, Settings, Globe } from 'lucide-react';
import { checkAttemptsRemaining } from '@/utils/quizUtils';
import { isAdminUser } from '@/utils/authUtils';

const UserDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalAssigned: 0, completed: 0, averageScore: 0 });
  const [activeTab, setActiveTab] = useState("my-quizzes");
  
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [rankings, setRankings] = useState([]);
  const [rankingsLoading, setRankingsLoading] = useState(false);

  const isAdmin = isAdminUser(user);

  useEffect(() => {
    if (user?.id) loadData();
  }, [user?.id]);

  useEffect(() => {
    if (selectedQuizId) loadRankings(selectedQuizId);
  }, [selectedQuizId]);

  useEffect(() => {
    if (!isAdmin && (activeTab === 'settings' || activeTab === 'global-rankings')) {
      setActiveTab('my-quizzes');
    }
  }, [activeTab, isAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [assignRes, resultsRes, attemptsRes, responsesRes] = await Promise.all([
        supabase.from('user_assignments').select('quiz_id, quizzes(*)').eq('user_id', user.id),
        supabase.from('quiz_results').select('quiz_id, score, total_questions').eq('user_id', user.id),
        supabase.from('quiz_attempts').select('quiz_id, status').eq('user_id', user.id).eq('status', 'completed'),
        supabase.from('responses').select('quiz_id, grading_status').eq('user_id', user.id)
      ]);
      
      const activeQuizzes = assignRes.data?.map(a => a.quizzes).filter(q => q && q.is_active) || [];
      const allResults = resultsRes.data || [];
      const completedAttempts = attemptsRes.data || [];
      const userResponses = responsesRes.data || [];
      
      const quizzesWithDetails = await Promise.all(activeQuizzes.map(async q => {
        const { attemptsUsed, isExhausted } = await checkAttemptsRemaining(user.id, q.id, q.max_attempts);
        const isCompleted = completedAttempts.some(a => a.quiz_id === q.id);
        const hasPendingGrading = userResponses.some(r => r.quiz_id === q.id && r.grading_status === 'pending');
        const resultData = allResults.find(r => r.quiz_id === q.id);
        
        return { 
          ...q, 
          attemptsUsed, 
          isExhausted,
          isCompleted,
          hasPendingGrading,
          score: resultData?.score
        };
      }));

      const totalCompleted = allResults.length;
      let avgScore = 0;
      if (totalCompleted > 0) {
        const totalPercentage = allResults.reduce((acc, curr) => {
          return acc + (curr.score / curr.total_questions) * 100;
        }, 0);
        avgScore = Math.round(totalPercentage / totalCompleted);
      }

      setQuizzes(quizzesWithDetails);
      setStats({ 
        totalAssigned: quizzesWithDetails.length, 
        completed: totalCompleted,
        averageScore: avgScore
      });

      if (quizzesWithDetails.length > 0 && !selectedQuizId) {
        setSelectedQuizId(quizzesWithDetails[0].id);
      }

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally { 
      setLoading(false); 
    }
  };

  const loadRankings = async (quizId) => {
    setRankingsLoading(true);
    try {
      const { data, error } = await supabase
        .from('quiz_results')
        .select('*, users(full_name, email)')
        .eq('quiz_id', quizId)
        .order('score', { ascending: false });
        
      if (error) throw error;
      setRankings(data || []);
    } catch (err) {
      console.error('Error fetching rankings:', err);
    } finally {
      setRankingsLoading(false);
    }
  };

  return (
    <>
      <Helmet><title>{t('nav.dashboard')} - {t('app.title')}</title></Helmet>
      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{t('dashboard.welcome', { name: user?.user_metadata?.full_name || 'User' })}</h1>
              <p className="text-slate-600 mt-1">{t('dashboard.ready')}</p>
            </div>
            {isAdmin && (
              <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold border border-blue-200">
                {t('dashboard.adminMode')}
              </div>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-8 w-full justify-start overflow-x-auto bg-white border border-slate-200 p-1">
              <TabsTrigger value="my-quizzes" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <FileText className="w-4 h-4 mr-2" /> {t('dashboard.tabs.myQuizzes')}
              </TabsTrigger>
              <TabsTrigger value="rankings" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Trophy className="w-4 h-4 mr-2" /> {t('dashboard.tabs.rankings')}
              </TabsTrigger>
              
              {isAdmin && (
                <>
                  <TabsTrigger value="global-rankings" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <Globe className="w-4 h-4 mr-2" /> {t('dashboard.tabs.globalRankings')}
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <Settings className="w-4 h-4 mr-2" /> {t('dashboard.tabs.settings')}
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="my-quizzes" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="border-l-4 border-blue-600 shadow-sm">
                  <CardContent className="p-6">
                    <p className="text-sm font-medium text-slate-500">{t('dashboard.stats.assigned')}</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.totalAssigned}</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-green-600 shadow-sm">
                  <CardContent className="p-6">
                    <p className="text-sm font-medium text-slate-500">{t('dashboard.stats.completed')}</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.completed}</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-purple-600 shadow-sm">
                  <CardContent className="p-6">
                    <p className="text-sm font-medium text-slate-500">{t('dashboard.stats.avgScore')}</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.averageScore}%</p>
                  </CardContent>
                </Card>
              </div>

              {!isAdmin && (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm flex items-center mb-6">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                  {t('dashboard.notice.assignedOnly')}
                </div>
              )}

              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {quizzes.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-lg shadow-sm border-dashed border-2">
                      {t('dashboard.empty.quizzes')}
                    </div>
                  ) : quizzes.map((q) => (
                    <Card key={q.id} className="hover:shadow-lg transition-shadow relative overflow-hidden flex flex-col bg-white">
                      <CardHeader className="pb-2 border-b bg-slate-50/50">
                        <div className="flex justify-between items-start mb-2">
                          <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-full ${q.quiz_type === 'written' ? 'bg-quiz-written' : q.quiz_type === 'both' ? 'bg-quiz-mixed' : 'bg-quiz-qcm'}`}>
                            {q.quiz_type === 'written' ? t('quiz.type.written') : q.quiz_type === 'both' ? t('quiz.type.both') : t('quiz.type.qcm')}
                          </span>
                          {q.isCompleted && (
                            <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">{t('quiz.status.completed')}</span>
                          )}
                        </div>
                        <CardTitle className="text-xl text-slate-900 truncate" title={q.title}>{q.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 flex-1 flex flex-col">
                        <div className="flex gap-4 mb-4 text-sm text-slate-600">
                          <div className="flex items-center font-medium"><Clock className="w-4 h-4 mr-1 text-slate-400"/> {t('quiz.info.duration', { min: q.duration_minutes })}</div>
                          <div className="flex items-center font-medium"><RotateCcw className="w-4 h-4 mr-1 text-slate-400"/> {t('quiz.info.attempts', { used: q.attemptsUsed, max: q.max_attempts })}</div>
                        </div>
                        
                        {q.isCompleted && q.hasPendingGrading && (
                          <div className="mb-4 p-2 bg-orange-50 border border-orange-100 rounded text-xs text-orange-700 flex items-center font-medium">
                            <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" /> {t('quiz.info.pending')}
                          </div>
                        )}

                        {q.isCompleted && !q.hasPendingGrading && q.score !== undefined && (
                          <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded text-center">
                            <span className="text-xs text-blue-600 font-bold uppercase tracking-wider block mb-1">{t('quiz.info.score')}</span>
                            <span className="text-2xl font-black text-blue-700">{t('quiz.info.pts', { score: q.score })}</span>
                          </div>
                        )}

                        <div className="mt-auto space-y-2 pt-2">
                          {!q.isCompleted || !q.isExhausted ? (
                            <Button onClick={() => navigate(`/quiz/${q.id}`)} className="w-full bg-blue-600 text-white hover:bg-blue-700">
                              <Play className="w-4 h-4 mr-2" /> {t('quiz.action.start')}
                            </Button>
                          ) : (
                            <Button disabled className="w-full bg-slate-100 text-slate-500">{t('quiz.action.maxAttempts')}</Button>
                          )}

                          {q.isCompleted && q.show_results && (
                            <Button variant="outline" onClick={() => navigate(`/quiz/${q.id}/results`)} className="w-full text-blue-700 border-blue-200 hover:bg-blue-50">
                              <FileText className="w-4 h-4 mr-2" /> {t('quiz.action.results')}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="rankings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('ranking.title')}</CardTitle>
                  <CardDescription>{t('ranking.desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 max-w-sm">
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('ranking.filter.quiz')}</label>
                    <Select value={selectedQuizId} onValueChange={setSelectedQuizId}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('ranking.filter.select')} />
                      </SelectTrigger>
                      <SelectContent>
                        {quizzes.map(q => (
                          <SelectItem key={q.id} value={q.id}>{q.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {rankingsLoading ? (
                    <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" /></div>
                  ) : rankings.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed">
                      {t('ranking.empty')}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-4 rounded-tl-lg">{t('ranking.table.pos')}</th>
                            <th className="py-3 px-4">{t('ranking.table.candidate')}</th>
                            <th className="py-3 px-4">{t('ranking.table.score')}</th>
                            <th className="py-3 px-4 rounded-tr-lg">{t('ranking.table.date')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {rankings.map((r, idx) => {
                            const isCurrentUser = r.user_id === user.id;
                            return (
                              <tr key={r.id} className={isCurrentUser ? 'bg-blue-50/50' : 'hover:bg-slate-50'}>
                                <td className="py-3 px-4 font-bold text-slate-700">
                                  {idx === 0 ? <span className="text-yellow-500 flex items-center"><Trophy className="w-4 h-4 mr-1"/> {t('ranking.pos.first')}</span> : 
                                   idx === 1 ? <span className="text-slate-400 flex items-center"><Trophy className="w-4 h-4 mr-1"/> {t('ranking.pos.second')}</span> :
                                   idx === 2 ? <span className="text-amber-600 flex items-center"><Trophy className="w-4 h-4 mr-1"/> {t('ranking.pos.third')}</span> :
                                   t('ranking.pos.nth', { n: idx + 1 })}
                                </td>
                                <td className="py-3 px-4 font-medium text-slate-900">
                                  {r.users?.full_name || r.users?.email || t('ranking.anon')}
                                  {isCurrentUser && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{t('ranking.you')}</span>}
                                </td>
                                <td className="py-3 px-4 font-bold text-blue-600">{t('quiz.info.pts', { score: r.score })}</td>
                                <td className="py-3 px-4 text-slate-500">{new Date(r.completed_at).toLocaleDateString()}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {isAdmin && (
              <>
                <TabsContent value="global-rankings" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('dashboard.tabs.globalRankings')}</CardTitle>
                      <CardDescription>{t('dashboard.admin.globalRank.desc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="py-12 text-center">
                      <Button onClick={() => navigate('/rankings')} className="bg-blue-600 text-white">
                        <Globe className="w-4 h-4 mr-2" /> {t('dashboard.admin.globalRank.btn')}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="settings" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('dashboard.tabs.settings')}</CardTitle>
                      <CardDescription>{t('dashboard.admin.settings.desc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="py-12 text-center">
                      <Button onClick={() => navigate('/admin/dashboard')} className="bg-blue-600 text-white">
                        <Settings className="w-4 h-4 mr-2" /> {t('dashboard.admin.settings.btn')}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default UserDashboard;