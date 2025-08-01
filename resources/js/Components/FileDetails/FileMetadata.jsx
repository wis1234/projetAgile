import React from 'react';

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
  const metadata = [
    { label: 'Nom du fichier', value: file.name },
    { label: 'Taille', value: formatFileSize(file.size), bgGray: true },
    { label: 'Type MIME', value: file.type || 'Inconnu' },
    { 
      label: 'Date de création', 
      value: new Date(file.created_at).toLocaleString('fr-FR'),
      bgGray: true 
    },
    { 
      label: 'Dernière modification', 
      value: new Date(file.updated_at).toLocaleString('fr-FR') 
    },
  ];

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
      </div>
    </div>
  );
};

export default FileMetadata;
