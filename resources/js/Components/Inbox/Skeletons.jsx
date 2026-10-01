import React from 'react';

/** Lignes fantômes (shimmer) : affichées pendant le chargement progressif d'une liste. */
export function ListSkeleton({ rows = 6 }) {
  return (
    <ul className="animate-pulse divide-y divide-slate-100 dark:divide-slate-800" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 px-4 py-3.5">
          <span className="h-12 w-12 flex-shrink-0 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex justify-between gap-6">
              <span className="h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
              <span className="h-2.5 w-10 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
            <span className="block h-2.5 rounded bg-slate-100 dark:bg-slate-800" style={{ width: `${55 + ((i * 17) % 35)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Bulles fantômes en haut du fil quand on remonte l'historique. */
export function BubbleSkeleton() {
  return (
    <div className="animate-pulse space-y-3 px-4 py-3" aria-hidden="true">
      {[['w-48', false], ['w-32', true], ['w-56', false]].map(([w, right], i) => (
        <div key={i} className={`flex ${right ? 'justify-end' : ''}`}>
          <span className={`h-9 ${w} rounded-2xl bg-white/70 dark:bg-slate-800`} />
        </div>
      ))}
    </div>
  );
}

export function Spinner({ className = 'h-5 w-5' }) {
  return <span className={`inline-block animate-spin rounded-full border-2 border-blue-500 border-t-transparent ${className}`} />;
}
