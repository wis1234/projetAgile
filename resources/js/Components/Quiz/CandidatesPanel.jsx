import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { router } from '@inertiajs/react';
import {
  FaCheckCircle,
  FaClock,
  FaHourglassHalf,
  FaLock,
  FaSearch,
  FaSpinner,
  FaTimes,
  FaTrash,
  FaUserPlus,
  FaUsers,
} from 'react-icons/fa';
import Avatar from '@/Components/Quiz/Avatar';
import ScoreBadge from '@/Components/Quiz/ScoreBadge';

const STATUS = {
  not_started: { label: 'Pas commencé', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
  in_progress: { label: 'En cours', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
  pending: { label: 'En attente de correction', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  completed: { label: 'Terminé', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
};

/**
 * Candidats d'un quiz : ajout d'utilisateurs ProJA déjà inscrits, suivi de leur avancement,
 * et option « réservé aux candidats ajoutés ».
 */
export default function CandidatesPanel({ project, quiz, candidates = [] }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState([]); // utilisateurs choisis, pas encore ajoutés
  const [busy, setBusy] = useState(false);
  const requestId = useRef(0);

  const routeArgs = [project.id, quiz.id];
  const alreadyPicked = new Set(selected.map((u) => u.id));

  // Recherche dans les utilisateurs inscrits (nom ou e-mail), avec un léger délai.
  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setSearching(false);
      return undefined;
    }
    const current = ++requestId.current;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await axios.get(route('projects.quizzes.candidates.search', routeArgs), { params: { q: term } });
        if (current === requestId.current) setResults(data.users);
      } catch {
        if (current === requestId.current) setResults([]);
      } finally {
        if (current === requestId.current) setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, candidates.length]);

  const pick = (user) => {
    if (!alreadyPicked.has(user.id)) setSelected((list) => [...list, user]);
    setQuery('');
    setResults([]);
  };

  const submit = () => {
    if (!selected.length) return;
    router.post(
      route('projects.quizzes.candidates.store', routeArgs),
      { user_ids: selected.map((u) => u.id) },
      {
        preserveScroll: true,
        onStart: () => setBusy(true),
        onSuccess: () => setSelected([]),
        onFinish: () => setBusy(false),
      }
    );
  };

  const addAllMembers = () => {
    if (!confirm('Ajouter tous les membres du projet (hors responsables) comme membres de ce quiz ?')) return;
    router.post(route('projects.quizzes.candidates.members', routeArgs), {}, { preserveScroll: true, onStart: () => setBusy(true), onFinish: () => setBusy(false) });
  };

  const remove = (candidate) => {
    if (!confirm(`Retirer ${candidate.name} des membres de ce quiz ?`)) return;
    router.delete(route('projects.quizzes.candidates.destroy', [...routeArgs, candidate.id]), { preserveScroll: true });
  };

  const toggleRestriction = () =>
    router.put(route('projects.quizzes.candidates.restriction', routeArgs), { restricted: !quiz.restricted_to_candidates }, { preserveScroll: true });

  const done = candidates.filter((c) => ['completed', 'pending'].includes(c.status)).length;

  return (
    <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 sm:p-6 space-y-5" aria-labelledby="candidates-title">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 id="candidates-title" className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FaUsers className="text-purple-600" /> Membres du quiz
            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 text-xs font-bold">{candidates.length}</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Ajoutez des utilisateurs déjà inscrits sur ProJA : ils deviennent membres de ce quiz et le voient dans leur menu « Quiz », sans faire partie du projet. Seuls les membres du quiz peuvent recevoir un bonus de participation.
            {candidates.length > 0 && ` ${done} / ${candidates.length} ont terminé.`}
          </p>
        </div>
        <button
          type="button"
          onClick={addAllMembers}
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition disabled:opacity-50"
        >
          <FaUserPlus /> Ajouter les membres du projet au quiz
        </button>
      </div>

      {/* Recherche / ajout */}
      <div className="space-y-3">
        <div className="relative">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un utilisateur par nom ou e-mail (2 lettres minimum)…"
            className="w-full pl-10 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white text-sm focus:border-purple-500 focus:ring-purple-500"
            aria-label="Rechercher un utilisateur à ajouter"
          />
          {searching && <FaSpinner className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />}

          {query.trim().length >= 2 && !searching && (
            <ul className="absolute z-20 mt-1.5 w-full max-h-72 overflow-y-auto rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg divide-y divide-gray-100 dark:divide-gray-700">
              {results.length === 0 && <li className="px-4 py-3 text-sm text-gray-500">Aucun utilisateur trouvé (ou déjà membre du quiz).</li>}
              {results.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => pick(u)}
                    disabled={alreadyPicked.has(u.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-purple-50 dark:hover:bg-purple-950/30 disabled:opacity-40 transition"
                  >
                    <Avatar name={u.name} src={u.photo} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-gray-900 dark:text-white truncate">{u.name}</span>
                      <span className="block text-xs text-gray-500 truncate">{u.email}</span>
                    </span>
                    <span className={`flex-shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${u.is_member ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {u.is_member ? 'Membre' : 'Hors projet'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40">
            {selected.map((u) => (
              <span key={u.id} className="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-full bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-800 text-sm">
                <Avatar name={u.name} src={u.photo} size="xs" />
                {u.name}
                <button type="button" onClick={() => setSelected((l) => l.filter((x) => x.id !== u.id))} className="text-gray-400 hover:text-red-500" aria-label={`Retirer ${u.name} de la sélection`}>
                  <FaTimes className="text-xs" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition disabled:opacity-50"
            >
              {busy ? <FaSpinner className="animate-spin" /> : <FaUserPlus />} Ajouter {selected.length} membre(s)
            </button>
          </div>
        )}
      </div>

      {/* Quiz réservé */}
      <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
        <input
          type="checkbox"
          checked={Boolean(quiz.restricted_to_candidates)}
          onChange={toggleRestriction}
          className="mt-0.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
        />
        <span>
          <span className="block text-sm font-semibold text-gray-900 dark:text-white">Réservé aux membres du quiz</span>
          <span className="block text-xs text-gray-500 dark:text-gray-400">
            Les autres membres du projet ne voient plus ce quiz. Les responsables y ont toujours accès.
          </span>
        </span>
      </label>

      {/* Liste */}
      {candidates.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">Aucun membre ajouté pour l'instant.</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-700 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          {candidates.map((c) => {
            const st = STATUS[c.status] || STATUS.not_started;
            return (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800">
                <Avatar name={c.name} src={c.photo} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{c.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {c.status === 'completed' && c.score !== null && <ScoreBadge score={c.score} size="sm" />}
                  <span className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}>
                    {c.status === 'completed' && <FaCheckCircle />}
                    {c.status === 'in_progress' && <FaClock />}
                    {c.status === 'pending' && <FaHourglassHalf />}
                    {st.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(c)}
                    disabled={c.locked}
                    title={c.locked ? 'A déjà commencé le quiz : ne peut plus être retiré' : 'Retirer ce candidat'}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:bg-transparent transition"
                    aria-label={`Retirer ${c.name}`}
                  >
                    {c.locked ? <FaLock /> : <FaTrash />}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
