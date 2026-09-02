import { Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { nativeFeedback } from '@/lib/platform';

const SEEN_KEY_PREFIX = 'discussion_seen_';
const getUnreadCount = () => {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem('discussion_unread_count');
    return raw ? parseInt(raw, 10) : 0;
  } catch { return 0; }
};

const primaryItems = [
  {
    href: '/dashboard',
    label: 'dashboard',
    icon: (active) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6m-6 0v6m0-6H7m6 0h6" />
      </svg>
    ),
  },
  {
    href: '/projects',
    label: 'projects',
    icon: (active) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44z" />
      </svg>
    ),
  },
  {
    href: '/tasks',
    label: 'tasks',
    icon: (active) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6m9 2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7l5 5v10z" />
      </svg>
    ),
  },
  {
    href: '/discussions',
    label: 'discussions',
    icon: (active) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
    badge: true,
  },
];

export default function MobileBottomNav({ onMoreClick }) {
  const { t } = useTranslation();
  const { url } = usePage();
  const [unreadCount, setUnreadCount] = useState(0);

  // Rafraîchit le badge de non-lus toutes les 30 secondes
  useEffect(() => {
    const refresh = () => setUnreadCount(getUnreadCount());
    refresh();
    const interval = setInterval(refresh, 30_000);
    // Met aussi à jour quand on revient sur l'onglet
    const handleFocus = () => refresh();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('proja:discussions-updated', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('proja:discussions-updated', handleFocus);
    };
  }, []);

  const isActive = (href) => {
    if (href === '/dashboard') return url === '/dashboard' || url === '/';
    return url.startsWith(href);
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 flex items-center justify-around px-1"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)',
        paddingTop: '6px',
      }}
    >
      {primaryItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => nativeFeedback.tap()}
            className={`relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-xl min-w-[56px] transition-all active:scale-90 active:bg-gray-100 dark:active:bg-gray-700 ${
              active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            {item.icon(active)}
            {/* Badge de non-lus pour Discussions */}
            {item.badge && unreadCount > 0 && (
              <span className="absolute -top-0.5 right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
            <span className={`text-[10px] leading-none ${active ? 'font-semibold' : 'font-medium'}`}>
              {t(item.label) || item.label}
            </span>
          </Link>
        );
      })}

      {/* Bouton "Plus" ouvre le drawer complet pour le reste du menu */}
      <button
        onClick={async () => { await nativeFeedback.tap(); onMoreClick(); }}
        className="flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-xl min-w-[56px] text-gray-400 dark:text-gray-500 transition-all active:scale-90 active:bg-gray-100 dark:active:bg-gray-700"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <span className="text-[10px] leading-none font-medium">{t('more') || 'Plus'}</span>
      </button>
    </nav>
  );
}