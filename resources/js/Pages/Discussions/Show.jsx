import React, { useEffect, useState, useCallback, useRef } from 'react';
import { usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AdminLayout from '@/Layouts/AdminLayout';
import Modal from '@/Components/Modal';
import AudioPlayer from '@/Components/AudioPlayer';
import {
  FaCommentDots, FaMicrophone, FaStop, FaReply, FaPaperPlane, FaEnvelope,
  FaPaperclip, FaSmile, FaSmileBeam, FaSave, FaTimes, FaCopy, FaCheck,
  FaEdit, FaTrash, FaInfoCircle, FaArrowLeft, FaExternalLinkAlt,
} from 'react-icons/fa';

// ─── Constantes Réactions & Stickers ────────────────────────────────────────
const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉'];

const COMMON_EMOJIS = [
  '😀','😁','😂','🤣','😍','🥰','😎','🤔','😅','🙏','😊','😭',
  '😏','🤝','💪','👏','👍','❤️','🔥','🎉','💯','✅','⚡','🚀',
  '🌟','💎','🎯','✨','😴','🤗','😇','🥳','🤩','😜','👋','🙌',
  '💬','📌','⏰','🛠️','💡','🔑','📱','💻','🎁','🏆'
];

const STICKERS = [
  { id: 'st_1', emoji: '🚀', title: 'En cours', bg: 'bg-blue-500 text-white shadow-blue-500/30' },
  { id: 'st_2', emoji: '✅', title: 'Validé', bg: 'bg-emerald-500 text-white shadow-emerald-500/30' },
  { id: 'st_3', emoji: '🔥', title: 'Urgent', bg: 'bg-rose-500 text-white shadow-rose-500/30' },
  { id: 'st_4', emoji: '💡', title: 'Idée', bg: 'bg-amber-500 text-white shadow-amber-500/30' },
  { id: 'st_5', emoji: '👏', title: 'Bravo !', bg: 'bg-purple-500 text-white shadow-purple-500/30' },
  { id: 'st_6', emoji: '🙏', title: 'Merci', bg: 'bg-indigo-500 text-white shadow-indigo-500/30' },
  { id: 'st_7', emoji: '❓', title: 'Question', bg: 'bg-orange-500 text-white shadow-orange-500/30' },
  { id: 'st_8', emoji: '🎯', title: 'Objectif', bg: 'bg-teal-500 text-white shadow-teal-500/30' },
  { id: 'st_9', emoji: '⭐', title: 'Favori', bg: 'bg-yellow-500 text-white shadow-yellow-500/30' },
  { id: 'st_10', emoji: '📌', title: 'Important', bg: 'bg-red-600 text-white shadow-red-600/30' },
  { id: 'st_11', emoji: '⚡', title: 'Express', bg: 'bg-cyan-500 text-white shadow-cyan-500/30' },
  { id: 'st_12', emoji: '🎉', title: 'Félicitations', bg: 'bg-pink-500 text-white shadow-pink-500/30' },
  { id: 'st_13', emoji: '🏆', title: 'Succès', bg: 'bg-yellow-600 text-white shadow-yellow-600/30' },
  { id: 'st_14', emoji: '🛠️', title: 'En révision', bg: 'bg-slate-600 text-white shadow-slate-600/30' },
  { id: 'st_15', emoji: '💻', title: 'Dev / Code', bg: 'bg-violet-600 text-white shadow-violet-600/30' },
  { id: 'st_16', emoji: '🎁', title: 'Bonus', bg: 'bg-fuchsia-500 text-white shadow-fuchsia-500/30' },
];

const VoiceMessagePlayer = ({ src }) => (
  <audio controls preload="metadata" src={src} className="h-9 w-full min-w-[200px] max-w-[240px]" />
);

const OnlineAvatarStack = ({ users }) => {
  const [showAll, setShowAll] = useState(false);
  if (!users || users.length === 0) return null;
  const visible = users.slice(0, 4);
  const overflow = users.length - 4;

  return (
    <div className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setShowAll(v => !v)}
        className="flex items-center gap-1.5 bg-white/15 dark:bg-black/25 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 shadow-inner hover:bg-white/25 transition-colors"
        title="Voir tous les membres en ligne"
      >
        <div className="flex -space-x-2 flex-shrink-0 items-center">
          {visible.map((u) => (
            <div key={u.id} className="relative group flex-shrink-0 w-7 h-7">
              <img
                src={u.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || '')}&background=ffffff&color=2563eb&size=32`}
                alt={u.name}
                className="w-7 h-7 min-w-[28px] min-h-[28px] max-w-[28px] max-h-[28px] rounded-full border-2 border-blue-600 dark:border-blue-700 object-cover shadow-md"
                style={{ width: '28px', height: '28px', minWidth: '28px', minHeight: '28px' }}
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-blue-600 dark:border-blue-700 animate-pulse" />
            </div>
          ))}
          {overflow > 0 && (
            <div
              className="w-7 h-7 min-w-[28px] min-h-[28px] max-w-[28px] max-h-[28px] rounded-full border-2 border-blue-600 bg-blue-800 flex items-center justify-center text-[10px] text-white font-bold flex-shrink-0"
              style={{ width: '28px', height: '28px', minWidth: '28px', minHeight: '28px' }}
            >
              +{overflow}
            </div>
          )}
        </div>
        <span className="text-xs text-blue-100 font-medium hidden sm:inline-block whitespace-nowrap">
          {users.length} en ligne
        </span>
      </button>

      {showAll && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setShowAll(false)} />
          <div className="absolute top-full right-0 mt-2 z-40 w-64 max-h-80 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-2">
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide px-2 py-1.5">
              {users.length} en ligne
            </p>
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="relative flex-shrink-0">
                  <img
                    src={u.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || '')}&background=ffffff&color=2563eb&size=32`}
                    alt={u.name}
                    className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-gray-800" />
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

const ReactionPicker = ({ commentId, isMe, onReact, onClose }) => {
  const pickerRef = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={pickerRef}
      className={`absolute ${isMe ? 'right-0 -top-11' : 'left-0 -top-11'} z-30 flex items-center gap-1 bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-200 dark:border-gray-700 px-2 py-1 animate-in fade-in zoom-in duration-150`}
    >
      {REACTION_EMOJIS.map(emoji => (
        <button
          key={emoji}
          type="button"
          onClick={() => { onReact(commentId, emoji); onClose(); }}
          className="text-lg w-8 h-8 flex items-center justify-center hover:scale-125 transition-transform hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          title={emoji}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

/**
 * Page Discussions/Show : fil de discussion complet d'une tâche (messages, audio,
 * photos, réactions, mentions, présence en ligne, indicateur de frappe, accusés
 * de lecture). Rendue par TaskController::discussion() via la route tasks.discussion
 * (/tasks/{task}/discussion), avec `task` et `projectMembers` en props Inertia.
 */
export default function Show({ task, projectMembers = [], headerLeftSlot = null }) {
  const { t } = useTranslation();
  const { auth } = usePage().props;

  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [readReceipts, setReadReceipts] = useState({});
  const [readReceiptsViewer, setReadReceiptsViewer] = useState(null);
  const [reactionViewer, setReactionViewer] = useState(null);
  const [imageLightbox, setImageLightbox] = useState(null);
  const [copiedCommentId, setCopiedCommentId] = useState(null);

  const [commentContent, setCommentContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);

  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionedUserIds, setMentionedUserIds] = useState([]);
  const commentTextareaRef = useRef(null);

  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');

  const [showConfirmDeleteCommentModal, setShowConfirmDeleteCommentModal] = useState(false);
  const [commentToDeleteId, setCommentToDeleteId] = useState(null);

  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState(null);
  const [recordingCancelled, setRecordingCancelled] = useState(false);
  const [dragX, setDragX] = useState(0);
  const dragStartXRef = useRef(0);
  const recordingCancelledRef = useRef(false);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const imageInputRef = useRef(null);

  const [activeReactionPicker, setActiveReactionPicker] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activePickerTab, setActivePickerTab] = useState('emojis');

  const [reactions, setReactions] = useState(() => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = localStorage.getItem(`task_reactions_${task.id}`);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const [readComments, setReadComments] = useState(() => {
    if (typeof window === 'undefined') return new Set();
    const saved = localStorage.getItem(`readComments_${task.id}`);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [shareDiscussionEmail, setShareDiscussionEmail] = useState(auth.user.share_discussions_by_email);

  const presenceChannelRef = useRef(null);
  const typingTimeoutsRef = useRef({});
  const lastTypingSentRef = useRef(0);

  // ─── Marque la discussion comme vue (badge de la liste des discussions) ───
  const markDiscussionSeen = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`discussion_seen_${task.id}`, new Date().toISOString());
  }, [task.id]);

  useEffect(() => { markDiscussionSeen(); }, [markDiscussionSeen]);

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

  const handleCopyMessage = useCallback(async (commentId, content) => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopiedCommentId(commentId);
      setTimeout(() => setCopiedCommentId(prev => (prev === commentId ? null : prev)), 1800);
    } catch (e) {
      console.error('Erreur lors de la copie:', e);
    }
  }, []);

  const handleReaction = useCallback((commentId, emoji) => {
    if (!commentId) return;
    setReactions(prev => {
      const commentReactions = { ...(prev[commentId] || {}) };
      const userIds = [...(commentReactions[emoji] || [])];
      const idx = userIds.indexOf(auth.user.id);
      if (idx >= 0) userIds.splice(idx, 1); else userIds.push(auth.user.id);
      if (userIds.length === 0) delete commentReactions[emoji]; else commentReactions[emoji] = userIds;
      const updated = { ...prev, [commentId]: commentReactions };
      if (typeof window !== 'undefined') {
        localStorage.setItem(`task_reactions_${task.id}`, JSON.stringify(updated));
      }
      return updated;
    });

    fetch(`/api/tasks/${task.id}/comments/${commentId}/reactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
      },
      body: JSON.stringify({ emoji }),
    }).catch((err) => console.error('Erreur réseau réaction:', err));

    presenceChannelRef.current?.whisper('reaction', { commentId, emoji, userId: auth.user.id });
  }, [auth.user.id, task.id]);

  const isUserOnline = useCallback((userId) => {
    if (!userId) return false;
    return onlineUsers.some(u => String(u.id) === String(userId));
  }, [onlineUsers]);

  const resolveUser = useCallback((userId) => {
    return projectMembers?.find(u => String(u.id) === String(userId)) || null;
  }, [projectMembers]);

  const highlightMentions = (text) => {
    if (!projectMembers) return text;
    let out = text;
    projectMembers.forEach(m => {
      const re = new RegExp(`@${m.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
      out = out.replace(re, `<span class="font-semibold text-blue-500">@${m.name}</span>`);
    });
    return out;
  };

  const linkifyText = (text, isMe) => {
    if (!text) return text;
    const urlRegex = /(https?:\/\/[^\s<]+[^\s<.,:;!?)'"\]])/g;
    const linkClasses = isMe
      ? 'underline decoration-white/70 hover:decoration-white text-white font-medium break-all'
      : 'underline decoration-blue-400 hover:decoration-blue-600 text-blue-600 dark:text-blue-400 font-medium break-all';
    return text.replace(urlRegex, (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="${linkClasses}">${url}</a>`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date inconnue';
      return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
    } catch { return 'Date inconnue'; }
  };

  const buildReactionsMap = (commentsList) => {
    const map = {};
    const walk = (list) => {
      list.forEach(c => {
        if (c.reactions_summary && Object.keys(c.reactions_summary).length > 0) {
          map[c.id] = {};
          Object.entries(c.reactions_summary).forEach(([emoji, data]) => { map[c.id][emoji] = data.user_ids; });
        }
        if (c.replies?.length) walk(c.replies);
      });
    };
    walk(commentsList);
    return map;
  };

  const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  // ─── Marque tous les commentaires courants comme lus (badge local) ───
  const markCommentsAsRead = useCallback((commentsList) => {
    if (!commentsList || commentsList.length === 0) return;
    const newReadComments = new Set(readComments);
    let hasNewReads = false;
    commentsList.forEach(comment => {
      if (comment.id && !newReadComments.has(comment.id)) {
        newReadComments.add(comment.id);
        hasNewReads = true;
      }
    });
    if (hasNewReads) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`readComments_${task.id}`, JSON.stringify(Array.from(newReadComments)));
      }
      setReadComments(newReadComments);
    }
  }, [readComments, task.id]);

  const loadComments = useCallback(async () => {
    try {
      setLoadingComments(true);
      const response = await fetch(`/api/tasks/${task.id}/comments?include=user`);
      if (!response.ok) throw new Error('Erreur lors du chargement des commentaires');

      const raw = await response.json();
      const sorted = [...raw].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const processed = sorted.map(comment => ({
        ...comment,
        user: comment.user || { name: 'Utilisateur inconnu', profile_photo_url: null },
        replies: (comment.replies || [])
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .map(reply => ({ ...reply, user: reply.user || { name: 'Utilisateur inconnu', profile_photo_url: null }, formatted_date: formatDate(reply.created_at) })),
        formatted_date: formatDate(comment.created_at),
      }));

      setComments(processed);
      setReactions(prev => ({ ...buildReactionsMap(processed), ...prev }));
      markCommentsAsRead(processed);
      markDiscussionSeen();
    } catch (err) {
      console.error('Erreur:', err);
      setError('Impossible de charger les commentaires');
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  }, [task.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadComments(); }, [loadComments]);

  // ─── Envoi optimiste ───
  const handleCommentSubmit = async (e, textOverride = null) => {
    if (e?.preventDefault) { e.preventDefault(); e.stopPropagation(); }

    const textToSend = (textOverride !== null ? textOverride : commentContent).trim();
    if (!textToSend && !audioBlob && !imageFile) {
      setError('Veuillez écrire un message, enregistrer un vocal ou joindre une photo.');
      return false;
    }

    const tempId = generateTempId();
    const now = new Date().toISOString();

    const optimisticComment = {
      _tempId: tempId,
      id: null,
      _pending: true,
      _failed: false,
      content: textToSend || (audioBlob ? 'Message audio enregistré et sauvegardé' : (imageFile ? 'Photo partagée' : '')),
      audio_path: audioBlob ? audioUrl : null,
      image_path: imageFile ? imagePreviewUrl : null,
      created_at: now,
      updated_at: now,
      user: {
        id: auth.user.id,
        name: auth.user.name,
        profile_photo_url: auth.user.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(auth.user.name || '')}`,
        role: auth.user.role,
      },
      parent_id: replyingTo || null,
      replies: [],
    };

    const insertCommentRecursively = (commentsList, incoming) => {
      const parentId = incoming.parent_id ? String(incoming.parent_id) : null;
      if (!parentId) return [incoming, ...commentsList];
      return commentsList.map(c => {
        if (String(c.id || c._tempId) === parentId) return { ...c, replies: [incoming, ...(c.replies || [])] };
        if (c.replies?.length > 0) return { ...c, replies: insertCommentRecursively(c.replies, incoming) };
        return c;
      });
    };

    setComments(prev => insertCommentRecursively(prev, optimisticComment));

    const savedContent = textToSend;
    const savedAudioBlob = audioBlob;
    const savedImageFile = imageFile;
    const savedReplyingTo = replyingTo;
    setCommentContent('');
    setAudioBlob(null);
    setAudioUrl(null);
    setImageFile(null);
    setImagePreviewUrl(null);
    setReplyingTo(null);
    setMentionedUserIds([]);
    setError('');
    emitStopTyping();

    setTimeout(() => {
      const container = document.getElementById('chat-messages-container');
      if (container) container.scrollTop = container.scrollHeight;
    }, 50);

    try {
      const formData = new FormData();
      formData.append('content', savedContent || (savedAudioBlob ? 'Message audio enregistré et sauvegardé' : (savedImageFile ? 'Photo partagée' : '')));
      if (savedAudioBlob) formData.append('audio', savedAudioBlob, 'voice_message.webm');
      if (savedImageFile) formData.append('image', savedImageFile);
      if (savedReplyingTo) formData.append('parent_id', savedReplyingTo);
      mentionedUserIds.forEach(id => formData.append('mentioned_user_ids[]', id));

      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erreur serveur');
      }

      const newComment = await res.json();
      const serverComment = newComment.comment || newComment;

      const replaceOptimistic = (list) => list.map(c => {
        if (c._tempId === tempId) return { ...c, ...serverComment, _pending: false, _failed: false, _tempId: tempId, replies: c.replies || [] };
        if (c.replies?.length > 0) return { ...c, replies: replaceOptimistic(c.replies) };
        return c;
      });

      setComments(prev => replaceOptimistic(prev));
    } catch (err) {
      console.error('Erreur envoi commentaire:', err);
      const markFailed = (list) => list.map(c => {
        if (c._tempId === tempId) return { ...c, _pending: false, _failed: true };
        if (c.replies?.length > 0) return { ...c, replies: markFailed(c.replies) };
        return c;
      });
      setComments(prev => markFailed(prev));
      setError(err.message || 'Échec de l\'envoi. Appuyez sur "Réessayer".');
    }
  };

  const retryComment = async (failedComment) => {
    const removeOptimistic = (list) => list.filter(c => {
      if (c._tempId === failedComment._tempId) return false;
      if (c.replies) c.replies = removeOptimistic(c.replies);
      return true;
    });
    setComments(prev => removeOptimistic(prev));
    setCommentContent(failedComment.content === 'Message audio enregistré et sauvegardé' ? '' : failedComment.content);
    if (failedComment.parent_id) setReplyingTo(failedComment.parent_id);
  };

  const handleDeleteComment = (commentId) => {
    setCommentToDeleteId(commentId);
    setShowConfirmDeleteCommentModal(true);
  };

  const confirmDeleteComment = async () => {
    if (!commentToDeleteId) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments/${commentToDeleteId}`, {
        method: 'DELETE',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        },
      });

      if (res.ok) {
        setComments(prev => {
          const removeComment = (list) => list.reduce((acc, comment) => {
            if (comment.id === commentToDeleteId) return acc;
            if (comment.replies?.length > 0) return [...acc, { ...comment, replies: removeComment(comment.replies) }];
            return [...acc, comment];
          }, []);
          return removeComment(prev);
        });
        setShowConfirmDeleteCommentModal(false);
        setCommentToDeleteId(null);
      } else {
        const errorData = await res.json();
        setError(errorData.message || 'Erreur lors de la suppression du commentaire');
      }
    } catch {
      setError('Erreur lors de la suppression du commentaire');
    }
  };

  const handleEditComment = (comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleReplyComment = (commentId) => {
    setReplyingTo(prevId => prevId === commentId ? null : commentId);
    setTimeout(() => commentTextareaRef.current?.focus(), 100);
  };

  const insertMention = (member) => {
    const textarea = commentTextareaRef.current;
    const cursor = textarea?.selectionStart ?? commentContent.length;
    const textBefore = commentContent.slice(0, cursor).replace(/@(\w*)$/, `@${member.name} `);
    const textAfter = commentContent.slice(cursor);
    setCommentContent(textBefore + textAfter);
    setMentionedUserIds(prev => [...new Set([...prev, member.id])]);
    setShowMentionPicker(false);
    setTimeout(() => textarea?.focus(), 0);
  };

  const cancelReply = () => setReplyingTo(null);

  const handleUpdateComment = async (e) => {
    e.preventDefault();
    const res = await fetch(`/api/tasks/${task.id}/comments/${editingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
      },
      body: JSON.stringify({ content: editContent }),
    });
    if (res.ok) {
      const updated = await res.json();
      setComments(prev => prev.map(c => c.id === updated.id
        ? { ...updated, formatted_date: formatDate(updated.updated_at || updated.created_at) }
        : c));
      setEditingId(null);
      setEditContent('');
    }
  };

  const toggleDiscussionEmail = async () => {
    const response = await fetch('/user/discussion-email-sharing', {
      method: 'PATCH',
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
    const data = await response.json();
    setShareDiscussionEmail(data.enabled);
  };

  // ─── Enregistrement audio ───
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Votre navigateur ne supporte pas l\'enregistrement audio');
      }
      if (audioUrl) { URL.revokeObjectURL(audioUrl); setAudioUrl(null); }
      setAudioBlob(null);
      setRecordingTime(0);
      setError('');

      const constraints = { audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 } };
      if (/Mobi|Android/i.test(navigator.userAgent)) delete constraints.audio.sampleRate;

      const stream = await navigator.mediaDevices.getUserMedia(constraints).catch(err => {
        if (err.name === 'NotAllowedError') throw new Error('Accès au microphone refusé. Veuillez autoriser l\'accès au micro dans les paramètres de votre navigateur.');
        if (err.name === 'NotFoundError') throw new Error('Aucun microphone détecté. Vérifiez votre connexion micro.');
        throw new Error(`Erreur d'accès au microphone: ${err.message}`);
      });

      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '';
      if (!mimeType) throw new Error('Format audio non supporté par votre navigateur');

      const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 128000 });
      const chunks = [];

      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunks.push(event.data); };
      recorder.onerror = (event) => {
        console.error('Erreur lors de l\'enregistrement:', event.error);
        setError('Erreur lors de l\'enregistrement. Veuillez réessayer.');
        stopRecording();
      };
      recorder.onstop = () => {
        clearInterval(recordingInterval);
        if (recordingCancelledRef.current) {
          recordingCancelledRef.current = false;
          setRecordingTime(0);
          stream.getTracks().forEach(track => { track.stop(); stream.removeTrack(track); });
          return;
        }
        try {
          const blob = new Blob(chunks, { type: mimeType });
          setAudioBlob(blob);
          setAudioUrl(URL.createObjectURL(blob));
        } catch (err) {
          console.error('Erreur lors de la création du blob audio:', err);
          setError('Impossible de traiter l\'enregistrement audio.');
        } finally {
          setRecordingTime(0);
          stream.getTracks().forEach(track => { track.stop(); stream.removeTrack(track); });
        }
      };

      clearInterval(recordingInterval);
      const interval = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
      setRecordingInterval(interval);

      recorder.start(1000);
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Impossible d\'accéder au microphone. Veuillez vérifier les autorisations.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      clearInterval(recordingInterval);
    }
  };

  const cancelRecording = () => {
    recordingCancelledRef.current = true;
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      clearInterval(recordingInterval);
    }
  };

  const handleMicPointerDown = (e) => {
    e.preventDefault();
    dragStartXRef.current = e.touches ? e.touches[0].clientX : e.clientX;
    setDragX(0);
    setRecordingCancelled(false);
    startRecording();
  };

  const handleMicPointerMove = (e) => {
    if (!isRecording) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const delta = clientX - dragStartXRef.current;
    setDragX(delta);
    setRecordingCancelled(delta < -80);
  };

  const handleMicPointerUp = () => {
    if (!isRecording) return;
    if (recordingCancelled) cancelRecording(); else stopRecording();
    setDragX(0);
    setRecordingCancelled(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => () => {
    if (recordingInterval) clearInterval(recordingInterval);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [recordingInterval, audioUrl]);

  // ─── Partage de photos ───
  const setSelectedImage = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError("Seules les photos peuvent être partagées ici. Pour tout autre type de fichier, rendez-vous dans l'onglet « Ressources » pour l'ajouter.");
      return;
    }
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setError('');
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

  // ─── Temps réel : commentaires ───
  useEffect(() => {
    if (!window.Echo || !task?.id) return;
    const channel = window.Echo.private(`task.${task.id}.comments`);

    channel.listen('.comment.posted', (e) => {
      const incoming = e.comment;
      if (!incoming || incoming.user.id === auth.user.id) return;

      const withMeta = { ...incoming, formatted_date: formatDate(incoming.created_at), replies: incoming.replies || [] };

      const insertRealtimeComment = (list, inc) => {
        const incId = String(inc.id);
        const parentId = inc.parent_id ? String(inc.parent_id) : null;
        const exists = list.some(c => String(c.id) === incId || (c.replies && c.replies.some(r => String(r.id) === incId)));
        if (exists) return list;
        if (!parentId) return [inc, ...list];
        return list.map(c => {
          if (String(c.id) === parentId) return { ...c, replies: [inc, ...(c.replies || [])] };
          if (c.replies?.length > 0) return { ...c, replies: insertRealtimeComment(c.replies, inc) };
          return c;
        });
      };

      setComments(prev => insertRealtimeComment(prev, withMeta));

      setTimeout(() => {
        const container = document.getElementById('chat-messages-container');
        if (container) container.scrollTop = container.scrollHeight;
      }, 50);
    });

    channel.listen('.comment.deleted', (e) => {
      setComments(prev => {
        const removeComment = (list) => list.reduce((acc, c) => {
          if (c.id === e.commentId) return acc;
          if (c.replies?.length) return [...acc, { ...c, replies: removeComment(c.replies) }];
          return [...acc, c];
        }, []);
        return removeComment(prev);
      });
    });

    channel.listen('.comment.updated', (e) => {
      setComments(prev => prev.map(c => c.id === e.comment.id
        ? { ...c, content: e.comment.content, formatted_date: formatDate(e.comment.updated_at) }
        : c));
    });

    return () => { window.Echo.leave(`task.${task.id}.comments`); };
  }, [task?.id, auth.user.id]);

  useEffect(() => {
    if (!window.Echo) return;
    const pusher = window.Echo.connector.pusher;
    const update = () => setIsRealtimeConnected(pusher.connection.state === 'connected');
    update();
    pusher.connection.bind('state_change', update);
    return () => pusher.connection.unbind('state_change', update);
  }, []);

  useEffect(() => {
    if (loadingComments) return;
    const container = document.getElementById('chat-messages-container');
    if (container) requestAnimationFrame(() => { container.scrollTop = container.scrollHeight; });
  }, [loadingComments]);

  // ─── Présence : en ligne / en train d'écrire / lu ───
  useEffect(() => {
    if (!window.Echo || !task?.id) return;

    const presenceChannel = window.Echo.join(`presence-task.${task.id}`)
      .here((users) => setOnlineUsers(users))
      .joining((user) => setOnlineUsers(prev => [...prev.filter(u => u.id !== user.id), user]))
      .leaving((user) => {
        setOnlineUsers(prev => prev.filter(u => u.id !== user.id));
        setTypingUsers(prev => {
          if (!prev[user.id]) return prev;
          const copy = { ...prev };
          delete copy[user.id];
          return copy;
        });
      })
      .listenForWhisper('typing', (e) => {
        if (e.userId === auth.user.id) return;
        setTypingUsers(prev => ({ ...prev, [e.userId]: e.userName }));
        clearTimeout(typingTimeoutsRef.current[e.userId]);
        typingTimeoutsRef.current[e.userId] = setTimeout(() => {
          setTypingUsers(prev => {
            const copy = { ...prev };
            delete copy[e.userId];
            return copy;
          });
        }, 3000);
      })
      .listenForWhisper('stop-typing', (e) => {
        setTypingUsers(prev => {
          if (!prev[e.userId]) return prev;
          const copy = { ...prev };
          delete copy[e.userId];
          return copy;
        });
      })
      .listenForWhisper('message-read', (e) => {
        if (!e?.commentId) return;
        setReadReceipts(prev => {
          const current = new Set(prev[e.commentId] || []);
          current.add(e.userId);
          return { ...prev, [e.commentId]: current };
        });
      })
      .listenForWhisper('reaction', (e) => {
        if (!e?.commentId || !e?.emoji || e.userId === auth.user.id) return;
        setReactions(prev => {
          const commentReactions = { ...(prev[e.commentId] || {}) };
          const userIds = [...(commentReactions[e.emoji] || [])];
          const idx = userIds.indexOf(e.userId);
          if (idx >= 0) userIds.splice(idx, 1); else userIds.push(e.userId);
          if (userIds.length === 0) delete commentReactions[e.emoji]; else commentReactions[e.emoji] = userIds;
          return { ...prev, [e.commentId]: commentReactions };
        });
      })
      .listen('.comment.reaction.updated', (e) => {
        if (!e?.commentId || !e?.reactions) return;
        const converted = {};
        Object.entries(e.reactions).forEach(([emoji, data]) => { converted[emoji] = data.user_ids; });
        setReactions(prev => ({ ...prev, [e.commentId]: converted }));
      });

    presenceChannelRef.current = presenceChannel;

    return () => {
      Object.values(typingTimeoutsRef.current).forEach(clearTimeout);
      typingTimeoutsRef.current = {};
      window.Echo.leave(`presence-task.${task.id}`);
      presenceChannelRef.current = null;
    };
  }, [task?.id, auth.user.id]);

  const emitTyping = useCallback(() => {
    if (!presenceChannelRef.current) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < 1500) return;
    lastTypingSentRef.current = now;
    presenceChannelRef.current.whisper('typing', { userId: auth.user.id, userName: auth.user.name });
  }, [auth.user.id, auth.user.name]);

  const emitStopTyping = useCallback(() => {
    if (!presenceChannelRef.current) return;
    lastTypingSentRef.current = 0;
    presenceChannelRef.current.whisper('stop-typing', { userId: auth.user.id });
  }, [auth.user.id]);

  // ─── Marque les messages des autres comme lus dès qu'ils sont visibles ───
  useEffect(() => {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;

    const seen = new Set();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const commentId = el.dataset.commentId;
        const authorId = el.dataset.authorId;
        if (!commentId || commentId === 'null' || seen.has(commentId)) return;
        if (String(authorId) === String(auth.user.id)) return;

        seen.add(commentId);
        presenceChannelRef.current?.whisper('message-read', { commentId, userId: auth.user.id });
        observer.unobserve(el);
      });
    }, { root: container, threshold: 0.6 });

    container.querySelectorAll('[data-comment-id]').forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, [comments, auth.user.id]);

  return (
    <>
<div className="fixed top-0 bottom-0 left-64 right-0 z-50 bg-white dark:bg-gray-900 flex flex-col">
            {/* ─── HEADER STYLE WHATSAPP ─── */}
        <div className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-800 text-white flex-shrink-0 shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            {headerLeftSlot || (
              <button
                type="button"
                onClick={() => router.visit('/discussions')}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white/90 hover:bg-white/15 transition-colors flex-shrink-0"
                title={t('discussions.back_to_list', 'Retour aux discussions')}
              >
                <FaArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner flex-shrink-0">
              <FaCommentDots className="text-white text-lg" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base leading-tight flex items-center gap-2 truncate">
                <span className="truncate">{task.title}</span>
                {isRealtimeConnected && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" title="Temps réel connecté" />}
              </h3>
              <p className="text-xs text-blue-100 flex items-center gap-2 mt-0.5">
                {loadingComments ? t('task_details.loading_comments') : `${comments.length} message${comments.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => router.visit(`/tasks/${task.id}`)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white/90 hover:bg-white/15 transition-colors flex-shrink-0"
              title={t('task_details.view_task', 'Voir la tâche')}
            >
              <FaExternalLinkAlt className="w-4 h-4" />
            </button>

            <OnlineAvatarStack users={onlineUsers} />

            <label
              className={`hidden sm:flex items-center gap-2 pl-2.5 pr-1.5 py-1.5 rounded-full transition-colors duration-200 cursor-pointer select-none border ${
                shareDiscussionEmail
                  ? 'bg-orange-500 hover:bg-orange-600 border-orange-300/60 shadow-sm shadow-orange-500/30'
                  : 'bg-white/10 hover:bg-white/20 border-white/15'
              }`}
              title={shareDiscussionEmail ? t('task_details.email_copy_enabled') : t('task_details.email_copy_disabled')}
            >
              <FaEnvelope className={`w-3.5 h-3.5 flex-shrink-0 transition-colors duration-200 ${shareDiscussionEmail ? 'text-white animate-pulse' : 'text-blue-200'}`} />
              <input
                type="checkbox"
                checked={shareDiscussionEmail}
                onChange={toggleDiscussionEmail}
                aria-label={t('task_details.share_discussions_by_email')}
                className="sr-only peer"
              />
              <span className={`relative w-8 h-4 rounded-full transition-colors duration-200 ${shareDiscussionEmail ? 'bg-orange-200' : 'bg-white/25'}`}>
                <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full shadow-sm transition-transform duration-200 ${shareDiscussionEmail ? 'bg-orange-600 translate-x-4' : 'bg-white'}`} />
              </span>
            </label>
          </div>
        </div>

        {/* ─── ZONE DES MESSAGES ─── */}
        <div
          id="chat-messages-container"
          className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 space-y-3 relative"
          style={{ background: 'var(--chat-bg, #ece5dd)', scrollBehavior: 'smooth' }}
        >
          <style>{`
            .dark #chat-messages-container { --chat-bg: #0f172a; }
            .bubble-left { border-radius: 4px 18px 18px 18px; }
            .bubble-right { border-radius: 18px 4px 18px 18px; }
            .bubble-pending { opacity: 0.7; }
            .tick { font-size: 11px; }
          `}</style>

          {loadingComments ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t('task_details.loading_comments')}</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shadow-inner">
                <FaCommentDots className="text-3xl text-blue-500 dark:text-blue-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{t('task_details.no_discussion_yet')}</p>
            </div>
          ) : (
            [...comments].reverse().map(comment => {
              const isMe = comment.user?.id === auth.user.id;
              const isPending = comment._pending === true;
              const hasFailed = comment._failed === true;
              const commentReactions = reactions[comment.id] || {};
              const reactionEntries = Object.entries(commentReactions).filter(([, userIds]) => userIds && userIds.length > 0);

              return (
                <div
                  key={comment.id || comment._tempId}
                  data-comment-id={comment.id || ''}
                  data-author-id={comment.user?.id || ''}
                  className={`group relative flex flex-col ${isMe ? 'items-end' : 'items-start'} gap-1`}
                >
                  <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[78%] min-w-0 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!isMe && (
                      <div className="relative flex-shrink-0 mb-0.5" title={comment.user?.name || ''}>
                        <img
                          src={comment.user?.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user?.name || '')}&background=1D9E75&color=fff`}
                          alt={comment.user?.name}
                          className="w-7 h-7 rounded-full object-cover shadow-sm border border-gray-200 dark:border-gray-700"
                        />
                        {isUserOnline(comment.user?.id) && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white dark:border-gray-800" />
                        )}
                      </div>
                    )}

                    <div className={`relative px-3.5 py-2.5 shadow-sm ${comment.audio_path ? 'min-w-[220px]' : 'min-w-[120px]'} ${isPending ? 'bubble-pending' : ''} ${
                      isMe
                        ? `bubble-right ${hasFailed ? 'bg-red-100 dark:bg-red-900/40 text-red-900' : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'}`
                        : 'bubble-left bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-100'
                    }`}>
                      {activeReactionPicker === comment.id && (
                        <ReactionPicker commentId={comment.id} isMe={isMe} onReact={handleReaction} onClose={() => setActiveReactionPicker(null)} />
                      )}

                      {!isMe && comment.user?.name && (
                        <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mb-0.5">{comment.user.name}</p>
                      )}

                      {comment.parent && (
                        <div className={`mb-2 px-2.5 py-1.5 rounded-lg text-xs border-l-3 ${
                          isMe ? 'border-white/80 bg-white/15 text-white/90' : 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-gray-600 dark:text-gray-300'
                        }`}>
                          <p className="truncate opacity-80">{comment.parent.content}</p>
                        </div>
                      )}

                      {editingId === comment.id ? (
                        <form onSubmit={handleUpdateComment} className="min-w-[200px]">
                          <textarea
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            className="w-full p-2 text-sm rounded-lg border border-gray-300 dark:border-gray-500 dark:bg-gray-700 dark:text-white focus:ring-1 focus:ring-blue-500 resize-none"
                            rows={3}
                            autoFocus
                            maxLength={2000}
                          />
                          <div className="flex gap-2 mt-1.5 justify-end">
                            <button type="button" onClick={() => setEditingId(null)} className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300">
                              {t('task_details.cancel')}
                            </button>
                            <button type="submit" className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1 font-medium">
                              <FaSave className="w-3 h-3" /> {t('task_details.save')}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          {comment.content && (
                            <div
                              className={`text-sm whitespace-pre-wrap break-words leading-relaxed ${isMe ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}
                              dangerouslySetInnerHTML={{
                                __html: highlightMentions(linkifyText(comment.content, isMe))
                                  .replace(/<table([^>]*)>/g, '<div class="overflow-x-auto"><table class="min-w-full border-collapse border border-gray-300 dark:border-gray-600 text-xs" $1>')
                                  .replace(/<\/table>/g, '</table></div>')
                                  .replace(/<th([^>]*)>/g, '<th class="border border-gray-300 px-2 py-1 bg-gray-100 dark:bg-gray-700" $1>')
                                  .replace(/<td([^>]*)>/g, '<td class="border border-gray-300 px-2 py-1" $1>'),
                              }}
                            />
                          )}

                          {comment.image_path && (
                            <div className="mt-1.5 max-w-full overflow-hidden rounded-xl">
                              <img
                                src={comment.image_path.startsWith('blob:') || comment.image_path.startsWith('http') ? comment.image_path : `/storage/public/${comment.image_path}`}
                                alt="Photo partagée"
                                className="max-w-full max-h-72 rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => setImageLightbox(comment.image_path.startsWith('blob:') || comment.image_path.startsWith('http') ? comment.image_path : `/storage/public/${comment.image_path}`)}
                              />
                            </div>
                          )}

                          {comment.audio_path && (
                            <div className="mt-1.5 max-w-full overflow-hidden">
                              <AudioPlayer src={comment.audio_path} isMe={isMe} />
                            </div>
                          )}

                          <div className={`flex items-center gap-1 mt-1 justify-end tick ${isMe ? 'text-white/70' : 'text-gray-400 dark:text-gray-500'}`}>
                            <span>{new Date(comment.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                            {comment.id && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setReadReceiptsViewer(comment.id); }}
                                className="ml-0.5 opacity-70 hover:opacity-100 transition-opacity"
                                title="Voir qui a lu ce message"
                              >
                                <FaInfoCircle className="w-2.5 h-2.5" />
                              </button>
                            )}
                            {isMe && (
                              hasFailed
                                ? <span className="text-red-300 text-xs">✕</span>
                                : isPending
                                ? <span className="text-white/60">⏳</span>
                                : (comment.id && readReceipts[comment.id]?.size > 0)
                                ? <span className="text-sky-300 font-bold" title="Lu">✓✓</span>
                                : <span className="text-white/80" title="Envoyé">✓✓</span>
                            )}
                          </div>

                          {hasFailed && (
                            <p className="text-xs text-red-500 mt-1 font-medium">
                              {t('task_details.send_failed')}
                              <button onClick={() => retryComment(comment)} className="ml-1 underline hover:no-underline font-semibold">
                                {t('task_details.retry')}
                              </button>
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    {!isPending && editingId !== comment.id && (
                      <div className={`flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-1 rounded-full shadow border border-gray-200 dark:border-gray-700 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        <button onClick={() => setActiveReactionPicker(prev => prev === comment.id ? null : comment.id)} className="text-gray-500 hover:text-amber-500 p-1 rounded-full transition-colors" title="Ajouter une réaction">
                          <FaSmileBeam className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleReplyComment(comment.id)} className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded-full transition-colors" title={t('task_details.response')}>
                          <FaReply className="w-3.5 h-3.5" />
                        </button>
                        {comment.content && (
                          <button onClick={() => handleCopyMessage(comment.id, comment.content)} className="text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 p-1 rounded-full transition-colors" title={copiedCommentId === comment.id ? 'Copié' : 'Copier le message'}>
                            {copiedCommentId === comment.id ? <FaCheck className="w-3.5 h-3.5 text-emerald-500" /> : <FaCopy className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        {isMe && (
                          <>
                            <button onClick={() => handleEditComment(comment)} className="text-gray-500 hover:text-blue-500 p-1 rounded-full transition-colors" title={t('edit')}>
                              <FaEdit className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeleteComment(comment.id)} className="text-gray-500 hover:text-red-500 p-1 rounded-full transition-colors" title={t('delete')}>
                              <FaTrash className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {reactionEntries.length > 0 && (
                    <div className={`flex flex-wrap gap-1 ${isMe ? 'pr-2 justify-end' : 'pl-9 justify-start'}`}>
                      {reactionEntries.map(([emoji, userIds]) => {
                        const hasReacted = userIds.includes(auth.user.id);
                        return (
                          <div key={emoji} className={`inline-flex items-center rounded-full border text-xs overflow-hidden transition-all ${
                            hasReacted ? 'bg-blue-100 dark:bg-blue-900/60 border-blue-400 text-blue-700 dark:text-blue-300 font-semibold shadow-xs' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                          }`}>
                            <button type="button" onClick={() => handleReaction(comment.id, emoji)} className="inline-flex items-center gap-1 px-2 py-0.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors" title={hasReacted ? 'Retirer ma réaction' : 'Réagir'}>
                              <span>{emoji}</span>
                              <span className="text-[10px] font-bold">{userIds.length}</span>
                            </button>
                            <button type="button" onClick={() => setReactionViewer({ commentId: comment.id, emoji })} className="px-1.5 py-0.5 border-l border-current/20 hover:bg-black/5 dark:hover:bg-white/5 transition-colors" title="Voir qui a réagi">
                              <FaInfoCircle className="w-2.5 h-2.5 opacity-70" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {comment.replies && comment.replies.length > 0 && (
                    <div className={`flex flex-col gap-1 mt-1 ${isMe ? 'items-end pr-2' : 'items-start pl-9'}`}>
                      {[...comment.replies].reverse().map(reply => {
                        const isReplyMe = reply.user?.id === auth.user.id;
                        return (
                          <div key={reply.id} className={`flex items-end gap-1.5 max-w-[75%] min-w-0 ${isReplyMe ? 'flex-row-reverse' : 'flex-row'}`}>
                            {!isReplyMe && (
                              <img
                                src={reply.user?.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(reply.user?.name || '')}&background=1D9E75&color=fff`}
                                alt={reply.user?.name}
                                title={reply.user?.name || ''}
                                className="w-5 h-5 rounded-full flex-shrink-0 mb-0.5 object-cover"
                              />
                            )}
                            <div className={`px-3 py-1.5 shadow-xs text-sm ${reply.audio_path ? 'min-w-[220px]' : 'min-w-0'} ${
                              isReplyMe ? 'bg-blue-500 dark:bg-blue-700 text-white bubble-right' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-600 bubble-left'
                            }`}>
                              <p className="whitespace-pre-wrap break-words leading-relaxed" dangerouslySetInnerHTML={{ __html: linkifyText(reply.content, isReplyMe) }} />
                              {reply.audio_path && (
                                <div className="mt-1 max-w-full overflow-hidden">
                                  <AudioPlayer src={reply.audio_path} isMe={isReplyMe} />
                                </div>
                              )}
                              <div className={`flex items-center gap-1 mt-0.5 justify-end tick ${isReplyMe ? 'text-white/70' : 'text-gray-400'}`}>
                                <span>{new Date(reply.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                {isReplyMe && <span>✓✓</span>}
                                {isReplyMe && (
                                  <button onClick={() => handleDeleteComment(reply.id)} className="ml-1 text-white/50 hover:text-white/80">
                                    <FaTrash className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {Object.keys(typingUsers).length > 0 && (
          <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-50/90 dark:bg-blue-900/30 border-t border-blue-100 dark:border-blue-900 flex-shrink-0">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" />
            </div>
            <span className="text-xs text-blue-700 dark:text-blue-300 font-medium italic">
              {Object.values(typingUsers).join(', ')}{' '}
              {Object.keys(typingUsers).length > 1 ? t('task_details.are_typing', 'sont en train d\'écrire…') : t('task_details.is_typing', 'est en train d\'écrire…')}
            </span>
          </div>
        )}

        {replyingTo && (
          <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 border-t border-blue-200 dark:border-blue-800 flex-shrink-0">
            <div className="flex-1 border-l-3 border-blue-500 pl-3">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                <FaReply className="w-3 h-3" /> {t('task_details.reply_to_comment')}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300 truncate font-medium">
                {(() => {
                  const parent = comments.find(c => c.id === replyingTo) || comments.flatMap(c => c.replies || []).find(r => r.id === replyingTo);
                  return parent?.content?.substring(0, 60) || '...';
                })()}
              </p>
            </div>
            <button onClick={cancelReply} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full">
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
        )}

        {showEmojiPicker && (
          <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 shadow-lg max-h-56 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2 mb-2">
              <div className="flex gap-2">
                <button type="button" onClick={() => setActivePickerTab('emojis')} className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${activePickerTab === 'emojis' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                  Émojis
                </button>
                <button type="button" onClick={() => setActivePickerTab('stickers')} className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${activePickerTab === 'stickers' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                  Stickers
                </button>
              </div>
              <button type="button" onClick={() => setShowEmojiPicker(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <FaTimes className="w-3.5 h-3.5" />
              </button>
            </div>

            {activePickerTab === 'emojis' ? (
              <div className="grid grid-cols-10 gap-1.5">
                {COMMON_EMOJIS.map((emoji, idx) => (
                  <button key={idx} type="button" onClick={() => setCommentContent(prev => prev + emoji)} className="text-xl hover:scale-125 transition-transform p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center">
                    {emoji}
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {STICKERS.map(sticker => (
                  <button
                    key={sticker.id}
                    type="button"
                    onClick={() => { setCommentContent(prev => (prev ? prev + ' ' : '') + `${sticker.emoji} ${sticker.title}`); setShowEmojiPicker(false); }}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-bold transition-all hover:scale-102 hover:shadow-md ${sticker.bg}`}
                  >
                    <span className="text-xl">{sticker.emoji}</span>
                    <span>{sticker.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── ZONE DE SAISIE ─── */}
        <div className="flex-shrink-0 px-3 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-inner">
          {error && (
            <div className="mb-2 px-3 py-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-300 flex items-center gap-2">
              <FaInfoCircle className="flex-shrink-0" />
              <span>{error}</span>
              <button onClick={() => setError('')} className="ml-auto"><FaTimes className="w-3 h-3" /></button>
            </div>
          )}

          {audioUrl && (
            <div className="mb-2 flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
              <FaMicrophone className="text-blue-600 w-4 h-4 flex-shrink-0" />
              <audio controls src={audioUrl} className="h-8 flex-1" />
              <button onClick={() => { setAudioUrl(null); setAudioBlob(null); }} className="text-red-400 hover:text-red-600 p-1">
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
          )}

          {imagePreviewUrl && (
            <div className="mb-2 flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
              <img src={imagePreviewUrl} alt="Aperçu" className="h-12 w-12 rounded-lg object-cover flex-shrink-0" />
              <span className="text-xs text-gray-600 dark:text-gray-300 flex-1 truncate">{imageFile?.name}</span>
              <button onClick={removeSelectedImage} className="text-red-400 hover:text-red-600 p-1">
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
          )}

          {isRecording ? (
            <div
              className="relative flex items-center gap-3 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800/60 select-none touch-none"
              onMouseMove={handleMicPointerMove}
              onMouseUp={handleMicPointerUp}
              onMouseLeave={handleMicPointerUp}
              onTouchMove={handleMicPointerMove}
              onTouchEnd={handleMicPointerUp}
            >
              <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <span className="font-mono text-sm text-red-600 dark:text-red-300 font-semibold tabular-nums flex-shrink-0">{formatTime(recordingTime)}</span>
              <div className={`flex-1 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium transition-colors ${recordingCancelled ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>
                {recordingCancelled ? <span className="font-bold">Relâchez pour annuler</span> : (<><FaTimes className="w-3 h-3 opacity-60" /><span>Glissez pour annuler</span></>)}
              </div>
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg flex-shrink-0 transition-colors duration-150 ${recordingCancelled ? 'bg-gray-400 dark:bg-gray-600' : 'bg-red-600'}`}
                style={{ transform: `translateX(${Math.min(0, Math.max(dragX, -80))}px)` }}
              >
                <FaMicrophone className="w-4.5 h-4.5 text-white" />
              </div>
            </div>
          ) : (
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(prev => !prev)}
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${showEmojiPicker ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                title="Émojis & Stickers"
              >
                <FaSmile className="w-5 h-5" />
              </button>

              <input type="file" ref={imageInputRef} onChange={handleImageSelect} className="hidden" accept="image/*" />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Partager une photo"
              >
                <FaPaperclip className="w-4.5 h-4.5" />
              </button>

              <div className="flex-1 relative">
                <textarea
                  value={commentContent}
                  onPaste={handlePasteImage}
                  onChange={e => {
                    const value = e.target.value;
                    setCommentContent(value);
                    value.trim() ? emitTyping() : emitStopTyping();

                    const cursor = e.target.selectionStart;
                    const textBeforeCursor = value.slice(0, cursor);
                    const match = textBeforeCursor.match(/@(\w*)$/);
                    if (match) { setMentionQuery(match[1].toLowerCase()); setShowMentionPicker(true); } else { setShowMentionPicker(false); }
                  }}
                  ref={commentTextareaRef}
                  onBlur={emitStopTyping}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (commentContent.trim() || audioBlob || imageFile) handleCommentSubmit(e);
                    }
                  }}
                  placeholder={replyingTo ? 'Écrire une réponse...' : 'Tapez un message...'}
                  rows={1}
                  disabled={posting || isRecording}
                  maxLength={2000}
                  className="w-full px-4 py-2.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-2xl border-none focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed transition-all"
                  style={{ minHeight: '42px', maxHeight: '120px', overflowY: 'auto' }}
                  onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
                />

                {showMentionPicker && (
                  <div className="absolute bottom-full mb-2 left-0 w-64 max-h-48 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-30">
                    {projectMembers?.filter(m => m.name.toLowerCase().includes(mentionQuery)).slice(0, 6).map(member => (
                      <button key={member.id} type="button" onClick={() => insertMention(member)} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left">
                        <img src={member.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}`} className="w-6 h-6 rounded-full" />
                        <span className="text-sm text-gray-800 dark:text-gray-100">{member.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {commentContent.trim() || audioBlob || imageFile ? (
                <button
                  type="button"
                  onClick={e => handleCommentSubmit(e)}
                  disabled={posting}
                  className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md hover:shadow-lg transition-all active:scale-95"
                  title="Envoyer"
                >
                  {posting ? (
                    <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <FaPaperPlane className="w-4 h-4 ml-0.5" />
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onMouseDown={handleMicPointerDown}
                  onTouchStart={handleMicPointerDown}
                  disabled={posting}
                  className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 hover:text-blue-600 flex items-center justify-center transition-all active:scale-95 touch-none select-none"
                  title="Maintenez pour enregistrer un message vocal"
                >
                  <FaMicrophone className="w-4.5 h-4.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Modals ─── */}
      <Modal show={showConfirmDeleteCommentModal} onClose={() => setShowConfirmDeleteCommentModal(false)} maxWidth="sm">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">{t('task_details.confirm_delete_comment')}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{t('task_details.confirm_delete_comment_message')}</p>
          <div className="mt-6 flex justify-end">
            <button onClick={() => setShowConfirmDeleteCommentModal(false)} className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
              {t('task_details.cancel')}
            </button>
            <button onClick={confirmDeleteComment} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
              {t('task_details.delete')}
            </button>
          </div>
        </div>
      </Modal>

      <Modal show={!!readReceiptsViewer} onClose={() => setReadReceiptsViewer(null)} maxWidth="sm">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <FaInfoCircle className="text-blue-500" /> Lu par
          </h3>
          {(() => {
            const readerIds = readReceiptsViewer ? Array.from(readReceipts[readReceiptsViewer] || []) : [];
            if (readerIds.length === 0) return <p className="text-sm text-gray-400 italic">Personne n'a encore lu ce message.</p>;
            return (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {readerIds.map(id => {
                  const user = resolveUser(id);
                  return (
                    <div key={id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <img src={user?.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Utilisateur')}`} alt={user?.name || 'Utilisateur'} className="w-8 h-8 rounded-full object-cover" />
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{user?.name || 'Utilisateur inconnu'}</span>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </Modal>

      <Modal show={!!reactionViewer} onClose={() => setReactionViewer(null)} maxWidth="sm">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <span className="text-xl">{reactionViewer?.emoji}</span> A réagi
          </h3>
          {(() => {
            const userIds = reactionViewer ? (reactions[reactionViewer.commentId]?.[reactionViewer.emoji] || []) : [];
            if (userIds.length === 0) return <p className="text-sm text-gray-400 italic">Aucune réaction.</p>;
            return (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {userIds.map(id => {
                  const user = resolveUser(id);
                  return (
                    <div key={id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <img src={user?.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Utilisateur')}`} alt={user?.name || 'Utilisateur'} className="w-8 h-8 rounded-full object-cover" />
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{user?.name || 'Utilisateur inconnu'}</span>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </Modal>

      {imageLightbox && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setImageLightbox(null)}>
          <button type="button" onClick={() => setImageLightbox(null)} className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center backdrop-blur-md transition-colors" title="Fermer">
            <FaTimes className="w-4 h-4" />
          </button>
          <img src={imageLightbox} alt="Aperçu de la photo" onClick={(e) => e.stopPropagation()} className="max-w-[92vw] max-h-[88vh] object-contain rounded-lg shadow-2xl select-none" />
        </div>
      )}
    </>
  );
}

Show.layout = (page) => <AdminLayout children={page} />;