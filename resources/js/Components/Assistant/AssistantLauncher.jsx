import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { HiSparkles } from 'react-icons/hi2';
import AssistantPanel from './AssistantPanel';

/** Bouton flottant + panneau latéral de l'assistant (Ctrl/⌘ + J pour l'ouvrir). Monté une seule fois dans AdminLayout. */
export default function AssistantLauncher() {
  const { ai } = usePage().props;
  const [open, setOpen] = useState(false);
  const [everOpened, setEverOpened] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') { e.preventDefault(); setOpen((o) => !o); }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => { if (open) setEverOpened(true); }, [open]);

  if (!ai?.enabled) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir l'assistant IA"
        title="Assistant IA (Ctrl+J)"
        className={`fixed bottom-24 right-4 z-[44] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-2xl text-white shadow-xl shadow-blue-600/30 ring-4 ring-white/70 transition hover:scale-105 active:scale-95 dark:ring-slate-900/70 md:bottom-6 md:right-6 ${open ? 'pointer-events-none scale-0 opacity-0' : ''}`}
      >
        <HiSparkles />
      </button>

      {/* Fond (mobile) */}
      <div onClick={() => setOpen(false)} className={`fixed inset-0 z-[54] bg-black/40 transition-opacity md:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`} />

      <aside
        aria-hidden={!open}
        className={`fixed bottom-0 right-0 top-0 z-[55] w-full overflow-hidden bg-white shadow-2xl transition-transform duration-300 dark:bg-slate-900 sm:w-[420px] sm:border-l sm:border-slate-200 sm:dark:border-slate-700 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {everOpened && <AssistantPanel variant="drawer" active={open} onClose={() => setOpen(false)} />}
      </aside>
    </>
  );
}
