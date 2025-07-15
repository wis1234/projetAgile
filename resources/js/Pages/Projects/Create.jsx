import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { Link } from '@inertiajs/react';
import { FaPlus, FaProjectDiagram } from 'react-icons/fa';

function Create() {
  const { errors = {}, flash = {} } = usePage().props;
  const [name, setName] = useState('');
  const [notification, setNotification] = useState(flash.success || flash.error || '');
  const [notificationType, setNotificationType] = useState(flash.success ? 'success' : 'error');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    router.post('/projects', { name }, {
      onSuccess: () => {
        setNotification('Projet créé avec succès');
        setNotificationType('success');
        setName('');
        setLoading(false);
        setTimeout(() => router.visit('/projects'), 1200);
      },
      onError: () => {
        setNotification('Erreur lors de la création');
        setNotificationType('error');
        setLoading(false);
      }
    });
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white dark:bg-gray-800 rounded shadow">
      {notification && (
        <div className={`mb-4 px-4 py-2 rounded text-white ${notificationType === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{notification}</div>
      )}
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-blue-700 dark:text-blue-200"><FaPlus /> Créer un projet</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block font-semibold mb-1">Nom du projet</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className="border px-3 py-2 rounded w-full focus:ring-2 focus:ring-blue-400" required />
          {errors.name && <div className="text-error text-sm mt-1">{errors.name}</div>}
        </div>
        <div className="flex gap-2 mt-4">
          <button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded font-semibold shadow flex items-center gap-2" disabled={loading}>{loading ? 'Création...' : <><FaPlus /> Créer</>}</button>
          <Link href="/projects" className="bg-gray-100 hover:bg-blue-100 text-blue-700 px-5 py-2 rounded font-semibold flex items-center gap-2"><FaProjectDiagram /> Retour à la liste</Link>
        </div>
      </form>
    </div>
  );
}

Create.layout = page => <AdminLayout children={page} />;
export default Create; 