import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { isAdminUser } from '@/utils/authUtils';
import { checkSessionValidity } from '@/utils/sessionUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { FileText, Server, Users, Bell, LogOut } from 'lucide-react';

import StatisticsCard from '@/components/rapport/StatisticsCard';
import DailyReportForm from '@/components/rapport/DailyReportForm';
import ReportHistory from '@/components/rapport/ReportHistory';
import ServerPointTab from '@/components/rapport/ServerPointTab';
import AdminAllReportsTab from '@/components/rapport/AdminAllReportsTab';
import AdminServerPointsTab from '@/components/rapport/AdminServerPointsTab';
import AdminNotificationsTab from '@/components/rapport/AdminNotificationsTab';

const RapportPage = () => {
  const { user, signOut } = useAuth();
  const { t, currentLanguage } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const isAdmin = isAdminUser(user);
  
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleReportSaved = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await checkSessionValidity(); 
      await signOut();
      toast({
        title: currentLanguage === 'fr' ? "Déconnecté avec succès" : "Logged out successfully",
      });
      navigate('/login');
    } catch (error) {
      toast({
        variant: "destructive",
        title: currentLanguage === 'fr' ? "Erreur" : "Error",
        description: error.message || "An error occurred during logout."
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('rapport.title')} - {t('app.title')}</title>
      </Helmet>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('rapport.title')}</h1>
            <p className="text-gray-500 mt-2">Manage daily field reports and server synchronizations.</p>
          </div>
          
          <Button 
            variant="outline" 
            onClick={handleLogout} 
            disabled={isLoggingOut}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {isLoggingOut ? (currentLanguage === 'fr' ? 'Déconnexion...' : 'Logging out...') : (currentLanguage === 'fr' ? 'Se déconnecter' : 'Logout')}
          </Button>
        </div>

        <Tabs defaultValue="surveyor_point" className="w-full">
          <TabsList className="mb-6 bg-white border shadow-sm rounded-lg p-1 flex flex-wrap h-auto">
            <TabsTrigger value="surveyor_point" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 whitespace-normal text-left sm:whitespace-nowrap sm:text-center py-2">
              <FileText className="w-4 h-4 mr-2 inline-block" /> {t('rapport.tabs.surveyorPoint') || t('rapport.surveyor')}
            </TabsTrigger>
            <TabsTrigger value="server_point" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 whitespace-normal text-left sm:whitespace-nowrap sm:text-center py-2">
              <Server className="w-4 h-4 mr-2 inline-block" /> {t('rapport.tabs.serverPoint') || 'Server Point'}
            </TabsTrigger>
            
            {isAdmin && (
              <>
                <TabsTrigger value="all_agents" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 whitespace-normal text-left sm:whitespace-nowrap sm:text-center py-2">
                  <Users className="w-4 h-4 mr-2 inline-block" /> {t('rapport.tabs.allAgentsReports') || t('rapport.allAgents')}
                </TabsTrigger>
                <TabsTrigger value="server_points_admin" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 whitespace-normal text-left sm:whitespace-nowrap sm:text-center py-2">
                  <Server className="w-4 h-4 mr-2 inline-block" /> {t('rapport.tabs.serverPoints') || t('rapport.serverPoints')}
                </TabsTrigger>
                <TabsTrigger value="notifications" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 whitespace-normal text-left sm:whitespace-nowrap sm:text-center py-2">
                  <Bell className="w-4 h-4 mr-2 inline-block" /> {t('rapport.tabs.notifications') || t('rapport.notifications')}
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="surveyor_point" className="mt-0 outline-none">
            <StatisticsCard userId={user?.id} />
            <DailyReportForm onReportSaved={handleReportSaved} />
            <ReportHistory refreshTrigger={refreshTrigger} />
          </TabsContent>

          <TabsContent value="server_point" className="mt-0 outline-none">
            <ServerPointTab />
          </TabsContent>

          {isAdmin && (
            <>
              <TabsContent value="all_agents" className="mt-0 outline-none">
                <AdminAllReportsTab />
              </TabsContent>

              <TabsContent value="server_points_admin" className="mt-0 outline-none">
                <AdminServerPointsTab />
              </TabsContent>

              <TabsContent value="notifications" className="mt-0 outline-none">
                <AdminNotificationsTab />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </>
  );
};

export default RapportPage;