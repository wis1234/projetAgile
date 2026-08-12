import React from 'react';
import { Head, Link } from '@inertiajs/react';
import GoogleStylePreviewer from '@/Components/FileViewer/GoogleStylePreviewer';
import { FaArrowLeft, FaDownload, FaTimes, FaFileAlt } from 'react-icons/fa';

export default function Preview({ file }) {
  const fileUrl = `/storage/${file.file_path}`;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
      <Head title={`Prévisualisation - ${file.name}`} />

      {/* ── Standalone Top Bar ───────────────────────────────────── */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => window.close()}
            className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
            title="Fermer cet onglet"
          >
            <FaArrowLeft className="h-3.5 w-3.5" />
            <span>Fermer l'onglet</span>
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center">
              <FaFileAlt className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-100 truncate max-w-md" title={file.name}>
                {file.name}
              </h1>
              <p className="text-[11px] text-slate-400">
                Aperçu pour lecture (Google Docs / Sheets / Slides Viewer)
              </p>
            </div>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center space-x-3">
          <a
            href={route('files.download', file.id)}
            download
            className="flex items-center space-x-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg shadow transition-colors"
          >
            <FaDownload className="h-3.5 w-3.5" />
            <span>Télécharger</span>
          </a>

          <button
            onClick={() => window.close()}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Fermer"
          >
            <FaTimes className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ── Main Full-Page Viewer Stage ───────────────────────────── */}
      <main className="flex-1 flex flex-col p-4 md:p-6 bg-slate-950">
        <div className="w-full flex-1 max-w-7xl mx-auto flex flex-col">
          <GoogleStylePreviewer file={file} fileUrl={fileUrl} className="flex-1" />
        </div>
      </main>
    </div>
  );
}
