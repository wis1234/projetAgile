import React from 'react';
import {
  FaPlus, FaTrash, FaArrowUp, FaArrowDown, FaCheckCircle, FaSave, FaSpinner,
  FaExclamationCircle, FaLock, FaPen,
} from 'react-icons/fa';

/**
 * Liste des questions.
 *  - `questions` est dans l'ordre du quiz (Q1 → Qn) mais AFFICHÉE À L'ENVERS :
 *    la question qu'on vient d'ajouter apparaît toujours en haut, sans défilement.
 *  - Chaque question possède son propre bouton « Enregistrer la question ».
 */
export const isQuestionDirty = (q) => !q.id || q._snapshot !== snapshotOf(q);

export const snapshotOf = (q) =>
  JSON.stringify(
    q.question_type === 'written'
      ? { t: q.question_text, y: 'written' }
      : {
          t: q.question_text,
          y: 'qcm',
          a: q.option_a, b: q.option_b, c: q.option_c, d: q.option_d,
          k: q.correct_answer,
        }
  );

const inputCls =
  'w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white text-sm focus:border-blue-500 focus:ring-blue-500';

function StatusChip({ q }) {
  if (q._status === 'saving') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
        <FaSpinner className="animate-spin" /> Enregistrement…
      </span>
    );
  }
  if (!q.id) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-0.5 rounded-full">
        <FaExclamationCircle /> Non enregistrée
      </span>
    );
  }
  if (isQuestionDirty(q)) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-700 bg-orange-100 dark:bg-orange-900/40 dark:text-orange-300 px-2 py-0.5 rounded-full">
        <FaPen className="text-[10px]" /> Modifications non enregistrées
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300 px-2 py-0.5 rounded-full">
      <FaCheckCircle /> Enregistrée
    </span>
  );
}

