import React from 'react';

/**
 * Bibliothèque d'icônes vectorielles professionnelles, pures et réalistes pour ProJA.
 * Design épuré, trait uniforme 1.75px, proportions harmonisées, adaptées clair / sombre.
 */

const baseSvgProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export const DashboardIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} {...baseSvgProps}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
);

export const HomeIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} {...baseSvgProps}>
    <path d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 20v-9.5z" />
    <path d="M9 21V12h6v9" />
  </svg>
);

export const ProjectsIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} {...baseSvgProps}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
  </svg>
);

export const SprintsIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} {...baseSvgProps}>
    <circle cx="12" cy="12" r="9" />
    <polyline points="12 6 12 12 16 14" />
    <path d="M19.5 4.5l2-2" />
  </svg>
);

export const TasksIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} {...baseSvgProps}>
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

export const KanbanIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} {...baseSvgProps}>
    <rect x="3" y="4" width="5" height="16" rx="1" />
    <rect x="10" y="4" width="5" height="11" rx="1" />
    <rect x="17" y="4" width="5" height="14" rx="1" />
  </svg>
);

export const DiscussionsIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} {...baseSvgProps}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

export const AnnouncementsIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} {...baseSvgProps}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    <path d="M2 8c0-3.3 2.7-6 6-6" opacity="0.4" />
  </svg>
);

export const MembersIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} {...baseSvgProps}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const UsersIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} {...baseSvgProps}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" y1="8" x2="19" y2="14" />
    <line x1="22" y1="11" x2="16" y2="11" />
  </svg>
);

export const FilesIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} {...baseSvgProps}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="9" y1="13" x2="15" y2="13" />
    <line x1="9" y1="17" x2="13" y2="17" />
  </svg>
);

export const ActivitiesIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} {...baseSvgProps}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

export const QuizzesIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} {...baseSvgProps}>
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);

export const RecruitmentIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} {...baseSvgProps}>
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    <circle cx="12" cy="13" r="2.5" />
    <path d="M8 18c0-1.8 1.8-2.5 4-2.5s4 .7 4 2.5" />
  </svg>
);

export const SubscriptionsIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} {...baseSvgProps}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
    <circle cx="7" cy="15" r="1" />
  </svg>
);

export const RemunerationsIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} {...baseSvgProps}>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="3" />
    <path d="M6 12h.01M18 12h.01" />
  </svg>
);

export const AdminIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} {...baseSvgProps}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

/**
 * Associe une URL ou une clé à son icône vectorielle nette correspondante.
 */
export const getRealisticIcon = (href, className = 'w-5 h-5') => {
  const path = href ? href.toLowerCase() : '';
  if (path === '/dashboard') return <DashboardIcon className={className} />;
  if (path.startsWith('/projects')) return <ProjectsIcon className={className} />;
  if (path.startsWith('/sprints')) return <SprintsIcon className={className} />;
  if (path.startsWith('/tasks')) return <TasksIcon className={className} />;
  if (path.startsWith('/kanban')) return <KanbanIcon className={className} />;
  if (path.startsWith('/discussions')) return <DiscussionsIcon className={className} />;
  if (path.startsWith('/announcements')) return <AnnouncementsIcon className={className} />;
  if (path.startsWith('/project-users')) return <MembersIcon className={className} />;
  if (path.startsWith('/users')) return <UsersIcon className={className} />;
  if (path.startsWith('/files')) return <FilesIcon className={className} />;
  if (path.startsWith('/activities')) return <ActivitiesIcon className={className} />;
  if (path.startsWith('/quizzes')) return <QuizzesIcon className={className} />;
  if (path.startsWith('/recruitment')) return <RecruitmentIcon className={className} />;
  if (path.startsWith('/remunerations')) return <RemunerationsIcon className={className} />;
  if (path.includes('subscription')) return <SubscriptionsIcon className={className} />;
  if (path.startsWith('/assistant/admin')) return <AdminIcon className={className} />;

  return <ProjectsIcon className={className} />;
};
