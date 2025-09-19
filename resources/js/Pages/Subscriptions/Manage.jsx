import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    faSyncAlt, 
    faSearch, 
    faFilter, 
    faEye, 
    faEdit, 
    faTrash, 
    faPlus,
    faUsers,
    faCalendarAlt,
    faMoneyBillWave,
    faCheckCircle,
    faTimesCircle,
    faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const statusStyles = {
    active: 'bg-green-100 text-green-800',
    canceled: 'bg-yellow-100 text-yellow-800',
    expired: 'bg-red-100 text-red-800',
    pending: 'bg-blue-100 text-blue-800',
};

export default function Manage({ subscriptions }) {
    const [filters, setFilters] = useState({
        status: 'all',
        search: '',
    });

    const filteredSubscriptions = subscriptions.filter(subscription => {
        const matchesStatus = filters.status === 'all' || subscription.status === filters.status;
        const matchesSearch = subscription.user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                            subscription.plan_name.toLowerCase().includes(filters.search.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const stats = [
        { 
            name: 'Abonnements actifs', 
            value: subscriptions.filter(s => s.status === 'active').length,
            icon: faCheckCircle,
            color: 'text-green-600',
            bgColor: 'bg-green-50'
        },
        { 
            name: 'Expirant ce mois', 
            value: subscriptions.filter(s => {
                const endDate = new Date(s.ends_at);
                const today = new Date();
                const nextMonth = new Date(today);
                nextMonth.setMonth(today.getMonth() + 1);
                return s.status === 'active' && endDate > today && endDate <= nextMonth;
            }).length,
            icon: faExclamationTriangle,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50'
        },
        { 
            name: 'Revenu mensuel récurrent', 
            value: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' })
                .format(subscriptions
                    .filter(s => s.status === 'active')
                    .reduce((sum, sub) => sum + (sub.amount || 0), 0)
                ),
            icon: faMoneyBillWave,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
        },
    ];

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return format(new Date(dateString), 'PP', { locale: fr });
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            active: { label: 'Actif', style: 'bg-green-100 text-green-800' },
            canceled: { label: 'Annulé', style: 'bg-yellow-100 text-yellow-800' },
            expired: { label: 'Expiré', style: 'bg-red-100 text-red-800' },
            pending: { label: 'En attente', style: 'bg-blue-100 text-blue-800' },
        };
        
        const statusInfo = statusMap[status] || { label: status, style: 'bg-gray-100 text-gray-800' };
        
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.style}`}>
                {statusInfo.label}
            </span>
        );
    };

    return (
        <>
            <Head title="Gestion des abonnements" />
            
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Gestion des abonnements</h1>
                        <div className="flex space-x-3">
                            <Link
                                href={route('admin.subscription-plans.index')}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                                Nouveau plan
                            </Link>
                            <Link
                                href={route('subscription.plans')}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                                Nouvel abonnement
                            </Link>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                        {stats.map((stat, index) => (
                            <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
                                <div className="p-5">
                                    <div className="flex items-center">
                                        <div className={`flex-shrink-0 rounded-md p-3 ${stat.bgColor}`}>
                                            <FontAwesomeIcon icon={stat.icon} className={`h-6 w-6 ${stat.color}`} />
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">
                                                    {stat.name}
                                                </dt>
                                                <dd className="flex items-baseline">
                                                    <div className="text-2xl font-semibold text-gray-900">
                                                        {stat.value}
                                                    </div>
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Filtres */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                        <div className="px-4 py-5 sm:px-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <div className="relative rounded-md shadow-sm w-full sm:w-1/3 mb-4 sm:mb-0">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FontAwesomeIcon icon={faSearch} className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                                        placeholder="Rechercher un abonnement..."
                                        value={filters.search}
                                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    />
                                </div>
                                <div className="flex items-center">
                                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mr-2">
                                        Statut :
                                    </label>
                                    <select
                                        id="status"
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                        value={filters.status}
                                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    >
                                        <option value="all">Tous</option>
                                        <option value="active">Actif</option>
                                        <option value="pending">En attente</option>
                                        <option value="canceled">Annulé</option>
                                        <option value="expired">Expiré</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Liste des abonnements */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Utilisateur
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Plan
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Montant
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Statut
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date de début
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date de fin
                                        </th>
                                        <th scope="col" className="relative px-6 py-3">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredSubscriptions.length > 0 ? (
                                        filteredSubscriptions.map((subscription) => (
                                            <tr key={subscription.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                            <span className="text-blue-600 font-medium">
                                                                {subscription.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                                            </span>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {subscription.user?.name || 'Utilisateur inconnu'}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {subscription.user?.email || ''}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{subscription.plan_name || 'N/A'}</div>
                                                    <div className="text-sm text-gray-500">
                                                        {subscription.interval === 'year' ? 'Annuel' : 'Mensuel'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(subscription.amount || 0)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(subscription.status)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(subscription.starts_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(subscription.ends_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex space-x-2 justify-end">
                                                        <Link
                                                            href={`/subscription/${subscription.id}`}
                                                            className="text-blue-600 hover:text-blue-900"
                                                            title="Voir les détails"
                                                        >
                                                            <FontAwesomeIcon icon={faEye} />
                                                        </Link>
                                                        <Link
                                                            href={`/subscription/${subscription.id}/edit`}
                                                            className="text-yellow-600 hover:text-yellow-900 ml-3"
                                                            title="Modifier"
                                                        >
                                                            <FontAwesomeIcon icon={faEdit} />
                                                        </Link>
                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm('Êtes-vous sûr de vouloir annuler cet abonnement ?')) {
                                                                    // Implémenter la logique d'annulation
                                                                    alert('Fonctionnalité d\'annulation à implémenter');
                                                                }
                                                            }}
                                                            className="text-red-600 hover:text-red-900 ml-3"
                                                            title="Annuler l'abonnement"
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                                                Aucun abonnement trouvé
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Manage.layout = page => <AdminLayout children={page} />;
