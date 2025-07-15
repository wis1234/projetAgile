import React, { useState, useEffect, useRef } from 'react';
import { Link, usePage } from '@inertiajs/react';
import Notification from '../Components/Notification';
import { router } from '@inertiajs/react';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6m-6 0v6m0-6H7m6 0h6" /></svg>
  ) },
  { href: '/projects', label: 'Projets', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5V6.75A2.25 2.25 0 0 1 5.25 4.5h13.5A2.25 2.25 0 0 1 21 6.75v10.5A2.25 2.25 0 0 1 18.75 19.5H5.25A2.25 2.25 0 0 1 3 17.25V7.5z" /></svg>
  ) },
  { href: '/project-users', label: 'Membres', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 0 0-3-3.87M9 20H4v-2a4 4 0 0 1 3-3.87m9-5.13a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" /></svg>
  ) },
  { href: '/sprints', label: 'Sprints', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg>
  ) },
  { href: '/tasks', label: 'Tâches', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6m9 2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7l5 5v10z" /></svg>
  ) },
  { href: '/kanban', label: 'Kanban', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25A2.25 2.25 0 0 1 6 3h12a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 18 21H6a2.25 2.25 0 0 1-2.25-2.25V5.25ZM9 7.5v9M15 7.5v9" /></svg>
  ) },
  { href: '/files', label: 'Fichiers', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h9a2.25 2.25 0 0 0 2.25-2.25V9h-3.75z" /></svg>
  ) },
  // { href: '/messages', label: 'Messages', icon: (
  //   <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
  // ) },
  { href: '/users', label: 'Utilisateurs', icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 0 0-3-3.87M9 20H4v-2a4 4 0 0 1 3-3.87m9-5.13a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" /></svg>
  ) },
  { href: '/activities', label: "Journal d'activité", icon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a4 4 0 0 1 4-4h4M7 7h.01M7 11h.01M7 15h.01" /></svg>
  ) },
];

export default function AdminLayout({ children }) {
  const { auth, flash = {} } = usePage().props;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [notifDropdown, setNotifDropdown] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifCount, setNotifCount] = useState(0);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const profileRef = useRef();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (auth?.user) {
      fetch('/api/activities/notifications')
        .then(res => res.json())
        .then(data => {
          setNotifications(data);
          setNotifCount(data.length);
        });
    }
  }, [auth?.user]);

  // Notifications temps réel (journal d'activité)
  useEffect(() => {
    if (window.Echo) {
      const channel = window.Echo.channel('activities');
      channel.listen('ActivityCreated', () => {
        fetch('/api/activities/notifications')
          .then(res => res.json())
          .then(data => {
            setNotifications(data);
            setNotifCount(data.length);
          });
      });
      return () => {
        channel.stopListening('ActivityCreated');
      };
    }
  }, []);

  // Marquer toutes les notifications comme lues quand on ouvre le dropdown
  useEffect(() => {
    if (notifDropdown && notifCount > 0) {
      fetch('/api/activities/notifications/mark-read', { method: 'POST' })
        .then(() => {
          setNotifCount(0);
          setNotifications(notifications.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
        });
    }
    // eslint-disable-next-line
  }, [notifDropdown]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const avatarUrl = auth?.user?.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(auth?.user?.name || 'User')}&background=0D8ABC&color=fff`;

  return (
    <div className="min-h-screen flex bg-gray-100 dark:bg-gray-900 transition-colors">
      {/* Sidebar */}
      <aside className="z-40 fixed top-0 left-0 h-screen w-64 bg-white dark:bg-gray-800 flex flex-col py-6 px-4 space-y-6 transition-transform duration-300">
        <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 mb-8 flex items-center justify-between">
          Admin
          <button className="md:hidden text-2xl" onClick={() => setSidebarOpen(false)}>&times;</button>
        </div>
        <nav className="flex-1 space-y-2">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-800 dark:hover:text-blue-200 font-medium transition">
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0 1 12 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" /></svg>
          {auth?.user?.name || 'Admin'}
        </div>
      </aside>
      {/* Overlay for mobile */}
      {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden" onClick={() => setSidebarOpen(false)}></div>}
      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen ml-0 md:ml-64 transition-all duration-300">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow flex items-center justify-between px-6 py-4 sticky top-0 z-20">
          <button className="md:hidden text-2xl mr-2" onClick={() => setSidebarOpen(true)}>&#9776;</button>
          <div className="text-xl font-bold text-blue-700 dark:text-blue-200">Dashboard</div>
          <div className="flex items-center gap-4">
            {/* Notifications internes */}
            <div className="relative">
              <button className="relative" title="Notifications internes" onClick={() => setNotifDropdown(d => !d)}>
                <svg className="w-7 h-7 text-gray-600 dark:text-gray-200" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V5a2 2 0 1 0-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9" /></svg>
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
                <span className="text-gray-600 dark:text-gray-200 font-medium">{auth?.user?.name}</span>
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
        <main className="flex-1 w-full h-full transition-colors p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
} 