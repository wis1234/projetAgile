import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Skeleton } from '@/components/ui/skeleton';

export default function EnumeratorPerformancePage() {
  const [enumerators, setEnumerators] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorDetails, setErrorDetails] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { toast } = useToast();

  const fetchData = async (page) => {
    setLoading(true);
    setErrorDetails(null);
    try {
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, count, error } = await supabase
        .from('survey_enumerators')
        .select('*', { count: 'exact' })
        .order('total_interviews', { ascending: false })
        .range(from, to);

      if (error) throw error;
      
      setEnumerators(data || []);
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage) || 1);
    } catch (err) {
      console.error("Fetch Enumerators Error:", err);
      setErrorDetails(err.message);
      toast({ variant: "destructive", title: "Error Fetching Data", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(currentPage); 
  }, [currentPage]);

  const startRecord = totalCount > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endRecord = totalCount > 0 ? Math.min(currentPage * itemsPerPage, totalCount) : 0;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Enumerator Performance</h2>
          <p className="text-sm text-gray-500">Showing {startRecord} to {endRecord} of {totalCount} enumerators</p>
        </div>
        <Button onClick={() => fetchData(currentPage)} variant="outline" disabled={loading}><RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh</Button>
      </div>

      {errorDetails && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-md flex justify-between items-center shadow-sm">
          <div className="flex items-center">
             <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 text-red-600"/> 
             <span className="font-mono text-sm break-all">{errorDetails}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchData(currentPage)} className="bg-white text-red-700 ml-4 flex-shrink-0 hover:bg-red-50 border-red-300">
            <RefreshCw className="w-4 h-4 mr-2"/> Retry
          </Button>
        </div>
      )}

      <Card>
        <CardHeader className="border-b bg-gray-50/50"><CardTitle>Performance Metrics</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4">Enumerator Name</th>
                <th className="px-6 py-4">Total Interviews</th>
                <th className="px-6 py-4">Completion Rate (%)</th>
                <th className="px-6 py-4">Quality Score (%)</th>
                <th className="px-6 py-4">Last Synced</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="border-b">
                       <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                       <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
                       <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                       <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                       <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    </tr>
                  ))
              ) : enumerators.map((e, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold text-primary">{e.enumerator_name}</td>
                  <td className="px-6 py-4 font-semibold text-lg">{e.total_interviews}</td>
                  <td className="px-6 py-4 font-medium text-blue-600">{e.completion_rate}%</td>
                  <td className="px-6 py-4 font-bold text-green-600">{e.quality_score}%</td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{e.updated_at ? new Date(e.updated_at).toLocaleString() : ''}</td>
                </tr>
              ))}
              {enumerators.length === 0 && !loading && !errorDetails && (
                 <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No enumerators found.</td></tr>
              )}
              {errorDetails && enumerators.length === 0 && !loading && (
                 <tr><td colSpan="5" className="px-6 py-8 text-center text-red-500 font-medium">Failed to load data. Please retry.</td></tr>
              )}
            </tbody>
          </table>
          
          {totalCount > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 gap-4">
              <span className="text-sm text-gray-500 font-medium">Page {currentPage} of {totalPages}</span>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || loading} className="bg-white"><ChevronLeft className="w-4 h-4 mr-1" /> Prev</Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages || loading} className="bg-white">Next <ChevronRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}