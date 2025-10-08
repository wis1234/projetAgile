import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { motion } from 'framer-motion';
import FileHeader from '@/Components/FileDetails/FileHeader';
import FilePreview from '@/Components/FileDetails/FilePreview';
import FileMetadata from '@/Components/FileDetails/FileMetadata';
import CommentsSection from '@/Components/FileDetails/CommentsSection';
import RelatedInfo from '@/Components/FileDetails/RelatedInfo';
import SaveToDropboxButton from '@/Components/Files/SaveToDropboxButton';
import { 
  FaProjectDiagram, 
  FaTasks, 
  FaUser, 
  FaFileAlt, 
  FaClock, 
  FaEdit, 
  FaArrowLeft,
  FaTimes
} from 'react-icons/fa';
import { isFileEditable } from '@/utils/fileUtils';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

const Show = ({ file, auth, canManageFile }) => {
  const { user: currentUser } = auth;
  const [currentFile, setCurrentFile] = useState({
    ...file,
    task: file.task || null, // Ensure task is properly initialized
    project: file.project || null // Ensure project is properly initialized
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const isFileOwner = currentFile.user_id === currentUser?.id;
  const canEditContent = isFileEditable(currentFile.type, currentFile.name);
  
  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    router.delete(route('files.destroy', currentFile.id), {
      onSuccess: () => {
        router.visit(route('files.index'));
      },
    });
  };

  const handleDownload = (e) => {
    e.preventDefault();
    window.open(route('files.download', currentFile.id), '_blank');
  };

  const handlePreview = (e) => {
    e.preventDefault();
    window.open(route('files.preview', currentFile.id), '_blank');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    // Add toast notification here if needed
    alert('Lien copié dans le presse-papier');
  };

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <AdminLayout>
      <Head title={`Fichier - ${currentFile.name}`} />
      
      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-4">
                <Link 
                  href={route('files.index')} 
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                  title="Retour à la liste des fichiers"
                >
                  <FaArrowLeft className="h-4 w-4" />
                  <span className="text-sm font-medium">Retour</span>
                </Link>
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <FaFileAlt className="h-6 w-6 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate" title={currentFile.name}>
                        {currentFile.name}
                      </h1>
                      <div className="mt-1">
                        <span className="text-sm text-gray-600 font-medium">Tâche: </span>
                        {currentFile.task ? (
                          <Link 
                            href={`/tasks/${currentFile.task.id}`}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors duration-200"
                            title="Voir la tâche"
                          >
                            <FaTasks className="mr-1.5 h-3 w-3" />
                            {currentFile.task.title}
                          </Link>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            <FaTimes className="mr-1.5 h-3 w-3" />
                            ko
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Dernière mise à jour: {new Date(currentFile.updated_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-4 gap-6"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {/* Main Content - 3 columns */}
            <div className="lg:col-span-3 space-y-6">
              {/* File Preview Section */}
              <motion.div 
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                variants={item}
              >
                <FilePreview 
                  file={currentFile} 
                  canManageFile={canManageFile}
                  onDelete={handleDelete}
                  onShare={handleShare}
                  onDownload={handleDownload}
                />
              </motion.div>
              
              {/* File Details Section */}
              <motion.div 
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                variants={item}
              >
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Détails du fichier
                  </h2>
                </div>
                <div className="p-6">
                  <FileMetadata file={currentFile} />
                </div>
              </motion.div>
              

              
              {/* Comments Section */}
              <motion.div 
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                variants={item}
              >
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Commentaires
                  </h2>
                </div>
                <div className="p-6">
                  <CommentsSection fileId={currentFile.id} currentUser={currentUser} />
                </div>
              </motion.div>
            </div>
            
            {/* Sidebar - 1 column */}
            <div className="lg:col-span-1 space-y-6">
                {/* Save to Dropbox Section */}
              {canManageFile && (
                <motion.div 
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                  variants={item}
                >
                  <div className="p-4">
                    <SaveToDropboxButton 
                      fileId={currentFile.id} 
                      className="w-full flex items-center justify-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
                      text="Sauvegarder sur Dropbox"
                    />
                  </div>
                </motion.div>
              )}
              
              {/* File Info Card */}
              <motion.div 
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                variants={item}
              >
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Informations
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  <RelatedInfo 
                    icon={
                      <FaFileAlt className="h-5 w-5 text-blue-600" />
                    }
                    title="Type de fichier"
                    value={currentFile.type || '-'}
                  />
                  
                  <RelatedInfo 
                    icon={
                      <FaClock className="h-5 w-5 text-purple-600" />
                    }
                    title="Date de création"
                    value={currentFile.created_at ? new Date(currentFile.created_at).toLocaleString('fr-FR') : '-'}
                  />
                  
                  <RelatedInfo 
                    icon={
                      <FaClock className="h-5 w-5 text-yellow-600" />
                    }
                    title="Dernière modification"
                    value={currentFile.updated_at ? new Date(currentFile.updated_at).toLocaleString('fr-FR') : '-'}
                  />
                </div>
              </motion.div>
              
              {/* Related Entities Card */}
              <motion.div 
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                variants={item}
              >
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Liens associés
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  {currentFile.project && (
                    <RelatedInfo 
                      icon={
                        <FaProjectDiagram className="h-5 w-5 text-green-600" />
                      }
                      title="Projet"
                      value={currentFile.project.name}
                      href={route('projects.show', currentFile.project.id)}
                    />
                  )}
                  
                  {currentFile.task ? (
                    <RelatedInfo 
                      icon={
                        <FaTasks className="h-5 w-5 text-indigo-600" />
                      }
                      title="Tâche"
                      value={
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <FaTasks className="mr-1.5 h-3 w-3" />
                          {currentFile.task.title}
                        </span>
                      }
                      href={`/tasks/${currentFile.task.id}`}
                    />
                  ) : (
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <FaTasks className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-gray-900">Tâche</h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Non associée
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <RelatedInfo 
                    icon={
                      <FaUser className="h-5 w-5 text-amber-600" />
                    }
                    title="Déposé par"
                    value={currentFile.user?.name || 'Utilisateur inconnu'}
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Transition appear show={isDeleteModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsDeleteModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Confirmer la suppression
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Êtes-vous sûr de vouloir supprimer ce fichier ? Cette action est irréversible.
                    </p>
                  </div>

                  <div className="mt-4 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                      onClick={() => setIsDeleteModalOpen(false)}
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                      onClick={() => {
                        setIsDeleteModalOpen(false);
                        confirmDelete();
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </AdminLayout>
  );
};

export default Show;