import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faArrowLeft, 
    faSyncAlt, 
    faExclamationTriangle, 
    faCheck, 
    faCreditCard, 
    faHistory, 
    faReceipt,
    faGem,
    faCrown,
    faUserTie,
    faUserShield,
    faCalendarAlt,
    faExchangeAlt,
    faInfoCircle,
    faCog,
    faTimes
} from '@fortawesome/free-solid-svg-icons';

export default function SubscriptionSettings({ subscription, paymentMethods, auth }) {
    // Log pour déboguer la structure de auth
    console.log('Auth data:', auth);
    console.log('User data:', auth?.user);
    console.log('User properties:', Object.keys(auth?.user || {}));
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    
    const { data, setData, processing } = useForm({
        payment_method: paymentMethods && paymentMethods.length > 0 ? paymentMethods[0].id : '',
    });

    const getPlanIcon = (planName) => {
        if (!planName) return faUserShield;
        const name = planName.toLowerCase();
        if (name.includes('premium')) return faGem;
        if (name.includes('pro')) return faCrown;
        if (name.includes('business') || name.includes('entreprise')) return faUserTie;
        return faUserShield;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-yellow-100 text-yellow-800';
            case 'expired': return 'bg-red-100 text-red-800';
            case 'trial': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status) => {
        if (!status) return 'Inconnu';
        const labels = {
            'active': 'Actif',
            'cancelled': 'Annulé',
            'expired': 'Expiré',
            'trial': 'Essai gratuit',
            'pending': 'En attente',
            'past_due': 'En retard',
            'unpaid': 'Impayé',
            'incomplete': 'Incomplet',
            'incomplete_expired': 'Essai expiré',
            'trialing': 'En période d\'essai',
        };
        return labels[status] || status;
    };

    const handleCancelSubscription = () => {
        setIsLoading(true);
        setError('');
        
        router.post(route('subscription.cancel'), {}, {
            onSuccess: () => {
                setShowCancelModal(false);
                // Recharger la page pour afficher les nouvelles informations d'abonnement
                router.reload({ only: ['subscription'] });
            },
            onError: (errors) => {
                setError(errors.message || 'Une erreur est survenue lors de l\'annulation de votre abonnement.');
            },
            onFinish: () => {
                setIsLoading(false);
            },
        });
    };

    const handleUpdatePaymentMethod = (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        router.post(route('subscription.update-payment-method'), data, {
            onSuccess: () => {
                // Afficher un message de succès ou recharger la page
                router.reload({ only: ['subscription'] });
            },
            onError: (errors) => {
                setError(errors.message || 'Une erreur est survenue lors de la mise à jour de votre méthode de paiement.');
            },
            onFinish: () => {
                setIsLoading(false);
            },
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Date inconnue';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Date invalide';
            return date.toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            console.error('Erreur de formatage de date:', e);
            return 'Date invalide';
        }
    };

return (
    <AdminLayout
        header={
            <div className="flex items-center">
                <Link 
                    href="/settings" 
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                    <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 mr-2" />
                    Retour aux paramètres
                </Link>
                <h2 className="ml-4 text-2xl font-bold leading-tight text-gray-900">
                    Gestion de l'abonnement
                </h2>
                {true && (
                    <Link 
                        href="/admin/subscriptions" 
                        className="ml-4 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <FontAwesomeIcon icon={faCog} className="w-4 h-4 mr-2" />
                        Gérer les abonnements
                    </Link>
                )}
            </div>
        }
    >
        <Head title="Gestion de l'abonnement" />

        <div className="py-8">
            <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                {error && (
                    <div className="p-4 mb-8 text-sm text-red-700 bg-red-100 border-l-4 border-red-500 rounded">
                        <div className="flex">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="flex-shrink-0 w-5 h-5 mr-3" />
                            <div>{error}</div>
                        </div>
                    </div>
                )}
                {/* Le reste de votre contenu JSX */}
            </div>
        </div>
    </AdminLayout>
);
}