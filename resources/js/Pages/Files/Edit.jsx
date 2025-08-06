import React, { useState, useEffect } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { Link, usePage, useForm } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { FaArrowLeft, FaFileAlt } from 'react-icons/fa';
import { useRef } from 'react';

export default function Edit({ file, projects, users, tasks = [], kanbans = [] }) {
    const { errors, flash = {} } = usePage().props;
    const { auth } = usePage().props;
    const isAdmin = auth?.user?.role === 'admin';

    const { data, setData, put, processing, errors: formErrors, isDirty } = useForm({
        name: file.name || '',
        project_id: file.project_id || projects[0]?.id || '',
        user_id: file.user_id || users[0]?.id || '',
        task_id: file.task_id || '',
        kanban_id: file.kanban_id || '',
        description: file.description || '',
        status: file.status || 'pending',
        rejection_reason: file.rejection_reason || '',
        file: null,
    });

    const [notification, setNotification] = useState(null);
    const fileInputRef = useRef();

    useEffect(() => {
        if (flash.success) {
            setNotification({ type: 'success', message: flash.success });
        } else if (flash.error) {
            setNotification({ type: 'error', message: flash.error });
        }
    }, [flash]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setData(name, value);
    };

    const handleFileChange = (e) => {
        setData('file', e.target.files[0]);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('files.update', file.id), {
            onSuccess: () => {
                setNotification({ type: 'success', message: 'Fichier mis à jour avec succès' });
            },
            onError: () => {
                setNotification({ type: 'error', message: 'Erreur lors de la mise à jour' });
            }
        });
    };

    const handleClose = () => {
        if (isDirty) {
            if (window.confirm('Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter?')) {
                window.location.href = '/files';
            }
        } else {
            window.location.href = '/files';
        }
    };

    return (
        <div className="bg-white min-h-screen">
            <div className="w-full max-w-4xl mx-auto py-4">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => window.history.back()} className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-100 transition">
                        <FaArrowLeft className="text-xl" />
                    </button>
                    <FaFileAlt className="text-3xl text-blue-600" />
                    <h1 className="text-3xl font-extrabold text-blue-700 tracking-tight">Modifier le fichier</h1>
                </div>

                {/* Form Section */}
                <div className="bg-white rounded-lg shadow-md p-6 w-full">
                    {notification && (
                        <div className={`mb-4 px-4 py-3 rounded-lg text-white font-semibold ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                            {notification.message}
                        </div>
                    )}

                    {/* Current File Info */}
                    <div className="mb-6">
                        <span className="font-semibold">Fichier actuel :</span>{' '}
                        <a href={`/storage/${file.file_path}`} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline font-semibold">
                            Télécharger
                        </a>
                        {file.type && file.type.startsWith('image/') && (
                            <div className="mt-2">
                                <img src={`/storage/${file.file_path}`} alt={file.name} className="max-w-xs rounded shadow" />
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block font-semibold mb-1">Remplacer le fichier (optionnel)</label>
                            <input type="file" onChange={handleFileChange} className="input" />
                            {formErrors.file && <div className="text-red-500 text-sm mt-1">{formErrors.file}</div>}
                        </div>

                        <div>
                            <label className="block font-semibold mb-1">Nom du fichier</label>
                            <input type="text" name="name" value={data.name} onChange={handleChange} className="input" required />
                            {formErrors.name && <div className="text-red-500 text-sm mt-1">{formErrors.name}</div>}
                        </div>

                        <div>
                            <label className="block font-semibold mb-1">Projet</label>
                            <select name="project_id" value={data.project_id} onChange={handleChange} className="input" required>
                                {projects.map(project => (
                                    <option key={project.id} value={project.id}>{project.name}</option>
                                ))}
                            </select>
                            {formErrors.project_id && <div className="text-red-500 text-sm mt-1">{formErrors.project_id}</div>}
                        </div>

                        {isAdmin && (
                            <div>
                                <label className="block font-semibold mb-1">Utilisateur</label>
                                <select name="user_id" value={data.user_id} onChange={handleChange} className="input" required>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>{user.name}</option>
                                    ))}
                                </select>
                                {formErrors.user_id && <div className="text-red-500 text-sm mt-1">{formErrors.user_id}</div>}
                            </div>
                        )}

                        <div>
                            <label className="block font-semibold mb-1">Tâche liée (optionnel)</label>
                            <select name="task_id" value={data.task_id} onChange={handleChange} className="input">
                                <option value="">Aucune</option>
                                {tasks.map(task => (
                                    <option key={task.id} value={task.id}>{task.title}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block font-semibold mb-1">Kanban lié (optionnel)</label>
                            <select name="kanban_id" value={data.kanban_id} onChange={handleChange} className="input">
                                <option value="">Aucun</option>
                                {kanbans.map(kanban => (
                                    <option key={kanban.id} value={kanban.id}>{kanban.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block font-semibold mb-1">Description (optionnel)</label>
                            <textarea name="description" value={data.description} onChange={handleChange} className="input" rows={3}></textarea>
                        </div>

                        <div>
                            <label className="block font-semibold mb-1">Statut</label>
                            <select name="status" value={data.status} onChange={handleChange} className="input" required>
                                <option value="pending">En attente</option>
                                <option value="validated">Validé</option>
                                <option value="rejected">Rejeté</option>
                            </select>
                        </div>

                        {data.status === 'rejected' && (
                            <div>
                                <label className="block font-semibold mb-1">Motif du rejet</label>
                                <textarea name="rejection_reason" value={data.rejection_reason} onChange={handleChange} className="input" rows={2} required />
                                {formErrors.rejection_reason && <div className="text-red-500 text-sm mt-1">{formErrors.rejection_reason}</div>}
                            </div>
                        )}

                        <div className="flex gap-4 pt-4">
                            <button type="submit" className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg font-semibold shadow-md transition disabled:opacity-50" disabled={processing}>
                                {processing ? 'Enregistrement...' : 'Enregistrer les modifications'}
                            </button>
                            <button type="button" onClick={handleClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-semibold transition">
                                Fermer
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

Edit.layout = page => <AdminLayout children={page} />; 