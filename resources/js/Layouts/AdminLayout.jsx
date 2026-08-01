import React, { useState, useEffect, useRef } from 'react';
import { Link, usePage } from '@inertiajs/react';
import Notification from '../Components/Notification';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import GlobalFooter from '@/Components/GlobalFooter';
import PushNotificationManager from '@/Components/PushNotificationManager';
import LiveKitCallModal from '@/Components/LiveKitCallModal';

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
  { href: '/remunerations/dashboard', label: 'remunerations', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ) },
];

const Loader = () => {
  const letters = ['P', 'r', 'o', 'J', 'A'];
  
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-gray-900 bg-opacity-90 transition-opacity duration-300">
      <div className="flex space-x-1 mb-8">
        {letters.map((letter, index) => (
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
      
      <style dangerouslySetInnerHTML={{
        __html: `
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
        `
      }} />
    </div>
  );
};

export default function AdminLayout({ children }) {
  const { auth, flash = {}, appName } = usePage().props;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    // Vérifie si l'utilisateur a une préférence enregistrée, sinon utilise la préférence système
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
  const [languageOpen, setLanguageOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifCount, setNotifCount] = useState(0);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const profileRef = useRef();
  const [globalLoading, setGlobalLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('fr');
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);
  const { t, i18n } = useTranslation();

  // ─── Appel ProJA (LiveKit) — état global, actif peu importe la page ───
  const [showLiveKitCall, setShowLiveKitCall] = useState(false);
  const [liveKitInvite, setLiveKitInvite] = useState(null); // { projectId, projectName, initiatorName }
  const ringtoneRef = useRef(null);

  const playRingtone = () => {
    if (ringtoneRef.current) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const audioCtx = new AudioCtx();
    audioCtx.resume?.().catch(() => {});

    const playTone = () => {
      const now = audioCtx.currentTime;
      [880, 1108].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now + i * 0.15);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.05 + i * 0.15);
        gain.gain.linearRampToValueAtTime(0, now + 0.35 + i * 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + i * 0.15);
        osc.stop(now + 0.5 + i * 0.15);
      });
    };

    playTone();
    const interval = setInterval(playTone, 1800);
    ringtoneRef.current = { audioCtx, interval };

    if (navigator.vibrate) navigator.vibrate([400, 200, 400, 200, 400]);
  };

  const stopRingtone = () => {
    if (!ringtoneRef.current) return;
    clearInterval(ringtoneRef.current.interval);
    ringtoneRef.current.audioCtx.close().catch(() => {});
    ringtoneRef.current = null;
    if (navigator.vibrate) navigator.vibrate(0);
  };

  useEffect(() => stopRingtone, []);
  
  // Available languages with their display names and flag codes
  const languages = [
    { code: 'fr', name: 'Français', flag: 'fr' },
    { code: 'en', name: 'English', flag: 'gb' },
    { code: 'fon', name: 'Fɔngbè', flag: 'bj' },
    { code: 'yo', name: 'Yorùbá', flag: 'ng' }
  ];

  useEffect(() => {
    // Vérifier si l'utilisateur est admin via différentes méthodes
    const userIsAdmin = 
      auth.user?.email === 'ronaldoagbohou@gmail.com' || // Email spécifique
      auth.user?.role === 'admin' ||                    // Colonne 'role' de la table users
      (Array.isArray(auth.user?.roles) && auth.user.roles.includes('admin')) || // Tableau de rôles
      auth.user?.is_admin === true;                     // Colonne 'is_admin' si elle existe
      
    setIsAdmin(userIsAdmin);
  }, [auth.user]);

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
      // Ne mettre à jour que si l'utilisateur n'a pas de préférence enregistrée
      if (localStorage.getItem('darkMode') === null) {
        setDarkMode(e.matches);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (auth?.user || auth?.id) {
      fetch('/api/activities/notifications')
        .then(res => res.json())
        .then(data => {
          setNotifications(data);
          setNotifCount(data.length);
        });
    }
  }, [auth]);

  useEffect(() => {
    if (window.Echo) {
      window.Echo.channel('activities')
        .listen('ActivityLogged', (e) => {
          setNotifications(prev => [e.activity, ...prev.slice(0, 9)]);
          setNotifCount(prev => prev + 1);
        });
    }
  }, []);

  // ─── Écoute globale des appels ProJA (LiveKit), peu importe la page ───
  useEffect(() => {
    if (!window.Echo || !auth?.user?.id) return;

    const channel = window.Echo.private(`user.${auth.user.id}`);

    channel.listen('.livekit.call.started', (e) => {
      setLiveKitInvite({
        projectId: e.projectId,
        projectName: e.projectName,
        initiatorName: e.initiatorName,
      });
      playRingtone();
    });

    channel.listen('.livekit.call.ended', () => {
      setLiveKitInvite(null);
      stopRingtone();
    });

    return () => {
      window.Echo.leave(`user.${auth.user.id}`);
    };
  }, [auth?.user?.id]);


  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const onStart = () => setGlobalLoading(true);
    const onFinish = () => setGlobalLoading(false);
    const onError = () => setGlobalLoading(false);
    
    // Ajouter les écouteurs d'événements
    router.on('start', onStart);
    router.on('finish', onFinish);
    router.on('error', onError);
    
    return () => {
      // Supprimer les écouteurs d'événements en utilisant la méthode appropriée
      // Note: Dans les versions récentes d'Inertia, il n'est pas nécessaire de supprimer manuellement les écouteurs
      // car ils sont automatiquement nettoyés lors du démontage du composant
      // Nous laissons cette partie vide pour éviter l'erreur
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
  const changeLanguage = async (lng) => {
    if (currentLanguage === lng || isChangingLanguage) return;
    
    try {
      setIsChangingLanguage(true);
      await i18n.changeLanguage(lng);
      setCurrentLanguage(lng);
      localStorage.setItem('i18nextLng', lng);
      document.documentElement.lang = lng;
      
      // Show success notification
      const selectedLang = languages.find(lang => lang.code === lng);
      if (flash?.success) {
        flash.success(t('language_changed', { language: selectedLang?.name || lng }));
      }
      
      // Close the language dropdown after a short delay
      setTimeout(() => {
        setLanguageOpen(false);
        setIsChangingLanguage(false);
      }, 300);
      
    } catch (error) {
      console.error('Error changing language:', error);
      // Show error notification to user
      if (flash?.error) {
        flash.error(t('error_changing_language'));
      }
      setIsChangingLanguage(false);
    }
  };

  // Get user data from auth object (handles both auth.user and direct auth properties)
  const user = auth?.user || auth;
  const userName = user?.name || 'Utilisateur';
  const avatarUrl = user?.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0D8ABC&color=fff`;
  
  // Debug log to check user data
  console.log('Auth data:', auth);
  console.log('User data:', user);

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-900">
        <PushNotificationManager />
      {globalLoading && <Loader />}
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-screen w-64 bg-gradient-to-b from-indigo-900 to-blue-800 dark:from-gray-900 dark:to-gray-800 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-all duration-300 z-50 flex flex-col shadow-xl`}>
        {/* Logo */}
        <div className="flex items-center justify-between h-20 px-6">
          <div className="flex items-center space-x-3">
            <svg className="w-8 h-8 text-white dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xl font-bold text-white dark:text-blue-400">ProJA</span>
          </div>
          <button className="md:hidden text-white/70 hover:text-white dark:hover:text-blue-300 transition-colors" onClick={() => setSidebarOpen(false)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-4 py-4 overflow-y-auto scrollbar-hide space-y-1.5">
          {navLinks.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 text-base rounded-lg transition-all duration-200 ${
                route().current(link.href.replace(/^\//, ''))
                  ? 'bg-white/10 dark:bg-blue-900/50 text-white dark:text-blue-100 shadow-lg'
                  : 'text-white/80 hover:bg-white/5 dark:hover:bg-blue-900/30 hover:text-white dark:hover:text-blue-100'
              }`}
            >
              <span className="text-lg">
                {link.icon || (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </span>
              <span className="font-medium">{t(link.label)}</span>
              {route().current(link.href.replace(/^\//, '')) && (
                <span className="ml-auto w-1.5 h-1.5 bg-blue-400 dark:bg-blue-300 rounded-full"></span>
              )}
            </Link>
          ))}
        </nav>

        {/* Version */}
        <div className="p-4 border-t border-white/10 dark:border-gray-700 text-center">
          <div className="text-sm font-medium text-white/60 dark:text-gray-400">
            ProJA v1.0
          </div>
        </div>
      </aside>
      {/* Overlay for mobile */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40 md:hidden" onClick={() => setSidebarOpen(false)}></div>}
      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen ml-0 md:ml-64 transition-all duration-300">
        {/* ═══════════════════════════════════════════════════════════
            HEADER — Entièrement responsive (mobile / tablet / desktop)
        ═══════════════════════════════════════════════════════════ */}
        <header className="fixed top-0 left-0 md:left-64 right-0 h-16 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-3 sm:px-5 z-40 shadow-sm transition-all duration-300">

          {/* ── Gauche : burger + logo ── */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
              onClick={() => setSidebarOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo — visible uniquement sur mobile (caché sur md+ car la sidebar prend le relais) */}
            <div className="flex items-center gap-2 md:hidden">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-lg font-bold text-gray-800 dark:text-white tracking-wide">ProJA</span>
            </div>

            {/* Titre page (desktop uniquement) */}
            <div className="hidden md:flex items-center gap-2">
              <span className="text-xl font-light tracking-wider text-gray-700 dark:text-white">ProJA</span>
              <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-xs font-semibold rounded-full border border-blue-100 dark:border-blue-800">
                v1.0
              </span>
            </div>
          </div>

          {/* ── Droite : actions ── */}
          <div className="flex items-center gap-1 sm:gap-2">

            {/* ─── Sélecteur de langue ─── */}
            <div className="relative" ref={useRef(null)}>
              <button
                className={`flex items-center justify-center gap-1.5 h-10 px-2 sm:px-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isChangingLanguage ? 'opacity-60 cursor-not-allowed' : ''}`}
                onClick={() => !isChangingLanguage && setLanguageOpen(prev => !prev)}
                aria-haspopup="true"
                aria-expanded={languageOpen}
                aria-label={t('change_language')}
                disabled={isChangingLanguage}
                title={t('change_language')}
              >
                {isChangingLanguage ? (
                  <svg className="animate-spin h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <>
                    <span
                      style={{
                        backgroundImage: `url(https://flagcdn.com/24x18/${languages.find(l => l.code === currentLanguage)?.flag || 'gb'}.png)`,
                        width: '20px', height: '15px',
                        backgroundSize: 'cover', display: 'inline-block',
                        borderRadius: '2px', boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                        flexShrink: 0,
                      }}
                      aria-hidden="true"
                    />
                    <span className="hidden sm:inline text-xs font-semibold">
                      {languages.find(l => l.code === currentLanguage)?.code?.toUpperCase() || 'FR'}
                    </span>
                    <svg className={`w-3 h-3 transition-transform hidden sm:block ${languageOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </button>

              {/* Dropdown langue */}
              {languageOpen && (
                <div
                  className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-xl py-1 z-[9999] border border-gray-100 dark:border-gray-700 ring-1 ring-black/5"
                  role="menu"
                  onMouseLeave={() => setLanguageOpen(false)}
                >
                  {languages.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors ${
                        currentLanguage === lang.code
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      role="menuitemradio"
                      aria-checked={currentLanguage === lang.code}
                      disabled={isChangingLanguage}
                    >
                      <span style={{
                        backgroundImage: `url(https://flagcdn.com/24x18/${lang.flag}.png)`,
                        width: '20px', height: '15px', backgroundSize: 'cover',
                        display: 'inline-block', borderRadius: '2px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)', flexShrink: 0,
                      }} aria-hidden="true" />
                      <span className="flex-1">{lang.name}</span>
                      {currentLanguage === lang.code && (
                        <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ─── Cloche notifications ─── */}
            <div className="relative">
              <button
                className="relative flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Notifications"
                onClick={() => { setNotifDropdown(d => !d); setProfileDropdown(false); setLanguageOpen(false); }}
                aria-label="Notifications"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notifCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 shadow animate-pulse">
                    {notifCount > 99 ? '99+' : notifCount}
                  </span>
                )}
              </button>

              {/* Dropdown notifications */}
              {notifDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      <span className="font-bold text-blue-700 dark:text-blue-200 text-sm">Notifications</span>
                    </div>
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
                    {notifications.slice(0, 6).map(n => {
                      let message = n.message;
                      const match = n.message.match(/User #(\d+)/);
                      if (match && n.data?.user) {
                        message = message.replace(`User #${match[1]}`, n.data.user.name || `#${match[1]}`);
                      }
                      return (
                        <li
                          key={n.id}
                          className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ${!n.read_at ? 'bg-blue-50/60 dark:bg-blue-900/10' : ''}`}
                          onClick={() => { setSelectedNotif(n); setNotifDropdown(false); if (n.url) window.location.href = n.url; }}
                        >
                          <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${!n.read_at ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 dark:text-gray-100 line-clamp-2">{message}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                              {new Date(n.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
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
              className="flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setDarkMode(dm => !dm)}
              aria-label={darkMode ? 'Désactiver le mode sombre' : 'Activer le mode sombre'}
              title={darkMode ? 'Désactiver le mode sombre' : 'Activer le mode sombre'}
            >
              {darkMode ? (
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m16.66 5.66l-.71-.71M4.05 4.05l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* ─── Profil utilisateur ─── */}
            <div className="relative" ref={profileRef}>
              <button
                className="flex items-center gap-2 h-10 pl-1 pr-2 sm:pr-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                onClick={() => { setProfileDropdown(d => !d); setNotifDropdown(false); setLanguageOpen(false); }}
                aria-label="Menu profil"
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={avatarUrl}
                    alt={userName}
                    className="w-8 h-8 rounded-full border-2 border-blue-400 object-cover shadow-sm"
                  />
                  {/* Point "en ligne" */}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></span>
                </div>
                {/* Nom uniquement sur sm+ */}
                <div className="hidden sm:flex flex-col items-start leading-tight max-w-[120px]">
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate w-full">{userName}</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 capitalize">{isAdmin ? 'Admin' : 'Membre'}</span>
                </div>
                <svg className="w-3.5 h-3.5 text-gray-400 hidden sm:block flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown profil */}
              {profileDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 border border-gray-100 dark:border-gray-700 overflow-hidden">
                  {/* Header du menu */}
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{userName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{isAdmin ? '👑 Administrateur' : '👤 Membre'}</p>
                  </div>

                  <div className="py-1">
                    <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Mon profil
                    </Link>
                    <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Paramètres
                    </Link>
                    {isAdmin && (
                      <Link href="/admin/subscription-plans" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Gestion abonnements
                        <span className="ml-auto text-[10px] bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded-full font-bold">Admin</span>
                      </Link>
                    )}
                    <Link href="/subscription/plans" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      Mon abonnement
                    </Link>
                    <Link href="/remunerations/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Mes rémunérations
                    </Link>
                  </div>

                  <div className="border-t border-gray-100 dark:border-gray-700">
                    <Link
                      href="/logout"
                      method="post"
                      as="button"
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Déconnexion
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        {/* Notification globale */}
        <Notification message={flash.success} type="success" />
        <Notification message={flash.error} type="error" />
        <Notification message={flash.info} type="info" />
        {/* Page content */}
<main className="flex-1 w-full h-full transition-colors pt-16 bg-white dark:bg-gray-900 flex flex-col">
          <div className="flex-1">
            {children}
          </div>
          <footer className="mt-auto border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <GlobalFooter />
          </footer>
        </main>
      </div>

      {/* ─── Bannière d'appel ProJA entrant (visible sur toute page) ─── */}
      {liveKitInvite && !showLiveKitCall && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-emerald-600 text-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 animate-pulse">
          <span className="text-sm font-medium">
            {liveKitInvite.initiatorName} démarre un un appel — {liveKitInvite.projectName}
          </span>
          <button
            onClick={() => { setShowLiveKitCall(true); stopRingtone(); }}
            className="bg-white text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full hover:bg-emerald-50"
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
          title={liveKitInvite.projectName}
          onClose={() => {
            setShowLiveKitCall(false);
            setLiveKitInvite(null);
            fetch(`/projects/${liveKitInvite.projectId}/livekit-call/end`, {
              method: 'POST',
              headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
              },
            }).catch(() => {});
          }}
        />
      )}
    </div>
  );
}