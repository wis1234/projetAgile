import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/customSupabaseClient';
import { CheckCircle2, AlertTriangle, Info, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LogsViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('automation_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (!error) {
      setLogs(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
    const sub = supabase.channel('logs_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'automation_logs' }, fetchLogs)
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, []);

  const getStatusIcon = (status) => {
    if (status === 'success') return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (status === 'error' || status === 'failed') return <AlertTriangle className="w-4 h-4 text-red-500" />;
    return <Info className="w-4 h-4 text-blue-500" />;
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Recent Automation Logs</CardTitle>
        <Button variant="ghost" size="sm" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {logs.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No logs available.</p>
          ) : (
            logs.map(log => (
              <div key={log.id} className="flex flex-col border-b pb-3 last:border-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(log.status)}
                    <span className="font-semibold text-sm capitalize">{log.event_type.replace(/_/g, ' ')}</span>
                  </div>
                  <span className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</span>
                </div>
                {log.details && (
                  <pre className="mt-2 bg-gray-50 p-2 rounded text-xs text-gray-700 overflow-x-auto">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}