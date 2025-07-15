import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Link, usePage } from '@inertiajs/react';
import ActionButton from '../../Components/ActionButton';
import { FaTasks, FaUserCircle, FaProjectDiagram, FaFlagCheckered, FaUser, FaArrowLeft, FaFileUpload } from 'react-icons/fa';

export default function Show({ task }) {
  const { auth } = usePage().props;
  const isAssigned = auth?.user?.id === task.assigned_to;
  const isAdmin = auth?.user?.role === 'admin' || auth?.user?.is_admin;
  // Helpers
  const getStatusBadge = (status) => status ? <span className="capitalize px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-800">{status}</span> : <span className="italic text-gray-400">N/A</span>;
  const getPriorityBadge = (priority) => priority ? <span className="capitalize px-2 py-1 rounded text-xs font-bold bg-yellow-100 text-yellow-800">{priority}</span> : <span className="italic text-gray-400">Non définie</span>;
  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-8">
        <FaTasks className="text-3xl text-blue-700 dark:text-blue-200" />
        <h1 className="text-3xl font-extrabold text-blue-700 dark:text-blue-200 tracking-tight drop-shadow">Détail de la tâche</h1>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6 mb-6">
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
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><span className="font-semibold">Titre :</span> {task.title}</div>
            <div><span className="font-semibold">Projet :</span> <span className="inline-flex items-center gap-1"><FaProjectDiagram className="text-blue-500" /> {task.project?.name || <span className="italic text-gray-400">Aucun</span>}</span></div>
            <div><span className="font-semibold">Sprint :</span> <span className="inline-flex items-center gap-1"><FaFlagCheckered className="text-green-600" /> {task.sprint?.name || <span className="italic text-gray-400">Aucun</span>}</span></div>
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
    </div>
  );
}

Show.layout = page => <AdminLayout children={page} />; 