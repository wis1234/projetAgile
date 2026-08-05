import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FaClock, FaQuestionCircle, FaPlay, FaArrowLeft, FaTrophy, FaRedo, FaCheckCircle, FaLock, FaChartBar, FaShareAlt, FaCopy, FaCheck } from 'react-icons/fa';

function Show({ project, quiz, attemptsCount, hasActiveAttempt, latestResult, canManage }) {
  const [copied, setCopied] = useState(false);

  const handleLaunch = () => {
    router.post(route('projects.quizzes.launch', [project.id, quiz.id]));
  };

  const handleTogglePublic = () => {
    router.post(route('projects.quizzes.toggle-public-link', [project.id, quiz.id]), {}, {
      preserveScroll: true,
    });
  };

  const handleCopyLink = () => {
    if (!quiz.public_token) return;
    const url = `${window.location.origin}/q/${quiz.public_token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const attemptsExhausted = attemptsCount >= quiz.max_attempts && !hasActiveAttempt;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation */}
        <Link
          href={route('projects.quizzes.index', project.id)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-blue-600 dark:text-gray-400"
        >
          <FaArrowLeft /> Retour à la liste des quiz
        </Link>

        {/* Quiz Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 shadow-sm space-y-6 text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
            <FaQuestionCircle />
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">{quiz.title}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              {quiz.description || 'Aucune instruction supplémentaire.'}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-700/40 rounded-2xl border border-gray-100 dark:border-gray-700/50">
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
                {latestResult ? `${latestResult.score}%` : 'N/A'}
              </span>
            </div>
          </div>

          {/* Public Link Share Box for Managers */}
          {canManage && (
            <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl text-left text-sm space-y-3">
              <div className="flex items-center justify-between">
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

              {quiz.allow_public_access && quiz.public_token && quiz.is_active && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/q/${quiz.public_token}`}
                    className="flex-1 bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs p-2.5 font-mono text-gray-800 dark:text-gray-200"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    {copied ? <FaCheck /> : <FaCopy />}
                    <span>{copied ? 'Copié !' : 'Copier le lien'}</span>
                  </button>
                </div>
              )}
              {quiz.allow_public_access && quiz.public_token && !quiz.is_active && (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Le lien public est configuré, mais le quiz est inactif. Réactivez le quiz pour que le lien fonctionne.
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            {hasActiveAttempt ? (
              <button
                onClick={handleLaunch}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-base transition shadow-md"
              >
                <FaPlay /> Reprendre la tentative en cours
              </button>
            ) : attemptsExhausted ? (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 rounded-xl text-sm font-medium flex items-center gap-2">
                <FaLock /> Vous avez épuisé le nombre maximal d'essais pour ce quiz.
              </div>
            ) : !quiz.is_active ? (
              <div className="p-4 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-xl text-sm font-medium">
                Ce quiz n'est actuellement pas disponible.
              </div>
            ) : (
              <button
                onClick={handleLaunch}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-base transition shadow-md"
              >
                <FaPlay /> Commencer le Quiz
              </button>
            )}

            {latestResult && quiz.show_results && (
              <Link
                href={route('projects.quizzes.results', [project.id, quiz.id])}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-xl text-base transition"
              >
                <FaCheckCircle /> Voir mes résultats
              </Link>
            )}

            <Link
              href={route('projects.quizzes.ranking', [project.id, quiz.id])}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-xl text-base transition"
            >
              <FaChartBar /> Classement
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

Show.layout = (page) => <AdminLayout>{page}</AdminLayout>;
export default Show;
