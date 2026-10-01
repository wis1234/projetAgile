import React, { useEffect, useState, useCallback, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import MobileLayout from '@/Layouts/MobileLayout';
import { FaSearch, FaMicrophone, FaImage, FaCheckDouble, FaCommentDots, FaInbox, FaPaperPlane } from 'react-icons/fa';

// ─── Helpers partagés avec la version web (avatars, dates, aperçus) ───
const AVATAR_PALETTE = [
  'from-blue-500 to-indigo-600', 'from-emerald-500 to-teal-600', 'from-purple-500 to-fuchsia-600',
  'from-amber-500 to-orange-600', 'from-rose-500 to-pink-600', 'from-cyan-500 to-sky-600',
  'from-violet-500 to-purple-600', 'from-lime-500 to-emerald-600',
];

const hashString = (str = '') => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash);
};

const getAvatarGradient = (seed) => AVATAR_PALETTE[hashString(seed) % AVATAR_PALETTE.length];

const getInitials = (title = '') => {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isToday) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (date.toDateString() === yesterday.toDateString()) return 'Hier';
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) return date.toLocaleDateString('fr-FR', { weekday: 'short' });
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

const getMessagePreview = (lastMessage) => {
  if (!lastMessage) return { icon: null, text: 'Aucun message pour le moment' };
  if (lastMessage.type === 'audio') return { icon: <FaMicrophone className="w-3 h-3 flex-shrink-0" />, text: 'Message vocal' };
  if (lastMessage.type === 'image') return { icon: <FaImage className="w-3 h-3 flex-shrink-0" />, text: 'Photo' };
  const text = (lastMessage.content || '').replace(/\s+/g, ' ').trim();
  return { icon: null, text: text || '...' };
};

const SEEN_KEY_PREFIX = 'discussion_seen_';
const getLastSeen = (taskId) => (typeof window === 'undefined' ? null : localStorage.getItem(`${SEEN_KEY_PREFIX}${taskId}`));
const setLastSeen = (taskId) => { if (typeof window !== 'undefined') localStorage.setItem(`${SEEN_KEY_PREFIX}${taskId}`, new Date().toISOString()); };
const formatInboxTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};
const getInboxChannelName = (userAId, userBId) => {
  const ids = [Number(userAId), Number(userBId)].sort((a, b) => a - b);
  return `private-inbox.${ids[0]}.${ids[1]}`;
};
const getCsrfToken = () => {
  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  return token || '';
};

const isUnread = (d) => {
  const lastSeen = getLastSeen(d.task_id);
  const lastMsgDate = d.last_message?.created_at ? new Date(d.last_message.created_at) : null;
  const isFromOther = d.last_message && !d.last_message.is_me;
  return Boolean(isFromOther && lastMsgDate && (!lastSeen || lastMsgDate > new Date(lastSeen)));
};

const SkeletonRow = () => (
  <div className="flex items-center gap-3 px-4 py-3.5 animate-pulse">
    <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
      <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
      <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
    </div>
  </div>
);

