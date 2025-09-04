import React, { useState, useEffect, useRef } from 'react';
import { Link, usePage } from '@inertiajs/react';
import Notification from '../Components/Notification';
import { router } from '@inertiajs/react';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6m-6 0v6m0-6H7m6 0h6" /></svg>
  ) },
  { href: '/projects', label: 'Projets', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44z" /></svg>
  ) },
  { href: '/project-users', label: 'Membres', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>
  ) },
  { href: '/sprints', label: 'Sprints', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg>
  ) },
  { href: '/tasks', label: 'Tâches', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6m9 2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7l5 5v10z" /></svg>
  ) },
  { href: '/kanban', label: 'Suivi des tâches', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25A2.25 2.25 0 0 1 6 3h12a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 18 21H6a2.25 2.25 0 0 1-2.25-2.25V5.25ZM9 7.5v9M15 7.5v9" /></svg>
  ) },
  { href: '/files', label: 'Fichiers', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h9a2.25 2.25 0 0 0 2.25-2.25V9h-3.75z" /></svg>
  ) },
  { href: '/users', label: 'Utilisateurs', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 0 0-3-3.87M9 20H4v-2a4 4 0 0 1 3-3.87m9-5.13a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" /></svg>
  ) },
  { href: '/activities', label: "Journal d'activité", icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a4 4 0 0 1 4-4h4M7 7h.01M7 11h.01M7 15h.01" /></svg>
  ) },
  { href: '/recruitment', label: 'Recrutement', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V9m18 0V9a2.25 2.25 0 0 0-2.25-2.25H15M3 9l9-6 9 6m-18 0a2.25 2.25 0 0 0 2.25 2.25h13.5A2.25 2.25 0 0 0 21 9m-18 0V9a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 9v1.5m-18 0V9a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 9v1.5m-9-3h.008v.008H12V7.5zm0 3h.008v.008H12v-.008zm0 3h.008v.008H12v-.008z" />
    </svg>
  ) },
];

const Loader = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-900 bg-opacity-90 transition-opacity duration-300">
    <div className="relative">
      <div className="flex flex-col items-center">
        <div className="relative w-20 h-20">
          {/* Animation de cercle extérieur */}
          <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-blue-400 border-b-blue-300 border-l-blue-400 animate-spin"></div>
          
          {/* Logo ou initiale au centre */}
          <div className="absolute inset-2 flex items-center justify-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              PROJA
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function AdminLayout({ children }) {
  const { auth, flash = {}, appName } = usePage().props;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [notifDropdown, setNotifDropdown] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifCount, setNotifCount] = useState(0);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const profileRef = useRef();
  const [globalLoading, setGlobalLoading] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

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

  // Get user data from auth object (handles both auth.user and direct auth properties)
  const user = auth?.user || auth;
  const userName = user?.name || 'Utilisateur';
  const avatarUrl = user?.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0D8ABC&color=fff`;
  
  // Debug log to check user data
  console.log('Auth data:', auth);
  console.log('User data:', user);

  return (
    <div className="min-h-screen flex bg-gray-100 dark:bg-gray-900 transition-colors">
      {globalLoading && <Loader />}
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-screen w-64 bg-gradient-to-b from-indigo-900 to-blue-800 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-all duration-300 z-50 flex flex-col shadow-xl`}>
        {/* Logo */}
        <div className="flex items-center justify-between h-20 px-6">
          <div className="flex items-center space-x-3">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xl font-bold text-white">PROJA</span>
          </div>
          <button className="md:hidden text-white/70 hover:text-white transition-colors" onClick={() => setSidebarOpen(false)}>
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
                  ? 'bg-white/10 text-white shadow-lg'
                  : 'text-white/80 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="text-lg">
                {link.icon || (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </span>
              <span className="font-medium">{link.label}</span>
              {route().current(link.href.replace(/^\//, '')) && (
                <span className="ml-auto w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
              )}
            </Link>
          ))}
        </nav>

        {/* Version */}
        <div className="p-4 border-t border-white/10 text-center">
          <div className="text-sm font-medium text-white/60">
            PROJA v1.0
          </div>
        </div>
      </aside>
      {/* Overlay for mobile */}
      {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-30 z-40 md:hidden" onClick={() => setSidebarOpen(false)}></div>}
      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen ml-0 md:ml-64 transition-all duration-300">
        {/* Header */}
        <header className="fixed top-0 left-0 md:left-64 right-0 h-16 bg-white bg-opacity-100 border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 z-40 transition-all duration-300">
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
            <span className="text-xl md:text-2xl font-light tracking-wider text-gray-700 dark:text-gray-200">
              DASHBOARD
            </span>
            <span className="ml-2 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-xs font-medium rounded-full border border-blue-100 dark:border-blue-800">
              v1.0
            </span>
          </div>
          <div className="flex items-center gap-4">
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
                    {notifications.slice(0, 5).map(n => (
                      <li
                        key={n.id}
                        className={`p-4 border-b last:border-b-0 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 ${!n.read_at ? 'bg-blue-50 dark:bg-blue-900' : ''}`}
                        onClick={() => {
                          setSelectedNotif(n);
                          setNotifDropdown(false);
                          if (n.url) {
                            window.location.href = n.url;
                          }
                        }}
                      >
                        <div className={`font-semibold text-gray-700 dark:text-gray-200`}>{n.message}</div>
                        <div className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</div>
                      </li>
                    ))}
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
                    <div className="mb-2 font-semibold">{selectedNotif.message}</div>
                    <div className="text-sm text-gray-500 mb-2">{new Date(selectedNotif.created_at).toLocaleString()}</div>
                    <pre className="bg-gray-100 dark:bg-gray-800 rounded p-3 text-xs overflow-x-auto mt-2">{JSON.stringify(selectedNotif.data, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
            {/* Dark mode toggle */}
            <button className="ml-2" onClick={() => setDarkMode(dm => !dm)} title="Mode sombre/clair">
              {darkMode ? (
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m16.66 5.66l-.71-.71M4.05 4.05l-.71-.71M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" /></svg>
              ) : (
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-200" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" /></svg>
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
                  <Link href="/profile" className="block px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900 text-gray-700 dark:text-gray-200">Mon profil</Link>
                  <Link href="/profile" className="block px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900 text-gray-700 dark:text-gray-200">Paramètres</Link>
                  <Link href="/logout" method="post" as="button" className="block w-full text-left px-4 py-3 text-red-700 dark:text-red-200 hover:bg-red-50 dark:hover:bg-red-900">Déconnexion</Link>
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
        <main className="flex-1 w-full h-full transition-colors pt-16">
          {children}
        </main>
      </div>
    </div>
  );
}