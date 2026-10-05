import React, { useCallback, useEffect, useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
  FaPaperPlane, FaPlus, FaHistory, FaTimes, FaTrash, FaCheckCircle, FaExternalLinkAlt, FaExclamationTriangle, FaRedo, FaArrowLeft, FaMicrophone, FaStop, FaSpinner,
} from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi2';
import Markdown from './markdown';

const meta = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
const refreshCsrf = async () => {
  try {
    const r = await fetch('/csrf-token', { credentials: 'include' });
    const { token } = await r.json();
    document.querySelector('meta[name="csrf-token"]')?.setAttribute('content', token);
    return token;
  } catch { return meta(); }
};
const api = async (url, { method = 'GET', body } = {}, retry = true) => {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const res = await fetch(url, {
    method, credentials: 'same-origin',
    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': meta(), ...(body && !isFormData ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });
  if (res.status === 419 && retry) { await refreshCsrf(); return api(url, { method, body }, false); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const e = new Error(data.message || data.errors?.message?.[0] || 'Une erreur est survenue.'); e.status = res.status; throw e; }
  return data;
};

const suggestionsFor = (path) => {
  if (/^\/tasks\/\d+/.test(path)) return ['Résume cette tâche', 'Où en est cette tâche ?', 'Ajoute un commentaire sur cette tâche', 'Quelles sont mes autres tâches urgentes ?'];
  if (/^\/projects\/\d+/.test(path)) return ['Fais le point sur ce projet', 'Quelles tâches sont en retard ici ?', 'Crée une tâche dans ce projet', 'Qui sont les membres ?'];
  return ['Que dois-je faire aujourd’hui ?', 'Quelles sont mes tâches en retard ?', 'Liste mes projets', 'Comment fonctionnent les rémunérations ?'];
};

function ActionChips({ actions = [], onNavigate, onConfirm, onCancel, busy }) {
  if (!actions.length) return null;
  return (
    <div className="mt-2 flex flex-col gap-2">
      {actions.map((a, i) => {
        if (a.type === 'confirm') {
          const done = a.status && a.status !== 'pending';
          return (
            <div key={i} className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-500/30 dark:bg-amber-500/10">
              <p className="flex items-start gap-2 font-medium text-amber-900 dark:text-amber-200"><FaExclamationTriangle className="mt-0.5 flex-shrink-0" />{a.label}</p>
              {done ? (
                <p className="mt-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
                  {a.status === 'confirmed' ? 'Confirmé' : a.status === 'cancelled' ? 'Annulé' : 'Expiré'}
                </p>
              ) : (
                <div className="mt-2.5 flex gap-2">
                  <button type="button" disabled={busy === a.pending_id} onClick={() => onConfirm(a)} className="rounded-lg bg-red-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-60">Confirmer</button>
                  <button type="button" disabled={busy === a.pending_id} onClick={() => onCancel(a)} className="rounded-lg border border-amber-300 bg-white px-3.5 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-60 dark:bg-transparent dark:text-amber-200">Annuler</button>
                </div>
              )}
            </div>
          );
        }
        const done = a.type !== 'link';
        return (
          <button key={i} type="button" onClick={() => onNavigate(a.url)}
            className="flex items-center gap-2.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-left text-sm font-medium text-blue-800 transition hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">
            {done ? <FaCheckCircle className="flex-shrink-0 text-emerald-500" /> : <FaExternalLinkAlt className="flex-shrink-0 text-xs" />}
            <span className="min-w-0 flex-1 truncate">
              {a.type === 'task_created' && 'Tâche créée : '}{a.type === 'task_updated' && 'Tâche mise à jour : '}{a.type === 'comment_added' && 'Commentaire ajouté sur : '}{a.type === 'member_added' && 'Équipe mise à jour : '}{a.label}
            </span>
            <FaExternalLinkAlt className="flex-shrink-0 text-[10px] opacity-60" />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Interface de l'assistant. `variant="drawer"` (panneau latéral) ou `"page"` (plein écran).
 * L'état (conversation en cours) reste monté tant que le panneau n'est pas détruit.
 */
export default function AssistantPanel({ variant = 'page', onClose, active = true }) {
  const [view, setView] = useState('chat'); // chat | history
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const { ai } = usePage().props;
  const voiceAvailable = ai?.voice !== false;
  const fromVoice = useRef(false);
  const [transcribing, setTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceError, setVoiceError] = useState('');
  const [voiceStatus, setVoiceStatus] = useState('');
  const [path, setPath] = useState(typeof window !== 'undefined' ? window.location.pathname : '/');
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const lastSent = useRef('');
  const recorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const recordingElapsedRef = useRef(0);
  const discardRecordingRef = useRef(false);

  useEffect(() => { if (active) { setPath(window.location.pathname); setTimeout(() => inputRef.current?.focus(), 150); } }, [active]);
  useEffect(() => { const el = listRef.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }); }, [messages, loading, view]);
  useEffect(() => () => {
    discardRecordingRef.current = true;
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    clearInterval(recordingTimerRef.current);
  }, []);

  const go = useCallback((url) => { onClose?.(); router.visit(url); }, [onClose]);

  const send = useCallback(async (text) => {
    const msg = (text ?? draft).trim();
    if (!msg || loading) return;
    lastSent.current = msg;
    const viaVoice = fromVoice.current;
    fromVoice.current = false;
    setError('');
    setDraft('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setMessages((m) => [...m, { id: `u${Date.now()}`, role: 'user', content: msg }]);
    setLoading(true);
    try {
      const data = await api('/assistant/chat', { method: 'POST', body: { message: msg, conversation_id: conversationId, page: window.location.pathname, voice: viaVoice } });
      setConversationId(data.conversation_id);
      setRemaining(data.remaining);
      setMessages((m) => [...m, data.message]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [draft, loading, conversationId]);

  const retry = () => { setMessages((m) => m.slice(0, -1)); send(lastSent.current); };

  const newChat = () => { setConversationId(null); setMessages([]); setError(''); setView('chat'); setTimeout(() => inputRef.current?.focus(), 50); };

  const openHistory = async () => {
    setView('history');
    try { const d = await api('/assistant/conversations'); setHistory(d.conversations || []); setRemaining(d.remaining); } catch (e) { setError(e.message); }
  };
  const openConversation = async (id) => {
    try {
      const d = await api(`/assistant/conversations/${id}`);
      setConversationId(id); setMessages(d.messages || []); setView('chat'); setError('');
    } catch (e) { setError(e.message); }
  };
  const removeConversation = async (id) => {
    if (!window.confirm('Supprimer cette conversation ?')) return;
    try { await api(`/assistant/conversations/${id}`, { method: 'DELETE' }); setHistory((h) => h.filter((c) => c.id !== id)); if (id === conversationId) newChat(); } catch (e) { setError(e.message); }
  };

  const decide = async (action, kind) => {
    setBusy(action.pending_id);
    try {
      const d = await api(`/assistant/actions/${action.pending_id}/${kind}`, { method: 'POST' });
      const status = d.status || (kind === 'confirm' ? 'confirmed' : 'cancelled');
      setMessages((ms) => [
        ...ms.map((m) => ({ ...m, actions: (m.actions || []).map((a) => (a.pending_id === action.pending_id ? { ...a, status } : a)) })),
        ...(kind === 'confirm' ? [{ id: `r${Date.now()}`, role: 'assistant', content: d.message, actions: [] }] : []),
      ]);
      if (kind === 'confirm' && d.ok) router.reload({ preserveScroll: true });
    } catch (e) {
      setMessages((ms) => ms.map((m) => ({ ...m, actions: (m.actions || []).map((a) => (a.pending_id === action.pending_id ? { ...a, status: e.status === 410 ? 'expired' : a.status } : a)) })));
      setError(e.message);
    } finally { setBusy(null); }
  };

  const onKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey && variant !== 'page-mobile') { e.preventDefault(); send(); } };
  const onInput = (e) => { setDraft(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`; };
  const transcribeAudio = async (blob) => {
    if (!blob.size) { setVoiceError('Aucun son n’a été enregistré. Réessayez.'); return; }
    const extension = blob.type.includes('ogg') ? 'ogg' : blob.type.includes('mp4') ? 'mp4' : 'webm';
    const formData = new FormData();
    formData.append('audio', blob, `message-vocal.${extension}`);
    setTranscribing(true);
    setVoiceError('');
    setVoiceStatus('Transcription en cours…');
    try {
      const data = await api('/assistant/transcribe', { method: 'POST', body: formData });
      fromVoice.current = true;
      setDraft((current) => [current.trim(), data.text].filter(Boolean).join(' '));
      setVoiceStatus(`Transcription terminée (${data.provider}). Vérifiez le texte avant l’envoi.`);
      inputRef.current?.focus();
    } catch (e) {
      setVoiceStatus('');
      setVoiceError(e.message || 'La transcription a échoué.');
    } finally {
      setTranscribing(false);
    }
  };

  const toggleVoiceRecording = async () => {
    setVoiceError('');
    setVoiceStatus('');
    if (isRecording) {
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setVoiceError('L’enregistrement audio n’est pas pris en charge par cet appareil.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];
      discardRecordingRef.current = false;
      const mimeType = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4'].find((type) => MediaRecorder.isTypeSupported?.(type));
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data?.size) audioChunksRef.current.push(event.data); };
      recorder.onerror = () => setVoiceError('Une erreur est survenue pendant l’enregistrement.');
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        if (!discardRecordingRef.current) {
          const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
          transcribeAudio(blob);
        }
      };
      recorder.start();
      recordingElapsedRef.current = 0;
      setRecordingSeconds(0);
      setIsRecording(true);
      recordingTimerRef.current = setInterval(() => {
        const elapsed = recordingElapsedRef.current + 1;
        recordingElapsedRef.current = elapsed;
        setRecordingSeconds(elapsed);
        if (elapsed >= 120) {
          if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
          setIsRecording(false);
          clearInterval(recordingTimerRef.current);
        }
      }, 1000);
    } catch (e) {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      setVoiceError(e.name === 'NotAllowedError' ? 'Autorisez l’accès au microphone pour enregistrer votre message.' : 'Impossible de démarrer le microphone. Vérifiez ses autorisations.');
    }
  };

  const empty = messages.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col bg-white dark:bg-slate-900">
      {/* En-tête */}
      <header className="flex flex-shrink-0 items-center gap-3 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-4 py-3 text-white" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        {view === 'history'
          ? <button type="button" onClick={() => setView('chat')} aria-label="Retour" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/15"><FaArrowLeft /></button>
          : <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20"><HiSparkles className="text-lg" /></span>}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[15px] font-bold leading-tight">{view === 'history' ? 'Mes conversations' : 'Assistant ProJA'}</h2>
          <p className="truncate text-xs text-blue-100">{view === 'history' ? 'Reprenez une discussion' : 'Pose une question ou demande une action'}</p>
        </div>
        {view === 'chat' && (
          <>
            <button type="button" onClick={openHistory} aria-label="Historique" title="Historique" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/15"><FaHistory className="text-sm" /></button>
            <button type="button" onClick={newChat} aria-label="Nouvelle conversation" title="Nouvelle conversation" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/15"><FaPlus className="text-sm" /></button>
          </>
        )}
        {onClose && <button type="button" onClick={onClose} aria-label="Fermer" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/15"><FaTimes /></button>}
      </header>

      {view === 'history' ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {history.length === 0 ? (
            <p className="px-6 py-16 text-center text-sm text-slate-500">Aucune conversation pour le moment.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {history.map((c) => (
                <li key={c.id} className="flex items-center gap-2 px-4 py-3">
                  <button type="button" onClick={() => openConversation(c.id)} className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{c.title || 'Conversation'}</p>
                    <p className="text-xs text-slate-400">{new Date(c.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </button>
                  <button type="button" onClick={() => removeConversation(c.id)} aria-label="Supprimer" className="rounded-lg p-2.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"><FaTrash className="text-sm" /></button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <>
          <div ref={listRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4">
            {empty && (
              <div className="py-6 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl text-white shadow-lg"><HiSparkles /></span>
                <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">Comment puis-je t’aider ?</h3>
                <p className="mx-auto mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">Je peux consulter tes projets et tâches, en créer, les modifier, commenter, et t’expliquer ProJA.</p>
                <div className="mt-5 flex flex-col gap-2">
                  {suggestionsFor(path).map((s) => (
                    <button key={s} type="button" onClick={() => send(s)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">{s}</button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => m.role === 'user' ? (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-gradient-to-br from-blue-600 to-indigo-600 px-4 py-2.5 text-[15px] text-white shadow-sm">{m.content}</div>
              </div>
            ) : (
              <div key={m.id} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white"><HiSparkles className="text-sm" /></span>
                <div className="min-w-0 max-w-[88%]">
                  <div className="rounded-2xl rounded-tl-md bg-slate-100 px-4 py-2.5 text-[15px] leading-relaxed text-slate-800 dark:bg-slate-800 dark:text-slate-100"><Markdown text={m.content} onLink={go} /></div>
                  <ActionChips actions={m.actions} onNavigate={go} onConfirm={(a) => decide(a, 'confirm')} onCancel={(a) => decide(a, 'cancel')} busy={busy} />
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white"><HiSparkles className="animate-pulse text-sm" /></span>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md bg-slate-100 px-4 py-3 dark:bg-slate-800" aria-live="polite" aria-label="L'assistant réfléchit">
                  {[0, 150, 300].map((d) => <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${d}ms` }} />)}
                </div>
              </div>
            )}

            {error && (
              <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                <FaExclamationTriangle className="mt-0.5 flex-shrink-0" />
                <span className="flex-1">{error}</span>
                {lastSent.current && !loading && messages[messages.length - 1]?.role === 'user' && (
                  <button type="button" onClick={retry} className="flex items-center gap-1.5 font-semibold underline"><FaRedo className="text-xs" />Réessayer</button>
                )}
              </div>
            )}
          </div>

          <footer className="flex-shrink-0 border-t border-slate-200 bg-white px-3 pb-3 pt-2.5 dark:border-slate-800 dark:bg-slate-900" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
            <div className="flex items-end gap-2">
              {voiceAvailable && (
                <button type="button" onClick={toggleVoiceRecording} disabled={loading || transcribing} aria-label={isRecording ? 'Arrêter et transcrire le message' : 'Enregistrer un message vocal'} title={isRecording ? 'Arrêter et transcrire' : 'Enregistrer un message vocal'}
                  className={`flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-full transition disabled:opacity-40 ${isRecording ? 'animate-pulse bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                  {transcribing ? <FaSpinner className="animate-spin" /> : isRecording ? <FaStop /> : <FaMicrophone />}
                </button>
              )}
              <textarea
                ref={inputRef} value={draft} onChange={onInput} onKeyDown={onKeyDown} rows={1} maxLength={2000} disabled={loading || transcribing || isRecording}
                placeholder="Écris ton message…" aria-label="Message pour l'assistant"
                className="max-h-[140px] min-h-[46px] flex-1 resize-none rounded-2xl border-0 bg-slate-100 px-4 py-3 text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:bg-slate-800 dark:text-slate-100"
              />
              <button type="button" onClick={() => send()} disabled={!draft.trim() || loading || transcribing || isRecording} aria-label="Envoyer"
                className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-md transition active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"><FaPaperPlane className="ml-0.5" /></button>
            </div>
            {voiceError && <p role="alert" className="mt-1 text-center text-xs text-amber-700 dark:text-amber-300">{voiceError}</p>}
            {isRecording && <p aria-live="polite" className="mt-1 text-center text-xs font-medium text-red-600">Enregistrement… {Math.floor(recordingSeconds / 60)}:{String(recordingSeconds % 60).padStart(2, '0')} / 2:00 — cliquez pour transcrire</p>}
            {transcribing && <p aria-live="polite" className="mt-1 text-center text-xs text-blue-600 dark:text-blue-300">L’audio est envoyé au fournisseur de transcription configuré…</p>}
            {voiceStatus && !transcribing && <p role="status" className="mt-1 text-center text-xs text-slate-500 dark:text-slate-400">{voiceStatus}</p>}
            <p className="mt-1.5 text-center text-[10px] text-slate-400">
              L’IA peut se tromper : vérifie les informations importantes.{remaining !== null && ` · ${remaining} message(s) restant(s) aujourd’hui`}
            </p>
          </footer>
        </>
      )}
    </div>
  );
}
