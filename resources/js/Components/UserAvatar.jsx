import React, { useMemo, useState } from 'react';

const COLORS = ['bg-blue-600', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-pink-500'];

/** URL(s) candidates : l'URL fournie, puis la variante avec/sans « /storage/public/ » (selon la configuration du lien storage). */
const candidates = (user) => {
  const raw = user?.avatar || user?.profile_photo_url || user?.profile_photo_path;
  if (!raw || /ui-avatars\.com/.test(raw)) return [];
  const url = /^(https?:|data:|blob:|\/)/.test(raw) ? raw : `/storage/${String(raw).replace(/^\/+/, '')}`;
  const alt = url.includes('/storage/public/') ? url.replace('/storage/public/', '/storage/') : url.replace('/storage/', '/storage/public/');
  return alt !== url ? [url, alt] : [url];
};

/** Photo de profil, sinon initiales sur pastille colorée — jamais d'image cassée. */
export default function UserAvatar({ user, size = 40, className = '' }) {
  const list = useMemo(() => candidates(user), [user?.avatar, user?.profile_photo_url, user?.profile_photo_path]);
  const [i, setI] = useState(0);
  const style = { width: size, height: size, minWidth: size };
  const initials = (user?.name || '?').split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  if (i < list.length) {
    return <img src={list[i]} alt={user?.name || ''} style={style} onError={() => setI((n) => n + 1)} className={`rounded-full object-cover bg-gray-100 ${className}`} />;
  }
  return (
    <span title={user?.name} style={{ ...style, fontSize: Math.max(10, Math.round(size * 0.38)) }}
      className={`inline-flex select-none items-center justify-center rounded-full font-semibold text-white ${COLORS[(Number(user?.id) || 0) % COLORS.length]} ${className}`}>
      {initials}
    </span>
  );
}
