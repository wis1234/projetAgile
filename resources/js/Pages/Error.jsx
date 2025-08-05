import { Head } from '@inertiajs/react';
import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FaExclamationTriangle } from 'react-icons/fa';

export default function Error({ status, message }) {
    const statusMessages = {
        403: 'Accès refusé',
        404: 'Page non trouvée',
        419: 'Session expirée',
        500: 'Erreur serveur',
        503: 'Service indisponible',
    };

    const errorTitle = statusMessages[status] || 'Erreur inattendue';
    const errorMessage = message || 'Une erreur est survenue lors du chargement de la page.';

    return (
        <AdminLayout>
            <Head title={errorTitle} />
            
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 text-center">
                    <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100">
                        <FaExclamationTriangle className="h-12 w-12 text-red-600" aria-hidden="true" />
                    </div>
                    
                    <div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                            {errorTitle}
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            {errorMessage}
                        </p>
                    </div>
                    
                    <div className="mt-6">
                        <a
                            href={route('dashboard')}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Retour au tableau de bord
                        </a>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
