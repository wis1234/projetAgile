import React, { useEffect, useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';

/**
 * Menu latéral ProJA.
 *
 * Largeurs identiques à l'ancienne version (16rem étendu / 4.5rem réduit) : les marges de
 * AdminLayout (md:ml-64 / md:ml-[4.5rem]) et la variable --sidebar-w restent valables.
 *
 * Les liens sont regroupés par rubrique à partir de leur `href`. Un lien absent des groupes
 * (nouvelle page ajoutée plus tard) tombe automatiquement dans « Autres », rien à modifier ici.
 * Une rubrique sans `label` est affichée sans titre (c'est le cas du tableau de bord, en tête).
 */
const GROUPS = [
  { key: 'main', label: null, hrefs: ['/dashboard'] },
  { key: 'workspace', label: 'Espace de travail', hrefs: ['/projects', '/sprints', '/tasks'] },
  { key: 'follow', label: 'Suivi', hrefs: ['/activities', '/kanban', '/quizzes'] },
  { key: 'collab', label: 'Équipe', hrefs: ['/project-users', '/discussions', '/files', '/users'] },
  { key: 'manage', label: 'Gestion', hrefs: ['/recruitment', '/subscription/plans', '/remunerations'] },
  { key: 'admin', label: 'Administration', hrefs: ['/assistant/admin'] },
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

function Sidebar({
  links,
  isLinkActive,
  collapsed,
  onToggleCollapse,
  open,
  onClose,
  t,
}) {
  const sections = useMemo(() => buildSections(links), [links]);
  const [tip, setTip] = useState(null); // infobulle en mode réduit : { label, top }

  // Échap ferme le tiroir mobile
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Plus d'infobulle une fois le menu étendu
  useEffect(() => {
    if (!collapsed) setTip(null);
  }, [collapsed]);

  const showTip = (e, label) => {
    if (!collapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTip({ label, top: rect.top + rect.height / 2 });
  };
  const hideTip = () => setTip(null);

  const renderItem = (link) => {
    const active = isLinkActive(link);
    const label = t(link.label);

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
          'group relative flex h-11 items-center gap-3 rounded-xl px-3.5 text-[15px] font-medium outline-none',
          'transition-colors duration-150 motion-reduce:transition-none',
          'focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-900',
          collapsed ? 'md:mx-auto md:w-11 md:justify-center md:gap-0 md:px-0' : '',
          active
            ? 'bg-white text-blue-700 shadow-md shadow-indigo-950/30 dark:bg-blue-900/50 dark:text-blue-100 dark:shadow-none dark:ring-1 dark:ring-blue-400/30'
            : 'text-white/80 hover:bg-white/10 hover:text-white',
        ].join(' ')}
      >
        <span
          className={`flex h-5 w-5 flex-shrink-0 items-center justify-center [&>svg]:h-5 [&>svg]:w-5 ${
            active ? 'text-blue-600 dark:text-blue-200' : ''
          }`}
        >
          {link.icon}
        </span>
        <span className={`truncate ${collapsed ? 'md:hidden' : ''}`}>{label}</span>
      </Link>
    );
  };

  return (
    <>
      <aside
        aria-label="Navigation principale"
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col text-white shadow-xl',
          // Bleu d'origine de l'application
          'bg-gradient-to-b from-indigo-900 to-blue-800 dark:from-gray-900 dark:to-gray-800',
          'transition-[width,transform] duration-300 ease-out motion-reduce:transition-none',
          'md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'md:w-[4.5rem]' : 'md:w-64',
        ].join(' ')}
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        {/* ── Marque ── */}
        <div className={`flex h-20 flex-shrink-0 items-center justify-between px-5 ${collapsed ? 'md:justify-center md:px-0' : ''}`}>
          <Link href="/dashboard" onClick={onClose} className="flex min-w-0 items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </span>
            <span className={`flex min-w-0 flex-col leading-tight ${collapsed ? 'md:hidden' : ''}`}>
              <span className="truncate text-xl font-bold tracking-tight">ProJA</span>
              <span className="truncate text-xs text-blue-100/70">{t('app_tagline', { defaultValue: 'Gestion de projets' })}</span>
            </span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le menu"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white/70 transition hover:bg-white/10 hover:text-white active:scale-90 md:hidden"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Réduire / étendre (PC) */}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Étendre le menu' : 'Réduire le menu'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Étendre le menu (Ctrl+B)' : 'Réduire le menu (Ctrl+B)'}
          className="absolute -right-3.5 top-7 hidden h-7 w-7 items-center justify-center rounded-full bg-white text-blue-700 shadow-lg ring-1 ring-black/5 outline-none transition hover:scale-110 hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-400 dark:bg-gray-700 dark:text-blue-200 md:flex"
        >
          <svg className={`h-3.5 w-3.5 transition-transform duration-300 motion-reduce:transition-none ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* ── Navigation ── */}
        <nav
          onScroll={hideTip}
          className={`flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${collapsed ? 'md:px-2' : ''}`}
        >
          {sections.map((section, index) => (
            <div key={section.key} className={index === 0 ? 'pt-1' : ''}>
              {index > 0 && (
                <div className={`mx-3 my-3 hidden h-px bg-white/10 ${collapsed ? 'md:block' : ''}`} aria-hidden />
              )}
              {section.label && (
                <p className={`px-3.5 pb-1.5 pt-3 text-xs font-medium text-blue-100/60 ${collapsed ? 'md:hidden' : ''}`}>
                  {t(`nav_group_${section.key}`, { defaultValue: section.label })}
                </p>
              )}
              <div className="space-y-1">{section.items.map(renderItem)}</div>
            </div>
          ))}
        </nav>

        {/* ── Version ── */}
        <div
          className={`flex-shrink-0 border-t border-white/10 p-4 text-center ${collapsed ? 'md:px-1' : ''}`}
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1rem)' }}
        >
          <div className={`font-medium text-white/60 ${collapsed ? 'md:text-[10px]' : 'text-sm'}`}>
            {collapsed ? 'v2.3' : 'ProJA v2.3.1'}
          </div>
        </div>
      </aside>

      {/* Infobulle (mode réduit) : positionnée en fixe pour ne pas être coupée par le défilement du menu */}
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