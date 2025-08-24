import React, { useState, useEffect, useCallback } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { 
    FaProjectDiagram, 
    FaUsers, 
    FaTasks, 
    FaEdit, 
    FaEye, 
    FaArrowLeft, 
    FaCalendarAlt, 
    FaUserFriends, 
    FaClipboardList, 
    FaTrash, 
    FaChartLine, 
    FaFileAlt, 
    FaCommentDots, 
    FaCheckCircle,
    FaVolumeMute,
    FaVolumeUp,
    FaEllipsisV,
    FaClock,
    FaExclamationTriangle,
    FaPlay,
    FaPause,
    FaStop,
    FaChartBar,
    FaChartPie,
    FaCalendarCheck,
    FaCrown,
    FaUser,
    FaShieldAlt,
    FaPlus,
    FaEnvelope,
    FaPhone,
    FaGlobe,
    FaCode,
    FaBug,
    FaLightbulb,
    FaUserPlus
} from 'react-icons/fa';
import { Line } from 'react-chartjs-2';
import { 
    Chart, 
    BarElement, 
    CategoryScale, 
    LinearScale, 
    Tooltip, 
    Legend, 
    ArcElement,
    PointElement,
    LineElement,
    Title,
    Filler
} from 'chart.js';
Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, ArcElement, PointElement, LineElement, Title, Filler);
import Modal from '../../Components/Modal';

// Helper function to get status color class
const getStatusColor = (status) => {
  switch (status) {
    case 'todo':
    case 'nouveau':
      return 'bg-gray-400';
    case 'in_progress':
    case 'en_cours':
      return 'bg-blue-500';
    case 'done':
    case 'termine':
      return 'bg-green-500';
    case 'pending':
    case 'en_attente':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-300';
  }
};

