import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
  DashboardIcon,
  ProjectsIcon,
  SprintsIcon,
  TasksIcon,
  KanbanIcon,
  DiscussionsIcon,
  MembersIcon,
  UsersIcon,
  FilesIcon,
  ActivitiesIcon,
  QuizzesIcon,
  RecruitmentIcon,
  SubscriptionsIcon,
  RemunerationsIcon,
  AdminIcon,
  getRealisticIcon,
} from './RealisticIcons';

/**
 * Pôles principaux pour le rail gauche Slack ProJA
 */
const POLES = [
  {
    key: 'workspace',
    label: 'Projets',
    fullTitle: 'Projets & Agilité',
    tag: 'Agile',
    accentColor: 'from-blue-500 to-indigo-600',
    icon: (cls) => <ProjectsIcon className={cls} />,
    hrefs: ['/projects', '/sprints', '/tasks', '/kanban'],
  },
  {
    key: 'team',
    label: 'Équipe',
    fullTitle: 'Collaboration & Équipe',
    tag: 'Collab',
    accentColor: 'from-purple-500 to-pink-600',
    icon: (cls) => <DiscussionsIcon className={cls} />,
    hrefs: ['/discussions', '/project-users', '/users', '/files'],
  },
  {
    key: 'pilotage',
    label: 'Accueil',
    fullTitle: 'Pilotage & Accueil',
    tag: 'Live',
    accentColor: 'from-emerald-500 to-teal-600',
    icon: (cls) => <DashboardIcon className={cls} />,
    hrefs: ['/dashboard', '/activities'],
  },
  {
    key: 'skills',
    label: 'Quiz',
    fullTitle: 'Évaluations & Quiz',
    tag: 'Test',
    accentColor: 'from-red-500 to-rose-600',
    icon: (cls) => <QuizzesIcon className={cls} />,
    hrefs: ['/quizzes'],
  },
  {
    key: 'management',
    label: 'Gestion',
    fullTitle: 'Ressources & Gestion',
    tag: 'RH',
    accentColor: 'from-amber-500 to-orange-600',
    icon: (cls) => <RecruitmentIcon className={cls} />,
    hrefs: ['/recruitment', '/remunerations', '/subscription/plans'],
  },
  {
    key: 'admin',
    label: 'Admin',
    fullTitle: 'Administration Système',
    tag: 'Admin',
    accentColor: 'from-violet-600 to-indigo-800',
    icon: (cls) => <AdminIcon className={cls} />,
    hrefs: ['/assistant/admin'],
  },
];

/**
 * Groupage complet et logique des sous-sections pour le panneau secondaire
 */
const GROUPS_CONFIG = [
  {
    key: 'workspace',
    poleKey: 'workspace',
    label: 'Projets & Agilité',
    icon: (cls) => <ProjectsIcon className={cls} />,
    hrefs: ['/projects', '/sprints', '/tasks', '/kanban'],
  },
  {
    key: 'team',
    poleKey: 'team',
    label: 'Communication & Équipe',
    icon: (cls) => <DiscussionsIcon className={cls} />,
    hrefs: ['/discussions', '/project-users', '/users', '/files'],
  },
  {
    key: 'pilotage',
    poleKey: 'pilotage',
    label: 'Pilotage & Accueil',
    icon: (cls) => <DashboardIcon className={cls} />,
    hrefs: ['/dashboard', '/activities'],
  },
  {
    key: 'skills',
    poleKey: 'skills',
    label: 'Évaluations',
    icon: (cls) => <QuizzesIcon className={cls} />,
    hrefs: ['/quizzes'],
  },
  {
    key: 'management',
    poleKey: 'management',
    label: 'Gestion & RH',
    icon: (cls) => <RecruitmentIcon className={cls} />,
    hrefs: ['/recruitment', '/remunerations', '/subscription/plans'],
  },
  {
    key: 'admin',
    poleKey: 'admin',
    label: 'Administration',
    icon: (cls) => <AdminIcon className={cls} />,
    hrefs: ['/assistant/admin'],
  },
];

