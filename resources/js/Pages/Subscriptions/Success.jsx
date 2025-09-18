import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faEnvelope, faHome, faCog } from '@fortawesome/free-solid-svg-icons';

export default function SubscriptionSuccess({ subscription }) {
    return (
        <AuthenticatedLayout>
            <Head title="Paiement réussi" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
                        <div className="px-4 py-5 text-center sm:p-6">
                            <div className="flex justify-center">
                                <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-green-100">
                                    <FontAwesomeIcon 
                                        icon={faCheckCircle} 
                                        className="w-10 h-10 text-green-600"
                                    />
                                </div>
                            </div>
                            
                            <h2 className="mt-4 text-2xl font-bold text-gray-900">Paiement réussi !</h2>
                            
                            <p className="max-w-md mx-auto mt-3 text-base text-gray-500">
                                Merci pour votre achat. Votre abonnement <span className="font-medium">{subscription.plan.name}</span> a été activé avec succès.
                            </p>
                            
                            <div className="max-w-md p-6 mx-auto mt-8 bg-gray-50 rounded-lg">
                                <h3 className="text-lg font-medium text-gray-900">Récapitulatif de votre commande</h3>
                                
                                <dl className="mt-4 space-y-4">
                                    <div className="flex justify-between">
                                        <dt className="text-sm font-medium text-gray-500">Numéro de commande</dt>
                                        <dd className="text-sm text-gray-900">#{subscription.id}</dd>
                                    </div>
                                    
                                    <div className="flex justify-between">
                                        <dt className="text-sm font-medium text-gray-500">Forfait</dt>
                                        <dd className="text-sm text-gray-900">{subscription.plan.name}</dd>
                                    </div>
                                    
                                    <div className="flex justify-between">
                                        <dt className="text-sm font-medium text-gray-500">Période</dt>
                                        <dd className="text-sm text-gray-900">
                                            {new Date(subscription.starts_at).toLocaleDateString('fr-FR')} - {new Date(subscription.ends_at).toLocaleDateString('fr-FR')}
                                        </dd>
                                    </div>
                                    
                                    <div className="flex justify-between pt-4 border-t border-gray-200">
                                        <dt className="text-base font-medium text-gray-900">Total payé</dt>
                                        <dd className="text-base font-medium text-gray-900">
                                            {subscription.amount_paid.toLocaleString('fr-FR')} FCFA
                                        </dd>
                                    </div>
                                </dl>
                                
                                <div className="mt-6">
                                    <div className="flex items-center p-3 text-sm text-blue-700 bg-blue-100 rounded-lg">
                                        <FontAwesomeIcon icon={faEnvelope} className="flex-shrink-0 mr-2" />
                                        <span>Un email de confirmation a été envoyé à votre adresse email.</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex flex-col justify-center mt-8 space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
                                <Link
                                    href="/dashboard"
                                    className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white border border-transparent rounded-md shadow-sm bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                >
                                    <FontAwesomeIcon icon={faHome} className="w-5 h-5 mr-2 -ml-1" />
                                    Retour à l'accueil
                                </Link>
                                
                                <Link
                                    href="/settings/subscription"
                                    className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                >
                                    <FontAwesomeIcon icon={faCog} className="w-5 h-5 mr-2 -ml-1 text-gray-500" />
                                    Gérer mon abonnement
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
