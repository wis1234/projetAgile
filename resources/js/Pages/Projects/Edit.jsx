import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { Link } from '@inertiajs/react';
import { FaEdit, FaProjectDiagram, FaArrowLeft, FaSave, FaChartLine, FaInfoCircle, FaHistory } from 'react-icons/fa';

function Edit({ project, availableStatuses = {}, nextStatuses = [], currentStatus, userRole }) {
  const { errors = {}, flash = {} } = usePage().props;
  const [name, setName] = useState(project.name || '');
  const [description, setDescription] = useState(project.description || '');
  const [status, setStatus] = useState(project.status || 'nouveau');
  const [notification, setNotification] = useState(flash.success || flash.error || '');
  const [notificationType, setNotificationType] = useState(flash.success ? 'success' : 'error');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    router.put(`/projects/${project.id}`, { name, description, status }, {
      onSuccess: () => {
        setNotification('Projet mis à jour avec succès');
        setNotificationType('success');
        setLoading(false);
        setTimeout(() => router.visit('/projects'), 1200);
      },
      onError: () => {
        setNotification('Erreur lors de la mise à jour');
        setNotificationType('error');
        setLoading(false);
      }
    });
  };

  // Format status options for the select
  const statusOptions = [
    { value: currentStatus, label: `${availableStatuses[currentStatus] || currentStatus} (actuel)` },
    ...(Array.isArray(nextStatuses) ? nextStatuses.map(status => ({
      value: status,
      label: availableStatuses[status] || status
    })) : [])
  ];

  // Get status color for badge
  const getStatusColor = (status) => {
    const colors = {
      'nouveau': 'bg-gray-100 text-gray-800 border-gray-300',
      'demarrage': 'bg-green-100 text-green-800 border-green-300',
      'en_cours': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'avance': 'bg-blue-100 text-blue-800 border-blue-300',
      'termine': 'bg-emerald-100 text-emerald-800 border-emerald-300',
      'suspendu': 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[status] || colors['nouveau'];
  };

  return (
    <>
      <div className="flex flex-col w-full h-screen bg-white dark:bg-gray-900 overflow-x-hidden rounded-none shadow-none p-0 m-0">
        {/* Contenu principal */}
        <main className="flex-1 flex flex-col w-full bg-white dark:bg-gray-900 overflow-x-hidden overflow-y-auto p-0 m-0" style={{ height: 'calc(100vh - 4rem)' }}>
          <div className="flex flex-col h-full w-full max-w-5xl mx-auto mt-14 pt-4 bg-white dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
            {/* Header section - Responsive */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <Link href="/projects" className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-100 transition flex-shrink-0">
                <FaArrowLeft className="text-lg sm:text-xl" />
              </Link>
              <div className="flex items-center gap-3">
                <FaProjectDiagram className="text-2xl sm:text-3xl text-blue-600 flex-shrink-0" />
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-700 dark:text-blue-200 tracking-tight">Modifier le projet</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{project.name}</p>
                </div>
              </div>
            </div>

            {/* Statut actuel - Badge informatif */}
            <div className="mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <FaHistory className="text-blue-500 text-lg flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Statut actuel du projet :</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(currentStatus)}`}>
                        <FaChartLine className="text-xs" />
                        {availableStatuses[currentStatus] || currentStatus}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Créé le {new Date(project.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulaire - Responsive */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 sm:p-8 max-w-3xl mx-auto w-full border border-gray-200 dark:border-gray-700">
              {notification && (
                <div className={`mb-6 px-4 py-3 rounded-lg text-white font-semibold text-sm sm:text-base ${notificationType === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                  {notification}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nom du projet */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Nom du projet *
                  </label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition" 
                    placeholder="Entrez le nom du projet"
                    required 
                  />
                  {errors.name && (
                    <div className="text-red-600 text-sm mt-2 font-medium">{errors.name}</div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition resize-none" 
                    placeholder="Décrivez brièvement le projet (optionnel)"
                  />
                  {errors.description && (
                    <div className="text-red-600 text-sm mt-2 font-medium">{errors.description}</div>
                  )}
                </div>

                {/* Statut du projet */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <div className="flex items-center gap-2">
                      <FaChartLine className="text-blue-500" />
                      Statut du projet
                    </div>
                  </label>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(currentStatus)}`}>
                      {availableStatuses[currentStatus] || currentStatus}
                    </span>
                    {statusOptions.length > 1 && (
                      <span className="text-sm text-gray-500">→</span>
                    )}
                  </div>
                  
                  {statusOptions.length > 1 && (
                    <select 
                      value={status} 
                      onChange={(e) => setStatus(e.target.value)} 
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition"
                    >
                      {statusOptions.slice(1).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                  
                  {statusOptions.length <= 1 && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Aucun changement de statut disponible pour l'instant.
                    </p>
                  )}
                  
                  {status !== (project.status || 'nouveau') && (
                    <div className="mt-2">
                      <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                        ⚠️ Changement de statut
                      </span>
                    </div>
                  )}
                  {errors.status && (
                    <div className="text-red-600 text-sm mt-2 font-medium">{errors.status}</div>
                  )}
                </div>

                {/* Aide contextuelle pour les transitions */}
                {statusOptions.length > 1 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-4">
                    <div className="flex items-start gap-3">
                      <FaInfoCircle className="text-yellow-500 text-lg flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-yellow-700 dark:text-yellow-300">
                        <p className="font-semibold mb-2">Transitions de statut autorisées :</p>
                        <ul className="space-y-1 list-disc list-inside">
                          {statusOptions.slice(1).map(option => (
                            <li key={option.value}>
                              Passer à : <strong>{option.label}</strong>
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2 text-xs">
                          Les transitions de statut suivent la logique métier du projet pour assurer une progression cohérente.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Boutons d'action - Responsive */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                  <button 
                    type="submit" 
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Mise à jour...
                      </>
                    ) : (
                      <>
                        <FaSave /> Sauvegarder les modifications
                      </>
                    )}
                  </button>
                  <Link 
                    href="/projects" 
                    className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <FaArrowLeft /> Annuler
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

Edit.layout = page => <AdminLayout children={page} />;
export default Edit;