import React, { useState, useEffect, useRef } from 'react';
import { Link, usePage } from '@inertiajs/react';
import Notification from '../Components/Notification';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

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
  
  // Available languages with their display names and flag codes
  const languages = [
    { code: 'fr', name: 'Français', flag: 'fr' },
    { code: 'en', name: 'English', flag: 'gb' }
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
        {/* Header */}
        <header className="fixed top-0 left-0 md:left-64 right-0 h-16 bg-white dark:bg-gray-800 bg-opacity-100 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 sm:px-6 z-40 transition-all duration-300">
          <button 
            className="md:hidden text-2xl mr-2 text-gray-600 dark:text-gray-200" 
            onClick={() => setSidebarOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center">
            <span className="text-xl md:text-2xl font-light tracking-wider text-gray-700 dark:text-white">
              ProJA
            </span>
            <span className="ml-2 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-xs font-medium rounded-full border border-blue-100 dark:border-blue-800">
              v1.0
            </span>
          </div>
          <div className="flex items-center gap-4 dark:text-gray-200">
            {/* Language Switcher */}
            <div className="relative z-[60] group" ref={useRef(null)}>
              <button 
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isChangingLanguage ? 'opacity-70 cursor-not-allowed' : ''}`}
                onClick={() => !isChangingLanguage && setLanguageOpen(prev => !prev)}
                onBlur={() => setTimeout(() => setLanguageOpen(false), 200)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setLanguageOpen(false);
                  if (e.key === 'ArrowDown' && !languageOpen) setLanguageOpen(true);
                }}
                aria-haspopup="true"
                aria-expanded={languageOpen}
                aria-label={t('change_language')}
                disabled={isChangingLanguage}
                title={t('change_language')}
              >
                {isChangingLanguage ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="sr-only">{t('changing_language')}</span>
                  </>
                ) : (
                  <>
                    <span className="fi" style={{ 
                      backgroundImage: `url(https://flagcdn.com/24x18/${languages.find(lang => lang.code === currentLanguage)?.flag || 'gb'}.png)`,
                      width: '20px',
                      height: '15px',
                      backgroundSize: 'cover',
                      display: 'inline-block',
                      borderRadius: '2px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }} aria-hidden="true"></span>
                    <span className="hidden sm:inline">
                      {languages.find(lang => lang.code === currentLanguage)?.name || 'English'}
                    </span>
                    <span className="sr-only">{t('current_language')}: {languages.find(lang => lang.code === currentLanguage)?.name || 'English'}</span>
                  </>
                )}
                {!isChangingLanguage && (
                  <svg 
                    className={`w-4 h-4 transition-transform ${languageOpen ? 'transform rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
              {languageOpen && (
                <div 
                  className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-[9999] border border-gray-200 dark:border-gray-700"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="language-menu"
                  onMouseEnter={() => setLanguageOpen(true)}
                  onMouseLeave={() => setLanguageOpen(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setLanguageOpen(false);
                  }}
                >
                  {languages.map((language) => (
                    <button 
                      key={language.code}
                      onClick={() => changeLanguage(language.code)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          changeLanguage(language.code);
                        }
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 ${
                        currentLanguage === language.code 
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      role="menuitemradio"
                      aria-checked={currentLanguage === language.code}
                      disabled={isChangingLanguage}
                      tabIndex={0}
                    >
                      <span 
                        className="fi" 
                        style={{ 
                          backgroundImage: `url(https://flagcdn.com/24x18/${language.flag}.png)`,
                          width: '20px',
                          height: '15px',
                          backgroundSize: 'cover',
                          display: 'inline-block',
                          borderRadius: '2px',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                        }}
                        aria-hidden="true"
                      ></span>
                      <span>{language.name}</span>
                      {currentLanguage === language.code && (
                        <span className="ml-auto">
                          <svg 
                            className="w-4 h-4 text-blue-500" 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                          >
                            <path 
                              fillRule="evenodd" 
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                              clipRule="evenodd" 
                            />
                          </svg>
                          <span className="sr-only">{t('selected')}</span>
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications internes */}
            <div className="relative">
              <button className="relative" title="Notifications internes" onClick={() => setNotifDropdown(d => !d)}>
                <svg className="w-7 h-7 text-gray-600 dark:text-gray-200" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V5a2 2 0 1 0-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                {notifCount > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5 animate-pulse">{notifCount}</span>}
              </button>
              {notifDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded shadow-lg z-50 max-h-96 overflow-y-auto">
                  <div className="p-4 border-b font-bold text-blue-700 dark:text-blue-200">Notifications</div>
                  <ul>
                    {notifications.length === 0 && <li className="p-4 text-gray-500 dark:text-gray-300">Aucune notification</li>}
                    {notifications.slice(0, 5).map(n => {
                      // Extraire l'ID utilisateur du message si présent
                      const userIdMatch = n.message.match(/User #(\d+)/);
                      let message = n.message;
                      
                      // Remplacer l'ID utilisateur par le nom si disponible
                      if (userIdMatch && userIdMatch[1] && n.data?.user) {
                        message = message.replace(`User #${userIdMatch[1]}`, n.data.user.name || `Utilisateur #${userIdMatch[1]}`);
                      }
                      
                      return (
                        <li
                          key={n.id}
                          className={`p-4 border-b last:border-b-0 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50 ${!n.read_at ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                          onClick={() => {
                            setSelectedNotif(n);
                            setNotifDropdown(false);
                            if (n.url) {
                              window.location.href = n.url;
                            }
                          }}
                        >
                          <div className="flex items-start">
                            <div className="flex-shrink-0 pt-0.5">
                              <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </div>
                            <div className="ml-3 flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {message}
                              </p>
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {new Date(n.created_at).toLocaleString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="p-2 text-center border-t">
                    <Link href="/activities" className="text-blue-700 hover:underline font-semibold">Voir tout le journal d'activité</Link>
                  </div>
                </div>
              )}
              {/* Détail notification */}
              {selectedNotif && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-md p-6 relative animate-fade-in">
                    <button onClick={() => setSelectedNotif(null)} className="absolute top-2 right-3 text-2xl text-gray-400 hover:text-gray-700">&times;</button>
                    <h2 className="text-xl font-bold mb-2 text-blue-700 dark:text-blue-200">Détail de la notification</h2>
                    <div className="mb-4">
                      <div className="flex items-center mb-2">
                        <div className="flex-shrink-0">
                          <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </div>
                        <h3 className="ml-2 text-lg font-semibold text-gray-900 dark:text-white">
                          {(() => {
                            let message = selectedNotif.message;
                            if (selectedNotif.data?.user) {
                              message = message.replace(/User #(\d+)/, selectedNotif.data.user.name || 'Utilisateur');
                            }
                            return message;
                          })()}
                        </h3>
                      </div>
                      <div className="ml-8">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          {new Date(selectedNotif.created_at).toLocaleString('fr-FR', {
                            weekday: 'long',
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        
                        {selectedNotif.data && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Détails :</h4>
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm">
                              {selectedNotif.data.user && (
                                <p className="mb-1">
                                  <span className="font-medium text-gray-700 dark:text-gray-300">Utilisateur :</span>{' '}
                                  <span className="text-gray-900 dark:text-white">
                                    {selectedNotif.data.user.name || 'Inconnu'}
                                    {selectedNotif.data.user.email ? ` (${selectedNotif.data.user.email})` : ''}
                                  </span>
                                </p>
                              )}
                              {selectedNotif.data.subject && (
                                <p className="mb-1">
                                  <span className="font-medium text-gray-700 dark:text-gray-300">Sujet :</span>{' '}
                                  <span className="text-gray-900 dark:text-white">{selectedNotif.data.subject}</span>
                                </p>
                              )}
                              {selectedNotif.data.changes && (
                                <div className="mt-2">
                                  <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Modifications :</p>
                                  <ul className="space-y-1">
                                    {Object.entries(selectedNotif.data.changes).map(([key, value]) => (
                                      <li key={key} className="flex">
                                        <span className="font-medium text-gray-700 dark:text-gray-300 w-1/3">{key} :</span>
                                        <span className="text-gray-900 dark:text-white flex-1">
                                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Dark mode toggle */}
            <button 
              className="ml-2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              onClick={() => setDarkMode(dm => !dm)} 
              aria-label={darkMode ? "Désactiver le mode sombre" : "Activer le mode sombre"}
              title={darkMode ? "Désactiver le mode sombre" : "Activer le mode sombre"}
            >
              {darkMode ? (
                <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m16.66 5.66l-.71-.71M4.05 4.05l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            {/* Profil & menu */}
            <div className="relative" ref={profileRef}>
              <button className="flex items-center gap-2 focus:outline-none" onClick={() => setProfileDropdown(d => !d)}>
                <img src={avatarUrl} alt="avatar" className="w-9 h-9 rounded-full border-2 border-blue-400 shadow" />
                <span className="text-gray-600 dark:text-gray-200 font-medium">{userName}</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              {profileDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded shadow-lg z-50">
                  <Link href="/profile" className="block px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900 text-gray-700 dark:text-gray-200">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Mon profil
                    </div>
                  </Link>
                  <Link href="/profile" className="block px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900 text-gray-700 dark:text-gray-200">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Paramètres
                    </div>
                  </Link>
                  {isAdmin && (
                    <Link 
                      href="/admin/subscription-plans" 
                      className="block px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900 text-gray-700 dark:text-gray-200"
                    >
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Gestion des abonnements
                      </div>
                    </Link>
                  )}
                  <Link href="/subscription/plans" className="block px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900 text-gray-700 dark:text-gray-200">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 3v2m3-2v2m3-2v2m3-2v2m3-2v2m-18 8h18M7 17v-2m3 2v-2m3 2v-2m3 2v-2m3 2v-2" />
                      </svg>
                      Mon abonnement
                    </div>
                  </Link>
                  <Link href="/remunerations/dashboard" className="block px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900 text-gray-700 dark:text-gray-200">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Mes rémunérations
                    </div>
                  </Link>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                  <Link 
                    href="/logout" 
                    method="post" 
                    as="button" 
                    className="block w-full text-left px-4 py-3 text-red-700 dark:text-red-200 hover:bg-red-50 dark:hover:bg-red-900"
                  >
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Déconnexion
                    </div>
                  </Link>
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
        <main className="flex-1 w-full h-full transition-colors pt-16 bg-white dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}