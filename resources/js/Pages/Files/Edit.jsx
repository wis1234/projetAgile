import React, { useState } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { Link, usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { FaFileAlt } from 'react-icons/fa';
import { useRef } from 'react';

export default function Edit({ file, projects, users, tasks = [], kanbans = [] }) {
    const { errors, flash = {} } = usePage().props;
    const { auth } = usePage().props;
    const isAdmin = auth?.user?.role === 'admin';
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
    const fileInputRef = useRef();

    const handleChange = e => {
        setValues({ ...values, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        const formData = new FormData();
        formData.append('name', values.name);
        formData.append('project_id', values.project_id);
        formData.append('user_id', values.user_id);
        formData.append('task_id', values.task_id);
        formData.append('kanban_id', values.kanban_id);
        formData.append('description', values.description);
        formData.append('status', values.status);
        formData.append('rejection_reason', values.rejection_reason);
        if (fileInputRef.current && fileInputRef.current.files[0]) {
            formData.append('file', fileInputRef.current.files[0]);
        }
        formData.append('_method', 'put');
        Inertia.post(route('files.update', file.id), formData, {
            forceFormData: true,
            onSuccess: () => {
                setNotification('Fichier mis à jour avec succès');
                setNotificationType('success');
                setSubmitting(false);
                // La redirection est gérée par le contrôleur
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
        <div className="flex flex-col w-full bg-white dark:bg-gray-900 p-0 m-0">
            <div className="flex flex-col h-full w-full max-w-4xl mx-auto pt-4 bg-white dark:bg-gray-900">
                <div className="flex items-center gap-3 mb-8">
                    <Link href="/files" className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-100 transition">
                        <FaFileAlt className="text-xl" />
                    </Link>
                    <FaFileAlt className="text-3xl text-blue-600" />
                    <h1 className="text-3xl font-extrabold text-blue-700 dark:text-blue-200 tracking-tight">Modifier le fichier</h1>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-2xl mx-auto w-full">
                    {/* Affichage du fichier actuel */}
                    <div className="mb-6 flex flex-col gap-2">
                        <div>
                            <span className="font-semibold">Fichier actuel :</span>{' '}
                            <a href={`/storage/${file.file_path}`} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline font-semibold">Télécharger</a>
                        </div>
                        {file.type && file.type.startsWith('image/') && (
                            <div className="mt-2">
                                <img src={`/storage/${file.file_path}`} alt={file.name} className="max-w-xs rounded shadow" />
                            </div>
                        )}
                    </div>
                    {notification && (
                        <div className={`mb-6 px-4 py-3 rounded-lg text-white font-semibold ${notificationType === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{notification}</div>
                    )}
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6" encType="multipart/form-data">
                        <div className="md:col-span-2">
                            <label className="block font-semibold mb-1">Remplacer le fichier (optionnel)</label>
                            <input type="file" name="file" ref={fileInputRef} className="input" accept="*/*" />
                            {errors.file && <div className="text-error text-sm">{errors.file}</div>}
                        </div>
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
                        {isAdmin && (
                            <div>
                                <label className="block font-semibold mb-1">Utilisateur</label>
                                <select name="user_id" value={values.user_id} onChange={handleChange} className="input" required>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>{user.name}</option>
                                    ))}
                                </select>
                                {errors.user_id && <div className="text-error text-sm">{errors.user_id}</div>}
                            </div>
                        )}
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
                        <div className="md:col-span-2 flex gap-4 pt-4">
                            <button type="submit" className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" disabled={submitting}>
                                {submitting ? 'Enregistrement...' : <>Enregistrer</>}
                            </button>
                            <Link href="/files" className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2">
                                Annuler
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
Edit.layout = page => <AdminLayout children={page} />; 