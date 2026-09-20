import { Link, usePage } from '@inertiajs/react';
import { FaHome, FaFolderOpen, FaCheckSquare, FaComments, FaEllipsisH, FaQuestionCircle } from 'react-icons/fa';
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
  { href: '/dashboard', label: 'dashboard', fallback: 'Accueil', Icon: FaHome },
  { href: '/projects', label: 'projects', fallback: 'Projets', Icon: FaFolderOpen },
  { href: '/tasks', label: 'tasks', fallback: 'Tâches', Icon: FaCheckSquare },
  { href: '/discussions', label: 'discussions', fallback: 'Discussions', Icon: FaComments, badge: true },
];

const quizItem = { href: '/quizzes', label: 'quiz', fallback: 'Quiz', Icon: FaQuestionCircle };

// Actif sur toutes les pages quiz (liste, détail d'un quiz d'un projet, cumul…)
const QUIZ_URL = /^\/(quizzes|projects\/\d+\/(quizzes|quiz-cumuls|participation-points))(\/|\?|$)/;

/**
 * Barre de navigation flottante « application mobile » :
 * verre dépoli, coins très arrondis, onglet actif en pilule colorée avec son libellé,
 * pastille de non-lus, retour haptique.
 */
export default function MobileBottomNav({ onMoreClick }) {
  const { t } = useTranslation();
  const { url, props } = usePage();
  // Compte candidat : un seul onglet, « Quiz ».
  const items = props.auth?.user?.quiz_candidate_only ? [quizItem] : primaryItems;
  const [unreadCount, setUnreadCount] = useState(0);

  // Rafraîchit le badge de non-lus toutes les 30 secondes
  useEffect(() => {
    const refresh = () => setUnreadCount(getUnreadCount());
    refresh();
    const interval = setInterval(refresh, 30_000);
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
    if (href === '/quizzes') return QUIZ_URL.test(url);
    return url.startsWith(href);
  };

  const moreActive = url.startsWith('/more');

  return (
    <nav
      aria-label="Navigation principale"
      className="md:hidden fixed inset-x-0 bottom-0 z-40 px-3 pointer-events-none"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 10px)' }}
    >
      <div className="pointer-events-auto mx-auto flex max-w-md items-center justify-between rounded-[28px] border border-white/60 bg-white/85 p-2 shadow-[0_10px_40px_-8px_rgba(15,23,42,0.35)] ring-1 ring-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/85 dark:ring-white/10">
        {items.map(({ href, label, fallback, Icon, badge }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => nativeFeedback.tap()}
              aria-current={active ? 'page' : undefined}
              className={`relative flex h-12 items-center justify-center rounded-2xl transition-all duration-300 ease-out active:scale-90 ${
                active
                  ? 'gap-2 bg-gradient-to-br from-blue-600 to-indigo-600 px-4 text-white shadow-lg shadow-blue-600/40'
                  : 'w-12 text-slate-400 dark:text-slate-500'
              }`}
            >
              <Icon className={active ? 'text-[17px]' : 'text-[19px]'} />
              {active && <span className="text-[13px] font-bold leading-none">{t(label) || fallback}</span>}
              {badge && unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[9px] font-black leading-none text-white dark:border-slate-900">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          );
        })}

        {/* « Menu » : accès au reste de l'application */}
        <button
          type="button"
          onClick={async () => { await nativeFeedback.tap(); onMoreClick(); }}
          aria-label={t('more') || 'Menu'}
          className={`flex h-12 items-center justify-center rounded-2xl transition-all duration-300 active:scale-90 ${
            moreActive ? 'gap-2 bg-gradient-to-br from-blue-600 to-indigo-600 px-4 text-white shadow-lg shadow-blue-600/40' : 'w-12 text-slate-400 dark:text-slate-500'
          }`}
        >
          <FaEllipsisH className="text-[19px]" />
          {moreActive && <span className="text-[13px] font-bold leading-none">{t('more') || 'Menu'}</span>}
        </button>
      </div>
    </nav>
  );
}
