import React, { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { Link } from '@inertiajs/react';

function Create({ projects, users, tasks = [], kanbans = [] }) {
  const { errors = {}, flash = {} } = usePage().props;
  const urlParams = new URLSearchParams(window.location.search);
  const urlTaskId = urlParams.get('task_id');
  const urlProjectId = urlParams.get('project_id');
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
  const [projectId, setProjectId] = useState(urlProjectId || projects[0]?.id || '');
  const [userId, setUserId] = useState(users[0]?.id || '');
  const [taskId, setTaskId] = useState(urlTaskId || '');
  const [kanbanId, setKanbanId] = useState('');
  const [description, setDescription] = useState('');
  const [notification, setNotification] = useState(flash.success || flash.error || '');
  const [notificationType, setNotificationType] = useState(flash.success ? 'success' : 'error');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (urlProjectId) setProjectId(urlProjectId);
    if (urlTaskId) setTaskId(urlTaskId);
  }, [urlProjectId, urlTaskId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('file', file);
    formData.append('project_id', projectId);
    formData.append('user_id', userId);
    if (taskId) formData.append('task_id', taskId);
    if (kanbanId) formData.append('kanban_id', kanbanId);
    if (description) formData.append('description', description);
    router.post('/files', formData, {
      forceFormData: true,
      onSuccess: () => {
        setNotification('Fichier créé avec succès');
        setNotificationType('success');
        setName(''); setFile(null); setDescription('');
        setLoading(false);
        setTimeout(() => router.visit('/files'), 1200);
      },
      onError: () => {
        setNotification('Erreur lors de la création');
        setNotificationType('error');
        setLoading(false);
      }
    });
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="max-w-xl w-full mx-auto">
        {notification && (
          <div className={`mb-4 px-4 py-2 rounded text-white ${notificationType === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{notification}</div>
        )}
        <h1 className="text-2xl font-bold mb-4">Créer un fichier</h1>
        <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
          <div>
            <label className="block font-semibold mb-1">Nom du fichier</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="input" required />
            {errors.name && <div className="text-error text-sm">{errors.name}</div>}
          </div>
          <div>
            <label className="block font-semibold mb-1">Fichier à importer</label>
            <input type="file" onChange={e => setFile(e.target.files[0])} className="input" required />
            {errors.file && <div className="text-error text-sm">{errors.file}</div>}
          </div>
          <div>
            <label className="block font-semibold mb-1">Projet associé</label>
            <select value={projectId} onChange={e => setProjectId(e.target.value)} className="input" required disabled={!!urlProjectId}>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
            {errors.project_id && <div className="text-error text-sm">{errors.project_id}</div>}
          </div>
          <div>
            <label className="block font-semibold mb-1">Tâche liée (optionnel)</label>
            <select value={taskId} onChange={e => setTaskId(e.target.value)} className="input" disabled={!!urlTaskId}>
              <option value="">Aucune</option>
              {tasks.map(task => (
                <option key={task.id} value={task.id}>{task.title}</option>
              ))}
            </select>
            {errors.task_id && <div className="text-error text-sm">{errors.task_id}</div>}
          </div>
          <div>
            <label className="block font-semibold mb-1">Kanban lié (optionnel)</label>
            <select value={kanbanId} onChange={e => setKanbanId(e.target.value)} className="input">
              <option value="">Aucun</option>
              {kanbans.map(kanban => (
                <option key={kanban.id} value={kanban.id}>{kanban.name}</option>
              ))}
            </select>
            {errors.kanban_id && <div className="text-error text-sm">{errors.kanban_id}</div>}
          </div>
          <div>
            <label className="block font-semibold mb-1">Description (optionnel)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="input" rows={2} />
            {errors.description && <div className="text-error text-sm">{errors.description}</div>}
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="btn" disabled={loading}>{loading ? 'Création...' : 'Créer'}</button>
            <Link href="/files" className="btn btn-secondary">Retour à la liste</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

Create.layout = page => <AdminLayout children={page} />;
export default Create; 