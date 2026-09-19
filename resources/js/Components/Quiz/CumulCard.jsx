import React from 'react';
import { Link, router } from '@inertiajs/react';
import { FaLayerGroup, FaUsers, FaFileExcel, FaFilePdf, FaTrash, FaChartLine, FaShieldAlt, FaStar } from 'react-icons/fa';

const TYPE_TONE = {
  qcm: 'from-blue-500 to-blue-600',
  written: 'from-purple-500 to-purple-600',
  mixed: 'from-amber-500 to-orange-500',
};

/**
 * Carte « Quiz cumulé » : aperçu visuel (grille) des quiz regroupés + accès aux résultats et exports.
 */
export default function CumulCard({ cumul, project }) {
  const handleDelete = () => {
    if (window.confirm(`Supprimer le quiz cumulé « ${cumul.title} » ? Les quiz d'origine ne sont pas affectés.`)) {
      router.delete(route('projects.quiz-cumuls.destroy', [project.id, cumul.id]), { preserveScroll: true });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4 text-white">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-indigo-200">
              <FaLayerGroup /> Quiz cumulé
            </span>
            <h3 className="text-lg font-extrabold leading-tight line-clamp-2">{cumul.title}</h3>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            className="p-2 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition flex-shrink-0"
            title="Supprimer ce cumul"
          >
            <FaTrash />
          </button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-indigo-100">
          <span className="inline-flex items-center gap-1"><FaUsers /> {cumul.candidates_count} candidat(s)</span>
          <span>{cumul.quizzes.length} quiz</span>
          {cumul.include_bonus && <span className="inline-flex items-center gap-1"><FaStar /> Bonus inclus</span>}
        </div>
      </div>

      <div className="p-5 flex-1 space-y-4">
        {cumul.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{cumul.description}</p>
        )}

        {/* Aperçu en grille des quiz regroupés */}
        <div>
          <span className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-2">Quiz regroupés</span>
          <div className="grid grid-cols-2 gap-2">
            {cumul.quizzes.map((q) => (
              <Link
                key={q.id}
                href={route('projects.quizzes.show', [project.id, q.id])}
                className="group relative rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-2.5 hover:border-indigo-300 dark:hover:border-indigo-700 transition overflow-hidden"
              >
                <span className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${TYPE_TONE[q.quiz_type] || TYPE_TONE.qcm}`} />
                <p className="pl-2 text-xs font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 leading-snug">{q.title}</p>
                <div className="pl-2 mt-1.5 flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400">
                  <span className="font-bold text-indigo-600 dark:text-indigo-300">coef. {q.coefficient}</span>
                  {q.validated && <FaShieldAlt className="text-emerald-500" title="Quiz validé en délibération" />}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 flex flex-wrap items-center gap-2">
        <Link
          href={route('projects.quiz-cumuls.show', [project.id, cumul.id])}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition"
        >
          <FaChartLine /> Voir les résultats cumulés
        </Link>
        <a
          href={route('projects.quiz-cumuls.export', [project.id, cumul.id, 'xlsx'])}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold transition"
        >
          <FaFileExcel /> Excel
        </a>
        <a
          href={route('projects.quiz-cumuls.export', [project.id, cumul.id, 'pdf'])}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold transition"
        >
          <FaFilePdf /> PDF
        </a>
      </div>
    </div>
  );
}
