import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { usePage } from '@inertiajs/react';
import MobileLayout from '@/Layouts/MobileLayout';
import { nativeFeedback } from '@/lib/platform';
import {
  fetchInboxContacts, fetchInboxConversation, postInboxMessage, inboxChannelName,
  contactAvatar, setInboxSeen, formatClock, formatDayLabel, isSameDay, isMine,
} from '@/lib/inbox';

export default function MobileInboxShow({ contactId }) {
  const { auth } = usePage().props;
  const me = auth?.user || auth;

  const [contact, setContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback((smooth = false) => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [contacts, conversation] = await Promise.all([
        fetchInboxContacts().catch(() => []),
        fetchInboxConversation(contactId),
      ]);
      setContact(contacts.find((c) => String(c.id) === String(contactId)) || conversation.contact || null);
      setMessages(conversation.messages);
      setInboxSeen(contactId);
    } catch (err) {
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

  // ─── Envoi optimiste + ré-essai ───
  const send = useCallback(async (contentOverride = null, retryTempId = null) => {
    const content = (contentOverride ?? draft).trim();
    if (!content || !contactId) return;
    nativeFeedback.tap();

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
      if (inputRef.current) inputRef.current.style.height = 'auto';
    }
    setError('');
    setSending(true);
    scrollToBottom(true);

    try {
      const saved = await postInboxMessage(contactId, content);
      setMessages((prev) => {
        if (!saved) return prev.map((m) => (m.id === tempId ? { ...m, _pending: false } : m));
        if (prev.some((m) => String(m.id) === String(saved.id))) return prev.filter((m) => m.id !== tempId);
        return prev.map((m) => (m.id === tempId ? { ...saved, is_me: true } : m));
      });
    } catch (err) {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, _pending: false, _failed: true } : m)));
      setError(err.message || 'Message non envoyé.');
    } finally {
      setSending(false);
    }
  }, [draft, contactId, me?.id, scrollToBottom]);

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
    <MobileLayout
      title={contact?.name || 'Conversation'}
      subtitle="Message privé"
      backHref="/discussions?tab=inbox"
      headerRight={
        <img src={contactAvatar(contact)} alt="" className="w-8 h-8 rounded-full object-cover" />
      }
      hideBottomNav
      fullBleed
    >
      <div className="flex flex-col h-full bg-[#f0f2f5] dark:bg-[#0d1117]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 space-y-1.5" style={{ WebkitOverflowScrolling: 'touch' }}>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className={`h-10 rounded-2xl animate-pulse ${i % 2 === 0 ? 'bg-blue-200 dark:bg-blue-900/40 w-48' : 'bg-gray-200 dark:bg-gray-700 w-36'}`} />
              </div>
            ))
          ) : error && messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 px-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300">{error}</p>
              <button type="button" onClick={load} className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-medium active:scale-95">Réessayer</button>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-3xl">💬</div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Écrivez le premier message à {contact?.name || 'ce contact'}.</p>
            </div>
          ) : (
            rows.map((row) => {
              if (row.type === 'day') {
                return (
                  <div key={row.key} className="flex justify-center py-2">
                    <span className="px-3 py-1 bg-white/80 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs rounded-full font-medium shadow-sm">{row.label}</span>
                  </div>
                );
              }
              const m = row.message;
              const mine = isMine(m, me?.id);
              return (
                <div key={row.key} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] px-3.5 py-2 text-sm shadow-sm ${
                      mine
                        ? `${m._failed ? 'bg-red-100 text-red-900' : 'bg-blue-600 text-white'} rounded-2xl rounded-br-sm ${m._pending ? 'opacity-70' : ''}`
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl rounded-bl-sm border border-gray-100 dark:border-gray-700'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{m.content}</p>
                    <div className={`mt-1 flex items-center justify-end gap-1.5 text-[10px] ${mine ? (m._failed ? 'text-red-500' : 'text-blue-200') : 'text-gray-400 dark:text-gray-500'}`}>
                      <span>{formatClock(m.created_at)}</span>
                      {mine && m._pending && <span>⏳</span>}
                      {mine && m._failed && (
                        <button type="button" onClick={() => send(m.content, m.id)} className="underline font-semibold">Réessayer</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {error && messages.length > 0 && (
          <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-300 flex items-center gap-2">
            <span className="flex-1">{error}</span>
            <button type="button" onClick={() => setError('')} aria-label="Fermer">✕</button>
          </div>
        )}

        <div
          className="flex-shrink-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-2 py-2 flex items-end gap-2"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
        >
          <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-3xl px-4 py-1 min-h-[42px] flex items-end">
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              rows={1}
              maxLength={2000}
              placeholder="Message…"
              className="w-full bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 resize-none outline-none leading-relaxed py-2"
              style={{ maxHeight: 120, overflowY: 'auto' }}
            />
          </div>
          <button
            type="button"
            onClick={() => send()}
            disabled={sending || !draft.trim()}
            aria-label="Envoyer"
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-blue-600 rounded-full text-white active:scale-90 transition-transform disabled:opacity-50"
          >
            <svg className="w-5 h-5 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </MobileLayout>
  );
}
