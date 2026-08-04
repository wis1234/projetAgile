import React from 'react';

export default function QuizQuestionDisplay({ question, answer, onChange, disabled }) {
  if (question.question_type === 'written') {
    return (
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
          Votre réponse écrite :
        </label>
        <textarea
          value={answer || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={6}
          placeholder="Rédigez votre réponse ici..."
          className="w-full rounded-2xl border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white text-base p-4 focus:border-purple-500 focus:ring-purple-500"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 italic">
          Sauvegarde automatique lors de la saisie.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {['a', 'b', 'c', 'd'].map((optKey, idx) => {
        const optionText = question[`option_${optKey}`];
        if (!optionText) return null;

        const isSelected = answer === idx;

        return (
          <button
            key={optKey}
            type="button"
            disabled={disabled}
            onClick={() => onChange(idx)}
            className={`w-full p-4 text-left rounded-2xl border-2 transition flex items-center gap-4 ${
              isSelected
                ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200 font-semibold shadow-sm ring-2 ring-blue-500/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 text-gray-800 dark:text-gray-200'
            }`}
          >
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm uppercase flex-shrink-0 ${
                isSelected
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              {optKey}
            </span>
            <span className="text-base leading-relaxed flex-1">{optionText}</span>
          </button>
        );
      })}
    </div>
  );
}
