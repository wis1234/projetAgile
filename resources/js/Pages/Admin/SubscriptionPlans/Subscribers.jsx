import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faSearch,
    faUserCheck,
    faUserClock,
    faUserXmark,
    faEllipsisVertical,
    faCheckCircle,
    faTimesCircle,
    faEnvelope,
    faCalendarAlt,
    faArrowLeft,
    faClock,
    faExclamationTriangle,
    faCheck
} from '@fortawesome/free-solid-svg-icons';

function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
}

function ConfirmationModal({ isOpen, onClose, onConfirm, title, message }) {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                <FontAwesomeIcon icon={faExclamationTriangle} className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    {title}
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">
                                        {message}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={onConfirm}
                        >
                            Confirmer
                        </button>
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={onClose}
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

// Composant Popover personnalisé qui se positionne par rapport au document
function CustomPopover({ isOpen, onClose, triggerRef, children }) {
    const popoverRef = useRef(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (!isOpen || !triggerRef.current) return;

        const updatePosition = () => {
            const triggerRect = triggerRef.current.getBoundingClientRect();
            const scrollY = window.scrollY;
            const scrollX = window.scrollX;
            
            // Position par défaut : en bas à droite du bouton
            let top = triggerRect.bottom + scrollY + 8;
            let left = triggerRect.right + scrollX - 200; // 200px est la largeur approximative du menu

            // Ajustements si le menu dépasse de l'écran
            const popoverWidth = 200;
            const popoverHeight = 150; // Hauteur approximative

            // Ajustement horizontal
            if (left < scrollX + 10) {
                left = scrollX + 10;
            } else if (left + popoverWidth > window.innerWidth + scrollX - 10) {
                left = triggerRect.left + scrollX;
            }

            // Ajustement vertical
            if (top + popoverHeight > window.innerHeight + scrollY - 10) {
                top = triggerRect.top + scrollY - popoverHeight - 8;
            }

            setPosition({ top, left });
        };

        updatePosition();
        window.addEventListener('scroll', updatePosition);
        window.addEventListener('resize', updatePosition);

        return () => {
            window.removeEventListener('scroll', updatePosition);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen, triggerRef]);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target) && 
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

    return createPortal(
        <div
            ref={popoverRef}
            className="fixed z-50 w-52 bg-white rounded-md shadow-lg border border-gray-200 py-1"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
            }}
        >
            {children}
        </div>,
        document.body
    );
}

