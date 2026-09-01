import React from 'react';
import MobilePageShell from '@/Layouts/MobilePageShell';

export default function MobileSectionAdapter({ PageComponent, pageName, ...pageProps }) {
  return (
    <MobilePageShell pageName={pageName} showContextBar={!pageName.endsWith('/Index')}>
      <PageComponent {...pageProps} />
    </MobilePageShell>
  );
}
