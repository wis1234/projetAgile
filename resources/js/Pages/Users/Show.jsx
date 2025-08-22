import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { 
  FaUser, 
  FaUsers, 
  FaEdit, 
  FaProjectDiagram, 
  FaEnvelope, 
  FaCalendarAlt,
  FaUserTie,
  FaUserShield,
  FaArrowLeft
} from 'react-icons/fa';
import { motion } from 'framer-motion';

function Show({ user, auth }) {
  const { flash = {} } = usePage().props;
  
  // Sanitize user data
  const sanitizedUser = React.useMemo(() => ({
    ...user,
    email: user?.email || '',
    name: user?.name || 'Utilisateur sans nom',
    role: ['admin', 'manager', 'user'].includes(user?.role) ? user.role : 'user',
    created_at: user?.created_at || new Date().toISOString()
  }), [user]);

  const userAuth = auth?.user || auth;
  const isAdmin = userAuth?.role === 'admin';
  const canEdit = userAuth && (isAdmin || userAuth.id === sanitizedUser.id);
  const canAssignRole = userAuth?.email === 'ronaldoagbohou@gmail.com';
  const [role, setRole] = React.useState(sanitizedUser.role);
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState('');
  const [error, setError] = React.useState('');

  const handleRoleChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      const res = await fetch(`/users/${sanitizedUser.id}/assign-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        },
        body: JSON.stringify({ role })
      });
      if (res.ok) {
        setSuccess('Rôle mis à jour avec succès !');
      } else {
        const data = await res.json();
        setError(data.message || 'Erreur lors de la mise à jour du rôle');
      }
    } catch (e) {
      setError('Une erreur est survenue lors de la mise à jour');
    }
    setLoading(false);
  };

  const getRoleBadge = (role) => {
    const roles = {
      admin: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: <FaUserShield className="mr-1" />, label: 'Administrateur' },
      manager: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', icon: <FaUserTie className="mr-1" />, label: 'Manager' },
      member: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: <FaUser className="mr-1" />, label: 'Membre' },
      user: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200', icon: <FaUser className="mr-1" />, label: 'Utilisateur' }
    };
    const currentRole = roles[role] || roles.user;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${currentRole.color}`}>
        {currentRole.icon}
        {currentRole.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <Link 
              href="/users" 
              className="mr-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Retour à la liste"
            >
              <FaArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Détails de l'utilisateur
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Flash Messages */}
        {flash.success && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg"
          >
            <p className="text-green-800 dark:text-green-200">{flash.success}</p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <img 
                      className="h-20 w-20 rounded-full border-4 border-white dark:border-gray-700 shadow-sm"
                      src={user.profile_photo_url || (user.profile_photo_path ? `/storage/${user.profile_photo_path}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3B82F6&color=fff&size=128`)} 
                      alt={user.name}
                    />
                  </div>
                  <div className="ml-5">
                    <div className="flex items-center space-x-2">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
                      {getRoleBadge(user.role || 'user')}
                    </div>
                    {isAdmin && (
                      <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <FaEnvelope className="mr-1.5 h-4 w-4 flex-shrink-0" />
                        <span>{user.email}</span>
                      </div>
                    )}
                    <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <FaCalendarAlt className="mr-1.5 h-4 w-4 flex-shrink-0" />
                      <span>Inscrit le {new Date(user.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Projects Section */}
              <div className="px-6 py-5">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <FaProjectDiagram className="mr-2 text-blue-500" />
                  Projets ({user.projects?.length || 0})
                </h3>
                
                {user.projects && user.projects.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {user.projects.map(project => (
                      <Link 
                        key={project.id} 
                        href={`/projects/${project.id}`}
                        className="group block p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-md bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <FaProjectDiagram className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {project.name}
                            </p>
                            {project.pivot?.role && (
                              <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${project.pivot.role === 'manager' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                                {project.pivot.role === 'manager' ? 'Chef de projet' : 'Membre'}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FaProjectDiagram className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
                    <h4 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucun projet</h4>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Cet utilisateur ne fait partie d'aucun projet pour le moment.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Role Assignment */}
            {canAssignRole && (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Gestion des rôles</h3>
                </div>
                <div className="px-6 py-5">
                  <form onSubmit={handleRoleChange}>
                    <div className="space-y-4">
                      <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Rôle global
                            </label>
                            <select
                              id="role"
                              value={role}
                              onChange={(e) => setRole(e.target.value)}
                              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                            >
                              <option value="admin">Administrateur</option>
                              <option value="manager">Manager</option>
                              <option value="member">Membre</option>
                              <option value="user">Utilisateur</option>
                            </select>
                          </div>
                      
                      <div>
                        <button
                          type="submit"
                          disabled={loading}
                          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                          {loading ? 'Mise à jour...' : 'Mettre à jour le rôle'}
                        </button>
                      </div>
                      
                      {success && (
                        <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                          {success}
                        </div>
                      )}
                      
                      {error && (
                        <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                          {error}
                        </div>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Actions rapides</h3>
              </div>
              <div className="px-6 py-4 space-y-3">
                {canEdit && (
                  <Link 
                    href={`/profile`}
                    className="group flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                  >
                    <FaEdit className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300 transition-colors" />
                    Modifier le profil
                  </Link>
                )}
                <Link 
                  href="/users"
                  className="group flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  <FaUsers className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300 transition-colors" />
                  Retour à la liste des utilisateurs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

Show.layout = page => <AdminLayout children={page} />;
export default Show;
