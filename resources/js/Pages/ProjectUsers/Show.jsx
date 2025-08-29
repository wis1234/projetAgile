import React, { useState, useEffect, useMemo } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
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
    FaInfoCircle,
    FaVolumeMute,
    FaVolumeUp
} from 'react-icons/fa';
import { toast } from 'react-toastify';

// Helper function to sanitize project data
const sanitizeProjectData = (project) => {
    if (!project) return null;
    
    const cleanProject = { ...project };
    
    // Sanitize users array if it exists
    if (cleanProject.users) {
        cleanProject.users = cleanProject.users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email || '',
            profile_photo_url: user.profile_photo_url,
            pivot: user.pivot ? { 
                role: user.pivot.role,
                is_muted: user.pivot.is_muted || false,
                created_at: user.pivot.created_at
            } : null,
            created_at: user.created_at
        }));
    }
    
    // Keep creation date
    cleanProject.created_at = project.created_at;
    cleanProject.updated_at = project.updated_at;
    
    return cleanProject;
};

export default function Show({ project: initialProject, auth }) {
    // Sanitize project data
    const [project, setProject] = useState(() => sanitizeProjectData(initialProject));
    const { flash = {} } = usePage().props;
    
    // Mettre à jour le projet si les props changent
    useEffect(() => {
        setProject(sanitizeProjectData(initialProject));
    }, [initialProject]);
    
    // Fonction pour basculer le statut mute d'un utilisateur
    const toggleMuteUser = async (userId) => {
        try {
            const response = await axios.post(route('project-users.toggle-mute', [project.id, userId]), {}, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            if (response.data.success) {
                // Mettre à jour l'état local avec la réponse du serveur
                setProject(prevProject => ({
                    ...prevProject,
                    users: prevProject.users.map(user => 
                        user.id === userId 
                            ? {
                                ...user,
                                pivot: {
                                    ...user.pivot,
                                    is_muted: response.data.is_muted
                                }
                            }
                            : user
                    )
                }));
                
                toast.success(response.data.message, {
                    position: 'top-right',
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
            }
        } catch (error) {
            console.error('Erreur lors du changement de statut mute:', error);
            toast.error('Une erreur est survenue lors de la mise à jour du statut.', {
                position: 'top-right',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        }
    };
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

    if (!project) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Projet non trouvé</h1>
                        <Link 
                            href={route('project-users.index')}
                            className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            <FaArrowLeft className="mr-2" /> Retour à la liste
                        </Link>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    const getRoleIcon = (role) => {
        switch (role) {
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
                                    Gestion des membres du projet
                                </h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    Consultez les informations des membres du projet "{project.name}"
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
                                    {project ? (
                                        <Link 
                                            href={route('projects.show', project.id)}
                                            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {project.name}
                                        </Link>
                                    ) : (
                                        <span className="text-gray-400">Projet non trouvé</span>
                                    )}
                                </h2>
                                <div className="flex items-center gap-6 mt-2 text-sm text-gray-600 dark:text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <FaUsers />
                                        <span>{project?.users?.length || 0} membre(s)</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <FaTasks />
                                        <span>{project.tasks_count || 0} tâche(s)</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <FaCalendarAlt />
                                        <span>Créé le {new Date(project.created_at).toLocaleDateString('fr-FR', {
                                            day: '2-digit',
                                            month: 'long',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}</span>
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
                                    {project.tasks_count ?? project.tasks?.length ?? 0}
                                </div>
                                <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                                    Tâches
                                    {project.tasks_by_status && (
                                        <div className="text-xs mt-1">
                                            {Object.entries(project.tasks_by_status).map(([status, count]) => (
                                                count > 0 && (
                                                    <span key={status} className="inline-block bg-white dark:bg-gray-700 rounded-full px-2 py-0.5 text-xs font-medium mr-1 mb-1">
                                                        {count} {status.replace('_', ' ')}
                                                    </span>
                                                )
                                            ))}
                                        </div>
                                    )}
                                </div>
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
                                        <div key={user.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700">
                                            <div className="flex items-start gap-4">
                                                <div className="relative flex-shrink-0">
                                                    <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center overflow-hidden border-2 border-white dark:border-gray-700">
                                                        {user.profile_photo_url ? (
                                                            <img 
                                                                src={user.profile_photo_url}
                                                                alt={user.name}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=random`;
                                                                }}
                                                            />
                                                        ) : (
                                                            <span className="text-gray-600 dark:text-gray-300 font-medium text-xl">
                                                                {(user.name || 'U').charAt(0).toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {user.pivot?.is_muted && (
                                                        <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1">
                                                            <FaVolumeMute className="text-xs" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className={`text-base font-semibold ${user.pivot?.is_muted ? 'opacity-50' : ''} ${user.id === auth.user.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                                                            {user.name}
                                                        </h4>
                                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.pivot?.role)}`}>
                                                            {user.pivot?.role !== 'manager' && getRoleIcon(user.pivot?.role)}
                                                            {getRoleLabel(user.pivot?.role)}
                                                        </div>
                                                    </div>
                                                    <div className="mt-1 relative group">
                                                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[180px]" title={user.email || ''}>
                                                            {user.email || 'Email non disponible'}
                                                        </p>
                                                        {user.email && user.email.length > 25 && (
                                                            <div className="absolute z-10 invisible group-hover:visible bg-gray-800 text-white text-xs rounded py-1 px-2 bottom-full left-1/2 transform -translate-x-1/2 mb-1 whitespace-nowrap">
                                                                {user.email}
                                                                <div className="absolute w-2 h-2 bg-gray-800 transform rotate-45 -bottom-1 left-1/2 -ml-1"></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                        <FaCalendarAlt className="inline mr-1" />
                                                        Membre depuis {user.pivot?.created_at ? new Date(user.pivot.created_at).toLocaleDateString('fr-FR', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        }) : 'Date inconnue'}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {auth.user.id !== user.id && user.pivot?.role !== 'manager' && user.pivot?.role !== 'admin' && (
                                                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-right">
                                                    <button
                                                        onClick={() => toggleMuteUser(user.id)}
                                                        className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ${user.pivot?.is_muted 
                                                            ? 'text-green-700 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50' 
                                                            : 'text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}
                                                        title={user.pivot?.is_muted ? 'Activer les notifications' : 'Mettre en sourdine'}
                                                    >
                                                        {user.pivot?.is_muted ? (
                                                            <>
                                                                <FaVolumeUp className="text-xs" />
                                                                <span>Activer</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FaVolumeMute className="text-xs" />
                                                                <span>Muet</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center p-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Aucun membre n'a été ajouté à ce projet.
                                    </p>
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