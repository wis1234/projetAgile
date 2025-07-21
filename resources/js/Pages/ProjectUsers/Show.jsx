import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { FaUsers, FaUserEdit, FaArrowLeft } from 'react-icons/fa';

export default function Show({ project }) {
    const { flash = {} } = usePage().props;
    return (
        <div className="flex flex-col w-full min-h-screen bg-white dark:bg-gray-900 overflow-x-hidden p-0 m-0">
            <main className="flex-1 flex flex-col w-full bg-white dark:bg-gray-900 overflow-x-hidden p-0 m-0">
                <div className="flex flex-col w-full max-w-7xl mx-auto mt-14 pt-4 bg-white dark:bg-gray-900">
                    <div className="flex items-center gap-3 mb-8">
                        <FaUsers className="text-3xl text-blue-600" />
                        <h1 className="text-3xl font-extrabold text-blue-700 dark:text-blue-200 tracking-tight">Détail des membres du projet</h1>
                    </div>
                    {flash.success && (
                        <div className="mb-6 px-4 py-3 rounded-lg bg-green-100 text-green-800 font-semibold">
                            {flash.success}
                        </div>
                    )}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Carte principale du projet */}
                        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                    <FaUsers className="text-blue-600 dark:text-blue-200 text-xl" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-200">{project.name}</h2>
                                </div>
                            </div>
                            <div className="mb-4">
                                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                    Projet
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                                    {project.name}
                                </p>
                            </div>
                        </div>
                        {/* Carte des membres */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-bold text-blue-700 dark:text-blue-200 mb-4 flex items-center gap-2">
                                Membres ({project.users?.length || 0})
                            </h3>
                            {project.users && project.users.length > 0 ? (
                                <div className="space-y-3">
                                    {project.users.map(user => (
                                        <div key={user.id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <img 
                                                src={user.profile_photo_url || (user.profile_photo_path ? `/storage/${user.profile_photo_path}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`)} 
                                                alt={user.name} 
                                                className="w-8 h-8 rounded-full border-2 border-blue-200" 
                                            />
                                            <div className="flex-1">
                                                <div className="font-semibold text-blue-700 dark:text-blue-200 text-sm">{user.name}</div>
                                                <div className="text-xs text-gray-500">{user.email}</div>
                                            </div>
                                            <span className={`ml-2 px-2 py-1 rounded text-xs font-bold ${user.pivot.role === 'manager' ? 'bg-yellow-100 text-yellow-800' : user.pivot.role === 'member' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>{user.pivot.role}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-gray-400 text-center py-4">Aucun membre</div>
                            )}
                        </div>
                    </div>
                    {/* Actions */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link 
                                href={route('project-users.edit', project.id)}
                                className="w-full sm:w-auto bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                            >
                                <FaUserEdit /> Modifier le membre
                            </Link>
                            <Link 
                                href="/project-users"
                                className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                            >
                                <FaArrowLeft /> Retour à la liste
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

Show.layout = page => <AdminLayout children={page} />; 