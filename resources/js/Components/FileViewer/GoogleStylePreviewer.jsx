import React, { useState } from 'react';
import SpreadsheetViewer from './SpreadsheetViewer';
import DocumentViewer from './DocumentViewer';
import PresentationViewer from './PresentationViewer';
import { FaFileAlt, FaDownload, FaEye, FaExternalLinkAlt } from 'react-icons/fa';

export const isOfficeOrDocFile = (fileType = '', fileName = '') => {
  const name = (fileName || '').toLowerCase();
  const type = (fileType || '').toLowerCase();
  
  const officeExtensions = [
    'pptx', 'ppt', 'ppsx', 'xlsx', 'xls', 'csv', 'ods', 'tsv',
    'docx', 'doc', 'rtf', 'odt', 'txt', 'md'
  ];

  const extension = name.split('.').pop();
  if (officeExtensions.includes(extension)) return true;

  return type.includes('word') || type.includes('spreadsheet') || type.includes('excel') ||
         type.includes('powerpoint') || type.includes('presentation') || type.includes('csv');
};

const GoogleStylePreviewer = ({ file, fileUrl, downloadUrl = null, className = '' }) => {
  const fileName = file?.name || file?.filename || 'Fichier';
  const fileType = (file?.type || file?.mime_type || '').toLowerCase();
  const targetUrl = fileUrl || `/storage/${file?.file_path || file?.path}`;
  const effectiveDownloadUrl = downloadUrl || (file?.id ? (typeof route === 'function' ? route('files.download', file.id) : `/files/${file.id}/download`) : targetUrl);
  
  const pathExt = (file?.file_path || fileUrl || '').split('.').pop()?.toLowerCase();
  const nameExt = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() : '';
  const ext = nameExt || pathExt || '';

  const isExcelOrCsv = ['xlsx', 'xls', 'csv', 'ods', 'tsv'].includes(ext) || pathExt === 'xlsx' || pathExt === 'xls' || pathExt === 'csv' || fileType.includes('spreadsheet') || fileType.includes('excel') || fileType.includes('csv');
  const isWordOrDoc = ['docx', 'doc', 'rtf', 'odt', 'txt', 'md'].includes(ext) || pathExt === 'docx' || pathExt === 'doc' || fileType.includes('word') || fileType.includes('document');
  const isPowerPoint = ['pptx', 'ppt', 'ppsx', 'odp', 'key'].includes(ext) || pathExt === 'pptx' || pathExt === 'ppt' || fileType.includes('powerpoint') || fileType.includes('presentation');

  if (isExcelOrCsv) {
    return <SpreadsheetViewer fileUrl={targetUrl} fileName={fileName} isCsv={ext === 'csv'} />;
  }

  if (isWordOrDoc) {
    return (
      <DocumentViewer
        fileUrl={targetUrl}
        fileName={fileName}
        fileType={fileType}
        downloadUrl={effectiveDownloadUrl}
        file={file}
      />
    );
  }

  if (isPowerPoint) {
    return <PresentationViewer fileUrl={targetUrl} fileName={fileName} />;
  }

  // Generic fallback if not an office format
  return (
    <div className="p-8 text-center bg-slate-900 text-white rounded-xl">
      <FaFileAlt className="mx-auto text-4xl text-slate-500 mb-3" />
      <p className="font-semibold text-sm">{fileName}</p>
      <p className="text-xs text-slate-400 mt-1 mb-4">Aperçu interactif non disponible pour ce format de fichier.</p>
      <a
        href={targetUrl}
        download
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow transition-colors"
      >
        <FaDownload /> Télécharger le fichier
      </a>
    </div>
  );
};

export default GoogleStylePreviewer;
