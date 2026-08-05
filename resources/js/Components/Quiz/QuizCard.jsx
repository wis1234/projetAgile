import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { FaClock, FaQuestionCircle, FaPlay, FaEdit, FaTrash, FaCheckCircle, FaTrophy, FaEye, FaLock, FaShareAlt, FaCopy, FaCheck } from 'react-icons/fa';

export default function QuizCard({ quiz, project, canManage }) {
  const [copied, setCopied] = useState(false);

  const getTypeBadge = (type) => {
    switch (type) {
      case 'written':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">Écrit</span>;
      case 'mixed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">Mixte</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">QCM</span>;
    }
  };

  const handleDelete = (e) => {
    e.preventDefault();
    if (confirm(`Êtes-vous sûr de vouloir supprimer le quiz "${quiz.title}" ?`)) {
      router.delete(route('projects.quizzes.destroy', [project.id, quiz.id]));
    }
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition">
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">{quiz.title}</h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            {getTypeBadge(quiz.quiz_type)}
            {!quiz.is_active && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">Inactif</span>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
          {quiz.description || 'Aucune description fournie.'}
        </p>

        <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 dark:text-gray-400 mb-4 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl">
          <div className="flex items-center gap-1.5">
            <FaClock className="text-blue-500" />
            <span>{quiz.duration_minutes} minutes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FaQuestionCircle className="text-purple-500" />
            <span>{quiz.questions_count ?? 0} questions</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FaPlay className="text-emerald-500" />
            <span>{quiz.user_attempts_count ?? 0} / {quiz.max_attempts} essai(s)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FaTrophy className="text-amber-500" />
            <span>Score: {quiz.user_latest_score !== null && quiz.user_latest_score !== undefined ? `${quiz.user_latest_score}%` : 'N/A'}</span>
          </div>
        </div>

        {/* Public Share Widget */}
        {canManage && (
          <div className="mb-4 p-3 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                <FaShareAlt className="text-indigo-600" /> Lien candidat externe
              </span>
              <button
                type="button"
                onClick={handleTogglePublic}
                className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase transition ${
                  quiz.allow_public_access
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {quiz.allow_public_access ? 'Activé' : 'Désactivé'}
              </button>
            </div>

            {quiz.allow_public_access && quiz.public_token && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/q/${quiz.public_token}`}
                  className="flex-1 bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-800 rounded-lg text-[11px] p-1.5 truncate text-gray-700 dark:text-gray-300"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center gap-1 transition"
                  title="Copier le lien unique"
                >
                  {copied ? <FaCheck /> : <FaCopy />}
                  <span>{copied ? 'Copié !' : 'Copier'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700 gap-2">
        <div className="flex items-center gap-2">
          {quiz.is_active ? (
            <Link
              href={route('projects.quizzes.show', [project.id, quiz.id])}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition"
            >
              <FaPlay className="text-[10px]" /> Commencer / Détails
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-xl text-xs font-semibold cursor-not-allowed">
              <FaLock className="text-[10px]" /> Inactif
            </span>
          )}

          {quiz.user_has_completed && quiz.show_results && (
            <Link
              href={route('projects.quizzes.results', [project.id, quiz.id])}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded-xl text-xs font-semibold transition"
            >
              <FaCheckCircle /> Résultats
            </Link>
          )}
        </div>

        {canManage && (
          <div className="flex items-center gap-1">
            <Link
              href={route('projects.quizzes.edit', [project.id, quiz.id])}
              className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-lg transition"
              title="Modifier"
            >
              <FaEdit />
            </Link>
            <button
              onClick={handleDelete}
              className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-lg transition"
              title="Supprimer"
            >
              <FaTrash />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
