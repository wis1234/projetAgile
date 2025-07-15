import React, { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import ActionButton from '../../Components/ActionButton';

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

    return (
        <AdminLayout>
            <div className="flex flex-col h-full w-full">
                <div className="max-w-xl w-full mx-auto bg-white dark:bg-gray-800 rounded shadow">
                    <h1 className="text-2xl font-bold mb-4 text-blue-700 dark:text-blue-200">Détail du fichier</h1>
                    {flash.success && <div className="alert alert-success mb-4">{flash.success}</div>}
                    <div className="mb-4 space-y-2">
                        <div><span className="font-semibold">Nom :</span> {file.name}</div>
                        <div><span className="font-semibold">Projet :</span> {file.project?.name || '-'}</div>
                        <div><span className="font-semibold">Tâche :</span> {file.task?.title || '-'}</div>
                        <div><span className="font-semibold">Kanban :</span> {file.kanban?.name || '-'}</div>
                        <div><span className="font-semibold">Utilisateur :</span> {file.user?.name || '-'}</div>
                        <div><span className="font-semibold">Description :</span> {file.description || <span className="italic text-gray-400">Aucune</span>}</div>
                        <div><span className="font-semibold">Statut :</span> <span className={`capitalize px-2 py-1 rounded ${file.status === 'validated' ? 'bg-green-100 text-green-800' : file.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{file.status}</span></div>
                        {file.status === 'rejected' && (
                          <div><span className="font-semibold">Motif du rejet :</span> <span className="text-red-600">{file.rejection_reason}</span></div>
                        )}
                        <div><span className="font-semibold">Créé le :</span> {new Date(file.created_at).toLocaleString()}</div>
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
                    <div className="flex gap-2 mt-4">
                        <a href={route('files.download', file.id)} target="_blank" rel="noopener noreferrer">
                          <ActionButton variant="primary">Télécharger</ActionButton>
                        </a>
                        {file.type && file.type.startsWith('image/') && (
                          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                            <ActionButton variant="info">Prévisualiser</ActionButton>
                          </a>
                        )}
                        <Link href={route('files.edit', file.id)}>
                          <ActionButton variant="warning">Éditer</ActionButton>
                        </Link>
                        <Link href="/files">
                          <ActionButton variant="default">Retour à la liste</ActionButton>
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