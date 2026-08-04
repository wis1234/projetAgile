import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { UserPlus, Trash2, BookOpen, Edit, Search, RefreshCw, FileSpreadsheet, CheckSquare } from 'lucide-react';
import Pagination from '@/components/ui/Pagination';
import { isSuperAdmin } from '@/utils/authUtils';
import ExcelImportManager from './ExcelImportManager';

const PAGE_SIZE = 20;

const CandidatesManagement = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  
  const [allCandidates, setAllCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [paginatedCandidates, setPaginatedCandidates] = useState([]);
  
  const [quizzes, setQuizzes] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assignmentsDialogOpen, setAssignmentsDialogOpen] = useState(false);
  const [bulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState(new Set());
  const [selectedQuizForBulk, setSelectedQuizForBulk] = useState("");

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const [formData, setFormData] = useState({ email: '', password: '', fullName: '', role: 'user' });

  const isSuperAdminUser = isSuperAdmin(currentUser);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterData();
  }, [allCandidates, searchQuery, filterRole, assignments]);

  useEffect(() => {
    const from = (currentPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE;
    setPaginatedCandidates(filteredCandidates.slice(from, to));
  }, [filteredCandidates, currentPage]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadCandidates(), loadQuizzes(), loadAssignments()]);
    } catch (err) {
      toast({ variant: "destructive", title: t('error'), description: "Failed to load data." });
    } finally {
      setLoading(false);
    }
  };

  const loadCandidates = async () => {
    let query = supabase.from('users').select('*');
    if (!isSuperAdminUser) query = query.eq('created_by', currentUser.id);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    setAllCandidates(data || []);
  };

  const loadQuizzes = async () => {
    let query = supabase.from('quizzes').select('*');
    if (!isSuperAdminUser) query = query.eq('created_by', currentUser.id);
    const { data, error } = await query.order('title');
    if (error) throw error;
    setQuizzes(data || []);
  };

  const loadAssignments = async () => {
    const { data, error } = await supabase.from('user_assignments').select('user_id, quiz_id');
    if (error) throw error;
    const assignmentMap = {};
    data?.forEach(item => {
      if (!assignmentMap[item.user_id]) assignmentMap[item.user_id] = new Set();
      assignmentMap[item.user_id].add(item.quiz_id);
    });
    setAssignments(assignmentMap);
  };

  const filterData = () => {
    let filtered = [...allCandidates];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(candidate => 
        (candidate.full_name?.toLowerCase().includes(query)) ||
        (candidate.email?.toLowerCase().includes(query))
      );
    }
    if (filterRole !== 'all') {
      filtered = filtered.filter(c => c.role === filterRole);
    }
    setFilteredCandidates(filtered);
    if (currentPage > Math.ceil(filtered.length / PAGE_SIZE)) setCurrentPage(1);
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-users?action=create', {
        body: { email: formData.email, password: formData.password, fullName: formData.fullName, role: formData.role }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      await supabase.from('users').update({ created_by: currentUser.id }).eq('email', formData.email);
      toast({ title: t('success'), description: "Candidate created successfully" });
      setAddDialogOpen(false);
      setFormData({ email: '', password: '', fullName: '', role: 'user' });
      loadCandidates();
    } catch (error) {
      toast({ variant: "destructive", title: t('error'), description: error.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateCandidate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-users?action=update', {
        body: { userId: selectedCandidate.id, email: formData.email, fullName: formData.fullName, password: formData.password || undefined, role: formData.role }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: t('success'), description: "Candidate updated successfully" });
      setEditDialogOpen(false);
      setSelectedCandidate(null);
      loadCandidates();
    } catch (error) {
      toast({ variant: "destructive", title: t('error'), description: error.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCandidate = async (candidate) => {
    if (!window.confirm(t('confirmDelete'))) return;
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-users?action=delete', { body: { userId: candidate.id } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: t('success'), description: "Candidate deleted successfully" });
      loadCandidates();
    } catch (error) {
      toast({ variant: "destructive", title: t('error'), description: error.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAssignment = async (quizId, isAssigned) => {
    if (!selectedCandidate) return;
    try {
      if (isAssigned) {
        await supabase.from('user_assignments').insert({ user_id: selectedCandidate.id, quiz_id: quizId });
      } else {
        await supabase.from('user_assignments').delete().eq('user_id', selectedCandidate.id).eq('quiz_id', quizId);
      }
      loadAssignments();
    } catch (error) {
      toast({ variant: "destructive", title: t('error'), description: "Failed to update assignment" });
    }
  };

  const handleBulkAssign = async () => {
    if (!selectedQuizForBulk || selectedCandidates.size === 0) return;
    setActionLoading(true);
    try {
      const assignmentsToInsert = Array.from(selectedCandidates).map(userId => ({
        user_id: userId, quiz_id: selectedQuizForBulk, assigned_at: new Date().toISOString()
      }));
      await supabase.from('user_assignments').upsert(assignmentsToInsert, { onConflict: 'user_id, quiz_id' });
      toast({ title: t('success'), description: "Assigned to selected candidates" });
      setBulkAssignDialogOpen(false);
      setSelectedCandidates(new Set());
      loadAssignments();
    } catch (error) {
      toast({ variant: "destructive", title: t('error'), description: "Failed bulk assignment" });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 w-full md:w-auto">Candidates Management</h2>
        <div className="flex flex-col sm:flex-row flex-wrap w-full md:w-auto gap-2">
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto bg-green-50 text-green-700 border-green-200 hover:bg-green-100 min-h-[44px]">
                <FileSpreadsheet className="w-4 h-4 mr-2" /> Importer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Importer des Candidats</DialogTitle>
              </DialogHeader>
              <ExcelImportManager type="candidates" onSuccess={loadCandidates} />
            </DialogContent>
          </Dialog>

          <Dialog open={bulkAssignDialogOpen} onOpenChange={setBulkAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto min-h-[44px]"><CheckSquare className="w-4 h-4 mr-2" /> Bulk Assign</Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-md">
              <DialogHeader><DialogTitle>Bulk Assign Quizzes</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <Select value={selectedQuizForBulk} onValueChange={setSelectedQuizForBulk}>
                  <SelectTrigger className="w-full min-h-[44px]"><SelectValue placeholder="Select Quiz" /></SelectTrigger>
                  <SelectContent>{quizzes.map(q => <SelectItem key={q.id} value={q.id}>{q.title}</SelectItem>)}</SelectContent>
                </Select>
                <div className="text-sm text-gray-500 font-medium">{selectedCandidates.size} candidates selected</div>
                <Button onClick={handleBulkAssign} disabled={actionLoading || !selectedQuizForBulk || selectedCandidates.size===0} className="w-full bg-blue-600 text-white min-h-[44px]">Assign to Selected</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-blue-600 text-white min-h-[44px]"><UserPlus className="w-4 h-4 mr-2" /> Add Candidate</Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Add New Candidate</DialogTitle></DialogHeader>
              <form onSubmit={handleAddCandidate} className="space-y-4">
                <Input placeholder="Full Name" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} required className="w-full min-h-[44px]" />
                <Input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required className="w-full min-h-[44px]" />
                <Input type="password" placeholder="Password (min 6 chars)" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required minLength={6} className="w-full min-h-[44px]" />
                <Select value={formData.role} onValueChange={v => setFormData({...formData, role: v})}>
                  <SelectTrigger className="w-full min-h-[44px]"><SelectValue placeholder="Role" /></SelectTrigger>
                  <SelectContent><SelectItem value="user">User</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
                </Select>
                <Button type="submit" className="w-full bg-blue-600 text-white min-h-[44px]" disabled={actionLoading}>Add Candidate</Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Edit Candidate</DialogTitle></DialogHeader>
              <form onSubmit={handleUpdateCandidate} className="space-y-4">
                <Input placeholder="Full Name" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} required className="w-full min-h-[44px]" />
                <Input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required disabled className="w-full min-h-[44px] bg-gray-100" />
                <Input type="password" placeholder="New Password (leave blank to keep current)" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} minLength={6} className="w-full min-h-[44px]" />
                <Select value={formData.role} onValueChange={v => setFormData({...formData, role: v})} disabled={!isSuperAdminUser}>
                  <SelectTrigger className="w-full min-h-[44px]"><SelectValue placeholder="Role" /></SelectTrigger>
                  <SelectContent><SelectItem value="user">User</SelectItem><SelectItem value="admin">Admin</SelectItem><SelectItem value="super_admin">Super Admin</SelectItem></SelectContent>
                </Select>
                {!isSuperAdminUser && <p className="text-xs text-gray-500">Only Super Admin can change roles.</p>}
                <Button type="submit" className="w-full bg-blue-600 text-white min-h-[44px]" disabled={actionLoading}>Update Candidate</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:gap-4 bg-white p-3 md:p-4 rounded-lg shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input placeholder="Search name or email..." value={searchQuery} onChange={e => {setSearchQuery(e.target.value); setCurrentPage(1);}} className="pl-9 w-full min-h-[44px]" />
        </div>
        <Select value={filterRole} onValueChange={v => {setFilterRole(v); setCurrentPage(1);}}>
          <SelectTrigger className="w-full md:w-48 min-h-[44px]"><SelectValue placeholder="Filter Role" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Roles</SelectItem><SelectItem value="user">User</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
        </Select>
      </div>

      {loading ? <div className="text-center py-12"><RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" /></div> : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[800px] text-sm text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-3 md:p-4 w-12"><Checkbox onCheckedChange={c => setSelectedCandidates(c ? new Set(allCandidates.map(x=>x.id)) : new Set())} checked={selectedCandidates.size === allCandidates.length && allCandidates.length > 0} className="w-5 h-5" /></th>
                  <th className="p-3 md:p-4 font-medium">Name</th>
                  <th className="p-3 md:p-4 font-medium">Email</th>
                  <th className="p-3 md:p-4 font-medium">Role</th>
                  <th className="p-3 md:p-4 font-medium">Joined</th>
                  <th className="p-3 md:p-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedCandidates.map(candidate => (
                  <tr key={candidate.id} className="hover:bg-gray-50">
                    <td className="p-3 md:p-4"><Checkbox checked={selectedCandidates.has(candidate.id)} onCheckedChange={c => { const s = new Set(selectedCandidates); c ? s.add(candidate.id) : s.delete(candidate.id); setSelectedCandidates(s); }} className="w-5 h-5" /></td>
                    <td className="p-3 md:p-4 font-medium text-gray-900">{candidate.full_name || 'N/A'}</td>
                    <td className="p-3 md:p-4 text-gray-600">{candidate.email}</td>
                    <td className="p-3 md:p-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${candidate.role === 'super_admin' ? 'bg-yellow-100 text-yellow-800' : candidate.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                        {candidate.role === 'super_admin' ? 'Super Admin' : candidate.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="p-3 md:p-4 text-gray-500 whitespace-nowrap">{new Date(candidate.created_at).toLocaleDateString()}</td>
                    <td className="p-3 md:p-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="h-10 w-10 p-0" onClick={() => { setSelectedCandidate(candidate); setAssignmentsDialogOpen(true); }}><BookOpen className="w-4 h-4" /></Button>
                        <Button size="sm" variant="outline" className="h-10 w-10 p-0" onClick={() => { setSelectedCandidate(candidate); setFormData({ email: candidate.email, fullName: candidate.full_name, role: candidate.role, password: '' }); setEditDialogOpen(true); }}><Edit className="w-4 h-4" /></Button>
                        <Button size="sm" variant="destructive" className="h-10 w-10 p-0" onClick={() => handleDeleteCandidate(candidate)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {paginatedCandidates.length === 0 && <div className="p-8 text-center text-gray-500">No candidates found.</div>}
          </div>
        </Card>
      )}
      <div className="pt-2">
        <Pagination currentPage={currentPage} totalPages={Math.ceil(filteredCandidates.length / PAGE_SIZE)} totalItems={filteredCandidates.length} pageSize={PAGE_SIZE} onPageChange={setCurrentPage} />
      </div>

      <Dialog open={assignmentsDialogOpen} onOpenChange={setAssignmentsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg">
          <DialogHeader><DialogTitle className="truncate">Manage Assignments for {selectedCandidate?.full_name}</DialogTitle></DialogHeader>
          <div className="py-2 md:py-4 space-y-3 md:space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {quizzes.map(quiz => (
              <div key={quiz.id} className="flex justify-between items-center p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="pr-4 overflow-hidden">
                  <p className="font-medium text-sm md:text-base truncate">{quiz.title}</p>
                  <p className="text-xs text-gray-500">{quiz.duration_minutes} mins</p>
                </div>
                <Switch checked={assignments[selectedCandidate?.id]?.has(quiz.id)} onCheckedChange={c => handleToggleAssignment(quiz.id, c)} className="flex-shrink-0" />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CandidatesManagement;