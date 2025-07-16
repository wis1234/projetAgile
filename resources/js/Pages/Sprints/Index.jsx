import React, { useEffect, useState } from 'react';
import { router, usePage, Link } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { FaFlagCheckered, FaPlus, FaEdit, FaTrash, FaEye, FaSearch } from 'react-icons/fa';
import ActionButton from '../../Components/ActionButton';

function Index({ sprints, filters }) {
  const { flash = {} } = usePage().props;
  const [notification, setNotification] = useState(flash.success || '');
  const [notificationType, setNotificationType] = useState('success');
  const [search, setSearch] = useState(filters?.search || '');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    router.get('/sprints', { search }, { preserveState: true, replace: true });
  };

  const handleDelete = (id) => {
    if (confirm('Voulez-vous vraiment supprimer ce sprint ?')) {
      router.delete(`/sprints/${id}`, {
        onSuccess: () => {
          setNotification('Sprint supprimé avec succès');
          setNotificationType('success');
        },
        onError: () => {
          setNotification('Erreur lors de la suppression');
          setNotificationType('error');
        }
      });
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {notification && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded shadow-lg text-white transition-all ${notificationType === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {notification}
          <button onClick={() => setNotification('')} className="ml-4 text-white font-bold">&times;</button>
        </div>
      )}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-2 md:gap-0">
        <div className="flex gap-2 mb-4">
          <Link href="/sprints/create">
            <ActionButton variant="primary">Nouveau sprint</ActionButton>
          </Link>
        </div>
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 mb-4">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="border px-3 py-2 rounded w-full md:w-64 mb-0"
          />
          <button type="submit" className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded shadow font-semibold">
            <FaSearch />
          </button>
        </form>
      </div>
      <ul className="space-y-3">
        {sprints.data.length === 0 && <li className="text-gray-500">Aucun sprint trouvé.</li>}
        {sprints.data.map(sprint => (
          <li key={sprint.id} className="border p-4 rounded flex justify-between items-center bg-white shadow-sm hover:shadow-md transition">
            <div>
              <span className="font-medium text-lg flex items-center gap-2 text-green-700"><FaFlagCheckered /> {sprint.name}</span>
              <div className="text-sm text-gray-500">Projet : {sprint.project?.name || '-'}</div>
              <div className="text-xs text-gray-400">Du {sprint.start_date} au {sprint.end_date}</div>
            </div>
            <div className="flex gap-2">
              <Link href={route('sprints.show', sprint.id)}>
                <ActionButton variant="info" size="sm" className="flex items-center"><FaEye className="mr-1" /> Voir</ActionButton>
              </Link>
              <Link href={route('sprints.edit', sprint.id)}>
                <ActionButton variant="warning" size="sm" className="flex items-center"><FaEdit className="mr-1" /> Modifier</ActionButton>
              </Link>
              <ActionButton variant="danger" size="sm" className="flex items-center" onClick={() => handleDelete(sprint.id)}><FaTrash className="mr-1" /> Supprimer</ActionButton>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex justify-center mt-6 space-x-2">
        {sprints.links && sprints.links.map((link, i) => (
          <button
            key={i}
            disabled={!link.url}
            onClick={() => link.url && router.get(link.url, { search }, { preserveState: true, replace: true })}
            className={`px-3 py-1 rounded ${link.active ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'} ${!link.url ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-100'}`}
            dangerouslySetInnerHTML={{ __html: link.label }}
          />
        ))}
      </div>
    </div>
  );
}

Index.layout = page => <AdminLayout children={page} />;
export default Index; 