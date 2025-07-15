import React, { useState } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { Link, usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { FaUserPlus, FaUsers, FaArrowLeft } from 'react-icons/fa';

export default function Create({ projects = [], users = [], roles = [] }) {
    const { errors = {}, flash = {} } = usePage().props;
    const [values, setValues] = useState({
        project_id: projects[0]?.id || '',
        user_id: users[0]?.id || '',
        role: '',
    });
    const [submitting, setSubmitting] = useState(false);

    const handleChange = e => {
        setValues({ ...values, [e.target.name]: e.target.value });
    };

    const handleSubmit = e => {
        e.preventDefault();
        setSubmitting(true);
        Inertia.post(route('project-users.store'), values, {
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
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-blue-700 dark:text-blue-200"><FaUserPlus /> Ajouter un membre à un projet</h1>
            {flash.success && <div className="mb-4 px-4 py-3 rounded bg-green-100 text-green-800 font-semibold shadow">{flash.success}</div>}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block font-semibold mb-1">Projet</label>
                    <select value={values.project_id} onChange={e => setValues({ ...values, project_id: e.target.value })} className="border px-3 py-2 rounded w-full focus:ring-2 focus:ring-blue-400">
                        {projects.length === 0 ? (
                            <option>Aucun projet</option>
                        ) : (
                            projects.map(project => (
                                <option key={project.id} value={project.id}>{project.name}</option>
                            ))
                        )}
                    </select>
                    {errors.project_id && <div className="text-error text-sm mt-1">{errors.project_id}</div>}
                </div>
                <div>
                    <label className="block font-semibold mb-1">Utilisateur</label>
                    <select value={values.user_id} onChange={e => setValues({ ...values, user_id: e.target.value })} className="border px-3 py-2 rounded w-full focus:ring-2 focus:ring-blue-400">
                        {users.length === 0 ? (
                            <option>Aucun utilisateur</option>
                        ) : (
                            users.map(user => (
                                <option key={user.id} value={user.id}>{user.name}</option>
                            ))
                        )}
                    </select>
                    {errors.user_id && <div className="text-error text-sm mt-1">{errors.user_id}</div>}
                </div>
                <div>
                    <label className="block font-semibold mb-1">Rôle</label>
                    <select value={values.role} onChange={e => setValues({ ...values, role: e.target.value })} className="border px-3 py-2 rounded w-full focus:ring-2 focus:ring-blue-400">
                        <option value="">Sélectionner un rôle</option>
                        {roles.map(opt => (
                            <option key={opt} value={opt}>{ROLE_LABELS[opt] || opt}</option>
                        ))}
                    </select>
                    {errors.role && <div className="text-error text-sm mt-1">{errors.role}</div>}
                </div>
                <div className="flex gap-2 mt-4">
                    <button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded font-semibold shadow flex items-center gap-2" disabled={submitting || projects.length === 0 || users.length === 0}>
                        {submitting ? 'Enregistrement...' : <><FaUserPlus /> Enregistrer</>}
                    </button>
                    <Link href={route('project-users.index')} className="bg-gray-100 hover:bg-blue-100 text-blue-700 px-5 py-2 rounded font-semibold flex items-center gap-2"><FaArrowLeft /> Annuler</Link>
                </div>
            </form>
        </div>
    );
}

Create.layout = page => <AdminLayout children={page} />; 