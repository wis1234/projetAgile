import React, { useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import { FaTrophy, FaMedal, FaAward, FaClock, FaStar, FaPenFancy, FaGavel, FaFileExcel, FaFilePdf, FaEye, FaShieldAlt, FaUsers } from 'react-icons/fa';
import MobileLayout from '@/Layouts/MobileLayout';
import Avatar from '@/Components/Quiz/Avatar';
import ScoreBadge, { fmtNumber } from '@/Components/Quiz/ScoreBadge';
import { MHero, MStat, MCard, MSearch, MEmpty, MButton, MDownload } from '@/Components/Mobile/kit';

const Rank = ({ rank }) => rank === 1 ? <FaTrophy className="text-xl text-amber-400" /> : rank === 2 ? <FaMedal className="text-xl text-slate-400" /> : rank === 3 ? <FaAward className="text-xl text-amber-600" /> : !rank ? <FaClock className="text-amber-500" /> : <span className="text-sm font-black text-slate-400">#{rank}</span>;

export default function MobileRanking({ project, quiz, rankings = [], stats = {}, canManage, validated = false }) {
  const [q, setQ] = useState('');
  const rows = useMemo(() => rankings.filter((r) => (r.name || '').toLowerCase().includes(q.toLowerCase())), [rankings, q]);
  const podium = rankings.filter((r) => r.rank && r.rank <= 3 && !r.is_pending).slice(0, 3);

  return (
    <MobileLayout title="Classement" backHref={route('projects.quizzes.show', [project.id, quiz.id])}>
      <Head title={`Classement – ${quiz.title}`} />
      <div className="space-y-4 py-4">
        <MHero eyebrow={validated ? 'Classement officiel ✓' : 'Classement'} title={quiz.title} subtitle={`${stats.total ?? rankings.length} participant(s)`} tone="from-blue-600 to-indigo-700" />

        {canManage && (
          <div className="grid grid-cols-2 gap-2">
            <MButton href={route('projects.quizzes.grading', [project.id, quiz.id])} tone="purple" className="col-span-2"><FaPenFancy /> Espace de correction{stats.pending > 0 && <span className="rounded-full bg-amber-400 px-2 text-[11px] font-extrabold text-amber-950">{stats.pending}</span>}</MButton>
            <MButton href={route('projects.quizzes.deliberation', [project.id, quiz.id])} tone="soft" className="col-span-2"><FaGavel /> Délibération {validated && <FaShieldAlt className="text-emerald-500" />}</MButton>
            <MDownload href={route('projects.quizzes.export', [project.id, quiz.id, 'xlsx'])}><FaFileExcel className="text-emerald-600" /> Excel</MDownload>
            <MDownload href={route('projects.quizzes.export', [project.id, quiz.id, 'pdf'])}><FaFilePdf className="text-rose-600" /> PDF</MDownload>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <MStat label="Moyenne" value={stats.average != null ? `${fmtNumber(stats.average, 1)}%` : '—'} tone="text-blue-600" />
          <MStat label="Meilleur" value={stats.highest != null ? `${fmtNumber(stats.highest, 1)}%` : '—'} tone="text-emerald-600" />
          <MStat label="Réussite" value={stats.pass_rate != null ? `${fmtNumber(stats.pass_rate, 0)}%` : '—'} />
        </div>

        {podium.length >= 3 && !q && (
          <div className="flex items-end justify-center gap-2 pt-2">
            {[podium[1], podium[0], podium[2]].map((r, i) => (
              <div key={r.key} className={`flex flex-1 flex-col items-center rounded-t-2xl bg-white px-2 pb-3 pt-3 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 ${i === 1 ? 'pb-5' : ''}`}>
                <Avatar name={r.name} src={r.photo} size={i === 1 ? 'lg' : 'md'} ring={i === 1 ? 'ring-4 ring-amber-300' : ''} />
                <p className="mt-1.5 line-clamp-1 w-full text-[11px] font-bold text-slate-900 dark:text-white">{r.name}</p>
                <ScoreBadge score={canManage ? r.final : r.score} size="sm" />
                <span className="mt-1 text-lg">{['🥈', '🥇', '🥉'][i]}</span>
              </div>
            ))}
          </div>
        )}

        <MSearch value={q} onChange={setQ} placeholder="Rechercher un participant" />

        {rows.length === 0 ? <MEmpty icon={FaUsers} title="Aucun résultat" /> : (
          <div className="space-y-2">
            {rows.map((r) => (
              <MCard key={r.key} className="!p-3">
                <div className="flex items-center gap-3">
                  <div className="flex w-8 flex-shrink-0 justify-center"><Rank rank={r.rank} /></div>
                  <Avatar name={r.name} src={r.photo} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{r.name}</p>
                    <p className="truncate text-[11px] text-slate-500">
                      {r.qcm_percent != null && <>QCM {fmtNumber(r.qcm_percent, 0)}%</>}{r.qcm_percent != null && r.written_percent != null && ' · '}{r.written_percent != null && (r.is_pending ? 'Écrit en attente' : <>Écrit {fmtNumber(r.written_percent, 0)}%</>)}
                      {canManage && r.bonus > 0 && <span className="ml-1 font-bold text-amber-600"><FaStar className="mr-0.5 inline text-[9px]" />+{fmtNumber(r.bonus)}</span>}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <ScoreBadge score={canManage ? r.final : r.score} pending={r.is_pending} size="md" />
                    {canManage && <a href={`${route('projects.quizzes.results', [project.id, quiz.id])}?attempt_id=${r.attempt_id}`} className="text-slate-400 active:text-blue-600" aria-label="Voir la copie"><FaEye /></a>}
                  </div>
                </div>
              </MCard>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