function Show({ project: initialProject, tasks = [], auth, stats = {}, isMuted = false, mutedMessage = '' }) {
  const { flash = {} } = usePage().props;
  const [project, setProject] = useState(initialProject);
  const [flashMessage, setFlashMessage] = useState(null);
  
  // Afficher un message permanent si en mode lecture seule
  useEffect(() => {
    if (isMuted && mutedMessage) {
      setFlash({
        type: 'warning',
        message: 'Vous êtes en mode lecture seule pour ce projet. Vous pouvez voir les informations mais pas les modifier.'
      });
    }
  }, [isMuted, mutedMessage]);
  
  // Fonction pour désactiver les interactions si en mode lecture seule
  const getReadOnlyProps = useCallback(() => {
    if (!isMuted) return {};
    
    const showMutedMessage = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      setFlashMessage({
        type: 'warning',
        message: 'Vous êtes en mode lecture seule pour ce projet.'
      });
      setTimeout(() => setFlashMessage(null), 5000);
    };
    
    return {
      onClick: showMutedMessage,
      style: { cursor: 'not-allowed', opacity: 0.7 },
      'aria-disabled': true
    };
  }, [isMuted]);
  
  // Gestion des notifications flash
  const setFlash = (message) => {
    setFlashMessage(message);
    // Masquer automatiquement après 5 secondes
    setTimeout(() => setFlashMessage(null), 5000);
  };
  
  // Sanitize and validate user roles
  const userRoles = Array.isArray(auth?.user?.roles) ? auth.user.roles : [];
  const isAdmin = userRoles.includes('admin');
  const isManager = userRoles.includes('manager');

  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  
  // Gestion des membres
  const [showMemberActions, setShowMemberActions] = useState({});
  
  // Fermer les menus déroulants quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = () => {
      setShowMemberActions({});
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Fonction pour vérifier si l'utilisateur peut éditer le projet
  const canEditProject = () => {
    return (isAdmin || isManager) && !isMuted;
  };

  // Fonction pour supprimer un membre
  const handleRemoveMember = (userId) => {

    if (!canEditProject()) {
      setFlash({
        type: 'error',
        message: 'Vous n\'avez pas les droits nécessaires pour supprimer un membre du projet.'
      });
      return;
    }

    // Empêcher l'utilisateur de se supprimer lui-même
    if (auth.user.id === userId) {
      setFlash({
        type: 'error',
        message: 'Vous ne pouvez pas vous supprimer vous-même du projet.'
      });
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir supprimer ce membre du projet ?')) return;
    
    // Utiliser la route de suppression standard du contrôleur
    router.delete(route('project-users.destroy', project.id), {
      data: { user_id: userId },
      preserveScroll: true,
      onSuccess: () => {
        // Mettre à jour l'interface après suppression
        router.reload({ only: ['project'] });
        setFlash({
          type: 'success',
          message: 'Le membre a été supprimé du projet avec succès.'
        });
      },
      onError: (errors) => {
        setFlash({
          type: 'error',
          message: errors?.message || 'Une erreur est survenue lors de la suppression du membre.'
        });
      }
    });
  };
  
  // Fonction pour basculer l'affichage des actions d'un membre
  const toggleMemberActions = (userId, e) => {
    e.stopPropagation(); // Empêche la propagation du clic
    
    // Créer un nouvel objet d'état qui ferme tous les autres menus et bascule l'état actuel
    setShowMemberActions(prevState => {
      const newState = {};
      // Si le menu est déjà ouvert, on le ferme, sinon on l'ouvre et on ferme les autres
      newState[userId] = !prevState[userId];
      return newState;
    });
  };

  // Préparation des données pour le graphique d'évolution (30 derniers jours)
  const last30Days = Array.from({length: 30}, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split('T')[0];
  });

  // Compter les tâches par date
  const taskCounts = last30Days.map(date => {
    const tasksData = tasks.data || []; // Handle paginated tasks data
    const tasksForDate = tasksData.filter(task => {
      const taskDate = new Date(task.created_at).toISOString().split('T')[0];
      return taskDate === date;
    });
    
    return {
      date,
      total: tasksForDate.length,
      done: tasksForDate.filter(t => t.status === 'done').length
    };
  });

  // Calculer les totaux cumulés
  let cumulativeTotal = 0;
  let cumulativeDone = 0;
  
  const chartData = taskCounts.map(day => {
    cumulativeTotal += day.total;
    cumulativeDone += day.done;
    
    return {
      ...day,
      cumulativeTotal,
      cumulativeDone,
      inProgress: cumulativeTotal - cumulativeDone
    };
  });
  
  // Données pour le graphique
  const trendChartData = {
    labels: last30Days.map(date => new Date(date).toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit'})),
    datasets: [
      {
        label: 'Tâches totales',
        data: chartData.map(d => d.cumulativeTotal),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true
      },
      {
        label: 'Tâches terminées',
        data: chartData.map(d => d.cumulativeDone),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true
      }
    ],
  };

  // Configuration des options du graphique
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) {
              label += context.parsed.y + ' ' + (context.parsed.y > 1 ? 'tâches' : 'tâche');
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Nombre de tâches',
          color: '#6b7280',
          font: { weight: 'bold' }
        },
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { stepSize: 1, precision: 0 }
      },
      x: {
        grid: { display: false },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      }
    }
  };

  const trendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgb(0 0 0 / 70%)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderRadius: 8,
        padding: 12,
        displayColors: false,
        callbacks: {
            label: (context) => ` ${context.parsed.y} tâches terminées`
        }
      },
    },
    scales: {
      x: { 
          grid: { 
            display: false 
          },
          ticks: { 
            color: '#9ca3af' 
          }
      },
      y: { 
          beginAtZero: true, 
          grid: { 
            color: 'rgba(229, 231, 235, 0.5)'
          },
          ticks: { 
            color: '#9ca3af'
          }
      },
    },
  };

  // Helpers pour badges
  const getStatusBadge = (status) => {
    let color = 'bg-gray-200 text-gray-800';
    let text = 'Inconnu';
    
    if (status === 'in_progress') {
      color = 'bg-yellow-200 text-yellow-800';
      text = 'En cours';
    } else if (status === 'done') {
      color = 'bg-green-200 text-green-800';
      text = 'Terminée';
    } else if (status === 'todo') {
      color = 'bg-blue-200 text-blue-800';
      text = 'À faire';
    }
    
    return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${color}`}>{text}</span>;
  };

  const getPriorityBadge = (priority) => {
    let color = 'bg-gray-200 text-gray-700';
    let text = 'Non définie';
    
    if (priority === 'high') {
      color = 'bg-red-200 text-red-800';
      text = 'Haute';
    } else if (priority === 'medium') {
      color = 'bg-orange-200 text-orange-800';
      text = 'Moyenne';
    } else if (priority === 'low') {
      color = 'bg-blue-200 text-blue-800';
      text = 'Basse';
    }
    
    return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${color}`}>{text}</span>;
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await fetch(`/projects/${project.id}`, {
        method: 'DELETE',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        },
      });
      window.location.href = '/projects';
    } catch (e) {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 overflow-hidden">
        {/* Header sticky */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 py-4 px-4">
            <div className="flex items-center gap-3">
                <FaProjectDiagram className="text-2xl text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Détails du Projet</h1>
            </div>
            <Link
                href="/projects"
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 font-semibold transition flex items-center justify-center gap-2 rounded-lg"
            >
                <FaArrowLeft /> Retour
            </Link>
          </div>
        </header>
        <main className="w-full flex flex-col items-center p-2 sm:p-4">
          <div className="w-full max-w-full px-2 sm:px-4">
            {flash.success && (
              <div className="mb-6 px-4 py-3 rounded-lg bg-green-100 text-green-800 font-semibold border border-green-200">
                {flash.success}
              </div>
            )}
            
            {/* Notification flash personnalisée */}
            <div className="fixed bottom-4 right-4 z-50">
              {flashMessage && (
                <div 
                  className={`px-6 py-4 rounded-lg shadow-lg ${
                    flashMessage.type === 'success' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : flashMessage.type === 'error' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}
                  style={isMuted ? { display: 'block' } : {}}
                >
                  {flashMessage.message}
                </div>
              )}
            </div>

            {/* Informations du projet */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
              {/* Carte principale du projet */}
              <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-shadow duration-300 ease-in-out">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                    <FaProjectDiagram className="text-white text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent dark:from-blue-400 dark:to-blue-300">
                      {project.name}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                      <FaCalendarAlt className="text-blue-500" />
                      <span>Créé le {new Date(project.created_at).toLocaleDateString('fr-FR', {day: '2-digit', month: 'long', year: 'numeric'})}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <FaClipboardList className="text-blue-500" /> Description
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-100 dark:border-gray-600">
                      {project.description || 'Aucune description fournie'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Carte des membres */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-shadow duration-300 ease-in-out">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Membres ({project.users?.length || 0})</h3>
                  <Link 
                    href={route('project-users.show', project.id)}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-1"
                  >
                    <FaEye className="text-sm" />
                    <span>Voir tout</span>
                  </Link>
                </div>
                <div className="space-y-3">
                  {project.users && project.users.length > 0 ? (
                    project.users.map(user => (
                      <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <div className="relative">
                          <img 
                            src={user.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=fff`} 
                            alt={user.name} 
                            className="w-11 h-11 rounded-full border-2 border-blue-200 dark:border-blue-800 object-cover" 
                          />
                          
                          {/* Menu d'actions pour les administrateurs et managers */}
                          {(isAdmin || (isManager && auth.user.id !== user.id)) && (
                            <div className="relative">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleMemberActions(user.id, e);
                                }}
                                className="absolute -top-2 -right-2 p-1 bg-white dark:bg-gray-700 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors z-50"
                                aria-expanded={!!showMemberActions[user.id]}
                                aria-haspopup="true"
                                aria-label="Actions du membre"
                              >
                                <FaEllipsisV className="w-3 h-3 text-gray-500 dark:text-gray-300" />
                              </button>
                              
                              {showMemberActions[user.id] && (
                                <div 
                                  className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 border border-gray-200 dark:border-gray-700"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Link
                                    href={route('project-users.edit', { project: project.id, user: user.id })}
                                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    <FaUserCog className="inline mr-2" />
                                    Gérer le membre
                                  </Link>
                                  <button
                                    onClick={() => handleRemoveMember(user.id)}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2"
                                  >
                                    <FaUserMinus />
                                    Retirer du projet
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</div>
                          <div className="mt-2">
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                              user.role === 'admin' 
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                                : user.role === 'manager' 
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  : user.role === 'observer'
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            }`}>
                              {user.role === 'admin' ? (
                                <FaShieldAlt className="text-red-500" />
                              ) : user.role === 'manager' ? (
                                <FaCrown className="text-yellow-500" />
                              ) : user.role === 'observer' ? (
                                <FaEye className="text-purple-500" />
                              ) : (
                                <FaUser className="text-blue-500" />
                              )}
                              {user.role === 'admin' 
                                ? 'Administrateur' 
                                : user.role === 'manager' 
                                  ? 'Chef de projet'
                                  : user.role === 'observer'
                                    ? 'Observateur'
                                    : 'Membre'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-gray-400 dark:text-gray-500">
                      <FaUserFriends className="mx-auto text-3xl mb-2" />
                      <p>Aucun membre dans ce projet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions Rapides */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 mb-6 shadow-sm hover:shadow-xl transition-shadow duration-300 ease-in-out">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Actions Rapides</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {!isMuted && (
                  <div className="relative group">
                    <button 
                      className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 w-full"
                    >
                      <FaFileAlt className="text-lg" />
                      <span>Exporter le suivi</span>
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </button>
                    <div className="absolute z-10 hidden group-hover:block w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mt-1">
                      <a 
                        href={`/projects/${project.id}/suivi-global/txt`}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="text-blue-500">📄</span>
                        <span>Format TXT</span>
                      </a>
                      <a 
                        href={`/projects/${project.id}/suivi-global/pdf`}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="text-red-500">📊</span>
                        <span>Format PDF</span>
                      </a>
                      <a 
                        href={`/projects/${project.id}/suivi-global/docx`}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="text-blue-700">📝</span>
                        <span>Format Word</span>
                      </a>
                    </div>
                  </div>
                )}
                {(isAdmin || isManager) ? (
                  <>
                    <Link
                      href={route('project-users.create')}
                      className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      <FaUserPlus className="text-lg" />
                      <span>Ajouter un membre</span>
                    </Link>
                    <Link
                      href={`/project-users/${project.id}/edit`}
                      className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      <FaUserFriends className="text-lg" />
                      <span>Modifier les membres</span>
                    </Link>
                    <Link
                      href={`/tasks/create?project_id=${project.id}`}
                      className="flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      <FaTasks className="text-lg" />
                      <span>Créer une tâche</span>
                    </Link>
                    <Link
                      href={`/projects/${project.id}/edit`}
                      className={`inline-flex items-center px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                        isMuted 
                          ? 'bg-gray-400 text-gray-700 cursor-not-allowed opacity-70' 
                          : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                      }`}
                      {...getReadOnlyProps()}
                    >
                      <FaEdit className="mr-2" />
                      {isMuted ? 'Lecture seule' : 'Modifier'}
                    </Link>
                    <button
                      onClick={(e) => {
                        if (isMuted) {
                          e.preventDefault();
                          setFlash({
                            type: 'warning',
                            message: 'Vous êtes en mode lecture seule pour ce projet.'
                          });
                          return;
                        }
                        setShowDeleteModal(true);
                      }}
                      className={`inline-flex items-center px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                        isMuted 
                          ? 'bg-gray-400 text-gray-700 cursor-not-allowed opacity-70' 
                          : 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                      }`}
                      disabled={isMuted}
                    >
                      <FaTrash className="mr-2" />
                      Supprimer
                    </button>
                  </>
                ) : (
                  <div className="col-span-full text-center text-gray-500 dark:text-gray-400 text-sm italic p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    Seuls les administrateurs et les gestionnaires peuvent effectuer des actions sur ce projet.
                  </div>
                )}
              </div>
            </div>

            {/* Graphique d'évolution des tâches */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 mb-6 shadow-sm hover:shadow-xl transition-shadow duration-300 ease-in-out">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  <FaChartLine className="text-blue-500" /> Évolution des tâches (30 derniers jours)
                </h3>
                <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                  <div className="flex items-center gap-1 text-sm">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    <span className="text-gray-600 dark:text-gray-300">Total</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    <span className="text-gray-600 dark:text-gray-300">Terminées</span>
                  </div>
                </div>
              </div>
              
              <div className="h-64 sm:h-72 w-full">
                <Line data={trendChartData} options={chartOptions} />
              </div>
              
              <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                <p>Évolution du nombre total de tâches et des tâches terminées au fil du temps</p>
                <p className="text-xs mt-1">Les données sont cumulatives et montrent la progression globale</p>
              </div>
              
              <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs">
                <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full">
                  <span className="font-semibold">{stats.todoTasksCount || 0}</span> tâches à faire
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full">
                  <span className="font-semibold">{stats.inProgressTasksCount || 0}</span> en cours
                </div>
                <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full">
                  <span className="font-semibold">{stats.doneTasksCount || 0}</span> tâches terminées
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full">
                  <span className="font-semibold">{stats.totalTasks || 0}</span> tâches au total
                </div>
              </div>
            </div>

            {/* Tâches du projet */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 mb-6 shadow-sm hover:shadow-xl transition-shadow duration-300 ease-in-out">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  <FaTasks className="text-blue-500" /> Tâches ({tasks?.total || 0})
                </h3>
                
                <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                  <Link 
                    href={route('tasks.create', { project_id: project.id })}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors duration-200 whitespace-nowrap ${
                      isMuted 
                        ? 'bg-gray-400 text-gray-700 cursor-not-allowed opacity-70' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                    {...getReadOnlyProps()}
                  >
                    <FaPlus size={12} />
                    <span>{isMuted ? 'Lecture seule' : 'Nouvelle tâche'}</span>
                  </Link>
                  
                  {tasks?.meta && (
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      <span className="font-medium">{tasks.meta.from || 0}-{tasks.meta.to || 0}</span> sur{' '}
                      <span className="font-medium">{tasks.meta.total || 0}</span> tâches
                    </div>
                  )}
                </div>
              </div>
              
              {(!tasks?.data || tasks.data.length === 0) ? (
                <div className="text-center py-12 px-4">
                  <FaTasks className="text-5xl mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">Aucune tâche pour ce projet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Créez votre première tâche pour commencer à organiser le travail</p>
                  <Link 
                    href={route('tasks.create', { project_id: project.id })}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                  >
                    <FaPlus />
                    <span>Créer une tâche</span>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th scope="col" className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Tâche
                        </th>
                        <th scope="col" className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                          Responsable
                        </th>
                        <th scope="col" className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Statut
                        </th>
                        <th scope="col" className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Priorité
                        </th>
                        <th scope="col" className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                          Échéance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {tasks.data && tasks.data.map(task => (
                        <tr 
                          key={task.id} 
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer"
                          onClick={() => router.visit(route('tasks.show', task.id))}
                        >
                          <td className="px-2 sm:px-3 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`flex-shrink-0 h-3 w-3 rounded-full ${getStatusColor(task.status)} mr-3`}></div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                {task.title}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-xs">
                              {task.description ? 
                                (task.description.split(' ').slice(0, 2).join(' ') + (task.description.split(' ').length > 2 ? '...' : '')) : 
                                'Aucune description'}
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 py-3 whitespace-nowrap">
                            {task.assigned_user ? (
                              <div className="flex items-center">
                                <img 
                                  className="h-8 w-8 rounded-full mr-3" 
                                  src={task.assigned_user.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(task.assigned_user.name)}&background=3b82f6&color=fff`} 
                                  alt={task.assigned_user.name} 
                                />
                                <div className="text-sm text-gray-900 dark:text-gray-100">
                                  {task.assigned_user.name}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500 dark:text-gray-400">Non assignée</span>
                            )}
                          </td>
                          <td className="px-2 sm:px-3 py-3 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(task.status)}`}>
                              {task.status === 'todo' ? 'À faire' :
                               task.status === 'in_progress' ? 'En cours' :
                               task.status === 'done' ? 'Terminé' :
                               task.status === 'pending' ? 'En attente' :
                               task.status === 'nouveau' ? 'Nouveau' :
                               task.status === 'en_cours' ? 'En cours' :
                               task.status === 'termine' ? 'Terminé' :
                               task.status === 'en_attente' ? 'En attente' : task.status}
                            </span>
                          </td>
                          <td className="px-2 sm:px-3 py-3 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              task.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                              'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            }`}>
                              {task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
                            </span>
                          </td>
                          <td className="px-2 sm:px-3 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {task.due_date ? new Date(task.due_date).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            }) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Pagination */}
                  {tasks.links && tasks.links.length > 3 && (
                    <div className="mt-6 flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 sm:px-6 rounded-b-lg">
                      <div className="flex-1 flex justify-between sm:hidden">
                        {tasks.links[0].url && (
                          <Link 
                            href={tasks.links[0].url} 
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
                            preserveScroll
                          >
                            Précédent
                          </Link>
                        )}
                        {tasks.links[tasks.links.length - 1].url && (
                          <Link 
                            href={tasks.links[tasks.links.length - 1].url} 
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
                            preserveScroll
                          >
                            Suivant
                          </Link>
                        )}
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            Affichage de <span className="font-medium">{tasks.meta.from}</span> à <span className="font-medium">{tasks.meta.to}</span> sur{' '}
                            <span className="font-medium">{tasks.meta.total}</span> résultats
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            {tasks.links.map((link, index) => (
                              <Link
                                key={index}
                                href={link.url || '#'}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  link.active
                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                                } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                preserveScroll
                                dangerouslySetInnerHTML={{ __html: link.label }}
                              />
                            ))}
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Statistiques et graphique */}
          <div className="w-full max-w-full px-2 sm:px-4 mb-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <StatCard icon={<FaCheckCircle className="text-green-500 text-3xl" />} label="Tâches terminées" value={stats.doneTasksCount ?? 0} />
                <StatCard icon={<FaFileAlt className="text-blue-500 text-3xl" />} label="Fichiers" value={stats.filesCount ?? 0} />
                <StatCard icon={<FaCommentDots className="text-purple-500 text-3xl" />} label="Commentaires" value={stats.commentsCount ?? 0} />
                <StatCard icon={<FaUsers className="text-yellow-500 text-3xl" />} label="Membres" value={project.users?.length ?? 0} />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 mb-6 shadow-sm hover:shadow-xl transition-shadow duration-300 ease-in-out">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                <FaUsers /> Tâches terminées par membre
              </h3>
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {project.users?.map(user => {
                  const tasksData = tasks.data || [];
                  const userDoneTasks = tasksData.filter(t => t.status === 'done' && t.assigned_to === user.id);
                  return (
                    <li key={user.id} className="flex flex-col md:flex-row md:items-center justify-between py-3 gap-2">
                      <span className="flex items-center gap-3 min-w-[180px]">
                        <img src={user.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`} alt={user.name} className="w-8 h-8 rounded-full border" />
                        <span className="font-semibold text-gray-700 dark:text-gray-200">{user.name}</span>
                      </span>
                      <span className="flex-1 flex flex-wrap gap-2 items-center">
                        {userDoneTasks.length > 0 ? userDoneTasks.map(t => (
                          <span key={t.id} className="inline-flex items-center px-2.5 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full border border-green-200 dark:border-green-700">
                            <FaCheckCircle className="mr-1.5 text-green-500" /> {t.title}
                          </span>
                        )) : <span className="text-gray-400 text-xs italic">Aucune tâche terminée</span>}
                      </span>
                      <span className="text-blue-600 font-bold text-lg min-w-[32px] text-right">{stats.doneTasksByUser?.[user.id] ?? 0}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </main>
      </div>

      {/* Modal de confirmation de suppression */}
      <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} maxWidth="md">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <FaTrash className="text-red-600 text-xl" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Confirmer la suppression</h2>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              Êtes-vous sûr de vouloir supprimer le projet <span className="font-semibold text-blue-700">{project.name}</span> ?
            </p>
            <div className="bg-red-50 dark:bg-red-900/50 p-4 rounded-lg border border-red-200 dark:border-red-700">
              <p className="text-red-700 dark:text-red-300 text-sm font-semibold mb-2 flex items-center gap-2">
                <FaExclamationTriangle /> Attention : Cette action est irréversible !
              </p>
              <p className="text-red-600 dark:text-red-400 text-sm">
                La suppression de ce projet entraînera également la suppression de toutes les données associées.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold transition"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleteLoading}
            >
              Annuler
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition flex items-center gap-2 disabled:opacity-50"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Suppression...
                </>
              ) : (
                <>
                  <FaTrash /> Supprimer définitivement
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

const StatCard = ({ icon, label, value }) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-shadow duration-300 ease-in-out">
        {icon}
        <div className="text-3xl font-extrabold text-gray-800 dark:text-gray-100 mt-2">{value}</div>
        <div className="text-gray-500 dark:text-gray-400 text-sm mt-1">{label}</div>
    </div>
);

Show.layout = page => <AdminLayout children={page} />;
export default Show;