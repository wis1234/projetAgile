import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { FaUsers, FaPlus, FaChevronRight } from 'react-icons/fa';
import MobileLayout from '@/Layouts/MobileLayout';
import Avatar from '@/Components/Quiz/Avatar';
import { MHero, MCard, MPill, MSearch, MEmpty, MFab, MPager } from '@/Components/Mobile/kit';

const ROLE = { admin: ['Admin', 'red'], manager: ['Manager', 'purple'], member: ['Membre', 'blue'], developer: ['Développeur', 'blue'], candidate: ['Candidat', 'green'], user: ['Utilisateur', 'slate'] };

export default function MobileUsersIndex({ users: prop = { data: [] }, filters = {}, stats = null }) {
  const users = Array.isArray(prop) ? prop : prop.data || [];
  const [q, setQ] = useState(filters?.search || '');
  const run = (e) => { e.preventDefault(); router.get('/users', { ...filters, search: q }, { preserveState: true, replace: true }); };
  return (
    <MobileLayout title="Utilisateurs">
      <Head title="Utilisateurs" />
      <div className="space-y-4 py-4 pb-8">
        <MHero eyebrow="Équipe" title="Utilisateurs" subtitle={`${prop.total ?? users.length} compte(s)`} tone="from-slate-700 to-slate-900" />
        <form onSubmit={run}><MSearch value={q} onChange={setQ} placeholder="Rechercher (Entrée)" /></form>
        {users.length === 0 ? <MEmpty icon={FaUsers} title="Aucun utilisateur" /> : (
          <div className="space-y-2">
            {users.map((u) => { const [l, t] = ROLE[u.role] || ROLE.user; return (
              <MCard key={u.id} href={`/users/${u.id}`} className="!p-3">
                <div className="flex items-center gap-3"><Avatar name={u.name} src={u.profile_photo_url} size="lg" />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">{u.name}</p><p className="truncate text-xs text-slate-500">{u.email}</p><div className="mt-1"><MPill tone={t}>{l}</MPill></div></div>
                  <FaChevronRight className="text-xs text-slate-300" /></div>
              </MCard>); })}
            {!Array.isArray(prop) && <MPager paginator={prop} only={['users']} />}
          </div>
        )}
      </div>
      <MFab href="/users/create" label="Nouvel utilisateur"><FaPlus /> Ajouter</MFab>
    </MobileLayout>
  );
}
