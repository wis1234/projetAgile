import React, { useState } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { Link, usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { FaFileAlt } from 'react-icons/fa';

export default function Edit({ file, projects, users, tasks = [], kanbans = [] }) {
    const { errors, flash = {} } = usePage().props;
    const [values, setValues] = useState({
        name: file.name || '',
        project_id: file.project_id || projects[0]?.id || '',
        user_id: file.user_id || users[0]?.id || '',
        task_id: file.task_id || '',
        kanban_id: file.kanban_id || '',
        description: file.description || '',
        status: file.status || 'pending',
        rejection_reason: file.rejection_reason || '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [notification, setNotification] = useState(flash.success || flash.error || '');
    const [notificationType, setNotificationType] = useState(flash.success ? 'success' : 'error');

    const handleChange = e => {
        setValues({ ...values, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        Inertia.put(route('files.update', file.id), values, {
            onSuccess: () => {
                setNotification('Fichier mis à jour avec succès');
                setNotificationType('success');
                setSubmitting(false);
                setTimeout(() => Inertia.visit('/files'), 1200);
            },
            onError: () => {
                setNotification('Erreur lors de la mise à jour');
                setNotificationType('error');
                setSubmitting(false);
            },
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <AdminLayout>
            <div className="flex flex-col h-full w-full">
                <div className="max-w-5xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 mt-8 mb-8">
                    <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-yellow-700 dark:text-yellow-200"><FaFileAlt /> Modifier le fichier</h1>
                    {notification && (
                        <div className={`mb-4 px-4 py-2 rounded text-white ${notificationType === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{notification}</div>
                    )}
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block font-semibold mb-1">Nom du fichier</label>
                            <input type="text" name="name" value={values.name} onChange={handleChange} className="input" required />
                            {errors.name && <div className="text-error text-sm">{errors.name}</div>}
                        </div>
                        <div>
                            <label className="block font-semibold mb-1">Projet</label>
                            <select name="project_id" value={values.project_id} onChange={handleChange} className="input" required>
                                {projects.map(project => (
                                    <option key={project.id} value={project.id}>{project.name}</option>
                                ))}
                            </select>
                            {errors.project_id && <div className="text-error text-sm">{errors.project_id}</div>}
                        </div>
                        <div>
                            <label className="block font-semibold mb-1">Utilisateur</label>
                            <select name="user_id" value={values.user_id} onChange={handleChange} className="input" required>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>{user.name}</option>
                                ))}
                            </select>
                            {errors.user_id && <div className="text-error text-sm">{errors.user_id}</div>}
                        </div>
                        <div>
                            <label className="block font-semibold mb-1">Tâche liée (optionnel)</label>
                            <select name="task_id" value={values.task_id} onChange={handleChange} className="input">
                                <option value="">Aucune</option>
                                {tasks.map(task => (
                                    <option key={task.id} value={task.id}>{task.title}</option>
                                ))}
                            </select>
                            {errors.task_id && <div className="text-error text-sm">{errors.task_id}</div>}
                        </div>
                        <div>
                            <label className="block font-semibold mb-1">Kanban lié (optionnel)</label>
                            <select name="kanban_id" value={values.kanban_id} onChange={handleChange} className="input">
                                <option value="">Aucun</option>
                                {kanbans.map(kanban => (
                                    <option key={kanban.id} value={kanban.id}>{kanban.name}</option>
                                ))}
                            </select>
                            {errors.kanban_id && <div className="text-error text-sm">{errors.kanban_id}</div>}
                        </div>
                        <div>
                            <label className="block font-semibold mb-1">Description (optionnel)</label>
                            <textarea name="description" value={values.description} onChange={handleChange} className="input" rows={2} />
                            {errors.description && <div className="text-error text-sm">{errors.description}</div>}
                        </div>
                        <div>
                            <label className="block font-semibold mb-1">Statut</label>
                            <select name="status" value={values.status} onChange={handleChange} className="input" required>
                                <option value="pending">En attente</option>
                                <option value="validated">Validé</option>
                                <option value="rejected">Rejeté</option>
                            </select>
                            {errors.status && <div className="text-error text-sm">{errors.status}</div>}
                        </div>
                        {values.status === 'rejected' && (
                            <div>
                                <label className="block font-semibold mb-1">Motif du rejet</label>
                                <textarea name="rejection_reason" value={values.rejection_reason} onChange={handleChange} className="input" rows={2} required />
                                {errors.rejection_reason && <div className="text-error text-sm">{errors.rejection_reason}</div>}
                            </div>
                        )}
                        <div className="md:col-span-2 flex gap-2 mt-4">
                            <button type="submit" className="bg-yellow-600 hover:bg-yellow-700 text-white px-5 py-2 rounded font-semibold shadow flex items-center gap-2">Enregistrer</button>
                            <Link href={route('files.index')} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded font-semibold shadow flex items-center gap-2">Annuler</Link>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
} 