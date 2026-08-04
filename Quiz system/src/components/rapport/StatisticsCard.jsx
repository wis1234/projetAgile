import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Calculator, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const StatisticsCard = ({ userId }) => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({ total: 0, average: 0, lastReport: '-' });

  useEffect(() => {
    if (!userId) return;
    const fetchStats = async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      
      const { data, error } = await supabase
        .from('daily_reports')
        .select('surveys_completed, date, time')
        .eq('user_id', userId)
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .order('date', { ascending: false })
        .order('time', { ascending: false });

      if (error || !data) return;

      const total = data.reduce((sum, row) => sum + row.surveys_completed, 0);
      const average = data.length > 0 ? (total / data.length).toFixed(1) : 0;
      const lastReport = data.length > 0 ? `${data[0].date} ${data[0].time}` : '-';

      setStats({ total, average, lastReport });
    };

    fetchStats();
  }, [userId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="bg-white shadow-sm border-l-4 border-l-blue-500">
        <CardContent className="p-4 flex items-center">
          <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Surveys (This Month)</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-white shadow-sm border-l-4 border-l-green-500">
        <CardContent className="p-4 flex items-center">
          <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Average Surveys/Day</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.average}</h3>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm border-l-4 border-l-purple-500">
        <CardContent className="p-4 flex items-center">
          <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Last Report</p>
            <h3 className="text-lg font-bold text-gray-900 truncate">{stats.lastReport}</h3>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatisticsCard;