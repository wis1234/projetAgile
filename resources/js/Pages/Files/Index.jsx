import React, { useState, useEffect, useRef } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import {
  FaFileAlt, FaPlus, FaSearch, FaDownload, FaTable, FaTh,
  FaImage, FaFilePdf, FaFileWord, FaFileExcel, FaFileCode,
  FaClock, FaDropbox, FaProjectDiagram, FaFilter, FaTimes,
  FaAngleLeft, FaAngleRight, FaSort, FaSortUp, FaSortDown,
  FaCheckSquare, FaSquare, FaEllipsisH, FaTrash, FaEye,
  FaChevronDown, FaLayerGroup, FaAngleRight as FaChevRight,
  FaFile, FaCloudUploadAlt, FaCalendarAlt, FaUser, FaCheck,
  FaExclamationTriangle
} from 'react-icons/fa';

/* ── helpers ─────────────────────────────────────── */
const fileIconMap = (type) => {
  if (!type) return { icon: <FaFile />, bg: 'bg-slate-100 dark:bg-slate-700', color: 'text-slate-500' };
  if (type.startsWith('image/'))    return { icon: <FaImage />,     bg: 'bg-pink-50   dark:bg-pink-900/30',   color: 'text-pink-500'   };
  if (type.includes('pdf'))         return { icon: <FaFilePdf />,   bg: 'bg-red-50    dark:bg-red-900/30',    color: 'text-red-500'    };
  if (type.includes('word'))        return { icon: <FaFileWord />,  bg: 'bg-blue-50   dark:bg-blue-900/30',   color: 'text-blue-600'   };
  if (type.includes('excel') || type.includes('spreadsheet'))
                                    return { icon: <FaFileExcel />, bg: 'bg-green-50  dark:bg-green-900/30',  color: 'text-green-600'  };
  if (type.includes('html') || type.includes('code'))
                                    return { icon: <FaFileCode />,  bg: 'bg-orange-50 dark:bg-orange-900/30', color: 'text-orange-500' };
  return { icon: <FaFileAlt />, bg: 'bg-slate-100 dark:bg-slate-700', color: 'text-slate-500' };
};

const fmtSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fmtDate = (str) =>
  str ? new Date(str).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const TYPE_OPTIONS = [
  { label: 'Tous les types', value: '' },
  { label: 'Images',         value: 'image' },
  { label: 'PDF',            value: 'pdf' },
  { label: 'Word',           value: 'word' },
  { label: 'Excel',          value: 'excel' },
  { label: 'Code / HTML',    value: 'html' },
  { label: 'Autre',          value: 'other' },
];

const SORT_OPTIONS = [
  { label: 'Date (récent)',  value: 'created_at', dir: 'desc' },
  { label: 'Date (ancien)', value: 'created_at', dir: 'asc'  },
  { label: 'Nom (A→Z)',      value: 'name',       dir: 'asc'  },
  { label: 'Nom (Z→A)',      value: 'name',       dir: 'desc' },
  { label: 'Taille (↑)',     value: 'size',       dir: 'asc'  },
  { label: 'Taille (↓)',     value: 'size',       dir: 'desc' },
];

/* ── Badge ───────────────────────────────────────── */
const Badge = ({ children, className = '' }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ring-1 ring-inset ${className}`}>
    {children}
  </span>
);

/* ── Stat mini card ──────────────────────────────── */
const MiniStat = ({ label, value, icon, color }) => {
  const c = {
    blue:   'bg-blue-50   dark:bg-blue-900/20   text-blue-600   dark:text-blue-400   border-blue-100   dark:border-blue-800',
    pink:   'bg-pink-50   dark:bg-pink-900/20   text-pink-600   dark:text-pink-400   border-pink-100   dark:border-pink-800',
    green:  'bg-green-50  dark:bg-green-900/20  text-green-600  dark:text-green-400  border-green-100  dark:border-green-800',
    amber:  'bg-amber-50  dark:bg-amber-900/20  text-amber-600  dark:text-amber-400  border-amber-100  dark:border-amber-800',
  }[color];
  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${c}`}>
      <span className="text-lg">{icon}</span>
      <div>
        <div className="text-lg font-bold leading-none">{value}</div>
        <div className="text-[11px] font-medium mt-0.5 opacity-80">{label}</div>
      </div>
    </div>
  );
};

