import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { FaClock, FaQuestionCircle, FaRedo, FaTrophy, FaPlay, FaLock, FaCheck, FaChartBar, FaEdit, FaStar, FaGavel, FaPenFancy, FaFileExcel, FaFilePdf, FaShareAlt, FaCopy, FaExclamationTriangle, FaShieldAlt, FaCheckCircle, FaChevronRight, FaUsers } from 'react-icons/fa';
import MobileLayout from '@/Layouts/MobileLayout';
import Avatar from '@/Components/Quiz/Avatar';
import ScoreBadge from '@/Components/Quiz/ScoreBadge';
import CandidatesPanel from '@/Components/Quiz/CandidatesPanel';
import { MHero, MCard, MPill, MStat, MSectionTitle, MActionBar, MButton, MDownload } from '@/Components/Mobile/kit';

const STEPS = ['Passage', 'Correction', 'Délibération', 'Validé'];
const currentStep = (ev) => {
  const d = ev.deliberation;
  if (d.status === 'validated') return 4;
  if (d.status === 'open') return 2;
  if (ev.participants === 0) return 0;
  return ev.pending_copies > 0 ? 1 : 2;
};

function Stepper({ ev }) {
  const step = currentStep(ev);
  return (
    <ol className="flex items-start">
      {STEPS.map((label, i) => {
        const done = i < step || step === 4;
        const active = i === step && step < 4;
        return (
          <li key={label} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full items-center">
              <span className={`h-0.5 flex-1 ${i === 0 ? 'opacity-0' : done || active ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
              <span className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-extrabold ${done ? 'border-emerald-500 bg-emerald-500 text-white' : active ? 'border-blue-600 bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/40' : 'border-slate-300 bg-white text-slate-400 dark:border-slate-600 dark:bg-slate-900'}`}>
                {done ? <FaCheck /> : i + 1}
              </span>
              <span className={`h-0.5 flex-1 ${i === STEPS.length - 1 ? 'opacity-0' : done ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
            </div>
            <span className={`text-[10px] font-bold ${active ? 'text-blue-700 dark:text-blue-300' : done ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-400'}`}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

const Row = ({ href, icon: Icon, label, hint, tone = 'text-slate-500', badge }) => (
  <MCard href={href} className="!p-3.5">
    <div className="flex items-center gap-3">
      <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 ${tone}`}><Icon /></span>
      <div className="min-w-0 flex-1"><p className="text-sm font-bold text-slate-900 dark:text-white">{label}</p>{hint && <p className="text-xs text-slate-500">{hint}</p>}</div>
      {badge}
      <FaChevronRight className="text-xs text-slate-300" />
    </div>
  </MCard>
);

export default function MobileQuizShow({ project, quiz, attemptsCount, hasActiveAttempt, latestResult, canManage, deciders = [], cheatingAttemptsCount = 0, evaluation = null, candidates = [], canViewRanking = true }) {
  const [copied, setCopied] = useState(false);
  const launch = () => router.post(route('projects.quizzes.launch', [project.id, quiz.id]));
  const togglePublic = () => router.post(route('projects.quizzes.toggle-public-link', [project.id, quiz.id]), {}, { preserveScroll: true });
  const copyLink = () => { navigator.clipboard?.writeText(`${window.location.origin}/q/${quiz.public_token}`); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const exhausted = attemptsCount >= quiz.max_attempts && !hasActiveAttempt;
  const delib = evaluation?.deliberation;
  const approved = new Set((delib?.deciders || []).filter((d) => d.approved).map((d) => d.id));
  const delibReady = delib && (delib.can_open || delib.status !== 'none');
  const canPlay = quiz.is_active && !exhausted && !quiz.is_draft;

  return (
    <MobileLayout title="Détails du quiz" backHref={route('projects.quizzes.index', project.id)}>
      <Head title={quiz.title} />
      <div className="space-y-4 py-4 pb-24">
        <MHero eyebrow={project.name} title={quiz.title} subtitle={quiz.description || undefined}>
          <div className="flex flex-wrap gap-1.5">
            {quiz.is_draft && <MPill tone="amber">Brouillon</MPill>}
            {quiz.deliberation_status === 'validated' && <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold"><FaShieldAlt /> Résultats validés</span>}
            {!quiz.is_active && !quiz.is_draft && <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold">Inactif</span>}
          </div>
        </MHero>

        <div className="grid grid-cols-4 gap-2">
          <MStat label="Minutes" value={quiz.duration_minutes} tone="text-blue-600" />
          <MStat label="Quest." value={quiz.questions_count ?? 0} tone="text-purple-600" />
          <MStat label="Essais" value={`${attemptsCount}/${quiz.max_attempts}`} tone="text-emerald-600" />
          <MStat label="Score" value={latestResult ? <ScoreBadge score={latestResult.score_exact ?? latestResult.score} pending={latestResult.is_pending} size="sm" /> : '—'} />
        </div>

        {deciders.length > 0 && (
          <div>
            <MSectionTitle>Responsables</MSectionTitle>
            <div className="scrollbar-hide -mx-4 flex gap-4 overflow-x-auto px-4 pb-1" data-no-ptr>
              {deciders.map((d) => (
                <div key={d.id} className="flex w-16 flex-shrink-0 flex-col items-center gap-1.5 text-center">
                  <div className="relative"><Avatar name={d.name} src={d.photo} size="lg" ring={approved.has(d.id) ? 'ring-4 ring-emerald-400' : 'ring-2 ring-white dark:ring-slate-800'} />
                    {approved.has(d.id) && <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-[9px] text-white"><FaCheck /></span>}</div>
                  <span className="line-clamp-2 text-[10px] font-semibold leading-tight text-slate-600 dark:text-slate-300">{d.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {canManage && evaluation && !quiz.is_draft && (
          <MCard className="space-y-4 !border-blue-100 !bg-blue-50/50 dark:!border-blue-900/50 dark:!bg-blue-950/20">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white"><FaChartBar className="text-blue-600" /> Suivi de l'évaluation</h3>
              <MPill tone="slate">{evaluation.participants} participant(s)</MPill>
            </div>
            <Stepper ev={evaluation} />
            {evaluation.pending_copies > 0 && <MPill tone="amber"><FaClock /> {evaluation.pending_copies} copie(s) à corriger</MPill>}
            <div className="grid grid-cols-2 gap-2">
              {evaluation.has_written && <MButton href={route('projects.quizzes.grading', [project.id, quiz.id])} tone="purple" className="col-span-2"><FaPenFancy /> {delib.status === 'validated' ? 'Consulter les copies' : 'Espace de correction'}</MButton>}
              {delibReady
                ? <MButton href={route('projects.quizzes.deliberation', [project.id, quiz.id])} className="col-span-2 !bg-indigo-600"><FaGavel /> Délibération{delib.status === 'open' && <span className="rounded-full bg-white/25 px-2 text-[11px]">{delib.approved_count}/{delib.deciders_count}</span>}{delib.status === 'validated' && <FaCheckCircle />}</MButton>
                : <button type="button" disabled className="col-span-2 flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-200 text-sm font-bold text-slate-500 dark:bg-slate-800"><FaGavel /> Délibération (après correction)</button>}
              {evaluation.participants > 0 && (<>
                <MDownload href={route('projects.quizzes.export', [project.id, quiz.id, 'xlsx'])}><FaFileExcel className="text-emerald-600" /> Excel</MDownload>
                <MDownload href={route('projects.quizzes.export', [project.id, quiz.id, 'pdf'])}><FaFilePdf className="text-rose-600" /> PDF</MDownload>
              </>)}
            </div>
          </MCard>
        )}

        <div className="space-y-2">
          {latestResult && quiz.show_results && <Row href={route('projects.quizzes.results', [project.id, quiz.id])} icon={FaCheckCircle} tone="text-emerald-600" label="Voir mes résultats" />}
          {(canManage || (quiz.show_results && canViewRanking)) && <Row href={route('projects.quizzes.ranking', [project.id, quiz.id])} icon={FaTrophy} tone="text-amber-500" label={canManage ? 'Classement / Correction' : 'Classement'} />}
          {canManage && (<>
            <Row href={route('projects.quizzes.edit', [project.id, quiz.id])} icon={FaEdit} tone="text-blue-600" label="Modifier le quiz" />
            <Row href={route('projects.participation.index', project.id)} icon={FaStar} tone="text-amber-500" label="Bonus de participation" />
            <Row href={route('projects.quizzes.cheating-logs', [project.id, quiz.id])} icon={FaExclamationTriangle} tone="text-rose-500" label="Cas de triche" badge={cheatingAttemptsCount > 0 && <MPill tone="red">{cheatingAttemptsCount}</MPill>} />
          </>)}
        </div>

        {canManage && !quiz.is_draft && (
          <MCard className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white"><FaShareAlt className="text-indigo-600" /> Lien pour candidats externes</h3>
              <button type="button" onClick={togglePublic} className={`rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase ${quiz.allow_public_access ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{quiz.allow_public_access ? 'Activé' : 'Désactivé'}</button>
            </div>
            {quiz.allow_public_access && quiz.public_token && (
              <div className="flex gap-2">
                <input readOnly value={`${window.location.origin}/q/${quiz.public_token}`} className="min-w-0 flex-1 rounded-xl border-slate-200 bg-slate-50 text-xs dark:border-slate-700 dark:bg-slate-800" />
                <MButton onClick={copyLink} size="sm">{copied ? <FaCheck /> : <FaCopy />}</MButton>
              </div>
            )}
          </MCard>
        )}

        {canManage && !quiz.is_draft && (
          <div>
            <MSectionTitle right={<FaUsers className="text-slate-400" />}>Candidats du quiz</MSectionTitle>
            <CandidatesPanel project={project} quiz={quiz} candidates={candidates} />
          </div>
        )}
      </div>

      <MActionBar withNav>
        {hasActiveAttempt ? <MButton onClick={launch} tone="success" size="lg" className="flex-1"><FaPlay /> Reprendre la tentative</MButton>
          : canPlay ? <MButton onClick={launch} size="lg" className="flex-1"><FaPlay /> Commencer le quiz</MButton>
          : <div className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-100 text-sm font-bold text-slate-500 dark:bg-slate-800"><FaLock /> {exhausted ? 'Essais épuisés' : 'Quiz indisponible'}</div>}
      </MActionBar>
    </MobileLayout>
  );
}
