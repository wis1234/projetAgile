import React, { useState, useEffect } from 'react';
import { FaUserShield, FaUserTie, FaUser, FaCheck, FaEnvelope, FaInfoCircle, FaSync } from 'react-icons/fa';
import { motion } from 'framer-motion';

const subscriptionPlans = {
  admin: {
    name: 'Administrateur',
    icon: <FaUserShield className="h-6 w-6 text-yellow-500" />,
    color: 'from-yellow-500 to-amber-500',
    features: [
      'Accès complet à la plateforme',
      'Gestion des utilisateurs',
      'Gestion des projets',
      'Statistiques avancées',
      'Support prioritaire'
    ],
    price: 'admin'
  },
  manager: {
    name: 'Manager',
    icon: <FaUserTie className="h-6 w-6 text-purple-500" />,
    color: 'from-purple-500 to-indigo-500',
    features: [
      'Gestion des projets',
      'Gestion des tâches',
      'Statistiques de projet',
      'Support standard',
      'Jusqu\'à 5 projets'
    ],
    price: 'Abonné(e)'
  },
  user: {
    name: 'Utilisateur',
    icon: <FaUser className="h-6 w-6 text-blue-500" />,
    color: 'from-blue-500 to-cyan-500',
    features: [
      'Accès aux projets assignés',
      'Gestion des tâches personnelles',
      'Notifications',
      'Support de base',
      'Jusqu\'à 2 projets'
    ],
    price: 'Gratuit'
  }
};

export default function RoleManagement({ user, currentUser, onRoleChange }) {
  const [selectedRole, setSelectedRole] = useState(user.role || '');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showEmailNotification, setShowEmailNotification] = useState(true);

  const canAssignRole = currentUser?.email === 'ronaldoagbohou@gmail.com';
  const isCurrentUser = currentUser?.id === user.id;

  useEffect(() => {
    setSelectedRole(user.role || 'user');
  }, [user.role]);

  const handleRoleChange = async (e) => {
    e.preventDefault();
    if (!canAssignRole || isLoading) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      await onRoleChange(selectedRole, showEmailNotification);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors de la mise à jour du rôle');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Cas 1 : L'utilisateur n'a pas le droit d'assigner un rôle → on montre uniquement son abonnement ---
  if (!canAssignRole) {
    const plan = subscriptionPlans[currentUser?.role] || subscriptionPlans.user;
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {/* <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Votre Abonnement</h3>
          <div className={`bg-gradient-to-r ${plan.color} p-6 rounded-lg text-white`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {user.role}
                <h4 className="ml-3 text-xl font-bold">{plan.name}</h4>
              </div>
              <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium">
                {plan.price}
              </span>
            </div>
          </div>
          {isCurrentUser && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-sm text-blue-700 dark:text-blue-300">
              <FaInfoCircle className="inline mr-1" />
              Contactez l'administrateur pour modifier votre abonnement.
            </div>
          )}
        </div> */}
      </div>
    );
  }

  // --- Cas 2 : L'admin (ou toi) peut assigner un rôle → dropdown simple ---
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Gestion des Rôles</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Modifiez le rôle de {user.name}
        </p>
      </div>
      
      <form onSubmit={handleRoleChange} className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Sélectionnez un rôle
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            {Object.entries(subscriptionPlans).map(([key, plan]) => (
              <option key={key} value={key}>
                {plan.name} ({plan.price})
              </option>
            ))}
          </select>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-start">
            <FaEnvelope className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showEmailNotification}
                  onChange={(e) => setShowEmailNotification(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Envoyer une notification par email à {user.name}
                </span>
              </label>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-lg text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg text-green-700 dark:text-green-300 text-sm"
          >
            Le rôle a été mis à jour avec succès. {showEmailNotification && 'Un email de notification a été envoyé.'}
          </motion.div>
        )}

        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={() => setSelectedRole(user.role)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isLoading || selectedRole === user.role}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              (isLoading || selectedRole === user.role) ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <>
                <FaSync className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Enregistrement...
              </>
            ) : (
              'Mettre à jour le rôle'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
