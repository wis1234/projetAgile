import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { Link } from '@inertiajs/react';
import { FaEdit, FaProjectDiagram } from 'react-icons/fa';

function Edit({ project }) {
  const { errors = {}, flash = {} } = usePage().props;
  const [name, setName] = useState(project.name || '');
  const [notification, setNotification] = useState(flash.success || flash.error || '');
  const [notificationType, setNotificationType] = useState(flash.success ? 'success' : 'error');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    router.put(`/projects/${project.id}`, { name }, {
      onSuccess: () => {
        setNotification('Projet mis à jour avec succès');
        setNotificationType('success');
        setLoading(false);
        setTimeout(() => router.visit('/projects'), 1200);
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
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-blue-700 dark:text-blue-200"><FaEdit /> Éditer le projet</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-semibold mb-1">Nom du projet</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="border px-3 py-2 rounded w-full focus:ring-2 focus:ring-blue-400" required />
            {errors.name && <div className="text-error text-sm mt-1">{errors.name}</div>}
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded font-semibold shadow flex items-center gap-2" disabled={loading}>{loading ? 'Mise à jour...' : <><FaEdit /> Mettre à jour</>}</button>
            <Link href="/projects" className="bg-gray-100 hover:bg-blue-100 text-blue-700 px-5 py-2 rounded font-semibold flex items-center gap-2"><FaProjectDiagram /> Retour à la liste</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

Edit.layout = page => <AdminLayout children={page} />;
export default Edit; 