import React, { useCallback, useState } from 'react';
import { router, Link } from '@inertiajs/react';
import FileIcon from '../FileIcon';
import { 
  FaPaperclip, 
  FaEdit, 
  FaDownload, 
  FaTrash, 
  FaShare, 
  FaEllipsisH,
  FaTimes,
  FaCopy,
  FaFileAlt,
  FaEye
} from 'react-icons/fa';
import { isFileEditable, isPdfFile } from '../../utils/fileUtils';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

const FilePreview = ({ file, canManageFile = false, onDelete, onShare, onDownload }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const fileUrl = `/storage/${file.file_path}`;
  const isImage = file.type?.startsWith('image/');
  const isEditable = isFileEditable(file.type, file.name);
  const isPdf = isPdfFile(file.type, file.name);
  const [showFullPreview, setShowFullPreview] = useState(false);

  const handleEditContent = useCallback(() => {
    router.visit(`/files/${file.id}/edit-content`);
  }, [file.id]);

  const handleShare = useCallback((e) => {
    e?.preventDefault();
    if (onShare) {
      onShare();
    } else {
      navigator.clipboard.writeText(window.location.href);
      // Vous pourriez ajouter une notification ici
      alert('Lien copié dans le presse-papier');
    }
  }, [onShare]);

  const handleDownload = useCallback((e) => {
    e?.preventDefault();
    if (onDownload) {
      onDownload(e);
    } else {
      window.open(fileUrl, '_blank');
    }
  }, [fileUrl, onDownload]);

  const handleDelete = useCallback((e) => {
    e?.preventDefault();
    if (onDelete) {
      onDelete();
    }
  }, [onDelete]);

  const handlePreview = useCallback((e) => {
    e?.preventDefault();
    if (isImage) {
      setShowFullPreview(true);
    } else {
      window.open(fileUrl, '_blank');
    }
  }, [fileUrl, isImage]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* En-tête avec actions rapides */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Aperçu du fichier</h2>
        
        {/* Menu déroulant des actions */}
        <Menu as="div" className="relative">
          <Menu.Button className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <FaEllipsisH className="h-5 w-5" />
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleDownload}
                      className={`${
                        active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                      } group flex items-center w-full px-4 py-2 text-sm`}
                    >
                      <FaDownload className="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400" />
                      Télécharger
                    </button>
                  )}
                </Menu.Item>
                
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleShare}
                      className={`${
                        active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                      } group flex items-center w-full px-4 py-2 text-sm`}
                    >
                      <FaShare className="mr-3 h-5 w-5 text-indigo-500" />
                      Partager
                    </button>
                  )}
                </Menu.Item>
                
                {isEditable && !isPdf && (
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleEditContent}
                        className={`${
                          active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                        } group flex items-center w-full px-4 py-2 text-sm`}
                      >
                        <FaEdit className="mr-3 h-5 w-5 text-green-500" />
                        Modifier le contenu
                      </button>
                    )}
                  </Menu.Item>
                )}
                
                {canManageFile && (
                  <>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href={`/files/${file.id}/edit`}
                          className={`${
                            active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                          } group flex items-center w-full px-4 py-2 text-sm`}
                        >
                          <FaEdit className="mr-3 h-5 w-5 text-blue-500" />
                          Modifier les métadonnées
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleDelete}
                          className={`${
                            active ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 'text-red-600 dark:text-red-400'
                          } group flex items-center w-full px-4 py-2 text-sm`}
                        >
                          <FaTrash className="mr-3 h-5 w-5" />
                          Supprimer
                        </button>
                      )}
                    </Menu.Item>
                  </>
                )}
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
      
      {/* Contenu de l'aperçu */}
      <div className="p-6 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-700 min-h-64">
        {isImage ? (
          <div className="relative group">
            <div className={`mb-4 w-full max-w-full max-h-96 ${!isImageLoaded ? 'animate-pulse bg-gray-200 dark:bg-gray-600' : ''} rounded-lg overflow-hidden`}>
              <img 
                src={fileUrl} 
                alt={file.name} 
                className={`max-h-96 w-auto mx-auto transition-opacity duration-300 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setIsImageLoaded(true)}
                onClick={handlePreview}
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={handlePreview}
                className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                title="Afficher en grand"
              >
                <FaEye className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto">
              <FileIcon type={file.type} size="text-6xl mb-4" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-300 mt-2">
              {file.type || 'Type de fichier inconnu'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {file.size ? (file.size / 1024).toFixed(1) + ' Ko' : 'Taille inconnue'}
            </p>
          </div>
        )}
        
        {/* Boutons d'action rapide en bas */}
        <div className="flex flex-wrap justify-center gap-3 mt-6 w-full">
          <button
            onClick={handlePreview}
            className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 flex-1 sm:flex-none"
          >
            <FaEye className="mr-2 h-4 w-4" />
            {isImage ? 'Aperçu' : 'Ouvrir'}
          </button>
          
          <button
            onClick={handleDownload}
            className="inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 flex-1 sm:flex-none"
          >
            <FaDownload className="mr-2 h-4 w-4" />
            Télécharger
          </button>
          
          <button
            onClick={handleShare}
            className="inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 flex-1 sm:flex-none"
          >
            <FaShare className="mr-2 h-4 w-4 text-indigo-600" />
            Partager
          </button>
        </div>
      </div>
      
      {/* Modal d'aperçu plein écran pour les images */}
      {showFullPreview && isImage && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              aria-hidden="true"
              onClick={() => setShowFullPreview(false)}
            ></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start justify-between">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                    {file.name}
                  </h3>
                  <button
                    type="button"
                    className="ml-3 bg-white dark:bg-gray-700 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={() => setShowFullPreview(false)}
                  >
                    <span className="sr-only">Fermer</span>
                    <FaTimes className="h-6 w-6" />
                  </button>
                </div>
                <div className="mt-2 max-h-[70vh] overflow-auto flex justify-center">
                  <img 
                    src={fileUrl} 
                    alt={file.name} 
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDownload}
                >
                  <FaDownload className="mr-2 h-4 w-4" />
                  Télécharger
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowFullPreview(false)}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilePreview;
