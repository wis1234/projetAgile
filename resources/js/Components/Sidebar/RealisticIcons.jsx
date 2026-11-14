import React from 'react';

/**
 * Bibliothèque d'icônes réalistes, riches et modernes pour le menu Slack ProJA.
 * Chaque icône bénéficie de dégradés, de reflets, d'ombres portées et de détails soignés.
 */

export const DashboardIcon = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="db-bg" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3B82F6" />
        <stop offset="1" stopColor="#1D4ED8" />
      </linearGradient>
      <linearGradient id="db-bar1" x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#93C5FD" />
        <stop offset="1" stopColor="#3B82F6" />
      </linearGradient>
      <linearGradient id="db-bar2" x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#34D399" />
        <stop offset="1" stopColor="#059669" />
      </linearGradient>
      <linearGradient id="db-bar3" x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#FBBF24" />
        <stop offset="1" stopColor="#D97706" />
      </linearGradient>
    </defs>
    <rect x="2" y="3" width="28" height="26" rx="6" fill="url(#db-bg)" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
    <rect x="6" y="17" width="5" height="9" rx="2" fill="url(#db-bar1)" />
    <rect x="13.5" y="11" width="5" height="15" rx="2" fill="url(#db-bar2)" />
    <rect x="21" y="7" width="5" height="19" rx="2" fill="url(#db-bar3)" />
    <path d="M7 14L14 9L20 12L25 6" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="25" cy="6" r="2" fill="#93C5FD" />
  </svg>
);

export const ProjectsIcon = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="proj-grad" x1="4" y1="6" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6366F1" />
        <stop offset="1" stopColor="#4338CA" />
      </linearGradient>
      <linearGradient id="proj-front" x1="4" y1="12" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#818CF8" />
        <stop offset="1" stopColor="#4F46E5" />
      </linearGradient>
    </defs>
    <path d="M4 8C4 6.89543 4.89543 6 6 6H12.5C13.6046 6 14.5 6.89543 14.5 8V9H26C27.1046 9 28 9.89543 28 11V24C28 25.1046 27.1046 26 26 26H6C4.89543 26 4 25.1046 4 24V8Z" fill="url(#proj-grad)" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3 13C3 11.8954 3.89543 11 5 11H27C28.1046 11 29 11.8954 29 13V24C29 25.1046 28.1046 26 27 26H5C3.89543 26 3 25.1046 3 24V13Z" fill="url(#proj-front)" fillOpacity="0.85" stroke="#A5B4FC" strokeWidth="1.2" />
    <rect x="8" y="15" width="10" height="2.5" rx="1.25" fill="#EEF2FF" />
    <rect x="8" y="19.5" width="6" height="2" rx="1" fill="#C7D2FE" />
    <circle cx="23.5" cy="18.5" r="3" fill="#F43F5E" />
    <path d="M22.5 18.5L23.2 19.2L24.5 17.8" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const SprintsIcon = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="rocket-flame" x1="16" y1="22" x2="16" y2="30" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F59E0B" />
        <stop offset="0.6" stopColor="#EF4444" />
        <stop offset="1" stopColor="#DC2626" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="rocket-body" x1="12" y1="4" x2="20" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38BDF8" />
        <stop offset="1" stopColor="#0284C7" />
      </linearGradient>
    </defs>
    <path d="M16 29C15 26 13 24 16 22C19 24 17 26 16 29Z" fill="url(#rocket-flame)" />
    <path d="M16 3C19 6 22 11 22 18L19 22H13L10 18C10 11 13 6 16 3Z" fill="url(#rocket-body)" stroke="#BAE6FD" strokeWidth="1.2" />
    <circle cx="16" cy="11" r="2.5" fill="#E0F2FE" stroke="#0369A1" strokeWidth="1.2" />
    <path d="M10 17L5 19L7 23L13 22" fill="#0284C7" stroke="currentColor" strokeWidth="1" />
    <path d="M22 17L27 19L25 23L19 22" fill="#0284C7" stroke="currentColor" strokeWidth="1" />
  </svg>
);

