import React from 'react';
import { FaCheckCircle, FaTimesCircle, FaClock, FaPrint } from 'react-icons/fa';

export default function PublicResults({ quiz, result, attempt, questions = [], responses = [], candidate }) {
  const isPassed = result.score >= 50;
  const answers = attempt?.answers || {};

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-end">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-semibold transition"
          >
            <FaPrint /> Imprimer
          </button>
        </div>

        {/* Summary Card */}
        <div
          className={`bg-white dark:bg-gray-800 rounded-2xl border-t-8 p-8 shadow-sm text-center space-y-4 ${
            isPassed ? 'border-t-emerald-500' : 'border-t-red-500'
          }`}
        >
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            Résultats de l'évaluation : {quiz.title}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Candidat(e) : <span className="font-semibold text-gray-800 dark:text-gray-200">{candidate.name}</span> ({candidate.email})
          </p>

          <div className="inline-flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="text-center">
              <span className="block text-xs uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                Score Obtenu
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
              {isPassed ? 'Admis(e)' : 'Ajourné(e)'}
            </span>
          </div>
        </div>

        {/* Detail */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white pl-1">Détail des réponses</h2>

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
                        <FaClock /> En cours de correction par le responsable
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
