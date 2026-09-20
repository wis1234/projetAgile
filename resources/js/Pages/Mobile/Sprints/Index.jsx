import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { FaBolt, FaCalendarAlt, FaPlus, FaChevronRight } from 'react-icons/fa';
import MobileLayout from '@/Layouts/MobileLayout';
import { MHero, MCard, MPill, MSearch, MEmpty, MFab, MPager } from '@/Components/Mobile/kit';

const d = (v) => (v ? new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—');
const state = (s) => { const now = Date.now(); if (s.end_date && new Date(s.end_date) < now) return ['Terminé', 'slate']; if (s.start_date && new Date(s.start_date) > now) return ['À venir', 'blue']; return ['En cours', 'green']; };

export default function MobileSprintsIndex({ sprints: prop = { data: [] }, filters = {} }) {
  const sprints = Array.isArray(prop) ? prop : prop.data || [];
  const [q, setQ] = useState(filters?.search || '');
  const run = (e) => { e.preventDefault(); router.get('/sprints', { ...filters, search: q }, { preserveState: true, replace: true }); };
  return (
    <MobileLayout title="Sprints">
      <Head title="Sprints" />
      <div className="space-y-4 py-4 pb-8">
        <MHero eyebrow="Agilité" title="Vos sprints" subtitle={`${prop.total ?? sprints.length} sprint(s)`} tone="from-amber-500 to-orange-600" />
        <form onSubmit={run}><MSearch value={q} onChange={setQ} placeholder="Rechercher un sprint (Entrée)" /></form>
        {sprints.length === 0 ? <MEmpty icon={FaBolt} title="Aucun sprint" /> : (
          <div className="space-y-2.5">
            {sprints.map((s) => { const [l, t] = state(s); return (
              <MCard key={s.id} href={`/sprints/${s.id}`} className="!p-3.5">
                <div className="flex items-center gap-3"><span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-lg text-white shadow-md"><FaBolt /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">{s.name}</p><p className="truncate text-[11px] text-slate-500">{s.project?.name}</p>
                    <p className="mt-1 text-[11px] text-slate-500"><FaCalendarAlt className="mr-1 inline text-[9px]" />{d(s.start_date)} → {d(s.end_date)}</p></div>
                  <div className="flex flex-col items-end gap-2"><MPill tone={t}>{l}</MPill><FaChevronRight className="text-xs text-slate-300" /></div></div>
              </MCard>); })}
            {!Array.isArray(prop) && <MPager paginator={prop} only={['sprints']} />}
          </div>
        )}
      </div>
      <MFab href="/sprints/create" label="Nouveau sprint"><FaPlus /> Sprint</MFab>
    </MobileLayout>
  );
}
