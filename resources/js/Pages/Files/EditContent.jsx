import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
  FaSave, FaSpinner, FaTimes, FaCode, FaUserEdit,
  FaAlignLeft, FaAlignCenter, FaAlignRight, FaAlignJustify,
  FaCheckCircle, FaHistory, FaUsers, FaLock, FaUnlock,
  FaEye, FaEdit, FaComments, FaShieldAlt, FaCrown,
  FaAngleRight, FaAngleLeft, FaAngleDown, FaUndo,
  FaTag, FaPlus, FaTrash, FaExclamationTriangle, FaClock,
  FaUserSlash, FaShare, FaChevronDown, FaSearch, FaCheck,
  FaUser, FaMinus, FaFileAlt, FaGoogleDrive, FaPen, FaCommentMedical,
} from 'react-icons/fa';
import { isPdfFile } from '@/utils/fileUtils';
import MenuBar from '@/Components/Editor/MenuBar';
import TrackingModal from '@/Components/Editor/TrackingModal';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Heading from '@tiptap/extension-heading';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Image } from '@tiptap/extension-image';
import FontFamily from '@tiptap/extension-font-family';
import FontSize from '@tiptap/extension-font-size';
import axios from 'axios';
import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';
import { Collaboration, isChangeOrigin } from '@tiptap/extension-collaboration';
import { CollaborationCaret } from '@tiptap/extension-collaboration-caret';
import { prosemirrorToYDoc } from '@tiptap/y-tiptap';
import { DOMParser as PMDOMParser } from '@tiptap/pm/model';
import { PusherYjsProvider, toBase64, fromBase64 } from '@/lib/yjsPusherProvider';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { TaskList, TaskItem } from '@tiptap/extension-list';
import { CommentMark } from '@/Components/Editor/extensions/comment-mark';
import { SearchHighlight } from '@/Components/Editor/extensions/search-highlight';
import { LineHeight } from '@/Components/Editor/extensions/line-height';
import DocMenus from '@/Components/Editor/DocMenus';
import FindReplaceBar from '@/Components/Editor/FindReplaceBar';
import CommentsPanel from '@/Components/Editor/CommentsPanel';
import DocCallButton from '@/Components/Editor/DocCallButton';
import { InsertionMark, DeletionMark, SuggestionMode, collectSuggestions, resolveSuggestion } from '@/Components/Editor/extensions/suggestion-mode';
import '@/Components/Editor/editorStyles';

/* ── Style des curseurs collaboratifs ── */
if (typeof document !== 'undefined' && !document.getElementById('collab-caret-style')) {
  const st = document.createElement('style');
  st.id = 'collab-caret-style';
  st.textContent = `
    .collaboration-carets__caret { position: relative; margin-left: -1px; margin-right: -1px; border-left: 1px solid #0d0d0d; border-right: 1px solid #0d0d0d; word-break: normal; pointer-events: none; }
    .collaboration-carets__label { position: absolute; top: -1.4em; left: -1px; font-size: 11px; font-weight: 600; line-height: normal; padding: 0.1rem 0.35rem; border-radius: 3px 3px 3px 0; color: #fff; white-space: nowrap; user-select: none; pointer-events: none; }
  `;
  document.head.appendChild(st);
}

