import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FaTimes, FaMagic, FaSpinner } from 'react-icons/fa';
import { encodeAPNG } from '@/lib/apng';
import { ANIMATIONS, renderStickerFrame, renderAllFrames } from './stickerRender';

const QUICK_EMOJIS = ['😀','😂','🥰','😎','🤩','😭','😡','🥳','👍','👏','🙏','💪','🔥','❤️','🎉','💯','✅','🚀','⭐','🎯','💡','☕','🍕','🐱'];
const TEXT_COLORS = ['#111827', '#ffffff', '#e11d48', '#ea580c', '#ca8a04', '#16a34a', '#2563eb', '#9333ea'];
const BG_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7', '#14b8a6', '#111827', '#ec4899'];
const FPS = 20;

const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
const makeCanvas = (s) => { const c = document.createElement('canvas'); c.width = s; c.height = s; return c; };

/**
 * Créateur de stickers ANIMÉS : on choisit un émoji, un texte ou une image, puis un mouvement
 * (rebond, secousse, pulsation, rotation…). Le résultat est un PNG animé (APNG) à fond transparent,
 * ajouté au pack partagé de l'équipe — il s'affiche en boucle dans toutes les discussions.
 */
export default function StickerCreatorModal({ open, onClose, onCreated }) {
  const [kind, setKind] = useState('emoji');            // emoji | text | image
  const [emoji, setEmoji] = useState('🔥');
  const [text, setText] = useState('BRAVO !');
  const [color, setColor] = useState('#e11d48');
  const [image, setImage] = useState(null);
  const [animation, setAnimation] = useState('bounce');
  const [duration, setDuration] = useState(1.2);
  const [withBg, setWithBg] = useState(false);
  const [bgColor, setBgColor] = useState('#22c55e');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef(null);
  const fileRef = useRef(null);

  const opts = useMemo(() => ({
    source: kind === 'emoji' ? { kind: 'emoji', value: emoji }
      : kind === 'text' ? { kind: 'text', value: text, color, outlineColor: color === '#ffffff' ? '#1f2937' : '#ffffff' }
      : { kind: 'image', image },
    animation,
    background: withBg ? bgColor : null,
  }), [kind, emoji, text, color, image, animation, withBg, bgColor]);

  // Aperçu animé en direct
  useEffect(() => {
    if (!open) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let raf;
    const start = performance.now();
    const loop = (now) => {
      const t = (((now - start) / 1000) / duration) % 1;
      renderStickerFrame(ctx, canvas.width, t, opts);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [open, opts, duration]);

  useEffect(() => { if (open) { setError(''); setBusy(false); } }, [open]);

  if (!open) return null;

  const pickImage = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!f.type.startsWith('image/')) { setError('Choisissez une image (PNG, JPG, WebP…).'); return; }
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => { setImage(img); setKind('image'); setError(''); };
    img.onerror = () => setError("Impossible de lire cette image.");
    img.src = url;
  };

  const upload = async (png) => {
    const fd = new FormData();
    fd.append('image', new File([png], 'sticker.png', { type: 'image/png' }));
    if (name.trim()) fd.append('name', name.trim().slice(0, 50));
    const res = await fetch('/api/stickers', {
      method: 'POST',
      headers: { 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': csrf(), Accept: 'application/json' },
      body: fd,
    });
    if (!res.ok) {
      let msg = "Impossible d'ajouter ce sticker.";
      try { const d = await res.json(); msg = d.message || msg; } catch { /* ignore */ }
      throw new Error(msg);
    }
    return res.json();
  };

  const create = async () => {
    if (kind === 'image' && !image) { setError('Choisissez d’abord une image.'); return; }
    if (kind === 'text' && !text.trim()) { setError('Saisissez un texte.'); return; }
    setBusy(true);
    setError('');
    try {
      await new Promise((r) => setTimeout(r, 30)); // laisse l'interface afficher « Création… »
      const frameCount = Math.max(8, Math.round(duration * FPS));
      let size = 256;
      let png = encodeAPNG(renderAllFrames(makeCanvas, size, frameCount, opts), size, size, 1000 / FPS);
      if (png.length > 5.5 * 1024 * 1024) { // trop lourd pour le serveur (6 Mo) : on réduit
        size = 192;
        png = encodeAPNG(renderAllFrames(makeCanvas, size, frameCount, opts), size, size, 1000 / FPS);
      }
      const sticker = await upload(png);
      onCreated?.(sticker);
      onClose?.();
    } catch (err) {
      setError(err.message || 'Création impossible.');
    } finally {
      setBusy(false);
    }
  };

  const Swatches = ({ colors, value, onPick }) => (
    <div className="flex flex-wrap gap-1.5">
      {colors.map((c) => (
        <button key={c} type="button" onClick={() => onPick(c)} aria-label={c}
          className={`w-6 h-6 rounded-full border-2 transition-transform ${value === c ? 'border-blue-600 scale-110' : 'border-gray-300'}`}
          style={{ background: c }} />
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[1200] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 w-full sm:max-w-lg max-h-[94vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <h3 className="flex items-center gap-2 text-[15px] font-semibold text-gray-900 dark:text-white">
            <FaMagic className="text-blue-500" /> Créer un sticker animé
          </h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
            <FaTimes />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Aperçu (damier = transparence) */}
          <div className="mx-auto w-44 h-44 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-600"
            style={{ backgroundImage: 'conic-gradient(#e5e7eb 25%, #fff 0 50%, #e5e7eb 0 75%, #fff 0)', backgroundSize: '16px 16px' }}>
            <canvas ref={canvasRef} width={256} height={256} className="w-full h-full" />
          </div>

          {/* Contenu */}
          <div>
            <div className="flex gap-2 mb-2">
              {[['emoji', 'Émoji'], ['text', 'Texte'], ['image', 'Image']].map(([k, l]) => (
                <button key={k} type="button" onClick={() => setKind(k)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${kind === k ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                  {l}
                </button>
              ))}
            </div>

            {kind === 'emoji' && (
              <div className="grid grid-cols-8 gap-1">
                {QUICK_EMOJIS.map((e) => (
                  <button key={e} type="button" onClick={() => setEmoji(e)}
                    className={`text-2xl p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${emoji === e ? 'bg-blue-50 dark:bg-blue-900/40 ring-2 ring-blue-500' : ''}`}>
                    {e}
                  </button>
                ))}
                <input value={emoji} onChange={(e) => setEmoji([...e.target.value].slice(-2).join(''))}
                  className="col-span-8 mt-1 text-center text-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg py-1"
                  placeholder="Ou tapez un émoji" />
              </div>
            )}

            {kind === 'text' && (
              <div className="space-y-2">
                <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 60))} rows={2}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 resize-none"
                  placeholder="Votre texte (2 lignes max.)" />
                <Swatches colors={TEXT_COLORS} value={color} onPick={setColor} />
              </div>
            )}

            {kind === 'image' && (
              <div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickImage} />
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full py-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700">
                  {image ? 'Changer d’image' : '＋ Choisir une image (un PNG transparent donne le meilleur rendu)'}
                </button>
              </div>
            )}
          </div>

          {/* Mouvement */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Mouvement</p>
            <div className="grid grid-cols-3 gap-1.5">
              {ANIMATIONS.map((a) => (
                <button key={a.id} type="button" onClick={() => setAnimation(a.id)}
                  className={`flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg border ${
                    animation === a.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:bg-gray-50'}`}>
                  <span>{a.icon}</span>{a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Vitesse + fond */}
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400">
              Vitesse
              <input type="range" min="0.6" max="2.4" step="0.1" value={3 - duration}
                onChange={(e) => setDuration(3 - Number(e.target.value))} className="w-full mt-1" />
            </label>
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 cursor-pointer">
                <input type="checkbox" checked={withBg} onChange={(e) => setWithBg(e.target.checked)} /> Fond coloré arrondi
              </label>
              {withBg && <div className="mt-1.5"><Swatches colors={BG_COLORS} value={bgColor} onPick={setBgColor} /></div>}
            </div>
          </div>

          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={50}
            placeholder="Nom du sticker (facultatif)"
            className="w-full text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2" />

          {error && <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/30 rounded-lg px-3 py-2">{error}</p>}

          <p className="text-[11px] text-gray-400 leading-relaxed">
            Astuce : avec le bouton ＋ du pack, vous pouvez aussi importer un GIF, un WebP animé ou une courte vidéo.
          </p>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} disabled={busy}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
              Annuler
            </button>
            <button type="button" onClick={create} disabled={busy}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
              {busy ? <FaSpinner className="animate-spin" /> : <FaMagic />}
              {busy ? 'Création…' : 'Créer le sticker'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
