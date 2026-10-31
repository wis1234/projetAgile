import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, usePage } from '@inertiajs/react';
import Notification from '../Components/Notification';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import GlobalFooter from '@/Components/GlobalFooter';
import ErrorBoundary from '@/Components/ErrorBoundary';
import LiveKitCallModal from '@/Components/LiveKitCallModal';
import GlobalSearch from '@/Components/GlobalSearch';
import MobileBottomNav from '@/Components/MobileBottomNav';
import AssistantLauncher from '@/Components/Assistant/AssistantLauncher';
import Sidebar from '@/Components/Sidebar/Sidebar';
import LanguageSwitcherSidebar from '@/Components/LanguageSwitcherSidebar';
import PushNotificationManager, { unregisterDeviceToken } from '@/Components/PushNotificationManager';

const INCOMING_CALL_SOUND =
  'https://proja.kemtcenter.org/storage/public/files/incoming-call_old.mp3';

const getFreshCsrfToken = async () => {
  try {
    const res = await fetch('/csrf-token', { credentials: 'include' });
    const data = await res.json();
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) metaTag.setAttribute('content', data.token);
    return data.token;
  } catch {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
  }
};

const navLinks = [
  { href: '/dashboard', label: 'dashboard', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6m-6 0v6m0-6H7m6 0h6" /></svg>
  ) },
  { href: '/projects', label: 'projects', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44z" /></svg>
  ) },
  { href: '/project-users', label: 'members', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>
  ) },
  { href: '/sprints', label: 'sprints', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg>
  ) },
  { href: '/tasks', label: 'tasks', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6m9 2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7l5 5v10z" /></svg>
  ) },

  { href: '/discussions', label: 'discussions', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
  ) },
  { href: '/kanban', label: 'task_tracking', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25A2.25 2.25 0 0 1 6 3h12a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 18 21H6a2.25 2.25 0 0 1-2.25-2.25V5.25ZM9 7.5v9M15 7.5v9" /></svg>
  ) },
  { href: '/files', label: 'files', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h9a2.25 2.25 0 0 0 2.25-2.25V9h-3.75z" /></svg>
  ) },
  { href: '/users', label: 'users', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 0 0-3-3.87M9 20H4v-2a4 4 0 0 1 3-3.87m9-5.13a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" /></svg>
  ) },
  { href: '/activities', label: 'activity_log', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a4 4 0 0 1 4-4h4M7 7h.01M7 11h.01M7 15h.01" /></svg>
  ) },
  { href: '/quizzes', label: 'quiz',
    // actif sur toutes les pages quiz (liste, détail, correction, cumul…)
    match: (url) => /^\/(quizzes|projects\/\d+\/(quizzes|quiz-cumuls|participation-points))(\/|\?|$)/.test(url || ''),
    icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>
  ) },
  { href: '/recruitment', label: 'recruitment', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V9m18 0V9a2.25 2.25 0 0 0-2.25-2.25H15M3 9l9-6 9 6m-18 0a2.25 2.25 0 0 0 2.25 2.25h13.5A2.25 2.25 0 0 0 21 9m-18 0V9a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 9v1.5m-9-3h.008v.008H12V7.5zm0 3h.008v.008H12v-.008zm0 3h.008v.008H12v-.008z" />
    </svg>
  ) },
  { href: '/subscription/plans', label: 'my_subscription', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ) },
  { href: '/remunerations', label: 'remunerations', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ) },
];

// Lien réservé aux administrateurs (défini hors du composant pour rester stable entre les rendus)
const assistantAdminLink = {
  href: '/assistant/admin',
  label: 'Assistant IA · Admin',
  match: (url) => /^\/assistant\/admin(?:\/|$)/.test(url || ''),
  icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 14l4-4 4 4 6-7" /></svg>,
};

const quizOnlyLinks = navLinks.filter((l) => l.href === '/quizzes');

