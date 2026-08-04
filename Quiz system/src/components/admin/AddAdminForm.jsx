import React, { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { User, Mail, Key, Shield } from 'lucide-react';

const AddAdminForm = ({ onSuccess, onCancel }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'admin'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (value) => {
    setFormData({ ...formData, role: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.fullName) {
      toast({ variant: 'destructive', title: t('error'), description: t('fillAllFields') });
      return;
    }

    setLoading(true);
    try {
      // Create user via edge function to bypass RLS
      const { data, error } = await supabase.functions.invoke('manage-users?action=create', {
        body: {
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          role: formData.role
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Verify the user was inserted into the users table with correct role
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: formData.role })
        .eq('email', formData.email);

      if (updateError) {
        console.error('Failed to update explicit role in users table:', updateError);
      }

      toast({ title: t('success'), description: `${formData.fullName} added successfully.` });
      onSuccess();
    } catch (error) {
      console.error('Error adding admin:', error);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: error.message || 'Failed to create admin account.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">{t('fullNameLabel')}</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
            className="pl-10"
            placeholder="John Doe"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">{t('emailLabel')}</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="pl-10"
            placeholder="admin@example.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t('passwordLabel')}</Label>
        <div className="relative">
          <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
            className="pl-10"
            placeholder={t('minChars')}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">{t('roleLabel')}</Label>
        <div className="relative">
          <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
          <Select value={formData.role} onValueChange={handleRoleChange}>
            <SelectTrigger className="pl-10">
              <SelectValue placeholder="Select Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            {t('cancel')}
          </Button>
        )}
        <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={loading}>
          {loading ? t('loading') : t('addAdmin')}
        </Button>
      </div>
    </form>
  );
};

export default AddAdminForm;