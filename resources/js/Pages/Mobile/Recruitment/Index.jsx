import React from 'react';
import { Head } from '@inertiajs/react';
import { FaBullseye, FaMapMarkerAlt, FaCalendarAlt, FaUserFriends, FaPlus, FaChevronRight } from 'react-icons/fa';
import MobileLayout from '@/Layouts/MobileLayout';
import { MHero, MCard, MPill, MEmpty, MFab, MPager, safeRoute } from '@/Components/Mobile/kit';

const ST = { open: ['Ouvert', 'green'], published: ['Publié', 'green'], active: ['Actif', 'green'], closed: ['Clôturé', 'slate'], draft: ['Brouillon', 'amber'] };
const d = (v) => (v ? new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : null);

export default function MobileRecruitmentIndex({ recruitments: prop = { data: [] } }) {
  const items = Array.isArray(prop) ? prop : prop.data || [];
  return (
    <MobileLayout title="Recrutement">
      <Head title="Recrutement" />
      <div className="space-y-4 py-4 pb-8">
        <MHero eyebrow="Talents" title="Offres de recrutement" subtitle={`${prop.total ?? items.length} offre(s)`} tone="from-rose-600 to-red-700" />
        {items.length === 0 ? <MEmpty icon={FaBullseye} title="Aucune offre" text="Publiez votre première offre de recrutement." /> : (
          <div className="space-y-2.5">
            {items.map((r) => { const [l, t] = ST[r.status] || [r.status || '—', 'slate']; return (
              <MCard key={r.id} href={safeRoute('recruitment.show', r.id, `/recruitment/${r.id}`)} className="!p-3.5">
                <div className="flex items-start justify-between gap-2"><h3 className="text-[15px] font-extrabold leading-snug text-slate-900 dark:text-white">{r.title}</h3><MPill tone={t}>{l}</MPill></div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                  {r.type && <span>{r.type}</span>}{r.location && <span><FaMapMarkerAlt className="mr-1 inline text-[9px]" />{r.location}</span>}{d(r.deadline) && <span><FaCalendarAlt className="mr-1 inline text-[9px]" />{d(r.deadline)}</span>}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs font-bold dark:border-slate-800"><span className="text-rose-600"><FaUserFriends className="mr-1 inline" />{r.applications_count ?? 0} candidature(s)</span><FaChevronRight className="text-slate-300" /></div>
              </MCard>); })}
            {!Array.isArray(prop) && <MPager paginator={prop} only={['recruitments']} />}
          </div>
        )}
      </div>
      <MFab href={safeRoute('recruitment.create', undefined, '/recruitment/create')} label="Nouvelle offre" tone="from-rose-600 to-red-600"><FaPlus /> Offre</MFab>
    </MobileLayout>
  );
}
