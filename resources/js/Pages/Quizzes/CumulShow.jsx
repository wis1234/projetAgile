import React, { useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Avatar from '@/Components/Quiz/Avatar';
import ScoreBadge, { fmtNumber } from '@/Components/Quiz/ScoreBadge';
import {
  FaArrowLeft, FaLayerGroup, FaTrophy, FaMedal, FaAward, FaSearch, FaFileExcel, FaFilePdf, FaStar, FaClock,
  FaChevronDown, FaChevronUp, FaShieldAlt, FaExclamationTriangle,
} from 'react-icons/fa';

function RankBadge({ rank }) {
  if (rank === 1) return <FaTrophy className="text-amber-400 text-xl" />;
  if (rank === 2) return <FaMedal className="text-gray-400 text-xl" />;
  if (rank === 3) return <FaAward className="text-amber-600 text-xl" />;
  if (!rank) return <FaClock className="text-amber-500" />;
  return <span className="font-bold text-gray-400 text-sm">#{rank}</span>;
}

function CumulShow({ project, cumul, quizzes = [], rows = [], stats = {}, method, blocking = [] }) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState({});

  const filtered = useMemo(
    () => rows.filter((r) => r.name.toLowerCase().includes(search.toLowerCase())),
    [rows, search]
  );
  const notValidated = quizzes.filter((q) => !q.validated).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        <Link href={route('projects.quizzes.index', project.id)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-blue-600 dark:text-gray-400">
          <FaArrowLeft /> Retour aux quiz
        </Link>

        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-5 sm:p-6 text-white shadow-md">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="min-w-0">
              <span className="text-xs uppercase font-bold tracking-wider text-indigo-200 inline-flex items-center gap-1.5"><FaLayerGroup /> Résultats cumulés</span>
              <h1 className="text-xl sm:text-2xl font-extrabold mt-1 truncate">{cumul.title}</h1>
              {cumul.description && <p className="text-sm text-indigo-100 mt-1 line-clamp-2">{cumul.description}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={route('projects.quiz-cumuls.export', [project.id, cumul.id, 'xlsx'])} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl text-sm font-bold transition">
                <FaFileExcel /> Exporter Excel
              </a>
              <a href={route('projects.quiz-cumuls.export', [project.id, cumul.id, 'pdf'])} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-rose-700 hover:bg-rose-50 rounded-xl text-sm font-bold transition">
                <FaFilePdf /> Exporter PDF
              </a>
            </div>
          </div>

          {/* Quiz regroupés */}
          <div className="mt-5 pt-4 border-t border-white/15 flex flex-wrap gap-2">
            {quizzes.map((q) => (
              <Link key={q.id} href={route('projects.quizzes.show', [project.id, q.id])}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold transition">
                {q.validated && <FaShieldAlt className="text-emerald-300" title="Validé en délibération" />}
                {q.title}
                <span className="px-1.5 py-0.5 rounded bg-white/20 font-bold">×{q.coefficient}</span>
              </Link>
            ))}
          </div>
        </div>

        {(notValidated > 0 || blocking.length > 0) && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-200">
            <FaExclamationTriangle className="mt-0.5 flex-shrink-0" />
            <span>
              {blocking.length > 0 && <>Des copies restent à corriger dans : <strong>{blocking.join(', ')}</strong>. </>}
              {notValidated > 0 && <>{notValidated} quiz n&apos;ont pas encore été validés en délibération : ces résultats sont provisoires.</>}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            ['Candidats', stats.total ?? 0, 'text-gray-900 dark:text-white'],
            ['Moyenne générale', stats.average != null ? `${fmtNumber(stats.average)}%` : '—', 'text-indigo-600 dark:text-indigo-400'],
            ['Meilleure note', stats.highest != null ? `${fmtNumber(stats.highest)}%` : '—', 'text-emerald-600 dark:text-emerald-400'],
            ['Taux de réussite', stats.pass_rate != null ? `${fmtNumber(stats.pass_rate, 1)}%` : '—', 'text-gray-900 dark:text-white'],
          ].map(([l, v, tone]) => (
            <div key={l} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 text-center shadow-sm">
              <div className={`text-2xl font-black ${tone}`}>{v}</div>
              <div className="text-[11px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">{l}</div>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 sm:p-4 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <FaSearch className="text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un candidat..."
            className="flex-1 min-w-0 border-0 bg-transparent text-sm focus:ring-0 dark:text-white" />
        </div>

        {/* Tableau (défile horizontalement si beaucoup de quiz) */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/40 text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-3 py-3 text-center w-14">Rang</th>
                  <th className="px-3 py-3 text-left sticky left-0 bg-gray-50 dark:bg-gray-900/40">Candidat</th>
                  {quizzes.map((q) => (
                    <th key={q.id} className="px-3 py-3 text-center min-w-[7rem]">
                      <span className="block normal-case font-bold text-gray-700 dark:text-gray-200 line-clamp-2">{q.title}</span>
                      <span className="text-[10px] text-indigo-500">coef. {q.coefficient}</span>
                    </th>
                  ))}
                  <th className="px-3 py-3 text-center">Moyenne</th>
                  {method.include_bonus && <th className="px-3 py-3 text-center">Bonus</th>}
                  <th className="px-3 py-3 text-center">Note finale</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map((r) => (
                  <React.Fragment key={r.key}>
                    <tr className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 ${r.rank && r.rank <= 3 ? 'bg-amber-50/40 dark:bg-amber-950/10' : ''}`}>
                      <td className="px-3 py-3 text-center"><div className="flex justify-center"><RankBadge rank={r.rank} /></div></td>
                      <td className="px-3 py-3 sticky left-0 bg-white dark:bg-gray-800">
                        <div className="flex items-center gap-2.5 min-w-[10rem]">
                          <Avatar name={r.name} src={r.photo} size="sm" />
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 dark:text-white truncate">{r.name}</p>
                            {r.email && <p className="text-[11px] text-gray-500 truncate">{r.email}</p>}
                          </div>
                        </div>
                      </td>
                      {quizzes.map((q) => {
                        const note = r.notes[q.id];
                        return (
                          <td key={q.id} className="px-3 py-3 text-center">
                            {note !== undefined ? (
                              <span className={`font-semibold ${note >= 50 ? 'text-gray-800 dark:text-gray-200' : 'text-red-600 dark:text-red-400'}`}>{fmtNumber(note)}</span>
                            ) : (
                              <span className="text-xs text-gray-400 italic">{r.is_pending ? 'En attente' : 'Absent'}</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-3 text-center font-bold text-indigo-600 dark:text-indigo-300">{r.average != null ? fmtNumber(r.average) : '—'}</td>
                      {method.include_bonus && (
                        <td className="px-3 py-3 text-center text-amber-600 dark:text-amber-400 font-semibold">
                          {r.bonus > 0 ? <span className="inline-flex items-center gap-1"><FaStar className="text-xs" />+{fmtNumber(r.bonus)}</span> : <span className="text-gray-300">0</span>}
                        </td>
                      )}
                      <td className="px-3 py-3 text-center"><ScoreBadge score={r.final} pending={r.is_pending} size="lg" /></td>
                      <td className="px-2 text-center">
                        <button onClick={() => setOpen((o) => ({ ...o, [r.key]: !o[r.key] }))} className="p-2 text-gray-400 hover:text-indigo-600" title="Voir le calcul">
                          {open[r.key] ? <FaChevronUp /> : <FaChevronDown />}
                        </button>
                      </td>
                    </tr>
                    {open[r.key] && (
                      <tr className="bg-indigo-50/50 dark:bg-indigo-950/20">
                        <td />
                        <td colSpan={quizzes.length + (method.include_bonus ? 5 : 4)} className="px-3 py-2.5 text-xs text-indigo-800 dark:text-indigo-200 font-mono">
                          {r.calculation}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={quizzes.length + 6} className="px-4 py-10 text-center text-gray-400">Aucun candidat trouvé.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 px-1">
          Moyenne = Σ (note × coefficient) ÷ Σ coefficients · quiz non passé : {method.missing_policy === 'ignore' ? 'ignoré' : 'compté pour 0'}
          {method.include_bonus && <> · bonus de participation plafonné à {method.bonus_cap} pts (note finale ≤ 100)</>} · admission à partir de {method.pass_mark}%.
        </p>
      </div>
    </div>
  );
}

CumulShow.layout = (page) => <AdminLayout>{page}</AdminLayout>;
export default CumulShow;
