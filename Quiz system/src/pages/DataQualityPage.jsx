import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { SyncService } from '@/services/SyncService';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

export default function DataQualityPage() {
  const [data, setData] = useState({ score: 0, comp: 0, count: 0 });
  const [statusData, setStatusData] = useState([]);
  const [errorData, setErrorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  const fetchData = async () => {
    setLoading(true);
    try {
      const metrics = await SyncService.getDataQualityMetrics();
      const count = await SyncService.getStoredInterviewCount();
      const allInterviews = await SyncService.getAllInterviews();
      
      const statusCounts = {};
      const errorCounts = { '0': 0, '1-2': 0, '3-5': 0, '5+': 0 };

      allInterviews.forEach(int => {
        statusCounts[int.status] = (statusCounts[int.status] || 0) + 1;
        
        const errs = int.errors_count || 0;
        if (errs === 0) errorCounts['0']++;
        else if (errs <= 2) errorCounts['1-2']++;
        else if (errs <= 5) errorCounts['3-5']++;
        else errorCounts['5+']++;
      });

      const formattedStatus = Object.keys(statusCounts).map(key => ({ name: key, value: statusCounts[key] }));
      const formattedErrors = Object.keys(errorCounts).map(key => ({ name: `${key} Errors`, count: errorCounts[key] }));

      setData({ score: metrics.overall_score || 0, comp: metrics.completion_rate || 0, count });
      setStatusData(formattedStatus);
      setErrorData(formattedErrors);

    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to calculate complete metrics." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <div className="p-8 text-center"><RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" /></div>;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Complete Dataset Quality</h2>
          <p className="text-sm text-gray-500">Calculated from all {data.count} interviews extracted from the server</p>
        </div>
        <Button variant="outline" onClick={fetchData}><RefreshCw className="w-4 h-4 mr-2" /> Recalculate Metrics</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm border-t-4 border-t-blue-500">
          <CardHeader>
            <CardTitle>Overall Quality Score</CardTitle>
            <CardDescription>Based on aggregated ErrorsCount across ALL records</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className={`relative w-40 h-40 rounded-full flex items-center justify-center border-8 ${data.score >= 80 ? 'border-green-500 text-green-600' : 'border-yellow-500 text-yellow-600'}`}>
              <span className="text-4xl font-bold">{data.score}%</span>
            </div>
            <p className="mt-4 text-gray-500 text-sm font-medium">Aggregated across {data.count} real interviews</p>
            {data.score >= 80 ? (
              <span className="mt-2 text-green-600 text-sm flex items-center"><CheckCircle2 className="w-4 h-4 mr-1"/> Low error count detected globally</span>
            ) : (
              <span className="mt-2 text-yellow-600 text-sm flex items-center"><AlertTriangle className="w-4 h-4 mr-1"/> Significant errors detected globally</span>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-t-4 border-t-green-500">
          <CardHeader>
            <CardTitle>Global Completion Rate</CardTitle>
            <CardDescription>Percentage of fully completed forms in complete dataset</CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex flex-col justify-center h-full">
            <div className="space-y-4 mb-4">
              <div className="flex justify-between items-end">
                <span className="text-sm font-medium text-gray-700">Fully Completed Forms</span>
                <span className="text-2xl font-bold text-primary">{data.comp}%</span>
              </div>
              <Progress value={data.comp} className="h-4 rounded-full" />
            </div>
            <div className="mt-4 text-center text-sm text-gray-500">
              Calculated dynamically from {data.count} total records.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card className="shadow-sm">
          <CardHeader>
             <CardTitle>Status Distribution</CardTitle>
             <CardDescription>Breakdown of interview statuses across all data</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
             <CardTitle>Error Distribution</CardTitle>
             <CardDescription>Number of interviews by error count brackets</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
             {errorData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={errorData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} />
                   <XAxis dataKey="name" />
                   <YAxis allowDecimals={false} />
                   <RechartsTooltip cursor={{fill: '#f3f4f6'}} />
                   <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Interviews" />
                 </BarChart>
               </ResponsiveContainer>
             ) : (
               <div className="h-full flex items-center justify-center text-gray-400">No data available</div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}