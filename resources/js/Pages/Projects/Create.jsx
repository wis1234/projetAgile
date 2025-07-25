import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { Link } from '@inertiajs/react';
import { FaPlus, FaProjectDiagram, FaArrowLeft } from 'react-icons/fa';

function Create() {
  const { errors = {}, flash = {} } = usePage().props;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [notification, setNotification] = useState(flash.success || flash.error || '');
  const [notificationType, setNotificationType] = useState(flash.success ? 'success' : 'error');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    router.post('/projects', { name, description }, {
      onSuccess: () => {
        setNotification('Projet créé avec succès');
        setNotificationType('success');
        setName('');
        setDescription('');
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

  return (
    <>
      <div className="flex flex-col w-full h-screen bg-white dark:bg-gray-900 overflow-x-hidden rounded-none shadow-none p-0 m-0">
        {/* Contenu principal */}
        <main className="flex-1 flex flex-col w-full bg-white dark:bg-gray-900 overflow-x-hidden overflow-y-auto p-0 m-0" style={{ height: 'calc(100vh - 4rem)' }}>
          <div className="flex flex-col h-full w-full max-w-4xl mx-auto mt-14 pt-4 bg-white dark:bg-gray-900">
            {/* Header section */}
            <div className="flex items-center gap-3 mb-8">
              <Link href="/projects" className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-100 transition">
                <FaArrowLeft className="text-xl" />
              </Link>
              <FaProjectDiagram className="text-3xl text-blue-600" />
              <h1 className="text-3xl font-extrabold text-blue-700 dark:text-blue-200 tracking-tight">Créer un projet</h1>
            </div>

            {/* Formulaire */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-2xl mx-auto w-full">
              {notification && (
                <div className={`mb-6 px-4 py-3 rounded-lg text-white font-semibold ${notificationType === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                  {notification}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
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

                <div className="flex gap-4 pt-4">
                  <button 
                    type="submit" 
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" 
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
                    className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
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

Create.layout = page => <AdminLayout children={page} />;
export default Create; 