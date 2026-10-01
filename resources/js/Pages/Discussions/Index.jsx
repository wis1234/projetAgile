import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from 'react-i18next';
import {
  FaCommentDots,
  FaSearch,
  FaProjectDiagram,
  FaMicrophone,
  FaImage,
  FaCheckDouble,
  FaFilter,
  FaTimes,
  FaExclamationCircle,
} from 'react-icons/fa';

// ─── Couleurs déterministes pour les avatars de tâches (façon groupes WhatsApp) ───
const AVATAR_PALETTE = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-purple-500 to-fuchsia-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-sky-600',
  'from-violet-500 to-purple-600',
  'from-lime-500 to-emerald-600',
];

const hashString = (str = '') => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

const getAvatarGradient = (seed) => AVATAR_PALETTE[hashString(seed) % AVATAR_PALETTE.length];

const getInitials = (title = '') => {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

// ─── Formatage relatif de l'heure du dernier message (style messagerie) ───
const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  if (isYesterday) return 'Hier';

  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return date.toLocaleDateString('fr-FR', { weekday: 'short' });
  }
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

// ─── Aperçu du dernier message (texte tronqué, ou libellé pour audio/image) ───
const getMessagePreview = (lastMessage) => {
  if (!lastMessage) return { icon: null, text: 'Aucun message pour le moment' };
  if (lastMessage.type === 'audio') {
    return { icon: <FaMicrophone className="w-3 h-3 flex-shrink-0" />, text: 'Message vocal' };
  }
  if (lastMessage.type === 'image') {
    return { icon: <FaImage className="w-3 h-3 flex-shrink-0" />, text: 'Photo' };
  }
  const text = (lastMessage.content || '').replace(/\s+/g, ' ').trim();
  return { icon: null, text: text || '...' };
};

