import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Avatar from '@/Components/Quiz/Avatar';
import QuizModal from '@/Components/Quiz/QuizModal';
import { fmtNumber } from '@/Components/Quiz/ScoreBadge';
import {
  FaArrowLeft, FaCheckCircle, FaClock, FaLock, FaSearch, FaEyeSlash, FaEye, FaForward, FaSave, FaSpinner,
  FaListUl, FaTimes, FaExclamationTriangle, FaUserSecret, FaPenFancy, FaCheck, FaSyncAlt, FaCalendarAlt, FaStopwatch,
} from 'react-icons/fa';

const QUICK_COMMENTS = [
  'Excellente réponse.',
  'Correct mais incomplet.',
  'Manque d\'exemples concrets.',
  'Hors sujet.',
  'Notions à revoir.',
];

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const scoreTone = (value, max) => {
  const r = value / max;
  if (r >= 0.7) return 'bg-emerald-500 border-emerald-500 text-white';
  if (r >= 0.5) return 'bg-amber-500 border-amber-500 text-white';
  return 'bg-red-500 border-red-500 text-white';
};

/* ───────────────────────── Liste des copies ───────────────────────── */

function CopyList({ copies, currentId, anonymous, onOpen, onClose }) {
  const [tab, setTab] = useState('todo');
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return copies.filter((c) => {
      if (tab === 'todo' && c.status === 'graded') return false;
      if (tab === 'done' && c.status !== 'graded') return false;
      if (!term) return true;
      return anonymous
        ? c.reference.toLowerCase().includes(term)
        : `${c.name} ${c.reference}`.toLowerCase().includes(term);
    });
  }, [copies, tab, q, anonymous]);

  const counts = {
    todo: copies.filter((c) => c.status !== 'graded').length,
    done: copies.filter((c) => c.status === 'graded').length,
    all: copies.length,
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-100 dark:border-gray-700 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FaListUl className="text-purple-500" /> Copies
          </h2>
          {onClose && (
            <button onClick={onClose} className="lg:hidden p-1.5 text-gray-500"><FaTimes /></button>
          )}
        </div>

        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-900/60 rounded-xl text-xs font-semibold">
          {[
            ['todo', 'À corriger'],
            ['done', 'Corrigées'],
            ['all', 'Toutes'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-1.5 rounded-lg transition ${
                tab === key ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {label} <span className="opacity-60">({counts[key]})</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-900/60 rounded-xl">
          <FaSearch className="text-gray-400 text-xs" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={anonymous ? 'Référence (ex. C-0012)' : 'Nom ou référence'}
            className="flex-1 min-w-0 bg-transparent border-0 p-0 text-xs focus:ring-0 dark:text-white"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700/60">
        {filtered.length === 0 && (
          <p className="p-6 text-center text-xs text-gray-400">Aucune copie dans cette vue.</p>
        )}
        {filtered.map((c) => {
          const active = c.id === currentId;
          const disabled = c.status === 'locked';
          return (
            <button
              key={c.id}
              onClick={() => !disabled && onOpen(c.id)}
              disabled={disabled}
              className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition ${
                active ? 'bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500' : 'border-l-4 border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/40'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {anonymous ? (
                <span className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 flex items-center justify-center flex-shrink-0"><FaUserSecret /></span>
              ) : (
                <Avatar name={c.name} src={c.photo} size="sm" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {anonymous ? `Copie ${c.reference}` : c.name}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  {anonymous ? fmtDate(c.submitted_at) : `${c.reference} · ${fmtDate(c.submitted_at)}`}
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                {c.status === 'graded' && (
                  <span className="inline-flex flex-col items-end text-emerald-600 dark:text-emerald-400">
                    <FaCheckCircle />
                    <span className="text-[10px] font-bold">{fmtNumber(c.points, 1)}/{c.points_max}</span>
                  </span>
                )}
                {c.status === 'pending' && (
                  <span className="text-amber-500" title={c.is_mine ? 'Réservée pour vous' : 'À corriger'}>
                    <FaClock />
                  </span>
                )}
                {c.status === 'locked' && (
                  <span className="inline-flex flex-col items-end text-gray-400" title={`En cours chez ${c.locked_by}`}>
                    <FaLock />
                    <span className="text-[10px] max-w-[4.5rem] truncate">{c.locked_by}</span>
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────── Formulaire de correction d'une copie ───────────────────────── */

function ScorePicker({ value, max, onChange, invalid, disabled }) {
  const chips = max <= 12 ? Array.from({ length: max + 1 }, (_, i) => i) : [];
  return (
    <div className={`space-y-2 ${invalid ? 'ring-2 ring-red-300 dark:ring-red-800 rounded-xl p-2 -m-2' : ''}`}>
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((n) => (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => onChange(n)}
              className={`w-9 h-9 rounded-lg border text-sm font-bold transition ${
                value === n
                  ? scoreTone(n, max)
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-purple-400 hover:text-purple-600'
              } disabled:opacity-50`}
            >
              {n}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          max={max}
          disabled={disabled}
          value={value ?? ''}
          onChange={(e) => {
            const v = e.target.value === '' ? null : Math.max(0, Math.min(max, parseInt(e.target.value, 10) || 0));
            onChange(v);
          }}
          placeholder="—"
          className="w-20 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white text-sm text-center font-bold focus:border-purple-500 focus:ring-purple-500"
        />
        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">/ {max}</span>
      </div>
    </div>
  );
}

function GradingForm({ current, project, quiz, maxScore, exclude, readOnly, anonymous, onLost }) {
  const storageKey = `proja:grading:${quiz.id}:${current.id}`;
  const handled = useRef(false);

  const [grades, setGrades] = useState(() => {
    const base = Object.fromEntries(
      current.responses.map((r) => [r.id, { score: r.score ?? null, comment: r.comment || '' }])
    );
    try {
      const draft = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (draft && !current.already_graded) {
        Object.keys(base).forEach((id) => {
          if (draft[id]) base[id] = { ...base[id], ...draft[id] };
        });
      }
    } catch {
      /* brouillon local illisible : ignoré */
    }
    return base;
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const topRef = useRef(null);

  // Brouillon local : une coupure réseau ou une fermeture d'onglet ne fait pas perdre le travail en cours.
  useEffect(() => {
    if (readOnly) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(grades));
    } catch {
      /* stockage indisponible */
    }
  }, [grades, storageKey, readOnly]);

  // Réservation de la copie : renouvelée toutes les 60 s, libérée si l'on quitte sans enregistrer.
  useEffect(() => {
    if (readOnly) return undefined;

    const beat = setInterval(async () => {
      try {
        await axios.post(route('projects.quizzes.grading.heartbeat', [project.id, quiz.id, current.id]));
      } catch (e) {
        if (e.response?.status === 409) onLost();
      }
    }, 60000);

    const release = () => {
      if (handled.current) return;
      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      const body = new FormData();
      if (token) body.append('_token', token);
      navigator.sendBeacon?.(route('projects.quizzes.grading.release', [project.id, quiz.id, current.id]), body);
    };
    window.addEventListener('pagehide', release);

    return () => {
      clearInterval(beat);
      window.removeEventListener('pagehide', release);
      if (!handled.current) {
        axios.post(route('projects.quizzes.grading.release', [project.id, quiz.id, current.id])).catch(() => {});
      }
    };
  }, [current.id, readOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  const setGrade = (id, patch) => {
    setGrades((g) => ({ ...g, [id]: { ...g[id], ...patch } }));
    setErrors((e) => ({ ...e, [id]: undefined }));
  };

  const maxTotal = current.responses.length * maxScore;
  const total = current.responses.reduce((sum, r) => sum + (grades[r.id]?.score ?? 0), 0);
  const gradedCount = current.responses.filter((r) => grades[r.id]?.score !== null && grades[r.id]?.score !== undefined).length;
  const percent = maxTotal > 0 ? (total / maxTotal) * 100 : 0;

  const save = useCallback(() => {
    if (readOnly || saving) return;

    const missing = current.responses.filter((r) => grades[r.id]?.score === null || grades[r.id]?.score === undefined);
    if (missing.length) {
      setErrors(Object.fromEntries(missing.map((r) => [r.id, true])));
      document.getElementById(`resp-${missing[0].id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSaving(true);
    handled.current = true;
    router.post(
      route('projects.quizzes.grading.save', [project.id, quiz.id, current.id]),
      {
        grades: current.responses.map((r) => ({
          response_id: r.id,
          score: grades[r.id].score,
          comment: grades[r.id].comment || null,
        })),
        exclude,
      },
      {
        preserveScroll: false,
        onSuccess: () => {
          try { localStorage.removeItem(storageKey); } catch { /* noop */ }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        onError: () => {
          handled.current = false;
          setSaving(false);
        },
        onFinish: () => setSaving(false),
      }
    );
  }, [grades, current, exclude, readOnly, saving]); // eslint-disable-line react-hooks/exhaustive-deps

  const skip = () => {
    handled.current = true;
    router.post(route('projects.quizzes.grading.release', [project.id, quiz.id, current.id]), { skip: true, exclude });
  };

  // Ctrl/Cmd + Entrée : enregistrer et passer à la copie suivante
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save]);

  return (
    <div className="space-y-4" ref={topRef}>
      {/* En-tête de la copie */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          {anonymous ? (
            <span className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 flex items-center justify-center text-2xl"><FaUserSecret /></span>
          ) : (
            <Avatar name={current.candidate.name} src={current.candidate.photo} size="lg" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white truncate">
                {anonymous ? `Copie ${current.reference}` : current.candidate.name}
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-[11px] font-bold">{current.reference}</span>
              {current.candidate.is_guest && !anonymous && (
                <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[11px] font-semibold">Candidat externe</span>
              )}
              {current.already_graded && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">Déjà corrigée</span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              {!anonymous && current.candidate.email && <span className="truncate">{current.candidate.email}</span>}
              <span className="inline-flex items-center gap-1"><FaCalendarAlt /> {fmtDate(current.submitted_at)}</span>
              {current.duration_minutes && <span className="inline-flex items-center gap-1"><FaStopwatch /> {current.duration_minutes} min</span>}
              {current.qcm && <span>QCM : <strong className="text-gray-700 dark:text-gray-200">{current.qcm.correct}/{current.qcm.total}</strong></span>}
            </div>
          </div>
        </div>

        {current.cheating_count > 0 && (
          <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
            <FaExclamationTriangle /> {current.cheating_count} incident(s) suspect(s) détecté(s) pendant cette copie (changement d&apos;onglet, copier-coller…).
            <Link href={route('projects.quizzes.cheating-logs', [project.id, quiz.id])} className="ml-auto underline font-semibold whitespace-nowrap">Voir le détail</Link>
          </div>
        )}
      </div>

      {/* Questions */}
      {current.responses.map((r) => {
        const g = grades[r.id] || { score: null, comment: '' };
        return (
          <div
            id={`resp-${r.id}`}
            key={r.id}
            className={`bg-white dark:bg-gray-800 rounded-2xl border-l-4 border p-4 sm:p-5 shadow-sm space-y-4 ${
              errors[r.id] ? 'border-l-red-500 border-red-200 dark:border-red-900' : 'border-l-purple-500 border-gray-100 dark:border-gray-700'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-300">Question {r.question_number} · écrite</span>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mt-0.5">{r.question_text}</h3>
              </div>
              <span className="text-[11px] text-gray-400 whitespace-nowrap">{r.word_count} mot(s)</span>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 text-sm leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words max-h-[28rem] overflow-y-auto">
              {r.answer_text?.trim() ? r.answer_text : <span className="italic text-gray-400">Aucune réponse rédigée.</span>}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 pt-1">
              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Note</label>
                <ScorePicker
                  value={g.score}
                  max={maxScore}
                  disabled={readOnly}
                  invalid={!!errors[r.id]}
                  onChange={(v) => setGrade(r.id, { score: v })}
                />
                {errors[r.id] && <p className="text-xs text-red-500 mt-2">Attribuez une note à cette question.</p>}
              </div>

              <div className="lg:col-span-3">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Commentaire (visible du candidat)</label>
                <textarea
                  rows={3}
                  disabled={readOnly}
                  value={g.comment}
                  onChange={(e) => setGrade(r.id, { comment: e.target.value })}
                  placeholder="Observations, points forts, axes d'amélioration…"
                  className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white text-sm focus:border-purple-500 focus:ring-purple-500"
                />
                {!readOnly && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {QUICK_COMMENTS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setGrade(r.id, { comment: g.comment ? `${g.comment.trim()} ${c}` : c })}
                        className="px-2.5 py-1 rounded-full bg-gray-100 hover:bg-purple-100 dark:bg-gray-700 dark:hover:bg-purple-900/40 text-[11px] font-medium text-gray-600 dark:text-gray-300 transition"
                      >
                        + {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Barre d'action collante */}
      {!readOnly && (
        <div className="sticky bottom-2 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur border border-gray-200 dark:border-gray-700 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.15)]">
          <div className="px-4 py-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="text-center px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-900/30">
                <div className="text-lg font-black text-purple-700 dark:text-purple-300 leading-none">{fmtNumber(total, 1)}<span className="text-xs font-semibold opacity-70"> / {maxTotal}</span></div>
                <div className="text-[10px] uppercase font-bold text-purple-500">{fmtNumber(percent, 0)}% de la partie écrite</div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {gradedCount}/{current.responses.length} question(s) notée(s)
                <span className="hidden md:block opacity-70">Ctrl + Entrée pour enregistrer et passer à la suite</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={skip}
                disabled={saving}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-semibold transition disabled:opacity-50"
              >
                <FaForward /> Passer
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="flex-[2] sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition disabled:opacity-60 shadow-sm"
              >
                {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                {current.already_graded ? 'Enregistrer la modification' : 'Enregistrer et copie suivante'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Page ───────────────────────── */

function Grading({ project, quiz, copies = [], stats, current, blocked, exclude = [], allDone, waitingOthers, skippedAll, readOnly, maxScore }) {
  const [anonymous, setAnonymous] = useState(() => {
    try { return localStorage.getItem('proja:grading:anonymous') === '1'; } catch { return false; }
  });
  const [drawer, setDrawer] = useState(false);
  const [lost, setLost] = useState(false);

  const toggleAnonymous = () => {
    setAnonymous((a) => {
      try { localStorage.setItem('proja:grading:anonymous', a ? '0' : '1'); } catch { /* noop */ }
      return !a;
    });
  };

  const goto = useCallback(
    (attempt) => {
      setDrawer(false);
      router.get(
        route('projects.quizzes.grading', [project.id, quiz.id]),
        { ...(attempt ? { attempt } : {}), exclude },
        { preserveState: true, preserveScroll: false, replace: true }
      );
    },
    [project.id, quiz.id, exclude]
  );

  // Toutes les copies restantes sont chez d'autres correcteurs : on rafraîchit régulièrement.
  useEffect(() => {
    if (!waitingOthers) return undefined;
    const t = setInterval(() => router.reload({ preserveScroll: true }), 15000);
    return () => clearInterval(t);
  }, [waitingOthers]);

  // Efface la liste des copies « passées » et repart de la première copie à corriger.
  const reviewSkipped = () =>
    router.get(route('projects.quizzes.grading', [project.id, quiz.id]), {}, { preserveState: true, replace: true });

  const backToQuiz = () => router.visit(route('projects.quizzes.show', [project.id, quiz.id]));

  const empty = !current;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4">
        {/* Barre supérieure */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 sm:p-5">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="min-w-0 flex-1">
              <Link
                href={route('projects.quizzes.ranking', [project.id, quiz.id])}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 dark:text-gray-400 mb-1"
              >
                <FaArrowLeft /> Retour au classement
              </Link>
              <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <FaPenFancy className="text-purple-600 flex-shrink-0" />
                <span className="truncate">Espace de correction · {quiz.title}</span>
              </h1>
              {readOnly && (
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 flex items-center gap-1">
                  <FaLock /> Résultats validés en délibération : consultation uniquement.
                </p>
              )}
            </div>

            <div className="md:w-72">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                <span>Progression</span>
                <span>{stats.graded}/{stats.total} corrigée(s) · {stats.percent}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${stats.percent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleAnonymous}
                title="Masque le nom des candidats pour corriger sans a priori"
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                  anonymous
                    ? 'bg-purple-600 border-purple-600 text-white'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'
                }`}
              >
                {anonymous ? <FaEyeSlash /> : <FaEye />} Mode anonyme
              </button>
              <button
                onClick={() => setDrawer(true)}
                className="lg:hidden inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
              >
                <FaListUl /> Copies ({stats.pending})
              </button>
            </div>
          </div>
        </div>

        {lost && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-200 flex flex-wrap items-center gap-3">
            <FaExclamationTriangle /> Cette copie a été reprise par un autre correcteur (réservation expirée).
            <button onClick={() => { setLost(false); goto(null); }} className="ml-auto px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold">Passer à la copie suivante</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Liste des copies (desktop) */}
          <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden sticky top-4 h-[calc(100vh-2rem)] max-h-[44rem]">
            <CopyList copies={copies} currentId={current?.id} anonymous={anonymous} onOpen={goto} />
          </aside>

          {/* Zone principale */}
          <main className="lg:col-span-8 xl:col-span-9 min-w-0">
            {current ? (
              <GradingForm
                key={current.id}
                current={current}
                project={project}
                quiz={quiz}
                maxScore={maxScore}
                exclude={exclude}
                readOnly={readOnly}
                anonymous={anonymous}
                                onLost={() => setLost(true)}
              />
            ) : blocked === 'locked' ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-10 text-center space-y-3">
                <FaLock className="text-4xl mx-auto text-gray-300" />
                <h3 className="font-bold text-gray-900 dark:text-white">Copie en cours de correction</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Un autre correcteur travaille actuellement sur cette copie.</p>
                <button onClick={() => goto(null)} className="px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-bold">Prendre la copie suivante</button>
              </div>
            ) : waitingOthers ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-10 text-center space-y-3">
                <FaSyncAlt className="text-4xl mx-auto text-purple-300 animate-spin" style={{ animationDuration: '3s' }} />
                <h3 className="font-bold text-gray-900 dark:text-white">Les copies restantes sont en cours de correction</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {stats.locked} copie(s) sont réservées par d&apos;autres correcteurs. Cette page s&apos;actualise automatiquement.
                </p>
                <div className="flex justify-center gap-2">
                  <button onClick={() => router.reload()} className="px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-bold">Actualiser</button>
                  {exclude.length > 0 && (
                    <button onClick={reviewSkipped} className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold">
                      Revoir les copies passées
                    </button>
                  )}
                </div>
              </div>
            ) : skippedAll ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-10 text-center space-y-3">
                <FaForward className="text-4xl mx-auto text-gray-300" />
                <h3 className="font-bold text-gray-900 dark:text-white">Vous avez passé toutes les copies restantes</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Reprenez les copies que vous avez laissées de côté.</p>
                <button onClick={reviewSkipped} className="px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-bold">Revoir les copies passées</button>
              </div>
            ) : empty && readOnly ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-10 text-center text-sm text-gray-500 dark:text-gray-400">
                Sélectionnez une copie dans la liste pour la consulter.
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-10 text-center text-sm text-gray-500 dark:text-gray-400">
                Aucune copie à corriger.
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Tiroir mobile : liste des copies */}
      {drawer && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-gray-900/60" onClick={() => setDrawer(false)} />
          <div className="relative ml-auto w-[85%] max-w-sm h-full bg-white dark:bg-gray-800 shadow-2xl">
            <CopyList copies={copies} currentId={current?.id} anonymous={anonymous} onOpen={goto} onClose={() => setDrawer(false)} />
          </div>
        </div>
      )}

      {/* Pop-up : plus aucune copie à corriger */}
      <QuizModal show={!!allDone} closeable={false} size="md">
        <div className="p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 flex items-center justify-center text-3xl">
            <FaCheck />
          </div>
          <h2 className="text-xl font-black tracking-wide text-gray-900 dark:text-white">PLUS DE COPIE À CORRIGER</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Toutes les copies de « {quiz.title} » ont été corrigées. Vous pouvez maintenant retourner aux détails du quiz pour lancer la délibération.
          </p>
          <button
            onClick={backToQuiz}
            className="w-full sm:w-auto px-10 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-extrabold transition"
            autoFocus
          >
            OK
          </button>
        </div>
      </QuizModal>
    </div>
  );
}

Grading.layout = (page) => <AdminLayout>{page}</AdminLayout>;
export default Grading;
