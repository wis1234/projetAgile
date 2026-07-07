import React, { useState, useEffect, useRef, useCallback } from 'react';
import { router, usePage, Link } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { 
  FaFileAlt, FaUpload, FaPlus, FaSave, FaTimes,
  FaInfoCircle, FaFileWord, FaFilePdf, FaFileExcel,
  FaFileImage, FaFileCode, FaArrowLeft, FaCheckCircle,
  FaExclamationCircle, FaCloudUploadAlt, FaFile
} from 'react-icons/fa';

// ─── CSRF helper : relit le token depuis le DOM à chaque appel ───────────────
function getCsrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

// ─── Renouvelle le token CSRF via un HEAD discret ───────────────────────────
async function refreshCsrfToken() {
  try {
    const res = await fetch(window.location.href, {
      method: 'HEAD',
      credentials: 'same-origin',
    });
    // Laravel renvoie le nouveau token dans le cookie XSRF-TOKEN
    // L'interception Axios / Inertia le gère automatiquement,
    // mais la balise meta doit aussi être mise à jour.
    const freshToken = getCsrfToken();
    return freshToken;
  } catch {
    return getCsrfToken();
  }
}

// ─── File icon helper ────────────────────────────────────────────────────────
function FileTypeIcon({ fileName, size = 'h-14 w-14' }) {
  const ext = fileName?.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return <FaFilePdf className={`${size} text-rose-400`} />;
  if (['doc','docx'].includes(ext)) return <FaFileWord className={`${size} text-sky-400`} />;
  if (['xls','xlsx'].includes(ext)) return <FaFileExcel className={`${size} text-emerald-400`} />;
  if (['jpg','jpeg','png','gif','webp','svg'].includes(ext)) return <FaFileImage className={`${size} text-violet-400`} />;
  if (['txt','md','csv'].includes(ext)) return <FaFileCode className={`${size} text-amber-400`} />;
  return <FaFile className={`${size} text-slate-400`} />;
}

