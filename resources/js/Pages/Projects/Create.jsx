import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { Link } from '@inertiajs/react';
import { FaPlus, FaProjectDiagram, FaArrowLeft, FaChartLine, FaInfoCircle } from 'react-icons/fa';

function Create() {
  const { errors = {}, flash = {}, availableStatuses = {} } = usePage().props;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('nouveau'); // Statut par défaut
  const [notification, setNotification] = useState(flash.success || flash.error || '');
  const [notificationType, setNotificationType] = useState(flash.success ? 'success' : 'error');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    router.post('/projects', { name, description, status }, {
      onSuccess: () => {
        setNotification('Projet créé avec succès');
        setNotificationType('success');
        setName('');
        setDescription('');
        setStatus('nouveau');
        setLoading(false);
        setTimeout(() => router.visit('/projects'), 1200);
      },
      onError: () => {
        setNotification('Erreur lors de la création');
        setNotificationType('error');
        setLoading(false);
      }
    });
  };

  // Fonction pour obtenir la couleur du badge de statut
  const getStatusColor = (statusKey) => {
    const colors = {
      'nouveau': 'bg-gray-100 text-gray-800 border-gray-300',
      'demarrage': 'bg-green-100 text-green-800 border-green-300',
      'en_cours': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'avance': 'bg-blue-100 text-blue-800 border-blue-300',
      'termine': 'bg-emerald-100 text-emerald-800 border-emerald-300',
      'suspendu': 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[statusKey] || colors['nouveau'];
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="pt-16">
            {/* Header section - Responsive */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <Link href="/projects" className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-100 transition flex-shrink-0">
                <FaArrowLeft className="text-lg sm:text-xl" />
              </Link>
              <div className="flex items-center gap-3">
                <FaProjectDiagram className="text-2xl sm:text-3xl text-blue-600 flex-shrink-0" />
                <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-700 dark:text-blue-200 tracking-tight">Créer un projet</h1>
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
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    <div className="flex items-center gap-2">
                      <FaChartLine className="text-blue-500" />
                      Statut initial du projet
                    </div>
                  </label>
                  <div className="space-y-3">
                    <select 
                      value={status} 
                      onChange={e => setStatus(e.target.value)} 
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition"
                    >
                      {Object.entries(availableStatuses).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                    
                    {/* Aperçu du statut sélectionné */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Aperçu :</span>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(status)}`}>
                        <FaChartLine className="text-xs" />
                        {availableStatuses[status] || 'Nouveau'}
                      </span>
                    </div>
                  </div>
                  {errors.status && (
                    <div className="text-red-600 text-sm mt-2 font-medium">{errors.status}</div>
                  )}
                </div>

                {/* Aide contextuelle */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <FaInfoCircle className="text-blue-500 text-lg flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      <p className="font-semibold mb-2">Conseils pour la création de projet :</p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>Choisissez un nom descriptif et unique pour votre projet</li>
                        <li>La description aide les membres à comprendre l'objectif</li>
                        <li>Le statut "Nouveau" est recommandé pour un projet en préparation</li>
                        <li>Vous pourrez modifier ces informations après la création</li>
                      </ul>
                    </div>
                  </div>
                </div>

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
                        Création...
                      </>
                    ) : (
                      <>
                        <FaPlus /> Créer le projet
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
      </div>
    </div>
  );
}

Create.layout = page => <AdminLayout children={page} />;
export default Create;