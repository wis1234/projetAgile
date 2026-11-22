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
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0D8ABC&color=fff`;

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
        ? 'text-[#1e3a8a] dark:text-white'
        : 'text-blue-100/70 group-hover:text-white'
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
          MENU LATÉRAL UNIFIÉ — BLEU NATIF PROJA EN DÉGRADÉ SUBTIL
          - Déployé : 288px (18rem / w-72)
          - Replié : 68px (4.25rem / w-[4.25rem])
      ══════════════════════════════════════════════════════════════════ */}
      <aside
        ref={asideRef}
        aria-label="Navigation principale"
        className={[
          'fixed inset-y-0 left-0 z-50 flex flex-col font-sans',
          // Bleu natif ProJA (#1e3a8a) légèrement dégradé vers le bleu nuit (#172554)
          'bg-gradient-to-b from-[#1e3a8a] via-[#1c357f] to-[#172554] text-white',
          'border-r border-white/15 shadow-2xl',
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
            'flex h-16 flex-shrink-0 items-center border-b border-white/15 bg-black/10 backdrop-blur-xs',
            collapsed ? 'justify-center px-2' : 'justify-between px-4',
          ].join(' ')}
        >
          <Link
            href="/dashboard"
            onClick={onClose}
            className="flex items-center gap-3 overflow-hidden rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-white"
            title="ProJA Workspace"
          >
            {/* Logo de l'application */}
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-md p-1 ring-1 ring-white/50">
              <img
                src="https://proja.kemtcenter.org/storage/public/task_comments/images/proja-logo.png"
                alt="Logo ProJA"
                className="h-full w-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>

            {/* Titre & sous-titre (masqués en mode replié) */}
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-bold tracking-tight text-white truncate">
                    ProJA
                  </span>
                  <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold text-blue-100 ring-1 ring-white/20 uppercase tracking-wider">
                    Agile
                  </span>
                </div>
                <span className="text-[11px] font-medium text-blue-100/70 truncate">
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
              className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg text-blue-100/70 hover:text-white hover:bg-white/10 transition-colors"
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
            className="flex md:hidden h-8 w-8 items-center justify-center rounded-lg text-blue-100/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Bouton déplier si en mode replié sur desktop */}
        {collapsed && (
          <div className="hidden md:flex justify-center pt-2 pb-1 border-b border-white/10">
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Agrandir le menu latéral (Ctrl+B)"
              title="Agrandir le menu (Ctrl+B)"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-blue-100/70 hover:text-white hover:bg-white/10 transition-colors"
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
            '[scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.25)_transparent]',
            '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full',
          ].join(' ')}
        >
          {sections.map((section) => (
            <div key={section.key} className="space-y-1">
              {/* Titre de section (masqué en mode replié) */}
              {!collapsed ? (
                <div className="px-2.5 pb-1 pt-1 text-[11px] font-semibold tracking-wider text-blue-200/60 uppercase">
                  {section.label}
                </div>
              ) : (
                <div className="h-px bg-white/10 my-2 mx-1" />
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
                        'group relative flex items-center rounded-xl text-[13.5px] outline-none transition-all duration-150',
                        'focus-visible:ring-2 focus-visible:ring-white',
                        collapsed
                          ? 'h-10 w-10 mx-auto justify-center'
                          : 'h-9 px-3 gap-3 justify-start',
                        active
                          ? 'bg-white text-[#1e3a8a] font-bold shadow-md shadow-black/25 dark:bg-white dark:text-[#1e3a8a]'
                          : 'text-blue-100/85 font-medium hover:bg-white/10 hover:text-white',
                      ].join(' ')}
                    >
                      {/* Indicateur actif discret en mode déployé */}
                      {active && !collapsed && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#1e3a8a]" />
                      )}

                      {/* Icône nette */}
                      {renderIcon(link, active)}

                      {/* Libellé avec police homogène */}
                      {!collapsed && (
                        <span className="truncate tracking-tight flex-1 text-left">
                          {rawLabel}
                        </span>
                      )}

                      {/* Point indicateur actif subtil */}
                      {active && !collapsed && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1e3a8a] flex-shrink-0" />
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
            'flex-shrink-0 border-t border-white/15 p-3 bg-black/15',
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
                className="w-8 h-8 rounded-full object-cover ring-2 ring-white/20"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0D8ABC&color=fff`;
                }}
              />
              <span
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#1e3a8a]"
                title="En ligne"
              />
            </div>

            {/* Informations utilisateur avec typographie cohérente */}
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-semibold text-white truncate">
                  {userName}
                </span>
                <span className="text-[11px] font-medium text-blue-200/70 truncate">
                  {userRole}
                </span>
              </div>
            )}
          </div>

          {/* Raccourci clavier discret */}
          {!collapsed && (
            <kbd
              title="Raccourci pour réduire / agrandir le volet"
              className="hidden lg:inline-block text-[10px] font-medium text-blue-100/70 bg-white/10 px-1.5 py-0.5 rounded border border-white/15"
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
          className="pointer-events-none fixed z-[70] hidden md:block whitespace-nowrap rounded-md bg-[#172554] border border-white/20 px-2.5 py-1 text-xs font-medium text-white shadow-xl animate-in fade-in duration-100"
          style={{ left: tooltip.left, top: tooltip.top, transform: 'translateY(-50%)' }}
        >
          {tooltip.label}
        </div>
      )}
    </>
  );
}

export default React.memo(Sidebar);
