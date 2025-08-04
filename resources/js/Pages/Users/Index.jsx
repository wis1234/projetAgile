import React, { useEffect, useState } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { Link, usePage } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import ActionButton from '../../Components/ActionButton';
import { FaUser, FaUsers, FaPlus, FaEdit, FaEye, FaProjectDiagram, FaSearch, FaEnvelope, FaCalendarAlt, FaUserShield, FaTrash, FaCrown, FaUserTie, FaTh, FaList } from 'react-icons/fa';
import Modal from '../../Components/Modal';

export default function Index({ users, filters, roles = [], auth }) {
    const { flash = {}, auth: currentAuth } = usePage().props;
    const userAuth = auth?.user || auth;
    const [search, setSearch] = useState(filters?.search || '');
    const [notification, setNotification] = useState(flash.success || '');
    const [notificationType, setNotificationType] = useState('success');
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
    const [isMobile, setIsMobile] = useState(false);
    const canAssignRole = auth && auth.email === 'ronaldoagbohou@gmail.com';
    const [roleLoading, setRoleLoading] = useState({});
    const [roleSuccess, setRoleSuccess] = useState({});
    const [roleError, setRoleError] = useState({});
    const [newRole, setNewRole] = useState('');
    const [newRoleLoading, setNewRoleLoading] = useState(false);
    const [newRoleSuccess, setNewRoleSuccess] = useState('');
    const [newRoleError, setNewRoleError] = useState('');
    const [roleToDelete, setRoleToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Détecter si on est sur mobile/tablette au chargement et au redimensionnement
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
        if (flash.success) {
            setNotification(flash.success);
            setNotificationType('success');
        }
    }, [flash.success]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        router.get('/users', { search }, { preserveState: true, replace: true });
    };

    const handleRoleChange = async (userId, newRole) => {
        setRoleLoading(prev => ({ ...prev, [userId]: true }));
        setRoleSuccess(prev => ({ ...prev, [userId]: '' }));
        setRoleError(prev => ({ ...prev, [userId]: '' }));
        try {
            const res = await fetch(`/users/${userId}/assign-role`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
                body: JSON.stringify({ role: newRole })
            });
            if (res.ok) {
                setRoleSuccess(prev => ({ ...prev, [userId]: 'Rôle mis à jour !' }));
            } else {
                const data = await res.json();
                setRoleError(prev => ({ ...prev, [userId]: data.message || 'Erreur lors de la mise à jour' }));
            }
        } catch (e) {
            setRoleError(prev => ({ ...prev, [userId]: 'Erreur lors de la mise à jour' }));
        }
        setRoleLoading(prev => ({ ...prev, [userId]: false }));
    };

    const handleCreateRole = async (e) => {
        e.preventDefault();
        setNewRoleLoading(true);
        setNewRoleSuccess('');
        setNewRoleError('');
        try {
            const res = await fetch('/roles/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
                body: JSON.stringify({ role: newRole })
            });
            if (res.ok) {
                setNewRoleSuccess('Rôle créé !');
                setNewRole('');
                setTimeout(() => window.location.reload(), 800);
            } else {
                const data = await res.json();
                setNewRoleError(data.message || 'Erreur lors de la création');
            }
        } catch (e) {
            setNewRoleError('Erreur lors de la création');
        }
        setNewRoleLoading(false);
    };

    const handleDeleteRole = async () => {
        setDeleteLoading(true);
        try {
            const res = await fetch(`/roles/${roleToDelete.id}/delete`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
            });
            if (res.ok) {
                setNotification('Rôle supprimé avec succès !');
                setNotificationType('success');
                setRoleToDelete(null);
                setTimeout(() => window.location.reload(), 800);
            } else {
                const data = await res.json();
                setNotification(data.message || 'Erreur lors de la suppression');
                setNotificationType('error');
            }
        } catch (e) {
            setNotification('Erreur lors de la suppression');
            setNotificationType('error');
        }
        setDeleteLoading(false);
    };

    const getRoleIcon = (role) => {
        switch (role?.toLowerCase()) {
            case 'admin':
            case 'administrator':
                return <FaCrown className="text-yellow-500" />;
            case 'manager':
            case 'chef de projet':
                return <FaUserTie className="text-purple-500" />;
            case 'developer':
            case 'développeur':
                return <FaUser className="text-blue-500" />;
            default:
                return <FaUserShield className="text-gray-500" />;
        }
    };

    const getRoleBadgeColor = (role) => {
        switch (role?.toLowerCase()) {
            case 'admin':
            case 'administrator':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'manager':
            case 'chef de projet':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'developer':
            case 'développeur':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <>
        <div className="flex flex-col w-full min-h-screen bg-white dark:bg-gray-950 p-0 m-0">
            <main className="flex-1 flex flex-col w-full py-8 px-4 sm:px-6 lg:px-8">
                {/* Notification */}
                {notification && (
                    <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-lg shadow-xl text-white transition-all ${notificationType === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                        {notification}
                    </div>
                )}

                {/* Header section */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <FaUsers className="text-4xl text-blue-600 dark:text-blue-400" />
                        <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight">Gestion des Membres</h1>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-3 w-full md:w-auto">
                        {/* View Toggle */}
                        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition duration-200 ${
                                    viewMode === 'table' 
                                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                                        : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                                }`}
                            >
                                <FaList className="text-xs" />
                                Tableau
                            </button>
                            <button
                                onClick={() => setViewMode('cards')}
                                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition duration-200 ${
                                    viewMode === 'cards' 
                                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                                        : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                                }`}
                            >
                                <FaTh className="text-xs" />
                                Cartes
                            </button>
                        </div>
                        {/* <Link href="/users/create" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold flex items-center gap-2 transition duration-200 hover:shadow-md whitespace-nowrap">
                            <FaPlus className="text-lg" /> Nouveau membre
                        </Link> */}
                    </div>
                </div>

                {/* Search and Filters Section */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-8 border border-gray-200 dark:border-gray-700 transition duration-200 hover:shadow-lg">
                    <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-3">
                            <label htmlFor="search-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recherche par nom ou email</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    id="search-input"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Rechercher un membre..."
                                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                                />
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>
                        <button type="submit" className="md:col-span-1 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition duration-200 hover:shadow-md">
                            <FaSearch /> Rechercher
                        </button>
                    </form>
                </div>

                {/* Table View */}
                {viewMode === 'table' && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 transition duration-200 hover:shadow-lg mb-8 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm text-gray-700 dark:text-gray-300">
                                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="p-4 text-left font-bold text-gray-800 dark:text-gray-200">Avatar</th>
                                        <th className="p-4 text-left font-bold text-gray-800 dark:text-gray-200">Nom</th>
                                        <th className="p-4 text-left font-bold text-gray-800 dark:text-gray-200">Email</th>
                                        <th className="p-4 text-left font-bold text-gray-800 dark:text-gray-200">Rôle</th>
                                        <th className="p-4 text-left font-bold text-gray-800 dark:text-gray-200">Date création</th>
                                        {canAssignRole && <th className="p-4 text-left font-bold text-gray-800 dark:text-gray-200">Gestion rôle</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {users?.data?.length === 0 ? (
                                        <tr>
                                            <td colSpan={canAssignRole ? "6" : "5"} className="text-center py-10 text-gray-500 dark:text-gray-400 text-lg">
                                                Aucun membre trouvé pour cette recherche.
                                            </td>
                                        </tr>
                                    ) : users?.data?.map(user => (
                                        <tr 
                                            key={user.id} 
                                            className="border-b border-gray-200 dark:border-gray-700 transition duration-150 ease-in-out hover:bg-blue-50 dark:hover:bg-gray-700 group cursor-pointer hover:shadow-md"
                                            onClick={() => router.get(`/users/${user.id}`)}
                                        >
                                            <td className="p-4 align-middle">
                                                <div className="relative">
                                                    <img 
                                                        src={user.profile_photo_url || (user.profile_photo_path ? `/storage/${user.profile_photo_path}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3B82F6&color=ffffff&size=64`)} 
                                                        alt={user.name} 
                                                        className="w-12 h-12 rounded-full border-2 border-blue-200 dark:border-blue-600 shadow-sm group-hover:border-blue-400 transition-colors duration-200" 
                                                    />
                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                                                        <div className="text-xs">
                                                            {getRoleIcon(user.role)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <div className="font-semibold text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                                                    {user.name}
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle text-gray-600 dark:text-gray-300">
                                                <div className="flex items-center gap-1">
                                                    <FaEnvelope className="text-xs text-gray-400" />
                                                    <span>{user.email}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(user.role)}`}>
                                                    {getRoleIcon(user.role)}
                                                    {user.role || 'Utilisateur'}
                                                </span>
                                            </td>
                                            <td className="p-4 align-middle text-xs text-gray-400 dark:text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <FaCalendarAlt className="text-gray-400" />
                                                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                                                </div>
                                            </td>
                                            {canAssignRole && (
                                                <td className="p-4 align-middle" onClick={(e) => e.stopPropagation()}>
                                                    <select
                                                        value={user.role || ''}
                                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                        disabled={roleLoading[user.id]}
                                                        className="text-xs border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                                                    >
                                                        <option value="">Sélectionner un rôle</option>
                                                        {roles.map(role => (
                                                            <option key={role.id} value={role.name}>{role.name}</option>
                                                        ))}
                                                    </select>
                                                    {roleLoading[user.id] && <p className="text-xs text-blue-600 mt-1">Mise à jour...</p>}
                                                    {roleSuccess[user.id] && <p className="text-xs text-green-600 mt-1">{roleSuccess[user.id]}</p>}
                                                    {roleError[user.id] && <p className="text-xs text-red-600 mt-1">{roleError[user.id]}</p>}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Cards View */}
                {viewMode === 'cards' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                        {users?.data?.length === 0 ? (
                            <div className="col-span-full text-center py-16">
                                <FaUsers className="mx-auto text-6xl text-gray-300 dark:text-gray-600 mb-4" />
                                <p className="text-xl text-gray-500 dark:text-gray-400">Aucun membre trouvé</p>
                            </div>
                        ) : users?.data?.map(user => (
                            <div
                                key={user.id}
                                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-xl hover:scale-105 cursor-pointer group"
                                onClick={() => router.get(`/users/${user.id}`)}
                            >
                                {/* User Avatar and Basic Info */}
                                <div className="flex flex-col items-center text-center mb-4">
                                    <div className="relative mb-4">
                                        <img 
                                            src={user.profile_photo_url || (user.profile_photo_path ? `/storage/${user.profile_photo_path}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3B82F6&color=ffffff&size=128`)} 
                                            alt={user.name} 
                                            className="w-20 h-20 rounded-full border-4 border-blue-200 dark:border-blue-600 shadow-lg group-hover:border-blue-400 transition-colors duration-200" 
                                        />
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                                            {getRoleIcon(user.role)}
                                        </div>
                                    </div>
                                    
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                                        {user.name}
                                    </h3>
                                    
                                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-3">
                                        <FaEnvelope className="text-xs" />
                                        <span className="truncate max-w-[200px]">{user.email}</span>
                                    </div>
                                </div>

                                {/* Role Badge */}
                                <div className="flex justify-center mb-4">
                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(user.role)}`}>
                                        {getRoleIcon(user.role)}
                                        {user.role || 'Utilisateur'}
                                    </span>
                                </div>

                                {/* Member Since */}
                                <div className="flex items-center justify-center gap-1 text-xs text-gray-400 dark:text-gray-500 mb-4">
                                    <FaCalendarAlt />
                                    <span>Membre depuis {new Date(user.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
                                </div>

                                {/* Role Management for Admin */}
                                {canAssignRole && (
                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                                        <select
                                            value={user.role || ''}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            disabled={roleLoading[user.id]}
                                            className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <option value="">Sélectionner un rôle</option>
                                            {roles.map(role => (
                                                <option key={role.id} value={role.name}>{role.name}</option>
                                            ))}
                                        </select>
                                        {roleLoading[user.id] && <p className="text-xs text-blue-600 mt-1">Mise à jour...</p>}
                                        {roleSuccess[user.id] && <p className="text-xs text-green-600 mt-1">{roleSuccess[user.id]}</p>}
                                        {roleError[user.id] && <p className="text-xs text-red-600 mt-1">{roleError[user.id]}</p>}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                <div className="flex justify-center gap-3 mb-8">
                    {users?.links && users.links.map((link, i) => (
                        <button
                            key={i}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition duration-200 
                                ${link.active ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-600 hover:text-blue-800 dark:hover:text-white hover:shadow-sm'}
                                ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                            disabled={!link.url}
                            onClick={() => link.url && router.get(link.url)}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>

                {/* Role Management Section for Admin */}
                {canAssignRole && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 transition duration-200 hover:shadow-lg">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                            <FaUserShield className="text-blue-600 dark:text-blue-400" />
                            Gestion des Rôles
                        </h2>
                        
                        {/* Create New Role */}
                        <form onSubmit={handleCreateRole} className="mb-6">
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value)}
                                    placeholder="Nom du nouveau rôle"
                                    className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={newRoleLoading}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200 disabled:opacity-50"
                                >
                                    {newRoleLoading ? 'Création...' : 'Créer'}
                                </button>
                            </div>
                            {newRoleSuccess && <p className="text-green-600 text-sm mt-2">{newRoleSuccess}</p>}
                            {newRoleError && <p className="text-red-600 text-sm mt-2">{newRoleError}</p>}
                        </form>

                        {/* Existing Roles */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {roles.map(role => (
                                <div key={role.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
                                    <span className="text-gray-700 dark:text-gray-300 font-medium">{role.name}</span>
                                    <button
                                        onClick={() => setRoleToDelete(role)}
                                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition duration-150 p-1 rounded hover:bg-red-100 dark:hover:bg-red-800"
                                    >
                                        <FaTrash className="text-xs" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>

        {/* Delete Role Modal */}
        <Modal show={!!roleToDelete} onClose={() => setRoleToDelete(null)} maxWidth="sm">
            <div className="p-6">
                <h2 className="text-lg font-bold mb-4 text-red-700">Confirmer la suppression</h2>
                <p className="mb-6">Voulez-vous vraiment supprimer le rôle <span className="font-semibold text-blue-700">{roleToDelete?.name}</span> ? Cette action est irréversible.</p>
                <div className="flex justify-end gap-3">
                    <button
                        className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold"
                        onClick={() => setRoleToDelete(null)}
                        disabled={deleteLoading}
                    >
                        Annuler
                    </button>
                    <button
                        className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-semibold"
                        onClick={handleDeleteRole}
                        disabled={deleteLoading}
                    >
                        {deleteLoading ? 'Suppression...' : 'Supprimer'}
                    </button>
                </div>
            </div>
        </Modal>
        </>
    );
}

Index.layout = page => <AdminLayout children={page} />;