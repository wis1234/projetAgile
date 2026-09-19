import React, { useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Avatar from '@/Components/Quiz/Avatar';
import ScoreBadge, { fmtNumber } from '@/Components/Quiz/ScoreBadge';
import {
  FaTrophy, FaMedal, FaAward, FaArrowLeft, FaSearch, FaEye, FaPenFancy, FaGavel, FaFileExcel, FaFilePdf,
  FaShieldAlt, FaStar, FaUsers, FaClock,
} from 'react-icons/fa';

function RankBadge({ rank }) {
  if (rank === 1) return <FaTrophy className="text-amber-400 text-xl" title="1er" />;
  if (rank === 2) return <FaMedal className="text-gray-400 text-xl" title="2ème" />;
  if (rank === 3) return <FaAward className="text-amber-600 text-xl" title="3ème" />;
  if (!rank) return <FaClock className="text-amber-500" title="En attente de correction" />;
  return <span className="font-bold text-gray-400 text-sm">#{rank}</span>;
}

function StatCard({ label, value, tone = 'text-gray-900 dark:text-white' }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 text-center shadow-sm">
      <div className={`text-2xl font-black ${tone}`}>{value}</div>
      <div className="text-[11px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}

function Ranking({ project, quiz, rankings = [], stats = {}, canManage, validated = false }) {
  const [search, setSearch] = useState('');

  const rows = useMemo(
    () => rankings.filter((r) => (r.name || '').toLowerCase().includes(search.toLowerCase())),
    [rankings, search]
  );

  const detailHref = (row) => `${route('projects.quizzes.results', [project.id, quiz.id])}?attempt_id=${row.attempt_id}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-6 sm:py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        <Link
          href={route('projects.quizzes.show', [project.id, quiz.id])}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-blue-600 dark:text-gray-400"
        >
          <FaArrowLeft /> Retour aux détails du quiz
        </Link>

        {/* En-tête */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-5 sm:p-6 text-white shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <span className="text-xs uppercase font-bold tracking-wider text-blue-200 inline-flex items-center gap-2">
                Classement officiel
                {validated && (
                  <span className="inline-flex items-center gap-1 bg-emerald-400/20 text-emerald-100 px-2 py-0.5 rounded-full normal-case tracking-normal">
                    <FaShieldAlt /> Validé
                  </span>
                )}
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold flex items-center gap-2 mt-1">
                <FaTrophy className="text-amber-300 flex-shrink-0" /> <span className="truncate">{quiz.title}</span>
              </h1>
            </div>
            <div className="sm:text-right">
              <span className="text-3xl font-black">{stats.total ?? rankings.length}</span>
              <span className="block text-xs text-blue-200">Participant(s)</span>
            </div>
          </div>

          {canManage && (
            <div className="mt-5 pt-4 border-t border-white/15 flex flex-col sm:flex-row flex-wrap gap-2">
              <Link
                href={route('projects.quizzes.grading', [project.id, quiz.id])}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-purple-700 hover:bg-purple-50 rounded-xl text-sm font-bold transition shadow-sm"
              >
                <FaPenFancy /> Espace de correction de copies
                {stats.pending > 0 && (
                  <span className="px-2 py-0.5 text-[11px] bg-amber-400 text-amber-950 rounded-full font-extrabold">{stats.pending}</span>
                )}
              </Link>
              <Link
                href={route('projects.quizzes.deliberation', [project.id, quiz.id])}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-semibold transition"
              >
                <FaGavel /> Délibération
              </Link>
              <a
                href={route('projects.quizzes.export', [project.id, quiz.id, 'xlsx'])}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-semibold transition"
              >
                <FaFileExcel /> Excel
              </a>
              <a
                href={route('projects.quizzes.export', [project.id, quiz.id, 'pdf'])}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-semibold transition"
              >
                <FaFilePdf /> PDF
              </a>
            </div>
          )}
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Moyenne" value={stats.average != null ? `${fmtNumber(stats.average)}%` : '—'} tone="text-blue-600 dark:text-blue-400" />
          <StatCard label="Meilleure note" value={stats.highest != null ? `${fmtNumber(stats.highest)}%` : '—'} tone="text-emerald-600 dark:text-emerald-400" />
          <StatCard label="Taux de réussite" value={stats.pass_rate != null ? `${fmtNumber(stats.pass_rate, 1)}%` : '—'} />
          <StatCard label="En attente" value={stats.pending ?? 0} tone="text-amber-600 dark:text-amber-400" />
        </div>

        {/* Recherche */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 sm:p-4 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <FaSearch className="text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un participant par son nom..."
            className="flex-1 min-w-0 border-0 bg-transparent text-sm focus:ring-0 dark:text-white"
          />
        </div>

        {/* Liste */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          {rows.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm flex flex-col items-center gap-2">
              <FaUsers className="text-3xl text-gray-300" />
              Aucun résultat trouvé.
            </div>
          ) : (
            <>
              {/* En-têtes colonnes (desktop, gestionnaires) */}
              {canManage && (
                <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-900/40 text-[11px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">
                  <span className="col-span-1 text-center">Rang</span>
                  <span className="col-span-4">Candidat</span>
                  <span className="col-span-2 text-center">Note du quiz</span>
                  <span className="col-span-1 text-center">Bonus</span>
                  <span className="col-span-3 text-center">Note finale</span>
                  <span className="col-span-1" />
                </div>
              )}

              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {rows.map((row) => (
                  <div
                    key={row.key}
                    className={`grid grid-cols-12 gap-2 items-center p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition ${
                      row.rank && row.rank <= 3 ? 'bg-amber-50/40 dark:bg-amber-950/10' : ''
                    }`}
                  >
                    <div className="col-span-2 sm:col-span-1 flex justify-center">
                      <RankBadge rank={row.rank} />
                    </div>

                    <div className={`${canManage ? 'col-span-10 md:col-span-4' : 'col-span-6 sm:col-span-8'} flex items-center gap-3 min-w-0`}>
                      <Avatar name={row.name} src={row.photo} size="sm" />
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">{row.name}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {row.qcm_percent != null && <>QCM {fmtNumber(row.qcm_percent, 1)}%</>}
                          {row.qcm_percent != null && row.written_percent != null && ' · '}
                          {row.written_percent != null && (row.is_pending ? 'Écrit en attente' : <>Écrit {fmtNumber(row.written_percent, 1)}%</>)}
                          {row.attempts_count > 1 && ` · meilleur de ${row.attempts_count} essais`}
                        </p>
                      </div>
                    </div>

                    {canManage ? (
                      <>
                        <div className="col-span-4 md:col-span-2 text-center">
                          <span className="md:hidden block text-[10px] uppercase text-gray-400">Quiz</span>
                          <ScoreBadge score={row.score} pending={row.is_pending} size="sm" />
                        </div>
                        <div className="col-span-3 md:col-span-1 text-center text-sm font-semibold text-amber-600 dark:text-amber-400">
                          <span className="md:hidden block text-[10px] uppercase text-gray-400">Bonus</span>
                          {row.bonus > 0 ? (
                            <span className="inline-flex items-center gap-1"><FaStar className="text-xs" />+{fmtNumber(row.bonus)}</span>
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600">0</span>
                          )}
                        </div>
                        <div className="col-span-4 md:col-span-3 text-center">
                          <span className="md:hidden block text-[10px] uppercase text-gray-400">Finale</span>
                          <ScoreBadge score={row.final} pending={row.is_pending} size="lg" />
                        </div>
                        <div className="col-span-1 text-right">
                          <Link
                            href={detailHref(row)}
                            className="inline-flex p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition"
                            title="Voir la copie"
                          >
                            <FaEye />
                          </Link>
                        </div>
                      </>
                    ) : (
                      <div className="col-span-4 sm:col-span-3 text-right">
                        <ScoreBadge score={row.score} pending={row.is_pending} size="lg" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

Ranking.layout = (page) => <AdminLayout>{page}</AdminLayout>;
export default Ranking;
