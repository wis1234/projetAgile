import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { router } from '@inertiajs/react';
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

export default function DiscussionsIndex() {
  const { t } = useTranslation();
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [openedTaskIds, setOpenedTaskIds] = useState(() => new Set());

  const loadDiscussions = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch('/api/discussions', {
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
      if (!res.ok) throw new Error('Erreur lors du chargement des discussions');
      const data = await res.json();
      setDiscussions(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les discussions pour le moment.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDiscussions();
    const interval = setInterval(() => loadDiscussions(true), 15000);
    return () => clearInterval(interval);
  }, [loadDiscussions]);

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

  const projects = useMemo(() => {
    const map = new Map();
    discussions.forEach((d) => {
      if (d.project_id && !map.has(d.project_id)) {
        map.set(d.project_id, d.project_name || `Projet #${d.project_id}`);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [discussions]);

  const filtered = useMemo(() => {
    let list = enriched;
    if (projectFilter !== 'all') {
      list = list.filter((d) => String(d.project_id) === String(projectFilter));
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (d) =>
          d.task_title?.toLowerCase().includes(q) ||
          d.project_name?.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      // Non lus en premier, puis les plus récents
      if (a._isUnread !== b._isUnread) return a._isUnread ? -1 : 1;
      const dateA = a.last_message?.created_at ? new Date(a.last_message.created_at) : 0;
      const dateB = b.last_message?.created_at ? new Date(b.last_message.created_at) : 0;
      return dateB - dateA;
    });
  }, [enriched, search, projectFilter]);

  const totalUnread = enriched.filter((d) => d._isUnread).length;

  const openDiscussion = (taskId) => {
    setLastSeen(taskId);
    setOpenedTaskIds((prev) => new Set(prev).add(taskId));
    if (typeof window !== 'undefined') {
      localStorage.setItem('taskActiveTab', 'comments');
    }
    router.visit(`/tasks/${taskId}`);
  };

  return (
    <div className="flex flex-col w-full bg-white dark:bg-gray-950 min-h-screen">
      <div className="flex flex-col w-full py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">

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

          {projects.length > 0 && (
            <div className="relative flex-shrink-0 w-full sm:w-56">
              <FaFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-100 appearance-none cursor-pointer transition-colors"
              >
                <option value="all">{t('discussions.all_projects', 'Tous les projets')}</option>
                {projects.map((p) => (
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
                      {/* Avatar "groupe" */}
                      <div
                        className={`flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-sm shadow-sm`}
                      >
                        {initials}
                      </div>

                      {/* Contenu central */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm truncate ${d._isUnread ? 'font-bold text-gray-900 dark:text-white' : 'font-semibold text-gray-800 dark:text-gray-100'}`}>
                            {d.task_title}
                          </p>
                          <span className={`flex-shrink-0 text-[11px] ${d._isUnread ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-400 dark:text-gray-500'}`}>
                            {formatRelativeTime(d.last_message?.created_at)}
                          </span>
                        </div>

                        {/* Badge projet */}
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
          )}
        </div>
      </div>
    </div>
  );
}

DiscussionsIndex.layout = (page) => <AdminLayout children={page} />;