import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faPlus, 
    faMoneyBillWave,
    faSearch,
    faUsers,
    faClock,
    faCalendarAlt,
    faEdit,
    faTrash,
    faUserGroup,
    faEllipsisVertical
} from '@fortawesome/free-solid-svg-icons';
import { Menu, Transition } from '@headlessui/react';

function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
}

export default function SubscriptionPlansIndex({ plans = [], stats = {}, filters = {} }) {
    // Valeurs par défaut pour les statistiques
    const {
        active_subscriptions = 0,
        expiring_this_month = 0,
        monthly_recurring_revenue = 0,
        active_plans = 0
    } = stats;

    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    
    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.subscription-plans.index'), 
            { search: searchQuery, status: statusFilter },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleFilterChange = (e) => {
        const newStatus = e.target.value;
        setStatusFilter(newStatus);
        router.get(route('admin.subscription-plans.index'), 
            { search: searchQuery, status: newStatus },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleReset = () => {
        setSearchQuery('');
        setStatusFilter('all');
        router.get(route('admin.subscription-plans.index'));
    };

    return (
        <AdminLayout>
            <div className="min-h-screen bg-gray-100">
                <Head title="Plans d'abonnement" />

                {/* En-tête */}
                <div className="bg-white shadow">
                    <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center">
                            <h1 className="text-2xl font-bold text-gray-900">Gestion des plans d'abonnement</h1>
                            <div className="flex flex-wrap gap-3">
                                <Link
                                    href={route('admin.subscription-plans.subscribers')}
                                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                >
                                    <FontAwesomeIcon icon={faUserGroup} className="mr-2" />
                                    Abonnés
                                </Link>
                                <Link
                                    href={route('subscription.plans')}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    <FontAwesomeIcon icon={faMoneyBillWave} className="mr-2" />
                                    Voir les offres
                                </Link>
                                <Link
                                    href={route('admin.subscription-plans.create')}
                                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                                >
                                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                                    Nouveau plan
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contenu principal */}
                <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                    {/* Cartes de statistiques */}
                    <div className="grid grid-cols-1 gap-5 mb-6 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="overflow-hidden bg-white rounded-lg shadow">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 text-green-500 bg-green-100 rounded-md">
                                        <FontAwesomeIcon icon={faUsers} className="w-6 h-6" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Abonnements actifs</dt>
                                            <dd className="flex items-baseline">
                                                <div className="text-2xl font-semibold text-gray-900">{active_subscriptions}</div>
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="overflow-hidden bg-white rounded-lg shadow">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 text-yellow-500 bg-yellow-100 rounded-md">
                                        <FontAwesomeIcon icon={faClock} className="w-6 h-6" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Expirant ce mois</dt>
                                            <dd className="flex items-baseline">
                                                <div className="text-2xl font-semibold text-gray-900">{expiring_this_month}</div>
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="overflow-hidden bg-white rounded-lg shadow">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 text-blue-500 bg-blue-100 rounded-md">
                                        <FontAwesomeIcon icon={faMoneyBillWave} className="w-6 h-6" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Revenu mensuel récurrent</dt>
                                            <dd className="flex items-baseline">
                                                <div className="text-2xl font-semibold text-gray-900">
                                                    {monthly_recurring_revenue ? `${parseFloat(monthly_recurring_revenue).toLocaleString()} FCFA` : '0 FCFA'}
                                                </div>
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="overflow-hidden bg-white rounded-lg shadow">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 text-purple-500 bg-purple-100 rounded-md">
                                        <FontAwesomeIcon icon={faCalendarAlt} className="w-6 h-6" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Plans actifs</dt>
                                            <dd className="flex items-baseline">
                                                <div className="text-2xl font-semibold text-gray-900">{active_plans}</div>
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Filtres et recherche */}
                    <div className="mb-6 bg-white rounded-lg shadow">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                                <div className="flex-1 max-w-md">
                                    <form onSubmit={handleSearch} className="flex">
                                        <div className="relative flex-1">
                                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                <FontAwesomeIcon icon={faSearch} className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                className="block w-full py-2 pl-10 pr-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Rechercher des plans..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="inline-flex items-center px-4 py-2 ml-3 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            <FontAwesomeIcon icon={faSearch} className="w-4 h-4 mr-2" />
                                            Rechercher
                                        </button>
                                    </form>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                    <div className="flex items-center">
                                        <label htmlFor="status-filter" className="mr-2 text-sm font-medium text-gray-700">
                                            Statut
                                        </label>
                                        <select
                                            id="status-filter"
                                            className="block w-full py-2 pl-3 pr-10 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            value={statusFilter}
                                            onChange={handleFilterChange}
                                        >
                                            <option value="all">Tous</option>
                                            <option value="active">Actif</option>
                                            <option value="pending">En attente</option>
                                            <option value="cancelled">Annulé</option>
                                            <option value="expired">Expiré</option>
                                        </select>
                                    </div>
                                    
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Réinitialiser
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            {plans.length === 0 ? (
                                <div className="text-center">
                                    <p className="text-gray-500">Aucun plan d'abonnement n'a été créé pour le moment.</p>
                                    <div className="mt-4">
                                        <Link
                                            href={route('admin.subscription-plans.create')}
                                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700"
                                        >
                                            <FontAwesomeIcon icon={faPlus} className="w-4 h-4 mr-2" />
                                            Créer un plan
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Vue bureau - tableau responsive */}
                                    <div className="hidden lg:block">
                                        <table className="w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th scope="col" className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase w-1/5">
                                                        Plan
                                                    </th>
                                                    <th scope="col" className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase w-2/5">
                                                        Description
                                                    </th>
                                                    <th scope="col" className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase w-1/6">
                                                        Prix
                                                    </th>
                                                    <th scope="col" className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase w-1/6">
                                                        Statut
                                                    </th>
                                                    <th scope="col" className="relative px-4 py-3 w-16">
                                                        <span className="sr-only">Actions</span>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {plans.map((plan) => {
                                                    const startDate = plan.start_date ? new Date(plan.start_date).toLocaleDateString('fr-FR') : 'Non défini';
                                                    const endDate = plan.end_date ? new Date(plan.end_date).toLocaleDateString('fr-FR') : 'Non défini';
                                                    
                                                    return (
                                                    <tr key={plan.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-4">
                                                            <div className="text-sm font-medium text-gray-900">{plan.name}</div>
                                                            <div className="text-xs text-gray-500">
                                                                {plan.duration_in_months === 1 ? 'Mensuel' : `${plan.duration_in_months} mois`}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="text-sm text-gray-600 line-clamp-2">{plan.description || 'Aucune description'}</div>
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                {/* {startDate} - {endDate} */}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">{plan.price?.toLocaleString()} FCFA</div>
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                plan.is_active 
                                                                    ? 'bg-green-100 text-green-800' 
                                                                    : 'bg-red-100 text-red-800'
                                                            }`}>
                                                                {plan.is_active ? 'Actif' : 'Inactif'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 text-right whitespace-nowrap">
                                                            <Menu as="div" className="relative inline-block text-left">
                                                                <div>
                                                                    <Menu.Button className="flex items-center text-gray-400 hover:text-gray-600 focus:outline-none">
                                                                        <span className="sr-only">Ouvrir les options</span>
                                                                        <FontAwesomeIcon icon={faEllipsisVertical} className="h-5 w-5" />
                                                                    </Menu.Button>
                                                                </div>

                                                                <Transition
                                                                    as={React.Fragment}
                                                                    enter="transition ease-out duration-100"
                                                                    enterFrom="transform opacity-0 scale-95"
                                                                    enterTo="transform opacity-100 scale-100"
                                                                    leave="transition ease-in duration-75"
                                                                    leaveFrom="transform opacity-100 scale-100"
                                                                    leaveTo="transform opacity-0 scale-95"
                                                                >
                                                                    <Menu.Items className="origin-top-right absolute right-0 z-10 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                                        <div className="py-1">
                                                                            <Menu.Item>
                                                                                {({ active }) => (
                                                                                    <Link
                                                                                        href={route('admin.subscription-plans.subscribers', { plan: plan.id })}
                                                                                        className={classNames(
                                                                                            active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                                                                            'block px-4 py-2 text-sm'
                                                                                        )}
                                                                                    >
                                                                                        <FontAwesomeIcon icon={faUserGroup} className="mr-2 text-blue-600" />
                                                                                        Voir les abonnés
                                                                                    </Link>
                                                                                )}
                                                                            </Menu.Item>
                                                                            <Menu.Item>
                                                                                {({ active }) => (
                                                                                    <Link
                                                                                        href={route('admin.subscription-plans.edit', plan.id)}
                                                                                        className={classNames(
                                                                                            active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                                                                            'block px-4 py-2 text-sm'
                                                                                        )}
                                                                                    >
                                                                                        <FontAwesomeIcon icon={faEdit} className="mr-2 text-indigo-600" />
                                                                                        Modifier
                                                                                    </Link>
                                                                                )}
                                                                            </Menu.Item>
                                                                            <Menu.Item>
                                                                                {({ active }) => (
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            if (confirm('Êtes-vous sûr de vouloir supprimer ce plan ?')) {
                                                                                                router.delete(route('admin.subscription-plans.destroy', plan.id));
                                                                                            }
                                                                                        }}
                                                                                        className={classNames(
                                                                                            active ? 'bg-gray-100 text-gray-900' : 'text-red-600',
                                                                                            'w-full text-left block px-4 py-2 text-sm'
                                                                                        )}
                                                                                    >
                                                                                        <FontAwesomeIcon icon={faTrash} className="mr-2" />
                                                                                        Supprimer
                                                                                    </button>
                                                                                )}
                                                                            </Menu.Item>
                                                                        </div>
                                                                    </Menu.Items>
                                                                </Transition>
                                                            </Menu>
                                                        </td>
                                                    </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Vue mobile/tablette - cartes empilées */}
                                    <div className="lg:hidden space-y-4">
                                        {plans.map((plan) => {
                                            const startDate = plan.start_date ? new Date(plan.start_date).toLocaleDateString('fr-FR') : 'Non défini';
                                            const endDate = plan.end_date ? new Date(plan.end_date).toLocaleDateString('fr-FR') : 'Non défini';
                                            
                                            return (
                                            <div key={plan.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <h3 className="text-sm font-medium text-gray-900 truncate">{plan.name}</h3>
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                plan.is_active 
                                                                    ? 'bg-green-100 text-green-800' 
                                                                    : 'bg-red-100 text-red-800'
                                                            }`}>
                                                                {plan.is_active ? 'Actif' : 'Inactif'}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{plan.description || 'Aucune description'}</p>
                                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                                            <div>
                                                                <span className="text-gray-500">Prix:</span>
                                                                <div className="font-medium text-gray-900">{plan.price?.toLocaleString()} FCFA</div>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500">Période:</span>
                                                                <div className="text-gray-900">{plan.duration_in_months === 1 ? 'Mensuel' : `${plan.duration_in_months} mois`}</div>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500">Début:</span>
                                                                <div className="text-gray-900">{startDate}</div>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500">Fin:</span>
                                                                <div className="text-gray-900">{endDate}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                                                    <Link
                                                        href={route('admin.subscription-plans.subscribers', { plan: plan.id })}
                                                        className="inline-flex items-center px-3 py-1.5 text-sm text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                                                    >
                                                        <FontAwesomeIcon icon={faUserGroup} className="w-4 h-4 mr-1" />
                                                        Voir les abonnés
                                                    </Link>
                                                    <div className="flex space-x-2">
                                                        <Link
                                                            href={route('admin.subscription-plans.edit', plan.id)}
                                                            className="inline-flex items-center px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded"
                                                            title="Modifier"
                                                        >
                                                            <FontAwesomeIcon icon={faEdit} className="w-4 h-4 mr-1" />
                                                            Modifier
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (confirm('Êtes-vous sûr de vouloir supprimer ce plan ?')) {
                                                                    router.delete(route('admin.subscription-plans.destroy', plan.id));
                                                                }
                                                            }}
                                                            className="inline-flex items-center px-3 py-1.5 text-sm text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                                                            title="Supprimer"
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} className="w-4 h-4 mr-1" />
                                                            Supprimer
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </AdminLayout>
    );
}