// ─── Notification banner ─────────────────────────────────────────────────────
function Banner({ type, message, onClose }) {
  if (!message) return null;
  const isSuccess = type === 'success';
  return (
    <div className={`flex items-start gap-3 p-4 rounded-2xl border mb-6 transition-all
      ${isSuccess
        ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
        : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
      }`}>
      {isSuccess
        ? <FaCheckCircle className="mt-0.5 shrink-0 text-emerald-500" />
        : <FaExclamationCircle className="mt-0.5 shrink-0 text-rose-500" />}
      <p className="text-sm font-medium flex-1">{message}</p>
      <button onClick={onClose} className="opacity-60 hover:opacity-100 transition">
        <FaTimes className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
function Create({ projects, users, tasks = [], kanbans = [] }) {
  const { errors = {}, flash = {}, auth } = usePage().props;
  const urlParams = new URLSearchParams(window.location.search);
  const urlTaskId = urlParams.get('task_id');
  const urlProjectId = urlParams.get('project_id');

  const [activeTab, setActiveTab] = useState('import');
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
  const [projectId, setProjectId] = useState(urlProjectId || projects[0]?.id || '');
  const [taskId, setTaskId] = useState(urlTaskId || '');
  const [kanbanId, setKanbanId] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [notification, setNotification] = useState(flash.success || flash.error || '');
  const [notificationType, setNotificationType] = useState(flash.success ? 'success' : 'error');
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 600)}px`;
    }
  }, [content]);

  // Load task details
  useEffect(() => {
    if (!taskId) { setSelectedTask(null); return; }
    fetch(`/api/tasks/${taskId}/details`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.success && data.task) {
          setSelectedTask(data.task);
          if (data.task.sprint_id) setKanbanId(data.task.sprint_id);
        }
      })
      .catch(() => {});
  }, [taskId]);

  useEffect(() => {
    if (urlProjectId) setProjectId(urlProjectId);
    if (urlTaskId) setTaskId(urlTaskId);
  }, [urlProjectId, urlTaskId]);

  // ── Submit with CSRF-refresh retry ─────────────────────────────────────────
  const doRequest = useCallback(async (formData, isRetry = false) => {
    const token = getCsrfToken();
    const response = await fetch('/files', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': token,
      },
      body: formData,
    });

    // 419 = CSRF token mismatch → refresh & retry once
    if (response.status === 419 && !isRetry) {
      await refreshCsrfToken();
      return doRequest(formData, true);
    }

    return response;
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotification('');

    if (!projectId) {
      setNotification('Veuillez sélectionner un projet.');
      setNotificationType('error');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('project_id', projectId);

      if (file) {
        formData.append('file', file);
      } else if (content) {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        formData.append('file', blob, name.endsWith('.txt') ? name : `${name}.txt`);
      } else {
        throw new Error('Aucun contenu fourni.');
      }

      if (taskId)      formData.append('task_id', taskId);
      if (kanbanId)    formData.append('kanban_id', kanbanId);
      if (description) formData.append('description', description);

      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 60_000);

      const response = await doRequest(formData);
      clearTimeout(timeoutId);

      const text = await response.text();
      let data;
      try { data = JSON.parse(text); }
      catch { throw new Error('Réponse serveur invalide.'); }

      if (!response.ok) throw new Error(data.message || `Erreur HTTP ${response.status}`);
      if (!data.success) throw new Error(data.message || 'Échec de la création.');

      setNotification('Fichier créé avec succès — redirection…');
      setNotificationType('success');

      setTimeout(() => {
        const target = taskId ? `/tasks/${taskId}` : data.data?.id ? `/files/${data.data.id}` : '/files';
        window.location.href = target;
      }, 1200);

    } catch (err) {
      const msg = err.name === 'AbortError'
        ? 'La requête a expiré. Vérifiez votre connexion ou réessayez avec un fichier plus petit.'
        : err.message || 'Une erreur est survenue.';
      setNotification(msg);
      setNotificationType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) { setFile(f); if (!name) setName(f.name.replace(/\.[^/.]+$/, '')); }
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); if (!name) setName(f.name.replace(/\.[^/.]+$/, '')); }
  };

  const formatBytes = (b) => b < 1024 ? `${b} B` : b < 1024**2 ? `${(b/1024).toFixed(1)} KB` : `${(b/1024**2).toFixed(1)} MB`;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        .cf-root { font-family: 'Sora', sans-serif; }
        .cf-mono { font-family: 'JetBrains Mono', monospace; }

        .cf-glass {
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.8);
        }
        .dark .cf-glass {
          background: rgba(15,23,42,0.7);
          border: 1px solid rgba(255,255,255,0.06);
        }

        .cf-card {
          background: #fff;
          border: 1px solid #e8edf5;
          box-shadow: 0 1px 3px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06);
        }
        .dark .cf-card {
          background: #0f172a;
          border: 1px solid rgba(255,255,255,0.07);
          box-shadow: 0 1px 3px rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.3);
        }

        .cf-input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border-radius: 0.75rem;
          border: 1.5px solid #dde3ee;
          background: #f8fafc;
          font-size: 0.875rem;
          color: #0f172a;
          transition: border-color .15s, box-shadow .15s;
          outline: none;
          font-family: 'Sora', sans-serif;
        }
        .cf-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,.12);
          background: #fff;
        }
        .dark .cf-input {
          background: #1e293b;
          border-color: rgba(255,255,255,.1);
          color: #f1f5f9;
        }
        .dark .cf-input:focus {
          border-color: #818cf8;
          box-shadow: 0 0 0 3px rgba(129,140,248,.15);
          background: #1e293b;
        }

        .cf-label {
          display: block;
          font-size: .75rem;
          font-weight: 600;
          letter-spacing: .04em;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: .4rem;
        }
        .dark .cf-label { color: #94a3b8; }

        .cf-tab {
          position: relative;
          padding: .625rem 1.25rem;
          font-size: .875rem;
          font-weight: 500;
          border-radius: .75rem;
          transition: all .2s;
          cursor: pointer;
          border: none;
          background: transparent;
        }
        .cf-tab.active {
          background: #1d4ed8;
          color: #fff;
          box-shadow: 0 4px 14px rgba(29,78,216,.35);
        }
        .cf-tab:not(.active) { color: #64748b; }
        .cf-tab:not(.active):hover { background: #f1f5f9; color: #334155; }
        .dark .cf-tab:not(.active) { color: #94a3b8; }
        .dark .cf-tab:not(.active):hover { background: #1e293b; color: #cbd5e1; }

        .cf-btn-primary {
          display: inline-flex; align-items: center; gap: .5rem;
          padding: .75rem 1.75rem;
          background: #1d4ed8;
          color: #fff;
          font-weight: 600;
          font-size: .9rem;
          border-radius: .875rem;
          border: none;
          cursor: pointer;
          transition: opacity .15s, transform .15s, box-shadow .15s;
          box-shadow: 0 4px 16px rgba(29,78,216,.35);
          font-family: 'Sora', sans-serif;
        }
        .cf-btn-primary:hover:not(:disabled) {
          opacity: .92; transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(99,102,241,.45);
        }
        .cf-btn-primary:disabled { opacity: .55; cursor: not-allowed; }

        .cf-btn-ghost {
          display: inline-flex; align-items: center; gap: .5rem;
          padding: .75rem 1.5rem;
          background: transparent;
          color: #64748b;
          font-weight: 500;
          font-size: .9rem;
          border-radius: .875rem;
          border: 1.5px solid #dde3ee;
          cursor: pointer;
          transition: all .15s;
          text-decoration: none;
          font-family: 'Sora', sans-serif;
        }
        .cf-btn-ghost:hover { background: #f8fafc; border-color: #c7d0e0; color: #334155; }
        .dark .cf-btn-ghost {
          border-color: rgba(255,255,255,.1); color: #94a3b8;
        }
        .dark .cf-btn-ghost:hover { background: #1e293b; color: #cbd5e1; }

        .cf-drop-zone {
          border: 2px dashed #c7d2fe;
          border-radius: 1rem;
          background: #f5f3ff;
          padding: 2.5rem 1.5rem;
          text-align: center;
          cursor: pointer;
          transition: all .2s;
        }
        .cf-drop-zone:hover, .cf-drop-zone.over {
          border-color: #6366f1;
          background: #ede9fe;
        }
        .dark .cf-drop-zone {
          border-color: rgba(99,102,241,.3);
          background: rgba(99,102,241,.05);
        }
        .dark .cf-drop-zone:hover, .dark .cf-drop-zone.over {
          border-color: #818cf8;
          background: rgba(99,102,241,.1);
        }

        .cf-info-box {
          background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%);
          border: 1px solid #bfdbfe;
          border-radius: 1rem;
          padding: 1rem 1.25rem;
        }
        .dark .cf-info-box {
          background: linear-gradient(135deg, rgba(30,58,138,.2) 0%, rgba(20,83,45,.2) 100%);
          border-color: rgba(96,165,250,.2);
        }

        .cf-badge {
          display: inline-flex; align-items: center; gap: .3rem;
          padding: .2rem .6rem;
          border-radius: 999px;
          font-size: .7rem;
          font-weight: 600;
          letter-spacing: .03em;
        }
        .cf-badge-green { background: #dcfce7; color: #166534; }
        .cf-badge-amber { background: #fef3c7; color: #92400e; }
        .dark .cf-badge-green { background: rgba(22,163,74,.2); color: #86efac; }
        .dark .cf-badge-amber { background: rgba(217,119,6,.2); color: #fcd34d; }

        .cf-back-btn {
          display: inline-flex; align-items: center; gap: .5rem;
          padding: .5rem 1rem;
          border-radius: .75rem;
          font-size: .875rem;
          font-weight: 500;
          color: #6366f1;
          background: #eef2ff;
          border: none; cursor: pointer; text-decoration: none;
          transition: all .15s;
        }
        .cf-back-btn:hover { background: #e0e7ff; color: #4f46e5; }
        .dark .cf-back-btn { background: rgba(99,102,241,.15); color: #a5b4fc; }
        .dark .cf-back-btn:hover { background: rgba(99,102,241,.25); }

        .cf-section-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -.02em;
        }
        .dark .cf-section-title { color: #f1f5f9; }

        .cf-dot { width: 6px; height: 6px; border-radius: 50%; background: #6366f1; }

        @keyframes cf-spin {
          to { transform: rotate(360deg); }
        }
        .cf-spin { animation: cf-spin .8s linear infinite; }

        @keyframes cf-fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .cf-fade-up { animation: cf-fade-up .35s ease both; }
        .cf-delay-1 { animation-delay: .05s; }
        .cf-delay-2 { animation-delay: .1s; }
        .cf-delay-3 { animation-delay: .15s; }
      `}</style>

      <div className="cf-root min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 py-8">
        <div className="max-w-3xl mx-auto">

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="cf-fade-up flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/files" className="cf-back-btn">
                <FaArrowLeft className="h-3.5 w-3.5" />
                Retour
              </Link>
              <div className="flex items-center gap-2.5 ">
                <div className="cf-dot" />
                <h1 className="cf-section-title">
                  {activeTab === 'import' ? 'Importer un fichier' : 'Créer un fichier texte'}
                </h1>
              </div>
            </div>
          </div>

          {/* ── Banner ─────────────────────────────────────────────────────── */}
          <div className="cf-fade-up cf-delay-1">
            <Banner type={notificationType} message={notification} onClose={() => setNotification('')} />
          </div>

          {/* ── Tabs ───────────────────────────────────────────────────────── */}
          <div className="cf-fade-up cf-delay-1 cf-glass rounded-2xl p-1.5 inline-flex gap-1 mb-6 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab('import')}
              className={`cf-tab ${activeTab === 'import' ? 'active' : ''}`}
            >
              <span className="flex items-center gap-2">
                <FaCloudUploadAlt className="h-4 w-4" />
                Importer un fichier
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`cf-tab ${activeTab === 'create' ? 'active' : ''}`}
            >
              <span className="flex items-center gap-2">
                <FaPlus className="h-3.5 w-3.5" />
                Créer un fichier texte
              </span>
            </button>
          </div>

          {/* ── Info box ───────────────────────────────────────────────────── */}
          <div className="cf-fade-up cf-delay-2 cf-info-box mb-6">
            <div className="flex items-start gap-3">
              <FaInfoCircle className="mt-0.5 text-blue-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Formats éditables en ligne</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="cf-badge cf-badge-green"><FaFileCode className="h-3 w-3" /> .txt — éditable</span>
                  <span className="cf-badge cf-badge-amber"><FaFilePdf className="h-3 w-3" /> .pdf .docx .xlsx — télécharger pour modifier</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Form card ──────────────────────────────────────────────────── */}
          <div className="cf-fade-up cf-delay-3 cf-card rounded-2xl overflow-hidden">
            <form onSubmit={handleSubmit} className="p-7 space-y-6">

              {/* Name */}
              <div>
                <label className="cf-label" htmlFor="name">
                  Nom du fichier <span className="text-rose-400 normal-case font-normal">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="cf-input"
                  placeholder="ex: rapport-q3-2024"
                  required
                />
                {activeTab === 'create' && (
                  <p className="mt-1.5 text-xs text-slate-400 cf-mono">.txt ajouté automatiquement si absent</p>
                )}
                {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name}</p>}
              </div>

              {/* File / Content */}
              {activeTab === 'import' ? (
                <div>
                  <label className="cf-label">
                    Fichier à importer <span className="text-rose-400 normal-case font-normal">*</span>
                  </label>
                  <div
                    className={`cf-drop-zone ${dragOver ? 'over' : ''}`}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                    {file ? (
                      <div className="flex flex-col items-center gap-2">
                        <FileTypeIcon fileName={file.name} />
                        <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm mt-1">{file.name}</p>
                        <p className="text-xs text-slate-400 cf-mono">
                          {formatBytes(file.size)} &nbsp;·&nbsp; {file.type || 'type inconnu'}
                        </p>
                        <span className="cf-badge cf-badge-green mt-1">
                          <FaCheckCircle className="h-3 w-3" /> Prêt à l'envoi
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-14 w-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                          <FaCloudUploadAlt className="h-7 w-7 text-indigo-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-600 dark:text-slate-300 text-sm">
                            Glissez un fichier ici <span className="text-slate-400">ou</span>{' '}
                            <span className="text-indigo-500 underline underline-offset-2">parcourir</span>
                          </p>
                          <p className="text-xs text-slate-400 mt-1">PDF, DOCX, XLSX, images, TXT — max 100 Mo</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.file && <p className="mt-1 text-xs text-rose-500">{errors.file}</p>}
                </div>
              ) : (
                <div>
                  <label className="cf-label" htmlFor="fileContent">Contenu du fichier</label>
                  <div className="relative">
                    <textarea
                      id="fileContent"
                      ref={textareaRef}
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      className="cf-input cf-mono resize-none leading-relaxed"
                      style={{ minHeight: 260, maxHeight: 560 }}
                      placeholder="Saisissez le contenu de votre fichier texte…"
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-slate-400 cf-mono bg-white/80 dark:bg-slate-800/80 px-2 py-1 rounded-md">
                      {content.length} car.
                    </div>
                  </div>
                </div>
              )}

              {/* Project + Task row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="cf-label" htmlFor="project">
                    Projet <span className="text-rose-400 normal-case font-normal">*</span>
                  </label>
                  <select
                    id="project"
                    value={projectId}
                    onChange={e => setProjectId(e.target.value)}
                    className="cf-input"
                    required
                    disabled={!!urlProjectId}
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  {errors.project_id && <p className="mt-1 text-xs text-rose-500">{errors.project_id}</p>}
                </div>

                <div>
                  <label className="cf-label" htmlFor="task">Tâche liée</label>
                  <select
                    id="task"
                    value={taskId}
                    onChange={e => { setTaskId(e.target.value); if (!e.target.value) setKanbanId(''); }}
                    className="cf-input"
                  >
                    <option value="">Aucune tâche (optionnel)</option>
                    {tasks.map(t => (
                      <option key={t.id} value={t.id}>{t.title || `Tâche #${t.id}`}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Kanban */}
              <div>
                <label className="cf-label" htmlFor="kanban">
                  Tableau Kanban
                  {selectedTask?.sprint && (
                    <span className="ml-2 text-indigo-400 normal-case font-normal text-xs">
                      · sprint auto-sélectionné : {selectedTask.sprint.name}
                    </span>
                  )}
                </label>
                <select
                  id="kanban"
                  value={kanbanId}
                  onChange={e => setKanbanId(e.target.value)}
                  className="cf-input"
                >
                  <option value="">Aucun tableau (optionnel)</option>
                  {kanbans.map(k => (
                    <option key={k.id} value={k.id}>{k.name}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="cf-label" htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  className="cf-input resize-none"
                  placeholder="Décrivez brièvement ce fichier…"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={loading}
                  className="cf-btn-primary"
                >
                  {loading ? (
                    <>
                      <svg className="cf-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".25"/>
                        <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                      </svg>
                      Envoi en cours…
                    </>
                  ) : (
                    <>
                      <FaSave className="h-4 w-4" />
                      {activeTab === 'import' ? 'Importer le fichier' : 'Créer le fichier'}
                    </>
                  )}
                </button>

                <Link href="/files" className="cf-btn-ghost">
                  <FaTimes className="h-4 w-4" />
                  Annuler
                </Link>
              </div>

            </form>
          </div>
        </div>
      </div>
    </>
  );
}

const CreateWithLayout = (props) => <Create {...props} />;
CreateWithLayout.layout = (page) => <AdminLayout>{page}</AdminLayout>;
export default CreateWithLayout;