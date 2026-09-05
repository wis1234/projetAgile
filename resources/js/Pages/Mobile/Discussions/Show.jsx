import React, { useEffect, useRef, useState, useCallback } from 'react';
import { usePage } from '@inertiajs/react';
import MobileLayout from '@/Layouts/MobileLayout';
import { nativeFeedback } from '@/lib/platform';
import AudioPlayer from '@/Components/AudioPlayer';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getCsrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

const AVATAR_PALETTE = [
  'from-blue-500 to-indigo-600', 'from-emerald-500 to-teal-600', 'from-purple-500 to-fuchsia-600',
  'from-amber-500 to-orange-600', 'from-rose-500 to-pink-600', 'from-cyan-500 to-sky-600',
  'from-violet-500 to-purple-600', 'from-lime-500 to-emerald-600',
];
const hashStr = (s = '') => { let h = 0; for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h); return Math.abs(h); };
const avatarGradient = (seed) => AVATAR_PALETTE[hashStr(seed) % AVATAR_PALETTE.length];
const initials = (name = '') => { const w = name.trim().split(/\s+/); return w.length === 1 ? w[0].slice(0, 2).toUpperCase() : (w[0][0] + w[w.length - 1][0]).toUpperCase(); };

const formatTime = (d) => {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

const formatGroupDate = (d) => {
  if (!d) return '';
  const date = new Date(d);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (isToday) return "Aujourd'hui";
  if (date.toDateString() === yesterday.toDateString()) return 'Hier';
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const isSameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const COMMON_EMOJIS = [
  '😀','😁','😂','🤣','😍','🥰','😎','🤔','😅','🙏','😊','😭',
  '😏','🤝','💪','👏','👍','❤️','🔥','🎉','💯','✅','⚡','🚀',
  '🌟','💎','🎯','✨','😴','🤗','😇','🥳','🤩','😜','👋','🙌',
];


// ─── Résout le chemin d'affichage d'une image (blob local, URL absolue, ou chemin serveur) ───
const resolveImageSrc = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('blob:') || imagePath.startsWith('http')) return imagePath;
  return `/storage/public/${imagePath}`;
};

