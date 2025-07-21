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
    <div className="flex flex-col w-full h-screen bg-white dark:bg-gray-900 overflow-x-hidden rounded-none shadow-none p-0 m-0">
      <main className="flex-1 flex flex-col w-full bg-white dark:bg-gray-900 overflow-x-hidden overflow-y-auto p-0 m-0" style={{ height: 'calc(100vh - 4rem)' }}>
        <div className="flex flex-col h-full w-full max-w-7xl mx-auto mt-14 pt-4 bg-white dark:bg-gray-900">
          {notification && (
            <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded shadow-lg text-white transition-all ${notificationType === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{notification}</div>
          )}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <FaFlagCheckered className="text-3xl text-blue-600" />
              <h1 className="text-3xl font-extrabold text-blue-700 dark:text-blue-200 tracking-tight">Sprints</h1>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher un sprint..."
                  className="border px-3 py-2 rounded w-full md:w-64 mb-0 focus:ring-2 focus:ring-blue-400"
                />
                <button type="submit" className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded shadow font-semibold">
                  <FaSearch />
                </button>
              </form>
              <Link href="/sprints/create" className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded font-semibold shadow whitespace-nowrap">
                <FaPlus /> Nouveau sprint
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg shadow bg-white dark:bg-gray-800 mb-8">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow">
                <tr>
                  <th className="p-3 text-left font-bold">Sprint</th>
                  <th className="p-3 text-left font-bold">Projet</th>
                  <th className="p-3 text-left font-bold">Début</th>
                  <th className="p-3 text-left font-bold">Fin</th>
                </tr>
              </thead>
              <tbody>
                {sprints.data.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-gray-400 dark:text-gray-500 text-lg font-semibold">
                      Aucun sprint trouvé pour cette recherche.
                    </td>
                  </tr>
                ) : sprints.data.map(sprint => (
                  <tr
                    key={sprint.id}
                    className="hover:bg-blue-50 dark:hover:bg-blue-900 transition group cursor-pointer"
                    onClick={() => window.location.href = `/sprints/${sprint.id}`}
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') window.location.href = `/sprints/${sprint.id}`; }}
                  >
                    <td className="p-3 align-middle font-semibold text-blue-700 dark:text-blue-200 flex items-center gap-2 group-hover:text-blue-800 dark:group-hover:text-blue-100">
                      <FaFlagCheckered /> {sprint.name}
                    </td>
                    <td className="p-3 align-middle text-gray-600 dark:text-gray-300">{sprint.project?.name || '-'}</td>
                    <td className="p-3 align-middle text-gray-600 dark:text-gray-300">{sprint.start_date}</td>
                    <td className="p-3 align-middle text-gray-600 dark:text-gray-300">{sprint.end_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-center gap-2 mb-8">
            {sprints.links && sprints.links.map((link, i) => (
              <button
                key={i}
                className={`btn btn-sm rounded-full px-4 py-2 font-semibold shadow ${link.active ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-green-700 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-800'}`}
                disabled={!link.url}
                onClick={() => link.url && router.get(link.url)}
                dangerouslySetInnerHTML={{ __html: link.label }}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

Index.layout = page => <AdminLayout children={page} />;
export default Index; 