import React, { useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ScoreBadge from '@/Components/Quiz/ScoreBadge';
import {
  FaCheckCircle,
  FaClock,
  FaEnvelopeOpenText,
  FaHourglassHalf,
  FaLock,
  FaPen,
  FaPlay,
  FaQuestionCircle,
  FaRedo,
  FaSearch,
  FaUserCheck,
} from 'react-icons/fa';

// Statut du quiz pour l'utilisateur connecté (calculé côté serveur).
const STATUS = {
  to_take: { label: 'À passer', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300', cta: 'Commencer', icon: <FaPlay /> },
  in_progress: { label: 'En cours', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300', cta: 'Reprendre', icon: <FaPlay /> },
  retake: { label: 'Repassable', cls: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300', cta: 'Ouvrir', icon: <FaRedo /> },
  completed: { label: 'Terminé', cls: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300', cta: 'Ouvrir', icon: <FaCheckCircle /> },
  closed: { label: 'Clôturé', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400', cta: 'Ouvrir', icon: <FaLock /> },
  inactive: { label: 'Indisponible', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400', cta: 'Ouvrir', icon: <FaLock /> },
  draft: { label: 'Brouillon', cls: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300', cta: 'Continuer', icon: <FaPen /> },
};

const FILTERS = [
  { key: 'all', label: 'Tous', test: () => true },
  { key: 'todo', label: 'À passer', test: (q) => ['to_take', 'in_progress', 'retake'].includes(q.status) },
  { key: 'done', label: 'Terminés', test: (q) => ['completed', 'closed'].includes(q.status) || q.attempts_done > 0 },
  { key: 'manage', label: 'Que je gère', test: (q) => q.can_manage },
];

function MyQuizzes({ quizzes = [], candidateOnly = false }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filters = FILTERS.filter((f) => f.key !== 'manage' || quizzes.some((q) => q.can_manage));
  const active = filters.find((f) => f.key === filter) || filters[0];

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return quizzes.filter(
      (q) => active.test(q) && (!needle || `${q.title} ${q.project?.name || ''}`.toLowerCase().includes(needle))
    );
  }, [quizzes, active, search]);

  const counts = useMemo(() => Object.fromEntries(filters.map((f) => [f.key, quizzes.filter(f.test).length])), [quizzes, filters]);
  const toTake = quizzes.filter((q) => ['to_take', 'in_progress'].includes(q.status)).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        {/* En-tête */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 sm:p-6">
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
            <FaQuestionCircle className="text-blue-600" /> {candidateOnly ? 'Mes quiz' : 'Quiz'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {candidateOnly
              ? 'Retrouvez ici les quiz auxquels vous avez été ajouté : passez-les et consultez vos résultats.'
              : 'Tous vos quiz, tous projets confondus : ceux à passer, vos résultats et ceux que vous gérez.'}
          </p>
          {toTake > 0 && (
            <p className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-sm font-semibold">
              <FaEnvelopeOpenText /> {toTake} quiz {toTake > 1 ? 'vous attendent' : 'vous attend'}
            </p>
          )}
        </div>

        {/* Recherche et filtres */}
        {quizzes.length > 0 && (
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un quiz ou un projet…"
                className="w-full pl-10 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-wrap gap-2" role="tablist">
              {filters.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  role="tab"
                  aria-selected={active.key === f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition ${
                    active.key === f.key
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                >
                  {f.label} <span className="opacity-70">({counts[f.key]})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Liste */}
        {quizzes.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-10 sm:p-14 text-center">
            <FaQuestionCircle className="text-5xl mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Aucun quiz pour le moment</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              {candidateOnly
                ? 'Vous serez notifié dès qu\'un responsable vous ajoutera à un quiz.'
                : 'Les quiz de vos projets apparaîtront ici.'}
            </p>
          </div>
        ) : visible.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-10">Aucun quiz ne correspond à votre recherche.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {visible.map((q) => (
              <QuizTile key={q.id} quiz={q} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QuizTile({ quiz }) {
  const status = STATUS[quiz.status] || STATUS.to_take;
  const showHref = route('projects.quizzes.show', [quiz.project.id, quiz.id]);
  const canSeeResults = quiz.attempts_done > 0 && quiz.show_results;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between gap-4">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-gray-900 dark:text-white line-clamp-2">{quiz.title}</h3>
          <span className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold ${status.cls}`}>{status.label}</span>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Projet : {quiz.project.name}</p>

        <div className="flex flex-wrap gap-1.5">
          {quiz.invited && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
              <FaUserCheck /> Vous êtes membre de ce quiz
            </span>
          )}
          {quiz.validated && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              <FaLock /> Résultats validés
            </span>
          )}
          {quiz.can_manage && quiz.pending_copies > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              <FaHourglassHalf /> {quiz.pending_copies} copie(s) à corriger
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center bg-gray-50 dark:bg-gray-700/40 rounded-xl p-3 text-xs text-gray-500 dark:text-gray-400">
          <div>
            <FaClock className="mx-auto mb-1 text-blue-500" />
            {quiz.duration_minutes} min
          </div>
          <div>
            <FaQuestionCircle className="mx-auto mb-1 text-purple-500" />
            {quiz.questions_count} question(s)
          </div>
          <div>
            <FaRedo className="mx-auto mb-1 text-emerald-500" />
            {quiz.attempts_done} / {quiz.max_attempts} essai(s)
          </div>
        </div>

        {quiz.attempts_done > 0 && quiz.show_results && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Mon résultat</span>
            <ScoreBadge score={quiz.score} pending={quiz.score_pending} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
        <Link
          href={showHref}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
        >
          {status.icon} {status.cta}
        </Link>
        {canSeeResults && (
          <Link
            href={route('projects.quizzes.results', [quiz.project.id, quiz.id])}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-semibold transition"
          >
            <FaCheckCircle /> Résultats
          </Link>
        )}
      </div>
    </div>
  );
}

MyQuizzes.layout = (page) => <AdminLayout>{page}</AdminLayout>;
export default MyQuizzes;
