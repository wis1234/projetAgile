import React, { useCallback, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Link, router } from '@inertiajs/react';
import { FaArrowLeft, FaSave, FaSpinner, FaQuestionCircle, FaEdit, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';
import QuizFormBuilder, { snapshotOf, isQuestionDirty } from '@/Components/Quiz/QuizFormBuilder';

const blankQuestion = () => ({
  _uid: `n${Date.now()}${Math.random().toString(36).slice(2, 7)}`,
  id: null,
  question_text: '',
  question_type: 'qcm',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_answer: 0,
  _status: 'idle',
  _error: null,
  _fieldErrors: {},
  _snapshot: null,
});

const fromServer = (q) => {
  const item = {
    ...blankQuestion(),
    _uid: `q${q.id}`,
    id: q.id,
    question_text: q.question_text || '',
    question_type: q.question_type || 'qcm',
    option_a: q.option_a || '',
    option_b: q.option_b || '',
    option_c: q.option_c || '',
    option_d: q.option_d || '',
    correct_answer: q.correct_answer ?? 0,
  };
  item._snapshot = snapshotOf(item);
  return item;
};

const questionPayload = (q) => ({
  question_text: q.question_text,
  question_type: q.question_type,
  option_a: q.option_a,
  option_b: q.option_b,
  option_c: q.option_c,
  option_d: q.option_d,
  correct_answer: q.question_type === 'qcm' ? q.correct_answer : null,
});

const flatErrors = (errors = {}) =>
  Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));

const inputCls =
  'w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white text-sm focus:border-blue-500 focus:ring-blue-500';

/**
 * Éditeur de quiz partagé par « Créer » et « Modifier ».
 *  - Bouton « Enregistrer le quiz » en haut à droite de « Paramètres généraux ».
 *  - Chaque question s'enregistre individuellement (le quiz est créé en brouillon à la 1re sauvegarde).
 *  - Les nouvelles questions s'affichent en haut de la liste.
 */
