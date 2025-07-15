import React, { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import Notification from './Notification';

const STATUS_OPTIONS = [
  { value: 'todo', label: 'À faire' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'done', label: 'Terminé' },
];
const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Basse' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'high', label: 'Haute' },
];

export default function TaskModal({ show, onClose, task = null, mode = 'create', users = [], projects = [], sprints = [] }) {
  const { errors } = usePage().props;
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState(task?.status || 'todo');
  const [dueDate, setDueDate] = useState(task?.due_date || '');
  const [priority, setPriority] = useState(task?.priority || 'medium');
  const [assignedTo, setAssignedTo] = useState(task?.assigned_to || '');
  const [projectId, setProjectId] = useState(task?.project_id || '');
  const [sprintId, setSprintId] = useState(task?.sprint_id || '');
  const [notification, setNotification] = useState('');
  const [notificationType, setNotificationType] = useState('success');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      setTitle(task?.title || '');
      setDescription(task?.description || '');
      setStatus(task?.status || 'todo');
      setDueDate(task?.due_date || '');
      setPriority(task?.priority || 'medium');
      setAssignedTo(task?.assigned_to || '');
      setProjectId(task?.project_id || '');
      setSprintId(task?.sprint_id || '');
      setNotification('');
      setNotificationType('success');
      setLoading(false);
    }
  }, [show, task]);

  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    const data = { title, description, status, due_date: dueDate, priority, assigned_to: assignedTo, project_id: projectId, sprint_id: sprintId };
    if (mode === 'edit') {
      router.put(`/tasks/${task.id}`, data, {
        onSuccess: () => {
          setNotification('Tâche modifiée avec succès');
          setNotificationType('success');
          setLoading(false);
          onClose(true);
        },
        onError: () => {
          setNotification('Erreur lors de la modification');
          setNotificationType('error');
          setLoading(false);
        }
      });
    } else {
      router.post('/tasks', data, {
        onSuccess: () => {
          setNotification('Tâche créée avec succès');
          setNotificationType('success');
          setTitle('');
          setDescription('');
          setStatus('todo');
          setDueDate('');
          setPriority('medium');
          setAssignedTo('');
          setProjectId('');
          setSprintId('');
          setLoading(false);
          onClose(true);
        },
        onError: () => {
          setNotification('Erreur lors de la création');
          setNotificationType('error');
          setLoading(false);
        }
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative animate-fade-in overflow-y-auto max-h-[90vh]">
        <button onClick={() => onClose(false)} className="absolute top-2 right-3 text-2xl text-gray-400 hover:text-gray-700">&times;</button>
        <Notification message={notification} type={notificationType} onClose={() => setNotification('')} />
        <h2 className="text-xl font-bold mb-4 text-center">{mode === 'edit' ? 'Modifier la tâche' : 'Créer une tâche'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Titre</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className={`w-full border px-3 py-2 rounded ${errors?.title ? 'border-red-500' : ''}`}
              required
            />
            {errors?.title && <div className="text-red-500 text-sm mt-1">{errors.title}</div>}
          </div>
          <div>
            <label className="block mb-1 font-medium">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className={`w-full border px-3 py-2 rounded ${errors?.description ? 'border-red-500' : ''}`}
              rows={3}
            />
            {errors?.description && <div className="text-red-500 text-sm mt-1">{errors.description}</div>}
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block mb-1 font-medium">Statut</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="w-full border px-3 py-2 rounded">
                {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block mb-1 font-medium">Priorité</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full border px-3 py-2 rounded">
                {PRIORITY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block mb-1 font-medium">Date d'échéance</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full border px-3 py-2 rounded" />
            </div>
            <div className="flex-1">
              <label className="block mb-1 font-medium">Assigné à</label>
              <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="w-full border px-3 py-2 rounded">
                <option value="">Non assigné</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block mb-1 font-medium">Projet</label>
              <select value={projectId} onChange={e => setProjectId(e.target.value)} className="w-full border px-3 py-2 rounded">
                <option value="">Aucun</option>
                {projects.map(p => <option key={p.id} value={p.id}>Projet #{p.id}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block mb-1 font-medium">Sprint</label>
              <select value={sprintId} onChange={e => setSprintId(e.target.value)} className="w-full border px-3 py-2 rounded">
                <option value="">Aucun</option>
                {sprints.map(s => <option key={s.id} value={s.id}>Sprint #{s.id}</option>)}
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow disabled:opacity-50 w-full"
            disabled={loading}
          >
            {loading ? (mode === 'edit' ? 'Modification...' : 'Création...') : (mode === 'edit' ? 'Enregistrer' : 'Créer')}
          </button>
        </form>
      </div>
    </div>
  );
} 