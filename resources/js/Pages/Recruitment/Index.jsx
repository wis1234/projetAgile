import React, { useEffect, useState } from 'react';
import { Head, router, Link, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    FaPlus, FaEye, FaEdit, FaTrash, FaSearch,
    FaTable, FaTh, FaCalendarAlt, FaUserFriends, FaBriefcase,
    FaMapMarkerAlt, FaClock, FaCheckCircle, FaTimesCircle
} from 'react-icons/fa';
import CountdownTimer from '@/Components/CountdownTimer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const RecruitmentIndex = ({ recruitments, filters: initialFilters = {}, canCreate, auth }) => {
    const { flash = {} } = usePage().props;
    const [search, setSearch] = useState(initialFilters.search || '');
    const [statusFilter, setStatusFilter] = useState(initialFilters.status || '');
    const [notification, setNotification] = useState(flash.success || '');
    const [viewMode, setViewMode] = useState('table');
    const [isMobile, setIsMobile] = useState(false);
    
    // Vérifier les données de pagination et les offres
    const hasPagination = recruitments?.meta?.last_page > 1;
    const hasRecruitments = recruitments?.data?.length > 0;
    
    // Vérifier si les données sont en cours de chargement
    const isLoading = typeof recruitments === 'undefined';
    
    // Définir la vue par défaut au chargement
    useEffect(() => {
        const mobile = window.innerWidth < 1024; // lg breakpoint de Tailwind
        setIsMobile(mobile);
        setViewMode('cards'); // Toujours forcer la vue cartes par défaut
        
        const handleResize = () => {
            const isMobileNow = window.innerWidth < 1024;
            setIsMobile(isMobileNow);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Gestion des notifications
    useEffect(() => {
        if (flash.success) {
            setNotification(flash.success);
            const timer = setTimeout(() => setNotification(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    // Effet pour synchroniser les états initiaux avec les filtres de l'URL
    useEffect(() => {
        if (initialFilters.search !== undefined) {
            setSearch(initialFilters.search);
        }
        if (initialFilters.status !== undefined) {
            setStatusFilter(initialFilters.status);
        }
    }, [initialFilters]);

    // Gestionnaire de soumission du formulaire de recherche
    const handleSearchSubmit = (e) => {
        if (e) {
            e.preventDefault();
        }
        
        const params = {};
        
        if (search) params.search = search;
        if (statusFilter) params.status = statusFilter;
        
        router.get(route('recruitment.index'), params, {
            preserveState: true,
            replace: true,
            only: ['recruitments', 'filters']
        });
    };

    // Gestionnaire de réinitialisation des filtres
    const handleResetFilters = () => {
        setSearch('');
        setStatusFilter('');
        router.get(route('recruitment.index'), {}, { 
            preserveState: true,
            replace: true,
            only: ['recruitments', 'filters']
        });
    };

    // Vérifier si le composant est monté (côté serveur)
    if (typeof window === 'undefined') {
        return null;
    }

    // Fonction pour obtenir la couleur du statut
    const getStatusColor = (status) => {
        const colors = {
            'draft': 'bg-gray-100 text-gray-800',
            'published': 'bg-green-100 text-green-800',
            'closed': 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    // Fonction pour obtenir le libellé du statut
    const getStatusLabel = (status) => {
        const labels = {
            'draft': 'Brouillon',
            'published': 'En cours',
            'closed': 'Clôturée',
        };
        return labels[status] || status;
    };

    // Fonction utilitaire pour formater la date
    const formatDate = (dateString, withTime = true) => {
        try {
            if (!dateString) return '';
            
            // S'assurer que la date est correctement parsée
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                console.error('Date invalide:', dateString);
                return 'Date invalide';
            }
            
            const options = {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                timeZone: 'UTC' // S'assurer que le fuseau horaire est cohérent
            };
            
            if (withTime) {
                options.hour = '2-digit';
                options.minute = '2-digit';
            }
            
            return date.toLocaleDateString('fr-FR', options);
        } catch (error) {
            console.error('Erreur lors du formatage de la date:', error);
            return 'Date invalide';
        }
    };

    // Fonction pour gérer le clic sur une ligne
    const handleRowClick = (id) => {
        router.visit(route('recruitment.show', id));
    };

    return (
        <AdminLayout>
            <Head title="Offres d'emploi" />
            
            <div className="min-h-screen bg-white py-6 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* En-tête avec titre et bouton d'ajout */}
                    <div className="md:flex md:items-center md:justify-between mb-6">
                        <div className="flex-1 min-w-0">
                            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent sm:text-4xl">
                                Offres d'emploi
                                <span className="block h-1 w-20 bg-gradient-to-r from-blue-500 to-purple-500 mt-2 rounded-full"></span>
                            </h2>
                        </div>
                        <div className="mt-4 flex md:mt-0 md:ml-4 items-center space-x-4">
                            {/* Boutons de changement de vue */}
                            <div className="flex items-center space-x-2 bg-white p-1 rounded-md border border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('table')}
                                    className={`relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                                        viewMode === 'table' 
                                            ? 'bg-blue-50 text-blue-700 border-blue-500 z-10' 
                                            : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <FaTable className="mr-2 h-4 w-4" />
                                    <span className="hidden sm:inline">Tableau</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('cards')}
                                    className={`relative inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-r ${
                                        viewMode === 'cards' 
                                            ? 'bg-blue-50 text-blue-700 border-blue-500' 
                                            : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <FaTh className="h-4 w-4" />
                                </button>
                            </div>
                            
                            {/* Bouton de création d'offre */}
                            {canCreate && (
                                <Link
                                    href={route('recruitment.create')}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 whitespace-nowrap"
                                >
                                    <FaPlus className="mr-2 h-4 w-4" />
                                    Nouvelle offre
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Notification de succès */}
                    {notification && (
                        <div className="rounded-md bg-green-50 p-4 mb-6">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <FaCheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-green-800">{notification}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Filtres et recherche */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex flex-col md:flex-row md:items-end gap-4">
                                {/* Champ de recherche */}
                                <div className="flex-1">
                                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                                        Rechercher
                                    </label>
                                    <div className="relative">
                                        <form onSubmit={handleSearchSubmit} className="flex">
                                            <div className="relative flex-1">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <FaSearch className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    name="search"
                                                    id="search"
                                                    value={search || ''}
                                                    onChange={(e) => setSearch(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
                                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-l-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                    placeholder="Rechercher par titre, description..."
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 text-sm font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                <FaSearch className="h-4 w-4 mr-2" />
                                                Rechercher
                                            </button>
                                        </form>
                                    </div>
                                </div>

                                {/* Filtre par statut */}
                                <div className="w-full md:w-48">
                                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                                        Statut
                                    </label>
                                    <select
                                        id="status"
                                        name="status"
                                        value={statusFilter || ''}
                                        onChange={(e) => {
                                            setStatusFilter(e.target.value);
                                            // Appliquer le filtre immédiatement lors du changement
                                            const params = { search };
                                            if (e.target.value) params.status = e.target.value;
                                            router.get(route('recruitment.index'), params, {
                                                preserveState: true,
                                                replace: true,
                                                only: ['recruitments', 'filters']
                                            });
                                        }}
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                    >
                                        <option value="">Tous les statuts</option>
                                        <option value="draft">Brouillon</option>
                                        <option value="published">Publiée</option>
                                        <option value="closed">Clôturée</option>
                                    </select>
                                </div>

                                {/* Bouton de réinitialisation */}
                                <div className="flex items-end">
                                    <button
                                        type="button"
                                        onClick={handleResetFilters}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Réinitialiser
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Indicateur de chargement */}
                    {isLoading && (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    )}

                    {/* Message quand il n'y a pas d'offres */}
                    {!isLoading && !hasRecruitments && (
                        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
                            <p className="text-gray-500">Aucune offre d'emploi trouvée.</p>
                        </div>
                    )}

                    {/* Vue tableau */}
                    {viewMode === 'table' && !isLoading && hasRecruitments && (
                        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Titre
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Type
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Localisation
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Statut
                                            </th>
                                            {auth?.user?.roles?.includes('admin') && (
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Candidatures
                                                </th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {recruitments.data.length > 0 ? (
                                            recruitments.data.map((recruitment) => (
                                                <tr 
                                                    key={recruitment.id} 
                                                    className="hover:bg-gray-100 cursor-pointer transition-colors duration-150"
                                                    onClick={() => handleRowClick(recruitment.id)}
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">{recruitment.title}</div>
                                                                <div className="text-sm text-gray-500 flex items-center">
                                                                    <FaCalendarAlt className="mr-1.5 h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                                                    {formatDate(recruitment.created_at)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{recruitment.type || 'Non spécifié'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <FaMapMarkerAlt className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                            <span className="text-sm text-gray-900">
                                                                {recruitment.location || 'Non spécifiée'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(recruitment.status)}`}>
                                                            {getStatusLabel(recruitment.status)}
                                                        </span>
                                                    </td>
                                                    {auth?.user?.roles?.includes('admin') && (
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            <div className="flex items-center">
                                                                <FaUserFriends className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                                {recruitment.applications_count || 0} candidature(s)
                                                            </div>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={auth?.user?.roles?.includes('admin') ? 5 : 4} className="px-6 py-4 text-center text-sm text-gray-500">
                                                    Aucune offre d'emploi trouvée
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            
                            {/* Pagination - Style similaire à Projects/Index */}
                            {recruitments?.data?.length > 0 && recruitments?.links?.length > 0 && (
                                <div className="mt-6 sm:mt-8">
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="text-sm text-gray-700 dark:text-gray-300 order-2 sm:order-1">
                                            Affichage de {recruitments.from || 0} à {recruitments.to || 0} sur {recruitments.total || 0} résultat{recruitments.total !== 1 ? 's' : ''}
                                        </div>
                                        <div className="flex flex-wrap justify-center gap-1 sm:gap-2 order-1 sm:order-2">
                                            {recruitments.links.map((link, index) => {
                                                // Gérer les liens désactivés (sans URL)
                                                if (!link.url) {
                                                    return (
                                                        <span 
                                                            key={index}
                                                            className="px-3 py-1 sm:py-2 text-xs sm:text-sm rounded-md bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                                        />
                                                    );
                                                }

                                                // Boutons Précédent/Suivant
                                                if (link.label.includes('Previous') || link.label.includes('Next')) {
                                                    return (
                                                        <Link
                                                            key={index}
                                                            href={link.url}
                                                            className={`px-3 py-1 sm:py-2 text-xs sm:text-sm rounded-md transition-colors duration-200 ${
                                                                link.active
                                                                    ? 'bg-blue-600 text-white'
                                                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                                                            }`}
                                                        >
                                                            {link.label.includes('Previous') ? 'Précédent' : 'Suivant'}
                                                        </Link>
                                                    );
                                                }

                                                if (link.label.match(/^\d+$/)) {
                                                    return (
                                                        <Link
                                                            key={index}
                                                            href={link.url}
                                                            className={`px-3 py-1 sm:py-2 text-xs sm:text-sm rounded-md transition-colors duration-200 ${
                                                                link.active
                                                                    ? 'bg-blue-600 text-white'
                                                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                                                            }`}
                                                        >
                                                            {link.label}
                                                        </Link>
                                                    );
                                                }

                                                // Points de suspension
                                                return (
                                                    <span 
                                                        key={index}
                                                        className="px-2 py-1 sm:py-2 text-gray-500"
                                                    >
                                                        ...
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Vue cartes - Par défaut */}
                    {viewMode === 'cards' && (
                        <div className="bg-white">
                            {isLoading ? (
                                <div className="flex justify-center items-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                                </div>
                            ) : hasRecruitments ? (
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {recruitments.data.map((recruitment) => (
                                        <div 
                                            key={recruitment.id}
                                            className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-blue-200"
                                            onClick={() => handleRowClick(recruitment.id)}
                                        >
                                            <div className="p-5">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-lg font-semibold text-gray-900 leading-6 mb-1 truncate">
                                                            {recruitment.title}
                                                        </h3>
                                                        <div className="flex items-center text-sm text-gray-500 mb-2">
                                                            <FaBriefcase className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                            {recruitment.type || 'Non spécifié'}
                                                        </div>
                                                    </div>
                                                    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(recruitment.status)}`}>
                                                        {getStatusLabel(recruitment.status)}
                                                    </span>
                                                </div>
                                                
                                                <div className="mt-3 space-y-2">
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <FaMapMarkerAlt className="flex-shrink-0 mr-2 h-4 w-4 text-gray-400" />
                                                        <span>{recruitment.location || 'Non spécifiée'}</span>
                                                    </div>
                                                    
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <FaCalendarAlt className="flex-shrink-0 mr-2 h-4 w-4 text-gray-400" />
                                                        <span>Créé le {formatDate(recruitment.created_at)}</span>
                                                    </div>
                                                    
                                                    {/* Compte à rebours pour les offres publiées avec date limite */}
                                                    {recruitment.status === 'published' && recruitment.deadline && (
                                                        <div className="mt-2 pt-2 border-t border-gray-100">
                                                            <div className="flex items-center text-sm text-gray-500 mb-1">
                                                                <FaClock className="flex-shrink-0 mr-2 h-4 w-4 text-blue-400" />
                                                                <span className="font-medium">Clôture : </span>
                                                                <span className="ml-1">
                                                                    {formatDate(recruitment.deadline, false)}
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                <CountdownTimer 
                                                                    deadline={recruitment.deadline}
                                                                    compact={true}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {auth?.user?.roles?.includes('admin') && (
                                                        <div className="flex items-center text-sm text-gray-500 mt-2 pt-2 border-t border-gray-100">
                                                            <FaUserFriends className="flex-shrink-0 mr-2 h-4 w-4 text-gray-400" />
                                                            <span>{recruitment.applications_count || 0} candidature{recruitment.applications_count !== 1 ? 's' : ''}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <svg
                                        className="mx-auto h-12 w-12 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1}
                                            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune offre d'emploi</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Recherchez un autre mot-clé
                                    </p>
                                    {canCreate && (
                                        <div className="mt-6">
                                            <Link
                                                href={route('recruitment.create')}
                                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                <FaPlus className="-ml-1 mr-2 h-5 w-5" />
                                                Nouvelle offre d'emploi
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {/* Pagination pour la vue cartes */}
                            {recruitments?.data?.length > 0 && recruitments?.links?.length > 0 && viewMode === 'cards' && (
                                <div className="mt-6 sm:mt-8">
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="text-sm text-gray-700 dark:text-gray-300 order-2 sm:order-1">
                                            Affichage de {recruitments.from || 0} à {recruitments.to || 0} sur {recruitments.total || 0} résultat{recruitments.total !== 1 ? 's' : ''}
                                        </div>
                                        <div className="flex flex-wrap justify-center gap-1 sm:gap-2 order-1 sm:order-2">
                                            {recruitments.links.map((link, index) => {
                                                if (!link.url) {
                                                    return (
                                                        <span 
                                                            key={index}
                                                            className="px-3 py-1 sm:py-2 text-xs sm:text-sm rounded-md bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                                        />
                                                    );
                                                }

                                                if (link.label.includes('Previous') || link.label.includes('Next')) {
                                                    return (
                                                        <Link
                                                            key={index}
                                                            href={link.url}
                                                            className={`px-3 py-1 sm:py-2 text-xs sm:text-sm rounded-md transition-colors duration-200 ${
                                                                link.active
                                                                    ? 'bg-blue-600 text-white'
                                                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                                                            }`}
                                                            preserveState
                                                            only={['recruitments', 'filters']}
                                                        >
                                                            {link.label.includes('Previous') ? 'Précédent' : 'Suivant'}
                                                        </Link>
                                                    );
                                                }

                                                if (link.label.match(/^\d+$/)) {
                                                    return (
                                                        <Link
                                                            key={index}
                                                            href={link.url}
                                                            className={`px-3 py-1 sm:py-2 text-xs sm:text-sm rounded-md transition-colors duration-200 ${
                                                                link.active
                                                                    ? 'bg-blue-600 text-white'
                                                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                                                            }`}
                                                            preserveState
                                                            only={['recruitments', 'filters']}
                                                        >
                                                            {link.label}
                                                        </Link>
                                                    );
                                                }

                                                return (
                                                    <span 
                                                        key={index}
                                                        className="px-2 py-1 sm:py-2 text-gray-500"
                                                    >
                                                        ...
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default RecruitmentIndex;