const SEEN_KEY_PREFIX = 'discussion_seen_';
const getLastSeen = (taskId) => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(`${SEEN_KEY_PREFIX}${taskId}`);
};
const setLastSeen = (taskId) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${SEEN_KEY_PREFIX}${taskId}`, new Date().toISOString());
};
const formatInboxTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};
const getCsrfToken = () => {
  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  return token || '';
};
const getInboxChannelName = (userAId, userBId) => {
  const ids = [Number(userAId), Number(userBId)].sort((a, b) => a - b);
  return `private-inbox.${ids[0]}.${ids[1]}`;
};

export default function Index() {
  const { t } = useTranslation();
  const { auth } = usePage().props;
  const currentUserId = auth?.user?.id;
  const [discussions, setDiscussions] = useState([]);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [openedTaskIds, setOpenedTaskIds] = useState(() => new Set());
  const [page, setPage] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [inboxContacts, setInboxContacts] = useState([]);
  const [selectedInboxUserId, setSelectedInboxUserId] = useState(null);
  const [inboxMessages, setInboxMessages] = useState([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxError, setInboxError] = useState('');
  const [inboxDraft, setInboxDraft] = useState('');
  const [sendingInbox, setSendingInbox] = useState(false);

  // ─── Discussions : filtrage (search + project_id) fait côté serveur, comme prévu par le contrôleur ───
   const loadDiscussions = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (projectFilter !== 'all') params.set('project_id', projectFilter);
      if (page > 1) params.set('page', page);

      const res = await fetch(`/api/discussions?${params.toString()}`, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
      if (!res.ok) throw new Error('Erreur lors du chargement des discussions');
      const json = await res.json();
      setDiscussions(Array.isArray(json?.data) ? json.data : []);
      setCurrentPage(json.current_page || 1);
      setLastPage(json.last_page || 1);
      setTotal(json.total || 0);
      setError('');
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les discussions pour le moment.");
    } finally {
      setLoading(false);
    }
  }, [search, projectFilter, page]);

  // ─── Liste des projets pour le filtre : endpoint dédié, indépendant de la pagination ───
  const loadProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/discussions/projects', {
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
      if (!res.ok) return;
      const data = await res.json();
      setAvailableProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  // ─── Recharge à chaque changement de filtre (léger debounce sur la recherche texte) ───
  useEffect(() => {
    const timeout = setTimeout(() => loadDiscussions(), search ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [loadDiscussions, search, projectFilter]);

  useEffect(() => {
    const interval = setInterval(() => loadDiscussions(true), 15000);
    return () => clearInterval(interval);
  }, [loadDiscussions]);

  const loadInboxContacts = useCallback(async () => {
    try {
      const res = await fetch('/api/inbox/users', {
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
      if (!res.ok) throw new Error('Impossible de charger les contacts Inbox.');
      const data = await res.json();
      const normalized = Array.isArray(data) ? data : [];
      setInboxContacts(normalized);
      if (!selectedInboxUserId && normalized[0]) {
        setSelectedInboxUserId(normalized[0].id);
      }
    } catch (err) {
      console.error(err);
      setInboxError('L\'inbox n\'a pas pu être chargé pour le moment.');
    }
  }, [selectedInboxUserId]);

  const loadInboxMessages = useCallback(async (contactId) => {
    if (!contactId) return;
    setInboxLoading(true);
    setInboxError('');
    try {
      const res = await fetch(`/api/inbox/conversations/${contactId}`, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.message || 'Erreur de chargement du fil Inbox.');
      }
      const data = await res.json();
      setInboxMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch (err) {
      console.error(err);
      setInboxError(err.message || 'Impossible d\'ouvrir cette conversation.');
    } finally {
      setInboxLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInboxContacts();
  }, [loadInboxContacts]);

  useEffect(() => {
    if (!selectedInboxUserId) return;
    loadInboxMessages(selectedInboxUserId);
  }, [selectedInboxUserId, loadInboxMessages]);

  useEffect(() => {
    if (!window.Echo || !selectedInboxUserId || !currentUserId) return;

    const channelName = getInboxChannelName(currentUserId, selectedInboxUserId);
    const channel = window.Echo.private(channelName);

    channel.listen('.inbox.message', (payload) => {
      const eventMessage = payload?.message;
      if (!eventMessage) return;

      setInboxMessages((prev) => {
        if (prev.some((msg) => String(msg.id) === String(eventMessage.id))) {
          return prev;
        }
        return [...prev, eventMessage];
      });

      setInboxContacts((prev) => prev.map((contact) => {
        if (String(contact.id) !== String(selectedInboxUserId)) return contact;
        return {
          ...contact,
          last_message: {
            id: eventMessage.id,
            sender_id: eventMessage.sender_id,
            receiver_id: eventMessage.receiver_id,
            content: eventMessage.content,
            created_at: eventMessage.created_at,
            is_me: Number(eventMessage.sender_id) === Number(currentUserId),
          },
        };
      }));
    });

    return () => {
      window.Echo.leave(channelName);
    };
  }, [selectedInboxUserId, currentUserId]);

  const handleInboxSend = useCallback(async () => {
    if (!selectedInboxUserId || !inboxDraft.trim()) return;
    setSendingInbox(true);
    setInboxError('');

    try {
      const csrfToken = getCsrfToken();
      const res = await fetch(`/api/inbox/conversations/${selectedInboxUserId}/messages`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': csrfToken,
        },
        body: JSON.stringify({ content: inboxDraft.trim() }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.message || 'Erreur lors de l\'envoi du message.');
      }

      const nextMessage = payload?.message;
      if (nextMessage) {
        setInboxMessages((prev) => {
          if (prev.some((msg) => String(msg.id) === String(nextMessage.id))) return prev;
          return [...prev, nextMessage];
        });
        setInboxContacts((prev) => prev.map((contact) => {
          if (String(contact.id) !== String(selectedInboxUserId)) return contact;
          return {
            ...contact,
            last_message: {
              id: nextMessage.id,
              sender_id: nextMessage.sender_id,
              receiver_id: nextMessage.receiver_id,
              content: nextMessage.content,
              created_at: nextMessage.created_at,
              is_me: true,
            },
          };
        }));
      }
      setInboxDraft('');
    } catch (err) {
      console.error(err);
      setInboxError(err.message || 'Votre message n\'a pas pu être envoyé.');
    } finally {
      setSendingInbox(false);
    }
  }, [inboxDraft, selectedInboxUserId]);

  // ─── Calcul du statut "non lu" à partir du dernier message vu localement ───
  const enriched = useMemo(() => {
    return discussions.map((d) => {
      const lastSeen = getLastSeen(d.task_id);
      const lastMsgDate = d.last_message?.created_at ? new Date(d.last_message.created_at) : null;
      const isFromOther = d.last_message && !d.last_message.is_me;
      const isUnread =
        openedTaskIds.has(d.task_id)
          ? false
          : Boolean(
              isFromOther &&
                lastMsgDate &&
                (!lastSeen || lastMsgDate > new Date(lastSeen))
            );
      return { ...d, _isUnread: isUnread };
    });
  }, [discussions, openedTaskIds]);

  // ─── Tri d'affichage : non lus en premier (le filtrage search/projet est déjà fait côté serveur) ───
  const filtered = useMemo(() => {
    return [...enriched].sort((a, b) => {
      if (a._isUnread !== b._isUnread) return a._isUnread ? -1 : 1;
      const dateA = a.last_message?.created_at ? new Date(a.last_message.created_at) : 0;
      const dateB = b.last_message?.created_at ? new Date(b.last_message.created_at) : 0;
      return dateB - dateA;
    });
  }, [enriched]);

  const totalUnread = enriched.filter((d) => d._isUnread).length;

  // ─── Ouvre le fil de discussion de la tâche (Discussions/Show, route tasks.discussion) ───
  const openDiscussion = (taskId) => {
    setLastSeen(taskId);
    setOpenedTaskIds((prev) => new Set(prev).add(taskId));
    router.visit(`/tasks/${taskId}/discussion`);
  };

  return (
    <div className="flex flex-col w-full bg-white dark:bg-gray-950 min-h-screen">
      <div className="flex flex-col w-full py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

        {/* En-tête */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md shadow-blue-500/20 flex-shrink-0">
              <FaCommentDots className="text-white text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-white leading-tight">
                {t('discussions.title', 'Discussions')}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('discussions.subtitle', 'Une conversation par tâche, classée par activité récente')}
              </p>
            </div>
          </div>
          {totalUnread > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-bold">
              {totalUnread} {totalUnread > 1 ? 'non lus' : 'non lu'}
            </span>
          )}
        </div>

        {/* Barre de recherche + filtre projet */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('discussions.search_placeholder', 'Rechercher une tâche ou un projet...')}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-100 transition-colors"
            />
          </div>

          {availableProjects.length > 0 && (
            <div className="relative flex-shrink-0 w-full sm:w-56">
              <FaFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-100 appearance-none cursor-pointer transition-colors"
              >
                <option value="all">{t('discussions.all_projects', 'Tous les projets')}</option>
                {availableProjects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Erreur de chargement */}
        {error && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-300">
            <FaExclamationCircle className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-5 xl:grid-cols-[1.5fr_0.95fr]">
          {/* Liste des discussions */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-9 h-9 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('discussions.loading', 'Chargement des discussions...')}</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 px-6 text-center">
                <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                  <FaCommentDots className="text-2xl text-blue-400" />
                </div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {search || projectFilter !== 'all'
                    ? t('discussions.no_results', 'Aucune discussion ne correspond à votre recherche.')
                    : t('discussions.empty', "Vous n'avez encore aucune discussion de tâche.")}
                </p>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filtered.map((d) => {
                    const preview = getMessagePreview(d.last_message);
                    const initials = getInitials(d.task_title);
                    const gradient = getAvatarGradient(`${d.task_id}-${d.task_title}`);

                    return (
                      <li key={d.task_id}>
                        <button
                          type="button"
                          onClick={() => openDiscussion(d.task_id)}
                          className={`w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60 ${
                            d._isUnread ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                          }`}
                        >
                          <div
                            className={`flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-sm shadow-sm`}
                          >
                            {initials}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-sm truncate ${d._isUnread ? 'font-bold text-gray-900 dark:text-white' : 'font-semibold text-gray-800 dark:text-gray-100'}`}>
                                {d.task_title}
                              </p>
                              <span className={`flex-shrink-0 text-[11px] ${d._isUnread ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-400 dark:text-gray-500'}`}>
                                {formatRelativeTime(d.last_message?.created_at)}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 mt-0.5 mb-1">
                              <FaProjectDiagram className="text-[10px] text-indigo-400 flex-shrink-0" />
                              <span className="text-[11px] text-indigo-500 dark:text-indigo-400 font-medium truncate">
                                {d.project_name || 'Sans projet'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <p className={`flex items-center gap-1.5 text-xs truncate ${d._isUnread ? 'text-gray-700 dark:text-gray-200 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                                {d.last_message?.is_me && (
                                  <FaCheckDouble className="w-3 h-3 text-blue-400 flex-shrink-0" />
                                )}
                                {preview.icon}
                                {d.last_message && !d.last_message.is_me && d.last_message.user_name && (
                                  <span className="font-semibold text-gray-600 dark:text-gray-300">{d.last_message.user_name.split(' ')[0]}:</span>
                                )}
                                <span className="truncate">{preview.text}</span>
                              </p>

                              {d._isUnread && (
                                <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-emerald-500 text-white text-[11px] font-bold rounded-full">
                                  {t('discussions.new', 'Nouveau')}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {lastPage > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      Précédent
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Page {currentPage} sur {lastPage} ({total} discussions)
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(lastPage, p + 1))}
                      disabled={currentPage === lastPage}
                      className="px-3 py-1 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      Suivant
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Inbox privé */}
          <aside className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col min-h-[620px]">
            <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Inbox</h2>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Messagerie projet chiffrée</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-2 py-1 text-[10px] font-bold uppercase tracking-wide">
                E2EE
              </span>
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
              <div className="max-h-52 overflow-y-auto border-b border-gray-200 dark:border-gray-700">
                {inboxContacts.length === 0 ? (
                  <div className="px-4 py-5 text-xs text-gray-500 dark:text-gray-400">
                    Aucun contact partagé dans vos projets.
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                    {inboxContacts.map((contact) => (
                      <li key={contact.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedInboxUserId(contact.id)}
                          className={`w-full flex items-center gap-3 px-3 py-3 text-left transition-colors ${
                            String(selectedInboxUserId) === String(contact.id)
                              ? 'bg-blue-50 dark:bg-blue-900/20'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          }`}
                        >
                          <img
                            src={contact.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name || 'User')}&background=0ea5e9&color=fff`}
                            alt={contact.name}
                            className="h-10 w-10 rounded-full object-cover border border-blue-200 dark:border-blue-800"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{contact.name}</p>
                              {contact.last_message && (
                                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                  {formatInboxTime(contact.last_message.created_at)}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                              {contact.last_message ? contact.last_message.content : 'Pas encore de message'}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex-1 min-h-0 p-3">
                {!selectedInboxUserId ? (
                  <div className="h-full flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 text-center px-4">
                    Sélectionnez un contact pour commencer un chat privé.
                  </div>
                ) : (
                  <>
                    <div className="mb-3 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                      <img
                        src={inboxContacts.find((contact) => String(contact.id) === String(selectedInboxUserId))?.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(inboxContacts.find((contact) => String(contact.id) === String(selectedInboxUserId))?.name || 'User')}&background=0ea5e9&color=fff`}
                        alt="contact"
                        className="h-9 w-9 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                          {inboxContacts.find((contact) => String(contact.id) === String(selectedInboxUserId))?.name || 'Conversation'}
                        </p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400">En ligne / sécurisé</p>
                      </div>
                    </div>

                    <div className="flex-1 min-h-[260px] max-h-[340px] overflow-y-auto space-y-3 bg-gray-50 dark:bg-gray-950/60 rounded-xl p-3">
                      {inboxLoading ? (
                        <div className="flex items-center justify-center h-full text-xs text-gray-500 dark:text-gray-400">
                          Chargement du fil...
                        </div>
                      ) : inboxError ? (
                        <div className="text-xs text-red-500 dark:text-red-300">{inboxError}</div>
                      ) : inboxMessages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-xs text-gray-500 dark:text-gray-400 text-center">
                          Commencez la conversation en toute confidentialité.
                        </div>
                      ) : (
                        inboxMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.is_me ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                                message.is_me
                                  ? 'bg-blue-600 text-white rounded-br-md'
                                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-md'
                              }`}
                            >
                              <p className="break-words whitespace-pre-wrap">{message.content}</p>
                              <span className={`mt-1 block text-[10px] ${message.is_me ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'}`}>
                                {formatInboxTime(message.created_at)}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <textarea
                        value={inboxDraft}
                        onChange={(e) => setInboxDraft(e.target.value)}
                        rows={2}
                        placeholder="Écrire un message chiffré..."
                        className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleInboxSend}
                        disabled={sendingInbox || !inboxDraft.trim()}
                        className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendingInbox ? '...' : 'Envoyer'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

Index.layout = (page) => <AdminLayout children={page} />;