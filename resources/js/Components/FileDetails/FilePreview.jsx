import React, { useCallback, useState } from 'react';
import { router, Link } from '@inertiajs/react';
import FileIcon from '../FileIcon';
import {
  FaEdit, FaDownload, FaTrash, FaShare,
  FaEllipsisH, FaTimes, FaEye, FaFilePdf,
  FaFileAlt, FaExternalLinkAlt
} from 'react-icons/fa';
import { isFileEditable, isPdfFile, isOfficeOrDocFile } from '../../utils/fileUtils';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

// ─── Vignette de prévisualisation selon le type de fichier ─────────────────
const FileThumbnail = ({ file, fileUrl, onOpenPreview }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const ext = (file.name || '').split('.').pop().toLowerCase();
  const isImage = file.type?.startsWith('image/');
  const isPdf   = isPdfFile(file.type, file.name);
  const isOffice = isOfficeOrDocFile(file.type, file.name);
  const isTxt   = ext === 'txt' || ext === 'md' || file.type?.startsWith('text/');

  // ── Image ────────────────────────────────────────────────────────────────
  if (isImage) {
    return (
      <div className="relative group cursor-zoom-in" onClick={onOpenPreview}>
        {!imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg animate-pulse">
            <FaFileAlt className="text-gray-300 text-5xl" />
          </div>
        )}
        <img
          src={fileUrl}
          alt={file.name}
          className={`max-h-64 w-auto mx-auto rounded-lg shadow transition-opacity duration-300 object-contain ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImgLoaded(true)}
        />
        <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
          <span className="flex items-center gap-2 px-4 py-2 bg-white/90 text-gray-800 rounded-full text-sm font-semibold shadow">
            <FaEye className="h-4 w-4 text-blue-600" /> Agrandir
          </span>
        </div>
      </div>
    );
  }

  // ── PDF ─────────────────────────────────────────────────────────────────
  if (isPdf) {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        {/* Miniature PDF via iframe clip */}
        <div className="w-full max-w-[280px] h-[180px] rounded-xl overflow-hidden border border-red-200 shadow-md bg-white relative pointer-events-none">
          <iframe
            src={`${fileUrl}#page=1&zoom=60&toolbar=0&navpanes=0&scrollbar=0`}
            className="w-full h-full scale-[0.85] origin-top"
            title="Aperçu PDF"
            style={{ border: 'none', pointerEvents: 'none' }}
          />
          {/* Gradient overlay to hint "more content below" */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
            <FaFilePdf className="h-3 w-3" /> PDF
          </span>
          <p className="text-xs text-gray-400">Prévisualisation de la 1ère page</p>
        </div>
      </div>
    );
  }

  // ── Fichiers Office / Texte ────────────────────────────────────────────
  if (isOffice || isTxt) {
    // Détermine la couleur d'accentuation selon le type
    const accentMap = {
      docx: 'blue', doc: 'blue', odt: 'blue', rtf: 'blue',
      xlsx: 'green', xls: 'green', csv: 'green', ods: 'green', tsv: 'green',
      pptx: 'orange', ppt: 'orange', odp: 'orange',
      txt: 'slate', md: 'slate',
    };
    const accent = accentMap[ext] || 'blue';
    const accentClasses = {
      blue: 'bg-blue-50 border-blue-200 text-blue-700',
      green: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      orange: 'bg-orange-50 border-orange-200 text-orange-700',
      slate: 'bg-slate-50 border-slate-200 text-slate-700',
    };

    return (
      <div className={`flex flex-col items-center gap-4 py-6 px-8 w-full max-w-sm mx-auto rounded-2xl border ${accentClasses[accent]} transition-all`}>
        <FileIcon type={file.type} size="text-6xl" />
        <div className="text-center">
          <p className="font-semibold text-sm text-gray-800 truncate max-w-[200px]">{file.name}</p>
          <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-wider">{ext?.toUpperCase() || 'Fichier'}</p>
          {file.size && (
            <p className="text-xs text-gray-400 mt-0.5">{(file.size / 1024).toFixed(1)} Ko</p>
          )}
        </div>
        <button
          onClick={onOpenPreview}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow transition-colors"
        >
          <FaExternalLinkAlt className="h-3 w-3" />
          Prévisualiser
        </button>
      </div>
    );
  }

  // ── Générique (video, audio, archive, autre) ───────────────────────────
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center shadow-inner">
        <FileIcon type={file.type} size="text-4xl" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-sm text-gray-700 truncate max-w-[200px]">{file.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{file.type || 'Type inconnu'}</p>
        {file.size && (
          <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} Ko</p>
        )}
      </div>
      <p className="text-xs text-gray-400 italic">Aucune prévisualisation disponible pour ce format.</p>
    </div>
  );
};

