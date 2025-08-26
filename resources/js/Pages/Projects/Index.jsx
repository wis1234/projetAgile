import React, { useEffect, useState } from 'react';
import { router, Link, usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { FaProjectDiagram, FaPlus, FaUser, FaUsers, FaTasks, FaEye, FaSearch, FaCalendarAlt, FaUserFriends, FaTable, FaTh, FaClock, FaChartLine, FaList } from 'react-icons/fa';

export default function Index({ projects, filters }) {
    const { flash = {} } = usePage().props;
    const [search, setSearch] = useState(filters?.search || '');
    const [notification, setNotification] = useState(flash.success || '');
    const [notificationType, setNotificationType] = useState('success');
    // État pour le mode de vue (cartes par défaut sur mobile/tablet, tableau sur desktop)
    const [viewMode, setViewMode] = useState('table');
    const [isMobile, setIsMobile] = useState(false);
    
    // Détecter si on est sur mobile/tablette au chargement
    useEffect(() => {
        const checkIfMobile = () => {
            const mobile = window.innerWidth < 1024; // lg breakpoint de Tailwind
            setIsMobile(mobile);
            if (mobile) {
                setViewMode('cards');
            } else {
                setViewMode('table');
            }
        };
        
        checkIfMobile();
        window.addEventListener('resize', checkIfMobile);
        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);

    useEffect(() => {
        if (window.Echo) {
            const channel = window.Echo.channel('projects');
            channel.listen('ProjectUpdated', (e) => {
                setNotification('Un projet a été modifié (ou ajouté/supprimé)');
                setNotificationType('success');
                router.reload({ only: ['projects'] });
            });
            return () => {
                channel.stopListening('ProjectUpdated');
            };
        }
    }, []);

    useEffect(() => {
        if (flash.success) {
            setNotification(flash.success);
            setNotificationType('success');
        }
    }, [flash.success]);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification('');
                setNotificationType('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        router.get('/projects', { search }, { preserveState: true, replace: true });
    };

    const getStatusColor = (project) => {
        // Utiliser les couleurs du backend si disponibles
        if (project.status_color) {
            return project.status_color;
        }
        
        // Utiliser le statut réel du projet pour déterminer la couleur
        const status = project.status || 'nouveau';
        const colors = {
            'nouveau': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
            'demarrage': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            'en_cours': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            'avance': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            'termine': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
            'suspendu': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        };
        return colors[status] || colors['nouveau'];
    };

    const getStatusLabel = (project) => {
        // Utiliser le libellé du backend si disponible
        if (project.status_label) {
            return project.status_label;
        }
        
        // Utiliser le statut réel du projet pour déterminer le libellé
        const status = project.status || 'nouveau';
        const labels = {
            'nouveau': 'Nouveau',
            'demarrage': 'Démarrage',
            'en_cours': 'En cours',
            'avance': 'Avancé',
            'termine': 'Terminé',
            'suspendu': 'Suspendu',
        };
        return labels[status] || 'Nouveau';
    };

    return (
        <div className="flex flex-col w-full min-h-screen bg-white dark:bg-gray-950 p-0 m-0">
            <main className="flex-1 flex flex-col w-full py-4 sm:py-6 lg:py-8 px-2 sm:px-4 lg:px-8">
                {/* Header section - Super Responsive */}
                <div className="flex flex-col space-y-4 sm:space-y-6 mb-6 sm:mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <FaProjectDiagram className="text-3xl sm:text-4xl text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight">
                                Gestion des Projets
                            </h1>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                            {/* View Mode Toggle - Responsive */}
                            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition duration-200 ${
                                        viewMode === 'table' 
                                            ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                                            : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                                    }`}
                                >
                                    <FaList className="text-xs" />
                                    <span className="hidden sm:inline">Tableau</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('cards')}
                                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition duration-200 ${
                                        viewMode === 'cards' 
                                            ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                                            : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                                    }`}
                                >
                                    <FaTh className="text-xs" />
                                    <span className="hidden sm:inline">Cartes</span>
                                </button>
                            </div>
                            
                            {/* New Project Button */}
                            <Link 
                                href="/projects/create" 
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-5 py-2 sm:py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition duration-200 hover:shadow-md whitespace-nowrap text-sm sm:text-base"
                            >
                                <FaPlus className="text-sm sm:text-lg" /> 
                                <span className="hidden sm:inline">Nouveau projet</span>
                                <span className="sm:hidden">Nouveau</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Search and Filters Section - Super Responsive */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-200 dark:border-gray-700 transition duration-200 hover:shadow-lg">
                    <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
                        <div className="lg:col-span-3">
                            <label htmlFor="search-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Recherche par nom de projet
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    id="search-input"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                                    placeholder="Rechercher un projet..."
                                />
                                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition duration-200 hover:shadow-md"
                        >
                            <FaSearch />
                            <span className="hidden sm:inline">Rechercher</span>
                        </button>
                    </form>
                </div>

                {/* Content Area - Conditional Rendering */}
                {viewMode === 'table' ? (
                    /* Table View - Mêmes effets de survol que Users/Index.jsx */
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 transition duration-200 hover:shadow-lg mb-8 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm text-gray-700 dark:text-gray-300">
                                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="p-4 text-left font-bold text-gray-800 dark:text-gray-200">Projet</th>
                                        <th className="p-4 text-left font-bold text-gray-800 dark:text-gray-200">Membres</th>
                                        <th className="p-4 text-left font-bold text-gray-800 dark:text-gray-200">Tâches</th>
                                        <th className="p-4 text-left font-bold text-gray-800 dark:text-gray-200">Date création</th>
                                        <th className="p-4 text-left font-bold text-gray-800 dark:text-gray-200">Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projects?.data?.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="text-center py-10 text-gray-500 dark:text-gray-400 text-lg">
                                                Aucun projet trouvé pour cette recherche.
                                            </td>
                                        </tr>
                                    ) : projects?.data?.map(project => (
                                        <tr 
                                            key={project.id} 
                                            className="border-b border-gray-200 dark:border-gray-700 transition duration-150 ease-in-out hover:bg-blue-50 dark:hover:bg-gray-700 group cursor-pointer hover:shadow-md"
                                            onClick={() => router.get(`/projects/${project.id}`)}
                                        >
                                            <td className="p-4 align-middle">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full border-2 border-blue-200 dark:border-blue-600 shadow-sm group-hover:border-blue-400 transition-colors duration-200 flex items-center justify-center">
                                                            <FaProjectDiagram className="text-white text-lg" />
                                                        </div>
                                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                                                            <div className="text-xs">
                                                                <FaChartLine className="text-white text-xs" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                                                            {project.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">ID: {project.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <div className="flex items-center gap-1">
                                                    <FaUserFriends className="text-gray-400 text-sm" />
                                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                                        {project.users_count || 0} membre{project.users_count !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <div className="flex items-center gap-1">
                                                    <FaTasks className="text-gray-400 text-sm" />
                                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                                        {project.tasks_count || 0} tâche{project.tasks_count !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle text-xs text-gray-400 dark:text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <FaCalendarAlt className="text-gray-400" />
                                                    {new Date(project.created_at).toLocaleDateString('fr-FR')}
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(project)}`}>
                                                    <FaChartLine className="text-xs" />
                                                    {getStatusLabel(project)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    /* Cards View - Super Responsive Grid */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                        {projects?.data?.length === 0 ? (
                            <div className="col-span-full text-center py-16">
                                <FaProjectDiagram className="mx-auto text-6xl text-gray-300 dark:text-gray-600 mb-4" />
                                <p className="text-xl text-gray-500 dark:text-gray-400">Aucun projet trouvé</p>
                                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Créez votre premier projet pour commencer</p>
                            </div>
                        ) : projects?.data?.map(project => (
                            <div
                                key={project.id}
                                className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer group"
                                onClick={() => router.get(`/projects/${project.id}`)}
                            >
                                {/* Project Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                                            <FaProjectDiagram className="text-white text-lg" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 flex items-center">
                                                <span className="truncate">{project.name}</span>
                                                {project.is_muted && (
                                                    <span className="ml-2 px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full flex-shrink-0">
                                                        Sourdine
                                                    </span>
                                                )}
                                            </h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                ID: {project.id}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* Status Badge */}
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project)} flex-shrink-0`}>
                                        <FaChartLine className="text-xs" />
                                        {getStatusLabel(project)}
                                    </span>
                                </div>

                                {/* Project Stats */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                            <FaUserFriends className="text-blue-500 text-sm" />
                                            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                {project.users_count || 0}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Membre{project.users_count !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                            <FaTasks className="text-green-500 text-sm" />
                                            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                {project.tasks_count || 0}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Tâche{project.tasks_count !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>

                                {/* Project Footer */}
                                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-600">
                                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                        <FaClock className="text-xs" />
                                        <span>Créé le {new Date(project.created_at).toLocaleDateString('fr-FR')}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination - Enhanced with Error Handling */}
                <div className="mt-6 sm:mt-8">
                    {projects?.data?.length > 0 && projects?.links?.length > 0 ? (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-gray-700 dark:text-gray-300 order-2 sm:order-1">
                                Affichage de {projects.from || 0} à {projects.to || 0} sur {projects.total || 0} résultat{projects.total !== 1 ? 's' : ''}
                            </div>
                            <div className="flex flex-wrap justify-center gap-1 sm:gap-2 order-1 sm:order-2">
                                {projects.links.map((link, index) => {
                                    // Skip if no URL (for previous/next disabled links)
                                    if (!link.url) {
                                        return (
                                            <span 
                                                key={index}
                                                className="px-3 py-1 sm:py-2 text-xs sm:text-sm rounded-md bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        );
                                    }

                                    // Handle previous/next buttons
                                    if (link.label.includes('Previous') || link.label.includes('Suivant')) {
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

                                    // Handle page numbers
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

                                    // Handle ellipsis
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
                    ) : projects?.data?.length === 0 ? (
                        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                            Aucun projet trouvé. Essayez de modifier vos critères de recherche.
                        </div>
                    ) : null}
                </div>

                {/* Notification - Responsive */}
                {notification && (
                    <div className={`fixed top-4 right-4 z-50 px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-xl text-white transition-all text-sm sm:text-base max-w-sm ${
                        notificationType === 'success' ? 'bg-green-600' : 'bg-red-600'
                    }`}>
                        {notification}
                    </div>
                )}
            </main>
        </div>
    );
}

Index.layout = page => <AdminLayout children={page} />;