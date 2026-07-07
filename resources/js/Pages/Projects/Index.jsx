import React, { useEffect, useState, useCallback, useRef } from 'react';
import { router, Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AdminLayout from '../../Layouts/AdminLayout';
import {
  FaProjectDiagram, FaPlus, FaUserFriends, FaTasks, FaSearch,
  FaCalendarAlt, FaSort, FaSortUp, FaSortDown, FaChevronDown,
  FaChevronUp, FaTimes, FaCheck, FaClock, FaExclamationTriangle,
  FaChartLine, FaFilter, FaVolumeMute, FaUsers, FaRocket, FaCheckCircle
} from 'react-icons/fa';
import { HiOutlineViewGrid, HiOutlineViewList } from 'react-icons/hi';

// ── Status helpers ───────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  nouveau:    { label: 'Nouveau',     color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300', dot: 'bg-gray-400' },
  demarrage:  { label: 'Démarrage',   color: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300', dot: 'bg-green-500' },
  en_cours:   { label: 'En cours',    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300', dot: 'bg-blue-500' },
  avance:     { label: 'Avancé',      color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300', dot: 'bg-indigo-500' },
  termine:    { label: 'Terminé',     color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', dot: 'bg-emerald-500' },
  suspendu:   { label: 'Suspendu',    color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', dot: 'bg-red-500' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.nouveau;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ── Summary card ─────────────────────────────────────────────────────────────

const SummaryCard = ({ label, value, icon: Icon, color, sub }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="text-xl text-white" />
    </div>
    <div>
      <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{value ?? 0}</p>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-red-500 font-semibold mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ── Filter panel (recherche manuelle, statut auto) ───────────────────────────

const FilterPanel = ({ filters, statusOptions, searchValue, onSearchChange, onSearchSubmit, onStatusChange, onReset }) => {
  const [open, setOpen] = useState(true);
  const activeCount = (filters.status ? 1 : 0) + (filters.search ? 1 : 0);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSearchSubmit();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center gap-3">
          <FaFilter className="text-blue-500" />
          <span className="font-semibold text-gray-700 dark:text-gray-200">Filtres & Recherche</span>
          {activeCount > 0 && (
            <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 font-bold">
              {activeCount}
            </span>
          )}
        </div>
        {open ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {/* Search */}
            <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Recherche</label>
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Nom du projet..."
                    className="pl-9 pr-4 py-2 text-sm w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <button
                  onClick={onSearchSubmit}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  <FaSearch />
                </button>
              </div>
            </div>

            {/* Status filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Statut</label>
              <select
                value={filters.status || ''}
                onChange={(e) => onStatusChange(e.target.value)}
                className="text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">Tous</option>
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {activeCount > 0 && (
            <div className="flex items-center gap-3 mt-5">
              <button
                onClick={onReset}
                className="flex items-center gap-2 text-gray-500 hover:text-red-600 text-sm font-medium transition-colors"
              >
                <FaTimes className="text-xs" /> Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Sort header ──────────────────────────────────────────────────────────────

const SortHeader = ({ label, field, current, dir, onSort }) => {
  const active = current === field;
  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
    >
      {label}
      <span className="ml-1 opacity-50 group-hover:opacity-100">
        {active ? (dir === 'asc' ? <FaSortUp /> : <FaSortDown />) : <FaSort className="text-xs" />}
      </span>
    </button>
  );
};

// ── Main component ───────────────────────────────────────────────────────────

const Index = ({
  projects: initialProjects = { data: [], links: [], total: 0 },
  filters: initialFilters = {},
  globalStats = { total: 0, active: 0, completed: 0, totalTasks: 0 },
}) => {
  const { t } = useTranslation();
  const { flash = {} } = usePage().props;
  const [viewMode, setViewMode] = useState('cards'); // ✅ Vue par défaut : cartes
  const [filters, setFilters] = useState(initialFilters);
  const [searchInput, setSearchInput] = useState(initialFilters.search || '');
  const [notification, setNotification] = useState(flash.success || '');
  const [notificationType, setNotificationType] = useState('success');

  const isFirstRender = useRef(true);
  const debounceTimer = useRef(null);

  const projects = Array.isArray(initialProjects) ? initialProjects : (initialProjects.data || []);
  const pagination = !Array.isArray(initialProjects) ? initialProjects : null;

  // ❌ Suppression de la détection automatique de la vue (qui remettait en mode tableau sur desktop)
  // L'utilisateur choisit manuellement son mode via les boutons.

  // Auto‑apply des filtres (sauf recherche, qui est manuelle)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      router.get('/projects', filters, { preserveState: true, replace: true });
    }, 300);
    return () => clearTimeout(debounceTimer.current);
  }, [filters]);

  const handleSort = useCallback((field) => {
    const newDir = filters.sort_by === field && filters.sort_dir === 'asc' ? 'desc' : 'asc';
    setFilters(prev => ({ ...prev, sort_by: field, sort_dir: newDir }));
  }, [filters]);

  const handleReset = () => {
    setSearchInput('');
    setFilters({});
  };

  const handleStatusChange = (status) => {
    setFilters(prev => ({ ...prev, status: status || undefined }));
  };

  const handleSearchSubmit = () => {
    setFilters(prev => ({ ...prev, search: searchInput || undefined }));
  };

  // Notifications flash
  useEffect(() => {
    if (flash.success) {
      setNotification(flash.success);
      setNotificationType('success');
    }
  }, [flash.success]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification('');
        setNotificationType('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // WebSocket (Echo)
  useEffect(() => {
    if (window.Echo) {
      const channel = window.Echo.channel('projects');
      channel.listen('ProjectUpdated', () => {
        setNotification('Un projet a été modifié');
        setNotificationType('success');
        router.reload({ only: ['projects'] });
      });
      return () => {
        channel.stopListening('ProjectUpdated');
      };
    }
  }, []);

  const statusOptions = Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({ value, label }));

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Notification flash */}
        {notification && (
          <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-sm ${
            notificationType === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200'
          }`}>
            {notificationType === 'success' ? <FaCheck /> : <FaExclamationTriangle />}
            <span className="font-medium text-sm">{notification}</span>
          </div>
        )}

        {/* En‑tête */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {t('project_management')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {globalStats.total} projet{globalStats.total !== 1 ? 's' : ''} au total
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/projects/create"
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm hover:shadow-md"
            >
              <FaPlus /> {t('new_project')}
            </Link>
          </div>
        </div>

        {/* Cartes statistiques globales */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard label="Total projets" value={globalStats.total} icon={FaProjectDiagram} color="bg-blue-500" />
          <SummaryCard label="Projets actifs" value={globalStats.active} icon={FaRocket} color="bg-amber-500" />
          <SummaryCard label="Projets terminés" value={globalStats.completed} icon={FaCheckCircle} color="bg-emerald-500" />
          <SummaryCard label="Tâches totales" value={globalStats.totalTasks} icon={FaTasks} color="bg-indigo-500" />
        </div>

        {/* Panneau de filtres */}
        <FilterPanel
          filters={filters}
          statusOptions={statusOptions}
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          onSearchSubmit={handleSearchSubmit}
          onStatusChange={handleStatusChange}
          onReset={handleReset}
        />

        {/* Barre d'affichage & vue */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {pagination?.total !== undefined
              ? `${pagination.from ?? 0}–${pagination.to ?? 0} sur ${pagination.total} résultats`
              : `${projects.length} résultats`}
          </p>
          <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-blue-600'
              }`}
            >
              <HiOutlineViewList /> Tableau
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'cards'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-blue-600'
              }`}
            >
              <HiOutlineViewGrid /> Cartes
            </button>
          </div>
        </div>

        {/* VUE TABLEAU (inchangé) */}
        {viewMode === 'table' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm divide-y divide-gray-100 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800/80">
                  <tr>
                    {[
                      { label: 'Projet', field: 'name' },
                      { label: 'Membres', field: 'users_count' },
                      { label: 'Tâches', field: 'tasks_count' },
                      { label: 'Date création', field: 'created_at' },
                      { label: 'Statut', field: 'status' },
                    ].map(col => (
                      <th key={col.label} className="px-5 py-3.5 text-left">
                        <SortHeader
                          label={col.label}
                          field={col.field}
                          current={filters.sort_by}
                          dir={filters.sort_dir}
                          onSort={handleSort}
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {projects.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center">
                        <FaProjectDiagram className="mx-auto text-4xl text-gray-300 dark:text-gray-600 mb-3" />
                        <p className="text-gray-400 dark:text-gray-500 font-medium">Aucun projet trouvé</p>
                        <Link href="/projects/create" className="mt-3 inline-flex items-center gap-2 text-blue-600 hover:underline text-sm font-semibold">
                          <FaPlus className="text-xs" /> Créer un projet
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    projects.map(project => (
                      <tr
                        key={project.id}
                        className="hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors cursor-pointer group"
                        onClick={() => router.visit(`/projects/${project.id}`)}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                              <FaProjectDiagram />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-2">
                                <span>{project.name}</span>
                                {project.is_muted && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-red-800 bg-red-100 dark:bg-red-900/30 dark:text-red-300 rounded-full">
                                    <FaVolumeMute className="text-red-500 text-xs" />
                                    <span>En sourdine</span>
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-400">ID: {project.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <FaUsers className="text-gray-400" />
                            <span>{project.users_count || 0}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <FaTasks className="text-gray-400" />
                            <span>{project.tasks_count || 0}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                            <FaCalendarAlt className="text-gray-400" />
                            {new Date(project.created_at).toLocaleDateString('fr-FR')}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={project.status || 'nouveau'} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VUE CARTES (modifiée pour 3 colonnes max) */}
        {viewMode === 'cards' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.length === 0 ? (
              <div className="col-span-full py-16 text-center">
                <FaProjectDiagram className="mx-auto text-5xl text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-400 dark:text-gray-500 font-medium">Aucun projet trouvé</p>
              </div>
            ) : (
              projects.map(project => (
                <div
                  key={project.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
                  onClick={() => router.visit(`/projects/${project.id}`)}
                >
                  <div className={`w-full h-1 rounded-full mb-4 ${STATUS_CONFIG[project.status]?.dot.replace('bg-', 'bg-') || 'bg-gray-300'}`} />
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-sm">
                        <FaProjectDiagram />
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 text-sm leading-snug">
                        {project.name}
                      </h3>
                    </div>
                    <StatusBadge status={project.status || 'nouveau'} />
                  </div>
                  {project.is_muted && (
                    <div className="mb-3 inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-red-800 bg-red-100 dark:bg-red-900/30 dark:text-red-300 rounded-full">
                      <FaVolumeMute className="text-red-500 text-xs" />
                      <span>En sourdine</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 mt-3 mb-4">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-2 text-center">
                      <div className="flex items-center justify-center gap-1 text-gray-600 dark:text-gray-300">
                        <FaUsers className="text-blue-400 text-xs" />
                        <span className="text-sm font-bold">{project.users_count || 0}</span>
                      </div>
                      <p className="text-xs text-gray-400">Membres</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-2 text-center">
                      <div className="flex items-center justify-center gap-1 text-gray-600 dark:text-gray-300">
                        <FaTasks className="text-emerald-400 text-xs" />
                        <span className="text-sm font-bold">{project.tasks_count || 0}</span>
                      </div>
                      <p className="text-xs text-gray-400">Tâches</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500">
                    <span>Créé le {new Date(project.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination?.links && pagination.links.length > 3 && (
          <div className="flex flex-wrap justify-center gap-2">
            {pagination.links.map((link, i) => (
              <button
                key={i}
                disabled={!link.url}
                onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                className={`min-w-[36px] px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                  link.active
                    ? 'bg-blue-600 text-white shadow-sm'
                    : !link.url
                    ? 'opacity-30 cursor-not-allowed bg-gray-100 dark:bg-gray-700 text-gray-400'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600'
                }`}
                dangerouslySetInnerHTML={{ __html: link.label }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Layout wrapper
const IndexWithLayout = (props) => (
  <AdminLayout title="Gestion des projets">
    <Index {...props} />
  </AdminLayout>
);

IndexWithLayout.layout = (page) => page;

export default IndexWithLayout;