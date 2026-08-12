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

const GoogleStylePreviewer = ({ file, fileUrl, className = '' }) => {
  const [useGoogleEmbed, setUseGoogleEmbed] = useState(false);
  const fileName = file?.name || file?.filename || 'Fichier';
  const fileType = file?.type || file?.mime_type || '';
  const targetUrl = fileUrl || `/storage/${file?.file_path || file?.path}`;
  const ext = fileName.split('.').pop()?.toLowerCase();

  const isExcelOrCsv = ['xlsx', 'xls', 'csv', 'ods', 'tsv'].includes(ext) || fileType.includes('spreadsheet') || fileType.includes('excel') || fileType.includes('csv');
  const isWordOrDoc = ['docx', 'doc', 'rtf', 'odt', 'txt', 'md'].includes(ext) || fileType.includes('word') || fileType.includes('document');
  const isPowerPoint = ['pptx', 'ppt', 'ppsx', 'odp', 'key'].includes(ext) || fileType.includes('powerpoint') || fileType.includes('presentation');

  if (useGoogleEmbed) {
    const encodedUrl = encodeURIComponent(window.location.origin + targetUrl);
    const embedUrl = `https://docs.google.com/gview?url=${encodedUrl}&embedded=true`;
    return (
      <div className={`w-full h-full min-h-[600px] flex flex-col bg-slate-900 rounded-xl overflow-hidden shadow-2xl ${className}`}>
        <div className="bg-slate-800 p-3 border-b border-slate-700 flex items-center justify-between text-xs text-slate-300">
          <span className="font-semibold flex items-center gap-2">
            <FaEye className="text-blue-400" /> Prévisualisation Google Docs / Office Web Viewer
          </span>
          <button
            onClick={() => setUseGoogleEmbed(false)}
            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded font-medium transition-colors"
          >
            Revenir au lecteur interactif
          </button>
        </div>
        <iframe
          src={embedUrl}
          className="w-full flex-1 border-none min-h-[580px] bg-white"
          title={fileName}
        />
      </div>
    );
  }

  if (isExcelOrCsv) {
    return <SpreadsheetViewer fileUrl={targetUrl} fileName={fileName} isCsv={ext === 'csv'} />;
  }

  if (isWordOrDoc) {
    return <DocumentViewer fileUrl={targetUrl} fileName={fileName} fileType={fileType} />;
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
