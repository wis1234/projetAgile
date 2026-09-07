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
  FaUser, FaMinus
} from 'react-icons/fa';
import { isPdfFile } from '@/utils/fileUtils';
import MenuBar from '@/Components/Editor/MenuBar';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Image } from '@tiptap/extension-image';
import FontFamily from '@tiptap/extension-font-family';
import FontSize from '@tiptap/extension-font-size';
import TrackChanges from '@/Components/Editor/extensions/track-changes';
import axios from 'axios';

/* ── Design tokens ───────────────────────────────────────────
   Canvas   #F4F5F7   Papier  #FFFFFF
   Encre    #1E2129   Encre atténuée #6B7280
   Accent   #3454D1   Accent doux (bg)  #EEF1FC
   Un seul accent porte toute l'interaction ; les couleurs de
   permission restent sémantiques (view/comment/edit/admin).
──────────────────────────────────────────────────────────── */

const PERMISSIONS = [
  { value: 'none',    label: 'Aucun accès', icon: <FaUserSlash />,  dot: 'bg-red-400',     color: 'text-red-600 dark:text-red-400'       },
  { value: 'view',    label: 'Lecture',      icon: <FaEye />,        dot: 'bg-slate-400',   color: 'text-slate-600 dark:text-slate-300'   },
  { value: 'comment', label: 'Commentaire',  icon: <FaComments />,   dot: 'bg-sky-400',     color: 'text-sky-600 dark:text-sky-400'       },
  { value: 'edit',    label: 'Éditeur',      icon: <FaEdit />,       dot: 'bg-emerald-400', color: 'text-emerald-600 dark:text-emerald-400'},
  { value: 'admin',   label: 'Admin',        icon: <FaShieldAlt />,  dot: 'bg-violet-400',  color: 'text-violet-600 dark:text-violet-400' },
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
    ? <img src={user.profile_photo_url} alt={user.name} className={`${sz} rounded-full object-cover ${ring ? 'ring-2 ring-white dark:ring-slate-800' : ''}`} />
    : <div className={`${sz} rounded-full ${color} flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0 ${ring ? 'ring-2 ring-white dark:ring-slate-800' : ''}`}>{initials}</div>;
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
  <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-slate-700/60">
    <div className="flex items-center gap-2">
      <span className="w-1 h-4 rounded-full bg-[#3454D1]" />
      <span className="text-[13px] font-semibold text-[#1E2129] dark:text-slate-100">{children}</span>
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
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 dark:border-slate-700/60 bg-[#EEF1FC] dark:bg-slate-800">
            <button onClick={() => setPreview(null)} className="text-[#3454D1] hover:opacity-70 transition-opacity">
              <FaAngleLeft className="text-xs" />
            </button>
            <span className="text-xs font-semibold text-[#1E2129] dark:text-slate-200">
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
            className="flex-1 overflow-y-auto p-5 prose prose-sm max-w-none font-serif text-[#1E2129] dark:text-slate-300 text-[13px] leading-relaxed"
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
              className="group px-4 py-3 border-b border-slate-100 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex items-start gap-2.5">
                <div className="flex-shrink-0 mt-0.5">
                  <Avatar user={v.user} size={6} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[12px] font-semibold text-[#1E2129] dark:text-slate-200">
                      Version {v.version_number}
                    </span>
                    {v.label && (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300">
                        {v.label}
                      </span>
                    )}
                    {i === 0 && (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
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
                    className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-[#1E2129] dark:hover:text-slate-200 transition-colors"
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
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/60">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-[11px]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Ajouter une personne par nom ou e-mail"
              className="w-full pl-8 pr-3 py-2 text-[12px] bg-slate-50 dark:bg-slate-700/50 border border-transparent rounded-lg text-[#1E2129] dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#3454D1]/40 focus:ring-2 focus:ring-[#3454D1]/15 transition"
            />
            {searching && <FaSpinner className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-300 text-[11px]" />}
          </div>

          {results.length > 0 && (
            <div className="mt-2 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm shadow-black/5">
              {results.slice(0, 5).map(user => (
                <div key={user.id} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border-b border-slate-50 dark:border-slate-700 last:border-0">
                  <Avatar user={user} size={6} ring={false} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-[#1E2129] dark:text-slate-100 truncate">{user.name}</p>
                    <p className="text-[10.5px] text-slate-400 truncate">{user.email}</p>
                  </div>
                  {['view','comment','edit'].map(p => (
                    <button
                      key={p}
                      onClick={() => grantAccess(user, p)}
                      disabled={adding}
                      title={permLabel(p)}
                      className={`p-1.5 rounded-md transition-colors text-[11px] ${permColor(p)} hover:bg-slate-100 dark:hover:bg-slate-700`}
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
          <div key={a.id} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
            <Avatar user={a} size={7} ring={false} />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-[#1E2129] dark:text-slate-100 truncate">{a.name}</p>
              <p className="text-[10.5px] text-slate-400 truncate">{a.email}</p>
            </div>
            {canManage ? (
              <div className="flex items-center gap-1">
                <select
                  value={a.permission}
                  onChange={e => updatePermission(a.id, e.target.value)}
                  className="text-[11px] font-medium bg-slate-50 dark:bg-slate-700 border-0 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#3454D1]/25 text-[#1E2129] dark:text-slate-200"
                >
                  {PERMISSIONS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => revokeAccess(a.id, a.name)}
                  className="p-1.5 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
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

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
const EditContent = ({ file, lastModifiedBy, auth, myPermission = 'edit', collaborators = [], recentVersions = [], canManageAccess = false }) => {
  const { flash }     = usePage().props;
  const [isSaving,    setIsSaving]    = useState(false);
  const [isDirty,     setIsDirty]     = useState(false);
  const [lastSaved,   setLastSaved]   = useState(null);
  const [toasts,      setToasts]      = useState([]);
  const [sidePanel,   setSidePanel]   = useState(null); // 'history' | 'access' | null
  const [summary,     setSummary]     = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [presenceUsers, setPresenceUsers] = useState([]); // connected users (requires Pusher)
  const saveRef = useRef();

  const isReadOnly = myPermission === 'view' || myPermission === 'none';
  const canRestore = myPermission === 'admin';

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
      StarterKit.configure({ codeBlock: { HTMLAttributes: { class: 'code-block' } }, underline: false, link: false }),
      TextStyle, FontFamily,
      FontSize.configure({ types: ['textStyle'] }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'], alignments: ['left','center','right','justify'], defaultAlignment: 'left' }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'editor-link' }, validate: h => /^https?:\/\//.test(h), autolink: true, linkOnPaste: true }),
      Highlight.configure({ multicolor: true, HTMLAttributes: { class: 'highlight' } }),
      TrackChanges,
      Color,
      Image.configure({ inline: true, allowBase64: true }),
    ],
    content: '',
    onUpdate: () => setIsDirty(true),
  });

  /* ── Load initial content ── */
  useEffect(() => {
    if (!editor) return;
    const content = file?.content;
    if (content) {
      editor.commands.setContent(content, false);
    } else {
      fetch(`/storage/${file.file_path}`)
        .then(r => r.ok ? r.text() : Promise.reject())
        .then(text => { if (!editor.isDestroyed) editor.commands.setContent(text, false); })
        .catch(() => {});
    }
  }, [editor, file]);

  /* ── Restore from localStorage ── */
  useEffect(() => {
    if (!file?.id || !editor) return;
    const saved = localStorage.getItem(`file_autosave_${file.id}`);
    if (!saved) return;
    try {
      const { content, timestamp } = JSON.parse(saved);
      if (window.confirm(`Sauvegarde locale du ${fmtDate(timestamp)} trouvée. La charger ?`)) {
        editor.commands.setContent(content);
        setIsDirty(true);
      }
      localStorage.removeItem(`file_autosave_${file.id}`);
    } catch {/* ignore */}
  }, [file?.id, editor]);

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

  /* ── Auto-save every 30s ── */
  useEffect(() => {
    if (!editor || !file?.id) return;
    const iv = setInterval(() => {
      if (isDirty) {
        localStorage.setItem(`file_autosave_${file.id}`, JSON.stringify({
          content: editor.getHTML(), fileId: file.id, timestamp: new Date().toISOString(),
        }));
        setLastSaved(new Date().toISOString());
      }
    }, 30000);
    return () => clearInterval(iv);
  }, [isDirty, editor, file?.id]);

  /* ── Unsaved changes warning ── */
  useEffect(() => {
    const fn = (e) => {
      if (!isDirty || isSaving) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', fn);
    return () => window.removeEventListener('beforeunload', fn);
  }, [isDirty, isSaving]);

  const isPdf = isPdfFile(file.type, file.name);
  if (isPdf) {
    return <AdminLayout><div className="p-8 text-center"><h2 className="text-xl font-semibold">La modification des PDF n'est pas prise en charge.</h2></div></AdminLayout>;
  }

  const permInfo = PERMISSIONS.find(p => p.value === myPermission);

  return (
    <AdminLayout>
      <Head title={`Édition — ${file.name}`} />

      <div className="flex flex-col h-screen bg-[#F4F5F7] dark:bg-slate-900 overflow-hidden">

        {/* ══ TITLE BAR ══ */}
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-slate-200/70 dark:border-slate-700 z-40">
          <div className="flex items-center gap-3 px-5 py-2.5">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="w-8 h-8 bg-[#EEF1FC] dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                <FaCode className="text-[#3454D1] text-[13px]" />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-[#1E2129] dark:text-slate-100 truncate leading-tight">{file.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    isSaving ? 'bg-[#3454D1] animate-pulse' : isDirty ? 'bg-amber-400' : 'bg-emerald-400'
                  }`} />
                  <span className="text-[11px] text-slate-400">
                    {isSaving ? 'Sauvegarde en cours' : isDirty ? 'Modifications non enregistrées' : lastSaved ? `Enregistré à ${fmtDateShort(lastSaved)}` : 'À jour'}
                  </span>
                </div>
              </div>
            </div>

            {presenceUsers.length > 0 && (
              <div className="flex -space-x-1.5">
                {presenceUsers.slice(0, 4).map(u => <Avatar key={u.id} user={u} size={7} />)}
                {presenceUsers.length > 4 && (
                  <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-600 ring-2 ring-white dark:ring-slate-800 flex items-center justify-center text-[10px] font-semibold text-slate-500 dark:text-slate-300">
                    +{presenceUsers.length - 4}
                  </div>
                )}
              </div>
            )}

            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-50 dark:bg-slate-700 ${permInfo?.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${permDot(myPermission)}`} />
              {permInfo?.label}
            </span>

            {/* Panel switcher — segmented control */}
            <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-700/60 rounded-lg p-0.5">
              <button
                onClick={() => setSidePanel(p => p === 'history' ? null : 'history')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-all
                  ${sidePanel === 'history'
                    ? 'bg-white dark:bg-slate-800 text-[#1E2129] dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 hover:text-[#1E2129] dark:hover:text-slate-200'
                  }`}
              >
                <FaHistory className="text-[10px]" />
                <span className="hidden md:inline">Historique</span>
              </button>
              <button
                onClick={() => setSidePanel(p => p === 'access' ? null : 'access')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-all
                  ${sidePanel === 'access'
                    ? 'bg-white dark:bg-slate-800 text-[#1E2129] dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 hover:text-[#1E2129] dark:hover:text-slate-200'
                  }`}
              >
                <FaUsers className="text-[10px]" />
                <span className="hidden md:inline">Partager</span>
                {collaborators.length > 0 && <span className="text-[10px] text-slate-400">{collaborators.length}</span>}
              </button>
            </div>

            {!isReadOnly && (
              <div className="flex items-center gap-1">
                {isDirty && !showSummary && (
                  <button
                    onClick={() => setShowSummary(true)}
                    className="p-2 rounded-lg text-slate-400 hover:text-[#1E2129] dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    title="Ajouter une note à cette version"
                  >
                    <FaTag className="text-[11px]" />
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={isSaving || !isDirty}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors
                    ${isSaving || !isDirty
                      ? 'bg-slate-50 dark:bg-slate-700 text-slate-300 dark:text-slate-500 cursor-not-allowed'
                      : 'bg-[#3454D1] hover:bg-[#2c47b8] text-white'
                    }`}
                >
                  {isSaving ? <FaSpinner className="animate-spin text-[10px]" /> : <FaSave className="text-[10px]" />}
                  {isSaving ? 'Sauvegarde…' : 'Enregistrer'}
                </button>
              </div>
            )}

            <button
              onClick={() => {
                if (isDirty && !window.confirm('Des modifications non sauvegardées seront perdues. Quitter ?')) return;
                window.history.back();
              }}
              className="p-2 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>

          {showSummary && (
            <div className="flex items-center gap-2 px-5 py-2 bg-[#EEF1FC] dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-700">
              <FaTag className="text-[#3454D1] text-[11px] flex-shrink-0" />
              <input
                type="text"
                value={summary}
                onChange={e => setSummary(e.target.value)}
                placeholder="Note pour cette version — ex. ajout section 3, correction orthographe…"
                className="flex-1 text-[12.5px] bg-transparent border-0 outline-none text-[#1E2129] dark:text-slate-200 placeholder-slate-400"
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setShowSummary(false); }}
                autoFocus
              />
              <button onClick={() => setShowSummary(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <FaTimes className="text-[10px]" />
              </button>
            </div>
          )}

          {isReadOnly && (
            <div className="flex items-center gap-2 px-5 py-1.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-700">
              <FaLock className="text-slate-400 text-[10px] flex-shrink-0" />
              <span className="text-[11.5px] text-slate-500 dark:text-slate-400">
                {myPermission === 'none' ? "Vous n'avez pas accès à ce document." : 'Lecture seule — vous ne pouvez pas modifier ce document.'}
              </span>
            </div>
          )}
        </div>

        {/* ══ BODY ══ */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-[840px] mx-auto px-4 sm:px-0 py-8">

              {/* Floating toolbar — same width as the page, not the screen */}
              {!isReadOnly && editor && (
                <div className="sticky top-0 z-10 flex items-center gap-1 px-3 py-2 mb-6 bg-white/95 dark:bg-slate-800/95 backdrop-blur border border-slate-200/80 dark:border-slate-700 rounded-xl shadow-sm shadow-black/[0.03] overflow-x-auto">
                  <MenuBar editor={editor} />
                  <div className="w-px h-5 bg-slate-200 dark:bg-slate-600 mx-1 flex-shrink-0" />
                  {[
                    { cmd: 'left',    Icon: FaAlignLeft    },
                    { cmd: 'center',  Icon: FaAlignCenter  },
                    { cmd: 'right',   Icon: FaAlignRight   },
                    { cmd: 'justify', Icon: FaAlignJustify },
                  ].map(({ cmd, Icon }) => (
                    <button
                      key={cmd}
                      onClick={() => editor.chain().focus().setTextAlign(cmd).run()}
                      className={`p-1.5 rounded-md transition-colors flex-shrink-0
                        ${editor.isActive({ textAlign: cmd })
                          ? 'bg-[#EEF1FC] text-[#3454D1]'
                          : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      title={`Aligner ${cmd}`}
                    >
                      <Icon className="text-xs" />
                    </button>
                  ))}
                </div>
              )}

              {/* Paper */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_28px_rgba(30,33,41,0.06)] border border-slate-200/60 dark:border-slate-700 min-h-[calc(100vh-260px)]">
                <div className="px-10 py-12 sm:px-16">
                  <EditorContent
                    editor={editor}
                    className="prose prose-slate dark:prose-invert font-serif max-w-none min-h-96 focus:outline-none prose-p:leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Side panel */}
          <div className={`flex-shrink-0 ${sidePanel ? 'w-80' : 'w-0'} overflow-hidden transition-[width] duration-200 border-l border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-800`}>
            {sidePanel === 'history' && (
              <VersionPanel
                fileId={file.id}
                recentVersions={recentVersions}
                canRestore={canRestore}
                onRestore={() => window.location.reload()}
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
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700/60 px-5 py-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Avatar user={auth.user} size={4} ring={false} />
              <span>Connecté en tant que <span className="font-medium text-slate-600 dark:text-slate-300">{auth.user.name}</span></span>
            </span>
            {lastModifiedBy && (
              <span>
                Dernière modification par <span className="font-medium text-slate-600 dark:text-slate-300">{lastModifiedBy.name}</span> — {fmtDate(lastModifiedBy.timestamp)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ══ TOASTS ══ */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <Toast key={t.id} message={t.msg} type={t.type} onClose={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />
        ))}
      </div>
    </AdminLayout>
  );
};

export default EditContent;