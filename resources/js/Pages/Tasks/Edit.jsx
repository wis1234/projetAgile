import React, { useState } from 'react';
import { router, usePage, Link } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { FaTasks, FaArrowLeft, FaUserCircle } from 'react-icons/fa';

function Edit({ task, projects = [], sprints = [] }) {
  const { errors = {}, flash = {} } = usePage().props;
  const [title, setTitle] = useState(task.title || '');
  const [description, setDescription] = useState(task.description || '');
  const [status, setStatus] = useState(task.status || 'todo');
  const [dueDate, setDueDate] = useState(task.due_date || '');
  const [priority, setPriority] = useState(task.priority || 'medium');
  const [projectId, setProjectId] = useState(task.project_id || projects[0]?.id || '');
  const [sprintId, setSprintId] = useState(task.sprint_id || sprints[0]?.id || '');
  // Trouver les membres du projet sélectionné
  const selectedProject = projects.find(p => p.id == projectId);
  const projectUsers = selectedProject?.users || [];
  const [assignedTo, setAssignedTo] = useState(task.assigned_to || projectUsers[0]?.id || '');
  const [notification, setNotification] = useState(flash.success || flash.error || '');
  const [notificationType, setNotificationType] = useState(flash.success ? 'success' : 'error');
  const [loading, setLoading] = useState(false);

  // Mettre à jour assignedTo quand le projet change
  const handleProjectChange = (e) => {
    setProjectId(e.target.value);
    const proj = projects.find(p => p.id == e.target.value);
    setAssignedTo(proj?.users[0]?.id || '');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    router.put(`/tasks/${task.id}`, {
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
        setNotification('Tâche mise à jour avec succès');
        setNotificationType('success');
        setLoading(false);
        setTimeout(() => router.visit('/tasks'), 1200);
      },
      onError: () => {
        setNotification('Erreur lors de la mise à jour');
        setNotificationType('error');
        setLoading(false);
      }
    });
  };

  return (
    <div className="flex flex-col w-full h-screen bg-white dark:bg-gray-900 overflow-x-hidden rounded-none shadow-none p-0 m-0">
      <main className="flex-1 flex flex-col w-full bg-white dark:bg-gray-900 overflow-x-hidden overflow-y-auto p-0 m-0" style={{ height: 'calc(100vh - 4rem)' }}>
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto mt-14 pt-4 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-3 mb-8">
            <Link href="/tasks" className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-100 transition">
              <FaArrowLeft className="text-xl" />
            </Link>
            <FaTasks className="text-3xl text-blue-600" />
            <h1 className="text-3xl font-extrabold text-blue-700 dark:text-blue-200 tracking-tight">Éditer la tâche</h1>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-2xl mx-auto w-full">
            {notification && (
              <div className={`mb-6 px-4 py-3 rounded-lg text-white font-semibold ${notificationType === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{notification}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Titre *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition" required />
                {errors.title && <div className="text-red-600 text-sm mt-2 font-medium">{errors.title}</div>}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows="4" className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition resize-none" placeholder="Décrivez brièvement la tâche (optionnel)" />
                {errors.description && <div className="text-red-600 text-sm mt-2 font-medium">{errors.description}</div>}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Projet</label>
                <select value={projectId} onChange={handleProjectChange} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition" required>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
                {errors.project_id && <div className="text-red-600 text-sm mt-2 font-medium">{errors.project_id}</div>}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Sprint</label>
                <select value={sprintId} onChange={e => setSprintId(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition" required>
                  {sprints.map(sprint => (
                    <option key={sprint.id} value={sprint.id}>{sprint.name}</option>
                  ))}
                </select>
                {errors.sprint_id && <div className="text-red-600 text-sm mt-2 font-medium">{errors.sprint_id}</div>}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Assigné à</label>
                <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition" required disabled={projectUsers.length === 0}>
                  {projectUsers.length === 0 && <option value="">Aucun membre</option>}
                  {projectUsers.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
                {errors.assigned_to && <div className="text-red-600 text-sm mt-2 font-medium">{errors.assigned_to}</div>}
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Statut</label>
                  <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition">
                    <option value="todo">À faire</option>
                    <option value="in_progress">En cours</option>
                    <option value="done">Terminé</option>
                  </select>
                  {errors.status && <div className="text-red-600 text-sm mt-2 font-medium">{errors.status}</div>}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Priorité</label>
                  <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition">
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                  </select>
                  {errors.priority && <div className="text-red-600 text-sm mt-2 font-medium">{errors.priority}</div>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Échéance</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition" />
                {errors.due_date && <div className="text-red-600 text-sm mt-2 font-medium">{errors.due_date}</div>}
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading}>
                  {loading ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Mise à jour...</>) : (<><FaTasks /> Mettre à jour</>)}
                </button>
                <Link href="/tasks" className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2">
                  <FaArrowLeft /> Annuler
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

Edit.layout = page => <AdminLayout children={page} />;
export default Edit; 