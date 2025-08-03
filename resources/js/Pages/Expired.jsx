import React from 'react';
import { Link } from '@inertiajs/react';
import { FaClock, FaHome, FaSignInAlt } from 'react-icons/fa';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Expired() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-2xl mx-auto px-6 text-center bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-10">
                {/* Icône d'expiration animée */}
                <div className="mb-8">
                    <div className="inline-block p-6 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                        <FaClock className="w-12 h-12 text-amber-500 dark:text-amber-400 animate-pulse" />
                    </div>
                </div>

                {/* Message d'erreur */}
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    Session Expirée
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-lg mx-auto">
                    Votre session a expiré en raison d'une inactivité prolongée. Veuillez vous reconnecter pour continuer.
                </p>

                {/* Boutons d'action */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link
                        href="/login"
                        className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                        <FaSignInAlt className="mr-2" />
                        Se reconnecter
                    </Link>
                    <Link
                        href="/"
                        className="inline-flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                        <FaHome className="mr-2" />
                        Retour à l'accueil
                    </Link>
                </div>
            </div>
        </div>
    );
}

Expired.layout = page => <AdminLayout children={page} title="Session Expirée" />;
