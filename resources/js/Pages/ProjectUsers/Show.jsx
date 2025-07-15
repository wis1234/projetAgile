import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { FaUsers, FaUserEdit, FaArrowLeft } from 'react-icons/fa';

export default function Show({ project }) {
    const { flash = {} } = usePage().props;
    return (
        <div className="p-6 max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded shadow">
            <h1 className="text-3xl font-extrabold mb-6 flex items-center gap-3 text-blue-700 dark:text-blue-200"><FaUsers /> Membres du projet : {project.name}</h1>
            {flash.success && <div className="mb-4 px-4 py-3 rounded bg-green-100 text-green-800 font-semibold shadow">{flash.success}</div>}
            <div className="mb-6">
                {project.users && project.users.length > 0 ? (
                    <ul className="flex flex-col gap-3">
                        {project.users.map(user => (
                            <li key={user.id} className="flex items-center gap-3 py-2">
                                <img src={user.profile_photo_url || (user.profile_photo_path ? `/storage/${user.profile_photo_path}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`)} alt={user.name} className="w-8 h-8 rounded-full border-2 border-blue-200" />
                                <span className="font-semibold text-blue-700 dark:text-blue-200">{user.name}</span>
                                <span className={`ml-2 px-2 py-1 rounded text-xs font-bold ${user.pivot.role === 'manager' ? 'bg-yellow-100 text-yellow-800' : user.pivot.role === 'member' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>{user.pivot.role}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <span className="text-gray-400">Aucun membre</span>
                )}
            </div>
            <div className="flex gap-2 mt-4">
                <Link href={route('project-users.edit', project.id)} className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-5 py-2 rounded font-semibold flex items-center gap-2"><FaUserEdit /> Éditer</Link>
                <Link href="/project-users" className="bg-gray-100 hover:bg-blue-100 text-blue-700 px-5 py-2 rounded font-semibold flex items-center gap-2"><FaArrowLeft /> Retour à la liste</Link>
            </div>
        </div>
    );
}

Show.layout = page => <AdminLayout children={page} />; 