import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Pagination from '@/components/ui/Pagination';
import { CheckCircle, XCircle, Search } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const PAGE_SIZE = 20;

const AdminAllReportsTab = () => {
  const { toast } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('daily_reports')
      .select('*, users(full_name, email)')
      .order('date', { ascending: false })
      .order('time', { ascending: false });
    
    if (!error && data) setReports(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase.from('daily_reports').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: `Report marked as ${newStatus}` });
      fetchReports();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const filteredReports = reports.filter(r => {
    const matchSearch = r.users?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || r.country?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const paginatedReports = filteredReports.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input placeholder="Search agent or country..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="table-responsive">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4">Agent</th>
                  <th className="p-4">Date/Time</th>
                  <th className="p-4">Country</th>
                  <th className="p-4">Surveys</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading...</td></tr>
                ) : paginatedReports.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-500">No reports found.</td></tr>
                ) : (
                  paginatedReports.map(report => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="p-4 font-medium">{report.users?.full_name || report.users?.email}</td>
                      <td className="p-4 whitespace-nowrap">{report.date} {report.time}</td>
                      <td className="p-4">{report.country}</td>
                      <td className="p-4 font-bold">{report.surveys_completed}</td>
                      <td className="p-4">
                        <Badge className={report.status === 'verified' ? 'bg-green-100 text-green-800' : report.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
                          {report.status}
                        </Badge>
                      </td>
                      <td className="p-4 space-x-2 whitespace-nowrap">
                        {report.status !== 'verified' && (
                          <Button size="sm" variant="outline" className="text-green-600 border-green-200 bg-green-50" onClick={() => handleUpdateStatus(report.id, 'verified')}>
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        {report.status !== 'rejected' && (
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200 bg-red-50" onClick={() => handleUpdateStatus(report.id, 'rejected')}>
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t">
            <Pagination currentPage={currentPage} totalPages={Math.ceil(filteredReports.length / PAGE_SIZE)} totalItems={filteredReports.length} pageSize={PAGE_SIZE} onPageChange={setCurrentPage} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAllReportsTab;