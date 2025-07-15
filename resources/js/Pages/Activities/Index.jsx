import React, { useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import { router, usePage } from '@inertiajs/react';
import { FaHistory, FaUserCircle, FaRegListAlt, FaProjectDiagram, FaTasks, FaFileAlt, FaUser } from 'react-icons/fa';

export default function Index({ activities, users, filters = {}, types = [] }) {
  const [userId, setUserId] = useState(filters.user_id || '');
  const [type, setType] = useState(filters.type || '');
  const [date, setDate] = useState(filters.date || '');

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
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-extrabold flex items-center gap-3 text-blue-700 dark:text-blue-200 tracking-tight drop-shadow"><FaHistory /> Journal d'activité</h1>
        <button type="button" className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-lg font-semibold shadow flex items-center gap-2 transition" onClick={handleExport}><FaFileAlt /> Exporter Excel</button>
      </div>
      {/* Filtres */}
      <form className="flex flex-wrap gap-4 mb-6 items-end bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-700 p-4 rounded shadow" onSubmit={handleFilter}>
        <div>
          <label className="block text-sm font-semibold mb-1">Utilisateur</label>
          <select className="border px-3 py-2 rounded w-40" value={userId} onChange={e => setUserId(e.target.value)}>
            <option value="">Tous</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Type d'action</label>
          <select className="border px-3 py-2 rounded w-40" value={type} onChange={e => setType(e.target.value)}>
            <option value="">Tous</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Date</label>
          <input type="date" className="border px-3 py-2 rounded w-40" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow font-semibold flex items-center gap-2"><FaRegListAlt /> Filtrer</button>
      </form>
      <div className="overflow-x-auto rounded-lg shadow bg-white dark:bg-gray-800">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-gradient-to-r from-blue-100 to-blue-300 dark:from-blue-900 dark:to-blue-700 shadow">
            <tr>
              <th className="p-4 text-left font-bold whitespace-nowrap">Date</th>
              <th className="p-4 text-left font-bold whitespace-nowrap">Utilisateur</th>
              <th className="p-4 text-left font-bold whitespace-nowrap">Type</th>
              <th className="p-4 text-left font-bold">Description</th>
              <th className="p-4 text-left font-bold whitespace-nowrap">Objet</th>
              <th className="p-4 text-left font-bold whitespace-nowrap">IP</th>
            </tr>
          </thead>
          <tbody>
            {activities.data.map(activity => (
              <tr key={activity.id} className="border-b last:border-0 hover:bg-blue-50 dark:hover:bg-blue-900 transition cursor-pointer" onClick={() => router.visit(`/activities/${activity.id}`)}>
                <td className="p-4 whitespace-nowrap">{new Date(activity.created_at).toLocaleString()}</td>
                <td className="p-4 flex items-center gap-2">
                  {activity.user ? (
                    <img src={activity.user.profile_photo_url || (activity.user.profile_photo_path ? `/storage/${activity.user.profile_photo_path}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(activity.user.name)}`)} alt={activity.user.name} className="w-8 h-8 rounded-full shadow border-2 border-blue-200" />
                  ) : (
                    <FaUserCircle className="w-8 h-8 text-gray-400" />
                  )}
                  <span className="font-semibold text-black dark:text-blue-100">{activity.user ? activity.user.name : <span className="italic text-gray-400">Invité</span>}</span>
                  {activity.user?.roles && activity.user.roles.length > 0 && (
                    <span className="ml-2 px-2 py-1 rounded text-xs font-bold bg-yellow-100 text-yellow-800">{activity.user.roles[0].name}</span>
                  )}
                </td>
                <td className="p-4 whitespace-nowrap">{getTypeBadge(activity.type)}</td>
                <td className="p-4 max-w-xs truncate" title={activity.description}>{activity.description}</td>
                <td className="p-4 flex items-center gap-2">
                  {getSubjectIcon(activity.subject_type)}
                  <span>{activity.subject_type ? `${activity.subject_type.split('\\').pop()} #${activity.subject_id}` : '-'}</span>
                </td>
                <td className="p-4 whitespace-nowrap"><span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">{activity.ip_address}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="flex justify-center mt-6 gap-2">
        {activities.links && activities.links.map((link, i) => (
          <button
            key={i}
            className={`px-3 py-1 rounded ${link.active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} ${!link.url ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-100'}`}
            disabled={!link.url}
            onClick={() => link.url && window.location.assign(link.url)}
            dangerouslySetInnerHTML={{ __html: link.label }}
          />
        ))}
      </div>
    </div>
  );
}

Index.layout = page => <AdminLayout children={page} />; 