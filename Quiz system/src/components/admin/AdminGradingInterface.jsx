import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, CheckCircle, Save, Clock, User, Filter, Percent, Search, Edit3, ClipboardList } from 'lucide-react';

const AdminGradingInterface = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState([]);
  const [responses, setResponses] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [quizResults, setQuizResults] = useState([]);
  
  // Dashboard Filters
  const [dashboardSearch, setDashboardSearch] = useState('');

  // Grading Detail Filters & State
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchCandidate, setSearchCandidate] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ score: 0, admin_comments: '' });

  useEffect(() => {
    if (quizId) {
      loadGradingDetail();
    } else {
      loadDashboard();
    }
  }, [quizId]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [quizzesRes, responsesRes] = await Promise.all([
        supabase.from('quizzes').select('id, title, quiz_type').order('created_at', { ascending: false }),
        supabase.from('responses').select('id, quiz_id, grading_status')
      ]);

      const allQuizzes = quizzesRes.data || [];
      const allResponses = responsesRes.data || [];

      // Calculate stats per quiz
      const quizzesWithStats = allQuizzes.map(q => {
        const quizResp = allResponses.filter(r => r.quiz_id === q.id);
        const total = quizResp.length;
        const graded = quizResp.filter(r => r.grading_status === 'graded').length;
        const pending = total - graded;
        const progress = total > 0 ? Math.round((graded / total) * 100) : 0;

        return {
          ...q,
          totalCorrections: total,
          gradedCorrections: graded,
          pendingCorrections: pending,
          progress
        };
      });

      setQuizzes(quizzesWithStats);
    } catch (error) {
      toast({ variant: 'destructive', title: t('error'), description: 'Failed to load dashboard data.' });
    } finally {
      setLoading(false);
    }
  };

  const loadGradingDetail = async () => {
    setLoading(true);
    try {
      const [{ data: qData }, { data: rData }, { data: qsData }, { data: resData }] = await Promise.all([
        supabase.from('quizzes').select('*').eq('id', quizId).single(),
        supabase.from('responses').select('*, users(full_name, email), questions(question_text, question_type)').eq('quiz_id', quizId).order('created_at', { ascending: false }),
        supabase.from('questions').select('id, question_type').eq('quiz_id', quizId),
        supabase.from('quiz_results').select('*').eq('quiz_id', quizId)
      ]);
      setQuizzes([qData]);
      setResponses(rData || []);
      setQuestions(qsData || []);
      setQuizResults(resData || []);
    } catch (error) {
      toast({ variant: 'destructive', title: t('error'), description: 'Failed to load grading details.' });
    } finally {
      setLoading(false);
    }
  };

  const candidateStats = useMemo(() => {
    if (!quizId) return {};
    const stats = {};
    const qcm_total = questions.filter(q => q.question_type !== 'written').length;
    const written_total = questions.filter(q => q.question_type === 'written').length;
    
    quizResults.forEach(qr => {
      const userResp = responses.filter(r => r.user_id === qr.user_id);
      const qcm_earned = qr.correct_answers || 0;
      const written_earned = userResp.reduce((sum, r) => sum + (r.score || 0), 0);
      
      const qcm_score = qcm_total > 0 ? (qcm_earned / qcm_total) * 100 : 0;
      const written_score = written_total > 0 ? (written_earned / (written_total * 10)) * 100 : 0;
      
      let final_score = 0;
      if (qcm_total > 0 && written_total > 0) final_score = (qcm_score + written_score) / 2;
      else if (written_total > 0) final_score = written_score;
      else final_score = qcm_score;

      const allGraded = userResp.every(r => r.grading_status === 'graded') && userResp.length === written_total;

      stats[qr.user_id] = {
        qcm_score: Math.round(qcm_score),
        written_score: Math.round(written_score),
        final_score: Math.round(final_score),
        allGraded
      };
    });
    return stats;
  }, [quizResults, responses, questions, quizId]);

  const handleSaveGrading = async (id, attemptId, userId) => {
    try {
      const parsedScore = parseInt(editForm.score) || 0;
      
      await supabase.from('responses').update({
        score: parsedScore,
        admin_comments: editForm.admin_comments,
        grading_status: 'graded'
      }).eq('id', id);

      const { data: allResp } = await supabase.from('responses').select('score, grading_status').eq('attempt_id', attemptId);
      const allGraded = allResp.every(r => r.grading_status === 'graded');
      
      if (allGraded) {
        const { data: qr } = await supabase.from('quiz_results').select('*').eq('quiz_id', quizId).eq('user_id', userId).single();
        if (qr) {
          const qcm_total = questions.filter(q => q.question_type !== 'written').length;
          const written_total = questions.filter(q => q.question_type === 'written').length;
          const qcm_earned = qr.correct_answers || 0;
          const written_earned = allResp.reduce((sum, r) => sum + (r.score || 0), 0);
          
          const qcm_score = qcm_total > 0 ? (qcm_earned / qcm_total) * 100 : 0;
          const written_score = written_total > 0 ? (written_earned / (written_total * 10)) * 100 : 0;
          
          let final_score = 0;
          if (qcm_total > 0 && written_total > 0) final_score = (qcm_score + written_score) / 2;
          else if (written_total > 0) final_score = written_score;
          else final_score = qcm_score;

          await supabase.from('quiz_results').update({ score: Math.round(final_score) }).eq('id', qr.id);
        }
      }

      toast({ title: t('success'), description: 'Correction saved.' });
      setEditingId(null);
      loadGradingDetail(); 
    } catch (error) {
      toast({ variant: 'destructive', title: t('error'), description: "Could not save correction." });
    }
  };

  // Render Dashboard View
  if (!quizId) {
    const filteredQuizzes = quizzes.filter(q => 
      q.title?.toLowerCase().includes(dashboardSearch.toLowerCase()) && q.totalCorrections > 0
    );

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
              <ClipboardList className="w-6 h-6 mr-2 text-purple-600" />
              {t('admin.correction.title')}
            </h2>
            <p className="text-gray-500 mt-1">{t('admin.correction.desc')}</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input 
              placeholder={t('admin.correction.search')} 
              value={dashboardSearch} 
              onChange={e => setDashboardSearch(e.target.value)} 
              className="pl-9 w-full min-h-[44px]"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><Clock className="w-8 h-8 animate-spin text-purple-600 mx-auto" /></div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No quizzes require manual correction at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredQuizzes.map(quiz => (
              <Card key={quiz.id} className="flex flex-col hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 border-b border-gray-100">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold uppercase tracking-wider">
                      {quiz.quiz_type === 'written' ? t('quiz.type.written') : t('quiz.type.both')}
                    </span>
                    {quiz.pendingCorrections > 0 && (
                      <span className="px-2.5 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-bold flex items-center whitespace-nowrap">
                        <Clock className="w-3 h-3 mr-1" /> {quiz.pendingCorrections} {t('admin.correction.pending')}
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-lg text-gray-900 leading-snug line-clamp-2" title={quiz.title}>
                    {quiz.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-4 flex-1">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">
                      {t('admin.correction.globalProgress', { 
                        progress: quiz.progress, 
                        graded: quiz.gradedCorrections, 
                        total: quiz.totalCorrections 
                      })}
                    </p>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${quiz.progress === 100 ? 'bg-green-500' : 'bg-purple-500'}`}
                        style={{ width: `${quiz.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 pb-4 px-4">
                  <Button 
                    onClick={() => navigate(`/admin/grading/${quiz.id}`)} 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {t('admin.correction.viewCorrections')} <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Render Detail View
  const quizInfo = quizzes[0];
  const filteredResponses = responses.filter(r => {
    const matchStatus = statusFilter === 'all' || r.grading_status === statusFilter;
    const matchName = (r.users?.full_name || '').toLowerCase().includes(searchCandidate.toLowerCase());
    return matchStatus && matchName;
  });

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center mb-4 md:mb-6 gap-4">
        <Button variant="outline" onClick={() => navigate('/admin/grading')} className="w-full md:w-auto min-h-[44px]">
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour
        </Button>
        <div className="w-full">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 line-clamp-2">{t('admin.correction.title')}</h2>
          <p className="text-sm md:text-base text-gray-500 truncate">{quizInfo?.title}</p>
        </div>
      </div>

      <Card className="bg-white shadow-sm border">
        <CardContent className="p-3 md:p-4 flex flex-col md:flex-row gap-3 md:gap-4">
          <div className="relative flex-1 w-full">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input placeholder="Rechercher par candidat..." value={searchCandidate} onChange={e => setSearchCandidate(e.target.value)} className="pl-9 w-full min-h-[44px]" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[200px] min-h-[44px]"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">{t('admin.correction.pending')}</SelectItem>
              <SelectItem value="graded">Corrigé</SelectItem>
              <SelectItem value="all">Tout afficher</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? <div className="text-center py-12"><Clock className="w-8 h-8 animate-spin text-purple-600 mx-auto" /></div> : (
        <div className="space-y-4 md:space-y-6">
          {filteredResponses.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border-dashed border-2">
              <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Aucune copie trouvée pour ces critères.</p>
            </div>
          ) : (
            filteredResponses.map((r) => {
              const cStats = candidateStats[r.user_id] || { qcm_score: 0, written_score: 0, final_score: 0, allGraded: false };
              return (
                <Card key={r.id} className={`border-l-4 shadow-sm transition-all ${r.grading_status === 'graded' ? 'border-l-green-500 bg-gray-50' : 'border-l-orange-400 bg-white'}`}>
                  <CardHeader className="py-3 md:py-4 border-b">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                      <div className="flex-1 w-full min-w-0 pr-0 md:pr-4">
                        <h3 className="font-bold text-base md:text-lg flex items-center text-gray-900 truncate">
                          <User className="w-4 h-4 md:w-5 md:h-5 mr-2 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{r.users?.full_name || r.users?.email}</span>
                        </h3>
                        <p className="text-xs md:text-sm text-gray-500 mt-1 font-medium break-words">Q: {r.questions?.question_text}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {r.grading_status === 'graded' ? (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold flex items-center flex-shrink-0"><CheckCircle className="w-3 h-3 mr-1" /> Corrigé ({r.score}/10)</span>
                        ) : (
                          <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-bold flex items-center flex-shrink-0"><Clock className="w-3 h-3 mr-1" /> {t('admin.correction.pending')}</span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Réponse du candidat</p>
                        <div className="p-3 md:p-4 bg-gray-100 rounded-lg border text-gray-800 whitespace-pre-wrap font-medium text-sm md:text-base">
                          {r.answer_text || <span className="italic text-gray-400">Aucune réponse fournie.</span>}
                        </div>
                      </div>
                      
                      <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100 flex flex-col justify-center">
                        <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-3 flex items-center"><Percent className="w-3 h-3 mr-1" /> {t('admin.grading.realTimeStats')}</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center"><span className="text-gray-600">{t('admin.grading.qcmScore')}:</span><span className="font-semibold text-gray-900">{cStats.qcm_score}%</span></div>
                          <div className="flex justify-between items-center"><span className="text-gray-600">{t('admin.grading.writtenScore')}:</span><span className="font-semibold text-gray-900">{cStats.written_score}%</span></div>
                          <div className="h-px bg-blue-200 my-1"></div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-900 font-bold">{t('admin.grading.finalScore')}:</span>
                            <span className={`font-black ${cStats.allGraded ? 'text-green-600' : 'text-orange-500'}`}>{cStats.final_score}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {editingId === r.id ? (
                      <div className="mt-4 bg-purple-50 p-3 md:p-4 rounded-lg border border-purple-200 space-y-4">
                        <div>
                          <label className="text-xs md:text-sm font-bold text-purple-900 block mb-1">Points attribués (sur 10)</label>
                          <Input type="number" min="0" max="10" className="w-full md:w-32 bg-white" value={editForm.score} onChange={e => setEditForm({...editForm, score: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-xs md:text-sm font-bold text-purple-900 block mb-1">Commentaire (Optionnel)</label>
                          <Textarea className="w-full bg-white" rows={3} placeholder="Feedback pour le candidat..." value={editForm.admin_comments} onChange={e => setEditForm({...editForm, admin_comments: e.target.value})} />
                        </div>
                        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                          <Button variant="outline" onClick={() => setEditingId(null)} className="w-full sm:w-auto min-h-[44px] bg-white">Annuler</Button>
                          <Button onClick={() => handleSaveGrading(r.id, r.attempt_id, r.user_id)} className="w-full sm:w-auto min-h-[44px] bg-purple-600 hover:bg-purple-700 text-white"><Save className="w-4 h-4 mr-2" /> Enregistrer</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-4">
                        {r.grading_status === 'graded' && r.admin_comments && (
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Votre commentaire</p>
                            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border break-words">{r.admin_comments}</p>
                          </div>
                        )}
                        <Button onClick={() => { setEditingId(r.id); setEditForm({ score: r.score || 0, admin_comments: r.admin_comments || '' }); }} variant="outline" className={`w-full sm:w-auto min-h-[44px] ${r.grading_status==='graded' ? '' : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'}`}>
                          <Edit3 className="w-4 h-4 mr-2" /> {r.grading_status === 'graded' ? 'Modifier la correction' : 'Corriger maintenant'}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default AdminGradingInterface;