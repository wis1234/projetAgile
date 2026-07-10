import React, { useState, useCallback, useEffect, useRef } from 'react';
import { router, usePage, Link } from '@inertiajs/react';
import { useTranslation, Trans } from 'react-i18next';
import AdminLayout from '../../Layouts/AdminLayout';
import {
  FaSearch, FaTasks, FaPlus, FaCalendarAlt,
  FaProjectDiagram, FaList, FaTh, FaFilter,
  FaSort, FaSortUp, FaSortDown, FaChevronDown,
  FaChevronUp, FaTimes, FaCheck, FaClock,
  FaExclamationTriangle, FaUserCircle, FaTrophy,
  FaFire, FaChartBar, FaLock
} from 'react-icons/fa';
import { HiOutlineViewGrid, HiOutlineViewList } from 'react-icons/hi';

// ── Status & Priority helpers ─────────────────────────────────────────────────

const STATUS_CONFIG = {
  todo:        { label: 'À faire',      color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300', dot: 'bg-slate-400' },
  in_progress: { label: 'En cours',     color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300', dot: 'bg-blue-500' },
  done:        { label: 'Terminé',      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', dot: 'bg-emerald-500' },
};

const PRIORITY_CONFIG = {
  low:    { label: 'Faible',  color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300', bar: 'bg-gray-400' },
  medium: { label: 'Moyenne', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', bar: 'bg-amber-400' },
  high:   { label: 'Haute',   color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', bar: 'bg-red-500' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.todo;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.low;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      {cfg.label}
    </span>
  );
};

// ── Avatar ────────────────────────────────────────────────────────────────────

const Avatar = ({ name = '', url = '', size = 'sm' }) => {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const sz = size === 'lg' ? 'w-10 h-10 text-sm' : 'w-7 h-7 text-xs';
  if (url) return <img src={url} alt={name} className={`${sz} rounded-full object-cover ring-2 ring-white dark:ring-gray-800`} />;
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold ring-2 ring-white dark:ring-gray-800`}>
      {initials}
    </div>
  );
};

// ── Summary card ──────────────────────────────────────────────────────────────

const SummaryCard = ({ label, value, icon: Icon, color, sub }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow`}>
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

// ── Collapsible panel toggle button (generic, reused for Filtres & Progression) ─

const PanelToggleButton = ({ icon: Icon, label, openLabel, open, onClick, count, tone = 'default' }) => {
  const toneClasses = tone === 'accent'
    ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300'
    : 'border-gray-200 bg-white text-gray-700 hover:border-blue-400 hover:text-blue-600 dark:bg-gray-700 dark:text-gray-200';

  return (
    <button
      onClick={onClick}
      aria-expanded={open}
      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap ${toneClasses}`}
    >
      <Icon />
      {open ? (openLabel || label) : label}
      {typeof count === 'number' && count > 0 && (
        <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 font-bold">
          {count}
        </span>
      )}
      {open ? <FaChevronUp className="text-xs opacity-60" /> : <FaChevronDown className="text-xs opacity-60" />}
    </button>
  );
};

// ── Filter panel (dynamic, fully controlled by parent — no internal open state) ─

const FilterPanel = ({ open, filters, projectOptions, memberOptions, onChange, onReset }) => {
  if (!open) return null;

  const set = (key, val) => onChange({ ...filters, [key]: val });
  const activeCount = Object.values(filters).filter(v => v !== '' && v !== undefined && v !== null).length;

  const Select = ({ label, field, options, placeholder = 'Tous' }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</label>
      <select
        value={filters[field] || ''}
        onChange={e => set(field, e.target.value)}
        className="text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 animate-[fadeIn_0.15s_ease-out]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Search */}
        <div className="flex flex-col gap-1 sm:col-span-2 xl:col-span-1">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Recherche</label>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              value={filters.search || ''}
              onChange={e => set('search', e.target.value)}
              placeholder="Titre de la tâche..."
              className="pl-9 pr-4 py-2 text-sm w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <Select
          label="Statut"
          field="status"
          options={[
            { value: 'todo',        label: 'À faire' },
            { value: 'in_progress', label: 'En cours' },
            { value: 'done',        label: 'Terminé' },
          ]}
        />

        <Select
          label="Priorité"
          field="priority"
          options={[
            { value: 'low',    label: 'Faible' },
            { value: 'medium', label: 'Moyenne' },
            { value: 'high',   label: 'Haute' },
          ]}
        />

        <Select
          label="Projet"
          field="project_id"
          options={projectOptions.map(p => ({ value: p.id, label: p.name }))}
        />

        <Select
          label="Assigné à"
          field="assigned_to"
          options={memberOptions.map(m => ({ value: m.id, label: m.name }))}
        />

        {/* Date range */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Échéance — début</label>
          <input
            type="date"
            value={filters.due_from || ''}
            onChange={e => set('due_from', e.target.value)}
            className="text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Échéance — fin</label>
          <input
            type="date"
            value={filters.due_to || ''}
            onChange={e => set('due_to', e.target.value)}
            className="text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Action row */}
      {activeCount > 0 && (
        <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={onReset}
            className="flex items-center gap-2 text-gray-500 hover:text-red-600 text-sm font-medium transition-colors"
          >
            <FaTimes className="text-xs" /> Réinitialiser les filtres ({activeCount})
          </button>
        </div>
      )}
    </div>
  );
};

// ── Sort header ───────────────────────────────────────────────────────────────

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

// ── User Stats Card (unchanged) ──────────────────────────────────────────────

const UserStatCard = ({ stat, rank }) => {
  const completion = stat.completion_rate ?? 0;
  const onTimeRate = stat.on_time_rate ?? 0;

  const rankColors = ['from-yellow-400 to-amber-500', 'from-gray-300 to-gray-400', 'from-amber-600 to-amber-700'];
  const rankBg     = rankColors[rank] || 'from-blue-400 to-blue-500';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 group">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {rank < 3 ? (
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${rankBg} flex items-center justify-center text-white text-xs font-extrabold shadow-sm`}>
              {rank === 0 ? '🥇' : rank === 1 ? '🥈' : '🥉'}
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 text-xs font-bold">
              #{rank + 1}
            </div>
          )}
          <Avatar name={stat.user?.name || ''} url={stat.user?.profile_photo_url || ''} size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{stat.user?.name || 'Inconnu'}</p>
              {stat.is_current_user && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  Moi
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">{stat.total} tâche{stat.total !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{completion}%</p>
          <p className="text-xs text-gray-400">Complété</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700"
          style={{ width: `${completion}%` }}
        />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        {[
          { label: 'À faire', val: stat.todo, color: 'text-gray-500 dark:text-gray-400' },
          { label: 'En cours', val: stat.in_progress, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Terminé', val: stat.done, color: 'text-emerald-600 dark:text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="text-center bg-gray-50 dark:bg-gray-700/50 rounded-xl py-2 px-1">
            <p className={`text-base font-extrabold ${s.color}`}>{s.val}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Completion rates */}
      {stat.done > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <FaClock className="text-blue-400" /> À temps
            </span>
            <span className={`font-bold ${onTimeRate >= 75 ? 'text-emerald-600' : onTimeRate >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
              {onTimeRate}%
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <FaExclamationTriangle className="text-amber-500" /> En retard
            </span>
            <span className={`font-bold ${stat.late_rate >= 25 ? 'text-red-500' : 'text-amber-600'}`}>
              {stat.late_rate ?? 0}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main Index component ──────────────────────────────────────────────────────

const Index = ({
  tasks: initialTasks = { data: [], links: [], total: 0 },
  filters: initialFilters = {},
  userStats = [],
  summary = {},
  myTasksSummary = null,
  projectOptions = [],
  memberOptions = [],
  lockedSprints = [],
}) => {
  const { t } = useTranslation();
  const { flash = {} } = usePage().props;
  const [viewMode, setViewMode]   = useState('table');
  const [filters, setFilters]     = useState(initialFilters);
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);

  const [showStats, setShowStats]     = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [displayedUserCount, setDisplayedUserCount] = useState(20);

  const isFirstRender = useRef(true);
  const debounceTimer = useRef(null);

  const tasks = Array.isArray(initialTasks) ? initialTasks : (initialTasks.data || []);
  const pagination = !Array.isArray(initialTasks) ? initialTasks : null;

  const showLockedAlert = lockedSprints.length > 0 && !isAlertDismissed;

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      router.get('/tasks', filters, { preserveState: true, replace: true });
    }, 300);

    return () => clearTimeout(debounceTimer.current);
  }, [filters]);

  const handleSort = useCallback((field) => {
    const newDir = filters.sort_by === field && filters.sort_dir === 'asc' ? 'desc' : 'asc';
    const newFilters = { ...filters, sort_by: field, sort_dir: newDir };
    setFilters(newFilters);
  }, [filters]);

  const handleReset = () => {
    setFilters({});
  };

  useEffect(() => {
    setDisplayedUserCount(20);
  }, [filters.project_id, userStats.length]);

  const filteredUserStats = userStats.filter((stat) => {
    if (!filters.project_id) return true;
    return stat.project_ids && stat.project_ids.includes(Number(filters.project_id));
  });
  const paginatedUserStats = filteredUserStats.slice(0, displayedUserCount);
  const hasMoreUsers = displayedUserCount < filteredUserStats.length;

  const activeFilterCount = Object.values(filters).filter(v => v !== '' && v !== undefined && v !== null).length;

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── Flash notification ── */}
        {flash.success && (
          <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 px-5 py-3 rounded-2xl shadow-sm">
            <FaCheck className="flex-shrink-0" />
            <span className="font-medium text-sm">{flash.success}</span>
          </div>
        )}
        {flash.error && (
          <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 px-5 py-3 rounded-2xl shadow-sm">
            <FaExclamationTriangle className="flex-shrink-0" />
            <span className="font-medium text-sm">{flash.error}</span>
          </div>
        )}

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Gestion des tâches
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {summary.total ?? 0} tâche{(summary.total ?? 0) !== 1 ? 's' : ''} au total
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/kanban"
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-semibold text-sm hover:border-blue-400 hover:text-blue-600 transition-all shadow-sm"
            >
              <HiOutlineViewGrid className="text-lg" /> Kanban
            </Link>
            <Link
              href="/tasks/create"
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm hover:shadow-md"
            >
              <FaPlus /> Nouvelle tâche
            </Link>
          </div>
        </div>

        {/* ── Enhanced Multi-Sprint Lock Alert ── */}
        {showLockedAlert && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 p-5 rounded-r-2xl shadow-sm relative animate-[fadeIn_0.3s_ease-out]">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <FaLock className="h-5 w-5 text-amber-500" />
              </div>
              <div className="ml-4 pr-8">
                <h3 className="text-sm font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wider">
                  {t('attention')}
                </h3>
                <div className="mt-2 text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
                  <Trans i18nKey="task_lock_alert_intro">
                    Le délai alloué au(x) sprint(s)/objectif(s) suivant(s) est dépassé. Toutes les tâches non terminées y afférentes sont <span className="font-bold">bloquées</span> jusqu'à ce qu'un chef de projet le prolonge :
                  </Trans>
                  <ul className="mt-3 space-y-2 list-disc list-inside">
                    {lockedSprints.map(sprint => (
                      <li key={sprint.id} className="ml-1">
                        <Trans
                          i18nKey="task_lock_alert_item"
                          values={{ sprintName: sprint.name, projectName: sprint.project?.name }}
                        >
                          Sprint <Link href={`/sprints/${sprint.id}`} className="font-bold underline text-amber-600 hover:text-amber-800 dark:text-amber-400">{{sprintName}}</Link> du projet <span className="font-semibold">{{projectName}}</span>
                        </Trans>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <button
                onClick={() => setIsAlertDismissed(true)}
                className="absolute top-4 right-4 text-amber-500 hover:text-amber-700 transition-colors p-1 rounded-full hover:bg-amber-100 dark:hover:bg-amber-800/40"
                title="Fermer"
              >
                <FaTimes />
              </button>
            </div>
          </div>
        )}

        {/* ── Summary cards (global) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard label="Total"    value={summary.total}       icon={FaTasks}              color="bg-blue-500" />
          <SummaryCard label="À faire"  value={summary.todo}        icon={FaClock}              color="bg-slate-400" />
          <SummaryCard label="En cours" value={summary.in_progress} icon={FaFire}               color="bg-amber-500" />
          <SummaryCard label="Terminé"  value={summary.done}        icon={FaCheck}              color="bg-emerald-500"
            sub={summary.overdue > 0 ? `${summary.overdue} en retard` : null} />
        </div>

        {/* ── Summary cards "Mes propres tâches" ── */}
        {myTasksSummary && (
          <>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mt-2">
              Mes propres tâches
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard label="Total"    value={myTasksSummary.total}       icon={FaTasks}  color="bg-indigo-500" />
              <SummaryCard label="À faire"  value={myTasksSummary.todo}        icon={FaClock}  color="bg-slate-400" />
              <SummaryCard label="En cours" value={myTasksSummary.in_progress} icon={FaFire}   color="bg-amber-500" />
              <SummaryCard label="Terminé"  value={myTasksSummary.done}        icon={FaCheck}  color="bg-emerald-500"
                sub={myTasksSummary.overdue > 0 ? `${myTasksSummary.overdue} en retard` : null} />
            </div>
          </>
        )}

        {/* ── Controls row ── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 sm:p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-3 lg:flex-wrap">
          {userStats.length > 0 && (
            <PanelToggleButton
              icon={FaChartBar}
              label="Voir les progrès"
              openLabel="Masquer les progrès"
              open={showStats}
              onClick={() => setShowStats(s => !s)}
              tone="accent"
            />
          )}

          <PanelToggleButton
            icon={FaFilter}
            label="Filtres & Recherche"
            openLabel="Masquer les filtres"
            open={showFilters}
            onClick={() => setShowFilters(f => !f)}
            count={activeFilterCount}
          />

          <div className="flex-1 hidden lg:block" />
        </div>

        {/* ── Filters ── */}
        <FilterPanel
          open={showFilters}
          filters={filters}
          projectOptions={projectOptions}
          memberOptions={memberOptions}
          onChange={setFilters}
          onReset={handleReset}
        />

        {/* ── Progression des membres ── */}
        {showStats && userStats.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden animate-[fadeIn_0.15s_ease-out]">
            <div className="w-full flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <FaChartBar className="text-white" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900 dark:text-white">Progression des membres</p>
                  <p className="text-xs text-gray-400">{filteredUserStats.length} membre{filteredUserStats.length !== 1 ? 's' : ''} actif{filteredUserStats.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <button
                onClick={() => setShowStats(false)}
                title="Masquer"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            <div className="px-6 pb-6">
              {paginatedUserStats.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
                    {paginatedUserStats.map((stat, index) => (
                      <UserStatCard key={stat.user?.id ?? index} stat={stat} rank={index} />
                    ))}
                  </div>
                  {hasMoreUsers && (
                    <div className="mt-6 text-center">
                      <button
                        onClick={() => setDisplayedUserCount(prev => prev + 20)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        Afficher plus d'utilisateurs
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-400">
                  Aucune progression à afficher pour ce filtre.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── View toggle + count ── */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {pagination?.total !== undefined
              ? `${pagination.from ?? 0}–${pagination.to ?? 0} sur ${pagination.total} résultats`
              : `${tasks.length} résultats`}
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

        {/* ── TABLE view ── */}
        {viewMode === 'table' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm divide-y divide-gray-100 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800/80">
                  <tr>
                    {[
                      { label: 'Titre',      field: 'title' },
                      { label: 'Projet',     field: null },
                      { label: 'Statut',     field: 'status' },
                      { label: 'Priorité',   field: 'priority' },
                      { label: 'Assigné',    field: null },
                      { label: 'Échéance',   field: 'due_date' },
                    ].map(col => (
                      <th key={col.label} className="px-5 py-3.5 text-left">
                        {col.field
                          ? <SortHeader label={col.label} field={col.field} current={filters.sort_by} dir={filters.sort_dir} onSort={handleSort} />
                          : <span className="font-semibold text-gray-600 dark:text-gray-300">{col.label}</span>
                        }
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {tasks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <FaTasks className="mx-auto text-4xl text-gray-300 dark:text-gray-600 mb-3" />
                        <p className="text-gray-400 dark:text-gray-500 font-medium">Aucune tâche trouvée</p>
                        <Link href="/tasks/create" className="mt-3 inline-flex items-center gap-2 text-blue-600 hover:underline text-sm font-semibold">
                          <FaPlus className="text-xs" /> Créer une tâche
                        </Link>
                      </td>
                    </tr>
                  ) : tasks.map(task => {
                    const isOverdue = task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date();
                    return (
                      <tr
                        key={task.id}
                        className={`border-b border-gray-100 dark:border-gray-700/70 transition duration-150 ease-in-out hover:bg-blue-50 dark:hover:bg-gray-700 group cursor-pointer hover:shadow-md ${task.is_locked ? 'opacity-75 bg-gray-50/50' : ''}`}
                        onClick={() => router.visit(`/tasks/${task.id}`)}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {task.is_locked && <FaLock className="text-amber-500 text-xs flex-shrink-0" title="Verrouillé (Sprint terminé)" />}
                            <span className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {task.title}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {task.project ? (
                            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 text-xs">
                              <FaProjectDiagram className="text-blue-400 flex-shrink-0" />
                              <span>{task.project.name}</span>
                            </div>
                          ) : <span className="text-gray-300 dark:text-gray-600 text-xs italic">—</span>}
                        </td>
                        <td className="px-5 py-4"><StatusBadge status={task.status} /></td>
                        <td className="px-5 py-4"><PriorityBadge priority={task.priority} /></td>
                        <td className="px-5 py-4">
                          {task.assigned_user || task.assignedUser ? (
                            <div className="flex items-center gap-2">
                              <Avatar
                                name={task.assigned_user?.name || task.assignedUser?.name || ''}
                                url={task.assigned_user?.profile_photo_url || task.assignedUser?.profile_photo_url || ''}
                              />
                              <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                                {(task.assigned_user?.name || task.assignedUser?.name || '').split(' ')[0]}
                              </span>
                            </div>
                          ) : <span className="text-gray-300 dark:text-gray-600 text-xs italic">Non assigné</span>}
                        </td>
                        <td className="px-5 py-4">
                          {task.due_date ? (
                            <span className={`flex items-center gap-1 text-xs font-medium ${isOverdue ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                              {isOverdue && <FaExclamationTriangle className="text-red-400" />}
                              <FaCalendarAlt className="flex-shrink-0" />
                              {new Date(task.due_date).toLocaleDateString('fr-FR')}
                            </span>
                          ) : <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── CARDS view ── */}
        {viewMode === 'cards' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3">
            {tasks.length === 0 ? (
              <div className="col-span-full py-16 text-center">
                <FaTasks className="mx-auto text-5xl text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-400 dark:text-gray-500 font-medium">Aucune tâche trouvée</p>
              </div>
            ) : tasks.map(task => {
              const isOverdue = task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date();
              return (
                <div
                  key={task.id}
                  className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group ${task.is_locked ? 'ring-1 ring-amber-200 opacity-80' : ''}`}
                  onClick={() => router.visit(`/tasks/${task.id}`)}
                >
                  <div className={`w-full h-1 rounded-full mb-4 ${PRIORITY_CONFIG[task.priority]?.bar || 'bg-gray-300'}`} />

                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 text-sm leading-snug">
                      {task.is_locked && <FaLock className="inline-block mr-1.5 text-amber-500 text-xs mb-0.5" />}
                      {task.title}
                    </h3>
                    <StatusBadge status={task.status} />
                  </div>

                  {task.project && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2 py-1.5">
                      <FaProjectDiagram className="text-blue-400 flex-shrink-0" />
                      <span className="truncate">{task.project.name}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                    {task.assigned_user || task.assignedUser ? (
                      <div className="flex items-center gap-1.5">
                        <Avatar
                          name={task.assigned_user?.name || task.assignedUser?.name || ''}
                          url={task.assigned_user?.profile_photo_url || ''}
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium truncate max-w-[80px]">
                          {(task.assigned_user?.name || task.assignedUser?.name || '').split(' ')[0]}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300 dark:text-gray-600 italic">Non assigné</span>
                    )}

                    {task.due_date && (
                      <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                        {isOverdue && <FaExclamationTriangle />}
                        {new Date(task.due_date).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pagination ── */}
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

const IndexWithLayout = (props) => (
  <AdminLayout title="Gestion des tâches">
    <Index {...props} />
  </AdminLayout>
);

IndexWithLayout.layout = (page) => page;

export default IndexWithLayout;