export const TasksIcon = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="task-card" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#10B981" />
        <stop offset="1" stopColor="#047857" />
      </linearGradient>
    </defs>
    <rect x="5" y="5" width="22" height="24" rx="4" fill="url(#task-card)" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5" />
    <rect x="11" y="2" width="10" height="5" rx="2" fill="#059669" stroke="#6EE7B7" strokeWidth="1" />
    <circle cx="9.5" cy="12.5" r="2.5" fill="#10B981" />
    <path d="M8.5 12.5L9.3 13.3L10.7 11.7" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="14" y1="12.5" x2="23" y2="12.5" stroke="#A7F3D0" strokeWidth="2" strokeLinecap="round" />
    <circle cx="9.5" cy="18.5" r="2.5" fill="#10B981" />
    <path d="M8.5 18.5L9.3 19.3L10.7 17.7" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="14" y1="18.5" x2="23" y2="18.5" stroke="#A7F3D0" strokeWidth="2" strokeLinecap="round" />
    <circle cx="9.5" cy="24.5" r="2.5" fill="#374151" stroke="#9CA3AF" strokeWidth="1.2" />
    <line x1="14" y1="24.5" x2="20" y2="24.5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const KanbanIcon = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="kb-col" x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#818CF8" stopOpacity="0.25" />
        <stop offset="1" stopColor="#4338CA" stopOpacity="0.4" />
      </linearGradient>
    </defs>
    <rect x="3" y="4" width="7.5" height="24" rx="2.5" fill="url(#kb-col)" stroke="currentColor" strokeWidth="1.2" />
    <rect x="12.25" y="4" width="7.5" height="24" rx="2.5" fill="url(#kb-col)" stroke="currentColor" strokeWidth="1.2" />
    <rect x="21.5" y="4" width="7.5" height="24" rx="2.5" fill="url(#kb-col)" stroke="currentColor" strokeWidth="1.2" />
    {/* Cartes colorées */}
    <rect x="4.5" y="7" width="4.5" height="6" rx="1.5" fill="#60A5FA" />
    <rect x="4.5" y="15" width="4.5" height="7" rx="1.5" fill="#93C5FD" fillOpacity="0.7" />
    <rect x="13.75" y="7" width="4.5" height="9" rx="1.5" fill="#F59E0B" />
    <rect x="13.75" y="18" width="4.5" height="5" rx="1.5" fill="#FBBF24" fillOpacity="0.7" />
    <rect x="23" y="7" width="4.5" height="5" rx="1.5" fill="#10B981" />
    <rect x="23" y="14" width="4.5" height="8" rx="1.5" fill="#34D399" />
  </svg>
);

export const DiscussionsIcon = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="chat-bubble1" x1="2" y1="4" x2="22" y2="20" gradientUnits="userSpaceOnUse">
        <stop stopColor="#8B5CF6" />
        <stop offset="1" stopColor="#6D28D9" />
      </linearGradient>
      <linearGradient id="chat-bubble2" x1="12" y1="12" x2="30" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#EC4899" />
        <stop offset="1" stopColor="#DB2777" />
      </linearGradient>
    </defs>
    <path d="M4 6C4 4.89543 4.89543 4 6 4H20C21.1046 4 22 4.89543 22 6V15C22 16.1046 21.1046 17 20 17H10L5 21V17H6C4.89543 17 4 16.1046 4 15V6Z" fill="url(#chat-bubble1)" stroke="#DDD6FE" strokeWidth="1.2" />
    <circle cx="9" cy="10.5" r="1.5" fill="white" />
    <circle cx="13" cy="10.5" r="1.5" fill="white" />
    <circle cx="17" cy="10.5" r="1.5" fill="white" />
    <path d="M13 14C13 12.8954 13.8954 12 15 12H27C28.1046 12 29 12.8954 29 14V22C29 23.1046 28.1046 24 27 24H25V28L20 24H15C13.8954 24 13 23.1046 13 22V14Z" fill="url(#chat-bubble2)" stroke="#FCE7F3" strokeWidth="1.2" />
    <circle cx="18" cy="18" r="1.25" fill="white" />
    <circle cx="21.5" cy="18" r="1.25" fill="white" />
    <circle cx="25" cy="18" r="1.25" fill="white" />
  </svg>
);

export const MembersIcon = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="mem-grad1" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#06B6D4" />
        <stop offset="1" stopColor="#0E7490" />
      </linearGradient>
      <linearGradient id="mem-grad2" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#3B82F6" />
        <stop offset="1" stopColor="#1E40AF" />
      </linearGradient>
    </defs>
    {/* Membre arrière gauche */}
    <circle cx="9" cy="11" r="3.5" fill="#64748B" stroke="#CBD5E1" strokeWidth="1" />
    <path d="M3 24C3 20.5 5.5 18 9 18C12.5 18 15 20.5 15 24" fill="#475569" stroke="#94A3B8" strokeWidth="1" />
    {/* Membre arrière droite */}
    <circle cx="23" cy="11" r="3.5" fill="#64748B" stroke="#CBD5E1" strokeWidth="1" />
    <path d="M17 24C17 20.5 19.5 18 23 18C26.5 18 29 20.5 29 24" fill="#475569" stroke="#94A3B8" strokeWidth="1" />
    {/* Membre central en premier plan */}
    <circle cx="16" cy="9" r="4.5" fill="url(#mem-grad1)" stroke="#A5F3FC" strokeWidth="1.5" />
    <path d="M9 25C9 21 12 18.5 16 18.5C20 18.5 23 21 23 25" fill="url(#mem-grad2)" stroke="#BFDBFE" strokeWidth="1.5" />
    <circle cx="19" cy="8" r="1.5" fill="#34D399" />
  </svg>
);

