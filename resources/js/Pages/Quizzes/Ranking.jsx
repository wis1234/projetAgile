import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FaTrophy, FaMedal, FaAward, FaArrowLeft, FaSearch, FaEye } from 'react-icons/fa';

function Ranking({ project, quiz, rankings = [], canManage }) {
  const [search, setSearch] = useState('');

  const filteredRankings = rankings.filter((r) =>
    (r.user?.name || r.guest_name || 'Utilisateur').toLowerCase().includes(search.toLowerCase())
  );

  const getRankBadge = (index) => {
    if (index === 0) return <FaTrophy className="text-amber-400 text-xl" title="1er" />;
    if (index === 1) return <FaMedal className="text-gray-400 text-xl" title="2ème" />;
    if (index === 2) return <FaAward className="text-amber-600 text-xl" title="3ème" />;
    return <span className="font-bold text-gray-400 text-sm">#{index + 1}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation */}
        <Link
          href={route('projects.quizzes.show', [project.id, quiz.id])}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-blue-600 dark:text-gray-400"
        >
          <FaArrowLeft /> Retour aux détails du quiz
        </Link>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-blue-200">Classement officiel</span>
            <h1 className="text-2xl font-extrabold flex items-center gap-2 mt-1">
              <FaTrophy className="text-amber-300" /> {quiz.title}
            </h1>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black">{rankings.length}</span>
            <span className="block text-xs text-blue-200">Participant(s)</span>
          </div>
        </div>

        {/* Search Input */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <FaSearch className="text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un participant par son nom..."
            className="flex-1 border-0 bg-transparent text-sm focus:ring-0 dark:text-white"
          />
        </div>

        {/* Rankings Table Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          {filteredRankings.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
              Aucun résultat trouvé.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredRankings.map((row, idx) => (
                <div
                  key={row.id}
                  className={`flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${
                    idx < 3 ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 text-center flex justify-center">{getRankBadge(idx)}</div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                        {row.user?.name || row.guest_name || 'Utilisateur'}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Total questions : {row.total_questions} | Correctes : {row.correct_answers}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                      {row.score}%
                    </span>

                    {canManage && (
                      <Link
                        href={`${route('projects.quizzes.results', [project.id, quiz.id])}?attempt_id=${row.attempt_id}`}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition"
                        title="Voir la copie"
                      >
                        <FaEye />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Ranking.layout = (page) => <AdminLayout>{page}</AdminLayout>;
export default Ranking;
