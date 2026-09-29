import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Panneau déroulant rendu dans <body> (position: fixed) : il n'est donc jamais
 * coupé ni caché par un conteneur parent (overflow, z-index, zone d'écriture…).
 * Il s'ancre sur l'élément PARENT du composant (le <div className="relative"> du bouton).
 */
const DropdownPanel = ({ open, onClose, children, className = '' }) => {
  const markerRef = useRef(null);
  const panelRef = useRef(null);
  const [pos, setPos] = useState(null);

  const getAnchor = () => markerRef.current?.parentElement ?? null;

  useLayoutEffect(() => {
    if (!open) { setPos(null); return undefined; }

    const place = () => {
      const anchor = getAnchor();
      if (!anchor) return;
      const r = anchor.getBoundingClientRect();
      const pw = panelRef.current?.offsetWidth || 0;
      const ph = panelRef.current?.offsetHeight || 0;
      const left = Math.max(8, Math.min(r.left, window.innerWidth - pw - 8));
      let top = r.bottom + 4;
      if (top + ph > window.innerHeight - 8) top = Math.max(8, window.innerHeight - ph - 8);
      setPos({ top, left });
    };

    place();
    const raf = requestAnimationFrame(place);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const fn = (e) => {
      if (panelRef.current?.contains(e.target)) return;
      if (getAnchor()?.contains(e.target)) return; // le bouton gère lui-même l'ouverture/fermeture
      onClose();
    };
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', fn);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', fn);
      document.removeEventListener('keydown', esc);
    };
  }, [open, onClose]);

  return (
    <>
      <span ref={markerRef} className="hidden" aria-hidden="true" />
      {open && createPortal(
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: pos?.top ?? -9999, left: pos?.left ?? -9999, zIndex: 1000, maxHeight: 'calc(100vh - 16px)' }}
          className={`bg-white border border-gray-200 rounded-lg shadow-xl overflow-y-auto ${className}`}
        >
          {children}
        </div>,
        document.body
      )}
    </>
  );
};

export default DropdownPanel;
