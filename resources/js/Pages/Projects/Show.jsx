import React, { useState, useEffect } from 'react';
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

function Show({ project, tasks = [], auth, stats = {} }) {
  const { flash = {} } = usePage().props;
  
  // Récupération des rôles de l'utilisateur
  const userRoles = auth?.user?.roles || [];
  const isAdmin = userRoles.includes('admin');
  const isManager = userRoles.includes('manager');
  
  // Logs de débogage
  console.log('User roles from auth:', userRoles);
  console.log('isAdmin:', isAdmin, 'isManager:', isManager);

  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  // Préparation des données pour le graphique d'évolution (30 derniers jours)
  const last30Days = Array.from({length: 30}, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split('T')[0];
  });

  // Compter les tâches par date
  const taskCounts = last30Days.map(date => {
    const tasksForDate = tasks.filter(task => {
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
      <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
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
        <main className="w-full flex flex-col items-center px-4 md:px-0 py-8">
          <div className="w-full max-w-7xl">

            {flash.success && (
              <div className="mb-6 px-4 py-3 rounded-lg bg-green-100 text-green-800 font-semibold border border-green-200">
                {flash.success}
              </div>
            )}

            {/* Informations du projet */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
              {/* Carte principale du projet */}
              <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-shadow duration-300 ease-in-out">
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
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-shadow duration-300 ease-in-out">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Membres ({project.users?.length || 0})</h3>
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
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-800 dark:text-gray-200 truncate">{user.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</div>
                          <div className="flex items-center justify-between mt-2">
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
                            {user.pivot_created_at && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(user.pivot_created_at).toLocaleDateString('fr-FR')}
                              </div>
                            )}
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 mb-10 shadow-sm hover:shadow-xl transition-shadow duration-300 ease-in-out">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Actions Rapides</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <a 
                  href={`/projects/${project.id}/suivi-global`}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaFileAlt className="text-lg" />
                  <span>Télécharger le suivi global</span>
                </a>
                
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
                      className="flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      <FaEdit className="text-lg" />
                      <span>Modifier le projet</span>
                    </Link>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 w-full"
                    >
                      <FaTrash className="text-lg" />
                      <span>Supprimer le projet</span>
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 mb-10 shadow-sm hover:shadow-xl transition-shadow duration-300 ease-in-out">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  <FaChartLine className="text-blue-500" /> Évolution des tâches (30 derniers jours)
                </h3>
                <div className="flex items-center gap-4 mt-2 md:mt-0">
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
              
              <div className="h-80 w-full">
                <Line data={trendChartData} options={chartOptions} />
              </div>
              
              <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                <p>Évolution du nombre total de tâches et des tâches terminées au fil du temps</p>
                <p className="text-xs mt-1">Les données sont cumulatives et montrent la progression globale</p>
              </div>
              
              <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs">
                <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full">
                  <span className="font-semibold">{tasks.length}</span> tâches au total
                </div>
                <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full">
                  <span className="font-semibold">{tasks.filter(t => t.status === 'done').length}</span> tâches terminées
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full">
                  <span className="font-semibold">{tasks.filter(t => t.status === 'in_progress').length}</span> en cours
                </div>
              </div>
            </div>

            {/* Tâches du projet */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 mb-10 shadow-sm hover:shadow-xl transition-shadow duration-300 ease-in-out">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
                <FaTasks /> Tâches rattachées ({tasks.length})
              </h3>
              
              {tasks.length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                  <FaTasks className="text-5xl mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-semibold">Aucune tâche pour ce projet</p>
                  <p className="text-sm">Les tâches créées pour ce projet apparaîtront ici</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                      <tr>
                        <th className="p-4 text-left font-bold text-gray-600 dark:text-gray-300">Tâche</th>
                        <th className="p-4 text-left font-bold text-gray-600 dark:text-gray-300">Description</th>
                        <th className="p-4 text-left font-bold text-gray-600 dark:text-gray-300">Statut</th>
                        <th className="p-4 text-left font-bold text-gray-600 dark:text-gray-300">Priorité</th>
                        <th className="p-4 text-left font-bold text-gray-600 dark:text-gray-300">Assignée à</th>
                        <th className="p-4 text-left font-bold text-gray-600 dark:text-gray-300">Sprint</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map(task => (
                        <tr 
                          key={task.id} 
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer border-b border-gray-200 dark:border-gray-700"
                          onClick={() => window.location.href = `/tasks/${task.id}`}
                          tabIndex={0}
                          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') window.location.href = `/tasks/${task.id}`; }}
                        >
                          <td className="p-4 align-middle">
                            <div className="font-semibold text-gray-800 dark:text-gray-200">
                              {task.title}
                            </div>
                          </td>
                          <td className="p-4 align-middle text-gray-600 dark:text-gray-300">
                            <div className="max-w-xs truncate" title={task.description}>
                              {task.description || 'Aucune description'}
                            </div>
                          </td>
                          <td className="p-4 align-middle">{getStatusBadge(task.status)}</td>
                          <td className="p-4 align-middle">{getPriorityBadge(task.priority)}</td>
                          <td className="p-4 align-middle text-gray-600 dark:text-gray-300">
                            {task.assigned_user?.name || task.assignedUser?.name || <span className="italic text-gray-400">Non assignée</span>}
                          </td>
                          <td className="p-4 align-middle text-gray-600 dark:text-gray-300">
                            {task.sprint ? (
                              <Link href={`/sprints/${task.sprint.id}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                                {task.sprint.name}
                              </Link>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Statistiques et graphique */}
          <div className="w-full max-w-7xl mx-auto mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
                <StatCard icon={<FaCheckCircle className="text-green-500 text-3xl" />} label="Tâches terminées" value={stats.doneTasksCount ?? 0} />
                <StatCard icon={<FaFileAlt className="text-blue-500 text-3xl" />} label="Fichiers" value={stats.filesCount ?? 0} />
                <StatCard icon={<FaCommentDots className="text-purple-500 text-3xl" />} label="Commentaires" value={stats.commentsCount ?? 0} />
                <StatCard icon={<FaUsers className="text-yellow-500 text-3xl" />} label="Membres" value={project.users?.length ?? 0} />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 mb-10 shadow-sm hover:shadow-xl transition-shadow duration-300 ease-in-out">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                <FaUsers /> Tâches terminées par membre
              </h3>
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {project.users?.map(user => {
                  const userDoneTasks = tasks.filter(t => t.status === 'done' && t.assigned_to === user.id);
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