export default function QuizEditor({ project, quiz = null, structureLocked = false, validated = false }) {
  const isEdit = !!quiz && !quiz.is_draft;

  const [quizId, setQuizId] = useState(quiz?.id ?? null);
  const [settings, setSettings] = useState({
    title: quiz?.title || '',
    description: quiz?.description || '',
    duration_minutes: quiz?.duration_minutes || 15,
    max_attempts: quiz?.max_attempts || 1,
    is_active: quiz?.is_draft ? true : quiz?.is_active ?? true,
    show_results: quiz?.show_results ?? true,
  });
  const [questions, setQuestions] = useState(() => (quiz?.questions || []).map(fromServer));
  const [settingsErrors, setSettingsErrors] = useState({});
  const [globalError, setGlobalError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const listRef = useRef(null);
  const topRef = useRef(null);
  const noticeTimer = useRef(null);

  const flash = useCallback((message) => {
    setNotice(message);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 2500);
  }, []);

  const patchQuestion = useCallback((uid, patch) => {
    setQuestions((prev) => prev.map((q) => (q._uid === uid ? { ...q, ...patch } : q)));
  }, []);

  const quizType = useMemo(() => {
    const types = new Set(questions.map((q) => q.question_type));
    if (types.size > 1) return 'Mixte (QCM + écrit)';
    return types.has('written') ? 'Questions écrites' : 'QCM';
  }, [questions]);

  const setSetting = (key, value) => {
    setSettings((s) => ({ ...s, [key]: value }));
    if (settingsErrors[key]) setSettingsErrors((e) => ({ ...e, [key]: undefined }));
  };

  // ── Ajout : la nouvelle question est placée en haut de la liste (affichage inversé) ──
  const addQuestion = () => {
    const q = blankQuestion();
    setQuestions((prev) => [...prev, q]);
    requestAnimationFrame(() => {
      const el = listRef.current?.querySelector(`[data-question-uid="${q._uid}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.querySelector('textarea')?.focus({ preventScroll: true });
    });
  };

  const changeQuestion = (idx, field, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, [field]: value, _error: null, _fieldErrors: { ...q._fieldErrors, [field]: undefined } } : q))
    );
  };

  // Crée le brouillon au besoin : permet d'enregistrer une question avant le quiz complet.
  const ensureQuiz = async () => {
    if (quizId) return quizId;

    try {
      const { data } = await axios.post(route('projects.quizzes.draft', project.id), settings);
      setQuizId(data.quiz.id);
      return data.quiz.id;
    } catch (err) {
      if (err.response?.status === 422) {
        setSettingsErrors(flatErrors(err.response.data.errors));
        setGlobalError('Renseignez d\'abord les paramètres généraux (titre du quiz) avant d\'enregistrer une question.');
        topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        setGlobalError(err.response?.data?.message || 'Impossible de créer le brouillon du quiz.');
      }
      return null;
    }
  };

  const saveQuestion = async (idx) => {
    const q = questions[idx];
    if (!q.question_text.trim()) {
      patchQuestion(q._uid, { _fieldErrors: { question_text: 'L\'intitulé de la question est obligatoire.' } });
      return;
    }
    if (q.question_type === 'qcm' && (!q.option_a.trim() || !q.option_b.trim())) {
      patchQuestion(q._uid, { _fieldErrors: { option_a: 'Les options A et B sont obligatoires pour un QCM.' } });
      return;
    }

    patchQuestion(q._uid, { _status: 'saving', _error: null, _fieldErrors: {} });
    setGlobalError(null);

    const id = await ensureQuiz();
    if (!id) {
      patchQuestion(q._uid, { _status: 'idle' });
      return;
    }

    try {
      const { data } = q.id
        ? await axios.put(route('projects.quizzes.questions.update', [project.id, id, q.id]), questionPayload(q))
        : await axios.post(route('projects.quizzes.questions.store', [project.id, id]), questionPayload(q));

      const saved = fromServer(data.question);
      patchQuestion(q._uid, { ...saved, _uid: q._uid, _status: 'idle' });
      flash(`Question ${idx + 1} enregistrée`);

      // Le serveur ajoute la question en fin de quiz : on réaligne l'ordre sur l'ordre affiché.
      persistOrder(id, questions.map((x) => (x._uid === q._uid ? { ...x, id: data.question.id } : x)));
    } catch (err) {
      const res = err.response;
      patchQuestion(q._uid, {
        _status: 'idle',
        _fieldErrors: res?.status === 422 ? flatErrors(res.data.errors) : {},
        _error: res?.status === 422
          ? Object.values(flatErrors(res.data.errors))[0]
          : res?.data?.message || 'Échec de l\'enregistrement de la question.',
      });
    }
  };

  const deleteQuestion = async (idx) => {
    const q = questions[idx];
    if (!window.confirm(`Supprimer la question ${idx + 1} ?`)) return;

    if (q.id && quizId) {
      try {
        await axios.delete(route('projects.quizzes.questions.destroy', [project.id, quizId, q.id]));
      } catch (err) {
        const errs = err.response?.data?.errors;
        patchQuestion(q._uid, { _error: (errs && Object.values(flatErrors(errs))[0]) || err.response?.data?.message || 'Suppression impossible.' });
        return;
      }
    }
    setQuestions((prev) => prev.filter((x) => x._uid !== q._uid));
  };

  // Ordre persisté dès que possible (questions déjà enregistrées uniquement)
  const persistOrder = (id, list = null) => {
    const source = list ?? questionsRef.current;
    const ids = source.filter((q) => q.id).map((q) => q.id);
    if (id && ids.length > 1) {
      axios.post(route('projects.quizzes.questions.reorder', [project.id, id]), { ids }).catch(() => {});
    }
  };
  const questionsRef = useRef(questions);
  questionsRef.current = questions;

  const moveQuestion = (idx, dir) => {
    // dir = -1 : « monter » dans la liste affichée (= index supérieur dans l'ordre du quiz)
    const target = idx - dir;
    if (target < 0 || target >= questions.length) return;
    const next = [...questions];
    [next[idx], next[target]] = [next[target], next[idx]];
    setQuestions(next);
    if (quizId) persistOrder(quizId, next);
  };

  const validateBeforeSave = () => {
    const errs = {};
    if (!settings.title.trim()) errs.title = 'Le titre du quiz est obligatoire.';
    setSettingsErrors(errs);

    if (errs.title) {
      setGlobalError('Renseignez le titre du quiz.');
      topRef.current?.scrollIntoView({ behavior: 'smooth' });
      return false;
    }
    if (questions.length === 0) {
      setGlobalError('Ajoutez au moins une question avant d\'enregistrer le quiz.');
      return false;
    }

    let firstInvalid = null;
    setQuestions((prev) =>
      prev.map((q) => {
        const fe = {};
        if (!q.question_text.trim()) fe.question_text = 'L\'intitulé de la question est obligatoire.';
        if (q.question_type === 'qcm' && (!q.option_a.trim() || !q.option_b.trim())) fe.option_a = 'Les options A et B sont obligatoires pour un QCM.';
        if (Object.keys(fe).length && !firstInvalid) firstInvalid = q._uid;
        return { ...q, _fieldErrors: fe };
      })
    );
    if (firstInvalid) {
      setGlobalError('Certaines questions sont incomplètes.');
      requestAnimationFrame(() =>
        listRef.current?.querySelector(`[data-question-uid="${firstInvalid}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      );
      return false;
    }
    return true;
  };

  // ── Enregistrement global du quiz (paramètres + toutes les questions) ──
  const saveQuiz = (e) => {
    e?.preventDefault();
    setGlobalError(null);
    if (!validateBeforeSave()) return;

    const payload = {
      ...settings,
      questions: questions.map((q) => ({ ...(q.id ? { id: q.id } : {}), ...questionPayload(q) })),
    };

    const opts = {
      preserveScroll: true,
      onStart: () => setSaving(true),
      onFinish: () => setSaving(false),
      onError: (errors) => {
        const flat = flatErrors(errors);
        setSettingsErrors(flat);
        setGlobalError(Object.values(flat)[0] || 'Le quiz n\'a pas pu être enregistré.');
        topRef.current?.scrollIntoView({ behavior: 'smooth' });
      },
    };

    if (quizId) {
      router.put(route('projects.quizzes.update', [project.id, quizId]), payload, opts);
    } else {
      router.post(route('projects.quizzes.store', project.id), payload, opts);
    }
  };

  const dirtyCount = questions.filter((q) => isQuestionDirty(q)).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5" ref={topRef}>
        {/* En-tête */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
          <Link
            href={route('projects.quizzes.index', project.id)}
            className="text-xs font-semibold text-gray-500 hover:text-blue-600 dark:text-gray-400 flex items-center gap-1 mb-1"
          >
            <FaArrowLeft /> Retour aux quiz
          </Link>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            {isEdit ? <FaEdit className="text-blue-600" /> : <FaQuestionCircle className="text-blue-600" />}
            {isEdit ? `Modifier le quiz : ${quiz.title}` : 'Créer un nouveau quiz'}
          </h1>
          {quizId && !isEdit && (
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1">
              <FaInfoCircle /> Brouillon enregistré : il n&apos;est visible que de vous tant que vous n&apos;avez pas cliqué sur « Enregistrer le quiz ».
            </p>
          )}
        </div>

        {validated && (
          <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl text-sm text-red-700 dark:text-red-300">
            Ce quiz a été validé en délibération : il ne peut plus être modifié.
          </div>
        )}

        {globalError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-300">
            {globalError}
          </div>
        )}

        <form onSubmit={saveQuiz} className="space-y-5">
          {/* Paramètres généraux + bouton Enregistrer le Quiz (en haut à droite) */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 border border-gray-100 dark:border-gray-700 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Paramètres généraux</h2>
              <div className="flex items-center gap-3 ml-auto">
                {notice && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <FaCheckCircle /> {notice}
                  </span>
                )}
                <button
                  type="submit"
                  disabled={saving || validated}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition shadow-sm"
                >
                  {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                  {isEdit ? 'Mettre à jour le Quiz' : 'Enregistrer le Quiz'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Titre du quiz *</label>
                <input
                  type="text"
                  value={settings.title}
                  onChange={(e) => setSetting('title', e.target.value)}
                  placeholder="Ex: Évaluation de fin de sprint 1"
                  className={inputCls}
                />
                {settingsErrors.title && <p className="text-xs text-red-500 mt-1">{settingsErrors.title}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={settings.description}
                  onChange={(e) => setSetting('description', e.target.value)}
                  rows={3}
                  placeholder="Objectif, thèmes abordés..."
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Durée (minutes) *</label>
                <input
                  type="number" min="1" max="360"
                  value={settings.duration_minutes}
                  onChange={(e) => setSetting('duration_minutes', parseInt(e.target.value) || 1)}
                  className={inputCls}
                />
                {settingsErrors.duration_minutes && <p className="text-xs text-red-500 mt-1">{settingsErrors.duration_minutes}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Nombre d&apos;essais maximum *</label>
                <input
                  type="number" min="1" max="100"
                  value={settings.max_attempts}
                  onChange={(e) => setSetting('max_attempts', parseInt(e.target.value) || 1)}
                  className={inputCls}
                />
                {settingsErrors.max_attempts && <p className="text-xs text-red-500 mt-1">{settingsErrors.max_attempts}</p>}
              </div>

              <div className="md:col-span-2 flex flex-wrap items-center gap-x-6 gap-y-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={settings.is_active} onChange={(e) => setSetting('is_active', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  Quiz actif
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={settings.show_results} onChange={(e) => setSetting('show_results', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  Afficher les résultats aux membres
                </label>
                <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/60 px-3 py-1.5 rounded-full">
                  Type détecté : <strong className="text-gray-800 dark:text-gray-200">{quizType}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Constructeur de questions */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <QuizFormBuilder
              questions={questions}
              structureLocked={structureLocked}
              listRef={listRef}
              onAdd={addQuestion}
              onChange={changeQuestion}
              onSave={saveQuestion}
              onDelete={deleteQuestion}
              onMove={moveQuestion}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {dirtyCount > 0
                ? `${dirtyCount} question(s) non enregistrée(s) individuellement — « Enregistrer le Quiz » les enregistre toutes.`
                : 'Toutes les questions sont enregistrées.'}
            </p>
            <Link
              href={route('projects.quizzes.index', project.id)}
              className="text-center px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-xl transition"
            >
              Fermer
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
