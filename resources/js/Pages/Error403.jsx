import React from 'react';
import { Link } from '@inertiajs/react';
import { FaLock, FaHome, FaArrowLeft } from 'react-icons/fa';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Error403() {
    return (
        <div className="py-12">
            <div className="w-full max-w-2xl mx-auto px-6 text-center bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-10">
                {/* Icône d'erreur animée */}
                <div className="mb-8">
                    <div className="inline-block p-6 bg-red-100 dark:bg-red-900/30 rounded-full">
                        <FaLock className="w-12 h-12 text-red-500 dark:text-red-400 animate-bounce" />
                    </div>
                </div>

                {/* Message d'erreur */}
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    Accès Refusé
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-lg mx-auto">
                    Désolé, vous n'avez pas les autorisations nécessaires pour accéder à cette ressource.
                </p>

                {/* Boutons d'action */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link
                        href="/"
                        className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                        <FaHome className="mr-2" />
                        Retour à l'accueil
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                        <FaArrowLeft className="mr-2" />
                        Page précédente
                    </button>
                </div>
            </div>
        </div>
    );
}

Error403.layout = page => <AdminLayout children={page} />; 