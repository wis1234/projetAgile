/**
 * Rendu d'une image (frame) de sticker animé sur un contexte canvas 2D.
 * Fonction pure (aucune dépendance au DOM) : t ∈ [0,1[ = position dans la boucle d'animation.
 */

export const ANIMATIONS = [
  { id: 'bounce',  label: 'Rebond',       icon: '⤴️' },
  { id: 'shake',   label: 'Secousse',     icon: '📳' },
  { id: 'pulse',   label: 'Pulsation',    icon: '💓' },
  { id: 'spin',    label: 'Rotation',     icon: '🔄' },
  { id: 'wiggle',  label: 'Balancement',  icon: '🎶' },
  { id: 'float',   label: 'Flottement',   icon: '🎈' },
  { id: 'zoom',    label: 'Zoom',         icon: '🔍' },
  { id: 'blink',   label: 'Clignotement', icon: '✨' },
  { id: 'tada',    label: 'Tada',         icon: '🎉' },
];

const TAU = Math.PI * 2;
const ease = (x) => 0.5 - 0.5 * Math.cos(Math.PI * x);

/** Transformation (décalage, échelle, rotation, opacité) à l'instant t. Toujours périodique : boucle parfaite. */
export function animationTransform(id, t) {
  const s = Math.sin(t * TAU);
  switch (id) {
    case 'bounce': {
      const b = Math.abs(Math.sin(t * Math.PI * 2 * 1));      // deux rebonds par boucle
      return { dy: -b * 0.22, sx: 1 + (1 - b) * 0.08, sy: 1 - (1 - b) * 0.08, rot: 0, alpha: 1 };
    }
    case 'shake':   return { dx: Math.sin(t * TAU * 6) * 0.07, rot: Math.sin(t * TAU * 6) * 0.06, alpha: 1 };
    case 'pulse': {
      const p = 1 + 0.14 * Math.sin(t * TAU);
      return { sx: p, sy: p, alpha: 1 };
    }
    case 'spin':    return { rot: ease(t) * TAU, alpha: 1 };
    case 'wiggle':  return { rot: Math.sin(t * TAU) * 0.22, alpha: 1 };
    case 'float':   return { dy: s * 0.07, dx: Math.cos(t * TAU) * 0.03, rot: s * 0.03, alpha: 1 };
    case 'zoom': {
      const z = 0.82 + 0.3 * ease(t < 0.5 ? t * 2 : 2 - t * 2);
      return { sx: z, sy: z, alpha: 1 };
    }
    case 'blink':   return { alpha: 0.35 + 0.65 * (0.5 + 0.5 * Math.cos(t * TAU)) };
    case 'tada': {
      const k = t < 0.5 ? t / 0.5 : 0;
      const sc = t < 0.5 ? 1 + 0.18 * Math.sin(k * Math.PI) : 1;
      const r = t < 0.5 ? Math.sin(k * TAU * 2) * 0.16 * Math.sin(k * Math.PI) : 0;
      return { sx: sc, sy: sc, rot: r, alpha: 1 };
    }
    default: return { alpha: 1 };
  }
}

/**
 * @param ctx   contexte 2D (canvas DOM ou OffscreenCanvas)
 * @param size  côté du sticker en pixels
 * @param t     position dans la boucle (0 ≤ t < 1)
 * @param opts  { source: {kind:'emoji'|'text'|'image', value, image?, color?, outline?, bold?},
 *                animation: id, background: null | '#rrggbb' }
 */
export function renderStickerFrame(ctx, size, t, opts) {
  const { source, animation = 'bounce', background = null } = opts;
  ctx.clearRect(0, 0, size, size);

  if (background) {
    const r = size * 0.18;
    ctx.fillStyle = background;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.arcTo(size, 0, size, size, r);
    ctx.arcTo(size, size, 0, size, r);
    ctx.arcTo(0, size, 0, 0, r);
    ctx.arcTo(0, 0, size, 0, r);
    ctx.closePath();
    ctx.fill();
  }

  const a = { dx: 0, dy: 0, sx: 1, sy: 1, rot: 0, alpha: 1, ...animationTransform(animation, t) };
  ctx.save();
  ctx.globalAlpha = a.alpha;
  ctx.translate(size / 2 + a.dx * size, size / 2 + a.dy * size);
  ctx.rotate(a.rot);
  ctx.scale(a.sx, a.sy);

  const pad = background ? 0.14 : 0.06;
  const box = size * (1 - pad * 2);

  if (source.kind === 'image' && source.image) {
    const img = source.image;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const k = Math.min(box / iw, box / ih);
    ctx.drawImage(img, (-iw * k) / 2, (-ih * k) / 2, iw * k, ih * k);
  } else {
    const value = String(source.value || '').trim() || '😀';
    const isEmoji = source.kind === 'emoji';
    const lines = value.split('\n').slice(0, 4);
    const family = isEmoji
      ? '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'
      : '"Arial Black","Impact","Helvetica Neue",Arial,sans-serif';
    let fs = isEmoji ? box * 0.86 : box * 0.42;
    const setFont = () => { ctx.font = `${isEmoji || source.bold !== false ? '900 ' : ''}${fs}px ${family}`; };
    setFont();
    // Réduit la taille pour que le texte tienne dans le cadre
    const widest = () => Math.max(...lines.map((l) => ctx.measureText(l).width));
    while (widest() > box && fs > 10) { fs *= 0.93; setFont(); }
    while (!isEmoji && lines.length * fs * 1.1 > box && fs > 10) { fs *= 0.93; setFont(); }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lh = fs * 1.08;
    lines.forEach((line, i) => {
      const y = (i - (lines.length - 1) / 2) * lh;
      if (!isEmoji && source.outline !== false) {
        ctx.lineJoin = 'round';
        ctx.lineWidth = Math.max(4, fs * 0.16);
        ctx.strokeStyle = source.outlineColor || '#ffffff';
        ctx.strokeText(line, 0, y);
      }
      ctx.fillStyle = source.color || '#111827';
      ctx.fillText(line, 0, y);
    });
  }
  ctx.restore();
}

/**
 * Génère toutes les images de la boucle.
 * @returns {Uint8ClampedArray[]} pixels RGBA de chaque image
 */
export function renderAllFrames(makeCanvas, size, frameCount, opts) {
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const frames = [];
  for (let i = 0; i < frameCount; i++) {
    renderStickerFrame(ctx, size, i / frameCount, opts);
    frames.push(new Uint8ClampedArray(ctx.getImageData(0, 0, size, size).data));
  }
  return frames;
}
