import React, { useEffect, useState } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { Link, usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import ActionButton from '../../Components/ActionButton';
import { FaProjectDiagram, FaPlus, FaUser, FaUsers, FaTasks, FaEdit, FaEye } from 'react-icons/fa';

export default function Index({ projects, filters }) {
    const { flash = {} } = usePage().props;
    const [search, setSearch] = useState(filters.search || '');
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    const [notification, setNotification] = useState(flash.success || '');
    const [notificationType, setNotificationType] = useState('success');
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

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

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(handler);
    }, [search]);

    useEffect(() => {
        Inertia.get('/projects', { search: debouncedSearch }, { preserveState: true, replace: true });
    }, [debouncedSearch]);

    const handleSearch = (e) => {
        setSearch(e.target.value);
    };

    const handleSelectProject = async (projectId) => {
        setSelectedProjectId(projectId);
        setLoadingDetail(true);
        try {
            const res = await fetch(`/api/projects/${projectId}`);
            const data = await res.json();
            setSelectedProject(data);
        } catch (e) {
            setSelectedProject(null);
        }
        setLoadingDetail(false);
    };

    return (
        <div className="flex h-[80vh] bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
            {/* Colonne projets */}
            <section className={`w-full md:w-[400px] border-r bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-900 dark:to-gray-900 flex flex-col ${selectedProjectId ? 'hidden md:flex' : ''}`}>
                <div className="flex flex-col md:flex-row md:justify-between md:items-center p-4 gap-2 md:gap-0 border-b sticky top-0 z-20 bg-white dark:bg-gray-900">
                    <h1 className="text-3xl font-extrabold flex items-center gap-3 text-blue-700 dark:text-blue-200 tracking-tight drop-shadow"><FaProjectDiagram /> Projets</h1>
                    <Link href="/projects/create" className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-semibold shadow flex items-center gap-2 transition"><FaPlus /> Nouveau projet</Link>
                </div>
                <div className="p-4">
                    <input
                        type="text"
                        value={search}
                        onChange={handleSearch}
                        placeholder="Rechercher..."
                        className="border px-3 py-2 rounded w-full mb-4 focus:ring-2 focus:ring-blue-400"
                    />
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {projects.data.map(project => (
                            <li key={project.id} className={`py-3 px-2 flex flex-col gap-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded cursor-pointer transition ${selectedProjectId === project.id ? 'bg-blue-200 dark:bg-blue-800' : ''}`}
                                onClick={() => handleSelectProject(project.id)}
                            >
                                <span className="font-semibold text-blue-800 dark:text-blue-200 text-lg flex items-center gap-2"><FaProjectDiagram /> {project.name}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="mt-auto flex justify-center p-4">
                    {projects.links && projects.links.map((link, i) => (
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
            {/* Détail du projet sélectionné */}
            <section className={`flex-1 bg-white dark:bg-gray-900 ${selectedProjectId ? 'flex flex-col' : 'hidden md:flex items-center justify-center'}`}>
                {notification && (
                    <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded shadow-lg text-white transition-all ${notificationType === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{notification}</div>
                )}
                {loadingDetail && (
                    <div className="flex-1 flex items-center justify-center text-gray-400 text-lg">Chargement...</div>
                )}
                {!loadingDetail && selectedProject && (
                    <div className="p-8 max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded shadow h-full overflow-y-auto">
                        <h1 className="text-2xl font-bold mb-6 text-blue-700 dark:text-blue-200 flex items-center gap-2"><FaProjectDiagram /> Détail du projet</h1>
                        <div className="mb-6">
                            <div className="mb-2"><span className="font-semibold">Nom :</span> {selectedProject.name}</div>
                            <div className="mb-2"><span className="font-semibold">Membres :</span> {selectedProject.users && selectedProject.users.length > 0 ? (
                                <div className="flex flex-wrap gap-3 mt-1">
                                    {selectedProject.users.map(user => (
                                        <span key={user.id} className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-2 py-1 rounded text-xs font-medium">
                                            <img src={user.profile_photo_url || (user.profile_photo_path ? `/storage/${user.profile_photo_path}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`)} alt={user.name} className="w-6 h-6 rounded-full border-2 border-blue-200" />
                                            {user.name}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <span className="text-gray-400">Aucun membre</span>
                            )}
                            </div>
                        </div>
                        <div className="mb-8">
                            <h2 className="text-xl font-bold mb-2 text-blue-600 dark:text-blue-300 flex items-center gap-2"><FaTasks /> Tâches rattachées</h2>
                            {selectedProject.tasks && selectedProject.tasks.length === 0 ? (
                                <div className="text-gray-400">Aucune tâche pour ce projet.</div>
                            ) : (
                                <ul className="space-y-2">
                                    {selectedProject.tasks && selectedProject.tasks.map(task => (
                                        <li key={task.id} className="border rounded p-3 bg-gray-50 dark:bg-gray-900 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                            <div className="flex-1">
                                                <Link href={`/tasks/${task.id}`} className="font-semibold text-blue-700 dark:text-blue-200 hover:underline flex items-center gap-2"><FaEye /> {task.title}</Link>
                                                {task.status && <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 text-xs capitalize">{task.status}</span>}
                                                {task.priority && <span className="ml-2 px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200 text-xs capitalize">{task.priority}</span>}
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Assignée à : {task.assigned_user?.name || task.assignedUser?.name || <span className="italic text-gray-400">Non assignée</span>}
                                                    {task.sprint && (
                                                        <span> | Sprint : <Link href={`/sprints/${task.sprint.id}`} className="underline text-green-700 dark:text-green-300">{task.sprint.name}</Link></span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 mt-2 md:mt-0">
                                                <Link href={`/tasks/${task.id}`} className="bg-gray-100 hover:bg-blue-100 text-blue-700 px-3 py-1 rounded transition text-xs font-semibold flex items-center gap-1"><FaEye /> Voir</Link>
                                                <Link href={`/tasks/${task.id}/edit`} className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded transition text-xs font-semibold flex items-center gap-1"><FaEdit /> Éditer</Link>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="flex gap-2 mt-4">
                            <Link href={route('projects.edit', selectedProject.id)} className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-5 py-2 rounded font-semibold flex items-center gap-2"><FaEdit /> Éditer</Link>
                            <ActionButton variant="default" onClick={() => { setSelectedProjectId(null); setSelectedProject(null); }}>Retour à la liste</ActionButton>
                        </div>
                    </div>
                )}
                {!loadingDetail && !selectedProject && (
                    <div className="text-gray-400 text-lg flex-1 flex items-center justify-center">Sélectionnez un projet pour voir le détail</div>
                )}
            </section>
        </div>
    );
}

Index.layout = page => <AdminLayout children={page} />; 