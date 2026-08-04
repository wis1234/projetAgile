import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Database, RefreshCw, Users, FileText, CheckCircle, Clock } from 'lucide-react';
import { SyncService } from '@/services/SyncService';
import { useToast } from '@/components/ui/use-toast';

export default function SurveySolutionsPage() {
  const [stats, setStats] = useState({ total: 0, completed: 0, enumerators: 0 });
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const storedStats = await SyncService.getStoredInterviewStats();
      const enumCount = await SyncService.getEnumeratorCount();
      const recentInterviews = await SyncService.getAllInterviews();
      
      setStats({
        total: storedStats.total,
        completed: storedStats.completed,
        enumerators: enumCount
      });
      setInterviews(recentInterviews.slice(0, 10)); // Show latest 10
    } catch (err) {
      console.error('Failed to load survey data:', err);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load survey data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await SyncService.fetchAndStoreSurveyData();
      toast({ title: 'Sync Complete', description: `Processed ${result.stats.interviews_processed} interviews.` });
      await loadData();
    } catch (err) {
      console.error('Sync failed:', err);
      toast({ variant: 'destructive', title: 'Sync Failed', description: err.message || 'Error occurred during sync.' });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <>
      <Helmet><title>Survey Solutions - Quiz Platform</title></Helmet>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Database className="w-8 h-8 mr-3 text-blue-600" />
                Survey Solutions Data
              </h1>
              <p className="text-gray-600 mt-2">Manage and monitor synchronized survey data.</p>
            </div>
            <Button onClick={handleSync} disabled={syncing} className="bg-blue-600 hover:bg-blue-700 text-white">
              <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Interviews</CardTitle>
                <FileText className="w-4 h-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Completed</CardTitle>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.completed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Active Enumerators</CardTitle>
                <Users className="w-4 h-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.enumerators}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Interviews</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading data...</div>
              ) : interviews.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No interview data found. Run a sync to populate.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Key</TableHead>
                        <TableHead>Enumerator</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Errors</TableHead>
                        <TableHead>Last Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {interviews.map((interview) => (
                        <TableRow key={interview.id}>
                          <TableCell className="font-medium text-xs">{interview.interview_key}</TableCell>
                          <TableCell>{interview.responsible_name}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              ['Completed', 'ApprovedBySupervisor', 'ApprovedByHQ'].includes(interview.status)
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {interview.status}
                            </span>
                          </TableCell>
                          <TableCell>{interview.errors_count}</TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {new Date(interview.updated_on).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}