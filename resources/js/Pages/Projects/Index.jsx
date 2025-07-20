import React, { useEffect, useState } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { Link, usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import ActionButton from '../../Components/ActionButton';
import { FaProjectDiagram, FaPlus, FaUser, FaUsers, FaTasks, FaEdit, FaEye, FaSearch, FaCalendarAlt, FaUserFriends } from 'react-icons/fa';

export default function Index({ projects, filters }) {
    const { flash = {} } = usePage().props;
    const [search, setSearch] = useState(filters?.search || '');
    const [notification, setNotification] = useState(flash.success || '');
    const [notificationType, setNotificationType] = useState('success');

    useEffect(() => {
        if (window.Echo) {
            const channel = window.Echo.channel('projects');
            channel.listen('ProjectUpdated', (e) => {
                setNotification('Un projet a été modifié (ou ajouté/supprimé)');
                setNotificationType('success');
                Inertia.reload({ only: ['projects'] });
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

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        Inertia.get('/projects', { search }, { preserveState: true, replace: true });
    };

    // Helpers pour labels et badges
    const getStatusLabel = (status) => {
        switch (status) {
            case 'todo': return 'À faire';
            case 'in_progress': return 'En cours';
            case 'done': return 'Terminée';
            default: return status;
        }
    };
    const getStatusBadge = (status) => {
        let color = 'bg-gray-200 text-gray-800';
        if (status === 'in_progress') color = 'bg-yellow-100 text-yellow-800';
        if (status === 'done') color = 'bg-green-100 text-green-800';
        if (status === 'todo') color = 'bg-blue-100 text-blue-800';
        return <span className={`px-2 py-1 rounded text-xs font-bold capitalize ${color}`}>{getStatusLabel(status)}</span>;
    };
    const getPriorityLabel = (priority) => {
        switch (priority) {
            case 'high': return 'Haute';
            case 'medium': return 'Moyenne';
            case 'low': return 'Basse';
            default: return priority;
        }
    };
    const getPriorityBadge = (priority) => {
        let color = 'bg-gray-100 text-gray-700';
        if (priority === 'high') color = 'bg-red-100 text-red-800';
        if (priority === 'medium') color = 'bg-orange-100 text-orange-800';
        if (priority === 'low') color = 'bg-blue-100 text-blue-800';
        return <span className={`px-2 py-1 rounded text-xs font-bold capitalize ${color}`}>{getPriorityLabel(priority)}</span>;
    };

    return (
        <>
            <div className="flex flex-col w-full h-screen bg-white dark:bg-gray-900 overflow-x-hidden rounded-none shadow-none p-0 m-0">
                {/* Contenu principal */}
                <main className="flex-1 flex flex-col w-full bg-white dark:bg-gray-900 overflow-x-hidden overflow-y-auto p-0 m-0" style={{ height: 'calc(100vh - 4rem)' }}>
                    <div className="flex flex-col h-full w-full max-w-7xl mx-auto mt-14 pt-4 bg-white dark:bg-gray-900">
                        {/* Header section */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                            <div className="flex items-center gap-3">
                                <FaProjectDiagram className="text-3xl text-blue-600" />
                                <h1 className="text-3xl font-extrabold text-blue-700 dark:text-blue-200 tracking-tight">Projets</h1>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Rechercher un projet..."
                                        className="border px-3 py-2 rounded w-full md:w-64 mb-0 focus:ring-2 focus:ring-blue-400"
                                    />
                                    <button type="submit" className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded shadow font-semibold">
                                        <FaSearch />
                                    </button>
                                </form>
                                <Link href="/projects/create" className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded font-semibold shadow whitespace-nowrap">
                                    <FaPlus /> Créer
                                </Link>
                            </div>
                        </div>

                        {/* Tableau projets */}
                        <div className="overflow-x-auto rounded-lg shadow bg-white dark:bg-gray-800 mb-8">
                            <table className="min-w-full text-sm">
                                <thead className="sticky top-0 z-10 bg-gradient-to-r from-blue-100 to-blue-300 dark:from-blue-900 dark:to-blue-700 shadow">
                                    <tr>
                                        <th className="p-3 text-left font-bold">Projet</th>
                                        <th className="p-3 text-left font-bold">Description</th>
                                        <th className="p-3 text-left font-bold">Membres</th>
                                        <th className="p-3 text-left font-bold">Tâches</th>
                                        <th className="p-3 text-left font-bold">Date création</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projects.data.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="text-center py-8 text-gray-400 dark:text-gray-500 text-lg font-semibold">
                                                Aucun projet trouvé pour cette recherche.
                                            </td>
                                        </tr>
                                    ) : projects.data.map(project => (
                                        <tr 
                                            key={project.id} 
                                            className="hover:bg-blue-50 dark:hover:bg-blue-900 transition group cursor-pointer"
                                            onClick={() => window.location.href = `/projects/${project.id}`}
                                            tabIndex={0}
                                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') window.location.href = `/projects/${project.id}`; }}
                                        >
                                            <td className="p-3 align-middle">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                                        <FaProjectDiagram className="text-blue-600 dark:text-blue-200" />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-blue-800 dark:text-blue-200">{project.name}</div>
                                                        <div className="text-xs text-gray-500">{project.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3 align-middle text-gray-600 dark:text-gray-300">
                                                <div className="max-w-xs truncate" title={project.description}>
                                                    {project.description || 'Aucune description'}
                                                </div>
                                            </td>
                                            <td className="p-3 align-middle">
                                                <div className="flex items-center gap-1">
                                                    <FaUserFriends className="text-gray-400 text-sm" />
                                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                                        {project.users_count || 0} membre{project.users_count !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-3 align-middle">
                                                <div className="flex items-center gap-1">
                                                    <FaTasks className="text-gray-400 text-sm" />
                                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                                        {project.tasks_count || 0} tâche{project.tasks_count !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-3 align-middle text-xs text-gray-400">
                                                <div className="flex items-center gap-1">
                                                    <FaCalendarAlt className="text-gray-400" />
                                                    {new Date(project.created_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex justify-center gap-2 mb-8">
                            {projects.links && projects.links.map((link, i) => (
                                <button
                                    key={i}
                                    className={`btn btn-sm rounded-full px-4 py-2 font-semibold shadow ${link.active ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-blue-700 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-800'}`}
                                    disabled={!link.url}
                                    onClick={() => link.url && Inertia.get(link.url)}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                </main>
            </div>

            {/* Notification */}
            {notification && (
                <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded shadow-lg text-white transition-all ${notificationType === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {notification}
                </div>
            )}
        </>
    );
}

Index.layout = page => <AdminLayout children={page} />; 