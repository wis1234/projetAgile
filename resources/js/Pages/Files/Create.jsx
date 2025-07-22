import React, { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { Link } from '@inertiajs/react';
import { FaFileAlt } from 'react-icons/fa';

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
    <div className="flex flex-col w-full bg-white dark:bg-gray-900 p-0 m-0">
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto pt-4 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-3 mb-8">
            <Link href="/files" className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-100 transition">
              <FaFileAlt className="text-xl" />
            </Link>
            <FaFileAlt className="text-3xl text-blue-600" />
            <h1 className="text-3xl font-extrabold text-blue-700 dark:text-blue-200 tracking-tight">Nouveau fichier</h1>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-2xl mx-auto w-full">
            {notification && (
              <div className={`mb-6 px-4 py-3 rounded-lg text-white font-semibold ${notificationType === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{notification}</div>
            )}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <option value="">Aucune</option>
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
              <div className="md:col-span-2 flex gap-4 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading}>
                  {loading ? 'Création...' : <>Créer</>}
                </button>
                <Link href="/files" className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2">
                  Annuler
                </Link>
              </div>
            </form>
          </div>
        </div>
    </div>
  );
}

Create.layout = page => <AdminLayout children={page} />;
export default Create; 