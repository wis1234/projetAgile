import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Trash2, Edit, Search, RefreshCw, Filter, FileSpreadsheet } from 'lucide-react';
import Pagination from '@/components/ui/Pagination';
import ExcelImportManager from './ExcelImportManager';

const PAGE_SIZE = 20;

const QuestionsManagement = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [paginatedQuestions, setPaginatedQuestions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterQuizId, setFilterQuizId] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedQuizForImport, setSelectedQuizForImport] = useState('');
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [formData, setFormData] = useState({
    quiz_id: '', question_text: '', question_type: 'qcm', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 0
  });

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    let filtered = questions;
    if (searchQuery) filtered = filtered.filter(q => q.question_text?.toLowerCase().includes(searchQuery.toLowerCase()));
    if (filterQuizId !== 'all') filtered = filtered.filter(q => q.quiz_id === filterQuizId);
    setFilteredQuestions(filtered);
    setCurrentPage(1);
  }, [questions, searchQuery, filterQuizId]);

  useEffect(() => {
    const from = (currentPage - 1) * PAGE_SIZE;
    setPaginatedQuestions(filteredQuestions.slice(from, from + PAGE_SIZE));
  }, [filteredQuestions, currentPage]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [qRes, quizRes] = await Promise.all([
        supabase.from('questions').select('*, quizzes(title)').order('created_at', { ascending: false }),
        supabase.from('quizzes').select('id, title').order('title')
      ]);
      setQuestions(qRes.data || []);
      setQuizzes(quizRes.data || []);
    } catch (err) {
      toast({ variant: "destructive", title: t('error'), description: "Failed to load data" });
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSave = { ...formData };
      if (dataToSave.question_type === 'written') {
        dataToSave.option_a = '';
        dataToSave.option_b = '';
        dataToSave.option_c = '';
        dataToSave.option_d = '';
        dataToSave.correct_answer = 0;
      }

      if (editingQuestion) {
        await supabase.from('questions').update(dataToSave).eq('id', editingQuestion.id);
        toast({ title: t('success'), description: t('questions.msg.updated') });
      } else {
        await supabase.from('questions').insert([{ ...dataToSave, created_by: user.id }]);
        toast({ title: t('success'), description: t('questions.msg.added') });
      }
      setDialogOpen(false);
      setEditingQuestion(null);
      loadData();
    } catch (err) {
      toast({ variant: "destructive", title: t('error'), description: err.message });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('questions.deleteConfirm'))) return;
    try {
      await supabase.from('questions').delete().eq('id', id);
      toast({ title: t('success'), description: t('questions.msg.deleted') });
      loadData();
    } catch (err) {
      toast({ variant: "destructive", title: t('error'), description: "Failed to delete" });
    }
  };

  const resetForm = () => {
    setFormData({ quiz_id: '', question_text: '', question_type: 'qcm', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 0 });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 w-full sm:w-auto">{t('questions.title')}</h2>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto bg-green-50 text-green-700 border-green-200 hover:bg-green-100 min-h-[44px]">
                <FileSpreadsheet className="w-4 h-4 mr-2" /> {t('questions.import')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('questions.importTitle')}</DialogTitle>
              </DialogHeader>
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-1 block">{t('questions.destQuiz')}</label>
                <Select value={selectedQuizForImport} onValueChange={setSelectedQuizForImport}>
                  <SelectTrigger className="w-full min-h-[44px]"><SelectValue placeholder={t('questions.selectQuiz')} /></SelectTrigger>
                  <SelectContent>
                    {quizzes.map(q => <SelectItem key={q.id} value={q.id}>{q.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <ExcelImportManager type="questions" quizId={selectedQuizForImport} onSuccess={loadData} />
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={c => { setDialogOpen(c); if(!c) setEditingQuestion(null); }}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700 min-h-[44px]" onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" /> {t('questions.addBtn')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingQuestion ? t('questions.editTitle') : t('questions.addTitle')}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select value={formData.quiz_id} onValueChange={v => setFormData({...formData, quiz_id: v})} required>
                    <SelectTrigger className="w-full min-h-[44px]"><SelectValue placeholder={t('questions.form.quiz')} /></SelectTrigger>
                    <SelectContent>{quizzes.map(q => <SelectItem key={q.id} value={q.id}>{q.title}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={formData.question_type} onValueChange={v => setFormData({...formData, question_type: v})}>
                    <SelectTrigger className="w-full min-h-[44px]"><SelectValue placeholder={t('questions.form.type')} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="qcm">{t('questions.form.typeQcm')}</SelectItem>
                      <SelectItem value="written">{t('questions.form.typeWritten')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Textarea placeholder={t('questions.form.text')} value={formData.question_text} onChange={e => setFormData({...formData, question_text: e.target.value})} required rows={3} className="w-full" />
                
                {formData.question_type === 'qcm' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {['a', 'b', 'c', 'd'].map((opt, i) => (
                        <Input key={opt} placeholder={t('questions.form.option', { letter: opt.toUpperCase() })} value={formData[`option_${opt}`]} onChange={e => setFormData({...formData, [`option_${opt}`]: e.target.value})} required={opt==='a'||opt==='b'} className="w-full min-h-[44px]" />
                      ))}
                    </div>
                    <Select value={formData.correct_answer.toString()} onValueChange={v => setFormData({...formData, correct_answer: parseInt(v)})} required>
                      <SelectTrigger className="w-full min-h-[44px]"><SelectValue placeholder={t('questions.form.correct')} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">{t('questions.form.option', { letter: 'A' })}</SelectItem>
                        <SelectItem value="1">{t('questions.form.option', { letter: 'B' })}</SelectItem>
                        <SelectItem value="2">{t('questions.form.option', { letter: 'C' })}</SelectItem>
                        <SelectItem value="3">{t('questions.form.option', { letter: 'D' })}</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                )}
                
                {formData.question_type === 'written' && (
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
                    {t('questions.form.writtenNotice')}
                  </div>
                )}
                
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white min-h-[44px]">{t('questions.form.save')}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:gap-4 bg-white p-3 md:p-4 rounded-lg shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input placeholder={t('questions.search')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 w-full min-h-[44px]" />
        </div>
        <Select value={filterQuizId} onValueChange={setFilterQuizId}>
          <SelectTrigger className="w-full md:w-64 min-h-[44px]"><Filter className="w-4 h-4 mr-2 text-gray-500" /><SelectValue placeholder={t('questions.filterQuiz')} /></SelectTrigger>
          <SelectContent><SelectItem value="all">{t('questions.allQuizzes')}</SelectItem>{quizzes.map(q => <SelectItem key={q.id} value={q.id}>{q.title}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {loading ? <div className="text-center py-12"><RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" /></div> : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[800px] text-sm text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-3 md:p-4 font-medium">{t('questions.table.question')}</th>
                  <th className="p-3 md:p-4 font-medium w-24">{t('questions.table.type')}</th>
                  <th className="p-3 md:p-4 font-medium w-48">{t('questions.table.quiz')}</th>
                  <th className="p-3 md:p-4 font-medium w-32">{t('questions.table.answer')}</th>
                  <th className="p-3 md:p-4 text-right font-medium w-28">{t('questions.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedQuestions.map(q => (
                  <tr key={q.id} className="hover:bg-gray-50">
                    <td className="p-3 md:p-4 max-w-[200px] md:max-w-sm truncate font-medium text-gray-900" title={q.question_text}>{q.question_text}</td>
                    <td className="p-3 md:p-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${q.question_type === 'written' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                        {q.question_type === 'written' ? t('questions.table.written') : t('questions.table.qcm')}
                      </span>
                    </td>
                    <td className="p-3 md:p-4 text-gray-600 truncate max-w-[120px] md:max-w-[150px]" title={q.quizzes?.title}>{q.quizzes?.title}</td>
                    <td className="p-3 md:p-4 text-gray-500 whitespace-nowrap">
                      {q.question_type === 'written' ? (
                        <em className="text-xs">{t('questions.table.manual')}</em>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-semibold">{t('questions.table.option', { letter: String.fromCharCode(65 + q.correct_answer) })}</span>
                      )}
                    </td>
                    <td className="p-3 md:p-4 text-right space-x-1 md:space-x-2 whitespace-nowrap">
                      <Button size="sm" variant="outline" className="h-10 w-10 p-0" onClick={() => { setEditingQuestion(q); setFormData({...q, question_type: q.question_type || 'qcm'}); setDialogOpen(true); }}><Edit className="w-4 h-4" /></Button>
                      <Button size="sm" variant="destructive" className="h-10 w-10 p-0" onClick={() => handleDelete(q.id)}><Trash2 className="w-4 h-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {paginatedQuestions.length === 0 && <div className="p-8 text-center text-gray-500">{t('questions.empty')}</div>}
          </div>
        </Card>
      )}
      <div className="pt-2">
        <Pagination currentPage={currentPage} totalPages={Math.ceil(filteredQuestions.length / PAGE_SIZE)} totalItems={filteredQuestions.length} pageSize={PAGE_SIZE} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
};

export default QuestionsManagement;