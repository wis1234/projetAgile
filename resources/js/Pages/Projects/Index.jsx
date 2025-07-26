import React, { useEffect, useState } from 'react';
import { router, Link, usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import ActionButton from '../../Components/ActionButton';
import { FaProjectDiagram, FaPlus, FaUser, FaUsers, FaTasks, FaEdit, FaEye, FaSearch, FaCalendarAlt, FaUserFriends, FaTrash } from 'react-icons/fa';

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
                router.reload({ only: ['projects'] });
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
        router.get('/projects', { search }, { preserveState: true, replace: true });
    };

    const handleDelete = (id) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.')) {
            router.delete(`/projects/${id}`);
        }
    };

    return (
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
                        <FaProjectDiagram className="text-4xl text-blue-600 dark:text-blue-400" />
                        <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight">Projets</h1>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-3 w-full md:w-auto">
                        <Link href="/projects/create" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold flex items-center gap-2 transition duration-200 hover:shadow-md whitespace-nowrap">
                            <FaPlus className="text-lg" /> Nouveau projet
                        </Link>
                    </div>
                </div>

                {/* Search and Filters Section */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-8 border border-gray-200 dark:border-gray-700 transition duration-200 hover:shadow-lg">
                    <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-3">
                            <label htmlFor="search-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recherche par nom</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    id="search-input"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Rechercher un projet..."
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200"
                                />
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>
                        <button type="submit" className="md:col-span-1 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition duration-200 hover:shadow-md">
                            <FaSearch /> Appliquer
                        </button>
                    </form>
                </div>

                {/* Tableau projets */}
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition duration-200 hover:shadow-lg mb-8">
                    <table className="min-w-full text-sm text-gray-700 dark:text-gray-300">
                        <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="p-4 text-left font-bold text-gray-800 dark:text-gray-200">Projet</th>
                                <th className="p-4 text-left font-bold text-gray-800 dark:text-gray-200">Description</th>
                                <th className="p-4 text-left font-bold text-gray-800 dark:text-gray-200">Membres</th>
                                <th className="p-4 text-left font-bold text-gray-800 dark:text-gray-200">Tâches</th>
                                <th className="p-4 text-left font-bold text-gray-800 dark:text-gray-200">Date création</th>
                                <th className="p-4 text-left font-bold text-gray-800 dark:text-gray-200">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.data.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-10 text-gray-500 dark:text-gray-400 text-lg">
                                        Aucun projet trouvé pour cette recherche.
                                    </td>
                                </tr>
                            ) : projects.data.map(project => (
                                <tr 
                                    key={project.id} 
                                    className="border-b border-gray-200 dark:border-gray-700 transition duration-150 ease-in-out hover:bg-blue-50 dark:hover:bg-gray-700 group hover:shadow-md"
                                >
                                    <td className="p-4 align-middle">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                                <FaProjectDiagram className="text-blue-600 dark:text-blue-200 text-lg" />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-blue-800 dark:text-blue-200">{project.name}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">ID: {project.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle text-gray-600 dark:text-gray-300">
                                        <div className="max-w-xs truncate" title={project.description}>
                                            {project.description || <span className="italic text-gray-400">Aucune description</span>}
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle">
                                        <div className="flex items-center gap-1">
                                            <FaUserFriends className="text-gray-400 text-sm" />
                                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                                {project.users_count || 0} membre{project.users_count !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle">
                                        <div className="flex items-center gap-1">
                                            <FaTasks className="text-gray-400 text-sm" />
                                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                                {project.tasks_count || 0} tâche{project.tasks_count !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle text-xs text-gray-400 dark:text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <FaCalendarAlt className="text-gray-400" />
                                            {new Date(project.created_at).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle text-right whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/projects/${project.id}`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition duration-150 p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800">
                                                <FaEye />
                                            </Link>
                                            <Link href={`/projects/${project.id}/edit`} className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300 transition duration-150 p-2 rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-800">
                                                <FaEdit />
                                            </Link>
                                            <button onClick={() => handleDelete(project.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition duration-150 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-800">
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-center gap-3 mb-8">
                    {projects.links && projects.links.map((link, i) => (
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
            </main>
        </div>
    );
}

Index.layout = page => <AdminLayout children={page} />;