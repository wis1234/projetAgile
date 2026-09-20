import React, { useRef } from 'react';
import PullToRefresh from '@/Components/Mobile/PullToRefresh';

export default function MobilePageContainer({ children, fullBleed = false, hideHeader = false, hideBottomNav = false, refreshable }) {
  const ref = useRef(null);
  // Actualisation par glissement : activée sur les pages avec barre de navigation (listes, tableaux de bord…)
  const canRefresh = refreshable ?? !hideBottomNav;

  return (
    <>
      <PullToRefresh scrollRef={ref} enabled={canRefresh} />
      <main
        ref={ref}
        className={`w-full min-w-0 flex-1 flex flex-col overflow-y-auto overscroll-y-contain ${fullBleed ? '' : 'px-4'}`}
        style={{
          paddingTop: hideHeader ? 'var(--safe-top)' : 'calc(3.5rem + var(--safe-top))',
          paddingBottom: hideBottomNav ? 'var(--safe-bottom)' : 'calc(6rem + var(--safe-bottom))',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children}
      </main>
    </>
  );
}
