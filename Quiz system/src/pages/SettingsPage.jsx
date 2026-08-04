import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useSettings } from '@/contexts/SettingsContext';
import { Loader2, Globe, RefreshCw, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SyncService } from '@/services/SyncService';

export default function SettingsPage() {
  const { settings, refreshSettings, loading: ctxLoading } = useSettings();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    survey_solutions_url: '',
    survey_solutions_username: '',
    survey_solutions_password: ''
  });

  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!ctxLoading) {
      setFormData({
        survey_solutions_url: settings?.survey_solutions_url || 'https://ronaldo-demo.mysurvey.solutions/',
        survey_solutions_username: settings?.survey_solutions_username || 'admin',
        survey_solutions_password: settings?.survey_solutions_password || ''
      });
    }
  }, [settings, ctxLoading]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let error;
      if (settings?.id) {
        const { error: updateError } = await supabase.from('app_settings').update(formData).eq('id', settings.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase.from('app_settings').insert([formData]);
        error = insertError;
      }

      if (error) {
        throw error;
      }

      toast({ title: "Settings Saved", description: "Your configuration has been updated successfully." });
      refreshSettings();
    } catch (err) {
      console.error("Failed to save settings:", err);
      toast({ 
        variant: "destructive", 
        title: "Save Error", 
        description: err.message?.includes('policy') ? "Permission denied saving settings. Check RLS policies." : err.message 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const result = await SyncService.fetchAndStoreSurveyData();
      toast({ title: "Sync Complete", description: `Fetched ${result.stats.interviews_processed} interviews.` });
    } catch (err) {
      console.error("Settings page sync error:", err);
      toast({ 
        variant: "destructive", 
        title: "Sync Failed", 
        description: err.message || "An unexpected error occurred during sync." 
      });
    } finally {
      setSyncing(false);
    }
  };

  if (ctxLoading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-8 px-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSyncNow} disabled={syncing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Sync Now
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} 
            Save Settings
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Survey Solutions Integration</CardTitle>
          <CardDescription>Configure connection to your Survey Solutions server.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!formData.survey_solutions_password && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md flex items-center text-sm mb-4">
              <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
              Password is not configured. The system will use the default demo credentials.
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="survey_solutions_url">Server URL</Label>
            <Input id="survey_solutions_url" name="survey_solutions_url" value={formData.survey_solutions_url} onChange={handleChange} placeholder="https://ronaldo-demo.mysurvey.solutions/" className="text-gray-900" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="survey_solutions_username">Username</Label>
            <Input id="survey_solutions_username" name="survey_solutions_username" value={formData.survey_solutions_username} onChange={handleChange} className="text-gray-900" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="survey_solutions_password">Password</Label>
            <Input id="survey_solutions_password" type="password" name="survey_solutions_password" value={formData.survey_solutions_password} onChange={handleChange} placeholder="********" className="text-gray-900" />
          </div>
          <div className="pt-4">
            <Button variant="secondary" onClick={() => navigate('/connection-test')}>
              <Globe className="w-4 h-4 mr-2"/> Go to Connection Diagnostics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}