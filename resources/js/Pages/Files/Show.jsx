import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { motion } from 'framer-motion';
import FileHeader from '@/Components/FileDetails/FileHeader';
import FilePreview from '@/Components/FileDetails/FilePreview';
import FileMetadata from '@/Components/FileDetails/FileMetadata';
import StatusUpdateForm from '@/Components/FileDetails/StatusUpdateForm';
import CommentsSection from '@/Components/FileDetails/CommentsSection';
import RelatedInfo from '@/Components/FileDetails/RelatedInfo';
import SaveToDropboxButton from '@/Components/Files/SaveToDropboxButton';
import { FaProjectDiagram, FaTasks, FaUser, FaFileAlt, FaClock, FaEdit } from 'react-icons/fa';
import { isFileEditable } from '@/utils/fileUtils';

const Show = ({ file, statuses, auth, canManageFile }) => {
  const { user: currentUser } = auth;
  const [currentFile, setCurrentFile] = useState(file);
  
  const isFileOwner = currentFile.user_id === currentUser?.id;
  const canEditContent = isFileEditable(currentFile.type, currentFile.name);
  

  const handleStatusUpdate = (updatedFile) => {
    setCurrentFile(updatedFile);
  };

  const handleDelete = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) {
      router.delete(route('files.destroy', currentFile.id), {
        onSuccess: () => {
          router.visit(route('files.index'));
        },
      });
    }
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
      
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <FileHeader 
              file={currentFile} 
              onDelete={canManageFile ? handleDelete : null}
              currentUser={currentUser}
            >
              {canManageFile && (
                <SaveToDropboxButton 
                  fileId={currentFile.id} 
                  className="ml-2"
                />
              )}
            </FileHeader>
            
            {canEditContent && (
              <a
                href={route('files.edit-content', currentFile.id)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:border-blue-900 focus:ring focus:ring-blue-300 disabled:opacity-25 transition ml-4"
              >
                <FaEdit className="mr-2" />
                Modifier le contenu
              </a>
            )}
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {/* Colonne principale */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div variants={item}>
                <FilePreview file={currentFile} />
              </motion.div>
              
              <motion.div variants={item}>
                <FileMetadata file={currentFile} />
              </motion.div>
              
              <motion.div variants={item}>
                <StatusUpdateForm 
                  file={currentFile} 
                  statuses={statuses} 
                  onStatusUpdate={handleStatusUpdate}
                />
              </motion.div>
              
              {/* Section des commentaires */}
              <motion.div variants={item} className="mt-6">
                <CommentsSection fileId={currentFile.id} currentUser={currentUser} />
              </motion.div>
            </div>
            
            {/* Colonne secondaire */}
            <div className="lg:col-span-1 space-y-6">
              <motion.div 
                className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
                variants={item}
              >
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Informations liées
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  {currentFile.project && (
                    <RelatedInfo 
                      icon={
                        <FaProjectDiagram className="h-5 w-5 text-blue-600" />
                      }
                      title="Projet"
                      value={currentFile.project.name}
                      href={route('projects.show', currentFile.project.id)}
                    />
                  )}
                  
                  {currentFile.task && (
                    <RelatedInfo 
                      icon={
                        <FaTasks className="h-5 w-5 text-purple-600" />
                      }
                      title="Tâche"
                      value={currentFile.task.name}
                      href={route('tasks.show', [currentFile.project?.id, currentFile.task.id])}
                    />
                  )}
                  
                  <RelatedInfo 
                    icon={
                      <FaUser className="h-5 w-5 text-green-600" />
                    }
                    title="Déposé par"
                    value={currentFile.user?.name || 'Utilisateur inconnu'}
                  />
                  
                  <RelatedInfo 
                    icon={
                      <FaFileAlt className="h-5 w-5 text-gray-500" />
                    }
                    title="Type de fichier"
                    value={currentFile.type || 'Inconnu'}
                  />
                  
                  <RelatedInfo 
                    icon={
                      <FaClock className="h-5 w-5 text-yellow-600" />
                    }
                    title="Date de dépôt"
                    value={new Date(currentFile.created_at).toLocaleString('fr-FR')}
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Show;