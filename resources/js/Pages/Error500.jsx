import React from 'react';
import { Link } from '@inertiajs/react';
import { FaCog, FaHome, FaArrowLeft } from 'react-icons/fa';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Error500() {
    return (
        <div className="py-12">
            <div className="w-full max-w-2xl mx-auto px-6 text-center bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-10">
                {/* Illustration animée */}
                <div className="mb-8">
                    <div className="inline-block p-6 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                        <FaCog className="w-12 h-12 text-orange-500 dark:text-orange-400 animate-[spin_4s_linear_infinite]" />
                    </div>
                </div>

                {/* Message d'erreur */}
                <div className="relative">
                    <h1 className="text-8xl font-bold text-orange-300 dark:text-orange-800 opacity-50 mb-4">
                        500
                    </h1>
                    <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 -mt-16">
                        Erreur Serveur
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-lg mx-auto">
                        Oups ! Quelque chose s'est mal passé de notre côté. Nos équipes techniques ont été notifiées.
                    </p>
                </div>

                {/* Boutons d'action */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link
                        href="/"
                        className="inline-flex items-center px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
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

Error500.layout = page => <AdminLayout children={page} />; 