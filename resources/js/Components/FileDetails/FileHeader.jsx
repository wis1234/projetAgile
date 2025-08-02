import { Link } from '@inertiajs/react';
import { FaTrash, FaDownload, FaArrowLeft, FaEdit } from 'react-icons/fa';
import { useState } from 'react';
import ConfirmationModal from '../Common/ConfirmationModal';

const FileHeader = ({ file, onDelete, currentUser, children }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Tous les utilisateurs peuvent voir les boutons
  const showAdminControls = true;

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setShowDeleteModal(false);
    onDelete?.();
  };

  return (
    <div className="bg-white px-4 py-5 border-b border-gray-200 sm:px-6">
      <div className="-ml-4 -mt-2 flex items-center justify-between flex-wrap sm:flex-nowrap">
        <div className="ml-4 mt-2">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            <Link 
              href={route('files.index')}
              className="inline-flex items-center text-blue-600 hover:text-blue-900 mr-3"
            >
              <FaArrowLeft className="mr-1" /> Retour
            </Link>
            {file.name}
          </h3>
        </div>
        <div className="ml-4 mt-2 flex-shrink-0 flex flex-wrap gap-2">
          {children}
          
          <a
            href={route('files.download', file.id)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaDownload className="-ml-1 mr-2 h-4 w-4" />
            Télécharger
          </a>
          
          <Link
            href={route('files.edit', file.id)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            <FaEdit className="-ml-1 mr-2 h-4 w-4" />
            Modifier
          </Link>
          
          <button
            type="button"
            onClick={handleDeleteClick}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <FaTrash className="-ml-1 mr-2 h-4 w-4" />
            Supprimer
          </button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Supprimer le fichier"
        message="Êtes-vous sûr de vouloir supprimer ce fichier ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
      />
    </div>
  );
};

export default FileHeader;
