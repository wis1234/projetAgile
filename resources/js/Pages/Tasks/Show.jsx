import React, { useEffect, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Link, usePage } from '@inertiajs/react';
import ActionButton from '../../Components/ActionButton';
import { FaTasks, FaUserCircle, FaProjectDiagram, FaFlagCheckered, FaUser, FaArrowLeft, FaFileUpload, FaCommentDots } from 'react-icons/fa';

export default function Show({ task }) {
  const { auth } = usePage().props;
  const isAssigned = auth?.user?.id === task.assigned_to;
  const isAdmin = auth?.user?.role === 'admin' || auth?.user?.is_admin;
  // Helpers
  const getStatusBadge = (status) => status ? <span className="capitalize px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-800">{status}</span> : <span className="italic text-gray-400">N/A</span>;
  const getPriorityBadge = (priority) => priority ? <span className="capitalize px-2 py-1 rounded text-xs font-bold bg-yellow-100 text-yellow-800">{priority}</span> : <span className="italic text-gray-400">Non définie</span>;

  // Commentaires
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/tasks/${task.id}/comments`)
      .then(res => res.json())
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setLoadingComments(false));
  }, [task.id]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    setPosting(true);
    setError('');
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
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
    const res = await fetch(`/api/tasks/${task.id}/comments/${commentId}`, {
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
    const res = await fetch(`/api/tasks/${task.id}/comments/${editingId}`, {
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

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-8">
        <FaTasks className="text-3xl text-blue-700 dark:text-blue-200" />
        <h1 className="text-3xl font-extrabold text-blue-700 dark:text-blue-200 tracking-tight drop-shadow">Détail de la tâche</h1>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6 mb-6">
          <div className="flex items-center gap-3">
            {task.assigned_user || task.assignedUser ? (
              <img src={(task.assigned_user?.profile_photo_url || task.assignedUser?.profile_photo_url) || (task.assigned_user?.profile_photo_path ? `/storage/${task.assigned_user.profile_photo_path}` : task.assignedUser?.profile_photo_path ? `/storage/${task.assignedUser.profile_photo_path}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(task.assigned_user?.name || task.assignedUser?.name || '')}`)} alt={task.assigned_user?.name || task.assignedUser?.name} className="w-16 h-16 rounded-full shadow border-2 border-blue-200" />
            ) : (
              <FaUserCircle className="w-16 h-16 text-gray-400" />
            )}
            <div>
              <div className="font-bold text-lg text-black dark:text-blue-100">{task.assigned_user?.name || task.assignedUser?.name || <span className="italic text-gray-400">Non assigné</span>}</div>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><span className="font-semibold">Titre :</span> {task.title}</div>
            <div><span className="font-semibold">Projet :</span> <span className="inline-flex items-center gap-1"><FaProjectDiagram className="text-blue-500" /> {task.project?.name || <span className="italic text-gray-400">Aucun</span>}</span></div>
            <div><span className="font-semibold">Sprint :</span> <span className="inline-flex items-center gap-1"><FaFlagCheckered className="text-green-600" /> {task.sprint?.name || <span className="italic text-gray-400">Aucun</span>}</span></div>
            <div><span className="font-semibold">Statut :</span> {getStatusBadge(task.status)}</div>
            <div><span className="font-semibold">Priorité :</span> {getPriorityBadge(task.priority)}</div>
            <div><span className="font-semibold">Date d'échéance :</span> {task.due_date ? new Date(task.due_date).toLocaleDateString() : <span className="italic text-gray-400">Non définie</span>}</div>
            <div><span className="font-semibold">Créée le :</span> {task.created_at ? new Date(task.created_at).toLocaleString() : 'N/A'}</div>
            <div><span className="font-semibold">Dernière modification :</span> {task.updated_at ? new Date(task.updated_at).toLocaleString() : 'N/A'}</div>
            <div className="md:col-span-2"><span className="font-semibold">Description :</span> {task.description || <span className="italic text-gray-400">Aucune</span>}</div>
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          {(isAssigned || isAdmin) && (
            <Link href={`/files/create?task_id=${task.id}&project_id=${task.project_id}`} className="bg-green-100 hover:bg-green-200 text-green-800 px-4 py-2 rounded shadow font-semibold flex items-center gap-2 transition"><FaFileUpload /> Uploader un fichier</Link>
          )}
          <Link href="/tasks" className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-5 py-3 rounded font-semibold flex items-center gap-2 transition"><FaArrowLeft /> Retour à la liste</Link>
        </div>
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
      </div>
    </div>
  );
}

Show.layout = page => <AdminLayout children={page} />; 