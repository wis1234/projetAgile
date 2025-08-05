import React, { useCallback } from 'react';
import { router } from '@inertiajs/react';
import FileIcon from '../FileIcon';
import { FaPaperclip, FaEdit } from 'react-icons/fa';
import { isFileEditable, isPdfFile } from '../../utils/fileUtils';

const FilePreview = ({ file }) => {
  const fileUrl = `/storage/${file.file_path}`;
  const isImage = file.type?.startsWith('image/');
  const isEditable = isFileEditable(file.type, file.name);
  const isPdf = isPdfFile(file.type, file.name);

  const handleEditContent = useCallback(() => {
    router.visit(`/files/${file.id}/edit-content`);
  }, [file.id]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Aperçu du fichier</h2>
      </div>
      <div className="p-6 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-700 min-h-64">
        {isImage ? (
          <div className="mb-4 max-w-full max-h-64 overflow-hidden rounded-lg">
            <img 
              src={fileUrl} 
              alt={file.name} 
              className="max-h-64 w-auto mx-auto"
            />
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto">
              <FileIcon type={file.type} size="text-6xl mb-4" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-300 mt-2">
              {file.type || 'Type de fichier inconnu'}
            </p>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <a 
            href={fileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <FaPaperclip className="mr-2" />
            {isImage ? "Ouvrir l'image" : 'Télécharger le fichier'}
          </a>
          
          {isEditable && !isPdf && (
            <button
              onClick={handleEditContent}
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
            >
              <FaEdit className="mr-2" />
              Modifier le contenu
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilePreview;
