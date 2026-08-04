import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Activity, RefreshCw, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { SyncService } from '@/services/SyncService';

export default function OverviewPage() {
  const [data, setData] = useState({ stats: null, recentInterviews: [], enumerators: 0 });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [errorDetails, setErrorDetails] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setErrorDetails(null);
      
      const stats = await SyncService.getStoredInterviewStats();
      const enumerators = await SyncService.getEnumeratorCount();
      const allInterviews = await SyncService.getAllInterviews();
      const recentInterviews = allInterviews.slice(0, 10);
      const lastSync = await SyncService.getLastSyncLog();

      setData({ 
        stats: {
          total_interviews: stats.total,
          overall_completion_rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
          last_sync_time: lastSync?.sync_timestamp || null
        },
        recentInterviews,
        enumerators
      });
    } catch (err) {
      console.error("Dashboard Load Error:", err);
      setErrorDetails(err.message);
      toast({ variant: "destructive", title: "Error Loading Dashboard", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSyncNow = async () => {
    setSyncing(true);
    setSyncStatus('Starting sync...');
    setErrorDetails(null);
    try {
      const res = await SyncService.fetchAndStoreSurveyData((status) => {
        setSyncStatus(status);
      });
      
      toast({ 
        title: "Complete Sync Successful", 
        description: `Synced ${res.stats.interviews_processed} interviews and ${res.stats.enumerators_processed} enumerators.` 
      });
      
      await fetchDashboardData();
    } catch (err) {
      console.error("Sync Error:", err);
      toast({ variant: "destructive", title: "Sync Failed", description: err.message });
      setErrorDetails(err.message);
    } finally {
      setSyncing(false);
      setSyncStatus('');
    }
  };

  const stats = data.stats || { total_interviews: 0, overall_completion_rate: 0, last_sync_time: null };

  if (errorDetails && !loading && !syncing && data.recentInterviews.length === 0) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg shadow-sm">
        <div className="flex items-start">
          <AlertTriangle className="w-6 h-6 text-red-600 mr-3 mt-1" />
          <div>
            <h3 className="text-lg font-bold text-red-900">Dashboard Error</h3>
            <p className="text-red-700 mt-2 font-mono text-sm break-all">{errorDetails}</p>
            <div className="mt-4 flex gap-3">
              <Button onClick={fetchDashboardData} variant="outline" className="bg-white border-red-300 text-red-700 hover:bg-red-50">
                <RefreshCw className="w-4 h-4 mr-2" /> Retry Fetch
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-sm text-gray-500 mt-1 flex items-center">
             <Clock className="w-4 h-4 mr-1"/> Last Full Sync: {stats.last_sync_time ? new Date(stats.last_sync_time).toLocaleString() : 'Never'}
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-end md:items-center gap-2">
          {syncing && <span className="text-sm text-blue-600 font-medium mr-2">{syncStatus}</span>}
          <Button onClick={handleSyncNow} disabled={syncing || loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 shadow-md">
            <RefreshCw className={`w-5 h-5 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Complete Server Data'}
          </Button>
        </div>
      </div>

      {errorDetails && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-md flex justify-between items-center shadow-sm">
          <div className="flex items-center">
             <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 text-red-600"/> 
             <span className="font-mono text-sm break-all">{errorDetails}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleSyncNow} className="bg-white text-red-700 ml-4 flex-shrink-0 hover:bg-red-50 border-red-300">
            <RefreshCw className="w-4 h-4 mr-2"/> Retry Sync
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Interviews</CardTitle>
            <FileText className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-10 w-24" /> : <div className="text-4xl font-bold text-gray-900">{stats.total_interviews}</div>}
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Overall Completion</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-10 w-24" /> : <div className="text-4xl font-bold text-gray-900">{stats.overall_completion_rate}%</div>}
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Enumerators</CardTitle>
            <Users className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-10 w-24" /> : <div className="text-4xl font-bold text-gray-900">{data.enumerators}</div>}
          </CardContent>
        </Card>
        <Card className={`border-l-4 shadow-sm border-l-indigo-500 hover:shadow-md transition-shadow`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Database Status</CardTitle>
            <Activity className="w-4 h-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-10 w-24" /> : (
              <>
                <div className="text-lg font-bold text-indigo-600 capitalize">Active</div>
                <p className="text-xs text-gray-500 mt-1">Ready for reporting</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className="text-lg">Recent Interviews (Last 10)</CardTitle>
          <Button variant="link" onClick={() => navigate('/dashboard/all-interviews')}>View Full Database →</Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Interview Key</th>
                  <th className="px-6 py-3">Enumerator</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Errors</th>
                  <th className="px-6 py-3">Updated On</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    </tr>
                  ))
                ) : data.recentInterviews.length > 0 ? (
                  data.recentInterviews.map((int, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-600 truncate max-w-[200px]" title={int.interview_key}>{int.interview_key}</td>
                      <td className="px-6 py-3 font-bold text-primary">{int.responsible_name || 'Unassigned'}</td>
                      <td className="px-6 py-3"><span className="bg-gray-100 px-2 py-1 rounded text-xs font-semibold">{int.status}</span></td>
                      <td className="px-6 py-3">
                        {int.errors_count > 0 ? (
                          <span className="text-red-600 flex items-center font-bold"><AlertTriangle className="w-3 h-3 mr-1"/> {int.errors_count}</span>
                        ) : (
                          <span className="text-green-600">0</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-gray-500">{int.updated_on ? new Date(int.updated_on).toLocaleString() : 'N/A'}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No interviews found. Run a full sync.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}