/* ── Safe prop normalisers (run before any hook) ── */
const EMPTY_FILES   = { data: [], total: 0, links: [], current_page: 1, last_page: 1 };
const EMPTY_FILTERS = { search: '', type: '', dropbox: false, project: '', sort: 'created_at', dir: 'desc' };
const safeFiles = (r) => (!r || typeof r !== 'object') ? EMPTY_FILES
  : { ...EMPTY_FILES, ...r, data: Array.isArray(r.data) ? r.data : [] };
const safeFilters = (r) => (!r || typeof r !== 'object') ? EMPTY_FILTERS
  : { ...EMPTY_FILTERS, ...r };
const safeStats = (r) => (!r || typeof r !== 'object')
  ? { total_files: 0, total_size: 0, dropbox_count: 0, image_count: 0 }
  : { total_files: 0, total_size: 0, dropbox_count: 0, image_count: 0, ...r };
const safeProjects = (r) => Array.isArray(r) ? r : [];

/* ── Main ────────────────────────────────────────── */
export default function Index({ files: filesProp, filters: filtersProp, stats: statsProp, projects: projectsProp }) {
  // Normalise BEFORE any hook — minified React calls Object.keys on useState initial values
  const files    = safeFiles(filesProp);
  const filters  = safeFilters(filtersProp);
  const stats    = safeStats(statsProp);
  const projects = safeProjects(projectsProp);

  const { flash = {} } = usePage().props;

  /* state — every initial value is a guaranteed primitive, never null/object */
  const [search,        setSearch]        = useState(String(filters.search  || ''));
  const [typeFilter,    setTypeFilter]    = useState(String(filters.type    || ''));
  const [dropboxFilter, setDropboxFilter] = useState(Boolean(filters.dropbox));
  const [projectFilter, setProjectFilter] = useState(String(filters.project || ''));
  const [sortKey,       setSortKey]       = useState(String(filters.sort    || 'created_at'));
  const [sortDir,       setSortDir]       = useState(String(filters.dir     || 'desc'));
  const [viewMode,      setViewMode]      = useState('cards');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showFilters,   setShowFilters]   = useState(false);
  const [notification,  setNotification]  = useState(flash.success || '');
  const [notifVisible,  setNotifVisible]  = useState(!!flash.success);
  const searchRef = useRef(null);

  /* notification auto-dismiss */
  useEffect(() => {
    if (notifVisible) {
      const t = setTimeout(() => setNotifVisible(false), 4000);
      return () => clearTimeout(t);
    }
  }, [notifVisible]);

  useEffect(() => {
    if (flash.success) { setNotification(flash.success); setNotifVisible(true); }
  }, [flash.success]);

  /* search / filter submit */
  const applyFilters = (overrides = {}) => {
    router.get('/files', {
      search:  overrides.search  ?? search,
      type:    overrides.type    ?? typeFilter,
      dropbox: overrides.dropbox ?? dropboxFilter,
      project: overrides.project ?? projectFilter,
      sort:    overrides.sort    ?? sortKey,
      dir:     overrides.dir     ?? sortDir,
    }, { preserveState: true, replace: true });
  };

  const handleSearchSubmit = (e) => { e.preventDefault(); applyFilters(); };
  const handleTypeChange   = (v) => { setTypeFilter(v);    applyFilters({ type: v });    };
  const handleDropbox      = (v) => { setDropboxFilter(v); applyFilters({ dropbox: v }); };
  const handleProjectFilter= (v) => { setProjectFilter(v); applyFilters({ project: v }); };
  const handleSort         = (key, dir) => { setSortKey(key); setSortDir(dir); applyFilters({ sort: key, dir }); };
  const clearFilters = () => {
    setSearch('');
    setTypeFilter('');
    setDropboxFilter(false);
    setProjectFilter('');
    router.get('/files', {}, { preserveState: true, replace: true });
  };

  const activeFilterCount = [
    typeFilter,
    dropboxFilter ? 'dropbox' : '',
    projectFilter,
  ].filter(Boolean).length;

  /* selection */
  const allSelected = files.data.length > 0 && selectedFiles.length === files.data.length;
  const toggleAll   = () => setSelectedFiles(allSelected ? [] : files.data.map(f => f.id));
  const toggleOne   = (id, e) => { e.stopPropagation(); setSelectedFiles(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]); };

  /* bulk download */
  const handleBulkDownload = async () => {
    if (!selectedFiles.length) return;
    try {
      const response = await axios.post(route('files.downloadMultiple'), { ids: selectedFiles }, {
        responseType: 'blob', headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/zip' }));
      const a   = Object.assign(document.createElement('a'), { href: url, download: 'fichiers.zip' });
      document.body.appendChild(a); a.click();
      setTimeout(() => { window.URL.revokeObjectURL(url); document.body.removeChild(a); }, 100);
    } catch { alert('Erreur lors du téléchargement groupé'); }
  };

  /* Real stats from server (not computed from paginated page) */
  const totalSize    = stats.total_size    ?? 0;
  const dropboxCount = stats.dropbox_count ?? 0;
  const imageCount   = stats.image_count   ?? 0;
  const totalFiles   = stats.total_files   ?? (files.total ?? files.data.length);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        {/* ── Breadcrumb ── */}
        <div className="flex items-center gap-1.5 text-[12px] text-slate-500 dark:text-slate-400">
          <span className="font-medium hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer">Tableau de bord</span>
          <FaChevRight className="text-[10px]" />
          <span className="text-slate-800 dark:text-slate-200 font-semibold">Fichiers</span>
        </div>

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <FaLayerGroup className="text-white text-sm" />
              </span>
              Fichiers
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-10">
              {totalFiles} fichier{totalFiles !== 1 ? 's' : ''} au total · {fmtSize(totalSize)} utilisés
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              {[['cards', <FaTh />, 'Cartes'], ['table', <FaTable />, 'Tableau']].map(([mode, icon, label]) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors
                    ${viewMode === mode
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                >
                  {icon}<span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            <Link
              href="/files/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
            >
              <FaPlus className="text-xs" />
              Nouveau fichier
            </Link>
          </div>
        </div>

        {/* ── Mini stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MiniStat label="Total fichiers"  value={totalFiles} icon={<FaFileAlt />}         color="blue"  />
          <MiniStat label="Taille totale"   value={fmtSize(totalSize)}               icon={<FaCloudUploadAlt />}  color="green" />
          <MiniStat label="Via Dropbox"     value={dropboxCount}                     icon={<FaDropbox />}         color="amber" />
          <MiniStat label="Images"          value={imageCount}                       icon={<FaImage />}           color="pink"  />
        </div>

        {/* ── Toolbar: search + filters ── */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher par nom, projet, type…"
                  className="w-full pl-8 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                {search && (
                  <button type="button" onClick={() => { setSearch(''); applyFilters({ search: '' }); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <FaTimes className="text-xs" />
                  </button>
                )}
              </div>
            </form>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors
                ${showFilters || activeFilterCount > 0
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                  : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                }`}
            >
              <FaFilter className="text-xs" />
              Filtres
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 bg-blue-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
              <FaChevronDown className={`text-[10px] transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {/* Sort dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                <FaSort className="text-xs" />
                <span className="hidden sm:inline">Trier</span>
                <FaChevronDown className="text-[10px]" />
              </button>
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-30">
                {SORT_OPTIONS.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSort(opt.value, opt.dir)}
                    className={`flex items-center justify-between w-full px-4 py-2.5 text-sm transition-colors
                      ${sortKey === opt.value && sortDir === opt.dir
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                  >
                    {opt.label}
                    {sortKey === opt.value && sortDir === opt.dir && <FaCheck className="text-blue-600 text-xs" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-3 items-center">
              {/* Type filter pills */}
              <div className="flex flex-wrap gap-1.5">
                {TYPE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleTypeChange(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                      ${typeFilter === opt.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Dropbox toggle */}
              <button
                onClick={() => handleDropbox(!dropboxFilter)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors
                  ${dropboxFilter
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
              >
                <FaDropbox /> Dropbox uniquement
              </button>

              {/* Project filter */}
              {projects.length > 0 && (
                <select
                  value={projectFilter}
                  onChange={e => handleProjectFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border bg-slate-100 dark:bg-slate-700 border-transparent text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  <option value="">Tous les projets</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}

              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors"
                >
                  <FaTimes className="text-[10px]" /> Effacer les filtres
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Bulk action bar ── */}
        {selectedFiles.length > 0 && (
          <div className="flex items-center justify-between bg-blue-600 text-white rounded-xl px-5 py-3 shadow-md">
            <span className="text-sm font-semibold">
              {selectedFiles.length} fichier{selectedFiles.length > 1 ? 's' : ''} sélectionné{selectedFiles.length > 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={handleBulkDownload}
                className="flex items-center gap-2 px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition-colors"
              >
                <FaDownload className="text-xs" /> Télécharger (.zip)
              </button>
              <button
                onClick={() => setSelectedFiles([])}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <FaTimes className="text-sm" />
              </button>
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {files.data.length === 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm py-16 text-center">
            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaFileAlt className="text-slate-400 text-2xl" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">Aucun fichier trouvé</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {search || activeFilterCount > 0
                ? 'Aucun fichier ne correspond à vos critères de recherche.'
                : 'Commencez par téléverser votre premier fichier.'}
            </p>
            {activeFilterCount > 0
              ? <button onClick={clearFilters} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg transition-colors"><FaTimes className="text-xs" />Effacer les filtres</button>
              : <Link href="/files/create" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"><FaPlus className="text-xs" />Nouveau fichier</Link>
            }
          </div>
        )}

        {/* ── Card grid ── */}
        {files.data.length > 0 && viewMode === 'cards' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {files.data.map(file => {
              const { icon, bg, color } = fileIconMap(file.type);
              const selected = selectedFiles.includes(file.id);
              return (
                <div
                  key={file.id}
                  onClick={() => router.visit(`/files/${file.id}`)}
                  className={`group relative bg-white dark:bg-slate-800 rounded-xl border shadow-sm hover:shadow-md cursor-pointer transition-all
                    ${selected
                      ? 'border-blue-500 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600'
                    }`}
                >
                  {/* Select checkbox */}
                  <div
                    className="absolute top-3 left-3 z-10"
                    onClick={e => toggleOne(file.id, e)}
                  >
                    <span className={`w-4 h-4 rounded flex items-center justify-center border transition-colors
                      ${selected
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {selected && <FaCheck className="text-[8px]" />}
                    </span>
                  </div>

                  {/* Dropbox badge */}
                  {file.dropbox_path && (
                    <div className="absolute top-3 right-3 z-10">
                      <Badge className="bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-700">
                        <FaDropbox className="text-[9px]" /> Dropbox
                      </Badge>
                    </div>
                  )}

                  <div className="p-5">
                    {/* Icon */}
                    <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center mb-4 ${color} text-lg`}>
                      {icon}
                    </div>

                    {/* Name */}
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-0.5">
                      {file.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 truncate mb-3">
                      {file.type?.split('/')[1]?.toUpperCase() || 'Fichier'}
                    </p>

                    {/* Project */}
                    {file.project && (
                      <div className="flex items-center gap-1.5 mb-3">
                        <FaProjectDiagram className="text-slate-400 text-[10px] flex-shrink-0" />
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{file.project.name}</span>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{fmtSize(file.size)}</span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <FaCalendarAlt className="text-[9px]" />
                        {fmtDate(file.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Table view ── */}
        {files.data.length > 0 && viewMode === 'table' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="w-10 px-4 py-3">
                      <div onClick={toggleAll} className="cursor-pointer text-slate-400 hover:text-blue-600 transition-colors">
                        {allSelected ? <FaCheckSquare className="text-blue-600 text-base" /> : <FaSquare className="text-base" />}
                      </div>
                    </th>
                    {[['Nom', 'name'], ['Projet', 'project'], ['Taille', 'size'], ['Date', 'created_at'], ['Source', null]].map(([label, key]) => (
                      <th key={label}
                        className={`px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ${key ? 'cursor-pointer hover:text-slate-800 dark:hover:text-slate-200' : ''}`}
                        onClick={() => key && handleSort(key, sortKey === key && sortDir === 'asc' ? 'desc' : 'asc')}
                      >
                        <span className="flex items-center gap-1">
                          {label}
                          {key && sortKey === key && (
                            sortDir === 'asc' ? <FaSortUp className="text-blue-600" /> : <FaSortDown className="text-blue-600" />
                          )}
                        </span>
                      </th>
                    ))}
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {files.data.map(file => {
                    const { icon, bg, color } = fileIconMap(file.type);
                    const selected = selectedFiles.includes(file.id);
                    return (
                      <tr
                        key={file.id}
                        className={`group cursor-pointer transition-colors
                          ${selected
                            ? 'bg-blue-50 dark:bg-blue-900/20'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'
                          }`}
                        onClick={() => router.visit(`/files/${file.id}`)}
                      >
                        <td className="px-4 py-3" onClick={e => toggleOne(file.id, e)}>
                          <span className={`w-4 h-4 rounded flex items-center justify-center border transition-colors
                            ${selected
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-slate-300 dark:border-slate-600 opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            {selected && <FaCheck className="text-[8px]" />}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center ${color} text-sm flex-shrink-0`}>
                              {icon}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {file.name}
                              </p>
                              <p className="text-[11px] text-slate-400">{file.type?.split('/')[1]?.toUpperCase() || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-slate-700 dark:text-slate-300">{file.project?.name || <span className="text-slate-400">—</span>}</p>
                          {file.user && <p className="text-[11px] text-slate-400 flex items-center gap-1"><FaUser className="text-[9px]" />{file.user.name}</p>}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 font-medium">{fmtSize(file.size)}</td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                            <FaCalendarAlt className="text-[10px] text-slate-400" />
                            {fmtDate(file.created_at)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {file.dropbox_path
                            ? <Badge className="bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-700"><FaDropbox className="text-[9px]" />Dropbox</Badge>
                            : <Badge className="bg-slate-100 text-slate-500 ring-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:ring-slate-600"><FaCloudUploadAlt className="text-[9px]" />Local</Badge>
                          }
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={e => { e.stopPropagation(); router.visit(`/files/${file.id}`); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <FaEye className="text-sm" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Pagination ── */}
        {files.data.length > 0 && files.links?.length > 3 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Page {files.current_page} sur {files.last_page} · {files.total} résultats
            </p>
            <div className="flex items-center gap-1">
              {files.links.map((link, i) => {
                const isArrow = link.label.includes('&laquo;') || link.label.includes('&raquo;');
                return (
                  <Link
                    key={i}
                    href={link.url || '#'}
                    className={`inline-flex items-center justify-center min-w-[32px] h-8 px-2 rounded-lg text-xs font-semibold transition-colors
                      ${link.active
                        ? 'bg-blue-600 text-white'
                        : link.url
                          ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                          : 'opacity-30 cursor-not-allowed bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400'
                      }`}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Toast notification ── */}
      <div className={`fixed bottom-5 right-5 z-50 transition-all duration-500 ${notifVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <div className="flex items-center gap-3 bg-slate-900 dark:bg-slate-700 text-white px-5 py-3.5 rounded-xl shadow-xl">
          <span className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
            <FaCheck className="text-[10px]" />
          </span>
          <span className="text-sm font-medium">{notification}</span>
          <button onClick={() => setNotifVisible(false)} className="ml-2 text-white/60 hover:text-white transition-colors">
            <FaTimes className="text-xs" />
          </button>
        </div>
      </div>
    </div>
  );
}

Index.layout = page => <AdminLayout children={page} />;
