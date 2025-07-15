import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { FaUser, FaUsers, FaEdit, FaProjectDiagram } from 'react-icons/fa';

function Show({ user }) {
  const { flash = {} } = usePage().props;
  return (
    <div className="flex flex-col h-full w-full p-6">
      <div className="max-w-4xl w-full mx-auto bg-white dark:bg-gray-800 rounded shadow p-8">
        {flash.success && <div className="mb-6 px-4 py-3 rounded bg-green-100 text-green-800 font-semibold shadow">{flash.success}</div>}
        <div className="flex items-center gap-6 mb-8">
          <img src={user.profile_photo_url || (user.profile_photo_path ? `/storage/${user.profile_photo_path}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`)} alt={user.name} className="w-20 h-20 rounded-full border-4 border-blue-200 shadow" />
          <div>
            <h1 className="text-3xl font-extrabold text-blue-700 dark:text-blue-200 flex items-center gap-2"><FaUser /> {user.name}</h1>
            <div className="text-gray-500 dark:text-gray-400 text-lg">{user.email}</div>
          </div>
        </div>
        <div className="mb-8">
          <div className="mb-3"><span className="font-semibold">Projets :</span> {user.projects && user.projects.length > 0 ? (
            <div className="flex flex-wrap gap-3 mt-2">
              {user.projects.map(project => (
                <Link href={`/projects/${project.id}`} key={project.id} className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-2 py-1 rounded text-xs font-medium hover:underline"><FaProjectDiagram /> {project.name}</Link>
              ))}
            </div>
          ) : (
            <span className="text-gray-400">Aucun projet</span>
          )}
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Link href={route('users.edit', user.id)} className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-5 py-3 rounded font-semibold flex items-center gap-2"><FaEdit /> Éditer</Link>
          <Link href="/users" className="bg-gray-100 hover:bg-blue-100 text-blue-700 px-5 py-3 rounded font-semibold flex items-center gap-2"><FaUsers /> Retour à la liste</Link>
        </div>
      </div>
    </div>
  );
}

Show.layout = page => <AdminLayout children={page} />;
export default Show;
