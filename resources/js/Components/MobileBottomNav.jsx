import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

const primaryItems = [
  { href: '/dashboard', label: 'dashboard', icon: (active) => (
    <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6m-6 0v6m0-6H7m6 0h6" />
    </svg>
  )},
  { href: '/projects', label: 'projects', icon: (active) => (
    <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44z" />
    </svg>
  )},
  { href: '/tasks', label: 'tasks', icon: (active) => (
    <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6m9 2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7l5 5v10z" />
    </svg>
  )},
  { href: '/kanban', label: 'task_tracking', icon: (active) => (
    <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25A2.25 2.25 0 0 1 6 3h12a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 18 21H6a2.25 2.25 0 0 1-2.25-2.25V5.25ZM9 7.5v9M15 7.5v9" />
    </svg>
  )},
];

export default function MobileBottomNav({ onMoreClick }) {
  const { t } = useTranslation();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 flex items-center justify-around px-1"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)',
        paddingTop: '6px',
      }}
    >
      {primaryItems.map((item) => {
        const active = route().current(item.href.replace(/^\//, ''));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-xl min-w-[56px] transition-all active:scale-90 active:bg-gray-100 dark:active:bg-gray-700 ${
              active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            {item.icon(active)}
            <span className={`text-[10px] leading-none ${active ? 'font-semibold' : 'font-medium'}`}>
              {t(item.label)}
            </span>
          </Link>
        );
      })}

      {/* Bouton "Plus" ouvre le drawer complet pour le reste du menu */}
      <button
        onClick={onMoreClick}
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