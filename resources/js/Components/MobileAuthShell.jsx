import React from 'react';

export default function MobileAuthShell({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="min-h-[100dvh] bg-slate-950 px-5 pb-8 pt-[calc(2rem+var(--safe-top))] text-white">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-md flex-col">
        <div className="mb-10 flex items-center gap-3">
          <img src="/logo-proja.png" alt="ProJA" className="h-11 w-11 rounded-xl bg-white object-contain p-1.5" />
          <div><p className="text-sm font-bold">ProJA</p><p className="text-[11px] text-slate-400">Gestion agile</p></div>
        </div>
        <div className="mb-7"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">{eyebrow}</p><h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1><p className="mt-2 text-sm leading-6 text-slate-400">{subtitle}</p></div>
        <div className="rounded-3xl bg-white p-5 text-slate-900 shadow-2xl shadow-black/20 dark:bg-slate-900 dark:text-white">{children}</div>
        {footer && <div className="mt-auto pt-7 text-center text-sm text-slate-400">{footer}</div>}
      </div>
    </div>
  );
}
