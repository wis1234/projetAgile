import React from 'react';
import { Head } from '@inertiajs/react';
import GoogleStylePreviewer from '@/Components/FileViewer/GoogleStylePreviewer';
import { isPdfFile, isOfficeOrDocFile } from '@/utils/fileUtils';
import { FaArrowLeft, FaDownload, FaTimes, FaFileAlt, FaFileImage, FaFilePdf } from 'react-icons/fa';

// ─── Déterminer le type d'icône de fichier ─────────────────────────────────
const FileTypeIcon = ({ file }) => {
  const isImage = file.type?.startsWith('image/');
  const isPdf   = isPdfFile(file.type, file.name);
  if (isImage) return <FaFileImage className="h-4 w-4 text-blue-400" />;
  if (isPdf)   return <FaFilePdf className="h-4 w-4 text-red-400" />;
  return <FaFileAlt className="h-4 w-4 text-blue-400" />;
};

// ─── Viewer PDF plein écran ─────────────────────────────────────────────────
const PdfViewer = ({ fileUrl, fileName }) => (
  <div className="w-full flex-1 rounded-xl overflow-hidden shadow-2xl bg-white" style={{ minHeight: '80vh' }}>
    <iframe
      src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1`}
      className="w-full h-full"
      style={{ minHeight: '80vh', border: 'none' }}
      title={`Prévisualisation PDF - ${fileName}`}
    />
  </div>
);

// ─── Viewer Image plein écran ───────────────────────────────────────────────
const ImageViewer = ({ fileUrl, fileName }) => (
  <div className="w-full flex-1 flex items-center justify-center p-8">
    <img
      src={fileUrl}
      alt={fileName}
      className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl"
    />
  </div>
);

// ─── Fallback générique ────────────────────────────────────────────────────
const GenericViewer = ({ fileUrl, fileName, downloadUrl }) => (
  <div className="w-full flex-1 flex flex-col items-center justify-center gap-6 text-slate-300">
    <FaFileAlt className="text-7xl text-slate-600" />
    <div className="text-center">
      <p className="font-bold text-lg text-white">{fileName}</p>
      <p className="text-sm text-slate-400 mt-1">Aucun aperçu disponible pour ce type de fichier.</p>
    </div>
    <a
      href={downloadUrl}
      download
      className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow transition-colors"
    >
      <FaDownload className="h-4 w-4" />
      Télécharger pour ouvrir
    </a>
  </div>
);

// ─── Page principale Preview ────────────────────────────────────────────────
export default function Preview({ file }) {
  const fileUrl     = `/storage/${file.file_path}`;
  const downloadUrl = route('files.download', file.id);
  const isImage     = file.type?.startsWith('image/');
  const isPdf       = isPdfFile(file.type, file.name);
  const isOffice    = isOfficeOrDocFile(file.type, file.name);

  const renderViewer = () => {
    if (isImage)  return <ImageViewer fileUrl={fileUrl} fileName={file.name} />;
    if (isPdf)    return <PdfViewer   fileUrl={fileUrl} fileName={file.name} />;
    if (isOffice) return <GoogleStylePreviewer file={file} fileUrl={fileUrl} className="flex-1 w-full" />;
    return <GenericViewer fileUrl={fileUrl} fileName={file.name} downloadUrl={downloadUrl} />;
  };

  const typeLabel = isImage ? 'Image' : isPdf ? 'PDF' : isOffice ? 'Document' : 'Fichier';

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
      <Head title={`${file.name} — Prévisualisation`} />

      {/* ── Barre de navigation ────────────────────────────────────────── */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between shadow-lg sticky top-0 z-20">
        <div className="flex items-center space-x-4 min-w-0">
          {/* Bouton fermer */}
          <button
            onClick={() => window.close()}
            className="shrink-0 flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
          >
            <FaArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Fermer</span>
          </button>

          {/* Infos fichier */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <FileTypeIcon file={file} />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-100 truncate max-w-xs sm:max-w-md md:max-w-xl" title={file.name}>
                {file.name}
              </h1>
              <p className="text-[11px] text-slate-500">{typeLabel} · Lecture seule</p>
            </div>
          </div>
        </div>

        {/* Actions droite */}
        <div className="shrink-0 flex items-center gap-2">
          <a
            href={downloadUrl}
            download
            className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow transition-colors"
          >
            <FaDownload className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Télécharger</span>
          </a>

          <button
            onClick={() => window.close()}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Fermer cet onglet"
          >
            <FaTimes className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ── Zone de prévisualisation ────────────────────────────────────── */}
      <main className="flex-1 flex flex-col p-4 md:p-6 bg-slate-950">
        <div className="w-full flex-1 max-w-7xl mx-auto flex flex-col">
          {renderViewer()}
        </div>
      </main>
    </div>
  );
}
