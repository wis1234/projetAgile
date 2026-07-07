import React, { useEffect, useState, useCallback, useRef } from 'react';
import { router, Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AdminLayout from '../../Layouts/AdminLayout';
import {
  FaUsers, FaUserPlus, FaSearch, FaSort, FaSortUp, FaSortDown,
  FaChevronDown, FaChevronUp, FaTimes, FaCheck, FaExclamationTriangle,
  FaFilter, FaEnvelope, FaCalendarAlt, FaProjectDiagram,
  FaCrown, FaUser, FaShieldAlt, FaChartLine, FaUserCircle
} from 'react-icons/fa';
import { HiOutlineViewGrid, HiOutlineViewList } from 'react-icons/hi';

// ── Helpers pour les rôles ──────────────────────────────────────────────────
const ROLE_CONFIG = {
  manager:  { label: 'Manager',   icon: FaCrown,    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300' },
  member:   { label: 'Membre',    icon: FaUser,     color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' },
  observer: { label: 'Observateur', icon: FaShieldAlt, color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
};

const RoleBadge = ({ role }) => {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.member;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      <Icon className="text-xs" /> {cfg.label}
    </span>
  );
};

// ── Composants réutilisables ────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 flex items-center gap-4 shadow-sm">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="text-xl text-white" />
    </div>
    <div>
      <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{value ?? 0}</p>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
    </div>
  </div>
);

const SortHeader = ({ label, field, current, dir, onSort }) => (
  <button
    onClick={() => onSort(field)}
    className="flex items-center gap-1 font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors group text-left"
  >
    {label}
    <span className="ml-1 opacity-50 group-hover:opacity-100">
      {current === field ? (dir === 'asc' ? <FaSortUp /> : <FaSortDown />) : <FaSort />}
    </span>
  </button>
);

// ── Panneau de filtres (recherche sur membre, rôle, projet, statut projet) ──
const FilterPanel = ({ filters, projectsList, roles, searchValue, onSearchChange, onSearchSubmit, onFilterChange, onReset }) => {
  const [open, setOpen] = useState(true);
  const activeCount = Object.values(filters).filter(v => v && v !== '').length;

  const handleKeyDown = (e) => { if (e.key === 'Enter') onSearchSubmit(); };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-750">
        <div className="flex items-center gap-3">
          <FaFilter className="text-blue-500" />
          <span className="font-semibold text-gray-700 dark:text-gray-200">Filtres avancés</span>
          {activeCount > 0 && <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">{activeCount}</span>}
        </div>
        {open ? <FaChevronUp /> : <FaChevronDown />}
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {/* Recherche membre */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Membre</label>
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                    value={searchValue}
                    onChange={e => onSearchChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Nom ou email..."
                    className="pl-9 pr-4 py-2 text-sm w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <button onClick={onSearchSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold">
                  <FaSearch />
                </button>
              </div>
            </div>

            {/* Rôle */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Rôle</label>
              <select
                value={filters.role || ''}
                onChange={e => onFilterChange('role', e.target.value)}
                className="text-sm bg-white dark:bg-gray-700 border border-gray-200 rounded-xl px-3 py-2"
              >
                <option value="">Tous les rôles</option>
                {roles.map(r => <option key={r} value={r}>{ROLE_CONFIG[r]?.label || r}</option>)}
              </select>
            </div>

            {/* Projet */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Projet</label>
              <select
                value={filters.project_id || ''}
                onChange={e => onFilterChange('project_id', e.target.value)}
                className="text-sm bg-white dark:bg-gray-700 border border-gray-200 rounded-xl px-3 py-2"
              >
                <option value="">Tous les projets</option>
                {projectsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            {/* Statut du projet */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut projet</label>
              <select
                value={filters.project_status || ''}
                onChange={e => onFilterChange('project_status', e.target.value)}
                className="text-sm bg-white dark:bg-gray-700 border border-gray-200 rounded-xl px-3 py-2"
              >
                <option value="">Tous statuts</option>
                <option value="nouveau">Nouveau</option>
                <option value="demarrage">Démarrage</option>
                <option value="en_cours">En cours</option>
                <option value="avance">Avancé</option>
                <option value="termine">Terminé</option>
                <option value="suspendu">Suspendu</option>
              </select>
            </div>
          </div>

          {activeCount > 0 && (
            <div className="mt-5">
              <button onClick={onReset} className="flex items-center gap-2 text-gray-500 hover:text-red-600 text-sm">
                <FaTimes /> Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Composant principal ─────────────────────────────────────────────────────
export default function Index({ members = {}, filters: initialFilters = {}, globalStats = {}, projectsList = [], allowedRoles = [] }) {
  const { t } = useTranslation();
  const { flash = {} } = usePage().props;
  const [viewMode, setViewMode] = useState('cards'); // 'table' ou 'cards'
  const [filters, setFilters] = useState(initialFilters);
  const [searchInput, setSearchInput] = useState(initialFilters.search || '');
  const [notification, setNotification] = useState(null);

  const isFirstRender = useRef(true);
  const debounceTimer = useRef(null);

  const membersData = members.data || [];
  const pagination = members;

  // Notifications
  useEffect(() => {
    if (flash.success) setNotification({ type: 'success', message: flash.success });
    if (flash.error) setNotification({ type: 'error', message: flash.error });
    const timer = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(timer);
  }, [flash]);

  // Auto-apply des filtres (sauf recherche manuelle)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      router.get(window.location.pathname, filters, { preserveState: true, replace: true });
    }, 300);
    return () => clearTimeout(debounceTimer.current);
  }, [filters]);

  const handleSort = (field) => {
    const newDir = filters.sort_by === field && filters.sort_dir === 'asc' ? 'desc' : 'asc';
    setFilters(prev => ({ ...prev, sort_by: field, sort_dir: newDir }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined }));
  };

  const handleReset = () => {
    setSearchInput('');
    setFilters({});
  };

  const handleSearchSubmit = () => {
    setFilters(prev => ({ ...prev, search: searchInput || undefined }));
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Notification */}
        {notification && (
          <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-sm ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 dark:bg-red-900/30 border border-red-200 text-red-800'
          }`}>
            {notification.type === 'success' ? <FaCheck /> : <FaExclamationTriangle />}
            <span className="font-medium text-sm">{notification.message}</span>
          </div>
        )}

        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              <FaUsers className="text-indigo-500" /> Gestion des membres
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {globalStats.total_members || 0} membres actifs dans vos projets
            </p>
          </div>
          <Link
            href={route('project-users.create')}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm shadow-sm hover:shadow-md transition"
          >
            <FaUserPlus /> Ajouter un membre
          </Link>
        </div>

        {/* Cartes stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Membres uniques" value={globalStats.total_members} icon={FaUsers} color="bg-indigo-500" />
          <StatCard label="Projets actifs" value={globalStats.total_projects} icon={FaProjectDiagram} color="bg-emerald-500" />
          <StatCard label="Rôles Manager" value={globalStats.total_roles?.manager || 0} icon={FaCrown} color="bg-amber-500" />
        </div>

        {/* Filtres */}
        <FilterPanel
          filters={filters}
          projectsList={projectsList}
          roles={allowedRoles}
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          onSearchSubmit={handleSearchSubmit}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
        />

        {/* Commutateur de vue */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {pagination?.total ?? membersData.length} membre(s)
          </p>
          <div className="flex gap-1 bg-white dark:bg-gray-800 border rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-indigo-600'}`}
            >
              <HiOutlineViewList /> Tableau
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${viewMode === 'cards' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-indigo-600'}`}
            >
              <HiOutlineViewGrid /> Cartes
            </button>
          </div>
        </div>

        {/* Vue tableau */}
        {viewMode === 'table' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm divide-y">
                <thead className="bg-gray-50 dark:bg-gray-800/80">
                  <tr>
                    <th className="px-5 py-3.5 text-left"><SortHeader label="Membre" field="name" current={filters.sort_by} dir={filters.sort_dir} onSort={handleSort} /></th>
                    <th className="px-5 py-3.5 text-left"><SortHeader label="Email" field="email" current={filters.sort_by} dir={filters.sort_dir} onSort={handleSort} /></th>
                    <th className="px-5 py-3.5 text-left">Rôle principal</th>
                    <th className="px-5 py-3.5 text-left">Projets communs</th>
                    <th className="px-5 py-3.5 text-left"><SortHeader label="Membre depuis" field="created_at" current={filters.sort_by} dir={filters.sort_dir} onSort={handleSort} /></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {membersData.length === 0 ? (
                    <tr><td colSpan={5} className="py-16 text-center text-gray-400">Aucun membre trouvé</td></tr>
                  ) : (
                    membersData.map(member => (
                      <tr key={member.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 cursor-pointer transition" onClick={() => router.get(`/project-users/${member.id}`)}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <img src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}`} className="w-8 h-8 rounded-full" />
                            <span className="font-semibold">{member.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-gray-600 dark:text-gray-300">{member.email}</td>
                        <td className="px-5 py-4">
                          {member.common_projects?.length > 0 && (
                            <RoleBadge role={member.common_projects[0].role} />
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1">
                            {member.common_projects?.slice(0, 2).map(p => (
                              <span key={p.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs">
                                <FaProjectDiagram className="text-indigo-400" /> {p.name}
                              </span>
                            ))}
                            {member.common_projects?.length > 2 && <span className="text-xs text-gray-400">+{member.common_projects.length - 2}</span>}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-gray-500">{new Date(member.created_at).toLocaleDateString('fr-FR')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Vue cartes */}
{viewMode === 'cards' && (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
    {membersData.map(member => (
      <div key={member.id} onClick={() => router.get(`/project-users/${member.id}`)} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group flex flex-col h-full">
        <div className="flex items-center gap-3 mb-4">
          <img src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}`} className="w-12 h-12 rounded-full ring-2 ring-indigo-200" />
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600">{member.name}</h3>
            <div className="flex items-center gap-1 text-xs text-gray-500"><FaEnvelope /> {member.email}</div>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase">Rôles dans les projets</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {[...new Set(member.common_projects?.map(p => p.role))].map(role => (
              <RoleBadge key={role} role={role} />
            ))}
          </div>
        </div>

        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-500 uppercase">Projets communs ({member.common_projects?.length || 0})</p>
          <div className="mt-2 space-y-1">
            {member.common_projects?.slice(0, 3).map(p => (
              <div key={p.id} className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <FaProjectDiagram className="text-indigo-400 text-xs flex-shrink-0" />
                <span className="truncate">{p.name}</span>
                <span className="text-xs text-gray-400">({p.status})</span>
              </div>
            ))}
            {member.common_projects?.length > 3 && <div className="text-xs text-gray-400">+{member.common_projects.length - 3} autres</div>}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t text-xs text-gray-400 flex items-center gap-2">
          <FaCalendarAlt /> Membre depuis {new Date(member.created_at).toLocaleDateString()}
        </div>
      </div>
    ))}
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
                className={`min-w-[36px] px-3 py-1.5 rounded-xl text-sm font-semibold transition ${link.active ? 'bg-indigo-600 text-white shadow-sm' : !link.url ? 'opacity-30 cursor-not-allowed bg-gray-100' : 'bg-white border border-gray-200 hover:border-indigo-400 hover:text-indigo-600'}`}
                dangerouslySetInnerHTML={{ __html: link.label }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

Index.layout = page => <AdminLayout children={page} />;