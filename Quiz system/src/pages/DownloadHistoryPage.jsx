import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, CheckCircle2, AlertCircle, Loader2, Database, FileJson, FileSpreadsheet } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { downloadInterviewDatabase } from '@/utils/downloadDatabase';
import { SyncService } from '@/services/SyncService';

export default function DownloadHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingFormat, setDownloadingFormat] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();

  const fetchHistoryAndStats = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('survey_downloads').select('*').order('download_date', { ascending: false });
      if (error) throw error;
      setHistory(data || []);
      
      const count = await SyncService.getStoredInterviewCount();
      setTotalCount(count);
    } catch (err) {
      console.error("Failed to load history:", err);
      toast({ 
        variant: "destructive", 
        title: "History Load Error", 
        description: err.message?.includes('policy') ? "Permission denied reading history. Check RLS policies." : err.message 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistoryAndStats(); }, []);

  const handleDownload = async (format) => {
    setDownloadingFormat(format);
    try {
      await downloadInterviewDatabase(format);
      toast({ title: "Download Complete", description: `Complete dataset exported successfully.` });
      fetchHistoryAndStats();
    } catch (err) {
      console.error("Download exception:", err);
      toast({ 
        variant: "destructive", 
        title: "Download Failed", 
        description: err.message || "An unexpected error occurred during the download process." 
      });
    } finally {
      setDownloadingFormat(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-900">Download Complete Dataset</h2>
           <p className="text-sm text-gray-500 mt-1">Export ALL {totalCount} records and all enumerators from the server database.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-t-4 border-t-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg"><Database className="w-5 h-5 mr-2 text-blue-500" /> Stata / Excel (.xlsx)</CardTitle>
            <CardDescription>Best for advanced analysis tools.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500 mb-3">Includes all full API responses</p>
            <Button className="w-full" onClick={() => handleDownload('stata')} disabled={downloadingFormat !== null}>
              {downloadingFormat === 'stata' ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Download className="w-4 h-4 mr-2" />}
              {downloadingFormat === 'stata' ? 'Generating...' : `Export All ${totalCount}`}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg"><FileSpreadsheet className="w-5 h-5 mr-2 text-green-500" /> CSV Data</CardTitle>
            <CardDescription>Compatible with Excel and generic tools.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500 mb-3">Includes ErrorsCount & real names</p>
            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleDownload('csv')} disabled={downloadingFormat !== null}>
              {downloadingFormat === 'csv' ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Download className="w-4 h-4 mr-2" />}
              {downloadingFormat === 'csv' ? 'Generating...' : `Export All ${totalCount}`}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg"><FileJson className="w-5 h-5 mr-2 text-yellow-500" /> JSON Data</CardTitle>
            <CardDescription>Ideal for web developers and scripts.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500 mb-3">Full nested database structure</p>
            <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white" onClick={() => handleDownload('json')} disabled={downloadingFormat !== null}>
              {downloadingFormat === 'json' ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Download className="w-4 h-4 mr-2" />}
              {downloadingFormat === 'json' ? 'Generating...' : `Export All ${totalCount}`}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex justify-between items-center">
            <span>Download History</span>
            <Button variant="outline" size="sm" onClick={fetchHistoryAndStats}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center"><RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">File Name</th>
                    <th className="px-6 py-4">Size</th>
                    <th className="px-6 py-4">Total Records</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(log => (
                    <tr key={log.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4">{new Date(log.download_date).toLocaleString()}</td>
                      <td className="px-6 py-4 font-medium text-blue-600 truncate max-w-[250px]" title={log.file_name}>{log.file_name}</td>
                      <td className="px-6 py-4">{formatFileSize(log.file_size)}</td>
                      <td className="px-6 py-4 font-bold">{log.record_count}</td>
                      <td className="px-6 py-4">
                        {log.status === 'success' ? (
                           <span className="text-green-600 flex items-center font-medium"><CheckCircle2 className="w-4 h-4 mr-1"/> Success</span>
                        ) : (
                           <span className="text-red-600 flex items-center font-medium"><AlertCircle className="w-4 h-4 mr-1"/> Failed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No downloads found.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}