import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Avatar from '@/Components/Quiz/Avatar';
import QuizModal from '@/Components/Quiz/QuizModal';
import ScoreBadge, { fmtNumber } from '@/Components/Quiz/ScoreBadge';
import {
  FaArrowLeft, FaGavel, FaCheck, FaClock, FaLock, FaShieldAlt, FaFileExcel, FaFilePdf, FaSpinner, FaKey,
  FaEye, FaEyeSlash, FaPenFancy, FaUndo, FaExclamationTriangle, FaStar, FaTrophy,
} from 'react-icons/fa';

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' }) : null;

const STATUS = {
  none: { label: 'Non ouverte', cls: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  open: { label: 'En cours', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
  validated: { label: 'Résultats validés', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
};

function Deliberation({ project, quiz, deliberation: d, rankings = [], stats = {}, passMark, canReopen }) {
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const status = STATUS[d.status] || STATUS.none;
  const percent = d.deciders_count > 0 ? Math.round((d.approved_count / d.deciders_count) * 100) : 0;
  const staleCount = d.deciders.filter((p) => p.stale).length;

  const openDeliberation = () =>
    router.post(route('projects.quizzes.deliberation.open', [project.id, quiz.id]), {}, { preserveScroll: true, onStart: () => setBusy(true), onFinish: () => setBusy(false) });

  const closeModal = () => {
    setShowModal(false);
    setPassword('');
    setError(null);
    setReveal(false);
  };

  const submitApproval = (e) => {
    e.preventDefault();
    if (!password) {
      setError('Saisissez votre mot de passe pour donner votre aval.');
      return;
    }
    router.post(
      route('projects.quizzes.deliberation.approve', [project.id, quiz.id]),
      { password },
      {
        preserveScroll: true,
        onStart: () => { setBusy(true); setError(null); },
        onSuccess: closeModal,
        onError: (errs) => { setError(errs.password || Object.values(errs)[0] || 'Impossible d\'enregistrer votre aval.'); setPassword(''); },
        onFinish: () => setBusy(false),
      }
    );
  };

  const reopen = () => {
    if (window.confirm('Rouvrir la délibération ? Tous les avals déjà donnés seront annulés et la correction redeviendra possible.')) {
      router.post(route('projects.quizzes.deliberation.reopen', [project.id, quiz.id]), {}, { preserveScroll: true });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-6 sm:py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        <Link
          href={route('projects.quizzes.show', [project.id, quiz.id])}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-blue-600 dark:text-gray-400"
        >
          <FaArrowLeft /> Retour aux détails du quiz
        </Link>

        {/* En-tête */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-5 sm:p-6 text-white shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-xs uppercase font-bold tracking-wider text-indigo-200">Délibération</span>
              <h1 className="text-xl sm:text-2xl font-extrabold flex items-center gap-2 mt-1">
                <FaGavel className="text-amber-300 flex-shrink-0" /> <span className="truncate">{quiz.title}</span>
              </h1>
            </div>
            <span className={`self-start sm:self-auto px-3 py-1.5 rounded-full text-xs font-extrabold ${status.cls}`}>{status.label}</span>
          </div>
        </div>

        {/* Étape 0 : pas encore ouverte */}
        {d.status === 'none' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 text-center space-y-4 shadow-sm">
            {d.can_open ? (
              <>
                <div className="w-14 h-14 mx-auto rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center text-2xl"><FaGavel /></div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Toutes les copies sont corrigées</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
                  En ouvrant la délibération, chaque responsable du projet devra confirmer les résultats avec son mot de passe ProJA.
                  Quand tous auront donné leur aval, les résultats deviendront officiels et la correction sera verrouillée.
                </p>
                <button
                  onClick={openDeliberation}
                  disabled={busy}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold transition"
                >
                  {busy ? <FaSpinner className="animate-spin" /> : <FaGavel />} Ouvrir la délibération
                </button>
              </>
            ) : (
              <>
                <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center text-2xl"><FaClock /></div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Délibération impossible pour le moment</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {d.results_count === 0
                    ? 'Aucun candidat n\'a encore composé ce quiz.'
                    : `${d.pending_copies} copie(s) restent à corriger avant de pouvoir délibérer.`}
                </p>
                {d.pending_copies > 0 && (
                  <Link href={route('projects.quizzes.grading', [project.id, quiz.id])} className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold">
                    <FaPenFancy /> Aller à l&apos;espace de correction
                  </Link>
                )}
              </>
            )}
          </div>
        )}

        {/* Avals des responsables */}
        {d.status !== 'none' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Avals des responsables</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {d.status === 'validated'
                    ? `Validé le ${fmtDate(d.validated_at)}`
                    : `${d.approved_count} sur ${d.deciders_count} responsable(s) ont donné leur aval`}
                </p>
              </div>
              <div className="w-full sm:w-56">
                <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500" style={{ width: `${percent}%` }} />
                </div>
              </div>
            </div>

            {staleCount > 0 && d.status !== 'validated' && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
                <FaExclamationTriangle className="mt-0.5 flex-shrink-0" />
                Des notes ont changé depuis l&apos;aval de {staleCount} responsable(s) : leur aval doit être renouvelé sur les résultats actuels.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {d.deciders.map((p) => (
                <div
                  key={p.id}
                  className={`rounded-2xl border p-4 flex items-center gap-3 transition ${
                    p.approved
                      ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/60 dark:bg-emerald-950/20'
                      : p.stale
                      ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="relative">
                    <Avatar name={p.name} src={p.photo} size="lg" ring={p.approved ? 'ring-4 ring-emerald-400' : ''} />
                    {p.approved && (
                      <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center border-2 border-white dark:border-gray-800"><FaCheck /></span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{p.name}</p>
                    {p.approved ? (
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">Aval donné · {fmtDate(p.approved_at)}</p>
                    ) : p.stale ? (
                      <p className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold">Aval à renouveler</p>
                    ) : (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 inline-flex items-center gap-1"><FaClock /> En attente</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {d.status === 'open' && (
              <div className="pt-1">
                {d.can_approve ? (
                  <button
                    onClick={() => setShowModal(true)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition shadow-sm"
                  >
                    <FaShieldAlt /> Donner mon aval
                  </button>
                ) : d.viewer_approved ? (
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2"><FaCheck /> Vous avez donné votre aval. En attente des autres responsables.</p>
                ) : !d.is_decider ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Vous pouvez consulter la délibération, mais seuls les responsables du projet donnent leur aval.</p>
                ) : null}
              </div>
            )}

            {d.status === 'validated' && (
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-1">
                <a href={route('projects.quizzes.export', [project.id, quiz.id, 'xlsx'])} className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition">
                  <FaFileExcel /> Exporter en Excel
                </a>
                <a href={route('projects.quizzes.export', [project.id, quiz.id, 'pdf'])} className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition">
                  <FaFilePdf /> Exporter en PDF
                </a>
              </div>
            )}

            {canReopen && (d.status === 'validated' || d.status === 'open') && (
              <button onClick={reopen} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-red-600 dark:text-gray-400 transition">
                <FaUndo /> {d.status === 'validated' ? 'Rouvrir la délibération (annule les avals)' : 'Réinitialiser les avals'}
              </button>
            )}
          </div>
        )}

        {/* Résultats soumis à délibération */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2"><FaTrophy className="text-amber-500" /> Résultats soumis à délibération</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Seuil d&apos;admission : {passMark}% · note finale = note du quiz + bonus de participation (plafonné).</p>
            </div>
            <div className="flex gap-4 text-center">
              <div><div className="text-lg font-black text-blue-600 dark:text-blue-400">{stats.average != null ? `${fmtNumber(stats.average)}%` : '—'}</div><div className="text-[10px] uppercase text-gray-500">Moyenne</div></div>
              <div><div className="text-lg font-black text-emerald-600 dark:text-emerald-400">{stats.pass_rate != null ? `${fmtNumber(stats.pass_rate, 1)}%` : '—'}</div><div className="text-[10px] uppercase text-gray-500">Réussite</div></div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/40 text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-2.5 text-center w-14">Rang</th>
                  <th className="px-4 py-2.5 text-left">Candidat</th>
                  <th className="px-4 py-2.5 text-center">Note quiz</th>
                  <th className="px-4 py-2.5 text-center">Bonus</th>
                  <th className="px-4 py-2.5 text-center">Note finale</th>
                  <th className="px-4 py-2.5 text-center">Décision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {rankings.map((r) => (
                  <tr key={r.key} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-2.5 text-center font-bold text-gray-500">{r.rank ?? '—'}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5 min-w-[10rem]">
                        <Avatar name={r.name} src={r.photo} size="sm" />
                        <span className="font-semibold text-gray-900 dark:text-white">{r.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center"><ScoreBadge score={r.score} pending={r.is_pending} size="sm" /></td>
                    <td className="px-4 py-2.5 text-center text-amber-600 dark:text-amber-400 font-semibold">
                      {r.bonus > 0 ? <span className="inline-flex items-center gap-1"><FaStar className="text-xs" />+{fmtNumber(r.bonus)}</span> : <span className="text-gray-300">0</span>}
                    </td>
                    <td className="px-4 py-2.5 text-center"><ScoreBadge score={r.final} pending={r.is_pending} size="md" /></td>
                    <td className="px-4 py-2.5 text-center">
                      {r.is_pending ? (
                        <span className="text-xs font-bold text-amber-600">En attente</span>
                      ) : r.passed ? (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Admis(e)</span>
                      ) : (
                        <span className="text-xs font-bold text-red-600 dark:text-red-400">Ajourné(e)</span>
                      )}
                    </td>
                  </tr>
                ))}
                {rankings.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Aucun résultat.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pop-up : mot de passe ProJA pour donner son aval */}
      <QuizModal show={showModal} onClose={closeModal} size="md" closeable={!busy}>
        <form onSubmit={submitApproval}>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 flex items-center justify-center text-lg"><FaShieldAlt /></span>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Donner mon aval</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Signature numérique de la délibération</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300">
              En saisissant votre mot de passe ProJA, vous certifiez avoir pris connaissance des résultats de « {quiz.title} » et les approuvez.
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Mot de passe ProJA</label>
              <div className="relative">
                <FaKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type={reveal ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  autoFocus
                  autoComplete="current-password"
                  className={`w-full pl-9 pr-10 rounded-xl dark:bg-gray-900 dark:text-white text-sm focus:ring-emerald-500 ${
                    error ? 'border-red-400 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-emerald-500'
                  }`}
                />
                <button type="button" onClick={() => setReveal((r) => !r)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                  {reveal ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/40 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button type="button" onClick={closeModal} disabled={busy} className="px-5 py-2.5 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-200">
              Annuler
            </button>
            <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold">
              {busy ? <FaSpinner className="animate-spin" /> : <FaCheck />} Confirmer mon aval
            </button>
          </div>
        </form>
      </QuizModal>
    </div>
  );
}

Deliberation.layout = (page) => <AdminLayout>{page}</AdminLayout>;
export default Deliberation;