function SubscriptionSubscribers({ subscriptions = { data: [] }, filters = {} }) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [showModal, setShowModal] = useState(false);
    const [selectedSubscription, setSelectedSubscription] = useState(null);
    const [newStatus, setNewStatus] = useState('');
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');
    const [openPopoverId, setOpenPopoverId] = useState(null);
    
    // Refs pour les boutons des menus
    const buttonRefs = useRef({});

    const handleSearch = (e) => {
        e.preventDefault();
        const url = new URL(window.location.href);
        const path = url.pathname;
        
        router.get(path, 
            { 
                search: searchQuery, 
                status: statusFilter,
                page: 1
            },
            { 
                preserveState: true, 
                preserveScroll: true,
                replace: true
            }
        );
    };

    const handleFilterChange = (e) => {
        const newStatus = e.target.value;
        setStatusFilter(newStatus);
        router.get(route('admin.subscription-plans.subscribers'), 
            { search: searchQuery, status: newStatus },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleReset = () => {
        setSearchQuery('');
        setStatusFilter('all');
        router.get(route('admin.subscription-plans.subscribers'), {}, {
            preserveScroll: true,
            replace: true
        });
    };

    const togglePopover = (subscriptionId) => {
        setOpenPopoverId(openPopoverId === subscriptionId ? null : subscriptionId);
    };

    const closePopover = () => {
        setOpenPopoverId(null);
    };
    
    const handleStatusChange = (subscriptionId, status) => {
        setSelectedSubscription(subscriptionId);
        setNewStatus(status);
        setOpenPopoverId(null);
        
        const statusMessages = {
            active: 'activer',
            pending: 'mettre en attente',
            cancelled: 'annuler',
            expired: 'marquer comme expiré'
        };
        
        setModalTitle('Confirmer le changement de statut');
        setModalMessage(`Êtes-vous sûr de vouloir ${statusMessages[status] || 'modifier le statut de'} cet abonnement ?`);
        setShowModal(true);
    };
    
    const confirmStatusChange = () => {
        if (!selectedSubscription || !newStatus) {
            setShowModal(false);
            return;
        }
        
        setShowModal(false);
        
        router.put(
            route('admin.subscriptions.update-status', selectedSubscription), 
            { status: newStatus },
            {
                onSuccess: () => {
                    setSelectedSubscription(null);
                    setNewStatus('');
                },
                onError: (errors) => {
                    console.error('Erreur lors de la mise à jour du statut:', errors);
                },
                onFinish: () => {
                    router.reload({ only: ['subscriptions'] });
                }
            }
        );
    };

    const getStatusBadge = (status) => {
        const statusClasses = {
            active: 'bg-green-100 text-green-800',
            pending: 'bg-yellow-100 text-yellow-800',
            cancelled: 'bg-red-100 text-red-800',
            expired: 'bg-gray-100 text-gray-800'
        };
        
        const statusLabels = {
            active: 'Actif',
            pending: 'En attente',
            cancelled: 'Annulé',
            expired: 'Expiré'
        };
        
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
                {status === 'active' && <FontAwesomeIcon icon={faCheckCircle} className="mr-1.5 h-3 w-3" />}
                {status === 'pending' && <FontAwesomeIcon icon={faClock} className="mr-1.5 h-3 w-3" />}
                {status === 'cancelled' && <FontAwesomeIcon icon={faTimesCircle} className="mr-1.5 h-3 w-3" />}
                {statusLabels[status] || status}
            </span>
        );
    };

    const renderActionButton = (subscription, id) => (
        <div className="relative">
            <button
                ref={el => buttonRefs.current[id] = el}
                onClick={() => togglePopover(id)}
                className="flex items-center text-gray-400 hover:text-gray-600 focus:outline-none p-1"
                aria-haspopup="true"
                aria-expanded={openPopoverId === id}
            >
                <span className="sr-only">Ouvrir les options</span>
                <FontAwesomeIcon icon={faEllipsisVertical} className="h-5 w-5" />
            </button>

            <CustomPopover
                isOpen={openPopoverId === id}
                onClose={closePopover}
                triggerRef={{ current: buttonRefs.current[id] }}
            >
                {subscription.status !== 'active' && (
                    <button
                        onClick={() => handleStatusChange(subscription.id, 'active')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                        <FontAwesomeIcon icon={faUserCheck} className="mr-3 h-4 w-4 text-green-600" />
                        Activer l'abonnement
                    </button>
                )}
                {subscription.status !== 'pending' && (
                    <button
                        onClick={() => handleStatusChange(subscription.id, 'pending')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                        <FontAwesomeIcon icon={faUserClock} className="mr-3 h-4 w-4 text-yellow-600" />
                        Mettre en attente
                    </button>
                )}
                {subscription.status !== 'cancelled' && (
                    <button
                        onClick={() => handleStatusChange(subscription.id, 'cancelled')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                        <FontAwesomeIcon icon={faUserXmark} className="mr-3 h-4 w-4 text-red-600" />
                        Annuler l'abonnement
                    </button>
                )}
                <div className="border-t border-gray-100"></div>
                <a
                    href={`mailto:${subscription.user?.email}`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    onClick={closePopover}
                >
                    <FontAwesomeIcon icon={faEnvelope} className="mr-3 h-4 w-4 text-blue-600" />
                    Envoyer un email
                </a>
            </CustomPopover>
        </div>
    );

    return (
        <AdminLayout>
            <div className="min-h-screen bg-gray-100">
                <Head title="Abonnés aux plans" />

                {/* En-tête */}
                <div className="bg-white shadow">
                    <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center">
                                <Link 
                                    href={route('admin.subscription-plans.index')}
                                    className="mr-4 text-gray-500 hover:text-gray-700"
                                >
                                    <FontAwesomeIcon icon={faArrowLeft} className="h-5 w-5" />
                                </Link>
                                <h1 className="text-2xl font-bold text-gray-900">Gestion des abonnés</h1>
                            </div>
                            <div className="mt-4 sm:mt-0">
                                <Link
                                    href={route('admin.subscription-plans.index')}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                                    Retour aux plans
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contenu principal */}
                <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
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
                                                placeholder="Rechercher des abonnés..."
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
                    
                    <div className="bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            {(!subscriptions.data || subscriptions.data.length === 0) ? (
                                <div className="text-center py-8">
                                    <FontAwesomeIcon icon={faUserXmark} className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun abonné trouvé</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Aucun utilisateur n'est abonné pour le moment.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Vue bureau - tableau */}
                                    <div className="hidden lg:block">
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
                                                            Période
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Statut
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Date d'expiration
                                                        </th>
                                                        <th scope="col" className="relative px-6 py-3">
                                                            <span className="sr-only">Actions</span>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {subscriptions.data && subscriptions.data.map((subscription) => (
                                                        <tr key={subscription.id} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center">
                                                                    <div className="flex-shrink-0 h-10 w-10">
                                                                        {subscription.user?.profile_photo_url ? (
                                                                            <img 
                                                                                className="h-10 w-10 rounded-full" 
                                                                                src={subscription.user.profile_photo_url} 
                                                                                alt={subscription.user.name}
                                                                            />
                                                                        ) : (
                                                                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                                                <span className="text-indigo-600 font-medium">
                                                                                    {subscription.user?.name?.charAt(0) || 'U'}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="ml-4">
                                                                        <div className="text-sm font-medium text-gray-900">
                                                                            {subscription.user?.name || 'Utilisateur inconnu'}
                                                                        </div>
                                                                        <div className="text-sm text-gray-500 truncate max-w-[200px]" title={subscription.user?.email || ''}>
                                                                            {subscription.user?.email || ''}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {subscription.plan?.name || 'Plan inconnu'}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {subscription.plan?.price?.toLocaleString() || '0'} FCFA
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm text-gray-900">
                                                                    {subscription.plan?.duration_in_months === 1 
                                                                        ? 'Mensuel' 
                                                                        : `${subscription.plan?.duration_in_months} mois`}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                {getStatusBadge(subscription.status)}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {subscription.ends_at 
                                                                    ? new Date(subscription.ends_at).toLocaleDateString('fr-FR')
                                                                    : 'Non défini'}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                {renderActionButton(subscription, `desktop-${subscription.id}`)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Vue mobile/tablette - cartes empilées */}
                                    <div className="lg:hidden space-y-4">
                                        {subscriptions.data && subscriptions.data.map((subscription) => (
                                            <div key={subscription.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                                <div className="flex items-start space-x-3">
                                                    <div className="flex-shrink-0">
                                                        {subscription.user?.profile_photo_url ? (
                                                            <img 
                                                                className="h-12 w-12 rounded-full" 
                                                                src={subscription.user.profile_photo_url} 
                                                                alt={subscription.user.name}
                                                            />
                                                        ) : (
                                                            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                                                                <span className="text-indigo-600 font-medium text-lg">
                                                                    {subscription.user?.name?.charAt(0) || 'U'}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-sm font-medium text-gray-900 truncate">
                                                            {subscription.user?.name || 'Utilisateur inconnu'}
                                                        </h3>
                                                        <div className="text-sm text-gray-500 truncate max-w-[200px]" title={subscription.user?.email || ''}>
                                                            {subscription.user?.email || ''}
                                                        </div>
                                                        
                                                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                                                            <div>
                                                                <span className="text-gray-500">Plan:</span>
                                                                <p className="font-medium text-gray-900">
                                                                    {subscription.plan?.name || 'Plan inconnu'}
                                                                </p>
                                                                <p className="text-gray-500">
                                                                    {subscription.plan?.price?.toLocaleString() || '0'} FCFA • {subscription.plan?.duration_in_months === 1 ? 'Mensuel' : `${subscription.plan?.duration_in_months} mois`}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500">Statut:</span>
                                                                <div className="mt-1">
                                                                    {getStatusBadge(subscription.status)}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500">Début:</span>
                                                                <p className="text-gray-900">
                                                                    {subscription.starts_at 
                                                                        ? new Date(subscription.starts_at).toLocaleDateString('fr-FR')
                                                                        : 'Non défini'}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500">Expire le:</span>
                                                                <p className="text-gray-900">
                                                                    {subscription.ends_at 
                                                                        ? new Date(subscription.ends_at).toLocaleDateString('fr-FR')
                                                                        : 'Non défini'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="mt-4 pt-4 border-t border-gray-100">
                                                    <div className="flex justify-between items-center">
                                                        <a
                                                            href={`mailto:${subscription.user?.email}`}
                                                            className="inline-flex items-center px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                                        >
                                                            <FontAwesomeIcon icon={faEnvelope} className="mr-1.5 h-4 w-4" />
                                                            Email
                                                        </a>
                                                        
                                                        {renderActionButton(subscription, `mobile-${subscription.id}`)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {/* Pagination */}
                            {subscriptions.data && subscriptions.data.length > 0 && subscriptions.meta && (
                                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between">
                                    <div className="text-sm text-gray-700 mb-2 sm:mb-0">
                                        Affichage de <span className="font-medium">{subscriptions.meta.from || 0}</span> à <span className="font-medium">{subscriptions.meta.to || 0}</span> sur{' '}
                                        <span className="font-medium">{subscriptions.meta.total || 0}</span> résultats
                                    </div>
                                    <div className="flex space-x-2">
                                        {subscriptions.links?.prev ? (
                                            <Link
                                                href={subscriptions.links.prev}
                                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                                preserveScroll
                                            >
                                                Précédent
                                            </Link>
                                        ) : (
                                            <span className="inline-flex items-center px-3 py-1.5 border border-gray-200 text-sm font-medium rounded-md text-gray-300 bg-gray-50 cursor-not-allowed">
                                                Précédent
                                            </span>
                                        )}
                                        
                                        {subscriptions.links?.next ? (
                                            <Link
                                                href={subscriptions.links.next}
                                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                                preserveScroll
                                            >
                                                Suivant
                                            </Link>
                                        ) : (
                                            <span className="inline-flex items-center px-3 py-1.5 border border-gray-200 text-sm font-medium rounded-md text-gray-300 bg-gray-50 cursor-not-allowed">
                                                Suivant
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
            
            <ConfirmationModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onConfirm={confirmStatusChange}
                title={modalTitle}
                message={modalMessage}
            />
        </AdminLayout>
    );
}

export default SubscriptionSubscribers;