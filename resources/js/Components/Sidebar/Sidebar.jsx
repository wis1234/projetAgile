import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { getRealisticIcon } from './RealisticIcons';

/**
 * Groupes logiques pour un menu latéral pur, élégant et réaliste
 */
const SECTIONS_CONFIG = [
  {
    key: 'pilotage',
    label: 'Pilotage',
    hrefs: ['/dashboard', '/activities'],
  },
  {
    key: 'workspace',
    label: 'Projets & Agilité',
    hrefs: ['/projects', '/sprints', '/tasks', '/kanban', '/files'],
  },
  {
    key: 'team',
    label: 'Collaboration',
    hrefs: ['/discussions', '/announcements', '/project-users', '/users'],
  },
  {
    key: 'management',
    label: 'Gestion & Évaluations',
    hrefs: ['/quizzes', '/recruitment', '/remunerations', '/subscription/plans'],
  },
  {
    key: 'admin',
    label: 'Administration',
    hrefs: ['/assistant/admin'],
  },
];

function Sidebar({ links = [], isLinkActive, collapsed, onToggleCollapse, open, onClose, t = (k) => k }) {
  const { auth } = usePage().props;
  const user = auth?.user || auth;
  const userName = user?.name || 'Utilisateur';
  const userRole = user?.role || (user?.is_admin ? 'Admin' : 'Membre');
  const avatarUrl =
    user?.profile_photo_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=2563EB&color=fff`;

  const [tooltip, setTooltip] = useState(null);
  const asideRef = useRef(null);

  // Fermeture sur Échap (mobile)
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Organisation ordonnée des sections en fonction des liens autorisés/disponibles
  const sections = useMemo(() => {
    const used = new Set();
    const result = SECTIONS_CONFIG.map((group) => {
      const items = group.hrefs
        .map((href) => links.find((l) => l.href === href))
        .filter(Boolean);
      items.forEach((i) => used.add(i.href));
      return {
        key: group.key,
        label: group.label,
        items,
      };
    }).filter((s) => s.items.length > 0);

    // Liens non classifiés
    const rest = links.filter((l) => !used.has(l.href));
    if (rest.length > 0) {
      result.push({
        key: 'other',
        label: 'Autres',
        items: rest,
      });
    }
    return result;
  }, [links]);

  const showTooltip = (e, label) => {
    if (!collapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      label,
      top: rect.top + rect.height / 2,
      left: rect.right + 12,
    });
  };

  const hideTooltip = () => setTooltip(null);

  // Rendu de l'icône : propre, nette et proportionnée
  const renderIcon = (link, active) => {
    const iconClass = `w-5 h-5 flex-shrink-0 transition-colors duration-150 ${
      active
        ? 'text-blue-600 dark:text-blue-400'
        : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-200'
    }`;

    if (link.icon && React.isValidElement(link.icon)) {
      return React.cloneElement(link.icon, {
        className: iconClass,
      });
    }

    return getRealisticIcon(link.href, iconClass);
  };

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════
          MENU LATÉRAL UNIFIÉ — DESIGN PUR ET RÉALISTE (ProJA)
          - Déployé : 288px (18rem / w-72)
          - Replié : 68px (4.25rem / w-[4.25rem])
      ══════════════════════════════════════════════════════════════════ */}
      <aside
        ref={asideRef}
        aria-label="Navigation principale"
        className={[
          'fixed inset-y-0 left-0 z-50 flex flex-col',
          'bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/80',
          'shadow-sm dark:shadow-none',
          'transition-[width,transform] duration-250 ease-in-out motion-reduce:transition-none',
          'md:translate-x-0 select-none',
          open ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'md:w-[4.25rem] w-72' : 'md:w-72 w-80',
        ].join(' ')}
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        {/* ── En-tête : Logo & Workspace ProJA ── */}
        <div
          className={[
            'flex h-16 flex-shrink-0 items-center border-b border-slate-100 dark:border-slate-800/60',
            collapsed ? 'justify-center px-2' : 'justify-between px-4',
          ].join(' ')}
        >
          <Link
            href="/dashboard"
            onClick={onClose}
            className="flex items-center gap-3 overflow-hidden rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            title="ProJA Workspace"
          >
            {/* Logo de l'application */}
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-sm shadow-blue-500/20 text-white font-bold text-base">
              <img
                src="https://proja.kemtcenter.org/storage/public/task_comments/images/proja-logo.png"
                alt="Logo ProJA"
                className="h-7 w-7 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>

            {/* Titre & sous-titre (masqués en mode replié) */}
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-bold tracking-tight text-slate-900 dark:text-white truncate">
                    ProJA
                  </span>
                  <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    Agile
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 truncate">
                  Espace de travail
                </span>
              </div>
            )}
          </Link>

          {/* Bouton de réduction / expansion (desktop) */}
          {!collapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Réduire le menu latéral (Ctrl+B)"
              title="Réduire le menu (Ctrl+B)"
              className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Bouton fermer sur mobile */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le menu"
            className="flex md:hidden h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Bouton déplier si en mode replié sur desktop */}
        {collapsed && (
          <div className="hidden md:flex justify-center pt-2 pb-1 border-b border-slate-100 dark:border-slate-800/40">
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Agrandir le menu latéral (Ctrl+B)"
              title="Agrandir le menu (Ctrl+B)"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* ── Navigation principale avec défilement fluide ── */}
        <nav
          onScroll={hideTooltip}
          className={[
            'flex-1 overflow-y-auto px-3 py-3 space-y-5',
            '[scrollbar-width:thin] [scrollbar-color:rgba(156,163,175,0.3)_transparent]',
          ].join(' ')}
        >
          {sections.map((section) => (
            <div key={section.key} className="space-y-1">
              {/* Titre de section (masqué en mode replié) */}
              {!collapsed ? (
                <div className="px-2.5 pb-1 pt-1 text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-400 uppercase">
                  {section.label}
                </div>
              ) : (
                <div className="h-px bg-slate-100 dark:bg-slate-800/80 my-2 mx-1" />
              )}

              {/* Liens de la section */}
              <div className="space-y-0.5">
                {section.items.map((link) => {
                  const active = isLinkActive(link);
                  const rawLabel = link.label ? t(link.label) : '';

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={onClose}
                      onMouseEnter={(e) => showTooltip(e, rawLabel)}
                      onMouseLeave={hideTooltip}
                      aria-current={active ? 'page' : undefined}
                      aria-label={rawLabel}
                      className={[
                        'group relative flex items-center rounded-xl text-[13.5px] font-medium outline-none transition-all duration-150',
                        'focus-visible:ring-2 focus-visible:ring-blue-500',
                        collapsed
                          ? 'h-10 w-10 mx-auto justify-center'
                          : 'h-9 px-3 gap-3 justify-start',
                        active
                          ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-600/15 dark:text-blue-400 shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white',
                      ].join(' ')}
                    >
                      {/* Indicateur actif discret en mode déployé */}
                      {active && !collapsed && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-blue-600 dark:bg-blue-400" />
                      )}

                      {/* Icône nette */}
                      {renderIcon(link, active)}

                      {/* Libellé */}
                      {!collapsed && (
                        <span className="truncate tracking-tight flex-1 text-left">
                          {rawLabel}
                        </span>
                      )}

                      {/* Point indicateur actif subtil */}
                      {active && !collapsed && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 flex-shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Pied de page : Profil utilisateur et raccourci ── */}
        <div
          className={[
            'flex-shrink-0 border-t border-slate-100 dark:border-slate-800/60 p-3 bg-slate-50/50 dark:bg-slate-900/40',
            collapsed ? 'flex flex-col items-center gap-2' : 'flex items-center justify-between',
          ].join(' ')}
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.75rem)' }}
        >
          <div
            className="flex items-center gap-3 min-w-0"
            onMouseEnter={(e) => showTooltip(e, `${userName} (${userRole})`)}
            onMouseLeave={hideTooltip}
          >
            {/* Avatar avec badge de présence */}
            <div className="relative flex-shrink-0">
              <img
                src={avatarUrl}
                alt={userName}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=2563EB&color=fff`;
                }}
              />
              <span
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"
                title="En ligne"
              />
            </div>

            {/* Informations utilisateur */}
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {userName}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-400 truncate">
                  {userRole}
                </span>
              </div>
            )}
          </div>

          {/* Raccourci clavier discret */}
          {!collapsed && (
            <kbd
              title="Raccourci pour réduire / agrandir le volet"
              className="hidden lg:inline-block text-[10px] font-medium text-slate-400 dark:text-slate-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 shadow-2xs"
            >
              Ctrl+B
            </kbd>
          )}
        </div>
      </aside>

      {/* ── Tooltip flottant haute fidélité (en mode replié) ── */}
      {tooltip && collapsed && (
        <div
          role="tooltip"
          className="pointer-events-none fixed z-[70] hidden md:block whitespace-nowrap rounded-md bg-slate-900 dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-white shadow-lg ring-1 ring-white/10 animate-in fade-in duration-100"
          style={{ left: tooltip.left, top: tooltip.top, transform: 'translateY(-50%)' }}
        >
          {tooltip.label}
        </div>
      )}
    </>
  );
}

export default React.memo(Sidebar);
