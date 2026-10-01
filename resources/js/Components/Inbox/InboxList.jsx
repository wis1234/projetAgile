import React, { useCallback, useEffect, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { FaSearch, FaCheck, FaCheckDouble, FaUserFriends, FaExclamationCircle, FaTimes } from 'react-icons/fa';
import { ListSkeleton, Spinner } from './Skeletons';
import { fetchInboxPage, contactAvatar, formatListTime, messagePreview } from '@/lib/inbox';

/**
 * Liste des conversations privées : chargement progressif au scroll (page par page),
 * recherche, badges « non lus » serveur et mise à jour en temps réel.
 * `scrollParent` : élément qui défile (par défaut le viewport).
 */
export default function InboxList({ onOpen, onUnreadChange, scrollParent = null, className = '' }) {
  const { auth } = usePage().props;
  const me = auth?.user || auth;

  const [items, setItems] = useState([]);
  const [nextPage, setNextPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const sentinelRef = useRef(null);
  const abortRef = useRef(null);
  const busyRef = useRef(false);

  // Recherche avec anti-rebond
  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadFirst = useCallback(async (silent = false) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    if (!silent) setLoading(true);
    try {
      const res = await fetchInboxPage({ page: 1, search: query }, ctrl.signal);
      setItems(res.data || []);
      setNextPage(res.next_page);
      onUnreadChange?.(res.unread_total || 0);
      setError('');
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message || 'Impossible de charger les conversations.');
    } finally {
      if (!ctrl.signal.aborted && !silent) setLoading(false);
    }
  }, [query, onUnreadChange]);

  useEffect(() => { loadFirst(); return () => abortRef.current?.abort(); }, [loadFirst]);

  const loadMore = useCallback(async () => {
    if (!nextPage || busyRef.current) return;
    busyRef.current = true;
    setLoadingMore(true);
    try {
      const res = await fetchInboxPage({ page: nextPage, search: query });
      setItems((prev) => {
        const seen = new Set(prev.map((c) => c.id));
        return [...prev, ...(res.data || []).filter((c) => !seen.has(c.id))];
      });
      setNextPage(res.next_page);
    } catch (err) {
      setError(err.message || 'Impossible de charger la suite.');
    } finally {
      busyRef.current = false;
      setLoadingMore(false);
    }
  }, [nextPage, query]);

  // Chargement progressif : la page suivante arrive juste avant la fin de la liste
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !nextPage) return undefined;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) loadMore(); }, { root: scrollParent, rootMargin: '300px 0px' });
    io.observe(node);
    return () => io.disconnect();
  }, [loadMore, nextPage, scrollParent, items.length]);

  // Temps réel : un message arrive → la conversation remonte en tête avec son badge
  useEffect(() => {
    if (!window.Echo || !me?.id) return undefined;
    const channel = window.Echo.private(`user.${me.id}`);
    const handler = (e) => {
      const msg = e?.message;
      if (!msg) return;
      const from = Number(msg.sender_id);
      setItems((prev) => {
        const idx = prev.findIndex((c) => Number(c.id) === from);
        if (idx === -1) { loadFirst(true); return prev; }
        const updated = { ...prev[idx], last_message: { ...msg, is_me: false }, unread_count: (prev[idx].unread_count || 0) + 1 };
        return [updated, ...prev.filter((_, i) => i !== idx)];
      });
    };
    channel.listen('.inbox.message', handler);
    return () => channel.stopListening('.inbox.message', handler);
  }, [me?.id, loadFirst]);

  // Retour sur l'onglet / la page : on resynchronise (badges lus depuis un autre appareil, etc.)
  useEffect(() => {
    const sync = () => { if (!document.hidden) loadFirst(true); };
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('focus', sync);
    return () => { document.removeEventListener('visibilitychange', sync); window.removeEventListener('focus', sync); };
  }, [loadFirst]);

  const open = (c) => {
    setItems((prev) => prev.map((x) => (x.id === c.id ? { ...x, unread_count: 0 } : x)));
    onOpen?.(c);
  };

  return (
    <div className={className}>
      <div className="sticky top-0 z-10 bg-white/95 px-3 pb-2 pt-3 backdrop-blur dark:bg-slate-900/95">
        <div className="relative">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un contact…" aria-label="Rechercher un contact"
            className="w-full rounded-full border-0 bg-slate-100 py-3 pl-10 pr-10 text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:bg-slate-800 dark:text-slate-100 md:py-2.5 md:text-sm"
          />
          {search && <button type="button" onClick={() => setSearch('')} aria-label="Effacer" className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400"><FaTimes /></button>}
        </div>
      </div>

      {loading ? (
        <ListSkeleton rows={7} />
      ) : error && items.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <FaExclamationCircle className="mx-auto text-3xl text-red-400" />
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{error}</p>
          <button type="button" onClick={() => loadFirst()} className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white">Réessayer</button>
        </div>
      ) : items.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <FaUserFriends className="mx-auto text-4xl text-slate-300 dark:text-slate-600" />
          <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{query ? 'Aucun résultat' : 'Aucun contact pour le moment'}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{query ? 'Essayez un autre nom.' : 'Vous pouvez écrire aux membres des projets que vous partagez.'}</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((c) => {
            const last = c.last_message;
            const unread = c.unread_count > 0;
            return (
              <li key={c.id}>
                <button type="button" onClick={() => open(c)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 active:bg-slate-100 dark:hover:bg-slate-800/60 dark:active:bg-slate-800">
                  <img src={contactAvatar(c)} alt="" loading="lazy" className="h-12 w-12 flex-shrink-0 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={`truncate text-[15px] ${unread ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-800 dark:text-slate-100'}`}>{c.name}</p>
                      {last && <span className={`flex-shrink-0 text-[11px] ${unread ? 'font-semibold text-emerald-600' : 'text-slate-400'}`}>{formatListTime(last.created_at)}</span>}
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p className={`flex min-w-0 items-center gap-1 truncate text-[13px] ${unread ? 'font-medium text-slate-700 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
                        {last?.is_me && (last.read_at ? <FaCheckDouble className="h-3 w-3 flex-shrink-0 text-sky-500" /> : <FaCheck className="h-2.5 w-2.5 flex-shrink-0 text-slate-400" />)}
                        <span className="truncate">{last ? `${last.is_me ? 'Vous : ' : ''}${messagePreview(last)}` : 'Démarrer la conversation'}</span>
                      </p>
                      {unread && <span className="flex h-5 min-w-[1.25rem] flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[11px] font-bold text-white">{c.unread_count > 99 ? '99+' : c.unread_count}</span>}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {nextPage && <div ref={sentinelRef} className="h-px" />}
      {loadingMore && <div className="flex justify-center py-4"><Spinner /></div>}
    </div>
  );
}
