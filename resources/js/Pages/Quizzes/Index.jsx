import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import QuizCard from '@/Components/Quiz/QuizCard';
import { FaPlus, FaArrowLeft, FaQuestionCircle } from 'react-icons/fa';

function Index({ project, quizzes = [], canManage }) {
  const { flash = {} } = usePage().props;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Flash Messages */}
        {flash.success && (
          <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 px-5 py-3 rounded-2xl text-sm">
            {flash.success}
          </div>
        )}
        {flash.error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 px-5 py-3 rounded-2xl text-sm">
            {flash.error}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href={route('projects.show', project.id)}
                className="text-xs font-semibold text-gray-500 hover:text-blue-600 dark:text-gray-400 flex items-center gap-1"
              >
                <FaArrowLeft /> Retour au projet {project.name}
              </Link>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
              <FaQuestionCircle className="text-blue-600" />
              Quiz du projet : {project.name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Consultez, passez ou gérez les évaluations interactives associées à ce projet.
            </p>
          </div>

          {canManage && (
            <Link
              href={route('projects.quizzes.create', project.id)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition shadow-sm flex-shrink-0"
            >
              <FaPlus /> Créer un Quiz
            </Link>
          )}
        </div>

        {/* Quiz Grid */}
        {quizzes.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center">
            <FaQuestionCircle className="text-5xl mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Aucun quiz disponible</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
              Il n'y a pas encore de quiz créés pour ce projet.
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
      </div>
    </div>
  );
}

Index.layout = (page) => <AdminLayout>{page}</AdminLayout>;
export default Index;
