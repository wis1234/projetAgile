import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faCreditCard, 
    faReceipt, 
    faHistory, 
    faDownload, 
    faArrowLeft,
    faFileInvoice,
    faCalendarAlt,
    faTag,
    faCheckCircle,
    faClock,
    faTimesCircle,
    faPlus
} from '@fortawesome/free-solid-svg-icons';

export default function Billing({ subscription, invoices = [], paymentMethods = [] }) {
    const { auth } = usePage().props;

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

    // Formater le montant
    const formatAmount = (amount, currency = 'FCFA') => {
        if (amount === null || amount === undefined) return '0,00 ' + currency;
        return new Intl.NumberFormat('fr-FR', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
        }).format(amount) + ' ' + currency;
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Facturation et abonnement
                    </h2>
                    <Link 
                        href="/dashboard" 
                        className="inline-flex items-center px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 mr-2" />
                        Retour au tableau de bord
                    </Link>
                </div>
            }
        >
            <Head title="Facturation" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Section Résumé de l'abonnement */}
                    <div className="p-6 mb-8 bg-white rounded-lg shadow">
                        <div className="flex flex-col justify-between md:items-center md:flex-row">
                            <div>
                                <h3 className="text-lg font-medium leading-6 text-gray-900">
                                    Votre abonnement actuel
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Gérez vos informations d'abonnement et de facturation
                                </p>
                            </div>
                            {subscription && (
                                <span className={`inline-flex items-center px-3 py-1 mt-3 text-sm font-medium rounded-full md:mt-0 ${
                                    subscription.status === 'active' 
                                        ? 'bg-green-100 text-green-800' 
                                        : subscription.status === 'pending'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-red-100 text-red-800'
                                }`}>
                                    {subscription.status === 'active' 
                                        ? 'Actif' 
                                        : subscription.status === 'pending' 
                                            ? 'En attente de paiement' 
                                            : 'Inactif'}
                                </span>
                            )}
                        </div>

                        {subscription ? (
                            <div className="mt-8">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                    <div className="p-4 border rounded-lg">
                                        <div className="flex items-center">
                                            <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 text-blue-500 bg-blue-100 rounded-full">
                                                <FontAwesomeIcon icon={faTag} />
                                            </div>
                                            <div className="ml-4">
                                                <dt className="text-sm font-medium text-gray-500 truncate">
                                                    Forfait
                                                </dt>
                                                <dd className="mt-1 text-lg font-semibold text-gray-900">
                                                    {subscription.plan_name || 'Non spécifié'}
                                                </dd>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 border rounded-lg">
                                        <div className="flex items-center">
                                            <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 text-blue-500 bg-blue-100 rounded-full">
                                                <FontAwesomeIcon icon={faCalendarAlt} />
                                            </div>
                                            <div className="ml-4">
                                                <dt className="text-sm font-medium text-gray-500 truncate">
                                                    Période de facturation
                                                </dt>
                                                <dd className="mt-1 text-lg font-semibold text-gray-900">
                                                    {subscription.interval === 'year' ? 'Annuel' : 'Mensuel'}
                                                </dd>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 border rounded-lg">
                                        <div className="flex items-center">
                                            <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 text-blue-500 bg-blue-100 rounded-full">
                                                <FontAwesomeIcon icon={faFileInvoice} />
                                            </div>
                                            <div className="ml-4">
                                                <dt className="text-sm font-medium text-gray-500 truncate">
                                                    Prochaine facture
                                                </dt>
                                                <dd className="mt-1 text-lg font-semibold text-gray-900">
                                                    {subscription.ends_at ? formatDate(subscription.ends_at) : 'Non disponible'}
                                                </dd>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6 mt-6 md:grid-cols-2">
                                    <div className="p-4 border rounded-lg">
                                        <h4 className="text-sm font-medium text-gray-500">Dates importantes</h4>
                                        <dl className="mt-2 space-y-3">
                                            <div className="flex justify-between">
                                                <dt className="text-sm text-gray-500">Date de début</dt>
                                                <dd className="text-sm font-medium text-gray-900">
                                                    {subscription.starts_at ? formatDate(subscription.starts_at) : 'Non disponible'}
                                                </dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-sm text-gray-500">Date de renouvellement</dt>
                                                <dd className="text-sm font-medium text-gray-900">
                                                    {subscription.ends_at ? formatDate(subscription.ends_at) : 'Non disponible'}
                                                </dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-sm text-gray-500">Statut</dt>
                                                <dd className="text-sm font-medium">
                                                    <span className={`inline-flex items-center ${
                                                        subscription.status === 'active' 
                                                            ? 'text-green-600' 
                                                            : subscription.status === 'pending'
                                                                ? 'text-yellow-600'
                                                                : 'text-red-600'
                                                    }`}>
                                                        {subscription.status === 'active' ? (
                                                            <>
                                                                <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4 mr-1" />
                                                                Actif
                                                            </>
                                                        ) : subscription.status === 'pending' ? (
                                                            <>
                                                                <FontAwesomeIcon icon={faClock} className="w-4 h-4 mr-1" />
                                                                En attente
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FontAwesomeIcon icon={faTimesCircle} className="w-4 h-4 mr-1" />
                                                                Inactif
                                                            </>
                                                        )}
                                                    </span>
                                                </dd>
                                            </div>
                                        </dl>
                                    </div>

                                    <div className="p-4 border rounded-lg">
                                        <h4 className="text-sm font-medium text-gray-500">Détails de facturation</h4>
                                        <dl className="mt-2 space-y-3">
                                            <div className="flex justify-between">
                                                <dt className="text-sm text-gray-500">Montant</dt>
                                                <dd className="text-sm font-medium text-gray-900">
                                                    {formatAmount(subscription.amount)}
                                                    <span className="text-gray-500"> / {subscription.interval === 'year' ? 'an' : 'mois'}</span>
                                                </dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-sm text-gray-500">Méthode de paiement</dt>
                                                <dd className="text-sm font-medium text-gray-900">
                                                    {paymentMethods.length > 0 
                                                        ? `${paymentMethods[0].brand} se terminant par ${paymentMethods[0].last4}`
                                                        : 'Aucune méthode enregistrée'}
                                                </dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-sm text-gray-500">Prochain prélèvement</dt>
                                                <dd className="text-sm font-medium text-gray-900">
                                                    {subscription.ends_at ? formatDate(subscription.ends_at) : 'Non disponible'}
                                                </dd>
                                            </div>
                                        </dl>
                                    </div>
                                </div>

                                <div className="flex flex-col mt-6 space-y-4 sm:space-y-0 sm:flex-row sm:space-x-4">
                                    <Link 
                                        href="/subscription/change-plan" 
                                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        <FontAwesomeIcon icon={faTag} className="w-4 h-4 mr-2" />
                                        Changer de forfait
                                    </Link>
                                    
                                    {subscription.status === 'active' ? (
                                        <Link 
                                            href="/subscription/cancel" 
                                            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-transparent rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                        >
                                            <FontAwesomeIcon icon={faTimesCircle} className="w-4 h-4 mr-2" />
                                            Résilier l'abonnement
                                        </Link>
                                    ) : (
                                        <Link 
                                            href="/subscription/resume" 
                                            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-transparent rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                        >
                                            <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4 mr-2" />
                                            Reprendre l'abonnement
                                        </Link>
                                    )}

                                    <Link 
                                        href="/subscription/update-payment" 
                                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        <FontAwesomeIcon icon={faCreditCard} className="w-4 h-4 mr-2" />
                                        Mettre à jour le paiement
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 mt-6 text-center bg-gray-50 rounded-lg">
                                <h3 className="text-lg font-medium text-gray-900">Aucun abonnement actif</h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    Vous n'avez pas d'abonnement actif. Parcourez nos forfaits pour commencer.
                                </p>
                                <div className="mt-6">
                                    <Link 
                                        href="/pricing" 
                                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Voir les forfaits disponibles
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section Historique des factures */}
                    <div className="p-6 mb-8 bg-white rounded-lg shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium leading-6 text-gray-900">
                                    Historique des factures
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Consultez et téléchargez vos factures précédentes
                                </p>
                            </div>
                            <Link 
                                href="/invoices" 
                                className="text-sm font-medium text-blue-600 hover:text-blue-500"
                            >
                                Voir tout l'historique
                            </Link>
                        </div>

                        {invoices.length > 0 ? (
                            <div className="mt-6 overflow-hidden border border-gray-200 rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                                                N° de facture
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                                                Date
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                                                Montant
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                                                Statut
                                            </th>
                                            <th scope="col" className="relative px-6 py-3">
                                                <span className="sr-only">Télécharger</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {invoices.map((invoice) => (
                                            <tr key={invoice.id}>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                                                    {invoice.number || `#${invoice.id}`}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                    {formatDate(invoice.date)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                    {formatAmount(invoice.amount, invoice.currency)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 text-xs font-semibold leading-5 rounded-full ${
                                                        invoice.paid 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {invoice.paid ? 'Payée' : 'En attente'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                                                    <a 
                                                        href={invoice.invoice_pdf} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        <FontAwesomeIcon icon={faDownload} className="w-4 h-4" />
                                                    </a>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-6 mt-6 text-center bg-gray-50 rounded-lg">
                                <FontAwesomeIcon 
                                    icon={faReceipt} 
                                    className="w-12 h-12 mx-auto text-gray-400" 
                                    aria-hidden="true"
                                />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune facture</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Aucune facture n'a été trouvée pour votre compte.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Section Moyens de paiement */}
                    <div className="p-6 mb-8 bg-white rounded-lg shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium leading-6 text-gray-900">
                                    Moyens de paiement
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Gérez vos méthodes de paiement enregistrées
                                </p>
                            </div>
                            <button
                                type="button"
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <FontAwesomeIcon icon={faPlus} className="-ml-0.5 mr-2 h-4 w-4" />
                                Ajouter
                            </button>
                        </div>

                        {paymentMethods.length > 0 ? (
                            <div className="mt-6 overflow-hidden border border-gray-200 rounded-lg">
                                <ul className="divide-y divide-gray-200">
                                    {paymentMethods.map((method) => (
                                        <li key={method.id} className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    {method.brand === 'visa' && (
                                                        <img className="w-12 h-8" src="/images/visa.png" alt="Visa" />
                                                    )}
                                                    {method.brand === 'mastercard' && (
                                                        <img className="w-12 h-8" src="/images/mastercard.png" alt="Mastercard" />
                                                    )}
                                                    {!['visa', 'mastercard'].includes(method.brand) && (
                                                        <div className="flex items-center justify-center w-12 h-8 bg-gray-100 rounded">
                                                            <FontAwesomeIcon icon={faCreditCard} className="w-5 h-5 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {method.brand ? method.brand.charAt(0).toUpperCase() + method.brand.slice(1) : 'Carte'} 
                                                        se terminant par {method.last4}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        Expire le {method.exp_month.toString().padStart(2, '0')}/{method.exp_year.toString().slice(-2)}
                                                        {method.is_default && (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 ml-2 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                Par défaut
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="ml-auto">
                                                    <button
                                                        type="button"
                                                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                    >
                                                        Modifier
                                                    </button>
                                                    {!method.is_default && (
                                                        <button
                                                            type="button"
                                                            className="inline-flex items-center px-2.5 py-1.5 ml-2 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                        >
                                                            Supprimer
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <div className="p-6 mt-6 text-center bg-gray-50 rounded-lg">
                                <FontAwesomeIcon 
                                    icon={faCreditCard} 
                                    className="w-12 h-12 mx-auto text-gray-400" 
                                    aria-hidden="true"
                                />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun moyen de paiement</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Vous n'avez pas encore enregistré de moyen de paiement.
                                </p>
                                <div className="mt-6">
                                    <button
                                        type="button"
                                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        <FontAwesomeIcon icon={faPlus} className="w-4 h-4 mr-2" />
                                        Ajouter un moyen de paiement
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
