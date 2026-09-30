import React, { useEffect, useRef, useState } from 'react';
import { loadApng } from '@/lib/apngDecode';

/**
 * Affiche une image ; si c'est un APNG (sticker animé créé dans l'app), l'anime en boucle sur un canvas.
 * Repli automatique sur <img> pour tout autre format (GIF, WebP animé… déjà lus nativement).
 */
export default function AnimatedImage({ src, className = '', style, alt = 'Sticker', onClick, loading = 'lazy' }) {
  const canvasRef = useRef(null);
  const [anim, setAnim] = useState(null);

  useEffect(() => {
    let alive = true;
    setAnim(null);
    if (src && !src.startsWith('blob:') && /\.png(\?|$)/i.test(src)) {
      loadApng(src).then((a) => { if (alive && a) setAnim(a); });
    }
    return () => { alive = false; };
  }, [src]);

  useEffect(() => {
    if (!anim || !canvasRef.current) return undefined;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let i = 0, timer;
    const tick = () => {
      const f = anim.frames[i];
      if (f.dispose === 1 || i === 0) ctx.clearRect(0, 0, anim.w, anim.h);
      if (f.blend === 0) ctx.clearRect(f.x, f.y, f.canvas.width, f.canvas.height);
      ctx.drawImage(f.canvas, f.x, f.y);
      i = (i + 1) % anim.frames.length;
      timer = setTimeout(tick, f.delay);
    };
    tick();
    return () => clearTimeout(timer);
  }, [anim]);

  if (anim) {
    return <canvas ref={canvasRef} width={anim.w} height={anim.h} className={className} style={style} onClick={onClick} role="img" aria-label={alt} />;
  }
  return <img src={src} alt={alt} loading={loading} draggable={false} className={className} style={style} onClick={onClick} />;
}
