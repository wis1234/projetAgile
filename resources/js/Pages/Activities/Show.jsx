import React from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import { Link } from '@inertiajs/react';
import { FaHistory, FaUserCircle, FaRegListAlt, FaProjectDiagram, FaTasks, FaFileAlt, FaUser, FaArrowLeft } from 'react-icons/fa';

function renderSubjectDetails(subject, type) {
  if (!subject) return null;
  if (type === 'App\\Models\\File') {
    return (
      <div className="space-y-2">
        <div><span className="font-semibold">Nom du fichier :</span> {subject.name}</div>
        <div><span className="font-semibold">Type :</span> {subject.type}</div>
        <div><span className="font-semibold">Taille :</span> {subject.size} octets</div>
        <div><span className="font-semibold">Projet :</span> {subject.project?.name || subject.project_id || '-'}</div>
        <div><span className="font-semibold">Tâche :</span> {subject.task?.title || subject.task_id || '-'}</div>
        <div><span className="font-semibold">Utilisateur :</span> {subject.user?.name || subject.user_id || '-'}</div>
        <div><span className="font-semibold">Statut :</span> {subject.status}</div>
        <div><span className="font-semibold">Créé le :</span> {subject.created_at ? new Date(subject.created_at).toLocaleString() : '-'}</div>
      </div>
    );
  }
  if (type === 'App\\Models\\Task') {
    return (
      <div className="space-y-2">
        <div><span className="font-semibold">Titre :</span> {subject.title}</div>
        <div><span className="font-semibold">Projet :</span> {subject.project?.name || subject.project_id || '-'}</div>
        <div><span className="font-semibold">Assigné à :</span> {subject.assigned_user?.name || subject.assigned_to || '-'}</div>
        <div><span className="font-semibold">Statut :</span> {subject.status}</div>
        <div><span className="font-semibold">Priorité :</span> {subject.priority}</div>
        <div><span className="font-semibold">Créé le :</span> {subject.created_at ? new Date(subject.created_at).toLocaleString() : '-'}</div>
      </div>
    );
  }
  if (type === 'App\\Models\\Project') {
    return (
      <div className="space-y-2">
        <div><span className="font-semibold">Nom du projet :</span> {subject.name}</div>
        <div><span className="font-semibold">Description :</span> {subject.description || '-'}</div>
        <div><span className="font-semibold">Créé le :</span> {subject.created_at ? new Date(subject.created_at).toLocaleString() : '-'}</div>
      </div>
    );
  }
  if (type === 'App\\Models\\User') {
    return (
      <div className="space-y-2">
        <div><span className="font-semibold">Nom :</span> {subject.name}</div>
        <div><span className="font-semibold">Email :</span> {subject.email}</div>
        <div><span className="font-semibold">Rôle :</span> {subject.roles ? subject.roles.map(r => r.name).join(', ') : '-'}</div>
      </div>
    );
  }
  // Fallback: affiche tout sauf les id techniques
  return (
    <div className="space-y-2">
      {Object.entries(subject).filter(([k]) => !['id','user_id','project_id','task_id','kanban_id','subject_id'].includes(k)).map(([k, v]) => (
        <div key={k}><span className="font-semibold">{k.replace(/_/g, ' ')} :</span> {typeof v === 'string' && v.match(/^\d{4}-\d{2}-\d{2}/) ? new Date(v).toLocaleString() : String(v)}</div>
      ))}
    </div>
  );
}

export default function Show({ activity, subject }) {
  // Helper pour badge type
  const getTypeBadge = (type) => {
    const color = type === 'create' ? 'bg-green-100 text-green-800' : type === 'update' ? 'bg-yellow-100 text-yellow-800' : type === 'delete' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800';
    return <span className={`px-2 py-1 rounded text-xs font-bold capitalize ${color}`}>{type}</span>;
  };
  // Helper pour icône objet
  const getSubjectIcon = (type) => {
    if (!type) return <FaRegListAlt className="text-gray-400" />;
    if (type.includes('Project')) return <FaProjectDiagram className="text-blue-500" />;
    if (type.includes('Task')) return <FaTasks className="text-yellow-500" />;
    if (type.includes('File')) return <FaFileAlt className="text-green-500" />;
    if (type.includes('User')) return <FaUser className="text-purple-500" />;
    return <FaRegListAlt className="text-gray-400" />;
  };
  return (
    <div className="flex flex-col w-full min-h-screen bg-white dark:bg-gray-900">
      <div className="flex-1 flex flex-col w-full max-w-7xl mx-auto px-4 py-6">
        {/* Header section */}
        <div className="flex items-center gap-3 mb-6">
          <FaHistory className="text-3xl text-blue-600" />
          <h1 className="text-3xl font-extrabold text-blue-700 dark:text-blue-200 tracking-tight">Détail de l'activité</h1>
        </div>
        
        {/* Grille infos activité + objet lié */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Carte principale activité */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6 mb-6">
              <div className="flex items-center gap-3">
                {activity.user ? (
                  <img 
                    src={activity.user.profile_photo_url || 
                        (activity.user.profile_photo_path ? 
                          `/storage/${activity.user.profile_photo_path}` : 
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(activity.user.name)}`)} 
                    alt={activity.user.name} 
                    className="w-16 h-16 rounded-full shadow border-2 border-blue-200" 
                  />
                ) : (
                  <FaUserCircle className="w-16 h-16 text-gray-400" />
                )}
                <div>
                  <div className="font-bold text-lg text-blue-700 dark:text-blue-100">
                    {activity.user ? activity.user.name : <span className="italic text-gray-400">Invité</span>}
                  </div>
                  {activity.user?.roles && activity.user.roles.length > 0 && (
                    <span className="ml-1 px-2 py-1 rounded text-xs font-bold bg-yellow-100 text-yellow-800">
                      {activity.user.roles[0].name}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><span className="font-semibold">Date :</span> {new Date(activity.created_at).toLocaleString()}</div>
                <div><span className="font-semibold">Type :</span> {getTypeBadge(activity.type)}</div>
                <div className="md:col-span-2">
                  <span className="font-semibold">Description :</span> {activity.description || <span className="italic text-gray-400">Aucune</span>}
                </div>
                <div>
                  <span className="font-semibold">Objet concerné :</span>{' '}
                  <span className="inline-flex items-center gap-1">
                    {getSubjectIcon(activity.subject_type)} {activity.subject_type ? `${activity.subject_type.split('\\').pop()}` : '-'}
                  </span>
                </div>
                <div>
                  <span className="font-semibold">IP :</span>{' '}
                  <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                    {activity.ip_address}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <span className="font-semibold">User Agent :</span>{' '}
                  <span className="block text-xs text-gray-500 mt-1">
                    {activity.user_agent}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Carte objet lié */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 text-blue-600 dark:text-blue-300 flex items-center gap-2">
              {getSubjectIcon(activity.subject_type)} Détails de l'objet lié
            </h2>
            {subject ? (
              renderSubjectDetails(subject, activity.subject_type)
            ) : (
              <div className="text-gray-400">Aucun objet lié disponible</div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center">
          <Link 
            href={route('activities.index')} 
            className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition"
          >
            <FaArrowLeft /> Retour au journal
          </Link>
        </div>
      </div>
    </div>
  );
}

Show.layout = page => <AdminLayout children={page} />; 