const COLLAB_COLORS = ['#e11d48', '#2563eb', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#db2777', '#4d7c0f'];

/* ── Design tokens ───────────────────────────────────────────
   Canvas   #F4F5F7   Papier  #FFFFFF
   Encre    #1E2129   Encre atténuée #6B7280
   Accent   #3454D1   Accent doux (bg)  #EEF1FC
   Un seul accent porte toute l'interaction ; les couleurs de
   permission restent sémantiques (view/comment/edit/admin).
──────────────────────────────────────────────────────────── */

const PERMISSIONS = [
  { value: 'none',    label: 'Aucun accès', icon: <FaUserSlash />,  dot: 'bg-red-400',     color: 'text-red-600'       },
  { value: 'view',    label: 'Lecture',      icon: <FaEye />,        dot: 'bg-slate-400',   color: 'text-slate-600'   },
  { value: 'comment', label: 'Commentaire',  icon: <FaComments />,   dot: 'bg-sky-400',     color: 'text-sky-600'       },
  { value: 'edit',    label: 'Éditeur',      icon: <FaEdit />,       dot: 'bg-emerald-400', color: 'text-emerald-600'},
  { value: 'admin',   label: 'Admin',        icon: <FaShieldAlt />,  dot: 'bg-violet-400',  color: 'text-violet-600' },
];

const permLabel = (v) => PERMISSIONS.find(p => p.value === v)?.label ?? v;
const permColor = (v) => PERMISSIONS.find(p => p.value === v)?.color ?? '';
const permDot   = (v) => PERMISSIONS.find(p => p.value === v)?.dot ?? 'bg-slate-400';

const fmtDate = (d) => d
  ? new Date(d).toLocaleString('fr-FR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
  : '—';

const fmtDateShort = (d) => d
  ? new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short' })
  : '—';

/* ── Sub-components ──────────────────────────────────────── */

const Avatar = ({ user, size = 7, ring = true }) => {
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?';
  const colors = ['bg-[#3454D1]','bg-violet-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-pink-500'];
  const color  = colors[(user?.id ?? 0) % colors.length];
  const sz     = `w-${size} h-${size}`;
  return user?.profile_photo_url
    ? <img src={user.profile_photo_url} alt={user.name} className={`${sz} rounded-full object-cover ${ring ? 'ring-2 ring-white' : ''}`} />
    : <div className={`${sz} rounded-full ${color} flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0 ${ring ? 'ring-2 ring-white' : ''}`}>{initials}</div>;
};

const Toast = ({ message, type = 'success', onClose }) => (
  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg shadow-black/10 text-white text-sm
    ${type === 'success' ? 'bg-[#1E2129]' : 'bg-red-600'}`}
  >
    {type === 'success' ? <FaCheckCircle className="text-emerald-400" /> : <FaExclamationTriangle />}
    <span>{message}</span>
    <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 transition-opacity"><FaTimes className="text-xs" /></button>
  </div>
);

/* Section header used inside the side panels — a left accent bar
   replaces the uppercase/tracking-widest label pattern. */
const PanelHeader = ({ children, right }) => (
  <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100">
    <div className="flex items-center gap-2">
      <span className="w-1 h-4 rounded-full bg-[#3454D1]" />
      <span className="text-[13px] font-semibold text-[#1E2129]">{children}</span>
    </div>
    {right}
  </div>
);

/* ── VersionPanel ──────────────────────────────────────────── */
const VersionPanel = ({ fileId, recentVersions: initial = [], canRestore, onRestore }) => {
  const [versions, setVersions]   = useState(initial);
  const [loading, setLoading]     = useState(false);
  const [preview, setPreview]     = useState(null);
  const [restoring, setRestoring] = useState(null);
  const [page, setPage]           = useState(null);

  const loadVersions = useCallback(async (url = `/files/${fileId}/versions`) => {
    setLoading(true);
    try {
      const { data } = await axios.get(url);
      setVersions(data.data ?? data);
      setPage(data);
    } catch {/* ignore */}
    finally { setLoading(false); }
  }, [fileId]);

  useEffect(() => { loadVersions(); }, [loadVersions]);

  const loadPreview = async (versionId) => {
    try {
      const { data } = await axios.get(`/files/${fileId}/versions/${versionId}`);
      setPreview(data.version);
    } catch {/* ignore */}
  };

  const handleRestore = async (version) => {
    if (!window.confirm(`Restaurer la version ${version.version_number} ? Le document actuel sera sauvegardé automatiquement.`)) return;
    setRestoring(version.id);
    try {
      await axios.post(`/files/${fileId}/versions/${version.id}/restore`);
      onRestore?.();
      loadVersions();
    } catch { alert('Erreur lors de la restauration'); }
    finally { setRestoring(null); }
  };

  return (
    <div className="flex flex-col h-full">
      <PanelHeader right={loading && <FaSpinner className="animate-spin text-slate-300 text-xs" />}>
        Historique des versions
      </PanelHeader>

      {preview ? (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 bg-[#EEF1FC]">
            <button onClick={() => setPreview(null)} className="text-[#3454D1] hover:opacity-70 transition-opacity">
              <FaAngleLeft className="text-xs" />
            </button>
            <span className="text-xs font-semibold text-[#1E2129]">
              Aperçu — version {preview.version_number}
            </span>
            {canRestore && (
              <button
                onClick={() => handleRestore(preview)}
                disabled={!!restoring}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-[#3454D1] hover:bg-[#2c47b8] text-white text-[11px] font-medium rounded-lg transition-colors"
              >
                <FaUndo className="text-[9px]" />
                Restaurer
              </button>
            )}
          </div>
          <div
            className="flex-1 overflow-y-auto p-5 prose prose-sm max-w-none font-serif text-[#1E2129] text-[13px] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: preview.content }}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {versions.length === 0 && !loading && (
            <div className="text-center py-10 text-[13px] text-slate-400">Aucune version enregistrée</div>
          )}
          {versions.map((v, i) => (
            <div
              key={v.id}
              className="group px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start gap-2.5">
                <div className="flex-shrink-0 mt-0.5">
                  <Avatar user={v.user} size={6} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[12px] font-semibold text-[#1E2129]">
                      Version {v.version_number}
                    </span>
                    {v.label && (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-violet-50 text-violet-600">
                        {v.label}
                      </span>
                    )}
                    {i === 0 && (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-600">
                        Actuelle
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{v.user?.name} — {fmtDate(v.created_at)}</p>
                  {v.summary && (
                    <p className="text-[11px] text-slate-500 mt-1 italic">{v.summary}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2 pl-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => loadPreview(v.id)}
                  className="flex items-center gap-1 text-[11px] font-medium text-[#3454D1] hover:opacity-70 transition-opacity"
                >
                  <FaEye className="text-[9px]" /> Aperçu
                </button>
                {canRestore && i > 0 && (
                  <button
                    onClick={() => handleRestore(v)}
                    disabled={!!restoring}
                    className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-[#1E2129] transition-colors"
                  >
                    {restoring === v.id ? <FaSpinner className="animate-spin text-[9px]" /> : <FaUndo className="text-[9px]" />}
                    Restaurer
                  </button>
                )}
              </div>
            </div>
          ))}
          {page?.next_page_url && (
            <div className="p-3 text-center">
              <button
                onClick={() => loadVersions(page.next_page_url)}
                className="text-[12px] text-[#3454D1] hover:opacity-70 font-medium transition-opacity"
              >
                Charger plus
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ── AccessPanel ───────────────────────────────────────────── */
const AccessPanel = ({ fileId, collaborators: initial = [], canManage }) => {
  const [accesses, setAccesses] = useState(initial);
  const [search,   setSearch]   = useState('');
  const [results,  setResults]  = useState([]);
  const [searching,setSearching]= useState(false);
  const [adding,   setAdding]   = useState(false);
  const [toast,    setToast]    = useState(null);
  const searchTimer = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const searchUsers = useCallback(async (q) => {
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const { data } = await axios.get(`/api/users/search?q=${encodeURIComponent(q)}`);
      setResults(data.users ?? data);
    } catch { setResults([]); }
    finally { setSearching(false); }
  }, []);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => searchUsers(search), 350);
    return () => clearTimeout(searchTimer.current);
  }, [search, searchUsers]);

  const grantAccess = async (user, permission) => {
    setAdding(true);
    try {
      const { data } = await axios.post(`/files/${fileId}/access`, {
        user_id: user.id, permission,
      });
      setAccesses(prev => {
        const idx = prev.findIndex(a => a.id === user.id);
        const entry = { id: user.id, name: user.name, email: user.email, profile_photo_url: user.profile_photo_path, permission };
        return idx >= 0 ? prev.map((a, i) => i === idx ? entry : a) : [...prev, entry];
      });
      setSearch(''); setResults([]);
      showToast(`Accès « ${permLabel(permission)} » accordé à ${user.name}`);
    } catch { showToast('Erreur lors de la modification de l\'accès', 'error'); }
    finally { setAdding(false); }
  };

  const updatePermission = async (userId, permission) => {
    try {
      await axios.post(`/files/${fileId}/access`, { user_id: userId, permission });
      setAccesses(prev => prev.map(a => a.id === userId ? { ...a, permission } : a));
      if (permission === 'none') {
        setAccesses(prev => prev.filter(a => a.id !== userId));
      }
      showToast('Accès mis à jour');
    } catch { showToast('Erreur', 'error'); }
  };

  const revokeAccess = async (userId, name) => {
    if (!window.confirm(`Révoquer l'accès de ${name} ?`)) return;
    try {
      await axios.delete(`/files/${fileId}/access/${userId}`);
      setAccesses(prev => prev.filter(a => a.id !== userId));
      showToast(`Accès de ${name} révoqué`);
    } catch { showToast('Erreur', 'error'); }
  };

  return (
    <div className="flex flex-col h-full">
      <PanelHeader>Partagé avec</PanelHeader>

      {toast && (
        <div className="mx-3 mt-3">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium text-white
            ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
            {toast.type === 'success' ? <FaCheck className="text-[10px]" /> : <FaExclamationTriangle className="text-[10px]" />}
            {toast.msg}
          </div>
        </div>
      )}

      {canManage && (
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-[11px]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Ajouter une personne par nom ou e-mail"
              className="w-full pl-8 pr-3 py-2 text-[12px] bg-slate-50 border border-transparent rounded-lg text-[#1E2129] placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#3454D1]/40 focus:ring-2 focus:ring-[#3454D1]/15 transition"
            />
            {searching && <FaSpinner className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-300 text-[11px]" />}
          </div>

          {results.length > 0 && (
            <div className="mt-2 rounded-xl border border-slate-100 overflow-hidden shadow-sm shadow-black/5">
              {results.slice(0, 5).map(user => (
                <div key={user.id} className="flex items-center gap-2 px-3 py-2 bg-white border-b border-slate-50 last:border-0">
                  <Avatar user={user} size={6} ring={false} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-[#1E2129] truncate">{user.name}</p>
                    <p className="text-[10.5px] text-slate-400 truncate">{user.email}</p>
                  </div>
                  {['view','comment','edit'].map(p => (
                    <button
                      key={p}
                      onClick={() => grantAccess(user, p)}
                      disabled={adding}
                      title={permLabel(p)}
                      className={`p-1.5 rounded-md transition-colors text-[11px] ${permColor(p)} hover:bg-slate-100`}
                    >
                      {PERMISSIONS.find(x => x.value === p)?.icon}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-3 pb-1">
          <p className="text-[11px] text-slate-400">
            {accesses.length} personne{accesses.length !== 1 ? 's' : ''} avec accès
          </p>
        </div>
        {accesses.length === 0 && (
          <div className="text-center py-8 text-[12px] text-slate-400">
            Aucun collaborateur pour l'instant
          </div>
        )}
        {accesses.map(a => (
          <div key={a.id} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 transition-colors group">
            <Avatar user={a} size={7} ring={false} />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-[#1E2129] truncate">{a.name}</p>
              <p className="text-[10.5px] text-slate-400 truncate">{a.email}</p>
            </div>
            {canManage ? (
              <div className="flex items-center gap-1">
                <select
                  value={a.permission}
                  onChange={e => updatePermission(a.id, e.target.value)}
                  className="text-[11px] font-medium bg-slate-50 border-0 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#3454D1]/25 text-[#1E2129]"
                >
                  {PERMISSIONS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => revokeAccess(a.id, a.name)}
                  className="p-1.5 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                  title="Révoquer"
                >
                  <FaTrash className="text-[9px]" />
                </button>
              </div>
            ) : (
              <span className={`flex items-center gap-1.5 text-[11px] font-medium ${permColor(a.permission)}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${permDot(a.permission)}`} />
                {permLabel(a.permission)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── EditableTitle ─────────────────────────────────────────── */
const EditableTitle = ({ value, onRename, readOnly }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);
  const inputRef = useRef(null);

  useEffect(() => setDraft(value), [value]);
  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onRename?.(trimmed);
    else setDraft(value);
  };

  if (readOnly) {
    return <p className="text-[14px] font-semibold text-[#1E2129] truncate leading-tight">{value}</p>;
  }

  return editing ? (
    <input
      ref={inputRef}
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
      className="text-[14px] font-semibold text-[#1E2129] leading-tight bg-[#EEF1FC] rounded px-1.5 py-0.5 -mx-1.5 focus:outline-none focus:ring-2 focus:ring-[#3454D1]/30 min-w-0 w-full"
    />
  ) : (
    <button
      onClick={() => setEditing(true)}
      className="group flex items-center gap-1.5 min-w-0 text-left"
      title="Renommer le document"
    >
      <p className="text-[14px] font-semibold text-[#1E2129] truncate leading-tight">{value}</p>
      <FaPen className="text-[9px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </button>
  );
};

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
const EditContent = ({
  file, lastModifiedBy, auth, myPermission = 'edit', collaborators = [], recentVersions = [],
  canManageAccess = false, project: projectProp = null, task = null,
}) => {
  const { flash }     = usePage().props;
  const project = projectProp ?? file.project ?? null;
  const [isSaving,    setIsSaving]    = useState(false);
  const [isDirty,     setIsDirty]     = useState(false);
  const [lastSaved,   setLastSaved]   = useState(null);
  const [toasts,      setToasts]      = useState([]);
  const [sidePanel,   setSidePanel]   = useState(null); // 'history' | 'access' | null
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [summary,     setSummary]     = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [presenceUsers, setPresenceUsers] = useState([]); // connected users (requires Pusher)
  const [wordCount, setWordCount]     = useState(0);
  const [docTitle,  setDocTitle]      = useState(file.name);
  const saveRef = useRef();
  const [needsVersion, setNeedsVersion] = useState(false);   // modifications pas encore versionnées (bouton Enregistrer)
  const [autoSaveError, setAutoSaveError] = useState(false);
  const [suggesting, setSuggesting] = useState(false);       // mode Suggestion (suivi des modifications)
  const autosaveTriggerRef = useRef(null);
  const editVersionRef = useRef(0);

  // Écriture : uniquement admin / manager du projet / personne assignée (niveau « edit » ou « admin »)
  const isReadOnly = !['edit', 'admin'].includes(myPermission);
  const canRestore = myPermission === 'admin';

  /* ── Collaboration temps réel (Yjs + Pusher) ── */
  const ydoc      = useMemo(() => new Y.Doc(), [file.id]);
  const awareness = useMemo(() => new Awareness(ydoc), [ydoc]);
  const providerRef  = useRef(null);
  const reloadingRef = useRef(false);
  const commentClickRef = useRef(null);
  const [collabReady, setCollabReady] = useState(false);
  const collabUser = useMemo(() => ({
    id: auth.user.id,
    name: auth.user.name,
    color: COLLAB_COLORS[Math.abs(Number(auth.user.id) || 0) % COLLAB_COLORS.length],
  }), [auth.user.id, auth.user.name]);
  useEffect(() => () => awareness.destroy(), [awareness]);

  /* ── Toast helpers ── */
  const addToast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  /* ── Tiptap editor ── */
  const editor = useEditor({
    editable: !isReadOnly,
    extensions: [
      StarterKit.configure({ codeBlock: { HTMLAttributes: { class: 'code-block' } }, underline: false, link: false, heading: false, undoRedo: false }),
      Heading.configure({ levels: [1, 2, 3] }),
      TextStyle, FontFamily,
      FontSize.configure({ types: ['textStyle'] }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'], alignments: ['left','center','right','justify'], defaultAlignment: 'left' }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'editor-link' }, validate: h => /^https?:\/\//.test(h), autolink: true, linkOnPaste: true }),
      Highlight.configure({ multicolor: true, HTMLAttributes: { class: 'highlight' } }),
      Color,
      Image.configure({ inline: true, allowBase64: true }),
      Subscript, Superscript, LineHeight,
      Table.configure({ resizable: false }), TableRow, TableHeader, TableCell,
      TaskList, TaskItem.configure({ nested: true }),
      CommentMark, SearchHighlight,
      InsertionMark, DeletionMark, SuggestionMode,
      Collaboration.configure({ document: ydoc }),
      CollaborationCaret.configure({ provider: { awareness }, user: collabUser }),
    ],
    editorProps: {
      handleClick: (_view, _pos, event) => {
        const el = event.target?.closest?.('[data-comment-id]');
        if (el) commentClickRef.current?.(el.getAttribute('data-comment-id'));
        return false;
      },
    },
    onUpdate: ({ editor, transaction }) => {
      const text = editor.getText().trim();
      setWordCount(text ? text.split(/\s+/).length : 0);
      // Les changements venant des autres collaborateurs ou du chargement ne sont pas "non sauvegardés"
      if (isReadOnly || isChangeOrigin(transaction)) return;
      setIsDirty(true);
      setNeedsVersion(true);
      editVersionRef.current += 1;
      autosaveTriggerRef.current?.();   // enregistrement automatique
    },
  }, [ydoc]);

  /* ── Chargement initial du document Yjs ── */
  useEffect(() => {
    if (!editor) return;
    let cancelled = false;

    (async () => {
      try {
        if (file.yjs_state) {
          // Le document a déjà un état collaboratif enregistré
          Y.applyUpdate(ydoc, fromBase64(file.yjs_state), 'init');
        } else if ((file.content || '').trim()) {
          // Première ouverture : on construit l'état à partir du HTML, dans un document temporaire
          const holder = document.createElement('div');
          holder.innerHTML = file.content;
          const node = PMDOMParser.fromSchema(editor.schema).parse(holder);
          const seed = toBase64(Y.encodeStateAsUpdate(prosemirrorToYDoc(node, 'default')));
          try {
            // Le serveur garde le premier état reçu : tout le monde part de la même base (pas de doublon)
            const { data } = await axios.post(
              route('files.init-yjs-state', file.id),
              { state: seed },
              { headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content } }
            );
            Y.applyUpdate(ydoc, fromBase64(data.state), 'init');
          } catch {
            // Lecture seule ou réseau : affichage local uniquement
            Y.applyUpdate(ydoc, fromBase64(seed), 'init');
          }
        }
      } catch (e) {
        console.error('Initialisation collaborative impossible', e);
      } finally {
        if (!cancelled) {
          setIsDirty(false);
          setCollabReady(true);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [editor, ydoc]);

  /* ── Temps réel : présence + synchronisation Yjs via Pusher ── */
  useEffect(() => {
    if (!editor || !collabReady || !file?.id || myPermission === 'none' || typeof window.Echo === 'undefined') return;

    const channelName = `presence-document.${file.id}`;

    const channel = window.Echo.join(channelName)
      .here((users) => {
        setPresenceUsers(users);
      })
      .joining((user) => {
        setPresenceUsers(prev => {
          if (prev.find(u => u.id === user.id)) return prev;
          addToast(`${user.name} a rejoint le document`, 'success');
          return [...prev, user];
        });
      })
      .leaving((user) => {
        setPresenceUsers(prev => prev.filter(u => u.id !== user.id));
      });

    const provider = new PusherYjsProvider({
      doc: ydoc,
      awareness,
      readOnly: isReadOnly,
      onReload: () => {
        reloadingRef.current = true;
        addToast('Le document a été restauré par un collaborateur. Rechargement…', 'success');
        setTimeout(() => window.location.reload(), 1200);
      },
    });
    provider.attach(channel);
    providerRef.current = provider;

    return () => {
      provider.destroy();
      providerRef.current = null;
      window.Echo.leave(channelName);
    };
  }, [editor, collabReady, file?.id, ydoc, awareness, isReadOnly, addToast]);

  /* ── Sauvegarde de l'état Yjs sur le serveur (debounce 2,5 s) ── */
  useEffect(() => {
    if (!editor || !collabReady || isReadOnly) return;
    let timer = null;

    const persist = () => {
      timer = null;
      if (reloadingRef.current) return;
      axios.put(
        route('files.update-yjs-state', file.id),
        { state: toBase64(Y.encodeStateAsUpdate(ydoc)) },
        { headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content } }
      ).catch(() => { /* réessayé à la prochaine modification */ });
    };

    const onUpdate = (_u, origin) => {
      if (origin === 'init' || origin === providerRef.current) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(persist, 2500);
    };

    ydoc.on('update', onUpdate);
    return () => {
      ydoc.off('update', onUpdate);
      if (timer) { clearTimeout(timer); persist(); }
    };
  }, [editor, collabReady, isReadOnly, ydoc, file.id]);

  /* ── Word count once content settles ── */
  useEffect(() => {
    if (!editor) return;
    const text = editor.getText().trim();
    setWordCount(text ? text.split(/\s+/).length : 0);
  }, [editor, file?.content]);

  /* ── Save handler ── */
  const handleSave = useCallback(async () => {
    if (!editor || isSaving || isReadOnly) return;
    const htmlContent = editor.getHTML();
    setIsSaving(true);
    try {
      await axios.put(
        route('files.update-content', file.id),
        { content: htmlContent, summary: summary || null },
        { headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content } }
      );
      setIsDirty(false);
      setNeedsVersion(false);
      setAutoSaveError(false);
      setLastSaved(new Date().toISOString());
      setSummary('');
      setShowSummary(false);
      addToast('Document sauvegardé');
      localStorage.removeItem(`file_autosave_${file.id}`);
    } catch (err) {
      addToast(err?.response?.data?.message || 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [editor, isSaving, isReadOnly, file?.id, summary, addToast]);

  useEffect(() => { saveRef.current = handleSave; }, [handleSave]);

  /* ── Keyboard shortcut Ctrl+S ── */
  useEffect(() => {
    const fn = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveRef.current?.();
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  /* ── Enregistrement automatique (comme Google Docs) ──
     Le document est envoyé au serveur ~2,5 s après la dernière frappe (au plus 15 s en frappe continue),
     sans créer de version à chaque fois, et une dernière fois quand on quitte / masque la page. */
  const autosaveTimer = useRef(null);
  const autosaveMaxTimer = useRef(null);
  const autosaveBusy = useRef(false);
  const autosaveAgain = useRef(false);
  const [autoSaving, setAutoSaving] = useState(false);

  const runAutosave = useCallback(async () => {
    clearTimeout(autosaveTimer.current);
    clearTimeout(autosaveMaxTimer.current);
    autosaveTimer.current = null;
    autosaveMaxTimer.current = null;
    if (!editor || editor.isDestroyed || isReadOnly || reloadingRef.current) return;
    if (autosaveBusy.current) { autosaveAgain.current = true; return; }

    autosaveBusy.current = true;
    setAutoSaving(true);
    const versionAtStart = editVersionRef.current;
    try {
      const { data } = await axios.post(route('files.autosave', file.id), { content: editor.getHTML() });
      setAutoSaveError(false);
      setLastSaved(data?.saved_at || new Date().toISOString());
      if (editVersionRef.current === versionAtStart) setIsDirty(false);
    } catch (err) {
      setAutoSaveError(true);
      // nouvel essai automatique dans 10 s
      autosaveTimer.current = setTimeout(() => autosaveTriggerRef.current?.(), 10000);
    } finally {
      autosaveBusy.current = false;
      setAutoSaving(false);
      if (autosaveAgain.current) { autosaveAgain.current = false; autosaveTriggerRef.current?.(); }
    }
  }, [editor, isReadOnly, file.id]);

  autosaveTriggerRef.current = () => {
    if (isReadOnly) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(runAutosave, 2500);
    if (!autosaveMaxTimer.current) autosaveMaxTimer.current = setTimeout(runAutosave, 15000);
  };

  // Dernier envoi quand on masque / quitte la page (même si l'onglet se ferme)
  useEffect(() => {
    if (!editor || isReadOnly) return undefined;
    const flush = () => {
      if (!autosaveTimer.current && !autosaveMaxTimer.current) return; // rien en attente
      if (reloadingRef.current || editor.isDestroyed) return;
      clearTimeout(autosaveTimer.current);
      clearTimeout(autosaveMaxTimer.current);
      autosaveTimer.current = null;
      autosaveMaxTimer.current = null;
      try {
        const xsrf = decodeURIComponent((document.cookie.match(/XSRF-TOKEN=([^;]+)/) || [])[1] || '');
        fetch(route('files.autosave', file.id), {
          method: 'POST',
          keepalive: true,
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-XSRF-TOKEN': xsrf,
          },
          body: JSON.stringify({ content: editor.getHTML() }),
        });
      } catch { /* ignore */ }
    };
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
      flush();
    };
  }, [editor, isReadOnly, file.id]);

  /* ── Avertissement avant de quitter : uniquement si l'enregistrement automatique a échoué ── */
  useEffect(() => {
    const fn = (e) => {
      if (!(isDirty && autoSaveError)) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', fn);
    return () => window.removeEventListener('beforeunload', fn);
  }, [isDirty, autoSaveError]);

  /* ── Rename document ── */
  const handleRename = useCallback(async (newName) => {
    const previous = docTitle;
    setDocTitle(newName);
    try {
      await axios.patch(`/files/${file.id}/rename`, { name: newName }, {
        headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content },
      });
      addToast('Document renommé');
    } catch {
      setDocTitle(previous);
      addToast('Impossible de renommer le document', 'error');
    }
  }, [docTitle, file.id, addToast]);

  /* ── Commentaires (stockés dans le Y.Map "comments" du document, donc temps réel) ── */
  const commentsMap = useMemo(() => ydoc.getMap('comments'), [ydoc]);
  const [comments, setComments] = useState([]);
  const [activeCommentId, setActiveCommentId] = useState(null);
  const [pendingComment, setPendingComment] = useState(null); // { from, to, quote }
  const pendingRef = useRef(null);
  const startCommentRef = useRef(null);
  const [selBtn, setSelBtn] = useState(null);
  const [findOpen, setFindOpen] = useState(false);
  const [fullWidth, setFullWidth] = useState(true);
  const canComment = !isReadOnly;

  useEffect(() => { pendingRef.current = pendingComment; }, [pendingComment]);

  useEffect(() => {
    const sync = () => setComments(Array.from(commentsMap.values()));
    sync();
    commentsMap.observe(sync);
    return () => commentsMap.unobserve(sync);
  }, [commentsMap]);

  commentClickRef.current = (id) => { setActiveCommentId(id); setSidePanel('comments'); };

  // Bouton flottant « Commenter » près de la sélection + suivi de la plage en attente
  useEffect(() => {
    if (!editor) return undefined;
    const update = () => {
      if (editor.isDestroyed) return;
      const { to, empty } = editor.state.selection;
      if (isReadOnly || empty || !editor.isFocused) { setSelBtn(null); return; }
      const c = editor.view.coordsAtPos(to);
      setSelBtn({ top: c.bottom + 6, left: Math.max(8, Math.min(c.right + 6, window.innerWidth - 150)) });
    };
    const hide = () => setSelBtn(null);
    const track = ({ transaction }) => {
      const p = pendingRef.current;
      if (!p || !transaction.docChanged) return;
      const from = transaction.mapping.map(p.from);
      const to = transaction.mapping.map(p.to);
      if (from !== p.from || to !== p.to) setPendingComment({ ...p, from, to });
    };
    editor.on('selectionUpdate', update);
    editor.on('focus', update);
    editor.on('blur', hide);
    editor.on('transaction', track);
    window.addEventListener('scroll', update, true);
    return () => {
      editor.off('selectionUpdate', update);
      editor.off('focus', update);
      editor.off('blur', hide);
      editor.off('transaction', track);
      window.removeEventListener('scroll', update, true);
    };
  }, [editor, isReadOnly]);

  const startComment = useCallback(() => {
    if (!editor || isReadOnly) return;
    const { from, to, empty } = editor.state.selection;
    if (empty) { addToast('Sélectionnez d\u2019abord le passage à commenter', 'error'); return; }
    setPendingComment({ from, to, quote: editor.state.doc.textBetween(from, to, ' ').slice(0, 300) });
    setSidePanel('comments');
    setSelBtn(null);
  }, [editor, isReadOnly, addToast]);
  startCommentRef.current = startComment;

  const newId = (prefix) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

  const addComment = useCallback((text) => {
    const p = pendingRef.current;
    if (!p || !editor) return;
    const id = newId('c');
    const max = editor.state.doc.content.size;
    const from = Math.max(1, Math.min(p.from, max));
    const to = Math.max(from, Math.min(p.to, max));
    editor.chain().setTextSelection({ from, to }).setMark('comment', { commentId: id }).run();
    commentsMap.set(id, {
      id, kind: 'comment', userId: auth.user.id, userName: auth.user.name,
      text, quote: p.quote, createdAt: Date.now(), resolved: false,
    });
    setPendingComment(null);
    setActiveCommentId(id);
  }, [editor, commentsMap, auth.user.id, auth.user.name]);

  const replyComment = useCallback((parentId, text) => {
    const id = newId('r');
    commentsMap.set(id, { id, kind: 'reply', parentId, userId: auth.user.id, userName: auth.user.name, text, createdAt: Date.now() });
  }, [commentsMap, auth.user.id, auth.user.name]);

  const toggleResolveComment = useCallback((id) => {
    const c = commentsMap.get(id);
    if (!c) return;
    commentsMap.set(id, { ...c, resolved: !c.resolved });
    if (!c.resolved) setActiveCommentId((cur) => (cur === id ? null : cur));
  }, [commentsMap]);

  const deleteComment = useCallback((id) => {
    const c = commentsMap.get(id);
    if (!c || !editor) return;
    if (c.kind === 'comment') {
      ydoc.transact(() => {
        Array.from(commentsMap.values()).filter((x) => x.kind === 'reply' && x.parentId === id).forEach((r) => commentsMap.delete(r.id));
        commentsMap.delete(id);
      });
      const { state, view } = editor;
      const type = state.schema.marks.comment;
      const tr = state.tr;
      state.doc.descendants((node, pos) => {
        node.marks.forEach((m) => { if (m.type === type && m.attrs.commentId === id) tr.removeMark(pos, pos + node.nodeSize, m); });
      });
      if (tr.docChanged) view.dispatch(tr);
      setActiveCommentId((cur) => (cur === id ? null : cur));
    } else {
      commentsMap.delete(id);
    }
  }, [commentsMap, editor, ydoc]);

  const selectComment = useCallback((id) => {
    setActiveCommentId(id);
    if (!editor) return;
    let from = null; let to = null;
    editor.state.doc.descendants((node, pos) => {
      if (node.marks.some((m) => m.type.name === 'comment' && m.attrs.commentId === id)) {
        if (from === null) from = pos;
        to = pos + node.nodeSize;
      }
    });
    if (from !== null) editor.chain().setTextSelection({ from, to }).scrollIntoView().run();
  }, [editor]);

  const openCommentCount = comments.filter((c) => c.kind === 'comment' && !c.resolved).length;
  const commentCss = useMemo(() => {
    const safe = (id) => /^[\w-]+$/.test(String(id));
    const css = comments
      .filter((c) => c.kind === 'comment' && !c.resolved && safe(c.id))
      .map((c) => `.doc-editor span[data-comment-id="${c.id}"]{background:rgba(255,212,0,.35);border-bottom:2px solid #f9ab00}`)
      .join('');
    const act = activeCommentId && safe(activeCommentId)
      ? `.doc-editor span[data-comment-id="${activeCommentId}"]{background:rgba(255,193,7,.7)}` : '';
    return css + act;
  }, [comments, activeCommentId]);

  /* ── Menus : téléchargements, plein écran, raccourcis ── */
  const baseName = (docTitle || 'document').replace(/[\\/:*?"<>|]+/g, '-');
  const downloadBlob = (name, mime, content) => {
    const url = URL.createObjectURL(new Blob([content], { type: mime }));
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const wrapHtml = (body) => `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${baseName}</title></head><body>${body}</body></html>`;

  const menuActions = {
    save: () => saveRef.current?.(),
    rename: () => {
      const n = window.prompt('Renommer le document', docTitle);
      if (n && n.trim() && n.trim() !== docTitle) handleRename(n.trim());
    },
    downloadHtml: () => downloadBlob(`${baseName}.html`, 'text/html;charset=utf-8', wrapHtml(editor.getHTML())),
    downloadDoc: () => downloadBlob(`${baseName}.doc`, 'application/msword',
      `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${baseName}</title></head><body>${editor.getHTML()}</body></html>`),
    downloadTxt: () => downloadBlob(`${baseName}.txt`, 'text/plain;charset=utf-8', editor.getText({ blockSeparator: '\n' })),
    history: () => setSidePanel('history'),
    share: () => setSidePanel('access'),
    print: () => window.print(),
    close: () => {
      if (isDirty && !window.confirm('Des modifications non sauvegardées seront perdues. Quitter ?')) return;
      window.history.back();
    },
    find: () => setFindOpen(true),
    toggleFullWidth: () => setFullWidth((v) => !v),
    toggleFullscreen: () => {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else document.documentElement.requestFullscreen?.();
    },
    toggleComments: () => setSidePanel((p) => (p === 'comments' ? null : 'comments')),
    comment: () => startCommentRef.current?.(),
    tracking: () => setTrackingOpen(true),
    toggleSuggesting: () => setSuggesting((v) => !v),
  };

  useEffect(() => {
    const fn = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === 'h' && !e.altKey) { e.preventDefault(); setFindOpen(true); }
      else if (k === 'm' && e.altKey) { e.preventDefault(); startCommentRef.current?.(); }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  /* ── Suivi des modifications : mode Suggestion ──
     En mode Suggestion, ce qui est tapé / supprimé est marqué (insertion / suppression) au lieu d'être appliqué.
     Les marques sont dans le document Yjs : tout le monde les voit en temps réel et peut les accepter ou les rejeter. */
  const trackLogMap = useMemo(() => ydoc.getMap('tracklog'), [ydoc]);
  const [suggestions, setSuggestions] = useState([]);
  const [trackLog, setTrackLog] = useState([]);

  useEffect(() => {
    if (!editor) return;
    editor.storage.suggestionMode.enabled = suggesting && !isReadOnly;
    editor.storage.suggestionMode.user = collabUser;
  }, [editor, suggesting, isReadOnly, collabUser]);

  useEffect(() => {
    if (!editor) return undefined;
    let t = null;
    const recompute = () => { if (!editor.isDestroyed) setSuggestions(collectSuggestions(editor.state.doc)); };
    const onTr = ({ transaction }) => {
      if (!transaction.docChanged) return;
      clearTimeout(t);
      t = setTimeout(recompute, 150);
    };
    recompute();
    editor.on('transaction', onTr);
    return () => { clearTimeout(t); editor.off('transaction', onTr); };
  }, [editor, collabReady]);

  useEffect(() => {
    const sync = () => setTrackLog(Array.from(trackLogMap.values()));
    sync();
    trackLogMap.observe(sync);
    return () => trackLogMap.unobserve(sync);
  }, [trackLogMap]);

  const changes = useMemo(() => {
    const pendingIds = new Set(suggestions.map((x) => x.id));
    return [
      ...suggestions.map(({ ranges, ...rest }) => rest),
      ...trackLog.filter((l) => !pendingIds.has(l.id)),
    ];
  }, [suggestions, trackLog]);

  const trackUsers = useMemo(() => {
    const m = new Map();
    collaborators.forEach((u) => m.set(String(u.id), { id: u.id, name: u.name }));
    [...suggestions, ...trackLog].forEach((c) => {
      if (c.userId != null && !m.has(String(c.userId))) m.set(String(c.userId), { id: c.userId, name: c.userName || 'Utilisateur' });
    });
    return Array.from(m.values());
  }, [collaborators, suggestions, trackLog]);

  const resolveChange = useCallback((id, accept) => {
    if (!editor || isReadOnly) return;
    const c = suggestions.find((x) => x.id === id);
    if (c) {
      trackLogMap.set(id, {
        id, type: c.type, userId: c.userId, userName: c.userName, excerpt: c.excerpt, createdAt: c.createdAt,
        status: accept ? 'accepted' : 'rejected', resolvedBy: auth.user.name, resolvedAt: Date.now(),
      });
    }
    resolveSuggestion(editor, id, accept);
  }, [editor, isReadOnly, suggestions, trackLogMap, auth.user.name]);

  const handleAcceptChange = useCallback((id) => resolveChange(id, true), [resolveChange]);
  const handleRejectChange = useCallback((id) => resolveChange(id, false), [resolveChange]);
  const handleResolveAll = useCallback((accept) => suggestions.forEach((c) => resolveChange(c.id, accept)), [suggestions, resolveChange]);
  const pendingCount = suggestions.length;

  const isPdf = isPdfFile(file.type, file.name);
  if (isPdf) {
    return <AdminLayout><div className="p-8 text-center"><h2 className="text-xl font-semibold">La modification des PDF n'est pas prise en charge.</h2></div></AdminLayout>;
  }

  // Collègue sans droit sur ce document (ni admin, ni manager du projet, ni assigné à la tâche)
  if (myPermission === 'none') {
    return (
      <AdminLayout>
        <Head title="Accès refusé" />
        <div className="flex items-center justify-center min-h-[70vh] p-6">
          <div className="max-w-md w-full text-center bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <FaLock className="text-slate-400 text-xl" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Vous n'avez pas accès à ce document</h2>
            <p className="text-[13.5px] text-slate-500 mb-6">
              Ce document est réservé aux administrateurs, aux managers du projet et à la personne à qui la tâche est assignée.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button type="button" onClick={() => window.history.back()} className="px-4 h-9 rounded-lg border border-slate-300 text-[13px] text-slate-700 hover:bg-slate-50">
                Retour
              </button>
              <a href={route('files.show', file.id)} className="px-4 h-9 leading-9 rounded-lg bg-[#1a73e8] text-white text-[13px] hover:bg-[#1765cc]">
                Voir la fiche du fichier
              </a>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const permInfo = PERMISSIONS.find(p => p.value === myPermission);

  return (
    <AdminLayout>
      <Head title={`Édition — ${docTitle}`} />

      <div className="flex flex-col h-[calc(100vh-64px)] md:h-screen bg-[#F9FBFD] overflow-hidden relative">
        <style>{commentCss}</style>

        {/* ══ TITLE BAR ══ */}
        <div className="flex-shrink-0 bg-white border-b border-slate-200/70 z-40">

          {/* Breadcrumb */}
          {(project || task) && (
            <div className="flex items-center gap-1.5 px-3 sm:px-5 pt-2 text-[11px] text-slate-400 overflow-x-auto whitespace-nowrap scrollbar-hide">
              {project && <span className="hover:text-[#3454D1] transition-colors cursor-default truncate">{project.name}</span>}
              {project && task && <FaAngleRight className="text-[8px] text-slate-300 flex-shrink-0" />}
              {task && <span className="hover:text-[#3454D1] transition-colors cursor-default truncate max-w-[150px] sm:max-w-xs">{task.title ?? task.name}</span>}
              <FaAngleRight className="text-[8px] text-slate-300 flex-shrink-0" />
              <span className="text-slate-500 font-medium">Fichier de suivi</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 px-3 sm:px-5 py-2.5">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="w-8 h-8 bg-[#EEF1FC] rounded-lg flex items-center justify-center flex-shrink-0">
                <FaFileAlt className="text-[#3454D1] text-[13px]" />
              </div>
              <div className="min-w-0 flex-1">
                <EditableTitle value={docTitle} onRename={handleRename} readOnly={isReadOnly} />
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    (isSaving || autoSaving) ? 'bg-[#3454D1] animate-pulse' : autoSaveError ? 'bg-red-500' : isDirty ? 'bg-amber-400' : 'bg-emerald-400'
                  }`} />
                  <span className="text-[11px] sm:text-[12px] text-slate-500 flex items-center gap-1 truncate">
                    {(isSaving || autoSaving)
                      ? 'Enregistrement…'
                      : autoSaveError
                        ? 'Échec de l’enregistrement, nouvel essai…'
                        : isDirty
                          ? 'Modifications en cours…'
                          : (
                          <>
                            <FaGoogleDrive className="text-[10px] text-slate-300 hidden sm:block" />
                            {lastSaved ? <span className="hidden sm:inline">Enregistré à {fmtDateShort(lastSaved)}</span> : <span className="hidden sm:inline">Modifications enregistrées</span>}
                            <span className="sm:hidden">Enregistré</span>
                          </>
                          )}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 ml-auto">
              {presenceUsers.length > 0 && (
                <div className="flex -space-x-1.5">
                  {presenceUsers.slice(0, 4).map(u => <Avatar key={u.id} user={u} size={7} />)}
                  {presenceUsers.length > 4 && (
                    <div className="w-7 h-7 rounded-full bg-slate-100 ring-2 ring-white flex items-center justify-center text-[10px] font-semibold text-slate-500">
                      +{presenceUsers.length - 4}
                    </div>
                  )}
                </div>
              )}

              <span className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-50 ${permInfo?.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${permDot(myPermission)}`} />
                {permInfo?.label}
              </span>

              {/* Panel switcher — segmented control */}
              <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
                <button
                  onClick={() => setSidePanel(p => p === 'comments' ? null : 'comments')}
                  className={`relative flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[12px] font-medium transition-all
                    ${sidePanel === 'comments'
                      ? 'bg-white text-[#1E2129] shadow-sm'
                      : 'text-slate-500 hover:text-[#1E2129]'
                    }`}
                >
                  <FaCommentMedical className="text-[10px]" />
                  <span className="hidden lg:inline">Commentaires</span>
                  {openCommentCount > 0 && (
                    <span className="min-w-[16px] h-4 px-1 rounded-full bg-[#1a73e8] text-white text-[9px] font-semibold flex items-center justify-center">{openCommentCount}</span>
                  )}
                </button>
                <button
                  onClick={() => setSidePanel(p => p === 'history' ? null : 'history')}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[12px] font-medium transition-all
                    ${sidePanel === 'history'
                      ? 'bg-white text-[#1E2129] shadow-sm'
                      : 'text-slate-500 hover:text-[#1E2129]'
                    }`}
                >
                  <FaHistory className="text-[10px]" />
                  <span className="hidden lg:inline">Historique</span>
                </button>
                <button
                  onClick={() => setSidePanel(p => p === 'access' ? null : 'access')}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[12px] font-medium transition-all
                    ${sidePanel === 'access'
                      ? 'bg-white text-[#1E2129] shadow-sm'
                      : 'text-slate-500 hover:text-[#1E2129]'
                    }`}
                >
                  <FaUsers className="text-[10px]" />
                  <span className="hidden lg:inline">Partager</span>
                  {collaborators.length > 0 && <span className="text-[10px] text-slate-400 hidden lg:inline">{collaborators.length}</span>}
                </button>
                <button
                  onClick={() => setTrackingOpen(true)}
                  className="relative flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[12px] font-medium text-slate-500 hover:text-[#1E2129] transition-all"
                >
                  <FaUserEdit className="text-[10px]" />
                  <span className="hidden lg:inline">Suivi</span>
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#3454D1] text-white text-[9px] font-semibold flex items-center justify-center">
                      {pendingCount}
                    </span>
                  )}
                </button>
              </div>

              {!isReadOnly && (
                <div className="flex items-center gap-1">
                  {needsVersion && !showSummary && (
                    <button
                      onClick={() => setShowSummary(true)}
                      className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-[#1E2129] hover:bg-slate-50 transition-colors"
                      title="Enregistrer une version avec une note (l'enregistrement automatique est déjà actif)"
                    >
                      <FaTag className="text-[11px]" />
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={() => {
                  if (isDirty && !window.confirm('Des modifications non sauvegardées seront perdues. Quitter ?')) return;
                  window.history.back();
                }}
                className="p-1.5 sm:p-2 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-50 transition-colors"
              >
                <FaTimes className="text-sm" />
              </button>
            </div>
          </div>

          {showSummary && (
            <div className="flex items-center gap-2 px-5 py-2 bg-[#EEF1FC] border-t border-slate-100">
              <FaTag className="text-[#3454D1] text-[11px] flex-shrink-0" />
              <input
                type="text"
                value={summary}
                onChange={e => setSummary(e.target.value)}
                placeholder="Note pour cette version — ex. ajout section 3, correction orthographe…"
                className="flex-1 text-[12.5px] bg-transparent border-0 outline-none text-[#1E2129] placeholder-slate-400"
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setShowSummary(false); }}
                autoFocus
              />
              <button onClick={() => setShowSummary(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <FaTimes className="text-[10px]" />
              </button>
            </div>
          )}

          {isReadOnly && (
            <div className="flex items-center gap-2 px-5 py-1.5 bg-slate-50 border-t border-slate-100">
              <FaLock className="text-slate-400 text-[10px] flex-shrink-0" />
              <span className="text-[11.5px] text-slate-500">
                {myPermission === 'none' ? "Vous n'avez pas accès à ce document." : 'Lecture seule — vous ne pouvez pas modifier ce document.'}
              </span>
            </div>
          )}

          {editor && (
            <div className="border-t border-slate-100">
              <DocMenus
                editor={editor}
                isReadOnly={isReadOnly}
                actions={menuActions}
                fullWidth={fullWidth}
                commentsOpen={sidePanel === 'comments'}
                suggesting={suggesting}
                rightSlot={project ? <DocCallButton project={project} auth={auth} compact /> : null}
              />
            </div>
          )}
        </div>

        {/* ══ TOOLBAR (pleine largeur, sur plusieurs lignes si besoin) ══ */}
        {!isReadOnly && editor && (
          <div className="flex-shrink-0 px-2 sm:px-4 py-1.5 bg-[#F9FBFD] relative z-30">
            <div className="bg-[#EDF2FA] rounded-2xl px-1">
              <MenuBar editor={editor} onComment={startComment} onFind={() => setFindOpen(true)} onPrint={() => window.print()} />
            </div>
          </div>
        )}

        {/* ══ BODY ══ */}
        <div className="flex-1 flex overflow-hidden relative">
          <div className="flex-1 overflow-y-auto">
            <div className={`${fullWidth ? 'w-full' : 'max-w-[900px] mx-auto'} px-0 sm:px-4 py-2 sm:py-3`}>
              {suggesting && !isReadOnly && (
                <div className="mb-2 mx-2 sm:mx-0 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-[12.5px] text-amber-800">
                  <FaUserEdit className="text-[12px] flex-shrink-0" />
                  <span className="flex-1">
                    <strong>Mode suggestion :</strong> vos modifications sont proposées (texte ajouté souligné, texte supprimé barré) et peuvent être acceptées ou rejetées.
                  </span>
                  <button type="button" onClick={() => setTrackingOpen(true)} className="px-2.5 h-7 rounded-md bg-white border border-amber-200 hover:bg-amber-100 font-medium">
                    Voir ({pendingCount})
                  </button>
                  <button type="button" onClick={() => setSuggesting(false)} className="px-2.5 h-7 rounded-md bg-amber-600 text-white hover:bg-amber-700 font-medium">
                    Revenir à l’édition
                  </button>
                </div>
              )}
              {/* Feuille : occupe toute la largeur disponible */}
              <div className="doc-paper doc-editor bg-white sm:rounded-xl border border-slate-200 shadow-sm min-h-[calc(100vh-320px)]">
                <div className="px-5 py-6 sm:px-10 sm:py-10 lg:px-14" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
                  <EditorContent editor={editor} className="max-w-none min-h-96 focus:outline-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Side panel */}
          {sidePanel && (
            <div className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setSidePanel(null)} />
          )}
          <div className={`fixed inset-y-0 right-0 z-50 lg:static flex-shrink-0 ${sidePanel ? 'w-full sm:w-80' : 'w-0'} overflow-hidden transition-[width] duration-200 border-l border-slate-200/70 bg-white shadow-2xl lg:shadow-none`}>
            {sidePanel === 'history' && (
              <VersionPanel
                fileId={file.id}
                recentVersions={recentVersions}
                canRestore={canRestore}
                onRestore={() => {
                  reloadingRef.current = true;
                  providerRef.current?.notifyReload();
                  setTimeout(() => window.location.reload(), 500);
                }}
              />
            )}
            {sidePanel === 'comments' && (
              <CommentsPanel
                comments={comments}
                activeId={activeCommentId}
                onSelect={selectComment}
                pendingQuote={pendingComment ? pendingComment.quote : null}
                onAdd={addComment}
                onCancelPending={() => setPendingComment(null)}
                onReply={replyComment}
                onResolve={toggleResolveComment}
                onDelete={deleteComment}
                currentUserId={auth.user.id}
                canModerate={myPermission === 'admin' || canManageAccess}
                canComment={canComment}
                onClose={() => setSidePanel(null)}
              />
            )}
            {sidePanel === 'access' && (
              <AccessPanel
                fileId={file.id}
                collaborators={collaborators}
                canManage={canManageAccess}
              />
            )}
          </div>
        </div>

        {/* ══ FOOTER ══ */}
        <div className="flex-shrink-0 bg-white border-t border-slate-100 px-5 py-1.5">
          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <Avatar user={auth.user} size={4} ring={false} />
                <span className="hidden sm:inline">Connecté en tant que <span className="font-medium text-slate-600">{auth.user.name}</span></span>
                <span className="sm:hidden font-medium text-slate-600">{auth.user.name}</span>
              </span>
              <span className="text-slate-300">·</span>
              <span>{wordCount} mot{wordCount !== 1 ? 's' : ''}</span>
            </span>
            {lastModifiedBy && (
              <span className="hidden sm:inline">
                Dernière modification par <span className="font-medium text-slate-600">{lastModifiedBy.name}</span> — {fmtDate(lastModifiedBy.timestamp)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bouton flottant « Commenter » */}
      {selBtn && !isReadOnly && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={startComment}
          style={{ position: 'fixed', top: selBtn.top, left: selBtn.left, zIndex: 950 }}
          className="flex items-center gap-1.5 px-3 h-8 rounded-full bg-white border border-slate-300 shadow-lg text-[12px] font-medium text-[#1a73e8] hover:bg-[#e8f0fe]"
        >
          <FaCommentMedical className="text-[11px]" /> Commenter
        </button>
      )}

      <FindReplaceBar editor={editor} open={findOpen} onClose={() => setFindOpen(false)} readOnly={isReadOnly} />

      {/* ══ TOASTS ══ */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <Toast key={t.id} message={t.msg} type={t.type} onClose={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />
        ))}
      </div>

      {/* ══ TRACKING MODAL ══ */}
      <TrackingModal
        isOpen={trackingOpen}
        onClose={() => setTrackingOpen(false)}
        users={trackUsers}
        changes={changes}
        onAccept={handleAcceptChange}
        onReject={handleRejectChange}
        onAcceptAll={() => handleResolveAll(true)}
        onRejectAll={() => handleResolveAll(false)}
        canResolve={!isReadOnly}
        suggesting={suggesting}
        onToggleSuggesting={() => setSuggesting((v) => !v)}
      />
    </AdminLayout>
  );
};

export default EditContent;