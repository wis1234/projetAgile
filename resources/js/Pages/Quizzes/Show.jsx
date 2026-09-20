import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Avatar from '@/Components/Quiz/Avatar';
import ScoreBadge from '@/Components/Quiz/ScoreBadge';
import CandidatesPanel from '@/Components/Quiz/CandidatesPanel';
import {
  FaClock, FaQuestionCircle, FaPlay, FaArrowLeft, FaTrophy, FaRedo, FaCheckCircle, FaLock, FaChartBar,
  FaShareAlt, FaCopy, FaCheck, FaExclamationTriangle, FaGavel, FaStar, FaUsers, FaPenFancy, FaShieldAlt,
  FaFileExcel, FaFilePdf, FaEdit,
} from 'react-icons/fa';

const STEPS = ['Passage', 'Correction', 'Délibération', 'Résultats validés'];

function currentStep(ev) {
  const d = ev.deliberation;
  if (d.status === 'validated') return 4;
  if (d.status === 'open') return 2;
  if (ev.participants === 0) return 0;
  if (ev.pending_copies > 0) return 1;
  return 2;
}

function Stepper({ ev }) {
  const step = currentStep(ev);
  return (
    <ol className="flex items-center w-full" aria-label="Avancement de l'évaluation">
      {STEPS.map((label, i) => {
        const done = i < step || step === 4;
        const active = i === step && step < 4;
        return (
          <li key={label} className={`flex items-center ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
            <div className="flex flex-col items-center gap-1 min-w-[3.5rem]">
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold border-2 transition ${
                  done
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : active
                    ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/40'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'
                }`}
              >
                {done ? <FaCheck /> : i + 1}
              </span>
              <span className={`text-[10px] sm:text-xs text-center font-semibold leading-tight ${active ? 'text-blue-700 dark:text-blue-300' : done ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span className={`flex-1 h-0.5 mx-1 sm:mx-2 -mt-5 ${done ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

const actionBtn = 'w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 font-semibold rounded-xl text-sm transition';

function Show({ project, quiz, attemptsCount, hasActiveAttempt, latestResult, canManage, deciders = [], cheatingAttemptsCount = 0, evaluation = null, candidates = [], canViewRanking = true, isProjectMember = true }) {
  const [copied, setCopied] = useState(false);

  const handleLaunch = () => router.post(route('projects.quizzes.launch', [project.id, quiz.id]));

  const handleTogglePublic = () =>
    router.post(route('projects.quizzes.toggle-public-link', [project.id, quiz.id]), {}, { preserveScroll: true });

  const handleCopyLink = () => {
    if (!quiz.public_token) return;
    navigator.clipboard.writeText(`${window.location.origin}/q/${quiz.public_token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const attemptsExhausted = attemptsCount >= quiz.max_attempts && !hasActiveAttempt;
  const delib = evaluation?.deliberation;
  const approvedIds = new Set((delib?.deciders || []).filter((d) => d.approved).map((d) => d.id));
  const delibReady = delib && (delib.can_open || delib.status !== 'none');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        <Link
          href={isProjectMember ? route('projects.quizzes.index', project.id) : route('quizzes.index')}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-blue-600 dark:text-gray-400"
        >
          <FaArrowLeft /> {isProjectMember ? 'Retour à la liste des quiz' : 'Retour à mes quiz'}
        </Link>

        {/* Carte principale */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 sm:p-8 shadow-sm space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto text-2xl">
              <FaQuestionCircle />
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
                {quiz.is_draft && <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800">Brouillon</span>}
                {quiz.deliberation_status === 'validated' && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 inline-flex items-center gap-1">
                    <FaShieldAlt /> Résultats validés
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white mb-2">{quiz.title}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                {quiz.description || 'Aucune instruction supplémentaire.'}
              </p>
            </div>
          </div>

          {/* Détails */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-4 bg-gray-50 dark:bg-gray-700/40 rounded-2xl border border-gray-100 dark:border-gray-700/50">
            <div className="text-center">
              <FaClock className="mx-auto mb-1 text-blue-500 text-lg" />
              <span className="block text-xs text-gray-500 dark:text-gray-400">Durée</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{quiz.duration_minutes} min</span>
            </div>
            <div className="text-center">
              <FaQuestionCircle className="mx-auto mb-1 text-purple-500 text-lg" />
              <span className="block text-xs text-gray-500 dark:text-gray-400">Questions</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{quiz.questions_count ?? 0}</span>
            </div>
            <div className="text-center">
              <FaRedo className="mx-auto mb-1 text-emerald-500 text-lg" />
              <span className="block text-xs text-gray-500 dark:text-gray-400">Essais</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{attemptsCount} / {quiz.max_attempts}</span>
            </div>
            <div className="text-center">
              <FaTrophy className="mx-auto mb-1 text-amber-500 text-lg" />
              <span className="block text-xs text-gray-500 dark:text-gray-400">Dernier score</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {latestResult ? <ScoreBadge score={latestResult.score} pending={latestResult.is_pending} size="sm" /> : 'N/A'}
              </span>
            </div>
          </div>

          {/* Responsables du projet (ceux qui décident) */}
          {deciders.length > 0 && (
            <div className="p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gradient-to-br from-slate-50 to-blue-50/60 dark:from-gray-800 dark:to-blue-950/20">
              <div className="flex items-center gap-2 mb-3">
                <FaUsers className="text-blue-600" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Responsables du projet</h2>
                <span className="text-xs text-gray-500 dark:text-gray-400">· ils décident des résultats</span>
              </div>
              <div className="flex flex-wrap gap-4">
                {deciders.map((d) => {
                  const approved = approvedIds.has(d.id);
                  return (
                    <div key={d.id} className="flex items-center gap-2.5 min-w-0">
                      <div className="relative">
                        <Avatar
                          name={d.name}
                          src={d.photo}
                          size="lg"
                          ring={approved ? 'ring-4 ring-emerald-400' : 'ring-2 ring-white dark:ring-gray-700'}
                        />
                        {approved && (
                          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center border-2 border-white dark:border-gray-800">
                            <FaCheck />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[9rem]">{d.name}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          {approved ? 'Aval donné' : 'Responsable'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Suivi de l'évaluation (gestionnaires) */}
          {canManage && evaluation && !quiz.is_draft && (
            <div className="p-4 sm:p-5 rounded-2xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FaChartBar className="text-blue-600" /> Suivi de l&apos;évaluation
                </h2>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-300">
                    {evaluation.participants} participant(s)
                  </span>
                  {evaluation.pending_copies > 0 && (
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 font-bold inline-flex items-center gap-1">
                      <FaClock /> {evaluation.pending_copies} copie(s) à corriger
                    </span>
                  )}
                </div>
              </div>

              <Stepper ev={evaluation} />

              <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-1">
                {evaluation.has_written && (
                  <Link
                    href={route('projects.quizzes.grading', [project.id, quiz.id])}
                    className={`${actionBtn} bg-purple-600 hover:bg-purple-700 text-white`}
                  >
                    <FaPenFancy /> {delib.status === 'validated' ? 'Consulter les copies' : 'Espace de correction'}
                  </Link>
                )}

                {delibReady ? (
                  <Link
                    href={route('projects.quizzes.deliberation', [project.id, quiz.id])}
                    className={`${actionBtn} bg-indigo-600 hover:bg-indigo-700 text-white`}
                  >
                    <FaGavel /> Délibération
                    {delib.status === 'open' && (
                      <span className="ml-1 px-2 py-0.5 text-[11px] bg-white/20 rounded-full font-bold">
                        {delib.approved_count}/{delib.deciders_count} avals
                      </span>
                    )}
                    {delib.status === 'validated' && <FaCheckCircle />}
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    title={evaluation.participants === 0 ? 'Aucun candidat n\'a encore composé ce quiz.' : 'Corrigez toutes les copies avant de délibérer.'}
                    className={`${actionBtn} bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed`}
                  >
                    <FaGavel /> Délibération
                  </button>
                )}

                {evaluation.participants > 0 && (
                  <>
                    <a
                      href={route('projects.quizzes.export', [project.id, quiz.id, 'xlsx'])}
                      className={`${actionBtn} bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300`}
                    >
                      <FaFileExcel /> Excel
                    </a>
                    <a
                      href={route('projects.quizzes.export', [project.id, quiz.id, 'pdf'])}
                      className={`${actionBtn} bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300`}
                    >
                      <FaFilePdf /> PDF
                    </a>
                  </>
                )}
              </div>
              {delib.status !== 'validated' && evaluation.participants > 0 && (
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Les exports sont marqués « provisoires » tant que la délibération n&apos;est pas validée.
                </p>
              )}
            </div>
          )}

          {/* Lien public */}
          {canManage && !quiz.is_draft && (
            <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl text-left text-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                  <FaShareAlt className="text-indigo-600" /> Lien unique pour candidats externes
                </span>
                <button
                  type="button"
                  onClick={handleTogglePublic}
                  className={`px-3 py-1 rounded-full font-bold text-xs uppercase transition ${
                    quiz.allow_public_access
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                      : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {quiz.allow_public_access ? 'Lien Public Activé' : 'Accès Public Désactivé'}
                </button>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Permet à des candidats sans compte ProJA de passer ce quiz via une URL unique.
              </p>
              {quiz.allow_public_access && quiz.public_token && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/q/${quiz.public_token}`}
                    className="flex-1 min-w-0 bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs p-2.5 font-mono text-gray-800 dark:text-gray-200"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    {copied ? <FaCheck /> : <FaCopy />}
                    <span>{copied ? 'Copié !' : 'Copier le lien'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-3">
            {hasActiveAttempt ? (
              <button onClick={handleLaunch} className={`${actionBtn} bg-emerald-600 hover:bg-emerald-700 text-white shadow-md`}>
                <FaPlay /> Reprendre la tentative en cours
              </button>
            ) : attemptsExhausted ? (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 rounded-xl text-sm font-medium flex items-center gap-2">
                <FaLock /> Vous avez épuisé le nombre maximal d&apos;essais pour ce quiz.
              </div>
            ) : !quiz.is_active ? (
              <div className="p-4 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-xl text-sm font-medium">
                Ce quiz n&apos;est actuellement pas disponible.
              </div>
            ) : (
              <button onClick={handleLaunch} className={`${actionBtn} bg-blue-600 hover:bg-blue-700 text-white shadow-md`}>
                <FaPlay /> Commencer le Quiz
              </button>
            )}

            {latestResult && quiz.show_results && (
              <Link
                href={route('projects.quizzes.results', [project.id, quiz.id])}
                className={`${actionBtn} bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200`}
              >
                <FaCheckCircle /> Voir mes résultats
              </Link>
            )}

            {canViewRanking && (
              <Link
                href={route('projects.quizzes.ranking', [project.id, quiz.id])}
                className={`${actionBtn} bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200`}
              >
                <FaChartBar /> {canManage ? 'Classement / Correction' : 'Classement'}
              </Link>
            )}

            {canManage && (
              <>
                <Link
                  href={route('projects.quizzes.edit', [project.id, quiz.id])}
                  className={`${actionBtn} bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200`}
                >
                  <FaEdit /> Modifier
                </Link>
                <Link
                  href={route('projects.quizzes.participation.index', [project.id, quiz.id])}
                  className={`${actionBtn} bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800`}
                >
                  <FaStar className="text-amber-500" /> Bonus de participation
                </Link>
                <Link
                  href={route('projects.quizzes.cheating-logs', [project.id, quiz.id])}
                  className={`${actionBtn} bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800`}
                >
                  <FaExclamationTriangle className="text-rose-500" />
                  <span>Cas de triche</span>
                  {cheatingAttemptsCount > 0 && (
                    <span className="ml-1 px-2 py-0.5 text-xs bg-rose-600 text-white font-bold rounded-full">{cheatingAttemptsCount}</span>
                  )}
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Candidats : utilisateurs ProJA inscrits à ce quiz */}
        {canManage && !quiz.is_draft && <CandidatesPanel project={project} quiz={quiz} candidates={candidates} />}
      </div>
    </div>
  );
}

Show.layout = (page) => <AdminLayout>{page}</AdminLayout>;
export default Show;
