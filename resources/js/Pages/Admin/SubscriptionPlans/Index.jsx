import React, { useState, useRef, useEffect } from 'react';
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
    faEllipsisVertical,
    faChevronLeft,
    faChevronRight,
    faChartLine,
    faExclamationTriangle,
    faCheckCircle
} from '@fortawesome/free-solid-svg-icons';

function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
}

// Composant Menu Déroulant simple comme WhatsApp
function DropdownMenu({ isOpen, onClose, triggerRef, children }) {
    const menuRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target) && 
                triggerRef.current && !triggerRef.current.contains(event.target)) {
                onClose();
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose, triggerRef]);

    if (!isOpen) return null;

    return (
        <div
            ref={menuRef}
            className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50"
        >
            {children}
        </div>
    );
}

export default function SubscriptionPlansIndex({ 
    plans = { 
        data: [], 
        current_page: 1, 
        last_page: 1, 
        from: 0, 
        to: 0, 
        total: 0, 
        path: '', 
        links: {} 
    }, 
    stats = {
        // Statistiques principales
        total_plans: 0,
        active_plans: 0,
        inactive_plans: 0,
        
        // Statistiques des abonnements
        total_subscriptions: 0,
        active_subscriptions: 0,
        expiring_this_month: 0,
        expired_subscriptions: 0,
        
        // Statistiques financières
        monthly_recurring_revenue: 0,
        total_revenue: 0,
        average_revenue_per_user: 0,
        
        // Statistiques d'engagement
        most_popular_plan: null,
        subscription_growth_rate: 0,
        renewal_rate: 0
    }, 
    filters = {} 
}) {
    const {
        // Statistiques principales
        total_plans = 0,
        active_plans = 0,
        inactive_plans = 0,
        
        // Statistiques des abonnements
        total_subscriptions = 0,
        active_subscriptions = 0,
        expiring_this_month = 0,
        expired_subscriptions = 0,
        
        // Statistiques financières
        monthly_recurring_revenue = 0,
        total_revenue = 0,
        average_revenue_per_user = 0,
        
        // Statistiques d'engagement
        most_popular_plan = null,
        subscription_growth_rate = 0,
        renewal_rate = 0
    } = stats;

    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [openMenuId, setOpenMenuId] = useState(null);
    const buttonRefs = useRef({});
    
    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.subscription-plans.index'), 
            { search: searchQuery, status: statusFilter, page: 1 },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleFilterChange = (e) => {
        const newStatus = e.target.value;
        setStatusFilter(newStatus);
        router.get(route('admin.subscription-plans.index'), 
            { search: searchQuery, status: newStatus, page: 1 },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleReset = () => {
        setSearchQuery('');
        setStatusFilter('all');
        router.get(route('admin.subscription-plans.index'));
    };

    const toggleMenu = (planId) => {
        setOpenMenuId(openMenuId === planId ? null : planId);
    };

    const closeMenu = () => {
        setOpenMenuId(null);
    };

    const handleDelete = (planId) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce plan ?')) {
            closeMenu();
            router.delete(route('admin.subscription-plans.destroy', planId));
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatPercentage = (value) => {
        return `${(value || 0).toFixed(1)}%`;
    };

    const renderActionMenu = (plan, id) => (
        <div className="relative">
            <button
                ref={el => buttonRefs.current[id] = el}
                onClick={() => toggleMenu(id)}
                className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                aria-haspopup="true"
                aria-expanded={openMenuId === id}
            >
                <FontAwesomeIcon icon={faEllipsisVertical} className="h-4 w-4" />
            </button>

            <DropdownMenu
                isOpen={openMenuId === id}
                onClose={closeMenu}
                triggerRef={{ current: buttonRefs.current[id] }}
            >
                <Link
                    href={route('admin.subscription-plans.subscribers', { plan: plan.id })}
                    className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 border-b border-gray-100"
                    onClick={closeMenu}
                >
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <FontAwesomeIcon icon={faUserGroup} className="h-3 w-3 text-blue-600" />
                    </div>
                    <div>
                        <div className="font-medium">Voir les abonnés</div>
                        <div className="text-xs text-gray-500">Consulter la liste</div>
                    </div>
                </Link>
                
                <Link
                    href={route('admin.subscription-plans.edit', plan.id)}
                    className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 border-b border-gray-100"
                    onClick={closeMenu}
                >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                        <FontAwesomeIcon icon={faEdit} className="h-3 w-3 text-indigo-600" />
                    </div>
                    <div>
                        <div className="font-medium">Modifier</div>
                        <div className="text-xs text-gray-500">Éditer le plan</div>
                    </div>
                </Link>
                
                <button
                    onClick={() => handleDelete(plan.id)}
                    className="flex items-center w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                >
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
                        <FontAwesomeIcon icon={faTrash} className="h-3 w-3 text-red-600" />
                    </div>
                    <div>
                        <div className="font-medium">Supprimer</div>
                        <div className="text-xs text-red-500">Action irréversible</div>
                    </div>
                </button>
            </DropdownMenu>
        </div>
    );

    return (
        <AdminLayout>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Head title="Plans d'abonnement" />

                {/* En-tête */}
                <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des plans d'abonnement</h1>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                                    Gérez vos offres d'abonnement et suivez les performances
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Link
                                    href={route('admin.subscription-plans.subscribers')}
                                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors duration-200 shadow-sm"
                                >
                                    <FontAwesomeIcon icon={faUserGroup} className="mr-2 h-4 w-4" />
                                    Abonnés
                                </Link>
                                <Link
                                    href={route('subscription.plans')}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200 shadow-sm"
                                >
                                    <FontAwesomeIcon icon={faMoneyBillWave} className="mr-2 h-4 w-4" />
                                    Voir les offres
                                </Link>
                                <Link
                                    href={route('admin.subscription-plans.create')}
                                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 transition-colors duration-200 shadow-sm"
                                >
                                    <FontAwesomeIcon icon={faPlus} className="mr-2 h-4 w-4" />
                                    Nouveau plan
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contenu principal */}
                <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                    {/* Cartes de statistiques */}
                    <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Plans d'abonnement */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <FontAwesomeIcon icon={faMoneyBillWave} className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="ml-3 min-w-0">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total des plans</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                                        {total_plans > 0 ? total_plans : 'Aucun'}
                                    </p>
                                    <div className="flex items-center text-xs mt-1 space-x-1">
                                        <span className={`inline-flex items-center ${active_plans > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                            <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3 mr-1" />
                                            {active_plans} actifs
                                        </span>
                                        <span className="text-gray-300 dark:text-gray-600">•</span>
                                        <span className="text-gray-400 dark:text-gray-500">{inactive_plans} inactifs</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Abonnements actifs */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <FontAwesomeIcon icon={faUsers} className="w-5 h-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="ml-3 min-w-0">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Abonnements actifs</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                                        {active_subscriptions > 0 ? active_subscriptions : 'Aucun'}
                                    </p>
                                    <p className={`text-xs mt-1 ${subscription_growth_rate >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {subscription_growth_rate >= 0 ? '+' : ''}{formatPercentage(subscription_growth_rate)} ce mois
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Revenu mensuel */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                    <FontAwesomeIcon icon={faChartLine} className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div className="ml-3 min-w-0">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Revenu mensuel</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                                        {monthly_recurring_revenue > 0 ? formatCurrency(monthly_recurring_revenue) : 'Aucun'}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                                        Total: {formatCurrency(total_revenue)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Expirations */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                    <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div className="ml-3 min-w-0">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Expire ce mois</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                                        {expiring_this_month > 0 ? expiring_this_month : 'Aucun'}
                                    </p>
                                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                        À renouveler
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Statistiques détaillées */}
                    <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-3">
                        {/* Plan le plus populaire */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Plan le plus populaire</h3>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                                        {most_popular_plan?.name || 'Aucun plan'}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {most_popular_plan?.subscriptions_count ? `${most_popular_plan.subscriptions_count} abonnés` : 'Aucun abonné'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                                        {formatCurrency(most_popular_plan?.price || 0)}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {most_popular_plan?.duration_in_months 
                                            ? `par ${most_popular_plan.duration_in_months === 1 ? 'mois' : `${most_popular_plan.duration_in_months} mois`}`
                                            : 'Aucune durée définie'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Taux de renouvellement */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance</h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Taux de renouvellement</p>
                                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                        {formatPercentage(renewal_rate)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Revenu moyen par utilisateur</p>
                                    <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                                        {formatCurrency(average_revenue_per_user)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Vue d'ensemble */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Vue d'ensemble</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Total abonnements:</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">{total_subscriptions}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Abonnements expirés:</span>
                                    <span className="font-semibold text-red-600 dark:text-red-400">{expired_subscriptions}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Croissance mensuelle:</span>
                                    <span className={`font-semibold ${subscription_growth_rate > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {subscription_growth_rate > 0 ? '+' : ''}{formatPercentage(subscription_growth_rate)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Filtres et recherche */}
                    <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
                        <div className="p-6">
                            <div className="flex flex-col lg:flex-row gap-6">
                                <div className="flex-1">
                                    <form onSubmit={handleSearch} className="flex gap-3">
                                        <div className="relative flex-1">
                                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                <FontAwesomeIcon icon={faSearch} className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                className="block w-full py-3 pl-10 pr-4 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 focus:border-indigo-500 dark:focus:border-indigo-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                                placeholder="Rechercher des plans..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
                                        >
                                            <FontAwesomeIcon icon={faSearch} className="w-4 h-4 mr-2" />
                                            Rechercher
                                        </button>
                                    </form>
                                </div>
                                
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <label htmlFor="status-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                            Statut:
                                        </label>
                                        <select
                                            id="status-filter"
                                            className="block w-full py-3 pl-3 pr-10 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 focus:border-indigo-500 dark:focus:border-indigo-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            value={statusFilter}
                                            onChange={handleFilterChange}
                                        >
                                            <option value="all" className="bg-white dark:bg-gray-700">Tous</option>
                                            <option value="active" className="bg-white dark:bg-gray-700">Actif</option>
                                            <option value="inactive" className="bg-white dark:bg-gray-700">Inactif</option>
                                        </select>
                                    </div>
                                    
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="inline-flex items-center px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
                                    >
                                        Réinitialiser
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Tableau des plans */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                        <div className="p-6">
                            {(!plans.data || plans.data.length === 0) ? (
                                <div className="text-center py-12">
                                    <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                        <FontAwesomeIcon icon={faMoneyBillWave} className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucun plan d'abonnement</h3>
                                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                                        Commencez par créer votre premier plan d'abonnement pour proposer vos services.
                                    </p>
                                    <Link
                                        href={route('admin.subscription-plans.create')}
                                        className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
                                    >
                                        <FontAwesomeIcon icon={faPlus} className="w-4 h-4 mr-2" />
                                        Créer un plan
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Vue bureau */}
                                    <div className="hidden lg:block">
                                        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                <thead className="bg-gray-50 dark:bg-gray-700">
                                                    <tr>
                                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                            Plan
                                                        </th>
                                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                            Description
                                                        </th>
                                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                            Prix
                                                        </th>
                                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                            Statut
                                                        </th>
                                                        <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                    {plans.data.map((plan) => (
                                                        <tr key={plan.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm font-semibold text-gray-900 dark:text-white">{plan.name}</div>
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {plan.duration_in_months === 1 ? 'Mensuel' : `${plan.duration_in_months} mois`}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="text-sm text-gray-600 dark:text-gray-300 max-w-md line-clamp-2">{plan.description || 'Aucune description'}</div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(plan.price)}</div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center">
                                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                                                        plan.is_active 
                                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                                                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                                    }`}>
                                                                        {plan.is_active ? 'Actif' : 'Inactif'}
                                                                    </span>
                                                                    {plan.pending_activation && (
                                                                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                                            En attente
                                                                        </span>
                                                                    )}
                                                                    {plan.is_active && plan.will_expire_soon && (
                                                                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                                                                            Expire bientôt
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {plan.status_changed_at && (
                                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                        {plan.is_active ? 'Activé le ' : 'Désactivé le '}
                                                                        {new Date(plan.status_changed_at).toLocaleDateString('fr-FR', {
                                                                            day: '2-digit',
                                                                            month: 'short',
                                                                            year: 'numeric'
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                                {renderActionMenu(plan, `desktop-${plan.id}`)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Vue mobile */}
                                    <div className="lg:hidden space-y-4">
                                        {plans.data.map((plan) => (
                                            <div key={plan.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-md transition-shadow duration-200">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                                                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                                                            {plan.description || 'Aucune description'}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <div className="flex items-center">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                plan.is_active 
                                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                            }`}>
                                                                {plan.is_active ? 'Actif' : 'Inactif'}
                                                            </span>
                                                            {plan.pending_activation && (
                                                                <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                                    En attente
                                                                </span>
                                                            )}
                                                            {plan.is_active && plan.will_expire_soon && (
                                                                <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                                                                    Expire bientôt
                                                                </span>
                                                            )}
                                                        </div>
                                                        {plan.status_changed_at && (
                                                            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                                                {plan.is_active ? 'Depuis ' : 'Depuis '}
                                                                {new Date(plan.status_changed_at).toLocaleDateString('fr-FR', {
                                                                    day: '2-digit',
                                                                    month: 'short'
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                                    <div>
                                                        <span className="text-gray-500 dark:text-gray-400">Prix:</span>
                                                        <div className="font-semibold text-gray-900 dark:text-white">{formatCurrency(plan.price)}</div>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 dark:text-gray-400">Durée:</span>
                                                        <div className="text-gray-900 dark:text-gray-200">
                                                            {plan.duration_in_months === 1 ? 'Mensuel' : `${plan.duration_in_months} mois`}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700">
                                                    <Link
                                                        href={route('admin.subscription-plans.subscribers', { plan: plan.id })}
                                                        className="inline-flex items-center px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30 rounded-lg transition-colors duration-200"
                                                    >
                                                        <FontAwesomeIcon icon={faUserGroup} className="w-4 h-4 mr-1" />
                                                        Abonnés
                                                    </Link>
                                                    <div className="flex gap-2">
                                                        <Link
                                                            href={route('admin.subscription-plans.edit', plan.id)}
                                                            className="inline-flex items-center px-3 py-2 text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:text-indigo-300 dark:hover:bg-indigo-900/30 rounded-lg transition-colors duration-200"
                                                        >
                                                            <FontAwesomeIcon icon={faEdit} className="w-4 h-4 mr-1" />
                                                            Modifier
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDelete(plan.id)}
                                                            className="inline-flex items-center px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30 rounded-lg transition-colors duration-200"
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} className="w-4 h-4 mr-1" />
                                                            Supprimer
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {/* Pagination */}
                            {plans.data && plans.data.length > 0 && plans.total > 0 && (
                                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="text-sm text-gray-700 dark:text-gray-300">
                                        Affichage de <span className="font-semibold text-gray-900 dark:text-white">{plans.from || 0}</span> à <span className="font-semibold text-gray-900 dark:text-white">{plans.to || 0}</span> sur{' '}
                                        <span className="font-semibold text-gray-900 dark:text-white">{plans.total || 0}</span> résultats
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {plans.links?.prev ? (
                                            <Link
                                                href={plans.links.prev}
                                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 shadow-sm"
                                                preserveScroll
                                            >
                                                <FontAwesomeIcon icon={faChevronLeft} className="h-4 w-4 mr-2" />
                                                Précédent
                                            </Link>
                                        ) : (
                                            <span className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-300 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-not-allowed">
                                                <FontAwesomeIcon icon={faChevronLeft} className="h-4 w-4 mr-2" />
                                                Précédent
                                            </span>
                                        )}
                                        
                                        <span className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Page {plans.current_page} sur {plans.last_page}
                                        </span>
                                        
                                        {plans.links?.next ? (
                                            <Link
                                                href={plans.links.next}
                                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 shadow-sm"
                                                preserveScroll
                                            >
                                                Suivant
                                                <FontAwesomeIcon icon={faChevronRight} className="h-4 w-4 ml-2" />
                                            </Link>
                                        ) : (
                                            <span className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-300 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-not-allowed">
                                                Suivant
                                                <FontAwesomeIcon icon={faChevronRight} className="h-4 w-4 ml-2" />
                                            </span>
                                        )}
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