import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';

export default function CsrfErrorModal() {
    const [show, setShow] = useState(false);

    // Fonction pour afficher le modal d'erreur
    const showCsrfError = () => {
        setShow(true);
    };

    // Fonction pour recharger la page
    const reloadPage = () => {
        router.reload({ only: ['errors'] });
    };

    // Exposer la fonction au scope global
    useEffect(() => {
        window.showCsrfError = showCsrfError;
        return () => {
            delete window.showCsrfError;
        };
    }, []);

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                <div className="flex items-start">
                    <div className="flex-shrink-0 bg-red-100 p-3 rounded-full">
                        <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">Session expirée</h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-600">
                                Votre session a expiré en raison d'une inactivité prolongée. Veuillez recharger la page pour continuer.
                            </p>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button
                                type="button"
                                onClick={reloadPage}
                                className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                            >
                                Recharger la page
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
