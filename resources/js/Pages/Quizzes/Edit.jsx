import React from 'react';
import { useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import QuizFormBuilder from '@/Components/Quiz/QuizFormBuilder';
import { FaArrowLeft, FaSave, FaEdit } from 'react-icons/fa';

function Edit({ project, quiz }) {
  const { data, setData, put, processing, errors } = useForm({
    title: quiz.title || '',
    description: quiz.description || '',
    quiz_type: quiz.quiz_type || 'qcm',
    duration_minutes: quiz.duration_minutes || 15,
    max_attempts: quiz.max_attempts || 1,
    is_active: quiz.is_active ?? true,
    show_results: quiz.show_results ?? true,
    questions: (quiz.questions || []).map((q) => ({
      id: q.id,
      question_text: q.question_text || '',
      question_type: q.question_type || 'qcm',
      option_a: q.option_a || '',
      option_b: q.option_b || '',
      option_c: q.option_c || '',
      option_d: q.option_d || '',
      correct_answer: q.correct_answer ?? 0,
    })),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    put(route('projects.quizzes.update', [project.id, quiz.id]));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div>
            <Link
              href={route('projects.quizzes.index', project.id)}
              className="text-xs font-semibold text-gray-500 hover:text-blue-600 dark:text-gray-400 flex items-center gap-1 mb-1"
            >
              <FaArrowLeft /> Retour aux quiz
            </Link>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <FaEdit className="text-blue-600" />
              Modifier le Quiz : {quiz.title}
            </h1>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-gray-700">
              Paramètres généraux
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Titre du quiz *
                </label>
                <input
                  type="text"
                  value={data.title}
                  onChange={(e) => setData('title', e.target.value)}
                  className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white text-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white text-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Type de Quiz *
                </label>
                <select
                  value={data.quiz_type}
                  onChange={(e) => setData('quiz_type', e.target.value)}
                  className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white text-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="qcm">QCM uniquement</option>
                  <option value="written">Questions Écrites</option>
                  <option value="mixed">Mixte (QCM + Écrit)</option>
                </select>
                {errors.quiz_type && <p className="text-xs text-red-500 mt-1">{errors.quiz_type}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Durée (en minutes) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="360"
                  value={data.duration_minutes}
                  onChange={(e) => setData('duration_minutes', parseInt(e.target.value) || 1)}
                  className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white text-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
                {errors.duration_minutes && <p className="text-xs text-red-500 mt-1">{errors.duration_minutes}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Nombre d'essais maximum *
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={data.max_attempts}
                  onChange={(e) => setData('max_attempts', parseInt(e.target.value) || 1)}
                  className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white text-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
                {errors.max_attempts && <p className="text-xs text-red-500 mt-1">{errors.max_attempts}</p>}
              </div>

              <div className="flex items-center gap-6 pt-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={data.is_active}
                    onChange={(e) => setData('is_active', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Quiz actif</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={data.show_results}
                    onChange={(e) => setData('show_results', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Afficher les résultats aux membres</span>
                </label>
              </div>
            </div>
          </div>

          {/* Question Builder */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <QuizFormBuilder
              questions={data.questions}
              setQuestions={(qs) => setData('questions', qs)}
              errors={errors}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Link
              href={route('projects.quizzes.index', project.id)}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-xl transition"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={processing}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition shadow-sm"
            >
              <FaSave /> Mettre à jour le Quiz
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

Edit.layout = (page) => <AdminLayout>{page}</AdminLayout>;
export default Edit;