const LOADER_LETTERS = ['P', 'r', 'o', 'J', 'A'];
const LOADER_CSS = `
  @keyframes bounce {
    0%, 100% {
      transform: translateY(0) scale(1);
      color: #2563eb;
    }
    50% {
      transform: translateY(-15px) scale(1.2);
      color: #1d4ed8;
      text-shadow: 0 5px 10px rgba(37, 99, 235, 0.3);
    }
  }
`;

const Loader = React.memo(function Loader() {
  return (
    <div className="fixed top-0 bottom-0 left-0 right-0 md:left-[var(--sidebar-w,16rem)] z-[60] flex flex-col items-center justify-center bg-white dark:bg-gray-900 bg-opacity-90 transition-opacity duration-300">
      <div className="flex space-x-1 mb-8">
        {LOADER_LETTERS.map((letter, index) => (
          <span
            key={index}
            className="text-4xl font-bold text-blue-600 dark:text-blue-400 inline-block"
            style={{
              animation: `bounce 0.6s ease-in-out infinite`,
              animationDelay: `${index * 0.1}s`,
              transformOrigin: 'bottom center'
            }}
          >
            {letter}
          </span>
        ))}
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        Chargement...
      </p>

      <style dangerouslySetInnerHTML={{ __html: LOADER_CSS }} />
    </div>
  );
});

/**
 * `immersive` : pages d'édition plein écran (éditeur de documents). L'en-tête global, le pied de page
 * et la barre basse mobile sont retirés pour laisser toute la place au document ; c'est alors l'en-tête
 * du fichier qui reste figé en haut.
 */