// ─── Composant principal ────────────────────────────────────────────────────
const FilePreview = ({ file, canManageFile = false, onDelete, onShare, onDownload }) => {
  const fileUrl = `/storage/${file.file_path}`;
  const isImage = file.type?.startsWith('image/');
  const isEditable = isFileEditable(file.type, file.name);
  const isPdf = isPdfFile(file.type, file.name);
  const [showImageModal, setShowImageModal] = useState(false);

  const openPreviewTab = useCallback(() => {
    if (isImage) {
      setShowImageModal(true);
    } else {
      window.open(`/files/${file.id}/preview`, '_blank');
    }
  }, [file.id, isImage]);

  const handleEditContent = useCallback(() => {
    router.visit(`/files/${file.id}/edit-content`);
  }, [file.id]);

  const handleShare = useCallback((e) => {
    e?.preventDefault();
    if (onShare) {
      onShare();
    } else {
      navigator.clipboard.writeText(window.location.href);
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
    if (onDelete) onDelete();
  }, [onDelete]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">

      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <div className="px-6 py-3.5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/80">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
          Aperçu du fichier
        </h2>

        {/* Menu contextuel ⋯ */}
        <div className="flex items-center gap-2">
          <Menu as="div" className="relative">
            <Menu.Button className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 transition-colors">
              <FaEllipsisH className="h-4 w-4" />
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
              <Menu.Items className="absolute right-0 z-20 mt-1 w-52 origin-top-right rounded-xl bg-white dark:bg-gray-800 shadow-xl ring-1 ring-black/5 focus:outline-none border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="py-1">
                  {/* Prévisualiser */}
                  <Menu.Item>
                    {({ active }) => (
                      <button onClick={openPreviewTab}
                        className={`${active ? 'bg-blue-50 text-blue-700' : 'text-gray-700 dark:text-gray-300'} flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium`}>
                        <FaEye className="h-4 w-4 text-blue-500 shrink-0" />
                        Prévisualiser
                      </button>
                    )}
                  </Menu.Item>

                  {/* Télécharger */}
                  <Menu.Item>
                    {({ active }) => (
                      <button onClick={handleDownload}
                        className={`${active ? 'bg-gray-50 dark:bg-gray-700' : 'text-gray-700 dark:text-gray-300'} flex items-center gap-3 w-full px-4 py-2.5 text-sm`}>
                        <FaDownload className="h-4 w-4 text-gray-400 shrink-0" />
                        Télécharger
                      </button>
                    )}
                  </Menu.Item>

                  {/* Partager */}
                  <Menu.Item>
                    {({ active }) => (
                      <button onClick={handleShare}
                        className={`${active ? 'bg-gray-50 dark:bg-gray-700' : 'text-gray-700 dark:text-gray-300'} flex items-center gap-3 w-full px-4 py-2.5 text-sm`}>
                        <FaShare className="h-4 w-4 text-indigo-400 shrink-0" />
                        Partager le lien
                      </button>
                    )}
                  </Menu.Item>

                  {/* Modifier le contenu */}
                  {isEditable && !isPdf && (
                    <Menu.Item>
                      {({ active }) => (
                        <button onClick={handleEditContent}
                          className={`${active ? 'bg-gray-50 dark:bg-gray-700' : 'text-gray-700 dark:text-gray-300'} flex items-center gap-3 w-full px-4 py-2.5 text-sm`}>
                          <FaEdit className="h-4 w-4 text-green-500 shrink-0" />
                          Modifier le contenu
                        </button>
                      )}
                    </Menu.Item>
                  )}

                  {/* Actions manager */}
                  {canManageFile && (
                    <>
                      <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                      <Menu.Item>
                        {({ active }) => (
                          <Link href={`/files/${file.id}/edit`}
                            className={`${active ? 'bg-gray-50 dark:bg-gray-700' : 'text-gray-700 dark:text-gray-300'} flex items-center gap-3 w-full px-4 py-2.5 text-sm`}>
                            <FaEdit className="h-4 w-4 text-blue-400 shrink-0" />
                            Modifier les métadonnées
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button onClick={handleDelete}
                            className={`${active ? 'bg-red-50 text-red-700' : 'text-red-600 dark:text-red-400'} flex items-center gap-3 w-full px-4 py-2.5 text-sm`}>
                            <FaTrash className="h-4 w-4 shrink-0" />
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
      </div>

      {/* ── Zone de vignette ────────────────────────────────────────────── */}
      <div className="px-6 py-6 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-700/30 min-h-[220px]">
        <FileThumbnail file={file} fileUrl={fileUrl} onOpenPreview={openPreviewTab} />
      </div>

      {/* ── Barre d'actions rapides ──────────────────────────────────────── */}
      <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-wrap items-center gap-2">
        {/* Bouton principal : Prévisualiser */}
        <button
          onClick={openPreviewTab}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <FaEye className="h-4 w-4" />
          Prévisualiser
        </button>

        {/* Modifier le contenu (fichiers éditables) */}
        {isEditable && !isPdf && (
          <button
            onClick={handleEditContent}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <FaEdit className="h-4 w-4 text-green-500" />
            Modifier
          </button>
        )}

        {/* Télécharger */}
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <FaDownload className="h-4 w-4 text-gray-500" />
          Télécharger
        </button>

        {/* Partager */}
        <button
          onClick={handleShare}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ml-auto"
        >
          <FaShare className="h-4 w-4 text-indigo-500" />
          Partager
        </button>
      </div>

      {/* ── Modal image plein écran ──────────────────────────────────────── */}
      {showImageModal && isImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div
            className="relative max-w-5xl w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm font-semibold text-gray-800 dark:text-white truncate max-w-md">{file.name}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <FaDownload className="h-3 w-3" /> Télécharger
                </button>
                <button
                  onClick={() => setShowImageModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="max-h-[80vh] overflow-auto flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
              <img src={fileUrl} alt={file.name} className="max-h-full max-w-full object-contain rounded" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilePreview;
