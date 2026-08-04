import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Trash2, Edit, Search, RefreshCw, Copy, Eye, EyeOff } from 'lucide-react';
import Pagination from '@/components/ui/Pagination';

const PAGE_SIZE = 20;

const QuizSettings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [quizzes, setQuizzes] = useState([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState([]);
  const [paginatedQuizzes, setPaginatedQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    duration_minutes: 30, 
    max_attempts: 1, 
    is_active: true,
    quiz_type: 'qcm',
    show_results: false
  });

  useEffect(() => { loadQuizzes(); }, []);

  useEffect(() => {
    let filtered = quizzes;
    if (searchQuery) filtered = filtered.filter(q => q.title?.toLowerCase().includes(searchQuery.toLowerCase()));
    setFilteredQuizzes(filtered);
    setCurrentPage(1);
  }, [quizzes, searchQuery]);

  useEffect(() => {
    const from = (currentPage - 1) * PAGE_SIZE;
    setPaginatedQuizzes(filteredQuizzes.slice(from, from + PAGE_SIZE));
  }, [filteredQuizzes, currentPage]);

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('quizzes').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setQuizzes(data || []);
    } catch (err) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec du chargement des quiz" });
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingQuiz) {
        const { error } = await supabase.from('quizzes').update(formData).eq('id', editingQuiz.id);
        if (error) throw error;
        toast({ title: "Succès", description: "Quiz mis à jour avec succès" });
      } else {
        const { error } = await supabase.from('quizzes').insert([{ ...formData, created_by: user.id }]);
        if (error) throw error;
        toast({ title: "Succès", description: "Quiz créé avec succès" });
      }
      setDialogOpen(false);
      setEditingQuiz(null);
      loadQuizzes();
    } catch (err) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce quiz ? Toutes les questions et réponses associées seront perdues.")) return;
    try {
      const { error } = await supabase.from('quizzes').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Succès", description: "Quiz supprimé" });
      loadQuizzes();
    } catch (err) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec de la suppression" });
    }
  };

  const handleDuplicate = async (id) => {
    try {
      const { error } = await supabase.rpc('duplicate_quiz', { original_quiz_id: id });
      if (error) throw error;
      toast({ title: "Succès", description: "Quiz dupliqué" });
      loadQuizzes();
    } catch (err) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec de la duplication" });
    }
  };

  const toggleActive = async (quiz) => {
    try {
      const { error } = await supabase.from('quizzes').update({ is_active: !quiz.is_active }).eq('id', quiz.id);
      if (error) throw error;
      loadQuizzes();
    } catch (err) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec de la mise à jour du statut" });
    }
  };

  const toggleResults = async (quiz) => {
    try {
      const { error } = await supabase.from('quizzes').update({ show_results: !quiz.show_results }).eq('id', quiz.id);
      if (error) throw error;
      
      const updatedQuizzes = quizzes.map(q => q.id === quiz.id ? { ...q, show_results: !q.show_results } : q);
      setQuizzes(updatedQuizzes);
      
      toast({ title: "Succès", description: `Visibilité des résultats ${!quiz.show_results ? 'activée' : 'désactivée'}` });
    } catch (err) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec de la mise à jour de la visibilité des résultats" });
    }
  };

  const openCreateDialog = () => {
    setFormData({ title: '', description: '', duration_minutes: 30, max_attempts: 1, is_active: true, quiz_type: 'qcm', show_results: false });
    setEditingQuiz(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-slate-900">Paramètres des Quiz</h2>
        <Dialog open={dialogOpen} onOpenChange={c => { setDialogOpen(c); if(!c) setEditingQuiz(null); }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700 min-h-[44px]" onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" /> Créer un Quiz
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-md lg:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingQuiz ? 'Modifier le Quiz' : 'Créer un Quiz'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Titre du Quiz</label>
                <Input placeholder="Saisissez le titre..." value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required className="w-full" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Description</label>
                <Textarea placeholder="Description du quiz" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={2} className="w-full" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Type de Quiz</label>
                <Select value={formData.quiz_type} onValueChange={v => setFormData({...formData, quiz_type: v})}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Sélectionner le type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="qcm">QCM uniquement</SelectItem>
                    <SelectItem value="written">Par écrit uniquement</SelectItem>
                    <SelectItem value="both">Les deux (Mixte)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Durée (mins)</label>
                  <Input type="number" placeholder="Mins" value={formData.duration_minutes} onChange={e => setFormData({...formData, duration_minutes: parseInt(e.target.value)})} required min="1" className="w-full" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Tentatives Max</label>
                  <Input type="number" placeholder="Tentatives" value={formData.max_attempts} onChange={e => setFormData({...formData, max_attempts: parseInt(e.target.value)})} required min="1" className="w-full" />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 bg-slate-50 rounded-lg border border-slate-200 gap-3">
                <div>
                  <p className="font-medium text-sm text-slate-900">Statut Actif</p>
                  <p className="text-xs text-slate-500">Permettre aux candidats de le passer</p>
                </div>
                <Switch checked={formData.is_active} onCheckedChange={c => setFormData({...formData, is_active: c})} />
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 bg-slate-50 rounded-lg border border-slate-200 gap-3">
                <div>
                  <p className="font-medium text-sm text-slate-900">Afficher les Résultats</p>
                  <p className="text-xs text-slate-500">Les candidats peuvent voir leur score à la fin</p>
                </div>
                <Switch checked={formData.show_results} onCheckedChange={c => setFormData({...formData, show_results: c})} />
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 min-h-[44px]">Enregistrer le Quiz</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm border border-slate-200 relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <Input placeholder="Rechercher des quiz..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 w-full" />
      </div>

      {loading ? <div className="text-center py-12"><RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" /></div> : (
        <Card className="border-slate-200 overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[700px] text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-3 md:p-4 font-medium text-slate-700">Titre</th>
                  <th className="p-3 md:p-4 font-medium text-slate-700">Type</th>
                  <th className="p-3 md:p-4 font-medium text-slate-700">Durée</th>
                  <th className="p-3 md:p-4 font-medium text-slate-700">Statut</th>
                  <th className="p-3 md:p-4 font-medium text-slate-700">Résultats</th>
                  <th className="p-3 md:p-4 text-right font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedQuizzes.map(q => (
                  <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 md:p-4 font-medium text-slate-900 truncate max-w-[150px] md:max-w-[200px]">{q.title}</td>
                    <td className="p-3 md:p-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                        q.quiz_type === 'written' ? 'bg-purple-100 text-purple-700' : q.quiz_type === 'both' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {q.quiz_type === 'written' ? 'Par écrit' : q.quiz_type === 'both' ? 'Mixte' : 'QCM'}
                      </span>
                    </td>
                    <td className="p-3 md:p-4 text-slate-600 whitespace-nowrap">{q.duration_minutes} mins</td>
                    <td className="p-3 md:p-4"><Switch checked={q.is_active} onCheckedChange={() => toggleActive(q)} /></td>
                    <td className="p-3 md:p-4">
                      <Button variant="ghost" size="sm" onClick={() => toggleResults(q)} className={`min-h-[44px] ${q.show_results ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>
                        {q.show_results ? <Eye className="w-4 h-4 mr-1 md:mr-2" /> : <EyeOff className="w-4 h-4 mr-1 md:mr-2" />}
                        <span className="hidden sm:inline">{q.show_results ? 'Visibles' : 'Cachés'}</span>
                      </Button>
                    </td>
                    <td className="p-3 md:p-4 text-right space-x-1 md:space-x-2 whitespace-nowrap">
                      <Button size="sm" variant="outline" onClick={() => handleDuplicate(q.id)} title="Dupliquer" className="border-slate-200 text-slate-600 hover:bg-slate-100 h-10 w-10 p-0"><Copy className="w-4 h-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => { setEditingQuiz(q); setFormData({ ...q, show_results: q.show_results || false }); setDialogOpen(true); }} title="Modifier" className="border-slate-200 text-blue-600 hover:bg-blue-50 h-10 w-10 p-0"><Edit className="w-4 h-4" /></Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(q.id)} title="Supprimer" className="h-10 w-10 p-0"><Trash2 className="w-4 h-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {paginatedQuizzes.length === 0 && <div className="p-8 text-center text-slate-500">Aucun quiz trouvé.</div>}
          </div>
        </Card>
      )}
      <div className="pt-2">
        <Pagination currentPage={currentPage} totalPages={Math.ceil(filteredQuizzes.length / PAGE_SIZE)} totalItems={filteredQuizzes.length} pageSize={PAGE_SIZE} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
};

export default QuizSettings;