function Sidebar({ links, isLinkActive, collapsed, onToggleCollapse, open, onClose, t }) {
  const { auth } = usePage().props;
  const user = auth?.user || auth;
  const userName = user?.name || 'Utilisateur';
  const avatarUrl =
    user?.profile_photo_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0D8ABC&color=fff`;

  // Construire les sections réelles en fonction des liens autorisés/disponibles
  const sections = useMemo(() => {
    const used = new Set();
    const result = GROUPS_CONFIG.map((group) => {
      const items = group.hrefs
        .map((href) => links.find((l) => l.href === href))
        .filter(Boolean);
      items.forEach((i) => used.add(i.href));
      return {
        key: group.key,
        poleKey: group.poleKey,
        label: group.label,
        icon: group.icon,
        items,
      };
    }).filter((s) => s.items.length > 0);

    const rest = links.filter((l) => !used.has(l.href));
    if (rest.length > 0) {
      result.push({
        key: 'other',
        poleKey: 'workspace',
        label: 'Autres modules',
        icon: (cls) => <ProjectsIcon className={cls} />,
        items: rest,
      });
    }
    return result;
  }, [links]);

  // Déterminer quel pôle correspond à la page active courante
  const activePoleFromUrl = useMemo(() => {
    for (const pole of POLES) {
      const match = links.some((l) => pole.hrefs.includes(l.href) && isLinkActive(l));
      if (match) return pole.key;
    }
    return 'workspace';
  }, [links, isLinkActive]);

  // Pôle sélectionné dans le rail (par défaut le pôle actif ou 'all' pour tout voir)
  const [selectedPole, setSelectedPole] = useState(activePoleFromUrl);
  const [viewMode, setViewMode] = useState('filtered'); // 'filtered' (pôle choisi) ou 'all' (toutes les sections)
  const [tip, setTip] = useState(null);

  // Synchroniser le pôle quand la page active change
  useEffect(() => {
    setSelectedPole(activePoleFromUrl);
  }, [activePoleFromUrl]);

  // Fermeture sur Échap (mobile)
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const showTip = (e, label) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTip({ label, top: rect.top + rect.height / 2, left: rect.right + 10 });
  };
  const hideTip = () => setTip(null);

  // Gestion du clic sur un pôle dans le rail
  const handlePoleClick = useCallback(
    (poleKey) => {
      setSelectedPole(poleKey);
      setViewMode('filtered');
      if (collapsed) {
        onToggleCollapse(); // Déplie le panneau secondaire pour afficher le détail
      }
    },
    [collapsed, onToggleCollapse]
  );

  // Filtrage des sections à afficher dans la colonne 2
  const visibleSections = useMemo(() => {
    if (viewMode === 'all') return sections;
    const filtered = sections.filter((s) => s.poleKey === selectedPole);
    return filtered.length > 0 ? filtered : sections;
  }, [sections, viewMode, selectedPole]);

  // Pôle actuellement mis en avant
  const currentPoleInfo = useMemo(() => {
    return POLES.find((p) => p.key === selectedPole) || POLES[0];
  }, [selectedPole]);

  // Rendu d'un lien dans le panneau secondaire avec icône réaliste
  const renderItem = (link) => {
    const active = isLinkActive(link);
    const label = t(link.label);
    const RealisticIconComp = getRealisticIcon(link.href, 'w-5 h-5 flex-shrink-0');

    return (
      <Link
        key={link.href}
        href={link.href}
        onClick={onClose}
        aria-current={active ? 'page' : undefined}
        aria-label={label}
        className={[
          'group relative flex h-10 items-center gap-3 rounded-xl px-3 text-[13.5px] font-medium outline-none',
          'transition-all duration-150 motion-reduce:transition-none select-none',
          'focus-visible:ring-2 focus-visible:ring-blue-400',
          active
            ? 'bg-white text-blue-900 font-bold shadow-md shadow-black/25 dark:bg-blue-600 dark:text-white'
            : 'text-blue-100/80 hover:bg-white/10 hover:text-white active:scale-[0.99]',
        ].join(' ')}
      >
        {/* Indicateur lumineux gauche */}
        {active && (
          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-blue-600 dark:bg-white" />
        )}

        {/* Icône réaliste */}
        <span
          className={`flex h-6 w-6 flex-shrink-0 items-center justify-center transition-transform duration-150 group-hover:scale-110 ${
            active ? 'scale-105' : 'opacity-90 group-hover:opacity-100'
          }`}
        >
          {RealisticIconComp}
        </span>

        {/* Libellé */}
        <span className="truncate tracking-tight flex-1">{label}</span>

        {/* Badge actif discret style Slack */}
        {active && (
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-white flex-shrink-0 animate-pulse" />
        )}
      </Link>
    );
  };

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════
          ASIDE DOUBLE-COLONNE TYPE SLACK (ProJA)
          - Colonne 1 : Rail d'icônes principal gauche (68px)
          - Colonne 2 : Panneau secondaire de navigation détaillée (220px)
          - Total déployé : 288px (18rem / w-72)
          - Total replié : 68px (4.25rem / w-[4.25rem])
      ══════════════════════════════════════════════════════════════════ */}
      <aside
        aria-label="Navigation principale Slack ProJA"
        className={[
          'fixed inset-y-0 left-0 z-50 flex text-white shadow-2xl',
          'transition-[width,transform] duration-300 ease-in-out motion-reduce:transition-none',
          'md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'md:w-[4.25rem] w-72' : 'md:w-72 w-80',
        ].join(' ')}
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        {/* ════════════════════════════════════════════════════════════════
            COLONNE 1 : RAIL SLACK (Icônes principales & Profil)
        ════════════════════════════════════════════════════════════════ */}
        <div
          className="w-[4.25rem] flex-shrink-0 flex flex-col items-center justify-between py-3 bg-[#0a0e1c] dark:bg-[#070913] border-r border-white/10 z-20 select-none"
        >
          {/* Haut du Rail : Logo Workspace ProJA */}
          <div className="flex flex-col items-center gap-2">
            <Link
              href="/dashboard"
              onClick={onClose}
              onMouseEnter={(e) => showTip(e, 'ProJA Workspace')}
              onMouseLeave={hideTip}
              className="group relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 text-white font-extrabold shadow-lg shadow-blue-600/30 ring-1 ring-white/30 transition-transform hover:scale-105 active:scale-95"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </Link>

            {/* Séparateur discret */}
            <div className="w-8 h-px bg-white/15 my-1" />
          </div>

          {/* Centre du Rail : Boutons des grands pôles Slack */}
          <nav className="flex-1 w-full flex flex-col items-center gap-1.5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1">
            {POLES.map((pole) => {
              // Vérifie si ce pôle est disponible dans les liens de l'utilisateur
              const isAvailable = pole.hrefs.some((href) => links.some((l) => l.href === href));
              if (!isAvailable) return null;

              const isSelected = selectedPole === pole.key && viewMode === 'filtered';
              const hasActiveChild = pole.hrefs.some((href) => {
                const link = links.find((l) => l.href === href);
                return link ? isLinkActive(link) : false;
              });

              return (
                <button
                  key={pole.key}
                  type="button"
                  onClick={() => handlePoleClick(pole.key)}
                  onMouseEnter={(e) => showTip(e, pole.fullTitle)}
                  onMouseLeave={hideTip}
                  aria-label={pole.fullTitle}
                  className={[
                    'group relative flex flex-col items-center justify-center w-full py-1.5 px-1 outline-none transition-all duration-150',
                    isSelected ? 'text-white' : 'text-blue-100/70 hover:text-white',
                  ].join(' ')}
                >
                  {/* Barre d'activation verticale Slack sur le bord gauche */}
                  {(isSelected || hasActiveChild) && (
                    <span
                      className={[
                        'absolute left-0 w-1 rounded-r-full transition-all duration-200',
                        isSelected ? 'h-8 bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]' : 'h-4 bg-white/40',
                      ].join(' ')}
                    />
                  )}

                  {/* Boîte d'icône */}
                  <span
                    className={[
                      'flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-150',
                      isSelected
                        ? 'bg-blue-600/30 text-white shadow-inner ring-1 ring-blue-400/50 scale-105'
                        : 'hover:bg-white/10 group-hover:scale-105',
                    ].join(' ')}
                  >
                    {pole.icon('w-6 h-6')}
                  </span>

                  {/* Micro-libellé sous l'icône style Slack moderne */}
                  <span
                    className={`mt-1 text-[10px] font-semibold tracking-tight transition-colors ${
                      isSelected ? 'text-blue-200 font-bold' : 'text-white/60 group-hover:text-white'
                    }`}
                  >
                    {pole.label}
                  </span>
                </button>
              );
            })}

            {/* Bouton "Tous les modules" */}
            <button
              type="button"
              onClick={() => {
                setViewMode('all');
                if (collapsed) onToggleCollapse();
              }}
              onMouseEnter={(e) => showTip(e, 'Vue d’ensemble (Tous les modules)')}
              onMouseLeave={hideTip}
              aria-label="Tous les modules"
              className={[
                'group relative flex flex-col items-center justify-center w-full py-1.5 px-1 mt-1 outline-none transition-all',
                viewMode === 'all' ? 'text-white' : 'text-blue-100/60 hover:text-white',
              ].join(' ')}
            >
              {viewMode === 'all' && (
                <span className="absolute left-0 w-1 h-8 rounded-r-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              )}
              <span
                className={[
                  'flex h-9 w-9 items-center justify-center rounded-xl transition-all',
                  viewMode === 'all'
                    ? 'bg-emerald-600/30 ring-1 ring-emerald-400/50 text-emerald-300'
                    : 'hover:bg-white/10 text-blue-200/60 group-hover:text-white',
                ].join(' ')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </span>
              <span className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-white/50 group-hover:text-white">
                Tous
              </span>
            </button>
          </nav>

          {/* Bas du Rail : Avatar utilisateur & Réduire/Étendre */}
          <div className="flex flex-col items-center gap-2 pt-2 border-t border-white/10 w-full">
            {/* Avatar avec statut de présence Slack (vert en ligne) */}
            <div
              className="relative cursor-pointer group"
              onMouseEnter={(e) => showTip(e, `${userName} · En ligne`)}
              onMouseLeave={hideTip}
            >
              <img
                src={avatarUrl}
                alt={userName}
                className="w-9 h-9 rounded-xl object-cover ring-2 ring-white/20 group-hover:ring-blue-400 transition-all shadow-md"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0D8ABC&color=fff`;
                }}
              />
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-[#0a0e1c] shadow-sm"
                title="En ligne"
              />
            </div>

            {/* Bouton réduire / étendre le panneau secondaire (PC) */}
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Étendre le volet de navigation' : 'Réduire le volet'}
              title={collapsed ? 'Étendre le panneau (Ctrl+B)' : 'Réduire le panneau (Ctrl+B)'}
              className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 active:scale-95 transition-all outline-none"
            >
              <svg
                className={`h-4 w-4 transition-transform duration-300 ${collapsed ? 'rotate-180 text-blue-300' : 'text-white/60'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            COLONNE 2 : PANNEAU SECONDAIRE DÉTAILLÉ (Menu & Sous-groupes)
        ════════════════════════════════════════════════════════════════ */}
        <div
          className={[
            'flex-1 flex flex-col bg-gradient-to-b from-[#12182c] via-[#0f1426] to-[#0b0e1b] dark:from-gray-900 dark:to-gray-950',
            'transition-[width,opacity] duration-300 ease-in-out',
            collapsed ? 'md:w-0 md:opacity-0 md:overflow-hidden md:pointer-events-none' : 'w-full opacity-100',
          ].join(' ')}
        >
          {/* Header du panneau secondaire */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 h-16 border-b border-white/10 bg-black/20">
            <div className="min-w-0 flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold text-white tracking-tight truncate">
                  ProJA
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-blue-500/20 text-blue-300 ring-1 ring-blue-400/30 uppercase tracking-wider">
                  {viewMode === 'all' ? 'Complet' : currentPoleInfo.tag}
                </span>
              </div>
              <span className="text-[11px] text-blue-100/60 truncate font-medium">
                {viewMode === 'all' ? 'Tous les espaces de travail' : currentPoleInfo.fullTitle}
              </span>
            </div>

            {/* Bouton fermer (mobile) */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer le menu"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white active:scale-90 md:hidden"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation avec groupage soigné */}
          <nav
            onScroll={hideTip}
            className="flex-1 overflow-y-auto px-3 py-3 space-y-4 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.2)_transparent]"
          >
            {visibleSections.map((section, idx) => (
              <div key={section.key} className="space-y-1">
                {/* En-tête de groupe Slack avec puce colorée */}
                <div className="flex items-center justify-between px-2.5 pb-1 pt-1.5 select-none">
                  <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-blue-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400/80" />
                    {section.label}
                  </span>
                  <span className="text-[10px] text-white/30 font-medium">
                    {section.items.length}
                  </span>
                </div>

                {/* Liste des éléments du groupe */}
                <div className="space-y-[3px]">
                  {section.items.map(renderItem)}
                </div>
              </div>
            ))}
          </nav>

          {/* Pied du panneau secondaire */}
          <div
            className="flex-shrink-0 border-t border-white/10 px-4 py-3 bg-black/25 flex items-center justify-between text-[11px] text-white/50"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.75rem)' }}
          >
            <span className="font-medium text-white/60">ProJA v2.3.1</span>
            <span className="text-[10px] text-blue-200/50 bg-white/5 px-2 py-0.5 rounded">
              Ctrl + B
            </span>
          </div>
        </div>
      </aside>

      {/* Infobulle flottante Slack Tooltip */}
      {tip && (
        <div
          role="tooltip"
          className="pointer-events-none fixed z-[70] hidden whitespace-nowrap rounded-lg bg-gray-950 px-3 py-1.5 text-xs font-semibold text-white shadow-2xl ring-1 ring-white/20 md:block animate-in fade-in duration-100"
          style={{ left: tip.left, top: tip.top, transform: 'translateY(-50%)' }}
        >
          {tip.label}
        </div>
      )}
    </>
  );
}

export default React.memo(Sidebar);
