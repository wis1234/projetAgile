import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { runFullDiagnostics } from '@/utils/supabaseDiagnostics';
import { Activity, RefreshCw, CheckCircle2, XCircle, Database, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Helmet } from 'react-helmet';

const ExpandableError = ({ details }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-2 text-sm">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setExpanded(!expanded)}
        className="h-6 px-2 text-xs flex items-center bg-white border border-gray-200"
      >
        {expanded ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
        {expanded ? 'Hide Details' : 'Show Details'}
      </Button>
      {expanded && (
        <pre className="mt-2 p-2 bg-black text-gray-300 rounded overflow-x-auto text-xs font-mono">
          {details}
        </pre>
      )}
    </div>
  );
};

export default function AdminDiagnosticsPage() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const data = await runFullDiagnostics();
      setResults(data);
    } catch (error) {
      console.error("Failed to run diagnostics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 p-6">
      <Helmet>
        <title>Supabase Diagnostics | Admin Dashboard</title>
      </Helmet>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Activity className="w-6 h-6 mr-2 text-blue-600" />
            Supabase Diagnostics
          </h1>
          <p className="text-gray-500">Run system checks to verify database connectivity and RLS policies.</p>
        </div>
        <Button onClick={runDiagnostics} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Running Tests...' : 'Retry Tests'}
        </Button>
      </div>

      {!loading && results && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Database className="w-5 h-5 mr-2 text-gray-600" />
                Connection Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm font-medium text-gray-600">API Key Present</span>
                {results.connection.apiKeyPresent ? (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">✅ YES</Badge>
                ) : (
                  <Badge variant="destructive">❌ NO</Badge>
                )}
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm font-medium text-gray-600">Client Status</span>
                {results.connection.success ? (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">✅ CONNECTED</Badge>
                ) : (
                  <Badge variant="destructive">❌ FAILED</Badge>
                )}
              </div>
              
              {!results.connection.success && (
                <div className="p-3 bg-red-50 text-red-800 rounded-md text-sm flex items-start">
                  <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  <p>{results.connection.message}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-gray-600" />
                  Table Access Tests
                </CardTitle>
                <Badge variant={results.summary.failed === 0 ? "secondary" : "destructive"} 
                  className={results.summary.failed === 0 ? "bg-green-100 text-green-800 border-green-200" : ""}>
                  {results.summary.passed} / {results.summary.total} Passed
                </Badge>
              </div>
              <CardDescription>Verifies SELECT access across core tables.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.tables.map((test, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-lg border ${
                      test.success 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        {test.success ? (
                          <CheckCircle2 className="w-5 h-5 mr-2 text-green-600 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 mr-2 text-red-600 flex-shrink-0" />
                        )}
                        <span className="font-semibold text-gray-900">{test.table}</span>
                      </div>
                      <Badge 
                        variant={test.success ? "secondary" : "destructive"}
                        className={test.success ? "bg-green-200 text-green-900" : ""}
                      >
                        {test.success ? 'PASS' : 'FAIL'}
                      </Badge>
                    </div>
                    
                    {!test.success && (
                      <div className="mt-2 text-red-700 text-sm pl-7">
                        <strong>Error:</strong> {test.error}
                        {test.details && <ExpandableError details={test.details} />}
                      </div>
                    )}
                    
                    {test.success && (
                      <div className="mt-1 text-green-700 text-sm pl-7">
                        {test.details}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {loading && (
        <Card className="border-dashed shadow-none bg-gray-50">
          <CardContent className="flex flex-col items-center justify-center py-24 text-gray-500">
            <RefreshCw className="w-12 h-12 mb-4 animate-spin text-blue-600" />
            <p className="text-lg font-medium text-gray-700">Running system diagnostics...</p>
            <p className="text-sm mt-1">Checking database connections and RLS policies.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}