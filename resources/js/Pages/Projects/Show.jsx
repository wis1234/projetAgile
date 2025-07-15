import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { FaProjectDiagram, FaUsers, FaTasks, FaEdit, FaEye } from 'react-icons/fa';

function Show({ project, tasks = [] }) {
  const { flash = {} } = usePage().props;
  return (
    <div className="flex flex-col h-full w-full p-6">
      <div className="max-w-4xl w-full mx-auto bg-white dark:bg-gray-800 rounded shadow p-8">
        {flash.success && <div className="mb-6 px-4 py-3 rounded bg-green-100 text-green-800 font-semibold shadow">{flash.success}</div>}
        <h1 className="text-3xl font-extrabold mb-8 text-blue-700 dark:text-blue-200 flex items-center gap-3"><FaProjectDiagram /> Détail du projet</h1>
        <div className="mb-8">
          <div className="mb-3"><span className="font-semibold">Nom :</span> {project.name}</div>
          <div className="mb-3"><span className="font-semibold">Membres :</span> {project.users && project.users.length > 0 ? (
            <div className="flex flex-wrap gap-3 mt-2">
              {project.users.map(user => (
                <span key={user.id} className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-2 py-1 rounded text-xs font-medium">
                  <img src={user.profile_photo_url || (user.profile_photo_path ? `/storage/${user.profile_photo_path}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`)} alt={user.name} className="w-6 h-6 rounded-full border-2 border-blue-200" />
                  {user.name}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-gray-400">Aucun membre</span>
          )}
          </div>
        </div>
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-3 text-blue-600 dark:text-blue-300 flex items-center gap-2"><FaTasks /> Tâches rattachées</h2>
          {tasks.length === 0 ? (
            <div className="text-gray-400">Aucune tâche pour ce projet.</div>
          ) : (
            <ul className="space-y-3">
              {tasks.map(task => (
                <li key={task.id} className="border rounded p-4 bg-gray-50 dark:bg-gray-900 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex-1">
                    <Link href={`/tasks/${task.id}`} className="font-semibold text-blue-700 dark:text-blue-200 hover:underline flex items-center gap-2"><FaEye /> {task.title}</Link>
                    {task.status && <span className="ml-3 px-3 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 text-sm capitalize">{task.status}</span>}
                    {task.priority && <span className="ml-3 px-3 py-1 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200 text-sm capitalize">{task.priority}</span>}
                    <div className="text-sm text-gray-500 mt-2">
                      Assignée à : {task.assigned_user?.name || task.assignedUser?.name || <span className="italic text-gray-400">Non assignée</span>}
                      {task.sprint && (
                        <span> | Sprint : <Link href={`/sprints/${task.sprint.id}`} className="underline text-green-700 dark:text-green-300">{task.sprint.name}</Link></span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3 mt-3 md:mt-0">
                    <Link href={`/tasks/${task.id}`} className="bg-gray-100 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded transition text-sm font-semibold flex items-center gap-1"><FaEye /> Voir</Link>
                    <Link href={`/tasks/${task.id}/edit`} className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-4 py-2 rounded transition text-sm font-semibold flex items-center gap-1"><FaEdit /> Éditer</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex gap-3 mt-6">
          <Link href={route('projects.edit', project.id)} className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-5 py-3 rounded font-semibold flex items-center gap-2"><FaEdit /> Éditer</Link>
          <Link href="/projects" className="bg-gray-100 hover:bg-blue-100 text-blue-700 px-5 py-3 rounded font-semibold flex items-center gap-2"><FaProjectDiagram /> Retour à la liste</Link>
        </div>
      </div>
    </div>
  );
}

Show.layout = page => <AdminLayout children={page} />;
export default Show; 