import React, { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { nativeFeedback } from '@/lib/platform';

const THRESHOLD = 72;

/**
 * « Tirer pour actualiser » : recharge les données de la page (formulaires et défilement conservés).
 * Ne se déclenche que si la page est tout en haut et que le geste est nettement vertical.
 */
export default function PullToRefresh({ scrollRef, enabled = true }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const state = useRef({ startY: 0, startX: 0, active: false });

  useEffect(() => {
    const el = scrollRef?.current;
    if (!el || !enabled) return undefined;

    const onStart = (e) => {
      if (el.scrollTop > 0 || e.target.closest('[data-no-ptr], input, textarea, select')) return;
      state.current = { startY: e.touches[0].clientY, startX: e.touches[0].clientX, active: true };
    };
    const onMove = (e) => {
      const s = state.current;
      if (!s.active || refreshing) return;
      const dy = e.touches[0].clientY - s.startY;
      const dx = Math.abs(e.touches[0].clientX - s.startX);
      if (dy <= 0 || dx > dy) { s.active = false; setPull(0); return; }
      setPull(Math.min(dy * 0.5, 96));
    };
    const onEnd = () => {
      const s = state.current;
      if (!s.active) return;
      s.active = false;
      setPull((p) => {
        if (p >= THRESHOLD / 1.5 && !refreshing) {
          setRefreshing(true);
          try { nativeFeedback.tap?.(); } catch { /* web */ }
          router.reload({ preserveScroll: true, onFinish: () => setRefreshing(false) });
          return 44;
        }
        return 0;
      });
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: true });
    el.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
    };
  }, [scrollRef, enabled, refreshing]);

  useEffect(() => { if (!refreshing) setPull(0); }, [refreshing]);

  if (!enabled || (pull === 0 && !refreshing)) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 z-30 flex justify-center" style={{ top: 'calc(3.5rem + var(--safe-top))' }}>
      <div
        className="mt-2 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"
        style={{ transform: `translateY(${pull * 0.6}px) rotate(${pull * 4}deg)`, opacity: Math.min(1, pull / 40) }}
      >
        <svg className={`h-5 w-5 text-blue-600 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M5.6 15A8 8 0 0 0 20 12M18.4 9A8 8 0 0 0 4 12" />
        </svg>
      </div>
    </div>
  );
}
