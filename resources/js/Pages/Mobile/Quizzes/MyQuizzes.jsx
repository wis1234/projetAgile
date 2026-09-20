import React, { useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { FaClock, FaQuestionCircle, FaRedo, FaPlay, FaCheckCircle, FaLock, FaPen, FaUserCheck, FaHourglassHalf, FaEnvelopeOpenText } from 'react-icons/fa';
import MobileLayout from '@/Layouts/MobileLayout';
import ScoreBadge from '@/Components/Quiz/ScoreBadge';
import { MHero, MCard, MPill, MEmpty, MSegmented, MSearch, MButton } from '@/Components/Mobile/kit';

const STATUS = {
  to_take: { label: 'À passer', tone: 'blue', cta: 'Commencer', icon: <FaPlay /> },
  in_progress: { label: 'En cours', tone: 'green', cta: 'Reprendre', icon: <FaPlay /> },
  retake: { label: 'Repassable', tone: 'purple', cta: 'Ouvrir', icon: <FaRedo /> },
  completed: { label: 'Terminé', tone: 'slate', cta: 'Ouvrir', icon: <FaCheckCircle /> },
  closed: { label: 'Clôturé', tone: 'slate', cta: 'Ouvrir', icon: <FaLock /> },
  inactive: { label: 'Indisponible', tone: 'slate', cta: 'Ouvrir', icon: <FaLock /> },
  draft: { label: 'Brouillon', tone: 'amber', cta: 'Continuer', icon: <FaPen /> },
};

const FILTERS = [
  { key: 'all', label: 'Tous', test: () => true },
  { key: 'todo', label: 'À passer', test: (q) => ['to_take', 'in_progress', 'retake'].includes(q.status) },
  { key: 'done', label: 'Terminés', test: (q) => ['completed', 'closed'].includes(q.status) || q.attempts_done > 0 },
  { key: 'manage', label: 'Que je gère', test: (q) => q.can_manage },
];

export default function MobileMyQuizzes({ quizzes = [], candidateOnly = false }) {
  const { auth } = usePage().props;
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filters = FILTERS.filter((f) => f.key !== 'manage' || quizzes.some((q) => q.can_manage));
  const active = filters.find((f) => f.key === filter) || filters[0];
  const toTake = quizzes.filter((q) => ['to_take', 'in_progress'].includes(q.status)).length;

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return quizzes.filter((q) => active.test(q) && (!needle || `${q.title} ${q.project?.name || ''}`.toLowerCase().includes(needle)));
  }, [quizzes, active, search]);

  return (
    <MobileLayout title={candidateOnly ? 'Mes quiz' : 'Quiz'}>
      <Head title="Quiz" />
      <div className="space-y-4 py-4">
        <MHero
          eyebrow={candidateOnly ? 'Espace candidat' : 'Évaluations'}
          title={candidateOnly ? `Bonjour ${auth?.user?.name?.split(' ')[0] || ''} 👋` : 'Vos quiz'}
          subtitle={candidateOnly ? 'Passez vos évaluations et consultez vos résultats.' : 'Tous projets confondus : à passer, résultats, et ceux que vous gérez.'}
        >
          {toTake > 0 && (
            <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold">
              <FaEnvelopeOpenText /> {toTake} quiz {toTake > 1 ? 'vous attendent' : 'vous attend'}
            </span>
          )}
        </MHero>

        {quizzes.length > 0 && (
          <>
            <MSearch value={search} onChange={setSearch} placeholder="Rechercher un quiz ou un projet" />
            {filters.length > 1 && (
              <MSegmented
                value={active.key}
                onChange={setFilter}
                options={filters.map((f) => ({ value: f.key, label: f.label, count: quizzes.filter(f.test).length }))}
              />
            )}
          </>
        )}

        {quizzes.length === 0 ? (
          <MEmpty
            icon={FaQuestionCircle}
            title="Aucun quiz pour le moment"
            text={candidateOnly
              ? `Vous serez notifié dès qu'un responsable vous ajoutera à un quiz. Communiquez-lui l'adresse ${auth?.user?.email ?? 'de votre compte'}.`
              : 'Les quiz de vos projets apparaîtront ici.'}
          />
        ) : visible.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">Aucun quiz ne correspond à votre recherche.</p>
        ) : (
          <div className="space-y-3">
            {visible.map((q) => {
              const st = STATUS[q.status] || STATUS.to_take;
              const showHref = route('projects.quizzes.show', [q.project.id, q.id]);
              const canSeeResults = q.attempts_done > 0 && q.show_results;
              return (
                <MCard key={q.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-extrabold leading-snug text-slate-900 dark:text-white">{q.title}</h3>
                      <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{q.project.name}</p>
                    </div>
                    <MPill tone={st.tone} className="flex-shrink-0">{st.label}</MPill>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {q.invited && <MPill tone="purple"><FaUserCheck /> Inscrit</MPill>}
                    {q.validated && <MPill tone="green"><FaLock /> Résultats validés</MPill>}
                    {q.can_manage && q.pending_copies > 0 && <MPill tone="amber"><FaHourglassHalf /> {q.pending_copies} à corriger</MPill>}
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2.5 text-center text-[11px] font-semibold text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                    <div><FaClock className="mx-auto mb-1 text-blue-500" />{q.duration_minutes} min</div>
                    <div><FaQuestionCircle className="mx-auto mb-1 text-purple-500" />{q.questions_count} quest.</div>
                    <div><FaRedo className="mx-auto mb-1 text-emerald-500" />{q.attempts_done}/{q.max_attempts}</div>
                  </div>

                  {q.attempts_done > 0 && q.show_results && (
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Mon résultat</span>
                      <ScoreBadge score={q.score} pending={q.score_pending} />
                    </div>
                  )}

                  <div className="mt-3 flex gap-2">
                    <MButton href={showHref} className="flex-1">{st.icon} {st.cta}</MButton>
                    {canSeeResults && (
                      <MButton href={route('projects.quizzes.results', [q.project.id, q.id])} tone="soft"><FaCheckCircle /> Résultats</MButton>
                    )}
                  </div>
                </MCard>
              );
            })}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
