import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { FaProjectDiagram, FaUsers, FaTasks, FaEdit, FaEye, FaArrowLeft, FaCalendarAlt, FaUserFriends, FaClipboardList, FaTrash } from 'react-icons/fa';
import Modal from '../../Components/Modal';

function Show({ project, tasks = [] }) {
  const { flash = {} } = usePage().props;
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

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
      <div className="flex flex-col w-full h-screen bg-white dark:bg-gray-900 overflow-x-hidden rounded-none shadow-none p-0 m-0">
        {/* Contenu principal */}
        <main className="flex-1 flex flex-col w-full bg-white dark:bg-gray-900 overflow-x-hidden overflow-y-auto p-0 m-0" style={{ height: 'calc(100vh - 4rem)' }}>
          <div className="flex flex-col h-full w-full max-w-7xl mx-auto mt-14 pt-4 bg-white dark:bg-gray-900">
            {/* Header section */}
            <div className="flex items-center gap-3 mb-8">
              <FaProjectDiagram className="text-3xl text-blue-600" />
              <h1 className="text-3xl font-extrabold text-blue-700 dark:text-blue-200 tracking-tight">Détail du projet</h1>
            </div>

            {flash.success && (
              <div className="mb-6 px-4 py-3 rounded-lg bg-green-100 text-green-800 font-semibold">
                {flash.success}
              </div>
            )}

            {/* Informations du projet */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Carte principale du projet */}
              <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
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
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
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

            {/* Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link 
                  href={`/projects/${project.id}/edit`}
                  className="w-full sm:w-auto bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                >
                  <FaEdit /> Modifier le projet
                </Link>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full sm:w-auto bg-red-100 hover:bg-red-200 text-red-800 px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                >
                  <FaTrash /> Supprimer le projet
                </button>
                <Link 
                  href="/projects"
                  className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                >
                  <FaArrowLeft /> Retour à la liste
                </Link>
              </div>
            </div>
          </div>
        </main>
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