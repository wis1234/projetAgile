import React from 'react';
import { Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import QuizCard from '@/Components/Quiz/QuizCard';
import CumulCard from '@/Components/Quiz/CumulCard';
import { FaPlus, FaArrowLeft, FaQuestionCircle, FaLayerGroup, FaStar } from 'react-icons/fa';

function Index({ project, quizzes = [], cumuls = [], canManage }) {
  // Les messages flash (succès / erreur) sont affichés par le layout.
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="min-w-0">
            <Link
              href={route('projects.show', project.id)}
              className="text-xs font-semibold text-gray-500 hover:text-blue-600 dark:text-gray-400 inline-flex items-center gap-1 mb-1"
            >
              <FaArrowLeft /> Retour au projet {project.name}
            </Link>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
              <FaQuestionCircle className="text-blue-600 flex-shrink-0" />
              <span className="truncate">Quiz du projet : {project.name}</span>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Consultez, passez ou gérez les évaluations interactives associées à ce projet.
            </p>
          </div>

          {canManage && (
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <Link
                href={route('projects.participation.index', project.id)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 font-semibold rounded-xl text-sm transition"
                title="Attribuer des points aux membres qui s'impliquent pendant les formations"
              >
                <FaStar className="text-amber-500" /> Bonus de participation
              </Link>
              <Link
                href={route('projects.quiz-cumuls.create', project.id)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 font-semibold rounded-xl text-sm transition"
              >
                <FaLayerGroup /> Cumuler plusieurs quiz
              </Link>
              <Link
                href={route('projects.quizzes.create', project.id)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition shadow-sm"
              >
                <FaPlus /> Créer un Quiz
              </Link>
            </div>
          )}
        </div>

        {/* Quiz cumulés */}
        {canManage && cumuls.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 pl-1">
              <FaLayerGroup className="text-indigo-500" /> Quiz cumulés
              <span className="text-xs font-semibold text-gray-400">({cumuls.length})</span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {cumuls.map((c) => (
                <CumulCard key={c.id} cumul={c} project={project} />
              ))}
            </div>
          </section>
        )}

        {/* Quiz */}
        <section className="space-y-3">
          {canManage && cumuls.length > 0 && (
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 pl-1">
              <FaQuestionCircle className="text-blue-500" /> Quiz
              <span className="text-xs font-semibold text-gray-400">({quizzes.length})</span>
            </h2>
          )}

          {quizzes.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center">
              <FaQuestionCircle className="text-5xl mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Aucun quiz disponible</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                Il n&apos;y a pas encore de quiz créés pour ce projet.
              </p>
              {canManage && (
                <Link
                  href={route('projects.quizzes.create', project.id)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition"
                >
                  <FaPlus /> Créer le premier quiz
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} project={project} canManage={canManage} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

Index.layout = (page) => <AdminLayout>{page}</AdminLayout>;
export default Index;
