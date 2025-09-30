import React, { useState, useEffect } from 'react';
import { router, Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AdminLayout from '../../Layouts/AdminLayout';
import { 
    FaUserEdit, 
    FaUsers, 
    FaArrowLeft, 
    FaProjectDiagram,
    FaUser,
    FaCrown,
    FaShieldAlt,
    FaInfoCircle,
    FaSpinner,
    FaCalendarAlt
} from 'react-icons/fa';

function Edit({ project, users = [], roles = [] }) {
    const { t } = useTranslation();
    const { errors = {}, flash = {} } = usePage().props;
    const currentMember = project.users[0];
    const [selectedUser, setSelectedUser] = useState(currentMember?.id || '');
    const [role, setRole] = useState(currentMember?.pivot?.role || '');
    const selectedUserObj = users.find(user => user.id == selectedUser) || currentMember;
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

    const handleUserChange = (e) => {
        const userId = e.target.value;
        setSelectedUser(userId);
        const user = project.users.find(u => u.id == userId);
        setRole(user?.pivot?.role || '');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        
        router.put(route('project-users.update', project.id), {
            user_id: selectedUser,
            role,
        }, {
            onSuccess: () => {
                setNotification({ type: 'success', message: t('member_updated_success') });
                setTimeout(() => {
                    router.visit(route('project-users.index'));
                }, 1500);
            },
            onError: () => {
                setSubmitting(false);
                setNotification({ type: 'error', message: t('error_updating_member') });
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
            case 'manager': return <FaCrown className="text-yellow-500" title={t('project_manager_short')} />;
            case 'member': return <FaUser className="text-blue-500" title={t('member_role_short')} />;
            default: return <FaShieldAlt className="text-gray-500" title={t('observer_short')} />;
        }
    };

    const getRoleLabel = (role) => {
        const labels = {
            member: t('member_role_short'),
            manager: t('project_manager_short'),
            observer: t('observer_short'),
        };
        return labels[role] || role;
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

            <div className="flex-1 flex flex-col w-full bg-white dark:bg-gray-900 overflow-x-hidden p-0 m-0">
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
                            <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                                <FaUserEdit className="text-white text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                                    {t('edit_member')}
                                </h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {t('project_member_edit_description')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Project Info */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm">
                                    <FaProjectDiagram className="text-white text-lg" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    {project.name}
                                </h2>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                    <FaUsers />
                                    <span>{t('members_count_plural', { count: project.users?.length || 0 })}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <FaCalendarAlt />
                                    <span>Créé le {new Intl.DateTimeFormat('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(project.created_at))}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <form onSubmit={handleSubmit} className="p-6 sm:p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                
                                {/* User Selection */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                                        <FaUser className="inline mr-2 text-green-500" />
                                        Utilisateur *
                                    </label>
                                    <select
                                        value={selectedUser}
                                        onChange={handleUserChange}
                                        className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            errors.user_id 
                                                ? 'border-red-300 dark:border-red-600' 
                                                : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                        required
                                    >
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
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            errors.role 
                                                ? 'border-red-300 dark:border-red-600' 
                                                : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                        required
                                    >
                                        <option value="">Sélectionner un rôle</option>
                                        {roles.map(roleOption => (
                                            <option key={roleOption} value={roleOption}>
                                                {getRoleLabel(roleOption)}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.role && (
                                        <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                                            <FaInfoCircle className="text-xs" />
                                            {errors.role}
                                        </p>
                                    )}
                                    {role && (
                                        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                            <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                                                {getRoleIcon(role)}
                                                <span className="font-medium">Rôle sélectionné :</span>
                                                <span>{getRoleLabel(role)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Current Assignment Info */}
                                {currentMember && (
                                    <div className="lg:col-span-2">
                                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                <FaInfoCircle className="text-blue-500" />
                                                {t('current_assignment')}
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                                                    <img 
                                                        src={currentMember.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentMember.name)}`}
                                                        alt={currentMember.name}
                                                        className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-600"
                                                    />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {currentMember.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            Utilisateur actuel
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                                                    {getRoleIcon(currentMember.pivot?.role)}
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {getRoleLabel(currentMember.pivot?.role)}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            Rôle actuel
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {/* Preview Section */}
                                {selectedUserObj && role && (
                                    <div className="lg:col-span-2 mt-4">
                                        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                <FaInfoCircle className="text-green-500" />
                                                {t('new_assignment')}
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div className="text-center">
                                                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                                        <FaProjectDiagram className="text-blue-500 text-xl mx-auto mb-2" />
                                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                            {t('project_label')}
                                                        </p>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {project.name}
                                                        </p>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400">{t('project')}</div>
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                                        <img 
                                                            src={selectedUserObj.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUserObj.name)}`}
                                                            alt={selectedUserObj.name}
                                                            className="w-8 h-8 rounded-full mx-auto mb-2 border border-gray-200 dark:border-gray-600"
                                                        />
                                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                            {t('user_label')}
                                                        </p>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {selectedUserObj?.name}
                                                        </p>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400">{t('current_user')}</div>
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                                        {getRoleIcon(role)}
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white mt-2">
                                                            {getRoleLabel(role)}
                                                        </p>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400">{t('current_role')}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Help Section */}
                            <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                                <div className="flex items-center gap-2 mb-2">
                                    <FaInfoCircle className="text-blue-500" />
                                    <h4 className="font-medium text-gray-900 dark:text-white">{t('role_help_title')}</h4>
                                </div>
                                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                    <li>• {t('role_help_manager')}</li>
                                    <li>• {t('role_help_member')}</li>
                                    <li>• {t('role_help_observer')}</li>
                                </ul>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    type="submit"
                                    disabled={submitting || !selectedUser || !role}
                                    className="flex-1 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-lg font-semibold shadow-sm flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                                >
                                    {submitting ? (
                                        <>
                                            <FaSpinner className="animate-spin" />
                                            Mise à jour...
                                        </>
                                    ) : (
                                        <>
                                            <FaUserEdit />
                                            {t('update_member')}
                                        </>
                                    )}
                                </button>
                                <Link
                                    href={route('project-users.index')}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-semibold shadow-sm flex items-center justify-center gap-2 transition-all duration-200"
                                >
                                    <FaArrowLeft />
                                    {t('cancel')}
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

Edit.layout = page => <AdminLayout children={page} />;

export default Edit;