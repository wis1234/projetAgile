import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Pagination from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/skeleton';

const PAGE_SIZE = 10;

const ReportHistory = ({ refreshTrigger }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (user?.id) fetchReports();
  }, [user?.id, refreshTrigger]);

  const fetchReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('time', { ascending: false });
    
    if (!error && data) setReports(data);
    setLoading(false);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified': return <Badge className="bg-green-100 text-green-800 border-green-200">{t('rapport.status.verified')}</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-800 border-red-200">{t('rapport.status.rejected')}</Badge>;
      case 'pending_review': return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">{t('rapport.status.pending_review')}</Badge>;
      default: return <Badge className="bg-blue-100 text-blue-800 border-blue-200">{t('rapport.status.submitted')}</Badge>;
    }
  };

  const paginatedReports = reports.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <Card>
      <CardContent className="p-0">
        <div className="table-responsive">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4">{t('rapport.form.date')}</th>
                <th className="p-4">{t('rapport.form.time')}</th>
                <th className="p-4">{t('rapport.form.country')}</th>
                <th className="p-4">{t('rapport.form.surveys')}</th>
                <th className="p-4">Status</th>
                <th className="p-4 hidden md:table-cell">{t('rapport.form.comments')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td className="p-4" colSpan={6}><Skeleton className="h-6 w-full" /></td>
                  </tr>
                ))
              ) : paginatedReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">No reports found.</td>
                </tr>
              ) : (
                paginatedReports.map(report => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="p-4 whitespace-nowrap">{report.date}</td>
                    <td className="p-4 whitespace-nowrap">{report.time}</td>
                    <td className="p-4">{report.country}</td>
                    <td className="p-4 font-bold">{report.surveys_completed}</td>
                    <td className="p-4">{getStatusBadge(report.status)}</td>
                    <td className="p-4 hidden md:table-cell max-w-xs truncate" title={report.comments}>{report.comments}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {reports.length > 0 && (
          <div className="p-4 border-t">
            <Pagination 
              currentPage={currentPage} 
              totalPages={Math.ceil(reports.length / PAGE_SIZE)} 
              totalItems={reports.length} 
              pageSize={PAGE_SIZE} 
              onPageChange={setCurrentPage} 
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportHistory;