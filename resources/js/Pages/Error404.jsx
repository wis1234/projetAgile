import React from 'react';
import { Link } from '@inertiajs/react';
import { FaSearch, FaHome, FaArrowLeft } from 'react-icons/fa';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Error404() {
    return (
        <div className="py-12">
            <div className="w-full max-w-2xl mx-auto px-6 text-center bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-10">
                {/* Illustration animée */}
                <div className="mb-8">
                    <div className="inline-block p-6 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                        <FaSearch className="w-12 h-12 text-purple-500 dark:text-purple-400 animate-[spin_3s_linear_infinite]" />
                    </div>
                </div>

                {/* Message d'erreur */}
                <div className="relative">
                    <h1 className="text-8xl font-bold text-purple-300 dark:text-purple-800 opacity-50 mb-4">
                        404
                    </h1>
                    <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 -mt-16">
                        Page Non Trouvée
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-lg mx-auto">
                        Désolé, la page que vous recherchez semble avoir disparu dans le cyberespace.
                    </p>
                </div>

                {/* Boutons d'action */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link
                        href="/"
                        className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
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

Error404.layout = page => <AdminLayout children={page} />; 