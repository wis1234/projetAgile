import React from 'react';

const resolveSrc = (p) => {
  if (!p) return null;
  if (p.startsWith('blob:') || p.startsWith('http')) return p;
  return `/storage/public/${p}`;
};

/**
 * Sticker façon WhatsApp dans une discussion :
 *  - aucune bulle : le sticker « flotte » sur le fond de la conversation (fond transparent conservé) ;
 *  - grand format (≈ 176 px), animé en boucle (GIF / WebP / APNG animés et vidéos courtes) ;
 *  - l'heure (et l'état d'envoi) dans une petite pastille sombre translucide en bas à droite.
 */
export default function StickerMessage({
  imagePath, videoPath, time = '', isMe = false, pending = false, failed = false,
  onRetry = null, onOpen = null, compact = false,
}) {
  const img = resolveSrc(imagePath);
  const vid = resolveSrc(videoPath);
  const size = compact ? 'w-36 h-36 max-w-[48vw] max-h-[48vw]' : 'w-40 h-40 sm:w-44 sm:h-44';

  return (
    <div className={`relative inline-block select-none ${pending ? 'opacity-70' : ''} ${failed ? 'opacity-60' : ''}`}>
      {vid ? (
        <video
          src={vid}
          autoPlay
          loop
          muted
          playsInline
          className={`${size} object-contain pointer-events-none`}
          style={{ background: 'transparent' }}
        />
      ) : (
        <img
          src={img}
          alt="Sticker"
          loading="lazy"
          draggable={false}
          onClick={() => onOpen?.(img)}
          className={`${size} object-contain ${onOpen ? 'cursor-pointer' : ''}`}
          style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.10))' }}
        />
      )}

      <span className="absolute bottom-1 right-1 flex items-center gap-0.5 rounded-full bg-black/45 px-1.5 py-[1px] text-[10px] leading-4 text-white backdrop-blur-sm">
        {time}
        {isMe && (failed ? <span className="text-red-300">✕</span> : pending ? <span>⏳</span> : <span className="text-sky-300 font-bold">✓✓</span>)}
      </span>

      {failed && (
        <p className="mt-0.5 text-[11px] font-medium text-red-500">
          Échec de l'envoi.
          {onRetry && <button type="button" onClick={onRetry} className="ml-1 underline font-semibold">Réessayer</button>}
        </p>
      )}
    </div>
  );
}
