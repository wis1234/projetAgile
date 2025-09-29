import React, { useEffect } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { FaClock, FaSignInAlt, FaSync } from 'react-icons/fa';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Error419() {
    const { props } = usePage();
    const { status, message } = props;

    useEffect(() => {
        // Si le token CSRF a expiré, on force une déconnexion propre
        if (window.location.pathname !== '/login') {
            router.post('/logout').then(() => {
                router.visit('/login', {
                    only: [],
                    onError: (errors) => {
                        console.error('Erreur lors de la déconnexion:', errors);
                    },
                    onFinish: () => {
                        // S'assurer que le cache est vidé
                        if ('caches' in window) {
                            caches.keys().then(names => {
                                names.forEach(name => caches.delete(name));
                            });
                        }
                    }
                });
            });
        }
    }, []);

    const handleRefresh = () => {
        // On recharge complètement la page pour s'assurer que tout est réinitialisé
        window.location.href = '/';
    };

    const handleLogin = () => {
        router.visit('/login', { only: [] });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-orange-100 dark:bg-orange-900/30 mb-6">
                        <FaClock className="h-12 w-12 text-orange-500 dark:text-orange-400 animate-pulse" />
                    </div>
                    <h1 className="text-6xl font-bold text-orange-500 dark:text-orange-400 mb-4">
                        419
                    </h1>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                        Session Expirée
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        Votre session a expiré en raison d'une inactivité prolongée.
                    </p>
                </div>

                <div className="mt-8 space-y-4">
                    <div>
                        <Link
                            onClick={handleLogin}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-200 cursor-pointer"
                        >
                            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                <FaSignInAlt className="h-5 w-5 text-orange-300 group-hover:text-orange-200" />
                            </span>
                            {message || 'Votre session a expiré. Veuillez vous reconnecter.'}
                        </Link>
                    </div>
                    <div>
                        <button
                            onClick={handleRefresh}
                            className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600 transition-colors duration-200"
                        >
                            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                <FaSync className="h-5 w-5 text-gray-400 group-hover:text-gray-500 dark:text-gray-300 dark:group-hover:text-gray-200" />
                            </span>
                            Rafraîchir la page
                        </button>
                    </div>
                </div>
                
                <div className="mt-6 text-center">
                    <Link 
                        href="/" 
                        className="text-sm font-medium text-orange-600 hover:text-orange-500 dark:text-orange-400 dark:hover:text-orange-300"
                    >
                        Retour à la page d'accueil
                    </Link>
                </div>
            </div>
        </div>
    );
}

// Set a custom layout for this page if needed
Error419.layout = page => <AdminLayout title="Session Expirée">{page}</AdminLayout>;