export default function AdminLayout({ children, immersive = false }) {
  const { auth, flash = {} } = usePage().props;
  const { url: currentUrl } = usePage();
  // Compte candidat (inscrit à des quiz, sans projet) : un seul menu, « Quiz ».
  const candidateOnly = Boolean(auth?.user?.quiz_candidate_only);
  const hasAdminFlag = Boolean(auth?.user?.is_admin);
  const menuLinks = useMemo(() => {
    const base = candidateOnly ? quizOnlyLinks : navLinks;
    return hasAdminFlag ? [...base, assistantAdminLink] : base;
  }, [candidateOnly, hasAdminFlag]);
  const isLinkActive = useCallback(
    (link) => (link.match ? link.match(currentUrl) : route().current(link.href.replace(/^\//, ''))),
    [currentUrl]
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Menu latéral réductible (PC) : seules les icônes restent visibles, le contenu gagne de la place
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('sidebar_collapsed') === '1'; } catch { return false; }
  });
  const toggleCollapsed = useCallback(() => setCollapsed((c) => !c), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  useEffect(() => {
    try { localStorage.setItem('sidebar_collapsed', collapsed ? '1' : '0'); } catch { /* stockage indisponible */ }
    // Les pages plein écran (chat, loader) s'alignent sur cette largeur via var(--sidebar-w)
    document.documentElement.style.setProperty('--sidebar-w', collapsed ? '4.5rem' : '16rem');
  }, [collapsed]);
  useEffect(() => {
    const open = () => setSidebarOpen(true);
    window.addEventListener('proja:open-sidebar', open);
    return () => window.removeEventListener('proja:open-sidebar', open);
  }, []);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') { e.preventDefault(); setCollapsed((c) => !c); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('darkMode');
      if (savedMode !== null) {
        return savedMode === 'true';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [notifDropdown, setNotifDropdown] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifCount, setNotifCount] = useState(0);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const profileRef = useRef();
  const notifRef = useRef();
  const [globalLoading, setGlobalLoading] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('fr');
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);
  const { t, i18n } = useTranslation();

  // ─── Appel ProJA (LiveKit) — état global, actif peu importe la page ───
  const [showLiveKitCall, setShowLiveKitCall] = useState(false);
  const [liveKitInvite, setLiveKitInvite] = useState(null); // { projectId, projectName, initiatorName }
  const [joinToast, setJoinToast] = useState(null); // { projectName, userName }
  const ringtoneRef = useRef(null);

  const playRingtone = useCallback(() => {
    if (ringtoneRef.current) return;

    const audio = new Audio(INCOMING_CALL_SOUND);
    audio.loop = true;
    audio.volume = 0.85;
    audio.preload = 'auto';

    ringtoneRef.current = audio;

    audio.play().catch((error) => {
      console.warn('Lecture de la sonnerie d’appel bloquée:', error);
    });

    if (navigator.vibrate) {
      navigator.vibrate([400, 200, 400, 200, 400]);
    }
  }, []);

  const stopRingtone = useCallback(() => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
      ringtoneRef.current = null;
    }

    if (navigator.vibrate) {
      navigator.vibrate(0);
    }
  }, []);

  useEffect(() => stopRingtone, [stopRingtone]);

  // Calculé directement à partir de l'utilisateur : plus d'état ni de rendu supplémentaire
  const isAdmin = useMemo(
    () =>
      auth.user?.email === 'ronaldoagbohou@gmail.com' ||
      auth.user?.role === 'admin' ||
      (Array.isArray(auth.user?.roles) && auth.user.roles.includes('admin')) ||
      auth.user?.is_admin === true,
    [auth.user]
  );

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // Écouter les changements de préférence système
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e) => {
      if (localStorage.getItem('darkMode') === null) {
        setDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleLogout = async () => {
    try {
      await unregisterDeviceToken();
    } catch {
      // Ne bloque jamais la déconnexion si le nettoyage du token échoue
    }
    router.post('/logout');
  };

  const userId = auth?.user?.id || auth?.id;

  const fetchNotifications = useCallback(() => {
    if (!userId) return;
    fetch('/activities/notifications')
      .then(res => res.json())
      .then(data => {
        setNotifications(data.activities || []);
        setNotifCount(data.unread_count || 0);
      })
      .catch(() => {});
  }, [userId]);

  // Rafraîchissement périodique, mis en pause quand l'onglet est caché,
  // et rattrapage immédiat quand l'utilisateur revient sur l'onglet.
  useEffect(() => {
    fetchNotifications();
    const refreshIfVisible = () => {
      if (!document.hidden) fetchNotifications();
    };
    const interval = setInterval(refreshIfVisible, 90000);
    document.addEventListener('visibilitychange', refreshIfVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshIfVisible);
    };
  }, [fetchNotifications]);

  // ─── Temps réel : activités + appels ProJA (LiveKit), un seul abonnement au canal utilisateur ───
  useEffect(() => {
    if (!window.Echo || !userId) return undefined;

    const channel = window.Echo.private(`user.${userId}`);

    // Nouvelle activité poussée immédiatement
    channel.listen('.activity.created', (payload) => {
      setNotifications(prev => [
        { ...payload, is_read: false },
        ...prev.filter(n => n.id !== payload.id),
      ].slice(0, 15));
      setNotifCount(prev => prev + 1);
    });

    channel.listen('.livekit.call.started', (e) => {
      // Ne pas sonner chez l'initiateur lui-même
      if (String(e.initiatorId) === String(userId)) return;
      setLiveKitInvite({
        projectId: e.projectId,
        projectName: e.projectName,
        initiatorName: e.initiatorName,
        initiatorId: e.initiatorId,
        inviteUrl: e.inviteUrl,
      });
      playRingtone();
    });

    channel.listen('.livekit.call.ended', () => {
      setLiveKitInvite(null);
      stopRingtone();
    });

    channel.listen('.livekit.call.answered', () => {
      stopRingtone();
    });

    channel.listen('.livekit.participant.joined', (e) => {
      setJoinToast({ projectName: e.projectName, userName: e.userName });
      setTimeout(() => setJoinToast(null), 4000);
    });

    return () => {
      window.Echo.leave(`user.${userId}`);
    };
  }, [userId, playRingtone, stopRingtone]);

  // ─── Rafraîchissement instantané quand un push FCM arrive au premier plan (natif) ───
  useEffect(() => {
    const handleFcmForeground = () => {
      fetchNotifications();
    };
    window.addEventListener('proja:fcm-foreground', handleFcmForeground);
    return () => window.removeEventListener('proja:fcm-foreground', handleFcmForeground);
  }, [fetchNotifications]);

  const markNotificationsRead = () => {
    if (notifCount === 0) return;
    fetch('/activities/notifications/mark-read', {
      method: 'POST',
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        'X-Requested-With': 'XMLHttpRequest',
      },
    }).catch(() => {});
    setNotifCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Loader global : les écouteurs Inertia sont désormais retirés au démontage
  // (avant, la fonction de nettoyage était vide et les écouteurs s'accumulaient).
  useEffect(() => {
    const offs = [
      router.on('start', () => setGlobalLoading(true)),
      router.on('finish', () => setGlobalLoading(false)),
      router.on('error', () => setGlobalLoading(false)),
    ];

    return () => {
      offs.forEach((off) => {
        if (typeof off === 'function') off();
      });
    };
  }, []);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  useEffect(() => {
    document.body.classList.add('bg-white');
    return () => {
      document.body.classList.remove('bg-white');
    };
  }, []);

  // Load language preference from localStorage on component mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('i18nextLng') || 'fr';
    setCurrentLanguage(savedLanguage);
    i18n.changeLanguage(savedLanguage);
  }, [i18n]);

  // Update current language when i18n language changes
  useEffect(() => {
    const handleLanguageChanged = (lng) => {
      setCurrentLanguage(lng);
    };

    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  // Function to change language
  const changeLanguage = useCallback(async (lng) => {
    if (currentLanguage === lng || isChangingLanguage) return;

    try {
      setIsChangingLanguage(true);
      await i18n.changeLanguage(lng);
      setCurrentLanguage(lng);
      localStorage.setItem('i18nextLng', lng);
      document.documentElement.lang = lng;

      if (flash?.success) {
        flash.success(t('language_changed', { language: lng }));
      }

      setTimeout(() => {
        setIsChangingLanguage(false);
      }, 300);

    } catch (error) {
      console.error('Error changing language:', error);
      if (flash?.error) {
        flash.error(t('error_changing_language'));
      }
      setIsChangingLanguage(false);
    }
  }, [currentLanguage, isChangingLanguage, i18n, flash, t]);

  const user = auth?.user || auth;
  const userName = user?.name || 'Utilisateur';
  const avatarUrl = user?.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0D8ABC&color=fff`;

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-900">
      <ErrorBoundary>
        <PushNotificationManager />
      </ErrorBoundary>
      {globalLoading && <Loader />}

      {/* ═══════════════════ SIDEBAR / DRAWER ═══════════════════ */}
      <Sidebar
        links={menuLinks}
        isLinkActive={isLinkActive}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapsed}
        open={sidebarOpen}
        onClose={closeSidebar}
        t={t}
      />

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40 md:hidden"
          onClick={closeSidebar}
        ></div>
      )}

      {/* Main content */}
      <div className={`flex-1 flex flex-col min-h-screen ml-0 ${collapsed ? 'md:ml-[4.5rem]' : 'md:ml-64'} transition-[margin] duration-300 motion-reduce:transition-none min-w-0`}>
        {/* ═══════════════════════════════════════════════════════════
            HEADER — allégé sur mobile (pattern app native)
        ═══════════════════════════════════════════════════════════ */}
        {!immersive && (
        <header
          className={[
            'fixed top-0 left-0 right-0 z-40',
            collapsed ? 'md:left-[4.5rem]' : 'md:left-64',
            // Style header Slack : blanc pur, ombre fine, très propre
            'bg-white dark:bg-gray-900',
            'border-b border-gray-200/80 dark:border-gray-700/60',
            'flex items-center justify-between px-3 sm:px-6',
            'shadow-[0_1px_3px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)]',
            'transition-[left] duration-300 motion-reduce:transition-none',
          ].join(' ')}
          style={{
            height: 'calc(3.75rem + env(safe-area-inset-top, 0px))',
            paddingTop: 'env(safe-area-inset-top, 0px)',
          }}
        >
          {/* ── Gauche : burger + logo (mobile) ── */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 dark:text-gray-300 active:scale-90 active:bg-gray-100 dark:active:bg-gray-700 transition-all flex-shrink-0"
              onClick={() => setSidebarOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo — visible uniquement sur mobile */}
            <div className="flex items-center gap-2 md:hidden">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white font-bold text-sm select-none flex-shrink-0 shadow-sm">P</span>
              <span className="text-[15px] font-bold text-gray-900 dark:text-white tracking-tight">ProJA</span>
            </div>
          </div>

          {/* ── Centre : barre de recherche Slack-style (desktop) ── */}
          <div className="hidden md:flex flex-1 justify-center px-6 min-w-0">
            <div className="w-full max-w-lg">
              {!candidateOnly && <GlobalSearch />}
            </div>
          </div>

          {/* ── Droite : actions ── */}
          <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">

            {/* Icône recherche — mobile */}
            <button
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 dark:text-gray-300 active:scale-90 active:bg-gray-100 dark:active:bg-gray-700 transition-all"
              onClick={() => setMobileSearchOpen(true)}
              aria-label="Rechercher"
            >
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* ─── Sélecteur de langue ─── */}
            <LanguageSwitcherSidebar
              currentLanguage={currentLanguage}
              isChangingLanguage={isChangingLanguage}
              onChangeLanguage={changeLanguage}
            />

            {/* ─── Cloche notifications ─── */}
            <div className="relative" ref={notifRef}>
              <button
                className="relative flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-90 transition-all"
                title="Notifications"
                onClick={() => {
                  const opening = !notifDropdown;
                  setNotifDropdown(opening);
                  setProfileDropdown(false);
                  if (opening) markNotificationsRead();
                }}
                aria-label="Notifications"
              >
                <svg className={`w-[18px] h-[18px] ${notifCount > 0 ? 'text-blue-600 dark:text-blue-400' : ''}`} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notifCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-[16px] flex items-center justify-center bg-blue-600 text-white text-[9px] font-bold rounded-full px-0.5 shadow">
                    {notifCount > 99 ? '99+' : notifCount}
                  </span>
                )}
              </button>

              {/* Dropdown notifications */}
              {notifDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-50 border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <span className="font-bold text-gray-800 dark:text-gray-100 text-sm">Notifications</span>
                    {notifCount > 0 && (
                      <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">{notifCount}</span>
                    )}
                  </div>
                  <ul className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700">
                    {notifications.length === 0 && (
                      <li className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-500">
                        <svg className="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
                        </svg>
                        <span className="text-sm">Aucune notification</span>
                      </li>
                    )}
                    {notifications.slice(0, 6).map(n => (
                      <li
                        key={n.id}
                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!n.is_read ? 'bg-blue-50/70 dark:bg-blue-900/10' : ''}`}
                        onClick={() => { setNotifDropdown(false); if (n.url) router.visit(n.url); }}
                      >
                        <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${!n.is_read ? 'bg-blue-600 dark:bg-blue-400' : 'bg-gray-300 dark:bg-gray-600'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 dark:text-gray-100 line-clamp-2">{n.message}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            {new Date(n.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                    <Link href="/activities" className="flex items-center justify-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                      Voir toutes les activités
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </Link>
                  </div>
                </div>
              )}

              {/* Modal détail notification */}
              {selectedNotif && (
                <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedNotif(null)}>
                  <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setSelectedNotif(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <h2 className="text-lg font-bold mb-4 text-blue-700 dark:text-blue-300 pr-8">Détail de la notification</h2>
                    <p className="text-sm text-gray-800 dark:text-gray-100 mb-2">
                      {(() => {
                        let msg = selectedNotif.message;
                        if (selectedNotif.data?.user) msg = msg.replace(/User #(\d+)/, selectedNotif.data.user.name || 'Utilisateur');
                        return msg;
                      })()}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                      {new Date(selectedNotif.created_at).toLocaleString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {selectedNotif.data && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-sm space-y-1">
                        {selectedNotif.data.user && (
                          <p><span className="font-medium text-gray-600 dark:text-gray-300">Utilisateur : </span><span className="text-gray-900 dark:text-white">{selectedNotif.data.user.name}</span></p>
                        )}
                        {selectedNotif.data.subject && (
                          <p><span className="font-medium text-gray-600 dark:text-gray-300">Sujet : </span><span className="text-gray-900 dark:text-white">{selectedNotif.data.subject}</span></p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ─── Toggle Dark / Light ─── */}
            <button
              className="hidden md:flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-90 transition-all"
              onClick={() => setDarkMode(dm => !dm)}
              aria-label={darkMode ? 'Désactiver le mode sombre' : 'Activer le mode sombre'}
              title={darkMode ? 'Désactiver le mode sombre' : 'Activer le mode sombre'}
            >
              {darkMode ? (
                <svg className="w-[18px] h-[18px] text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m16.66 5.66l-.71-.71M4.05 4.05l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Séparateur visuel */}
            <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* ─── Profil utilisateur — style Slack aux couleurs ProJA ─── */}
            <div className="relative" ref={profileRef}>
              <button
                className="flex items-center gap-2 h-9 pl-1.5 pr-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:ring-offset-1"
                onClick={() => { setProfileDropdown(d => !d); setNotifDropdown(false); }}
                aria-label="Menu profil"
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={avatarUrl}
                    alt={userName}
                    className="w-7 h-7 rounded-full border-2 border-blue-500/40 object-cover shadow-sm"
                  />
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 border-[1.5px] border-white dark:border-gray-900 rounded-full"></span>
                </div>
                <span className="hidden sm:block text-[13px] font-semibold text-gray-800 dark:text-gray-100 truncate max-w-[100px]">{userName}</span>
                <svg className="w-3 h-3 text-gray-400 hidden sm:block flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown profil */}
              {profileDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-50 border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/10">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{userName}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium capitalize">{isAdmin ? '👑 Administrateur' : '👤 Membre'}</p>
                  </div>

                  <div className="py-1">
                    <Link href="/profile" className="flex items-center gap-3 px-4 py-2 text-[13px] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Mon profil
                    </Link>

                    {/* Toggle dark mode — mobile */}
                    <button
                      onClick={() => setDarkMode(dm => !dm)}
                      className="md:hidden w-full flex items-center gap-3 px-4 py-2 text-[13px] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      {darkMode ? (
                        <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m16.66 5.66l-.71-.71M4.05 4.05l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      )}
                      {darkMode ? 'Mode clair' : 'Mode sombre'}
                    </button>

                    <Link href="/profile" className="flex items-center gap-3 px-4 py-2 text-[13px] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Paramètres
                    </Link>
                    {isAdmin && (
                      <Link href="/admin/subscription-plans" className="flex items-center gap-3 px-4 py-2 text-[13px] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Gestion abonnements
                        <span className="ml-auto text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full font-bold">Admin</span>
                      </Link>
                    )}
                    <Link href="/subscription/plans" className="flex items-center gap-3 px-4 py-2 text-[13px] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      Mon abonnement
                    </Link>
                    <Link href="/remunerations" className="flex items-center gap-3 px-4 py-2 text-[13px] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Mes rémunérations
                    </Link>
                  </div>

                  <div className="border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-[13px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Déconnexion
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        )}

        {/* ═══════════════════ OVERLAY RECHERCHE MOBILE ═══════════════════ */}
        {!immersive && mobileSearchOpen && (
          <div
            className="md:hidden fixed inset-0 z-50 bg-white dark:bg-gray-900"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
          >
            <div className="flex items-center gap-2 px-3 h-16 border-b border-gray-200 dark:border-gray-700">
              <div className="flex-1">
                <GlobalSearch />
              </div>
              <button
                onClick={() => setMobileSearchOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-500 active:scale-90 active:bg-gray-100 dark:active:bg-gray-700 transition-all flex-shrink-0"
                aria-label="Fermer la recherche"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Notification globale */}
        <Notification message={flash.success} type="success" />
        <Notification message={flash.error} type="error" />
        <Notification message={flash.info} type="info" />

        {/* Page content */}
        <main
          className="flex-1 w-full h-full min-w-0 transition-colors bg-white dark:bg-gray-900 flex flex-col"
          style={{
            paddingTop: immersive ? 'env(safe-area-inset-top, 0px)' : 'calc(4rem + env(safe-area-inset-top, 0px))',
            paddingBottom: immersive ? 0 : 'calc(4.5rem + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <div className="flex-1 min-w-0">
            {children}
          </div>
          {!immersive && (
            <footer className="mt-auto border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <GlobalFooter />
            </footer>
          )}
        </main>
      </div>

      {/* ═══════════════════ BOTTOM NAVIGATION — mobile uniquement ═══════════════════ */}
      {!immersive && <MobileBottomNav onMoreClick={() => setSidebarOpen(true)} />}
      {!immersive && <AssistantLauncher />}

      {/* ─── Toast discret : quelqu'un a rejoint un appel déjà en cours ─── */}
      {joinToast && (
        <div
          className="fixed right-6 z-[9998] bg-gray-900 dark:bg-gray-700 text-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200"
          style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
          <span className="text-sm">
            <strong>{joinToast.userName}</strong> a rejoint l'appel — {joinToast.projectName}
          </span>
          <button
            onClick={() => setJoinToast(null)}
            className="text-white/50 hover:text-white text-xs ml-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* ─── Bannière d'appel ProJA entrant (visible sur toute page) ─── */}
      {liveKitInvite && !showLiveKitCall && (
        <div
          className="fixed right-6 z-[9999] bg-emerald-600 text-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 animate-pulse"
          style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <span className="text-sm font-medium">
            {liveKitInvite.initiatorName} démarre un appel — {liveKitInvite.projectName}
          </span>
          <button
            onClick={() => { setShowLiveKitCall(true); stopRingtone(); }}
            className="bg-white text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full hover:bg-emerald-50 active:scale-95 transition-all"
          >
            Rejoindre
          </button>
          <button
            onClick={() => { setLiveKitInvite(null); stopRingtone(); }}
            className="text-white/70 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* ─── Modal d'appel ProJA (LiveKit) ─── */}
      {showLiveKitCall && liveKitInvite && (
        <LiveKitCallModal
          tokenEndpoint={`/projects/${liveKitInvite.projectId}/livekit-token`}
          inviteLink={liveKitInvite.inviteUrl || ''}
          title={liveKitInvite.projectName}
          callerName={liveKitInvite.initiatorName}
          myAvatarUrl={avatarUrl}
          isHost={false}
          skipIncomingScreen={true}
          muteEndpoint={`/projects/${liveKitInvite.projectId}/livekit-call/mute-participant`}
          onAnswered={async () => {
            const csrfToken = await getFreshCsrfToken();
            fetch(`/projects/${liveKitInvite.projectId}/livekit-call/answered`, {
              method: 'POST',
              headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': csrfToken,
              },
            }).catch(() => {});
          }}
          onClose={() => {
            setShowLiveKitCall(false);
            setLiveKitInvite(null);
          }}
        />
      )}
    </div>
  );
}