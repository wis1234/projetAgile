import React, { useMemo, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Avatar from '@/Components/Quiz/Avatar';
import QuizModal from '@/Components/Quiz/QuizModal';
import { fmtNumber } from '@/Components/Quiz/ScoreBadge';
import { FaArrowLeft, FaStar, FaSearch, FaPlus, FaMinus, FaTrash, FaSpinner, FaHistory, FaInfoCircle, FaTrophy } from 'react-icons/fa';

const REASONS = [
  'Question pertinente',
  'Bonne intervention',
  'Aide apportée aux autres',
  'Exposé / démonstration',
  'Implication remarquée',
];

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '');
const signed = (n) => `${n > 0 ? '+' : ''}${fmtNumber(n)}`;

function Participation({ project, quiz = null, members = [], history = [], cap, stepMax, legacyCount = 0 }) {
  // Mode quiz : les destinataires sont les MEMBRES DU QUIZ (candidats inscrits), pas les membres du projet.
  const storeUrl = quiz ? route('projects.quizzes.participation.store', [project.id, quiz.id]) : route('projects.participation.store', project.id);
  const destroyUrl = (id) => (quiz ? route('projects.quizzes.participation.destroy', [project.id, quiz.id, id]) : route('projects.participation.destroy', [project.id, id]));
  const backHref = quiz ? route('projects.quizzes.show', [project.id, quiz.id]) : route('projects.quizzes.index', project.id);

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('points');
  const [target, setTarget] = useState(null);
  const [form, setForm] = useState({ points: 1, reason: '', awarded_on: new Date().toISOString().slice(0, 10) });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [quickBusy, setQuickBusy] = useState(null);

  const list = useMemo(() => {
    const filtered = members.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));
    return [...filtered].sort((a, b) => (sort === 'points' ? b.total - a.total || a.name.localeCompare(b.name) : a.name.localeCompare(b.name)));
  }, [members, search, sort]);


  const quick = (m, points) => {
    setQuickBusy(`${m.id}:${points}`);
    router.post(
      storeUrl,
      { user_id: m.id, points },
      { preserveScroll: true, onFinish: () => setQuickBusy(null) }
    );
  };

  const openForm = (m) => {
    setTarget(m);
    setForm({ points: 1, reason: '', awarded_on: new Date().toISOString().slice(0, 10) });
    setErrors({});
  };

  const submit = (e) => {
    e.preventDefault();
    setBusy(true);
    router.post(
      storeUrl,
      { user_id: target.id, ...form },
      {
        preserveScroll: true,
        onSuccess: () => setTarget(null),
        onError: (errs) => setErrors(errs),
        onFinish: () => setBusy(false),
      }
    );
  };

  const remove = (entry) => {
    if (window.confirm(`Supprimer l'attribution de ${signed(entry.points)} pt(s) à ${entry.user_name} ?`)) {
      router.delete(destroyUrl(entry.id), { preserveScroll: true });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-blue-600 dark:text-gray-400">
          <FaArrowLeft /> {quiz ? 'Retour au quiz' : 'Retour aux quiz'}
        </Link>

        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 sm:p-6 text-white shadow-md">
          <span className="text-xs uppercase font-bold tracking-wider text-amber-100">{quiz ? `Quiz : ${quiz.title}` : 'Formations · bonus généraux du projet'}</span>
          <h1 className="text-xl sm:text-2xl font-extrabold flex items-center gap-2 mt-1"><FaStar /> Bonus de participation</h1>
          <p className="text-sm text-amber-50 mt-1 max-w-2xl">
            {quiz
              ? "Récompensez les membres du quiz qui s'impliquent lors des échanges. Ces points s'ajoutent à leur note finale dans ce quiz."
              : "Anciens bonus attribués à l'ensemble du projet : ils comptent pour tous les quiz du projet. Pour un nouveau bonus, ouvrez le quiz concerné."}
          </p>
          <p className="mt-3 inline-flex items-start gap-2 text-xs bg-white/15 rounded-xl px-3 py-2">
            <FaInfoCircle className="mt-0.5 flex-shrink-0" />
            Le bonus total d&apos;un {quiz ? 'membre du quiz' : 'membre'} est plafonné à {cap} points ; il est ajouté une seule fois à la note finale (100 % maximum), y compris dans les cumuls de quiz.
          </p>
        </div>

        {quiz?.validated && (
          <p className="text-sm rounded-xl px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
            Les résultats de ce quiz sont validés : rouvrez la délibération pour modifier les bonus.
          </p>
        )}
        {quiz && legacyCount > 0 && (
          <p className="text-xs rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300">
            {legacyCount} ancien(s) bonus général(aux) du projet s&apos;ajoutent aussi aux membres ci-dessous.{' '}
            <Link href={route('projects.participation.index', project.id)} className="font-semibold text-amber-700 dark:text-amber-300 hover:underline">Les consulter</Link>
          </p>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* Membres */}
          <div className="xl:col-span-8 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 sm:p-4 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FaSearch className="text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={quiz ? "Rechercher un membre du quiz..." : "Rechercher un membre..."}
                  className="flex-1 min-w-0 border-0 bg-transparent text-sm focus:ring-0 dark:text-white" />
              </div>
              <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-900/60 rounded-xl text-xs font-semibold">
                {[['points', 'Par points'], ['name', 'Par nom']].map(([k, l]) => (
                  <button key={k} onClick={() => setSort(k)} className={`px-3 py-1.5 rounded-lg ${sort === k ? 'bg-white dark:bg-gray-700 shadow text-amber-700 dark:text-amber-300' : 'text-gray-500'}`}>{l}</button>
                ))}
              </div>
            </div>

            {members.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-10 text-center text-sm text-gray-500">
                {quiz ? (
                  <>
                    Ce quiz n&apos;a encore aucun membre. Ajoutez des membres depuis la page du quiz : ce sont eux qui peuvent recevoir un bonus.{' '}
                    <Link href={backHref} className="font-semibold text-amber-700 dark:text-amber-300 hover:underline">Ouvrir le quiz</Link>
                  </>
                ) : 'Aucun membre à récompenser dans ce projet.'}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {list.map((m, i) => {
                const pct = Math.min(100, (m.effective / cap) * 100);
                return (
                  <div key={m.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar name={m.name} src={m.photo} size="lg" />
                        {sort === 'points' && i < 3 && m.total > 0 && (
                          <span className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-amber-400 text-amber-900 text-[10px] font-black flex items-center justify-center border-2 border-white dark:border-gray-800"><FaTrophy /></span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-gray-900 dark:text-white truncate">{m.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{m.email}</p>
                        {quiz && m.enrolled === false && (
                          <p className="text-[11px] text-gray-400">A passé le quiz sans être inscrit</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-amber-600 dark:text-amber-400 leading-none">{fmtNumber(m.effective)}</div>
                        <div className="text-[10px] uppercase text-gray-400">/ {cap} pts</div>
                      </div>
                    </div>

                    <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    {m.total !== m.effective && (
                      <p className="text-[11px] text-gray-400">Total brut : {fmtNumber(m.total)} pts (plafonné / minimum 0).</p>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      {[1, 2, 5].map((p) => (
                        <button key={p} onClick={() => quick(m, p)} disabled={quickBusy !== null}
                          className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs font-bold transition disabled:opacity-50 inline-flex items-center gap-1">
                          {quickBusy === `${m.id}:${p}` ? <FaSpinner className="animate-spin" /> : <FaPlus className="text-[9px]" />}{p}
                        </button>
                      ))}
                      <button onClick={() => quick(m, -1)} disabled={quickBusy !== null}
                        className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-red-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-red-600 text-xs font-bold transition inline-flex items-center gap-1 disabled:opacity-50">
                        <FaMinus className="text-[9px]" />1
                      </button>
                      <button onClick={() => openForm(m)} className="ml-auto px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition">
                        Attribuer…
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Historique */}
          <aside className="xl:col-span-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden xl:sticky xl:top-4">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
              <FaHistory className="text-amber-500" />
              <h2 className="font-bold text-gray-900 dark:text-white text-sm">Historique des attributions</h2>
            </div>
            <ul className="max-h-[36rem] overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700/60">
              {history.length === 0 && <li className="p-8 text-center text-xs text-gray-400">Aucune attribution pour le moment.</li>}
              {history.map((h) => (
                <li key={h.id} className="p-3 flex items-start gap-3">
                  <Avatar name={h.user_name || '?'} src={h.user_photo} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">
                      <strong>{h.user_name}</strong>{' '}
                      <span className={`font-extrabold ${h.points > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{signed(h.points)} pt</span>
                    </p>
                    {h.reason && <p className="text-xs text-gray-600 dark:text-gray-400">{h.reason}</p>}
                    <p className="text-[11px] text-gray-400">{fmtDate(h.awarded_on)}{h.awarded_by && ` · par ${h.awarded_by}`}</p>
                  </div>
                  <button onClick={() => remove(h)} className="p-1.5 text-gray-300 hover:text-red-500 transition" title="Supprimer"><FaTrash className="text-xs" /></button>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>

      {/* Attribution détaillée */}
      <QuizModal show={!!target} onClose={() => setTarget(null)} closeable={!busy}>
        {target && (
          <form onSubmit={submit}>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Avatar name={target.name} src={target.photo} size="md" />
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Attribuer des points</h3>
                  <p className="text-xs text-gray-500">{target.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Points (± {stepMax})</label>
                  <input type="number" step="0.5" min={-stepMax} max={stepMax} value={form.points}
                    onChange={(e) => setForm({ ...form, points: e.target.value })}
                    className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white text-sm font-bold focus:ring-amber-500 focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Date</label>
                  <input type="date" value={form.awarded_on} onChange={(e) => setForm({ ...form, awarded_on: e.target.value })}
                    className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white text-sm focus:ring-amber-500 focus:border-amber-500" />
                </div>
              </div>
              {(errors.points || errors.awarded_on || errors.user_id) && <p className="text-xs text-red-500">{errors.points || errors.awarded_on || errors.user_id}</p>}

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Motif</label>
                <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} maxLength={255} placeholder="Pourquoi ces points ?"
                  className="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white text-sm focus:ring-amber-500 focus:border-amber-500" />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {REASONS.map((r) => (
                    <button key={r} type="button" onClick={() => setForm({ ...form, reason: r })}
                      className="px-2.5 py-1 rounded-full bg-gray-100 hover:bg-amber-100 dark:bg-gray-700 dark:hover:bg-amber-900/40 text-[11px] font-medium text-gray-600 dark:text-gray-300 transition">{r}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/40 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button type="button" onClick={() => setTarget(null)} disabled={busy} className="px-5 py-2.5 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-200">Annuler</button>
              <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-bold">
                {busy ? <FaSpinner className="animate-spin" /> : <FaStar />} Enregistrer
              </button>
            </div>
          </form>
        )}
      </QuizModal>
    </div>
  );
}

Participation.layout = (page) => <AdminLayout>{page}</AdminLayout>;
export default Participation;
