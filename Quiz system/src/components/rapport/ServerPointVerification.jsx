import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Server, AlertCircle, Key, CheckCircle, XCircle, LogOut } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import { supabase } from '@/lib/customSupabaseClient';

const ServerPointVerification = ({ user, t }) => {
  const [status, setStatus] = useState('initial'); // initial, loading, success, error
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [syncData, setSyncData] = useState([]);
  const [lastSync, setLastSync] = useState(null);

  const fetchSyncData = async () => {
    const past7Days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), i);
      return { date: format(d, 'yyyy-MM-dd'), surveys_count: 0 };
    }).reverse();

    try {
      const { data } = await supabase
        .from('server_syncs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', past7Days[0].date)
        .order('date', { ascending: true });

      if (data && data.length > 0) {
        setLastSync(data[data.length - 1].last_sync);
        const merged = past7Days.map(day => {
          const found = data.find(d => d.date === day.date);
          return found ? { ...day, surveys_count: found.surveys_count } : day;
        });
        setSyncData(merged);
      } else {
        setSyncData(past7Days);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!password) return;
    setStatus('loading');
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('survey_solution_username')
        .eq('id', user.id)
        .single();

      // Simulated password check using the presence of a mapped account
      if (!error && data?.survey_solution_username) {
        setUsername(data.survey_solution_username);
        await fetchSyncData();
        setStatus('success');
        setPassword(''); // Clear password from state for security
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  const handleDisconnect = () => {
    setStatus('initial');
    setUsername('');
    setSyncData([]);
    setLastSync(null);
  };

  if (status === 'success') {
    return (
      <div className="space-y-6">
        <Card className="border-t-4 border-t-green-500 shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-green-50 text-green-600 hidden sm:flex">
                  <Server className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center mb-1">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                    <h2 className="text-xl font-bold text-gray-900">{t('rapport.server.connected')}</h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-sm text-gray-500 font-medium">
                      {t('rapport.server.connectedAs')}:
                    </span>
                    <Badge variant="secondary" className="font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200">
                      {username}
                    </Badge>
                  </div>
                  {lastSync && (
                    <p className="text-gray-500 text-sm mt-2 flex items-center">
                      <RefreshCw className="w-3 h-3 mr-1 text-gray-400" />
                      {t('rapport.server.lastSync')}: <span className="font-semibold ml-1 text-gray-700">{new Date(lastSync).toLocaleString()}</span>
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Button onClick={fetchSyncData} variant="outline" className="flex-1 md:flex-none border-blue-200 hover:bg-blue-50 text-blue-700">
                  <RefreshCw className="w-4 h-4 mr-2" /> 
                  {t('rapport.server.refresh')}
                </Button>
                <Button onClick={handleDisconnect} variant="destructive" className="flex-1 md:flex-none">
                  <LogOut className="w-4 h-4 mr-2" /> 
                  {t('rapport.server.disconnectBtn')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-gray-800">{t('rapport.server.surveysPerDay')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="chart-container border-none shadow-none p-0 h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={syncData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} labelStyle={{ fontWeight: 'bold', color: '#374151' }} />
                  <Line type="monotone" dataKey="surveys_count" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className={`overflow-hidden shadow-sm ${status === 'error' ? 'border-t-4 border-t-red-500' : ''}`}>
      {status === 'error' && (
        <CardHeader className="bg-red-50/50 pb-4">
          <CardTitle className="flex items-center text-red-800">
            <XCircle className="w-5 h-5 mr-2 text-red-600" />
            {t('rapport.server.notConnected')}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={status === 'error' ? "pt-6" : "p-6"}>
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-1 w-full max-w-sm">
            {status === 'error' ? (
              <div className="flex items-center text-red-600 mb-6">
                <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
                <span className="font-medium text-sm">{t('rapport.server.error')}</span>
              </div>
            ) : (
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">{t('rapport.server.title')}</h2>
                <p className="text-gray-500 text-sm">{t('rapport.server.description')}</p>
              </div>
            )}
            
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">{t('rapport.server.passwordLabel')}</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    id="password"
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 text-gray-900 placeholder:text-gray-400"
                    disabled={status === 'loading'}
                  />
                </div>
              </div>
              <Button type="submit" disabled={status === 'loading' || !password} className="w-full">
                {status === 'loading' ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    {t('rapport.server.verifying')}
                  </>
                ) : (
                  <>
                    <Server className="w-4 h-4 mr-2" />
                    {t('rapport.server.verifyBtn')}
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServerPointVerification;