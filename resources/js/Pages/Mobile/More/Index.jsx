import React, { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import MobileLayout from '@/Layouts/MobileLayout';
import { unregisterDeviceToken } from '@/Components/PushNotificationManager';

const menuLinks = [
  { href: '/discussions', label: 'discussions', icon: '💬' },
  { href: '/dashboard', label: 'dashboard', icon: '🏠' },
  { href: '/projects', label: 'projects', icon: '📁' },
  { href: '/project-users', label: 'members', icon: '👥' },
  { href: '/sprints', label: 'sprints', icon: '⚡' },
  { href: '/tasks', label: 'tasks', icon: '✅' },
  { href: '/kanban', label: 'task_tracking', icon: '📋' },
  { href: '/files', label: 'files', icon: '📄' },
  { href: '/users', label: 'users', icon: '👤' },
  { href: '/activities', label: 'activity_log', icon: '📊' },
  { href: '/recruitment', label: 'recruitment', icon: '🎯' },
  { href: '/subscription/plans', label: 'my_subscription', icon: '💳' },
  { href: '/remunerations/dashboard', label: 'remunerations', icon: '💰' },
];

export default function MobileMoreIndex() {
  const { t } = useTranslation();
  const { auth } = usePage().props;
  const [darkMode, setDarkMode] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('darkMode') === 'true' : false
  );

  const user = auth?.user || auth;
  const userName = user?.name || 'Utilisateur';
  const avatarUrl = user?.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0D8ABC&color=fff`;

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('darkMode', String(next));
  };

  const handleLogout = async () => {
    try { await unregisterDeviceToken(); } catch { /* ne bloque jamais la déconnexion */ }
    router.post('/logout');
  };

  return (
    <MobileLayout title="Menu" hideBottomNav={false}>
      <div className="py-4 space-y-5">

        {/* Profil */}
        <Link
          href="/profile"
          className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-900/40 active:scale-[0.99] transition-transform"
        >
          <img src={avatarUrl} alt={userName} className="w-12 h-12 rounded-full border-2 border-blue-400 object-cover" />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-gray-900 dark:text-white truncate">{userName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Voir mon profil</p>
          </div>
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        {/* Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
          {menuLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-gray-700 dark:text-gray-200 active:bg-gray-50 dark:active:bg-gray-700/50 transition-colors"
            >
              <span className="text-lg w-6 text-center flex-shrink-0">{link.icon}</span>
              <span className="flex-1">{t(link.label)}</span>
              <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>

        {/* Réglages */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            <span className="text-lg w-6 text-center flex-shrink-0">{darkMode ? '☀️' : '🌙'}</span>
            <span className="flex-1 text-left">{darkMode ? 'Mode clair' : 'Mode sombre'}</span>
            <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${darkMode ? 'bg-blue-600' : 'bg-gray-300'}`}>
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${darkMode ? 'translate-x-4' : 'translate-x-1'}`} />
            </span>
          </button>
          <Link href="/profile" className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-gray-700 dark:text-gray-200 active:bg-gray-50 dark:active:bg-gray-700/50">
            <span className="text-lg w-6 text-center flex-shrink-0">⚙️</span>
            <span className="flex-1">Paramètres</span>
            <svg className="w-4 h-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Déconnexion */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold text-sm active:scale-[0.99] transition-transform"
        >
          <span>🚪</span> Déconnexion
        </button>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500">ProJA v2.3.1</p>
      </div>
    </MobileLayout>
  );
}