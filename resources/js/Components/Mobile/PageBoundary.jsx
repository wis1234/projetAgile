import React from 'react';
import { router, usePage } from '@inertiajs/react';

/**
 * Filet de sécurité des pages mobiles.
 *
 * Sans lui, une erreur de rendu dans une page démonte toute l'application : écran blanc, sans
 * message, sans moyen de revenir en arrière. Ici, l'utilisateur voit une carte d'erreur avec
 * « Réessayer » et « Accueil », et le reste de l'application reste utilisable.
 */
class Boundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[MobilePage] rendu impossible :', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    const message = String(this.state.error?.message || this.state.error || '').slice(0, 160);

    return (
      <div className="mobile-app-shell flex min-h-[100dvh] flex-col items-center justify-center overscroll-contain bg-slate-50 px-6 text-center dark:bg-gray-950"
        style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}>
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-100 text-3xl text-amber-600 dark:bg-amber-900/30">!</div>
        <h1 className="mt-5 text-lg font-extrabold text-slate-900 dark:text-white">Cette page n&apos;a pas pu s&apos;afficher</h1>
        <p className="mt-2 max-w-xs text-sm text-slate-500 dark:text-slate-400">
          Un problème est survenu pendant l&apos;affichage. Vos données ne sont pas perdues.
        </p>
        {message && <p className="mt-3 max-w-xs break-words rounded-xl bg-slate-100 px-3 py-2 text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">{message}</p>}
        <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
          <button type="button" onClick={() => this.setState({ error: null })}
            className="h-12 rounded-2xl bg-blue-600 text-sm font-bold text-white active:scale-[.98]">Réessayer</button>
          <button type="button" onClick={() => { this.setState({ error: null }); router.visit('/dashboard'); }}
            className="h-12 rounded-2xl bg-white text-sm font-bold text-slate-700 ring-1 ring-slate-200 active:scale-[.98] dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700">Retour à l&apos;accueil</button>
          <button type="button" onClick={() => window.location.reload()}
            className="h-10 text-xs font-semibold text-slate-400">Recharger l&apos;application</button>
        </div>
      </div>
    );
  }
}

/** Enveloppe un composant de page ; la boundary est réinitialisée à chaque changement d'URL. */
export function withPageBoundary(Component) {
  const Wrapped = (props) => {
    const { url } = usePage();
    return (
      <Boundary key={url}>
        <Component {...props} />
      </Boundary>
    );
  };
  Wrapped.layout = Component.layout; // Inertia lit la propriété statique « layout »
  Wrapped.displayName = `WithPageBoundary(${Component.displayName || Component.name || 'Page'})`;
  return Wrapped;
}

export default Boundary;
