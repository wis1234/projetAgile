import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { FaFileAlt, FaFilePdf, FaFileImage, FaFileExcel, FaFileWord, FaFileArchive, FaLock, FaPlus, FaChevronRight } from 'react-icons/fa';
import MobileLayout from '@/Layouts/MobileLayout';
import { MHero, MCard, MSearch, MEmpty, MFab, MPager, MStat } from '@/Components/Mobile/kit';

const kind = (f) => {
  const n = `${f.type || ''} ${f.name || ''}`.toLowerCase();
  if (/pdf/.test(n)) return [FaFilePdf, 'bg-rose-100 text-rose-600'];
  if (/png|jpe?g|gif|webp|image/.test(n)) return [FaFileImage, 'bg-emerald-100 text-emerald-600'];
  if (/xls|csv|sheet/.test(n)) return [FaFileExcel, 'bg-green-100 text-green-700'];
  if (/doc|word/.test(n)) return [FaFileWord, 'bg-blue-100 text-blue-600'];
  if (/zip|rar|7z/.test(n)) return [FaFileArchive, 'bg-amber-100 text-amber-700'];
  return [FaFileAlt, 'bg-sky-100 text-sky-600'];
};
const size = (b) => (!b ? '' : b > 1048576 ? `${(b / 1048576).toFixed(1)} Mo` : `${Math.max(1, Math.round(b / 1024))} Ko`);

export default function MobileFilesIndex({ files: prop = { data: [] }, filters = {}, stats = {} }) {
  const files = Array.isArray(prop) ? prop : prop.data || [];
  const [q, setQ] = useState(filters?.search || '');
  const run = (e) => { e.preventDefault(); router.get('/files', { ...filters, search: q }, { preserveState: true, replace: true }); };
  return (
    <MobileLayout title="Fichiers">
      <Head title="Fichiers" />
      <div className="space-y-4 py-4 pb-8">
        <MHero eyebrow="Documents" title="Vos fichiers" subtitle={`${prop.total ?? files.length} fichier(s)`} tone="from-sky-600 to-blue-700" />
        {stats?.total != null && <div className="grid grid-cols-2 gap-2"><MStat label="Fichiers" value={stats.total} tone="text-sky-600" />{stats.total_size != null && <MStat label="Taille" value={size(stats.total_size) || '—'} />}</div>}
        <form onSubmit={run}><MSearch value={q} onChange={setQ} placeholder="Rechercher un fichier (Entrée)" /></form>
        {files.length === 0 ? <MEmpty icon={FaFileAlt} title="Aucun fichier" /> : (
          <div className="space-y-2">
            {files.map((f) => { const [Icon, cls] = kind(f); return (
              <MCard key={f.id} href={`/files/${f.id}`} className="!p-3">
                <div className="flex items-center gap-3"><span className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-xl ${cls}`}><Icon /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900 dark:text-white">{f.name}</p>
                    <p className="truncate text-[11px] text-slate-500">{[f.project?.name, size(f.size), f.created_at && new Date(f.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })].filter(Boolean).join(' · ')}</p></div>
                  {f.is_password_protected && <FaLock className="text-xs text-amber-500" />}<FaChevronRight className="text-xs text-slate-300" /></div>
              </MCard>); })}
            {!Array.isArray(prop) && <MPager paginator={prop} only={['files']} />}
          </div>
        )}
      </div>
      <MFab href="/files/create" label="Nouveau fichier"><FaPlus /> Ajouter</MFab>
    </MobileLayout>
  );
}
