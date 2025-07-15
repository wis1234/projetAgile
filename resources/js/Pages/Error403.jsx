import React from 'react';
import AdminLayout from '../Layouts/AdminLayout';
import { Link } from '@inertiajs/react';

function Error403() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-10 flex flex-col items-center">
        <svg className="w-20 h-20 text-red-500 mb-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0z" /></svg>
        <h1 className="text-4xl font-bold text-red-600 mb-2">Accès refusé</h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">Cette action n'est pas autorisée.<br/>Vous n'avez pas les droits nécessaires pour accéder à cette page.<br/>Si vous pensez qu'il s'agit d'une erreur, contactez un administrateur.</p>
        <Link href="/" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition">Retour à l'accueil</Link>
      </div>
      <div className="mt-8 text-gray-400 text-sm">&copy; {new Date().getFullYear()} ProJA - Agile Manager</div>
    </div>
  );
}

Error403.layout = page => <AdminLayout children={page} />;
export default Error403; 