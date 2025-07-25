import React, { useEffect, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Link, usePage, router } from '@inertiajs/react';
import ActionButton from '../../Components/ActionButton';
import { FaTasks, FaUserCircle, FaProjectDiagram, FaFlagCheckered, FaUser, FaArrowLeft, FaFileUpload, FaCommentDots, FaDownload, FaInfoCircle, FaEdit, FaTrash } from 'react-icons/fa';
import Modal from '@/Components/Modal';

export default function Show({ task, payments, projectMembers }) {
  const { auth } = usePage().props;
  const isAssigned = auth?.user?.id === task.assigned_to;
  const isAdmin = auth?.user?.role === 'admin' || auth?.user?.is_admin;
  const isProjectManager = task.project?.users?.some(
    u => u.id === auth.user.id && u.pivot?.role === 'manager'
  );
  const isProjectMember = task.project?.users?.some(u => u.id === auth.user.id);

  // For adding payment for other members
  const [selectedMemberId, setSelectedMemberId] = useState(auth.user.id); // Default to current user

  // Derived state for the currently displayed payment info (either own or selected member's)
  const displayedPayment = (isAdmin || isProjectManager) && selectedMemberId
    ? payments.find(p => p.user_id == selectedMemberId)
    : payments.find(p => p.user_id === auth.user.id);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState(displayedPayment?.payment_method || '');
  const [phoneNumber, setPhoneNumber] = useState(displayedPayment?.phone_number || '');
  const [paymentStatus, setPaymentStatus] = useState(displayedPayment?.status || 'pending');
  const [paymentError, setPaymentError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [validationLoading, setValidationLoading] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [showConfirmValidationModal, setShowConfirmValidationModal] = useState(false);
  const [paymentToValidateId, setPaymentToValidateId] = useState(null);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);

  useEffect(() => {
    // When the component loads, if it's a manager/admin, default selected member to current user
    if (isAdmin || isProjectManager) {
      setSelectedMemberId(auth.user.id);
    }
  }, [isAdmin, isProjectManager, auth.user.id]);

  useEffect(() => {
    setPaymentMethod(displayedPayment?.payment_method || '');
    setPhoneNumber(displayedPayment?.phone_number || '');
    setPaymentStatus(displayedPayment?.status || 'pending');
  }, [displayedPayment]);

  // Helpers
  const getStatusBadge = (status) => {
    switch (status) {
      case 'in_progress':
        return <span className="capitalize px-2 py-1 rounded text-xs font-bold bg-yellow-100 text-yellow-800">En cours</span>;
      case 'todo':
        return <span className="capitalize px-2 py-1 rounded text-xs font-bold bg-gray-100 text-gray-800">À faire</span>;
      case 'done':
        return <span className="capitalize px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-800">Terminé</span>;
      default:
        return <span className="italic text-gray-400">N/A</span>;
    }
  };
  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'low':
        return <span className="capitalize px-2 py-1 rounded text-xs font-bold bg-gray-100 text-gray-800">Faible</span>;
      case 'medium':
        return <span className="capitalize px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-800">Moyenne</span>;
      case 'high':
        return <span className="capitalize px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-800">Élevée</span>;
      default:
        return <span className="italic text-gray-400">Non définie</span>;
    }
  };

  // Commentaires
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

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
        body: JSON.stringify({ payment_method: paymentMethod, phone_number: phoneNumber, user_id: selectedMemberId }),
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

  const handleValidatePayment = async (paymentId) => {
    setPaymentToValidateId(paymentId);
    setShowConfirmValidationModal(true);
  };

  const confirmPaymentValidation = async () => {
    setShowConfirmValidationModal(false);
    if (!paymentToValidateId) return;

    setValidationLoading(true);
    setValidationMessage('');
    try {
      const res = await fetch(`/tasks/${task.id}/payment/validate/${paymentToValidateId}`, {
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
        setValidationMessage('Paiement validé avec succès.');
        window.location.reload(); // Simple refresh to reflect changes
      }
    } catch (e) {
      setValidationMessage(e.message || 'Erreur lors de la validation');
    }
    setValidationLoading(false);
    setPaymentToValidateId(null);
  };

  const handleDeleteTask = () => {
    setShowConfirmDeleteModal(true);
  };

  const confirmDeleteTask = () => {
    setShowConfirmDeleteModal(false);
    router.delete(route('tasks.destroy', task.id), {
      onSuccess: () => {
        // Redirect to tasks index page after successful deletion
        router.visit(route('tasks.index'));
      },
      onError: (errors) => {
        alert('Erreur lors de la suppression de la tâche: ' + (errors.message || 'Erreur inconnue'));
      },
    });
  };

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
    <div className="flex flex-col w-full bg-white dark:bg-gray-950 p-0 m-0 min-h-screen">
      <div className="flex flex-col w-full py-8 px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-8">
          <FaTasks className="text-4xl text-blue-600 dark:text-blue-400" />
          <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight">Détail de la tâche</h1>
          <Link href="/tasks" className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition duration-200 hover:shadow-md">
            <FaArrowLeft /> Retour à la liste
          </Link>
        </div>

        {/* Main Task Details Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 mb-8 border border-gray-200 dark:border-gray-700 transition duration-200 hover:shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mb-6">
            {/* Assigned User */}
            <div className="flex items-center gap-4">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Assigné à :</span>
              {Array.isArray(task.assigned_users) && task.assigned_users.length > 0 ? (
                <div className="flex flex-col gap-1">
                  <ul>
                    {task.assigned_users.map(u => (
                      <li key={u.id} className="flex items-center gap-2">
                        <img src={u.profile_photo_url || (u.profile_photo_path ? `/storage/${u.profile_photo_path}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}`)} alt={u.name} className="w-10 h-10 rounded-full border-2 border-blue-300 dark:border-blue-600" />
                        <span className="font-bold text-blue-700 dark:text-blue-200 text-lg">{u.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  {task.assigned_user || task.assignedUser ? (
                    <img src={(task.assigned_user?.profile_photo_url || task.assignedUser?.profile_photo_url) || (task.assigned_user?.profile_photo_path ? `/storage/${task.assigned_user.profile_photo_path}` : task.assignedUser?.profile_photo_path ? `/storage/${task.assignedUser.profile_photo_path}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(task.assigned_user?.name || task.assignedUser?.name || '')}`)} alt={task.assigned_user?.name || task.assignedUser?.name} className="w-10 h-10 rounded-full border-2 border-blue-300 dark:border-blue-600 transition duration-200 hover:shadow-md" />
                  ) : (
                    <FaUserCircle className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                  )}
                    <div className="font-bold text-lg text-black dark:text-blue-100">{task.assigned_user?.name || task.assignedUser?.name || <span className="italic text-gray-400">Non assigné</span>}</div>
                </div>
              )}
            </div>

            {/* Task Title */}
            <div className="flex items-center gap-4">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Titre :</span> 
              <span className="text-gray-900 dark:text-gray-100 text-lg font-medium">{task.title}</span>
            </div>

            {/* Project */}
            <div className="flex items-center gap-4">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Projet :</span> 
              <Link href={`/projects/${task.project.id}`} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200 text-lg">
                <FaProjectDiagram /> {task.project ? task.project.name : <span className="italic text-gray-400">Aucun</span>}
              </Link>
            </div>

            {/* Sprint */}
            <div className="flex items-center gap-4">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Sprint :</span> 
              <Link href={`/sprints/${task.sprint.id}`} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200 text-lg">
                <FaFlagCheckered /> {task.sprint ? task.sprint.name : <span className="italic text-gray-400">Aucun</span>}
              </Link>
            </div>

            {/* Status */}
            <div className="flex items-center gap-4">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Statut :</span> 
              {getStatusBadge(task.status)}
            </div>

            {/* Priority */}
            <div className="flex items-center gap-4">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Priorité :</span> 
              {getPriorityBadge(task.priority)}
            </div>

            {/* Due Date */}
            <div className="flex items-center gap-4">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Date d'échéance :</span> 
              <span className="text-gray-900 dark:text-gray-100">{task.due_date ? new Date(task.due_date).toLocaleDateString() : <span className="italic text-gray-400">Non définie</span>}</span>
            </div>
            
            {/* Created At */}
            <div className="flex items-center gap-4">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Créée le :</span> 
              <span className="text-gray-900 dark:text-gray-100">{task.created_at ? new Date(task.created_at).toLocaleString() : 'N/A'}</span>
            </div>
            
            {/* Last Modified */}
            <div className="flex items-center gap-4">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Dernière modification :</span> 
              <span className="text-gray-900 dark:text-gray-100">{task.updated_at ? new Date(task.updated_at).toLocaleString() : 'N/A'}</span>
            </div>
          </div>

          {/* Description */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-3">Description</h3>
            <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
              {task.description || <span className="italic text-gray-400">Aucune description</span>}
            </p>
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            {(isAssigned || isAdmin) && (
              <Link href={`/files/create?task_id=${task.id}&project_id=${task.project_id}`} className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg font-semibold flex items-center gap-2 transition duration-200 hover:shadow-md">
                <FaFileUpload /> Uploader un fichier
              </Link>
            )}
            {(isAdmin || isProjectManager) && (
              <Link href={`/tasks/${task.id}/edit`} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold flex items-center gap-2 transition duration-200 hover:shadow-md">
                <FaTasks /> Modifier la tâche
              </Link>
            )}
            {(isAdmin || isProjectManager) && (
              <button
                onClick={handleDeleteTask}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-lg font-semibold flex items-center gap-2 transition duration-200 hover:shadow-md"
              >
                <FaTrash /> Supprimer la tâche
              </button>
            )}
          </div>
        </div>

        {/* Payment Section - Current User's Payment */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 mb-8 border border-gray-200 dark:border-gray-700 transition duration-200 hover:shadow-lg">
          <h2 className="text-2xl font-bold flex items-center gap-3 mb-6 text-blue-700 dark:text-blue-200">💳 Votre Moyen de Paiement Mobile</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Formulaire ou informations en lecture seule pour l'utilisateur courant */}
            <div className="lg:col-span-1">
              {((isAssigned || isAdmin || isProjectMember) && displayedPayment?.status !== 'validated') ? (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600 transition duration-200 hover:shadow-sm">
                  <h3 className="text-xl font-semibold mb-5 text-gray-800 dark:text-gray-200">
                    {displayedPayment ? 'Modifier les informations de paiement' : 'Enregistrer les informations de paiement'}
                  </h3>
                  <form onSubmit={handlePaymentSubmit} className="flex flex-col gap-5">
                    {(isAdmin || isProjectManager) && (
                      <div>
                        <label htmlFor="member_select" className="block font-semibold mb-2 text-gray-700 dark:text-gray-300">Membre</label>
                        <select
                          id="member_select"
                          value={selectedMemberId}
                          onChange={e => setSelectedMemberId(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200"
                        >
                          {projectMembers && projectMembers.map(member => (
                            <option key={member.id} value={member.id}>{member.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label htmlFor="payment_method" className="block font-semibold mb-2 text-gray-700 dark:text-gray-300">Choisir le moyen de paiement</label>
                      <select
                        id="payment_method"
                        value={paymentMethod}
                        onChange={e => setPaymentMethod(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200"
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
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200"
                        placeholder="Ex: +229 XX XX XX XX"
                        required
                      />
                    </div>
                    {paymentError && (
                      <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg text-sm">
                        {paymentError}
                      </div>
                    )}
                    <button 
                      type="submit" 
                      disabled={paymentLoading} 
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2 hover:shadow-md w-full"
                    >
                      {paymentLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          💾 {displayedPayment ? 'Mettre à jour' : 'Enregistrer'}
                        </>
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600 transition duration-200 hover:shadow-sm">
                  <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Vos informations de paiement</h3>
                  {displayedPayment ? (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
                      <p className="text-gray-600 dark:text-gray-300 mb-2 flex items-center">
                        <strong className="mr-2">Moyen de paiement :</strong> 
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {displayedPayment.payment_method.toUpperCase()}
                        </span>
                      </p>
                      <p className="text-gray-600 dark:text-gray-300 mb-2 flex items-center">
                        <strong className="mr-2">Numéro de téléphone :</strong> 
                        <span className="font-mono text-gray-800 dark:text-gray-200 text-base">{displayedPayment.phone_number}</span>
                      </p>
                      <p className="text-gray-600 dark:text-gray-300 flex items-center">
                        <strong className="mr-2">Statut du paiement :</strong> 
                        {displayedPayment.status === 'validated' ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            ✅ Validé
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            ⏳ En attente
                          </span>
                        )}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-5 border border-blue-200 dark:border-blue-700 flex items-center gap-3">
                      <FaInfoCircle className="text-blue-600 dark:text-blue-300 text-xl" />
                      <p className="text-blue-800 dark:text-blue-200 italic">Aucune information de paiement enregistrée pour cette tâche.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Carte d'information à côté (Always shows current user's info if available) */}
            <div className="lg:col-span-2">
              {displayedPayment && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-xl p-6 border border-blue-200 dark:border-blue-700 transition duration-200 hover:shadow-md h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center hover:shadow-lg">
                        <span className="text-white text-2xl">💳</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200">Résumé de votre paiement</h3>
                        <p className="text-blue-600 dark:text-blue-300 text-sm">Détails enregistrés</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 transition duration-200 hover:shadow-sm">
                        <span className="text-gray-600 dark:text-gray-300 font-medium">Opérateur</span>
                        <span className="font-bold text-blue-700 dark:text-blue-300 text-base">
                          {displayedPayment.payment_method === 'mtn' && '📱 MTN Mobile Money'}
                          {displayedPayment.payment_method === 'moov' && '📱 Moov Money'}
                          {displayedPayment.payment_method === 'celtis' && '📱 Celtis Cash'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 transition duration-200 hover:shadow-sm">
                        <span className="text-gray-600 dark:text-gray-300 font-medium">Numéro</span>
                        <span className="font-mono text-gray-800 dark:text-gray-200 font-semibold text-base">{displayedPayment.phone_number}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 transition duration-200 hover:shadow-sm">
                        <span className="text-gray-600 dark:text-gray-300 font-medium">Statut</span>
                        <div>
                          {displayedPayment.status === 'validated' ? (
                            <span className="inline-flex items-center px-4 py-1 rounded-full text-base font-bold bg-green-500 text-white">
                              ✅ Validé
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-4 py-1 rounded-full text-base font-bold bg-yellow-500 text-white">
                              ⏳ En attente
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {displayedPayment.status === 'validated' && (
                      <div className="mt-5 p-4 bg-green-100 dark:bg-green-900 rounded-lg border border-green-300 dark:border-green-700">
                        <p className="text-green-800 dark:text-green-200 text-sm font-medium text-center flex items-center justify-center gap-2">
                          <span className="text-lg">🎉</span> Paiement confirmé et validé
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          {validationMessage && (
            <div className="mt-6 bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg text-sm">
              {validationMessage}
            </div>
          )}
        </div>

        {/* Section de tous les paiements (visible pour Admin/Manager) */}
        {(isAdmin || isProjectManager) && payments.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 mb-8 border border-gray-200 dark:border-gray-700 transition duration-200 hover:shadow-lg">
            <h2 className="text-2xl font-bold flex items-center gap-3 mb-6 text-blue-700 dark:text-blue-200">💰 Toutes les Informations de Paiement</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {payments.map(p => (
                <div key={p.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600 flex flex-col justify-between transition duration-200 hover:shadow-sm">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                      <img src={p.user?.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.user?.name || '')}`} alt={p.user?.name} className="w-10 h-10 rounded-full border-2 border-blue-200" />
                      <span className="font-bold text-gray-900 dark:text-gray-100 text-lg">{p.user?.name}</span>
                      {p.user?.id === auth.user.id && <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Moi</span>}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-2">
                      <strong className="mr-2">Moyen :</strong> 
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {p.payment_method.toUpperCase()}
                      </span>
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 mb-2">
                      <strong className="mr-2">Numéro :</strong> 
                      <span className="font-mono text-gray-800 dark:text-gray-200 text-base">{p.phone_number}</span>
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      <strong className="mr-2">Statut :</strong> 
                      {p.status === 'validated' ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          ✅ Validé
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          ⏳ En attente
                        </span>
                      )}
                    </p>
                  </div>
                  
                  {p.status !== 'validated' && (isAdmin || isProjectManager) && (
                    <button 
                      onClick={() => handleValidatePayment(p.id)} 
                      disabled={validationLoading} 
                      className="mt-4 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 justify-center w-full hover:shadow-md"
                    >
                      {validationLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Validation...
                        </>
                      ) : (
                        <>
                          ✅ Valider ce paiement
                        </>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
            {payments.length === 0 && (
              <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-5 border border-blue-200 dark:border-blue-700 flex items-center gap-3">
                <FaInfoCircle className="text-blue-600 dark:text-blue-300 text-xl" />
                <p className="text-blue-800 dark:text-blue-200 italic">Aucune information de paiement enregistrée pour cette tâche par les membres.</p>
              </div>
            )}
          </div>
        )}

        {/* Section Ressources */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 mb-8 border border-gray-200 dark:border-gray-700 transition duration-200 hover:shadow-lg">
          <h2 className="text-2xl font-bold flex items-center gap-3 mb-6 text-blue-700 dark:text-blue-200"><FaFileUpload /> Ressources</h2>
          {task.files && task.files.length > 0 ? (
            <ul className="space-y-4">
              {task.files.map(file => (
                <li key={file.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-4 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition duration-200 border border-gray-200 dark:border-gray-600 group hover:shadow-sm">
                  <div className="flex items-center gap-4">
                    <a href={`/files/${file.id}/download`} onClick={e => e.stopPropagation()} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded-full bg-blue-100 dark:bg-blue-800 group-hover:bg-blue-200 dark:group-hover:bg-blue-700 transition">
                      <FaDownload className="text-lg" />
                    </a>
                  <div>
                      <div className="font-semibold text-blue-600 dark:text-blue-300 text-lg group-hover:underline">{file.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{file.description || <span className="italic text-gray-400">Aucune description</span>}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{Math.round(file.size / 1024)} KB</div>
                    </div>
                  </div>
                  {file.user && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <img src={file.user?.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(file.user?.name || '')}`} alt={file.user?.name} className="w-6 h-6 rounded-full" />
                      {file.user.name}
                      {file.user.role === 'manager' || file.user.role === 'admin' ? (
                        <span className="inline-block bg-green-200 text-green-800 text-xs font-semibold px-2 py-0.5 rounded-full">Manager/Admin</span>
                      ) : (
                        <span className="inline-block bg-blue-200 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">Membre</span>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-5 border border-blue-200 dark:border-blue-700 flex items-center gap-3">
              <FaInfoCircle className="text-blue-600 dark:text-blue-300 text-xl" />
              <p className="text-blue-800 dark:text-blue-200 italic">Aucun fichier rattaché à cette tâche.</p>
            </div>
          )}
        </div>

        {/* Section Commentaires */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 mb-8 border border-gray-200 dark:border-gray-700 transition duration-200 hover:shadow-lg">
          <h2 className="text-2xl font-bold flex items-center gap-3 mb-6 text-blue-700 dark:text-blue-200"><FaCommentDots /> Commentaires</h2>
          {loadingComments ? (
            <div className="text-gray-400 italic">Chargement des commentaires...</div>
          ) : (
            <div>
              {comments.length === 0 ? (
                <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-5 border border-blue-200 dark:border-blue-700 flex items-center gap-3 mb-6">
                  <FaInfoCircle className="text-blue-600 dark:text-blue-300 text-xl" />
                  <p className="text-blue-800 dark:text-blue-200 italic">Aucun commentaire pour l'instant.</p>
                </div>
              ) : (
                <ul className="space-y-6 mb-6">
                  {comments.map(comment => (
                    <li key={comment.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 flex gap-4 transition duration-200 hover:shadow-sm">
                      <img src={comment.user?.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user?.name || '')}`} alt={comment.user?.name} className="w-10 h-10 rounded-full border-2 border-blue-200" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-blue-800 dark:text-blue-200 text-lg">{comment.user?.name}</span>
                          <span className="text-gray-600 dark:text-gray-300 text-sm">{new Date(comment.created_at).toLocaleString()}</span>
                        </div>
                        {editingId === comment.id ? (
                          <form onSubmit={handleUpdateComment} className="flex flex-col gap-3 mt-2">
                            <textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="border border-gray-300 rounded-lg p-3 w-full min-h-[80px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200" required maxLength={2000} />
                            <div className="flex gap-3 justify-end">
                              <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200 hover:shadow-md">Enregistrer</button>
                              <button type="button" className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-semibold transition-colors duration-200 hover:shadow-md" onClick={() => setEditingId(null)}>Annuler</button>
                            </div>
                          </form>
                        ) : (
                          <p className="text-gray-900 dark:text-gray-100 leading-relaxed">{comment.content}</p>
                        )}
                      </div>
                      {comment.user?.id === auth.user.id && editingId !== comment.id && (
                        <div className="flex flex-col gap-2 ml-4">
                          <button onClick={() => handleEditComment(comment)} className="text-sm text-yellow-700 hover:underline hover:text-yellow-800 transition-colors duration-200">Éditer</button>
                          <button onClick={() => handleDeleteComment(comment.id)} className="text-sm text-red-600 hover:underline hover:text-red-700 transition-colors duration-200">Supprimer</button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <form onSubmit={handleCommentSubmit} className="flex flex-col gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Ajouter un nouveau commentaire</h3>
                <textarea
                  value={commentContent}
                  onChange={e => setCommentContent(e.target.value)}
                  placeholder="Écrire votre commentaire ici..."
                  className="border border-gray-300 rounded-lg p-3 w-full min-h-[100px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200"
                  disabled={posting}
                  required
                  maxLength={2000}
                />
                {error && <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg text-sm">{error}</div>}
                <button type="submit" className="self-end bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-lg font-semibold hover:shadow-md flex items-center gap-2 transition duration-200" disabled={posting || !commentContent.trim()}>
                  {posting ? 'Envoi...' : 'Envoyer le commentaire'}
                </button>
              </form>
            </div>
          )}
        </div>

      </div>

      {/* Confirmation Modal */}
      <Modal show={showConfirmValidationModal} onClose={() => setShowConfirmValidationModal(false)} maxWidth="md">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Confirmer la validation du paiement
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Êtes-vous sûr de vouloir valider ce paiement ? Cette action est irréversible.
          </p>
          <div className="mt-6 flex justify-end">
            <button onClick={() => setShowConfirmValidationModal(false)} className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
              Annuler
            </button>
            <button onClick={confirmPaymentValidation} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500" disabled={validationLoading}>
              {validationLoading ? 'Validation...' : 'Confirmer'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showConfirmDeleteModal} onClose={() => setShowConfirmDeleteModal(false)} maxWidth="sm">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Confirmer la suppression de la tâche
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Êtes-vous sûr de vouloir supprimer cette tâche ? Cette action est irréversible.
          </p>
          <div className="mt-6 flex justify-end">
            <button onClick={() => setShowConfirmDeleteModal(false)} className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
              Annuler
            </button>
            <button onClick={confirmDeleteTask} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
              Supprimer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

Show.layout = page => <AdminLayout children={page} />;