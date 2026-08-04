import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext.jsx';
import { AuthProvider, useAuth } from '@/contexts/SupabaseAuthContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import ErrorBoundary from '@/components/ErrorBoundary';
import { clearAllSupabaseData } from '@/utils/authCleanup';
import { isAdminUser } from '@/utils/authUtils';

import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import UserDashboard from '@/pages/UserDashboard';
import QuizPage from '@/pages/QuizPage';
import ResultsPage from '@/pages/ResultsPage';
import Rankings from '@/pages/Rankings';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminDiagnosticsPage from '@/pages/AdminDiagnosticsPage';
import SettingsPage from '@/pages/SettingsPage';
import SurveySolutionsPage from '@/pages/SurveySolutionsPage';
import RapportPage from '@/pages/RapportPage';
import OverviewPage from '@/pages/OverviewPage';
import DashboardLayout from '@/layouts/DashboardLayout';
import AdminRoute from '@/components/AdminRoute';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-12 h-12 border-b-2 border-blue-600 rounded-full"></div>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;
  return children ? children : <Outlet />;
};

const SurveySolutionsRoute = () => {
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const { toast } = useToast();
  const isAdmin = isAdminUser(user);

  useEffect(() => {
    if (!isAdmin) {
      toast({
        variant: "destructive",
        title: currentLanguage === 'fr' ? "Accès refusé" : "Access denied",
        description: currentLanguage === 'fr' ? "Vous n'avez pas les droits pour accéder à cette page." : "You don't have permission to access this page."
      });
    }
  }, [isAdmin, currentLanguage, toast]);

  if (!isAdmin) return <Navigate to="/rapport" replace />;
  return <SurveySolutionsPage />;
};

function AppRoutes() {
  const { isSessionValid, clearAllAuthData } = useAuth();

  useEffect(() => {
    if (
      !isSessionValid() && 
      window.location.pathname !== '/login' && 
      window.location.pathname !== '/signup'
    ) {
      clearAllAuthData();
      clearAllSupabaseData();
    }
  }, [isSessionValid, clearAllAuthData]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/register" element={<Navigate to="/signup" replace />} />
      
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/" element={<UserDashboard />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/quiz/:id" element={<QuizPage />} />
        <Route path="/quiz/:quizId/results" element={<ResultsPage />} />
        <Route path="/rapport" element={<RapportPage />} />
        
        <Route path="/rankings" element={
          <AdminRoute>
            <Rankings />
          </AdminRoute>
        } />
        
        <Route path="/survey-solutions" element={<SurveySolutionsRoute />} />
        <Route path="/settings" element={
          <AdminRoute>
            <SettingsPage />
          </AdminRoute>
        } />

        <Route path="/admin/diagnostics" element={
          <AdminRoute>
            <AdminDiagnosticsPage />
          </AdminRoute>
        } />

        <Route path="/admin/*" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        
        <Route path="/all-interviews" element={<OverviewPage />} />
        <Route path="/data-quality" element={<OverviewPage />} />
        <Route path="/enumerator-performance" element={<OverviewPage />} />
        <Route path="/download-history" element={<OverviewPage />} />
        <Route path="/data-verification" element={<OverviewPage />} />
        <Route path="/connection-test" element={<OverviewPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <SettingsProvider>
          <Router>
            <ErrorBoundary>
              <AppRoutes />
            </ErrorBoundary>
            <Toaster />
          </Router>
        </SettingsProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;