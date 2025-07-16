import React, { useEffect, useState } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { Link, usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import ActionButton from '../../Components/ActionButton';
import { FaUser, FaUsers, FaPlus, FaEdit, FaEye, FaProjectDiagram, FaSearch } from 'react-icons/fa';

export default function Index({ users, filters }) {
    const { flash = {} } = usePage().props;
    const [search, setSearch] = useState(filters?.search || '');
    const [notification, setNotification] = useState(flash.success || '');
    const [notificationType, setNotificationType] = useState('success');
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    useEffect(() => {
        if (flash.success) {
            setNotification(flash.success);
            setNotificationType('success');
        }
    }, [flash.success]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        Inertia.get('/users', { search }, { preserveState: true, replace: true });
    };

    const handleSelectUser = async (userId) => {
        setSelectedUserId(userId);
        setLoadingDetail(true);
        try {
            const res = await fetch(`/api/users/${userId}`);
            const data = await res.json();
            setSelectedUser(data);
        } catch (e) {
            setSelectedUser(null);
        }
        setLoadingDetail(false);
    };

    return (
        <div className="flex h-[80vh] bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
            {/* Colonne membres */}
            <section className={`w-full md:w-[400px] border-r bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-900 dark:to-gray-900 flex flex-col ${selectedUserId ? 'hidden md:flex' : ''}`}>
                <div className="flex flex-col md:flex-row md:justify-between md:items-center p-4 gap-2 md:gap-0 border-b sticky top-0 z-20 bg-white dark:bg-gray-900">
                    <h1 className="text-3xl font-extrabold flex items-center gap-3 text-blue-700 dark:text-blue-200 tracking-tight drop-shadow"><FaUsers /> Membres</h1>
                    <Link href="/users/create" className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-semibold shadow flex items-center gap-2 transition"><FaPlus /> Nouvel utilisateur</Link>
                </div>
                <div className="p-4">
                    <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 mb-4">
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Rechercher..."
                            className="border px-3 py-2 rounded w-full mb-0 focus:ring-2 focus:ring-blue-400"
                        />
                        <button type="submit" className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded shadow font-semibold">
                            <FaSearch />
                        </button>
                    </form>
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {users.data.map(user => (
                            <li key={user.id} className={`py-3 px-2 flex items-center gap-3 hover:bg-blue-100 dark:hover:bg-blue-900 rounded cursor-pointer transition ${selectedUserId === user.id ? 'bg-blue-200 dark:bg-blue-800' : ''}`}
                                onClick={() => handleSelectUser(user.id)}
                            >
                                <img src={user.profile_photo_url || (user.profile_photo_path ? `/storage/${user.profile_photo_path}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`)} alt={user.name} className="w-8 h-8 rounded-full border-2 border-blue-200" />
                                <div className="flex flex-col">
                                    <span className="font-semibold text-blue-800 dark:text-blue-200">{user.name}</span>
                                    <span className="text-sm text-gray-500">{user.email}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="mt-auto flex justify-center p-4">
                    {users.links && users.links.map((link, i) => (
                        <button
                            key={i}
                            className={`btn btn-sm mx-1 ${link.active ? 'btn-primary' : 'btn-ghost'}`}
                            disabled={!link.url}
                            onClick={() => link.url && Inertia.get(link.url)}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            </section>
            {/* Fiche membre */}
            <section className={`flex-1 bg-white dark:bg-gray-900 ${selectedUserId ? 'flex flex-col' : 'hidden md:flex items-center justify-center'}`}>
                {notification && (
                    <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded shadow-lg text-white transition-all ${notificationType === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{notification}</div>
                )}
                {loadingDetail && (
                    <div className="flex-1 flex items-center justify-center text-gray-400 text-lg">Chargement...</div>
                )}
                {!loadingDetail && selectedUser && (
                    <div className="p-8 max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded shadow h-full overflow-y-auto">
                        <div className="flex items-center gap-4 mb-6">
                            <img src={selectedUser.profile_photo_url || (selectedUser.profile_photo_path ? `/storage/${selectedUser.profile_photo_path}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name)}`)} alt={selectedUser.name} className="w-16 h-16 rounded-full border-4 border-blue-200 shadow" />
                            <div>
                                <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-200 flex items-center gap-2"><FaUser /> {selectedUser.name}</h1>
                                <div className="text-gray-500 dark:text-gray-400">{selectedUser.email}</div>
                            </div>
                        </div>
                        <div className="mb-6">
                            <div className="mb-2"><span className="font-semibold">Projets :</span> {selectedUser.projects && selectedUser.projects.length > 0 ? (
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {selectedUser.projects.map(project => (
                                        <Link href={`/projects/${project.id}`} key={project.id} className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-2 py-1 rounded text-xs font-medium hover:underline"><FaProjectDiagram /> {project.name}</Link>
                                    ))}
                                </div>
                            ) : (
                                <span className="text-gray-400">Aucun projet</span>
                            )}
                            </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                            <Link href={route('users.edit', selectedUser.id)} className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-5 py-2 rounded font-semibold flex items-center gap-2"><FaEdit /> Éditer</Link>
                            <button onClick={() => { setSelectedUserId(null); setSelectedUser(null); }} className="bg-gray-100 hover:bg-blue-100 text-blue-700 px-5 py-2 rounded font-semibold flex items-center gap-2"><FaUsers /> Retour à la liste</button>
                        </div>
                    </div>
                )}
                {!loadingDetail && !selectedUser && (
                    <div className="text-gray-400 text-lg flex-1 flex items-center justify-center">Sélectionnez un membre pour voir le détail</div>
                )}
            </section>
        </div>
    );
}

Index.layout = page => <AdminLayout children={page} />;