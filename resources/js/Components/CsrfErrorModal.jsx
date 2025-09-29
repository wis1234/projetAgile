import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { FaExclamationTriangle, FaSignInAlt, FaSync } from 'react-icons/fa';

export default function CsrfErrorModal() {
    const [show, setShow] = useState(false);
    const [errorType, setErrorType] = useState('csrf'); // 'csrf' ou 'session'
    const [currentUrl, setCurrentUrl] = useState(window.location.pathname);

    // Fonction pour afficher le modal d'erreur
    const showCsrfError = (type = 'csrf') => {
        setErrorType(type);
        setShow(true);
    };

    // Fonction pour recharger la page
    const reloadPage = () => {
        // On recharge complètement la page pour s'assurer que tout est réinitialisé
        window.location.href = '/';
    };

    // Fonction pour se reconnecter
    const handleLogin = () => {
        // On force une déconnexion propre avant de rediriger vers la page de connexion
        router.post('/logout').then(() => {
            router.visit('/login', {
                only: [],
                data: {
                    expired: errorType === 'session' ? '1' : undefined,
                    return: currentUrl
                },
                onError: (errors) => {
                    console.error('Erreur lors de la déconnexion:', errors);
                    window.location.href = '/login';
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
    };

    // Exposer les fonctions au scope global
    useEffect(() => {
        window.showCsrfError = showCsrfError;
        window.showSessionExpired = () => showCsrfError('session');
        
        // Mettre à jour l'URL actuelle lors de la navigation
        const updateUrl = () => setCurrentUrl(window.location.pathname);
        window.addEventListener('popstate', updateUrl);
        
        return () => {
            delete window.showCsrfError;
            delete window.showSessionExpired;
            window.removeEventListener('popstate', updateUrl);
        };
    }, []);

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 mb-4">
                        <FaExclamationTriangle className="h-8 w-8 text-orange-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {errorType === 'session' ? 'Session expirée' : 'Erreur de sécurité'}
                    </h3>
                    <div className="mt-2">
                        <p className="text-sm text-gray-600">
                            {errorType === 'session' 
                                ? 'Votre session a expiré en raison d\'une inactivité prolongée. Veuillez vous reconnecter pour continuer.'
                                : 'Une erreur de sécurité est survenue. Veuillez recharger la page et vous reconnecter.'
                            }
                        </p>
                    </div>
                    
                    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <button
                            type="button"
                            onClick={handleLogin}
                            className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                        >
                            <FaSignInAlt className="mr-2 h-4 w-4" />
                            Se reconnecter
                        </button>
                        
                        <button
                            type="button"
                            onClick={reloadPage}
                            className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                        >
                            <FaSync className="mr-2 h-4 w-4" />
                            Recharger
                        </button>
                    </div>
                    
                    <div className="mt-4 text-center">
                        <p className="text-xs text-gray-500">
                            Code d'erreur: {errorType === 'session' ? 'SESSION_EXPIRED' : 'CSRF_TOKEN_MISMATCH'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
