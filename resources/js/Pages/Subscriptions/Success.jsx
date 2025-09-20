import React, { useEffect, useState } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faCheckCircle, 
    faEnvelope, 
    faHome, 
    faCog, 
    faSpinner, 
    faTimesCircle
} from '@fortawesome/free-solid-svg-icons';

export default function SubscriptionSuccess({ subscription: initialSubscription }) {
    const [subscription, setSubscription] = useState(initialSubscription);
    const [isLoading, setIsLoading] = useState(initialSubscription?.status === 'pending');
    const [error, setError] = useState(null);
    const { flash } = usePage().props;

    // Polling pour vérifier le statut
    useEffect(() => {
        if (!subscription || subscription.status !== 'pending') return;

        const interval = setInterval(() => {
            router.reload({
                only: ['subscription'],
                preserveState: true,
                onSuccess: (page) => {
                    const updatedSubscription = page.props.subscription;
                    setSubscription(updatedSubscription);

                    if (updatedSubscription?.status !== 'pending') {
                        setIsLoading(false);
                        clearInterval(interval);
                    }
                },
                onError: () => {
                    setError('Erreur lors de la vérification du statut du paiement');
                    setIsLoading(false);
                    clearInterval(interval);
                }
            });
        }, 5000);

        return () => clearInterval(interval);
    }, [subscription]);

    // Pas d'abonnement
    if (!subscription) {
        return (
            <AuthenticatedLayout>
                <Head title="Paiement en cours de traitement" />
                <div className="py-12">
                    <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
                            <div className="px-4 py-5 text-center sm:p-6">
                                <h2 className="mt-4 text-2xl font-bold text-gray-900">
                                    Paiement en cours de traitement
                                </h2>
                                <p className="mt-3 text-base text-gray-500">
                                    Votre paiement est en cours de traitement. Vous recevrez bientôt une confirmation par email.
                                </p>
                                <Link
                                    href="/dashboard"
                                    className="mt-6 inline-flex items-center px-6 py-3 text-base font-medium text-white rounded-md shadow-sm bg-primary-600 hover:bg-primary-700"
                                >
                                    <FontAwesomeIcon icon={faHome} className="w-5 h-5 mr-2" />
                                    Retour à l'accueil
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    // En attente
    if (isLoading) {
        return (
            <AuthenticatedLayout>
                <Head title="Paiement en cours de traitement" />
                <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
                    <div className="w-full max-w-md space-y-8">
                        <div className="text-center">
                            <div className="flex justify-center">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-50">
                                    <FontAwesomeIcon 
                                        icon={faSpinner} 
                                        spin 
                                        className="w-10 h-10 text-blue-600" 
                                    />
                                </div>
                            </div>
                            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Traitement en cours</h2>
                            <div className="mt-6 space-y-4">
                                <p className="text-gray-600">
                                    Nous traitons votre paiement avec soin. Cette opération peut prendre quelques instants.
                                </p>
                                <p className="text-gray-500 text-sm">
                                    <FontAwesomeIcon icon={faEnvelope} className="mr-2 text-blue-500" />
                                    Un email de confirmation vous sera envoyé dès que le traitement sera terminé.
                                </p>
                                <p className="mt-4 text-gray-500 italic">
                                    Merci d'avoir choisi Proja pour votre gestion de projet.
                                </p>
                            </div>
                            <div className="mt-8">
                                <Link
                                    href="/dashboard"
                                    className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 border border-transparent rounded-md shadow-sm hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                                >
                                    <FontAwesomeIcon icon={faHome} className="w-5 h-5 mr-2" />
                                    Retour au tableau de bord
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    // Paiement échoué
    if (subscription.status === 'declined' || subscription.status === 'failed' || error) {
        return (
            <AuthenticatedLayout>
                <Head title="Paiement échoué" />
                <div className="py-12">
                    <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
                            <div className="px-4 py-12 text-center sm:px-6">
                                <div className="flex justify-center mb-4">
                                    <FontAwesomeIcon icon={faTimesCircle} className="w-10 h-10 text-red-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Paiement échoué</h2>
                                <p className="mt-2 text-gray-600">
                                    {error || 'Une erreur est survenue lors du traitement de votre paiement.'}
                                </p>
                                <div className="mt-8 flex justify-center space-x-3">
                                    <Link
                                        href={`/subscriptions/checkout/${subscription.subscription_plan_id}`}
                                        className="px-6 py-3 text-base font-medium text-white rounded-md shadow-sm bg-primary-600 hover:bg-primary-700"
                                    >
                                        Réessayer
                                    </Link>
                                    <Link
                                        href="/dashboard"
                                        className="px-6 py-3 text-base font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-50"
                                    >
                                        Retour au tableau de bord
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    // Paiement réussi
    return (
        <AuthenticatedLayout>
            <Head title="Paiement réussi" />
            <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
                <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="px-8 py-12 sm:p-12">
                        <div className="text-center">
                            <div className="flex justify-center mb-6">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50">
                                    <FontAwesomeIcon 
                                        icon={faCheckCircle} 
                                        className="w-10 h-10 text-green-600" 
                                    />
                                </div>
                            </div>
                            <h2 className="text-3xl font-extrabold text-gray-900">Paiement réussi !</h2>
                            
                            <div className="mt-6 space-y-4">
                                <p className="text-lg text-gray-600">
                                    Merci pour votre confiance. Votre abonnement <span className="font-semibold text-green-600">{subscription.plan?.name}</span> a été activé avec succès.
                                </p>
                                
                                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                                    <p className="text-blue-700 flex items-start">
                                        <FontAwesomeIcon icon={faEnvelope} className="mt-1 mr-2 text-blue-500 flex-shrink-0" />
                                        <span>Un email de confirmation contenant les détails de votre abonnement vous a été envoyé à l'adresse associée à votre compte.</span>
                                    </p>
                                </div>

                                <p className="mt-4 text-gray-500">
                                    Vous pouvez maintenant profiter de toutes les fonctionnalités incluses dans votre abonnement.
                                </p>

                                <p className="mt-6 text-gray-500 italic">
                                    Merci d'avoir choisi Proja pour votre gestion de projet.
                                </p>
                            </div>

                            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
                                <Link
                                    href="/dashboard"
                                    className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-green-600 to-green-700 border border-transparent rounded-md shadow-sm hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                                >
                                    <FontAwesomeIcon icon={faHome} className="w-5 h-5 mr-2" />
                                    Retour au tableau de bord
                                </Link>
                                
                                <Link
                                    href="/projects"
                                    className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                                >
                                    <FontAwesomeIcon icon={faCog} className="w-5 h-5 mr-2" />
                                    Gérer mes projets
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
