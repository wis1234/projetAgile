import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import ActionButton from '../../Components/ActionButton';
import { FaFileAlt, FaClock, FaCommentDots } from 'react-icons/fa';

export default function Show({ file, canUpdateStatus, statuses }) {
    const { flash = {} } = usePage().props;
    const fileUrl = `/storage/${file.file_path}`;
    const [status, setStatus] = useState(file.status);
    const [rejectionReason, setRejectionReason] = useState(file.rejection_reason || '');
    const [loading, setLoading] = useState(false);

    // Commentaires
    const [comments, setComments] = useState([]);
    const [loadingComments, setLoadingComments] = useState(true);
    const [commentContent, setCommentContent] = useState('');
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState('');
    const { auth } = usePage().props;

    useEffect(() => {
        fetch(`/api/files/${file.id}/comments`)
            .then(res => res.json())
            .then(setComments)
            .catch(() => setComments([]))
            .finally(() => setLoadingComments(false));
    }, [file.id]);

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

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        setPosting(true);
        setError('');
        try {
            const res = await fetch(`/api/files/${file.id}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
                body: JSON.stringify({ content: commentContent })
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.message || JSON.stringify(data) || 'Erreur lors de l\'envoi');
                console.error('Erreur serveur:', data);
            } else {
                setComments([...comments, data]);
                setCommentContent('');
            }
        } catch (e) {
            setError(e.message || 'Erreur lors de l\'envoi');
            console.error('Erreur JS:', e);
        }
        setPosting(false);
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Supprimer ce commentaire ?')) return;
        const res = await fetch(`/api/files/${file.id}/comments/${commentId}`, {
            method: 'DELETE',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
            },
        });
        if (res.ok) setComments(comments.filter(c => c.id !== commentId));
    };

    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const handleEditComment = (comment) => {
        setEditingId(comment.id);
        setEditContent(comment.content);
    };
    const handleUpdateComment = async (e) => {
        e.preventDefault();
        const res = await fetch(`/api/files/${file.id}/comments/${editingId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
            },
            body: JSON.stringify({ content: editContent })
        });
        if (res.ok) {
            const updated = await res.json();
            setComments(comments.map(c => c.id === updated.id ? updated : c));
            setEditingId(null);
            setEditContent('');
        }
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
                    {/* Section Commentaires */}
                    <div className="mt-10">
                        <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-blue-700 dark:text-blue-200"><FaCommentDots /> Commentaires</h2>
                        {loadingComments ? (
                            <div className="text-gray-400">Chargement des commentaires...</div>
                        ) : (
                            <div>
                                {comments.length === 0 ? (
                                    <div className="text-gray-400 italic">Aucun commentaire pour l'instant.</div>
                                ) : (
                                    <ul className="space-y-4 mb-6">
                                        {comments.map(comment => (
                                            <li key={comment.id} className="bg-blue-50 dark:bg-blue-900 rounded p-3 shadow flex gap-3">
                                                <img src={comment.user?.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user?.name || '')}`} alt={comment.user?.name} className="w-8 h-8 rounded-full border-2 border-blue-200" />
                                                <div className="flex-1">
                                                    <div className="font-semibold text-blue-800 dark:text-blue-200">{comment.user?.name}</div>
                                                    <div className="text-gray-600 dark:text-gray-300 text-sm mb-1">{new Date(comment.created_at).toLocaleString()}</div>
                                                    {editingId === comment.id ? (
                                                        <form onSubmit={handleUpdateComment} className="flex flex-col gap-2">
                                                            <textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="border rounded p-2 w-full min-h-[60px] focus:ring-2 focus:ring-blue-400" required maxLength={2000} />
                                                            <div className="flex gap-2">
                                                                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded">Enregistrer</button>
                                                                <button type="button" className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded" onClick={() => setEditingId(null)}>Annuler</button>
                                                            </div>
                                                        </form>
                                                    ) : (
                                                        <div className="text-gray-900 dark:text-gray-100">{comment.content}</div>
                                                    )}
                                                </div>
                                                {comment.user?.id === auth.user.id && editingId !== comment.id && (
                                                    <div className="flex flex-col gap-1 ml-2">
                                                        <button onClick={() => handleEditComment(comment)} className="text-xs text-yellow-700 hover:underline">Éditer</button>
                                                        <button onClick={() => handleDeleteComment(comment.id)} className="text-xs text-red-600 hover:underline">Supprimer</button>
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                <form onSubmit={handleCommentSubmit} className="flex flex-col gap-2">
                                    <textarea
                                        value={commentContent}
                                        onChange={e => setCommentContent(e.target.value)}
                                        placeholder="Ajouter un commentaire..."
                                        className="border rounded p-2 w-full min-h-[60px] focus:ring-2 focus:ring-blue-400"
                                        disabled={posting}
                                        required
                                        maxLength={2000}
                                    />
                                    {error && <div className="text-red-500 text-sm">{error}</div>}
                                    <button type="submit" className="self-end bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded font-semibold shadow flex items-center gap-2" disabled={posting || !commentContent.trim()}>
                                        {posting ? 'Envoi...' : 'Commenter'}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
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