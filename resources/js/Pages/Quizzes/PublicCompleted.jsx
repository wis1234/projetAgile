import React from 'react';
import { FaCheckCircle } from 'react-icons/fa';

export default function PublicCompleted({ quiz, guest_name }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-xl rounded-2xl border border-gray-100 dark:border-gray-700 space-y-4">
          <FaCheckCircle className="text-6xl text-emerald-500 mx-auto" />
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Merci, {guest_name} !</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Vos réponses au quiz <span className="font-semibold text-gray-900 dark:text-white">"{quiz.title}"</span> ont été soumises avec succès.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 pt-2">
            L'équipe responsable du projet examinera vos résultats. Vous pouvez fermer cette fenêtre.
          </p>
        </div>
      </div>
    </div>
  );
}
