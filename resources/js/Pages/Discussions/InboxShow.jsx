import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FaArrowLeft, FaPaperPlane, FaExclamationCircle, FaLock } from 'react-icons/fa';
import {
  fetchInboxContacts, fetchInboxConversation, postInboxMessage, inboxChannelName,
  contactAvatar, setInboxSeen, formatClock, formatDayLabel, isSameDay, isMine,
} from '@/lib/inbox';

/**
 * Page Inbox/Show : conversation privée entre l'utilisateur connecté et un contact.
 * Rendue par la route inbox.show (/inbox/{contact}) avec `contactId` en prop Inertia.
 * Les messages passent par /api/inbox/conversations/{id} et arrivent en temps réel
 * via le canal privé Echo `inbox.{idMin}.{idMax}` (évènement .inbox.message).
 */
export default function InboxShow({ contactId }) {
  const { auth } = usePage().props;
  const me = auth?.user;

  const [contact, setContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = useCallback((smooth = false) => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    });
  }, []);

  // ─── Chargement : contact + fil de messages en parallèle ───
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [contacts, conversation] = await Promise.all([
        fetchInboxContacts().catch(() => []),
        fetchInboxConversation(contactId),
      ]);
      const found = contacts.find((c) => String(c.id) === String(contactId)) || conversation.contact;
      setContact(found || null);
      setMessages(conversation.messages);
      setInboxSeen(contactId);
    } catch (err) {
      console.error(err);
      setError(err.message || "Impossible d'ouvrir cette conversation.");
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (!loading) scrollToBottom(); }, [loading, scrollToBottom]);

  // ─── Temps réel ───
  useEffect(() => {
    if (!window.Echo || !contactId || !me?.id) return;
    const channelName = inboxChannelName(me.id, contactId);
    const channel = window.Echo.private(channelName);

    channel.listen('.inbox.message', (payload) => {
      const incoming = payload?.message;
      if (!incoming) return;
      const mine = isMine(incoming, me.id);

      setMessages((prev) => {
        if (prev.some((m) => String(m.id) === String(incoming.id))) return prev;
        // Mon propre message : remplace la bulle optimiste au lieu d'en ajouter une seconde
        if (mine) {
          const pendingIdx = prev.findIndex((m) => m._pending);
          if (pendingIdx !== -1) {
            const next = [...prev];
            next[pendingIdx] = { ...incoming, is_me: true };
            return next;
          }
        }
        return [...prev, { ...incoming, is_me: mine }];
      });

      if (!mine) setInboxSeen(contactId);
      scrollToBottom(true);
    });

    return () => { window.Echo.leave(channelName); };
  }, [contactId, me?.id, scrollToBottom]);

  // ─── Envoi optimiste, avec ré-essai en cas d'échec ───
  const send = useCallback(async (contentOverride = null, retryTempId = null) => {
    const content = (contentOverride ?? draft).trim();
    if (!content || !contactId) return;

    const tempId = retryTempId || `temp_${Date.now()}`;
    const optimistic = {
      id: tempId, _pending: true, _failed: false, is_me: true,
      sender_id: me.id, receiver_id: contactId, content,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => (retryTempId
      ? prev.map((m) => (m.id === retryTempId ? optimistic : m))
      : [...prev, optimistic]));
    if (contentOverride === null) {
      setDraft('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
    setError('');
    setSending(true);
    scrollToBottom(true);

    try {
      const saved = await postInboxMessage(contactId, content);
      setMessages((prev) => {
        if (!saved) return prev.map((m) => (m.id === tempId ? { ...m, _pending: false } : m));
        // L'évènement temps réel a pu arriver avant la réponse HTTP : on évite le doublon
        if (prev.some((m) => String(m.id) === String(saved.id))) return prev.filter((m) => m.id !== tempId);
        return prev.map((m) => (m.id === tempId ? { ...saved, is_me: true } : m));
      });
    } catch (err) {
      console.error(err);
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, _pending: false, _failed: true } : m)));
      setError(err.message || "Votre message n'a pas pu être envoyé.");
    } finally {
      setSending(false);
    }
  }, [draft, contactId, me?.id, scrollToBottom]);

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // ─── Messages groupés par jour ───
  const rows = useMemo(() => {
    const out = [];
    let lastDate = null;
    messages.forEach((m) => {
      if (!lastDate || !isSameDay(lastDate, m.created_at)) {
        lastDate = m.created_at;
        out.push({ type: 'day', key: `day-${m.created_at}`, label: formatDayLabel(m.created_at) });
      }
      out.push({ type: 'msg', key: m.id, message: m });
    });
    return out;
  }, [messages]);

  return (
    <div className="fixed top-0 bottom-0 left-64 right-0 z-50 bg-white dark:bg-gray-900 flex flex-col">
      {/* En-tête */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-800 text-white flex-shrink-0 shadow-md">
        <button
          type="button"
          onClick={() => router.visit('/discussions?tab=inbox')}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white/90 hover:bg-white/15 transition-colors flex-shrink-0"
          title="Retour à l'inbox"
          aria-label="Retour à l'inbox"
        >
          <FaArrowLeft className="w-4 h-4" />
        </button>
        <img
          src={contactAvatar(contact)}
          alt={contact?.name || 'Contact'}
          className="w-10 h-10 rounded-full object-cover border-2 border-white/30 flex-shrink-0"
        />
        <div className="min-w-0">
          <h3 className="font-bold text-base leading-tight truncate">{contact?.name || 'Conversation'}</h3>
          <p className="text-xs text-blue-100 flex items-center gap-1.5 mt-0.5">
            <FaLock className="w-2.5 h-2.5" /> Message privé
          </p>
        </div>
      </div>

      {/* Fil de messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 space-y-2 bg-[#ece5dd] dark:bg-slate-900"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Chargement de la conversation...</p>
          </div>
        ) : error && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
            <FaExclamationCircle className="text-3xl text-red-400" />
            <p className="text-sm text-gray-600 dark:text-gray-300">{error}</p>
            <div className="flex gap-2">
              <button type="button" onClick={load} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium">Réessayer</button>
              <button type="button" onClick={() => router.visit('/discussions?tab=inbox')} className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium">Retour</button>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-500 dark:text-gray-400 text-center px-6">
            Aucun message pour l'instant. Écrivez le premier à {contact?.name || 'ce contact'}.
          </div>
        ) : (
          rows.map((row) => {
            if (row.type === 'day') {
              return (
                <div key={row.key} className="flex justify-center py-2">
                  <span className="px-3 py-1 rounded-full bg-white/80 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-medium shadow-sm">
                    {row.label}
                  </span>
                </div>
              );
            }
            const m = row.message;
            const mine = isMine(m, me?.id);
            return (
              <div key={row.key} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                    mine
                      ? `${m._failed ? 'bg-red-100 text-red-900' : 'bg-blue-600 text-white'} rounded-br-md ${m._pending ? 'opacity-70' : ''}`
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-bl-md'
                  }`}
                >
                  {/* Texte brut : React échappe le contenu, pas de dangerouslySetInnerHTML */}
                  <p className="break-words whitespace-pre-wrap leading-relaxed">{m.content}</p>
                  <div className={`mt-1 flex items-center justify-end gap-1.5 text-[10px] ${mine ? (m._failed ? 'text-red-500' : 'text-blue-100') : 'text-gray-400 dark:text-gray-500'}`}>
                    <span>{formatClock(m.created_at)}</span>
                    {mine && m._pending && <span>⏳</span>}
                    {mine && m._failed && (
                      <button type="button" onClick={() => send(m.content, m.id)} className="underline font-semibold">
                        Réessayer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Zone de saisie */}
      <div className="flex-shrink-0 px-3 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        {error && messages.length > 0 && (
          <div className="mb-2 px-3 py-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-300 flex items-center gap-2">
            <FaExclamationCircle className="flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button type="button" onClick={() => setError('')} aria-label="Fermer">✕</button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={onKeyDown}
            rows={1}
            maxLength={2000}
            disabled={loading || (!contact && !!error)}
            placeholder={`Écrire à ${contact?.name || 'ce contact'}...`}
            className="flex-1 px-4 py-2.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-2xl border-none focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
            style={{ minHeight: 42, maxHeight: 120 }}
          />
          <button
            type="button"
            onClick={() => send()}
            disabled={sending || !draft.trim()}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Envoyer"
            aria-label="Envoyer"
          >
            <FaPaperPlane className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

InboxShow.layout = (page) => <AdminLayout children={page} />;
