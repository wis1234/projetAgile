import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { FaFlagCheckered, FaProjectDiagram } from 'react-icons/fa';
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
    <div className="flex flex-col h-full w-full p-6">
      <div className="max-w-xl w-full mx-auto bg-white dark:bg-gray-800 rounded shadow p-8">
        {notification && (
          <div className={`mb-4 px-4 py-2 rounded text-white ${notificationType === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{notification}</div>
        )}
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-blue-700 dark:text-blue-200"><FaFlagCheckered className="text-green-600" /> Éditer le sprint</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-semibold mb-1">Nom du sprint</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="border px-3 py-2 rounded w-full focus:ring-2 focus:ring-blue-400" required />
            {errors.name && <div className="text-error text-sm mt-1">{errors.name}</div>}
          </div>
          <div>
            <label className="block font-semibold mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="border px-3 py-2 rounded w-full focus:ring-2 focus:ring-blue-400" rows={3} />
            {errors.description && <div className="text-error text-sm mt-1">{errors.description}</div>}
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block font-semibold mb-1">Date de début</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border px-3 py-2 rounded w-full focus:ring-2 focus:ring-blue-400" />
              {errors.start_date && <div className="text-error text-sm mt-1">{errors.start_date}</div>}
            </div>
            <div className="flex-1">
              <label className="block font-semibold mb-1">Date de fin</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border px-3 py-2 rounded w-full focus:ring-2 focus:ring-blue-400" />
              {errors.end_date && <div className="text-error text-sm mt-1">{errors.end_date}</div>}
            </div>
          </div>
          <div>
            <label className="block font-semibold mb-1">Projet</label>
            <select value={projectId} onChange={e => setProjectId(e.target.value)} className="border px-3 py-2 rounded w-full focus:ring-2 focus:ring-blue-400">
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
            {errors.project_id && <div className="text-error text-sm mt-1">{errors.project_id}</div>}
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded font-semibold shadow flex items-center gap-2" disabled={loading}>{loading ? 'Mise à jour...' : <>Mettre à jour</>}</button>
            <Link href="/sprints" className="bg-gray-100 hover:bg-blue-100 text-blue-700 px-5 py-2 rounded font-semibold flex items-center gap-2"><FaProjectDiagram /> Retour à la liste</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

Edit.layout = page => <AdminLayout children={page} />;
export default Edit; 