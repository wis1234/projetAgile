import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw, ChevronLeft, ChevronRight, AlertTriangle, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Skeleton } from '@/components/ui/skeleton';

export default function AllInterviewsPage() {
  const [interviews, setInterviews] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorDetails, setErrorDetails] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('');
  const itemsPerPage = 20;
  const { toast } = useToast();

  const fetchInterviewsData = async (page, search) => {
    setLoading(true);
    setErrorDetails(null);
    try {
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase
        .from('survey_interviews')
        .select('*', { count: 'exact' });

      if (search) {
        query = query.or(`responsible_name.ilike.%${search}%,interview_key.ilike.%${search}%,status.ilike.%${search}%`);
      }

      const { data, count, error } = await query
        .order('updated_on', { ascending: false })
        .range(from, to);

      if (error) throw error;

      setInterviews(data || []);
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage) || 1);
      setPageInput(page.toString());
    } catch (err) {
      console.error("Fetch Interviews Error:", err);
      setErrorDetails(err.message);
      toast({ variant: "destructive", title: "Error Fetching Data", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchInterviewsData(currentPage, searchTerm), 300);
    return () => clearTimeout(timer);
  }, [currentPage, searchTerm]);

  const startRecord = totalCount > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endRecord = totalCount > 0 ? Math.min(currentPage * itemsPerPage, totalCount) : 0;

  const handlePageJump = (e) => {
    e.preventDefault();
    const p = parseInt(pageInput);
    if (p >= 1 && p <= totalPages) {
      setCurrentPage(p);
    } else {
      setPageInput(currentPage.toString());
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">All Interviews Database</h2>
          <p className="text-sm text-gray-500">Showing {startRecord} to {endRecord} of {totalCount} interviews.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export</Button>
          <Button onClick={() => fetchInterviewsData(currentPage, searchTerm)} variant="outline" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {errorDetails && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-md flex justify-between items-center shadow-sm">
          <div className="flex items-center">
             <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 text-red-600"/> 
             <span className="font-mono text-sm break-all">{errorDetails}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchInterviewsData(currentPage, searchTerm)} className="bg-white text-red-700 ml-4 flex-shrink-0 hover:bg-red-50 border-red-300">
            <RefreshCw className="w-4 h-4 mr-2"/> Retry Fetch
          </Button>
        </div>
      )}

      <Card>
        <CardHeader className="border-b bg-gray-50/50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <CardTitle>Supabase Dataset</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search key, name or status..." className="pl-9 bg-white" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-4">Interview Key</th>
                  <th className="px-4 py-4">Enumerator</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Errors</th>
                  <th className="px-4 py-4">Not Answered</th>
                  <th className="px-4 py-4">Mode</th>
                  <th className="px-4 py-4">Tablet</th>
                  <th className="px-4 py-4">Updated On</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, idx) => (
                    <tr key={idx} className="border-b">
                       <td className="px-4 py-4"><Skeleton className="h-4 w-24" /></td>
                       <td className="px-4 py-4"><Skeleton className="h-4 w-32" /></td>
                       <td className="px-4 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                       <td className="px-4 py-4"><Skeleton className="h-4 w-10" /></td>
                       <td className="px-4 py-4"><Skeleton className="h-4 w-10" /></td>
                       <td className="px-4 py-4"><Skeleton className="h-4 w-16" /></td>
                       <td className="px-4 py-4"><Skeleton className="h-4 w-10" /></td>
                       <td className="px-4 py-4"><Skeleton className="h-4 w-24" /></td>
                    </tr>
                  ))
                ) : interviews.map((i, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-600 truncate max-w-[130px]" title={i.interview_key}>{i.interview_key}</td>
                    <td className="px-4 py-3 font-bold text-primary">{i.responsible_name}</td>
                    <td className="px-4 py-3"><span className="bg-gray-100 px-2 py-1 rounded text-xs font-semibold">{i.status}</span></td>
                    <td className="px-4 py-3">{i.errors_count > 0 ? <span className="text-red-600 font-bold flex items-center"><AlertTriangle className="w-3 h-3 mr-1"/>{i.errors_count}</span> : <span className="text-green-600">0</span>}</td>
                    <td className="px-4 py-3 font-medium">{i.not_answered || 0}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{i.interview_mode || 'N/A'}</td>
                    <td className="px-4 py-3 text-gray-600">{i.received_by_tablet ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{i.updated_on ? new Date(i.updated_on).toLocaleString() : ''}</td>
                  </tr>
                ))}
                {interviews.length === 0 && !loading && !errorDetails && (
                   <tr><td colSpan="8" className="px-6 py-8 text-center text-gray-500">No interviews match current filters.</td></tr>
                )}
                {errorDetails && interviews.length === 0 && !loading && (
                   <tr><td colSpan="8" className="px-6 py-8 text-center text-red-500 font-medium">Failed to load data. Please retry.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 gap-4">
            <span className="text-sm text-gray-500 font-medium">Page {currentPage} of {totalPages}</span>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || loading} className="bg-white"><ChevronLeft className="w-4 h-4 mr-1" /> Prev</Button>
              <form onSubmit={handlePageJump} className="flex items-center">
                  <Input 
                    className="w-14 h-8 text-center bg-white" 
                    value={pageInput} 
                    onChange={(e) => setPageInput(e.target.value)}
                    onBlur={handlePageJump}
                    disabled={loading}
                  />
              </form>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages || loading} className="bg-white">Next <ChevronRight className="w-4 h-4 ml-1" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}