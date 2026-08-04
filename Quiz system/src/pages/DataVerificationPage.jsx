import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle2, AlertTriangle, Database, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { SyncService } from '@/services/SyncService';

export default function DataVerificationPage() {
  const [data, setData] = useState({ 
    ints: 0, 
    enums: 0, 
    statusCounts: [],
    enumCounts: [],
    verified: false,
    lastSync: null
  });
  const [loading, setLoading] = useState(true);
  const [errorDetails, setErrorDetails] = useState(null);
  const { toast } = useToast();

  const fetchVerificationData = async () => {
    setLoading(true);
    setErrorDetails(null);
    try {
      const ints = await SyncService.getStoredInterviewCount();
      const enums = await SyncService.getEnumeratorCount();
      const lastSync = await SyncService.getLastSyncLog();
      
      const { data: allInts, error: intErr } = await supabase.from('survey_interviews').select('status, responsible_name');
      if (intErr) throw intErr;

      const statusMap = {};
      const enumMap = {};

      allInts.forEach(i => {
        statusMap[i.status] = (statusMap[i.status] || 0) + 1;
        enumMap[i.responsible_name] = (enumMap[i.responsible_name] || 0) + 1;
      });

      const statusCounts = Object.entries(statusMap)
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count);

      const enumCounts = Object.entries(enumMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      setData({ 
        ints, 
        enums, 
        statusCounts,
        enumCounts,
        verified: true,
        lastSync: lastSync?.sync_timestamp || null
      });
    } catch (err) {
      console.error("Verification Error:", err);
      setErrorDetails(err.message);
      toast({ variant: "destructive", title: "Verification Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVerificationData(); }, []);

  const t_ints = 669; 
  const t_enums = 16;

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Verification</h2>
          <p className="text-sm text-gray-500">Verifying integrity of local Supabase storage.</p>
        </div>
        <Button onClick={fetchVerificationData} disabled={loading}><ShieldCheck className={`w-4 h-4 mr-2 ${loading ? 'animate-pulse' : ''}`} /> Verify Data</Button>
      </div>

      {errorDetails && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-md flex justify-between items-center shadow-sm">
          <div className="flex items-center">
             <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 text-red-600"/> 
             <span className="font-mono text-sm break-all">{errorDetails}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchVerificationData} className="bg-white text-red-700 ml-4 flex-shrink-0 hover:bg-red-50 border-red-300">
            <RefreshCw className="w-4 h-4 mr-2"/> Retry Verification
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-t-4 border-t-indigo-500 shadow-sm">
          <CardHeader>
            <CardTitle>Integrity Checks</CardTitle>
            <CardDescription>Validating baseline targets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between p-4 bg-gray-50 border rounded-md">
              <span className="flex items-center font-medium"><Database className="w-5 h-5 mr-3 text-blue-500"/> Total Interviews</span>
              {loading ? <Skeleton className="h-6 w-16" /> : data.ints === t_ints ? <span className="text-green-600 font-bold flex items-center">{data.ints} ✓</span> : <span className="text-red-600 font-bold flex items-center">{data.ints} ✗ (Expected {t_ints})</span>}
            </div>
            <div className="flex justify-between p-4 bg-gray-50 border rounded-md">
              <span className="flex items-center font-medium"><Database className="w-5 h-5 mr-3 text-purple-500"/> Total Enumerators</span>
              {loading ? <Skeleton className="h-6 w-16" /> : data.enums === t_enums ? <span className="text-green-600 font-bold flex items-center">{data.enums} ✓</span> : <span className="text-red-600 font-bold flex items-center">{data.enums} ✗ (Expected {t_enums})</span>}
            </div>
            
            <div className="flex justify-between p-4 bg-gray-50 border rounded-md">
              <span className="flex items-center font-medium"><ShieldCheck className="w-5 h-5 mr-3 text-green-500"/> Data Integrity</span>
              {loading ? <Skeleton className="h-6 w-24" /> : data.verified ? <span className="text-green-600 font-bold flex items-center">Locally Verified ✓</span> : <span className="text-red-600 font-bold flex items-center">Incomplete ✗</span>}
            </div>

            <div className="flex justify-between p-4 bg-gray-50 border rounded-md">
              <span className="flex items-center font-medium">Last Full Sync Timestamp</span>
              <span className="text-sm font-medium bg-white px-2 py-1 rounded border">
                {loading ? <Skeleton className="h-5 w-32 inline-block"/> : data.lastSync ? new Date(data.lastSync).toLocaleString() : 'N/A'}
              </span>
            </div>

            <div className="mt-4 pt-4 border-t">
              {loading ? <Skeleton className="h-10 w-full" /> : data.verified && data.ints === t_ints && data.enums === t_enums ? (
                  <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-md font-medium flex items-start text-sm">
                    <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0" /> All data verified successfully against expected targets.
                  </div>
              ) : errorDetails ? (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-md font-medium flex items-start text-sm">
                    <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" /> Verification could not be completed.
                  </div>
              ) : (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md font-medium flex items-start text-sm">
                    <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" /> Data mismatch. Please run full sync from Dashboard.
                  </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="py-4 border-b bg-gray-50/50">
              <CardTitle className="text-base">Status Distribution</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y max-h-[200px] overflow-y-auto">
                 {loading ? (
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                 ) : data.statusCounts.length > 0 ? data.statusCounts.map(item => (
                   <div key={item.status} className="flex items-center justify-between p-4 hover:bg-gray-50">
                     <span className="font-semibold text-gray-700 text-sm">{item.status || 'Unknown'}</span>
                     <span className="font-bold text-gray-900 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs">{item.count}</span>
                   </div>
                 )) : (
                   <div className="p-6 text-center text-gray-500 text-sm">No data available</div>
                 )}
               </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="py-4 border-b bg-gray-50/50">
              <CardTitle className="text-base">Enumerator Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y max-h-[250px] overflow-y-auto">
                 {loading ? (
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                 ) : data.enumCounts.length > 0 ? data.enumCounts.map((enumItem, idx) => (
                   <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50">
                     <div className="flex items-center">
                       <span className="font-bold text-gray-800 text-sm">{enumItem.name}</span>
                     </div>
                     <span className="font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded text-xs">{enumItem.count} forms</span>
                   </div>
                 )) : (
                   <div className="p-6 text-center text-gray-500 text-sm">No data available</div>
                 )}
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}