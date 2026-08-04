import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { testSupabaseConnection } from '@/utils/supabaseConnectionTest';
import { CheckCircle2, XCircle, Loader2, Database, Globe } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function ConnectionTestPage() {
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState(null);

  const handleTestConnection = async () => {
    setTesting(true);
    setResults(null);
    
    try {
      const res = await testSupabaseConnection();

      if (!res.success) {
        throw new Error(res.error || "Failed to connect to Supabase database");
      }

      setResults({
        status: 'success',
        message: res.message
      });

      toast({ 
        title: "Connection Successful", 
        description: "Successfully connected to the database." 
      });

    } catch (err) {
      setResults({
        status: 'error',
        errorMsg: err.message
      });
      
      toast({ 
        variant: "destructive", 
        title: "Connection Failed", 
        description: err.message 
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Database Connection Diagnostics</h2>
          <p className="text-gray-500">Test direct connectivity to the Supabase database.</p>
        </div>
        <Button onClick={handleTestConnection} disabled={testing} size="lg" className="bg-blue-600 hover:bg-blue-700">
          {testing ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Database className="w-5 h-5 mr-2" />}
          {testing ? 'Testing Connection...' : 'Test Connection'}
        </Button>
      </div>

      {results && results.status === 'error' && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-800 flex items-center">
              <XCircle className="w-5 h-5 mr-2" /> 
              ✗ Connection Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 font-medium mb-4">{results.errorMsg}</p>
            <Button variant="outline" onClick={handleTestConnection} className="bg-white text-red-700 border-red-200 hover:bg-red-50">
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      )}

      {results && results.status === 'success' && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <CheckCircle2 className="w-16 h-16 text-green-600 mb-4" />
            <h3 className="font-bold text-green-900 text-2xl mb-2">✓ Connected</h3>
            <p className="text-green-700 font-medium">
              The Supabase client is properly configured and successfully communicating with the database.
            </p>
          </CardContent>
        </Card>
      )}

      {!results && !testing && (
        <Card className="bg-gray-50 border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
            <Globe className="w-12 h-12 mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-700">Ready to Test Connection</h3>
            <p className="mt-1 text-sm max-w-md">
              Click the "Test Connection" button above to verify your Supabase database configuration and connectivity.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}