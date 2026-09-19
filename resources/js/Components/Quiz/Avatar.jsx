import React, { useState } from 'react';

const COLORS = [
  'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-emerald-500',
  'bg-rose-500', 'bg-amber-500', 'bg-cyan-500', 'bg-teal-500',
];

const SIZES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
};

export const initialsOf = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '?';

/** Photo de profil avec repli sur les initiales (image absente ou en erreur). */
export default function Avatar({ name, src, size = 'md', className = '', ring = '' }) {
  const [failed, setFailed] = useState(false);
  const color = COLORS[(name || '?').charCodeAt(0) % COLORS.length];
  const isPlaceholder = src && src.includes('ui-avatars.com');

  if (src && !failed && !isPlaceholder) {
    return (
      <img
        src={src}
        alt={name}
        title={name}
        onError={() => setFailed(true)}
        className={`${SIZES[size]} rounded-full object-cover flex-shrink-0 ${ring} ${className}`}
      />
    );
  }

  return (
    <span
      title={name}
      className={`${SIZES[size]} ${color} rounded-full text-white font-bold inline-flex items-center justify-center flex-shrink-0 ${ring} ${className}`}
    >
      {initialsOf(name)}
    </span>
  );
}
