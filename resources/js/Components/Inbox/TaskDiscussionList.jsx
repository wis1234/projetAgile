import React, { useCallback, useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { FaSearch, FaTimes, FaExclamationCircle, FaCommentDots, FaProjectDiagram } from 'react-icons/fa';
import { ListSkeleton, Spinner } from './Skeletons';
import { formatListTime } from '@/lib/inbox';

const GRADIENTS = [
  'from-blue-500 to-indigo-600', 'from-emerald-500 to-teal-600', 'from-purple-500 to-fuchsia-600',
  'from-amber-500 to-orange-600', 'from-rose-500 to-pink-600', 'from-cyan-500 to-sky-600',
];
const hash = (s = '') => { let h = 0; for (let i = 0; i < s.length; i += 1) h = s.charCodeAt(i) + ((h << 5) - h); return Math.abs(h); };
const initials = (t = '') => { const w = t.trim().split(/\s+/).filter(Boolean); return w.length ? (w.length === 1 ? w[0].slice(0, 2) : w[0][0] + w[1][0]).toUpperCase() : '?'; };

const SEEN = 'discussion_seen_';
const lastSeen = (id) => (typeof window === 'undefined' ? null : localStorage.getItem(`${SEEN}${id}`));
const isUnread = (d) => {
  const l = d.last_message;
  if (!l || l.is_me) return false;
  const seen = lastSeen(d.task_id);
  const at = l.created_at ? new Date(l.created_at) : null;
  return !!(at && (!seen || at > new Date(seen)));
};
const preview = (l) => {
  if (!l) return 'Aucun message pour le moment';
  const who = l.is_me ? 'Vous' : (l.user_name || '').split(' ')[0];
  const body = l.type === 'audio' ? '🎤 Message vocal' : l.type === 'image' ? '📷 Photo' : (l.content || '').replace(/\s+/g, ' ').trim() || '…';
  return `${who ? `${who} : ` : ''}${body}`;
};
const headers = { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' };

/** Discussions de tâches : chargement progressif (page suivante au scroll), recherche et filtre projet. */
export default function TaskDiscussionList({ scrollParent = null, withProjectFilter = true, onUnreadChange }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [project, setProject] = useState('all');
  const [projects, setProjects] = useState([]);
  const sentinel = useRef(null);
  const busy = useRef(false);
  const abort = useRef(null);

  useEffect(() => { const t = setTimeout(() => setQuery(search.trim()), 300); return () => clearTimeout(t); }, [search]);

  useEffect(() => {
    if (!withProjectFilter) return;
    fetch('/api/discussions/projects', { credentials: 'same-origin', headers })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setProjects(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [withProjectFilter]);

  const fetchPage = useCallback(async (p, signal) => {
    const qs = new URLSearchParams({ page: String(p) });
    if (query) qs.set('search', query);
    if (project !== 'all') qs.set('project_id', project);
    const res = await fetch(`/api/discussions?${qs}`, { credentials: 'same-origin', headers, signal });
    if (!res.ok) throw new Error('Impossible de charger les discussions.');
    return res.json();
  }, [query, project]);

  const loadFirst = useCallback(async (silent = false) => {
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    if (!silent) setLoading(true);
    try {
      const json = await fetchPage(1, ctrl.signal);
      setItems(Array.isArray(json.data) ? json.data : []);
      setPage(json.current_page || 1);
      setLastPage(json.last_page || 1);
      setError('');
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message);
    } finally {
      if (!ctrl.signal.aborted && !silent) setLoading(false);
    }
  }, [fetchPage]);

  useEffect(() => { loadFirst(); return () => abort.current?.abort(); }, [loadFirst]);

  const loadMore = useCallback(async () => {
    if (busy.current || page >= lastPage) return;
    busy.current = true;
    setLoadingMore(true);
    try {
      const json = await fetchPage(page + 1);
      setItems((prev) => {
        const seen = new Set(prev.map((d) => d.task_id));
        return [...prev, ...(json.data || []).filter((d) => !seen.has(d.task_id))];
      });
      setPage(json.current_page || page + 1);
      setLastPage(json.last_page || lastPage);
    } catch (e) {
      setError(e.message);
    } finally {
      busy.current = false;
      setLoadingMore(false);
    }
  }, [fetchPage, page, lastPage]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || page >= lastPage) return undefined;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) loadMore(); }, { root: scrollParent, rootMargin: '300px 0px' });
    io.observe(node);
    return () => io.disconnect();
  }, [loadMore, page, lastPage, scrollParent, items.length]);

  useEffect(() => {
    const sync = () => { if (!document.hidden) loadFirst(true); };
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('focus', sync);
    const iv = setInterval(sync, 60000);
    return () => { document.removeEventListener('visibilitychange', sync); window.removeEventListener('focus', sync); clearInterval(iv); };
  }, [loadFirst]);

  const unreadCount = items.filter(isUnread).length;
  useEffect(() => { onUnreadChange?.(unreadCount); }, [unreadCount, onUnreadChange]);

  const open = (d) => { localStorage.setItem(`${SEEN}${d.task_id}`, new Date().toISOString()); router.visit(`/tasks/${d.task_id}/discussion`); };

  return (
    <div>
      <div className="sticky top-0 z-10 space-y-2 bg-white/95 px-3 pb-2 pt-3 backdrop-blur dark:bg-slate-900/95">
        <div className="relative">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une tâche…" aria-label="Rechercher une tâche"
            className="w-full rounded-full border-0 bg-slate-100 py-3 pl-10 pr-10 text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:bg-slate-800 dark:text-slate-100 md:py-2.5 md:text-sm" />
          {search && <button type="button" onClick={() => setSearch('')} aria-label="Effacer" className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400"><FaTimes /></button>}
        </div>
        {withProjectFilter && projects.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[{ id: 'all', name: 'Tous les projets' }, ...projects].map((p) => (
              <button key={p.id} type="button" onClick={() => setProject(String(p.id))}
                className={`flex-shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold ${String(project) === String(p.id) ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-300' : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>{p.name}</button>
            ))}
          </div>
        )}
      </div>

      {loading ? <ListSkeleton rows={7} /> : error && items.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <FaExclamationCircle className="mx-auto text-3xl text-red-400" />
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{error}</p>
          <button type="button" onClick={() => loadFirst()} className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white">Réessayer</button>
        </div>
      ) : items.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <FaCommentDots className="mx-auto text-4xl text-slate-300 dark:text-slate-600" />
          <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{query ? 'Aucun résultat' : 'Aucune discussion'}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{query ? 'Essayez un autre mot-clé.' : 'Les discussions de vos tâches apparaîtront ici.'}</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((d) => {
            const unread = isUnread(d);
            return (
              <li key={d.task_id}>
                <button type="button" onClick={() => open(d)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 active:bg-slate-100 dark:hover:bg-slate-800/60 dark:active:bg-slate-800">
                  <span className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${GRADIENTS[hash(`${d.task_id}${d.task_title}`) % GRADIENTS.length]} text-sm font-extrabold text-white shadow-sm`}>{initials(d.task_title)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={`truncate text-[15px] ${unread ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-800 dark:text-slate-100'}`}>{d.task_title}</p>
                      {d.last_message && <span className={`flex-shrink-0 text-[11px] ${unread ? 'font-semibold text-emerald-600' : 'text-slate-400'}`}>{formatListTime(d.last_message.created_at)}</span>}
                    </div>
                    {d.project_name && <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] font-medium text-blue-600 dark:text-blue-300"><FaProjectDiagram className="h-2.5 w-2.5" />{d.project_name}</p>}
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p className={`truncate text-[13px] ${unread ? 'font-medium text-slate-700 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>{preview(d.last_message)}</p>
                      {unread && <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-emerald-500" aria-label="Non lu" />}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {page < lastPage && <div ref={sentinel} className="h-px" />}
      {loadingMore && <div className="flex justify-center py-4"><Spinner /></div>}
    </div>
  );
}
