import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Link, usePage, router } from '@inertiajs/react';
import ActionButton from '../../Components/ActionButton';
import { FaTasks, FaUserCircle, FaProjectDiagram, FaFlagCheckered, FaUser, FaArrowLeft, FaFileUpload, FaCommentDots, FaDownload, FaInfoCircle, FaEdit, FaTrash, FaDollarSign, FaClock, FaMicrophone, FaStop, FaReply, FaStar, FaPaperPlane } from 'react-icons/fa';
import Modal from '@/Components/Modal';
// Ajout de FaSave à la liste des icônes importées
import {FaSave, FaTimes } from 'react-icons/fa';

// Composant de compte à rebours réutilisable
const formatTimeUnit = (value, label) => (
  <div className="flex flex-col items-center">
    <span className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg w-14 h-14 flex items-center justify-center shadow-md">
      {value.toString().padStart(2, '0')}
    </span>
    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</span>
  </div>
);


const CountdownTimer = ({ targetDate, onComplete, taskStatus, taskUpdatedAt }) => {
  const calculateTimeLeft = useCallback(() => {
    const difference = new Date(targetDate) - new Date();
    
    if (difference <= 0) {
      if (onComplete) onComplete();
      return { expired: true };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((difference / 1000 / 60) % 60);
    const seconds = Math.floor((difference / 1000) % 60);

    return {
      days,
      hours,
      minutes,
      seconds,
      expired: false
    };
  }, [targetDate, onComplete]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  // If task is done, check if it was completed before or at the deadline
  if (taskStatus === 'done') {
    const updatedAt = new Date(taskUpdatedAt);
    const dueDate = new Date(targetDate);
    const now = new Date();
    
    // If current time is before deadline, show countdown
    if (now < dueDate) {
      return (
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center justify-end gap-1">
            {timeLeft.days > 0 && formatTimeUnit(timeLeft.days, 'J')}
            {formatTimeUnit(timeLeft.hours, 'H')}
            {formatTimeUnit(timeLeft.minutes, 'M')}
            {formatTimeUnit(timeLeft.seconds, 'S')}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Temps restant</span>
        </div>
      );
    }
    
    // After deadline, show if completed on time or late
    const completedOnTime = updatedAt <= dueDate;
    return (
      <div className="flex items-center justify-end gap-2">
        <FaClock className={completedOnTime ? 'text-green-500' : 'text-red-500 animate-pulse'} />
        <span className={completedOnTime ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
          {completedOnTime ? 'Délai respecté' : 'Délai dépassé'}
        </span>
      </div>
    );
  }

  // For tasks not done yet, always show countdown until deadline
  if (timeLeft.expired) {
    return (
      <div className="flex items-center justify-end gap-2 text-red-600 dark:text-red-400">
        <FaClock className="animate-pulse" />
        <span>Délai dépassé</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center justify-end gap-1">
        {timeLeft.days > 0 && formatTimeUnit(timeLeft.days, 'J')}
        {formatTimeUnit(timeLeft.hours, 'H')}
        {formatTimeUnit(timeLeft.minutes, 'M')}
        {formatTimeUnit(timeLeft.seconds, 'S')}
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400">Temps restant</span>
    </div>
  );
};

export default function Show({ task, payments, projectMembers, currentUserRole }) {
  const { auth } = usePage().props;
  
  // Vérification des droits basée sur les rôles
  const isAdmin = auth?.user?.role === 'admin' || auth?.user?.is_admin;
  const isProjectManager = currentUserRole === 'manager';
  const canEditTask = isAdmin || isProjectManager;

  // Sanitize task data to prevent sensitive information exposure
  const sanitizedTask = React.useMemo(() => {
    if (!task) return {};
    
    // Create a clean copy of the task
    const cleanTask = { ...task };
    
    // Remove sensitive fields from project users if they exist
    if (cleanTask.project?.users) {
      cleanTask.project.users = cleanTask.project.users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email ? '[REDACTED]' : null,
        profile_photo_url: user.profile_photo_url,
        pivot: user.pivot ? { role: user.pivot.role } : null
      }));
    }
    
    return cleanTask;
  }, [task]);
  
  // Use the sanitized task instead of the original
  const taskToDisplay = sanitizedTask;
  
  const isAssigned = auth?.user?.id === task?.assigned_to;
  const isProjectMember = task?.project?.users?.some(u => u.id === auth.user.id) || false;

  // For adding payment for other members
  const [selectedMemberId, setSelectedMemberId] = useState(auth?.user?.id || null); // Default to current user

  // Derived state for the currently displayed payment info (either own or selected member's)
  const displayedPayment = React.useMemo(() => {
    if (!payments || !Array.isArray(payments)) return null;
    
    if ((isAdmin || isProjectManager) && selectedMemberId) {
      return payments.find(p => p?.user_id == selectedMemberId) || null;
    }
    
    return payments.find(p => p?.user_id === auth?.user?.id) || null;
  }, [payments, isAdmin, isProjectManager, selectedMemberId, auth.user?.id]);

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

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState(null);

  const startRecording = async () => {
    try {
      // Vérifier si le navigateur supporte l'enregistrement audio
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Votre navigateur ne supporte pas l\'enregistrement audio');
      }

      // Clear any existing recording
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      setAudioBlob(null);
      setAudioChunks([]);
      setRecordingTime(0);
      setError('');
      
      // Demander la permission d'accéder au micro
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      };

      // Sur mobile, utiliser des paramètres plus compatibles
      if (/Mobi|Android/i.test(navigator.userAgent)) {
        delete constraints.audio.sampleRate; // Laisser le navigateur mobile choisir le taux d'échantillonnage
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
        .catch(err => {
          if (err.name === 'NotAllowedError') {
            throw new Error('Accès au microphone refusé. Veuillez autoriser l\'accès au micro dans les paramètres de votre navigateur.');
          } else if (err.name === 'NotFoundError') {
            throw new Error('Aucun microphone détecté. Vérifiez votre connexion micro.');
          } else {
            throw new Error(`Erreur d'accès au microphone: ${err.message}`);
          }
        });
      
      // Configurer le MediaRecorder avec un format compatible
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : '';
      
      if (!mimeType) {
        throw new Error('Format audio non supporté par votre navigateur');
      }
      
      const options = {
        mimeType: mimeType,
        audioBitsPerSecond: 128000
      };
      
      const recorder = new MediaRecorder(stream, options);
      const chunks = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onerror = (event) => {
        console.error('Erreur lors de l\'enregistrement:', event.error);
        setError('Erreur lors de l\'enregistrement. Veuillez réessayer.');
        stopRecording();
      };

      recorder.onstop = () => {
        clearInterval(recordingInterval);
        try {
          const blob = new Blob(chunks, { type: mimeType });
          setAudioChunks(chunks);
          setAudioBlob(blob);
          setAudioUrl(URL.createObjectURL(blob));
        } catch (err) {
          console.error('Erreur lors de la création du blob audio:', err);
          setError('Impossible de traiter l\'enregistrement audio.');
        } finally {
          setRecordingTime(0);
          stream.getTracks().forEach(track => {
            track.stop();
            stream.removeTrack(track);
          });
        }
      };

      // Démarrer le minuteur
      clearInterval(recordingInterval);
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setRecordingInterval(interval);
      
      // Démarrer l'enregistrement avec un intervalle de 1 seconde pour une meilleure réactivité
      recorder.start(1000);
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
        setError('Impossible d\'accéder au microphone. Veuillez vérifier les autorisations.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      clearInterval(recordingInterval);
    }
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (recordingInterval) {
        clearInterval(recordingInterval);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [recordingInterval, audioUrl]);
  
  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (recordingInterval) {
        clearInterval(recordingInterval);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [recordingInterval, audioUrl]);

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
  // Charger les commentaires lus depuis le localStorage
  const [readComments, setReadComments] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`readComments_${task.id}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return new Set();
  });
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);

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
    if (!commentContent.trim() && !audioBlob) {
      setError('Veuillez écrire un message ou enregistrer un message vocal.');
      return;
    }
    
    setPosting(true);
    setError('');
    
    try {
      const formData = new FormData();
      // Toujours s'assurer que le contenu a une valeur, même si c'est juste un espace
      formData.append('content', commentContent.trim() || 'Message vocal');
      if (audioBlob) {
        // Utiliser le bon type MIME et extension
        formData.append('audio', audioBlob, 'voice_message.webm');
      }

      // Si on répond à un commentaire, ajouter le parent_id
      if (replyingTo) {
        formData.append('parent_id', replyingTo);
      }

      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        },
        body: formData,
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.message || 'Erreur lors de l\'ajout du commentaire');
        return;
      }
      
      const newComment = await res.json();
      
      // Si c'est une réponse, on met à jour le commentaire parent
      if (replyingTo) {
        setComments(prevComments => {
          const updateComments = (comments) => {
            return comments.map(comment => {
              // Si c'est le commentaire parent, on ajoute la réponse
              if (comment.id === replyingTo) {
                return {
                  ...comment,
                  replies: [...(comment.replies || []), newComment]
                };
              }
              
              // Sinon, on vérifie les réponses de ce commentaire
              if (comment.replies && comment.replies.length > 0) {
                return {
                  ...comment,
                  replies: updateComments(comment.replies)
                };
              }
              
              return comment;
            });
          };
          
          return updateComments(prevComments);
        });
      } else {
        // Sinon, on ajoute un nouveau commentaire
        setComments(prevComments => [newComment, ...prevComments]);
      }
      
      setCommentContent('');
      setAudioBlob(null);
      setAudioUrl(null);
      setReplyingTo(null);
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
      .then(comments => {
        // S'assurer que chaque commentaire a un tableau de réponses
        const processedComments = comments.map(comment => ({
          ...comment,
          replies: comment.replies || []
        }));
        setComments(processedComments);
      })
      .catch(() => setComments([]))
      .finally(() => setLoadingComments(false));
  }, [task.id]);

  const handleDeleteComment = (commentId) => {
    setCommentToDeleteId(commentId);
    setShowConfirmDeleteCommentModal(true);
  };

  const confirmDeleteComment = async () => {
    if (!commentToDeleteId) return;
    
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments/${commentToDeleteId}`, {
        method: 'DELETE',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        },
      });
      
      if (res.ok) {
        setComments(prevComments => {
          const removeComment = (comments) => {
            return comments.reduce((acc, comment) => {
              // Si c'est le commentaire à supprimer, on le saute
              if (comment.id === commentToDeleteId) {
                return acc;
              }
              
              // Si le commentaire a des réponses, on les filtre aussi
              if (comment.replies && comment.replies.length > 0) {
                return [
                  ...acc,
                  {
                    ...comment,
                    replies: removeComment(comment.replies)
                  }
                ];
              }
              
              return [...acc, comment];
            }, []);
          };
          
          return removeComment(prevComments);
        });
        
        setShowConfirmDeleteCommentModal(false);
        setCommentToDeleteId(null);
      } else {
        const errorData = await res.json();
        setError(errorData.message || 'Erreur lors de la suppression du commentaire');
      }
    } catch (e) {
      setError('Erreur lors de la suppression du commentaire');
    }
  };

  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  
  const handleEditComment = (comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleReplyComment = (commentId) => {
    setReplyingTo(prevId => prevId === commentId ? null : commentId);
    // Faire défiler jusqu'au formulaire de réponse
    setTimeout(() => {
      document.querySelector('#comment-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const cancelReply = () => {
    setReplyingTo(null);
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

  // Function to mark all comments as read
  const markCommentsAsRead = useCallback(() => {
    if (comments.length > 0) {
      const newReadComments = new Set(readComments);
      let hasNewReads = false;
      
      comments.forEach(comment => {
        if (comment.id && !newReadComments.has(comment.id)) {
          newReadComments.add(comment.id);
          hasNewReads = true;
        }
      });
      
      if (hasNewReads) {
        // Sauvegarder dans le localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            `readComments_${task.id}`, 
            JSON.stringify(Array.from(newReadComments))
          );
        }
        setReadComments(newReadComments);
      }
    }
  }, [comments, readComments, task.id]);

  // Mark comments as read when Discussions tab is clicked
  const handleTabClick = (tab) => {
    if (tab === 'comments') {
      markCommentsAsRead();
    }
    setActiveTab(tab);
  };

  // Calculate unread comments count
  const unreadCommentsCount = comments.filter(comment => 
    comment.id && !readComments.has(comment.id)
  ).length;

  return (
    <div className="flex flex-col w-full bg-white dark:bg-gray-950 p-0 m-0 min-h-screen">
      <div className="flex flex-col w-full py-8 px-4 sm:px-6 lg:px-8">
        
        {/* Section En-tête */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            {/* <FaTasks className="text-4xl text-blue-600 dark:text-blue-400" /> */}
            <Link 
                href="/tasks" 
                className="bg-white-600 hover:bg-blue-200 text-blue text-4xl text-blue-600 dark:text-blue-400 px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition duration-200 hover:shadow-md text-sm sm:text-base whitespace-nowrap"
              >
                <FaArrowLeft className="text-lg sm:text-xl" />
              </Link>
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
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition duration-200 hover:shadow-md text-sm sm:text-base whitespace-nowrap"
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
              

            </div>
          </div>
        </div>

        {/* Enhanced Tabs Navigation with Beautiful Buttons */}
        <div className="mb-8">

  {/* Bande d'arrière-plan avec ombre douce */}
  <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-300 dark:border-gray-800 p-2">
     {/* Identification de la barre */}
  <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
    Onglets de navigation
  </h2>
    <nav className="flex flex-wrap gap-2 sm:gap-3" aria-label="Tabs">
      <button
        onClick={() => setActiveTab('details')}
        className={`group relative px-5 py-3 rounded-xl font-medium text-sm transition-all duration-300 ease-in-out ${
          activeTab === 'details'
            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <FaInfoCircle className="text-lg" />
          <span>Détails</span>
        </div>
        {activeTab === 'details' && (
          <span className="absolute bottom-0 left-0 w-full h-1 bg-blue-400 rounded-full"></span>
        )}
      </button>

      {task.is_paid && (
        <button
          onClick={() => setActiveTab('payment')}
          className={`group relative px-5 py-3 rounded-xl font-medium text-sm transition-all duration-300 ease-in-out ${
            activeTab === 'payment'
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md shadow-green-500/20'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <FaDollarSign className="text-lg" />
            <span>Rémunération</span>
          </div>
          {activeTab === 'payment' && (
            <span className="absolute bottom-0 left-0 w-full h-1 bg-green-400 rounded-full"></span>
          )}
        </button>
      )}

      <button
        onClick={() => setActiveTab('files')}
        className={`group relative px-5 py-3 rounded-xl font-medium text-sm transition-all duration-300 ease-in-out ${
          activeTab === 'files'
            ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md shadow-purple-500/20'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <FaFileUpload className="text-lg" />
          <span>Ressources</span>
        </div>
        {activeTab === 'files' && (
          <span className="absolute bottom-0 left-0 w-full h-1 bg-purple-400 rounded-full"></span>
        )}
      </button>

      <button
        onClick={() => handleTabClick('comments')}
        className={`group relative px-5 py-3 rounded-xl font-medium text-sm transition-all duration-300 ease-in-out ${
          activeTab === 'comments'
            ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <FaCommentDots className="text-lg" />
          <span>Discussions</span>
          {unreadCommentsCount > 0 && (
            <span className="flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-red-500 text-white">
              {unreadCommentsCount}
            </span>
          )}
        </div>
        {activeTab === 'comments' && (
          <span className="absolute bottom-0 left-0 w-full h-1 bg-orange-400 rounded-full"></span>
        )}
      </button>
    </nav>
  </div>
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

                {/* Ces informations sont déjà affichées plus bas dans la section détaillée */}

                {/* Due Date */}
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Date d'échéance :</span> 
                  <span className="text-gray-900 dark:text-gray-100">{task.due_date ? new Date(task.due_date).toLocaleDateString() : <span className="italic text-gray-400">Non définie</span>}</span>
                </div>
                
                {/* Ces informations sont déjà affichées plus bas dans la section détaillée */}
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

                  {/* Cette section a été déplacée et fusionnée avec la date d'échéance */}
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

                  {/* Compte à rebours et date d'échéance */}
                  {task.due_date && (
                    <div className="flex items-start gap-4">
                      <span className="font-semibold text-gray-700 dark:text-gray-300 min-w-[100px] mt-1">Échéance :</span>
                      <div className="flex-1">
                        <div className={`mb-2 ${
                          new Date(task.due_date) < new Date() && task.status !== 'done' 
                            ? 'text-red-600 dark:text-red-400 font-medium' 
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {new Date(task.due_date).toLocaleString('fr-FR', {
                            weekday: 'long',
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {new Date(task.due_date) < new Date() && task.status !== 'done' && (
                            <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full dark:bg-red-900/30 dark:text-red-300">
                              En retard
                            </span>
                          )}
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="text-right">
                            <CountdownTimer 
                              targetDate={task.due_date}
                              taskStatus={task.status}
                              taskUpdatedAt={task.updated_at}
                              onComplete={() => console.log('Temps écoulé!')}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

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
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 md:p-8 mb-8 border border-gray-200 dark:border-gray-700 transition duration-200 hover:shadow-lg">
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
      <div className="space-y-6">
        {comments.length === 0 ? (
          <div className="bg-blue-50 dark:bg-blue-900/50 rounded-lg p-6 border border-blue-200 dark:border-blue-800 flex items-center gap-4">
            <FaInfoCircle className="text-blue-500 dark:text-blue-300 text-2xl flex-shrink-0" />
            <p className="text-blue-800 dark:text-blue-200">Aucune discussion pour l'instant. Soyez le premier à commenter !</p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map(comment => (
              <div key={comment.id} className="relative group">
                {/* Commentaire principal */}
                <div className="bg-gray-50 dark:bg-gray-700/70 rounded-xl p-5 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-200">
                  <div className="flex gap-4">
                    {/* Avatar utilisateur */}
                    <div className="flex-shrink-0">
                      <div className="relative group">
                        <img 
                          src={comment.user?.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user?.name || '')}&background=0D8ABC&color=fff`} 
                          alt={comment.user?.name} 
                          className="w-12 h-12 rounded-full border-2 border-blue-300 dark:border-blue-600 object-cover transition-transform duration-200 group-hover:scale-110"
                        />
                        {comment.user?.role === 'admin' && (
                          <span className="absolute -bottom-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white dark:border-gray-700">
                            <FaStar className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Contenu du commentaire */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-blue-700 dark:text-blue-300">
                            {comment.user?.name || 'Utilisateur inconnu'}
                          </span>
                          {comment.user?.role === 'manager' && (
                            <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 px-2 py-0.5 rounded-full">
                              Manager
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(comment.created_at).toLocaleString('fr-FR', {
                            day: 'numeric',
                            month: '2-digit',
                            year: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      {editingId === comment.id ? (
                        <form onSubmit={handleUpdateComment} className="mt-2">
                          <textarea 
                            value={editContent} 
                            onChange={e => setEditContent(e.target.value)} 
                            className="w-full min-h-[100px] p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                            required 
                            maxLength={2000}
                            autoFocus
                          />
                          <div className="flex justify-end gap-2 mt-2">
                            <button 
                              type="button" 
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 rounded-lg"
                              onClick={() => setEditingId(null)}
                            >
                              Annuler
                            </button>
                            <button 
                              type="submit" 
                              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
                            >
                              <FaSave /> Enregistrer
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="prose dark:prose-invert max-w-none">
                            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                              {comment.content}
                            </p>
                          </div>

                          {comment.audio_path && (
                            <div className="mt-3">
                              <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                                <FaMicrophone className="text-blue-500 dark:text-blue-400 flex-shrink-0" />
                                <audio 
                                  controls 
                                  src={`/storage/${comment.audio_path}`}
                                  className="w-full max-w-md"
                                >
                                  Votre navigateur ne supporte pas la lecture audio.
                                </audio>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReplyComment(comment.id);
                            }}
                            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
                          >
                            <FaReply className="w-3.5 h-3.5" /> Répondre
                          </button>
                        </div>
                        
                        {comment.user?.id === auth.user.id && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditComment(comment);
                              }}
                              className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1.5 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                              title="Modifier"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteComment(comment.id);
                              }}
                              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                              title="Supprimer"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Réponses */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 pl-4 border-l-2 border-gray-200 dark:border-gray-600 space-y-4">
                      {comment.replies.map(reply => (
                        <div key={reply.id} className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
                          <div className="flex gap-3">
                            <div className="flex-shrink-0">
                              <img 
                                src={reply.user?.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(reply.user?.name || '')}&background=0D8ABC&color=fff`} 
                                alt={reply.user?.name} 
                                className="w-10 h-10 rounded-full border-2 border-blue-200 dark:border-blue-700"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                                <span className="font-medium text-sm text-blue-600 dark:text-blue-400">
                                  {reply.user?.name || 'Utilisateur inconnu'}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {new Date(reply.created_at).toLocaleString('fr-FR', {
                                    day: 'numeric',
                                    month: '2-digit',
                                    year: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
                                {reply.content}
                              </p>
                              {reply.audio_path && (
                                <div className="mt-2">
                                  <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800/30 rounded">
                                    <FaMicrophone className="text-blue-400 dark:text-blue-500 text-xs" />
                                    <audio 
                                      controls 
                                      src={`/storage/${reply.audio_path}`}
                                      className="h-8 max-w-[200px]"
                                    >
                                      Votre navigateur ne supporte pas l'audio.
                                    </audio>
                                  </div>
                                </div>
                              )}
                              {reply.user?.id === auth.user.id && (
                                <div className="flex justify-end mt-2">
                                  <button
                                    onClick={() => handleDeleteComment(reply.id)}
                                    className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                                    title="Supprimer"
                                  >
                                    <FaTrash className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Formulaire de commentaire */}
        <div className={`mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 ${replyingTo ? 'bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl' : ''}`}>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            {replyingTo ? 'Répondre au commentaire' : 'Ajouter une discussion'}
          </h3>
          
          <form onSubmit={handleCommentSubmit} className="space-y-4">
            <div className="relative">
              <textarea
                value={commentContent}
                onChange={e => setCommentContent(e.target.value)}
                onKeyDown={handleCommentKeyDown}
                placeholder="Écrivez votre message ici..."
                className="w-full min-h-[120px] p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-colors duration-200"
                disabled={posting || isRecording}
                required={!audioBlob}
                maxLength={2000}
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                {commentContent.length}/2000
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                {isRecording ? (
                  <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                      <span className="text-sm font-medium text-red-700 dark:text-red-300">
                        Enregistrement en cours...
                      </span>
                    </div>
                    <div className="text-sm font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded">
                      {formatTime(recordingTime)}
                    </div>
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="text-red-600 hover:text-white hover:bg-red-600 p-1.5 rounded-full transition-colors"
                      title="Arrêter l'enregistrement"
                    >
                      <FaStop className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    disabled={posting}
                    title="Enregistrer un message vocal"
                  >
                    <FaMicrophone className="text-red-500" />
                    <span>Message vocal</span>
                  </button>
                )}

                {audioUrl && (
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 rounded-lg">
                    <audio controls src={audioUrl} className="h-8"></audio>
                    <button
                      type="button"
                      onClick={() => { setAudioUrl(null); setAudioBlob(null); }}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      title="Supprimer l'enregistrement"
                    >
                      <FaTimes className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                {replyingTo && (
                  <div className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full flex items-center gap-1">
                    <FaReply className="w-3.5 h-3.5" />
                    <span>Réponse à un commentaire</span>
                    <button
                      type="button"
                      onClick={cancelReply}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 ml-1"
                      title="Annuler la réponse"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={posting || (!commentContent.trim() && !audioBlob)}
                  className={`px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    posting 
                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                  }`}
                >
                  {posting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Publication...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="w-3.5 h-3.5" />
                      {replyingTo ? 'Publier la réponse' : 'Publier'}
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-200 text-sm rounded-r">
                <div className="flex items-center gap-2">
                  <FaExclamationCircle className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500 dark:text-gray-400 text-center sm:text-right mt-2">
              Appuyez sur <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">Entrée</kbd> pour envoyer
            </div>
          </form>
        </div>
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