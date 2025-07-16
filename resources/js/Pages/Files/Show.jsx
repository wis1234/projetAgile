import React, { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import ActionButton from '../../Components/ActionButton';
import { FaFileAlt, FaClock } from 'react-icons/fa';

export default function Show({ file, canUpdateStatus, statuses }) {
    const { flash = {} } = usePage().props;
    const fileUrl = `/storage/${file.file_path}`;
    const [status, setStatus] = useState(file.status);
    const [rejectionReason, setRejectionReason] = useState(file.rejection_reason || '');
    const [loading, setLoading] = useState(false);

    const handleStatusChange = (e) => {
        setStatus(e.target.value);
        if (e.target.value !== 'rejected') {
            setRejectionReason('');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        router.put(route('files.update', file.id), {
            name: file.name,
            project_id: file.project?.id,
            task_id: file.task?.id,
            kanban_id: file.kanban?.id,
            user_id: file.user?.id,
            description: file.description,
            status,
            rejection_reason: status === 'rejected' ? rejectionReason : null,
        }, {
            onFinish: () => setLoading(false)
        });
    };

    const statusBadge = (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            file.status === 'validated' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
            file.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
        }`}>
            {file.status}
        </span>
    );

    return (
        <AdminLayout>
            <div className="flex flex-col h-full w-full">
                <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 mt-8 mb-8">
                    <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-blue-700 dark:text-blue-200"><FaFileAlt /> Détail du fichier</h1>
                    {flash.success && <div className="alert alert-success mb-4">{flash.success}</div>}
                    <div className="mb-4 flex flex-col gap-2">
                        <div><span className="font-semibold">Nom :</span> <span className="text-blue-800 dark:text-blue-200">{file.name}</span></div>
                        <div><span className="font-semibold">Projet :</span> {file.project?.name || <span className="text-gray-400">-</span>}</div>
                        <div><span className="font-semibold">Tâche :</span> {file.task?.title || <span className="text-gray-400">-</span>}</div>
                        <div><span className="font-semibold">Utilisateur :</span> {file.user?.name || <span className="text-gray-400">-</span>}</div>
                        <div><span className="font-semibold">Taille :</span> <span className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-1 rounded text-xs font-mono">{file.size} o</span></div>
                        <div><span className="font-semibold">Statut :</span> {statusBadge}</div>
                        <div><span className="font-semibold">Date :</span> <span className="inline-flex items-center gap-1"><FaClock className="text-gray-400" /> {new Date(file.created_at).toLocaleString()}</span></div>
                        {file.description && <div><span className="font-semibold">Description :</span> <span className="italic text-gray-600 dark:text-gray-300">{file.description}</span></div>}
                    </div>
                    {canUpdateStatus && (
                        <form onSubmit={handleSubmit} className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded shadow">
                            <div className="mb-2">
                                <label className="font-semibold">Changer le statut :</label>
                                <select value={status} onChange={handleStatusChange} className="ml-2 px-2 py-1 rounded border">
                                    {statuses.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                            {status === 'rejected' && (
                                <div className="mb-2">
                                    <label className="font-semibold">Motif du rejet :</label>
                                    <input type="text" value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} className="ml-2 px-2 py-1 rounded border w-2/3" required={status === 'rejected'} />
                                </div>
                            )}
                            <button type="submit" className="mt-2" disabled={loading}>
                              <ActionButton variant="primary" type="submit" disabled={loading}>{loading ? 'Enregistrement...' : 'Enregistrer'}</ActionButton>
                            </button>
                        </form>
                    )}
                    <div className="flex gap-2 mt-6">
                        <Link href={route('files.download', file.id)} target="_blank" rel="noopener noreferrer">
                          <ActionButton variant="primary">Télécharger</ActionButton>
                        </Link>
                        {file.type && file.type.startsWith('image/') && (
                          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                            <ActionButton variant="info">Prévisualiser</ActionButton>
                          </a>
                        )}
                        <Link href={route('files.edit', file.id)}>
                          <ActionButton variant="warning">Éditer</ActionButton>
                        </Link>
                        <Link href={route('files.index')}>
                          <ActionButton variant="default">Retour</ActionButton>
                        </Link>
                    </div>
                    {file.type && file.type.startsWith('image/') && (
                      <div className="mt-6">
                        <img src={fileUrl} alt={file.name} className="max-w-full rounded shadow" />
                      </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
} 