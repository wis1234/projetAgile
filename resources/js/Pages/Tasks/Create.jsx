import React, { useState } from 'react';
import { router, usePage, Link } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { FaTasks, FaArrowLeft, FaUserCircle } from 'react-icons/fa';

function Create({ projects = [], sprints = [] }) {
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
  const [assignedTo, setAssignedTo] = useState('');
  const [notification, setNotification] = useState(flash.success || flash.error || '');
  const [notificationType, setNotificationType] = useState(flash.success ? 'success' : 'error');
  const [loading, setLoading] = useState(false);
  const hasProjects = projects.length > 0;

  const isFormValid = title && projectId && sprintId && assignedTo && status;

  // Mettre à jour assignedTo quand le projet change
  const handleProjectChange = (e) => {
    setProjectId(e.target.value);
    const proj = projects.find(p => p.id == e.target.value);
    setAssignedTo(proj?.users[0]?.id || ''); // Assign the first user of the newly selected project
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
        setTitle(''); setDescription(''); setDueDate(''); setAssignedTo(''); setProjectId(projects[0]?.id || ''); setSprintId(sprints[0]?.id || ''); setStatus('todo'); setPriority('medium');
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
    <div className="flex flex-col w-full bg-white p-0 m-0 min-h-screen">
      <div className="flex flex-col w-full py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/tasks" className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 p-3 rounded-lg transition duration-200 hover:shadow-sm">
            <FaArrowLeft className="text-xl" />
          </Link>
          <FaTasks className="text-4xl text-blue-600 dark:text-blue-400" />
          <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight">Créer une tâche</h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 mb-8 border border-gray-200 dark:border-gray-700 transition duration-200 hover:shadow-lg">
          {notification && (
            <div className={`mb-6 px-4 py-3 rounded-lg text-white font-semibold ${notificationType === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{notification}</div>
          )}
          {!hasProjects && (
            <div className="mb-6 px-4 py-3 rounded-lg bg-yellow-100 text-yellow-800 font-semibold text-center">
              Vous n'êtes manager d'aucun projet. Veuillez demander à un administrateur de vous rattacher à un projet pour pouvoir créer une tâche.
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Titre <span className="text-red-500">*</span></label>
              <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200" required disabled={!hasProjects} />
              {errors.title && <div className="text-red-600 text-sm mt-2 font-medium">{errors.title}</div>}
            </div>

            <div>
              <label htmlFor="project" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Projet <span className="text-red-500">*</span></label>
              <select id="project" value={projectId} onChange={handleProjectChange} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200" required disabled={!hasProjects}>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
              {errors.project_id && <div className="text-red-600 text-sm mt-2 font-medium">{errors.project_id}</div>}
            </div>

            <div>
              <label htmlFor="sprint" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Sprint <span className="text-red-500">*</span></label>
              <select id="sprint" value={sprintId} onChange={e => setSprintId(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200" required disabled={!hasProjects}>
                {sprints.filter(s => s.project_id == projectId).map(sprint => (
                  <option key={sprint.id} value={sprint.id}>{sprint.name}</option>
                ))}
              </select>
              {errors.srint_id && <div className="text-red-600 text-sm mt-2 font-medium">{errors.sprint_id}</div>}
            </div>

            <div>
              <label htmlFor="assigned_to" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Assigné à <span className="text-red-500">*</span></label>
              <select id="assigned_to" value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200" required disabled={projectUsers.length === 0 || !hasProjects}>
                <option value="" disabled>Sélectionnez un membre</option>
                {projectUsers.length === 0 && <option value="">Aucun membre disponible</option>}
                {projectUsers.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
              {projectUsers.length === 0 && <div className="text-red-600 text-sm mt-2 font-medium">Aucun membre disponible pour ce projet.</div>}
              {errors.assigned_to && <div className="text-red-600 text-sm mt-2 font-medium">{errors.assigned_to}</div>}
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Statut</label>
              <select id="status" value={status} onChange={e => setStatus(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200" disabled={!hasProjects}>
                <option value="todo">À faire</option>
                <option value="in_progress">En cours</option>
                <option value="done">Terminé</option>
              </select>
              {errors.status && <div className="text-red-600 text-sm mt-2 font-medium">{errors.status}</div>}
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Priorité</label>
              <select id="priority" value={priority} onChange={e => setPriority(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200" disabled={!hasProjects}>
                <option value="low">Faible</option>
                <option value="medium">Moyenne</option>
                <option value="high">Élevée</option>
              </select>
              {errors.priority && <div className="text-red-600 text-sm mt-2 font-medium">{errors.priority}</div>}
            </div>

            <div>
              <label htmlFor="due_date" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date d'échéance</label>
              <input type="date" id="due_date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200" disabled={!hasProjects} />
              {errors.due_date && <div className="text-red-600 text-sm mt-2 font-medium">{errors.due_date}</div>}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description</label>
              <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows="4" className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 resize-y" placeholder="Décrivez brièvement la tâche (optionnel)" disabled={!hasProjects} />
              {errors.description && <div className="text-red-600 text-sm mt-2 font-medium">{errors.description}</div>}
            </div>

            <div className="md:col-span-2 flex justify-end gap-4 mt-6">
              <button type="submit" className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading || !isFormValid || projectUsers.length === 0 || !hasProjects}>
                {loading ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Création...</>) : (<><FaTasks /> Créer la tâche</>)}
              </button>
              <Link href="/tasks" className="flex-1 md:flex-none bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-semibold transition duration-200 flex items-center justify-center gap-2 hover:shadow-sm">
                <FaArrowLeft /> Annuler
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