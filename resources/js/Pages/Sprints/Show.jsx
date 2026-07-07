import React, { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    FaFlagCheckered, FaEdit, FaProjectDiagram, FaArrowLeft,
    FaTasks, FaUser, FaCalendarAlt, FaInfoCircle,
    FaCheckCircle, FaSpinner, FaClock, FaExclamationTriangle, FaSearch
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const Show = ({ sprint, tasks, stats, filters }) => {
    const { t } = useTranslation();

    const [search,   setSearch]   = useState(filters?.search   || '');
    const [status,   setStatus]   = useState(filters?.status   || '');
    const [priority, setPriority] = useState(filters?.priority || '');

    const applyFilters = (newFilters) => {
        router.get(route('sprints.show', sprint.id), newFilters, {
            preserveState: true,
            replace: true,
        });
    };

    const handleSearch = (e) => {
        const val = e.target.value;
        setSearch(val);
        applyFilters({ search: val, status, priority });
    };

    const handleStatus = (e) => {
        const val = e.target.value;
        setStatus(val);
        applyFilters({ search, status: val, priority });
    };

    const handlePriority = (e) => {
        const val = e.target.value;
        setPriority(val);
        applyFilters({ search, status, priority: val });
    };

    const resetFilters = () => {
        setSearch(''); setStatus(''); setPriority('');
        applyFilters({});
    };

    const formatDate = (date) =>
        new Date(date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

    const getStatusBadge = (s) => {
        const map = {
            todo:        { cls: 'bg-gray-200 text-gray-800',   label: 'À faire' },
            in_progress: { cls: 'bg-blue-200 text-blue-800',   label: 'En cours' },
            done:        { cls: 'bg-green-200 text-green-800',  label: 'Terminé' },
        };
        const { cls, label } = map[s] || map.todo;
        return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${cls}`}>{label}</span>;
    };

    const getPriorityBadge = (p) => {
        const map = {
            low:    { cls: 'bg-gray-200 text-gray-800',    label: 'Basse' },
            medium: { cls: 'bg-yellow-200 text-yellow-800', label: 'Moyenne' },
            high:   { cls: 'bg-red-200 text-red-800',      label: 'Haute' },
        };
        const { cls, label } = map[p] || map.low;
        return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${cls}`}>{label}</span>;
    };

    const assignedUsers = tasks
        ? tasks.map(t => t.assigned_user)
               .filter((u, i, self) => u && self.findIndex(x => x.id === u.id) === i)
        : [];

    const hasFilters = search || status || priority;
    const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

    return (
        <div className="flex flex-col w-full min-h-screen bg-gray-50 dark:bg-gray-950 p-0 m-0">
            <main className="flex-1 flex flex-col w-full py-8 px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <Link href={route('sprints.index')}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 p-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                            <FaArrowLeft className="h-6 w-6" />
                        </Link>
                        <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                            <FaFlagCheckered className="h-8 w-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 dark:text-gray-100">{sprint.name}</h1>
                            <p className="text-md text-gray-500 dark:text-gray-400">{t('sprint_details')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href={route('sprints.edit', sprint.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold flex items-center gap-2 transition duration-200">
                            <FaEdit /><span className="hidden sm:inline">{t('edit')}</span>
                        </Link>
                        <Link href={route('sprints.index')}
                            className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-5 py-3 rounded-lg font-semibold flex items-center gap-2 transition duration-200">
                            <FaArrowLeft /><span className="hidden sm:inline">{t('back')}</span>
                        </Link>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex items-center gap-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <FaTasks className="text-gray-600 dark:text-gray-300 text-xl" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.total}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Total tâches</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <FaSpinner className="text-blue-600 dark:text-blue-300 text-xl" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.in_progress}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">En cours</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                            <FaCheckCircle className="text-green-600 dark:text-green-300 text-xl" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.done}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Terminées</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                            <FaExclamationTriangle className="text-red-600 dark:text-red-300 text-xl" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.high}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Priorité haute</p>
                        </div>
                    </div>
                </div>

                {/* Barre de progression */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 mb-8 border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Progression du sprint</span>
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                            className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stats.done} / {stats.total} tâches terminées</p>
                </div>

                {/* Sprint Info Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 mb-8 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">{t('general_information')}</h3>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                                {sprint.description || <span className="italic">{t('no_description')}</span>}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                                    <FaCalendarAlt className="text-blue-500" />
                                    <div>
                                        <span className="font-semibold text-gray-700 dark:text-gray-300">{t('start_date')} :</span>
                                        <p className="text-gray-900 dark:text-gray-100">{formatDate(sprint.start_date)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                                    <FaCalendarAlt className="text-red-500" />
                                    <div>
                                        <span className="font-semibold text-gray-700 dark:text-gray-300">{t('end_date')} :</span>
                                        <p className="text-gray-900 dark:text-gray-100">{formatDate(sprint.end_date)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">{t('associated_project')}</h3>
                            {sprint.project ? (
                                <Link href={route('projects.show', sprint.project.id)} className="block group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-full">
                                            <FaProjectDiagram className="text-blue-600 dark:text-blue-300" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-blue-700 dark:text-blue-300 group-hover:underline">{sprint.project.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('view_project_details')}</p>
                                        </div>
                                    </div>
                                </Link>
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400 italic">{t('no_associated_project')}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Membres assignés */}
                {assignedUsers.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 mb-8 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition duration-200">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-3">
                            <FaUser /> {t('team_members')}
                        </h3>
                        <div className="flex flex-wrap gap-4">
                            {assignedUsers.map(user => (
                                <div key={user.id} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                                    <img
                                        src={user.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&color=7F9CF5&background=EBF4FF`}
                                        alt={user.name}
                                        className="w-8 h-8 rounded-full"
                                    />
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">{user.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tâches + Filtres */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
                            <FaTasks /> Tâches ({stats.total})
                        </h2>
                        {hasFilters && (
                            <button onClick={resetFilters}
                                className="text-sm text-red-500 hover:text-red-700 underline self-start sm:self-auto">
                                Réinitialiser les filtres
                            </button>
                        )}
                    </div>

                    {/* Filtres */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                            <input
                                type="text"
                                placeholder="Rechercher une tâche..."
                                value={search}
                                onChange={handleSearch}
                                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <select
                            value={status}
                            onChange={handleStatus}
                            className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Tous les statuts</option>
                            <option value="todo">À faire</option>
                            <option value="in_progress">En cours</option>
                            <option value="done">Terminé</option>
                        </select>
                        <select
                            value={priority}
                            onChange={handlePriority}
                            className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Toutes les priorités</option>
                            <option value="low">Basse</option>
                            <option value="medium">Moyenne</option>
                            <option value="high">Haute</option>
                        </select>
                    </div>

                    {/* Table des tâches */}
                    {tasks && tasks.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm text-left text-gray-700 dark:text-gray-300">
                                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                    <tr>
                                        <th className="p-4 font-semibold">{t('title')}</th>
                                        <th className="p-4 font-semibold">{t('assigned_to')}</th>
                                        <th className="p-4 font-semibold">Statut</th>
                                        <th className="p-4 font-semibold">Priorite</th>
                                        <th className="p-4 font-semibold">Échéance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tasks.map(task => (
                                        <tr key={task.id}
                                            className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                                            <td className="p-4">
                                                <Link href={route('tasks.show', task.id)}
                                                    className="font-semibold text-blue-600 hover:underline">
                                                    {task.title}
                                                </Link>
                                            </td>
                                            <td className="p-4">
                                                {task.assigned_user ? (
                                                    <div className="flex items-center gap-2">
                                                        <img
                                                            src={task.assigned_user.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(task.assigned_user.name)}&color=7F9CF5&background=EBF4FF`}
                                                            alt={task.assigned_user.name}
                                                            className="w-6 h-6 rounded-full"
                                                        />
                                                        <span>{task.assigned_user.name}</span>
                                                    </div>
                                                ) : <span className="text-gray-400 italic">{t('unassigned')}</span>}
                                            </td>
                                            <td className="p-4">{getStatusBadge(task.status)}</td>
                                            <td className="p-4">{getPriorityBadge(task.priority)}</td>
                                            <td className="p-4">
                                                {task.due_date
                                                    ? <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400"><FaClock className="text-xs" />{formatDate(task.due_date)}</span>
                                                    : <span className="text-gray-400 italic">—</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <FaInfoCircle className="mx-auto text-4xl text-gray-400 mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">
                                {hasFilters ? 'Aucune tâche ne correspond aux filtres.' : t('no_tasks_in_sprint')}
                            </p>
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
};

Show.layout = page => <AdminLayout title="Détails du sprint">{page}</AdminLayout>;

export default Show;