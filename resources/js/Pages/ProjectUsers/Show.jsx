import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { 
    FaUsers, 
    FaUserEdit, 
    FaArrowLeft, 
    FaProjectDiagram,
    FaUser,
    FaCrown,
    FaShieldAlt,
    FaCalendarAlt,
    FaTasks,
    FaEye,
    FaEnvelope,
    FaInfoCircle
} from 'react-icons/fa';

export default function Show({ project }) {
    const { flash = {} } = usePage().props;
    const [notification, setNotification] = useState(null);

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
            case 'manager': return 'Chef de projet';
            case 'member': return 'Membre';
            case 'observer': return 'Observateur';
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
                <div className="flex flex-col w-full max-w-6xl mx-auto mt-14 pt-4 px-4 sm:px-6 lg:px-8">
                    
                    {/* Header */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                        <div className="flex items-center gap-4">
                            <Link 
                                href={route('project-users.index')} 
                                className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                            >
                                <FaArrowLeft className="text-lg" />
                            </Link>
                            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                                <FaEye className="text-white text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                                    Détails du projet
                                </h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    Consultez les membres et les informations du projet "{project.name}"
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Project Overview */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm">
                                <FaProjectDiagram className="text-white text-2xl" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {project.name}
                                </h2>
                                <div className="flex items-center gap-6 mt-2 text-sm text-gray-600 dark:text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <FaUsers />
                                        <span>{project.users?.length || 0} membre(s)</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <FaTasks />
                                        <span>{project.tasks_count || 0} tâche(s)</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <FaCalendarAlt />
                                        <span>Créé le {new Date(project.created_at).toLocaleDateString('fr-FR')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Project Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center border border-blue-200 dark:border-blue-800">
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {project.users?.length || 0}
                                </div>
                                <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Membres</div>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center border border-green-200 dark:border-green-800">
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {project.tasks_count || 0}
                                </div>
                                <div className="text-sm text-green-600 dark:text-green-400 font-medium">Tâches</div>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center border border-purple-200 dark:border-purple-800">
                                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    {project.users?.filter(u => u.pivot?.role === 'manager').length || 0}
                                </div>
                                <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Managers</div>
                            </div>
                        </div>
                    </div>

                    {/* Members Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <FaUsers className="text-blue-500" />
                                Membres du projet ({project.users?.length || 0})
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Liste des utilisateurs assignés à ce projet avec leurs rôles
                            </p>
                        </div>

                        <div className="p-6">
                            {project.users && project.users.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {project.users.map(user => (
                                        <div key={user.id} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-600">
                                            <div className="flex items-center gap-3 mb-3">
                                                <img 
                                                    src={user.profile_photo_url || (user.profile_photo_path ? `/storage/${user.profile_photo_path}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`)} 
                                                    alt={user.name} 
                                                    className="w-12 h-12 rounded-full border-2 border-gray-300 dark:border-gray-600 shadow-sm" 
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                                                        {user.name}
                                                    </h4>
                                                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                                        <FaEnvelope className="text-xs" />
                                                        <span className="truncate">{user.email}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center justify-between">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user.pivot?.role)}`}>
                                                    {getRoleIcon(user.pivot?.role)}
                                                    {getRoleLabel(user.pivot?.role)}
                                                </div>
                                                
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    Ajouté le {new Date(user.pivot?.created_at || user.created_at).toLocaleDateString('fr-FR')}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                        <FaUsers className="text-gray-400 text-2xl" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                        Aucun membre assigné
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                                        Ce projet n'a pas encore de membres assignés.
                                    </p>
                                    <Link
                                        href={route('project-users.create')}
                                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                    >
                                        <FaUsers />
                                        Ajouter un membre
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Help Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <FaInfoCircle className="text-blue-500" />
                            Rôles et permissions
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                <FaCrown className="text-yellow-500 mt-1" />
                                <div>
                                    <h5 className="font-medium text-yellow-800 dark:text-yellow-200">Chef de projet</h5>
                                    <p className="text-sm text-yellow-700 dark:text-yellow-300">Peut gérer le projet et ses membres</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <FaUser className="text-blue-500 mt-1" />
                                <div>
                                    <h5 className="font-medium text-blue-800 dark:text-blue-200">Membre</h5>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">Peut participer au projet et voir les tâches</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                                <FaShieldAlt className="text-gray-500 mt-1" />
                                <div>
                                    <h5 className="font-medium text-gray-800 dark:text-gray-200">Observateur</h5>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">Peut seulement consulter le projet</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link 
                                href={route('project-users.edit', project.id)}
                                className="flex-1 sm:flex-none bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-6 py-3 rounded-lg font-semibold shadow-sm flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-105"
                            >
                                <FaUserEdit />
                                Modifier les membres
                            </Link>
                            <Link 
                                href={route('project-users.create')}
                                className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-semibold shadow-sm flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-105"
                            >
                                <FaUsers />
                                Ajouter un membre
                            </Link>
                            <Link 
                                href={route('project-users.index')}
                                className="flex-1 sm:flex-none bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-semibold shadow-sm flex items-center justify-center gap-2 transition-all duration-200"
                            >
                                <FaArrowLeft />
                                Retour à la liste
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

Show.layout = page => <AdminLayout children={page} />;