import React, { useState } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { Link, usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { FaUserEdit, FaUsers, FaArrowLeft } from 'react-icons/fa';

export default function Edit({ project, users = [], roles = [] }) {
    const { errors = {}, flash = {} } = usePage().props;
    const [selectedUser, setSelectedUser] = useState(project.users[0]?.id || '');
    const [role, setRole] = useState(project.users[0]?.pivot?.role || '');
    const [submitting, setSubmitting] = useState(false);

    const handleUserChange = e => {
        const userId = e.target.value;
        setSelectedUser(userId);
        const user = project.users.find(u => u.id == userId);
        setRole(user?.pivot?.role || '');
    };

    const handleSubmit = e => {
        e.preventDefault();
        setSubmitting(true);
        Inertia.put(route('project-users.update', project.id), {
            user_id: selectedUser,
            role,
        }, {
            onSuccess: () => {
                setSubmitting(false);
                Inertia.visit(route('project-users.index'));
            },
            onFinish: () => setSubmitting(false),
        });
    };

    // Map des labels dynamiques
    const ROLE_LABELS = {
        member: 'Membre',
        manager: 'Chef de projet',
        observer: 'Observateur',
    };

    return (
        <div className="flex flex-col w-full h-screen bg-white dark:bg-gray-900 overflow-x-hidden rounded-none shadow-none p-0 m-0">
            <main className="flex-1 flex flex-col w-full bg-white dark:bg-gray-900 overflow-x-hidden overflow-y-auto p-0 m-0" style={{ height: 'calc(100vh - 4rem)' }}>
                <div className="flex flex-col h-full w-full max-w-4xl mx-auto mt-14 pt-4 bg-white dark:bg-gray-900">
                    <div className="flex items-center gap-3 mb-8">
                        <Link href="/project-users" className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-100 transition">
                            <FaArrowLeft className="text-xl" />
                        </Link>
                        <FaUserEdit className="text-3xl text-blue-600" />
                        <h1 className="text-3xl font-extrabold text-blue-700 dark:text-blue-200 tracking-tight">Modifier le membre</h1>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-2xl mx-auto w-full">
                        {flash.success && <div className="mb-6 px-4 py-3 rounded-lg text-white font-semibold bg-green-500">{flash.success}</div>}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Projet</label>
                                <input type="text" value={project.name} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200" disabled />
                                {errors.project_id && <div className="text-red-600 text-sm mt-2 font-medium">{errors.project_id}</div>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Utilisateur</label>
                                <select value={selectedUser} onChange={handleUserChange} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition">
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>{user.name}</option>
                                    ))}
                                </select>
                                {errors.user_id && <div className="text-red-600 text-sm mt-2 font-medium">{errors.user_id}</div>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Rôle</label>
                                <select value={role} onChange={e => setRole(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition">
                                    <option value="">Sélectionner un rôle</option>
                                    {roles.map(opt => (
                                        <option key={opt} value={opt}>{ROLE_LABELS[opt] || opt}</option>
                                    ))}
                                </select>
                                {errors.role && <div className="text-red-600 text-sm mt-2 font-medium">{errors.role}</div>}
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" disabled={submitting}>
                                    {submitting ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Mise à jour...</>) : (<><FaUserEdit /> Mettre à jour</>)}
                                </button>
                                <Link href="/project-users" className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2">
                                    <FaArrowLeft /> Annuler
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}

Edit.layout = page => <AdminLayout children={page} />; 