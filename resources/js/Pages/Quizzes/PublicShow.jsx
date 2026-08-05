import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { FaClock, FaQuestionCircle, FaPlay, FaUser, FaEnvelope, FaShieldAlt } from 'react-icons/fa';

export default function PublicShow({ quiz }) {
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStart = (e) => {
    e.preventDefault();
    setLoading(true);
    router.post(route('quizzes.public.start', quiz.public_token), {
      guest_name: guestName,
      guest_email: guestEmail,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto text-white text-3xl font-extrabold shadow-lg mb-3">
          ProJA
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Évaluation en ligne</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Vous êtes invité(e) à passer le quiz <span className="font-bold text-gray-800 dark:text-gray-200">"{quiz.title}"</span>.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-xl rounded-2xl border border-gray-100 dark:border-gray-700 space-y-6">
          {/* Info Badge */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center text-xs">
            <div>
              <FaClock className="mx-auto mb-1 text-blue-500 text-base" />
              <span className="text-gray-500 dark:text-gray-400 block">Durée</span>
              <span className="font-bold text-gray-900 dark:text-white text-sm">{quiz.duration_minutes} min</span>
            </div>
            <div>
              <FaQuestionCircle className="mx-auto mb-1 text-purple-500 text-base" />
              <span className="text-gray-500 dark:text-gray-400 block">Questions</span>
              <span className="font-bold text-gray-900 dark:text-white text-sm">{quiz.questions_count}</span>
            </div>
          </div>

          {quiz.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 bg-blue-50 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
              {quiz.description}
            </p>
          )}

          {/* Form */}
          <form onSubmit={handleStart} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Nom complet *
              </label>
              <div className="relative">
                <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Jean Dupont"
                  className="pl-9 w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white text-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Adresse Email *
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="jean.dupont@example.com"
                  className="pl-9 w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white text-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition shadow-md"
            >
              <FaPlay /> Commencer le Quiz
            </button>
          </form>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 text-center">
            <FaShieldAlt /> Aucune création de compte n'est requise.
          </div>
        </div>
      </div>
    </div>
  );
}
