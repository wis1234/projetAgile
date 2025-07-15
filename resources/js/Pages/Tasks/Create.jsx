import React, { useState } from 'react';
import { router, usePage, Link } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { FaTasks, FaArrowLeft, FaUserCircle } from 'react-icons/fa';

function Create({ projects = [], sprints = [] }) {
  console.log('projects:', projects);
  console.log('sprints:', sprints);
  const { errors = {}, flash = {} } = usePage().props;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [sprintId, setSprintId] = useState(sprints[0]?.id || '');
  // Trouver les membres du projet sélectionné
  const selectedProject = projects.find(p => p.id == projectId);
  const projectUsers = selectedProject?.users || [];
  const [assignedTo, setAssignedTo] = useState(projectUsers[0]?.id || '');
  const [notification, setNotification] = useState(flash.success || flash.error || '');
  const [notificationType, setNotificationType] = useState(flash.success ? 'success' : 'error');
  const [loading, setLoading] = useState(false);

  const isFormValid = title && projectId && sprintId && assignedTo && status;

  // Mettre à jour assignedTo quand le projet change
  const handleProjectChange = (e) => {
    setProjectId(e.target.value);
    const proj = projects.find(p => p.id == e.target.value);
    setAssignedTo(proj?.users[0]?.id || '');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    router.post('/tasks', {
      title,
      description,
      status,
      due_date: dueDate,
      priority,
      assigned_to: assignedTo,
      project_id: projectId,
      sprint_id: sprintId,
    }, {
      onSuccess: () => {
        setNotification('Tâche créée avec succès');
        setNotificationType('success');
        setTitle(''); setDescription(''); setDueDate('');
        setLoading(false);
        setTimeout(() => router.visit('/tasks'), 1200);
      },
      onError: () => {
        setNotification('Erreur lors de la création');
        setNotificationType('error');
        setLoading(false);
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-8">
        <FaTasks className="text-3xl text-blue-700 dark:text-blue-200" />
        <h1 className="text-3xl font-extrabold text-blue-700 dark:text-blue-200 tracking-tight drop-shadow">Créer une tâche</h1>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        {notification && (
          <div className={`mb-4 px-4 py-2 rounded font-semibold ${notificationType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{notification}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-semibold mb-1">Titre</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="border px-3 py-2 rounded w-full" required />
            {errors.title && <div className="text-error text-sm">{errors.title}</div>}
          </div>
          <div>
            <label className="block font-semibold mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="border px-3 py-2 rounded w-full" rows={3} />
            {errors.description && <div className="text-error text-sm">{errors.description}</div>}
          </div>
          <div>
            <label className="block font-semibold mb-1">Projet</label>
            <select value={projectId} onChange={handleProjectChange} className="border px-3 py-2 rounded w-full" required>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
            {errors.project_id && <div className="text-error text-sm">{errors.project_id}</div>}
          </div>
          <div>
            <label className="block font-semibold mb-1">Sprint</label>
            <select value={sprintId} onChange={e => setSprintId(e.target.value)} className="border px-3 py-2 rounded w-full" required>
              {sprints.map(sprint => (
                <option key={sprint.id} value={sprint.id}>{sprint.name}</option>
              ))}
            </select>
            {errors.sprint_id && <div className="text-error text-sm">{errors.sprint_id}</div>}
          </div>
          <div>
            <label className="block font-semibold mb-1">Assigné à</label>
            <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="border px-3 py-2 rounded w-full" required disabled={projectUsers.length === 0}>
              {projectUsers.length === 0 && <option value="">Aucun membre</option>}
              {projectUsers.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
            {projectUsers.length === 0 && <div className="text-error text-sm">Aucun membre disponible pour ce projet.</div>}
            {errors.assigned_to && <div className="text-error text-sm">{errors.assigned_to}</div>}
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block font-semibold mb-1">Statut</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="border px-3 py-2 rounded w-full" required>
                <option value="todo">À faire</option>
                <option value="in_progress">En cours</option>
                <option value="done">Terminé</option>
              </select>
              {errors.status && <div className="text-error text-sm">{errors.status}</div>}
            </div>
            <div className="flex-1">
              <label className="block font-semibold mb-1">Priorité</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className="border px-3 py-2 rounded w-full">
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
              </select>
              {errors.priority && <div className="text-error text-sm">{errors.priority}</div>}
            </div>
          </div>
          <div>
            <label className="block font-semibold mb-1">Échéance</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="border px-3 py-2 rounded w-full" />
            {errors.due_date && <div className="text-error text-sm">{errors.due_date}</div>}
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded font-semibold shadow flex items-center gap-2 transition" disabled={loading || !isFormValid || projectUsers.length === 0}>{loading ? 'Création...' : 'Créer'}</button>
            <Link href="/tasks" className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-5 py-2 rounded font-semibold flex items-center gap-2 transition"><FaArrowLeft /> Retour à la liste</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

Create.layout = page => <AdminLayout children={page} />;
export default Create; 