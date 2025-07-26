import React, { useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import { router, usePage } from '@inertiajs/react';
import { FaHistory, FaUserCircle, FaRegListAlt, FaProjectDiagram, FaTasks, FaFileAlt, FaUser, FaSearch } from 'react-icons/fa';
import { Inertia } from '@inertiajs/inertia';

export default function Index({ activities, users, filters = {}, types = [], flash = {} }) {
  const [userId, setUserId] = useState(filters.user_id || '');
  const [type, setType] = useState(filters.type || '');
  const [date, setDate] = useState(filters.date || '');
  const [notification, setNotification] = useState(flash.success || '');

  const handleFilter = (e) => {
    e.preventDefault();
    router.get('/activities', { user_id: userId, type, date }, { preserveState: true, replace: true });
  };

  const handleExport = () => {
    const params = new URLSearchParams({ user_id: userId, type, date }).toString();
    window.open(`/activities/export?${params}`, '_blank');
  };

  // Helper pour icône objet
  const getSubjectIcon = (type) => {
    if (!type) return <FaRegListAlt className="text-gray-400" />;
    if (type.includes('Project')) return <FaProjectDiagram className="text-blue-500" />;
    if (type.includes('Task')) return <FaTasks className="text-yellow-500" />;
    if (type.includes('File')) return <FaFileAlt className="text-green-500" />;
    if (type.includes('User')) return <FaUser className="text-purple-500" />;
    return <FaRegListAlt className="text-gray-400" />;
  };

  // Helper pour badge type
  const getTypeBadge = (type) => {
    const color = type === 'create' ? 'bg-green-100 text-green-800' : type === 'update' ? 'bg-yellow-100 text-yellow-800' : type === 'delete' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800';
    return <span className={`px-2 py-1 rounded text-xs font-bold capitalize ${color}`}>{type}</span>;
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-white dark:bg-gray-950 p-0 m-0">
      <main className="flex-1 flex flex-col w-full py-8 px-4 sm:px-6 lg:px-8">
        {/* Notification */}
        {notification && (
          <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-lg shadow-xl text-white transition-all bg-green-500`}>
            {notification}
          </div>
        )}

        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <FaHistory className="text-4xl text-blue-600 dark:text-blue-400" />
            <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight">Journal d'activité</h1>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button type="button" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold flex items-center gap-2 transition duration-200 hover:shadow-md whitespace-nowrap" onClick={handleExport}>
              <FaFileAlt /> Exporter Excel
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-8 border border-gray-200 dark:border-gray-700 transition duration-200 hover:shadow-lg">
          <form className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end" onSubmit={handleFilter}>
            <div>
              <label htmlFor="user-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Utilisateur</label>
              <select id="user-select" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200" value={userId} onChange={e => setUserId(e.target.value)}>
                <option value="">Tous</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="type-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type d'action</label>
              <select id="type-select" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200" value={type} onChange={e => setType(e.target.value)}>
                <option value="">Tous</option>
                {types.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="date-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date</label>
              <input type="date" id="date-input" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <button type="submit" className="md:col-span-1 lg:col-span-1 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition duration-200 hover:shadow-md">
              <FaSearch /> Filtrer
            </button>
          </form>
        </div>

        {/* Tableau activités */}
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition duration-200 hover:shadow-lg mb-8">
          <table className="min-w-full text-sm text-gray-700 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="p-4 text-left font-bold text-gray-800 dark:text-gray-200">Date</th>
                <th className="p-4 text-left font-bold text-gray-800 dark:text-gray-200">Utilisateur</th>
                <th className="p-4 text-left font-bold text-gray-800 dark:text-gray-200">Type</th>
                <th className="p-4 text-left font-bold text-gray-800 dark:text-gray-200">Description</th>
                <th className="p-4 text-left font-bold text-gray-800 dark:text-gray-200">Objet</th>
                <th className="p-4 text-left font-bold text-gray-800 dark:text-gray-200">IP</th>
              </tr>
            </thead>
            <tbody>
              {activities.data.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-gray-500 dark:text-gray-400 text-lg">
                    Aucune activité trouvée pour cette recherche.
                  </td>
                </tr>
              ) : activities.data.map(activity => (
                <tr
                  key={activity.id}
                  className="border-b border-gray-200 dark:border-gray-700 transition duration-150 ease-in-out hover:bg-blue-50 dark:hover:bg-gray-700 group cursor-pointer hover:shadow-md"
                  onClick={() => router.visit(`/activities/${activity.id}`)}
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') router.visit(`/activities/${activity.id}`); }}
                >
                  <td className="p-4 align-middle whitespace-nowrap">{new Date(activity.created_at).toLocaleString()}</td>
                  <td className="p-4 align-middle flex items-center gap-2">
                    {activity.user ? (
                      <img src={activity.user.profile_photo_url || (activity.user.profile_photo_path ? `/storage/${activity.user.profile_photo_path}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(activity.user.name)}`)} alt={activity.user.name} className="w-8 h-8 rounded-full shadow border-2 border-blue-200" />
                    ) : (
                      <FaUserCircle className="w-8 h-8 text-gray-400" />
                    )}
                    <span className="font-semibold text-blue-800 dark:text-blue-100">{activity.user ? activity.user.name : <span className="italic text-gray-400">Invité</span>}</span>
                    {activity.user?.roles && activity.user.roles.length > 0 && (
                      <span className="ml-2 px-2 py-1 rounded text-xs font-bold bg-yellow-100 text-yellow-800">{activity.user.roles[0].name}</span>
                    )}
                  </td>
                  <td className="p-4 align-middle whitespace-nowrap">{getTypeBadge(activity.type)}</td>
                  <td className="p-4 align-middle max-w-xs truncate text-gray-600 dark:text-gray-300" title={activity.description}>{activity.description}</td>
                  <td className="p-4 align-middle flex items-center gap-2">
                    {getSubjectIcon(activity.subject_type)}
                    <span>{activity.subject_type ? `${activity.subject_type.split('\\').pop()} #${activity.subject_id}` : '-'}</span>
                  </td>
                  <td className="p-4 align-middle whitespace-nowrap"><span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">{activity.ip_address}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-center gap-3 mb-8">
          {activities.links && activities.links.map((link, i) => (
            <button
              key={i}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition duration-200 
                ${link.active ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-600 hover:text-blue-800 dark:hover:text-white hover:shadow-sm'}
                ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              disabled={!link.url}
              onClick={() => link.url && router.get(link.url)}
              dangerouslySetInnerHTML={{ __html: link.label }}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

Index.layout = page => <AdminLayout children={page} />; 