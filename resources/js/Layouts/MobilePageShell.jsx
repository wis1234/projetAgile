import React from 'react';
import { usePage } from '@inertiajs/react';
import MobileLayout from '@/Layouts/MobileLayout';

const titles = {
  Dashboard: 'Accueil',
  'Discussions/Index': 'Discussions',
  'Messages/Index': 'Messages',
  Projects: 'Projets',
  Tasks: 'Taches',
  'Tasks/Index': 'Taches',
  'Tasks/Kanban': 'Kanban',
  Files: 'Fichiers',
  Users: 'Utilisateurs',
  Activities: 'Activite',
  Notifications: 'Notifications',
  Profile: 'Profil',
};

const getPageTitle = (pageName) => {
  if (titles[pageName]) return titles[pageName];
  const leaf = pageName.split('/').filter(Boolean).pop() || 'ProJA';
  return leaf.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const getBackHref = (pageName) => {
  const [section] = pageName.split('/');
  if (pageName.endsWith('/Index')) return '/dashboard';
  if (section === 'Tasks' || section === 'Projects' || section === 'Files' || section === 'Users') return `/${section.toLowerCase()}`;
  if (section === 'Profile') return '/more';
  if (section === 'Messages') return '/messages';
  return '/more';
};

export default function MobilePageShell({ pageName, children, showContextBar = false }) {
  const { auth } = usePage().props;
  const title = getPageTitle(pageName);
  const isDetail = showContextBar || !pageName.endsWith('/Index');

  return (
    <MobileLayout title={title} backHref={isDetail ? getBackHref(pageName) : null} hideBottomNav={!auth?.user}>
      <div className="mobile-page-shell mobile-page-enter mobile-native-content w-full min-w-0 pb-4">
        {showContextBar && (
          <div className="mb-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</span>
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Ecran mobile</span>
          </div>
        )}
        {children}
      </div>
    </MobileLayout>
  );
}
