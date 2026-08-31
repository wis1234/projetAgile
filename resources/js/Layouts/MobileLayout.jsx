import React from 'react';
import { usePage, router } from '@inertiajs/react';
import MobileBottomNav from '@/Components/MobileBottomNav';
import PushNotificationManager from '@/Components/PushNotificationManager';
import ErrorBoundary from '@/Components/ErrorBoundary';
import Notification from '@/Components/Notification';

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
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      <ErrorBoundary>
        <PushNotificationManager />
      </ErrorBoundary>

      {!hideHeader && (
        <header
          className="fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 flex items-center gap-2 px-2"
          style={{
            height: 'calc(3.5rem + env(safe-area-inset-top, 0px))',
            paddingTop: 'env(safe-area-inset-top, 0px)',
          }}
        >
          {(onBack || backHref) ? (
            <button
              onClick={handleBack}
              className="w-10 h-10 flex items-center justify-center rounded-full text-gray-600 dark:text-gray-300 active:scale-90 active:bg-gray-100 dark:active:bg-gray-800 transition-all flex-shrink-0"
              aria-label="Retour"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : (
            <div className="w-10 h-10 flex-shrink-0" />
          )}

          <div className="flex-1 min-w-0">
            {title && (
              <h1 className="text-base font-bold text-gray-900 dark:text-white truncate leading-tight">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate leading-tight">
                {subtitle}
              </p>
            )}
          </div>

          {headerRight && <div className="flex-shrink-0 pr-1">{headerRight}</div>}
        </header>
      )}

      <Notification message={flash.success} type="success" />
      <Notification message={flash.error} type="error" />
      <Notification message={flash.info} type="info" />

      <main
        className={`flex-1 w-full min-w-0 flex flex-col ${fullBleed ? '' : 'px-4'}`}
        style={{
          paddingTop: hideHeader ? 'env(safe-area-inset-top, 0px)' : 'calc(3.5rem + env(safe-area-inset-top, 0px))',
          paddingBottom: hideBottomNav ? 'env(safe-area-inset-bottom, 0px)' : 'calc(4.5rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {children}
      </main>

      {!hideBottomNav && (
        <MobileBottomNav onMoreClick={onMoreClick || (() => router.visit('/more'))} />
      )}
    </div>
  );
}