import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { isAdminUser } from '@/utils/authUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, Award, Search, RefreshCw, Eye, PenTool } from 'lucide-react';
import Pagination from '@/components/ui/Pagination';

const PAGE_SIZE = 50;

const Rankings = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isAdmin = isAdminUser(user);

  const [rankings, setRankings] = useState([]);
  const [filteredRankings, setFilteredRankings] = useState([]);
  const [paginatedRankings, setPaginatedRankings] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterQuizId, setFilterQuizId] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let filtered = rankings;
    if (filterQuizId !== 'all') filtered = filtered.filter(r => r.quiz_id === filterQuizId);
    if (searchQuery) filtered = filtered.filter(r => r.users?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()));
    setFilteredRankings(filtered);
    setCurrentPage(1);
  }, [rankings, searchQuery, filterQuizId]);

  useEffect(() => {
    const from = (currentPage - 1) * PAGE_SIZE;
    setPaginatedRankings(filteredRankings.slice(from, from + PAGE_SIZE));
  }, [filteredRankings, currentPage]);

  const loadData = async () => {
    try {
      const [rRes, qRes] = await Promise.all([
        supabase.from('quiz_results').select('*, users(full_name), quizzes(title, quiz_type)').order('score', { ascending: false }).order('completed_at', { ascending: true }),
        supabase.from('quizzes').select('id, title, quiz_type')
      ]);
      if (rRes.data) {
        const unique = [];
        const seen = new Set();
        for (const item of rRes.data) {
          const key = `${item.user_id}-${item.quiz_id}`;
          if (!seen.has(key)) { seen.add(key); unique.push(item); }
        }
        setRankings(unique.sort((a,b)=>b.score-a.score));
      }
      if (qRes.data) setQuizzes(qRes.data);
    } catch (err) {} finally { setLoading(false); }
  };

  const getRankIcon = (index) => {
    const globalIndex = (currentPage - 1) * PAGE_SIZE + index;
    if (globalIndex === 0) return <Trophy className="w-8 h-8 text-yellow-500" />;
    if (globalIndex === 1) return <Medal className="w-8 h-8 text-gray-400" />;
    if (globalIndex === 2) return <Award className="w-8 h-8 text-amber-600" />;
    return <span className="text-2xl font-bold text-gray-400">#{globalIndex + 1}</span>;
  };

  const renderQuizTypeBadge = (type) => {
    switch(type) {
      case 'written': return <span className="px-2 py-0.5 ml-2 text-[10px] uppercase font-bold rounded-full bg-quiz-written">{t('quiz.type.written')}</span>;
      case 'both': return <span className="px-2 py-0.5 ml-2 text-[10px] uppercase font-bold rounded-full bg-quiz-mixed">{t('quiz.type.both')}</span>;
      default: return <span className="px-2 py-0.5 ml-2 text-[10px] uppercase font-bold rounded-full bg-quiz-qcm">{t('quiz.type.qcm')}</span>;
    }
  };

  return (
    <>
      <Helmet><title>{t('nav.rankings')} - {t('app.title')}</title></Helmet>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          
          <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder={t('globalRanking.search')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterQuizId} onValueChange={setFilterQuizId}>
              <SelectTrigger className="w-full md:w-64"><SelectValue placeholder={t('ranking.filter.quiz')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('ranking.filter.select')}</SelectItem>
                {quizzes.map(q => <SelectItem key={q.id} value={q.id}>{q.title}</SelectItem>)}
              </SelectContent>
            </Select>
            {isAdmin && (
              <Button onClick={() => navigate('/admin/grading')} className="bg-purple-600 text-white hover:bg-purple-700 whitespace-nowrap">
                <PenTool className="w-4 h-4 mr-2" /> {t('globalRanking.corrections')}
              </Button>
            )}
          </div>

          <Card className="shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-t-lg">
              <CardTitle className="text-3xl text-center flex items-center justify-center"><Trophy className="w-8 h-8 mr-3" /> {t('globalRanking.title')}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? <div className="text-center py-12"><RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto" /></div> : (
                <>
                  <div className="space-y-4 mb-6">
                    {paginatedRankings.map((r, index) => (
                      <div key={r.id} className={`flex flex-col sm:flex-row sm:items-center p-4 rounded-lg border-2 transition-all ${(currentPage === 1 && index < 3) ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200 hover:border-blue-300'}`}>
                        <div className="flex-shrink-0 w-16 flex justify-center mb-2 sm:mb-0">{getRankIcon(index)}</div>
                        <div className="flex-1 ml-0 sm:ml-4">
                          <h3 className="font-bold text-gray-900 text-lg">{r.users?.full_name || t('ranking.anon')}</h3>
                          <div className="flex items-center mt-1">
                            <p className="text-sm text-gray-500 font-medium">{r.quizzes?.title}</p>
                            {renderQuizTypeBadge(r.quizzes?.quiz_type)}
                          </div>
                        </div>
                        <div className="text-left sm:text-right mt-4 sm:mt-0 flex flex-row sm:flex-col items-center sm:items-end justify-between">
                          <p className="text-3xl font-black text-blue-600">{r.score} <span className="text-sm font-normal text-gray-500">pts</span></p>
                          <div className="flex gap-2 mt-2 sm:mt-1">
                            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => navigate(`/quiz/${r.quiz_id}/results`)}>
                              <Eye className="w-3 h-3 mr-1" /> {t('globalRanking.btn.details')}
                            </Button>
                            {isAdmin && (r.quizzes?.quiz_type === 'written' || r.quizzes?.quiz_type === 'both') && (
                              <Button variant="outline" size="sm" className="h-8 text-xs text-purple-600 border-purple-200 hover:bg-purple-50" onClick={() => navigate(`/admin/grading/${r.quiz_id}`)}>
                                <PenTool className="w-3 h-3 mr-1" /> {t('globalRanking.btn.grade')}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {paginatedRankings.length === 0 && <div className="text-center py-12 text-gray-500">{t('globalRanking.empty')}</div>}
                  </div>
                  <Pagination currentPage={currentPage} totalPages={Math.ceil(filteredRankings.length / PAGE_SIZE)} totalItems={filteredRankings.length} pageSize={PAGE_SIZE} onPageChange={setCurrentPage} />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Rankings;