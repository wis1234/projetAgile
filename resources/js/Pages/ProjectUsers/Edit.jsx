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
        <div className="p-6 max-w-xl mx-auto bg-white dark:bg-gray-800 rounded shadow">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-blue-700 dark:text-blue-200"><FaUserEdit /> Éditer le rôle d'un membre</h1>
            {flash.success && <div className="mb-4 px-4 py-3 rounded bg-green-100 text-green-800 font-semibold shadow">{flash.success}</div>}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block font-semibold mb-1">Projet</label>
                    <input type="text" value={project.name} className="border px-3 py-2 rounded w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200" disabled />
                    {errors.project_id && <div className="text-error text-sm mt-1">{errors.project_id}</div>}
                </div>
                <div>
                    <label className="block font-semibold mb-1">Utilisateur</label>
                    <select value={selectedUser} onChange={handleUserChange} className="border px-3 py-2 rounded w-full focus:ring-2 focus:ring-blue-400">
                        {users.map(user => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                    </select>
                    {errors.user_id && <div className="text-error text-sm mt-1">{errors.user_id}</div>}
                </div>
                <div>
                    <label className="block font-semibold mb-1">Rôle</label>
                    <select value={role} onChange={e => setRole(e.target.value)} className="border px-3 py-2 rounded w-full focus:ring-2 focus:ring-blue-400">
                        <option value="">Sélectionner un rôle</option>
                        {roles.map(opt => (
                            <option key={opt} value={opt}>{ROLE_LABELS[opt] || opt}</option>
                        ))}
                    </select>
                    {errors.role && <div className="text-error text-sm mt-1">{errors.role}</div>}
                </div>
                <div className="flex gap-2 mt-4">
                    <button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded font-semibold shadow flex items-center gap-2" disabled={submitting}>{submitting ? 'Mise à jour...' : <><FaUserEdit /> Mettre à jour</>}</button>
                    <Link href={route('project-users.index')} className="bg-gray-100 hover:bg-blue-100 text-blue-700 px-5 py-2 rounded font-semibold flex items-center gap-2"><FaArrowLeft /> Annuler</Link>
                </div>
            </form>
        </div>
    );
}

Edit.layout = page => <AdminLayout children={page} />; 