export const UsersIcon = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="usr-card" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0284C7" />
        <stop offset="1" stopColor="#0369A1" />
      </linearGradient>
    </defs>
    <rect x="4" y="4" width="24" height="24" rx="4" fill="url(#usr-card)" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="14" r="4" fill="#38BDF8" stroke="#E0F2FE" strokeWidth="1.2" />
    <path d="M6 24C6 20.5 8.5 19 12 19C15.5 19 18 20.5 18 24" fill="#0284C7" stroke="#7DD3FC" strokeWidth="1.2" />
    <line x1="20" y1="12" x2="25" y2="12" stroke="#BAE6FD" strokeWidth="2" strokeLinecap="round" />
    <line x1="20" y1="16" x2="25" y2="16" stroke="#7DD3FC" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="20" y1="20" x2="23" y2="20" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const FilesIcon = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="file-body" x1="6" y1="4" x2="26" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F59E0B" />
        <stop offset="1" stopColor="#D97706" />
      </linearGradient>
      <linearGradient id="file-fold" x1="18" y1="4" x2="26" y2="12" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FDE68A" />
        <stop offset="1" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
    <path d="M7 4C5.89543 4 5 4.89543 5 6V26C5 27.1046 5.89543 28 7 28H25C26.1046 28 27 27.1046 27 26V12L19 4H7Z" fill="url(#file-body)" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.5" />
    <path d="M19 4V10C19 11.1046 19.8954 12 21 12H27L19 4Z" fill="url(#file-fold)" stroke="currentColor" strokeWidth="1.2" />
    <line x1="10" y1="15" x2="22" y2="15" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
    <line x1="10" y1="19" x2="18" y2="19" stroke="#FDE68A" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="10" y1="23" x2="15" y2="23" stroke="#FDE68A" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const ActivitiesIcon = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="act-pulse" x1="2" y1="16" x2="30" y2="16" gradientUnits="userSpaceOnUse">
        <stop stopColor="#10B981" />
        <stop offset="0.5" stopColor="#FBBF24" />
        <stop offset="1" stopColor="#EF4444" />
      </linearGradient>
    </defs>
    <rect x="3" y="4" width="26" height="24" rx="5" fill="#064E3B" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5 16H9L12 9L16 23L20 12L23 17H27" stroke="url(#act-pulse)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="16" cy="23" r="2" fill="#FBBF24" />
    <circle cx="12" cy="9" r="2" fill="#10B981" />
  </svg>
);

export const QuizzesIcon = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="quiz-ring" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#EF4444" />
        <stop offset="1" stopColor="#B91C1C" />
      </linearGradient>
    </defs>
    <circle cx="16" cy="16" r="12" fill="url(#quiz-ring)" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="16" cy="16" r="8" stroke="#F87171" strokeWidth="1.5" />
    <circle cx="16" cy="16" r="4" fill="#EF4444" />
    <circle cx="16" cy="16" r="1.5" fill="#FEF2F2" />
    {/* Fléchette */}
    <path d="M22 6L26 10L20 16L16 20L18 14L22 6Z" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
  </svg>
);

export const RecruitmentIcon = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="rec-case" x1="4" y1="8" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0EA5E9" />
        <stop offset="1" stopColor="#0369A1" />
      </linearGradient>
    </defs>
    <rect x="4" y="9" width="24" height="18" rx="4" fill="url(#rec-case)" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.5" />
    <path d="M11 9V6C11 4.89543 11.8954 4 13 4H19C20.1046 4 21 4.89543 21 6V9" stroke="currentColor" strokeWidth="1.8" />
    <line x1="4" y1="16" x2="28" y2="16" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="3 2" />
    {/* Badge candidat */}
    <circle cx="16" cy="16" r="4.5" fill="#38BDF8" stroke="white" strokeWidth="1.2" />
    <circle cx="16" cy="14.5" r="1.5" fill="white" />
    <path d="M13.5 18C13.5 16.8 14.5 16 16 16C17.5 16 18.5 16.8 18.5 18" fill="white" />
  </svg>
);