function QuestionCard({ q, number, isFirstVisual, isLastVisual, structureLocked, onChange, onSave, onDelete, onMove }) {
  const dirty = isQuestionDirty(q);
  const fe = q._fieldErrors || {};
  const isNew = !q.id;

  return (
    <div
      data-question-uid={q._uid}
      className={`bg-gray-50 dark:bg-gray-800/80 border rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 transition ${
        isNew ? 'border-amber-300 dark:border-amber-700 ring-2 ring-amber-100 dark:ring-amber-900/30'
          : dirty ? 'border-orange-300 dark:border-orange-700'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center justify-center min-w-[2rem] h-8 px-2 rounded-lg bg-blue-600 text-white text-xs font-extrabold">
            Q{number}
          </span>
          <StatusChip q={q} />
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => onMove(-1)} disabled={isFirstVisual}
            className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30" title="Monter">
            <FaArrowUp />
          </button>
          <button type="button" onClick={() => onMove(1)} disabled={isLastVisual}
            className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30" title="Descendre">
            <FaArrowDown />
          </button>
          <button type="button" onClick={onDelete} disabled={structureLocked && !isNew}
            className="p-2 text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed" title="Supprimer la question">
            <FaTrash />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Intitulé de la question *</label>
          <textarea
            value={q.question_text}
            onChange={(e) => onChange('question_text', e.target.value)}
            rows={2}
            placeholder="Entrez le texte de la question..."
            className={inputCls}
          />
          {fe.question_text && <p className="text-xs text-red-500 mt-1">{fe.question_text}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Type de question {structureLocked && !isNew && <FaLock className="inline ml-1 text-gray-400" />}
          </label>
          <select
            value={q.question_type}
            onChange={(e) => onChange('question_type', e.target.value)}
            disabled={structureLocked && !isNew}
            className={`${inputCls} disabled:opacity-60`}
          >
            <option value="qcm">Choix Multiple (QCM)</option>
            <option value="written">Réponse Écrite</option>
          </select>
          {fe.question_type && <p className="text-xs text-red-500 mt-1">{fe.question_type}</p>}
        </div>
      </div>

      {q.question_type === 'qcm' && (
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
            Options de réponse (cochez la bonne réponse) *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {['a', 'b', 'c', 'd'].map((key, i) => (
              <div
                key={key}
                className={`flex items-center gap-2 p-2 rounded-xl border transition ${
                  q.correct_answer === i
                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                }`}
              >
                <input
                  type="radio"
                  name={`correct_${q._uid}`}
                  checked={q.correct_answer === i}
                  disabled={structureLocked && !isNew}
                  onChange={() => onChange('correct_answer', i)}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-bold text-xs uppercase text-gray-500 w-4">{key}</span>
                <input
                  type="text"
                  value={q[`option_${key}`] || ''}
                  onChange={(e) => onChange(`option_${key}`, e.target.value)}
                  placeholder={`Option ${key.toUpperCase()}${i < 2 ? '' : ' (facultative)'}`}
                  className="flex-1 min-w-0 bg-transparent border-0 text-sm focus:ring-0 dark:text-white p-0"
                />
              </div>
            ))}
          </div>
          {(fe.option_a || fe.option_b || fe.correct_answer) && (
            <p className="text-xs text-red-500">{fe.option_a || fe.option_b || fe.correct_answer}</p>
          )}
        </div>
      )}

      {q.question_type === 'written' && (
        <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-800/30 rounded-xl text-xs text-purple-700 dark:text-purple-300">
          Les questions écrites sont corrigées manuellement (note sur 10) dans l&apos;<strong>espace de correction</strong>, après la soumission.
        </div>
      )}

      {q._error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300">
          {q._error}
        </div>
      )}

      {/* Bouton d'enregistrement propre à cette question */}
      <div className="flex items-center justify-end pt-3 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onSave}
          disabled={q._status === 'saving' || (!isNew && !dirty)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition"
        >
          {q._status === 'saving' ? <FaSpinner className="animate-spin" /> : <FaSave />}
          {isNew ? 'Enregistrer la question' : dirty ? 'Enregistrer les modifications' : 'Question enregistrée'}
        </button>
      </div>
    </div>
  );
}

export default function QuizFormBuilder({
  questions,
  structureLocked = false,
  listRef,
  onAdd,
  onChange,
  onSave,
  onDelete,
  onMove,
}) {
  const savedCount = questions.filter((q) => q.id && !isQuestionDirty(q)).length;

  // Affichage inversé : la plus récente (dernier index) en premier.
  const visual = [...questions.keys()].reverse();

  return (
    <div className="space-y-5" ref={listRef}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Questions ({questions.length})</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {savedCount}/{questions.length} enregistrée(s) · les nouvelles questions apparaissent en haut.
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={structureLocked}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold transition shadow-sm"
        >
          <FaPlus /> Ajouter une question
        </button>
      </div>

      {structureLocked && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-200">
          <FaLock className="mt-0.5 flex-shrink-0" />
          <span>
            Des candidats ont déjà composé ce quiz : la structure est verrouillée pour ne pas fausser leurs résultats.
            Vous pouvez corriger les libellés, mais pas ajouter/supprimer une question ni changer son type ou sa bonne réponse.
          </span>
        </div>
      )}

      {questions.length === 0 && (
        <div className="text-center py-10 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-sm text-gray-500 dark:text-gray-400">
          Aucune question pour le moment. Cliquez sur « Ajouter une question ».
        </div>
      )}

      {visual.map((idx, pos) => (
        <QuestionCard
          key={questions[idx]._uid}
          q={questions[idx]}
          number={idx + 1}
          isFirstVisual={pos === 0}
          isLastVisual={pos === visual.length - 1}
          structureLocked={structureLocked}
          onChange={(field, value) => onChange(idx, field, value)}
          onSave={() => onSave(idx)}
          onDelete={() => onDelete(idx)}
          onMove={(dir) => onMove(idx, dir)}
        />
      ))}
    </div>
  );
}
