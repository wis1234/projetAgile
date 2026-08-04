import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const AdminServerPointsTab = () => {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('server_syncs')
        .select('*, users(full_name)')
        .order('date', { ascending: true });
        
      if (!error && data) {
        // Aggregate by date for simple chart
        const aggregated = {};
        data.forEach(row => {
          if(!aggregated[row.date]) aggregated[row.date] = 0;
          aggregated[row.date] += row.surveys_count;
        });
        const chartData = Object.keys(aggregated).map(date => ({
          date, surveys: aggregated[date]
        })).slice(-30);
        setAnalytics(chartData);
      }
      setLoading(false);
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Global Server Syncs (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <div className="h-[300px] flex items-center justify-center">Loading...</div> : (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="surveys" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminServerPointsTab;