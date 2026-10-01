import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
  FaArrowLeft, FaPaperPlane, FaLock, FaSmile, FaPaperclip, FaMicrophone, FaTimes, FaTrash, FaArrowDown, FaExclamationCircle, FaReply,
} from 'react-icons/fa';
import StickerPack from '@/Components/Stickers/StickerPack';
import MessageBubble from './MessageBubble';
import DirectCallButton from './DirectCallButton';
import { BubbleSkeleton, Spinner } from './Skeletons';
import { EMOJI_CATEGORIES } from './emoji';
import {
  fetchInboxConversation, postInboxMessage, markInboxRead, inboxChannelName, contactAvatar,
  setInboxSeen, formatDayLabel, isSameDay, isMine, resolveMedia,
} from '@/lib/inbox';

const MAX_UPLOAD = 20 * 1024 * 1024;
const fmtTimer = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/**
 * Conversation privée façon WhatsApp — utilisée à l'identique par le web et le mobile.
 *  - chargement progressif : on remonte l'historique page par page (curseur `before`) ;
 *  - envoi optimiste (texte, photo, vidéo, message vocal, stickers, emojis, réponses) ;
 *  - temps réel : nouveaux messages, « écrit… », accusés de lecture ✓✓ ;
 *  - appel direct d'un tap vers le contact.
 */
