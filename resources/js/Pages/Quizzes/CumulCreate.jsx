import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Avatar from '@/Components/Quiz/Avatar';
import ScoreBadge, { fmtNumber } from '@/Components/Quiz/ScoreBadge';
import {
  FaArrowLeft, FaLayerGroup, FaCheck, FaClock, FaSpinner, FaShieldAlt, FaUsers, FaQuestionCircle, FaStar,
  FaExclamationTriangle, FaCalculator,
} from 'react-icons/fa';

const TYPE_LABEL = { qcm: 'QCM', written: 'Écrit', mixed: 'Mixte' };
// Le coefficient est saisi librement en texte (virgule ou point) et n'est interprété qu'ensuite.
// <input type="number" min="0.01" step="0.5"> n'acceptait que 0,01 + 0,5 × n (1,01 · 1,51 · 2,01 · 3,01…) :
// le navigateur bloquait « 2 » et les flèches proposaient 2,01.
const parseCoef = (text) => {
  const n = Number(String(text).trim().replace(',', '.'));
  return Number.isFinite(n) && n > 0 && n <= 100 ? n : null;
};
const COEF_INPUT = /^\d{0,3}([.,]\d{0,2})?$/; // jusqu'à 2 décimales
const COEF_PRESETS = [1, 2, 3, 4, 5];

const TYPE_TONE = { qcm: 'bg-blue-100 text-blue-700', written: 'bg-purple-100 text-purple-700', mixed: 'bg-amber-100 text-amber-700' };

