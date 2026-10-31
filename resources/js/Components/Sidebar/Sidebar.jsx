import React, { useEffect, useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';

/**
 * Menu latéral ProJA — Style, police & fluidité Slack avec le bleu d'origine ProJA.
 *
 * Fond : Dégradé bleu identitaire ProJA (from-indigo-900 to-blue-800).
 * Ergonomie : Structure d'espace de travail type Slack, fluidité et compacité.
 */
const GROUPS = [
  { key: 'main',      label: null,                hrefs: ['/dashboard'] },
  { key: 'workspace', label: 'Espace de travail', hrefs: ['/projects', '/sprints', '/tasks'] },
  { key: 'follow',    label: 'Suivi',             hrefs: ['/activities', '/kanban', '/quizzes'] },
  { key: 'collab',    label: 'Équipe',            hrefs: ['/project-users', '/discussions', '/files', '/users'] },
  { key: 'manage',    label: 'Gestion',           hrefs: ['/recruitment', '/subscription/plans', '/remunerations'] },
  { key: 'admin',     label: 'Administration',    hrefs: ['/assistant/admin'] },
];

const buildSections = (links) => {
  const used = new Set();
  const sections = GROUPS.map((group) => {
    const items = group.hrefs.map((href) => links.find((l) => l.href === href)).filter(Boolean);
    items.forEach((i) => used.add(i.href));
    return { key: group.key, label: group.label, items };
  }).filter((s) => s.items.length > 0);

  const rest = links.filter((l) => !used.has(l.href));
  if (rest.length > 0) sections.push({ key: 'other', label: 'Autres', items: rest });
  return sections;
};

function Sidebar({ links, isLinkActive, collapsed, onToggleCollapse, open, onClose, t }) {
  const sections = useMemo(() => buildSections(links), [links]);
  const [tip, setTip] = useState(null);

  // Échap ferme le tiroir mobile
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => { if (!collapsed) setTip(null); }, [collapsed]);

  const showTip = (e, label) => {
    if (!collapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTip({ label, top: rect.top + rect.height / 2 });
  };
  const hideTip = () => setTip(null);

  const renderItem = (link) => {
    const active = isLinkActive(link);
    const label  = t(link.label);

    return (
      <Link
        key={link.href}
        href={link.href}
        onClick={onClose}
        aria-current={active ? 'page' : undefined}
        aria-label={label}
        onMouseEnter={(e) => showTip(e, label)}
        onMouseLeave={hideTip}
        onFocus={(e) => showTip(e, label)}
        onBlur={hideTip}
        className={[
          'group relative flex h-9 items-center gap-2.5 rounded-lg px-3 text-[14px] font-medium outline-none',
          'transition-all duration-150 motion-reduce:transition-none',
          'focus-visible:ring-2 focus-visible:ring-white/40',
          collapsed ? 'md:mx-auto md:w-9 md:justify-center md:gap-0 md:px-0' : '',
          active
            ? 'bg-white text-blue-800 font-bold shadow-md shadow-indigo-950/40 dark:bg-blue-900/60 dark:text-blue-100'
            : 'text-white/85 hover:bg-white/15 hover:text-white',
        ].join(' ')}
      >
        <span
          className={`flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center [&>svg]:h-[18px] [&>svg]:w-[18px] ${
            active ? 'text-blue-700 dark:text-blue-200' : 'text-blue-100/80 group-hover:text-white'
          }`}
        >
          {link.icon}
        </span>

        <span className={`truncate tracking-tight ${collapsed ? 'md:hidden' : ''}`}>{label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* ═══════════════ ASIDE (Bleu d'origine ProJA) ═══════════════ */}
      <aside
        aria-label="Navigation principale"
        className={[
          'fixed inset-y-0 left-0 z-50 flex flex-col text-white shadow-xl',
          // Bleu franc d'origine de l'application ProJA
          'bg-gradient-to-b from-indigo-900 to-blue-800 dark:from-gray-900 dark:to-gray-800',
          'transition-[width,transform] duration-300 ease-out motion-reduce:transition-none',
          'md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'md:w-[4.5rem] w-72' : 'md:w-64 w-72',
        ].join(' ')}
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >

        {/* ── Header Workspace Slack aux couleurs ProJA ── */}
        <div
          className={[
            'flex-shrink-0 flex items-center justify-between px-4 border-b border-white/10',
            'bg-black/15',
            collapsed ? 'md:justify-center md:px-0 h-16' : 'h-16',
          ].join(' ')}
        >
          <Link
            href="/dashboard"
            onClick={onClose}
            className={`flex min-w-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${
              collapsed ? 'md:justify-center md:w-full' : ''
            }`}
          >
            {/* Logo avec l'icône ProJA */}
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/20 text-white ring-1 ring-white/25 font-bold text-lg select-none shadow-sm">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </span>
            <span className={`flex min-w-0 flex-col leading-tight ${collapsed ? 'md:hidden' : ''}`}>
              <span className="truncate text-[15px] font-bold text-white tracking-tight">ProJA</span>
              <span className="text-[11px] text-blue-100/70 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20" />
                Gestion de projets
              </span>
            </span>
          </Link>

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

        {/* Bouton réduire / étendre (PC) */}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Étendre le menu' : 'Réduire le menu'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Étendre (Ctrl+B)' : 'Réduire (Ctrl+B)'}
          className="absolute -right-3.5 top-[4.25rem] hidden h-7 w-7 items-center justify-center rounded-full bg-white text-blue-700 shadow-lg ring-1 ring-black/10 outline-none transition hover:scale-110 hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-400 md:flex z-10"
        >
          <svg
            className={`h-3.5 w-3.5 transition-transform duration-300 motion-reduce:transition-none ${collapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* ── Navigation ── */}
        <nav
          onScroll={hideTip}
          className={`flex-1 overflow-y-auto overflow-x-hidden py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
            collapsed ? 'md:px-1.5 px-3' : 'px-3'
          }`}
        >
          {sections.map((section, index) => (
            <div key={section.key} className={index === 0 ? '' : 'mt-2.5'}>
              {/* Séparateur subtil entre sections */}
              {index > 0 && (
                <div
                  className={`mx-2 my-2 h-px bg-white/10 ${collapsed ? 'md:block hidden' : ''}`}
                  aria-hidden
                />
              )}

              {/* Titre de groupe — style Slack majuscules compactes */}
              {section.label && (
                <p
                  className={[
                    'px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-blue-100/60',
                    'select-none',
                    collapsed ? 'md:hidden' : '',
                  ].join(' ')}
                >
                  {t(`nav_group_${section.key}`, { defaultValue: section.label })}
                </p>
              )}

              <div className="space-y-[2px]">{section.items.map(renderItem)}</div>
            </div>
          ))}
        </nav>

        {/* ── Version / pied de sidebar ── */}
        <div
          className={[
            'flex-shrink-0 border-t border-white/10 px-4 py-3',
            'flex items-center gap-2 bg-black/10',
            collapsed ? 'md:justify-center md:px-0' : '',
          ].join(' ')}
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.75rem)' }}
        >
          <span className={`text-[11px] font-medium text-white/60 ${collapsed ? 'md:hidden' : ''}`}>
            ProJA v2.3.1
          </span>
          {collapsed && (
            <span className="hidden md:block text-[10px] font-medium text-white/60">v2.3</span>
          )}
        </div>
      </aside>

      {/* Infobulle (mode réduit) */}
      {collapsed && tip && (
        <div
          role="tooltip"
          className="pointer-events-none fixed z-[70] hidden whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white shadow-xl ring-1 ring-white/10 md:block"
          style={{ left: 'calc(4.5rem + 10px)', top: tip.top, transform: 'translateY(-50%)' }}
        >
          {tip.label}
        </div>
      )}
    </>
  );
}

export default React.memo(Sidebar);
