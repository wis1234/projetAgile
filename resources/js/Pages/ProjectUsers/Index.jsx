import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { 
    FaUsers, 
    FaUserPlus, 
    FaProjectDiagram, 
    FaTable, 
    FaTh, 
    FaSearch,
    FaCrown,
    FaUserTie,
    FaUser,
    FaShieldAlt,
    FaTasks,
    FaCalendarAlt
} from 'react-icons/fa';

export default function Index({ projects = [], filters = {} }) {
    const { flash = {} } = usePage().props;
    const [viewMode, setViewMode] = useState('table');
    const [notification, setNotification] = useState(null);

    // Pagination data - assuming projects is a paginated object
    const paginationData = projects.data ? projects : { data: projects, links: [], meta: null };
    const projectsList = paginationData.data || projects;

    useEffect(() => {
        if (flash.success) {
            setNotification({ type: 'success', message: flash.success });
            const timer = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(timer);
        }
        if (flash.error) {
            setNotification({ type: 'error', message: flash.error });
            const timer = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    const getRoleIcon = (role) => {
        switch (role) {
            case 'manager': return <FaCrown className="text-yellow-500" />;
            case 'member': return <FaUser className="text-blue-500" />;
            default: return <FaShieldAlt className="text-gray-500" />;
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'manager': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'member': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    const getRoleLabel = (role) => {
        switch (role) {
            case 'manager': return 'Manager';
            case 'member': return 'Membre';
            default: return 'Autre';
        }
    };

    return (
        <div className="flex flex-col w-full min-h-screen bg-white dark:bg-gray-900 overflow-x-hidden p-0 m-0">
            {/* Notification */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transition-all duration-300 ${
                    notification.type === 'success' 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{notification.message}</span>
                        <button 
                            onClick={() => setNotification(null)}
                            className="ml-2 text-gray-500 hover:text-gray-700"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            <main className="flex-1 flex flex-col w-full bg-white dark:bg-gray-900 overflow-x-hidden p-0 m-0">
                <div className="flex flex-col w-full max-w-7xl mx-auto mt-14 pt-4 px-4 sm:px-6 lg:px-8">
                    
                    {/* Header */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                                    <FaUsers className="text-white text-xl" />
                                </div>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                                        Membres des projets
                                    </h1>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        Gérez les membres assignés aux projets
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-3">
                                {/* View Toggle */}
                                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                    <button
                                        onClick={() => setViewMode('table')}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                                            viewMode === 'table'
                                                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                                                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                    >
                                        <FaTable className="text-xs" />
                                        <span className="hidden sm:inline">Tableau</span>
                                    </button>
                                    <button
                                        onClick={() => setViewMode('cards')}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                                            viewMode === 'cards'
                                                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                                                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                    >
                                        <FaTh className="text-xs" />
                                        <span className="hidden sm:inline">Cartes</span>
                                    </button>
                                </div>

                                {/* Add Member Button */}
                                <Link 
                                    href={route('project-users.create')} 
                                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg font-semibold shadow-sm flex items-center gap-2 transition-all duration-200 transform hover:scale-105 whitespace-nowrap"
                                >
                                    <FaUserPlus className="text-sm" />
                                    <span className="hidden sm:inline">Ajouter un membre</span>
                                    <span className="sm:hidden">Ajouter</span>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {projectsList.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                    <FaUsers className="text-gray-400 text-3xl" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                    Aucun projet trouvé
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-6">
                                    Commencez par créer un projet et y assigner des membres.
                                </p>
                                <Link
                                    href={route('project-users.create')}
                                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                >
                                    <FaUserPlus />
                                    Ajouter un membre
                                </Link>
                            </div>
                        ) : (
                            <>
                                {/* Table View */}
                                {viewMode === 'table' && (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                            <thead className="bg-gray-50 dark:bg-gray-700">
                                                <tr>
                                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Projet
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Membres
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                                                        Statistiques
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                {projectsList.map(project => (
                                                    <tr
                                                        key={project.id}
                                                        className="transition duration-150 ease-in-out hover:bg-blue-50 dark:hover:bg-gray-700 group cursor-pointer hover:shadow-md"
                                                    onClick={() => router.get(route('project-users.show', project.id))}
                                                    >
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
                                                                    <FaProjectDiagram className="text-white text-sm" />
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                                        {project.name}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                        {project.users?.length || 0} membre(s)
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {project.users && project.users.length > 0 ? (
                                                                <div className="flex flex-wrap gap-2">
                                                                    {project.users.slice(0, 3).map(user => (
                                                                        <div key={user.id} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
                                                                            <img 
                                                                                src={user.profile_photo_url || (user.profile_photo_path ? `/storage/${user.profile_photo_path}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`)} 
                                                                                alt={user.name} 
                                                                                className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-600" 
                                                                            />
                                                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                                                {user.name}
                                                                            </span>
                                                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.pivot?.role)}`}>
                                                                                {getRoleIcon(user.pivot?.role)}
                                                                                {getRoleLabel(user.pivot?.role)}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                    {project.users.length > 3 && (
                                                                        <div className="flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300">
                                                                            +{project.users.length - 3}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-sm text-gray-500 dark:text-gray-400">Aucun membre</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                                                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                                                <div className="flex items-center gap-1">
                                                                    <FaTasks className="text-xs" />
                                                                    <span>{project.tasks_count || 0} tâches</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <FaCalendarAlt className="text-xs" />
                                                                    <span>{new Date(project.created_at).toLocaleDateString('fr-FR')}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Cards View */}
                                {viewMode === 'cards' && (
                                    <div className="p-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                            {projectsList.map(project => (
                                                <div
                                                    key={project.id}
                                                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer group overflow-hidden"
                                                    onClick={() => router.get(route('project-users.show', project.id))}
                                                >
                                                    {/* Card Header */}
                                                    <div className="p-6 pb-4">
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                                                                <FaProjectDiagram className="text-white text-lg" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                                                    {project.name}
                                                                </h3>
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                    {project.users?.length || 0} membre(s)
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Project Stats */}
                                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                                                                <div className="text-lg font-bold text-gray-900 dark:text-white">
                                                                    {project.tasks_count || 0}
                                                                </div>
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">Tâches</div>
                                                            </div>
                                                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                                                                <div className="text-lg font-bold text-gray-900 dark:text-white">
                                                                    {project.users?.length || 0}
                                                                </div>
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">Membres</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Members List */}
                                                    <div className="px-6 pb-6">
                                                        {project.users && project.users.length > 0 ? (
                                                            <div className="space-y-2">
                                                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                                                    Membres assignés
                                                                </h4>
                                                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                                                    {project.users.map(user => (
                                                                        <div key={user.id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                                            <img 
                                                                                src={user.profile_photo_url || (user.profile_photo_path ? `/storage/${user.profile_photo_path}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`)} 
                                                                                alt={user.name} 
                                                                                className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600" 
                                                                            />
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                                                    {user.name}
                                                                                </div>
                                                                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.pivot?.role)}`}>
                                                                                    {getRoleIcon(user.pivot?.role)}
                                                                                    {getRoleLabel(user.pivot?.role)}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-center py-4">
                                                                <div className="text-gray-400 dark:text-gray-500 text-sm">
                                                                    Aucun membre assigné
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Card Footer */}
                                                    <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                                                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                                            <span>Créé le {new Date(project.created_at).toLocaleDateString('fr-FR')}</span>
                                                            <div className="flex items-center gap-1">
                                                                <FaCalendarAlt />
                                                                <span>{new Date(project.updated_at).toLocaleDateString('fr-FR')}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Pagination */}
                    {paginationData.links && paginationData.links.length > 3 && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 px-6 py-4 mt-6">
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                {/* Pagination Info */}
                                {paginationData.meta && (
                                    <div className="text-sm text-gray-700 dark:text-gray-300">
                                        Affichage de <span className="font-semibold">{paginationData.meta.from || 0}</span> à{' '}
                                        <span className="font-semibold">{paginationData.meta.to || 0}</span> sur{' '}
                                        <span className="font-semibold">{paginationData.meta.total || 0}</span> résultats
                                    </div>
                                )}

                                {/* Pagination Links */}
                                <div className="flex items-center gap-1">
                                    {paginationData.links.map((link, index) => {
                                        if (link.url === null) {
                                            return (
                                                <span
                                                    key={index}
                                                    className="px-3 py-2 text-sm text-gray-400 dark:text-gray-600 cursor-not-allowed"
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            );
                                        }

                                        const isActive = link.active;
                                        const isPrevNext = link.label.includes('Previous') || link.label.includes('Next') || 
                                                          link.label.includes('&laquo;') || link.label.includes('&raquo;');

                                        return (
                                            <Link
                                                key={index}
                                                href={link.url}
                                                preserveState
                                                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                                    isActive
                                                        ? 'bg-blue-600 text-white shadow-sm'
                                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                                } ${isPrevNext ? 'px-2' : ''}`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

Index.layout = page => <AdminLayout children={page} />;