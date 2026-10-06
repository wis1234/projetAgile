import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
  FaArrowDown, FaArrowUp, FaBolt, FaCheckCircle, FaClock, FaCoins, FaExclamationTriangle, FaMicrophone, FaPause, FaPlay,
  FaRobot, FaSave, FaSearch, FaSyncAlt, FaTimes, FaTrash, FaUsers, FaCog, FaUserShield, FaFileAlt, FaProjectDiagram, FaChartBar,
} from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi2';

const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
async function call(url, { method = 'GET', body } = {}) {
  const res = await fetch(url, {
    method, credentials: 'same-origin',
    headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrf(), 'X-Requested-With': 'XMLHttpRequest', ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const first = data.errors ? Object.values(data.errors).flat()[0] : null;
    throw new Error(first || data.message || 'Opération impossible.');
  }
  return data;
}

const nf = new Intl.NumberFormat('fr-FR');
const compact = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)} M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)} k` : String(n || 0));
const ago = (iso) => {
  if (!iso) return '—';
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  return `il y a ${Math.floor(s / 86400)} j`;
};
const TOOL_LABELS = {
  my_overview: "Vue d'ensemble", list_projects: 'Liste des projets', get_project: 'Détails projet', list_tasks: 'Liste des tâches', get_task: 'Détails tâche',
  list_sprints: 'Sprints', search_users: 'Recherche de personnes', list_files: 'Liste des fichiers', read_file: 'Lecture de fichier', search_files_content: 'Recherche dans les fichiers',
  append_task_tracking: 'Écriture dans le suivi', create_task: 'Création de tâche', update_task: 'Modification de tâche', add_comment: 'Commentaire', delete_task: 'Suppression de tâche',
  add_project_member: 'Ajout de membre', change_member_role: 'Changement de rôle', remove_project_member: 'Retrait de membre', generate_report: 'Rapports', open_page: 'Liens',
};
const PAUSE_LABELS = { rate_limit: 'quota atteint', auth: 'clé refusée', credits: 'crédit épuisé', model: 'modèle introuvable', unavailable: 'indisponible' };

/* ───────────── Briques visuelles ───────────── */

function Card({ title, subtitle, icon: Icon, action, children, className = '' }) {
  return (
    <section className={`overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700/70 dark:bg-slate-800 ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-700/60">
          <div className="flex min-w-0 items-center gap-3">
            {Icon && <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300"><Icon /></span>}
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-slate-900 dark:text-white">{title}</h2>
              {subtitle && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
            </div>
          </div>
          {action}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

function Kpi({ icon: Icon, label, value, hint, tone = 'blue', trend }) {
  const tones = {
    blue: 'from-blue-500 to-indigo-600', emerald: 'from-emerald-500 to-teal-600', amber: 'from-amber-500 to-orange-600',
    violet: 'from-violet-500 to-fuchsia-600', rose: 'from-rose-500 to-red-600', cyan: 'from-cyan-500 to-sky-600',
  };
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-700/70 dark:bg-slate-800">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1.5 text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">{value}</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            {trend != null && (
              <span className={`inline-flex items-center gap-0.5 font-semibold ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {trend >= 0 ? <FaArrowUp className="text-[9px]" /> : <FaArrowDown className="text-[9px]" />}{Math.abs(trend)} %
              </span>
            )}
            {hint && <span className="truncate">{hint}</span>}
          </div>
        </div>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow ${tones[tone]}`}><Icon /></span>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, disabled, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500/25 disabled:opacity-50 ${checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

function Row({ title, hint, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="min-w-0"><p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</p>{hint && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}</div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

const numInput = 'w-28 rounded-lg border border-slate-300 bg-white px-3 py-2 text-right text-sm tabular-nums text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15 dark:border-slate-600 dark:bg-slate-900/60 dark:text-white';

/* ───────────── Graphiques SVG (sans dépendance) ───────────── */

function ActivityChart({ series }) {
  const [hover, setHover] = useState(null);
  const W = 720; const H = 220; const P = { l: 34, r: 8, t: 12, b: 26 };
  const max = Math.max(4, ...series.map((d) => d.success + d.failed));
  const step = (W - P.l - P.r) / Math.max(series.length, 1);
  const bw = Math.min(26, step * 0.62);
  const y = (v) => P.t + (H - P.t - P.b) * (1 - v / max);
  const ticks = [0, 0.5, 1].map((t) => Math.round(max * t));
  const label = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const every = series.length > 40 ? 8 : series.length > 20 ? 4 : series.length > 10 ? 2 : 1;
  const h = hover != null ? series[hover] : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-56 w-full" role="img" aria-label="Requêtes par jour">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} className="stroke-slate-200 dark:stroke-slate-700" strokeDasharray="3 4" />
            <text x={P.l - 8} y={y(t) + 4} textAnchor="end" className="fill-slate-400 text-[10px]">{t}</text>
          </g>
        ))}
        {series.map((d, i) => {
          const x = P.l + step * i + (step - bw) / 2;
          const hs = (H - P.t - P.b) * (d.success / max);
          const hf = (H - P.t - P.b) * (d.failed / max);
          return (
            <g key={d.date} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={P.l + step * i} y={P.t} width={step} height={H - P.t - P.b} fill="transparent" />
              <rect x={x} y={H - P.b - hs} width={bw} height={hs} rx="4" className={hover === i ? 'fill-blue-500' : 'fill-blue-400/90'} />
              <rect x={x} y={H - P.b - hs - hf} width={bw} height={hf} rx="4" className="fill-rose-400" />
              {i % every === 0 && <text x={x + bw / 2} y={H - 8} textAnchor="middle" className="fill-slate-400 text-[10px]">{label(d.date)}</text>}
            </g>
          );
        })}
      </svg>
      {h && (
        <div className="pointer-events-none absolute right-2 top-1 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur dark:border-slate-600 dark:bg-slate-900/95">
          <p className="font-bold text-slate-800 dark:text-white">{new Date(h.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <p className="text-blue-600 dark:text-blue-300">● {h.success} réussie(s)</p>
          <p className="text-rose-600 dark:text-rose-300">● {h.failed} en échec</p>
          {h.voice > 0 && <p className="text-violet-600 dark:text-violet-300">● {h.voice} dictée(s)</p>}
        </div>
      )}
      <div className="mt-1 flex items-center justify-center gap-5 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-blue-400" />Réussies</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-rose-400" />Échecs / bloquées</span>
      </div>
    </div>
  );
}

function Bars({ rows, color = 'bg-blue-500', format = (v) => nf.format(v), empty = 'Aucune donnée sur la période.' }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="py-6 text-center text-sm text-slate-400">{empty}</p>;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-xs">
            <span className="truncate font-medium text-slate-700 dark:text-slate-200">{r.label}</span>
            <span className="shrink-0 tabular-nums text-slate-500 dark:text-slate-400">{format(r.value)}{r.note ? ` · ${r.note}` : ''}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700"><div className={`h-full rounded-full ${r.color || color} transition-all duration-500`} style={{ width: `${(r.value / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

/* ───────────── Santé des fournisseurs ───────────── */

function ProviderCard({ p, onToggle, onMove, onTest, onReset, testing, first, last, result }) {
  const status = !p.configured ? ['Non configuré', 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300']
    : !p.enabled ? ['Désactivé', 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300']
    : p.paused ? [`En pause · ${PAUSE_LABELS[p.paused.code] || p.paused.code}`, 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300']
    : p.last && p.last.ok === false ? ['Dernier appel en échec', 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300']
    : ['Opérationnel', 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'];
  return (
    <div className={`rounded-2xl border p-4 transition ${p.enabled && p.configured ? 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800' : 'border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/30'}`}>
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-0.5">
          <button type="button" disabled={first} onClick={() => onMove(-1)} aria-label="Monter" className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-25 dark:hover:bg-slate-700"><FaArrowUp className="text-[10px]" /></button>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-extrabold text-white">{p.position}</span>
          <button type="button" disabled={last} onClick={() => onMove(1)} aria-label="Descendre" className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-25 dark:hover:bg-slate-700"><FaArrowDown className="text-[10px]" /></button>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{p.label}</h3>
            {p.free && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">Gratuit</span>}
          </div>
          <p className="truncate font-mono text-xs text-slate-500 dark:text-slate-400" title={p.model}>{p.model || '—'}</p>
          {p.name === 'groq' && p.configured && <p className="mt-1 text-[10px] text-slate-400" title={(p.catalog_models || []).map((m) => m.id).join(', ')}>{p.catalog_models?.length ? `${p.catalog_models.length} modèle(s) compatibles détectés · sélection auto` : (p.catalog_error || 'Catalogue Groq indisponible')}</p>}
          <span className={`mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${status[1]}`}>{status[0]}</span>
          {p.paused && <span className="ml-2 text-[11px] text-slate-400">reprise dans {Math.ceil(p.paused.seconds / 60)} min</span>}
          {p.last && p.last.ok === false && p.last.message && <p className="mt-2 line-clamp-2 text-[11px] text-rose-600/90 dark:text-rose-300/90">{p.last.message}</p>}
          {p.last_ok_at && <p className="mt-1 text-[11px] text-slate-400">Dernier succès {ago(p.last_ok_at)}</p>}
          {result && <p className={`mt-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium ${result.ok ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'}`}>{result.ok ? `✓ ${result.message} (${result.ms} ms)` : `✗ ${result.message}`}</p>}
        </div>
        <Toggle checked={p.enabled} onChange={onToggle} disabled={!p.configured} label={`Activer ${p.label}`} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3 dark:border-slate-700/60">
        <button type="button" disabled={!p.configured || testing} onClick={onTest} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">
          {testing ? <FaSyncAlt className="animate-spin" /> : <FaPlay className="text-[9px]" />} Tester
        </button>
        {p.paused && <button type="button" onClick={onReset} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"><FaPause className="text-[9px]" /> Reprendre maintenant</button>}
      </div>
    </div>
  );
}

/* ───────────── Page ───────────── */

export default function AssistantAdmin({ settings: initialSettings, providers: initialProviders, transcriptionProviders = [], stats: initialStats, users: initialUsers }) {
  const [tab, setTab] = useState('overview');
  const [settings, setSettings] = useState(initialSettings);
  const [savedSettings, setSavedSettings] = useState(initialSettings);
  const [providers, setProviders] = useState(initialProviders);
  const [stats, setStats] = useState(initialStats);
  const [days, setDays] = useState(initialStats.days);
  const [loadingStats, setLoadingStats] = useState(false);
  const [users, setUsers] = useState(initialUsers.map((u) => ({ ...u, draftLimit: u.daily_limit ?? '', draftEnabled: u.enabled })));
  const [query, setQuery] = useState('');
  const [onlyActive, setOnlyActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingUser, setSavingUser] = useState(null);
  const [testing, setTesting] = useState(null);
  const [tests, setTests] = useState({});
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const notify = useCallback((type, message) => {
    setToast({ type, message });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4200);
  }, []);

  const dirty = useMemo(() => JSON.stringify(settings) !== JSON.stringify(savedSettings), [settings, savedSettings]);
  const set = (k, v) => setSettings((s) => ({ ...s, [k]: v }));

  // Rafraîchit statistiques + santé des fournisseurs
  const loadStats = useCallback(async (d) => {
    setLoadingStats(true);
    try { setStats(await call(`/assistant/admin/stats?days=${d}`)); setDays(d); } catch (e) { notify('error', e.message); } finally { setLoadingStats(false); }
  }, [notify]);

  useEffect(() => { // la pause des fournisseurs évolue : on resynchronise l'écran régulièrement
    const t = setInterval(() => { if (!document.hidden && tab === 'overview') loadStats(days); }, 60000);
    return () => clearInterval(t);
  }, [tab, days, loadStats]);

  /* Fournisseurs : l'ordre/activation fait partie des réglages enregistrés */
  const orderedProviders = useMemo(() => settings.provider_order
    .map((name, i) => { const p = providers.find((x) => x.name === name); return p && { ...p, position: i + 1, enabled: settings.enabled_providers.includes(name) }; })
    .filter(Boolean), [settings.provider_order, settings.enabled_providers, providers]);

  const toggleProvider = (name, on) => set('enabled_providers', on ? [...new Set([...settings.enabled_providers, name])] : settings.enabled_providers.filter((n) => n !== name));
  const moveProvider = (name, dir) => {
    const order = [...settings.provider_order]; const i = order.indexOf(name); const j = i + dir;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]]; set('provider_order', order);
  };
  const testProvider = async (name) => {
    setTesting(name);
    try { const r = await call(`/assistant/admin/providers/${name}/test`, { method: 'POST' }); setTests((t) => ({ ...t, [name]: r })); if (r.providers) setProviders(r.providers); }
    catch (e) { setTests((t) => ({ ...t, [name]: { ok: false, message: e.message } })); } finally { setTesting(null); }
  };
  const resetProvider = async (name) => {
    try { const r = await call(`/assistant/admin/providers/${name}/reset`, { method: 'POST' }); setProviders(r.providers); notify('success', 'Fournisseur remis en service.'); } catch (e) { notify('error', e.message); }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await call('/assistant/admin/settings', { method: 'PUT', body: settings });
      setSavedSettings(settings); notify('success', 'Configuration enregistrée.');
    } catch (e) { notify('error', e.message); } finally { setSaving(false); }
  };

  const saveUser = async (u, patch = {}) => {
    const draftEnabled = patch.draftEnabled ?? u.draftEnabled;
    const draftLimit = patch.draftLimit ?? u.draftLimit;
    setSavingUser(u.id);
    try {
      await call(`/assistant/admin/users/${u.id}`, { method: 'PUT', body: { enabled: draftEnabled, daily_limit: draftLimit === '' ? null : Number(draftLimit) } });
      setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, draftEnabled, draftLimit, enabled: draftEnabled, daily_limit: draftLimit === '' ? null : Number(draftLimit), effective_limit: draftLimit === '' ? settings.daily_limit : Number(draftLimit) } : x)));
      notify('success', `Quota de ${u.name} enregistré.`);
    } catch (e) { notify('error', e.message); } finally { setSavingUser(null); }
  };

  const purge = async () => {
    const d = settings.retention_days;
    if (!window.confirm(`Supprimer l'historique d'usage de plus de ${d} jours ?`)) return;
    try { const r = await call('/assistant/admin/logs', { method: 'DELETE', body: { days: d } }); notify('success', r.message); loadStats(days); } catch (e) { notify('error', e.message); }
  };

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) && (!onlyActive || u.requests_7d > 0 || u.requests_today > 0));
  }, [users, query, onlyActive]);

  const t = stats.totals;
  const healthy = orderedProviders.filter((p) => p.configured && p.enabled && !p.paused).length;
  const tabs = [['overview', 'Vue d’ensemble', FaChartBar], ['providers', 'Modèles d’IA', FaRobot], ['users', 'Utilisateurs & quotas', FaUsers], ['settings', 'Réglages', FaCog]];

  return (
    <div className="min-h-screen bg-slate-50 pb-28 dark:bg-slate-900">
      <Head title="Assistant IA · Administration" />

      {/* En-tête */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-indigo-400/20" />
        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4 text-white">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-2xl ring-1 ring-white/25 backdrop-blur"><HiSparkles /></span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-100/80">Administration</p>
                <h1 className="text-2xl font-bold sm:text-3xl">Assistant IA</h1>
                <p className="mt-0.5 text-sm text-blue-100">Usage, quotas, modèles et capacités de l’assistant ProJA.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold ${settings.enabled ? 'bg-emerald-400/20 text-emerald-50 ring-1 ring-emerald-300/40' : 'bg-rose-400/20 text-rose-50 ring-1 ring-rose-300/40'}`}>
                <i className={`h-2 w-2 rounded-full ${settings.enabled ? 'bg-emerald-300' : 'bg-rose-300'}`} />{settings.enabled ? 'Assistant actif' : 'Assistant désactivé'}
              </span>
              <Link href="/assistant" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-lg hover:bg-blue-50"><HiSparkles /> Ouvrir l’assistant</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto -mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Onglets */}
        <div role="tablist" className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-lg [scrollbar-width:none] dark:border-slate-700/70 dark:bg-slate-800 [&::-webkit-scrollbar]:hidden">
          {tabs.map(([id, label, Icon]) => (
            <button key={id} role="tab" aria-selected={tab === id} type="button" onClick={() => setTab(id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${tab === id ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'}`}>
              <Icon className="text-[13px]" />{label}
              {id === 'providers' && <span className={`ml-1 rounded-full px-1.5 text-[10px] font-bold ${tab === id ? 'bg-white/25' : 'bg-slate-200 dark:bg-slate-600'}`}>{healthy}/{orderedProviders.length}</span>}
            </button>
          ))}
        </div>

        {/* ── Vue d'ensemble ── */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Activité sur {days} jours</h2>
              <div className="flex items-center gap-2">
                {loadingStats && <FaSyncAlt className="animate-spin text-slate-400" />}
                <div className="inline-flex rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800">
                  {[7, 14, 30, 90].map((d) => <button key={d} type="button" onClick={() => loadStats(d)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${days === d ? 'bg-white text-blue-700 shadow dark:bg-slate-600 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>{d} j</button>)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Kpi icon={HiSparkles} label="Requêtes" value={nf.format(t.requests)} trend={t.trend_pct} hint={`${stats.today.requests} aujourd’hui`} />
              <Kpi icon={FaCheckCircle} tone="emerald" label="Taux de réussite" value={t.success_rate == null ? '—' : `${t.success_rate} %`} hint={`${t.failed} échec(s)`} />
              <Kpi icon={FaClock} tone="amber" label="Temps moyen" value={t.avg_ms ? `${(t.avg_ms / 1000).toFixed(1)} s` : '—'} hint="par réponse" />
              <Kpi icon={FaUsers} tone="violet" label="Utilisateurs actifs" value={t.active_users} hint={`${t.conversations} conversation(s)`} />
              <Kpi icon={FaCoins} tone="cyan" label="Jetons consommés" value={compact(t.tokens_in + t.tokens_out)} hint={`${compact(t.tokens_in)} entrée · ${compact(t.tokens_out)} sortie`} />
              <Kpi icon={FaMicrophone} tone="rose" label="Dictées vocales" value={t.voice} hint={`${t.via_voice} message(s) dicté(s)`} />
              <Kpi icon={FaBolt} tone="amber" label="Bascules" value={t.fallbacks} hint="secours automatiques" />
              <Kpi icon={FaExclamationTriangle} tone="rose" label="Bloquées (quota)" value={t.blocked} hint="limite quotidienne" />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2" title="Requêtes par jour" subtitle="Réussies et en échec" icon={FaChartBar}><ActivityChart series={stats.series} /></Card>
              <Card title="Répartition par modèle" subtitle="Réponses réussies" icon={FaRobot}>
                <Bars rows={stats.by_provider.map((p) => ({ label: p.provider, value: p.requests, note: p.avg_ms ? `${(p.avg_ms / 1000).toFixed(1)} s` : '' }))} />
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card title="Capacités les plus utilisées" subtitle="Appels d’outils" icon={FaBolt}>
                <Bars color="bg-violet-500" rows={stats.tools.map((x) => ({ label: TOOL_LABELS[x.tool] || x.tool, value: x.count }))} empty="Aucun outil utilisé sur la période." />
              </Card>
              <Card title="Utilisateurs les plus actifs" icon={FaUsers}>
                <Bars color="bg-emerald-500" rows={stats.top_users.map((u) => ({ label: u.name, value: u.requests, note: ago(u.last_at) }))} />
              </Card>
              <Card title="Erreurs récentes" icon={FaExclamationTriangle}>
                {stats.recent_errors.length === 0 ? <p className="py-6 text-center text-sm text-slate-400">Aucune erreur 🎉</p> : (
                  <ul className="space-y-3">
                    {stats.recent_errors.map((e) => (
                      <li key={e.id} className="rounded-xl bg-rose-50/60 p-3 text-xs dark:bg-rose-500/5">
                        <div className="flex justify-between gap-2"><span className="font-semibold text-slate-700 dark:text-slate-200">{e.user || '—'}</span><span className="text-slate-400">{ago(e.at)}</span></div>
                        <p className="mt-1 line-clamp-2 text-rose-700 dark:text-rose-300">{e.status === 'blocked' ? 'Limite quotidienne atteinte' : e.reason || 'Erreur inconnue'}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* ── Modèles ── */}
        {tab === 'providers' && (
          <div className="space-y-6">
            <Card title="Ordre de bascule" icon={FaRobot} subtitle="Le premier modèle disponible répond ; en cas de panne ou de quota atteint, le suivant prend le relais automatiquement.">
              <div className="grid gap-4 md:grid-cols-2">
                {orderedProviders.map((p, i) => (
                  <ProviderCard key={p.name} p={p} first={i === 0} last={i === orderedProviders.length - 1} testing={testing === p.name} result={tests[p.name]}
                    onToggle={(on) => toggleProvider(p.name, on)} onMove={(d) => moveProvider(p.name, d)} onTest={() => testProvider(p.name)} onReset={() => resetProvider(p.name)} />
                ))}
              </div>
              <div className="mt-5 rounded-xl bg-blue-50 p-4 text-xs leading-relaxed text-blue-900 dark:bg-blue-500/10 dark:text-blue-200">
                <p className="font-semibold">Continuité du service</p>
                Placez en tête vos modèles gratuits, et gardez un modèle payant en dernier recours (ou l’inverse pour privilégier la qualité). Un modèle dont le quota est atteint est mis en pause quelques minutes, puis réessayé automatiquement.
                Les clés se renseignent dans le fichier <code className="rounded bg-white/60 px-1 dark:bg-slate-900/40">.env</code> (jamais dans l’interface). N’oubliez pas d’enregistrer après modification de l’ordre.
              </div>
            </Card>
            <Card title="Transcription vocale" icon={FaMicrophone} subtitle="Services utilisés pour convertir les messages vocaux en texte">
              {transcriptionProviders.some((p) => p.available) ? <div className="flex flex-wrap gap-2">{transcriptionProviders.map((n) => <span key={n.name} title={n.model} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{n.name}{!n.available && ' · clé manquante'}</span>)}</div>
                : <p className="text-sm text-amber-700 dark:text-amber-300">Aucun service de transcription configuré : la saisie vocale est indisponible (clé Groq ou OpenAI requise).</p>}
            </Card>
          </div>
        )}

        {/* ── Utilisateurs ── */}
        {tab === 'users' && (
          <Card title="Quotas par utilisateur" icon={FaUsers} subtitle={`Limite par défaut : ${settings.daily_limit} requêtes/jour — laissez vide pour l’appliquer.`}
            action={<div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs text-slate-500"><Toggle checked={onlyActive} onChange={setOnlyActive} label="Seulement les actifs" /><span className="hidden sm:inline">Actifs</span></label>
            </div>}>
            <div className="relative mb-4">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un utilisateur…" className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15 dark:border-slate-600 dark:bg-slate-900/60 dark:text-white" />
            </div>
            <div className="-mx-5 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <tr><th className="px-5 py-2.5">Utilisateur</th><th className="px-3 py-2.5">Aujourd’hui</th><th className="px-3 py-2.5 text-center">7 jours</th><th className="px-3 py-2.5">Dernier usage</th><th className="px-3 py-2.5">Limite / jour</th><th className="px-3 py-2.5 text-center">Accès</th><th className="px-5 py-2.5" /></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {filteredUsers.map((u) => {
                    const limit = u.draftLimit === '' ? settings.daily_limit : Number(u.draftLimit);
                    const pct = limit > 0 ? Math.min(100, Math.round((u.requests_today / limit) * 100)) : 100;
                    const changed = String(u.draftLimit) !== String(u.daily_limit ?? '') || u.draftEnabled !== u.enabled;
                    return (
                      <tr key={u.id} className={u.draftEnabled ? '' : 'bg-slate-50/70 opacity-70 dark:bg-slate-900/30'}>
                        <td className="px-5 py-3"><p className="font-semibold text-slate-900 dark:text-white">{u.name}</p><p className="text-xs text-slate-500">{u.email}</p></td>
                        <td className="min-w-[9rem] px-3 py-3">
                          <div className="flex items-center justify-between text-xs tabular-nums text-slate-600 dark:text-slate-300"><span>{u.requests_today} / {limit}</span><span>{pct} %</span></div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700"><div className={`h-full rounded-full ${pct >= 100 ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} /></div>
                        </td>
                        <td className="px-3 py-3 text-center tabular-nums text-slate-600 dark:text-slate-300">{u.requests_7d}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-500">{ago(u.last_used_at)}</td>
                        <td className="px-3 py-3"><input type="number" min="0" max="10000" value={u.draftLimit} placeholder={String(settings.daily_limit)} onChange={(e) => setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, draftLimit: e.target.value } : x)))} className={numInput} aria-label={`Limite de ${u.name}`} /></td>
                        <td className="px-3 py-3 text-center"><Toggle checked={u.draftEnabled} onChange={(v) => setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, draftEnabled: v } : x)))} label={`Accès de ${u.name}`} /></td>
                        <td className="px-5 py-3 text-right"><button type="button" disabled={!changed || savingUser === u.id} onClick={() => saveUser(u)} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-30"><FaSave /> {savingUser === u.id ? '…' : 'Enregistrer'}</button></td>
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400">Aucun utilisateur trouvé.</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ── Réglages ── */}
        {tab === 'settings' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Général" icon={FaCog}>
              <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                <Row title="Assistant activé" hint="Coupe l’assistant pour tout le monde."><Toggle checked={settings.enabled} onChange={(v) => set('enabled', v)} label="Assistant activé" /></Row>
                <Row title="Requêtes par jour (défaut)" hint="Limite appliquée à chaque utilisateur sans quota personnalisé."><input type="number" min="0" max="10000" value={settings.daily_limit} onChange={(e) => set('daily_limit', Number(e.target.value))} className={numInput} /></Row>
                <Row title="Longueur maximale d’un message" hint="Caractères."><input type="number" min="200" max="8000" value={settings.max_message_chars} onChange={(e) => set('max_message_chars', Number(e.target.value))} className={numInput} /></Row>
                <Row title="Étapes max par demande" hint="Appels d’outils enchaînés (1 à 15)."><input type="number" min="1" max="15" value={settings.max_steps} onChange={(e) => set('max_steps', Number(e.target.value))} className={numInput} /></Row>
                <Row title="Longueur max d’une réponse" hint="Jetons."><input type="number" min="128" max="32000" value={settings.max_tokens} onChange={(e) => set('max_tokens', Number(e.target.value))} className={numInput} /></Row>
                <Row title="Délai d’attente d’un modèle" hint="Secondes."><input type="number" min="10" max="300" value={settings.timeout} onChange={(e) => set('timeout', Number(e.target.value))} className={numInput} /></Row>
              </div>
            </Card>

            <Card title="Capacités de l’assistant" icon={FaUserShield} subtitle="Ce que l’IA a le droit de faire — toujours dans la limite des droits de l’utilisateur.">
              <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                <Row title="Lire les fichiers" hint="Documents, Word, Excel, PowerPoint, PDF accessibles à l’utilisateur."><Toggle checked={settings.files_read_enabled} onChange={(v) => set('files_read_enabled', v)} label="Lire les fichiers" /></Row>
                <Row title="Écrire dans le suivi des tâches" hint="Ajout de notes datées dans le fichier de suivi (version restaurable)."><Toggle checked={settings.files_write_enabled} onChange={(v) => set('files_write_enabled', v)} label="Écrire dans les fichiers" /></Row>
                <Row title="Gérer les membres" hint="Ajouter, changer le rôle, retirer (avec confirmation)."><Toggle checked={settings.members_manage_enabled} onChange={(v) => set('members_manage_enabled', v)} label="Gérer les membres" /></Row>
                <Row title="Rapports d’activité" hint="Bilans par équipe, projet ou personne."><Toggle checked={settings.reports_enabled} onChange={(v) => set('reports_enabled', v)} label="Rapports" /></Row>
                <Row title="Messages vocaux" hint="Dictée transcrite en texte."><Toggle checked={settings.voice_enabled} onChange={(v) => set('voice_enabled', v)} label="Messages vocaux" /></Row>
                <Row title="Dictées par jour" hint="Par utilisateur."><input type="number" min="0" max="5000" value={settings.voice_daily_limit} onChange={(e) => set('voice_daily_limit', Number(e.target.value))} className={numInput} /></Row>
              </div>
            </Card>

            <Card className="lg:col-span-2" title="Consignes de l’organisation" icon={FaFileAlt} subtitle="Ajoutées au comportement de l’assistant (ton, vocabulaire, règles internes). 2000 caractères max.">
              <textarea rows={5} maxLength={2000} value={settings.custom_instructions || ''} onChange={(e) => set('custom_instructions', e.target.value)} placeholder="Ex. : Toujours vouvoyer. Pour les rapports, commencer par les risques. Nos sprints durent 2 semaines…"
                className="w-full resize-y rounded-xl border border-slate-300 bg-white p-3.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15 dark:border-slate-600 dark:bg-slate-900/60 dark:text-white" />
              <p className="mt-1 text-right text-xs text-slate-400">{(settings.custom_instructions || '').length} / 2000</p>
            </Card>

            <Card className="lg:col-span-2" title="Conservation des données" icon={FaTrash} subtitle="L’historique d’usage (statistiques) est purgé automatiquement chaque nuit. Les conversations restent la propriété de chaque utilisateur.">
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">Conserver <input type="number" min="7" max="3650" value={settings.retention_days} onChange={(e) => set('retention_days', Number(e.target.value))} className={numInput} /> jours</label>
                <button type="button" onClick={purge} className="inline-flex items-center gap-2 rounded-xl border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-300 dark:hover:bg-rose-500/10"><FaTrash className="text-xs" /> Purger maintenant</button>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Barre d'enregistrement flottante */}
      {dirty && (
        <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
          <div className="flex w-full max-w-xl items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 pl-5 shadow-2xl backdrop-blur dark:border-slate-600 dark:bg-slate-800/95">
            <p className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">Modifications non enregistrées</p>
            <button type="button" onClick={() => setSettings(savedSettings)} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700">Annuler</button>
            <button type="button" onClick={saveSettings} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow hover:bg-blue-700 disabled:opacity-60"><FaSave /> {saving ? 'Enregistrement…' : 'Enregistrer'}</button>
          </div>
        </div>
      )}

      {toast && (
        <div role="status" className={`fixed right-4 top-20 z-50 flex max-w-sm items-start gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-xl ${toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}>
          <span className="flex-1">{toast.message}</span><button type="button" onClick={() => setToast(null)} aria-label="Fermer"><FaTimes /></button>
        </div>
      )}
    </div>
  );
}

AssistantAdmin.layout = (page) => <AdminLayout children={page} />;
