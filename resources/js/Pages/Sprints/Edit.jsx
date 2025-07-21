import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { FaFlagCheckered, FaProjectDiagram, FaArrowLeft } from 'react-icons/fa';
import { Link } from '@inertiajs/react';

function Edit({ sprint, projects }) {
  const { errors = {}, flash = {} } = usePage().props;
  const [name, setName] = useState(sprint.name || '');
  const [description, setDescription] = useState(sprint.description || '');
  const [startDate, setStartDate] = useState(sprint.start_date || '');
  const [endDate, setEndDate] = useState(sprint.end_date || '');
  const [projectId, setProjectId] = useState(sprint.project_id || projects[0]?.id || '');
  const [notification, setNotification] = useState(flash.success || flash.error || '');
  const [notificationType, setNotificationType] = useState(flash.success ? 'success' : 'error');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    router.put(`/sprints/${sprint.id}`, { name, description, start_date: startDate, end_date: endDate, project_id: projectId }, {
      onSuccess: () => {
        setNotification('Sprint mis à jour avec succès');
        setNotificationType('success');
        setLoading(false);
        setTimeout(() => router.visit('/sprints'), 1200);
      },
      onError: () => {
        setNotification('Erreur lors de la mise à jour');
        setNotificationType('error');
        setLoading(false);
      }
    });
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-white dark:bg-gray-900 overflow-x-hidden p-0 m-0">
      <main className="flex-1 flex flex-col w-full bg-white dark:bg-gray-900 overflow-x-hidden p-0 m-0">
        <div className="flex flex-col w-full max-w-4xl mx-auto mt-14 pt-4 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-3 mb-8">
            <Link href="/sprints" className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-100 transition">
              <FaArrowLeft className="text-xl" />
            </Link>
            <FaFlagCheckered className="text-3xl text-blue-600" />
            <h1 className="text-3xl font-extrabold text-blue-700 dark:text-blue-200 tracking-tight">Modifier le sprint</h1>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-2xl mx-auto w-full">
            {notification && (
              <div className={`mb-6 px-4 py-3 rounded-lg text-white font-semibold ${notificationType === 'success' ? 'bg-blue-500' : 'bg-red-500'}`}>{notification}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nom du sprint *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition" required />
                {errors.name && <div className="text-red-600 text-sm mt-2 font-medium">{errors.name}</div>}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows="4" className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition resize-none" placeholder="Décrivez brièvement le sprint (optionnel)" />
                {errors.description && <div className="text-red-600 text-sm mt-2 font-medium">{errors.description}</div>}
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Date de début</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition" />
                  {errors.start_date && <div className="text-red-600 text-sm mt-2 font-medium">{errors.start_date}</div>}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Date de fin</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition" />
                  {errors.end_date && <div className="text-red-600 text-sm mt-2 font-medium">{errors.end_date}</div>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Projet</label>
                <select value={projectId} onChange={e => setProjectId(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition">
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
                {errors.project_id && <div className="text-red-600 text-sm mt-2 font-medium">{errors.project_id}</div>}
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading}>
                  {loading ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Mise à jour...</>) : (<><FaFlagCheckered /> Mettre à jour</>)}
                </button>
                <Link href="/sprints" className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2">
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