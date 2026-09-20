import React, { useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import { FaHistory, FaPlusCircle, FaEdit, FaTrash, FaSignInAlt, FaCircle } from 'react-icons/fa';
import MobileLayout from '@/Layouts/MobileLayout';
import Avatar from '@/Components/Quiz/Avatar';
import { MHero, MCard, MSearch, MEmpty, MPager, MSectionTitle, timeAgo } from '@/Components/Mobile/kit';

const TYPE = { create: [FaPlusCircle, 'bg-emerald-100 text-emerald-600'], update: [FaEdit, 'bg-blue-100 text-blue-600'], delete: [FaTrash, 'bg-rose-100 text-rose-600'], login: [FaSignInAlt, 'bg-violet-100 text-violet-600'] };
const dayLabel = (iso) => { const d = new Date(iso); const t = new Date(); const y = new Date(Date.now() - 864e5); const same = (a, b) => a.toDateString() === b.toDateString(); return same(d, t) ? "Aujourd'hui" : same(d, y) ? 'Hier' : d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }); };

export default function MobileActivitiesIndex({ activities: prop = { data: [] }, typeLabels = {} }) {
  const items = Array.isArray(prop) ? prop : prop.data || [];
  const [q, setQ] = useState('');
  const groups = useMemo(() => {
    const filtered = items.filter((a) => !q || `${a.description} ${a.user?.name || ''}`.toLowerCase().includes(q.toLowerCase()));
    return filtered.reduce((acc, a) => { const k = dayLabel(a.created_at); (acc[k] = acc[k] || []).push(a); return acc; }, {});
  }, [items, q]);

  return (
    <MobileLayout title="Journal d'activités">
      <Head title="Journal d'activités" />
      <div className="space-y-4 py-4 pb-8">
        <MHero eyebrow="Suivi" title="Journal d'activités" subtitle="Tout ce qui se passe dans vos projets." tone="from-cyan-600 to-blue-700" />
        <MSearch value={q} onChange={setQ} placeholder="Filtrer cette page" />
        {Object.keys(groups).length === 0 ? <MEmpty icon={FaHistory} title="Aucune activité" /> : Object.entries(groups).map(([day, list]) => (
          <section key={day}>
            <MSectionTitle>{day}</MSectionTitle>
            <MCard className="!p-0 divide-y divide-slate-100 dark:divide-slate-800">
              {list.map((a) => { const [Icon, cls] = TYPE[a.type] || [FaCircle, 'bg-slate-100 text-slate-500']; return (
                <div key={a.id} className="flex items-start gap-3 p-3.5">
                  <span className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-sm ${cls}`}><Icon /></span>
                  <div className="min-w-0 flex-1"><p className="break-words text-[13.5px] font-semibold leading-snug text-slate-800 dark:text-slate-100">{a.description}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">{a.user && <Avatar name={a.user.name} src={a.user.profile_photo_url} size="xs" />}{a.user?.name} · {timeAgo(a.created_at)}</p></div>
                </div>); })}
            </MCard>
          </section>
        ))}
        {!Array.isArray(prop) && <MPager paginator={prop} only={['activities']} />}
      </div>
    </MobileLayout>
  );
}
