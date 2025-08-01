import React, { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FaFlagCheckered, FaProjectDiagram, FaArrowLeft, FaTrash, FaSave, FaCalendarAlt, FaInfoCircle, FaSpinner } from 'react-icons/fa';
import { Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';

function Edit({ sprint, projects }) {
  const { errors = {}, flash = {}, auth } = usePage().props;
  const [formData, setFormData] = useState({
    name: sprint.name || '',
    description: sprint.description || '',
    start_date: sprint.start_date ? new Date(sprint.start_date).toISOString().split('T')[0] : '',
    end_date: sprint.end_date ? new Date(sprint.end_date).toISOString().split('T')[0] : '',
    project_id: sprint.project_id || (projects.length > 0 ? projects[0].id : '')
  });
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
    router.put(route('sprints.update', sprint.id), formData, {
      onSuccess: () => {
        setNotification({ type: 'success', message: 'Sprint mis à jour avec succès!' });
        setTimeout(() => router.visit(route('sprints.show', sprint.id)), 1500);
      },
      onError: (err) => {
        setNotification({ type: 'error', message: 'Erreur lors de la mise à jour. Veuillez vérifier les champs.' });
        setLoading(false);
      },
      onFinish: () => setLoading(false)
    });
  };

  const handleDelete = () => {
    setLoading(true);
    router.delete(route('sprints.destroy', sprint.id), {
      onSuccess: () => {
        router.visit(route('sprints.index'));
      },
      onError: () => {
        setNotification({ type: 'error', message: 'Erreur lors de la suppression.' });
        setLoading(false);
        setShowDeleteModal(false);
      }
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

  const canDelete = auth.user?.role === 'admin' || sprint.project?.managers?.some(m => m.id === auth.user.id);

  return (
    <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={{ duration: 0.3 }}>
      <div className="min-h-screen bg-white dark:bg-gray-900">
        
        {/* Sticky Header */}
        <header className="sticky top-0 bg-white dark:bg-gray-800/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                  <FaFlagCheckered className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Modifier le Sprint</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                    {sprint.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link href={route('sprints.show', sprint.id)} className="hidden sm:inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <FaArrowLeft className="mr-2 h-4 w-4" />
                  Annuler
                </Link>
                <button onClick={handleSubmit} disabled={loading} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                  {loading ? <FaSpinner className="animate-spin mr-2" /> : <FaSave className="mr-2" />}
                  Enregistrer
                </button>
                {canDelete && (
                  <button onClick={() => setShowDeleteModal(true)} disabled={loading} className="inline-flex items-center p-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50">
                    <FaTrash />
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

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
        </main>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md"
              >
                <div className="flex items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50">
                    <FaTrash className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="ml-4 text-left">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Supprimer le Sprint</h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Êtes-vous sûr de vouloir supprimer ce sprint ? Toutes les tâches associées seront également supprimées. Cette action est irréversible.
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={() => setShowDeleteModal(false)} disabled={loading} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none">
                    Annuler
                  </button>
                  <button onClick={handleDelete} disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none disabled:opacity-50">
                    {loading ? <FaSpinner className="animate-spin" /> : 'Supprimer'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

Edit.layout = page => <AdminLayout children={page} title="Modifier le Sprint" />;

export default Edit;
