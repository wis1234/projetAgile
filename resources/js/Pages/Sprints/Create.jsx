import React, { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FaFlagCheckered, FaProjectDiagram, FaArrowLeft, FaSave, FaCalendarAlt, FaInfoCircle, FaSpinner } from 'react-icons/fa';
import { Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';

function Create({ projects, selectedProjectId }) {
  const { errors = {}, flash = {} } = usePage().props;
  
  // Utiliser le projet présélectionné si disponible, sinon prendre le premier de la liste
  const defaultProjectId = selectedProjectId || (projects.length > 0 ? projects[0].id : '');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    project_id: defaultProjectId
  });
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    router.post(route('sprints.store'), formData, {
      onSuccess: () => {
        setNotification({ type: 'success', message: 'Sprint créé avec succès!' });
        setTimeout(() => router.visit(route('sprints.index')), 1500);
      },
      onError: (err) => {
        setNotification({ type: 'error', message: 'Erreur lors de la création. Veuillez vérifier les champs.' });
        setLoading(false);
      },
      onFinish: () => setLoading(false)
    });
  };

  useEffect(() => {
    if (flash.success) setNotification({ type: 'success', message: flash.success });
    if (flash.error) setNotification({ type: 'error', message: flash.error });
  }, [flash]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={{ duration: 0.3 }}>
      <div className="min-h-screen bg-white dark:bg-gray-900">
        
        {/* En-tête avec bouton retour */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link 
                  href={route('sprints.index')} 
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                  title="Retour à la liste des sprints"
                >
                  <FaArrowLeft className="h-5 w-5" />
                </Link>
                <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
                  <FaFlagCheckered className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Créer un Sprint</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Remplissez les détails pour le nouveau sprint.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg text-white ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
            >
              {notification.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Content */}
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Main Column */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Détails du Sprint</h3>
                  
                  {/* Sprint Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nom du Sprint</label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      required
                    />
                    {errors.name && <p className="mt-2 text-sm text-red-500">{errors.name}</p>}
                  </div>

                  {/* Description */}
                  <div className="mt-4">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                    <textarea
                      name="description"
                      id="description"
                      rows="4"
                      value={formData.description}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    ></textarea>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Décrivez brièvement les objectifs de ce sprint.</p>
                  </div>
                </div>
              </div>

              {/* Side Column */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Configuration</h3>
                  
                  {/* Project */}
                  <div>
                    <label htmlFor="project_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Projet</label>
                    <div className="mt-1 relative">
                      <FaProjectDiagram className="pointer-events-none absolute top-1/2 -translate-y-1/2 left-3 h-5 w-5 text-gray-400" />
                      <select
                        name="project_id"
                        id="project_id"
                        value={formData.project_id}
                        onChange={handleChange}
                        className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        required
                      >
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    {errors.project_id && <p className="mt-2 text-sm text-red-500">{errors.project_id}</p>}
                  </div>

                  {/* Start Date */}
                  <div className="mt-4">
                    <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date de début</label>
                    <div className="mt-1 relative">
                       <FaCalendarAlt className="pointer-events-none absolute top-1/2 -translate-y-1/2 left-3 h-5 w-5 text-gray-400" />
                       <input
                        type="date"
                        name="start_date"
                        id="start_date"
                        value={formData.start_date}
                        onChange={handleChange}
                        className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        required
                      />
                    </div>
                    {errors.start_date && <p className="mt-2 text-sm text-red-500">{errors.start_date}</p>}
                  </div>

                  {/* End Date */}
                  <div className="mt-4">
                    <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date de fin</label>
                    <div className="mt-1 relative">
                      <FaCalendarAlt className="pointer-events-none absolute top-1/2 -translate-y-1/2 left-3 h-5 w-5 text-gray-400" />
                      <input
                        type="date"
                        name="end_date"
                        id="end_date"
                        value={formData.end_date}
                        onChange={handleChange}
                        min={formData.start_date}
                        className="pl-10 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        required
                      />
                    </div>
                    {errors.end_date && <p className="mt-2 text-sm text-red-500">{errors.end_date}</p>}
                  </div>
                </div>
              </div>
            </div>
          </form>
          {/* Boutons d'action en bas du formulaire */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row justify-end gap-3 max-w-4xl mx-auto w-full">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Link 
                  href={route('sprints.index')} 
                  className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FaArrowLeft className="mr-2 h-4 w-4" />
                  Annuler
                </Link>
                <button 
                  type="submit"
                  disabled={loading} 
                  className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Création...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2" />
                      Créer le sprint
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </motion.div>
  );
}

Create.layout = page => <AdminLayout children={page} title="Créer un Sprint" />;

export default Create;