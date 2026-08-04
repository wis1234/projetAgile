import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Clock, Search, RefreshCw, Download, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Pagination from '@/components/ui/Pagination';
import { format, startOfDay, endOfDay } from 'date-fns';

const PAGE_SIZE = 20;

const CheatingLogs = () => {
  const { t } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [paginatedLogs, setPaginatedLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterQuizId, setFilterQuizId] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = logs;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(l => 
        l.users?.full_name?.toLowerCase().includes(q) || 
        l.quizzes?.title?.toLowerCase().includes(q)
      );
    }
    
    if (filterType !== 'all') {
      filtered = filtered.filter(l => l.event_type === filterType);
    }

    if (filterQuizId !== 'all') {
      filtered = filtered.filter(l => l.quiz_id === filterQuizId);
    }

    if (dateFrom) {
      const fromTime = startOfDay(new Date(dateFrom)).getTime();
      filtered = filtered.filter(l => new Date(l.created_at).getTime() >= fromTime);
    }

    if (dateTo) {
      const toTime = endOfDay(new Date(dateTo)).getTime();
      filtered = filtered.filter(l => new Date(l.created_at).getTime() <= toTime);
    }

    setFilteredLogs(filtered);
    setCurrentPage(1);
  }, [logs, searchQuery, filterType, filterQuizId, dateFrom, dateTo]);

  useEffect(() => {
    const from = (currentPage - 1) * PAGE_SIZE;
    setPaginatedLogs(filteredLogs.slice(from, from + PAGE_SIZE));
  }, [filteredLogs, currentPage]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [logsRes, quizzesRes] = await Promise.all([
        supabase
          .from('cheating_logs')
          .select('*, users(full_name, email), quizzes(title)')
          .order('created_at', { ascending: false })
          .limit(1000),
        supabase.from('quizzes').select('id, title').order('title')
      ]);
        
      if (logsRes.error) throw logsRes.error;
      setLogs(logsRes.data || []);
      setQuizzes(quizzesRes.data || []);
    } catch (err) {
      console.error('Failed to load logs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const csv = "Date,Candidat,Email,Quiz,Type de Triche,Détails\n" + 
      filteredLogs.map(l => `"${format(new Date(l.created_at), 'yyyy-MM-dd HH:mm:ss')}","${l.users?.full_name || ''}","${l.users?.email || ''}","${l.quizzes?.title || ''}","${l.event_type}","${JSON.stringify(l.details || {}).replace(/"/g, '""')}"`).join("\n");
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cheating_logs_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
  };

  const getCheatTypeLabel = (type) => {
    switch(type) {
      case 'tab_return': return t('admin.cheatLogs.tabReturn');
      case 'tab_switch': return t('admin.cheatLogs.tabSwitch');
      case 'window_blur': return t('admin.cheatLogs.windowBlur');
      default: return type;
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center">
            <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 mr-2 text-red-500"/> 
            {t('admin.cheatLogs.title')}
          </h2>
          <p className="text-gray-500 mt-1">{t('admin.cheatLogs.desc')}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={loadData} title="Refresh" className="min-h-[44px]">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={exportCSV} disabled={filteredLogs.length === 0} className="w-full sm:w-auto min-h-[44px]">
            <Download className="w-4 h-4 mr-2"/> Export CSV
          </Button>
        </div>
      </div>

      <Card className="bg-white">
        <CardContent className="p-3 md:p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          <div className="relative col-span-1 sm:col-span-2 md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input 
              placeholder="Search..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              className="pl-9 w-full min-h-[44px]" 
            />
          </div>
          
          <Select value={filterQuizId} onValueChange={setFilterQuizId}>
            <SelectTrigger className="w-full min-h-[44px]"><SelectValue placeholder="Filter by Quiz" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Quizzes</SelectItem>
              {quizzes.map(q => (
                <SelectItem key={q.id} value={q.id}>{q.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full min-h-[44px]"><SelectValue placeholder={t('admin.cheatLogs.type')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="tab_switch">{t('admin.cheatLogs.tabSwitch')}</SelectItem>
              <SelectItem value="window_blur">{t('admin.cheatLogs.windowBlur')}</SelectItem>
              <SelectItem value="tab_return">{t('admin.cheatLogs.tabReturn')}</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
             <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="pl-9 w-full min-h-[44px]" />
          </div>
          <div className="relative">
             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
             <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="pl-9 w-full min-h-[44px]" />
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Card className="p-4 md:p-8 text-center border-red-200 bg-red-50">
           <p className="text-red-600 mb-4">{error}</p>
           <Button onClick={loadData} variant="outline" className="min-h-[44px]"><RefreshCw className="w-4 h-4 mr-2" /> Retry</Button>
        </Card>
      ) : loading ? (
        <Card>
          <CardContent className="p-0">
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-10 w-full sm:w-24" />
                  <Skeleton className="h-10 flex-1 hidden sm:block" />
                  <Skeleton className="h-10 flex-1 hidden md:block" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[900px] text-sm text-left">
                <thead className="bg-gray-50/80 border-b text-xs uppercase text-gray-600 font-semibold">
                  <tr>
                    <th className="p-4 w-40">{t('admin.cheatLogs.date')}</th>
                    <th className="p-4 w-48">{t('admin.cheatLogs.admin')}</th>
                    <th className="p-4 w-48">Email</th>
                    <th className="p-4 w-64">{t('admin.cheatLogs.quiz')}</th>
                    <th className="p-4 w-40">{t('admin.cheatLogs.type')}</th>
                    <th className="p-4">{t('admin.cheatLogs.details')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedLogs.map((l, idx) => (
                    <tr key={l.id} className={`hover:bg-red-50/40 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                      <td className="p-4 whitespace-nowrap text-gray-600 font-medium">
                        <Clock className="inline w-3.5 h-3.5 mr-1.5 text-gray-400"/>
                        {format(new Date(l.created_at), 'MMM dd, HH:mm')}
                      </td>
                      <td className="p-4 font-medium text-gray-900 truncate max-w-[12rem]">
                        {l.users?.full_name || 'Unknown'}
                      </td>
                      <td className="p-4 text-gray-500 truncate max-w-[12rem]">
                        {l.users?.email}
                      </td>
                      <td className="p-4 text-gray-700 truncate max-w-[16rem]">
                        {l.quizzes?.title || 'Unknown Quiz'}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded-md text-xs font-semibold whitespace-nowrap inline-block">
                          {getCheatTypeLabel(l.event_type)}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-mono text-gray-500 max-w-[16rem] truncate" title={JSON.stringify(l.details)}>
                        {JSON.stringify(l.details)}
                      </td>
                    </tr>
                  ))}
                  {paginatedLogs.length === 0 && (
                    <tr>
                      <td colSpan="6" className="p-12 text-center text-gray-500">
                        <AlertTriangle className="w-8 h-8 mx-auto text-gray-300 mb-3" />
                        No cheat logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
          <div className="p-3 md:p-4 border-t bg-white">
            <Pagination 
              currentPage={currentPage} 
              totalPages={Math.ceil(filteredLogs.length / PAGE_SIZE)} 
              totalItems={filteredLogs.length} 
              pageSize={PAGE_SIZE} 
              onPageChange={setCurrentPage} 
            />
          </div>
        </Card>
      )}
    </div>
  );
};

export default CheatingLogs;