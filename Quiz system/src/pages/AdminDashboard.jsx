import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { isAdminUser } from '@/utils/authUtils';
import { Card, CardContent } from '@/components/ui/card';
import { Users, FileQuestion, Trophy, Activity, AlertTriangle, ShieldCheck, PenTool } from 'lucide-react';
import CandidatesManagement from '@/components/admin/CandidatesManagement';
import QuestionsManagement from '@/components/admin/QuestionsManagement';
import QuizSettings from '@/components/admin/QuizSettings';
import LiveRankings from '@/components/admin/LiveRankings';
import CheatingLogs from '@/components/admin/CheatingLogs';
import AdminManagement from '@/components/admin/AdminManagement';
import GradingDashboard from '@/components/admin/GradingDashboard';
import AdminGradingInterface from '@/components/admin/AdminGradingInterface';

const AdminDashboard = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin' || user?.user_metadata?.role === 'super_admin';

  const [stats, setStats] = useState({
    candidates: 0,
    questions: 0,
    activeQuizzes: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [candidatesRes, questionsRes, quizzesRes] = await Promise.all([
          supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'user'),
          supabase.from('questions').select('*', { count: 'exact', head: true }),
          supabase.from('quizzes').select('*', { count: 'exact', head: true }).eq('is_active', true)
        ]);

        setStats({
          candidates: candidatesRes.count || 0,
          questions: questionsRes.count || 0,
          activeQuizzes: quizzesRes.count || 0
        });
      } catch (err) {
        console.error('Error fetching admin stats:', err);
      }
    };
    
    fetchStats();
  }, []);

  const navItems = [
    { path: '/admin/candidates', label: t('admin.dashboard.candidates'), count: stats.candidates, icon: Users },
    { path: '/admin/quiz-settings', label: t('admin.dashboard.quizzes'), count: null, icon: Trophy },
    { path: '/admin/questions', label: t('admin.dashboard.questions'), count: stats.questions, icon: FileQuestion },
    { path: '/admin/grading', label: t('admin.dashboard.grading'), count: null, icon: PenTool },
    { path: '/admin/live-rankings', label: t('admin.dashboard.rankings'), count: null, icon: Activity },
    { path: '/admin/cheat-logs', label: t('admin.dashboard.logs'), count: null, icon: AlertTriangle },
    ...(isSuperAdmin ? [{ path: '/admin/management', label: t('admin.dashboard.management'), count: null, icon: ShieldCheck }] : [])
  ];

  return (
    <>
      <Helmet><title>{t('admin.dashboard.title')} - QUIZY</title></Helmet>
      <div className="flex-1 bg-gray-50 flex flex-col w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow">
          
          <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('admin.stats.title')}</h1>
              <p className="text-gray-600 mt-1">{t('admin.stats.description')}</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full md:w-auto">
              <Card className="bg-white border-l-4 border-blue-500 shadow-sm w-full">
                <CardContent className="p-4 sm:p-5 flex items-center space-x-4">
                  <div className="p-3 bg-blue-50 rounded-full text-blue-600 flex-shrink-0">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="stat-label truncate">{t('admin.stats.totalCandidates')}</p>
                    <p className="stat-number truncate">{stats.candidates}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white border-l-4 border-green-500 shadow-sm w-full">
                <CardContent className="p-4 sm:p-5 flex items-center space-x-4">
                  <div className="p-3 bg-green-50 rounded-full text-green-600 flex-shrink-0">
                    <FileQuestion className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="stat-label truncate">{t('admin.stats.totalQuestions')}</p>
                    <p className="stat-number truncate">{stats.questions}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white border-l-4 border-purple-500 shadow-sm w-full sm:col-span-2 lg:col-span-1">
                <CardContent className="p-4 sm:p-5 flex items-center space-x-4">
                  <div className="p-3 bg-purple-50 rounded-full text-purple-600 flex-shrink-0">
                    <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="stat-label truncate">{t('admin.stats.activeQuizzes')}</p>
                    <p className="stat-number truncate">{stats.activeQuizzes}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="bg-white rounded-t-lg shadow-sm overflow-hidden border-b border-gray-200 sticky top-16 z-40">
            <nav className="flex overflow-x-auto admin-nav-scroll">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/admin');
                return (
                  <Link 
                    key={item.path} 
                    to={item.path} 
                    className={`flex items-center px-5 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 relative ${
                      isActive 
                        ? 'border-blue-600 text-blue-700 bg-blue-50/50' 
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 mr-2 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    {item.label}
                    {item.count !== null && (
                      <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                        isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {item.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-b-lg shadow-sm min-h-[500px]">
            <Routes>
              <Route path="candidates" element={<CandidatesManagement />} />
              <Route path="quiz-settings" element={<QuizSettings />} />
              <Route path="questions" element={<QuestionsManagement />} />
              <Route path="live-rankings" element={<LiveRankings />} />
              <Route path="cheat-logs" element={<CheatingLogs />} />
              <Route path="grading" element={<GradingDashboard />} />
              <Route path="grading/:quizId" element={<AdminGradingInterface />} />
              {isSuperAdmin && <Route path="management" element={<AdminManagement />} />}
              <Route path="*" element={<Navigate to="/admin/candidates" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;