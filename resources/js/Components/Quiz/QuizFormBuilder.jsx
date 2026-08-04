import React from 'react';
import { FaPlus, FaTrash, FaArrowUp, FaArrowDown, FaCheckCircle } from 'react-icons/fa';

export default function QuizFormBuilder({ questions, setQuestions, errors }) {
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: '',
        question_type: 'qcm',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: 0,
      },
    ]);
  };

  const removeQuestion = (index) => {
    if (questions.length === 1) {
      alert('Un quiz doit contenir au moins une question.');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const moveQuestion = (index, direction) => {
    if ((direction === -1 && index === 0) || (direction === 1 && index === questions.length - 1)) {
      return;
    }
    const updated = [...questions];
    const temp = updated[index];
    updated[index] = updated[index + direction];
    updated[index + direction] = temp;
    setQuestions(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Questions ({questions.length})</h3>
        <button
          type="button"
          onClick={addQuestion}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition"
        >
          <FaPlus /> Ajouter une question
        </button>
      </div>

      {questions.map((q, idx) => (
        <div
          key={idx}
          className="bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
            <span className="font-bold text-sm text-gray-700 dark:text-gray-300">
              Question {idx + 1}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => moveQuestion(idx, -1)}
                disabled={idx === 0}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
              >
                <FaArrowUp />
              </button>
              <button
                type="button"
                onClick={() => moveQuestion(idx, 1)}
                disabled={idx === questions.length - 1}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
              >
                <FaArrowDown />
              </button>
              <button
                type="button"
                onClick={() => removeQuestion(idx)}
                className="p-1 text-red-500 hover:text-red-700"
                title="Supprimer la question"
              >
                <FaTrash />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Intitulé de la question *
              </label>
              <textarea
                value={q.question_text}
                onChange={(e) => updateQuestion(idx, 'question_text', e.target.value)}
                rows={2}
                placeholder="Entrez le texte de la question..."
                className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white text-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
              {errors?.[`questions.${idx}.question_text`] && (
                <p className="text-xs text-red-500 mt-1">{errors[`questions.${idx}.question_text`]}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Type de question
              </label>
              <select
                value={q.question_type}
                onChange={(e) => updateQuestion(idx, 'question_type', e.target.value)}
                className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white text-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="qcm">Choix Multiple (QCM)</option>
                <option value="written">Réponse Écrite</option>
              </select>
            </div>
          </div>

          {q.question_type === 'qcm' && (
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Options de réponse (Cochez la bonne réponse) *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {['a', 'b', 'c', 'd'].map((optKey, optIdx) => (
                  <div
                    key={optKey}
                    className={`flex items-center gap-2 p-2 rounded-xl border transition ${
                      q.correct_answer === optIdx
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`correct_answer_${idx}`}
                      checked={q.correct_answer === optIdx}
                      onChange={() => updateQuestion(idx, 'correct_answer', optIdx)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-bold text-xs uppercase text-gray-500 w-4">{optKey}</span>
                    <input
                      type="text"
                      value={q[`option_${optKey}`] || ''}
                      onChange={(e) => updateQuestion(idx, `option_${optKey}`, e.target.value)}
                      placeholder={`Option ${optKey.toUpperCase()}`}
                      className="flex-1 bg-transparent border-0 text-sm focus:ring-0 dark:text-white p-0"
                      required={optIdx < 2}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {q.question_type === 'written' && (
            <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-800/30 rounded-xl text-xs text-purple-700 dark:text-purple-300">
              Note : Les questions écrites nécessitent une correction manuelle par un responsable du projet après la soumission.
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
