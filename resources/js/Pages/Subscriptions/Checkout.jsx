// resources/js/Pages/Subscriptions/Checkout.jsx
import React, { useState } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faArrowLeft, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { FedaCheckoutButton } from 'fedapay-reactjs';

export default function Checkout({ plan, paymentMethods }) {
    const { auth } = usePage().props;
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    // Formater le prix avec séparateurs de milliers
    const formatPrice = (price) => {
        return new Intl.NumberFormat('fr-FR').format(price);
    };

    // Configuration du bouton de paiement FedaPay
    const fedapayConfig = {
        public_key: 'pk_live_NVw62EiQ_Yu6mvPq13vuUapq',
        transaction: {
            amount: plan.price,
            description: `Abonnement ${plan.name}`,
            callback_url: route('subscription.success')
        },
        customer: {
            firstname: auth.user.name.split(' ')[0],
            lastname: auth.user.name.split(' ').slice(1).join(' ') || 'Client',
            email: auth.user.email,
            phone_number: {
                number: auth.user.phone || '97XXXXXX',
                country: 'bj'
            }
        },
        currency: {
            iso: 'XOF'
        },
        button: {
            class: 'w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors',
            text: `Payer ${formatPrice(plan.price)} FCFA`,
            disabled: !acceptedTerms || isLoading
        },
        onComplete: (response) => {
            if (response.reason === 'completed') {
                router.visit(route('subscription.success'));
            } else {
                setError('Le paiement a été annulé ou a échoué');
                setIsLoading(false);
            }
        },
        onError: (error) => {
            console.error('Erreur FedaPay:', error);
            setError(`Erreur de paiement: ${error?.message || 'Une erreur est survenue'}`);
            setIsLoading(false);
        }
    };

    const handlePayment = () => {
        if (!acceptedTerms) {
            setError('Veuillez accepter les conditions générales');
            return;
        }
        setIsLoading(true);
        setError('');
    };

    return (
        <>
            <Head title={`Paiement - ${plan?.name || 'Abonnement'}`} />
            <div className="py-8">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Bouton Retour en haut à gauche */}
                    <div className="mb-6">
                        <Link
                            href={route('subscription.plans')}
                            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                            Retour aux offres
                        </Link>
                    </div>
                    
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white">
                            <div className="md:flex md:space-x-8">
                                {/* Détails de la commande */}
                                <div className="md:w-1/2 md:pr-8 mb-8 md:mb-0">
                                    <h3 className="text-lg font-medium text-gray-900 mb-6 pb-2 border-b">
                                        Votre commande
                                    </h3>
                                    
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-medium text-gray-900">{plan.name}</h4>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {plan.period || 'Abonnement mensuel'}
                                                </p>
                                            </div>
                                            <span className="font-bold text-blue-600 whitespace-nowrap">
                                                {formatPrice(plan.price)} FCFA
                                            </span>
                                        </div>

                                        <div className="pt-4 border-t border-gray-100">
                                            <h4 className="font-medium text-gray-900 mb-3">Ce qui est inclus :</h4>
                                            <ul className="space-y-3">
                                                {plan.features?.map((feature, index) => (
                                                    <li key={index} className="flex items-start">
                                                        <FontAwesomeIcon 
                                                            icon={faCheckCircle} 
                                                            className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" 
                                                        />
                                                        <span className="text-gray-700">{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="pt-4 border-t border-gray-100">
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium text-gray-900">Total</span>
                                                <div className="text-right">
                                                    <span className="text-2xl font-bold text-blue-600">
                                                        {formatPrice(plan.price)} FCFA
                                                    </span>
                                                    <p className="text-sm text-gray-500">TTC {plan.period ? `(${plan.period})` : ''}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Paiement */}
                                <div className="md:w-1/2 md:pl-8 md:border-l border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900 mb-6 pb-2 border-b">
                                        Informations de paiement
                                    </h3>

                                    <div className="space-y-6">
                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    <FontAwesomeIcon 
                                                        icon={faLock} 
                                                        className="h-5 w-5 text-blue-400" 
                                                    />
                                                </div>
                                                <div className="ml-3">
                                                    <h3 className="text-sm font-medium text-blue-800">
                                                        Paiement sécurisé
                                                    </h3>
                                                    <div className="mt-2 text-sm text-blue-700">
                                                        <p>
                                                            Vos informations de paiement sont cryptées et sécurisées.
                                                            Nous ne stockons jamais vos coordonnées bancaires.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-start">
                                                <div className="flex items-center h-5">
                                                    <input
                                                        id="terms"
                                                        name="terms"
                                                        type="checkbox"
                                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                        checked={acceptedTerms}
                                                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                                                    />
                                                </div>
                                                <div className="ml-3 text-sm">
                                                    <label htmlFor="terms" className="font-medium text-gray-700">
                                                        J'accepte les conditions générales de vente
                                                    </label>
                                                    <p className="text-gray-500">
                                                        En cliquand sur Payer, vous acceptez nos conditions générales de vente.
                                                    </p>
                                                </div>
                                            </div>

                                            {error && (
                                                <div className="text-red-500 text-sm p-3 bg-red-50 rounded-md">
                                                    {error}
                                                </div>
                                            )}


                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <div className="flex flex-col items-center space-y-4">
                                                    <div className="w-full">
                                                        <div className="w-full">
                                                            <FedaCheckoutButton 
                                                                options={fedapayConfig}
                                                                onClick={handlePayment}
                                                            />
                                                            {isLoading && (
                                                                <div className="mt-2 text-center text-sm text-gray-500">
                                                                    <svg className="animate-spin h-5 w-5 mx-auto text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                    </svg>
                                                                    Traitement en cours...
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="w-full">
                                                        <span className="text-xs text-gray-500">Méthodes de paiement acceptées :</span>
                                                        <div className="flex justify-center space-x-3 mt-1">
                                                            <div className="flex flex-col items-center">
                                                                <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center">
                                                                    <span className="text-white text-xs font-bold">VISA</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-center">
                                                                <div className="w-10 h-6 bg-orange-500 rounded flex items-center justify-center">
                                                                    <span className="text-white text-xs font-bold">MC</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-center">
                                                                <div className="w-10 h-6 bg-yellow-500 rounded flex items-center justify-center">
                                                                    <span className="text-white text-xs font-bold">MTN</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-center">
                                                                <div className="w-10 h-6 bg-green-600 rounded flex items-center justify-center">
                                                                    <span className="text-white text-xs font-bold">MOOV</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

Checkout.layout = page => <AdminLayout children={page} />;
