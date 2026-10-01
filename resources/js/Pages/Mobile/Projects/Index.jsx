import React, { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { FaPlus, FaTasks, FaUsers, FaFolderOpen, FaChevronRight } from 'react-icons/fa';
import MobileLayout from '@/Layouts/MobileLayout';
import { MHero, MCard, MPill, MStat, MSearch, MSegmented, MEmpty, MFab, MPager } from '@/Components/Mobile/kit';

const STATUS = { nouveau: ['Nouveau', 'slate'], demarrage: ['Démarrage', 'green'], en_cours: ['En cours', 'blue'], termine: ['Terminé', 'green'], suspendu: ['Suspendu', 'red'] };
const GRAD = ['from-blue-500 to-indigo-600', 'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-600', 'from-pink-500 to-rose-600', 'from-violet-500 to-purple-600', 'from-cyan-500 to-sky-600'];

export default function MobileProjectsIndex({ projects: prop = { data: [] }, filters = {}, globalStats = {} }) {
  const projects = Array.isArray(prop) ? prop : prop.data || [];
  const [search, setSearch] = useState(filters.search || '');
  const [status, setStatus] = useState('all');

  const submit = (v) => { setSearch(v); };
  const runSearch = (e) => { e.preventDefault(); router.get('/projects', { ...filters, search }, { preserveState: true, replace: true }); };

  const list = useMemo(() => projects.filter((p) => status === 'all' || (p.status || 'nouveau') === status), [projects, status]);
  const counts = useMemo(() => projects.reduce((a, p) => { const k = p.status || 'nouveau'; a[k] = (a[k] || 0) + 1; return a; }, {}), [projects]);

  return (
    <MobileLayout title="Projets">
      <Head title="Projets" />
      <div className="space-y-4 py-4 pb-8">
        <MHero eyebrow="Espace de travail" title="Vos projets" subtitle={`${globalStats.total || projects.length} projet(s) au total`} />
        <div className="grid grid-cols-3 gap-2">
          <MStat label="Total" value={globalStats.total || projects.length} tone="text-blue-600" />
          <MStat label="Actifs" value={globalStats.active || 0} tone="text-emerald-600" />
          <MStat label="Terminés" value={globalStats.completed || 0} />
        </div>
        <form onSubmit={runSearch}><MSearch value={search} onChange={submit} placeholder="Rechercher un projet (Entrée)" /></form>
        <MSegmented value={status} onChange={setStatus} options={[{ value: 'all', label: 'Tous', count: projects.length }, ...Object.entries(STATUS).filter(([k]) => counts[k]).map(([k, [l]]) => ({ value: k, label: l, count: counts[k] }))]} />

        {list.length === 0 ? <MEmpty icon={FaFolderOpen} title="Aucun projet" text="Aucun projet ne correspond à votre recherche." /> : (
          <div className="space-y-3">
            {list.map((p, i) => {
              const [label, tone] = STATUS[p.status || 'nouveau'] || STATUS.nouveau;
              const muted = !!p.is_muted;
              const body = (
                <div className="flex items-center gap-3">
                  <span className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${GRAD[i % GRAD.length]} text-lg font-black text-white shadow-md ${muted ? 'opacity-40 grayscale' : ''}`}>{(p.name || '?').slice(0, 2).toUpperCase()}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className={`truncate text-[15px] font-extrabold ${muted ? 'text-slate-400' : 'text-slate-900 dark:text-white'}`}>{p.name}</h3>
                    <p className="mt-1 flex items-center gap-3 text-xs text-slate-500"><span><FaTasks className="mr-1 inline text-[10px]" />{p.tasks_count ?? p.task_count ?? 0}</span><span><FaUsers className="mr-1 inline text-[10px]" />{p.users_count ?? p.members_count ?? 0}</span></p>
                    <div className="mt-2">
                      {muted
                        ? <span className="inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-red-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-400">Surveillance · No access</span>
                        : <MPill tone={tone}>{label}</MPill>}
                    </div>
                  </div>
                  {!muted && <FaChevronRight className="text-xs text-slate-300" />}
                </div>
              );
              return muted ? (
                <MCard key={p.id} className="!p-3.5 cursor-not-allowed bg-slate-100 opacity-70 grayscale dark:bg-slate-900/60" aria-disabled="true">{body}</MCard>
              ) : (
                <MCard key={p.id} href={`/projects/${p.id}`} className="!p-3.5">{body}</MCard>
              );
            })}
            {!Array.isArray(prop) && <MPager paginator={prop} only={['projects']} />}
          </div>
        )}
      </div>
      <MFab href="/projects/create" label="Nouveau projet"><FaPlus /> Nouveau</MFab>
    </MobileLayout>
  );
}
