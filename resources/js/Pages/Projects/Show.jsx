import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { FaProjectDiagram, FaUsers, FaTasks, FaEdit, FaEye, FaArrowLeft, FaCalendarAlt, FaUserFriends, FaClipboardList, FaTrash, FaChartLine, FaFileAlt, FaCommentDots, FaCheckCircle } from 'react-icons/fa';
import { Bar } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);
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
  const chartData = {
    labels: weekLabels,
    datasets: [
      {
        label: 'Tâches terminées',
        data: weekData,
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderRadius: 6,
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: '#e5e7eb' } },
    },
  };

  // Helpers pour badges
  const getStatusBadge = (status) => {
    let color = 'bg-gray-100 text-gray-800';
    let text = 'Inconnu';
    
    if (status === 'in_progress') {
      color = 'bg-yellow-100 text-yellow-800';
      text = 'En cours';
    } else if (status === 'done') {
      color = 'bg-green-100 text-green-800';
      text = 'Terminée';
    } else if (status === 'todo') {
      color = 'bg-blue-100 text-blue-800';
      text = 'À faire';
    }
    
    return <span className={`px-2 py-1 rounded text-xs font-bold ${color}`}>{text}</span>;
  };

  const getPriorityBadge = (priority) => {
    let color = 'bg-gray-100 text-gray-700';
    let text = 'Non définie';
    
    if (priority === 'high') {
      color = 'bg-red-100 text-red-800';
      text = 'Haute';
    } else if (priority === 'medium') {
      color = 'bg-orange-100 text-orange-800';
      text = 'Moyenne';
    } else if (priority === 'low') {
      color = 'bg-blue-100 text-blue-800';
      text = 'Basse';
    }
    
    return <span className={`px-2 py-1 rounded text-xs font-bold ${color}`}>{text}</span>;
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
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 overflow-x-hidden">
        {/* Header sticky */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800 shadow">
          <div className="max-w-7xl mx-auto flex items-center gap-3 py-4 px-4">
            <FaProjectDiagram className="text-3xl text-blue-600" />
            <h1 className="text-3xl font-extrabold text-blue-700 dark:text-blue-200 tracking-tight">Détail du projet</h1>
          </div>
        </header>
        <main className="w-full flex flex-col items-center px-2 md:px-0">
          {/* Actions en haut */}
          <div className="w-full max-w-7xl mt-8 mb-8">
            <div className="bg-white dark:bg-gray-800 shadow p-6 border border-blue-100 dark:border-gray-800 mb-8">
              <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center items-center">
                {(isAdmin || isManager) && (
                  <Link
                    href={`/project-users/${project.id}/edit`}
                    className="w-full sm:w-auto bg-blue-100 hover:bg-blue-200 text-blue-800 px-6 py-3 font-semibold transition flex items-center justify-center gap-2 border border-blue-200 dark:border-blue-800"
                  >
                    <FaUsers /> Ajouter un membre
                  </Link>
                )}
                {(isAdmin || isManager) && (
                  <Link
                    href={`/tasks/create?project_id=${project.id}`}
                    className="w-full sm:w-auto bg-green-100 hover:bg-green-200 text-green-800 px-6 py-3 font-semibold transition flex items-center justify-center gap-2 border border-green-200 dark:border-green-800"
                  >
                    <FaTasks /> Créer une tâche
                  </Link>
                )}
                {(isAdmin || isManager) && (
                  <Link
                    href={`/sprints/create?project_id=${project.id}`}
                    className="w-full sm:w-auto bg-purple-100 hover:bg-purple-200 text-purple-800 px-6 py-3 font-semibold transition flex items-center justify-center gap-2 border border-purple-200 dark:border-purple-800"
                  >
                    <FaClipboardList /> Créer un sprint
                  </Link>
                )}
                <Link
                  href={`/projects/${project.id}/edit`}
                  className="w-full sm:w-auto bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-6 py-3 font-semibold transition flex items-center justify-center gap-2 border border-yellow-200 dark:border-yellow-800"
                >
                  <FaEdit /> Modifier le projet
                </Link>
                {isAdmin && (
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="w-full sm:w-auto bg-red-100 hover:bg-red-200 text-red-800 px-6 py-3 font-semibold transition flex items-center justify-center gap-2 border border-red-200 dark:border-red-800"
                  >
                    <FaTrash /> Supprimer le projet
                  </button>
                )}
                <Link
                  href="/projects"
                  className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 font-semibold transition flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700"
                >
                  <FaArrowLeft /> Retour à la liste
                </Link>
              </div>
            </div>
          </div>
          <div className="w-full max-w-7xl">
            {/* Header section supprimé (doublon) */}

            {flash.success && (
              <div className="mb-6 px-4 py-3 rounded-lg bg-green-100 text-green-800 font-semibold">
                {flash.success}
              </div>
            )}

            {/* Informations du projet */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
              {/* Carte principale du projet */}
              <div className="lg:col-span-2 bg-white dark:bg-gray-800 shadow p-8 border border-blue-100 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <FaProjectDiagram className="text-blue-600 dark:text-blue-200 text-xl" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-200">{project.name}</h2>
                  </div>
                </div>
                
                {project.description && (
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <FaClipboardList /> Description
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      {project.description}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <FaCalendarAlt />
                    Créé le {new Date(project.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Carte des membres */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-blue-100 dark:border-gray-800">
                <h3 className="text-lg font-bold text-blue-700 dark:text-blue-200 mb-4 flex items-center gap-2">
                  <FaUserFriends /> Membres ({project.users?.length || 0})
                </h3>
                {project.users && project.users.length > 0 ? (
                  <div className="space-y-3">
                    {project.users.map(user => (
                      <div key={user.id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <img 
                          src={user.profile_photo_url || (user.profile_photo_path ? `/storage/${user.profile_photo_path}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`)} 
                          alt={user.name} 
                          className="w-8 h-8 rounded-full border-2 border-blue-200" 
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-blue-700 dark:text-blue-200 text-sm">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 text-center py-4">Aucun membre</div>
                )}
              </div>
            </div>

            {/* Tâches du projet */}
            <div className="bg-white dark:bg-gray-800 shadow p-8 border border-blue-100 dark:border-gray-800 mb-10">
              <h3 className="text-xl font-bold text-blue-700 dark:text-blue-200 mb-6 flex items-center gap-2">
                <FaTasks /> Tâches rattachées ({tasks.length})
              </h3>
              
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                  <FaTasks className="text-4xl mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-semibold">Aucune tâche pour ce projet</p>
                  <p className="text-sm">Les tâches créées pour ce projet apparaîtront ici</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gradient-to-r from-blue-100 to-blue-300 dark:from-blue-900 dark:to-blue-700">
                      <tr>
                        <th className="p-3 text-left font-bold">Tâche</th>
                        <th className="p-3 text-left font-bold">Description</th>
                        <th className="p-3 text-left font-bold">Statut</th>
                        <th className="p-3 text-left font-bold">Priorité</th>
                        <th className="p-3 text-left font-bold">Assignée à</th>
                        <th className="p-3 text-left font-bold">Sprint</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map(task => (
                        <tr 
                          key={task.id} 
                          className="hover:bg-blue-50 dark:hover:bg-blue-900 transition cursor-pointer"
                          onClick={() => window.location.href = `/tasks/${task.id}`}
                          tabIndex={0}
                          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') window.location.href = `/tasks/${task.id}`; }}
                        >
                          <td className="p-3 align-middle">
                            <div className="font-semibold text-blue-700 dark:text-blue-200">
                              {task.title}
                            </div>
                          </td>
                          <td className="p-3 align-middle text-gray-600 dark:text-gray-300">
                            <div className="max-w-xs truncate" title={task.description}>
                              {task.description || 'Aucune description'}
                            </div>
                          </td>
                          <td className="p-3 align-middle">{getStatusBadge(task.status)}</td>
                          <td className="p-3 align-middle">{getPriorityBadge(task.priority)}</td>
                          <td className="p-3 align-middle text-gray-600 dark:text-gray-300">
                            {task.assigned_user?.name || task.assignedUser?.name || <span className="italic text-gray-400">Non assignée</span>}
                          </td>
                          <td className="p-3 align-middle text-gray-600 dark:text-gray-300">
                            {task.sprint ? (
                              <Link href={`/sprints/${task.sprint.id}`} className="text-green-700 dark:text-green-300 hover:underline">
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
        </main>
      </div>

      {/* Statistiques et graphique */}
      <div className="max-w-7xl mx-auto mb-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="bg-white dark:bg-gray-800 shadow p-8 border border-blue-100 dark:border-gray-800 flex flex-col items-center">
            <FaCheckCircle className="text-green-500 text-3xl mb-2" />
            <div className="text-2xl font-bold">{stats.doneTasksCount ?? 0}</div>
            <div className="text-gray-500 text-sm">Tâches terminées</div>
          </div>
          <div className="bg-white dark:bg-gray-800 shadow p-8 border border-blue-100 dark:border-gray-800 flex flex-col items-center">
            <FaFileAlt className="text-blue-500 text-3xl mb-2" />
            <div className="text-2xl font-bold">{stats.filesCount ?? 0}</div>
            <div className="text-gray-500 text-sm">Fichiers</div>
          </div>
          <div className="bg-white dark:bg-gray-800 shadow p-8 border border-blue-100 dark:border-gray-800 flex flex-col items-center">
            <FaCommentDots className="text-purple-500 text-3xl mb-2" />
            <div className="text-2xl font-bold">{stats.commentsCount ?? 0}</div>
            <div className="text-gray-500 text-sm">Commentaires</div>
          </div>
          <div className="bg-white dark:bg-gray-800 shadow p-8 border border-blue-100 dark:border-gray-800 flex flex-col items-center">
            <FaUsers className="text-yellow-500 text-3xl mb-2" />
            <div className="text-2xl font-bold">{project.users?.length ?? 0}</div>
            <div className="text-gray-500 text-sm">Membres</div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow p-8 border border-blue-100 dark:border-gray-800 mb-10">
          <h3 className="text-lg font-bold text-blue-700 dark:text-blue-200 mb-4 flex items-center gap-2">
            <FaChartLine /> Tendance des tâches terminées
          </h3>
          <div className="w-full h-64">
            <Bar data={chartData} options={chartOptions} height={250} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow p-8 border border-blue-100 dark:border-gray-800 mb-10">
          <h3 className="text-lg font-bold text-blue-700 dark:text-blue-200 mb-4 flex items-center gap-2">
            <FaUsers /> Tâches terminées par membre
          </h3>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {project.users?.map(user => {
              const userDoneTasks = tasks.filter(t => t.status === 'done' && t.assigned_to === user.id);
              return (
                <li key={user.id} className="flex flex-col md:flex-row md:items-center justify-between py-2 gap-2">
                  <span className="flex items-center gap-2 min-w-[180px]">
                    <img src={user.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`} alt={user.name} className="w-7 h-7 rounded-full border" />
                    <span className="font-semibold text-gray-700 dark:text-gray-200">{user.name}</span>
                  </span>
                  <span className="flex-1 flex flex-wrap gap-2 items-center">
                    {userDoneTasks.length > 0 ? userDoneTasks.map(t => (
                      <span key={t.id} className="inline-flex items-center px-2 py-1 bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-200 text-xs rounded border border-green-200 dark:border-green-700">
                        <FaCheckCircle className="mr-1 text-green-500" /> {t.title}
                      </span>
                    )) : <span className="text-gray-400 text-xs">Aucune tâche</span>}
                  </span>
                  <span className="text-blue-600 font-bold text-lg min-w-[32px] text-right">{stats.doneTasksByUser?.[user.id] ?? 0}</span>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow p-8 border border-blue-100 dark:border-gray-800 mb-10">
          <h3 className="text-lg font-bold text-blue-700 dark:text-blue-200 mb-4 flex items-center gap-2">
            <FaUsers /> Activités par utilisateur
          </h3>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {stats.activitiesByUser?.length > 0 ? stats.activitiesByUser.map(a => {
              const user = project.users?.find(u => u.id === a.user_id);
              return user ? (
                <li key={user.id} className="flex items-center justify-between py-2">
                  <span className="flex items-center gap-2">
                    <img src={user.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`} alt={user.name} className="w-7 h-7 rounded-full border" />
                    <span className="font-semibold text-gray-700 dark:text-gray-200">{user.name}</span>
                  </span>
                  <span className="text-green-600 font-bold text-lg">{a.count}</span>
                </li>
              ) : null;
            }) : <li className="text-gray-400">Aucune activité enregistrée</li>}
          </ul>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow p-8 border border-blue-100 dark:border-gray-800 mb-10">
          <h3 className="text-lg font-bold text-blue-700 dark:text-blue-200 mb-4 flex items-center gap-2">
            <FaCheckCircle /> Liste des tâches terminées
          </h3>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {tasks.filter(t => t.status === 'done').length === 0 && (
              <li className="text-gray-400">Aucune tâche terminée</li>
            )}
            {tasks.filter(t => t.status === 'done').map(t => (
              <li key={t.id} className="py-2 flex items-center gap-2">
                <FaCheckCircle className="text-green-500" />
                <span className="font-semibold text-gray-700 dark:text-gray-200">{t.title}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} maxWidth="md">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <FaTrash className="text-red-600 text-lg" />
            </div>
            <h2 className="text-xl font-bold text-red-700">Confirmer la suppression</h2>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              Êtes-vous sûr de vouloir supprimer le projet <span className="font-semibold text-blue-700">{project.name}</span> ?
            </p>
            <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg border border-red-200 dark:border-red-700">
              <p className="text-red-700 dark:text-red-300 text-sm font-semibold mb-2">⚠️ Attention : Cette action est irréversible !</p>
              <p className="text-red-600 dark:text-red-400 text-sm">
                La suppression de ce projet entraînera également la suppression de :
              </p>
              <ul className="text-red-600 dark:text-red-400 text-sm mt-2 ml-4 list-disc">
                <li>Toutes les tâches associées ({tasks.length} tâche{tasks.length !== 1 ? 's' : ''})</li>
                <li>Tous les sprints du projet</li>
                <li>Tous les fichiers liés</li>
                <li>Tous les messages du projet</li>
                <li>L'historique des activités</li>
              </ul>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold transition"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleteLoading}
            >
              Annuler
            </button>
            <button
              className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-semibold transition flex items-center gap-2 disabled:opacity-50"
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

Show.layout = page => <AdminLayout children={page} />;
export default Show; 