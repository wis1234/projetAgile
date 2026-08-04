import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

const COUNTRIES = ['France', 'Canada', 'Belgium', 'Switzerland', 'USA', 'UK', 'Other'];

const DailyReportForm = ({ onReportSaved }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    date: '',
    time: '',
    country: '',
    surveys: '',
    comments: ''
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const now = new Date();
    setFormData(prev => ({
      ...prev,
      date: format(now, 'yyyy-MM-dd'),
      time: format(now, 'HH:mm')
    }));
  }, []);

  const handleClear = () => {
    const now = new Date();
    setFormData({
      date: format(now, 'yyyy-MM-dd'),
      time: format(now, 'HH:mm'),
      country: '',
      surveys: '',
      comments: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.country || formData.surveys === '') {
      toast({ variant: 'destructive', title: t('error'), description: 'Please fill all required fields.' });
      return;
    }
    
    const parsedSurveys = parseInt(formData.surveys, 10);
    if (parsedSurveys < 0) {
      toast({ variant: 'destructive', title: t('error'), description: 'Surveys cannot be negative.' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('daily_reports').insert([{
        user_id: user.id,
        date: formData.date,
        time: formData.time,
        country: formData.country,
        surveys_completed: parsedSurveys,
        comments: formData.comments,
        status: 'submitted'
      }]);

      if (error) throw error;
      
      toast({ title: t('success'), description: t('rapport.form.success') });
      handleClear();
      if (onReportSaved) onReportSaved();
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: t('error'), description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{t('rapport.form.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('rapport.form.date')}</Label>
              <Input type="date" value={formData.date} disabled className="bg-gray-50" />
            </div>
            <div className="space-y-2">
              <Label>{t('rapport.form.time')}</Label>
              <Input type="time" value={formData.time} disabled className="bg-gray-50" />
            </div>
            <div className="space-y-2">
              <Label>{t('rapport.form.agent')}</Label>
              <Input type="text" value={user?.user_metadata?.full_name || user?.email} disabled className="bg-gray-50" />
            </div>
            <div className="space-y-2">
              <Label>{t('rapport.form.country')} *</Label>
              <Select value={formData.country} onValueChange={(val) => setFormData({...formData, country: val})}>
                <SelectTrigger><SelectValue placeholder="Select Country" /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('rapport.form.surveys')} *</Label>
              <Input type="number" min="0" value={formData.surveys} onChange={(e) => setFormData({...formData, surveys: e.target.value})} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('rapport.form.comments')}</Label>
            <Textarea value={formData.comments} onChange={(e) => setFormData({...formData, comments: e.target.value})} rows={3} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={handleClear}>{t('rapport.form.clear')}</Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">{t('rapport.form.save')}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default DailyReportForm;