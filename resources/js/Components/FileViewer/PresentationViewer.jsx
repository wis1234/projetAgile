import React, { useState, useEffect, useMemo } from 'react';
import {
  FaFilePowerpoint, FaPlay, FaChevronLeft, FaChevronRight,
  FaExpand, FaCompress, FaDownload, FaEye, FaDesktop, FaList
} from 'react-icons/fa';

const PresentationViewer = ({ fileUrl, fileName }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [slides, setSlides] = useState([]);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [viewMode, setViewMode] = useState('slides'); // 'slides' | 'embed'

  // Extract slides from PPTX package or generate slide structure
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const loadPresentation = async () => {
      try {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error('Impossible de charger la présentation.');

        let JSZipLib = window.JSZip;
        if (!JSZipLib) {
          try {
            JSZipLib = (await import('jszip')).default;
          } catch (e) {
            console.warn('JSZip non disponible.', e);
          }
        }

        if (JSZipLib && fileName?.toLowerCase().endsWith('.pptx')) {
          const arrayBuffer = await response.arrayBuffer();
          const zip = await JSZipLib.loadAsync(arrayBuffer);

          // Find slide files in ppt/slides/
          const slideFiles = Object.keys(zip.files).filter(path =>
            path.startsWith('ppt/slides/slide') && path.endsWith('.xml')
          );

          // Sort slides by number slide1.xml, slide2.xml...
          slideFiles.sort((a, b) => {
            const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
            const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
            return numA - numB;
          });

          const extractedSlides = [];

          for (let i = 0; i < slideFiles.length; i++) {
            const xmlText = await zip.files[slideFiles[i]].async('string');
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

            // Extract text nodes <a:t>
            const textNodes = Array.from(xmlDoc.getElementsByTagName('a:t')).map(node => node.textContent);

            const titleNode = textNodes.length > 0 ? textNodes[0] : `Diapositive ${i + 1}`;
            const bodyTexts = textNodes.slice(1);

            extractedSlides.push({
              id: i + 1,
              title: titleNode,
              paragraphs: bodyTexts,
              rawText: textNodes.join(' ')
            });
          }

          if (isMounted) {
            if (extractedSlides.length > 0) {
              setSlides(extractedSlides);
            } else {
              // Fallback
              setSlides([{ id: 1, title: fileName, paragraphs: ['Présentation sans diapositive lisible.'] }]);
            }
            setLoading(false);
          }
        } else {
          // Fallback view mode
          if (isMounted) {
            setViewMode('embed');
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Erreur PPTX:', err);
        if (isMounted) {
          setViewMode('embed');
          setLoading(false);
        }
      }
    };

    loadPresentation();

    return () => {
      isMounted = false;
    };
  }, [fileUrl, fileName]);

  // Slide navigation
  const prevSlide = () => setActiveSlideIdx(prev => Math.max(0, prev - 1));
  const nextSlide = () => setActiveSlideIdx(prev => Math.min(slides.length - 1, prev + 1));

  // Keyboard arrow keys navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (viewMode !== 'slides') return;
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'Escape') {
        setIsSlideshow(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length, viewMode]);

  const activeSlide = slides[activeSlideIdx] || { title: fileName, paragraphs: [] };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-amber-50/50 dark:bg-slate-800/50 rounded-xl min-h-[400px]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
          <FaFilePowerpoint className="absolute inset-0 m-auto text-amber-600 text-xl animate-pulse" />
        </div>
        <p className="mt-4 text-amber-800 dark:text-amber-300 font-semibold text-sm">
          Chargement de la présentation style Google Slides…
        </p>
        <p className="text-xs text-gray-500 mt-1">Extraction des diapositives en cours</p>
      </div>
    );
  }

  const encodedUrl = encodeURIComponent(window.location.origin + fileUrl);
  const googleDocsViewerUrl = `https://docs.google.com/gview?url=${encodedUrl}&embedded=true`;

  return (
    <div className={`flex flex-col bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700 ${
      isFullscreen || isSlideshow ? 'fixed inset-0 z-50 rounded-none bg-black' : 'w-full min-h-[550px]'
    }`}>
      {/* ── Top Header Toolbar ─────────────────────────────────────── */}
      {!isSlideshow && (
        <div className="bg-slate-800 border-b border-slate-700 p-3 flex flex-wrap items-center justify-between gap-3 text-white">
          {/* Left: Branding */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white shadow-md">
              <FaFilePowerpoint className="text-lg" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-100 truncate max-w-xs">{fileName}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-950 text-orange-400 border border-orange-700/50">
                  Google Slides View
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {slides.length > 0 ? `${slides.length} diapositives` : 'Présentation'}
              </p>
            </div>
          </div>

          {/* Center: Mode Tabs */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700 text-xs">
            <button
              onClick={() => setViewMode('slides')}
              className={`px-3 py-1 rounded font-medium transition-all ${
                viewMode === 'slides' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Diaporamas Interactif
            </button>
            <button
              onClick={() => setViewMode('embed')}
              className={`px-3 py-1 rounded font-medium transition-all ${
                viewMode === 'embed' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Aperçu HD Office
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {viewMode === 'slides' && (
              <button
                onClick={() => setIsSlideshow(true)}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition-colors"
              >
                <FaPlay className="text-[10px]" /> Lancer la présentation
              </button>
            )}

            <a
              href={fileUrl}
              download
              className="p-2 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
              title="Télécharger"
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
      )}

      {/* ── Main Stage ──────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden bg-slate-950 relative">
        {viewMode === 'slides' ? (
          <>
            {/* Left: Thumbnail Sidebar (Google Slides Style) */}
            {!isSlideshow && (
              <div className="w-56 border-r border-slate-800 bg-slate-900 p-3 overflow-y-auto hidden sm:flex flex-col gap-2.5">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <FaList className="text-[10px]" /> Diapositives ({slides.length})
                </div>
                {slides.map((slide, idx) => {
                  const isActive = idx === activeSlideIdx;
                  return (
                    <button
                      key={slide.id}
                      onClick={() => setActiveSlideIdx(idx)}
                      className={`p-2.5 rounded-lg text-left transition-all border ${
                        isActive
                          ? 'bg-slate-800 text-orange-400 border-orange-500 shadow-md ring-1 ring-orange-500/50'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                        <span>#{idx + 1}</span>
                      </div>
                      <div className="text-xs font-semibold truncate text-slate-200">{slide.title}</div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Center: Slide Preview Canvas */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden bg-slate-950">
              {/* Slide Card Container (16:9 aspect ratio) */}
              <div className="w-full max-w-4xl aspect-[16/9] bg-white rounded-xl shadow-2xl border border-slate-700 p-8 sm:p-12 flex flex-col justify-between text-slate-900 relative overflow-hidden transition-all transform duration-300">
                {/* Background watermark icon */}
                <FaFilePowerpoint className="absolute -right-10 -bottom-10 text-9xl text-slate-100/60 pointer-events-none" />

                {/* Slide Title */}
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 border-b-2 border-orange-500 pb-3 mb-6">
                    {activeSlide.title}
                  </h2>

                  {/* Slide Paragraphs */}
                  <div className="space-y-3 text-slate-700 font-sans text-sm sm:text-base leading-relaxed">
                    {activeSlide.paragraphs && activeSlide.paragraphs.length > 0 ? (
                      activeSlide.paragraphs.map((pText, idx) => (
                        <p key={idx} className="flex items-start gap-2">
                          <span className="text-orange-500 font-bold mt-1">•</span>
                          <span>{pText}</span>
                        </p>
                      ))
                    ) : (
                      <p className="text-slate-400 italic text-sm">Contenu de la diapositive</p>
                    )}
                  </div>
                </div>

                {/* Slide Footer */}
                <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-xs text-slate-400">
                  <span>{fileName}</span>
                  <span className="font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                    Diapositive {activeSlideIdx + 1} / {slides.length}
                  </span>
                </div>
              </div>

              {/* Navigation Controls Bar */}
              <div className="mt-6 flex items-center gap-4 bg-slate-900/90 px-4 py-2 rounded-full border border-slate-700 shadow-lg text-white">
                <button
                  onClick={prevSlide}
                  disabled={activeSlideIdx === 0}
                  className="p-2 hover:bg-slate-800 disabled:opacity-30 rounded-full transition-colors"
                  title="Diapositive précédente (Flèche gauche)"
                >
                  <FaChevronLeft />
                </button>
                <span className="text-xs font-bold text-slate-300">
                  {activeSlideIdx + 1} / {slides.length}
                </span>
                <button
                  onClick={nextSlide}
                  disabled={activeSlideIdx === slides.length - 1}
                  className="p-2 hover:bg-slate-800 disabled:opacity-30 rounded-full transition-colors"
                  title="Diapositive suivante (Flèche droite)"
                >
                  <FaChevronRight />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full min-h-[600px] bg-slate-900 flex flex-col">
            <iframe
              src={googleDocsViewerUrl}
              className="w-full flex-1 border-none min-h-[600px] bg-white"
              title="Office Presentation Viewer"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PresentationViewer;
