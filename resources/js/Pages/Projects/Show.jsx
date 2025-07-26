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
    FaLightbulb
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
  const isAdmin = auth?.role === 'admin' || auth?.roles?.includes?.('admin');
  const isManager = auth?.role === 'manager' || auth?.roles?.includes?.('manager');
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  // Préparation des données pour le graphique de tendance
  const doneTasksByWeek = stats.doneTasksByWeek || [];
  const weekLabels = doneTasksByWeek.map(w => w.yearweek);
  const weekData = doneTasksByWeek.map(w => w.count);

  const trendChartData = {
    labels: weekLabels,
    datasets: [
      {
        label: 'Tâches terminées',
        data: weekData,
        fill: true,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: (context) => {
            const chart = context.chart;
            const {ctx, chartArea} = chart;
            if (!chartArea) {
                return null;
            }
            const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
            gradient.addColorStop(0, 'rgba(59, 130, 246, 0)');
            gradient.addColorStop(1, 'rgba(59, 130, 246, 0.4)');
            return gradient;
        },
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(59, 130, 246)',
      },
    ],
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
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <FaUserFriends className="text-blue-500" /> Membres ({project.users?.length || 0})
                  </h3>
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

            {/* Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 mb-10 shadow-sm hover:shadow-xl transition-shadow duration-300 ease-in-out">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Actions Rapides</h3>
              <div className="flex flex-wrap gap-4">
                {(isAdmin || isManager) && (
                  <Link
                    href={`/project-users/${project.id}/edit`}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 font-semibold transition flex items-center justify-center gap-2 rounded-lg"
                  >
                    <FaUsers /> Ajouter un membre
                  </Link>
                )}
                {(isAdmin || isManager) && (
                  <Link
                    href={`/tasks/create?project_id=${project.id}`}
                    className="bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 font-semibold transition flex items-center justify-center gap-2 rounded-lg"
                  >
                    <FaTasks /> Créer une tâche
                  </Link>
                )}
                {(isAdmin || isManager) && (
                  <Link
                    href={`/sprints/create?project_id=${project.id}`}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-5 py-2.5 font-semibold transition flex items-center justify-center gap-2 rounded-lg"
                  >
                    <FaClipboardList /> Créer un sprint
                  </Link>
                )}
                <Link
                  href={`/projects/${project.id}/edit`}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2.5 font-semibold transition flex items-center justify-center gap-2 rounded-lg"
                >
                  <FaEdit /> Modifier
                </Link>
                {isAdmin && (
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 font-semibold transition flex items-center justify-center gap-2 rounded-lg"
                  >
                    <FaTrash /> Supprimer
                  </button>
                )}
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
                <FaChartLine /> Tendance des tâches terminées
              </h3>
              <div className="w-full h-80">
                <Line data={trendChartData} options={trendChartOptions} />
              </div>
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