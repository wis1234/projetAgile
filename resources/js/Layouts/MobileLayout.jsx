import React, { useEffect, useRef, useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import MobileBottomNav from '@/Components/MobileBottomNav';
import PushNotificationManager from '@/Components/PushNotificationManager';
import ErrorBoundary from '@/Components/ErrorBoundary';
import Notification from '@/Components/Notification';
import { nativeFeedback } from '@/lib/platform';
import MobileHeader from '@/Components/MobileHeader';
import MobilePageContainer from '@/Components/MobilePageContainer';

/**
 * Shell natif pour l'app Capacitor : header léger + contenu + barre basse.
 * N'affiche jamais la sidebar/le burger/la recherche desktop d'AdminLayout.
 *
 * Props:
 * - title / subtitle       : affichés dans le header
 * - onBack / backHref      : si fourni, affiche une flèche retour ; sinon un espace vide
 * - headerRight            : contenu additionnel à droite du header (icône, bouton...)
 * - hideHeader             : masque complètement le header (pages plein écran custom)
 * - hideBottomNav          : masque la barre de navigation basse (ex: pages de chat)
 * - fullBleed              : supprime le padding horizontal du contenu
 * - onMoreClick            : callback du bouton "Plus" de la barre basse (défaut: /more)
 */
export default function MobileLayout({
  children,
  title,
  subtitle,
  onBack,
  backHref,
  headerRight = null,
  hideHeader = false,
  hideBottomNav = false,
  fullBleed = false,
  onMoreClick,
}) {
  const { flash = {} } = usePage().props;
  const touchStartY = useRef(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const handleTouchStart = (event) => {
      if (window.scrollY === 0) touchStartY.current = event.touches[0].clientY;
    };
    const handleTouchEnd = async (event) => {
      if (touchStartY.current === null || refreshing) return;
      const distance = event.changedTouches[0].clientY - touchStartY.current;
      touchStartY.current = null;
      if (distance < 72 || window.scrollY !== 0) return;

      setRefreshing(true);
      await nativeFeedback.tap();
      router.reload({
        onFinish: () => setRefreshing(false),
      });
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [refreshing]);

  const handleBack = () => {
    if (onBack) return onBack();
    if (backHref) return router.visit(backHref);
    if (window.history.length > 1) return window.history.back();
    router.visit('/dashboard');
  };

  return (
    <div className="flex min-h-[100dvh] flex-col overflow-x-hidden bg-white overscroll-none dark:bg-gray-900">
      <ErrorBoundary>
        <PushNotificationManager />
      </ErrorBoundary>

      {!hideHeader && <MobileHeader title={title} subtitle={subtitle} onBack={(onBack || backHref) ? handleBack : null} headerRight={headerRight} />}

      <Notification message={flash.success} type="success" />
      <Notification message={flash.error} type="error" />
      <Notification message={flash.info} type="info" />

      {refreshing && (
        <div className="fixed top-[calc(3.5rem+env(safe-area-inset-top,0px))] left-0 right-0 z-30 flex justify-center pointer-events-none">
          <div className="mt-2 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-lg animate-pulse">
            Actualisation...
          </div>
        </div>
      )}

      <MobilePageContainer fullBleed={fullBleed} hideHeader={hideHeader} hideBottomNav={hideBottomNav}>
        {children}
      </MobilePageContainer>

      {!hideBottomNav && (
        <MobileBottomNav onMoreClick={onMoreClick || (() => router.visit('/more'))} />
      )}
    </div>
  );
}