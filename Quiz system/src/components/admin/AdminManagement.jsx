import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { isSuperAdmin } from '@/utils/authUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/components/ui/use-toast';
import { UserPlus, Trash2, Search, Shield, RefreshCw } from 'lucide-react';
import Pagination from '@/components/ui/Pagination';
import AddAdminForm from './AddAdminForm';

const PAGE_SIZE = 10;

const AdminManagement = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  
  const [admins, setAdmins] = useState([]);
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [paginatedAdmins, setPaginatedAdmins] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const isSuperAdminUser = isSuperAdmin(currentUser);

  useEffect(() => {
    loadAdmins();
  }, []);

  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = admins.filter(admin => 
      admin.full_name?.toLowerCase().includes(query) ||
      admin.email?.toLowerCase().includes(query)
    );
    setFilteredAdmins(filtered);
    setCurrentPage(1);
  }, [searchQuery, admins]);

  useEffect(() => {
    const from = (currentPage - 1) * PAGE_SIZE;
    setPaginatedAdmins(filteredAdmins.slice(from, from + PAGE_SIZE));
  }, [filteredAdmins, currentPage]);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .in('role', ['admin', 'super_admin'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdmins(data || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast({ variant: 'destructive', title: t('error'), description: 'Failed to load admins.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (adminId) => {
    if (!isSuperAdminUser) {
      toast({ variant: 'destructive', title: 'Accès Refusé', description: 'Seuls les Super Admins peuvent supprimer des administrateurs.' });
      return;
    }
    
    try {
      const { error } = await supabase.from('users').delete().eq('id', adminId);
      if (error) throw error;
      
      toast({ title: t('success'), description: 'Administrateur supprimé avec succès.' });
      loadAdmins();
    } catch (error) {
      console.error('Delete error:', error);
      toast({ variant: 'destructive', title: t('error'), description: 'Failed to delete admin.' });
    }
  };

  const handleAddSuccess = () => {
    setAddDialogOpen(false);
    loadAdmins();
  };

  if (!isSuperAdminUser) {
    return (
      <div className="p-4 md:p-8 text-center bg-red-50 border border-red-200 rounded-lg m-2 md:m-0">
        <Shield className="w-10 h-10 md:w-12 md:h-12 text-red-500 mx-auto mb-3 md:mb-4" />
        <h2 className="text-xl md:text-2xl font-bold text-red-700 mb-2">Accès Refusé</h2>
        <p className="text-sm md:text-base text-red-600">Seuls les Super Administrateurs peuvent accéder à la gestion des administrateurs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center">
          <Shield className="w-5 h-5 md:w-6 md:h-6 mr-2 text-purple-600" />
          {t('adminManagement')}
        </h2>
        
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white min-h-[44px]">
              <UserPlus className="w-4 h-4 mr-2" />
              {t('addAdmin')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('addNewAdmin')}</DialogTitle>
              <DialogDescription>Créer un nouveau compte administrateur ou super admin.</DialogDescription>
            </DialogHeader>
            <AddAdminForm onSuccess={handleAddSuccess} onCancel={() => setAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row items-center bg-white p-3 md:p-4 rounded-lg shadow-sm w-full gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full min-h-[44px]"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : filteredAdmins.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">{t('noAdmins')}</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[700px] text-sm text-left">
              <thead className="bg-gray-50 border-b text-xs uppercase text-gray-700">
                <tr>
                  <th className="px-4 md:px-6 py-3 md:py-4 font-medium">{t('fullNameLabel')}</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 font-medium">{t('emailLabel')}</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 font-medium">{t('roleLabel')}</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 font-medium">{t('joined')}</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-right font-medium">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedAdmins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 md:px-6 py-3 md:py-4 font-medium text-gray-900">{admin.full_name || 'N/A'}</td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-gray-600">{admin.email}</td>
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        admin.role === 'super_admin' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : 'bg-purple-100 text-purple-800 border border-purple-200'
                      }`}>
                        {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-gray-500 whitespace-nowrap">{new Date(admin.created_at).toLocaleDateString()}</td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                      {admin.id !== currentUser?.id && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50 h-10 w-10">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action supprimera définitivement le compte : {admin.email}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
                              <AlertDialogCancel className="w-full sm:w-auto mt-0 min-h-[44px]">{t('cancel')}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(admin.id)} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white min-h-[44px]">
                                {t('delete')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 md:p-4 border-t bg-gray-50">
            <Pagination 
              currentPage={currentPage} 
              totalPages={Math.ceil(filteredAdmins.length / PAGE_SIZE)} 
              totalItems={filteredAdmins.length} 
              pageSize={PAGE_SIZE} 
              onPageChange={setCurrentPage} 
            />
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminManagement;