import React, { Fragment } from 'react';
import { Link, router } from '@inertiajs/react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { FaTimes } from 'react-icons/fa';
import { nativeFeedback } from '@/lib/platform';

/**
 * Kit d'interface « mobile natif » : composants légers, tactiles (zones ≥ 44 px), mode sombre,
 * zones de sécurité (encoche / barre de gestes) et retour haptique.
 */

const tap = () => { try { nativeFeedback.tap?.(); } catch { /* web */ } };

/** Bandeau d'en-tête coloré en tête de page. */
export function MHero({ eyebrow, title, subtitle, tone = 'from-blue-600 to-indigo-700', right, children }) {
  return (
    <section className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${tone} p-5 text-white shadow-lg`}>
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-white/5" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">{eyebrow}</p>}
          <h2 className="mt-1 text-xl font-extrabold leading-tight break-words">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-white/80">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children && <div className="relative mt-4">{children}</div>}
    </section>
  );
}

/** Carte (lien, bouton ou simple bloc). */
export function MCard({ href, onClick, className = '', children, ...rest }) {
  const base = `block w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`;
  if (href) {
    return <Link href={href} onClick={tap} className={`${base} transition active:scale-[.985]`} {...rest}>{children}</Link>;
  }
  if (onClick) {
    return <button type="button" onClick={() => { tap(); onClick(); }} className={`${base} transition active:scale-[.985]`} {...rest}>{children}</button>;
  }
  return <div className={base} {...rest}>{children}</div>;
}

export function MStat({ label, value, tone = 'text-slate-900 dark:text-white' }) {
  return (
    <div className="rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <div className={`text-xl font-black leading-none ${tone}`}>{value}</div>
      <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}

export function MSectionTitle({ children, right }) {
  return (
    <div className="mb-2 mt-1 flex items-center justify-between px-1">
      <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{children}</h3>
      {right}
    </div>
  );
}

export function MPill({ tone = 'slate', children, className = '' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    red: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${tones[tone] || tones.slate} ${className}`}>{children}</span>;
}

export function MEmpty({ icon: Icon, title, text, action }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-8 text-center dark:border-slate-700 dark:bg-slate-900/40">
      {Icon && <Icon className="mx-auto mb-3 text-4xl text-slate-300 dark:text-slate-600" />}
      <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
      {text && <p className="mx-auto mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Onglets « pilules » défilants. options = [{ value, label, count? }] */
export function MSegmented({ options, value, onChange }) {
  return (
    <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => { tap(); onChange(o.value); }}
          className={`flex-shrink-0 rounded-full px-4 py-2 text-xs font-bold transition active:scale-95 ${
            value === o.value
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800'
          }`}
        >
          {o.label}{o.count !== undefined && <span className="ml-1 opacity-70">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function MSearch({ value, onChange, placeholder = 'Rechercher…' }) {
  return (
    <div className="relative">
      <svg className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="m20 20-3.5-3.5" /></svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border-0 bg-white pl-11 pr-4 text-[15px] shadow-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-white dark:ring-slate-800"
      />
    </div>
  );
}

/** Feuille qui monte du bas de l'écran (remplace les modales bureau). */
export function MSheet({ open, onClose, title, children, footer, closeable = true }) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[70]" onClose={() => closeable && onClose?.()}>
        <TransitionChild as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" />
        </TransitionChild>
        <div className="fixed inset-x-0 bottom-0 flex justify-center">
          <TransitionChild as={Fragment} enter="transform transition ease-out duration-300" enterFrom="translate-y-full" enterTo="translate-y-0" leave="transform transition ease-in duration-200" leaveFrom="translate-y-0" leaveTo="translate-y-full">
            <DialogPanel className="flex max-h-[88dvh] w-full max-w-lg flex-col rounded-t-[28px] bg-white shadow-2xl dark:bg-slate-900">
              <div className="mx-auto mt-2.5 h-1.5 w-11 flex-shrink-0 rounded-full bg-slate-300 dark:bg-slate-700" />
              {(title || closeable) && (
                <div className="flex flex-shrink-0 items-center justify-between px-5 pb-2 pt-3">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{title}</h3>
                  {closeable && (
                    <button type="button" onClick={onClose} aria-label="Fermer" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 active:scale-90 dark:bg-slate-800">
                      <FaTimes className="text-sm" />
                    </button>
                  )}
                </div>
              )}
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">{children}</div>
              {footer && (
                <div className="flex-shrink-0 border-t border-slate-100 px-5 pt-3 dark:border-slate-800" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 14px)' }}>
                  {footer}
                </div>
              )}
              {!footer && <div style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />}
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}

/** Barre d'actions collée en bas de l'écran (au-dessus de la barre de navigation si `withNav`). */
export function MActionBar({ children, withNav = false }) {
  return (
    <div
      className="fixed inset-x-0 z-30 px-3"
      style={{ bottom: withNav ? 'calc(5.9rem + var(--safe-bottom))' : 'max(var(--safe-bottom), 8px)' }}
    >
      <div className="mx-auto flex max-w-lg items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 p-2.5 shadow-2xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        {children}
      </div>
    </div>
  );
}

const btnBase = 'inline-flex items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold transition active:scale-95 disabled:opacity-50 disabled:active:scale-100';
const BTN = {
  primary: 'bg-blue-600 text-white shadow-md shadow-blue-600/25',
  success: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25',
  purple: 'bg-purple-600 text-white shadow-md shadow-purple-600/25',
  amber: 'bg-amber-500 text-white shadow-md shadow-amber-500/25',
  danger: 'bg-rose-600 text-white',
  soft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  outline: 'border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-200',
};

export function MButton({ href, onClick, tone = 'primary', size = 'md', className = '', children, ...rest }) {
  const h = size === 'lg' ? 'h-14' : size === 'sm' ? 'h-10' : 'h-12';
  const cls = `${btnBase} ${h} ${BTN[tone] || BTN.primary} ${className}`;
  if (href) return <Link href={href} onClick={tap} className={cls} {...rest}>{children}</Link>;
  return <button type="button" onClick={(e) => { tap(); onClick?.(e); }} className={cls} {...rest}>{children}</button>;
}

/** Téléchargement (Excel / PDF) : lien natif. */
export function MDownload({ href, tone = 'soft', children }) {
  return <a href={href} className={`${btnBase} h-11 ${BTN[tone] || BTN.soft}`}>{children}</a>;
}

export const fmtDate = (iso, opts = { dateStyle: 'medium', timeStyle: 'short' }) => (iso ? new Date(iso).toLocaleString('fr-FR', opts) : '—');

/** Bouton d'action flottant (création rapide), placé au-dessus de la barre de navigation. */
export function MFab({ href, onClick, children, label, tone = 'from-blue-600 to-indigo-600' }) {
  const cls = `fixed right-4 z-30 flex h-14 items-center justify-center gap-2 rounded-full bg-gradient-to-br ${tone} px-5 text-sm font-extrabold text-white shadow-xl shadow-blue-600/40 transition active:scale-90`;
  const style = { bottom: 'calc(6.25rem + var(--safe-bottom))' };
  if (href) return <Link href={href} onClick={tap} aria-label={label} className={cls} style={style}>{children}</Link>;
  return <button type="button" onClick={() => { tap(); onClick?.(); }} aria-label={label} className={cls} style={style}>{children}</button>;
}

/** Route sûre : évite qu'un nom de route inconnu casse toute la page. */
export const safeRoute = (name, params, fallback = '#') => { try { return route(name, params); } catch { return fallback; } };

export const timeAgo = (iso) => {
  if (!iso) return '';
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  if (s < 604800) return `il y a ${Math.floor(s / 86400)} j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

/** Pagination simple (Précédent / Suivant) pour les listes paginées Laravel. */
export function MPager({ paginator, only }) {
  if (!paginator || (!paginator.prev_page_url && !paginator.next_page_url)) return null;
  const go = (url) => url && router.get(url, {}, { preserveState: true, preserveScroll: false, only });
  return (
    <div className="flex items-center justify-between gap-2 pt-2">
      <button type="button" disabled={!paginator.prev_page_url} onClick={() => go(paginator.prev_page_url)} className="h-11 flex-1 rounded-2xl bg-white text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 disabled:opacity-40 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-800">← Précédent</button>
      <span className="text-xs font-bold text-slate-400">{paginator.current_page}/{paginator.last_page}</span>
      <button type="button" disabled={!paginator.next_page_url} onClick={() => go(paginator.next_page_url)} className="h-11 flex-1 rounded-2xl bg-blue-600 text-sm font-bold text-white shadow-md shadow-blue-600/25 disabled:opacity-40">Suivant →</button>
    </div>
  );
}
