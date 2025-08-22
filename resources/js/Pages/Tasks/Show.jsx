import React, { useEffect, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Link, usePage, router } from '@inertiajs/react';
import ActionButton from '../../Components/ActionButton';
import TaskTimer from '../../Components/TaskTimer';
import { FaTasks, FaUserCircle, FaProjectDiagram, FaFlagCheckered, FaUser, FaArrowLeft, FaFileUpload, FaCommentDots, FaDownload, FaInfoCircle, FaEdit, FaTrash, FaDollarSign } from 'react-icons/fa';
import Modal from '@/Components/Modal';

export default function Show({ task, payments, projectMembers, currentUserRole }) {
  const { auth } = usePage().props;
  
  // Vérification des droits basée sur les rôles
  const isAdmin = auth?.user?.role === 'admin' || auth?.user?.is_admin;
  const isProjectManager = currentUserRole === 'manager';
  const canEditTask = isAdmin || isProjectManager;

  // Logs de débogage
  useEffect(() => {
    console.log('=== DÉBOGAGE DROITS UTILISATEUR ===');
    console.log('Utilisateur:', auth.user);
    console.log('Rôle actuel:', currentUserRole);
    console.log('Est admin:', isAdmin);
    console.log('Est manager:', isProjectManager);
    console.log('Peut modifier:', canEditTask);
  }, [auth.user, currentUserRole, isAdmin, isProjectManager, canEditTask]);

  // Debug logs
  console.log('Auth user:', auth?.user);
  console.log('Task project users:', task.project?.users);
  console.log('Is admin:', isAdmin);
  console.log('Is project manager:', isProjectManager);
  console.log('Current user ID:', auth.user?.id);
  console.log('Project users with roles:', task.project?.users?.map(u => ({
    id: u.id,
    name: u.name,
    role: u.pivot?.role
  })));
  
  const isAssigned = auth?.user?.id === task.assigned_to;
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
  const [showConfirmDeleteCommentModal, setShowConfirmDeleteCommentModal] = useState(false);
  const [commentToDeleteId, setCommentToDeleteId] = useState(null);

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

  const handleCommentKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (commentContent.trim()) {
        handleCommentSubmit(e);
      }
    }
  };

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

  const handleDeleteComment = (commentId) => {
    setCommentToDeleteId(commentId);
    setShowConfirmDeleteCommentModal(true);
  };

  const confirmDeleteComment = async () => {
    if (!commentToDeleteId) return;
    const res = await fetch(`/api/tasks/${task.id}/comments/${commentToDeleteId}`, {
      method: 'DELETE',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
      },
    });
    if (res.ok) {
      setComments(comments.filter(c => c.id !== commentToDeleteId));
      setShowConfirmDeleteCommentModal(false);
      setCommentToDeleteId(null);
    }
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

  const getPaymentStatusBadge = (status) => {
    const statusMap = {
      'unpaid': { text: 'Non payé', color: 'bg-yellow-100 text-yellow-800' },
      'pending': { text: 'En attente', color: 'bg-blue-100 text-blue-800' },
      'paid': { text: 'Payé', color: 'bg-green-100 text-green-800' },
      'failed': { text: 'Échoué', color: 'bg-red-100 text-red-800' },
    };
    
    const statusInfo = statusMap[status] || { text: 'Inconnu', color: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    );
  };

  const getPaymentReasonLabel = (reason) => {
    const reasonMap = {
      'volunteer': 'Bénévolat',
      'academic': 'Projet académique',
      'other': 'Autre raison',
    };
    
    return reasonMap[reason] || 'Non spécifiée';
  };

  const getPaymentReasonDescription = (reason) => {
    const descriptionMap = {
      'volunteer': 'Cette tâche est effectuée dans le cadre d\'une mission bénévole.',
      'academic': 'Cette tâche fait partie d\'un projet académique ou éducatif.',
      'other': 'Cette tâche est effectuée sans rémunération pour d\'autres raisons.',
    };
    
    return descriptionMap[reason] || 'Cette tâche est effectuée sans rémunération.';
  };

  const [activeTab, setActiveTab] = useState('details');

  return (
    <div className="flex flex-col w-full bg-white dark:bg-gray-950 p-0 m-0 min-h-screen">
      <div className="flex flex-col w-full py-8 px-4 sm:px-6 lg:px-8">
        
        {/* Section En-tête */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <FaTasks className="text-4xl text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight">
              Détail de la tâche
              {process.env.NODE_ENV !== 'production' && (
                <div className="text-xs text-gray-500 mt-1">
                  Droits: {isAdmin ? 'Admin' : isProjectManager ? 'Manager' : 'Membre'}
                </div>
              )}
            </h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex flex-wrap items-center gap-3">
              {canEditTask && (
                <>
                  <Link 
                    href={`/tasks/${task.id}/edit`} 
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition duration-200 hover:shadow-md text-sm sm:text-base whitespace-nowrap"
                  >
                    <FaEdit /> 
                    <span>Modifier</span>
                  </Link>
                  <button
                    onClick={handleDeleteTask}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition duration-200 hover:shadow-md text-sm sm:text-base whitespace-nowrap"
                  >
                    <FaTrash /> 
                    <span>Supprimer</span>
                  </button>
                </>
              )}
              
              <Link 
                href="/tasks" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition duration-200 hover:shadow-md text-sm sm:text-base whitespace-nowrap"
              >
                <FaArrowLeft /> 
                <span>Retour</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-8 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('details')}
              className={`${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Détails
            </button>
            
            {/* Onglet Rémunération - Uniquement si la tâche est rémunérée */}
            {task.is_paid && (
              <button
                onClick={() => setActiveTab('payment')}
                className={`${
                  activeTab === 'payment'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Rémunération
              </button>
            )}
            
            <button
              onClick={() => setActiveTab('files')}
              className={`${
                activeTab === 'files'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Ressources
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`${
                activeTab === 'comments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Discussions
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'details' && (
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

                {/* Sprint avec plus de détails */}
                <div className="flex items-start gap-4">
                  <span className="font-semibold text-gray-700 dark:text-gray-300 min-w-[100px]">Sprint :</span> 
                  <div className="flex-1">
                    {task.sprint_id ? (
                      <div className="space-y-2">
                        {task.sprint ? (
                          <>
                            <Link 
                              href={`/sprints/${task.sprint.id}`} 
                              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200 text-lg"
                            >
                              <FaFlagCheckered /> {task.sprint.name}
                            </Link>
                            <div className="text-sm text-gray-600 dark:text-gray-400 pl-6">
                              <p>Date de début: {new Date(task.sprint.start_date).toLocaleDateString('fr-FR')}</p>
                              <p>Date de fin: {new Date(task.sprint.end_date).toLocaleDateString('fr-FR')}</p>
                              {task.sprint.goal && (
                                <p>Objectif: {task.sprint.goal}</p>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <FaFlagCheckered className="text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">
                              Sprint ID: {task.sprint_id} (Détails non chargés)
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Aucun sprint associé</span>
                    )}
                  </div>
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

              {/* Détails de la tâche */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {/* Colonne de gauche */}
                <div className="space-y-4">
                  {/* Statut */}
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-gray-700 dark:text-gray-300 min-w-[100px]">Statut :</span> 
                    {getStatusBadge(task.status)}
                  </div>

                  {/* Priorité */}
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-gray-700 dark:text-gray-300 min-w-[100px]">Priorité :</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      task.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    }`}>
                      {task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
                    </span>
                  </div>

                  {/* Date de création */}
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-gray-700 dark:text-gray-300 min-w-[100px]">Créée le :</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {new Date(task.created_at).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                {/* Colonne de droite */}
                <div className="space-y-4">
                  {/* Assigné à */}
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-gray-700 dark:text-gray-300 min-w-[100px]">Assigné à :</span>
                    {task.assigned_user ? (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            {task.assigned_user.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span>{task.assigned_user.name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Non assigné</span>
                    )}
                  </div>

                  {/* Date d'échéance avec minuterie */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-gray-700 dark:text-gray-300 min-w-[100px]">Échéance :</span>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className={`${
                            new Date(task.due_date) < new Date() && task.status !== 'done' 
                              ? 'text-red-600 dark:text-red-400 font-medium' 
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {task.due_date ? new Date(task.due_date).toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Non définie'}
                          </span>
                          {task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done' && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full dark:bg-red-900/30 dark:text-red-300">
                              En retard
                            </span>
                          )}
                        </div>
                        {task.due_date && (
                          <div className="mt-1">
                            <TaskTimer 
                              dueDate={task.due_date} 
                              startDate={task.start_date || task.created_at} 
                            />
                          </div>
                        )}
                      </div>
                    </div>

                  {/* Dernière mise à jour */}
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-gray-700 dark:text-gray-300 min-w-[100px]">Mise à jour :</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {new Date(task.updated_at).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Description</h3>
                </div>
                
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  {task.description ? (
                    <div className="prose dark:prose-invert max-w-none">
                      {task.description.split('\n').map((paragraph, index) => (
                        <p key={index} className="text-gray-700 dark:text-gray-300">
                          {paragraph || <br />}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400 italic">
                      Aucune description n'a été ajoutée à cette tâche.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                {(isAssigned || isAdmin) && (
                  <Link href={`/files/create?task_id=${task.id}&project_id=${task.project_id}`} className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg font-semibold flex items-center gap-2 transition duration-200 hover:shadow-md">
                    <FaFileUpload /> Uploader un fichier
                  </Link>
                )}
                {(isAdmin || isProjectManager) && (
                  <Link href={`/tasks/${task.id}/edit`} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold flex items-center gap-2 transition duration-200 hover:shadow-md">
                    <FaEdit /> Modifier la tâche
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
          )}

          {activeTab === 'payment' && task.is_paid && (
            <div>
              {/* Payment Section - Current User's Payment */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 mb-8 border border-gray-200 dark:border-gray-700 transition duration-200 hover:shadow-lg">
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-6 text-blue-700 dark:text-blue-200">💳Rémunération</h2>
                
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
                        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Informations de paiement</h3>
                        {displayedPayment ? (
                          <div className="space-y-4">
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 transition duration-200 hover:shadow-sm">
                              <p className="text-gray-600 dark:text-gray-300 mb-2 flex items-center justify-between">
                                <span className="font-medium">Type:</span>
                                <span className="text-gray-800 dark:text-white font-medium">Tâche rémunérée</span>
                              </p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 transition duration-200 hover:shadow-sm">
                              <p className="text-gray-600 dark:text-gray-300 mb-2 flex items-center justify-between">
                                <span className="font-medium">Montant:</span>
                                <span className="text-gray-800 dark:text-white font-medium">{task.amount?.toLocaleString('fr-FR')} FCFA</span>
                              </p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 transition duration-200 hover:shadow-sm">
                              <p className="text-gray-600 dark:text-gray-300 mb-2 flex items-center justify-between">
                                <span className="font-medium">Statut:</span>
                                {displayedPayment.status === 'validated' ? (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                    Payé
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                    En attente
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 transition duration-200 hover:shadow-sm">
                              <p className="text-gray-600 dark:text-gray-300 mb-2 flex items-center justify-between">
                                <span className="font-medium">Date de paiement</span>
                                <span className="text-gray-800 dark:text-white font-medium">
                                  {new Date(displayedPayment.updated_at).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </p>
                            </div>
                            
                            {displayedPayment.status === 'validated' && (
                              <a 
                                href={route('tasks.receipt.download', task.id) + (selectedMemberId !== auth.user.id ? `?user_id=${selectedMemberId}` : '')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 hover:shadow-md mt-4"
                              >
                                <FaDownload className="text-lg" />
                                <span>Télécharger le reçu</span>
                              </a>
                            )}
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
                            <div className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-3 rounded-full bg-blue-100 dark:bg-blue-800 group-hover:bg-blue-200 dark:group-hover:bg-blue-700 transition">
                              <span className="text-white text-2xl">💳</span>
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200">Détails de paiement</h3>
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
                            <div className="mt-5 space-y-4">
                              <div className="p-4 bg-green-100 dark:bg-green-900 rounded-lg border border-green-300 dark:border-green-700">
                                <p className="text-green-800 dark:text-green-200 text-sm font-medium text-center flex items-center justify-center gap-2">
                                  <span className="text-lg">✓</span> Ce moyen de paiement a été validé.
                                </p>
                              </div>
                              

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
                        {p.status === 'validated' && (
                          <a 
                            href={route('tasks.receipt.download', task.id) + `?user_id=${p.user_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition duration-200 hover:shadow-lg"
                          >
                            <FaDownload className="text-sm" />
                            <span>Télécharger le reçu</span>
                          </a>
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
            </div>
          )}

          {activeTab === 'files' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 mb-8 border border-gray-200 dark:border-gray-700 transition duration-200 hover:shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-3 text-blue-700 dark:text-blue-200">
                  <FaFileUpload /> Ressources
                </h2>
                {/* Upload button visible to all members */}
                <Link 
                  href={`/files/create?task_id=${task.id}&project_id=${task.project_id}`} 
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition duration-200 hover:shadow-md"
                >
                  <FaFileUpload /> Ajouter un fichier
                </Link>
              </div>
              
              {task.files && task.files.length > 0 ? (
                <ul className="space-y-4">
                  {task.files.map(file => {
                    // Determine if the file was uploaded by the assigned user
                    const isUploadedByAssignedUser = file.user_id === task.assigned_to?.id || file.user_id === task.assigned_to;
                    
                    return (
                      <li key={file.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition duration-200 border border-gray-200 dark:border-gray-600 group hover:shadow-sm">
                        <Link href={`/files/${file.id}`} className="flex flex-col">
                          <div className="flex items-start justify-between w-full">
                            <div className="flex items-center gap-4">
                              <div className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-3 rounded-full bg-blue-100 dark:bg-blue-800 group-hover:bg-blue-200 dark:group-hover:bg-blue-700 transition">
                                <FaFileUpload className="text-xl" />
                              </div>
                              <div>
                                <div className="font-semibold text-blue-600 dark:text-blue-300 text-lg group-hover:underline">
                                  {file.name}
                                  {/* Badge for file type */}
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    isUploadedByAssignedUser 
                                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                  } mr-2">
                                    {isUploadedByAssignedUser ? 'Traitement' : 'Ressources'}
                                  </span>
                                  {/* Dropbox badge */}
                                  {file.dropbox_path && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white dark:bg-blue-600">
                                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M6 1.807L0 5.629l6 3.815 5.936-3.759L6 1.807zm12 .01L9.297 5.864 15.466 10.1 24 6.196l-6-4.38zM0 13.274l6 3.819 6.003-3.863L6.004 9.39 0 13.275zm9.297 4.056l6-3.863 5.7 3.86-5.7 3.869-6-3.866z"/>
                                      </svg>
                                      Dropbox
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  {file.description || <span className="italic text-gray-400">Aucune description</span>}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  <span>{Math.round(file.size / 1024)} KB</span>
                                  <span>•</span>
                                  <span>Téléversé le {new Date(file.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    Par <span className="font-medium text-gray-600 dark:text-gray-300">
                                      {(() => {
                                        // Find the user in projectMembers or in the project's users list
                                        const fileUser = projectMembers?.find(u => u.id === file.user_id) || 
                                                       task.project?.users?.find(u => u.id === file.user_id) || 
                                                       { name: 'Utilisateur inconnu' };
                                        return fileUser.name;
                                      })()}
                                    </span>
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <div className="flex-shrink-0">
                                <img 
                                  src={file.user?.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(file.user?.name || '')}&background=3b82f6&color=fff`} 
                                  alt={file.user?.name} 
                                  className="w-6 h-6 rounded-full" 
                                />
                              </div>
                              <span className="text-gray-700 dark:text-gray-200 font-medium">{file.user?.name}</span>
                              {file.user?.role === 'manager' || file.user?.role === 'admin' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 ml-2">
                                  {file.user?.role === 'admin' ? 'Admin' : 'Manager'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 ml-2">
                                  Membre
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-5 border border-blue-200 dark:border-blue-700 flex items-center gap-3">
                  <FaInfoCircle className="text-blue-600 dark:text-blue-300 text-xl" />
                  <p className="text-blue-800 dark:text-blue-200 italic">Aucun fichier rattaché à cette tâche.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 mb-8 border border-gray-200 dark:border-gray-700 transition duration-200 hover:shadow-lg">
              <h2 className="text-2xl font-bold flex items-center gap-3 mb-6 text-blue-700 dark:text-blue-200">
                <FaCommentDots /> Discussions
                {loadingComments && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 ml-2">
                    Chargement...
                  </span>
                )}
              </h2>
              {loadingComments ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div>
                  {comments.length === 0 ? (
                    <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-5 border border-blue-200 dark:border-blue-700 flex items-center gap-3 mb-6">
                      <FaInfoCircle className="text-blue-600 dark:text-blue-300 text-xl flex-shrink-0" />
                      <p className="text-blue-800 dark:text-blue-200 italic">Aucune discussion pour l'instant. Soyez le premier à commenter !</p>
                    </div>
                  ) : (
                    <ul className="space-y-6 mb-6">
                      {comments.map(comment => (
                        <li key={comment.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 flex gap-4 transition duration-200 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500">
                          <div className="relative group">
                            <img 
                              src={comment.user?.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user?.name || '')}&background=0D8ABC&color=fff`} 
                              alt={comment.user?.name} 
                              className="w-12 h-12 rounded-full border-2 border-blue-300 dark:border-blue-600 object-cover transition-transform duration-200 group-hover:scale-110"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user?.name || 'U')}&background=0D8ABC&color=fff`;
                              }}
                            />
                            <span className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white dark:border-gray-700">
                              {comment.user?.name?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-blue-800 dark:text-blue-200 text-lg truncate">
                                  {comment.user?.name || 'Utilisateur inconnu'}
                                </span>
                                {comment.user?.role === 'admin' && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                    Admin
                                  </span>
                                )}
                                {comment.user?.role === 'manager' && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                    Manager
                                  </span>
                                )}
                              </div>
                              <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                                {new Date(comment.created_at).toLocaleString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            {editingId === comment.id ? (
                              <form onSubmit={handleUpdateComment} className="flex flex-col gap-3 mt-2">
                                <textarea 
                                  value={editContent} 
                                  onChange={e => setEditContent(e.target.value)} 
                                  className="border border-gray-300 rounded-lg p-3 w-full min-h-[100px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200" 
                                  required 
                                  maxLength={2000}
                                  autoFocus
                                />
                                <div className="flex gap-3 justify-end">
                                  <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 hover:shadow-md flex items-center gap-2">
                                    <FaEdit /> Enregistrer
                                  </button>
                                  <button 
                                    type="button" 
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors duration-200 hover:shadow-md flex items-center gap-2" 
                                    onClick={() => setEditingId(null)}
                                  >
                                    Annuler
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <div className="prose max-w-none dark:prose-invert">
                                <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
                                  {comment.content}
                                </p>
                              </div>
                            )}
                          </div>
                          {comment.user?.id === auth.user.id && editingId !== comment.id && (
                            <div className="flex flex-col gap-2 ml-2">
                              <button 
                                onClick={() => handleEditComment(comment)} 
                                className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200 rounded-full hover:bg-blue-50 dark:hover:bg-gray-600"
                                title="Modifier le commentaire"
                              >
                                <FaEdit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteComment(comment.id)} 
                                className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200 rounded-full hover:bg-red-50 dark:hover:bg-gray-600"
                                title="Supprimer le commentaire"
                              >
                                <FaTrash className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  <form onSubmit={handleCommentSubmit} className="flex flex-col gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Ajouter une nouvelle discussion</h3>
                    <div className="relative">
                      <textarea
                        value={commentContent}
                        onChange={e => setCommentContent(e.target.value)}
                        onKeyDown={handleCommentKeyDown}
                        placeholder="Écrire votre message ici..."
                        className="border border-gray-300 rounded-lg p-4 w-full min-h-[120px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-200 pr-12"
                        disabled={posting}
                        required
                        maxLength={2000}
                      />
                      <div className="absolute bottom-3 right-3 text-xs text-gray-500 dark:text-gray-400">
                        {commentContent.length}/2000
                      </div>
                    </div>
                    {error && (
                      <div className="bg-red-50 border-l-4 border-red-400 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Appuyez sur Ctrl+Entrée pour envoyer
                      </div>
                      <button 
                        type="submit" 
                        className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-md flex items-center gap-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
                        disabled={posting || !commentContent.trim()}
                      >
                        {posting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Envoi en cours...
                          </>
                        ) : (
                          <>
                            <FaCommentDots />
                            Envoyer le message
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
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

        {/* Delete Comment Confirmation Modal */}
        <Modal show={showConfirmDeleteCommentModal} onClose={() => setShowConfirmDeleteCommentModal(false)} maxWidth="sm">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Confirmer la suppression du message
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Êtes-vous sûr de vouloir supprimer ce message ? Cette action est irréversible.
            </p>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowConfirmDeleteCommentModal(false)} className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                Annuler
              </button>
              <button onClick={confirmDeleteComment} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                Supprimer
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}

Show.layout = page => <AdminLayout children={page} />;