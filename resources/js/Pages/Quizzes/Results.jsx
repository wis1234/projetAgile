import React, { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FaArrowLeft, FaCheckCircle, FaTimesCircle, FaClock, FaCheck, FaPen, FaPrint, FaTrophy } from 'react-icons/fa';

function Results({ project, quiz, result, attempt, questions = [], responses = [], candidate, canGrade }) {
  const { flash = {} } = usePage().props;
  const [gradingState, setGradingState] = useState({});

  const isPassed = result.score >= 50;
  const answers = attempt?.answers || {};

  const handleGradeSubmit = (responseId) => {
    const state = gradingState[responseId];
    if (!state || state.score === undefined) return;

    router.post(
      route('projects.quizzes.grade', [project.id, quiz.id, responseId]),
      {
        score: parseInt(state.score),
        admin_comments: state.admin_comments || '',
      },
      {
        preserveScroll: true,
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Flash Messages */}
        {flash.success && (
          <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 px-5 py-3 rounded-2xl text-sm">
            {flash.success}
          </div>
        )}

        {/* Navigation & Actions */}
        <div className="flex items-center justify-between">
          <Link
            href={route('projects.quizzes.show', [project.id, quiz.id])}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-blue-600 dark:text-gray-400"
          >
            <FaArrowLeft /> Retour aux détails du quiz
          </Link>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-semibold transition"
          >
            <FaPrint /> Imprimer
          </button>
        </div>

        {/* Summary Banner Card */}
        <div
          className={`bg-white dark:bg-gray-800 rounded-2xl border-t-8 p-8 shadow-sm text-center space-y-4 ${
            isPassed ? 'border-t-emerald-500' : 'border-t-red-500'
          }`}
        >
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            Résultats du Quiz : {quiz.title}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Candidat(e) : <span className="font-semibold text-gray-800 dark:text-gray-200">{candidate.name}</span>
          </p>

          <div className="inline-flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="text-center">
              <span className="block text-xs uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                Score Final
              </span>
              <span
                className={`text-5xl font-black ${
                  isPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {result.score}%
              </span>
            </div>
          </div>

          <div>
            <span
              className={`px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                isPassed
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300'
              }`}
            >
              {isPassed ? 'Réussi (Admis)' : 'Échoué'}
            </span>
          </div>
        </div>

        {/* Detailed Questions Review */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white pl-1">Détail des questions</h2>

          {questions.map((q, idx) => {
            if (q.question_type === 'written') {
              const resp = responses.find((r) => r.question_id === q.id);
              const isPending = !resp || resp.grading_status === 'pending';

              return (
                <div
                  key={q.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl border-l-4 border-l-purple-500 border border-gray-100 dark:border-gray-700 p-6 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-xs font-bold text-gray-500 uppercase">Question {idx + 1} (Écrite)</span>
                    {isPending ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 px-2.5 py-1 rounded-full">
                        <FaClock /> Correction en attente
                      </span>
                    ) : (
                      <span className="text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 px-2.5 py-1 rounded-full">
                        Note : {resp.score} / 10 pts
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">{q.question_text}</h3>

                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {resp?.answer_text || <span className="italic text-gray-400">Aucune réponse rédigée.</span>}
                  </div>

                  {resp?.admin_comments && (
                    <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-100 dark:border-purple-800/30 text-xs text-purple-900 dark:text-purple-200">
                      <strong>Commentaire du correcteur :</strong> {resp.admin_comments}
                    </div>
                  )}

                  {/* Grading Form for Managers / Admin */}
                  {canGrade && resp && (
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl">
                      <h4 className="text-xs font-bold uppercase text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                        <FaPen /> Corriger / Noter cette réponse
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Note / 10</label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            defaultValue={resp.score ?? 0}
                            onChange={(e) =>
                              setGradingState({
                                ...gradingState,
                                [resp.id]: {
                                  ...(gradingState[resp.id] || {}),
                                  score: e.target.value,
                                },
                              })
                            }
                            className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Commentaires</label>
                          <input
                            type="text"
                            defaultValue={resp.admin_comments || ''}
                            onChange={(e) =>
                              setGradingState({
                                ...gradingState,
                                [resp.id]: {
                                  ...(gradingState[resp.id] || {}),
                                  admin_comments: e.target.value,
                                },
                              })
                            }
                            placeholder="Observations..."
                            className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleGradeSubmit(resp.id)}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl transition"
                        >
                          Enregistrer la note
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            } else {
              const userAns = answers[q.id];
              const isCorrect = userAns !== undefined && (int)userAns === (int)q.correct_answer;

              return (
                <div
                  key={q.id}
                  className={`bg-white dark:bg-gray-800 rounded-2xl border-l-4 p-6 border shadow-sm space-y-4 border-gray-100 dark:border-gray-700 ${
                    isCorrect ? 'border-l-emerald-500' : 'border-l-red-500'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-xs font-bold text-gray-500 uppercase">Question {idx + 1} (QCM)</span>
                    {isCorrect ? (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <FaCheckCircle /> Correct
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                        <FaTimesCircle /> Incorrect
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">{q.question_text}</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {['a', 'b', 'c', 'd'].map((optKey, optIdx) => {
                      const optText = q[`option_${optKey}`];
                      if (!optText) return null;

                      const isSelected = userAns === optIdx;
                      const isActualCorrect = q.correct_answer === optIdx;

                      let styleClass = 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300';
                      if (isActualCorrect) {
                        styleClass = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-semibold';
                      } else if (isSelected && !isActualCorrect) {
                        styleClass = 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-700 text-red-900 dark:text-red-200';
                      }

                      return (
                        <div
                          key={optKey}
                          className={`p-3 rounded-xl border text-sm flex items-center justify-between ${styleClass}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs uppercase w-5 text-center">{optKey}</span>
                            <span>{optText}</span>
                          </div>
                          {isSelected && (
                            <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-black/10">
                              Votre choix
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
          })}
        </div>
      </div>
    </div>
  );
}

Results.layout = (page) => <AdminLayout>{page}</AdminLayout>;
export default Results;