export default function MobileDiscussionsIndex() {
  const { auth } = usePage().props;
  const currentUserId = auth?.user?.id;
  const [discussions, setDiscussions] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('tasks');
  const [inboxContacts, setInboxContacts] = useState([]);
  const [selectedInboxUserId, setSelectedInboxUserId] = useState(null);
  const [inboxMessages, setInboxMessages] = useState([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxError, setInboxError] = useState('');
  const [inboxDraft, setInboxDraft] = useState('');
  const [sendingInbox, setSendingInbox] = useState(false);

  const debounceRef = useRef(null);
  const scrollRef = useRef(null);
  const searchRef = useRef('');

  const fetchPage = useCallback(async (pageNum, searchTerm, { replace = false } = {}) => {
    try {
      if (pageNum === 1 && !replace) setLoading(true);
      const params = new URLSearchParams({ page: String(pageNum) });
      if (searchTerm) params.set('search', searchTerm);

      const res = await fetch(`/api/discussions?${params.toString()}`, {
        credentials: 'same-origin',
        headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
      });
      if (!res.ok) throw new Error();
      const json = await res.json();

      setDiscussions(prev => (pageNum === 1 ? json.data : [...prev, ...json.data]));
      setLastPage(json.last_page || 1);
      setPage(json.current_page || 1);
      setError('');
    } catch {
      setError('Impossible de charger les discussions.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Chargement initial
  useEffect(() => { fetchPage(1, ''); }, [fetchPage]);

  // Recherche avec debounce → toujours repartir de la page 1
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

  const loadInboxContacts = useCallback(async () => {
    try {
      const res = await fetch('/api/inbox/users', {
        credentials: 'same-origin',
        headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setInboxError('');
      setInboxContacts(list);
      if (!selectedInboxUserId && list[0]) setSelectedInboxUserId(list[0].id);
    } catch {
      setInboxError('L\'inbox n\'a pas pu être chargé.');
    }
  }, [selectedInboxUserId]);

  const loadInboxMessages = useCallback(async (contactId) => {
    if (!contactId) return;
    setInboxLoading(true);
    setInboxError('');
    try {
      const res = await fetch(`/api/inbox/conversations/${contactId}`, {
        credentials: 'same-origin',
        headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.message || 'Impossible d\'ouvrir cette discussion.');
      }
      const payload = await res.json();
      setInboxMessages(Array.isArray(payload.messages) ? payload.messages : []);
    } catch (err) {
      setInboxError(err.message || 'Impossible d\'ouvrir cette discussion.');
    } finally {
      setInboxLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab !== 'inbox') return;
    loadInboxContacts();
  }, [activeTab, loadInboxContacts]);

  useEffect(() => {
    if (!activeTab || activeTab !== 'inbox' || !selectedInboxUserId) return;
    loadInboxMessages(selectedInboxUserId);
  }, [activeTab, selectedInboxUserId, loadInboxMessages]);

  useEffect(() => {
    if (!window.Echo || !selectedInboxUserId || !currentUserId || activeTab !== 'inbox') return;
    const channelName = getInboxChannelName(currentUserId, selectedInboxUserId);
    const channel = window.Echo.private(channelName);
    channel.listen('.inbox.message', (payload) => {
      const message = payload?.message;
      if (!message) return;
      setInboxMessages((prev) => {
        if (prev.some((msg) => String(msg.id) === String(message.id))) return prev;
        return [...prev, message];
      });
      setInboxContacts((prev) => prev.map((contact) => {
        if (String(contact.id) !== String(selectedInboxUserId)) return contact;
        return { ...contact, last_message: { ...message, is_me: Number(message.sender_id) === Number(currentUserId) } };
      }));
    });
    return () => window.Echo.leave(channelName);
  }, [selectedInboxUserId, currentUserId, activeTab]);

  const handleInboxSend = useCallback(async () => {
    if (!selectedInboxUserId || !inboxDraft.trim()) return;
    setSendingInbox(true);
    setInboxError('');
    try {
      const res = await fetch(`/api/inbox/conversations/${selectedInboxUserId}/messages`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': getCsrfToken(),
        },
        body: JSON.stringify({ content: inboxDraft.trim() }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.message || 'Envoi impossible.');
      const message = payload?.message;
      if (message) {
        setInboxMessages((prev) => {
          if (prev.some((msg) => String(msg.id) === String(message.id))) return prev;
          return [...prev, message];
        });
        setInboxContacts((prev) => prev.map((contact) => {
          if (String(contact.id) !== String(selectedInboxUserId)) return contact;
          return { ...contact, last_message: { ...message, is_me: true } };
        }));
      }
      setInboxDraft('');
    } catch (err) {
      setInboxError(err.message || 'Message non envoyé.');
    } finally {
      setSendingInbox(false);
    }
  }, [inboxDraft, selectedInboxUserId]);

  const openDiscussion = (taskId) => {
    setLastSeen(taskId);
    router.visit(`/tasks/${taskId}/discussion`);
  };

  return (
    <MobileLayout title="Discussions" fullBleed>
      <div className="flex flex-col h-full">

        <div className="px-3 pt-3 flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
          <div className="flex gap-2 rounded-full bg-gray-100 dark:bg-gray-800 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('tasks')}
              className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold ${activeTab === 'tasks' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-300'}`}
            >
              Tâches
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('inbox')}
              className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold ${activeTab === 'inbox' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-300'}`}
            >
              <span className="inline-flex items-center gap-1.5"><FaInbox className="text-[10px]" /> Inbox</span>
            </button>
          </div>
        </div>

        {/* Barre de recherche, sticky sous le header */}
        <div className="px-3 pt-3 pb-2 flex-shrink-0 bg-white dark:bg-gray-900 sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800">
          <div className="relative">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={activeTab === 'inbox' ? 'Rechercher un contact...' : 'Rechercher une tâche ou un projet...'}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-100 dark:bg-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-100 transition-colors"
            />
          </div>
        </div>

        {error && (
          <div className="mx-3 mt-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-300">
            {error}
          </div>
        )}

        {activeTab === 'inbox' ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                <span>{inboxContacts.length} contact{inboxContacts.length > 1 ? 's' : ''}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2 py-1 font-semibold uppercase tracking-wide">E2EE</span>
              </div>
            </div>
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <div className="max-h-48 overflow-y-auto border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                {inboxContacts.length === 0 ? (
                  inboxError ? (
                  <div className="px-3 py-5 text-xs text-red-600 dark:text-red-400">{inboxError} <button type="button" onClick={loadInboxContacts} className="font-semibold underline">Réessayer</button></div>
                ) : (
                  <div className="px-3 py-5 text-xs text-gray-500 dark:text-gray-400">Aucun contact partagé dans vos projets.</div>
                )
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                    {inboxContacts.filter((contact) => !search || `${contact.name}`.toLowerCase().includes(search.toLowerCase())).map((contact) => (
                      <li key={contact.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedInboxUserId(contact.id)}
                          className={`w-full flex items-center gap-3 px-3 py-3 text-left ${String(selectedInboxUserId) === String(contact.id) ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-900'}`}
                        >
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white">
                            {contact.name?.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{contact.name}</p>
                              {contact.last_message && <span className="text-[10px] text-gray-400">{formatInboxTime(contact.last_message.created_at)}</span>}
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

              <div className="flex-1 flex flex-col min-h-0 px-3 py-3">
                {!selectedInboxUserId ? (
                  <div className="flex-1 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 text-center px-4">
                    Sélectionnez un contact pour démarrer un chat privé chiffré.
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                        {inboxContacts.find((contact) => String(contact.id) === String(selectedInboxUserId))?.name?.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                          {inboxContacts.find((contact) => String(contact.id) === String(selectedInboxUserId))?.name || 'Conversation'}
                        </p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Sécurisé / en ligne</p>
                      </div>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto space-y-3 rounded-xl bg-gray-50 dark:bg-gray-900/60 p-3">
                      {inboxLoading ? (
                        <div className="flex items-center justify-center h-full text-xs text-gray-500 dark:text-gray-400">Chargement du fil...</div>
                      ) : inboxError ? (
                        <div className="text-xs text-red-500 dark:text-red-300">{inboxError}</div>
                      ) : inboxMessages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-xs text-gray-500 dark:text-gray-400 text-center">Commencez la conversation en toute confidentialité.</div>
                      ) : (
                        inboxMessages.map((message) => (
                          <div key={message.id} className={`flex ${Number(message.sender_id) === Number(currentUserId) ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${Number(message.sender_id) === Number(currentUserId) ? 'bg-blue-600 text-white rounded-br-md' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-md'}`}>
                              <p className="whitespace-pre-wrap break-words">{message.content}</p>
                              <span className={`mt-1 block text-[10px] ${Number(message.sender_id) === Number(currentUserId) ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'}`}>
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
                        placeholder="Écrire un message..."
                        className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleInboxSend}
                        disabled={sendingInbox || !inboxDraft.trim()}
                        className="px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendingInbox ? '...' : <FaPaperPlane className="text-sm" />}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
              </div>
            ) : discussions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 px-6 text-center">
                <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                  <FaCommentDots className="text-2xl text-blue-400" />
                </div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {search ? 'Aucune discussion ne correspond à votre recherche.' : "Vous n'avez encore aucune discussion de tâche."}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {discussions.map((d) => {
                  const unread = isUnread(d);
                  const preview = getMessagePreview(d.last_message);
                  const initials = getInitials(d.task_title);
                  const gradient = getAvatarGradient(`${d.task_id}-${d.task_title}`);

                  return (
                    <li key={d.task_id}>
                      <button
                        type="button"
                        onClick={() => openDiscussion(d.task_id)}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-gray-100 dark:active:bg-gray-800/60 transition-colors ${unread ? 'bg-blue-50/60 dark:bg-blue-900/10' : ''}`}
                      >
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                          {initials}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-sm truncate ${unread ? 'font-bold text-gray-900 dark:text-white' : 'font-semibold text-gray-800 dark:text-gray-100'}`}>
                              {d.task_title}
                            </p>
                            <span className={`flex-shrink-0 text-[11px] ${unread ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-400 dark:text-gray-500'}`}>
                              {formatRelativeTime(d.last_message?.created_at)}
                            </span>
                          </div>

                          <p className="text-[11px] text-indigo-500 dark:text-indigo-400 font-medium truncate mt-0.5 mb-1">
                            {d.project_name || 'Sans projet'}
                          </p>

                          <div className="flex items-center justify-between gap-2">
                            <p className={`flex items-center gap-1.5 text-xs truncate ${unread ? 'text-gray-700 dark:text-gray-200 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                              {d.last_message?.is_me && <FaCheckDouble className="w-3 h-3 text-blue-400 flex-shrink-0" />}
                              {preview.icon}
                              {d.last_message && !d.last_message.is_me && d.last_message.user_name && (
                                <span className="font-semibold text-gray-600 dark:text-gray-300">{d.last_message.user_name.split(' ')[0]}:</span>
                              )}
                              <span className="truncate">{preview.text}</span>
                            </p>
                            {unread && <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {loadingMore && (
              <div className="py-4 flex justify-center">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}