import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import {
  FaTasks, FaCalendarAlt, FaVideo, FaQuestionCircle, FaFileAlt, FaCommentDots, FaBolt,
  FaChevronRight, FaChevronDown, FaCheckCircle, FaEllipsisH, FaTimes, FaCrown, FaShieldAlt,
  FaUser, FaTrash, FaUserPlus, FaRocket, FaFileExport, FaProjectDiagram, FaLock, FaEye,
  FaEyeSlash, FaSpinner, FaExclamationTriangle, FaChartLine, FaGlobe, FaExternalLinkAlt,
  FaEdit, FaPlus, FaUsers, FaClipboardList, FaFilePdf,
} from 'react-icons/fa';
import MobileLayout from '@/Layouts/MobileLayout';
import Avatar from '@/Components/Quiz/Avatar';
import ZoomMeeting from '@/Components/ZoomMeeting';
import LiveKitCallModal from '@/Components/LiveKitCallModal';
import ScheduledCallsModal from '@/Components/ScheduledCallsModal';
import { MHero, MCard, MPill, MSectionTitle, MSegmented, MEmpty, MFab, safeRoute, asList, listTotal } from '@/Components/Mobile/kit';

/* ────────────────────────────────────────────────────────────────────────────
 * Helpers
 * ──────────────────────────────────────────────────────────────────────────── */

const cx = (...a) => a.filter(Boolean).join(' ');

const CARD = 'rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 dark:bg-slate-800 dark:ring-slate-700';
const TAP = 'transition-transform active:scale-[0.97]';
const stripTags = (s) => String(s ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const getFreshCsrfToken = async () => {
  try {
    const res = await fetch('/csrf-token', { credentials: 'include' });
    const data = await res.json();
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) metaTag.setAttribute('content', data.token);
    return data.token;
  } catch {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
  }
};

const statusMeta = (status, t) =>
  ({ todo: [t('status_todo'), 'slate'], in_progress: [t('status_in_progress'), 'blue'], done: [t('status_done'), 'green'] }[status] || [status, 'slate']);

const priorityMeta = (priority, t) =>
  ({ high: [t('priority.high'), 'red'], medium: [t('priority.medium'), 'amber'], low: [t('priority.low'), 'green'] }[String(priority || '').toLowerCase()] || null);

const shortDate = (v, lng) => (v ? new Date(v).toLocaleDateString(lng, { day: '2-digit', month: 'short' }) : '—');

/* ────────────────────────────────────────────────────────────────────────────
 * Appels ProJA Meet (LiveKit) : même logique que la version web, isolée dans un hook
 * ──────────────────────────────────────────────────────────────────────────── */

