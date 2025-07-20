import React, { useEffect, useState } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { Link, usePage } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import ActionButton from '../../Components/ActionButton';
import { FaUser, FaUsers, FaPlus, FaEdit, FaEye, FaProjectDiagram, FaSearch } from 'react-icons/fa';
import Modal from '../../Components/Modal';

export default function Index({ users, filters, roles = [], auth }) {
    // Correction : on récupère bien l'utilisateur connecté
    const { flash = {}, auth: currentAuth } = usePage().props;
    const userAuth = auth?.user || auth;
    const [search, setSearch] = useState(filters?.search || '');
    const [notification, setNotification] = useState(flash.success || '');
    const [notificationType, setNotificationType] = useState('success');
    // Suppression de selectedUserId, selectedUser, loadingDetail
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
        if (!roleToDelete) return;
        setDeleteLoading(true);
        try {
            await fetch(`/roles/${roleToDelete.id}/delete`, {
                method: 'DELETE',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
            });
            setRoleToDelete(null);
            window.location.reload();
        } catch (e) {
            setDeleteLoading(false);
        }
    };

    return (
        <>
        <div className="flex flex-col w-full h-screen bg-white dark:bg-gray-900 overflow-x-hidden rounded-none shadow-none p-0 m-0">
            {/* Contenu principal */}
            <main className="flex-1 flex flex-col w-full bg-white dark:bg-gray-900 overflow-x-hidden overflow-y-auto p-0 m-0" style={{ height: 'calc(100vh - 4rem)' }}>
                <div className="flex flex-col md:flex-row gap-8 h-full w-full max-w-5xl mx-auto mt-14 pt-4 bg-white dark:bg-gray-900 rounded-xl shadow-lg">
                    {/* Bloc rôles à droite sur desktop, en dessous sur mobile */}
                    <aside className="w-full md:w-1/3 order-2 md:order-1 flex-shrink-0">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6 md:mb-0">
                            <h2 className="text-xl font-bold text-blue-700 dark:text-blue-200 mb-2 flex items-center gap-2"><FaUsers /> Gestion des rôles</h2>
                            <ul className="mb-4">
                                {roles.map(role => (
                                    <li key={role.id} className="flex items-center justify-between py-2 px-3 bg-blue-50 dark:bg-blue-900 rounded mb-2 shadow-sm">
                                        <span className="font-semibold text-blue-800 dark:text-blue-200 text-sm">{role.name}</span>
                                        {canAssignRole && !['admin','user'].includes(role.name) && (
                                            <button
                                                className="text-red-600 hover:text-red-800 text-xs font-bold"
                                                title="Supprimer le rôle"
                                                onClick={() => setRoleToDelete(role)}
                                            >Supprimer</button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            {canAssignRole && (
                                <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded shadow flex flex-col gap-2">
                                    <h3 className="text-base font-bold text-blue-700 dark:text-blue-200">Créer un nouveau rôle</h3>
                                    <form onSubmit={handleCreateRole} className="flex gap-2 items-center mt-2">
                                        <input
                                            type="text"
                                            value={newRole}
                                            onChange={e => setNewRole(e.target.value)}
                                            placeholder="Nouveau rôle (ex: coach)"
                                            className="border rounded p-2 text-sm w-full"
                                            required
                                            minLength={2}
                                            maxLength={50}
                                        />
                                        <button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded font-semibold" disabled={newRoleLoading}>{newRoleLoading ? 'Création...' : 'Créer'}</button>
                                    </form>
                                    {newRoleSuccess && <span className="text-green-600 text-xs ml-2">{newRoleSuccess}</span>}
                                    {newRoleError && <span className="text-red-600 text-xs ml-2">{newRoleError}</span>}
                                </div>
                            )}
                        </div>
                    </aside>
                    {/* Bloc utilisateurs */}
                    <main className="flex-1 order-1 md:order-2 flex flex-col w-full">
                        {/* Header section */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <FaUsers className="text-3xl text-blue-600" />
                                <h1 className="text-3xl font-extrabold text-blue-700 dark:text-blue-200 tracking-tight">Utilisateurs</h1>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Rechercher..."
                                        className="border px-3 py-2 rounded w-full md:w-64 mb-0 focus:ring-2 focus:ring-blue-400"
                                    />
                                    <button type="submit" className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded shadow font-semibold">
                                        <FaSearch />
                                    </button>
                                </form>
                                {auth && auth.role === 'admin' && (
                                    <Link href="/users/create" className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded font-semibold shadow whitespace-nowrap">
                                        <FaPlus /> Créer
                                    </Link>
                                )}
                            </div>
                        </div>
                        {/* Tableau utilisateurs */}
                        <div className="overflow-x-auto rounded-lg shadow bg-white dark:bg-gray-800">
                            <table className="min-w-full text-sm">
                                <thead className="sticky top-0 z-10 bg-gradient-to-r from-blue-100 to-blue-300 dark:from-blue-900 dark:to-blue-700 shadow">
                                    <tr>
                                        <th className="p-3 text-left font-bold">Avatar</th>
                                        <th className="p-3 text-left font-bold">Nom</th>
                                        <th className="p-3 text-left font-bold">Email</th>
                                        <th className="p-3 text-left font-bold">Rôle</th>
                                        <th className="p-3 text-left font-bold">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.data.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="text-center py-8 text-gray-400 dark:text-gray-500 text-lg font-semibold">
                                                Aucun utilisateur trouvé pour cette recherche.
                                            </td>
                                        </tr>
                                    ) : users.data.map(user => (
                                        <tr key={user.id} className="hover:bg-blue-50 dark:hover:bg-blue-900 cursor-pointer transition group"
                                            onClick={() => router.get(`/users/${user.id}`)}
                                            tabIndex={0}
                                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') router.get(`/users/${user.id}`); }}
                                        >
                                            <td className="p-3 align-middle">
                                                <img src={user.profile_photo_url || (user.profile_photo_path ? `/storage/${user.profile_photo_path}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`)} alt={user.name} className="w-10 h-10 rounded-full border-2 border-blue-200 shadow-sm group-hover:scale-105 transition-transform" />
                                            </td>
                                            <td className="p-3 align-middle font-semibold text-blue-800 dark:text-blue-200">{user.name}</td>
                                            <td className="p-3 align-middle text-gray-600 dark:text-gray-300">{user.email}</td>
                                            <td className="p-3 align-middle"><span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-2 py-1 rounded text-xs font-medium">{user.role}</span></td>
                                            <td className="p-3 align-middle text-xs text-gray-400">{new Date(user.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination */}
                        <div className="mt-6 flex justify-center gap-2">
                            {users.links && users.links.map((link, i) => (
                                <button
                                    key={i}
                                    className={`btn btn-sm rounded-full px-4 py-2 font-semibold shadow ${link.active ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-blue-700 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-800'}`}
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url)}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </main>
                </div>
            </main>
        </div>
        <Modal show={!!roleToDelete} onClose={() => setRoleToDelete(null)} maxWidth="sm">
            <div className="p-6">
                <h2 className="text-lg font-bold mb-4 text-red-700">Confirmer la suppression</h2>
                <p className="mb-6">Voulez-vous vraiment supprimer le rôle <span className="font-semibold text-blue-700">{roleToDelete?.name}</span> ? Cette action est irréversible.</p>
                <div className="flex justify-end gap-3">
                    <button
                        className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold"
                        onClick={() => setRoleToDelete(null)}
                        disabled={deleteLoading}
                    >Annuler</button>
                    <button
                        className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-semibold"
                        onClick={handleDeleteRole}
                        disabled={deleteLoading}
                    >{deleteLoading ? 'Suppression...' : 'Supprimer'}</button>
                </div>
            </div>
        </Modal>
        </>
    );
}

Index.layout = page => <AdminLayout children={page} />;