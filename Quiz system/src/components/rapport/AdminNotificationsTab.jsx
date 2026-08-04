import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const AdminNotificationsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [form, setForm] = useState({ recipient_id: 'all', title: '', message: '', priority: 'Medium' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchNotifications();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase.from('users').select('id, full_name, email');
    if (data) setUsers(data);
  };

  const fetchNotifications = async () => {
    const { data } = await supabase.from('notifications').select('*, recipient:users!recipient_id(full_name)').order('created_at', { ascending: false });
    if (data) setNotifications(data);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.title || !form.message) return;
    setLoading(true);
    
    try {
      let targets = form.recipient_id === 'all' ? users.map(u => u.id) : [form.recipient_id];
      const inserts = targets.map(targetId => ({
        sender_id: user.id,
        recipient_id: targetId,
        title: form.title,
        message: form.message,
        priority: form.priority,
        status: 'sent'
      }));

      const { error } = await supabase.from('notifications').insert(inserts);
      if (error) throw error;
      
      toast({ title: 'Success', description: 'Notifications sent.' });
      setForm({ recipient_id: 'all', title: '', message: '', priority: 'Medium' });
      fetchNotifications();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader><CardTitle>Send Notification</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Recipient</label>
                <Select value={form.recipient_id} onValueChange={v => setForm({...form, recipient_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Select Recipient" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agents</SelectItem>
                    {users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Title</label>
                <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Priority</label>
                <Select value={form.priority} onValueChange={v => setForm({...form, priority: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Message</label>
                <Textarea rows={4} value={form.message} onChange={e => setForm({...form, message: e.target.value})} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>Send Notification</Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-2">
        <Card>
          <CardHeader><CardTitle>Notification History</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="table-responsive">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Recipient</th>
                    <th className="p-4">Title</th>
                    <th className="p-4">Priority</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {notifications.map(n => (
                    <tr key={n.id}>
                      <td className="p-4 whitespace-nowrap">{new Date(n.created_at).toLocaleDateString()}</td>
                      <td className="p-4">{n.recipient?.full_name || 'Unknown'}</td>
                      <td className="p-4 font-medium">{n.title}</td>
                      <td className="p-4"><Badge variant="outline">{n.priority}</Badge></td>
                      <td className="p-4"><Badge className="bg-blue-100 text-blue-800">{n.status}</Badge></td>
                    </tr>
                  ))}
                  {notifications.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-500">No notifications sent.</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminNotificationsTab;