import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { FaUsers, FaUserPlus, FaUserEdit, FaEye, FaProjectDiagram } from 'react-icons/fa';

export default function Index({ projects = [] }) {
    const { flash = {} } = usePage().props;
    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
                <h1 className="text-3xl font-extrabold flex items-center gap-3 text-blue-700 dark:text-blue-200 tracking-tight drop-shadow"><FaUsers /> Membres des projets</h1>
                <Link href={route('project-users.create')} className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-lg font-semibold shadow flex items-center gap-2 transition"><FaUserPlus /> Ajouter un membre</Link>
            </div>
            {flash.success && <div className="mb-4 px-4 py-3 rounded bg-green-100 text-green-800 font-semibold shadow">{flash.success}</div>}
            <div className="overflow-x-auto rounded-lg shadow bg-white dark:bg-gray-800">
                <table className="min-w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-gradient-to-r from-blue-100 to-blue-300 dark:from-blue-900 dark:to-blue-700 shadow">
                        <tr>
                            <th className="p-4 text-left font-bold">Projet</th>
                            <th className="p-4 text-left font-bold">Membres</th>
                            <th className="p-4 text-left font-bold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.length === 0 && (
                            <tr><td colSpan="3" className="text-center text-gray-400 py-8">Aucun projet trouvé.</td></tr>
                        )}
                        {projects.map(project => (
                            <tr key={project.id} className="hover:bg-blue-100 dark:hover:bg-blue-900 transition">
                                <td className="p-4 align-middle font-semibold text-black dark:text-blue-200 text-lg flex items-center gap-2"><FaProjectDiagram /> {project.name}</td>
                                <td className="p-4 align-middle">
                                    {project.users && project.users.length > 0 ? (
                                        <ul className="flex flex-col gap-2">
                                            {project.users.map(user => (
                                                <li key={user.id} className="flex items-center gap-3 py-1">
                                                    <img src={user.profile_photo_url || (user.profile_photo_path ? `/storage/${user.profile_photo_path}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`)} alt={user.name} className="w-8 h-8 rounded-full shadow border-2 border-blue-200" />
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-black dark:text-blue-100">{user.name}</span>
                                                    </div>
                                                    <span className={`ml-2 px-2 py-1 rounded text-xs font-bold ${user.pivot.role === 'manager' ? 'bg-yellow-100 text-yellow-800' : user.pivot.role === 'member' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>{user.pivot.role}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <span className="text-gray-400">Aucun membre</span>
                                    )}
                                </td>
                                <td className="p-4 align-middle flex gap-2">
                                    <Link href={route('project-users.show', project.id)} className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded shadow flex items-center gap-1 font-semibold transition"><FaEye /> Voir</Link>
                                    <Link href={route('project-users.edit', project.id)} className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded shadow flex items-center gap-1 font-semibold transition"><FaUserEdit /> Éditer</Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

Index.layout = page => <AdminLayout children={page} />; 