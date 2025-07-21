import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { FaUser, FaUsers, FaEdit, FaProjectDiagram } from 'react-icons/fa';

function Show({ user, auth }) {
  // Correction : on récupère bien l'utilisateur connecté
  const { flash = {}, auth: currentAuth } = usePage().props;
  const userAuth = auth?.user || auth;
  const isAdmin = userAuth && userAuth.role === 'admin';
  const canEdit = userAuth && (userAuth.role === 'admin' || userAuth.id === user.id);
  const canAssignRole = userAuth && userAuth.email === 'ronaldoagbohou@gmail.com';
  const [role, setRole] = React.useState(user.role || 'user');
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState('');
  const [error, setError] = React.useState('');

  const handleRoleChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      const res = await fetch(`/users/${user.id}/assign-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        },
        body: JSON.stringify({ role })
      });
      if (res.ok) {
        setSuccess('Rôle mis à jour !');
      } else {
        const data = await res.json();
        setError(data.message || 'Erreur lors de la mise à jour');
      }
    } catch (e) {
      setError('Erreur lors de la mise à jour');
    }
    setLoading(false);
  };
  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto mt-16 pt-4 bg-white dark:bg-gray-900">
      <div className="w-full flex flex-col md:flex-row gap-8 items-start p-6">
        {/* Colonne gauche : détails utilisateur */}
        <div className="flex-1 flex flex-col items-center md:items-start w-full">
          {flash.success && <div className="mb-6 px-4 py-3 rounded bg-green-100 text-green-800 font-semibold shadow w-full text-center">{flash.success}</div>}
          <img src={user.profile_photo_url || (user.profile_photo_path ? `/storage/${user.profile_photo_path}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`)} alt={user.name} className="w-24 h-24 rounded-full border-4 border-blue-200 shadow mb-4" />
          <h1 className="text-3xl font-extrabold text-blue-700 dark:text-blue-200 flex items-center gap-2 mb-1"><FaUser /> {user.name}</h1>
          {isAdmin && (
            <div className="text-gray-500 dark:text-gray-400 text-lg mb-4">{user.email}</div>
          )}
          <div className="mb-6 w-full flex flex-col items-center md:items-start">
            <span className="font-semibold">Projets :</span>
            {user.projects && user.projects.length > 0 ? (
              <div className="flex flex-wrap gap-3 mt-2 justify-center md:justify-start">
                {user.projects.map(project => (
                  <Link href={`/projects/${project.id}`} key={project.id} className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-2 py-1 rounded text-xs font-medium hover:underline"><FaProjectDiagram /> {project.name}</Link>
                ))}
              </div>
            ) : (
              <span className="text-gray-400 mt-2">Aucun projet</span>
            )}
          </div>
          <div className="flex gap-3 mt-2 justify-center md:justify-start">
            <Link href="/users" className="bg-gray-100 hover:bg-blue-100 text-blue-700 px-5 py-3 rounded font-semibold flex items-center gap-2"><FaUsers /> Retour à la liste</Link>
          </div>
        </div>
        {/* Colonne droite : assignation de rôle */}
        {canAssignRole && (
          <form onSubmit={handleRoleChange} className="mt-8 md:mt-0 p-4 bg-blue-50 dark:bg-blue-900 rounded shadow flex flex-col gap-2 max-w-xs w-full items-center self-center md:self-start">
            <label className="font-semibold">Assigner un rôle :</label>
            <select value={role} onChange={e => setRole(e.target.value)} className="border rounded p-2 w-full">
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="member">Membre</option>
              <option value="user">Utilisateur</option>
            </select>
            <button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded font-semibold mt-2 w-full" disabled={loading}>{loading ? 'Mise à jour...' : 'Assigner'}</button>
            {success && <div className="text-green-600 text-sm">{success}</div>}
            {error && <div className="text-red-600 text-sm">{error}</div>}
          </form>
        )}
      </div>
    </div>
  );
}

Show.layout = page => <AdminLayout children={page} />;
export default Show;
