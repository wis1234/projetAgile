import React, { useEffect, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Link, usePage } from '@inertiajs/react';
import ActionButton from '../../Components/ActionButton';
import { FaTasks, FaUserCircle, FaProjectDiagram, FaFlagCheckered, FaUser, FaArrowLeft, FaFileUpload, FaCommentDots, FaDownload } from 'react-icons/fa';

export default function Show({ task, payment }) {
  const { auth } = usePage().props;
  const isAssigned = auth?.user?.id === task.assigned_to;
  const isAdmin = auth?.user?.role === 'admin' || auth?.user?.is_admin;
  const isProjectManager = task.project?.users?.some(
    u => u.id === auth.user.id && u.pivot?.role === 'manager'
  );

  // Helpers
  const getStatusBadge = (status) => status ? <span className="capitalize px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-800">{status}</span> : <span className="italic text-gray-400">N/A</span>;
  const getPriorityBadge = (priority) => priority ? <span className="capitalize px-2 py-1 rounded text-xs font-bold bg-yellow-100 text-yellow-800">{priority}</span> : <span className="italic text-gray-400">Non définie</span>;

  // Commentaires
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState(payment?.payment_method || '');
  const [phoneNumber, setPhoneNumber] = useState(payment?.phone_number || '');
  const [paymentStatus, setPaymentStatus] = useState(payment?.status || 'pending');
  const [paymentError, setPaymentError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [validationLoading, setValidationLoading] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  // Fonction manquante pour soumettre un commentaire
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    
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
        body: JSON.stringify({ content: commentContent }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.message || 'Erreur lors de l\'ajout du commentaire');
        return;
      }
      
      const newComment = await res.json();
      setComments([...comments, newComment]);
      setCommentContent('');
    } catch (e) {
      setError(e.message || 'Erreur lors de l\'ajout du commentaire');
    } finally {
      setPosting(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setPaymentLoading(true);
    setPaymentError('');
    try {
      const res = await fetch(`/tasks/${task.id}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        },
        body: JSON.stringify({ payment_method: paymentMethod, phone_number: phoneNumber }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPaymentError(data.message || 'Erreur lors de la sauvegarde du paiement');
      } else {
        setPaymentStatus(data.status);
      }
    } catch (e) {
      setPaymentError(e.message || 'Erreur lors de la sauvegarde du paiement');
    }
    setPaymentLoading(false);
  };

  const handleValidatePayment = async () => {
    if (!window.confirm('Valider le paiement ?')) return;
    setValidationLoading(true);
    setValidationMessage('');
    try {
      const res = await fetch(`/tasks/${task.id}/payment/validate`, {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        },
      });
      const data = await res.json();
      if (!res.ok) {
        setValidationMessage(data.message || 'Erreur lors de la validation');
      } else {
        setPaymentStatus('validated');
        setValidationMessage('Paiement validé avec succès.');
      }
    } catch (e) {
      setValidationMessage(e.message || 'Erreur lors de la validation');
    }
    setValidationLoading(false);
  };

  useEffect(() => {
    setPaymentMethod(payment?.payment_method || '');
    setPhoneNumber(payment?.phone_number || '');
    setPaymentStatus(payment?.status || 'pending');
  }, [payment]);

  useEffect(() => {
    fetch(`/api/tasks/${task.id}/comments`)
      .then(res => res.json())
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setLoadingComments(false));
  }, [task.id]);

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
    <div className="flex flex-col w-full bg-white dark:bg-gray-900 p-0 m-0">
      <div className="flex flex-col w-full max-w-7xl mx-auto pt-4 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3 mb-8">
          <FaTasks className="text-3xl text-blue-600" />
          <h1 className="text-3xl font-extrabold text-blue-700 dark:text-blue-200 tracking-tight">Détail de la tâche</h1>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6 mb-6">
            <div className="flex items-center gap-3">
              {Array.isArray(task.assigned_users) && task.assigned_users.length > 0 ? (
                <div className="flex flex-col gap-1">
                  <span className="font-semibold">Assigné à :</span>
                  <ul>
                    {task.assigned_users.map(u => (
                      <li key={u.id} className="flex items-center gap-2">
                        <img src={u.profile_photo_url || (u.profile_photo_path ? `/storage/${u.profile_photo_path}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}`)} alt={u.name} className="w-8 h-8 rounded-full border-2 border-blue-200" />
                        <span className="font-bold text-blue-700 dark:text-blue-200">{u.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
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
              )}
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><span className="font-semibold">Titre :</span> {task.title}</div>
              <div><span className="font-semibold">Projet :</span> <span className="inline-flex items-center gap-1"><FaProjectDiagram className="text-blue-500" /> {task.project ? <Link href={`/projects/${task.project.id}`} className="underline hover:text-blue-800">{task.project.name}</Link> : <span className="italic text-gray-400">Aucun</span>}</span></div>
              <div><span className="font-semibold">Sprint :</span> <span className="inline-flex items-center gap-1"><FaFlagCheckered className="text-blue-600" /> {task.sprint ? <Link href={`/sprints/${task.sprint.id}`} className="underline hover:text-blue-800">{task.sprint.name}</Link> : <span className="italic text-gray-400">Aucun</span>}</span></div>
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
        </div>

        {/* Payment Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-blue-700 dark:text-blue-200">💳 Moyen de paiement mobile</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formulaire ou informations en lecture seule */}
            <div>
              {(isAssigned || isAdmin) && paymentStatus !== 'validated' ? (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
                    {paymentMethod ? 'Modifier les informations' : 'Enregistrer les informations de paiement'}
                  </h3>
                  <form onSubmit={handlePaymentSubmit} className="flex flex-col gap-4">
                    <div>
                      <label htmlFor="payment_method" className="block font-semibold mb-2 text-gray-700 dark:text-gray-300">Choisir le moyen de paiement</label>
                      <select
                        id="payment_method"
                        value={paymentMethod}
                        onChange={e => setPaymentMethod(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      >
                        <option value="">-- Sélectionner --</option>
                        <option value="mtn">MTN Mobile Money</option>
                        <option value="moov">Moov Money</option>
                        <option value="celtis">Celtis Cash</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="phone_number" className="block font-semibold mb-2 text-gray-700 dark:text-gray-300">Numéro de téléphone</label>
                      <input
                        type="text"
                        id="phone_number"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Ex: +229 XX XX XX XX"
                        required
                      />
                    </div>
                    {paymentError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {paymentError}
                      </div>
                    )}
                    <button 
                      type="submit" 
                      disabled={paymentLoading} 
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      {paymentLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          💾 {paymentMethod ? 'Mettre à jour' : 'Enregistrer'}
                        </>
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Informations de paiement</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-600 dark:text-gray-300 mb-2">
                      <strong>Moyen de paiement :</strong> 
                      <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {paymentMethod.toUpperCase()}
                      </span>
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 mb-2">
                      <strong>Numéro de téléphone :</strong> 
                      <span className="ml-2 font-mono text-gray-800 dark:text-gray-200">{phoneNumber}</span>
                    </p>
                    <p className="text-gray-600 dark:text-gray-300">
                      <strong>Statut du paiement :</strong> 
                      {paymentStatus === 'validated' ? (
                        <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          ✅ Validé
                        </span>
                      ) : (
                        <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          ⏳ En attente
                        </span>
                      )}
                    </p>
                  </div>
                  {(paymentStatus !== 'validated' && (isAdmin || isProjectManager)) && (
                    <button 
                      onClick={handleValidatePayment} 
                      disabled={validationLoading} 
                      className="mt-4 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2"
                    >
                      {validationLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Validation...
                        </>
                      ) : (
                        <>
                          ✅ Valider le paiement
                        </>
                      )}
                    </button>
                  )}
                  {validationMessage && (
                    <div className="mt-3 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                      {validationMessage}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Carte d'information à côté */}
            {paymentMethod && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl">💳</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-blue-800 dark:text-blue-200">Informations de paiement</h3>
                    <p className="text-blue-600 dark:text-blue-300 text-sm">Détails enregistrés</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <span className="text-gray-600 dark:text-gray-300 font-medium">Opérateur</span>
                    <span className="font-bold text-blue-700 dark:text-blue-300">
                      {paymentMethod === 'mtn' && '📱 MTN Mobile Money'}
                      {paymentMethod === 'moov' && '📱 Moov Money'}
                      {paymentMethod === 'celtis' && '📱 Celtis Cash'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <span className="text-gray-600 dark:text-gray-300 font-medium">Numéro</span>
                    <span className="font-mono text-gray-800 dark:text-gray-200 font-semibold">{phoneNumber}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <span className="text-gray-600 dark:text-gray-300 font-medium">Statut</span>
                    <div>
                      {paymentStatus === 'validated' ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-500 text-white">
                          ✅ Validé
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-yellow-500 text-white">
                          ⏳ En attente
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {paymentStatus === 'validated' && (
                  <div className="mt-4 p-3 bg-green-100 dark:bg-green-900 rounded-lg border border-green-300 dark:border-green-700">
                    <p className="text-green-800 dark:text-green-200 text-sm font-medium text-center">
                      🎉 Paiement confirmé et validé
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Section Ressources */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-blue-700 dark:text-blue-200"><FaFileUpload /> Ressources</h2>
          {task.files && task.files.length > 0 ? (
            <ul className="space-y-3">
              {task.files.map(file => (
                <li key={file.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition" onClick={() => window.location.href = `/files/${file.id}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-blue-600">{file.name}</div>
                      {file.user && (file.user.role === 'manager' || file.user.role === 'admin') ? (
                        <span className="inline-block bg-green-200 text-green-800 text-xs font-semibold px-2 py-0.5 rounded-full">Manager/Admin</span>
                      ) : (
                        <span className="inline-block bg-blue-200 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">Membre</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">{file.description || <span className="italic text-gray-400">Aucune description</span>}</div>
                    <div className="text-sm text-gray-500">{file.size} bytes</div>
                  </div>
                  <a href={`/files/${file.id}/download`} onClick={e => e.stopPropagation()} className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-100 transition">
                    <FaDownload />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">Aucun fichier rattaché à cette tâche.</p>
          )}
        </div>

        {/* Section Commentaires */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
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