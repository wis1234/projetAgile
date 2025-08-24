import React, { useState, useEffect, useMemo } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import MuteNotificationModal from '../../Components/MuteNotificationModal';
import { 
    FaToggleOn,
    FaToggleOff,
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
    FaInfoCircle,
    FaExclamationTriangle,
    FaBell,
    FaBellSlash
} from 'react-icons/fa';

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
                created_at: user.pivot.created_at,
                is_muted: !!user.pivot.is_muted
            } : null,
            created_at: user.created_at
        }));
    }
    
    // Keep creation date
    cleanProject.created_at = project.created_at;
    cleanProject.updated_at = project.updated_at;
    
    return cleanProject;
};

export default function Show({ project: initialProject, memberStats = [], auth, canManageMembers = false }) {
    const [isMuting, setIsMuting] = useState({});
    const [showMuteNotification, setShowMuteNotification] = useState(false);
    const [currentUserMuted, setCurrentUserMuted] = useState(false);
    const [managerName, setManagerName] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState({
        show: false,
        userId: null,
        isMuted: false,
        message: ''
    });
    
    const { flash = {} } = usePage().props;
    const [notification, setNotification] = useState(null);
    
    // Sanitize project data and merge with member stats
    const [project, setProject] = useState(() => sanitizeProjectData(initialProject));
    useMemo(() => {
        const sanitized = sanitizeProjectData(initialProject);
        if (!sanitized?.users) return sanitized;
        
        // Find current user in project members
        const currentUser = sanitized.users.find(user => user.id === auth.user.id);
        if (currentUser) {
            setCurrentUserMuted(!!currentUser.pivot?.is_muted);
            
            // Find manager for notification
            const manager = sanitized.users.find(u => u.pivot?.role === 'manager');
            if (manager) {
                setManagerName(manager.name);
            }
        }
        
        // Merge member stats with users
        return {
            ...sanitized,
            users: sanitized.users.map(user => ({
                ...user,
                tasks_count: memberStats[user.id]?.total_tasks || 0,
                completed_tasks_count: memberStats[user.id]?.completed_tasks || 0
            }))
        };
    }, [initialProject, memberStats, auth.user.id]);
    
    const handleToggleMute = (userId, currentStatus, userName) => {
        setShowConfirmModal({
            show: true,
            userId,
            userName,
            isMuted: !currentStatus, // Inverser pour montrer le prochain état
            message: !currentStatus 
                ? `Êtes-vous sûr de vouloir mettre en sourdine ${userName} ?`
                : `Êtes-vous sûr de vouloir réactiver les notifications pour ${userName} ?`
        });
    };

    const confirmToggleMute = async () => {
        const { userId, isMuted } = showConfirmModal;
        if (!userId) return;

        setIsMuting(prev => ({ ...prev, [userId]: true }));
        setShowConfirmModal(prev => ({ ...prev, show: false }));
        
        // Mettre à jour l'état local immédiatement pour un retour visuel instantané
        setProject(prev => {
            const updatedUsers = prev.users.map(user => 
                user.id === userId 
                    ? { 
                        ...user, 
                        pivot: { 
                            ...user.pivot, 
                            is_muted: isMuted 
                        } 
                    } 
                    : user
            );
            
            // Mettre à jour également currentUserMuted si c'est l'utilisateur actuel
            if (parseInt(userId) === auth.user.id) {
                setCurrentUserMuted(isMuted);
            }
            
            return {
                ...prev,
                users: updatedUsers
            };
        });
        
        try {
            const response = await fetch(route('project-users.toggle-mute', {
                project: project.id,
                user: userId
            }), {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ _method: 'POST' })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                // Mettre à jour l'état local avec la réponse du serveur
                setProject(prev => ({
                    ...prev,
                    users: prev.users.map(user => 
                        user.id === userId 
                            ? { 
                                ...user, 
                                pivot: { 
                                    ...user.pivot,
                                    is_muted: data.is_muted 
                                } 
                            } 
                            : user
                    )
                }));
                
                // Mettre à jour l'état de l'utilisateur actuel si nécessaire
                if (parseInt(userId) === auth.user.id) {
                    setCurrentUserMuted(data.is_muted);
                }
                
                // Afficher la notification
                setNotification({
                    type: 'success',
                    message: data.is_muted 
                        ? 'Membre mis en sourdine avec succès' 
                        : 'Membre réactivé avec succès'
                });
            } else {
                throw new Error(data.message || 'Une erreur est survenue lors de la mise à jour du statut');
            }
        } catch (error) {
            console.error('Toggle mute error:', error);
            setNotification({
                type: 'error',
                message: error.message || 'Une erreur est survenue lors de la mise à jour du statut de sourdine'
            });
        } finally {
            setIsMuting(prev => ({ ...prev, [userId]: false }));
        }
    };
    
    // Show mute notification when component mounts if user is muted
    useEffect(() => {
        if (currentUserMuted) {
            setShowMuteNotification(true);
        }
    }, [currentUserMuted]);

    const ConfirmModal = () => (
        <div className={`fixed inset-0 z-50 overflow-y-auto ${showConfirmModal.show ? 'block' : 'hidden'}`}>
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 sm:mx-0 sm:h-10 sm:w-10">
                                <FaExclamationTriangle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                                    Confirmation requise
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500 dark:text-gray-300">
                                        {showConfirmModal.message}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            onClick={confirmToggleMute}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Confirmer
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowConfirmModal(prev => ({ ...prev, show: false }))}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-600 dark:text-white dark:border-gray-500"
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
    

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

    const getRoleLabel = (role) => {
        switch (role) {
            case 'admin': return 'Administrateur';
            case 'manager': return 'Chef de projet';
            case 'member': return 'Membre';
            case 'observer': return 'Observateur';
            default: return 'Membre';
        }
    };
    
    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin': return <FaShieldAlt className="w-3 h-3" />;
            case 'manager': return <FaCrown className="w-3 h-3" />;
            default: return <FaUser className="w-3 h-3" />;
        }
    };
    
    const getRoleColor = (role) => {
        switch (role) {
            case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
            case 'manager': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
            case 'member': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        }
    };

    return (
        <div className={`flex flex-col w-full min-h-screen bg-white dark:bg-gray-900 overflow-x-hidden p-0 m-0 transition-opacity duration-300 ${currentUserMuted ? 'opacity-75' : 'opacity-100'}`}>
            {/* Mute Notification Modal */}
            <MuteNotificationModal 
                isOpen={showMuteNotification}
                onClose={() => setShowMuteNotification(false)}
                managerName={managerName}
            />
            <ConfirmModal />
            {/* Notification */}
            {notification && (
                <div 
                    className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transition-all duration-300 ${
                        notification.type === 'success' 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-red-100 text-red-800 border border-red-200'
                    }`}
                    onAnimationEnd={() => {
                        const timer = setTimeout(() => setNotification(null), 5000);
                        return () => clearTimeout(timer);
                    }}
                >
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
                                    <Link 
                                        href={route('projects.show', project.id)} 
                                        className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {project.name}
                                    </Link>
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
                                            {canManageMembers && user.pivot?.role !== 'manager' && (
                                                <div className="flex items-center gap-2 ml-12 mt-1">
                                                    <span className="text-sm text-gray-600 dark:text-gray-300">Sourdine</span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleToggleMute(user.id, user.pivot?.is_muted, user.name || 'ce membre');
                                                        }}
                                                        disabled={isMuting[user.id]}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                                            user.pivot?.is_muted 
                                                                ? 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500'
                                                                : 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700'
                                                        } ${isMuting[user.id] ? 'opacity-75' : ''}`}
                                                        title={user.pivot?.is_muted ? 'Réactiver les notifications' : 'Mettre en sourdine'}
                                                    >
                                                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                                                            user.pivot?.is_muted 
                                                                ? 'translate-x-0.5' 
                                                                : 'translate-x-6'
                                                        }`}>
                                                            {isMuting[user.id] && (
                                                                <span className="absolute inset-0 flex items-center justify-center">
                                                                    <span className="animate-spin">⟳</span>
                                                                </span>
                                                            )}
                                                        </span>
                                                    </button>
                                                </div>
                                            )}
                                            <div className="flex-shrink-0">
                                                <img 
                                                    className="h-12 w-12 rounded-full" 
                                                    src={user.profile_photo_url} 
                                                    alt={user.name || 'User'} 
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=0D8ABC&color=fff`;
                                                    }}
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                    {user.name || 'Utilisateur sans nom'}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.pivot?.role)}`}>
                                                            {getRoleIcon(user.pivot?.role)}
                                                            <span>{getRoleLabel(user.pivot?.role)}</span>
                                                        </div>
                                                        {user.pivot?.is_muted && (
                                                            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-100">
                                                                <FaBellSlash className="w-3 h-3" />
                                                                <span>Vous êtes en sourdine</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            
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