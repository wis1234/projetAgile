import React from 'react';
import MobilePageShell from '@/Layouts/MobilePageShell';

export default function MobilePageFallback({ PageComponent, pageName, ...pageProps }) {
  return (
    <MobilePageShell pageName={pageName} showContextBar>
      <PageComponent {...pageProps} />
    </MobilePageShell>
  );
}
