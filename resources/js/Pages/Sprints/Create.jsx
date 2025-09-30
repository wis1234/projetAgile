import React, { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
  FaFlagCheckered, 
  FaProjectDiagram, 
  FaArrowLeft, 
  FaSave, 
  FaCalendarAlt, 
  FaInfoCircle, 
  FaSpinner,
  FaExclamationTriangle
} from 'react-icons/fa';
import { Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import TextArea from '@/Components/Textarea';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

function Create({ projects, selectedProjectId }) {
  const { t } = useTranslation();
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
  const [touched, setTouched] = useState({
    name: false,
    project_id: false,
    start_date: false,
    end_date: false
  });

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: 'spring',
        stiffness: 100,
        damping: 20
      } 
    },
    out: { 
      opacity: 0, 
      y: -20,
      transition: { duration: 0.2 }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Marquer le champ comme touché pour afficher les erreurs
    if (!touched[name]) {
      setTouched(prev => ({ ...prev, [name]: true }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    if (!touched[name]) {
      setTouched(prev => ({ ...prev, [name]: true }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Marquer tous les champs comme touchés pour afficher les erreurs
    setTouched({
      name: true,
      project_id: true,
      start_date: true,
      end_date: true
    });
    
    // Vérifier les erreurs avant soumission
    if (Object.keys(errors).length > 0) {
      setNotification({
        type: 'error',
        message: t('validation.check_errors')
      });
      return;
    }
    
    setLoading(true);
    
    router.post(route('sprints.store'), formData, {
      onSuccess: () => {
        setNotification({ 
          type: 'success', 
          message: t('sprint_created_success')
        });
        setTimeout(() => router.visit(route('sprints.index')), 1500);
      },
      onError: (errors) => {
        setNotification({ 
          type: 'error', 
          message: t('sprint_creation_error')
        });
        setLoading(false);
      },
      onFinish: () => setLoading(false)
    });
  };
  
  // Fonction pour obtenir la classe d'erreur d'un champ
  const getInputClass = (fieldName) => {
    return `block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
      errors[fieldName] 
        ? 'border-red-500 dark:border-red-600' 
        : 'border-gray-300 dark:border-gray-600'
    }`;
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
    <motion.div 
      initial="initial" 
      animate="in" 
      exit="out" 
      variants={pageVariants}
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
    >
      {/* En-tête avec bouton retour */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href={route('sprints.index')}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-800/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <FaArrowLeft className="mr-2 h-4 w-4" />
                {t('back')}
              </Link>
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-blue-600 text-white mr-3">
                  <FaFlagCheckered className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t('create_sprint')}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('sprint_create_description')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className={`fixed top-6 right-6 z-50 max-w-sm w-full shadow-lg rounded-lg overflow-hidden ${
              notification.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
            }`}
          >
            <div className="p-4">
              <div className="flex items-start">
                <div className={`flex-shrink-0 pt-0.5 ${
                  notification.type === 'success' 
                    ? 'text-green-500 dark:text-green-400' 
                    : 'text-red-500 dark:text-red-400'
                }`}>
                  {notification.type === 'success' ? (
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <FaExclamationTriangle className="h-5 w-5" />
                  )}
                </div>
                <div className="ml-3 w-0 flex-1 pt-0.5">
                  <p className={`text-sm font-medium ${
                    notification.type === 'success' 
                      ? 'text-green-800 dark:text-green-200' 
                      : 'text-red-800 dark:text-red-200'
                  }`}>
                    {notification.message}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                  <button
                    onClick={() => setNotification(null)}
                    className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <span className="sr-only">Fermer</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenu principal */}
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Colonne principale */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      {t('sprint_details')}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {t('sprint_details_description')}
                    </p>
                  </div>
                  
                  <div className="px-6 py-6 space-y-6">
                    {/* Nom du sprint */}
                    <div>
                      <InputLabel htmlFor="name" value={t('sprint_name')} />
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <TextInput
                          id="name"
                          name="name"
                          type="text"
                          value={formData.name}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className={getInputClass('name')}
                          placeholder={t('sprint_name_placeholder')}
                          required
                        />
                      </div>
                      {errors.name && touched.name && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                          {errors.name}
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <InputLabel htmlFor="description" value={t('description')} />
                      <div className="mt-1">
                        <TextArea
                          id="description"
                          name="description"
                          rows={4}
                          value={formData.description}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className={getInputClass('description')}
                          placeholder={t('sprint_description_placeholder')}
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {t('sprint_description_helper')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Colonne latérale */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      {t('configuration')}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {t('sprint_configuration_description')}
                    </p>
                  </div>
                  
                  <div className="px-6 py-6 space-y-6">
                    {/* Projet */}
                    <div>
                      <InputLabel htmlFor="project_id" value={t('project')} />
                      <div className="mt-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaProjectDiagram className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                          id="project_id"
                          name="project_id"
                          value={formData.project_id}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className={`${getInputClass('project_id')} pl-10`}
                          required
                        >
                          <option value="">{t('select_project')}</option>
                          {projects.map(project => (
                            <option key={project.id} value={project.id}>
                              {project.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {errors.project_id && touched.project_id && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                          {errors.project_id}
                        </p>
                      )}
                    </div>

                    {/* Date de début */}
                    <div>
                      <InputLabel htmlFor="start_date" value={t('start_date')} />
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaCalendarAlt className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="date"
                          id="start_date"
                          name="start_date"
                          value={formData.start_date}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className={`${getInputClass('start_date')} pl-10`}
                          required
                        />
                      </div>
                      {errors.start_date && touched.start_date && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                          {errors.start_date}
                        </p>
                      )}
                    </div>

                    {/* Date de fin */}
                    <div>
                      <InputLabel htmlFor="end_date" value={t('end_date')} />
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaCalendarAlt className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="date"
                          id="end_date"
                          name="end_date"
                          value={formData.end_date}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          min={formData.start_date}
                          className={`${getInputClass('end_date')} pl-10`}
                          required
                        />
                      </div>
                      {errors.end_date && touched.end_date && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                          {errors.end_date}
                        </p>
                      )}
                      
                      {formData.start_date && formData.end_date && (
                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm rounded-md">
                          <div className="flex items-start">
                            <FaInfoCircle className="flex-shrink-0 h-4 w-4 mt-0.5 mr-2" />
                            <span>
                              {t('sprint_duration', { 
                                days: Math.ceil((new Date(formData.end_date) - new Date(formData.start_date)) / (1000 * 60 * 60 * 24) + 1)
                              })}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Aide et conseils */}
                <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FaInfoCircle className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        {t('tips')}
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
                        <p>{t('sprint_tip_1')}</p>
                        <p>{t('sprint_tip_2')}</p>
                        <p>{t('sprint_tip_3')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Boutons d'action */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Link 
                    href={route('sprints.index')}
                    as="button"
                    className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  >
                    <FaArrowLeft className="mr-2 h-4 w-4" />
                    {t('cancel')}
                  </Link>
                  <PrimaryButton 
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto justify-center"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        {t('creating')}...
                      </>
                    ) : (
                      <>
                        <FaSave className="mr-2" />
                        {t('create_sprint')}
                      </>
                    )}
                  </PrimaryButton>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
    </motion.div>
  );
}

Create.layout = page => <AdminLayout children={page} title="Créer un Sprint" />;

export default Create;