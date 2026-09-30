import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaMagic, FaTimes } from 'react-icons/fa';
import StickerCreatorModal from './StickerCreatorModal';

const resolveSrc = (p) => {
  if (!p) return null;
  if (p.startsWith('blob:') || p.startsWith('http')) return p;
  return `/storage/public/${p}`;
};
const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

/**
 * Pack de stickers partagé (même API que les pages Discussions) : envoyer, importer (image / GIF /
 * WebP animé / courte vidéo), CRÉER un sticker animé, et supprimer ses propres stickers.
 */
export default function StickerPack({ onSend, onError }) {
  const [stickers, setStickers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const inputRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/stickers', { headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' } });
      if (res.ok) setStickers(await res.json());
    } catch { /* silencieux */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      onError?.('Seules les images et les courtes vidéos peuvent devenir des stickers.');
      return;
    }
    if (file.size > 6 * 1024 * 1024) { onError?.('Fichier trop lourd (6 Mo max) — choisissez une vidéo plus courte.'); return; }
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/stickers', { method: 'POST', headers: { 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': csrf(), Accept: 'application/json' }, body: fd });
      if (!res.ok) {
        let msg = "Impossible d'ajouter ce sticker.";
        try { msg = (await res.json()).message || msg; } catch { /* ignore */ }
        throw new Error(msg);
      }
      const sticker = await res.json();
      setStickers((prev) => [sticker, ...prev]);
      onError?.('');
    } catch (err) { onError?.(err.message || "Impossible d'ajouter ce sticker."); }
  };

  const remove = async (e, sticker) => {
    e.stopPropagation();
    if (!window.confirm('Supprimer ce sticker du pack ?')) return;
    try {
      const res = await fetch(`/api/stickers/${sticker.id}`, { method: 'DELETE', headers: { 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': csrf(), Accept: 'application/json' } });
      if (res.ok) setStickers((prev) => prev.filter((s) => s.id !== sticker.id));
      else onError?.('Suppression impossible.');
    } catch { onError?.('Suppression impossible.'); }
  };

  return (
    <>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        <input type="file" ref={inputRef} onChange={upload} accept="image/*,video/mp4,video/webm,video/quicktime" className="hidden" />

        <button type="button" onClick={() => inputRef.current?.click()}
          className="aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <span className="text-2xl leading-none">＋</span>
          <span className="text-[9px] mt-1 font-medium text-center leading-tight">Importer<br />image/GIF/vidéo</span>
        </button>

        <button type="button" onClick={() => setCreatorOpen(true)}
          className="aspect-square rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-white flex flex-col items-center justify-center hover:opacity-90 transition-opacity shadow-sm">
          <FaMagic className="text-lg" />
          <span className="text-[9px] mt-1 font-semibold text-center leading-tight">Créer un<br />sticker animé</span>
        </button>

        {stickers.map((sticker) => (
          <div key={sticker.id} className="relative group">
            <button type="button" onClick={() => onSend?.(sticker)} title={sticker.name || 'Envoyer ce sticker'}
              className="w-full aspect-square rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 hover:scale-105 transition-transform">
              {sticker.type === 'video'
                ? <video src={resolveSrc(sticker.image_path)} className="w-full h-full object-contain p-1" autoPlay loop muted playsInline />
                : <img src={resolveSrc(sticker.image_path)} alt={sticker.name || 'Sticker'} className="w-full h-full object-contain p-1" loading="lazy" />}
            </button>
            {sticker.is_mine && (
              <button type="button" onClick={(e) => remove(e, sticker)} title="Supprimer mon sticker"
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <FaTimes className="text-[9px]" />
              </button>
            )}
          </div>
        ))}

        {!loading && stickers.length === 0 && (
          <p className="col-span-4 sm:col-span-6 text-xs text-gray-400 px-2 py-3 text-center leading-relaxed">
            Aucun sticker pour l'instant. Créez-en un animé avec « Créer », ou importez une image, un GIF ou une courte vidéo.
          </p>
        )}
      </div>

      <StickerCreatorModal open={creatorOpen} onClose={() => setCreatorOpen(false)}
        onCreated={(s) => setStickers((prev) => [s, ...prev])} />
    </>
  );
}
