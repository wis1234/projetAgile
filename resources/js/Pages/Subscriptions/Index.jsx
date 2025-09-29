import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faCrown, faUserTie, faGift, faClock, faCheck, faCog, faUsersCog } from '@fortawesome/free-solid-svg-icons';

export default function SubscriptionPlans({ plans, currentPlan = null }) {
    const { auth } = usePage().props;
    
    // Vérifier si l'utilisateur a un abonnement actif
    const hasActiveSubscription = currentPlan && currentPlan.status === 'active';

    // Les fonctionnalités sont maintenant récupérées depuis la base de données via la propriété features de chaque plan

    const getPlanIcon = (planName) => {
        if (!planName) {
            return <FontAwesomeIcon icon={faUserTie} className="mr-2" />;
        }
        const lowerName = String(planName).toLowerCase();
        switch (lowerName) {
            case 'mensuel':
                return <FontAwesomeIcon icon={faClock} className="mr-2" />;
            case 'annuel':
                return <FontAwesomeIcon icon={faGift} className="mr-2" />;
            case 'entreprise':
                return <FontAwesomeIcon icon={faCrown} className="mr-2" />;
            default:
                return <FontAwesomeIcon icon={faUserTie} className="mr-2" />;
        }
    };

    // Fonction pour formater la date en français
    const formatDate = (dateString) => {
        if (!dateString) return 'Non défini';
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString('fr-FR', options);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <AdminLayout
                header={
                    <div className="flex flex-col px-6 py-4 space-y-4 bg-white border-b border-gray-200 md:space-y-0 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-2xl font-bold leading-tight text-gray-800">
                                Gestion des abonnements
                            </h2>
                            <div className="flex space-x-4">
                                <Link 
                                    href="/settings/subscription" 
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    <FontAwesomeIcon icon={faCog} className="w-4 h-4 mr-2" />
                                    Mon abonnement
                                </Link>
                                {(auth?.user?.role === 'admin' || auth?.user?.is_admin || auth?.user?.isAdmin) && (
                                    <Link 
                                        href="/admin/subscriptions" 
                                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                    >
                                        <FontAwesomeIcon icon={faUsersCog} className="w-4 h-4 mr-2" />
                                        Gérer les abonnements
                                    </Link>
                                )}
                            </div>
                        </div>
                        {currentPlan && (
                            <span className="px-4 py-2 text-sm font-semibold text-green-800 bg-green-100 border border-green-200 rounded-full shadow-sm">
                                Votre forfait actuel: {currentPlan.name}
                            </span>
                        )}
                    </div>
                }
            >
            <Head title="Abonnements" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <h2 className="mb-6 text-2xl font-bold text-gray-800">
                        Choisissez votre forfait
                    </h2>
                    
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {plans.map((plan) => {
                            const isCurrentPlan = currentPlan && currentPlan.id === plan.id;
                            const isPopular = plan.slug === 'annuel';
                            
                            return (
                                <div 
                                    key={plan.id}
                                    className={`relative flex flex-col p-8 transition-all duration-300 border-2 rounded-lg shadow-sm ${
                                        isPopular 
                                            ? 'bg-gradient-to-br from-blue-50 to-white border-blue-500 transform scale-105 z-10' 
                                            : 'bg-white border-gray-200 hover:border-blue-300'
                                    }`}
                                >
                                    {isPopular && (
                                        <div className="absolute px-3 py-1 text-xs font-medium text-white bg-primary-600 rounded-full -top-3 right-4">
                                            Économisez 20%
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-medium text-gray-900">
                                            {getPlanIcon(plan?.name)}
                                            {plan?.name || 'Forfait sans nom'}
                                        </h3>
                                        {isCurrentPlan && (
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                currentPlan.status === 'active' 
                                                    ? 'text-green-800 bg-green-100' 
                                                    : currentPlan.status === 'pending' 
                                                        ? 'text-yellow-800 bg-yellow-100' 
                                                        : 'text-red-800 bg-red-100'
                                            }`}>
                                                {currentPlan.status === 'active' 
                                                    ? 'Votre forfait' 
                                                    : currentPlan.status === 'pending' 
                                                        ? 'En attente' 
                                                        : 'Expiré'}
                                            </span>
                                        )}
                                    </div>

                                    <p className="mt-4 text-sm text-gray-500">
                                        {plan?.description || 'Aucune description disponible pour ce forfait.'}
                                    </p>

                                    <div className="mt-6">
                                        {isCurrentPlan && currentPlan.amount_paid ? (
                                            <>
                                                <p className="text-2xl font-bold text-gray-500 line-through">
                                                    {plan?.price ? plan.price.toLocaleString() : '0'} FCFA
                                                </p>
                                                <p className="text-4xl font-extrabold text-blue-600">
                                                    {currentPlan.amount_paid.toLocaleString()} FCFA
                                                    <span className="text-base font-medium text-gray-600">
                                                        /{plan?.period || 'période'}
                                                    </span>
                                                </p>
                                            </>
                                        ) : (
                                            <p className="text-4xl font-extrabold text-gray-900">
                                                {plan?.price ? plan.price.toLocaleString() : '0'} FCFA
                                                {plan?.period && (
                                                    <span className="text-base font-medium text-gray-600">
                                                        /{plan.period}
                                                    </span>
                                                )}
                                            </p>
                                        )}
                                        {plan?.period === 'par an' && plan?.price && (
                                            <p className="mt-1 text-sm text-gray-500">
                                                Soit {Math.round(plan.price / 12).toLocaleString()} FCFA/mois
                                            </p>
                                        )}
                                    </div>

                                    <ul className="mt-6 space-y-3">
                                        {(() => {
                                            try {
                                                // Essayer de parser features s'il s'agit d'une chaîne JSON
                                                const features = typeof plan.features === 'string' 
                                                    ? JSON.parse(plan.features)
                                                    : Array.isArray(plan.features) 
                                                        ? plan.features 
                                                        : [];
                                                
                                                if (features && features.length > 0) {
                                                    return features.map((feature, index) => (
                                                        <li key={index} className="flex items-start">
                                                            <FontAwesomeIcon 
                                                                icon={faCheck} 
                                                                className="w-5 h-5 mt-0.5 mr-2 text-green-500 flex-shrink-0" 
                                                            />
                                                            <span className="text-sm font-medium text-gray-700">{feature}</span>
                                                        </li>
                                                    ));
                                                }
                                            } catch (e) {
                                                console.error('Erreur lors du traitement des fonctionnalités:', e);
                                            }
                                            
                                            return (
                                                <li className="text-sm text-gray-500">
                                                    Aucune fonctionnalité spécifiée
                                                </li>
                                            );
                                        })()}
                                    </ul>

                                    <div className="mt-8">
                                        {isCurrentPlan ? (
                                            <div className="space-y-2">
                                                <button
                                                    disabled
                                                    className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md cursor-not-allowed"
                                                >
                                                    {hasActiveSubscription ? 'Abonnement actif' : 'Forfait actuel'}
                                                </button>
                                                {hasActiveSubscription && (
                                                    <Link
                                                        href={route('subscription.manage')}
                                                        className="block w-full px-4 py-2 text-sm font-medium text-center text-blue-600 transition duration-150 ease-in-out bg-white border border-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                    >
                                                        Gérer l'abonnement
                                                    </Link>
                                                )}
                                            </div>
                                        ) : (
                                            <Link
                                                href={route('subscription.checkout', plan.id)}
                                                className={`block w-full px-4 py-3 text-sm font-medium text-center text-white transition duration-150 ease-in-out border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-md hover:shadow-lg ${
                                                    hasActiveSubscription 
                                                        ? 'bg-gray-400 hover:bg-gray-500 focus:ring-gray-500' 
                                                        : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                                                }`}
                                                disabled={hasActiveSubscription}
                                            >
                                                {hasActiveSubscription ? 'Changement de forfait' : 'Choisir ce forfait'}
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    {/* Section Abonnement Actuel */}
                    {currentPlan && (
                        <div className="p-6 mt-12 bg-white rounded-lg shadow">
                            <h3 className="mb-4 text-xl font-semibold text-gray-900">Détails sur votre abonnement</h3>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                                <div className="p-4 border rounded-lg">
                                    <p className="text-sm font-medium text-gray-500">Type d'abonnement</p>
                                    <p className="mt-1 text-lg font-semibold text-gray-900">
                                        {getPlanIcon(currentPlan.plan_name)}
                                        {currentPlan.plan_name}
                                    </p>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <p className="text-sm font-medium text-gray-500">Date de début</p>
                                    <p className="mt-1 text-lg font-semibold text-gray-900">
                                        {formatDate(currentPlan.starts_at)}
                                    </p>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <p className="text-sm font-medium text-gray-500">Date de fin</p>
                                    <p className="mt-1 text-lg font-semibold text-gray-900">
                                        {formatDate(currentPlan.ends_at)}
                                    </p>
                                </div>
                                {/* <div className="p-4 border rounded-lg">
                                    <p className="text-sm font-medium text-gray-500">Montant payé</p>
                                    <p className="mt-1 text-lg font-semibold text-green-600">
                                        {currentPlan.amount_paid?.toLocaleString() || '0'} FCFA
                                    </p>
                                </div> */}
                            </div>
                            <div className="flex items-center justify-between px-4 py-3 mt-4 text-sm bg-blue-50 rounded-b-lg">
                                <span className="flex items-center">
                                    <span className={`inline-block w-2 h-2 mr-2 rounded-full ${
                                        currentPlan.status === 'active' ? 'bg-green-500' : 
                                        currentPlan.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}></span>
                                    Statut: <span className="ml-1 font-medium">
                                        {currentPlan.status === 'active' ? 'Actif' : 
                                         currentPlan.status === 'pending' ? 'En attente' : 'Inactif'}
                                    </span>
                                </span>
                                <Link 
                                    href="/settings/billing" 
                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                    {/* Voir les détails de facturation → */}
                                </Link>
                            </div>
                        </div>
                    )}
                    
                    {/* Section Questions Fréquentes */}
                    <div className="mt-12 bg-white rounded-lg shadow">
                        <div className="px-6 py-5 border-b border-gray-200">
                            <h3 className="text-lg font-medium leading-6 text-gray-900">Questions fréquentes</h3>
                        </div>
                        <div className="px-6 py-5 space-y-6">
                            <div>
                                <h4 className="font-medium text-gray-900">Puis-je changer de forfait à tout moment ?</h4>
                                <p className="mt-2 text-sm text-gray-500">
                                    Oui, vous pouvez passer à un autre forfait à tout moment. Le changement prendra effet à la fin de votre période de facturation actuelle.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">Quels modes de paiement acceptez-vous ?</h4>
                                <p className="mt-2 text-sm text-gray-500">
                                    Nous acceptons les paiements par carte bancaire, Orange Money et MTN Mobile Money via notre partenaire FedaPay.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">Puis-je annuler mon abonnement ?</h4>
                                <p className="mt-2 text-sm text-gray-500">
                                    Oui, vous pouvez annuler votre abonnement à tout moment. Vous continuerez à avoir accès aux fonctionnalités payantes jusqu'à la fin de votre période de facturation actuelle.
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Bouton Retour au tableau de bord */}
                    <div className="mt-12 text-center">
                        <Link 
                            href="/dashboard"
                            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                            </svg>
                            Retour au tableau de bord
                        </Link>
                    </div>
                </div>
            </div>
            </AdminLayout>
        </div>
    );
}
