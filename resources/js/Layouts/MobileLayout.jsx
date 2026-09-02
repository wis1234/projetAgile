import React from 'react';
import { usePage, router } from '@inertiajs/react';
import MobileBottomNav from '@/Components/MobileBottomNav';
import PushNotificationManager from '@/Components/PushNotificationManager';
import ErrorBoundary from '@/Components/ErrorBoundary';
import Notification from '@/Components/Notification';
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

  const handleBack = () => {
    if (onBack) return onBack();
    if (backHref) return router.visit(backHref);
    if (window.history.length > 1) return window.history.back();
    router.visit('/dashboard');
  };

  return (
    <div className="mobile-app-shell h-[100dvh] min-h-[100dvh] overflow-x-hidden bg-white dark:bg-gray-900">
      <ErrorBoundary>
        <PushNotificationManager />
      </ErrorBoundary>

      {!hideHeader && <MobileHeader title={title} subtitle={subtitle} onBack={(onBack || backHref) ? handleBack : null} headerRight={headerRight} />}

      <Notification message={flash.success} type="success" />
      <Notification message={flash.error} type="error" />
      <Notification message={flash.info} type="info" />

      <MobilePageContainer fullBleed={fullBleed} hideHeader={hideHeader} hideBottomNav={hideBottomNav}>
        {children}
      </MobilePageContainer>

      {!hideBottomNav && (
        <MobileBottomNav onMoreClick={onMoreClick || (() => router.visit('/more'))} />
      )}
    </div>
  );
}