// ─── Pastille "en ligne" façon WhatsApp/Messenger (liste déroulante) ────────
const OnlineAvatarStackMobile = ({ users = [], meId }) => {
  const [showAll, setShowAll] = useState(false);
  const others = users.filter(u => String(u.id) !== String(meId));
  if (others.length === 0) return null;
  const visible = others.slice(0, 3);
  const overflow = others.length - 3;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowAll(v => !v)}
        className="flex items-center gap-1.5 px-1.5 py-1 rounded-full active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
        title="Voir qui est en ligne"
      >
        <div className="flex -space-x-1.5">
          {visible.map(u => (
            <div key={u.id} className="relative w-6 h-6 flex-shrink-0">
              <img
                src={u.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || '')}&size=24`}
                alt={u.name}
                className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-900 object-cover"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-white dark:border-gray-900" />
            </div>
          ))}
          {overflow > 0 && (
            <div className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-900 bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-[8px] font-bold text-gray-700 dark:text-gray-200 flex-shrink-0">
              +{overflow}
            </div>
          )}
        </div>
      </button>

      {showAll && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setShowAll(false)} />
          <div className="absolute top-full right-0 mt-2 z-40 w-56 max-h-72 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-2">
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide px-2 py-1.5">
              {others.length} en ligne
            </p>
            {others.map(u => (
              <div key={u.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="relative flex-shrink-0">
                  <img
                    src={u.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || '')}&size=28`}
                    alt={u.name}
                    className="w-7 h-7 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border-2 border-white dark:border-gray-800" />
                </div>
                <span className="text-sm text-gray-800 dark:text-gray-100 truncate">{u.name}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const TypingIndicator = () => (
  <div className="flex items-end gap-2 px-4 py-1">
    <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
    <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-sm px-3 py-2.5 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex gap-1 items-center h-4">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  </div>
);

// ─── Bulle de message (avec glissement latéral pour répondre) ────────────────
const SWIPE_REPLY_THRESHOLD = 56; // px à parcourir pour déclencher la réponse
const SWIPE_MAX = 72; // limite visuelle du glissement

const MessageBubble = ({ comment, isMe, showAvatar, onReply, onLongPress, onImageClick, onJumpToMessage, isHighlighted, auth, onReact, meId }) => {
  const longPressTimer = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const isSwipingRef = useRef(false);
  const [swipeX, setSwipeX] = useState(0);
  const [swipeTriggered, setSwipeTriggered] = useState(false);

  const clearLongPress = () => clearTimeout(longPressTimer.current);

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    isSwipingRef.current = false;
    setSwipeTriggered(false);

    longPressTimer.current = setTimeout(() => {
      nativeFeedback.tap();
      onLongPress?.(comment);
    }, 500);
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    // Si le geste est surtout vertical (scroll), on ne fait rien
    if (!isSwipingRef.current && Math.abs(deltaY) > Math.abs(deltaX)) return;

    // Un glissement horizontal démarre : on annule le long-press
    if (Math.abs(deltaX) > 8) {
      isSwipingRef.current = true;
      clearLongPress();
    }
    if (!isSwipingRef.current) return;

    // WhatsApp : on glisse toujours vers la droite pour répondre, quel que soit l'expéditeur
    const clamped = Math.max(0, Math.min(deltaX, SWIPE_MAX));
    setSwipeX(clamped);
    if (!swipeTriggered && clamped >= SWIPE_REPLY_THRESHOLD) {
      setSwipeTriggered(true);
      nativeFeedback.tap();
    }
  };

  const handleTouchEnd = () => {
    clearLongPress();
    if (isSwipingRef.current && swipeX >= SWIPE_REPLY_THRESHOLD) {
      onReply?.(comment);
    }
    isSwipingRef.current = false;
    setSwipeX(0);
    setSwipeTriggered(false);
  };

  const bubbleClass = isMe
    ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm ml-auto'
    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl rounded-bl-sm border border-gray-100 dark:border-gray-700 shadow-sm';

  const resolvedImageSrc = resolveImageSrc(comment.image_path);

  return (
    <div
      id={`msg-${comment.id || comment._tempId}`}
      className={`relative flex items-end gap-2 px-4 my-0.5 transition-colors duration-700 ${isHighlighted ? 'bg-amber-200/40 dark:bg-amber-500/10 rounded-2xl' : ''} ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Icône de réponse révélée pendant le glissement */}
      <div
        className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-gray-300/70 dark:bg-gray-600/70 transition-opacity pointer-events-none"
        style={{ opacity: swipeX > 8 ? Math.min(swipeX / SWIPE_REPLY_THRESHOLD, 1) : 0 }}
      >
        <svg className={`w-4 h-4 ${swipeTriggered ? 'text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l-7 7 7 7M2 12h15a5 5 0 005-5" />
        </svg>
      </div>

      {/* Avatar (uniquement le dernier message d'un groupe) */}
      <div className="w-7 flex-shrink-0">
        {!isMe && showAvatar ? (
          <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarGradient(comment.user?.name || '')} flex items-center justify-center text-white text-[10px] font-bold`}>
            {comment.user?.profile_photo_url ? (
              <img src={comment.user.profile_photo_url} alt={comment.user.name} className="w-7 h-7 rounded-full object-cover" />
            ) : initials(comment.user?.name || '?')}
          </div>
        ) : null}
      </div>

      {/* Bulle */}
      <div
        className={`max-w-[78%] relative ${isMe ? 'items-end' : 'items-start'} flex flex-col transition-transform`}
        style={{ transform: `translateX(${swipeX}px)`, transitionDuration: isSwipingRef.current ? '0ms' : '200ms' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => { e.preventDefault(); onLongPress?.(comment); }}
      >
        {/* Nom expéditeur (premier message d'un groupe de messages) */}
        {!isMe && showAvatar && comment.user?.name && (
          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 mb-0.5 ml-1">
            {comment.user.name}
          </span>
        )}

        {/* Réponse citée */}
        {comment.parent_id && comment.parent && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onJumpToMessage?.(comment.parent_id); }}
            className={`mb-1 px-2.5 py-1.5 rounded-xl text-xs border-l-4 max-w-full text-left active:opacity-70 transition-opacity ${
              isMe
                ? 'bg-blue-500/40 border-white/60 text-blue-100'
                : 'bg-gray-100 dark:bg-gray-700/60 border-blue-400 text-gray-500 dark:text-gray-400'
            }`}
          >
            <p className="font-semibold truncate">{comment.parent.user?.name || 'Message'}</p>
            <p className="truncate">{comment.parent.content || '…'}</p>
          </button>
        )}

        <div
          className={`px-3.5 py-2 ${bubbleClass} ${comment._pending ? 'opacity-70' : ''} ${comment._failed ? 'opacity-50 border-red-400' : ''}`}
        >
          {/* Contenu texte */}
          {comment.content && !comment.audio_path && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words"
               dangerouslySetInnerHTML={{ __html: comment.content }} />
          )}
          {/* Vocal */}
          {comment.audio_path && (
            <AudioPlayer src={comment.audio_path} isMe={isMe} />
          )}
          {/* Image */}
          {resolvedImageSrc && (
            <img
              src={resolvedImageSrc}
              alt="Photo"
              className="max-w-full rounded-xl mt-1 max-h-64 object-cover cursor-pointer"
              loading="lazy"
              onClick={() => onImageClick?.(resolvedImageSrc)}
            />
          )}
          {/* Horodatage */}
          <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-end'}`}>
            {comment._failed && <span className="text-[10px] text-red-300">⚠ Échec</span>}
            <span className={`text-[10px] ${isMe ? 'text-blue-200' : 'text-gray-400 dark:text-gray-500'}`}>
              {formatTime(comment.created_at)}
            </span>
            {isMe && (
              <svg className={`w-3 h-3 ${comment._pending ? 'text-blue-300' : 'text-blue-200'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>

        {/* Réactions */}
        {comment.reactions_summary && Object.keys(comment.reactions_summary).length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-0.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
            {Object.entries(comment.reactions_summary).map(([emoji, data]) => {
              const userIds = data.user_ids || [];
              const hasReacted = userIds.some(id => String(id) === String(meId));
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onReact?.(comment.id, emoji)}
                  className={`text-xs rounded-full px-1.5 py-0.5 shadow-sm border transition-colors ${
                    hasReacted
                      ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-400 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {emoji} {data.count ?? userIds.length}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Page principale ─────────────────────────────────────────────────────────
export default function MobileDiscussionShow({ task, projectMembers = [] }) {
  const { auth } = usePage().props;
  const me = auth?.user || auth;

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [actionSheet, setActionSheet] = useState(null); // { comment }
  const [typingUsers, setTypingUsers] = useState({});
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [imageError, setImageError] = useState('');
  const [imageLightbox, setImageLightbox] = useState(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const presenceChannelRef = useRef(null);
  const lastTypingSentRef = useRef(0);
  const typingTimeoutsRef = useRef({});
  const imageInputRef = useRef(null);

  const [highlightedMessageId, setHighlightedMessageId] = useState(null);

  const scrollToBottom = useCallback((smooth = false) => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    });
  }, []);

  // ─── Fait défiler jusqu'à un message et le met en surbrillance ───
  const scrollToMessage = useCallback((targetId) => {
    if (!targetId) return;
    const el = document.getElementById(`msg-${targetId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedMessageId(targetId);
    setTimeout(() => {
      setHighlightedMessageId(prev => (prev === targetId ? null : prev));
    }, 1600);
  }, []);

  // ─── Chargement des commentaires ─────────────────────────────────────────
  const loadComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments?include=user`, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
      if (!res.ok) throw new Error();
      const raw = await res.json();
      const sorted = [...raw].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      setComments(sorted);
      // Marque comme vue
      localStorage.setItem(`discussion_seen_${task.id}`, new Date().toISOString());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [task.id]);

  useEffect(() => { loadComments(); }, [loadComments]);
  useEffect(() => { if (!loading) scrollToBottom(); }, [loading, scrollToBottom]);

  // ─── Fermer le lightbox avec Échap + bloquer le scroll ───
  useEffect(() => {
    if (!imageLightbox) return;
    const handleKeyDown = (e) => { if (e.key === 'Escape') setImageLightbox(null); };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [imageLightbox]);

  // ─── Temps réel ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!window.Echo || !task?.id) return;
    const chan = window.Echo.private(`task.${task.id}.comments`);

    chan.listen('.comment.posted', (e) => {
      const c = e.comment;
      if (!c) return;
      setComments(prev => {
        if (prev.some(x => String(x.id) === String(c.id))) return prev;
        return [...prev, { ...c, replies: c.replies || [] }];
      });
      setTimeout(() => scrollToBottom(true), 100);
    });

    chan.listen('.comment.deleted', (e) => {
      setComments(prev => prev.filter(c => c.id !== e.commentId));
    });

    return () => window.Echo.leave(`task.${task.id}.comments`);
  }, [task?.id, me?.id, scrollToBottom]);

  // ─── Présence ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!window.Echo || !task?.id) return;

    const ch = window.Echo.join(`presence-task.${task.id}`)
      .here(u => setOnlineUsers(u))
      .joining(u => setOnlineUsers(prev => [...prev.filter(x => x.id !== u.id), u]))
      .leaving(u => {
        setOnlineUsers(prev => prev.filter(x => x.id !== u.id));
        setTypingUsers(prev => { const c = { ...prev }; delete c[u.id]; return c; });
      })
      .listenForWhisper('typing', (e) => {
        if (e.userId === me?.id) return;
        setTypingUsers(prev => ({ ...prev, [e.userId]: e.userName }));
        clearTimeout(typingTimeoutsRef.current[e.userId]);
        typingTimeoutsRef.current[e.userId] = setTimeout(() => {
          setTypingUsers(prev => { const c = { ...prev }; delete c[e.userId]; return c; });
        }, 3000);
      })
      .listenForWhisper('stop-typing', (e) => {
        setTypingUsers(prev => { const c = { ...prev }; delete c[e.userId]; return c; });
      })
      .listenForWhisper('reaction', (e) => {
        if (!e?.commentId || !e?.emoji) return;
        setComments(prev => prev.map(c => {
          if (c.id !== e.commentId) return c;
          const next = { ...(c.reactions_summary || {}) };
          const entry = next[e.emoji] || { user_ids: [] };
          const userIds = [...(entry.user_ids || [])];
          const idx = userIds.findIndex(id => String(id) === String(e.userId));
          if (idx >= 0) userIds.splice(idx, 1); else userIds.push(e.userId);
          if (userIds.length === 0) delete next[e.emoji];
          else next[e.emoji] = { user_ids: userIds, count: userIds.length };
          return { ...c, reactions_summary: next };
        }));
      })
      .listen('.comment.reaction.updated', (e) => {
        if (!e?.commentId || !e?.reactions) return;
        setComments(prev => prev.map(c => c.id === e.commentId ? { ...c, reactions_summary: e.reactions } : c));
      });

    presenceChannelRef.current = ch;
    return () => {
      Object.values(typingTimeoutsRef.current).forEach(clearTimeout);
      window.Echo.leave(`presence-task.${task.id}`);
    };
  }, [task?.id, me?.id]);

  // ─── Partage de photos ────────────────────────────────────────────────────
  const setSelectedImage = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImageError('Seules les photos peuvent être partagées ici.');
      return;
    }
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setImageError('');
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    setSelectedImage(file);
    e.target.value = '';
  };

  const handlePasteImage = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) setSelectedImage(file);
        break;
      }
    }
  };

  const removeSelectedImage = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(null);
    setImagePreviewUrl(null);
  };

    // ─── Réactions ────────────────────────────────────────────────────────────
  const handleReaction = useCallback((commentId, emoji) => {
    if (!commentId) return;

    const toggle = (summary, userId) => {
      const next = { ...(summary || {}) };
      const entry = next[emoji] || { user_ids: [] };
      const userIds = [...(entry.user_ids || [])];
      const idx = userIds.findIndex(id => String(id) === String(userId));
      if (idx >= 0) userIds.splice(idx, 1); else userIds.push(userId);
      if (userIds.length === 0) delete next[emoji];
      else next[emoji] = { user_ids: userIds, count: userIds.length };
      return next;
    };

    setComments(prev => prev.map(c => c.id === commentId
      ? { ...c, reactions_summary: toggle(c.reactions_summary, me?.id) }
      : c));

    fetch(`/api/tasks/${task.id}/comments/${commentId}/reactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': getCsrf(),
      },
      body: JSON.stringify({ emoji }),
    }).catch(err => console.error('Erreur réseau réaction:', err));

    presenceChannelRef.current?.whisper('reaction', { commentId, emoji, userId: me?.id });
  }, [me?.id, task.id]);

  // ─── Envoi de message ────────────────────────────────────────────────────
  const emitStopTyping = useCallback(() => {
    presenceChannelRef.current?.whisper('stop-typing', { userId: me?.id });
    lastTypingSentRef.current = 0;
  }, [me?.id]);

  const handleTextChange = (e) => {
    setText(e.target.value);
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    // Typing indicator
    const now = Date.now();
    if (now - lastTypingSentRef.current > 1500 && presenceChannelRef.current) {
      lastTypingSentRef.current = now;
      presenceChannelRef.current.whisper('typing', { userId: me?.id, userName: me?.name });
    }
  };

  const sendMessage = async () => {
    const content = text.trim();
    if (!content && !audioBlob && !imageFile) return;
    nativeFeedback.tap();

    const tempId = `temp_${Date.now()}`;
    const optimistic = {
      _tempId: tempId, id: null, _pending: true, _failed: false,
      content: content || (audioBlob ? '🎙 Message vocal' : (imageFile ? 'Photo partagée' : '')),
      audio_path: audioBlob ? audioUrl : null,
      image_path: imageFile ? imagePreviewUrl : null,
      created_at: new Date().toISOString(),
      user: { id: me?.id, name: me?.name, profile_photo_url: me?.profile_photo_url },
      parent_id: replyTo?.id || null,
      parent: replyTo || null,
      reactions_summary: {},
    };

    setComments(prev => [...prev, optimistic]);
    const savedImageFile = imageFile;
    setText('');
    setAudioBlob(null);
    setAudioUrl(null);
    setImageFile(null);
    setImagePreviewUrl(null);
    setReplyTo(null);
    emitStopTyping();
    if (inputRef.current) { inputRef.current.style.height = 'auto'; }
    setTimeout(() => scrollToBottom(true), 80);

    try {
      setSending(true);
      const fd = new FormData();
      fd.append('content', content || (audioBlob ? 'Message vocal' : (savedImageFile ? 'Photo partagée' : '')));
      if (audioBlob) fd.append('audio', audioBlob, 'voice_message.webm');
      if (savedImageFile) fd.append('image', savedImageFile);
      if (replyTo?.id) fd.append('parent_id', replyTo.id);

      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': getCsrf() },
        body: fd,
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      const serverComment = saved.comment || saved;
      setComments(prev => prev.map(c => c._tempId === tempId ? { ...c, ...serverComment, _pending: false, _failed: false } : c));
    } catch {
      setComments(prev => prev.map(c => c._tempId === tempId ? { ...c, _pending: false, _failed: true } : c));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ─── Enregistrement vocal ────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: mimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setRecordingTime(0);
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      // Permission refusée
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop();
    clearInterval(recordingIntervalRef.current);
    setIsRecording(false);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = () => {};
      mediaRecorderRef.current.stop();
    }
    clearInterval(recordingIntervalRef.current);
    setIsRecording(false);
    setRecordingTime(0);
  };

  const formatRecTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // ─── Action sheet (long press sur un message) ─────────────────────────────
  const handleLongPress = (comment) => setActionSheet({ comment });

  const handleReplyFromSheet = () => {
    setReplyTo(actionSheet.comment);
    setActionSheet(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // ─── En-tête : participants en ligne ────────────────────────────────────
  const onlineOthers = onlineUsers.filter(u => u.id !== me?.id);
  const typingNames = Object.values(typingUsers);
  const taskGradient = avatarGradient(`${task.id}-${task.title}`);

  // ─── Rendu des messages avec séparateurs de date ─────────────────────────
  const renderMessages = () => {
    if (loading) {
      return Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={`flex items-end gap-2 px-4 my-1 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
          <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className={`h-10 rounded-2xl animate-pulse ${i % 2 === 0 ? 'bg-blue-200 dark:bg-blue-900/40 w-48' : 'bg-gray-200 dark:bg-gray-700 w-36'}`} />
        </div>
      ));
    }

    if (comments.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-3 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-3xl">💬</div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Démarrez la conversation !</p>
        </div>
      );
    }

    const items = [];
    let lastDate = null;

    comments.forEach((comment, idx) => {
      const isMe = String(comment.user?.id) === String(me?.id);
      const nextComment = comments[idx + 1];
      const showAvatar = !nextComment || String(nextComment.user?.id) !== String(comment.user?.id);

      // Séparateur de date
      const commentDate = comment.created_at;
      if (!lastDate || !isSameDay(lastDate, commentDate)) {
        lastDate = commentDate;
        items.push(
          <div key={`date-${commentDate}`} className="flex items-center justify-center py-3">
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs rounded-full font-medium">
              {formatGroupDate(commentDate)}
            </span>
          </div>
        );
      }

      items.push(
        <MessageBubble
          key={comment._tempId || comment.id}
          comment={comment}
          isMe={isMe}
          showAvatar={showAvatar}
          onReply={() => { setReplyTo(comment); setTimeout(() => inputRef.current?.focus(), 100); }}
          onLongPress={handleLongPress}
          onImageClick={(src) => setImageLightbox(src)}
          onJumpToMessage={scrollToMessage}
          isHighlighted={String(comment.id || comment._tempId) === String(highlightedMessageId)}
          auth={auth}
          onReact={handleReaction}
          meId={me?.id}
        />
      );
    });

    // Indicateur de frappe
    if (typingNames.length > 0) {
      items.push(<TypingIndicator key="typing" />);
    }

    return items;
  };

  // ─── Header custom avec infos de la tâche : qui est en ligne ────────────
  const headerRight = <OnlineAvatarStackMobile users={onlineUsers} meId={me?.id} />;

  return (
    <MobileLayout
      title={task.title || 'Discussion'}
      subtitle={task.project?.name || undefined}
      backHref="/discussions"
      headerRight={headerRight}
      hideBottomNav
      fullBleed
    >
      {/* Fond style WhatsApp */}
      <div
        className="flex flex-col"
        style={{
          height: '100%',
          background: 'var(--chat-bg, #f0f2f5)',
        }}
      >
        <style>{`
          .dark { --chat-bg: #0d1117; }
          :root { --chat-bg: #f0f2f5; }
        `}</style>

        {/* Zone de messages scrollable */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto overscroll-contain py-3 pb-2"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {renderMessages()}
          <div className="h-2" />
        </div>

        {/* Preview de réponse */}
        {replyTo && (
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="flex-1 pl-3 border-l-4 border-blue-500">
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 truncate">
                {replyTo.user?.name || 'Message'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {replyTo.content || '🎙 Message vocal'}
              </p>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Aperçu audio enregistré */}
        {audioBlob && !isRecording && (
          <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <AudioPlayer src={audioUrl} className="flex-1" />
            <button
              onClick={() => { setAudioBlob(null); setAudioUrl(null); }}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-500"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Erreur photo */}
        {imageError && (
          <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-300 flex items-center gap-2">
            <span className="flex-1">{imageError}</span>
            <button onClick={() => setImageError('')} className="text-red-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Aperçu photo sélectionnée */}
        {imagePreviewUrl && (
          <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <img src={imagePreviewUrl} alt="Aperçu" className="h-14 w-14 rounded-lg object-cover flex-shrink-0" />
            <span className="text-xs text-gray-500 dark:text-gray-400 flex-1 truncate">{imageFile?.name}</span>
            <button
              onClick={removeSelectedImage}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-500"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Panneau émojis */}
        {showEmojiPicker && (
          <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-3 py-2 max-h-40 overflow-y-auto">
            <div className="grid grid-cols-8 gap-1">
              {COMMON_EMOJIS.map((emoji, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setText(prev => prev + emoji)}
                  className="text-xl p-1.5 rounded-lg active:bg-gray-100 dark:active:bg-gray-800 flex items-center justify-center"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Barre de saisie */}
        <div
          className="flex-shrink-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-2 py-2 flex items-end gap-2"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
        >
          {isRecording ? (
            /* Mode enregistrement */
            <div className="flex-1 flex items-center gap-3 bg-red-50 dark:bg-red-900/20 rounded-2xl px-4 py-2.5 border border-red-200 dark:border-red-800">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
              <span className="text-sm font-mono font-semibold text-red-600 dark:text-red-400 flex-1">
                {formatRecTime(recordingTime)}
              </span>
              <button
                onClick={cancelRecording}
                className="text-xs text-gray-500 dark:text-gray-400 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={stopRecording}
                className="w-9 h-9 flex items-center justify-center bg-red-500 rounded-full text-white flex-shrink-0 active:scale-90 transition-transform"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ) : (
            <>
              {/* Bouton émojis */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(v => !v)}
                className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full transition-transform active:scale-90 ${
                  showEmojiPicker ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/30' : 'text-gray-500 dark:text-gray-400 active:bg-gray-100 dark:active:bg-gray-800'
                }`}
                title="Émojis"
              >
                <span className="text-xl">😊</span>
              </button>

              {/* Bouton photo : appareil photo ou galerie */}
              <div className="relative flex-shrink-0">
                <input type="file" ref={imageInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                <input type="file" ref={cameraInputRef} onChange={handleImageSelect} accept="image/*" capture="environment" className="hidden" />
                <button
                  type="button"
                  onClick={() => setShowAttachMenu(v => !v)}
                  className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400 active:scale-90 active:bg-gray-100 dark:active:bg-gray-800 transition-transform"
                  title="Partager une photo"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 14l4.5-6 3.5 4.5 2.5-3L19 17H5z" />
                    <circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none" />
                  </svg>
                </button>

                {showAttachMenu && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowAttachMenu(false)} />
                    <div className="absolute bottom-full left-0 mb-2 z-40 w-52 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => { setShowAttachMenu(false); cameraInputRef.current?.click(); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-800 dark:text-gray-100 active:bg-gray-100 dark:active:bg-gray-700"
                      >
                        <span className="text-lg">📷</span> Prendre une photo
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowAttachMenu(false); imageInputRef.current?.click(); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-800 dark:text-gray-100 active:bg-gray-100 dark:active:bg-gray-700 border-t border-gray-100 dark:border-gray-700"
                      >
                        <span className="text-lg">🖼️</span> Choisir depuis la galerie
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Textarea */}
              <div className="flex-1 flex items-end bg-gray-100 dark:bg-gray-800 rounded-2xl px-3 py-1.5 min-h-[40px]">
                <textarea
                  ref={inputRef}
                  value={text}
                  onChange={handleTextChange}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePasteImage}
                  placeholder="Message…"
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none outline-none leading-relaxed self-center"
                  style={{ maxHeight: '120px', overflowY: 'auto' }}
                />
              </div>

              {/* Bouton micro ou envoyer */}
              {text.trim() || audioBlob || imageFile ? (
                <button
                  onClick={sendMessage}
                  disabled={sending}
                  className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-blue-600 rounded-full text-white active:scale-90 transition-transform disabled:opacity-50"
                >
                  <svg className="w-5 h-5 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              ) : (
                <button
                  onMouseDown={startRecording}
                  onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
                  className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 active:scale-90 active:bg-blue-100 dark:active:bg-blue-900/40 transition-transform"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zm-1 18.93V22h2v-2.07A8.001 8.001 0 0 0 20 12h-2a6 6 0 0 1-12 0H4a8.001 8.001 0 0 0 7 7.93z" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Action sheet (long press) */}
      {actionSheet && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setActionSheet(null)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl p-2 pb-safe">
            <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 mt-2" />

            {/* Bande de réactions rapides, façon WhatsApp/Messenger */}
            <div className="flex items-center justify-around px-2 pb-3 mb-1 border-b border-gray-100 dark:border-gray-800">
              {REACTION_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => { handleReaction(actionSheet.comment.id, emoji); setActionSheet(null); }}
                  className="text-2xl p-1 active:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {[
              {
                icon: '↩️', label: 'Répondre',
                action: handleReplyFromSheet,
              },
              {
                icon: '📋', label: 'Copier le message',
                action: () => {
                  navigator.clipboard?.writeText(actionSheet.comment.content || '');
                  setActionSheet(null);
                },
              },
            ].map(item => (
              <button
                key={item.label}
                onClick={item.action}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{item.label}</span>
              </button>
            ))}
            <button
              onClick={() => setActionSheet(null)}
              className="w-full flex items-center justify-center py-3 mt-1 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold text-sm active:opacity-70"
            >
              Annuler
            </button>
          </div>
        </>
      )}

      {/* Lightbox : aperçu plein écran d'une photo partagée */}
      {imageLightbox && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setImageLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setImageLightbox(null)}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center backdrop-blur-md transition-colors"
            title="Fermer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={imageLightbox}
            alt="Aperçu de la photo"
            onClick={(e) => e.stopPropagation()}
            className="max-w-[92vw] max-h-[88vh] object-contain rounded-lg shadow-2xl select-none"
          />
        </div>
      )}
    </MobileLayout>
  );
}