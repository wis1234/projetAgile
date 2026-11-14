import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FaFileWord, FaDownload, FaExpand, FaCompress,
  FaPrint, FaExclamationTriangle, FaSearchMinus, FaSearchPlus
} from 'react-icons/fa';

const DocumentViewer = ({ fileUrl, fileName, fileType, downloadUrl = null, file = null }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [textContent, setTextContent] = useState('');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const docContainerRef = useRef(null);

  const effectiveDownloadUrl = downloadUrl || fileUrl || (file?.id ? `/files/${file.id}/download` : '#');
  const displayName = fileName || file?.name || file?.filename || 'Document';

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const loadDocument = async () => {
      try {
        const nameToCheck = (fileName || file?.name || file?.filename || '').toLowerCase();
        const pathToCheck = (file?.file_path || fileUrl || '').toLowerCase();
        const typeToCheck = (fileType || file?.type || file?.mime_type || '').toLowerCase();

        const isDocx = nameToCheck.endsWith('.docx') ||
                       pathToCheck.endsWith('.docx') ||
                       pathToCheck.includes('.docx') ||
                       typeToCheck.includes('wordprocessingml') ||
                       typeToCheck.includes('officedocument.word') ||
                       (typeToCheck.includes('word') && !nameToCheck.endsWith('.doc') && !pathToCheck.endsWith('.doc'));

        const isDoc = (nameToCheck.endsWith('.doc') || pathToCheck.endsWith('.doc') || typeToCheck.includes('msword')) && !isDocx;
        const isTxtOrMd = nameToCheck.endsWith('.txt') || nameToCheck.endsWith('.md') ||
                          pathToCheck.endsWith('.txt') || pathToCheck.endsWith('.md') ||
                          typeToCheck.startsWith('text/');

        // Format .doc hérité (Word 97-2003 binaire)
        if (isDoc) {
          if (isMounted) {
            setError({
              type: 'doc_legacy',
              message: 'Ce fichier est au format Word antérieur (.doc). Pour consulter son contenu, téléchargez-le directement.'
            });
            setLoading(false);
          }
          return;
        }

        // Récupérer le contenu binaire avec gestion des fallbacks d'URL
        let response = null;
        const candidates = [fileUrl, effectiveDownloadUrl].filter(Boolean);
        let lastFetchErr = null;

        for (const candidate of candidates) {
          try {
            const res = await fetch(candidate);
            if (res.ok) {
              response = res;
              break;
            } else {
              lastFetchErr = new Error(`HTTP ${res.status}`);
            }
          } catch (err) {
            lastFetchErr = err;
          }
        }

        if (!response || !response.ok) {
          throw new Error('Impossible d\'accéder au document (fichier introuvable ou accès refusé).');
        }

        // Fichiers texte / Markdown
        if (isTxtOrMd) {
          const text = await response.text();
          if (isMounted) {
            const formatted = text
              .split('\n')
              .map(line => `<p class="mb-3">${line.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`)
              .join('');
            setHtmlContent(formatted);
            setTextContent(text);
            setLoading(false);
          }
          return;
        }

        // Conversion locale DOCX via Mammoth.js
        let mammothLib = window.mammoth;
        if (!mammothLib) {
          try {
            const mod = await import('mammoth');
            mammothLib = mod.default || mod;
            if (!mammothLib.convertToHtml && mod.convertToHtml) {
              mammothLib = mod;
            }
          } catch (e) {
            console.error('Erreur lors du chargement de Mammoth.js:', e);
          }
        }

        const convertToHtmlFn = mammothLib?.convertToHtml || mammothLib?.default?.convertToHtml;

        if (!convertToHtmlFn) {
          throw new Error('Le convertisseur de document local n\'a pas pu être chargé.');
        }

        const arrayBuffer = await response.arrayBuffer();
        const options = {};
        const imgHelper = mammothLib.images || mammothLib.default?.images;
        if (imgHelper?.imgElement) {
          options.convertImage = imgHelper.imgElement((image) =>
            image.read('base64').then((imageBuffer) => ({
              src: `data:${image.contentType};base64,${imageBuffer}`,
            }))
          );
        }

        const result = await convertToHtmlFn.call(mammothLib, { arrayBuffer }, options);

        if (isMounted) {
          const html = result.value || '<p class="text-gray-400 italic">Document vide.</p>';
          setHtmlContent(html);
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = html;
          setTextContent(tempDiv.textContent || tempDiv.innerText || '');
          setLoading(false);
        }
      } catch (err) {
        console.error('Erreur lors de la prévisualisation du document:', err);
        if (isMounted) {
          setError({
            type: 'error',
            message: err.message || 'Erreur lors du traitement du document Word.'
          });
          setLoading(false);
        }
      }
    };

    loadDocument();

    return () => {
      isMounted = false;
    };
  }, [fileUrl, fileName, fileType, effectiveDownloadUrl]);

  // Statistiques du document
  const docStats = useMemo(() => {
    if (!textContent) return { words: 0, chars: 0, readTime: '0 min' };
    const cleanText = textContent.trim();
    const words = cleanText ? cleanText.split(/\s+/).length : 0;
    const chars = cleanText.length;
    const readTime = Math.max(1, Math.ceil(words / 200)) + ' min';
    return { words, chars, readTime };
  }, [textContent]);

  // Impression
  const handlePrint = () => {
    if (!docContainerRef.current) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${displayName}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            h1, h2, h3, h4, h5, h6 { color: #0f172a; margin-top: 1.5em; margin-bottom: 0.5em; }
            p { margin-bottom: 1em; }
            table { width: 100%; border-collapse: collapse; margin: 1.5em 0; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
            th { background: #f1f5f9; }
            img { max-width: 100%; height: auto; display: block; margin: 1em auto; }
            blockquote { border-left: 4px solid #3b82f6; padding-left: 1em; color: #475569; font-style: italic; }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleZoomIn = () => setZoomLevel((z) => Math.min(200, z + 15));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(50, z - 15));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-slate-900 border border-slate-800 rounded-2xl min-h-[500px]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <FaFileWord className="absolute inset-0 m-auto text-blue-500 text-xl" />
        </div>
        <p className="mt-4 text-slate-200 font-medium text-sm">
          Chargement du document Word…
        </p>
        <p className="text-xs text-slate-400 mt-1">Conversion locale en cours</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-slate-900 border border-slate-800 rounded-2xl min-h-[500px] text-center">
        {error.type === 'doc_legacy' ? (
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
            <FaFileWord className="text-blue-400 text-3xl" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
            <FaExclamationTriangle className="text-amber-400 text-3xl" />
          </div>
        )}
        <h3 className="text-base font-bold text-slate-100 mb-2">
          {error.type === 'doc_legacy' ? 'Document Word (.doc)' : 'Prévisualisation indisponible'}
        </h3>
        <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
          {error.message}
        </p>
        <a
          href={effectiveDownloadUrl}
          download
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all"
        >
          <FaDownload /> Télécharger le document
        </a>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 ${
      isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'w-full min-h-[650px]'
    }`}>
      {/* ── Toolbar supérieure ────────────────────────────────────── */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-white sticky top-0 z-10">
        {/* Left: Branding & Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-sm shrink-0">
            <FaFileWord className="text-lg" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-100 truncate max-w-xs sm:max-w-md" title={displayName}>
                {displayName}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                Lecteur Word local
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {docStats.words} mots · {docStats.chars} caractères · Lecture ~{docStats.readTime}
            </p>
          </div>
        </div>

        {/* Right: Controls (Zoom, Print, Download, Fullscreen) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-800/80 border border-slate-700/60 rounded-lg p-0.5 text-xs text-slate-300">
            <button
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-slate-700 rounded hover:text-white transition-colors"
              title="Zoom arrière"
            >
              <FaSearchMinus className="h-3 w-3" />
            </button>
            <span className="px-2 text-[11px] font-medium min-w-[42px] text-center">
              {zoomLevel}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-slate-700 rounded hover:text-white transition-colors"
              title="Zoom avant"
            >
              <FaSearchPlus className="h-3 w-3" />
            </button>
          </div>

          {/* Print button */}
          <button
            onClick={handlePrint}
            className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 rounded-lg text-xs transition-colors"
            title="Imprimer le document"
          >
            <FaPrint className="h-3.5 w-3.5" />
          </button>

          {/* Download button */}
          <a
            href={effectiveDownloadUrl}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow transition-colors"
            title="Télécharger le document"
          >
            <FaDownload className="h-3 w-3" />
            <span className="hidden sm:inline">Télécharger</span>
          </a>

          {/* Fullscreen button */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 rounded-lg text-xs transition-colors"
            title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
          >
            {isFullscreen ? <FaCompress className="h-3.5 w-3.5" /> : <FaExpand className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* ── Document Stage (Paper page) ────────────────────────────── */}
      <div className="flex-1 overflow-auto bg-slate-950 p-4 sm:p-8 md:p-12 flex justify-center items-start">
        <div
          ref={docContainerRef}
          style={{ zoom: `${zoomLevel}%` }}
          className="bg-white text-slate-900 shadow-2xl rounded-sm p-8 sm:p-12 md:p-16 max-w-4xl w-full min-h-[900px] border border-slate-200 transition-transform origin-top"
        >
          <div
            dangerouslySetInnerHTML={{ __html: htmlContent }}
            className="space-y-4 font-serif text-slate-850 leading-relaxed text-[15px]
              [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-slate-900 [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:font-sans
              [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-800 [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:font-sans
              [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-800 [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:font-sans
              [&_p]:mb-3 [&_p]:leading-relaxed
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_ul>li]:mb-1
              [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3 [&_ol>li]:mb-1
              [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_table]:border [&_table]:border-slate-300
              [&_td]:border [&_td]:border-slate-300 [&_td]:p-2.5 [&_td]:text-sm
              [&_th]:border [&_th]:border-slate-300 [&_th]:p-2.5 [&_th]:text-sm [&_th]:bg-slate-100 [&_th]:font-semibold
              [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:pl-4 [&_blockquote]:py-1 [&_blockquote]:italic [&_blockquote]:text-slate-600 [&_blockquote]:my-3
              [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded [&_img]:shadow-sm [&_img]:my-3 [&_img]:mx-auto [&_img]:block"
          />
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
