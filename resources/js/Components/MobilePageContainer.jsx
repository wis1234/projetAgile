import React from 'react';

export default function MobilePageContainer({ children, fullBleed = false, hideHeader = false, hideBottomNav = false }) {
  return (
    <main
      className={`w-full min-w-0 flex-1 touch-pan-y ${fullBleed ? '' : 'px-4'}`}
      style={{
        paddingTop: hideHeader ? 'var(--safe-top)' : 'calc(3.5rem + var(--safe-top))',
        paddingBottom: hideBottomNav ? 'var(--safe-bottom)' : 'calc(4.5rem + var(--safe-bottom))',
      }}
    >
      {children}
    </main>
  );
}
