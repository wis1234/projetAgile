import React, { useState, useEffect } from 'react';
import { router, Link, usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { 
    FaUserPlus, 
    FaUsers, 
    FaArrowLeft, 
    FaProjectDiagram,
    FaUser,
    FaCrown,
    FaShieldAlt,
    FaInfoCircle,
    FaSpinner
} from 'react-icons/fa';

export default function Create({ projects = [], users = [], roles = [] }) {
    const { errors = {}, flash = {} } = usePage().props;
    const [values, setValues] = useState({
        project_id: '',
        user_id: '',
        role: '',
    });
    const [submitting, setSubmitting] = useState(false);
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

    const handleChange = (e) => {
        setValues({ ...values, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        
        router.post(route('project-users.store'), values, {
            onSuccess: () => {
                setNotification({ type: 'success', message: 'Membre ajouté avec succès!' });
                setTimeout(() => {
                    router.visit(route('project-users.index'));
                }, 1500);
            },
            onError: () => {
                setSubmitting(false);
                setNotification({ type: 'error', message: 'Une erreur est survenue lors de l\'ajout du membre.' });
            },
            onFinish: () => {
                if (!notification || notification.type !== 'success') {
                    setSubmitting(false);
                }
            },
        });
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'manager': return <FaCrown className="text-yellow-500" />;
            case 'member': return <FaUser className="text-blue-500" />;
            default: return <FaShieldAlt className="text-gray-500" />;
        }
    };

    const getRoleLabel = (role) => {
        const labels = {
            member: 'Membre',
            manager: 'Chef de projet',
            observer: 'Observateur',
        };
        return labels[role] || role;
    };

    const selectedProject = projects.find(p => p.id == values.project_id);
    const selectedUser = users.find(u => u.id == values.user_id);

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
                <div className="flex flex-col w-full max-w-4xl mx-auto mt-14 pt-4 px-4 sm:px-6 lg:px-8">
                    
                    {/* Header */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                        <div className="flex items-center gap-4">
                            <Link 
                                href={route('project-users.index')} 
                                className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                            >
                                <FaArrowLeft className="text-lg" />
                            </Link>
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                                <FaUserPlus className="text-white text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                                    Ajouter un membre
                                </h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    Assignez un utilisateur à un projet avec un rôle spécifique
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <form onSubmit={handleSubmit} className="p-6 sm:p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                
                                {/* Project Selection */}
                                <div className="lg:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                                        <FaProjectDiagram className="inline mr-2 text-blue-500" />
                                        Projet *
                                    </label>
                                    <select
                                        name="project_id"
                                        value={values.project_id}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            errors.project_id 
                                                ? 'border-red-300 dark:border-red-600' 
                                                : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                        required
                                    >
                                        <option value="">Sélectionner un projet</option>
                                        {projects.map(project => (
                                            <option key={project.id} value={project.id}>
                                                {project.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.project_id && (
                                        <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                                            <FaInfoCircle className="text-xs" />
                                            {errors.project_id}
                                        </p>
                                    )}
                                    {selectedProject && (
                                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                            <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                                                <FaProjectDiagram />
                                                <span className="font-medium">Projet sélectionné :</span>
                                                <span>{selectedProject.name}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* User Selection */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                                        <FaUser className="inline mr-2 text-green-500" />
                                        Utilisateur *
                                    </label>
                                    <select
                                        name="user_id"
                                        value={values.user_id}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            errors.user_id 
                                                ? 'border-red-300 dark:border-red-600' 
                                                : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                        required
                                    >
                                        <option value="">Sélectionner un utilisateur</option>
                                        {users.map(user => (
                                            <option key={user.id} value={user.id}>
                                                {user.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.user_id && (
                                        <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                                            <FaInfoCircle className="text-xs" />
                                            {errors.user_id}
                                        </p>
                                    )}
                                </div>

                                {/* Role Selection */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                                        <FaCrown className="inline mr-2 text-yellow-500" />
                                        Rôle *
                                    </label>
                                    <select
                                        name="role"
                                        value={values.role}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            errors.role 
                                                ? 'border-red-300 dark:border-red-600' 
                                                : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                        required
                                    >
                                        <option value="">Sélectionner un rôle</option>
                                        {roles.map(role => (
                                            <option key={role} value={role}>
                                                {getRoleLabel(role)}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.role && (
                                        <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                                            <FaInfoCircle className="text-xs" />
                                            {errors.role}
                                        </p>
                                    )}
                                    {values.role && (
                                        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                            <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                                                {getRoleIcon(values.role)}
                                                <span className="font-medium">Rôle sélectionné :</span>
                                                <span>{getRoleLabel(values.role)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Preview Section */}
                                {selectedProject && selectedUser && values.role && (
                                    <div className="lg:col-span-2 mt-4">
                                        <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                <FaInfoCircle className="text-blue-500" />
                                                Aperçu de l'assignation
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div className="text-center">
                                                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                                        <FaProjectDiagram className="text-blue-500 text-xl mx-auto mb-2" />
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {selectedProject.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Projet</p>
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                                        <img 
                                                            src={selectedUser.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name)}`}
                                                            alt={selectedUser.name}
                                                            className="w-8 h-8 rounded-full mx-auto mb-2 border border-gray-200 dark:border-gray-600"
                                                        />
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {selectedUser.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Utilisateur</p>
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                                        {getRoleIcon(values.role)}
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white mt-2">
                                                            {getRoleLabel(values.role)}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Rôle</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Help Section */}
                            <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                    <FaInfoCircle className="text-blue-500" />
                                    Aide
                                </h4>
                                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                    <li>• <strong>Chef de projet</strong> : Peut gérer le projet et ses membres</li>
                                    <li>• <strong>Membre</strong> : Peut participer au projet et voir les tâches</li>
                                    <li>• <strong>Observateur</strong> : Peut seulement consulter le projet</li>
                                </ul>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    type="submit"
                                    disabled={submitting || !values.project_id || !values.user_id || !values.role}
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-lg font-semibold shadow-sm flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                                >
                                    {submitting ? (
                                        <>
                                            <FaSpinner className="animate-spin" />
                                            Enregistrement...
                                        </>
                                    ) : (
                                        <>
                                            <FaUserPlus />
                                            Ajouter le membre
                                        </>
                                    )}
                                </button>
                                <Link
                                    href={route('project-users.index')}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-semibold shadow-sm flex items-center justify-center gap-2 transition-all duration-200"
                                >
                                    <FaArrowLeft />
                                    Annuler
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}

Create.layout = page => <AdminLayout children={page} />;