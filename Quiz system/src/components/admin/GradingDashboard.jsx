import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { isSuperAdmin } from '@/utils/authUtils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, PenTool, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const GradingDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const isSuper = isSuperAdmin(user);

  useEffect(() => {
    loadGradingData();
  }, []);

  const loadGradingData = async () => {
    setLoading(true);
    try {
      // Get all quizzes that are written or mixed
      let qQuery = supabase.from('quizzes').select('id, title, quiz_type').in('quiz_type', ['written', 'both']);
      if (!isSuper) {
        qQuery = qQuery.eq('created_by', user.id);
      }
      const { data: qData, error: qError } = await qQuery;
      if (qError) throw qError;

      if (!qData || qData.length === 0) {
        setQuizzes([]);
        return;
      }

      // Fetch all responses for these quizzes
      const quizIds = qData.map(q => q.id);
      const { data: rData, error: rError } = await supabase
        .from('responses')
        .select('quiz_id, grading_status')
        .in('quiz_id', quizIds);

      if (rError) throw rError;

      // Group and count
      const result = qData.map(quiz => {
        const quizResponses = rData?.filter(r => r.quiz_id === quiz.id) || [];
        const total = quizResponses.length;
        const pending = quizResponses.filter(r => r.grading_status === 'pending').length;
        const graded = total - pending;
        const progress = total === 0 ? 0 : Math.round((graded / total) * 100);
        
        return {
          ...quiz,
          total_responses: total,
          pending_count: pending,
          graded_count: graded,
          progress
        };
      });

      setQuizzes(result.sort((a,b) => b.pending_count - a.pending_count));
    } catch (error) {
      console.error('Error loading grading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuizzes = quizzes.filter(q => q.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2">
        <div className="w-full">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center">
            <PenTool className="w-5 h-5 md:w-6 md:h-6 mr-2 text-purple-600" /> Centre de Correction
          </h2>
          <p className="text-sm md:text-base text-gray-500 mt-1">Gérez les corrections manuelles des réponses écrites.</p>
        </div>
      </div>

      <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm border">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input 
            placeholder="Rechercher un quiz..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            className="pl-9 w-full min-h-[44px]" 
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Clock className="w-8 h-8 animate-spin text-purple-600" /></div>
      ) : filteredQuizzes.length === 0 ? (
        <Card className="border-dashed border-2 bg-gray-50/50 mx-2 md:mx-0">
          <CardContent className="flex flex-col items-center justify-center py-12 md:py-16 text-center">
            <CheckCircle2 className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mb-3 md:mb-4" />
            <h3 className="text-base md:text-lg font-medium text-gray-900">Aucune correction en attente</h3>
            <p className="text-sm md:text-base text-gray-500 max-w-md mt-2">Vous n'avez aucun quiz nécessitant une correction manuelle, ou tous ont été entièrement corrigés.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredQuizzes.map(quiz => (
            <Card key={quiz.id} className="hover:shadow-md transition-shadow flex flex-col h-full">
              <CardContent className="p-4 md:p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0 pr-3 md:pr-4">
                    <h3 className="font-bold text-base md:text-lg text-gray-900 truncate" title={quiz.title}>{quiz.title}</h3>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] md:text-xs font-medium rounded-full ${quiz.quiz_type === 'both' ? 'bg-quiz-mixed' : 'bg-quiz-written'}`}>
                      {quiz.quiz_type === 'both' ? 'Quiz Mixte' : '100% Écrit'}
                    </span>
                  </div>
                  <div className={`flex flex-col items-end ${quiz.pending_count > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    <span className="text-2xl md:text-3xl font-black">{quiz.pending_count}</span>
                    <span className="text-[10px] md:text-xs uppercase font-bold tracking-wider">En attente</span>
                  </div>
                </div>

                <div className="space-y-2 mb-6 mt-auto">
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-gray-500">Progression globale</span>
                    <span className="font-medium">{quiz.progress}% ({quiz.graded_count}/{quiz.total_responses})</span>
                  </div>
                  <Progress value={quiz.progress} className="h-2" />
                </div>

                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white min-h-[44px]" 
                  disabled={quiz.total_responses === 0}
                  onClick={() => navigate(`/admin/grading/${quiz.id}`)}
                >
                  <PenTool className="w-4 h-4 mr-2" /> 
                  <span className="truncate">{quiz.pending_count > 0 ? 'Corriger les copies' : 'Voir les corrections'}</span>
                  <ArrowRight className="w-4 h-4 ml-auto flex-shrink-0" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default GradingDashboard;