export const SubscriptionsIcon = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sub-card" x1="4" y1="6" x2="28" y2="26" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F59E0B" />
        <stop offset="1" stopColor="#B45309" />
      </linearGradient>
      <linearGradient id="star-grad" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#FDE68A" />
        <stop offset="1" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
    <rect x="3" y="7" width="26" height="18" rx="4" fill="url(#sub-card)" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.5" />
    <rect x="3" y="11" width="26" height="3.5" fill="#78350F" fillOpacity="0.6" />
    {/* Étoile de certification */}
    <path d="M22 19L23.2 21.5L26 21.8L24 23.7L24.5 26.5L22 25.1L19.5 26.5L20 23.7L18 21.8L20.8 21.5L22 19Z" fill="url(#star-grad)" stroke="#D97706" strokeWidth="0.8" />
    <rect x="6" y="18" width="5" height="3" rx="1" fill="#FCD34D" />
  </svg>
);

export const RemunerationsIcon = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="coin-gold" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#FBBF24" />
        <stop offset="1" stopColor="#D97706" />
      </linearGradient>
      <linearGradient id="coin-green" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#34D399" />
        <stop offset="1" stopColor="#059669" />
      </linearGradient>
    </defs>
    {/* Pièce arrière */}
    <circle cx="13" cy="14" r="8" fill="url(#coin-gold)" stroke="#FDE68A" strokeWidth="1.5" />
    <circle cx="13" cy="14" r="5.5" stroke="#F59E0B" strokeWidth="1" strokeDasharray="2 2" />
    {/* Pièce avant */}
    <circle cx="19" cy="19" r="8" fill="url(#coin-green)" stroke="#A7F3D0" strokeWidth="1.5" />
    <path d="M19 14.5V23.5M16.5 17C16.5 15.6 17.6 15 19 15C20.4 15 21.5 15.8 21.5 17C21.5 18.5 19 18.8 19 20C19 21.2 17.9 21.8 16.5 21" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const AdminIcon = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="adm-shield" x1="4" y1="3" x2="28" y2="29" gradientUnits="userSpaceOnUse">
        <stop stopColor="#8B5CF6" />
        <stop offset="1" stopColor="#4C1D95" />
      </linearGradient>
      <linearGradient id="sparkle" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#C4B5FD" />
        <stop offset="1" stopColor="#A78BFA" />
      </linearGradient>
    </defs>
    <path d="M16 3L27 7V15C27 21.5 22 26.5 16 29C10 26.5 5 21.5 5 15V7L16 3Z" fill="url(#adm-shield)" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.5" />
    {/* Étoile / étincelle IA au centre */}
    <path d="M16 9L17.8 13.5L22.5 14.5L19 18L19.9 22.5L16 20.2L12.1 22.5L13 18L9.5 14.5L14.2 13.5L16 9Z" fill="url(#sparkle)" stroke="#DDD6FE" strokeWidth="1" />
    <circle cx="16" cy="16" r="1.5" fill="white" />
  </svg>
);

/**
 * Associe une URL ou une clé à son icône réaliste correspondante.
 */
export const getRealisticIcon = (href, className = 'w-5 h-5') => {
  const path = href ? href.toLowerCase() : '';
  if (path === '/dashboard') return <DashboardIcon className={className} />;
  if (path.startsWith('/projects')) return <ProjectsIcon className={className} />;
  if (path.startsWith('/sprints')) return <SprintsIcon className={className} />;
  if (path.startsWith('/tasks')) return <TasksIcon className={className} />;
  if (path.startsWith('/kanban')) return <KanbanIcon className={className} />;
  if (path.startsWith('/discussions')) return <DiscussionsIcon className={className} />;
  if (path.startsWith('/project-users')) return <MembersIcon className={className} />;
  if (path.startsWith('/users')) return <UsersIcon className={className} />;
  if (path.startsWith('/files')) return <FilesIcon className={className} />;
  if (path.startsWith('/activities')) return <ActivitiesIcon className={className} />;
  if (path.startsWith('/quizzes')) return <QuizzesIcon className={className} />;
  if (path.startsWith('/recruitment')) return <RecruitmentIcon className={className} />;
  if (path.startsWith('/remunerations')) return <RemunerationsIcon className={className} />;
  if (path.includes('subscription')) return <SubscriptionsIcon className={className} />;
  if (path.startsWith('/assistant/admin')) return <AdminIcon className={className} />;

  // Icône par défaut élégante
  return <ProjectsIcon className={className} />;
};
