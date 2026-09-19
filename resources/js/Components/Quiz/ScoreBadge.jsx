import React from 'react';
import { FaClock } from 'react-icons/fa';

export const PASS_MARK = 50;

export const fmtNumber = (n, digits = 2) => {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '—';
  return Number(n).toLocaleString('fr-FR', { maximumFractionDigits: digits });
};

/**
 * Affiche une note en % ou « En attente » tant que des copies écrites ne sont pas corrigées.
 * Évite d'afficher un trompeur « 0 % ».
 */
export default function ScoreBadge({ score, pending = false, size = 'md', suffix = '%', label = 'En attente' }) {
  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-2xl px-4 py-2',
    xl: 'text-5xl',
  };

  if (pending) {
    if (size === 'xl') {
      return (
        <span className="inline-flex flex-col items-center gap-2 text-amber-600 dark:text-amber-400">
          <FaClock className="text-4xl" />
          <span className="text-2xl font-black">{label}</span>
          <span className="text-xs font-semibold uppercase tracking-wider">de correction</span>
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 ${sizes[size]}`}>
        <FaClock className="text-[0.85em]" /> {label}
      </span>
    );
  }

  if (score === null || score === undefined) {
    return <span className="text-gray-400">—</span>;
  }

  const tone = Number(score) >= PASS_MARK
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-red-600 dark:text-red-400';

  return (
    <span className={`font-black ${tone} ${size === 'xl' ? sizes.xl : size === 'lg' ? 'text-2xl' : sizes[size].split(' ')[0]}`}>
      {fmtNumber(score)}{suffix}
    </span>
  );
}
