import React, { useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { FaClock, FaQuestionCircle, FaPlay, FaShieldAlt, FaSignInAlt, FaUserPlus } from 'react-icons/fa';
import { Link } from '@inertiajs/react';

export default function PublicShow({ quiz, currentUser, activeAttemptId, latestResultId }) {
  const [loading, setLoading] = useState(false);

  const handleStart = async (e) => {
    e.preventDefault();
    setLoading(true);
    router.post(route('quizzes.public.start', quiz.public_token));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto text-white text-3xl font-extrabold shadow-lg mb-3">
          ProJA
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Évaluation en ligne</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Vous êtes invité(e) à passer le quiz <span className="font-bold text-gray-800 dark:text-gray-200">"{quiz.title}"</span>.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-xl rounded-2xl border border-gray-100 dark:border-gray-700 space-y-6">
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center text-xs">
            <div>
              <FaClock className="mx-auto mb-1 text-blue-500 text-base" />
              <span className="text-gray-500 dark:text-gray-400 block">Durée</span>
              <span className="font-bold text-gray-900 dark:text-white text-sm">{quiz.duration_minutes} min</span>
            </div>
            <div>
              <FaQuestionCircle className="mx-auto mb-1 text-purple-500 text-base" />
              <span className="text-gray-500 dark:text-gray-400 block">Questions</span>
              <span className="font-bold text-gray-900 dark:text-white text-sm">{quiz.questions_count}</span>
            </div>
          </div>

          {quiz.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 bg-blue-50 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
              {quiz.description}
            </p>
          )}

          {currentUser ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200">
                <p className="font-semibold">Connecté en tant que {currentUser.name}</p>
                <p>Votre compte candidat est utilisé pour sécuriser l'accès à ce test et retrouver vos résultats.</p>
              </div>

              {activeAttemptId ? (
                <Link
                  href={route('quizzes.public.take', [quiz.public_token, activeAttemptId])}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-xl text-sm transition shadow-md"
                >
                  <FaPlay /> Reprendre le Quiz
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleStart}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition shadow-md"
                >
                  <FaPlay /> Commencer le Quiz
                </button>
              )}

              {latestResultId && (
                <Link
                  href={route('quizzes.public.results', [quiz.public_token, latestResultId])}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 bg-white text-gray-700 font-semibold rounded-xl text-sm transition hover:bg-gray-50"
                >
                  Voir mon dernier résultat
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-5 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Un compte est requis pour démarrer ce test. Créez un compte ou connectez-vous avec votre adresse email.
              </p>

              <div className="grid gap-3">
                <Link
                  href={route('login', { redirect: route('quizzes.public.start', quiz.public_token), candidate: 1 })}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition shadow-md"
                >
                  <FaSignInAlt /> Se connecter
                </Link>
                <Link
                  href={route('register', { redirect: route('quizzes.public.start', quiz.public_token), candidate: 1 })}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 bg-white text-gray-700 font-semibold rounded-xl text-sm transition hover:bg-gray-50"
                >
                  <FaUserPlus /> Créer un compte candidat
                </Link>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 text-center">
            <FaShieldAlt /> Les données affichées sont strictement liées à votre épreuve.
          </div>
        </div>
      </div>
    </div>
  );
}
