import React, { useEffect, useState } from 'react';
import { SyncService } from '@/services/SyncService';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DataSyncManager({ children }) {
  const [isSyncing, setIsSyncing] = useState(true);
  const [hasSynced, setHasSynced] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const initSync = async () => {
      try {
        // Check if we already have data
        const count = await SyncService.getStoredInterviewCount();
        if (count > 0) {
          setHasSynced(true);
          setIsSyncing(false);
          return;
        }

        await handleSync();
      } catch (err) {
        console.error("Init sync error:", err);
        setError(err.message);
        setIsSyncing(false);
      }
    };

    initSync();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);
    try {
      const result = await SyncService.fetchAndStoreSurveyData();
      setHasSynced(true);
      toast({
        title: "Sync Complete",
        description: `Successfully synchronized ${result.count} records.`,
      });
    } catch (err) {
      setError(err.message || "Failed to synchronize data.");
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: err.message || "Could not complete data synchronization.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (isSyncing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-gray-800">Synchronizing Data</h2>
        <p className="text-gray-500 mt-2">Fetching records from Survey Solutions...</p>
      </div>
    );
  }

  if (error && !hasSynced) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Synchronization Error</h2>
        <p className="text-gray-600 mb-6 max-w-md">{error}</p>
        <Button onClick={handleSync}>
          <RefreshCw className="w-4 h-4 mr-2" /> Try Again
        </Button>
      </div>
    );
  }

  return children;
}