// resources/js/Pages/Mobile/Tasks/Index.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import MobileLayout from '@/Layouts/MobileLayout';
import { FaArrowRight, FaCalendarAlt, FaPlus, FaSearch } from 'react-icons/fa';

const statusColors = {
  todo: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-amber-100 text-amber-700',
  done: 'bg-emerald-100 text-emerald-700',
  en_attente: 'bg-blue-100 text-blue-700',
};

// ─── Skeletons ────────────────────────────────────────────────────────────
const Pulse = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
);

const TaskCardSkeleton = () => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 space-y-2">
        <Pulse className="h-3.5 w-2/3" />
        <Pulse className="h-2.5 w-1/3" />
      </div>
      <Pulse className="h-3 w-3 rounded-full flex-shrink-0" />
    </div>
    <div className="mt-4 flex items-center justify-between">
      <Pulse className="h-5 w-16 rounded-full" />
      <Pulse className="h-3 w-14" />
    </div>
  </div>
);

const TasksSkeleton = () => (
  <div className="min-h-full bg-slate-50 px-4 pb-5 pt-4">
    <div className="mb-5 flex items-center justify-between">
      <div className="space-y-2">
        <Pulse className="h-2.5 w-32" />
        <Pulse className="h-6 w-28" />
      </div>
      <Pulse className="h-11 w-11 rounded-full" />
    </div>
    <Pulse className="h-12 w-full rounded-2xl mb-5" />
    <div className="mb-5 flex gap-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <Pulse key={i} className="h-16 min-w-[92px] rounded-2xl" />
      ))}
    </div>
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => <TaskCardSkeleton key={i} />)}
    </div>
  </div>
);

export default function MobileTasksIndex() {
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState({});
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const debounceRef = useRef(null);
  const scrollRef = useRef(null);
  const searchRef = useRef('');

  const fetchPage = useCallback(async (pageNum, searchTerm, { replace = false } = {}) => {
    try {
      if (pageNum === 1 && !replace) setLoading(true);
      const params = new URLSearchParams({ page: String(pageNum) });
      if (searchTerm) params.set('search', searchTerm);

      const res = await fetch(`/tasks?${params.toString()}`, {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      if (!res.ok) throw new Error();
      const json = await res.json();

      setTasks(prev => (pageNum === 1 ? json.tasks.data : [...prev, ...json.tasks.data]));
      setSummary(json.summary || {});
      setLastPage(json.tasks.last_page || 1);
      setPage(json.tasks.current_page || 1);
      setError('');
    } catch {
      setError('Impossible de charger les tâches.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { fetchPage(1, ''); }, [fetchPage]);

  useEffect(() => {
    if (searchRef.current === search) return;
    searchRef.current = search;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchPage(1, search, { replace: true });
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, fetchPage]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || loadingMore || loading || page >= lastPage) return;
    if (el.scrollTop + el.clientHeight > el.scrollHeight - 250) {
      setLoadingMore(true);
      fetchPage(page + 1, search);
    }
  };

  const submitSearch = (e) => {
    e.preventDefault();
    fetchPage(1, search, { replace: true });
  };

  return (
    <MobileLayout title="Tâches" fullBleed>
      <Head title="Tâches" />

      {error && (
        <div className="mx-4 mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center justify-between gap-2">
          <span>{error}</span>
          <button onClick={() => fetchPage(1, search, { replace: true })} className="font-semibold underline flex-shrink-0">
            Réessayer
          </button>
        </div>
      )}

      {loading ? (
        <TasksSkeleton />
      ) : (
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="min-h-full overflow-y-auto bg-slate-50 px-4 pb-5 pt-4"
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                À faire aujourd'hui
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950">Mes tâches</h2>
            </div>
            <Link
              href="/tasks/create"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/25 active:scale-95 transition-transform"
              aria-label="Nouvelle tâche"
            >
              <FaPlus />
            </Link>
          </div>

          <form onSubmit={submitSearch} className="relative mb-5">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une tâche"
              className="h-12 w-full rounded-2xl border-0 bg-white pl-11 pr-4 text-sm shadow-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500"
            />
          </form>

          <div className="mb-5 flex gap-2 overflow-x-auto scrollbar-hide">
            <div className="min-w-[92px] rounded-2xl bg-blue-600 p-3 text-white">
              <p className="text-xl font-bold">{summary.total || 0}</p>
              <p className="text-[11px] text-blue-100">Total</p>
            </div>
            <div className="min-w-[92px] rounded-2xl bg-white p-3 shadow-sm">
              <p className="text-xl font-bold text-slate-950">{summary.in_progress || 0}</p>
              <p className="text-[11px] text-slate-500">En cours</p>
            </div>
            <div className="min-w-[92px] rounded-2xl bg-white p-3 shadow-sm">
              <p className="text-xl font-bold text-slate-950">{summary.done || 0}</p>
              <p className="text-[11px] text-slate-500">Terminées</p>
            </div>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm active:scale-[.99] transition-transform"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-950">{task.title}</h3>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {task.project?.name || task.project_name || 'Sans projet'}
                    </p>
                  </div>
                  <FaArrowRight className="mt-1 flex-shrink-0 text-xs text-slate-400" />
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusColors[task.status] || statusColors.todo}`}>
                    {task.status || 'À faire'}
                  </span>
                  {task.due_date && (
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <FaCalendarAlt />
                      {new Date(task.due_date).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>
              </Link>
            ))}

            {!tasks.length && (
              <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500">
                Aucune tâche trouvée.
              </div>
            )}
          </div>

          {loadingMore && (
            <div className="py-4 flex justify-center">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}
    </MobileLayout>
  );
}