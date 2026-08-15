import React, { useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import { router } from '@inertiajs/react';
import {
  FaHistory, FaUserCircle, FaRegListAlt, FaProjectDiagram, FaTasks,
  FaFileAlt, FaUser, FaSearch, FaCommentDots, FaDownload, FaFilter,
  FaChevronRight, FaTimes, FaCalendarAlt, FaChartBar, FaSun
} from 'react-icons/fa';

// ─── Config visuelle par type d'activité (cohérente avec la page Show) ────
const TYPE_STYLES = {
  create:  { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800', dot: 'bg-emerald-500', label: 'Création' },
  update:  { badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800', dot: 'bg-amber-500', label: 'Modification' },
  delete:  { badge: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800', dot: 'bg-red-500', label: 'Suppression' },
  comment: { badge: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800', dot: 'bg-orange-500', label: 'Commentaire' },
  status:  { badge: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800', dot: 'bg-indigo-500', label: 'Statut' },
};
const DEFAULT_TYPE_STYLE = { badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800', dot: 'bg-blue-500', label: null };
const getTypeStyle = (type) => TYPE_STYLES[type] || DEFAULT_TYPE_STYLE;

const getSubjectIcon = (type) => {
  if (!type) return <FaRegListAlt className="w-3.5 h-3.5" />;
  if (type.includes('Project')) return <FaProjectDiagram className="w-3.5 h-3.5" />;
  if (type.includes('Task') && !type.includes('Comment')) return <FaTasks className="w-3.5 h-3.5" />;
  if (type.includes('File')) return <FaFileAlt className="w-3.5 h-3.5" />;
  if (type.includes('User')) return <FaUser className="w-3.5 h-3.5" />;
  if (type.includes('Comment')) return <FaCommentDots className="w-3.5 h-3.5" />;
  return <FaRegListAlt className="w-3.5 h-3.5" />;
};

const TypeBadge = ({ type }) => {
  const style = getTypeStyle(type);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${style.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {style.label || type}
    </span>
  );
};

export default function Index({ activities, users, filters = {}, types = [], stats = {}, typeLabels = {} }) {
  const [userId, setUserId] = useState(filters.user_id || '');
  const [type, setType] = useState(filters.type || '');
  const [date, setDate] = useState(filters.date || '');

  const hasActiveFilters = userId || type || date;

  const handleFilter = (e) => {
    e.preventDefault();
    router.get('/activities', { user_id: userId, type, date }, { preserveState: true, replace: true });
  };

  const clearFilters = () => {
    setUserId(''); setType(''); setDate('');
    router.get('/activities', {}, { preserveState: true, replace: true });
  };

  const handleExport = () => {
    const params = new URLSearchParams({ user_id: userId, type, date }).toString();
    window.open(`/activities/export?${params}`, '_blank');
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-gray-50 dark:bg-gray-950 p-0 m-0 overflow-x-hidden">
      <main className="flex-1 flex flex-col w-full min-w-0 py-4 sm:py-6 lg:py-8 px-2 sm:px-4 lg:px-8">

        {/* ─── Header avec dégradé ─── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 rounded-3xl shadow-lg shadow-blue-500/10 p-6 sm:p-8 mb-6">
          <div className="absolute -top-10 -right-10 w-56 h-56 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-16 -left-10 w-56 h-56 bg-white/5 rounded-full blur-2xl" />

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 min-w-0">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-inner">
                <FaHistory className="text-2xl text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-blue-100 uppercase tracking-widest mb-1">Suivi &amp; traçabilité</p>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate">Journal d'activité</h1>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center justify-center gap-2 bg-white text-indigo-700 hover:bg-blue-50 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm whitespace-nowrap flex-shrink-0"
            >
              <FaDownload className="w-3.5 h-3.5" /> Exporter
            </button>
          </div>
        </div>

        {/* ─── Stats + Filtres : côte à côte sur écran large ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)] gap-4 sm:gap-6 mb-6 min-w-0">

          {/* Carte stats */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 sm:p-6 min-w-0">
            <div className="flex items-center gap-2 mb-4">
              <FaChartBar className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Statistiques</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
              {stats.total !== undefined && (
                <div className="flex lg:flex-col items-center lg:items-start justify-between lg:justify-center gap-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 rounded-xl px-4 py-3">
                  <span className="text-2xl font-extrabold text-blue-700 dark:text-blue-300 leading-none">{stats.total}</span>
                  <span className="text-xs font-medium text-blue-600/80 dark:text-blue-300/70 whitespace-nowrap">activités au total</span>
                </div>
              )}
              {stats.today !== undefined && (
                <div className="flex lg:flex-col items-center lg:items-start justify-between lg:justify-center gap-1 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900 rounded-xl px-4 py-3">
                  <span className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-300 leading-none flex items-center gap-1.5">
                    <FaSun className="w-4 h-4 opacity-60" />{stats.today}
                  </span>
                  <span className="text-xs font-medium text-indigo-600/80 dark:text-indigo-300/70 whitespace-nowrap">aujourd'hui</span>
                </div>
              )}
            </div>
          </div>

          {/* Carte filtres */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 sm:p-6 min-w-0">
            <div className="flex items-center gap-2 mb-4">
              <FaFilter className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Filtrer les résultats</span>
            </div>

            <form onSubmit={handleFilter} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 min-w-0">
              <div className="min-w-0">
                <label htmlFor="user-select" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                  Utilisateur
                </label>
                <select
                  id="user-select"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white transition-colors"
                  value={userId}
                  onChange={e => setUserId(e.target.value)}
                >
                  <option value="">Tous les utilisateurs</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>

              <div className="min-w-0">
                <label htmlFor="type-select" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                  Type d'action
                </label>
                <select
                  id="type-select"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white transition-colors"
                  value={type}
                  onChange={e => setType(e.target.value)}
                >
                  <option value="">Tous les types</option>
                  {types.map(t => <option key={t} value={t}>{typeLabels[t] || t}</option>)}
                </select>
              </div>

              <div className="min-w-0">
                <label htmlFor="date-input" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  id="date-input"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white transition-colors"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>

              <div className="flex items-end gap-2 min-w-0">
                <button
                  type="submit"
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm"
                >
                  <FaSearch className="w-3.5 h-3.5" /> Filtrer
                </button>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300 transition-colors"
                    title="Réinitialiser les filtres"
                  >
                    <FaTimes className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* ─── Liste des activités ─── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden mb-8 min-w-0">

          {activities.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                <FaHistory className="w-7 h-7 text-gray-300 dark:text-gray-500" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Aucune activité trouvée</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Essayez d'ajuster vos filtres de recherche.</p>
            </div>
          ) : (
            <>
              {/* Vue tableau — desktop */}
              <div className="hidden lg:block overflow-x-auto min-w-0">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-700">
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Date</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Utilisateur</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Type</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Description</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Objet</th>
                      <th className="px-5 py-3.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                    {activities.data.map(activity => (
                      <tr
                        key={activity.id}
                        className="group cursor-pointer hover:bg-blue-50/60 dark:hover:bg-gray-700/40 transition-colors"
                        onClick={() => router.visit(`/activities/${activity.id}`)}
                        tabIndex={0}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') router.visit(`/activities/${activity.id}`); }}
                      >
                        <td className="px-5 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                          {new Date(activity.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            {activity.user ? (
                              <img
                                src={activity.user.profile_photo_url || (activity.user.profile_photo_path ? `/storage/${activity.user.profile_photo_path}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(activity.user.name)}&background=2563eb&color=fff`)}
                                alt={activity.user.name}
                                className="w-8 h-8 rounded-full object-cover border border-blue-100 dark:border-blue-900 flex-shrink-0"
                              />
                            ) : (
                              <FaUserCircle className="w-8 h-8 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">
                                {activity.user ? activity.user.name : <span className="italic text-gray-400 font-normal">Invité</span>}
                              </p>
                              {activity.user?.roles?.length > 0 && (
                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">{activity.user.roles[0].name}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <TypeBadge type={activity.type} />
                        </td>
                        <td className="px-5 py-4 max-w-xs">
                          <p className="truncate text-gray-600 dark:text-gray-300" title={activity.description}>
                            {activity.description || <span className="italic text-gray-400">—</span>}
                          </p>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs font-medium bg-gray-50 dark:bg-gray-900/40 px-2.5 py-1 rounded-full">
                            {getSubjectIcon(activity.subject_type)}
                            {activity.subject_type ? `${activity.subject_type.split('\\').pop()} #${activity.subject_id}` : '—'}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <FaChevronRight className="w-3 h-3 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all inline-block" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vue cartes — mobile / tablette */}
              <div className="lg:hidden divide-y divide-gray-100 dark:divide-gray-700/60">
                {activities.data.map(activity => (
                  <div
                    key={activity.id}
                    onClick={() => router.visit(`/activities/${activity.id}`)}
                    className="p-4 active:bg-blue-50 dark:active:bg-gray-700/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {activity.user ? (
                          <img
                            src={activity.user.profile_photo_url || (activity.user.profile_photo_path ? `/storage/${activity.user.profile_photo_path}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(activity.user.name)}&background=2563eb&color=fff`)}
                            alt={activity.user.name}
                            className="w-9 h-9 rounded-full object-cover border border-blue-100 dark:border-blue-900 flex-shrink-0"
                          />
                        ) : (
                          <FaUserCircle className="w-9 h-9 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">
                            {activity.user ? activity.user.name : <span className="italic text-gray-400 font-normal">Invité</span>}
                          </p>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <FaCalendarAlt className="w-2.5 h-2.5" />
                            {new Date(activity.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <TypeBadge type={activity.type} />
                    </div>

                    {activity.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">{activity.description}</p>
                    )}

                    <div className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs font-medium bg-gray-50 dark:bg-gray-900/40 px-2.5 py-1 rounded-full">
                      {getSubjectIcon(activity.subject_type)}
                      {activity.subject_type ? `${activity.subject_type.split('\\').pop()} #${activity.subject_id}` : '—'}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ─── Pagination ─── */}
        {activities.links && activities.links.length > 3 && (
          <div className="flex flex-wrap justify-center gap-1.5 mb-8">
            {activities.links.map((link, i) => (
              <button
                key={i}
                disabled={!link.url}
                onClick={() => link.url && router.get(link.url)}
                className={`min-w-[2.5rem] px-3 py-2 text-sm font-semibold rounded-lg transition-colors
                  ${link.active
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}
                  ${!link.url ? 'opacity-40 cursor-not-allowed' : ''}
                `}
                dangerouslySetInnerHTML={{ __html: link.label }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

Index.layout = page => <AdminLayout children={page} />;