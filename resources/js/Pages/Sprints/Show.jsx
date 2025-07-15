import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { FaFlagCheckered, FaEdit, FaProjectDiagram } from 'react-icons/fa';
import ActionButton from '../../Components/ActionButton';

function Show({ sprint }) {
  const { flash = {} } = usePage().props;
  return (
    <div className="flex flex-col h-full w-full p-6">
      <div className="max-w-xl w-full mx-auto bg-white dark:bg-gray-800 rounded shadow p-8">
        {flash.success && <div className="mb-4 px-4 py-3 rounded bg-green-100 text-green-800 font-semibold shadow">{flash.success}</div>}
        <h1 className="text-3xl font-extrabold mb-6 flex items-center gap-3 text-blue-700 dark:text-blue-200"><FaFlagCheckered className="text-green-600" /> Détail du sprint</h1>
        <div className="mb-6">
          <div className="mb-2"><span className="font-semibold">Nom :</span> <span className="text-black dark:text-blue-100">{sprint.name}</span></div>
          <div className="mb-2 flex items-center gap-2"><span className="font-semibold">Projet :</span> <FaProjectDiagram className="text-blue-400" /> <span className="text-black dark:text-blue-100">{sprint.project?.name || '-'}</span></div>
          <div className="mb-2"><span className="font-semibold">Description :</span> <span className="text-gray-700 dark:text-gray-300">{sprint.description || '-'}</span></div>
          <div className="mb-2"><span className="font-semibold">Début :</span> <span className="text-black dark:text-blue-100">{sprint.start_date}</span></div>
          <div className="mb-2"><span className="font-semibold">Fin :</span> <span className="text-black dark:text-blue-100">{sprint.end_date}</span></div>
          <div className="mb-2"><span className="font-semibold">Tâches :</span> {sprint.tasks && sprint.tasks.length > 0 ? (
            <ul className="list-disc ml-6 mt-1">
              {sprint.tasks.map(task => (
                <li key={task.id} className="text-black dark:text-blue-100">{task.title}</li>
              ))}
            </ul>
          ) : (
            <span className="text-gray-400">Aucune tâche</span>
          )}
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Link href={route('sprints.edit', sprint.id)} className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-5 py-2 rounded font-semibold flex items-center gap-2"><FaEdit /> Éditer</Link>
          <Link href="/sprints" className="bg-gray-100 hover:bg-blue-100 text-blue-700 px-5 py-2 rounded font-semibold flex items-center gap-2">Retour à la liste</Link>
        </div>
      </div>
    </div>
  );
}

Show.layout = page => <AdminLayout children={page} />;
export default Show; 