export default function InboxThread({ contactId, variant = 'web', onBack }) {
  const { auth } = usePage().props;
  const me = auth?.user || auth;
  const mobile = variant === 'mobile';

  const [contact, setContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [panel, setPanel] = useState(null); // 'emoji' | 'sticker' | null
  const [emojiTab, setEmojiTab] = useState(Object.keys(EMOJI_CATEGORIES)[0]);
  const [attach, setAttach] = useState(null); // { file, url, type }
  const [lightbox, setLightbox] = useState(null);
  const [typing, setTyping] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [newCount, setNewCount] = useState(0);
  const [atBottom, setAtBottom] = useState(true);

  const scrollRef = useRef(null);
  const topRef = useRef(null);
  const textareaRef = useRef(null);
  const fileRef = useRef(null);
  const channelRef = useRef(null);
  const restoreRef = useRef(null);
  const atBottomRef = useRef(true);
  const typingTimer = useRef(null);
  const lastWhisper = useRef(0);
  const recRef = useRef({ rec: null, chunks: [], timer: null, cancelled: false });

  const goBack = () => (onBack ? onBack() : router.visit('/discussions?tab=inbox'));

  // ─── Défilement ───
  const scrollToBottom = useCallback((smooth = false) => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    });
  }, []);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
    atBottomRef.current = near;
    setAtBottom(near);
    if (near) setNewCount(0);
  }, []);

  // Après avoir préfixé de l'historique : on garde l'utilisateur exactement où il lisait
  useLayoutEffect(() => {
    const r = restoreRef.current;
    const el = scrollRef.current;
    if (r && el) {
      el.scrollTop = r.top + (el.scrollHeight - r.height);
      restoreRef.current = null;
    }
  }, [messages]);

  // ─── Chargement initial ───
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchInboxConversation(contactId);
      setContact(data.contact);
      setMessages(data.messages);
      setHasMore(data.has_more);
      setInboxSeen(contactId);
      scrollToBottom();
    } catch (err) {
      setError(err.message || "Impossible d'ouvrir cette conversation.");
    } finally {
      setLoading(false);
    }
  }, [contactId, scrollToBottom]);
  useEffect(() => { load(); }, [load]);

  // ─── Chargement progressif de l'historique (sentinelle en haut du fil) ───
  const loadOlder = useCallback(async () => {
    if (loadingOlder || !hasMore) return;
    const oldest = messages.find((m) => typeof m.id === 'number');
    if (!oldest) return;
    const el = scrollRef.current;
    setLoadingOlder(true);
    try {
      const data = await fetchInboxConversation(contactId, { before: oldest.id });
      if (el) restoreRef.current = { height: el.scrollHeight, top: el.scrollTop };
      setMessages((prev) => {
        const known = new Set(prev.map((m) => String(m.id)));
        return [...data.messages.filter((m) => !known.has(String(m.id))), ...prev];
      });
      setHasMore(data.has_more);
    } catch (err) {
      setError(err.message || "Impossible de charger les messages précédents.");
    } finally {
      setLoadingOlder(false);
    }
  }, [contactId, hasMore, loadingOlder, messages]);

  useEffect(() => {
    const node = topRef.current;
    const root = scrollRef.current;
    if (!node || !root || loading) return undefined;
    const io = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) loadOlder(); }, { root, rootMargin: '240px 0px 0px 0px' });
    io.observe(node);
    return () => io.disconnect();
  }, [loadOlder, loading, hasMore]);

  // ─── Temps réel ───
  useEffect(() => {
    if (!window.Echo || !contactId || !me?.id) return undefined;
    const name = inboxChannelName(me.id, contactId);
    const channel = window.Echo.private(name);
    channelRef.current = channel;

    channel.listen('.inbox.message', (payload) => {
      const incoming = payload?.message;
      if (!incoming || Number(incoming.sender_id) === Number(me.id)) return; // mes messages : réponse HTTP
      setMessages((prev) => (prev.some((m) => String(m.id) === String(incoming.id)) ? prev : [...prev, { ...incoming, is_me: false }]));
      setTyping(false);
      setInboxSeen(contactId);
      if (atBottomRef.current) { scrollToBottom(true); markInboxRead(contactId); } else setNewCount((n) => n + 1);
    });
    channel.listen('.inbox.read', (e) => {
      const ids = new Set((e?.message_ids || []).map(String));
      setMessages((prev) => prev.map((m) => (ids.has(String(m.id)) ? { ...m, read_at: e.read_at } : m)));
    });
    channel.listenForWhisper('typing', () => {
      setTyping(true);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(false), 3000);
    });

    return () => { clearTimeout(typingTimer.current); window.Echo.leave(name); channelRef.current = null; };
  }, [contactId, me?.id, scrollToBottom]);

  // Onglet de nouveau visible → on marque comme lu
  useEffect(() => {
    const onVisible = () => { if (!document.hidden) markInboxRead(contactId); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [contactId]);

  // ─── Envoi (optimiste) ───
  const send = useCallback(async (opts, retryId = null) => {
    const { content = '', type = 'text', file = null, stickerId = null, sticker = null, replyToId = null, replySnap = null } = opts;
    const tempId = retryId || `temp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const blobUrl = file ? URL.createObjectURL(file) : null;

    const optimistic = {
      id: tempId, _pending: true, _failed: false, _opts: opts, is_me: true,
      sender_id: me.id, receiver_id: contactId,
      type: sticker ? 'sticker' : type, content,
      attachment_path: sticker ? sticker.image_path : blobUrl,
      attachment_kind: sticker ? (sticker.type === 'video' ? 'video' : 'image') : null,
      reply_to: replySnap, created_at: new Date().toISOString(), read_at: null,
    };

    setMessages((prev) => (retryId ? prev.map((m) => (m.id === retryId ? optimistic : m)) : [...prev, optimistic]));
    setError('');
    scrollToBottom(true);

    try {
      const saved = await postInboxMessage(contactId, { content, type, file, stickerId, replyToId });
      setMessages((prev) => {
        if (!saved) return prev.map((m) => (m.id === tempId ? { ...m, _pending: false } : m));
        if (prev.some((m) => String(m.id) === String(saved.id))) return prev.filter((m) => m.id !== tempId);
        return prev.map((m) => (m.id === tempId ? { ...saved, is_me: true } : m));
      });
    } catch (err) {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, _pending: false, _failed: true } : m)));
      setError(err.message || "Votre message n'a pas pu être envoyé.");
    }
  }, [contactId, me?.id, scrollToBottom]);

  const replySnapshot = () => (replyTo ? { id: replyTo.id, preview: replyTo.preview || replyTo.content || '…', is_me: !!replyTo.is_me } : null);
  const clearComposer = () => {
    setDraft(''); setReplyTo(null); setPanel(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const submit = () => {
    const text = draft.trim();
    if (attach) {
      send({ content: text, type: attach.type, file: attach.file, replyToId: replyTo?.id, replySnap: replySnapshot() });
      URL.revokeObjectURL(attach.url);
      setAttach(null); clearComposer();
      return;
    }
    if (!text) return;
    send({ content: text, replyToId: replyTo?.id, replySnap: replySnapshot() });
    clearComposer();
  };

  const sendSticker = (sticker) => {
    send({ stickerId: sticker.id, sticker, replyToId: replyTo?.id, replySnap: replySnapshot() });
    setReplyTo(null); setPanel(null);
  };

  const retry = (m) => m._opts && send(m._opts, m.id);

  // ─── Pièces jointes ───
  const onPickFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) { setError('Seules les photos et les vidéos sont acceptées.'); return; }
    if (file.size > MAX_UPLOAD) { setError('Fichier trop lourd (20 Mo maximum).'); return; }
    setAttach({ file, url: URL.createObjectURL(file), type: file.type.startsWith('video/') ? 'video' : 'image' });
    setPanel(null);
  };

  // ─── Message vocal ───
  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { setError("L'enregistrement audio n'est pas pris en charge ici."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((t) => MediaRecorder.isTypeSupported?.(t));
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const r = recRef.current;
      r.rec = rec; r.chunks = []; r.cancelled = false;
      rec.ondataavailable = (ev) => { if (ev.data.size) r.chunks.push(ev.data); };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(r.timer);
        setRecording(false);
        if (r.cancelled || !r.chunks.length) return;
        const type = rec.mimeType || 'audio/webm';
        const ext = type.includes('mp4') ? 'm4a' : 'webm';
        const file = new File([new Blob(r.chunks, { type })], `voice.${ext}`, { type });
        send({ type: 'audio', file, replyToId: replyTo?.id, replySnap: replySnapshot() });
        setReplyTo(null);
      };
      rec.start();
      setRecording(true); setSeconds(0); setPanel(null);
      r.timer = setInterval(() => setSeconds((s) => { if (s >= 179) { rec.stop(); return s; } return s + 1; }), 1000);
    } catch {
      setError("Impossible d'accéder au micro. Autorisez-le dans votre navigateur.");
    }
  };
  const stopRecording = (cancel = false) => {
    const r = recRef.current;
    r.cancelled = cancel;
    if (r.rec && r.rec.state !== 'inactive') r.rec.stop();
  };
  useEffect(() => () => { const r = recRef.current; r.cancelled = true; clearInterval(r.timer); if (r.rec?.state === 'recording') r.rec.stop(); }, []);

  // ─── Saisie ───
  const onChange = (e) => {
    setDraft(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 130)}px`;
    const now = Date.now();
    if (channelRef.current && now - lastWhisper.current > 2500) {
      lastWhisper.current = now;
      try { channelRef.current.whisper('typing', { id: me.id }); } catch { /* canal non prêt */ }
    }
  };
  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !mobile) { e.preventDefault(); submit(); }
  };

  const jumpTo = useCallback((id) => {
    const el = document.getElementById(`msg-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('ring-2', 'ring-blue-400', 'rounded-2xl');
    setTimeout(() => el.classList.remove('ring-2', 'ring-blue-400', 'rounded-2xl'), 1200);
  }, []);

  // ─── Messages groupés par jour ───
  const rows = useMemo(() => {
    const out = [];
    let last = null;
    messages.forEach((m) => {
      if (!last || !isSameDay(last, m.created_at)) {
        last = m.created_at;
        out.push({ k: `d-${m.created_at}`, day: formatDayLabel(m.created_at) });
      }
      out.push({ k: m.id, m });
    });
    return out;
  }, [messages]);

  const hasText = draft.trim().length > 0 || !!attach;

  const root = mobile
    ? 'flex h-full flex-col bg-slate-100 dark:bg-slate-950'
    : 'fixed bottom-0 left-0 right-0 top-0 z-50 flex flex-col bg-slate-100 dark:bg-slate-950 lg:left-64';

  return (
    <div className={root}>
      {/* ── En-tête ── */}
      <header className="flex flex-shrink-0 items-center gap-2 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-2 py-2.5 text-white shadow-md sm:px-4" style={{ paddingTop: mobile ? 'max(0.625rem, env(safe-area-inset-top))' : undefined }}>
        <button type="button" onClick={goBack} aria-label="Retour" className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full hover:bg-white/15 active:scale-90">
          <FaArrowLeft className="h-4 w-4" />
        </button>
        <img src={contactAvatar(contact)} alt="" className="h-10 w-10 flex-shrink-0 rounded-full border-2 border-white/30 object-cover" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[15px] font-bold leading-tight">{contact?.name || 'Conversation'}</h1>
          <p className="flex items-center gap-1.5 truncate text-xs text-blue-100">
            {typing ? <span className="font-semibold text-emerald-300">écrit…</span> : <><FaLock className="h-2.5 w-2.5" /> Messagerie privée chiffrée</>}
          </p>
        </div>
        {contact && <DirectCallButton contact={contact} variant="dark" onError={setError} />}
      </header>

      {/* ── Fil ── */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="relative flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-6"
        style={{ backgroundImage: 'radial-gradient(rgba(100,116,139,.12) 1px, transparent 1px)', backgroundSize: '18px 18px' }}
      >
        {loading ? (
          <div className="flex h-full items-center justify-center"><Spinner className="h-9 w-9 border-4" /></div>
        ) : error && messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <FaExclamationCircle className="text-3xl text-red-400" />
            <p className="text-sm text-slate-600 dark:text-slate-300">{error}</p>
            <div className="flex gap-2">
              <button type="button" onClick={load} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Réessayer</button>
              <button type="button" onClick={goBack} className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">Retour</button>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-1.5">
            <div ref={topRef} className="h-px" />
            {loadingOlder && <BubbleSkeleton />}
            {!hasMore && messages.length > 0 && (
              <p className="py-2 text-center text-[11px] text-slate-400"><FaLock className="mr-1 inline h-2.5 w-2.5" />Les messages de cette conversation sont chiffrés.</p>
            )}
            {messages.length === 0 && (
              <div className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                Aucun message. Dites bonjour à {contact?.name?.split(' ')[0] || 'ce contact'} 👋
              </div>
            )}
            {rows.map((row) => row.day ? (
              <div key={row.k} className="flex justify-center py-2">
                <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-500 shadow-sm dark:bg-slate-800 dark:text-slate-400">{row.day}</span>
              </div>
            ) : (
              <MessageBubble key={row.k} m={row.m} mine={isMine(row.m, me?.id)} compact={mobile}
                onReply={setReplyTo} onRetry={retry} onOpenMedia={setLightbox} onJump={jumpTo} />
            ))}
          </div>
        )}

        {!atBottom && !loading && (
          <button type="button" onClick={() => { scrollToBottom(true); markInboxRead(contactId); }}
            className="sticky bottom-2 ml-auto flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-600 shadow-lg ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700" aria-label="Aller au dernier message">
            <FaArrowDown />
            {newCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-emerald-500 px-1 text-[11px] font-bold text-white">{newCount}</span>}
          </button>
        )}
      </div>

      {/* ── Zone de saisie ── */}
      <footer className="flex-shrink-0 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" style={{ paddingBottom: mobile ? 'env(safe-area-inset-bottom)' : undefined }}>
        {error && messages.length > 0 && (
          <div className="mx-3 mt-2 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            <FaExclamationCircle className="flex-shrink-0" /><span className="flex-1">{error}</span>
            <button type="button" onClick={() => setError('')} aria-label="Fermer"><FaTimes /></button>
          </div>
        )}

        {replyTo && (
          <div className="mx-3 mt-2 flex items-center gap-3 rounded-xl border-l-4 border-blue-500 bg-slate-100 px-3 py-2 dark:bg-slate-800">
            <FaReply className="flex-shrink-0 text-blue-500" />
            <div className="min-w-0 flex-1 text-xs">
              <p className="font-bold text-blue-600 dark:text-blue-300">{replyTo.is_me ? 'Vous' : contact?.name}</p>
              <p className="truncate text-slate-600 dark:text-slate-300">{replyTo.preview || replyTo.content}</p>
            </div>
            <button type="button" onClick={() => setReplyTo(null)} aria-label="Annuler la réponse" className="p-1 text-slate-400"><FaTimes /></button>
          </div>
        )}

        {attach && (
          <div className="mx-3 mt-2 flex items-center gap-3 rounded-xl bg-slate-100 p-2 dark:bg-slate-800">
            {attach.type === 'video'
              ? <video src={attach.url} className="h-16 w-16 rounded-lg object-cover" muted />
              : <img src={attach.url} alt="" className="h-16 w-16 rounded-lg object-cover" />}
            <p className="min-w-0 flex-1 truncate text-xs text-slate-600 dark:text-slate-300">{attach.file.name}<br /><span className="text-slate-400">Ajoutez une légende puis envoyez</span></p>
            <button type="button" onClick={() => { URL.revokeObjectURL(attach.url); setAttach(null); }} aria-label="Retirer" className="p-2 text-slate-400"><FaTimes /></button>
          </div>
        )}

        {panel && (
          <div className="mx-3 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
            <div className="flex border-b border-slate-100 dark:border-slate-700">
              {[['emoji', 'Emojis'], ['sticker', 'Stickers']].map(([k, l]) => (
                <button key={k} type="button" onClick={() => setPanel(k)}
                  className={`flex-1 py-2.5 text-sm font-semibold ${panel === k ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-300' : 'text-slate-500'}`}>{l}</button>
              ))}
            </div>
            <div className="max-h-60 overflow-y-auto p-2">
              {panel === 'emoji' ? (
                <>
                  <div className="mb-1 flex gap-1 overflow-x-auto">
                    {Object.keys(EMOJI_CATEGORIES).map((c) => (
                      <button key={c} type="button" onClick={() => setEmojiTab(c)} className={`h-9 w-9 flex-shrink-0 rounded-lg text-lg ${emojiTab === c ? 'bg-blue-100 dark:bg-blue-500/20' : ''}`}>{c}</button>
                    ))}
                  </div>
                  <div className="grid grid-cols-8 gap-0.5 sm:grid-cols-10">
                    {EMOJI_CATEGORIES[emojiTab].map((e) => (
                      <button key={e} type="button" onClick={() => { setDraft((d) => d + e); textareaRef.current?.focus(); }} className="h-9 rounded-lg text-xl hover:bg-slate-100 active:scale-90 dark:hover:bg-slate-700">{e}</button>
                    ))}
                  </div>
                </>
              ) : (
                <StickerPack onSend={sendSticker} onError={setError} />
              )}
            </div>
          </div>
        )}

        {recording ? (
          <div className="flex items-center gap-3 px-3 py-3">
            <button type="button" onClick={() => stopRecording(true)} aria-label="Annuler l'enregistrement" className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-red-500 dark:bg-slate-800"><FaTrash /></button>
            <div className="flex flex-1 items-center gap-2.5 rounded-full bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 dark:bg-red-950/40">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" /> {fmtTimer(seconds)} <span className="text-xs font-normal text-red-400">Enregistrement…</span>
            </div>
            <button type="button" onClick={() => stopRecording(false)} aria-label="Envoyer le message vocal" className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-md"><FaPaperPlane className="ml-0.5" /></button>
          </div>
        ) : (
          <div className="flex items-end gap-1.5 px-2 py-2.5 sm:px-3">
            <button type="button" onClick={() => setPanel((p) => (p ? null : 'emoji'))} aria-label="Emojis et stickers"
              className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-xl ${panel ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}><FaSmile /></button>
            <button type="button" onClick={() => fileRef.current?.click()} aria-label="Joindre une photo ou une vidéo"
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><FaPaperclip /></button>
            <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={onPickFile} />
            <textarea
              ref={textareaRef} value={draft} onChange={onChange} onKeyDown={onKeyDown} rows={1} maxLength={5000}
              disabled={loading || (!contact && !!error)} placeholder={attach ? 'Ajouter une légende…' : 'Écrire un message'}
              className="max-h-[130px] min-h-[44px] flex-1 resize-none rounded-3xl border-0 bg-slate-100 px-4 py-3 text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:bg-slate-800 dark:text-slate-100"
            />
            {hasText ? (
              <button type="button" onClick={submit} aria-label="Envoyer" className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-md transition active:scale-90"><FaPaperPlane className="ml-0.5" /></button>
            ) : (
              <button type="button" onClick={startRecording} aria-label="Enregistrer un message vocal" className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-md transition active:scale-90"><FaMicrophone /></button>
            )}
          </div>
        )}
      </footer>

      {/* ── Visionneuse ── */}
      {lightbox && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(null)} role="dialog" aria-modal="true">
          <button type="button" className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white" aria-label="Fermer"><FaTimes /></button>
          <img src={lightbox.src} alt="" className="max-h-full max-w-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