function useProjectCall(projectId, userId) {
  const [active, setActive] = useState(false);
  const [open, setOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [isInitiator, setIsInitiator] = useState(false);

  const post = useCallback(async (action) => {
    const token = await getFreshCsrfToken();
    return fetch(`/projects/${projectId}/livekit-call/${action}`, {
      method: 'POST',
      headers: { 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': token },
    });
  }, [projectId]);

  const refreshStatus = useCallback(() => (
    fetch(`/projects/${projectId}/livekit-call/status`)
      .then((r) => r.json())
      .then((d) => setActive(!!d.active))
      .catch(() => {})
  ), [projectId]);

  const joinOrStart = useCallback(async () => {
    setOpen(true);
    try {
      const res = await post('join-or-start');
      const data = await res.json();
      setActive(true);
      setIsInitiator(!!data.isInitiator);
      if (data.inviteUrl) setInviteLink(data.inviteUrl);
    } catch (err) {
      console.error('Erreur appel:', err);
    }
  }, [post]);

  // Auto-join quand on arrive depuis un lien d'invitation (?join-call=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('join-call') !== '1') return;
    joinOrStart();
    post('answered').catch(() => {});
    window.history.replaceState({}, '', window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Statut : toutes les 60 s, et dès que l'app revient au premier plan (fréquent sur mobile)
  useEffect(() => {
    refreshStatus();
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') refreshStatus();
    }, 60000);
    const onVisible = () => { if (document.visibilityState === 'visible') refreshStatus(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refreshStatus]);

  // Temps réel (Echo) : on retire uniquement nos écouteurs pour ne pas couper
  // les autres abonnements du canal user.{id} (notifications, etc.)
  useEffect(() => {
    if (!window.Echo || !userId) return;
    const channel = window.Echo.private(`user.${userId}`);
    const matches = (e) => String(e.projectId) === String(projectId);
    const onStarted = (e) => { if (matches(e)) setActive(true); };
    const onEnded = (e) => { if (matches(e)) setActive(false); };
    channel.listen('.livekit.call.started', onStarted);
    channel.listen('.livekit.call.ended', onEnded);
    channel.listen('.livekit.call.answered', onStarted);
    return () => {
      channel.stopListening('.livekit.call.started', onStarted);
      channel.stopListening('.livekit.call.ended', onEnded);
      channel.stopListening('.livekit.call.answered', onStarted);
    };
  }, [userId, projectId]);

  const answered = useCallback(() => { post('answered').catch(() => {}); }, [post]);

  const close = useCallback(async () => {
    setOpen(false);
    setInviteLink('');
    if (isInitiator) {
      try { await post('end'); } catch { /* ignore */ }
    }
    refreshStatus();
  }, [isInitiator, post, refreshStatus]);

  return { active, open, inviteLink, isInitiator, joinOrStart, answered, close };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Bottom sheet : remplace les modales centrées du web (pouce, geste, clavier)
 * ──────────────────────────────────────────────────────────────────────────── */

function BottomSheet({ show, onClose, title, icon, children, footer, tall = false, flush = false }) {
  const [mounted, setMounted] = useState(show);
  const [entered, setEntered] = useState(false);
  const [dragY, setDragY] = useState(0);
  const startY = useRef(null);

  useEffect(() => {
    if (show) {
      setMounted(true);
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
      return () => cancelAnimationFrame(id);
    }
    setEntered(false);
    const tm = setTimeout(() => { setMounted(false); setDragY(0); }, 260);
    return () => clearTimeout(tm);
  }, [show]);

  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [mounted]);

  useEffect(() => {
    if (!show) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [show, onClose]);

  if (!mounted || typeof document === 'undefined') return null;

  const onTouchStart = (e) => { startY.current = e.touches[0].clientY; };
  const onTouchMove = (e) => {
    if (startY.current == null) return;
    setDragY(Math.max(0, e.touches[0].clientY - startY.current));
  };
  const onTouchEnd = () => {
    const shouldClose = dragY > 110;
    startY.current = null;
    setDragY(0);
    if (shouldClose) onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className={cx('absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] transition-opacity duration-200', entered ? 'opacity-100' : 'opacity-0')}
        onClick={onClose}
      />
      <div
        data-no-ptr
        className={cx(
          'absolute inset-x-0 bottom-0 flex flex-col rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900',
          tall ? 'h-[92dvh]' : 'max-h-[88dvh]'
        )}
        style={{
          transform: entered ? `translateY(${dragY}px)` : 'translateY(100%)',
          transition: startY.current != null ? 'none' : 'transform 260ms cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        <div
          className="flex-shrink-0 touch-none px-5 pb-2 pt-2.5"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex min-w-0 items-center gap-2 text-base font-extrabold text-slate-900 dark:text-white">
              {icon}<span className="truncate">{title}</span>
            </h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className={cx('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300', TAP)}
            >
              <FaTimes />
            </button>
          </div>
        </div>

        <div
          className={cx(
            'min-h-0 flex-1 overflow-y-auto overscroll-contain',
            flush ? '' : 'px-5',
            footer ? 'pb-4' : 'pb-[max(1.25rem,env(safe-area-inset-bottom))]'
          )}
        >
          {children}
        </div>

        {footer && (
          <div className="flex-shrink-0 border-t border-slate-100 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 dark:border-slate-800">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Petits composants
 * ──────────────────────────────────────────────────────────────────────────── */

const RoleIcon = ({ role, className = 'text-xs' }) => {
  if (role === 'admin') return <FaShieldAlt className={cx('text-red-500', className)} aria-label="Admin" />;
  if (role === 'manager') return <FaCrown className={cx('text-amber-500', className)} aria-label="Manager" />;
  return <FaUser className={cx('text-blue-500', className)} aria-label="Membre" />;
};

const LiveBadge = () => (
  <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> En cours
  </span>
);

const SectionHead = ({ title, right }) => (
  <div className="mb-2 flex items-center justify-between gap-3">
    <MSectionTitle>{title}</MSectionTitle>
    {right}
  </div>
);

const SmallLink = ({ href, children, tone = 'soft' }) => (
  <Link
    href={href}
    className={cx(
      'inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold',
      TAP,
      tone === 'primary'
        ? 'bg-indigo-600 text-white'
        : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
    )}
  >
    {children}
  </Link>
);

function Collapsible({ icon, title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={CARD}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex min-h-[54px] w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="text-blue-500">{icon}</span>
        <span className="flex-1 text-sm font-bold text-slate-900 dark:text-white">{title}</span>
        <FaChevronDown className={cx('text-xs text-slate-400 transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && <div className="border-t border-slate-100 px-4 pb-4 pt-3 dark:border-slate-700">{children}</div>}
    </section>
  );
}

function StatTile({ icon, label, value, tone, onClick, href }) {
  const inner = (
    <>
      <span className={cx('flex h-9 w-9 items-center justify-center rounded-xl text-base', tone)}>{icon}</span>
      <span className="mt-2 block text-2xl font-extrabold leading-none text-slate-900 dark:text-white">{value ?? 0}</span>
      <span className="mt-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">{label}</span>
    </>
  );
  const cls = cx(CARD, TAP, 'block w-[7.25rem] flex-shrink-0 snap-start p-3 text-left');
  if (href) return <Link href={href} className={cls}>{inner}</Link>;
  return <button type="button" onClick={onClick} className={cls}>{inner}</button>;
}

function ActionRow({ icon: Icon, label, hint, href, onClick, tone = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300', external = false, danger = false }) {
  const body = (
    <>
      <span className={cx('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl', danger ? 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400' : tone)}>
        <Icon className="text-sm" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cx('block text-sm font-semibold', danger ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white')}>{label}</span>
        {hint && <span className="block text-xs text-slate-500 dark:text-slate-400">{hint}</span>}
      </span>
      {!danger && <FaChevronRight className="text-xs text-slate-300" />}
    </>
  );
  const cls = cx('flex min-h-[56px] w-full items-center gap-3 rounded-2xl px-2 py-2 text-left active:bg-slate-100 dark:active:bg-slate-800');
  if (href && external) return <a href={href} target="_blank" rel="noopener noreferrer" className={cls} onClick={onClick}>{body}</a>;
  if (href) return <Link href={href} className={cls} onClick={onClick}>{body}</Link>;
  return <button type="button" onClick={onClick} className={cls}>{body}</button>;
}

const GroupLabel = ({ children }) => (
  <p className="px-2 pb-1 pt-4 text-xs font-bold text-slate-400 dark:text-slate-500">{children}</p>
);

function TaskRow({ task, t, lng }) {
  const [sl, st] = statusMeta(task.status, t);
  const pr = priorityMeta(task.priority, t);
  const done = task.status === 'done';
  const desc = stripTags(task.description);
  return (
    <MCard href={`/tasks/${task.id}`} className="!p-3.5">
      <div className="flex items-start gap-3">
        <span className={cx('mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full', done ? 'bg-emerald-500 text-white' : 'border-2 border-slate-300 text-transparent')}>
          <FaCheckCircle className="text-xs" />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className={cx('text-sm font-bold leading-snug', done ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white')}>{task.title}</h4>
          {desc && <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">{desc}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <MPill tone={st}>{sl}</MPill>
            {pr && <MPill tone={pr[1]}>{pr[0]}</MPill>}
            {task.due_date && (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                <FaCalendarAlt className="text-[10px]" />{shortDate(task.due_date, lng)}
              </span>
            )}
          </div>
        </div>
        {task.assigned_user && <Avatar name={task.assigned_user.name} src={task.assigned_user.profile_photo_url} size="md" />}
        <FaChevronRight className="mt-1.5 text-xs text-slate-300" />
      </div>
    </MCard>
  );
}

/* ── Graphique d'évolution (Chart.js chargé à la demande pour garder la page légère) ── */
function TrendChart({ labels, total, done, totalLabel, doneLabel }) {
  const [Line, setLine] = useState(null);

  useEffect(() => {
    let alive = true;
    Promise.all([import('chart.js/auto'), import('react-chartjs-2')])
      .then(([, mod]) => { if (alive) setLine(() => mod.Line); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  if (!Line) {
    return <div className="flex h-56 items-center justify-center text-slate-400"><FaSpinner className="animate-spin" /></div>;
  }

  const data = {
    labels,
    datasets: [
      { label: totalLabel, data: total, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.08)', borderWidth: 2, tension: 0.3, fill: true, pointRadius: 0, pointHoverRadius: 4 },
      { label: doneLabel, data: done, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)', borderWidth: 2, tension: 0.3, fill: true, pointRadius: 0, pointHoverRadius: 4 },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, font: { size: 11 } } } },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 5, maxRotation: 0, font: { size: 10 } } },
      y: { beginAtZero: true, ticks: { precision: 0, font: { size: 10 } } },
    },
  };
  return <div className="h-56" data-no-ptr><Line data={data} options={options} /></div>;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Sheets métier
 * ──────────────────────────────────────────────────────────────────────────── */

function CommentStatsSheet({ show, onClose, commentsByMember = [] }) {
  const sorted = useMemo(() => [...commentsByMember].sort((a, b) => b.count - a.count), [commentsByMember]);
  const max = sorted[0]?.count || 1;
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <BottomSheet show={show} onClose={onClose} title="Contribution aux discussions" icon={<FaCommentDots className="text-amber-500" />}>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Commentaires postés par membre sur les tâches de ce projet.</p>
      {sorted.length === 0 ? (
        <p className="py-10 text-center text-sm italic text-slate-400">Aucun commentaire n'a encore été posté sur ce projet.</p>
      ) : (
        <ul className="space-y-3">
          {sorted.map((m, i) => (
            <li key={m.user?.id ?? i} className="flex items-center gap-3">
              <span className="w-7 text-center text-xl">{medals[i] || <span className="text-xs font-bold text-slate-400">{i + 1}</span>}</span>
              <Avatar name={m.user?.name || 'Inconnu'} src={m.user?.profile_photo_url} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">{m.user?.name || 'Inconnu'}</span>
                  <span className="flex-shrink-0 text-xs font-bold text-slate-600 dark:text-slate-300">{m.count} commentaire{m.count !== 1 ? 's' : ''}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                  <div
                    className={cx('h-full rounded-full', i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-700' : 'bg-blue-500')}
                    style={{ width: `${(m.count / max) * 100}%` }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </BottomSheet>
  );
}

function ConsentSheet({ show, onClose, members, onSubmit, loading, errors }) {
  const [pw, setPw] = useState({});
  const [visible, setVisible] = useState({});
  const filled = members.filter((u) => (pw[u.id] || '').length > 0).length;
  const allFilled = members.length > 0 && filled === members.length;

  const close = () => { setPw({}); setVisible({}); onClose(); };

  return (
    <BottomSheet
      show={show}
      onClose={close}
      tall
      title="Consentement de tous les membres"
      icon={<FaExclamationTriangle className="text-red-500" />}
      footer={
        <div className="flex gap-3">
          <button type="button" onClick={close} disabled={loading} className={cx('min-h-[48px] flex-1 rounded-xl bg-slate-100 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200', TAP)}>
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onSubmit(pw)}
            disabled={loading || !allFilled}
            className={cx('inline-flex min-h-[48px] flex-[1.4] items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-semibold text-white disabled:opacity-50', TAP)}
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaTrash />}
            {loading ? 'Vérification…' : 'Confirmer la suppression'}
          </button>
        </div>
      }
    >
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Vous ne pouvez pas supprimer ce projet seul. Chaque membre doit saisir son propre mot de passe pour donner son accord.
        Le projet ne sera supprimé que si <strong>tous</strong> les membres consentent.
      </p>

      {errors?.consent && (
        <div role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {errors.consent}
        </div>
      )}

      <div className="mt-4">
        <div className="mb-1.5 flex justify-between text-xs font-semibold text-slate-500">
          <span>Accords saisis</span><span>{filled} / {members.length}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full rounded-full bg-red-500 transition-all" style={{ width: `${members.length ? (filled / members.length) * 100 : 0}%` }} />
        </div>
      </div>

      <ul className="mt-4 space-y-3">
        {members.map((u) => (
          <li key={u.id} className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60">
            <div className="flex items-center gap-3">
              <Avatar name={u.name} src={u.profile_photo_url} size="md" />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900 dark:text-white">{u.name}</span>
              {(pw[u.id] || '').length > 0 && <FaCheckCircle className="text-emerald-500" />}
            </div>
            <div className="relative mt-2.5">
              <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
              {/* text-base (16px) : évite le zoom automatique d'iOS au focus */}
              <input
                type={visible[u.id] ? 'text' : 'password'}
                autoComplete="new-password"
                value={pw[u.id] || ''}
                onChange={(e) => setPw((p) => ({ ...p, [u.id]: e.target.value }))}
                placeholder="Mot de passe du compte"
                className={cx(
                  'h-12 w-full rounded-xl border bg-white pl-9 pr-12 text-base focus:outline-none focus:ring-2 focus:ring-red-400 dark:bg-slate-900 dark:text-white',
                  errors?.[u.id] ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'
                )}
              />
              <button
                type="button"
                onClick={() => setVisible((v) => ({ ...v, [u.id]: !v[u.id] }))}
                aria-label={visible[u.id] ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-slate-400"
              >
                {visible[u.id] ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors?.[u.id] && <p className="mt-1.5 text-xs text-red-600">{errors[u.id]}</p>}
          </li>
        ))}
      </ul>
    </BottomSheet>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Page
 * ──────────────────────────────────────────────────────────────────────────── */

export default function MobileProjectShow({ project, tasks: tasksProp = [], sprints: sprintsProp = [], quizzes = [], auth: authProp, stats = {} }) {
  const { t, i18n } = useTranslation();
  const lng = i18n.language || 'fr';
  const { flash = {}, auth: authShared } = usePage().props;
  const auth = authProp || authShared || {};
  const pid = project.id;

  // Permissions : rôles système (Spatie) comme sur le web, + rôle du membre dans ce projet
  const roles = Array.isArray(auth?.user?.roles) ? auth.user.roles : [];
  const isAdmin = roles.includes('admin');
  const isManager = roles.includes('manager');
  const canManage = isAdmin || isManager || ['manager', 'admin'].includes(auth?.user?.role);

  const [tab, setTab] = useState('tasks');
  const [sheet, setSheet] = useState(null); // 'actions' | 'comments' | 'zoom' | 'delete' | 'consent'
  const [showScheduled, setShowScheduled] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [descOpen, setDescOpen] = useState(false);
  const [csrfToken, setCsrfToken] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [consentLoading, setConsentLoading] = useState(false);
  const [consentErrors, setConsentErrors] = useState({});
  const [flashVisible, setFlashVisible] = useState(!!flash.success);
  const tabsRef = useRef(null);

  const call = useProjectCall(pid, auth?.user?.id);

  useEffect(() => { getFreshCsrfToken().then(setCsrfToken); }, []);
  useEffect(() => {
    if (!flash.success) return;
    setFlashVisible(true);
    const id = setTimeout(() => setFlashVisible(false), 5000);
    return () => clearTimeout(id);
  }, [flash.success]);

  // Données (tasks / sprints arrivent paginés : { data: [...] })
  const tasks = asList(tasksProp);
  const sprints = asList(sprintsProp);
  const tasksTotal = listTotal(tasksProp) || tasks.length;
  const sprintsTotal = listTotal(sprintsProp) || sprints.length;
  const quizzesTotal = stats.quizzesCount ?? quizzes.length;
  const total = stats.totalTasks ?? tasksTotal;
  const done = stats.doneTasksCount ?? tasks.filter((x) => x.status === 'done').length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const members = project.users || [];

  const sortedTasks = useMemo(() => [...tasks].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)), [tasks]);
  const displayedTasks = showAllTasks ? sortedTasks : sortedTasks.slice(0, 5);

  // Évolution sur 30 jours (mêmes règles que le web)
  const trend = useMemo(() => {
    const days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return d.toISOString().split('T')[0];
    });
    let cumTotal = 0;
    let cumDone = 0;
    const totalSeries = [];
    const doneSeries = [];
    days.forEach((day) => {
      const list = tasks.filter((x) => x.created_at && new Date(x.created_at).toISOString().split('T')[0] === day);
      cumTotal += list.length;
      cumDone += list.filter((x) => x.status === 'done').length;
      totalSeries.push(cumTotal);
      doneSeries.push(cumDone);
    });
    return {
      labels: days.map((d) => new Date(d).toLocaleDateString(lng, { day: '2-digit', month: '2-digit' })),
      total: totalSeries,
      done: doneSeries,
    };
  }, [tasks, lng]);

  // Routes
  const R = {
    quizzes: safeRoute('projects.quizzes.index', pid, `/projects/${pid}/quizzes`),
    quizCreate: safeRoute('projects.quizzes.create', pid, `/projects/${pid}/quizzes/create`),
    tasks: safeRoute('tasks.index', { project_id: pid }, `/tasks?project_id=${pid}`),
    taskCreate: safeRoute('tasks.create', { project_id: pid }, `/tasks/create?project_id=${pid}`),
    sprints: safeRoute('sprints.index', { project_id: pid }, `/sprints?project_id=${pid}`),
    sprintCreate: safeRoute('projects.sprints.create', { project: pid }, `/projects/${pid}/sprints/create`),
    memberCreate: safeRoute('project-users.create', { project_id: pid }, `/project-users/create?project_id=${pid}`),
    members: safeRoute('project-users.show', pid, `/project-users/${pid}`),
    edit: safeRoute('projects.edit', pid, `/projects/${pid}/edit`),
    files: `/files?project_id=${pid}`,
  };

  const goTasks = () => {
    setTab('tasks');
    tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Suppression : admin système = confirmation directe, sinon consentement de tous les membres
  const handleDeleteClick = () => {
    if (isAdmin) {
      setSheet('delete');
    } else {
      setConsentErrors({});
      setSheet('consent');
    }
  };

  const handleDelete = () => {
    setDeleteLoading(true);
    router.delete(safeRoute('projects.destroy', pid, `/projects/${pid}`), {
      onSuccess: () => { setDeleteLoading(false); setSheet(null); },
      onError: () => setDeleteLoading(false),
      onFinish: () => setDeleteLoading(false),
    });
  };

  const handleConsentSubmit = (passwords) => {
    setConsentLoading(true);
    setConsentErrors({});
    router.delete(safeRoute('projects.destroy.consent', pid, `/projects/${pid}/destroy-with-consent`), {
      data: { passwords },
      preserveScroll: true,
      onSuccess: () => { setConsentLoading(false); setSheet(null); },
      onError: (errors) => { setConsentLoading(false); setConsentErrors(errors); },
      onFinish: () => setConsentLoading(false),
    });
  };

  // FAB contextuel selon l'onglet actif
  const fab =
    tab === 'sprints' ? { href: R.sprintCreate, label: t('add_sprint'), text: 'Sprint' }
    : tab === 'quiz' && canManage ? { href: R.quizCreate, label: 'Nouveau Quiz', text: 'Quiz' }
    : { href: R.taskCreate, label: t('new_task'), text: 'Tâche' };

  const createdLabel = project.created_at
    ? new Date(project.created_at).toLocaleDateString(lng, { day: '2-digit', month: 'long', year: 'numeric' })
    : '';

  const desc = project.description || '';
  const descLong = desc.length > 200;

  return (
    <MobileLayout
      title={project.name}
      backHref="/projects"
      headerRight={
        <button
          type="button"
          onClick={() => setSheet('actions')}
          aria-label="Actions du projet"
          className={cx('flex h-10 w-10 items-center justify-center rounded-full text-slate-500', TAP)}
        >
          <FaEllipsisH />
        </button>
      }
    >
      <Head title={project.name} />

      <div className="space-y-4 py-4 pb-28">
        {/* Message flash */}
        {flash.success && flashVisible && (
          <div role="status" className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
            <FaCheckCircle className="mt-0.5 flex-shrink-0" />
            <span className="flex-1">{flash.success}</span>
            <button type="button" onClick={() => setFlashVisible(false)} aria-label="Fermer" className="-m-2 flex h-9 w-9 items-center justify-center"><FaTimes className="text-xs" /></button>
          </div>
        )}

        {/* Hero + avancement */}
        <MHero eyebrow={createdLabel ? `Projet · ${createdLabel}` : 'Projet'} title={project.name} tone="from-indigo-600 to-blue-700">
          <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-white/90"><span>Avancement</span><span>{pct}%</span></div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/20" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
        </MHero>

        {/* Appels & réunions */}
        <section className={cx(CARD, 'divide-y divide-slate-100 dark:divide-slate-700')} aria-label="Appels et réunions">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <span className={cx('flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-white transition-colors', call.active ? 'bg-emerald-600' : 'bg-blue-600')}><FaVideo /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">ProJA Meet</h3>
                  {call.active && <LiveBadge />}
                </div>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {call.active ? 'Un appel est en cours sur ce projet' : "Jusqu'à 100 participants simultanés"}
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={call.joinOrStart}
                className={cx('inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white', TAP, call.active ? 'bg-emerald-600' : 'bg-blue-600')}
              >
                <FaVideo className="text-xs" /> {call.active ? "Rejoindre l'appel" : 'Démarrer un appel'}
              </button>
              <button
                type="button"
                onClick={() => setShowScheduled(true)}
                aria-label="Appels programmés"
                className={cx('flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 dark:border-slate-600 dark:text-slate-300', TAP)}
              >
                <FaCalendarAlt />
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white"><FaVideo /></span>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Réunions Zoom</h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Planifier ou consulter les réunions</p>
              </div>
              <button
                type="button"
                onClick={() => setSheet('zoom')}
                className={cx('min-h-[44px] rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200', TAP)}
              >
                Ouvrir
              </button>
            </div>
          </div>
        </section>

        {/* Statistiques (défilement horizontal, chaque tuile est cliquable) */}
        <div className="scrollbar-hide -mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1" data-no-ptr>
          <StatTile icon={<FaTasks />} label="Tâches" value={total} tone="bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400" onClick={goTasks} />
          <StatTile icon={<FaBolt />} label={t('tasks_in_progress')} value={stats.inProgressTasksCount} tone="bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400" onClick={goTasks} />
          <StatTile icon={<FaCheckCircle />} label={t('completed_tasks')} value={done} tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400" onClick={goTasks} />
          <StatTile icon={<FaFileAlt />} label={t('files')} value={stats.filesCount} tone="bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400" href={R.files} />
          <StatTile icon={<FaCommentDots />} label={t('comments')} value={stats.commentsCount} tone="bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400" onClick={() => setSheet('comments')} />
          <StatTile icon={<FaQuestionCircle />} label="Quiz" value={quizzesTotal} tone="bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400" href={R.quizzes} />
        </div>

        {/* Description + lien de réunion */}
        <section className={cx(CARD, 'p-4')}>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <FaClipboardList className="text-blue-500" /> {t('project_description_label')}
          </h3>
          {desc ? (
            <>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {descOpen || !descLong ? desc : `${desc.slice(0, 200)}…`}
              </p>
              {descLong && (
                <button
                  type="button"
                  onClick={() => setDescOpen((o) => !o)}
                  className="mt-1 inline-flex min-h-[40px] items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400"
                >
                  <FaChevronDown className={cx('text-xs transition-transform', descOpen && 'rotate-180')} />
                  {descOpen ? 'Voir moins' : 'Voir plus'}
                </button>
              )}
            </>
          ) : (
            <p className="text-sm italic text-slate-500">{t('no_description')}</p>
          )}
          {project.meeting_link && (
            <a
              href={project.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className={cx('mt-3 flex min-h-[52px] items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-2.5 dark:border-blue-800 dark:bg-blue-900/20', TAP)}
            >
              <FaGlobe className="flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-blue-900 dark:text-blue-200">{t('meeting_link_title')}</span>
                <span className="block truncate text-xs text-blue-600 dark:text-blue-400">{project.meeting_link}</span>
              </span>
              <FaExternalLinkAlt className="flex-shrink-0 text-xs text-blue-500" />
            </a>
          )}
        </section>

        {/* Équipe */}
        {members.length > 0 && (
          <div>
            <SectionHead
              title={`${t('project_members')} · ${members.length}`}
              right={<Link href={R.members} className="inline-flex min-h-[36px] items-center text-xs font-semibold text-blue-600 dark:text-blue-400">{t('view_all')}</Link>}
            />
            <div className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-1" data-no-ptr>
              {members.map((m) => {
                const role = m.pivot?.role || m.role;
                return (
                  <Link key={m.id} href={R.members} className="flex w-16 flex-shrink-0 flex-col items-center gap-1 text-center">
                    <span className="relative">
                      <Avatar name={m.name} src={m.profile_photo_url} size="lg" ring="ring-2 ring-white dark:ring-slate-800" />
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow ring-1 ring-slate-100 dark:bg-slate-800 dark:ring-slate-700">
                        <RoleIcon role={role} className="text-[10px]" />
                      </span>
                    </span>
                    <span className="line-clamp-1 w-full text-[10px] font-semibold text-slate-600 dark:text-slate-300">{m.name?.split(' ')[0]}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Onglets : Tâches / Sprints / Quiz */}
        <div ref={tabsRef} className="scroll-mt-16">
          <MSegmented
            value={tab}
            onChange={setTab}
            options={[
              { value: 'tasks', label: t('tasks_section_title'), count: tasksTotal },
              { value: 'sprints', label: t('sprints'), count: sprintsTotal },
              { value: 'quiz', label: 'Quiz', count: quizzesTotal },
            ]}
          />
        </div>

        {tab === 'tasks' && (
          <div className="space-y-2">
            <div className="flex justify-end gap-2">
              <SmallLink href={R.tasks}><FaEye className="text-[10px]" /> Voir tout</SmallLink>
              <SmallLink href={R.taskCreate} tone="primary"><FaPlus className="text-[10px]" /> {t('new_task')}</SmallLink>
            </div>
            {tasks.length === 0 ? (
              <MEmpty icon={FaTasks} title={t('no_tasks_for_project')} text="Créez la première tâche avec le bouton ci-dessous." />
            ) : (
              <>
                {displayedTasks.map((task) => <TaskRow key={task.id} task={task} t={t} lng={lng} />)}
                {sortedTasks.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setShowAllTasks((s) => !s)}
                    className={cx('flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-slate-100 text-sm font-semibold text-blue-600 dark:bg-slate-800 dark:text-blue-400', TAP)}
                  >
                    {showAllTasks ? t('show_less') : `${t('show_all_tasks')} (${sortedTasks.length})`}
                    <FaChevronDown className={cx('text-xs transition-transform', showAllTasks && 'rotate-180')} />
                  </button>
                )}
                {tasksTotal > tasks.length && (
                  <Link href={R.tasks} className={cx('flex min-h-[48px] w-full items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200', TAP)}>
                    Voir les {tasksTotal} tâches
                  </Link>
                )}
              </>
            )}
          </div>
        )}

        {tab === 'sprints' && (
          <div className="space-y-2">
            <div className="flex justify-end gap-2">
              <SmallLink href={R.sprints}><FaEye className="text-[10px]" /> Voir tout</SmallLink>
              <SmallLink href={R.sprintCreate} tone="primary"><FaRocket className="text-[10px]" /> {t('add_sprint')}</SmallLink>
            </div>
            {sprints.length === 0 ? (
              <MEmpty icon={FaBolt} title="Aucun sprint" text="Planifiez le premier sprint de ce projet." />
            ) : (
              <>
                {sprints.map((s) => (
                  <MCard key={s.id} href={`/sprints/${s.id}`} className="!p-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950"><FaBolt /></span>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-bold text-slate-900 dark:text-white">{s.name}</h4>
                        <p className="text-xs text-slate-500"><FaCalendarAlt className="mr-1 inline text-[10px]" />{shortDate(s.start_date, lng)} → {shortDate(s.end_date, lng)}</p>
                        {s.goal && <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">{s.goal}</p>}
                      </div>
                      <FaChevronRight className="text-xs text-slate-300" />
                    </div>
                  </MCard>
                ))}
                {sprintsTotal > sprints.length && (
                  <Link href={R.sprints} className={cx('flex min-h-[48px] w-full items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200', TAP)}>
                    Voir les {sprintsTotal} sprints
                  </Link>
                )}
              </>
            )}
          </div>
        )}

        {tab === 'quiz' && (
          <div className="space-y-2">
            <div className="flex justify-end gap-2">
              <SmallLink href={R.quizzes}><FaEye className="text-[10px]" /> Voir tout</SmallLink>
              {canManage && <SmallLink href={R.quizCreate} tone="primary"><FaPlus className="text-[10px]" /> Nouveau Quiz</SmallLink>}
            </div>
            {quizzes.length === 0 ? (
              <MEmpty icon={FaQuestionCircle} title="Aucun quiz" text="Aucun quiz disponible pour ce projet." />
            ) : (
              quizzes.slice(0, 4).map((quiz) => (
                <MCard key={quiz.id} href={safeRoute('projects.quizzes.show', [pid, quiz.id], `/projects/${pid}/quizzes/${quiz.id}`)} className="!p-3.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950"><FaQuestionCircle /></span>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-bold text-slate-900 dark:text-white">{quiz.title}</h4>
                      <p className="text-xs text-slate-500">{quiz.duration_minutes} min · {quiz.questions_count ?? 0} questions</p>
                    </div>
                    <span className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">Accéder</span>
                  </div>
                </MCard>
              ))
            )}
          </div>
        )}

        {/* Progression par membre */}
        {members.length > 0 && (
          <Collapsible icon={<FaUsers />} title={t('tasks_completed_by_member')} defaultOpen>
            <ul className="space-y-3.5">
              {(showAllMembers ? members : members.slice(0, 5)).map((u) => {
                const userDone = stats.doneTasksByUser?.[u.id] ?? 0;
                const percent = stats.totalTasks ? (userDone / stats.totalTasks) * 100 : 0;
                return (
                  <li key={u.id} className="flex items-center gap-3">
                    <Avatar name={u.name} src={u.profile_photo_url} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">{u.name}</span>
                        <RoleIcon role={u.pivot?.role || u.role} />
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                    <span className="w-6 text-right text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{userDone}</span>
                  </li>
                );
              })}
            </ul>
            {members.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAllMembers((s) => !s)}
                className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400"
              >
                {showAllMembers ? t('show_less') : `${t('view_all')} (${members.length})`}
                <FaChevronDown className={cx('text-xs transition-transform', showAllMembers && 'rotate-180')} />
              </button>
            )}
          </Collapsible>
        )}

        {/* Évolution des tâches (chargée à l'ouverture) */}
        <Collapsible icon={<FaChartLine />} title={t('tasks_evolution')}>
          <TrendChart labels={trend.labels} total={trend.total} done={trend.done} totalLabel={t('total_tasks')} doneLabel={t('completed_tasks')} />
        </Collapsible>
      </div>

      <MFab href={fab.href} label={fab.label}><FaPlus /> {fab.text}</MFab>

      {/* ── Feuille d'actions (équivalent des « Actions rapides » du web) ── */}
      <BottomSheet show={sheet === 'actions'} onClose={() => setSheet(null)} title={t('quick_actions')}>
        <GroupLabel>Créer</GroupLabel>
        <ActionRow icon={FaTasks} label={t('add_task')} href={R.taskCreate} tone="bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400" onClick={() => setSheet(null)} />
        <ActionRow icon={FaRocket} label={t('add_sprint')} href={R.sprintCreate} tone="bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400" onClick={() => setSheet(null)} />
        <ActionRow icon={FaUserPlus} label={t('add_member')} href={R.memberCreate} tone="bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400" onClick={() => setSheet(null)} />

        <GroupLabel>{t('export')}</GroupLabel>
        <ActionRow icon={FaFileAlt} label="Log Format TXT" hint="Suivi global du projet" href={`/projects/${pid}/suivi-global/txt`} external tone="bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400" onClick={() => setSheet(null)} />
        <ActionRow icon={FaFilePdf} label="Planning PDF" hint="Sprints et échéances" href={`/projects/${pid}/planning/pdf`} external tone="bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400" onClick={() => setSheet(null)} />

        {canManage && (
          <>
            <GroupLabel>Gérer</GroupLabel>
            <ActionRow icon={FaEdit} label={t('edit_project')} href={R.edit} tone="bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400" onClick={() => setSheet(null)} />
            <div className="my-2 border-t border-slate-100 dark:border-slate-800" />
            <ActionRow
              icon={FaTrash}
              danger
              label={t('delete_project')}
              hint={!isAdmin ? 'Nécessite le consentement de tous les membres' : undefined}
              onClick={handleDeleteClick}
            />
          </>
        )}
      </BottomSheet>

      {/* ── Suppression directe (admin système) ── */}
      <BottomSheet
        show={sheet === 'delete'}
        onClose={() => setSheet(null)}
        title={t('delete_project_title')}
        icon={<FaExclamationTriangle className="text-red-500" />}
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={() => setSheet(null)} disabled={deleteLoading} className={cx('min-h-[48px] flex-1 rounded-xl bg-slate-100 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200', TAP)}>
              {t('cancel')}
            </button>
            <button type="button" onClick={handleDelete} disabled={deleteLoading} className={cx('inline-flex min-h-[48px] flex-[1.4] items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-semibold text-white disabled:opacity-60', TAP)}>
              {deleteLoading ? <FaSpinner className="animate-spin" /> : <FaTrash />}
              {deleteLoading ? t('deleting') : t('delete_project_permanently')}
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">{t('delete_project_confirm', { name: project.name })}</p>
        <p className="mt-2 text-xs text-slate-400">Suppression directe en tant qu'administrateur système.</p>
      </BottomSheet>

      {/* ── Suppression avec consentement des membres (manager non-admin) ── */}
      <ConsentSheet
        show={sheet === 'consent'}
        onClose={() => setSheet(null)}
        members={members}
        onSubmit={handleConsentSubmit}
        loading={consentLoading}
        errors={consentErrors}
      />

      <CommentStatsSheet show={sheet === 'comments'} onClose={() => setSheet(null)} commentsByMember={stats.commentsByMember || []} />

      {/* ── Zoom ── */}
      <BottomSheet show={sheet === 'zoom'} onClose={() => setSheet(null)} title="Réunions Zoom" icon={<FaVideo className="text-blue-500" />} tall flush>
        <ZoomMeeting project={project} />
      </BottomSheet>

      <ScheduledCallsModal show={showScheduled} onClose={() => setShowScheduled(false)} projectId={pid} csrfToken={csrfToken} />

      {call.open && (
        <LiveKitCallModal
          tokenEndpoint={`/projects/${pid}/livekit-token`}
          inviteLink={call.inviteLink}
          muteEndpoint={`/projects/${pid}/livekit-call/mute-participant`}
          isHost={call.isInitiator || isAdmin || isManager}
          skipIncomingScreen={true}
          title={project.name}
          onAnswered={call.answered}
          onClose={call.close}
        />
      )}
    </MobileLayout>
  );
}