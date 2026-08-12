import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FaFileWord, FaSearch, FaDownload, FaExpand, FaCompress,
  FaPrint, FaEye, FaFileAlt, FaInfoCircle, FaSync
} from 'react-icons/fa';

const DocumentViewer = ({ fileUrl, fileName, fileType }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [textContent, setTextContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState('docs'); // 'docs' (JS parsed HTML) | 'embed' (MS Office / Google Docs Iframe)
  const docContainerRef = useRef(null);

  // Load and parse Word / Text Document
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const loadDocument = async () => {
      try {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error('Impossible d\'accéder au fichier document.');

        const isDocx = fileName?.toLowerCase().endsWith('.docx');
        const isTxtOrMd = fileName?.toLowerCase().endsWith('.txt') || fileName?.toLowerCase().endsWith('.md');

        if (isDocx) {
          // Dynamic import of mammoth.js for DOCX -> HTML conversion
          let mammothLib = window.mammoth;
          if (!mammothLib) {
            try {
              mammothLib = await import('mammoth');
            } catch (e) {
              console.warn('Mammoth.js non disponible, fallback vers le lecteur standard.', e);
            }
          }

          if (mammothLib) {
            const arrayBuffer = await response.arrayBuffer();
            const result = await mammothLib.convertToHtml({ arrayBuffer });
            
            if (isMounted) {
              setHtmlContent(result.value || '<p class="text-gray-500 italic">Document vide.</p>');
              // Strip HTML tags for word count
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = result.value;
              setTextContent(tempDiv.textContent || tempDiv.innerText || '');
              setLoading(false);
            }
          } else {
            // Fallback to embed mode if mammoth isn't loaded
            if (isMounted) {
              setViewMode('embed');
              setLoading(false);
            }
          }
        } else if (isTxtOrMd) {
          const text = await response.text();
          if (isMounted) {
            // Simple markdown-ish line formatting
            const formatted = text
              .split('\n')
              .map(line => `<p class="mb-3">${line.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`)
              .join('');
            setHtmlContent(formatted);
            setTextContent(text);
            setLoading(false);
          }
        } else {
          // Legacy .doc or other formats -> fallback to iframe view mode
          if (isMounted) {
            setViewMode('embed');
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Erreur de traitement du document:', err);
        if (isMounted) {
          setError('Erreur lors du traitement du document Word. Vous pouvez basculer vers l\'aperçu Office Viewer ou le télécharger.');
          setViewMode('embed');
          setLoading(false);
        }
      }
    };

    loadDocument();

    return () => {
      isMounted = false;
    };
  }, [fileUrl, fileName, fileType]);

  // Calculate statistics (word count, character count, reading time)
  const docStats = useMemo(() => {
    if (!textContent) return { words: 0, chars: 0, readTime: '0 min' };
    const cleanText = textContent.trim();
    const words = cleanText ? cleanText.split(/\s+/).length : 0;
    const chars = cleanText.length;
    const readTime = Math.max(1, Math.ceil(words / 200)) + ' min';
    return { words, chars, readTime };
  }, [textContent]);

  // Handle document printing
  const handlePrint = () => {
    if (!docContainerRef.current) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${fileName}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            h1, h2, h3 { color: #0f172a; margin-top: 1.5em; }
            table { width: 100%; border-collapse: collapse; margin: 1em 0; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; }
            img { max-width: 100%; height: auto; }
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-blue-50/50 dark:bg-slate-800/50 rounded-xl min-h-[400px]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <FaFileWord className="absolute inset-0 m-auto text-blue-600 text-xl animate-pulse" />
        </div>
        <p className="mt-4 text-blue-800 dark:text-blue-300 font-semibold text-sm">
          Chargement du document style Google Docs…
        </p>
        <p className="text-xs text-gray-500 mt-1">Rendu de la mise en page et des styles</p>
      </div>
    );
  }

  // Google Docs / MS Office iframe embed URL construct
  const encodedUrl = encodeURIComponent(window.location.origin + fileUrl);
  const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
  const googleDocsViewerUrl = `https://docs.google.com/gview?url=${encodedUrl}&embedded=true`;

  return (
    <div className={`flex flex-col bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700 ${
      isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'w-full min-h-[600px]'
    }`}>
      {/* ── Top Google Docs Header Toolbar ─────────────────────────── */}
      <div className="bg-slate-800 border-b border-slate-700 p-3 flex flex-wrap items-center justify-between gap-3 text-white">
        {/* Left: Branding & Info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
            <FaFileWord className="text-lg" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-100 truncate max-w-xs">{fileName}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-950 text-blue-400 border border-blue-700/50">
                Google Docs View
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {docStats.words} mots • {docStats.chars} caractères • Temps de lecture: ~{docStats.readTime}
            </p>
          </div>
        </div>

        {/* Center: Mode Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700 text-xs">
          <button
            onClick={() => setViewMode('docs')}
            className={`px-3 py-1 rounded font-medium transition-all ${
              viewMode === 'docs' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Rendu Interactif
          </button>
          <button
            onClick={() => setViewMode('embed')}
            className={`px-3 py-1 rounded font-medium transition-all ${
              viewMode === 'embed' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Vue Office Web
          </button>
        </div>

        {/* Right: Controls & Actions */}
        <div className="flex items-center gap-2">
          {viewMode === 'docs' && (
            <>
              <select
                value={zoomLevel}
                onChange={(e) => setZoomLevel(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded px-2 py-1 focus:outline-none"
              >
                <option value={75}>75%</option>
                <option value={100}>100%</option>
                <option value={125}>125%</option>
                <option value={150}>150%</option>
              </select>

              <button
                onClick={handlePrint}
                className="p-2 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
                title="Imprimer le document"
              >
                <FaPrint />
              </button>
            </>
          )}

          <a
            href={fileUrl}
            download
            className="p-2 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
            title="Télécharger le document"
          >
            <FaDownload />
          </a>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
            title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
          >
            {isFullscreen ? <FaCompress /> : <FaExpand />}
          </button>
        </div>
      </div>

      {/* ── Main Document View Stage ───────────────────────────────── */}
      <div className="flex-1 overflow-auto bg-slate-950 p-6 md:p-10 flex justify-center items-start">
        {viewMode === 'docs' ? (
          <div
            ref={docContainerRef}
            style={{ zoom: `${zoomLevel}%` }}
            className="bg-white text-slate-800 shadow-2xl rounded-sm p-10 md:p-16 max-w-4xl w-full min-h-[1056px] border border-slate-200 prose prose-slate max-w-none transition-all"
          >
            {/* Render HTML content with custom typography */}
            <div
              dangerouslySetInnerHTML={{ __html: htmlContent }}
              className="space-y-4 font-serif leading-relaxed text-base [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-slate-900 [&_h1]:mb-4 [&_h1]:mt-6 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-slate-800 [&_h2]:mb-3 [&_h2]:mt-5 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-slate-800 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_td]:border [&_td]:border-slate-300 [&_td]:p-2 [&_th]:border [&_th]:border-slate-300 [&_th]:p-2 [&_th]:bg-slate-100 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_img]:max-w-full [&_img]:rounded-lg [&_img]:mx-auto"
            />
          </div>
        ) : (
          <div className="w-full h-full min-h-[650px] bg-slate-900 flex flex-col rounded-lg overflow-hidden">
            <div className="p-2 bg-slate-800 border-b border-slate-700 text-xs text-slate-400 flex items-center justify-between">
              <span>Visionneuse Office / Google Docs (Intégrée)</span>
              <a
                href={googleDocsViewerUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline flex items-center gap-1"
              >
                Ouvrir dans une nouvelle fenêtre <FaEye />
              </a>
            </div>
            <iframe
              src={googleDocsViewerUrl}
              className="w-full flex-1 border-none min-h-[600px] bg-white"
              title="Office Web Viewer"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;
