import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { FaListUl, FaCheckCircle, FaClock, FaLock, FaForward, FaSave, FaSpinner, FaUserSecret, FaEye, FaEyeSlash, FaExclamationTriangle, FaCheck, FaSyncAlt } from 'react-icons/fa';
import MobileLayout from '@/Layouts/MobileLayout';
import Avatar from '@/Components/Quiz/Avatar';
import { fmtNumber } from '@/Components/Quiz/ScoreBadge';
import useGradingSession from '@/hooks/useGradingSession';
import { MCard, MPill, MSheet, MSegmented, MSearch, MActionBar, MButton, MEmpty, fmtDate } from '@/Components/Mobile/kit';

const QUICK = ['Excellente réponse.', 'Correct mais incomplet.', "Manque d'exemples.", 'Hors sujet.', 'Notions à revoir.'];
const tone = (v, max) => (v / max >= 0.7 ? 'bg-emerald-500 text-white' : v / max >= 0.5 ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white');

function CopyForm({ current, project, quiz, maxScore, exclude, readOnly, anonymous, onLost }) {
  const s = useGradingSession({ current, project, quiz, maxScore, exclude, readOnly, onLost });
  const chips = Array.from({ length: maxScore + 1 }, (_, i) => i);

  return (
    <>
      <div className="space-y-4 pb-28">
        <MCard>
          <div className="flex items-center gap-3">
            {anonymous ? <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-xl text-slate-500 dark:bg-slate-800"><FaUserSecret /></span> : <Avatar name={current.candidate.name} src={current.candidate.photo} size="lg" />}
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-extrabold text-slate-900 dark:text-white">{anonymous ? `Copie ${current.reference}` : current.candidate.name}</h2>
              <p className="text-[11px] text-slate-500">{current.reference} · {fmtDate(current.submitted_at)}{current.duration_minutes ? ` · ${current.duration_minutes} min` : ''}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {current.qcm && <MPill tone="blue">QCM {current.qcm.correct}/{current.qcm.total}</MPill>}
                {current.already_graded && <MPill tone="green">Déjà corrigée</MPill>}
                {current.candidate.is_guest && !anonymous && <MPill>Externe</MPill>}
              </div>
            </div>
          </div>
          {current.cheating_count > 0 && <p className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 p-2.5 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"><FaExclamationTriangle /> {current.cheating_count} incident(s) suspect(s)</p>}
        </MCard>

        {current.responses.map((r) => {
          const g = s.grades[r.id] || { score: null, comment: '' };
          return (
            <MCard id={`resp-${r.id}`} key={r.id} className={s.errors[r.id] ? '!border-rose-300' : ''}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-purple-600">Question {r.question_number}</p>
                <span className="text-[11px] text-slate-400">{r.word_count} mot(s)</span>
              </div>
              <h3 className="mt-0.5 text-[15px] font-bold leading-snug text-slate-900 dark:text-white">{r.question_text}</h3>
              <div className="mt-3 max-h-72 overflow-y-auto whitespace-pre-wrap break-words rounded-2xl bg-slate-50 p-3.5 text-[15px] leading-relaxed text-slate-800 dark:bg-slate-800/70 dark:text-slate-100" data-no-ptr>
                {r.answer_text?.trim() ? r.answer_text : <span className="italic text-slate-400">Aucune réponse rédigée.</span>}
              </div>

              <p className="mb-2 mt-4 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Note sur {maxScore}</p>
              <div className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" data-no-ptr>
                {chips.map((n) => (
                  <button key={n} type="button" disabled={readOnly} onClick={() => s.setGrade(r.id, { score: n })}
                    className={`h-12 w-12 flex-shrink-0 rounded-2xl text-base font-black transition active:scale-90 ${g.score === n ? `${tone(n, maxScore)} shadow-lg` : 'bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700'}`}>{n}</button>
                ))}
              </div>
              {s.errors[r.id] && <p className="mt-1 text-xs font-semibold text-rose-500">Attribuez une note.</p>}

              <textarea rows={3} disabled={readOnly} value={g.comment} onChange={(e) => s.setGrade(r.id, { comment: e.target.value })} placeholder="Commentaire (visible du candidat)…"
                className="mt-3 w-full rounded-2xl border-slate-200 bg-white text-[15px] focus:border-purple-500 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
              {!readOnly && (
                <div className="scrollbar-hide -mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1" data-no-ptr>
                  {QUICK.map((c) => <button key={c} type="button" onClick={() => s.setGrade(r.id, { comment: g.comment ? `${g.comment.trim()} ${c}` : c })} className="flex-shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-600 active:scale-95 dark:bg-slate-800 dark:text-slate-300">+ {c}</button>)}
                </div>
              )}
            </MCard>
          );
        })}
      </div>

      {!readOnly && (
        <MActionBar>
          <div className="w-16 flex-shrink-0 text-center leading-none">
            <div className="text-lg font-black text-purple-700 dark:text-purple-300">{fmtNumber(s.total, 1)}</div>
            <div className="text-[10px] font-bold text-slate-400">/ {s.maxTotal}</div>
          </div>
          <MButton onClick={s.skip} tone="soft" disabled={s.saving} size="lg" className="!px-4"><FaForward /></MButton>
          <MButton onClick={s.save} tone="purple" disabled={s.saving} size="lg" className="flex-1">
            {s.saving ? <FaSpinner className="animate-spin" /> : <FaSave />}{current.already_graded ? 'Enregistrer' : 'Enregistrer & suivante'}
          </MButton>
        </MActionBar>
      )}
    </>
  );
}

export default function MobileGrading({ project, quiz, copies = [], stats, current, blocked, exclude = [], allDone, waitingOthers, skippedAll, readOnly, maxScore }) {
  const { errors = {} } = usePage().props;
  const [anonymous, setAnonymous] = useState(() => { try { return localStorage.getItem('proja:grading:anonymous') === '1'; } catch { return false; } });
  const [sheet, setSheet] = useState(false);
  const [tab, setTab] = useState('todo');
  const [q, setQ] = useState('');
  const [lost, setLost] = useState(false);

  const toggleAnon = () => setAnonymous((a) => { try { localStorage.setItem('proja:grading:anonymous', a ? '0' : '1'); } catch { /* noop */ } return !a; });
  const goto = useCallback((attempt) => { setSheet(false); router.get(route('projects.quizzes.grading', [project.id, quiz.id]), { ...(attempt ? { attempt } : {}), exclude }, { preserveState: true, replace: true }); }, [project.id, quiz.id, exclude]);
  const reviewSkipped = () => router.get(route('projects.quizzes.grading', [project.id, quiz.id]), {}, { preserveState: true, replace: true });

  useEffect(() => {
    if (!waitingOthers) return undefined;
    const t = setInterval(() => router.reload({ preserveScroll: true }), 15000);
    return () => clearInterval(t);
  }, [waitingOthers]);

  const list = useMemo(() => copies.filter((c) => (tab === 'todo' ? c.status !== 'graded' : tab === 'done' ? c.status === 'graded' : true) && (!q || `${anonymous ? '' : c.name} ${c.reference}`.toLowerCase().includes(q.toLowerCase()))), [copies, tab, q, anonymous]);
  const counts = { todo: copies.filter((c) => c.status !== 'graded').length, done: copies.filter((c) => c.status === 'graded').length, all: copies.length };

  return (
    <MobileLayout
      title="Correction" subtitle={`${stats.graded}/${stats.total} corrigée(s)`} backHref={route('projects.quizzes.ranking', [project.id, quiz.id])} hideBottomNav refreshable={false}
      headerRight={<div className="flex items-center gap-1">
        <button type="button" onClick={toggleAnon} aria-label="Mode anonyme" className={`flex h-10 w-10 items-center justify-center rounded-full active:scale-90 ${anonymous ? 'bg-purple-600 text-white' : 'text-slate-500'}`}>{anonymous ? <FaEyeSlash /> : <FaEye />}</button>
        <button type="button" onClick={() => setSheet(true)} aria-label="Copies" className="relative flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-purple-700 active:scale-90 dark:bg-purple-950 dark:text-purple-300"><FaListUl />{stats.pending > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-400 px-1 text-[9px] font-black text-amber-950">{stats.pending}</span>}</button>
      </div>}
    >
      <Head title={`Correction – ${quiz.title}`} />
      <div className="space-y-3 py-3">
        <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-emerald-500 transition-all duration-500" style={{ width: `${stats.percent}%` }} /></div>

        {readOnly && <p className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30"><FaLock /> Résultats validés : consultation uniquement.</p>}
        {errors.grades && <p className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:bg-rose-950/30"><FaExclamationTriangle /> {errors.grades}</p>}
        {lost && <div className="rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800 dark:bg-amber-950/30">Copie reprise par un autre correcteur. <button className="ml-1 underline" onClick={() => { setLost(false); goto(null); }}>Copie suivante</button></div>}

        {current ? (
          <CopyForm key={current.id} current={current} project={project} quiz={quiz} maxScore={maxScore} exclude={exclude} readOnly={readOnly} anonymous={anonymous} onLost={() => setLost(true)} />
        ) : blocked === 'locked' ? (
          <MEmpty icon={FaLock} title="Copie en cours de correction" text="Un autre correcteur travaille sur cette copie." action={<MButton onClick={() => goto(null)}>Copie suivante</MButton>} />
        ) : waitingOthers ? (
          <MEmpty icon={FaSyncAlt} title="Copies en cours chez d'autres correcteurs" text={`${stats.locked} copie(s) réservée(s). Actualisation automatique.`} action={<div className="flex justify-center gap-2"><MButton onClick={() => router.reload()}>Actualiser</MButton>{exclude.length > 0 && <MButton tone="soft" onClick={reviewSkipped}>Copies passées</MButton>}</div>} />
        ) : skippedAll ? (
          <MEmpty icon={FaForward} title="Vous avez passé toutes les copies restantes" action={<MButton onClick={reviewSkipped}>Revoir les copies passées</MButton>} />
        ) : (
          <MEmpty icon={FaListUl} title={readOnly ? 'Choisissez une copie' : 'Aucune copie à corriger'} text={readOnly ? 'Ouvrez la liste des copies pour en consulter une.' : undefined} action={readOnly && <MButton onClick={() => setSheet(true)}>Liste des copies</MButton>} />
        )}
      </div>

      <MSheet open={sheet} onClose={() => setSheet(false)} title="Copies">
        <div className="space-y-3 pb-3">
          <MSegmented value={tab} onChange={setTab} options={[{ value: 'todo', label: 'À corriger', count: counts.todo }, { value: 'done', label: 'Corrigées', count: counts.done }, { value: 'all', label: 'Toutes', count: counts.all }]} />
          <MSearch value={q} onChange={setQ} placeholder={anonymous ? 'Référence (C-0012)' : 'Nom ou référence'} />
          {list.length === 0 && <p className="py-6 text-center text-sm text-slate-400">Aucune copie dans cette vue.</p>}
          {list.map((c) => (
            <button key={c.id} type="button" disabled={c.status === 'locked'} onClick={() => goto(c.id)} className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left active:scale-[.98] ${c.id === current?.id ? 'bg-purple-50 ring-2 ring-purple-400 dark:bg-purple-950/30' : 'bg-slate-50 dark:bg-slate-800/60'} ${c.status === 'locked' ? 'opacity-50' : ''}`}>
              {anonymous ? <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-500 dark:bg-slate-700"><FaUserSecret /></span> : <Avatar name={c.name} src={c.photo} size="md" />}
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900 dark:text-white">{anonymous ? `Copie ${c.reference}` : c.name}</p><p className="text-[11px] text-slate-500">{anonymous ? '' : `${c.reference} · `}{fmtDate(c.submitted_at, { dateStyle: 'short', timeStyle: 'short' })}</p></div>
              {c.status === 'graded' ? <span className="text-right text-emerald-600"><FaCheckCircle className="ml-auto" /><span className="text-[10px] font-bold">{fmtNumber(c.points, 1)}/{c.points_max}</span></span>
                : c.status === 'locked' ? <span className="text-right text-slate-400"><FaLock className="ml-auto" /><span className="block max-w-[4rem] truncate text-[10px]">{c.locked_by}</span></span>
                : <FaClock className="text-amber-500" />}
            </button>
          ))}
        </div>
      </MSheet>

      <MSheet open={!!allDone} closeable={false} onClose={() => {}} title="">
        <div className="space-y-4 pb-6 pt-2 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600 dark:bg-emerald-950"><FaCheck /></span>
          <h2 className="text-xl font-black tracking-wide text-slate-900 dark:text-white">PLUS DE COPIE À CORRIGER</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Toutes les copies de « {quiz.title} » sont corrigées. Retournez aux détails du quiz pour lancer la délibération.</p>
          <MButton onClick={() => router.visit(route('projects.quizzes.show', [project.id, quiz.id]))} tone="success" size="lg" className="w-full">OK</MButton>
        </div>
      </MSheet>
    </MobileLayout>
  );
}