function CumulCreate({ project, quizzes = [], cap }) {
  const [selected, setSelected] = useState({}); // quizId -> coefficient
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [missingPolicy, setMissingPolicy] = useState('zero');
  const [includeBonus, setIncludeBonus] = useState(true);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const reqId = useRef(0);

  const items = useMemo(
    () => Object.entries(selected).map(([id, coef]) => ({ quiz_id: Number(id), coefficient: parseCoef(coef) })),
    [selected]
  );
  const invalidCoef = items.some((i) => i.coefficient === null);

  const toggle = (q) => {
    if (!q.selectable) return;
    setSelected((s) => {
      const next = { ...s };
      if (next[q.id] !== undefined) delete next[q.id];
      else next[q.id] = 1;
      return next;
    });
    setErrors((e) => ({ ...e, items: undefined }));
  };

  const selectAll = () => {
    const all = {};
    quizzes.filter((q) => q.selectable).forEach((q) => { all[q.id] = selected[q.id] ?? 1; });
    setSelected(all);
  };

  // Aperçu du calcul : recalculé automatiquement (léger délai pour éviter les appels en rafale)
  useEffect(() => {
    if (items.length < 2 || invalidCoef) {
      setPreview(null);
      return undefined;
    }
    const id = ++reqId.current;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const { data } = await axios.post(route('projects.quiz-cumuls.preview', project.id), {
          items,
          missing_policy: missingPolicy,
          include_bonus: includeBonus,
        });
        if (id === reqId.current) setPreview(data);
      } catch {
        if (id === reqId.current) setPreview(null);
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [items, invalidCoef, missingPolicy, includeBonus, project.id]);

  const submit = (e) => {
    e.preventDefault();
    if (invalidCoef) {
      setErrors((prev) => ({ ...prev, items: 'Un coefficient est invalide : saisissez un nombre entre 0,01 et 100 (ex. 2 ou 2,5).' }));
      return;
    }
    setSaving(true);
    router.post(
      route('projects.quiz-cumuls.store', project.id),
      { title, description, items, missing_policy: missingPolicy, include_bonus: includeBonus },
      {
        onError: (errs) => setErrors(errs),
        onFinish: () => setSaving(false),
      }
    );
  };

  const selectedCount = items.length;
  const canSubmit = selectedCount >= 2 && title.trim().length > 0 && !invalidCoef && !saving;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
          <Link href={route('projects.quizzes.index', project.id)} className="text-xs font-semibold text-gray-500 hover:text-blue-600 dark:text-gray-400 inline-flex items-center gap-1 mb-1">
            <FaArrowLeft /> Retour aux quiz
          </Link>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <FaLayerGroup className="text-indigo-600" /> Cumuler plusieurs quiz
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Sélectionnez les quiz à regrouper : le système calcule la moyenne de chaque candidat sur les quiz choisis.
          </p>
        </div>

        <form onSubmit={submit} className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* ── Sélection ── */}
          <div className="xl:col-span-7 space-y-5">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">1. Choisir les quiz</h2>
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-300">{selectedCount} sélectionné(s)</span>
                  <button type="button" onClick={selectAll} className="font-semibold text-gray-500 hover:text-indigo-600 underline">Tout sélectionner</button>
                  <button type="button" onClick={() => setSelected({})} className="font-semibold text-gray-500 hover:text-red-600 underline">Effacer</button>
                </div>
              </div>

              {quizzes.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">Aucun quiz disponible dans ce projet.</p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quizzes.map((q) => {
                  const isOn = selected[q.id] !== undefined;
                  return (
                    <div
                      key={q.id}
                      role="button"
                      tabIndex={q.selectable ? 0 : -1}
                      onClick={() => toggle(q)}
                      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggle(q))}
                      className={`relative rounded-2xl border-2 p-4 transition select-none ${
                        !q.selectable
                          ? 'opacity-60 cursor-not-allowed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40'
                          : isOn
                          ? 'cursor-pointer border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30 shadow-sm'
                          : 'cursor-pointer border-gray-200 dark:border-gray-700 hover:border-indigo-300 bg-white dark:bg-gray-800'
                      }`}
                    >
                      <span className={`absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs ${
                        isOn ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 dark:border-gray-600 text-transparent'
                      }`}><FaCheck /></span>

                      <div className="flex flex-wrap items-center gap-1.5 mb-2 pr-8">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${TYPE_TONE[q.quiz_type] || TYPE_TONE.qcm}`}>{TYPE_LABEL[q.quiz_type] || 'QCM'}</span>
                        {q.validated && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 inline-flex items-center gap-1"><FaShieldAlt /> Validé</span>}
                      </div>
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-2 pr-6">{q.title}</h3>
                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center gap-1"><FaQuestionCircle /> {q.questions_count}</span>
                        <span className="inline-flex items-center gap-1"><FaUsers /> {q.participants_count}</span>
                      </div>

                      {!q.selectable && (
                        <p className="mt-2 text-[11px] font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                          <FaClock /> {q.pending_count > 0 ? `${q.pending_count} copie(s) à corriger` : 'Aucun résultat pour l\'instant'}
                        </p>
                      )}

                      {isOn && (
                        <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <label className="text-[11px] font-bold uppercase text-indigo-700 dark:text-indigo-300">Coef.</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            autoComplete="off"
                            placeholder="1"
                            value={String(selected[q.id])}
                            onChange={(e) => {
                              const text = e.target.value;
                              if (COEF_INPUT.test(text)) setSelected((s) => ({ ...s, [q.id]: text }));
                            }}
                            onFocus={(e) => e.target.select()}
                            aria-invalid={parseCoef(selected[q.id]) === null}
                            className={`w-20 rounded-lg dark:bg-gray-900 dark:text-white text-sm text-center font-bold py-1 focus:ring-indigo-500 focus:border-indigo-500 ${
                              parseCoef(selected[q.id]) === null ? 'border-red-400' : 'border-indigo-200 dark:border-indigo-800'
                            }`}
                          />
                          <div className="flex gap-1">
                            {COEF_PRESETS.map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setSelected((s) => ({ ...s, [q.id]: String(c) }))}
                                className={`w-6 h-6 rounded-md text-[11px] font-bold transition ${
                                  parseCoef(selected[q.id]) === c
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-indigo-400'
                                }`}
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {errors.items && <p className="text-xs text-red-500">{errors.items}</p>}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">2. Paramètres du cumul</h2>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Nom du quiz cumulé *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex : Sélection finale – Phase 1"
                  className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white text-sm focus:border-indigo-500 focus:ring-indigo-500" />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                  className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white text-sm focus:border-indigo-500 focus:ring-indigo-500" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Candidat absent à un quiz</span>
                  <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-900/60 rounded-xl text-xs font-semibold">
                    {[['zero', 'Compter 0'], ['ignore', 'Ignorer']].map(([v, l]) => (
                      <button type="button" key={v} onClick={() => setMissingPolicy(v)}
                        className={`flex-1 py-2 rounded-lg transition ${missingPolicy === v ? 'bg-white dark:bg-gray-700 shadow text-indigo-700 dark:text-indigo-300' : 'text-gray-500'}`}>{l}</button>
                    ))}
                  </div>
                </div>
                <label className="flex items-start gap-3 p-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/20 cursor-pointer">
                  <input type="checkbox" checked={includeBonus} onChange={(e) => setIncludeBonus(e.target.checked)} className="mt-0.5 rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                  <span className="text-xs text-amber-900 dark:text-amber-200">
                    <strong className="flex items-center gap-1"><FaStar /> Ajouter le bonus de participation</strong>
                    Plafonné à {cap} points, ajouté une seule fois à la moyenne.
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* ── Aperçu + validation ── */}
          <div className="xl:col-span-5 space-y-5 xl:sticky xl:top-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2"><FaCalculator className="text-indigo-500" /> Aperçu du calcul</h2>
                {loading && <FaSpinner className="animate-spin text-indigo-500" />}
              </div>

              {selectedCount < 2 ? (
                <p className="p-8 text-center text-sm text-gray-400">Sélectionnez au moins deux quiz pour voir l&apos;aperçu.</p>
              ) : !preview ? (
                <p className="p-8 text-center text-sm text-gray-400">{loading ? 'Calcul en cours…' : 'Aperçu indisponible.'}</p>
              ) : (
                <>
                  {Object.keys(preview.blocking || {}).length > 0 && (
                    <div className="m-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex gap-2">
                      <FaExclamationTriangle className="mt-0.5 flex-shrink-0" /> Des copies restent à corriger : le cumul ne peut pas être validé.
                    </div>
                  )}
                  <div className="grid grid-cols-3 text-center py-3 border-b border-gray-100 dark:border-gray-700">
                    <div><div className="text-lg font-black text-gray-900 dark:text-white">{preview.stats.total}</div><div className="text-[10px] uppercase text-gray-500">Candidats</div></div>
                    <div><div className="text-lg font-black text-indigo-600">{preview.stats.average != null ? `${fmtNumber(preview.stats.average)}%` : '—'}</div><div className="text-[10px] uppercase text-gray-500">Moyenne</div></div>
                    <div><div className="text-lg font-black text-emerald-600">{preview.stats.pass_rate != null ? `${fmtNumber(preview.stats.pass_rate, 0)}%` : '—'}</div><div className="text-[10px] uppercase text-gray-500">Réussite</div></div>
                  </div>
                  <ul className="max-h-[26rem] overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700/60">
                    {preview.rows.map((r) => (
                      <li key={r.key} className="px-4 py-2.5 flex items-center gap-3">
                        <span className="w-6 text-center text-xs font-bold text-gray-400">{r.rank ?? '—'}</span>
                        <Avatar name={r.name} src={r.photo} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{r.name}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate" title={r.calculation}>{r.calculation}</p>
                        </div>
                        <ScoreBadge score={r.final} pending={r.is_pending} size="md" />
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <button
              type="submit"
              disabled={!canSubmit || (preview && Object.keys(preview.blocking || {}).length > 0)}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition shadow-sm"
            >
              {saving ? <FaSpinner className="animate-spin" /> : <FaCheck />} Valider et créer le quiz cumulé
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

CumulCreate.layout = (page) => <AdminLayout>{page}</AdminLayout>;
export default CumulCreate;
