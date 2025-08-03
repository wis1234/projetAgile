import React, { useState, useEffect } from 'react';
import DropboxService from '../../Services/dropboxService';

// Helper component for consistent detail row styling
const DetailItem = ({ label, value, bgGray = false, className = '' }) => (
  <div className={`py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 px-6 ${bgGray ? 'bg-gray-50 dark:bg-gray-700' : ''}`}>
    <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">
      {label}
    </dt>
    <dd className={`mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2 ${className}`}>
      {value}
    </dd>
  </div>
);

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FileMetadata = ({ file }) => {
  const [fileMetadata, setFileMetadata] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFileMetadata = async () => {
      if (!file || !file.path_lower) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Utilisation du service Dropbox pour récupérer les métadonnées
        const response = await DropboxService.dbx.filesGetMetadata({
          path: file.path_lower,
          include_media_info: true,
          include_has_explicit_shared_members: true,
          include_property_groups: {
            template_ids: ['ptid:1a5n2g6-3a4b-5c6d-7e8f-9g0h1i2j3k4l5']
          }
        });
        
        setFileMetadata(response.result);
      } catch (err) {
        console.error('Erreur lors de la récupération des métadonnées:', err);
        setError('Impossible de charger les métadonnées du fichier');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFileMetadata();
  }, [file]);

  const metadata = [
    { label: 'Nom du fichier', value: file.name },
    { label: 'Taille', value: formatFileSize(file.size), bgGray: true },
    { label: 'Type MIME', value: file.type || 'Inconnu' },
    { 
      label: 'Statut', 
      value: (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          file.status === 'validated' 
            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
            : file.status === 'rejected'
            ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
        }`}>
          {file.status === 'validated' 
            ? 'Validé' 
            : file.status === 'rejected' 
            ? 'Rejeté' 
            : 'En attente'}
        </span>
      ),
      bgGray: true 
    },
    { 
      label: 'Date de création', 
      value: new Date(file.created_at).toLocaleString('fr-FR'),
      bgGray: false 
    },
    { 
      label: 'Dernière modification', 
      value: new Date(file.updated_at).toLocaleString('fr-FR'),
      bgGray: true
    },
  ];

  // Ajouter les métadonnées Dropbox si disponibles
  if (fileMetadata) {
    if (fileMetadata.client_modified) {
      metadata.push({
        label: 'Dernière modification Dropbox',
        value: new Date(fileMetadata.client_modified).toLocaleString('fr-FR'),
        bgGray: false
      });
    }
    
    if (fileMetadata.content_hash) {
      metadata.push({
        label: 'Hash du contenu',
        value: fileMetadata.content_hash,
        bgGray: true,
        className: 'font-mono text-xs truncate'
      });
    }
  }

  if (file.status === 'rejected' && file.rejection_reason) {
    metadata.push({
      label: 'Raison du rejet',
      value: file.rejection_reason,
      bgGray: false,
      className: 'text-red-600 dark:text-red-400 whitespace-pre-line'
    });
  }

  if (file.description) {
    metadata.push({
      label: 'Description',
      value: file.description,
      bgGray: true,
      className: 'whitespace-pre-line'
    });
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Détails du fichier</h2>
      </div>
      <div className="bg-white dark:bg-gray-800 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-red-500">{error}</div>
        ) : (
          <dl className="sm:divide-y sm:divide-gray-200 dark:divide-gray-700">
            {metadata.map((item, index) => (
              <DetailItem 
                key={index}
                label={item.label}
                value={item.value}
                bgGray={item.bgGray}
                className={item.className || ''}
              />
            ))}
          </dl>
        )}
      </div>
    </div>
  );
};

export default FileMetadata;
